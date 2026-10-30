-- 30/10/2026 · agenda_compartir. Ver docs/24 §5 y docs/24b (aprobada por el dueño el 30/10).
-- Solo aditiva: no cambia ningún dato ni las reglas actuales de tareas y agenda.

-- 1. Columnas nuevas (por defecto «no»: lo de ahora y lo nuevo, visible) ---------------
alter table public.tareas add column privada boolean not null default false;
alter table public.agenda add column privada boolean not null default false;
-- En los planes de grupo no se usa «privada» (es de todos); para eso está agenda_ocultas
alter table public.agenda add constraint agenda_privada_solo_yo check (not privada or grupo_id is null);

-- 2. Planes de grupo que cada persona esconde a quien ve su agenda desde fuera --------
create table public.agenda_ocultas (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  agenda_id uuid not null references public.agenda(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, agenda_id)
);
alter table public.agenda_ocultas enable row level security;
revoke all on public.agenda_ocultas from anon, authenticated;
grant select, insert, delete on public.agenda_ocultas to authenticated;
create policy ocultas_ver on public.agenda_ocultas for select to authenticated
  using (user_id = (select auth.uid()));
create policy ocultas_crear on public.agenda_ocultas for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.agenda a where a.id = agenda_id and a.grupo_id is not null and public.es_miembro(a.grupo_id)));
create policy ocultas_quitar on public.agenda_ocultas for delete to authenticated
  using (user_id = (select auth.uid()));

-- 3. Con quién compartes tu agenda y cómo ---------------------------------------------
create table public.agenda_permisos (
  id uuid primary key default gen_random_uuid(),
  dueno uuid not null default auth.uid() references auth.users(id) on delete cascade,
  a_usuario uuid references auth.users(id) on delete cascade,      -- una persona con cuenta…
  a_grupo uuid references public.grupos(id) on delete cascade,      -- …o un grupo entero
  nivel text not null default 'ocupado' check (nivel in ('todo', 'titulos', 'ocupado')),
  planes boolean not null default true,
  tareas boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((a_usuario is null) <> (a_grupo is null)),
  check (a_usuario is distinct from dueno)
);
create unique index agenda_permisos_una_persona on public.agenda_permisos (dueno, a_usuario) where a_usuario is not null;
create unique index agenda_permisos_un_grupo on public.agenda_permisos (dueno, a_grupo) where a_grupo is not null;
create index agenda_permisos_para_persona on public.agenda_permisos (a_usuario) where a_usuario is not null;
create index agenda_permisos_para_grupo on public.agenda_permisos (a_grupo) where a_grupo is not null;

alter table public.agenda_permisos enable row level security;
revoke all on public.agenda_permisos from anon, authenticated;
grant select, insert, update, delete on public.agenda_permisos to authenticated;
-- Solo el dueño ve y toca sus permisos. Quien recibe usa agendas_conmigo().
create policy permisos_ver on public.agenda_permisos for select to authenticated using (dueno = (select auth.uid()));
create policy permisos_crear on public.agenda_permisos for insert to authenticated with check (dueno = (select auth.uid()));
create policy permisos_editar on public.agenda_permisos for update to authenticated
  using (dueno = (select auth.uid())) with check (dueno = (select auth.uid()));
create policy permisos_quitar on public.agenda_permisos for delete to authenticated using (dueno = (select auth.uid()));

create function public.validar_agenda_permiso() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then new.dueno := auth.uid(); end if;
    new.created_at := now();
    if new.a_usuario is not null and not public.son_amigos(new.dueno, new.a_usuario) then
      raise exception 'no_es_amigo';
    end if;
    if new.a_grupo is not null and not exists (
        select 1 from public.grupo_miembros m join public.grupos g on g.id = m.grupo_id
        where m.grupo_id = new.a_grupo and m.user_id = new.dueno and m.baja is null and g.cerrado is null) then
      raise exception 'no_autorizado';
    end if;
  else
    if new.id is distinct from old.id or new.dueno is distinct from old.dueno or new.a_usuario is distinct from old.a_usuario
       or new.a_grupo is distinct from old.a_grupo or new.created_at is distinct from old.created_at then
      raise exception 'no_permitido';   -- para cambiar de persona o grupo: dejar de compartir y volver a compartir
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger validar_agenda_permiso before insert or update on public.agenda_permisos
  for each row execute function public.validar_agenda_permiso();

-- 4. Funciones -------------------------------------------------------------------------
-- Mejor nivel que p_quien tiene sobre la agenda de p_dueno (0 nada, 1 ocupado, 2 títulos, 3 todo).
-- Se comprueba en cada llamada: si alguien sale del grupo o deja de ser amigo, deja de valer.
create function public.agenda_nivel_para(p_dueno uuid, p_quien uuid, p_que text) returns int
language sql stable security definer set search_path to 'public', 'pg_temp' as $$
  select coalesce(max(case p.nivel when 'todo' then 3 when 'titulos' then 2 else 1 end), 0)
  from public.agenda_permisos p
  where p.dueno = p_dueno and p_quien is not null and p_quien <> p_dueno
    and ((p_que = 'plan' and p.planes) or (p_que = 'tarea' and p.tareas))
    and ((p.a_usuario = p_quien and public.son_amigos(p_dueno, p_quien))
      or (p.a_grupo is not null
          and exists (select 1 from public.grupos g where g.id = p.a_grupo and g.cerrado is null)
          and exists (select 1 from public.grupo_miembros m where m.grupo_id = p.a_grupo and m.user_id = p_quien and m.baja is null)
          and exists (select 1 from public.grupo_miembros m where m.grupo_id = p.a_grupo and m.user_id = p_dueno and m.baja is null)));
$$;

-- La agenda de otra persona, ya recortada en el servidor. Nunca devuelve lo privado ni ids reales.
create function public.agenda_de(p_persona uuid, p_desde date, p_hasta date)
returns table (clave text, tipo text, fecha date, fecha_fin date, hora time, titulo text, lugar text, nota text, nivel text)
language plpgsql stable security definer set search_path to 'public', 'pg_temp' as $$
declare
  yo uuid := auth.uid();
  n_plan int; n_tarea int;
begin
  if yo is null then raise exception 'sin_sesion'; end if;
  if p_desde is null or p_hasta is null or p_hasta < p_desde or p_hasta - p_desde > 92 then raise exception 'rango_no_valido'; end if;
  if p_persona is null or p_persona = yo then return; end if;
  n_plan := public.agenda_nivel_para(p_persona, yo, 'plan');
  n_tarea := public.agenda_nivel_para(p_persona, yo, 'tarea');

  if n_plan > 0 then
    -- Planes «Solo yo» de la persona, no privados
    return query
      select md5(a.id::text || yo::text), 'plan'::text, a.fecha, a.fecha_fin, a.hora,
             case when n_plan >= 2 then a.titulo end,
             case when n_plan = 3 then a.lugar end,
             case when n_plan = 3 then a.nota end,
             case n_plan when 3 then 'todo' when 2 then 'titulos' else 'ocupado' end
      from public.agenda a
      where a.grupo_id is null and a.creado_por = p_persona and a.tipo = 'plan'
        and a.borrado is null and not a.privada
        and a.fecha <= p_hasta and coalesce(a.fecha_fin, a.fecha) >= p_desde;
    -- Planes de sus grupos abiertos en los que yo no estoy: solo «Ocupada», nunca el título
    return query
      select md5(a.id::text || yo::text), 'plan'::text, a.fecha, a.fecha_fin, a.hora,
             null::text, null::text, null::text, 'ocupado'::text
      from public.agenda a
      join public.grupos g on g.id = a.grupo_id and g.cerrado is null
      where a.tipo = 'plan' and a.borrado is null
        and a.fecha <= p_hasta and coalesce(a.fecha_fin, a.fecha) >= p_desde
        and exists (select 1 from public.grupo_miembros m where m.grupo_id = a.grupo_id and m.user_id = p_persona and m.baja is null)
        and not exists (select 1 from public.grupo_miembros m where m.grupo_id = a.grupo_id and m.user_id = yo and m.baja is null)
        and not exists (select 1 from public.agenda_ocultas o where o.user_id = p_persona and o.agenda_id = a.id);
  end if;

  if n_tarea >= 2 then
    -- Tareas personales con fecha, sin hacer y no privadas (en «ocupada» no salen: no tienen hora)
    return query
      select md5(t.id::text || yo::text), 'tarea'::text, x.dia, null::date, null::time,
             t.nombre::text, null::text,
             case when n_tarea = 3 then nullif(btrim(t.comentario::text), '') end,
             case n_tarea when 3 then 'todo' else 'titulos' end
      from public.tareas t
      cross join lateral (select t.fecha_limite as dia) x
      where t.user_id = p_persona and not t.privada
        and t.estado is distinct from 'Completado'
        and x.dia between p_desde and p_hasta;
  end if;
end $$;

-- Quién me enseña su agenda y con qué nivel (los nombres los pone la app)
create function public.agendas_conmigo()
returns table (persona uuid, nivel_planes text, nivel_tareas text)
language sql stable security definer set search_path to 'public', 'pg_temp' as $$
  with duenos as (
    select distinct p.dueno from public.agenda_permisos p
    where auth.uid() is not null and p.dueno <> auth.uid()
      and (p.a_usuario = auth.uid() or exists (select 1 from public.grupo_miembros m
           where m.grupo_id = p.a_grupo and m.user_id = auth.uid() and m.baja is null))
  ), n as (
    select d.dueno, public.agenda_nivel_para(d.dueno, auth.uid(), 'plan') as np,
                    public.agenda_nivel_para(d.dueno, auth.uid(), 'tarea') as nt
    from duenos d
  )
  select n.dueno,
         case n.np when 3 then 'todo' when 2 then 'titulos' when 1 then 'ocupado' end,
         case n.nt when 3 then 'todo' when 2 then 'titulos' when 1 then 'ocupado' end
  from n where n.np > 0 or n.nt > 0;
$$;

revoke execute on function public.validar_agenda_permiso(), public.agenda_nivel_para(uuid, uuid, text),
  public.agenda_de(uuid, date, date), public.agendas_conmigo() from public, anon, authenticated;
grant execute on function public.agenda_de(uuid, date, date), public.agendas_conmigo() to authenticated;

-- Sin Realtime para estas tablas, y tareas sigue fuera del tiempo real de otros.
notify pgrst, 'reload schema';

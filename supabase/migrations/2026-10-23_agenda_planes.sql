-- 23/10/2026 · agenda_planes (APLICADA). Ver docs/17-datos-planes-carpetas.md (migración 2), con el autor obligatorio al crear en un grupo y notify.
-- Planes y tareas compartidas (aditiva). No toca la tabla tareas.
create table public.agenda (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references public.grupos(id) on delete cascade,   -- vacío = plan «Solo yo»
  tipo text not null check (tipo in ('plan', 'tarea')),
  titulo text not null check (char_length(btrim(titulo)) between 1 and 120),
  fecha date,
  fecha_fin date,
  hora time,                                -- vacía = todo el día
  lugar text check (char_length(lugar) <= 120),
  nota text check (char_length(nota) <= 1000),
  asignado_a uuid,                          -- miembro o persona sin cuenta; vacío = «quien pueda»
  hecha_en timestamptz,
  hecha_por uuid references auth.users(id) on delete set null,
  creado_por uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  editado_por uuid,
  borrado timestamptz,                      -- nunca se borra de verdad
  check (tipo = 'tarea' or fecha is not null),
  check (tipo = 'plan' or grupo_id is not null),          -- las tareas «Solo yo» siguen en «tareas»
  check (fecha_fin is null or (tipo = 'plan' and fecha_fin >= fecha)),
  check (tipo = 'plan' or (hora is null and fecha_fin is null and lugar is null)),
  check (tipo = 'tarea' or (asignado_a is null and hecha_en is null))
);
create index agenda_grupo on public.agenda (grupo_id, fecha) where borrado is null;
create index agenda_mias on public.agenda (creado_por) where grupo_id is null and borrado is null;

alter table public.agenda enable row level security;
revoke all on public.agenda from anon, authenticated;
grant select, insert, update on public.agenda to authenticated;
create policy agenda_ver on public.agenda for select to authenticated
  using ((grupo_id is null and creado_por = (select auth.uid())) or (grupo_id is not null and public.es_miembro(grupo_id)));
create policy agenda_crear on public.agenda for insert to authenticated
  with check ((grupo_id is null and creado_por = (select auth.uid())) or (grupo_id is not null and public.es_miembro(grupo_id) and creado_por = (select auth.uid())));
create policy agenda_editar on public.agenda for update to authenticated
  using ((grupo_id is null and creado_por = (select auth.uid())) or (grupo_id is not null and public.puede_editar_compartido(grupo_id, creado_por)))
  with check ((grupo_id is null and creado_por = (select auth.uid())) or (grupo_id is not null and public.es_miembro(grupo_id)));

create function public.validar_agenda() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare es_ins boolean; cambia_asig boolean := false; estaba_hecha boolean := false;
begin
  es_ins := (tg_op = 'INSERT');
  if es_ins then
    if auth.uid() is not null then
      new.creado_por := auth.uid(); new.created_at := now(); new.updated_at := now();
      new.editado_por := null; new.borrado := null;
    end if;
    if new.grupo_id is not null and exists (select 1 from public.grupos where id = new.grupo_id and cerrado is not null) then
      raise exception 'grupo_cerrado';
    end if;
    cambia_asig := new.asignado_a is not null;
  else
    if new.id is distinct from old.id or new.grupo_id is distinct from old.grupo_id or new.tipo is distinct from old.tipo
       or new.creado_por is distinct from old.creado_por or new.created_at is distinct from old.created_at then
      raise exception 'no_permitido';
    end if;
    if old.borrado is not null then
      if new.borrado is not null then raise exception 'agenda_borrado'; end if;
      new := old; new.borrado := null;        -- «Deshacer»: vuelve tal cual estaba
    end if;
    new.updated_at := now(); new.editado_por := auth.uid();
    cambia_asig := new.asignado_a is not null and new.asignado_a is distinct from old.asignado_a;
    estaba_hecha := old.hecha_en is not null;
  end if;
  -- quien se encarga tiene que ser del grupo (al ponerlo o cambiarlo; si luego sale, no se rechaza)
  if cambia_asig and not public.es_participante(new.grupo_id, new.asignado_a, true) then
    raise exception 'asignado_no_valido';
  end if;
  -- «Hecha por»: siempre quien la marca
  if new.hecha_en is null then new.hecha_por := null;
  elsif not estaba_hecha then new.hecha_por := auth.uid();
  else new.hecha_por := old.hecha_por;
  end if;
  return new;
end $$;
create trigger validar_agenda before insert or update on public.agenda
  for each row execute function public.validar_agenda();

-- Marcar o desmarcar una tarea del grupo: cualquier miembro, aunque el grupo sea «solo quien lo apuntó»
create function public.agenda_hecha(p_id uuid, p_hecha boolean) returns void
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare a record;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  select * into a from public.agenda where id = p_id for update;
  if not found or a.tipo <> 'tarea' or a.grupo_id is null or not public.es_miembro(a.grupo_id) then raise exception 'no_autorizado'; end if;
  if a.borrado is not null then raise exception 'agenda_borrado'; end if;
  update public.agenda set hecha_en = case when p_hecha then coalesce(a.hecha_en, now()) else null end where id = p_id;
end $$;

revoke execute on function public.validar_agenda(), public.agenda_hecha(uuid, boolean) from public, anon, authenticated;
grant execute on function public.agenda_hecha(uuid, boolean) to authenticated;

alter publication supabase_realtime add table public.agenda;
notify pgrst, 'reload schema';

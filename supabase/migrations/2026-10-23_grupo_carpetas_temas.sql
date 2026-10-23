-- 23/10/2026 · grupo_carpetas_temas (APLICADA). Ver docs/17-datos-planes-carpetas.md (migración 1) y docs/18-datos-forma-temas.md (retoque en carpetas_crear y notify).
-- En la app se llaman «Temas»; en la base de datos, «carpetas».
-- Carpetas en los grupos (aditiva). No cambia ningún dato ni ninguna regla existente.
create table public.grupo_carpetas (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 40),
  icono text not null default 'tag'
    check (icono in ('plane','cart','home','fork','gift','car','ball','film','heart','tag')),
  desde date,
  hasta date,
  cerrada timestamptz,
  creado_por uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  borrado timestamptz,                      -- nunca se borra de verdad
  check (desde is null or hasta is null or hasta >= desde)
);
create unique index grupo_carpetas_nombre on public.grupo_carpetas (grupo_id, lower(btrim(nombre))) where borrado is null;

alter table public.compartidos add column carpeta_id uuid references public.grupo_carpetas(id);  -- vacía en todos los gastos
create index compartidos_carpeta on public.compartidos (carpeta_id) where carpeta_id is not null;

-- Permisos y reglas: solo miembros activos; sin sesión, nada; nadie borra filas
alter table public.grupo_carpetas enable row level security;
revoke all on public.grupo_carpetas from anon, authenticated;
grant select, insert, update on public.grupo_carpetas to authenticated;
create policy carpetas_ver on public.grupo_carpetas for select to authenticated
  using (public.es_miembro(grupo_id));
create policy carpetas_crear on public.grupo_carpetas for insert to authenticated
  with check (public.es_miembro(grupo_id) and creado_por = (select auth.uid()));
create policy carpetas_editar on public.grupo_carpetas for update to authenticated
  using (public.puede_editar_compartido(grupo_id, creado_por)) with check (public.es_miembro(grupo_id));

-- Comprobador de carpetas
create function public.validar_carpeta() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.creado_por := auth.uid(); new.created_at := now(); new.borrado := null; new.cerrada := null;
    end if;
    if exists (select 1 from public.grupos where id = new.grupo_id and cerrado is not null) then raise exception 'grupo_cerrado'; end if;
    if (select count(*) from public.grupo_carpetas where grupo_id = new.grupo_id and borrado is null) >= 30 then
      raise exception 'demasiadas_carpetas';
    end if;
    return new;
  end if;
  if new.id is distinct from old.id or new.grupo_id is distinct from old.grupo_id
     or new.creado_por is distinct from old.creado_por or new.created_at is distinct from old.created_at then
    raise exception 'no_permitido';
  end if;
  if old.borrado is not null then
    if new.borrado is not null then raise exception 'carpeta_borrada'; end if;
    new := old; new.borrado := null;          -- «Deshacer»: vuelve tal cual estaba
  end if;
  return new;
end $$;
create trigger validar_carpeta before insert or update on public.grupo_carpetas
  for each row execute function public.validar_carpeta();

-- Comprobador de la carpeta de un gasto. Aparte de validar_compartido (que NO se toca).
-- Solo se ejecuta si el gasto lleva carpeta: los gastos de hoy no pasan por aquí.
create function public.validar_carpeta_compartido() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare c record; cambia boolean;
begin
  if tg_op = 'INSERT' then cambia := true; else cambia := new.carpeta_id is distinct from old.carpeta_id; end if;
  if new.tipo not in ('Gasto', 'Factura') then
    if cambia then raise exception 'carpeta_no_valida'; end if;
    new.carpeta_id := null;                   -- dejó de ser un gasto: sale de la carpeta
    return new;
  end if;
  if not cambia then return new; end if;      -- carpeta de antes (aunque esté cerrada o borrada): no se rechaza
  select * into c from public.grupo_carpetas where id = new.carpeta_id;
  if not found or c.grupo_id <> new.grupo_id or c.borrado is not null then raise exception 'carpeta_no_valida'; end if;
  return new;
end $$;
create trigger validar_carpeta_compartido before insert or update on public.compartidos
  for each row when (new.carpeta_id is not null) execute function public.validar_carpeta_compartido();

-- Poner o quitar la carpeta de varios gastos (cualquier miembro, aunque el grupo sea «solo quien lo apuntó»).
-- Solo toca carpeta_id. Todo o nada: si un gasto no es de tu grupo, no cambia ninguno.
create function public.poner_carpeta(p_ids uuid[], p_carpeta uuid) returns int
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare c record; r record; n int := 0; v_grupo uuid;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  if p_ids is null or cardinality(p_ids) = 0 then return 0; end if;
  if cardinality(p_ids) > 200 then raise exception 'demasiados'; end if;
  if p_carpeta is not null then
    select * into c from public.grupo_carpetas where id = p_carpeta;
    if not found or not public.es_miembro(c.grupo_id) then raise exception 'no_autorizado'; end if;
    if c.borrado is not null then raise exception 'carpeta_no_valida'; end if;
    v_grupo := c.grupo_id;
  end if;
  for r in select id, grupo_id from public.compartidos
           where id = any(p_ids) and borrado is null and tipo in ('Gasto', 'Factura')
             and carpeta_id is distinct from p_carpeta for update loop
    if not public.es_miembro(r.grupo_id) then raise exception 'no_autorizado'; end if;
    if v_grupo is not null and r.grupo_id <> v_grupo then raise exception 'carpeta_no_valida'; end if;
    update public.compartidos set carpeta_id = p_carpeta where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke execute on function public.validar_carpeta(), public.validar_carpeta_compartido(),
  public.poner_carpeta(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.poner_carpeta(uuid[], uuid) to authenticated;

alter publication supabase_realtime add table public.grupo_carpetas;
notify pgrst, 'reload schema';

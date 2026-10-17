-- Personas sin cuenta en los grupos, administradores y quién puede editar los gastos (17/10/2026).
-- Lo nuevo es aditivo. Se REEMPLAZAN: validar_compartido, saldo_en_grupo, cerrar_grupo y la regla compartidos_editar
-- (copia de lo anterior en copias/2026-10-17_antes_de_personas_sin_cuenta.sql).

-- 1. Tablas y columna nuevas -------------------------------------------------------------
create table public.grupo_invitados (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 40),
  creado_por uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  baja timestamptz,
  reclamado_por uuid references auth.users(id) on delete set null,
  reclamado_en timestamptz,
  historial boolean not null default true  -- al reclamar: ¿sus gastos de antes cuentan en sus números personales?
);
create index grupo_invitados_grupo on public.grupo_invitados (grupo_id);
create unique index grupo_invitados_un_reclamo on public.grupo_invitados (grupo_id, reclamado_por) where reclamado_por is not null;

create table public.invitado_enlaces (
  token text primary key,
  invitado_id uuid not null references public.grupo_invitados(id) on delete cascade,
  creado_por uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expira timestamptz not null default now() + interval '7 days',
  usado_en timestamptz,
  usado_por uuid references auth.users(id) on delete set null
);

-- quién puede editar o borrar los gastos del grupo: todos los miembros, o solo quien lo apuntó (y los administradores)
alter table public.grupos add column edicion text not null default 'todos' check (edicion in ('todos', 'autor'));

alter table public.grupo_invitados enable row level security;
alter table public.invitado_enlaces enable row level security;
revoke all on public.grupo_invitados, public.invitado_enlaces from anon, authenticated;
grant select on public.grupo_invitados to authenticated;
create policy invitados_ver on public.grupo_invitados for select to authenticated
  using (public.es_miembro(grupo_id) or reclamado_por = auth.uid());
-- invitado_enlaces: sin reglas → nadie lo lee directamente; solo a través de las funciones

-- 2. Funciones de ayuda ------------------------------------------------------------------
-- ¿puede aparecer este id (miembro o persona sin cuenta) en un gasto del grupo?
create function public.es_participante(g uuid, p uuid, es_ins boolean) returns boolean
language sql stable security definer set search_path to 'public', 'pg_temp' as $$
  select exists (select 1 from public.grupo_miembros m where m.grupo_id = g and m.user_id = p and (m.baja is null or not es_ins))
      or exists (select 1 from public.grupo_invitados i where i.grupo_id = g and i.id = p
                 and (not es_ins or (i.baja is null and i.reclamado_por is null)));
$$;

-- ¿puede el usuario editar o borrar este gasto del grupo?
create function public.puede_editar_compartido(g uuid, autor uuid) returns boolean
language sql stable security definer set search_path to 'public', 'pg_temp' as $$
  select public.es_miembro(g) and (
    coalesce((select edicion from public.grupos where id = g), 'todos') = 'todos'
    or autor = auth.uid() or public.es_admin(g));
$$;

-- 3. Funciones nuevas --------------------------------------------------------------------
create function public.crear_sin_cuenta(p_grupo uuid, p_nombre text) returns uuid
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare v uuid; g record; n int;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  if not public.es_miembro(p_grupo) then raise exception 'no_autorizado'; end if;
  select * into g from public.grupos where id = p_grupo;
  if g.tipo <> 'grupo' then raise exception 'no_autorizado'; end if;
  select (select count(*) from public.grupo_miembros where grupo_id = p_grupo and baja is null)
       + (select count(*) from public.grupo_invitados where grupo_id = p_grupo and baja is null and reclamado_por is null) into n;
  if n >= 30 then raise exception 'grupo_completo'; end if;
  insert into public.grupo_invitados (grupo_id, nombre) values (p_grupo, btrim(p_nombre)) returning id into v;
  return v;
end $$;

create function public.renombrar_sin_cuenta(p_id uuid, p_nombre text) returns void
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare i record;
begin
  select * into i from public.grupo_invitados where id = p_id;
  if i.id is null or not public.es_miembro(i.grupo_id) then raise exception 'no_autorizado'; end if;
  if i.baja is not null or i.reclamado_por is not null then raise exception 'invitacion_no_valida'; end if;
  update public.grupo_invitados set nombre = btrim(p_nombre) where id = p_id;
end $$;

-- quitar: solo un administrador o quien la añadió, y con sus cuentas a cero (nunca se borra: baja)
create function public.quitar_sin_cuenta(p_id uuid) returns void
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare i record;
begin
  select * into i from public.grupo_invitados where id = p_id for update;
  if i.id is null or not public.es_miembro(i.grupo_id) then raise exception 'no_autorizado'; end if;
  if not (public.es_admin(i.grupo_id) or i.creado_por = auth.uid()) then raise exception 'no_autorizado'; end if;
  if i.baja is not null or i.reclamado_por is not null then raise exception 'invitacion_no_valida'; end if;
  if abs(public.saldo_en_grupo(i.grupo_id, i.id)) > 0.01 then raise exception 'saldo_pendiente'; end if;
  update public.grupo_invitados set baja = now() where id = p_id;
  update public.invitado_enlaces set expira = now() where invitado_id = p_id and usado_en is null;
end $$;

-- enlace personal para que esa persona ocupe su sitio: un solo uso, 7 días, uno vivo por persona
create function public.enlace_sin_cuenta(p_id uuid) returns text
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare i record; t text;
begin
  select * into i from public.grupo_invitados where id = p_id for update;
  if i.id is null or not public.es_miembro(i.grupo_id) then raise exception 'no_autorizado'; end if;
  if i.baja is not null or i.reclamado_por is not null then raise exception 'invitacion_no_valida'; end if;
  update public.invitado_enlaces set expira = now() where invitado_id = p_id and usado_en is null and expira > now();
  t := translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/=', '-_');
  insert into public.invitado_enlaces (token, invitado_id) values (t, p_id);
  return t;
end $$;

create function public.ver_enlace_sin_cuenta(p_token text) returns jsonb
language plpgsql stable security definer set search_path to 'public', 'pg_temp' as $$
declare e record; i record; g record;
begin
  if auth.uid() is null then return jsonb_build_object('valida', false, 'motivo', 'sin_sesion'); end if;
  select * into e from public.invitado_enlaces where token = p_token;
  if e.token is null then return jsonb_build_object('valida', false, 'motivo', 'no_valida'); end if;
  select * into i from public.grupo_invitados where id = e.invitado_id;
  select * into g from public.grupos where id = i.grupo_id;
  if e.usado_en is not null or i.reclamado_por is not null then return jsonb_build_object('valida', false, 'motivo', 'usada'); end if;
  if e.expira < now() or i.baja is not null or g.cerrado is not null then return jsonb_build_object('valida', false, 'motivo', 'caducada'); end if;
  if exists (select 1 from public.grupo_miembros where grupo_id = g.id and user_id = auth.uid() and baja is null) then
    return jsonb_build_object('valida', false, 'motivo', 'ya_miembro', 'grupo', g.id, 'nombre', g.nombre);
  end if;
  return jsonb_build_object('valida', true, 'grupo', g.id, 'nombre_grupo', g.nombre, 'nombre', i.nombre,
    'gastos', (select count(*) from public.compartidos c where c.grupo_id = g.id and c.borrado is null and (c.pagado_por = i.id or c.reparto ? i.id::text)));
end $$;

-- ocupar el sitio: entra como miembro con ese nombre; sus gastos se quedan como están y la app los suma como suyos
create function public.reclamar_sin_cuenta(p_token text, p_historial boolean) returns uuid
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare e record; i record; g record;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  select * into e from public.invitado_enlaces where token = p_token for update;
  if e.token is null or e.usado_en is not null or e.expira < now() then raise exception 'invitacion_no_valida'; end if;
  select * into i from public.grupo_invitados where id = e.invitado_id for update;
  select * into g from public.grupos where id = i.grupo_id;
  if i.baja is not null or i.reclamado_por is not null or g.cerrado is not null or g.tipo <> 'grupo' then raise exception 'invitacion_no_valida'; end if;
  if exists (select 1 from public.grupo_miembros where grupo_id = i.grupo_id and user_id = auth.uid() and baja is null) then
    raise exception 'ya_es_miembro';
  end if;
  insert into public.grupo_miembros (grupo_id, user_id, nombre, rol) values (i.grupo_id, auth.uid(), i.nombre, 'miembro')
    on conflict (grupo_id, user_id) do update set baja = null, nombre = excluded.nombre, rol = 'miembro';
  update public.grupo_invitados set reclamado_por = auth.uid(), reclamado_en = now(), historial = coalesce(p_historial, true) where id = i.id;
  update public.invitado_enlaces set usado_en = now(), usado_por = auth.uid() where token = p_token;
  return i.grupo_id;
end $$;

-- administradores: un administrador puede hacer o dejar de hacer administrador a otro miembro (siempre queda al menos uno)
create function public.cambiar_rol(p_grupo uuid, p_user uuid, p_admin boolean) returns void
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  if not public.es_admin(p_grupo) then raise exception 'no_autorizado'; end if;
  if not exists (select 1 from public.grupo_miembros where grupo_id = p_grupo and user_id = p_user and baja is null) then raise exception 'no_autorizado'; end if;
  if not p_admin and not exists (select 1 from public.grupo_miembros where grupo_id = p_grupo and rol = 'admin' and baja is null and user_id <> p_user) then
    raise exception 'ultimo_admin';
  end if;
  update public.grupo_miembros set rol = case when p_admin then 'admin' else 'miembro' end where grupo_id = p_grupo and user_id = p_user;
end $$;

-- 4. Reemplazos (NO aditivos) ------------------------------------------------------------
-- 4a. Comprobador de gastos compartidos: igual que antes, pero acepta a las personas sin cuenta del grupo
create or replace function public.validar_compartido() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
declare
  k text; v jsonb; total numeric := 0; n int := 0; es_ins boolean; o record;
begin
  es_ins := (tg_op = 'INSERT');
  if es_ins then
    -- dentro de una función security definer current_user es el dueño: se usa la sesión del usuario
    if auth.uid() is not null then
      new.creado_por := auth.uid(); new.created_at := now(); new.updated_at := now();
      new.borrado := null; new.editado_por := null;
    end if;
  else
    if old.borrado is not null then raise exception 'compartido_borrado'; end if;
    if new.id is distinct from old.id or new.grupo_id is distinct from old.grupo_id
       or new.creado_por is distinct from old.creado_por or new.created_at is distinct from old.created_at then
      raise exception 'no_permitido';
    end if;
    new.updated_at := now();
    new.editado_por := auth.uid();
  end if;

  if not public.es_participante(new.grupo_id, new.pagado_por, es_ins) then
    raise exception 'pagador_no_valido';
  end if;

  for k, v in select key, value from jsonb_each(new.reparto) loop
    if k !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'reparto_no_valido'; end if;
    if jsonb_typeof(v) <> 'number' or (v #>> '{}')::numeric < 0 then raise exception 'reparto_no_valido'; end if;
    if not public.es_participante(new.grupo_id, k::uuid, es_ins) then
      raise exception 'reparto_no_valido';
    end if;
    total := total + (v #>> '{}')::numeric;
    n := n + 1;
  end loop;
  if n = 0 or abs(total - new.importe) > 0.01 then raise exception 'reparto_no_cuadra'; end if;
  if new.tipo = 'Liquidación' and (n <> 1 or new.reparto ? new.pagado_por::text) then raise exception 'reparto_no_valido'; end if;

  -- aportaciones a metas y pagos de deudas compartidas: van siempre con su meta/deuda del mismo grupo
  if new.tipo in ('Ahorro', 'Deuda') then
    if new.objetivo_id is null then raise exception 'objetivo_no_valido'; end if;
    select * into o from public.objetivos_compartidos where id = new.objetivo_id;
    if not found or o.grupo_id <> new.grupo_id or o.tipo <> lower(new.tipo)
       or (o.borrado is not null and (es_ins or new.objetivo_id is distinct from old.objetivo_id)) then
      raise exception 'objetivo_no_valido';
    end if;
  elsif new.objetivo_id is not null then
    raise exception 'objetivo_no_valido';
  end if;
  return new;
end $function$;

-- 4b. Saldo de una persona en un grupo: suma también lo de la persona sin cuenta cuyo sitio ocupó
create or replace function public.saldo_en_grupo(p_grupo uuid, p_user uuid) returns numeric
language sql stable security definer set search_path to 'public', 'pg_temp' as $function$
  with ids as (
    select p_user as id
    union select i.id from public.grupo_invitados i where i.grupo_id = p_grupo and i.reclamado_por = p_user)
  select coalesce(sum(case when c.pagado_por in (select id from ids) then c.importe else 0 end), 0)
       - coalesce(sum((select coalesce(sum((c.reparto ->> x.id::text)::numeric), 0) from ids x)), 0)
  from public.compartidos c where c.grupo_id = p_grupo and c.borrado is null;
$function$;

-- 4c. Cerrar el grupo: tampoco si alguien sin cuenta tiene cuentas pendientes
create or replace function public.cerrar_grupo(p_grupo uuid) returns void
language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
begin
  if not public.es_admin(p_grupo) then raise exception 'no_autorizado'; end if;
  if exists (select 1 from public.grupo_miembros m where m.grupo_id = p_grupo and abs(public.saldo_en_grupo(p_grupo, m.user_id)) > 0.01)
     or exists (select 1 from public.grupo_invitados i where i.grupo_id = p_grupo and i.baja is null and i.reclamado_por is null
                and abs(public.saldo_en_grupo(p_grupo, i.id)) > 0.01) then
    raise exception 'saldo_pendiente';
  end if;
  update public.grupos set cerrado = now() where id = p_grupo;
  update public.grupo_invitaciones set expira = now() where grupo_id = p_grupo and usada_en is null;
  update public.invitado_enlaces set expira = now() where usado_en is null and invitado_id in (select id from public.grupo_invitados where grupo_id = p_grupo);
end $function$;

-- 4d. Editar o borrar un gasto del grupo: según el ajuste del grupo (por defecto, todos, como hasta ahora)
drop policy if exists compartidos_editar on public.compartidos;
create policy compartidos_editar on public.compartidos for update
  using (public.puede_editar_compartido(grupo_id, creado_por)) with check (public.es_miembro(grupo_id));

-- 5. Permisos de las funciones -----------------------------------------------------------
revoke execute on function public.es_participante(uuid, uuid, boolean), public.puede_editar_compartido(uuid, uuid),
  public.crear_sin_cuenta(uuid, text), public.renombrar_sin_cuenta(uuid, text), public.quitar_sin_cuenta(uuid),
  public.enlace_sin_cuenta(uuid), public.ver_enlace_sin_cuenta(text), public.reclamar_sin_cuenta(text, boolean),
  public.cambiar_rol(uuid, uuid, boolean) from public, anon;
grant execute on function public.puede_editar_compartido(uuid, uuid),
  public.crear_sin_cuenta(uuid, text), public.renombrar_sin_cuenta(uuid, text), public.quitar_sin_cuenta(uuid),
  public.enlace_sin_cuenta(uuid), public.ver_enlace_sin_cuenta(text), public.reclamar_sin_cuenta(text, boolean),
  public.cambiar_rol(uuid, uuid, boolean) to authenticated;

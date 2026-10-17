-- Copia de lo que se reemplaza en la migración «personas_sin_cuenta» (17/10/2026).
-- Para volver atrás: ejecutar este archivo (y borrar lo nuevo, ver README).

CREATE OR REPLACE FUNCTION public.cerrar_grupo(p_grupo uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not public.es_admin(p_grupo) then raise exception 'no_autorizado'; end if;
  if exists (select 1 from public.grupo_miembros m where m.grupo_id = p_grupo and abs(public.saldo_en_grupo(p_grupo, m.user_id)) > 0.01) then
    raise exception 'saldo_pendiente';
  end if;
  update public.grupos set cerrado = now() where id = p_grupo;
  update public.grupo_invitaciones set expira = now() where grupo_id = p_grupo and usada_en is null;
end $function$
;

CREATE OR REPLACE FUNCTION public.saldo_en_grupo(p_grupo uuid, p_user uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select coalesce(sum(case when pagado_por = p_user then importe else 0 end), 0)
       - coalesce(sum(coalesce((reparto ->> p_user::text)::numeric, 0)), 0)
  from public.compartidos where grupo_id = p_grupo and borrado is null;
$function$
;

CREATE OR REPLACE FUNCTION public.validar_compartido()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  if not exists (select 1 from public.grupo_miembros where grupo_id = new.grupo_id and user_id = new.pagado_por and (baja is null or not es_ins)) then
    raise exception 'pagador_no_valido';
  end if;

  for k, v in select key, value from jsonb_each(new.reparto) loop
    if k !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'reparto_no_valido'; end if;
    if jsonb_typeof(v) <> 'number' or (v #>> '{}')::numeric < 0 then raise exception 'reparto_no_valido'; end if;
    if not exists (select 1 from public.grupo_miembros where grupo_id = new.grupo_id and user_id = k::uuid and (baja is null or not es_ins)) then
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
end $function$
;

-- Regla de edición de gastos compartidos tal como estaba
drop policy if exists compartidos_editar on public.compartidos;
create policy compartidos_editar on public.compartidos for update using (es_miembro(grupo_id)) with check (es_miembro(grupo_id));

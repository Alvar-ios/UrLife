-- Comprobada el 30/10/2026 contra la base real: las líneas clave coinciden (md5 de pg_get_functiondef real: 404def8ac9946f3bda63d46469e9cd56).
-- Copia de seguridad de public.validar_compartido() ANTES de la migración 2026-10-30_historial_compartidos.sql.
-- Para volver atrás: ejecutar este archivo entero. Deja la función exactamente como estaba (sin «Recuperar»).
--
-- OJO: esta copia sale del repositorio (2026-10-17_personas_sin_cuenta.sql, punto 4a), que es la última versión
-- conocida. Antes de aplicar la migración hay que comparar con la de la base real:
--   select pg_get_functiondef('public.validar_compartido()'::regprocedure);
-- Si no es idéntica (salvo espacios), sustituir el cuerpo de abajo por lo que devuelva esa consulta.

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
end $function$
;

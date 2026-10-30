-- 30/10/2026 · historial_compartidos — PROPUESTA, NO APLICADA. Ver docs/27-historial-grupo.md §5 y §6 (tandas 1 y 2).
-- Decisiones del dueño (30/10): recupera quien pueda cambiar gastos del grupo; el historial dura 6 meses;
-- Inicio solo avisa de borrados y cambios de otros que te toquen (eso se filtra en la app).
--
-- Partes:
--   A (tanda 1, aditiva): tabla compartidos_historial, disparador que la rellena, lecturas historial_grupo / historial_nuevos,
--     limpieza de lo de más de 6 meses.
--   B (tanda 2, NO aditiva): reemplaza validar_compartido (solo el bloque «si estaba borrado») y añade recuperar_compartido.
--     Copia de lo que reemplaza: copias/validar_compartido_2026-10-30.sql.
--   C (opcional, a decidir): rellenar el historial con los gastos ya borrados. Comentada.
--   D (opcional): limpieza automática con pg_cron. Comentada.
-- Se puede aplicar A sola (tanda 1) y B más tarde. Cada parte cabe en una llamada del conector.
--
-- ANTES DE APLICAR (todo solo lee):
--   1. select pg_get_functiondef('public.validar_compartido()'::regprocedure);      -- igual que la copia
--   2. select pg_get_functiondef('public.es_miembro(uuid)'::regprocedure);          -- exige baja is null y grupo abierto
--   3. select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.compartidos'::regclass and not tgisinternal;
--   4. select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name='compartidos';
--   5. select policyname, cmd, roles, qual, with_check from pg_policies where tablename = 'compartidos';
--   6. select extname from pg_extension where extname = 'pg_cron';
--
-- CÓMO SE DESHACE (no toca ningún gasto; los que se hayan recuperado siguen como gastos normales):
--   drop trigger if exists historial_compartido on public.compartidos;
--   drop function if exists public.recuperar_compartido(uuid), public.historial_grupo(uuid, timestamptz, int, bigint),
--     public.historial_nuevos(timestamptz), public.limpiar_historial_compartidos(), public.registrar_historial_compartido();
--   drop table if exists public.compartidos_historial;
--   -- y si se aplicó la parte B: ejecutar copias/validar_compartido_2026-10-30.sql
--   -- y si se aplicó la parte D: select cron.unschedule('limpiar-historial-compartidos');


-- ======================================================================================
-- PARTE A · Tanda 1 (aditiva)
-- ======================================================================================

-- A1. Tabla: una fila por cambio. Solo la escribe el disparador (servidor); los miembros activos la leen.
create table public.compartidos_historial (
  id bigint generated always as identity primary key,
  compartido_id uuid not null references public.compartidos(id) on delete cascade,
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  accion text not null check (accion in ('creado', 'editado', 'borrado', 'recuperado')),
  hecho_por uuid references auth.users(id) on delete set null,   -- vacío = lo hizo el sistema, no una persona
  hecho_en timestamptz not null default now(),                    -- hora del servidor (igual para todo un lote)
  antes jsonb,                                                    -- solo los campos que cambiaron
  despues jsonb
);
create index compartidos_historial_grupo on public.compartidos_historial (grupo_id, hecho_en desc, id desc);
create index compartidos_historial_gasto on public.compartidos_historial (compartido_id, hecho_en desc);

alter table public.compartidos_historial enable row level security;
revoke all on public.compartidos_historial from public, anon, authenticated;
grant select on public.compartidos_historial to authenticated;
create policy historial_ver on public.compartidos_historial for select to authenticated
  using (public.es_miembro(grupo_id) and hecho_en > now() - interval '6 months');
-- Sin reglas de INSERT/UPDATE/DELETE: nadie con sesión puede escribir ni borrar filas.

-- A2. Disparador: después de guardar un gasto compartido, apunta qué cambió.
-- Vigila: fecha, tipo, categoria, subcategoria, descripcion, importe, pagado_por, reparto, objetivo_id, carpeta_id.
-- De articulos solo apunta que «cambiaron». Si no cambia nada de eso (y no es borrar ni recuperar), no escribe nada.
create function public.registrar_historial_compartido() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare
  campos constant text[] := array['fecha', 'tipo', 'categoria', 'subcategoria', 'descripcion', 'importe',
                                  'pagado_por', 'reparto', 'objetivo_id', 'carpeta_id'];
  k text; o jsonb; n jsonb; a jsonb := '{}'; d jsonb := '{}'; v_accion text;
begin
  n := to_jsonb(new);
  if tg_op = 'INSERT' then
    v_accion := 'creado';
    foreach k in array campos loop
      if jsonb_typeof(n -> k) is not null and jsonb_typeof(n -> k) <> 'null' then d := d || jsonb_build_object(k, n -> k); end if;
    end loop;
    if (n -> 'articulos') is not null and jsonb_typeof(n -> 'articulos') <> 'null' then d := d || '{"articulos": "cambiaron"}'; end if;
  else
    o := to_jsonb(old);
    foreach k in array campos loop
      if (o -> k) is distinct from (n -> k) then
        a := a || jsonb_build_object(k, o -> k);
        d := d || jsonb_build_object(k, n -> k);
      end if;
    end loop;
    if (o -> 'articulos') is distinct from (n -> 'articulos') then d := d || '{"articulos": "cambiaron"}'; end if;
    if old.borrado is null and new.borrado is not null then v_accion := 'borrado';
    elsif old.borrado is not null and new.borrado is null then v_accion := 'recuperado';
    elsif d = '{}'::jsonb then return null;            -- nada que contar
    else v_accion := 'editado';
    end if;
  end if;
  insert into public.compartidos_historial (compartido_id, grupo_id, accion, hecho_por, antes, despues)
  values (new.id, new.grupo_id, v_accion, auth.uid(), nullif(a, '{}'::jsonb), nullif(d, '{}'::jsonb));
  return null;
end $$;
create trigger historial_compartido after insert or update on public.compartidos
  for each row execute function public.registrar_historial_compartido();

-- A3. Lectura para la app: historial de un grupo (o de todos tus grupos si p_grupo es null), de más nuevo a más viejo.
-- Paginación: pasar hecho_en e id de la última fila recibida (p_antes_de, p_antes_id). Máximo 200 por llamada.
-- Devuelve también cómo está hoy el gasto (para «Bea borró «Taxi» · 48,00 €»), si tú puedes recuperarlo
-- y un mapa id → nombre del grupo (miembros, también los que salieron; personas sin cuenta; si alguien ocupó
-- el sitio de una persona sin cuenta, sale el nombre de quien lo ocupó).
create function public.historial_grupo(p_grupo uuid default null, p_antes_de timestamptz default null,
                                       p_limite int default 50, p_antes_id bigint default null)
returns table (id bigint, grupo_id uuid, compartido_id uuid, accion text, hecho_por uuid, hecho_por_nombre text,
               hecho_en timestamptz, antes jsonb, despues jsonb, descripcion text, tipo text, importe numeric,
               pagado_por uuid, reparto jsonb, borrado timestamptz, puede_recuperar boolean, nombres jsonb)
language plpgsql stable security definer set search_path to 'public', 'pg_temp' as $$
#variable_conflict use_column
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  if p_grupo is not null and not public.es_miembro(p_grupo) then raise exception 'no_autorizado'; end if;
  return query
  with mis as (
    select m.grupo_id as gid from public.grupo_miembros m
    where m.user_id = auth.uid() and m.baja is null and (p_grupo is null or m.grupo_id = p_grupo)
      and public.es_miembro(m.grupo_id)
  ), hh as (
    select x.* from public.compartidos_historial x join mis on mis.gid = x.grupo_id
    where x.hecho_en > now() - interval '6 months'
      and (p_antes_de is null or (x.hecho_en, x.id) < (p_antes_de, coalesce(p_antes_id, 9223372036854775807)))
    order by x.hecho_en desc, x.id desc
    limit least(greatest(coalesce(p_limite, 50), 1), 200)
  ), nom as (
    select z.gid, jsonb_object_agg(z.pid::text, z.nombre) as mapa from (
      select m.grupo_id as gid, m.user_id as pid, m.nombre from public.grupo_miembros m where m.grupo_id in (select gid from mis)
      union all
      select i.grupo_id, i.id, coalesce(mr.nombre, i.nombre) from public.grupo_invitados i
        left join public.grupo_miembros mr on mr.grupo_id = i.grupo_id and mr.user_id = i.reclamado_por
        where i.grupo_id in (select gid from mis)
    ) z group by z.gid
  )
  select hh.id, hh.grupo_id, hh.compartido_id, hh.accion, hh.hecho_por, hm.nombre, hh.hecho_en, hh.antes, hh.despues,
         c.descripcion, c.tipo, c.importe, c.pagado_por, c.reparto, c.borrado,
         (hh.accion = 'borrado' and c.borrado is not null and c.borrado > now() - interval '6 months'
          and public.puede_editar_compartido(c.grupo_id, c.creado_por)),
         nom.mapa
  from hh
  join public.compartidos c on c.id = hh.compartido_id
  left join nom on nom.gid = hh.grupo_id
  left join public.grupo_miembros hm on hm.grupo_id = hh.grupo_id and hm.user_id = hh.hecho_por
  order by hh.hecho_en desc, hh.id desc;
end $$;

-- A4. «N nuevos»: cuántos cambios han hecho OTRAS personas en cada uno de tus grupos desde una fecha (vistoJuntos).
create function public.historial_nuevos(p_desde timestamptz)
returns table (grupo_id uuid, nuevos int)
language plpgsql stable security definer set search_path to 'public', 'pg_temp' as $$
#variable_conflict use_column
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  return query
  select x.grupo_id, count(*)::int from public.compartidos_historial x
  where x.hecho_en > greatest(coalesce(p_desde, '-infinity'::timestamptz), now() - interval '6 months')
    and x.hecho_por is distinct from auth.uid()
    and x.grupo_id in (select m.grupo_id from public.grupo_miembros m where m.user_id = auth.uid() and m.baja is null)
    and public.es_miembro(x.grupo_id)
  group by x.grupo_id;
end $$;

-- A5. Limpieza: borra SOLO filas del historial de más de 6 meses. No toca ningún gasto.
-- Aunque no se ejecute, la app no ve nada de más de 6 meses (lo filtran la regla y las funciones de lectura).
create function public.limpiar_historial_compartidos() returns int
language sql security definer set search_path to 'public', 'pg_temp' as $$
  with b as (delete from public.compartidos_historial where hecho_en < now() - interval '6 months' returning 1)
  select count(*)::int from b;
$$;

revoke execute on function public.registrar_historial_compartido(), public.limpiar_historial_compartidos(),
  public.historial_grupo(uuid, timestamptz, int, bigint), public.historial_nuevos(timestamptz)
  from public, anon, authenticated;
grant execute on function public.historial_grupo(uuid, timestamptz, int, bigint), public.historial_nuevos(timestamptz)
  to authenticated;
-- Sin Realtime: el canal de «compartidos» ya avisa y la app vuelve a pedir el historial.
notify pgrst, 'reload schema';


-- ======================================================================================
-- PARTE B · Tanda 2 (NO aditiva: reemplaza validar_compartido). Copia en copias/validar_compartido_2026-10-30.sql
-- Únicos cambios: el bloque «if old.borrado is not null» y que la fecha de borrado la ponga el servidor
-- (hoy la manda el móvil, y con el reloj mal se podría saltar el plazo). Todo lo demás es idéntico a la copia.
-- ======================================================================================

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
    -- 30/10 «Recuperar»: un gasto borrado no se puede cambiar; solo quitarle la marca, y vuelve tal cual estaba.
    -- (Antes: if old.borrado is not null then raise exception 'compartido_borrado'; end if;)
    if old.borrado is not null then
      if new.borrado is not null then raise exception 'compartido_borrado'; end if;
      if old.borrado < now() - interval '6 months' then raise exception 'plazo_pasado'; end if;
      new := old; new.borrado := null;
    elsif new.borrado is not null then
      new.borrado := now();      -- 30/10: la fecha de borrado la pone el servidor (el plazo de 6 meses cuenta desde aquí)
    end if;
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

-- B2. Recuperar un gasto borrado (el mismo gasto, mismo id). Comprueba todo y da un error claro:
--   sin_sesion · no_autorizado (no existe, no eres miembro activo o no puedes cambiar gastos en ese grupo)
--   grupo_cerrado · no_borrado (ya estaba) · plazo_pasado (borrado hace más de 6 meses)
-- La regla compartidos_editar y validar_compartido vuelven a comprobar lo mismo si alguien lo intenta sin esta función.
create function public.recuperar_compartido(p_id uuid) returns void
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare c record;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  select * into c from public.compartidos where id = p_id for update;
  if not found then raise exception 'no_autorizado'; end if;
  if not exists (select 1 from public.grupo_miembros m where m.grupo_id = c.grupo_id and m.user_id = auth.uid() and m.baja is null) then
    raise exception 'no_autorizado';
  end if;
  if exists (select 1 from public.grupos g where g.id = c.grupo_id and g.cerrado is not null) then raise exception 'grupo_cerrado'; end if;
  if not public.puede_editar_compartido(c.grupo_id, c.creado_por) then raise exception 'no_autorizado'; end if;
  if c.borrado is null then raise exception 'no_borrado'; end if;
  if c.borrado < now() - interval '6 months' then raise exception 'plazo_pasado'; end if;
  update public.compartidos set borrado = null where id = p_id;
end $$;

revoke execute on function public.recuperar_compartido(uuid) from public, anon, authenticated;
grant execute on function public.recuperar_compartido(uuid) to authenticated;
notify pgrst, 'reload schema';


-- ======================================================================================
-- PARTE C · Opcional (decide el dueño): historial de lo que ya estaba borrado antes de esta migración.
-- Solo INSERTA en la tabla nueva; no toca ningún gasto. Quién = editado_por (lo pone el servidor en cada cambio,
-- también al borrar); cuándo = borrado. Sin esto, lo borrado antes de hoy no sale en el historial ni se puede recuperar
-- desde la app (aunque siga guardado). Ejecutar justo después de la parte A, una sola vez.
-- ======================================================================================
-- insert into public.compartidos_historial (compartido_id, grupo_id, accion, hecho_por, hecho_en)
-- select c.id, c.grupo_id, 'borrado', c.editado_por, c.borrado
-- from public.compartidos c
-- where c.borrado is not null and c.borrado > now() - interval '6 months'
--   and not exists (select 1 from public.compartidos_historial h where h.compartido_id = c.id);
-- -- (hecho_por: si editado_por ya no existe en auth.users fallaría la clave; en ese caso usar
-- --  case when exists (select 1 from auth.users u where u.id = c.editado_por) then c.editado_por end)


-- ======================================================================================
-- PARTE D · Opcional: limpieza automática una vez por semana (lunes 03:15 UTC). Necesita la extensión pg_cron
-- (Supabase → Integrations → Cron). Sin ella no pasa nada grave: la app ya no ve lo de más de 6 meses;
-- solo se quedan guardadas filas viejas del historial hasta que alguien ejecute la limpieza.
-- ======================================================================================
-- select cron.schedule('limpiar-historial-compartidos', '15 3 * * 1', $$select public.limpiar_historial_compartidos()$$);

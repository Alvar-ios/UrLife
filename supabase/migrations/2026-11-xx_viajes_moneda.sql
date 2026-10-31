-- 2026-11-xx · viajes_moneda (docs/29 §4, tandas 1 y 2). PROPUESTA de Datos y Seguridad del 31/10/2026. NO APLICADA.
-- Solo se aplica con el «sí» del dueño, desde el chat, y cada tanda por separado (el ROADMAP pide una semana de uso
-- entre cambios de base de datos: el historial se publicó el 30/10).
--
--   Tanda 1 (aditiva): columnas vacías en compartidos, grupos y grupo_carpetas + una regla que comprueba que la
--     moneda cuadra con el importe en euros. No cambia ningún gasto, ni validar_compartido, ni validar_carpeta.
--   Tanda 2 (NO aditiva): reemplaza registrar_historial_compartido para que apunte también la moneda.
--     Copia de lo que reemplaza: copias/registrar_historial_compartido_2026-10-30.sql.
--
-- Importes y repartos SIGUEN EN EUROS. Lo nuevo es solo «el recuerdo»: 120,00 $ al 1,0811.
--
-- ======================================================================================
-- ANTES DE APLICAR (todo solo lee). Guardar los resultados para comparar después.
-- ======================================================================================
-- P1. Que no existan ya columnas con estos nombres, y tipo de «importe»:
--   select table_name, column_name, data_type from information_schema.columns
--   where table_schema = 'public' and table_name in ('compartidos', 'grupos', 'grupo_carpetas')
--     and column_name in ('moneda', 'moneda_original', 'importe_original', 'cambio', 'cambio_fecha', 'cambio_origen', 'importe');
-- P2. ¿Permisos por columna? Si aquí salen filas de UPDATE/INSERT para authenticated, las columnas nuevas NO se podrán
--     escribir desde la app hasta darles permiso (ver T1.5, comentado):
--   select table_name, column_name, privilege_type from information_schema.column_privileges
--   where table_schema = 'public' and grantee = 'authenticated' and table_name in ('compartidos', 'grupos', 'grupo_carpetas')
--     and privilege_type in ('INSERT', 'UPDATE') order by 1, 3, 2;
--   select table_name, privilege_type from information_schema.role_table_grants
--   where table_schema = 'public' and grantee = 'authenticated' and table_name in ('compartidos', 'grupos', 'grupo_carpetas');
-- P3. Quién puede cambiar «grupos» (esperado: UPDATE solo administradores, como el reparto habitual):
--   select policyname, cmd, roles, qual, with_check from pg_policies where tablename = 'grupos';
-- P4. Disparadores de «grupos» y su código (grupos_columnas_protegidas: comprobar que no rechaza columnas que no conoce):
--   select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.grupos'::regclass and not tgisinternal;
--   -- y para cada función que salga: select pg_get_functiondef('public.<nombre>()'::regprocedure);
-- P5. validar_carpeta sigue como en 2026-10-23_grupo_carpetas_temas.sql (no filtra columnas: deja pasar «moneda»):
--   select pg_get_functiondef('public.validar_carpeta()'::regprocedure);
--   select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid in ('public.compartidos'::regclass, 'public.grupo_carpetas'::regclass) and not tgisinternal;
-- P6. (solo tanda 2) La función real es igual que la copia. Esperado: 4676c9d955c86a150369ad21212a146e
--   select md5(prosrc) from pg_proc where oid = 'public.registrar_historial_compartido()'::regprocedure;
-- P7. Tabla «divisas» (la usa la acción «cambio» de activos-api): quién puede leerla/escribirla y qué monedas tiene.
--     Esperado: RLS activo y sin INSERT/UPDATE/DELETE para anon ni authenticated (solo la función, con su clave de servicio).
--   select relrowsecurity from pg_class where oid = 'public.divisas'::regclass;
--   select policyname, cmd, roles, qual from pg_policies where tablename = 'divisas';
--   select grantee, privilege_type from information_schema.role_table_grants where table_schema = 'public' and table_name = 'divisas' and grantee in ('anon', 'authenticated');
--   select moneda, count(*), min(fecha), max(fecha) from public.divisas group by moneda order by moneda;
-- P8. Recuento para comparar después (no enseña ningún dato de nadie):
--   select (select count(*) from public.compartidos) as gastos, (select count(*) from public.compartidos where borrado is null) as vivos,
--          (select count(*) from public.grupos) as grupos, (select count(*) from public.grupo_carpetas) as temas,
--          (select count(*) from public.compartidos_historial) as historial;
--
-- ======================================================================================
-- CÓMO SE DESHACE
-- ======================================================================================
-- Tanda 2: ejecutar copias/registrar_historial_compartido_2026-10-30.sql (las filas del historial ya escritas se quedan;
--   las que traen moneda simplemente la llevan dentro de «antes»/«despues»).
-- Tanda 1: si aún no hay ningún gasto con moneda, se quita sin perder nada:
--   alter table public.compartidos drop constraint if exists compartidos_moneda_cuadra;
--   alter table public.compartidos drop column if exists moneda_original, drop column if exists importe_original,
--     drop column if exists cambio, drop column if exists cambio_fecha, drop column if exists cambio_origen;
--   alter table public.grupos drop column if exists moneda;
--   alter table public.grupo_carpetas drop column if exists moneda;
--   notify pgrst, 'reload schema';
--   ¡ANTES de quitar las columnas, quitar la moneda de la app (data-layer.js) y publicar! Si no, guardar gastos falla.
--   Si ya hay gastos con moneda, antes copiar el recuerdo (los euros no se pierden nunca):
--   create table public.backup_compartidos_moneda as select id, moneda_original, importe_original, cambio, cambio_fecha, cambio_origen
--     from public.compartidos where moneda_original is not null;


-- ======================================================================================
-- TANDA 1 (aditiva)
-- ======================================================================================

-- T1.1 Columnas vacías en los gastos compartidos. Vacías = el gasto se hizo en euros (todos los de hoy).
alter table public.compartidos
  add column moneda_original text,        -- «USD» (3 letras)
  add column importe_original numeric,    -- 120.00 en esa moneda
  add column cambio numeric,              -- unidades de esa moneda por 1 € (como el BCE: 1.0811). Guardar SIN redondear si viene de «Te cobraron»
  add column cambio_fecha date,           -- día del cambio del BCE (para «BCE 30/10»)
  add column cambio_origen text;          -- 'bce' | 'mano' | 'banco'

-- T1.2 La regla: o todo vacío (euros), o todo coherente. Es un «check» de la tabla: no se puede saltar desde la app,
-- no toca validar_compartido y vale también para los pagos («Liquidación»). Los gastos de hoy la cumplen (todo vacío).
--   · las tres primeras van juntas; fecha y origen solo si hay moneda
--   · moneda de 3 letras mayúsculas y distinta de EUR
--   · importe original y cambio mayores que 0 y con límites sensatos; como mucho 3 decimales en el original
--   · importe_original / cambio = importe (en euros) con 1 céntimo de margen
alter table public.compartidos add constraint compartidos_moneda_cuadra check (
  (moneda_original is null and importe_original is null and cambio is null and cambio_fecha is null and cambio_origen is null)
  or (
    -- «is not null» explícito: en un check, una comparación con un vacío daría «desconocido» y la regla lo dejaría pasar
    moneda_original is not null and importe_original is not null and cambio is not null and importe is not null
    and moneda_original ~ '^[A-Z]{3}$' and moneda_original <> 'EUR'
    and importe_original > 0 and importe_original < 1000000000 and importe_original = round(importe_original, 3)
    and cambio >= 0.000001 and cambio <= 1000000
    and abs(importe_original / nullif(cambio, 0) - importe) <= 0.01
    and (cambio_origen is null or cambio_origen in ('bce', 'mano', 'banco'))
  )
);

-- T1.3 Moneda del viaje de un grupo (vacía = euros). Quién la cambia: los mismos que hoy pueden cambiar el grupo
-- (según P3, los administradores), sin regla nueva.
alter table public.grupos add column moneda text check (moneda ~ '^[A-Z]{3}$');

-- T1.4 Moneda del viaje de un tema (vacía = la del grupo, o euros). Se permite 'EUR' para que un tema en euros
-- dentro de un grupo en otra moneda se pueda marcar. Quién la cambia: la regla carpetas_editar de hoy
-- (puede_editar_compartido). validar_carpeta no filtra columnas: la deja pasar y «Deshacer» la recupera igual.
alter table public.grupo_carpetas add column moneda text check (moneda ~ '^[A-Z]{3}$');

-- T1.5 SOLO si P2 mostró permisos por columna (si no, no hace falta y no se ejecuta):
-- grant insert (moneda_original, importe_original, cambio, cambio_fecha, cambio_origen),
--       update (moneda_original, importe_original, cambio, cambio_fecha, cambio_origen) on public.compartidos to authenticated;
-- grant update (moneda) on public.grupos to authenticated;          -- y la regla de P3 sigue decidiendo quién
-- grant insert (moneda), update (moneda) on public.grupo_carpetas to authenticated;

notify pgrst, 'reload schema';

-- DESPUÉS (solo lee): repetir P8 (mismos números) y comprobar que todo está vacío:
--   select count(*) filter (where moneda_original is not null) as con_moneda from public.compartidos;   -- 0
--   select count(*) filter (where moneda is not null) from public.grupos;                              -- 0
--   select count(*) filter (where moneda is not null) from public.grupo_carpetas;                      -- 0
--   y revisar los avisos de seguridad de Supabase (no debe salir nada nuevo).


-- ======================================================================================
-- TANDA 2 (NO aditiva). Hacer P6 antes. Único cambio frente a la copia: 4 nombres más en «campos».
-- ======================================================================================
create or replace function public.registrar_historial_compartido() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare
  campos constant text[] := array['fecha', 'tipo', 'categoria', 'subcategoria', 'descripcion', 'importe',
                                  'pagado_por', 'reparto', 'objetivo_id', 'carpeta_id',
                                  'moneda_original', 'importe_original', 'cambio', 'cambio_origen'];  -- 2026-11: moneda
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
revoke execute on function public.registrar_historial_compartido() from public, anon, authenticated;
-- DESPUÉS: select md5(prosrc) from pg_proc where oid = 'public.registrar_historial_compartido()'::regprocedure;  -- ya no es 4676c9d9…

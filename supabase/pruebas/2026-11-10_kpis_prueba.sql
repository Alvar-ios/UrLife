-- Prueba de los indicadores (kpis) · 10/11/2026. NO GUARDA NADA.
-- Cómo se ejecuta: en UNA sola llamada al conector de Supabase, enviar
--     begin;  <contenido de supabase/migrations/2026-11-10_kpis.sql>  <este archivo>  rollback;
-- Termina SIEMPRE con un error a propósito («PRUEBA_TERMINADA …»), así que aunque faltara el rollback se deshace todo:
-- las tablas y funciones nuevas, la tarea programada, las 12 cuentas inventadas y lo que crean.
-- Solo cuentas inventadas (correos @example.invalid) y nombres de prueba. Ningún dato real se lee hacia fuera:
-- durante la prueba TODAS las cuentas que ya existen se meten en kpis_excluidas (se deshace al final), así las cifras
-- salen solo de las cuentas inventadas y se pueden comprobar exactas.
-- Si falla con otro mensaje (p. ej. «column … does not exist» o un disparador que rechaza un insert), es que alguna tabla
-- tiene otra forma: ajustar ese insert y repetir. Los inserts van directos (como sistema) para poder poner fechas pasadas.
-- Puntos con más riesgo de chocar en la base real: si al crear un grupo un disparador ya mete a quien lo crea como
-- miembro (el insert de grupo_miembros del creador fallaría por repetido) y si movimientos o grupo_invitaciones piden
-- alguna columna obligatoria más. Probada solo en una copia simulada local (34 de 34 bien el 10/11/2026).
do $prueba$
declare
  u uuid[] := array(select gen_random_uuid() from generate_series(1, 12));
  base timestamptz;      -- alta de la «semana de prueba»: martes 12:00 de hace 6 semanas, hora de Madrid
  hoy date := (now() at time zone 'Europe/Madrid')::date;
  g1 uuid := gen_random_uuid(); g2 uuid := gen_random_uuid();
  r jsonb; p jsonb; sem jsonb; ok jsonb := '{}'; err text; n bigint; i int; lunes date;
begin
  base := (date_trunc('week', now() at time zone 'Europe/Madrid') - interval '6 weeks' + interval '1 day 12 hours') at time zone 'Europe/Madrid';

  -- 0. Fuera las cuentas que ya existen (solo durante la prueba)
  insert into public.kpis_excluidas (user_id) select id from auth.users;

  -- 1. Doce cuentas inventadas, todas dadas de alta en la misma semana; la 12 se borra ayer.
  for i in 1..12 loop
    insert into auth.users (id, email, aud, role, created_at, updated_at, last_sign_in_at)
      values (u[i], 'prueba-kpis-' || i || '-' || left(u[i]::text, 8) || '@example.invalid', 'authenticated', 'authenticated',
              base + make_interval(mins => i), now(), case when i <= 6 then now() - interval '1 day' end);
  end loop;
  update auth.users set deleted_at = now() - interval '1 day' where id = u[12];

  -- 2. Actividad: 1-6 apuntan en sus primeras 24 h; 1-5 vuelven los días 8 y 31 y hoy.
  for i in 1..6 loop
    insert into public.movimientos (user_id, fecha, tipo, categoria, descripcion, importe, created_at)
      values (u[i], hoy, case when i <= 5 then 'Inversión' else 'Gasto' end, 'Ocio', 'Prueba', 1, base + make_interval(mins => i) + interval '1 hour');
  end loop;
  for i in 1..5 loop
    insert into public.movimientos (user_id, fecha, tipo, categoria, descripcion, importe, created_at) values
      (u[i], hoy, 'Gasto', 'Ocio', 'Prueba', 1, base + interval '8 days'),
      (u[i], hoy, 'Gasto', 'Ocio', 'Prueba', 1, base + interval '31 days'),
      (u[i], hoy, 'Gasto', 'Ocio', 'Prueba', 1, now() - interval '1 minute');
  end loop;

  -- 3. Grupos: G1 lo crea 1 (al día siguiente del alta); 2-6 entran 2 horas después de su alta (por invitación).
  --    G2 lo crea 8 y está solo.
  insert into public.grupos (id, nombre, tipo, creado_por, created_at) values
    (g1, 'Prueba G1', 'grupo', u[1], base + interval '1 day'),
    (g2, 'Prueba G2', 'grupo', u[8], now() - interval '1 hour');
  insert into public.grupo_miembros (grupo_id, user_id, nombre, rol, created_at) values (g1, u[1], 'Prueba 1', 'admin', base + interval '1 day');
  for i in 2..6 loop
    insert into public.grupo_miembros (grupo_id, user_id, nombre, rol, created_at)
      values (g1, u[i], 'Prueba ' || i, 'miembro', base + make_interval(mins => i) + interval '2 hours');
  end loop;
  insert into public.grupo_miembros (grupo_id, user_id, nombre, rol, created_at) values (g2, u[8], 'Prueba 8', 'admin', now() - interval '1 hour');

  -- 4. 6 paga un gasto en G1 hoy (con su sesión) y 7 apunta un plan «Solo yo».
  perform set_config('request.jwt.claim.sub', u[6]::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', u[6], 'role', 'authenticated')::text, true);
  insert into public.compartidos (grupo_id, fecha, tipo, categoria, descripcion, importe, pagado_por, reparto)
    values (g1, hoy, 'Gasto', 'Ocio', 'Prueba', 12, u[6], jsonb_build_object(u[1], 6, u[6], 6));
  perform set_config('request.jwt.claim.sub', u[7]::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', u[7], 'role', 'authenticated')::text, true);
  insert into public.agenda (grupo_id, tipo, titulo, fecha) values (null, 'plan', 'Plan de prueba', hoy);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  -- 5. Configuración: 1-5 con dos cuentas, un extracto importado y una meta; 1-6 con trayecto.
  for i in 1..6 loop
    insert into public.config (user_id, key, value) values (u[i], 'app', case when i <= 5
      then '{"cuentas":[{"id":"a"},{"id":"b"}],"importLotes":[{"id":"x"}],"ahorro":[{"id":"m"}],"trayecto":{}}'::jsonb
      else '{"trayecto":{}}'::jsonb end)
    on conflict (user_id, key) do update set value = excluded.value;
  end loop;

  -- 6. Tickets: 1-5 una lectura normal bien (3.000 / 1.000 tokens); 1 una «precisa» que falla.
  for i in 1..5 loop
    insert into public.tickets_uso (user_id, modelo, ok, tokens_entrada, tokens_salida) values (u[i], 'claude-haiku-5-5', true, 3000, 1000);
  end loop;
  insert into public.tickets_uso (user_id, modelo, ok) values (u[1], 'claude-sonnet-5-5', false);

  -- 7. Invitaciones de G1: 6 enlaces creados hace 3 días, 5 usados.
  for i in 1..6 loop
    insert into public.grupo_invitaciones (token, grupo_id, creado_por, created_at, expira, usada_por, usada_en)
      values ('prueba-kpis-' || i || '-' || left(g1::text, 8), g1, u[1], now() - interval '3 days', now() + interval '4 days',
              case when i <= 5 then u[i + 6] end, case when i <= 5 then now() - interval '2 days' end);
  end loop;

  -- ===== Comprobaciones =====
  r := public.kpis_calcular(hoy - 60, hoy);
  p := r -> 'producto';

  ok := ok || jsonb_build_object('01 altas = 12', p -> 'altas' = '12');
  ok := ok || jsonb_build_object('02 apuntan en 24 h = 50 % de 12', p -> 'apuntan_en_24h' = '{"base": 12, "pct": 50.0}');
  ok := ok || jsonb_build_object('03 grupo en 7 días = 50 % de 12', p -> 'grupo_en_7_dias' = '{"base": 12, "pct": 50.0}');
  ok := ok || jsonb_build_object('04 activas hoy, semana y mes = 7 (5 movimientos + 1 compartido + 1 plan)',
    p -> 'activas' -> 'ultimo_dia' = '7' and p -> 'activas' -> 'semana' = '7' and p -> 'activas' -> 'mes' = '7');
  ok := ok || jsonb_build_object('05 activas en el periodo = 7', p -> 'activas' -> 'periodo' = '7');
  select x into sem from jsonb_array_elements(p -> 'retencion_por_semana_de_alta') x
   where x ->> 'semana' = date_trunc('week', base at time zone 'Europe/Madrid')::date::text;
  ok := ok || jsonb_build_object('06 retención de la semana de alta: 12 altas, 7 d y 30 d = 41,7 %',
    sem -> 'altas' = '12' and sem -> 'ret_7d_pct' = '41.7' and sem -> 'ret_30d_pct' = '41.7' and sem -> 'base_30d' = '12');
  ok := ok || jsonb_build_object('07 grupos creados 2 → "<5"; activos 1 → "<5"',
    p -> 'grupos' -> 'creados' = '"<5"' and p -> 'grupos' -> 'activos_periodo' = '"<5"');
  ok := ok || jsonb_build_object('08 personas por grupo: 2 grupos → media "<5" (no se ve el tamaño)',
    p -> 'personas_por_grupo' -> 'media' = '"<5"' and p -> 'personas_por_grupo' -> 'grupos' = '"<5"');
  ok := ok || jsonb_build_object('09 herramientas configuradas: varias cuentas 5, importar 5, metas 5, trayecto 6',
    p -> 'herramientas_configuradas_hoy' -> 'varias_cuentas' = '5' and p -> 'herramientas_configuradas_hoy' -> 'importar_extracto' = '5'
    and p -> 'herramientas_configuradas_hoy' -> 'metas' = '5' and p -> 'herramientas_configuradas_hoy' -> 'trayecto' = '6');
  ok := ok || jsonb_build_object('10 herramientas usadas: tickets 5, inversiones 5, juntos 1 → "<5", en algún grupo 7',
    p -> 'herramientas_usadas_en_periodo' -> 'tickets' = '5' and p -> 'herramientas_usadas_en_periodo' -> 'inversiones' = '5'
    and p -> 'herramientas_usadas_en_periodo' -> 'juntos_apuntan' = '"<5"' and p -> 'herramientas_usadas_en_periodo' -> 'en_algun_grupo_hoy' = '7');

  ok := ok || jsonb_build_object('11 marketing: 5 altas por invitación y 7 directas',
    r -> 'marketing' -> 'altas_por_invitacion' = '5' and r -> 'marketing' -> 'altas_directas' = '7'
    and r -> 'marketing' -> 'invitacion_entre_directa' = '0.71');
  ok := ok || jsonb_build_object('12 invitaciones: 6 creadas, 5 usadas, 83,3 %',
    r -> 'marketing' -> 'invitaciones' -> 'creadas' = '6' and r -> 'marketing' -> 'invitaciones' -> 'usadas_de_esas' = '5'
    and r -> 'marketing' -> 'invitaciones' -> 'usadas_pct' = '83.3');
  ok := ok || jsonb_build_object('13 crecimiento semanal: la semana de alta tiene 12 altas',
    exists (select 1 from jsonb_array_elements(r -> 'marketing' -> 'crecimiento_semanal') x
             where x ->> 'semana' = date_trunc('week', base at time zone 'Europe/Madrid')::date::text and x -> 'altas' = '12'));

  ok := ok || jsonb_build_object('14 datos: tamaño de la base y filas por tabla',
    (r -> 'datos_seguridad' ->> 'base_de_datos_mb')::numeric > 0
    and (r -> 'datos_seguridad' -> 'filas_por_tabla' -> 'movimientos' ->> 'filas')::int >= 21);
  ok := ok || jsonb_build_object('15 usuarios: 11 vivos, 6 entraron, 1 borrada → "<5"',
    r -> 'datos_seguridad' -> 'usuarios_auth' -> 'cuentas_vivas' = '11' and r -> 'datos_seguridad' -> 'usuarios_auth' -> 'entraron_30_dias' = '6'
    and r -> 'datos_seguridad' -> 'cuentas_borradas' -> 'en_periodo' = '"<5"');
  ok := ok || jsonb_build_object('16 tickets por modelo: normal 5 lecturas y 15.000 tokens; precisa 1 → "<5"',
    r -> 'datos_seguridad' -> 'tickets_por_modelo' -> 'claude-haiku-5-5' -> 'lecturas' = '5'
    and r -> 'datos_seguridad' -> 'tickets_por_modelo' -> 'claude-haiku-5-5' -> 'tokens_entrada' = '15000'
    and r -> 'datos_seguridad' -> 'tickets_por_modelo' -> 'claude-sonnet-5-5' -> 'lecturas' = '"<5"');
  -- coste: 5 × (3.000 × 0,10 + 1.000 × 0,50) / 1.000.000 = 0,004 USD (más lo que haya de verdad este mes)
  ok := ok || jsonb_build_object('17 coste del mes incluye al menos 0,004 USD de las 5 lecturas',
    (r -> 'datos_seguridad' -> 'coste_mes' ->> 'tickets_usd')::numeric >= 0.004
    and (r -> 'datos_seguridad' -> 'coste_mes' ->> 'lecturas_sin_precio')::int >= 1);
  ok := ok || jsonb_build_object('18 calidad: 1 ticket fallido → "<5"', r -> 'calidad' -> 'tickets_fallidos' = '"<5"');
  ok := ok || jsonb_build_object('19 la respuesta no lleva correos ni ids de nadie',
    r::text not like '%@%' and not exists (select 1 from unnest(u || array[g1, g2]) x where r::text like '%' || x::text || '%')
    and not exists (select 1 from auth.users au where r::text like '%' || au.id::text || '%'));

  -- Permisos
  ok := ok || jsonb_build_object('20 nadie con sesión ni anon puede llamar a kpis_calcular ni a guardar la semana',
    not has_function_privilege('authenticated', 'public.kpis_calcular(date, date)', 'execute')
    and not has_function_privilege('anon', 'public.kpis_calcular(date, date)', 'execute')
    and not has_function_privilege('authenticated', 'public.kpis_guardar_semana()', 'execute')
    and not has_function_privilege('anon', 'public.kpis_resumen(date, date)', 'execute'));
  ok := ok || jsonb_build_object('21 anon y authenticated no tocan kpis_admins ni kpis_excluidas',
    not has_table_privilege('authenticated', 'public.kpis_admins', 'select') and not has_table_privilege('anon', 'public.kpis_admins', 'select')
    and not has_table_privilege('authenticated', 'public.kpis_excluidas', 'insert') and not has_table_privilege('anon', 'public.kpis_manual', 'select'));

  -- 2 (no administradora) con sesión
  perform set_config('request.jwt.claim.sub', u[2]::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', u[2], 'role', 'authenticated')::text, true);
  set local role authenticated;
  err := null; begin perform public.kpis_resumen(hoy - 7, hoy); exception when others then err := sqlerrm; end;
  ok := ok || jsonb_build_object('22 una persona normal con sesión: no_autorizado', err = 'no_autorizado');
  err := null; begin insert into public.kpis_manual (fecha, fuente, clave, valor) values (hoy, 'play', 'instalaciones', 1); exception when others then err := sqlstate; end;
  ok := ok || jsonb_build_object('23 una persona normal no puede apuntar a mano', err = '42501');
  reset role;

  -- 1 pasa a ser administradora (solo dentro de la prueba)
  insert into public.kpis_admins (user_id) values (u[1]);
  perform set_config('request.jwt.claim.sub', u[1]::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', u[1], 'role', 'authenticated')::text, true);
  set local role authenticated;
  err := null; begin r := public.kpis_resumen(hoy - 60, hoy); exception when others then err := sqlerrm; end;
  ok := ok || jsonb_build_object('24 la administradora sí puede, y ve lo mismo', err is null and r -> 'producto' -> 'altas' = '12');
  err := null;
  begin
    insert into public.kpis_manual (fecha, fuente, clave, valor) values (hoy, 'play', 'instalaciones', 12);
    insert into public.kpis_manual (fecha, fuente, clave, valor) values (hoy, 'play', 'instalaciones', 13)
      on conflict (fecha, fuente, clave) do update set valor = excluded.valor;
  exception when others then err := sqlerrm; end;
  select count(*) into n from public.kpis_manual;
  ok := ok || jsonb_build_object('25 la administradora apunta a mano (una fila por fecha, fuente y clave) y lo lee', err is null and n = 1);
  err := null; begin insert into public.kpis_admins (user_id) values (u[3]); exception when others then err := sqlstate; end;
  ok := ok || jsonb_build_object('26 ni la administradora añade administradores desde la app', err = '42501');
  r := public.kpis_resumen(hoy - 60, hoy);
  ok := ok || jsonb_build_object('27 lo apuntado a mano sale en el resumen', r -> 'a_mano' -> 'play' -> 'instalaciones' = '13');
  reset role;

  perform set_config('request.jwt.claim.sub', u[2]::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', u[2], 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.kpis_manual;
  ok := ok || jsonb_build_object('28 una persona normal no ve lo apuntado a mano', n = 0);
  reset role;

  -- Servicio interno
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', jsonb_build_object('role', 'service_role')::text, true);
  set local role service_role;
  err := null; begin r := public.kpis_resumen(hoy - 7, hoy); exception when others then err := sqlerrm; end;
  ok := ok || jsonb_build_object('29 el servicio interno (service_role) puede', err is null and r ? 'producto');
  err := null; begin r := public.kpis_resumen(hoy, hoy - 1); exception when others then err := sqlerrm; end;
  ok := ok || jsonb_build_object('30 rango al revés: kpis_rango_no_valido', err = 'kpis_rango_no_valido');
  reset role;
  perform set_config('request.jwt.claims', '', true);

  -- Foto del lunes
  lunes := public.kpis_guardar_semana();
  lunes := public.kpis_guardar_semana();   -- repetir no duplica
  select count(*) into n from public.kpis_historial where semana = lunes;
  ok := ok || jsonb_build_object('31 la foto semanal se guarda una vez por semana (lunes anterior)',
    n = 1 and extract(isodow from lunes) = 1 and lunes = date_trunc('week', now() at time zone 'Europe/Madrid')::date - 7);
  ok := ok || jsonb_build_object('32 la tarea programada está apuntada (lunes 06:00 UTC)',
    exists (select 1 from cron.job where jobname = 'kpis-semana' and schedule = '0 6 * * 1'));
  perform set_config('request.jwt.claim.sub', u[2]::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', u[2], 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.kpis_historial;
  ok := ok || jsonb_build_object('33 una persona normal no ve el historial', n = 0);
  reset role;
  perform set_config('request.jwt.claim.sub', u[1]::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', u[1], 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.kpis_historial;
  ok := ok || jsonb_build_object('34 la administradora sí lo ve', n = 1);
  reset role;

  raise exception 'PRUEBA_TERMINADA % de % bien. Fallan: %',
    (select count(*) from jsonb_each(ok) where value = 'true'), (select count(*) from jsonb_each(ok)),
    coalesce((select string_agg(key, ' | ') from jsonb_each(ok) where value <> 'true'), 'ninguna');
end $prueba$;

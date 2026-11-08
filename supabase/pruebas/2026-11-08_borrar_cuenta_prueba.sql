-- Prueba de «borrar mi cuenta» (08/11/2026). NO GUARDA NADA.
-- Cómo se ejecuta: en UNA sola llamada al conector de Supabase, enviar
--     begin;  <contenido de supabase/migrations/2026-11-08_borrar_cuenta.sql>  <este archivo>  rollback;
-- Termina SIEMPRE con un error a propósito («PRUEBA_TERMINADA …» con el resultado), así que aunque faltara el
-- rollback se deshace todo: la función nueva, las 3 cuentas inventadas y todo lo que crean.
-- Usa solo cuentas inventadas (correos @example.invalid) y nombres de prueba. Ningún dato real.
-- Si falla antes de terminar con otro mensaje (p. ej. «column … does not exist»), es que alguna tabla de prueba
-- tiene otra forma: ajustar ese insert y repetir. La función de la migración no se ha aplicado.
do $prueba$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
  g1 uuid; g2 uuid; g3 uuid; inv text; inv_g3 text; obj uuid; gasto_a uuid; plan_a_g1 uuid; plan_b_g1 uuid;
  mov1 uuid := gen_random_uuid(); mov2 uuid := gen_random_uuid(); tar uuid := gen_random_uuid();
  r jsonb; r2 jsonb; ok jsonb := '{}'; n bigint; x text; err text;
  sb1 numeric; sc1 numeric; sb2 numeric; c_comp bigint; nuevo_admin uuid;
begin
  -- 0. Tres cuentas inventadas
  insert into auth.users (id, email, aud, role, created_at, updated_at) values
    (a, 'prueba-borrar-a-' || left(a::text, 8) || '@example.invalid', 'authenticated', 'authenticated', now(), now()),
    (b, 'prueba-borrar-b-' || left(b::text, 8) || '@example.invalid', 'authenticated', 'authenticated', now(), now()),
    (c, 'prueba-borrar-c-' || left(c::text, 8) || '@example.invalid', 'authenticated', 'authenticated', now(), now());

  -- 1. G1 (lo crea A; entran B y C). G3 (A solo, con un enlace sin usar).
  perform set_config('request.jwt.claim.sub', a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  g1 := btrim(public.crear_grupo('Prueba G1', 'Ana Prueba')::text, '"')::uuid;
  inv := btrim(public.crear_invitacion(g1)::text, '"');
  reset role;
  perform set_config('request.jwt.claim.sub', b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.unirse(inv, 'Bea Prueba');
  reset role;
  perform set_config('request.jwt.claim.sub', a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  inv := btrim(public.crear_invitacion(g1)::text, '"');
  g3 := btrim(public.crear_grupo('Prueba G3', 'Ana Prueba')::text, '"')::uuid;
  inv_g3 := btrim(public.crear_invitacion(g3)::text, '"');
  reset role;
  perform set_config('request.jwt.claim.sub', c::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.unirse(inv, 'Carlos Prueba');
  -- C paga 30 a partes iguales
  insert into public.compartidos (grupo_id, fecha, tipo, categoria, descripcion, importe, pagado_por, reparto)
    values (g1, current_date, 'Gasto', 'Ocio', 'Prueba C', 30, c, jsonb_build_object(a, 10, b, 10, c, 10));
  reset role;

  -- 2. Gastos de G1: A paga 30, B paga 30 (los tres a partes iguales) y B paga 20 solo entre B y C.
  --    Saldos: A 0, B +10, C -10.
  perform set_config('request.jwt.claim.sub', a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.compartidos (grupo_id, fecha, tipo, categoria, descripcion, importe, pagado_por, reparto)
    values (g1, current_date, 'Gasto', 'Ocio', 'Prueba A', 30, a, jsonb_build_object(a, 10, b, 10, c, 10)) returning id into gasto_a;
  insert into public.compartidos (grupo_id, fecha, tipo, categoria, descripcion, importe, pagado_por, reparto)
    values (g3, current_date, 'Gasto', 'Ocio', 'Prueba A solo', 10, a, jsonb_build_object(a, 10));
  insert into public.objetivos_compartidos (grupo_id, tipo, nombre, objetivo) values (g1, 'ahorro', 'Meta prueba', 100) returning id into obj;
  insert into public.objetivo_aportes (objetivo_id, mov_id, fecha, tipo, importe) values (obj, mov1, current_date::text, 'Ahorro', 25);
  insert into public.agenda (grupo_id, tipo, titulo, fecha) values (g1, 'plan', 'Plan de grupo de A', current_date) returning id into plan_a_g1;
  insert into public.agenda (grupo_id, tipo, titulo, fecha) values (null, 'plan', 'Plan solo yo de A', current_date);
  insert into public.agenda_permisos (a_usuario, nivel) values (b, 'ocupado');
  reset role;
  perform set_config('request.jwt.claim.sub', b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.compartidos (grupo_id, fecha, tipo, categoria, descripcion, importe, pagado_por, reparto)
    values (g1, current_date, 'Gasto', 'Ocio', 'Prueba B', 30, b, jsonb_build_object(a, 10, b, 10, c, 10));
  insert into public.compartidos (grupo_id, fecha, tipo, categoria, descripcion, importe, pagado_por, reparto)
    values (g1, current_date, 'Gasto', 'Ocio', 'Prueba B y C', 20, b, jsonb_build_object(b, 10, c, 10));
  insert into public.agenda (grupo_id, tipo, titulo, fecha) values (g1, 'plan', 'Plan de grupo de B', current_date) returning id into plan_b_g1;
  insert into public.agenda_permisos (a_usuario, nivel) values (a, 'ocupado');
  -- G2 (lo crea B; entra A). A paga 40 entre A y B: A +20, B -20 → A no puede borrarse todavía.
  g2 := btrim(public.crear_grupo('Prueba G2', 'Bea Prueba')::text, '"')::uuid;
  inv := btrim(public.crear_invitacion(g2)::text, '"');
  reset role;
  perform set_config('request.jwt.claim.sub', a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.unirse(inv, 'Ana Prueba');
  insert into public.compartidos (grupo_id, fecha, tipo, categoria, descripcion, importe, pagado_por, reparto)
    values (g2, current_date, 'Gasto', 'Ocio', 'Prueba A en G2', 40, a, jsonb_build_object(a, 20, b, 20));
  insert into public.agenda_ocultas (agenda_id) values (plan_b_g1);
  reset role;

  -- 3. Lo personal de A (como sistema, sin reglas)
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
  insert into public.movimientos (id, user_id, fecha, tipo, categoria, descripcion, importe) values
    (mov1, a, current_date::text, 'Ahorro', 'Ahorro', 'Prueba apartar', 25),
    (mov2, a, current_date::text, 'Gasto', 'Ocio', 'Prueba gasto', 12);
  insert into public.tareas (id, user_id, nombre, estado) values (tar, a, 'Tarea de prueba', 'Pendiente');
  insert into public.config (user_id, key, value) values (a, 'app', '{"nombre": "Ana Prueba"}');
  insert into public.tickets_uso (user_id, modelo, ok) values (a, 'prueba', true);

  sb1 := public.saldo_en_grupo(g1, b); sc1 := public.saldo_en_grupo(g1, c); sb2 := public.saldo_en_grupo(g2, b);
  ok := ok || jsonb_build_object('01 saldos de partida (A 0, B +10, C -10 en G1; B -20 en G2)',
    public.saldo_en_grupo(g1, a) = 0 and sb1 = 10 and sc1 = -10 and sb2 = -20);

  -- 4. Permisos: nadie con sesión (ni anon) puede llamar a la función
  ok := ok || jsonb_build_object('02 authenticated y anon no pueden ejecutarla; service_role sí',
    not has_function_privilege('authenticated', 'public.borrar_cuenta_datos(uuid)', 'execute')
    and not has_function_privilege('anon', 'public.borrar_cuenta_datos(uuid)', 'execute')
    and has_function_privilege('service_role', 'public.borrar_cuenta_datos(uuid)', 'execute'));
  perform set_config('request.jwt.claim.sub', b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  err := null;
  begin perform public.borrar_cuenta_datos(a); exception when others then err := sqlstate; end;
  reset role;
  ok := ok || jsonb_build_object('03 B con sesión intenta borrar a A: rechazado', err = '42501');
  -- (y aunque tuviera permiso, con sesión la función se niega: auth.uid() no vacío → no_autorizado)
  err := null;
  begin perform public.borrar_cuenta_datos(a); exception when others then err := sqlerrm; end;
  ok := ok || jsonb_build_object('04 con sesión dentro (sin cambiar de papel) también se niega', err = 'no_autorizado');
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  -- 5. Con dinero pendiente en G2: no se borra nada y dice qué grupo
  select count(*) into c_comp from public.compartidos where grupo_id in (g1, g2, g3);
  set local role service_role;
  r := public.borrar_cuenta_datos(a);
  reset role;
  ok := ok || jsonb_build_object('05 con saldo pendiente: ok=false, motivo saldo_pendiente',
    r ->> 'ok' = 'false' and r ->> 'motivo' = 'saldo_pendiente');
  ok := ok || jsonb_build_object('06 la lista trae solo G2, con +20 y con quién',
    jsonb_array_length(r -> 'grupos') = 1 and (r -> 'grupos' -> 0 ->> 'grupo')::uuid = g2
    and (r -> 'grupos' -> 0 ->> 'saldo')::numeric = 20 and r -> 'grupos' -> 0 ->> 'con' = 'Bea Prueba');
  ok := ok || jsonb_build_object('07 sin borrar nada todavía',
    (select count(*) from public.movimientos where user_id = a) = 2
    and (select count(*) from public.grupo_miembros where user_id = a and baja is null) = 3);

  -- 6. B le paga a A los 20 (liquidación) y A ya puede borrarse
  perform set_config('request.jwt.claim.sub', b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.compartidos (grupo_id, fecha, tipo, categoria, descripcion, importe, pagado_por, reparto)
    values (g2, current_date, 'Liquidación', null, 'Prueba pago', 20, b, jsonb_build_object(a, 20));
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
  select count(*) into c_comp from public.compartidos where grupo_id in (g1, g2, g3);
  set local role service_role;
  r := public.borrar_cuenta_datos(a);
  reset role;
  ok := ok || jsonb_build_object('08 borrado: ok=true', r ->> 'ok' = 'true');

  -- 7. Los saldos de B y C no cambian
  ok := ok || jsonb_build_object('09 saldos de B y C iguales (G1: +10 / -10; G2: B 0)',
    public.saldo_en_grupo(g1, b) = sb1 and public.saldo_en_grupo(g1, c) = sc1 and public.saldo_en_grupo(g2, b) = 0
    and public.saldo_en_grupo(g1, a) = 0 and public.saldo_en_grupo(g2, a) = 0);
  ok := ok || jsonb_build_object('10 ningún gasto compartido borrado ni cambiado de grupo',
    (select count(*) from public.compartidos where grupo_id in (g1, g2, g3)) = c_comp
    and (select count(*) from public.compartidos where grupo_id in (g1, g2, g3) and borrado is not null) = 0);

  -- 8. No queda nada personal de A
  ok := ok || jsonb_build_object('11 sin filas personales de A',
    (select count(*) from public.movimientos where user_id = a) = 0
    and (select count(*) from public.tareas where user_id = a) = 0
    and (select count(*) from public.config where user_id = a) = 0
    and (select count(*) from public.golf where user_id = a) = 0
    and (select count(*) from public.tickets_uso where user_id = a) = 0
    and (select count(*) from public.agenda_ocultas where user_id = a) = 0
    and (select count(*) from public.agenda_permisos where dueno = a or a_usuario = a) = 0
    and (select count(*) from public.agenda where grupo_id is null and creado_por = a) = 0
    and (select count(*) from public.paradores_luces where user_id = a) = 0);
  ok := ok || jsonb_build_object('12 lo que B comparte con otros sigue (solo se fue el permiso hacia A)',
    (select count(*) from public.agenda_permisos where dueno = b) = 0);   -- B solo compartía con A

  -- 9. En los grupos queda como baja con su nombre; lo del grupo se conserva
  ok := ok || jsonb_build_object('13 A sigue en los 3 grupos como baja, con su nombre',
    (select count(*) from public.grupo_miembros where user_id = a and baja is not null and nombre = 'Ana Prueba') = 3);
  select user_id into nuevo_admin from public.grupo_miembros where grupo_id = g1 and rol = 'admin' and baja is null;
  ok := ok || jsonb_build_object('14 G1: el creador y el administrador pasan a B o C (uno solo)',
    (select count(*) from public.grupo_miembros where grupo_id = g1 and rol = 'admin' and baja is null) = 1
    and nuevo_admin in (b, c) and (select creado_por from public.grupos where id = g1) = nuevo_admin);
  ok := ok || jsonb_build_object('15 G2 (de B): sin cambios de creador ni de administrador',
    (select creado_por from public.grupos where id = g2) = b and (select cerrado from public.grupos where id = g2) is null
    and (select rol from public.grupo_miembros where grupo_id = g2 and user_id = b) = 'admin');
  ok := ok || jsonb_build_object('16 G3 (A sola): cerrado, NO borrado, con su gasto, y su enlace caducado',
    (select cerrado from public.grupos where id = g3) is not null
    and (select count(*) from public.compartidos where grupo_id = g3) = 1
    and (select expira from public.grupo_invitaciones where token = inv_g3) <= now());
  ok := ok || jsonb_build_object('17 se conservan: aporte a la meta, meta y planes de grupo',
    (select count(*) from public.objetivo_aportes where user_id = a and borrado is null) = 1
    and (select count(*) from public.objetivos_compartidos where id = obj and borrado is null) = 1
    and (select count(*) from public.agenda where id in (plan_a_g1, plan_b_g1) and borrado is null) = 2);

  -- 10. B sigue viendo y editando los gastos antiguos con A
  perform set_config('request.jwt.claim.sub', b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.compartidos where grupo_id = g1 and (pagado_por = a or reparto ? a::text);
  select nombre into x from public.grupo_miembros where grupo_id = g1 and user_id = a;
  err := null;
  begin
    update public.compartidos set descripcion = 'Prueba A (editado por B)' where id = gasto_a;
    get diagnostics r2 = row_count;
  exception when others then err := sqlerrm; end;
  reset role;
  ok := ok || jsonb_build_object('18 B ve los 3 gastos de G1 con A y su nombre', n = 3 and x = 'Ana Prueba');
  ok := ok || jsonb_build_object('19 B edita el gasto que pagó A', err is null
    and (select descripcion from public.compartidos where id = gasto_a) = 'Prueba A (editado por B)');
  ok := ok || jsonb_build_object('20 queda en el historial como editado por B',
    exists (select 1 from public.compartidos_historial where compartido_id = gasto_a and accion = 'editado' and hecho_por = b));

  -- 11. Repetir no rompe nada
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
  set local role service_role;
  r2 := public.borrar_cuenta_datos(a);
  reset role;
  ok := ok || jsonb_build_object('21 segunda vez: ok y nada más que borrar',
    r2 ->> 'ok' = 'true' and (r2 ->> 'grupos_baja')::int = 0 and (r2 -> 'borrado' ->> 'movimientos')::int = 0);

  -- Resultado (error a propósito: se deshace todo)
  raise exception 'PRUEBA_TERMINADA % de % bien. Fallan: %. Respuesta: %',
    (select count(*) from jsonb_each(ok) where value = 'true'), (select count(*) from jsonb_each(ok)),
    coalesce((select string_agg(key, ' | ') from jsonb_each(ok) where value <> 'true'), 'ninguna'), r;
end $prueba$;

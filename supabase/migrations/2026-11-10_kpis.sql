-- 10/11/2026 · kpis: cifras totales para el panel del dueño (docs/37 §C). APLICADA el 10/11/2026 (actividad incluye agenda de grupo, decisión del dueño).
-- Se aplica solo con el «sí» del dueño. Probar antes con supabase/pruebas/2026-11-10_kpis_prueba.sql.
--
-- Qué hace (todo ADITIVO: tablas y funciones nuevas; no cambia ni borra ningún dato de nadie):
--   · kpis_admins (user_id): quién puede ver el panel. VACÍA al aplicar: el dueño mete su id a mano
--       en el editor SQL de Supabase (nunca en el repositorio):  insert into public.kpis_admins (user_id) values ('…');
--   · kpis_excluidas (user_id): cuentas de prueba que no deben contar. Vacía; se rellena igual, a mano.
--   · kpis_resumen(desde, hasta): SOLO NÚMEROS (jsonb por departamento). Nunca filas, ids, correos, nombres ni importes.
--       Cualquier cifra de 1 a 4 personas sale como "<5". La pueden llamar el dueño (kpis_admins) y el servicio interno.
--   · kpis_historial (semana, datos): una foto cada lunes 06:00 UTC (pg_cron) de la semana anterior (lunes-domingo, hora de Madrid).
--   · kpis_manual (fecha, fuente, clave, valor): cifras de Play Console, App Store, redes y facturas metidas a mano.
--       Solo el dueño lee y escribe (RLS).
--
-- «Activa» = guardó en ese periodo un movimiento (movimientos.created_at), un gasto o pago compartido que creó
-- (compartidos.creado_por) o algo en la agenda de grupo / planes (agenda.creado_por). Las tareas personales no cuentan.
-- Quien solo abre la app para mirar NO cuenta (haría falta la columna ultimo_dia de docs/37 C.1).
--
-- ANTES DE APLICAR (solo lee):
--   select table_name, column_name, data_type from information_schema.columns
--    where (table_schema, table_name) in (('public','movimientos'),('public','tareas'),('public','config'),('public','compartidos'),
--      ('public','grupos'),('public','grupo_miembros'),('public','grupo_invitaciones'),('public','grupo_invitados'),
--      ('public','invitado_enlaces'),('public','agenda'),('public','agenda_permisos'),('public','objetivo_aportes'),
--      ('public','tickets_uso'),('auth','users')) order by 1, 2;
--   select extname from pg_extension where extname = 'pg_cron';
--   El paso 0 de abajo hace esa misma comprobación y PARA la migración (sin crear nada) si falta alguna columna.
--   Ojo: docs/37 C.1 habla de movimientos.creado_en (la app lo rellena con la hora del móvil, en milisegundos).
--   Aquí se usa movimientos.created_at (hora del servidor). Si created_at no existe, el paso 0 lo dirá: entonces
--   cambiar en kpis_actividad «m.created_at» por «to_timestamp(m.creado_en / 1000.0)» (una sola línea).
--
-- CÓMO SE DESHACE (no toca ningún dato de usuarios; solo se pierden las fotos semanales y las cifras a mano):
--   select cron.unschedule('kpis-semana');
--   drop function if exists public.kpis_resumen(date, date), public.kpis_guardar_semana(), public.kpis_calcular(date, date),
--     public.kpis_actividad(timestamptz, timestamptz), public.kpis_usuarios(), public.kpis_es_admin(),
--     public.kpis_n(numeric), public.kpis_pct(numeric, numeric), public.kpis_largo(jsonb);
--   drop table if exists public.kpis_manual, public.kpis_historial, public.kpis_excluidas, public.kpis_admins;
--   (Antes de borrar kpis_manual / kpis_historial, si se quiere guardar lo apuntado: select * from … y copiarlo.)


-- ======================================================================================
-- 0. Comprobar que las columnas que se usan existen (con information_schema). Si falta algo, para aquí.
-- ======================================================================================
do $comprobar$
declare falta text; tipo_mal text;
begin
  with esperadas(esq, tabla, col) as (values
    ('public','movimientos','user_id'), ('public','movimientos','created_at'), ('public','movimientos','tipo'),
    ('public','tareas','user_id'), ('public','tareas','created_at'),
    ('public','config','user_id'), ('public','config','key'), ('public','config','value'),
    ('public','compartidos','grupo_id'), ('public','compartidos','creado_por'), ('public','compartidos','created_at'),
    ('public','grupos','id'), ('public','grupos','tipo'), ('public','grupos','creado_por'), ('public','grupos','created_at'),
    ('public','grupos','cerrado'),
    ('public','grupo_miembros','grupo_id'), ('public','grupo_miembros','user_id'), ('public','grupo_miembros','baja'),
    ('public','grupo_miembros','created_at'),
    ('public','grupo_invitaciones','grupo_id'), ('public','grupo_invitaciones','creado_por'),
    ('public','grupo_invitaciones','usada_por'), ('public','grupo_invitaciones','usada_en'),
    ('public','grupo_invitaciones','created_at'), ('public','grupo_invitaciones','usos'),
    ('public','grupo_invitados','grupo_id'), ('public','grupo_invitados','baja'), ('public','grupo_invitados','reclamado_por'),
    ('public','invitado_enlaces','creado_por'), ('public','invitado_enlaces','created_at'),
    ('public','invitado_enlaces','usado_por'), ('public','invitado_enlaces','usado_en'),
    ('public','agenda','creado_por'), ('public','agenda','created_at'),
    ('public','agenda_permisos','dueno'),
    ('public','objetivo_aportes','user_id'),
    ('public','tickets_uso','user_id'), ('public','tickets_uso','modelo'), ('public','tickets_uso','ok'),
    ('public','tickets_uso','created_at'), ('public','tickets_uso','tokens_entrada'), ('public','tickets_uso','tokens_salida'),
    ('auth','users','id'), ('auth','users','created_at'), ('auth','users','deleted_at'), ('auth','users','last_sign_in_at'))
  select string_agg(e.esq || '.' || e.tabla || '.' || e.col, ', ') into falta
    from esperadas e
   where not exists (select 1 from information_schema.columns c
                      where c.table_schema = e.esq and c.table_name = e.tabla and c.column_name = e.col);
  if falta is not null then raise exception 'kpis: faltan columnas: %', falta; end if;

  -- Las fechas tienen que ser fecha y hora (para comparar con now()).
  select string_agg(c.table_schema || '.' || c.table_name || '.' || c.column_name || ' (' || c.data_type || ')', ', ') into tipo_mal
    from information_schema.columns c
   where c.table_schema in ('public', 'auth')
     and c.table_name in ('movimientos','tareas','compartidos','grupos','grupo_miembros','grupo_invitaciones','invitado_enlaces',
                          'agenda','tickets_uso','users')
     and c.column_name in ('created_at','deleted_at','last_sign_in_at','usada_en','usado_en','baja')
     and c.data_type not like 'timestamp%';
  if tipo_mal is not null then raise exception 'kpis: estas columnas no son fecha y hora: %', tipo_mal; end if;

  if not exists (select 1 from pg_extension where extname = 'pg_cron') then raise exception 'kpis: falta pg_cron'; end if;
end $comprobar$;


-- ======================================================================================
-- 1. Tablas
-- ======================================================================================

-- 1a. Quién puede ver el panel. Sin reglas para nadie con sesión: solo se toca desde el editor SQL.
create table public.kpis_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creado timestamptz not null default now()
);
alter table public.kpis_admins enable row level security;
revoke all on public.kpis_admins from public, anon, authenticated;

-- 1b. Cuentas de prueba que no cuentan en ninguna cifra (también a mano).
create table public.kpis_excluidas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creado timestamptz not null default now()
);
alter table public.kpis_excluidas enable row level security;
revoke all on public.kpis_excluidas from public, anon, authenticated;

-- 1c. Foto semanal (solo números). La escribe solo la tarea programada; la lee solo el dueño.
create table public.kpis_historial (
  semana date primary key check (extract(isodow from semana) = 1),   -- el lunes de esa semana
  datos jsonb not null,
  creado timestamptz not null default now()
);
alter table public.kpis_historial enable row level security;
revoke all on public.kpis_historial from public, anon, authenticated;

-- 1d. Cifras de fuera, a mano. Una por fecha, fuente y clave (volver a meterla la corrige).
create table public.kpis_manual (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  fuente text not null check (fuente ~ '^[a-z0-9_]{1,30}$'),          -- play, app_store, tiktok, instagram, coste…
  clave text not null check (clave ~ '^[a-z0-9_]{1,60}$'),            -- instalaciones, visitas, nota, cierres_pct, usd…
  valor numeric not null,
  creado_por uuid default auth.uid() references auth.users(id) on delete set null,
  creado timestamptz not null default now(),
  unique (fecha, fuente, clave)
);
alter table public.kpis_manual enable row level security;
revoke all on public.kpis_manual from public, anon, authenticated;


-- ======================================================================================
-- 2. Ayudantes
-- ======================================================================================

-- ¿La persona con sesión es administradora del panel? Solo responde por uno mismo.
create function public.kpis_es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.kpis_admins a where a.user_id = auth.uid());
$$;

-- Regla de las cifras pequeñas: de 1 a 4 → "<5".
create function public.kpis_n(n numeric) returns jsonb
language sql immutable set search_path = '' as $$
  select case when n is null then 'null'::jsonb when n > 0 and n < 5 then to_jsonb('<5'::text) else to_jsonb(n) end;
$$;

-- Porcentaje: si la base es de menos de 5 personas o la parte es de 1 a 4 → "<5". Sin base → null.
create function public.kpis_pct(parte numeric, base numeric) returns jsonb
language sql immutable set search_path = '' as $$
  select case when base is null or base = 0 then 'null'::jsonb
              when base < 5 or (parte > 0 and parte < 5) then to_jsonb('<5'::text)
              else to_jsonb(round(100.0 * parte / base, 1)) end;
$$;

-- Cuántos elementos tiene una lista u objeto de la configuración (sin mirar lo que hay dentro).
create function public.kpis_largo(j jsonb) returns int
language sql immutable set search_path = '' as $$
  select case jsonb_typeof(j) when 'array' then jsonb_array_length(j)
                              when 'object' then (select count(*)::int from jsonb_object_keys(j))
                              else 0 end;
$$;

-- Cuentas que cuentan (todas menos las de prueba). Solo para uso interno.
create function public.kpis_usuarios()
returns table (id uuid, alta timestamptz, borrada timestamptz, ultimo_acceso timestamptz)
language sql stable set search_path = '' as $$
  select u.id, u.created_at, u.deleted_at, u.last_sign_in_at
    from auth.users u
   where not exists (select 1 from public.kpis_excluidas x where x.user_id = u.id);
$$;

-- Actividad (quién guardó algo y cuándo) entre dos instantes. Solo para uso interno.
create function public.kpis_actividad(p_ini timestamptz, p_fin timestamptz)
returns table (user_id uuid, en timestamptz)
language sql stable set search_path = '' as $$
  select a.user_id, a.en from (
    select m.user_id, m.created_at as en from public.movimientos m where m.created_at >= p_ini and m.created_at < p_fin
    union all
    select c.creado_por, c.created_at from public.compartidos c where c.created_at >= p_ini and c.created_at < p_fin
    union all
    select g.creado_por, g.created_at from public.agenda g where g.created_at >= p_ini and g.created_at < p_fin
  ) a
  where a.user_id is not null
    and not exists (select 1 from public.kpis_excluidas x where x.user_id = a.user_id);
$$;


-- ======================================================================================
-- 3. El cálculo (interno; nadie con sesión puede llamarlo directamente)
-- ======================================================================================
create function public.kpis_calcular(p_desde date, p_hasta date) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  tz constant text := 'Europe/Madrid';
  -- Precios (docs/35 §3b, USD por millón de tokens). Cambiar aquí si cambian.
  p_haiku_in constant numeric := 0.10;  p_haiku_out constant numeric := 0.50;
  p_sonnet_in constant numeric := 2;    p_sonnet_out constant numeric := 10;
  supabase_usd constant numeric := 0;   -- plan gratis; poner 25 si se pasa a Pro
  limite_mb constant numeric := 500;    limite_usuarios constant numeric := 50000;
  v_ini timestamptz; v_fin timestamptz; v_ref timestamptz; v_coh timestamptz; v_mes timestamptz; v_hoy date;
  -- actividad
  a_ult bigint; a_sem bigint; a_mes bigint; a_per bigint; a_media numeric;
  -- altas
  al_n bigint; al_b24 bigint; al_24 bigint; al_b7 bigint; al_g7 bigint; al_inv bigint;
  -- grupos
  g_cre bigint; g_dir bigint; g_abiertos bigint; g_act bigint; g_act7 bigint;
  pg_n bigint; pg_media numeric; pg_mediana numeric; pg_sin numeric; pg_1 bigint; pg_2 bigint; pg_3_5 bigint; pg_6 bigint;
  retencion jsonb; uso jsonb; uso2 jsonb; semanas jsonb;
  -- marketing
  i_cre bigint; i_usadas bigint; i_usadas_per bigint; e_cre bigint; e_usados bigint;
  -- datos
  v_bytes bigint; filas jsonb := '{}'; r record; n bigint;
  u_total bigint; u_auth30 bigint; u_borr_per bigint; u_borr_total bigint;
  tickets jsonb; t_total bigint; t_fallos bigint; t_fallos_mod jsonb;
  c_tickets numeric; c_sin_tokens bigint; c_otros numeric; c_total numeric;
  v_cron jsonb; manual jsonb; pct_bd numeric; aviso text;
begin
  if p_desde is null or p_hasta is null or p_hasta < p_desde or p_hasta - p_desde > 366 then
    raise exception 'kpis_rango_no_valido';
  end if;
  v_ini := p_desde::timestamp at time zone tz;               -- 00:00 en Madrid del primer día
  v_fin := (p_hasta + 1)::timestamp at time zone tz;         -- 00:00 en Madrid del día siguiente al último
  v_ref := least(v_fin, now());
  v_hoy := least(p_hasta, (now() at time zone tz)::date);
  v_mes := date_trunc('month', p_hasta::timestamp) at time zone tz;
  -- Retención: semanas de alta del periodo y, como mínimo, las 6 últimas hasta «hasta» (para que la foto semanal la lleve).
  v_coh := least(v_ini, (date_trunc('week', p_hasta::timestamp) - interval '5 weeks') at time zone tz);

  -- ---------- PRODUCTO ----------
  -- Activas: último día, 7 y 30 días hasta el final del periodo, todo el periodo, y media diaria.
  select count(distinct a.user_id) filter (where a.en >= (v_hoy::timestamp at time zone tz) and a.en < ((v_hoy + 1)::timestamp at time zone tz)),
         count(distinct a.user_id) filter (where a.en >= v_ref - interval '7 days'),
         count(distinct a.user_id) filter (where a.en >= v_ref - interval '30 days'),
         count(distinct a.user_id) filter (where a.en >= v_ini)
    into a_ult, a_sem, a_mes, a_per
    from public.kpis_actividad(least(v_ini, v_ref - interval '30 days'), v_fin) a;

  select coalesce(avg(coalesce(c.n, 0)), 0) into a_media
    from generate_series(p_desde::timestamp, v_hoy::timestamp, interval '1 day') d(dia)
    left join (select (a.en at time zone tz)::date dia, count(distinct a.user_id) n
                 from public.kpis_actividad(v_ini, v_fin) a group by 1) c on c.dia = d.dia::date;

  -- Altas del periodo: apuntan en 24 h, grupo en 7 días, por invitación. Solo cuentan en cada base
  -- las altas que ya han cumplido ese plazo.
  with al as (select u.id, u.alta from public.kpis_usuarios() u where u.alta >= v_ini and u.alta < v_fin),
       act as (select a.user_id, a.en from public.kpis_actividad(v_ini, now() + interval '1 minute') a)
  select count(*),
         count(*) filter (where al.alta + interval '24 hours' <= now()),
         count(*) filter (where al.alta + interval '24 hours' <= now() and exists (
           select 1 from act where act.user_id = al.id and act.en >= al.alta and act.en < al.alta + interval '24 hours')),
         count(*) filter (where al.alta + interval '7 days' <= now()),
         count(*) filter (where al.alta + interval '7 days' <= now() and exists (
           select 1 from public.grupo_miembros gm
            where gm.user_id = al.id and gm.created_at < al.alta + interval '7 days'
              and (select count(*) from public.grupo_miembros g2 where g2.grupo_id = gm.grupo_id) >= 2)),
         count(*) filter (where
              exists (select 1 from public.grupo_miembros gm join public.grupos g on g.id = gm.grupo_id
                       where gm.user_id = al.id and gm.created_at < al.alta + interval '24 hours'
                         and g.creado_por is distinct from al.id)
           or exists (select 1 from public.grupo_invitaciones i where i.usada_por = al.id and i.usada_en < al.alta + interval '24 hours')
           or exists (select 1 from public.invitado_enlaces e where e.usado_por = al.id and e.usado_en < al.alta + interval '24 hours'))
    into al_n, al_b24, al_24, al_b7, al_g7, al_inv
    from al;

  -- Retención por semana de alta: % activas entre los días 7 y 13 y entre los días 30 y 36 tras el alta.
  with al as (select u.id, u.alta, date_trunc('week', u.alta at time zone tz)::date semana
                from public.kpis_usuarios() u where u.alta >= v_coh and u.alta < v_fin),
       act as (select a.user_id, a.en from public.kpis_actividad(v_coh, now() + interval '1 minute') a),
       x as (select al.semana,
                    al.alta + interval '14 days' <= now() m7,
                    al.alta + interval '37 days' <= now() m30,
                    exists (select 1 from act where act.user_id = al.id and act.en >= al.alta + interval '7 days'
                                                and act.en < al.alta + interval '14 days') a7,
                    exists (select 1 from act where act.user_id = al.id and act.en >= al.alta + interval '30 days'
                                                and act.en < al.alta + interval '37 days') a30
               from al),
       s as (select semana, count(*) n, count(*) filter (where m7) b7, count(*) filter (where m7 and a7) x7,
                    count(*) filter (where m30) b30, count(*) filter (where m30 and a30) x30
               from x group by semana)
  select coalesce(jsonb_agg(jsonb_build_object(
           'semana', s.semana, 'altas', public.kpis_n(s.n),
           'base_7d', public.kpis_n(s.b7), 'ret_7d_pct', public.kpis_pct(s.x7, s.b7),
           'base_30d', public.kpis_n(s.b30), 'ret_30d_pct', public.kpis_pct(s.x30, s.b30)) order by s.semana), '[]'::jsonb)
    into retencion from s;

  -- Grupos: creados en el periodo (de cuentas que cuentan), abiertos y activos
  -- (activo = abierto, 2 o más personas con cuenta y algún gasto o pago creado en el periodo / en los últimos 7 días).
  select count(*) filter (where g.tipo = 'grupo' and g.created_at >= v_ini and g.created_at < v_fin),
         count(*) filter (where g.tipo = 'directo' and g.created_at >= v_ini and g.created_at < v_fin),
         count(*) filter (where g.tipo = 'grupo' and g.cerrado is null)
    into g_cre, g_dir, g_abiertos
    from public.grupos g
   where not exists (select 1 from public.kpis_excluidas x where x.user_id = g.creado_por);

  with v as (select g.id from public.grupos g
              where g.cerrado is null
                and (select count(*) from public.grupo_miembros m
                      where m.grupo_id = g.id and m.baja is null
                        and not exists (select 1 from public.kpis_excluidas x where x.user_id = m.user_id)) >= 2)
  select count(*) filter (where exists (select 1 from public.compartidos c where c.grupo_id = v.id
                                         and c.created_at >= v_ini and c.created_at < v_fin)),
         count(*) filter (where exists (select 1 from public.compartidos c where c.grupo_id = v.id
                                         and c.created_at >= v_ref - interval '7 days' and c.created_at < v_fin))
    into g_act, g_act7 from v;

  -- Personas por grupo (grupos abiertos de tipo «grupo»): con cuenta y sin cuenta.
  with t as (select (select count(*) from public.grupo_miembros m where m.grupo_id = g.id and m.baja is null
                       and not exists (select 1 from public.kpis_excluidas x where x.user_id = m.user_id)) con,
                    (select count(*) from public.grupo_invitados i where i.grupo_id = g.id and i.baja is null
                       and i.reclamado_por is null) sin
               from public.grupos g where g.tipo = 'grupo' and g.cerrado is null)
  select count(*), avg(con), percentile_cont(0.5) within group (order by con), avg(sin),
         count(*) filter (where con = 1), count(*) filter (where con = 2),
         count(*) filter (where con between 3 and 5), count(*) filter (where con >= 6)
    into pg_n, pg_media, pg_mediana, pg_sin, pg_1, pg_2, pg_3_5, pg_6
    from t where con >= 1;

  -- Uso de herramientas, 1: lo que tiene configurado hoy cada cuenta viva (solo se mira si existe y cuántos hay, nunca qué).
  with u as (select id from public.kpis_usuarios() where borrada is null),
       c as (select cf.value v from public.config cf join u on u.id = cf.user_id where cf.key = 'app')
  select jsonb_build_object(
    'cuentas_bancarias', public.kpis_n(count(*) filter (where public.kpis_largo(v -> 'cuentas') >= 1)),
    'varias_cuentas', public.kpis_n(count(*) filter (where public.kpis_largo(v -> 'cuentas') >= 2)),
    'metas', public.kpis_n(count(*) filter (where public.kpis_largo(v -> 'ahorro') >= 1)),
    'deudas', public.kpis_n(count(*) filter (where public.kpis_largo(v -> 'deudas') >= 1)),
    'importar_extracto', public.kpis_n(count(*) filter (where public.kpis_largo(v -> 'importLotes') >= 1)),
    'pagos_fijos', public.kpis_n(count(*) filter (where public.kpis_largo(v -> 'facturas') >= 1)),
    'cobros_fijos', public.kpis_n(count(*) filter (where public.kpis_largo(v -> 'cobros') >= 1)),
    'trayecto', public.kpis_n(count(*) filter (where coalesce(jsonb_typeof(v -> 'trayecto'), 'null') <> 'null')),
    'informes', public.kpis_n(count(*) filter (where v -> 'informes' ->> 'on' = 'true')),
    'inicio_a_su_gusto', public.kpis_n(count(*) filter (where public.kpis_largo(v -> 'inicioWidgets') >= 1)),
    'con_configuracion', public.kpis_n(count(*)))
    into uso from c;

  -- Uso de herramientas, 2: lo que han hecho en el periodo (personas distintas).
  with u as (select id from public.kpis_usuarios() where borrada is null)
  select jsonb_build_object(
    'tickets', public.kpis_n((select count(distinct t.user_id) from public.tickets_uso t join u on u.id = t.user_id
                               where t.created_at >= v_ini and t.created_at < v_fin)),
    'inversiones', public.kpis_n((select count(distinct m.user_id) from public.movimientos m join u on u.id = m.user_id
                               where m.tipo = 'Inversión' and m.created_at >= v_ini and m.created_at < v_fin)),
    'traspasos', public.kpis_n((select count(distinct m.user_id) from public.movimientos m join u on u.id = m.user_id
                               where m.tipo = 'Traspaso' and m.created_at >= v_ini and m.created_at < v_fin)),
    'apartar_ahorro', public.kpis_n((select count(distinct m.user_id) from public.movimientos m join u on u.id = m.user_id
                               where m.tipo = 'Ahorro' and m.created_at >= v_ini and m.created_at < v_fin)),
    'tareas', public.kpis_n((select count(distinct t.user_id) from public.tareas t join u on u.id = t.user_id
                               where t.created_at >= v_ini and t.created_at < v_fin)),
    'agenda_compartida_y_planes', public.kpis_n((select count(distinct a.creado_por) from public.agenda a join u on u.id = a.creado_por
                               where a.created_at >= v_ini and a.created_at < v_fin)),
    'juntos_apuntan', public.kpis_n((select count(distinct c.creado_por) from public.compartidos c join u on u.id = c.creado_por
                               where c.created_at >= v_ini and c.created_at < v_fin)),
    'en_algun_grupo_hoy', public.kpis_n((select count(distinct m.user_id) from public.grupo_miembros m join u on u.id = m.user_id
                               where m.baja is null)),
    'comparten_su_agenda_hoy', public.kpis_n((select count(distinct p.dueno) from public.agenda_permisos p join u on u.id = p.dueno)),
    'aportan_a_metas_compartidas_alguna_vez', public.kpis_n((select count(distinct o.user_id) from public.objetivo_aportes o
                               join u on u.id = o.user_id)))
    into uso2;

  -- ---------- MARKETING ----------
  select count(*) filter (where i.created_at >= v_ini and i.created_at < v_fin),
         count(*) filter (where i.created_at >= v_ini and i.created_at < v_fin
                            and (i.usada_por is not null or i.usada_en is not null or coalesce(i.usos, 0) > 0)),
         count(*) filter (where i.usada_en >= v_ini and i.usada_en < v_fin)
    into i_cre, i_usadas, i_usadas_per
    from public.grupo_invitaciones i
   where not exists (select 1 from public.kpis_excluidas x where x.user_id = i.creado_por);

  select count(*) filter (where e.created_at >= v_ini and e.created_at < v_fin),
         count(*) filter (where e.created_at >= v_ini and e.created_at < v_fin and e.usado_en is not null)
    into e_cre, e_usados
    from public.invitado_enlaces e
   where not exists (select 1 from public.kpis_excluidas x where x.user_id = e.creado_por);

  -- Crecimiento por semana (lunes a domingo, hora de Madrid) dentro del periodo.
  with s as (select d::date semana, d at time zone tz ini, (d + interval '7 days') at time zone tz fin
               from generate_series(date_trunc('week', p_desde::timestamp), date_trunc('week', p_hasta::timestamp), interval '1 week') d),
       u as (select alta, borrada from public.kpis_usuarios()),
       q as (select s.semana,
                    (select count(*) from u where u.alta >= s.ini and u.alta < s.fin) altas,
                    (select count(*) from u where u.alta < s.fin and (u.borrada is null or u.borrada >= s.fin)) total,
                    (select count(distinct a.user_id) from public.kpis_actividad(s.ini, s.fin) a) act
               from s)
  select coalesce(jsonb_agg(jsonb_build_object(
           'semana', q.semana, 'altas', public.kpis_n(q.altas), 'cuentas_al_acabar', public.kpis_n(q.total),
           'activas', public.kpis_n(q.act), 'crecimiento_pct', public.kpis_pct(q.altas, q.total - q.altas)) order by q.semana), '[]'::jsonb)
    into semanas from q;

  -- ---------- DATOS Y SEGURIDAD ----------
  v_bytes := pg_database_size(current_database());
  for r in select c.relname from pg_catalog.pg_class c join pg_catalog.pg_namespace s on s.oid = c.relnamespace
            where s.nspname = 'public' and c.relkind in ('r', 'p') order by c.relname loop
    execute format('select count(*) from public.%I', r.relname) into n;
    filas := filas || jsonb_build_object(r.relname, jsonb_build_object(
      'filas', n, 'mb', round(pg_total_relation_size(format('public.%I', r.relname)::regclass) / 1048576.0, 2)));
  end loop;

  select count(*) filter (where u.borrada is null),
         count(*) filter (where u.borrada is null and u.ultimo_acceso >= v_ref - interval '30 days'),
         count(*) filter (where u.borrada >= v_ini and u.borrada < v_fin),
         count(*) filter (where u.borrada is not null)
    into u_total, u_auth30, u_borr_per, u_borr_total
    from public.kpis_usuarios() u;

  -- Lecturas de tickets por modelo en el periodo (sin las cuentas de prueba).
  select coalesce(jsonb_object_agg(q.modelo, jsonb_build_object(
           'lecturas', public.kpis_n(q.n), 'bien', public.kpis_n(q.bien), 'fallidas', public.kpis_n(q.mal),
           'personas', public.kpis_n(q.personas), 'tokens_entrada', q.t_in, 'tokens_salida', q.t_out)), '{}'::jsonb),
         coalesce(sum(q.n), 0), coalesce(sum(q.mal), 0),
         coalesce(jsonb_object_agg(q.modelo, public.kpis_pct(q.mal, q.n)), '{}'::jsonb)
    into tickets, t_total, t_fallos, t_fallos_mod
    from (select coalesce(t.modelo, '?') modelo, count(*) n, count(*) filter (where t.ok is true) bien,
                 count(*) filter (where t.ok is not true) mal, count(distinct t.user_id) personas,
                 coalesce(sum(t.tokens_entrada), 0) t_in, coalesce(sum(t.tokens_salida), 0) t_out
            from public.tickets_uso t
           where t.created_at >= v_ini and t.created_at < v_fin
             and not exists (select 1 from public.kpis_excluidas x where x.user_id = t.user_id)
           group by 1) q;

  -- Coste del mes de «hasta» (del día 1 a «hasta»). Aquí cuentan TODAS las lecturas, también las de prueba: es lo que se paga.
  select coalesce(sum(case when t.modelo ilike '%sonnet%' then coalesce(t.tokens_entrada, 0) * p_sonnet_in + coalesce(t.tokens_salida, 0) * p_sonnet_out
                           when t.modelo ilike '%haiku%'  then coalesce(t.tokens_entrada, 0) * p_haiku_in  + coalesce(t.tokens_salida, 0) * p_haiku_out
                           else 0 end) / 1000000.0, 0),
         count(*) filter (where t.tokens_entrada is null or not (t.modelo ilike '%sonnet%' or t.modelo ilike '%haiku%'))
    into c_tickets, c_sin_tokens
    from public.tickets_uso t where t.created_at >= v_mes and t.created_at < v_fin;
  -- Facturas apuntadas a mano ese mes (fuente 'coste', en USD), si las hay.
  select coalesce(sum(k.valor), 0) into c_otros
    from public.kpis_manual k where k.fuente = 'coste' and k.fecha >= v_mes::date and k.fecha <= p_hasta;
  c_total := round(c_tickets + supabase_usd + c_otros, 4);

  pct_bd := round(100.0 * v_bytes / (limite_mb * 1048576), 1);
  aviso := case when greatest(pct_bd, 100.0 * u_auth30 / limite_usuarios) >= 90 then 'rojo'
                when greatest(pct_bd, 100.0 * u_auth30 / limite_usuarios) >= 70 then 'ambar' else 'verde' end;

  -- ---------- CALIDAD ----------
  begin
    select coalesce(jsonb_object_agg(q.jobname, jsonb_build_object('ejecuciones', q.n, 'fallos', q.f)), '{}'::jsonb) into v_cron
      from (select j.jobname, count(*) n, count(*) filter (where d.status = 'failed') f
              from cron.job_run_details d join cron.job j on j.jobid = d.jobid
             where d.start_time >= v_ini and d.start_time < v_fin group by j.jobname) q;
  exception when others then v_cron := null;
  end;

  -- ---------- A MANO (última cifra de cada fuente y clave dentro del periodo) ----------
  select coalesce(jsonb_object_agg(b.fuente, b.claves), '{}'::jsonb) into manual
    from (select a.fuente, jsonb_object_agg(a.clave, a.valor) claves
            from (select distinct on (k.fuente, k.clave) k.fuente, k.clave, k.valor
                    from public.kpis_manual k where k.fecha between p_desde and p_hasta
                   order by k.fuente, k.clave, k.fecha desc) a
           group by a.fuente) b;

  return jsonb_build_object(
    'periodo', jsonb_build_object('desde', p_desde, 'hasta', p_hasta, 'calculado', now(), 'version', 1,
                                  'nota', '"<5" = entre 1 y 4 personas; null = aún no hay base para calcularlo'),
    'producto', jsonb_build_object(
      'altas', public.kpis_n(al_n),
      'apuntan_en_24h', jsonb_build_object('base', public.kpis_n(al_b24), 'pct', public.kpis_pct(al_24, al_b24)),
      'grupo_en_7_dias', jsonb_build_object('base', public.kpis_n(al_b7), 'pct', public.kpis_pct(al_g7, al_b7)),
      'activas', jsonb_build_object(
        'ultimo_dia', public.kpis_n(a_ult), 'media_al_dia', public.kpis_n(round(a_media, 1)),
        'semana', public.kpis_n(a_sem), 'mes', public.kpis_n(a_mes), 'periodo', public.kpis_n(a_per),
        'dia_entre_mes_pct', case when a_mes < 5 then public.kpis_pct(0, a_mes) else to_jsonb(round(100.0 * a_media / a_mes, 1)) end),
      'retencion_por_semana_de_alta', retencion,
      'grupos', jsonb_build_object(
        'creados', public.kpis_n(g_cre), 'directos_creados', public.kpis_n(g_dir), 'abiertos', public.kpis_n(g_abiertos),
        'activos_periodo', public.kpis_n(g_act), 'activos_7_dias', public.kpis_n(g_act7)),
      'personas_por_grupo', jsonb_build_object(
        'grupos', public.kpis_n(pg_n),
        'media', case when pg_n < 5 then public.kpis_pct(0, pg_n) else to_jsonb(round(pg_media, 1)) end,
        'mediana', case when pg_n < 5 then public.kpis_pct(0, pg_n) else to_jsonb(pg_mediana) end,
        'sin_cuenta_media', case when pg_n < 5 then public.kpis_pct(0, pg_n) else to_jsonb(round(pg_sin, 1)) end,
        'grupos_de_1', public.kpis_n(pg_1), 'grupos_de_2', public.kpis_n(pg_2),
        'grupos_de_3_a_5', public.kpis_n(pg_3_5), 'grupos_de_6_o_mas', public.kpis_n(pg_6)),
      'herramientas_configuradas_hoy', uso,
      'herramientas_usadas_en_periodo', uso2),
    'marketing', jsonb_build_object(
      'invitaciones', jsonb_build_object('creadas', public.kpis_n(i_cre), 'usadas_de_esas', public.kpis_n(i_usadas),
                                         'usadas_pct', public.kpis_pct(i_usadas, i_cre), 'usadas_en_periodo', public.kpis_n(i_usadas_per)),
      'enlaces_sin_cuenta', jsonb_build_object('creados', public.kpis_n(e_cre), 'usados', public.kpis_n(e_usados)),
      'altas_por_invitacion', public.kpis_n(al_inv),
      'altas_directas', public.kpis_n(al_n - al_inv),
      'invitacion_entre_directa', case when al_n - al_inv = 0 then 'null'::jsonb
                                       when (al_inv between 1 and 4) or (al_n - al_inv between 1 and 4) then to_jsonb('<5'::text)
                                       else to_jsonb(round(al_inv::numeric / (al_n - al_inv), 2)) end,
      'crecimiento_semanal', semanas),
    'datos_seguridad', jsonb_build_object(
      'base_de_datos_mb', round(v_bytes / 1048576.0, 1),
      'base_de_datos_pct_de_500mb', pct_bd,
      'filas_por_tabla', filas,
      'usuarios_auth', jsonb_build_object('cuentas_vivas', public.kpis_n(u_total), 'entraron_30_dias', public.kpis_n(u_auth30),
                                          'pct_de_50000', case when u_auth30 > 0 and u_auth30 < 5 then public.kpis_n(u_auth30)
                                                               else to_jsonb(round(100.0 * u_auth30 / limite_usuarios, 3)) end),
      'cuentas_borradas', jsonb_build_object('en_periodo', public.kpis_n(u_borr_per), 'total', public.kpis_n(u_borr_total)),
      'tickets_por_modelo', tickets,
      'coste_mes', jsonb_build_object('mes', to_char(p_hasta, 'YYYY-MM'), 'tickets_usd', round(c_tickets, 4),
                                      'lecturas_sin_precio', c_sin_tokens, 'supabase_usd', supabase_usd, 'apuntado_a_mano_usd', c_otros,
                                      'total_usd', c_total,
                                      'por_activa_usd', case when a_mes >= 5 then to_jsonb(round(c_total / a_mes, 4)) else 'null'::jsonb end),
      'plan_gratis_aviso', aviso),
    'calidad', jsonb_build_object(
      'tickets_fallidos', public.kpis_n(t_fallos), 'tickets_fallidos_pct', public.kpis_pct(t_fallos, t_total),
      'tickets_fallidos_pct_por_modelo', t_fallos_mod,
      'tareas_programadas', v_cron,
      'cierres_inesperados', 'a mano: kpis_manual, fuentes play / app_store, clave cierres_pct'),
    'a_mano', manual);
end $$;


-- ======================================================================================
-- 4. Lo que se puede llamar
-- ======================================================================================

-- 4a. Para el panel: el dueño (kpis_admins) con su sesión, o el servicio interno (service_role / editor SQL).
create function public.kpis_resumen(p_desde date, p_hasta date) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_rol text := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                         nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role');
begin
  if not (v_rol = 'service_role'
          or (v_rol is null and auth.uid() is null and session_user not in ('authenticator', 'anon', 'authenticated'))
          or public.kpis_es_admin()) then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;
  return public.kpis_calcular(p_desde, p_hasta);
end $$;

-- 4b. Foto del lunes: guarda la semana anterior (lunes a domingo, hora de Madrid). Repetirla la sobrescribe.
create function public.kpis_guardar_semana() returns date
language plpgsql security definer set search_path = '' as $$
declare v_lunes date := date_trunc('week', now() at time zone 'Europe/Madrid')::date - 7;
begin
  insert into public.kpis_historial (semana, datos) values (v_lunes, public.kpis_calcular(v_lunes, v_lunes + 6))
  on conflict (semana) do update set datos = excluded.datos, creado = now();
  return v_lunes;
end $$;

-- 4c. Permisos de las funciones. Supabase da permiso a todo el mundo por defecto: se quita y se da solo lo justo.
revoke execute on function public.kpis_calcular(date, date), public.kpis_guardar_semana(), public.kpis_usuarios(),
  public.kpis_actividad(timestamptz, timestamptz), public.kpis_n(numeric), public.kpis_pct(numeric, numeric),
  public.kpis_largo(jsonb), public.kpis_resumen(date, date), public.kpis_es_admin()
  from public, anon, authenticated, service_role;
grant execute on function public.kpis_resumen(date, date) to authenticated, service_role;
grant execute on function public.kpis_es_admin() to authenticated;

-- 4d. Permisos y reglas de las tablas.
grant select on public.kpis_historial to authenticated;
create policy kpis_historial_ver on public.kpis_historial for select to authenticated using (public.kpis_es_admin());

grant select, insert, update, delete on public.kpis_manual to authenticated;
create policy kpis_manual_ver on public.kpis_manual for select to authenticated using (public.kpis_es_admin());
create policy kpis_manual_crear on public.kpis_manual for insert to authenticated with check (public.kpis_es_admin());
create policy kpis_manual_cambiar on public.kpis_manual for update to authenticated using (public.kpis_es_admin()) with check (public.kpis_es_admin());
create policy kpis_manual_borrar on public.kpis_manual for delete to authenticated using (public.kpis_es_admin());


-- ======================================================================================
-- 5. Tarea programada: lunes 06:00 UTC (07:00 en Madrid en invierno, 08:00 en verano)
-- ======================================================================================
select cron.schedule('kpis-semana', '0 6 * * 1', $$select public.kpis_guardar_semana()$$);

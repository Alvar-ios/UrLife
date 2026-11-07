-- 07/11/2026 · Recarga diaria de precios_carburante desde la base de datos (pg_net + pg_cron). SIN APLICAR: espera el «sí» del dueño.
-- Por qué: la función «trayecto» no consigue descargar la web del Ministerio, pero la base de datos sí (probado el 07/11:
-- 11.477 gasolineras; gasóleo A 1,899 y gasolina 95 1,699 de mediana en España). Solo toca la tabla pública de precios.
-- Marcha atrás: select cron.unschedule('carburantes-pedir'); select cron.unschedule('carburantes-guardar');
--               drop function public.carburantes_pedir(); drop function public.carburantes_guardar();
create or replace function public.carburantes_pedir() returns bigint language sql security definer set search_path = public, net, pg_temp as $$
  select net.http_get('https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/',
    headers := '{"Accept":"application/json"}'::jsonb, timeout_milliseconds := 120000);
$$;
create or replace function public.carburantes_guardar() returns int language plpgsql security definer set search_path = public, net, pg_temp as $$
declare n int;
begin
  with m(campo, prod) as (values ('Precio Gasoleo A','goA'),('Precio Gasoleo Premium','goP'),('Precio Diésel Renovable','goR'),('Precio Biodiesel','bio'),('Precio Gasolina 95 E5','g95'),('Precio Gasolina 95 E10','g95e10'),('Precio Gasolina 95 E5 Premium','g95p'),('Precio Gasolina 98 E5','g98'),('Precio Bioetanol','bioet'),('Precio Gases licuados del petróleo','glp'),('Precio Gas Natural Comprimido','gnc'),('Precio Gas Natural Licuado','gnl'),('Precio Hidrogeno','h2')),
  r as (select content::jsonb j from net._http_response where status_code = 200 and content like '%ListaEESSPrecio%' and created > now() - interval '2 hours' order by created desc limit 1),
  e as (select x from r, jsonb_array_elements(r.j->'ListaEESSPrecio') x where coalesce(x->>'Tipo Venta','P') = 'P'),
  p as (select lpad(x->>'IDProvincia',2,'0') prov, m.prod, replace(x->>m.campo, ',', '.')::numeric precio from e cross join m where coalesce(x->>m.campo,'') ~ '^[0-9]+,[0-9]+$'),
  q as (select * from p where precio > 0.2 and precio < 40),
  f as (select prov provincia, prod producto, round(percentile_cont(0.5) within group (order by precio)::numeric, 3) precio, count(*)::int gasolineras from q group by prov, prod
        union all select 'ES', prod, round(percentile_cont(0.5) within group (order by precio)::numeric, 3), count(*)::int from q group by prod)
  insert into public.precios_carburante (fecha, provincia, producto, precio, gasolineras)
  select (now() at time zone 'Europe/Madrid')::date, provincia, producto, precio, gasolineras from f where provincia ~ '^(ES|[0-9]{2})$'
  on conflict (fecha, provincia, producto) do update set precio = excluded.precio, gasolineras = excluded.gasolineras;
  get diagnostics n = row_count;
  delete from public.precios_carburante where fecha < (now() at time zone 'Europe/Madrid')::date - 60;
  return n;
end $$;
revoke execute on function public.carburantes_pedir() from public, anon, authenticated;
revoke execute on function public.carburantes_guardar() from public, anon, authenticated;
select cron.schedule('carburantes-pedir', '20 5 * * *', $$select public.carburantes_pedir()$$);     -- 06:20 en Madrid (invierno)
select cron.schedule('carburantes-guardar', '35 5 * * *', $$select public.carburantes_guardar()$$); -- 15 minutos después

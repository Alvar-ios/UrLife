-- 07/11/2026 · precios_carburante (docs/31, calculadora de trayecto). SIN APLICAR: espera la revisión de Datos y Seguridad y el «sí» del dueño.
-- Solo AÑADE una tabla nueva con datos públicos del Ministerio y de Red Eléctrica (precio mediano por provincia y día).
-- No contiene datos de ningún usuario. La app solo la lee; la escribe la función «trayecto» (con su clave de servicio).
-- Marcha atrás: drop table public.precios_carburante;
create table if not exists public.precios_carburante (
  fecha date not null,
  provincia text not null check (provincia ~ '^(ES|[0-9]{2})$'),
  producto text not null check (char_length(producto) <= 12),
  precio numeric(8,3) not null check (precio > 0 and precio < 100),
  gasolineras integer,
  primary key (fecha, provincia, producto)
);
alter table public.precios_carburante enable row level security;
create policy "precios_carburante se lee con sesión" on public.precios_carburante for select to authenticated using (true);
-- sin políticas de insert/update/delete: solo la función (service_role) escribe

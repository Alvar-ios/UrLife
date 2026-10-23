-- 23/10/2026 · objetivos_forma (APLICADA). Ver docs/18-datos-forma-temas.md.
-- Forma de una meta compartida (o icono de una deuda compartida). Aditiva: columna vacía en todas las filas.
-- Vacía = la app elige la forma por el nombre (como antes).
alter table public.objetivos_compartidos
  add column forma text
  constraint objetivos_compartidos_forma_check
  check (forma is null or forma ~ '^[a-z][A-Za-z0-9]{0,19}$');
comment on column public.objetivos_compartidos.forma is
  'Clave corta de la forma (metas) o del icono (deudas). Vacía = la elige la app por el nombre.';
notify pgrst, 'reload schema';
-- Deshacer: volver antes a una app que no use «forma» y después
--   alter table public.objetivos_compartidos drop column forma; notify pgrst, 'reload schema';

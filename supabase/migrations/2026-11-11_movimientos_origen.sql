-- 11/11/2026 · APLICADA (con el «sí» del dueño). Aditiva: una columna vacía y opcional; no cambia ningún movimiento.
-- Para marcar los movimientos apuntados desde los avisos del banco (docs/39, docs/39b). Nunca guarda el texto del aviso.
alter table public.movimientos
  add column if not exists origen text
  check (origen is null or origen ~ '^[a-z_]{1,20}$');
comment on column public.movimientos.origen is
  'De dónde vino el movimiento (p. ej. aviso). Vacío = apuntado a mano o de antes.';
-- Deshacer: alter table public.movimientos drop column origen;

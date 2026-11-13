-- 13/11/2026 · APLICADA. Decisión del dueño (docs/salud/2026-11-12-diag-datos §3.2).
-- Antes se comprobó que la copia cifrada del 13/11 (Actions, run 43491189642) las contiene: 18 + 12 + 337 + 713 filas.
-- borrar_cuenta_datos comprueba si cada tabla existe, así que sigue funcionando sin ellas.
drop table if exists public.backup_movimientos_20261008, public.backup_movimientos_20261012,
                     public.backup_compartidos_20261012, public.backup_config_20261012;

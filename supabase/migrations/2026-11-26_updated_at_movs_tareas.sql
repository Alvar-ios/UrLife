-- 26/11/2026 · Sin conexión (docs/52): saber cuándo se cambió por última vez un movimiento o una tarea,
-- para detectar conflictos al volver la red. SOLO ADITIVA: dos columnas nuevas y un disparador. No cambia ni borra datos.
-- (config ya tiene updated_at.)

alter table public.movimientos add column if not exists updated_at timestamptz not null default now();
alter table public.tareas      add column if not exists updated_at timestamptz not null default now();

create or replace function public.poner_updated_at() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists movimientos_updated_at on public.movimientos;
create trigger movimientos_updated_at before update on public.movimientos
  for each row execute function public.poner_updated_at();

drop trigger if exists tareas_updated_at on public.tareas;
create trigger tareas_updated_at before update on public.tareas
  for each row execute function public.poner_updated_at();

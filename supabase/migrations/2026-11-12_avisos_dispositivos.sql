-- APLICADA el 12/11/2026 con el «sí a las migraciones» del dueño (12/11, 00:56). Diseño: Datos y Seguridad (docs/salud/2026-11-12-diag-datos.md, avisos-datos).
-- 12/11/2026 · avisos_dispositivos. Aditiva: tabla, reglas y una función nuevas. No toca tablas ni datos existentes.
-- Deshacer: drop function public.avisos_registrar(uuid, text, text, text, text, text); drop table public.avisos_dispositivos;
create table public.avisos_dispositivos (
  id            uuid primary key,                         -- lo pone el móvil; uno nuevo por cada cuenta que entra en él
  user_id       uuid not null references auth.users(id) on delete cascade,
  token         text check (token is null or char_length(token) between 20 and 4096),   -- Firebase; vacío = sin avisos de Juntos
  plataforma    text not null default 'android' check (plataforma in ('android', 'ios', 'web')),
  idioma        text not null default 'es' check (idioma ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  zona          text not null default 'Europe/Madrid' check (char_length(zona) between 1 and 64),
  clave_hash    text check (clave_hash is null or clave_hash ~ '^[0-9a-f]{64}$'),       -- SHA-256 de la clave del móvil (C3); nunca la clave
  guardados_dia date,                                     -- freno de avisos-guardar: día y cuántos lleva
  guardados_n   int not null default 0,
  creado        timestamptz not null default now(),
  visto         timestamptz not null default now(),
  activo        boolean not null default true
);
create index avisos_dispositivos_user on public.avisos_dispositivos (user_id);
create unique index avisos_dispositivos_token on public.avisos_dispositivos (token) where token is not null;
create unique index avisos_dispositivos_clave on public.avisos_dispositivos (clave_hash) where clave_hash is not null;

alter table public.avisos_dispositivos enable row level security;
revoke all on public.avisos_dispositivos from public, anon, authenticated;
grant select, delete on public.avisos_dispositivos to authenticated;
grant update (activo, idioma, zona, visto) on public.avisos_dispositivos to authenticated;
create policy avisos_disp_ver on public.avisos_dispositivos for select to authenticated
  using (user_id = (select auth.uid()));
create policy avisos_disp_cambiar on public.avisos_dispositivos for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy avisos_disp_quitar on public.avisos_dispositivos for delete to authenticated
  using (user_id = (select auth.uid()));
-- No hay regla de INSERT: un móvil solo se apunta con avisos_registrar.

create function public.avisos_registrar(p_id uuid, p_token text, p_plataforma text, p_idioma text, p_zona text,
                                        p_clave_hash text default null) returns uuid
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'sin_sesion'; end if;
  if p_id is null then raise exception 'sin_id'; end if;
  -- El mismo móvil (mismo token o misma clave) deja de servir a cualquier otra fila: la cuenta anterior ya no recibe nada aquí.
  update public.avisos_dispositivos set token = null, clave_hash = null, activo = false
   where id <> p_id and ((p_token is not null and token = p_token) or (p_clave_hash is not null and clave_hash = p_clave_hash));
  if (select count(*) from public.avisos_dispositivos where user_id = v_uid and id <> p_id) >= 10 then
    raise exception 'demasiados_moviles';
  end if;
  insert into public.avisos_dispositivos (id, user_id, token, plataforma, idioma, zona, clave_hash)
  values (p_id, v_uid, p_token, coalesce(p_plataforma, 'android'), coalesce(p_idioma, 'es'), coalesce(p_zona, 'Europe/Madrid'), p_clave_hash)
  on conflict (id) do update set token = excluded.token, idioma = excluded.idioma, zona = excluded.zona,
    clave_hash = coalesce(excluded.clave_hash, public.avisos_dispositivos.clave_hash), visto = now(), activo = true
    where public.avisos_dispositivos.user_id = v_uid;
  if not found then raise exception 'id_de_otro'; end if;   -- ese id es de otra cuenta: el móvil debe generar uno nuevo
  return p_id;
end $$;
revoke all on function public.avisos_registrar(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.avisos_registrar(uuid, text, text, text, text, text) to authenticated;

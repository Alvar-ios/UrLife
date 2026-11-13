-- 13/11/2026 · avisos_juntos. SIN APLICAR: necesita el «sí» del dueño. Aditiva: una tabla, funciones y disparadores nuevos.
-- No cambia ninguna tabla ni función que ya exista, y no toca ningún dato.
-- Qué hace: cuando alguien apunta un gasto compartido, paga/salda a otro o entra en un grupo, la base de datos llama a la
-- función de borde «avisar» (pg_net), que manda un aviso (Firebase Cloud Messaging) a los móviles de las OTRAS personas.
-- Un disparador nunca puede hacer fallar el guardado: si algo va mal, se apunta un aviso en el registro y sigue.
--
-- ANTES DE APLICAR:
--   1. Desplegar la función «avisar» (supabase/functions/avisar) SIN «Verify JWT» (va protegida con avisar_secreto).
--      Necesita el secreto FCM_SERVICE_ACCOUNT (ya está). No hace falta ningún secreto más.
--   2. Comprobar (solo lee):
--      select extname from pg_extension where extname in ('pg_net', 'supabase_vault', 'pgcrypto');   -- las tres
--      select tgname from pg_trigger where tgrelid in ('public.compartidos'::regclass, 'public.grupo_miembros'::regclass) and not tgisinternal;
--
-- CÓMO SE DESHACE (no toca ningún gasto ni grupo):
--   drop trigger if exists avisar_compartido on public.compartidos;
--   drop trigger if exists avisar_miembro on public.grupo_miembros;
--   drop function if exists public.avisar_compartido(), public.avisar_miembro(), public.avisar_llamar(jsonb),
--     public.avisar_secreto_ok(text), public.avisar_apuntar(uuid, text, int), public.avisos_token(uuid, text, text, text);
--   drop table if exists public.avisos_enviados;
--   delete from vault.secrets where name = 'avisar_secreto';

-- 1. Lo ya avisado: para no repetir el mismo aviso y para el freno (20 al día por persona). Solo el sistema la usa.
create table public.avisos_enviados (
  id      bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  clave   text not null check (char_length(clave) between 1 and 200),   -- p. ej. c:<gasto>  ·  m:<grupo>:<persona>:<día>
  dia     date not null,                                                 -- día de Madrid
  enviado timestamptz not null default now(),
  unique (user_id, clave)
);
create index avisos_enviados_dia on public.avisos_enviados (user_id, dia);
alter table public.avisos_enviados enable row level security;
revoke all on public.avisos_enviados from public, anon, authenticated;
-- Sin reglas: nadie con sesión la ve ni la toca.

-- 2. El móvil guarda su token de Firebase (sin tocar la clave de «Avisos del banco»). Crea la fila si no existe.
create function public.avisos_token(p_id uuid, p_token text, p_idioma text default 'es', p_zona text default 'Europe/Madrid') returns uuid
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'sin_sesion'; end if;
  if p_id is null then raise exception 'sin_id'; end if;
  if p_token is not null and char_length(p_token) not between 20 and 4096 then raise exception 'token'; end if;
  -- el mismo token en otra fila (otra cuenta que usó este móvil) deja de valer allí
  if p_token is not null then
    update public.avisos_dispositivos set token = null where id <> p_id and token = p_token;
  end if;
  if (select count(*) from public.avisos_dispositivos where user_id = v_uid and id <> p_id) >= 10 then
    raise exception 'demasiados_moviles';
  end if;
  insert into public.avisos_dispositivos (id, user_id, token, plataforma, idioma, zona)
  values (p_id, v_uid, p_token, 'android', coalesce(p_idioma, 'es'), coalesce(p_zona, 'Europe/Madrid'))
  on conflict (id) do update set token = excluded.token, idioma = excluded.idioma, zona = excluded.zona, visto = now(), activo = true
    where public.avisos_dispositivos.user_id = v_uid;
  if not found then raise exception 'id_de_otro'; end if;
  return p_id;
end $$;
revoke all on function public.avisos_token(uuid, text, text, text) from public, anon;
grant execute on function public.avisos_token(uuid, text, text, text) to authenticated;

-- 3. Secreto que comparten la base de datos y la función «avisar». Se genera aquí y vive solo en Vault (nunca en el repositorio).
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'avisar_secreto') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'avisar_secreto', 'Disparadores → función avisar');
  end if;
end $$;

-- La función «avisar» comprueba la cabecera con esto (solo service_role).
create function public.avisar_secreto_ok(p_valor text) returns boolean
language sql stable security definer set search_path to 'public', 'pg_temp' as $$
  select coalesce(p_valor, '') <> '' and exists (select 1 from vault.decrypted_secrets where name = 'avisar_secreto' and decrypted_secret = p_valor);
$$;
revoke all on function public.avisar_secreto_ok(text) from public, anon, authenticated;
grant execute on function public.avisar_secreto_ok(text) to service_role;

-- 4. Freno y «no repetir»: true = se puede mandar (y queda apuntado). Solo service_role.
create function public.avisar_apuntar(p_user uuid, p_clave text, p_max int default 20) returns boolean
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare v_dia date := (now() at time zone 'Europe/Madrid')::date; n int;
begin
  delete from public.avisos_enviados where user_id = p_user and dia < v_dia - 30;   -- se guarda un mes como mucho
  perform pg_advisory_xact_lock(hashtext('avisar:' || p_user::text));
  select count(*) into n from public.avisos_enviados where user_id = p_user and dia = v_dia;
  if n >= greatest(coalesce(p_max, 20), 1) then return false; end if;
  insert into public.avisos_enviados (user_id, clave, dia) values (p_user, p_clave, v_dia) on conflict (user_id, clave) do nothing;
  return found;
end $$;
revoke all on function public.avisar_apuntar(uuid, text, int) from public, anon, authenticated;
grant execute on function public.avisar_apuntar(uuid, text, int) to service_role;

-- 5. Llamada a la función de borde (pg_net la manda después de guardar; si no se guarda, no sale).
create function public.avisar_llamar(p_evento jsonb) returns void
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare v_sec text;
begin
  select decrypted_secret into v_sec from vault.decrypted_secrets where name = 'avisar_secreto';
  if v_sec is null then return; end if;
  perform net.http_post(
    url := 'https://slvlovbjccnrtslqbumo.supabase.co/functions/v1/avisar',
    body := p_evento,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-avisar', v_sec),
    timeout_milliseconds := 10000);
end $$;
revoke all on function public.avisar_llamar(jsonb) from public, anon, authenticated;

-- 6. Disparadores. Solo cuando lo hace una persona (con sesión); nunca al recuperar, editar o borrar.
--    a) gasto compartido nuevo  ·  b) pago para saldar (tipo «Liquidación»: «Saldar», «Saldar todo»)
create function public.avisar_compartido() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  if auth.uid() is null or new.borrado is not null or new.tipo not in ('Gasto', 'Liquidación') then return null; end if;
  perform public.avisar_llamar(jsonb_build_object('evento', 'compartido', 'id', new.id));
  return null;
exception when others then
  raise warning 'avisar_compartido: %', sqlerrm;   -- el gasto se guarda igual
  return null;
end $$;
create trigger avisar_compartido after insert on public.compartidos
  for each row execute function public.avisar_compartido();

--    d) alguien entra en un grupo (enlace, «Añadir amigo», ocupar el sitio de una persona sin cuenta) o vuelve a él
create function public.avisar_miembro() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  if auth.uid() is null or new.baja is not null then return null; end if;
  if tg_op = 'UPDATE' and old.baja is null then return null; end if;      -- solo cuando vuelve tras salir
  perform public.avisar_llamar(jsonb_build_object('evento', 'miembro', 'grupo_id', new.grupo_id, 'user_id', new.user_id, 'por', auth.uid()));
  return null;
exception when others then
  raise warning 'avisar_miembro: %', sqlerrm;
  return null;
end $$;
create trigger avisar_miembro after insert or update of baja on public.grupo_miembros
  for each row execute function public.avisar_miembro();

revoke all on function public.avisar_compartido(), public.avisar_miembro() from public, anon, authenticated;
notify pgrst, 'reload schema';

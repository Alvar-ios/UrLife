# Avisos: diseño de datos (C2 y C3)

Departamento de Datos y Seguridad · 12/11/2026 · SQL **solo aditivo**, sin aplicar y sin probar en la base real. Lo aplica la sesión principal con el «sí» ya dado a §5 de `docs/40`.

## 1. Conclusión

1. **Una tabla nueva, `avisos_dispositivos`**, una fila por móvil y cuenta. Cada persona solo ve las suyas. El móvil se apunta con una función (`avisos_registrar`) que, de paso, se lo quita a la cuenta anterior de ese mismo móvil: así los avisos de una persona nunca llegan al móvil que ahora usa otra.
2. **Para guardar con la app cerrada (C3) recomiendo la opción (b): clave propia del móvil.** La opción (a), usar la sesión del usuario desde Android, puede **cerrar la sesión de la app sin querer** y deja en el móvil una llave que lo abre todo.
3. **«Borrar mi cuenta» no borra solo estas tablas**: el borrado de la cuenta es «suave» y las cascadas no saltan. Hay que añadir dos líneas a la función `borrar-cuenta` (la de `supabase/functions/`), sin tocar el SQL de `borrar_cuenta_datos`.
4. **Para Juntos (C2)**: un disparador nuevo sobre el historial del grupo llama a la función `avisar`. El aviso lleva quién y en qué grupo, **nunca importes ni conceptos**. El «máximo 3 al día» y las horas de silencio se deciden en el servidor con una tabla mínima `avisos_enviados` que se limpia a los 30 días.
5. **Hay que cambiar tres frases de `privacidad.html`** y declarar en Google Play el «identificador del dispositivo».

## 2. SQL · `avisos_dispositivos`

```sql
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
```

**Qué hace, en sencillo:** crea una libreta nueva con los móviles de cada persona. Cada uno ve, apaga o quita solo los suyos; nadie sin sesión ve nada. **Qué no hace:** no toca ningún movimiento, gasto ni ajuste.

**Notas para Desarrollo:**
- El `id` se genera en el móvil y se **cambia al cambiar de cuenta**. Al cerrar sesión: borrar la fila (`delete`) si hay red; si no hay, `avisos_registrar` de la siguiente cuenta la deja inservible igualmente.
- «Retirar un móvil» (perdido o robado) = borrar su fila desde otro móvil o desde la web, en Tú → Avisos. Enseñar la lista con plataforma y «visto por última vez».
- La app no debe pedir esta tabla con Realtime ni en la carga inicial: solo al abrir Tú → Avisos.
- Tras aplicarla saldrá un aviso nuevo de Supabase: `avisos_registrar` ejecutable con sesión. Es lo buscado.

### Borrar la cuenta

`borrar-cuenta` hace un borrado suave: la fila de `auth.users` no desaparece y el `on delete cascade` **no salta**. Hay que añadir a `supabase/functions/borrar-cuenta/index.ts`, justo después de la primera llamada a `borrar_cuenta_datos` y otra vez en el barrido final:

```ts
await sb.from('avisos_dispositivos').delete().eq('user_id', id);
await sb.from('avisos_enviados').delete().eq('user_id', id);   // si se crea
```

Así no se cambia `borrar_cuenta_datos` (cambiar una función ya aplicada no sería aditivo). En la app, tras borrar: `avNat().vaciar(true)` y borrar la clave del móvil. Añadir las dos tablas a la consulta de «revisión periódica» de la cabecera de `2026-11-08_borrar_cuenta.sql`.

## 3. C3 · Guardar los avisos del banco con la app cerrada

| | (a) Android guarda en `movimientos` con la sesión del usuario | (b) Clave propia del móvil + función `avisos-guardar` |
|---|---|---|
| Qué hay en el móvil, fuera de la web | La llave de la sesión entera (ver, cambiar y borrar **todo**) | Una clave que solo sirve para apuntar un movimiento «de aviso» y borrar uno reciente |
| ¿Puede renovarse sin la web? | Técnicamente sí, pero las llaves de renovación son de un solo uso: si Android la renueva, la copia de la web queda vieja; pasados 10 segundos, usarla **cierra la sesión entera** [F1] | No hace falta: la clave no caduca hasta que se retira |
| Si roban o prestan el móvil | Hay que cerrar todas las sesiones | Se retira ese móvil desde otro; la cuenta sigue igual |
| Qué hay que construir | Copiar la sesión de la web a Android y coordinar quién renueva. Frágil | Una función nueva y una columna (ya incluida arriba) |
| Quién vigila lo que entra | Las reglas por usuario de siempre | La función: es la única barrera, hay que escribirla con cuidado |
| Riesgo principal | Cierres de sesión sin explicación y pendientes perdidos | Un fallo en la función afectaría a quien tenga la clave; por eso lleva frenos |

**Recomendación: (b).** Menos poder en el móvil, se retira sin molestar y no pone en peligro la sesión. Si la función falla o no hay red, no se pierde nada: el pendiente sigue en la cola del móvil y se guarda al abrir la app, como hoy.

**Cómo debe ser `avisos-guardar` (para Desarrollo; yo la reviso antes de desplegar):**
- La clave: 32 bytes al azar generados en el móvil, guardados en el almacén seguro de Android (nunca en `cfg()` ni en la web); al servidor solo va su SHA-256 por `avisos_registrar`. La función recibe la clave en una cabecera, calcula el SHA-256 y busca la fila `activo = true`. Sin fila: 401 y el móvil deja de intentarlo.
- El `user_id` sale **siempre** de esa fila; cualquier usuario que llegue en la petición se ignora.
- Solo acepta: `id` (el uuid del pendiente, el mismo que usa la app al abrirse), `tipo` (Gasto o Ingreso), `importe` (mayor que 0, con un máximo razonable), `fecha` (hoy ± 7 días), `descripcion` (80 letras), `categoria` (40), `cuenta_id`, `creado_en`. Pone `origen = 'aviso'` ella misma. Nunca el texto del aviso.
- Guarda con «si ya existe ese id, no hagas nada»: un reintento no duplica, y la app al abrirse ya salta los que tienen ese id (`avisosRecoger`).
- «Deshacer» desde el aviso: borra **una** fila con ese `id`, de ese usuario, con `origen = 'aviso'` y creada en los últimos 7 días. Nada más.
- Freno: 50 al día por móvil (`guardados_dia`, `guardados_n`). No escribe nada en los registros salvo códigos de error.
- Publicarla sin «Verify JWT» (no hay sesión) y por eso mismo sin ninguna otra acción dentro.
- Antes de escribirla, confirmar los nombres reales de las columnas: `select column_name, data_type from information_schema.columns where table_schema='public' and table_name='movimientos' order by ordinal_position;`

**Dos cosas que Producto debe saber:** con la app cerrada no están las reglas de categorías del usuario (viven en la web), así que el movimiento entra con una categoría genérica y la app la afina al abrirse, o la web le deja al móvil una tabla pequeña «comercio → categoría». Y la comprobación «ya lo tenías apuntado» (`avisoYaEsta`) tampoco se puede hacer en el servidor igual: hay que repetirla al abrir y ofrecer quitar el repetido.

## 4. C2 · Avisar de lo que hacen otros en Juntos

**Disparador.** Recomiendo colgarlo de `compartidos_historial` (ya recibe una fila por gasto creado, cambiado, borrado o recuperado, con quién lo hizo) y no de `compartidos`, para no tocar el camino por el que se guardan los gastos:

```sql
-- Aditivo: función y disparador nuevos. Si la llamada falla, el gasto se guarda igual.
-- Deshacer: drop trigger avisar_historial on public.compartidos_historial; drop function public.avisar_historial();
create function public.avisar_historial() returns trigger
language plpgsql security definer set search_path to 'public', 'net', 'vault', 'pg_temp' as $$
begin
  if new.accion <> 'creado' or new.hecho_por is null then return new; end if;
  begin
    perform net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'avisar_url'),
      headers := jsonb_build_object('Content-Type', 'application/json',
                 'x-avisar', (select decrypted_secret from vault.decrypted_secrets where name = 'avisar_clave')),
      body := jsonb_build_object('tipo', 'gasto_grupo', 'grupo', new.grupo_id, 'ref', new.compartido_id, 'por', new.hecho_por),
      timeout_milliseconds := 5000);
  exception when others then null;   -- nunca romper un gasto por un aviso
  end;
  return new;
end $$;
revoke all on function public.avisar_historial() from public, anon, authenticated;
create trigger avisar_historial after insert on public.compartidos_historial
  for each row execute function public.avisar_historial();
```

La dirección y la clave de `avisar` se guardan en el almacén de secretos de la base (Vault), **nunca en el SQL del repositorio**. La llamada no espera respuesta, así que guardar un gasto no se hace más lento. Para «te han saldado» vale el mismo disparador (el pago es un compartido); «te han invitado a un grupo» necesitaría otro igual sobre `grupo_miembros`, en una segunda tanda.

**Función `avisar`** (de Supabase, sin «Verify JWT», solo acepta la cabecera secreta):
1. Lee el gasto y a quién toca (los del reparto, menos quien lo apuntó, solo miembros activos).
2. Para cada persona: mira sus preferencias (`config` → `avisos`) y sus móviles activos con token.
3. Aplica silencio y tope (abajo) y manda a Firebase. Si Firebase dice que el token ya no existe, pone `token = null, activo = false`.

**Qué lleva el aviso.** Solo: tipo, código del grupo, código del gasto, nombre del grupo y nombre de quien lo hizo (el que usa en ese grupo). **Nunca importe, concepto ni categoría**: ni en pantalla bloqueada ni en el mensaje, porque pasa por Google. Texto: «Ana ha apuntado un gasto en Piso». El móvil lo pinta como ya hace con los del banco: versión pública «PalomApp · Novedades en un grupo» con el móvil bloqueado. La cifra se ve al abrir.

**Máximo 3 al día y silencio.** Tiene que decidirlo el servidor (el móvil está cerrado). Tabla mínima:

```sql
-- Aditiva. Deshacer: select cron.unschedule('limpiar-avisos-enviados'); drop function public.limpiar_avisos_enviados(); drop table public.avisos_enviados;
create table public.avisos_enviados (
  id       bigint generated always as identity primary key,
  user_id  uuid not null references auth.users(id) on delete cascade,
  tipo     text not null check (tipo ~ '^[a-z_]{1,30}$'),
  nivel    text not null default 'normal' check (nivel in ('importante', 'normal', 'resumen')),
  grupo_id uuid,
  ref      uuid,
  estado   text not null default 'enviado' check (estado in ('enviado', 'silencio', 'tope', 'apagado')),
  enviado  timestamptz not null default now(),
  unique (user_id, tipo, ref)                      -- el mismo aviso no sale dos veces
);
create index avisos_enviados_user_dia on public.avisos_enviados (user_id, enviado desc);
alter table public.avisos_enviados enable row level security;
revoke all on public.avisos_enviados from public, anon, authenticated;   -- sin reglas: solo el sistema

create function public.limpiar_avisos_enviados() returns int
language sql security definer set search_path to 'public', 'pg_temp' as $$
  with b as (delete from public.avisos_enviados where enviado < now() - interval '30 days' returning 1) select count(*)::int from b;
$$;
revoke all on function public.limpiar_avisos_enviados() from public, anon, authenticated;
select cron.schedule('limpiar-avisos-enviados', '25 3 * * *', $$select public.limpiar_avisos_enviados()$$);
```

- Sin textos, sin importes: solo códigos. Guarda quién, qué tipo y cuándo.
- **Tope:** antes de mandar un aviso «normal», `avisar` cuenta los `enviado` de hoy (día según la `zona` del móvil). Con 3, apunta `tope` y no manda. Los «importantes» no cuentan.
- **Agrupar:** un mismo grupo usa siempre la misma etiqueta en Firebase, así el segundo aviso sustituye al primero («3 gastos nuevos en Piso») y cuenta como uno.
- **Silencio (22:00–9:00 por defecto, de `cfg().avisos`):** en esas horas no se manda y se apunta `silencio`. Propuesta sencilla: no se reenvían por la mañana; se ven al abrir la app (el historial del grupo ya los enseña). Decide Producto.
- La limpieza borra solo filas de este registro con más de 30 días, como ya se hace con el historial.

**Firebase:** la llave de servicio va en un secreto de Supabase, nunca en el repositorio. `google-services.json` no es una contraseña, pero al ser público el repositorio es mejor meterlo desde un secreto de GitHub en `android.yml`, y restringir su clave a la app en la consola de Google.

## 5. Qué cambiar en `privacidad.html` y en Google Play

| Dónde | Hoy | Hay que poner |
|---|---|---|
| `privacidad.html` · tabla «Qué datos guardamos» | No habla de móviles | Fila nueva: «Un identificador de tu móvil para avisos, su idioma y su zona horaria · Mandarte avisos y guardar lo de tus avisos del banco · Nadie» |
| `privacidad.html` · «Avisos del banco» | «a tu cuenta solo pasa el movimiento» | Añadir: «Si lo activas, el movimiento se guarda en tu cuenta **aunque PalomApp esté cerrada**. Para eso tu móvil tiene una clave propia, que puedes retirar en Tú → Avisos» |
| Igual | «se borra al apagarlo o al cerrar sesión» | Solo es verdad cuando Desarrollo arregle el punto 1 del diagnóstico. Hasta entonces no se cumple |
| `privacidad.html` · «Servicios que nos ayudan» | No está Google | «Google (Firebase Cloud Messaging): entrega los avisos en tu móvil. Recibe el identificador de avisos de tu móvil y el texto del aviso (quién y en qué grupo), **nunca importes**» |
| `privacidad.html` · «Cuánto tiempo» | Solo copias | «El registro de avisos enviados se borra a los 30 días. Los datos de tu móvil, al cerrar sesión, al retirarlo o al borrar la cuenta» |
| Aviso destacado dentro de la app (avisos del banco) | Texto de `docs/39b` | Añadir la frase de «aunque la app esté cerrada» antes del «Aceptar» |
| Google Play · «Seguridad de los datos» | Sin identificadores | Marcar **«ID de dispositivo u otros»**: recogido, no compartido, para «Funciones de la app», obligatorio solo si se activan los avisos. El resto no cambia: el gasto ya está declarado y el texto del aviso del banco sigue sin salir del móvil. Firebase actúa por encargo nuestro: no cuenta como «compartir», pero se nombra en la política |
| Google Play · cifrado y borrado | Ya declarados | Sin cambios: va cifrado en tránsito y se borra con la cuenta (con las dos líneas de §2) |

## 6. Riesgos

1. **`avisos-guardar` es una puerta sin sesión.** Si aceptara un usuario de la petición o más campos de la cuenta, cualquiera con una clave podría escribir donde no debe. Por eso: usuario solo de la fila, lista cerrada de campos, tope diario y revisión mía antes de desplegar.
2. **Avisos al móvil equivocado** tras cambiar de cuenta. Lo tapa `avisos_registrar`, pero solo si la app la llama al entrar.
3. **Quien conozca el token de avisos de otro móvil podría desactivárselo** llamando a `avisos_registrar` con él. No ve nada ni recibe nada; el móvil afectado se vuelve a apuntar al abrir la app. Riesgo bajo, aceptado.
4. **El disparador vive en el camino de los gastos de Juntos.** Va envuelto para no fallar nunca, pero hay que probarlo en una transacción que se deshace: crear, cambiar, borrar y recuperar un gasto con y sin el secreto puesto.
5. **Móviles que cortan los avisos** para ahorrar batería: el «menos de un minuto» no se puede garantizar en todas las marcas.
6. **Un nombre de grupo o de persona con algo delicado** saldría en el aviso. Si preocupa, el texto con el móvil bloqueado ya es genérico.

## 7. Decisiones tomadas (sesión sola) y preguntas

Tomadas: opción (b) para C3; sin importes en ningún aviso de Juntos; los avisos en silencio no se reenvían; borrado de las tablas nuevas desde la función `borrar-cuenta`; máximo 10 móviles por persona y 50 guardados al día por móvil.

Para el dueño, no bloquean: 1) ¿Te vale que en el aviso salga el nombre del grupo y de la persona? 2) ¿Los avisos que caen en horas de silencio se pierden (se ven al abrir) o se mandan juntos a las 9:00?

## 8. Lo que no he podido confirmar

- Nada de este SQL se ha ejecutado. Hay que probarlo en una transacción que se deshace, con dos cuentas inventadas: una no ve ni toca los móviles de la otra; sin sesión, nada; el mismo token pasa de una cuenta a otra.
- Si el almacén de secretos (Vault) está activado en el proyecto y si `pg_net` responde desde un disparador como desde el cron (hoy se usa solo en `carburantes_pedir`).
- Los nombres exactos de las columnas de `movimientos` y de `compartidos_historial` más allá de lo que hay en las migraciones.
- Cómo se comporta Firebase con la app cerrada en las marcas de móvil de los usuarios.
- Cómo tiene que declararse exactamente en el formulario de Google: sale de `docs/39b` y `docs/33`, no lo he vuelto a consultar hoy.

## 9. Fuentes

- [F1] Supabase, sesiones de usuario (llaves de renovación de un solo uso, margen de 10 segundos, sesión terminada si se reutiliza): https://supabase.com/docs/guides/auth/sessions · consultado el 12/11/2026.
- Repositorio, rama `fase13/integracion`: `supabase/migrations/2026-11-08_borrar_cuenta.sql`, `2026-10-30_historial_compartidos.sql`, `2026-11-07_precios_carburante_cron.sql`, `supabase/functions/borrar-cuenta/index.ts`, `movil/android/app/src/main/java/com/palomapp/app/AvisosBanco*.java`, `app.js` (`avisosRecoger`, `leaveApp`), `privacidad.html`, `docs/39b`, `docs/33`, `docs/40`.

Para el PDF: dos caminos dibujados. «Aviso del banco → móvil → clave del móvil → `avisos-guardar` → tu cuenta» y «Gasto en Juntos → historial → `avisar` → Firebase → móvil (sin cifras)».

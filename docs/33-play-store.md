# 33 · Publicar PalomApp en Google Play: qué falta y quién lo hace (08/11/2026)

*Datos y Seguridad. Revisión previa, sin programar ni aplicar nada en Supabase. Normas de Google consultadas el 08/11/2026: pueden cambiar. No es asesoramiento legal.*

## 1. Conclusión

1. **Lo que más tarda es la prueba cerrada:** con una cuenta personal nueva, Google exige **12 probadores apuntados sin interrupción durante 14 días** antes de dejar publicar. Hay que empezar a buscar probadores ya.
2. **Faltan tres cosas obligatorias que hoy no existen:** borrar la cuenta desde la app **y** desde la web, una **política de privacidad pública** (una página web, no un PDF) y las respuestas del formulario de **seguridad de los datos**.
3. **Borrar la cuenta es lo delicado:** los datos personales se borran, pero los gastos de Juntos también son de los demás. Proponemos que la persona quede en cada grupo como «baja» con su nombre, para que los saldos de los demás no cambien, y no dejar borrar mientras deba o le deban dinero en un grupo. **Antes hay que mirar en Supabase cómo están enlazadas las tablas** (consulta de solo lectura en el apartado 5).
4. **Inicio de sesión dentro de la app:** con correo y contraseña funciona sin enlaces especiales. Pero «¿Olvidaste tu contraseña?» **no deja poner una contraseña nueva** (falla también hoy en la web). Las invitaciones a grupos deberían abrir la app con App Links.
5. **El repositorio está limpio:** no hay claves secretas ni datos personales, ni en los archivos ni en el historial. La clave de firma de la app nunca debe entrar en él: va a los secretos de GitHub y a una copia fuera de línea.

## 2. Lo que exige Google hoy

| Requisito | Qué pide | Estado en PalomApp | Quién |
|---|---|---|---|
| Alta | 25 USD una vez; tener 18 años; tarjeta (no prepago) | — | Dueño |
| Identidad | Puede pedir DNI y tarjeta a tu nombre legal. Hay que verificar correo y teléfono, y tener un **móvil Android** con la app Play Console. **Se publican tu nombre legal, tu país y el correo de desarrollador** | — | Dueño |
| Comerciante (ley europea DSA) | Las cuentas nuevas lo declaran al crearse. Si eres comerciante, se publican tu dirección y tu teléfono. Si no lo eres, se avisa a los usuarios de la UE de que no tienen los derechos del consumidor | Por decidir | Dueño |
| Prueba cerrada | 12 probadores durante 14 días seguidos. Después se pide la publicación y se responden preguntas sobre la prueba | 0 probadores | Dueño |
| Versión de Android | Apps nuevas: **Android 16 (API 36)** desde el 31/08/2026. La prórroga terminó el 01/11/2026 | No hay app | Desarrollo |
| Formato y firma | Paquete AAB y firma de apps de Play obligatoria: Google guarda la clave final y tú solo la de subida | No hay app | Desarrollo + Dueño |
| Política de privacidad | Página web pública, que no sea PDF, con «privacidad» en el título, enlazada en Play Console **y dentro de la app** | **No existe** | Dueño + Datos y Seguridad |
| Borrar la cuenta | Desde la app y desde un enlace web. Desactivar la cuenta no vale. Hay que avisar de lo que se conserva | **No existe** | Desarrollo + Supabase |
| Seguridad de los datos | Formulario en Play Console (borrador en el apartado 6) | Borrador | Dueño |
| Funciones financieras | Declaración obligatoria para todas las apps, aunque no tengan funciones financieras | Por decidir (pregunta 4) | Dueño |
| Apps web dentro de una app | Prohibido meter en una app la web **de otro** sin su permiso. La web es nuestra: no hay problema | Bien | — |

**Normas de finanzas en España y la UE.** La página de Google de servicios financieros solo pone licencias por país a los préstamos y a los anticipos de nómina, y no menciona a España. PalomApp no presta, no mueve dinero y no conecta con bancos, así que **no hemos encontrado ninguna licencia necesaria**. Sí aplica el RGPD (política de privacidad, derecho a borrar y lista de quién trata los datos). Si un día se conecta con el banco, hará falta un proveedor con licencia (ver `docs/25`).

## 3. Qué datos guarda la app y con quién se comparten

| Dato | Dónde se guarda | Quién más lo ve o lo trata | Obligatorio |
|---|---|---|---|
| Correo, contraseña y verificación en dos pasos | Supabase (cuenta) | Nadie | Sí |
| Nombre (`cfg().nombre` y el nombre en cada grupo) | Supabase | Los miembros de tus grupos, porque lo decides tú | No |
| Movimientos, cuentas, saldos, nómina, deudas, metas e inversiones | Supabase (`movimientos`, `config`) | Nadie | Es lo principal |
| Gastos, metas y planes de Juntos y su historial | Supabase (`compartidos`, `objetivos_compartidos`, `agenda`, `compartidos_historial`) | Los miembros del grupo | No |
| Tareas y agenda, y si la compartes | Supabase (`tareas`, `agenda`, `agenda_permisos`) | A quien se la compartas | No |
| Foto de un ticket | **No se guarda** | La función `tickets-ia` se la manda a **Anthropic** (Claude) para leerla. Solo se guardan los artículos y una fila de uso | No |
| Lugares de un trayecto (texto escrito) | No se guardan | La función `trayecto` los manda a **OpenRouteService** | No |
| Nombre o código de un activo al buscarlo | Tabla común `activos` (sin dueño) | **EODHD** y **CoinGecko** reciben solo la búsqueda, sin datos tuyos | No |
| Dirección IP al abrir la app | Registros de Supabase y Vercel | Google Fonts, jsDelivr y cdnjs (fuentes y librerías que se cargan de fuera) | — |
| Copia de seguridad semanal | GitHub Actions, cifrada, 90 días (esquema `public`, sin correos) | Nadie sin la contraseña | — |

No hay publicidad, ni analítica, ni ubicación del móvil. Supabase, Vercel, Anthropic y OpenRouteService trabajan **por encargo nuestro**: para Google eso no cuenta como «compartir», pero la política de privacidad tiene que nombrarlos.

## 4. Lo que tiene que hacer el dueño en persona

1. **Decidir con qué cuenta de Google** se abre la cuenta de desarrollador (debe ser tuya y para siempre). Correo de desarrollador público: puede ser el de «Escríbenos», que ya es público.
2. **Abrir la cuenta** en Play Console: tipo **Personal**, pagar los 25 USD con una tarjeta a tu nombre (no prepago).
3. **Verificar la identidad:** DNI si lo piden, correo y teléfono con un código, y tu móvil Android con la app Play Console. Ten en cuenta que **se publican tu nombre legal y tu país**.
4. **Declarar si eres comerciante.** Si la app es gratis, sin anuncios y sin cobrar nada, lo normal sería «no comerciante». Decídelo tú: si te equivocas, Google puede suspender la cuenta.
5. **Reunir 12 probadores** con cuenta de Google y móvil Android: de la familia, los amigos y los usuarios de ahora. Pasar a Play Console la lista de sus correos (solo ahí, nunca en el repositorio). Cada uno acepta la invitación, instala la app **y no se da de baja en 14 días**. Mejor buscar 15, por si alguien falla.
6. **Aprobar la política de privacidad** (la redactamos nosotros) y el nombre que sale como responsable.
7. **Rellenar en Play Console**: ficha de la tienda (textos y capturas, con Marketing), clasificación por edades, público adulto, «sin anuncios», el formulario de seguridad de los datos (apartado 6), la declaración financiera y el enlace para borrar la cuenta.
8. **Crear una cuenta de prueba para los revisores de Google** con datos inventados. Su contraseña va solo en Play Console, nunca en el chat ni en el repositorio.
9. **Guardar la clave de subida** (ver apartado 8) en tu gestor de contraseñas y en un USB.
10. A los 14 días, **pedir la publicación** y contestar las preguntas sobre la prueba (cómo fue, qué se cambió).

## 5. Supabase: borrar la cuenta (propuesta, **sin aplicar**)

**Paso 0, consulta de solo lectura.** Hay que ejecutarla antes de cerrar el diseño. Las tablas principales (`movimientos`, `grupo_miembros`, `compartidos`…) se crearon antes de que se guardaran las migraciones aquí, y no sabemos qué hacen al borrar un usuario. Si `grupo_miembros` o `compartidos` se borran solos con el usuario, **se borrarían gastos de otras personas**.

```sql
-- Qué tablas apuntan a la cuenta y qué hacen al borrarla (a = nada/error, c = se borran, n = se vacía el campo)
select c.conrelid::regclass as tabla, a.attname as columna, c.confdeltype as al_borrar
from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
where c.contype = 'f' and c.confrelid = 'auth.users'::regclass order by 1, 2;
-- Columnas con ids de personas sin enlace formal (pagado_por, reparto…)
select table_name, column_name from information_schema.columns
where table_schema = 'public' and column_name in ('user_id','creado_por','editado_por','pagado_por','hecho_por','hecha_por','asignado_a','dueno','a_usuario','reclamado_por','usado_por')
order by 1, 2;
-- ¿Hay archivos en Storage? (impiden borrar a su dueño)
select count(*) from storage.objects;
```

**Cómo funcionaría.** Se añaden una función de Supabase nueva, `borrar-cuenta`, y una función SQL nueva, `borrar_cuenta_datos`. Es aditivo: no cambia tablas ni datos hasta que alguien pulse el botón.

1. La app pide la contraseña otra vez y que se escriba «BORRAR». La función usa **siempre** el id de la sesión: nunca uno que llegue en la petición.
2. Si la persona **debe o le deben dinero** en algún grupo abierto, no se borra. Se le dice en qué grupos y se le ofrece «Saldar todo». Es la misma regla que hoy impide salir de un grupo.
3. **Se borra lo personal:** `movimientos`, `tareas`, `config`, `golf`, `tickets_uso`, los planes «Solo yo» de `agenda`, `agenda_permisos` (lo que comparte y lo que le comparten), `agenda_ocultas` y sus filas en las copias `backup_*_20261012`.
4. **En los grupos queda como baja:** `grupo_miembros.baja = now()`, con su nombre o con el que decidas (pregunta 2). Los gastos compartidos, las metas del grupo y el historial **no se tocan**, así que los saldos de los demás no cambian. Las bajas ya cuentan como participantes al editar gastos antiguos (`es_participante`).
5. Al final, la función borra la cuenta en Supabase Auth (correo, contraseña y verificación en dos pasos).
6. **Desde la web:** la misma pantalla en `https://urlife-zeta.vercel.app/?borrar-cuenta` (entras y lo confirmas). Ese es el enlace que se pone en Play Console.

```sql
-- BORRADOR: no aplicar. Revisar con el resultado del paso 0.
create function public.borrar_cuenta_datos(p_user uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare g record;
begin
  for g in select m.grupo_id from grupo_miembros m join grupos gr on gr.id = m.grupo_id
           where m.user_id = p_user and m.baja is null and gr.cerrado is null loop
    if abs(saldo_en_grupo(g.grupo_id, p_user)) > 0.01 then raise exception 'saldo_pendiente'; end if;
  end loop;
  delete from movimientos where user_id = p_user;
  delete from tareas where user_id = p_user;
  delete from config where user_id = p_user;
  delete from golf where user_id = p_user;
  delete from tickets_uso where user_id = p_user;
  delete from agenda_ocultas where user_id = p_user;
  delete from agenda_permisos where dueno = p_user or a_usuario = p_user;
  delete from agenda where grupo_id is null and creado_por = p_user;
  update grupo_miembros set baja = now() where user_id = p_user and baja is null;
  -- objetivo_aportes y paradores_*: según la pregunta 3
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.borrar_cuenta_datos(uuid) from public, anon, authenticated;
grant execute on function public.borrar_cuenta_datos(uuid) to service_role;
```

**Cómo se desharía.** Para quitar la función: `drop function public.borrar_cuenta_datos(uuid);` y borrar la función `borrar-cuenta`. **Un borrado ya hecho no se deshace** (eso es lo que pide la norma). Solo se podría recuperar de la copia semanal mientras exista (90 días), y la política de privacidad debe decir ese plazo.

**Antes de aplicarla:** prueba completa en una transacción que se deshace, con cuentas inventadas. Hay que comprobar que, tras borrar a A, los saldos de B y C son los mismos, que B puede seguir editando un gasto antiguo con A, y que no queda ninguna fila de A en las tablas personales.

## 6. Borrador del formulario de seguridad de los datos

| Tipo de dato (Google) | ¿Se recoge? | ¿Se comparte? | ¿Obligatorio? | Para qué |
|---|---|---|---|---|
| Información personal: correo | Sí | No | Sí | Gestión de la cuenta |
| Información personal: nombre | Sí | No (lo ven tus grupos porque tú lo eliges) | No | Funciones de la app |
| Información personal: ids de usuario | Sí | No | Sí | Funciones de la app y de la cuenta |
| Información financiera: historial de compras | Sí (gastos y artículos de tickets) | No | Sí | Funciones de la app |
| Información financiera: otra (nómina, deudas, saldos, inversiones) | Sí | No | Sí | Funciones de la app |
| Fotos | Sí, solo para leer el ticket; no se guarda | No (Anthropic trabaja por encargo) | No | Funciones de la app |
| Ubicación aproximada | Sí, por prudencia (lugares escritos en el trayecto e IP) | No | No | Funciones de la app |
| Actividad: otro contenido del usuario (notas, tareas, descripciones) | Sí | No | No | Funciones de la app |
| Registros de errores, analítica e ids del dispositivo | No | — | — | Revisar cuando haya avisos (el token de los avisos será un id del dispositivo) |

- **Cifrado en tránsito:** sí (todo va por HTTPS).
- **El usuario puede pedir que se borren sus datos:** sí, **solo cuando exista el borrado** del apartado 5.
- **Borrar la cuenta:** desde la app (Tú → Tu cuenta → «Borrar mi cuenta») y desde la web (enlace del apartado 5).
- **Se conserva tras borrar:** los gastos de grupo compartidos con otras personas (con el nombre que decidas) y las copias cifradas hasta 90 días.

## 7. Lo que tiene que programar Desarrollo

| # | Tarea | Por qué | Bloquea |
|---|---|---|---|
| 1 | Proyecto Capacitor (Android) con **los archivos dentro de la app**, no cargando la web de Vercel; `targetSdk` 36 | Norma de API 36. Así funciona sin conexión y no cambia sola cada vez que se publica | Sí |
| 2 | «Borrar mi cuenta» en Tú → Tu cuenta y en `?borrar-cuenta` en la web, con su confirmación | Obligatorio | Sí |
| 3 | Página `privacidad.html` y enlace en el inicio de sesión y en Tú | Obligatorio | Sí |
| 4 | Pantalla **«Nueva contraseña»** al volver del correo de recuperación. Hoy el enlace te deja dentro sin pedirla. En la app, que el correo abra la web, se cambie allí y se vuelva a la app | Error actual, también en la web | Casi |
| 5 | App Links para `https://urlife-zeta.vercel.app/?unirse=…` y `?soy=…`: archivo `/.well-known/assetlinks.json` con la huella de la **firma de Play** (está en Play Console) y escuchar `appUrlOpen` | Que las invitaciones abran la app; si no está instalada, sigue abriendo la web | No |
| 6 | Supabase.js (hoy `@2` sin versión fija), las fuentes y el lector de Excel, **copiados dentro de la app** | Seguridad (no cargar código cambiante de fuera), privacidad (IP a Google) y sin conexión | No |
| 7 | Enlaces externos (WhatsApp, correo, mapas) con el navegador del sistema | Dentro de la app no se abren bien | No |
| 8 | GitHub Actions para compilar el AAB a mano (`workflow_dispatch`), con la clave en los secretos | Ver apartado 8 | No |

`window.location.origin` en la app es `https://localhost`. Por eso todo lo que construya enlaces debe usar `APP_URL`, como ya hacen las invitaciones (el restablecimiento de contraseña no lo hace).

## 8. La clave de firma

- Con la firma de apps de Play, **Google guarda la clave final**. Nosotros solo tenemos la **clave de subida**. Si se pierde o se filtra, se pide un cambio en Play Console y la app sigue actualizándose.
- **Nunca en el repositorio** (es público): añadir a `.gitignore` `*.jks`, `*.keystore` y `keystore.properties`.
- **En los secretos de GitHub** (Settings → Secrets → Actions): `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` y `ANDROID_KEY_PASSWORD`. Los crea el dueño: nadie los escribe en el chat.
- El flujo que compila solo se lanza a mano desde `main`. Nunca con `pull_request_target`, porque una propuesta de un desconocido podría leer los secretos.
- Una copia de la clave y sus contraseñas en el gestor de contraseñas del dueño y otra en un USB.

## 9. Revisión del repositorio público (08/11/2026)

| Qué | Resultado |
|---|---|
| Claves secretas (service_role, Anthropic, EODHD, OpenRouteService, GitHub, contraseñas de base de datos) en archivos e historial | **Ninguna** |
| `config.js` | Solo la clave **pública** (anon) de Supabase. Es correcto: lo que protege son las reglas RLS |
| Correos | Solo el de «Escríbenos» (público a propósito, decisión del 22/10) y otros inventados en las pruebas (`t@t.com`…) |
| Nombres | Nombres de pila de usuarios reales en las pruebas (`test16`, `17`, `28`…) y en `docs/20`, sin apellidos. Cumple la norma, pero conviene cambiarlos por inventados cuando se toquen |
| IBAN, DNI, teléfonos e importes reales | No encontrados |

## 10. Riesgos

1. **Borrar gastos de otros** si las tablas compartidas se borran solas con el usuario. Por eso va primero el paso 0.
2. **No llegar a 12 probadores** o que alguien se dé de baja: el plazo de 14 días vuelve a empezar.
3. **Tu nombre legal queda público** en Google Play, y también la dirección y el teléfono si te declaras comerciante.
4. **Declaración de comerciante mal hecha:** Google puede suspender la cuenta.
5. **Perder la clave de subida sin copia:** se puede pedir otra, pero se pierden días.
6. **Fotos de tickets a Anthropic** (Estados Unidos): hay que decirlo claramente en la política y en la pantalla de los tickets.
7. **Formulario de seguridad incompleto:** si un día se añaden avisos, analítica o errores, hay que actualizarlo antes de publicar esa versión.
8. **El dominio `vercel.app`:** si cambia, se rompen los enlaces de la app y el de borrar la cuenta. Un dominio propio sería más estable.

## 11. Preguntas para el dueño

1. **¿Comerciante o no comerciante?** *Bloquea crear la cuenta.*
2. **¿Con qué nombre queda en los grupos quien borra su cuenta?** Opciones: su nombre de siempre (los demás saben a quién pagaron) o «Persona que borró su cuenta». Recomendamos el primero y avisarlo antes de borrar. *Bloquea el borrado.*
3. **¿Qué pasa con sus aportaciones a metas compartidas y sus comentarios del mapa de paradores?** Borrarlas cambia el progreso de la meta que ven los demás. Recomendamos conservar las aportaciones y borrar los comentarios. *Bloquea el borrado.*
4. **Declaración financiera:** ¿«Mi app no ofrece funciones financieras» o «Gestión de carteras / Otro», por las inversiones? Recomendamos ser prudentes y elegir «Otro». *Bloquea la ficha.*
5. **¿Me das el «sí» para ejecutar la consulta de solo lectura del paso 0?** No cambia nada. *Bloquea el diseño final del borrado.*
6. ¿Quiénes son los 12 o más probadores? *Bloquea la prueba cerrada.*
7. ¿Qué nombre y qué correo salen como responsables en la política de privacidad? No bloquea si se reutiliza el de «Escríbenos».

## 12. Lo que no hemos podido averiguar o confirmar

- Qué hacen hoy las tablas principales al borrar un usuario: hace falta el paso 0.
- En qué región guarda los datos el proyecto de Supabase (importa para el RGPD).
- Si el borrado «suave» de Supabase Auth (`shouldSoftDelete`) quita también el correo. La documentación no lo dice.
- Cuánto tiempo guarda Anthropic las fotos que recibe por la API. Hay que mirarlo en sus condiciones antes de redactar la política.
- Si Google trata los lugares escritos en el trayecto y la agenda propia de la app como «ubicación» y «eventos del calendario». Hemos elegido lo prudente para la ubicación.
- Si los probadores necesitan obligatoriamente un móvil Android: lo damos por hecho, pero no lo hemos leído en la norma.
- Si la plantilla actual de Capacitor apunta ya a API 36: lo comprobará Desarrollo.
- Los apartados de clasificación por edades, anuncios y acceso para revisores de Play Console los describimos de memoria; no los hemos consultado hoy.
- No hemos encontrado normas españolas específicas para una app de presupuesto personal, pero no lo ha revisado un abogado.

## 13. Fuentes (consultadas el 08/11/2026)

- Google, prueba cerrada de 12 probadores y 14 días: https://support.google.com/googleplay/android-developer/answer/14151465
- Google, nivel de API objetivo (API 36 desde el 31/08/2026, prórroga hasta el 01/11/2026): https://support.google.com/googleplay/android-developer/answer/11926878
- Google, cuota de 25 USD, DNI y verificación del móvil: https://support.google.com/googleplay/android-developer/answer/6112435
- Google, datos para crear la cuenta y qué se publica: https://support.google.com/googleplay/android-developer/answer/13628312
- Google, declaración de comerciante: https://support.google.com/googleplay/android-developer/answer/17594752
- Google, anuncio de normas del 29/10/2026: https://support.google.com/googleplay/android-developer/answer/18100766
- Google, borrar la cuenta: https://support.google.com/googleplay/android-developer/answer/13327111
- Google, política de datos de usuario (privacidad, borrado y datos financieros sensibles): https://support.google.com/googleplay/android-developer/answer/10144311
- Google, formulario de seguridad de los datos: https://support.google.com/googleplay/android-developer/answer/10787469
- Google, declaración de funciones financieras: https://support.google.com/googleplay/android-developer/answer/13849271
- Google, servicios financieros: https://support.google.com/googleplay/android-developer/answer/9876821
- Google, spam y apps web: https://support.google.com/googleplay/android-developer/answer/9899034
- Android, firma de apps de Play y clave de subida: https://developer.android.com/studio/publish/app-signing
- Android, verificación de desarrolladores (2026 y 2027): https://android-developers.googleblog.com/2026/06/android-developer-verification.html
- Supabase, enlaces profundos en apps nativas: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- Supabase, borrar usuarios y Storage: https://supabase.com/docs/guides/auth/managing-user-data y https://supabase.com/docs/reference/javascript/auth-admin-deleteuser
- Capacitor, App Links: https://capacitorjs.com/docs/guides/deep-links
- Fdaytalk, resumen de la declaración de comerciante (interés propio: blog; se usó solo para contrastar con la página de Google).
- Código: `auth-signup.js` (sin modificar), `data-layer.js` (`resetPassword`), `app.js` (`renderTuV2`, `APP_URL`, `CONTACTO`), `supabase/functions/*`, `.github/workflows/backup-semanal.yml`.

Para el PDF: una línea de tiempo con la cuenta (día 0), el borrado y la privacidad listos, el inicio de la prueba cerrada, los 14 días, la petición de publicación y la revisión de Google. Y un esquema de «qué se borra y qué queda» al borrar una cuenta: lo personal tachado y lo de los grupos como «baja».

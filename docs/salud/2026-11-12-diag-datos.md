# Diagnóstico de Datos y Seguridad (fase A5)

Departamento de Datos y Seguridad · 12/11/2026 · Solo lectura del repositorio (rama `fase13/integracion`) y del resumen de avisos de Supabase de hoy (`/tmp/diag/supabase-avisos.md`). No se ha tocado código ni Supabase. Nada de este SQL está aplicado ni probado en la base real.

## 1. Conclusión

1. **No hay ningún P0.** Todas las tablas tienen sus reglas por usuario activadas, no hay claves secretas en el repositorio (lo único que hay es la clave pública de Supabase, que es pública a propósito) y no he visto datos reales en pruebas ni en las imágenes que he abierto.
2. **Hay cuatro P1.** (a) En un móvil compartido, los avisos del banco siguen «encendidos» para la siguiente cuenta que entre, y la cola no se borra al cerrar sesión aunque `privacidad.html` dice que sí. (b) «Borrar mi cuenta» no borra las filas de la persona en dos de las cuatro tablas `backup_*` de octubre. (c) La copia semanal no incluye las cuentas y se puede descargar (cifrada) por cualquiera con cuenta de GitHub. (d) Altas sin CAPTCHA y sin tope de gasto en Anthropic: cuentas falsas = dinero.
3. **Los avisos de Supabase son casi todos ruido.** Las 2 funciones «sin sesión» no filtran nada útil, pero se cierran con dos líneas. Las 34 funciones «con sesión» son las de la app: es lo buscado.
4. **Las 20 reglas lentas no están en el repositorio** (son de antes de guardar el SQL). Dejo una consulta que escribe sola el arreglo, sin cambiar el significado. Con 763 movimientos hoy no se nota: es P2.
5. **Las funciones están razonablemente bien.** Lo más flojo: `activos-api` se fía del token sin comprobar la firma, y `tickets-ia` y `trayecto` no tienen freno global.

## 2. Tabla de problemas

| # | Problema | Dónde | Riesgo real | Prioridad | Arreglo propuesto |
|---|---|---|---|---|---|
| 1 | Avisos del banco: al cerrar sesión solo se pone `uid` vacío. `activo` y `bancos` se quedan, así que a la siguiente cuenta que entre en ese móvil se le leen los avisos **sin haber aceptado nada**. La cola tampoco se vacía (queda hasta 7 días o hasta que entre otra cuenta), y la política dice «se borra al cerrar sesión» | `app.js` `leaveApp` (l. 12877), `avisosTrasCargar` (l. 10335), `AvisosBancoPlugin.configurar`; `privacidad.html` | Móvil compartido o prestado. Lo leído no se mezcla (cada pendiente lleva su `uid` y se descarta), pero se lee sin consentimiento y lo escrito no se cumple | **P1** | Desarrollo: en `doLogout` y tras borrar la cuenta, `avNat().vaciar(true)` (borra cola y apaga). Guardar en el móvil para qué `uid` se aceptó y no leer si no coincide. Si la sesión caduca sola, no vaciar (se perderían pendientes): basta el `uid` vacío. Sin SQL |
| 2 | «Borrar mi cuenta» limpia `backup_movimientos_20261012` y `backup_config_20261012`, pero **no** `backup_movimientos_20261008` (337 filas) ni `backup_compartidos_20261012` | `supabase/migrations/2026-11-08_borrar_cuenta.sql` (lista de tablas) | Quien borre su cuenta deja movimientos suyos en una copia vieja. Nadie con sesión puede leerlas (sin reglas = cerradas), pero no cumple lo prometido | **P1** | Recomendado: **borrar las 4 tablas** (ver §3.2). Es destructivo: decide el dueño |
| 3 | Copia semanal: solo el esquema `public` (sin cuentas: tras un desastre los datos quedarían sin dueño), se pierde hasta 7 días, y el archivo cifrado es descargable por cualquiera con cuenta de GitHub (repositorio público). No hay simulacro de restauración apuntado | `.github/workflows/backup-semanal.yml`; ya dicho en `docs/35` | Pérdida de datos irrecuperable; y todo depende de una sola contraseña | **P1** | Ver §4 (pasos del dueño). Sin SQL |
| 4 | Altas sin CAPTCHA; `tickets-ia` sin tope global ni tope propio para «más precisión»; el tope de gasto en la consola de Anthropic no consta | Supabase Auth; `supabase/functions/tickets-ia/index.ts` | Cuentas falsas × 10 lecturas en el modelo caro. Dinero, no datos | **P1** | Ver §4. En la función: máx. 3 «precisas» al mes y un tope diario global (p. ej. 300 lecturas) |
| 5 | `activos-api` lee el rol del token **sin comprobar la firma**. Solo es seguro si la función está publicada con «verificar JWT» | `supabase/functions/activos-api/index.ts`, `rol()` | Si la verificación estuviera apagada, cualquiera gastaría las 20 consultas diarias de EODHD y llenaría el catálogo `activos`. No expone datos de usuarios | **P1** hasta comprobarlo; luego P2 | Usar `sb.auth.getUser(token)` como `trayecto`. Comprobar en el panel que «Verify JWT» está activo en las 4 funciones |
| 6 | Protección de contraseñas filtradas apagada (pendiente desde el 19/10) | Supabase → Authentication | Cuentas con contraseñas muy conocidas | P2 | Activarla en el panel. No sabemos si el plan gratis la incluye |
| 7 | 2 funciones ejecutables sin sesión | `grupo_de_objetivo(uuid)`, `validar_aporte()` | Bajo. `validar_aporte` es un disparador: no se puede llamar desde fuera. `grupo_de_objetivo` solo dice el grupo de una meta a quien ya sepa su código (imposible de adivinar). Su SQL **no está en el repositorio**: hay que leerlo antes | P2 | §3.1 |
| 8 | 20 reglas que recalculan `auth.uid()` en cada fila | `movimientos`, `tareas`, `config`, `compartidos`, etc. | Ninguno de seguridad. Lentitud cuando haya miles de filas | P2 | §3.3 |
| 9 | `tickets-ia`: el límite se cuenta y luego se apunta (dos peticiones a la vez pueden pasarse); solo mira los 200 primeros caracteres de la imagen; devuelve al móvil el mensaje de error de Anthropic | `tickets-ia/index.ts` | Pasarse del límite unas pocas lecturas; mensajes técnicos al usuario | P2 | Apuntar la fila antes de llamar a la IA; quitar `detalle` de la respuesta |
| 10 | `activos-api` «registrar»: cualquier cuenta añade filas al catálogo común con el nombre que quiera, sin tope; cada activo de EODHD reserva una consulta diaria | `activos-api/index.ts` | Con muchas altas, nadie podría buscar (se agotan las 20). Texto libre visible para todos en `listar` | P2 | Tope por persona y día; aceptar solo referencias devueltas por una búsqueda |
| 11 | `trayecto` «distancia» sin tope por persona | `trayecto/index.ts` | Agotar el cupo gratis de OpenRouteService. No guarda ni registra direcciones (bien) | P2 | Tope por persona y día (tabla de uso como `tickets_uso`) |
| 12 | Tablas `backup_*` con datos reales desde octubre (1.050 filas de movimientos) | Supabase | Datos duplicados sin reglas de caducidad; ver n.º 2 | P2 | §3.2 |
| 13 | `pg_net` instalada en `public` | Supabase | Bajo: es un aviso de orden. Moverla puede romper `carburantes_pedir` | P3 | No tocar ahora |
| 14 | 15 claves foráneas sin índice, 4 índices sin usar | Supabase | Ninguno con estos tamaños | P3 | §3.4 (opcional) |
| 15 | En el navegador quedan tras cerrar sesión: aspecto, sonido, «cifras ocultas», último cambio de moneda, metas celebradas y, si había, un enlace de invitación pendiente (`unirse`, `soy`) | `app.js` `lsSet` | Bajo. No hay importes ni movimientos. Un enlace pendiente podría usarlo la siguiente cuenta de ese navegador | P3 | Al cerrar sesión, quitar `unirse`, `soy`, `invAplazada`, `metaVista`, `metasCelebradas`, `monCambios` |
| 16 | Aparece una dirección de un grupo de probadores de Google en un documento | `docs/` (buscar `googlegroups`) | Bajo: cualquiera podría pedir entrar o escribir | P3 | Quitarla si no hace falta |

### Funciones de Supabase, de un vistazo

| Función | Sesión | Límite | Qué registra | Coste |
|---|---|---|---|---|
| `tickets-ia` | Comprobada con Supabase | 60 o 10 al mes por persona; las fallidas cuentan; imagen máx. ~5 MB; sin tope global | Una fila en `tickets_uso` (modelo, tokens). Nunca la foto | Por lectura; estimación en `docs/35` |
| `trayecto` | Comprobada con Supabase | Direcciones de 120 letras; reintento del Ministerio cada 15 min; sin tope por persona | Solo códigos de error. Nunca direcciones | Gratis mientras no se pase el cupo |
| `activos-api` | **Solo lee el token** | 20 consultas diarias a EODHD con reserva nocturna; listas de 60 | Nada | Gratis |
| `borrar-cuenta` | Comprobada; usa siempre el id de la sesión; pide «BORRAR» | Una vez; con candado en la base | Mensajes de error sin datos | Nada |

### Repositorio público

| Qué he buscado | Resultado |
|---|---|
| Claves y tokens (Anthropic, Supabase secreta, Google, GitHub, llaves privadas, contraseñas) | Nada. Solo la clave pública `anon` en `config.js` (y su copia en la app de Android), pública a propósito |
| Almacenes de firma de Android, `.env`, `google-services.json` | No hay. `.gitignore` ya excluye `*.jks`, `*.keystore`, `keystore.properties` |
| Correos | Solo de ejemplo (`ejemplo.com`, `example.invalid`), el de contacto (público a propósito) y el del n.º 16 |
| Teléfonos, IBAN, códigos de usuario reales | Nada |
| Extractos de prueba | Marcados «datos inventados» |
| Imágenes de `docs/img` (unas 120) y `docs/marketing` (solo logotipos) | He abierto 4 con pinta de capturas reales: todas con nombres e importes inventados |

## 3. SQL propuesto (nada aplicado)

### 3.1 Cerrar las 2 funciones a quien no tiene sesión

Primero leer (solo lee) y comprobar que `grupo_de_objetivo` solo devuelve el grupo:

```sql
select pg_get_functiondef('public.grupo_de_objetivo(uuid)'::regprocedure);
select pg_get_functiondef('public.validar_aporte()'::regprocedure);
```

Después:

```sql
revoke execute on function public.grupo_de_objetivo(uuid) from public, anon;
grant  execute on function public.grupo_de_objetivo(uuid) to authenticated;
revoke execute on function public.validar_aporte() from public, anon, authenticated;
```

**Qué hace:** quita un permiso que nadie usa. No toca datos. Los disparadores siguen funcionando sin ese permiso. **Deshacer:** `grant execute on function … to anon, authenticated;`. **Probar después:** vincular un aporte a una meta compartida con una cuenta de prueba.

### 3.2 Tablas `backup_*` (destructivo: solo con el «sí» del dueño)

Recomiendo borrarlas: tienen un mes, la copia semanal cifrada ya las contiene (se guardan 90 días) y hoy rompen la promesa de «Borrar mi cuenta». Antes, lanzar a mano la copia semanal y ver en su registro que salen las 4 tablas con sus filas.

```sql
drop table public.backup_movimientos_20261008, public.backup_movimientos_20261012,
           public.backup_compartidos_20261012, public.backup_config_20261012;
```

**Deshacer:** no se puede, salvo restaurando de la copia semanal. Si el dueño prefiere esperar, la alternativa mínima es añadir las dos tablas que faltan a `borrar_cuenta_datos` (cambia una función existente: con copia previa).

### 3.3 Las 20 reglas con `auth.uid()`

Sus definiciones no están en `supabase/migrations/`. Esta consulta **solo lee** y devuelve el arreglo ya escrito, regla a regla (mismo nombre, mismas personas, misma condición; solo cambia `auth.uid()` por `(select auth.uid())`):

```sql
select tablename, policyname, cmd, roles, qual, with_check,
  format('alter policy %I on public.%I%s%s;', policyname, tablename,
    case when qual is not null then ' using (' || replace(replace(replace(qual,
      '( SELECT auth.uid() AS uid)', '§'), 'auth.uid()', '(select auth.uid())'), '§', '(select auth.uid())') || ')' else '' end,
    case when with_check is not null then ' with check (' || replace(replace(replace(with_check,
      '( SELECT auth.uid() AS uid)', '§'), 'auth.uid()', '(select auth.uid())'), '§', '(select auth.uid())') || ')' else '' end
  ) as arreglo
from pg_policies
where schemaname = 'public'
  and (replace(coalesce(qual,''), '( SELECT auth.uid() AS uid)', '') like '%auth.uid()%'
    or replace(coalesce(with_check,''), '( SELECT auth.uid() AS uid)', '') like '%auth.uid()%')
order by 1, 2;
```

**Cómo aplicarlo:** guardar la salida completa (columnas `qual` y `with_check`) en `supabase/migrations/copias/` como marcha atrás; revisar a ojo las 20 líneas de `arreglo`; ejecutarlas dentro de `begin; … commit;`. `alter policy` no borra la regla en ningún momento. **Significado:** idéntico; `auth.uid()` vale lo mismo en toda la consulta, solo se calcula una vez. **Probar después:** las pruebas de aislamiento con dos cuentas de prueba (una no ve lo de la otra) y que los avisos de Supabase bajan a 0. No lo he podido probar.

### 3.4 Índices (opcional, aditivo)

Solo los que tocan consultas reales. `if not exists` por si ya están:

```sql
create index if not exists movimientos_activo_idx on public.movimientos (activo_id) where activo_id is not null;
create index if not exists objetivo_aportes_objetivo_idx on public.objetivo_aportes (objetivo_id);
create index if not exists agenda_ocultas_agenda_idx on public.agenda_ocultas (agenda_id);
```

**Deshacer:** `drop index …`. Con los tamaños de hoy no se nota: puede esperar.

## 4. Pendientes viejos: estado y pasos para el dueño

| Pendiente | Estado hoy | Qué hace falta |
|---|---|---|
| CAPTCHA en altas | No está. `auth-signup.js` llama a `signUp` sin él (y ese archivo no se toca sin permiso expreso) | 1) Crear un CAPTCHA gratis (Turnstile o hCaptcha). 2) Supabase → Authentication → Attack Protection: activarlo con su clave secreta. 3) Desarrollo añade la casilla en alta, entrada y «olvidé la contraseña»: **necesita permiso para tocar `auth-signup.js`**. Ojo: activarlo en el panel antes de publicar la app rompe las altas |
| Correo en altas | La confirmación por correo consta como activa (`docs/35`). El correo propio (SMTP) no consta: sin él, Supabase manda muy pocos correos por hora | Contratar un servicio de correo y ponerlo en Supabase → Authentication → SMTP |
| Tope de gasto de la IA | No consta | Consola de Anthropic → Billing → límite mensual bajo y aviso por correo. 2 minutos |
| Copia diaria | Sigue semanal y solo `public` | Opción A: plan de pago de Supabase (copia diaria). Opción B, gratis: pasar el horario a diario, añadir las cuentas (`--schema=auth`) y guardar el archivo en un sitio **privado** (repositorio privado o almacenamiento propio). Con cuentas dentro, no debe quedar en un repositorio público aunque esté cifrado. Y hacer un simulacro de restauración |
| Contraseñas filtradas | Apagada | Activarla en el panel |

## 5. Riesgos

- El arreglo 3.3 cambia 20 reglas de seguridad de golpe. Es mecánico, pero si se copia mal una, alguien podría dejar de ver sus datos. Por eso: copia previa, transacción y pruebas de aislamiento.
- Activar el CAPTCHA en el panel sin la app preparada deja a todos sin poder registrarse.
- Borrar las `backup_*` sin comprobar antes la copia semanal las pierde del todo.

## 6. Preguntas para el dueño

1. ¿Borramos las 4 tablas `backup_*`? Recomendado: sí. *Bloquea cerrar el n.º 2.*
2. ¿Permiso para tocar `auth-signup.js` una vez más, para el CAPTCHA? *Bloquea el CAPTCHA.*
3. ¿Copia diaria de pago o gratis en sitio privado? *Bloquea el n.º 3.*
4. ¿Pones hoy el tope de gasto en Anthropic? *No bloquea.*

## 7. Lo que no he podido averiguar o confirmar

- El SQL real de `grupo_de_objetivo`, `validar_aporte` y las 20 reglas: no está en el repositorio. Mi valoración de las dos funciones sale de su nombre, del README y de informes anteriores.
- Si las 4 funciones están publicadas con «Verify JWT» (no hay archivo de configuración en el repositorio).
- Si hay CAPTCHA, SMTP propio o tope en Anthropic: son ajustes de paneles a los que no llego.
- El historial de Git (esta copia no lo trae): una clave borrada hace tiempo seguiría ahí. Conviene activar «Secret scanning» en GitHub, que es gratis en repositorios públicos.
- Solo he abierto 4 de las ~120 imágenes de `docs/img` y ningún PDF.
- Nada de esto se ha probado en la base de datos.

## 8. Fuentes

- Repositorio, rama `fase13/integracion`, 12/11/2026: archivos citados en la tabla.
- `/tmp/diag/supabase-avisos.md` (avisos de Supabase, 12/11/2026 00:57).
- `docs/35-costes-legal-lanzamiento.md`, `docs/39b-avisos-banco-datos.md`, `docs/salud/2026-10-19.md` y `2026-11-09.md`.

Para el PDF: un semáforo con los 16 puntos (0 rojos, 5 naranjas, el resto amarillos y verdes).

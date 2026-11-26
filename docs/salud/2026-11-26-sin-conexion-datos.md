# Datos y Seguridad · Funcionar sin conexión (sesión 2 de docs/51)

Fecha: 26/11/2026 · Rama: `fase24/sin-conexion` · Solo lectura y análisis: no se ha tocado código, Supabase ni datos.
Qué hay hoy: NO existe copia local de datos ni cola. Los datos se leen de Supabase en cada arranque (`data-layer.js`, `onSnapshot`) y solo viven en memoria (`S`). Lo único que se guarda en el móvil es: sesión de Supabase (`persistSession`, almacenamiento del navegador), `localStorage` con cosas pequeñas (`cifrasOcultas`, `huella`, `monCambios`, tokens de avisos…) y los avisos pendientes de Android/iPhone. `movPendiente` es solo memoria: si se cierra la app a mitad, se pierde.

## Riesgos de más grave a menos
1. **Escribir bajo el usuario equivocado.** `objToRow` pone `user_id = currentUid` en el momento de ENVIAR, no de crear. Una cola que sobrevive a un cierre de sesión, a una sesión caducada o a otra persona entrando en el mismo navegador subiría los gastos de A a la cuenta de B. La cola debe guardar el uid con cada cambio y descartar (o congelar) lo de otro uid.
2. **Copia local legible por cualquiera con el móvil o el navegador.** Sin cifrar, sería un historial financiero completo en claro (y en un navegador compartido, de varias personas). Además `leaveApp()` se ejecuta con CUALQUIER sesión nula (también sesión caducada) y hoy hace `_movsPend.clear()`; copiar ese patrón perdería la cola; y `limpiarAlSalir()` solo se llama al cerrar sesión a propósito: hay que decidir qué pasa en cada caso.
3. **Resurrección y pisado al volver la red.** `doc(id).set` es un `upsert`: un cambio antiguo hecho sin red recrea un movimiento que otro móvil borró y deshace el cambio más reciente de otro móvil (última escritura gana, sin comprobar versión). Y `saveConfig` envía claves enteras (`papelera`, `cuentaJuntos`, `importLotes`, `deudas`…): una copia vieja de una de esas claves pisa la nueva (ver §2).
4. Compartidos (Juntos): crear/editar sin red en una tabla compartida puede dar gastos duplicados (la base pone el id al crear: `crear` no manda id) y editar sobre algo ya cambiado por otra persona.
5. Espacio y caducidad: sin límites, una cola olvidada crece; un cambio de hace semanas se aplicaría fuera de contexto.

## 1. Dónde guardar la copia y la cola, y su seguridad
| Opción | Ventajas | Problemas |
|---|---|---|
| `localStorage` | Sencillo | ~5 MB, síncrono (bloquea la app), solo texto. No sirve para unos miles de movimientos ni para la cola. |
| IndexedDB (web y dentro de Capacitor) | Cientos de MB, asíncrono, transaccional (la cola no se queda a medias) | En iOS, Safari/WebView puede borrar datos tras ~7 días sin abrir la web (la app instalada de Capacitor no sufre esto igual, pero no está garantizado). La copia puede desaparecer: hay que aceptarlo y re-leer del servidor. |
| Almacenamiento nativo (Keystore/Keychain, archivos de la app) | Mejor protección | Más trabajo; Android: `allowBackup="false"` ya puesto (bien, no sale en copias de Google); iOS: marcar el archivo como excluido de iCloud (como ya se hace con la cola de Atajos). |

Recomendación: **IndexedDB para copia y cola**, con un registro por cuenta (`uid`) y una versión de esquema. Cola de cambios y copia en bases separadas por uid.
- **Cifrado**: sin pedir nada al usuario, la clave no puede ser realmente secreta frente a quien tenga el aparato desbloqueado. Opciones honestas:
  - Móvil (Android/iOS): clave aleatoria guardada en Keystore/Keychain (plugin de Capacitor para almacenamiento seguro) y datos cifrados con AES-GCM (WebCrypto). Protege ante copia del almacenamiento o móvil perdido bloqueado; el sistema ya cifra el disco con la pantalla de bloqueo.
  - Web: la clave tendría que vivir en el propio navegador (clave WebCrypto no exportable en IndexedDB). Eso solo protege contra copiar el archivo, no contra otra persona con el navegador abierto. No prometerlo como «cifrado fuerte».
  - Decisión del dueño: en la web, ¿copia local o no? Alternativa más segura: copia solo en la app de Android/iPhone y en la web solo lo que ya hay (sin copia).
- **Qué se borra y cuándo** (reglas que propongo):
  - Cerrar sesión a propósito (`doLogout`, tras `limpiarAlSalir`): borrar copia, cola y claves de ese uid. Si hay cola pendiente, avisar antes («Tienes N cambios sin subir; si sales se perderán») y no cerrar en silencio. Hoy `doLogout` ya frena si hay `_movsPend`: extenderlo a la cola.
  - Borrar la cuenta (`limpiarAlSalir` tras `ok`): borrar todo sin preguntar. Y exigir red para borrar (§3).
  - Sesión caducada o `leaveApp()` sin cierre a propósito: NO borrar la cola (si no, se pierden gastos reales), pero sí ocultar la copia hasta que vuelva a entrar el MISMO uid. Si entra otro uid: borrar la del anterior (con aviso previo si había pendientes) y NUNCA enviarla con el nuevo.
  - Cambiar de usuario en el mismo navegador: comparar el uid guardado con el de la sesión al entrar; si no coincide, borrar antes de pintar nada. Mientras tanto no leer la copia.
  - Cierre de la sesión de Supabase en otro dispositivo o contraseña cambiada: tratarlo como sesión caducada.
- **Huella y «ocultar cifras»**: hoy la huella (`movil/bloqueo.js`) solo tapa la pantalla; no protege archivos. «Ocultar cifras» es solo visual (`cifrasOcultas` en `localStorage`). Con copia local, la huella NO protege los datos guardados: quien extraiga el almacenamiento los ve (si no están cifrados con clave del Keystore). Las cifras ocultas también deben afectar al estado «sin conexión» (que el aviso no enseñe importes) y a los widgets que ya guardan resumen (`WidgetAlmacen`, App Group en iPhone): esos ya se borran al cerrar sesión (`widgetsSalir`); la copia nueva debe hacer lo mismo.
- **Política de privacidad y tiendas** (hay que actualizar antes de publicar):
  - `privacidad.html` (versión en español e inglés y `borrar-cuenta.html`): añadir que, para funcionar sin conexión, la app guarda en tu móvil una copia de tus datos y de los cambios pendientes; se borra al cerrar sesión o borrar la cuenta; en la web, en el navegador. Hoy dice sólo «Los datos de tu móvil…» (revisar esa frase) y la fecha de «Última actualización».
  - Play Console «Seguridad de los datos»: datos guardados en el dispositivo; mantener «cifrados en tránsito»; si se cifra la copia, decirlo solo si es cierto en todos los casos. «Los usuarios pueden pedir que se borren los datos» sigue igual.
  - App Store «Privacidad de la app» y `PrivacyInfo.xcprivacy`: no se recogen datos nuevos; si se usa Keychain o API de archivos con marca de tiempo, comprobar las «razones» de API requeridas (ya hay `1C8F.1` para el widget).
  - Texto de ayuda en Tú → Privacidad y en el aviso al cerrar sesión.

## 2. Duplicados y pérdidas (reglas mínimas)
Estado actual por colección:
- `movimientos`, `tareas`, `golf` (tabla `collection`): `doc(id).set` con id puesto en el móvil (`nuevoIdMov`) → idempotente (upsert). `anadir(col, data)` también. **Ojo**: `collection().add` (id generado dentro de `data-layer`, un id nuevo por llamada) no es idempotente; comprobar que nadie lo use para crear con reintentos (en app.js solo vi `anadir`, pero hay que verificarlo con búsqueda antes de programar). `bulkInsert` ya es idempotente por id (importaciones: un `lote` se puede repetir sin duplicar).
- `config/app`: `update(partial)` lee la fila, mezcla y escribe (no es atómico; dos móviles a la vez pueden pisarse). Mezcla por clave de primer nivel: una copia vieja de `papelera`, `cuentaJuntos`, `importLotes`, `deudas`, `cuentas`, `inicioWidgets`, `guiaAvisos`… pisa lo nuevo entero. Hoy el riesgo es bajo porque el cambio se hace con la red; sin red, el intervalo es de horas o días.
- Tablas compartidas (`compartidos`, `objetivos_compartidos`, `agenda`, `grupo_carpetas`): `crear` NO manda id (lo pone la base): un reintento tras respuesta perdida duplica. `editar` es `update` (no resucita, pero pisa); `borrar` marca fecha y es idempotente.
- `objetivo_aportes`: `upsert` por `user_id,mov_id` → idempotente.
- Grupos, invitaciones, `crear_grupo`, `crear_sin_cuenta`, rpc: no idempotentes (ver §3).

Casos pedidos:
- **Reintentos**: seguros solo en las colecciones con id puesto en el móvil. Regla: cada operación de la cola lleva su `idOp` (UUID), el `id` del registro y el `uid`; no se reutiliza ni se cambia el id al reintentar.
- **Editar algo que otro cambió**: hoy gana el último en llegar, sin avisar. Regla mínima: guardar con cada edición pendiente la «versión base» (la fila como estaba al editar) y, al subir, comparar con el servidor; si es distinta, no pisar: guardar el cambio como conflicto y preguntar («Se cambió en otro sitio: ¿quedarte con el tuyo?») o, más sencillo, quedarse con la versión del servidor y avisar. Sin columna `updated_at` en `movimientos` (no consta en las migraciones que he visto) la comparación sería por contenido.
- **Borrar algo que ya no existe**: `delete` es idempotente; se da por hecho y se quita de la cola.
- **Editar algo borrado por otro**: el `upsert` lo recrea. Regla: una edición hecha sin red sobre un registro existente debe ser `update` («si existe»), no `upsert`; si no existe, se descarta con aviso («ese gasto ya no existe»). Solo las CREACIONES son `upsert`.
- **Dos pestañas o dos móviles**: la cola de IndexedDB debe vaciarla UNA sola pestaña a la vez (candado con `navigator.locks` o un campo `bloqueado_por` con caducidad). Sin él, cada pestaña envía todo (el upsert por id evita duplicar, pero el orden y el pisado se complican).
- **Orden**: cola por orden de creación, por registro: no subir un «borrar» antes que su «crear»; compactar (crear+editar → un crear; crear+borrar → nada; editar+editar → el último). Si un paso falla por red, parar y reintentar el mismo; si falla por permisos/datos (no retryable) se aparta a «No se pudo guardar» sin bloquear las demás.
- **Cola tras actualizar la app**: guardar `esquema` en cada operación; la versión nueva debe poder leer las antiguas o migrarlas; si no, nunca borrar en silencio: avisar. Los campos nuevos de un movimiento necesitan columna en Supabase: una operación antigua de una columna que ya no existe fallaría para siempre → descarte con aviso tras N intentos.
- **Sesión caducada al volver la red**: `autoRefreshToken` renueva; si el refresco falla, la app llama a `leaveApp` y hoy se pierde lo de memoria. Con cola persistente: no subir sin sesión válida, conservar, volver a entrar con el mismo uid y subir. Distinguir 401/JWT expirado (esperar sesión) de 4xx de datos (apartar).
- **Cuenta borrada o cambio de usuario con cola**: ver §1; lo del uid anterior jamás se sube con otro. Si la cuenta se borró en otro sitio, subir daría error de clave foránea/permisos → apartar y limpiar.
- **Límites de espacio**: IndexedDB puede dar `QuotaExceededError`; manejarlo: avisar «No hay espacio; no se puede seguir sin conexión» sin perder lo que ya está en la cola. Tope razonable de cola (p. ej. 500 operaciones o 14-30 días) y tope de copia; la copia se puede re-leer, la cola no.
- **Fotos**: la foto del grupo y los tickets (imágenes) no deben entrar en la cola.
- **Deshacer**: «Deshacer» ya recrea con `set` y copia completa; sin red, cola con el «borrar» y el «deshacer» se compactan a nada. La `papelera` (en `config`) es el mismo riesgo de clave entera.

Reglas mínimas resumidas: (1) idempotencia por id del móvil, (2) cola con orden y compactación por registro, (3) cada operación atada a un uid y a un `idOp`, (4) creación = upsert; edición = update sin resurrección; borrado = delete idempotente, (5) última escritura gana SOLO si la versión base coincide; si no, conflicto visible, (6) descarte seguro: nunca borrar de la cola en silencio; las rechazadas definitivamente van a una lista visible y exportable, (7) config: no encolar la clave entera de listas; encolar operaciones («añadir/quitar elemento X») o, si no, solo las pequeñas y sin conflicto probable (nivel, tema, nombre) y dejar el resto de ajustes como «necesitan conexión».

Tablas de riesgo (de más a menos): compartidos y objetivos compartidos (varias personas, `crear` sin id) > config JSON (claves enteras, no atómico, `papelera` y `cuentaJuntos`) > grupos/invitaciones > movimientos (ediciones cruzadas) > tareas (privadas, bajo riesgo).

## 3. Qué NO debe funcionar sin conexión (y por qué)
- **Todo lo compartido (Juntos, planes y tareas de grupo, metas compartidas, saldar, «Deshacer»/recuperar, historial)**: solo lectura de la última copia, con la hora de la última actualización bien visible. Crear/editar mezclaría gastos con otras personas y se validan en el servidor (reparto que cuadra, miembro activo; el id lo pone la base).
- **Invitaciones, unirse a un grupo, crear grupos y personas sin cuenta, salir de un grupo, hacer administrador**: dependen del estado actual y de tokens de un solo uso; hay que ver el resultado real.
- **Borrar cuenta** (pide contraseña con `signIn` y la función `borrar-cuenta`) y **cambios de contraseña/correo/MFA**, y cerrar sesión «de verdad» en otros dispositivos: exigen red y no deben quedar en cola. Cerrar sesión sin red: permitirlo en local (borrar copia y cola tras aviso), pero la sesión del servidor sigue viva hasta que se pueda cerrar: avisarlo.
- **Lectura de tickets con IA** (necesita servidor; cuenta contra el límite mensual y el tope diario global: no encolar para evitar un gasto que luego no se sabe cuándo ocurre), precios de activos, cambio de divisas, calculadora de trayecto, precios de carburante.
- **Importar extractos que crean muchos movimientos**: la lectura es local, pero guardar un lote grande sin red y sin poder «Deshacer importación» (`deleteWhere` por `lote`) es arriesgado: mejor exigir red.
- **Avisos y widgets**: los apuntes que ya se hacen en el móvil (avisos del banco, Atajos) tienen su propia cola nativa; unificarla con la nueva solo si se revisa el emparejamiento (`atajosFuente`).
- **Configuración que afecta a otros o a la seguridad**: permisos de «compartir mi agenda», quitar móviles de avisos, KPIs.
Sí pueden ir sin red: movimientos propios (crear, editar, borrar), tareas propias, ver todo lo propio, ocultar cifras, ajustes pequeños.

## 4. ¿Migración o cambio en Supabase?
Para una primera versión: **ninguna es imprescindible** (las operaciones propias son idempotentes por id y la comparación puede hacerse por contenido). Mejoras opcionales y aditivas, a decidir con el dueño más adelante y sin aplicarlas:
- `movimientos.updated_at timestamptz default now()` + disparador que lo actualice, para detectar ediciones cruzadas con exactitud (no consta en el repositorio que exista; comprobar en la base real antes de proponer SQL final). Deshacer: quitar columna y disparador.
- Aceptar `id` propio en `compartidos` si se quisiera cola compartida (no recomendado ahora).
- Comprobar en la base real que las políticas RLS de `movimientos`/`tareas`/`config` son por `user_id = auth.uid()` en lectura Y en inserción/actualización (con `with check`), porque un `upsert` de una cola con un `user_id` equivocado debe ser rechazado por el servidor y no solo por la app. No he podido ver esas políticas en el repositorio (las tablas base son anteriores a las migraciones guardadas): pedir al dueño el resultado de listar las políticas desde el editor SQL.
Ningún cambio de Supabase se ha aplicado.

## 5. Pruebas
Automáticas imprescindibles (jsdom, con IndexedDB simulada, p. ej. `fake-indexeddb`, y red simulada):
1. Sin red: se abre con copia y se ven los datos; sin copia, se muestra la pantalla de «sin conexión» sin errores.
2. Apuntar sin red → cola de 1; con red vuelve y llega UNA vez (contar filas); reintento tras respuesta perdida no duplica.
3. Cerrar la app a mitad (reiniciar el estado) y reabrir: la cola sigue; llegan una sola vez.
4. Crear+editar+borrar sin red de un mismo registro se compacta; borrar algo ya borrado no falla; editar algo que ya no existe no lo resucita y avisa.
5. Cola de A y entra B (mismo navegador): nada de A se envía con B ni se ve; al volver A, sigue ahí o se avisó.
6. Cerrar sesión con cola: avisa; al confirmar se borra copia y cola. Borrar cuenta: se borra todo.
7. Sesión caducada con cola: no se pierde, no se sube hasta volver a entrar; 401 distinto de 4xx de datos.
8. Dos pestañas: solo una vacía la cola (candado).
9. Conflicto: el servidor cambió desde la versión base → no pisa y deja conflicto visible.
10. Lo compartido y lo de §3 sin red: botones desactivados o aviso, nada encolado.
11. Config: dos cambios sin red sobre claves de lista no pisan una copia más nueva; `saveConfig` viejo no sobrescribe.
12. Cola de una versión anterior (esquema viejo) se lee o se aparta con aviso; límite de espacio simulado (`QuotaExceededError`) no pierde la cola.
13. «Ocultar cifras» activo: el aviso de sin conexión y la copia no enseñan importes.
14. Que `.github` y las pruebas no contengan datos reales (repositorio público).
Exigen móvil real: modo avión de verdad en Android e iPhone (abrir con y sin cola, matar la app, reiniciar el móvil); cambio de red Wi-Fi/datos a mitad de subida; sesión caducada real (contraseña cambiada en otro sitio); huella/Face ID con la app abierta sin red; widget y Atajos mientras tanto; borrado de IndexedDB por el sistema (iOS tras días sin abrir, poco espacio); dos móviles con la misma cuenta editando lo mismo; la web en un navegador compartido; que la copia no sale en copias de seguridad del móvil (Android `allowBackup=false` ya; iOS: archivos excluidos de iCloud).

## Qué necesita confirmar el dueño
1. ¿Copia local también en la web, o solo en las apps de Android/iPhone?
2. Al cerrar sesión con cambios sin subir: ¿avisar y dejar elegir (recomendado) o impedirlo hasta tener red?
3. Lo compartido sin conexión: solo lectura (recomendado).
4. Actualizar `privacidad.html` (ES/EN), ficha de Play (Seguridad de los datos) y App Store antes de publicar.
5. Si quiere la columna opcional `movimientos.updated_at` (la propongo para una segunda fase, con su SQL y cómo deshacerla; no se aplica sin su «sí»).

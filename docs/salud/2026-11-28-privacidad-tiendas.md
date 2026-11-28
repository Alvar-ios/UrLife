# Datos y Seguridad · Privacidad y tiendas con la copia local (1.0.0)

Fecha: 28/11/2026 · Solo lectura y análisis: no se ha tocado la web, la app ni Supabase.
Revisado sobre `main` 027aaee (la copia de trabajo estaba en otra rama, así que leí los archivos con `git show`). Probado: nada en móvil real. Todo lo marcado «a confirmar» no lo he podido verificar en el código.

## 1. Conclusión

1. **Nada bloquea mandar a producción**, pero `privacidad.html` se queda corta en tres puntos y conviene corregirla **antes** de enviar a revisión (es solo texto, sube directo a `main`).
2. La copia local **sí está cifrada de verdad** (AES-GCM; la clave vive en el Keystore de Android o en el Llavero de iPhone, solo en ese móvil) y **no se crea en la web**. La política ya lo dice, pero dice «movimientos, tareas y ajustes» y la copia también guarda **tus grupos y lo compartido (con nombres de otras personas)**.
3. **No cambia nada de lo que se «recoge»**: la copia se queda en el móvil, no viaja a ningún servidor. Los formularios de Play y de App Store son los de siempre, con dos cosas por revisar (identificador del móvil para avisos, y «uso de la app» para las cifras del panel).
4. En `PrivacyInfo.xcprivacy` **no falta ninguna razón de API por la copia local**: IndexedDB (WebKit) y Llavero no piden razón. UserDefaults ya está declarado. Un punto a confirmar: marcas de fecha de archivos del plugin Filesystem (ver 4).
5. Riesgo real a vigilar (no bloqueante): si el móvil pierde la clave, **los cambios sin subir se pierden en silencio** (ver riesgos).

## 2. `privacidad.html` (versión en 027aaee)

Ya añadido (fecha 24/11, sin tocar). Párrafo actual, sección «Copia en tu móvil (apps de Android y iPhone)»:
> «Para que la app funcione sin conexión, guarda en tu móvil una copia de tus movimientos, tareas y ajustes, y los cambios que aún no se han subido. La copia está cifrada con una clave que solo guarda tu móvil y no sale de él. Si cierras sesión, se borra. La versión web no guarda esta copia.»

| Qué dice | ¿Es cierto? (verificado en código) | Qué falta |
|---|---|---|
| Cifrada con clave que no sale del móvil | Sí: `ClaveLocalPlugin` (Keystore) y `ClaveLocal` en `AppDelegate.swift` (Llavero, `ThisDeviceOnly`); `data-layer.js` cifra con AES-GCM | Nada |
| «Movimientos, tareas y ajustes» | **Incompleto**: también se guardan `grupos`, miembros, personas sin cuenta y las tablas compartidas (`compartidos`, metas, agenda, carpetas, aportes) | Nombrarlo |
| «Si cierras sesión, se borra» | Cierto, pero **también al borrar la cuenta** (`limpiarAlSalir`). **No** se borra si la sesión caduca sola o la cuenta se borra desde otro aparato | Decirlo |
| Cierra sesión con cambios sin subir | La app avisa y no deja cerrar | Opcional |
| Se guarda en claro: id de cuenta, correo y datos de MFA (`localStorage`: `palom:uid`, `palom:mail`, `palom:fact`) | Verificado en `data-layer.js` | Una frase |
| «Última actualización: 24 de noviembre» | Hay que moverla | Cambiar a 28 de noviembre |

**Texto propuesto (sustituye el párrafo, ES):**
> Para que la app funcione sin conexión, guarda en tu móvil una copia de tus movimientos, tareas y ajustes, de tus grupos y de los gastos, metas y planes compartidos que ves (con los nombres de las personas de esos grupos), y los cambios que aún no se han subido. Esta copia está cifrada. La clave se guarda en la zona segura de tu móvil, no sale de él y no se envía a nuestros servidores. Para poder abrir la app sin conexión, el móvil recuerda también, sin cifrar, un identificador de tu cuenta y tu correo. Todo se borra cuando cierras sesión o borras tu cuenta desde esa app. Si tu sesión caduca sola, la copia se queda en ese móvil hasta que vuelvas a entrar o desinstales la app. La versión web no guarda esta copia.

**Proposed text (EN):**
> So the app can work offline, it keeps on your phone a copy of your transactions, tasks and settings, of your groups, and of the shared expenses, goals and plans you can see (including the names of the people in those groups), plus changes not yet uploaded. This copy is encrypted. The key is kept in your phone's secure storage, never leaves it and is not sent to our servers. To open the app offline, the phone also remembers, unencrypted, an identifier of your account and your email. Everything is deleted when you log out or delete your account from that app. If your session expires on its own, the copy stays on that phone until you log in again or uninstall the app. The web version does not keep this copy.

Además: en «Cuánto tiempo los guardamos» (ES y EN) añadir una frase: «La copia de tu móvil dura hasta que cierras sesión o borras la cuenta.» `borrar-cuenta.html` ya lo dice bien («La copia cifrada que la app guarda en tu móvil se borra al cerrar sesión o al borrar la cuenta»); ver en riesgos el matiz de otro aparato.

## 3. Google Play · «Seguridad de los datos»

Regla de Google (a confirmar en su ayuda): los datos que se quedan solo en el móvil no cuentan como «recogidos». La copia local **no añade tipos de dato**. Se mantiene `docs/marketing/12-ficha-google-play.md` §5, con dos revisiones.

| Apartado | Respuesta |
|---|---|
| ¿Recoge o comparte datos? | Sí recoge. «Compartir con terceros»: No (Supabase, Anthropic y OpenRouteService actúan por encargo) |
| Correo, nombre, ID de usuario | Recogido, no compartido. Correo e ID obligatorios; nombre opcional |
| Info financiera: historial de compras y otra info financiera | Recogido, no compartido, obligatorio, para funciones de la app |
| Fotos | Recogido, efímero (ticket), opcional |
| Otro contenido del usuario (tareas, notas) | Recogido, no compartido, opcional |
| Ubicación aproximada | Como hasta ahora (lugares escritos para el trayecto, efímero, opcional) |
| Actividad: interacciones con la app | Sí, para analíticas (recuentos del panel) |
| **IDs del dispositivo u otros** | **Cambiar de «No» a «Sí»** si la app de Android registra el token de avisos (privacidad.html lo reconoce: «un identificador de tu móvil»). Funciones de la app; no compartido (Firebase por encargo). A confirmar con el dueño |
| Cifrado en tránsito | Sí (HTTPS) |
| «Cifrado en reposo» | Play no lo pregunta. No marcar nada; la copia cifrada solo se menciona en la política |
| Borrado | Sí: desde la app y en `borrar-cuenta.html`. Añadir la URL de borrado. Se conservan: gastos de grupos con otras personas y copias cifradas 90 días |
| Revisiones de seguridad independientes, «Familia» | No |
| Política de privacidad (URL) | La de `privacidad.html` publicada. **A confirmar** que la versión desplegada ya trae el párrafo nuevo |

## 4. App Store Connect · «Privacidad de la app»

La copia local tampoco añade nada. Todo «vinculado a ti», **sin rastreo**, finalidad «Funcionalidad de la app» (coincide con el `PrivacyInfo.xcprivacy` actual).

| Categoría Apple | Tipo | Marcar |
|---|---|---|
| Información de contacto | Correo; Nombre | Sí, vinculado, sin rastreo |
| Información financiera | Otra información financiera | Sí |
| Contenido del usuario | Fotos o vídeos; Otro contenido del usuario | Sí |
| Identificadores | ID de usuario | Sí |
| Uso | Interacción con el producto (recuentos del panel) | **A confirmar**: está en Play y no en el manifiesto de iPhone. Misma respuesta en las dos tiendas |
| Ubicación | Aproximada (trayecto) | **A confirmar**: Play lo declara, el manifiesto no |
| Identificadores | ID del dispositivo | No en iPhone si no hay push (iPhone usa Atajos); a confirmar si `avisos_registrar` guarda algo en iOS |
| Rastreo | No | `NSPrivacyTracking` = false, sin dominios |

**`PrivacyInfo.xcprivacy` (verificado en `movil/ios`):**
- `UserDefaults`: declarado con `CA92.1` (la app) y `1C8F.1` (grupo del widget). Correcto. El widget declara solo `1C8F.1`.
- La copia local usa IndexedDB del WebView y Llavero (`SecItem*`): **ninguno exige razón**. No se usan en el código de la app `stat`, fechas de archivos, espacio en disco ni tiempo de arranque (busqué `attributesOfItem`, `creationDate`, `modificationDate`, `systemUptime`, `volumeAvailable`, `systemFreeSize`).
- **A confirmar, FileTimestamp (`C617.1`)**: el plugin `@capacitor/filesystem` 8.1.5 (usado para compartir Excel/copias) lee fechas de archivos en `IONFileStructures+Converters.swift`. No he visto si su librería trae su propio manifiesto. Si App Store Connect te mandó un correo «ITMS-91053», se añade `NSPrivacyAccessedAPICategoryFileTimestamp` con `C617.1`. Si el envío a TestFlight no dio aviso, no hace falta tocar nada.
- `ITSAppUsesNonExemptEncryption` = false: sigue siendo razonable (solo WebCrypto del sistema para datos propios), **a confirmar** en la pregunta de exportación de Apple.

## 5. Riesgos (de más grave a menos)

| # | Riesgo | Gravedad | Qué hacer |
|---|---|---|---|
| 1 | **Clave perdida = cambios sin subir perdidos en silencio.** Si el Keystore no devuelve la clave, `ClaveLocalPlugin` crea otra y `descifrar` devuelve vacío: la cola se lee como vacía | Media (no hay pérdida de datos ya subidos) | No bloquea. Pedir a Desarrollo un aviso si la cola no se puede leer. Probar en móvil real: restaurar copia, cambiar PIN/huella |
| 2 | **Sesión caducada o cuenta borrada desde otro aparato**: la copia (cifrada) se queda; solo se borra al cerrar sesión a propósito o al entrar otra cuenta (`iniciarLocal` borra la copia de la anterior, **no** su cola) | Media | Aceptable si se dice en la política (texto propuesto). Mejor: borrar copia y cola si el servidor dice «cuenta no existe» |
| 3 | **Móvil compartido o prestado**: el cifrado no protege con la app abierta y el móvil desbloqueado. La huella es opcional (`localStorage huella`) | Media | Decirlo en la guía. No prometer «protegido» en la política |
| 4 | Correo, id y MFA en `localStorage` sin cifrar (más el token de sesión de Supabase, ya existente) | Baja | Declarado en el texto propuesto |
| 5 | Copia de seguridad del sistema: Android `allowBackup=false` + `sin_copia.xml` (verificado). iPhone: el almacén del WebView puede entrar en copias de iCloud, pero la clave es `ThisDeviceOnly` y sin ella es ilegible | Baja | A confirmar en un iPhone real: restaurar a otro aparato y ver que pide red |
| 6 | Inconsistencias entre tiendas (IDs de dispositivo, uso, ubicación) | Media (rechazo/avisos) | Alinear según las tablas 3 y 4 |
| 7 | Política desactualizada frente a la app (falta lo compartido y la fecha) | Media | Aplicar el texto de la sección 2 |
| 8 | Repositorio público: no encontré datos reales en lo revisado | Baja | Mantener |

## 6. Preguntas para el dueño

1. **Bloquea el envío a revisión:** ¿apruebas el texto de la sección 2 (ES y EN) y la fecha 28/11? Se sube directo a `main`.
2. **Bloquea Play:** ¿la app de Android registra el token de avisos de Juntos? Si sí, marcar «IDs del dispositivo».
3. ¿Quieres que las cifras del panel («interacción con la app») consten igual en Play y en App Store? Recomendado: sí.
4. ¿Le pedimos a Desarrollo (sin urgencia) avisar si la cola no se puede descifrar y borrar la copia cuando la cuenta ya no existe?

## 7. Lo que no he podido confirmar

- Que la política desplegada en la web ya sea la de 027aaee.
- Manifiesto de privacidad de las librerías de los plugins de Capacitor (Filesystem, Share, Biometría).
- Que Apple y Google acepten «efímero» para fotos y trayecto (criterio de revisión humana).
- Comportamiento real en móvil: restaurar copia, cambio de PIN, modo avión.
- Si iPhone registra algún identificador de móvil para avisos.

## 8. Fuentes

- Código en `main` 027aaee: `data-layer.js`, `movil/nativo-src.js`, `ClaveLocalPlugin.java`, `AppDelegate.swift`, `AndroidManifest.xml`, `sin_copia.xml`, `PrivacyInfo.xcprivacy` (app y widget), `privacidad.html`, `borrar-cuenta.html`, `docs/52`, `docs/33`, `docs/marketing/12`. Consultado 28/11/2026.
- Reglas de Google y Apple: de memoria, **a confirmar** en las ayudas oficiales (no las he consultado hoy).

Para el PDF: una tabla «Qué marcar en cada tienda» con las secciones 3 y 4 y semáforo (verde / a confirmar).

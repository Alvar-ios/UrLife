# 39b · Leer los avisos del banco en Android: revisión de Datos y Seguridad

Departamento de Datos y Seguridad · 11/11/2026 · Contexto: `docs/25-app-movil-estudio.md` §3. No se ha tocado código ni Supabase.

## 1. Conclusión

1. **Google Play no pide formulario ni revisión especial** para el acceso a notificaciones: no aparece en su lista de permisos que necesitan declaración (sí SMS, registro de llamadas, accesibilidad, ubicación en segundo plano…). Pero los datos de pago son «datos sensibles», así que hace falta un **aviso destacado dentro de la app** y un «Aceptar» explícito **antes** de mandar al usuario a los ajustes.
2. **No debería cambiar la declaración financiera.** Leer avisos en el móvil no es banca, préstamos, pagos, inversión ni asesoramiento. Se sigue marcando «Mi app no ofrece funciones financieras». El riesgo está en **cómo se describa**: nunca «conecta con tu banco».
3. **Supabase: no hace falta nada nuevo.** El gasto confirmado es un movimiento normal. Una columna `origen` es opcional, solo para saber cuántos gastos vienen de avisos. Si se añade, va **antes** de que la app la mande, porque si no, guardar falla.
4. **El peligro principal no está en Supabase, está en el móvil.** Los avisos pendientes nunca deben ir a `cfg()`, porque la configuración se sube a Supabase. Además: que no se mezclen entre cuentas al cerrar sesión, que no se dupliquen con el extracto importado y que la cifra no salga en la pantalla bloqueada.
5. **Recomendación: programarlo ya en una rama, pero no subirlo a Google Play hasta tener el acceso a producción.** Se prueba con un APK en el móvil del dueño. Así no se arriesga la prueba cerrada ni la solicitud de producción.

## 2. Tablas

### 2.1 Google Play

| Tema | Qué dice Google | Qué hacemos |
|---|---|---|
| Formulario de permiso | No aparece entre los que piden declaración [F1] | Nada que rellenar |
| Aviso destacado | Dentro de la app, en el uso normal, no solo en la política; dice qué datos y para qué; el permiso va justo después; consentimiento con un toque deliberado; salir o tocar «atrás» no cuenta [F2] | Pantalla propia antes de abrir los ajustes (texto en §3) |
| Declaración financiera | Opciones: banca, préstamos, pagos, cripto, bolsa, seguros, asesoramiento, «Otro» y «Ninguna» [F3]. Exigen cuenta de organización los «productos y servicios financieros» (banca, préstamos, bolsa, fondos, cripto) [F4] | Sigue «Mi app no ofrece funciones financieras» |
| Seguridad de los datos | Lo que se trata en el móvil y no sale de él no hay que declararlo. «Recoger» = mandarlo fuera del móvil [F5] | Sin cambios: el gasto confirmado ya está declarado como «historial de compras». Si un día sube el texto del aviso, habría que declarar «Mensajes» |
| Software espía | Prohíbe recoger datos a escondidas y mandarlos fuera de forma que el usuario no espera [F6] | Apagado de serie, solo los bancos que marque el usuario, nada sube sin confirmar |

### 2.2 Android 13 a 16

| Tema | Qué pasa | Qué supone para nosotros |
|---|---|---|
| Ajustes restringidos (13+; en 15 llega a más permisos) | A las apps instaladas desde el navegador, WhatsApp o un gestor de archivos se les bloquea el acceso a notificaciones. Se desbloquea en Ajustes → Apps → la app → ⋮ → «Permitir ajustes restringidos» [F7][F8] | Instalada desde Play, no afecta. Con un APK de prueba, el dueño tendrá que activarlo a mano. Google aconseja hacerlo solo si te fías de quien hizo la app [F7] |
| Códigos de un solo uso (15+) | Android tapa el contenido de los avisos que tienen un código de verificación a las apps que no son de confianza [F9][F10] | Bien: nunca queremos verlos. Puede que algún aviso de pago salga tapado y no se pueda leer |
| Filtrar por app | El manifiesto solo filtra por tipo de aviso (en curso, silencioso…) [F11]. Por app de banco hay que filtrar en nuestro código | El servicio recibe todos los avisos. Los que no sean de un banco marcado se descartan al momento, sin guardar ni registrar nada |
| Servicio que se para | Android lo conecta y desconecta. Tras desconectarse no llegan avisos hasta pedir `requestRebind` [F11]. Algunas marcas lo cortan para ahorrar batería (no lo hemos podido comprobar con fuentes oficiales) | Enseñar en la app «Activo / Parado» y no prometer que lo pille todo |
| Perfil de trabajo | Android no escucha avisos del perfil de trabajo [F11] | Si el banco está en el perfil de trabajo, no funciona |
| Nuestro aviso «¿Apuntar…?» | Desde Android 13 hace falta el permiso `POST_NOTIFICATIONS`. Si el usuario dice «No permitir», la app no puede mandar avisos [F12] | Pedirlo aparte. Si lo niega, los pendientes salen al abrir la app. En la pantalla bloqueada, ocultar la cifra |

### 2.3 Qué se guarda y dónde

| Dato | Dónde | Cuánto tiempo | ¿A Supabase? |
|---|---|---|---|
| Texto completo del aviso | Solo en memoria mientras se lee | Segundos | **Nunca** |
| Avisos de apps que no son bancos marcados | Ningún sitio | Se descartan al momento | Nunca |
| Pendiente: importe, comercio, fecha, banco, una huella para no repetir | Almacén privado de la app en el móvil, ligado al usuario con sesión | Máx. 7 días o hasta confirmar o descartar | No |
| Gasto confirmado (importe, categoría, fecha, descripción = comercio, cuenta) | Tabla `movimientos` | Como cualquier movimiento | Sí, solo al confirmar |
| Lista de apps de banco marcadas y si está encendido | En el móvil (o en `cfg()`: solo nombres de paquete, sin cifras) | Mientras esté encendido | Opcional |

## 3. Recomendaciones

- **Texto del aviso destacado**, en una pantalla aparte y sin mezclar con otros temas [F2]. Por ejemplo: «PalomApp leerá en tu móvil los avisos de las apps de banco que elijas, para proponerte apuntar el gasto ("¿Apuntar 12,50 € en Mercadona?"). El texto del aviso no sale de tu móvil. Solo se guarda en tu cuenta el gasto que confirmes. No leemos avisos de otras apps. Puedes apagarlo cuando quieras en Tú.» Botones «Aceptar y activar» / «Ahora no». Hay que explicar también que se puede retirar el permiso, porque el RGPD lo pide antes de dar el consentimiento [F13].
- **Base legal (RGPD): consentimiento.** Es opcional y se activa a mano. La norma europea de privacidad en el móvil también pide informar con claridad antes de acceder a información del teléfono [F14]. Retirarlo tiene que ser tan fácil como darlo [F13]: un interruptor en Tú que, al apagarlo, **borra todos los pendientes** y lleva a los ajustes de Android para quitar el permiso.
- **Mínimos datos** [F15]: solo importe, comercio y fecha. Nunca el saldo, las últimas cifras de la tarjeta ni el nombre de quien te manda un Bizum (es otra persona).
- **Los pendientes, fuera de `cfg()`**: la configuración se sube a Supabase. También fuera de las copias del móvil (ya está `allowBackup="false"` en `movil/android/app/src/main/AndroidManifest.xml`: no quitarlo).
- **Al cerrar sesión, cambiar de cuenta o «Borrar mi cuenta»**: vaciar los pendientes del móvil. Si no, el siguiente usuario de ese móvil vería o apuntaría gastos de otro.
- **Sin duplicados.** Cada aviso pendiente lleva una huella (app + hora + importe). El gasto confirmado se guarda con el id puesto en el móvil (`anadir`, como ya se hace), así un reintento no duplica. Y al importar un extracto, la vista previa tiene que avisar si ya hay un gasto con el mismo importe en ±2 días que vino de un aviso. Hay que comprobar que la detección actual lo pilla, porque la fecha del aviso y la del extracto pueden no coincidir.
- **Nunca apuntar solo**: siempre «¿Apuntar…?» con confirmación, como dice `docs/25`.
- **`privacidad.html`**: añadir un apartado «Avisos del banco (solo Android, opcional)» con lo del aviso destacado. Hoy dice «ni accedemos a tu banco», y sigue siendo cierto, pero hay que matizarlo: «leemos en tu móvil, si lo activas, los avisos de las apps de banco que elijas; no salen del móvil».
- **Ficha de Play**: no usar «conecta con tu banco», «sincroniza» ni «automático». Decir «te propone apuntar los gastos a partir de los avisos de tu banco, en tu móvil».

### SQL propuesto (opcional, NO aplicado)

Solo si el dueño quiere saber cuántos gastos vienen de avisos. Sin esto la función va igual.

```sql
-- Aditivo: una columna vacía y opcional. No cambia ningún movimiento.
alter table public.movimientos
  add column if not exists origen text
  check (origen is null or origen ~ '^[a-z_]{1,20}$');
comment on column public.movimientos.origen is
  'De dónde vino el movimiento (p. ej. aviso). Vacío = apuntado a mano o de antes.';
```

**Qué hace:** añade una casilla vacía a cada movimiento. Las reglas de seguridad por usuario (RLS) de `movimientos` siguen valiendo igual: cada uno solo ve y escribe lo suyo. **Cómo se desharía:** `alter table public.movimientos drop column origen;` (se pierde solo esa marca). **Orden:** primero la columna y después la app. `data-layer.js` manda todos los campos del movimiento, así que si la app manda `origen` sin la columna, **guardar falla, también en la web**. Nunca poner el texto del aviso en `descripcion` ni en esta columna. **No usar `lote`** para marcar estos gastos: «Deshacer importación» borra por `lote`.

## 4. Riesgos (de más grave a menos)

1. **Que el texto del aviso o los pendientes acaben en Supabase** (por guardarlos en `cfg()` o en `descripcion`). Sería subir datos de pago de terceros sin declararlo: incumple el RGPD y el formulario de Play.
2. **Que un pendiente se mezcle entre usuarios** en un móvil compartido.
3. **Gasto duplicado** (aviso + extracto, o el banco que manda el aviso dos veces): los números de «Tu mes» salen mal.
4. **Que Google lo lea como «función financiera»** por una descripción mal puesta y vuelva a rechazar la app por ser cuenta personal. Riesgo bajo si se describe bien, pero ya pasó una vez.
5. **Revisión más lenta o con preguntas** en la versión que añade el permiso, justo cuando se pide el acceso a producción.
6. **Que deje de funcionar sin avisar** (el sistema para el servicio, el banco cambia el texto, el aviso sale tapado): frustración, no pérdida de datos.
7. **La cifra en la pantalla bloqueada** en nuestro aviso «¿Apuntar…?».

## 5. Preguntas para el dueño

1. **¿Esperamos al acceso a producción para subirlo a Play?** Recomendamos que sí, y mientras tanto probarlo con un APK en tu móvil. *Bloquea subirlo a Google Play; no bloquea programarlo.*
2. **¿Quieres la columna `origen`?** Es opcional. Si dices que sí, necesito tu «sí» explícito para el SQL de arriba, antes de que la app la use. *Solo la bloquea si se quiere.*
3. **¿Con qué 2 o 3 bancos empezamos?** Solo los nombres de las apps. Nada de capturas de avisos reales en el repositorio, que es público. *Bloquea programar la lectura.*
4. **¿7 días de vida para un pendiente sin confirmar** te parece bien? *No bloquea.*

## 6. Lo que no hemos podido averiguar o confirmar

- Si Google revisa a mano las apps que piden acceso a notificaciones, o si una actualización rechazada afecta a la versión que ya está en prueba cerrada. Sus páginas no lo dicen.
- Si Google considera una app de presupuesto que lee avisos del banco como «Otro» dentro de las funciones financieras: la página de la declaración no define las opciones [F3].
- La página oficial de Android 15 no detalla cómo detecta el código ni si puede tapar por error un aviso de pago normal.
- Qué marcas paran el servicio y cuánto. Solo hay fuentes no oficiales.
- Cómo detecta hoy la importación los duplicados cuando la fecha cambia un día: lo tiene que comprobar Calidad.
- No hemos mirado en Supabase las columnas actuales de `movimientos` (sin conexión en esta revisión). Hay que confirmar que no existe ya una `origen` antes de aplicar nada.
- Novedades de Android 16 sobre este permiso: no hemos encontrado cambios oficiales.

## 7. Fuentes (consultadas el 11/11/2026)

- [F1] Google Play, permisos y API que acceden a información sensible: https://support.google.com/googleplay/android-developer/answer/9888170 y https://support.google.com/googleplay/android-developer/answer/16558241
- [F2] Google Play, política de datos de usuario (aviso destacado y consentimiento): https://support.google.com/googleplay/android-developer/answer/10144311
- [F3] Google Play, declaración de funciones financieras: https://support.google.com/googleplay/android-developer/answer/13849271
- [F4] Google Play, qué apps necesitan cuenta de organización: https://support.google.com/googleplay/android-developer/answer/13634885
- [F5] Google Play, formulario de seguridad de los datos: https://support.google.com/googleplay/android-developer/answer/10787469
- [F6] Google Play, software malicioso (spyware): https://support.google.com/googleplay/android-developer/answer/9888380
- [F7] Ayuda de Android, permitir ajustes restringidos: https://support.google.com/android/answer/12623953
- [F8] Android Authority, Android 15 y ajustes restringidos (prensa, no oficial): https://androidauthority.com/android-15-restricted-settings-sideloading-3481098
- [F9] Android Developers, cambios de Android 15 (ocultar códigos): https://developer.android.com/about/versions/15/behavior-changes-all
- [F10] Android Authority, códigos de verificación en Android 15 (prensa, no oficial): https://androidauthority.com/android-15-two-factor-authentication-codes-3492585
- [F11] Android Developers, `NotificationListenerService`: https://developer.android.com/reference/android/service/notification/NotificationListenerService
- [F12] Android Developers, permiso de notificaciones: https://developer.android.com/develop/ui/views/notifications/notification-permission
- [F13] RGPD art. 7 (retirar el consentimiento; web no oficial con el texto): https://gdpr-info.eu/art-7-gdpr/
- [F14] Directiva 2002/58/CE, art. 5.3 (versión original consultada; reformada en 2009): https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32002L0058
- [F15] RGPD art. 5 (minimización y plazo; web no oficial con el texto): https://gdpr-info.eu/art-5-gdpr/

Para el PDF: un dibujo del camino del dato. Aviso del banco → móvil (se lee y se descarta) → «¿Apuntar 12,50 €?» → solo si confirmas → Supabase. Con una cruz roja en «texto del aviso → Supabase».

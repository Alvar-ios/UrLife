# 39 · Avisos del banco (leer las notificaciones del banco en Android)

Producto y Diseño · 11/11/2026 · Propuesta, sin código. Parte de `docs/25` §3 y `docs/34`.

> Nota: `docs/34` dejaba esto para noviembre de 2027. El dueño lo adelanta ahora; el resto de la hoja de ruta no cambia.

## 1. Conclusión

1. **Nombre en la app: «Avisos del banco».** Solo en la app de Android, apagado de serie, en Tú → Traer y guardar y con su tarjeta en «Descubre». Antes del permiso de Android, una pantalla propia que explica qué se lee y qué no.
2. **Recomendamos la bandeja «Pendientes de apuntar» dentro de la app, más un único aviso de PalomApp, silencioso y agrupado** («3 gastos por apuntar»). La lectura funciona con la app cerrada, pero lo que se apunta se confirma dentro de la app, con un toque por gasto. Nada se apunta solo.
3. **Se lee y se descarta en el móvil.** De cada aviso solo se guarda en el móvil importe, comercio, signo, fecha y banco. A Supabase solo sube lo que el usuario confirma, como un movimiento normal.
4. **Reconocer los avisos:** una lista de patrones por banco (datos, no código), más un lector genérico para el resto. La fecha sale de la hora del aviso, no del texto. **No hemos podido confirmar ningún texto real de aviso de un banco español**: hay que recoger ejemplos en la prueba cerrada antes de programar los patrones (ver §4).
5. **Primera versión:** 3 o 4 bancos del grupo + el genérico, solo en euros, solo gastos e ingresos (sin traspasos automáticos). Se mide con contadores en el móvil, sin textos.

## 2. Recorrido del usuario

### 2.1 Dónde se activa

| Sitio | Qué se ve | Cuándo sale |
|---|---|---|
| Tú → **Traer y guardar** → «Avisos del banco» (icono `bell`) | Fila con estado: «Apagado» o «Encendido · BBVA, ING» | Solo en la app de Android (`__nativo.android`). En la web y en iPhone no sale |
| «Descubre» (nueva entrada en `DESCUBRE`, `k: 'avisosBanco'`, icono `bell`) | «**Avisos del banco** · Cuando pagas con tarjeta, PalomApp te propone apuntarlo.» Botón «Activar» | Solo en Android. Ojo: el total pasa de 12 a 13 solo ahí; «Has descubierto X de N» debe contar las que se ven |
| «Lo básico» (`nivel()`) | La fila va en «Más ajustes»; la tarjeta de Descubre sí sale | Igual que el resto de herramientas |
| Sugerencia en Inicio (`sug*`) | «¿Te proponemos los gastos al pagar con tarjeta?» | Una sola vez, a quien tiene Android, una cuenta con banco y apunta a mano 5 gastos o más en una semana |

### 2.2 Pantalla de explicación (hoja, antes del permiso de Android)

Icono `bell` arriba, sin emojis. Texto exacto:

> **Avisos del banco**
>
> Cuando tu banco te avise de un pago, PalomApp te lo propondrá para apuntarlo con un toque.
>
> `check` **Tú decides.** Nada se apunta solo: siempre te preguntamos antes.
>
> `check` **Solo tus bancos.** Leemos únicamente los avisos de las apps de banco que elijas. WhatsApp, el correo y lo demás, nunca.
>
> `check` **Se queda en tu móvil.** El aviso se lee aquí y se borra. Solo se guarda el gasto que tú apuntas: importe, comercio y fecha.
>
> `candado` **Nunca vemos tus claves.** Los códigos de verificación se ignoran, y Android además los oculta.
>
> Para esto, Android te pedirá el permiso de «acceso a notificaciones». Lo puedes quitar cuando quieras.
>
> [ **Continuar** ]   Ahora no

«Continuar» lleva al paso de bancos (2.3) y después abre el ajuste de Android. Al volver a la app:

- Si dio el permiso: «Listo. El próximo pago con tarjeta te saldrá aquí.» y se enseña la bandeja vacía.
- Si no: «Sin ese permiso no podemos ver los avisos.» Botones «Abrir el ajuste de Android» y «Ahora no». Ni insistir ni volver a preguntar solos.
- Si la app no viene de Google Play y Android bloquea el permiso («ajustes restringidos»): «Android bloquea este permiso porque la app no viene de Google Play. Instálala desde Google Play.» No enseñamos a saltarse el bloqueo, porque es justo lo que piden las estafas.

### 2.3 Elegir los bancos

- Lista de chips con logo (`bancoFichaHtml`). **Ya marcados** los bancos de sus cuentas (`cfg().cuentas[].banco`). Debajo, «Otros bancos» con el resto de `BANCOS` que tengan patrones.
- Solo salen los bancos cuya app está instalada en el móvil (Android deja comprobarlo para una lista fija de apps, sin pedir permisos de más).
- Cada banco elegido se relaciona con **su cuenta**: si tiene una sola cuenta de ese banco, sin preguntar. Si tiene dos, «¿A qué cuenta van los avisos de ING?». Si no tiene ninguna, «Sin cuenta».
- Se guarda en `cfg().avisosBanco = { on, bancos: { ing: cuentaId|null }, noPreguntar: [comercios] }`. Lo que está pendiente NO va en config: se queda en el móvil.

### 2.4 Cuando llega un aviso

| Momento | Qué pasa |
|---|---|
| El banco manda su aviso (app de PalomApp abierta o cerrada) | El móvil lo lee, saca importe, comercio, signo, fecha y banco, y **lo borra**. Si no es un pago (ver §3), se ignora sin dejar rastro |
| Pasa a la bandeja | Se guarda solo en el móvil, en «Pendientes de apuntar». Caduca a los 14 días |
| Aviso de PalomApp | Uno solo, **silencioso** y agrupado: «PalomApp · 1 gasto por apuntar: 12,50 € en Mercadona». Con 2 o más: «3 gastos por apuntar». En la pantalla de bloqueo, sin cifras («Tienes gastos por apuntar»), como en `docs/25` |
| Al tocar el aviso | Se abre la app en la bandeja |
| Al abrir la app sin tocar el aviso | En Inicio, una tarjeta arriba: «3 gastos por apuntar» → bandeja. No se cuenta como widget de Inicio, para que Inicio no haga scroll |

**Por qué bandeja + aviso y no solo el aviso con un botón «Apuntar»:** con la app cerrada, guardar en Supabase desde el aviso obliga a que la parte de Android tenga la sesión del usuario y repita el guardado de movimientos (cuentas, reglas, duplicados). Es mucho más trabajo y más fallos. El botón «Apuntar» en el propio aviso se deja para después (§5).

### 2.5 La bandeja «Pendientes de apuntar» (hoja)

Cada fila (táctil, 56 px de alto como mínimo):

```
[logo ING]  Mercadona                       −12,50 €
            hoy 13:42 · Comida (por tu regla)
            [ Apuntar ]   [ Cambiar ]   (x)
```

- **Apuntar** (botón principal, acento vivo): guarda el gasto con un toque. `sentir('ok')`, la fila se va con animación corta y sale «Apuntado · Deshacer».
  - Categoría: `reglaPara(comercio, tipo, cuenta)`; si no hay regla, `sugerirCategoria`. Si no hay ninguna, la fila dice «Elige categoría» y «Apuntar» abre el teclado de la app con todo puesto.
  - Cuenta: la del banco del aviso (2.3). Si hay una regla de traspaso (`reglaTras`), se propone como traspaso.
  - Descripción: el comercio tal cual (se puede renombrar en «Cambiar»).
- **Cambiar**: abre el formulario de siempre (`openMovForm`) con todo relleno.
- **(x) Descartar**: se quita de la bandeja. Debajo sale «Descartado · Deshacer · **No volver a preguntar por Mercadona**». Así esa opción no ocupa sitio en cada fila.
- Arriba, si hay 3 o más con categoría: «Apuntar todos (3)», con «Deshacer».
- Vacía: icono `checkCircle` y «Todo al día».
- Al pie: «Ajustes» (bancos, apagar).

### 2.6 Apagar

- En Tú → Traer y guardar → Avisos del banco: interruptor «Leer los avisos del banco». Al apagarlo: «Ya no leemos tus avisos. Para quitar también el permiso de Android, toca aquí.» y se abre el ajuste de Android.
- Apagar vacía la bandeja del móvil (pregunta antes si hay pendientes).
- Si el usuario quita el permiso desde Android, la fila de Tú dice «Falta el permiso de Android» con el botón para volver a darlo.
- Cerrar sesión o «Borrar mi cuenta» vacían la bandeja del móvil.

## 3. Qué avisos interesan y cómo no duplicar

| Aviso | ¿Se propone? | Cómo se reconoce (palabras, sin mayúsculas ni tildes) |
|---|---|---|
| Pago con tarjeta | **Sí, gasto** | compra, pago, has pagado, cargo, con tu tarjeta |
| Bizum enviado | **Sí, gasto** | bizum + has enviado / enviado a |
| Bizum recibido | **Sí, ingreso** | bizum + has recibido / recibido de |
| Transferencia enviada / recibida | **Sí**, gasto / ingreso | transferencia + emitida, enviada / recibida, ingreso |
| Devolución de una compra | **Sí, ingreso** (categoría de la compra si la hay) | devolucion, reembolso, abono |
| Nómina, ingreso | **Sí, ingreso** | nomina, ingreso, abono |
| Recibo domiciliado | Sí, gasto, **pero** se mira antes si es un pago fijo (`cfg().facturas`) ya apuntado | recibo, adeudo, domiciliacion |
| Retirada en cajero | Sí, gasto (o traspaso a «Efectivo» si existe esa cuenta) | cajero, retirada, reintegro |
| Códigos de verificación (OTP) | **Nunca** | codigo, clave, verificacion, OTP, o 4 a 8 cifras sueltas sin «€» |
| Confirmar una compra en la app (antes de pagar) | **Nunca** | confirma, autoriza, pendiente de autorizar |
| Pago rechazado o denegado | **Nunca** | rechazad, denegad, no se ha podido |
| Saldo, resumen, extracto | **Nunca** | saldo, resumen, extracto disponible |
| Publicidad, ofertas, préstamos | **Nunca** | oferta, preconcedido, promocion, gana, descubre |
| Aviso sin importe en euros | **Nunca** en la primera versión | — |

**Ante la duda, no se propone.** Es mejor perder un gasto que proponer uno falso.

**Duplicados (antes de entrar en la bandeja y otra vez al apuntar):**

1. **El mismo aviso dos veces** (el banco lo repite o lo actualiza): misma app + mismo importe + mismo comercio en 10 minutos = uno solo.
2. **Ya lo apuntaste a mano** (o con foto de ticket, o en Juntos): se reutiliza `impCandidatos(cuenta)` de importar. Mismo importe exacto, fecha ±2 días y misma cuenta o sin cuenta → la fila sale con «Parece que ya lo tienes: Mercadona, ayer» y botones «Es el mismo» (se descarta) / «Es otro» (se apunta). Nunca se descarta solo.
3. **Lo importas después del extracto:** el movimiento apuntado desde un aviso es un movimiento normal con cuenta, importe y fecha, así que importar ya lo encuentra como «ya lo tenías». Desarrollo debe comprobar que la tolerancia de fechas de importar cubre 1 o 2 días de diferencia (el banco a veces anota el cargo un día más tarde que el aviso).
4. **Dos bancos para el mismo pago** (la tarjeta del banco en Google Wallet puede avisar las dos apps): misma cifra en 2 minutos desde dos apps → uno solo, con la cuenta del banco.

## 4. Formatos de los bancos

**Lo que no hemos podido confirmar:** no hemos encontrado en la web textos reales de avisos de ningún banco español. Las páginas de los bancos describen los tipos de aviso, pero no copian el texto. Lo que encontramos:

| Banco | Qué confirmamos (fuente) | Texto del aviso |
|---|---|---|
| BBVA | Avisos de «Pagos con tu tarjeta de crédito o débito» y de movimientos en cuentas; se eligen en ajustes (bbva.es) | Sin confirmar |
| Santander | Aviso de cada movimiento de cuenta y de cada pago con tarjeta **y devolución**, con importe mínimo opcional (bancosantander.es) | Sin confirmar |
| CaixaBank | Avisos de cuentas y tarjetas y de seguridad; se gestionan en Perfil → Configuración → Notificaciones y alertas (caixabank.es) | Sin confirmar |
| ING, Sabadell, Openbank, Revolut, N26, imagin, Bankinter, Unicaja, Abanca, Trade Republic | No lo hemos buscado a fondo o no hemos encontrado nada útil | Sin confirmar |

Una app de gastos compartidos ya hace esto (Olik Split): lee el aviso en el móvil, saca importe, comercio y fecha, crea un borrador que el usuario confirma y **filtra por la app del banco**. Tiene un lector por banco y pide al usuario una captura (con el importe tapado) para añadir bancos nuevos. Es la misma idea que proponemos.

### 4.1 Cómo reconocerlos (robusto y fácil de mantener)

- **Primero, la app.** Solo se leen las apps de la lista y solo las que el usuario marcó. Los nombres internos de las apps (p. ej. el de BBVA o ING en Google Play) los confirma Desarrollo; no los damos de memoria.
- **Se lee título + texto + texto largo** del aviso, juntos y sin tildes.
- **Importe:** el primer número junto a «€» o «EUR», delante o detrás: `12,50 €`, `12,50€`, `-12,50 €`, `EUR 12,50`, `1.234,56 EUR`, `€12.50` (Revolut o N26 con el móvil en inglés). Se reutiliza `numCampo`, que ya entiende «1.234,56». Si hay dos importes (pago y saldo), vale el que va junto a las palabras de pago, no el de «saldo».
- **Signo:** por las palabras de la tabla del §3. El signo «−» delante también vale. Sin palabras claras → no se propone.
- **Comercio:** lo que sigue a « en », « a » o « de » tras el importe, hasta un punto o el final, sin «S.L.», «S.A.», números de tarjeta (`*1234`) ni ciudades en mayúsculas al final. Si no sale, «Pago con tarjeta» y la fila pide nombre. Después pasa por las reglas de categorías.
- **Fecha:** **la hora a la que llega el aviso**, nunca la del texto. Más simple y no falla. «Tu mes» se calcula con `mesDe(fecha)`, como siempre.
- **Patrones como datos, no como código:** una lista por banco `{ banco, app, gasto: [palabras], ingreso: [palabras], ignorar: [palabras], comercio: patrón }` y una entrada «genérica» que usa solo las reglas de arriba. Así añadir o arreglar un banco es tocar una lista, con su prueba automática por cada ejemplo.
- **Cómo conseguir los ejemplos reales (paso 0, antes de programar):** en la prueba cerrada, un «modo muestra» solo para el dueño y quien quiera: copia el texto de los avisos del banco en el móvil, cambia cifras y nombres por `XX,XX` y `COMERCIO`, y lo deja listo para mandar por correo. Nada sube solo. Con 3 o 4 ejemplos por banco basta para empezar. Lo revisa Datos y seguridad.

## 5. Primera versión y después

| | Primera versión | Después |
|---|---|---|
| Bancos | 3 o 4 que use el grupo (según la pregunta 1) + genérico | Resto de `BANCOS`, cuando alguien mande ejemplos |
| Tipos | Gastos e ingresos en euros (tarjeta, Bizum, transferencias, devoluciones) | Traspasos entre tus cuentas (mismo importe que sale de una y entra en otra), otra moneda en viajes |
| Confirmar | En la bandeja, dentro de la app | Botón «Apuntar» en el propio aviso, con la app cerrada |
| Juntos | No | «Compartir este gasto» desde la fila (`compRapidoHtml`) |
| Patrones | Dentro de la app (se actualizan con cada versión) | En una tabla pública de Supabase, como `precios_carburante`, para arreglar un banco sin sacar versión |

## 6. Riesgos

| Riesgo | Qué hacemos |
|---|---|
| **Xiaomi, Samsung, Huawei y otros cierran apps en segundo plano** para ahorrar batería, y el lector deja de recibir avisos sin decir nada | Detectar el silencio: si un banco no da avisos en 7 días y el usuario apunta gastos de ese banco, fila en Tú: «No nos llegan los avisos de ING» con los pasos de su marca de móvil (quitar el ahorro de batería a PalomApp) |
| **Batería** | El lector de Android solo se despierta cuando llega un aviso. No hay que dejar nada encendido todo el rato. No es de esperar un gasto apreciable, pero no lo hemos medido |
| **APK fuera de Google Play** | Android bloquea el permiso («ajustes restringidos»). Solo lo ofrecemos con la app de Google Play (2.2) |
| **Google Play** revisa más las apps con datos financieros | Aviso destacado previo (2.2), política de privacidad actualizada (`privacidad.html`) y declarar el uso en la ficha de datos. Lo revisa Datos y seguridad antes de subir la versión |
| **El banco cambia el texto** | Contador de «avisos de banco que no hemos entendido». Si sube de golpe, el patrón se ha roto |
| **Proponer un gasto falso** (rechazado, preautorización de un hotel o una gasolinera que luego cambia) | Lista de «nunca» del §3 y nunca apuntar solo. Las preautorizaciones no las podemos distinguir siempre: el usuario descarta |
| **Pesadez** | Un solo aviso agrupado y silencioso. Si en 30 días descarta más de lo que apunta, preguntar «¿Seguimos proponiéndote los gastos?» |
| **Privacidad** | El texto del aviso nunca se guarda ni sube. El repositorio es público: nada de ejemplos reales en las pruebas, solo inventados |

**Cómo medir si funciona** (contadores en el móvil, sin textos ni importes; subir los totales al panel de KPIs necesita a Datos y seguridad):

| Medida | Objetivo propuesto |
|---|---|
| Avisos de banco entendidos / leídos | 90 % o más |
| Propuestas apuntadas / propuestas | 60 % o más |
| Apuntadas sin cambiar el importe | 95 % o más |
| Duplicados que el usuario marca «Es el mismo» | Bajando con el tiempo |
| Personas que lo apagan en el primer mes | Menos de 1 de cada 4 |

Los objetivos son de Producto, para la prueba cerrada; no vienen de ningún estudio.

## 7. Preguntas para el dueño

1. **¿Con qué bancos empezamos?** Proponemos los 3 o 4 que más use el grupo. *Bloquea:* sin saberlo no se pueden pedir ejemplos.
2. **¿Tú (y alguien más) podéis mandarnos 3 o 4 avisos reales de cada banco, con cifras y nombres tapados?** *Bloquea:* no hemos encontrado ningún texto real en la web y los patrones no se pueden programar a ciegas.
3. ¿Bandeja + un aviso silencioso (recomendado), o prefieres un aviso por cada pago? No bloquea.
4. ¿Proponemos también los ingresos (Bizum recibido, nómina, devoluciones) desde el principio, o solo los gastos? No bloquea. Proponemos los dos.
5. ¿Te vale que «Apuntar» desde el propio aviso, con la app cerrada, quede para la segunda versión? No bloquea.

## 8. Lo que no hemos podido averiguar o confirmar

- **Ningún texto real de aviso de un banco español** (§4). Tampoco si cada banco pone el comercio, si usa «€» o «EUR», o si avisa de Bizum y transferencias además de la tarjeta.
- Los nombres internos de las apps de banco en Google Play: los debe confirmar Desarrollo.
- Si Google Wallet avisa de cada pago con su propio texto en España y si conviene leerlo como fuente genérica.
- Si los avisos del banco tienen coste en algún banco. Una página dice que en CaixaBank activar avisos cuesta, pero no hemos comprobado si se refiere a los avisos en la app o a los SMS.
- No hemos encontrado ninguna norma de Google Play solo para el permiso de leer notificaciones (la vista previa de normas de 2027 no lo menciona), pero no lo descartamos.
- El consumo de batería real y el comportamiento en Xiaomi o Samsung: no lo hemos probado en un móvil real.

## 9. Fuentes (consultadas el 11/11/2026)

- BBVA, notificaciones: https://www.bbva.es/personas/banca-online/notificaciones.html (interés propio: es el banco)
- Banco Santander, alertas: https://www.bancosantander.es/particulares/banca-online/alertas/ (interés propio)
- CaixaBank, activar notificaciones: https://www.caixabank.es/particular/banca-digital/activar-notificaciones-app-caixabanknow.html (interés propio)
- Olik Split, «Bank notifications»: https://oliksplit.app/features/bank-notifications (interés propio: vende la función)
- Genbeta, avisos del banco en el móvil: https://www.genbeta.com/truco/pedir-copia-al-pagar-tarjeta-importante-te-puedes-ahorrar-asi-puede-ser-tu-movil-mejor-sustituto
- Google Play, vista previa de normas sobre permisos (2027): https://support.google.com/googleplay/android-developer/answer/16909972
- Cierre de apps en segundo plano por marca: https://help.biolovision.net/Keep_Background_Services_Alive_on_Android_(by_Brand) y https://www.howtogeek.com/762936/how-to-stop-android-from-killing-background-apps/
- Lo de Android 15 (OTP ocultos), ajustes restringidos y datos financieros sensibles en Play: fuentes de `docs/25` §10.
- Código de la app: `DESCUBRE`, `BANCOS`, `reglaPara`, `reglaTras`, `sugerirCategoria`, `impCandidatos`, `numCampo`, grupos de `renderTuV2`.

Para el PDF: un boceto de móvil en tres pasos (aviso del banco → aviso de PalomApp «3 gastos por apuntar» → bandeja con una fila «Mercadona −12,50 € · Apuntar»), y la tabla del §3 como dos columnas, «Te lo proponemos» y «Nunca lo leemos».

## Decisiones del dueño (11/11/2026, noche) y lo hecho en la rama `fase12/avisos`

- **Cualquier banco:** lector general (`movil/android/.../LectorAvisos.java`, con pruebas JUnit) y, de serie, Santander, Trade Republic, Sabadell, N26 y los bancos más usados (`PAQ_BANCOS` en `app.js`). Si una app no marcada avisa de algo con pinta de pago, se anota solo su nombre y se propone en Tú → Avisos.
- **Se apuntan solos** (en vez de «¿Apuntar…?»): Android avisa «Apuntado en PalomApp: 12,50 € en Mercadona» (sin cifras con el móvil bloqueado) y en Inicio sale «Apuntados de tus avisos» con borrar en un toque y «Están bien». Datos y Seguridad recomendaba confirmar; el dueño prefiere apuntar solo y borrar fácil.
- **Primera fase:** el aviso se lee al momento, pero se guarda en la cuenta al abrir PalomApp (al tocar el aviso o al volver a la app). Guardar con la app cerrada del todo es la fase 2 (servidor).
- **Columna `movimientos.origen`** aplicada con su «sí» (`supabase/migrations/2026-11-11_movimientos_origen.sql`).
- En Bizum y transferencias no se guarda el nombre de la otra persona: la descripción es «Bizum recibido», «Transferencia enviada»…
- **Recordatorios en el móvil** (Tú → Avisos): cobros y pagos fijos el día antes y tareas de la Agenda el mismo día, a las 9:00 (`@capacitor/local-notifications`).
- La versión de prueba (APK) se instala al lado de la de Google Play como «PalomApp prueba» (`es.palomapp.finanzas.prueba`).

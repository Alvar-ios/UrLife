# 50 · Ficha del App Store para PalomApp (lista para copiar y pegar)

*Marketing y Comunicación · 25 de noviembre de 2026. App de iPhone «PalomApp: gastos y tareas», identificador `es.palomapp.finanzas`, versión 1.0. Todo en español de España. Los límites de Apple se han mirado hoy en sus páginas de ayuda (apartado 12, «Fuentes»). Los caracteres de cada texto los ha contado un script (Python, `len()` y bytes UTF-8) sobre el texto exacto de este documento. Se respetan las decisiones del dueño: nada de «gratis y sin límites», sin anuncios, no conecta con el banco. Avanza el paso 13 del plan (ficha en las tiendas), parte App Store.*

## Conclusión

1. **Todo lo que hay que escribir en App Store Connect está aquí**, campo a campo, con su límite y su recuento. Lo único que falta son los huecos personales: tu nombre para el copyright, tu teléfono y tu correo para la revisión, y la cuenta de prueba (la contraseña solo dentro de App Store Connect).
2. **Sorpresa: en la versión 1.0 no hay campo de «Novedades».** Apple solo lo pide a partir de la segunda versión. Dejamos el texto listo para la 1.0.1 y otro para TestFlight («Qué probar»).
3. **Las palabras clave cuentan bytes, no letras:** una tilde ocupa 2. Por eso van sin tildes y sin repetir lo que ya dice el nombre o el subtítulo (97 de 100).
4. **Riesgos de la revisión, por orden:** que digan que es «una web metida en una app» (guía 4.2: las notas para el revisor enumeran las 6 funciones propias de iPhone), que una app de finanzas de una persona física choque con la guía 5.1.1(ix) (las notas dejan claro que no es un banco ni mueve dinero) y que algo nativo falle en un iPhone real, porque **nada se ha probado aún en uno** (widgets, Face ID, Atajos, cámara).
5. **Recomendado:** subtítulo «Finanzas y cuentas en pareja», clasificación 4+, comerciante UE = «no comerciante» mientras sea gratis y sin anuncios, y quitar China continental de la disponibilidad.

---

## 1. Nombre, subtítulo y categoría (App Store Connect → tu app → General → Información de la app)

| Campo | Texto para pegar | Caracteres (límite) |
|---|---|---|
| **Nombre** (ya registrado) | `PalomApp: gastos y tareas` | 25 (30) |
| **Subtítulo** (recomendado) | `Finanzas y cuentas en pareja` | 28 (30) |
| Alternativa 1 | `Ahorro y cuentas con tu pareja` | 30 (30) |
| Alternativa 2 | `Tu dinero y el que compartes` | 28 (30) |
| ~~El lema~~ | `Lo tuyo, lo nuestro, todo claro` | 31: **no cabe** (30) |
| **Categoría principal** | Finanzas | — |
| **Categoría secundaria** | Productividad | — |

Por qué este subtítulo: Apple busca por las palabras del nombre, del subtítulo y de las palabras clave juntas. El nombre ya trae «gastos» y «tareas»; el subtítulo suma «finanzas», «cuentas» y «pareja» (la pareja es el centro de Juntos, decisión del 16/10). El lema provisional «Lo tuyo, lo nuestro, todo claro» se pasa por un carácter, así que va al final de la descripción. Apple pide que el subtítulo no nombre otras apps ni haga promesas que no se puedan comprobar (guía 2.3.7): ninguna de las opciones lo hace.

## 2. Texto promocional (170) · versión 1.0 → «Texto promocional»

Se puede cambiar cuando quieras sin mandar una versión nueva.

Recomendado (146 de 170):

```
Apunta un gasto en segundos, repártelo con tu pareja, tu piso o tus amigos aunque no tengan la app, y mira de un vistazo lo que te queda este mes.
```

Alternativa para cuando salga (148 de 170):

```
Ya en iPhone: tus gastos, los que compartes y tus tareas en una sola app. Con widgets, Face ID y pagos de Apple Pay que se apuntan solos con Atajos.
```

## 3. Descripción (4.000) · versión 1.0 → «Descripción»

3.084 caracteres de 4.000. Texto plano (Apple no admite HTML). Los títulos van en mayúsculas para que se vean como secciones, sin emojis.

```
Tu dinero y el que compartes, en una sola app.

PalomApp junta tus finanzas, los gastos que compartes con tu pareja, tu piso o tus amigos, y tus tareas. Lo que pagas en un grupo cuenta también en tus cuentas, sin hojas de cálculo y sin ir saltando de una app a otra.

APUNTAR EN SEGUNDOS
• Gastos e ingresos con un teclado propio: escribes la cifra, eliges la categoría y listo.
• «Repetir» los gastos de siempre con un toque.
• Haz una foto al ticket: la app lo lee y te deja repartirlo artículo por artículo.
• ¿Pagaste en otra moneda? Se convierte a euros.

QUE SE APUNTEN SOLOS
• Con la app Atajos, cada pago con Apple Pay o cada aviso de tu banco puede apuntarse solo en PalomApp.
• El texto del aviso se lee en tu iPhone y no sale de él: solo se guarda el movimiento (importe, comercio, fecha y cuenta).
• Cada movimiento apuntado así trae «Deshacer».
• Una guía con dibujos te lo explica paso a paso.

TU MES, CLARO
• Lo que te queda este mes, de un vistazo, y en qué se va tu dinero.
• «Tu mes» puede empezar el día que cobras, no solo el día 1.
• Varias cuentas con su saldo, traspasos entre ellas y cobros y pagos fijos.
• Un resumen de cada mes y de cada año, e informes para ver cómo vas.

JUNTOS: GASTOS COMPARTIDOS
• Grupos para la casa, el piso o un viaje.
• Comparte un gasto con alguien aunque no tenga la app: basta con su nombre, y le mandas el detalle por WhatsApp.
• Reparte a partes iguales o como queráis.
• «¿De dónde sale?»: cada saldo explicado línea a línea.
• «Saldar todo» con una persona de una vez, y pedir lo que te deben.
• Historial del grupo: si alguien borra un gasto, se puede recuperar.

METAS, DEUDAS E INVERSIONES
• Metas de ahorro con hitos: míralas como camino, tarros o anillos.
• Lo que tienes: cuentas e inversiones menos deudas.
• Deudas con su cuota y lo que te queda por pagar.

AGENDA
• Tareas y calendario en la misma app.
• Comparte tareas o tu agenda con tu pareja o tu grupo: quién hace qué y cuándo.
• Recordatorios en el móvil de tus pagos fijos y tus tareas.

EN TU PANTALLA DE INICIO
• Widget «Te queda este mes»: tu cifra del mes sin abrir la app.
• Widget «Apuntar gasto»: un toque y estás escribiendo el importe.

PRIVADA Y TUYA
• Abre la app con Face ID.
• Oculta las cifras cuando quieras, por ejemplo en público.
• Sin anuncios y sin seguimiento.
• No es un banco: no mueve dinero, no presta y no te vende productos financieros.
• No se conecta con tu banco ni te pide sus claves: apuntas tú, se apunta solo con Atajos o importas el extracto.
• La foto del ticket se lee y no se guarda: solo los artículos que confirmas.
• Descarga tus movimientos en Excel o haz una copia de seguridad cuando quieras.
• Puedes borrar tu cuenta y todos tus datos desde la propia app.

Y ADEMÁS
• Importa el extracto de tu banco o tu Excel de gastos, sin duplicados.
• Calculadora de lo que cuesta un trayecto en coche.
• Empieza con lo básico y descubre el resto cuando lo necesites.
• Modo oscuro y varios colores a elegir.
• Incluye 10 lecturas de tickets con foto al mes.

Hecha en España, en español.

Lo tuyo, lo nuestro, todo claro.
```

Qué se ha cuidado:
- **Nada de «gratis»** ni «sin límites»: sí se dice «sin anuncios», y la única cifra es «10 lecturas de tickets al mes», que es la de las cuentas nuevas (todas las del App Store lo serán). Si cambia el límite, hay que cambiar esta línea.
- **Sin competidores ni otras plataformas:** no se nombra ninguna app ni Android (guía 2.3.10: no mencionar otras plataformas móviles en la ficha).
- **Marcas de Apple solo para describir:** «Apple Pay», «Face ID», «iPhone» y «la app Atajos» se usan para decir con qué funciona, nunca en el nombre, en el subtítulo ni en las palabras clave, sin plurales ni el logo (normas de Apple para terceros). «Excel» se usa igual, solo descriptivo.
- **Solo funciones que existen en el código** (comprobado en `app.js`, `AppDelegate.swift` y `PalomaWidget.swift`). No se dicen los avisos de Juntos con la app cerrada ni «Compartir con PalomApp»: en iPhone aún no están (`docs/48` §3).

## 4. Palabras clave (100 bytes) · versión 1.0 → «Palabras clave»

97 de 100 (bytes = caracteres, porque no llevan tildes):

```
dividir,compartidos,presupuesto,ahorro,dinero,tickets,piso,viaje,amigos,deudas,agenda,metas,hogar
```

- Separadas por comas, sin espacios. Ninguna repite el nombre (palomapp, gastos, tareas) ni el subtítulo (finanzas, cuentas, pareja), y ninguna es una marca de otros (ni bancos, ni Bizum, ni Excel, ni otras apps): Apple lo prohíbe (guía 2.3.7).
- «compartidos» se junta en las búsquedas con «gastos» del nombre: así salimos en «gastos compartidos».
- Sin tildes a propósito: cada tilde gasta 2 bytes. **No hemos podido confirmar** en una página de Apple si su buscador trata igual «nomina» y «nómina»; por eso hemos dejado fuera palabras que necesitan tilde.
- Si usas la alternativa 1 de subtítulo (con «ahorro»), cambia `ahorro` por `nomina` en esta lista.

## 5. Novedades de esta versión

**En la versión 1.0 no hay que rellenarlo:** Apple dice que el campo es obligatorio en cada versión *después de la primera* y que no está disponible en la primera. Lo dejamos listo:

Para la **1.0.1** (o la primera actualización) (211 de 4.000; cambia los puntos por lo que traiga de verdad):

```
• Widgets «Te queda este mes» y «Apuntar gasto» para la pantalla de inicio.
• Que se apunten solos: pagos con Apple Pay y avisos de tu banco con la app Atajos.
• Arreglos y mejoras para que todo vaya más fluido.
```

Para **TestFlight → «Qué probar»** de la 1.0 (320 caracteres):

```
Primera versión para iPhone. Prueba sobre todo: entrar con Face ID, la foto de un ticket, los widgets «Te queda este mes» y «Apuntar gasto», y en Tú → Avisos la guía para que se apunten solos los pagos con Apple Pay (con «Probar PalomApp» en Atajos). Si algo falla, cuéntanoslo desde Tú → Ayuda y novedades → Escríbenos.
```

## 6. Clasificación por edades · General → Información de la app → Clasificación por edades → Editar

Resultado esperado: **4+**. Respuestas del cuestionario (el de 2025, con 4+, 9+, 13+, 16+ y 18+):

| Bloque del cuestionario | Respuesta | Por qué |
|---|---|---|
| Controles en la app: control parental, verificación de edad | No / No | La app no tiene ninguno de los dos |
| Acceso libre a la web | No | No hay navegador dentro; los enlaces (privacidad, WhatsApp, correo) abren otras apps. Un «Sí» la subiría a 16+ |
| Contenido generado por usuarios | No | Apple lo define como «difusión amplia» de lo que crean los usuarios. En PalomApp los gastos, nombres y fotos de grupo solo los ven los miembros de ese grupo |
| Redes sociales | No | No hay muro, «me gusta» ni comentarios |
| Mensajes y chat | No | No hay chat; «Pedir por WhatsApp» abre WhatsApp |
| Compartir ubicación | No | No pide la ubicación; la calculadora de trayecto usa sitios que escribes tú |
| Publicidad | No | Sin anuncios |
| Temas adultos (palabrotas, terror, alcohol/tabaco/drogas, citas y relaciones) | Ninguno | «Citas y relaciones» es para apps de ligar; compartir gastos con la pareja no lo es |
| Médico o bienestar | Ninguno | No hay información médica ni de salud |
| Sexo o desnudos | Ninguno | — |
| Violencia y armas | Ninguno | — |
| Azar: apuestas, apuestas simuladas, concursos, cajas de botín | Ninguno | Las metas son tuyas, no hay rankings ni premios |

Nota: la política de privacidad dice que PalomApp no está pensada para menores de 14 años. No choca con el 4+: la clasificación de Apple mide el contenido, no a quién va dirigida. No marques «Hecha para niños».

## 7. URL y otros datos · versión 1.0 y General → Información de la app

| Campo | Qué poner | Nota |
|---|---|---|
| **URL de la política de privacidad** | `https://urlife-zeta.vercel.app/privacidad.html` | Existe y está en español e inglés |
| **URL de soporte** (obligatoria) | `https://urlife-zeta.vercel.app/privacidad.html` *(provisional)* | Apple exige que lleve a datos de contacto reales. **No hay página de ayuda ni de soporte en el repositorio.** `bienvenido.html` es la página para probadores de Android (no sirve: habla de Android) y la web principal es la pantalla de entrar, sin contacto. La de privacidad sí tiene el correo de contacto. **Conviene una página `soporte.html`** (correo, preguntas frecuentes, cómo borrar la cuenta); la haría Desarrollo y es un cambio en la web, así que necesita tu «publica» |
| **URL de marketing** (opcional) | Vacía | Cuando haya web de presentación (paso 14 del plan) |
| **Copyright** | `2026 [tu nombre completo, como en la cuenta de desarrollador]` | Apple pone el símbolo © solo |
| **Precio** | Gratis (precio 0) en «Precios y disponibilidad» | Es el ajuste de precio, no un texto: en la ficha no escribimos «gratis» |
| **Cifrado** | Ya contestado en la app (`ITSAppUsesNonExemptEncryption = NO`) | Si Apple lo pregunta: «No usa cifrado propio, solo el estándar de iOS» |

## 8. Privacidad de la app · General → Privacidad de la app → Empezar

Primera pregunta, «¿Recoges datos de esta app?»: **Sí**. Luego marca estos 6 tipos y, en cada uno, responde igual: **uso = Funcionalidad de la app**, **vinculado a la identidad = Sí**, **rastreo = No**.

| Grupo de Apple | Tipo | Qué es en PalomApp |
|---|---|---|
| Información de contacto | Nombre | El nombre que ven tus grupos |
| Información de contacto | Correo electrónico | Para entrar en la cuenta |
| Información financiera | Otra información financiera | Movimientos, cuentas y saldos, metas, deudas, inversiones |
| Contenido del usuario | Fotos o vídeos | La foto del grupo, si alguien la pone |
| Contenido del usuario | Otro contenido del usuario | Tareas, agenda, nombres de grupos, gastos compartidos, ajustes |
| Identificadores | ID de usuario | El identificador de tu cuenta |

**No marques** (no se recogen): ubicación, contactos, salud, información de pago (no guardamos tarjetas), información de crédito, historial de navegación o de búsqueda, datos de uso, diagnósticos (no hay herramienta de fallos ni de analítica en el código), ID de dispositivo (en iPhone no se envía: los avisos de Juntos con la app cerrada aún no existen allí), mensajes, audio ni compras.

Por qué así:
- **Coincide con el manifiesto** `movil/ios/App/App/PrivacyInfo.xcprivacy` (24/11, Datos y Seguridad): los mismos 6 tipos, vinculados, sin rastreo, para funcionalidad. Y con `privacidad.html`.
- **Las fotos de tickets** no cuentan como «recogidas»: Apple dice que lo que se manda y se descarta en cuanto se atiende la petición no hay que declararlo. Aun así «Fotos» sale marcado por la foto del grupo, que sí se guarda.
- **El texto de los avisos del banco** se lee en el móvil y no sale de él; Apple dice que lo que se procesa solo en el dispositivo no es «recogido». Lo que sí sale (el movimiento) ya está en «Otra información financiera».
- **Las cifras del panel de KPIs** son recuentos de todos juntos hechos con lo que ya se guarda; no se recogen datos de uso nuevos.
- **Duda para Datos y Seguridad:** el CAPTCHA (Turnstile) ve datos técnicos del navegador al entrar. El manifiesto no lo declara. Si Apple lo pregunta, la casilla sería «Otros datos de diagnóstico» con uso «Funcionalidad de la app» (evitar fraude). No bloquea.

## 9. Información para la revisión de la app · versión 1.0 → «Información para la revisión de la app»

- **¿Se necesita iniciar sesión?** Sí. Usuario: `[correo de prueba]`. Contraseña: `[contraseña: solo en App Store Connect]`. Apple pide que la cuenta no caduque.
- **Contacto:** nombre, apellidos, teléfono en formato internacional (`+34 …`) y correo: los tuyos, solo dentro de App Store Connect.
- **Antes de enviar**, prepara la cuenta de prueba con datos inventados: 2 cuentas, unos 15 gastos, un grupo de Juntos con una persona sin la app, una meta, una deuda y 3 tareas. Nada real.
- **Notas** (2.574 bytes de 4.000; Apple admite cualquier idioma, mejor en inglés). Pega esto:

```
PalomApp is a personal budgeting, shared-expenses and to-do app (UI in Spanish). It only records what the user enters: it does not move money, offer banking, payments, loans or investment services, and it does not connect to any bank.

DEMO ACCOUNT
Email: [correo de prueba]
Password: [contraseña: solo en App Store Connect]
The account has sample data (made-up accounts, expenses, a shared group with a person who has no app, goals and tasks).

NATIVE FEATURES AND HOW TO SEE THEM
1. Face ID: tab "Tú" > "Seguridad y privacidad" > "Pedir huella al abrir" (on iPhone it uses Face ID). Close and reopen the app.
2. Camera (receipts): tap "+" > "Foto de ticket". Take a photo of any shop receipt; the app reads the items and lets you split them. The photo is not stored. Camera is also used to set a group photo.
3. Home Screen widgets: long-press the Home Screen > "+" > PalomApp. "Te queda este mes" (what is left this month) and "Apuntar gasto" (opens the amount keypad).
4. Shortcuts / App Intents: open the Shortcuts app and search "PalomApp". Three actions:
 - "Probar PalomApp": a test action. In PalomApp go to "Tú" > "Avisos" > "Comprobar ahora", then run "Probar PalomApp" in Shortcuts and come back: the app shows "¡Funciona!". It does not add any expense.
 - "Apuntar pago de Apple Pay": meant for a Wallet "Transaction" personal automation; it adds the payment (amount, merchant) as an expense.
 - "Apuntar aviso en PalomApp": meant for a "Notification" personal automation on a Spanish bank app; the user picks the bank from a list.
 Reading real bank notifications cannot be tested without an account at a real Spanish bank, so "Probar PalomApp" is provided to show the connection works. The notification text is parsed on the device and never leaves it; only the resulting transaction is saved. Pending items are deleted after 7 days.
5. Local notifications: reminders for fixed payments ("Tú" > "Dinero" > "Cobros y pagos fijos") and for tasks with a reminder in "Agenda". Permission is requested when the user first creates one.
6. Share sheet: "Tú" > "Tus datos" > "Descargar mis movimientos (Excel)" or "Copia de seguridad" opens the iOS share sheet to save or send the file.

ACCOUNT DELETION
In the app: tab "Tú" > "Seguridad y privacidad" > "Borrar mi cuenta". It deletes the account and its data on our server.

OTHER NOTES
- Shared expenses ("Juntos") are private to the members of each group; there is no public content, chat or feed.
- No ads, no tracking, no in-app purchases.
- Privacy policy: https://urlife-zeta.vercel.app/privacidad.html
```

Traducción para ti (no se pega):

```
PalomApp es una app de presupuesto personal, gastos compartidos y tareas (en español). Solo apunta lo que pone el usuario: no mueve dinero, no ofrece servicios de banco, pagos, préstamos ni inversión y no se conecta con ningún banco.

CUENTA DE PRUEBA
Correo: [correo de prueba]
Contraseña: [contraseña: solo en App Store Connect]
La cuenta tiene datos de ejemplo (cuentas, gastos, un grupo compartido con una persona sin la app, metas y tareas, todo inventado).

FUNCIONES NATIVAS Y CÓMO VERLAS
1. Face ID: pestaña «Tú» > «Seguridad y privacidad» > «Pedir huella al abrir» (en iPhone usa Face ID). Cierra y vuelve a abrir la app.
2. Cámara (tickets): «+» > «Foto de ticket». Haz una foto a cualquier ticket; la app lee los artículos y deja repartirlos. La foto no se guarda. La cámara también sirve para poner foto a un grupo.
3. Widgets: mantén pulsada la pantalla de inicio > «+» > PalomApp. «Te queda este mes» y «Apuntar gasto» (abre el teclado del importe).
4. Atajos / App Intents: abre Atajos y busca «PalomApp». Tres acciones:
 - «Probar PalomApp»: de prueba. En PalomApp ve a «Tú» > «Avisos» > «Comprobar ahora», ejecuta «Probar PalomApp» en Atajos y vuelve: la app enseña «¡Funciona!». No apunta ningún gasto.
 - «Apuntar pago de Apple Pay»: para una automatización personal de Wallet («Transacción»); apunta el pago (importe, comercio) como gasto.
 - «Apuntar aviso en PalomApp»: para una automatización «Notificación» sobre la app de un banco español; el usuario elige el banco de una lista.
 Leer avisos reales del banco no se puede probar sin una cuenta en un banco español de verdad; por eso existe «Probar PalomApp», que demuestra que la conexión funciona. El texto del aviso se lee en el móvil y nunca sale de él; solo se guarda el movimiento. Lo pendiente se borra a los 7 días.
5. Avisos del móvil: recordatorios de pagos fijos («Tú» > «Dinero» > «Cobros y pagos fijos») y de tareas con aviso en la «Agenda». El permiso se pide al crear el primero.
6. Compartir archivos: «Tú» > «Tus datos» > «Descargar mis movimientos (Excel)» o «Copia de seguridad» abre el menú de compartir de iOS para guardar o mandar el archivo.

BORRAR LA CUENTA
En la app: pestaña «Tú» > «Seguridad y privacidad» > «Borrar mi cuenta». Borra la cuenta y sus datos en nuestro servidor.

OTRAS NOTAS
- Los gastos compartidos («Juntos») solo los ven los miembros de cada grupo; no hay contenido público, chat ni muro.
- Sin anuncios, sin rastreo y sin compras dentro de la app.
- Política de privacidad: https://urlife-zeta.vercel.app/privacidad.html
```

Rutas comprobadas en `app.js` hoy (Tú «Por temas», la versión de serie): «Seguridad y privacidad» → «Pedir huella al abrir» y «Borrar mi cuenta»; «Dinero» → «Cobros y pagos fijos»; «Tus datos» → «Descargar mis movimientos (Excel)» y «Copia de seguridad»; «Avisos» → «Comprobar ahora»; «+» → «Foto de ticket». Las acciones de Atajos, en `AppDelegate.swift`; los widgets, en `PalomaWidget.swift`.

**Dos cosas para Desarrollo antes de enviar** (no he tocado código):
1. En iPhone el botón dice «Pedir **huella** al abrir», pero usa Face ID. Mejor «Pedir Face ID al abrir» en iPhone: un revisor lo puede ver como un descuido.
2. Comprobar en TestFlight que lo de las notas funciona como se dice: widgets, Face ID, «Probar PalomApp» → «¡Funciona!», el menú de compartir del Excel y que el permiso de avisos se pide al crear el primer fijo. **Nada de esto se ha probado en un iPhone real.**

## 10. Declaración de comerciante de la UE (Ley de Servicios Digitales)

- **Recomendado: «No soy comerciante»** mientras PalomApp sea gratis, sin anuncios, sin compras dentro y sin IVA. Apple dice que un aficionado sin intención de ganar dinero difícilmente es comerciante, pero la decisión es tuya y Apple no la toma por ti. Efecto: en la UE la ficha avisa de que los derechos del consumidor no se aplican a ese contrato, y no se publica ningún dato tuyo.
- **Si algún día cobras** (plan de pago, compras dentro, anuncios), pasas a ser comerciante: Apple pide dirección (o apartado de correos con justificante), teléfono y correo verificados, y un documento que acredite nombre y dirección, y **los enseña en la ficha** de los 27 países de la UE. Conviene preguntarlo a un asesor antes de dar ese paso.
- Dónde: Empresa (Business) → Acuerdos → Cumplimiento → Ley de Servicios Digitales. Si no lo has contestado, App Store Connect te lo pregunta al enviar la primera app.

## 11. Pasos en App Store Connect, en orden

1. **Ley de Servicios Digitales** (apartado 10): Empresa → Acuerdos → Cumplimiento → «Completar requisitos» → «No es una cuenta de comerciante». De paso, acepta el acuerdo de apps gratuitas si te lo pide.
2. **Información de la app** (Apps → PalomApp → General → Información de la app): comprueba el nombre, pega el **subtítulo**, elige **Finanzas** y **Productividad**, rellena la **clasificación por edades** (apartado 6) y guarda.
3. **Privacidad de la app** (General → Privacidad de la app): URL de privacidad y la tabla del apartado 8 → **Publicar**.
4. **Precios y disponibilidad:** precio 0 (gratis). En **Disponibilidad**, deja todos los países y **desmarca «China continental»** (allí algunas apps necesitan un número de registro ICP del Gobierno chino, que no tenemos). Guarda.
5. **Versión 1.0** (columna de la izquierda, «iOS App 1.0»):
   1. **Capturas de 6,9″** (las prepararemos aparte con datos inventados; sin ellas no se puede enviar).
   2. Pega **Texto promocional** (2), **Descripción** (3) y **Palabras clave** (4).
   3. **URL de soporte** (7) y, si hay, URL de marketing.
   4. **Copyright** (7).
6. **Compilación:** en «Compilación», pulsa «+» y elige la que subió GitHub (`docs/48`, paso 5; versión 1.0.0). Solo sale cuando Apple termina de procesarla (unos minutos tras verla en TestFlight). Si pregunta por cifrado, contesta como en el apartado 7.
7. **Información para la revisión** (9): marca que hace falta iniciar sesión, pon la cuenta de prueba, tus datos de contacto y pega las **notas en inglés**.
8. **Publicación de la versión:** elige «Publicar manualmente esta versión», así decides tú el día después de que la aprueben.
9. Arriba a la derecha: **Añadir para revisión** → **Enviar a revisión de la app**.

## 12. Fuentes (consultadas el 25/11/2026)

- Apple, campos de la versión (texto promocional 170, descripción 4.000, palabras clave 100 bytes, novedades solo desde la segunda versión, notas de revisión 4.000 bytes, URL de soporte con contacto, copyright): https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
- Apple, clasificación por edades (preguntas y escala 4+/9+/13+/16+/18+): https://developer.apple.com/help/app-store-connect/reference/age-ratings
- Apple, Ley de Servicios Digitales (comerciante o no, qué se publica, dónde se marca): https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements
- Apple, detalles de privacidad (qué es «recoger», lo que se descarta o se procesa en el móvil, tipos de datos, rastreo): https://developer.apple.com/app-store/app-privacy-details/
- Apple, normas de revisión (2.1 cuenta de prueba, 2.3.7 metadatos y palabras clave, 2.3.10 otras plataformas, 4.2 funciones mínimas, 5.1.1(v) borrar la cuenta, 5.1.1(ix) campos regulados): https://developer.apple.com/app-store/review/guidelines/
- Apple, uso de sus marcas por terceros (como adjetivo, sin plurales, sin el logo, no en el nombre del producto): https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html
- Apple, información de cumplimiento (China continental: el Ministerio chino MIIT exige a algunas apps un número de registro ICP que debe coincidir con la ficha): https://developer.apple.com/help/app-store-connect/reference/app-information/app-and-compliance-information
- Del repositorio (25/11/2026): `app.js`, `movil/ios/App/App/AppDelegate.swift`, `Info.plist`, `PrivacyInfo.xcprivacy`, `movil/ios/App/PalomaWidget/PalomaWidget.swift`, `privacidad.html`, `supabase/functions/tickets-ia/index.ts`, `docs/48`, `docs/49`, `docs/marketing/12-ficha-google-play.md`.

## 13. Lo que no hemos podido averiguar

- Si el buscador del App Store trata igual las palabras con y sin tilde, o el singular y el plural.
- Los nombres exactos en español de cada botón de App Store Connect (los de este documento siguen la ayuda de Apple en inglés traducida).
- Si la automatización «Notificación» de Atajos llega en iOS 27 con ese nombre (`docs/48` §3).

## 14. Lo que debe decidir el dueño

1. **Subtítulo:** «Finanzas y cuentas en pareja» (recomendado), «Ahorro y cuentas con tu pareja» o «Tu dinero y el que compartes».
2. **URL de soporte:** ¿vale la de privacidad de momento, o pides a Desarrollo una página `soporte.html` antes de enviar? (Recomendado: la página; es corta.)
3. **Comerciante UE:** confirmar «no comerciante».
4. **Cuenta de prueba:** crearla tú con datos inventados (la contraseña solo en App Store Connect).
5. ¿Cambiar «Pedir huella al abrir» por «Pedir Face ID al abrir» en iPhone antes de enviar? (Es de Desarrollo.)

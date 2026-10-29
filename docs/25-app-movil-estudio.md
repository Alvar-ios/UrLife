# 25 · Estudio para la app del móvil: avisos, gastos automáticos y widgets (29/10/2026)

*Producto y diseño. Estudio previo, sin programar nada. Valora tres ideas del dueño para cuando PalomApp pase de web a app (APK y quizá iPhone): 4.1 notificaciones, 4.2 lectura automática de gastos y 4.3 widgets. Precios y normas consultados el 29/10/2026: pueden cambiar.*

## 1. Conclusión

1. **Pocas notificaciones, y solo de lo que hacen otros o de lo que va a pasar.** Lo que el usuario acaba de hacer él mismo ya lo ve en pantalla y no se notifica. Proponemos 5 tipos encendidos de serie, un máximo de 2 al día, silencio de 22:00 a 9:00 y un interruptor por tipo.
2. **Para la app, Capacitor mejor que TWA.** Con Capacitor la misma web se mete en una app de Android (y luego de iPhone) y puede usar avisos nativos, avisos programados en el propio móvil y widgets. La TWA es más sencilla, pero solo vale para Android y no ayuda en lo demás.
3. **Conectar con el banco no merece la pena hoy.** GoCardless (antes Nordigen), la opción gratis que usaban apps parecidas, no acepta clientes nuevos desde julio de 2025. Las demás piden contrato y no publican precios, y el usuario tiene que volver a dar permiso en su banco cada 180 días. **Primero, importar extractos más cómodo desde el móvil.** Después, si el dueño quiere, leer las notificaciones del banco como prueba opcional, **solo en Android** (en iPhone es imposible).
4. **Widgets solo con app nativa.** Una web no puede tener widgets. Con Capacitor tienen sentido tres: «Te queda este mes», «Apuntar gasto» y «Próximos pagos». En iPhone hace falta un Mac y pagar a Apple 99 USD al año.
5. **Orden recomendado:** primero los puntos 5 y 6 de la hoja de ruta (historial del grupo y viajes con otra moneda), después la app de Android con avisos y un widget, y lo demás después. El historial va antes por una razón: los avisos de Juntos («Ana cambió un gasto») salen de él.

## 2. Notificaciones (4.1)

### 2.1 Qué merece aviso (por prioridad)

Los textos son ejemplos, en el tono de la app, sin emojis. En Android el icono pequeño es el de la app, en blanco.

| # | Aviso | Ejemplo de texto | De serie | Cuándo y cuántas veces | Al tocar |
|---|---|---|---|---|---|
| 1 | Alguien añade, cambia o borra un gasto **en el que participas** (Juntos) | «Ana añadió 3 gastos en Viaje a Lisboa · te tocan 42,30 €» | Encendido | Agrupado: espera 30 min y junta todo lo de ese grupo en un aviso | La hoja del grupo |
| 2 | Te han pagado o saldado | «Luis te ha pagado 35,00 € · Piso» | Encendido | Al momento (respetando el silencio) | La hoja de la persona |
| 3 | Pago o cobro fijo **mañana** | «Mañana: Alquiler 750,00 € y Gimnasio 39,90 €» | Encendido | Un solo resumen a las 9:00 del día antes | Inicio, con los fijos |
| 4 | Plan o tarea con aviso | «Hoy: cena con Paloma, 21:00» | Lo que elija el usuario (ya existe: «Ese día», «El día antes», «1 semana antes») | Según lo elegido | La tarea |
| 5 | Tu mes ha terminado | «Octubre cerrado: gastaste 1.240 €, 85 € menos que en septiembre» | Encendido | 1 al mes, el día que empieza «Tu mes» | El resumen del mes |
| 6 | Te has pasado del presupuesto | «Restaurantes: llevas 230 € de 200 €» | Encendido, **pero solo si el gasto no lo apuntaste tú** (vino de Juntos o de una importación) | 1 vez por categoría y mes | Movimientos de esa categoría |
| 7 | Te deben desde hace tiempo | «Luis te debe 35,00 € desde hace 3 semanas · Pedir por WhatsApp» | Apagado | Como mucho cada 14 días por persona, y solo si la deuda pasa de 5 € | La hoja de la persona |
| 8 | Fijo que no se ha apuntado | «¿Se cobró ya el Gimnasio? Era el día 3» | Apagado | Resumen semanal, el lunes | Inicio, con los fijos |

**No se notifica nunca** (se queda dentro de la app, en Inicio): lo que hace el propio usuario, «vas justo» en un presupuesto, los cambios de las inversiones, las novedades de la app, rachas o «hace días que no apuntas», y cualquier cosa de marketing.

### 2.2 Límites

- **Máximo 2 al día** contando los automáticos (tipos 1, 2, 3, 5 a 8). Los avisos de la Agenda no cuentan porque los pide el propio usuario. Si hay más, se juntan en uno: «3 novedades en Juntos».
- **Silencio de 22:00 a 9:00** (se puede cambiar). Lo que llega de noche sale a las 9:00, todo junto.
- **Cada aviso lleva a su pantalla**, nunca a Inicio sin más.
- **Importes en la pantalla de bloqueo:** con el móvil bloqueado se puede enseñar la versión corta («Novedades en Juntos»), sin cifras. Lo decide el dueño (pregunta 3).
- **Pedir permiso en el momento justo**, nunca al abrir la app la primera vez: al unirse al primer grupo de Juntos («¿Te avisamos cuando alguien añada un gasto?») o al crear el primer fijo.

### 2.3 Ajustes

En Tú → «Avisos»: un interruptor por tipo (los 8 de la tabla, con su frase de ejemplo debajo), la hora del resumen (9:00 de serie) y las horas de silencio. En Android cada tipo es además un «canal» del sistema, así que el usuario también los puede apagar desde los ajustes del móvil.

### 2.4 Cómo se haría

Hay dos tipos de aviso, y conviene separarlos:

- **Lo que sabe el propio móvil** (tipos 3, 4, 5, 6 y 8). Hoy todos esos cálculos se hacen en el móvil (`avisosRecurrentes`, presupuestos, agenda). En la app nativa se **programan en el propio teléfono** cada vez que se abre la app, para los próximos 14 días. No hace falta servidor y los datos no salen del móvil. Limitación: si alguien no abre la app en dos semanas, deja de recibirlos.
- **Lo que hace otra persona** (tipos 1, 2 y 7). Tiene que mandarlo el servidor: cuando se guarda un gasto compartido, una función de Supabase avisa a los demás del grupo a través de Google (FCM) en Android, o de Apple (APNs) en iPhone. Esto necesita guardar en Supabase el «buzón» de avisos de cada móvil y sus preferencias, es decir, una tabla nueva. **Pasa antes por Datos y seguridad.**

| Camino | Android | iPhone | Avisos programados en el móvil | Coste |
|---|---|---|---|---|
| Web de hoy (sin instalar) | No hay: falta el archivo de instalación (manifest) y el service worker | No | No | — |
| Web instalable (PWA) con avisos web | Sí, en Chrome | Solo si se añade a la pantalla de inicio (iOS 16.4 o posterior) y se acepta desde ese icono | No | Gratis |
| TWA (la web dentro de un APK) | Sí, los mismos avisos web | No existe | No | 25 USD una vez (Google Play) |
| **Capacitor** (la web dentro de una app nativa) | Sí, nativos (FCM) | Sí, nativos (APNs) | **Sí** | 25 USD una vez (Play) + 99 USD al año (Apple, solo si hay iPhone) |

Si se quisiera algo antes de la app, la PWA con avisos web valdría para Juntos (los tipos 1 y 2), con la misma función del servidor. Pero en iPhone obliga a «Añadir a pantalla de inicio», y casi nadie lo hace sin ayuda. **Recomendación: no adelantarlo y hacerlo directamente con Capacitor.**

## 3. Lectura automática de gastos (4.2)

| Opción | Qué hace | Coste real | Lo que pide | iPhone | Veredicto |
|---|---|---|---|---|---|
| Conectar con el banco (GoCardless / Nordigen) | Trae los movimientos solo | Era gratis; **no acepta cuentas nuevas desde julio de 2025** | — | Sí | Descartado |
| Enable Banking | Igual, unos 2.700 bancos de 30 países | Gratis solo en «modo restringido»: cada persona registra su propia aplicación y solo ve sus cuentas, sin uso comercial. Para varios usuarios hay que pedir presupuesto | Contrato, o que cada usuario se dé de alta como técnico | Sí | Inviable para usuarios normales |
| Tink (Visa), Salt Edge | Igual | **No publican precio** («contacte con ventas») | Contrato; se usa su licencia, no hace falta pedirla al Banco de España | Sí | Solo si un día hay presupuesto |
| Leer las notificaciones del banco (Android) | La app ve «Pago de 12,50 € en Mercadona» y propone apuntarlo | Gratis | Permiso especial de «acceso a notificaciones», aviso claro antes de pedirlo y política de privacidad | **Imposible**: iPhone no deja leer los avisos de otras apps | Prueba opcional, más adelante |
| **Importar extracto o Excel** (ya existe) | Vista previa, sin duplicados, se puede deshacer | Gratis | Nada nuevo | Sí | **Mejorarlo primero** |
| Reenviar correos del banco | Leer los correos de cargo | Gratis o poco | Un buzón por usuario y leer correo con datos de pago | Sí | Descartado: delicado y frágil |

**Conectar con el banco, detalle.** Desde el 25/07/2023 la norma europea (PSD2) permite que el permiso dure 180 días en vez de 90. Aun así, cada 6 meses el usuario tiene que entrar en su banco y confirmar otra vez, y algunos proveedores siguen con 90 días. Si se usa la licencia del proveedor no hace falta ser una entidad autorizada, pero sí firmar un contrato de tratamiento de datos (RGPD) y explicar al usuario quién ve sus movimientos. Y choca con la decisión de no prometer «gratis» sin conocer los costes.

**Leer notificaciones, detalle.**
- Google Play deja usarlo, pero los datos financieros cuentan como «datos sensibles». La app tiene que explicarlo con un aviso claro antes de pedir el permiso, pedir el consentimiento, tener política de privacidad y permitir borrar la cuenta desde la app y desde la web.
- Si la app se instala **fuera de Google Play** (un APK pasado por WhatsApp), Android 13 y posteriores bloquean este permiso hasta que el usuario active a mano los «ajustes restringidos». Es un paso que asusta, porque es justo lo que piden las estafas.
- Desde Android 15 el sistema tapa los códigos de verificación (OTP) a estas apps. Para nosotros es bueno: nunca los queremos ver.
- Cada banco escribe sus avisos de una manera y la cambia cuando quiere, así que habrá que mantener una lista de formatos.
- **Privacidad:** leer y descartar en el propio móvil. A Supabase solo sube el gasto que el usuario confirma (importe, comercio y fecha), nunca el texto del aviso. Y solo se leen los avisos de las apps de banco que el usuario marque.

**Orden recomendado:**
1. **Importar desde el móvil en dos toques.** Con la app nativa, PalomApp aparece en «Compartir» y el extracto que descargas en la app del banco se manda directo a la vista previa. Las reglas de categorías ya existen. Es seguro, gratis y funciona en Android y iPhone.
2. **Lectura de notificaciones en Android**, opcional y apagada de serie, que propone y no apunta sola («¿Apuntar 12,50 € en Mercadona?»). Primero con 2 o 3 bancos del grupo.
3. **Conectar con el banco**, solo si hay usuarios que lo pidan y dinero para pagarlo.

## 4. Widgets (4.3)

| Cómo | Widgets | Qué hace falta |
|---|---|---|
| Web o PWA | **Ninguno.** Como mucho, atajos al mantener pulsado el icono (solo en Android) | El archivo de instalación (manifest) |
| TWA | Posibles en Android, pero en código nativo aparte y sin acceso a los datos de la web | Programar en Kotlin y que el widget lea de Supabase por su cuenta |
| **Capacitor** | Android (Kotlin) e iPhone (Swift, WidgetKit) | La app guarda un resumen pequeño en un espacio compartido con el widget (en iPhone, «App Groups») y lo actualiza cada vez que cambia algo |

| Widget | Tamaño | Qué enseña | Al tocar | Esfuerzo aprox. (Producto, no Desarrollo) |
|---|---|---|---|---|
| **Te queda este mes** | Pequeño | La cifra de «Tu mes» y una barra; lo previsto aparte y como previsión | Inicio | Bajo |
| **Apuntar gasto** | Pequeño | Botón «Gasto» y botón «Repetir» con el último habitual | Abre directo el teclado del importe | Bajo |
| **Próximos pagos** | Mediano | Los 3 fijos siguientes con fecha e importe | Inicio, con los fijos | Medio |
| Juntos | Pequeño | «Te deben 42 €» o «Debes 15 €» | Juntos | Medio (más adelante) |
| Hoy en la Agenda | Mediano | Las tareas de hoy | Agenda | Medio (más adelante) |

En los widgets debe haber una opción para tapar las cifras («•••»), porque están a la vista en la pantalla de inicio. Siguen el aspecto «Nuevo»: fondo de la paleta, cifra grande y acento vivo, y en oscuro si el móvil está en oscuro. Esfuerzo orientativo: Desarrollo deberá estimarlo. Los dos primeros en Android parecen tareas de días, no de semanas. iPhone cuesta más: necesita un Mac (o compilar en la nube) y la cuenta de Apple.

## 5. Cómo encaja con el paso a app y orden

| Paso | Qué | Por qué en este orden | ¿Supabase? |
|---|---|---|---|
| 1 | Punto 5 de la hoja de ruta: historial del grupo | Es la base de los avisos de Juntos (quién añadió, cambió o borró) | Sí |
| 2 | Punto 6: viajes con otra moneda | Ya decidido; no depende de esto | Sí |
| 3 | App de Android con Capacitor: avisos programados en el móvil (fijos, agenda, fin de mes), «Compartir con PalomApp» para importar y el widget «Te queda este mes» | Todo funciona sin servidor nuevo | No |
| 4 | Avisos de Juntos desde el servidor y la pantalla «Avisos» en Tú | Necesita la tabla de avisos | **Sí**: Datos y seguridad antes |
| 5 | Widgets «Apuntar gasto» y «Próximos pagos» | Ya con la app usada unas semanas | No |
| 6 | Prueba de lectura de notificaciones (Android) | Solo si el dueño la quiere | No en principio; Datos y seguridad revisa |
| 7 | iPhone | Si alguien del grupo lo necesita | No |
| 8 | Conectar con el banco | Solo con demanda y presupuesto | Sí |

## 6. Recomendaciones

- **Avisar de lo que no ves.** Si notificas lo que el usuario acaba de hacer, la app se vuelve pesada y la gente apaga todos los avisos.
- **Programar en el móvil todo lo que se pueda.** Es más privado, más barato y funciona sin conexión.
- **Capacitor desde el principio**, aunque al empezar solo sea Android: no hay que rehacer nada para avisos, widgets ni iPhone.
- **Mejorar la importación antes que conectar con el banco.** Ya funciona, es gratis y vale para todos.
- **Proponer, nunca apuntar solo,** en la lectura de notificaciones. Un gasto apuntado mal sin querer resta más confianza de la que aporta la comodidad.

## 7. Riesgos

- **Google Play pide 12 probadores durante 14 días** a las cuentas personales nuevas (las creadas después del 13/11/2023) antes de publicar. Con pocos usuarios puede costar llegar a 12.
- **El APK pasado a mano se complica:** Google exige identificarse como desarrollador desde el 30/09/2026 en algunos países, y en todo el mundo durante 2027. Además bloquea la lectura de notificaciones con los «ajustes restringidos».
- **Avisos de más.** Si no se respetan el límite diario y el silencio, la gente los apaga todos, también los útiles.
- **Datos financieros.** Leer notificaciones o conectar con el banco obliga a una política de privacidad seria y a permitir borrar la cuenta desde la app y desde la web. El repositorio es público: nada de claves en el código de la app.
- **Avisos programados que se quedan viejos** si cambias un fijo desde otro dispositivo y no abres la app en el móvil.

## 8. Preguntas para el dueño

1. **¿Solo Android o también iPhone? ¿Quién del grupo usa iPhone?** *Bloquea el paso a app:* confirma Capacitor y si hace falta la cuenta de Apple (99 USD al año) y un Mac.
2. **¿Google Play (25 USD y 12 probadores durante 14 días) o APK pasado a mano?** *Bloquea el paso a app.* Recomendamos Google Play, sobre todo si se quiere leer notificaciones.
3. ¿Se ven los importes en la pantalla de bloqueo y en los widgets, o tapados de serie? No bloquea. Proponemos tapados en la pantalla de bloqueo y visibles en los widgets, con la opción de taparlos.
4. ¿Te parecen bien los 5 avisos encendidos de serie y el máximo de 2 al día? No bloquea.
5. ¿Quieres probar la lectura de notificaciones del banco en Android, opcional y propuesta a propósito (sin apuntar sola)? No bloquea: va en el paso 6.

## 9. Lo que no hemos podido averiguar o confirmar

- **Precios de Tink, Salt Edge y Enable Banking** para varios usuarios: no son públicos, hay que pedir presupuesto.
- **Qué bancos españoles cubre cada proveedor exactamente** y si renuevan el permiso cada 90 o cada 180 días: depende del banco. No hemos revisado Plaid ni Belvo en Europa (Belvo es sobre todo de Latinoamérica).
- Si Google Play tiene alguna regla extra solo para el permiso de leer notificaciones en apps de finanzas, aparte de la norma general de datos sensibles. No la hemos encontrado, pero no lo descartamos.
- En qué región guarda los datos el proyecto de Supabase (importa para el RGPD). Lo puede mirar Datos y seguridad.
- La automatización «Transacción» de Atajos en iPhone (con tarjetas de Apple Pay) podría ser una alternativa en iPhone. Lo decimos de memoria y no lo hemos comprobado.
- No hemos probado nada en un móvil real. El esfuerzo es una estimación de Producto, no de Desarrollo.

## 10. Fuentes (consultadas el 29/10/2026)

- Actual Budget, guía de GoCardless: «From July 2025 onwards, GoCardless has stopped accepting new Bank Account Data accounts». https://actualbudget.org/docs/advanced/bank-sync/gocardless/ (de una app que lo usaba).
- GoCardless, documentación de Bank Account Data (hasta 24 meses de historial y 90 días de acceso). https://developer.gocardless.com/bank-account-data/overview
- Enable Banking, modo restringido con cuentas propias. https://enablebanking.com/docs/api/linked-accounts/ y portada https://enablebanking.com/ (interés propio: es el proveedor).
- Tink, página de precios («contact sales», licencia de Tink o propia). https://tink.com/pricing (interés propio).
- Salt Edge, sin página de precios pública. https://www.saltedge.com/
- Finreg360, la nueva norma sobre autenticación reforzada (PSD2, 180 días) se aplica desde el 25/07/2023. https://finreg360.com/alerta/las-nuevas-normas-tecnicas-de-regulacion-sobre-la-autenticacion-reforzada-de-clientes-en-psd-2-seran-exigibles-desde-el-25-7-2023/
- WebKit, avisos web en iPhone para apps de la pantalla de inicio (iOS 16.4). https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- OneSignal, requisitos de los avisos web en iOS (solo desde el icono, no desde una pestaña). https://documentation.onesignal.com/docs/web-push-for-ios (interés propio: vende avisos).
- Capacitor, Push Notifications (FCM en Android, APNs en iOS). https://capacitorjs.com/docs/apis/push-notifications
- Android 15, cambios de comportamiento (oculta los OTP a las apps que leen notificaciones). https://developer.android.com/about/versions/15/behavior-changes-all
- Google Play, política de datos de usuario (datos financieros sensibles, aviso destacado, borrar la cuenta). https://support.google.com/googleplay/android-developer/answer/10144311
- Android, ajustes restringidos. https://support.google.com/android/answer/12623953
- Google Play, 12 probadores durante 14 días. https://support.google.com/googleplay/android-developer/answer/14151465 ; cuota de 25 USD: https://support.google.com/googleplay/android-developer/answer/6112435
- Verificación de desarrolladores de Android (desde el 30/09/2026). https://developer.android.com/developer-verification
- Apple Developer Program, 99 USD al año. https://developer.apple.com/programs/enroll/
- Código de la app: `avisosRecurrentes`, `avisosInicioFilas`, `AVISOS_PLAN` e importación en `app.js`. `index.html` no tiene manifest ni service worker.

Para el PDF: la escalera del apartado 5 como línea de tiempo (pasos 1, 2 y 4 con un candado de «Datos y seguridad»; 7 y 8 en gris), y un boceto de móvil bloqueado con dos avisos de ejemplo: «3 novedades en Juntos» y «Mañana: Alquiler 750,00 €».

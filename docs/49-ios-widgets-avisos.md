# 49 · iPhone: widgets y avisos del sistema (propuesta)

Producto y diseño · 25/11/2026 · Solo propuesta, no se ha programado nada. Rama de trabajo: `fase20/ios-comprobar`.
Se apoya en `docs/25` (estudio de avisos y widgets), `docs/47` (guía «Que se apunten solos») y `docs/48` (App Store).

## 1. Conclusión

1. **Hacer primero los widgets de la pantalla de inicio**, empezando por «Te queda este mes» y «Apuntar gasto». Son lo más visible para quien revisa la app, funcionan sin conexión y reutilizan casi todo lo que ya hicimos para Android (la web ya prepara el resumen).
2. **Antes de nada, comprobar los avisos del propio móvil** (cobros fijos, Agenda). El código ya existe y en iPhone no necesita servidor: solo falta confirmar que el permiso se pide «en su momento» y que se ve en TestFlight. Es casi gratis y suma otra función nativa.
3. **Los avisos de Juntos con la app cerrada, los últimos.** Son los más útiles para quien usa Juntos, pero los más caros (clave de Apple, servidor, tabla) y el revisor de Apple casi no puede verlos.
4. **Qué ayuda a la revisión (guía 4.2, que pide que la app sea más que una web metida en una app):** ya tenemos Face ID, Atajos y cámara para tickets. Con widgets y avisos locales, la lista de funciones propias de iPhone es clara. Además hay que explicarlas en las «notas para el revisor» de App Store Connect, con una cuenta de prueba. No podemos garantizar el resultado: es decisión de Apple.
5. **Lo que necesita el dueño:** el Apple Developer Program (ya es el paso 1 de `docs/48`), dos cosas nuevas en el portal de Apple (un App Group y, para Juntos, una clave de avisos) y guardar la clave de avisos solo en secretos, nunca en el repositorio.

## 2. Resumen de las tres piezas

| Pieza | Qué ve el usuario | Esfuerzo | Lo nuevo que pide el dueño | Probable en CI/simulador |
|---|---|---|---|---|
| A. Avisos del propio móvil | Recordatorios de fijos, Agenda, resumen | 1 tanda corta (comprobar) | Nada | Parte: sí. Ver que llega y suena: iPhone real |
| B. Widgets | «Te queda», «Apuntar gasto», tareas de hoy | 3 tandas | App Group + identificador del widget | Compilar y probar la lógica: sí. Verlo en pantalla: simulador a mano |
| C. Avisos de Juntos (push) | «Ana añadió un gasto» con la app cerrada | 3 tandas | Capacidad Push + clave de avisos | Solo el servidor y el aviso simulado. Llegada real: iPhone real |

## 3. Widgets (B)

### 3.1 Qué se muestra

| Widget | Tamaño | Qué enseña | Al tocar | Fase |
|---|---|---|---|---|
| Te queda este mes | Pequeño | Cifra grande de «Tu mes», nombre del mes y una barra de cuánto del mes ha pasado | Abre Inicio | 1 |
| Te queda este mes | Mediano | Lo mismo + «Gastado» e «Ingresado» en dos líneas | Abre Inicio | 2 |
| Apuntar gasto | Pequeño | Un botón grande con el icono de gasto y la palabra «Gasto» | Abre el teclado del importe | 1 |
| Hoy en la Agenda | Mediano | Hasta 3 tareas de hoy y cuántas quedan | Abre la Agenda | 3 |
| Próximos pagos | Mediano | Los 3 fijos siguientes con fecha e importe | Abre los fijos | 3 (opcional) |

- Mismo texto que en Android: «Te queda este mes», «En tu banco hoy» o «Gastos de este mes» según lo que la app ya decide (`widgetResumen` en `app.js`). Lo previsto no se mezcla con lo real.
- Aspecto «Nuevo»: fondo de la paleta, cifra grande, un solo acento vivo. Sin naranja terracota. Se ve bien en claro y en oscuro. Los iconos son los de la app (no emojis).
- Un widget nunca debe parecer roto: sin sesión dice «Abre PalomApp»; si el mes guardado ya terminó, dice «Empieza un mes nuevo» (igual que Android, que ya lo hace así y tiene pruebas).

### 3.2 Cómo se actualizan (sin tecnicismos)

La app y el widget son dos programas distintos. Para hablar entre ellos, Apple da una «cajita compartida» (App Group). La app deja ahí un resumen pequeño y avisa a iOS de que repinte el widget. Esto ya es exactamente lo que hace Android.

- La web ya llama a `__nativo.widgets.guardar(...)` tras cada cambio. En iPhone hay que dar a esa llamada un destino en Swift (mismo nombre que en Android, así la web casi no cambia).
- iOS limita cuántas veces repinta un widget por su cuenta. Por eso la app lo avisa cada vez que algo cambia, y el widget además se prepara una entrada a medianoche para el cambio de día.
- Los campos nuevos (tareas de hoy, próximos fijos) se añaden al resumen. El widget de Android los ignora, así que no se rompe nada.

### 3.3 Privacidad

- **Ocultar cifras:** si el usuario tiene «Ocultar cifras» activado, el widget enseña «•••» (es la regla de Android y ya está en el resumen).
- **Móvil bloqueado:** iOS permite marcar un texto como «sensible», y el sistema lo tapa solo con el móvil bloqueado. Lo proponemos para todas las cifras. Hay que **confirmarlo en un iPhone real**: es comportamiento del sistema y no podemos verlo en CI.
- Solo se guarda en la cajita lo que se ve en el widget (cifra, mes, nombres de tareas). Nunca claves, correo ni sesión. Al cerrar sesión se borra y el widget vuelve a «Abre PalomApp».

### 3.4 Lo que cuesta y lo que necesita el dueño

| Tanda | Qué | Notas |
|---|---|---|
| B1 | Preparar el terreno: extensión de widget en el proyecto, App Group, puente Swift, compilar en CI | La parte delicada: firmar **dos** cosas (la app y el widget). Hoy la firma de `fastlane` solo conoce la app |
| B2 | «Te queda» pequeño y mediano, ocultar cifras, «Apuntar gasto» | Reutiliza las reglas de `WidgetDatos` de Android, pasadas a Swift |
| B3 | «Hoy en la Agenda» y, si se quiere, «Próximos pagos» | Añade campos al resumen y pruebas en la web |

El dueño tiene que hacer en el portal de Apple (developer.apple.com → Certificates, Identifiers & Profiles): crear el **App Group** (`group.es.palomapp.finanzas`) y el identificador del widget (`es.palomapp.finanzas.widget` (sin «s»: es el que usa el proyecto)). Si la clave de la API de `docs/48` no deja crearlos solos, se hace a mano en 5 minutos con una guía mía. **No lo hemos podido confirmar** sin la cuenta.

### 3.5 Riesgos

- **Firma con dos paquetes:** el flujo actual crea un certificado de usar y tirar y un perfil para la app. Hay que ampliarlo a dos perfiles. Es lo más probable que falle la primera vez.
- **Editar el proyecto de Xcode sin Mac** es frágil. Opciones: generarlo con una herramienta (XcodeGen) en CI, o con un guion Ruby. Lo decide Desarrollo.
- **Datos viejos en pantalla:** un widget que enseña la cifra de ayer genera desconfianza. Por eso la regla del «mes terminado».
- Una cifra visible en la pantalla de inicio puede verla quien mire por encima: de ahí «Ocultar» y que proponemos preguntarlo (pregunta 3).

## 4. Avisos del sistema (A y C)

### 4.1 A. Avisos del propio móvil (recordatorios)

- **Qué ve el usuario:** los mismos avisos que en Android: «Mañana: Alquiler 750,00 €», tareas con aviso, resumen de semana y de mes. Nada que salga de un servidor.
- **Estado:** `N.notif` ya usa el plugin de avisos locales y los canales de Android se saltan en iPhone. iOS no tiene «canales», así que el usuario solo tendrá el interruptor general del sistema y los de Tú → Avisos.
- **Pendiente de revisar:** iOS guarda como mucho 64 avisos programados; el código programa 60, está justo. Y que el permiso se pida **en contexto** (al crear el primer fijo o la primera tarea con aviso, nunca al abrir por primera vez), con el texto de nuestra pantalla antes del cuadro de Apple.
- **Esfuerzo:** 1 tanda corta: repasar el momento de pedir permiso, probar en TestFlight, ajustar textos. **Dueño:** nada.
- **Prueba:** la lógica de qué avisar ya tiene pruebas en la web. Que el aviso llegue y se toque lo lleva a la pantalla correcta: solo iPhone real.

### 4.2 C. Avisos de Juntos con la app cerrada (push)

- **Qué ve el usuario:** igual que en Android: «Ana añadió 3 gastos en Viaje a Lisboa · te tocan 42,30 €», agrupados, con silencio nocturno y un interruptor por tipo. Al tocar abre el grupo o la persona. Con el móvil bloqueado, versión corta sin cifras si el dueño lo decide.
- **Cómo:** el servidor ya existe (función `avisar`, que manda por Firebase a Android). En iPhone hay dos caminos:

| Camino | Qué es | Pros | Contras |
|---|---|---|---|
| 1. Directo a Apple (APNs) | La misma función manda también a Apple con la clave de Apple | Una sola clave nueva, sin añadir Firebase a la app | Hay que guardar de qué tipo es cada móvil (Android o iPhone) |
| 2. Seguir con Firebase | Firebase reparte a Android y iPhone | Un solo envío | Hay que meter Firebase en la app de iPhone y subir la clave de Apple a Firebase |

  **Recomendación provisional: camino 1.** Lo debe confirmar Desarrollo, y **Datos y seguridad** antes de tocar la tabla de móviles (probablemente una columna nueva opcional).
- **Esfuerzo:** C1 permiso en contexto + token del móvil + guardar tipo de móvil. C2 servidor hacia Apple (agrupar, silencio, limpiar móviles que ya no existen). C3 abrir al tocar y pantalla «Comprobar» para iPhone.
- **Lo que necesita el dueño:**
  - Activar «Notificaciones push» en el identificador de la app (portal de Apple).
  - Crear una **clave de avisos de Apple** (archivo `.p8`, solo se descarga una vez) y apuntar su «Key ID».
  - Guardarlos **solo en los secretos de Supabase** (no en GitHub, no en el repositorio, no en el chat). Datos y seguridad define los nombres.
- **Riesgos:** el modo de pruebas y el de producción de Apple son distintos y es típico que el aviso «no llegue» por eso. Los avisos de TestFlight usan producción. Y si el dueño no activa la capacidad antes, la app firmada falla al subir.

## 5. Qué se puede probar sin iPhone y qué no

| Qué | CI (Mac de GitHub) / simulador | Hace falta iPhone real |
|---|---|---|
| Que todo compila (app + widget) | Sí, ya hay flujo `ios.yml` | — |
| Reglas del widget (cifra, mes terminado, ocultar) | Sí: pruebas de Swift en CI | — |
| Que el widget se ve bien en 2 tamaños, claro/oscuro | Parcial: captura en simulador, quizá a mano | Sí, para fiarnos |
| Cifra tapada con el móvil bloqueado | No | Sí |
| Aviso programado en el móvil | Parcial en simulador | Sí (sonido, bloqueo) |
| Servidor de push: el mensaje sale bien formado | Sí, pruebas del servidor | — |
| Que llega un push real y al tocarlo abre el grupo | No (el simulador no recibe avisos reales de Apple; solo avisos simulados con un archivo) | Sí, con TestFlight |
| Firma con widget y push | Solo se ve al subir a TestFlight | — |

Nada de esto se ha probado todavía. Seguimos sin ningún iPhone real (`docs/48` §3).

## 6. Orden recomendado

1. **Esta semana, sin dueño:** A (revisar avisos del móvil) y B1 (terreno del widget, compila en CI).
2. **Con la cuenta de Apple ya abierta:** B2 → primera versión en TestFlight con «Te queda» y «Apuntar gasto». Es lo que ayuda más a la revisión.
3. **Después:** B3 y, si Juntos pesa en iPhone, C1-C3.
4. **Envío a revisión:** con widgets, avisos locales, Face ID y Atajos, más notas para el revisor que enumeren esas funciones y una cuenta de prueba.

**Qué hacer primero para ayudar a la revisión de Apple:** el widget «Te queda este mes» + «Apuntar gasto» (B1 y B2), con A comprobado. El push (C) no ayuda a pasar la revisión y puede esperar.

## 7. Decisiones que necesita el dueño

1. ¿Empezamos por widgets (B) y avisos locales (A), dejando Juntos con push para después? **Bloquea el siguiente paso.**
2. ¿Te ocupas tú de crear en el portal de Apple el App Group y el identificador del widget? (Te lo dejo paso a paso.) **Bloquea B1 en TestFlight.**
3. ¿Cifras visibles de serie en el widget, o tapadas («•••») hasta que el usuario las active? Propuesta: visibles, con «Ocultar cifras» y tapadas en pantalla bloqueada. No bloquea.
4. ¿Qué widgets de la fase 3: «Hoy en la Agenda», «Próximos pagos» o los dos? No bloquea.
5. Push de Juntos: ¿lo quieres en iPhone antes de enviar a revisión, o después de la primera versión? Recomendado: después. No bloquea.

## 8. Lo que no hemos podido confirmar

- Si la clave de la API de App Store Connect (rol «App Manager») basta para crear el App Group, el identificador del widget y activar Push, o si hay que hacerlo a mano.
- Que el flujo de firma con certificado de usar y tirar admite dos perfiles sin cambios mayores.
- Cuánta cabida deja Apple al widget para repintarse (varía según el uso del móvil) y cómo se ve la cifra «sensible» con el móvil bloqueado.
- Si la guía 4.2 se aplicará a PalomApp: depende del revisor. La frase de que la app «debe ir más allá de una web empaquetada» es de las normas de Apple (no consultadas hoy en línea; citadas de memoria).
- Los nombres exactos de los pasos de Apple en español (portal y App Store Connect), por no tener la cuenta.

## 9. Fuentes

- Código y documentos de este repositorio (consultados el 25/11/2026): `movil/nativo-src.js`, `movil/ios/App/App/AppDelegate.swift`, `movil/android/.../WidgetDatos.java`, `supabase/functions/avisar/index.ts`, `.github/workflows/ios.yml`, `movil/ios/App/fastlane/Fastfile`, `docs/25`, `docs/47`, `docs/48`.
- Apple (WidgetKit, App Groups, APNs, guía de revisión 4.2): citado de memoria, **sin consultar hoy**.

Para el PDF: un móvil con la pantalla de inicio y dos widgets dibujados (pequeño «Te queda este mes» y botón «Gasto»), y la escalera A → B1 → B2 → B3 → C con el paso B2 marcado como «lo que ayuda a la revisión».

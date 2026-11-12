# PalomApp 1.1.0 · lista de cambios (12/11/2026)

Rama `fase13/integracion` (sin publicar). Cada punto lleva cómo se ha probado:
- **[auto]**: probado en las pruebas automáticas.
- **[sin móvil]**: sin probar en un móvil real.
- **[Android-auto]**: probado con las pruebas del lector de avisos (JUnit).

## Nuevo
- **Avisos de PalomApp por niveles.** Tú → Avisos los separa así:
  - «Importantes» (suenan): por ejemplo, un pago fijo de mañana sin saldo en esa cuenta.
  - «Para estar al día» (sin sonido): pagos y cobros de mañana en un solo aviso, tareas de hoy, presupuesto al 80 % y al 100 %, meta conseguida.
  - «Resumen» (opcional): el domingo a las 19:00 y el cierre del mes.
  - Como mucho 3 avisos normales al día. Entre las 22:00 y las 9:00 no suena nada.
  - La primera vez no llega una avalancha de avisos.
  - [auto] [sin móvil]
- **Widgets de Android.**
  - «Te queda este mes» (2×1): la misma cifra que Inicio, con la barra del mes; respeta ocultar cifras; sin sesión pone «Abre PalomApp».
  - «Apuntar gasto» (1×1): abre el gasto nuevo con el teclado de la app.
  - [auto] [Android-auto] [sin móvil]
- **Avisos del banco, fase 2.**
  - Lo que leen tus avisos del banco se guarda en tu cuenta aunque PalomApp esté cerrada.
  - El aviso «Apuntado» trae «Deshacer».
  - Para ello el móvil tiene una clave propia: al servidor solo va su huella.
  - Se retira al apagar los avisos, al cerrar sesión o al borrar la cuenta.
  - [auto] [Android-auto] [sin móvil]
- **Importar extractos.**
  - Norma 43 (.n43, .aeb, .txt): comprueba que el saldo cuadra.
  - Sabadell (.xls que en realidad es una página web), CaixaBank (columnas de ingreso y gasto), BBVA («Disponible»), Revolut (sin los pagos anulados) y Trade Republic (meses en letra).
  - La segunda vez, un solo toque si el formato y la cuenta ya se conocen.
  - Lo que ya llegó por un aviso del banco sale como «ya lo tenías».
  - [auto, con 12 extractos inventados] [sin extractos reales]
- **«Compartir con PalomApp» en Android.** Desde la app del banco o desde Archivos, el extracto se abre directamente en Importar. [auto, con el puente simulado] [sin móvil]
- **Idioma inglés.**
  - Tú → La app → «Idioma / Language». La primera vez se usa el idioma del móvil; las cuentas que ya existían siguen en español.
  - En inglés el dinero sale «€1,234.56». También van en inglés los avisos del móvil, los mensajes de WhatsApp, la pantalla de entrada, privacidad y borrar cuenta.
  - Lo que escribe el usuario no se traduce.
  - Calculo un 95 % traducido. Queda en español: frases raras del importador, algunos textos de inversiones, el Excel descargado y las invitaciones de WhatsApp con nombre de grupo.
  - [auto, test165 + capturas en inglés] [sin móvil]

## Mejorado
- **Mucho más rápida con muchos movimientos.** Con 10.000 movimientos:
  - Dinero pasa de 375 a ~70 ms e Inicio de 285 a ~95 ms.
  - La Lista pasa de 510 a ~40 ms: enseña 40 filas y trae más sola al bajar.
  - Cambiar de pestaña, en el peor caso, de 414 a 157 ms.
  - Las cifras no cambian ni un céntimo.
  - [auto, test163 + medidor]
- **Interfaz en el móvil.**
  - El teclado ya no tapa el campo que escribes en las hojas.
  - El botón atrás de Android vuelve un paso en las subpantallas (grupo, persona, importar, cobro fijo, cuentas…). Ya no cierra la app con «Así vas» abierto, y en Importar pregunta antes de perder lo preparado.
  - A 320 px y con letra al 130 % ya no se cortan «Borrar mi cuenta», «Cerrar sesión», «Movimientos», la barra de abajo ni la tarjeta de Inicio. El «€» no se separa de la cifra.
  - Los interruptores de Avisos tienen nombre para lectores de pantalla, y «Pedir por WhatsApp» se lee bien (contraste 7,5).
  - [auto, test164 + capturas] [sin móvil]
- **Privacidad.** La web de privacidad explica el guardado con la app cerrada y el identificador del móvil.

## Arreglado
- **Importe escrito a mano:**
  - «12,345» ya no se guarda con 3 decimales (se redondea a 12,35);
  - «1,2,3» pide un importe válido;
  - «0.500» es 0,50 € y no 500 €;
  - «−3» (el menos que pinta la app) vale como devolución;
  - al editar sin tocar el importe, se queda como estaba.
  - [auto, test160]
- **Al cerrar sesión o borrar la cuenta**, los avisos del banco se apagan y se borra lo pendiente en el móvil. Antes, la siguiente cuenta que entraba en el mismo móvil los heredaba encendidos. [auto, test149] [sin móvil]
- **El aviso de «mañana se paga…»** ya no se pierde si abres la app después de las 9:00 del día antes: sale enseguida, una sola vez. [auto, test152]
- **Las pruebas no fallan pasada la medianoche** (iban con la hora de España). [auto]

## Pendiente
- **Permiso del dueño para volver a publicar la función `borrar-cuenta`**, que ya borra también los móviles de avisos. Mientras tanto la web los quita antes de borrar la cuenta.
- **Avisos de Juntos** («te han pedido dinero», «te han saldado»): necesitan Firebase, que no está configurado.
- **Decisiones del dueño (Datos y Seguridad):**
  - borrar las tablas `backup_*` de octubre;
  - mejorar la copia semanal;
  - CAPTCHA en las altas y tope de la IA de tickets;
  - protección de contraseñas filtradas.
- **Google Play, «Seguridad de los datos»:** marcar «ID de dispositivo u otros» (recogido, no compartido, para funciones de la app, solo si se activan los avisos del banco).
- **Pendiente de probar:**
  - Revolut con comisiones (columna Fee);
  - el widget opcional «Hoy» (2×2), que no está hecho;
  - todo lo de Android en un móvil real.

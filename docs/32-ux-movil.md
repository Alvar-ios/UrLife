# 32 · PalomApp en el móvil: qué pulir antes de la Play Store

*Producto y Diseño · 08/11/2026 · Recorrido de toda la app como persona nueva y como usuaria diaria. Capturas con `tests/capturas/revisar.js` (390 y 375 px, claro y oscuro) y una tanda aparte de prueba: móvil bajo de 375 × 667, usuario sin datos, formularios, entrar y bienvenida. Datos inventados. No se ha tocado el código de la app. Complementa `docs/33` (lo técnico y legal de Google Play), sin repetirlo.*

## 1. Conclusión

1. **La base es buena:** apuntar un gasto (teclado propio, categorías con icono, «Guardar» al alcance del pulgar), Juntos y la bienvenida ya están a nivel de tienda. Cambiar de pantalla tarda menos de 0,15 s incluso con un procesador 4 veces más lento.
2. **Lo más grave es Android y no se ve en las capturas:** la app no sabe ir «atrás». Dentro de Capacitor, lo más probable es que el botón o el gesto de atrás **cierre la app entera aunque haya una hoja abierta**. Es lo primero que notará cualquier usuario de Android.
3. **Inicio ya no cabe en una pantalla:** el aviso del informe (3 líneas) deja «Estos días» por debajo de la barra, incluso a 844 px de alto. En un móvil de 667 px no se ve nada de «Estos días».
4. **Muchos detalles pequeños restan confianza:** cifras cortadas por la mitad («a tu saldo −2.…»), la misma cifra con y sin céntimos, nombres de grupo en 4 líneas, desplegables con aspecto de navegador, enlaces de 24 px de alto y dos nombres de app («Mis Finanzas y Tareas» y «PalomApp»).
5. **A quien venga de otras apps de finanzas le faltará:** bloqueo con huella, ocultar las cifras, exportar a Excel, avisos y un widget. Los dos primeros son baratos en la app nativa y recomendamos tenerlos en la primera versión de la tienda.

## 2. Cambios propuestos

Esfuerzo: **pequeño** = menos de 2 horas · **medio** = de medio día a 2 días · **grande** = más de 2 días. Capturas en `docs/img/32/`.

### A · Rápidos y de mucho efecto (por orden)

| # | Pantalla | Problema | Propuesta (textos exactos) | Esfuerzo |
|---|---|---|---|---|
| A1 | Toda la app (Android) | La app no guarda «dónde estás». En Capacitor, si la web no tiene historial, atrás suele **cerrar la app**, también con una hoja abierta o a medio apuntar un gasto | Escuchar el botón atrás (`backButton`) y seguir este orden: 1) paso interior de una hoja (tema → grupo, historial → grupo, «Más detalles») → paso anterior; 2) hoja abierta → se cierra como con la X; si hay algo escrito (importe distinto de 0 o texto), hoja pequeña **«¿Descartar este gasto?»** · «Lo que has escrito no se guardará.» · «Seguir editando» / «Descartar» (rojo); 3) Agenda, Tú o «Ver todo» → pantalla de antes; 4) Movimientos, Juntos o Dinero → Inicio; 5) Inicio → sale de la app, sin «pulsa otra vez» | Medio (1 día) |
| A2 | Inicio (`01`, `02`) | El aviso «Tu informe de octubre» ocupa 3 líneas (unos 110 px) y empuja «Estos días» fuera de la pantalla | Una sola fila de 56 px: `sparkle` + **«Tu informe de octubre está listo»** + `chevR`. La frase «Octubre cerró con +604 €…» pasa a la primera línea del informe. La X se queda | Pequeño |
| A3 | Inicio · Estos días (`01`) | La cifra se corta: «Y 1 cambio … tu saldo −2.…». El importe va al final y es lo que se pierde | Cifra delante: **«−2,00 € a tu saldo · y 1 cambio más»** (y el grupo, solo si cabe). Regla general: en una línea que se puede cortar, el importe nunca va al final | Pequeño |
| A4 | Toda la app | Enlaces de 24-25 px de alto: «‹ Inicio», «Ocultar», «Apuntar uno nuevo igual», «Compartir un gasto con Ana», «Buscarlo». Chips y selectores de 32-36 px (Android pide 48) | La misma zona invisible que ya llevan `check-btn` e `icon-btn` (`::after` con `inset: -10px`) para todos los enlaces de texto y chips. No cambia el dibujo | Pequeño |
| A5 | Hoja del grupo (`04`) | Un nombre largo ocupa 4 líneas y unos 230 px; «Planes NUEVO» parte la pestaña en dos líneas; el «+» de los temas sale cortado en el borde | Título en 2 líneas como máximo, 22 px, con «…». Las etiquetas NUEVO dentro de un selector, como punto de 8 px (igual que en las pestañas de abajo). La fila de temas con 20 px de margen al final | Pequeño |
| A6 | Agenda (`03`) | «Compartir mi agenda NUEVO» ocupa cada día la mejor fila (encima de la casilla rápida). La barra de abajo marca «Inicio» estando en la Agenda. En Tú, «Compartir mi agenda» está dentro de «Tu dinero» | Sacar la fila de la Agenda cuando ya la has compartido o tras 3 visitas; si no, al final de la lista como enlace: **«Compartir mi agenda ›»**. En la Agenda, ninguna pestaña de abajo marcada (solo el icono del calendario, como ya pasa). En Tú, nuevo grupo **«Con otras personas»**: Grupos y personas · Compartir mi agenda | Pequeño |
| A7 | Agenda | Se vuelve con un enlace «‹ Inicio»; en Tú, con una flecha redonda junto al título | Igual que en Tú: `chevL` de 44 px a la izquierda del título «Agenda». Quitar «‹ Inicio» (con A1, atrás hace lo mismo) | Pequeño |
| A8 | Barra de arriba (todas) | «8 de noviembre de 2026» bajo el título en todas las pantallas: una línea fija que no aporta | Solo en Inicio y corta: **«domingo, 8 nov»**. En el resto, nada. Se ganan unos 18 px en cada pantalla | Pequeño |
| A9 | Inicio y Movimientos | La misma cifra sale «−284,75 €» en Inicio y «−285 €» en Movimientos → Te queda (ya en `docs/11` A10, sigue igual) | Céntimos pequeños también en las 4 tarjetas de Movimientos, como en la tarjeta de Inicio | Pequeño |
| A10 | Movimientos sin datos (`07`) | Quien empieza ve cuatro «0,00 €» en verde, rojo y violeta y una tarjeta blanca vacía de unos 400 px | Estado vacío: `list` en círculo de acento, **«Aquí verás en qué se va tu dinero»**, «Apunta tu primer gasto o trae el extracto de tu banco.», botones **«Apuntar un gasto»** e **«Importar extracto»**. Sin las 4 tarjetas hasta el primer movimiento | Pequeño |
| A11 | + → Pago fijo (`06`) | Hoja de 1.420 px. Dice «Escribe cuánto ha sido» y «¿Pagaste en otra moneda?». Vuelve a preguntar «Tipo» (5 botones) y «Del día a día \| Pago fijo», aunque ya elegiste Pago fijo | Si vienes del +: tipo ya puesto, «Tipo» y el selector plegados en un enlace **«Cambiar tipo»**. Debajo de la cifra: **«¿Cuánto es cada vez?»**. Sin «¿Pagaste en otra moneda?» en pagos fijos | Pequeño |
| A12 | Otra moneda, Compartir, Trayecto (`05`) | Desplegables con el aspecto del navegador: esquinas rectas y borde negro en claro | Un estilo común para `select`: radio de 14 px, borde `--line`, fondo de campo y flecha `chevD`, en claro y oscuro | Pequeño |
| A13 | Inicio · Así vas (`01`) | «Restaura…» cortado (era «Presupue…» en `docs/11`) | Nombre en 2 líneas como máximo, sin «…», a 12,5 px cuando la pantalla mide 375 px o menos | Pequeño |
| A14 | Historial del grupo | Dos filas de filtros que empiezan igual: «Todos» (personas) y «Todo» (tipo) | Segunda fila sin «Todo»: «Cambios» y «Borrados» se encienden y apagan; si no hay ninguno encendido, se ve todo | Pequeño |

### B · Medianos

| # | Pantalla | Problema | Propuesta (textos exactos) | Esfuerzo |
|---|---|---|---|---|
| B1 | Primera vez | La Agenda y Tú no están abajo: solo se llega por el calendario y la cara de arriba. Deslizar un movimiento para duplicarlo o borrarlo no se descubre | Tres pistas, cada una una sola vez y con «Entendido»: en el calendario **«Tu agenda y tus tareas están aquí»**; en la cara **«Tus ajustes, cuentas y categorías»**; en el primer movimiento **«Desliza a la izquierda para duplicar o borrar»** | Medio |
| B2 | Inicio, Dinero, Juntos | No se pueden tapar las cifras (en el metro, enseñando el móvil) | Botón con un icono nuevo `ojo` en la tarjeta de Inicio y en «Lo que tienes»: **«Ocultar cifras»** / **«Mostrar cifras»**. Las cifras pasan a «•••». Se guarda en el móvil. También en Tú → La app | Medio |
| B3 | Al abrir (solo app) | Una app de finanzas sin bloqueo propio | Tú → Tu cuenta: **«Pedir huella al abrir»** (interruptor, `candado`). Al volver a la app tras 5 minutos: **«Desbloquea PalomApp»** con la huella o el PIN del móvil | Medio |
| B4 | + → Gasto en móviles bajos | A 667 px, la fila «Hoy · Cuenta · Más detalles» queda debajo del teclado de la app: no se ve que se puede cambiar la fecha | Esa fila justo debajo de la cifra, encima de las categorías | Pequeño-medio |
| B5 | Botón + (`mas`) | 7 botones pequeños en 3 filas, «Trayecto» solo en la última y subtítulos solo en dos | Rejilla de 4 columnas, icono y una palabra, sin subtítulos: **Apartar · Invertir · Fijo · Deuda / Traspaso · Importar · Trayecto**. Unos 76 px de alto cada fila | Pequeño |
| B6 | Pago fijo y «Cobros y pagos recurrentes» | Dos cosas con nombre casi igual: un gasto suelto de tipo fijo (en el +) y el calendario de recibos (en Tú) | Al guardar un pago fijo nuevo, aviso con botón: **«¿Se repite cada mes? Te lo recordamos»** → crea el recurrente con ese importe y día. La fila de Tú pasa a **«Recibos y cobros fijos»** | Medio |
| B7 | Agenda → Calendario | Hay dos calendarios de dinero: Movimientos → Calendario y Agenda → Calendario → «Dinero». Dos selectores apilados | Quitar «Planes y tareas \| Dinero» de la Agenda. La leyenda que filtra («Cobros y pagos», «Metas y deudas») ya basta | Medio |
| B8 | Tú → Traer y guardar | Solo hay copia de seguridad (.json), que nadie sabe abrir | **«Descargar mis movimientos (Excel)»**: CSV con fecha, concepto, categoría, cuenta e importe con coma | Medio |
| B9 | Entrar | Sin «Mostrar contraseña». El nombre dice «Mis Finanzas y Tareas» (`08`) | Icono para ver la contraseña y el nombre de la tienda (pregunta 1). Enlace **«Privacidad»** al pie (lo pide `docs/33`) | Pequeño |

### C · Grandes (después de publicar)

| # | Qué | Por qué | Esfuerzo |
|---|---|---|---|
| C1 | Avisos (fijos de mañana, Juntos, fin de mes) | Lo que más echará en falta quien viene de otra app. Ya diseñado en `docs/25` | Grande |
| C2 | Widget «Te queda este mes» y «Apuntar gasto» | Apuntar sin abrir la app (`docs/25`) | Grande |
| C3 | Funcionar sin conexión | Hoy, sin red, se queda en «Cargando tus datos…». Guardar la última copia en el móvil y dejar apuntar sin red | Grande |
| C4 | «Compartir con PalomApp» desde la app del banco | Importar un extracto en dos toques (`docs/25`) | Grande |
| C5 | Repaso de piezas: chips y selectores de 44 px, una sola cabecera de periodo | Acabar de raíz con las diferencias entre pantallas (`docs/11` C1) | Grande |

## 3. Antes de la Play Store

Lo imprescindible **de experiencia**. Lo legal y técnico está en `docs/33` y aquí solo se dice cómo se ve.

| # | Qué | Cómo debe verse o comportarse | Bloquea |
|---|---|---|---|
| 1 | Botón y gesto de atrás | A1 completo. Probarlo con gestos y con los 3 botones de Android | **Sí** |
| 2 | Pantalla de borde a borde | Android 16 (obligatorio en la tienda) dibuja la app debajo de la hora y de la barra de abajo. La barra de arriba debe empezar en `top: 0` con el hueco de la hora como relleno propio. Hoy, por el código, se queda a la altura de la hora y **el contenido se vería pasar por detrás de la hora al bajar**. La barra de pestañas y el teclado de la app, por encima de la barra de gestos o de los 3 botones | **Sí** |
| 3 | Iconos de la barra de estado | Oscuros en claro y claros en oscuro, **también cuando el usuario fuerza Claro u Oscuro** en Tú, no solo según el móvil | Sí |
| 4 | Arranque | Pantalla de carga con el icono sobre el color de fondo de la app (#F5F5F2 en claro, #0A0A0C en oscuro). Sin destello claro si el usuario eligió Oscuro: el tema elegido se aplica antes de pintar (hoy se aplica al terminar de leer `app.js`). Fuentes y librerías dentro de la app | Sí |
| 5 | Sin conexión al abrir | A los 8 segundos sin datos: **«No hay conexión. En cuanto vuelva, verás tus datos.»** y botón **«Reintentar»**. Hoy pone «Cargando tus datos…» para siempre | Sí |
| 6 | Un solo nombre | El mismo en entrar, crear cuenta, bienvenida, Tú, el icono, la tienda y el archivo de copia (hoy «Mis Finanzas y Tareas», «Finanzas», «PalomApp» y «mis-finanzas-backup») | Sí (pregunta 1) |
| 7 | Tú → Tu cuenta | Filas, en este orden: Verificación en dos pasos · **Privacidad** (`shield`) · Cerrar sesión · **Borrar mi cuenta** (texto en rojo, al final). Confirmación: «¿Borrar tu cuenta y tus datos?» · «Se borran tus movimientos, metas y ajustes. En tus grupos seguirás saliendo como "baja" para que sus cuentas cuadren.» · «Cancelar» / «Borrar mi cuenta». El detalle de qué se borra lo decide `docs/33` | **Sí** |
| 8 | Botones que salen de la app | Probar uno por uno: «Pedir por WhatsApp», «Invitar», «Escríbenos», «Copia de seguridad», «Añadir al calendario». Hoy usan enlaces y descargas del navegador, que dentro de una app no siempre funcionan. Si no funcionan, deben abrir WhatsApp, el correo o el menú «Compartir» de Android | Sí |
| 9 | Teclado del sistema | No debe tapar «¿Qué fue?», «¿Cómo te llamas?», la casilla rápida de la Agenda ni el botón Guardar. Hoy depende de cómo informe Android del teclado con la pantalla de borde a borde | Sí |
| 10 | Quitar lo de pruebas | El botón «Antes» y las versiones que sobren (`VERSIONES`): el dueño elige antes Inicio y «En qué gastas» | Sí (pregunta 6) |
| 11 | Probar en 2 móviles reales | Uno pequeño (unos 667 px de alto) y otro con los 3 botones de Android, en claro y oscuro | Sí |

## 4. Lo que echará en falta quien viene de otras apps

| Función | Otras apps de finanzas | PalomApp hoy | Propuesta |
|---|---|---|---|
| Bloqueo con huella | Casi todas | No | B3, antes o justo después de publicar |
| Ocultar cifras | Habitual en bancos | No | B2 |
| Avisos | Sí | No | C1 (`docs/25`) |
| Widget | Muchas | No | C2 |
| Exportar a Excel | Sí | Solo copia .json | B8 |
| Conectar con el banco | Algunas | No (importar extracto) | No por ahora (`docs/25`): decirlo claro en la ficha de la tienda |
| Gastos compartidos, metas, agenda | Apps separadas | Sí, todo junto | Es lo que la diferencia: contarlo en la ficha |

## 5. Rendimiento percibido

| Medida (Chromium con el procesador 4 veces más lento, 390 px, datos inventados) | Tiempo (ms) |
|---|---|
| Abrir la app hasta ver Inicio (sin red: datos falsos) | 400-590 |
| Cambiar a Movimientos / Lista / Juntos / Dinero | 43-111 |
| Abrir el + / abrir «Nuevo gasto» | 8-33 / 80-100 |

Va bien. El riesgo real es la red: al abrir, la app espera a Supabase y no guarda nada en el móvil (puntos 4 y 5 del apartado 3, y C3).

## 6. Riesgos

- **A1 sin la hoja de «¿Descartar?»** haría perder gastos a medio apuntar con un gesto de atrás sin querer: el gesto desde el borde es muy fácil de hacer.
- **El gesto de atrás desde el borde derecho choca con deslizar un movimiento** para duplicarlo o borrarlo. Las dos cosas deben poder hacerse también desde la hoja del movimiento (ya existe «Apuntar uno nuevo igual»).
- Cambiar textos (A2, A3, A8, A11) rompe pruebas que comparan frases: hay que actualizarlas.
- Las etiquetas NUEVO se acumulan en las pantallas de quien ya usa la app (hoy 6 a la vez); a los nuevos de la tienda ya se les dan por vistas.

## 7. Preguntas para el dueño

1. **(Bloquea la tienda)** ¿Con qué nombre sale la app: «PalomApp» o «Mis Finanzas y Tareas»?
2. En Inicio, ¿atrás cierra la app directamente (recomendado, como las apps de Google) o pide «Pulsa otra vez para salir»? No bloquea.
3. ¿Huella al abrir y «Ocultar cifras» (B2 y B3) en la primera versión de la tienda o después? Recomendamos en la primera.
4. ¿Quitamos «Dinero» del calendario de la Agenda (B7)? No bloquea.
5. ¿Al guardar un pago fijo, ofrecemos convertirlo en recibo mensual (B6)? No bloquea.
6. **(Bloquea el punto 10)** ¿Qué versión se queda de Inicio y de «En qué gastas», para quitar el botón «Antes»?

## 8. Lo que no hemos podido averiguar o confirmar

- **Nada probado en un móvil real ni dentro de Capacitor.** Que atrás cierre la app es una deducción: la documentación de Capacitor solo dice que escuchar el botón desactiva el comportamiento de serie, y la app no guarda historial.
- La barra de arriba y la hora (punto 2 del apartado 3) son lectura del código: Chromium no dibuja la barra de estado.
- La pantalla de entrar se capturó sin `auth-signup.js`, así que no vimos el botón «Crear cuenta».
- Metas, deudas, «Repetir» y la foto del ticket no salen con los datos de prueba (formato antiguo o sin Supabase): no se revisaron en esta pasada.
- Los tiempos son con pocos datos. Con años de movimientos puede ir más lento.
- No se puede simular el teclado del sistema.

## 9. Fuentes

- Capturas del 08/11/2026: `tests/capturas/revisar.js` (15 pantallas × 2 anchos × claro y oscuro, sin avisos) y una tanda de prueba aparte, fuera del repositorio (móvil de 375 × 667, usuario vacío, formularios, entrar, bienvenida y medida de botones). Las que muestran problemas están en `docs/img/32/`.
- Código revisado el 08/11/2026: `index.html`, `app.js` (`renderShell`, `avisosInicioFilas`, `crearHtmlV2`, `elegirFotoTicket`, `exportBackup`, `ajustarAlTeclado`, `applyTheme`), `app.css` y `look.css` (barra de arriba, `check-btn`).
- Android, nivel de API exigido por Google Play (apps nuevas: Android 16, API 36), consultado el 08/11/2026: https://developer.android.com/google/play/requirements/target-sdk?hl=es
- Capawesome, guía de pantalla de borde a borde y zonas seguras en Capacitor (Android 15 la impone; las WebView anteriores a la 140 dan mal `env(safe-area-inset-*)`; Capacitor 8.3.2 o posterior), consultado el 08/11/2026: https://capawesome.io/blog/capacitor-edge-to-edge-and-safe-areas-guide/ (interés propio: venden plugins).
- Capacitor, plugin App, evento `backButton`, consultado el 08/11/2026: https://cdn.jsdelivr.net/npm/@capacitor/app@8.1.1/README.md

Para el PDF: una página con 4 recortes marcados (aviso del informe que tapa «Estos días», «−2.…» cortado, título del grupo en 4 líneas y desplegable del navegador) y un esquema de flechas del botón atrás: hoja con paso → hoja → Agenda o Tú → pestaña → Inicio → salir.

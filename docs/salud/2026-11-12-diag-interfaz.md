# Diagnóstico de interfaz y móvil · 12/11/2026

Departamento: Producto y Diseño. Fase A4 (y parte de A2) de `docs/40-plan-sesion-potente.md`. Rama `fase13/integracion` (cambio `809aaff`). **No se ha cambiado la app**: solo capturas, medidas y propuestas, con datos inventados. Nada probado en un móvil real.

## 1. Conclusión

1. **Ningún P0**: todas las pantallas y hojas se pueden usar a 320, 360, 390 y 412 px, en claro y oscuro, y en tableta horizontal; 0 errores de la app en consola; sin scroll lateral.
2. **Con el teclado del móvil abierto, el campo que escribes queda debajo de la barra «Cancelar · Guardar»** en 8 hojas (borrar cuenta, tu nombre, editar movimiento, compartir, meta, moneda…). Es el problema más serio (P1).
3. **El botón atrás de Android cierra la hoja entera** aunque estés dentro de una subpantalla (ajustes del grupo, historial, saldar, importar paso 2): pierdes dónde estabas, y en Importar lo preparado. Con una ventanita abierta sobre Inicio, **cierra la app**.
4. **A 320 px o con letra al 130 %** se cortan botones peligrosos («Borrar mi cue…», «Cerrar sesió…»), el título se parte («Movimiento / s») y la barra de abajo junta «InicioMovimientos».
5. **Accesibilidad**: los interruptores de Tú → Avisos no tienen nombre (un lector de pantalla dice solo «interruptor»); «Pedir por WhatsApp» tiene un contraste de 1,98 (mínimo 4,5); hay unas 200 zonas de toque de menos de 44 px (27 de 25-32 px).

## 2. Tablas

### 2.1 Problemas (P0 no se puede usar · P1 molesta mucho · P2 mejora · P3 detalle)

| Problema | Pantalla | Ancho/tema | Captura | Prioridad | Arreglo propuesto |
|---|---|---|---|---|---|
| Con el teclado abierto, el campo enfocado queda tapado por la barra de botones fija | Borrar cuenta, Tu perfil, Editar movimiento, Compartir, Nueva meta, Otra moneda, Trayecto | 360 × 500, claro | `02`, `03` | P1 | En `look.css`: `html[data-look="nuevo"] .sheet { scroll-padding-bottom: 110px; }` y, al enfocar un campo en una hoja, `el.scrollIntoView({ block: 'center' })` tras 250 ms (cuando el teclado ya ha subido) |
| Atrás cierra la hoja entera desde una subpantalla | Grupo → Ajustes / Historial / Saldar / ¿De dónde sale?; Importar → Revisar; Cobro fijo → «Cuándo»; Cuentas → una cuenta | todos | — | P1 | Ver tabla 2.2. Que atrás pulse el botón «Volver» de la hoja si lo hay (`.sheet [data-click^="histVolver"], [data-click^="grupoAjustesSalir"], [data-click^="impVolver"]…`) |
| Atrás con una ventanita abierta en Inicio (detalle de «Así vas») **cierra la app** | Inicio | todos | — | P1 | Primera línea de `atrasAndroid`: `if ($('#popupBackdrop')) { cerrarPopup(); return true; }` |
| Botón peligroso cortado: «Borrar mi cue…», «Cerrar sesió…» | Hojas Borrar mi cuenta y Cerrar sesión | 320 (y 360 con letra 130 %) | `01` | P1 | `html[data-look="nuevo"] .sheet .actions .btn { white-space: normal; line-height: 1.15; }` y en esas dos hojas el botón rojo con `flex: 1.6` |
| Título de pestaña partido «Movimiento / s» | Movimientos | 320 | `06` | P1 | En el `@media (max-width: 340px)` de `look.css:1246`, cambiar `overflow-wrap: anywhere` por `font-size: 24px; overflow-wrap: normal;` |
| «Pedir por WhatsApp»: blanco sobre verde, contraste 1,98 | Hoja de persona | claro y oscuro | `07` | P1 | Texto oscuro sobre el mismo verde: `color: #0B2E18` (contraste ≈ 7,6) |
| Interruptores sin nombre accesible (5 tipos) | Tú → Avisos | todos | — | P1 | En `avisosHtml`, el `sw()` con `aria-label` = el título de su fila («Cobros y pagos fijos», «Leer los avisos del banco», nombre del banco…) |
| Letra al 130 %: barra de abajo «InicioMovimientos» pegados; «Apartado/Invertido» cortados en la tarjeta; píldora «Noviembre · del 1 al 30» en 3 líneas; «381,09 / €» partido | Inicio, Movimientos Resumen | 360, letra 130 % | `04` | P1 | Barra: etiquetas a `font-size: min(11px, 2.9vw)` con `letter-spacing: -.01em`, o solo icono + etiqueta de la pestaña activa cuando no caben. Tarjeta: las 4 cifras en 2 × 2 si `.hero` mide < 340 px. Píldora: solo «Noviembre ▾» por debajo de 360 px |
| Letra al 130 %: el + corta «Compartido» y «Ingreso» se pega | + | 360, letra 130 % | `05` | P2 | Etiquetas de las 4 grandes en 2 líneas, `hyphens: auto` y 12 px |
| «Elige categoría» se sale de la tecla y tiene contraste 2,4 | Gasto, Aportar, Traspaso (teclado de la app) | 320; claro y oscuro | — | P2 | Tecla apagada con fondo `--accent-soft` y texto `--pd`; a ≤ 340 px, «Categoría» |
| Chip elegido en oscuro: blanco sobre lila, 2,68 | Grupo («Todo»), moneda, viaje | oscuro | — | P2 | `.chip.active { color: var(--accent-ink); }` (como los botones principales en oscuro) |
| Zonas de toque < 44 px: «Elegir mes» 27 px, «Todas las cuentas» 30, interruptores 50 × 30, «Mes/Año» 32, filas de «En qué gastas» 32, «Me ha pagado» 32, botones `.btn.sm` 36, avatar de arriba 40 | Movimientos, Avisos, Filtros, Aspecto, Grupo, Inicio | todos | — | P2 | Zona invisible: `.switch, .mov-per-lbl, .btn.sm, .gc-mini, .jv-btn { position: relative; } ::after { content: ''; position: absolute; inset: -8px -4px; }` (no cambia el dibujo; ya pedido en `docs/32` A4/C5) |
| Etiquetas de deslizar «Duplicar» 3,6 y «Borrar» 3,8 | Lista de movimientos | claro | — | P2 | Texto blanco puro (`#fff`), 13 px y negrita |
| Campo de descripción sin etiqueta (solo el texto de ejemplo) | Compartir un gasto | todos | — | P2 | `aria-label="Descripción"` en `#crDesc` |
| Gráfico sin nombre (círculo que se toca) | Movimientos → Resumen | todos | — | P3 | `aria-label` con la categoría y el importe |
| Gris de ayuda 4,22 sobre lila claro («Has descubierto…», «¿Algo falla…?») | Tú | claro | — | P3 | `--text-faint` a `#5d6175` dentro de tarjetas tintadas |
| Nombre del grupo en la hoja: «Piso / compa…» | Grupo | 320 | — | P3 | Ya mejorado; a ≤ 340 px, 17 px y 2 líneas |
| Zonas seguras laterales (móvil en horizontal con muesca) sin tener en cuenta | Toda la app | horizontal | — | P3 | `padding-left/right: max(16px, env(safe-area-inset-left/right))` en `.topbar`, `main` y `.tabbar` |
| Tableta horizontal: el contenido de Movimientos se estira hasta 620 px de ancho | Movimientos | 1024 × 768 | — | P3 | `max-width: 720px` como Inicio |

### 2.2 Botón atrás de Android (`atrasAndroid`, app.js:11210)

| Dónde estás | Qué hace hoy | Qué debería hacer | ¿Falla? |
|---|---|---|---|
| Pregunta «¿Descartar…?» | La cierra (sigues editando) | Igual | Bien |
| Hoja con algo escrito (gasto, ingreso, compartir, traspaso, aportar, tarea, trayecto, meta/deuda/fijo nuevos) | Pregunta «¿Descartar…?» | Igual | Bien |
| Editar un movimiento existente con cambios | Cierra sin preguntar (`FORM.id` no cuenta) | Preguntar si algo cambió | P2 |
| Hoja «Tu perfil» con el nombre cambiado, «Saldar» con importe | Cierra sin preguntar | Preguntar | P3 |
| Grupo → Ajustes / Historial / Saldar / ¿De dónde sale? / un tema | Cierra todo | Volver al grupo | **P1** |
| Persona → ¿De dónde sale? / Saldar | Cierra todo | Volver a la persona | P1 |
| Importar → Revisar (paso 2) | Cierra todo; lo preparado se pierde | Volver al paso anterior; si hay revisión, preguntar | **P1** |
| Cobro/pago fijo → «Cuándo»; Cuentas → una cuenta → Editar; Metas → una meta | Cierra todo | Un paso atrás | P2 |
| Compartir → «Otra moneda» abierta | Cierra todo (o pregunta) | Cerrar solo «Otra moneda» | P2 |
| Ventanita (`#popupBackdrop`) sobre una hoja | Cierra la hoja y la ventanita | Solo la ventanita | P2 |
| Ventanita sobre Inicio («Así vas») | **Sale de la app** | Cerrar la ventanita | **P1** |
| Pista de ayuda en pantalla | La deja y cambia de pestaña / sale | Cerrar la pista | P3 |
| Inicio → Tareas o Calendario | Vuelve a Inicio | Igual | Bien |
| Dinero → «Ver todo» de inversiones | Vuelve a Dinero | Igual | Bien |
| Movimientos con búsqueda abierta | Va a Inicio | Cerrar la búsqueda | P2 |
| Movimientos abierto desde una categoría o cuenta («Volver» arriba) | Va a Inicio | Hacer lo de «Volver» (`H.volver`) | P2 |
| Agenda → Calendario, Juntos, Dinero, Tú, Movimientos | Va a Inicio | Igual | Bien |
| Inicio | Sale de la app | Igual | Bien |
| Bienvenida (paso 2 o 3) | Sale de la app | Paso anterior (`H.obBack`) | P2 |
| Pantalla de huella (bloqueada) | Cierra hojas o cambia de pestaña por detrás | No hacer nada (o salir) | P3 |

### 2.3 Pendientes de `docs/11` (C) y `docs/32` (B4, B6, C3, C5), mirando la app de hoy

| N.º | Qué pedía | Hoy | Estado |
|---|---|---|---|
| docs/11 C1 | Piezas iguales en toda la app | Cuatro cabeceras de periodo distintas (Inicio: píldora «Noviembre · del 1 al 30»; Movimientos: «Noviembre ▾ / 1 nov – 30 nov · 2026» + «Mes \| Año»; Agenda: «Semana del 9 al 15 nov» / «Noviembre 2026»; Informes: «Octubre / 1 oct – 31 oct») | Sigue |
| docs/11 C2 | Teclado propio del importe | Hecho | Hecho |
| docs/11 C3 | Vacíos con icono, frase y botón | Juntos y calendario sí; «Cobros y pagos fijos» y la lista de cuentas siguen con texto suelto | A medias |
| docs/11 C4 | Capturas automáticas | Hecho y ampliado hoy | Hecho |
| docs/11 C5 | Novedades sin emojis y quitar «Antes» | 48 emojis en `NOVEDADES`; `VERSIONES` aún con variantes cerradas (inicio, juntos, movResumen…) | Sigue |
| docs/32 B4 | Fila «Hoy · Cuenta» encima del teclado | A 844 px se ve encima del teclado. En **Aportar** con letra al 130 %, «Fecha · Hoy» queda debajo del teclado | A medias |
| docs/32 B6 | «¿Se repite cada mes?» al guardar un pago fijo | Nombre unificado en Tú («Cobros y pagos fijos»), pero «Pago fijo» sigue siendo dos cosas: el tipo de gasto en Editar movimiento y en el +, y el cobro o pago que se repite. La pregunta no existe | Sigue |
| docs/32 C3 | Sin conexión | No hecho (va en C6 de `docs/40`) | Sigue |
| docs/32 C5 | Piezas de 44 px | ~200 zonas < 44 px (tabla 2.1) | Sigue |

### 2.4 Incoherencias

| Qué | Dónde | Propuesta |
|---|---|---|
| Para cerrar una hoja que solo se mira hay tres palabras: «Listo» (cuentas, fijos, aspecto, tu mes), «Volver» (historial, ¿de dónde sale?), «Cerrar» (grupo, trayecto) | Hojas | «Cerrar» si solo se mira; «Listo» si guarda solo; «Volver» solo en subpantallas |
| «Me ha pagado» (grupo) y «Ya me ha pagado» (persona) | Juntos | «Me ha pagado» en los dos |
| «Tu mes: del 1 al 31» en noviembre | Tú y hoja «Tu mes» | «Del 1 a fin de mes» (ya en `docs/salud/2026-11-11` C2) |
| Meta: «434,00 € al mes» y botón «435 € · lo que toca» | Meta → Aportar | La misma cifra (ya en C1 del 11/11) |
| Unas hojas ponen los botones en la barra fija y en Editar movimiento hay otra fila debajo («Convertir en traspaso», «Eliminar») | Editar movimiento | Esas dos, como enlaces encima de la barra |

## 3. Recomendaciones

- **Arreglar primero** el teclado que tapa campos y el botón atrás (tabla 2.2): son los dos que se notan en la app de Android desde el primer día.
- **Pasar `revisar.js --letra=130` en cada cambio de aspecto**: es donde salen casi todos los cortes. Opciones nuevas: `--anchos`, `--temas`, `--letra`, `--tableta`, `--teclado`, `--medir`, `--mas`, `--solo`, `--x1`.
- **Una prueba automática de `atrasAndroid`** por cada fila de la tabla 2.2 (jsdom basta).

## 4. Riesgos

- Hacer que atrás «vuelva un paso» necesita saber en cada hoja cuál es el paso anterior; si se hace a mano hoja por hoja, se olvidará alguna. Mejor una regla general: «si la hoja tiene un botón Volver, púlsalo».
- El 130 % aquí es una imitación (se agranda la letra de cada elemento). El WebView de Android puede repartir el espacio algo distinto.

## 5. Preguntas para el dueño

1. ¿Las hojas que solo se miran se cierran con «Cerrar» en toda la app (recomendado)? No bloquea.
2. ¿Atrás en la bienvenida vuelve al paso anterior en vez de salir? No bloquea.

## 6. Lo que no hemos podido averiguar o confirmar

- **Nada probado en un móvil real ni en el WebView de Android.** El teclado se imitó con 500 px de alto; el 130 % con letra agrandada a mano; no se probó el 200 %.
- Las medidas de contraste y de toque se hicieron a 320 px, claro y oscuro; las de 360, 390 y 412 px y las 5 paletas no llegaron a correr (se cortó la sesión). Las capturas a 360 con letra 130 % solo en claro.
- Las zonas seguras se revisaron leyendo el CSS (`env(safe-area-inset-*)` está en barra de arriba, barra de abajo, hojas y bienvenida), no en un móvil con muesca.
- El botón atrás se revisó leyendo el código, no pulsándolo.

## 7. Fuentes

- Capturas propias del 12/11/2026 con `tests/capturas/revisar.js` (ampliado en esta rama): ~120 a 320 px, ~50 a 360 px con letra 130 %, 34 hojas a 360 × 500, 4 en tableta. Las que demuestran los P1, en `docs/salud/capturas-2026-11-12/`.
- Contraste mínimo AA (4,5 y 3 para letra grande): https://www.w3.org/TR/WCAG21/#contrast-minimum — criterio conocido, no consultado hoy.
- Tamaño de toque 48 dp en Android: https://developer.android.com/guide/topics/ui/accessibility/apps — consultado el 11/11/2026.

Para el PDF: la tabla 2.2 como un mapa de pantallas con flechas de «atrás» (verde bien, rojo falla).

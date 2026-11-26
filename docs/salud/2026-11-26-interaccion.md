# Auditoría de interacción · 26/11/2026

Departamento: Calidad. Sesión 1 de `docs/51`. Rama `fase23/pulido-interfaz` (hasta `ec5612d`). Chromium sin pantalla, con toques simulados (`page.touchscreen.tap` y eventos táctiles de verdad para deslizar), a 390 × 844 y 360 × 740, tema claro, datos inventados (`tests/capturas/datos-falsos.js`). Script: `tests/capturas/interaccion.js`. **Nada probado en un móvil real.**

## 1. Conclusión
1. **El doble toque es el problema que más se nota y el único que toca datos.** Al abrir una hoja, el segundo toque pulsa lo que haya debajo del dedo en la hoja nueva: puede cambiar o quitar la categoría de un movimiento, elegir una categoría en «Nuevo gasto» o abrir otra hoja. Al guardar, el segundo toque cae en la pantalla de detrás (salta a Juntos, abre el +…). Guardar nunca duplica.
2. **Con una hoja abierta, la pantalla de detrás se desplaza** (30 de 77 hojas a 390 px). Al cerrar, estás en otro sitio.
3. **Atrás de Android:** pregunta «¿Descartar este gasto?» en gastos compartidos que ya existen, sin haber cambiado nada. En la búsqueda de Movimientos, la guía de avisos, «Aportar» desde una meta y Trayecto, cierra más de la cuenta.
4. **Para los nuevos («Lo básico»), la pista de Tú se queda flotando al desplazar** y tapa otras filas.
5. Lo demás va bien: sin desplazamiento lateral, sin botones muertos, sin repintados solos, nada a medias tocando rápido, y guardar con doble toque nunca duplica.

## 2. Tablas

### 2.1 Fallos claros (de más a menos visible)
| # | Pantalla | Qué pasa | Cómo reproducirlo | Dónde y arreglo |
|---|---|---|---|---|
| 1 | Toda la app (hojas) | El segundo toque de un doble toque cae en la hoja recién abierta: cambia o quita la categoría de un movimiento, elige categoría en «Nuevo gasto», abre otra hoja o cierra la que se abría (21 de 81 botones a 390 px, 16 a 360 px) | 360 × 740 · Movimientos → Lista · doble toque en «Compra semanal» (Supermercado) → sale marcado «Restaurantes» o nada · «+» → doble toque en «Gasto» → «Ocio» / «Supermercado» elegido | `openSheet` / `updateSheet` y `click` del documento. No atender toques ~350 ms después de abrir una hoja o de cambiar a otra (`FORM.kind`) |
| 2 | Hojas con «Guardar» | Guarda una vez (bien), pero el segundo toque cae detrás: Editar movimiento o tarea → pestaña Juntos; gasto con teclado → «Historial» o la Agenda; Saldar → abre el + | Movimientos → Lista → un gasto → doble toque en «Guardar» | `closeSheet` quita al momento la capa que recoge los toques. La misma espera tras cerrar |
| 3 | Todas las hojas | El fondo se desplaza con la hoja abierta: p. ej. de 0 a 566 px | Movimientos → Lista → «Elegir mes» → deslizar hacia arriba en lo oscuro | `look.css`: `.sheet-backdrop{overscroll-behavior:contain;touch-action:none}` y `.sheet{overscroll-behavior:contain}` (también `.popup-backdrop` y `.descartar`) |
| 4 | Juntos, grupo y Lista | Atrás en un gasto compartido ya guardado, sin cambios, pregunta «¿Descartar este gasto?». No borra nada | Juntos → un gasto de «Lo último» → atrás | `hojaConAlgoEscrito`: mira `!FORM.id` y el compartido usa `FORM.compId`. Prueba: `tests/test210_toques_atras_comp.js` |
| 5 | Tú («Lo básico») | La pista «Aquí tienes todas las herramientas» es fija: al desplazar se queda en su sitio y tapa otras filas | Cuenta nueva → Tú → desplazar hacia abajo | `pintarPista` y `.pista` |
| 6 | Editar tarea; Ajustes del grupo; Ajustes de persona | «Eliminar tarea», «Salir del grupo» y «Dejar de compartir con …» van después de la barra fija y esta les tapa 14 de 46 px | Inicio → una tarea → bajar hasta el final | Ponerlos antes de la última `.actions`, como en «Editar movimiento» |

### 2.2 Dudosos (decide Producto o el dueño)
| Dónde | Qué pasa hoy | Propuesta |
|---|---|---|
| Movimientos con la búsqueda abierta | Atrás va a Inicio (ya apuntado el 12/11) | Cerrar la búsqueda |
| Guía de avisos (paso 3 de 6) | Atrás cierra la guía entera | Volver al paso anterior |
| Meta → Aportar | Atrás cierra todo | Volver a la meta |
| Trayecto con km escritos | Atrás cierra sin preguntar | Añadir `#trKm` a `hojaConAlgoEscrito` |
| Movimientos → Lista; Agenda → Calendario | Atrás va a Inicio | Volver a Resumen / Semana, o dejarlo |
| Reglas de categorías | Al tocar el chip «Un traspaso» la hoja sube 73 px | Mirar si es por el cambio de alto |
| 109 toques pequeños | Repintan la pantalla entera, sin saltos | Nada por ahora. Vigilarlo en móviles lentos |

### 2.3 Lo que va bien
| Comprobación | 390 × 844 | 360 × 740 |
|---|---|---|
| Desplazamiento lateral (pantallas y hojas) | Ninguno | Ninguno |
| Botones muertos | 0 de 691 toques | 0 |
| Último botón por encima de la barra de abajo | Sí | Sí |
| Repintados sin tocar nada (3 s) | 0 | 0 |
| Toques rápidos (pestañas, meses, abrir y cerrar hojas, arrastrar la hoja) | Nada a medias | Nada a medias |
| Guardar con doble toque (8 casos) | Nunca duplica | Nunca duplica |
| Atrás en la raíz / en las subhojas | `false` / vuelve un paso | Igual |

## 3. Lo que no se ha podido comprobar
- Ningún móvil real: ni el WebView de Android, ni el gesto de atrás de iPhone, ni la muesca, ni el teclado del sistema.
- Solo tema claro, sin letra grande y sin 430 px (eso lo cubrió `revisar.js`).
- Los toques dentro del anillo de «En qué gastas» (SVG).

# Fase 4 · Movimientos: propuesta de Producto y diseño (17/10/2026)

Bocetos en `docs/img/` (prueba dibujada aparte, no es la app; móvil de 375 × 667 px, datos inventados):

| Archivo | Qué enseña |
|---|---|
| `mov-resumen-antes.png`, `mov-lista-antes.png` | Capturas de la app de hoy (oscuro; la Lista también en claro) |
| `mov-resumen-boceto.png` | Resumen al entrar y al tocar un color del anillo |
| `mov-resumen-boceto-claro.png` | Lo mismo en modo claro |
| `mov-lista-boceto.png` | Lista normal y con la lupa abierta |
| `mov-filtros-boceto.png` | Hojas «Filtros» y «Elegir mes» |
| `mov-vista2-boceto.png` | Vista nueva recomendada: Calendario |

## 1. Conclusión

1. **Resumen primero y tres vistas:** «Resumen | Lista | Calendario». Al tocar la pestaña Movimientos se abre siempre el Resumen; los atajos con filtro (tocar «Gastos», una categoría…) siguen abriendo la Lista.
2. **Una sola cabecera para las tres:** titular grande «Octubre ⌄» con las fechas de tu mes debajo y dos flechas discretas. Se quitan la tarjeta del mes, «Mes / Año / Todo» (pasan a la hoja «Elegir mes») y la etiqueta NUEVO.
3. **El anillo y su leyenda van juntos** en la misma tarjeta: 5 categorías y «Otras», sectores redondeados y separados, total en el centro. Al tocar un color, el centro enseña esa categoría. Los presupuestos usan los mismos colores, en filas de unos 50 px (hoy 88 px).
4. **La Lista enseña 4 movimientos enteros en vez de 1:** tres filtros a la vista (Todos, Gastos, Ingresos), una lupa que se abre y un botón «Filtros» con todo lo demás. Las cuentas pasan a una píldora bajo el mes.
5. **El «pantallazo negro» tiene una causa clara** (abajo, punto 5): al cambiar de vista, toda la pantalla, incluido el propio selector, se vuelve transparente y aparece poco a poco. Se arregla deslizando solo el contenido, sin transparencia.

## 2. Qué falla hoy

| # | Problema | Medida (375 × 667 px) |
|---|---|---|
| 1 | Se entra en la Lista, y lo que más se usa es el Resumen | — |
| 2 | La cabecera del mes es una tarjeta más, con «Mes / Año (/ Todo)» y la etiqueta NUEVO encima | 58 px de alto, compite con las cifras |
| 3 | El anillo es una tarta con agujero: sectores en pico, sin separación, tocar no hace nada. La leyenda va aparte, como texto subrayado | Leyenda de 9 líneas bajo el gráfico |
| 4 | «Te queda» y «Apartado» llevan el mismo morado | — |
| 5 | Presupuestos: cada categoría ocupa 88 px y lleva su «Cambiar» | 11 filas = 968 px; Resumen de 2.090 px de alto |
| 6 | Lista: antes del primer movimiento hay cuentas, buscador y 8 filtros | Primera fila en el px 442; se ve 1 fila entera |
| 7 | Los filtros de tipo no caben: fila de 688 px en 347 px | «Con ticket» empieza en el px 605 |
| 8 | La fila de cuentas también se sale por la derecha | 433 px en 347 px |
| 9 | El título de cada fila es la categoría («Supermercado»), no lo que la distingue («Mercadona») | — |
| 10 | Al cambiar Lista ↔ Resumen, la pantalla se queda casi negra un instante | 50 ms después de tocar, todo está al 0–28 % de opacidad |

## 3. Cómo debe quedar el Resumen

De arriba abajo (ver `mov-resumen-boceto.png`):

| Bloque | Cómo | Microinteracción |
|---|---|---|
| Selector | «Resumen \| Lista \| Calendario», 38 px de alto | La marca se desliza (ya existe) |
| Mes | «Octubre ⌄» grande; debajo «28 sep – 27 oct · 2026» (con `rangoMes`); flechas ‹ › de 38 px a la derecha | Al tocar «Octubre ⌄», hoja «Elegir mes». Deslizar el titular cambia de mes. El nombre entra por el lado (ya existe) |
| 4 cifras | 2 × 2, más bajas (unos 60 px cada una): Ingresos, Gastos, Apartado, Te queda. «Te queda» en blanco con borde del color de la app | Chip «↑ 13 %» frente al mes anterior. Las cifras cuentan hasta su valor |
| En qué gastas | Una tarjeta: anillo de 150 px a la izquierda y la leyenda pegada a la derecha (nombre y %). Centro: «1.489 €, gastado» | Al tocar un sector o una fila de la leyenda: ese sector engorda, los demás se apagan y el centro dice «Vivienda · 720 € · 48 %». Segundo toque: abre la Lista filtrada. Entrada: el anillo gira y los sectores se dibujan uno tras otro (0,8 s) |
| Presupuestos | Una línea resumen con barra («Llevas 1.442 € de 1.550 €») y filas de unos 50 px: icono del color de la categoría, nombre, «249,30 / 300 €», barra fina con la marca del presupuesto. Si te pasas: «+14,10 € de más» en rojo | «Editar» en la cabecera abre los presupuestos; tocar una fila abre sus movimientos (como hoy). Barras que crecen al verse (ya existe) |

**Colores:** cada categoría tiene siempre el mismo color (hoy depende del puesto en el gráfico). Máximo 6 colores en el anillo: las 5 mayores y «Otras» en gris; en la lista, las de «Otras» llevan el icono gris. En claro, los mismos tonos un punto más oscuros. Se cambia el naranja rojizo `#F26B38` de la paleta actual para no rozar el terracota.

**Se quita:** la tarjeta del mes, las etiquetas NUEVO y MEJORADO de esta pantalla, la línea larga «Sin presupuesto: … (total del mes …)» (pasa a la hoja de editar) y el «Cambiar» de cada fila.

## 4. Cómo debe quedar la Lista

Ver `mov-lista-boceto.png` y `mov-filtros-boceto.png`.

| Bloque | Cómo |
|---|---|
| Cabecera | La misma del Resumen. Bajo el mes, una píldora de cuentas: «●●● Todas las cuentas ⌄» (solo con 2 o más cuentas). Con una elegida: «● Banco ✕» |
| Filtros | «Todos · Gastos · Ingresos», y a la derecha la lupa y «Filtros» (icono de dos barras). Con filtros puestos, el botón se ilumina y lleva un número |
| Lupa | Al tocarla, los filtros se apartan y se abre el campo con el teclado; «Cancelar» lo cierra. Busca también por importe («39,60»). Si no hay nada en el mes: «Buscar en todo tu historial» (ya existe) |
| Hoja «Filtros» | Qué movimientos (Todos, Gastos, Ingresos, Fijos, Apartado, Inversión, Deuda, Traspasos), «Solo los que tienen ticket / son compartidos» (interruptores que se suman a lo anterior), Cuenta, Categoría. Botón «Ver N movimientos» que cuenta en vivo; «Quitar todos» |
| Hoja «Elegir mes» | Mes / Año entero / Todo (Todo solo en Lista y Calendario), año con flechas, 12 meses con un punto si tienen movimientos. Recordatorio «Tu mes va del 28 al 27 · Cambiar» |
| Filas | Arriba lo que distingue el movimiento (la descripción); debajo la categoría. Sin descripción, arriba la categoría (como hoy). La cuenta pasa a un punto en la esquina del icono. Se mantienen los colores por tipo, los iconos por categoría y deslizar para «Duplicar / Borrar» |
| Días | «Hoy · sáb 17», «Ayer · vie 16», «Jueves 15», con el total del día a la derecha (como hoy) |

Resultado: primera fila hacia el px 280 (hoy 442) y 4 filas enteras a la vista (hoy 1).

## 5. Vista nueva: Calendario (recomendada)

Ver `mov-vista2-boceto.png`.

| Opción | Qué aporta | Decisión |
|---|---|---|
| **Calendario del mes con el gasto de cada día** | Responde a «¿qué pagué el sábado?» y «¿qué días se me va el dinero?». Hoy no se ve en ningún sitio | **Recomendada** |
| Cuadrícula por categoría | Lo mismo que el anillo y los presupuestos del Resumen | Descartada |
| Lista agrupada por categoría | Es la Lista con otro orden; ya se filtra por categoría | Descartada |

Cómo: las semanas de tu mes (28 sep – 27 oct), cada día con lo gastado y más color cuanto más gasto. El color es el de la app, no rojo. Lo fijo (alquiler, luz, Spotify) no pinta el día: sale como punto azul, para que el alquiler no lo tape todo; el cobro, punto verde. Días futuros apagados; hoy con borde. Al tocar un día, sus movimientos salen debajo. Abajo, «5 días sin gastos» como pequeño premio.

Matiz: el dueño decidió no dar «cifras por día» en Inicio. Aquí no es una cifra por día recomendada, sino lo que ya gastaste cada día. Si aun así no convence, se puede quitar el número y dejar solo el color.

## 6. El «pantallazo negro»: causa y arreglo

**Causa (comprobada en Chromium con datos de prueba):**

1. `setMovVista` (app.js, acción en `H`) pone `S._entrando = true` y llama a `render()`.
2. `render()` cambia todo el `#content` y le pone la clase `entra` (app.js, en `render`). En app.css, `main#content.entra > *` arranca cada bloque **desde opacidad 0**, con retrasos de hasta 0,13 s. Esto le pasa también al propio selector Lista/Resumen y a la cabecera del mes.
3. En oscuro, el fondo es casi negro (`#0A0A0C`): medido, a los 50 ms los bloques están al 0–28 % de opacidad, a los 150 ms al 28–79 %, y hasta unos 450 ms no se ve todo.
4. Además, el anillo (`#donutWrap > svg`, clase `va-pop`) vuelve a empezar transparente, porque `revelarAlVer` olvida lo ya visto al cambiar `S.movVista`.
5. Y no se vuelve arriba: la página pasa de 3.285 px (Lista) a 2.090 px (Resumen), así que si estabas abajo, aterrizas a media pantalla.

**Arreglo propuesto (para Desarrollo):**

| Paso | Qué |
|---|---|
| 1 | Al cambiar de vista **no** usar `entra`: solo se repinta el cuerpo de la vista, no el selector ni la cabecera del mes |
| 2 | Cuerpo en un contenedor propio. Se pinta el nuevo al lado del viejo y los dos se deslizan a la vez (unos 300 ms, `--ease-out`), hacia la izquierda si vas a una vista de más a la derecha, y al revés. Nunca opacidad 0. Se puede usar `element.animate` (ya se usa en el confeti) |
| 3 | Si estabas más abajo de la cabecera, subir arriba antes de deslizar, y fijar el alto mientras dura, para que nada salte |
| 4 | El anillo y las barras se animan **cuando termina** el deslizamiento, no a la vez |
| 5 | Con «reducir movimiento»: cambio directo, sin animación ni transparencia |
| 6 | Opcional: deslizar con el dedo sobre el contenido para pasar de una vista a otra |

El cambio de mes ya usa `desde-der` / `desde-izq` en el nombre y en la lista; se mantiene y se aplica también al cuerpo del Resumen.

## 7. Mejoras nuevas, por prioridad

| # | Mejora | Qué aporta | Esfuerzo |
|---|---|---|---|
| 1 | **Comparar con el mes anterior** (chip «↑ 13 %» en Ingresos y Gastos; en el centro del anillo al tocar una categoría: «40 € más que en sep») | Saber de un vistazo si vas mejor o peor. Usa `kpisMes` del mes anterior | Bajo |
| 2 | **Fila con la descripción arriba y búsqueda por importe** | Encontrar «el de Mercadona de 39,60» sin abrir nada | Bajo |
| 3 | **«Dónde más gastas»**: las 3 descripciones que más suman en el mes («Mercadona · 3 veces · 173,80 €») bajo los presupuestos | Ver los sitios, no solo las categorías | Bajo |
| 4 | **Deslizar** entre vistas y en el titular para cambiar de mes | Se maneja con una mano sin buscar botones | Bajo-medio |
| 5 | **Avisar de pagos que se repiten** («Spotify, 10,99 € todos los meses: ¿lo apunto como fijo?») | Llenar los fijos y la línea PREVISTO de Inicio sin trabajo | Medio |
| 6 | **Seleccionar varios** (mantener pulsado) para cambiar categoría o cuenta, o borrar, con «Deshacer» | Ordenar rápido lo que llega al importar. Debe pasar antes por Datos y seguridad (cambios en bloque) | Medio |

Descartada: «gasto medio diario», para no contradecir la decisión de no dar cifras por día.

## 8. Riesgos

- Quien está acostumbrado a entrar en la Lista tendrá un toque más. Se compensa porque los atajos con filtro siguen yendo a la Lista.
- Cambiar el título de las filas cambia lo que el ojo busca. Probarlo con la pareja y los amigos antes de dejarlo.
- «Ticket» y «Compartidos» dejan de ser un tipo exclusivo y pasan a sumarse a un tipo: hay que revisar `movsFiltrados` y las pruebas que comprueban los filtros y los textos («Buscar en esta lista», «Con ticket»…).
- El Calendario pinta 35 días con totales: comprobar que va fluido con muchos movimientos.

## 9. Preguntas para el dueño

1. **(Bloquea)** ¿Tres vistas «Resumen | Lista | Calendario», con el Resumen siempre al entrar? (Alternativa: solo «Resumen | Lista» ahora y el Calendario después.)
2. ¿En la Lista ponemos arriba lo que distingue cada movimiento («Mercadona») y debajo la categoría?
3. ¿Agrupamos en «Otras» las categorías pequeñas del anillo (máximo 6 colores)?

## 10. Lo que no hemos podido averiguar o confirmar

- Nada probado en un móvil real: capturas y medidas con Chromium automático a 375 × 667 px, con datos inventados.
- No se ha medido con el texto grande del sistema ni en pantallas de 320 px.
- Las capturas «antes» y los bocetos usan datos inventados algo distintos (por eso no coinciden las cifras).
- No se ha comprobado el rendimiento del anillo animado ni del calendario en un móvil modesto.
- El parpadeo se ha medido en Chromium; en Safari (iPhone) no se ha probado.

## 11. Fuentes

- Código de la app (`app.js`: `render`, `setMovVista`, `renderMovimientos`, `renderMovResumen`, `renderAnalisisMensual`, `presupuestoFilasHtml`, `kpiMesHtml`, `movNavHtml`, `movCuentaFiltroHtml`, `drawDonut`, `renderMovRowBase`, `revelarAlVer`; `app.css` y `look.css`), 17/10/2026.
- Capturas y medidas propias con datos inventados, 17/10/2026.

Para el PDF: poner `mov-lista-antes.png` (1 fila a la vista) junto a `mov-lista-boceto.png` (4 filas), y una tira de 3 fotogramas del cambio de vista hoy (0 ms, 50 ms, 150 ms) frente al deslizamiento.

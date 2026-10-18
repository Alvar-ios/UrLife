# Fase 4 · «En qué gastas»: propuesta de Producto y diseño (18/10/2026)

Bocetos en `docs/img/` (prueba dibujada aparte, no es la app; móvil de 375 × 667 px, datos inventados, iconos aproximados):

| Archivo | Qué enseña |
|---|---|
| `grafico-a-barras.png` | **A · Barras vivas** (recomendada), oscuro: al entrar, al tocar «Salud» (con subcategorías) y al tocar «Supermercado» (sin subcategorías) |
| `grafico-a-barras-claro.png` | A en modo claro: al entrar y al tocar «Otras» |
| `grafico-b-mosaico.png` | **B · Mosaico de fichas**: al entrar y al tocar «Salud» |
| `grafico-c-burbujas.png` | **C · Burbujas**: al entrar y al tocar «Salud» |

## 1. Conclusión

1. **El problema es el cambio de vista, no el color:** hoy, al tocar una categoría con subcategorías, el anillo entero se sustituye por el de sus subcategorías y desaparece el resto. Además hay que mirar el color en el anillo y buscarlo en la leyenda, y luego leer otra vez las mismas categorías en Presupuestos.
2. **Recomendamos A, «Barras vivas»:** una sola lista, de mayor a menor, en la que cada fila dice nombre, importe, % del total y cómo vas de presupuesto, con una barra de su color. Encima, una tira fina con los 6 colores para ver el reparto de un golpe.
3. **Al tocar una fila, se abre ahí mismo** (como un cajón): salen Uñas, Pelo… con sus barras, y el botón «Ver los 6 movimientos». Las demás filas no se mueven de sitio ni desaparecen. «Otras» se abre igual y enseña las categorías que agrupa, cada una con su color.
4. **Gasto y presupuesto en la misma fila:** desaparece la lista aparte de Presupuestos, que hoy repite las mismas categorías. El bloque pasa de unos 800 px (anillo, leyenda y presupuestos) a unos 480 px (estimación).
5. B (mosaico) y C (burbujas) son más llamativas, pero cuesta más comparar tamaños, los nombres no caben en las piezas pequeñas y el presupuesto no encaja bien.

## 2. Las tres alternativas

| | A · Barras vivas | B · Mosaico de fichas | C · Burbujas |
|---|---|---|---|
| Cómo se ve | Tira de 6 colores y una fila por categoría con su barra | Fichas de color, más grandes cuanto más gastas | Burbujas que flotan; el aro de cada una es su presupuesto |
| Leer de un vistazo | **Muy fácil**: todo alineado, nombre e importe siempre enteros | Bien para las grandes; las pequeñas solo enseñan «74 €» | Difícil comparar áreas; los nombres se cortan |
| Al tocar «Salud» | La fila se abre en su sitio; el resto sigue igual | La ficha sube y se parte en Uñas, Pelo…; las demás se encogen debajo | La burbuja crece y salen burbujas pequeñas dentro; las demás se apartan |
| Presupuestos | **Dentro de la fila** (marca en la barra y «de 300 €») | Barra fina dentro de la ficha; la lista aparte se mantiene | Aro alrededor de la burbuja; sin cifras |
| Dedo y móvil pequeño | Filas de unos 52 px a todo el ancho | Fichas pequeñas de unos 45 px | Burbujas pequeñas de unos 45 px y forma redonda |
| Esfuerzo | Bajo-medio | Medio-alto (colocar fichas) | Alto (colocar burbujas y animarlas) |

## 3. Cómo funciona A (para Desarrollo)

| Pieza | Cómo | Microinteracción |
|---|---|---|
| Cabecera de la tarjeta | «1.489 € gastado» grande, chip «↑ 6 % vs sep» y la línea «Llevas 1.424 € de 1.450 € presupuestados · quedan 26 €» | La cifra cuenta hasta su valor (ya existe) |
| Tira de colores | 12 px, 6 trozos separados (5 mayores y «Otras» en gris), colores de `colorCat` | Se llena de izquierda a derecha al verse. Tocar un trozo abre su fila. Con una fila abierta, su trozo engorda y los demás se apagan |
| Filas | Icono del color, nombre e importe arriba; debajo, barra de 7 px y «21 % · de 300 €». Si te pasas: el trozo de más rayado en rojo y «21 % · +12,40 €» en rojo. Sin presupuesto: «8 % · sin presup.» | Las barras crecen una tras otra al verse (0,06 s entre filas). Al pulsar, la fila se hunde un poco (escala 0,98) |
| Escala de las barras | Igual que hoy en Presupuestos: la más larga es la mayor cifra (gasto o presupuesto) | — |
| Abrir una fila | Una sola abierta a la vez. Fondo suave de su color, flecha girada. Con subcategorías: sus barras en el color de la categoría («Sin detalle» apagado). Sin subcategorías: los 3 sitios donde más gastas en ella. En «Otras»: sus categorías con su color | Se abre con muelle (`--ease-spring`, unos 300 ms) y las barras de dentro crecen después. Vibración corta (`sentir`) al abrir |
| Ir a movimientos | Botón «Ver los N movimientos» al final del cajón; tocar una subcategoría abre la Lista filtrada por ella; en «Otras», tocar una categoría abre la suya | Un solo toque desde la fila abierta |
| Cerrar | Tocar la fila abierta otra vez, o abrir otra | El cajón se recoge; la página no salta (se fija el alto mientras dura) |
| Pie | «Ver 4 categorías sin gasto» (las que tienen presupuesto y 0 €) | Como hoy |
| Editar | «Editar presupuestos» en el título del bloque | Abre la hoja de hoy |

Notas:

- Se reutiliza lo que ya hay: grupos de `donutDatos` (5 + «Otras»), partes de `donutPartes`, escala y marcas de `presupuestoFilasHtml`, colores de `colorCat`. Se quitan el anillo (`drawDonut`) y la sección «Presupuestos» aparte.
- Abrir y cerrar no repinta la pantalla entera: solo cambia la fila, para no repetir el parpadeo que ya arreglamos.
- Las categorías con presupuesto que caen dentro de «Otras» enseñan su «de X €» al abrir «Otras».
- Con «reducir movimiento», todo aparece sin animación.
- El bloque «Dónde más gastas» de abajo se puede quitar si se acepta enseñar los sitios dentro de cada fila (pregunta 2).

## 4. Recomendación

**A**, por cuatro motivos:

1. **Se lee sin descifrar:** el nombre, la cifra y la barra van juntos. No hay que emparejar un color con una leyenda.
2. **Nunca pierdes la vista general:** abrir una categoría añade filas debajo de ella; las demás siguen donde estaban.
3. **Una lista en vez de dos:** gasto y presupuesto en la misma fila; la pantalla se acorta casi a la mitad.
4. **Cómodo con una mano:** filas a todo el ancho, fáciles de tocar con el pulgar, y funciona igual en 375 px y en pantallas más estrechas.

Para que siga siendo «juguetona»: la tira de colores que se llena, las barras que crecen en cascada, el cajón con muelle y la vibración al abrir.

## 5. Riesgos

- Quien se ha acostumbrado al anillo lo echará de menos. La tira de colores conserva la idea del reparto.
- Con muchas subcategorías el cajón se alarga: enseñar 5 como mucho y «Ver todas» dentro.
- Hay pruebas que buscan el anillo y textos como «toca el gráfico» o «Todas las categorías» (`tests/test30.js`, `test3.js`, `test45_movimientos.js`, y las que tocan `donutSel`/`donutIr`): habrá que actualizarlas.
- Inicio también usa `renderAnalisisMensual`: revisar que el cambio no rompa Inicio.
- El color fijo de «Regalos» (`#D98C5F`) se acerca al terracota; propongo cambiarlo por otro tono más vivo.

## 6. Preguntas para el dueño

1. **(Bloquea)** ¿Vamos con A, juntando gasto y presupuesto en la misma fila y quitando la lista aparte de «Presupuestos»?
2. En las categorías sin subcategorías (por ejemplo Supermercado), al abrirlas: ¿enseñamos los 3 sitios donde más gastas (y quitamos el bloque «Dónde más gastas» de abajo), o vamos directos a sus movimientos?

## 7. Lo que no hemos podido averiguar o confirmar

- Nada probado en un móvil real: los bocetos son HTML dibujado aparte y capturado con Chromium a 375 × 667 px, con datos inventados.
- Las alturas (unos 800 px hoy y unos 480 px con A) son estimaciones a partir de los bocetos y del documento anterior, no medidas en la app con los mismos datos.
- No hemos probado con el texto grande del sistema ni a 320 px de ancho.
- No sabemos cuántas subcategorías usan de verdad los usuarios: depende de sus datos, que no miramos.
- No hemos vuelto a preguntar a la pareja del dueño qué es lo que no le gustaba exactamente del anillo.

## 8. Fuentes

- Código de la app (`app.js`: `renderAnalisisMensual`, `presupuestoFilasHtml`, `dondeMasHtml`, `colorCat`, `donutDatos`, `donutPartes`, `drawDonut`; `look.css`, bloques «En qué gastas» y «Presupuestos»), consultado el 18/10/2026.
- Opinión del dueño tras usarlo en el móvil, transmitida por Desarrollo, 18/10/2026.
- `docs/02-movimientos.md` (propuesta anterior del Resumen), 17/10/2026.

Para el PDF: poner lado a lado el fotograma 2 de A («Salud» abierta y el resto a la vista) junto a una captura del anillo actual con «Salud» elegida, que solo enseña sus subcategorías.

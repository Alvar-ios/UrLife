# Inversiones, Agenda e iconos de las metas: propuesta de Producto y diseño (24/10/2026)

*Responde al comentario del dueño del 24/10. Solo propuesta: no se ha tocado la app. Las capturas de «hoy» salen de la app publicada con datos de ejemplo (montaje de capturas, 390 px, oscuro). Los bocetos están hechos aparte y **no son la app**.*

| Imagen | Qué enseña |
|---|---|
| `docs/img/inv19-antes.png` | Hoy: la gráfica con Total + 2 activos y los chips de nombres largos |
| `docs/img/inv19-boceto.png` | Propuesta de Inversiones: franjas en «Valor», líneas en «Rentabilidad», «Qué tal va cada uno» y la hoja de un activo |
| `docs/img/agenda19-boceto.png` | Propuesta de Agenda (opción A en 3 pantallas) y las opciones B y C |
| `docs/img/metas19-boceto.png` | Metas hoy y propuestas (oscuro, claro, en pequeño, al 100 %) |

## 1. Conclusión

1. **Inversiones: cada modo, su dibujo.** En «Valor», los activos se pintan como **franjas apiladas**: el borde de arriba *es* el total, así que ya no hay que adivinar cuál es la línea general. En «Rentabilidad», **líneas en %** (las únicas comparables entre un activo de 500 € y otro de 1.500 €), con el Total **grueso y con sombra** y cada línea con su **nombre corto y cifra al final** («BTC +30 %»).
2. **Elegir activos sin chips largos:** píldoras con el **símbolo** (BTC, VGSIF…) y su color, que caben en una fila; la leyenda *es* el selector; si hay más de 4, «Elegir…» abre una hoja con los nombres completos. Al tocar, **solo se redibuja la gráfica**, con una animación corta: nada de repintar la pantalla.
3. **Rentabilidad por activo:** un bloque nuevo, **«Qué tal va cada uno»**, con una barra por activo («Desde que empezaste | Al año»), y en la hoja de cada activo el mismo selector **«Valor | Rentabilidad»**: en % desaparecen los saltos que hoy da la línea cada vez que aportas.
4. **Agenda (recomendada la opción A):** un **botón de calendario fijo arriba**, junto a la lupa, en todas las pestañas, con el número de cosas de hoy; y **un único calendario con dos capas, «Planes y tareas | Dinero»**, que es el mismo en la Agenda y en Movimientos → Calendario. Sin tocar la barra de abajo.
5. **Metas:** mismas 12 formas, otro acabado: **cada meta con su color**, forma «de cristal» (fondo tintado, líquido con ola, reflejo, borde del mismo color), **dentro solo el %** y el nombre debajo, todas del mismo tamaño, y **esa forma sustituye al icono suelto** en el resto de la app.

## 2. Tablas

### 2.1 Qué falla hoy y cómo lo arregla la propuesta

| Tema | Qué falla hoy (visto en la app) | Propuesta |
|---|---|---|
| Inversiones · líneas | En «Valor» los activos comparten escala con el total (3.974 €) y quedan aplastados abajo; el Total es casi igual de fino (2,2 frente a 1,8) | «Valor» = franjas apiladas; «Rentabilidad» = líneas en %, Total de 3,6 px con sombra y relleno |
| Inversiones · qué es cada línea | Solo se sabe por el color del chip | Etiqueta al final de cada línea con nombre corto y cifra; si chocan, se separan |
| Inversiones · elegir | Chips con el nombre entero («Vanguard Global Sto…»), en fila que se desliza | Píldoras con símbolo; «Elegir…» si hay más de 4; la leyenda sirve de selector |
| Inversiones · fluidez | Cada toque repinta toda la pantalla (`invLinea` → `render()`) | Solo cambia el dibujo, con la línea entrando en 0,3 s y la escala moviéndose (ya existe `morphPath`) |
| Inversiones · rentabilidad por activo | Solo hay % en la lista y la gráfica del activo es de valor (salta al aportar) | «Qué tal va cada uno» + «Valor \| Rentabilidad» en la hoja del activo + «Al año» por activo |
| Agenda · acceso | Solo desde «Estos días» (Inicio) y desde Tú | Botón fijo arriba en todas las pestañas, con número de cosas de hoy |
| Agenda · dos calendarios | Movimientos → Calendario (gasto por día) y Agenda → Calendario (puntos, con un filtro «Movimientos» que mezcla) | Un calendario, dos capas; desde Movimientos se abre en «Dinero» |
| Metas · aspecto | Dibujo de alambre todo lila; el nombre dentro choca con las rayas y se corta; el coche se ve pequeño | Color propio, forma rellena «de cristal», % dentro, nombre fuera, mismo tamaño para todas |
| Metas · coherencia | En la hoja y en «Aportar a…» sale otro icono (`metaIcono`) | La forma en pequeño (28–40 px) en todas partes |

### 2.2 Agenda: las tres opciones

| Opción | Qué es | A favor | En contra |
|---|---|---|---|
| **A · Puerta arriba + calendario con capas** (recomendada) | Botón de calendario junto a la lupa; Agenda «Semana \| Calendario»; calendario con «Planes y tareas \| Dinero» | A un toque desde cualquier sitio; acaba la confusión de dos calendarios; no cambia la barra | Un tercer botón redondo arriba; el icono hay que aprenderlo (etiqueta NUEVO) |
| B · Agenda como pestaña | Barra de 6 huecos: Inicio, Movimientos, Agenda, +, Juntos, Dinero | Imposible de perder | En 375 px los textos bajan a ~10 px y «Movimientos» se corta; quien no usa tareas pierde sitio; el calendario sigue repetido |
| C · Todo dentro de Movimientos | El calendario de Movimientos enseña también tareas y planes; la Agenda desaparece | Un solo calendario, cero pestañas | Las tareas no son movimientos: quedan aún más escondidas; la lista de tareas se queda sin casa |

### 2.3 Esfuerzo (estimación de Producto, sin medir)

| Tema | Esfuerzo | ¿Supabase? | ¿Queda «Antes»? |
|---|---|---|---|
| Inversiones (las 4 piezas) | 1,5–2 días | No | Sí, en `VERSIONES.dinero` o una entrada nueva |
| Agenda opción A | 1 día | No | Sí, `VERSIONES.agenda` |
| Metas | 1 día | No (el color va en la configuración; en las compartidas sale del propio identificador de la meta, igual para todos) | Sí, `VERSIONES.dinero` («Formas») |

## 3. Recomendaciones

### 3.1 Inversiones (`inv19-boceto.png`, hoy: `inv19-antes.png`)

- **«Valor» con activos = franjas apiladas.** Cada franja es lo que vale un activo; los no elegidos van juntos en una franja gris «Otros». El borde de arriba es el total, en línea gruesa, con la etiqueta «Total 3.974 €». Así el total nunca se confunde.
- **«Rentabilidad» con activos = líneas en %.** Total en el color de la app, 3,6 px, con sombra y relleno suave; activos a 1,7 px. Etiqueta al final de cada línea («IWDA +12 %»); si dos quedan a menos de 20 px, se separan. Al deslizar el dedo, la cajita de valores enseña todas las líneas del día (ya existe `#invVals`).
- **Nombre corto:** el símbolo que ya llega con el precio (`activo.simbolo`). Si no hay, las primeras letras del nombre (máx. 6). En la lista «Tus activos» el símbolo va bajo el nombre para que se reconozca.
- **Elegir:** el Total siempre está; los activos se encienden y apagan tocando su píldora. Con 4 o menos, todos caben; con más, salen los 4 de más valor y «Elegir…» abre una hoja con nombres completos y casillas. Se mantiene el máximo de 4 líneas a la vez (hay 5 colores).
- **Sin repintar:** al tocar una píldora solo se rehace el dibujo de la gráfica y la leyenda; la línea nueva «se dibuja» en 0,3 s y la escala se mueve suave. Vibración corta (`sentir('tic')`). La pantalla no salta ni pierde el sitio.
- **«Qué tal va cada uno»** (nuevo, bajo la gráfica): una barra por activo, verde a la derecha y roja a la izquierda del 0, con % y € al lado. Selector «Desde que empezaste | Al año». Tocar una barra abre la hoja del activo.
- **Hoja de cada activo:** «Valor | Rentabilidad» como la gráfica general. En % la línea es lo que ha subido el precio desde tu primera compra: los saltos al aportar desaparecen; un punto marca cada compra. Bajo la gráfica, dos cifras: «Ganas 77 € · +5,5 %» (lo de hoy) y **«Al año +9,1 %»** (nuevo, misma cuenta que el total, solo con más de un mes de historia).

### 3.2 Agenda (`agenda19-boceto.png`)

- **Botón de calendario arriba** en Inicio, Movimientos, Juntos, Dinero y Tú, junto a la lupa. Un número pequeño con lo de hoy (tareas + planes). Lleva a la Agenda; dentro, el botón queda marcado.
- **Agenda = «Semana | Calendario».** La lista de la semana es la de hoy.
- **Un solo calendario con dos capas:** «Planes y tareas» (puntos: tareas, planes de Juntos con el color del grupo, cobros y pagos fijos) y «Dinero» (el mapa de gasto por día de Movimientos, con fijos y cobros). Desde la Agenda se abre en «Planes y tareas»; desde Movimientos → Calendario, en «Dinero». Se quita el filtro «Movimientos» del calendario de la Agenda, que hoy mezcla.
- «Estos días» en Inicio sigue igual. El enlace de Tú se puede quitar.

### 3.3 Metas (`metas19-boceto.png`)

- **Color por meta**, de 5: violeta, cielo, turquesa, frambuesa y ámbar (versión oscura en modo claro). Sin rojo, verde ni naranja, que ya significan gasto, ingreso y «vas justo». Se elige solo por orden y se puede cambiar junto a «Su forma».
- **Forma «de cristal»:** fondo del color al 14 %, líquido del color con su ola, un reflejo blanco suave arriba a la izquierda y el borde de 2,2 px del mismo color. Los detalles interiores (rayas de la maleta, puerta…) bajan al 35 % para no competir.
- **Dentro, solo el %** (19 px, blanco con sombra; negro en claro). **El nombre debajo**, entero, en negrita.
- **Mismo tamaño para todas:** cada forma se encaja en el mismo hueco (hoy el coche ocupa la mitad que la casa).
- **Una forma por meta en toda la app:** en la hoja de la meta, «Aportar a…», Inicio, la lupa y Juntos se usa la forma en pequeño (28–40 px) con su color, en vez del icono suelto.
- **Al 100 %:** se llena, el borde brilla un instante y aparece la marca. Es la única celebración.

## 4. Riesgos

- **Tres porcentajes distintos en Inversiones** («+5,5 %» sobre lo que metiste, «+7,9 %» del precio y «al año +9,1 %») pueden liar. Cada uno lleva su frase debajo; si aun así confunde, en la hoja del activo dejamos solo «Ganas» y «Al año».
- **Franjas apiladas con un activo que cae mucho** se ven estrechas, no negativas: está bien para «Valor», pero la pérdida se lee en «Rentabilidad» y en las barras.
- **Activos sin símbolo** (manuales) tendrán nombres cortos peores; puede hacer falta «nombre corto» editable.
- **Agenda:** con «Antes» y la lupa, en 375 px caben justo 3 botones redondos y la foto; no lo hemos medido.
- **Metas con color:** más color en Dinero puede chocar con los colores de las cuentas o las personas si están en la misma vista. Las compartidas tendrían color fijo (no elegible) salvo que Datos añada una columna.
- Todo debe pasar las pruebas de contraste en claro y oscuro y en las 5 paletas.

## 5. Preguntas que debe decidir el dueño

1. **Agenda: ¿opción A (botón arriba + calendario con capas)?** Si vas a usar la Agenda a diario, la B (pestaña) también es razonable. *Bloquea empezar la Agenda.*
2. **Inversiones: ¿franjas apiladas en «Valor»** o prefieres líneas también ahí (con el Total grueso)? *Bloquea empezar Inversiones.*
3. **¿Te vale el símbolo (BTC, VGSIF) como nombre corto**, o quieres poder escribir tú el nombre corto de cada activo?
4. **Metas: ¿un color por meta** o todas en el color de la app (más sobrio, menos alegre)? *Bloquea empezar Metas.*
5. ¿Quitamos el enlace a la Agenda desde Tú cuando exista el botón de arriba?
6. Orden de trabajo propuesto: Inversiones → Agenda → Metas. ¿De acuerdo?

## 6. Lo que no hemos podido averiguar o confirmar

- No lo hemos probado en un móvil real ni medido a 375 px; los bocetos son a 390 px.
- No sabemos cuánta gente además del dueño usa la Agenda (no medimos uso).
- La fluidez de la animación de líneas en móviles lentos no está probada.
- No hemos comprobado el contraste exacto de los 5 colores de meta en modo claro con una herramienta.

## 7. Fuentes

- Código de la app (`app.js`: `evolucionHtml`, `invLineasExtra`, `invLineasChipsHtml`, `invLinea`, `activoVerHtml`, `conRentab`, `xirr`, `FORMAS`, `formaHtml`, `metaIcono`, `juntosObjHtml`, `renderCalendarioV2`, `renderMovCal`, `VERSIONES`; `look.css`: `.fm-*`) y propuestas anteriores (`docs/10-agenda-mas.md`, `docs/15-dinero-ajustes.md`, `docs/16-agenda-compartida-carpetas.md`). Consultado el 24/10/2026.
- Capturas de la app publicada con datos de ejemplo, 24/10/2026.

Para el PDF: las tres imágenes de boceto a lo ancho, una por tema, y al lado de Inversiones la captura de hoy (`inv19-antes.png`) para que se vea el antes y el después.

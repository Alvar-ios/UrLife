# 11 · Auditoría de interfaz (aspecto «Nuevo»)

Producto y Diseño · 22/10/2026 · Revisadas 14 pantallas en claro y oscuro (móvil de 390 px) y 11 capturas extra (375 px, hojas abiertas, Juntos vacío de verdad). Datos inventados. No se ha tocado `app.js` ni `look.css`.

## 1. Conclusión

1. La app ya tiene una línea clara y con carácter (hero violeta, tarjetas blancas, iconos de línea). Lo que falla no es el estilo, sino **pequeñas incoherencias que se suman**: tres formas distintas de marcar «elegido», cuatro cabeceras de mes diferentes, la misma cifra con y sin céntimos, «Oct» con mayúscula, letreros en MAYÚSCULAS sueltos.
2. Hay **un fallo de verdad**: las tareas que vencen **hoy** no salen en «Estos días» de Inicio (solo salen las vencidas y las de mañana en adelante). Con los datos de prueba, «Llamar al casero» (hoy) no aparece.
3. Hay **cuatro errores visuales claros**: la X de Buscar tapa el campo; en móviles de 375 px los botones pequeños del + se salen («Pago de deuda» en 3 líneas, «Importar» pegado al borde); la Agenda se titula «Inicio»; en oscuro, el botón elegido de los selectores (Resumen | Lista | Calendario, Tareas | Calendario, Tema) es **más oscuro** que el fondo y casi no se ve.
4. **Los colores dicen cosas distintas en cada pantalla**: el azul es a la vez «BBVA», «pago fijo», «Cobros y pagos», «Tarea» y la barra de la deuda; la deuda es beige en Inicio, marrón en Movimientos, azul en Dinero y roja en el +. Y hay tonos que tiran a terracota (ocre de «vas justo», coral, marrones de categorías).
5. Quedan **unos 25 emojis en pantallas** donde deberían ir iconos de la app (👥 en selectores, 🏁, 🧾, 🎯, 📈, ✅/⚠️, ✨, 🚀). Se cambian en una tarde.

## 2. Tablas

Capturas: `scratchpad/rig/audit/NN-*-claro|oscuro.png` y las extra `extra-*.png` en la misma carpeta (ver «Fuentes»).

### A) Arreglos pequeños y seguros (hoy mismo, sin cambiar cómo funciona nada)

| # | Pantalla (captura) | Qué está mal | Por qué importa | Arreglo exacto | Esfuerzo |
|---|---|---|---|---|---|
| A1 | Buscar (13, extra-buscar-x) | La X de cerrar se monta encima de la esquina del campo de búsqueda. | Parece roto y es fácil tocar la X sin querer. | `html[data-look="nuevo"] .buscar-campo { margin-right: 48px; }` (o bajar el campo 40 px). Añadir `ic('search')` dentro del campo. | Pequeño |
| A2 | Agenda (08, 09) | El título dice «Inicio» y debajo hay «‹ Inicio». | No sabes dónde estás. | Línea 913: si `S.tab==='inicio'` y la vista es tareas o calendario, título «Agenda». | Pequeño |
| A3 | Agenda, meta, varias (08, extra-meta) | «Vencida el 20 Oct», «Para el 22 Oct», «5 Oct · apartado». | En español los meses van en minúscula; se ve a traducción. | `MESES_ABR` en minúscula (`'ene','feb',…`). Donde se quiera mayúscula ya se usa `.toUpperCase()` (casilla «OCT»). Repasar `fmtDateShort` y `fechaCorta`, que no lo pasan a minúscula. Revisar pruebas que comprueben el texto. | Pequeño |
| A4 | Selectores en oscuro (02, 03, 04, 07, 08) | El botón elegido (`.seg-ind`, #17171B) es más oscuro que el carril (#232329). | En oscuro no se ve qué pestaña está activa. | En los bloques oscuros de `look.css`: `.seg-ind { background: #34343D; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); }`. | Pequeño |
| A5 | + a 375 px (extra-x-mas375) | «Pago de deuda» ocupa 3 líneas, «Gasto fijo» 2; «Traspaso» e «Importar» tocan el borde. | Se ve descuadrado en el móvil más común de gama media. | Botones pequeños en vertical: `.crear-peq .crear-op { flex-direction: column; text-align: center; gap: 6px; padding: 12px 6px; font-size: 13.5px; }`. | Pequeño |
| A6 | + (10) | La fila «Repetir» se corta dentro del margen («Gas…» cortado en seco). | Parece un error, no un carrusel. | `.crear-rep-f { margin: 0 -20px; padding: 0 20px; }` y un degradado suave en el borde derecho. | Pequeño |
| A7 | Emojis en pantallas (código) | 👥 en selectores de destino (líneas 2486, 2805, 3107, 4055, 4718), 🏁 en metas (4198), 🧾 (3154), 🎯 Hito (4855, 4863), 📈 Proyección (4998), ✅/⚠️ (4366, 5886, 6655, 6699, 6714, 8295, 8299), ✨ (7190), 🚀 Novedades (6416), «Conseguida el … 🎉» (4690), ✕ en chips (1202-1205). | Lo pidió el dueño el 19/10. | Cambiar por `ic('users')`, `ic('flag')`, `ic('receipt')`, `ic('chart')`, `ic('checkCircle')`/`ic('alert')`, `ic('sparkle')`, `ic('close')`. Se quedan: emoji de cada meta/deuda (lo elige el usuario), 🎉 del aviso al conseguir una meta y 🙌 del mensaje de WhatsApp. | Pequeño |
| A8 | Inicio · Así vas (01) | «Presupue…» cortado. | Es la única palabra cortada de Inicio. | Línea 3748: `l1: 'En orden'`, `l2: 'presupuestos'`. | Pequeño |
| A9 | Inicio · hero (01) | La leyenda se parte: «Te queda 10 %» queda sola en la 2.ª línea. «+10%» sin espacio, «70 %» con espacio. | Desordenado justo en lo primero que se ve. | Leyenda en rejilla de 2 columnas (`display:grid; grid-template-columns:1fr 1fr`). Siempre «10 %» con espacio fino (como en el resto). | Pequeño |
| A10 | Movimientos · Resumen (02) | «Te queda» sola en la 3.ª fila con un hueco al lado. Misma cifra con distinto redondeo: «183 €» aquí y «182,70 €» en Inicio; «1.297 €» y «1.297,30 €» en la misma pantalla. | Parece que no cuadran las cuentas. | `.kpi-mes .kpi.queda { grid-column: 1 / -1; }`. Mostrar céntimos pequeños en las tarjetas, como en el hero. | Pequeño |
| A11 | Movimientos · Lista (03) | Días con un solo movimiento repiten el importe (cabecera y fila). «Ayer · mié 21» frente a «Martes 20». | Ruido: cada cifra sale dos veces. | Ocultar el total del día si solo hay un movimiento. Escribir «Ayer · miércoles 21». | Pequeño |
| A12 | Iconos (03, 02, 10) | Alquiler y Casa con la misma casita. «Apartar» usa una línea que sube (icono `piggy`), que parece inversión. «Pago de deuda» sale en rojo de gasto (`k-gasto`). | Iconos iguales para cosas distintas y distintos para la misma. | Dos iconos nuevos en `ICONS`: llave (alquiler/hipoteca) y hucha (Apartar). Clase `k-deuda` con `--debt` en el +. | Pequeño |
| A13 | Lista y Resumen (03, 02) | Icono de Alquiler lima sobre fondo lima: casi invisible en claro (también pasa con ámbar). | Contraste bajo. | Solo en claro: `.mov-ic.t-cat { color: color-mix(in srgb, var(--cc) 65%, var(--ink)); }`. | Pequeño |
| A14 | Tú (07, extra-x-tu375) | La fecha de la cabecera se parte en 2 líneas; sale tu avatar arriba estando ya en Tú; las etiquetas NUEVO desalinean las filas y parten «Cuentas y saldos». «Copia de seguridad · .json». | Tú es la pantalla más apretada en 375 px. | En Tú: sin fecha bajo el título y sin avatar arriba. NUEVO como punto violeta de 8 px junto al icono (como en las pestañas). «.json» → «Descargar». Lupa dentro de «Buscar un ajuste». | Pequeño |
| A15 | Letreros en MAYÚSCULAS (10, 14, extra-x-filtros) | «REPETIR», «PASO 1 DE 4», «QUÉ MOVIMIENTOS», «SOLO LOS QUE…». | Rompe el tono: el resto de títulos va en minúscula («Así vas»). | `text-transform: none; letter-spacing: 0;` en esas etiquetas. | Pequeño |
| A16 | Formulario de gasto (11, extra-x-editmov) | Título «Nuevo movimiento» aunque has tocado «Gasto». Flechitas del navegador (▲▼) en el importe. | Genérico; las flechas son de ordenador. | Título según el tipo («Nuevo gasto», «Nuevo ingreso»…). `input[type=number]::-webkit-inner-spin-button, ::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`. | Pequeño |
| A17 | Dinero (06) | «Traspaso» flota en medio entre «Cuentas» y «Editar». «Invertido 0 €» en violeta. «Lo que tienes 1.200,00 €» con céntimos y las fichas sin ellos. «Deudas · quedan 4.140 €» repite la tarjeta. | Descuadres y cifras repetidas. | «Traspaso» y «Editar» juntos a la derecha (12 px entre ellos). 0 € en gris claro. Mismo formato de cifra. Quitar el «quedan…» del título si solo hay una deuda. | Pequeño |
| A18 | Dinero · Metas (extra-x-dinero-abajo) | Colchón dice «Aún sin aportar» con 3.100 € dentro. | Se contradice. | Línea 4121: si ya tiene dinero y no hay aportes apuntados → «Sin fecha · aporta cuando quieras». | Pequeño |
| A19 | Agenda (08, 09) | Bajo «Hoy, jueves 22» pone «Para el 22 Oct». Punto de color a la derecha sin explicar (rojo = alta, violeta = media). En el calendario, el punto rojo del 20 no está en la leyenda; días «Lu Ma Mi» aquí y «L M X» en Movimientos. | Repeticiones y señales sin clave. | No poner fecha en la sección «Hoy». Prioridad solo si es Alta, con `ic('flag')` pequeño. Añadir «Vencidas» a la leyenda. Iniciales «L M X J V S D» en los dos calendarios. | Pequeño |
| A20 | Bienvenida (14) | La barra de pasos empieza a 50 px del margen (hueco del botón Atrás, que no se ve en el paso 1). | Se ve descolocada. | En el paso 1 no reservar el hueco (`display:none` en vez de `visibility:hidden`). | Pequeño |

### B) Mejoras medianas

| # | Pantalla (captura) | Qué está mal | Por qué importa | Arreglo exacto | Esfuerzo |
|---|---|---|---|---|---|
| B1 | **Inicio · Estos días (fallo)** | Las tareas que vencen hoy no aparecen: `estosDiasHtml` mira las vencidas (`< 0`) y de mañana en 7 días (`uAdd(hoy, 1)`). | Lo más urgente del día no se ve en Inicio. | Añadir las tareas pendientes con `fechaLimite === hoy` como fila «Hoy · Tarea», detrás de las vencidas. No cambiar `calEventos` (duplicaría los fijos de hoy). Con prueba. | Pequeño |
| B2 | Inicio a 375×667 (extra-x-inicio-375) | En un iPhone SE/8 la 2.ª fila de «Estos días» queda debajo de la barra: Inicio hace scroll. | Regla de la casa: Inicio sin scroll. | `@media (max-height: 700px)`: hero con menos relleno, «En tus cuentas» en una línea dentro del hero, anillos de 56 px. | Medio |
| B3 | Selección y cabeceras (03, 11, 12, 04, 08, 09) | «Elegido» se pinta de 3 formas: negro macizo (Todos), rojo macizo (Gasto), lavanda con borde (Sin fecha, Filtros). Mes: hero con píldora, «Octubre» gigante, «Octubre 2026» centrado, «Semana del…» con flechas grises. «Octubre» (40 px) es más grande que el título de la pantalla. | Cada pantalla parece de una app distinta. | Un solo estilo de chip elegido: lavanda + borde + texto de acento (el color macizo, solo en botones de acción). Un solo componente de periodo: nombre a la izquierda (24 px), flechas a la derecha con el mismo botón redondo. | Medio |
| B4 | Colores con significado (03, 04, 06, 09, 10) | Azul = BBVA, fijo, «Cobros y pagos», Tarea y barra de deuda. Deuda: beige, marrón, azul y rojo según la pantalla. Fijos: azul en un calendario; cobro verde en uno y azul en otro. | Los colores dejan de servir de pista. | Mapa único: deuda siempre `--debt`; fijos siempre `--bill`; cobros, `--income`. Las cuentas, con una paleta propia que no use los colores con significado (o un anillo en vez de un punto relleno). | Medio |
| B5 | Tonos terracota (06, extra-x-meta) | `--warn` claro (#9A6100) se ve marrón: barra, anillo y caja de «vas justo». Categorías: coral #FF8A65, marrón #A1887F, Regalos #D98C5F, Mascotas #B57A4E. Lima #D4E157 y ámbar #FFCA28 con poco contraste. | Va contra la línea del aspecto «Nuevo». | Barras y anillos de metas siempre en su color. «Vas justo», como píldora `--warn-soft` con `ic('alert')`. Cambiar esos 6 colores por tonos limpios (decide el dueño, ver pregunta 2). | Medio |
| B6 | Editar movimiento (extra-x-editmov) | Importe «7.08» con punto (en España se lee 708). | Error de lectura con dinero. | Campo de texto con `inputmode="decimal"` que muestre «7,08» y lea con `numCampo` (ya entiende comas). Probar en iPhone. | Medio |
| B7 | Lista (03) | Dos lupas en la misma pantalla (cabecera y fila de filtros). Todos los gastos en rojo. | Duplicado; una lista entera en rojo parece una alarma. | Dejar una sola lupa. Gastos en tinta normal con «−», ingresos en verde y apartado en violeta (decide el dueño). | Medio |
| B8 | Agenda (08) | Dos botones «+» violetas a la vista (casilla rápida y botón central). «Próximos 7 días» sin casilla para marcar hecha, a diferencia de las otras filas. | Confunde y obliga a abrir la tarea para completarla. | El botón de la casilla, más pequeño y con `ic('send')`. Misma fila con casilla en todas las secciones. | Medio |
| B9 | Formulario de gasto (11) | Categorías sin icono ni color, con puntitos violetas sin explicar. Pide «Tipo» aunque ya elegiste «Gasto». | No conecta con la lista ni con los filtros (que sí usan colores). | Chips con el icono y el color de la categoría (`colorCat`, `iconoCat`). «Tipo» plegado en un «Cambiar tipo» cuando vienes del +. | Medio |
| B10 | Juntos vacío (extra-x-juntos) | Dos tarjetas: arriba texto alineado a la izquierda sin negrita y abajo centrado. «Invita por WhatsApp» no es un botón. | Primera impresión floja de la función estrella. | Una tarjeta: `ic('users')` grande en círculo de acento, título en negrita «Comparte gastos con quien quieras», dos botones: «Compartir un gasto» y «Crear un grupo». Sin sección «Grupos» vacía. | Medio |
| B11 | Calendario de Movimientos (04) | Día vacío: solo «Sin movimientos este día.». Número del día y cifra con el mismo peso. | Estado vacío pobre; cuesta leer la cifra. | Botón «Apuntar un gasto este día». Día en peso normal y 12 px, cifra en negrita. | Pequeño |
| B12 | Buscar (13) | Atajos sin icono. | Se leen peor y no tienen gracia. | `ic()` en cada atajo (cámara, más, check, usuarios, bandera, gráfico, tarjeta, cartera). | Pequeño |

### C) Ideas grandes para más adelante

| # | Idea | Por qué |
|---|---|---|
| C1 | Repaso de «piezas»: una fila, una cabecera de periodo, un chip y un estado vacío, iguales en toda la app (márgenes de 16 px y filas de 56 px mínimo). | Acaba de raíz con las incoherencias de B3 y A11. |
| C2 | Importe protagonista: cifra grande centrada con teclado numérico propio (coma incluida) al apuntar. | Apuntar con una mano en 2 toques; evita el problema del punto (B6). |
| C3 | Estados vacíos con personalidad para Movimientos, Metas, Deudas, Agenda y Juntos: icono de la app grande, una frase y un botón. | «Sencillo, pero con personalidad» se nota sobre todo cuando no hay datos. |
| C4 | Una prueba automática que haga estas capturas (390 y 375 px, claro y oscuro) y avise de textos cortados o solapados. | Que estos fallos no vuelvan sin que nadie los vea. |
| C5 | Novedades antiguas con iconos de la app en vez de emojis. Quitar «Antes / Barras 1/3 / Camino 1/4» cuando el dueño elija versión. | Coherencia final. |

## 3. Recomendaciones

- Empezar por A1–A7 y B1: son los fallos que se notan o confunden, y todos son pequeños.
- Hacer B3 y B4 juntas: son el «sistema» (cómo se marca lo elegido y qué significa cada color). Si se hace pantalla a pantalla, se vuelve a descuadrar.
- Probar siempre a 375 px y en oscuro: la mitad de los fallos solo salen ahí.

## 4. Riesgos

- Cambiar `MESES_ABR` o los textos puede romper pruebas que comparan frases: hay que pasar las pruebas y actualizar las que toque.
- Cambiar los colores de las categorías (B5) cambia algo a lo que los usuarios ya se han acostumbrado. Mejor hacerlo una vez y avisar en Novedades.
- B6 (campo de importe) afecta a cómo se lee lo que se escribe: necesita pruebas propias y probarlo en un iPhone y un Android de verdad.

## 5. Preguntas que debe decidir el dueño

1. **(Bloquea B7)** En la lista, ¿los gastos siguen en rojo o pasan a tinta normal (solo los ingresos en verde)?
2. **(Bloquea B5)** ¿Cambiamos ya los colores de categoría anaranjados o marrones (coral, marrón, Regalos, Mascotas) y el ocre de «vas justo»? ¿El coral cuenta como «terracota»?
3. En móviles pequeños (B2), ¿qué preferís que se encoja primero: el hero («En tus cuentas» en una línea) o los anillos de «Así vas»?
4. ¿Qué lupa se queda en Movimientos: la de arriba (busca en toda la app) o la de la fila de filtros (solo en movimientos)?

## 6. Lo que no hemos podido averiguar o confirmar

- Nada probado en un móvil real: todo son capturas de Chromium con datos inventados.
- No sabemos si un iPhone muestra «7.08» o «7,08» en el importe (B6).
- No se ha visto Juntos con grupos y deudas, ni la hoja de cada persona ni las Inversiones: no estaban en las capturas.
- El aspecto Clásico no se ha revisado (está oculto).
- No se ha medido el contraste con herramienta; los problemas de contraste son a ojo sobre la captura.
- La barra de la deuda sale vacía en la captura de página completa, pero llena al hacer scroll: es la animación, no un fallo.

## 7. Fuentes

- Capturas de la app (Chromium, 390 px, 2x, claro y oscuro), 22/10/2026: carpeta `scratchpad/rig/audit/` de la sesión (`01-inicio` … `14-bienvenida`, `-claro` / `-oscuro`). Capturas extra del mismo día: `extra-x-inicio-375`, `extra-x-mov375`, `extra-x-tu375`, `extra-x-mas375`, `extra-x-juntos(-o)`, `extra-x-meta`, `extra-x-editmov`, `extra-x-filtros`, `extra-x-dinero-abajo`, `extra-buscar-x`. Son temporales: no están en el repositorio.
- Código revisado el 22/10/2026: `app.js` (líneas citadas en cada fila) y `look.css` (paleta, líneas 16-50 y 158).

Para el PDF: una página de «antes» con 4 recortes marcados en rojo (X de Buscar, + a 375 px, selector en oscuro, «Te queda» suelto) y un mapa de colores con lo que significa cada uno hoy y lo que proponemos.

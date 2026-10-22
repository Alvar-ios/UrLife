# 14 · Inicio y Juntos: lo que pidieron el dueño y Paloma (22/10/2026)

Departamento de Producto y Diseño. Responde a los puntos 4 (Inicio) y 5 (Juntos) de `docs/13-feedback-22-10.md`.
Las capturas «antes» son de la app real con datos inventados. Los bocetos son la app real con la maqueta pintada encima: llevan la etiqueta **PRUEBA · MAQUETA**. No se ha tocado `app.js` ni `look.css`.

## 1. Conclusión

1. **Inicio enseña las cuatro cifras que pedía Paloma sin crecer:** la leyenda de porcentajes de la tarjeta se cambia por casillas con importes: Ingresos · Gastos · Apartado · Invertido (y Deudas solo si ese mes has pagado alguna). Ocupan lo mismo que la leyenda de ahora: Inicio sigue sin scroll en un móvil de 390 × 844.
2. **El fallo de «Ver» y «Cerrar» tiene un arreglo de dos líneas:** el pop-up usa la clase `actions`, que solo tiene estilo dentro de una hoja. Hay que usar `popup-btns`, que ya existe, y añadir un margen. Comprobado con la captura.
3. **«Así vas» se puede personalizar sin tocar Supabase:** cada círculo es «Recomendado» o uno de 9 tipos. Se cambia con un enlace «Cambiar» junto al título y se guarda en `cfg().asiVas`. Cada círculo lleva su icono dentro.
4. **Lo que hacen los demás en Juntos sale como una sola fila en «Estos días»** («3 novedades en Juntos»), contando desde tu última visita (`cfg().vistoJuntos`). Las inversiones solo avisan si se mueven un 3 % y al menos 50 € en una semana.
5. **Juntos cambia el orden y se vuelve más visual:** círculos por persona o grupo arriba, la Actividad justo debajo con lo nuevo marcado, y metas y deudas como formas que se llenan (maleta, casa, tarro, recibo). Al tocarlas se abre una ficha con lo que falta, el ritmo y quién ha aportado. «Tu mes desde la nómina real» es posible, pero tiene riesgos y conviene hacerlo el último.

## 2. Tablas

### Qué cambia, pantalla a pantalla

| Punto | Ahora | Propuesta | Imagen |
|---|---|---|---|
| A1 Cifras del mes | Barra + % (Gastos 70 %…) | Barra + importes: Ingresos, Gastos, Apartado, Invertido (+ Deudas) | `inicio14-antes.png` → `inicio14-boceto.png` |
| A2 «Así vas» | 5 círculos automáticos, sin icono | Icono en cada círculo; «Cambiar» → hoja «Tu "Así vas"» | `inicio14-asivas-elegir.png` |
| A3 Pop-up | «Cerrar» y «Ver» pegados, uno encima del otro | Uno al lado del otro, con 10 px de separación | `inicio14-fallo-ver-cerrar.png` → `inicio14-arreglo-ver-cerrar.png` |
| A4 Avisos | Nada de lo que hacen los demás | 1 fila «N novedades en Juntos» y, si toca, 1 de inversiones | `inicio14-boceto.png` |
| A5 Tu mes | Día fijo (p. ej. el 28) | «Desde que llega mi nómina»: día real y el siguiente como previsto | `inicio14-tumes-nomina.png` |
| B1 Balance | Dos fichas Debes / Te deben + lista | Total + círculos por persona o por grupo | `juntos14-antes.png` → `juntos14-boceto.png` |
| B2 Metas y deudas | Tarjetas de texto con barra | Formas que se llenan + ficha de detalle | `juntos14-meta-detalle.png` |
| B3 Actividad | Al final, sin marcar lo nuevo | 2.º bloque, con «3 nuevas» y un punto en cada una | `juntos14-boceto.png` |

### Catálogo de círculos de «Así vas» (A2)

| Clave en `asiVas` | Texto del círculo (l1 · l2) | Icono `ic()` | Cifra dentro | Al tocar «Ver» |
|---|---|---|---|---|
| `auto` | el que toque | el del recomendado | — | — |
| `gastoMes` | Gasto · vs sep | `arrowUp` / `arrowDown` | +28 % | Resumen del mes |
| `cat:<nombre>` | Casa · llevas | icono de la categoría | 207 € (aro = % del presupuesto, o frente al mes pasado) | Lista filtrada |
| `presu` | En orden · sin pasarte / Casa · te pasas | `checkCircle` / `alert` | ✓ o +40 € | Resumen |
| `dia` | Al día · para gastar | `wallet` | 14 € | Resumen |
| `sinGastos` | días · sin gastos | `calendar` | 9 | Calendario |
| `juntos` | Debes / Te deben · en Juntos | `users` | 40 € | Juntos |
| `inv` | Inversiones · 7 días | `chart` | +2,1 % | Dinero → Inversiones |
| `meta:<id>` | Japón · llevas | `flag` (o la forma de la meta, cuando exista) | 30 % | Ficha de la meta |
| `ahorro` | Ahorras · del mes | `piggy` | 12 % | Lista de Apartado |

### Umbrales y datos guardados (sin migración)

| Dato | Dónde | Valor | Cuándo se escribe |
|---|---|---|---|
| Círculos elegidos | `cfg().asiVas` | 5 textos; vacío = todo `auto` | Al pulsar «Listo» |
| Última visita a Juntos | `cfg().vistoJuntos` | fecha y hora del servidor (la más nueva vista) | Al entrar en Juntos, solo si hay algo más nuevo |
| Aviso de inversiones visto | `cfg().invAvisoVisto` | semana `AAAA-Sww` | Al tocar el aviso |
| Umbral inversiones | constante | ±3 % **y** ±50 € en 7 días | — |
| Tu mes con nómina | `cfg().mesInicio` | `{ modo:'cobro', dia:28, nomina:'c:nomina' }` | En «Tu mes» |
| Espera máxima de la nómina | constante | 7 días | — |

## 3. Propuestas

### A1 · Ingresos, gastos, apartado e invertido en la tarjeta
- **Qué se quita:** la leyenda de porcentajes (`hero-ley`, 2 filas). **Qué queda:** la cifra «Te queda este mes», la barra, «En tus cuentas» y «Previsto fin de mes».
- **Qué entra:** debajo de la barra, una fila de casillas (`hk-cel`): `Ingresos 2.150 €` · `Gastos 1.505 €` · `Apartado 150 €` · `Invertido 100 €` · `Deudas 250 €`. Cada casilla tiene un punto del color de su trozo de barra (Ingresos no lleva punto y su cifra va en verde claro). Ingresos, Gastos, Apartado e Invertido salen siempre, aunque sean 0 €. Deudas solo sale si ese mes hay pagos de deuda.
- **Medidas:** casilla de al menos 40 px de alto y ancho repartido a partes iguales; etiqueta de 11 px (10,5 px por debajo de 380 px de ancho) y cifra de 15 px (14 px). Cifras sin céntimos y redondeadas, como `moneyShort`.
- **Colores sobre el morado:** Gastos en **rojo claro `#FF8A80`** (antes, salmón `#FFB59E`; el dueño quiere los gastos en rojo), Apartado `#CDBBFF`, Invertido `#A98BFF` (de la misma familia que el ahorro), Deudas en beige `#E9D8B8` y lo que queda en `#7FE3B4`.
- **Al tocar una casilla** se abre Movimientos ya filtrado: `irMovs` con `Ingreso`, `_gastos`, `Ahorro`, `Inversión` o `Deuda` y el mes que estás viendo.
- **Probado en maqueta:** con 5 casillas cabe en 390 y en 375 px. En 390 × 844 Inicio sigue sin scroll; en 375 × 667 sigue haciendo scroll, igual que ahora (el dueño dijo que lo dejáramos así).

### A2 · «Así vas» a tu gusto
- **Iconos:** cada círculo lleva su icono de 14 px encima de la cifra, dentro del aro. La cifra baja de 14 a 12,5 px (11 px si es larga). Los iconos salen de la tabla de arriba.
- **Color de aviso:** hoy `.ins-c.aviso` usa el azul de los fijos (`--bill`). Debe usar el naranja **`--warn`**, que es el color de aviso de la app. Se ve en «Debes · en Juntos».
- **Dónde se elige:** un enlace **«Cambiar»** (icono `sliders`) a la derecha del título «Así vas», como «Agenda ›». En el pop-up de cada círculo va además un enlace pequeño, **«Cambiar este círculo»**, debajo de la frase. Nada de mantener pulsado: nadie lo descubre y choca con el desplazamiento lateral de los círculos.
- **La hoja «Tu "Así vas"»:** arriba, los 5 huecos (52 px, el elegido con borde del color de acento; los «Recomendado» con borde discontinuo). Debajo, «Círculo N» y la lista del catálogo: filas de 56 px con icono, nombre, un ejemplo con tus datos y un botón de opción. «Una categoría» y «Una meta» llevan una flecha y abren la lista para elegir cuál. Lo que ya está en otro hueco sale atenuado: «Ya está en el círculo 4». Botones: «Todo recomendado» y «Listo».
- **Cómo se reparte:** los huecos fijos van siempre en su sitio. Los huecos `auto` se llenan en orden con los recomendados de ahora (`insightsDatos`), sin repetir un tipo que ya esté fijo. Hay que añadir a cada dato una clave `k` (`gastoMes`, `sube`, `presu`, `juntos`, `sinGastos`).
- **Un hueco fijo sin datos** no desaparece: sale en gris con «—», y su frase dice «Aún no hay datos para esto este mes».
- **«Al día»:** lo que te queda hoy dividido entre los días que faltan de tu mes. La frase lo deja claro: «Con lo que te queda hoy (144,70 €) y 10 días por delante, salen 14 € al día. No cuenta los pagos fijos que aún no han llegado.» Solo sale en el mes en curso.

### A3 · Arreglo exacto del pop-up
- En `app.js`, dentro de `H.insVer`, cambiar `'<div class="actions">'` por `'<div class="popup-btns">'`. `.popup-btns` ya existe en `app.css` (`display:flex; gap:10px`) y lo usa el pop-up de la cuenta principal.
- En `look.css`, añadir: `html[data-look="nuevo"] .popup-btns { margin-top: var(--sp-4); }`.
- **Por qué fallaba:** `.actions` solo tiene estilo como `.sheet .actions`. Dentro del pop-up, los dos `.btn.block` (con `width:100%`) quedaban uno encima del otro sin ningún espacio.
- Las pruebas `test50` y `test53` no comprueban la clase y deberían seguir pasando. Conviene añadir una que compruebe que en `#popupBackdrop` los dos botones están dentro de `.popup-btns`.

### A4 · Avisos de Juntos y de inversiones
- **Dónde:** una sola fila en «Estos días», siempre la primera. Nada de una tarjeta nueva (haría scroll) ni de un aviso que salta al entrar (se pierde y molesta).
- **Texto:** si hay una sola novedad, el título es la novedad («Carlos apuntó «Hotel Lisboa»») y debajo «Viaje Lisboa · tu parte 120 €». Si hay varias: «3 novedades en Juntos» y debajo «Carlos apuntó «Hotel Lisboa» y 2 más». A la izquierda, hasta 2 caras de las personas (`caraHtml`), una sobre otra. Al tocar se va a Juntos.
- **Qué cuenta como novedad:** que otra persona haya creado un gasto o un pago compartido, una meta o deuda compartida nueva, una aportación a una meta, o que haya cambiado un gasto (`updatedAt` y `editadoPor`). Tus propias acciones nunca cuentan.
- **«Desde tu última visita», sin Supabase:** `cfg().vistoJuntos` guarda la fecha **del servidor** (`createdAt`/`updatedAt`) de lo más nuevo que viste, no la hora del móvil. Así no influye si el reloj del móvil va mal, y solo se guarda cuando hay algo nuevo. Al entrar en Juntos se recuerda el valor anterior (`S._vistoJuntosAntes`) para marcar «Nuevo» en la Actividad mientras estás ahí. La primera vez, si no hay `vistoJuntos`, se guarda sin enseñar nada, para no llenar Inicio de cosas antiguas. Como `cfg()` se sincroniza, el aviso desaparece en todos tus móviles.
- **Inversiones:** la fila «Tus inversiones: +4,2 % esta semana», con debajo «+310 € · valen 7.690 €» e icono `chart`. Sale si en 7 días el valor cambia ±3 % **y** ±50 €. El cálculo se hace con las participaciones de hoy aplicadas a los cierres de hace 7 días (`S.historico`), para que meter dinero no cuente como ganancia. Sale una vez por semana: al tocarla, se guarda `invAvisoVisto`. Si quieres verlo siempre, tienes el círculo `inv`.
- **Orden de «Estos días»:** Juntos → avisos de cobros y pagos pasados → tareas vencidas → lo demás. Se siguen viendo 2 filas y «Ver los N».

### A5 · «Tu mes» desde que llega la nómina de verdad
- **Nueva opción en «Tu mes»:** «Desde que llega mi nómina». Las otras se quedan, con «Desde el día que cobro» renombrada a «Desde un día fijo». Debajo va una tarjeta con el cobro fijo que se usa («Nómina · penúltimo día hábil · Cambiar») y dos líneas: «Octubre empezó el lun 28 sep», con el texto «Ese día llegó tu nómina (1.850 €)», y «Noviembre empezará el jue 29 oct» con la etiqueta **Previsto**. Al final, un aviso: «La fecha siguiente es una previsión. Si tu nómina se retrasa, tu mes no cambia hasta que llegue (como mucho, 7 días). Si se adelanta, empieza ese mismo día.»
- **Hace falta un cobro fijo con regla.** Si no lo tienes, en lugar de la tarjeta sale «Primero añade tu nómina como cobro fijo» y un botón «Añadir cobro fijo» (`openRecurrentes`). No se adivina la nómina por la categoría: otros ingresos podrían confundirla.
- **Cómo se calcula** (detalle en el anexo): para cada fecha de la regla se busca el ingreso que la cubre (`estadoOcurrencias`, como ya hacen los avisos). Si llegó, el mes empieza el día real. Si no llegó y han pasado 7 días o has dicho «No», empieza el día previsto. Mientras esperas, sigue el mes anterior. Las fechas futuras son siempre previsión.
- **Cómo se ve:** la etiqueta del mes dice «Octubre · desde el 28 sep»; mientras esperas, «Octubre · esperando tu nómina». La fila «¿Cobrado?» de «Estos días» ya existe y sirve para confirmarla. Lo previsto se sigue enseñando aparte, nunca como dato real.
- **Compatibilidad:** se guarda `{ modo:'cobro', dia, nomina }`. Una versión antigua de la app no entiende `nomina` y usa el día fijo, así que nada se rompe.
- **Depende de** la regla «penúltimo día hábil» (punto 7 de `docs/13`), que aún no existe. La opción vale con cualquier regla.

### B1 · Juntos: lo que debes y te deben, en círculos
- **Cabecera nueva:** «En tus 2 grupos, todo sumado», y debajo, en 22 px, «**Debes 64 €** · **Te deben 24 €**» (rojo `--expense` y verde `--income`; si solo hay una de las dos, solo esa; si no hay ninguna, «Estás en paz con todos»). Luego un selector **Personas | Grupos**, la fila de círculos y «Compartir un gasto».
- **Círculo de persona** (62 px, igual que «Así vas»): el aro es rojo si le debes y verde si te debe, y se llena en proporción a la mayor cantidad. Dentro, el importe sin céntimos. Abajo a la derecha, su cara de 24 px (`colorPersona`). Debajo, el nombre y «le debes», «te debe» o «en paz». Los que están en paz salen al final, en gris y con un ✓. Si hay más de 8, se desliza de lado. Al tocar se abre la hoja de la persona (`personaVer`), que ya tiene «Saldar» y «Pedir por WhatsApp».
- **Círculo de grupo:** igual, pero con tu saldo en ese grupo y una insignia cuadrada con las iniciales del grupo. Al tocar se abre el grupo (`grupoVer`).
- **Qué se quita:** las fichas Debes / Te deben, que hacían de filtro (`S._juntosFiltro`); la lista «Personas», que repetía lo de los círculos; y la línea «Y N personas en paz». Saldar pasa a costar 2 toques (círculo → Saldar) en lugar de 1. Pregunta 2.

### B2 · Metas y deudas juntos, visuales
- **En el panel:** una fila que se desliza de lado, con tarjetas de 158 px. Cada tarjeta lleva la forma (96 px de alto) llena hasta su % con una onda arriba y el nombre dentro. Debajo: «Viaje Lisboa · 50 %», en 18 px **«Faltan 600 €»** (en deudas, «Quedan 450 €») y el estado en color: verde «Vais bien», naranja `--warn` «Vais un poco justos», rojo «No llegáis a tiempo». Al final de la fila, «+ Nueva» en el título.
- **Formas:** las mismas que se decidan para Dinero (`docs/13`, punto 6), con una sola función para las dos pantallas. Mínimo: tarro (meta por defecto), maleta (viaje, vacaciones, vuelo), casa (casa, piso, entrada, hipoteca, reforma, mueble), coche, escudo (colchón, emergencia, imprevistos) y recibo (deuda por defecto). Se elige sola por el nombre. Las metas se llenan en violeta `--savings` y las deudas en beige `--debt`. El nombre va dentro, en 12 px, con un borde del color del fondo para que se lea; si no cabe, se corta con «…».
- **Ficha al tocar** (hoja, no pantalla nueva): la forma grande (132 px) junto a «Faltan 600 €» en 30 px, «600 € de 1.200 € · 50 %» y «Para el 1 mar 2027 (en 4 meses)».
  - Bloque **Ritmo**: dos casillas, «Necesitáis 141 €/mes» y «Lleváis de media 133 €/mes» (últimos 3 meses), y la frase del estado con lo que falta: «Vais un poco justos: con 8 € más al mes entre todos, llegáis a tiempo». Sin fecha: «A este ritmo llegaríais en marzo de 2027».
  - Bloque **Quién ha aportado**: una fila por persona con su cara, una barra de su color y el importe, y «Y 200 € de antes de la app».
  - Botones: «Editar» y «Aportar» (en deudas, «Apuntar un pago»). En deudas, además: «Pagado 450 € de 900 €», «Cuota necesaria entre todos» y «Tu parte de lo que queda: 150 €» (`miProporcion`).
- Hoy, al tocar una tarjeta se abre directamente el editor (`objEditar`). Con la propuesta se abre la ficha, y el editor está en «Editar».

### B3 · Actividad más arriba
- Va justo debajo de la cabecera, antes de metas y grupos. Son 3 filas; las nuevas desde tu última visita llevan un punto de acento antes del texto y un fondo un poco tintado. El título lleva la etiqueta «3 nuevas». Se añade «Carlos aportó a «Viaje Lisboa»» (las aportaciones a metas no salían).
- Fallo pequeño visto de paso: en la Actividad, tu propia cara sale con una «T» (de «Tú»). Debe usar la inicial de `cfg().nombre`.

### Lo que queda en «Antes»
- **Inicio:** el dueño ya eligió la versión nueva. Propuesta: `VERSIONES.inicio` = [Nueva (con casillas e iconos) | Antes (la de hoy)], y se borra la de antes del 18/10. Las pruebas fijadas a `inicio:1` cambian.
- **Juntos:** `VERSIONES.juntos` = [Círculos | Lista (la de hoy)], y se quita la antigua del 17/10. Las pruebas antiguas con `version:{juntos:1}` hay que revisarlas.
- El arreglo del pop-up (A3) y el color de aviso son arreglos: no van a «Antes».

## 4. Riesgos

- **Tu mes con nómina:** si la nómina se retrasa más de 7 días, al llegar mueve el corte y los gastos de esos días cambian de mes. Los números de un mes ya cerrado pueden cambiar.
- **Tu mes con nómina:** un ingreso que no es la nómina pero se parece (mismo nombre, cerca de la fecha) puede tomarse por ella. Se mitiga usando solo el cobro fijo elegido, y descartando tramos de menos de 20 días o de más de 45.
- **Tu mes con nómina:** los meses no duran lo mismo (de 28 a 35 días), así que comparar «frente al mes pasado» puede engañar un poco. «A estas alturas» ya compara por días y eso lo suaviza.
- **Novedades de Juntos:** lo que otra persona borra no se ve (la tabla no lo devuelve), así que no avisa de borrados. Si `updated_at` no cambia al editar, tampoco avisará de cambios.
- **Inversiones:** si los precios no se actualizan a diario, el aviso semanal puede llegar tarde o no llegar.
- **Quitar la lista «Personas»:** saldar cuesta un toque más y alguien puede no ver al principio que el círculo se toca.
- **Formas:** un nombre largo dentro de la forma puede no leerse. En oscuro, con el borde de color, se lee, pero no se ha medido el contraste.
- **Inicio sin scroll:** queda justo en 390 × 844. Cualquier fila más en la tarjeta lo rompe.

## 5. Preguntas que debe decidir el dueño

1. **Deudas en la tarjeta de Inicio:** ¿una quinta casilla «Deudas» solo los meses que pagas alguna (recomendado) o sumadas dentro de «Gastos»? No bloquea.
2. **Juntos:** ¿quitamos la lista «Personas» y dejamos solo los círculos, de modo que saldar pase a costar 2 toques (recomendado, con «Antes» para comparar)? **Bloquea B1.**
3. **Tu mes con nómina:** si la nómina se retrasa, ¿el mes espera hasta 7 días a que llegue (recomendado) o empieza el día previsto aunque no haya llegado? **Bloquea A5.**
4. **Forma de una meta compartida:** ¿se elige sola por el nombre y cada uno puede cambiarla solo para sí, sin tocar Supabase (recomendado), o la misma para todo el grupo (necesita una columna nueva y pasar por Datos)? No bloquea.
5. **Aviso de inversiones:** ¿os vale avisar a partir de ±3 % y ±50 € en una semana (recomendado)? No bloquea.

**Orden de trabajo recomendado:** A3 (arreglo, ya) → A1 + iconos y color de aviso → B3 + A4 (las dos usan `vistoJuntos`) → B1 → B2 (con las formas de Dinero) → A2 → A5.

## 6. Lo que no hemos podido averiguar o confirmar

- No lo he probado en un móvil real: todo son capturas con Chromium (390 × 844, 375 × 667, claro y oscuro).
- No sé si en Supabase `compartidos.updated_at` cambia al editar un gasto, ni si `objetivo_aportes` tiene fecha de creación: la app solo lee su `fecha` (día). Lo tiene que mirar Datos y Seguridad.
- No sé cada cuánto se actualizan los precios de la tabla `precios` (¿a diario?).
- No he medido el contraste de los nombres dentro de las formas ni de las casillas sobre los 5 colores de paleta de la tarjeta, solo sobre la violeta.
- En 320 px de ancho no lo he comprobado: con 5 casillas podría no caber.
- La regla «penúltimo día hábil» todavía no existe en la app.

## 7. Fuentes

- `docs/13-feedback-22-10.md`, puntos 4, 5 y 6 (consultado el 22/10/2026).
- Código de la app en `main`, leído el 22/10/2026: `heroMesHtmlV2`, `heroBarraHtml`, `insightsDatos`, `insightsHtmlV2`, `H.insVer`, `abrirPopup`, `estosDiasHtml`, `mesCfg`, `mesDe`, `rangoMes`, `ocurrencias`, `estadoOcurrencias`, `renderJuntosV2`, `objStats`, `objCardHtml`, `cargarHistorico`; estilos `.popup-btns` (`app.css`) e `.ins-c`, `.hero-ley` (`look.css`); `data-layer.js` (campos de `compartidos` y `objetivos_compartidos`); `supabase/functions/activos-api/index.ts`.
- Sin fuentes externas.

Para el PDF: poner lado a lado `inicio14-antes.png` y `inicio14-boceto.png`, y `juntos14-antes.png` y `juntos14-boceto.png`. El arreglo del pop-up va en una mini-tira «fallo → arreglo». Para A5, una línea de tiempo de 3 puntos: nómina real 28 sep (✓), hoy 22 oct, prevista 29 oct (discontinua).

---

## Anexo para Desarrollo (detalle técnico)

**A2 · `cfg().asiVas`.** Es un array de 5 textos: `auto`, `gastoMes`, `cat:<nombre>`, `presu`, `dia`, `sinGastos`, `juntos`, `inv`, `meta:<id>` o `ahorro`. Lo que no se entienda cuenta como `auto`. Si la categoría o la meta ya no existe, el hueco vuelve a `auto` sin preguntar. Cada tipo devuelve `{k, tono, icono, valor, l1, l2, aro, frase, a}`, como `insightsDatos`, con un campo `icono` nuevo.

**A4 · `novedadesJuntos()`.**
```
visto = cfg().vistoJuntos
nuevos = compartidos (con grupo) donde
  (createdAt > visto y !esMio(creadoPor))
  o (updatedAt > visto y editadoPor y !esMio(editadoPor))
+ objetivos con createdAt > visto y !esMio(creadoPor)
+ aportes de otros con fecha > día de visto
```
Al entrar en Juntos: `S._vistoJuntosAntes = visto`; `max = la fecha más nueva de todo lo visible`; si `max > visto`, `saveConfig({ vistoJuntos: max })`.

**A5 · `cortesNomina()`.** Se guarda en memoria y se recalcula si cambia `S.movimientos`, `cfg().cobros` o `mesInicio`.
```
rc = cobro fijo con key = mesInicio.nomina   (si no hay → se comporta como 'cobro' con dia)
occs = ocurrencias(rc.regla, primerMov − 40 d, hoy + 70 d)
est  = estadoOcurrencias(rc, occs)
por cada ocurrencia o:
  nombre = mes según la fecha PREVISTA y la regla COBRO_FIN de hoy (estable, uno por ocurrencia)
  corte  = o.mov ? o.mov.fecha
         : (o.estado === 'no' || hoy > o.iso + 7 d) ? o.iso
         : o.iso > hoy ? o.iso (previsto)
         : null (esperando → el tramo anterior sigue)
  si el tramo sale de < 20 o > 45 días → corte = o.iso
```
- `mesDe(iso)`: búsqueda binaria en los cortes.
- `rangoMes(y, m)`: desde = corte de ese nombre; hasta = el corte siguiente − 1 día (si aún no hay corte siguiente, la fecha prevista − 1 y se marca como previsto).
- `mesPillTxt` enseña «esperando tu nómina» cuando el corte de hoy es `null`.
- Pruebas que hacen falta: nómina adelantada, retrasada 3 días, retrasada 9 días, marcada «No», paga extra el mismo día, cambio de año, cambiar de modo y volver, y una versión antigua leyendo la config nueva.

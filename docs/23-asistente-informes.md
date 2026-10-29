# 23 · Informes de cómo vas, y los meses pasados como balance

Producto y Diseño · 29/10/2026 · responde a dos peticiones del dueño del 29/10:

- **A.** Un «asistente financiero» que te cuente en texto cómo vas, cada semana, mes, trimestre, lo que llevas de año o el año, comparando con los informes anteriores.
- **B.** En Movimientos → Resumen, los meses pasados salen como si fueran el presente («Te queda»). Que salgan como **balance**, como el informe del mes.

Bocetos (**prueba, no son la app**; 390 px, datos inventados de una usuaria de ejemplo, fuentes del sistema), en `docs/img/`:

| Boceto | Oscuro | Claro |
|---|---|---|
| Antes · septiembre hoy en la app (captura real con datos de ejemplo) | `23-antes-septiembre-oscuro.png` | — |
| B · Septiembre cerrado en Movimientos → Resumen | `23-balance-mes-oscuro.png` | `23-balance-mes-claro.png` |
| B · Un año cerrado (2025) | `23-balance-anio-oscuro.png` | — |
| A · Pantalla de un informe mensual | `23-informe-mensual-oscuro.png` | `23-informe-mensual-claro.png` |
| A · Aviso en Inicio cuando hay informe nuevo | `23-inicio-aviso-oscuro.png` | — |
| A · Hoja «Informes» (activar, hacer uno ahora, anteriores) | `23-ajustes-oscuro.png` | — |

## 1. Conclusión

1. **B se puede programar ya** (especificación en el apartado 4). Un mes cerrado deja de decir «Te queda» y pasa a **«Balance de septiembre: +213 €»**, con una frase, la barra de a dónde fue el dinero, las cuatro cifras con su cambio frente al mes anterior y un bloque «Frente a agosto» de tres líneas como mucho. El año cerrado, igual: «Balance de 2025» y «Lo destacado».
2. **A: empezar sin IA.** Los informes se hacen en el propio móvil con reglas y frases preparadas: coste cero, ningún dato sale del móvil y **las cifras no se pueden inventar**, porque salen de las mismas cuentas que el resto de la app. La IA puede venir después, solo para redactar, con las cifras ya calculadas y comprobadas.
3. **Quitar «diario».** Con un día hay muy poco que contar, repite lo que ya dice Inicio («Estos días») y, sin avisos en el móvil (la app aún no los manda), nadie lo abriría. Quedan **Semanal, Mensual, Trimestral y Anual**, más un botón **«Hazme uno ahora»** para esta semana, este mes o **lo que llevas de año**.
4. **Dónde vive:** una pantalla «Informes» (desde Tú), una **tarjeta en Inicio** cuando hay uno nuevo, un enlace desde el mes cerrado de Movimientos y, más adelante, una pieza «Último informe» para el Inicio a tu gusto (`docs/21`).
5. **Tono: describe, no juzga ni aconseja.** Nada de «gastas demasiado», nada de comparar con otras personas, nada de recomendar productos. Lo previsto, siempre aparte y con la etiqueta «Previsto». Al pie: «Describe tus números; no es asesoramiento financiero».

## 2. Petición A · Los informes

### 2.1 Qué es un informe

Siempre las mismas piezas y en el mismo orden, para que se lea de un vistazo. Si una pieza no tiene nada que decir, no sale.

| Orden | Pieza | Qué dice | Cuándo no sale |
|---|---|---|---|
| 1 | **En una frase** | El titular: cómo cerró el periodo y frente a qué | Nunca |
| 2 | **Las cifras** | Entró, Gastaste, Apartaste e invertiste, Pagaste de deudas, Balance; cada una con el periodo anterior debajo | «Deudas» si es 0 en los dos periodos |
| 3 | **Lo que cambió** | Hasta 3 líneas: la categoría que más subió, la que más bajó, el día de más gasto, un presupuesto superado | Si nada cambia más de 10 € y 10 % |
| 4 | **Tus metas y deudas** | Lo que aportaste o pagaste y, si hay ritmo, cuándo llegarías | Si no tienes metas ni deudas |
| 5 | **Lo que tienes** | Cuentas + invertido − deudas, y cuánto cambió desde el informe anterior | Si no hay cuentas ni inversiones (y en la tanda 1) |
| 6 | **Previsto** (aparte, con borde de puntos) | Solo en el mes en curso o el siguiente: lo mismo que «Previsto a fin de mes» de Inicio (`previstoMes`) | En semanal, trimestral y anual |
| 7 | **Pie** | «Hecho en tu móvil con lo que has apuntado en la app. Describe tus números; no es asesoramiento financiero.» y «Ver los movimientos» | Nunca |

**Comparación con informes anteriores:** cada informe se compara con el **periodo anterior del mismo tipo** (septiembre con agosto, el T3 con el T2, 2025 con 2024) y, si existe, con **el mismo periodo del año pasado**. Un periodo sin terminar se compara «a estas alturas» (como ya hace el chip de gastos, `compGastoChip`). Si el periodo anterior no tiene apuntes, no se compara y se dice por qué.

**Cómo se cuentan los periodos:**

| Tipo | Periodo | Listo cuando |
|---|---|---|
| Semanal | Lunes a domingo | El lunes |
| Mensual | **Tu mes** (`mesDe` / `rangoMes`, también si empieza el día que cobras) | `todayISO() > rangoMes(y, m).hasta` y sin `previsto` (con nómina, espera a que llegue) |
| Trimestral | Tres de tus meses (enero–marzo, etc., por su nombre) | Cuando cierra el tercero |
| Año en curso | De enero hasta hoy | Siempre, bajo demanda («Hazme uno ahora») |
| Anual | Los doce meses de tu año | Cuando cierra diciembre |

### 2.2 Tono

Lo que pasó con Monzo es el aviso: su resumen del año («Year in Monzo») recibió en marzo de 2026 quejas por un tono que la gente sintió como **avergonzante** (le dijo a una clienta que gastaba «más que la mayoría» en comida a domicilio) y acabó en una reclamación (City AM, 07/03/2026). Y según la CNMV, el asesoramiento en inversión «consiste en ofrecer **recomendaciones personalizadas sobre productos**»: eso no lo hacemos nunca.

| Sí | No |
|---|---|
| «Restaurantes y bares: 180 €, la que más subió (+60 €).» | «Gastas demasiado en restaurantes.» |
| «Te pasaste 40 € de tu presupuesto de Ocio.» (es tu objetivo) | «Deberías gastar menos en ocio.» |
| «A este ritmo llegarías en abril de 2027.» | «Si inviertes en un fondo indexado llegarás antes.» |
| «Previsto: te quedarían unos 380 €. Es una previsión, no un dato.» | «El mes que viene ahorrarás 380 €.» |
| «Septiembre cerró con 213 € a tu favor.» | «¡Mejor que el 80 % de los usuarios!» |
| Celebrar una meta lograda (icono `checkCircle`, como mucho un emoji) | Celebrar o reñir por gastar |

Otras reglas: frases de una línea, cifras redondas (sin céntimos salvo presupuestos), meses en minúscula, nada de jerga («tasa de ahorro» → «apartaste el 11 % de lo que entró»), iconos de la app y no emojis.

### 2.3 Ejemplos de texto (datos inventados)

**Semanal** · lunes 26/10, semana del 19 al 25 de octubre
> **Semana tranquila: gastaste 167 €, 58 € menos que la anterior.**
> Casa se llevó 66 € (el 20, en Ikea). Tuviste 3 días sin gastos.
> En lo que va de octubre llevas 1.297 € gastados, 34 € más que en septiembre a estas alturas.

**Mensual** · septiembre 2026 (es el boceto `23-informe-mensual-*.png`)
> **Septiembre cerró con 213 € a tu favor, después de un agosto en negativo.**
> Entró 1.850 € (igual). Gastaste 1.267 € (24 € menos). Apartaste e invertiste 150 € (en agosto, 350 €). Pagaste 220 € de deudas.
> Casa bajó a 108 € (en agosto, 169 €). Supermercado: 136 €, por debajo de tu presupuesto de 200 €.
> Viaje a Japón: 1.350 de 3.000 €. A este ritmo llegarías en abril de 2027, antes de tu fecha.
> *Previsto* · Octubre: con tu nómina y tus pagos fijos, te quedarían unos 380 € a fin de mes.

**Trimestral** · julio–septiembre 2026
> **El trimestre cerró con 402 € a tu favor: julio +200, agosto −11, septiembre +213.**
> Entraron 5.550 € y gastaste 3.838 €, 210 € menos que de abril a junio.
> Lo que más creció: Casa (+180 € en el trimestre). Lo que más bajó: Restaurantes y bares (−95 €).
> Viaje a Japón avanzó 450 €.

**Lo que llevas de año** · a 29 de octubre de 2026
> **En lo que va de 2026 te han sobrado 1.240 €.**
> Entraron 18.500 € y apartaste e invertiste el 12 %. Octubre aún no ha terminado: cuenta lo apuntado hasta hoy.
> A estas alturas de 2025 llevabas 960 € a tu favor.
> 7 de los 9 meses cerrados fueron a tu favor.

**Anual** · 2025 (como el boceto `23-balance-anio-oscuro.png`)
> **2025 cerró con 980 € a tu favor: 9 de 12 meses en positivo.**
> Apartaste e invertiste el 11 % de lo que entró. Mejor mes: marzo (+420 €). Mes más justo: diciembre (−385 €; Regalos, 410 €).
> Donde más se fue: Vivienda (9.000 €), Supermercado (2.300 €), Restaurantes y bares (1.150 €).
> Lograste tu meta «Colchón» en noviembre.

### 2.4 Dónde vive y cómo se activa

| Sitio | Qué hay | Boceto |
|---|---|---|
| **Pantalla «Informes»** (pantalla completa, como «Ver todo» de Dinero) | Pestañas Semana · Mes · Trimestre · Año, flechas para ir al anterior y el informe entero | `23-informe-mensual-*` |
| **Hoja «Informes»** (desde una fila «Informes» en Tú) | Interruptores por tipo, «Hazme uno ahora» (Esta semana · Este mes · Lo que llevas de año), «Anteriores» con NUEVO en el no leído y «Avisarme en Inicio» | `23-ajustes-oscuro` |
| **Tarjeta en Inicio** | «Tu informe de septiembre · Cerraste con +213 €, mejor que agosto», con › y ×. Usa el mismo hueco que el aviso de invitación de Juntos (`invitacionInicioHtml`): **un solo aviso a la vez**. Se va al abrirlo, al cerrarlo o a los 7 días | `23-inicio-aviso-oscuro` |
| **Movimientos → mes cerrado** | Enlace «Ver el informe de septiembre» en el bloque «Frente a agosto» | `23-balance-mes-*` |
| **Inicio a tu gusto** (`docs/21`) | Pieza «Último informe»: la frase del titular y › | — |

**Por defecto:** Mensual y Anual activados; Semanal y Trimestral apagados (pregunta 2). Sin avisos al móvil: la app no los manda hoy; cuando sea APK se podrá añadir una notificación.

**Dónde se guarda:** en `cfg().informes` (privado, **sin migración**, con `saveConfig`): `{ on: {semana, mes, trimestre, anio}, aviso: true, vistos: {'m:2026-09': fecha}, fotos: {...} }`. El informe **no se guarda**: se calcula al abrirlo con los datos de ese momento, así que si apuntas algo tarde, el informe se corrige solo. Lo único que hay que guardar son las «fotos» de **Lo que tienes** al cerrar cada periodo (la app no guarda su historia; `docs/21` lo confirmó), máximo las 24 últimas. Por eso «Lo que tienes» llega en la tanda 2.

### 2.5 Cómo se genera: sin IA o con IA

| Aspecto | 1 · Reglas en el móvil (recomendado) | 2 · Con IA (función de Supabase) | 3 · Mixto (más adelante) |
|---|---|---|---|
| Coste | 0 € | Céntimos al mes (ver abajo), pero hay que controlarlo con un límite como el de tickets | Como 2, solo si el usuario pulsa |
| Qué sale del móvil | Nada | Las cifras del periodo por categoría, metas y deudas (nunca descripciones, notas ni nombres de Juntos) hacia Supabase y Anthropic | Igual que 2 |
| Cifras inventadas | Imposible: son las de `kpisMes` | **Posible.** Hay que comprobar cada número del texto contra los calculados | Las cifras las pone la app; se descarta el texto si trae un número que no está en la lista |
| Variedad del texto | Algo repetitivo; se alivia con 2–3 versiones de cada frase | Muy natural | Natural |
| Sin conexión | Funciona | No | El texto de reglas siempre está |
| Esfuerzo | Medio (motor de frases + pantalla) | Medio + función nueva + revisión de Datos y seguridad | Alto |

**Coste aproximado con IA:** la función de tickets usa `claude-haiku-5-5` como modelo rápido. Según la prensa (Inside, 08/10/2026; no lo hemos comprobado en la página de Anthropic), cuesta 0,10 $ por millón de palabras-trozo («tokens») de entrada y 0,50 $ por millón de salida. Un informe necesitaría unos 2.500 de entrada (cifras resumidas) y unos 500 de salida: **unos 0,0005 $ por informe**. Con 10 personas y unos 7 informes al mes, menos de 5 céntimos al mes. El coste no es el problema; lo son la privacidad y las cifras inventadas. La tabla `tickets_uso` ya apunta los tokens de cada lectura: Datos y seguridad puede medir el coste real antes de decidir. **No prometer «gratis y sin límites»** en ningún caso.

## 3. Petición B · Un mes pasado como balance

Hoy (`renderMovResumen` → `kpiMesHtml`): septiembre, que ya terminó, enseña las mismas cinco tarjetas que el mes en curso, con «**Te queda** 213 €» resaltada, la tarjeta de ayuda «Así sale "Te queda este mes"» y «Llevas X de Y presupuestados · quedan Z». Todo eso suena a presente. El año pasado sale igual que el año en curso.

Propuesta (bocetos `23-balance-mes-*` y `23-balance-anio-oscuro`):

| Hoy | Mes cerrado |
|---|---|
| 5 tarjetas, «Te queda» resaltada | Tarjeta **«Balance de septiembre»** con «Mes cerrado», **+213 €** grande y una frase |
| — | Barra de a dónde fue lo que entró: Gastos · Apartado · Deudas · **Sobró** |
| Cifras sueltas | 4 celdas en pasado (Entró, Gastaste, Apartaste e invertiste, Pagaste de deudas) con su chip frente al mes anterior |
| Solo el chip «↓ 2 %» de gastos | Bloque **«Frente a agosto»**: 3 líneas como mucho |
| «En qué gastas» / «Llevas … quedan …» | «En qué gast**aste**» / «Gastaste … te sobraron …» |
| Tarjeta de ayuda de «Te queda» | No sale |

## 4. Especificación para Desarrollo (petición B)

1. **Cuándo es «cerrado».** `mesCerrado(y, m)`: `const r = rangoMes(y, m); return !r.previsto && todayISO() > r.hasta;`. Año cerrado: `y < mesActual().y`. Nunca `fecha.slice(0, 7)`. Con «desde que cobro» y nómina, un mes «esperando» **no** está cerrado y se ve como hoy.
2. **`renderMovResumen`.** Si el mes está cerrado (y la versión es la nueva): `balanceMesHtml(y, m)` en lugar de `kpiMesHtml`, sin la tarjeta `_infoTeQueda`, y después `gcResumenHtml(variante)` en pasado. El mes en curso y los meses futuros, **sin cambios**. Nada de «Previsto» en un mes cerrado.
3. **`balanceMesHtml(y, m)`** con `k = kpisMes(y, m)` y `ka = kpisMes(mes anterior)`:
   - Cabecera: icono `checkCircle`, «Balance de {mes}» y la etiqueta «Mes cerrado».
   - Cifra: `k.disponible` con signo (+213 € / −85 €), verde si es positiva, roja si es negativa; 0 → «0 €» en color normal.
   - Frase (una):
     - positivo: «Te sobraron después de gastar, apartar y pagar deudas.»
     - negativo y `facturas + gastos + deuda > ingresos`: «Gastaste más de lo que entró: {X} salieron de lo que ya tenías.»
     - negativo en otro caso: «Apartaste más de lo que te sobraba: {X} salieron de lo que ya tenías.»
     - sin ingresos y con gastos: «No apuntaste ingresos en {mes}.»
     - sin movimientos: «En {mes} no apuntaste nada.» (sin barra, celdas ni comparación).
   - Barra y leyenda: como la de Inicio (`heroBarraHtml`) con la palabra **«Sobró»** en vez de «Te queda»; si el balance es negativo, sin trozo «Sobró».
   - 4 celdas que se tocan igual que hoy (`act('irMovs', …)`). «Pagaste de deudas» solo si hay deuda en uno de los dos meses. Chip frente al mes anterior: «= {mes corto}» si cambia menos del 1 %; flecha y %. Verde/rojo **solo** en Entró (sube = verde) y Gastaste (baja = verde); en las otras dos, gris.
   - **«Frente a {mes anterior}»** (icono `comparar`), solo si el mes anterior tiene movimientos; como mucho 3 líneas, en este orden:
     1. Balance: «Te sobraron {d} más/menos que en {mes}, que cerró en {balance anterior}.»
     2. Gasto: «Gastaste {d} más/menos. Lo que más bajó: {categoría} (−{x}).»
     3. «Lo que más subió: {categoría}, {x} (en {mes}, {y}).»
     Una categoría solo cuenta si cambia **10 € y 10 %** o más. Si nada pasa del umbral, solo la línea 1.
   - Enlace «Ver el informe de {mes}» solo cuando existan los Informes (tanda A1).
4. **`gcResumenHtml` en pasado** (pasar un indicador, p. ej. `cerrado`): título «En qué gastaste»; línea de presupuestos «Gastaste {x} de {y} presupuestados · te sobraron {z}» o «· te pasaste {z}»; vacío: «Sin gastos apuntados en {mes}.»
5. **Año cerrado** (`renderAnalisisAnual('sinNav')` con `y` pasado): las tres tarjetas se cambian por `balanceAnioHtml(y)`: la misma tarjeta de balance («Balance de 2025», «Año cerrado») y **«Lo destacado de {año}»** (icono `sparkle`), hasta 5 líneas: meses a tu favor («9 de 12 meses», contando solo meses con movimientos), % apartado e invertido sobre lo que entró, mejor mes, mes más justo (con su categoría más alta si fue negativo) y la comparación con el año anterior **solo si** ese año tiene los 12 meses con movimientos; si no: «De {año} solo tienes apuntes desde {mes}, así que no comparamos los dos años.» El gráfico de ingresos y gastos se queda; las barras de «Balance de cada mes» del boceto son opcionales (pregunta 5). El año en curso, sin cambios salvo el subtítulo «el año hasta hoy».
6. **Versión anterior en «Antes»:** `VERSIONES.balance` (nueva | antes), como el resto de cambios grandes. Las pruebas antiguas de Movimientos que miren «Te queda» en meses pasados, fijadas a `antes`.
7. **Pruebas** (con fecha fija y datos inventados): mes cerrado → sale «Balance de septiembre» y no salen «Te queda» ni «Previsto»; mes en curso → igual que hoy; balance negativo (las dos frases); mes sin apuntes; mes anterior sin apuntes (no sale «Frente a»); umbral de 10 € y 10 %; «tu mes» desde el día de cobro (un mes que cruza dos meses del calendario) y mes con nómina esperando (no cerrado); año pasado con y sin año anterior completo; 375 px sin cortes en las 4 celdas.
8. **Medir a 375 px** las celdas («Apartaste e invertiste 2.400 €» con chip es la más larga): si no cabe, el chip baja a la línea de la etiqueta.

## 5. Tandas de trabajo

| Tanda | Qué incluye | Esfuerzo (estimación de Producto) |
|---|---|---|
| **B** · ya | Mes y año cerrados como balance (apartado 4) | Bajo-medio |
| **A1** · Informes sin IA | `informeDatos(tipo, clave)` (cifras) + `informeHtml` (frases), pantalla, hoja con interruptores, Mensual y Anual, «Hazme uno ahora», aviso en Inicio, enlace desde Movimientos | Medio |
| **A2** · Más informes | Semanal y Trimestral, «Lo que tienes» con fotos, comparación con el mismo periodo del año pasado, pieza «Último informe» para Inicio | Medio |
| **A3** · IA (si el dueño quiere) | Botón «Contármelo de otra forma» en modo mixto, con límite al mes y revisión previa de Datos y seguridad | Medio-alto |

## 6. Recomendaciones

- **Hacer B primero:** es pequeño, arregla una queja real y deja hechos los cálculos («Frente a», destacados) que luego usan los informes.
- **Una sola fuente de cifras:** `informeDatos` debe usar `kpisMes`, `gastoPorCategoria`, `metasStats`, `deudaStats`, `patrimonio()` y `previstoMes`; nunca sumar por su cuenta. Así el informe nunca contradice a la pantalla.
- **2–3 versiones de cada frase**, elegidas según el periodo (no al azar), para que el mismo informe diga siempre lo mismo.
- **Avisar cuando falten datos:** si un mes tiene muy pocos apuntes (menos de 5), una línea: «Este mes tienes pocos apuntes; puede que falte algo.»
- **Nombre:** «Informes» en pantalla. Evitar «asesor» (suena a servicio regulado) y «asistente» si no conversa.

## 7. Riesgos

- **Tono que hiere** (el caso Monzo). Mitigado con la tabla Sí/No y sin comparar con otras personas; conviene que Calidad lea las frases con ojos frescos.
- **Parecer un asesor regulado** si alguna frase recomienda productos o decisiones de inversión. Las reglas lo prohíben; con IA el riesgo sube.
- **Cifras inventadas** si se usa IA sin comprobar cada número.
- **Informes que cambian:** al calcularse al abrirlos, un apunte tardío cambia un informe ya leído. Es lo correcto, pero puede extrañar.
- **Inicio deja de caber** en móviles pequeños con la tarjeta de aviso. Mitigado usando el mismo hueco que la invitación (un aviso a la vez), sin medir aún a 375 px.
- **Frases repetitivas** con reglas: si cansan, la gente deja de leerlos.

## 8. Preguntas que debe decidir el dueño

1. **(Bloquea B)** ¿Te valen «Balance de septiembre» y «Te sobraron…» / «…salieron de lo que ya tenías»? Alternativas: «Cierre de septiembre», «Resultado».
2. **(Bloquea A1)** ¿Quitamos «diario»? Y por defecto: Mensual y Anual activados; Semanal y Trimestral apagados.
3. **(Bloquea A1)** ¿Empezamos **sin IA** (recomendado) y decidimos la IA cuando veamos si se leen?
4. ¿Nombre «Informes» (recomendado) o prefieres «Asistente»?
5. ¿Aplicamos también en Inicio la palabra «Balance» para meses pasados (hoy dice «Te quedó en septiembre») y las barras de «Balance de cada mes» en el año cerrado?

## 9. Lo que no hemos podido averiguar o confirmar

- **Cómo lo dicen Fintonic, Revolut y Emma:** no pudimos leer sus páginas. De Revolut solo sabemos que tiene una página legal propia para su asistente de IA («Rita disclaimer»); de Emma, que tiene informes semanales (lo dicen sus foros); de Fintonic no hemos encontrado nada sobre informes en texto.
- **El precio de Haiku 5.5** sale de una noticia (Inside, 08/10/2026), no de la página oficial de Anthropic. El coste real hay que medirlo con `tickets_uso`.
- **Qué guarda Anthropic** de lo que se le manda por la función: no lo hemos comprobado; lo tendría que revisar Datos y seguridad antes de la tanda A3.
- **Si una frase concreta cruza la línea del asesoramiento** es una cuestión legal: esto es criterio de Producto, no consejo de un abogado.
- Los bocetos **no se han medido a 375 px** ni con texto grande, y no se han probado en un móvil real. No hay prueba automática de nada de esto: es una propuesta.

## 10. Fuentes

- Código de la app en `main`, consultado el 29/10/2026: `renderMovResumen`, `kpiMesHtml`, `compGastoChip`, `gcResumenHtml`, `renderAnalisisAnual`, `heroHtml`, `mesDe`, `rangoMes`, `kpisMes`, `previstoMes`; `supabase/functions/tickets-ia/index.ts` (modelos y límite de 60 lecturas al mes).
- Capturas de la app con datos de ejemplo (montaje de pruebas de Producto), 29/10/2026.
- CNMV, «Asesoramiento en materia de inversión»: https://www.cnmv.es/Portal/inversor/Asesoramiento (consultado el 29/10/2026).
- City AM, «Monzo slammed for "shaming" end of year reviews», 07/03/2026: https://www.cityam.com/monzo-slammed-for-shaming-end-of-year-reviews/ (consultado el 29/10/2026).
- Inside (Taiwán), precio de Claude Haiku 5.5, 08/10/2026: https://www.inside.com.tw/article/42592-anthropic-claude-haiku-5-5-launch-price-cut-1m-context (consultado el 29/10/2026; prensa, no fuente oficial).
- Revolut, página legal de su asistente: https://www.revolut.com/en-ES/legal/rita-disclaimer/ (existe; contenido no leído). *Interés propio: es de la empresa.*
- Monzo, ayuda «What is the weekly spending report?»: https://monzo.com/help/business-accounts/insights-weekly-spending-report (existe; contenido no leído). *Interés propio.*
- Foro de Emma, «Weekly report comparison examples», 13/08/2021: https://community.emma-app.com/t/weekly-report-comparison-examples/4542 (consultado el 29/10/2026). *Foro de la propia empresa.*

Para el PDF: en la primera página, antes y después de septiembre (`23-antes-septiembre-oscuro.png`, con «Te queda», frente a `23-balance-mes-oscuro.png`); en la segunda, el informe mensual en grande con la tarjeta de Inicio y la hoja como pasos 1 → 2 → 3; la tabla «Sin IA / Con IA / Mixto» como semáforo.

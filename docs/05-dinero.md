# Fase 4 · Dinero: propuesta de Producto y diseño (18/10/2026)

Imágenes en `docs/img/` (móvil de 375 × 667 px, datos inventados). Las «antes» son capturas reales de la app; los bocetos son una **prueba dibujada aparte**, no la app.

| Archivo | Qué enseña |
|---|---|
| `dinero-antes.png` | Al entrar, el patrimonio abierto y las metas, con los problemas numerados como en la tabla 2 |
| `dinero-antes-2.png` | Inversiones, Deudas y las metas en modo claro |
| `dinero-boceto-pestana.png` | **Recomendado:** Dinero de un vistazo, al entrar, al bajar y en modo claro |
| `dinero-boceto-meta.png` | Una meta por dentro, «Aportar» con importes de un toque y «¿Cómo se calcula?» |

## 1. Conclusión

1. **La cifra de arriba no se entiende y, además, está mal:** «Patrimonio 949 €» y, justo debajo, «En tus cuentas 1.659 €», sin decir por qué son distintas. Y lo apartado para metas se suma **dos veces**: ya está dentro del saldo del banco (apartar no saca dinero) y se vuelve a sumar como «Ahorro apartado». En el ejemplo, 5.800 € de más.
2. **Proponemos una sola pantalla «de un vistazo»** en vez de cuatro pestañas: arriba, «Lo que tienes», con sus tres partes (en cuentas, invertido, por pagar) y un «¿Cómo se calcula?»; debajo, Cuentas, Metas, Inversiones y Deudas en filas cortas. El detalle se abre al tocar.
3. **Las metas pasan de tarjetas de 330 a 410 px a filas de unos 64 px**, cada una con su anillo, su emoji y un botón «Aportar» a mano. Todo lo demás (ritmo, hitos, «He usado dinero», «Vincular») se va a la hoja de la meta.
4. **Menos rojo y menos jerga:** hoy 4 de 5 tarjetas dicen en rojo «Al ritmo actual no llegarías a tiempo». Proponemos decir cuánto hace falta («Para abril: 350 €/mes»), en ámbar, y dejar el rojo solo para cuando la fecha ya pasó.
5. **Sin cambios en Supabase.** El emoji de cada meta se guarda en la configuración del usuario.

## 2. Qué falla hoy

Medido en Chromium a 375 × 667 px, oscuro, con 2 cuentas, 3 metas, 2 inversiones y 2 deudas inventadas.

| # | Problema | Medida |
|---|---|---|
| 1 | **Dos cifras grandes y distintas, sin explicar:** «Patrimonio» y «En tus cuentas». La barra de 4 colores no tiene leyenda. «Patrimonio» es una palabra de banco | 949,46 € frente a 1.659,46 € en la misma pantalla |
| 2 | **Lo apartado se suma dos veces.** `patrimonio()` suma el banco (que ya incluye lo apartado, porque `SIGNO_CUENTA` pone apartar a 0) y luego suma otra vez «Ahorro apartado» (movimientos de Apartar y «lo que tenías antes» de cada meta) | +5.800 € de más en el ejemplo. La prueba `test15.js` da por bueno este cálculo |
| 3 | Las pestañas no caben: «Deudas» sale cortada. Llevan la etiqueta NUEVO y 2 puntos de novedad. Con una sola cuenta, «Cuentas» desaparece y se entra en Metas | Fila de 4 pestañas más ancha que 375 px |
| 4 | **Metas muy largas:** el anillo y la barra dicen el mismo %; 3 botones por meta («Aportar», «Vincular», «He usado dinero»). «Vincular» no se entiende | Tarjetas de 329 a 414 px; Metas mide 1.642 px con 3 metas; 18 botones a la vista |
| 5 | **Rojo y jerga:** «Al ritmo actual no llegarías a tiempo» (en rojo), «Cuota necesaria», «Ritmo (últimos 3 meses): 0,00 €/mes» | 4 de 5 tarjetas en rojo (2 metas y 2 deudas) |
| 6 | **Inversiones:** 3 cifras que dicen poco («2 Activos», «7 Aportaciones»); «Por tipo de activo» repite la lista; textos cortados («6 aportacion…», «última…»); la inflación sale suelta al final | 1.108 px |
| 7 | **Deudas:** «Pagado» en verde y grande compite con lo que importa (lo que queda). Cada deuda ocupa 257 px | 1.032 px |
| 8 | Botones pequeños: «Editar», «Plegar» y «Gestionar metas» | 20, 20 y 24 px de alto (lo cómodo es 44) |
| 9 | El patrimonio abierto ocupa 346 px y empuja las pestañas fuera de la vista | Pestañas en el px 484 |

Modo claro: capturado (`dinero-antes-2.png`, 3); se lee bien y tiene los mismos problemas.

## 3. Cómo debe quedar

### 3.1 La pantalla (`dinero-boceto-pestana.png`)

| Bloque | Cómo | Microinteracción |
|---|---|---|
| Lo que tienes | Etiqueta «Lo que tienes» y la cifra grande (cuentas + inversiones − deudas). Debajo, **tres fichas**: «En cuentas», «Invertido» y «Por pagar» (en coral). Una línea: «De tus cuentas, 1.800 € están apartados para tus metas». Botón «¿Cómo se calcula?» | La cifra cuenta hasta su valor (ya existe). Tocar una ficha baja hasta su apartado |
| Cuentas | Una fila por cuenta: icono con su color, nombre, tipo o «1.800 € apartados», saldo. «Traspaso» en el título. Con una sola cuenta, una fila con «Cuadrar» | Tocar abre la hoja de la cuenta de hoy (`cuentaVerHtml`) |
| Metas | Una fila por meta: anillo de 46 px con su emoji dentro, nombre y %, «1.200 de 3.000 €» y una frase corta de estado. A la derecha, **«+ Aportar»**. «+ Nueva» en el título | Los anillos se llenan al verse. Tocar la fila abre la hoja de la meta (3.2) |
| Inversiones | Una línea «Valen hoy 1.412 € · +62 € (+4,6 %)» y una fila por activo con lo que vale y lo que ha ganado. «Ver todo» abre el detalle de hoy (evolución, por tipo, rentabilidad e inflación, juntas) | Si aún no hay precio: «aportaste 1.350 €» y nada de cifras inventadas |
| Deudas | «Quedan 3.250 €» en el título; una fila por deuda con barra de lo pagado (azul, no rojo) y «acabas en mar 2028 ✓» o «para enero: 104 €/mes» | Tocar abre sus pagos (como «Ver pagos») |
| Se quita | Las 4 pestañas, el patrimonio que se abre y se pliega, la etiqueta NUEVO y los puntos, las cifras «Activos» y «Aportaciones», «Por tipo de activo» en la vista principal | — |

**Estado de una meta, en una frase y con color sobrio:** verde si vas bien («Vas bien para abril»), ámbar si vas justo («Para abril: 350 €/mes»), gris si no tiene fecha («A este ritmo, en jun 2027») o si está parada («Sin aportar desde julio»), y rojo solo si la fecha ya pasó. El ámbar es nuevo (hoy el «justo» usa el morado de la app); nada de naranja terracota.

**Usuario nuevo:** en lugar de cifras a cero, tres filas para empezar: «Pon el saldo de tu banco», «Crea tu primera meta» y «Apunta una deuda». La cifra de arriba sale cuando hay al menos una cuenta con saldo.

**Atajos desde Inicio** («Ver metas», inversiones, deudas): abren Dinero y bajan hasta ese apartado.

### 3.2 Una meta por dentro y Aportar (`dinero-boceto-meta.png`)

| Pantalla | Cómo |
|---|---|
| Hoja de la meta | Emoji y nombre; anillo grande con el %, «600 € de 2.500 € · hasta abril de 2027» y «Quedan 1.900 €». **Un solo consejo**, en ámbar si vas justo: «Para llegar en abril: 350 € al mes. Ahora apartas unos 100 €». Botón «+ Aportar»; debajo, «He usado dinero» y «Más» (elegir los movimientos que cuentan, antes «Vincular»; hitos; editar). Al final, las últimas aportaciones |
| Aportar | «Apartar \| Invertir», importe grande y **importes de un toque**: 50, 100, 200 € y «350 € · lo que toca» (lo que hace falta este mes). Vista previa «24 % → 28 % · quedarán 1.800 €», fecha «Hoy» y botón «Aportar 100 €». Una línea: «Apartar no saca dinero del banco: es para que sepas que ese dinero tiene dueño» |
| Al guardar | El anillo se llena hasta el nuevo %, vibra (`sentir('ok')`) y, si cruzas un hito o llegas al 100 %, confeti (ya existe) |
| ¿Cómo se calcula? | La suma línea a línea: «En tus cuentas +6.425,30 €», «Inversiones, lo que valen hoy +1.412,00 €», «Deudas −3.250,00 €», raya y «Lo que tienes 4.587,30 €». Dos avisos: lo apartado ya está dentro de tus cuentas, y lo de Juntos no cuenta hasta que se paga. Es la misma idea que «¿De dónde sale?» en Juntos |

**Emoji de cada meta:** se elige al crearla o editarla (con uno propuesto según el nombre: «viaje» → ✈️, «casa» o «piso» → 🏠, «colchón» → 🛟). Se guarda en `cfg().ahorro[]`, sin migración. Las metas compartidas lo tendrían después, porque necesitaría una columna.

### 3.3 Botón «Antes»

Dejar en `VERSIONES` la pestaña Dinero (nueva | antes) mientras se prueba. El arreglo de la cifra (punto 2) va en las dos versiones, si el dueño lo aprueba.

## 4. Tandas de trabajo

| Tanda | Qué | Esfuerzo | Pruebas que cambian |
|---|---|---|---|
| 1 · Arreglos | No sumar lo apartado dos veces (si se aprueba la pregunta 2) y explicarlo. Botones a 44 px. Quitar NUEVO y los puntos. Textos: «Cuota necesaria» → «Para llegar a tiempo: X €/mes»; rojo solo con la fecha pasada; «Vincular» → «Elegir movimientos» | Bajo | `test15.js` (el patrimonio suma lo apartado), y las que miran el ahorro del patrimonio (`test18.js`, `test26.js`) |
| 2 · De un vistazo | «Lo que tienes» con tres fichas y «¿Cómo se calcula?»; bloques Cuentas, Metas, Inversiones y Deudas; usuario nuevo; atajos que bajan al bloque; versión «Antes» | Medio | Las que usan `setDineroSub` o buscan textos de Dinero (`test53_calidad_versiones.js` y otras) |
| 3 · Metas | Hoja de la meta, «Aportar» con importes de un toque y vista previa, anillo que se llena y confeti; emoji por meta | Medio | Las de metas y aportaciones |
| 4 · Inversiones y deudas | Filas cortas con «Valen hoy»; el detalle (evolución, por tipo, rentabilidad e inflación) en «Ver todo»; deudas con «acabas en…» | Bajo-medio | Las de inversiones y deudas |

Orden recomendado: 1 → 2 → 3 → 4. La tanda 1 se puede publicar sola.

## 5. Riesgos

- **La cifra de «Lo que tienes» bajará** para quien tenga cosas apartadas. Hay que contarlo en las novedades («antes contábamos dos veces lo apartado») para que nadie piense que ha perdido dinero.
- **Quien guarda su ahorro en una cuenta que no ha añadido a la app** verá que lo apartado ya no suma. Solución: en «¿Cómo se calcula?», «¿Tienes el ahorro en otra cuenta? Añádela».
- **Una pantalla más larga** (unos 1,4 pantallazos con el ejemplo) a cambio de no tener pestañas. Con muchas metas, enseñar 4 y «Ver las 7».
- **«Aportar» más a mano** puede llevar a tocarlo sin querer: el botón abre una hoja, nunca guarda directamente.
- **Un color nuevo (ámbar)** para «vas justo»: comprobar que se lee bien en claro y en oscuro, y en todas las paletas.

## 6. Preguntas para el dueño

1. **(Bloquea la tanda 2)** ¿Pasamos Dinero a **una sola pantalla de un vistazo** (Cuentas, Metas, Inversiones y Deudas una debajo de otra, resumidas) en vez de las cuatro pestañas? **Recomendado: sí.** Alternativa: mantener las pestañas y hacer solo las tandas 1 y 3.
2. **(Bloquea la tanda 1)** ¿Dejamos de sumar dos veces lo apartado? «Lo que tienes» sería **cuentas + inversiones − deudas**, y lo apartado se enseñaría como parte de tus cuentas. **Recomendado: sí**, porque hoy la cifra está inflada. La cifra que ven los usuarios bajará.
3. ¿Cambiamos «Patrimonio» por **«Lo que tienes»** y «Deudas pendientes» por **«Por pagar»**? **Recomendado: sí**, se entiende sin saber de finanzas.

## 7. Lo que no hemos podido averiguar o confirmar

- Nada probado en un móvil real: capturas y medidas con Chromium a 375 × 667 px, con datos inventados. No se ha medido con texto grande del sistema ni a 320 px.
- Los bocetos usan otros datos inventados que las capturas (por eso las cifras no coinciden) y fuentes que pueden no ser las de la app.
- No sabemos cuántas metas, inversiones y deudas tienen de verdad los usuarios (no miramos sus datos), ni cuántos tienen el ahorro en una cuenta que no han añadido.
- No hemos comprobado si los cobros y pagos fijos admiten el tipo «Apartar»; el enlace «Apartar 350 € cada mes» del boceto depende de eso. Si no, se deja fuera.
- Las inversiones de las capturas no tienen precio automático (el navegador de pruebas no llega al servidor de precios): no hemos visto la vista con valores de mercado.
- En la captura del patrimonio abierto, la cifra salía a medio contar (949,39 €) si se fotografiaba antes de 2 s; no es un fallo, es la animación.

## 8. Fuentes

- Código de la app (`app.js`: `renderDinero`, `DINERO_SUBS`, `patrimonioMiniHtml`, `patrimonio`, `patrimonioHtml`, `patBarraHtml`, `SIGNO_CUENTA`, `saldoCuenta`, `renderCuentasDinero`, `renderMetas`, `metaCardHtml`, `metaLineasHtml`, `metaAccHtml`, `renderInversiones`, `renderDeudas`, `renderDeudasPersonales`, `deudaStats`, `SEMAFORO_COLOR`; `tests/test15.js`), 18/10/2026.
- `docs/PLAN_CUENTAS.md`, decisión 7: «Apartar no saca dinero de la cuenta».
- Capturas y medidas propias con datos inventados, 18/10/2026.

Para el PDF: poner el patrimonio abierto de `dinero-antes.png` (las dos filas marcadas con el 2) junto a «¿Cómo se calcula?» de `dinero-boceto-meta.png`, y una tarjeta de meta de hoy (unos 400 px) junto a las tres filas de metas del boceto (unos 200 px en total).

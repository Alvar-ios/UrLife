# Fase 4 · Juntos: propuesta de Producto y diseño (18/10/2026)

Imágenes en `docs/img/` (móvil de 375 × 667 px, datos inventados). Las «antes» son capturas reales de la app; los bocetos son una **prueba dibujada aparte**, no la app.

| Archivo | Qué enseña |
|---|---|
| `juntos-antes-pestana.png` | La pestaña hoy, con los problemas numerados como en la tabla 2 |
| `juntos-antes-grupo.png` | Dentro de un grupo («Viaje a Lisboa»): arriba, mitad y final |
| `juntos-antes-gasto.png` | «Compartir un gasto»: el formulario general |
| `juntos-antes-saldar.png` | Saldar con una persona: 35 € en un sitio y 30 € en otro |
| `juntos-boceto-pestana.png` | **Recomendado:** personas primero, con «Saldar» o «Pedir»; bajando, grupos, metas y actividad; modo claro |
| `juntos-boceto-saldar.png` | Hoja de una persona, saldar de un toque, lo que pasa al guardar y «Pedir por WhatsApp» |
| `juntos-boceto-grupo.png` | El grupo con «Gastos \| Saldos» y los ajustes aparte |
| `juntos-boceto-gasto.png` | Gasto compartido en una sola pantalla (grupo, quitar a alguien y pareja con 60/40) |

## 1. Conclusión

1. **Juntos tiene las piezas, pero no responde de un vistazo a «¿con quién tengo cuentas y cómo las cierro?».** La misma persona sale tres veces (balance, «Amigos», «Grupos y personas»), no hay ningún botón «Saldar» a la vista, y la pestaña mide 2.227 px.
2. **Hay una cifra que no cuadra:** arriba pone «Bea, le debes 35 €», pero al tocarla se abre una pantalla que dice «Debes 30 €». Los 5 € del pádel no se ven. Es lo primero que hay que arreglar.
3. **Recomendamos ordenar Juntos por personas:** arriba, dos cifras («Debes 73,70 €» y «Te deben 18,20 €»); debajo, cada persona una sola vez, con todo sumado y su botón: «Saldar» si le debes y «Pedir» (WhatsApp) si te debe. Así se salda en 2 toques.
4. **El grupo solo habla de dinero:** tu deuda arriba con «Saldar», y debajo «Gastos | Saldos». Todo lo de administrar (personas, permisos, reparto, invitar, salir) pasa a «Ajustes del grupo». Hoy, la hoja del grupo mide 2.838 px y tiene 26 botones.
5. **Apuntar un gasto compartido, en una pantalla:** con quién, cuánto, qué fue, quién pagó y para quién (con caras que se tocan). Hoy se abre el formulario general (1.928 px) y lo de compartir empieza en el px 564.

## 2. Qué falla hoy

Medido en Chromium a 375 × 667 px, oscuro, con 3 grupos, 1 persona a solas y 16 gastos inventados.

| # | Problema | Medida |
|---|---|---|
| 1 | Las mismas personas salen 3 veces: balance, fila «Amigos» y lista «Grupos y personas» | Pestaña de 2.227 px; los grupos empiezan en el px 732, fuera de la pantalla |
| 2 | La barra «Debes / Te deben» y la barrita de cada persona repiten las cifras | Tarjeta del balance de 523 px |
| 3 | **No cuadra:** Bea «le debes 35 €» arriba; al tocarla, «Debes 30 € a Bea». Si debes en varios grupos, el toque abre solo el de más importe | Se pierden los 5 € del pádel |
| 4 | No hay ningún botón «Saldar» en la pestaña: hay que adivinar que la fila se toca | — |
| 5 | Lista de grupos: nombres cortados y el importe partido en 2 líneas | «Pádel de los jue…», «Viaje a Lisbo…», «debes 33,70 / €» |
| 6 | Metas y deudas compartidas: tarjetas grandes llenas de texto en la pestaña principal | Unos 280 px cada una, 5 líneas |
| 7 | El color de cada persona cambia según el sitio (va por su puesto en la lista) | Lucía: azul en el balance, verde en el grupo, morada en «Amigos» |
| 8 | La hoja del grupo mezcla las cuentas con la administración. «Volver» fijo abajo además de la X | 2.838 px y 26 botones (Lisboa); 2.649 px (Casa) |
| 9 | En el grupo, tu deuda sale la última, después de las de los demás | «Debes 33,70 € a Marcos» es la 4.ª línea de 4 |
| 10 | Filas de gasto con la categoría como título («Ocio») y no lo que fue («Museo»). En la pestaña destaca tu parte (−42,10 €) y en el grupo el total (84,20 €) | El mismo gasto, dos cifras distintas |
| 11 | «Compartir un gasto» abre el formulario general: Tipo (Ingreso, Inversión…), «Fijo», Categoría y después lo compartido. «Con» ofrece 9 opciones; cada persona del reparto ocupa 71 px | 1.928 px con 5 personas; lo compartido empieza en el px 564. La opción `compArriba` se pasa pero ningún código la usa |
| 12 | Saldar pide 4 cosas (importe, fecha, cuenta y confirmar) para algo que suele ser «ya le hice el Bizum». El importe sale con punto («33.7») | — |
| 13 | Etiquetas NUEVO en «Amigos» y «Miembros» | — |

Modo claro: lo hemos capturado también (no va en las imágenes); misma estructura y mismos problemas, y se lee bien.

## 3. Cómo debe quedar

### 3.1 Pestaña Juntos (`juntos-boceto-pestana.png`)

| Bloque | Cómo | Microinteracción |
|---|---|---|
| Resumen | Una frase pequeña («En tus 3 grupos y con Bea, todo sumado») y **dos fichas**: «Debes 73,70 € · a 3 personas» (coral) y «Te deben 18,20 € · 1 persona» (verde). Botón «+ Compartir un gasto» a todo el ancho | Las cifras cuentan hasta su valor (ya existe). Tocar una ficha deja en la lista solo esas personas |
| Personas | Una fila por persona (sumando grupos y a solas): cara con **su color fijo**, nombre, dónde («a solas y en Pádel»), cifra y botón: «Saldar» o «Pedir» (icono de WhatsApp). Ordenadas por importe. Las que están en paz, en una línea: «Y 1 persona en paz: Ana» | Al pulsar, la fila se hunde un poco. Deslizar la fila a la izquierda también ofrece «Saldar» |
| Grupos | Icono (emoji), nombre entero, caras pequeñas y «5 · 1 sin app»; a la derecha, tu saldo en una línea. «+ Nuevo» en el título | — |
| Metas y deudas juntos | Una línea con barra por cada una («Vacaciones de verano · 800 / 2.000 €», «Casa · 40 % · vais bien»). Al tocar, la hoja de hoy | Barras que crecen al verse (ya existe) |
| Actividad | «Lucía apuntó «Cena japonés» · Casa · hace 3 días · 46 € · tu parte 23 €». 3 filas y «Ver todo» | — |
| Se quita | La barra «Debes / Te deben», las barritas de cada persona, la fila «Amigos», la etiqueta NUEVO | — |

Con los datos de ejemplo caben en la primera pantalla el resumen y 4 personas (hoy, el balance y nada más).

### 3.2 Persona y saldar (`juntos-boceto-saldar.png`)

| Paso | Cómo |
|---|---|
| Tocar a una persona | Hoja con todo lo pendiente con ella: «Le debes 35,00 €», desglose (A solas 30 € · Pádel 5 €), «Saldar 35,00 €», «+ Compartir un gasto con Bea» y lo último que habéis compartido |
| Saldar | Importe ya puesto y grande (con coma); «Desde Banco» y «Hoy» como chips que se cambian si hace falta; cómo queda cada grupo (30 € → 0, 5 € → 0); botón **«Ya le he pagado 35,00 €»**. «Pagar solo una parte» como enlace. Se guarda un pago por grupo, como hoy |
| Al guardar | La cifra baja contando, la fila se pone en verde con «En paz», vibra y se recoge. Aviso «Pagaste 35,00 € a Bea · Deshacer». Si todo queda a cero, el confeti de hoy |
| Si te deben | «Te debe 18,20 €», vista previa del mensaje y botón **«Pedir por WhatsApp»** (abre WhatsApp con el texto; lo mandas tú). Debajo, «Ya me ha pagado» |

Texto propuesto: «¡Hola, Lucía! En PalomApp me sale que de Casa me debes 18,20 € (Mercadona, luz…). Cuando puedas, ¿me haces un Bizum? 🙌».

### 3.3 Dentro de un grupo (`juntos-boceto-grupo.png`)

| Bloque | Cómo |
|---|---|
| Cabecera | Icono, nombre, caras y «5 personas · 1 sin app»; rueda «Ajustes» a la derecha |
| Lo tuyo | Franja de color: «Debes 33,70 € a Marcos» + «Saldar». Si estás en paz: «Estás en paz en este grupo ✓» |
| Gastos | «Entre todos 631 € · Tu parte 129,70 €». Lista por días; cada fila: lo que fue («Museo»), «pagó Marta · tu parte 9 €», y el total. Botón fijo abajo «+ Añadir gasto» (sustituye a «Volver») |
| Saldos | Una barra por persona desde el centro (verde a favor, coral en contra; reutiliza el dibujo de hoy). Debajo, «Para quedar en paz · 4 pagos»: el tuyo primero y resaltado con «Saldar»; los de otros, en gris |
| Ajustes del grupo | Lista: Nombre, Personas (con «Invitarle a la app» y administradores dentro), Invitar por WhatsApp, Reparto habitual, Quién puede cambiar los gastos, Tu nombre aquí. Al final, «Salir del grupo» y «Cerrar el grupo para todos» (solo administradores) |

### 3.4 Gasto compartido rápido (`juntos-boceto-gasto.png`)

| Orden | Campo | Detalle |
|---|---|---|
| 1 | Con | Chips en una fila que se desliza: grupos y personas a solas. Viene elegido el último usado (ya existe `ultimoCompartir`). Las personas sueltas de un grupo pasan a «+ Otra persona» |
| 2 | Importe | Grande, en el centro, con el teclado numérico abierto |
| 3 | ¿Qué fue? | «Cena en el puerto»; a la derecha, la categoría adivinada por las reglas que ya existen, que se cambia de un toque |
| 4 | Pagó | Caras de 42 px; tú marcado de inicio |
| 5 | Para quién | Caras con su parte debajo; tocar una cara la quita o la vuelve a poner y todo se recalcula. «A partes iguales ⌄» abre Iguales / Por % / Por importe. En un grupo con reparto habitual: «Como siempre: 60 / 40» |
| 6 | Resultado | «Tu parte 12,96 € · te deben 51,84 €» |
| 7 | Abajo | Chips «Hoy» y «Banco» y botón «Guardar» |

Se quitan de esta pantalla: Tipo, «Del día a día / Fijo», Detalle y Método de pago (siguen en el formulario general, que se puede abrir desde «Más opciones»). Aportar a una meta compartida y pagar una deuda compartida siguen como hoy («Aportar», «Apuntar un pago»).

### 3.5 Botón «Antes»

Dejar en `VERSIONES` la pestaña Juntos (nueva | antes) y la hoja del grupo (nueva | antes) mientras se prueban. El arreglo del punto 3 (la cifra que no cuadra) va en las dos versiones.

## 4. Mejoras nuevas, por prioridad

| # | Mejora | Qué aporta | Esfuerzo |
|---|---|---|---|
| 1 | **Hoja de persona y «Saldar todo»** (sumando grupos) | Arregla el 35 € / 30 €. Cerrar cuentas con alguien en 2 toques | Bajo-medio. Sin cambios en la base de datos: un pago por grupo |
| 2 | **«Pedir por WhatsApp»** | Cobrar sin la incomodidad de escribirlo. El enlace de WhatsApp ya se usa para invitar | Bajo |
| 3 | **Color fijo por persona** (como `colorCat` en categorías) | Reconocer a cada uno de un vistazo en toda la app | Bajo |
| 4 | **Actividad: quién apuntó qué** | Confianza en pareja y en grupo: ves lo que cambia sin abrir nada. Los datos ya llegan (`creadoPor`, `createdAt`) | Bajo |
| 5 | **Aviso en Inicio cuando una deuda envejece** («Lucía te debe 18,20 € desde hace 2 semanas · Pedir») | Que nada se quede olvidado. Inicio ya tiene una fila de Juntos | Bajo |
| 6 | **Gasto compartido rápido** (3.4) | Apuntar en la mesa del restaurante en segundos | Medio |
| 7 | **Grupo con «Gastos \| Saldos» y Ajustes aparte** (3.3) | El grupo se entiende en una pantalla | Medio |
| 8 | **Pareja: «Este mes en Casa»** (gastado entre los dos, tu parte, frente al mes anterior), con tu mes (`mesDe`) | Juntos como centro de la pareja, no solo como deudas | Medio |
| 9 | **Modo viaje:** fechas, total del viaje, gasto por persona y por categoría, «Cerrar el viaje» cuando todo esté a cero; más tarde, otras monedas | Competir de tú a tú en viajes | Alto. Necesita columnas nuevas en `grupos`: pasar antes por Datos y seguridad |

El icono de cada grupo (emoji) necesita también una columna para que lo vean todos; mientras, se puede elegir solo para uno mismo y guardarlo en su configuración, sin tocar la base de datos.

«Simplificar deudas» ya lo hace la app dentro de cada grupo (`deudasDe`): el que más debe paga al que más le deben. Proponemos **decirlo** («Para quedar en paz · 4 pagos») y **no** mezclar grupos entre sí al calcularlo: cada grupo se cierra por su cuenta y la hoja de la persona solo suma.

### Qué ofrecen Tricount y Splitwise (solo lo comprobado)

| Función | Splitwise (ficha de App Store) | Tricount (blog oficial) | PalomApp hoy |
|---|---|---|---|
| Simplificar deudas | «Simplify debts into the easiest repayment plan» | No comprobado | Sí, por grupo, sin decirlo |
| Pagar o cobrar desde la app | Venmo y PayPal (solo EE. UU.), Paytm (solo India) | «Send payment requests directly through the app» | No; el pago se hace fuera y se apunta |
| Leer tickets | Sí, de pago (Pro): «OCR integration for scanning and itemizing receipts» | No comprobado | Sí, con foto y reparto por artículo |
| Varias monedas | Conversión de monedas, de pago (Pro) | «Multi-currency tracking», con conversión automática | No |
| Tu parte cuenta en tus finanzas | No comprobado | No comprobado | Sí: es lo que nos diferencia |

## 5. Riesgos

- **«Saldar todo» crea varios pagos** (uno por grupo). Si falla a mitad, quedaría a medias: guardar uno a uno, avisar de cuáles se guardaron y ofrecer «Deshacer». Que Calidad lo pruebe con la conexión cortada.
- **Las personas sin cuenta tienen un identificador distinto en cada grupo:** si «Marta» está sin cuenta en dos grupos, saldría dos veces en «Personas». Hay que avisarlo («Marta · Lisboa») hasta que ocupe su sitio.
- **Dos cifras en vez de una** (debes / te deben) puede extrañar a quien se fijaba en el neto. Se compensa porque cada persona dice su cifra.
- **«Pedir» puede sonar a reclamar.** Texto amable, editable en WhatsApp y nunca enviado solo.
- **Ajustes un toque más lejos:** «Invitarle a la app» para las personas sin cuenta debe seguir a mano (en su fila de Saldos y en su hoja).
- **Colores fijos** cambian los colores que la gente ya conoce.
- **Pruebas que comprueban textos de Juntos:** `test17.js` («Grupos y personas», «Saldar cuentas», «Estáis en paz») y `test42_calidad_sin_cuenta.js` («Balance con tus personas», «Últimos gastos y pagos», `juntosPersona`). Habrá que actualizarlas.

## 6. Preguntas para el dueño

1. **(Bloquea)** ¿Ordenamos Juntos por personas (cada una con «Saldar» o «Pedir» al lado) y enseñamos dos cifras, «Debes» y «Te deben», en vez de una sola resta?
2. ¿Separamos el grupo en «Gastos | Saldos» y llevamos la administración (personas, permisos, invitar, salir) a «Ajustes del grupo»?
3. Después, ¿qué va antes: el formulario rápido de gasto compartido o el modo viaje (que necesita cambiar la base de datos)?

## 7. Lo que no hemos podido averiguar o confirmar

- Nada probado en un móvil real: capturas y medidas con Chromium a 375 × 667 px, con datos inventados. En las capturas la fecha sale como «10/18/2026» porque el navegador de pruebas está en inglés; no sabemos cómo se ve en un móvil en español.
- Los bocetos usan otros datos inventados (por ejemplo, Lucía te debe en el boceto y le debes en la captura) y fuentes que pueden no ser las de la app.
- No se ha medido con texto grande del sistema ni a 320 px de ancho.
- No pudimos abrir las webs principales de Splitwise (splitwise.com) ni de Tricount (tricount.com): la petición quedó sin permiso. Lo de la tabla sale de la ficha de Splitwise en App Store y de dos artículos del blog de Tricount. No hemos comprobado si Tricount permite personas sin la app, ni sus precios.
- No hemos comprobado si se puede abrir Bizum desde una web con el importe ya puesto; por eso proponemos WhatsApp.
- No sabemos cuántos grupos y personas tienen de verdad los usuarios (no miramos sus datos).

## 8. Fuentes

- Código de la app (`app.js`: `renderJuntos`, `juntosBalanzaHtml`, `juntosPersonas`, `renderCompartidoDinero`, `grupoHtml`, `cuentasGrupoHtml`, `compRowGrupo`, `personaHtml`, `saldarHtml`, `compFieldHtml`, `compRepartoHtml`, `deudasDe`, `saldosDe`, `avatarHtml`, `crearIr`, `juntosPersona`; `look.css`, bloque `.jb`), 18/10/2026.
- Capturas y medidas propias con datos inventados, 18/10/2026.
- Splitwise, ficha en App Store: https://apps.apple.com/app/splitwise-bill-splitter/id458023433 (consultada el 18/10/2026; texto del propio fabricante).
- Tricount, blog oficial: https://tricount.com/blog/tricount-the-ultimate-travel-expense-tracker y https://tricount.com/blog/5-essential-tips-for-smooth-worry-free-group-travel-with-tricount (consultados el 18/10/2026; textos promocionales de la propia empresa).

Para el PDF: poner `juntos-antes-saldar.png` (35 € frente a 30 €) junto a la hoja de Bea de `juntos-boceto-saldar.png`, y la pestaña de hoy junto a la del boceto, marcando el «Saldar» que ahora se ve.

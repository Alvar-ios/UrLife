# 29 · Viajes con otra moneda: propuesta de Producto y diseño (31/10/2026)

*Fase 6 de `docs/ROADMAP.md`. El dueño decidió hacerlo el 18/10. Sin bocetos en imagen: el «Para el PDF» del final dice qué dibujar. Ejemplos con datos inventados.*

## 1. Conclusión

1. **Las cuentas del grupo siguen siempre en euros.** Cada gasto en otra moneda guarda además lo que se pagó de verdad («120,00 $») y el cambio que se usó. Saldos, «Saldar», «Tu mes» y la copia del banco de quien pagó se quedan en euros, como hoy. Así no cambia ninguna cuenta que ya funciona y nadie tiene que pensar en dos monedas.
2. **El cambio se pone solo** (el del Banco Central Europeo del día del gasto, el mismo que ya usa la app para las inversiones) **y se puede corregir**: «Te cobraron 112,40 €» con lo que diga el banco. Una vez guardado, el cambio **no se mueve**: los saldos no bailan de un día para otro.
3. **El viaje ya casi existe: son los «Temas».** Un tema con avión, fechas, total, «Tu parte», «Quién pagó qué» y «Cerrar tema». Proponemos darle una **moneda del viaje**: al apuntar un gasto en ese tema, el importe sale ya en dólares. Un grupo hecho solo para el viaje también puede tener su moneda.
4. **En la base de datos basta con añadir columnas vacías**, y la regla que exige que el reparto cuadre (`validar_compartido`) **no se toca**: el reparto sigue en euros y sigue cuadrando con el importe en euros. Solo hay que retocar el disparador del historial para que también apunte la moneda.
5. **Se puede empezar sin tocar la base de datos:** una tanda 0 con «¿Pagaste en otra moneda?» que convierte y guarda en euros, y el tema del viaje mejorado. Lo que no hace la tanda 0 es recordar los 120 $ originales.

## 2. Cómo se ve y funciona

### 2.1 Dónde vive la moneda

| Sitio | Qué se elige | Para qué |
|---|---|---|
| **Tema de viaje** (recomendado) | Al crear o editar un tema: «Moneda del viaje · Euros · Dólar $ · Libra £ · Otra…». Solo se ofrece arriba si el icono es el avión; en los demás, en «Más» | Los gastos de ese tema salen ya en esa moneda. El grupo de pareja o de amigos puede tener «Nueva York» en dólares y el resto en euros |
| **Grupo** (si se creó solo para el viaje) | En «Ajustes del grupo» → «Moneda del viaje» | Igual, para todos los gastos del grupo |
| **Cada gasto** | Un chip junto al importe: «€» o «$» | Siempre se puede cambiar en un gasto suelto (el taxi pagado en euros en Barajas) |

Orden para elegir la moneda de un gasto nuevo: la del tema elegido; si no hay, la del grupo; si no, euros. Siempre dice por qué: «En dólares porque es del tema Nueva York · Cambiar».

### 2.2 Apuntar un gasto en otra moneda (en «Compartir un gasto», `compRapidoHtml`)

| Paso | Cómo se ve |
|---|---|
| 1. Con quién y tema | Como hoy. Al elegir «Nueva York» (o salir sola por fechas), el chip del importe cambia a «$» con una animación corta |
| 2. Importe | Grande, en la moneda del viaje: **120,00 $**. Debajo, en pequeño y en vivo: «= 111,00 € · 1 € = 1,0811 $ · BCE 30/10». Se toca para cambiarlo |
| 3. Para quién | Las partes de cada uno salen en euros («27,75 €») y, debajo, en gris, «30,00 $». El reparto por importe se escribe en la moneda del gasto |
| 4. Guardar | Como hoy. Se guarda en euros y, aparte, «120,00 $ al 1,0811» |

Al tocar la línea del cambio se abre una hoja pequeña con dos maneras, la que te sea más fácil:
- **«1 € = [1,0811] $»** (el cambio a mano), o
- **«Te cobraron [112,40] €»** (lo que dice el banco o la tarjeta; la app calcula el cambio, 1,0676).
- Y «Volver al del BCE».

Si el ticket se lee con la cámara y viene en otra moneda (la lectura de tickets ya devuelve la moneda), el gasto sale en esa moneda sin tocar nada.

Monedas con 0 decimales (yen): «4.800 ¥ = 29,57 €».

### 2.3 De dónde sale el cambio

| Caso | Qué hace la app |
|---|---|
| Normal | El cambio del **Banco Central Europeo** del día del gasto. Ya lo descarga la función de precios (`activos-api`, tabla `divisas`) para las inversiones; hace falta una acción nueva «cambio» en esa función. Es gratis |
| Gasto de hoy o de fin de semana | El BCE publica una vez al día, en días laborables. Se usa el último que haya (la función ya busca hasta 10 días atrás) y lo dice: «BCE del viernes 30/10» |
| Sin conexión | El último cambio que usaste para esa moneda (guardado en el móvil) y el aviso «Cambio de hace 2 días». Si no hay ninguno, se pide a mano |
| Moneda que no da el BCE | Se pide a mano, con la frase «El Banco Central Europeo no publica el cambio del dírham. Escribe el que te den o lo que te cobraron en euros» |

Quien puede cambiar el gasto puede cambiar su cambio (la misma regla de hoy: «quién puede cambiar los gastos»).

### 2.4 Saldos y «Saldar»

- **Saldos siempre en euros**, como hoy. Es lo que se paga después con Bizum.
- En un grupo o tema con moneda, la línea «Gastos» dice «Entre todos 1.240,50 € · 1.180,00 $ pagados en dólares».
- **«Saldar» en euros** al principio. Más adelante (tanda 3), un enlace «Le pagué en dólares» para quien salda en efectivo durante el viaje: escribes «50 $», se convierte con el cambio de ese día y se guarda como pago en euros con su original.
- No hay saldos por moneda (ver §6).

### 2.5 Total del viaje y «Cerrar el viaje»

La hoja del tema (`temaResumenHtml`) ya da «Gastado entre los dos», «Tu parte», «Quién pagó qué» y «En qué se fue». Añadir:
- **Por día:** «Unos 155 € al día · 8 días» (si el tema tiene fechas).
- **En la moneda del viaje:** «De ello, 1.180,00 $».
- **«Cerrar el viaje»** en lugar de «Cerrar tema» cuando el tema tiene moneda o el icono del avión. Antes de cerrar, una hoja: «Cómo quedó el viaje» (total, tu parte, por día) y, si quedan cuentas en el grupo, «Aún hay 2 pagos para quedar en paz · Ver saldos». Al cerrar, la moneda deja de proponerse y, si todo está a cero, el confeti de hoy (`sentir('ok')`).
- Si el viaje es un **grupo entero**, «Cerrar el viaje» lleva al «Cerrar el grupo para todos» que ya existe (solo administradores), y solo se ofrece con todo a cero.

Recordatorio de `docs/16`: las deudas no se saldan por tema, sino por grupo. Lo mantenemos; la hoja lo dice con un enlace a «Saldos».

### 2.6 «Tu mes» y la copia personal de quien pagó

| Qué | Cómo queda |
|---|---|
| Tu parte | Cuenta en euros, en el mes del gasto (`mesDe(fecha)`), como cualquier gasto compartido |
| Copia del banco de quien pagó | Un movimiento en euros (111,00 €) enlazado al gasto, como hoy. En Movimientos, debajo, en gris: «120,00 $». No necesita columnas en `movimientos`: lo lee del gasto compartido |
| Si el banco cobró otra cifra | Quien pagó pone «Te cobraron 112,40 €» en el gasto: cambian el gasto, su copia y la parte de todos (unos céntimos cada uno). Ver pregunta 2 |
| Gastos tuyos solos en otra moneda | Tanda 0: la misma calculadora en el formulario normal (guarda en euros). Guardar el original ahí necesitaría columnas en `movimientos`: más adelante |

### 2.7 Qué cambia en el historial

| Qué pasó | Frase |
|---|---|
| Apuntó | «Ana apuntó «Cena en Brooklyn»» · 120,00 $ (111,00 €) · tu parte 27,75 € |
| Cambió el cambio | «Ana cambió «Cena en Brooklyn»» · ~~111,00 €~~ → **112,40 €** · «lo que cobró el banco» |
| Cambió la moneda | «Bea cambió «Taxi»» · ~~45,00 $~~ → **45,00 €** |

Para esto el disparador del historial tiene que vigilar también la moneda y el cambio (§4.4). Sin ese retoque, el historial seguiría apuntando el cambio en euros (si cambia el cambio, cambia el importe en euros), pero no enseñaría los dólares.

### 2.8 Textos e iconos

- Iconos de la app: `moneda` en el chip y en «Moneda del viaje», `plane` en el tema, `swap` en la línea del cambio, `checkCircle` en «Cerrar el viaje». Sin emojis.
- Palabras: «moneda del viaje», «cambio», «Te cobraron», «Cerrar el viaje». Se mantienen «Saldar», «Tu parte», «Aportar».
- Botones y chips de 40 px como mínimo; el chip de moneda al lado del importe, alcanzable con el pulgar. Comprobar a 375 px que «120,00 $ = 111,00 €» cabe en una línea; si no, el euro baja a la segunda.

## 3. Cómo lo hacen otros (solo lo comprobado)

| | Tricount | Settle Up | Splitwise | PalomApp (propuesta) |
|---|---|---|---|---|
| Moneda principal | La que eliges al crear el tricount es la de por defecto [T1] | Hay una moneda del grupo [U1] | No comprobado | Euros siempre; moneda del viaje por tema o grupo |
| De dónde sale el cambio | Del mercado, se actualiza solo una vez al día [T1] | Se descarga solo de un servicio de Yahoo [U1] | Conversión con Open Exchange Rates, **de pago (Pro)** [S1] | BCE del día del gasto, gratis |
| Cambiarlo a mano | Sí; se puede aplicar a los gastos futuros [T1] | Sí, el cambio o la cifra en la moneda del grupo [U1] | No comprobado | Sí: cambio o «Te cobraron … €» |
| Un cambio para todo el viaje | Aplicar el cambio a gastos futuros [T1] | Sí: «use one exchange rate for the whole vacation» [U1] | No comprobado | No al principio (§6) |
| Saldos | En la moneda por defecto [T1] | No comprobado | No comprobado | En euros |
| Apuntar en otra moneda | Sí [T1][T2] | Sí [U1] | Sí, gratis, en más de 100 monedas [S1] | Sí, gratis |

Lo que más nos sirve: convertir es **gratis** en Tricount y de pago en Splitwise, y los dos rivales que convierten dejan corregir el cambio. Dejar corregirlo con «lo que te cobró el banco» no lo hemos visto en ninguno.

## 4. Borrador del modelo de datos — **para revisar por Datos y Seguridad**

*No se ha aplicado nada. Todo es aditivo salvo el punto 4, que reemplaza una función que ya existe (con copia antes, como el 30/10).*

1. **`compartidos`, columnas nuevas, todas opcionales y vacías en lo que ya existe:**
   - `moneda_original` text (código de 3 letras: «USD»). Vacía = el gasto se hizo en euros.
   - `importe_original` numeric (120,00).
   - `cambio` numeric (unidades de esa moneda por 1 €, como lo publica el BCE: 1,0811).
   - `cambio_fecha` date y `cambio_origen` text ('bce' | 'mano' | 'banco'): solo para la línea «BCE 30/10» o «lo que cobró el banco». Prescindibles si se quiere ir a lo mínimo.
   - `importe` y `reparto` **siguen en euros**. Por eso `validar_compartido` («el reparto cuadra con `importe`») **no cambia**.
2. **Una regla de comprobación nueva (aditiva, `check` en la tabla)**: las tres primeras van juntas o vacías; moneda de 3 letras mayúsculas y distinta de EUR; importe original y cambio mayores que 0; y que `importe_original / cambio` dé `importe` con 1 céntimo de margen. Así nadie guarda «120 $ = 5 €» saltándose la app. A decidir por Datos si basta un `check` o mejor un disparador aparte (sin tocar `validar_compartido`). Vale también para los pagos («Liquidación») de la tanda 3.
3. **`grupos.moneda` y `grupo_carpetas.moneda`** (text, opcional, 3 letras): la moneda del viaje. Datos debe mirar quién puede cambiarlas (en `grupos`, como el reparto habitual; en temas, `puede_editar_compartido`) y que `validar_carpeta` no las borre o rechace al editar.
4. **Disparador del historial (`registrar_historial_compartido`), NO aditivo:** añadir `moneda_original`, `importe_original` y `cambio` a la lista de campos vigilados. Es cambiar una línea; con copia en `supabase/migrations/copias/`. `historial_grupo` no necesita cambio: la moneda llega dentro de `antes` y `despues`.
5. **La app** (para Desarrollo): `copiaComp` (Deshacer) y `compSinCambios` deben incluir los campos nuevos; `data-layer.js` los convertirá a `monedaOriginal`, `importeOriginal`… y **no se pueden mandar antes de que existan las columnas** (si no, guardar falla). «Recuperar» no se ve afectado: devuelve la misma fila.
6. **Función `activos-api`, acción nueva «cambio»** (`moneda`, `fecha` → cambio y fecha del BCE). No es base de datos, pero se publica en Supabase: Datos revisa que pida sesión, como las demás. Su lista de monedas (22) puede ampliarse con otras que publique el BCE.

## 5. Tandas

| Tanda | Qué | Base de datos | Esfuerzo |
|---|---|---|---|
| 0 | «¿Pagaste en otra moneda?» en compartir y en el gasto normal: escribes 120 $, sale el cambio del BCE (o a mano) y **se guarda en euros**, sin recordar el original. Tema de viaje: «por día» y «Cerrar el viaje» con el aviso de saldos | **Nada** (solo la acción «cambio» en la función de precios) | Bajo-medio |
| 1 | Columnas y regla de §4.1-4.3. Se guarda el original; «120,00 $» en filas, tema, copia del banco; moneda del viaje en tema y grupo; el ticket en otra moneda ya la trae; «Te cobraron … €» | Migración aditiva | Medio |
| 2 | Historial con moneda (§4.4) | Reemplazar el disparador del historial | Bajo |
| 3 | «Le pagué en dólares» al saldar; un cambio fijo para todo el viaje si se pide; original en gastos personales (columnas en `movimientos`) | Aditiva, si se hace | Medio |

La 1 y la 2 pueden ir en la misma migración, pero el ROADMAP pide una semana de uso entre cambios de base de datos: el historial se publicó el 30/10.

## 6. Alternativas descartadas

| Idea | Por qué no |
|---|---|
| **Guardar el gasto en dólares y repartir en dólares** (y convertir al mostrar) | Habría que cambiar `validar_compartido`, los saldos, «¿De dónde sale?», Saldar y «Tu mes». Mucho riesgo para lo mismo |
| **Saldos separados por moneda** («le debes 40 $ y 12 €») | Obliga a pensar en dos cifras; al final todos pagan con Bizum en euros |
| **Recalcular con el cambio de hoy** | Los saldos se moverían solos. Va contra la confianza de la fase 5 |
| **Grupos con otra moneda base** (todo en pesos) | Nuestros usuarios llevan su dinero en euros. Para cuando la app salga fuera (como la moneda por cuenta en `docs/PLAN_CUENTAS.md`) |
| **Un cambio fijo para todo el viaje** desde el principio | Settle Up lo ofrece, pero añade un ajuste más. Con «Te cobraron … €» se cubre lo importante. Tanda 3 si alguien lo pide |

## 7. Riesgos

- **La comisión del banco.** El BCE no es lo que cobra la tarjeta. Si nadie corrige, el que pagó pierde unos céntimos o euros. Si corrige, cambia la parte de todos después de verla: el historial lo dice.
- **Redondeo.** 120 $ en 4 partes puede dar 27,75 / 27,75 / 27,75 / 27,75 €, pero otras cifras dejan un céntimo suelto. El céntimo se reparte como ya hace hoy la app con los euros, y la regla de §4.2 deja 1 céntimo de margen.
- **El ajuste «Moneda» de Tú** solo cambia el símbolo (`config.moneda`). Si alguien lo tiene en dólares, «convertir a euros» no tendría sentido para él. Propuesta: ofrecer lo de esta fase solo si su moneda es el euro (como todos hoy, creemos).
- **Mandar los campos nuevos antes de la migración** rompería guardar gastos compartidos para todos. Calidad debe probarlo en la tanda 1.
- **Sin conexión en el viaje** (datos caros fuera de la UE): el cambio guardado en el móvil puede ser viejo. Se avisa.
- **Pruebas** que comprueban textos del tema («Cerrar tema») y del formulario de compartir habrá que actualizarlas.

## 8. Preguntas para el dueño

1. **(Bloquea la tanda 1)** ¿La moneda del viaje va **en el tema** (y en el grupo si es solo para el viaje)? Recomendamos que sí: el viaje con tu pareja o tus amigos de siempre suele ser un tema dentro del grupo de siempre.
2. Si quien pagó pone «Te cobraron 112,40 €», ¿la diferencia con el BCE **se reparte entre todos**? Recomendamos que sí: es lo que costó de verdad. La alternativa es que la pague solo quien pagó.
3. ¿Empezamos por la **tanda 0** (sin tocar la base de datos) mientras Datos y Seguridad revisa el resto? ¿Hay algún viaje con fecha a la vista? Si lo hay, la tanda 0 llega a tiempo seguro.

## 9. Lo que no hemos podido averiguar o confirmar

- **Nada probado** ni dibujado: no hay bocetos ni capturas. No sabemos si «120,00 $ = 111,00 €» cabe en una línea a 375 px.
- **La lista exacta de monedas del BCE:** no pudimos abrir su web (la petición quedó sin permiso). Sabemos las 22 que pide hoy la función de precios; no hemos confirmado cuáles más publica (por ejemplo, si incluye el dírham marroquí).
- **No sabemos si la tabla `divisas` se puede leer desde la app** o solo desde la función: su SQL no está en el repositorio.
- **No hemos visto** las reglas de quién puede cambiar `grupos` ni todo `validar_carpeta` (si deja pasar columnas nuevas). Lo mira Datos y Seguridad.
- **Splitwise:** no hemos comprobado cómo enseña los saldos con varias monedas ni si deja cambiar el cambio a mano; solo su ficha de App Store.
- **Tricount:** no dice en qué moneda se salda; solo que los saldos salen en la principal. Su página de funciones no dice de dónde sale el cambio (la de ayuda dice «del mercado»).
- **Settle Up:** página de consejos sin fecha visible; puede haber cambiado.
- No sabemos cuántos viajes fuera del euro hacen los usuarios (no miramos sus datos).

## 10. Fuentes (consultadas el 31/10/2026)

- [T1] Tricount, ayuda «Manage a tricount with many currencies»: https://tricount.com/en/manage-a-tricount-with-many-currencies — *interés propio: es su web*.
- [T2] Tricount, «Multi-currency support made easy»: https://tricount.com/expense-tracker-features/multi-currency-support — *su web, texto promocional*.
- [U1] Settle Up, «Tips» (apartado del cambio de moneda): https://settleup.io/tips.html — *su web*.
- [S1] Splitwise, ficha en App Store: https://apps.apple.com/app/splitwise-bill-splitter/id458023433 — *texto del fabricante*.
- Código de PalomApp (31/10/2026): `app.js` (`MONEDAS`, `saveCompartido`, `compRapidoHtml`, `movsEfectivos`, `miParte`, `saldosDe`, `deudasDe`, `copiaComp`, `temasDe`, `porTemasHtml`, `temaResumenHtml`, `temaMenuHtml`), `supabase/functions/activos-api/index.ts` (`ecbRango`, `aEuros`, tabla `divisas`), `supabase/functions/tickets-ia/index.ts` (campo `moneda`), `supabase/migrations/2026-10-30_historial_compartidos.sql` (`validar_compartido`, `registrar_historial_compartido`, `historial_grupo`), `2026-10-23_grupo_carpetas_temas.sql` (temas con fechas y «cerrada»).
- Bases: `docs/ROADMAP.md` (fase 6), `docs/04-juntos.md` (n.º 9, modo viaje), `docs/16-agenda-compartida-carpetas.md` (temas; no saldar por tema), `docs/27-historial-grupo.md`, `docs/marketing/05-criticas-tricount-splitwise.md`.

Para el PDF: un móvil con «Compartir un gasto» en el tema «Nueva York»: «120,00 $» grande, debajo «= 111,00 € · BCE 30/10», y una flecha a una caja «se guarda: 111,00 € (cuentas) + 120,00 $ al 1,0811 (recuerdo)». Al lado, la hoja «Cómo quedó el viaje» (total, tu parte, por día, «Cerrar el viaje»). Y la tabla de tandas como escalera con un candado en la 1 y la 2.

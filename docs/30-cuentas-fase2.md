# 30 · Cuentas, lo que queda de la fase 2

Producto y Diseño · 31/10/2026 · Fase 7 de `docs/ROADMAP.md`. Sigue a `docs/PLAN_CUENTAS.md`.

## 1. Conclusión

1. **Al importar, la app pregunta primero «¿De qué cuenta es este extracto?»** (solo si tienes 2 cuentas o más) y apunta cada fila en esa cuenta. También se puede importar desde la ficha de una cuenta. Con una sola cuenta todo sigue igual que hoy.
2. **Lo que ya tenías apuntado no entra dos veces.** La app lo busca en esa cuenta, en lo que no tiene cuenta y en lo que pagaste tú por Juntos (el importe entero, no tu parte), con un margen de 3 días. Las filas dudosas salen arriba, desmarcadas, con la pregunta «¿Es el mismo?».
3. **Los traspasos entre tus cuentas se guardan como traspaso, una sola vez.** Si importas Santander (sale 500 € hacia ING) y luego ING (entran 500 € desde Santander), la segunda fila se reconoce y no se importa.
4. **La columna «Saldo» del extracto sirve para dos cosas:** comprobar que los importes se han leído bien y ofrecer «Cuadrar con el banco» al terminar. Siempre lo pregunta; nunca lo hace por su cuenta.
5. **No hace falta tocar Supabase.** Basta con `cuenta_id` y `cuenta_destino_id`, que ya existen, y con unos campos nuevos dentro de `cfg()`. Lo más delicado es que la app cambie movimientos que ya existían: va en la última tanda y pasa antes por Datos y Seguridad.

## 2. Cómo funciona hoy (lo que he mirado en `app.js`)

| Pieza | Qué hace hoy | Qué le falta |
|---|---|---|
| `impAbrir` → `impHtml` | 4 pasos: archivo, columnas, vista previa, hecho | No pregunta la cuenta: todo cae en la principal |
| `impProcesar` | Id fijo por fila (`imp-` + fecha, importe, texto): si importas dos veces el mismo archivo, no se duplica | «¿Duplicado?» solo mira la misma fecha y el mismo importe, en todas las cuentas a la vez |
| Traspasos en el archivo | Si la columna Tipo dice «traspaso», la fila sale desmarcada con «apúntalo con Traspaso» | No se pueden importar como traspaso |
| Columna Saldo | Se reconoce para encontrar la fila de títulos, pero se descarta | No se usa para nada |
| `reglaPara` / `reglasCat` | Regla = texto → categoría (y tipo, si quieres) | No sabe de cuentas ni de traspasos |
| «Cuadrar» (`cuadrarOk`) | Pone el saldo del banco con fecha de **hoy** | No admite el saldo de otra fecha (el del extracto) |
| Metas (`cfg().ahorro`) | «Aportar» crea un movimiento de Ahorro que no saca dinero de ninguna cuenta | No se puede decir dónde está guardado ese dinero |
| Deshacer importación (`deshacerLote`) | Borra todo lo del lote, aunque lo hayas editado | No sabe deshacer cambios en movimientos que ya existían |

## 3. La propuesta, parte por parte

### A. Importar en una cuenta concreta

**Dos entradas:**
- La de siempre (botón + → Importar, Tú → Importar extracto o Excel).
- Nueva: en la ficha de cada cuenta, un botón fino bajo «Cuadrar» y «Ver movimientos»: `ic('fileIn')` **Importar extracto**. Entra con la cuenta ya elegida.

**Paso «¿Qué es cada columna?»: arriba del todo, antes de las columnas** (sin añadir pasos):

> **¿De qué cuenta es este extracto?**
> [Santander] [ING] [Efectivo] … (chips con el punto de color o el logo del banco)

- Viene marcada la cuenta que usaste la última vez con un archivo de ese formato. Si no la hay, la del banco que aparezca en el nombre del archivo, y si tampoco, la principal.
- Si se recuerda, una línea debajo: «La última vez importaste este formato en Santander».
- Con más de 4 cuentas, en vez de chips, un desplegable (a 375 px no caben más de 4 en dos líneas).
- El botón «Ver vista previa» no se activa hasta que haya una cuenta marcada.

**Vista previa:** en la cabecera, bajo el nombre del archivo, «En **Santander**» con su punto de color y un enlace «Cambiar».

**Hecho:** «Se han guardado **84** movimientos en **Santander**.»

**Importaciones** (Tú): cada lote dice la cuenta, por ejemplo «extracto_oct.xlsx · Santander · 31 oct 2026 · 84 movimientos».

### B. Lo que ya estaba apuntado y los traspasos

Al preparar la vista previa, cada fila acaba en uno de estos estados. La app los enseña **agrupados arriba**, antes de la lista normal, para que el usuario solo decida lo dudoso:

| Estado | Cómo lo reconoce | Qué ve el usuario | Por defecto |
|---|---|---|---|
| Ya importada | Mismo id que una fila de una importación anterior | «12 filas ya estaban importadas: se omiten» (como hoy) | No se importa |
| Ya la tenías | Mismo importe exacto y misma fecha, en esta cuenta o en algo sin cuenta | «Ya lo tenías: *Mercadona · 23,40 € · 12 oct*» | Desmarcada |
| ¿Es la misma? | Mismo importe exacto, fecha a 1-3 días | «¿Es el mismo que apuntaste el 10 oct?» [Es el mismo] [Son distintos] | Desmarcada |
| Ya está en Juntos | Coincide con lo que pagaste tú entero en un compartido, o con un pago al saldar (Bizum) | «Ya está en Juntos: *Cena · pagaste tú 100 €*» | Desmarcada |
| Traspaso nuevo | Ver «Cómo se reconoce un traspaso» | «Parece un traspaso **a ING**» [Es un traspaso] [No, es un gasto] | Marcada como traspaso |
| La otra mitad de un traspaso | Ya existe un traspaso con esta cuenta en el otro lado, mismo importe, 0-3 días | «Ya está como traspaso desde Santander (3 oct)» | No se importa |
| Nueva | Nada de lo anterior | Fila normal | Marcada |

**Reglas para comparar:**
- Una fila del extracto solo se puede emparejar con **un** movimiento, y viceversa. Si hay dos candidatos, gana el de fecha más cercana.
- Se compara con lo de **esta cuenta** y con lo que **no tiene cuenta** (lo antiguo). No con lo de otras cuentas, salvo para los traspasos.
- Los importes tienen que coincidir **al céntimo**. Sin redondeos.
- Al pulsar «Es el mismo», la fila no se importa. Al pulsar «Son distintos», se marca y se importa.

**Cómo se reconoce un traspaso** (de más a menos seguro):
1. Una regla tuya de traspaso (ver D).
2. La columna Tipo del archivo dice «traspaso» (ya se lee hoy).
3. El texto habla de transferencia o traspaso **y** nombra otra cuenta tuya o su banco como palabra entera («TRANSFERENCIA A ING DIRECT»).
4. Retirada en cajero («reintegro», «cajero») y tienes una cuenta de Efectivo: «Parece que sacaste dinero: **traspaso a Efectivo**».

La dirección sale del signo: si el importe es negativo, el dinero va **de** esta cuenta **a** la otra. Si es positivo, llega **desde** la otra. En la fila hay un selector «con: [ING ▾]» por si la app se equivoca de cuenta.

**Al confirmar un traspaso por primera vez** sale debajo de la fila (como ya pasa con las categorías): «Recordar: lo que contenga «transf ing» en Santander → traspaso a ING». Así la siguiente vez se reconoce solo.

**Caso antiguo** (ya importaste Santander antes de esta mejora y esos 500 € entraron como gasto): al importar ING, la app ve un gasto de 500 € en Santander a 0-3 días y pregunta: «¿Estos 500 € son el gasto de Santander del 3 oct? Lo convertiremos en un traspaso Santander → ING» [Sí, convertir] [No]. Esto **cambia un movimiento que ya existía**: va en la tanda 5, con su «Deshacer».

### C. La columna «Saldo» del extracto

**Columnas:** fila nueva, opcional, «Saldo (opcional)». La app la elige sola si la cabecera dice «saldo» o «balance».

**Comprobación de lectura** (sin preguntar nada): si la columna Saldo existe, la app comprueba fila a fila que *saldo anterior ± importe = saldo*.
- Si cuadra en casi todas: en la vista previa sale «`ic('checkCircle')` Los importes cuadran con la columna Saldo del banco».
- Si falla en muchas: un aviso arriba, en el color de aviso: «`ic('alert')` Los importes no cuadran con la columna Saldo. Puede que el signo o la columna de importe no sean los correctos.» [Revisar columnas]. No bloquea, pero el botón cambia a «Importar igualmente».

**Al terminar** (pantalla «¡Importado!»), una tarjeta más:
- Si la cuenta aún no tenía saldo: «El extracto dice que el **28 oct** tenías **1.234,56 €** en Santander. ¿Usamos ese saldo como punto de partida?» [Usar este saldo] [Ahora no].
- Si ya lo tenía: «El banco dice **1.234,56 €** el 28 oct. La app calcula **1.200,00 €**. Diferencia **+34,56 €**.» [Cuadrar con el banco] [Ahora no]. Si coincide: «Cuadra: la app y el banco dicen lo mismo», y nada más.
- Si la cuenta ya estaba cuadrada con un dato **más reciente** que el extracto, no se ofrece nada (no se va hacia atrás).

El saldo que vale es el de la **última fila en el tiempo** (hay extractos que van del más nuevo al más viejo; la app lo deduce de las fechas). «Cuadrar» guarda ese saldo **con la fecha del extracto**, no con la de hoy. Lo apuntado después de esa fecha se sigue sumando.

### D. Reglas con cuenta

En la hoja «Reglas de categorías», al crear o editar una regla, con 2 cuentas o más:
- **«Solo en»**: [Cualquier cuenta] [Santander] [ING]… La regla solo se aplica a lo importado (o apuntado) en esa cuenta. Sirve para que «transferencia» signifique cosas distintas en cada banco.
- **«Entonces es»**: [Una categoría] [Traspaso a / desde…]. Si eliges traspaso, eliges la otra cuenta. Ejemplo en la lista: «transf ing» · en Santander → **traspaso a ING**.

Si dos reglas encajan, gana la de la cuenta concreta sobre la de «Cualquier cuenta»; con el mismo alcance, la del texto más largo (como hoy). Las reglas que ya existen siguen igual: valen para cualquier cuenta.

### E. Meta ligada a una cuenta de ahorro

**En la meta (crear o editar), con 2 cuentas o más:** campo «¿Dónde guardas este dinero?» [En ninguna cuenta concreta] [ING Ahorro] … Salen primero las cuentas de tipo Ahorro.

**Qué cambia al ligarla:**
- **«Aportar»** sigue siendo un Ahorro (cuenta en «Te queda este mes» igual que hoy), pero además **mueve el dinero**: baja la cuenta de donde sale (la principal, o la que elijas en una línea «Desde: Santander ▾») y sube la cuenta de la meta. Es lo que pasa en el banco de verdad.
- En la tarjeta de la meta, una línea pequeña: «Guardado en ING Ahorro».
- **Comprobación:** si lo que llevas en las metas ligadas a esa cuenta supera su saldo, un aviso suave en la meta: «Tus metas en ING Ahorro suman 3.200 €, pero la cuenta tiene 3.000 €». Nada más: no corrige nada solo.
- **Al importar**, una salida hacia esa cuenta («Transferencia a ING») propone: «¿Es una aportación a **Viaje a Japón**?» [Sí, aportar] [No, es un traspaso]. Y la entrada en ING se reconoce como «la otra mitad» y no se importa.
- **Al apuntar un traspaso a mano** hacia esa cuenta, un chip: «Aportar a Viaje a Japón». Si lo tocas, se guarda como aportación.
- Lo que aportaste **antes** de ligarla no se toca: la meta sigue llevando lo mismo. Al ligarla se avisa: «A partir de ahora, al aportar, el dinero pasará de tu cuenta a ING Ahorro. Lo que ya llevabas no cambia.»
- «Lo que tienes» no cambia de cálculo: lo apartado ya no se suma aparte cuando hay cuentas con saldo (`patrimonio()`), así que no se cuenta dos veces.

## 4. Qué se guarda y dónde (sin migración)

| Dónde | Campo | Para qué |
|---|---|---|
| Movimiento importado | `cuentaId` (columna `cuenta_id`, ya existe) | La cuenta del extracto |
| Traspaso importado | `tipo: 'Traspaso'`, `cuentaId`, `cuentaDestinoId`, `lote` (ya existen) | Igual que un traspaso a mano; «Deshacer importación» lo borra |
| Aportación a meta ligada | `tipo: 'Ahorro'`, `cuentaId` (de dónde sale), `cuentaDestinoId` (la de la meta) | Mueve el saldo entre cuentas. **Cambio de cálculo:** `saldoCuenta` debe restar y sumar esto, aunque hoy un Ahorro no toca las cuentas |
| `cfg().importPerfiles[formato]` | `cuentaId` | Recordar la cuenta de ese formato de archivo |
| `cfg().importLotes[]` | `cuentaId`, `saldoBanco: {fecha, saldo}`, `cambios: [{id, antes}]` (tanda 5) | Enseñar la cuenta, ofrecer cuadrar después y deshacer cambios en movimientos que ya existían |
| `cfg().reglasCat[]` | `cuentaId` (opcional), `traspasoCon` (opcional, id de la otra cuenta) | Reglas por cuenta y reglas de traspaso |
| `cfg().ahorro[]` (metas) | `cuentaId` (opcional) | Meta ligada |
| `cfg().cuentas[].cuadre` | `origen: 'extracto'`, `fecha` del extracto | Que la ficha diga «Cuadrado con el extracto del 28 oct» |

**El id de cada fila importada no cambia** (no lleva la cuenta). Así, volver a importar un archivo de antes de esta mejora no duplica nada. Si la fila ya estaba importada **sin cuenta**, la vista previa lo dice («84 filas ya estaban importadas, pero sin cuenta») y ofrece el «Asignar movimientos» que ya existe, con esas filas ya marcadas. Es el usuario quien confirma.

## 5. Tandas, en orden

| # | Qué | Cambia movimientos que ya existían | Prueba clave |
|---|---|---|---|
| 1 | **Importar en una cuenta**: chips, recordar por formato, entrada desde la ficha, `cuentaId` en las filas, «Ya lo tenías» y «¿Es el mismo?» con 3 días, comparación con Juntos, emparejar uno a uno | No | Importar 2 veces el mismo archivo = 0 nuevas. Con 1 cuenta, todo igual que hoy |
| 2 | **Columna Saldo**: detectarla, comprobar los importes, «Usar este saldo» / «Cuadrar con el banco» con la fecha del extracto | No (solo `cfg().cuentas`) | Un extracto del más nuevo al más viejo coge bien el último saldo |
| 3 | **Traspasos al importar**: detección, selector «con:», guardar como Traspaso, reconocer la otra mitad, aviso al deshacer | No | Santander y luego ING: 1 traspaso, saldos correctos en las dos |
| 4 | **Reglas con cuenta**: «Solo en», «Entonces es traspaso», «Recordar» al confirmar un traspaso | No | Las reglas antiguas dan el mismo resultado que antes |
| 5 | **Arreglar lo que ya tenías**: «Es el mismo» pasa el antiguo a esta cuenta; convertir un gasto antiguo en traspaso; `lote.cambios` y deshacerlo | **Sí, de uno en uno y confirmado** | Deshacer el lote deja todo exactamente como estaba |
| 6 | **Meta ligada**: campo en la meta, Aportar con «Desde», `saldoCuenta` con Ahorro ligado, aviso de saldo, propuesta al importar | No | Aportar 100 €: el mes igual que hoy, Santander −100, ING +100, «Lo que tienes» igual |

La tanda 6 no depende de las demás y puede ir antes si el dueño la quiere primero (pero su propuesta al importar necesita la 3). Antes de las tandas 1, 3, 5 y 6 debería mirar Datos y Seguridad.

## 6. Alternativas descartadas

- **Meter la cuenta en el id de cada fila:** reimportar archivos antiguos los duplicaría. Descartada.
- **Que la meta ligada muestre el saldo de la cuenta** en vez de lo aportado: es más simple de explicar, pero de golpe cambiaría lo que llevas, no deja tener dos metas en la misma cuenta y obliga a cuadrar a menudo. Descartada (es la pregunta 1, por si el dueño la prefiere).
- **Un paso nuevo solo para elegir la cuenta:** añade un toque más. Va arriba de «Columnas».
- **Cuadrar solo con la columna Saldo, sin preguntar:** si las columnas se leyeron mal, estropearía el saldo sin que nadie se enterase. Descartada.
- **Aceptar emparejar con importes casi iguales** (por ejemplo, ±1 €): demasiados emparejamientos falsos con cafés y suscripciones. Solo importe exacto.
- **Convertir gastos antiguos en traspasos sin preguntar:** descartado por el riesgo para los datos.

## 7. Riesgos para los datos (para Datos y Seguridad)

| Riesgo | Cuándo pasa | Cómo se evita |
|---|---|---|
| Duplicados | Lo apuntado a mano con otra fecha (más de 3 días) o con otro importe (propina, comisión) | No se puede evitar del todo: queda como fila nueva. «Deshacer importación» lo arregla de golpe |
| Falso «ya lo tenías» | Dos gastos iguales reales (dos cafés de 1,50 € el mismo día) | Uno a uno: el segundo café no encuentra pareja y entra. Las dudosas van desmarcadas, pero a la vista |
| Traspaso perdido al deshacer | Deshaces el lote de Santander y la mitad de ING no se importó porque «ya estaba» | Aviso al deshacer: «2 traspasos de esta importación los dio por buenos la importación de ING. Si deshaces, vuelve a importar ese extracto». Como el id no cambia, al reimportar entran |
| Cambios en movimientos que ya existían (tanda 5) | «Es el mismo» con cuenta o «Convertir en traspaso» | De uno en uno, siempre con confirmación, guardando cómo estaba antes en `lote.cambios`. Nada en bloque. Ojo: hoy «Convertir en traspaso» quita el `lote` del movimiento |
| Importe mal leído | «1.234» sin decimales se lee como 1,234 € (`parseNum`); signo cambiado; columna equivocada | La comprobación con la columna Saldo (tanda 2) lo avisa. Sin columna Saldo, la vista previa enseña los totales de Ingresos y Gastos, como hoy |
| Saldo mal puesto | Saldo de la fila equivocada, o extracto más viejo que el último cuadre | Usar la última fila en el tiempo; no ofrecer cuadrar con un dato más viejo; siempre se pregunta; la diferencia se ve antes |
| Cuenta equivocada | El usuario elige ING para un extracto de Santander | La cuenta se ve en grande en la vista previa; «Deshacer importación» lo borra todo |
| Cifra «Se han guardado N» | `bulkInsert` cuenta como guardadas las filas que ya existían y se ignoran | Calcular N con lo que hay después de guardar (ya pasa hoy) |
| Aportación ligada mal contada | Código que trate un Ahorro con `cuentaDestinoId` como un traspaso, o al revés | `esTraspaso` solo mira el tipo. Probar mes, «Lo que tienes», metas y saldos |

## 8. Preguntas para el dueño

1. **Meta ligada: ¿aportar mueve el dinero entre cuentas (mi recomendación) o la meta enseña directamente el saldo de la cuenta?** Moverlo deja tener varias metas en una cuenta y no cambia lo que ya llevas. *Bloquea la tanda 6.*
2. **¿Una cuenta de ahorro puede guardar varias metas?** Recomiendo que sí, con el aviso si las metas suman más que la cuenta. *Bloquea la tanda 6.*
3. **Margen para «¿Es el mismo?»: ¿3 días?** Recomiendo 3: los pagos con tarjeta suelen salir 1 o 2 días después. No bloquea (se puede cambiar luego).
4. **Tanda 5 (que la app cambie movimientos que ya tenías): ¿la hacemos?** Recomiendo que sí, pero la última y después de Datos y Seguridad. Sin ella, lo antiguo se queda como estaba y hay que arreglarlo a mano. No bloquea las tandas 1 a 4.

## 9. Lo que no hemos podido confirmar

- **No he visto extractos reales** de Santander, ING, BBVA, Revolut o Trade Republic. No sé cuáles traen columna Saldo, en qué orden van las filas ni cómo escriben las transferencias propias. Haría falta un extracto de cada uno con datos inventados para las pruebas (sin datos reales: el repositorio es público).
- No sé cuántos días tarda de verdad cada banco en reflejar un pago con tarjeta. Los 3 días son una estimación.
- No sé si algún usuario ha importado ya extractos de varias cuentas en la principal. Si es así, la tanda 5 le vendrá bien, pero no se puede saber sin mirar datos reales (y no los miramos).
- Nada de esto está probado en un móvil: es una propuesta.

## 10. Fuentes

- `app.js` de la rama `main`, consultado el 31/10/2026: `impHtml`, `impProcesar`, `impEjecutar`, `deshacerLote`, `parseNum`, `reglaPara`, `guardarRegla`, `saldoCuenta`, `posteriorA`, `cuadrarOk`, `patrimonio`, `statsMetaH`, `kpisMes`, `saveTraspaso`.
- `data-layer.js` (`bulkInsert` con `ignoreDuplicates`, `deleteWhere` solo por lote), 31/10/2026.
- `docs/PLAN_CUENTAS.md` y `docs/ROADMAP.md`, 31/10/2026.

Para el PDF: un dibujo con dos extractos (Santander y ING) y una flecha que los une en un solo traspaso, y debajo la vista previa con los grupos «Ya lo tenías», «¿Es el mismo?» y «Traspaso».


## Decisiones del dueño (31/10/2026)
- Sí: «Convertir en traspaso» conserva el lote, así que «Deshacer importación» también borra ese traspaso.
- Publicados los arreglos de importar (miles, «Marcar las nuevas», contador) antes de la tanda 1.
- 31/10 (Desarrollo): en `importPerfiles[firma]` e `importLotes[]` la cuenta se guarda como `cuenta` (no `cuentaId`). El aviso «N filas ya estaban importadas, pero sin cuenta» con «Asignar movimientos» queda para la tanda 5.

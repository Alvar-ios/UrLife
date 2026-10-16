# Varias cuentas — plan y decisiones

Decidido con el dueño el 16/10/2026. El estudio completo está en el documento «PalomApp · Varias cuentas y forma de trabajar».

## La idea

1. **Cuenta**: nombre, tipo (corriente, ahorro, efectivo, bróker…), color, una marcada como **principal** y un interruptor «cuenta en lo que tengo».
2. **Cada movimiento sale de (o entra en) una cuenta.** Un movimiento sin cuenta cuenta como de la principal.
3. **Traspaso**: tipo de movimiento nuevo «de cuenta A a cuenta B». No es gasto ni ingreso: no cambia «Te queda este mes», ni presupuestos, ni gráficos.
4. **Saldo calculado**: el usuario pone el saldo real de una cuenta en una fecha; desde ahí la app suma y resta los movimientos de esa cuenta. Botón **«Cuadrar»**: escribe lo que dice el banco y la app enseña la diferencia (dejarla como ajuste o buscar lo que falta).
5. Con una sola cuenta, la app se ve y funciona igual que hoy.

## Decisiones

1. **Inicio**: «Te queda este mes» sigue siendo la cifra grande; debajo, una línea «En tus cuentas: X €» que abre una hoja con cada cuenta. Inicio no debe hacer scroll. *Más adelante* repensar la vista mensual, porque depende mucho del día en que llega la nómina.
2. **«En tus cuentas»** suma por defecto las corrientes y el efectivo, no las de ahorro ni el bróker. Cada cuenta tiene su interruptor.
3. **Trade Republic, Revolut y similares** se tratan como un banco más (una sola cuenta con su efectivo). Las inversiones siguen aparte, en Inversiones.
4. **Movimientos antiguos**: se quedan sin cuenta (cuentan como la principal). En la vista de cada cuenta hay un modo **«Asignar movimientos»**: lista de movimientos sin cuenta, se marcan uno a uno o con **«Seleccionar todos»**, y se asignan a esa cuenta (con confirmación y opción de deshacer).
5. **Cuenta conjunta con pareja**: no se usa ahora; queda para cuando la app salga al público (fase 3).
6. **Orden**: la fase 1 de cuentas va **antes** del pulido pantalla a pantalla.

## Fase 1 (ahora)

- Editor de cuentas en Tú → «Cuentas y saldos» (ya existe `cfg().cuentas = [{id, nombre, saldo, fecha}]`: ampliarlo con tipo, color, principal, cuenta en «lo que tengo»; el saldo y su fecha pasan a ser el punto de partida del cálculo).
- Campo «Desde» / «A» en el formulario de movimiento (solo con 2 o más cuentas). Recordar la última cuenta usada por categoría.
- Tipo «Traspaso» y opción en el botón +. Revisar todos los sitios que miran `tipo` (unos 60) para que lo ignoren en las sumas.
- Saldo calculado por cuenta y «Cuadrar».
- Línea «En tus cuentas» en Inicio; apartado **Cuentas** (el primero) en Dinero, con cada cuenta, su saldo, último cuadre y el modo «Asignar movimientos»; en Patrimonio, «Dinero en el banco» = suma calculada.
- Filtro por cuenta en Movimientos y un punto de color por cuenta en cada fila (solo con 2 o más cuentas). Los traspasos se ven como «Santander → Trade Republic», en gris.
- **Supabase**: añadir a `movimientos` dos columnas opcionales, `cuenta_id` y `cuenta_destino_id` (texto, nulas). Migración aditiva, con confirmación del dueño antes de aplicarla.
- Pruebas automáticas de todo lo anterior.

## Fase 2 (después)

Importar por cuenta (detectar traspasos entre cuentas propias para no contarlos dos veces; usar la columna de saldo para cuadrar), cuenta en cobros/pagos recurrentes y reglas, saldar en Juntos desde una cuenta, metas con cuenta de ahorro vinculada.

## Fase 3 (al salir al público)

Cuenta conjunta dentro de Juntos (tabla nueva), tarjeta de crédito con cargo diferido, moneda por cuenta.

## Casos a tener en cuenta

- **Compartidos**: el mes cuenta tu parte; la cuenta cuenta lo que salió de verdad (si pagas 100 € de una cena a medias, el mes suma 50 € y la cuenta baja 100 €). Al recibir el Bizum, la cuenta sube y el mes no cambia.
- **Sacar del cajero** = traspaso de la cuenta a Efectivo.
- **Aportación a inversión** baja el efectivo de la cuenta de donde sale.

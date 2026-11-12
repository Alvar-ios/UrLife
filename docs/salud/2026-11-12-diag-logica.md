# Diagnóstico de lógica · 12/11/2026 (Calidad, fase A3 de docs/40)

Rama `fase13/diag-logica` (encima de `fase13/integracion`). No se ha cambiado código de la app: solo pruebas nuevas en `tests/`. Todos los datos son inventados.

## 1. Conclusión

1. **Las cifras cuadran.** En 30 casos (muchos y pocos movimientos, 3 cuentas, traspasos, metas ligadas, inversiones, deudas, compartidos con «tu parte», usuario nuevo), Inicio, Movimientos, el balance del mes, los Informes, los saldos de las cuentas y Dinero dicen lo mismo. Y lo dicen con «Tu mes» del día 1 o desde el día de cobro (5, 15, 25 y 31), en febrero de 28 y de 29 días y en el cambio de año.
2. **Juntos también cuadra.** En 40 grupos inventados al azar, el saldo del grupo, «¿De dónde sale?», la hoja de cada persona y «Tu saldo» de la cuenta dan lo mismo, céntimo a céntimo. Probado con moneda de viaje, personas sin cuenta, pagos para saldar y repartos entre 3.
3. **El único fallo de verdad está en el importe escrito a mano** (P1). «12,345» se guarda con 3 decimales, «1,2,3» se guarda como 1,20 € y «0.500» como 500 €, todo sin avisar. En cambio, «−3», con el signo menos que pinta la propia app, se rechaza.
4. **No hay botones que no hagan nada.** Todos los botones que se pintan tienen su acción, y no sale ningún error en consola con los 3 juegos de datos. Hay 6 acciones que no usa ningún botón (P3, limpieza).
5. **Importar no duplica.** Con avisos del banco ya apuntados (`origen:'aviso'`), cada aviso tapa solo una fila del extracto, aunque haya dos cafés iguales el mismo día. Reimportar el mismo extracto ya lo cubre `test117b`.

## 2. Problemas

| Problema | Dónde (archivo:línea) | Cómo se reproduce | Prioridad | Arreglo propuesto |
|---|---|---|---|---|
| Un importe con 3 decimales se guarda tal cual | `app.js:2667` (`numCampo`) y `app.js:1962` (`saveMov`, sin redondear) | + → Gasto, importe «12,345» → Guardar: en la base queda 12.345. Lo suma todo con medio céntimo de más o de menos | **P1** | En `saveMov` (y donde se guarde un importe), redondear a 2 decimales o pedir un importe válido si hay más de 2 decimales |
| «1,2,3» se acepta como 1,20 € | `app.js:2670` (cambia solo la primera coma) | Importe «1,2,3» → Guardar: guarda 1,2 | **P1** | Si hay más de una coma, o una coma seguida de un punto, que sea «Pon un importe válido» |
| «0.500» se guarda como 500 € | `app.js:2671` (el punto con 3 cifras se lee como miles, incluso empezando por 0) | Importe «0.500» → Guardar: guarda 500 | **P1** | Tratar el punto como de miles solo si la cifra no empieza por «0» |
| No entiende «−3», el signo menos que pinta la app | `app.js:2668` | Copiar «−3,00 €» de la app y pegarlo en el importe → «Pon un importe válido» | P2 | Cambiar «−» por «-» antes de leer, como ya hace `app.js:1896` en el teclado propio |
| «1e3» se guarda como 1.000 € | `app.js:2672` (`parseFloat`) | Importe «1e3» → guarda 1000 | P3 | Aceptar solo cifras, puntos, comas y un signo |
| Acciones que no usa ningún botón | `app.js:11424` `onFabAntiguo` (solo la usan pruebas antiguas), `11437` `tuMesDia`, `11598` `movPerHoy`, `12188` `recTipo`, `12292` `metaTipo`, `12666` `setLook` | Buscar su nombre en `app.js`: solo aparecen donde se definen | P3 | Quitarlas o confirmar que sobran (`setLook`: el Clásico está oculto) |
| Sin cuentas no se ve la cifra de «Lo que tienes», aunque haya inversiones y deudas | `renderDineroV2`, `app.js:6327` | Usuario sin cuentas, con inversiones y deudas → Dinero: «Pon el saldo de tu banco» | P3 (parece a propósito) | Que Producto decida si enseña la cifra con una nota |

Pruebas que lo demuestran: `tests/test160_diag_importe_escrito.js` (marca los 4 primeros como «FALLO CONOCIDO» y no rompe `npm test`; cuando se arreglen, avisa de que hay que quitarlos de la lista).

## 3. Lo que SÍ cuadra (probado en las pruebas automáticas)

| Qué | Cómo se ha comprobado | Prueba |
|---|---|---|
| Cada día cae en un solo mes, sin huecos ni solapes, del 2023 al 2027 | `mesDe` y `rangoMes` día a día, con «Tu mes» del día 1 y desde el cobro el 2, 5, 15, 16, 25, 28 y 31 | `test162` |
| `kpisMes` = una cuenta hecha aparte | Ingresos, gastos, facturas, apartado, invertido, deudas y lo que queda, mes a mes | `test162` |
| Inicio = Movimientos = balance del mes = Informe | Cifra grande, Ingresos y Gastos; el balance del mes cerrado y «Entró / Gastaste / Balance» del informe | `test162` |
| Saldo de cada cuenta | Saldo de partida ± lo de después, con traspasos, aportes a metas ligadas (de una cuenta a otra) y compartidos pagados por ti | `test162` |
| Dinero «Lo que tienes» | `patrimonio()` = Cuentas + Inversiones − Deudas (lo apartado no se suma dos veces) | `test162` |
| Juntos | Saldos del grupo suman 0; «¿De dónde sale?» línea a línea = saldo; los pagos propuestos dejan a todos en paz; la hoja de cada persona y «Tu saldo» coinciden (40 grupos al azar, moneda USD, personas sin cuenta, alias) | comprobado a mano con jsdom; ya lo cubren en parte `test130` y `test142` |
| Repartos entre 3 | 100 € → 33,34 + 33,33 + 33,33; 0,01 €, 0,02 €, 99,99 €, 1.000,01 €: siempre suman el total; también por porcentaje y por importe | comprobado a mano con `calcReparto` |
| Importes bien escritos | «1.234,56», «12,5», «8.000», «-3» (devolución), vacío y «abc» | `test160` |
| Importar con avisos ya apuntados | Los iguales salen «ya lo tenías», los de fecha cercana salen «¿quizás?» y desmarcados, y el segundo café igual del mismo día sale como nuevo | comprobado a mano con el extracto de ejemplo de Santander |
| Botones y consola | Todos los botones pintados en las 6 pestañas, las 3 vistas de Movimientos y 8 hojas tienen su acción; 0 errores en consola | `test161` |

## 4. Recomendaciones

- Arreglar los 3 P1 del importe en un solo sitio (`numCampo` y redondear al guardar). Así cubre también metas, deudas, Juntos y el trayecto, que usan la misma función.
- Pasar `test162` cada vez que se toque `mesDe`, `rangoMes`, `saldoCuenta` o `patrimonio`. Tarda unos 25 s.

## 5. Riesgos

- Algún importe con 3 decimales que ya esté guardado de antes descuadra la suma por menos de un céntimo. No lo he podido mirar: haría falta consultar la base, y eso es de Datos y Seguridad, solo leyendo.

## 6. Preguntas para el dueño

1. ¿Quitamos las 6 acciones que no usa ningún botón? (No bloquea nada.)
2. Sin cuentas, ¿Dinero debe enseñar «Lo que tienes» con las inversiones y las deudas? (No bloquea nada.)

## 7. Lo que no se ha podido probar

- En un móvil real, con el teclado del sistema (qué teclas da para la coma y el signo menos).
- «Deshacer» de Juntos y del importar en esta tanda: lo cubren las pruebas que ya había (`test113b`, `test114b`, `test126`), pero no lo he vuelto a revisar por el recorte de tiempo.
- La nómina con días variables (`mesInicio.nomina`): no está en los juegos de datos.
- El año de los Informes y el trimestre: solo se ha comparado el informe mensual.
- Las acciones que se pasan en una variable (`act(accion)`, 32 sitios) solo se han comprobado en las pantallas que se recorren. Una hoja que no se abre en la prueba podría tener un botón sin acción.

## 8. Fuentes

- Código de la rama `fase13/integracion` del 12/11/2026 y pruebas propias con jsdom (`tests/harness.js`), con datos inventados.

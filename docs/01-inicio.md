# Fase 4 · Inicio: propuesta de Producto y diseño (17/10/2026)

## Versión 2 (17/10/2026, tras la respuesta del dueño)

Bocetos (prueba, no son la app; 375 × 667 px, datos inventados) en `docs/img/`:
- `inicio-boceto-v2-oscuro.png`: con datos, «Tu mes» desde que cobras.
- `inicio-boceto-v2-claro.png`: los mismos datos con el mes del 1 al 31, para ver la línea «Previsto».
- `inicio-boceto-v2-tu-mes.png`: la hoja para cambiar el mes.
- `inicio-boceto-v2-nuevo.png`: usuario nuevo.

**Ya decidido por el dueño:** cada usuario elige su mes (del 1 al 31, o desde el día que cobra); se quita el selector «Hoy · Semana y tareas · Calendario»; no se da ninguna cifra por día.

### Conclusión

1. Inicio se queda en **dos preguntas**: «¿Cómo voy este mes?» (una cifra) y «¿Qué tengo que hacer estos días?» (3 filas). Todo lo demás se ve al tocar.
2. **La cifra grande es siempre real.** Lo que se calcula con la nómina sale aparte, en una línea con borde de puntos y la etiqueta **PREVISTO**. Nunca se suma a la cifra grande.
3. El mes se cambia de un toque: la píldora «Octubre · desde el 28 sep ⌄» de la tarjeta abre la hoja «Tu mes». La misma hoja está en Tú y es una pregunta del asistente de bienvenida.

### Qué cambia respecto a la versión 1, y por qué

| Se quita o cambia | Por qué |
|---|---|
| Las tres cifras Ingresos / Gastos / Apartado | No responden a «¿cómo voy?» de un vistazo; están a un toque (la cifra grande abre Movimientos → Resumen) |
| La barra de colores | Repetía las tres cifras en otro formato |
| «Faltan 11 días» y «unos 54 € al día» | Decisión del dueño; el periodo ya se lee en la píldora |
| «Lo próximo» y «Pendiente», juntos en «Estos días» | Una sola lista, **3 filas** (antes 4), más altas (62 px) y con más aire |
| Las filas de más | Ya no hay fila «Y N más»: el enlace de la cabecera dice «Ver los 4 ›» y abre la lista entera agrupada (Por confirmar · Vencido · Próximos días). Si no hay más, dice «Agenda ›» |
| «Mañana» en texto | Ahora es una hojita de calendario («OCT 18») en ámbar; el rojo queda solo para lo vencido |
| Usuario nuevo | Sin ceros llamativos: la cifra en gris, una frase («Apunta lo que cobras y lo que gastas, y aquí verás cómo vas») y solo 2 pasos. «¿Qué día cobras?» pasa al asistente de bienvenida |

### La línea PREVISTO

- Sale **solo si falta por llegar un cobro recurrente antes de que acabe tu mes**. Con el mes del 1 al 31 y la nómina el 28, sale casi todo el mes; con «desde que cobro», casi nunca: la pantalla queda más limpia.
- Su cifra es la real, más los cobros previstos y menos los pagos recurrentes que faltan. En el ejemplo: −1.200,10 + 1.800 (nómina) − 55 (luz) − 35 (gimnasio) = 509,90 €.
- Al tocarla se abre el desglose: cada línea marcada como «previsto» y el importe de la nómina tomado del cobro recurrente, con la nota «Tu nómina puede variar».
- Cuando llega el cobro de verdad, la línea desaparece y la cifra grande ya lo incluye.
- Los límites del mes se fijan **por el día** de cobro, nunca por el importe. Que la nómina cambie de un mes a otro solo afecta a la línea PREVISTO.

### Con poco y con mucho

| Situación | Qué se ve |
|---|---|
| Usuario nuevo | Tarjeta con la cifra en gris y una frase; «Empieza aquí» con 2 pasos |
| Nada pendiente | «Estos días» dice «Todo al día ✓» y muestra lo próximo en una sola línea |
| Muchos avisos | Siempre 3 filas, por urgencia: confirmar un pago, lo vencido, el presupuesto pasado, lo de Juntos y lo próximo. El resto, en «Ver los N ›» |
| Una sola cuenta | Sin la línea «En tus cuentas»: la tarjeta queda aún más corta |

### Riesgos

- Ocultar Ingresos / Gastos / Apartado puede hacer que alguien no encuentre «cuánto he gastado». Se mitiga porque la cifra grande lleva al Resumen; conviene comprobarlo con la pareja y los amigos.
- La línea PREVISTO depende de que los cobros recurrentes estén bien apuntados. Si no hay ninguno, no sale.

### Preguntas que debe decidir el dueño

1. **(Bloquea)** ¿Quitamos de verdad Ingresos / Gastos / Apartado de Inicio y los dejamos a un toque, en el Resumen?
2. ¿La línea PREVISTO resta también los pagos recurrentes que faltan (luz, gimnasio…), o solo suma la nómina prevista? Recomiendo lo primero: es más realista para planificarse.

### Lo que no hemos podido averiguar o confirmar

- Los bocetos usan las fuentes del sistema, no las de la app, y no se han probado en un móvil real.
- No se ha medido con el texto grande del sistema activado.

---

## Versión 1

Capturas «antes» y boceto «después» en `docs/img/` (móvil de 375 × 667 px, modo oscuro, datos de ejemplo inventados). El boceto es una **prueba** dibujada aparte: no es la app.

## Conclusión

1. **Inicio hoy no cabe:** en un móvil pequeño sobran 313 px con datos y 402 px para un usuario nuevo. Del bloque «Pendiente» solo se ve la primera fila; el usuario nuevo solo ve 1 de sus 4 pasos.
2. **La cifra grande engaña a quien cobra a final de mes:** con nómina el 28, el día 17 Inicio dice «−1.200,10 €» en rojo mientras «En tus cuentas» dice 5.149,90 €. Con la propuesta, los mismos datos dan **599,90 €**.
3. **Recomendación:** un ajuste «Tu mes empieza el día que cobras» que valga para toda la app (Inicio, presupuestos, Resumen y gráficos), no solo para la cifra de Inicio.
4. **Inicio con dos bloques:** la tarjeta de lo que te queda (más baja) y una sola lista «Para estos días», que junta lo pendiente y lo próximo. Las flechas de mes y el «Mes | Año» se van a Movimientos → Resumen.

## Qué falla hoy (de más a menos importante)

| # | Problema | Dónde se ve |
|---|---|---|
| 1 | Con nómina a final de mes, «Te queda este mes» sale negativo casi todo el mes e «Ingresos» marca 0,00 € | Captura con datos |
| 2 | Hace scroll: la tarjeta grande ocupa 312 px de los 532 px útiles | Las dos capturas |
| 3 | El selector «Hoy · Semana y tareas · Calendario» y las flechas «‹ Octubre ›» con «Mes · Año» ocupan sitio para cosas de análisis | Parte de arriba |
| 4 | Lo mismo sale dos veces («Mañana: Luz» en Pendiente y en Lo próximo), y el carrusel de Lo próximo corta las tarjetas por la derecha | Abajo |
| 5 | Todo lo pendiente lleva el triángulo rojo de alarma, aunque solo sea preguntar si se pagó el gimnasio | Fila «Gimnasio» |

## Cómo debería quedar (de arriba abajo)

| Bloque | Con datos | Usuario nuevo, sin datos |
|---|---|---|
| Barra de arriba | «Inicio», día de la semana y fecha, buscar, tu inicial | Igual |
| Tarjeta «Te queda este mes» (unos 200 px) | Línea pequeña «Tu mes · 28 sep – 27 oct ›» (abre el Resumen). Cifra grande. Píldora «Faltan 11 días · unos 54 € al día». «En tus cuentas» (solo con 2 o más cuentas). Barra fina y tres cifras en una fila: Ingresos, Gastos, Apartado | Sin ceros: «Aquí verás lo que te queda cada mes» y un botón «¿Qué día cobras?» (apunta la nómina como cobro recurrente y fija el inicio de tu mes) |
| «Para estos días» · enlace «Agenda ›» | Una sola lista, como mucho 4 filas (3 en pantallas bajas), por urgencia: preguntas «¿Pagado? Sí / No», tareas vencidas, «Te deben / Debes» de Juntos, presupuesto pasado, y luego lo próximo (Mañana, Mié 21…). Si hay más: «Y 3 más ›» | «Empieza aquí» compacto, 3 pasos de una línea: 1. ¿Qué día cobras? 2. Apunta un gasto o haz foto a un ticket. 3. Trae el extracto del banco. Presupuestos, metas y compartir salen después, en «Sácale más partido» (2 como mucho) |
| Si no hay nada pendiente | «Todo al día ✓» y las 3 cosas más cercanas | — |

**Se quita de Inicio:** el selector «Hoy · Semana y tareas · Calendario» (la Agenda se abre con «Agenda ›»; Semana y Calendario siguen dentro de ella), las flechas de mes y el «Mes · Año» (ya existen en Movimientos → Resumen) y el carrusel «Lo próximo» (entra en la lista).

## La nómina: recomendación

**«Tu mes empieza el día que cobras».** En Tú → ajustes (y en el primer paso del usuario nuevo): «Mi mes empieza: el día 1 (normal) / cuando cobro la Nómina (día 28)». Si se elige la nómina, el mes empieza el día de ese cobro recurrente, también cuando se adelanta por fin de semana. El mes se llama como el mes en que termina: «octubre» va del 28 sep al 27 oct (la nómina de septiembre es para vivir octubre).

| Parte de la app | Qué pasa |
|---|---|
| Cifra de Inicio | Cuenta desde la nómina. El ejemplo pasa de −1.200,10 € a 599,90 € |
| Presupuestos | Se reinician el día que cobras. Los importes no cambian |
| Movimientos → Resumen y gráficos | Usan el mismo mes y enseñan las fechas («Octubre · 28 sep – 27 oct») |
| Resumen del año | Suma los 12 meses tuyos, así que empieza a finales de diciembre del año anterior |
| Juntos, metas, deudas, cuentas | No cambian (no van por meses) |
| Datos guardados | No se toca ningún movimiento: es un ajuste más de la configuración y se puede deshacer |
| Quien no lo active | Todo sigue igual, con el mes del 1 al 31 |

**Descartadas:** (a) que solo la cifra de Inicio cuente «desde la última nómina»: Inicio diría una cosa y el Resumen y los presupuestos otra; (b) dejar el mes del 1 al 31 y sumar la nómina «prevista»: se mezcla dinero real con dinero que aún no ha llegado; (c) adivinar la nómina sin preguntar: falla con nóminas que cambian o con autónomos.

## Microdetalles del aspecto Nuevo

1. **Color de lo negativo:** en la tarjeta, lo negativo y los gastos van en melocotón (`#FFC2B3`, `#FFB59E`), demasiado cerca del terracota. Mejor un coral rosado vivo (por ejemplo `#FF8FA3`); y si la cifra es negativa, que siga en blanco con una píldora «Vas 120 € por encima».
2. **Iconos según lo que pasa:** calendario azul para «¿Pagado?», rojo solo para lo vencido. Hoy las preguntas de pagos usan el triángulo rojo porque la fila lleva la clase `rec mal` y el código solo pone el calendario cuando la clase es exactamente `rec`.
3. **Juguetón al tocar:** al pulsar «Sí», la fila se convierte en ✓ y se pliega con `sentir('ok')`, y la cifra grande se recalcula contando hacia arriba. «Apartado e invertido» se acorta a «Apartado» para no partirse en dos líneas a 375 px.
4. **Botones de 44 px de alto como mínimo** en «Sí / No» y en las filas.

## Riesgos

- Cambiar el mes toca unos 30 sitios que hoy usan el mes del 1 al 31. Hay que hacerlo en una sola pieza común y probar bien el cambio de año y febrero.
- A quien importa extractos mensuales del banco (del 1 al 31) le puede extrañar que su «octubre» no coincida con el extracto.
- Con 4 filas y los textos grandes del sistema, puede volver a pasarse de alto: la lista debe recortar filas según el alto real de la pantalla.

## Preguntas que debe decidir el dueño

1. **(Bloquea)** ¿Te vale «Tu mes empieza el día que cobras» para toda la app, y que el mes se llame como el mes en que termina (28 sep – 27 oct = «octubre»)?
2. ¿Quitamos de Inicio el selector «Hoy · Semana y tareas · Calendario» y dejamos la Agenda detrás del enlace «Agenda ›»?
3. ¿Te gusta la píldora «Faltan 11 días · unos 54 € al día», o prefieres no dar una cifra por día?

## Lo que no hemos podido averiguar o confirmar

- No lo he probado en un móvil real: medidas y capturas sacadas con un navegador automático a 375 × 667 px, con fuentes del sistema (no las de la app).
- No he revisado el modo claro con el boceto, solo el «antes».
- No he comprobado cómo resuelven otras apps lo del día de cobro.

## Fuentes

- Código de la app (`app.js`: `renderInicioNuevo`, `heroHtml`, `proximoHtml`, `movsDelMes`; `look.css`) a fecha 17/10/2026.
- Medidas y capturas propias con datos inventados, 17/10/2026.

Para el PDF: poner «antes» (con datos) y el boceto «después» uno al lado del otro, con −1.200,10 € frente a 599,90 € bien grandes.

# Auditoría de Calidad «tocando de verdad» (11/11/2026)

Departamento de Calidad · antes de publicar en Google Play · rama de las pruebas: `calidad/auditoria-toques` (sin fusionar).

## 1. Conclusión

1. **Los procesos principales funcionan tocando de verdad.** 244 comprobaciones nuevas pasan por el mismo camino que un dedo en el móvil (botón, teclado de la app, campos con sus eventos). No aparece ningún fallo grave del tipo «añadir cuentas no funcionaba».
2. **Hay 2 fallos de gravedad media que pueden descuadrar o duplicar datos**: «Deshacer» al borrar un gasto compartido deja las cifras mal hasta que llega el aviso en vivo del servidor (o hasta reabrir la app), y si la red corta la respuesta al guardar, la app dice «No se pudo guardar» aunque sí se guardó: al volver a tocar Guardar, el gasto queda duplicado.
3. Hay 4 fallos leves de comodidad (meta sin «Deshacer», un aviso de «apartado» sin metas, atrás sin preguntar en Nueva meta, borrar cuenta borra lo escrito).
4. **Lo más arriesgado no se puede probar aquí**: las descargas (Excel y copia de seguridad) dentro de la app de Android. En una app hecha con Capacitor, las descargas del navegador suelen no hacer nada. Hay que probarlo en un móvil real antes de publicar.
5. Todas las pruebas pasan: ver el recuento al final. Los 6 fallos quedan marcados como «FALLO CONOCIDO» y no rompen `npm test`.

## 2. Tablas

### Fallos encontrados (de más grave a menos)

| # | Gravedad | Qué pasa | Cómo reproducirlo | Dónde (archivo · función) |
|---|---|---|---|---|
| 1 | Media | Tras «Deshacer» un gasto compartido borrado, el gasto no vuelve a la pantalla y tu copia cuenta entera (80 €) en vez de tu parte (40 €). Solo se arregla al llegar el aviso en vivo del servidor o al reabrir la app | Gasto de 80 € con Ana a medias → borrarlo → «Deshacer» sin conexión en vivo → Juntos no enseña la deuda y el mes cuenta 80 € | `app.js` · `deshacerBorradoComp`, `recuperarComp` (y `histRecuperar`): tras recuperar no se pone el gasto en `S.compartidos`. `data-layer.js` · los compartidos no se releen al volver a la app |
| 2 | Media | Si se corta la respuesta del servidor, dice «No se pudo guardar. Revisa tu conexión.» aunque se guardó. La hoja sigue abierta; al tocar Guardar otra vez queda duplicado | Prueba `test140`, apartado «Respuesta perdida»: el servidor guarda, la respuesta no llega | `app.js` · `saveMov` (y todo lo que usa `collection(...).add()`: aportar, tareas, pagos fijos). El número de cada movimiento lo pone el servidor en cada intento |
| 3 | Leve | Quitar una meta no ofrece «Deshacer» (cuentas, deudas, pagos fijos y movimientos sí) | Dinero → meta → Editar → Eliminar meta (2 toques) | `app.js` · `metaEliminar` |
| 4 | Leve | Sin ninguna meta, Dinero sigue diciendo «150 € están apartados para tus metas» | Meta ligada a una cuenta → aportar 150 € → quitar la meta | `app.js` · `lqtHtml` (nota «De tus cuentas, … están apartados») |
| 5 | Leve | Atrás de Android con una meta a medio escribir la cierra sin preguntar (en un gasto sí pregunta) | Dinero → Nueva meta → escribir nombre → atrás | `app.js` · `hojaConAlgoEscrito` no incluye metas, deudas ni pagos fijos |
| 6 | Leve | En «Borrar mi cuenta», tras «La contraseña no es correcta» hay que volver a escribir BORRAR | Tú → Borrar mi cuenta → BORRAR + contraseña mala | `app.js` · `borrarCuentaOk` repinta la hoja entera |

### Procesos probados (todos tocando de verdad)

| Proceso | Comprobaciones | Resultado |
|---|---|---|
| Gasto, ingreso, editar, borrar con «Deshacer», Repetir, ticket, importar CSV, traspaso, convertir en traspaso, atrás | 55 | Bien (fallo 2) |
| Cuentas (crear, saldo, cuadrar, principal, quitar), metas, deudas, inversión, pagos y cobros fijos | 57 | Bien (fallos 3, 4, 5) |
| Juntos: crear grupo, persona sin cuenta, compartir, pago parcial, saldar todo, deshacer, editar, historial, WhatsApp | 44 | Bien (fallo 1) |
| Agenda (rápida, completa, compartida, pasar a compartida, calendario), trayecto, Tú (nombre, categorías, ocultar cifras, Excel, borrar cuenta, cerrar sesión) | 53 | Bien (fallo 6) |
| Bienvenida «Lo básico», invitación, Inicio a tu gusto, informes, «Antes» oculto a los nuevos | 35 | Bien |

## 3. Recomendaciones

- **Fallo 1:** tras recuperar, volver a leer los compartidos de ese grupo (o ponerlo en la lista local, como ya se hace al borrar). Así lo que se ve y las cifras del mes cuadran al momento.
- **Fallo 2:** dar a cada movimiento nuevo su número en el móvil antes de enviarlo y guardarlo con «guardar este número». Si se repite, se pisa el mismo y no se duplica.
- **Fallos 3 a 6:** baratos. Dar «Deshacer» a la meta, quitar el aviso si no hay metas, preguntar antes de descartar en metas, deudas y pagos fijos, y no borrar lo ya escrito.
- **Antes de subir a Google Play:** probar en un móvil Android real la lista de la sección 6.

## 4. Riesgos

- Si las descargas no funcionan en la app de Android, «Descargar mis movimientos (Excel)» y «Copia de seguridad» dirán «descargado» pero no habrá archivo. Google Play no lo detecta; el usuario sí.
- El fallo 2 es raro (hace falta mala cobertura justo al guardar), pero el usuario no lo nota: verá dos gastos iguales y el mes descuadrado.
- Las pruebas simulan el servidor. Si una función de Supabase devuelve algo distinto a lo simulado, aquí no se ve.

## 5. Preguntas para el dueño

1. ¿Arreglamos los fallos 1 y 2 antes de publicar en Google Play? Recomendado. No bloquea, pero son los únicos que tocan cifras.
2. ¿Quieres «Deshacer» también al quitar una meta (fallo 3)? No bloquea.

## 6. Lo que no se ha podido probar

- **En un móvil real:** descargas (Excel, copia de seguridad, «Añadir al calendario»), abrir WhatsApp desde la app, la cámara para el ticket, el botón atrás físico, la huella, el teclado del sistema al escribir el saldo de una cuenta y el aspecto en pantallas pequeñas.
- **La lectura del ticket con IA y el cálculo de km de verdad:** solo hasta la llamada, con respuestas inventadas.
- **El servidor de verdad (Supabase):** grupos, historial, invitaciones y borrado de cuenta usan un servidor simulado.
- **El aspecto «Clásico»:** está oculto desde el 17/10. Solo se ha probado el «Nuevo».
- Varios dispositivos a la vez (dos móviles cambiando lo mismo).

## 7. Fuentes

- Pruebas nuevas en `tests/test140_toques_movimientos.js` … `tests/test144_toques_bienvenida_inicio.js` y la ayuda común `tests/toques_comun.js` (11/11/2026). Datos inventados.
- Para saber qué hace la librería de Supabase cuando falla la red: `movil/node_modules/@supabase/postgrest-js` versión 2.118.0 (la misma que carga `index.html`), consultada el 11/11/2026.
- Pendiente ya anotado de descargas en la app: `docs/32`, punto 8 de la lista de pruebas en el móvil.

Recuento: `npm test` → **173/173 pruebas bien** (11/11/2026), con las 5 nuevas. Dentro de ellas, 244 comprobaciones bien y 8 marcadas como «FALLO CONOCIDO» (los 6 fallos de la tabla).

Para el PDF: una tabla de 5 filas (una por proceso) con un semáforo, y los 2 fallos de gravedad media destacados arriba.

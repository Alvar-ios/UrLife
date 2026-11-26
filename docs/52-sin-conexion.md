# 52 · PalomApp sin conexión (propuesta)

**Estado:** propuesta de Producto y Diseño, sin programar. Rama `fase24/sin-conexion`. Sesión 2 de `docs/51`.
**Para decidir antes de programar:** ver el final (3 decisiones).

## 0. Cómo está hoy (lo que he mirado)
- No hay copia de datos en el móvil: `data-layer.js` pide todo a Supabase al abrir (`onSnapshot` = leer todo + avisos en vivo). Sin red, la pantalla de carga dice «No hay conexión. En cuanto vuelva, verás tus datos.» y no se ve nada.
- Guardar un movimiento ya es «al instante»: lleva su número puesto en el móvil (`nuevoIdMov`, `anadir`), sale en pantalla (`movPendiente`) y se sube por detrás con reintentos (`withRetry`). Si falla, se quita y el aviso ofrece «Reintentar». **Pero esa cola vive solo en memoria: si cierras la app, se pierde.** Es el hueco principal.
- La configuración se guarda con `saveConfig` (cola en memoria, `update` por claves). Tareas, golf y compartidos se guardan con `write()`.
- Al volver la red o la app (`online`, `visibilitychange`) `data-layer.js` ya relee todo (`recargarTodo`). Eso se aprovecha.
- No hay service worker ni `manifest` en la web. Las apps de Android (Capacitor) y de iPhone llevan la web dentro, así que **abren sin red; la web en navegador, no**.

## 1. Qué ve y qué puede hacer el usuario

### Abrir la app y ver datos
- **Android e iPhone:** abre siempre. Si no hay red, se pintan los datos de la última vez que se cargó (copia en el móvil).
- **Web (navegador/instalada):** hace falta un service worker que guarde la «cáscara» de la app (index, app.js, css, letras, logos). Sin él, sin red no abre ni la pantalla. Es la tanda 2.
- **Primera vez en un móvil, o sesión cerrada:** necesita red (no hay copia). Pantalla de entrada con un único aviso: «Para entrar la primera vez necesito conexión.»
- La sesión se mantiene sin red (Supabase la guarda). Si caduca estando sin red, se sigue viendo la copia y se pide entrar al volver.
- La copia se **borra al cerrar sesión o al borrar la cuenta** y no se comparte entre cuentas (clave por usuario).

### Qué se puede hacer (se guarda en el móvil y sube solo al volver)
| Acción | Sin conexión |
|---|---|
| Apuntar gasto, ingreso, inversión, traspaso | Sí. Sale ya en pantalla, como hoy. |
| Editar o borrar un movimiento propio | Sí. «Deshacer» sigue funcionando. |
| Tareas (crear, hacer, editar, borrar) y Agenda propia | Sí. |
| Metas, deudas, cuentas, pagos fijos, ajustes (`saveConfig`) | Sí. |
| Aportar a una meta (crea movimiento + aporte) | Sí, se sube en orden. |
| Ver Análisis, Movimientos, Dinero, Inicio | Sí, con los últimos datos. |

### Qué queda bloqueado y cómo se dice
Regla: el botón sigue visible pero apagado, y al tocarlo sale un aviso corto en el sitio (no una pantalla). Una sola frase por caso.
- **Juntos (grupos, gastos compartidos, saldar, pedir, recuperar, historial):** solo lectura con los últimos datos. Botones de crear/editar apagados. Aviso al tocar: «Sin conexión: Juntos solo se puede mirar.» Así nadie crea líos con otra persona. Nota: un gasto tuyo que acabas de compartir **no se permite** sin red (el gasto personal sí; si vas a compartirlo, se guarda «solo mío» y el chip Compartir queda apagado).
- **Leer ticket con IA:** «Para leer el ticket necesito conexión.» Se puede apuntar a mano.
- **Precios de activos, cambio de moneda, carburantes y calculadora de trayecto:** se enseña el último precio guardado con su fecha («de ayer»); nunca se inventa. Trayecto: bloqueado.
- **Invitaciones, unirse a un grupo, compartir agenda:** bloqueado, mismo aviso que Juntos.
- **Borrar cuenta, cambiar contraseña, cerrar sesión de todos los móviles, Avisos (registrar dispositivo):** bloqueado: «Esto necesita conexión.»
- **Cerrar sesión sin red:** se permite pero con aviso fuerte si hay cambios sin subir («Tienes 3 cambios sin subir. Si cierras sesión, se pierden.») con botones «Cancelar» y «Cerrar igualmente». Es el único caso donde se puede perder algo, y se pide confirmar.
- **Importar (extractos, Excel, ficheros):** bloqueado en v1 (es una operación grande y difícil de deshacer): «Importar necesita conexión.»
- **Cerrar un mes, informes, copia de seguridad:** se ven; lo que escriba servidor, bloqueado.

### Si luego choca con otro móvil
Regla más simple y segura (v1):
1. **Crear:** nunca choca (cada cosa lleva su número). Se sube tal cual.
2. **Editar lo mismo en dos móviles:** gana lo último que **llega** al servidor (como hoy). No se mezclan campos. Es raro (cosas propias, una sola persona).
3. **Borrado en otro móvil y edición mía sin red:** no se «resucita» en silencio. Antes de subir, la app relee el servidor; si la cosa ya no existe, ese cambio pasa a «Revisar» con dos botones: «Recuperarlo» (se vuelve a crear) o «Descartar».
4. **Configuración:** se sube solo lo que cambiaste (claves), como ahora, así dos móviles que tocan cosas distintas no se pisan.
5. Nada se descarta solo: lo único que se tira es lo que el usuario descarta con un botón.

## 2. El aviso

### Dónde y cuándo sale
Principio: **a primera vista, nada, hasta que sea cierto y útil.** Dos estados, solo cuando hay algo que decir:
- **Sin red, nada pendiente:** una fila fina fija arriba (bajo la barra del sistema, encima del contenido; no tapa pestañas ni botones de abajo), con icono de «sin conexión» y el texto **«Sin conexión»**. Se oculta al volver la red. Los detalles (qué se puede y qué no) van a una «i» (`infoI`): «Puedes apuntar gastos y tareas; se subirán al volver. Juntos se puede mirar, no cambiar.» No hay pantalla ni ventana.
- **Con cambios por subir** (con o sin red): la misma fila: **«Sin conexión · 3 cambios por subir»** (sin red) o **«Subiendo 3 cambios…»** (con red, mientras sube). Singular: «1 cambio por subir».
- El texto largo del plan («Sin conexión · se guardará al volver») es largo para 360 px junto con el contador; lo acorto a lo de arriba y el «se guardará» va a la «i».

### Cuando vuelve la red
- La fila cambia a «Subiendo N cambios…» (con icono de sincronizar), y al terminar pasa 2 s a **«Todo al día»** (icono de comprobado) y desaparece. Sin sonido ni vibración.
- Orden de subida: el mismo en que se hicieron, de uno en uno (un movimiento nuevo antes que la aportación que depende de él).

### Si algún cambio falla al subir
- **Fallo de red:** se reintenta solo (cada vez que vuelve la red o se abre la app); la fila sigue en «N cambios por subir». No se pierde.
- **Fallo que no es de red** (el servidor lo rechaza: columna que no existe, permiso, cosa borrada): ese cambio se aparta, la fila pasa a **«1 cambio no se ha subido»** con un icono de aviso (color `--warn`) y botón «Ver».
- «Ver» abre una hoja (no pantalla nueva) con la lista, cada línea con lo que era («Gasto · Comida · 12,50 €»), y por línea: «Reintentar» y «Descartar» (este último pide un segundo toque). Arriba, «Reintentar todos». Nada desaparece sin que se toque «Descartar».
- Si el usuario nunca lo abre, la fila se queda; no hay alertas repetidas ni notificaciones.

### Reglas de diseño
- Iconos de `ICONS` (`ic('nombre')`): hace falta añadir «sin conexión» y «sincronizar» (comprobado y aviso ya existen); sin emojis.
- Alto de la fila: unos 28 px, texto en una línea con `nbEur`/sin partirse; la «i» con zona táctil de 44 px. A 360 px debe caber «Sin conexión · 12 cambios por subir» sin «…» (si no cabe: «12 por subir»). Claro, oscuro y las 4 paletas; contraste igual que `--warn`.
- Las pantallas que se ven con la copia llevan, solo si es muy antigua (más de 7 días), una línea pequeña «Datos del 19 nov» en lugar de nada. Antes de eso, no se dice.
- Texto en «yo» donde haga falta (ej.: «Subiré los cambios en cuanto vuelva la conexión», dentro de la «i»).

## 3. Alcance por tandas

**Tanda 1 (v1, la que de verdad cambia la vida):** copia local + cola que sobrevive a cerrar la app.
- Copia de movimientos, tareas, golf y configuración en IndexedDB, por usuario, borrada al cerrar sesión. Se pinta primero la copia y luego se refresca con la red.
  *Riesgo:* pintar datos viejos como si fueran los de ahora; por eso se refresca siempre al volver la red y se enseña «Datos del…» si es muy vieja.
- Cola de escrituras (movimientos, tareas, config) en IndexedDB, con el número puesto en el móvil; se vacía en orden y de uno en uno.
  *Riesgo:* duplicados o pérdidas si se corta a mitad; se evita con `upsert` por número (ya es así) y quitando de la cola solo tras la respuesta correcta.
- Fila de aviso y hoja de «cambios sin subir».
  *Riesgo:* que moleste o no quepa a 360 px; por eso solo sale con motivo.
- Juntos en solo lectura y bloqueos con su frase.
  *Riesgo:* olvidar un botón que escribe y que falle en silencio; se resuelve con una lista de todas las escrituras (hoy ~35 llamadas a `S.db` + `Data.*`).
- Regla del borrado en otro móvil («Revisar»).
  *Riesgo:* confundir al usuario con la hoja; es rara, texto muy corto.
- Android e iPhone abren ya sin red (la web va dentro).

**Tanda 2:** web sin red (service worker + `manifest`, que hoy no existen).
  *Riesgo:* una versión vieja de la app pegada en el móvil tras publicar; hace falta aviso «Hay una versión nueva» y actualizar al abrir.

**Tanda 3 (después, si hace falta):** copia cifrada en web; subir fotos/ticket pendientes; importar sin red; aportes y Juntos con cola (no recomendado: es lo que más líos crea); avisos de la app de Android al volver la red.

**Se deja fuera a propósito:** escribir en Juntos sin red, leer tickets sin red, mezclar campos de dos móviles.

## 4. Qué se puede probar y qué no

**Automáticas (jsdom, `npm test`):**
- Sin red (`navigator.onLine=false` y escrituras que fallan): abre y pinta desde la copia; apunta un gasto; cierra y reabre (se vuelve a crear la app con la misma copia/cola); vuelve la red: llega **una sola vez** (mismo número), otra vez al reintentar tras un corte a mitad.
- Contador de la fila (1, 2, 12), singular/plural, «Todo al día», fallo que no es de red → «1 cambio no se ha subido» → Reintentar/Descartar.
- Borrado en otro móvil → «Revisar». Config: dos cambios de claves distintas no se pisan.
- Cerrar sesión borra copia y cola (y avisa si hay pendientes).
- Juntos: todos los botones que escriben están apagados sin red (test que recorre la lista).
- Capturas con `revisar.js` a 360/375/390 px, claro y oscuro: fila no cortada, no tapa nada.

**Necesita móvil real (no lo puedo afirmar sin probarlo):**
- Modo avión de verdad en Android e iPhone: abrir, apuntar, matar la app, encender la red.
- Que el sistema no borre la copia (iOS puede limpiar el almacenamiento web si falta espacio; en la app va dentro del contenedor, más seguro).
- Cortes a medias reales (túnel, wifi sin internet), el rebote `online`/`visibilitychange` y el atrás de Android con la hoja abierta.
- Service worker en Safari/Chrome móvil y la «versión vieja».
- Cuánto tarda en abrir con una copia grande (años de movimientos).

## 5. Decisiones para el dueño (con mi recomendación)
1. **¿Cifrar la copia en el móvil?** En Android/iPhone vive en el espacio privado de la app (suficiente para v1). En web no se puede cifrar de verdad sin pedir un código. **Recomiendo:** v1 sin cifrar extra, se borra al cerrar sesión, y se dice en la política de privacidad; cifrado en tanda 3 si hace falta.
2. **¿Se permite compartir un gasto o tocar Juntos sin red?** **Recomiendo no**: Juntos solo se mira. Es lo más seguro con otras personas, aunque a veces haya que esperar.
3. **¿Conflictos: «lo último que llega gana» + «Revisar» si lo borraron en otro móvil?** **Recomiendo sí**: simple, no pierde nada y casi nunca aparecerá, porque cada persona toca sus cosas desde un solo móvil la mayoría de veces. La alternativa (guardar versión y comparar campo a campo) exige una columna nueva en Supabase y no la veo necesaria.

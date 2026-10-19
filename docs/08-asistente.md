# Fase 4 · La bienvenida (asistente de inicio): propuesta de Producto y diseño (19/10/2026)

Imágenes en `docs/img/` (móvil de 375 × 667 px, datos inventados). Las «antes» son capturas reales de la app; los bocetos son una **prueba dibujada aparte**, no la app.

| Archivo | Qué enseña |
|---|---|
| `asis-antes.png` | Pasos 1, 3 y 4 del asistente de hoy, con los problemas numerados como en la tabla 2 |
| `asis-antes-2.png` | El paso final, Inicio al terminar y lo que sale si se toca «Saltar» |
| `asis-boceto-pasos.png` | **Recomendado:** la bienvenida en 4 pasos (oscuro) |
| `asis-boceto-claro.png` | Pasos 1 y 3 en claro, y dónde se aterriza (Inicio, oscuro y claro) |
| `asis-boceto-invitacion.png` | Si se llega con una invitación de Juntos |
| `asis-boceto-repetir.png` | Repetirla desde Tú sin perder nada |

## 1. Conclusión

1. **El asistente de hoy pregunta lo que no hace falta y se calla lo importante.** Pregunta por las categorías (vienen de serie), de dónde entra el dinero, metas, deudas y compra-venta (módulo oculto). No pregunta el saldo del banco ni la nómina, así que al terminar Inicio sale a **0,00 €**. Tampoco cuenta qué es Juntos ni Dinero.
2. **Proponemos 4 pasos, todos saltables, en un minuto:** «Hola» (qué hace la app y tu nombre), «Tu banco» (un número), «Cada mes» (nómina y pagos fijos con un toque) y «Listo» (el mapa de la barra de abajo y una primera acción). Metas, deudas, presupuestos y categorías salen de la bienvenida y se sugieren después en «Empieza aquí».
3. **Quien llega con una invitación de Juntos ve primero la invitación**, se une en el paso 1, pone su saldo (si quiere) y aterriza en el grupo con un «Así funciona Juntos» de tres líneas. Hoy hace 5 pasos sin que nadie le hable del grupo.
4. **Arreglos urgentes antes de que lleguen los dos usuarios nuevos** (tanda 1, sin rehacer nada): que al saltar no salga la ventana de novedades «Parche 7», ocultar a los nuevos las etiquetas NUEVO, el punto verde y el botón «Antes», y quitar los textos viejos («Más», «pestaña Tareas», compra-venta).
5. **Repetirla desde Tú no podrá borrar nada:** solo añade. Hoy reescribe listas enteras (pagos fijos, metas, deudas, categorías) con la copia que hizo al abrirse. Sin cambios en Supabase: todo va en la configuración del usuario.

## 2. Qué falla hoy

Medido en Chromium a 375 × 667 px, oscuro y claro, con un usuario nuevo inventado (sin configuración).

| # | Problema | Medida o prueba |
|---|---|---|
| 1 | **No se sabe cuánto falta:** los puntos de los pasos que faltan no se ven (son del color del fondo) | En el paso 1 se ve 1 punto de 5 |
| 2 | **Textos viejos:** «Todo se puede cambiar después desde **Más**» (ahora es Tú), «en la pestaña **Tareas**» (ya no existe), «Facturas recurrentes» (en la app: «Cobros y pagos recurrentes») | 3 textos |
| 3 | **Pregunta lo que no hace falta:** las categorías solo se pueden mirar (son de serie); los chips «Autónomo», «Inversiones»… solo rellenan una lista; metas y deudas se crean mejor en Dinero (con emoji y «Aportar»); compra-venta pregunta por un módulo oculto (`PROYECTOS_VISIBLE = false`) | 3 de 5 pasos |
| 4 | **No pregunta lo que hace útil la app:** ni el saldo del banco, ni el importe y el día de la nómina, ni el nombre. Al terminar, Inicio dice «0,00 €» y no hay «Previsto» | Captura `asis-antes-2.png`, 5 |
| 5 | **Formularios de ordenador:** fila de pago fijo con 3 casillas sin borde y «Día de cob» cortado; deudas con fecha «mm/dd/yyyy» (formato inglés) y «Recurrencia (ej. mensual)» a mano, que la app no usa; la casilla de categoría propia sale gris clara y su botón + queda suelto debajo | Casillas de 35 px de alto |
| 6 | **Pantallas largas:** obligan a bajar | Categorías 858 px; Ingresos 756 px (con un pago fijo, 800) |
| 7 | **Botones pequeños:** «Guardar y salir» y los chips | 24 px y 32 px de alto (lo cómodo es 44) |
| 8 | **Al saltar sale la ventana «Parche 7»** («¡PalomApp se ha actualizado!») a quien nunca vio la versión anterior. Además, durante 3 semanas ve etiquetas NUEVO, el punto verde en su inicial y, en cuanto apunta algo, el botón de pruebas «Antes» | Probado: saltar → ventana de novedades. 3 etiquetas NUEVO en Tú |
| 9 | **No enseña las funciones grandes:** ni Juntos, ni la foto al ticket, ni importar el extracto, ni Dinero. Solo menciona las tareas | — |
| 10 | **Con invitación:** se hacen los 5 pasos sin mencionar el grupo; la invitación sale al final y, si se saltó el asistente, después sale también la ventana de novedades: tres ventanas seguidas | Leído en el código (`maybeUnirse`, `maybeNovedades`); no probado de punta a punta |
| 11 | **Repetir pisa datos:** al terminar escribe las listas enteras con la copia del principio. Lo que se cambie en otro móvil mientras tanto se pierde, y si se desmarca una categoría propia se borra con su presupuesto | Leído en el código (`doObFinish`) |

Modo claro: capturado; se lee bien y tiene los mismos problemas.

## 3. Cómo debe quedar

**Forma de todos los pasos:** arriba, flecha atrás, barra de 4 tramos y «Saltar» (44 px); «PASO 2 DE 4» debajo. El botón principal, **abajo y fijo**, al alcance del pulgar. Lo que se escribe se guarda al pasar de paso, así que salir a medias no pierde nada. «Saltar» guarda lo hecho y va a Inicio. Sobrio en lo que informa; juguetón al terminar (confeti suave y vibración, que ya existen).

### 3.1 Los 4 pasos (`asis-boceto-pasos.png`)

| Paso | Se pregunta | Se enseña | Textos exactos |
|---|---|---|---|
| 1 · Hola | Tu nombre (relleno con lo que sale del correo) | Las 4 cosas grandes, una fila cada una con icono de color | Título «¡Hola! 👋». Texto «Esto es PalomApp: tu dinero, tus gastos y lo que compartes, en un solo sitio. Lo dejamos listo en un minuto.» Filas: «Apunta un gasto en dos toques · o hazle una foto al ticket»; «Mira cuánto te queda este mes · y en qué se te va el dinero»; «Comparte gastos en Juntos · quién debe a quién, y saldar con un toque»; «Tus cuentas, metas y deudas · todo en Dinero, de un vistazo». Campo «¿Cómo te llamas?», ayuda «Así te verán las personas con las que compartas gastos.» Botón «Empezar» |
| 2 · Tu banco | Nombre de la cuenta y saldo de hoy (entiende «1.240,50»). Opcional: otra cuenta | Que la app no se conecta al banco | Título «¿Cuánto tienes hoy en el banco?». Texto «Mira la app de tu banco y copia el saldo de tu cuenta principal. Desde aquí, PalomApp suma y resta lo que apuntes.» Campos «Nombre de la cuenta» (pone «Banco») y «Saldo de hoy». Enlace «+ Añadir efectivo u otra cuenta». Nota con candado «No nos conectamos a tu banco. Solo tú ves tus cifras.» Botones «Ahora no» y «Siguiente» |
| 3 · Cada mes | Nómina (importe opcional y día) y pagos fijos con un toque. «Tu mes» **solo si cobra del día 20 en adelante** | Para qué sirve | Título «¿Qué se repite cada mes?». Texto «Así te avisamos de lo que toca y verás cómo acabarás el mes.» Apartado «LO QUE COBRAS»: chip «Nómina», importe y «día». Si el día es 20 o más: «**Cobras el 28.** ¿Quieres que tu mes vaya de nómina a nómina?» con «Del 1 al 31» y «Del 28 al 27». Apartado «LO QUE PAGAS FIJO»: chips «Alquiler», «Luz», «Internet y móvil», «+ Otro» (que abre Hipoteca, Agua, Gimnasio, Suscripciones o un nombre libre); cada chip marcado añade una fila: nombre, importe (pone «aprox.») y día. Botones «Ahora no» y «Siguiente» |
| 4 · Listo | Nada | Resumen de lo puesto, el mapa de la barra de abajo y dónde está Tú | Título «¡Todo listo, Lucía!» (sin nombre: «¡Todo listo!»). Chips solo con lo que se haya puesto: «🏦 Banco 1.240,50 €», «💼 Nómina el 28», «📅 2 pagos fijos». «ASÍ SE MUEVE UNO POR LA APP» y la barra dibujada: Inicio «cómo vas», Movimientos «todo lo apuntado», + «Apuntar · gasto, ticket…», Juntos «con otros», Dinero «cuentas y metas». Nota «Tus ajustes, categorías y esta bienvenida están en Tú: tu inicial, arriba a la derecha.» Botón «Apuntar mi primer gasto» y enlace «Ir a Inicio» |

Si la lectura de tickets no está activa, la primera fila del paso 1 dice «o trae el extracto de tu banco». Con dos o más pagos fijos, el paso 3 se desplaza (el botón sigue fijo abajo).

**Cómo se guarda (para Desarrollo):** la cuenta, como `cuentaAnadir`/`cuentaCampo` (saldo y fecha de hoy, principal); la nómina y los pagos fijos, como `recGuardar` (con `desde` = hoy, regla «día», categoría con `catDeRecibo` y la cuenta principal), para que no pregunte «¿Pagado?» por fechas anteriores a darse de alta. El nombre, en `cfg().nombre` y lo usa `nombreSugerido()`.

### 3.2 Dónde se aterriza (`asis-boceto-claro.png`)

| Bloque de Inicio | Usuario nuevo (sin movimientos) |
|---|---|
| Tarjeta de arriba | «En tu banco hoy **1.240,50 €**» en vez de «0,00 €». Debajo, dos fichas: «Te queda este mes · Aún sin datos» y «PREVISTO · Cobras el 28» (siempre marcado como previsión) |
| Estos días | La nómina y los pagos fijos que vienen, como previstos: «Mié 28 · Nómina · +1.850 €», «Dom 1 nov · Alquiler · −720 €» |
| Empieza aquí | 2 pasos: «Apunta un gasto o hazle foto a un ticket» y «Trae el extracto de tu banco». Si no puso saldo, el primero es «Pon el saldo de tu banco». Metas, presupuestos y compartir aparecen después en «Sácale más partido» (como hoy) |

### 3.3 Si llega con una invitación (`asis-boceto-invitacion.png`)

| Paso | Textos exactos |
|---|---|
| 1 · La invitación | Tarjeta del grupo (emoji, nombre, caras, «Te invita Marta · 3 personas»). Título «Marta te invita a compartir gastos». Texto «Quien paga lo apunta, la app reparte y siempre sabéis quién debe a quién.» Campo «Tu nombre en el grupo». Ayuda (la de hoy) «Tus movimientos siguen siendo privados: el grupo solo ve lo que compartas en él.» y «¿No es tu cuenta?». Botón «Unirme al grupo» («Aceptar» si es una invitación entre dos). Arriba, «Ahora no» |
| 2 · Tu banco | Aviso verde «✓ Ya estás en Piso Lavapiés» y el paso 2 de siempre (saltable). Barra de 3 tramos |
| 3 · Listo | Chips «✓ En Piso Lavapiés» y el saldo. Botón «Ver Piso Lavapiés»; enlace «Ir a Inicio» |
| En el grupo | Una tarjeta, una sola vez: «Así funciona Juntos · 1 · Quien paga, lo apunta con + · 2 · La app reparte entre todos · 3 · Cuando queráis, «Saldar» y listo» y «Entendido» |

«Cada mes» no se pregunta aquí: sale en «Empieza aquí». Si el enlace caducó o ya se usó, el paso 1 enseña el mensaje de hoy y el botón «Seguir sin unirme», que lleva a la bienvenida normal. El enlace personal de quien tenía un sitio guardado («Te han guardado un sitio») funciona igual, con su pregunta de hoy («¿Esos gastos cuentan también en tus números?»).

### 3.4 Repetirla desde Tú (`asis-boceto-repetir.png`)

- En Tú → App, «Repetir asistente de configuración» pasa a **«Volver a ver la bienvenida»** (se encuentra también buscando «asistente»).
- Los mismos 4 pasos con lo que ya hay. Paso 2: «Tus cuentas · Ya tienes estas. Aquí no se borra nada: solo puedes añadir.» y «¿No coincide con tu banco? Usa Cuadrar en la cuenta: ajusta el saldo y no toca tus movimientos.» Paso 3: lo fijo que ya existe sale marcado con ✓ y no se edita aquí: «Para cambiar o quitar uno: Tú → Cobros y pagos recurrentes.»
- Al repetir no se tocan novedades, etiquetas, «Antes» ni «Tu mes» (salvo que se elija).

## 4. Las tres listas

### NOVEDADES (se añade)

| Qué | Por qué |
|---|---|
| Las 4 cosas grandes de la app en el paso 1 | Hoy no se explica ni Juntos ni Dinero |
| «¿Cómo te llamas?» | Hoy el nombre sale del correo («nuevo@…» → «Nuevo») y es el que ven los demás en Juntos |
| Saldo del banco (y otra cuenta opcional) | Inicio y Dinero tienen algo real desde el minuto uno |
| Nómina con importe y día, y pagos fijos con un toque | Activa «Previsto», «Estos días» y los avisos «¿Pagado?» |
| «Tu mes» en contexto («Cobras el 28…»), solo si cobra a final de mes | Hoy es una pregunta abstracta para todos |
| Paso «Listo» con el mapa de la barra y «Apuntar mi primer gasto» | Termina con una acción, no en una pantalla vacía |
| La invitación de Juntos como paso 1 y aterrizaje en el grupo con «Así funciona Juntos» | Es a lo que viene la mayoría de nuevos |
| Inicio de usuario nuevo con «En tu banco hoy» y lo previsto | Hoy sale «0,00 €» |

### MEJORAS (se cambia)

| Qué | Cómo |
|---|---|
| Progreso | Barra de 4 tramos visible y «Paso 2 de 4» |
| Botones | Principal abajo y fijo; «Saltar» arriba; todo de 44 px o más |
| Al saltar o terminar (solo usuarios nuevos) | No sale la ventana de novedades; sin etiquetas NUEVO ni punto verde; sin botón «Antes» |
| Guardado | Paso a paso; si se cierra a medias, se sigue donde se dejó |
| Repetir desde Tú | «Volver a ver la bienvenida», con lo que hay y solo añadiendo |
| Ingresos de serie | Si la lista está vacía, se ponen «Nómina», «Transferencias», «Wallapop/Vinted» y «Otros», para que al apuntar un ingreso haya donde elegir |
| Pagos fijos | Se guardan como los de Tú (con fecha de alta y categoría), no a medias |

### ELIMINAR (se quita)

| Qué | Dónde queda |
|---|---|
| Paso «Categorías de gasto» y la casilla de categoría propia | Tú → Categorías y presupuestos |
| Chips «¿De dónde entra tu dinero?» | Sustituidos por la nómina y los ingresos de serie |
| Paso «Ahorro y deudas» (filas con fecha «mm/dd/yyyy» y «Recurrencia») | Dinero → «+ Nueva» meta o deuda; sugerido en «Empieza aquí» |
| Pregunta de compra-venta (Wallapop, Vinted…) | Ninguno: el módulo está oculto. Lo ya guardado (`proyectosInteres`) no se borra |
| Tarjeta «tareas en la pestaña Tareas» | La Agenda está en Inicio |
| «Guardar y salir» en cada paso | «Saltar» arriba |
| Código sin uso (`ONB_CATS`, `ob.cats`, `obToggleProyecto`…) | — |

## 5. Tandas de trabajo

| Tanda | Qué | Esfuerzo | Pruebas que cambian |
|---|---|---|---|
| 1 · Urgente | Al saltar, sin ventana de novedades; nuevos sin NUEVO, punto verde ni «Antes»; textos «Más» y «Tareas»; quitar compra-venta; barra visible; «Guardar y salir» a 44 px | Bajo | `test.js` (compra-venta y saltar) |
| 2 · Bienvenida nueva | Los 4 pasos, guardado por paso, nombre, ingresos de serie | Medio | `test.js` (casos 1 a 3 se reescriben) |
| 3 · Invitación primero | Paso de invitación, aterrizaje en el grupo, «Así funciona Juntos» | Medio | Nueva prueba de usuario nuevo con `?unirse=` |
| 4 · Aterrizaje y repetir | Inicio de usuario nuevo con banco y previstos; repetir en modo «solo añadir» | Bajo-medio | Las de Inicio de usuario nuevo |

Orden: 1 → 2 → 3 → 4. **La tanda 1 se puede publicar sola** y conviene que esté antes de que entren los dos usuarios nuevos.

## 6. Riesgos

- **Que un usuario actual vea la bienvenida otra vez.** Se mantiene la misma marca (`config/meta.onboarded`): quien la tiene no la ve nunca. Además, no se abrirá sola si la cuenta ya tiene movimientos, cuentas o grupos. Las pruebas actuales de «usuario existente: no sale» se conservan.
- **Perder datos al repetirla.** Solo se añade, comparando por nombre (sin duplicar «Nómina» ni «Alquiler»); nunca se reescriben listas enteras ni se tocan metas, deudas o categorías; los saldos solo cambian con «Cuadrar».
- **Saldo mal escrito** («1.240» leído como 1,24): usar `numCampo`, que ya entiende «8.000» y «1.234,56», y enseñar la cifra en grande antes de seguir.
- **La invitación falla o tarda** (sin red, enlace caducado): el paso 1 avisa y deja seguir sin unirse; la invitación se puede abrir otra vez desde el enlace.
- **Dos nombres distintos:** el de la bienvenida y el del grupo. Al unirse se propone el mismo; si luego se cambia en un grupo, no cambia en los demás (como hoy).
- **Ocultar «Antes» a los nuevos** hace que no puedan comparar versiones. Es lo buscado: el botón es para las pruebas del dueño.

## 7. Preguntas para el dueño

1. **(Bloquea la tanda 1)** ¿Ocultamos a los usuarios nuevos la ventana de novedades, las etiquetas NUEVO, el punto verde y el botón «Antes»? **Recomendado: sí**: todo eso habla de cambios que ellos no han vivido.
2. **(Bloquea la tanda 2)** ¿La bienvenida pregunta el **saldo del banco** y **lo fijo de cada mes** (las dos cosas saltables)? **Recomendado: sí**, es lo que hace que Inicio no salga a cero. Alternativa: solo enseñar la app y dejar las preguntas para «Empieza aquí».
3. **(Bloquea la tanda 3)** Si llega con una invitación de Juntos: **A) la invitación primero y bienvenida corta (recomendado)**; B) como hoy, la invitación al final; C) sin bienvenida, directo al grupo.
4. Si cobra a final de mes, ¿qué sale marcado en «Tu mes»? **Recomendado: «Del 1 al 31»** (lo de siempre, sin sorpresas), con la otra opción a un toque. Alternativa: marcar «de nómina a nómina».

## 8. Lo que no hemos podido averiguar o confirmar

- Nada probado en un móvil real: capturas con Chromium a 375 × 667 px y datos inventados. No medido a 320 px ni con texto grande.
- El camino completo con invitación (asistente → invitación → novedades) está leído en el código, no ejecutado: el navegador de pruebas no tiene grupos.
- Que los pagos fijos guardados por el asistente de hoy, sin fecha de alta, pregunten «¿Pagado?» por fechas de antes de darse de alta está leído en el código (`avisosRecurrentes`), no visto.
- No sabemos si los dos usuarios nuevos llegarán por invitación ni si la lectura de tickets está activa para cuentas nuevas (depende de `activosDisponible`).
- Los bocetos usan la fuente Inter e iconos aproximados; el paso 3 con dos pagos fijos ya necesita desplazarse.

## 9. Fuentes

- Código de la app (`app.js`: `freshOnboardingState`, `checkOnboarding`, `maybeStartOnboarding`, `renderOnboarding`, `obWelcome`, `obCats`, `obIncome`, `obSavingsDebt`, `obClose`, `doObFinish`, `capturarEnlaceUnirse`, `maybeUnirse`, `maybeReclamar`, `maybeNovedades`, `BADGES`, `badgeActivo`, `compararOn`, `empiezaPasos`, `heroMesHtmlV2`, `recGuardar`, `avisosRecurrentes`, `cuentasHtml`; `tests/test.js`), 19/10/2026.
- `docs/01-inicio.md` («¿Qué día cobras?» pasa al asistente), `docs/04-juntos.md`, `docs/05-dinero.md`.
- Capturas y medidas propias con datos inventados, 19/10/2026.

Para el PDF: poner lado a lado el paso «Ahorro y deudas» de hoy (`asis-antes.png`, 3) y el paso «Cada mes» del boceto, y el Inicio a «0,00 €» (`asis-antes-2.png`, 5) junto al Inicio con «En tu banco hoy» (`asis-boceto-claro.png`, 3). Un embudo de 5 pasos → 4 pasos (3 con invitación) se vería bien.

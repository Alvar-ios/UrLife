# Fase 4 · Agenda y botón +: propuesta de Producto y diseño (22/10/2026)

*Una sola propuesta recomendada, lista para programar hoy. Sin cambios en Supabase ni campos nuevos en `tareas`. Leído en el código (`renderAgendaSemana`, `renderCalendario`, `renderTareaRow`, `openTareaForm`, `crearHtml`); no medido en un navegador.*

## 1. Conclusión

1. **Apuntar una tarea enseña hoy 6 campos de golpe.** Proponemos una **casilla rápida arriba de la Agenda** («Apunta una tarea para hoy…» + Enter) y un formulario corto: qué, para cuándo (Hoy · Mañana · Este finde · Sin fecha · Otro día) y categoría. Prioridad, repetir y nota quedan en «Más opciones».
2. **La semana repite las tareas tres veces** (en el día, en «Próximos días» y en «Todas tus tareas»). Proponemos que cada tarea salga **una sola vez**: Vencidas · el día elegido · Próximos 7 días · Sin fecha, y abajo «Más adelante» y «Hechas» plegados.
3. **Hay dos vistas de semana** (la de tareas y la «Semanal» del calendario). Se queda una: la Agenda pasa a **«Tareas | Calendario»** y el calendario es solo el mes, con una **leyenda de colores que sirve de filtro**.
4. **El botón + ordena por uso:** foto de ticket, luego cuatro grandes (Gasto · Ingreso · Compartido · Tarea), una fila **«Repetir»** con tus 3 gastos más repetidos (un toque y solo falta confirmar) y debajo, en pequeño, lo demás. No se quita ninguna opción.
5. **El círculo para completar una tarea mide 28 px:** pasa a 44 px de zona táctil (el dibujo sigue igual). Al dejar el día sin nada: vibración suave y «¡Día despejado!».

## 2. Agenda · «Tareas» (antes «Semana y tareas»)

Se entra como hoy: Inicio → «Estos días · Agenda ›». Arriba, «‹ Inicio» y el selector **«Tareas | Calendario»**.

| # | Bloque, en este orden | Texto exacto y comportamiento |
|---|---|---|
| 1 | **Cabecera de la semana** | «Semana del 19 al 25 oct» con `chevL` / `chevR` a la derecha (44 px). Si no es la semana actual, una ficha «Hoy» que vuelve |
| 2 | **Tira de 7 días** | Como hoy (letra, número, punto si hay algo), pero **sin las flechas a los lados**: los días ocupan todo el ancho (unos 46 px cada uno en 375 px). Hoy en acento; el elegido con borde |
| 3 | **Casilla rápida** | Campo «Apunta una tarea para hoy…» (cambia con el día: «…para mañana», «…para el jueves 23») y botón redondo `plus` de 44 px. Enter o el botón la crean al momento; la casilla se vacía y **el teclado sigue abierto** para apuntar otra. Aviso «Tarea añadida» con «Deshacer» |
| 4 | **Vencidas · N** (solo si hay) | Título en `--expense`. Filas de tarea normales (se pueden completar ahí mismo). Como mucho 3 y «Ver las 5». Sustituye a la tarjeta roja de hoy |
| 5 | **El día elegido** | «Hoy, miércoles 22» (como hoy). Tareas del día y cobros o pagos fijos de ese día. Vacío: `checkCircle` en acento y «Día despejado.» |
| 6 | **Próximos 7 días** | Como «Próximos días» de hoy, pero 7 días y no 14. Como mucho 5 filas y «Ver todo» |
| 7 | **Sin fecha · N** (solo si hay) | Las tareas pendientes sin fecha límite, por prioridad. Hoy solo salen en la lista larga |
| 8 | **Dos enlaces plegables** | «Más adelante · 4» (lo que vence después de 7 días) y «Hechas · 12» (las últimas 20, con «Hecha el 21 oct» y el círculo para reabrir) |

**Se quita:** la lista «Todas tus tareas» con «Pendientes | Completadas» (todo sale ya arriba, una vez), la tarjeta roja de vencidas y el enlace «+ Tarea» del título del día (lo sustituye la casilla rápida).

**Para Desarrollo:**
- La casilla rápida crea `{ nombre, categoria: tCatSugerida(nombre, lista) || '', prioridad: 'Media', estado: 'Pendiente', fechaLimite: S.agendaDia || hoy, fechaCreacion: hoy, fechaInicio: null, fechaFin: null, comentario: '', repetir: null }` con `S.db.collection('tareas').add`. Los mismos campos que `saveTarea`: nada nuevo. La categoría sugerida se añade a `categoriasTareas` igual que hoy.
- «Deshacer» la borra (sin pasar por la papelera, porque acaba de nacer).
- Círculo de completar: el dibujo de 28 px dentro de una zona de 44 × 44 px (`padding` o `::before`), para no tocar la fila por error.
- Al completar la última tarea del día elegido: `sentir('hito')` y el aviso «¡Día despejado!» (en vez de «¡Tarea completada!»). Es el único momento juguetón; lo demás, sobrio.
- Lo plegado se guarda en `S.agendaMas` (`'adelante'`, `'hechas'` o nada), sin guardar nada en la configuración.

## 3. Agenda · «Calendario»

| # | Cambio | Texto exacto y comportamiento |
|---|---|---|
| 1 | **Solo el mes** | Se quita «Mensual · Semanal · Hoy». Arriba: `chevL` «Octubre 2026» `chevR`, y la ficha «Hoy» solo si no estás en el mes actual |
| 2 | **Leyenda que filtra** | Debajo de la cuadrícula, en vez de las 4 fichas de arriba: «● Tareas · ● Cobros y pagos · ● Metas y deudas · ○ Movimientos», cada punto con su color (`evColor`). Tocar una la enciende o apaga (`calToggle`, como hoy). Así se entiende qué es cada punto |
| 3 | **Días** | Hoy con círculo de acento relleno; el elegido con borde de acento (hoy son igual de parecidos). Alto mínimo 48 px (como hoy) |
| 4 | **Lista del día** | Título «Jueves 23 de octubre» y a la derecha el enlace «`plus` Tarea», que abre el formulario con ese día ya puesto. Vacío: «Nada este día.» |
| 5 | **Estilos** | Las reglas que hoy van escritas dentro del HTML (`style="…"`) pasan a clases en `look.css`, para que el claro y el oscuro se vean bien |

## 4. Formulario de tarea

| Orden | Campo | Texto exacto |
|---|---|---|
| 1 | Título | «Nueva tarea» / «Editar tarea» |
| 2 | Qué | Campo grande sin etiqueta, ya con el cursor: «¿Qué hay que hacer?» (ejemplo gris: «Llamar al casero, renovar el DNI…») |
| 3 | Para cuándo | «¿Para cuándo?» y fichas: «Hoy» · «Mañana» · «Este finde» · «Sin fecha» · `calendar` «Otro día…» (abre el selector de fecha y la ficha pasa a decir «Vie 31 oct»). «Este finde» es el próximo sábado (o hoy si es sábado o domingo) |
| 4 | Categoría | Como hoy, con la ficha «· sugerida» |
| 5 | Estado (solo al editar) | «Pendiente» · «En curso» · «Hecha». Se guardan como hoy (`Pendiente`, `Iniciado`, `Completado`); solo cambia lo que se lee |
| 6 | «Más opciones» `chevD` | Despliega: Prioridad («Baja · Media · Alta», por defecto Media), Repetir (como hoy) y «Nota» (hoy «Comentario»). Se abre sola al editar una tarea que tenga prioridad distinta de Media, repetición o nota |
| 7 | Botones | «Cancelar» y «Guardar»; al editar, debajo, «`trash` Eliminar tarea» (a la papelera, como hoy) |

**Fecha por defecto:** desde el + o la lupa, «Sin fecha» (como hoy); desde la Agenda o el calendario, el día que estés mirando. Para eso `openTareaForm(id, { fecha })`.

**Se quita del formulario:** nada. Prioridad, repetir y nota solo se esconden.

## 5. Hoja del botón +

| Orden | Bloque | Contenido (texto exacto) |
|---|---|---|
| 1 | Título | «¿Qué quieres apuntar?» (como hoy) |
| 2 | Banda «Foto de ticket» | Como hoy, con los avisos de lecturas de `docs/09-tu-ajustes.md` (apartado 3) |
| 3 | **Cuatro grandes** | `arrowDown` Gasto · `arrowUp` Ingreso · `users` Compartido · `checkCircle` Tarea. Sin Juntos disponible, tres. Baldosas como las de hoy (icono de 42 px) |
| 4 | **Repetir** (solo si hay) | Etiqueta «REPETIR» y hasta 3 fichas con `repeat`: «Café · 1,80 €», «Mercadona · 42,50 €». Un toque abre el gasto ya relleno con fecha de hoy y el importe seleccionado para cambiarlo si hace falta |
| 5 | **Lo demás**, en pequeño | Fila de baldosas bajas (icono de 32 px, texto de 12,5 px), 3 por fila: `piggy` Apartar · `chart` Invertir · `calendar` Gasto fijo · `card` Pago de deuda · `swap` Traspaso (con 2 o más cuentas) · `download` Importar |

**Cómo se eligen los de «Repetir»:** gastos propios (tipo Gasto, no fijos ni compartidos) de los últimos 45 días; se agrupan por categoría y descripción (sin mayúsculas ni tildes); solo los que se repiten 2 veces o más; se ordenan por veces y luego por el más reciente. La ficha dice la descripción (o la categoría si no hay) y el importe del último. Se abre con `openMovForm(null, { tipo: 'Gasto', importe, categoria, subcategoria, descripcion, cuentaId })`, que ya acepta esos datos. Se calcula al abrir la hoja; no se guarda nada.

**El orden es fijo, no cambia según el uso:** así el dedo aprende dónde está cada cosa. Solo «Repetir» es personal.

Medida a ojo en 375 × 667: unos 470 px, cabe sin desplazarse (hoy unos 520).

## 6. Lo que se guarda en «Antes»

| Clave nueva en `VERSIONES` | Variantes | Qué conserva | Dónde se ve el botón |
|---|---|---|---|
| `agenda` | «Nueva» · «Antes» | `renderAgendaSemana`, `renderCalendario` (con «Semanal») y `openTareaForm` de hoy | En la Agenda: `seccionVersion()` devuelve `'agenda'` si `S.tab === 'inicio'` y `S.inicioVista` es `tareas` o `calendario`. El formulario sigue a la Agenda |
| `crear` | «Nueva» · «Antes» | `crearHtml` de hoy | El botón flotante no se ve sobre una hoja, así que la hoja del + lleva abajo un enlace discontinuo «Ver la versión anterior» (estilo `comparar-fab`), solo si `compararOn()` |

Los tests antiguos de la Agenda y del + usarán `version:{agenda:1}` y `version:{crear:1}`, como en Juntos y Dinero.

## 7. Riesgos

- **Quitar «Todas tus tareas»** puede despistar a quien buscaba ahí una tarea de dentro de un mes: está en «Más adelante». El buscador de la lupa también las encuentra.
- **La casilla rápida crea tareas al pulsar Enter:** si alguien escribe a medias y pulsa Enter, se crea. Por eso el «Deshacer».
- **«Repetir» enseña importes de gastos recientes** en una hoja que se abre a menudo. Solo los ve la persona en su móvil, como el resto de la app.
- **Quitar la vista «Semanal» del calendario:** si alguien la usaba para ver los cobros de la semana, ahora salen en la tira de «Tareas» (punto en el día y fila en el día elegido).

## 8. Preguntas que debe decidir el dueño

1. ¿Te parece bien quitar la vista «Semanal» del calendario? Recomendado: sí (queda en «Antes»). No bloquea.
2. ¿«Repetir» en el + con 3 fichas? Recomendado: sí. No bloquea.

## 9. Lo que no hemos podido averiguar o confirmar

- No medido en un navegador (no hay uno instalado en este equipo): las alturas son cálculos a ojo con los tamaños de `app.css` y `look.css`.
- No sabemos cuántas tareas tiene cada usuario ni cuántas sin fecha: no se pueden mirar datos reales.
- No probado que el teclado del iPhone se quede abierto tras Enter en la casilla rápida (en Android suele quedarse).

## 10. Fuentes

- `app.js`: `renderAgendaSemana` (l. 3232), `renderInicioNuevo` (l. 3337), `crearHtml` (l. 4301), `calEventos` y `renderCalendario` (l. 5266–5347), `renderTareaRow` y `openTareaForm` (l. 5900–5960), `saveTarea` (l. 5994), `crearIr` (l. 7450). Consultado el 22/10/2026.
- `app.css`: `.check-btn` (28 px), `.semana`, `.crear-grid`. Consultado el 22/10/2026.
- `docs/ROADMAP.md`, fila 4. Consultado el 22/10/2026.

Para el PDF: tres móviles en fila (Agenda «Tareas» con la casilla rápida y «Día despejado», el calendario con la leyenda debajo, y la hoja del + con los cuatro grandes y la fila «Repetir»).

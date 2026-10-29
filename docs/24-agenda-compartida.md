# Tareas compartidas y agenda compartida: propuesta de Producto y diseño (29/10/2026)

*Encargo del dueño (29/10/2026): «3.1. Tareas compartidas relacionadas con grupos o personas. 3.2. Que las agendas se puedan compartir entre personas de confianza (familia, pareja), con tareas privadas u ocultas.» El 3.2 necesita cambios en Supabase (solo aditivos): **antes de programar, pasa por Datos y seguridad** (apartado 5). No se ha aplicado nada.*

Bocetos en `docs/img/` (dibujados sobre la app con datos inventados, 390 px; **no son la app**):

| Archivo | Qué enseña |
|---|---|
| `24-tarea-compartida.png` | 3.1: formulario con «Con» (grupo o persona) y «¿Quién se encarga?»; hoja de una tarea encargada a otra persona con «Recordárselo a Bea»; el formulario en oscuro |
| `24-compartir-agenda.png` | 3.2: «Compartir mi agenda» (quién ve la mía y de quién veo yo), «Qué ve» (3 niveles y «Dejar de compartir») y una tarea «Privada» |
| `24-agenda-encima.png` | 3.2: la Agenda con la de otros encima (fila de caras para encender y apagar), en claro y oscuro |

## 1. Conclusión

1. **El 3.1 ya está hecho en un 70 %.** Desde el 23/10 existen los «Planes» y las tareas de grupo (tabla `agenda`): quién se encarga («Bea» o «quien pueda»), «Hecha por Bea» y cualquiera del grupo puede marcarla. Falta lo que lo hace cómodo: **elegir a una persona** aunque no tengáis aún un «directo», que **la otra persona se entere** (un aviso en su Inicio), **«Recordárselo» por WhatsApp**, compartir una tarea que ya tenías y un solo formulario. Todo eso **sin tocar Supabase**.
2. **El 3.2 es otra cosa y sí es nuevo:** «Compartir mi agenda» con una persona o un grupo, eligiendo **qué ve**: **Todo**, **Solo los títulos** o **Solo si estás ocupada**. **Por defecto no se comparte nada.** Cada tarea o plan puede marcarse **Privada**: entonces no sale ni como «ocupada».
3. **Lo privado no llega nunca al móvil de otra persona.** Nadie podrá leer tu tabla de tareas. La otra persona pide tu agenda a una función del servidor que **ya la devuelve recortada**: sin lo privado, sin títulos si el nivel es «ocupada» y sin notas si es «solo títulos». No basta con esconderlo en pantalla, y aquí no se esconde: directamente no se envía.
4. **La agenda de otros se ve encima de la tuya**, en la misma Agenda: una fila de caras («Yo · Dani · Mamá») que se encienden y se apagan; lo suyo va con su color y su cara, y no se puede tocar. **Inicio no cambia** (no se llena con lo de los demás).
5. **Orden:** primero el 3.1 (tanda 1, sin Supabase), después el 3.2 (tablas nuevas revisadas por Datos, luego las pantallas). Hay **3 preguntas que bloquean** el 3.2 (apartado 8).

## 2. Qué existe hoy y qué falta

| Pieza | Hoy (comprobado en `app.js`, `data-layer.js` y la migración `agenda_planes`) | Falta |
|---|---|---|
| Tarea de grupo | Sí: tabla `agenda`, tipo «tarea», siempre con grupo | — |
| Con una persona | Solo si ya existe un «directo» con ella (`gruposParaPlanes`) | Que salgan las personas de tus grupos y el «directo» se cree al guardar, como ya pasa al compartir un gasto (`crear_directo`) |
| Quién se encarga | Una persona o «Quien pueda» | — (varias personas a la vez, no: complica «hecha») |
| Hecha por | Sí, lo pone el servidor; cualquiera del grupo la marca (`agenda_hecha`) | — |
| Avisos | Solo los planes, en «Estos días», si abres la app | Que a quien le encargan algo le salga «Lucía te ha encargado…» (estaba propuesto en `docs/16` y no se hizo) |
| Crear | «Nueva tarea» es personal; para compartir hay que pasar a «Plan», elegir grupo y volver a «Tarea». Si estás en «Solo yo», el botón «Tarea» te devuelve al formulario personal | Un solo formulario de tarea con «Con: Solo yo · grupos · personas» |
| Compartir una tarea que ya tenía | No existe | «Compartir» al editarla |
| Repetir | Solo en las personales | Opcional (pregunta 5) |
| Ver tareas encargadas a otros | Solo dentro del grupo | Plegable «Encargadas a otros · N» al final de la Agenda |
| Ver la agenda de otra persona | No existe | Todo el 3.2 |
| Texto | La hoja dice «Lo añadió tú» | «Lo añadiste tú» (fallo pequeño encontrado al revisar) |

## 3. Propuesta 3.1: tarea compartida (`24-tarea-compartida.png`)

| Paso | Qué ves (texto exacto) |
|---|---|
| Crear | Botón + → «Tarea», o la casilla rápida de la Agenda y luego «Más». Formulario «Nueva tarea»: qué, «¿Para cuándo?» y **«Con»**: «Solo yo» (elegido de inicio) · tus grupos (`users`) · tus personas (su cara). Al elegir algo que no sea «Solo yo», el título pasa a «Nueva tarea compartida», se esconden prioridad y categoría y sale «¿Quién se encarga?» |
| Encargar | Caras: «Quien pueda» · «Tú» · cada persona. Si eliges a otra, debajo: `bell` «Bea lo verá arriba en su Inicio: «Lucía te ha encargado: Bajar la basura de cartón».» |
| Lo ve la otra persona | En su Inicio, en «Estos días», **una sola fila** aunque haya varias: «Lucía te ha encargado «Bajar la basura de cartón»» / «Piso · para el sáb 31». Si hay más: «3 cosas nuevas en tus grupos». Se da por visto al abrir la Agenda |
| Recordar | En la hoja de una tarea encargada a otro: «`send` Recordárselo a Bea». Abre WhatsApp con «Hola Bea, te recuerdo: Bajar la basura de cartón (para el sábado). Lo tienes en PalomApp.» Nada sale del servidor |
| Hecha | Como hoy: «Hecha por Bea · hace 2 h», tachada; «Deshacer» en el aviso |
| Lo que encargaste | Al final de la Agenda, plegado: «Encargadas a otros · 2» |
| Compartir una tarea tuya | Al editarla, «Con» también sale. Se crea la compartida, se borra la personal y avisa «Compartida con Piso · Deshacer» |

Para Desarrollo: sin migración. Lo visto, en `cfg().agendaVisto` (ya previsto en `docs/16`), guardado solo si había algo nuevo. Quién te encargó algo se sabe por `creadoPor`/`editadoPor` y `asignadoA`. La fila nueva cuenta dentro de las 2 filas de «Estos días», así que **Inicio no crece**.

## 4. Propuesta 3.2: compartir mi agenda (`24-compartir-agenda.png`, `24-agenda-encima.png`)

### 4.1 Con quién y qué ven

| Decisión | Propuesta | Por qué |
|---|---|---|
| Dónde se activa | Tú → «Compartir mi agenda», y un enlace en la Agenda («`users` La ven Dani y Familia» bajo la semana, para que nunca se te olvide que está activo) | Se ve siempre quién mira |
| Con quién | Una **persona** con cuenta de tus grupos, o un **grupo** entero. Las personas sin cuenta, no | Solo gente que ya está contigo en PalomApp |
| Qué ven | **Todo** (título, hora, lugar y nota) · **Solo los títulos** (qué y cuándo) · **Solo si estás ocupada** (un hueco rayado «Ocupada · 18:00», sin título) | Los tres niveles que usan Google Calendar y Cupla |
| Qué incluye | Interruptores «Planes» y «Tareas con fecha». Las tareas sin fecha y las hechas, nunca. En «Solo si estás ocupada» las tareas no salen (no tienen hora) | Google tampoco enseña las tareas sin hora a nadie |
| Rango | De 7 días atrás a 60 días adelante | Lo justo para organizarse; menos datos viajando |
| Por defecto | **Nadie ve nada.** Al activarlo, antes de confirmar: «Dani verá 14 cosas de los próximos 60 días · Revisar», con la lista para marcar privadas | Que nadie comparta sin saber qué |
| Dejar de compartir | En la hoja de esa persona: «`close` Dejar de compartir con Dani». Deja de verla al momento; no se le avisa | Sin dramas; como en Google y Apple, la decisión es solo tuya |
| Ver la de otros | Solo la que te ofrecen. No hay botón de «pedir ver» | Evita la presión de «¿por qué no me la enseñas?» |

### 4.2 Privada

- En el formulario de tarea y de plan, «¿Quién lo ve?»: «`users` Visible» · «`candado` Privada». Solo sale si compartes tu agenda con alguien.
- Debajo: «Privada: no sale de tu móvil. Dani y Familia no verán ni que estás ocupada.»
- En tu lista: `candado` «Privada · solo tú».
- Lo privado **no cuenta ni como «ocupada»**. Es más sencillo de explicar que lo de Google (allí lo privado se ve como «Ocupado»).
- Los planes de un grupo nunca se pueden marcar privados para ese grupo; solo para quien ve tu agenda desde fuera.

### 4.3 La agenda de otros encima de la mía

| Sitio | Qué sale |
|---|---|
| Agenda · Tareas | Bajo la tira de días, fila de caras: «Yo · Dani · Mamá» (se desliza en 375 px). Tocar una la apaga o la enciende. Lo de otros va en la lista del día con una raya de su color (`colorPersona`), su cara y «Dani · 19:00 · Club Norte». Lo de «ocupada», con fondo rayado y en cursiva |
| Agenda · Calendario | Los puntos de cada persona encendida, en su color (máx. 4 por día, como hoy) |
| Tocar algo de otro | Hoja solo para leer: título, cuándo, de quién. Sin editar, ni marcar hecha, ni «Añadir a mi calendario» |
| Inicio | No cambia: lo de otros no entra en «Estos días» |
| Tú → Compartir mi agenda | «Te enseñan la suya»: un interruptor por persona («sale en tu Agenda») por si no la quieres ver |

## 5. Borrador del modelo de datos (**para revisar por Datos y Seguridad**, nada aplicado)

Todo **aditivo**. No se cambia ningún dato existente ni las reglas actuales de `tareas` y `agenda`.

| Cambio | Para qué | Reglas a alto nivel |
|---|---|---|
| Tabla nueva `agenda_permisos` (`id`, `dueno` = quien comparte, `a_usuario` **o** `a_grupo` (uno de los dos), `nivel` en 'todo' / 'titulos' / 'ocupado', `planes` sí/no, `tareas` sí/no, `created_at`, `updated_at`) | Con quién compartes y cómo | Ver: el dueño, la persona o los miembros activos del grupo. Crear, cambiar y borrar: solo el dueño. Un disparador comprueba que la persona comparte algún grupo contigo y que tú eres del grupo. Sin acceso sin sesión |
| Columna nueva `tareas.privada` (sí/no, por defecto no) | Marcar una tarea personal como privada | Ninguna regla nueva en `tareas`: **nadie más la puede leer**, igual que hoy |
| Columna nueva `agenda.privada` (sí/no, por defecto no) | Planes «Solo yo» o de grupo que no quieres enseñar fuera | No cambia lo que ve el grupo |
| Función nueva `agenda_de(persona, desde, hasta)` (solo lectura, se ejecuta en el servidor) | Lo único por lo que alguien puede ver tu agenda | Mira el **mejor** permiso que tienes (directo o por grupo). Quita lo privado, las tareas sin fecha y las hechas. Según el nivel, **vacía en el servidor** título, lugar y nota. Máximo 92 días. Los planes de grupos de los que quien mira no es miembro salen solo como «Ocupada». No devuelve los ids reales |
| Función nueva `agendas_conmigo()` | La fila de caras: quién te comparte la suya y con qué nivel | Solo nombres y nivel |
| Configuración privada (sin migración) | `cfg().agendaCapas` = qué caras tienes apagadas; `cfg().agendaVisto` | Como hoy |

Notas para Datos:
- **No dar permiso de lectura de `tareas` a otros** y **no meter `tareas` en el tiempo real de otros**: así lo privado no puede viajar. La agenda de otros se pide al abrir la Agenda y cada pocos minutos.
- Probar que una versión antigua de la app, al guardar una tarea, **no borra** `privada` (hoy guarda con `upsert` de los campos que conoce).
- Pruebas de aislamiento con dos o tres cuentas de prueba, como el 10/10: sin permiso no se ve nada; con «ocupado» no llega ningún título; lo privado no llega en ningún nivel; al salir del grupo o al dejar de compartir, se deja de ver al momento.

## 6. Alternativas descartadas

| Idea | Por qué no |
|---|---|
| Esconder lo privado solo en pantalla | Lo privado llegaría al móvil del otro; cualquiera con conocimientos lo vería. El dueño lo ha descartado expresamente |
| Dar a otros permiso de lectura en `tareas` (RLS) | Las reglas deciden filas, no columnas: con «solo ocupada» llegarían igualmente los títulos |
| Varios calendarios por persona (como Apple o TimeTree) | Obliga a pensar «¿en qué calendario lo apunto?». Un interruptor «Privada» es más sencillo |
| «Pedir ver la agenda» | Presión social entre familia o pareja. Mejor que solo se ofrezca |
| Dejar editar la agenda de otro | Para hacer cosas juntos ya están los Planes y las tareas compartidas |
| Varias personas encargadas de una tarea | «Hecha» dejaría de estar claro. Mejor una tarea por persona |
| Notificaciones al móvil ya | Hoy la web no puede enviarlas. Llegarán con la APK |

## 7. Tandas y riesgos

| Tanda | Qué | Supabase | Esfuerzo (estimado) |
|---|---|---|---|
| 1 | 3.1: personas en «Con», un solo formulario, «te ha encargado» en Inicio, «Recordárselo», «Encargadas a otros», compartir una tarea tuya, texto «Lo añadiste tú» | No | Medio |
| 2 | 3.1: «Repetir» en tareas compartidas (si el dueño lo quiere) | Sí, una columna | Bajo |
| 3 | 3.2: tabla, columnas y funciones del apartado 5, y pruebas de aislamiento | Sí | Medio |
| 4 | 3.2: pantallas («Compartir mi agenda», Privada, caras en la Agenda y el calendario, «Revisar antes de compartir») | No | Alto |
| Después | Avisos al móvil (APK), «por turnos», categorías siempre privadas (p. ej. «Salud») | — | — |

**Riesgos**
- **«Ocupada» también cuenta cosas:** un hueco todos los martes a las 18:00 dice algo. Por eso Privada no sale ni como hueco.
- **Control en la pareja o la familia:** compartir debe ser siempre voluntario, revocable sin aviso y visible («La ven Dani y Familia»). Nada de «pedir ver» ni de «visto».
- **Planes de un grupo vistos por gente de fuera:** el plan de Ana en «Piso» no es solo tuyo. Por eso, a quien no es del grupo le sale solo como «Ocupada» (pregunta 3).
- **Compartir con un grupo:** quien entre después lo verá también. Hay que decirlo al elegir el grupo.
- **Una versión antigua de la app** podría no conocer «Privada»; hay que comprobar que no la borra (apartado 5).
- **La Agenda se llena** con lo de otros: por eso las caras se apagan y Inicio no cambia.
- **«Te ha encargado» solo si abres la app:** sin notificaciones, alguien puede no enterarse. «Recordárselo» por WhatsApp lo cubre.

## 8. Preguntas para el dueño

1. **(Bloquea la tanda 3)** ¿Los tres niveles, **Todo / Solo los títulos / Solo si estás ocupada**? Recomendado: sí.
2. **(Bloquea la tanda 3)** Cuando ya compartes, lo **nuevo** que apuntes ¿empieza **Visible** (y marcas Privada a mano) o **Privada** (y marcas Visible a mano)? Recomendado: Visible, porque con quien compartes es gente de confianza, y que al activarlo se pueda revisar todo lo que verán. Se puede dar a elegir en el propio ajuste.
3. **(Bloquea la tanda 3)** Tus planes de un grupo (la cena del Piso), ¿los ve como «Ocupada» quien no es del grupo? Recomendado: sí, solo como «Ocupada», nunca el título.
4. ¿Se puede compartir con un **grupo** entero, o solo con personas una a una? Recomendado: las dos cosas, avisando de que quien entre después también la verá.
5. ¿«Repetir» en tareas compartidas («Bajar la basura cada semana») ya, o más adelante junto con «por turnos»? Recomendado: «Cada semana» en la tanda 2 y «por turnos» después.

## 9. Lo que no hemos podido averiguar o confirmar

- **Nada probado en la app ni en un móvil real.** Los bocetos son la app con piezas dibujadas encima y datos inventados (390 px, Chromium), no un prototipo que funcione. No los hemos medido a 375 px.
- **TimeTree:** su página de ayuda («¿Pueden otros miembros ver mis eventos?») nos bloqueó la lectura. No hemos podido confirmar si tiene eventos privados dentro de un calendario compartido.
- **Apple Calendario:** su guía solo habla de «Permitir edición» y de calendario público; no hemos encontrado eventos privados dentro de un calendario compartido. Lo interpretamos como «se separa con calendarios distintos», pero no está confirmado.
- **Cupla:** todo lo que sabemos sale de su web y su ayuda (tienen interés propio).
- No sabemos si Google avisa a la otra persona cuando dejas de compartir.
- No hemos leído en Supabase las reglas reales de `tareas` (no están en el repositorio) ni cuánta gente usa la Agenda.
- No hemos comprobado cómo se comporta el `upsert` de una versión antigua de la app con la columna nueva `privada`.

## 10. Fuentes

- Google Calendar, «Share your calendar with someone» (permisos «See only free/busy», «See event details», «Make changes…»): https://support.google.com/calendar/answer/37082?hl=en-GB · consultado el 29/10/2026.
- Google Calendar, «Change your event privacy settings» (Predeterminada / Pública / Privada; «Tasks without a start or end time are always private»): https://support.google.com/calendar/answer/34580 · 29/10/2026.
- Apple, «Share lists and collaborate in Reminders on iPhone» (asignar a una persona; avisos al añadir y completar): https://support.apple.com/en-tm/guide/iphone/iph2a8f9121e/ios · 29/10/2026.
- Apple, «Share iCloud calendars on iPhone» («Allow Editing», calendario público, avisos de cambios): https://support.apple.com/guide/iphone/share-icloud-calendars-iph7613c4fb/ios · 29/10/2026.
- Cupla, «What are Cupla's features?» (por calendario: detalles o solo ocupado; tareas para ti, tu pareja o los dos): https://www.cupla.app/help/en/articles/15162036-what-are-cupla-s-features · 29/10/2026 · **interés propio**.
- Cupla, «How do I plan a surprise date for my partner?» (ocupado sin detalles; listas privadas): https://www.cupla.app/help/en/articles/15174608-how-do-i-plan-a-surprise-date-for-my-partner · 29/10/2026 · **interés propio**.
- Cupla, «Shared Google Calendar vs Cupla for couples»: https://cupla.app/blog/shared-google-calendar-vs-cupla-for-couples/ · 29/10/2026 · **interés propio**.
- TimeTree, ficha de la App Store (calendarios compartidos, asignar personas, notas): https://apps.apple.com/app/952578473 · 29/10/2026. Ayuda no accesible: https://support.timetreeapp.com/hc/en-us/articles/900002172746-Can-other-calendar-members-see-my-events
- Del repositorio (29/10/2026): `app.js` (`renderAgendaSemanaV2`, `renderCalendarioV2`, `agendaItems`, `agendaEventos`, `tareaCEsMia`, `gruposParaPlanes`, `planFormHtml`, `planVerHtml`, `planesGrupoHtml`, `openTareaFormV2`, acción `planTipo`), `data-layer.js`, `supabase/migrations/2026-10-23_agenda_planes.sql` y `README.md`, `docs/16-agenda-compartida-carpetas.md`, `docs/17-datos-planes-carpetas.md`.

Para el PDF: en la primera página, `24-agenda-encima.png` con el titular «Tu agenda, a la vista de quien tú elijas; lo privado no sale de tu móvil»; en la segunda, `24-compartir-agenda.png` con los tres niveles en grande (Todo / Títulos / Ocupada); `24-tarea-compartida.png` con la tabla del 3.1. Un dibujo sencillo del camino de los datos: «tu móvil → servidor (quita lo privado y recorta) → móvil de Dani».

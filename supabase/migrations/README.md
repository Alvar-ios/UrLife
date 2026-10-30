# Migraciones aplicadas

Se aplican desde el conector de Supabase. Las de grupos (bloque 8.1) son:
grupos_tablas, grupos_reglas, grupos_columnas_protegidas, grupos_funciones_alta,
grupos_bajas_suaves, grupos_permisos_funciones, grupos_permisos_tablas,
grupos_proteger_columnas_fix.

Pruebas de aislamiento (31 casos, ejecutadas el 10/10/2026 con dos cuentas de prueba,
todo deshecho al terminar): ajenos no ven ni modifican grupos, miembros ni invitaciones;
nadie se añade sin enlace válido; enlaces de un solo uso y con caducidad; un miembro
no puede hacerse administrador; sin sesión no se puede hacer nada.

Gastos compartidos (bloque 8.2): compartidos_tabla, compartidos_validacion,
compartidos_validacion_fix, compartidos_funciones.
- Tabla `compartidos` (nunca se borra de verdad: `borrado` = fecha) y columna
  `movimientos.compartido_id` (enlaza el cargo de tu banco con el gasto compartido).
- Un disparador comprueba que quien pagó y el reparto son del grupo y que el reparto
  suma el total; las liquidaciones van de una persona a otra distinta.
- `crear_directo` (compartir con alguien de tus grupos sin grupo) e `invitar_persona`
  (enlace para alguien nuevo). No se puede salir, quitar ni cerrar con cuentas pendientes.

Pruebas de aislamiento (34 casos, 10/10/2026, cuentas de prueba, todo deshecho al terminar):
quien no es del grupo no ve ni crea ni cambia gastos compartidos; reparto que no cuadra,
negativo o con gente de fuera rechazado; nadie puede hacerse pasar por otro creador;
no se puede mover un gasto a otro grupo ni borrarlo de verdad; tras salir del grupo se
siguen viendo (sin poder cambiarlos) los gastos en los que participaste; sin sesión, nada.

Metas y deudas compartidas (bloque 8.3): objetivos_compartidos_tabla,
compartidos_tipos_ahorro_deuda, compartidos_validacion_objetivos.
- Tabla `objetivos_compartidos` (hucha o deuda de un grupo; borrado suave) y columna
  `compartidos.objetivo_id`. Las aportaciones y pagos son movimientos compartidos de tipo
  Ahorro o Deuda que tienen que ir con una meta/deuda del mismo grupo y del mismo tipo.

Pruebas de aislamiento (18 casos, 10/10/2026, cuentas de prueba, todo deshecho al terminar):
quien no es del grupo no ve, crea ni cambia metas o deudas compartidas; no se puede mover
una meta a otro grupo ni cambiar su tipo; una aportación sin meta, con una meta de otro grupo
o del tipo equivocado se rechaza; una meta eliminada no admite aportaciones nuevas, pero las
anteriores siguen; aportar a una hucha no crea deudas entre miembros y una cuota repartida sí.

Tickets (bloque 8B): tickets_uso_y_articulos y la función `tickets-ia`.
- La foto se reduce en el móvil, la función la manda a Claude (Haiku; «Leer con más
  precisión» usa Sonnet) y devuelve los artículos. La foto no se guarda en ningún sitio.
- `tickets_uso`: una fila por lectura (para el límite de 60 al mes por persona); solo la
  escribe la función y cada persona solo ve las suyas.
- `movimientos.articulos` y `compartidos.articulos`: lista de artículos del ticket
  (nombre, cantidad, importe y, si se reparte, quién lo tomó).
- Necesita el secreto ANTHROPIC_API_KEY en Supabase → Edge Functions → Secrets. Sin él,
  la app avisa de que la lectura de tickets aún no está activada.

Prueba mapa de paradores (12/10/2026): paradores_notas.
- Tablas `paradores_semaforo` (una luz por parador y grupo: red/orange/green/gold) y
  `paradores_comentarios` (texto de 1 a 1.000 caracteres, no se editan).
- Solo los miembros activos del grupo (`es_miembro`) leen y escriben; cada uno firma con su
  propia cuenta y solo borra sus comentarios; sin sesión, nada. Página: /prueba-mapa-paradores/.

Semáforo por persona (12/10/2026): paradores_luces_por_persona.
- Tabla `paradores_luces` (una luz por parador, grupo y persona). Cada miembro solo pone,
  cambia o apaga la suya; todos los del grupo las leen.
- Las 30 luces que había en `paradores_semaforo` se copiaron a cada miembro activo del grupo.
  `paradores_semaforo` se conserva como copia; la página ya no la usa.

Categorías estándar (12/10/2026): subcategoria_movimientos_compartidos.
- Columna `subcategoria` (texto, opcional) en `movimientos` y `compartidos`: el detalle dentro de
  una categoría («Salud y cuidado personal · Uñas») o, en un gasto fijo, el recibo («Vivienda · Alquiler»).
- Las 16 categorías estándar viven en la app (CATS_STD en app.js), no en la base de datos: son
  iguales para todos y no se pueden borrar. En `config.app.categoriasGasto` solo se guardan los
  presupuestos de las estándar y las categorías personalizadas de cada persona.
- Los recibos (`config.app.facturas`) llevan su `categoria` estándar. Un movimiento de tipo Factura
  («gasto fijo») guarda la categoría estándar y el nombre del recibo en `subcategoria`.
- Migración de datos del 12/10 con copias en backup_movimientos_20261012, backup_compartidos_20261012
  y backup_config_20261012 (las cuentas de prueba no se tocaron).

Metas híbridas (13/10/2026): metas_hibridas_aportes_hitos_usos, aportes_quitar_si_meta_borrada, aportes_ver_los_propios.
- `objetivos_compartidos` gana `hitos` (jsonb, lista de {id, nombre, importe, logrado}), `usos`
  (jsonb, lista de {id, fecha, importe, para: objetivo|otro, nota, por}) y `conseguida` (fecha).
- Tabla `objetivo_aportes`: el reflejo de un movimiento personal (Apartar o Inversión) que su dueño
  vincula a una meta compartida. Una fila por persona y movimiento (`unique(user_id, mov_id)`); el
  movimiento sigue siendo suyo y cuenta solo en sus números. Se «quita» con borrado lógico.
- Reglas: cada uno ve sus aportes y los de las metas de sus grupos; solo crea, cambia o quita los
  suyos (el disparador `validar_aporte` fija el autor y no deja cambiar autor ni movimiento); nadie
  borra filas; sin sesión, nada.
- Las metas personales siguen en `config.app.ahorro` y ahora también guardan `hitos`, `usos`,
  `conseguida` y `rentabilidad`. Ya no hay «tipo» de meta: todas suman lo apartado y lo invertido
  (`movimientos.meta_id` = id de la meta, o `g:<uuid>` si es compartida).
- No hubo que tocar datos: las metas existentes valen igual y las columnas nuevas empiezan vacías.

Amigos (13/10/2026): amigos_y_enlace_para_varios.
- «Amigos» = quien comparte contigo algún grupo o relación directa abierta (`son_amigos(a, b)`).
- `anadir_a_grupo(p_grupo, p_user)`: cualquier miembro de un grupo (no de una relación directa)
  puede añadir a un amigo suyo sin enlace; entra con el nombre que usa en el grupo más reciente que
  compartís. Si no sois amigos: `no_es_amigo`. Máximo 30 miembros.
- `crear_invitacion_varios(p_grupo)`: enlace para hasta 10 personas durante 7 días (columnas nuevas
  `usos_max` y `usos` en `grupo_invitaciones`; los enlaces de antes siguen siendo de 1 uso).
- `unirse` suma un uso y da el enlace por gastado al llegar a su máximo.
- Probado con las cuentas de prueba en una transacción que se deshace: añadir amigo, no duplicar,
  rechazar a quien no es amigo o a un ajeno, no tocar relaciones directas, enlace de varios (2 usos y
  sigue abierto; se cierra al 10.º) y enlace normal de un solo uso.

## Inversiones en varias metas (13/10)
- `movimientos.meta_ids` (jsonb, opcional): lista completa de metas de una inversión. `meta_id` sigue siendo la primera (compatibilidad). Como mucho una meta compartida por inversión (la tabla `objetivo_aportes` es única por usuario+movimiento).

## Varias cuentas, fase 1 (16/10): movimientos_cuentas
- `movimientos.cuenta_id` (texto, opcional): cuenta de la que sale o a la que entra el movimiento (el `id` de `config.cuentas`). Vacía = la cuenta principal.
- `movimientos.cuenta_destino_id` (texto, opcional): cuenta de destino en un traspaso.
- Solo añade columnas vacías; no cambia ningún dato. Ver `docs/PLAN_CUENTAS.md`.

## Traspasos (17/10): movimientos_tipo_traspaso
- La regla `movimientos_tipo_check` admite ahora también `tipo = 'Traspaso'` (antes solo Ingreso, Factura, Gasto, Ahorro, Inversión y Deuda). Sin esto, la base de datos rechazaba cada traspaso.
- Solo amplía la lista de tipos permitidos; no cambia ningún dato.
- Probado con una inserción dentro de una transacción que se deshace: se acepta y no queda nada guardado.

## Personas sin cuenta, administradores y quién edita (17/10): personas_sin_cuenta_1 … _7 — APLICADA
- SQL completo en `2026-10-17_personas_sin_cuenta.sql`; copia de lo que reemplaza en `copias/2026-10-17_antes_de_personas_sin_cuenta.sql`.
- Aditivo: tablas `grupo_invitados` (personas sin cuenta: solo nombre; `reclamado_por` cuando alguien ocupa su sitio; `historial` = si sus gastos de antes cuentan en los números personales de quien lo ocupa) e `invitado_enlaces` (enlace personal, un uso, 7 días); columna `grupos.edicion` ('todos' por defecto, o 'autor'); funciones `crear_sin_cuenta`, `renombrar_sin_cuenta`, `quitar_sin_cuenta`, `enlace_sin_cuenta`, `ver_enlace_sin_cuenta`, `reclamar_sin_cuenta`, `cambiar_rol`, `es_participante`, `puede_editar_compartido`.
- Reemplaza (no aditivo): `validar_compartido` (acepta a las personas sin cuenta del grupo), `saldo_en_grupo` (suma lo de la persona cuyo sitio se ocupó), `cerrar_grupo` (no se cierra con deudas de alguien sin cuenta) y la regla `compartidos_editar` (según `grupos.edicion`).
- No reescribe ningún gasto: el id de la persona sin cuenta queda como «alias» de quien ocupa su sitio.
- Probada en la base de datos real con tres usuarios inventados dentro de una transacción que se deshace: 24 de 24 comprobaciones bien (crear, repartir, saldos, no quitar ni cerrar con deudas, ajenos sin acceso, enlace de un uso, ocupar el sitio, no reutilizar el id antiguo, edición «todos»/«autor», administradores y no quedarse sin ninguno). No quedó nada guardado.

## Forma de las metas compartidas (23/10): objetivos_forma — APLICADA
- SQL en `2026-10-23_objetivos_forma.sql`. Columna opcional `objetivos_compartidos.forma` (texto, solo letras y números, 1-20): la forma de una meta compartida o el icono de una deuda compartida, igual para todo el grupo. Vacía = la que sale del nombre.
- Aditiva: no cambia ningún dato (3 metas, 0 con forma tras aplicarla). `validar_objetivo` no se toca y no descarta la columna (revisado su código completo). Permisos de tabla entera para `authenticated`.
- La app solo debe mandar `forma` cuando se elige a mano.

## Temas en los grupos (23/10): grupo_carpetas_temas — APLICADA
- SQL en `2026-10-23_grupo_carpetas_temas.sql` (migración 1 de `docs/17`, con el retoque de `docs/18`: al crear un tema, el autor tiene que ser quien tiene la sesión).
- Aditiva: tabla `grupo_carpetas` (RLS; ver/crear/editar solo miembros activos; sin DELETE; `anon` sin permisos), columna vacía `compartidos.carpeta_id`, disparadores `validar_carpeta` y `validar_carpeta_compartido` (este solo se ejecuta si el gasto lleva tema) y función `poner_carpeta`. En Realtime.
- Comprobado después: RLS activo, 3 reglas, permisos correctos, disparadores y funciones como se esperaba, 0 gastos con tema y 0 temas (34 gastos sin tocar). Los avisos de Supabase no muestran nada nuevo salvo `poner_carpeta` ejecutable con sesión, que es lo buscado.
- En un grupo cerrado nadie ve ni cambia temas (`es_miembro` exige grupo abierto).

## Planes y tareas compartidas (23/10): agenda_planes — APLICADA
- SQL en `2026-10-23_agenda_planes.sql` (migración 2 de `docs/17`; retoque: al crear en un grupo, el autor tiene que ser quien tiene la sesión).
- Aditiva: tabla `agenda` (planes con fecha, hora y lugar; tareas del grupo con encargado y «hecha»). RLS: lo «Solo yo» solo lo ve quien lo crea; lo de un grupo, sus miembros activos. Sin DELETE; `anon` sin permisos. Disparador `validar_agenda` y función `agenda_hecha` (marcar una tarea del grupo, cualquier miembro). En Realtime.
- No toca la tabla `tareas` (44 tareas personales sin cambios). Comprobado después: RLS, 3 reglas, permisos y funciones como se esperaba; 0 filas.

## Compartir mi agenda (30/10): agenda_compartir — APLICADA
- SQL en `2026-10-30_agenda_compartir.sql` (revisión de Datos y Seguridad en `docs/24b`; aprobada por el dueño el 30/10, también que los planes de grupo salgan como «Ocupada» a quien no es del grupo). Único cambio frente a `docs/24b`: `tareas.fecha_limite` es `date`, así que se usa directamente.
- Aditiva: columnas `tareas.privada` y `agenda.privada` (sí/no, por defecto no; en la agenda solo en planes «Solo yo»), tablas `agenda_permisos` (solo las ve y toca quien comparte) y `agenda_ocultas`, disparador `validar_agenda_permiso` y funciones `agenda_nivel_para` (interna), `agenda_de` y `agendas_conmigo` (solo con sesión). Sin Realtime.
- Antes de aplicarla se probó entera dentro de una transacción que se deshizo, con 4 cuentas inventadas: sin permiso no se ve nada; «ocupado» no manda títulos ni tareas; «títulos» sin lugar ni nota; lo privado, sin fecha y hecho nunca llega; planes de grupos ajenos solo como «ocupado»; nunca ids reales; al salir del grupo o dejar de compartir se deja de ver al momento; sin sesión, nada; rango máximo 92 días.
- Comprobado después: 45 tareas y 5 planes sin cambios, 0 privados, RLS activo en las dos tablas nuevas. Los avisos de Supabase solo muestran `agenda_de` y `agendas_conmigo` ejecutables con sesión, que es lo buscado.
- Pendiente en la app (antes de enseñar «Privada»): copiar `privada` al repetir una tarea (`crearSiguienteTarea`) y mandarlo solo en planes «Solo yo».

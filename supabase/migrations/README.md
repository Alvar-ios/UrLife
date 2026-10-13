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

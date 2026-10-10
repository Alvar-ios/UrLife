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

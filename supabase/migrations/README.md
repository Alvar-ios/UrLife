# Migraciones aplicadas

Se aplican desde el conector de Supabase. Las de grupos (bloque 8.1) son:
grupos_tablas, grupos_reglas, grupos_columnas_protegidas, grupos_funciones_alta,
grupos_bajas_suaves, grupos_permisos_funciones, grupos_permisos_tablas,
grupos_proteger_columnas_fix.

Pruebas de aislamiento (31 casos, ejecutadas el 10/10/2026 con dos cuentas de prueba,
todo deshecho al terminar): ajenos no ven ni modifican grupos, miembros ni invitaciones;
nadie se añade sin enlace válido; enlaces de un solo uso y con caducidad; un miembro
no puede hacerse administrador; sin sesión no se puede hacer nada.

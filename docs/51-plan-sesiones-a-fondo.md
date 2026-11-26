# 51 · Dos sesiones «a fondo» (26/11/2026)

Dos sesiones largas con el modelo más potente. Cada una trabaja en su rama y **no se publica** hasta que el dueño diga «publica».
Regla común: primero se demuestra cada fallo con una prueba automática que falla; luego se arregla y la prueba pasa. Nada de tocar datos reales de Supabase.

---

## Sesión 1 (ahora) · El dinero siempre cuadra y no se pierde nada

**Rama:** `fase23/auditoria-dinero`. **Departamentos:** Calidad (pruebas) y Datos y Seguridad (guardado, Supabase y RLS).

### Qué se revisa
1. **Cálculos de «Tu mes»:** `mesDe`, `rangoMes`, `kpisMes`, `balanceMesHtml`; mes desde el día de cobro (días 29-31, febrero, años bisiestos, cambio de hora), lo previsto siempre aparte, sin `fecha.slice(0, 7)` escondidos.
2. **Cuentas y saldos:** `saldoCuenta`, `saldoCuentaEn`, traspasos (no cuentan como gasto ni ingreso), «Convertir en traspaso», metas ligadas (`esAporteLigado`, `conSaldo`: lo apartado no se suma dos veces), «Lo que tienes».
3. **Juntos:** saldos de cada grupo y por persona con gente sin cuenta, repartos por porcentaje o importe con céntimos que no cuadran (33,33 × 3), «Saldar todo», deshacer y recuperar, grupos cerrados, metas y deudas compartidas, `efectoMio` = lo que dice «¿De dónde sale?».
4. **Deudas e inversiones:** pagos buscados por nombre antiguo (`movsDeuda`), participaciones, divisas, activos sin precio.
5. **Guardar sin perder ni duplicar:** `anadir`, `movPendiente`/`movPendienteFin`, reintentos, corte de internet a mitad, dos móviles tocando lo mismo, «Deshacer» de cada sitio, importar extractos dos veces, borrar cuenta.
6. **Servidor (solo lectura):** permisos RLS de las tablas compartidas, funciones `security definer`, que nadie pueda ver o cambiar lo de otro grupo. Si hiciera falta un cambio en Supabase, se propone y se espera el «sí».
7. **La prueba que falla los días 25** (`test105`): arreglarla para que no dependa del día.

### Qué sale
- Un informe corto en el chat: lo que estaba mal, cómo afectaba al usuario y qué se ha arreglado, ordenado por gravedad.
- Las pruebas nuevas en `tests/` y los arreglos en la rama, con Calidad revisándolo antes de darlo por terminado.
- Lo que no dé tiempo, apuntado aquí abajo para otra sesión.

---

## Sesión 2 (después) · Funcionar sin internet

**Rama:** `fase24/sin-conexion`. **Departamentos:** Producto y Diseño (cómo se ve), Datos y Seguridad (que no se duplique ni se pierda), Calidad.

### Qué se busca
- Abrir la app sin conexión y **ver tus datos** (los últimos que se cargaron), en la web, Android e iPhone.
- **Apuntar gastos, ingresos y tareas sin conexión**; se guardan solos al volver, sin duplicados (ya usamos el número puesto en el móvil, lo que ayuda).
- Un aviso discreto «Sin conexión · se guardará al volver» y cuántos cambios faltan por subir.
- Lo compartido (Juntos) en solo lectura sin conexión, para no crear líos con otras personas.

### Cómo
1. Producto propone el comportamiento y el aviso (`docs/52`), y se le enseña al dueño antes de programar.
2. Guardar una copia de los datos en el móvil (cifrada si es posible y borrada al cerrar sesión), y una cola de cambios pendientes que sobrevive a cerrar la app.
3. Pruebas: abrir sin red, apuntar, cerrar la app, volver la red, comprobar que llega una sola vez.
4. Hay que probarlo en un móvil real antes de publicar.

### Alternativa si el dueño prefiere
Avisos de Juntos en iPhone con la app cerrada (APNs). Necesita un iPhone real para cada prueba.

---

## Pendiente tras las sesiones
_(se rellena al terminar cada una)_

# 51 · Dos sesiones «a fondo» (26/11/2026)

Dos sesiones largas con el modelo más potente. Cada una trabaja en su rama y **no se publica** hasta que el dueño diga «publica».
Regla común: primero se demuestra cada fallo con una prueba automática que falla; luego se arregla y la prueba pasa. Nada de tocar datos reales de Supabase.

---

## Sesión 1 (ahora) · Que la interfaz funcione bien y diga solo lo necesario

**Rama:** `fase23/pulido-interfaz`. **Departamentos:** Calidad (pruebas tocando de verdad y capturas), Producto y Diseño (textos y criterio), Marketing y Comunicación (tono de los textos).

### Qué se revisa, pantalla a pantalla
(Inicio, +, teclado del importe, Movimientos, Dinero, Juntos y cada grupo, Agenda, Tú, bienvenida, hojas de Ajustes, Informes, Trayecto, Importar, guía de avisos.)
1. **Botones:** que todos hagan lo que dicen, sin dobles toques, sin botones muertos ni tapados (por la barra de abajo, el teclado o la muesca del iPhone), con tamaño cómodo para el dedo.
2. **Desplazamiento:** que se pueda llegar al final de cada pantalla y hoja, que el fondo no se mueva con una hoja abierta, que al volver atrás no salte a otra posición, y que no haya desplazamiento hacia los lados.
3. **Animaciones:** sin parpadeos ni repintados de toda la pantalla, hojas que suben y bajan suaves, sin saltos al cambiar de pestaña o de mes, y nada que se quede a medias si se toca rápido.
4. **Textos que se cortan o se pisan:** a 360, 375, 390 y 430 px, en claro y oscuro, con letra grande del móvil, con importes largos (123.456,78 €) y nombres largos. Se usa `tests/capturas/revisar.js` y se amplía donde haga falta.
5. **Texto que sobra:** explicaciones largas, frases tipo asistente («Aquí puedes…», «Te ayudamos a…», «Recuerda que…»), avisos repetidos, subtítulos que dicen lo mismo que el título y textos de ayuda que ya no hacen falta. Se propone recortar o quitar, manteniendo las palabras de la app («Aportar», etc.).
6. **Atrás de Android y gesto de iPhone:** que siempre cierren lo de arriba y nunca saquen de la app sin querer.

### Cómo
- Primero una pasada con capturas y pruebas que tocan (`tests/toques_comun.js`) para hacer la lista de fallos, ordenada por lo que más se nota.
- **Los textos a quitar o acortar se enseñan al dueño en una lista (antes → después) antes de cambiarlos.** Los fallos claros (algo cortado, un botón tapado) se arreglan directamente.
- Cada arreglo con su prueba. Al final, capturas de antes y después.

### Qué sale
- Una lista corta en el chat de lo arreglado y de lo que queda.
- Todo en la rama, sin publicar. No se puede ver en un móvil real desde aquí: lo comprobáis vosotros con la versión de prueba.

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

## Para más adelante
- **El dinero siempre cuadra y no se pierde nada:** auditoría de cálculos («Tu mes», saldos de cuentas, traspasos, metas ligadas, saldos de Juntos con céntimos, deudas, inversiones), guardado sin duplicar ni perder (reintentos, cortes de red, dos móviles a la vez, deshacer) y permisos del servidor. También arreglar `test105`, que falla los días 25.

## Pendiente tras las sesiones
_(se rellena al terminar cada una)_

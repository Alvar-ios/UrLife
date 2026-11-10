# Plan de pruebas y de lanzamiento en Google Play

Calidad · 10/11/2026 · rama `fase9/pulido`

Para qué sirve: que el dueño sepa qué probar a mano, cómo llevar la prueba cerrada de Google, cuándo decir «lista» y qué rutina seguir después. Las pruebas automáticas (161) no ven nada de lo que pasa dentro de un móvil de verdad: la huella, el teclado, el botón de atrás, WhatsApp o las descargas solo se pueden comprobar con el móvil en la mano.

---

## 1. Prueba a mano en un Android real (30 minutos)

**Antes de empezar:** el APK de prueba (GitHub → Actions → «App de Android» → la última compilación → descargar `palomapp-…`), un segundo móvil o un amigo para el punto 23, y un extracto de banco en el móvil (CSV o Excel).

Apunta cada punto como **bien / mal / raro**. Si algo va mal, captura de pantalla y sigue: no te pares a investigar.

**Instalar y entrar (5 min)**

1. Instala el APK. ¿Se llama «PalomApp» y tiene su icono? (El icono es provisional.)
2. Ábrela. ¿La pantalla de arranque dura menos de 2 segundos y no se queda en blanco?
3. Entra con tu cuenta. ¿El teclado no tapa la casilla de la contraseña ni el botón?
4. ¿La hora y la batería de arriba se leen bien (no blanco sobre blanco) y el título «Inicio» no queda debajo de ellas?
5. Cierra la app del todo y vuelve a abrirla. ¿Sigues dentro, sin pedir la contraseña?
6. En la pantalla de entrar, toca «Privacidad». ¿Se abre la página y puedes volver a la app?

**Moverse (5 min)**

7. Recorre Inicio, Movimientos, Juntos, Dinero, Agenda y Tú. ¿Algún texto cortado o botón que no llega al dedo?
8. Botón o gesto de **atrás**: desde Movimientos vuelve a Inicio; en Inicio, sale de la app. Nunca debe cerrarla de golpe desde otra pantalla.
9. Abre una hoja (por ejemplo el +) y pulsa atrás. ¿Se cierra la hoja y no la app?
10. Empieza un gasto, escribe 12,50 y pulsa atrás. ¿Pregunta «¿Descartar este gasto?»? Prueba «Seguir editando» y «Descartar».
11. Lo mismo con un plan nuevo en la Agenda y con «Compartir un gasto». **Hoy sabemos que estos dos no preguntan** (fallo 2 del informe): comprueba si ya está arreglado.
12. Baja y sube rápido en Movimientos → Lista. ¿Va fluido? ¿La barra de abajo no tapa la última fila?
13. Gira el móvil y vuelve a ponerlo recto. ¿Se recoloca sin romperse?

**Apuntar cosas (6 min)**

14. Apunta un gasto con el teclado de la app. ¿Las teclas responden a la primera, vibra al guardar y aparece en Inicio?
15. Edita ese gasto y cambia la fecha con el selector. ¿Se abre el calendario del móvil?
16. Abre un desplegable (forma de pago, categoría al importar). ¿Se nota que es un desplegable y se abre la lista del móvil? (Hoy no llevan flecha: fallo 3.)
17. Apunta una tarea desde la casilla rápida de la Agenda. ¿El teclado no tapa lo que escribes?
18. Toca el ojo de Inicio. ¿Se tapan las cifras? Cierra y abre la app: ¿siguen tapadas?

**Lo que sale de la app (7 min)**

19. Tú → «Descargar mis movimientos (Excel)». ¿Se descarga? ¿Dónde queda el archivo? ¿Se abre con Hojas de cálculo? **Es el punto con más riesgo: dentro de la app de Android las descargas pueden no funcionar.**
20. Tú → «Copia de seguridad». Lo mismo.
21. Tú → «Importar extracto». ¿Se abre el selector de archivos del móvil y deja elegir tu extracto? Llega hasta la vista previa (no hace falta importar).
22. + → ticket con foto. ¿Pide permiso de cámara, hace la foto y lee los artículos?
23. Juntos → una persona → «Pedir por WhatsApp». ¿Se abre WhatsApp con el mensaje escrito?
24. Tú → «Escríbenos». ¿Se abre el correo?

**Entre dos móviles (5 min)**

25. Crea un grupo y manda la invitación por WhatsApp al segundo móvil.
26. En el segundo móvil, toca el enlace. Apunta **dónde se abre**: ¿en la app o en el navegador? (Hoy esperamos que en el navegador: falta un archivo en la web para que Android lo mande a la app.) En los dos casos, ¿consigue unirse?
27. Apunta un gasto compartido en un móvil. ¿Aparece en el otro en menos de 10 segundos sin tocar nada?

**Seguridad y cortes (4 min)**

28. Tú → «Pedir huella al abrir» → actívalo. Cierra la app y ábrela. ¿Pide la huella? ¿Si cancelas, se queda tapada con «Desbloquear» y no se ve ninguna cifra detrás?
29. Con la huella activada, mira las apps recientes. ¿Se ven tus cifras en la miniatura? (Apúntalo: hoy no lo evitamos.)
30. Pon el modo avión y abre la app. ¿A los 8 segundos dice «No hay conexión» con «Reintentar»? Quita el modo avión: ¿vuelve sola o con el botón?
31. «¿Olvidaste tu contraseña?» con tu correo. ¿Llega el correo? Al tocar el enlace, ¿pide la contraseña nueva y luego entras con ella en la app?
32. Tú → «Borrar mi cuenta» **con una cuenta de prueba, nunca con la tuya**. Hasta que Datos despliegue la función, debe decir «Ahora no se puede borrar desde aquí» con el correo. Después: debe borrar y sacarte.

Si los puntos 3, 8, 14, 19, 21 y 26 van bien, lo importante funciona.

---

## 2. La prueba cerrada de Google (12 probadores, 14 días)

Google exige a las cuentas nuevas 12 personas apuntadas a la prueba **durante 14 días seguidos** antes de dejar publicar. Si alguien se da de baja y bajas de 12, el contador puede volver a empezar.

**A quién apuntar**

- 15 o 16 personas, no 12: siempre se cae alguien.
- Todas con Android y cuenta de Google. Mezcla: 4 o 5 que ya usan la web y el resto nuevas (son las que encuentran lo que no se entiende).
- Móviles variados: al menos uno pequeño, uno viejo (Android 9 o 10) y uno de cada marca habitual (Samsung, Xiaomi, Pixel o similar).

**Qué pedirles (un solo mensaje, que quepa en WhatsApp)**

1. Instálala con este enlace y **no la desinstales en 14 días** (es lo único obligatorio).
2. El primer día, 10 minutos: crea tu cuenta, apunta 3 gastos y una tarea.
3. Durante la primera semana: entra en el grupo de prueba que te mando y apunta un gasto compartido.
4. Si algo falla o no se entiende: captura de pantalla al grupo de WhatsApp, con una frase. Nada más.

**Cómo recoger los fallos con poco esfuerzo**

- Un grupo de WhatsApp «PalomApp pruebas» solo para esto. Captura + una frase. Sin formularios: nadie los rellena.
- Tú lo pasas, una vez cada dos o tres días, a una lista única (`docs/salud/pruebas-cerradas.md`) con cuatro columnas: qué pasa, en qué móvil, gravedad (rompe / molesta / detalle) y estado.
- Dos mensajes tuyos durante la prueba: día 1 («¿os ha dejado instalarla?») y día 7 («¿qué es lo que menos habéis entendido?»). La segunda pregunta da más que cualquier encuesta.
- Día 13: una pregunta para la ficha de Google: «¿La seguirías usando? ¿Qué le falta?». Google pregunta al final qué has aprendido de la prueba y conviene tener respuestas reales.
- Mira Play Console → «Android vitals» los días 3, 7 y 13: cierres inesperados y bloqueos por modelo de móvil.

**Durante los 14 días**

- Solo arreglos, nada nuevo. Cada versión nueva pasa antes por las pruebas automáticas y por los puntos 3, 8, 14, 19 y 26 de arriba.
- Como mucho una versión cada 3 o 4 días, para que los probadores no se pierdan.

---

## 3. Cuándo está «lista para publicar»

Todas a la vez:

1. **Pruebas automáticas: todas bien** y `revisar.js` sin avisos nuevos.
2. **La lista de 30 minutos, entera bien** en dos móviles distintos (uno de ellos pequeño o viejo).
3. **Cero fallos que rompen**: perder o duplicar un dato, no poder entrar, que la app se cierre sola, o que una cifra no cuadre. Los que «molestan», como mucho 5 y apuntados. Los «detalles» no bloquean.
4. **14 días con 12 probadores cumplidos**, y al menos 8 de ellos la han usado más de un día.
5. **Android vitals**: menos del 1 % de sesiones con cierre inesperado y ningún modelo concreto que falle siempre.
6. **Borrar cuenta funciona de verdad** (función desplegada por Datos y probada con una cuenta de prueba) y los enlaces de privacidad y de borrado de la ficha abren.
7. **Lo que dice la ficha y la página de privacidad es verdad** el día que se publica (revisado por Calidad contra el código, no de memoria).
8. **La web no se ha roto por el camino**: los usuarios de hoy siguen entrando y viendo sus datos igual.
9. Icono definitivo, capturas de la ficha y versión con número nuevo.

Si falla una, no se publica; se arregla y se repite solo lo afectado.

---

## 4. Rutina de calidad después del lanzamiento (una persona, 5–8 h a la semana)

De esas horas, Calidad necesita **una hora a la semana** y **hora y media antes de cada versión**. El resto es para construir.

**Cada semana (1 h, siempre el mismo día)**

- 10 min · Play Console: cierres inesperados, bloqueos, reseñas nuevas y desinstalaciones.
- 10 min · Correo de «Escríbenos» y grupo de WhatsApp: pasar lo nuevo a la lista de fallos.
- 10 min · Supabase: errores de la semana, uso de la base de datos y que la copia de seguridad del domingo se hizo (GitHub → Actions → en verde).
- 10 min · Coste: lecturas de tickets con IA y cualquier servicio de pago.
- 20 min · Usar la app como un usuario normal en el móvil, sin guion: apuntar, compartir, mirar Dinero. Es lo que más fallos encuentra.

**Antes de cada versión (1 h 30)**

- Pruebas automáticas y capturas (Calidad lo hace sola).
- Revisión del cambio por Calidad con ojos frescos, como hoy.
- Los 6 puntos clave de la lista a mano (3, 8, 14, 19, 21, 26) más lo que se haya tocado.
- Publicar primero en la web; al día siguiente, si nadie se queja, subir a Google Play **al 20 % de usuarios**; al 100 % a los dos o tres días.
- Nunca publicar un viernes ni justo antes de irte de viaje.

**Una vez al mes (1 h)**

- Barrido completo de Calidad (como el del 08/11).
- Probar que una copia de seguridad se puede abrir de verdad.
- Repasar que la página de privacidad sigue diciendo la verdad.
- Mirar si Google ha cambiado algún requisito (nivel de Android exigido, políticas).

**Reglas que ahorran tiempo**

- Un fallo que rompe datos se arregla antes que cualquier novedad.
- Cada fallo arreglado deja una prueba automática, para que no vuelva.
- Versiones pequeñas y frecuentes: se revisan en una hora y, si algo falla, se sabe qué fue.

---

## 5. Quién hace qué

**Calidad (yo)**

- [ ] Volver a revisar cuando Desarrollo arregle los fallos del informe del 10/11 (desplegables, aviso del informe, atrás en plan nuevo, devoluciones en el Excel, cifras que se ven con el ojo cerrado).
- [ ] Probar la función «borrar-cuenta» con Datos cuando esté desplegada: que borra lo que dice, que deja lo que dice y que no toca a nadie más.
- [ ] Añadir a las capturas las pantallas de Movimientos vacío, cifras ocultas y un formulario con desplegables.
- [ ] Revisar la ficha de Google Play y el formulario de «Seguridad de los datos» contra el código antes de enviarlos.
- [ ] Dejar creada `docs/salud/pruebas-cerradas.md` con la tabla vacía.
- [ ] Revisar cada versión que salga durante la prueba cerrada.

**El dueño**

- [ ] Pasar la lista de 30 minutos en su móvil y en un segundo móvil. Mandar a Claude lo que salga mal o raro.
- [ ] Decidir sobre los fallos del informe: cuáles se arreglan antes de publicar la web.
- [ ] Decir «publica» cuando quiera que la web salga.
- [ ] Cuenta de desarrollador de Google Play (pago único) y verificación de identidad.
- [ ] Guardar la clave de firma en los secretos de GitHub y **una copia fuera** (si se pierde, cuesta mucho recuperarla).
- [ ] Reunir a 15 o 16 probadores con Android y crear el grupo de WhatsApp.
- [ ] Elegir el icono definitivo.
- [ ] Confirmar el nombre que aparecerá como responsable en la ficha y que el correo de contacto es el que quiere dejar público.
- [ ] Mandar los dos mensajes de la prueba cerrada (día 1 y día 7) y la pregunta del día 13.

**Depende de otros departamentos**

- Datos y Seguridad: aplicar el SQL de borrar cuenta y desplegar la función (rama `datos/borrar-cuenta`, sin aplicar).
- Desarrollo: los arreglos del informe y el archivo que hace que las invitaciones abran la app (necesita la huella de la clave de firma).
- Marketing: textos y capturas de la ficha.

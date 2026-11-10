# 34 · Hoja de ruta de Producto: de la tienda al primer año (10/11/2026)

*Producto y Diseño. Parte de Producto para la hoja de ruta de Google Play y el plan de negocio a un año. Parte de las decisiones del dueño del 10/11/2026: nombre PalomApp, objetivo «que la use mucha gente», modelo gratis + plan de pago, 0–30 € al mes en total, 5–8 horas del dueño por semana. No se ha tocado el código. Precios de otras apps consultados el 10/11/2026: pueden cambiar. Sustituye a `docs/ROADMAP.md` (18/10) en lo que se refiere a fechas.*

## 1. Conclusión

1. **La app ya está casi lista para la tienda; lo que falta de producto es pequeño:** la primera pantalla de quien llega sin invitación, tres pistas para descubrir la Agenda y Tú, el icono definitivo y las capturas de la ficha. Lo que marca la fecha no es el diseño: son los **12 probadores durante 14 días** (`docs/33`).
2. **Para que la use mucha gente, el motor es Juntos:** cada grupo trae de 2 a 5 personas nuevas. Por eso el orden del año es: **salir** (nov–ene), **que vuelvan** con avisos (feb–abr), **que inviten** y que funcione en iPhone por la web (may–jul), y solo al final **cobrar** (ago–nov).
3. **Gratis para siempre: todo lo que hay hoy.** «PalomApp Plus» se hace solo con cosas nuevas que cuestan dinero o son de uso intensivo (más lecturas de tickets, resúmenes con IA, extras). Precio orientativo: **1,99 € al mes o 14,99 € al año**, muy por debajo de Splitwise Pro y parecido a Wallet y Spendee Plus.
4. **Plus no antes del mes 9–10 (agosto–septiembre de 2027) y solo si hay gente:** con menos de unas 300 personas activas al mes no compensa el trabajo ni las obligaciones (declararse comerciante en Google Play, impuestos).
5. **Hay una decisión que no puede esperar a Plus:** cuántas lecturas de tickets gratis recibe quien llega de la tienda. Lo que se dé el primer día ya no se puede quitar. Recomendamos 20 al mes para los nuevos y mantener 60 a los actuales.

## 2. Versión 1.0 de la tienda

### 2.1 Qué entra y qué queda fuera

| Entra sí o sí | Queda fuera de la 1.0 (y se dice en la ficha si hace falta) |
|---|---|
| Todo lo que hoy hace la web: apuntar, Movimientos, Juntos, Dinero, Agenda, importar extracto, tickets por foto, trayecto | Avisos y widget (trimestre 2) |
| App de Android (la web va dentro), botón atrás, borde a borde | Funcionar sin conexión (solo el mensaje «No hay conexión» y «Reintentar») |
| Huella al abrir y «Ocultar cifras» (decisión del dueño, ya hecho) | iPhone en la tienda (siguen usando la web) |
| «Borrar mi cuenta» (app y web) y página de privacidad | Conectar con el banco: «No conectamos con tu banco: tú importas el extracto» |
| «Descargar mis movimientos (Excel)» | Viaje con otra moneda que recuerde el importe original (hoy solo convierte a euros) |
| Un solo nombre: PalomApp | PalomApp Plus y cualquier cobro |
| Las invitaciones de Juntos abren la app si está instalada y la web si no | Botón «Antes» y versiones de prueba (se quitan) |

### 2.2 Lo que falta en producto y diseño (por orden)

| # | Qué | Propuesta | Esfuerzo | Bloquea la 1.0 |
|---|---|---|---|---|
| 1 | **Primera vez sin invitación** | Tras la bienvenida, en Inicio, una tarjeta **«Primeros pasos»** con 3 filas que se van marcando: «Apunta tu primer gasto» · «Crea un grupo e invita a alguien» · «Pon tu primera meta». Se cierra sola al completar las tres o con «Ocultar». Iconos de la app, sin emojis | M | Sí |
| 2 | **Pistas de primera vez** (`docs/32` B1) | Las tres pistas, una sola vez: calendario («Tu agenda y tus tareas están aquí»), cara («Tus ajustes, cuentas y categorías») y deslizar un movimiento | S–M | Sí |
| 3 | **Icono definitivo** | 2 o 3 propuestas con la paloma, en versión normal, redonda y de un solo color (Android la usa en iconos con tema). El de 512 px de la ficha sale del mismo dibujo. Hoy hay uno provisional | M | Sí |
| 4 | **Capturas de la ficha** | 6 capturas con un titular cada una y datos inventados: 1) «Cuentas claras con tu gente» (Juntos) · 2) «Apunta un gasto en 3 toques» · 3) «Sabes lo que te queda este mes» (Inicio) · 4) «Haz una foto al ticket y repártelo» · 5) «Ahorra para lo que quieres» (metas) · 6) «Sin anuncios. Sin conectar tu banco.» Más la imagen de cabecera | M | Sí |
| 5 | **Lecturas de tickets para los nuevos** | Decidir el número (pregunta 1) y enseñarlo siempre: «Te quedan 12 lecturas este mes» | S | Sí (decisión) |
| 6 | **Elegir versiones y quitar «Antes»** | El dueño elige Inicio y «En qué gastas» (pregunta 6 de `docs/32`, sigue abierta) | S | Sí |
| 7 | **Fecha a la vista en móviles bajos** (`docs/32` B4) | La fila «Hoy · Cuenta · Más detalles» encima de las categorías. Comprobar en el móvil pequeño real | S | Solo si se confirma en el móvil |
| 8 | **Ver la contraseña al entrar** (`docs/32` B9) | Icono para mostrarla. En el móvil se escribe mal a menudo y es la puerta de entrada | S | No, pero recomendable |
| 9 | **Pedir la valoración en buen momento** | Nunca el primer día. Tras «Saldar todo» o al cerrar un mes en positivo, una vez: «¿Te está sirviendo PalomApp?» → «Sí» abre la valoración de Google; «Regular» abre «Escríbenos» | S–M | No (1.1) |

De lo «B» de `docs/32` **no es imprescindible** para salir: B5 (rejilla del +), B6 (pago fijo → recibo) y B7 (un solo calendario de dinero). Van en el trimestre 1 si sobra tiempo, o en el 2.

## 3. Hoja de ruta por trimestres

Esfuerzo: **S** = hasta 2 días · **M** = hasta una semana · **L** = más de una semana. Es una estimación de Producto; Desarrollo la ajusta. Con 5–8 horas del dueño a la semana (probar y decidir), cabe **una cosa L y dos o tres M por trimestre**. Lo último de cada lista pasa al siguiente si no cabe.

### T1 · Noviembre 2026 – enero 2027 · «Salir»

| Qué | Por qué | Esfuerzo | Depende de |
|---|---|---|---|
| Publicar la 1.0 en Google Play | Sin tienda no hay gente nueva | L | 12 probadores 14 días, cuenta de Play, SQL de borrar cuenta aplicado |
| Lo del apartado 2.2 (puntos 1 a 6) | Que quien llega solo no se pierda el primer día | M | Decisiones del dueño (icono, versiones, tickets) |
| Cifras agregadas (apartado 5) | Sin ellas no se sabe si el plan funciona | M | Datos y Seguridad; una línea en la privacidad |
| Dirección web propia | Los enlaces de invitación, privacidad y borrar cuenta dependen hoy de `vercel.app`; cambiarla después de publicar rompe enlaces | S | Dueño (unos 10–15 € al año, cifra de memoria) |
| Pedir la valoración (2.2, punto 9) | Las primeras notas de la ficha deciden si alguien la instala | S–M | 1.0 publicada |

### T2 · Febrero – abril 2027 · «Que vuelvan»

| Qué | Por qué | Esfuerzo | Depende de |
|---|---|---|---|
| Avisos del propio móvil: fijos de mañana, tareas, fin de mes (`docs/25`) | Es lo que más recuerda abrir la app. No necesita servidor ni datos nuevos | M | App publicada |
| Viaje con otra moneda, tanda 1 (`docs/29`) | Lo que Splitwise cobra y la gente pide para viajar. Semana Santa es a finales de marzo | M–L | Datos y Seguridad (columnas nuevas) |
| Avisos de Juntos: «Ana añadió 3 gastos», «Luis te ha pagado» | Lo que hace volver a un grupo: te enteras de lo que hacen los demás | L | Tabla nueva y servicio de avisos de Google; Datos y Seguridad; actualizar el formulario de seguridad de Play |
| Widget «Te queda este mes» | Ver la cifra sin abrir la app. Con opción de tapar cifras | M | App publicada |

### T3 · Mayo – julio 2027 · «Que inviten»

| Qué | Por qué | Esfuerzo | Depende de |
|---|---|---|---|
| Invitar mejor: «Invita a tu grupo» tras el primer gasto compartido; el mensaje de WhatsApp dice ya la cifra («Te tocan 12,40 € de la cena»); recordatorio suave para las personas sin cuenta | Cada invitación aceptada es un usuario nuevo gratis. Antes del verano, que es cuando se viaja | M | Avisos de Juntos (para el recordatorio) |
| iPhone por la web: PalomApp instalable desde Safari, con guía de 3 pasos «Añadir a pantalla de inicio» | En casi todos los grupos hay alguien con iPhone. Cuesta 0 € frente a 99 USD al año de Apple | M | Nada |
| Sin conexión, parte 1: ver los últimos datos sin red | Hoy sin red no se ve nada; en un viaje pasa mucho | M | Datos y Seguridad (qué se guarda en el móvil y cómo se protege) |
| Widget «Apuntar gasto» y «Compartir con PalomApp» desde la app del banco | Apuntar e importar en dos toques | M | Widget anterior |
| Preparar Plus: pantalla, textos y aviso con 30 días de antelación | Para poder activarlo en T4 sin prisas | S | Decisión del dueño |

### T4 · Agosto – noviembre 2027 · «Sostenerla»

| Qué | Por qué | Esfuerzo | Depende de |
|---|---|---|---|
| PalomApp Plus (apartado 4) | Cubrir costes sin quitar nada a nadie | L | 300 personas activas al mes, coste por usuario medido, alta como comerciante, pagos de Google Play, Datos y Seguridad |
| Gasto fijo compartido (alquiler, luz) y «Descargar el grupo en Excel» | Lo que piden pisos y parejas (`docs/marketing/05`) | M + S | Nada |
| Sin conexión, parte 2: apuntar sin red | Completa la parte 1. Riesgo de duplicados: va despacio | L | Parte 1 y Datos y Seguridad |
| «Tu año» para compartir (resumen sin cifras personales) | En diciembre la gente comparte resúmenes: publicidad gratis | M | Informes (ya existen) |
| Decidir iPhone en la App Store | Solo si las cifras dicen que la web no basta | — | Cifras de T3; 99 USD al año y un Mac o compilar en la nube |

**No entra en el año:** conectar con el banco (sin precio público y fuera de presupuesto, `docs/25`), leer notificaciones del banco (se revisa en noviembre de 2027) y ver un grupo con enlace sin cuenta (descartado por el dueño).

## 4. Gratis frente a PalomApp Plus

### 4.1 Qué cobran hoy apps parecidas

| App | Gratis | De pago | Precio | Fuente |
|---|---|---|---|---|
| Splitwise | Unos 3–5 gastos al día y anuncios | Pro: sin límite ni anuncios, tickets, reparto por artículo, monedas, búsqueda, gráficos | 2,99–4,99 $/mes o 29,99–39,99 $/año según país | [F1], blog de un competidor |
| Tricount | Todo: «Free. No ads. No limits.» | Nada: quitaron Premium; lo paga el banco bunq | 0 | [F2], su propia web |
| Fintonic | Todo | Nada: gana cuando un usuario contrata un préstamo de sus socios | 0 | [F3] |
| Spendee | 1 cartera y 1 presupuesto | Plus: carteras y presupuestos sin límite y compartir. Premium: lo mismo, más caro | Plus 1,99 $/mes o 14,99 $/año · Premium 5,99 $/mes o 35,99 $/año | [F4], su propia web |
| YNAB | Nada (34 días de prueba) | Todo | 14,99 $/mes o 109 $/año | [F5], confianza media |
| Wallet | Limitado | Premium | 1,99 €/mes, 14,99 €/año o 49,99 € para siempre | `docs/marketing/01` (16/10/2026) |

Lectura: en gastos compartidos, **las dos grandes gratis se pagan con un banco o con préstamos**, y la que cobra (Splitwise) es la más criticada por poner límites a lo que era gratis. El hueco de PalomApp es ser gratis sin vender nada y cobrar solo por extras.

### 4.2 Propuesta

| Gratis para siempre | PalomApp Plus (todo cosas nuevas) |
|---|---|
| Apuntar gastos e ingresos sin límite | Muchas más lecturas de tickets (por ejemplo 200 al mes) y el modo «preciso» sin contar doble |
| Juntos sin límite de grupos, personas ni gastos; saldar, «¿De dónde sale?», historial, viajes con otra moneda | Resumen del mes y del año explicado con IA (hoy los informes son sin IA y siguen gratis) |
| Cuentas, metas, inversiones, deudas, agenda y tareas compartidas | Guardar la foto del ticket junto al gasto (hoy no se guarda) |
| Importar extractos y descargar en Excel | Historial del grupo de más de 6 meses |
| Huella, ocultar cifras, avisos y el widget «Te queda este mes» | Widgets extra («Próximos pagos», Juntos) y paletas e iconos de la app exclusivos |
| Sin anuncios y sin vender datos | Si un día se conecta con el banco, iría aquí |
| Lecturas de tickets: las que tenga cada persona el día que se dio de alta | «Gracias»: una marca discreta de que apoyas la app |

- **Precio orientativo:** 1,99 € al mes o 14,99 € al año, con 7 días de prueba. Sin pago «para siempre»: los costes son de cada mes.
- **Lo que queda limpio (cálculo aproximado):** de 14,99 € salen el IVA (21 %) y el 15 % de Google; quedan unos **10,50 € al año por persona que paga**, unos 0,90 € al mes. Con 300 activos y, como suposición, un 3 % pagando (9 personas), serían unos **8 € al mes**: cubre poco. Por eso Plus no es urgente y lo que importa el primer año es crecer con costes bajos.
- **Cuándo:** preparar en T3, avisar dentro de la app 30 días antes y activar **a partir de agosto–septiembre de 2027**, solo si se cumplen tres cosas: unas 300 personas activas al mes, coste por usuario medido durante 3 meses y avisos funcionando (para que Plus no sea lo primero «nuevo» que ve la gente).
- **Regla escrita, visible en Tú:** «Lo que hoy es gratis, sigue gratis. Si algún día cambia algo, te avisamos aquí un mes antes.» No promete «sin límites» (decisión del 18/10): promete no quitar.

### 4.3 Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Limitar gastos al día o grupos en la versión gratis | Es la queja n.º 1 de Splitwise (23 de 39 reseñas negativas, `docs/marketing/05`) y frena lo que nos hace crecer |
| Anuncios | Rompe «no te vendemos nada» y da muy poco con pocos usuarios |
| Cobrar los viajes con otra moneda | Es una razón para elegirnos frente a Splitwise; mejor gratis |
| Activar Plus en el mes 6 | Con pocos usuarios, obliga a declararse comerciante y a llevar impuestos por unos euros al mes |
| Donaciones («invítanos a un café») | Posible como paso previo sencillo, pero también cuenta como cobrar. Se puede valorar en T3 en lugar de Plus |

## 5. Qué medir sin analítica

No se añade ninguna herramienta de seguimiento a la app. Solo **recuentos totales** que ya salen de la base de datos, mediante una consulta de solo lectura que devuelve números y nunca filas. Reglas: nadie abre movimientos ni nombres; no se enseña una cifra si sale de menos de 5 personas; la diseña Datos y Seguridad; y la página de privacidad añade una línea: «Contamos cifras totales (por ejemplo, cuántas personas usaron la app esta semana) sin mirar el contenido».

| Cifra (por semana, salvo que se diga) | Para qué sirve | De dónde sale |
|---|---|---|
| **Personas activas** (apuntaron algo: movimiento, gasto compartido o tarea). También al mes | El número principal del año | Recuento de autores distintos por fecha de creación |
| Altas nuevas | Si la tienda trae gente | Fechas de alta de las cuentas |
| De las altas de hace 4 semanas, cuántas siguen activas (%) | Si la app engancha | Cruce de los dos anteriores |
| Grupos activos (2 o más personas con cuenta y algún gasto en la semana) | Si Juntos funciona como motor | `grupo_miembros` y `compartidos` |
| Invitaciones aceptadas por cada alta nueva | Si la gente recomienda (por encima de 1, crece sola) | Altas en `grupo_miembros` |
| De los nuevos, cuántos apuntan un gasto y cuántos entran en un grupo en 7 días (%) | Si «Primeros pasos» funciona | Recuentos por fecha de alta |
| Gastos apuntados (personales y compartidos) | Uso real | Recuento por semana |
| Lecturas de tickets y su coste al mes | El único coste variable importante | `tickets_uso` (ya guarda el consumo de cada lectura) |
| Tamaño de la base de datos (MB) | El plan gratis de Supabase llega a 500 MB [F6] | Supabase |
| Cuentas borradas al mes | Señal de descontento | Un contador sin datos personales (hoy no existe) |

Además, lo que **Google Play Console** da sin tocar la app: instalaciones, desinstalaciones, nota, reseñas y fallos.

**Metas orientativas a 12 meses (propuesta para discutir, no un dato):** 1.000 altas, 300 personas activas al mes, 100 grupos activos y más de 1 invitación aceptada por cada 2 altas.

## 6. Lista de tareas, con orden

| Orden | Dueño | Producto y Diseño | Desarrollo |
|---|---|---|---|
| 1 (ya) | Abrir la cuenta de Play; decidir «comerciante o no»; empezar a reunir 12–15 probadores | Propuestas de icono (2–3) | Aplicar el SQL de borrar cuenta (con Datos y Seguridad y el «sí» del dueño) |
| 2 | Elegir icono, versiones de Inicio y «En qué gastas», y lecturas de tickets para los nuevos | Diseño de «Primeros pasos» y de las 3 pistas | Quitar «Antes»; programar «Primeros pasos» y pistas |
| 3 | Probar la app en 2 móviles reales (uno pequeño) | Capturas y cabecera de la ficha (textos con Marketing) | Arreglos de lo que salga en los móviles |
| 4 | Decidir la dirección web propia; rellenar la ficha y los formularios de Play | Revisión final con capturas a 375 px, claro y oscuro | Consulta de cifras agregadas (con Datos y Seguridad) |
| 5 | Arrancar la prueba cerrada; a los 14 días, pedir la publicación | Diseño de la pantalla «Avisos» (T2) | Versión firmada para la prueba |
| 6 (cada mes) | 15 minutos para mirar las cifras y contestar reseñas | Revisar cifras y proponer el siguiente ajuste | — |
| T2 | Probar avisos y widget en su móvil | Textos de avisos; diseño del widget; viaje con moneda | Avisos del móvil → moneda → avisos de Juntos → widget |
| T3 | Probar en un iPhone de alguien del grupo | Flujo de invitación; guía de iPhone; pantalla de Plus | Invitar mejor → web instalable → sin conexión 1 |
| T4 | Decidir si se activa Plus, con las cifras delante | Textos y aviso de Plus; «Tu año» | Plus → fijo compartido → sin conexión 2 |

## 7. Riesgos

- **Llegar gente antes de saber cuánto cuesta cada persona.** Si los tickets se usan mucho, 60 lecturas al mes por persona no caben en 30 €. Por eso la pregunta 1 va antes de publicar.
- **El plan gratis de Supabase:** 500 MB de base de datos y sin copias propias [F6]; el plan de pago son 25 USD al mes, casi todo el presupuesto. Hay que vigilar el tamaño (el historial del grupo y las copias son lo que más crece).
- **Cobrar cambia la situación del dueño:** al vender, Google le trata como comerciante y publica dirección y teléfono (`docs/33`), y hay obligaciones fiscales. Necesita consejo de un gestor antes de T4.
- **Demasiado para 5–8 horas a la semana.** Si un trimestre se alarga, se recorta por abajo de su lista, no se apilan cosas a medio probar.
- **Avisos de más:** si molestan, la gente los apaga o desinstala. Se mantienen los límites de `docs/25` (2 al día, silencio de noche).
- **iPhone por la web puede saber a poco** (sin widget, avisos solo si se añade a la pantalla de inicio). Se mide en T3 antes de gastar en la App Store.
- **El nombre en la pantalla de crear cuenta** sigue siendo «Mis Finanzas y Tareas» (`auth-signup.js` no se toca). Quien venga de la tienda verá dos nombres.

## 8. Preguntas para el dueño

1. **(Bloquea la 1.0)** ¿Cuántas lecturas de tickets gratis al mes para quien llegue de la tienda? Recomendamos **20** (los usuarios de hoy conservan sus 60). Lo que se dé ya no se quita.
2. **(Bloquea la 1.0)** ¿Compramos una dirección web propia antes de publicar? Recomendamos **sí**: después romper enlaces sale caro.
3. **(Bloquea la 1.0)** ¿Autorizas, solo por esta vez, cambiar el nombre a «PalomApp» en la pantalla de crear cuenta (`auth-signup.js`)? Recomendamos **sí**, con revisión de Calidad.
4. ¿De acuerdo con que Plus no se active antes de agosto–septiembre de 2027 y solo con unas 300 personas activas al mes? Recomendamos **sí**. No bloquea.
5. ¿iPhone por la web en T3 y decidir la App Store en T4 con cifras? Recomendamos **sí**. No bloquea.
6. ¿Te valen las metas orientativas del apartado 5 (1.000 altas, 300 activas al mes)? No bloquea.

## 9. Lo que no hemos podido averiguar o confirmar

- **Cuánto cuesta leer un ticket.** El consumo se guarda en `tickets_uso`, pero no lo hemos consultado. Sin esa cifra, el número de lecturas gratis y el de Plus son orientativos.
- **Cuánta gente paga en apps así.** El 3 % es una suposición nuestra para hacer el cálculo, sin fuente.
- **Precio de Splitwise Pro en España:** la fuente da dólares y dice que cambia por país. La página oficial de YNAB no se pudo abrir (https://www.ynab.com/pricing, bloqueada por la herramienta); su precio sale de un comparador. Los precios de Spendee de su web (en dólares) no coinciden con los que vimos el 16/10 en la App Store de España (6,99 € al mes y 39,99 € al año el Premium).
- **Si Google cobra y entrega el IVA** por el dueño en España: lo damos por hecho en el cálculo, sin haberlo comprobado. Las obligaciones fiscales de cobrar no las ha revisado nadie.
- **Qué partes de «B» de `docs/32` están ya hechas** en la rama en curso lo hemos mirado solo buscando los textos en el código, sin abrir la app: no aparecen las pistas (B1) ni «mostrar contraseña» (B9); sí huella, ocultar cifras, Excel, «No hay conexión» y la contraseña nueva.
- **Requisitos exactos de la ficha de Play** (número y tamaño de capturas, imagen de cabecera): no consultados hoy.
- Si todas las tablas guardan la fecha de creación de cada fila (hace falta para contar «activos»): lo dirá Datos y Seguridad.
- El precio de una dirección web y la fecha exacta de Semana Santa de 2027 los decimos de memoria.
- Nada de esto se ha probado en un móvil real. Los esfuerzos son de Producto, no de Desarrollo.

## 10. Fuentes (consultadas el 10/11/2026)

- [F1] Finny, «Splitwise Pricing 2026» (06/08/2026). **Interés propio: app de la competencia.** https://getfinny.app/blog/splitwise-pricing-2026
- [F2] Tricount, «What happened with tricount Premium?» (sin fecha). **Interés propio: su web.** https://help.tricount.com/articles/what-happened-with-tricount-premium
- [F3] Fintonic en la App Store de España (gratis; dice que cobra a sus socios de préstamos; 4,3 con unas 26.000 valoraciones). **Interés propio: su ficha.** https://apps.apple.com/es/app/fintonic-ahorra-y-fin%C3%A1nciate/id672220319
- [F4] Spendee, planes y precios («pueden cambiar según el país»). **Interés propio: su web.** https://www.spendee.com/premium
- [F5] CostBench, precio de YNAB (verificado por ellos el 04/11/2026, confianza media). https://www.costbench.com/software/personal-finance/ynab/
- [F6] Supabase, precios (plan gratis: 500 MB, 50.000 usuarios activos al mes, se pausa tras una semana sin uso; Pro desde 25 USD al mes). https://supabase.com/pricing.md
- [F7] Google Play, comisiones (en Europa desde el 30/06/2026: 10 % de servicio más 5 % por cobrar con Google en suscripciones). https://support.google.com/googleplay/android-developer/answer/112622?hl=en
- Documentos propios: `CLAUDE.md`, `docs/25`, `docs/29`, `docs/32`, `docs/33`, `docs/ROADMAP.md`, `docs/marketing/01-competencia.md`, `docs/marketing/05-criticas-tricount-splitwise.md`, `docs/marketing/PLAN.md`. Código leído (sin tocar): `supabase/functions/tickets-ia/index.ts` (`LIMITE_MES = 60`) y, en la rama `fase9/pulido`, búsqueda de textos en `app.js`.

Para el PDF: una línea de tiempo de 4 bloques (Salir · Que vuelvan · Que inviten · Sostenerla) con 3 o 4 piezas por bloque y Plus marcado con una condición («300 activas al mes»); dos columnas enfrentadas «Gratis para siempre» y «Plus»; y un boceto de móvil con la tarjeta «Primeros pasos» en Inicio (3 filas con casilla e icono).

# 35 · Costes, impuestos, legal y riesgos para lanzar PalomApp (10/11/2026)

*Datos y Seguridad. Solo lectura: no se ha cambiado código ni nada en Supabase (esta vez no hemos tenido acceso a Supabase: lo que dependa de mirar el proyecto está en el apartado 8). Precios y normas consultados el 10/11/2026; pueden cambiar. **No es asesoramiento fiscal ni legal**: antes de cobrar, un gestor. Los proveedores cobran en dólares (USD); no hemos consultado el cambio del día.*

## 1. Conclusión

1. **Crecer gratis cuesta poco; cobrar es lo caro.** Con la app gratis, el gasto mensual sale en unos 0 USD con 50 usuarios, 27–47 con 500 y 67–87 con 10.000. El presupuesto de 0–30 € aguanta hasta unos 500–2.000 usuarios activos al mes, según se pague o no por los precios de bolsa.
2. **Lo primero que se rompe no es la base de datos, son los correos de registro:** Supabase, sin un servicio de correo propio, solo manda 2 correos por hora. Con un lanzamiento público, casi nadie podría confirmar su cuenta. Hay que comprobarlo y arreglarlo **antes de publicar**.
3. **El día que haya plan de pago cambian tres cosas a la vez:** Vercel gratis deja de valer (es solo para uso no comercial), en Google Play pasas a ser «comerciante» (se publican tu dirección y tu teléfono) y lo prudente es darte de alta en Hacienda y como autónomo (unos 80 €/mes el primer año). Por eso recomendamos **no cobrar hasta tener a la vista unos 60–100 suscriptores**.
4. **Google se queda el 15 % de una suscripción** (10 % de servicio + 5 % por usar su sistema de cobro) y liquida él el IVA de los clientes de la UE. De Plus a 1,99 €/mes (`docs/34`) te llegan unos **1,40 €**; de 14,99 €/año, unos **10,50 €** (0,88 € al mes).
5. **Leer un ticket cuesta ~0,0008 USD en modo normal y ~0,016 USD en «más precisión»** (20 veces más). Las 20 lecturas gratis para los nuevos **caben en el presupuesto si «más precisión» no entra en las 20**: con uso normal, hasta unos 4.000–8.000 usuarios junto con Supabase Pro. Si todo el mundo gastara las 20, solo hasta unos 300–600 (apartado 3b).
6. **Dos huecos de seguridad antes de abrir al público:** la copia semanal no incluye las cuentas (correos y contraseñas), así que hoy no serviría para levantar la app en otro sitio; y la copia cifrada cuelga de un repositorio público. Además, cualquiera puede gastar 60 lecturas «precisas» de ticket al mes, que cuestan 20 veces más que las normales.

## 2. Costes al mes según usuarios activos (USD)

| Usuarios activos al mes | 50 | 500 | 2.000 | 10.000 | 50.000 |
|---|---|---|---|---|---|
| Supabase | 0 (gratis) | 25 (Pro) | 25 | ~30 | ~90 |
| Lectura de tickets (Anthropic) | 0,2 | 2 | 7 | 37 | 185 |
| Precios de bolsa (EODHD) | 0 | 0 o 20 | 0 o 20 | 0 o 20 | 20 o más |
| Vercel, GitHub, rutas, cripto, Ministerio | 0 | 0 | 0 | 0 | 0–35 |
| **Total con la app gratis** | **~0** | **27–47** | **32–52** | **67–87** | **~295–330** |
| Añadir si hay plan de pago | +20 Vercel Pro (o 0 si la web se muda) | igual | igual | igual | igual |

Aparte: 25 USD una sola vez por la cuenta de Google Play. Un dominio propio (recomendado en `docs/33`) serían unos 10–15 € al año (orientativo, sin fuente).

**Supuestos (estimados del código y del esquema; ninguno medido):**

- **Espacio:** un movimiento ocupa unos 0,4 KB con sus índices (más si lleva artículos de un ticket). Una persona activa: unos 1.000 movimientos al año, más ajustes, tareas, Juntos e historial. Contamos **1 MB por usuario activo** (incluye a los que se registran y lo dejan) y 50 MB de base.
- **Salida de datos:** la app descarga **todos** tus movimientos cada vez que se abre (`data-layer.js`). Contamos 5 MB por usuario y mes. Es el supuesto más dudoso: puede ser de 2 a 10.
- **Tickets:** la foto se reduce a 1.568 px. Calculamos unos 3.000 tokens de entrada y 1.000 de salida por ticket. Modo normal (`claude-haiku-5-5`, 0,10 / 0,50 USD por millón): **~0,0008 USD por ticket**. «Más precisión» (`claude-sonnet-5-5`, 2 / 10 USD): **~0,016 USD**. Suponemos que 1 de cada 5 usuarios lee 8 tickets al mes y 1 de cada 10 lecturas es precisa. El dato real está en `tickets_uso` (guarda los tokens): hay que mirarlo.
- **Supabase a escala:** por encima de Pro se paga 0,125 USD por GB de base, 0,09 por GB de salida, 10 USD por cada 1.000 conexiones de tiempo real y máquina más grande (Small ~15, Medium ~60 USD; Pro trae 10 de crédito).

### Dónde se rompe cada plan gratis

| Servicio | Límite gratis | Se rompe hacia | Qué haríamos |
|---|---|---|---|
| Supabase: correos de registro | 2 por hora sin correo propio | **El primer día de lanzamiento** | Conectar un servicio de correo (SMTP) y activar CAPTCHA en el registro |
| EODHD (bolsa y fondos) | 20 consultas al día | 15–20 activos distintos entre todos (¿50–200 usuarios?) | Tope de activos seguidos, o plan de 19,99 USD, o dejarlo para el plan de pago |
| Supabase: tamaño de la base | 500 MB | ~450 usuarios | Pasar a Pro (25 USD: 8 GB) |
| Supabase: salida de datos | 5 GB al mes | ~1.000 usuarios (500–2.500) | Pro (250 GB) y descargar solo lo nuevo |
| Supabase: copias | **Ninguna** en gratis | Ya | Pro trae copia diaria (7 días) |
| Supabase: pausa | Tras 7 días de poca actividad | No con uso diario | Nada; en Pro no existe |
| Supabase: tiempo real | 200 conexiones a la vez | 4.000–7.000 usuarios | Pro (500) |
| Supabase: cuentas activas | 50.000 (Pro: 100.000) | 50.000 | Pro |
| Vercel Hobby | 100 GB; **solo uso personal no comercial** | Cuando se cobre o se anuncie un plan de pago | Vercel Pro (20 USD) o mudar la web (es estática) |
| Anthropic | No hay plan gratis | Se come solo los 30 € hacia 8.000 usuarios | «Más precisión» solo de pago; tope de gasto mensual |
| CoinGecko | 10.000 consultas al mes (plan Demo) | Muchos usuarios con cripto | Plan Basic, 35 USD |
| GitHub Actions | Gratis en repositorio público | No | — |

## 3. Cobrar en Google Play

| Tema | Qué hay hoy (10/11/2026) |
|---|---|
| Comisión por suscripción (Europa, desde el 30/06/2026) | 10 % de servicio + 5 % por el cobro con Google Play = **15 %** |
| Primer millón de USD al año | También 10 % + 5 % |
| IVA de clientes de la UE | Lo calcula, cobra e ingresa **Google**. Tú no. Lo descuenta antes de pagarte |
| Cómo paga | Transferencia al banco hacia el día 15 del mes siguiente, en euros, a partir de 1 USD |
| Ejemplo: 2,99 € al mes | 0,52 de IVA → 2,47; menos 15 % → **unos 2,10 € para ti** (antes de tus impuestos) |
| Cuenta «comerciante» | Si ganas dinero con la app, sí. Se publican nombre, **dirección, teléfono** y correo |

### Impuestos y autónomo en España (particular con nómina)

| Pregunta | Situación real | Qué recomendamos |
|---|---|---|
| ¿Hacienda? | Hay que darse de alta en el censo con el **modelo 036** antes de empezar a ingresar. El 037 ya no existe (desde el 03/02/2025) | Alta con gestor el mismo mes en que se active el cobro |
| ¿Cómo se declara? | Como ingresos de una actividad económica en la renta. Lo habitual: pagos trimestrales (modelo 130) y declaraciones de IVA aunque el IVA del cliente lo liquide Google (tu «cliente» es Google en Irlanda: suele pedirse el registro de operadores intracomunitarios). **Esto último es práctica de gestorías, no lo hemos leído en la Agencia Tributaria** | Que lo fije el gestor |
| ¿Autónomo desde el primer euro? | **La ley no pone un mínimo de ingresos.** Obliga cuando la actividad es «habitual». Durante años los jueces usaron el salario mínimo (SMI) como pista de habitualidad, y de ahí viene la idea de «por debajo del SMI no hace falta». El Tribunal Supremo (sentencia 941/2025, 10/07/2025) ha dicho que ganar menos del SMI **no libra por sí solo**: cuenta si la actividad es continua y organizada | Una suscripción a la venta todo el año se parece mucho a «continua y organizada». Lo prudente: **alta desde que se cobre**. No darse de alta es un riesgo (cuotas atrasadas con recargo) que solo debes asumir con un gestor delante |
| ¿Cuánto cuesta? | Tarifa plana: **80 €/mes 12 meses**; otros 12 si ganas menos del SMI (17.094 € al año). Después, tramo más bajo: unos **206 €/mes**. Tener nómina a la vez es compatible («pluriactividad»); no hemos confirmado sus rebajas | Contarlo como coste fijo del plan de pago |
| ¿Y mientras sea gratis? | Sin ingresos ni publicidad no hay nada que declarar ni alta que hacer | Seguir así hasta decidir cobrar |
| ¿Y si ya fueras autónomo? | No hay cuota nueva: se añade la actividad con un 036 y los ingresos se suman a los tuyos | Decírnoslo: cambia el umbral de abajo |

**Cuántos suscriptores de Plus hacen falta** (1,40 € netos al mes o 0,88 € si pagan al año; los costes fijos son unos 80 € de tarifa plana + ~45 € de Supabase Pro y Vercel Pro, sin cambio de moneda exacto):

| Para cubrir | Coste al mes (€) | Todos mensuales | Todos anuales |
|---|---|---|---|
| Solo la tarifa plana | 80 | ~57 | ~91 |
| Tarifa plana + Supabase y Vercel | ~125 | ~90 | ~140 |
| Tras la tarifa plana (cuota ~206 €) | ~250 | ~180 | ~285 |

Con las 300 personas activas que pide `docs/34` para activar Plus, harían falta un **30–45 % pagando** solo para cubrir la tarifa plana y la infraestructura: muy por encima de lo normal (en `docs/34` suponen un 3 %). Con un 3 %, el punto de equilibrio está en **unos 3.000–4.700 activos**. Es decir: con 300 activos, Plus haría perder dinero por la cuota de autónomo; o se espera a tener varios miles, o se confirma con un gestor que se puede empezar sin alta (apartado de autónomos).

## 3b. Lo que cuesta cada lectura de ticket y si caben 20 gratis

La función `tickets-ia` usa hoy **`claude-haiku-5-5`** (normal) y **`claude-sonnet-5-5`** («Leer con más precisión»), con un límite de **60 al mes por persona que se comparte entre los dos modos**. Foto reducida a 1.568 px en el móvil; respuesta de 4.096 tokens como mucho.

| Modo | Precio (USD por millón: entrada / salida) | Ticket normal (~3.000 / ~1.000 tokens) | Ticket muy largo (3.000 / 4.096) |
|---|---|---|---|
| Normal (Haiku 5.5) | 0,10 / 0,50 | **~0,0008 USD** | ~0,0023 USD |
| Más precisión (Sonnet 5.5) | 2 / 10 | **~0,016 USD** | ~0,047 USD |

Mil lecturas normales cuestan unos 0,80 USD; mil precisas, unos 16 USD.

**Coste al mes de los tickets con 20 gratis por persona (USD):**

| Usuarios activos al mes | 50 | 500 | 2.000 | 10.000 | 50.000 |
|---|---|---|---|---|---|
| A. Uso normal, solo modo normal (1 de cada 5 lee 8 al mes) | 0,06 | 0,6 | 2,6 | 13 | 64 |
| B. Uso normal, 1 de cada 10 lecturas precisa | 0,2 | 1,9 | 7,4 | 37 | 186 |
| C. Todos gastan las 20, modo normal | 0,8 | 8 | 32 | 160 | 800 |
| D. Todos gastan las 20, todas precisas | 16 | 160 | 640 | 3.200 | 16.000 |

**¿Caben en 0–30 €?** Si se paga Supabase Pro (25 USD), quedan unos 5–10 para tickets:

- **Caso A:** caben hasta unos **4.000–8.000** activos. Es lo que recomendamos: «más precisión» fuera de las 20 gratis (o con un cupo propio pequeño, por ejemplo 3 al mes).
- **Caso B:** hasta unos **1.400–2.700**.
- **Caso C:** hasta unos **300–600**. No es realista que todos gasten las 20, pero un grupo de cuentas falsas sí podría: por eso hacen falta el CAPTCHA y un **tope de gasto mensual en la consola de Anthropic**.
- **Caso D:** no cabe ni con 50 personas. Es la razón para separar «más precisión».
- **Los 60 de los usuarios actuales** no cambian nada en el coste: son pocas personas (peor caso en modo normal, ~0,05 USD cada una al mes; en preciso, ~1 USD).

Todo esto son estimaciones: los tokens reales de cada lectura están en `tickets_uso` (columnas `tokens_entrada` y `tokens_salida`). Con tu «sí», una consulta de solo lectura daría la media real, sin mirar quién ha leído qué.

## 4. Legal mínimo

| Qué | Antes de publicar (gratis) | Antes de cobrar |
|---|---|---|
| RGPD | Al abrir la app al público deja de ser algo «doméstico» y el RGPD se aplica entero. Hace falta: política de privacidad (`privacidad.html`, hecha en la rama `fase9/pulido`, **aún no publicada**), **registro de actividades** (la AEPD dice que en la práctica casi todos deben llevarlo; es una hoja), borrar cuenta (rama `datos/borrar-cuenta`, sin aplicar) y saber qué hacer ante una fuga (avisar a la AEPD en 72 h) | Revisar la política (pagos, Google como vendedor) |
| Encargados | Aceptar o guardar el contrato de datos de cada uno: Supabase (va dentro de sus condiciones, con cláusulas tipo para sacar datos de la UE), Vercel, Anthropic, GitHub (copias), OpenRouteService. La política ya los nombra; **falta GitHub** | Igual |
| Fuera de la UE | Anthropic (EE. UU.) recibe la foto del ticket: por defecto no la conserva y no entrena con ella sin permiso. **No sabemos en qué región está el proyecto de Supabase**: si no es la UE, hay que decirlo en la política | Igual |
| Aviso legal (LSSI, art. 10) | Recomendable: quién eres y un correo | **Obligatorio**: nombre, NIF, domicilio y correo en la web |
| Condiciones de uso | Recomendables: la app no asesora ni mueve dinero, «tal cual», qué pasa con Juntos | **Obligatorias** con lo del consumidor: precio, renovación, cómo cancelar, desistimiento (lo gestiona Google, pero hay que contarlo) |
| Menores | La política dice «no para menores de 14» (edad de consentimiento en España). En Google Play, declarar público adulto | Igual |
| Licencia financiera | **No hace falta.** El Banco de España solo exige registro a quien **accede en línea a tus cuentas del banco** (servicio de información sobre cuentas). PalomApp no se conecta: tú escribes o importas un archivo que se lee en tu móvil. No mueve dinero ni recomienda inversiones | Igual. Si un día se conecta a bancos: solo con un proveedor registrado |

## 5. Recomendaciones de seguridad y fiabilidad

- **Copias: hoy no bastan para una app pública.** (a) Solo guardan el esquema `public`: sin las cuentas, una restauración en un proyecto nuevo dejaría los datos sin dueño. (b) Perder hasta 7 días es mucho con desconocidos. (c) En un repositorio público, cualquiera con cuenta de GitHub puede descargar el archivo cifrado: todo depende de la contraseña. (d) No consta que se haya probado restaurar. **Propuesta:** copia diaria, incluir las cuentas, guardarla en un sitio privado y hacer un simulacro de restauración. Con Supabase Pro, además, copia diaria suya de 7 días.
- **Tickets:** límite aparte para «Más precisión» (por ejemplo 3–10 al mes, porque cuesta 20 veces más y hoy comparte el límite de 60; ver 3b), tope de gasto mensual en la consola de Anthropic y un tope diario global en la función. Peor caso hoy: **~1 USD al mes por cada cuenta** que lo exprima.
- **Registro masivo:** CAPTCHA en registro y recuperación, confirmación por correo (ya está) y activar la protección de contraseñas filtradas (pendiente desde el 19/10).
- **Bolsa y rutas:** un solo usuario puede gastar el cupo diario de todos (EODHD: 20; `trayecto` no tiene límite por persona). Añadir un tope por persona y día.
- **Errores sin espiar:** nada de analítica. Un vigilante externo que mire cada 5 minutos si la web y Supabase responden y avise por correo; los avisos de consumo de Supabase y Anthropic; y el informe semanal de salud. Más adelante, una tabla propia de errores sin datos personales (sería una migración aditiva, con su revisión y tu «sí»).
- **Si se cae Supabase:** mensaje claro en la app («no podemos guardar ahora; tus datos están a salvo»), mirar su página de estado y esperar. Mudarse a otro proyecto solo es posible cuando la copia incluya las cuentas. La app sin conexión (pendiente) reduce el daño.
- **Incidencias con 5–8 h a la semana:** una sola persona. Prometer por escrito respuesta en 72 h, no «al momento». Una hoja de «qué hago si…» (fuga, caída, clave filtrada, factura rara). Claves y accesos en el gestor de contraseñas, y que una persona de confianza sepa dónde están.
- **Descargar solo lo nuevo** al abrir la app: es lo que más alarga el plan gratis y el Pro (tarea de Desarrollo).

## 6. Riesgos

| Riesgo | Probabilidad | Daño | Qué hacemos |
|---|---|---|---|
| Nadie puede registrarse el día del lanzamiento (2 correos/hora) | Alta si no hay correo propio | Alto | Comprobar y conectar SMTP antes de publicar |
| Perder datos y no poder restaurar las cuentas | Baja | Muy alto | Copia diaria con cuentas + simulacro |
| Fuga de datos (clave filtrada, regla RLS mal puesta en una función nueva) | Baja | Muy alto | Revisión de cada migración, pruebas de aislamiento, plan de 72 h |
| Abuso de tickets con cuentas falsas | Media | Medio (dinero) | Límite de «precisa», tope de gasto, CAPTCHA |
| Cobrar sin alta en Hacienda o Seguridad Social | Media si se improvisa | Alto (recargos, sanción) | Gestor antes de activar el cobro |
| Tu dirección y teléfono públicos al ser comerciante | Segura si cobras | Medio (privacidad) | Decidirlo antes; preguntar al gestor por una dirección profesional |
| Vercel suspende la web por uso comercial en Hobby | Media si se cobra sin cambiar | Alto (web y enlaces caídos) | Pro o mudanza antes de anunciar el plan de pago |
| Supabase gratis se llena y la base queda en solo lectura | Alta al crecer | Alto | Avisos de consumo; pasar a Pro al 70 % |
| EODHD se queda sin cupo y los precios no se actualizan | Alta pronto | Bajo | Tope de activos o plan de pago |
| Un proveedor sube precios o cambia condiciones | Media | Medio | Revisar este documento cada 3 meses |
| El dueño no está disponible (una sola persona) | Media | Alto | Accesos documentados y persona de confianza |
| Copia cifrada descargable por cualquiera | Segura hoy | Bajo si la contraseña es larga; muy alto si no | Sacarla del repositorio público |

## 7. Tareas, en orden

| # | Tarea | Quién | ¿Bloquea publicar? |
|---|---|---|---|
| 1 | Mirar en Supabase (solo lectura): región, si hay correo propio, tamaño real, consumo de `tickets_uso` | Datos y Seguridad, con tu «sí» | Sí |
| 2 | Conectar un servicio de correo y activar CAPTCHA y contraseñas filtradas (panel de Supabase) | Dueño, guiado | **Sí** |
| 3 | Borrar cuenta: prueba en la base real y aplicar (`datos/borrar-cuenta`) | Datos y Seguridad, con tu «sí» | **Sí** (Google) |
| 4 | Copia diaria, con cuentas, en sitio privado; simulacro de restauración | Datos y Seguridad + Dueño (secretos) | Sí |
| 5 | Límite de «Más precisión», tope diario de tickets, tope por persona en bolsa y rutas | Desarrollo | Sí (lo de tickets) |
| 6 | Tope de gasto en Anthropic y avisos de consumo en Supabase | Dueño | Sí |
| 7 | Registro de actividades, hoja de incidentes, añadir GitHub y la región a la política | Datos y Seguridad | Sí |
| 8 | Condiciones de uso y aviso legal básicos | Datos y Seguridad + Dueño | No (sí para cobrar) |
| 9 | Vigilante de caídas y mensaje «sin servicio» en la app | Desarrollo | No |
| 10 | Descargar solo lo nuevo al abrir | Desarrollo | No |
| 11 | Decidir Supabase Pro (al publicar o al llegar al 70 %) | Dueño | No |
| 12 | **Antes de cobrar:** gestor, 036, autónomo, comerciante en Play, Vercel Pro o mudanza, condiciones de suscripción | Dueño + todos | Bloquea cobrar |

## 8. Preguntas para el dueño

1. **¿Nos das el «sí» para mirar Supabase en solo lectura** (región, correo, tamaños, tickets)? No cambia nada. *Bloquea las tareas 1, 2 y 7.*
2. **¿Supabase Pro (25 USD) desde el día de publicar o esperar a llenarse?** Recomendamos desde el día de publicar: trae copias diarias y se come casi todo el presupuesto, pero es lo que protege los datos. *No bloquea.*
3. **Precios de bolsa:** ¿tope de activos con el plan gratis, o 20 USD al mes? Recomendamos tope ahora y que sea una ventaja del plan de pago. *No bloquea.*
4. **¿20 lecturas gratis para los nuevos, sin contar «más precisión»?** Recomendamos sí: 20 normales y «más precisión» con cupo propio de 3 al mes (o solo en Plus). *Bloquea la tarea 5 y la 1.0 (`docs/34`, pregunta 1).*
7. **¿Plus con 300 activos aunque pierda dinero por la cuota de autónomo, o esperar a unos 3.000?** Recomendamos preguntarlo al gestor en el verano de 2027, con las cifras reales. *No bloquea publicar.*
5. **¿Eres ya autónomo, o lo has sido en los últimos 2–3 años?** Cambia el coste de cobrar (sin cuota nueva, o sin tarifa plana). *Bloquea solo el plan de pago.*
6. **¿Aceptas que tu dirección y teléfono sean públicos cuando cobres?** Si no, hay que buscar alternativa antes. *Bloquea solo el plan de pago.*

## 9. Lo que no hemos podido confirmar

- **Nada de dentro de Supabase:** región del proyecto, si ya hay correo propio, tamaño real de la base, salida de datos real, tokens reales por ticket, plan actual. No tuvimos acceso en esta sesión.
- La página de Google sobre la **declaración de comerciante** no se pudo abrir hoy (support.google.com/googleplay/android-developer/answer/17594752). Lo de la dirección y el teléfono viene de `docs/33` (consultada el 08/11) y de un blog.
- Los **cupos de OpenRouteService** (la página oficial, giscience.github.io/openrouteservice/hosted-api-restrictions, no se pudo abrir) y si su plan gratis admite una app comercial.
- Cómo cuenta Anthropic los tokens de una imagen en estos modelos (platform.claude.com/docs/en/build-with-claude/vision no se pudo abrir): los 3.000 de entrada son una estimación.
- Las cifras de autónomos (80 €, 206 €, SMI) salen de webs de asesorías, **no de la Seguridad Social**. La página de plazos del 036 de la Agencia Tributaria no deja leerse de forma automática.
- El trato exacto del IVA y los modelos trimestrales al vender por Google Play; la pluriactividad; si un particular puede dar otra dirección como comerciante.
- Si los planes «personales» de EODHD y el plan Demo de CoinGecko permiten usarse en una app de pago.
- Si otro alojamiento gratuito para la web admite uso comercial (no pudimos leer sus condiciones).
- El texto del art. 10 de la LSSI y del art. 7 de la LOPDGDD se citan por referencia; no se releyeron hoy. No hemos mirado si ha cambiado la edad de consentimiento de los menores.
- Si los artefactos de GitHub en un repositorio público tienen coste de almacenamiento (la página solo habla de los privados).
- El cambio USD/EUR del día.

## 10. Fuentes (consultadas el 10/11/2026)

- Supabase, precios y límites: https://supabase.com/pricing · máquinas: https://supabase.com/docs/guides/platform/compute-and-disk · pausa: https://supabase.com/docs/guides/platform/free-project-pausing · lista para producción (correos, CAPTCHA, límites): https://supabase.com/docs/guides/deployment/going-into-prod · contrato de datos: https://supabase.com/legal/dpa
- Vercel, uso justo y uso comercial: https://vercel.com/docs/limits/fair-use-guidelines · plan Pro: https://vercel.com/docs/plans/pro-plan
- Anthropic, precios: https://platform.claude.com/docs/en/about-claude/pricing · conservación de datos: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
- EODHD, precios: https://eodhd.com/pricing · CoinGecko, precios: https://www.coingecko.com/en/api/pricing
- GitHub Actions, facturación: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- Google Play, comisiones: https://support.google.com/googleplay/android-developer/answer/112622 y https://support.google.com/googleplay/android-developer/answer/16954621 · IVA: https://support.google.com/googleplay/android-developer/answer/138000 y https://support.google.com/paymentscenter/answer/7158952 · pagos: https://support.google.com/googleplay/android-developer/answer/137997
- Agencia Tributaria, supresión del 037 (Orden HAC/1526/2024): https://sede.agenciatributaria.gob.es/Sede/todas-noticias/2025/enero/9/orden-ministerial-modificacion-declaraciones-censales.html · modelo 036: https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G322.shtml (no leída)
- Consejo General de Gestores Administrativos, sentencia del Supremo 941/2025 (interés propio: recomiendan gestor): https://www.consejogestores.org/noticias/cuando-debe-darse-de-alta-en-el-reta-un-autonomo-con-ingresos-bajos-el-tribunal-supremo-lo-aclara/
- Cuotas de autónomos 2026 (asesorías, interés propio): https://www.oie.es/cuotas-de-autonomos/ y https://www.billeo.es/tarifa-plana-autonomos
- AEPD, registro de actividades: https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/7-registro-de-actividades-de-tratamiento/FAQ-0249-estoy-obligado-a-elaborar-un-rat
- Banco de España, información sobre cuentas: https://clientebancario.bde.es/pcb/es/blog/informacion_cuentas_iniciacion_pagos.html
- LSSI (Ley 34/2002): https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758 (por referencia)
- Fdaytalk, comerciante en Google Play (interés propio: blog).
- Producto, `docs/34` (precio de Plus, 20 lecturas, 300 activos).
- Código: `supabase/functions/tickets-ia/index.ts` (modelos y límite de 60), `activos-api` (20 consultas al día), `trayecto`, `data-layer.js`, `app.js` (`TICKET_LADO`), `.github/workflows/backup-semanal.yml`, `privacidad.html`, rama `datos/borrar-cuenta`.

Para el PDF: una gráfica de escalera con el coste mensual según usuarios y una línea horizontal en 30 €; y un «semáforo» de dos columnas, «publicar gratis» y «empezar a cobrar», con lo que exige cada una.

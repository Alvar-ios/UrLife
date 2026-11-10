# 37 · Primera vez sin agobios, iPhone casi a la vez y un panel de cifras

*Producto y Diseño · 10/11/2026. Responde a las cuatro preocupaciones del dueño del 10/11: que la gente no entienda la app y se agobie, que no se forme comunidad, quedarnos atrás frente a Tricount y Splitwise, y tener objetivos medibles con un panel. Parte de `docs/34`, `docs/32`, `docs/36` y del código de la bienvenida (`obPasos`, `empiezaPasos`). Recorrido hecho con capturas a 375 × 667 y 390 × 844, en claro y oscuro, con datos inventados: una persona que llega de Google Play sin invitación y otra que llega con una invitación de Juntos. No se ha tocado el código de la app. Precios y normas consultados el 10/11/2026: pueden cambiar.*

## 1. Conclusión

1. **Lo primero que ve un recién llegado son finanzas, no lo fácil.** La bienvenida pregunta el saldo del banco y los recibos fijos antes de dejarle apuntar nada, y el primer día tiene a la vista más de 40 cosas que tocar (10 opciones en el +, unas 20 filas en Tú, metas, inversiones y deudas en Dinero). Proponemos un **modo «Lo básico»** para los nuevos: el primer día solo **apuntar y Juntos**; el resto se va sugiriendo cuando tiene sentido, y nada se pierde: todo se encuentra con la lupa y con «Ver todas las herramientas».
2. **Quien llega invitado ve dos sustos:** la bienvenida le pide el saldo de su banco en mitad de la invitación, y en Inicio le sale **«Te queda este mes −49,00 €»** en grande solo porque su parte de la cena cuenta como gasto. Hay que quitar ese paso y cambiar esa cifra mientras no haya apuntado ingresos (prioridad A).
3. **Para no depender de que los demás tengan la app:** PalomApp ya sirve a una sola persona (Tricount no) y ya admite **personas sin cuenta**. Falta ponerlo delante: compartir con alguien escribiendo solo su nombre, un WhatsApp que se entiende sin la app, y **«Empezar con los saldos de otra app»** a mano en un minuto. Importar el archivo de Splitwise es posible (lo exporta por grupo en CSV); el de Tricount, no: **Tricount quitó su exportación** y solo la da escribiendo a su soporte.
4. **iPhone: la misma app de Capacitor en la App Store, empezando ya con TestFlight para la familia.** Cuesta **99 USD al año**. TestFlight no pide 12 probadores ni 14 días: la familia puede tenerla en diciembre y la App Store, en enero, a la vez que Google Play. Apple **probablemente** la aceptará porque lleva todo dentro, pide cuenta, usa Face ID y la cámara, pero hay riesgo real de un primer rechazo por la norma 4.2.
5. **11 indicadores y 3 de salud, con un panel propio:** una función `kpis_semana()` que devuelve solo números (nunca filas de personas, nada por debajo de 5), guarda una foto cada lunes y alimenta un `panel.html` que solo abre el dueño. Las cifras de las tiendas y las redes se meten a mano en 5 minutos a la semana.

---

## Parte A · Primera vez y «demasiadas herramientas»

### A.1 Lo que pasa hoy (capturas en `docs/img/37/`)

| # | Momento | Qué ve | Problema |
|---|---|---|---|
| 1 | Bienvenida, «¡Hola!» (`01`) | 4 filas: apuntar, cuánto te queda, Juntos, cuentas-metas-deudas. «¿Cómo te llamas?» | Bien, pero vende 4 cosas. Juntos va tercero |
| 2 | Pasos 2 y 3 | «¿Cuánto tienes hoy en el banco?» y «¿Qué se repite cada mes?» (nómina, alquiler, luz…) | Deberes de finanzas antes de ver nada útil. A 667 px, el aviso «No nos conectamos a tu banco» queda tapado por los botones |
| 3 | Inicio, primer día (`02`) | «Te queda este mes 0,00 €», «Empieza aquí»: saldo del banco y primer gasto | Juntos no sale en «Empieza aquí» hasta el paso 7 de 7 |
| 4 | Botón + (`03`) | 10 opciones: Gasto, Ingreso, Compartido, Tarea, Apartar, Invertir, Pago fijo, Pago de deuda, Importar, Trayecto | Para el primer día sobran 6 |
| 5 | Dinero (`06`) | «Empieza por aquí»: banco, primera meta, una deuda | Correcto, pero es otra lista de deberes |
| 6 | Tú | Unas 20 filas: reglas de categorías, informes, papelera, copia de seguridad, «Qué hay de nuevo · Parche 8», y en «Más ajustes», **«Botón "Antes" (pruebas)»** | Ruido. Lo de pruebas y las novedades no tienen sentido para alguien nuevo |
| 7 | Invitado, paso 1 | «Ana te invita a compartir gastos», nombre, «Unirme al grupo» | Muy bien |
| 8 | Invitado, paso 2 (`04`) | «Ya estás en Escapada a Asturias» y debajo «¿Cuánto tienes hoy en el banco?» | Viene a ver lo que debe de una cena: este paso sobra |
| 9 | Invitado, en el grupo | «Así funciona Juntos», «Debes 38,00 € a Ana» con «Saldar» | Muy bien |
| 10 | Invitado, Inicio (`05`) | **«Te queda este mes −49,00 €»** en grande, barra naranja, «Empieza aquí: pon el saldo de tu banco» | Parece que va mal sin haber hecho nada. Es su parte de los gastos del grupo, contada como gasto |

### A.2 Propuesta: modo «Lo básico» y descubrir poco a poco

**Regla:** las 4 pestañas de abajo no cambian nunca (cambiar la navegación despista más que lo que ahorra). Lo que cambia es **lo que hay dentro**. Nada se borra ni se bloquea: lo escondido se encuentra con la lupa y con **Tú → «Ver todas las herramientas»**.

- Quién lo tiene: solo las cuentas **nuevas** (las que pasan por la bienvenida desde la 1.0). Los usuarios de hoy siguen viéndolo todo.
- Dónde se guarda: en la configuración de cada persona (`cfg().nivel = 'basico' | 'todo'` y `cfg().descubierto = {clave: fecha}`). Sin tocar Supabase.
- Se pasa a «todo» sola al cumplir 30 días o al tocar «Ver todas las herramientas».

| Qué | Día 1 («Lo básico») | Cuándo aparece | Cómo se ofrece (texto exacto) |
|---|---|---|---|
| Apuntar gasto e ingreso, foto del ticket | Sí | — | — |
| Juntos: compartir, grupos, personas sin cuenta, saldar, WhatsApp | Sí | — | — |
| Botón + | 4 grandes: **Gasto · Ingreso · Compartir · Foto del ticket**. Debajo, un enlace **«Más opciones»** | Las demás, siempre tras «Más opciones» | — |
| Saldo del banco (Cuentas) | Fila en «Primeros pasos» | Desde el día 1, sin prisa | «Pon el saldo de tu banco» · «Así sabrás lo que tienes de verdad.» |
| Tarea y Agenda | Solo el icono de arriba | Día 2, una pista | «Tu agenda y tus tareas están aquí» |
| Presupuestos y «Así vas» | No | Con 10 gastos apuntados | Tarjeta en Inicio: `chart` · **«¿Ponemos un tope a lo que más gastas?»** · «En Restaurantes llevas 86 €. Elige cuánto quieres gastar al mes.» · «Poner tope» / «Ahora no» |
| Recibos y nómina («Cada mes») | No (sale de la bienvenida) | Día 3 con 3 o más gastos | `repeat` · **«¿Qué se repite cada mes?»** · «Apunta la nómina y los recibos y verás cómo acabarás el mes.» · «Añadir» / «Ahora no» |
| Importar extracto | En «Más opciones» | Con 15 gastos a mano, o si borra 3 seguidos | `fileIn` · **«¿Te cansas de apuntar?»** · «Trae el extracto de tu banco y lo colocamos solo.» · «Importar» / «Ahora no» |
| Metas (Apartar) | En Dinero, una fila | Al poner el saldo del banco | `target` · **«¿Ahorras para algo?»** · «Un viaje, la entrada de la casa, un colchón…» · «Crear meta» |
| Deudas e inversiones | No | Siempre en Dinero, plegadas en **«¿Tienes algo más? Deudas e inversiones»** | — |
| Trayecto | En «Más opciones» | Al crear un grupo de viaje | Dentro del grupo: `car` · «¿Ibais en coche? Calcula la gasolina» |
| Informes y balance del mes | No | Al cerrar el primer mes con algo apuntado | El aviso de Inicio de hoy |
| Compartir mi agenda | No | Con 5 tareas y un grupo | En la Agenda, al final: «Compartir mi agenda ›» (ya en `docs/32` A6) |
| Tú | 4 grupos cortos: Tu cuenta, Cuentas y categorías, Grupos y personas, La app. **Fuera:** reglas, papelera, copia, «Qué hay de nuevo», «Antes» | Con «Ver todas las herramientas» o a los 30 días | Fila al final de Tú: `sliders` · **«Ver todas las herramientas»** · «Informes, reglas, papelera, copia de seguridad…» |

Límites para no molestar: **una sola sugerencia al día**, nunca en la bienvenida ni con una hoja abierta. «Ahora no» la aplaza 7 días; si la descarta dos veces, no vuelve. Las sugerencias usan iconos de la app, sin emojis.

### A.3 La bienvenida, más corta

| Quién | Hoy | Propuesta |
|---|---|---|
| Sin invitación | 4 pasos: Hola, Tu banco, Cada mes, Listo | **2 pantallas.** 1) «¡Hola!» con el nombre. 2) **«¿Por dónde empiezas?»** con 3 botones grandes: `plus` **«Apuntar un gasto»** · `users` **«Compartir gastos con alguien»** · `bank` **«Poner mi banco al día»**. Lleva directamente a esa acción. «Saltar» lleva a Inicio. El banco y los recibos pasan a «Primeros pasos» y a las sugerencias |
| Con invitación | 3 pasos: Invitación, Tu banco, Listo | **1 pantalla** (la invitación, ya buena) y directo al grupo con «Así funciona Juntos». Sin banco ni «Todo listo» |

Alternativa más prudente: quitar solo «Cada mes» y dejar 3 pasos. Ver pregunta 2.

### A.4 Tarjeta «Primeros pasos» (sustituye a «Empieza aquí» para los nuevos)

Tarjeta en Inicio, debajo de la cifra grande. Tres filas con casilla redonda; al hacer una, se marca con `check`, se tacha suave y suena `sentir('ok')`. Arriba a la derecha: «1 de 3». Al completar las tres: confeti una vez, **«¡Ya lo tienes!»** y desaparece al día siguiente. Con «Ocultar», se va.

| Llega… | Fila 1 | Fila 2 | Fila 3 |
|---|---|---|---|
| Sin invitación | `plus` **Apunta tu primer gasto** · «O hazle una foto al ticket.» | `users` **Comparte un gasto con alguien** · «Basta con su nombre: no hace falta que tenga la app.» | `bank` **Pon el saldo de tu banco** · «Así sabrás lo que te queda de verdad.» |
| Con invitación | `users` **Añade lo que pagues en «Escapada a Asturias»** · «La app lo reparte entre todos.» | `plus` **Apunta un gasto tuyo** · «Solo lo ves tú.» | `send` **Crea tu propio grupo** · «Para la casa, la pareja o el próximo viaje.» |

La fila 3 del invitado es la que cierra el bucle: el que llega invitado se convierte en el que invita.

Título de la tarjeta: **«Primeros pasos»**. Sin la palabra «tutorial».

### A.5 Pistas de primera vez

Una sola vez cada una, como mucho una al día, con «Entendido». Un globo pequeño con flecha hacia lo señalado, en el acento de la paleta.

| Cuándo | Señala | Texto |
|---|---|---|
| Día 2, al abrir | Icono del calendario | «Tu agenda y tus tareas están aquí» |
| Al entrar en Tú por primera vez | Cara de arriba | «Tus ajustes, cuentas y categorías» |
| Con 3 movimientos, en la Lista | Primer movimiento | «Desliza a la izquierda para duplicar o borrar» |
| Primera vez que debes o te deben en Juntos | Primera persona | «Toca a una persona para saldar o pedírselo por WhatsApp» |

### A.6 La cifra grande del invitado

Mientras la persona **no tenga ingresos ni cuentas**, la tarjeta de Inicio no dice «Te queda». Dice:

- Arriba: **«Gastos de este mes»** · cifra en el color normal del texto (sin rojo ni naranja): **«49,00 €»**.
- Debajo: «De ellos, 49,00 € son tu parte en Juntos.» y un enlace **«Apunta lo que cobras y verás cuánto te queda ›»**.

En cuanto apunte un ingreso o ponga el saldo del banco, vuelve a ser «Te queda este mes».

### A.7 La puerta para no depender de Tricount o Splitwise

| # | Qué | Propuesta (textos exactos) | Prioridad |
|---|---|---|---|
| P1 | **Valor para uno solo** | En la ficha y en «¡Hola!»: «Tus gastos, aunque nadie más use la app. Y cuando compartas, cuentas claras.» Juntos vacío ya invita a compartir; añadir debajo: «¿Tus amigos no tienen PalomApp? No pasa nada: añádelos por su nombre.» | A |
| P2 | **Compartir escribiendo un nombre** | En «Compartir un gasto», el campo «¿Con quién?» acepta un nombre nuevo y crea una persona sin cuenta en ese momento: **«Añadir a "Lucía" (sin cuenta)»**. Al guardar: «Lucía no tiene la app. Puedes pedirle su parte por WhatsApp cuando quieras.» | A |
| P3 | **«Pedir por WhatsApp» que se entienda sin la app** | Mensaje con la cuenta y, para las personas sin cuenta, su enlace para entrar: «¡Hola, Lucía! De la cena en Cudillero te tocan 29,00 € (87 € entre 3). Cuando puedas, ¿me haces un Bizum? Si quieres ver las cuentas tú también, entra aquí y ocupa tu sitio en el grupo: [enlace]». Sin emoji al final (hoy lleva uno) | A |
| P4 | **Empezar con los saldos de otra app** | En «Crear grupo», un enlace: `swap` **«¿Veníais de Tricount o Splitwise?»** → hoja «Copia los saldos de la otra app»: una fila por persona con lo que debe o le deben, y un apunte **«Saldo traído de otra app»** por persona. Comprueba que suma 0: «Los saldos tienen que sumar 0. Ahora suman 4,50 €.» Funciona con cualquier app, sin archivos | B |
| P5 | **Importar un grupo de Splitwise (CSV)** | Splitwise exporta cada grupo a CSV con fecha, descripción, categoría, coste, moneda y una columna por persona (positivo si pagó, negativo si debe). Leerlo, pedir «¿Quién eres tú?» (como hace Splitser) y crear los gastos con personas sin cuenta | C |
| P6 | Importar Tricount | **Descartado por ahora:** Tricount quitó la exportación a CSV y PDF (era de Premium) y la da escribiendo a su soporte. Para Tricount, P4 | — |

### A.8 Prioridades de la parte A

| Prioridad | Qué | Esfuerzo |
|---|---|---|
| **A (antes de la 1.0)** | Invitado sin paso del banco (A.3) · cifra grande del invitado (A.6) · «Primeros pasos» con Juntos (A.4) · el + con 4 grandes y «Más opciones» · quitar «Antes» y «Qué hay de nuevo» a los nuevos · P1, P2, P3 | M |
| **B (enero–febrero)** | Bienvenida de 2 pantallas · modo «Lo básico» con sus sugerencias (A.2) · 4 pistas (A.5) · P4 | M |
| **C (cuando haya cifras)** | P5 (Splitwise CSV) · afinar los umbrales de las sugerencias con los datos del panel | M |

---

## Parte B · iPhone casi a la vez

### B.1 Las tres opciones

| | (1) Web instalable (PWA) | (2) App de Capacitor en la App Store | (3) PWA ahora y App Store después |
|---|---|---|---|
| Cómo la instala la familia | Safari → Compartir → «Añadir a pantalla de inicio». A mano: iPhone no tiene aviso de instalar | Desde la App Store (antes, con TestFlight) | Como (1) y luego como (2) |
| Coste | 0 € | 99 USD al año [B1] | 0 € y luego 99 USD al año |
| Avisos | Sí desde iOS 16.4, **solo si está en la pantalla de inicio**, y el permiso se pide al tocar un botón [B2]. Hace falta un servidor de avisos web que no tenemos | Sí, los del propio móvil (fijos, tareas) sin servidor, y los de Juntos con el servidor de Apple | Dos sistemas de avisos que mantener |
| Face ID, widget | No | Face ID ya está en la app (el complemento sirve en iPhone). Widget, más adelante | — |
| Lo que falta hoy | Archivo de instalación (manifest) y un «service worker»: hoy no hay ninguno de los dos | Carpeta de iPhone, firma y compilar en un Mac en la nube | Todo lo anterior |
| Revisión | Ninguna | Apple revisa: el 50 % en menos de 24 h y el 90 % en menos de 48 h [B3]. Riesgo de la norma 4.2 | — |
| En Europa | Apple quiso quitar las webs instaladas en la UE con iOS 17.4 y dio marcha atrás en marzo de 2024 [B4] | — | — |

### B.2 Recomendación: opción 2, con TestFlight desde diciembre

- **Por qué no la PWA sola:** en iPhone casi nadie «añade a la pantalla de inicio» sin ayuda (ya lo vimos en `docs/25`), sin eso no hay avisos, y hoy no tenemos ni el archivo de instalación. Haríamos el trabajo dos veces: avisos web ahora y avisos de Apple después.
- **Mientras tanto (gratis y ya):** la familia puede usar la web en Safari hoy mismo. Añadir un archivo de instalación mínimo (icono y nombre «PalomApp») es pequeño y deja un buen icono en la pantalla de inicio. Sin avisos web.

**¿Aceptaría Apple nuestra app?** Probablemente sí, sin garantía. La norma 4.2 pide que una app sea más que «una web reempaquetada» y rechaza lo que no es «útil, única o con aspecto de app» [B5]. A favor: la web va **dentro** de la app (no carga una página de internet), pide cuenta y guarda datos propios, usa Face ID, la cámara para los tickets, vibración y compartir con WhatsApp, y ya tiene «Borrar mi cuenta» dentro. En contra: Apple ha rechazado apps con avisos, ubicación y compartir diciendo que eso **no basta** para dejar de parecer una web [B6]. Para reducir el riesgo:

1. Que nada parezca Safari: ningún enlace que abra el navegador para cosas propias, las descargas (Excel, copia) con el menú de compartir del iPhone, y borde a borde con la muesca bien resuelta.
2. Enviarla con los **avisos del propio móvil** (recordatorio de fijos y tareas, `docs/25`), aunque en Android lleguen en el T2.
3. Dar al revisor una cuenta de prueba con datos inventados y una nota corta: «App de finanzas personales y gastos compartidos. Los datos se guardan en la cuenta del usuario. Face ID protege la app.»

**TestFlight, la vía rápida para la familia:** hasta 100 probadores internos (personas añadidas como usuarios del equipo en App Store Connect) y hasta 10.000 externos por invitación o enlace público. Solo el **primer** envío a externos pasa una revisión, y cada versión dura 90 días [B7]. No hay mínimo de probadores ni de días.

**Sin Mac:** se compila en GitHub Actions con un Mac en la nube. GitHub dice que los ejecutores estándar son gratis en repositorios públicos (el nuestro lo es) [B8]; la página no nombra macOS en esa frase, y en privado costaría 0,062 USD por minuto. Las guías habituales usan un Mac **una vez** para preparar los certificados [B9]; puede que se pueda hacer todo con la clave de App Store Connect, pero no lo hemos probado. Plan B: un Mac prestado una hora.

**Obligaciones nuevas:** declarar si eres «comerciante» en la UE (si lo eres, Apple publica dirección, teléfono y correo; si no, avisa de que no aplican los derechos del consumidor) [B10]; la ficha de privacidad de Apple; y textos de permisos de Face ID y cámara.

### B.3 Calendario y coste

| Cuándo | Qué | Quién |
|---|---|---|
| 10–23 nov | Abrir la cuenta de Apple Developer como particular (99 USD) y decidir si eres comerciante | Dueño |
| 17–30 nov | Archivo de instalación mínimo para la web (icono en iPhone) | Desarrollo (S) |
| 24 nov – 7 dic | Carpeta de iPhone en `movil/`, compilación en GitHub Actions, permisos, Face ID, muesca. Primera versión a TestFlight | Desarrollo (M–L) |
| 8–22 dic | **Familia con TestFlight**, a la vez que la prueba cerrada de Google | Dueño · Calidad |
| Fin dic – ene | Enviar a revisión con los avisos del móvil. Margen de 1–2 semanas por si hay un rechazo | Desarrollo · Dueño |
| **Enero 2027** | **iPhone en la App Store, a la vez que Google Play** | Todos |

**Coste:** 99 USD al año (unos 8 USD al mes, dentro de los 30 € del presupuesto), más la cuenta de Google Play ya prevista. **Coste en tiempo:** de 1 a 2 semanas de Desarrollo y unas horas del dueño. `docs/36` decía «no abrir el frente de iPhone nativo este año»: esto lo cambia, y algo del T1 tiene que esperar (proponemos retrasar «Pedir la valoración» y P4).

---

## Parte C · Indicadores y panel

### C.1 Qué es «activa»

**Persona activa = guardó algo en ese periodo**: un movimiento (columna `creado_en`, que la app rellena siempre, también al importar), un gasto o pago compartido que creó ella (`compartidos.creado_por` y `created_at`) o un plan de la agenda (`agenda.created_at`). Se puede contar ya, sin tocar nada.

- **Lo que se pierde:** quien solo abre la app para mirar (por ejemplo, el amigo que mira lo que debe). Para contarlo haría falta **una columna nueva y opcional**: `ultimo_dia` (solo la fecha, se sobrescribe una vez al día al abrir) en la configuración de cada persona. No guarda historial. Decide el dueño con Datos y Seguridad (pregunta 6).
- Las tareas no cuentan hasta que Datos confirme que tienen fecha de creación.

### C.2 Los indicadores

Objetivos: a 3 y 6 meses de publicar (abril y julio de 2027), el **escenario esperado** de Marketing; a 12 meses, el **compromiso** del plan, con el objetivo de trabajo entre paréntesis (`docs/36`, págs. 1 y 7). Lo marcado con «(P)» es una propuesta de Producto sin fuente: se revisa en abril con datos reales.

| # | Indicador | Definición y fórmula | De dónde | Cada | 3 m · 6 m · 12 m |
|---|---|---|---|---|---|
| 1 | Visitas a la ficha | Personas que ven la ficha. Conversión = instalaciones ÷ visitas | Play Console; App Store Connect (vistas de la página) | Semana, a mano | Medir; objetivo en abril (P) |
| 2 | Instalaciones | Instalaciones nuevas, Android + iPhone, acumuladas | Play Console; App Store Connect (primeras descargas) | Semana, a mano | 300 · 900 · 2.500 |
| 3 | Altas por canal | Cuentas nuevas, por canal: **invitación** (se unió a un grupo en sus primeras 24 h) o **directa**; y por plataforma (Android, iPhone, web) | Fecha de alta de las cuentas + grupos; plataforma: nuevo dato `altaCanal` en la configuración | Semana | 200 · 550 · 1.000 (1.500) |
| 4 | Apunta en 24 h | Altas de la semana que guardan algo en sus primeras 24 h ÷ altas de la semana | Alta + `creado_en` + `compartidos` | Semana | 50 % · 55 % · 60 % (P) |
| 5 | Grupo en 7 días | Altas que en 7 días crean un grupo o se unen a uno con 2 o más personas ÷ altas | Alta + `grupo_miembros` | Semana | 30 % · 35 % · 40 % (P) |
| 6 | **Activas al mes** | Personas distintas activas en los últimos 30 días | Ver C.1 | Semana | 80 · 220 · 300 (500) |
| 7 | Retención a 7 y a 30 días | De las altas de una semana: % activas entre los días 7 y 13, y entre los días 30 y 36 | Alta + actividad, por semana de alta | Semana | 7 d: 30 · 35 · 40 % · 30 d: 15 · 20 · 25 % (P) |
| 8 | Activas al día ÷ al mes | Media de activas cada día de la semana ÷ activas al mes | Actividad | Semana | 15 % · 18 % · 20 % (P) |
| 9 | Invitaciones | Enlaces creados en la semana y % usados en 7 días | `grupo_invitaciones` (`created_at`, `usada_en`), `invitado_enlaces` | Semana | ≥ 40 % usadas (P) |
| 10 | Lo que trae cada alta | Altas por invitación ÷ altas directas | Indicador 3 | Mes | ≥ 0,5 (`docs/34`) |
| 11 | **Grupos activos** | Grupos con 2 o más personas con cuenta y algún gasto en la semana | `grupo_miembros`, `compartidos` | Semana | 20 · 60 · 100 (150) |
| S1 | Valoración | Nota media y número de reseñas, cada tienda | Play Console; App Store Connect | Semana, a mano | 4,3 (10) · 4,4 (40) · 4,4 (100) |
| S2 | Cierres inesperados | % de personas con un cierre al día (Android). Google penaliza por encima del 1,09 % [C1] | Play Console (Android vitals); App Store Connect (solo cuenta a quien acepta compartir datos [C2]) | Semana, a mano | < 1 % siempre (criterio de Calidad) |
| S3 | **Coste por activa** | (Supabase + lecturas de tickets + tiendas y dominio prorrateados) ÷ activas al mes. Con los **MB de la base de datos** (el plan gratis llega a 500) | Facturas (a mano); `tickets_uso` (tokens); tamaño de Supabase | Mes | ≤ 0,10 USD por activa (P, sale de `docs/36`, pág. 7) |

**Cuándo pasar a Supabase Pro (lo vigila S3):** al llegar a **350 MB o 400 activas al mes** (`docs/36`), o antes si se corta el registro por los correos. El panel lo marca en ámbar al 70 % y en rojo al 90 %.

Sobre los objetivos de retención: las referencias públicas no se ponen de acuerdo. Una da para apps de finanzas un 6 % a 7 días y un 2 % a 30 días (datos de Adjust, 2025) [C3]; otra, un 42 % y un 28 % sin decir de dónde salen [C4]. Las nuestras son intermedias porque la mayoría llegará por invitación de alguien conocido.

### C.3 Cómo se mide sin espiar

- Una función **`kpis_semana(semana)`** en Supabase que devuelve **solo números** (un JSON con claves y cifras). Nunca devuelve filas, correos, nombres ni importes. Cualquier cifra calculada sobre **menos de 5 personas** sale como «<5».
- **Solo la puede usar el dueño** (comprobando su cuenta en una tabla privada de administradores) o el servicio interno. Sin permiso para el resto. La diseña Datos y Seguridad.
- **Una foto cada lunes:** una tarea programada (pg_cron, como la de carburantes) guarda el resultado en `kpis_historial(semana, clave, valor)`. Así hay historial sin guardar nada de nadie.
- **Lo de fuera, a mano:** `kpis_manual(semana, clave, valor)` con un formulario en el panel: visitas, instalaciones, nota y cierres de cada tienda, seguidores y visitas de TikTok e Instagram, factura de Supabase y de Anthropic. Unos 5 minutos el lunes.
- Datos nuevos que hacen falta: `altaCanal` (Android, iPhone o web; en la configuración, sin migración); confirmar si `grupo_miembros` tiene fecha de alta y si `grupo_invitaciones` guarda quién la usó; y, si se aprueba, `ultimo_dia`.
- La línea de la página de privacidad ya propuesta en `docs/34`: «Contamos cifras totales (por ejemplo, cuántas personas usaron la app esta semana) sin mirar el contenido».

### C.4 El panel

Una página aparte, `panel.html`, en la misma web, sin enlace desde la app. Se entra con la cuenta del dueño. Fondo oscuro, con el aspecto «Nuevo».

- **Arriba, 5 cifras** con flecha frente a la semana anterior y una barra hacia el objetivo: **Activas al mes** · **Altas de la semana** (y % por invitación) · **Grupos activos** · **Retención a 30 días** (último grupo de altas que ya ha cumplido 30 días) · **Coste del mes** (€ y por activa, con los MB de la base de datos).
- **Gráficas:**
  1. Activas al mes y a la semana, con la línea del objetivo.
  2. Embudo de la semana: visitas → instalaciones → altas → apuntan en 24 h → grupo en 7 días.
  3. Tabla de grupos de alta por semana, con la retención a 7 y a 30 días en verde, ámbar o rojo.
  4. Bucle de Juntos: invitaciones creadas y usadas, y lo que trae cada alta.
  5. Salud: nota, cierres, MB de 500 y coste.
- **Debajo, las señales de `docs/36`** escritas como avisos: «Menos de 40 activas en abril: revisa la ficha y los primeros pasos antes que el marketing» y «Más de 220 activas: prepara Supabase Pro».

### C.5 Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Google Analytics, PostHog o similares dentro de la app | Siguen a cada persona, piden aviso de cookies y van contra «sin vender ni mirar tus datos» |
| Looker Studio o Metabase conectados a la base de datos | Las claves de la base de datos saldrían de Supabase, o habría que pagar un servidor |
| Modo «Lo básico» que cambie las pestañas de abajo | Cambiar la navegación despista más de lo que ayuda, y rompe las capturas de la ficha |
| Un interruptor «Modo sencillo» en Tú, sin más | Casi nadie lo encuentra el primer día: el modo tiene que venir puesto |
| Importar Tricount | No exporta sin pedirlo a su soporte (A.7, P6) |
| PWA como única vía en iPhone | Sin instalar no hay avisos, y la familia necesita la app ya (B.2) |

## 2. Riesgos

- **Esconder de más:** alguien que viene por las metas no las encuentra. Por eso todo sale con la lupa y con «Ver todas las herramientas», y en Dinero siempre hay una fila «¿Ahorras para algo?».
- **Dos versiones de la app (básica y completa)** multiplican lo que Calidad tiene que probar. Hay que limitar lo escondido a lo de la tabla A.2 y probar las dos.
- **Rechazo de Apple por la 4.2:** retrasaría el iPhone de 1 a 3 semanas. Por eso se envía con avisos del móvil y con margen.
- **El iPhone le quita tiempo a otra cosa del T1** con 5–8 horas a la semana del dueño.
- **Cifras pequeñas engañan:** con 20 altas a la semana, un 30 % puede ser 6 personas. Los porcentajes con menos de 20 personas se enseñan en gris y con el número al lado.
- **«Activa» sin `ultimo_dia` cuenta de menos** a quien solo mira. El indicador 6 saldrá algo más bajo que las «activas» de las tiendas.

## 3. Preguntas para el dueño

1. **(Bloquea la 1.0)** ¿Quitamos el paso «¿Cuánto tienes en el banco?» a quien llega con invitación y cambiamos su cifra grande (A.3 y A.6)? Recomendamos **sí**.
2. **(Bloquea el diseño)** Bienvenida sin invitación: ¿**2 pantallas** («¡Hola!» y «¿Por dónde empiezas?», recomendado) o 3 (solo quitar «Cada mes»)?
3. ¿Modo «Lo básico» para los nuevos, que pase a «todo» a los 30 días o al pedirlo? Recomendamos **sí**, en B (enero–febrero).
4. **(Bloquea el iPhone)** ¿Abres ya la cuenta de Apple Developer (99 USD al año) y vamos a la App Store en enero, con TestFlight para tu familia en diciembre? Recomendamos **sí**. Eso retrasa «Pedir la valoración» y P4.
5. **(Bloquea el iPhone)** En Apple, ¿te declaras comerciante o no? Con la app gratis y sin cobrar, parece «no», pero conviene confirmarlo con quien te asesore (igual que en Google Play).
6. ¿Añadimos la columna `ultimo_dia` para contar también a quien solo mira? Recomendamos **sí**, tras revisarlo con Datos y Seguridad. No bloquea.
7. ¿Te valen los objetivos de C.2 (esperado a 3 y 6 meses, compromiso a 12)? No bloquea; se revisan en abril.

## 4. Lo que no hemos podido averiguar o confirmar

- **Nada probado en un iPhone ni en un móvil real.** El recorrido se hizo con capturas en Chromium y datos inventados; el teclado del sistema y la muesca no se ven.
- **Si Apple aceptará la app:** es una valoración nuestra, sin respuesta de Apple. El caso de rechazo citado es de otra app.
- **Si se puede preparar la firma de iPhone sin ningún Mac:** las guías que vimos usan un Mac una vez. Tampoco está confirmado en el texto de GitHub que los Mac en la nube sean gratis en repositorios públicos (dice «ejecutores estándar»).
- **Precio de Apple en euros:** Apple dice 99 USD «o en moneda local donde esté disponible»; no hemos visto la cifra en euros.
- **Que una cuenta de Apple de particular se active en días:** no consultado.
- **Que Apple pida una cuenta de prueba para el revisor y «borrar cuenta» dentro de la app:** lo decimos de memoria; no lo hemos leído hoy en las normas.
- **Límites de las webs instaladas en iPhone:** una fuente (MagicBell, marzo de 2026) dice que en la UE ya no funcionan como app y que se borran los datos tras 7 días sin abrir. Lo primero contradice la marcha atrás de Apple de 2024; no lo hemos podido aclarar.
- **Columnas de Supabase:** si `grupo_miembros` guarda la fecha de alta, si `grupo_invitaciones` guarda quién la usó, si `tareas` tiene fecha de creación y cómo se lee la fecha de alta de las cuentas. Lo confirma Datos y Seguridad.
- **Si Play Console sigue dando la conversión de la ficha:** un artículo de agosto de 2026 dice que la página de conversión ahora da visitas, clics y porcentaje de clics, y que las instalaciones siguen en otra pantalla. La ayuda oficial no se pudo abrir.
- **Exportación de Splitwise desde el móvil:** sabemos que exporta CSV por grupo (por terceros que lo importan), pero la página de ayuda de Splitwise no se pudo abrir.
- Los objetivos marcados «(P)» no tienen fuente: son propuesta de Producto.

## 5. Fuentes (consultadas el 10/11/2026)

- [B1] Apple, qué incluye el Apple Developer Program («99 USD por año de membresía, o en moneda local donde esté disponible»). https://developer-mdn.apple.com/programs/whats-included/
- [B2] WebKit, «Web Push for Web Apps on iOS and iPadOS» (2023): avisos solo en webs añadidas a la pantalla de inicio, permiso al tocar, manifest con `display: standalone`. https://webkit.org/?p=13878
- [B3] Apple, App Review (50 % en menos de 24 h, 90 % en menos de 48 h; revisión urgente posible). https://developer.apple.com/distribute/app-review
- [B4] 9to5Mac, 01/03/2024: Apple seguirá ofreciendo las webs en la pantalla de inicio en la UE. https://9to5mac.com/2024/03/01/apple-home-screen-web-apps-ios-17-eu/
- [B5] MobiLoud, normas de revisión de Apple para apps hechas con web (cita la 4.2 y la 4.2.2; sin fecha). **Interés propio: venden apps de este tipo.** https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper
- [B6] Foros de Apple, rechazo por 4.2 del 20/06/2026 («avisos, ubicación o compartir no dan una experiencia suficiente»). https://developer.apple.com/forums/thread/835422
- [B7] Apple, App Store Connect, resumen de TestFlight (100 internos, 10.000 externos, revisión solo del primer envío, 90 días). https://www.developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview
- [B8] GitHub, cómo se mide el uso de Actions (ejecutores estándar gratis en repositorios públicos; macOS 0,062 USD por minuto). https://docs.github.com/en/billing/concepts/product-billing/github-actions
- [B9] Capgo, compilar Capacitor para iPhone con GitHub Actions y fastlane (actualizado 27/08/2026). **Interés propio: venden compilación en la nube.** https://capgo.app/blog/automatic-capacitor-ios-build-github-action-with-match/
- [B10] Apple, App Store Connect, comerciante según la Ley de Servicios Digitales de la UE. https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-compliance-information
- [A1] Tricount, «What happened with tricount Premium?» (la exportación a CSV y PDF era de Premium; pedirla al soporte). **Interés propio: su web.** https://help.tricount.com/articles/tricount-faqs
- [A2] Spliit (app libre de gastos compartidos), propuesta de importar Splitwise con el formato de su CSV. https://github.com/spliit-app/spliit/issues/22
- [A3] Splitser, «Switch from Splitwise» (exportar el grupo a CSV, importarlo y elegir tu nombre). **Interés propio: competidor.** https://splitser.com/splitwise-switch-service
- [C1] Android Developers, Android vitals (cierres percibidos: umbral del 1,09 %; ANR: 0,47 %). https://developer.android.com/google/play/vitals
- [C2] Apple, métricas de App Store Connect (impresiones, vistas de la página, conversión; uso y cierres solo de quien acepta compartir). https://developer.apple.com/help/app-store-connect/reference/app-metrics
- [C3] Stream, guía de retención (publicada 22/01/2026, actualizada 23/10/2026; finanzas según Adjust 2025: 12 %, 6 %, 2 %). **Interés propio: venden herramientas para apps.** https://getstream.io/blog/app-retention-guide
- [C4] Unstar, referencias de retención 2026 (11/05/2026; finanzas 58 %, 42 %, 28 %; fuentes sin nombrar). https://unstar.app/fr/blog/app-retention-benchmarks-2026
- [C5] Moburst, cambios en las métricas de Play Console (07/08/2026). **Interés propio: agencia de marketing de apps.** https://www.moburst.com/blog/google-play-console-metrics-overhaul-what-aso-teams-need-to-know/
- MagicBell, límites de las webs instaladas en iPhone (20/03/2026; contradice [B4] en lo de la UE). **Interés propio: vende avisos.** https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
- Bloqueadas por la herramienta: la ayuda de Splitwise sobre exportar (https://splitwise.uservoice.com/knowledgebase/articles/88333) y la de Google sobre adquisición en Play Console (https://goo.gle/2CEvk4g).
- Propios: `docs/25`, `docs/32`, `docs/34`, `docs/36`; código leído sin tocar: `app.js` (`obPasos`, `obBancoHtml`, `empiezaPasos`, `pedirMsg`, `crearHtmlV2`), `data-layer.js`, `movil/capacitor.config.json`, `supabase/functions/tickets-ia/index.ts`, `supabase/migrations/`. Capturas: `docs/img/37/` (6 pantallas a 375 × 667, claro). El guion de prueba para repetirlas está en `docs/img/37/prueba/` (no forma parte de la app ni de `npm test`).

Para el PDF: 1) antes y después de Inicio del invitado («−49,00 €» frente a «Gastos de este mes 49,00 €»); 2) boceto de la tarjeta «Primeros pasos» con 3 filas y «1 de 3»; 3) una escalera «Día 1 → 10 gastos → día 3 → primer mes → 30 días» con lo que aparece en cada escalón; 4) calendario del iPhone (nov → ene) junto al de Google Play; 5) boceto del panel: 5 cifras arriba y el embudo debajo.

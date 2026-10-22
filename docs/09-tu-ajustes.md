# Fase 4 · Tú y ajustes: propuesta de Producto y diseño (22/10/2026)

*Una sola propuesta recomendada, lista para programar hoy. Sin cambios en Supabase. Leído en el código (`renderTu`, `ticketPedir`, `tickets-ia`); no medido en un navegador.*

## 1. Conclusión

1. **Tú tiene hoy 23 filas en 6 grupos y mezcla lo diario con lo que casi nadie toca** (métodos de pago, fuentes de ingreso, el botón de pruebas «Antes»). Proponemos **4 grupos con unas 17 filas a la vista** y el resto en un «Más ajustes» plegado. No se pierde nada: el buscador encuentra también lo plegado.
2. **Cabecera con tu nombre de verdad** (`cfg().nombre`, el de la bienvenida), tu avatar con **el mismo color que te pone Juntos** y un botón «Editar». Hoy sale el nombre de un grupo cualquiera.
3. **«Te quedan N lecturas de tickets este mes»**, sin tocar Supabase: la app recuerda el último «usados de límite» que devuelve la función, por mes, en tu configuración. Se ve en Tú siempre, y en el botón + y en la hoja del ticket **cuando queden 10 o menos**.
4. **«Escríbenos»** por WhatsApp o correo, con el mensaje ya empezado. Los datos de contacto van en una constante `CONTACTO` vacía; **si está vacía, la fila no sale**. Ojo: lo que se ponga ahí será público.
5. **«Cerrar sesión» pide confirmación** y queda al final, en «Tu cuenta». Hoy se cierra con un toque, sin preguntar.

## 2. Cómo queda Tú, de arriba abajo

| # | Bloque | Filas, en este orden (texto exacto) | A la derecha de la fila |
|---|---|---|---|
| 1 | **Cabecera** | Avatar de 56 px (inicial en blanco sobre `colorPersona(miUid())`), nombre en grande y debajo el correo en gris. Botón «Editar» con `ic('edit')` | — |
| 2 | **Buscador** | «Buscar un ajuste» (como hoy) | — |
| 3 | **Tu dinero** | `bank` Cuentas y saldos · `tag` Categorías y presupuestos · `tag` Reglas de categorías · `repeat` Cobros y pagos recurrentes · `calendar` Tu mes · `users` Grupos y personas | «2 cuentas», «desde el día 28», «3 grupos» (como hoy) |
| 4 | **Traer y guardar** | `download` Importar extracto o Excel · `receipt` Fotos de tickets (solo si `ticketsDisponible()`) · `trash` Papelera · `download` Copia de seguridad | «quedan 52 de 60», «vacía» |
| 5 | **La app** | `palette` Aspecto y sensaciones · `moon` Tema (Auto · Claro · Oscuro, como hoy) · `sparkle` Qué hay de nuevo · `flag` Volver a ver la bienvenida | «Parche 7» |
| 6 | **Tarjeta «Escríbenos»** | Tarjeta con borde de acento: `send` «**Escríbenos** · ¿Algo falla o tienes una idea? Lo lee quien hace la app.» | `chevR` |
| 7 | **Más ajustes** (plegado) | Una fila `sliders` «Más ajustes» con `chevD`. Al tocar despliega: `chart` Moneda · `card` Métodos de pago · `wallet` Fuentes de ingreso · `checkCircle` Categorías de tareas · `list` Importaciones · `swap` Botón «Antes» (pruebas) | «6», y luego «EUR €», «sí/no» |
| 8 | **Tu cuenta** | `shield` Verificación en dos pasos (si `mfaDisponible()`) · Cerrar sesión (texto en color `--expense`) | — |
| 9 | **Pie** | Texto pequeño y gris: «PalomApp · Parche 7» (de `NOVEDADES[0].titulo`, hasta el «·») | — |

**Para Desarrollo:**
- Cabecera: el nombre sale de `nombreSugerido()` (que ya lee `cfg().nombre`); solo si está vacío, `miNombreAlguno()`. El avatar de arriba a la derecha (`tbAvatar`) usa el mismo color.
- «Editar» abre una hoja: título «Tu nombre», campo «¿Cómo te llamas?» (máx. 40), ayuda «Así te verán las personas con las que compartas gastos. En los grupos que ya tienes, tu nombre se cambia dentro de cada grupo.», botones «Cancelar» y «Guardar». Guarda con `saveConfig({ nombre })`.
- «Más ajustes»: las filas plegadas se pintan dentro de un bloque oculto (`S.tuMas`). Al escribir en el buscador, `tuFiltrar` busca también ahí y lo despliega si hay coincidencias.
- «Botón «Antes» (pruebas)» es el `compararToggle` de hoy, con nombre nuevo y las mismas claves de búsqueda («comparar versión anterior pruebas antes»).
- Cerrar sesión abre una hoja: «¿Cerrar sesión en este móvil?» · «Tus datos siguen guardados en tu cuenta. Para volver, entra con tu correo.» · botones «Cancelar» y «Cerrar sesión» (rojo). Solo entonces `doLogout`.
- Icono nuevo en `ICONS`: **`salir`** (puerta con flecha, mismo trazo de 1,8) para «Cerrar sesión». Es el único icono que falta; el resto ya existe.
- Todas las filas, 48 px de alto como mínimo (hoy unos 46). Funciona igual en claro y oscuro: solo usa variables de color.

## 3. Lecturas de tickets: «Te quedan N»

**Cómo se sabe, sin Supabase.** La función `tickets-ia` devuelve `usados` y `limite` cuando lee bien y cuando ya no quedan (`error: 'limite'`). La app guarda lo último que recibió:

`cfg().ticketsUso = { mes: 'AAAA-MM', usados, limite }`, con `saveConfig` (escribe solo esa clave). Así lo ve igual el móvil y el ordenador.

- **`mes` es el mes natural en hora UTC**, el mismo que cuenta el servidor (empieza el día 1). **No** se usa «Tu mes» ni `mesDe()`: aquí no hablamos de movimientos.
- Si la función responde `ia_error` (cuenta en el servidor pero no devuelve la cifra), se suma 1 a `usados` si es el mismo mes.
- Si `mes` no es el actual, no hay dato del mes: se enseña «60 al mes» (con el último `limite` conocido) y nada más.
- `quedan = limite − usados`, nunca menos de 0.

| Dónde | Siempre | Si quedan 10 o menos (color `--warn`) | Si quedan 0 |
|---|---|---|---|
| Tú → «Fotos de tickets» | «quedan 52 de 60» y una barra fina debajo | Misma fila en `--warn` | «Vuelven el 1 de noviembre», en `--expense` |
| Hoja del + (banda «Foto de ticket») | «Lee los artículos y el total por ti» (como hoy) | «Te quedan 8 lecturas este mes» | La banda pasa a gris: «Sin lecturas hasta el 1 de noviembre». Al tocar, abre «Gasto» a mano con el aviso «Apúntalo a mano: las lecturas vuelven el 1 de noviembre» |
| Formulario de gasto («Leer un ticket con una foto») | Como hoy | «Leer un ticket con una foto · quedan 8» | El botón no sale |
| Hoja del ticket, al terminar de leer | «Lecturas este mes: 12 de 60. La foto no se ha guardado.» (como hoy) | Añade en `--warn`: «Te quedan 8. Vuelven el 1 de noviembre.» | — |
| Error `limite` | — | — | «Has usado las 60 lecturas de este mes. Vuelven el 1 de noviembre.» (sustituye a «Se renuevan el día 1») |

El nombre del mes siguiente se calcula (1 de diciembre, 1 de enero…). En «Empieza aquí» de Inicio, el paso del ticket no sale si quedan 0.

## 4. «Escríbenos»

**El hueco.** En `app.js`, junto a las constantes de arriba:

`const CONTACTO = { whatsapp: '', correo: '' };` — `whatsapp` con prefijo y sin espacios (formato de wa.me), `correo` normal. Lo rellena el dueño.

| Situación | Qué se ve |
|---|---|
| Los dos vacíos | **No sale** ni la tarjeta ni la fila. Nada roto a la vista |
| Solo uno | Sale la tarjeta y la hoja con ese botón solo |
| Los dos | Los dos botones, WhatsApp primero |

**La hoja.** Título «Escríbenos». Texto «¿Algo falla, echas algo de menos o hay algo que te encanta? Cuéntanoslo: lo lee quien hace PalomApp.» Tres fichas (se elige una; por defecto ninguna): `alert` «Algo falla» · `sparkle` «Una idea» · `heart` «Me gusta». Campo de texto grande «Escribe aquí…». Nota pequeña: «Solo se añade la versión de la app y el tipo de móvil. Nada de tus cifras.» Botones: «Enviar por WhatsApp» (acento, `send`) y «Enviar por correo» (fantasma).

**El mensaje** (lo abre WhatsApp o el correo; la persona lo envía ella):

```
PalomApp · Una idea
<lo que ha escrito>
—
Parche 7 · Android
```

Sin texto: aviso «Escribe algo primero». WhatsApp: `https://wa.me/<numero>?text=…`; correo: `mailto:<correo>?subject=PalomApp · Una idea&body=…`. El tipo de móvil se resume en «iPhone», «Android» u «Ordenador»; ni el correo de la persona ni importes.

## 5. Lo que se quita de la vista (nada se borra)

| Fila de hoy | Dónde queda | Por qué |
|---|---|---|
| Metas | En Dinero (y en el buscador general) | Dinero v2 ya es su sitio; la fila abría la hoja vieja |
| Deudas | En Dinero (hoy la fila ya lleva allí) | Igual |
| Comparar con la versión anterior | Más ajustes, como «Botón «Antes» (pruebas)» | Es de pruebas; los nuevos lo tienen apagado |
| Métodos de pago | Más ajustes | Ya no sale en las filas de movimientos |
| Fuentes de ingreso, Categorías de tareas, Moneda, Importaciones | Más ajustes | Se tocan una vez y ya |
| Grupo «Tareas» y grupo «Herramientas» | Repartidos en los grupos nuevos | Grupos de una fila o mezclados |

**Método de pago en el formulario de gasto:** hoy sigue saliendo el desplegable aunque ya no se vea en ningún sitio. Proponemos esconderlo al apuntar uno nuevo si la persona no ha usado ningún método en los últimos 90 días; al editar un movimiento que lo tenga, sigue saliendo. Los datos no se tocan.

**Botón «Antes»:** la pantalla de hoy se guarda entera como `renderTuAntes()` y se registra `VERSIONES.tu = { txt: 'Tú', variantes: [['nueva','Nueva'], ['antes','Antes']] }`. Para eso, `seccionVersion()` devuelve `'tu'` en la pestaña Tú (hoy no sale ahí).

## 6. Riesgos

- **Lo que se ponga en `CONTACTO` es público**: el repositorio es público y cualquiera que abra la web puede leer el código. Mejor un correo solo para PalomApp que el número personal.
- **El contador puede quedarse corto por uno o dos** si falla la red justo en una lectura (el servidor la cuenta y la app no se entera). El servidor sigue mandando: si dice «limite», se respeta.
- **El mes del contador es UTC:** las lecturas entre las 0:00 y las 2:00 del día 1 (hora de España) cuentan en el mes anterior. Es raro y no cambia nada visible.
- Quitar Metas y Deudas de Tú puede despistar a quien entraba por ahí. El buscador de la lupa las encuentra y Dinero está a un toque.

## 7. Preguntas que debe decidir el dueño

1. **¿Qué correo y qué WhatsApp pones en `CONTACTO`, sabiendo que serán públicos?** No bloquea: si se deja vacío, todo lo demás funciona y la fila no sale.
2. ¿Aviso de tickets a partir de **10** lecturas restantes? Es lo que proponemos. No bloquea.

## 8. Lo que no hemos podido averiguar o confirmar

- No hemos medido en un navegador la altura de Tú antes y después (no hay navegador instalado en este equipo). Calculado a ojo: de unos 1.450 px a unos 1.250.
- No sabemos cuántos usuarios usan hoy métodos de pago o fuentes de ingreso: no se pueden mirar datos reales.
- No probado que WhatsApp abra bien el texto largo en iPhone desde la web instalada.
- Visto de paso: en `app.js` hay **dos funciones `colorPersona`** (líneas 3055 y 3655) y gana la segunda. No rompe nada visible, pero conviene que Desarrollo lo revise al usar el color en el avatar.

## 9. Fuentes

- `app.js`: `renderTu` (l. 3289), `ticketPedir` (l. 2936), `ERR_TICKET` (l. 2879), `saveConfig` (l. 628), `nombreSugerido` (l. 2043), `LIST_META` (l. 7040). Consultado el 22/10/2026.
- `supabase/functions/tickets-ia/index.ts`: límite de 60 al mes y respuesta con `usados` y `limite` (l. 69–120). Consultado el 22/10/2026.
- `docs/ROADMAP.md` (fila 3) y `docs/08-asistente.md` (textos del nombre). Consultados el 22/10/2026.

Para el PDF: dos móviles lado a lado (Tú hoy con 23 filas y Tú propuesto con 17 y «Más ajustes» plegado), y debajo una tira con los tres estados de la banda del ticket en el + (normal, «Te quedan 8», gris «Sin lecturas hasta el 1 de noviembre»).

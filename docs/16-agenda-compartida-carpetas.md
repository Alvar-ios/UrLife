# Agenda compartida («Planes») y temas en los grupos: propuesta de Producto y diseño (22/10/2026, v2)

*Encargo: `docs/13-feedback-22-10.md`, puntos 2 y 3. Necesita cambios en Supabase (solo aditivos): **antes de programar, pasa por Datos y seguridad** (apartado 4).*

**Decidido por el dueño (22/10/2026):** «Planes» sí; carpetas de un solo nivel sí; se hacen las dos cosas, **primero las carpetas**. Pide además: que sea muy intuitivo y ordenado; que al compartir un gasto, **justo al elegir el grupo**, salga la opción de meterlo en una carpeta (y crear una nueva ahí mismo); otro nombre en vez de «carpeta»; y un resumen sencillo (lo gastado y quién pagó qué). Esta v2 lo recoge: en pantalla, las carpetas pasan a llamarse **«temas»** (pendiente de su visto bueno, apartado 3.1).

Imágenes en `docs/img/` (bocetos dibujados aparte, 375 × 667 px, datos inventados; **no son la app**):

| Archivo | Qué enseña |
|---|---|
| `agenda-boceto-planes.png` | Tu Agenda con lo compartido, la hoja «Nuevo plan» y el grupo con «Gastos \| Saldos \| Planes» (oscuro) |
| `juntos-boceto-carpetas-v2.png` | **La buena para los temas:** compartir un gasto (eliges el grupo → justo debajo, sus temas), «+ Nuevo» sin salir del gasto, «Por temas» dentro del grupo y el resumen de un tema (oscuro) |
| `juntos-boceto-carpetas-v2-claro.png` | El formulario y el resumen de un tema en modo claro |
| `agenda-carpetas-claro.png` | Planes en modo claro (la tercera pantalla es la carpeta de la v1) |
| `juntos-boceto-carpetas.png` | v1, sustituida por la v2 (se guarda para comparar) |

## 1. Conclusión

1. **Nombre: «Planes».** Un plan es algo que va a pasar («Cena de cumple de Ana», «Vuelo a Roma»). La Agenda pasa a tener **tareas y planes**, y los dos se pueden hacer **«Solo yo»** o compartir con un grupo de Juntos o con una persona. Dentro del grupo, una tercera pestaña: **«Gastos | Saldos | Planes»**. Una tarea compartida dice **quién se encarga** («se encarga Bea» o «quien pueda») y, al hacerla, **«Hecha por Dani»**.
2. **Los avisos son dentro de la app.** Hoy PalomApp no puede mandar notificaciones al móvil (no tiene la pieza que lo permite). «Avisarme» sube el plan arriba en «Estos días» de Inicio, y lo que añaden otros sale como «Dani ha añadido…». Como avisador de verdad, cada plan trae **«Añadir a mi calendario»** (el del móvil). Las notificaciones llegarán con la APK.
3. **«Temas» en vez de «carpetas»** («el tema del viaje», «el tema de la casa»: así se habla). Un solo nivel y cada uno con su icono. **Al compartir un gasto, en cuanto tocas el grupo, justo debajo salen sus temas**, ya elegido el que encaja por fecha, y «+ Nuevo» lo crea ahí mismo sin salir del gasto.
4. **Resumen de un tema, en dos cifras y una lista:** «Gastado entre los dos» y «Tu parte», y debajo «Quién pagó qué» (una barra por persona) y «En qué se fue». Quién debe a quién sigue en «Saldos», con todo el grupo junto: un tema no lleva sus propias deudas.
5. **Datos:** dos tablas nuevas (`agenda` y `grupo_carpetas`) y una columna nueva y vacía (`compartidos.carpeta_id`). No se toca `tareas` ni ningún dato existente. Los nombres de dentro de la base de datos no se ven en pantalla. **Orden: primero los temas** (solo tocan Juntos), después los Planes.

## 2. Agenda compartida: «Planes»

### 2.1 El nombre

| Opción | Por qué sí | Por qué no | Veredicto |
|---|---|---|---|
| **Planes** | Palabra de todos los días («¿qué planes tenéis?»). Corta: cabe en una pestaña y en un chip | Para «Dentista» suena algo raro, aunque se entiende | **Recomendado** |
| Eventos | Neutro | Suena a ordenador o a empresa | Descartado |
| Citas | Va bien con médico o peluquería | Suena a médico o a romance; raro para «Cumple de Ana» | Descartado |
| Quedadas | Muy cercano | Solo vale para ocio, no para «ITV del coche» | Descartado |
| Agenda común | Claro | Largo y se confunde con la pestaña «Agenda» | Descartado |

### 2.2 Qué es cada cosa

| Campo | Plan | Tarea compartida | En pantalla |
|---|---|---|---|
| Qué | Obligatorio (hasta 120 letras) | Obligatorio | «¿Qué plan es?» / «¿Qué hay que hacer?» |
| Día | Obligatorio | Opcional («para cuándo») | «¿Cuándo?»: Hoy · Mañana · Este finde · `calendar` Otro día… (la tarea añade «Sin fecha») |
| Hora | Opcional: sin hora = todo el día | No | «¿A qué hora?»: «Todo el día» (elegido de inicio) · `clock` «A una hora» · «Varios días» (pide «Hasta») |
| Dónde | Opcional | No | «¿Dónde? · opcional», con `pin`. En la hoja del plan, enlace «Abrir en Mapas» |
| Nota | Opcional (hasta 1.000 letras) | Opcional | «Nota», plegada |
| Con | «Solo yo», un grupo o una persona | Un grupo o una persona | «Con · lo verán todos» (si no es «Solo yo») |
| Quién se encarga | — | Una persona del grupo (también alguien sin cuenta) o nadie | «¿Quién se encarga?»: caras + «Quien pueda» (elegido de inicio) |
| Hecha | — | Fecha y quién | «Hecha por Dani · ayer», tachada |
| Avisarme | Personal, cada uno el suyo | No (sale sola en «Estos días» si es tuya) | «Avisarme»: No · Ese día · `bell` El día antes (de inicio) · 1 semana antes |

Las tareas **personales no cambian**: siguen en la tabla `tareas`, con prioridad, categoría y repetir. A las compartidas les quitamos prioridad, categoría y repetir (son cosas de cada uno y complican el reparto). Los planes no se repiten en esta fase («Pádel cada jueves» queda para la fase 2).

### 2.3 Cómo se crea

| Desde | Qué pasa |
|---|---|
| Botón + → «Tarea» | Se abre el formulario de siempre, ahora con **«Tarea \| Plan»** arriba (solo al crear) |
| Agenda → título del día | Junto a «Hoy, jueves 22», enlace «`plus` Plan». El formulario llega con ese día puesto |
| Calendario → lista del día | El enlace «`plus` Tarea» pasa a «`plus` Añadir» y abre el mismo formulario con «Tarea \| Plan» |
| Grupo → «Planes» | Abajo, «`check` Tarea» y «`plus` Plan». Llegan con el grupo ya elegido en «Con» |
| Casilla rápida de la Agenda | **No cambia**: crea tareas personales |

Formulario «Nuevo plan», en este orden (boceto 2): «Tarea \| Plan» · campo grande «¿Qué plan es?» (ejemplo gris: «Cena de cumple de Ana, vuelo a Roma…») · «¿Cuándo?» · «¿A qué hora?» · «Con» (chips que se deslizan: «Solo yo» primero, luego grupos y personas, igual que en «Compartir un gasto») · «¿Dónde? · opcional» · «Avisarme» · «Nota» plegada · «Cancelar» / «Guardar». Debajo de «Avisarme», en pequeño: «Te lo recordamos en Inicio al abrir la app».

Si en «Con» se elige un grupo para una **tarea**, aparece «¿Quién se encarga?» y se esconden «Más opciones» (prioridad, repetir, categoría).

**Pasar algo de «Solo yo» a un grupo** (al editar): se crea la copia compartida y se borra la personal, con el aviso «Compartido con Pádel de los jueves · Deshacer». No se puede mover un plan de un grupo a otro (como los gastos).

### 2.4 Dónde se ve

| Sitio | Qué sale | Texto exacto |
|---|---|---|
| Agenda · «Tareas» | Tus planes y los de tus grupos; las tareas compartidas **tuyas o de «quien pueda»**. Las encargadas a otros, solo en el grupo | Plan: baldosa con «HOY / 19:00» (o «SÁB / 24»), título, «Pádel de los jueves · Polideportivo» y caras. Tarea: círculo, título, «Pádel de los jueves · se encarga **Bea**» |
| Agenda · «Calendario» | Los planes como **barrita** bajo el número (varios días = barra seguida); las tareas siguen con punto | Leyenda: «● Tareas · ▬ Planes · ● Cobros y pagos · ● Metas y deudas · ○ Movimientos». Mismo color de acento que las tareas: los distingue la forma, no un color nuevo |
| Inicio · «Estos días» | Planes de hoy; planes con aviso a partir del día elegido (arriba, con `bell`); tus tareas compartidas de hoy o vencidas; **una** fila de novedades | «Mañana · Cena de cumple de Ana» / «21:30 · Pádel de los jueves». Novedades: «Dani ha añadido «Cena de cumple de Ana»» / «Pádel de los jueves · sáb 24». Si hay varias: «3 novedades en tus grupos» / «Planes y tareas nuevos» |
| Juntos · grupo | Pestaña «Planes»: «Próximos» (planes) y «Tareas · N por hacer» (pendientes y las 5 últimas hechas) | Vacío: `calendar` «Aún no hay planes. Apunta el primero: una cena, un viaje, el cumple de alguien.» |
| Hoja de un plan (al tocarlo) | Qué, cuándo, dónde («Abrir en Mapas»), nota, «Lo añadió Dani · hace 2 h», «Avisarme», `calendar` «Añadir a mi calendario», «Ocultar de mi agenda», «Editar», `trash` «Borrar» | Al borrar: «Plan borrado · Deshacer» |

**Lo nuevo:** un punto de acento delante del título de lo que otra persona ha añadido desde la última vez que abriste la Agenda o los Planes del grupo. Al abrirlos, se da por visto.

### 2.5 Quién puede qué

| Acción | Quién | Por qué |
|---|---|---|
| Ver | Las personas del grupo mientras sigan en él. Al salir, dejan de verlos (con los gastos no pasa porque son dinero) | Un plan no tiene que quedarse para siempre |
| Crear | Cualquiera del grupo (si el grupo no está cerrado) | Como los gastos |
| Editar y borrar | Lo que diga el ajuste del grupo: «Todos» o «Solo quien lo apuntó (y los administradores)» | Una sola regla para todo el grupo. El ajuste pasa a llamarse **«Quién puede cambiar gastos y planes»** |
| Marcar hecha o deshacerlo | Cualquiera del grupo, siempre | Si solo pudiera el autor, Bea no podría tachar su propio encargo |
| «Avisarme», «Ocultar de mi agenda» | Cada uno lo suyo; nadie más lo ve | Son preferencias personales |
| «Solo yo» | Solo tú | Como tus tareas |

### 2.6 Para Desarrollo

- Datos nuevos en `S.agenda` (lista), con `Data.agenda` hecho con `tablaCompartida` (lee solo lo no borrado y escucha cambios). Borrar = poner fecha en `borrado` (permite «Deshacer»).
- Privado y sin migración, en la configuración: `cfg().agendaAvisos` = `{ [id]: 'no' | 'dia' | 'antes' | 'semana' }` (sin valor = «antes»); `cfg().agendaOcultos` = `{ [id]: true }`; `cfg().agendaVisto` = fecha y hora de la última vez que abriste la Agenda o los Planes de un grupo. Guardar con `saveConfig` solo si había algo nuevo (para no escribir en cada visita). Limpiar entradas de `agendaAvisos`/`agendaOcultos` solo al borrar ese plan, nunca en bloque.
- `calEventos` y `eventosAgenda` suman los planes (`k: 'plan'`) y las tareas compartidas (`k: 'tareaC'`); cada cosa una sola vez, como hoy. El buscador de la lupa también los encuentra.
- «Añadir a mi calendario»: generar en el móvil un archivo `.ics` con el plan y descargarlo. No se manda nada a ningún servidor.
- «Abrir en Mapas»: enlace de búsqueda de Google Maps con el texto de «¿Dónde?».
- Iconos nuevos en `ICONS`: `bell`, `clock`, `pin`. Sin emojis.
- `Estos días`: orden propuesto: cobros/pagos pasados, tareas vencidas, **planes con aviso**, lo de hoy, **novedades**, presupuestos, Juntos, lo de los próximos 7 días. Sigue mostrando 2 filas y «Ver los N». La fila de novedades puede servir mañana también para los gastos de Juntos (punto 4 del feedback).
- Pruebas: las de Juntos que buscan la pestaña «Gastos | Saldos» y las del texto «Quién puede cambiar los gastos» habrá que actualizarlas.

## 3. Temas en los grupos (antes «carpetas»)

### 3.1 El nombre

| Nombre | Cómo se lee en la app | A favor | En contra | Veredicto |
|---|---|---|---|---|
| **Temas** | «¿De qué tema?» · «+ Nuevo tema» · «Por temas» | Es como se habla («el tema del viaje», «el tema de la casa»). Vale igual para un viaje, la compra o la casa. No choca con nada de la app | Algo genérico: el icono de cada tema lo compensa | **Recomendado** |
| Cajones | «¿En qué cajón?» · «+ Nuevo cajón» | El más visual y juguetón: ordenar los gastos en cajones | Menos serio; «cajón desastre» | Segunda opción |
| Ocasiones | «¿Para qué ocasión?» · «+ Nueva ocasión» | Muy claro para viajes, cenas y regalos | «Compra» o «Casa» no son ocasiones | Tercera opción |
| Apartados | — | — | Choca con «Apartar», que en la app es guardar dinero | Descartado |
| Viajes y planes | — | — | Choca con «Planes» de la Agenda y deja fuera la compra | Descartado |
| Etiquetas · Sobres · Huchas · Bolsillos | — | — | «Etiquetas» suena técnico y se confunde con las categorías; los otros suenan a dinero guardado, como las metas | Descartados |

En la base de datos la tabla se sigue llamando `grupo_carpetas`: ese nombre no lo ve nadie y así Datos no tiene que esperar a esta decisión.

### 3.2 Reglas para que sea intuitivo y ordenado

1. **El tema se elige siempre en el mismo sitio:** justo debajo del grupo, en el recuadro «¿De qué tema?».
2. **Siempre es opcional:** «Ninguno» es una opción más; nada obliga a usar temas.
3. **Viene elegido solo cuando es obvio:** el tema que estás mirando; si no, el que cubre la fecha del gasto; si no, el último que usaste en ese grupo en las últimas 12 horas (la tercera compra seguida en el súper); si no, «Ninguno». La línea de debajo dice por qué («Elegido por la fecha: Roma es del 19 al 25 oct.»).
4. **Un solo nivel y una sola fila:** los temas abiertos en una fila de chips que se desliza; si hay más de 5, el último chip es «Ver todos».
5. **Mismo icono y color en todas partes** (el formulario, la fila del grupo, «Por temas» y la línea de cada gasto).
6. **Nunca se pierde un gasto:** borrar un tema deja sus gastos en «Sin tema», con «Deshacer».

### 3.3 Al compartir un gasto (bocetos 1 y 2 de `juntos-boceto-carpetas-v2.png`)

| Paso | Qué ves (texto exacto) |
|---|---|
| 1 · «Con» | Los chips de siempre: grupos y personas |
| 2 · Tocas un grupo | Justo debajo se despliega (deslizando, 200 ms) un recuadro con el fondo de acento suave: «¿De qué tema? · opcional» y chips «Ninguno · `plane` Roma 2026 · `cart` Compra · `plus` Nuevo». Si el grupo aún no tiene temas: «Ninguno · `plus` Nuevo tema» y la línea «Para separar un viaje, la compra o la casa.» Con una persona a solas, igual |
| 3 · Elegido solo | Debajo de los chips, en pequeño: «Elegido por la fecha: Roma es del 19 al 25 oct.» Si cambias la fecha y el tema lo puso la app, se recalcula; si lo elegiste tú, se respeta |
| 4 · «+ Nuevo» | Dentro del mismo recuadro, sin abrir otra hoja: campo «Nombre (Roma 2026, Compra…)», fila de 6 iconos, chip `calendar` «Fechas · opcional» y botón «Crear «Navidad»». Al crear: queda elegido, vibra suave (`sentir('ok')`) y lo ya escrito (importe, qué fue) sigue ahí |
| 5 · El resto | Como hoy: importe, qué fue, pagó, para quién, «Guardar» |
| Al cambiar de grupo | El tema vuelve a «Ninguno» (los temas son de cada grupo) |

Después: al editar un gasto compartido sale el mismo recuadro. Y dentro de un tema, `more` → «Añadir gastos ya apuntados»: lista con casillas de los gastos del grupo sin tema de los últimos 90 días.

### 3.4 Dentro del grupo (bocetos 3 y 4)

| Sitio | Qué sale (texto exacto) |
|---|---|
| Pestaña «Gastos», arriba | Fila de chips «Todo · `plane` Roma 2026 · `cart` Compra · `gift` Navidad · `plus`». Solo sale si el grupo tiene algún tema; si no, un chip discreto «`plus` Tema» junto a «Entre todos…» |
| Con «Todo» elegido | Tarjeta **«Por temas»**: una fila por tema (icono, nombre, «19–25 oct · 9 gastos», lo gastado y `chevR`) y al final «Sin tema». Como mucho 4 filas y «Ver todos (6)». Debajo, la lista de gastos de siempre; cada gasto con tema lo dice al final: «pagaste tú · tu parte 42,00 € · Roma 2026» |
| Al tocar un tema | Su resumen (tabla siguiente) en la misma hoja, con `chevL` para volver |
| Hoja «Nuevo tema» (desde el chip `plus`) | La de `juntos-boceto-carpetas.png` (v1, boceto 2) con «tema» en vez de «carpeta»: ideas `plane` «Viaje a…» · `cart` «Compra» · `home` «Casa» · `fork` «Cenas y salidas» · `gift` «Regalos»; nombre; icono; fechas; y, si ya hay gastos en esas fechas, la casilla marcada «Meter los 3 gastos de esos días» |
| `more` de un tema | «Cambiar nombre, icono o fechas» · «Añadir gastos ya apuntados» · «Cerrar tema» (sale de la fila; se ve en «Cerrados · 2») · `trash` «Borrar tema» |

**El resumen de un tema:**

| Bloque | Texto exacto |
|---|---|
| Cabecera | `chevL`, icono, «Roma 2026», «Casa · 19–25 oct · 9 gastos», `more` |
| Dos cifras | «Gastado entre los dos» (o «entre todos» si sois más) **1.240,00 €** y «Tu parte» **620,00 €** |
| Quién pagó qué | Una barra por persona con lo que puso: «Tú · 780,00 €», «Lucía · 460,00 €» (cada barra, su trozo del total; color de cada persona, `colorPersona`) |
| En qué se fue | Barra partida por categorías (`colorCat`), como mucho 4 y «Otros», con su leyenda |
| Línea final | «Quién debe a quién se ve en **Saldos**, con todo el grupo junto.» («Saldos» es un enlace a esa pestaña) |
| Debajo | Los gastos del tema por días; botón «`plus` Añadir gasto a Roma 2026» |

**Dicho fácil (sustituye a «solo totales»):** un tema sirve para ver **cuánto se ha gastado y quién lo ha pagado**. Las deudas no se separan por temas: si Lucía te debe dinero, te lo debe del grupo entero, y eso está en «Saldos». Así nunca hay dos cifras distintas de lo que se debe. Por eso quitamos de la v1 el «te tocan / le tocan», que se confundía con una deuda.

**Qué entra en un tema:** gastos y gastos fijos compartidos. Los pagos entre vosotros, las aportaciones a metas y los pagos de deudas, no. Fuera del grupo (pestaña Juntos, Movimientos) no cambia nada en esta fase.

### 3.5 Para Desarrollo

- `Data.carpetas` con `tablaCompartida('grupo_carpetas', …)`; en `compartidos` se añade `carpetaId` a la lista de campos y a `deFila`. Una versión antigua de la app que edite un gasto no borra su tema (solo envía los campos que conoce).
- En `compRapidoHtml`, el recuadro va justo después de `.cr-con` y solo si hay `cp.dest`. «+ Nuevo» guarda primero el tema (`Data.carpetas.crear`) y luego lo deja elegido en `FORM`; si falla, aviso y el gasto sigue sin tema.
- Cambiar el tema de uno o varios gastos ya guardados va por una función (`poner_carpeta`), para que lo pueda hacer cualquiera del grupo aunque el grupo tenga «Solo quien lo apuntó» (ver 4.2).
- Cifras con los cálculos de hoy (`miParte`, reparto, `pagadoPor`), solo filtrando por tema.
- Icono nuevo en `ICONS`: no hace falta para los temas (se usan los de las categorías).

## 4. Modelo de datos propuesto (para Datos y seguridad)

Todo **aditivo y opcional**: dos tablas nuevas y una columna vacía. No se cambia ningún dato ni ninguna regla existente. Es un borrador para que Datos lo revise; los nombres de funciones de ayuda (`es_miembro`, `es_participante`, `puede_editar_compartido`) son los que ya existen.

### 4.1 Tabla `agenda` (planes y tareas compartidas, y los planes «Solo yo»)

```sql
create table public.agenda (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references public.grupos(id) on delete cascade, -- vacío = «Solo yo» (solo lo ve quien lo crea)
  tipo text not null check (tipo in ('plan', 'tarea')),
  titulo text not null check (char_length(btrim(titulo)) between 1 and 120),
  fecha date,                 -- plan: obligatoria; tarea: «para cuándo», opcional
  fecha_fin date,             -- plan de varios días
  hora time,                  -- vacía = todo el día (hora de España, sin zona)
  lugar text check (char_length(lugar) <= 120),
  nota text check (char_length(nota) <= 1000),
  asignado_a uuid,            -- tarea: miembro o persona sin cuenta del grupo; vacío = «quien pueda»
  hecha_en timestamptz,
  hecha_por uuid references auth.users(id) on delete set null,
  creado_por uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  editado_por uuid,
  borrado timestamptz,        -- nunca se borra de verdad (permite «Deshacer»)
  check (tipo = 'tarea' or fecha is not null),
  check (fecha_fin is null or (tipo = 'plan' and fecha is not null and fecha_fin >= fecha)),
  check (tipo = 'plan' or (hora is null and fecha_fin is null and lugar is null)),
  check (tipo = 'tarea' or (asignado_a is null and hecha_en is null)),
  check (grupo_id is not null or asignado_a is null)
);
create index agenda_grupo on public.agenda (grupo_id) where borrado is null;
create index agenda_mias on public.agenda (creado_por) where grupo_id is null and borrado is null;
```

| Regla | Propuesta |
|---|---|
| Ver | `(grupo_id is null and creado_por = auth.uid()) or (grupo_id is not null and es_miembro(grupo_id))` |
| Crear | Lo mismo, y el grupo no cerrado |
| Cambiar | `(grupo_id is null and creado_por = auth.uid()) or puede_editar_compartido(grupo_id, creado_por)` |
| Borrar de verdad | Nadie (solo `borrado` = fecha) |
| Disparador `validar_agenda` | Fija `creado_por`, `created_at` y `borrado = null` al crear; no deja cambiar `id`, `grupo_id`, `tipo`, `creado_por` ni `created_at`; pone `updated_at` y `editado_por`; `asignado_a` tiene que ser del grupo (`es_participante(grupo_id, asignado_a, true)`); `hecha_por` = quien la marca; nada se cambia si ya está borrado |
| Función `agenda_hecha(p_id, p_hecha)` | Cualquier miembro marca o desmarca una tarea del grupo (solo toca `hecha_en` y `hecha_por`), aunque el grupo tenga «Solo quien lo apuntó» |
| Tiempo real | Añadir la tabla a la publicación de cambios en directo, como `compartidos` |
| Sin sesión | Nada |

Lo personal de cada uno («Avisarme», «Ocultar», lo visto) va en su configuración (`config`), no en esta tabla.

### 4.2 Temas (por dentro, «carpetas»): tabla `grupo_carpetas` y columna `compartidos.carpeta_id`

```sql
create table public.grupo_carpetas (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 40),
  icono text not null default 'tag'
    check (icono in ('plane','cart','home','fork','gift','car','ball','film','heart','tag')),
  desde date,
  hasta date,
  check (desde is null or hasta is null or hasta >= desde),
  cerrada timestamptz,
  creado_por uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  borrado timestamptz
);
create unique index grupo_carpetas_nombre on public.grupo_carpetas (grupo_id, lower(btrim(nombre))) where borrado is null;

alter table public.compartidos add column carpeta_id uuid references public.grupo_carpetas(id);
```

| Regla | Propuesta |
|---|---|
| Ver temas | `es_miembro(grupo_id)` (quien salió del grupo sigue viendo sus gastos antiguos; el tema le saldrá como «Sin tema», no hace falta más) |
| Crear | `es_miembro(grupo_id)` y grupo no cerrado. Como mucho 30 temas sin borrar por grupo |
| Cambiar, cerrar, borrar | `puede_editar_compartido(grupo_id, creado_por)` (la misma regla que los gastos) |
| Disparador nuevo y aparte `validar_carpeta_compartido` (antes de crear o cambiar `carpeta_id` en `compartidos`) | El tema tiene que ser del mismo grupo, no estar borrado, ni cerrado si se acaba de poner; solo en tipo `Gasto` o `Factura`. **No se reemplaza `validar_compartido`** |
| Función `poner_carpeta(p_ids uuid[], p_carpeta uuid)` | Cualquier miembro cambia **solo** el tema de gastos de su grupo (hasta 200 de una vez; `p_carpeta` vacío = quitarla). No toca importes ni repartos |

## 5. Alternativas descartadas

| Idea | Por qué no |
|---|---|
| Añadir columnas (hora, lugar, grupo) a `tareas` | `tareas` es personal (cada uno solo ve las suyas) y tiene reglas pensadas para eso. Mezclar ahí lo compartido obligaría a cambiar sus permisos: más riesgo sobre datos reales |
| Guardar los planes compartidos en la configuración de cada uno | Los demás no los verían |
| Notificaciones al móvil ya | Necesitan una pieza nueva en la web y un servidor que las envíe; en iPhone, además, solo si la app está instalada en la pantalla de inicio. Mejor con la APK |
| «¿Vas?» (apuntarse a un plan) | Útil en grupos grandes, pero es otra tabla. Fase 2; mientras, «Ocultar de mi agenda» |
| Temas dentro de temas («Viajes» → «Roma 2026») | Más toques para llegar y más sitios donde se pierde un gasto. El icono hace de «Viajes» |
| Temas como texto en cada gasto y lista dentro de `grupos` | Cambiar el nombre obligaría a reescribir gastos; si dos personas crean temas a la vez, una pisa a la otra |
| Deudas y «Saldar» por tema | No cuadraría con «Saldos» (los pagos son del grupo entero). Si alguien quiere cerrar cuentas de un viaje aparte, puede crear un grupo para ese viaje |
| «Te tocan / le tocan» en el resumen (v1) | Se confundía con una deuda. Ahora: lo gastado, tu parte y quién pagó qué |

## 6. Riesgos

- **La Agenda personal queda en dos sitios** (tareas en `tareas`; planes «Solo yo» en `agenda`): Desarrollo debe juntarlas en la Agenda, el calendario, «Estos días» y la lupa, y probar que nada sale dos veces.
- **«Avisarme» no avisa si no abres la app.** Hay que decirlo en la hoja (texto en 2.3) para no prometer de más. El `.ics` cubre a quien lo quiera de verdad.
- **Horas sin zona horaria:** un plan a las 21:30 se lee igual en Roma que en Madrid. Para la gente que la usa hoy, vale; con viajes al extranjero puede confundir.
- **Grupos grandes llenan tu Agenda** de planes ajenos: por eso «Ocultar de mi agenda» y que las tareas encargadas a otros no salgan en la tuya.
- **Ruido en Inicio:** una sola fila de novedades, nunca una por cosa.
- **Tema «Compra» frente a la categoría «Supermercado»:** pueden parecer lo mismo. Las ideas empiezan por «Viaje a…», que es donde un tema aporta más.
- **«Quién pagó qué» frente a lo que se debe:** alguien puede leer «Tú 780 €» como «me deben 780 €». Por eso la línea final lleva siempre a «Saldos».
- **El recuadro de temas alarga el formulario** unos 90 px (más con «+ Nuevo» abierto). Con 375 × 667 el botón «Guardar» sigue fijo abajo; hay que comprobar que el importe no quede tapado por el teclado.
- **Elegir el tema «solo» puede equivocarse** (un gasto de casa durante el viaje). Por eso siempre dice por qué lo ha elegido y se cambia de un toque.
- **Pestaña nueva en el grupo:** las pruebas de Juntos que comprueban «Gastos | Saldos» y el texto «Quién puede cambiar los gastos» se tendrán que actualizar.
- **Si la tabla no está en la publicación de cambios en directo,** los demás no verán un plan nuevo hasta recargar.

## 7. Preguntas para el dueño

1. ¿Los planes de un grupo salen en la Agenda de todos sus miembros, con «Ocultar de mi agenda» para quien no vaya? Recomendado: sí; el «¿Vas?» más adelante.
2. **(Bloquea los textos de los temas, no el trabajo de Datos)** ¿Cómo las llamamos: **«Temas»** (recomendado), «Cajones» u «Ocasiones»?
3. ¿Te vale el resumen de un tema así: «Gastado entre los dos», «Tu parte», «Quién pagó qué» y «En qué se fue», con las deudas siempre en «Saldos»? Recomendado: sí.

Ya decidido (22/10/2026): «Planes» sí; un solo nivel sí; primero los temas y después los Planes.

## 8. Lo que no hemos podido averiguar o confirmar

- Nada probado en la app ni en un móvil real: los bocetos se dibujaron aparte (Chromium, 375 × 667) con datos inventados y fuentes que pueden no ser las de la app.
- No hemos comprobado que un iPhone abra bien un `.ics` descargado desde la web (en Safari suele ofrecer «Añadir al calendario»; con la web instalada en la pantalla de inicio, no lo sabemos).
- En el repositorio no están todas las reglas actuales de `compartidos` (solo la de editar) ni la definición de `es_miembro`: Datos debe comprobarlas antes de copiar el patrón.
- No sabemos cuántos grupos, gastos compartidos ni tareas tiene cada usuario (no miramos datos reales), así que los límites (30 temas, 200 gastos por cambio, 90 días, 12 horas) son estimaciones.
- No hemos estudiado cómo resuelven Tricount o Splitwise los temas ni los calendarios compartidos en esta propuesta.
- El esfuerzo es una estimación de Producto: temas, medio; Planes, alto.

## 9. Fuentes

- `docs/13-feedback-22-10.md` (puntos 2 y 3), `docs/04-juntos.md`, `docs/10-agenda-mas.md`, `CLAUDE.md`. Consultados el 22/10/2026.
- `app.js`: `renderAgendaSemanaV2`, `renderCalendarioV2`, `openTareaFormV2`, `agRapidaCrear`, `eventosAgenda`, `calEventos`, `evColor`, `estosDiasHtml`, `renderJuntosV2`, `grupoHtmlV2`, `compRapidoHtml`, `CATS_STD`, `ICONS`. Consultado el 22/10/2026.
- `data-layer.js` (`tablaCompartida`, `compartidos`, `objetivos`) y `supabase/migrations/README.md` y `2026-10-17_personas_sin_cuenta.sql` (`es_participante`, `puede_editar_compartido`, `grupos.edicion`). Consultados el 22/10/2026.
- Bocetos propios (`docs/img/agenda-boceto-planes.png`, `juntos-boceto-carpetas.png`, `juntos-boceto-carpetas-v2.png`, `juntos-boceto-carpetas-v2-claro.png`, `agenda-carpetas-claro.png`), 22/10/2026.

Para el PDF: en la primera página, el boceto `agenda-boceto-planes.png` (los tres móviles) con la palabra «Planes» grande; en la segunda, `juntos-boceto-carpetas-v2.png` con los números 1-2-3 (eliges el grupo → sus temas → «+ Nuevo») y una tabla pequeña con los 3 nombres. El SQL, en una página aparte para Datos.

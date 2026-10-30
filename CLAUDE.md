# PalomApp — instrucciones para Claude

App web de finanzas personales y tareas («Mis Finanzas y Tareas», llamada PalomApp). La usan de verdad unas pocas personas (el dueño, su pareja y amigos). Web en producción: https://urlife-zeta.vercel.app/ — Vercel publica sola cada cambio que llega a `main`.

Habla siempre en **español sencillo**, sin jerga: el dueño no es programador.

## Forma de trabajar (obligatoria)

1. **Revisar → explicar → confirmar → ejecutar.** Antes de un cambio grande o de algo que no se pueda deshacer, explica en pocas líneas qué vas a hacer y espera el «sí». Los cambios pequeños y claros se hacen directamente.
2. **Nunca afirmes algo que no has probado.** Di «probado en las pruebas automáticas» o «no lo he podido probar en un móvil real», según sea.
3. **Nunca arriesgues, pierdas ni dupliques datos reales.** Las migraciones de Supabase son solo aditivas (columnas o tablas nuevas, opcionales) y siempre con confirmación antes. Nada de `DELETE`/`UPDATE` masivos sobre datos de usuarios.
4. **Nunca escribas claves ni contraseñas** en el chat, en el código ni en el repositorio (el repositorio es **público**). Las claves van solo a los secretos de Supabase o de GitHub.
5. **No modifiques `auth-signup.js`.**
6. Mantén las palabras que ya usa la app (por ejemplo «Aportar»).
7. **Publicar:** trabaja siempre en una rama y **déjala sin fusionar**. Todo lo que entra en `main` sale publicado en la web para los usuarios reales en un par de minutos, así que **solo se fusiona a `main` cuando el dueño dice «publica»**, nunca por iniciativa propia ni porque las pruebas pasen. Al terminar, di en qué rama está y qué falta. Los documentos de `docs/` son la excepción: no afectan a la web y pueden ir directos a `main`.
8. Al terminar cada tarea: resumen corto en español de qué cambia para el usuario y qué no se ha probado. Sin recapitular los pasos.

### «Cerramos día»
Solo cuando el dueño lo diga:
- Añadir una entrada nueva **al principio** de `NOVEDADES` en `app.js` («Parche N · título», `id` con la fecha `AAAA-MM-DD`), con 2 destacados y unos 6 puntos, en lenguaje muy simple.
- Etiquetas NUEVO / MEJORADO en `BADGES` para los apartados nuevos o mejorados (`badge('clave')` en el sitio y `verBadge('clave')` al entrar).
- Actualizar las pruebas de novedades (`tests/test11.js`, `tests/test23.js`).
- Una nota en imagen JPG (vertical, fondo oscuro, estilo de las anteriores) para el grupo de WhatsApp.

## Departamentos (subagentes en `.claude/agents/`)

La sesión principal hace de **Desarrollo** (programa) y de jefe de proyecto: reparte el trabajo a los departamentos.

- `producto-diseno` — antes de programar una pantalla o función nueva: propuesta de cómo debe ser.
- `calidad` — **siempre** antes de dar una tarea por terminada o publicar: pruebas y revisión con ojos frescos.
- `datos-seguridad` — antes de cualquier cambio en Supabase o en cómo se guardan, importan o borran datos.
- `marketing-comunicacion` — «cerramos día», textos para usuarios y el plan de marketing (`docs/marketing/PLAN.md`).

Los documentos dentro de `docs/` no afectan a la web: se pueden subir directamente a `main`.

## Cómo está hecha

- Sin frameworks ni compilación: `index.html` + `app.js` (toda la lógica, ~6.400 líneas) + `app.css` (diseño clásico) + `look.css` (aspecto «Nuevo») + `data-layer.js` (único archivo que habla con Supabase).
- `app.js` es una función que se ejecuta sola. Piezas clave:
  - `S` = estado; `H` = acciones. En el HTML los botones llevan `data-click="accion|arg"`, generado con `act('accion', arg)` (también `onInput`, `onChange`).
  - `FORM` = formulario abierto; `openSheet(html)`, `updateSheet(html)` y `closeSheet()` para las hojas que suben desde abajo.
  - `render()` repinta la pestaña actual; `cfg()` lee la configuración del usuario y `saveConfig({...})` la guarda.
  - `kpisMes(año, mes)` calcula ingresos, gastos, ahorro, inversión y deuda de un mes.
  - Aspecto: `<html data-look="nuevo|clasico" data-paleta="…" data-tipo="…">`; todas las reglas de `look.css` empiezan por `html[data-look="nuevo"]`. El clásico debe seguir funcionando igual.
  - Animaciones al verse (`revelarAlVer`), sonido y vibración (`sentir('ok')`, etc.).
- `data-layer.js` convierte camelCase ↔ snake_case. **Un campo nuevo en un movimiento necesita su columna en la tabla de Supabase**; si no, guardar falla.
- Supabase: tablas `movimientos`, `tareas`, `config` (configuración por usuario en JSON), `grupos`, `compartidos`, `objetivos_compartidos`… Las migraciones aplicadas se describen en `supabase/migrations/README.md`.
- Funciones de Supabase en `supabase/functions/` (lectura de tickets con IA, precios de activos).

## Pruebas

```
cd tests
npm install     # solo la primera vez
npm test        # ejecuta todas; node run.js 31 ejecuta solo las que contienen «31»
```

- Simulan la app en un navegador falso (jsdom) con datos de ejemplo. Deben pasar todas antes de publicar.
- Cada cambio nuevo lleva su prueba (añádela a un `testN.js` existente o crea uno nuevo con `require('./harness.js')`).
- Si cambias un texto que una prueba comprueba, actualiza la prueba y dilo.
- No uses datos reales de usuarios en las pruebas (ni correos, ni importes, ni nombres completos).

## Trabajo en curso

- Hecho: **varias cuentas, fase 1** y sus arreglos (17/10/2026) → ver `docs/PLAN_CUENTAS.md`. Incluye traspasos, «Convertir en traspaso», «Tu saldo» (banco + lo que dice Juntos) y la hoja de cada cuenta.
- Hecho (17/10/2026): **personas sin cuenta en los grupos**, administradores y «quién puede cambiar los gastos» (migración `personas_sin_cuenta`).
- Ahora: **fase 4, pulir pantalla a pantalla**. Primera: Inicio (`docs/01-inicio.md`). «Tu mes» (`cfg().mesInicio`: del 1 al 31 o desde el día que cobras) se calcula SIEMPRE con `mesDe(fecha)` / `rangoMes(y, m)`: no uses `fecha.slice(0, 7)` para saber el mes de un movimiento. Lo «previsto» (con la nómina) se enseña siempre aparte y como previsión, nunca como dato real.
- Hecho (17/10/2026): **Movimientos** (`docs/02-movimientos.md`): se entra en el Resumen; vistas Resumen | Lista | Calendario con la misma cabecera; anillo con máx. 6 colores y subcategorías; colores fijos por categoría (`colorCat`); filtros raros en la hoja «Filtros»; el cambio de vista o de mes desliza solo el cuerpo (`movDeslizar`), nunca repintar con `entra`.
- Hecho (18/10/2026): **botón «Antes»** para comparar versiones en pruebas (`VERSIONES`, `versionDe(k)`, `compararCambiar`; desde el 22/10 también sale en Tú y en la Agenda; en la hoja del + es un enlace dentro). Cada cambio grande deja su versión anterior ahí. Ahora: Inicio (nueva | antes) y «En qué gastas» (Barras | Mosaico | Anillo). Cuando el dueño elija, se quita la variante sobrante del registro.
- Hecho (18/10/2026): **cuentas fase 2 (Juntos y fijos)**: la cuenta de cada compartido o pago al saldar se guarda en `cfg().cuentaJuntos[idCompartido]` (privado, sin migración; `cuentaDeComp`, `guardarCuentaComp`, `olvidarCuentaComp`); cobros y pagos fijos con `cuentaId`. Desde el 30/10 `cuentaJuntos` NO se limpia al borrar un compartido (por si alguien lo recupera, vuelve a su cuenta; decisión del dueño); nunca se limpia en bloque.
- Hecho (18/10/2026): **Juntos v2** (`docs/04-juntos.md`): pestaña por personas (`renderJuntosV2`), hoja de cada persona con «Saldar todo» (un pago por grupo, con «Deshacer») y «Pedir por WhatsApp», grupo con «Gastos | Saldos» y la administración en «Ajustes» (`FORM.ajustes`), compartir un gasto en una pantalla (`compRapidoHtml`). La versión anterior sigue en «Antes» (`VERSIONES.juntos`); los tests antiguos de Juntos usan `version:{juntos:1}`. Colores de persona fijos con `colorPersona(uid)`.
- Decisiones del dueño (18/10/2026): no prometer por escrito «gratis y sin límites» hasta conocer costes; hacer **las dos**: confianza (cifras explicadas, historial, deshacer) y viajes con otra moneda, cuando Producto decida (ver `docs/marketing/05-criticas-tricount-splitwise.md`); nada de ver un grupo con enlace «solo para mirar».
- Hecho (18/10/2026): **Dinero v2** (`docs/05-dinero.md`, `docs/06-dinero-diseno.md`): una sola pantalla (`renderDineroV2`): «Lo que tienes» (cuentas + inversiones − deudas; lo apartado para metas NO se suma dos veces si hay cuentas con saldo), Cuentas, Metas (`VERSIONES.dinero`: Camino | Tarros | Anillos | Antes), Inversiones («Ver todo» es pantalla: `S.dineroVer`) y Deudas (en `cfg().deudas[]`: `previo`, `cuotaMes`, `emoji`, `nombresAntes`; los pagos se buscan por nombre o nombres antiguos con `movsDeuda`; se crean y editan en Dinero, Tú → Deudas lleva allí). Aportar rápido (`aportarRHtml`). `numCampo` entiende «8.000» y «1.234,56». Los tests antiguos de Dinero usan `version:{dinero:3}`. Color `--warn` para «vas justo».
- Hecho (18/10/2026): **confianza en Juntos (1)**: «¿De dónde sale?» (`origenHtml`, `efectoMio`) explica el saldo de un grupo línea a línea; «Deshacer» al borrar un gasto o pago compartido solo si lo pagaste y apuntaste tú (`puedeDeshacerComp`, `rehacerComp` lo vuelve a crear). Recuperar lo de otra persona necesitaría un borrado «suave» en Supabase: dejarlo para el historial del grupo.
- Hecho (19/10/2026): **bienvenida nueva** (`docs/08-asistente.md`): 4 pasos saltables (Hola, Tu banco, Cada mes, Listo; `obPasos`), con invitación de Juntos primero (`obCargarInvitacion`, `obUnirse`) y aterrizaje en el grupo con «Así funciona Juntos»; avisos en Inicio (`invitacionInicioHtml`: invitación pendiente o «Te has unido a…»). Se guarda paso a paso por `saveConfig` (nunca escribir config directo en paralelo) y al repetir desde Tú solo añade. A los nuevos se les marcan las novedades y etiquetas como vistas y `compararVersiones: false`. Nombre en `cfg().nombre`. Diseño: iconos de la app, no emojis.
- Hecho (22/10/2026): **Tú, Agenda y botón + v2** (`docs/09-tu-ajustes.md`, `docs/10-agenda-mas.md`). Tú (`renderTuV2`): cabecera con `cfg().nombre` y «Editar», 4 grupos y «Más ajustes» plegado (`S.tuMas`), lecturas de tickets que quedan (`cfg().ticketsUso` = {mes UTC, usados, limite}, lo guarda `guardarTicketsUso` tras cada lectura; NO usar `mesDe` aquí), «Escríbenos» (constante `CONTACTO`, vacía = no sale; lo que se ponga es público), cerrar sesión con confirmación. Agenda (`renderAgendaSemanaV2`, `renderCalendarioV2`, `openTareaFormV2`): casilla rápida (`agRapidaCrear`, solo los 10 campos de `tareas`), cada tarea una sola vez, calendario solo mensual con leyenda que filtra, «¡Día despejado!». + (`crearHtmlV2`): 4 grandes, «Repetir» (`gastosHabituales`) y lo demás en pequeño. Versiones anteriores en `VERSIONES.tu/agenda/crear`; las pruebas antiguas se fijan a ellas desde `harness.js` (las nuevas pasan `version:{tu:0,agenda:0,crear:0}`).
- Hecho (22/10/2026): **pulido de interfaz** tras las auditorías (`docs/11-auditoria-interfaz.md`, `docs/salud/2026-10-22-interfaz.md`): tareas de hoy en «Estos días», título «Agenda», emojis → iconos, fechas en minúscula, contraste (colores de persona, `--expense`/`--warn`/`--debt`, `--pl` de 4 paletas, `--seg-on` en oscuro), `vincularEtiquetas` en las hojas, `colorPersona(uid)` única. Hecho también (22/10) lo «B» (salvo B2, Inicio en móvil pequeño: el dueño dijo dejarlo): «elegido» suave en todas partes, cabeceras de periodo, colores con un solo significado (`COLORES_CUENTA` sin azul/verde), naranja en vez de terracota (`--warn` #B8430A / #FF9F43), importe con coma (`importeCampo` + `numCampo`; el borrador se devuelve tal cual), chips de categoría con icono, Juntos vacío, día vacío del calendario, atajos con icono. Decisiones del dueño: gastos en rojo; «Escríbenos» solo por correo (pendiente de que confirme cuál). Pendiente: lo «C» de la auditoría.
- Hecho (22/10/2026): **teclado propio para el importe** (`docs/12-teclado-importe.md`): en `openMovForm`, si `tecladoOn()` (`VERSIONES.importe`), la cifra grande se escribe con el teclado de la app (`tecPulsar`, `tecSync`) que rellena el `#fImporte` oculto; gasto/ingreso nuevo en versión corta (`tecRapidoHtml`, resto en `#mfMas`); editar con el teclado cerrado. Teclado físico/pegar solo con la hoja abierta (`tecHojaAbierta`): `FORM` NO se vacía al cerrar una hoja, así que todo lo global que mire `FORM` debe comprobar `#sheetBackdrop` sin `dataset.cerrando`. Pruebas antiguas fijadas a `importe:1`. Fase 2 (compartir, aportar, traspaso) cuando el dueño lo diga. «Escríbenos» por correo (`CONTACTO.correo`, público a propósito). Deudas siguen en beige (`--debt`).
- Hecho (29/10/2026, resumen en `docs/26-sesion-29-10.md`): **Inicio a tu gusto** (`docs/21`, `cfg().inicioWidgets`, funciones `iw*`); **logos de bancos** guardados en `logos/` (`*-app.png` con clase `icono`); **mes y año cerrados como balance** (`balanceMesHtml`, `balanceAnioHtml`, `mesCerrado`; versión anterior en `VERSIONES.balance`); **Informes** sin IA (`docs/23`, `inf*`, `cfg().informes` = {on, vistos}; aviso en Inicio siempre); **tareas compartidas tanda 1** (`docs/24 §3`: `tfConHtml`, `encargosNuevos`, `cfg().agendaVisto` con fecha del servidor). Migración de «compartir mi agenda» aplicada el 30/10.
- Hecho (30/10/2026, resumen en `docs/28-sesion-30-10.md`): **compartir mi agenda** (`agc*`, también desde la Agenda), **compartir una tarea que ya tenías** (`tareaPasarACompartida`), **historial del grupo** (`docs/27`, tandas 0-2: `compAutorHtml`, `hist*`, `recuperarComp`, `deshacerBorradoComp`, `histAvisos`; tabla `compartidos_historial`, funciones `historial_grupo` y `recuperar_compartido`, 6 meses, limpieza semanal con pg_cron). «Deshacer» al borrar un compartido = recuperar el mismo gasto (mismo id y autor), para todos. `cfg().historialVisto[gid]` y `cfg().historialAvisoDesde`.
- Solo existe el aspecto «Nuevo» (el Clásico está oculto desde el 17/10/2026).
- Más adelante: fase 2 de cuentas (importar por cuenta, recurrentes por cuenta, saldar desde una cuenta); paso a APK.
- Marketing: **en pausa** hasta que la app esté funcionando (ver `docs/marketing/PLAN.md`).
- El repositorio se llama ahora `Alvar-ios/UrLife` (la dirección antigua redirige).

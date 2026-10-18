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
- Hecho (18/10/2026): **botón «Antes»** para comparar versiones en pruebas (`VERSIONES`, `versionDe(k)`, `compararCambiar`; se oculta en Tú). Cada cambio grande deja su versión anterior ahí. Ahora: Inicio (nueva | antes) y «En qué gastas» (Barras | Mosaico | Anillo). Cuando el dueño elija, se quita la variante sobrante del registro.
- Hecho (18/10/2026): **cuentas fase 2 (Juntos y fijos)**: la cuenta de cada compartido o pago al saldar se guarda en `cfg().cuentaJuntos[idCompartido]` (privado, sin migración; `cuentaDeComp`, `guardarCuentaComp`, `olvidarCuentaComp`); cobros y pagos fijos con `cuentaId`. Limpiar `cuentaJuntos` solo al borrar un compartido, nunca en bloque.
- Hecho (18/10/2026): **Juntos v2** (`docs/04-juntos.md`): pestaña por personas (`renderJuntosV2`), hoja de cada persona con «Saldar todo» (un pago por grupo, con «Deshacer») y «Pedir por WhatsApp», grupo con «Gastos | Saldos» y la administración en «Ajustes» (`FORM.ajustes`), compartir un gasto en una pantalla (`compRapidoHtml`). La versión anterior sigue en «Antes» (`VERSIONES.juntos`); los tests antiguos de Juntos usan `version:{juntos:1}`. Colores de persona fijos con `colorPersona(uid)`.
- Decisiones del dueño (18/10/2026): no prometer por escrito «gratis y sin límites» hasta conocer costes; hacer **las dos**: confianza (cifras explicadas, historial, deshacer) y viajes con otra moneda, cuando Producto decida (ver `docs/marketing/05-criticas-tricount-splitwise.md`); nada de ver un grupo con enlace «solo para mirar».
- Hecho (18/10/2026): **Dinero v2** (`docs/05-dinero.md`, `docs/06-dinero-diseno.md`): una sola pantalla (`renderDineroV2`): «Lo que tienes» (cuentas + inversiones − deudas; lo apartado para metas NO se suma dos veces si hay cuentas con saldo), Cuentas, Metas (`VERSIONES.dinero`: Camino | Tarros | Anillos | Antes), Inversiones («Ver todo» es pantalla: `S.dineroVer`) y Deudas (en `cfg().deudas[]`: `previo`, `cuotaMes`, `emoji`, `nombresAntes`; los pagos se buscan por nombre o nombres antiguos con `movsDeuda`; se crean y editan en Dinero, Tú → Deudas lleva allí). Aportar rápido (`aportarRHtml`). `numCampo` entiende «8.000» y «1.234,56». Los tests antiguos de Dinero usan `version:{dinero:3}`. Color `--warn` para «vas justo».
- Solo existe el aspecto «Nuevo» (el Clásico está oculto desde el 17/10/2026).
- Más adelante: fase 2 de cuentas (importar por cuenta, recurrentes por cuenta, saldar desde una cuenta); paso a APK.
- Marketing: **en pausa** hasta que la app esté funcionando (ver `docs/marketing/PLAN.md`).
- El repositorio se llama ahora `Alvar-ios/UrLife` (la dirección antigua redirige).

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
7. **Publicar:** trabaja en una rama; cuando el dueño diga «publica», fusiona a `main` y comprueba que la web sirve la versión nueva.
8. Al terminar cada tarea: resumen corto en español de qué cambia para el usuario y qué no se ha probado. Sin recapitular los pasos.

### «Cerramos día»
Solo cuando el dueño lo diga:
- Añadir una entrada nueva **al principio** de `NOVEDADES` en `app.js` («Parche N · título», `id` con la fecha `AAAA-MM-DD`), con 2 destacados y unos 6 puntos, en lenguaje muy simple.
- Etiquetas NUEVO / MEJORADO en `BADGES` para los apartados nuevos o mejorados (`badge('clave')` en el sitio y `verBadge('clave')` al entrar).
- Actualizar las pruebas de novedades (`tests/test11.js`, `tests/test23.js`).
- Una nota en imagen JPG (vertical, fondo oscuro, estilo de las anteriores) para el grupo de WhatsApp.

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

- Ahora: **varias cuentas, fase 1** → ver `docs/PLAN_CUENTAS.md` (decisiones ya tomadas).
- Después: fase 4, pulir pantalla a pantalla.
- Pendiente: invitados sin cuenta en grupos (bloqueado por Supabase), paso a APK.

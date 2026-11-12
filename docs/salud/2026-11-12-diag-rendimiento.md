# Diagnóstico de rendimiento · 12/11/2026 (Calidad, fase A1 de docs/40)

Rama `fase13/diag-rendimiento` (sobre `fase13/integracion`). No se ha tocado código de la app.

## 1. Conclusión

1. **No se pierde ni se descuadra ningún dato y la memoria no crece** (sin fugas): no hay ningún P0. Lo que hay es lentitud con muchos datos.
2. Con 10.000 movimientos, **Dinero (183 ms) e Inicio (118 ms) se pintan muy despacio** en un móvil de gama media simulado. Las dos cosas tienen una causa clara y fácil de arreglar: se recalcula lo mismo decenas de miles de veces en cada pintado.
3. Con 10.000 movimientos, **cada cambio de pestaña bloquea la pantalla** entre 74 y 205 ms (4 de 4 toques). Con 2.000 movimientos, 2 de 4.
4. La **Lista de Movimientos** es la pantalla más pesada con datos normales (117 ms, 2.145 piezas en pantalla) y con pesados (175 ms, 3.128 piezas).
5. El arranque sin red ronda **0,9–1,1 s** hasta ver Inicio. `app.js` pesa 1,3 MB (378 KB comprimido): con red lenta es lo que más tardará en bajar.

## 2. Tablas

Condiciones: Chromium sin ventana, móvil 390×844, CPU frenada 4×, datos inventados (`tests/datos/generar.js`). Sin red real (Supabase simulado). Mediana de 3–5 pasadas. Detalle completo en `tests/rendimiento/resultados/*.md`.

### 2.1 Cuánto tarda cada pantalla en pintarse (ms, `render()` + colocar)

| Pantalla | Ligero (50) | Normal (2.000) | Pesado (10.000) | Objetivo docs/40 |
|---|---:|---:|---:|---|
| Inicio | 22 | 39 | **118** | <50 / <150 |
| Movimientos · Resumen | 41 | 41 | 58 | |
| Movimientos · Lista | 37 | **117** | **175** | |
| Movimientos · Calendario | 15 | 18 | 38 | |
| Juntos | 1 | 24 | 18 | |
| Dinero | 3 | 13 | **183** | |
| Agenda | 14 | 26 | 25 | |
| Tú | 23 | 33 | 29 | |

### 2.2 Hojas, gestos, arranque y memoria (pesado salvo que se diga)

| Medida | Ligero | Normal | Pesado |
|---|---:|---:|---:|
| Hasta ver Inicio (ms) | 943 | 868 | 1.095 |
| · leer `app.js` en frío (ms) | 216 | (en caché) | (en caché) |
| · ejecutar `app.js` (ms) | 83 | 78 | 69 |
| · llegan datos y primer pintado (ms) | 368 | 522 | 695 |
| Abrir hoja: gasto con teclado / filtros / una cuenta (ms) | 42 / 10 / 11 | 60 / 21 / 41 | 43 / 62 / 53 |
| Cambiar de pestaña: toques con bloqueo >50 ms | 2/4 (280) | 2/4 (151) | **4/4 (205)** |
| Teclear en el buscador: letras con bloqueo | 0/7 | 4/7 (81) | **5/7 (129)** |
| Cambiar de mes / teclado del importe | sin bloqueos | sin bloqueos | sin bloqueos |
| Bajar por la Lista 2 s: fotogramas lentos | 1/114 | 1/116 | 1/118 |
| Memoria: al empezar → tras 50 pestañas → tras 30 hojas (MB) | 4,0 → 4,0 → 4,2 | 4,7 → 4,8 → 4,9 | 6,5 → 6,7 → 6,8 |
| Oyentes de eventos (empieza → acaba) | 58 → 58 | 58 → 58 | 58 → 58 |

### 2.3 Problemas, de más efecto a menos

| Problema | Dónde (archivo:línea) | Cómo se reproduce · Medida | Prioridad | Arreglo propuesto |
|---|---|---|---|---|
| Dinero recorre todos los movimientos una vez por cuenta y, dentro, copia la lista de cuentas por cada movimiento | `app.js:7980` `saldoCuenta` → `cuentaIdDe` (7967) → `cuentaPorId` (7943) y `cuentaPrincipal` (7945) → `cuentasCfg` (8261, devuelve `.slice()` en cada llamada) | Juego pesado, pestaña Dinero: 183 ms. Un pintado llama 33 veces a `saldoCuenta` y **339.000 veces** a `cuentasCfg` | P1 | Calcular los saldos de todas las cuentas en **una sola pasada** y recordarlos mientras no cambien movimientos, compartidos, traspasos, configuración ni el día. Mapa id→cuenta y principal recordados junto a `_ccMemo`. Probar que los saldos salen idénticos a los de ahora |
| Inicio pide las cifras del mes 19 veces y cada vez filtra todos los movimientos | `app.js:768` `movsDelMes` y `773` `kpisMes`; llamadas en 4225, 4255, 4270, 4281, 4391, 4437, 4559, 4574, 4607, 4752… | Juego pesado, Inicio: 118 ms; **228.000** llamadas a `mesDe` por pintado (19 × 12.000). Resumen: 7 llamadas, 86.000 `mesDe` | P1 | Agrupar los movimientos por mes **una vez** (mapa «AAAA-MM» → lista) recordado mientras sean los mismos `movsEfectivos()` y la misma `mesCfg()`; `movsDelMes` lee del mapa y `kpisMes` se recuerda por mes. Sin cambio en las cifras |
| Cambiar de pestaña bloquea la pantalla con muchos datos | `app.js:1094` `render()` repinta entera la pestaña nueva | Juego pesado: 4 de 4 cambios con bloqueo (74–205 ms) | P1 | Se arregla casi solo con los dos de arriba. Además: tras el cambio, pintar primero lo de arriba y lo de abajo en el siguiente fotograma |
| La Lista pinta 120 filas de golpe (≈26 piezas por fila) y cada fila vuelve a calcular «tu mes» y «hoy» | `app.js:1552` `renderMovList`; `app.js:1282` `inPeriodo` llama a `mesActual()` (→ `mesDe(todayISO())`) **por cada movimiento** | Normal: 117 ms y 2.145 piezas; pesado: 175 ms, 3.128 piezas, 42.700 `mesDe` y 21.800 `todayISO` por pintado | P1 | Sacar `mesActual()` y `movPerNorm` fuera del bucle de `inPeriodo` (una vez por filtrado). Empezar con 40 filas y pintar más al acercarse al final (ya existe `movLimit`); `content-visibility: auto` en los bloques de cada día |
| El buscador repinta la lista entera en cada letra | `app.js:12797` `debouncedSearch` → `renderMovList`; filtro en `app.js:1322` `movsFiltrados` (pasa a minúsculas 4 textos de cada movimiento en cada letra) | Lista «todo el tiempo», escribir «cena 12»: 5 de 7 letras con bloqueo, hasta 129 ms | P2 | Recordar el texto en minúsculas de cada movimiento mientras no cambien los movimientos; con el arreglo anterior (menos filas) baja mucho |
| `app.js` es un único archivo de 1,3 MB que se baja y se lee entero antes de ver nada | `index.html:42`; `app.js` (12.930 líneas) | Primera vez: 216 ms solo en leerlo con CPU 4×; 378 KB comprimido por la red | P2 | Sacar a archivos que se cargan al usarlos: Importar, Informes, Trayecto, Inversiones (gráfica y precios), Golf y la bienvenida. Comprobar que Vercel guarda en caché `app.js`, CSS y letras (no hay `vercel.json`) |
| `look.css` pesa 269 KB (2.519 líneas) y frena la primera pintura | `index.html:21`; `look.css` | 208–266 ms antes de empezar `app.js` | P2 | Quitar reglas de versiones que ya no salen (lo del «Antes» que el dueño descarte); no cargar `app.css` entero si el Clásico sigue oculto (98 KB) |
| Primer pintado con datos pesados tarda | `app.js:888` `aplicarMovs` + primer `render()` de Inicio | Pesado: 695 ms desde que acaba `app.js` hasta ver Inicio | P2 | Mismo arreglo que Inicio; `normMov` solo cuando cambian las categorías |
| Abrir la hoja de una cuenta o los filtros con muchos datos | `cuentaVer` (`app.js:12433`) usa `saldoCuenta`; `movFiltrosHtml` cuenta categorías sobre todos los movimientos | Pesado: cuenta 53 ms, filtros 62 ms | P3 | Se arregla con el primer punto y con el mapa por mes |
| Memoria y oyentes | — | Estables: +0,3 MB tras 50 pestañas y 30 hojas; 58 oyentes siempre | — | Nada que hacer |

## 3. Recomendaciones

- **Empezar por los dos primeros** (saldos en una pasada y cifras por mes recordadas): son pocas líneas, quitan el 70–90 % del tiempo de Dinero e Inicio y no cambian ninguna cifra.
- Cada arreglo con una prueba que compare cifras antes y después con los tres juegos (`tests/datos/generar.js`), para asegurar que no se descuadra nada.
- Volver a pasar `tests/rendimiento/medir.js` tras cada arreglo (unos 75 s por juego).

## 4. Riesgos

- Recordar resultados mal invalidados = **cifras viejas en pantalla** (p. ej. un saldo que no se actualiza al apuntar). La clave de lo recordado debe incluir movimientos, compartidos, traspasos, objetivos, configuración y el día.
- Cargar partes más tarde puede romper la app de Android si un archivo no se copia con `npm run sync`.

## 5. Preguntas para el dueño

Ninguna bloquea. 1) ¿Se pueden quitar ya las versiones de «Antes» que no se usan? Así baja el peso de `look.css` y `app.js`.

## 6. Lo que no se ha podido medir o confirmar

- **Red real**: Supabase está simulado. No se ha medido la descarga con 4G lento, cuántos datos baja cada consulta ni los canales de tiempo real. Las «9 consultas al entrar» son las del simulador.
- **Móvil real**: todo es Chromium con la CPU frenada 4×. No se ha probado en un Android de verdad ni en la app de Android.
- «Leer `app.js`» solo sale en frío en la primera pasada; en las demás el navegador ya lo tenía preparado. Con caché de verdad no se ha medido.
- El cambio de mes se ha medido en Resumen, no en Lista ni en Calendario. Los fotogramas al abrir o cerrar hojas y al deslizar meses no se han medido aparte.
- La máquina la compartían otros procesos: las cifras pueden variar ±15 %.

## 7. Fuentes

- Medidas propias del 12/11/2026: `tests/rendimiento/medir.js` → `tests/rendimiento/resultados/{ligero,normal,pesado}.{json,md}`.
- Código: `app.js` y `index.html` de la rama `fase13/integracion` (commit 809aaff).

Para el PDF: una barra por pantalla (ligero, normal, pesado) con la línea del objetivo de 50 y 150 ms.

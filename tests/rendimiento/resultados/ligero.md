# Medidas de rendimiento (2026-11-12)

Chromium sin ventana, móvil 390×844, CPU frenada 4×. Datos inventados. Tiempos en milisegundos (mediana).

## Arranque (hasta ver Inicio con datos)

| Tramo | ligero |
| --- | ---: |
| Hasta ver Inicio | 942.5 |
| Primera pintura | 564 |
| Antes de app.js (HTML y CSS) | 208.2 |
| Leer app.js | 215.8 |
| Ejecutar app.js | 83.3 |
| Llegan datos y se pinta | 367.7 |
| Consultas al entrar (simuladas) | 7 |

## render() por pantalla: JS + colocar (solo JS) · nodos

| Pantalla | ligero |
| --- | ---: |
| Inicio | 22.3 (12.7) · 265 |
| Movimientos · Resumen | 40.6 (39.4) · 441 |
| Movimientos · Lista | 37.4 (36.9) · 379 |
| Movimientos · Lista (todo el tiempo) | 115.7 (109.3) · 1474 |
| Movimientos · Calendario | 15.4 (14) · 279 |
| Juntos | 0.6 (0.3) · 131 |
| Dinero | 2.8 (2.8) · 171 |
| Agenda | 14.4 (14.3) · 191 |
| Tú | 22.6 (21.9) · 419 |

## Abrir hojas: JS + colocar · nodos de la hoja

| Hoja | ligero |
| --- | ---: |
| Botón + | 15.4 · 112 |
| Gasto con teclado | 41.7 · 214 |
| Filtros | 9.6 · 46 |
| Importar | 10.8 · 19 |
| Una cuenta | 10.6 · 75 |
| Un grupo | — |

## Tareas largas (> 50 ms): toques con tarea larga / toques · la peor

| Gesto | ligero |
| --- | ---: |
| Cambiar de pestaña | 2/4 · 280 ms |
| Cambiar de mes | 0/4 · 0 ms |
| Teclear el importe | 0/5 · 0 ms |
| Teclear en el buscador | 0/7 · 0 ms |
| Bajar por la Lista 2 s: fotogramas lentos / total · peor | 1/114 · 65 ms (50 filas) |

## Memoria: MB de JS · nodos · oyentes

| Momento | ligero |
| --- | ---: |
| Al empezar | 4 · 836 · 58 |
| Tras 50 cambios de pestaña | 4 · 660 · 58 |
| Tras 30 hojas | 4.2 · 660 · 58 |

## Llamadas por pintado (veces · ms dentro, sin freno)

### ligero

| Pantalla | Las 6 que más tiempo se llevan |
| --- | --- |
| Inicio (10.7 ms) | kpisMes ×19 (5.8), sumTipo ×120 (3.7), movsDelMes ×20 (2.2), mesDe ×1062 (1.6), metasStats ×1 (1.2), mesCfg ×1079 (0.3) |
| Movimientos · Resumen (8.7 ms) | catsGasto ×16 (0.9), mesDe ×406 (0.8), kpisMes ×7 (0.8), movsDelMes ×7 (0.7), sumTipo ×42 (0.1), mesCfg ×413 (0) |
| Movimientos · Lista (14.4 ms) | movsFiltrados ×1 (0.2), mesCfg ×205 (0), mesDe ×204 (0), todayISO ×110 (0), cfg ×9 (0), cuentasCfg ×9 (0) |
| Movimientos · Lista (todo el tiempo) (16.2 ms) | catsGasto ×23 (0.2), movsFiltrados ×1 (0.2), todayISO ×60 (0.1), mesCfg ×104 (0), mesDe ×104 (0), cuentasCfg ×51 (0) |
| Movimientos · Calendario (3.9 ms) | mesCfg ×107 (0), mesDe ×105 (0), todayISO ×12 (0), cfg ×7 (0), versionIdx ×3 (0), rangoMes ×2 (0) |
| Juntos (0.3 ms) | cfg ×6 (0.1), todayISO ×7 (0), versionIdx ×4 (0), perfilCfg ×1 (0), mesCfg ×1 (0), mesDe ×1 (0) |
| Dinero (5.8 ms) | saldoCuenta ×6 (0.6), patrimonio ×1 (0.6), cuentasCfg ×301 (0.2), metasStats ×2 (0.1), mesCfg ×1 (0.1), mesDe ×1 (0.1) |
| Agenda (7.8 ms) | cfg ×16 (0), todayISO ×13 (0), versionIdx ×5 (0), perfilCfg ×1 (0), mesCfg ×1 (0), mesDe ×1 (0) |
| Tú (4.1 ms) | cfg ×61 (0), todayISO ×26 (0), versionIdx ×5 (0), cuentasCfg ×3 (0), mesCfg ×3 (0), perfilCfg ×2 (0) |

## Peso de los archivos

| Archivo | KB | KB comprimido (gzip) |
| --- | ---: | ---: |
| index.html | 3 | 1.4 |
| app.js | 1329.1 | 377.8 |
| data-layer.js | 25.9 | 7.4 |
| auth-signup.js | 5.6 | 2 |
| app.css | 98.2 | 19.5 |
| look.css | 269.3 | 41.9 |
| fonts/fonts.css | 1 | 0.4 |
| fonts/*.woff2 (5) | 209.1 | (ya comprimido) |
| logos/* (27) | 98.9 | (ya comprimido) |

## Errores de la app durante la medición

Ninguno.

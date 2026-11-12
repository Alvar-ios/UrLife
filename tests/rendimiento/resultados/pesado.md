# Medidas de rendimiento (2026-11-12)

Chromium sin ventana, móvil 390×844, CPU frenada 4×. Datos inventados. Tiempos en milisegundos (mediana).

## Arranque (hasta ver Inicio con datos)

| Tramo | pesado |
| --- | ---: |
| Hasta ver Inicio | 1094.7 |
| Primera pintura | 396 |
| Antes de app.js (HTML y CSS) | 266.2 |
| Leer app.js | 1 |
| Ejecutar app.js | 69.1 |
| Llegan datos y se pinta | 694.7 |
| Consultas al entrar (simuladas) | 9 |

## render() por pantalla: JS + colocar (solo JS) · nodos

| Pantalla | pesado |
| --- | ---: |
| Inicio | 118.1 (107.3) · 290 |
| Movimientos · Resumen | 57.5 (55.3) · 456 |
| Movimientos · Lista | 175 (173.6) · 3128 |
| Movimientos · Lista (todo el tiempo) | 160.1 (159) · 3118 |
| Movimientos · Calendario | 37.5 (36.2) · 638 |
| Juntos | 18.4 (17.4) · 242 |
| Dinero | 182.9 (182.8) · 222 |
| Agenda | 25.4 (24.4) · 251 |
| Tú | 29.1 (26.5) · 419 |

## Abrir hojas: JS + colocar · nodos de la hoja

| Hoja | pesado |
| --- | ---: |
| Botón + | 20.3 · 120 |
| Gasto con teclado | 42.7 · 235 |
| Filtros | 62.4 · 60 |
| Importar | 9.5 · 19 |
| Una cuenta | 53.2 · 97 |
| Un grupo | 39.5 · 119 |

## Tareas largas (> 50 ms): toques con tarea larga / toques · la peor

| Gesto | pesado |
| --- | ---: |
| Cambiar de pestaña | 4/4 · 205 ms |
| Cambiar de mes | 0/4 · 0 ms |
| Teclear el importe | 0/5 · 0 ms |
| Teclear en el buscador | 5/7 · 129 ms |
| Bajar por la Lista 2 s: fotogramas lentos / total · peor | 1/118 · 49 ms (120 filas) |

## Memoria: MB de JS · nodos · oyentes

| Momento | pesado |
| --- | ---: |
| Al empezar | 6.5 · 1002 · 58 |
| Tras 50 cambios de pestaña | 6.7 · 960 · 58 |
| Tras 30 hojas | 6.8 · 960 · 58 |

## Llamadas por pintado (veces · ms dentro, sin freno)

### pesado

| Pantalla | Las 6 que más tiempo se llevan |
| --- | --- |
| Inicio (166.2 ms) | movsDelMes ×20 (115), kpisMes ×19 (109.9), mesDe ×228012 (92.9), saldoCuenta ×8 (34.6), mesCfg ×228029 (31.2), cuentasCfg ×82172 (12.7) |
| Movimientos · Resumen (51.5 ms) | kpisMes ×7 (38.8), movsDelMes ×7 (38.7), mesDe ×86306 (31.8), mesCfg ×86313 (10.6), catsGasto ×18 (0.3), sumTipo ×42 (0.1) |
| Movimientos · Lista (58.8 ms) | movsFiltrados ×1 (28.8), mesDe ×42704 (16), todayISO ×21810 (6.4), mesCfg ×42705 (5.1), cuentasCfg ×339 (0.3), catsGasto ×32 (0.2) |
| Movimientos · Lista (todo el tiempo) (45.2 ms) | movsFiltrados ×1 (15.2), mesDe ×20904 (7.9), todayISO ×10910 (3.3), mesCfg ×20904 (2.6), catsGasto ×32 (0.5), cuentasCfg ×339 (0.4) |
| Movimientos · Calendario (17.4 ms) | mesDe ×20905 (8.6), mesCfg ×20907 (2.7), cuentasCfg ×44 (0), cfg ×27 (0), todayISO ×12 (0), catsGasto ×4 (0) |
| Juntos (4.1 ms) | saldosDe ×6 (0.5), mesCfg ×1 (0.1), mesDe ×1 (0.1), todayISO ×7 (0), cfg ×7 (0), versionIdx ×5 (0) |
| Dinero (135.4 ms) | saldoCuenta ×33 (126), cuentasCfg ×338950 (46.5), patrimonio ×1 (39.1), flujosCompartidos ×33 (16.6), cuentaPrincipal ×9769 (4.8), cfg ×9754 (3.2) |
| Agenda (5 ms) | todayISO ×13 (0.1), cfg ×16 (0), versionIdx ×5 (0), perfilCfg ×1 (0), mesCfg ×1 (0), mesDe ×1 (0) |
| Tú (3.9 ms) | cfg ×61 (0), todayISO ×26 (0), versionIdx ×5 (0), cuentasCfg ×3 (0), mesCfg ×3 (0), perfilCfg ×2 (0) |

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

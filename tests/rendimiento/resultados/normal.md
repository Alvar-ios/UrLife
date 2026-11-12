# Medidas de rendimiento (2026-11-12)

Chromium sin ventana, móvil 390×844, CPU frenada 4×. Datos inventados. Tiempos en milisegundos (mediana).

## Arranque (hasta ver Inicio con datos)

| Tramo | normal |
| --- | ---: |
| Hasta ver Inicio | 867.5 |
| Primera pintura | 452 |
| Antes de app.js (HTML y CSS) | 246.7 |
| Leer app.js | 10.7 |
| Ejecutar app.js | 77.5 |
| Llegan datos y se pinta | 522.1 |
| Consultas al entrar (simuladas) | 9 |

## render() por pantalla: JS + colocar (solo JS) · nodos

| Pantalla | normal |
| --- | ---: |
| Inicio | 39 (24.6) · 290 |
| Movimientos · Resumen | 40.9 (38.8) · 452 |
| Movimientos · Lista | 116.8 (114.8) · 2145 |
| Movimientos · Lista (todo el tiempo) | 170.3 (169.2) · 3185 |
| Movimientos · Calendario | 17.5 (17.4) · 394 |
| Juntos | 23.5 (22.4) · 180 |
| Dinero | 13.1 (13) · 192 |
| Agenda | 26.4 (24.7) · 216 |
| Tú | 32.7 (31.7) · 419 |

## Abrir hojas: JS + colocar · nodos de la hoja

| Hoja | normal |
| --- | ---: |
| Botón + | 18.6 · 120 |
| Gasto con teclado | 59.5 · 224 |
| Filtros | 21.3 · 60 |
| Importar | 10.1 · 19 |
| Una cuenta | 41.4 · 88 |
| Un grupo | 33.1 · 119 |

## Tareas largas (> 50 ms): toques con tarea larga / toques · la peor

| Gesto | normal |
| --- | ---: |
| Cambiar de pestaña | 2/4 · 151 ms |
| Cambiar de mes | 0/4 · 0 ms |
| Teclear el importe | 0/5 · 0 ms |
| Teclear en el buscador | 4/7 · 81 ms |
| Bajar por la Lista 2 s: fotogramas lentos / total · peor | 1/116 · 43 ms (120 filas) |

## Memoria: MB de JS · nodos · oyentes

| Momento | normal |
| --- | ---: |
| Al empezar | 4.7 · 893 · 58 |
| Tras 50 cambios de pestaña | 4.8 · 767 · 58 |
| Tras 30 hojas | 4.9 · 767 · 58 |

## Llamadas por pintado (veces · ms dentro, sin freno)

### normal

| Pantalla | Las 6 que más tiempo se llevan |
| --- | --- |
| Inicio (50.9 ms) | movsDelMes ×20 (35.7), kpisMes ×19 (34.7), mesDe ×43612 (24.8), mesCfg ×43629 (5.2), saldoCuenta ×3 (5.2), metasStats ×1 (1.6) |
| Movimientos · Resumen (30.8 ms) | kpisMes ×7 (15.9), movsDelMes ×7 (15.7), mesDe ×16566 (12.6), mesCfg ×16573 (5.5), catsGasto ×18 (0.3), versionIdx ×6 (0.2) |
| Movimientos · Lista (28.3 ms) | movsFiltrados ×1 (8.1), mesDe ×8244 (3.8), todayISO ×4170 (1.9), mesCfg ×8245 (1.4), catsGasto ×27 (0.3), cfg ×110 (0.2) |
| Movimientos · Lista (todo el tiempo) (28.6 ms) | movsFiltrados ×1 (2.6), mesDe ×4084 (1.9), mesCfg ×4084 (0.8), todayISO ×2090 (0.7), catsGasto ×46 (0.1), cuentasCfg ×342 (0) |
| Movimientos · Calendario (6.5 ms) | mesDe ×4085 (1.7), mesCfg ×4087 (0.7), cfg ×16 (0.1), rangoMes ×2 (0.1), catsGasto ×2 (0.1), cuentasCfg ×17 (0) |
| Juntos (2.4 ms) | saldosDe ×2 (0.1), todayISO ×7 (0), cfg ×7 (0), versionIdx ×5 (0), perfilCfg ×1 (0), mesCfg ×1 (0) |
| Dinero (17.1 ms) | saldoCuenta ×13 (11.9), cuentasCfg ×26306 (6.3), patrimonio ×1 (5.2), cuentaPrincipal ×469 (1.9), flujosCompartidos ×13 (0.8), cfg ×469 (0.4) |
| Agenda (6 ms) | cfg ×16 (0), todayISO ×13 (0), versionIdx ×5 (0), perfilCfg ×1 (0), mesCfg ×1 (0), mesDe ×1 (0) |
| Tú (3.3 ms) | cfg ×61 (0.1), perfilCfg ×2 (0.1), todayISO ×26 (0), versionIdx ×5 (0), cuentasCfg ×3 (0), mesCfg ×3 (0) |

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

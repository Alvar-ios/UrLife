# Diagnóstico completo · 12/11/2026 (sesión potente, fase A)

Resumen de los cinco informes de la fase A del plan (`docs/40-plan-sesion-potente.md`). Cada informe tiene el detalle: cómo se reproduce, dónde está y cómo se arregla.

| Área | Informe | P0 | P1 encontrados | Estado de los P1 |
|---|---|---|---|---|
| Rendimiento | `2026-11-12-diag-rendimiento.md` | 0 | 4 (Dinero, Inicio, cambio de pestaña y Lista lentos con muchos datos) | Ver `docs/CAMBIOS-1.1.0.md` |
| Interfaz y móvil | `2026-11-12-diag-interfaz.md` | 0 | 7 (el teclado tapa campos, el botón atrás cierra demasiado, cortes a 320 px y con letra al 130 %, interruptores sin nombre, contraste de WhatsApp) | Ver `docs/CAMBIOS-1.1.0.md` |
| Lógica y cifras | `2026-11-12-diag-logica.md` | 0 | 3, todos en el importe escrito a mano | Arreglados (test160) |
| Datos y seguridad | `2026-11-12-diag-datos.md` | 0 | 4 | Avisos al cerrar sesión: arreglado. Tablas `backup_*`, copia semanal y CAPTCHA o tope de la IA: los decide el dueño |
| Importar extractos | `2026-11-12-diag-importar.md` | — | De 12 formatos, 6 entraban mal | Arreglados (test154 y test155) |
| Avisos (datos) | `2026-11-12-avisos-datos.md` | — | Diseño de los avisos del banco con la app cerrada (opción b) | Hecho |

## Lo más importante
1. **Nada se pierde ni se descuadra.** Las cifras de todas las pantallas coinciden entre sí en 30 casos, y Juntos cuadra al céntimo en 40 grupos al azar. No hay fugas de memoria.
2. **Lo que molesta de verdad:**
   - lentitud con miles de movimientos;
   - el teclado del móvil tapa el campo que escribes;
   - el botón atrás de Android cierra la hoja entera (y con «Así vas» abierto cierra la app);
   - el importe escrito a mano aceptaba cosas raras.
3. **Seguridad:** no hay claves en el repositorio y todas las tablas tienen reglas por usuario. Quedan decisiones del dueño:
   - borrar las tablas `backup_*` de octubre (es destructivo);
   - la copia semanal no incluye las cuentas y se puede descargar cifrada;
   - las altas no tienen CAPTCHA y la IA de tickets no tiene tope global;
   - activar la protección de contraseñas filtradas;
   - `activos-api` no comprueba la firma del token.
4. **Ojo con lo que dice la web de privacidad:** promete una copia de seguridad cifrada semanal que se guarda 90 días. La copia existe, pero Datos y Seguridad propone mejorarla (§4 de su informe).

## Herramientas que quedan para repetir el diagnóstico
- `tests/datos/generar.js`: tres juegos de datos inventados (ligero, normal y pesado, con 10.000 movimientos).
- `tests/rendimiento/medir.js`: mide cada pantalla con un móvil de gama media simulado. Los resultados están en `tests/rendimiento/resultados/`.
- `tests/capturas/revisar.js` (ampliado): permite elegir anchos, letra al 130 %, tableta, teclado abierto y medidas de toque, contraste y nombres.
- `test160`, `test161` y `test162`: el importe escrito a mano, que no haya botones sin acción ni errores en consola, y que las cifras cuadren.
- `tests/datos/extractos/`: 12 extractos inventados de bancos españoles, más Norma 43.
- `node run.js --j=4`: pasa todas las pruebas en paralelo (unos 7 minutos).
- `.github/workflows/pruebas.yml`: pasa las pruebas web y las del lector de avisos en GitHub.

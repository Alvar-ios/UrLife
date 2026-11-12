# Sesión potente · estado (lo actualiza la sesión al acabar cada fase)

Plan: `docs/40-plan-sesion-potente.md`. Empezó el 12/11/2026 a las 00:57 por orden directa del dueño («Dale, empieza»).

## Permisos y decisiones del dueño
- **«Sí a las migraciones»** (12/11, 00:56): se pueden aplicar las de §5 del plan (solo aditivas).
- Sin PDFs salvo que los pida expresamente.
- Nada a `main` salvo `docs/`; no se sube nada a Google Play; no se toca `auth-signup.js`.
- No hay avisos reales, extractos reales ni Firebase: textos inventados y avisos locales; lo que dependa de ellos, «Pendiente».
- Decisiones de §6: las recomendadas.

## Ramas
- `fase13/integracion` (sale de `fase12/avisos` + docs de main): de aquí sale la APK. Ya lleva diagnóstico (pruebas y medidores), avisos por niveles, widgets, importar y avisos del banco fase 2.
- En curso, por separado: `fase13/fix-rendimiento`, `fase13/fix-interfaz`, `fase13/idiomas`.

## Fases
| Fase | Estado | Notas |
|---|---|---|
| A · Diagnóstico | Hecho | Informes en `docs/salud/2026-11-12-diag-*.md` (rendimiento, interfaz, lógica, datos, importar). Sin P0. |
| B · Arreglos P0/P1 | En curso | Importe escrito a mano: hecho. Rendimiento e interfaz: en curso. |
| C2 · Avisos de la app | Hecho | Importantes / normales / resumen, máx. 3 al día, silencio 22–9. test152. |
| C5 · Widgets | Hecho | «Te queda este mes» (2×1) y «Apuntar gasto» (1×1). test151_widgets + JUnit. Sin probar en móvil real. |
| C4 · Importar | Hecho | Norma 43, Sabadell/CaixaBank/BBVA/Revolut/Trade Republic, compartir con PalomApp. test154–155. |
| C3 · Avisos del banco 2 | Hecho | Se guardan con la app cerrada, «Deshacer» en el aviso. Migración `avisos_dispositivos` y función `avisos-guardar` aplicadas. **Falta permiso para redesplegar `borrar-cuenta`** (la web ya quita los móviles antes de borrar). |
| C1 · Idiomas | En curso | |
| Integración, Calidad, APK/AAB, CAMBIOS | Pendiente | |

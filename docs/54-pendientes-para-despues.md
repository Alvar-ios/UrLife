# Pendientes para después (apuntado el 28/11/2026)

**Regla del dueño:** cuando toque hacer cualquiera de estos, Claude le pasa el **paso a paso** de lo que tiene que hacer él (cuentas de Apple, claves, portales), en español sencillo, ANTES de programar.

1. **Avisos de Juntos con la app cerrada en iPhone** (notificaciones push). Necesita una clave de notificaciones de Apple (APNs, portal de Apple Developer), enlazarla con Firebase y un iPhone real para probar. Hoy en Android funciona con Firebase; en iPhone solo hay avisos por Atajos. Ver `docs/49` y `supabase/functions/avisar`.
2. **Compartir el extracto del banco con PalomApp desde iPhone** (el equivalente a «Compartir con PalomApp» de Android, `docs/40` C4). Necesita una extensión de compartir en el proyecto de Xcode, un identificador nuevo y su perfil en el portal de Apple, y un iPhone real.
3. **Parte web de «sin conexión»** (guardado en el navegador, importar sin conexión y fotos): tandas 2 y 3 de `docs/52`. Hoy solo funciona en las apps.
4. **Widgets de iPhone y aviso extra** que queden de `docs/49`.

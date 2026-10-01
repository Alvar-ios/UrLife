# Mis Finanzas y Tareas

App personal de gastos, presupuestos y tareas. Versión independiente de Claude: aloja sus propios datos en Supabase (PostgreSQL + autenticación), se publica como sitio estático en Vercel, y el código vive en GitHub.

**Para desplegarla, sigue `GUIA_DESPLIEGUE.md` de principio a fin — está pensada para hacerse sin conocimientos técnicos previos.**

## Qué es cada archivo

| Archivo | Para qué sirve | ¿Se sube a GitHub? |
|---|---|---|
| `index.html` | La app en sí (lo que abres cada día) | Sí |
| `app.css` | Todo el diseño visual (colores, tipografías, layout) | Sí |
| `app.js` | Toda la lógica: cálculos, pantallas, formularios | Sí |
| `data-layer.js` | El "traductor" entre la app y Supabase | Sí |
| `importar.html` | Herramienta para traer tu copia de seguridad a Supabase | Sí |
| `config.example.js` | Plantilla de configuración | Sí |
| `config.js` | Tu configuración real (URL y clave de **tu** Supabase) | **No** — es solo tuyo, no lo compartas públicamente aunque la clave no sea secreta |
| `sql/schema.sql` | El SQL que creas las tablas y la seguridad en Supabase | No hace falta (se pega directamente en Supabase) |
| `GUIA_DESPLIEGUE.md` | La guía paso a paso | Sí (es cómodo tenerla a mano) |

## Qué conserva exactamente de la versión anterior

Mismo diseño, mismos colores y tipografías, misma navegación (Inicio / Movimientos / Análisis / Tareas / Más), mismos cálculos y automatismos, mismas categorías y presupuestos, mismo Golf Reventa, misma exportación de copia de seguridad. Lo único que cambia es de dónde vienen y a dónde van los datos — antes Claude, ahora tu propio Supabase — y que ahora hay una pantalla de inicio de sesión.

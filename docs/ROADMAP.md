# Hoja de ruta de PalomApp (18/10/2026)

*Producto y diseño. Ordena lo pendiente después de Juntos v2 y de las decisiones del dueño sobre el estudio de Tricount y Splitwise (`docs/marketing/05-criticas-tricount-splitwise.md`). Se revisa al terminar cada fase.*

## 1. Conclusión

1. **Primero, lo pequeño que da confianza en Juntos** («¿De dónde sale?» en cada saldo y «Deshacer» al borrar un gasto compartido). Juntos v2 está recién publicado y es lo que la gente usa con otros: un fallo ahí se nota más que en ningún sitio. No toca Supabase.
2. **Después, seguir puliendo pantalla a pantalla:** Dinero (propuesta en `docs/05-dinero.md`), luego Tú y ajustes, Agenda y el botón +. Al acabar, se eligen las versiones del botón «Antes» y se quita lo que sobre.
3. **Lo que necesita cambios en Supabase va después y de uno en uno:** el historial del grupo y luego los viajes con otra moneda. Cada uno pasa antes por Datos y seguridad.
4. **Cuentas (importar por cuenta) y el paso a APK, cuando lo anterior esté estable.** El marketing sigue en pausa, y no se promete «gratis y sin límites» hasta conocer los costes.

## 2. Orden de las fases

| # | Fase | Qué incluye | Por qué en este orden | ¿Supabase? |
|---|---|---|---|---|
| 1 | **Confianza en Juntos, parte 1** | «¿De dónde sale?» en cada saldo (los gastos y pagos que lo forman, sumando justo esa cifra). «Deshacer» al borrar un gasto compartido. Una prueba automática que compruebe que la cifra de fuera y la de dentro coinciden | Esfuerzo bajo, con el código de Juntos aún fresco. Es la queja n.º 1 de Tricount (saldos que no cuadran, datos que desaparecen) | No |
| 2 | **Fase 4 · Dinero** | Ver `docs/05-dinero.md`: una pantalla de un vistazo, «Lo que tienes» explicado, metas más cortas con «Aportar» a mano | Es la cuarta pestaña y la única sin pulir. Además, lo apartado se suma dos veces en el patrimonio (un error de cifra, como el de Juntos) | No |
| 3 | **Fase 4 · Tú y ajustes** | Ordenar los ajustes; aviso «Te quedan N lecturas de tickets este mes» antes de que se acaben; «Escríbenos» (WhatsApp o correo) | Ideas del estudio de Tricount y Splitwise de esfuerzo bajo | No |
| 4 | **Fase 4 · Agenda y botón +** | Tareas, calendario y el formulario de añadir. Al terminar: elegir las versiones de «Antes» (Inicio, «En qué gastas», Juntos, Dinero) y borrar las que sobren | Cierra la fase 4 con toda la app al mismo nivel | No |
| 5 | **Confianza en Juntos, parte 2: historial del grupo** | Quién apuntó, cambió o borró cada gasto, y cuándo. Amplía la «Actividad» que ya existe | Necesita guardar los cambios y los borrados en el servidor: hay que decidir qué se guarda y cuánto tiempo | **Sí** (tabla o columnas nuevas). Datos y seguridad antes |
| 6 | **Viajes con otra moneda** | Moneda por grupo, importe original y cambio en cada gasto, total del viaje y «Cerrar el viaje» | Lo más pedido que nos falta en viajes. Va después del historial porque cambia cómo se guardan los importes compartidos, y con el historial cualquier error se ve | **Sí** (columnas en `grupos` y `compartidos`). Datos y seguridad antes |
| 7 | **Cuentas, lo que queda de la fase 2** | Importar un extracto en una cuenta concreta y detectar traspasos entre cuentas propias; reglas con cuenta; meta ligada a una cuenta de ahorro. (Los fijos con cuenta y saldar desde una cuenta ya están hechos) | Útil sobre todo para quien importa extractos; no bloquea a nadie | Probablemente no, pero toca la importación: **Datos y seguridad antes** |
| 8 | **Paso a APK** | La app instalable en Android | Cuando la web esté estable, para no publicar dos veces lo mismo con fallos | No en principio. Datos y seguridad revisa claves e inicio de sesión |
| 9 | **Marketing** (en pausa) | Plan de `docs/marketing/PLAN.md` | Se retoma cuando lo anterior esté hecho. Antes: medir cuánto cuestan los tickets y Supabase por usuario para decidir qué se promete | No |

Otras ideas del estudio, sin fecha: descargar un grupo en Excel y gasto fijo compartido (alquiler, luz). Se colocan después de la fase 6.

## 3. Descartado o aplazado

| Idea | Estado | Motivo |
|---|---|---|
| Ver un grupo con un enlace, sin cuenta, solo para mirar | **Descartado** por el dueño (18/10/2026) | — |
| Prometer por escrito «gratis y sin límites» | **Aplazado** | Hasta conocer costes y cuánto aguanta el sistema |
| Cuenta conjunta en Juntos, tarjeta de crédito con cargo diferido, moneda por cuenta | Aplazado a cuando la app salga al público | `docs/PLAN_CUENTAS.md`, fase 3 |

## 4. Riesgos

- **Hacer las fases 5 y 6 a la vez** mezclaría dos cambios de base de datos. Mejor de uno en uno, con una semana de uso entre medias.
- **La fase 4 puede alargarse** si cada pantalla deja una versión «Antes». Por eso la fase 4 termina eligiendo y limpiando.
- **Viajes antes de Semana Santa:** si el dueño quiere usarlo en un viaje concreto, la fase 6 puede adelantarse a la 5. Esa es la única alteración del orden que recomendamos.

## 5. Preguntas para el dueño

1. ¿Te parece bien empezar por la confianza en Juntos, parte 1 (pequeña), antes de Dinero? No bloquea: se puede hacer en paralelo con la propuesta de Dinero.
2. ¿Hay algún viaje con otra moneda a la vista? Si lo hay, adelantamos la fase 6.

## 6. Lo que no hemos podido averiguar o confirmar

- No sabemos cuánto cuesta hoy cada usuario (lecturas de tickets y Supabase): hace falta para la fase 9.
- No hemos confirmado si importar por cuenta necesita columnas nuevas: lo dirá Datos y seguridad.
- El esfuerzo de cada fase es una estimación de Producto, no de Desarrollo.

## 7. Fuentes

- `CLAUDE.md`, apartado «Trabajo en curso» (18/10/2026).
- `docs/marketing/05-criticas-tricount-splitwise.md`, `docs/04-juntos.md`, `docs/PLAN_CUENTAS.md` y `docs/05-dinero.md`.

Para el PDF: una línea de tiempo horizontal con las 9 fases; las 5 y 6 marcadas con un candado («pasa por Datos y seguridad») y la 9 en gris («en pausa»).

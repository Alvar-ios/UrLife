# 30b · Tanda 5 «Arreglar lo que ya tenías»: revisión de Datos y Seguridad

5/11/2026 · Datos y Seguridad · Revisa la tanda 5 de `docs/30-cuentas-fase2.md` (§3 B «Caso antiguo», §5 y los riesgos 4, 5 y 8 de la tabla del §7). Solo análisis: no se ha tocado Supabase, ni datos reales, ni `app.js`.

## 1. Conclusión

1. **Se puede programar ya, sin migración.** Todo cabe en columnas que existen (`cuenta_id`, `cuenta_destino_id`, `tipo`…) y en `cfg().importLotes[]`. No hay SQL que aplicar.
2. **La regla más importante: la tanda 5 nunca cambia el `lote` de un movimiento que ya existía.** «Deshacer importación» borra todo lo que lleve ese lote; si un movimiento antiguo recibiera el lote nuevo, deshacer lo **borraría** en vez de devolverlo como estaba.
3. **Guardar solo lo que cambia, antes y después** (`cambios: [{id, campos, antes, despues}]`), no la fila entera. Así ocupa poco y, al deshacer, se sabe si el usuario lo editó después: si lo editó, no se pisa.
4. **Deshacer en dos pasos y en este orden:** primero devolver cada movimiento como estaba (solo si sigue existiendo y nadie lo ha cambiado), y solo si todo fue bien, borrar el lote. Si algo falla a medias, se puede repetir sin estropear nada.
5. **Los lotes con cambios no se recortan.** Hoy se guardan los 50 últimos; con cambios, primero se quitan los lotes viejos que no tienen cambios.

## 2. Qué cambia y qué se guarda

| Caso | Qué cambia en el movimiento antiguo | `campos` que se guardan | Cuándo se ofrece |
|---|---|---|---|
| «Es el mismo» con un movimiento sin cuenta | `cuentaId`: vacío → la del extracto | `cuentaId` | La fila del extracto encaja con uno sin cuenta (§3 B) |
| «N filas ya estaban importadas, pero sin cuenta» | `cuentaId`: vacío → la del extracto | `cuentaId` | Al reimportar un archivo de antes de la tanda 1 |
| «Sí, convertir» (caso antiguo) | Gasto → Traspaso | `tipo`, `categoria`, `importe`, `cuentaId`, `cuentaDestinoId` | Gasto de otra cuenta, mismo importe al céntimo, 0-3 días |

Forma de cada cambio dentro del lote (ejemplo inventado):

```
cambios: [{ id: "m_abc", campos: ["cuentaId"], antes: { cuentaId: null }, despues: { cuentaId: "c_ing" }, ts: 1730800000000 }]
```

- `antes` y `despues` llevan **solo** los campos de `campos`. Nada de importes de otros movimientos, nombres ni correos.
- Al convertir, **no** se vacían `subcategoria`, `metodoPago` ni `articulos` (hoy `saveTraspaso` sí los vacía). Los artículos de un ticket pueden ser largos y no deben ir a `cfg()`; Calidad debe comprobar que un Traspaso con esos campos se ve bien. Si Desarrollo prefiere vaciarlos, no se puede deshacer bien sin copiarlos: mejor no tocarlos.
- **No se cambia `lote`, ni `fecha`, ni `descripcion`, ni `compartidoId`, ni `metaId`/`metaIds`.** El convertido conserva su lote antiguo (decisión del 31/10).

## 3. Cuánto cabe en `cfg()`

| Dato | Medida aproximada | Límite propuesto |
|---|---|---|
| Un cambio de cuenta | ~120 bytes | — |
| Un cambio a traspaso | ~300 bytes | — |
| Cambios por lote | 200 × 300 B ≈ 60 KB | **200** (si hay más, se pide importar en dos veces) |
| Cambios en todos los lotes | 500 × 300 B ≈ 150 KB | **500** en total |

Por qué hace falta límite: la configuración es **una sola fila** (`config`, clave `app`) y cada `saveConfig` la lee y la vuelve a escribir entera, y cada aparato la descarga entera al cambiar. No he medido cuánto ocupa hoy la de nadie (no miramos datos reales). Las cifras son estimaciones mías, no medidas.

Otras reglas de guardado:
- **Primero se guarda el cambio en el lote, después se toca el movimiento.** Si se corta la conexión entre medias, queda una copia de algo que no cambió: al deshacer se ve que ya está como `antes` y no se hace nada. Al revés (tocar primero) podría quedar un cambio sin copia.
- Un solo `saveConfig` por cambio, en cadena (como hoy `_cfgChain`), nunca escrituras en paralelo.

## 4. Deshacer importación, paso a paso

| Paso | Qué hace | Si no se cumple |
|---|---|---|
| 1 | Recorre `cambios` del último al primero | — |
| 2 | ¿El movimiento sigue existiendo en lo cargado (`S._movsRaw`)? | Se salta. **Nunca se vuelve a crear** (`doc().set` es «upsert»: si no existe, lo crearía) |
| 3 | ¿Sus `campos` siguen igual que `despues`? | Si están como `antes`: nada que hacer. Si son otros: se salta y se avisa |
| 4 | ¿Ahora está enlazado a un compartido, meta o inversión y antes no? | Se salta y se avisa |
| 5 | Guarda la fila actual con solo `campos` = `antes` (partiendo de la fila guardada, como `asigCuentaGuardar`) | Si falla: se para, el lote se queda con los cambios que faltan, se puede repetir |
| 6 | Quita del lote los cambios ya devueltos (`saveConfig`) | — |
| 7 | Solo si no queda ninguno pendiente por error: `deleteWhere('lote', id)` y quitar el lote | — |

Antes de confirmar, la ventana dice cuántos se devolverán y cuántos no: «Se borrarán 40 movimientos importados y 3 que ya tenías volverán a como estaban. 1 lo cambiaste después y se quedará como está.»

## 5. Recomendaciones

- **Recortar sin perder copias:** al pasar de 50, quitar primero los lotes más viejos **sin** cambios. Un lote con cambios solo sale de la lista si el usuario lo deshace o pulsa «Dar por bueno» (borra sus copias, no los movimientos). Si los 50 tienen cambios, se permite pasar de 50 y se avisa. Porque: perder la copia hace imposible deshacer.
- **Editado después:** no pisar nunca. Se compara solo con los campos cambiados; si el usuario cambió la categoría o la nota, eso no impide devolver la cuenta.
- **Metas y compartidos:** convertir en traspaso usa siempre `convertibleATraspaso` (ya excluye compartidos, metas, inversiones y fijos). Asignar cuenta sí se permite en todos: no toca el enlace ni `objetivo_aportes` (va por id del movimiento, que no cambia). `cfg().cuentaJuntos` no se toca.
- **Un movimiento, un cambio pendiente:** si un movimiento ya está en `cambios` de otro lote, no se le ofrece otro cambio hasta deshacer o dar por bueno aquel. Evita deshacer en cadena desordenado.
- **Deshacer el lote viejo antes que el nuevo:** si deshaces el de Santander (lote A) y un movimiento suyo se había convertido desde el de ING (lote B), el borrado de A se lo lleva (decisión del 31/10). Avisar: «1 traspaso que arregló la importación de ING se borrará también». Al deshacer B después, ese cambio se salta (paso 2).
- **Contador (riesgo 8 del §7):** en «Importaciones» enseñar aparte «y 3 cambios en lo que ya tenías», que hoy no se cuentan.
- **Copia semanal:** existe la copia cifrada de `.github/workflows/backup-semanal.yml`. Es el último recurso, no sustituye a este «Deshacer».
- **Cambio en `data-layer.js` recomendado (opcional):** un `update` de movimientos que solo cambie filas existentes (`.update().eq('id').eq('user_id')`), para que deshacer no pueda crear filas por error. Lo decide Desarrollo; no hace falta migración.

## 6. Riesgos (de más a menos grave)

| # | Riesgo | Cómo se evita |
|---|---|---|
| 1 | Deshacer **borra** un movimiento antiguo | No cambiar nunca su `lote` (§1.2). Prueba obligatoria |
| 2 | Deshacer **pisa** una edición posterior | Comparar con `despues` antes de devolver |
| 3 | Deshacer **resucita** algo borrado | Comprobar que existe; no usar upsert a ciegas |
| 4 | Copias perdidas al recortar a 50 | No recortar lotes con cambios |
| 5 | Romper un compartido o meta al convertir | `convertibleATraspaso`; no tocar enlaces |
| 6 | Configuración enorme y lenta | Solo campos cambiados; límites 200/500 |
| 7 | Mezclar datos de usuarios | Bajo: RLS por `user_id` y todo se guarda con el usuario actual. Nada nuevo aquí |
| 8 | Importe mal leído (riesgo 5 del §7) → falsos «es el mismo» | Solo céntimo exacto; nada marcado de antemano en la conversión |

## 7. Pruebas automáticas necesarias

Con datos inventados (nada real: el repositorio es público).

1. Importar ING con un gasto antiguo de Santander de 500 € → «Sí, convertir» → deshacer: el gasto vuelve **exactamente** igual (todos los campos), y su `lote` es el de antes.
2. Igual, pero sin pulsar «Sí»: nada cambia.
3. «Es el mismo» con uno sin cuenta → deshacer: vuelve a no tener cuenta; el movimiento no se borra.
4. Movimiento sin lote (apuntado a mano) cambiado por un lote → deshacer ese lote: sigue existiendo.
5. Editado después (otra cuenta o vuelto a gasto) → deshacer: se queda como el usuario lo dejó y sale el aviso. Editada solo la categoría → sí se devuelve la cuenta.
6. Borrado después → deshacer: no se vuelve a crear.
7. Gasto enlazado a compartido, meta, inversión o fijo: no se ofrece «convertir».
8. Fallo a mitad de deshacer (simular un error en el 2.º): el lote no se borra, quedan los cambios pendientes; repetir termina bien sin duplicar.
9. Recorte: 51 lotes, el más viejo con cambios → se conserva y sale el de sin cambios.
10. Lote A deshecho antes que B → al deshacer B se salta el que ya no existe.
11. Un movimiento con cambio pendiente no recibe un segundo cambio de otro lote.
12. Límite de 200 cambios por lote y 500 en total.
13. Con una sola cuenta, la tanda 5 no ofrece nada y todo sigue igual que hoy.
14. Tras convertir y deshacer: «Te queda este mes», saldos de cuentas y «Lo que tienes» iguales que antes de importar.

## 8. Preguntas para el dueño

1. **«84 filas ya estaban importadas, pero sin cuenta»: ¿salen ya marcadas o desmarcadas?** El §4 de `docs/30` dice «ya marcadas». Tú pides un cambio cada vez. Recomiendo **desmarcadas**, con «Marcar todas» y una confirmación que diga el número. *No bloquea: se puede programar lo demás.*
2. **¿Vale no vaciar subcategoría, forma de pago y artículos al convertir un gasto antiguo en traspaso?** Recomiendo que sí: así se deshace bien y no se guarda mucho. *Bloquea solo la conversión.*
3. **¿Vale «Dar por bueno» para quitar las copias de una importación ya revisada?** *No bloquea.*

## 9. Lo que no he podido confirmar

- No encontré en el repositorio un informe aparte del 31/10; he tomado los riesgos 4, 5 y 8 de la tabla del §7 de `docs/30-cuentas-fase2.md` (cambios en movimientos que ya existían, importe mal leído, cifra «Se han guardado N»).
- No sé cuánto ocupa hoy la configuración de cada usuario ni cuántos movimientos sin cuenta tienen: no se miran datos reales. Los tamaños son estimaciones.
- No he comprobado si un Traspaso con `subcategoria` o `articulos` se ve bien en todas las pantallas (lo debe mirar Calidad).
- Nada está programado ni probado: es un diseño.

## 10. Fuentes

- `docs/30-cuentas-fase2.md` (§3 B, §4, §5, §7 y decisiones del 31/10), consultado el 5/11/2026.
- `app.js` de `main` (5/11/2026): `deshacerLote`, `lotesHtml`, `impEjecutar` (recorte `.slice(-50)`), `saveTraspaso`, `convertibleATraspaso`, `asigCuentaGuardar`, `saveConfig`.
- `data-layer.js` (5/11/2026): `doc().set` hace upsert, `deleteWhere` solo por `lote`, `config` como una fila JSON que se reescribe entera.
- `supabase/migrations/README.md` (5/11/2026): columnas `cuenta_id`, `cuenta_destino_id`, `meta_id`, `compartido_id`.

Para el PDF: una línea de tiempo con «Importar ING → Sí, convertir → Editar → Deshacer», marcando en cada paso qué guarda el lote (antes/después) y el semáforo del paso 3 (igual = se devuelve, distinto = se respeta).

# 27 · Historial del grupo: propuesta de Producto y diseño (30/10/2026)

*Fase 5, «confianza en Juntos». Bocetos en `docs/img/27-*.png` (390 px, datos inventados, marcados «BOCETO»): son una **prueba dibujada aparte** encima de la app, no la app.*

| Archivo | Qué enseña |
|---|---|
| `27-grupo-oscuro.png` | Dónde se entra: «Historial · 2 nuevos» al lado de «¿De dónde sale?» |
| `27-historial-oscuro.png` / `-claro.png` | La lista por días, con filtro por persona y por tipo |
| `27-cambio-oscuro.png` | Al tocar un cambio: antes → ahora y lo que mueve tu saldo |
| `27-recuperado-oscuro.png` | Tras «Recuperar»: la fila cambia y sale «Deshacer» |
| `27-borrados-claro.png` | Filtro «Bea» + «Borrados» |
| `27-inicio-oscuro.png` / `-claro.png` | El aviso en Inicio («Estos días») |

## 1. Conclusión

1. **Un historial por grupo, con una frase por cambio:** «Ana cambió «Cena en Bairro Alto» · 30,00 € → 36,00 €», «Bea borró «Taxi aeropuerto» · Recuperar». A la derecha, lo que ese cambio hace a **tu saldo** (−1,50 €). Agrupado por días, con filtro por persona y por «Cambios / Borrados».
2. **Se entra desde el grupo** («Historial» junto a «¿De dónde sale?», con «2 nuevos»), no como 4.ª pestaña: «Gastos | Saldos | Planes» ya llena el ancho a 375 px. «Actividad · Ver todo» de Juntos abre el mismo historial con todos los grupos.
3. **Inicio solo avisa de lo que te toca:** cuando otra persona borra o cambia algo y eso mueve tu saldo. Lo nuevo apuntado ya se avisa hoy. Una sola fila; si hay más, «y 2 cambios más».
4. **Corrección importante:** `compartidos` **ya tiene borrado suave** (`borrado` = fecha; nunca se borra de verdad, y `editado_por` guarda quién hizo el último cambio, también el borrado). Lo que falta es (a) guardar **qué** cambió, en una tabla nueva de historial alimentada por el servidor, y (b) **permitir quitar la marca de borrado**, que hoy el disparador `validar_compartido` rechaza. (b) cambia una función que ya existe: no es 100 % aditivo, como ya se hizo en la agenda y en los temas.
5. **«Recuperar» de verdad (mismo gasto, mismo id) es mejor que volver a crearlo** como hace hoy `rehacerComp`: vuelve a enlazar solo el cargo de tu banco y la cuenta elegida, y no cambia quién lo apuntó. Recomendamos que el «Deshacer» de hoy pase también a usarlo.

## 2. Qué se ve

### 2.1 Cada fila

| Qué pasó | Frase (negrita) | Línea pequeña | Derecha |
|---|---|---|---|
| Apuntó | «Carlos apuntó «Entradas Oceanário»» | 76,00 € · tu parte 19,00 € · 19:30 | Efecto en tu saldo (−19,00 €) |
| Cambió el dinero | «Ana cambió «Cena en Bairro Alto»» | ~~30,00 €~~ → **36,00 €** · 10:14 | −1,50 € |
| Cambió otra cosa | «Bea cambió «Hotel Lisboa»» | Nombre: ~~Hotel~~ → **Hotel Lisboa** | «sin cambio» |
| Borró | «Bea borró «Taxi aeropuerto»» | 48,00 € · pagaste tú · 9:40 | Botón **Recuperar** |
| Recuperó | «Ana recuperó «Tranvía 28»» | Lo había borrado Carlos | Efecto |
| Pago | «Pagaste 20,00 € a Carlos» | Para saldar cuentas | +20,00 € |

- Cara de la persona con su color fijo (`colorPersona`) y una insignia pequeña con el icono de la app: `plus` (apuntó, verde), `edit` (cambió, azul), `trash` (borró, rojo), `history` (recuperó, morado), `swap` (pago). Sin emojis.
- Si un cambio toca varias cosas, la línea pequeña enseña la que más importa (importe → reparto → quién pagó → fecha → nombre) y «+2 cosas más».
- Días: «Hoy», «Ayer», «Miércoles, 28 de octubre». Horas con la del móvil.
- Pie: «Se guarda 6 meses» (decidido el 30/10).

### 2.2 Al tocar una fila (`27-cambio-oscuro.png`)

Hoja con «Antes → Ahora» solo de lo que cambió (importe, tu parte, parte de cada uno, quién pagó, fecha, nombre, categoría, tema) y una franja «A tu saldo en el grupo −1,50 €». Botones «Ver el gasto» y «Entendido». «Dejarlo como estaba» se deja para la tanda 3 (es un cambio más y puede pisar el de otro).

### 2.3 Recuperar (`27-recuperado-oscuro.png`)

- **Un toque, sin pregunta** (se puede volver a borrar): la fila pasa a «Recuperaste «Taxi aeropuerto»» con su efecto (+36,00 €) y sale el aviso «Has recuperado «Taxi aeropuerto»» con «Deshacer». Vibración `sentir('ok')`.
- Si el grupo está **cerrado**, o no tienes permiso («Solo quien lo apuntó o un administrador»), el botón no sale y la línea lo dice.
- Debajo de los borrados, una nota: «Recuperar devuelve el gasto tal cual estaba, para todo el grupo. Bea verá que lo has recuperado tú».

### 2.4 Filtros (`27-borrados-claro.png`)

Dos filas de chips de 40 px: **personas** (Todos, Ana, Bea, Carlos, Tú; se desliza) y **tipo** (Todo, Cambios, Borrados). Elegir uno es inmediato; no hay hoja de filtros.

## 3. Dónde vive y qué avisa

| Sitio | Qué cambia |
|---|---|
| Grupo | Enlace «Historial» al lado de «¿De dónde sale?», con «N nuevos» si hay cambios de otros desde tu última visita (`27-grupo-oscuro.png`) |
| Pestaña Juntos | «Actividad · Ver todo» abre el historial de todos tus grupos (con un chip más por grupo). Las 3 filas de «Actividad» pasan a incluir también cambios y borrados |
| Hoja de un gasto compartido | Una línea al pie: «Apuntado por Carlos · cambiado por Ana hoy · Ver cambios». **Se puede hacer ya sin tocar la base de datos**: `editadoPor` y `updatedAt` ya llegan |
| Inicio («Estos días») | «Bea borró «Taxi aeropuerto»» · «Lo pagaste tú · 48,00 € · y 1 cambio más» → abre el historial. Solo si lo hizo **otra persona**, es un **borrado o un cambio** y **mueve tu saldo**. Se marca visto al entrar en Juntos (`vistoJuntos`, fecha del servidor, como hoy) |

## 4. Cómo lo hacen otros (solo lo comprobado)

| | Splitwise | Settle Up | Tricount | PalomApp (propuesta) |
|---|---|---|---|---|
| Lista de cambios | Pantalla «Recent activity» con los cambios de la cuenta [S1] | «Historial de cambios del grupo» desde 2019 [U1] | No lo hemos encontrado en su ayuda ni en su ficha [T1][T2] | Por grupo y de todos los grupos |
| Recuperar lo borrado | Sí, desde «Recent activity» [S1]; su API tiene `undelete_expense` y guarda `deleted_by` [S2] | No comprobado | No encontrado; solo «Restore» de un tricount archivado [T2] | Sí, con permiso de edición y grupo abierto |
| Quién lo hizo | Sí (`deleted_by`) [S2] | No comprobado | No comprobado | Sí, en cada fila |
| Avisos | No comprobado | Aviso al momento cuando alguien añade un gasto o salda [U2] | No comprobado | Solo borrados y cambios que te tocan |
| Exportar el historial | No comprobado | De pago: «Export group history» a Excel [U2] | Por correo a soporte [T1] | No (ver `docs/marketing/05`, n.º 6) |

## 5. Borrador del modelo de datos — **para revisar por Datos y Seguridad**

*No se ha aplicado nada. Lo nuevo es aditivo salvo el punto 3, que reemplaza una función existente (con copia antes, como el 17/10).*

1. **Tabla nueva `compartidos_historial`** (una fila por cambio):
   `id` (número), `compartido_id` (uuid → `compartidos`), `grupo_id`, `accion` ('creado' | 'editado' | 'borrado' | 'recuperado'), `hecho_por` (= `auth.uid()`), `hecho_en` (hora del servidor), `antes` y `despues` (jsonb, **solo los campos que cambiaron**). Índice `(grupo_id, hecho_en desc)`.
   - Campos que se vigilan: fecha, tipo, categoria, subcategoria, descripcion, importe, pagado_por, reparto, objetivo_id, carpeta_id. De `articulos` solo se apunta «cambiaron», sin copiar la lista.
   - Si una edición no cambia ninguno de esos campos, no se escribe fila.
2. **Disparador `after insert or update` en `compartidos`** (security definer) que escribe esa fila. Nadie más puede escribir: RLS activo, **solo SELECT** para miembros activos del grupo (`es_miembro`), sin INSERT/UPDATE/DELETE para `authenticated`, `anon` sin permisos.
3. **Recuperar.** Cambiar en `validar_compartido` la línea que hoy rechaza tocar un gasto borrado por el mismo patrón de la agenda: si estaba borrado, solo se acepta quitar la marca y vuelve tal cual (`new := old; new.borrado := null`). Más una función `recuperar_compartido(id)` que comprueba: sesión, miembro activo, `puede_editar_compartido` (respeta «quién puede cambiar los gastos»), grupo abierto y que no pase del plazo (§6, pregunta 2).
4. **Lo ya borrado antes de la migración:** se sabe quién y cuándo (`editado_por` y `borrado`). Se puede rellenar el historial con una fila «borrado» por cada uno (solo inserta en la tabla nueva, no toca gastos). A decidir por Datos y Seguridad.
5. **Lectura en la app:** función `historial_grupo(grupo, antes_de, limite 50)` que devuelve filas con nombres ya resueltos (también personas sin cuenta y sitios ocupados), y un contador de «nuevos» desde `vistoJuntos`. Sin Realtime: el canal de `compartidos` ya avisa y la app vuelve a pedir.

## 6. Tandas

| Tanda | Qué | Base de datos | Esfuerzo |
|---|---|---|---|
| 0 | «Cambiado por Ana hoy» al pie del gasto; «Actividad» que diga «apuntó» o «cambió» según `editadoPor` | Nada | Bajo |
| 1 | Tabla de historial + disparador; pantalla Historial (solo ver), filtros, enlace en el grupo, «Ver todo» de Juntos | Migración aditiva (§5, 1-2 y 5) | Medio |
| 2 | Recuperar para todos; «Deshacer» pasa a recuperar de verdad; aviso en Inicio | Cambio en `validar_compartido` + `recuperar_compartido` | Medio |
| 3 | «Dejarlo como estaba» en un cambio; historial de metas/deudas compartidas, temas y entradas/salidas del grupo | Más disparadores | Medio-alto |

## 7. Riesgos

- **Recuperar mueve saldos que ya se dieron por saldados.** Si Bea borró el taxi y luego saldasteis, recuperarlo vuelve a abrir una deuda. La fila y la hoja deben decir la cifra antes del toque («Al recuperarlo, tu saldo +36,00 €»).
- **La copia personal de quien borró.** Hoy, al borrar un gasto que pagaste tú, la app borra también tu cargo del banco enlazado (`doDeleteComp`). Si otra persona lo recupera, ese cargo ya no existe y tu cuenta no lo refleja. Propuesta para Desarrollo: al borrar, desenlazar la copia en vez de borrarla, o avisar a quien pagó al recuperarse.
- **Una pelea de borrar y recuperar** entre dos personas. Se ve todo en el historial; si pasa, el administrador puede poner «Solo quien lo apuntó o un administrador».
- **Más datos de otras personas guardados más tiempo** (importes y nombres antiguos). Son datos que el grupo ya vio, pero hay que fijar el plazo.
- **Quien sale del grupo** sigue viendo sus gastos (regla de hoy) pero no vería el historial. Puede extrañar.
- **El cambio en `validar_compartido` no es aditivo:** si falla, se rompe guardar gastos compartidos para todos. Necesita copia, prueba en transacción que se deshace y revisión de Calidad.
- **Pruebas que comprueban textos de Juntos** («Actividad», aviso de Inicio) habrá que actualizarlas.

## 8. Preguntas para el dueño

1. ✅ **Decidido por el dueño (30/10):** sí, cualquiera que pueda cambiar gastos en ese grupo. **(Bloqueaba la tanda 2)** ¿Quién puede recuperar lo que borró otro? Recomendamos: **cualquiera que pueda cambiar gastos en ese grupo** (con «Solo quien lo apuntó o un administrador», solo ellos).
2. ✅ **Decidido (30/10): 6 meses** para el historial y para recuperar. **(Bloqueaba la tanda 1)** ¿Cuánto tiempo se guarda el historial y se puede recuperar? Recomendamos **un año para las dos cosas** (una sola cifra, fácil de explicar).
3. ✅ **Decidido (30/10): solo borrados y cambios** que hagan otros y que te toquen (lo nuevo apuntado ya se avisa hoy). ¿Inicio avisa solo de borrados y cambios que mueven tu saldo (recomendado), o de cualquier cambio en tus grupos?
4. ✅ Tanda 0 hecha por delegación (30/10). ¿Empezamos ya por la tanda 0 (no toca la base de datos) mientras Datos y Seguridad revisa el resto?

## 9. Lo que no hemos podido averiguar o confirmar

- **Nada probado en un móvil real.** Los bocetos son HTML encima de la app en Chromium a 390 px; no se ha medido a 375 px ni con texto grande.
- **No hemos visto la definición original de `compartidos` ni sus reglas de lectura** (bloque 8.2 se aplicó desde el conector y su SQL no está en el repositorio). No sabemos si la regla de lectura ya esconde los borrados o lo hace solo la app (`data-layer.js` filtra `borrado is null`). Datos y Seguridad debe mirarlo antes.
- No sabemos cuántos gastos se cambian o borran de verdad al mes (no miramos datos de usuarios), así que no damos cifras de tamaño.
- **Splitwise:** no pudimos abrir su artículo de ayuda actual sobre recuperar (kb.splitwise.com, sin permiso a tiempo) ni su ficha de App Store. Lo de la tabla sale de una respuesta oficial de 2014 en su foro y de su documentación de API; puede haber cambiado.
- **Tricount:** no pudimos abrir tricount.com/update. En su ayuda y su ficha no aparece historial ni recuperar gastos, pero eso no prueba que no exista.
- **Settle Up:** solo tenemos su anuncio de 2019 y su ficha de App Store; no sabemos si deja recuperar ni cuánto guarda.

## 10. Fuentes (consultadas el 30/10/2026)

- [S1] Splitwise, foro oficial, «Recycle Bin for deleted transactions», respuesta de soporte del 06/08/2014 (estado «Completed»): https://feedback.splitwise.com/forums/162446-general/suggestions/6263319-recycle-bin-for-deleted-transactions — *interés propio: es su web*.
- [S2] Splitwise, documentación de la API (`undelete_expense`, `deleted_at`, `deleted_by`): https://github.com/splitwise/api-docs/pull/32/files — *su repositorio*.
- [U1] Settle Up, «Completely redesigned Settle Up for iOS released» (01/05/2019): https://medium.com/step-up-labs/completely-redesigned-settle-up-for-ios-released-658fc47418e5 — *blog de la empresa*.
- [U2] Settle Up, ficha en App Store: https://apps.apple.com/app/id737534985 — *texto del fabricante*.
- [T1] Tricount, ficha en App Store (Portugal, en inglés): https://apps.apple.com/pt/app/tricount-split-settle-bills/id349866256?l=en-GB — *texto del fabricante*.
- [T2] Tricount, ayuda «How can I manage my tricounts and expenses?»: https://help.tricount.com/d/61447 y «How to delete an expense»: https://tricount.com/en/how-to-delete-expense-tricount — *su web*.
- Código de PalomApp (30/10/2026): `app.js` (`doDeleteComp`, `puedeDeshacerComp`, `rehacerComp`, `copiaComp`, `origenHtml`, `juntosActividadHtml`, `juntosNovedades`, `avisosInicioFilas`, `grupoHtmlV2`, `movsEfectivos`), `data-layer.js` (`tablaCompartida`), `supabase/migrations/2026-10-17_personas_sin_cuenta.sql` (`validar_compartido`, `puede_editar_compartido`), `2026-10-23_agenda_planes.sql` (patrón de «Deshacer» en el servidor) y `supabase/migrations/README.md`.
- Bases: `docs/04-juntos.md` (n.º 4, Actividad) y `docs/marketing/05-criticas-tricount-splitwise.md` (n.º 4, deshacer e historial).

Para el PDF: poner lado a lado `27-grupo-oscuro.png` → `27-historial-oscuro.png` → `27-recuperado-oscuro.png` como un recorrido de 3 pasos, y debajo un dibujo sencillo «gasto → disparador → historial» con un candado en «solo el servidor escribe».

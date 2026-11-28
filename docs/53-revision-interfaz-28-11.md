# 53 · Revisión de interfaz del 28/11 (propuesta)

Solo propuesta. No se ha tocado `app.js`, `look.css` ni ninguna rama. Salió de la revisión que hicieron el dueño y Paloma en el móvil, con anotaciones en capturas.
Reglas que se mantienen en todo el documento: la app habla en «yo», iconos de la app (`ic('nombre')`), nada de emojis, todo probado a 360 px, y **a primera vista solo lo imprescindible; lo demás va a la «i» (`infoI` / `infoSola`) o a un desplegable**.

## Conclusión

1. **Todo se resume en una idea: menos cosas a la vista y las mismas a un toque.** Nada se borra de la app; se esconde lo raro.
2. **El + queda con 4 botones grandes** (Gasto, Ingreso, Tarea, Importar), la foto de ticket y un desplegable «Apuntes rápidos» con lo demás. «Repetir» pasa dentro de ese desplegable.
3. **El formulario de gasto se queda en: importe, categoría con iconos, descripción (un solo campo), fecha y «Compartir» arriba.** Método de pago, cuenta, subcategoría y notas pasan a «Más detalles».
4. **Juntos en tres piezas** (resumen, amigos como historias, grupos con foto) y un **aviso de «lo nuevo» sin migración**, calculado con lo que la app ya guarda.
5. **El informe cambia de una lista de texto a una pantalla con cuatro números tocables, una carita y un consejo con reglas fijas.** Es lo más grande; va en 4 tandas.
6. **Editar Inicio** pasa de lista con flechas a tarjetas que se arrastran. Es lo más arriesgado en móvil; va al final y con la lista actual como respaldo.

---

## A · Botón + («¿Qué quieres apuntar?»)

**Problema.** Hoy `crearHtmlV2` enseña la banda de ticket, 4 grandes (Gasto, Ingreso, Compartido, Tarea), la barra «Repetir» y hasta 8 pequeños (Apartar, Invertir, Pago fijo, Pago de deuda, Traspaso, Importar, Trayecto…). En un móvil de 360 px son más de 14 cosas a la vista.

**Propuesta.**

```
 ______________________________
|  ——                          |
|  ¿Qué quieres apuntar?       |
|                              |
|  [ Foto de ticket       cam ]|   <- solo si hay lecturas
|                              |
|  [ v Gasto ]   [ ^ Ingreso ] |
|  [ ✓ Tarea ]   [ ↧ Importar ]|
|                              |
|  Apuntes rápidos          v  |   <- cerrado de primeras
|______________________________|

 Abierto:
|  Apuntes rápidos          ^  |
|  Lo de siempre               |
|   (Café 1,50) (Gasolina)     |   <- el antiguo «Repetir»
|  [ users Compartido ]        |
|  [ swap Traspaso ]           |
|  [ piggy2 Apartar ]          |
|  [ trendUp Invertir ]        |
|  [ repeat Pago fijo ]        |
|  [ deuda Pago de deuda ]     |
|  [ coche2 Trayecto ]         |
```

- Las 4 grandes en cuadrícula 2x2 (cada una de unos 150 x 72 px a 360 px: se tocan bien con el pulgar).
- «Apuntes rápidos» es una fila de ancho completo con chevron. Recuerda si lo abriste (`S.crearMas`, que ya existe para «Lo básico»: se reutiliza, así que **desaparece la diferencia entre «Lo básico» y «Todo» en esta hoja**).
- Dentro, las filas salen en dos columnas, con icono y nombre solo; la explicación («recibos, facturas y suscripciones») va a una «i» al final del desplegable, no en cada botón.
- Los que dependen de herramientas apagadas o de tener varias cuentas (Traspaso) siguen sin salir, como hoy.
- «Apuntes prefijados»: al principio del desplegable, «Lo de siempre» muestra los hasta 3 gastos que más repites. Es la misma lógica de `gastosHabituales()`; no hay nada que configurar.

**¿Se queda «Repetir»?** Mi recomendación: **sí, pero dentro del desplegable.** Razón: a quien apunta el café de cada mañana le ahorra el formulario entero, pero a quien no repite nada le estorba en la pantalla principal. Con la barra fuera de la vista de primeras, el que duda de ella no la ve y el que la usa la tiene a un toque. Si dentro de un mes (con el contador de la tanda A) casi nadie la toca, se quita. Alternativa descartada: ponerla dentro del formulario de gasto; allí ya hay que escribir importe, así que ahorra menos.

**Se quita de la vista inicial:** Compartido, Apartar, Invertir, Pago fijo, Pago de deuda, Traspaso, Trayecto, la barra Repetir, el botón «Más opciones» y «Descubre para qué sirve cada una» (este último pasa dentro del desplegable, como enlace con la «i»). «Ver la versión anterior» se queda solo para quien tenga el modo comparar.

**Riesgos.** Quien usa Traspaso o Apartar a diario ahora necesita 2 toques en vez de 1; se mitiga recordando el desplegable abierto. Las pruebas que tocan `crearIr` con la hoja cerrada necesitarán abrir antes el desplegable.

---

## B · Formularios de apunte (gasto, ingreso, traspaso, apartar, invertir, pago fijo, deuda)

**Problema.** `openMovForm` tiene Importe, Tipo, Categoría, Detalle (en realidad es la subcategoría: «Uñas, Golf, Mercadona»), Fecha, Descripción, Método de pago y la parte de compartir. «Detalle» y «Descripción» suenan igual y el usuario no sabe cuál rellenar.

**Regla común para todos los apuntes:** a la vista, solo lo que hace falta para guardar. Todo lo demás en «Más detalles» (que ya existe: `tecMasDetalles`).

```
 Gasto (teclado propio, versión corta)
 ______________________________
|  Gasto                    x  |
|  [ Compartir este gasto  > ] |   <- arriba, con icono users
|                              |
|           12,50 €            |
|  (🍴)(🛒)(🚌)(🏠)(🎬)(⋯)      |   <- solo iconos, 6 en una fila
|   Comida                     |   <- nombre de la elegida, debajo
|  ¿De qué?  ______________    |   <- UN solo campo
|  [ hoy v ]   [ cuenta ]      |
|  Más detalles v              |   <- método, notas, subcategoría…
|  [ 1 ][ 2 ][ 3 ][⌫]          |
```
(los iconos del boceto son orientativos: en la app van los de `ICONS`, sin emojis.)

**Cambios concretos**

1. **Un solo campo de texto.** Se llama «¿De qué?» (o «Descripción» si el dueño prefiere mantener la palabra). Al escribir, sugiere los «detalles» que ya usaste en esa categoría (Uñas, Golf…): si eliges uno, se guarda como subcategoría y como descripción; si escribes algo nuevo, solo descripción. **Sin migración**: las dos columnas siguen existiendo; el anillo por subcategorías sigue funcionando. Lo que ya está guardado no se toca.
2. **Método de pago: fuera de la vista.** Pasa a «Más detalles». Hoy solo lo usa la búsqueda; se mantiene el dato y la lista de `cfg().metodosPago`, solo se esconde. Alternativa más radical (quitarlo): descartada porque hay gente con datos ya apuntados y la importación lo rellena.
3. **Categorías con iconos.** La fila de `tecCats` ya tiene icono y nombre; pasa a **solo icono** (cabe más en 360 px y se toca igual de bien a 44 px), con el **nombre de la elegida** debajo (para que nadie tenga que adivinar) y un «Ver todas» que abre la lista con nombres. Accesibilidad: cada botón conserva su `aria-label`. Riesgo: dos iconos parecidos; se resuelve con el nombre debajo y con pulsación larga/«Ver todas».
4. **«Compartir este gasto» arriba.** En `#compArriba` ya existe para un gasto apuntado; se sube también para el gasto nuevo, como fila de ancho completo con icono `users` bajo el título. Al tocarla se despliega la parte compartida en el sitio (no se baja al final).
5. **Parte compartida más visual** (mejora, no urgente): «Con» como círculos de caritas (`caraHtml`) con el seleccionado marcado; «Pagó» como las mismas caritas, una sola elegible; «Cómo se reparte» como 3 fichas con icono (A partes iguales, Cada uno lo suyo, Porcentajes) en vez de selector. Los números exactos se ven al tocar «Ajustar».
6. **Resto de apuntes:** la misma regla. Traspaso: importe, de dónde, a dónde, fecha. Apartar: importe, meta, fecha. Invertir: importe, activo. Pago fijo: nombre, importe, cada cuándo. Deuda: importe, deuda. Todo lo demás a «Más detalles». Cada uno se revisa por separado, tanda por tanda.

**Se quita de la vista:** el campo «Detalle», la etiqueta «Método de pago», las ayudas de texto en gris junto a las etiquetas (a la «i»).

**Riesgos.** El anillo y los filtros dependen de `subcategoria`: no hay que perderla al fusionar (prueba específica). El teclado propio y el formulario largo (editar) comparten código: no romper el de editar, que sigue con el teclado cerrado.

---

## C · Juntos: resumen, amigos como historias, grupos con foto, y avisos de lo nuevo

**Cómo se ve (de arriba abajo, 360 px).**

```
 ______________________________
| Juntos                       |
| ┌──────────────────────────┐ |
| │ Te deben   86,40 €       │ |  <- 1/3 resumen
| │ Debes      12,00 €       │ |
| │ [ + Compartir un gasto ] │ |
| └──────────────────────────┘ |
| Amigos                    +  |  <- 2/3
|  (A)  (B)  (C)  (D)  (E)  >  |  <- círculos con aro
|  Ana  Beto Cris Dani Eva     |  <- nombre debajo, 1 palabra
| Grupos                    +  |  <- 3/3
| ┌──────────┐ ┌──────────┐    |
| │  foto    │ │  foto    │    |
| │ ● Casa   │ │ Viaje    │    |  <- ● = lo nuevo
| │ (A)(B)(C)│ │ (A)(D)   │    |
| │ Te deben │ │ Debes    │    |
| │ 30,00 €  │ │ 12,00 €  │    |
| └──────────┘ └──────────┘    |
| Lo último   (se queda, 3 filas)
```

- **1/3.** Es la tarjeta de hoy (`jv5-cab`), con «Te deben» y «Debes» en dos líneas y el botón «Compartir un gasto». Casi no cambia: solo se separa en dos filas legibles y se quita el «·».
- **2/3 Amigos.** Fila que se desliza hacia un lado con los círculos de `juntosPersonasVerHtml` (que ya existe como pantalla «Por persona»; esa pantalla pasa a ser «Ver todos»). Tamaño 56 px, nombre debajo, y bajo el nombre la cifra pequeña con su color. El primero es «+ Invitar».
- **3/3 Grupos.** Cuadrícula de 2 columnas (unos 160 px de ancho cada una a 360 px). Cada tarjeta: foto (`grupos.foto`; sin foto, un color de fondo con la inicial, como ahora), nombre, hasta 3 caritas + «+N», y «tu saldo» con el color de siempre. Con 1 solo grupo la tarjeta ocupa el ancho entero.
- Se quitan «Por persona» y «Metas y deudas juntos» como enlaces de la lista de abajo: las metas pasan a ser un cuarto bloque «Metas y deudas» solo si las hay.

### Avisos de «lo nuevo»: tres opciones

**Opción 1 · Punto junto al nombre.** Un punto de acento (`jv-punto`, que ya existe en «Lo último») junto al nombre del grupo y bajo el círculo del amigo. Sencillo, sobrio; poco vistoso.
```
 (A)       Casa ●
  ●
```

**Opción 2 · Aro de historias para amigos + borde y etiqueta para grupos (recomendada).** El círculo del amigo con novedades lleva un aro de 2 px en el color de acento (el mismo de persona, `colorPersona`); sin novedades, sin aro. En la tarjeta del grupo, un borde de acento y una pastilla pequeña «2 nuevas» sobre la foto. Al abrir, el aro se apaga.
```
  ((A))   (B)         ┌──────────┐
   Ana    Beto        │foto [2]  │  <- pastilla «2 nuevas»
                      │ Casa     │  <- borde de acento
```
Ventaja: es el lenguaje que la gente ya conoce (historias), y lo nuevo se ve sin leer. Alternativa más contenida si el aro parece mucho: aro solo con novedad de un amigo y solo punto en grupos.

**Opción 3 · Franja «Hay novedades» arriba.** Una tarjeta con las caritas de quien ha movido algo («Ana y Beto han apuntado cosas») y al tocar lleva al primero. Mucho texto y compite con el resumen; descartada salvo como complemento del Inicio, donde ya existe `avisosInicioFilas`.

**De dónde sale «lo nuevo» (sin migración).** Se usa lo que la app ya tiene:

| Qué | Fuente | Se considera nuevo si… |
|---|---|---|
| Gasto o pago nuevo o cambiado | `S.compartidos` (`createdAt`, `updatedAt`) | es de otra persona y posterior al visto de ese grupo |
| Borrado, editado, recuperado | `histAvisos()` (filas con `f.en` y `f.por`) | `f.en` > `cfg().historialVisto[gid]` |
| Encargo nuevo en una tarea compartida | `encargosNuevos()` | `createdAt` > `cfg().agendaVisto` |

Hoy el «visto» de gastos es **uno solo para todo Juntos** (`cfg().vistoJuntos`). Para avisar por grupo y por amigo hace falta **un visto por grupo**: se guarda dentro de la misma configuración privada del usuario (`cfg().juntosVisto = { gid: fecha }`, igual que ya hace `historialVisto`). Esto **no es una migración de Supabase**; es un campo más en la configuración JSON. Al estrenarlo, para no llenar todo de puntos, se arranca con `juntosVisto[gid] = vistoJuntos` actual (lo ya visto sigue visto).

- **Grupo con novedad** = hay algún gasto, pago o historial de otra persona posterior a su `juntosVisto[gid]`.
- **Amigo con novedad** = algún gasto o pago de esa persona (en cualquier grupo, usando `aliasDe`) posterior al visto de ese grupo.
- **Cuándo se apaga:** al abrir el grupo se pone `juntosVisto[gid] = ahora` (con el mismo cuidado que `marcarJuntosVisto`: no al pintar, sino al abrir). Al abrir la hoja de una persona se apaga su aro y se marca visto solo en los grupos donde ella tenía novedad.
- **No depende de la versión de la base de datos:** si falta el historial (`historialOn()` falso), solo cuentan los gastos de `S.compartidos`.
- Lo tuyo nunca avisa (`esMio`).
- Accesibilidad: el aro y el punto llevan texto oculto «Novedades» (`sr-only`), no se confía solo en el color.

**Riesgos.** Dos dispositivos del mismo usuario: el visto va en la configuración, así que se sincroniza (puede apagarse un aviso en el otro móvil: es lo esperado). Muchos grupos: la cuadrícula a dos columnas con «Ver todos» a partir de 6.

---

## D · Informe (Informes, `infDatos`, `infHtml`, `balanceMesHtml`)

**Problema.** Hoy el informe es: una frase, una lista de cifras con «subió / bajó», «Lo que cambió», «Tus metas y deudas» y un pie. Todo en texto, con el mismo peso.

**Cómo se ve.**

```
 ______________________________
| < noviembre 2026 >           |
|       ( : ) )  Buen mes      |  <- carita + etiqueta
| «Te sobraron 214 €. Lo que   |
|  pesó: Restaurantes.»        |  <- consejo corto
| ┌─────────┐ ┌─────────┐      |
| │ Entró   │ │Gastaste │      |  <- 4 tarjetas tocables
| │ 2.100 € │ │ 1.540 € │      |
| └─────────┘ └─────────┘      |
| ┌─────────┐ ┌─────────┐      |
| │Apartaste│ │ Balance │      |
| │ 346 €   │ │ +214 €  │      |
| └─────────┘ └─────────┘      |
| Frente a tu media  [i]       |
|  Gastaste  ▓▓▓▓▓▓▓░░  +8 %   |
| Qué tener en cuenta          |
|  · …  · …                    |
| [ Ver los movimientos ]      |
```

1. **Arriba:** carita + etiqueta + una frase de asesor (2 líneas máximo). Sin cabecera «En una frase».
2. **Cuatro tarjetas tocables:** Entró, Gastaste, Apartaste e invertiste, Balance. Cada una abre una hoja visual:
   - **Entró:** barras apiladas por fuente (nómina, otros) y el mes frente a la media.
   - **Gastaste:** anillo por categoría (reutiliza el de Movimientos, máx. 6 colores) y las 3 que más subieron.
   - **Apartaste e invertiste:** una barra por meta/inversión con lo aportado y un «% de lo que entró».
   - **Balance:** cascada simple: Entró − Gastaste − Apartaste = Balance, y los últimos 6 meses en barritas con el actual resaltado.
   Cada hoja trae un enlace «Ver los movimientos» filtrado.
3. **Comparación con el presupuesto:** si el usuario tiene presupuesto por categorías (`catsGasto()` con `presupuesto`), se compara contra él («Gastaste 1.540 de 1.700 previstos»). Si no, contra **la media de los periodos anteriores completos del mismo tipo**: mes → media de los últimos 3 meses cerrados; semana → últimas 4 semanas; trimestre → los 2 anteriores; año → el año anterior. Sale siempre rotulada («tu media de los 3 últimos meses»), con la «i» explicando cómo se calcula. Con menos de 2 periodos anteriores: no se compara y se dice («aún no tengo meses para comparar»).
4. **Frase de asesor, sin IA.** Reglas en orden de prioridad (sale la primera que se cumple como «qué fue mal» y hasta 2 más en «Qué tener en cuenta»):

   | Regla | Qué dice |
   |---|---|
   | Balance < 0 | «Gastaste X más de lo que entró.» + categoría que más pesó |
   | Una categoría supera su presupuesto | «Te pasaste X en Restaurantes.» |
   | Una categoría sube más de 30 % y más de 30 € frente a la comparación | «Restaurantes subió X.» |
   | Ahorro < 5 % de lo que entró | «Apartaste poco este mes.» |
   | Gasto de pagos fijos > 50 % de lo que entró | «Tus pagos fijos se llevan la mitad.» |
   | Un solo día concentra > 25 % del gasto | «El día 14 fue un gasto grande.» |
   | Todo bien | «Mes tranquilo: sin sustos.» |

   «Para el siguiente periodo» (determinista): lo previsto con la nómina y fijos (`previstoMes`, siempre rotulado «previsión»), los cobros y pagos fijos que vienen, y la categoría que pidió más atención («Vigila Restaurantes: pon un tope de X, que es tu media»). Frases cortas, en «yo» («Te aviso si…» solo cuando de verdad existe el aviso).
5. **Carita, regla simple y explicable (5 niveles).** Se calcula con la **tasa de ahorro** (balance + apartado e invertido, entre lo que entró) y se ajusta por presupuesto:

   | Nivel | Carita | Cuándo |
   |---|---|---|
   | 1 | muy triste | Balance negativo y mayor que el 10 % de lo que entró |
   | 2 | triste | Balance negativo |
   | 3 | normal | Balance entre 0 y 10 % de lo que entró |
   | 4 | contenta | Balance entre 10 y 25 %, o ≥ 25 % pero pasado de presupuesto |
   | 5 | muy contenta | Balance ≥ 25 % y sin pasarte de presupuesto |

   Con «i» que dice exactamente esto en dos líneas. Si no hay ingresos apuntados, **no hay carita** (no se puede valorar) y se dice. Las caritas son dibujos SVG de la app (no emojis), de un solo trazo, en colores del tema (`--expense`, `--warn`, acento), nunca solo color (la boca cambia).
6. **Se quita / se esconde:** la sección «Las cifras» como lista, «Lo que cambió» como lista de iconos (pasa a las hojas), el pie largo (a la «i»), las etiquetas «En una frase».

**Riesgos.** La carita juzga: hay que evitar tono de reproche («el mes cerró justo», no «mal mes»). Con pocos datos (mes empezado, primer mes) las reglas pueden salir raras: nada de carita si el periodo no está cerrado o tiene menos de 10 apuntes (en curso, se dice «va bien/va justo» en texto).

---

## E · Editar Inicio, como los widgets del teléfono

**Hoy:** una lista con asa (`grip`), flechas subir/bajar y una X, y «Añadir» abre un catálogo con vista previa (`iwCatHtml`).

**Propuesta.**

```
 Modo editar (mantén pulsada una pieza para entrar)
 ______________________________
| [ tarjeta del mes (fija) ]   |
| ┌───────────────┐ (−)        |
| │ En qué gastas │            |  <- se mueve al arrastrar,
| └───────────────┘            |     las demás se apartan
| ┌───────────────┐ (−)        |
| │ Tus metas     │            |
| └───────────────┘            |
| [ + Añadir una pieza ]       |  <- abre el catálogo actual
|           [ Listo ]          |
```

- **Entrar:** mantener pulsada (500 ms, con vibración corta `sentir`) cualquier pieza de Inicio entra en «modo editar»: las piezas tiemblan suavemente, aparece el (−) para quitar y el hueco «+ Añadir una pieza» al final. «Editar Inicio» sigue existiendo en el menú como segunda vía y como **respaldo** (la lista de hoy).
- **Mover:** se arrastra la pieza (Pointer Events: `pointerdown` largo + `pointermove`), las demás se apartan con una animación corta; al soltar se guarda con `iwGuardar` (hoy ya guarda por `saveConfig`).
- **Añadir:** el catálogo con vista previa (`iwCat`) se queda tal cual: ya es visual. Se mejora solo el acceso: «+ Añadir» al final del modo editar.
- **Accesible:** con lector de pantalla y para quien no pueda arrastrar, cada pieza en modo editar lleva botones «Subir/Bajar» (los de hoy), así que no se pierde nada.
- **Se quita:** la hoja «Editar Inicio» como pantalla principal de edición (sigue como alternativa).

**Riesgos.** Es lo más delicado: arrastrar en un móvil choca con el desplazamiento de la pantalla y con el gesto de atrás de Android; hay que bloquear el scroll solo durante el arrastre (`touch-action: none` en el asa, no en toda la pieza) y probarlo en móvil real (no se puede probar del todo en jsdom: las pruebas «tocando» con Chromium de `tests/capturas/` ayudan, pero no sustituyen). Por eso va última y detrás del botón actual.

---

## Qué se quita, en una línea por bloque

- **A:** 8 botones pequeños, la barra Repetir y «Más opciones» de la vista inicial.
- **B:** el campo «Detalle», «Método de pago» y las ayudas largas del formulario.
- **C:** los enlaces «Por persona» y «Metas» como filas; la pantalla «Por persona» pasa a ser «Ver todos».
- **D:** la lista de cifras y «Lo que cambió» como bloques de texto.
- **E:** nada se pierde; la lista pasa a ser el respaldo.

## Orden de tandas (cada una pequeña y publicable sola)

| Tanda | Qué | Tamaño | Depende de |
|---|---|---|---|
| 1 | A: + con 4 botones y desplegable «Apuntes rápidos» (Repetir dentro) | pequeña | nada |
| 2 | B1: un solo campo de texto, método de pago a «Más detalles», «Compartir» arriba | media | 1 |
| 3 | B2: categorías solo con iconos y «Ver todas» | pequeña | 2 |
| 4 | C1: Juntos con resumen + Grupos en tarjetas con foto (sin avisos) | media | nada |
| 5 | C2: Amigos como círculos desplazables | pequeña | 4 |
| 6 | C3: avisos de lo nuevo (`juntosVisto`, aro y punto) | media | 4 y 5 |
| 7 | D1: carita + frase de asesor + 4 tarjetas (sin hojas) | media | nada |
| 8 | D2: hojas visuales de Entró / Gastaste / Apartaste / Balance | grande | 7 |
| 9 | D3: comparación con presupuesto o media | media | 7 |
| 10 | B3: el resto de apuntes (traspaso, apartar, invertir, pago fijo, deuda) y la parte compartida visual | media | 2 |
| 11 | E: modo editar con arrastre | grande, la más arriesgada | nada |

Cada tanda lleva su prueba, captura a 360 y 375 px en claro y oscuro (`tests/capturas/revisar.js`) y deja la versión anterior en «Antes» (`VERSIONES`) cuando cambie algo grande (+, Juntos, informe).

## Decisiones para el dueño (máx. 4)

1. **«Repetir» dentro del desplegable «Apuntes rápidos».** Recomiendo sí (se queda a un toque pero no estorba). Alternativa: quitarlo del todo.
2. **Un solo campo de texto en el gasto.** Recomiendo «¿De qué?» con sugerencias de lo que ya usaste, guardando la subcategoría solo si coincide con una conocida. Alternativa: llamarlo «Descripción» y perder las sugerencias.
3. **Avisos de lo nuevo en Juntos: opción 2 (aro de historias en amigos y borde con «2 nuevas» en grupos).** Si te parece demasiado vistoso, la opción 1 (solo punto).
4. **Carita del informe con 5 niveles basados en cuánto te sobra de lo que entró.** Recomiendo sí, con la regla de la tabla. Pregunta: ¿quieres que el mes que acaba de cerrar muestre la carita también en Inicio (un aviso ya existe) o solo dentro del informe? Recomiendo solo dentro del informe al principio.

## Lo que no he podido comprobar

- No he abierto la app en un móvil real ni visto las capturas del dueño: las medidas (150 x 72 px, 56 px, etc.) son cálculos para 360 px, no pruebas.
- No he verificado cuánta gente usa «Repetir» ni «Método de pago»: no hay datos de uso en este documento.
- «Detalle» es la subcategoría (`app.js`, línea 1925); falta confirmar con una búsqueda por todo el código que ninguna pantalla más dependa de que esté en la vista principal.
- No he comprobado si el formulario de editar un gasto ya existente debe seguir con todos los campos visibles (propongo que sí, con «Más detalles» desplegado si tienen datos).

## Resumen corto

- A: el + queda con Gasto, Ingreso, Tarea, Importar y la foto; lo demás en «Apuntes rápidos» (cerrado).
- A: «Repetir» pasa a ese desplegable, sin borrarlo.
- B: un solo campo «¿De qué?»; método de pago a «Más detalles».
- B: categorías con solo iconos y el nombre de la elegida debajo.
- B: «Compartir este gasto» sube al principio.
- C: Juntos con resumen, amigos como historias y grupos con foto en dos columnas.
- C: avisos de lo nuevo con aro (amigos) y borde con «N nuevas» (grupos), sin migración (`juntosVisto` dentro de la configuración).
- D: informe con carita de 5 niveles, consejo con reglas fijas, 4 tarjetas tocables con hojas visuales y comparación con presupuesto o media.
- E: modo editar con mantener y arrastrar; la lista actual queda de respaldo.
- Son 11 tandas pequeñas; la más arriesgada (E) va la última.
- Decisiones: Repetir dentro o fuera; campo único; opción de avisos; alcance de la carita.

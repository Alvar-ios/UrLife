# Teclado propio para apuntar importes («importe protagonista»): propuesta de Producto y diseño (22/10/2026)

*Idea C2 de `docs/11-auditoria-interfaz.md`. Una sola propuesta recomendada, lista para programar. Sin Supabase y sin campos nuevos. Leído en el código (`openMovForm`, `saveMov`, `numCampo`, `importeCampo`, `compRapidoHtml`, `aportarRHtml`, `openTraspasoForm`, `sentir`, `VERSIONES`) y medido con una maqueta en un navegador a 375 × 667 px. No probado en un móvil real.*

Imágenes en `docs/img/` (375 × 667 px, datos inventados). `teclado-antes.png` es una captura real de la app; los bocetos son una **prueba dibujada aparte**, no la app:
- `teclado-antes.png`: «Nuevo gasto» hoy (sin el teclado del móvil, que taparía la mitad de abajo).
- `teclado-boceto-claro.png`: la propuesta, en claro, con «12,50 €» y «Comida» elegida.
- `teclado-boceto-devolucion.png`: la propuesta, en oscuro, con una devolución de «−24,99 €».

## 1. Conclusión

1. **Al crear un gasto o un ingreso, la cifra manda.** Arriba, la cifra grande y centrada. Debajo, 7 categorías y «Más» en dos filas, y una línea con «Hoy», la cuenta y «Más detalles». Abajo del todo, un teclado de la app. Para apuntar «12,50 en Comida»: escribes la cifra, tocas «Comida» y tocas «Guardar». Todo cabe en un móvil de 375 × 667 px sin mover la pantalla (en la maqueta, la hoja mide 568 px de los 600 que tiene).
2. **Resuelve los tres problemas reales.** El signo: hay una tecla «− Devolución». El teclado del móvil ya no tapa el formulario, porque solo sale cuando escribes una nota. Y la coma: la tecla es siempre «,», y en el ordenador el punto también cuenta como coma.
3. **Primero, solo donde más se usa.** Fase 1: el formulario de movimientos (crear y editar). Fase 2, tras una semana de uso: compartir un gasto, aportar a una meta y traspaso. El resto de campos de importe siguen con el teclado del móvil.
4. **Lo de dentro no cambia.** El campo `#fImporte` sigue existiendo (oculto) y `saveMov` lo lee igual con `numCampo`. La versión de hoy queda en «Antes» (`VERSIONES.importe`).
5. **Se queda sin probar** cómo responde un iPhone a toques muy rápidos (puede hacer zoom), la vibración en cada tecla y el uso con VoiceOver o TalkBack. Hay que probarlo en un iPhone y en un Android reales antes de publicar.

## 2. Dónde aparece

| Pantalla | ¿Teclado de la app? | Al abrir | Tecla grande | Tecla «−» | Fase |
|---|---|---|---|---|---|
| Nuevo gasto o ingreso (desde +, «Repetir» y + de Movimientos) | Sí, **versión corta** | Teclado abierto | **Guardar** (guarda) | Sí | 1 |
| Gasto fijo, Apartar, Invertir, Pago de deuda (nuevo) | Sí, formulario completo de hoy | Teclado abierto | **Hecho** (cierra el teclado) | Sí | 1 |
| Editar cualquier movimiento | Sí, formulario completo | Teclado **cerrado**: se abre al tocar la cifra | **Hecho** | Sí | 1 |
| Compartir un gasto (`compRapidoHtml`) | Sí | Abierto | Hecho | No | 2 |
| Aportar a una meta (`aportarRHtml`) | Sí (las fichas 50 / 100 / 200 siguen) | Abierto | Aportar | No | 2 |
| Traspaso entre cuentas | Sí | Abierto | Hecho | No | 2 |
| Saldos de cuentas, cuadrar con el banco, metas, deudas, presupuestos, fijos de la agenda, tickets, participaciones, bienvenida | **No**: teclado del móvil, como hoy | — | — | — | — |

Los campos de la última fila son poco frecuentes y algunos admiten números que no son dinero. Recomendación aparte: que todos sean de texto con coma y se lean con `numCampo` (lo que la auditoría llama B6), para que la coma funcione igual en toda la app.

## 3. Cómo se ve (versión corta: nuevo gasto o ingreso)

| Zona, de arriba abajo | Alto en 375 × 667 (px) | Contenido y comportamiento |
|---|---|---|
| Cabecera | 36 | «Nuevo gasto» / «Nuevo ingreso». Si `compararOn()`, ficha pequeña `swap` «Antes» junto a la X |
| Cifra | 64 + 18 | Cifra en `--font-display`, peso `--num-peso`, **52 px** (44 px con 8 o más caracteres, 36 px con 11 o más), cifras de ancho fijo, «€» a 28 px en gris y una rayita de cursor en acento. Vacía: «0» en gris y debajo «Escribe cuánto ha sido». En negativo: cifra en `--income` y debajo «Devolución · te devuelven este dinero» |
| Categorías | 2 × 52 | Rejilla de 4 × 2: las 7 más usadas (`catsPorUso()`) con su icono y su color (`iconoCat`, `colorCat`) y «Más» (`more`). Nombre a 11 px, cortado con «…» si no cabe. Elegida: «elegido suave» de la app (fondo `--accent-soft` y borde de 2 px en acento). «Más» abre «Más detalles» con todas las categorías. En ingresos, las de `categoriasPorTipo('Ingreso')`, sin icono si no lo tienen. **Por debajo de 600 px de alto de pantalla, una sola fila (3 + «Más»)** |
| Línea de detalles | 36 | Fichas: `calendar` «Hoy» (abre el selector de fecha, como `apFechaVer` en Aportar; cambia a «Ayer» o «20 oct»), la cuenta con su punto de color (solo con 2 o más cuentas; cada toque pasa a la siguiente, `sentir('tic')`) y a la derecha «Más detalles» `chevD` en acento |
| Teclado | ~250 | Ver la tabla siguiente. Fondo `--paper-sunken`, esquinas de arriba redondeadas (20 px), pegado abajo con el margen seguro del iPhone (`env(safe-area-inset-bottom)`) |

**Teclas** (4 columnas: 3 iguales para los números y una algo más ancha para las acciones; separación de 7 px; en 375 px cada tecla mide unos 80 × 52 px):

| | Columna 1 | Columna 2 | Columna 3 | Columna 4 |
|---|---|---|---|---|
| Fila 1 | 1 | 2 | 3 | **Borrar**: icono nuevo `borrar` (flecha con aspa) y «Borrar» en pequeño. Mantener pulsado medio segundo borra todo |
| Fila 2 | 4 | 5 | 6 | **Guardar**: ocupa las filas 2, 3 y 4. Fondo en acento, `check` y «Guardar». Con «Hecho» o «Aportar» cambia solo el texto |
| Fila 3 | 7 | 8 | 9 | (sigue Guardar) |
| Fila 4 | **−** y «Devolución» en pequeño (en los demás tipos, «En negativo»). Activa: fondo verde suave y borde verde | 0 | **,** (grande) | (sigue Guardar) |

- **Altura de las teclas:** 52 px en pantallas de menos de 720 px de alto y 56 px en las demás. Nunca menos de 48 px. La tecla Guardar queda bajo el pulgar derecho; la de devolución, que se usa poco, en la esquina más lejana.
- **Dónde no se permite el negativo** (traspaso, aportar, compartir), la casilla de la tecla «−» queda vacía.
- **Estilo:** números en blanco (`--paper-raised`) y 24 px seminegrita; Borrar y «−» con contorno y sin relleno; Guardar en acento. En oscuro, las teclas son algo más claras que el fondo del teclado. Ni naranja ni terracota.
- **Lo juguetón (sin pasarse):** al pulsar, la tecla se encoge un poco (al 93 %) y se tiñe de `--accent-soft`; cada cifra nueva entra subiendo 6 px. Al guardar, la hoja se cierra y el movimiento se ilumina en la lista, como ya pasa con `S._aterriza`. Con «reducir movimiento» no hay animaciones.
- **Guardar sin terminar:** si falta la cifra, la cifra tiembla y sale el aviso «Pon un importe». Si falta la categoría, tiemblan las categorías y sale «Elige una categoría». La tecla se ve apagada (al 45 %), pero sigue funcionando para poder explicar qué falta.

## 4. Cómo convive con el resto del formulario

- **«Más detalles»** (o «Más» en las categorías) despliega, en la misma hoja, el formulario de hoy: Tipo, «Del día a día | Fijo», todas las categorías, Detalle, Fecha, Cuenta, Descripción, Método de pago, Artículos y Compartir. El teclado se cierra y abajo vuelven «Cancelar | Guardar». La cifra grande sigue arriba: si la tocas, el teclado vuelve a subir con la tecla «Hecho».
- **Al tocar un campo de texto** (Descripción, «…o escribe otra»), se cierra el teclado de la app y sale el del móvil, como siempre. Los dos teclados nunca se ven a la vez.
- **«Repetir» y editar:** la cifra sale ya escrita y resaltada (fondo `--accent-soft`). La primera tecla de número la sustituye entera (igual que hoy hace `el.select()`) y «Borrar» quita solo la última cifra. En «Repetir» la categoría ya viene elegida: escribir la cifra y «Guardar».
- **Foto de ticket:** cuando la lectura rellena el importe, se escribe en la cifra. No cambia nada más.
- **Compartir:** si en «Más detalles» se activa Compartir, el reparto se recalcula como hoy (`onImporteInput`).

## 5. Reglas al escribir

| Lo que haces | Lo que pasa |
|---|---|
| Tocas «,» sin haber escrito nada | Se escribe «0,» |
| Un tercer decimal, o una segunda coma | No se escribe; la cifra tiembla un poco y `sentir('tic')` |
| «0» y luego «5» | Queda «5» (sin ceros delante) |
| Más de 7 cifras antes de la coma | No se escribe (el máximo es 9.999.999,99) |
| Más de 3 cifras | En la pantalla se ve con puntos de miles («1.234,5»), pero se guarda sin puntos («1234,5») |
| Tocas «−» | Cambia el signo. La cifra se pinta en verde (devolución de un gasto) o en `--expense` (ingreso en negativo) |

## 6. Accesibilidad, sensaciones, teclado físico y pegar

| Tema | Propuesta |
|---|---|
| Lector de pantalla | El teclado es un `role="group"` con `aria-label="Teclado de importe"`. La cifra es `role="status"` con `aria-live="polite"` y dice «12,50 euros» (o «menos 24,99 euros, devolución»). Las teclas son `<button>` y las de icono llevan `aria-label`: «Borrar, mantén pulsado para borrar todo», «Devolución: cambiar a negativo» (con `aria-pressed`), «Guardar». La tecla apagada usa `aria-disabled`, no `disabled`, para que se pueda alcanzar |
| Tamaño | Teclas de 52 a 56 px de alto y unos 80 px de ancho (mínimo de la app: 48 px; mínimo de las normas de accesibilidad WCAG 2.2: 24 px). Categorías de 52 px de alto, fichas de 36 px con zona táctil de 44 px |
| Doble toque | Teclas con `touch-action: manipulation`, para que dos toques rápidos en «1» no hagan zoom en el iPhone. El gesto de arrastrar la hoja (`activarArrastreSheet`) no debe empezar sobre el teclado |
| Vibración y sonido | Cada tecla: `sentir('tic')` (vibración muy corta y sin sonido). Borrar todo: `sentir('borrar')`. Algo que falta o no se puede escribir: `sentir('aviso')`. Guardado: `sentir('ok')`. Nada nuevo en `SENS` |
| Ordenador (teclado físico) | Con la hoja abierta y sin el foco en un campo de texto: las cifras del 0 al 9, «,» o «.» (los dos son coma), «−» (signo), Borrar (quita la última) y Enter (la tecla grande: Guardar o Hecho). Escape cierra la hoja, como hoy. Se ve el mismo teclado en pantalla, que también se puede usar con el ratón |
| Pegar | En el ordenador, Ctrl+V / Cmd+V pega si el texto es un importe: se limpia con las reglas de `numCampo` y se redondea a 2 decimales. Si no lo es, sale el aviso «Eso no parece un importe». **En el móvil no se puede pegar en la versión corta** (no hay campo de texto donde mantener pulsado); casi nunca hace falta, y la foto de ticket ya rellena el importe |

## 7. Para Desarrollo

- **Una sola pieza:** `tecladoHtml({ tecla: 'guardar'|'hecho'|'aportar', negativo: true|false })` y un estado `FORM.tec = { on, txt: '12,5', neg, reemplazar }`. El texto se guarda tal cual («12,5»), no como número, para evitar errores de redondeo.
- **`#fImporte` sigue siendo la fuente:** con el teclado activo pasa a `<input type="hidden" id="fImporte">`. Cada tecla escribe `(neg ? '-' : '') + txt` en ese campo y llama a `H.onImporteInput()`. Así `saveMov`, `importeForm`, `updatePreview` y el reparto de Compartir no cambian. `marcarCampo('#fImporte')` debe marcar la cifra visible (`#tecCifra`).
- **Pintar solo lo que cambia:** en cada tecla, solo el texto de `#tecCifra` y el estado de la tecla Guardar. Nada de `updateSheet`, que hace perder toques y la posición de la pantalla.
- **La versión corta solo cambia el orden y lo que se ve:** los campos de «Más detalles» pueden estar ya en la página, plegados, para que `saveMov` siga encontrando `#fCategoria`, `#fFecha`, `#fDesc` y `#fMetodo`. La categoría elegida en la rejilla escribe en `#fCategoria` con `pickCat`. La ficha de cuenta usa `FORM.cuenta` y `proponerCuenta`.
- **Icono nuevo** en `ICONS`: `borrar` (flecha a la izquierda con aspa), con el mismo trazo de 1,8 que los demás. La tecla «−» y la «,» son texto, no iconos.
- **Teclado físico y pegar:** un solo `keydown` y un solo `paste` en `document`, activos solo si `FORM && FORM.tec && FORM.tec.on` y el foco no está en un `input`, `textarea`, `select` o elemento editable. Se añaden al `keydown` que ya existe (el de Escape y la casilla de la Agenda).
- **Versiones:** `VERSIONES.importe = { txt: 'Apuntar importe', desde: 'AAAA-MM-DD', variantes: [['teclado', 'Teclado'], ['antes', 'Antes']] }`. No depende de la pestaña: la ficha «Antes» de la cabecera cambia la versión y vuelve a abrir la hoja conservando lo escrito, como `crearVersion` en el botón +. Con «Antes», todo como hoy (campo de texto con `inputmode="decimal"`). Las pruebas antiguas que escriben en `#fImporte` se fijan a `version:{importe:1}` desde `harness.js`, como se hizo con `tu`, `agenda` y `crear`.
- **Pruebas nuevas:** las reglas de la sección 5; la devolución se guarda en negativo; «Repetir» sustituye la cifra; Enter guarda; pegar «1.234,56 €» da 1234,56; la versión corta cabe sin desplazarse a 375 × 667; claro y oscuro; «Antes» vuelve a enseñar el campo de hoy.

## 8. Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Dejar el teclado del móvil y poner un botón «Devolución» junto al campo | Arregla el signo, pero el teclado del móvil sigue tapando las categorías y Guardar |
| `inputmode="none"` sobre el campo de verdad (cursor y pegar nativos) | En iOS no sabemos si aparece igualmente la barra de «Listo» ni cómo desplaza la hoja. Es más arriesgado que un campo oculto |
| Guardar al tocar la categoría, sin tecla Guardar (como algunas apps de gastos) | Ahorra un toque, pero si el dedo falla se guarda en la categoría equivocada. Queda como pregunta 2 |
| Modo cajero (escribir «1250» y que salga «12,50») | Sin coma, pero confunde con importes redondos: «20» saldría como 0,20 € |
| Calculadora con «+» y «×» | Más potente, pero rompe lo de «sencillo». Se puede pensar más adelante para sumar tickets |
| Teclado de la app en todos los campos de importe | Son más de 15 sitios y muchos se usan una vez. No compensa el riesgo |

## 9. Riesgos

- **Zoom con dos toques rápidos en el iPhone** si falta `touch-action: manipulation`, o si la web instalada no lo respeta.
- **Vibrar en cada tecla en el iPhone:** `iosToque` pulsa un interruptor oculto para conseguir la vibración. Hacerlo 6 u 8 veces seguidas puede ir lento o no notarse. Si molesta, se vibra solo al guardar.
- **Quien usa lector de pantalla** está acostumbrado al teclado del sistema, y uno propio le resulta más lento. Por eso conviene un ajuste para volver al del móvil (pregunta 5).
- **Pruebas antiguas:** hay unos 20 archivos de pruebas que usan `#fImporte`. Siguen valiendo si el campo se mantiene oculto y se fijan a «Antes», pero hay que revisarlas.
- **Costumbre:** quien ya apunta rápido con el teclado del móvil puede notar el cambio. Por eso se queda «Antes» y se avisa en Novedades.
- **Móviles muy pequeños** (320 × 568 px): la versión corta ya no cabe ni con una sola fila de categorías. Habría que desplazarse un poco o bajar las teclas a 48 px.

## 10. Preguntas que debe decidir el dueño

1. **(Bloquea empezar)** ¿Te vale la versión corta para un gasto o un ingreso nuevo (cifra, 7 categorías, «Hoy», cuenta y Guardar), con todo lo demás en «Más detalles»?
2. ¿Tecla «Guardar» aparte (recomendado) o guardar nada más tocar la categoría (un toque menos, pero más errores)?
3. ¿«Devolución» siempre a la vista en el teclado (recomendado) o escondida en «Más detalles»?
4. ¿Hacemos la fase 2 (compartir, aportar y traspaso) ya, o tras una semana usando la fase 1 (recomendado)?
5. Cuando se quite «Antes», ¿dejamos en Tú → Más ajustes la opción «Usar el teclado del móvil para los importes»? Recomendado: sí, por accesibilidad.

## 11. Lo que no hemos podido averiguar o confirmar

- No lo hemos probado en un móvil real: ni el zoom con toques rápidos, ni la vibración en cada tecla, ni cómo sube la hoja en la web instalada en iPhone y Android.
- La altura de la versión corta (568 px) está medida en una **maqueta** a 375 × 667 px, no en la app. Con las fuentes de la app y los márgenes seguros puede cambiar unos píxeles.
- No sabemos si alguien de los usuarios usa VoiceOver o TalkBack.
- No hemos confirmado en un iPhone actual que el teclado decimal siga sin signo menos. Lo dicen un informe de error de WebKit de 2019 y un hilo de foro sin fecha comprobada; el encargo lo da como problema real.
- No hemos contado cuántos toques hacen falta hoy en un móvil real, porque depende de cuánto tape el teclado del sistema en cada modelo.

## 12. Fuentes

- Código de la app en `/home/claude/urlife` (`app.js`, `look.css`, `app.css`), leído el 22/10/2026.
- `docs/11-auditoria-interfaz.md` (ideas B6 y C2), leído el 22/10/2026.
- WebKit Bugzilla 200226, «Wrong keyboard for inputmode=numeric», que menciona de pasada que falta la tecla del menos en el teclado decimal: https://bugs.webkit.org/show_bug.cgi?id=200226 (consultado el 22/10/2026).
- Foro de Home Assistant, «Impossible to add negative value on iOS keyboard»: https://community.home-assistant.io/t/impossible-to-add-negative-value-on-ios-keyboard/1022120 (consultado el 22/10/2026; solo visto en el buscador).
- Deque University, regla axe «target-size» (WCAG 2.2, criterio 2.5.8: 24 px como mínimo): https://dequeuniversity.com/rules/axe/4.8/target-size (consultado el 22/10/2026). Deque vende herramientas de accesibilidad (interés propio).

Para el PDF: poner lado a lado `teclado-antes.png` (con una sombra que marque «aquí sale el teclado del móvil» sobre la mitad de abajo) y `teclado-boceto-claro.png`, con tres números encima de la propuesta: 1 cifra, 2 categoría, 3 Guardar.

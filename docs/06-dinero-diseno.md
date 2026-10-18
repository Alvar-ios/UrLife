# Fase 4 · Dinero 2: metas, inversiones y deudas (Producto y diseño, 18/10/2026)

Sigue a `05-dinero.md` (aprobado). Aquí solo va lo que el dueño pidió después: metas más fáciles de ver, inversiones mejor ordenadas y un repaso completo de deudas. La gráfica de inversiones (curva suave y paso animado entre Valor y Rentabilidad) es de Desarrollo y no se dibuja aquí.

Bocetos en `docs/img/` (375 × 667 px, oscuro, datos inventados). Son una **prueba dibujada aparte**, no la app.

| Archivo | Qué enseña |
|---|---|
| `dinero2-metas.png` | Las 3 variantes de metas con las mismas 3 metas: A Anillos, B Tarros, C Camino |
| `dinero2-metas-casos.png` | Qué pasa con 1 y con 7 metas (Camino y Tarros) |
| `dinero2-inversiones.png` | El bloque en Dinero y el «Ver todo» ordenado |
| `dinero2-deudas.png` | El bloque en Dinero, la hoja de una deuda y «Nueva deuda» |

## 1. Conclusión

1. **Metas: tres variantes para probar con el botón «Antes».** A «Anillos» (lo aprobado), B «Tarros» (un tarro que se llena de líquido) y C «Camino» (tu emoji avanza hacia la bandera). **Recomendamos probar primero C**: es la única que enseña de un vistazo si llegas a tu fecha, sin leer nada.
2. **Inversiones: menos cifras repetidas y un orden fijo.** En Dinero, «Valen hoy» y 3 activos como mucho. En «Ver todo»: gráfica (con «Has metido» y «Ganas» dentro), tus activos con su reparto en una barra, y «¿Le ganas a la inflación?» en una sola tarjeta.
3. **Deudas: se crean y se editan desde Dinero, no desde Tú.** Cada deuda dice cuánto queda y cuándo acabas. Su hoja tiene «Apuntar un pago», «¿Y si pagas más cada mes?», «Cuadrar con el banco» y sus pagos.
4. **Dos fallos de deudas que hoy confunden:** un préstamo empezado antes de usar la app sale casi a 0 % pagado (no hay «Ya pagado»), y si cambias el nombre de una deuda pierde sus pagos (se enlazan por el nombre).
5. **Sin cambios en Supabase.** Todo lo nuevo (emoji, «Ya pagado», «Pagas al mes», nombres antiguos) va en la configuración del usuario (`cfg()`).

## 2. Metas: las tres variantes

Las tres van en la pantalla «de un vistazo», en el bloque Metas, y comparten el resto: tocar la meta abre su hoja (la de `05-dinero.md`, 3.2) y «+ Aportar» abre «Aportar» (nunca guarda directamente).

**Botón «Antes»:** una sola entrada `VERSIONES.dinero` con `[['camino','Camino'], ['tarros','Tarros'], ['anillos','Anillos'], ['antes','Antes']]` (la pantalla nueva con cada variante de metas, y la pantalla antigua). Así cabe en el `seccionVersion()` de hoy, que da una clave por pantalla.

| | A · Anillos | B · Tarros | C · Camino (recomendada) |
|---|---|---|---|
| Qué se ve | Anillo de 46 px con el emoji dentro; nombre y %; «1.200 de 3.000 €»; una frase de estado; «+ Aportar» a la derecha | Un tarro de 84 × 104 px por meta, en fila de 3. Dentro, el líquido hasta el %, el emoji en una etiqueta y el %. Debajo, nombre, «1.200 / 3.000 €», estado (2 líneas máx.) y «+ Aportar» | Fila: nombre y %, y «+ Aportar» a la derecha. Debajo, una pista hasta 🏁: relleno hasta donde vas, el emoji en un círculo de 28 px encima, los hitos como rombos (verdes si ya los pasaste) y **una raya de puntos hasta donde llegarás en tu fecha si sigues así**. Abajo, «600 de 2.500 €» y el estado |
| Alto (medido en el boceto) | 67 px por meta | 235 px el bloque (hasta 3 metas) | 87 px por meta |
| Colores | Anillo: `--accent`; `--warn` si vas justo; `--income` si está lograda; `--expense` solo si la fecha pasó. Fondo del anillo `--paper-sunken` | Líquido con esos mismos colores (90 % de opacidad, y una segunda ola al 35 %). Cristal `--paper-sunken` al 55 % con borde `--line`; tapa `--paper-sunken` | Pista `--paper-sunken`; relleno y borde del círculo con esos mismos colores; raya de puntos y su círculo final en el mismo color; hitos sin pasar con borde `--text-faint`, pasados en `--income` |
| Al verse (`revelarAlVer`) | El anillo se llena de 0 al % en 700 ms, una meta tras otra (80 ms); el emoji aparece con un rebote | El líquido sube de 0 al % en 900 ms y la superficie ondea 2 veces y se queda quieta | La pista se llena de izquierda a derecha en 700 ms y el emoji «camina» hasta su sitio con un saltito final. La raya de puntos aparece después (200 ms) |
| Al aportar (al guardar) | El anillo crece del % viejo al nuevo; el emoji da un saltito; `sentir('ok')` | Caen 3 gotas, el nivel sube, vuelve a ondear; `sentir('ok')` | El emoji avanza con dos saltitos; si pasa un hito, el rombo se pone verde y sale confeti pequeño; `sentir('ok')` |
| Al llegar al 100 % | Anillo verde, ✓ y confeti (ya existe) | Tarro verde lleno, confeti | El emoji llega a 🏁, confeti |
| 1 meta | Una fila (sobra sitio) | Un tarro grande (96 × 120) a la izquierda y los datos a la derecha | Una fila con los nombres de los hitos y la fecha bajo la pista. Debajo, una invitación con borde de puntos: «¿Ahorras para algo más? Una meta para cada cosa.» |
| 3 metas | 3 filas (unos 200 px) | 3 tarros en fila | 3 filas (unos 260 px) |
| 7 metas | Se ven 4 y «Ver las 7 metas» | 4 o más: los tarros se deslizan de lado (se ven 3 y medio) y «Ver las 7 metas» | Se ven 4 y «Ver las 7 metas» |
| A favor | Lo más compacto | Lo más visual y emocional | Dice si llegas sin leer; cabe con hitos; crece bien |
| En contra | Poco ilustrativo, que es lo que pidió el dueño | Se compara mal el % entre tarros; con 4 o más hay metas escondidas de lado | Algo más alto que A |

**Orden de las metas (las tres variantes):** primero las que tienen fecha más cercana, luego las que no tienen fecha y, al final, las conseguidas plegadas en «Conseguidas (N)».

**Cómo se calcula la raya de puntos (solo en C):** con lo que ya da `statsMetaH` → `proy = min(obj, valor + ritmo × meses hasta la fecha)`. Se dibuja solo si la meta tiene fecha y `proy > valor`. Si `proy ≥ obj`, la raya llega a 🏁 y el estado es verde («Vas bien para abril»). Sin fecha, no hay raya y el estado dice «A este ritmo, en jun 2027». No cuenta la rentabilidad, para no prometer de más.

**Con «Reducir movimiento» del móvil activado:** nada de olas ni saltos; el relleno aparece ya puesto.

**Color nuevo `--warn`** (para «vas justo», aprobado en `05-dinero.md`): oscuro `#F5B83D` (contraste 10:1 sobre `--paper-raised`), claro `#9A6100` (5,1:1 sobre blanco). `--warn-soft`: `rgba(245,184,61,.14)` / `rgba(154,97,0,.10)`. `SEMAFORO_COLOR.amarillo` pasa a `var(--warn)`. Dorado, no naranja terracota.

## 3. Inversiones

| Dónde | Orden, de arriba abajo | Se quita o se junta |
|---|---|---|
| Bloque en Dinero | Título «Inversiones» con «Ver todo ›». Línea «Valen hoy 1.412 € · +62 € · +4,6 %». Hasta 3 activos de más a menos valor: icono por tipo (fondo, acción, cripto, otro), nombre, «Aportaste 1.200 €», a la derecha lo que vale y lo que ganas. Si hay más: fila «y N más ›» | Sin gráfica ni cifras sueltas |
| «Ver todo» | Una pantalla dentro de Dinero con «‹ Dinero» arriba (no una hoja: la gráfica se arrastra con el dedo y chocaría con bajar la hoja para cerrarla). 1) Tarjeta de la gráfica (de Desarrollo) y, dentro, abajo, dos cifras: «Has metido» y «Ganas». 2) «Tus activos»: una barra de reparto por tipo con su leyenda («Fondos 89 % · Cripto 11 %», solo si hay 2 tipos o más) y la lista: «6,82 part. · aportaste 1.200 €» y, a la derecha, valor y «+55,00 € · +4,6 %». 3) Avisos: si un activo no tiene precio, una línea en `--warn-soft`: «Fondo Europa no tiene precio porque falta elegir el activo.» con «Buscarlo». 4) «¿Le ganas a la inflación?»: dos barras (Tu cartera / Inflación), la frase y los chips España, Zona euro y Mundo dentro de la misma tarjeta. 5) Enlace «De dónde salen los precios» | Fuera la fila de 3 cifras («Invertido», «Valor actual», «Resultado»): pasan a 2 dentro de la gráfica. Fuera «Por tipo de activo» (pasa a la barra de reparto). «Rentabilidad anual» e «Inflación anual» se juntan. El precio de cierre y su fecha salen de la fila del activo y van a «De dónde salen los precios», junto a la nota larga de hoy |
| Sin precio todavía | En el bloque: «Aportaste 300 €», sin ganancia. En «Ver todo», el aviso del punto 3 | Nada de cifras inventadas |
| Al tocar un activo | Igual que hoy: abre sus movimientos | — |

## 4. Deudas: repaso completo

**Datos nuevos (en `cfg().deudas[]`, sin migración):** `emoji`, `previo` («Ya pagado» antes de usar la app), `cuotaMes` («Pagas al mes») y `nombresAntes[]` (nombres anteriores, para no perder pagos al renombrar). El campo de texto «Recurrencia» deja de enseñarse (no se usa en ningún cálculo); no se borra.

**Cálculo (`deudaStats`):** `pagado = previo + pagos`. `ritmo = cuotaMes` si existe; si no, la media de los pagos de los últimos 3 meses (como hoy). «Acabas en» = hoy + `ceil(queda / ritmo)` meses. Los pagos se buscan por el nombre **o** por cualquiera de `nombresAntes`. Sin intereses, como hoy, y dicho en la pantalla.

| Pieza | Cómo es |
|---|---|
| Bloque en Dinero | Título «Deudas», «quedan 3.370 €» y «+ Nueva». Fila: emoji en un cuadrado `--paper-sunken` de 34 px, nombre, y a la derecha **lo que queda** (grande) con «quedan (de 8.000 €)». Debajo, barra de lo pagado en `--bill` (azul) y una frase de estado. Las saldadas se pliegan en «✓ Saldadas (N)». Alto: 90 px por deuda (medido en el boceto) |
| Estados (color de la frase) | Vas a tiempo: «Acabas en mar 2028 · a tiempo ✓» (`--income`). Justo: «Para acabar en enero: 120 €/mes» (`--warn`). Sin fecha: «A este ritmo, acabas en mar 2028» (`--text-muted`). Sin pagos en 3 meses: «Sin pagos desde julio» (`--text-muted`). Fecha pasada: «Tenías que acabar en septiembre» (`--expense`, el único rojo). Saldada: «¡Saldada!» (`--income`) |
| Hoja de una deuda (al tocar la fila) | Emoji, nombre y lápiz (editar). «Quedan» y la cifra grande; «de 8.000 € · llevas pagado el 64 %»; barra azul de 10 px. Una caja con un solo mensaje, del color de su estado: «Acabas en marzo de 2028, 3 meses antes de lo previsto. Pagas 170 € al mes.» |
| ¿Y si pagas más cada mes? | Chips «+50 €», «+100 €», «+200 €». Al tocar uno: «Con 270 € al mes acabarías en septiembre de 2027: 6 meses antes.» y «Sin contar intereses. Solo es una cuenta: no se guarda nada.» Sin «Pagas al mes» ni ritmo, se usa lo que haga falta para la fecha; sin nada de eso, la sección no sale |
| Botones | «+ Apuntar un pago» (abre el formulario de movimiento con tipo Deuda, esa deuda elegida y el importe de «Pagas al mes»). «Cuadrar con el banco» (pides «¿Cuánto te queda según tu banco?» y se ajusta `previo` para que cuadre; no crea movimientos). «Más»: «Editar», «Eliminar deuda» (pide confirmación y no borra los pagos) |
| Últimos pagos | Los 3 últimos y «Ver todos» (lo que hoy hace «Ver pagos») |
| «Nueva deuda» y «Editar» | Una hoja en Dinero. «Elige un dibujo» (🚗 🏠 📱 💳 🎓 🤝, con uno propuesto según el nombre), «Nombre», «Total que debías», «Ya pagado · opcional», «Pagas al mes · opcional», «Acabar en · opcional» (mes y año). Nota: «“Ya pagado” es lo que pagaste antes de usar la app. No contamos intereses: si tu banco dice otra cifra, usa “Cuadrar con el banco”.» Botón «Guardar deuda». En Tú → Deudas, un enlace que lleva aquí |
| Deudas compartidas | Misma fila, con el nombre del grupo; al tocar, su hoja de hoy (sin cambios en esta tanda) |

## 5. Textos exactos

| Dónde | Texto |
|---|---|
| Metas (bloque) | «Metas» · «+ Nueva» · «+ Aportar» · «Ver las N metas» · «Conseguidas (N)» · «¿Ahorras para algo más? Una meta para cada cosa.» |
| Estados de meta | «Vas bien para abril» · «Para abril: 350 €/mes» · «A este ritmo, en jun 2027» · «Sin aportar desde julio» · «La fecha pasó · faltan 400 €» · «¡Conseguida!» |
| «Antes» | «Camino» · «Tarros» · «Anillos» · «Antes» |
| Inversiones (bloque) | «Inversiones» · «Ver todo» · «Valen hoy» · «Aportaste 1.200 €» · «y N más» · «Sin precio todavía» |
| Inversiones («Ver todo») | «‹ Dinero» · «Has metido» · «Ganas» / «Pierdes» · «Tus activos» · «¿Le ganas a la inflación?» · «Tu cartera» · «Inflación» · «Le ganas por 1,3 puntos. Tu dinero compra un 1,2 % más cada año.» / «La inflación te gana por 0,8 puntos. Tu dinero compra un 0,8 % menos cada año.» · «Fondo Europa no tiene precio porque falta elegir el activo.» · «Buscarlo» · «De dónde salen los precios» |
| Deudas (bloque) | «Deudas» · «quedan 3.370 €» · «+ Nueva» · «quedan (de 8.000 €)» · «✓ Saldadas (N)» |
| Estados de deuda | «Acabas en mar 2028 · a tiempo ✓» · «Para acabar en enero: 120 €/mes» · «A este ritmo, acabas en mar 2028» · «Sin pagos desde julio» · «Tenías que acabar en septiembre» · «¡Saldada!» |
| Hoja de deuda | «Quedan» · «de 8.000 € · llevas pagado el 64 %» · «¿Y si pagas más cada mes?» · «+50 €» «+100 €» «+200 €» · «+ Apuntar un pago» · «Cuadrar con el banco» · «¿Cuánto te queda según tu banco?» · «Más» · «Editar» · «Eliminar deuda» · «Últimos pagos» · «Ver todos» |
| Nueva deuda | «Nueva deuda» · «Elige un dibujo» · «Nombre» · «Total que debías» · «Ya pagado · opcional» · «Pagas al mes · opcional» · «Acabar en · opcional» · «Guardar deuda» |
| Avisos (toasts) | «Deuda guardada» · «Pago apuntado» · «Cuadrada con tu banco» · «Deuda eliminada. Sus pagos siguen en Movimientos.» |
| Palabras que se van | «Pendiente», «Cuota necesaria», «Ritmo (últimos 3 meses)», «Fecha objetivo», «Objetivo» (en deudas), «Recurrencia (ej. mensual)», «Resultado», «Activos», «Aportaciones», «Por tipo de activo» |

## 6. Recomendaciones

- **Programar las tres variantes de metas a la vez** y dejar C por defecto: se comparan con el mismo dato y el dueño elige tocando «Antes». Después se quitan las que sobren.
- **Hacer primero «Ya pagado» y los nombres antiguos de deudas**: arreglan cifras que hoy están mal, aunque la pantalla siga igual.
- **«Cuadrar con el banco» en vez de calcular intereses**: el banco ya sabe lo que queda; copiarlo es más fiable y más sencillo que pedir el tipo de interés.

## 7. Riesgos

- **«Lo que tienes» puede bajar** para quien rellene «Ya pagado» o cuadre con el banco (queda menos deuda, sube; o al revés). Es correcto, pero conviene contarlo en las novedades.
- **Los tarros (B) son los más caros de programar** (forma, ola y gotas en SVG). Si hay que recortar, se prueban A y C.
- **La raya de puntos (C) se puede leer como promesa.** Por eso no cuenta la rentabilidad y la hoja de la meta dice cómo se calcula.
- **Eliminar una deuda deja sus pagos** en Movimientos como tipo Deuda sin deuda; es a propósito (no borrar datos), pero conviene decirlo en el aviso.
- **Renombrar sin `nombresAntes`** haría perder los pagos de esa deuda, como pasa hoy.

## 8. Preguntas para el dueño

1. **(Bloquea las metas)** ¿Probamos las tres variantes (Camino, Tarros, Anillos) con «Antes», con **Camino por defecto**? Recomendado: sí. Alternativa más barata: solo Camino y Anillos.
2. ¿Movemos crear y editar deudas de **Tú a Dinero** (y en Tú queda un enlace)? Recomendado: sí.
3. ¿Añadimos **«Ya pagado»**, **«Pagas al mes»** y **«Cuadrar con el banco»** a las deudas, sin calcular intereses? Recomendado: sí.
4. ¿Dejamos «Ver todo» de inversiones como **pantalla con «‹ Dinero»** (no hoja)? Recomendado: sí, por la gráfica.

## 9. Lo que no hemos podido averiguar o confirmar

- Nada probado en un móvil real ni con usuarios: bocetos dibujados aparte a 375 × 667 px, con datos inventados. Las alturas (67, 87, 235 y 90 px) se midieron en el boceto, no en la app.
- No sabemos cuántas metas, deudas o activos tienen de verdad los usuarios (no miramos sus datos), ni cuántos préstamos empezaron antes de usar la app.
- No hemos comprobado si alguien ha escrito algo en «Recurrencia»; si lo hay, se conserva pero deja de verse.
- No hemos probado la fluidez de las olas y las gotas en un móvil modesto.
- No hemos revisado el modo claro de estos bocetos (solo el contraste del color `--warn`, calculado).

## 10. Fuentes

- Código de la app en `main` (`app.js`: `renderInversiones`, `evolucionHtml`, `rentabilidadHtml`, `inflacionHtml`, `renderDeudas`, `renderDeudasPersonales`, `deudaStats`, `statsMetaH`, `metaCardHtml`, `SEMAFORO_COLOR`, `VERSIONES`, `seccionVersion`; editor de Tú → Deudas), 18/10/2026.
- `docs/05-dinero.md` (aprobado por el dueño el 18/10/2026).
- Medidas y contraste calculados por nosotros sobre los bocetos, 18/10/2026.

Para el PDF: poner las tres variantes de metas una al lado de otra (`dinero2-metas.png`) en la primera página, con la pregunta 1 debajo.

# 38 · «Lo básico»: la app sencilla para los nuevos, sin esconder nada

*Producto y Diseño · 10/11/2026. Especificación para programar lo aprobado por el dueño el 10/11 de `docs/37` §A: modo «Lo básico» para los nuevos, bienvenida de 2 pantallas (1 para el invitado), sin paso del banco para el invitado y otra cifra grande para él. Condición del dueño: **«que el usuario sea consciente de que hay más cosas en la app»**. Parte del código de hoy (`obPasos`, `doObFinish`, `empiezaHtml`, `crearHtmlV2`, `renderTuV2`, `heroMesHtmlV2`, `inicioPiezasHtml`, `renderDineroV2`, `buscarHtml`) y de las capturas de `docs/img/37/` (375 × 667). No se ha tocado el código ni probado en un móvil: las alturas de Inicio son cálculos sobre esas capturas.*

## 1. Conclusión

1. **Nada se esconde sin decir que existe.** En «Lo básico» lo avanzado no desaparece: se **pliega con nombre** («Más opciones: Tarea, Apartar, Pago fijo…», «Más ajustes: Reglas, Informes, Papelera…») y todo sigue saliendo con la lupa.
2. **Una puerta fija a todo lo demás: «Descubre PalomApp»**, con 12 herramientas (icono, una frase y «Probar» o «Activar») y el contador **«Has descubierto 4 de 12»**. Está en Inicio (una línea al final, mientras dure «Lo básico»), arriba del todo en Tú (siempre, para todos) y en la lupa.
3. **Una ayuda al día como mucho** en Inicio: una sugerencia según lo que hace la persona («¿Qué se repite cada mes?» con 3 gastos al tercer día, etc.). Nunca el primer día, nunca a la vez que «Primeros pasos».
4. **A los 30 días pasa sola a «Todo»** y se le dice con una tarjeta, con la opción de volver. Cualquiera, nuevo o antiguo, lo cambia en **Tú → «Qué ves en la app»**. Los usuarios de hoy no notan nada: sin la clave nueva, la app es «Todo».
5. **Todo se guarda en `cfg()`**, sin tocar Supabase: 8 claves nuevas (§4). Bienvenida: 2 pantallas sin invitación, 1 con invitación, y el invitado ve «Gastos de este mes» en vez de «Te queda −49,00 €».

---

## 2. Qué ve un usuario nuevo el primer día

**Regla general:** las 4 pestañas de abajo, la cabecera (agenda, lupa, tu inicial) y el botón + no cambian nunca. Cambia lo que hay **dentro** de Inicio, el + y Tú. Movimientos, Juntos, Dinero y la Agenda son **iguales** que hoy.

Se llama «Lo básico» a `nivel() === 'basico'` (§4). Todo lo de este apartado vale solo con ese nivel.

### 2.1 Inicio

Orden de arriba abajo (375 × 667, sin scroll):

| # | Pieza | Alto aprox. | Notas |
|---|---|---|---|
| 1 | Tarjeta del mes (`heroMesHtmlV2`) | 172 px | Con la regla nueva de la cifra (§6.3) |
| 2 | **Una sola** tarjeta de ayuda: invitación pendiente > aviso de informe > **«Primeros pasos»** > sugerencia del día | hasta 232 px | Nunca dos a la vez |
| 3 | Piezas de Inicio (`inicioPiezasHtml`) | — | **Ocultas mientras se vea «Primeros pasos»** (el primer día no tienen datos). Después, las de siempre: «Así vas» y «Estos días» |
| 4 | Línea **«Descubre PalomApp»** | 44 px | Sustituye a «Editar Inicio» mientras dure «Lo básico» («Inicio a tu gusto» está en el catálogo) |

Cálculo a 375 × 667: cabecera 60 + tarjeta 172 + «Primeros pasos» 232 + línea 44 + huecos 36 + barra de abajo 70 = **614 px**. Cabe. Hay que confirmarlo con `node tests/capturas/revisar.js`.

**Tarjeta «Primeros pasos»** (sustituye a «Empieza aquí» en «Lo básico»; con «Todo», «Empieza aquí» sigue igual):

- Cabecera: **«Primeros pasos»** a la izquierda; a la derecha **«1 de 3»** y el enlace **«Ocultar»** (guarda `empiezaOculto`, la clave de hoy).
- 3 filas de 56 px con casilla redonda. Al cumplirse una: `check` en la casilla, título tachado suave, `sentir('ok')`. La fila hecha no lleva a ningún sitio.
- Al completar las tres: `confeti` una vez, el título cambia a **«¡Ya lo tienes!»** y las filas se sustituyen por una: `sparkle` **«Ahora, descubre lo demás»** · «Has descubierto N de 12 herramientas.» › (abre el catálogo). Se va al día siguiente (`primerosPasos.hecho`).
- Si a los **7 días** sigue sin completarse ni ocultarse, se pliega a una línea: **«Primeros pasos · 1 de 3 ›»** (abre la tarjeta entera en una hoja). Desde ese momento ya pueden salir sugerencias.

| Llega… | Fila 1 | Fila 2 | Fila 3 |
|---|---|---|---|
| Sin invitación | `plus` **Apunta tu primer gasto** · «O hazle una foto al ticket.» → `crearIr('gasto')` · hecha: algún movimiento | `users` **Comparte un gasto con alguien** · «Basta con su nombre: no hace falta que tenga la app.» → `crearIr('compartido')` · hecha: algún compartido creado por mí | `bank` **Pon el saldo de tu banco** · «Así sabrás lo que te queda de verdad.» → `openCuentas` · hecha: alguna cuenta con saldo (`conSaldo`) |
| Con invitación | `users` **Añade lo que pagues en «{grupo}»** · «La app lo reparte entre todos.» → compartir en ese grupo · hecha: compartido mío en él | `plus` **Apunta un gasto tuyo** · «Solo lo ves tú.» → `crearIr('gasto')` · hecha: algún movimiento | `send` **Crea tu propio grupo** · «Para la casa, la pareja o el próximo viaje.» → `openGrupos` · hecha: algún grupo creado por mí |

**Línea «Descubre PalomApp»** (botón de fila entera, estilo de `.iw-editar`):
`sparkle` **«Descubre todo lo que puede hacer PalomApp»** y debajo, pequeño: **«Has descubierto 2 de 12 herramientas»**, con una barra fina de progreso en el acento de la paleta. Abre el catálogo (§3.1). A 360 px o menos, el título se queda en «Descubre PalomApp».

### 2.2 El botón +

| Parte | «Lo básico» | «Todo» (hoy) |
|---|---|---|
| Banda «Foto de ticket» | Igual que hoy | Igual |
| Grandes | **3:** Gasto · Ingreso · Compartido (clase `tres`, ya existe) | 4: con Tarea |
| «Repetir» | Igual que hoy | Igual |
| Pequeñas | **Plegadas** en una fila: `more` **«Más opciones»** · debajo, pequeño: **«Tarea, Apartar, Pago fijo, Importar, Trayecto…»** · `chevD`. Al tocar se despliega la rejilla de hoy, con **Tarea** como primera | Siempre a la vista |
| Final de la rejilla desplegada | Enlace `sparkle` **«Descubre para qué sirve cada una ›»** (abre el catálogo) | — |

El desplegado se recuerda solo mientras la app está abierta (`S.crearMas`), sin guardar nada. Los nombres de la línea gris salen de las opciones que existan (si no hay Traspaso, no se nombra).

### 2.3 Tú

En «Lo básico» Tú tiene **las mismas filas que hoy**, solo que algunas bajan a «Más ajustes», que ya existe plegado (`S.tuMas`):

| Grupo | Se queda a la vista | Baja a «Más ajustes» |
|---|---|---|
| (nuevo, arriba, bajo «Buscar un ajuste») | Tarjeta **«Descubre PalomApp»** (§3.1) | — |
| Tu dinero | Cuentas y saldos · Categorías y presupuestos · Cobros y pagos recurrentes · Grupos y personas | Reglas de categorías · Informes · Tu mes · Compartir mi agenda |
| Traer y guardar | Importar extracto o Excel · Fotos de tickets | Papelera · Descargar mis movimientos (Excel) · Copia de seguridad |
| La app | Aspecto y sensaciones · Tema · **Qué ves en la app** (nueva, §5) · Volver a ver la bienvenida | Qué hay de nuevo |
| Tu cuenta | Igual | — |

- La fila «Más ajustes» lleva, debajo del título, **los nombres de lo que contiene**: «Reglas, Informes, Tu mes, Papelera, Copia…» y el número a la derecha (como hoy). Así se sabe qué hay sin abrirlo.
- **«Botón "Antes" (pruebas)»** no sale en «Lo básico» (los nuevos ya tienen `compararVersiones: false`).
- «Buscar un ajuste» busca también dentro de «Más ajustes» y lo despliega si encuentra algo allí.

**Tarjeta «Descubre PalomApp» en Tú** (para todos, en los dos niveles): `sparkle` **«Descubre PalomApp»** · **«Has descubierto 4 de 12 herramientas»** · barra fina · › . Con las 12 descubiertas: «Ya lo has probado todo» y se queda como fila normal del grupo «La app».

### 2.4 Lo que no cambia

| Pestaña | En «Lo básico» |
|---|---|
| Movimientos | Igual (Resumen, Lista, Calendario). Es lo básico |
| Juntos | Igual. Con Juntos vacío, debajo del texto de hoy: «¿Tus amigos no tienen PalomApp? No pasa nada: añádelos por su nombre.» (P1 de `docs/37`) |
| Dinero | Igual: ya enseña Cuentas, Metas, Inversiones y Deudas con «Añadir», y vacío ya ofrece banco, meta y deuda. Nada que plegar |
| Agenda | Igual. El icono de arriba siempre está; el día 2 sale su pista (§3.4) |
| Lupa | Busca **todo**, en los dos niveles. Se añade la acción «Descubre PalomApp» (palabras: herramientas funciones qué puedo hacer ayuda) y las que faltan del catálogo (Trayecto, Informes, Inicio a tu gusto) |

---

## 3. Cómo se le hace ver que hay más

### 3.1 Catálogo «Descubre PalomApp» (hoja)

- Título **«Descubre PalomApp»**. Debajo: **«Has descubierto 4 de 12 herramientas»** y una barra de 12 tramos.
- Primero las **no descubiertas** (en el orden de la tabla), luego las descubiertas.
- Cada fila: icono en círculo de color, nombre en negrita, una frase gris y un botón pequeño a la derecha (`btn sm`, mínimo 44 px de alto). La fila entera es tocable.
- Descubierta: `check` sobre el icono y el botón dice **«Abrir»** (estilo `ghost`).
- Al tocar «Probar» o «Activar»: se cierra la hoja, se abre la herramienta y se guarda `descubierto[clave]` con la fecha. `sentir('tic')`.
- Pie: **«Y en Tú también: Reglas de categorías, Tu mes, Compartir mi agenda, Ocultar cifras, Copia de seguridad, Aspecto.»** (texto, sin botones).
- En «Lo básico», al final: botón `ghost` **«Quiero verlo todo ya»** (pasa a «Todo», §5). En «Todo» no sale.

| # | Clave | Icono | Nombre | Frase | Botón → acción | Se da por descubierta si… |
|---|---|---|---|---|---|---|
| 1 | `ticket` | `camera` | Foto de ticket | Haz una foto y la app apunta el total por ti. | Probar → `ticketFoto` | Ha leído algún ticket (`ticketsUso().usados > 0`) |
| 2 | `cuentas` | `bank` | Cuentas y saldos | Pon lo que tienes en el banco y la app lo lleva al día. | Activar → `openCuentas` | Alguna cuenta con saldo |
| 3 | `agenda` | `calendar` | Agenda y tareas | Lo que tienes que hacer, con su día, y aviso en Inicio. | Probar → `irAgenda('tareas')` | Alguna tarea |
| 4 | `presu` | `checkCircle` | Presupuestos | Elige cuánto quieres gastar al mes en cada cosa. | Activar → `openListEditor('categoriasGasto')` | Alguna categoría con presupuesto |
| 5 | `fijos` | `repeat` | Cobros y pagos fijos | La nómina y los recibos, para ver cómo acabarás el mes. | Activar → `openRecurrentes` | Algún cobro o pago fijo |
| 6 | `importar` | `fileIn` | Importar del banco | Trae el extracto o un Excel y lo colocamos solo, sin duplicados. | Probar → `impAbrir` | Algún lote importado |
| 7 | `metas` | `target` | Metas de ahorro | Aparta para un viaje o un colchón y mira cuánto te falta. | Activar → `metaNueva` | Alguna meta |
| 8 | `deudas` | `deuda` | Deudas | Un préstamo o la tarjeta: cuánto queda y cuándo acabas. | Activar → crear deuda (la acción de «Apunta una deuda» de Dinero) | Alguna deuda |
| 9 | `inversiones` | `trendUp` | Inversiones | Lo que tienes invertido y cuánto ganas. | Probar → `crearIr('inversion')` | Algún movimiento de inversión |
| 10 | `trayecto` | `coche2` | Calculadora de trayecto | Cuánto cuesta un viaje en coche, con el precio de hoy. | Probar → `trAbrir` | Existe `cfg().trayecto` |
| 11 | `informes` | `sparkle` | Informes | Un resumen de tu mes en frases sencillas. | Activar → `infAbrir` | `cfg().informes.on` |
| 12 | `inicio` | `sliders` | Inicio a tu gusto | Elige qué ves en Inicio: metas, cuentas, calendario… | Probar → `iwEditar` | Existe `cfg().inicioWidgets` |

Regla del contador: **descubierta = lo dice la tabla (por los datos) o está en `descubierto`**. Así, quien ya usa algo lo ve marcado sin haber abierto el catálogo, y no hace falta guardar nada para los usuarios de hoy.

«Probar» se usa para lo que se puede mirar sin comprometerse; «Activar», para lo que deja algo puesto. Apuntar gastos, ingresos y Juntos no están en el catálogo: son lo básico y ya están a la vista.

### 3.2 Sugerencias según el uso

Tarjeta en Inicio, en el hueco 2 de §2.1. Diseño: icono en círculo con el acento, título en negrita, una frase, y dos botones: principal (`btn sm accent`) y **«Ahora no»** (`link`). Una `×` arriba a la derecha hace lo mismo que «Ahora no».

| Orden | Clave | Cuándo sale (todas desde el día 2) | Icono · Título · Frase | Botón |
|---|---|---|---|---|
| 1 | `fijos` | Día 3 o más, con 3 gastos o más, sin fijos | `repeat` · **«¿Qué se repite cada mes?»** · «Apunta la nómina y los recibos y verás cómo acabarás el mes.» | Añadir → `openRecurrentes` |
| 2 | `presu` | 10 gastos o más en «tu mes», sin presupuestos | `checkCircle` · **«¿Ponemos un tope a lo que más gastas?»** · «En {categoría} llevas {importe}. Elige cuánto quieres gastar al mes.» | Poner tope → editar esa categoría |
| 3 | `ticket` | 2 gastos a mano o más, ningún ticket leído, tickets disponibles | `camera` · **«¿Tienes el ticket a mano?»** · «Hazle una foto y la app apunta el total por ti.» | Probar → `ticketFoto` |
| 4 | `metas` | Al día siguiente de poner el saldo del banco, sin metas | `target` · **«¿Ahorras para algo?»** · «Un viaje, la entrada de la casa, un colchón…» | Crear meta → `metaNueva` |
| 5 | `importar` | 15 gastos a mano en los últimos 14 días, sin importar nunca | `fileIn` · **«¿Te cansas de apuntar?»** · «Trae el extracto de tu banco y lo colocamos solo.» | Importar → `impAbrir` |
| 6 | `deudas` | 2 gastos con «préstamo», «hipoteca», «financiación» o «cuota» en la descripción o la categoría, en meses distintos, sin deudas | `deuda` · **«¿Estás pagando algo a plazos?»** · «Apúntalo como deuda y verás cuánto te queda y cuándo acabas.» | Apuntar deuda |
| 7 | `inicio` | Día 14 o más, con 20 movimientos o más | `sliders` · **«Pon en Inicio lo que más miras»** · «Una meta, tus cuentas, el calendario de gastos…» | Elegir → `iwEditar` |

Reglas:
- **Una al día como mucho.** La primera que se enseña un día se apunta en `sugHoy`; ese día no sale otra aunque se resuelva.
- Nunca el **día 1**, nunca con «Primeros pasos» visible (§2.1), nunca en la bienvenida, nunca si hay una invitación o un aviso de informe (comparten el hueco).
- No sale si la herramienta ya está descubierta (§3.1).
- **«Ahora no»** la aplaza **7 días**. A la **segunda** vez, no vuelve nunca (`hasta: 'nunca'`). Tocar el botón principal la da por resuelta y marca la herramienta como descubierta.
- Solo en «Lo básico». En «Todo» no hay sugerencias (decisión 2).
- Guardar `sugHoy` **no se hace dentro de `render()`**: se programa con `setTimeout` tras pintar, por `saveConfig` (una escritura al día como mucho).

Además, sin contar como sugerencia (no ocupan el hueco de Inicio):
- Dentro de un grupo con algún gasto de categoría Transporte o con «gasolina» en la descripción: una línea al pie de la lista de gastos, `coche2` **«¿Ibais en coche? Calcula la gasolina ›»** → `trAbrir`. Una vez por grupo.
- Al cerrar el primer mes con algo apuntado: el aviso de informe de Inicio de hoy (`infAvisoHtml`), sin cambios.

### 3.3 A los 30 días

- El primer día que abra la app con **30 días o más** desde `nivelCambio.d`, si el cambio fue por la bienvenida (`por: 'alta'`), la app **pasa sola a «Todo»** y enseña en el hueco 2 de Inicio, una vez:
  `sparkle` **«Ya llevas un mes con PalomApp»** · «Desde hoy ves todas las herramientas en el + y en Tú.» · botón **«Ver qué hay»** (abre el catálogo) · enlace **«Prefiero lo básico»** (vuelve a «Lo básico» con `por: 'tu'`, que ya no caduca).
- Si se eligió «Lo básico» a mano desde Tú, no caduca nunca.
- Si antes de los 30 días ya pasó a «Todo» (Tú o «Quiero verlo todo ya»), no sale nada.
- Tras pasar a «Todo»: + completo, Tú como hoy, vuelve «Editar Inicio», sin sugerencias. El catálogo y su contador siguen en Tú.

### 3.4 Pistas de primera vez

Globo pequeño con flecha hacia lo señalado, en el acento de la paleta, con **«Entendido»**. Una vez cada una, **una al día como mucho**, nunca con una hoja abierta. Solo en «Lo básico». Se guardan en `pistasVistas`.

| Clave | Cuándo | Señala | Texto |
|---|---|---|---|
| `agenda` | Día 2 o más, al abrir Inicio | Icono del calendario | «Tu agenda y tus tareas están aquí» |
| `tu` | La primera vez que entra en Tú | Tarjeta «Descubre PalomApp» | «Aquí tienes todas las herramientas» |
| `deslizar` | Con 3 movimientos, en la Lista | Primer movimiento | «Desliza a la izquierda para duplicar o borrar» |
| `persona` | Primera vez que debe o le deben en Juntos | Primera persona | «Toca a una persona para saldar o pedírselo por WhatsApp» |

---

## 4. Dónde se guarda (solo `cfg()`, sin tocar Supabase)

Claves **de primer nivel** (no un objeto con todo dentro) para que dos guardados seguidos no se pisen: `saveConfig` sustituye cada clave entera. Al cambiar una clave que es un objeto, copiar la de `cfg()` y añadir.

| Clave | Ejemplo | Quién la escribe | Notas |
|---|---|---|---|
| `nivel` | `'basico'` / `'todo'` | `doObFinish` (solo bienvenida nueva, no la repetida desde Tú), Tú, catálogo, 30 días | **Sin clave = `'todo'`.** Función `nivel()` |
| `nivelCambio` | `{ d: '2026-11-12', por: 'alta' }` | Los mismos | `por`: `alta`, `tu`, `catalogo`, `30dias`. Los 30 días solo cuentan con `alta` |
| `descubierto` | `{ ticket: '2026-11-13' }` | Catálogo, sugerencias | Se suma a lo que dicen los datos (§3.1) |
| `sugerencias` | `{ fijos: { n: 1, hasta: '2026-11-20' } }` | «Ahora no», botón principal | `hasta: 'nunca'` o `hecha: fecha` |
| `sugHoy` | `{ d: '2026-11-14', k: 'fijos' }` | Inicio, tras pintar | Una escritura al día |
| `pistasVistas` | `{ agenda: '2026-11-13' }` | «Entendido» | — |
| `primerosPasos` | `{ hecho: '2026-11-15' }` | Al completar las 3 filas | Ocultar usa la clave de hoy `empiezaOculto` |
| `aviso30` | `'2026-12-12'` | Tarjeta de los 30 días | Para enseñarla una sola vez |

Ya existen y se reutilizan: `altaApp` (fecha de alta), `empiezaOculto`, `compararVersiones`, `introJuntosVisto`. Ningún dato nuevo va en `movimientos` ni en otra tabla.

---

## 5. Usuarios de hoy y el ajuste en Tú

- **Los usuarios de hoy no tienen `nivel` → la app es «Todo», exactamente como ahora.** Lo único nuevo que ven: la tarjeta «Descubre PalomApp» en Tú (con lo que ya usan marcado) y la fila «Qué ves en la app».
- Quien pasó la bienvenida antes de este cambio tampoco tiene `nivel`: «Todo».
- **Fila nueva en Tú → La app:** `sliders` **«Qué ves en la app»**, a la derecha «Lo básico» o «Todo». Abre una hoja:
  - Título **«Qué ves en la app»**.
  - Dos opciones de radio (estilo `av-op`, como «Compartir mi agenda»):
    - **«Lo básico»** · «Lo justo para apuntar y compartir. Lo demás, plegado y en Descubre PalomApp.»
    - **«Todo»** · «Todas las herramientas a la vista, en el + y en Tú.»
  - Nota gris: «No se borra ni se pierde nada: solo cambia lo que ves. Lo puedes cambiar cuando quieras.»
  - Botones: «Cancelar» / **«Guardar»**. Al guardar: `nivel`, `nivelCambio` con `por: 'tu'`, `toast('Listo')`, repintar.
- Palabras clave para «Buscar un ajuste»: básico sencillo todo completo modo herramientas.

---

## 6. La bienvenida y el camino del invitado

### 6.1 Sin invitación: 2 pantallas

`obPasos` devuelve `['hola', 'empieza']` para la bienvenida de un usuario nuevo. **Repetida desde Tú** («Volver a ver la bienvenida»), sigue siendo la de 4 pasos de hoy (sirve para poner el banco y los fijos).

**Pantalla 1 · «¡Hola!»** (barra de 2 puntos, «Saltar» arriba)
- Título **«¡Hola!»** · «Esto es PalomApp: tus gastos y lo que compartes, en un solo sitio.»
- 3 filas (`obFila`):
  - `plus` **«Apunta un gasto en dos toques»** · «o hazle una foto al ticket»
  - `users` **«Comparte gastos en Juntos»** · «aunque los demás no tengan la app»
  - `sparkle` **«Y mucho más, cuando quieras»** · «cuentas, metas, presupuestos, agenda… te lo iremos enseñando»
- Campo «¿Cómo te llamas?» y su ayuda de hoy. Botón **«Empezar»**.

La tercera fila es la que cumple la condición desde el primer minuto.

**Pantalla 2 · «¿Por dónde empiezas?»**
- Sin texto debajo del título. 3 botones grandes (72 px, icono en círculo, título y frase):
  - `plus` **«Apuntar un gasto»** · «Lo que te has gastado hoy» → termina y abre `crearIr('gasto')`
  - `users` **«Compartir gastos con alguien»** · «Una cena, la casa, un viaje» → termina y abre `crearIr('compartido')` (si Juntos no está disponible, este botón no sale)
  - `bank` **«Poner mi banco al día»** · «Copia el saldo de la app de tu banco» → termina y abre la hoja de añadir cuenta
- Debajo, gris: «Lo demás lo encuentras en **Descubre PalomApp**, en Inicio y en Tú.»
- Pie: enlace **«Ir a Inicio»**. «Saltar» arriba hace lo mismo.
- Sin confeti aquí (la celebración es al completar «Primeros pasos»).

Al terminar (cualquier botón, «Saltar» o «Ir a Inicio»), `doObFinish` guarda además `nivel: 'basico'` y `nivelCambio: { d: hoy, por: 'alta' }` en el mismo `saveConfig` que `altaApp`.

### 6.2 Con invitación: 1 pantalla

- `obPasos` devuelve `['invite']`. La pantalla es la de hoy (`obInviteHtml`), sin cambios de texto. Con un solo paso **no se pintan los puntos** ni «Paso 1 de 1».
- «Unirme al grupo» (o «Aceptar») → al unirse, `doObFinish('grupo')` directamente: aterriza en el grupo con «Así funciona Juntos». **Sin pantalla del banco y sin «Todo listo».**
- «Ahora no» o «Seguir sin unirme» → la invitación queda aplazada (como hoy) y sigue la bienvenida sin invitación (§6.1).
- También queda en «Lo básico», con la tarjeta «Primeros pasos» del invitado (§2.1).

### 6.3 La cifra grande (invitado y cualquiera sin ingresos)

En el mes actual, si la persona **no ha apuntado nunca un ingreso** y **no tiene ninguna cuenta con saldo**, la tarjeta del mes no dice «Te queda»:

- Arriba: **«Gastos de este mes»**. Cifra en el **color normal del texto** (sin `neg`, sin rojo ni naranja): **«49,00 €»**. Sin barra.
- Debajo, si parte del gasto es de Juntos: «De ellos, 49,00 € son tu parte en Juntos.»
- Enlace: **«Apunta lo que cobras y verás cuánto te queda ›»** → `crearIr('ingreso')`.
- Con 0 € de gasto se queda como hoy («0,00 €» en gris y «Apunta lo que cobras y lo que gastas…»).
- En cuanto apunte un ingreso o ponga el saldo de un banco, vuelve a «Te queda este mes» (o a «En tu banco hoy», como hoy).

Vale para los dos niveles (decisión 1).

---

## 7. Pruebas que deben pasar

Nuevas en `tests/test38.js` (con `version:{tu:0,agenda:0,crear:0}`), y una variante «Lo básico» en `tests/capturas/revisar.js`.

| # | Qué se comprueba |
|---|---|
| T1 | Usuario sin `nivel`: el + tiene 4 grandes y la rejilla pequeña a la vista; Tú tiene las mismas filas fuera de «Más ajustes» que hoy; sale «Editar Inicio»; no sale «Primeros pasos» ni sugerencias. Las pruebas de hoy pasan sin cambios |
| T2 | Bienvenida nueva sin invitación: 2 pantallas; al terminar se guardan `nivel: 'basico'`, `nivelCambio.por: 'alta'` y `altaApp` en un mismo guardado |
| T3 | Cada botón de «¿Por dónde empiezas?» abre lo suyo; sin Juntos disponible no sale «Compartir gastos con alguien» |
| T4 | «Volver a ver la bienvenida» desde Tú: 4 pasos de hoy y **no** cambia `nivel` |
| T5 | Con invitación válida: 1 pantalla, sin puntos; «Unirme» lleva al grupo sin pasar por el banco; «Ahora no» sigue con las 2 pantallas |
| T6 | Cifra grande: con un compartido de 49 € y sin ingresos ni cuentas, sale «Gastos de este mes», «49,00 €» sin clase `neg`, la frase de Juntos y el enlace; con un ingreso, vuelve «Te queda este mes» |
| T7 | «Lo básico», + : 3 grandes, «Más opciones» plegado con los nombres; al tocar se ve la rejilla con Tarea; el enlace al catálogo funciona |
| T8 | «Lo básico», Tú: Reglas, Informes, Tu mes, Papelera, Excel, Copia y «Qué hay de nuevo» están en «Más ajustes»; la fila nombra lo que contiene; no sale «Botón "Antes"»; «Buscar un ajuste» encuentra «Papelera» y despliega «Más ajustes» |
| T9 | «Primeros pasos»: filas según haya invitación; marca y cuenta («2 de 3»); al completar, «¡Ya lo tienes!» y desaparece al día siguiente; «Ocultar» guarda `empiezaOculto`; a los 7 días se pliega a una línea |
| T10 | Mientras se ve «Primeros pasos» no salen las piezas de Inicio ni sugerencias |
| T11 | Catálogo: 12 filas, orden (no descubiertas primero), contador correcto con datos (p. ej. con una meta y una tarea: «2 de 12»); «Probar» guarda `descubierto` y abre la herramienta |
| T12 | La lupa encuentra «Descubre PalomApp», «Trayecto», «Informes» e «Inicio a tu gusto» en los dos niveles |
| T13 | Sugerencias: cada disparador de la tabla 3.2 con datos inventados; nunca el día 1; una al día (`sugHoy`); «Ahora no» aplaza 7 días; a la segunda no vuelve; no sale si ya está descubierta; no sale en «Todo» |
| T14 | Ningún `saveConfig` dentro de `render()` (se espía `saveConfig` durante un `render()`) |
| T15 | 30 días: con `por: 'alta'` y 30 días, pasa a «Todo» y sale la tarjeta una vez (`aviso30`); «Prefiero lo básico» vuelve con `por: 'tu'`; con `por: 'tu'` no caduca |
| T16 | Hoja «Qué ves en la app»: cambia en los dos sentidos, guarda `nivelCambio.por: 'tu'`, y no borra ni cambia ningún otro dato de `cfg()` |
| T17 | Pistas: una al día, no con hoja abierta, «Entendido» guarda `pistasVistas` |
| T18 | Iconos: ningún emoji en los textos nuevos (se busca con una expresión de emojis en el HTML de las pantallas nuevas) |
| C1 | Capturas a 375 × 667 y 390 × 844, claro y oscuro, nivel «Lo básico»: Inicio del primer día **sin scroll**, + plegado, Tú, catálogo, bienvenida 1 y 2, invitado con «Gastos de este mes». Sin textos cortados ni que se pisen |

---

## 8. Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Quitar del todo las filas de Tú y las opciones del + (lo de `docs/37`) | Incumple la condición del dueño: no se sabría que existen. Se pliegan **con su nombre a la vista** |
| Un «nivel» por herramienta (activar cada una por separado) | Multiplica las combinaciones que Calidad tiene que probar. Dos niveles y un catálogo bastan |
| Catálogo como pestaña nueva | Las 4 pestañas no se tocan (`docs/37`, C.5) |
| Sugerencias como avisos del móvil | Aún no hay avisos (`docs/25`) y molestan más. Mejor en Inicio, una al día |
| Marcar «descubierta» solo al tocarla en el catálogo | Quien ya usa algo vería «0 de 12». Se deduce de los datos |
| Guardarlo todo en un solo objeto `cfg().basico` | Dos guardados seguidos se pisarían el objeto entero. Claves sueltas |
| Contador con todas las funciones (unas 25) | «4 de 25» desanima. 12 herramientas con sentido para cualquiera; el resto, nombrado al pie |

## 9. Riesgos

- **Dos versiones de la app:** cada cambio futuro en el + o en Tú hay que probarlo en los dos niveles. Por eso «Lo básico» toca solo Inicio, el + y Tú.
- **Inicio con scroll a 375 px** si la tarjeta del mes crece (la frase del invitado son 2 líneas más). Lo vigilan C1 y la regla de «una sola tarjeta de ayuda».
- **Sugerencias que se notan como publicidad:** por eso una al día, nunca el primer día, y fuera para siempre a la segunda «Ahora no».
- **El paso a «Todo» a los 30 días puede descolocar** a quien estaba cómodo: la tarjeta lo explica y «Prefiero lo básico» lo deshace en un toque.
- **Escrituras en la configuración:** como mucho unas 2 al día por persona (`sugHoy` y alguna pista). Si dos móviles escriben a la vez la misma clave, gana el último; solo se perdería una pista o una sugerencia vista, nunca un dato.

## 10. Preguntas para el dueño

1. **(Bloquea §6.3)** La cifra «Gastos de este mes» para quien nunca apuntó un ingreso ni puso su banco: ¿para **todos** (recomendado: a un usuario de hoy solo le cambia si nunca apuntó un ingreso) o solo para los nuevos?
2. ¿Las sugerencias se quedan **solo en «Lo básico»** (recomendado) o siguen una a la semana también en «Todo»?
3. A los 30 días: ¿pasa **sola a «Todo» avisando** (recomendado) o le **preguntamos** y se queda como está hasta que conteste?
4. ¿La tarjeta «Descubre PalomApp» en Tú también para los usuarios de hoy? Recomendamos **sí**: no quita nada y les enseña lo que no usan. No bloquea.
5. ¿Te valen las 12 herramientas del catálogo y su orden? No bloquea.

## 11. Lo que no hemos podido averiguar o confirmar

- **No probado en ningún móvil ni en capturas nuevas:** las alturas de Inicio (614 px a 375 × 667) están calculadas sobre las capturas de `docs/img/37/`, no medidas con el diseño nuevo.
- Si los grupos guardan **quién los creó** (para la fila 3 del invitado, «Crea tu propio grupo»). Si no, se da por hecha al tener un grupo del que sea administrador; lo confirma Desarrollo.
- Cómo sacar de `kpisMes` **la parte de Juntos** del gasto del mes (frase «De ellos, … son tu parte en Juntos»). Si no es directo, la frase se quita y queda solo el enlace.
- El nombre exacto de la acción que crea una deuda nueva desde Dinero (en el código hay `deudaForm`); lo ajusta Desarrollo.
- Los umbrales de las sugerencias (3, 10, 15, 20 gastos; días 3 y 14) son **propuesta de Producto sin datos**: se revisan con el panel de `docs/37` §C.

## 12. Fuentes

- Propias (consultadas el 10/11/2026): `docs/37-primera-vez-iphone-kpis.md` §A y sus capturas `docs/img/37/`; `docs/08-asistente.md`, `docs/09-tu-ajustes.md`, `docs/10-agenda-mas.md`, `docs/21` (Inicio a tu gusto). Código leído sin tocar: `app.js` (`obPasos`, `doObFinish`, `obHolaHtml`, `obInviteHtml`, `empiezaPasos`, `empiezaHtml`, `crearHtmlV2`, `crearTicketBandaHtml`, `renderTuV2`, `heroMesHtmlV2`, `renderInicioNuevo`, `inicioPiezasHtml`, `IW_TIPOS`, `renderDineroV2`, `buscarHtml`, `BUSCAR_ACCIONES`, `saveConfig`).
- Sin fuentes externas: es una especificación de diseño.

Para el PDF: 1) tres móviles en fila (Inicio con «Primeros pasos» y la línea «Descubre», el + con «Más opciones» plegado, Tú con la tarjeta del contador) con flechas señalando «aquí se ve que hay más»; 2) boceto de la hoja del catálogo con 12 filas y «4 de 12»; 3) escalera «Día 1 → día 2 → día 3 → 10 gastos → día 30» con lo que aparece en cada escalón; 4) las 2 pantallas de bienvenida y la del invitado, lado a lado.

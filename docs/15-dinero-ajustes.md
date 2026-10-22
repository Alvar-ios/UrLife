# Dinero y Ajustes: propuesta de Producto y diseño (22/10/2026)

> **Actualizado el 22/10 por la noche** con lo que decidió el dueño: Dinero con pestañas y metas con forma, **aprobados**. Formas rehechas con el estilo de la app (2.3, `dinero3-formas-v2.png` y `dinero3-meta-v2.png`). La forma de una meta compartida será la misma para todo el grupo (columna nueva, la hace Datos). Festivos por comunidad y fiestas locales (3.3). «Pago fijo» como nombre (3.4).

Responde a los puntos 6 (Dinero) y 7 (Ajustes) de `13-feedback-22-10.md`. Sigue a `05-dinero.md` y `06-dinero-diseno.md`.

Imágenes en `docs/img/`, móvil de 375 × 667 px y datos inventados. Las de «hoy» son capturas reales de la app. Las de «propuesta» son una **maqueta aparte (PRUEBA)**, no la app.

| Archivo | Qué enseña |
|---|---|
| `dinero3-antes.png` | Dinero hoy (2,5 pantallas de scroll), el «Antes» con pestañas y el fallo al tocar un activo |
| `dinero3-pestanas.png` | **Recomendado:** Dinero con 4 fichas que hacen de pestañas: Cuentas, Metas y Deudas (y Metas en claro) |
| `dinero3-formas-v2.png` | **Vigente:** las 12 formas con trazo fino y el nombre escrito dentro, y la pestaña Metas (oscuro y claro) |
| `dinero3-meta-v2.png` | **Vigente:** la hoja de una meta y «Nueva meta» con las formas nuevas |
| `dinero3-formas.png`, `dinero3-meta.png` | Primera versión (trazo grueso, rellenos de colores y etiqueta encima). **Descartada** por el dueño: «muy grotescas» |
| `dinero3-inversiones.png` | Inversiones con la semana y líneas a elegir, la hoja de un activo y «Rentabilidad al año e inflación» |
| `dinero3-deudas.png` | Deudas con iconos y «Nueva deuda» |
| `ajustes-antes.png` | Cinco hojas de ajustes de hoy con lo que no encaja |
| `ajustes-perfil.png` | «Tu perfil» y «Aspecto» con Tema y Fondo (oscuro y claro) |
| `ajustes-recurrentes.png` | El campo «¿Cuándo?», el selector nuevo y «Un día fijo» |
| `ajustes-iconos.png` | 26 usos repetidos de iconos (y uno que falta) y su sustituto |

## 1. Conclusión

1. **Dinero vuelve a las pestañas, pero sin perder el resumen.** Las 4 cifras de arriba (Cuentas, Metas, Inversiones, Deudas) son a la vez el resumen y las pestañas. Con 2 cuentas, 4 metas o 2 deudas, cada pestaña cabe en una pantalla. Hoy, la pantalla única mide 1.684 px (2,5 pantallas).
2. **Las metas pasan a ser una forma que se llena** (casa, maleta, coche, tarro…), dibujada con el mismo trazo fino que los iconos, con relleno suave del color de la app y el nombre escrito dentro. La forma se elige sola por el nombre y se puede cambiar. Sustituye al emoji y a las variantes Camino y Anillos. La hoja de cada meta enseña la forma y todo lo demás sin «Más».
3. **Inversiones: semana, varias líneas y un arreglo.** Se añade «1S» y se pueden ver a la vez «Total» y cada activo, cada uno de su color. Tocar un activo abre su hoja. El fallo de hoy es una línea de código (punto 3.4). La rentabilidad anual y la inflación pasan a una fila que abre su hoja.
4. **Ajustes: un perfil, un fondo a elegir y un selector propio para los recurrentes.** Hay 4 reglas nuevas, entre ellas «el penúltimo día hábil» y «cada X días». Los días hábiles podrán saltarse los festivos de tu comunidad y tus 2 fiestas locales, con una tabla del BOE dentro de la app. Lo que hoy es «Gasto fijo» pasa a llamarse «Pago fijo». Hemos encontrado **26 iconos usados para cosas distintas** (y uno que falta): proponemos 24 iconos nuevos con el mismo trazo.
5. **Supabase solo cambia en una cosa:** la columna opcional `forma` en `objetivos_compartidos`, para que todo el grupo vea la misma forma (la hace Datos). Los festivos van en una tabla fija dentro de la app, sin servidor.

## 2. Dinero

### 2.1 Estructura (`dinero3-pestanas.png`)

| Pieza | Cómo | Medidas |
|---|---|---|
| Cabecera | Igual que hoy: «Dinero», fecha, buscar y avatar | 64 px |
| «Lo que tienes» | Una tarjeta de una sola fila: «Lo que tienes» + `ic('info')` (abre «¿Cómo se calcula?», que ya existe), la cifra y, a la derecha, «cuentas + invertido − lo que debes» | 76 px. Cifra de 28 px |
| Fichas-pestañas | 4 fichas en rejilla `repeat(4, minmax(0,1fr))`. En cada una: icono de 16 px, nombre (11 px) y cifra (14 px). «Cuentas 5.340 €», «Metas 3 metas», «Inversiones 1.150 €» (color `--savings`), «Deudas −5.040 €» (`--debt`). La elegida lleva `--accent-soft`, borde `--accent` y un piquito debajo | 70 px de alto, separación de 6 px. Se quedan fijas arriba al bajar (`position: sticky`) |
| Cambio de pestaña | Tocar una ficha o deslizar a los lados. El cuerpo se desliza como en Movimientos (`movDeslizar`), sin repintar la pantalla entera. Se recuerda la última pestaña (`S.dineroSub`); la primera vez, Cuentas | Animación de 250 ms. Sin deslizar encima de la gráfica |
| Atajos de Inicio | «Ver metas», inversiones y deudas abren Dinero en esa pestaña (`dmIr` pasa a cambiar de pestaña) | — |
| Usuario nuevo | Las fichas sin datos dicen «Añadir» y la pestaña enseña la fila de empezar que ya existe | — |
| Se quita | La pantalla de un vistazo (`renderDineroV2`), las variantes Camino, Tarros y Anillos, la nota larga de «Tus metas suman…» (pasa a «¿Cómo se calcula?») | — |

**Botón «Antes»:** `VERSIONES.dinero` = `[['nueva','Nueva'], ['antes','Antes']]`, donde «Antes» es la pantalla con pestañas antigua (`renderDinero`), la que gustaba. Las pruebas que hoy usan `version:{dinero:3}` pasan a `{dinero:1}`.

### 2.2 Cuentas, más compactas y visuales

- **Barra de reparto** arriba (8 px) con el color de cada cuenta y la leyenda «BBVA 39 % · ING 58 % · Efectivo 3 %».
- **Mosaico de 2 columnas.** Cada cuenta es una tarjeta de 165 × 88 px con una franja de 4 px de su color. Lleva un icono por tipo de cuenta en un cuadrado de 26 px (Corriente `bank`, Ahorro `piggy2`, Efectivo `cash`, Tarjeta `card`, Inversión `trendUp`, Otra `wallet`), el nombre, el saldo (18 px) y una línea: «Corriente · principal», «1.350 € apartados», «no suma» o «Pon el saldo».
- La última tarjeta es «+ Añadir cuenta», con borde de puntos. Debajo van dos botones: «Traspaso» y «Cuadrar».
- Al tocar una cuenta se abre `cuentaVerHtml`, que ya existe.
- Con una sola cuenta: una tarjeta y «Añadir cuenta». La pestaña Cuentas sale siempre (hoy desaparece si solo hay una).

### 2.3 Metas con forma que se llena (`dinero3-formas-v2.png`, `dinero3-meta-v2.png`)

**Estilo (v2, tras el «no muy grotescas» del dueño):**

| Pieza | Cómo |
|---|---|
| Contorno | 1,8 px reales, como `ICONS`: `stroke-width="1.8"` con `vector-effect="non-scaling-stroke"` (el grosor no crece con el tamaño), extremos redondos, color `--text-muted`. Cuando la meta está conseguida, el contorno pasa a `--accent` |
| Detalles | Las correas de la maleta, la puerta de la casa o las caras del diamante, a 1,2 px, en `--text-faint` y al 55 % |
| Relleno | **Siempre del color de la app** (`--accent` de la paleta elegida), suave: al 24 % en oscuro y al 16 % en claro. Encima, la línea de la superficie con una ola suave, a 1,8 px y en `--accent`. Nada de naranja, verde ni rojo en el relleno: el estado («Para junio: 227 €/mes», en `--warn`) va solo en el texto de debajo |
| Conseguida | Llena, con el contorno en `--accent` y un círculo de 22 px con `ic('check')` en la esquina. Nada de verde |
| Nombre | **Escrito dentro**, sin etiqueta: Inter 650 a 11,5 px (en px reales, no en unidades del dibujo), `--ink`, centrado, 2 líneas como máximo, con un halo muy suave de `--paper-raised` (`text-shadow`) para que se lea encima de la ola. Si la superficie del líquido cae a menos de 11 unidades del sitio del nombre, el nombre se aparta 13 unidades hacia arriba o hacia abajo, para que la ola nunca lo tache |
| En la hoja | El nombre va en el título y dentro de la forma va el % (22 px, `Inter Display` 750) |
| En «Su forma» | Las 12 formas a 38 px con el mismo trazo; solo la elegida va rellena |

Cada forma es un SVG propio con un viewBox de 100, la zona que se llena (`clipPath`), el contorno, los detalles y el sitio del nombre. Están en la maqueta: `rig/d15/formas.js` (zonas) y `formas2.js` (estilo v2).

| Clave | Forma | Se elige sola si el nombre tiene… |
|---|---|---|
| `avion` | Ventanilla de avión | vuelo, avión |
| `maleta` | Maleta | viaje, vacaciones, escapada, playa, japón, interrail |
| `casa` | Casa | casa, piso, hipoteca, entrada, vivienda, alquiler, reforma |
| `coche` | Coche | coche, moto, carnet |
| `anillo` | Diamante | boda, anillo, pedida |
| `regalo` | Regalo | regalo, navidad, cumple, reyes |
| `estudios` | Libro | estudios, máster, curso, universidad, beca, oposición |
| `mascota` | Huella | mascota, perro, gato, veterinario |
| `colchon` | Escudo | colchón, emergencia, imprevistos, «fondo de» |
| `tecno` | Portátil | ordenador, móvil, portátil, tele, consola, iPhone, tablet |
| `hucha` | Hucha | hucha, ahorro |
| `tarro` | Tarro (**por defecto**) | ninguna de las anteriores |

Las pistas se buscan en este orden con `normName`, como `EMOJI_PISTAS`. La función nueva sería `formaSugerida(nombre)`.

**En la pestaña Metas:** mosaico de 2 columnas, cada meta en una tarjeta de unos 165 × 175 px.
- **La forma**, de 104 px, lleva el relleno hasta el % con el estilo de arriba. El color del estado (`DM_ESTADO_COLOR`) se usa solo en la frase de debajo.
- **El nombre va escrito dentro** de la forma.
- **Debajo de la forma:** «45 %» (16 px) y «1.350 / 3.000 €». Después, el estado en una línea (`metaEstado2`, igual que hoy).
- **«Aportar»** es un botón redondo «+» de 34 px en la esquina, con una zona táctil de 44 px.
- **Al tocar la tarjeta** se abre la hoja de la meta.
- **Las conseguidas** se pliegan en «Conseguidas (N)». Las compartidas llevan `ic('users')` en la esquina de la forma.
- **Animaciones:** se reutilizan las de los tarros (`dm-liq`). Al verse, el líquido sube en 900 ms. Al aportar, caen gotas.
- **Con «Reducir movimiento»** activado, todo queda quieto.

**La hoja de una meta** (sustituye a `metaVerHtml`, ya sin «Más»):

| Bloque | Texto exacto |
|---|---|
| Arriba | Nombre como título, lápiz (editar) y cerrar |
| Forma de 132 px con el % dentro | A la derecha: «Vas bien» / «Vas justo» / «Sin fecha» / «La fecha pasó» / «¡Conseguida!» (color del estado), «1.350 €» (26 px), «de 3.000 € · hasta junio de 2027» |
| 4 cifras (2 × 2) | «Te falta 1.650 €» · «Quedan 8 meses» (sin fecha: «A este ritmo · jun 2027») · «Apartas al mes · unos 150 €» (sin ritmo: «—») · «Para llegar a tiempo · 227 €/mes» (sin fecha: «Ponle fecha») |
| Consejo (uno solo) | «Si sigues así llegas en septiembre de 2027, 3 meses tarde. Con 77 € más al mes llegas en junio.» Si vas bien: «Si sigues así llegas en abril, 2 meses antes.» |
| Hitos | La pista con rombos y su nombre debajo («Vuelos · 1.000 €»), en `--accent` si ya los pasaste |
| Botones | «+ Aportar» (grande) · «He usado dinero» · «Movimientos» (lo que hoy es «Elegir movimientos») |
| Al final | «Últimas aportaciones» (3) con «Ver las N», lo usado y, si hay parte invertida, la línea de rentabilidad de hoy |

En «Aportar a…» y en los avisos, el emoji del título se cambia por la forma en pequeño (28 px). El «🎉» de «¡Meta conseguida!» se queda: es la única celebración.

**«Nueva meta» y «Editar meta»** sustituyen a `metaEditorHtml`, que hoy usa campos del sistema y palabras como «Objetivo» o «Rentabilidad anual esperada»:
- **Una vista previa** de la forma con el nombre y el texto «Forma elegida por el nombre: Maleta. Toca otra si quieres.».
- **Campos:** «Nombre», «Su forma» (rejilla de 6 × 2, de 52 px, con la marca «sugerida»), «Cuánto quieres juntar» y «Ya tenías · opcional», con el importe con coma (`importeCampo`).
- **«Para cuándo · opcional»**, con chips: «Sin fecha», «dentro de 6 meses», «dentro de 1 año» y «Otra», que abre el selector de mes y año (2.5).
- **Plegado:** «Etapas (hitos) y rentabilidad ›».
- **Botón:** «Crear meta» o «Guardar».

**Dónde se guarda:**
- **Metas personales:** en `cfg().ahorro[i].forma` (la clave). Sin `forma`, se usa `formaSugerida(nombre)`, así que al renombrar cambia sola si nunca la elegiste. El `emoji` antiguo se queda guardado, pero deja de verse.
- **Metas compartidas (decidido):** la misma forma para todo el grupo, en una **columna nueva y opcional `forma text`** de `objetivos_compartidos`. La hace Datos y seguridad. Vacía significa «la que sale del nombre», así que las metas que ya existen no cambian. Quien pueda editar la meta puede cambiar la forma, y `data-layer.js` no tiene que traducir nada, porque el nombre es igual en los dos lados. Hasta que exista la columna, la app no debe mandar el campo, porque si no, guardar falla (`CLAUDE.md`).

### 2.4 Inversiones (`dinero3-inversiones.png`)

**Fallo encontrado.** Al tocar un activo se ejecuta `verActivo` (`app.js`, línea 8770). Ese código pone la pestaña Movimientos pero no cambia la vista. Como Movimientos entra en «Resumen» (`S.movVista = 'resumen'`), se ve el resumen con un filtro escondido. Además, no recuerda de dónde vienes. Arreglo inmediato:

```js
verActivo: ([nombre]) => { irMovs({ tipo: 'Inversión', periodo: 'todo' }); S.movQuery = nombre; S._movBuscando = true; render(); },
```

Así va a la Lista, filtrada y con «‹ Dinero» para volver; es lo mismo que ya hace `movDonde`. Luego, con la tanda 3, tocar un activo abre su hoja y este código queda para el botón «En Movimientos».

**Posible segundo fallo (sin comprobar).** `cargarHistorico` solo repinta si `dineroSub() === 'inversiones'`. En la pantalla de un vistazo de hoy eso no se cumple, así que la gráfica podría quedarse en «Cargando evolución…» hasta el siguiente repintado. Con las pestañas se cumple solo.

| Pieza | Cómo |
|---|---|
| Tarjeta de la gráfica | Igual que hoy (Valor \| %, cursor con el dedo). Periodos: **«1S» (7 días)**, 1M, 3M, 1A y Máx; se añade `['1s','1S',7]` a `PERIODOS_INV`. Debajo, chips para elegir las líneas: «Total» (color `--accent`) y uno por activo con su color fijo (`colorActivo`: azul `#2E9BD6`, dorado `#E6B422`, rosa `#E86A9A`, turquesa `#4FB3A9`, morado `#C25BD8`). Ni verde ni rojo (son «ganas» y «pierdes») ni naranja. Hasta 4 líneas a la vez: al tocar una 5.ª, aviso «Como mucho 4 líneas a la vez». Por defecto, solo «Total» |
| Qué dibuja cada línea | En «Valor»: participaciones acumuladas × cierre de cada día, en €. En «%»: lo que ha cambiado desde el principio del periodo (en un activo es su precio; en «Total», la rentabilidad de hoy). Los datos ya llegan por activo (`S.historico.series[id]`): no hace falta tocar el servidor |
| Cabecera | «Esta semana · todo junto», «+1,8 %» y «+20,40 € en 7 días». Con varias líneas, al arrastrar el dedo se ven los valores de cada una debajo de la gráfica |
| Tus activos | Filas con icono por tipo (Fondo `pie`, Acción `velas`, Cripto `coin`, Otro `trendUp`) del color de su línea, «Fondo · aportaste 800 €», valor y ganancia. Tocar abre la **hoja del activo** |
| Hoja del activo (nueva, `activoVerHtml`) | Icono, nombre y «Criptomoneda · BTC». Valor y ganancia. Gráfica pequeña con 1S…Máx. 4 cifras: «Aportaste», «Tienes» (participaciones), «Te costó de media», «Precio de ayer». «Tus aportaciones» (tocar edita). Botones: «+ Invertir más» (formulario de Inversión con el activo ya puesto), «En Movimientos» (el `verActivo` arreglado) e «Precios». Sin precio: «Buscar el activo» |
| Rentabilidad e inflación | Salen de la vista principal. Queda una fila: «Rentabilidad al año e inflación · +6,1 % al año · le ganas a la inflación» (verde) o «· la inflación te gana» (`--warn`). Abre una hoja con lo de `inflacionV2Html` y, nuevo, «Cada activo, al año» (una barra por activo). Con menos de 30 días: «Necesitas un mes de historia para calcularlo.» |
| «De dónde salen los precios» | Enlace pequeño al final, con `ic('info')` (hoy usa `alert`) |

Mide 1,1 pantallas con 3 activos (maqueta). La gráfica no deja deslizar entre pestañas.

### 2.5 Deudas (`dinero3-deudas.png`)

- **Iconos de la app en lugar de emojis.** Hay 7: Coche `coche2`, Casa `home`, Móvil `phone`, Tarjeta `card`, Estudios `cap`, Alguien cercano `manoMoneda` y Otra `deuda`.
- **Cómo se ven:** en un cuadrado de 36 px con fondo `--debt` al 18 % y el icono en `--debt` (beige).
- **Se guarda** en `cfg().deudas[i].icono`. Sin icono, se elige por el nombre (`DEUDA_PISTAS`):
  - coche, moto → Coche
  - casa, piso, hipoteca, reforma → Casa
  - móvil, ordenador, tele, consola → Móvil
  - tarjeta, crédito, aplazado → Tarjeta
  - estudios, máster, matrícula → Estudios
  - amigo, familia, mamá, papá, hermano → Alguien cercano
  - si no encaja nada → Otra
- **Los emojis que ya eligieron los usuarios** se traducen: 🚗→Coche, 🏠→Casa, 📱→Móvil, 💳→Tarjeta, 🎓→Estudios, 🤝→Alguien cercano. Así nadie pierde lo que eligió.
- **«Nueva deuda»** cambia «Elige un dibujo» por «Su icono» (7 botones de 44 px) y la nota «Se elige sola por el nombre.».
- **«Acabar en · opcional»** deja el campo del sistema, que hoy enseña «--------- ----», por el selector de mes y año: dos columnas, meses (ene…dic) y año con − y +.
- **Las deudas compartidas** usan su icono por nombre y `ic('users')` pequeño en la esquina.

## 3. Ajustes

### 3.1 Perfil y personalización (`ajustes-perfil.png`)

**Perfil.** «Editar», en la cabecera de Tú, abre «Tu perfil» en lugar de «Tu nombre».
- **Avatar** de 86 px, con un selector «Iniciales | Un dibujo». Iniciales: hasta 2 letras, de las dos primeras palabras. Dibujo: 12 iconos de la app en una rejilla de 6 × 2, de 44 px.
- **«Color»:** los 6 de `COLORES_PERSONA_NUEVO`, ya comprobados con letra blanca.
- **«Tu nombre»**, como hoy.
- **Nota:** «Tu nombre lo ven las personas con las que compartes. El dibujo y el color, de momento, solo tú.»
- **Botones:** «Cancelar» y «Guardar».
- **Dónde se guarda:** en `cfg().perfil = {avatar:'iniciales'|'dibujo', icono, color}`, sin migración. Se ve en la barra de arriba y en Tú. En Juntos, los demás siguen viendo `colorPersona(uid)` y tu inicial.
- **Foto: descartada** por ahora. Necesita guardar archivos en el servidor, pensar en la privacidad y tiene coste.

**Aspecto y sensaciones**, de arriba abajo:
- **Color:** 5 círculos de 40 px con el nombre debajo. Hoy los nombres van pegados al borde a 375 px.
- **Tema:** «Auto | Claro | Oscuro». Se queda también la fila de Tú.
- **Fondo (nuevo):** tres tarjetas con una vista en pequeño: «Neutro», «Con tu color» y «Negro puro» (en claro, «Blanco»).
- **Cifras:** en una fila que se desliza de lado.
- **Vibración y Sonido.**
- **Botón «Listo».**

**Cómo se programa el Fondo:**
- `data-fondo="neutro|tinte|puro"` en `<html>`, guardado en el dispositivo (`lsSet('fondo')`), como la paleta.
- «Con tu color»: `--paper: color-mix(in srgb, var(--pl) 5%, #F5F5F2)` en claro y `color-mix(in srgb, var(--pd) 6%, #0A0A0C)` en oscuro. `--paper-sunken` se tiñe igual.
- «Negro puro»: `--paper: #000` y `--paper-raised: #141416`.
- Se actualiza también `meta[name=theme-color]` en `applyLook`.

### 3.2 Iconos repetidos (`ajustes-iconos.png`)

Hoy hay 52 iconos en `ICONS`, 16 en `CATS_STD` y 11 pistas en `CAT_ICONOS`, y varios se usan para dos cosas o más. Los peores:

| Icono de hoy | Se usa para… | Propuesta |
|---|---|---|
| `card` | La pestaña Dinero, Deudas y Métodos de pago | Dinero → `wallet`. Deudas → `deuda` (nuevo). Tarjeta y métodos de pago siguen con `card` |
| `flag` | Metas, «Volver a ver la bienvenida», hitos, prioridad de tarea | Metas → `target`. Bienvenida → `replay`. `flag` se queda para hitos y prioridad |
| `sparkle` | Qué hay de nuevo, «Una idea», días sin gastos, previsión, «Aprender de mi historial» | Novedades → `megafono`. Idea → `bulb`. Días sin gastos → `estrella`. `sparkle` = «lo hace la app sola» |
| `tag` | Categorías, Reglas, «Otros», la categoría que más sube | Reglas → `autoTag` |
| `calendar` | Agenda, Tu mes, Gasto fijo, fechas | Tu mes → `calRango`. Pago fijo → `repeat`, como los recurrentes |
| `download` | Importar y Copia de seguridad | Importar → `fileIn`. Copia → `archive` |
| `list` | Movimientos, Importaciones, «¿De dónde sale?» | Importaciones → `history`. «¿De dónde sale?» y «¿Cómo se calcula?» → `info` |
| `chart` | Invertir, Acciones y **Moneda** | Moneda → `moneda`. Invertir → `trendUp`. Acciones → `velas` |
| `piggy` | Apartar (y no es una hucha: es una flecha que sube) | El trazo actual pasa a llamarse `trendUp`; `piggy2` es una hucha de verdad |
| `arrowUp`, `bolt`, `heart`, `shield`, `swap`, `repeat` | Ingreso y Fondos; Suministros y Cripto; Salud y «Me gusta»; Seguros y Verificación; Traspaso y botón «Antes»; recurrentes y Suscripciones | Fondos → `pie`. Cripto → `coin`. Me gusta → `sonrisa`. Verificación → `candado`. «Antes» → `comparar`. Suscripciones → `play` |
| `car` | Transporte | Redibujado (`coche2`): hoy parece una cesta |

**24 iconos nuevos:** `deuda`, `target`, `replay`, `megafono`, `bulb`, `estrella`, `autoTag`, `calRango`, `fileIn`, `archive`, `history`, `info`, `moneda`, `velas`, `piggy2`, `pie`, `coin`, `sonrisa`, `candado`, `comparar`, `play`, `coche2`, `cash`, `phone`. A ellos se suman `cap` y `manoMoneda`, para deudas. Están dibujados en la maqueta (`rig/d15/base.js`, objeto `NUEVOS`) con el mismo trazo de 1,8 y extremos redondos. Desarrollo puede copiarlos tal cual a `ICONS`. Ocupan unos 6 KB más en `app.js`.

### 3.3 Cobros y pagos recurrentes (`ajustes-recurrentes.png`)

**Reglas de hoy** (`fechasMesRegla`, `ocurrencias`):
- un día fijo, con ajuste de fin de semana
- primer día hábil y último día hábil
- el n.º día de la semana (1.º–4.º o último)
- quincenal (el 15 y el último)
- cada N semanas y cada N meses

**Lo que falta y su propuesta:**

| Regla | Cómo se guarda | Texto (`reglaTexto`) |
|---|---|---|
| **El penúltimo día hábil** (nueva) | `{t:'habilFin', n:2}` (n = 1 es lo mismo que `ultHabil`) | «El penúltimo día hábil del mes» |
| **Otro día hábil** (nueva) | `{t:'habil', n:3}` desde el principio o `{t:'habilFin', n:3}` desde el final | «El tercer día hábil del mes» / «El antepenúltimo día hábil del mes» |
| **Dos días al mes** (amplía «quincenal») | `{t:'diasMes', dias:[1,15], ajuste}` | «Los días 1 y 15 de cada mes» |
| **Cada cierto número de días** (nueva) | `{t:'dias', cada:28, ancla}`, igual que `semanas` | «Cada 28 días» |
| El último día del mes | `{t:'dia', dia:31}` (ya funciona); solo cambia el texto | «El último día de cada mes» |
| Penúltimo lunes (amplía `nesimo`) | `n: -2` | «El penúltimo lunes de cada mes» |

`aprenderRegla` prueba también `habilFin` 2 y 3, `habil` 2 y 3 y `nesimo -2`. `mismaRegla` compara también `dias`.

**Festivos (opción, por comunidad y con tus fiestas locales).** Hoy «día hábil» solo se salta los sábados y domingos.

| Pieza | Propuesta |
|---|---|
| De dónde salen | Del **BOE**: cada octubre, la Dirección General de Trabajo publica las fiestas del año siguiente, las nacionales y las de cada comunidad, en una sola tabla anexa. La de 2027 salió en el BOE el 13/10/2026 (resolución del 8/10/2026). La de 2026 salió en octubre de 2025 |
| Cómo se guardan | Una **tabla fija dentro de `app.js`**, sin servidor ni servicio de pago: `FESTIVOS = { 2026: { ES: ['01-01', …], MD: ['05-02', …], CT: [...], … }, 2027: {...} }`. Son 17 comunidades más Ceuta y Melilla: unas 250 fechas y unos 3 KB. Desarrollo la copia del BOE y la revisa con un segundo calendario |
| Nacionales de 2027 | 1 ene, 6 ene, 26 mar (Viernes Santo), 1 may, 12 oct, 1 nov, 6 dic, 8 dic y 25 dic. Cambian cada año (en 2027 el 15 de agosto cae en domingo y no aparece), así que **no se calculan con una regla**: se copian del BOE |
| Fiestas locales | Cada municipio tiene 2. Las publica cada comunidad en su boletín y son miles, así que no caben en la app. **Las pone el usuario:** «Fiestas de tu pueblo · opcional», 2 fechas con el selector de días. En enero, «Estos días» recuerda: «Pon las fiestas locales de 2027» |
| Elegir la localidad | Una fila nueva, «Festivos», en la hoja de Cobros y pagos recurrentes (y desde Tú → «Tu mes»). Abre «¿Dónde trabajas?»: una lista de tarjetas con círculo con las 19 comunidades y una búsqueda arriba; luego, las 2 fiestas locales. Se dice «trabajas» porque los bancos y las nóminas siguen el calendario del sitio de trabajo |
| Encendido | Con un interruptor: «Saltar festivos en los días hábiles», **apagado** al principio. Al encenderlo, sale «Así cambian tus fechas» con la próxima fecha de cada recurrente antes y después |
| Dónde se guarda | `cfg().festivos = { on: true, zona: 'MD', locales: { 2027: ['2027-05-15', '2027-09-08'] } }`, privado y sin migración |
| Qué cambia en el cálculo | `esFinde(d)` pasa a `noHabil(d)` = fin de semana o festivo (nacional, de tu comunidad o local), dentro de `fechasMesRegla` y `ajustarFinde`. «Si cae en fin de semana» pasa a decir «Si cae en fin de semana o festivo» |
| Años sin tabla | Si la app aún no tiene un año (por ejemplo, 2028), ese año solo salta los fines de semana. En la hoja aparece: «Aún no tenemos los festivos de 2028». Desarrollo añade el año cada octubre, cuando sale el BOE |

Alternativa descartada: pedir los festivos a un servicio gratuito como Nager.Date (`date.nager.at`). No pide clave, pero según un catálogo de APIs no deja que una web lo llame directamente (CORS). Además añade una dependencia externa y no hemos confirmado que tenga los festivos por comunidad. Como mucho, puede servir para comprobar la tabla.

**El selector, con el formato de la app:**
- **El campo** deja de ser un desplegable y pasa a ser un botón de 64 px: `ic('repeat')` en un cuadrado `--accent-soft`, la regla en negrita, «Próximos: jue 29 oct · jue 26 nov · mié 30 dic» y `chevR`.
- **Al tocarlo**, la misma hoja cambia de vista (`updateSheet`, `FORM.paso = 'cuando'`) con «‹» para volver.
- **Título:** «¿Cuándo te suele llegar?» o «¿Cuándo se paga?».
- **Las opciones** son tarjetas con círculo (las clases `tumes-op` de «Tu mes», que ya gustan), en dos grupos. Cada una lleva un ejemplo y el día siguiente que tocaría.
  - «CADA MES»: «Un día fijo», «El último día del mes», «El primer día hábil», «El último día hábil», «El penúltimo día hábil», «Otro día hábil», «Un día de la semana».
  - «OTRO RITMO»: «Dos días al mes», «Cada cierto número de días», «Cada semanas, meses o años».
- **Los datos de cada regla**, sin teclado ni desplegables:
  - **Día del mes:** rejilla de 7 columnas (1–31 y «El último»), casillas de 40 px de alto.
  - **Ordinal:** chips «1.º 2.º 3.º 4.º Penúltimo Último».
  - **Día de la semana:** círculos «L M X J V S D» de 40 px.
  - **«Cada…»:** botones − y + de 44 px.
  - **«Si cae en fin de semana»:** «Ese día | El viernes antes | El lunes después».
- **Abajo**, 3 fichas con las próximas fechas y el botón «Usar esta».
- **El mismo componente se reutiliza** en «Tu mes» («Cobro el día», hoy un desplegable), en «Acabar en» de las deudas y en «Para cuándo» de las metas (el selector de mes y año).

### 3.4 Revisión de cada hoja de ajustes (`ajustes-antes.png`)

| Hoja | Qué no encaja | Arreglo |
|---|---|---|
| Cuentas y saldos | Un punto de color en vez de icono | Icono por tipo de cuenta con su color, como el mosaico de Dinero |
| Categorías y presupuestos | Todos los iconos del mismo tono rojizo, no del color de su categoría como en Movimientos; presupuesto sin coma | `--cc: colorCat(nombre)`; `importeCampo` |
| Reglas de categorías | «Tipo» y «Categoría» son desplegables del sistema; «Añadir» está abajo, junto a «Listo», lejos del formulario; mismo icono que Categorías | Chips de tipo y chips de categoría con icono (los del formulario de gasto); «Añadir regla» justo debajo; icono `autoTag` |
| Recurrentes (lista) | Puntos en vez de iconos; «Último día hábil del mes · pró…» se corta; «Factura o pago» ocupa dos líneas | Icono (`arrowUp` para ingresos, el de su categoría para pagos); la regla en una línea y «Próximo: vie 30 oct» en otra; botones «Ingreso fijo» y «Pago fijo» |
| Recurrentes (editar) | Título «Editar»; el chip «Nómina» repite el campo; importe sin coma; «Categoría» y «¿Cuándo…?» son desplegables; dice «Factura o pago», pero el botón + dice «Gasto fijo» | Título = nombre; chips solo si hay más de una fuente; `importeCampo`; chips de categoría; selector 3.3; «Pago fijo» en todas partes (ver abajo) |
| Tu mes | Bien (es el modelo). Solo «Cobro el día» es un desplegable | Rejilla de días del selector |
| Importar | Bien; icono `download` repetido | `fileIn` |
| Papelera | Vacía, es una tarjeta de texto sin icono | Estado vacío de la app: `trash` en un círculo suave y «Está vacía» |
| Aspecto | Nombres de color apretados; el Tema está fuera | 3.1 |
| Moneda | Botón «Hecho» (el resto dice «Listo»); «CHF CHF»; icono `chart` | Tarjetas con círculo «Euro · €» (con `MONEDAS[k].n`); «Listo»; icono `moneda` |
| Métodos de pago, Fuentes de ingreso, Categorías de tareas | Sin iconos; se borra con una X (que en toda la app significa «cerrar»); «Vacío. Añade el primero abajo.» | Papelera pequeña con «Deshacer»; iconos en métodos (Efectivo `cash`, tarjetas `card`, Transferencia `bank`, Bizum `phone`); «Aún no tienes ninguno. Toca Añadir.» |
| Importaciones | Bien; icono `list` repetido | `history` |
| Grupos y personas | «Invitar a una persona» ocupa dos líneas | «Invitar» |
| Tu nombre | Solo el nombre | «Tu perfil» (3.1) |
| Nueva meta, Nueva deuda | Campos del sistema, «Objetivo», emojis, «--------- ----» | 2.3 y 2.5 |

**Nombre para lo que hoy es «Gasto fijo» / «Factura o pago»: «Pago fijo».**

| Opción | A favor | En contra |
|---|---|---|
| **«Pago fijo» (recomendado)** | Vale para recibos, facturas y suscripciones; hace pareja con «Ingreso fijo»; es corto y cabe en el botón + y en una ficha | Ninguno importante |
| «Gasto fijo» (hoy, en el botón +) | Ya se usa | Suena a una categoría de gasto y choca con «Gasto» a secas en el mismo menú |
| «Factura o pago» (hoy, en Ajustes) | — | Largo (ocupa dos líneas) y deja fuera las suscripciones |
| «Recibo» | Muy de banco español | Una suscripción pagada con tarjeta no es un recibo |
| «Suscripción» | — | El alquiler o la luz no lo son |
| «Cargo fijo» | — | Jerga de banco |

Dónde cambia (son solo textos; el dato sigue siendo `tipo: 'Factura'`, sin migración):
- `tipoTxt` → «Pago fijo», y `TIT_NUEVO` → «Nuevo pago fijo».
- El botón + → «Pago fijo», con la línea pequeña «recibos, facturas y suscripciones».
- En la hoja de recurrentes, «Facturas y pagos» → «Pagos fijos», y el selector del editor → «Ingreso fijo | Pago fijo».
- En las pruebas, hay que cambiar 10 archivos que buscan estos textos: `test9`, `test18`, `test19`, `test20`, `test21`, `test24`, `test25`, `test28`, `test30` y `test63_tu_agenda`.
- Las novedades antiguas no se tocan.

## 4. Tandas de trabajo

| Tanda | Qué | Esfuerzo | «Antes» | Pruebas que cambian |
|---|---|---|---|---|
| 0 | Arreglo de `verActivo` (una línea) | Muy bajo | No | Añadir una prueba |
| 1 | Dinero con fichas-pestañas, mosaico de cuentas, deudas con iconos | Medio | Sí (las pestañas antiguas) | `test57_dinero`, `test58_calidad_dinero`, `test69_calidad_tarjetas` y las que fijan `version:{dinero:3}` |
| 2 | Formas de meta (estilo v2), hoja de la meta, «Nueva meta». La forma de las compartidas, cuando Datos haya creado la columna `forma` | Medio-alto | Dentro de la tanda 1 | `test57`, `test58` y las de metas (`test15`, `test18`, `test26`) |
| 3 | Inversiones: 1S, líneas a elegir, hoja del activo, hoja de rentabilidad | Medio | No | Las de inversiones (`test29`, `test30`, `test35` y otras que buscan «Inversión») |
| 4 | 24 iconos nuevos y cambios de uso | Bajo | No | Las que buscan un icono por nombre, si hay |
| 5 | Reglas nuevas, selector y su uso en Tu mes; festivos (tabla 2026–2027, comunidad y locales) | Medio | No | `test.js`, `test9.js` (reglas), `test43_tu_mes`, `test44_calidad_tu_mes` y una prueba nueva de festivos |
| 5b | «Pago fijo» en todos los textos | Bajo | No | Los 10 archivos de 3.4 |
| 6 | Tu perfil y Fondo | Bajo | No | `test63_tu_agenda` (tuNombre) |
| 7 | Arreglos de la tabla 3.4 | Bajo | No | Las que miran esos textos |

Orden recomendado: 0 → 1 → 2 → 4 → 3 → 5 → 6 → 7. La tanda 0 se puede publicar sola hoy mismo.

## 5. Recomendaciones

- **Fichas que son pestañas:** dan el orden que gustaba del «Antes» y dejan a la vista las 4 cifras que da la pantalla de un vistazo. Las dos cosas que pidió el dueño.
- **El tarro como forma por defecto:** es el que gustó y vale para cualquier meta.
- **El selector de «¿Cuándo?» en un solo componente:** sirve para cuatro sitios y quita los desplegables del sistema de una vez.
- **Perfil guardado en privado:** se puede publicar sin tocar Supabase. La forma de las compartidas sí necesita la columna de Datos.
- **Festivos en una tabla fija:** sin red, sin coste y sin sorpresas. El precio es acordarse de añadir un año cada octubre.

## 6. Riesgos

- **Tercera versión de Dinero en una semana.** Hay que contarlo en las novedades y dejar «Antes» un tiempo.
- **Las fichas a 320 px:** «Inversiones» casi no cabe. Por debajo de 360 px, se quita el icono y la letra baja a 10,5 px. No lo hemos medido.
- **Las formas se llenan por altura, no por superficie:** en el coche o la huella, el 15 % puede parecer más o menos de lo que es. Por eso el % va siempre escrito debajo.
- **Nombres largos dentro de la forma:** se cortan a 2 líneas; el nombre completo está en la hoja.
- **Rendimiento:** con 8 metas hay 8 SVG con olas. Hay que probarlo en un móvil modesto; con «Reducir movimiento», están quietos.
- **Gráfica con muchas líneas:** por eso el límite de 4. Si un activo no tiene histórico, su chip sale apagado: «Sin precios todavía».
- **Reglas nuevas y versiones antiguas guardadas en caché:** una app sin actualizar no entiende `habilFin`, `diasMes` ni `dias`. Ese recurrente saldría «Sin fecha» hasta que se actualice. No se pierde nada.
- **«Negro puro»:** hay que revisar el contraste de tarjetas y bordes.
- **Cambiar iconos conocidos** despista unos días. Contarlo en las novedades.
- **Festivos:** un error al copiar la tabla movería fechas de cobro previstas. Por eso se revisa con un segundo calendario, la opción viene apagada y al encenderla se ven los cambios. Si alguien se olvida de añadir el año siguiente, solo se saltan los fines de semana y se avisa.
- **Forma compartida:** si la app manda `forma` antes de que exista la columna, guardar la meta falla. Hay que publicar primero la columna (Datos) y después la app.

## 7. Preguntas para el dueño

Ya decidido el 22/10: Dinero con pestañas (sí); metas con forma (sí, con el estilo v2); la forma de las compartidas, igual para todo el grupo (columna nueva); festivos por localidad como opción; un nombre mejor que «Gasto fijo».

1. ¿Te convencen las formas v2 (`dinero3-formas-v2.png`)? **Bloquea la tanda 2.**
2. ¿«Pago fijo» como nombre? **Recomendado: sí.**
3. ¿Inversiones abre en la semana (1S) o en el mes? **Recomendado:** recordar la última elegida; la primera vez, 1S.
4. ¿El dibujo y el color del perfil solo los ves tú, o los ven también tus grupos (necesita una columna, pasa por Datos y seguridad)? **Recomendado: solo tú, de momento.** Foto: no.
5. Festivos: ¿comunidad elegida a mano más 2 fiestas locales que pone el usuario, con la opción apagada al principio? **Recomendado: sí.** Encendida por defecto cambiaría las fechas de quien ya tiene recurrentes.

## 8. Lo que no hemos podido averiguar o confirmar

- **Nada probado en un móvil real.** Las capturas son de Chromium a 375 × 667 px con datos inventados, y las propuestas son maquetas aparte. No se ha medido a 320 px ni con texto grande.
- **Los emojis no salen en las capturas** de la app hechas con el navegador de pruebas (falta la fuente). En el móvil sí salen.
- **La gráfica de inversiones y la hoja del activo usan datos inventados.** El navegador de pruebas no llega al servidor de precios. Tampoco hemos podido comprobar el posible fallo de repintado de `cargarHistorico` (2.4).
- **El modo claro solo está en las maquetas de Metas, Formas y Aspecto.** Las demás, en oscuro.
- **No sabemos cuántas metas, deudas, activos o recurrentes tienen los usuarios** (no miramos sus datos), ni cuántos eligieron un emoji a mano en sus deudas.
- **No hemos revisado** la hoja «Verificación en dos pasos» (no sale en las pruebas) ni la de Grupos con datos.
- **No hemos copiado aún la tabla de festivos por comunidad** de 2026 y 2027. Solo hemos confirmado las nacionales de 2027 y la fecha del BOE, a través de un despacho de abogados (Garrigues). Desarrollo debe copiarla del BOE original.
- **No hemos confirmado** si Nager.Date tiene los festivos por comunidad ni si deja llamarlo desde la web: el dato de CORS viene de un catálogo de APIs, no de su documentación.
- **Las alturas de la maqueta están medidas en la maqueta, no en la app:** tarjeta de meta unos 175 px, pestaña Inversiones 1,1 pantallas.

## 9. Fuentes

- **`docs/13-feedback-22-10.md`**, puntos 6 y 7: el mensaje del dueño del 22/10/2026.
- **Código de `app.js` en `main`, revisado el 22/10/2026:**
  - Dinero: `renderDineroV2`, `renderDinero`, `DINERO_SUBS`, `dineroSub`, `tarroHtml`, `metaVerHtml`, `metaEditorHtml`, `EMOJI_PISTAS`, `emojiSugerido`.
  - Inversiones: `invFilaV2`, `renderInversionesTodo`, `evolucionHtml`, `PERIODOS_INV`, `cargarHistorico`, `serieCartera`, `inflacionV2Html`.
  - Deudas y cuentas: `dmDeudasHtml`, `deudaFormHtml`, `EMOJIS_DEUDA`, `cuentaFilaHtml`.
  - Recurrentes: `fechasMesRegla`, `ocurrencias`, `reglaTexto`, `aprenderRegla`, `REGLA_OPC`, `recEditorHtml`, `recListaHtml`.
  - Tú y aspecto: `renderTuV2`, `tuNombreHtml`, `aspectoHtml`, `PALETAS`, `applyLook`, `COLORES_PERSONA_NUEVO`.
  - Iconos y versiones: `ICONS`, `CATS_STD`, `CAT_ICONOS`, `TIPO_ICONO`, `LIST_META`, `invIcono`, `VERSIONES`, y el código de `verActivo` (línea 8770) e `irMovs`.
- **`supabase/migrations/README.md`:** columnas de `objetivos_compartidos` (`hitos`, `usos`, `conseguida`).
- **Festivos:** [Garrigues, «Publicado en el BOE el calendario laboral de España para 2027»](https://www.garrigues.com/es_ES/noticia/publicado-boe-calendario-laboral-espana-2027), consultado el 22/10/2026. Es un despacho de abogados; no tiene interés propio en esto.
- **Nager.Date:** [ficha en public-api.org](https://public-api.org/es/api/156/nager-date), consultada el 22/10/2026. Es un catálogo de terceros, no la documentación oficial.
- **Capturas y medidas propias** con datos inventados, 22/10/2026. Las maquetas y los scripts están en el espacio de trabajo temporal (`rig/d15`), no en el repositorio.

Para el PDF: en la primera página, `dinero3-antes.png` (la columna larga de hoy) al lado de `dinero3-pestanas.png`, con la pregunta 1 debajo. En la segunda, `dinero3-formas-v2.png` y `dinero3-meta-v2.png` juntas, con la pregunta 1. Las formas v1 no van en el PDF.

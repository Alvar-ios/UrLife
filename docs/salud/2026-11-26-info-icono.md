# Ayudas fijas que pasan a una «i» · 26/11/2026

Departamento: Producto y Diseño. Rama `fase24/info-icono`. **No se ha tocado la app** (ni `app.js` ni `look.css`): solo lectura. Las líneas de `app.js` son aproximadas y el recuento sale de leer la lista de textos de ayuda, no de abrir cada pantalla en un móvil.

## 1. Conclusión

1. **Sale bien la idea**: de unos 230 textos de ayuda fijos, **~70 pasan a «i» (A)**, **~9 se quitan (C)** y **~150 se quedan visibles (B)** porque avisan de algo que cambia lo que haces.
2. **Diseño recomendado**: botón «i» pequeño y apagado al lado del título o etiqueta; al tocarlo, el texto **se despliega en línea** justo debajo (sin hoja nueva) y se cierra tocando otra vez.
3. Se despliega **sin repintar la pantalla**: no se pierde lo que escribes, no hay nada que el botón de atrás deba deshacer y el freno al doble toque no hace falta.
4. Una sola función, `infoI(clave, texto)`, y una acción, `infoVer`. Las ayudas largas con cuentas (como «¿Cómo se calcula?» de Dinero) siguen en su hoja.
5. Regla para decidir: **si el texto avisa de un riesgo, de privacidad o de que algo no cuenta como gasto, se queda a la vista**. Si solo explica, va a la «i».

## 2. Diseño de la «i»

| Aspecto | Propuesta |
|---|---|
| Dibujo | `ic('info')` a 16 px, color `--text-faint` (apagado). Sin fondo ni borde. |
| Zona táctil | 44 × 44 px, con margen negativo (como `.dm3-info`, que hoy mide 36) para que no engorde la fila. |
| Dónde | A la derecha del título de bloque o de la etiqueta del campo. En cifras sueltas, pegada a la cifra. Nunca dos «i» seguidas en la misma fila. |
| Al tocar | El texto aparece debajo con el estilo de `.rec-hint` (12,5 px, apagado), con una animación corta. La «i» pasa a `--accent` mientras está abierto. |
| Cerrar | Tocar la «i» otra vez. No se cierra solo, no tapa botones. |
| Accesible | `aria-label="Más información"`, `aria-expanded="true/false"`, `aria-controls` con el id del texto. Funciona con teclado (Intro y Espacio) porque es un `button`. El texto está en el HTML, oculto con `hidden`. |
| Atrás de Android | No cambia nada: no abre hoja ni toca `FORM`. |
| Doble toque | Solo muestra u oculta, así que es seguro. No usa `frenarToques`. |
| Modo claro/oscuro y 375 px | Solo usa variables que ya existen. El texto desplegado ocupa el ancho de la fila. |
| Código | `infoI(clave, texto)` devuelve el botón y su texto oculto; la fila del título es `flex-wrap` y el texto ocupa el 100 %. `H.infoVer(clave)` solo cambia `hidden` y `aria-expanded` en el DOM. |

**Alternativas descartadas**
- *Ventanita o hoja pequeña para cada «i»*: apila hojas dentro de hojas, complica el atrás y el freno. Solo se mantiene para las ayudas largas con cuentas (`dmComo`, «¿De dónde sale?»).
- *Que se abra al pasar el dedo o dejar pulsado*: no existe en móvil de forma fiable.
- *Recordar «ya lo has visto» y esconderlo para siempre*: más estado que guardar y poca ganancia.

## 3. Textos que pasan a «i» (A)

Texto recortado; «i» en el sitio indicado. Las líneas de `app.js` son aproximadas.

| Línea | Pantalla | Texto | «i» irá |
|---|---|---|---|
| 998 | Editar perfil | Tu nombre lo ven las personas con las que compartes… | junto a «Nombre» |
| 2682 | Invitar | Es como te verán los demás | junto al campo de nombre |
| 2735 | Grupo · Invitar | ¿Alguien sin la app? Añádelo con su nombre… | junto al título «Invitar» |
| 2743 | Grupo · Ajustes | Cada gasto solo lo puede cambiar quien lo apuntó… | junto a «Quién cambia los gastos» |
| 2748 | Grupo · Invitar | Ya compartes con ellos: entran al momento | junto al título de la fila |
| 2805 | Grupo · Ajustes | En las cuentas del grupo cuentan siempre… | junto al interruptor |
| 3117 | Compartir gasto | En una hucha, cada uno aporta lo suyo… | junto a «Quién aporta» |
| 3129 | Compartir gasto | En tus números cuenta solo tu parte | junto a «Tu parte» |
| 3308 | Saldar | Puedes poner menos si es un pago parcial | junto a «Importe» |
| 3333 | Persona | Gastos que compartes solo con X, sin grupo | junto al título |
| 3347 | Invitar a una persona | Vale para una persona y caduca en 7 días | junto al enlace |
| 3360 | Grupo · Ajustes | Es lo que sale por defecto al compartir… | junto a «Reparto» |
| 3364 | Grupo · Reparto | Porcentaje de cada uno… Tienen que sumar 100 % | junto al título |
| 3450 | Compartir meta | La forma es la misma para todo el grupo | junto a «Forma de reparto» |
| 3453 | Meta compartida | Lo que ya habíais pagado antes de apuntarlo | junto a «Ya aportado» |
| 3675 | Reparto de ticket | Sin tocar nada: a partes iguales… | junto al título |
| 3755 | Ticket | En cada artículo, marca quién lo toma… | junto al título de artículos |
| 3816 | Compartir | No necesita la app: el gasto se guarda ya… | junto al nombre de la persona |
| 4500 | Tú · Perfil | Así te verán las personas con las que compartas | junto a «Nombre» |
| 4515 | Tú · Avisos | Lo lee quien hace PalomApp | junto al título de comentarios |
| 4872 | Inicio a tu gusto | Elige qué enseña cada círculo. Los «Auto»… | junto al título |
| 5007 | Tu mes · nómina | Tu nómina tiene que llegarte una vez al mes… | junto a «Nómina» |
| 5020 | Tu mes · nómina | La fecha siguiente es una previsión… | junto a la fecha |
| 5032 | Tu mes · día | Elige el día más temprano en que sueles cobrar… | junto al selector |
| 6282 | Juntos | Toca un grupo para ver de dónde sale | junto al título de la lista |
| 6345 | Juntos · saldar | Cada grupo se cierra por su cuenta… | junto a «Saldar» |
| 6514 | Gasto en otra moneda | Lo que dice tu banco o la tarjeta, con la comisión | junto a «Cambio» |
| 6517 | Gasto en otra moneda | Se guarda en euros y la cifra se apunta en la descripción | junto al título |
| 6700 | Viaje | ¿Un gasto tuyo que no compartiste? Ábrelo… | junto al título de gastos |
| 6793 | Tarea · compartir | La prioridad, la categoría y «Repetir» no se pasan | junto al título |
| 6796 | Tarea compartida | Por ejemplo: cena de cumple de Ana… | pasa a placeholder |
| 6803 | Tarea nueva | Las tareas compartidas son de un grupo… | junto a «Con» |
| 6814 | Tarea | Te lo recuerdo en Inicio al abrir la app | junto a «Recordatorio» |
| 7056 | Dinero · Lo que tienes | Lo apartado para tus metas ya está dentro… | en la `.dm3-info` que ya existe |
| 7277 | Aportar | Apartar no saca dinero del banco | junto al título |
| 7280 | Aportar con cuenta | El dinero pasará de X a Y… | junto a «Desde» |
| 7440 | Inversión · rentabilidad | Al año, según cuándo metiste cada euro… | junto a la cifra |
| 7466 | Gráfico de inversión | Cada franja es lo que vale ese activo… | junto al título del gráfico |
| 7503 | Inversión · inflación | Al año… Inflación: X | junto a la cifra |
| 7542 | Inversión · activo | Solo cuenta cómo se movió el precio… | junto al título |
| 7573 | Inversiones | Valores de cierre del último día de mercado… | junto al título |
| 7643 | Deuda | Sin contar intereses: si tu banco dice otra… | junto a «Queda» |
| 7656 | Deuda (`dm-nota`) | «Ya pagado» es lo que pagaste antes de usar la app… | junto a «Ya pagado» |
| 7745 | Grupo · ¿De dónde sale? | Sumo lo que has pagado y resto tu parte… | junto al título |
| 7747 | Grupo · Saldos | Para quedar en paz, la app junta los saldos… | junto al título |
| 7889 | Historial | Recuperar devuelve el gasto tal cual estaba… | junto al botón «Recuperar» |
| 7903 | Historial | Lo que no sale aquí no cambió | junto al título |
| 7987 | Búsqueda | Busca movimientos por tienda, categoría… | pasa a placeholder |
| 8124 | Movimiento · Apartar | Apartar es pasar dinero a tu ahorro… | junto a «Meta» |
| 8130 | Movimiento · Inversión | Una inversión puede contar para varias metas | junto a «Meta» |
| 8185 | Meta · hitos | La fecha es opcional: con ella verás si llegas | junto a «Hitos» |
| 8426 | Metas | Una meta junta lo que apartas y lo que inviertes… | junto al título |
| 8433 | Meta | Si lo dejas vacío se calcula con tu histórico… | junto a «Rentabilidad» |
| 8444 | Meta · cuenta | A partir de ahora, al aportar, el dinero pasará… | junto a «Cuenta» |
| 8621 | Elegir banco | Los nombres y logos son de cada banco… | junto al título |
| 8738 | Cuadrar cuenta | Si falta algún movimiento, apúntalo antes… | junto al título |
| 8769 | Cuentas | Suma las cuentas que tienen activado «Sumar» | junto a la cifra total |
| 8794 | Cuentas | Un gasto compartido que pagas tú baja entero… | junto al «virtual» |
| 8809, 8816 | Cuenta | Ahora cuentan como de la principal… / Marca los movimientos… | junto al título |
| 8881 | Convertir en traspaso | También para sacar de… No se duplica | junto al título |
| 8952, 8969, 8970 | Editar cuentas | Los movimientos sin cuenta cuentan como de la principal; «Para las cuentas del día a día…» | junto a «Sumar» y «Principal» |
| 10493 | Importar | Elígela para que cada movimiento vaya a su cuenta… | junto a «Cuenta» |
| 10879 | Importar · reglas | Lo que contenga ese texto se guarda como traspaso… | junto a la regla |
| 11744, 11746, 11858 | Guía de avisos | ¿Más de un banco?, pago por dos caminos, batería | junto al título del paso |
| 11815, 11854 | Tú · Avisos | Como mucho N avisos al día… / se guardan solo en este móvil… | junto al título |
| 12001, 12035 | Pago fijo | 3 = trimestral…; «Día hábil» cuenta solo… | junto a «Cada» y «Día» |
| 12068, 12071, 12103 | Cobro fijo | Calendario del sitio de trabajo; cada municipio tiene 2; lo más habitual… | junto a cada etiqueta |
| 12217 | Tarea repetida | Al completarla se crea sola la siguiente | junto a «Repetir» |
| 12414, 12444, 12452, 12492 | Bienvenida | «Descubre PalomApp»; abrir ajustes; «Cuadrar»; dónde está todo | junto al título de la pantalla |
| 13231 | Categorías | Las estándar son iguales para todos… | junto al título |

Resumen de A: **~70** (la tabla agrupa algunos de la misma pantalla en una fila).

## 4. Textos que se quitan del todo (C)

| Línea | Pantalla | Texto | Por qué sobra |
|---|---|---|---|
| 1361 | Exportar | Todos tus movimientos, del primero al último | el botón ya lo dice |
| 3076 | Compartir | Elige con quién lo compartes | el selector ya lo dice |
| 3756 | Ticket | Elige con quién compartes la cuenta | igual |
| 6142 | Juntos | Sumando todos tus grupos | la etiqueta de la cifra ya lo dice |
| 6230 | Juntos vacío | Divide una cena, un viaje… (copia de la de ~5989) | está repetido en la otra pantalla |
| 12036 | Pago fijo | Elige una opción para ver las fechas | se ve solo |
| 12400, 12406, 12913 | Bienvenida | Así te verán las personas con las que compartas | ya está en el perfil (998) |

Resumen de C: **9**.

## 5. Textos que se quedan a la vista (B), por grupos

| Grupo | Ejemplos (líneas) | Por qué |
|---|---|---|
| Acciones peligrosas o que no se deshacen | papelera 553, quitar meta 3456, «No se borra nada» 4495/5367/12904/5027, eliminar meta 8435, borrar cuenta 4529 | cambian lo que decides |
| Privacidad | foto no se guarda 3725/3757/4506, direcciones no se guardan 4179, privada 4058/6889, nada de tus cifras 4518, no me conecto al banco 12458/12941, movimientos privados 2807 | es lo que da confianza |
| Lo que no cuenta como gasto o sorprende | traspaso 3163, saldar 3311/6299, apartar 8129, «por defecto no cuenta como gasto» 8306, ajuste del cuadre 8738 (la 2.ª frase) | puede sorprender en tus cifras |
| Estados y errores | «Preparando el mensaje…» 3249, enlace no creado 3248, «ya no estás en este grupo» 3164, sin saldo 8443/8752, sin importe 4999, avisos de permiso 11805/12433/13030, hace 2 semanas sin avisos 11667 | cuentan qué pasa ahora |
| Vacíos que dicen qué hacer | 3069, 3448, 5008, 5992, 11812–11818 | llevan al siguiente paso |
| Subtítulos y datos | nombre del grupo 7743/7863, «Tu mes: del… al…» 4995, «Lecturas este mes» 3757, «Vuelven el…» 4509, pendientes 2705 | son datos, no ayuda |

Resumen de B: **~150**. No los he repasado uno a uno; si el dueño quiere, en otra pasada se puede ver cuáles de este grupo se pueden acortar.

## 6. Riesgos

1. **No lo ven**: quien tenía la duda puede no tocar la «i». Por eso los B no se mueven y solo sube lo que es obvio o de minoría.
2. **Pruebas**: las que buscan un texto de ayuda en la pantalla seguirán encontrándolo (está oculto en el HTML), pero las capturas ya no lo mostrarán; habrá que añadir pruebas del toque de la «i» y que `revisar.js` mida la zona táctil.
3. **Repintado**: si la pantalla se repinta mientras la «i» está abierta, se cierra. Aceptable.
4. **Demasiadas «i»**: máximo una por bloque; si hay dos en la misma fila, se unen en una.

## 7. Preguntas que debe decidir el dueño

1. **En línea o en ventanita**: ¿te vale que el texto se despliegue debajo (recomendado)? Bloquea empezar.
2. **Alcance**: ¿hacemos primero solo las pantallas más vistas (Dinero, Juntos, Movimientos, Meta) o los ~70 de golpe? Recomiendo por tandas, la primera con unos 25.
3. **Los C**: ¿se quitan los 9 sin más, o prefieres que alguno pase a «i»?

## 8. Lo que no he podido confirmar

- No he abierto cada pantalla en un móvil: la clasificación sale del texto y de su contexto en el código.
- Algunas líneas pueden tener variantes (el texto cambia según el caso) y habría que decidir una por una al programar.
- No he medido cuánto espacio se gana en cada pantalla.

## 9. Fuentes

Solo código y documentos del propio repositorio: `app.js`, `look.css`, `docs/salud/2026-11-26-textos.md`. Consultados el 26/11/2026.

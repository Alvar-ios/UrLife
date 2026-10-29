# 21 · Inicio a tu gusto: añadir gráficos y piezas de otras pantallas

Producto y Diseño · 29/10/2026 · responde a lo que pidió el dueño tras elegir el Inicio «Nueva»: mantener lo que hay y que cada uno pueda **añadir piezas** (gráficos, tablas, metas, Juntos…) sacadas de otras pantallas.

Bocetos (**prueba, no son la app**; 390 px de ancho, datos de ejemplo inventados, fuentes del sistema), en `docs/img/`:

| Boceto | Oscuro | Claro |
|---|---|---|
| Inicio con 5 piezas añadidas (la línea rosa marca dónde acaba la primera pantalla) | `inicio21-widgets-oscuro.png` | `inicio21-widgets-claro.png` |
| Hoja «Editar Inicio» (una pieza arrastrándose) | `inicio21-editar-oscuro.png` | `inicio21-editar-claro.png` |
| Hoja «Añadir a Inicio» (catálogo con vista previa) | `inicio21-catalogo-oscuro.png` | `inicio21-catalogo-claro.png` |

## 1. Conclusión

1. **La primera pantalla no cambia.** Tarjeta del mes arriba (fija), «Así vas» y «Estos días» como hoy. Lo que añadas va **debajo**: Inicio solo hace scroll si tú añades cosas.
2. **Catálogo de 13 piezas**: las 8 de la lista del dueño (con dos ajustes) y 5 nuevas (Lo que tienes, Presupuestos, Próximos fijos, Una deuda, Últimos movimientos). Cada una es una versión **compacta** de algo que ya existe, y al tocarla se abre la pantalla completa.
3. **Dos ajustes a la lista del dueño**: el gráfico anual pasa a **«últimos 6 meses» en barras** (el año entero sale casi vacío de enero a julio y 12 puntos no se leen a 343 px) y el calendario de la agenda pasa a **«Tu semana»** (el mes entero ocupa media pantalla y repite «Estos días»).
4. **Se edita en una hoja**, como «Tu "Así vas"»: lista con puntos para arrastrar, flechas ↑↓, botón rojo para quitar y «Añadir». Máximo **8 piezas**. Se guarda en `cfg().inicioWidgets` (privado, sin migración).
5. **Tres tandas**: base + 5 piezas fáciles; luego Juntos, cuentas, deudas y calendarios; al final los dos gráficos (6 meses e inversiones) y el arrastrar.

## 2. Catálogo de piezas

«Fila entera» = todo el ancho. «Medio ancho» = dos por fila; si una queda sola, se estira a fila entera.

### 2.1 Las de la lista del dueño

| Pieza | Qué enseña en Inicio (compacto) | Tamaño | Al tocar | Opciones | Esfuerzo |
|---|---|---|---|---|---|
| En qué gastas (1.1) | Anillo con el total en el centro y al lado las 4 categorías más altas + «Otras» | Fila entera | Movimientos → Resumen del mes; un color, esa categoría | Ninguna: sigue el mes de la tarjeta | Bajo |
| Ingresos y gastos (1.2) | Barras verdes y rojas de los **últimos 6 meses**, el actual en negrita, y «Octubre: +553 €» | Fila entera | Movimientos → Año | 6 o 12 meses | Medio |
| Calendario de gastos (1.3) | Mapa de calor del mes en cuadritos (sin cifras) y «19 días sin gastos» | Fila entera | Movimientos → Calendario; un cuadrito, ese día | Ninguna | Medio |
| Tu semana (2) | Tira de 7 días con puntos de colores (tareas, planes, fijos) y una línea: «Mañana: nómina» | Fila entera | Agenda → Calendario en ese día | Semana o mes (mes = mini, sin textos) | Medio |
| Una meta / Tus metas (3) | Una meta: su forma, nombre, «1.350 / 3.000 €» y un **+** para Aportar. Tus metas: hasta 4 formas pequeñas | Medio ancho / fila entera | La hoja de la meta (el + abre Aportar rápido) | Qué meta (también las compartidas) o todas | Bajo |
| Juntos (4) | «Debes 64 € · Te deben 24 €» y hasta 4 círculos de personas | Fila entera | Círculo → hoja de la persona; título → Juntos | Todos los grupos o un grupo (sus miembros y su saldo) | Bajo |
| Cuentas (5.1) | Barra de reparto y hasta 3 cuentas con logo y saldo. Una cuenta: logo, nombre y saldo | Fila entera / medio ancho | La hoja de la cuenta | Todas o una | Bajo |
| Inversiones (5.2) | Valor, ganancia («+629 € · +21,7 %») y **una sola línea** del total, sin franjas ni botones | Fila entera | Dinero → Inversiones | Periodo: 1M, 6M, 1A o Máx. | Medio-alto |

### 2.2 Las que proponemos añadir

| Pieza | Qué enseña | Tamaño | Al tocar | Opciones | Esfuerzo |
|---|---|---|---|---|---|
| Lo que tienes | El total grande y una barra cuentas + invertido frente a deudas | Medio ancho | Dinero | Ninguna | Bajo |
| Presupuestos | Hasta 3 barras, primero las que van más justas (verde, naranja, rojo) | Fila entera | Resumen de esa categoría | Cuáles enseñar (por defecto, las más justas) | Bajo |
| Próximos fijos | Los 3 próximos cobros y pagos fijos hasta fin de tu mes, con su día | Fila entera | Cobros y pagos fijos | Ninguna | Bajo |
| Una deuda | «Quedan 4.140 €» y barra de lo pagado | Medio ancho | La hoja de la deuda | Qué deuda | Bajo |
| Últimos movimientos | Los 3 últimos apuntes (para comprobar que lo apuntaste) | Fila entera | Movimientos → Lista | Ninguna | Bajo |

Las tres que ya existen pasan a ser piezas también: **Así vas** y **Estos días** (se pueden mover; ver pregunta 2) y la **Tarjeta del mes** (fija arriba, con candado).

**Descartadas:** atajos (el botón + ya lo hace), tareas sin fecha (están en Agenda), lecturas de tickets (es un ajuste, va en Tú), evolución de «Lo que tienes» en el tiempo (la app no guarda el saldo de cada día) y el calendario mensual completo de la agenda.

### 2.3 De dónde salen los datos (para Desarrollo)

| Pieza | Funciones que ya existen |
|---|---|
| En qué gastas, Presupuestos | `kpisMes`, `gastoPorCategoria`, `donutDatos`/`gcDatos`, `colorCat`, `catsGasto` |
| Ingresos y gastos | `kpisMes` mes a mes con `rangoMes` (nunca `fecha.slice(0, 7)`) |
| Calendario de gastos | El cálculo de `renderMovCal` (`movCalMovs`), sacado a una función de datos |
| Tu semana, Próximos fijos | `calEventos`, `agendaItems`, `avisosRecurrentes` |
| Metas, Deudas | `metasStats`, `metaPorKey`, `metaFormaHtml` a 70 px, `aportarRHtml`, `deudaStats` |
| Juntos | `juntosPersonas`, `miSaldo`, `juntosCircHtml` |
| Cuentas, Lo que tienes | `cuentasCfg`, `saldoCuenta`, logos de bancos, `patrimonio()` |
| Inversiones | `serieCartera`, `S.historico`, `cargarHistorico` (lo mismo que usa «Así vas») |

## 3. Cómo se personaliza

| Qué | Propuesta |
|---|---|
| Entrar | Botón «Editar Inicio» (con borde de puntos) al final de Inicio. Atajo: mantener pulsada una pieza (vibra). |
| Hoja «Editar Inicio» | Lista: puntos para arrastrar · nombre y resumen («Meta · medio ancho») · flechas ↑↓ · botón rojo «−». Tocar una fila abre sus opciones. La Tarjeta del mes sale arriba con candado. Abajo, «6 de 8» y los botones «+ Añadir» y «Listo». |
| Arrastrar | Solo desde los puntos, para que no choque con el scroll ni con deslizar la hoja. La pieza se levanta y deja un hueco de puntos donde caerá. Las flechas hacen lo mismo con un toque. |
| Hoja «Añadir a Inicio» | Filtros Todo · Movimientos · Agenda · Dinero · Juntos. Tarjetas en dos columnas con **vista previa con tus datos**, nombre, para qué sirve y tamaño. Las que ya tienes salen con un tic verde. Si tiene opciones, se pregunta en el momento («¿Qué meta?»). |
| Sin datos | En el catálogo, la vista previa usa un ejemplo con la etiqueta «Ejemplo». En Inicio, una frase y un botón («Aún no tienes metas · Crear una»). Las de funciones que no tienes (p. ej. Juntos sin grupos) no se ofrecen. |
| Algo borrado | Si se borra la meta, la cuenta o el grupo de una pieza: «Ya no existe · Elegir otra». Nunca se borra la pieza sola. |
| Mes | Las piezas «del mes» (En qué gastas, Calendario de gastos, Presupuestos) siguen las flechas de la tarjeta y dicen el mes en su cabecera. |
| Por defecto | Usuario nuevo: igual que hoy (tarjeta, Así vas, Estos días) y el botón «Editar Inicio». Usuarios actuales: igual que hoy y una etiqueta NUEVO en «Editar Inicio» (ver pregunta 3). |
| Dónde se guarda | `cfg().inicioWidgets`: una lista en orden, p. ej. `[{t:'asivas'},{t:'dias'},{t:'gastos'},{t:'meta',o:{key:'h1'}}]`. Sin lista = lo de siempre. Privado, sin migración, con `saveConfig`. Al ir en la configuración, el móvil y el PC ven el mismo Inicio. |
| Límite | 8 piezas como mucho (contando Así vas y Estos días). Cada pieza calcula una vez por repintado; Inversiones solo pide precios cuando se ve en pantalla y usa la copia de 10 minutos; las animaciones, solo la primera vez. |

**Cómo convive con «Así vas»:** sigue siendo lo que es (5 círculos con su «Cambiar») y pasa a ser una pieza más. Para no repetir: los círculos «Auto» se saltan lo que ya enseña una pieza (Juntos, presupuestos, inversiones, la misma meta), y «Estos días» quita la fila «Debes / Te deben» si está la pieza Juntos (ya lo hace hoy con el círculo de Juntos). Descartado por ahora: juntar los dos catálogos (un círculo como pieza pequeña). Sería más ordenado, pero rehace algo que el dueño ya validó.

## 4. Recomendaciones

- **Empezar por las piezas de lectura rápida** (En qué gastas, Meta, Lo que tienes, Presupuestos, Próximos fijos): son baratas y reutilizan cálculos que ya funcionan.
- **Flechas antes que arrastrar.** Hacen lo mismo, se prueban en las pruebas automáticas y van bien con una mano. Arrastrar llega en la tanda 3.
- **Piezas sobrias, interacción juguetona** (línea de `look.css`): fondo de tarjeta normal, un solo color de acento en el icono de cabecera, cifras con la fuente de titulares. Lo vivo va en el + de Aportar, al levantar una pieza y en el tic del catálogo. Sin naranja terracota; el naranja solo como `--warn` («va justo»).
- **Iconos de la app**, sin emojis (salvo el dibujo de la meta o la deuda que eligió el usuario). Hace falta **un icono nuevo**, `grip` (los seis puntos para arrastrar).
- **Medir en 375 px** antes de dar por buena cada pieza de medio ancho: quedan unos 165 px, así que las cifras van con `moneyShort`.

## 5. Tandas de trabajo

| Tanda | Qué incluye | Pruebas |
|---|---|---|
| 1 · Base | `cfg().inicioWidgets`, pintar la lista, hoja «Editar Inicio» con flechas, quitar y opciones, catálogo con vista previa. Piezas: En qué gastas, Una meta, Lo que tienes, Presupuestos, Próximos fijos | Añadir, quitar, reordenar, opciones, guardado, pieza con meta borrada, Inicio sin lista = igual que hoy |
| 2 · Más piezas | Juntos, Cuentas / Una cuenta, Una deuda, Últimos movimientos, Calendario de gastos, Tu semana | Datos de cada una y que «Así vas» / «Estos días» no repitan |
| 3 · Gráficos y gestos | Ingresos y gastos (6/12 meses), Inversiones con carga al verse, arrastrar, mantener pulsado | Carga diferida de precios; arrastrar solo a mano en un móvil real |

## 6. Riesgos

- **Inicio deja de caber en una pantalla** en cuanto se añade algo. Se mitiga dejando la primera pantalla igual y lo nuevo debajo.
- **Datos repetidos** (la tarjeta ya dice «En tus cuentas»; «Así vas» puede tener la misma meta). Mitigado con las reglas del apartado 3, pero conviene revisarlo con usuarios reales.
- **Lentitud en móviles viejos** con 8 piezas que calculan a la vez, sobre todo Inversiones (además, cada carga llama a la función de precios, que tiene coste).
- **Arrastrar en el móvil** puede chocar con el scroll y con deslizar la hoja para cerrarla (`activarArrastreSheet`). Las pruebas automáticas no lo cubren: hay que probarlo a mano.
- **Escribir la configuración a la vez** desde dos sitios: usar siempre `saveConfig`, nunca escribir la configuración directamente.

## 7. Preguntas que debe decidir el dueño

1. **(Bloquea)** ¿Te parece bien que Inicio haga scroll cuando alguien añade piezas, si la primera pantalla sigue igual que hoy?
2. **(Bloquea)** «Así vas» y «Estos días», ¿se pueden mover y quitar como el resto, o se quedan fijos debajo de la tarjeta? Recomiendo que se puedan mover y quitar.
3. Usuarios actuales: ¿les dejamos Inicio igual con una etiqueta NUEVO en «Editar Inicio» (recomendado), o les añadimos ya «En qué gastas»?
4. ¿Las piezas del mes siguen las flechas de la tarjeta? Recomiendo que sí.
5. ¿Te vale un máximo de 8 piezas?
6. En pantalla, ¿«Editar Inicio» y «Añadir a Inicio» (recomendado, sin la palabra «widget») o «Añadir widget»?
7. ¿Aceptas los dos ajustes de tu lista: 6 meses en barras en vez del año entero, y «Tu semana» en vez del mes de la agenda?
8. ¿Te parece bien dejar Inversiones y el arrastrar para la tanda 3?

## 8. Lo que no hemos podido averiguar o confirmar

- Los bocetos se han hecho a 390 px con las fuentes del sistema; **no se han medido a 375 px** ni con el texto grande del sistema.
- No se ha probado en un móvil real (ni el arrastrar, ni el rendimiento con 8 piezas).
- No sabemos cuánto cuesta cada carga de precios de Inversiones si muchas personas tienen esa pieza en Inicio.
- Los esfuerzos (bajo, medio, alto) son una estimación de Producto, no de Desarrollo.

## 9. Fuentes

- Código de la app (`app.js`, `look.css`) en `main`, consultado el 29/10/2026: `renderInicioNuevo`, `insightsHtmlV3`, `estosDiasHtml`, `renderMovResumen`, `renderMovCal`, `renderCalendarioV2`, `metaFormaHtml`, `juntosV3Html`, `dm3CuentasHtml`, `evolucionHtml`.
- Capturas de la app con datos de ejemplo (montaje de pruebas de Producto), 29/10/2026.
- `docs/14-inicio-juntos.md` («Así vas») y `docs/22-inversiones-formas-v2.md` (una sola curva para el total).

Para el PDF: poner el boceto de Inicio en grande con la línea de «primera pantalla», y al lado las dos hojas (Editar y Añadir) como pasos 1 → 2.

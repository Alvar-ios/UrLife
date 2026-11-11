# Auditoría de interfaz y fluidez en el móvil · 11/11/2026

Departamento: Producto y Diseño. Revisión de `main` (cambio `5c43387`) antes de Google Play. **No se ha cambiado la app**: solo capturas, medidas y propuesta. Todo con datos inventados.

## 1. Conclusión

1. **La app va rápida una vez cargada**: con datos normales, casi todo responde en menos de 150 ms aunque el procesador vaya 4 veces más lento. Lo que hace que *parezca* lenta está en **tres sitios**: las fuentes de Google, que dejan la pantalla en blanco hasta que llegan (también en la app de Android); **guardar un gasto**, que no da ninguna señal mientras se guarda y no cambia las cifras hasta volver a descargar todos los movimientos; y las animaciones de 0,5 s al abrir hojas y cambiar de pestaña.
2. **Con muchos datos se nota**: con 3.000 movimientos (un año importado del banco), abrir la app tarda 1,4 s, Dinero 0,4 s y la Lista 0,4 s. La causa principal es un cálculo de saldos que se repite miles de veces. Se arregla sin tocar nada de lo que se ve.
3. **Antes de lanzar, 7 arreglos (A)**: fuentes dentro de la app, «Guardando…» y guardado al instante, que no asome contenido por debajo de los botones de las hojas, el «Te queda −321 €» de quien cobra a final de mes, el título del grupo, las categorías cortadas al apuntar un gasto y los botones pequeños. Casi todos son pequeños.
4. **Cuatro puntos de `docs/32` siguen a medias**: título del grupo (A5), «Restaura…» (A13), botones pequeños (A4) y los dos nombres de «pago fijo» (B6). Aquí entran como A o B.
5. **Lo que está bien**: 0 errores en la consola en 96 + 50 capturas, sin scroll lateral a 375 px, nada que se repinte ni se mueva estando quieto, listas largas con límite (120 movimientos), imágenes ligeras (todos los logos juntos pesan 180 KB) y «Lo básico» cabe sin scroll a 375 × 667.

## 2. Tablas

### 2.1 A · Arreglar antes de lanzar

| N.º | Pantalla | Qué pasa | Por qué molesta | Propuesta concreta |
|---|---|---|---|---|
| A1 | Al abrir (web y app de Android) | Las fuentes se piden a Google antes de pintar nada. Medido: si Google tarda 3 s en responder, la primera pantalla sale a los **3,1 s** (en vez de 0,26 s). Además se descarga Fraunces, que solo se usa si alguien la elige | Con mala cobertura, la app se queda en blanco y parece rota. En una app instalada no debería depender de Google para mostrar texto | Guardar las fuentes dentro de la app (`fonts/`, solo Work Sans y Bricolage) con `font-display: swap`. Fraunces y las otras, solo si se eligen en Aspecto. Mientras llegan, la letra del sistema |
| A2 | Cualquier hoja → «Guardar» (gasto, ingreso, aportar…) | Al tocar «Guardar» no cambia nada hasta que responde el servidor (con reintentos puede tardar varios segundos). Un segundo toque se ignora en silencio. Al cerrarse, sale «Movimiento añadido», pero Inicio sigue con la cifra de antes hasta que la app vuelve a descargar **todos** los movimientos (espera 300 ms y luego los descarga, de mil en mil) | Es el gesto que más se repite. Sin respuesta, la gente vuelve a tocar o cree que no se ha guardado. Que salga «añadido» con la cifra sin cambiar confunde | **Mínimo:** el botón pasa a «Guardando…», apagado, al primer toque. **Mejor:** la hoja se cierra al momento y el gasto aparece ya en Inicio y en la lista (con un punto gris pequeño mientras se guarda). Si falla: aviso «No se ha guardado» y «Reintentar», que vuelve a abrir la hoja con lo escrito |
| A3 | Hojas largas: grupo, trayecto, compartir, historial (claro y oscuro) | Por debajo de la barra «Cerrar · Añadir gasto» asoma un trozo de la lista («Metas y deudas compartidas» cortado por la mitad). Captura `02` | Parece un fallo de dibujo justo donde está el botón principal | La barra de botones llega hasta el borde de abajo, con su propio fondo y el margen del gesto del sistema por dentro, sin hueco transparente |
| A4 | Inicio · tarjeta «Te queda este mes» | Quien cobra a final de mes (la nómina del día 25 cae en el mes anterior) ve, casi todo el mes, **«−321 €»** grande con «Ingresos 0 €». Captura `03` | Asusta y no es verdad: el dinero está en el banco. Ya existe «Tu mes» desde el día que cobras, pero no se ofrece | Si en los 2 últimos meses hubo un ingreso de la categoría Nómina entre el día 20 y el 31, tarjeta de una vez: icono `calendar` · **«Cobras hacia el día 25. ¿Empezamos tu mes ese día?»** · «Sí, desde el 25» / «No». Usa `cfg().mesInicio`, que ya existe |
| A5 | Juntos · hoja del grupo (`docs/32` A5, a medias) | Un nombre largo sale en dos líneas de 34 px: «Piso / compartid…». La pestaña «Planes NUEVO» se parte en dos líneas. Captura `01` | Se pierde lo que identifica al grupo y empuja la cifra hacia abajo | Título a 22 px, hasta 2 líneas, con «…» solo al final. La etiqueta NUEVO dentro de un selector, como punto de 8 px |
| A6 | + → Gasto (teclado de la app) | Las categorías salen cortadas: «Supermer…», «Restauran…», «Suscripcio…» (también en «Así vas» de Inicio: «Restaura…»). Captura `04` | Es la primera pantalla de quien empieza con «Lo básico» | Nombre en 2 líneas como máximo, sin «…», a 12 px en pantallas de 375 px o menos |
| A7 | Toda la app (`docs/32` A4, sigue) | Botones medidos de menos de 32 px: «Noviembre · del 1 al 30» 31 px, «Elegir mes» 27, «Todas las cuentas» 30, «Apuntar uno nuevo igual» 24, «Compartir un gasto con Ana» 25, «Compartir mi agenda ›» 24, completar tarea 30 × 30 | Con una mano y el pulgar, se falla el toque. Android recomienda 48 dp | Zona de toque invisible ampliada (`::after` con `inset: -10px`) en enlaces de texto, chips y selectores. No cambia el dibujo |

### 2.2 B · Poco después de lanzar

| N.º | Pantalla | Qué pasa | Propuesta |
|---|---|---|---|
| B1 | Al abrir | Inicio se pinta **4 veces seguidas** en 200 ms (una por cada dato que llega: movimientos, tareas, configuración, compartidos…), además de 10 veces el esqueleto. Con red real, más separadas: la pantalla «salta». Y no se enseña nada hasta que llega la tabla de Golf Reventa | Juntar los pintados en uno por fotograma. Golf no debe frenar Inicio |
| B2 | + → Gasto | «Guardar» se queda apagado sin decir por qué hasta elegir categoría (solo lo dice un aviso al tocar) | Mientras falte, la tecla dice **«Elige categoría»**. O dejar elegida la última usada |
| B3 | Juntos y hoja de persona | «a solas» («En tu grupo y a solas», «Ana · a solas») no se entiende | **«Solo vosotros dos»**; en Juntos: «En tus grupos y con cada persona» |
| B4 | +, Tú, Descubre (`docs/32` B6) | Tres nombres: «Pago fijo», «Cobros y pagos recurrentes», «Cobros y pagos fijos». Captura `09` | Un solo nombre en todas partes: «Cobros y pagos fijos». Y al guardar un pago fijo, «¿Se repite cada mes?» |
| B5 | Movimientos y Agenda (`docs/32` B7) | Dos calendarios con el mismo selector «Planes y tareas \| Dinero». Captura `08` | Quitar ese selector de la Agenda; la leyenda que filtra ya basta |
| B6 | Tú en «Lo básico» (375 × 667) | La pista «Aquí tienes todas las herramientas» tapa el título «Tu dinero» y media fila. Captura `05` | La pista, debajo de la tarjeta sin tapar nada, o como texto dentro de ella |
| B7 | Movimientos · Resumen | «Gastos ↑ 352 %»: con una base pequeña el porcentaje asusta y no dice nada | Diferencia en euros, como en «Así vas»: «+250 € que en octubre a estas alturas» |
| B8 | Tú · cabecera | La etiqueta NUEVO sale junto al **nombre de la persona**: parece que la etiqueta a ella | Ponerla en el botón «Editar» |
| B9 | Movimientos · Lista | 5 filas de controles antes del primer movimiento (vistas, mes, Mes \| Año, cuentas, filtros) | «Mes \| Año» dentro del desplegable del mes y «Todas las cuentas» dentro de «Filtros» |
| B10 | Hoja de una cuenta | «Saldo virtual», «fecha de partida» y un párrafo de 5 líneas | «Si te pagaran lo de Juntos: 2.472,55 €»; el párrafo, plegado en «¿Qué es esto?» |
| B11 | Sin conexión | Tarda 8 s en decir que no hay red | Si el móvil dice que no hay conexión, decirlo al momento |

### 2.3 C · Algún día

| N.º | Pantalla | Qué pasa | Propuesta |
|---|---|---|---|
| C1 | Meta → Aportar | La meta dice «434,00 € al mes» y el botón «435 € · lo que toca» (redondea a 5). Captura `07` | La misma cifra en los dos sitios |
| C2 | Tú → Tu mes | Dice «del 1 al 31» en noviembre | «Del 1 a fin de mes» |
| C3 | Barras de arriba y abajo | Desenfoque del fondo (`backdrop-filter` 16 px): caro en móviles Android baratos al hacer scroll | Probarlo en un móvil de gama baja; si da tirones, fondo opaco |
| C4 | Inicio en «Todo» | A 375 × 667 mide 1.069 px (hace scroll). El dueño ya decidió dejarlo así (`docs/11` B2): solo se apunta | — |

### 2.4 Cifras de fluidez

Chromium imitando un móvil de 375 × 812, **procesador 4 veces más lento**, sin red (datos inventados al momento). Tiempo desde el toque hasta que la pantalla está pintada. Por debajo de 100 ms se siente instantáneo (modelo RAIL).

| Acción | Datos normales (ms) | 3.000 movimientos (ms) | Nota |
|---|---|---|---|
| Abrir la app hasta ver Inicio | 760 | 1.440 | Inicio se pinta 4 veces seguidas |
| Pestaña Movimientos / → Lista | 142 / 198 | 210 / 399 | Lista con límite de 120 |
| Pestaña Dinero | 54 | **391** | Cálculo de saldos repetido |
| Pestaña Inicio / Juntos / Tú / Agenda | 113 / 65 / 120 / 68 | 173 / 84 / 126 / 66 | |
| Hoja del grupo / de una persona / de una cuenta | 135 / 73 / 59 | 124 / 67 / 104 | El grupo repinta también la pestaña de detrás |
| Abrir el + / → Nuevo gasto | 34 / 114 | 59 / 115 | Más 0,5 s de animación de la hoja |
| Tecla del teclado de importe | 17-45 | 27-29 | |
| Guardar el gasto (sin red) | 340 | 138 | Con red, más la espera del servidor y la descarga de todo |
| Scroll de la lista (90 fotogramas) | 0 tirones | 1 tirón (36 ms) | |
| En reposo 5 s | 0 pintados | 0 pintados | Nada animándose |

Peso de lo que se descarga (comprimido): `app.js` 375 KB (1,33 MB sin comprimir), `look.css` 41 KB, Supabase 55 KB. En la app de Android esto va dentro, salvo las fuentes (A1).

### 2.5 Los 5 cambios que más mejorarían la sensación de rapidez

| Orden | Cambio | Qué se gana | Esfuerzo |
|---|---|---|---|
| 1 | Guardar al instante (A2): la hoja se cierra y el gasto aparece ya; tras guardar, añadir solo esa fila en vez de volver a descargar todos los movimientos | El gesto más repetido pasa de «esperar al servidor» a inmediato | Medio |
| 2 | Fuentes dentro de la app y sin bloquear (A1) | Nunca más pantalla en blanco por culpa de Google; hasta 3 s con mala red | Pequeño |
| 3 | Calcular los saldos de las cuentas una vez por pintado (hoy `cfg()` copia toda la configuración por cada movimiento y cada cuenta) | Dinero con 3.000 movimientos: de 391 ms a menos de 100 ms (estimado); también Inicio al abrir | Pequeño |
| 4 | Un solo pintado por fotograma y no esperar a Golf (B1) | Inicio sale una vez, sin saltos, y antes | Pequeño |
| 5 | Animaciones más cortas: hojas de 0,5 s a 0,28 s; entrada de pestaña de 0,5 s (+0,13 s escalonado) a 0,25 s | Cada toque se siente más ágil; no se pierde el carácter juguetón | Pequeño |

## 3. Recomendaciones

- **Hacer A1, A2 y A3 primero**: son las que un usuario nuevo de la tienda nota en su primer minuto.
- **Probar con 3.000 movimientos** en las pruebas automáticas: hoy todas usan pocos datos y lo lento no se ve.
- **Pasar `tests/capturas/revisar.js` también por las hojas** (gasto, cuenta, meta, persona, agenda): esta vez se hizo con un guion aparte, fuera del repositorio. Si el dueño quiere, Desarrollo lo añade en una rama.

## 4. Riesgos

- **Guardar al instante (A2)** necesita deshacer bien si falla: un gasto que se ve y no está guardado sería peor que la espera. Pasar por Calidad y Datos y seguridad.
- **Cambiar textos** (B3, B4, B7, B10) rompe pruebas que comparan frases: hay que actualizarlas.
- **Juntar los pintados (B1)** puede dejar algún sitio que contaba con pintarse al momento (las hojas abiertas que se refrescan solas).

## 5. Preguntas para el dueño

1. **(Bloquea A2)** ¿Guardar al instante, con aviso si falla (recomendado), o solo poner «Guardando…» en el botón?
2. ¿Ofrecemos «Tu mes desde el día que cobras» con la tarjeta de A4? No bloquea.
3. ¿Un solo nombre «Cobros y pagos fijos» en toda la app (B4)? No bloquea.
4. ¿Quitamos el selector «Dinero» del calendario de la Agenda (B5)? Ya se preguntó en `docs/32`. No bloquea.

## 6. Lo que no hemos podido averiguar o confirmar

- **Nada probado en un móvil real ni dentro de la app de Android.** El procesador 4 veces más lento imita un móvil normal, no uno barato.
- **Sin red real**: los datos inventados llegan al momento. No medimos cuánto tarda Supabase ni cuántas veces se repinta con sus avisos en directo. Lo de A2 (esperar y volver a descargar todo) sale de leer `data-layer.js`, no de medirlo.
- Los pintados del navegador sin tarjeta gráfica no sirven para medir el desenfoque (C3) ni los tirones de verdad al hacer scroll.
- El «<100 ms» del punto 3 de 2.5 es una estimación: no se ha programado.
- No se ha visto qué pasa tras guardar el primer gasto en «Lo básico»: los datos inventados no avisan de cambios, así que Inicio no se actualizaba (con Supabase sí debería).

## 7. Fuentes

- Capturas y medidas propias del 11/11/2026: `tests/capturas/revisar.js` (96 capturas, 18 avisos: todos de la hoja del grupo) y guiones aparte fuera del repositorio (25 pantallas más en claro y oscuro, medida de tiempos con el procesador 4 veces más lento, 3.000 movimientos inventados, prueba de las fuentes con 3 s de retraso). Capturas que ilustran los problemas: `docs/salud/capturas-2026-11-11/`.
- Modelo RAIL (responder en menos de 100 ms): https://web.dev/articles/rail — consultado el 11/11/2026.
- Tamaño mínimo de toque en Android (48 dp): https://developer.android.com/guide/topics/ui/accessibility/apps — consultado el 11/11/2026.
- `docs/32-ux-movil.md` (08/11/2026) y `docs/11-auditoria-interfaz.md` para lo que ya estaba pedido.

Para el PDF: una línea de tiempo de «Guardar un gasto», hoy (toque → espera del servidor → «añadido» → espera → cifra nueva) frente a la propuesta (toque → cifra nueva); y un gráfico de barras con la tabla 2.4 marcando la línea de 100 ms.

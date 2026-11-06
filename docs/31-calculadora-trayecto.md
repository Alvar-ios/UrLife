# 31 · Calculadora de un trayecto en coche

Producto y Diseño · 06/11/2026 · Propuesta, sin programar.

## 1. Conclusión

1. **Va en el botón +**, en la fila pequeña, como «Trayecto» (icono `car`). Es una hoja que calcula y, al final, te deja **Apuntar gasto** o **Compartir**. No es una pestaña nueva.
2. **Se puede empezar sin internet ni base de datos:** km a mano + consumo + precio a mano. Esa tanda 0 ya resuelve el 80 % («¿cuánto nos cuesta ir a Valencia?»).
3. **Distancia entre dos sitios:** recomendamos **OpenRouteService** (gratis, con clave guardada en secretos de Supabase y usada desde una función). Nominatim + el servidor de prueba de OSRM no sirven para una app publicada. Sin conexión: línea recta × 1,25, marcada como «aprox.».
4. **Precio del carburante:** la fuente oficial del Ministerio da **23 productos** de 11.478 gasolineras, actualizados a diario (comprobado hoy). Una función de Supabase guarda cada día la **media nacional y por provincia** en una tabla nueva y pequeña (la revisa Datos y Seguridad). Eléctrico: precio medio editable (casa, rápida, ultrarrápida).
5. **Privacidad:** no se guardan direcciones. Solo se recuerdan los trayectos que el usuario marca como «Repetir», y en su propia configuración.

## 2. Cómo se ve (hoja «Trayecto»)

Una sola hoja, de arriba abajo, con una mano. El resultado se ve siempre abajo y cambia en vivo.

| Paso | Qué ve | Textos de la pantalla |
|---|---|---|
| Título | Icono `car` | **«¿Cuánto cuesta el viaje?»** |
| 1. Distancia | Interruptor de dos: «Por sitios · Km a mano» | Por sitios: «Desde» (`pin`, con «Mi ubicación» si se permite) y «Hasta». Km a mano: cifra grande «0 km» con el teclado de la app |
| 2. Ida o vuelta | Segmentado | «Solo ida · Ida y vuelta». Debajo, pequeño: «312 km por carretera» o «≈ 290 km aprox. (sin conexión)» |
| 3. Tu coche | Una fila que se toca: «Gasóleo A · 5,5 l/100 km» | Si no hay coche guardado: «¿Qué coche llevas?» (ver §5) |
| 4. Precio | Fila: «1,899 €/l · media en Madrid, hoy» | Se toca para escribir el tuyo: «Pon tu precio». Al cambiarlo: «Tu precio» y «Volver al de hoy» |
| 5. Personas (opcional) | Pasos − 1 + | «¿Cuántos vais?» · si son 2 o más: «Sale a 16,30 € cada uno» |

**Resultado (tarjeta fija abajo):**

> **unos 32,60 €**
> 312 km · 17,2 litros
> [ Apuntar gasto ] [ Compartir ]
> Repetir trayecto (enlace)

- En eléctrico: «unos 9,40 € · 312 km · 53 kWh».
- **Apuntar gasto:** abre el gasto normal ya relleno: importe, categoría Transporte (o la del coche), descripción «Madrid → Valencia (ida y vuelta)». Se puede corregir antes de guardar.
- **Compartir:** abre `compRapidoHtml` con el importe y la descripción. Si hoy cae dentro de un **tema de viaje** abierto (docs/29: icono avión y fechas), se propone ese tema y su grupo: «En el viaje *Valencia*». Reparto a partes iguales, como siempre.
- **Repetir trayecto:** guarda solo el nombre que el usuario ponga («Casa → pueblo»), los km y el coche. Luego sale en el + dentro de «Repetir», con icono `car`. Las direcciones no se guardan; solo los km.
- Celebración: ninguna. Es un cálculo.
- Iconos: `car`, `pin`, `bolt` (eléctrico), `swap` (ida y vuelta), `repeat`, `users`. Sin emojis.
- Palabra «unos»: deja claro que es una estimación (no incluye peajes ni parking; enlace «¿Peajes o parking? Súmalos» con un campo extra, en «Más»).

## 3. Distancia entre dos sitios

| Opción | Coste | Límites y condiciones | Clave | Valoración |
|---|---|---|---|---|
| Nominatim (buscar sitio) + OSRM demo (ruta) | Gratis | Nominatim: máx. 1 petición/s **para toda la app**, prohibido autocompletar, identificarse y citar OSM. El servidor de prueba de OSRM no es para apps en producción | No | Descartado para la app publicada; vale para pruebas |
| **OpenRouteService** (buscar + ruta) | Gratis (plan básico) | Cupo diario y por minuto (ver §7); citar OSM/ORS | Sí → secreto de Supabase + función | **Recomendado** |
| Google / Mapbox | De pago a partir de cierto uso, con tarjeta | Condiciones estrictas | Sí | Descartado: coste y tarjeta |
| Sin internet: línea recta × 1,25 | Gratis | Solo si ya tenemos las coordenadas (ej. ubicación) | No | Respaldo, siempre marcado «aprox.» |

**Recomendación:** una función nueva `ruta-api` (o una acción más en `activos-api`) que reciba «desde» y «hasta» como texto, llame a OpenRouteService y devuelva solo los km. **No guarda nada**, ni en registros. Buscar sitio al pulsar «Calcular», no letra a letra (ahorra cupo y cumple las normas). Texto pequeño al pie: «Rutas: © OpenStreetMap».

## 4. Precios del carburante

**Fuente:** API REST «Precios Carburantes» del Ministerio (sedeaplicaciones.minetur.gob.es). Sin clave. Datos.gob.es la marca como «Diario»; la descarga de hoy decía «06/11/2026 22:14», con 11.478 gasolineras.

**Productos que ofrece (comprobado hoy) y cómo los agrupamos:**

| Grupo en la app | Productos de la fuente | Mediana nacional hoy (€/l) |
|---|---|---|
| Diésel | Gasóleo A · Gasóleo Premium · Gasóleo B (agrícola) · Biodiésel · Diésel renovable | A 1,899 · Premium 2,005 |
| Gasolina | 95 E5 · 95 E10 · 95 E5 Premium · 98 E5 · 98 E10 · 95 E25 · 95 E85 · Bioetanol · Gasolina renovable | 95 E5 1,699 · 98 E5 1,879 · 95 E10 1,798 (solo 28 sitios) |
| Gas | GLP (autogás) · GNC · GNL · biogás comprimido y licuado | GLP 1,159 · GNC 2,099 (€/kg) |
| Otros | Hidrógeno (€/kg, 2 sitios) · AdBlue · Metanol · Amoniaco | AdBlue 0,949 |
| Eléctrico | No está en esta fuente | Ver abajo |

Mediana calculada por nosotros con la descarga de hoy. Por defecto se enseñan solo los habituales (Gasóleo A, Gasóleo Premium, Gasolina 95, Gasolina 98, GLP, Eléctrico); el resto en «Otros». AdBlue no se ofrece como carburante (no mueve el coche).

**Eléctrico (€/kWh, siempre editable):**
- En casa: PVPC de Red Eléctrica (API pública de REData). Como el precio cambia cada hora, usamos la media del día.
- Cargador rápido y ultrarrápido: no hay fuente oficial sencilla → **valor medio fijo** que revisamos a mano cada pocos meses y el usuario puede cambiar. No ponemos la cifra aquí sin comprobarla (ver §7).

**Cómo se refresca:** una tarea diaria (pg_cron, como la limpieza del historial) llama a la función, que descarga el fichero (~12 MB), calcula la mediana nacional y por provincia de cada producto y guarda unas 50 × 23 filas. La app lee solo la fila de su provincia. Es parecido a como `activos-api` da los cambios de `divisas`.

**Tabla nueva (para Datos y Seguridad):** `precios_carburante` (fecha, provincia o «ES», producto, precio, unidad). Solo lectura para usuarios, sin datos personales. La provincia del usuario se elige una vez (o sale de «Desde») y va en `cfg()`.

## 5. Consumo del coche

Una hoja corta, la primera vez:

| Pregunta | Opciones |
|---|---|
| «¿Qué mueve tu coche?» | Diésel · Gasolina · Eléctrico · Híbrido · GLP · Otro |
| «¿Cuánto gasta?» | Botones con valores típicos: **Poco · Normal · Mucho** y la cifra a la vista (ej. diésel 4,5 / 5,5 / 7 l/100 km; gasolina 5,5 / 6,5 / 8; eléctrico 14 / 17 / 21 kWh/100 km). «Sé la cifra» para escribirla |
| «¿Dónde cargas?» (solo eléctrico) | En casa · Rápido · Ultrarrápido · Mezcla |

Los valores típicos son orientativos y los fijamos al programar (ver §7). Se guarda en `cfg().coches = [{ id, nombre, tipo, producto, consumo, unidad, carga }]` y `cfg().cocheUsado`. Varios coches posibles («El mío», «El de Paloma»), pero se empieza con uno. Sin migración.

## 6. Tandas

| Tanda | Qué hace | Base de datos | Riesgo |
|---|---|---|---|
| 0 | Hoja «Trayecto» en el +: km a mano, ida/vuelta, coche en `cfg()`, precio a mano, personas, «Apuntar gasto» y «Compartir» (con el tema de viaje si coincide) | Nada | Bajo |
| 1 | «Repetir trayecto» (en `cfg()`, sin direcciones) | Nada | Bajo |
| 2 | Precio de hoy: función + tabla `precios_carburante` + tarea diaria. Eléctrico con PVPC y medias fijas | Tabla nueva (Datos) | Medio |
| 3 | «Por sitios»: función `ruta-api` con OpenRouteService; respaldo línea recta × 1,25 | Nada (secreto nuevo) | Medio |

## 7. Riesgos

- **Fuente del Ministerio caída o cambia el formato:** se usa el último precio guardado y se dice su fecha («precio del 4/11»).
- **Cupo de rutas agotado:** se ofrece «Km a mano». Con pocos usuarios es improbable.
- **Que parezca exacto:** siempre «unos», y peajes y parking aparte.
- **Ubicación:** pedirla solo al tocar «Mi ubicación», nunca al abrir.

## 8. Preguntas para el dueño

1. **¿En el + o también como atajo en Inicio?** Recomendamos solo el + (y «Repetir»). Inicio no debe hacer scroll. *No bloquea.*
2. **¿Empezamos por la tanda 0 (todo a mano)?** Recomendado: sí, se prueba rápido con gente real. *Bloquea el siguiente paso.*
3. **¿Te vale crear una cuenta gratuita de OpenRouteService** (la clave va solo a secretos de Supabase)? Recomendado: sí, para la tanda 3. *Bloquea la tanda 3.*
4. **¿Precio por provincia o solo nacional?** Recomendamos provincia: cambia bastante y cuesta lo mismo. *Bloquea la tanda 2.*

## 9. Lo que no hemos podido confirmar

- Los cupos exactos del plan gratis de OpenRouteService hoy, y sus condiciones para apps públicas.
- La hora exacta de refresco del Ministerio (la fuente dice «diario»; hoy vimos datos de las 22:14).
- Cómo pide hoy Red Eléctrica el acceso a PVPC (si sigue sin clave).
- Precios medios reales de recarga rápida y ultrarrápida en España: no hay fuente oficial simple.
- Los consumos típicos de §5 son orientativos, no medidos.

## 10. Fuentes

- Precios Carburantes, API REST del Ministerio: https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/ — descargado el 06/11/2026 (productos y medianas).
- Ficha en datos.gob.es (frecuencia «Diario»): https://www.datos.gob.es/es/catalogo/e05068001-precio-de-carburantes-en-las-gasolineras-espanolas — 06/11/2026.
- Normas de uso de Nominatim: https://operations.osmfoundation.org/policies/nominatim/ — 06/11/2026.

Para el PDF: la hoja «Trayecto» dibujada en un móvil, con la tarjeta del resultado abajo y los dos botones.

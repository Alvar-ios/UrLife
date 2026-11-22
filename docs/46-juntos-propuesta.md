# 46 · Juntos: pruebas de experiencia y propuesta de estructura (22/11/2026)

*Desarrollo + Producto. Sin programar nada todavía. Recorrido hecho en la app con datos inventados (capturas en Chromium, 390 px) y leyendo el código de `main`. Personas de la prueba: **Ana** (solo vosotros dos, sin grupo), **Beatriz** (solo coincide contigo en el piso), **Carlos** (en el piso, sin la app) y alguien **nuevo**.*

## 1. Conclusión

1. **El fallo que viste es real y es de diseño, no un error suelto.** Con «+ Otra persona» la app solo crea un enlace de invitación. El gasto no se guarda porque esa persona no existe en «Con» hasta que acepta. Si das a Guardar, sale «Elige con quién lo compartes» y no pasa nada. Además, una persona sin la app (Carlos) **solo se puede usar dentro de un grupo**: no se le puede compartir un gasto a solas.
2. **El lío viene de que hay dos cosas casi iguales: «grupo» y «persona» (por dentro, un grupo «directo» de dos).** Se crean por caminos distintos, se invitan con enlaces distintos y solo los grupos admiten gente sin app. Propuesta: **todo es un grupo**. «Solo vosotros dos» pasa a ser un grupo de 2 que se crea solo. La vista de personas se queda, pero **solo para consultar** cuánto te debe alguien sumando todos los grupos.
3. **Una sola forma de compartir**, la misma desde el +, desde un gasto ya apuntado y desde Juntos. Al elegir «con quién», puedes escribir un nombre nuevo: se crea en el momento (sin app) y **el gasto se guarda ya**. La invitación a la app se ofrece después, nunca antes.
4. **La primera pantalla de Juntos**, con 3 bloques: tu saldo total, tus grupos y lo último. Personas, metas y actividad completa van un nivel por debajo.
5. **La pantalla del grupo, en 3 zonas fijas**: cabecera (foto, nombre y caras), **tu situación** con un solo botón, y pestañas **Gastos | Saldos | Más**. Fuera las frases explicativas de la vista general: pasan a «¿Qué es esto?» o a los ajustes.
6. **Foto del grupo**: necesita guardar imágenes en Supabase (almacenamiento + una columna nueva). Es una migración aditiva: **la preparo con Datos y Seguridad cuando digas «sí»**.

## 2. Pruebas de experiencia

Nota: de 1 (muy fácil) a 5 (no se puede). «Pasos» = toques desde que abres la app hasta que queda guardado.

### 2.1 Apuntar un gasto nuevo y compartirlo

| Caso | Cómo se hace hoy | Pasos | Nota | Fricciones |
|---|---|---|---|---|
| 1.1 Persona nueva | + → «Compartir un gasto» → importe → «+ Otra persona» → «Crear enlace» → WhatsApp → … y **el gasto no se guarda** hasta que acepte | — | **5** | El gasto se pierde. El texto «lo que estás creando no se pierde» es falso si cierras la hoja. En la hoja de Juntos ni siquiera hay «+ Otra persona», solo en la del +. |
| 1.2 Persona con la que ya compartes (Ana, sin grupo) | + → «Compartir un gasto» → importe → chip «Ana» → Guardar | 5 | 2 | Por defecto sale marcado el último destino (el piso): hay que acordarse de cambiarlo. Los chips van en una fila que se desliza y Ana o Beatriz pueden quedar tapadas. |
| 1.2b Persona de un grupo, a solas (Beatriz) | Igual, chip «Beatriz» | 5 | 2 | Funciona (se crea «solo vosotros dos» sin avisar). Pero **Carlos (sin app) no sale**: solo se le puede apuntar dentro del piso. |
| 1.3 Grupo | + → «Compartir un gasto» → importe → (grupo ya marcado) → Guardar | 4 | 1 | Bien. La hoja tiene mucho: tema, otra moneda, qué fue + categoría, pagó, para quién, fecha y cuenta. |

**Otra fricción general:** desde el + hay **dos caminos** con pantallas distintas. Uno es «Gasto» con el teclado propio, que no tiene «Compartir» a la vista (hay que pasar por «Más»). El otro es «Compartido», que abre la ficha larga con 3 filas de tipos, categorías y el bloque morado. La de Juntos es corta. Son tres hojas distintas para lo mismo.

### 2.2 Compartir un gasto ya apuntado

| Caso | Cómo se hace hoy | Pasos | Nota | Fricciones |
|---|---|---|---|---|
| 2.1 Persona sin PalomApp | Abrir el gasto → «Compartir este gasto» → «+ Otra persona» → solo invitación | — | **5** | No se puede. Si está en un grupo como «sin app», hay que elegir el grupo entero y desmarcar a los demás a mano. |
| 2.2 Persona individual sin grupo | Abrir → «Compartir este gasto» → chip → Guardar | 4 | 2 | El bloque morado está **a mitad de una ficha muy larga** (debajo de tipo y categorías). Hay que bajar para verlo y otra vez para Guardar. |
| 2.3 Persona con grupo | Igual, chip del grupo | 4 | 2 | Igual. Si la persona está en 2 grupos, no se sabe cuál elegir. |

En la ficha no hay ninguna pista de «¿lo compartes?» cuando el gasto parece de varios (cena, súper…). Se descubre de casualidad.

### 2.3 Quien recibe el gasto

| Caso | Qué le llega | Nota | Fricciones |
|---|---|---|---|
| 3.1 No tiene la app | **Nada.** Solo se entera si tú le mandas «Pedir por WhatsApp», y eso solo sale cuando ya debe algo. | **4** | El mensaje dice «me debes 24 €», pero no qué gasto es ni enlace para verlo. Para que entre en la app hay que ir a Ajustes del grupo → «Invitarle a la app». Nadie lo encuentra ahí. |
| 3.2 Tiene la app, sin grupo contigo | Si ya habíais compartido: aviso «Juntos · Álex apuntó Cena · te toca 24 €» y le aparece Álex en Personas. Si nunca habíais compartido: tiene que abrir un enlace de invitación primero. | 2 / 4 | Lo segundo es el caso 1.1: hasta que no acepta, no hay nada. |
| 3.3 Tiene grupo contigo | Aviso con el nombre del grupo + «apuntó X · te toca Y». En Juntos, punto de «nueva» en Actividad. | 1 | Bien. Al tocar el aviso entra en Juntos, no en el gasto. Desde el aviso no hay «Está mal» o «Ver de dónde sale». |

## 3. Propuesta

### 3.1 Un solo modelo: grupos

- **Todo lo compartido vive en un grupo.** «Solo vosotros dos» es un grupo de 2 con el nombre de la otra persona, que se crea solo la primera vez. Por dentro ya es así (`tipo: 'directo'`), así que para el usuario solo cambia que deja de verse como algo distinto.
- **Gente sin app en cualquier grupo**, también en los de 2. Hoy solo los grupos de verdad admiten «sin cuenta». Hay que permitirlo en el «directo», y eso necesita revisar la función de Supabase que crea ese grupo, con Datos y Seguridad.
- **La vista de personas se queda como resumen**: «Ana te debe 24 € entre todo», con desglose por grupo y «Saldar todo». No se crea nada desde ahí que no sea un gasto en un grupo.

### 3.2 Compartir: una sola hoja, en este orden

1. **¿Con quién?** Primero lo más probable: el último grupo y los 3 más usados, como tarjetas con foto o caras, no chips en fila. Debajo, un buscador «Escribe un nombre o grupo…». Si escribes un nombre que no existe, aparece «**Añadir “Marta” (sin app)**». Se crea al momento como persona sin app en un grupo de 2 con ella, y se sigue.
2. **¿Cuánto y qué fue?** Importe grande, una línea de descripción y categoría deducida.
3. **Pagó / para quién**: caras, como ahora en Juntos. Por defecto «Pagué yo, a partes iguales».
4. **Guardar**, que guarda siempre. Después, si había alguien sin app, aparece **un paso opcional**: «Marta no tiene PalomApp. ¿Le mandas el gasto por WhatsApp?». El mensaje lleva el concepto, su parte y un enlace para unirse que ocupa su sitio de «sin app» y se queda con todo.

Lo raro (tema, otra moneda, fecha, cuenta, por % o por importe) va en «Más opciones» dentro de la misma hoja, plegado.

- **Desde el +**: «Gasto» y luego un interruptor «Compartir» visible en la versión corta del teclado. Fuera el camino «Compartido» con la ficha larga.
- **Desde un gasto ya apuntado**: botón **«Compartir»** arriba (junto al importe), que abre la misma hoja con el importe y la fecha ya puestos. Fuera el bloque morado a mitad de la ficha.
- **Sugerencia suave**: si la categoría es Restaurantes, Viajes o Supermercado y tienes grupos, el botón se ve un poco más.

### 3.3 Primera pantalla de Juntos

```
Juntos
┌──────────────────────────────┐
│ Te deben 42 €   ·   Debes 0 € │  ← una cifra, sin frase («En tu grupo y con cada persona…» fuera)
│ [ + Compartir un gasto ]      │
└──────────────────────────────┘
Tus grupos                    + Nuevo
[foto] Piso calle Mayor   te deben 18 €
[A]    Ana                 te debe 24 €    ← los de 2 salen aquí, con la cara
[foto] Lisboa ✈︎            en paz
  Ver todos (5)
Lo último                     Ver todo
  Beatriz cambió «Compra…»   96 €
  Apuntaste «Luz»            75 €
Por persona ›                              ← enlace a la vista de personas (círculos actuales)
Metas y deudas juntos ›                    ← solo si hay alguna
```

- Una sola lista de grupos ordenada por uso, como ya pasa, con la cifra tuya a la derecha. Las tarjetas cuadradas de 2 columnas se cambian por **filas**: se lee mejor el importe y caben más.
- **Personas** baja a un enlace. Los círculos se quedan en esa pantalla, porque te gustan para «qué me debe X».
- **Actividad**, solo 3 líneas, y el punto de «nueva» se mantiene.
- Vacío (nadie): una tarjeta con «Comparte un gasto» y «Crea un grupo», como ahora.

### 3.4 Pantalla de un grupo

```
[foto]  Piso calle Mayor            ⚙
        Á A B C · 4 (1 sin app)
┌─ Tu situación ───────────────┐
│ Beatriz te debe 18 €          │
│ [ Me ha pagado ] [ Pedir ]    │   ← si hay varias deudas: «Te deben 18 € · ver»
└──────────────────────────────┘
[ Gastos ]  [ Saldos ]  [ Más ]
— Gastos —
  Viaje a Lisboa ▸ 96 €          ← temas como filas plegables, no chips + tarjeta
  20 nov  Compra grande     96 €  tu parte 32
  16 nov  Luz               75 €  tu parte 25
  Total 171 € · tu parte 57
                [ + Añadir gasto ]
```

- **Cabecera**: foto (o iniciales), nombre y caras. El engranaje lleva a Ajustes.
- **Tu situación**: una sola tarjeta con un solo mensaje y sus botones. «¿De dónde sale?» va dentro de la tarjeta, al tocar la cifra.
- **Pestañas**: Gastos | Saldos | **Más**. Planes, Metas y deudas del grupo, Historial y «Calcular gasolina» pasan a «Más». Hoy compiten con los gastos en la misma vista.
- **Gastos**: temas como filas que se abren. Fuera la fila de chips «Todo / Viaje…» más la tarjeta «Por temas», que repiten lo mismo dos veces. El total va al final de la lista, no arriba.
- **Textos fuera de la vista general**: «Una hucha para un viaje, la hipoteca…», «Cada grupo se cierra por su cuenta…» y similares. Pasan a una «i» o a la primera vez que se usa.
- **Ajustes del grupo**, en este orden: Foto y nombre → Miembros (con «Añadir por nombre» e «Invitar» juntos arriba) → Reparto habitual → Quién puede cambiar gastos → Tu nombre aquí → Salir o Cerrar. «Invitar a gente nueva» sube junto a Miembros.

### 3.5 Quien recibe

- **Sin app**: el WhatsApp que se ofrece al guardar dice qué gasto es («Cena del sábado: te toca 24 €») y lleva su enlace de unirse. «Pedir» también lo lleva.
- **Con app**: el aviso abre **el gasto**, no Juntos, con «¿Está bien?» y, si no lo está, «Avisar a Álex» (un comentario, más adelante). Al entrar por primera vez en un grupo nuevo, una tarjeta «Álex te ha añadido a…».

### 3.6 Foto del grupo

- En Ajustes, encima del nombre: tocar el círculo → elegir de la galería o hacer foto. Se recorta cuadrada y se reduce (unos 256 px, menos de 50 KB) **en el móvil** antes de subirla.
- Necesita: un espacio de imágenes (bucket) en Supabase que solo puedan leer los miembros del grupo, y una columna nueva opcional `grupos.foto`. Es aditiva y no toca datos existentes. **Requiere tu «sí» y la revisión de Datos y Seguridad.** Mientras no haya foto: iniciales sobre el color del grupo, como ahora.

## 4. Orden propuesto

| Tanda | Qué | Toca Supabase |
|---|---|---|
| 1 | Arreglar el fallo: en «Con», escribir un nombre nuevo crea la persona sin app y guarda el gasto. En grupos de 2 hace falta permitir «sin cuenta». | Sí (función del grupo de 2) |
| 2 | Una sola hoja de compartir (desde el +, desde un gasto y desde Juntos) + WhatsApp con detalle al guardar | No |
| 3 | Primera pantalla de Juntos nueva (versión anterior en «Antes») | No |
| 4 | Pantalla del grupo nueva + Ajustes reordenados (versión anterior en «Antes») | No |
| 5 | Foto del grupo | Sí (bucket + columna) |

Cada tanda con sus pruebas y la revisión de Calidad, en una rama sin publicar hasta que digas «publica».

## 5. Lo que no se ha probado

- Las pruebas son con datos inventados en un navegador, no en un móvil real ni con dos cuentas de verdad. Lo que recibe la otra persona (3.x) se ha deducido del código de avisos (`supabase/functions/avisar/logica.js`), no de un móvil.
- No he medido tiempos. «Pasos» son toques contados a mano.

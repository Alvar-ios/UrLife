# 47 · Guía de permisos: que se apunten solos tus pagos

Producto y Diseño · 24/11/2026 · Encargo: que todos los usuarios de Android sepan activar la lectura de avisos del banco, con una guía muy ilustrativa en la bienvenida y fuera de ella.

## 1. Conclusión

1. Hoy casi nadie llega a la explicación: la pantalla G5 de la bienvenida **solo sale si se elige «Controlar mis gastos»**, puede **recortarse** (está en `BV_RECORTE`) y quien ya pasó la bienvenida solo la encuentra en Tú → Avisos. Además, G5 es texto y un botón «Activar» que te suelta en los ajustes de Android sin decirte qué vas a ver.
2. Propuesta: **una sola guía** («Que se apunten solos», 3 pasos + «Pruébalo») con **dibujos propios** que imitan cada pantalla de Android que va a aparecer, con un dedo que señala dónde tocar. Cada paso se marca solo como hecho al volver a PalomApp (`avNat().estado()`, `notifNat().permiso()`).
3. La misma guía vive en 4 sitios: bienvenida (sustituye a G5), Tú → Avisos, Primeros pasos y **un aviso en Inicio, una sola vez**, para los usuarios de Android que ya existen y no lo tienen activado.
4. En la web y en iPhone no se enseña nada de esto (no existe la lectura).
5. Para que la guía sea exacta hacen falta **3 datos nuevos del móvil** (de dónde se instaló la app, si la batería está sin restricciones y la marca del móvil). Es un cambio pequeño en la parte de Android y obliga a una APK nueva; sin él, la guía funciona igual pero enseña algún paso de más.

## 2. Permisos, revisados

Revisado en `AndroidManifest.xml`, los complementos de `movil/package.json` y `AvisosBancoPlugin.java`. Además de los 4 del encargo, aparece uno más: **«Alarmas y recordatorios»** (lo declara el complemento de recordatorios).

| Permiso (nombre en Android) | Para qué sirve | Cuándo se pide | Si no se da |
|---|---|---|---|
| **1. Notificaciones** de PalomApp (Android 13+) | Recordatorios, avisos de Juntos y el aviso «Apuntado» con «Deshacer» | Diálogo del sistema: en N1 de la bienvenida, al entrar la primera vez o en el paso 1 de la guía | No llega ningún aviso. Los pagos del banco se siguen apuntando (ver §6), pero sin el aviso con «Deshacer» |
| **2. Acceso a notificaciones** | Leer los avisos de las apps de banco y de pago | Solo en los ajustes de Android (paso 2 de la guía) | No se apunta nada solo |
| **3. Permitir ajustes restringidos** (menú ⋮ de «Información de la app», Android 13+) | Desbloquear el permiso 2 | Solo si la app **no** viene de Google Play y el interruptor del paso 2 sale gris | El interruptor del permiso 2 no se puede activar |
| **4. Batería «Sin restricciones»** | Que Android no duerma el lector | Paso 3 de la guía (recomendado) | En algunos móviles deja de leer al rato, sin avisar |
| **5. Inicio automático** (solo Xiaomi, Huawei, Honor, Oppo, Vivo, Realme) | Que vuelva a leer tras apagar el móvil | Paso 3, solo en esas marcas | Tras reiniciar, no lee hasta abrir PalomApp |
| **6. Alarmas y recordatorios** (Android 14+) | Que los recordatorios lleguen a la hora exacta | **No proponemos pedirlo** | Pueden llegar unos minutos tarde. No afecta a los pagos del banco |

Sin permiso visible (no hay que explicar nada): Internet, huella (la pide la propia huella al usarla), cámara y galería para los tickets (usan el selector del sistema), widgets, y volver a programar recordatorios al encender el móvil.

## 3. La guía, paso a paso

**Forma:** una pantalla por paso con un dibujo arriba (unos 240 × 200 px, cabe a 375 px), un título, una frase y un botón grande abajo, al alcance del pulgar. Puntos de progreso arriba (3 pasos). «Ahora no» siempre visible. Los pasos ya hechos se saltan solos.

**Dibujos:** HTML/CSS propios (sin capturas, sin logos de Google, Samsung ni bancos). Imitan un Android neutro: marco de móvil redondeado, fondo gris muy claro (gris oscuro en modo oscuro), letra del sistema y un interruptor genérico. Lo único con color: el icono de PalomApp y **un dedo con un anillo que late** (color de acento de la paleta) encima de lo que hay que tocar. Animación de 1,5 s en bucle y que pare con «reducir movimiento». Iconos de la app (`ic()`); no hace falta uno nuevo salvo, si se quiere, una pila para la batería (`bateria`).

| Paso | Dibujo | Título y texto exactos | Botón | Se marca hecho cuando |
|---|---|---|---|---|
| **0 · Portada** | Un aviso de banco genérico («Tu banco · Pago de 12,50 € en Mercado») que baja hasta convertirse en una fila de PalomApp «Mercado −12,50 €» con «Deshacer» | **Que se apunten solos** · «Cuando tu banco te avise de un pago, PalomApp lo apunta por ti. Son 3 pasos y tardas un minuto.» Debajo, las 2 filas de privacidad de hoy (`shield`, `bank`) | **Empezar** | — |
| **1 · Que PalomApp te avise** | Diálogo del sistema: icono de PalomApp, «¿Permitir que PalomApp te envíe notificaciones?», botones «Permitir» (con el dedo) y «No permitir» | «Así verás cada pago apuntado y podrás darle a «Deshacer» si no es tuyo.» · Nota pequeña: «En la ventana que sale, toca **Permitir**.» | **Permitir avisos** (`avPermisoNotif`) | `notifNat().permiso() === 'granted'` (en Android 12 o menos ya viene dado: se salta) |
| **2 · Deja que lea los avisos** | Dos viñetas seguidas: (a) lista «Acceso a notificaciones» con 3 apps grises y la fila **PalomApp** con su interruptor y el dedo; (b) el diálogo «¿Permitir el acceso a las notificaciones de PalomApp?» con «Permitir» señalado | «Se abrirán los ajustes del móvil. Busca **PalomApp**, activa el interruptor y toca **Permitir**. Después vuelve aquí con la flecha de atrás.» | **Abrir ajustes** (`avActivar`) | `avNat().estado()` → `activo && permiso`, al volver a la app |
| **2b · Si sale en gris** (solo si se vuelve sin permiso y la app no viene de Google Play) | Tres viñetas: (a) el aviso gris «Ajuste restringido»; (b) «Información de la app» de PalomApp con los ⋮ arriba a la derecha señalados; (c) el menú abierto con «Permitir ajustes restringidos» señalado | **¿Te sale en gris?** · «Android lo bloquea en las apps que no vienen de Google Play. Toca los **⋮** de arriba, elige **Permitir ajustes restringidos** y pon tu huella o PIN. Luego vuelve a probar el paso 2.» | **Abrir ajustes de PalomApp** (`avAbrirApp('app')`) y enlace «Volver al paso 2» | Igual que el paso 2 (el móvil no deja saber este paso por sí solo) |
| **3 · Que no se duerma** | Pantalla «Batería» de la app con 3 opciones: «Sin restricciones» (marcada, con el dedo), «Optimizada», «Restringida». En las marcas del punto 5, una segunda viñeta con «Inicio automático» y su interruptor | «Algunos móviles apagan las apps para ahorrar batería. Entra en **Batería** y elige **Sin restricciones**.» (+ en esas marcas: «y activa **Inicio automático**».) | **Abrir ajustes de PalomApp** · enlace «Ya lo he hecho» | Con el dato nuevo `bateriaLibre`: solo. Sin él: al tocar «Ya lo he hecho» (se guarda en este móvil) |
| **4 · Pruébalo** | Un móvil con un Bizum genérico entrando («Te han enviado 1,00 €») y, al lado, Inicio con la fila nueva resaltada | **¡Listo! Ahora, pruébalo** · «Paga algo con tarjeta o pide a alguien un Bizum de 1 €. En unos segundos lo verás apuntado en Inicio.» | **Entendido** · enlace «Mandarme un aviso de prueba» (`avProbar`) | Cuando llega el primero bien leído (`estado().vistos` con `leido && marcado`): un toque de celebración (`sentir('ok')`, sello «Piloto automático») |

Notas:
- El paso 3 es **recomendado**, no obligatorio: lleva «Saltar». En Google Pixel y móviles sin capas propias, con el dato `marca`, se puede omitir.
- Si el paso 1 se niega dos veces, Android ya no vuelve a preguntar: el botón pasa a «Abrir ajustes» y el dibujo cambia a la pantalla de notificaciones de la app con su interruptor (lo que ya hace `avPermisoNotif`).
- El texto «Pruébalo» no puede esperar dentro de la bienvenida: allí se muestra y se sigue. La fila «Pruébalo: haz un pago» queda en Primeros pasos hasta que llegue el primero.

## 4. Dónde vive

| Sitio | Qué cambia | Quién lo ve |
|---|---|---|
| **Bienvenida** | G5 pasa a ser la portada (paso 0) y los pasos 1-4 van dentro de la misma pantalla (no suman pantallas al tope de 10). **Quitar G5 de `BV_RECORTE`** y enseñarla a todo usuario de Android, haya elegido o no «Controlar mis gastos» (al activarla se enciende la herramienta «Avisos del banco»). Si se activa aquí, N1 se acorta (el permiso de avisos ya está dado). | App de Android |
| **Tú → Avisos** | La tarjeta larga de explicación se sustituye por la portada de la guía (dibujo + «Empezar»). «Comprobar» sigue debajo, igual. | App de Android |
| **Primeros pasos** | La fila `piloto` abre la guía directamente en el paso que falte (no la hoja de Avisos). Mientras falte el primer pago leído: «Pruébalo: haz un pago». | Android, quien la saltó |
| **Aviso en Inicio** | Tarjeta pequeña: mini dibujo (aviso → fila), «**Tus pagos pueden apuntarse solos** · Con los avisos de tu banco, en un minuto.» Botones **Ver cómo** / **Ahora no**. | Ver condiciones abajo |
| **Si se pierde el permiso** | Si estaba activo y Android lo quita (pasa tras actualizar o en algunas marcas): fila de aviso «Los avisos del banco se han parado» → guía en el paso que falte. | Android |

**Condiciones del aviso en Inicio** (sin agobiar):
- App de Android, lectura no activada (`!(activo && permiso)`), fuera de la bienvenida y a partir de la **segunda** vez que abre la app.
- **Una sola vez**: «Ahora no» o «Ver cómo» la quitan para siempre. Se guarda en `cfg().guiaAvisos = { inicioVisto: true }` (configuración en JSON, sin migración), así no sale en otro móvil.
- Nunca a la vez que otro aviso de Inicio: va detrás de la invitación pendiente.
- No sale si apagó «Avisos del banco» a propósito en Mis herramientas.

**Datos nuevos del móvil** (en `estado()`, parte de Android; APK nueva): `instalador` (Google Play o no: así el paso 2b solo sale a quien lo necesita), `bateriaLibre` (si ya tiene la batería sin restricciones) y `marca` (para Inicio automático). Abrir la pantalla de batería con los ajustes de la app, **no** con la ventana directa de «ignorar optimización», porque Google Play la limita.

## 5. Web e iPhone

- Si no hay `avNat()` no se enseña nada: ni pantalla en la bienvenida, ni fila en Primeros pasos, ni aviso en Inicio. Tú → Avisos mantiene su frase de hoy: «Los avisos del banco solo están en la app de Android.»
- No se anuncia en la web ni en iPhone de momento. La vía de iPhone (Atajos) se diseñará aparte.

## 6. Riesgos

- **Enseñar a «permitir ajustes restringidos» se parece a lo que piden las estafas.** `docs/39` decidió no enseñarlo; desde el 13/11 la app ya lo explica. Lo dejamos solo para quien no tenga la app de Google Play y lo quitamos cuando todos la tengan de allí.
- **Los dibujos no serán idénticos** a todos los Android (Samsung y Xiaomi cambian nombres y sitios). Por eso son genéricos, y el texto habla de «el interruptor de PalomApp», no de un menú concreto.
- Pedir 3 cosas seguidas puede cansar: por eso se saltan los pasos hechos y el de batería es opcional.

## 7. Preguntas para el dueño

1. **¿Enseñamos la guía en la bienvenida a todos los de Android**, aunque no elijan «Controlar mis gastos»? Recomendado: sí. *(Bloquea el cambio en la bienvenida.)*
2. **¿Hacemos la APK nueva con los 3 datos del móvil** (instalador, batería, marca)? Sin ellos, el paso «¿Te sale en gris?» sale a quien vuelve sin permiso y el de batería se marca a mano. *(No bloquea: se puede empezar sin ellos.)*
3. ¿Te parece bien **no pedir** «Alarmas y recordatorios» (recordatorios quizá unos minutos tarde)? Recomendado: no pedirlo.

## 8. Lo que no hemos podido confirmar

- Si sin el permiso 1 el lector **sigue apuntando** los pagos (solo sin enseñar el aviso). Por el código parece que sí; no probado en un móvil.
- Que en Android 13-15 la opción «Permitir ajustes restringidos» del ⋮ **solo aparece después de intentar activar** el permiso una vez (por eso 2b va detrás del 2). Muy citado, sin probar en un móvil real.
- Cómo se comporta el complemento de recordatorios sin «Alarmas y recordatorios» en Android 14+ (cuánto retrasa).
- Los nombres exactos en Xiaomi (HyperOS), Huawei y Oppo para batería e inicio automático; los textos de la guía son genéricos a propósito.

## 9. Fuentes

- Google, «Información sobre los ajustes restringidos» (pasos: Ajustes → Aplicaciones → la app → Más → «Permitir ajustes restringidos»; solo Android 13+): https://support.google.com/android/answer/12623953?hl=es · consultado 24/11/2026.
- Código de la app (rama `main`, 24/11/2026): `app.js` (`bvG5Html`, `bvLista`, `BV_RECORTE`, `avisosHtml`, `avRestringidoHtml`, `avComprobarHtml`, `bvPpCandidatas`), `AvisosBancoPlugin.java`, `AndroidManifest.xml`, `movil/package.json`.
- Antecedentes: `docs/39-avisos-del-banco.md`, `docs/45-bienvenida-propuesta.md`.

Para el PDF: dibujar en fila los 5 dibujos de la guía (portada, diálogo de notificaciones, lista con interruptor, menú ⋮, batería) como miniaturas de móvil con el dedo señalando, y debajo el mapa de los 4 sitios donde vive la guía.

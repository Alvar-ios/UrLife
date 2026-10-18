# 05 · Lo que la gente critica de Tricount y Splitwise (y qué hacemos nosotros)

*Producto y diseño · investigación del 18/10/2026. Cada crítica lleva su enlace y la fecha de la reseña. Las cifras salen de páginas de reseñas que hemos leído una a una, no de encuestas: sirven para saber qué se repite, no para medir a todos los usuarios.*

## 1. Conclusión

1. **La queja que más se repite, con mucha diferencia, es de Splitwise: el límite de la versión gratis.** Desde noviembre de 2023 solo deja apuntar 3 o 4 gastos al día, con una espera de 10 segundos, y empuja a pagar unos 40 al año. De 39 reseñas negativas distintas que hemos leído en Trustpilot, **31 hablan del límite o del precio**.
2. **En Tricount la queja es de confianza:** saldos que no cuadran, datos que desaparecen o cambian solos, y una versión nueva que no gusta. Desde que es de bunq, además, la app empuja la tarjeta del banco.
3. **Las tres cosas que más nos sirven:** que las cifras cuadren y se expliquen («¿por qué debo esto?»), que no se pierda nada (deshacer e historial del grupo) y seguir gratis, sin límites ni anuncios, y decirlo. Las tres se pueden hacer con esfuerzo bajo o medio.
4. **Ya ganamos en dos cosas que Splitwise cobra: leer el ticket y repartirlo por artículo.** Pero tenemos un límite (60 lecturas al mes por persona) que hay que enseñar antes de que se acabe, para no repetir el error de Splitwise: cambiar las reglas sin avisar.
5. **Lo que nos falta y la gente valora:** varias monedas en los viajes, poder ver el grupo sin crear cuenta y una forma de escribirnos desde la app.

## 2. Las críticas más repetidas

Peso: cuántas reseñas negativas de las que hemos leído hablan de eso. En Splitwise, 39 reseñas negativas distintas de 3 páginas de Trustpilot (de un total de 72 reseñas, nota 2,0 de 5). En Tricount, 9 reseñas negativas de 1 página de Trustpilot (de 43 reseñas, nota 3,0 de 5), más un informe de reseñas de Google Play.

| # | Qué critica la gente | App | Peso en lo leído | Ejemplo literal (país, fecha) | Fuente |
|---|---|---|---|---|---|
| 1 | **Límite de gastos al día** y espera de 10 s en la versión gratis | Splitwise | **23 de 39** · también en Google Play y en foros | «Only able to add 3 expenses per day makes the app worthless» (BE, 12-03-2024). «Can't add more than 2 expenses a day» (27-08-2026) | [T-ie2], [T-nl3], [T-au], [ITV] |
| 2 | **Precio** y funciones que pasan a ser de pago (ticket, reparto por artículo, monedas, búsqueda) | Splitwise | **8 de 39** | «£40 a year with only an annual subscription is overkill» (GB, 22-04-2026) | [T-au], [FIN], [TF] |
| 3 | **Los saldos no cuadran** o cada persona ve uno distinto | Tricount y Splitwise | **3 de 9** (Tricount) · 1 de 39 (Splitwise) | «The balances are not shown correctly, it's not trustable» (DK, 12-04-2025). «each person see a different owing and owed» (SG, 30-09-2024) | [TC-nl2], [T-ie2] |
| 4 | **Datos perdidos**, la app se reinicia o cambia cosas sola | Tricount | **3 de 9** · tema principal en Google Play | «se borran todos los datos introducidos» (ES, 04-04-2025). «keeps adding/modifying names of people on my Tricount by itself» (Google Play, informe de dic. 2025) | [TC-nl2], [KT] |
| 5 | **Cambios sin avisar** y versión nueva peor | Splitwise y Tricount | 2 reseñas explícitas; casi todas las del n.º 1 dicen «de repente» | «They should at least contact users for change of policy» (DE, 12-12-2023). «Je n'aime pas du tout cette nouvelle version» (FR, 24-12-2024) | [T-ie2], [TC-nl2] |
| 6 | **Faltan:** pagar a plazos, exportar (CSV) y gastos fijos | Tricount | Google Play y App Store | «settlement by installment instead of single 'mark as paid' button» (Google Play, informe de dic. 2025) | [KT], [MKT01] |
| 7 | **El banco se mete en la app** (vende su tarjeta) | Tricount | 1 hilo, 2 personas | «bunq integration is very heavily built into the app and it does upsell cards» (08-06-2026) | [MZ] |
| 8 | **Soporte que no responde** (bots) | Tricount y Splitwise | Google Play · 3 de 39 (pagos en EE. UU.) | «customer service resolving the payment issue is nonexistent» (US, 08-04-2026) | [KT], [T-au] |
| 9 | **No poder entrar** en la cuenta | Tricount | 1 de 9 | «No consigo iniciar sesión. Es desesperante.» (ES, 29-03-2025) | [TC-nl2] |

## 3. Qué hace hoy PalomApp y qué oportunidad nos da

Visto en el código de Juntos (`app.js`) el 18/10/2026, sin probarlo en un móvil real.

| # | PalomApp hoy | Oportunidad para nosotros | Esfuerzo |
|---|---|---|---|
| 1 | Sin límite de gastos, sin espera y sin anuncios | Decirlo donde se decide: en Juntos vacío, al invitar y en el mensaje de WhatsApp: «Sin límites ni anuncios». | **Bajo** (texto) |
| 2 | Ticket por foto y reparto por artículo, gratis, con **60 lecturas al mes por persona** (`LIMITE_MES`). Buscar es gratis. **Monedas: solo cambia el símbolo, no convierte** | Enseñar «Te quedan 12 lecturas este mes» antes de que se acaben (hoy solo se ve al llegar al límite o tras leer). Modo viaje con otra moneda por grupo (ya propuesto en `docs/04-juntos.md`, n.º 9) | **Bajo** (aviso) · **Alto** (monedas: columnas nuevas, pasar por Datos y seguridad) |
| 3 | Cuentas en céntimos y simplificadas por grupo. **Pero hay un fallo conocido:** 35 € arriba y 30 € al abrir (`docs/04-juntos.md`, punto 3). Nadie ve de dónde sale su cifra | Arreglar el 35 / 30 lo primero. Botón **«¿De dónde sale?»** en cada saldo: los gastos y pagos que lo forman, sumando exactamente esa cifra. Y una prueba automática que compruebe que la cifra de fuera y la de dentro coinciden | **Bajo-medio** |
| 4 | Datos en el servidor y en vivo. Borrar un movimiento propio tiene «Deshacer» y papelera de 15 días; **borrar un gasto compartido, no** (`doDeleteComp` lo borra sin deshacer, y para todos). No hay historial de quién cambió qué | «Deshacer» al borrar un gasto compartido. **Historial del grupo:** quién apuntó, cambió o borró, y cuándo (amplía la «Actividad» de `docs/04-juntos.md`, n.º 4). Más adelante, «Recuperar» para cualquiera del grupo | **Bajo** (deshacer) · **Medio** (historial; recuperar puede necesitar guardar copias en el servidor: Datos y seguridad) |
| 5 | Hay «Novedades» en lenguaje sencillo | Una regla escrita: nada que hoy es gratis pasa a ser de pago o con límite sin avisar dentro de la app con antelación | **Bajo** |
| 6 | **Saldar ya deja cambiar el importe** (pago parcial posible). Hay cobros y pagos fijos, pero **no hemos visto fijos compartidos** en un grupo. La copia de seguridad (.json) incluye lo compartido, pero no se lee a simple vista | Mantener «Pagar solo una parte» a la vista en el saldar nuevo. **«Descargar el grupo en Excel»** (fecha, qué, quién pagó, parte de cada uno). **Gasto fijo compartido** (alquiler, luz) para pisos y parejas | **Bajo** · **Bajo-medio** · **Medio** |
| 7 | No hay anuncios ni se vende nada | Contarlo como diferencia: «No somos un banco ni te vendemos nada» | **Bajo** (texto) |
| 8 | **No hay forma de escribirnos desde la app** | «Escríbenos» en Tú (WhatsApp o correo), contestado por una persona. Somos pocos: es una ventaja que no tienen ellos | **Bajo** |
| 9 | Hace falta cuenta para usar la app; otros pueden apuntar a «personas sin cuenta» e invitarlas por WhatsApp | **Enlace para ver el grupo sin cuenta** (solo ver, nunca cambiar). Settle Up ya lo hace (`docs/marketing/01-competencia.md`) | **Alto** (seguridad: Datos y seguridad) |

**Orden que proponemos:** 3 (cifras que cuadran) → 4 (deshacer e historial) → 1, 2, 5, 7 y 8 (textos y avisos, juntos en un solo cambio) → 6 → monedas y enlace sin cuenta.

## 4. Lo que sí gusta de ellos y no debemos perder

| Lo que gusta | Prueba | PalomApp |
|---|---|---|
| **Gratis de verdad, sin anuncios ni límites** (Tricount) | 4,8★ con 14.807 valoraciones en App Store Alemania [MKT01] | Igual; hay que mantenerlo |
| **Simple y estable durante años** | «this was a great stable app for all these years» (Splitwise, US, 16-06-2024) [T-ie2]. Lo que echan de menos es la app sencilla de antes | Apuntar en pocos toques (propuesta 3.4 de `docs/04-juntos.md`) |
| **Simplificar deudas** en pocos pagos y grupos sin límite | En Splitwise sigue gratis [FIN] | Ya lo hacemos por grupo; falta decirlo |
| **Buena para viajes** | «great trip manager» (Google Play, ene. 2024) [KS] | Modo viaje (pendiente) |
| **Pedir el pago desde la app** | Tricount lo anuncia en su web [TCU] | «Pedir por WhatsApp» (propuesto en `docs/04-juntos.md`) |

## 5. Riesgos

- **Las reseñas negativas exageran:** Trustpilot atrae a gente enfadada. Tricount tiene 4,8★ en App Store: la mayoría está contenta. No hay que confiarse.
- **Prometer «siempre gratis»** nos ata si la lectura de tickets (que cuesta dinero por uso) crece mucho.
- **El historial y «Recuperar» para todos** guardan más datos de otras personas: decidir con Datos y seguridad qué se guarda y cuánto tiempo.
- **El enlace sin cuenta** puede dejar ver gastos a quien no debe si se reenvía.

## 6. Preguntas para el dueño

1. **(Bloquea los textos)** ¿Prometemos por escrito «apuntar y repartir gastos será siempre gratis, sin límites ni anuncios»? La lectura de tickets quedaría aparte, con su límite a la vista.
2. Después del rediseño de Juntos, ¿qué va antes: **confianza** («¿De dónde sale?», deshacer e historial del grupo) o **viajes** (otra moneda por grupo)?
3. ¿Queremos que alguien **sin cuenta pueda ver** el grupo con un enlace (solo ver)? Si es que sí, pasa antes por Datos y seguridad.

## 7. Lo que no hemos podido averiguar o confirmar

- **No hemos podido leer las fichas de App Store ni de Google Play:** la herramienta no nos dejó abrirlas. Lo de Google Play sale de dos informes de Kimola, que solo enseñan 6 reseñas de 30 (el resto es de pago).
- **Reddit y X:** las búsquedas no devolvieron hilos sobre esto, así que no hay nada de ahí. Tampoco de Product Hunt.
- **A media investigación se agotó el cupo de la herramienta de lectura de páginas** (16:10 del 18/10/2026). Quedaron sin leer: Xataka Móvil (comparativa en español), más páginas de Trustpilot de Tricount y la web de ayuda de Splitwise.
- **El límite exacto de Splitwise hoy no es oficial:** las reseñas hablan de 2, 3 o 4 gastos al día. Su precio en España no lo hemos confirmado (las reseñas dan 40 £ al año en Reino Unido y 5 $ al mes en EE. UU.).
- **No sabemos si Tricount ya permite pagar a plazos o exportar.** La queja es de 2025.
- **De Tricount solo hemos leído una página de Trustpilot (9 reseñas negativas).** Su peso real puede ser distinto.
- **Las críticas de pagos de Splitwise** (dinero retenido, soporte) son de su servicio de pagos en EE. UU.; en España no aplican.

## 8. Fuentes (consultadas el 18/10/2026)

- [T-ie2] Trustpilot, Splitwise, página 2: https://ie.trustpilot.com/review/splitwise.com?page=2
- [T-nl3] Trustpilot, Splitwise, página 3: https://nl-be.trustpilot.com/review/splitwise.com?page=3
- [T-au] Trustpilot, Splitwise, página 1 (nota 2,0 · 72 reseñas): https://au.trustpilot.com/review/splitwise.com
- [TC-nl2] Trustpilot, Tricount, página 2 (nota 3,0 · 43 reseñas): https://nl-be.trustpilot.com/review/tricount.com?page=2
- [ITV] IT Voice, «Splitwise has introduced restrictions…» (30-12-2023): https://www.itvoice.in/splitwise-has-introduced-restrictions-on-the-number-of-free-expenses-users-can-add
- [TF] TechnoFino, foro, «Splitwise is useless without Pro now» (sin fecha visible): https://technofino.in/community/threads/splitwise-is-useless-without-pro-now.19199
- [KS] Kimola, informe de reseñas de Splitwise en Google Play (26-12-2024; reseñas de enero de 2024): https://kimola.com/reports/splitwise-app-feedback-report-uncover-user-insights-google-play-en-144452
- [KT] Kimola, informe de reseñas de Tricount en Google Play (13-12-2025): https://kimola.com/reports/in-depth-tricount-app-feedback-report-reveals-crucial-insights-google-play-en-157042
- [FIN] Finny, «Best Splitwise alternatives 2026» (05-08-2026). **Interés propio: es una app de la competencia.** https://getfinny.app/blog/best-splitwise-alternatives-2026
- [MZ] Comunidad de Monzo, «New tool for bill splitting: Tricount (from Bunq)» (08-06-2026): https://community.monzo.com/t/new-tool-for-bill-splitting-tricount-from-bunq/194497
- [TCU] Tricount, página de funciones actuales. **Interés propio: es su web.** https://tricount.com/update
- [MKT01] Nuestro informe `docs/marketing/01-competencia.md` (16-10-2026): valoración de Tricount en App Store Alemania y quejas por fijos y rediseño.
- Código de PalomApp (`app.js`: `saldosDe`, `deudasDe`, `saldarHtml`, `doDeleteComp`, `papeleraAnadir`, `exportBackup`, `MONEDAS`; `supabase/functions/tickets-ia/index.ts`: `LIMITE_MES`), 18/10/2026.

Para el PDF: una barra grande con las 39 reseñas negativas de Splitwise partidas en «límite» (23), «precio» (8) y «otras» (8), y al lado las 9 de Tricount en «saldos» (3), «datos perdidos» (3) y «otras» (3).

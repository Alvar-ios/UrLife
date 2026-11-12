# Diagnóstico del importador de extractos · 12/11/2026

C4 de `docs/40-plan-sesion-potente.md`. Hecho por Desarrollo **antes** de cambiar nada.

**No hay extractos reales.** Los 12 archivos de `tests/datos/extractos/` son inventados (cuentas, nombres e importes), pero imitan la forma de lo que descarga cada banco: filas del banco antes de la tabla, nombres de columnas, fechas e importes. Se crean con `tests/datos/extractos/generar.js`; lo que debe salir está en `esperado.json`. Prueba: `tests/test151_importar_bancos.js`.

Para cada archivo se mira, sin tocar nada a mano: ¿salen todas las filas con su fecha e importe (con su signo)?, ¿con su descripción?, ¿cuadra con la columna de saldo y el último saldo es el del banco?

## Resultado antes de los cambios

| Archivo | Cómo es | Filas, fechas e importes | Saldo | Qué fallaba |
|---|---|---|---|---|
| `santander.xlsx` | 4 filas de banco, del más nuevo al más viejo, fechas de Excel | Bien | Bien | — |
| `santander_latin1.csv` | `;`, Windows-1252, «-1.234,56» | Bien | Bien | — |
| `sabadell.xls` | «.xls» que en realidad es una tabla HTML, todo en texto | **Mal** | **Mal** | El lector de Excel convertía «01/10/2026» en fecha americana (10 de enero) y «1.890,50» en 1,89. Fechas e importes inventados. |
| `bbva.xlsx` | Columna A vacía, «Disponible» en vez de «Saldo» | Bien | **No lo veía** | «Disponible» no se reconocía como saldo. |
| `caixabank.xls` | Excel 97, «Ingreso (+)» y «Gasto (-)» separadas, fechas de Excel | **Mal** (3 de 5: faltaban los ingresos) | **Mal** | No reconocía «Ingreso» / «Gasto» como abonos y cargos: cogía «Gasto (-)» como importe único y todo como gasto. |
| `ing.xlsx` | 5 filas de banco, categoría del banco, «IMPORTE (€)» | Bien | Bien | — |
| `n26.csv` | `,` y comillas, en inglés, «aaaa-mm-dd», «-12.5» | Bien | (N26 no da saldo) | — |
| `revolut.csv` | `,`, «aaaa-mm-dd hh:mm:ss», «1234.56», columna State | **Mal** (6 en vez de 5) | **Mal** (3 de 4) | Metía también la fila **REVERTED** (pago anulado, −45 €). |
| `traderepublic.csv` | `,`, fechas «01 oct 2026», «Entrada / Salida de dinero» con «1.000,00 €» | **Nada** (0 filas) | **No** | No entendía las fechas con el mes en letra. Además, con columna Tipo y cargos/abonos separados, un «Pago con tarjeta» se habría guardado como devolución (importe negativo). |
| `openbank.xls` | Excel 97 con columnas vacías entre medias, todo en texto | Bien | Bien | — |
| `norma43.n43` | Norma 43 (AEB 43) | **Nada** | **No** | Formato no soportado: el selector ni lo dejaba elegir. |
| `norma43_extracto.txt` | Norma 43 con extensión .txt | **Nada** | **No** | Se leía como CSV y no salía ninguna fila. |

Resumen: entraban bien 6 de 12 (Santander ×2, BBVA salvo el saldo, ING, N26, Openbank). Fallaban Sabadell, CaixaBank, Revolut, Trade Republic y Norma 43.

## Otras cosas vistas (no salen en la tabla)

- **Recordar el formato y la cuenta** ya existía (`cfg().importPerfiles`, por la fila de títulos del archivo, con la cuenta elegida). Pero la segunda vez seguía pasando por la pantalla de columnas: dos toques más de lo necesario.
- **No duplicar** el mismo archivo ya funcionaba (`hash53` de usuario + fecha + importe + texto). Los gastos que vienen de **avisos** (`origen: 'aviso'`) se comparaban como cualquier otro apunte: mismo importe el mismo día = «ya lo tenías»; a 1–3 días, «¿es el mismo?» (hay que contestar).
- La **comisión** de Revolut (columna Fee) no se suma al importe. Con comisión distinta de 0, el saldo no cuadraría. No se arregla en esta tanda (es raro en cuentas en euros).
- PDF: no se estudia ahora (Trade Republic y algunos bancos solo dan PDF del resumen); queda anotado.

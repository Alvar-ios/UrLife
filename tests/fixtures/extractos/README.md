# Extractos de ejemplo (datos inventados)

Para las pruebas de la fase 2 de cuentas (`docs/30-cuentas-fase2.md`). Todo es inventado: ni bancos, ni personas, ni importes reales.

| Archivo | Qué prueba | Lo que debe salir |
|---|---|---|
| `santander_ejemplo.csv` | `;`, 4 líneas antes de los títulos, del más nuevo al más viejo, columna Saldo, dos cafés iguales el mismo día, traspaso a otra cuenta, cajero, devolución | 11 filas. Los importes cuadran con el Saldo en las 11. Último saldo en el tiempo: 1.455,54 € el 20/10/2026 (es la primera fila del archivo). Los dos cafés entran los dos. «TRANSFERENCIA A ING AHORRO» −500,00 € el 03/10 = traspaso Santander → ING. «REINTEGRO CAJERO» = traspaso a Efectivo si existe esa cuenta. |
| `ing_ejemplo.csv` | Del más viejo al más nuevo, cabecera con «(€)», la otra mitad del traspaso un día después | 5 filas, cuadran con el Saldo; último saldo 3.455,75 € el 18/10. «TRANSFERENCIA DESDE SANTANDER» +500,00 € el 04/10 = la otra mitad: no se importa si ya está el traspaso. «PAGO CAFETERIA EJEMPLO» −1,50 € el 05/10 es idéntico a un café de Santander: tiene que entrar en ING aunque Santander ya esté importado. |
| `excel_propio_ejemplo.csv` | Excel propio con columna Tipo, importes en positivo y miles sin decimales | Importes 2.500 / 1.200 / 87,35 / 9 / 150. Hoy `parseNum` lee 2,5 y 1,2 (fallo conocido). |

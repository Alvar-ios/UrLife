// 12/11/2026 · Crea los extractos de ejemplo de cada banco (TODO INVENTADO: ni cuentas, ni personas, ni importes reales).
// Uso: cd tests && node datos/extractos/generar.js   → escribe los archivos aquí al lado y «esperado.json».
// Cada banco imita la forma de su exportación (cabeceras, filas de banco antes de la tabla, formato de fechas e importes).
const fs = require('fs'), path = require('path'), XLSX = require('xlsx');
const DIR = __dirname;
const r2 = (x) => Math.round(x * 100) / 100;
const serial = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 864e5); };
const dmy = (iso) => iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4);
const es = (n, eur) => { const s = Math.abs(n).toFixed(2).split('.'); return (n < 0 ? '-' : '') + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + s[1] + (eur ? ' €' : ''); };
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const csvQ = (v) => { const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

// movimientos de cada banco: [fecha ISO, importe con signo, texto]. Con saldo que se va calculando desde «inicial».
const BANCOS = {
  santander: { inicial: 1520.4, movs: [['2026-10-01', 2150, 'TRANSFERENCIA DE EMPRESA EJEMPLO SL, CONCEPTO NOMINA'], ['2026-10-02', -650, 'RECIBO ALQUILER EJEMPLO'], ['2026-10-03', -1234.56, 'COMPRA TARJETA MUEBLES EJEMPLO'], ['2026-10-05', -42.3, 'COMPRA SUPERMERCADO EJEMPLO'], ['2026-10-05', -2.1, 'COMPRA CAFETERIA EJEMPLO'], ['2026-10-09', 15.99, 'DEVOLUCION COMPRA TIENDA EJEMPLO'], ['2026-10-12', -60, 'REINTEGRO CAJERO EJEMPLO']] },
  sabadell: { inicial: 830.15, movs: [['2026-10-01', 1890.5, 'NOMINA EMPRESA INVENTADA'], ['2026-10-04', -35.2, 'COMPRA EN GASOLINERA EJEMPLO'], ['2026-10-07', -1100, 'TRANSFERENCIA ALQUILER PISO'], ['2026-10-13', -9.99, 'COMPRA PLATAFORMA SERIES EJEMPLO'], ['2026-10-20', -2345.67, 'COMPRA TARJETA VIAJES EJEMPLO']] },
  bbva: { inicial: 3200, movs: [['2026-10-02', -54.12, 'Supermercado Ejemplo'], ['2026-10-03', -18.5, 'Farmacia Ejemplo'], ['2026-10-06', 1500, 'Nomina Empresa Ejemplo'], ['2026-10-08', -1050.75, 'Seguro Hogar Ejemplo'], ['2026-10-15', -3.4, 'Panaderia Ejemplo'], ['2026-10-28', 25, 'Bizum de Amigo Ejemplo']] },
  caixabank: { inicial: 640.8, movs: [['2026-10-01', 1720, 'NOMINA EJEMPLO'], ['2026-10-03', -48.9, 'RECIBO LUZ EJEMPLO'], ['2026-10-10', -12.75, 'PAGO TARJETA BAR EJEMPLO'], ['2026-10-14', -1300, 'TRANSF ALQUILER EJEMPLO'], ['2026-10-22', 60, 'BIZUM RECIBIDO EJEMPLO']] },
  ing: { inicial: 2105.33, movs: [['2026-10-01', 2300, 'Nómina recibida Empresa Ejemplo'], ['2026-10-04', -76.45, 'Pago en Supermercado Ejemplo'], ['2026-10-09', -29.9, 'Recibo Gimnasio Ejemplo'], ['2026-10-16', -1499, 'Pago en Tienda Electronica Ejemplo'], ['2026-10-25', 3.21, 'Intereses cuenta']] },
  n26: { inicial: 410, movs: [['2026-10-02', -12.5, 'Cafeteria Ejemplo'], ['2026-10-03', 250, 'Persona Inventada'], ['2026-10-07', -1234.56, 'Aerolinea Ejemplo'], ['2026-10-11', -7.8, 'Metro Ejemplo'], ['2026-10-19', 1500, 'Empresa Ejemplo SL']] },
  revolut: { inicial: 120, movs: [['2026-10-02', 200, 'Top-up by *1234'], ['2026-10-03', -3.5, 'Cafeteria Ejemplo'], ['2026-10-08', -89.99, 'Tienda Online Ejemplo'], ['2026-10-12', -1050, 'Hotel Ejemplo'], ['2026-10-21', 1100, 'Transfer from Persona Inventada']] },
  traderepublic: { inicial: 5000, movs: [['2026-10-01', 1000, 'Ingreso aceptado: ES00 INVENTADA'], ['2026-10-02', -500, 'Savings plan execution ETF EJEMPLO'], ['2026-10-05', -23.4, 'Restaurante Ejemplo'], ['2026-10-31', 8.42, 'Your interest payment'], ['2026-10-15', -1250, 'Buy trade ACCION EJEMPLO']] },
  openbank: { inicial: 980.6, movs: [['2026-10-01', 1650, 'TRANSFERENCIA RECIBIDA NOMINA EJEMPLO'], ['2026-10-04', -64.8, 'COMPRA SUPERMERCADO EJEMPLO'], ['2026-10-08', -1234.56, 'COMPRA TIENDA MUEBLES EJEMPLO'], ['2026-10-18', -19.95, 'RECIBO TELEFONO EJEMPLO'], ['2026-10-27', 40, 'BIZUM DE AMIGO EJEMPLO']] },
  norma43: { inicial: 1234.56, movs: [['2026-10-01', 2150, 'NOMINA EMPRESA EJEMPLO SL'], ['2026-10-02', -650, 'RECIBO ALQUILER EJEMPLO'], ['2026-10-03', -42.3, 'COMPRA SUPERMERCADO EJEMPLO'], ['2026-10-05', -1234.56, 'TARJETA TIENDA MUEBLES EJEMPLO'], ['2026-10-08', 15.99, 'DEVOLUCION TIENDA EJEMPLO'], ['2026-10-12', -60, 'REINTEGRO CAJERO EJEMPLO']] },
};
Object.values(BANCOS).forEach((b) => { let s = b.inicial; b.movs.sort((x, y) => x[0].localeCompare(y[0])); b.filas = b.movs.map(([f, i, d]) => { s = r2(s + i); return { f, i, d, s }; }); b.final = s; });
const escribir = (n, data) => fs.writeFileSync(path.join(DIR, n), data);
const libro = (aoa, nombre, tipo) => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), nombre); return XLSX.write(wb, { type: 'buffer', bookType: tipo }); };
const esperado = {};
const anotar = (archivo, banco, extra) => { const b = BANCOS[banco]; esperado[archivo] = Object.assign({ banco, n: b.filas.length, filas: b.filas.map((x) => [x.f, x.i]), saldoFinal: b.final, saldoInicial: b.inicial }, extra || {}); };

// 1. Santander · Excel .xlsx: 4 filas del banco antes de la tabla, del más nuevo al más viejo, fechas como fecha de Excel, importes numéricos
{ const b = BANCOS.santander;
  const aoa = [['Consulta de movimientos'], ['Cuenta', 'CUENTA DE EJEMPLO ****0000 (inventada)'], ['Fecha de consulta', '12/11/2026'], [], ['Fecha Operación', 'Fecha Valor', 'Concepto', 'Importe', 'Divisa', 'Saldo', 'Divisa']]
    .concat(b.filas.slice().reverse().map((x) => [serial(x.f), serial(x.f), x.d, x.i, 'EUR', x.s, 'EUR']));
  escribir('santander.xlsx', libro(aoa, 'Movimientos', 'xlsx')); anotar('santander.xlsx', 'santander'); }
// 1b. Santander · CSV con «;», texto en Windows-1252 (con acentos), importes «-1.234,56»
{ const b = BANCOS.santander;
  const txt = ['Movimientos de cuenta;;;;', 'Cuenta: CUENTA DE EJEMPLO (inventada);;;;', ';;;;', 'Fecha Operación;Fecha Valor;Concepto;Importe;Saldo']
    .concat(b.filas.slice().reverse().map((x) => [dmy(x.f), dmy(x.f), x.d, es(x.i), es(x.s)].join(';'))).join('\r\n');
  escribir('santander_latin1.csv', Buffer.from(txt, 'latin1')); anotar('santander_latin1.csv', 'santander'); }
// 2. Sabadell · «.xls» que en realidad es una tabla HTML (así lo descargan varios bancos), fechas dd/mm/aaaa, importes en texto «-1.234,56»
{ const b = BANCOS.sabadell, td = (v) => '<td>' + v + '</td>';
  const html = '<html><head><meta charset="utf-8"></head><body><table>' +
    '<tr>' + td('Consulta de movimientos') + '</tr><tr>' + td('Cuenta') + td('CUENTA EXPANSIÓN ****0000 (inventada)') + '</tr><tr>' + td('Periodo') + td('01/10/2026 - 31/10/2026') + '</tr>' +
    '<tr>' + ['F. Operativa', 'Concepto', 'F. Valor', 'Importe', 'Saldo', 'Referencia 1', 'Referencia 2'].map(td).join('') + '</tr>' +
    b.filas.map((x, k) => '<tr>' + [dmy(x.f), x.d, dmy(x.f), es(x.i), es(x.s), 'REF' + (1000 + k), ''].map(td).join('') + '</tr>').join('') + '</table></body></html>';
  escribir('sabadell.xls', html); anotar('sabadell.xls', 'sabadell'); }
// 3. BBVA · .xlsx con columna A vacía, filas de cabecera, «Disponible» en vez de «Saldo», fechas en texto dd/mm/aaaa
{ const b = BANCOS.bbva;
  const aoa = [[], ['', 'Últimos movimientos'], ['', 'Cuenta', 'Cuenta Online ****0000 (inventada)'], ['', 'Desde', '01/10/2026', 'Hasta', '31/10/2026'], [],
    ['', 'F.Valor', 'Fecha', 'Concepto', 'Movimiento', 'Importe', 'Divisa', 'Disponible', 'Divisa', 'Observaciones']]
    .concat(b.filas.slice().reverse().map((x) => ['', dmy(x.f), dmy(x.f), x.d, x.i < 0 ? 'Pago con tarjeta' : 'Transferencia recibida', x.i, 'EUR', x.s, 'EUR', '']));
  escribir('bbva.xlsx', libro(aoa, 'Informe BBVA', 'xlsx')); anotar('bbva.xlsx', 'bbva'); }
// 4. CaixaBank · .xls de verdad (Excel 97), columnas «Ingreso (+)» y «Gasto (-)» separadas, fechas de Excel
{ const b = BANCOS.caixabank;
  const aoa = [['Movimientos de la cuenta'], ['Cuenta', 'ES00 **** **** (inventada)'], [], ['Concepto', 'Fecha', 'Fecha valor', 'Ingreso (+)', 'Gasto (-)', 'Saldo (+)']]
    .concat(b.filas.map((x) => [x.d, serial(x.f), serial(x.f), x.i > 0 ? x.i : '', x.i < 0 ? -x.i : '', x.s]));
  escribir('caixabank.xls', libro(aoa, 'Movimientos', 'biff8')); anotar('caixabank.xls', 'caixabank'); }
// 5. ING · .xlsx con 5 filas del banco, categoría y subcategoría del banco, «IMPORTE (€)» y «SALDO (€)»
{ const b = BANCOS.ing;
  const aoa = [['Movimientos de la Cuenta NARANJA'], ['Número de cuenta:', '**** 0000 (inventado)'], ['Titular:', 'PERSONA INVENTADA'], ['Fecha exportación:', '12/11/2026'], [],
    ['F. VALOR', 'CATEGORÍA', 'SUBCATEGORÍA', 'DESCRIPCIÓN', 'COMENTARIO', 'IMAGEN', 'IMPORTE (€)', 'SALDO (€)']]
    .concat(b.filas.slice().reverse().map((x) => [dmy(x.f), x.i > 0 ? 'Nómina y otras prestaciones' : 'Compras', x.i > 0 ? 'Nómina' : 'Otros', x.d, '', '', x.i, x.s]));
  escribir('ing.xlsx', libro(aoa, 'Movimientos', 'xlsx')); anotar('ing.xlsx', 'ing'); }
// 6. N26 · CSV con «,» y comillas, en inglés, fechas aaaa-mm-dd, importes «-12.5», columna «Type»
{ const b = BANCOS.n26;
  const txt = ['"Booking Date","Value Date","Partner Name","Partner Iban","Type","Payment Reference","Account Name","Amount (EUR)","Original Amount","Original Currency","Exchange Rate"']
    .concat(b.filas.map((x) => ['"' + x.f + '"', '"' + x.f + '"', '"' + x.d + '"', '""', '"' + (x.i < 0 ? 'Presentment' : 'Credit Transfer') + '"', '"' + (x.i < 0 ? '' : 'Concepto inventado') + '"', '"Main Account"', '"' + String(x.i) + '"', '""', '""', '""'].join(','))).join('\n');
  escribir('n26.csv', txt); anotar('n26.csv', 'n26', { sinSaldo: true }); } // N26 no da el saldo
// 7. Revolut · CSV con «,», fechas «aaaa-mm-dd hh:mm:ss», «1234.56», comisión aparte, y una fila REVERTED (anulada: no debe entrar)
{ const b = BANCOS.revolut;
  const filas = b.filas.map((x) => [x.i > 0 && /Top-up/.test(x.d) ? 'TOPUP' : x.i > 0 ? 'TRANSFER' : 'CARD_PAYMENT', 'Current', x.f + ' 10:15:00', x.f + ' 18:40:12', x.d, x.i.toFixed(2), '0.00', 'EUR', 'COMPLETED', x.s.toFixed(2)]);
  filas.splice(2, 0, ['CARD_PAYMENT', 'Current', '2026-10-04 12:00:00', '', 'Pago anulado Ejemplo', '-45.00', '0.00', 'EUR', 'REVERTED', '']);
  const txt = ['Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance'].concat(filas.map((f) => f.map(csvQ).join(','))).join('\n');
  escribir('revolut.csv', txt); anotar('revolut.csv', 'revolut', { nota: 'la fila REVERTED (−45,00) no debe entrar' }); }
// 8. Trade Republic · CSV con «,» (resumen de cuenta): fechas «01 oct 2026», «Entrada de dinero» / «Salida de dinero» con «1.000,00 €», columna Tipo
{ const b = BANCOS.traderepublic;
  const tipoTR = (x) => /interest/.test(x.d) ? 'Interés' : /Ingreso/.test(x.d) ? 'Transferencia' : /trade|plan/.test(x.d) ? 'Operar' : 'Pago con tarjeta';
  const fTR = (iso) => iso.slice(8, 10) + ' ' + MESES[Number(iso.slice(5, 7)) - 1] + ' ' + iso.slice(0, 4);
  const txt = ['"Fecha","Tipo","Descripción","Entrada de dinero","Salida de dinero","Saldo"']
    .concat(b.filas.map((x) => [fTR(x.f), tipoTR(x), x.d, x.i > 0 ? es(x.i, true) : '', x.i < 0 ? es(-x.i, true) : '', es(x.s, true)].map((v) => '"' + v + '"').join(','))).join('\n');
  escribir('traderepublic.csv', txt); anotar('traderepublic.csv', 'traderepublic'); }
// 9. Openbank · .xls (Excel 97) con columnas vacías entre medias, todo en texto: fechas dd/mm/aaaa e importes «-1.234,56»
{ const b = BANCOS.openbank;
  const aoa = [['', 'Movimientos de su cuenta'], ['', 'Cuenta', '', 'CUENTA CORRIENTE ****0000 (inventada)'], [], ['', 'Fecha Operación', '', 'Fecha Valor', '', 'Concepto', '', 'Importe', '', 'Saldo', '']]
    .concat(b.filas.slice().reverse().map((x) => ['', dmy(x.f), '', dmy(x.f), '', x.d, '', es(x.i), '', es(x.s), '']));
  escribir('openbank.xls', libro(aoa, 'Movimientos', 'biff8')); anotar('openbank.xls', 'openbank'); }
// 10. Norma 43 (AEB 43 / Cuaderno 43): registros 11, 22, 23, 33 y 88 de 80 caracteres
{ const b = BANCOS.norma43;
  const pad = (s, n) => String(s).slice(0, n).padEnd(n, ' '), num = (v, n) => String(Math.round(Math.abs(v) * (n === 14 ? 100 : 1))).padStart(n, '0');
  const aammdd = (iso) => iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10);
  const ENT = '0000', OFI = '0001', CTA = '0000000000'; // inventados
  const comun = (x) => /NOMINA/.test(x.d) ? '15' : /RECIBO/.test(x.d) ? '03' : /CAJERO/.test(x.d) ? '11' : /TARJETA|COMPRA/.test(x.d) ? '12' : /DEVOLUCION/.test(x.d) ? '14' : '99';
  const L = [];
  L.push('11' + ENT + OFI + CTA + aammdd(b.filas[0].f) + aammdd(b.filas[b.filas.length - 1].f) + (b.inicial < 0 ? '1' : '2') + num(b.inicial, 14) + '978' + '3' + pad('PERSONA INVENTADA', 26) + pad('', 3));
  let nd = 0, td = 0, nh = 0, th = 0;
  b.filas.forEach((x, k) => {
    if (x.i < 0) { nd++; td += -x.i; } else { nh++; th += x.i; }
    L.push('22' + pad('', 4) + OFI + aammdd(x.f) + aammdd(x.f) + comun(x) + '000' + (x.i < 0 ? '1' : '2') + num(x.i, 14) + num(k + 1, 10) + pad('REF' + (k + 1), 12) + pad('', 16));
    const t = x.d; // el texto va en los registros 23 (dos trozos de 38)
    L.push('23' + '01' + pad(t.slice(0, 38), 38) + pad(t.slice(38, 76), 38));
  });
  L.push('33' + ENT + OFI + CTA + String(nd).padStart(5, '0') + num(td, 14) + String(nh).padStart(5, '0') + num(th, 14) + (b.final < 0 ? '1' : '2') + num(b.final, 14) + '978' + pad('', 4));
  L.push('88' + '9'.repeat(18) + String(L.length).padStart(6, '0') + pad('', 54));
  L.forEach((l) => { if (l.length !== 80) throw new Error('N43: línea de ' + l.length + ' caracteres: ' + l); });
  escribir('norma43.n43', L.join('\r\n') + '\r\n'); anotar('norma43.n43', 'norma43');
  escribir('norma43_extracto.txt', L.join('\r\n') + '\r\n'); anotar('norma43_extracto.txt', 'norma43'); }

escribir('esperado.json', JSON.stringify(esperado, null, 1));
console.log('Escritos ' + Object.keys(esperado).length + ' extractos en ' + DIR);

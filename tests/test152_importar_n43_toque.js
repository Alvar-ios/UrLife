// 12/11/2026 · C4 de docs/40: Norma 43, la segunda vez en un toque, no duplicar (mismo extracto y avisos del banco) y «Compartir con PalomApp».
// Todo inventado (tests/datos/extractos).
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
const XLSX = require('xlsx'), { TextDecoder } = require('util');
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const DIR = path.join(__dirname, 'datos', 'extractos');
const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const file = (name, buf) => ({ name, size: buf.byteLength, arrayBuffer: async () => buf });
const leer = (n) => fs.readFileSync(path.join(DIR, n));
const guardados = (e) => Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v));
async function env(cuentas, movs, pre) {
  const e = makeEnv({
    cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas || [])) }, meta: { onboarded: true } },
    movs: JSON.parse(JSON.stringify(movs || [])), url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre: (w) => { w.TextDecoder = TextDecoder; w.XLSX = XLSX; if (pre) pre(w); },
  });
  await sleep(120); return e;
}
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
async function cargar(e, nombre, comoNombre) {
  const A = e.w.__APP__;
  A.H.impAbrir([]); await sleep(10);
  await A.H.impArchivo([], { files: [file(comoNombre || nombre, ab(leer(nombre)))] }); await sleep(40);
  return A.imp();
}
const N43 = (lineas) => lineas.map((l) => l.padEnd(80, ' ')).join('\r\n');

(async () => {
  // 1. Norma 43: lectura de los registros
  let e = await env(), A = e.w.__APP__;
  const txt = leer('norma43.n43').toString('latin1');
  ok(A.esNorma43(txt) && !A.esNorma43('Fecha;Concepto;Importe\n01/10/2026;Algo;-1,00'), 'reconoce la Norma 43 por el contenido (y un CSV no lo es)');
  const hs = A.parseN43(txt), h = hs[0];
  ok(hs.length === 1 && h.filas.length === 7, 'una cuenta con 6 movimientos (+ fila de títulos)');
  ok(h.n43.inicial === 1234.56 && h.n43.final === 1413.69 && h.n43.cuadra === true, 'saldo inicial (registro 11) + movimientos = saldo final del registro 33 (1.234,56 → 1.413,69)');
  ok(h.filas[1][0] === '2026-10-01' && h.filas[1][3] === 2150 && h.filas[2][3] === -650 && /NOMINA EMPRESA/.test(h.filas[1][2]), 'fecha AAMMDD, signo 1 = cargo / 2 = abono, importe en céntimos y texto del registro 23');
  ok(A.esNorma43(txt.replace(/\r\n/g, '')) && A.parseN43(txt.replace(/\r\n/g, ''))[0].filas.length === 7, 'también sin saltos de línea (registros de 80 seguidos)');
  // sin registro 23: el concepto común da el texto; dos cuentas en un archivo; saldo que no cuadra
  const dos = N43([
    '11' + '0182' + '0001' + '0000000001' + '261001' + '261031' + '2' + '00000000010000' + '978' + '3' + 'PERSONA INVENTADA',
    '22' + '    ' + '0001' + '261003' + '261003' + '12' + '000' + '1' + '00000000002550' + '0000000001' + 'REF1',
    '33' + '0182' + '0001' + '0000000001' + '00001' + '00000000002550' + '00000' + '00000000000000' + '2' + '00000000007450' + '978',
    '11' + '2100' + '0001' + '0000000002' + '261001' + '261031' + '2' + '00000000020000' + '978' + '3' + 'PERSONA INVENTADA',
    '22' + '    ' + '0001' + '261005' + '261005' + '15' + '000' + '2' + '00000000100000' + '0000000001' + 'REF2',
    '33' + '2100' + '0001' + '0000000002' + '00000' + '00000000000000' + '00001' + '00000000100000' + '2' + '00000000999999' + '978',
    '88' + '9'.repeat(18) + '000007',
  ]);
  const hs2 = A.parseN43(dos);
  ok(hs2.length === 2 && hs2[0].filas[1][2] === 'Tarjeta REF1' && hs2[1].filas[1][2] === 'Nómina REF2', 'dos cuentas = dos hojas; sin registro 23 sale «Tarjeta», «Nómina»…');
  ok(hs2[0].n43.cuadra === true && hs2[1].n43.cuadra === false, 'detecta un saldo final que no cuadra');
  ok(hs2[0].bancoK === 'bbva' && hs2[1].bancoK === 'caixabank', 'el código de entidad dice el banco (0182 BBVA, 2100 CaixaBank)');

  // 2. Norma 43 en la app: directo a la vista previa (no hay que elegir columnas) y lo dice
  let I = await cargar(e, 'norma43.n43');
  ok(I.paso === 'revisar' && /Formato Norma 43 reconocido/.test(sh(e)), 'Norma 43: va directo a la vista previa («Formato Norma 43 reconocido»)');
  ok(/saldo inicial \+ movimientos = saldo final/.test(sh(e)), 'enseña que el saldo cuadra con el del banco');
  ok(I.filas.filter((r) => r.id).length === 6 && I.filas.filter((r) => r.incluir).length === 6, '6 movimientos marcados para importar');
  await A.H.impEjecutar([]); await sleep(60); A.S.movimientos = guardados(e);
  ok(guardados(e).length === 6, 'se guardan los 6');
  A.H.closeSheet([]); await sleep(260);
  I = await cargar(e, 'norma43_extracto.txt');
  ok(I.paso === 'revisar' && I.filas.filter((r) => r.id).every((r) => r.estado === 'importado') && !/Importar \d/.test(sh(e)), 'el mismo extracto otra vez (ahora .txt): 0 nuevos');
  A.H.closeSheet([]); await sleep(260);

  // 3. Excel de un banco: la primera vez «¿Qué es cada columna?»; la segunda, directo a la vista previa con su cuenta, y 0 nuevos
  const DOS = [{ id: 'cs', nombre: 'Santander', banco: 'santander', saldo: 1000, fecha: '2026-09-01', principal: true }, { id: 'ci', nombre: 'ING', banco: 'ing', saldo: 2000, fecha: '2026-09-01' }];
  e = await env(DOS); A = e.w.__APP__;
  I = await cargar(e, 'bbva.xlsx', 'movimientos.xlsx');
  ok(I.paso === 'columnas' && !I.cuenta, 'primera vez y sin pista: pregunta la cuenta en «¿Qué es cada columna?»');
  A.H.impCuenta(['ci']); A.H.impRevisar([]); await sleep(20);
  await A.H.impEjecutar([]); await sleep(60); A.S.movimientos = guardados(e);
  const perfil = Object.values(A.cfg().importPerfiles || {})[0];
  ok(perfil && perfil.cuenta === 'ci' && perfil.map && perfil.map.saldo != null, 'guarda el formato (columnas, saldo) y la cuenta');
  A.H.closeSheet([]); await sleep(260);
  I = await cargar(e, 'bbva.xlsx', 'movimientos.xlsx');
  ok(I.paso === 'revisar' && I.cuenta === 'ci' && /Formato reconocido/.test(sh(e)) && /La última vez importaste este formato en ING/.test(sh(e)), 'segunda vez: directo a la vista previa, en ING, y lo dice');
  ok(I.filas.filter((r) => r.id).every((r) => r.estado === 'importado'), 'el mismo extracto dos veces: 0 nuevos');
  A.H.impVolver(['columnas']); await sleep(10);
  ok(/¿Qué es cada columna\?/.test(sh(e)), '«Ver columnas» deja revisarlas');
  A.H.closeSheet([]); await sleep(260);
  // Norma 43 con varias cuentas: la entidad elige la cuenta del mismo banco
  const n43s = N43(['11' + '0049' + '0001' + '0000000009' + '261001' + '261031' + '2' + '00000000010000' + '978' + '3' + 'PERSONA INVENTADA',
    '22' + '    ' + '0001' + '261003' + '261003' + '12' + '000' + '1' + '00000000001000' + '0000000001' + 'REF1', '2301' + 'CAFETERIA EJEMPLO',
    '33' + '0049' + '0001' + '0000000009' + '00001' + '00000000001000' + '00000' + '00000000000000' + '2' + '00000000009000' + '978', '88' + '9'.repeat(18) + '000005']);
  A.H.impAbrir([]); await sleep(10);
  await A.H.impArchivo([], { files: [file('extracto.aeb', ab(Buffer.from(n43s, 'latin1')))] }); await sleep(40);
  ok(A.imp().cuenta === 'cs' && A.imp().paso === 'revisar', 'Norma 43 de la entidad 0049 con dos cuentas: elige Santander y va directo');
  A.H.closeSheet([]); await sleep(260);

  // 4. avisos del banco: el gasto apuntado por un aviso (origen 'aviso') el día antes no se duplica
  e = await env([], [{ id: 'av1', tipo: 'Gasto', importe: 42.3, categoria: 'Supermercado', fecha: '2026-10-02', descripcion: 'Supermercado', origen: 'aviso', creadoEn: 1 },
    { id: 'm1', tipo: 'Gasto', importe: 60, categoria: 'Otros', fecha: '2026-10-11', descripcion: 'A mano', creadoEn: 2 }]); A = e.w.__APP__;
  I = await cargar(e, 'norma43.n43');
  const sup = I.filas.find((r) => /SUPERMERCADO/.test(r.desc || '')), caj = I.filas.find((r) => /CAJERO/.test(r.desc || ''));
  ok(sup && sup.estado === 'dup' && !sup.incluir && /aviso del banco/.test(sh(e)), 'aviso del banco el día antes, mismo importe: «ya lo tenías» y desmarcado');
  ok(caj && caj.estado === 'quizas', 'lo apuntado a mano un día antes sigue preguntando «¿es el mismo?»');
  A.H.closeSheet([]); await sleep(260);

  // 5. pantalla de Importar: formatos; y en Android, compartir desde la app del banco
  A.H.impAbrir([]); await sleep(10);
  ok(/Formatos: Excel, CSV y Norma 43 de tu banco/.test(sh(e)) && !/compartir el extracto/.test(sh(e)), 'dice «Formatos: Excel, CSV y Norma 43 de tu banco» (en la web, sin lo de Android)');
  ok(/\.n43/.test(e.doc.querySelector('#impFile').getAttribute('accept')), 'el selector deja elegir .n43, .aeb, .txt…');
  A.H.closeSheet([]); await sleep(260);
  let oyente = null;
  const b64 = leer('norma43.n43').toString('base64');
  e = await env([], [], (w) => { w.__nativo = { android: true, archivoEntrante: { pendiente: async () => ({ nombre: 'extracto_octubre.n43', base64: b64, tam: 1230 }), alLlegar: (fn) => { oyente = fn; } } }; }); A = e.w.__APP__;
  await sleep(300);
  ok(A.imp() && A.imp().archivo === 'extracto_octubre.n43' && A.imp().paso === 'revisar' && /Formato Norma 43/.test(sh(e)), 'Android: el extracto con el que se abrió la app entra solo en Importar');
  A.H.closeSheet([]); await sleep(260);
  A.H.impAbrir([]); await sleep(10);
  ok(/También puedes compartir el extracto desde la app de tu banco con PalomApp/.test(sh(e)), 'en Android dice que se puede compartir desde la app del banco');
  A.H.closeSheet([]); await sleep(260);
  ok(typeof oyente === 'function', 'se escucha el evento de archivo nuevo con la app abierta');
  await oyente({ nombre: 'n26.csv', base64: leer('n26.csv').toString('base64') }); await sleep(60);
  ok(A.imp().archivo === 'n26.csv' && A.imp().paso === 'columnas', 'un CSV compartido con la app abierta abre Importar con ese archivo');
  A.H.closeSheet([]); await sleep(260);
  await oyente({ nombre: 'enorme.xlsx', error: 'grande' }); await sleep(30);
  ok(/demasiado grande \(máx\. 10 MB\)/.test(e.doc.body.textContent), 'más de 10 MB: lo dice y no abre nada');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

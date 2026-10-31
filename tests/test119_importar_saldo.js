// 31/10/2026 · docs/30 tanda 2: la columna Saldo comprueba lo leído y sirve para poner o cuadrar el saldo. Extractos de ejemplo inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
const { TextDecoder } = require('util');
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const aviso = (m) => console.log('AVISO ' + m);
const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const file = (name, buf) => ({ name, size: buf.byteLength, arrayBuffer: async () => buf });
const leer = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', 'extractos', n));
const CUENTAS = [{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: '2026-09-01' }, { id: 'c2', nombre: 'Efectivo', tipo: 'efectivo', saldo: 50, fecha: '2026-09-01' }];
async function env(movs, cuentas) {
  const e = makeEnv({
    cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas || CUENTAS)) }, meta: { onboarded: true } },
    movs: JSON.parse(JSON.stringify(movs || [])), url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre: (w) => { w.TextDecoder = TextDecoder; },
  });
  await sleep(120); return e;
}
async function abrir(e, nombre) {
  const A = e.w.__APP__;
  A.H.goTab(['movimientos']); await sleep(10); A.H.impAbrir([]); await sleep(10);
  await A.H.impArchivo([], { files: [file(nombre, ab(leer(nombre)))] }); await sleep(40);
  A.H.impRevisar(); await sleep(20);
  return A.imp();
}
const refrescar = (e) => { e.w.__APP__.S.movimientos = guardados(e); }; // en la app lo hace el aviso en tiempo real de Supabase
const guardados = (e) => Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v));
const suma = (fs) => Math.round(fs.reduce((a, r) => a + (r.tipo === 'Ingreso' ? 1 : -1) * Math.abs(r.importe), 0) * 100) / 100;

(async () => {
  const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
  // 1. Santander (del más nuevo al más viejo) en una cuenta sin saldo: cuadra y ofrece «Usar este saldo»
  let e = await env([], [{ id: 'cs', nombre: 'Santander', principal: true }, { id: 'ci', nombre: 'ING' }]), A = e.w.__APP__;
  A.H.impEnCuenta(['cs']); await sleep(10);
  await A.H.impArchivo([], { files: [file('santander_ejemplo.csv', ab(leer('santander_ejemplo.csv')))] }); await sleep(40);
  ok(A.imp().map.saldo != null && /Saldo \(opcional\)/.test(sh(e)), 'reconoce la columna Saldo');
  A.H.impRevisar([]); await sleep(20);
  ok(/Los importes cuadran con la columna Saldo del banco/.test(sh(e)), 'vista previa: «Los importes cuadran con la columna Saldo del banco»');
  ok(A.imp().saldoFin && A.imp().saldoFin.valor === 1455.54 && A.imp().saldoFin.fecha === '2026-10-20', 'el saldo final es el de la fila más nueva: 1.455,54 € el 20/10 (sale ' + JSON.stringify(A.imp().saldoFin) + ')');
  await A.H.impEjecutar([]); await sleep(60); refrescar(e);
  ok(/tenías 1\.455,54 € en Santander/.test(sh(e)) && /Usar este saldo/.test(sh(e)), 'al terminar: «El extracto dice que el 20 oct tenías 1.455,54 € en Santander» con «Usar este saldo»');
  A.H.impSaldoUsar([]); await sleep(20);
  let c = A.cfg().cuentas.find((x) => x.id === 'cs');
  ok(c.saldo === 1455.54 && c.fecha === '2026-10-20', 'guarda el saldo con la fecha del extracto, no la de hoy');
  ok(A.saldoCuenta(c) === 1455.54, 'y lo ya importado de ese día no se cuenta dos veces (saldo calculado = 1.455,54)');
  ok(/Saldo de Santander puesto/.test(sh(e)), 'lo confirma en la misma pantalla');
  A.H.closeSheet([]); await sleep(260);
  // 2. ING (del más viejo al más nuevo) con un saldo antiguo que no cuadra: ofrece cuadrar con la diferencia
  e = await env([], [{ id: 'cs', nombre: 'Santander', principal: true }, { id: 'ci', nombre: 'ING', saldo: 3000, fecha: '2026-10-01' }]); A = e.w.__APP__;
  A.H.impEnCuenta(['ci']); await sleep(10);
  await A.H.impArchivo([], { files: [file('ing_ejemplo.csv', ab(leer('ing_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  ok(A.imp().saldoFin && A.imp().saldoFin.valor === 3455.75 && A.imp().saldoFin.fecha === '2026-10-18', 'ING: saldo final 3.455,75 € el 18/10 (la última fila)');
  await A.H.impEjecutar([]); await sleep(60); refrescar(e);
  // la app: 3000 el 1/10 + movimientos del 2 al 18 (−29,90 +500 −1,50 +2,15 −15) = 3455,75 → cuadra
  ok(/Cuadra: la app y el banco dicen lo mismo/.test(sh(e)), 'con el saldo de partida bien, dice «Cuadra»');
  A.H.closeSheet([]); await sleep(260);
  e = await env([], [{ id: 'cs', nombre: 'Santander', principal: true }, { id: 'ci', nombre: 'ING', saldo: 2900, fecha: '2026-10-01' }]); A = e.w.__APP__;
  A.H.impEnCuenta(['ci']); await sleep(10);
  await A.H.impArchivo([], { files: [file('ing_ejemplo.csv', ab(leer('ing_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  await A.H.impEjecutar([]); await sleep(60); refrescar(e);
  ok(/La app calcula 3\.355,75 €/.test(sh(e)) && /Diferencia \+100,00 €/.test(sh(e)) && /Cuadrar con el banco/.test(sh(e)), 'si no cuadra: «La app calcula 3.355,75 € · Diferencia +100,00 €» y «Cuadrar con el banco»');
  A.H.impSaldoUsar([]); await sleep(20);
  c = A.cfg().cuentas.find((x) => x.id === 'ci');
  ok(c.saldo === 3455.75 && c.fecha === '2026-10-18' && c.cuadre && c.cuadre.dif === 100, 'cuadra con fecha del extracto y apunta el ajuste (+100)');
  A.H.closeSheet([]); await sleep(260);
  // 3. cuenta ya cuadrada con un dato más reciente: no ofrece nada
  e = await env([], [{ id: 'cs', nombre: 'Santander', principal: true }, { id: 'ci', nombre: 'ING', saldo: 5000, fecha: '2026-10-25' }]); A = e.w.__APP__;
  A.H.impEnCuenta(['ci']); await sleep(10);
  await A.H.impArchivo([], { files: [file('ing_ejemplo.csv', ab(leer('ing_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  await A.H.impEjecutar([]); await sleep(60);
  ok(!/Cuadrar con el banco|Usar este saldo|Cuadra:/.test(sh(e)), 'si la cuenta ya tiene un saldo más reciente, no se va hacia atrás');
  A.H.closeSheet([]); await sleep(260);
  // 4. importes mal leídos (signo al revés): avisa y el botón dice «Importar igualmente»
  A.H.impEnCuenta(['ci']); await sleep(10);
  await A.H.impArchivo([], { files: [file('ing_ejemplo.csv', ab(leer('ing_ejemplo.csv')))] }); await sleep(40);
  A.imp().signo = 'gastos'; A.H.impRevisar([]); await sleep(20);
  ok(/no cuadran con la columna Saldo/.test(sh(e)) && /Importar igualmente/.test(sh(e)) && /Revisar columnas/.test(sh(e)), 'si no cuadran: aviso, «Revisar columnas» e «Importar igualmente»');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

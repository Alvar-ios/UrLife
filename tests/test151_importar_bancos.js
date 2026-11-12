// 12/11/2026 · C4 de docs/40: importar extractos de cada banco español sin tocar nada (columnas, fechas, importes y saldo bien a la primera).
// Los extractos son INVENTADOS: tests/datos/extractos/ (se crean con generar.js). Lo que debe salir está en esperado.json.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
const XLSX = require('xlsx'), { TextDecoder } = require('util');
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const DIR = path.join(__dirname, 'datos', 'extractos');
const ESP = JSON.parse(fs.readFileSync(path.join(DIR, 'esperado.json'), 'utf8'));
const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const file = (name, buf) => ({ name, size: buf.byteLength, arrayBuffer: async () => buf });
const leer = (n) => fs.readFileSync(path.join(DIR, n));
const guardados = (e) => Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v));
async function env(cuentas) {
  const e = makeEnv({
    cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas || [])) }, meta: { onboarded: true } },
    movs: [], url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre: (w) => { w.TextDecoder = TextDecoder; w.XLSX = XLSX; },
  });
  await sleep(120); return e;
}
async function cargar(e, nombre, comoNombre) {
  const A = e.w.__APP__;
  A.H.impAbrir([]); await sleep(10);
  await A.H.impArchivo([], { files: [file(comoNombre || nombre, ab(leer(nombre)))] }); await sleep(40);
  return A.imp();
}
const clave = (f) => f.map(([d, i]) => d + ' ' + Number(i).toFixed(2)).sort().join(' | ');

(async () => {
  const e = await env(), A = e.w.__APP__;
  A.H.goTab(['movimientos']); await sleep(10);
  // 1. cada extracto entra solo: mismas fechas e importes (con su signo) que el banco, y cuadra con su saldo
  for (const [nombre, esp] of Object.entries(ESP)) {
    let I = await cargar(e, nombre);
    if (I.error || !I.hoja) { ok(false, nombre + ': no se ha podido leer («' + (I.error || 'sin hoja') + '»)'); A.H.closeSheet([]); await sleep(260); continue; }
    if (I.paso === 'columnas') { A.H.impRevisar([]); await sleep(20); I = A.imp(); }
    const filas = (I.filas || []).filter((r) => r.id);
    const sale = filas.map((r) => [r.fecha, r.comoTras ? r.sig : (r.tipo === 'Ingreso' ? 1 : -1) * r.importe]);
    const bien = clave(sale) === clave(esp.filas);
    ok(bien, nombre + ': ' + esp.n + ' movimientos con su fecha e importe' + (bien ? '' : ' · sale ' + filas.length + ': ' + clave(sale).slice(0, 400) + ' · tocaba: ' + clave(esp.filas).slice(0, 400)));
    ok(filas.length > 0 && filas.every((r) => r.desc && /[a-z]{3}/i.test(r.desc) && !/^\d/.test(r.desc)), nombre + ': cada movimiento con su descripción (' + filas.map((r) => r.desc).slice(0, 3).join(' / ') + ')');
    if (!esp.sinSaldo) ok(I.saldoChk && I.saldoChk.total >= 2 && I.saldoChk.ok === I.saldoChk.total && I.saldoFin && Math.abs(I.saldoFin.valor - esp.saldoFinal) < 0.005,
      nombre + ': cuadra con la columna Saldo y el último saldo es ' + esp.saldoFinal + (I.saldoChk ? ' (cuadran ' + I.saldoChk.ok + '/' + I.saldoChk.total + ', último ' + (I.saldoFin && I.saldoFin.valor) + ')' : ' (no ha encontrado el saldo)'));
    A.H.closeSheet([]); await sleep(260);
  }
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

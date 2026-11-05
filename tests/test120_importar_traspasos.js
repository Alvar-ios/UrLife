// 31/10/2026 · docs/30 tanda 3: traspasos entre tus cuentas al importar (y la otra mitad no entra dos veces). Extractos de ejemplo inventados.
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
  const TRES = [{ id: 'cs', nombre: 'Santander', banco: 'santander', principal: true, saldo: 1000, fecha: '2026-09-01' }, { id: 'ci', nombre: 'Cuenta naranja', banco: 'ing', saldo: 2000, fecha: '2026-09-01' }, { id: 'ce', nombre: 'Efectivo', tipo: 'efectivo', saldo: 50, fecha: '2026-09-01' }];
  let e = await env([], TRES), A = e.w.__APP__;
  A.H.impEnCuenta(['cs']); await sleep(10);
  await A.H.impArchivo([], { files: [file('santander_ejemplo.csv', ab(leer('santander_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  const F = A.imp().filas, tr = F.find((r) => /TRANSFERENCIA A ING/.test(r.desc || '')), caj = F.find((r) => /REINTEGRO/.test(r.desc || ''));
  ok(tr && tr.comoTras && tr.otra === 'ci' && tr.incluir && /parece un traspaso a Cuenta naranja/.test(sh(e)), '«TRANSFERENCIA A ING» → traspaso a la cuenta de ING (por su banco), marcado');
  ok(caj && caj.comoTras && caj.otra === 'ce' && caj.incluir, '«REINTEGRO CAJERO» → traspaso a Efectivo');
  ok(/2 traspasos entre tus cuentas: no cuentan como gasto ni ingreso/.test(sh(e)), 'lo dice arriba: 2 traspasos, no cuentan como gasto');
  // «No, es un gasto» y volver
  A.H.impTras([String(F.indexOf(caj)), '0']); await sleep(5);
  ok(!caj.comoTras && caj.estado === 'nuevo' && caj.incluir && caj.tipo === 'Gasto', '«No, es un gasto» lo deja como gasto normal');
  A.H.impTras([String(F.indexOf(caj)), '1']); await sleep(5);
  ok(caj.comoTras && caj.otra === 'ce', '«Es un traspaso» lo vuelve a poner');
  await A.H.impEjecutar([]); await sleep(60); refrescar(e);
  const raw = guardados(e), tras = raw.filter((m) => m.tipo === 'Traspaso');
  ok(tras.length === 2 && tras.some((t) => t.cuentaId === 'cs' && t.cuentaDestinoId === 'ci' && t.importe === 500) && tras.some((t) => t.cuentaId === 'cs' && t.cuentaDestinoId === 'ce'), 'se guardan 2 traspasos: Santander → Cuenta naranja (500 €) y Santander → Efectivo');
  ok(tras.every((t) => t.lote && t.categoria === 'Traspaso'), 'con el lote de la importación (para poder deshacer)');
  ok(!raw.some((m) => m.tipo === 'Gasto' && /TRANSFERENCIA A ING|REINTEGRO/.test(m.descripcion || '')), 'no se guardan como gasto');
  A.H.closeSheet([]); await sleep(260);
  // la otra mitad: al importar ING, la transferencia desde Santander ya está
  e.w.__APP__.S._movsRaw = guardados(e); A.S.traspasos = guardados(e).filter((m) => m.tipo === 'Traspaso'); A.S.movimientos = guardados(e).filter((m) => m.tipo !== 'Traspaso');
  A.H.impEnCuenta(['ci']); await sleep(10);
  await A.H.impArchivo([], { files: [file('ing_ejemplo.csv', ab(leer('ing_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  const m2 = A.imp().filas.find((r) => /TRANSFERENCIA DESDE SANTANDER/.test(r.desc || ''));
  ok(m2 && m2.estado === 'otraMitad' && !m2.incluir && /ya está como traspaso Santander → Cuenta naranja/.test(sh(e)), 'en ING, «TRANSFERENCIA DESDE SANTANDER» es la otra mitad: no se importa');
  await A.H.impEjecutar([]); await sleep(60);
  ok(guardados(e).filter((m) => m.tipo === 'Traspaso').length === 2, 'sigue habiendo un solo traspaso de 500 € (no se duplica)');
  A.H.closeSheet([]); await sleep(260);
  // deshacer la importación de Santander borra también los traspasos
  const loteS = (A.cfg().importLotes || [])[0].id;
  e.w.__APP__.S.traspasos = guardados(e).filter((m) => m.tipo === 'Traspaso'); A.S.movimientos = guardados(e).filter((m) => m.tipo !== 'Traspaso');
  await A.H.impDeshacer([loteS]); await sleep(60);
  ok(!guardados(e).some((m) => m.lote === loteS), 'deshacer la importación borra también sus traspasos');
  // con una sola cuenta: como antes (no se crean traspasos)
  e = await env([], [{ id: 'c1', nombre: 'Banco', saldo: 1, fecha: '2026-09-01' }]); A = e.w.__APP__;
  A.H.goTab(['movimientos']); await sleep(10); A.H.impAbrir([]); await sleep(10);
  await A.H.impArchivo([], { files: [file('santander_ejemplo.csv', ab(leer('santander_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  ok(!A.imp().filas.some((r) => r.comoTras), 'con una sola cuenta no propone traspasos');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

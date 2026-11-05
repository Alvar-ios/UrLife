// 31/10/2026 · docs/30 tanda 4: reglas con cuenta («solo en») y reglas de traspaso. Extractos de ejemplo inventados.
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
  const TRES = [{ id: 'cs', nombre: 'Santander', banco: 'santander', principal: true }, { id: 'ci', nombre: 'Hucha', saldo: 1, fecha: '2026-09-01' }, { id: 'ce', nombre: 'Efectivo', tipo: 'efectivo' }];
  let e = await env([], TRES), A = e.w.__APP__;
  // 1. hoja de reglas: «Solo en» y «Entonces es: un traspaso»
  A.H.openReglas([]); await sleep(10);
  ok(/Solo en/.test(sh(e)) && /Cualquier cuenta/.test(sh(e)) && /Un traspaso/.test(sh(e)), 'con varias cuentas, la hoja de reglas tiene «Solo en» y «Entonces es»');
  A.H.reglaCuenta(['cs']); A.H.reglaEs(['tras']); await sleep(5);
  e.doc.querySelector('#rgTexto').value = 'ing ahorro'; e.doc.querySelector('#rgTras').value = 'ci';
  A.H.reglaAnadir([]); await sleep(10);
  ok(/«ing ahorro» → traspaso con Hucha/.test(sh(e)) && /solo en Santander/.test(sh(e)), 'regla «ing ahorro» solo en Santander → traspaso con Hucha');
  e.doc.querySelector('#rgTexto').value = 'gasolinera'; A.H.reglaEs(['']); await sleep(5); e.doc.querySelector('#rgTexto').value = 'gasolinera'; e.doc.querySelector('#rgCat').value = 'Coche';
  A.H.reglaAnadir([]); await sleep(10);
  A.H.reglaCuenta(['']); await sleep(5); e.doc.querySelector('#rgTexto').value = 'gasolinera'; e.doc.querySelector('#rgCat').value = 'Transporte'; A.H.reglaAnadir([]); await sleep(10);
  const rs = A.cfg().reglasCat;
  ok(rs.some((r) => r.texto === 'gasolinera' && r.cuenta === 'cs' && r.categoria === 'Coche') && rs.some((r) => r.texto === 'gasolinera' && !r.cuenta && r.categoria === 'Transporte'), 'dos reglas iguales, una solo en Santander y otra para cualquier cuenta');
  A.H.closeSheet([]); await sleep(260);
  // 2. al importar en Santander: la regla de Santander gana; el traspaso sale por la regla
  A.H.impEnCuenta(['cs']); await sleep(10);
  await A.H.impArchivo([], { files: [file('santander_ejemplo.csv', ab(leer('santander_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  const F = A.imp().filas, gas = F.find((r) => /GASOLINERA/.test(r.desc || '')), tr = F.find((r) => /TRANSFERENCIA A ING/.test(r.desc || ''));
  ok(gas && gas.categoria === 'Coche' && gas.origenCat === 'regla', 'en Santander gana la regla de Santander (Coche)');
  ok(tr && tr.comoTras && tr.otra === 'ci', '«TRANSFERENCIA A ING AHORRO» → traspaso con Hucha por tu regla (aunque la cuenta no sea de ING)');
  A.H.closeSheet([]); await sleep(260);
  // 3. en otra cuenta: la regla «solo en Santander» no vale
  A.H.impEnCuenta(['ce']); await sleep(10);
  await A.H.impArchivo([], { files: [file('santander_ejemplo.csv', ab(leer('santander_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  const gas2 = A.imp().filas.find((r) => /GASOLINERA/.test(r.desc || ''));
  ok(gas2 && gas2.categoria === 'Transporte', 'en otra cuenta se usa la regla de «cualquier cuenta» (Transporte)');
  A.H.closeSheet([]); await sleep(260);
  // 4. al confirmar un traspaso a mano, ofrece recordarlo
  e = await env([], [{ id: 'cs', nombre: 'Santander', principal: true }, { id: 'cx', nombre: 'Otra' }]); A = e.w.__APP__;
  A.H.impEnCuenta(['cs']); await sleep(10);
  await A.H.impArchivo([], { files: [file('santander_ejemplo.csv', ab(leer('santander_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  const F2 = A.imp().filas, alq = F2.find((r) => /ALQUILER/.test(r.desc || '')), k = String(F2.indexOf(alq));
  A.H.impTras([k, '1']); await sleep(5); A.H.impTrasCon([k], { value: 'cx' }); await sleep(5);
  ok(/Recordar: «.+» en Santander → traspaso con Otra/.test(sh(e)), 'al marcarlo como traspaso ofrece «Recordar: … en Santander → traspaso con Otra»');
  A.H.impReglaTras([k]); await sleep(10);
  ok((A.cfg().reglasCat || []).some((r) => r.tras === 'cx' && r.cuenta === 'cs'), 'y guarda la regla');
  // 5. una sola cuenta: la hoja de reglas como siempre
  e = await env([], [{ id: 'c1', nombre: 'Banco' }]); A = e.w.__APP__;
  A.H.openReglas([]); await sleep(10);
  ok(!/Solo en/.test(sh(e)), 'con una sola cuenta la hoja de reglas no cambia');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

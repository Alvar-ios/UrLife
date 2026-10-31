// 31/10/2026 · docs/30 tanda 1: importar en una cuenta concreta y no duplicar lo que ya tenías. Extractos de ejemplo inventados.
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
  const DOS = [{ id: 'cs', nombre: 'Santander', saldo: 1000, fecha: '2026-09-01', principal: true }, { id: 'ci', nombre: 'ING', saldo: 2000, fecha: '2026-09-01' }];
  // 1. con dos cuentas: hay que elegir la cuenta; el nombre del archivo da una pista
  let e = await env([], DOS), A = e.w.__APP__;
  A.H.goTab(['movimientos']); await sleep(10); A.H.impAbrir([]); await sleep(10);
  await A.H.impArchivo([], { files: [file('extracto_raro.csv', ab(leer('santander_ejemplo.csv')))] }); await sleep(40);
  const sh = () => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
  ok(/¿De qué cuenta es este extracto\?/.test(sh()) && !A.imp().cuenta, 'pregunta «¿De qué cuenta es este extracto?» y sin pista no elige ninguna');
  ok(/Elige la cuenta/.test(sh()), 'el botón dice «Elige la cuenta» hasta que se elija');
  A.H.impCuenta(['cs']); A.H.impRevisar([]); await sleep(20);
  ok(/en Santander/.test(sh()), 'la vista previa dice «en Santander» con «Cambiar»');
  const cafes = A.imp().filas.filter((r) => /CAFETERIA/.test(r.desc || ''));
  ok(cafes.length === 2 && cafes.every((r) => r.estado === 'nuevo' && r.incluir), 'los dos cafés iguales del mismo día entran los dos');
  await A.H.impEjecutar([]); await sleep(60); refrescar(e);
  const gS = guardados(e);
  ok(gS.length >= 10 && gS.every((m) => m.cuentaId === 'cs'), 'todo lo importado queda en la cuenta Santander (' + gS.length + ')');
  ok(/Se han guardado \d+ movimientos en Santander/.test(sh()), '«Se han guardado N movimientos en Santander»');
  const perfil = Object.values(A.cfg().importPerfiles || {})[0], lote = (A.cfg().importLotes || []).slice(-1)[0];
  ok(perfil && perfil.cuenta === 'cs' && lote && lote.cuenta === 'cs', 'recuerda la cuenta para ese formato y la apunta en la importación');
  A.H.closeSheet([]); await sleep(260);
  // 2. el mismo formato otra vez: viene elegida y dice por qué; reimportar no duplica
  A.H.impAbrir([]); await sleep(10);
  await A.H.impArchivo([], { files: [file('extracto_raro.csv', ab(leer('santander_ejemplo.csv')))] }); await sleep(40);
  ok(A.imp().cuenta === 'cs' && /La última vez importaste este formato en Santander/.test(sh()), 'la segunda vez viene elegida Santander y lo dice');
  A.H.impRevisar([]); await sleep(20);
  ok(A.imp().filas.filter((r) => r.id).every((r) => r.estado === 'importado'), 'reimportar el mismo archivo: todo «ya importado»');
  A.H.closeSheet([]); await sleep(260);
  // 3. ING: el café idéntico (mismo día, importe y texto) de otra cuenta no se pierde
  A.H.impEnCuenta(['ci']); await sleep(10);
  await A.H.impArchivo([], { files: [file('ing_ejemplo.csv', ab(leer('ing_ejemplo.csv')))] }); await sleep(40);
  ok(A.imp().cuenta === 'ci', 'desde la ficha de la cuenta ING entra con ING ya elegida');
  A.H.impRevisar([]); await sleep(20);
  const cafeI = A.imp().filas.find((r) => /CAFETERIA/.test(r.desc || ''));
  ok(cafeI && cafeI.estado !== 'importado' && /ya importado en Santander|nuevo/.test(cafeI.estado === 'otraCuenta' ? 'ya importado en Santander' : cafeI.estado), 'el café de ING no se da por importado (' + (cafeI && cafeI.estado) + ')');
  if (cafeI && !cafeI.incluir) { A.H.impIncluir([String(A.imp().filas.indexOf(cafeI))], { checked: true }); }
  await A.H.impEjecutar([]); await sleep(60); refrescar(e);
  ok(guardados(e).filter((m) => /CAFETERIA/.test(m.descripcion || '')).length === 3, 'al marcarlo, entra: 3 cafés en total (2 Santander + 1 ING)');
  A.H.closeSheet([]); await sleep(260);
  // 4. lo apuntado a mano: mismo día = «ya lo tenías»; a 2 días = «¿Es el mismo?»; Juntos = «ya está en Juntos»
  e = await env([{ id: 'a1', tipo: 'Factura', categoria: 'Luz', importe: 48.75, fecha: '2026-10-20', descripcion: 'luz', cuentaId: 'cs' },
    { id: 'a2', tipo: 'Gasto', categoria: 'Otros', importe: 29.9, fecha: '2026-09-30', descripcion: 'gimnasio' },
    { id: 'a3', tipo: 'Gasto', categoria: 'Otros', importe: 15, fecha: '2026-10-18', descripcion: 'libro', cuentaId: 'cs' }], DOS); A = e.w.__APP__;
  A.H.impEnCuenta(['ci']); await sleep(10);
  await A.H.impArchivo([], { files: [file('ing_ejemplo.csv', ab(leer('ing_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  const F = A.imp().filas, gym = F.find((r) => /GIMNASIO/.test(r.desc || '')), lib = F.find((r) => /LIBRERIA/.test(r.desc || ''));
  ok(gym && gym.estado === 'quizas' && !gym.incluir && /¿es el mismo que apuntaste el 30 sep/.test(sh()), 'gimnasio sin cuenta apuntado 2 días antes: «¿es el mismo…?», desmarcado');
  ok(lib && lib.estado === 'nuevo' && lib.incluir, 'el libro apuntado en OTRA cuenta (Santander) no se compara: entra en ING');
  A.H.impMismo([String(F.indexOf(gym)), '0']); await sleep(5);
  ok(gym.incluir, '«Son distintos» lo marca');
  A.H.impMismo([String(F.indexOf(gym)), '1']); await sleep(5);
  ok(!gym.incluir, '«Es el mismo» lo desmarca');
  A.H.closeSheet([]); await sleep(260);
  A.H.impEnCuenta(['cs']); await sleep(10);
  await A.H.impArchivo([], { files: [file('santander_ejemplo.csv', ab(leer('santander_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  const luz = A.imp().filas.find((r) => /LUZ/.test(r.desc || ''));
  ok(luz && luz.estado === 'dup' && !luz.incluir && /ya lo tenías: luz/.test(sh()), 'la luz ya apuntada en Santander el mismo día: «ya lo tenías: luz», desmarcada');
  // 5. una sola cuenta: como siempre (no pregunta)
  e = await env([], [{ id: 'c1', nombre: 'Banco', saldo: 1, fecha: '2026-09-01' }]); A = e.w.__APP__;
  A.H.goTab(['movimientos']); await sleep(10); A.H.impAbrir([]); await sleep(10);
  await A.H.impArchivo([], { files: [file('ing_ejemplo.csv', ab(leer('ing_ejemplo.csv')))] }); await sleep(40);
  ok(!/¿De qué cuenta/.test(sh()) && /Ver vista previa/.test(sh()), 'con una sola cuenta no pregunta nada');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

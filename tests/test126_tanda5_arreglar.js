// 08/11/2026 · docs/30b tanda 5: al importar, arreglar lo que ya tenías (cuenta que faltaba, gasto que era un traspaso) y deshacerlo bien. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
const { TextDecoder } = require('util');
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const file = (name, buf) => ({ name, size: buf.byteLength, arrayBuffer: async () => buf });
const leer = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', 'extractos', n));
const TRES = [{ id: 'cs', nombre: 'Santander', banco: 'santander', principal: true, saldo: 1000, fecha: '2026-09-01' }, { id: 'ci', nombre: 'Cuenta naranja', banco: 'ing', saldo: 2000, fecha: '2026-09-01' }, { id: 'ce', nombre: 'Efectivo', tipo: 'efectivo', saldo: 50, fecha: '2026-09-01' }];
async function env(movs, cuentas) {
  const e = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas)) }, meta: { onboarded: true } },
    movs: JSON.parse(JSON.stringify(movs)), url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre: (w) => { w.TextDecoder = TextDecoder; } });
  await sleep(120); return e;
}
const guardados = (e) => Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v));
const refrescar = (e) => { const A = e.w.__APP__, g = guardados(e); A.S._movsRaw = g; A.S.traspasos = g.filter((m) => m.tipo === 'Traspaso'); A.S.movimientos = g.filter((m) => m.tipo !== 'Traspaso'); };
async function importar(e, cuenta, nombre) {
  const A = e.w.__APP__; A.H.impEnCuenta([cuenta]); await sleep(10);
  await A.H.impArchivo([], { files: [file(nombre, ab(leer(nombre)))] }); await sleep(40); A.H.impRevisar([]); await sleep(20); return A.imp();
}
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
(async () => {
  // 1 · Caso antiguo: la transferencia de Santander entró como GASTO en Santander; al importar ING se ofrece convertirla
  const viejo = { id: 'm_viejo', tipo: 'Gasto', importe: 500, categoria: 'Otros', subcategoria: 'Varios', metodoPago: 'Transferencia', fecha: '2026-10-03', descripcion: 'Transferencia a ING', cuentaId: 'cs', lote: 'Lviejo', creadoEn: 1 };
  let e = await env([viejo], TRES), A = e.w.__APP__;
  let I = await importar(e, 'ci', 'ing_ejemplo.csv'), r = I.filas.find((x) => /TRANSFERENCIA DESDE SANTANDER/.test(x.desc || ''));
  ok(r && r.estado === 'convertir' && !r.incluir && !r.convertir, 'ING: la transferencia desde Santander se reconoce como el gasto antiguo, sin marcar nada');
  ok(/Lo convertiremos en un traspaso Santander → Cuenta naranja/.test(sh(e)) && /Sí, convertir/.test(sh(e)), 'pregunta «¿es el gasto de Santander…? Lo convertiremos en un traspaso Santander → Cuenta naranja»');
  // 2 · sin contestar: no cambia nada
  await A.H.impEjecutar([]); await sleep(60);
  ok(JSON.stringify(guardados(e).find((m) => m.id === 'm_viejo')) === JSON.stringify(viejo), 'sin pulsar «Sí», el gasto antiguo no cambia');
  ok(!guardados(e).some((m) => /TRANSFERENCIA DESDE SANTANDER/.test(m.descripcion || '')), 'y esa fila no se importa (no se cuenta dos veces)');
  A.H.closeSheet([]); await sleep(260);
  // 1 bis · contestando «Sí»
  e = await env([viejo], TRES); A = e.w.__APP__;
  I = await importar(e, 'ci', 'ing_ejemplo.csv'); r = I.filas.find((x) => /TRANSFERENCIA DESDE SANTANDER/.test(x.desc || ''));
  A.H.impConvertir([String(I.filas.indexOf(r)), '1']); await sleep(5);
  ok(/Además se arreglará 1 movimiento/.test(sh(e)), 'avisa: «se arreglará 1 movimiento que ya tenías»');
  await A.H.impEjecutar([]); await sleep(80);
  let m = guardados(e).find((x) => x.id === 'm_viejo');
  ok(m.tipo === 'Traspaso' && m.cuentaId === 'cs' && m.cuentaDestinoId === 'ci' && m.importe === 500, 'el gasto pasa a traspaso Santander → Cuenta naranja');
  ok(m.lote === 'Lviejo' && m.subcategoria === 'Varios' && m.metodoPago === 'Transferencia' && m.fecha === '2026-10-03' && m.descripcion === 'Transferencia a ING', 'conserva su lote, fecha, descripción, subcategoría y forma de pago');
  ok(!guardados(e).some((x) => /TRANSFERENCIA DESDE SANTANDER/.test(x.descripcion || '')), 'la fila de ING no se importa aparte (un solo traspaso)');
  const lote = (A.cfg().importLotes || []).slice(-1)[0];
  ok(lote && lote.cambios.length === 1 && lote.cambios[0].antes.tipo === 'Gasto' && !('descripcion' in lote.cambios[0].antes), 'el lote guarda solo los campos cambiados');
  A.H.closeSheet([]); await sleep(260); refrescar(e);
  await A.H.impDeshacer([lote.id]); await sleep(80);
  m = guardados(e).find((x) => x.id === 'm_viejo');
  ok(m && JSON.stringify(Object.assign({}, m, { cuentaDestinoId: undefined })) === JSON.stringify(Object.assign({}, viejo, { cuentaDestinoId: undefined })) && !m.cuentaDestinoId, 'deshacer: vuelve exactamente como estaba y NO se borra');
  ok(!(A.cfg().importLotes || []).some((l) => l.id === lote.id), 'el lote desaparece');
  // 5 · editado después: no se pisa
  e = await env([viejo], TRES); A = e.w.__APP__;
  I = await importar(e, 'ci', 'ing_ejemplo.csv'); r = I.filas.find((x) => /TRANSFERENCIA DESDE SANTANDER/.test(x.desc || ''));
  A.H.impConvertir([String(I.filas.indexOf(r)), '1']); await A.H.impEjecutar([]); await sleep(80); A.H.closeSheet([]); await sleep(260);
  e.store.movimientos.m_viejo.cuentaDestinoId = 'ce'; refrescar(e);
  const l2 = (A.cfg().importLotes || []).slice(-1)[0];
  await A.H.impDeshacer([l2.id]); await sleep(80);
  ok(guardados(e).find((x) => x.id === 'm_viejo').cuentaDestinoId === 'ce', 'si lo cambiaste después, deshacer lo deja como lo dejaste');
  // 6 · borrado después: no se resucita
  e = await env([viejo], TRES); A = e.w.__APP__;
  I = await importar(e, 'ci', 'ing_ejemplo.csv'); r = I.filas.find((x) => /TRANSFERENCIA DESDE SANTANDER/.test(x.desc || ''));
  A.H.impConvertir([String(I.filas.indexOf(r)), '1']); await A.H.impEjecutar([]); await sleep(80); A.H.closeSheet([]); await sleep(260);
  delete e.store.movimientos.m_viejo; refrescar(e);
  await A.H.impDeshacer([(A.cfg().importLotes || []).slice(-1)[0].id]); await sleep(80);
  ok(!e.store.movimientos.m_viejo, 'si lo borraste después, deshacer no lo vuelve a crear');
  // 7 · enlazado a un compartido: no se ofrece convertir
  e = await env([Object.assign({}, viejo, { compartidoId: 'cX' })], TRES); A = e.w.__APP__;
  I = await importar(e, 'ci', 'ing_ejemplo.csv');
  ok(!I.filas.some((x) => x.estado === 'convertir'), 'un gasto compartido nunca se ofrece para convertir');
  // «No, son distintos» → se importa como traspaso nuevo
  e = await env([viejo], TRES); A = e.w.__APP__;
  I = await importar(e, 'ci', 'ing_ejemplo.csv'); r = I.filas.find((x) => /TRANSFERENCIA DESDE SANTANDER/.test(x.desc || ''));
  A.H.impConvertir([String(I.filas.indexOf(r)), '0']); await sleep(5);
  ok(r.estado === 'traspaso' && r.comoTras && r.incluir && r.otra === 'cs', '«No, son distintos» lo deja como traspaso nuevo, marcado');

  // 3 · Ya importado sin cuenta (antes de tener cuentas) → al reimportar con cuentas sale desmarcado
  e = await env([], [{ id: 'cs', nombre: 'Santander', saldo: 1, fecha: '2026-09-01' }]); A = e.w.__APP__;
  A.H.goTab(['movimientos']); await sleep(10); A.H.impAbrir([]); await sleep(10);
  await A.H.impArchivo([], { files: [file('santander_ejemplo.csv', ab(leer('santander_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  await A.H.impEjecutar([]); await sleep(80);
  const antiguos = guardados(e);
  ok(antiguos.length > 3 && antiguos.every((x) => !x.cuentaId), 'preparación: un extracto importado sin cuenta');
  e = await env(antiguos, TRES); A = e.w.__APP__;
  I = await importar(e, 'cs', 'santander_ejemplo.csv');
  const sc = I.filas.filter((x) => x.estado === 'sinCuenta');
  ok(sc.length === antiguos.length && sc.every((x) => !x.incluir), 'al reimportar con cuentas: «ya estaban importadas, pero sin cuenta», desmarcadas');
  ok(new RegExp(sc.length + ' filas ya estaban importadas, pero sin cuenta').test(sh(e)) && /Marcar las \d+/.test(sh(e)), 'lo dice con el número y «Marcar las N»');
  A.H.impSinCuentaTodas([]); await sleep(5);
  ok(sc.every((x) => x.incluir), '«Marcar las N» las marca');
  await A.H.impEjecutar([]); await sleep(120);
  ok(guardados(e).length === antiguos.length && guardados(e).every((x) => x.cuentaId === 'cs'), 'se les pone la cuenta y no se duplica nada');
  ok(guardados(e).every((x) => x.lote === antiguos.find((y) => y.id === x.id).lote), 'cada uno conserva su lote de antes');
  const l3 = (A.cfg().importLotes || []).slice(-1)[0];
  A.H.closeSheet([]); await sleep(260); refrescar(e);
  e.store.movimientos[antiguos[0].id].categoria = 'Supermercado'; refrescar(e); // editada solo la categoría → la cuenta sí se devuelve
  await A.H.impDeshacer([l3.id]); await sleep(120);
  ok(guardados(e).length === antiguos.length && guardados(e).every((x) => !x.cuentaId), 'deshacer: vuelven a no tener cuenta y no se borra ninguno (aunque edites la categoría)');
  // un movimiento con un arreglo pendiente no recibe otro
  e = await env(antiguos, TRES); A = e.w.__APP__;
  I = await importar(e, 'cs', 'santander_ejemplo.csv'); A.H.impSinCuentaTodas([]); await A.H.impEjecutar([]); await sleep(120); A.H.closeSheet([]); await sleep(260);
  refrescar(e); e.store.movimientos[antiguos[0].id].cuentaId = null; refrescar(e);
  I = await importar(e, 'ci', 'santander_ejemplo.csv');
  ok(!I.filas.some((x) => x.estado === 'sinCuenta' && x.con && x.con.id === antiguos[0].id), 'si ya tiene un arreglo pendiente en otra importación, no se le ofrece otro');
  // Dar por bueno
  const l4 = (A.cfg().importLotes || []).find((l) => l.cambios && l.cambios.length);
  A.H.closeSheet([]); await sleep(260); A.H.openLotes([]); await sleep(10);
  ok(/arreglos en lo que ya tenías/.test(sh(e)) && /Dar por bueno/.test(sh(e)), 'Importaciones enseña los arreglos y «Dar por bueno»');
  const btn = [...e.doc.querySelectorAll('#sheetHost [data-click^="loteBueno"]')][0]; A.H.loteBueno([l4.id], btn); A.H.loteBueno([l4.id], btn); await sleep(20);
  ok(!((A.cfg().importLotes || []).find((l) => l.id === l4.id).cambios || []).length, '«Dar por bueno» (tocando dos veces) borra las copias, no los movimientos');
  // 13 · con una sola cuenta no se ofrece nada nuevo
  e = await env([viejo], [{ id: 'cs', nombre: 'Santander', saldo: 1, fecha: '2026-09-01' }]); A = e.w.__APP__;
  A.H.goTab(['movimientos']); await sleep(10); A.H.impAbrir([]); await sleep(10);
  await A.H.impArchivo([], { files: [file('ing_ejemplo.csv', ab(leer('ing_ejemplo.csv')))] }); await sleep(40); A.H.impRevisar([]); await sleep(20);
  ok(!A.imp().filas.some((x) => ['sinCuenta', 'convertir'].includes(x.estado)), 'con una sola cuenta todo sigue como antes');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})();

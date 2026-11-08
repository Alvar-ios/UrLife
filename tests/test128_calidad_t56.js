// 08/11/2026 · Calidad: lo que faltaba por probar de las tandas 5 (docs/30b §7) y 6 (docs/30 §E). Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
const { TextDecoder } = require('util');
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const file = (name, buf) => ({ name, size: buf.byteLength, arrayBuffer: async () => buf });
const leer = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', 'extractos', n), 'utf8');
const TRES = [{ id: 'cs', nombre: 'Santander', banco: 'santander', principal: true, saldo: 1000, fecha: '2026-09-01' }, { id: 'ci', nombre: 'Cuenta naranja', banco: 'ing', saldo: 2000, fecha: '2026-09-01' }, { id: 'ce', nombre: 'Efectivo', tipo: 'efectivo', saldo: 50, fecha: '2026-09-01' }];
const UNA = [{ id: 'cs', nombre: 'Santander', saldo: 1, fecha: '2026-09-01' }];
const guardados = (e) => Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v));
const refrescar = (e) => { const A = e.w.__APP__, g = guardados(e); A.S._movsRaw = g; A.S.traspasos = g.filter((m) => m.tipo === 'Traspaso'); A.S.movimientos = g.filter((m) => m.tipo !== 'Traspaso'); };
async function env(movs, cuentas, extra) {
  const e = makeEnv({ cfg: { app: Object.assign({ categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Otros' }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas)) }, extra || {}), meta: { onboarded: true } },
    movs: JSON.parse(JSON.stringify(movs)), url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre: (w) => { w.TextDecoder = TextDecoder; }, version: { dinero: 0 } });
  await sleep(120); refrescar(e); return e;
}
async function importar(e, cuenta, nombre, txt) {
  const A = e.w.__APP__;
  if (cuenta) A.H.impEnCuenta([cuenta]); else { A.H.goTab(['movimientos']); await sleep(10); A.H.impAbrir([]); }
  await sleep(10);
  await A.H.impArchivo([], { files: [file(nombre, ab(Buffer.from(txt)))] }); await sleep(40); A.H.impRevisar([]); await sleep(20); return A.imp();
}
const cerrar = async (e) => { e.w.__APP__.H.closeSheet([]); await sleep(260); };
const fila = (I, re) => I.filas.find((x) => re.test(x.desc || ''));
const idx = (I, r) => String(I.filas.indexOf(r));
const ultLote = (A) => (A.cfg().importLotes || []).slice(-1)[0];
const foto = (A) => { const k = A.kpisMes(2026, 10); return JSON.stringify({ k: [k.ingresos, k.gastos, k.facturas, k.ahorro, k.disponible].map((x) => Math.round(x * 100)), s: A.cfg().cuentas.map((c) => A.saldoCuenta(c)), p: Math.round(A.patrimonio().total * 100) }); };
// Extracto Santander inventado con N filas distintas
const sanN = (n) => 'Fecha Operación;Fecha Valor;Concepto;Importe;Saldo\n' + Array.from({ length: n }, (_, i) => { const d = String(1 + (i % 28)).padStart(2, '0'); return d + '/10/2026;' + d + '/10/2026;COMPRA EJEMPLO ' + i + ';-' + (1 + i / 100).toFixed(2).replace('.', ',') + ';'; }).join('\n') + '\n';
const ING = leer('ing_ejemplo.csv'), SAN = leer('santander_ejemplo.csv');
const viejo = { id: 'm_viejo', tipo: 'Gasto', importe: 500, categoria: 'Otros', fecha: '2026-10-03', descripcion: 'Transferencia a ING', cuentaId: 'cs', creadoEn: 1 };

(async () => {
  /* §7.14 · convertir y deshacer: «Te queda este mes», saldos y «Lo que tienes» como antes de importar */
  let e = await env([viejo], TRES), A = e.w.__APP__;
  const f0 = foto(A);
  let I = await importar(e, 'ci', 'ing.csv', ING), r = fila(I, /DESDE SANTANDER/);
  A.H.impConvertir([idx(I, r), '1']); await A.H.impEjecutar([]); await sleep(80); await cerrar(e); refrescar(e);
  const sCi = A.saldoCuenta(A.cfg().cuentas[1]), sCs = A.saldoCuenta(A.cfg().cuentas[0]);
  ok(sCs === 500 && Math.round(sCi * 100) === Math.round((2000 + 500 - 29.9 - 1.5 + 2.15 - 15) * 100), 'tras convertir: Santander no cambia (el gasto ya restaba) y la cuenta naranja suma el traspaso');
  ok(A.kpisMes(2026, 10).gastos < JSON.parse(f0).k[1] / 100 + 50, 'tras convertir, los 500 € dejan de contar como gasto del mes');
  await A.H.impDeshacer([ultLote(A).id]); await sleep(80); refrescar(e);
  ok(foto(A) === f0, '§7.14 tras deshacer: «Te queda este mes», saldos de las cuentas y «Lo que tienes» igual que antes de importar');

  /* §7.4 y «Es el mismo» (dup) con un movimiento apuntado a mano sin cuenta y sin lote → deshacer: sigue existiendo, sin cuenta */
  const aMano = { id: 'man1', tipo: 'Gasto', importe: 15, categoria: 'Otros', fecha: '2026-10-18', descripcion: 'libro', creadoEn: 1 };
  e = await env([aMano], TRES); A = e.w.__APP__;
  I = await importar(e, 'ci', 'ing.csv', ING); r = fila(I, /LIBRERIA/);
  ok(r.estado === 'dup' && r.con && r.con.sinCuentaId === 'man1' && !r.asignar, '«ya lo tenías» con uno sin cuenta: se ofrece ponerle la cuenta, desmarcado');
  ok(/Ponerle la cuenta Cuenta naranja \(no la tenía\)/.test(e.doc.querySelector('#sheetHost').textContent), 'la casilla dice «Ponerle la cuenta Cuenta naranja (no la tenía)»');
  A.H.impAsignar([idx(I, r)], { checked: true }); await A.H.impEjecutar([]); await sleep(80); await cerrar(e); refrescar(e);
  ok(e.store.movimientos.man1.cuentaId === 'ci' && !e.store.movimientos.man1.lote && guardados(e).filter((m) => m.importe === 15 || m.importe === -15).length === 1, 'se le pone la cuenta, no recibe lote y no se duplica');
  await A.H.impDeshacer([ultLote(A).id]); await sleep(80);
  ok(e.store.movimientos.man1 && !e.store.movimientos.man1.cuentaId && e.store.movimientos.man1.descripcion === 'libro', '§7.4 deshacer: el apuntado a mano sigue existiendo y vuelve a no tener cuenta');
  ok(Object.keys(e.store.movimientos).length === 1, 'y lo importado en ese lote se borra');

  /* «¿Es el mismo?» (quizás) → «Es el mismo» le pone la cuenta; «Son distintos» no */
  e = await env([Object.assign({}, aMano, { fecha: '2026-10-16' })], TRES); A = e.w.__APP__;
  I = await importar(e, 'ci', 'ing.csv', ING); r = fila(I, /LIBRERIA/);
  ok(r.estado === 'quizas' && r.con.sinCuentaId === 'man1', '«¿es el mismo?» con uno sin cuenta');
  A.H.impMismo([idx(I, r), '0']); ok(!r.asignar && r.incluir, '«Son distintos»: se importa aparte y no se toca el antiguo');
  A.H.impMismo([idx(I, r), '1']); ok(r.asignar && !r.incluir && /Le pondremos la cuenta Cuenta naranja, que no tenía/.test(e.doc.querySelector('#sheetHost').textContent), '«Es el mismo»: avisa de que le pondrá la cuenta');
  await A.H.impEjecutar([]); await sleep(80);
  ok(e.store.movimientos.man1.cuentaId === 'ci' && e.store.movimientos.man1.fecha === '2026-10-16', 'se le pone la cuenta y conserva su fecha');
  await cerrar(e);

  /* §7.7 · con meta, inversión o pago fijo: nunca se ofrece convertir */
  for (const [extra, cfgX, txt] of [[{ metaId: 'mj' }, { ahorro: [{ id: 'mj', nombre: 'Viaje' }] }, 'una meta'], [{ activoId: 'a1' }, {}, 'una inversión'], [{ tipo: 'Factura', categoria: 'Ahorro mensual' }, { facturas: [{ nombre: 'Ahorro mensual', importe: 500 }] }, 'un pago fijo']]) {
    e = await env([Object.assign({}, viejo, extra)], TRES, cfgX); A = e.w.__APP__;
    I = await importar(e, 'ci', 'ing.csv', ING);
    ok(!I.filas.some((x) => x.estado === 'convertir'), '§7.7 un gasto enlazado a ' + txt + ' no se ofrece para convertir');
    await cerrar(e);
  }

  /* §7.8 · fallo a mitad de deshacer: el lote no se borra, quedan los pendientes y repetir termina bien sin duplicar */
  e = await env([], UNA); A = e.w.__APP__;
  await importar(e, null, 'santander.csv', SAN); await A.H.impEjecutar([]); await sleep(80);
  const antiguos = guardados(e); await cerrar(e);
  const quitado = antiguos[0], resto = antiguos.slice(1);
  e = await env(resto, TRES); A = e.w.__APP__;
  I = await importar(e, 'cs', 'santander.csv', SAN); A.H.impSinCuentaTodas([]); await A.H.impEjecutar([]); await sleep(120); await cerrar(e); refrescar(e);
  const L8 = ultLote(A);
  ok(L8 && L8.cambios.length === resto.length && L8.n >= 1 && guardados(e).length === antiguos.length, 'preparación: un lote con filas nuevas y arreglos');
  const falla = L8.cambios[L8.cambios.length - 2].id; // el 2.º que se devuelve (se recorre del último al primero)
  const colOrig = A.S.db.collection;
  A.S.db.collection = (n) => { const c = colOrig(n), d = c.doc; c.doc = (id) => { const x = d(id); if (id === falla) x.set = async () => { throw new Error('sin conexión'); }; return x; }; return c; };
  await A.H.impDeshacer([L8.id]); await sleep(80);
  A.S.db.collection = colOrig;
  const L8b = (A.cfg().importLotes || []).find((l) => l.id === L8.id);
  ok(L8b && L8b.cambios.length === resto.length - 1 && guardados(e).length === antiguos.length, '§7.8 si falla a mitad: el lote sigue, no se borra nada y solo queda pendiente lo que falta');
  refrescar(e);
  await A.H.impDeshacer([L8.id]); await sleep(120);
  ok(!(A.cfg().importLotes || []).some((l) => l.id === L8.id) && guardados(e).length === resto.length && guardados(e).every((m) => !m.cuentaId), 'al repetir termina bien: todos sin cuenta otra vez, lo nuevo borrado y nada duplicado');
  void quitado;

  /* §7.9 · recorte a 50: el lote viejo con arreglos se conserva; sale el viejo sin arreglos */
  const lotes = Array.from({ length: 50 }, (_, i) => ({ id: 'Lx' + i, fecha: '2026-01-01T00:00:00Z', archivo: 'a' + i + '.csv', n: 1 }));
  lotes[0].cambios = [{ id: 'no-existe', campos: ['cuentaId'], antes: { cuentaId: null }, despues: { cuentaId: 'cs' }, ts: 1 }];
  e = await env([], TRES, { importLotes: lotes }); A = e.w.__APP__;
  I = await importar(e, 'cs', 'santander.csv', SAN); await A.H.impEjecutar([]); await sleep(120);
  const ls = A.cfg().importLotes;
  ok(ls.length === 50 && ls.some((l) => l.id === 'Lx0') && !ls.some((l) => l.id === 'Lx1') && ls[ls.length - 1].id === ultLote(A).id, '§7.9 al pasar de 50 se quita el más viejo SIN arreglos y se conserva el que tiene copias');
  await cerrar(e);

  /* §7.10 · deshacer el lote A (Santander) antes que el B (ING) que convirtió un gasto suyo */
  e = await env([], TRES); A = e.w.__APP__;
  I = await importar(e, 'cs', 'santander.csv', SAN); r = fila(I, /TRANSFERENCIA A ING/);
  if (r.estado === 'traspaso') A.H.impTras([idx(I, r), '0']);
  await A.H.impEjecutar([]); await sleep(120); const LA = ultLote(A).id; await cerrar(e); refrescar(e);
  const gA = guardados(e).find((m) => /TRANSFERENCIA A ING/.test(m.descripcion || ''));
  ok(gA && gA.tipo === 'Gasto' && gA.lote === LA, 'preparación: la transferencia entró como gasto en el lote de Santander');
  I = await importar(e, 'ci', 'ing.csv', ING); r = fila(I, /DESDE SANTANDER/);
  ok(r && r.estado === 'convertir', 'al importar ING se ofrece convertir ese gasto');
  A.H.impConvertir([idx(I, r), '1']); await A.H.impEjecutar([]); await sleep(120); const LB = ultLote(A).id; await cerrar(e); refrescar(e);
  ok(e.store.movimientos[gA.id].tipo === 'Traspaso' && e.store.movimientos[gA.id].lote === LA, 'convertido: conserva el lote de Santander');
  await A.H.impDeshacer([LA]); await sleep(120); refrescar(e);
  ok(!e.store.movimientos[gA.id], 'deshacer Santander se lleva también el traspaso (decisión del 31/10)');
  await A.H.impDeshacer([LB]); await sleep(120);
  ok(!e.store.movimientos[gA.id] && guardados(e).length === 0 && !(A.cfg().importLotes || []).length, '§7.10 deshacer ING después: no lo vuelve a crear y no queda nada');

  /* §7.12 · límites: 200 arreglos por importación y 500 en total */
  e = await env([], UNA); A = e.w.__APP__;
  await importar(e, null, 'muchos.csv', sanN(201)); await A.H.impEjecutar([]); await sleep(150);
  const muchos = guardados(e); await cerrar(e);
  ok(muchos.length === 201, 'preparación: 201 movimientos importados sin cuenta');
  e = await env(muchos, TRES); A = e.w.__APP__;
  I = await importar(e, 'cs', 'muchos.csv', sanN(201)); A.H.impSinCuentaTodas([]); await A.H.impEjecutar([]); await sleep(150);
  ok(guardados(e).every((m) => !m.cuentaId) && !(A.cfg().importLotes || []).length && A.imp().paso === 'revisar', '§7.12 más de 200 arreglos de una vez: no se cambia nada y se pide hacerlo en dos veces');
  await cerrar(e);
  const llenos = [{ id: 'Lfull', fecha: '2026-01-01T00:00:00Z', archivo: 'x.csv', n: 0, cambios: Array.from({ length: 500 }, (_, i) => ({ id: 'z' + i, campos: ['cuentaId'], antes: { cuentaId: null }, despues: { cuentaId: 'cs' }, ts: 1 })) }];
  e = await env(muchos.slice(0, 3), TRES, { importLotes: llenos }); A = e.w.__APP__;
  I = await importar(e, 'cs', 'muchos.csv', sanN(3)); A.H.impSinCuentaTodas([]); await A.H.impEjecutar([]); await sleep(120);
  ok(guardados(e).every((m) => !m.cuentaId) && A.cfg().importLotes.length === 1, '§7.12 con 500 arreglos guardados: no se cambia nada y se pide «Dar por bueno»');
  await cerrar(e);

  /* §7.13 · con una sola cuenta, reimportar un archivo de antes: todo igual que hoy (ya importado, nada que arreglar) */
  e = await env(muchos.slice(0, 3), UNA); A = e.w.__APP__;
  I = await importar(e, null, 'muchos.csv', sanN(3));
  ok(I.filas.filter((x) => x.id).every((x) => x.estado === 'importado') && !/arreglar/i.test(e.doc.querySelector('#sheetHost').textContent), '§7.13 con una sola cuenta no se ofrece ningún arreglo');
  await cerrar(e);

  /* Tanda 6 · meta ligada: casos que pidió el jefe de proyecto */
  const C6 = [{ id: 'cs', nombre: 'Santander', principal: true, saldo: 1000, fecha: '2026-01-01' }, { id: 'ci', nombre: 'ING Ahorro', tipo: 'ahorro', saldo: 0, fecha: '2026-01-01' }];
  const metas = { ahorro: [{ id: 'mj', nombre: 'Viaje a Japón', objetivo: 3000, cuentaId: 'ci' }] };
  e = await env([], C6, metas); A = e.w.__APP__;
  const hoy = new Date(), Y = hoy.getFullYear(), M = hoy.getMonth() + 1;
  const k0 = A.kpisMes(Y, M), p0 = A.patrimonio().total;
  A.H.metaAportarR(['mj']); await sleep(10); A.form().importe = '200'; await A.H.aportarRGuardar([]); await sleep(40); refrescar(e); await cerrar(e);
  const k1 = A.kpisMes(Y, M);
  ok(k1.disponible === k0.disponible - 200 && k1.gastos === k0.gastos, '«Te queda este mes» baja lo apartado (200 €), igual que un apartado de siempre');
  ok(A.patrimonio().total === p0, '«Lo que tienes» no cambia al aportar (el dinero solo cambia de cuenta)');
  ok(A.saldoCuenta(A.cfg().cuentas[0]) + A.saldoCuenta(A.cfg().cuentas[1]) === 1000, 'la suma de las dos cuentas cuadra');
  const ap = guardados(e).find((m) => m.tipo === 'Ahorro');
  // editar el importe: los saldos siguen al nuevo importe
  A.H.openMovForm([ap.id]); await sleep(20); e.doc.querySelector('#fImporte').value = '150'; await A.H.saveMov([]); await sleep(40); refrescar(e); await cerrar(e);
  ok(A.saldoCuenta(A.cfg().cuentas[0]) === 850 && A.saldoCuenta(A.cfg().cuentas[1]) === 150 && e.store.movimientos[ap.id].cuentaDestinoId === 'ci', 'editar el importe de un aporte ligado: las dos cuentas se mueven con él');
  // borrar y «Deshacer»
  A.H.openMovForm([ap.id]); await sleep(20); { const b = e.doc.querySelector('#sheetHost [data-click^="deleteMov"]'); A.H.deleteMov([], b); await A.H.deleteMov([], b); } await sleep(80); refrescar(e);
  ok(!e.store.movimientos[ap.id], 'preparación: el aporte se ha borrado');
  ok(A.saldoCuenta(A.cfg().cuentas[0]) === 1000 && A.saldoCuenta(A.cfg().cuentas[1]) === 0 && A.patrimonio().total === p0, 'borrar un aporte ligado devuelve las dos cuentas a como estaban');
  // meta compartida: no se liga (no mueve dinero de tus cuentas)
  ok(A.cuentaDeMeta('g:algo') === null, 'una meta compartida nunca está ligada a una cuenta tuya');
  // la principal es la propia cuenta de la meta: el dinero sale de otra
  const C6b = [{ id: 'ci', nombre: 'ING Ahorro', tipo: 'ahorro', principal: true, saldo: 500, fecha: '2026-01-01' }, { id: 'cs', nombre: 'Santander', saldo: 1000, fecha: '2026-01-01' }];
  e = await env([], C6b, metas); A = e.w.__APP__;
  A.H.metaAportarR(['mj']); await sleep(10);
  ok(A.form().desde === 'cs' && /pasará de Santander a ING Ahorro/.test(e.doc.querySelector('#sheetHost').textContent) && !e.doc.querySelector('#sheetHost [data-click="aportarRDesde|ci"]'), 'si la principal es la cuenta de la meta, «Desde» propone otra cuenta y no ofrece la misma');
  A.form().importe = '100'; await A.H.aportarRGuardar([]); await sleep(40); refrescar(e); await cerrar(e);
  ok(A.saldoCuenta(A.cfg().cuentas[0]) === 600 && A.saldoCuenta(A.cfg().cuentas[1]) === 900, 'y el dinero pasa de Santander a ING Ahorro');
  // general: nuevo Apartar a una meta ligada desde el formulario general
  A.H.openMovForm([null]); await sleep(20); A.form().tipo = 'Ahorro'; A.form().metaSel = 'mj'; e.doc.querySelector('#fImporte').value = '30'; await A.H.saveMov([]); await sleep(40); refrescar(e); await cerrar(e);
  const n30 = guardados(e).find((m) => m.importe === 30);
  ok(n30 && n30.cuentaId === 'cs' && n30.cuentaDestinoId === 'ci', 'desde el formulario general, un Apartar nuevo a la meta ligada sale de otra cuenta, no de la propia');
  // con una sola cuenta no se ofrece ligar
  e = await env([], UNA, metas); A = e.w.__APP__;
  A.H.metaEditar(['mj']); await sleep(10);
  ok(!/¿Dónde guardas este dinero\?/.test(e.doc.querySelector('#sheetHost').textContent) && A.cuentaDeMeta('mj') === null, 'con una sola cuenta no sale «¿Dónde guardas este dinero?» y la meta no mueve dinero');
  await cerrar(e);
  A.H.metaAportarR(['mj']); await sleep(10);
  ok(/Apartar no saca dinero del banco/.test(e.doc.querySelector('#sheetHost').textContent), 'y Aportar sigue como siempre');

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})();

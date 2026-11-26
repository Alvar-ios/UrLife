// 26/11/2026 · Sin conexión (docs/52, tanda 1): copia local cifrada, cola de cambios, subida una sola vez, conflictos, cuentas distintas.
// Prueba data-layer.js con un Supabase simulado en memoria (se le puede «cortar la red») y un IndexedDB simulado. Datos inventados.
const { JSDOM } = require('jsdom'), fs = require('fs'), path = require('path');
const { IDBFactory } = require('fake-indexeddb');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'data-layer.js'), 'utf8');

// ---- servidor simulado ----
const srv = { net: true, tablas: { movimientos: new Map(), tareas: new Map(), config: new Map() }, escrituras: 0, uid: 'u1' };
let reloj = 1; const ts = () => '2026-11-26T10:00:' + String(reloj++).padStart(2, '0') + 'Z';
function builder(t) {
  const f = []; let modo = 'select', datos = null, uno = false, selDespues = false;
  const tabla = () => (srv.tablas[t] = srv.tablas[t] || new Map());
  const rows = () => [...tabla().values()].filter((r) => f.every(([k, v, op]) => (op === 'is' ? (r[k] == null) : r[k] === v)));
  const ejecutar = () => {
    if (!srv.net) return Promise.reject(new TypeError('Failed to fetch'));
    if (modo === 'select') { const rs = rows(); return Promise.resolve({ data: uno ? (rs[0] || null) : rs, error: null }); }
    srv.escrituras++;
    if (modo === 'upsert') { const lista = [].concat(datos); lista.forEach((d) => { const k = t === 'config' ? d.user_id + '|' + d.key : d.id; const ant = tabla().get(k); tabla().set(k, Object.assign({}, ant || {}, d, { updated_at: ts() })); }); return Promise.resolve({ data: lista, error: null }); }
    if (modo === 'update') { const rs = rows(); rs.forEach((r) => Object.assign(r, datos, { updated_at: ts() })); return Promise.resolve({ data: selDespues ? rs.map((r) => ({ id: r.id })) : null, error: null }); }
    if (modo === 'delete') { rows().forEach((r) => tabla().delete(t === 'config' ? r.user_id + '|' + r.key : r.id)); return Promise.resolve({ data: null, error: null }); }
  };
  const b = { select() { if (modo !== 'select') selDespues = true; return b; }, eq(k, v) { f.push([k, v, 'eq']); return b; }, is(k, v) { f.push([k, v, 'is']); return b; }, order() { return b; }, range() { return b; },
    maybeSingle() { uno = true; return b; }, single() { uno = true; return b; }, upsert(d) { modo = 'upsert'; datos = d; return b; }, insert(d) { modo = 'upsert'; datos = d; return b; }, update(d) { modo = 'update'; datos = d; return b; }, delete() { modo = 'delete'; return b; },
    then(res, rej) { return ejecutar().then(res, rej); } };
  return b;
}
let authCb = null;
const fakeSb = (sesion) => ({ from: builder, channel() { const c = { on() { return c; }, subscribe() { return c; } }; return c; }, removeChannel() {},
  auth: { onAuthStateChange(cb) { authCb = cb; setTimeout(() => cb('SIGNED_IN', sesion()), 0); }, getSession: async () => ({ data: { session: sesion() } }), signOut: async () => ({ error: null }) } });

// ---- «móvil»: una ventana con la capa de datos, el almacén local compartido y la clave nativa ----
const idb = new IDBFactory(); const CLAVE = Buffer.alloc(32, 7).toString('base64');
function abrir(uid) {
  const dom = new JSDOM('', { runScripts: 'outside-only', url: 'https://localhost/', pretendToBeVisual: true }); const w = dom.window;
  Object.defineProperty(w, 'indexedDB', { value: idb, configurable: true }); Object.defineProperty(w, 'crypto', { value: require('crypto').webcrypto, configurable: true }); w.__nativo = { claveLocal: async () => CLAVE, olvidarClaveLocal: async () => {} };
  w.localStorage.setItem('palom:uid', uid); w.localStorage.setItem('palom:mail', 'a@example.invalid');
  w.supabase = { createClient: () => fakeSb(() => ({ user: { id: uid, email: 'a@example.invalid' } })) }; w.SUPABASE_CONFIG = { url: 'x', anonKey: 'y' };
  w.eval(SRC); return w;
}
const ids = (snap) => snap.docs.map((d) => d.id).sort().join(',');
function leer(w, col) { return new Promise((res) => { let off; off = w.Data.collection(col).onSnapshot((s) => { res({ snap: s, off }); }, () => res(null)); }); }

(async () => {
  srv.tablas.movimientos.set('m1', { id: 'm1', user_id: 'u1', tipo: 'Gasto', importe: 5, descripcion: 'Café', updated_at: ts() });
  let w = abrir('u1'); await sleep(60);
  ok(w.Data.sinc && w.Data.sinc.activo(), 'en la app (con clave nativa) la copia local está activa');
  let r = await leer(w, 'movimientos'); ok(ids(r.snap) === 'm1', 'con red se leen los movimientos'); r.off(); await sleep(1000); // se guarda la copia

  // cortar la red y abrir de nuevo: se ven los datos de la copia
  srv.net = false; w = abrir('u1'); await sleep(80);
  r = await leer(w, 'movimientos'); ok(r && ids(r.snap) === 'm1', 'sin red, al abrir se ven los datos guardados en el móvil'); 
  // apuntar sin red
  await w.Data.collection('movimientos').doc('m2').set({ tipo: 'Gasto', importe: 7, descripcion: 'Pan' });
  await w.Data.collection('movimientos').doc('m1').set({ tipo: 'Gasto', importe: 6, descripcion: 'Café' });
  await sleep(100);
  ok(w.Data.sinc.estado().total === 2 && w.Data.sinc.estado().sinRed, 'sin red quedan 2 cambios por subir y se sabe que no hay red');
  let r2 = await leer(w, 'movimientos'); ok(ids(r2.snap) === 'm1,m2', 'lo apuntado sin red se ve ya en la lista'); r2.off();
  ok(srv.tablas.movimientos.size === 1, 'y el servidor todavía no ha recibido nada');

  // cerrar la app del todo y abrirla otra vez: la cola sigue ahí
  w.close(); w = abrir('u1'); await sleep(100);
  ok(w.Data.sinc.estado().total === 2, 'al cerrar y abrir la app los 2 cambios siguen pendientes');

  // vuelve la red: se suben una sola vez
  srv.net = true; const antes = srv.escrituras; w.dispatchEvent(new w.Event('online')); await sleep(600);
  ok(w.Data.sinc.estado().total === 0, 'con red vuelta, la cola se vacía');
  ok(srv.tablas.movimientos.has('m2') && srv.tablas.movimientos.get('m1').importe === 6, 'el servidor tiene lo nuevo y lo cambiado');
  ok(srv.escrituras - antes === 2, 'cada cambio se sube una sola vez (' + (srv.escrituras - antes) + ')');
  w.dispatchEvent(new w.Event('online')); await sleep(300); ok(srv.escrituras - antes === 2, 'otra señal de red no repite nada');

  // editar algo que otro móvil ya borró → Revisar, y «Recuperarlo»
  srv.net = false; w = abrir('u1'); await sleep(80); await leer(w, 'movimientos');
  await w.Data.collection('movimientos').doc('m1').set({ tipo: 'Gasto', importe: 9, descripcion: 'Café' }); await sleep(60);
  srv.tablas.movimientos.delete('m1'); srv.net = true; w.dispatchEvent(new w.Event('online')); await sleep(600);
  let e = w.Data.sinc.estado(); ok(e.revisar === 1 && !srv.tablas.movimientos.has('m1'), 'si lo borraron en otro sitio, no resucita solo: va a «Revisar»');
  await w.Data.sinc.forzar(w.Data.sinc.lista()[0].idOp); await sleep(400);
  ok(srv.tablas.movimientos.has('m1') && w.Data.sinc.estado().total === 0, '«Recuperarlo» lo vuelve a crear');

  srv.net = true; w = abrir('u1'); await sleep(60); (await leer(w, 'movimientos')).off(); await sleep(1100); // se guarda la copia al día
  // cambiado en otro sitio mientras tanto → Revisar; «Descartar» lo quita sin tocar el servidor
  srv.net = false; w = abrir('u1'); await sleep(80); await leer(w, 'movimientos');
  await w.Data.collection('movimientos').doc('m2').set({ tipo: 'Gasto', importe: 11, descripcion: 'Pan' }); await sleep(60);
  Object.assign(srv.tablas.movimientos.get('m2'), { importe: 8, updated_at: ts() }); srv.net = true; w.dispatchEvent(new w.Event('online')); await sleep(600);
  e = w.Data.sinc.estado(); ok(e.revisar === 1 && srv.tablas.movimientos.get('m2').importe === 8, 'si otro móvil lo cambió después, no se pisa: va a «Revisar»');
  await w.Data.sinc.descartar(w.Data.sinc.lista()[0].idOp); ok(w.Data.sinc.estado().total === 0 && srv.tablas.movimientos.get('m2').importe === 8, '«Descartar» lo quita y el servidor queda como estaba');

  // crear nunca da conflicto aunque se suba dos veces el mismo id
  srv.net = false; w = abrir('u1'); await sleep(80); await leer(w, 'movimientos');
  await w.Data.collection('movimientos').doc('m9').set({ tipo: 'Gasto', importe: 1, descripcion: 'Nuevo' }); await sleep(60);
  srv.tablas.movimientos.set('m9', { id: 'm9', user_id: 'u1', tipo: 'Gasto', importe: 1, updated_at: ts() }); srv.net = true; w.dispatchEvent(new w.Event('online')); await sleep(500);
  ok(w.Data.sinc.estado().total === 0 && [...srv.tablas.movimientos.keys()].filter((k) => k === 'm9').length === 1, 'un movimiento nuevo reintentado no se duplica');

  // otra cuenta en el mismo móvil: no se sube lo de la anterior
  srv.net = false; w = abrir('u1'); await sleep(80); await leer(w, 'movimientos');
  await w.Data.collection('movimientos').doc('m11').set({ tipo: 'Gasto', importe: 3, descripcion: 'De u1' }); await sleep(60);
  w.close(); srv.net = true; const w2 = abrir('u2'); await sleep(500);
  ok(![...srv.tablas.movimientos.values()].some((x) => x.id === 'm11'), 'otra cuenta en el mismo móvil no sube cambios de la primera');
  ok(w2.Data.sinc.estado().total === 0, 'y no ve su cola');
  w = abrir('u1'); await sleep(600); ok(srv.tablas.movimientos.has('m11'), 'al volver la primera cuenta, sus cambios se suben');

  // Juntos sin red: solo mirar
  srv.net = false; w = abrir('u1'); await sleep(80);
  await w.Data.collection('movimientos').doc('zz').set({ tipo: 'Gasto', importe: 1 }); await sleep(60); // para que se sepa que no hay red
  let rechazo = null; try { await w.Data.compartidos.crear({ importe: 5 }); } catch (err) { rechazo = err; }
  ok(rechazo && rechazo.code === 'sin_conexion', 'sin red, apuntar un gasto compartido se rechaza con «sin_conexion» (Juntos solo se mira)');
  w.close();
  // cerrar sesión a propósito borra la copia
  await w.Data.sinc.olvidar(); w = abrir('u1'); srv.net = false; await sleep(80);
  const r3 = await Promise.race([leer(w, 'movimientos'), sleep(5000).then(() => 'tarde')]);
  ok(r3 === null || r3 === 'tarde' || r3.snap.docs.length === 0, 'tras cerrar sesión a propósito, sin red ya no queda ningún dato en el móvil');

  // la web (sin clave nativa) no guarda copia
  const dom = new JSDOM('', { runScripts: 'outside-only', url: 'https://localhost/' }); dom.window.supabase = { createClient: () => fakeSb(() => ({ user: { id: 'u1' } })) }; dom.window.SUPABASE_CONFIG = { url: 'x', anonKey: 'y' }; dom.window.eval(SRC);
  ok(!dom.window.Data.sinc.activo(), 'en la web (sin app) no se guarda copia local');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

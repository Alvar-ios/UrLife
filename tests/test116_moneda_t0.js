// docs/29 tanda 0 (31/10/2026): «¿Pagaste en otra moneda?» al compartir y en un gasto normal. Se guarda en euros. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};

const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), hoy = iso(d);
const mas = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return iso(x); };
(async () => {
  const e = makeEnv({ cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Restaurantes' }, { nombre: 'Supermercado' }, { nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S, sh = () => doc.querySelector('#sheetHost');
  const creados = [], editados = [], rpcs = [], temasCreados = [];
  let n = 0;
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm) => ({ user_id: u, nombre: nm, rol: 'miembro' });
  S.grupos = [{ id: 'g1', nombre: 'Viaje', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana')] },
    { id: 'g2', nombre: 'Casa', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uB', 'Bea')], todos: [m('uYo', 'Lucía'), m('uB', 'Bea')] }];
  S.compartidos = [
    { id: 'k1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Cena', importe: 60, pagadoPor: 'uYo', reparto: { uYo: 30, uA: 30 }, modo: 'igual', creadoPor: 'uYo', createdAt: '2026-10-01T10:00:00Z', fecha: mas(-1), carpetaId: null },
    { id: 'k2', grupoId: 'g1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Agua', importe: 10, pagadoPor: 'uA', reparto: { uYo: 5, uA: 5 }, modo: 'igual', creadoPor: 'uA', createdAt: '2026-10-01T11:00:00Z', fecha: mas(-30), carpetaId: null }];
  S.objetivos = []; S.aportes = [];
  S.carpetas = [{ id: 't1', grupoId: 'g1', nombre: 'Roma', icono: 'plane', desde: mas(-2), hasta: mas(3), cerrada: null, createdAt: '2026-10-01T09:00:00Z' },
    { id: 't2', grupoId: 'g1', nombre: 'Compra', icono: 'cart', desde: null, hasta: null, cerrada: null, createdAt: '2026-10-01T08:00:00Z' },
    { id: 't9', grupoId: 'g2', nombre: 'Luz', icono: 'home', desde: null, hasta: null, cerrada: null, createdAt: '2026-10-01T08:00:00Z' }];
  S.db = Object.assign(S.db || {}, {
    grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] },
    rpc: async (fn, p) => { rpcs.push([fn, p]); return p && p.p_ids ? p.p_ids.length : null; },
    compartidos: Object.assign({}, (S.db && S.db.compartidos) || {}, { crear: async (o) => { creados.push(o); return Object.assign({ id: 'nuevo' + (++n), creadoPor: 'uYo', createdAt: new Date().toISOString() }, o); }, editar: async (id, o) => { editados.push([id, o]); return Object.assign({}, S.compartidos.find((c) => c.id === id), o); } }),
    carpetas: { suscribir: () => () => {}, crear: async (o) => { temasCreados.push(o); return Object.assign({ id: 'tn' + temasCreados.length, cerrada: null, desde: null, hasta: null, createdAt: new Date().toISOString() }, o); },
      editar: async (id, o) => Object.assign({}, S.carpetas.find((t) => t.id === id), o), borrar: async () => [{ id: 'x' }], restaurar: async (id) => null },
  });
  { const ls = {}; Object.defineProperty(e.w, 'localStorage', { value: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, configurable: true }); }
  let pedidos = [], hayRed = true;
  S.db.divisas = { cambio: async (m, f) => { pedidos.push([m, f]); if (!hayRed) throw new Error('sin red'); return m === 'USD' ? { fecha: mas(-1), porEur: 1.08 } : m === 'GBP' ? { fecha: mas(-1), porEur: 0.84 } : null; } };
  const box = () => sh().querySelector('#monBox');
  const escribe = (sel, v, accion) => { const el = sh().querySelector(sel); el.value = v; H[accion]([], el); };
  // 1. compartir un gasto
  H.compRapido(['g:g1']); await sleep(30);
  ok(/¿Pagaste en otra moneda\?/.test(box().textContent), 'al compartir: «¿Pagaste en otra moneda?»');
  H.monAbrir([]); await sleep(30);
  ok(pedidos.length === 1 && pedidos[0][0] === 'USD', 'pide el cambio del día (dólar, la primera vez)');
  ok(/1 € = 1,08 \$/.test(box().textContent) && /BCE/.test(box().textContent), 'enseña «1 € = 1,08 $ · BCE …»');
  escribe('#monImporte', '120', 'monImporte'); await sleep(5);
  ok(/= 111,11 €/.test(box().textContent) && /Usar 111,11 €/.test(box().textContent), '120 $ → «= 111,11 €» y «Usar 111,11 €»');
  sh().querySelector('#crDesc').value = 'Cena'; H.crDesc([], sh().querySelector('#crDesc'));
  H.monUsar([]); await sleep(10);
  ok(sh().querySelector('#crImporte').value === '111,11' && A.form().importe === '111,11', 'al usarlo, el importe del gasto queda en euros (111,11)');
  ok(sh().querySelector('#crDesc').value === 'Cena · 120,00 $', 'y en la descripción se apunta «120,00 $»');
  ok(/¿Pagaste en otra moneda\?/.test(box().textContent), 'la caja se cierra');
  await H.crGuardar([]); await sleep(40);
  ok(creados[0] && Math.abs(creados[0].importe - 111.11) < 0.001 && !('moneda' in creados[0]), 'se guarda en euros, sin campos nuevos (tanda 0 no toca la base de datos)');
  // 2. lo que me cobraron y libras
  H.compRapido(['g:g1']); await sleep(30); H.monAbrir([]); await sleep(20);
  const sel = sh().querySelector('#monMoneda'); sel.value = 'GBP'; H.monMoneda([], sel); await sleep(20);
  ok(/0,84 £/.test(box().textContent), 'cambiar a libras pide su cambio');
  escribe('#monImporte', '50', 'monImporte');
  H.monOrigen(['cobro']); await sleep(5); escribe('#monCobro', '60,40', 'monCobro'); await sleep(5);
  ok(/Usar 60,40 €/.test(box().textContent), '«Lo que me cobraron» manda: Usar 60,40 €');
  H.monOrigen(['mano']); await sleep(5);
  ok(sh().querySelector('#monMano').value === '0,84', '«Poner el cambio» empieza con el del BCE');
  escribe('#monMano', '0,8', 'monMano'); await sleep(5);
  ok(/Usar 62,50 €/.test(box().textContent), 'a mano: 50 £ al 0,8 = 62,50 €');
  H.closeSheet([]); await sleep(260);
  // 3. moneda que no da el BCE
  H.compRapido(['g:g1']); await sleep(30); H.monAbrir([]); await sleep(20);
  const s2 = sh().querySelector('#monMoneda'); s2.value = 'OTRA'; H.monMoneda([], s2); await sleep(20);
  ok(/no publica esa moneda/.test(box().textContent) && sh().querySelector('#monMano'), 'otra moneda: se pide el cambio a mano y lo explica');
  H.closeSheet([]); await sleep(260);
  // 4. sin conexión: usa el último cambio guardado y lo dice
  hayRed = false;
  H.compRapido(['g:g1']); await sleep(30); H.monAbrir([]); await sleep(30);
  ok(/1 € = 0,84 £/.test(box().textContent) && /Sin conexión/.test(box().textContent), 'sin conexión: recuerda la última moneda (libra) y su último cambio, con aviso');
  H.closeSheet([]); await sleep(260); hayRed = true;
  // 5. gasto normal
  H.openMovForm([]); await sleep(40);
  ok(box() && /otra moneda/.test(box().textContent), 'en un gasto normal también sale');
  H.monAbrir([]); await sleep(30); const s3 = sh().querySelector('#monMoneda'); s3.value = 'USD'; H.monMoneda([], s3); await sleep(30); escribe('#monImporte', '54', 'monImporte'); H.monUsar([]); await sleep(10);
  ok(sh().querySelector('#fImporte').value === '50', 'en el gasto normal pone 50 € en el importe (54 $ al 1,08)');
  H.closeSheet([]); await sleep(260);
  // 6. con el teclado propio de la app
  A.S.verAnterior.importe = 0;
  H.openMovForm([]); await sleep(40);
  ok(box() && A.form().tec, 'con el teclado de la app también sale');
  H.monAbrir([]); await sleep(30); escribe('#monImporte', '108', 'monImporte'); H.monUsar([]); await sleep(10);
  ok(A.form().tec.txt === '100' && sh().querySelector('#fImporte').value === '100' && /100/.test(sh().querySelector('#tecCifra').textContent), 'la cifra grande pasa a 100 € (108 $ al 1,08)');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

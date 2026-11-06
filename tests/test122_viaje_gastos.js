// 06/11/2026 (petición del dueño): al compartir un gasto en las fechas de un viaje, pregunta «¿Va en el viaje?»; y en el viaje se pueden añadir gastos ya apuntados. Datos inventados.
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
  rpcs.length = 0;
  S.db.rpc = async (fn, p) => { rpcs.push([fn, JSON.parse(JSON.stringify(p))]); if (fn === 'poner_carpeta') return p.p_ids.length; return []; };
  // 1. compartir con fecha dentro del viaje: pregunta
  H.compRapido(['g:g1']); await sleep(30);
  ok(/Esta fecha es del viaje «Roma»\. ¿Va en el viaje\?/.test(sh().textContent) && A.form().tema === 't1', 'al compartir hoy (dentro del viaje a Roma) pregunta «¿Va en el viaje?» y viene elegido');
  H.temaElegir(['']); await sleep(10);
  ok(A.form().tema === null && !/¿Va en el viaje\?/.test(sh().textContent), '«No» lo quita y deja de preguntar');
  H.closeSheet([]); await sleep(260);
  // 2. añadir gastos ya apuntados al viaje
  H.grupoVer(['g1']); await sleep(40); H.temaVer(['t1']); await sleep(20);
  ok(/Añadir gastos ya apuntados al viaje/.test(sh().textContent), 'en el viaje sale «Añadir gastos ya apuntados al viaje»');
  H.temaMeterAbrir(['t1']); await sleep(10);
  ok(/Primero los de las fechas del viaje/.test(sh().textContent) && /Cena/.test(sh().textContent), 'enseña primero los gastos de esas fechas');
  H.temaSelTodosFechas([]); await sleep(10);
  ok(/Añadir 1/.test(sh().textContent), '«Marcar los de esas fechas» marca la cena');
  await H.temaMeterOk(['t1']); await sleep(20);
  const pc = rpcs.find((x) => x[0] === 'poner_carpeta');
  ok(pc && pc[1].p_carpeta === 't1' && pc[1].p_ids.length === 1 && S.compartidos[0].carpetaId === 't1', 'los mete en el viaje (poner_carpeta) y se ven en él');
  ok(/1 gasto añadido a «Roma»/.test(doc.querySelector('#toast').textContent) && doc.querySelector('#toast .toast-btn'), 'aviso con «Deshacer»');
  doc.querySelector('#toast .toast-btn').click(); await sleep(20);
  const des = rpcs.filter((x) => x[0] === 'poner_carpeta').pop();
  ok(des[1].p_carpeta === null && !S.compartidos[0].carpetaId, '«Deshacer» los devuelve a como estaban (sin tema)');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

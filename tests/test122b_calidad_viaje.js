// Calidad 06/11/2026: viaje-gastos, permisos y límite de 200. Datos inventados.
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
  // 1) Grupo «solo quien lo apuntó»: k2 es de Ana y yo no soy admin -> no debería ofrecerse
  S.grupos[0].edicion = 'autor'; S.grupos[0].soyAdmin = false;
  H.grupoVer(['g1']); await sleep(40); H.temaVer(['t1']); await sleep(20); H.temaMeterAbrir(['t1']); await sleep(10);
  H.temaVerTodosB([]); await sleep(10); const html = sh().textContent; ok(/Cena/.test(html), 'la lista está abierta');
  ok(!/Agua/.test(html), 'grupo «solo quien lo apuntó»: no ofrece gastos de otros (Agua, de Ana)');
  H.temaMeterCerrar([]); S.grupos[0].edicion = null;
  // 2) Más de 200 marcados: debe trocear en llamadas de 200 como mucho
  for (let i = 0; i < 230; i++) S.compartidos.push({ id: 'z' + i, grupoId: 'g1', tipo: 'Gasto', categoria: 'Otros', descripcion: 'G' + i, importe: 1, pagadoPor: 'uYo', reparto: { uYo: 1 }, modo: 'igual', creadoPor: 'uYo', createdAt: '2026-10-01T10:00:00Z', fecha: hoy, carpetaId: null });
  rpcs.length = 0;
  S.db.rpc = async (fn, p) => { rpcs.push([fn, p]); if (p.p_ids.length > 200) throw new Error('demasiados'); return p.p_ids.length; };
  H.temaMeterAbrir(['t1']); await sleep(10); H.temaSelTodosFechas([]); await sleep(10);
  await H.temaMeterOk(['t1']); await sleep(20);
  ok(rpcs.length && rpcs.every((r) => r[1].p_ids.length <= 200), 'más de 200: ninguna llamada a poner_carpeta pasa de 200');
  ok(S.compartidos.filter((c) => c.carpetaId === 't1').length >= 230, 'más de 200: se añaden todos');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

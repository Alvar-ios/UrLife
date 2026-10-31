// docs/29 tanda 0 (31/10/2026): un tema con avión es un viaje: gasto por día y «Cerrar el viaje» con aviso de saldos. Datos inventados.
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
  // Roma: del día -2 al +3 → hoy van 3 días; la cena (60 €, el día -1) es del viaje
  S.compartidos[0].carpetaId = 't1';
  H.grupoVer(['g1']); await sleep(40); H.temaVer(['t1']); await sleep(20);
  ok(/Unos\s*20 €\s*al día · 3 días/.test(sh().textContent) && /tu parte, 10 € al día/.test(sh().textContent), 'viaje en curso: «Unos 20 € al día · 3 días» (contados hasta hoy) y tu parte al día');
  H.temaMenu(['t1']); await sleep(10);
  ok(/Cerrar el viaje/.test(sh().textContent) && !/Cerrar tema/.test(sh().textContent), 'con avión, el menú dice «Cerrar el viaje»');
  H.temaCerrarPre(['t1']); await sleep(10);
  const t = sh().textContent;
  ok(/Cómo quedó el viaje/.test(t) && /60,00 € entre los dos · tu parte 30,00 €/.test(t), 'antes de cerrar: «Cómo quedó el viaje» con total y tu parte');
  ok(/Aún hay 1 pago para quedar en paz/.test(t) && /Ver saldos/.test(t), 'avisa de que quedan pagos en el grupo, con «Ver saldos»');
  H.temaCerrarNo([]); await sleep(10);
  ok(!/Cómo quedó el viaje/.test(sh().textContent), '«Ahora no» lo quita sin cerrar');
  H.temaCerrarPre(['t1']); await sleep(10);
  await H.temaCerrar(['t1']); await sleep(20);
  ok(!!S.carpetas.find((x) => x.id === 't1').cerrada && /Viaje cerrado/.test(doc.querySelector('#toast').textContent), 'cerrar: queda cerrado y dice «Viaje cerrado»');
  // un tema sin avión sigue diciendo «Cerrar tema» y, sin fechas, no hay «al día»
  H.temaVer(['t2']); await sleep(10); H.temaMenu(['t2']); await sleep(10);
  ok(/Cerrar tema/.test(sh().textContent) && !/al día/.test(sh().textContent), 'tema normal: «Cerrar tema» y sin «al día»');
  // en paz: lo dice
  S.compartidos = [S.compartidos[1]]; S.compartidos[0].reparto = { uYo: 0, uA: 10 }; S.compartidos[0].pagadoPor = 'uA';
  H.temaCerrarPre(['t2']); await sleep(10);
  ok(/Estáis en paz en el grupo/.test(sh().textContent), 'si no queda nada por pagar: «Estáis en paz en el grupo»');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

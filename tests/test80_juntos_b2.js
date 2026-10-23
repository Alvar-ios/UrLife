// Juntos B2 (23/10/2026): metas y deudas juntos con su forma y «Faltan X» / «Quedan X». Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
(async () => {
  const e = makeEnv({ version: { dinero: 0 }, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S;
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null });
  const m = (u, n) => ({ user_id: u, nombre: n, rol: 'miembro' });
  S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana')] }];
  S.compartidos = [{ id: 'k1', grupoId: 'g1', tipo: 'Gasto', descripcion: 'Compra', importe: 40, pagadoPor: 'uYo', reparto: { uYo: 20, uA: 20 }, modo: 'igual', creadoPor: 'uYo', createdAt: '2026-10-05T10:00:00.000Z', fecha: '2026-10-05' }];
  S.objetivos = [{ id: 'o1', grupoId: 'g1', tipo: 'ahorro', nombre: 'Viaje Lisboa', objetivo: 1200, previo: 600, hitos: [], usos: [], creadoPor: 'uA', createdAt: '2026-09-20T10:00:00Z' },
    { id: 'o2', grupoId: 'g1', tipo: 'deuda', nombre: 'Sofá', objetivo: 900, previo: 450, hitos: [], usos: [], creadoPor: 'uA', createdAt: '2026-09-01T10:00:00Z' }];
  S.aportes = [];
  H.goTab(['juntos']); await sleep(40);
  const tarj = [...doc.querySelectorAll('.jv-objs .jv-obj')];
  ok(tarj.length === 2, 'una fila con la meta y la deuda juntas');
  ok(tarj[0] && tarj[0].querySelector('.fm .fm-t') && /Viaje Lisboa/.test(tarj[0].querySelector('.fm-t').textContent) && /Faltan 600/.test(tarj[0].textContent) && /50 %/.test(tarj[0].textContent), 'meta: su forma (maleta por el nombre), el nombre dentro, 50 % y «Faltan 600 €»');
  ok(tarj[1] && tarj[1].classList.contains('deu') && /Quedan 450/.test(tarj[1].textContent) && tarj[1].querySelector('.jv-obj-ic svg'), 'deuda: icono, «Quedan 450 €»');
  tarj[0].click(); await sleep(20);
  ok(/Viaje Lisboa/.test(doc.querySelector('#sheetHost').textContent) && doc.querySelector('#sheetHost .fm'), 'tocar la meta abre su hoja, con la forma');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err)); process.exit(1); });

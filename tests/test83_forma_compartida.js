// Forma de una meta compartida (23/10/2026, docs/18): se elige en el editor y solo se manda si se toca; vale para todo el grupo. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
(async () => {
  const e = makeEnv({ version: { dinero: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Casa' }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S, sh = () => doc.querySelector('#sheetHost');
  const llamadas = [];
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, n) => ({ user_id: u, nombre: n, rol: 'miembro' });
  S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana')] }];
  S.compartidos = []; S.aportes = [];
  S.objetivos = [{ id: 'o1', grupoId: 'g1', tipo: 'ahorro', nombre: 'Viaje Lisboa', objetivo: 1200, previo: 0, hitos: [], usos: [], forma: 'avion', creadoPor: 'uA', createdAt: '2026-09-20T10:00:00Z' },
    { id: 'o2', grupoId: 'g1', tipo: 'ahorro', nombre: 'Sofá nuevo', objetivo: 600, previo: 0, hitos: [], usos: [], forma: '<b>x</b>', creadoPor: 'uA', createdAt: '2026-09-20T10:00:00Z' }];
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null,
    objetivos: { editar: async (id, d) => { llamadas.push([id, d]); return Object.assign({}, S.objetivos.find((x) => x.id === id), d); }, crear: async (d) => { llamadas.push(['nuevo', d]); return Object.assign({ id: 'o9', hitos: [], usos: [] }, d); } } });
  H.goTab(['juntos']); await sleep(40);
  const fm = [...doc.querySelectorAll('.jv-objs .jv-obj .fm')];
  ok(fm.length === 2 && fm[0].querySelector('.fm-svg') , 'las dos metas con forma en Juntos');
  // la forma guardada por el grupo manda; una clave rara cae en la del nombre
  H.objEditar(['o1']); await sleep(20);
  ok(sh().querySelector('.fm-op.on[data-k="avion"]') && /Elegida a mano/.test(sh().textContent) && /misma para todo el grupo/.test(sh().textContent), 'editor: la forma del grupo (avión) y el aviso de que es para todos');
  await H.objGuardar([]); await sleep(20);
  ok(llamadas.length === 1 && !('forma' in llamadas[0][1]), 'guardar sin tocar la forma no la manda');
  H.objEditar(['o1']); await sleep(20); H.objFormaElegir(['maleta']); await sleep(10); await H.objGuardar([]); await sleep(20);
  ok(llamadas[1] && llamadas[1][1].forma === 'maleta', 'elegir otra la manda (maleta)');
  H.objEditar(['o1']); await sleep(20); H.objFormaElegir(['']); await sleep(10); await H.objGuardar([]); await sleep(20);
  ok(llamadas[2] && llamadas[2][1].forma === null, '«Que la elija el nombre» manda null (nunca texto vacío)');
  H.objEditar(['o2']); await sleep(20);
  ok(sh().querySelector('.fm-op.on[data-k="tarro"]') && !/<b>x<\/b>/.test(sh().innerHTML) && /Elegida por el nombre/.test(sh().textContent), 'una forma desconocida en la base de datos se ignora (la del nombre) y no se pinta tal cual');
  H.closeSheet([]); await sleep(300);
  // deuda compartida: sin selector de forma
  H.objNueva(['deuda', 'g1']); await sleep(20);
  ok(!sh().querySelector('.fm-grid'), 'las deudas compartidas no llevan selector de forma');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

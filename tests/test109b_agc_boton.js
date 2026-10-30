// 30/10: botón «Compartir mi agenda» en la Agenda (semana y calendario). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), hoy = iso(d);
async function esc({ grupos, falla, perms }) {
  const e = makeEnv({ version: { agenda: 0, tu: 0, crear: 0, inicio: 0 }, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, c = () => doc.querySelector('#content');
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm) => ({ user_id: u, nombre: nm, rol: 'miembro' });
  S.grupos = grupos ? [{ id: 'g1', nombre: 'Familia', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana')] }] : [];
  S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = []; S.agenda = [];
  const lst = async () => { if (falla) throw new Error('sin conexión (prueba)'); return (perms || []).slice(); };
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => ({ grupos: S.grupos, miembros: [] }), invitaciones: async () => [] }, rpc: async () => null,
    agenda: { suscribir: () => () => {}, crear: async (o) => o, editar: async (i, o) => o, borrar: async () => [], restaurar: async () => null },
    agendaPermisos: { listar: lst, ocultas: async () => [], conmigo: async () => [], crear: async (o) => o, editar: async (i, o) => o, borrar: async () => null, deOtro: async () => [], ocultar: async () => null, mostrar: async () => null } });
  H.goTab(['agenda']); S.agendaDia = hoy; A.render(); await sleep(60); A.render(); await sleep(20);
  const semana = { n: c().querySelectorAll('.agc-compartir').length, laVen: c().querySelectorAll('.agc-laven').length, txt: c().textContent };
  H.setInicioVista(['calendario']); await sleep(60); A.render(); await sleep(20);
  const cal = { n: c().querySelectorAll('.agc-compartir').length, laVen: c().querySelectorAll('.agc-laven').length };
  return { semana, cal, S };
}
(async () => {
  let r = await esc({ grupos: true });
  ok(r.semana.n === 1 && r.cal.n === 1, 'con grupo y sin compartir: un botón en la semana y en el calendario');
  r = await esc({ grupos: false });
  ok(r.semana.n === 0 && r.cal.n === 0, 'sin grupos (usuario nuevo): no sale');
  r = await esc({ grupos: true, falla: true });
  ok(r.S.agcError && r.semana.n === 0 && r.cal.n === 0, 'si falla la carga: no sale');
  r = await esc({ grupos: true, perms: [{ id: 'p1', aUsuario: 'uA', aGrupo: null, nivel: 'titulos', planes: true, tareas: true }] });
  ok(r.semana.n === 0 && r.semana.laVen === 1 && /La ven Ana/.test(r.semana.txt) && r.cal.n === 0 && r.cal.laVen === 1, 'si ya la compartes: solo «La ven…», sin duplicar');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

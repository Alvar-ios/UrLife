// Parche 8 (23/10/2026, «cerramos día»): etiquetas MEJORADO que vuelven a salir (Tu mes, Así vas, cobros y pagos fijos)
// y NUEVO en Tu perfil, Planes y Temas; y que se quitan al entrar. Datos inventados.
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const fijaFecha = (iso) => (w) => {
  const D = w.Date, t = new D(iso + 'T12:00:00').getTime();
  class FD extends D { constructor(...a) { if (!a.length) super(t); else super(...a); } static now() { return t; } }
  w.Date = FD;
};
const m = (u, nm) => ({ user_id: u, nombre: nm, rol: 'miembro' });
(async () => {
  // Ya vio las etiquetas del Parche 7 (17/10) y las antiguas de Tú
  const vistas = { tumes: '2026-10-17', asivas: '2026-10-17', cobros: '2026-10-13', cuentas: '2026-10-18', patrimonio: '2026-10-18', categorias: '2026-10-13', reglas: '2026-10-13', grupos: '2026-10-13', importar: '2026-10-13', papelera: '2026-10-15', aspecto: '2026-10-15', oscuro: '2026-10-13', sincuenta: '2026-10-18' };
  const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 }, pre: fijaFecha('2026-10-24'),
    movs: [{ id: 'i1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: '2026-10-01' }, { id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 80, fecha: '2026-10-10' }, { id: 'g2', tipo: 'Gasto', categoria: 'Supermercado', importe: 60, fecha: '2026-09-10' }],
    cfg: { app: { nombre: 'Lucía', badgesVistos: Object.assign({}, vistas), categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(120);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost'), html = () => doc.querySelector('#content').innerHTML;
  const vistos = () => A.cfg().badgesVistos || {};

  /* 1. Las claves que vuelven con fecha nueva salen otra vez como MEJORADO */
  ok(A.badgeActivo('tumes') && A.badgeActivo('asivas') && A.badgeActivo('cobros'), 'Tu mes, Así vas y cobros: vistas antes del 23/10, vuelven a salir');
  ok(A.BADGES.tumes[0] === 'MEJORADO' && A.BADGES.asivas[0] === 'MEJORADO' && A.BADGES.cobros[0] === 'MEJORADO', 'y salen como MEJORADO');
  ok(!A.badgeActivo('cuentas') && !A.badgeActivo('grupos'), 'las que no cambian siguen sin salir si ya las viste');
  H.goTab(['inicio']); await sleep(20);
  ok(/Así vas <span class="badge-new mejor">MEJORADO/.test(html()), 'Inicio: «Así vas» con MEJORADO');

  /* 2. Tú: NUEVO en tu perfil y MEJORADO en cobros y Tu mes (como mucho 3) */
  H.goTab(['tu']); await sleep(20);
  ok(/badge-new ">NUEVO/.test(doc.querySelector('.tu2-quien').innerHTML), 'Tú: tu nombre lleva NUEVO (tu perfil)');
  ok(/Cobros y pagos recurrentes <span class="badge-new mejor">MEJORADO/.test(html()) && /Tu mes <span class="badge-new mejor">MEJORADO/.test(html()), 'Tú: MEJORADO en cobros y pagos fijos y en Tu mes');
  ok(doc.querySelectorAll('#content .badge-new').length === 3, 'Tú: no más de 3 etiquetas a la vez');
  ok(doc.querySelector('#tbAvatar').classList.contains('con-novedad'), 'punto en tu inicial');
  click(e, 'tuNombreAbrir'); await sleep(20);
  ok(/Tu perfil/.test(sh().textContent) && vistos().perfil === '2026-10-24', 'abrir tu perfil quita su etiqueta');
  H.closeSheet([]); await sleep(300);
  click(e, 'openRecurrentes'); await sleep(20);
  ok(vistos().cobros === '2026-10-24', 'abrir cobros y pagos fijos quita su etiqueta');
  H.closeSheet([]); await sleep(300);
  click(e, 'tuMesAbrir'); await sleep(20); H.closeSheet([]); await sleep(300);
  H.goTab(['tu']); await sleep(20);
  ok(!doc.querySelector('.tu2-quien .badge-new') && !/Tu mes <span class="badge-new/.test(html()) && !/Cobros y pagos recurrentes <span class="badge-new/.test(html()), 'Tú: ya sin esas etiquetas');

  /* 3. Grupo: NUEVO en «Planes» y en los temas; se quitan al usarlos */
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  S.grupos = [{ id: 'g1', nombre: 'Amigos', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana')] }];
  S.compartidos = [{ id: 'k1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Otros', descripcion: 'Cena', importe: 40, pagadoPor: 'uYo', reparto: { uYo: 20, uA: 20 }, modo: 'igual', creadoPor: 'uYo', createdAt: '2026-10-20T10:00:00Z', fecha: '2026-10-20', carpetaId: 't1' }];
  S.objetivos = []; S.aportes = [];
  S.carpetas = [{ id: 't1', grupoId: 'g1', nombre: 'Roma', icono: 'plane', desde: null, hasta: null, cerrada: null, createdAt: '2026-10-01T09:00:00Z' }];
  S.agenda = [];
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null,
    compartidos: { crear: async (o) => o, editar: async (id, o) => o },
    carpetas: { suscribir: () => () => {}, crear: async (o) => o, editar: async (id, o) => o, borrar: async () => [], restaurar: async () => null },
    agenda: { suscribir: () => () => {}, crear: async (o) => o, editar: async (id, o) => o, borrar: async () => [], restaurar: async () => null } });
  H.grupoVer(['g1']); await sleep(30);
  const planesBtn = () => [...sh().querySelectorAll('.jv-tabs button')].find((b) => /^Planes/.test(b.textContent.trim()));
  ok(planesBtn() && /NUEVO/.test(planesBtn().innerHTML), 'grupo: la pestaña «Planes» lleva NUEVO');
  ok(/Por temas <span class="badge-new ">NUEVO/.test(sh().innerHTML), 'grupo: «Por temas» lleva NUEVO');
  H.grupoTab(['planes']); await sleep(20);
  ok(vistos().planes && !/NUEVO/.test(planesBtn().innerHTML), 'al entrar en «Planes» se quita su etiqueta');
  H.grupoTab(['gastos']); await sleep(20);
  H.temaVer(['t1']); await sleep(20);
  ok(vistos().temas, 'al abrir un tema se quita la etiqueta de los temas');
  H.temaVer(['']); await sleep(20);
  ok(!/Por temas <span class="badge-new/.test(sh().innerHTML), 'y «Por temas» ya no la lleva');
  H.closeSheet([]); await sleep(300);

  /* 4. Las novedades: «Tu perfil» se abre desde su punto */
  H.novIr(['perfil']); await sleep(320);
  ok(S.tab === 'tu' && /Tu perfil/.test(sh().textContent), 'novedades → «Tu perfil» abre su hoja');
  H.closeSheet([]); await sleep(300);

  /* 5. Alguien nuevo (la bienvenida marca todo como visto hoy): sin etiquetas del Parche 8 */
  const n = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 }, pre: fijaFecha('2026-10-24'),
    cfg: { app: { nombre: 'Leo', badgesVistos: { tumes: '2026-10-24', asivas: '2026-10-24', cobros: '2026-10-24', perfil: '2026-10-24', planes: '2026-10-24', temas: '2026-10-24' }, categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(120);
  ok(!n.w.__APP__.badgeActivo('tumes') && !n.w.__APP__.badgeActivo('perfil'), 'si las viste después del 23/10, no vuelven');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('FAIL ' + x); process.exit(1); });

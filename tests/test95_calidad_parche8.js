// Calidad · Parche 8 (23/10/2026): usuario nuevo sin etiquetas, ventana de novedades con iconos y emojis,
// todos los destinos de las novedades, y la etiqueta dentro del botón «+ Tema». Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const fijaFecha = (iso) => (w) => {
  const D = w.Date, t = new D(iso + 'T12:00:00').getTime();
  class FD extends D { constructor(...a) { if (!a.length) super(t); else super(...a); } static now() { return t; } }
  w.Date = FD;
};
const m = (u, nm) => ({ user_id: u, nombre: nm, rol: 'miembro' });
(async () => {
  /* 1. Usuario nuevo el mismo día del parche: la bienvenida marca todo como visto y no sale ninguna etiqueta */
  {
    const e = makeEnv({ cfg: {}, version: { tu: 0, agenda: 0, crear: 0 }, pre: fijaFecha('2026-10-23') });
    await sleep(150);
    const A = e.w.__APP__;
    ok(A.S.onboarding, 'usuario nuevo: sale la bienvenida');
    if (A.S.onboarding) { A.S.onboarding.nombre = 'Leo'; await A.H.obFinish(['']); await sleep(400); }
    const activas = Object.keys(A.BADGES).filter((k) => A.badgeActivo(k));
    ok(!activas.length, 'usuario nuevo el 23/10: ninguna etiqueta activa (' + activas.join(', ') + ')');
    A.H.goTab(['inicio']); await sleep(30);
    ok(!e.doc.querySelector('#content .badge-new'), 'Inicio sin etiquetas');
    A.H.goTab(['tu']); await sleep(30);
    ok(!e.doc.querySelector('#content .badge-new') && !e.doc.querySelector('#tbAvatar.con-novedad'), 'Tú sin etiquetas ni punto en la inicial');
  }

  /* 2. Usuario de antes: verBadge no repite sin fin; y un valor antiguo raro (true) no rompe */
  const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 }, pre: fijaFecha('2026-10-24'),
    cfg: { app: { nombre: 'Lucía', badgesVistos: { tumes: '2026-10-17', cuentas: true }, categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost');
  ok(A.badgeActivo('tumes'), 'Tu mes visto el 17/10: vuelve a salir');
  H.tuMesAbrir([]); await sleep(20); H.closeSheet([]); await sleep(300);
  ok(!A.badgeActivo('tumes'), 'tras entrar ya no sale');
  const antes = JSON.stringify(A.cfg().badgesVistos); H.tuMesAbrir([]); await sleep(20); H.closeSheet([]); await sleep(300);
  ok(JSON.stringify(A.cfg().badgesVistos) === antes, 'volver a entrar no guarda nada nuevo');
  ok(!A.badgeActivo('cuentas'), 'un valor antiguo «true» cuenta como visto');

  /* 3. Ventana de novedades: la de al abrir y el historial */
  H.verNovedades(['']); await sleep(20);
  const p8 = sh().innerHTML;
  ok(/Parche 8/.test(sh().textContent) && sh().querySelectorAll('.nov-dest-em svg.i').length === 2, 'al abrir: Parche 8 con sus 2 destacados con icono');
  ok(sh().querySelectorAll('.nov-list .nov-it .nov-em svg.i').length === 6, 'y sus 6 puntos con icono');
  ok(!/undefined|\[object/.test(p8), 'sin «undefined» ni textos rotos');
  ok(sh().querySelectorAll('.nov-it[data-click^="novIr"]').length === 5, '5 puntos llevan a su sitio (Inicio nuevo no lleva)');
  H.closeSheet([]); await sleep(300);
  H.verNovedades(['1']); await sleep(20);
  const ems = [...sh().querySelectorAll('.nov-em')];
  ok(ems.length > 20 && ems.some((x) => x.querySelector('svg.i')) && ems.some((x) => !x.querySelector('svg') && x.textContent.trim().length), 'historial: puntos con icono (Parche 8) y con emoji (anteriores)');
  ok(!ems.some((x) => !x.innerHTML.trim()), 'ningún punto sin icono ni emoji');
  ok(sh().querySelectorAll('[data-click^="novIr"]').length === 2 + 5, 'en el historial solo lleva a su sitio lo de la última versión');
  H.closeSheet([]); await sleep(300);

  /* 4. Todos los destinos de las novedades funcionan (menos «ticket», que abre la cámara) */
  const destinos = new Set();
  const fuente = require('fs').readFileSync(require('path').join(__dirname, '..', 'app.js'), 'utf8');
  const nov = fuente.slice(fuente.indexOf('const NOVEDADES'), fuente.indexOf('const BADGES'));
  for (const x of nov.matchAll(/ir: '(\w+)'/g)) destinos.add(x[1]);
  for (const x of nov.matchAll(/, '(\w+)'\],?\n/g)) destinos.add(x[1]);
  destinos.delete('ticket');
  const errores = []; e.w.addEventListener('error', (ev) => errores.push(ev.message));
  const sinCaso = [];
  const src = fuente.slice(fuente.indexOf('novIr: ([k])'), fuente.indexOf('metaNuevaForm:'));
  for (const k of destinos) {
    if (!src.includes("k === '" + k + "'")) sinCaso.push(k);
    try { H.novIr([k]); await sleep(320); } catch (x) { errores.push(k + ': ' + x.message); }
    H.closeSheet([]); await sleep(300); H.goTab(['inicio']); await sleep(20);
  }
  ok(destinos.has('perfil') && destinos.has('tareas') && destinos.has('crear') && destinos.has('cobros') && destinos.has('tumes'), 'los destinos del Parche 8 están en la lista (' + destinos.size + ')');
  ok(!sinCaso.length, 'novIr conoce todos los destinos (' + sinCaso.join(', ') + ')');
  ok(!errores.length, 'ningún destino da error (' + errores.join(' | ') + ')');

  /* 5. «+ Tema» con la etiqueta dentro: tocar la etiqueta abre igual y el texto se entiende */
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  S.grupos = [{ id: 'g1', nombre: 'Amigos', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana')] }];
  S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = []; S.agenda = [];
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null,
    carpetas: { suscribir: () => () => {}, crear: async (o) => o, editar: async (id, o) => o, borrar: async () => [], restaurar: async () => null },
    agenda: { suscribir: () => () => {}, crear: async (o) => o, editar: async (id, o) => o, borrar: async () => [], restaurar: async () => null } });
  H.grupoVer(['g1']); await sleep(30);
  const btn = sh().querySelector('.tema-mas-suelto');
  const et = btn && btn.querySelector('.badge-new');
  ok(btn && et, '«+ Tema» lleva NUEVO dentro');
  if (btn) ok(btn.textContent.replace(/\s+/g, ' ').trim() === 'Tema NUEVO', 'texto del botón: «' + btn.textContent.replace(/\s+/g, ' ').trim() + '»');
  if (et) { et.click(); await sleep(80); }
  ok(A.form() && A.form().temaForm && A.cfg().badgesVistos.temas, 'tocar justo la etiqueta abre «Nuevo tema» y la quita');
  ok(!sh().querySelector('.tema-mas-suelto .badge-new'), 'ya sin etiqueta');
  H.closeSheet([]); await sleep(300);

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('FAIL ' + x); process.exit(1); });

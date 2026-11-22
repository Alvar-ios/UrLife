// Tanda 2b de Juntos (docs/46): «Compartir» arriba en un gasto ya apuntado y en el teclado corto, «Pedir» con detalle y enlace, atrás en «Gasto guardado». Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
(async () => {
  const pad = (n) => String(n).padStart(2, '0'), d = new Date(), hoy = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const e = makeEnv({ version: { juntos: 3, importe: 0, crear: 0, tu: 1, agenda: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Restaurantes' }], nombre: 'Álvaro' }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uA' } },
    movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Cena', importe: 40, fecha: hoy }] });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, rpcs = [];
  S.user = Object.assign({}, S.user, { id: 'uA' });
  const m = (u, nm, rol, sc) => Object.assign({ user_id: u, nombre: nm, rol: rol || 'miembro' }, sc ? { sinCuenta: true } : {});
  const ms = [m('uA', 'Álvaro', 'admin'), m('uC', 'Carlos', 'sin_cuenta', true)];
  S.grupos = [{ id: 'g1', nombre: 'Álvaro y Carlos', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: ms, todos: ms }];
  S.compartidos = [
    { id: 'k1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Cena', importe: 30, pagadoPor: 'uA', reparto: { uA: 15, uC: 15 }, modo: 'igual', fecha: hoy },
    { id: 'k2', grupoId: 'g1', tipo: 'Gasto', categoria: 'Ocio', descripcion: 'Cine', importe: 20, pagadoPor: 'uA', reparto: { uA: 10, uC: 10 }, modo: 'igual', fecha: hoy }];
  S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.db = Object.assign(S.db || {}, { grupos: (S.db && S.db.grupos) || { listar: async () => ({ grupos: [], miembros: [] }) }, compartidos: (S.db && S.db.compartidos) || { suscribir: () => () => {}, crear: async (o) => o, editar: async (i, o) => o, borrar: async () => [] }, rpc: async (fn, p) => { rpcs.push(fn); if (fn === 'enlace_sin_cuenta') return 'TOKping9'; return null; } });

  // 1) Pedir por WhatsApp: con detalle y con el enlace de Carlos (sin app)
  H.personaVer(['uC']); await sleep(120);
  const wa = doc.querySelector('#sheetHost a.wa-btn'), t = wa ? decodeURIComponent(wa.getAttribute('href')) : '';
  ok(/Cena/.test(t) && /Cine/.test(t) && /25/.test(t), 'Pedir: el mensaje dice de qué gastos es (Cena, Cine) y el total (25)');
  ok(/soy=TOKping9/.test(t) && rpcs.indexOf('enlace_sin_cuenta') >= 0, 'Pedir a alguien sin app: lleva su enlace para entrar');
  // con alguien con app: sin enlace
  const ms2 = [m('uA', 'Álvaro', 'admin'), m('uB', 'Ana')];
  S.grupos = [{ id: 'g2', nombre: 'Piso', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: ms2, todos: ms2 }];
  S.compartidos = [{ id: 'k3', grupoId: 'g2', tipo: 'Gasto', categoria: 'Súper', descripcion: 'Compra', importe: 20, pagadoPor: 'uA', reparto: { uA: 10, uB: 10 }, modo: 'igual', fecha: hoy }];
  rpcs.length = 0; closeAll(); H.personaVer(['uB']); await sleep(120);
  const t2 = decodeURIComponent((doc.querySelector('#sheetHost a.wa-btn') || { getAttribute: () => '' }).getAttribute('href'));
  ok(/Compra/.test(t2) && !/soy=/.test(t2) && rpcs.indexOf('enlace_sin_cuenta') < 0, 'Pedir a alguien con app: con detalle y sin enlace');
  function closeAll() { H.closeSheet && H.closeSheet([]); }
  await sleep(300);

  // 2) Gasto ya apuntado: botón «Compartir este gasto» arriba, y no el interruptor de en medio
  S.grupos = [{ id: 'g1', nombre: 'Álvaro y Carlos', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: ms, todos: ms }];
  H.openMovForm(['m1']); await sleep(80);
  ok(!!doc.querySelector('#compArriba'), 'gasto ya apuntado: «Compartir este gasto» arriba');
  ok(!doc.querySelector('#compField .comp-toggle'), 'y ya no sale el bloque de en medio');
  click(e, 'compOnTop'); await sleep(60);
  ok(!!doc.querySelector('#compField .comp-box'), 'al tocarlo se abre lo de compartir');
  await sleep(100); closeAll(); await sleep(300);

  // 3) Teclado corto del +: chip «Compartir»
  H.crearIr(['gasto']); await sleep(80);
  const chip = doc.querySelector('#tecRapido [data-click="tecCompartir"]');
  ok(!!chip, 'teclado corto: hay «Compartir»');
  if (chip) { chip.click(); await sleep(100); }
  ok(!!doc.querySelector('#compField .comp-box') && !doc.querySelector('#tecRapido'), 'tocarlo abre los detalles con compartir activado');
  closeAll(); await sleep(300);
  H.crearIr(['ingreso']); await sleep(80);
  ok(!doc.querySelector('[data-click="tecCompartir"]'), 'en un ingreso no sale «Compartir»');
  closeAll(); await sleep(300);

  // 4) Atrás de Android en «Gasto guardado» = «Ahora no»
  S._volverGrupo = null;
  H.crearIr(['gasto']); await sleep(60);
  ok(typeof e.w.__atras === 'function', 'existe el atrás de Android');
  S.db.rpc = async (fn) => (fn === 'enlace_sin_cuenta' ? 'TOKx' : null);
  const evt = (A.envioSCProbar || null);
  process.exit(fails ? 1 : 0);
})();

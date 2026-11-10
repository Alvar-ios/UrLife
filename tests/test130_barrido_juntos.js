// Calidad · barrido 08/11/2026: Juntos → cerrar un grupo y salir de él (doble toque, mensajes claros). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
(async () => {
  const e = makeEnv({ cfg: { app: { nombre: 'Lucía' }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, toast = () => (doc.querySelector('#toast .toast-txt') || {}).textContent || '';
  const rpcs = []; let fallo = null;
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm, rol) => ({ user_id: u, nombre: nm, rol: rol || 'miembro' });
  const grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [m('uYo', 'Lucía', 'admin'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía', 'admin'), m('uA', 'Ana')] }];
  S.grupos = grupos; S.compartidos = [{ id: 'k1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Compra', importe: 40, pagadoPor: 'uYo', reparto: { uYo: 20, uA: 20 }, modo: 'igual', creadoPor: 'uYo', createdAt: '2026-11-01T10:00:00Z', fecha: '2026-11-01' }];
  S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.db = Object.assign(S.db || {}, {
    grupos: { listar: async () => ({ grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo' }], miembros: [{ grupo_id: 'g1', user_id: 'uYo', nombre: 'Lucía', rol: 'admin' }, { grupo_id: 'g1', user_id: 'uA', nombre: 'Ana', rol: 'miembro' }], sinCuenta: [] }), invitaciones: async () => [] },
    rpc: async (fn, p) => { rpcs.push(fn); if (fallo && fn === fallo[0]) throw new Error(fallo[1]); return null; },
    compartidos: Object.assign({}, (S.db && S.db.compartidos) || {}),
  });
  const abrirAjustes = async () => { H.grupoVer(['g1']); await sleep(30); H.grupoAjustes(['g1']); await sleep(20); };

  // 1) Cerrar el grupo con cuentas pendientes: el servidor dice «saldo_pendiente»
  await abrirAjustes();
  let bC = doc.querySelector('#sheetHost [data-click^="grupoCerrar"]');
  ok(!!bC, 'Ajustes del grupo (admin): está «Cerrar el grupo para todos»');
  fallo = ['cerrar_grupo', 'saldo_pendiente'];
  if (bC) { bC.click(); await sleep(10); ok(rpcs.indexOf('cerrar_grupo') < 0, 'Cerrar grupo: el primer toque solo pide confirmar'); bC.click(); await sleep(60); }
  ok(rpcs.indexOf('cerrar_grupo') >= 0, 'Cerrar grupo: el segundo toque lo pide al servidor');
  ok(/pendiente|saldad|deb/i.test(toast()) && !/conexión/i.test(toast()), 'Cerrar grupo con deudas: el aviso explica que hay que saldar antes');

  // 2) Salir del grupo: doble toque
  rpcs.length = 0; fallo = null; await sleep(300); await abrirAjustes();
  const bS = doc.querySelector('#sheetHost [data-click^="grupoSalir"]');
  ok(!!bS, 'Ajustes del grupo: está «Salir del grupo»');
  if (bS) { bS.click(); await sleep(10); ok(rpcs.indexOf('salir_grupo') < 0, 'Salir: el primer toque solo pide confirmar'); bS.click(); await sleep(60); }
  ok(rpcs.indexOf('salir_grupo') >= 0 && /Has salido del grupo/.test(toast()), 'Salir: el segundo toque sale y lo dice');

  // 3) Sin conexión: el aviso lo dice en español sencillo y no cambia nada en pantalla
  rpcs.length = 0; fallo = ['salir_grupo', 'Failed to fetch']; await sleep(300); await abrirAjustes();
  const bS2 = doc.querySelector('#sheetHost [data-click^="grupoSalir"]'); bS2.click(); bS2.click(); await sleep(60);
  ok(/conexión/i.test(toast()), 'Salir sin conexión: avisa de revisar la conexión');
  ok((S.grupos || []).some((g) => g.id === 'g1'), 'Salir sin conexión: el grupo sigue en la lista');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

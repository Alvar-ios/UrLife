// Calidad (29/10): casos límite de «Con» y «te ha encargado». Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0, avisos = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const aviso = (c, m) => { console.log((c ? 'PASS ' : 'AVISO ') + m); if (!c) avisos++; };
console.error = () => {};
const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), hoy = iso(d);
const m = (u, nm, x) => Object.assign({ user_id: u, nombre: nm, rol: 'miembro' }, x || {});
async function base(grupos, agenda) {
  const e = makeEnv({ version: { agenda: 0, tu: 0, crear: 0, inicio: 0 }, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, S = A.S; S.user = Object.assign({}, S.user, { id: 'uYo' });
  S.grupos = grupos; S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = []; S.agenda = agenda;
  const log = { rpc: [], crear: [] };
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => grupos, invitaciones: async () => [] }, rpc: async (fn, p) => { log.rpc.push([fn, p]); return null; },
    agenda: { suscribir: () => () => {}, crear: async (o) => { log.crear.push(o); return Object.assign({ id: 'n' + log.crear.length, creadoPor: 'uYo', createdAt: new Date().toISOString(), hechaEn: null }, o); }, editar: async (id, o) => o, borrar: async () => [], restaurar: async () => null } });
  return { e, A, S, H: A.H, log, sh: () => e.doc.querySelector('#sheetHost'), c: () => e.doc.querySelector('#content'), toast: () => (e.doc.querySelector('#toast') || {}).textContent || '' };
}
(async () => {
  const piso = () => ({ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uB', 'Bea'), m('pX', 'Tío Paco', { sinCuenta: true })], todos: [m('uYo', 'Lucía'), m('uB', 'Bea'), m('pX', 'Tío Paco', { sinCuenta: true })] });
  // 1) usuario sin grupos: no sale «Con»; la tarea personal se guarda como siempre
  { const t = await base([], []); t.H.goTab(['agenda']); t.A.render(); await sleep(10); t.H.planNuevo([hoy]); await sleep(5); t.H.planTipo(['tarea']); await sleep(5);
    ok(t.sh().querySelector('#tNombre') && !t.sh().querySelector('.plan-con'), 'sin grupos: tarea personal sin «Con»');
    t.A.render(); await sleep(10); ok(!/te ha encargado|cosas nuevas/.test(t.c().textContent), 'sin grupos: nada de encargos'); }
  // 2) personas sin cuenta no salen como «persona» para crear directo
  { const t = await base([piso()], []); t.H.planNuevo([hoy]); await sleep(5); t.H.planTipo(['tarea']); await sleep(5);
    const con = t.sh().querySelector('.plan-con').textContent; ok(/Bea/.test(con) && !/Tío Paco/.test(con), '«Con»: personas sin cuenta no se ofrecen'); }
  // 3) crear_directo falla: no se crea la tarea, hoja abierta, mensaje claro
  { const t = await base([piso()], []); t.S.db.rpc = async (fn) => { t.log.rpc.push([fn]); throw new Error('sin conexión'); };
    t.H.planNuevo([hoy]); await sleep(5); t.H.planTipo(['tarea']); await sleep(5); t.sh().querySelector('#tNombre').value = 'Sacar al perro'; t.H.tfCon(['u:uB']); await sleep(5);
    await t.H.planGuardar([]); await sleep(20);
    ok(t.log.crear.length === 0 && t.sh().querySelector('#pTitulo') && t.sh().querySelector('#pTitulo').value === 'Sacar al perro', 'crear_directo falla: no se crea nada y lo escrito sigue ahí');
    ok(/No se ha podido compartir/.test(t.toast()), 'crear_directo falla: mensaje «No se ha podido compartir…» (' + t.toast() + ')');
    // segundo intento ya funciona
    t.S.db.rpc = async (fn, p) => { t.log.rpc.push([fn, p]); return 'gD'; }; await t.H.planGuardar([]); await sleep(20);
    ok(t.log.crear.length === 1 && t.log.crear[0].grupoId === 'gD', 'reintento: se crea una sola tarea'); }
  // 4) el directo se crea pero la tarea falla: ¿reintento duplica el espacio?
  { const t = await base([piso()], []); let n = 0; t.S.db.rpc = async (fn, p) => { t.log.rpc.push([fn, p]); return 'gD'; };
    t.S.db.agenda.crear = async (o) => { n++; if (n === 1) throw new Error('fallo de red'); t.log.crear.push(o); return Object.assign({ id: 'z', creadoPor: 'uYo', createdAt: new Date().toISOString() }, o); };
    t.H.planNuevo([hoy]); await sleep(5); t.H.planTipo(['tarea']); await sleep(5); t.sh().querySelector('#tNombre').value = 'Regar'; t.H.tfCon(['u:uB']); await sleep(5);
    await t.H.planGuardar([]); await sleep(20);
    ok(t.log.crear.length === 0 && t.sh().querySelector('#pTitulo'), 'tarea falla tras crear el espacio: la hoja sigue abierta');
    await t.H.planGuardar([]); await sleep(20);
    ok(t.log.crear.length === 1, 'reintento: una sola tarea');
    console.log('INFO llamadas a crear_directo tras fallo + reintento: ' + t.log.rpc.filter((r) => r[0] === 'crear_directo').length + ' (la RPC debe devolver el mismo espacio si ya existe)'); }
  // 5) «Solo yo» en el formulario compartido vuelve a la tarea personal con el título
  { const t = await base([piso()], []); t.H.planNuevo([hoy]); await sleep(5); t.H.planTipo(['tarea']); await sleep(5); t.sh().querySelector('#tNombre').value = 'Pintar'; t.H.tfCon(['g:g1']); await sleep(5);
    t.H.planCon(['yo']); await sleep(5); ok(t.sh().querySelector('#tNombre') && t.sh().querySelector('#tNombre').value === 'Pintar', '«Solo yo» vuelve a la tarea personal con lo escrito'); }
  // 6) alias: tarea encargada a una persona sin cuenta que ya soy yo (reclamada)
  { const g = piso(); g.alias = { pX: 'uYo' };
    const t = await base([g], [{ id: 'a1', grupoId: 'g1', tipo: 'tarea', titulo: 'Bajar la basura', fecha: null, asignadoA: 'pX', hechaEn: null, creadoPor: 'uB', createdAt: '2026-10-29T10:00:00Z' }]);
    t.H.goTab(['inicio']); t.S.pendTodos = true; t.A.render(); await sleep(20);
    ok(/Bajar la basura/.test(t.c().textContent) && /Te lo encarga Bea/.test(t.c().textContent), 'alias: lo encargado a mi «persona sin cuenta» reclamada me sale a mí'); }
  // 7) yo me lo encargo a mí mismo: no sale como «te ha encargado»
  { const t = await base([piso()], [{ id: 'a2', grupoId: 'g1', tipo: 'tarea', titulo: 'Mío', fecha: null, asignadoA: 'uYo', hechaEn: null, creadoPor: 'uYo', createdAt: '2026-10-29T10:00:00Z' }]);
    t.H.goTab(['inicio']); t.A.render(); await sleep(20); ok(!/Te lo encarga/.test(t.c().textContent), 'lo que me apunto yo no sale como encargo'); }
  // 8) título con < > no rompe la fila
  { const t = await base([piso()], [{ id: 'a3', grupoId: 'g1', tipo: 'tarea', titulo: '<b>x</b> & co', fecha: null, asignadoA: 'uYo', hechaEn: null, creadoPor: 'uB', createdAt: '2026-10-29T10:00:00Z' }]);
    t.H.goTab(['inicio']); t.A.render(); await sleep(20); ok(/<b>x<\/b> & co/.test(t.c().textContent) && !t.c().querySelector('.dia-t b b'), 'título con símbolos se escapa bien'); }
  // 9) reloj del móvil adelantado 1 hora: ¿se pierde lo que llega después?
  { const t = await base([piso()], [{ id: 'a4', grupoId: 'g1', tipo: 'tarea', titulo: 'Uno', fecha: null, asignadoA: 'uYo', hechaEn: null, creadoPor: 'uB', createdAt: new Date(Date.now() - 60000).toISOString() }]);
    const real = t.e.w.Date.now; const RD = t.e.w.Date; const off = 3600000;
    t.e.w.Date = class extends RD { constructor(...a) { if (a.length) super(...a); else super(real.call(RD) + off); } static now() { return real.call(RD) + off; } };
    t.H.goTab(['agenda']); t.A.render(); await sleep(20); t.e.w.Date = RD;
    t.S.agenda.push({ id: 'a5', grupoId: 'g1', tipo: 'tarea', titulo: 'Dos llega luego', fecha: null, asignadoA: 'uYo', hechaEn: null, creadoPor: 'uB', createdAt: new Date(Date.now() + 5 * 60000).toISOString() });
    t.H.goTab(['inicio']); t.A.render(); await sleep(20);
    aviso(/Dos llega luego/.test(t.c().textContent) && /Te lo encarga/.test(t.c().textContent), 'reloj del móvil 1 h adelantado: un encargo que llega 5 min después sigue saliendo como nuevo'); }
  console.log(fails ? 'FAILED ' + fails : 'ALL OK' + (avisos ? ' (avisos: ' + avisos + ')' : '')); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

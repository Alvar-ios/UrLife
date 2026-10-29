// 29/10 (docs/24 §3, tanda 1): «te ha encargado» en Inicio, «Recordárselo» por WhatsApp, «Encargadas a otros» y «Lo añadiste tú». Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), hoy = iso(d);
const mas = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return iso(x); };
(async () => {
  const e = makeEnv({ version: { agenda: 0, tu: 0, crear: 0, inicio: 0 }, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S, sh = () => doc.querySelector('#sheetHost'), c = () => doc.querySelector('#content');
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm) => ({ user_id: u, nombre: nm, rol: 'miembro' });
  S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana García'), m('uB', 'Bea')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana García'), m('uB', 'Bea')] }];
  S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.agenda = [
    { id: 'c1', grupoId: 'g1', tipo: 'tarea', titulo: 'Bajar el cartón', fecha: mas(2), asignadoA: 'uYo', hechaEn: null, creadoPor: 'uA', createdAt: '2026-10-29T10:00:00Z' },
    { id: 'c2', grupoId: 'g1', tipo: 'tarea', titulo: 'Comprar bombillas', fecha: mas(3), asignadoA: 'uB', hechaEn: null, creadoPor: 'uYo', createdAt: '2026-10-29T10:00:00Z' },
    { id: 'c3', grupoId: 'g1', tipo: 'tarea', titulo: 'Llamar al casero', fecha: mas(9), asignadoA: 'uA', hechaEn: null, creadoPor: 'uB', createdAt: '2026-10-29T10:00:00Z' }];
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null,
    agenda: { suscribir: () => () => {}, crear: async (o) => o, editar: async (id, o) => o, borrar: async () => [], restaurar: async () => null } });
  H.goTab(['inicio']); S.pendTodos = true; A.render(); await sleep(20);
  const filas = [...c().querySelectorAll('.dia-fila')].filter((f) => /Bajar el cartón/.test(f.textContent));
  ok(filas.length === 1 && /Te lo encarga Ana García/.test(filas[0].textContent) && /Piso/.test(filas[0].textContent), 'Inicio: «Ana te ha encargado…», una sola vez');
  // abrir la Agenda lo da por visto
  H.goTab(['agenda']); A.render(); await sleep(30);
  ok(S.config.agendaVisto, 'abrir la Agenda guarda que ya lo viste');
  H.goTab(['inicio']); A.render(); await sleep(20);
  ok(!/Te lo encarga/.test(c().textContent), 'ya visto: no vuelve a salir como nuevo');
  // dos nuevas → una sola fila
  S.agenda.push({ id: 'c4', grupoId: 'g1', tipo: 'tarea', titulo: 'Pagar la luz', fecha: null, asignadoA: 'uYo', hechaEn: null, creadoPor: 'uB', createdAt: '2099-01-01T00:00:00Z' },
    { id: 'c5', grupoId: 'g1', tipo: 'tarea', titulo: 'Regar', fecha: null, asignadoA: 'uYo', hechaEn: null, creadoPor: 'uA', createdAt: '2099-01-01T00:00:00Z' }); A.render(); await sleep(20);
  ok(/2 tareas nuevas para ti/.test(c().textContent), 'varias nuevas: una sola fila «2 tareas nuevas para ti»');
  // Encargadas a otros
  H.goTab(['agenda']); A.render(); await sleep(20);
  ok(/Encargadas a otros · 1/.test(c().textContent) && !/Comprar bombillas/.test(c().textContent), 'Agenda: «Encargadas a otros · 1», plegado');
  H.agendaMas(['encargadas']); await sleep(20);
  ok(/Comprar bombillas/.test(c().textContent) && !/Llamar al casero/.test(c().textContent), 'desplegado: solo lo que encargaste tú');
  // Recordárselo
  H.planVer(['c2']); await sleep(10);
  const wa = sh().querySelector('a.plan-recordar');
  ok(wa && /Recordárselo a Bea/.test(wa.textContent) && /wa\.me/.test(wa.getAttribute('href')) && /te%20recuerdo%3A%20Comprar%20bombillas/.test(wa.getAttribute('href')), '«Recordárselo a Bea» abre WhatsApp con el mensaje');
  ok(/Lo añadiste tú/.test(sh().textContent) && !/Lo añadió tú/.test(sh().textContent), '«Lo añadiste tú»');
  H.planVer(['c1']); await sleep(10);
  ok(!sh().querySelector('a.plan-recordar') && /Lo añadió Ana García/.test(sh().textContent), 'si te toca a ti, no hay «Recordárselo»');
  // compartir con una persona sin «directo»: se crea al guardar
  const creados = [], rpcs = [];
  S.db.rpc = async (fn, p) => { rpcs.push([fn, p]); return fn === 'crear_directo' ? 'gD' : null; };
  S.db.agenda.crear = async (o) => { creados.push(o); return Object.assign({ id: 'n1', creadoPor: 'uYo', createdAt: new Date().toISOString(), hechaEn: null }, o); };
  H.closeSheet([]); await sleep(400); H.planNuevo([hoy]); await sleep(10); H.planTipo(['tarea']); await sleep(10);
  ok(/Con/.test(sh().textContent) && /Solo yo/.test(sh().querySelector('.plan-con').textContent) && /Piso/.test(sh().querySelector('.plan-con').textContent) && /Bea/.test(sh().querySelector('.plan-con').textContent), 'la tarea de siempre tiene «Con»: Solo yo, grupos y personas');
  sh().querySelector('#tNombre').value = 'Sacar al perro'; H.tfCon(['u:uB']); await sleep(10);
  ok(/Nueva tarea compartida/.test(sh().textContent) && sh().querySelector('#pTitulo').value === 'Sacar al perro', 'al elegir a Bea pasa a «Nueva tarea compartida» con lo escrito');
  ok(/Quien pueda/.test(sh().textContent) && /Tú/.test(sh().querySelector('.plan-quien').textContent) && /Bea/.test(sh().querySelector('.plan-quien').textContent), 'con una persona: Quien pueda · Tú · Bea');
  H.planQuien(['uB']); await sleep(10);
  ok(/Bea lo verá arriba en su Inicio/.test(sh().textContent), 'aviso de que Bea lo verá en su Inicio');
  await H.planGuardar([]); await sleep(30);
  ok(rpcs.some((r) => r[0] === 'crear_directo' && r[1].p_user === 'uB') && creados[0] && creados[0].grupoId === 'gD' && creados[0].asignadoA === 'uB' && creados[0].titulo === 'Sacar al perro', 'al guardar se crea vuestro espacio y la tarea va ahí, encargada a Bea');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

// 30/10 (docs/24 §4): compartir mi agenda — permisos, «Privada», la agenda de otros encima de la mía. Datos inventados.
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
  S.grupos = [{ id: 'g1', nombre: 'Familia', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana'), m('uB', 'Bea')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana'), m('uB', 'Bea')] }];
  S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.agenda = [{ id: 'p1', grupoId: null, tipo: 'plan', titulo: 'Dentista', fecha: mas(3), creadoPor: 'uYo', createdAt: '2026-10-20T10:00:00Z' }];
  const llamadas = { crear: [], editar: [], borrar: [], deOtro: [] }, agCreados = [];
  let perms = [];
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null,
    agenda: { suscribir: () => () => {}, crear: async (o) => { agCreados.push(o); return Object.assign({ id: 'n' + agCreados.length, creadoPor: 'uYo', createdAt: new Date().toISOString() }, o); }, editar: async (id, o) => o, borrar: async () => [], restaurar: async () => null },
    agendaPermisos: { listar: async () => perms.slice(), ocultas: async () => [], conmigo: async () => [{ persona: 'uA', nivel_planes: 'titulos', nivel_tareas: 'titulos' }],
      crear: async (o) => { llamadas.crear.push(o); const p = { id: 'perm' + llamadas.crear.length, aUsuario: o.aUsuario || null, aGrupo: o.aGrupo || null, nivel: o.nivel, planes: true, tareas: true }; perms.push(p); return p; },
      editar: async (id, o) => { llamadas.editar.push([id, o]); return Object.assign({}, perms.find((x) => x.id === id), o); },
      borrar: async (id) => { llamadas.borrar.push(id); perms = perms.filter((x) => x.id !== id); return null; },
      deOtro: async (p, desde, hasta) => { llamadas.deOtro.push([p, desde, hasta]); return [{ clave: 'k1', tipo: 'plan', fecha: hoy, fecha_fin: null, hora: '19:00:00', titulo: 'Pádel', lugar: null, nota: null, nivel: 'titulos' }, { clave: 'k2', tipo: 'plan', fecha: hoy, fecha_fin: null, hora: '21:00:00', titulo: null, lugar: null, nota: null, nivel: 'ocupado' }]; },
      ocultar: async () => null, mostrar: async () => null } });
  // desde la propia Agenda, si aún no la compartes
  H.goTab(['agenda']); A.S.agendaDia = hoy; A.render(); await sleep(60); A.render(); await sleep(20);
  const bt = c().querySelector('.agc-compartir');
  ok(bt && /Compartir mi agenda/.test(bt.textContent) && /agcAbrir/.test(bt.getAttribute('data-click')), 'la Agenda tiene «Compartir mi agenda» si aún no la compartes');
  // Tú → Compartir mi agenda
  H.goTab(['tu']); await sleep(20);
  ok(doc.querySelector('[data-click^="agcAbrir"]'), 'Tú tiene «Compartir mi agenda»');
  await H.agcAbrir([]); await sleep(20);
  ok(/Nadie\. Tu agenda es solo tuya/.test(sh().textContent) && /Te enseñan la suya/.test(sh().textContent) && /Ana/.test(sh().textContent), 'por defecto nadie la ve; Ana te enseña la suya');
  H.agcVista(['elegir']); await sleep(5);
  ok(/Bea/.test(sh().textContent) && /Familia/.test(sh().textContent) && /quien entre después/.test(sh().textContent), 'elegir: personas y grupos (aviso de quien entre después)');
  H.agcElegir(['u:uB']); await sleep(5);
  ok(/Compartir con Bea/.test(sh().textContent) && sh().querySelector('.av-op.on') && /Solo los huecos ocupados/.test(sh().querySelector('.av-op.on').textContent) && /verá/.test(sh().textContent), 'nuevo: «Solo los huecos ocupados» de inicio y cuántas cosas verá');
  H.agcNivelNuevo(['titulos']); await H.agcCrear([]); await sleep(10);
  ok(llamadas.crear[0] && llamadas.crear[0].aUsuario === 'uB' && llamadas.crear[0].nivel === 'titulos' && /La ven/.test(sh().textContent) && sh().querySelector('.agc-perm'), 'compartir con Bea (solo títulos) y sale en «La ven»');
  await H.agcNivel(['perm1', 'todo']); await sleep(5);
  ok(llamadas.editar[0] && llamadas.editar[0][1].nivel === 'todo', 'cambiar lo que ve');
  H.closeSheet([]); await sleep(400);
  // Privada en la tarea
  A.openTareaForm(null, {}); await sleep(10);
  ok(/¿Quién lo ve\?/.test(sh().textContent) && /Visible/.test(sh().textContent), 'la tarea tiene «¿Quién lo ve?» porque compartes');
  sh().querySelector('#tNombre').value = 'Revisión médica'; H.privadaPoner(['tPrivada', '1']); await sleep(5);
  ok(/solo la ves tú/.test(sh().textContent), 'Privada explica que solo la ves tú');
  await H.saveTarea([]); await sleep(30);
  const t = Object.values(e.store.tareas || {}).find((x) => x.nombre === 'Revisión médica');
  ok(t && t.privada === true, 'la tarea se guarda privada');
  // plan «Solo yo» privado
  H.planNuevo([hoy]); await sleep(10); sh().querySelector('#pTitulo').value = 'Cita'; H.planPrivada(['pPrivada', '1']); await sleep(5); await H.planGuardar([]); await sleep(20);
  ok(agCreados[0] && agCreados[0].privada === true && agCreados[0].grupoId === null, 'un plan «Solo yo» puede ser privado');
  // la agenda de Ana encima de la mía
  H.goTab(['agenda']); A.S.agendaDia = hoy; A.render(); await sleep(60); A.render(); await sleep(20);
  ok(c().querySelector('.agc-caras') && /Ana/.test(c().querySelector('.agc-caras').textContent) && /La ven Bea/.test(c().textContent), 'Agenda: caras (Yo, Ana) y «La ven Bea»');
  const filas = [...c().querySelectorAll('.agc-fila')];
  ok(filas.length === 2 && /Pádel/.test(filas[0].textContent) && /Ana · 19:00/.test(filas[0].textContent) && filas[1].classList.contains('ocupada') && /Hueco ocupado/.test(filas[1].textContent), 'lo de Ana del día, y lo «ocupado» rayado');
  ok(llamadas.deOtro.length && (new Date(llamadas.deOtro[0][2]) - new Date(llamadas.deOtro[0][1])) / 864e5 <= 92, 'se pide como mucho 92 días');
  H.agcVer(['uA', 'k1']); await sleep(5);
  ok(/Pádel/.test(sh().textContent) && /Solo puedes mirarla/.test(sh().textContent) && !sh().querySelector('[data-click^="planEditar"]'), 'la hoja de lo de otro es solo para mirar');
  H.closeSheet([]); await sleep(400);
  H.agcCapa(['uA']); await sleep(20);
  ok(!c().querySelector('.agc-fila') && S.config.agendaCapas.uA === false, 'apagar a Ana la quita de tu Agenda');
  H.agcCapa(['uA']); await sleep(20);
  // dejar de compartir
  await H.agcAbrir([]); await sleep(20); await H.agcQuitar(['perm1']); await sleep(10);
  ok(llamadas.borrar[0] === 'perm1' && /Nadie\. Tu agenda es solo tuya/.test(sh().textContent), 'dejar de compartir');
  // si falla la carga: aviso y reintentar, nunca «Nadie»; y «Privada» sigue disponible
  H.closeSheet([]); await sleep(400);
  S.db.agendaPermisos.listar = async () => { throw new Error('sin conexión (prueba)'); };
  await H.agcAbrir([]); await sleep(20);
  ok(/No se ha podido cargar/.test(sh().textContent) && !/Nadie\. Tu agenda es solo tuya/.test(sh().textContent), 'si falla la carga, lo dice y deja reintentar');
  H.closeSheet([]); await sleep(400); A.openTareaForm(null, {}); await sleep(10);
  ok(/¿Quién lo ve\?/.test(sh().textContent), 'con error de carga, «Privada» sigue a mano');
  // compartir dos veces con la misma persona
  S.db.agendaPermisos.listar = async () => perms.slice(); S.db.agendaPermisos.crear = async () => { const er = new Error('duplicate key value violates unique constraint "agenda_permisos_una_persona"'); er.code = '23505'; throw er; };
  H.closeSheet([]); await sleep(400); await H.agcAbrir([]); await sleep(10); H.agcVista(['elegir']); H.agcElegir(['u:uB']); await H.agcCrear([]); await sleep(20);
  ok(/Ya la compartes/.test(doc.querySelector('#toast').textContent), 'compartir dos veces: «Ya la compartes…»');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

// Planes (23/10/2026, docs/16 apartado 2): planes y tareas compartidas en la Agenda, en el grupo y en «Estos días». Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), hoy = iso(d);
const mas = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return iso(x); };
(async () => {
  const e = makeEnv({ version: { agenda: 0, tu: 0, crear: 0 }, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S, sh = () => doc.querySelector('#sheetHost'), c = () => doc.querySelector('#content');
  const creados = [], editados = [], rpcs = [];
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm) => ({ user_id: u, nombre: nm, rol: 'miembro' });
  S.grupos = [{ id: 'g1', nombre: 'Pádel', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana'), m('uB', 'Bea')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana'), m('uB', 'Bea')] }];
  S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.agenda = [
    { id: 'p1', grupoId: 'g1', tipo: 'plan', titulo: 'Cena de cumple de Ana', fecha: hoy, hora: '21:30:00', lugar: 'Casa Pepe', nota: null, creadoPor: 'uA', createdAt: '2026-10-20T10:00:00Z' },
    { id: 'p2', grupoId: null, tipo: 'plan', titulo: 'Dentista', fecha: mas(1), hora: null, creadoPor: 'uYo', createdAt: '2026-10-20T10:00:00Z' },
    { id: 'p3', grupoId: 'g1', tipo: 'plan', titulo: 'Viaje a Roma', fecha: mas(5), fechaFin: mas(7), hora: null, creadoPor: 'uYo', createdAt: '2026-10-20T10:00:00Z' },
    { id: 'c1', grupoId: 'g1', tipo: 'tarea', titulo: 'Reservar pista', fecha: hoy, asignadoA: 'uYo', hechaEn: null, creadoPor: 'uA', createdAt: '2026-10-20T10:00:00Z' },
    { id: 'c2', grupoId: 'g1', tipo: 'tarea', titulo: 'Comprar bolas', fecha: hoy, asignadoA: 'uB', hechaEn: null, creadoPor: 'uA', createdAt: '2026-10-20T10:00:00Z' }];
  S.db = Object.assign(S.db || {}, {
    grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] },
    rpc: async (fn, p) => { rpcs.push([fn, p]); return null; },
    agenda: { suscribir: () => () => {}, crear: async (o) => { creados.push(o); return Object.assign({ id: 'n' + creados.length, creadoPor: 'uYo', createdAt: new Date().toISOString(), hechaEn: null }, o); },
      editar: async (id, o) => { editados.push([id, o]); return Object.assign({}, S.agenda.find((x) => x.id === id), o); }, borrar: async () => [{ id: 'x' }], restaurar: async () => null },
  });
  // Agenda
  H.goTab(['agenda']); A.S.agendaDia = hoy; A.render(); await sleep(20);
  const t = c().textContent;
  ok(c().querySelector('.plan-fila') && /Cena de cumple de Ana/.test(t) && /21:30/.test(t), 'Agenda: el plan de hoy con su baldosa y la hora');
  ok(/Reservar pista/.test(t) && !/Comprar bolas/.test(t), 'las tareas del grupo que son tuyas salen; las de otra persona, no');
  ok(c().querySelector('[data-click^="planNuevo"]'), 'junto al día, «+ Plan»');
  // Estos días
  H.goTab(['inicio']); await sleep(20);
  H.verPendiente && H.verPendiente([]); await sleep(10);
  ok(/Cena de cumple de Ana/.test(c().textContent) && /Dentista/.test(c().textContent), '«Estos días»: el plan de hoy y el de mañana (aviso «el día antes»)');
  ok(!/Viaje a Roma/.test(c().textContent), 'el viaje dentro de 5 días aún no sale (aviso «el día antes»)');
  // nuevo plan desde el + → Tarea | Plan
  A.openTareaForm ? A.openTareaForm(null, {}) : H.crearIr(['tarea']); await sleep(20);
  ok(sh().querySelector('.plan-tipo') && /Plan/.test(sh().querySelector('.plan-tipo').textContent), 'el formulario de tarea tiene «Tarea | Plan» al crear');
  sh().querySelector('#tNombre').value = 'Cine';
  H.tfAPlan([]); await sleep(20);
  ok(/Nuevo plan/.test(sh().textContent) && sh().querySelector('#pTitulo').value === 'Cine', '«Plan» lleva al formulario de plan con lo ya escrito');
  H.planHoraModo(['hora']); await sleep(10); sh().querySelector('#pHora').value = '19:00';
  sh().querySelector('#pLugar').value = 'Kinépolis';
  H.planCon(['g:g1']); await sleep(10);
  ok(/lo verán todos/.test(sh().textContent), 'con un grupo: «lo verán todos»');
  H.planAviso(['semana']); await sleep(10);
  await H.planGuardar([]); await sleep(30);
  ok(creados[0] && creados[0].tipo === 'plan' && creados[0].grupoId === 'g1' && creados[0].hora === '19:00' && creados[0].lugar === 'Kinépolis' && creados[0].titulo === 'Cine', 'se guarda el plan con grupo, hora y lugar');
  ok(e.store.cfg.app.agendaAvisos && e.store.cfg.app.agendaAvisos.n1 === 'semana', '«Avisarme» se guarda solo para ti (en tu configuración)');
  // plan «Solo yo» sin fecha no deja guardar
  H.planNuevo([hoy]); await sleep(10); H.planFecha(['']); await sleep(5); sh().querySelector('#pTitulo').value = 'X';
  await H.planGuardar([]); await sleep(10);
  ok(creados.length === 1, 'un plan sin día no se guarda');
  // hoja del plan
  H.planVer(['p1']); await sleep(10);
  ok(/Casa Pepe/.test(sh().textContent) && sh().querySelector('a[href*="google.com/maps"]') && /Lo añadió Ana/.test(sh().textContent), 'hoja del plan: lugar con «Abrir en Mapas» y quién lo añadió');
  ok(/Añadir a mi calendario/.test(sh().textContent) && /Ocultar de mi agenda/.test(sh().textContent), 'y «Añadir a mi calendario» y «Ocultar de mi agenda»');
  H.planOcultar(['p1']); await sleep(20);
  H.goTab(['agenda']); await sleep(10);
  ok(!/Cena de cumple de Ana/.test(c().textContent), 'oculto: ya no sale en tu agenda');
  // grupo: pestaña Planes
  H.grupoVer(['g1']); await sleep(30); H.grupoTab(['planes']); await sleep(20);
  ok(/Próximos/.test(sh().textContent) && /Viaje a Roma/.test(sh().textContent) && /Tareas · 2 por hacer/.test(sh().textContent), 'grupo → Planes: próximos y «Tareas · 2 por hacer»');
  ok(/Cena de cumple de Ana/.test(sh().textContent), 'en el grupo se ve aunque lo ocultaras de tu agenda');
  await H.tareaCHecha(['c2', '1']); await sleep(20);
  ok(rpcs.some(([fn, p]) => fn === 'agenda_hecha' && p.p_id === 'c2' && p.p_hecha === true) && /Tareas · 1 por hacer/.test(sh().textContent), 'cualquiera puede marcar hecha una tarea del grupo');
  H.planGrupoNuevo(['g1', 'tarea']); await sleep(20);
  ok(/Nueva tarea compartida/.test(sh().textContent) && sh().querySelector('.plan-quien') && /Quien pueda/.test(sh().textContent), 'nueva tarea del grupo: «¿Quién se encarga?» con «Quien pueda»');
  sh().querySelector('#pTitulo').value = 'Llevar agua'; H.planQuien(['uA']); await sleep(5);
  await H.planGuardar([]); await sleep(30);
  ok(creados[1] && creados[1].tipo === 'tarea' && creados[1].asignadoA === 'uA' && creados[1].grupoId === 'g1' && !creados[1].hora, 'se guarda la tarea con su encargada');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

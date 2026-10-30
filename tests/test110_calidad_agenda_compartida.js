// Calidad 30/10 (docs/24 §4): compartir mi agenda — privacidad, sin red, sin permisos, rendimiento. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), hoy = iso(d);
const mas = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return iso(x); };
function montar(op) {
  op = op || {};
  const e = makeEnv({ version: { agenda: 0, tu: 0, crear: 0, inicio: 0 }, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  return sleep(80).then(() => {
    const A = e.w.__APP__, S = A.S; S.user = Object.assign({}, S.user, { id: 'uYo' });
    const m = (u, nm) => ({ user_id: u, nombre: nm, rol: 'miembro' });
    S.grupos = [{ id: 'g1', nombre: 'Familia', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana')] }];
    S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = [];
    S.agenda = op.agenda || [];
    const L = { deOtro: 0, editar: [], crear: [] };
    S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin red'); }, invitaciones: async () => [] }, rpc: async () => null,
      agenda: { suscribir: () => () => {}, crear: async (o) => { L.crear.push(o); return Object.assign({ id: 'n' + L.crear.length, creadoPor: 'uYo' }, o); }, editar: async (id, o) => { L.editar.push([id, o]); return Object.assign({}, S.agenda.find((x) => x.id === id), o); }, borrar: async () => [], restaurar: async () => null } });
    if (op.permisos !== false) S.db.agendaPermisos = Object.assign({ listar: async () => op.perms || [], ocultas: async () => [], conmigo: async () => op.conmigo || [],
      deOtro: async () => { L.deOtro++; if (op.deOtroFalla) throw new Error('sin red'); return op.items || []; }, crear: async () => null, editar: async () => null, borrar: async () => null, ocultar: async () => null, mostrar: async () => null }, op.db || {});
    return { e, A, S, H: A.H, L, sh: () => e.doc.querySelector('#sheetHost'), c: () => e.doc.querySelector('#content') };
  });
}
(async () => {
  // 1) Sin agendaPermisos (web en caché / sin la tabla): nada se rompe y no sale «¿Quién lo ve?»
  { const { e, A, H, sh, c } = await montar({ permisos: false });
    void 0;
    e.store.tareas.tp = { nombre: 'Secreto', categoria: '', prioridad: 'Media', estado: 'Pendiente', fechaLimite: hoy, comentario: '', fechaCreacion: hoy, repetir: null, privada: true }; A.S.tareas = [Object.assign({ id: 'tp' }, e.store.tareas.tp)];
    H.goTab(['agenda']); A.S.agendaDia = hoy; A.render(); await sleep(40);
    ok(c() && !c().querySelector('.agc-caras'), 'sin agendaPermisos: la Agenda se pinta sin caras');
    H.goTab(['tu']); await sleep(20);
    ok(!e.doc.querySelector('[data-click^="agcAbrir"]'), 'sin agendaPermisos: Tú no enseña «Compartir mi agenda»');
    await sleep(30); A.openTareaForm('tp'); await sleep(10);
    ok(!/¿Quién lo ve\?/.test(sh().textContent), 'sin agendaPermisos: no sale el campo');
    sh().querySelector('#tNombre').value = 'Secreto 2'; await H.saveTarea([]); await sleep(30);
    ok(e.store.tareas.tp.privada === true, 'editar una tarea privada sin el campo visible la deja privada'); }
  // 2) Falla la red al cargar permisos: la hoja y la Agenda siguen
  { const { A, H, sh, c } = await montar({ db: { listar: async () => { throw new Error('sin red'); }, conmigo: async () => { throw new Error('sin red'); } } });
    H.goTab(['agenda']); A.S.agendaDia = hoy; A.render(); await sleep(60);
    ok(c() && /Agenda|Hoy/.test(c().textContent), 'si falla la red, la Agenda sigue');
    await H.agcAbrir([]); await sleep(20);
    ok(/Compartir mi agenda/.test(sh().textContent) && !/Cargando/.test(sh().textContent), 'si falla la red, la hoja no se queda en «Cargando…»'); }
  // 3) Rendimiento: repintar muchas veces no pide agenda_de cada vez
  { const { A, H, L } = await montar({ conmigo: [{ persona: 'uA', nivel_planes: 'todo', nivel_tareas: 'todo' }], items: [{ clave: 'k1', tipo: 'plan', fecha: hoy, hora: null, titulo: 'Cine', nivel: 'todo' }] });
    H.goTab(['agenda']); A.S.agendaDia = hoy; A.render(); await sleep(60);
    const n0 = L.deOtro; for (let i = 0; i < 20; i++) A.render(); await sleep(60);
    ok(n0 >= 1 && L.deOtro === n0, 'repintar 20 veces no vuelve a pedir agenda_de (' + n0 + ' → ' + L.deOtro + ')'); }
  // 4) Rendimiento: si agenda_de falla, no se queda pidiéndola en bucle
  { const { A, H, L } = await montar({ deOtroFalla: true, conmigo: [{ persona: 'uA', nivel_planes: 'todo', nivel_tareas: 'todo' }] });
    H.goTab(['agenda']); A.S.agendaDia = hoy; A.render(); await sleep(300);
    ok(L.deOtro <= 3, 'si agenda_de falla, no se repite en bucle (llamadas en 0,3 s: ' + L.deOtro + ')'); }
  // 5) Persona sin nombre conocido
  { const { A, H, c } = await montar({ conmigo: [{ persona: 'uX', nivel_planes: 'titulos', nivel_tareas: 'titulos' }], items: [{ clave: 'k1', tipo: 'plan', fecha: hoy, hora: '10:00:00', titulo: '<b>x</b>', nivel: 'titulos' }] });
    H.goTab(['agenda']); A.S.agendaDia = hoy; A.render(); await sleep(80); A.render(); await sleep(20);
    const f = c().querySelector('.agc-fila');
    ok(f && /Alguien/.test(f.textContent) && !f.querySelector('b'), 'persona desconocida sale como «Alguien» y el título se escapa'); }
  // 6) Privada → Visible sin compartir nada: debe poder volverse visible
  { const { e, A, H, sh } = await montar({});
    e.store.tareas.tq = { nombre: 'Antes privada', categoria: '', prioridad: 'Media', estado: 'Pendiente', fechaLimite: hoy, comentario: '', fechaCreacion: hoy, repetir: null, privada: true }; A.S.tareas = [Object.assign({ id: 'tq' }, e.store.tareas.tq)];
    H.goTab(['agenda']); A.S.agendaDia = hoy; A.render(); await sleep(60);
    A.openTareaForm('tq'); await sleep(10);
    ok(/¿Quién lo ve\?/.test(sh().textContent), 'una tarea ya privada enseña el campo aunque no compartas');
    H.privadaPoner(['tPrivada', '']); await sleep(5);
    ok(/¿Quién lo ve\?/.test(sh().textContent), 'al pulsar «Visible» el campo no desaparece');
    await H.saveTarea([]); await sleep(30);
    ok(e.store.tareas.tq.privada === false, 'elegir «Visible» la vuelve visible (privada=' + e.store.tareas.tq.privada + ')'); }
  // 7) Completar, reabrir, borrar y recuperar una tarea privada: sigue privada
  { const { e, A, H } = await montar({});
    e.store.tareas.tr = { nombre: 'Privada X', categoria: '', prioridad: 'Media', estado: 'Pendiente', fechaLimite: hoy, comentario: '', fechaCreacion: hoy, repetir: null, privada: true }; A.S.tareas = [Object.assign({ id: 'tr' }, e.store.tareas.tr)];
    H.goTab(['agenda']); A.S.agendaDia = hoy; A.render(); await sleep(60);
    await A.toggleTarea('tr'); await sleep(30);
    ok(e.store.tareas.tr.estado === 'Completado' && e.store.tareas.tr.privada === true, 'completar deja la marca');
    await A.toggleTarea('tr'); await sleep(30);
    ok(e.store.tareas.tr.privada === true, 'reabrir deja la marca');
    A.openTareaForm('tr'); await sleep(10); const b = { getAttribute: () => '1' }; H.deleteTarea([], b); await sleep(40);
    ok(!e.store.tareas.tr, 'borrada');
    await A.H.papeleraRecuperar(['tarea', 'tr']); await sleep(30);
    ok(e.store.tareas.tr && e.store.tareas.tr.privada === true, 'recuperar de la papelera deja la marca'); }
  // 8) Planes: nunca mandar privada en planes de grupo; editar un «Solo yo» privado la conserva
  { const { A, H, L, sh } = await montar({ perms: [{ id: 'p1', aUsuario: 'uA', nivel: 'todo' }], agenda: [
      { id: 'gp', grupoId: 'g1', tipo: 'plan', titulo: 'Cena', fecha: mas(2), creadoPor: 'uYo', createdAt: '2026-10-20T10:00:00Z' },
      { id: 'yp', grupoId: null, tipo: 'plan', titulo: 'Médico', fecha: mas(2), creadoPor: 'uYo', privada: true, createdAt: '2026-10-20T10:00:00Z' }] });
    H.goTab(['agenda']); A.S.agendaDia = hoy; A.render(); await sleep(60);
    H.planNuevo([hoy]); await sleep(10); H.planPrivada(['pPrivada', '1']); await sleep(5);
    H.planCon(['g:g1']); await sleep(5); sh().querySelector('#pTitulo').value = 'Comida'; await H.planGuardar([]); await sleep(20);
    const cg = L.crear.find((x) => x.titulo === 'Comida');
    ok(cg && cg.grupoId === 'g1' && !('privada' in cg), 'marcar Privada y luego pasar a un grupo no manda «privada»');
    // editar plan de grupo
    H.planEditar(['gp']); await sleep(10); await H.planGuardar([]); await sleep(20);
    const eg = L.editar.find((x) => x[0] === 'gp');
    ok(eg && !('privada' in eg[1]), 'editar un plan de grupo no manda «privada»');
    H.planEditar(['yp']); await sleep(10); await H.planGuardar([]); await sleep(20);
    const ey = L.editar.find((x) => x[0] === 'yp');
    ok(ey && ey[1].privada === true, 'editar un plan «Solo yo» privado lo deja privado'); }
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

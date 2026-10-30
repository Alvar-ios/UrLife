// Calidad 30/10: «Compartir una tarea que ya tenías» (fase5/compartir-tarea). Casos raros: fallos al guardar, Deshacer, volver atrás, versiones antiguas. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), hoy = iso(d);
const mas = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return iso(x); };
const tarea = (nombre, extra) => Object.assign({ nombre, categoria: 'Casa', prioridad: 'Media', estado: 'Pendiente', fechaLimite: mas(4), comentario: 'Nota de prueba', fechaCreacion: hoy }, extra || {});
const m = (u, nm) => ({ user_id: u, nombre: nm, rol: 'miembro' });

async function montar(op) {
  op = op || {};
  const tareas = op.tareas || { tp: tarea('Pintar la puerta') };
  const e = makeEnv({ version: Object.assign({ agenda: 0, tu: 0, crear: 0, inicio: 0 }, op.version || {}), cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  Object.assign(e.store.tareas, JSON.parse(JSON.stringify(tareas)));
  await sleep(80);
  const A = e.w.__APP__, S = A.S;
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  S.tareas = Object.entries(e.store.tareas).map(([id, v]) => Object.assign({ id }, v));
  S.grupos = op.sinGrupos ? [] : [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana')] }];
  S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = []; S.agenda = [];
  const creados = [], borrados = [];
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => [], invitaciones: async () => [] }, rpc: async () => null,
    agenda: { suscribir: () => () => {}, editar: async (id, o) => o, restaurar: async () => null,
      crear: async (o) => { if (op.crearFalla) { const er = new Error('sin permiso (prueba)'); er.code = 'denied'; throw er; } const a = Object.assign({ id: 'n' + (creados.length + 1), creadoPor: 'uYo', createdAt: new Date().toISOString(), hechaEn: null }, o); creados.push(a); return a; },
      borrar: async (id) => { borrados.push(id); return [{ id }]; } } });
  // fallos de escritura en «tareas» (sin reintentos: error con código)
  const orig = S.db.collection.bind(S.db), fallo = { borrar: !!op.borrarFalla, poner: !!op.ponerFalla };
  S.db.collection = (n) => { const c = orig(n); if (n !== 'tareas') return c; return Object.assign({}, c, { doc: (id) => { const dd = c.doc(id); return Object.assign({}, dd, {
    delete: async () => { if (fallo.borrar) { const er = new Error('no (prueba)'); er.code = 'denied'; throw er; } return dd.delete(); },
    set: async (v) => { if (fallo.poner) { const er = new Error('no (prueba)'); er.code = 'denied'; throw er; } return dd.set(v); } }); } }); };
  A.render(); await sleep(20);
  return { e, A, S, H: A.H, doc: e.doc, sh: () => e.doc.querySelector('#sheetHost'), creados, borrados, fallo, papelera: () => (S.config.papelera || []).filter((x) => x.k === 'tarea').map((x) => x.id) };
}

(async () => {
  // 1. Tarea completada: no se ofrece compartirla
  { const t = await montar({ tareas: { th: tarea('Ya hecha', { estado: 'Completado' }) } });
    t.A.openTareaForm('th'); await sleep(10);
    ok(t.sh() && /Editar tarea/.test(t.sh().textContent) && !/compartirla/.test(t.sh().textContent) && !t.sh().querySelector('.plan-con'), 'tarea completada: no sale «Con · compartirla»'); }

  // 2. Sin grupos ni personas (usuario nuevo): no sale «Con»
  { const t = await montar({ sinGrupos: true });
    t.A.openTareaForm('tp'); await sleep(10);
    ok(t.sh() && /Editar tarea/.test(t.sh().textContent) && !t.sh().querySelector('.plan-con'), 'sin grupos: no sale «Con» al editar'); }

  // 3. Versión anterior de la Agenda («Antes»): el formulario antiguo sigue igual, sin «compartirla»
  { const t = await montar({ version: { agenda: 1 } });
    t.A.openTareaForm('tp'); await sleep(10);
    ok(t.sh() && !/compartirla/.test(t.sh().textContent), 'Agenda «Antes»: el formulario antiguo no cambia'); }

  // 4. Falla crear la compartida: tu tarea sigue intacta y no va a la papelera
  { const t = await montar({ crearFalla: true });
    t.A.openTareaForm('tp'); await sleep(10); t.H.tfCon(['g:g1', 'tp']); await sleep(10);
    await t.H.planGuardar([]); await sleep(40);
    ok(t.e.store.tareas.tp && t.e.store.tareas.tp.nombre === 'Pintar la puerta' && !t.papelera().length && !t.creados.length, 'si falla crear la compartida, tu tarea sigue y no va a la papelera');
    ok(t.sh() && t.sh().querySelector('#pTitulo'), 'si falla, el formulario sigue abierto para reintentar'); }

  // 5. Falla borrar la tuya: queda la compartida, tu tarea sigue, aviso claro y nada en la papelera
  { const t = await montar({ borrarFalla: true });
    t.A.openTareaForm('tp'); await sleep(10); t.H.tfCon(['g:g1', 'tp']); await sleep(10);
    await t.H.planGuardar([]); await sleep(40);
    const txt = t.doc.querySelector('#toast').textContent;
    ok(t.creados.length === 1 && t.e.store.tareas.tp && !t.papelera().length, 'si falla quitar la tuya: hay compartida, la tuya sigue, nada en la papelera');
    ok(/No se pudo quitar tu tarea/.test(txt) && !t.doc.querySelector('#toast .toast-btn'), 'aviso «No se pudo quitar tu tarea: bórrala tú», sin Deshacer'); }

  // 6. Todo bien + Deshacer: sin restos (ni en la Agenda, ni en la papelera)
  { const t = await montar();
    t.A.openTareaForm('tp'); await sleep(10); t.H.tfCon(['g:g1', 'tp']); await sleep(10);
    await t.H.planGuardar([]); await sleep(40);
    ok(!t.e.store.tareas.tp && t.papelera().includes('tp') && (t.S.agenda || []).some((a) => a.id === 'n1'), 'compartida creada, la tuya en la papelera');
    ok(t.creados[0] && t.creados[0].titulo === 'Pintar la puerta' && t.creados[0].fecha === mas(4) && t.creados[0].tipo === 'tarea', 'la compartida lleva el nombre y la fecha de la tuya');
    t.doc.querySelector('#toast .toast-btn').onclick({}); await sleep(40);
    ok(t.e.store.tareas.tp && t.e.store.tareas.tp.nombre === 'Pintar la puerta' && t.e.store.tareas.tp.comentario === 'Nota de prueba' && t.e.store.tareas.tp.categoria === 'Casa', 'Deshacer: vuelve tu tarea completa (nota y categoría)');
    ok(t.borrados.includes('n1') && !(t.S.agenda || []).some((a) => a.id === 'n1') && !t.papelera().includes('tp'), 'Deshacer: no quedan restos (ni compartida, ni papelera)'); }

  // 7. Deshacer cuando NO se puede volver a poner tu tarea: la compartida no debería borrarse (si no, solo queda en la papelera)
  { const t = await montar();
    t.A.openTareaForm('tp'); await sleep(10); t.H.tfCon(['g:g1', 'tp']); await sleep(10);
    await t.H.planGuardar([]); await sleep(40);
    t.fallo.poner = true; t.doc.querySelector('#toast .toast-btn').onclick({}); await sleep(40);
    ok(!t.borrados.includes('n1') && (t.S.agenda || []).some((a) => a.id === 'n1'), 'Deshacer que falla al recuperar tu tarea: la compartida se queda (no desaparece todo)'); }

  // 8. En el formulario compartido, volver a «Solo yo» no debe crear una segunda tarea personal
  { const t = await montar();
    t.A.openTareaForm('tp'); await sleep(10); t.H.tfCon(['g:g1', 'tp']); await sleep(10);
    t.H.planCon(['yo']); await sleep(10);
    ok(t.A.form() && t.A.form().kind === 'tarea' && t.A.form().id === 'tp', '«Solo yo» después de elegir grupo vuelve a «Editar tarea» (no a «Nueva tarea»)'); }

  // 9. Cambiar a «Plan» y luego «Solo yo»: el aviso no puede decir «Compartida con el grupo»
  { const t = await montar();
    t.A.openTareaForm('tp'); await sleep(10); t.H.tfCon(['g:g1', 'tp']); await sleep(10);
    t.H.planTipo(['plan']); await sleep(10); t.H.planCon(['yo']); await sleep(10);
    await t.H.planGuardar([]); await sleep(40);
    const txt = t.doc.querySelector('#toast').textContent;
    ok(!/Compartida con el grupo/.test(txt), 'convertir en plan «Solo yo»: el aviso no dice «Compartida con el grupo» (dice: ' + txt.trim() + ')'); }

  // 10. Doble toque en Guardar: una sola compartida y un solo borrado
  { const t = await montar();
    t.A.openTareaForm('tp'); await sleep(10); t.H.tfCon(['g:g1', 'tp']); await sleep(10);
    await Promise.all([t.H.planGuardar([]), t.H.planGuardar([])]); await sleep(40);
    ok(t.creados.length === 1 && t.papelera().filter((x) => x === 'tp').length === 1, 'doble toque en Guardar: una sola compartida'); }

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

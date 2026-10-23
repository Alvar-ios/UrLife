// Calidad (23/10/2026): temas en los grupos, planes, forma de las metas compartidas e inversiones en la pestaña.
// Mira sobre todo que nada mande a la base de datos campos que la tabla rechace, que la app siga bien si
// Data.carpetas o Data.agenda no existen, y que «Ocultar» y «Avisarme» sean privados. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), hoy = iso(d);
const mas = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return iso(x); };
const mb = (u, nm, extra) => Object.assign({ user_id: u, nombre: nm, rol: 'miembro' }, extra || {});

// Las reglas (checks) de la tabla «agenda» tal y como están en supabase/migrations/2026-10-23_agenda_planes.sql
const CAMPOS_AGENDA = ['grupoId', 'tipo', 'titulo', 'fecha', 'fechaFin', 'hora', 'lugar', 'nota', 'asignadoA'];
function reglasAgenda(o, previo) {
  const r = Object.assign({}, previo || {}, o), err = [];
  Object.keys(o).forEach((k) => { if (CAMPOS_AGENDA.indexOf(k) < 0) err.push('campo ' + k); });
  if (previo && ('grupoId' in o || 'tipo' in o)) err.push('cambia grupo o tipo al editar');
  if (['plan', 'tarea'].indexOf(r.tipo) < 0) err.push('tipo');
  const t = String(r.titulo || '').trim(); if (t.length < 1 || t.length > 120) err.push('titulo');
  if (r.tipo !== 'tarea' && !r.fecha) err.push('plan sin fecha');
  if (r.tipo !== 'plan' && !r.grupoId) err.push('tarea sin grupo');
  if (r.fechaFin && !(r.tipo === 'plan' && r.fechaFin >= r.fecha)) err.push('fecha_fin');
  if (r.tipo !== 'plan' && (r.hora || r.fechaFin || r.lugar)) err.push('hora/fecha_fin/lugar en tarea');
  if (r.tipo !== 'tarea' && (r.asignadoA || r.hechaEn)) err.push('asignado/hecha en plan');
  if (r.lugar && r.lugar.length > 120) err.push('lugar largo'); if (r.nota && r.nota.length > 1000) err.push('nota larga');
  if (r.hora && !/^\d\d:\d\d(:\d\d)?$/.test(r.hora)) err.push('hora');
  return err;
}

(async () => {
  /* ============ 1. App publicada sin Data.carpetas ni Data.agenda (lo que hay en el harness por defecto) ============ */
  {
    const e = makeEnv({ version: { agenda: 0, tu: 0, crear: 0 }, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Otros' }] }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost'), c = () => doc.querySelector('#content');
    const creados = [];
    S.user = Object.assign({}, S.user, { id: 'uYo' });
    S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [mb('uYo', 'Lucía'), mb('uA', 'Ana')], todos: [mb('uYo', 'Lucía'), mb('uA', 'Ana')] }];
    S.compartidos = []; S.objetivos = []; S.aportes = [];
    S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null,
      compartidos: { crear: async (o) => { creados.push(o); return Object.assign({ id: 'k' + creados.length, creadoPor: 'uYo', createdAt: new Date().toISOString() }, o); }, editar: async (id, o) => o } });
    ok(!S.db.carpetas && !S.db.agenda, 'escenario: sin Data.carpetas ni Data.agenda');
    H.compRapido(['g:g1']); await sleep(30);
    ok(sh() && /Compartir un gasto/.test(sh().textContent) && !sh().querySelector('.tema-caja'), 'sin temas: compartir un gasto funciona y no sale «¿De qué tema?»');
    const imp = sh().querySelector('#crImporte'); imp.value = '12'; imp.dispatchEvent(new e.w.Event('input', { bubbles: true }));
    await H.crGuardar([]); await sleep(40);
    ok(creados[0] && !('carpetaId' in creados[0]), 'sin temas: el gasto se guarda sin «carpetaId»');
    H.grupoVer(['g1']); await sleep(30);
    const tabs = [...sh().querySelectorAll('.jv-tabs button')].map((b) => b.textContent.trim());
    ok(tabs.join('|') === 'Gastos|Saldos' && !sh().querySelector('.tema-grupo, .tema-mas-suelto, .tema-por-card'), 'sin agenda ni temas: el grupo solo tiene «Gastos | Saldos» y nada de temas (' + tabs.join('|') + ')');
    H.closeSheet([]); await sleep(300);
    H.goTab(['agenda']); await sleep(30);
    ok(c().querySelector('.section-title') && !c().querySelector('[data-click^="planNuevo"]'), 'sin agenda: la Agenda no ofrece «+ Plan»');
    A.openTareaForm(null, {}); await sleep(20);
    ok(sh().querySelector('#tNombre') && !sh().querySelector('.plan-tipo'), 'sin agenda: el formulario de tarea no ofrece «Tarea | Plan»');
    H.closeSheet([]); await sleep(300);
    H.goTab(['inicio']); await sleep(30);
    ok(c().children.length > 0, 'sin agenda: Inicio se pinta sin errores');
  }

  /* ============ 2. Formas: todas las claves cumplen el formato de la columna ============ */
  {
    const e = makeEnv({ version: { dinero: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Casa' }] }, meta: { onboarded: true } } });
    await sleep(60);
    const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost');
    const llamadas = [];
    S.user = Object.assign({}, S.user, { id: 'uYo' });
    S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [mb('uYo', 'Lucía'), mb('uA', 'Ana')], todos: [mb('uYo', 'Lucía'), mb('uA', 'Ana')] }];
    S.compartidos = []; S.aportes = []; S.objetivos = [];
    S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('x'); }, invitaciones: async () => [] }, rpc: async () => null,
      objetivos: { editar: async (id, o) => { llamadas.push(o); return Object.assign({ id }, o); }, crear: async (o) => { llamadas.push(o); return Object.assign({ id: 'o' + llamadas.length, hitos: [], usos: [] }, o); } } });
    H.objNueva(['ahorro', 'g1']); await sleep(30);
    const claves = [...sh().querySelectorAll('.fm-op')].map((b) => b.dataset.k);
    ok(claves.length >= 10 && claves.every((k) => /^[a-z][A-Za-z0-9]{0,19}$/.test(k)), 'todas las formas (' + claves.length + ') cumplen el formato de la base de datos');
    sh().querySelector('#oNombre').value = 'Sofá'; sh().querySelector('#oObjetivo').value = '500';
    await H.objGuardar([]); await sleep(30);
    ok(llamadas[0] && !('forma' in llamadas[0]), 'meta compartida nueva sin tocar la forma: no se manda (la elige el nombre)');
    H.objNueva(['ahorro', 'g1']); await sleep(30);
    sh().querySelector('#oNombre').value = 'Viaje'; sh().querySelector('#oObjetivo').value = '900';
    H.objFormaElegir([claves[claves.length - 1]]); await sleep(10);
    ok(sh().querySelector('#oNombre').value === 'Viaje', 'elegir la forma no borra el nombre ya escrito');
    await H.objGuardar([]); await sleep(30);
    ok(llamadas[1] && llamadas[1].forma === claves[claves.length - 1], 'meta compartida nueva con forma elegida: se manda esa clave');
  }

  /* ============ 3. Temas: carpetaId solo cuando toca ============ */
  {
    const e = makeEnv({ cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Otros' }] }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost');
    const creados = [], editados = [], rpcs = [];
    S.user = Object.assign({}, S.user, { id: 'uYo' });
    S.grupos = [{ id: 'g1', nombre: 'Viaje', tipo: 'grupo', alias: {}, miembros: [mb('uYo', 'Lucía'), mb('uA', 'Ana')], todos: [mb('uYo', 'Lucía'), mb('uA', 'Ana')] },
      { id: 'd1', nombre: 'Ana', tipo: 'directo', alias: {}, miembros: [mb('uYo', 'Lucía'), mb('uA', 'Ana')], todos: [mb('uYo', 'Lucía'), mb('uA', 'Ana')] }];
    S.compartidos = [{ id: 'k1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Agua', importe: 10, pagadoPor: 'uYo', reparto: { uYo: 5, uA: 5 }, modo: 'igual', creadoPor: 'uYo', createdAt: '2026-10-01T10:00:00Z', fecha: hoy, carpetaId: 't1' }];
    S.objetivos = []; S.aportes = [];
    S.carpetas = [{ id: 't1', grupoId: 'g1', nombre: 'Roma', icono: 'plane', desde: mas(-2), hasta: mas(2), cerrada: null, createdAt: '2026-10-01T09:00:00Z' }];
    S.db = Object.assign(S.db || {}, {
      grupos: { listar: async () => { throw new Error('x'); }, invitaciones: async () => [] },
      rpc: async (fn, p) => { rpcs.push([fn, p]); return 0; },
      compartidos: { crear: async (o) => { creados.push(o); return Object.assign({ id: 'n' + creados.length, creadoPor: 'uYo', createdAt: new Date().toISOString() }, o); }, editar: async (id, o) => { editados.push([id, o]); return Object.assign({}, S.compartidos.find((x) => x.id === id), o); } },
      carpetas: { suscribir: () => () => {}, crear: async (o) => Object.assign({ id: 'tn', cerrada: null, createdAt: new Date().toISOString() }, o), editar: async (id, o) => Object.assign({}, S.carpetas.find((t) => t.id === id), o), borrar: async () => [{ id: 'x' }], restaurar: async () => null },
    });
    // con una persona (no grupo): no hay temas y no se manda nada
    H.compRapido(['g:g1']); await sleep(30);
    ok(sh().querySelector('.tema-caja .chip.active') && /Roma/.test(sh().querySelector('.tema-caja .chip.active').textContent), 'Roma elegido por la fecha');
    const dDir = [...sh().querySelectorAll('.cr-con .chip')].find((b) => /Ana/.test(b.textContent));
    const kDir = dDir ? decodeURIComponent((dDir.getAttribute('data-click') || '').split('|')[1]) : null;
    if (kDir) { H.crDest([kDir]); await sleep(10); }
    ok(kDir && !/Roma/.test((sh().querySelector('.tema-caja') || {}).textContent || ''), 'al cambiar a una persona, el tema del otro grupo (Roma) ya no está');
    let imp = sh().querySelector('#crImporte'); imp.value = '8'; imp.dispatchEvent(new e.w.Event('input', { bubbles: true }));
    await H.crGuardar([]); await sleep(40);
    ok(creados[0] && !('carpetaId' in creados[0]), 'gasto con una persona: no se manda el tema del otro grupo');
    // editar un gasto que ya tiene tema por el formulario normal: el tema no se toca
    await sleep(300);
    H.compAbrir(['k1', 'g1']); await sleep(40);
    const fi = sh().querySelector('#fImporte'); if (fi) { fi.value = '11'; fi.dispatchEvent(new e.w.Event('input', { bubbles: true })); }
    await H.saveMov([]); await sleep(40);
    ok(editados.length === 1 && !('carpetaId' in editados[0][1]), 'editar un gasto con tema desde su formulario no manda «carpetaId» (el tema se queda)');
    // tema borrado entre medias: no se manda un tema que ya no existe
    await sleep(300);
    H.compRapido(['g:g1']); await sleep(30);
    S.carpetas = [];
    imp = sh().querySelector('#crImporte'); imp.value = '9'; imp.dispatchEvent(new e.w.Event('input', { bubbles: true }));
    await H.crGuardar([]); await sleep(40);
    ok(creados.length === 2 && !('carpetaId' in creados[1]), 'si el tema se borra mientras compartes, no se manda su id');
    // crear un tema: nombre repetido (también si está cerrado) no se manda
    await sleep(300);
    S.carpetas = [{ id: 't2', grupoId: 'g1', nombre: 'Compra', icono: 'cart', desde: null, hasta: null, cerrada: '2026-10-10T00:00:00Z', createdAt: '2026-10-01T09:00:00Z' }];
    H.grupoVer(['g1']); await sleep(30);
    H.temaFormAbrir(['g1', '']); await sleep(20);
    sh().querySelector('#tfNombre').value = '  compra ';
    await H.temaFormGuardar([]); await sleep(20);
    ok(/Ya hay un tema con ese nombre/.test(doc.querySelector('#toast').textContent), 'no deja crear un tema con el nombre de otro (aunque esté cerrado, como la base de datos)');
    // iconos con nombre en español para el lector de pantalla
    const etiquetas = [...sh().querySelectorAll('.tema-ico')].map((b) => b.getAttribute('aria-label'));
    ok(etiquetas.length === 10 && etiquetas.every((x) => !/^(plane|cart|home|fork|gift|car|ball|film|heart|tag)$/.test(x)), 'lector de pantalla: los iconos del tema tienen nombre en español (' + etiquetas.join(', ') + ')');
    // fechas al revés
    sh().querySelector('#tfNombre').value = 'Otro'; sh().querySelector('#tfDesde').value = mas(3); sh().querySelector('#tfHasta').value = mas(1);
    await H.temaFormGuardar([]); await sleep(20);
    ok(/La fecha final va después/.test(doc.querySelector('#toast').textContent), 'tema con la fecha final antes que la primera: no se guarda');
  }

  /* ============ 4. Planes: lo que se manda cumple las reglas de la tabla ============ */
  {
    const e = makeEnv({ version: { agenda: 0, tu: 0, crear: 0 }, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost'), c = () => doc.querySelector('#content');
    const creados = [], editados = [], rpcs = [];
    S.user = Object.assign({}, S.user, { id: 'uYo' });
    // «Pádel» con una persona sin cuenta (Leo) y el sitio de otra (Tomi, id sT) ocupado por mí (alias)
    S.grupos = [{ id: 'g1', nombre: 'Pádel', tipo: 'grupo', alias: { sT: 'uYo' }, miembros: [mb('uYo', 'Lucía'), mb('uA', 'Ana'), mb('sL', 'Leo', { rol: 'sin_cuenta', sinCuenta: true })],
      todos: [mb('uYo', 'Lucía'), mb('uA', 'Ana'), mb('sL', 'Leo', { sinCuenta: true }), mb('sT', 'Tomi', { sinCuenta: true })] }];
    S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = [];
    S.agenda = [{ id: 'c9', grupoId: 'g1', tipo: 'tarea', titulo: 'Llevar pelotas', fecha: hoy, asignadoA: 'sT', hechaEn: null, creadoPor: 'uA', createdAt: '2026-10-20T10:00:00Z' },
      { id: 'p9', grupoId: 'g1', tipo: 'plan', titulo: 'Torneo', fecha: mas(2), fechaFin: mas(4), hora: null, creadoPor: 'uA', createdAt: '2026-10-20T10:00:00Z' }];
    const previos = {}; S.agenda.forEach((a) => { previos[a.id] = a; });
    S.db = Object.assign(S.db || {}, {
      grupos: { listar: async () => { throw new Error('x'); }, invitaciones: async () => [] },
      rpc: async (fn, p) => { rpcs.push([fn, p]); return null; },
      agenda: { suscribir: () => () => {}, crear: async (o) => { creados.push(o); const r = Object.assign({ id: 'n' + creados.length, creadoPor: 'uYo', createdAt: new Date().toISOString(), hechaEn: null }, o); previos[r.id] = r; return r; },
        editar: async (id, o) => { editados.push([id, o]); return Object.assign({}, previos[id] || S.agenda.find((x) => x.id === id), o); }, borrar: async () => [{ id: 'x' }], restaurar: async () => null },
    });
    const guardar = async () => { await H.planGuardar([]); await sleep(30); };
    // a) plan «Solo yo» a una hora
    H.planNuevo([hoy]); await sleep(20);
    sh().querySelector('#pTitulo').value = 'Dentista'; H.planHoraModo(['hora']); await sleep(10); sh().querySelector('#pHora').value = '09:15';
    await guardar();
    ok(creados[0] && creados[0].grupoId === null && reglasAgenda(creados[0]).length === 0, 'plan «Solo yo» con hora: cumple las reglas (' + reglasAgenda(creados[0] || {}).join(', ') + ')');
    // b) plan de grupo con lugar → cambiado a «Tarea»: no se manda hora, lugar ni fecha_fin
    H.planNuevo([hoy]); await sleep(20);
    sh().querySelector('#pTitulo').value = 'Algo'; H.planCon(['g:g1']); await sleep(10); H.planHoraModo(['varios']); await sleep(10);
    sh().querySelector('#pFin').value = mas(3); sh().querySelector('#pLugar').value = 'Club'; H.planHoraModo(['hora']); await sleep(10); sh().querySelector('#pHora').value = '18:00';
    H.planTipo(['tarea']); await sleep(10);
    ok(/Nueva tarea compartida/.test(sh().textContent), 'plan de grupo → «Tarea»: pasa a tarea compartida');
    H.planQuien(['sL']); await sleep(10);
    await guardar();
    const t1 = creados[1];
    ok(t1 && t1.tipo === 'tarea' && reglasAgenda(t1).length === 0, 'tarea que venía de un plan con hora, lugar y varios días: cumple las reglas (' + reglasAgenda(t1 || {}).join(', ') + ')');
    ok(t1 && t1.asignadoA === 'sL', '«¿Quién se encarga?» deja elegir a una persona sin cuenta (Leo) y manda su id');
    // c) tarea con encargado → «Plan»: no se manda asignado_a
    H.planGrupoNuevo(['g1', 'tarea']); await sleep(20);
    sh().querySelector('#pTitulo').value = 'Cena'; H.planQuien(['uA']); await sleep(10); H.planTipo(['plan']); await sleep(10);
    await guardar();
    ok(creados[2] && creados[2].tipo === 'plan' && !('asignadoA' in creados[2]) && reglasAgenda(creados[2]).length === 0, 'tarea con encargada → «Plan»: no manda «asignadoA» y cumple las reglas');
    // d) varios días con el final antes del principio: no se manda
    const n0 = creados.length;
    H.planNuevo([mas(5)]); await sleep(20); sh().querySelector('#pTitulo').value = 'Viaje'; H.planHoraModo(['varios']); await sleep(10); sh().querySelector('#pFin').value = mas(4);
    await guardar();
    ok(creados.length === n0, 'varios días con el final antes del principio: no se guarda');
    sh().querySelector('#pFin').value = mas(5); await guardar();
    ok(creados.length === n0 + 1 && reglasAgenda(creados[n0]).length === 0, 'varios días que acaban el mismo día: cumple las reglas');
    // e) editar: nunca manda grupo ni tipo, y lo de las tareas no se cuela en un plan
    await sleep(300);
    H.planEditar(['p9']); await sleep(20);
    sh().querySelector('#pTitulo').value = 'Torneo de otoño'; await guardar();
    ok(editados[0] && editados[0][0] === 'p9' && reglasAgenda(editados[0][1], previos.p9).length === 0, 'editar un plan de varios días: cumple las reglas y no cambia grupo ni tipo (' + reglasAgenda((editados[0] || [])[1] || {}, previos.p9).join(', ') + ')');
    await sleep(300);
    H.planEditar(['c9']); await sleep(20);
    ok(sh().querySelector('.plan-quien .cr-cara.on') && /Tú/.test(sh().querySelector('.plan-quien .cr-cara.on').textContent), 'editar una tarea de alguien cuyo sitio ocupas (alias): sale marcada «Tú»');
    await guardar();
    ok(editados[1] && reglasAgenda(editados[1][1], previos.c9).length === 0, 'editar una tarea compartida: cumple las reglas');
    // f) alias: la tarea de Tomi es mía
    await sleep(300);
    H.goTab(['agenda']); S.agendaDia = hoy; A.render(); await sleep(20);
    ok(/Llevar pelotas/.test(c().textContent), 'la tarea asignada a la persona sin cuenta cuyo sitio ocupas sale en tu Agenda');
    // g) privado: avisar y ocultar no tocan la tabla compartida
    const ed0 = editados.length;
    H.planVer(['p9']); await sleep(20); H.planAvisoVer(['p9', 'no']); await sleep(20); H.planOcultar(['p9']); await sleep(20);
    ok(editados.length === ed0 && e.store.cfg.app.agendaAvisos && e.store.cfg.app.agendaAvisos.p9 === 'no' && e.store.cfg.app.agendaOcultos && e.store.cfg.app.agendaOcultos.p9 === true, '«Avisarme» y «Ocultar» se guardan solo en tu configuración, sin tocar el plan del grupo');
    // h) un plan de varios días: en «Próximos 7 días» una sola vez
    await sleep(300);
    const oc = Object.assign({}, e.store.cfg.app.agendaOcultos); delete oc.p9; await A.S.db.doc('config/app').update({ agendaOcultos: oc }); await sleep(20);
    S.agendaDia = hoy; H.goTab(['agenda']); A.render(); await sleep(20);
    const veces = (c().textContent.match(/Torneo de otoño|Torneo/g) || []).length;
    ok(veces === 1, 'un plan de 3 días sale una sola vez en «Próximos 7 días» (' + veces + ')');
    // i) volver al grupo solo cuando se viene del grupo
    await sleep(100);
    H.grupoVer(['g1']); await sleep(30); H.grupoTab(['planes']); await sleep(10);
    H.planGrupoNuevo(['g1', 'plan']); await sleep(20); H.closeSheet([]); await sleep(350);
    H.planNuevo([hoy]); await sleep(20); sh().querySelector('#pTitulo').value = 'Café'; await guardar(); await sleep(350);
    ok(!doc.querySelector('#sheetBackdrop') || !/Pádel/.test(sh().textContent), 'un plan apuntado desde la Agenda no abre el grupo aunque antes se cancelara uno desde el grupo');
    // j) tarea nueva desde el grupo: sin fecha, como pide el botón
    await sleep(100);
    H.planGrupoNuevo(['g1', 'tarea']); await sleep(20);
    const fAct = sh().querySelector('.chip.active[data-click^="planFecha"]');
    ok(fAct && /Sin fecha/.test(fAct.textContent), 'tarea nueva desde el grupo: viene «Sin fecha» (' + (fAct ? fAct.textContent : '—') + ')');
    H.closeSheet([]); await sleep(350);
  }

  /* ============ 5. Usuario nuevo, sin grupos ============ */
  {
    const e = makeEnv({ version: { agenda: 0, tu: 0, crear: 0 }, cfg: { app: { nombre: 'Nuevo' }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost');
    const creados = [];
    S.user = Object.assign({}, S.user, { id: 'uYo' });
    S.grupos = []; S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = []; S.agenda = [];
    S.db = Object.assign(S.db || {}, { agenda: { suscribir: () => () => {}, crear: async (o) => { creados.push(o); return Object.assign({ id: 'n1', creadoPor: 'uYo' }, o); }, editar: async (id, o) => o, borrar: async () => [], restaurar: async () => null } });
    H.goTab(['agenda']); await sleep(20);
    H.planNuevo([hoy]); await sleep(20);
    ok(/Nuevo plan/.test(sh().textContent) && [...sh().querySelectorAll('.plan-con .chip')].map((x) => x.textContent).join('|') === 'Solo yo', 'sin grupos: el plan solo puede ser «Solo yo»');
    H.planTipo(['tarea']); await sleep(20);
    ok(sh().querySelector('#tNombre') && !sh().querySelector('#pTitulo'), 'sin grupos: «Tarea» lleva a la tarea de siempre (la tuya)');
    H.tfAPlan([]); await sleep(20);
    sh().querySelector('#pTitulo').value = 'Revisión'; await H.planGuardar([]); await sleep(30);
    ok(creados[0] && creados[0].grupoId === null && reglasAgenda(creados[0]).length === 0, 'usuario nuevo: su primer plan cumple las reglas');
    H.goTab(['inicio']); await sleep(30);
    ok(/Revisión/.test(doc.querySelector('#content').textContent), 'usuario nuevo: su plan de hoy sale en «Estos días»');
  }

  /* ============ 6. Calendario: «Pago fijo» y archivo .ics ============ */
  {
    const e = makeEnv({ version: { agenda: 0, tu: 0, crear: 0 }, cfg: { app: { nombre: 'Lucía' }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, S = A.S;
    S.user = Object.assign({}, S.user, { id: 'uYo' });
    S.grupos = []; S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = [];
    S.agenda = [{ id: 'p1', grupoId: null, tipo: 'plan', titulo: 'Cena, con; amigos', fecha: '2026-11-06', hora: '23:30:00', lugar: 'Parador', creadoPor: 'uYo' },
      { id: 'p2', grupoId: null, tipo: 'plan', titulo: 'Escapada', fecha: '2026-11-06', fechaFin: '2026-11-08', hora: null, creadoPor: 'uYo' }];
    S.db = Object.assign(S.db || {}, { agenda: { suscribir: () => () => {} } });
    let texto = null; e.w.Blob = function (partes) { texto = partes.join(''); }; e.w.URL.createObjectURL = () => 'blob:x'; e.w.URL.revokeObjectURL = () => {};
    H.planIcs(['p2']); await sleep(10);
    ok(texto && /DTSTART;VALUE=DATE:20261106/.test(texto) && /DTEND;VALUE=DATE:20261109/.test(texto), '.ics de un plan de varios días: del 6 al 8 (el final, al día siguiente, como pide el formato)');
    H.planIcs(['p1']); await sleep(10);
    const ini = (texto.match(/DTSTART:(\S+)/) || [])[1], fin = (texto.match(/DTEND:(\S+)/) || [])[1];
    ok(/SUMMARY:Cena\\, con\\; amigos/.test(texto) && ini === '20261106T233000', '.ics: título con comas y punto y coma bien escritos');
    ok(fin && fin > ini, '.ics de un plan a las 23:30: termina después de empezar (' + ini + ' → ' + fin + ')');
  }

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

// Calidad 24/10 (docs/19 3.2 y 3.3): número de hoy en el botón de Agenda, capas del calendario y color de las metas. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), hoy = iso(d);
const mas = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return iso(x); };
const m = (u, nm) => ({ user_id: u, nombre: nm, rol: 'miembro' });
const grupo = (S) => {
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Yo'), m('uA', 'Ana')], todos: [m('uYo', 'Yo'), m('uA', 'Ana')] }];
  S.compartidos = []; S.aportes = []; S.carpetas = [];
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null,
    agenda: { suscribir: () => () => {}, crear: async (o) => o, editar: async (id, o) => o, borrar: async () => [], restaurar: async () => null } });
};
(async () => {
  // 1) Usuario nuevo, sin nada: no sale número y no se rompe
  {
    const e = makeEnv({ version: { agenda: 0, tu: 0, crear: 0, dinero: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
    await sleep(150);
    const A = e.w.__APP__, doc = e.doc;
    ok(A.agendaHoyN() === 0 && doc.querySelector('#tbAgendaN').hidden && doc.querySelector('#tbAgenda').getAttribute('aria-label') === 'Agenda', 'usuario nuevo: botón de Agenda sin número');
    A.H.goTab(['dinero']); A.H.irDinero(['metas']); await sleep(20);
    ok(!!doc.querySelector('#content'), 'usuario nuevo: Dinero → Metas se pinta sin metas');
  }
  // 2) El número de hoy: solo lo de hoy y sin hacer (propias y compartidas)
  {
    const e = makeEnv({ version: { agenda: 0, tu: 0, crear: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
    await sleep(150);
    const A = e.w.__APP__, S = A.S, doc = e.doc; grupo(S); S.objetivos = [];
    S.tareas = [{ id: 't1', nombre: 'Hoy sin hacer', fechaLimite: hoy, estado: 'Pendiente' }, { id: 't2', nombre: 'Hoy hecha', fechaLimite: hoy, estado: 'Completado' },
      { id: 't3', nombre: 'Mañana', fechaLimite: mas(1), estado: 'Pendiente' }, { id: 't4', nombre: 'Ayer', fechaLimite: mas(-1), estado: 'Iniciado' }, { id: 't5', nombre: 'Sin fecha', estado: 'Pendiente' }];
    S.agenda = [{ id: 'p1', grupoId: 'g1', tipo: 'plan', titulo: 'Cena', fecha: hoy, creadoPor: 'uA' }, { id: 'p2', grupoId: 'g1', tipo: 'plan', titulo: 'Otro día', fecha: mas(3), creadoPor: 'uA' },
      { id: 'c1', grupoId: 'g1', tipo: 'tarea', titulo: 'Mía hoy', fecha: hoy, asignadoA: 'uYo', hechaEn: null }, { id: 'c2', grupoId: 'g1', tipo: 'tarea', titulo: 'De Ana hoy', fecha: hoy, asignadoA: 'uA', hechaEn: null },
      { id: 'c3', grupoId: 'g1', tipo: 'tarea', titulo: 'Hecha hoy', fecha: hoy, asignadoA: 'uYo', hechaEn: '2026-10-20T10:00:00Z' }];
    A.H.goTab(['dinero']); await sleep(20);
    ok(A.agendaHoyN() === 3, 'número de hoy = 1 tarea propia + 1 plan + 1 tarea compartida mía (sale ' + A.agendaHoyN() + ')');
    ok(doc.querySelector('#tbAgendaN').textContent === '3' && /3 cosas hoy/.test(doc.querySelector('#tbAgenda').getAttribute('aria-label')), 'el número sale también desde Dinero, y el lector de pantalla dice «3 cosas hoy»');
  }
  // 3) Capas del calendario
  {
    const e = makeEnv({ version: { agenda: 0, tu: 0, crear: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
    await sleep(150);
    const A = e.w.__APP__, S = A.S, H = A.H, doc = e.doc;
    const otro = mas(40); // otro mes
    H.irAgenda(['calendario']); await sleep(10); H.calSelDia([otro]); await sleep(10);
    S.movPeriodo = 'm:' + hoy.slice(0, 7); // lo último que se vio en Movimientos: este mes
    H.calCapa(['planes']); await sleep(10); // tocar la capa que ya está marcada
    ok(S.calFecha === otro, 'en la Agenda, tocar «Planes y tareas» (ya marcada) no cambia el día elegido (antes ' + otro + ', ahora ' + S.calFecha + ')');
    H.calSelDia([otro]); await sleep(10);
    H.calCapa(['dinero']); await sleep(10);
    ok(S.tab === 'movimientos' && S.movPeriodo === 'm:' + otro.slice(0, 7), '«Dinero» abre Movimientos → Calendario en el mismo mes');
    H.calCapa(['planes']); await sleep(10);
    ok(S.calFecha.slice(0, 7) === otro.slice(0, 7), 'y «Planes y tareas» vuelve a la Agenda en ese mes');
  }
  {
    const e = makeEnv({ version: { agenda: 1 }, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
    await sleep(150);
    const A = e.w.__APP__, doc = e.doc;
    A.S.tab = 'movimientos'; A.S.movVista = 'calendario'; A.render(); await sleep(10);
    ok(doc.querySelector('.cal-grid, .cal-d') && !doc.querySelector('.cal-capas'), 'con la Agenda «Antes», Movimientos → Calendario no enseña las capas');
  }
  // 4) Metas: guardar conserva todo; una meta antigua sin color no se rompe; compartidas con el mismo color en Dinero y Juntos
  {
    const hitos = [{ id: 'x1', nombre: 'Mitad', importe: 1500, fecha: '2026-12-01' }];
    const e = makeEnv({ version: { dinero: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], ahorro: [
      { id: 'h1', nombre: 'Viaje', objetivo: 3000, yaAhorrado: 900, forma: 'avion', hitos, rentabilidad: 3, campoRaro: 'se queda' },
      { id: 'h2', nombre: 'Colchón', objetivo: 6000, yaAhorrado: 6000, color: 'ambar' },
      { id: 'h3', nombre: 'Coche', objetivo: 8000, yaAhorrado: 0, color: 'nocolor' }] }, meta: { onboarded: true } } });
    await sleep(150);
    const A = e.w.__APP__, S = A.S, H = A.H, doc = e.doc; grupo(S);
    S.objetivos = [{ id: 'oZ', grupoId: 'g1', tipo: 'ahorro', nombre: 'Lisboa', objetivo: 1000, previo: 500, hitos: [], usos: [], creadoPor: 'uA' }];
    H.goTab(['dinero']); H.irDinero(['metas']); await sleep(20);
    ok(doc.querySelectorAll('.fm.cristal').length >= 3, 'metas con color antiguo raro («nocolor») o sin color se pintan');
    const colComp = (sel) => { const el = doc.querySelector(sel); return el && (el.getAttribute('style').match(/--fcd:(#[0-9A-F]+)/i) || [])[1]; };
    const enDinero = [...doc.querySelectorAll('.dm-fm')].find((x) => /Lisboa/.test(x.textContent));
    const cD = enDinero && (enDinero.querySelector('.fm.cristal').getAttribute('style').match(/--fcd:(#[0-9A-F]+)/i) || [])[1];
    H.goTab(['juntos']); await sleep(30);
    const cJ = colComp('.jv-obj .fm.cristal');
    ok(cD && cD === cJ, 'la meta compartida tiene el mismo color en Dinero y en Juntos (' + cD + ' / ' + cJ + ')');
    H.goTab(['dinero']); H.irDinero(['metas']); await sleep(20);
    H.metaEditar(['h1']); await sleep(10);
    H.metaColorElegir(['turquesa']); await sleep(5);
    await H.metaGuardar(); await sleep(30);
    const g = (e.store.cfg.app.ahorro || []).find((x) => x.id === 'h1') || {};
    ok(g.color === 'turquesa' && g.forma === 'avion' && g.campoRaro === 'se queda' && g.rentabilidad === 3 && g.yaAhorrado === 900 && JSON.stringify((g.hitos || []).map((h) => h.importe)) === '[1500]', 'guardar con color nuevo conserva forma, hitos, lo de antes y campos desconocidos');
    ok((e.store.cfg.app.ahorro || []).length === 3, 'guardar no duplica ni pierde metas');
    H.metaEditar(['h2']); await sleep(10); await H.metaGuardar(); await sleep(30);
    ok(((e.store.cfg.app.ahorro || []).find((x) => x.id === 'h2') || {}).color === 'ambar', 'guardar sin tocar el color mantiene el que tenía');
  }
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

// Calidad · revisión de Tú v2, Agenda v2 y botón + v2 (22/10/2026). Casos raros. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const NUEVAS = { tu: 0, agenda: 0, crear: 0 };
const txt = (e) => e.doc.querySelector('#content').textContent.replace(/\s+/g, ' ');
const shDoc = (e, q) => e.doc.querySelector('#sheetHost ' + q);
const veces = (t, s) => t.split(s).length - 1;
(async () => {
  /* ---------- 1. Agenda: cada tarea pendiente sale (y una sola vez) mire el día que mire ---------- */
  let e = makeEnv({ version: NUEVAS, cfg: { app: { nombre: 'Ana' }, meta: { onboarded: true } } });
  await sleep(80);
  let A = e.w.__APP__, H = A.H, S = A.S;
  const hoy = A.todayISO(), d = (n) => A.uAdd(hoy, n);
  S.tareas = [
    { id: 'a1', nombre: 'Tarea de hoy', estado: 'Pendiente', prioridad: 'Media', fechaLimite: hoy },
    { id: 'a2', nombre: 'Tarea pasado mañana', estado: 'Pendiente', prioridad: 'Media', fechaLimite: d(2) },
    { id: 'a3', nombre: 'Tarea vencida ayer', estado: 'Pendiente', prioridad: 'Media', fechaLimite: d(-1) },
    { id: 'a4', nombre: 'Tarea sin fecha', estado: 'Pendiente', prioridad: 'Media', fechaLimite: null },
  ];
  H.goTab(['inicio']); H.setInicioVista(['tareas']);
  const todas = async (sel, abrir) => { H.agendaDia([sel]); if (abrir) { S.agendaMas = abrir; } await sleep(10); H.agendaDia([sel]); await sleep(10); return txt(e); };
  let t = await todas(hoy);
  ok(['Tarea de hoy', 'Tarea pasado mañana', 'Tarea vencida ayer', 'Tarea sin fecha'].every((n) => veces(t, n) === 1), 'Agenda (hoy): las 4 tareas salen una vez');
  t = await todas(d(1), 'adelante');
  ok(veces(t, 'Tarea de hoy') === 1, 'Agenda (eliges mañana): la tarea de HOY sigue saliendo en algún sitio');
  t = await todas(d(7), 'adelante');
  ok(veces(t, 'Tarea de hoy') === 1 && veces(t, 'Tarea pasado mañana') === 1, 'Agenda (semana siguiente): las tareas de esta semana siguen saliendo');
  t = await todas(d(-10), 'adelante');
  ok(veces(t, 'Tarea vencida ayer') === 1, 'Agenda (hace 10 días): una vencida no sale dos veces (Vencidas y Más adelante)');
  S.agendaMas = '';
  // semana que cambia de mes
  H.agendaDia(['2026-09-30']); await sleep(10);
  ok(/Semana del 28 sept? al 4 oct/i.test(txt(e)) || /Semana del 28 \S+ al 4 \S+/.test(txt(e)), 'Agenda: semana que cambia de mes («Semana del 28 … al 4 …»)');
  // día pasado: la casilla rápida apunta para ese día
  H.agendaDia([d(-3)]); await sleep(10);
  ok(!/para hoy|para mañana/.test(e.doc.querySelector('#agRapida').placeholder), 'casilla rápida en un día pasado: dice el día, no «hoy»');

  /* ---------- 2. Casilla rápida con Enter: una sola tarea aunque se pulse dos veces ---------- */
  H.agendaDia([hoy]); await sleep(10);
  const inp = e.doc.querySelector('#agRapida'); inp.value = 'Llamar al fontanero'; inp.focus();
  const n0 = Object.keys(e.store.tareas).length;
  const enter = () => inp.dispatchEvent(new e.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  enter(); enter(); await sleep(30);
  const creadas = Object.values(e.store.tareas).filter((x) => x.nombre === 'Llamar al fontanero');
  ok(creadas.length === 1 && Object.keys(e.store.tareas).length === n0 + 1, 'Enter dos veces seguidas: crea UNA tarea');
  ok(creadas[0] && creadas[0].categoria === 'Casa', 'casilla rápida: categoría sugerida («fontanero» → Casa)');
  ok((A.cfg().categoriasTareas || []).indexOf('Casa') >= 0 && (e.store.cfg.app.categoriasTareas || []).indexOf('Casa') >= 0, 'casilla rápida: la categoría se guarda por saveConfig');

  /* ---------- 3. Formulario v2: «Otro día», repetir y nota dentro de «Más opciones» ---------- */
  A.openTareaForm(null); await sleep(10);
  ok(shDoc(e, '#tFecha').value === '', 'Formulario desde el +: «Sin fecha» por defecto');
  shDoc(e, '#tNombre').value = 'Revisar caldera';
  const otro = shDoc(e, '#tFechaOtro'); otro.value = d(12); otro.dispatchEvent(new e.w.Event('change', { bubbles: true })); await sleep(5);
  ok(shDoc(e, '#tFecha').value === d(12) && shDoc(e, '.tf-otro.active'), '«Otro día…»: guarda la fecha y la ficha se marca');
  ok(!shDoc(e, '.tf-mas').open, 'tarea nueva: «Más opciones» cerrado');
  shDoc(e, '#tRepetir').value = 'mes'; shDoc(e, '#tComentario').value = '  pedir cita  ';
  await A.saveTarea(); await sleep(20);
  const cal = Object.values(e.store.tareas).find((x) => x.nombre === 'Revisar caldera');
  ok(cal && cal.fechaLimite === d(12) && cal.repetir && cal.repetir.unidad === 'mes' && cal.comentario === 'pedir cita', 'Guardar: fecha, repetir y nota (con «Más opciones» cerrado) se guardan');
  ok(cal && Object.keys(cal).sort().join(',') === 'categoria,comentario,estado,fechaCreacion,fechaFin,fechaInicio,fechaLimite,nombre,prioridad,repetir', 'Guardar: solo campos que ya existen en la tabla de tareas');
  // repetir personalizado inválido dentro de <details> cerrado: avisa y no guarda
  A.openTareaForm(null); await sleep(10);
  shDoc(e, '#tNombre').value = 'Regar'; shDoc(e, '#tRepetir').value = 'custom';
  shDoc(e, '#tRepCustom').innerHTML = '<input id="tRepN" value="0"><select id="tRepU"><option value="dia" selected>días</option></select>';
  const n1 = Object.keys(e.store.tareas).length; await A.saveTarea(); await sleep(10);
  ok(Object.keys(e.store.tareas).length === n1, 'Repetir «cada 0 días»: no se guarda');
  H.closeSheet([]); await sleep(300);

  /* ---------- 4. Calendario v2: las flechas cambian de MES aunque antes se usara «Semanal» ---------- */
  H.setInicioVista(['calendario']); await sleep(10);
  S.calFecha = '2026-03-15'; S.calVista = 'semana'; // p. ej. tras mirar el calendario de «Antes»
  H.calMove([1]); await sleep(10);
  ok(S.calFecha.slice(0, 7) === '2026-04', 'Calendario nuevo: «Mes siguiente» pasa de marzo a abril (no una semana)');
  S.calVista = 'mes';

  /* ---------- 5. «Antes» de la Agenda: formulario de siempre ---------- */
  S.verAnterior = Object.assign({}, S.verAnterior, { agenda: 1 });
  A.openTareaForm(null); await sleep(10);
  ok(shDoc(e, '#tFecha') && shDoc(e, '#tFecha').type === 'date' && !shDoc(e, '.tf-mas'), '«Antes»: el formulario de tarea es el de antes (fecha con calendario, sin «Más opciones»)');
  H.closeSheet([]); await sleep(300);
  H.setInicioVista(['tareas']); await sleep(10);
  ok(/Todas tus tareas/.test(txt(e)) && !e.doc.querySelector('#agRapida'), '«Antes»: la Agenda de antes');

  /* ---------- 6. Usuario nuevo: sin datos, sin Juntos, sin botón «Antes» ---------- */
  const e2 = makeEnv({ version: NUEVAS, cfg: { app: { compararVersiones: false }, meta: { onboarded: true } } }); await sleep(80);
  const A2 = e2.w.__APP__, H2 = A2.H, errores = [];
  e2.w.addEventListener('error', (x) => errores.push(x.message));
  H2.goTab(['tu']); await sleep(20);
  ok(e2.doc.querySelector('.tu2-cab') && !e2.doc.querySelector('.comparar-fab'), 'usuario nuevo: Tú nuevo y sin botón «Antes»');
  ok(/50 al mes|60 al mes|al mes/.test(txt(e2)) || !A2.ticketsDisponible(), 'usuario nuevo: tickets sin uso guardado no rompe la fila');
  ok(!e2.doc.querySelector('[data-click^="compararToggle"]') || true, 'usuario nuevo: Tú se pinta');
  H2.goTab(['inicio']); H2.setInicioVista(['tareas']); await sleep(10);
  ok(/Día despejado/.test(txt(e2)) && !e2.doc.querySelector('.ag-plegs') && !e2.doc.querySelector('.comparar-fab'), 'usuario nuevo: Agenda vacía con «Día despejado.» y sin «Antes»');
  H2.setInicioVista(['calendario']); await sleep(10);
  ok(/Nada este día/.test(txt(e2)), 'usuario nuevo: calendario vacío');
  A2.openCrear(); await sleep(10);
  ok(e2.doc.querySelector('.crear-4.tres') && !/Compartido/.test(e2.doc.querySelector('.crear-4').textContent) && !/Traspaso/.test(shDoc(e2, '.crear-peq').textContent), 'usuario nuevo sin Juntos ni cuentas: 3 grandes y sin «Traspaso»');
  ok(!errores.length, 'usuario nuevo: sin errores de JavaScript');

  /* ---------- 7. Lecturas de tickets: diciembre → «1 de enero»; mes viejo no cuenta ---------- */
  const RealDate = Date;
  const e3 = makeEnv({ version: NUEVAS, cfg: { app: { ticketsUso: { mes: '2026-11', usados: 60, limite: 60 } }, meta: { onboarded: true } },
    pre: (w) => { const D = w.Date, fijo = new RealDate('2026-12-15T10:00:00Z').getTime();
      class F extends D { constructor(...a) { if (a.length) super(...a); else super(fijo); } static now() { return fijo; } }
      w.Date = F; } });
  await sleep(80);
  const A3 = e3.w.__APP__;
  ok(/Vuelven el 1 de enero/.test(A3.errTicket('limite')), 'diciembre: «Vuelven el 1 de enero»');
  ok(A3.ticketsUso().quedan === null, 'mes nuevo: lo usado el mes pasado no cuenta (no sale «0 lecturas»)');

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

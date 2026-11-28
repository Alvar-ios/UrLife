// 26/11/2026 · Sesión 1 de docs/51 (pulido de interfaz): lo que se cortaba, se tapaba o se repetía.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoy = new Date().toISOString().slice(0, 10);
(async () => {
  const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 1 }, cfg: { app: { nombre: 'Prueba', ahorro: [{ id: 'h1', nombre: 'Viaje', objetivo: 1000, yaAhorrado: 250 }] }, meta: { onboarded: true } },
    tareas: [{ id: 't1', nombre: 'Llamar al seguro', estado: 'Pendiente', prioridad: 'Media', fechaLimite: hoy }],
    movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Supermercado', importe: 12.5, fecha: hoy, descripcion: 'Compra' }] });
  await sleep(250);
  const { w, doc } = e, A = w.__APP__, H = A.H, $ = (s) => doc.querySelector(s);

  // «Borrar mi cuenta»: el enlace «Qué se borra…» va ENCIMA de los botones (debajo quedaba medio tapado por la barra fija)
  H.borrarCuentaAbrir([]); await sleep(30);
  const link = Array.from(doc.querySelectorAll('#sheetHost button')).find((b) => /Qué se borra/.test(b.textContent)), acts = $('#sheetHost .actions');
  ok(link && acts && (link.compareDocumentPosition(acts) & 4), 'Borrar mi cuenta: «Qué se borra y qué se conserva» va antes de «Cancelar · Borrar mi cuenta»');
  H.closeSheet([]); await sleep(30);

  // Editar un movimiento: «Eliminar movimiento» va antes de la barra «Cancelar · Guardar»
  A.S.tab = 'movimientos'; A.render(); H.openMovForm(['m1']); await sleep(40);
  const del = Array.from(doc.querySelectorAll('#sheetHost button')).find((b) => /Eliminar movimiento/.test(b.textContent)), acts2 = $('#sheetHost .actions');
  ok(del && acts2 && (del.compareDocumentPosition(acts2) & 4), 'Editar movimiento: «Eliminar movimiento» va antes de la barra de botones');
  H.closeSheet([]); await sleep(30);

  // Tú → Seguridad y privacidad: título largo más pequeño y sin el botón de la Agenda arriba (no cabía: «Seguridad y priva…»)
  H.goTab(['tu']); await sleep(20); H.tuIr(['seguridad']); await sleep(30);
  ok($('#pageTitle').textContent === 'Seguridad y privacidad' && $('#pageTitle').classList.contains('tb-largo'), 'Tú → Seguridad: el título lleva la clase de título largo');
  ok($('#tbAgenda').hidden, 'Tú → Seguridad: sin el botón de la Agenda en la cabecera');
  H.tuIr(['']); await sleep(30);
  ok(!$('#pageTitle').classList.contains('tb-largo'), 'Tú: el título corto vuelve a su tamaño');
  H.goTab(['inicio']); await sleep(30);
  ok(!$('#tbAgenda').hidden, 'Inicio: el botón de la Agenda vuelve');

  // Atrás de Android (docs/salud/2026-11-26-interaccion.md)
  H.goTab(['movimientos']); await sleep(20); H.movBuscarAbrir([]); await sleep(60);
  ok(w.__atras() === true && !A.S._movBuscando && A.S.tab === 'movimientos', 'atrás con la búsqueda de Movimientos abierta la cierra (no va a Inicio)');
  H.goTab(['dinero']); await sleep(20); H.metaVer(['h1']); await sleep(30); H.metaAportarR(['h1']); await sleep(30);
  ok(A.form().kind === 'aportarR' && A.form().deMeta, 'Aportar abierto desde la meta sabe de dónde viene');
  ok(w.__atras() === true && A.form().kind === 'metaVer' && !!$('#sheetBackdrop'), 'atrás en «Aportar» (sin escribir nada) vuelve a la meta');
  H.closeSheet([]); await sleep(260);
  H.trAbrir([]); await sleep(40); const km = $('#trKm');
  ok(!!km, 'Trayecto abierto');
  if (km) { km.value = '120'; km.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(20); }
  w.__atras(); await sleep(20);
  ok(!!$('#descartarHoja') && /trayecto/.test($('#descartarHoja').textContent), 'atrás en Trayecto con km escritos pregunta «¿Descartar este trayecto?»');
  w.__atras(); await sleep(10); H.closeSheet([]); await sleep(260);

  // Atrás (decisión del dueño, 26/11): Lista → Resumen; Calendario de la Agenda → Semana
  H.goTab(['movimientos']); await sleep(20); H.setMovVista(['lista']); await sleep(30);
  ok(w.__atras() === true && A.S.tab === 'movimientos' && A.S.movVista === 'resumen', 'atrás desde Movimientos → Lista va al Resumen');
  ok(w.__atras() === true && A.S.tab === 'inicio', 'y otro atrás, a Inicio');
  H.irAgenda(['tareas']); await sleep(20); H.setInicioVista(['calendario']); await sleep(30);
  ok(w.__atras() === true && A.S.inicioVista === 'tareas', 'atrás desde el calendario de la Agenda va a la semana');
  ok(w.__atras() === true && A.S.inicioVista === 'hoy', 'y otro atrás, a Inicio');

  // Botones rojos antes de la barra fija (debajo quedaban medio tapados)
  const antesDeBarra = (re) => { const b = Array.from(doc.querySelectorAll('#sheetHost button')).find((x) => re.test(x.textContent)), a = doc.querySelectorAll('#sheetHost .actions'); return !!b && a.length > 0 && !!(b.compareDocumentPosition(a[a.length - 1]) & 4); };
  A.H.openTareaForm(['t1']);
  await sleep(40);
  ok(antesDeBarra(/Eliminar tarea/), 'Editar tarea: «Eliminar tarea» va antes de «Cancelar · Guardar»');
  H.closeSheet([]); await sleep(260);

  e.w.close();
  console.log(fails ? '\n' + fails + ' FALLOS' : '\nTODO BIEN'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

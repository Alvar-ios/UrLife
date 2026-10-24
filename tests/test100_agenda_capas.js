// 24/10 (docs/19, opción A): botón de Agenda arriba con lo de hoy y un solo calendario con dos capas. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const _d = new Date(), hoy = _d.getFullYear() + '-' + String(_d.getMonth() + 1).padStart(2, '0') + '-' + String(_d.getDate()).padStart(2, '0'); // fecha local
(async () => {
  const e = makeEnv({ version: { agenda: 0 },
    movs: [{ id: 'g1', tipo: 'Gasto', categoria: 'Otros', importe: 12, fecha: hoy }], cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(250);
  const A = e.w.__APP__, H = A.H, doc = e.doc;
  A.S.tareas = [{ id: 't1', nombre: 'Comprar pan', fechaLimite: hoy, estado: 'Pendiente' }, { id: 't2', nombre: 'Hecha', fechaLimite: hoy, estado: 'Completado' }]; H.goTab(['inicio']); await sleep(20);
  ok(A.agendaHoyN() === 1, 'cuenta solo lo de hoy sin hacer');
  const b = doc.querySelector('#tbAgenda');
  ok(b && !doc.querySelector('#tbAgendaN').hidden && doc.querySelector('#tbAgendaN').textContent === String(A.agendaHoyN()), 'botón de Agenda arriba con el número de cosas de hoy (' + doc.querySelector('#tbAgendaN').textContent + ')');
  b.click(); await sleep(20);
  ok(/Agenda/.test(doc.querySelector('#pageTitle').textContent) && doc.querySelector('#tbAgenda').classList.contains('on'), 'tocarlo abre la Agenda y queda marcado');
  H.irAgenda(['calendario']); await sleep(20);
  ok(doc.querySelector('.cal-capas') && /Planes y tareas/.test(doc.querySelector('.cal-capas .active').textContent) && !/Movimientos/.test(doc.querySelector('.cal2-ley').textContent), 'calendario de la Agenda: capa «Planes y tareas» y sin el filtro «Movimientos»');
  H.calCapa(['dinero']); await sleep(20);
  ok(A.S.tab === 'movimientos' && A.S.movVista === 'calendario' && /Dinero/.test(doc.querySelector('.cal-capas .active').textContent), '«Dinero» lleva al calendario de Movimientos, con la capa marcada');
  H.calCapa(['planes']); await sleep(20);
  ok(/Agenda/.test(doc.querySelector('#pageTitle').textContent) && doc.querySelector('.cal2-grid'), 'y «Planes y tareas» vuelve a la Agenda');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

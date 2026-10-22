// Pulido de interfaz (22/10/2026, docs/11-auditoria-interfaz.md). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 }, movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Comida', importe: 5, fecha: '2026-10-01' }], cfg: { app: { nombre: 'Lucía' }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, S = A.S, hoy = A.todayISO();
  S.tareas = [{ id: 't1', nombre: 'Llamar al casero', estado: 'Pendiente', prioridad: 'Alta', fechaLimite: hoy }, { id: 't2', nombre: 'Algo hecho', estado: 'Completado', prioridad: 'Media', fechaLimite: hoy }];
  H.goTab(['inicio']); await sleep(20);
  const c = () => e.doc.querySelector('#content').textContent.replace(/\s+/g, ' ');
  ok(/Llamar al casero/.test(c()) && /Hoy · Tarea/.test(c()) && !/Algo hecho/.test(c()), 'Inicio · Estos días: salen las tareas que vencen hoy (no las hechas)');
  H.setInicioVista(['tareas']); await sleep(10);
  ok(e.doc.querySelector('#pageTitle').textContent === 'Agenda', 'la Agenda se titula «Agenda»');
  const fila = [...e.doc.querySelectorAll('#content .row')].find((r) => /Llamar al casero/.test(r.textContent));
  ok(fila && !/Para el/.test(fila.textContent) && fila.querySelector('.tarea-alta'), 'Agenda · día: sin «Para el …» repetido y con la bandera de prioridad alta');
  H.setInicioVista(['hoy']); await sleep(10);
  ok(e.doc.querySelector('#pageTitle').textContent === 'Inicio', 'al volver, el título es «Inicio»');
  H.crearIr(['ingreso']); await sleep(20);
  const t = () => (e.doc.querySelector('#movFormTit') || {}).textContent;
  ok(t() === 'Nuevo ingreso', 'formulario: «Nuevo ingreso» si vienes de Ingreso');
  H.pickTipo(['Gasto']); await sleep(10);
  ok(t() === 'Nuevo gasto', 'formulario: el título cambia al cambiar el tipo');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

// Reglas nuevas de los recurrentes, el selector «¿Cuándo?» y los festivos (23/10/2026, docs/15 3.3). Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Vivienda' }], ingresos: ['Nómina'], cobros: [{ nombre: 'Nómina', importe: 1500, regla: { t: 'ultHabil' } }] }, meta: { onboarded: true } } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost'), oc = (r, a, b) => A.ocurrencias(r, a, b);
  // reglas (octubre 2026: el 31 es sábado; noviembre 2026: el 30 es lunes)
  ok(oc({ t: 'habilFin', n: 2 }, '2026-10-01', '2026-10-31').join() === '2026-10-29', 'penúltimo día hábil de octubre 2026: jueves 29');
  ok(oc({ t: 'habil', n: 3 }, '2026-10-01', '2026-10-31').join() === '2026-10-05', 'tercer día hábil de octubre 2026: lunes 5');
  ok(oc({ t: 'diasMes', dias: [1, 15], ajuste: '' }, '2026-11-01', '2026-11-30').join() === '2026-11-01,2026-11-15', 'dos días al mes: 1 y 15');
  ok(oc({ t: 'dias', cada: 28, ancla: '2026-10-01' }, '2026-10-01', '2026-12-31').join() === '2026-10-01,2026-10-29,2026-11-26,2026-12-24', 'cada 28 días');
  ok(oc({ t: 'nesimo', n: -2, dow: 4 }, '2026-10-01', '2026-10-31').join() === '2026-10-23', 'penúltimo viernes de octubre 2026: 23');
  ok(A.reglaTexto({ t: 'dia', dia: 31 }) === 'El último día de cada mes' && A.reglaTexto({ t: 'habilFin', n: 2 }) === 'El penúltimo día hábil del mes' && A.reglaTexto({ t: 'dias', cada: 28 }) === 'Cada 28 días', 'textos de las reglas');
  // selector
  H.goTab(['tu']); await sleep(10); H.openRecurrentes([]); await sleep(10);
  ok(/Festivos/.test(sh().textContent) && /solo fines de semana/.test(sh().textContent), 'la lista de recurrentes tiene la fila «Festivos» (apagada)');
  H.recEditar(['cobro', '0']); await sleep(10);
  ok(sh().querySelector('#recCampo') && !sh().querySelector('#recTipo'), 'el campo «¿Cuándo?» ya no es un desplegable');
  H.recCuando([]); await sleep(10);
  ok(/CADA MES/.test(sh().textContent) && /OTRO RITMO/.test(sh().textContent) && sh().querySelector('.rec-op.on') && /último día hábil/i.test(sh().querySelector('.rec-op.on').textContent), 'tarjetas en dos grupos con la regla actual marcada');
  H.recCuandoTipo(['habilFin']); await sleep(5);
  ok(sh().querySelectorAll('.rec-prox-f').length === 3, 'abajo, las 3 próximas fechas');
  H.recCuandoUsar([]); await sleep(5);
  ok(/penúltimo día hábil/.test(sh().querySelector('#recCampo').textContent), 'vuelve al editor con la regla nueva');
  click(e, 'recGuardar'); await sleep(30);
  ok(e.store.cfg.app.cobros[0].regla.t === 'habilFin' && e.store.cfg.app.cobros[0].regla.n === 2, 'se guarda «penúltimo día hábil»');
  // festivos: con tus fiestas locales (la tabla del BOE va aparte)
  H.festivosAbrir([]); await sleep(10);
  H.festivosOn([]); await sleep(5); H.festivosZona(['MD']); await sleep(5);
  ok(sh().querySelectorAll('.fest-loc input').length === 4, 'fiestas locales: 2 por año (este y el siguiente)');
  const inp = sh().querySelectorAll('.fest-loc input')[0]; inp.value = '2026-10-29'; inp.dispatchEvent(new e.w.Event('change', { bubbles: true })); await sleep(5);
  await H.festivosGuardar([]); await sleep(30);
  ok(e.store.cfg.app.festivos && e.store.cfg.app.festivos.on && e.store.cfg.app.festivos.zona === 'MD' && (e.store.cfg.app.festivos.locales[2026] || []).join() === '2026-10-29', 'se guarda la zona y la fiesta local');
  ok(oc({ t: 'habilFin', n: 2 }, '2026-10-01', '2026-10-31').join() === '2026-10-28', 'con el 29 festivo, el penúltimo hábil pasa al 28');
  ok(oc({ t: 'dia', dia: 29, ajuste: 'despues' }, '2026-10-01', '2026-10-31').join() === '2026-10-30', '«si cae en festivo, el hábil después»: del 29 al 30');
  ok(oc({ t: 'priHabil' }, '2026-11-01', '2026-11-30').join() === '2026-11-03', 'Madrid 2026: el 1 de noviembre es domingo y el lunes 2 es festivo → primer hábil, el 3 (tabla del BOE)');
  ok(oc({ t: 'ultHabil' }, '2026-12-01', '2026-12-31').join() === '2026-12-31', 'último hábil de diciembre 2026: jueves 31');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

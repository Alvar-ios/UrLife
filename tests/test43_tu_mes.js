// Fase 4 · Inicio (17/10/2026): «Tu mes» (del 1 al 31 o desde el día que cobras), lo previsto y el Inicio nuevo.
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const hace = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
async function env(app, movs, pre) {
  const e = makeEnv({ cfg: { app: Object.assign({ categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'] }, app || {}), meta: { onboarded: true } },
    movs: movs || [], url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre });
  await sleep(150); return e;
}
const txt = (e) => e.doc.querySelector('#content').textContent.replace(/\s+/g, ' ');
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
(async () => {
  /* 1. La pieza común: a qué mes pertenece cada fecha */
  let e = await env({ mesInicio: { modo: 'cobro', dia: 28 } }); let A = e.w.__APP__;
  // 28 sep 2026 es lunes: desde ese día ya es «octubre»
  ok(A.mesDe('2026-09-27') === '2026-09' && A.mesDe('2026-09-28') === '2026-10' && A.mesDe('2026-10-27') === '2026-10' && A.mesDe('2026-10-28') === '2026-11', 'desde que cobro (día 28): el 28 de septiembre ya es octubre y el 27 de octubre todavía también');
  // 28 nov 2026 es sábado: el mes empieza el viernes 27
  ok(A.mesDe('2026-11-26') === '2026-11' && A.mesDe('2026-11-27') === '2026-12', 'si el día de cobro cae en fin de semana, el mes empieza el viernes anterior');
  ok(A.mesDe('2026-12-28') === '2027-01' && A.rangoMes(2027, 1).desde === '2026-12-28' && A.rangoMes(2027, 1).hasta === '2027-01-27', 'cambio de año: lo del 28 de diciembre ya es enero del año siguiente');
  const r = A.rangoMes(2026, 10); ok(r.desde === '2026-09-28' && r.hasta === '2026-10-27', 'octubre va del 28 sep al 27 oct');
  e = await env({ mesInicio: { modo: 'cobro', dia: 31 } }); A = e.w.__APP__;
  ok(A.rangoMes(2026, 3).desde === '2026-02-27' && A.rangoMes(2026, 3).hasta === '2026-03-30', 'cobro el 31: en febrero se usa el último día (28, sábado → viernes 27)');
  e = await env({}); A = e.w.__APP__;
  ok(A.mesDe('2026-09-28') === '2026-09' && A.rangoMes(2026, 2).hasta === '2026-02-28', 'sin ajuste: el mes de siempre, del 1 al 31');

  /* 2. Los números del mes siguen el ajuste, sin tocar ningún movimiento */
  const ini = A.mesActual(), movs = [{ id: 'n1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1800, fecha: hace(2) }, { id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 100, fecha: hace(1) }];
  e = await env({}, movs); A = e.w.__APP__;
  const natural = A.kpisMes(A.mesActual().y, A.mesActual().m).disponible;
  const diaCobro = Number(hace(2).slice(8, 10));
  e = await env({ mesInicio: { modo: 'cobro', dia: diaCobro >= 2 ? diaCobro : 2 } }, movs); A = e.w.__APP__;
  ok(A.mesActual() && Object.keys(e.store.movimientos).length === 2 && e.store.movimientos.n1.fecha === hace(2), 'cambiar «tu mes» no cambia ninguna fecha ni movimiento');
  ok(natural === 1700 || natural === -100 || natural === 1800, 'mes natural calculado (' + natural + ')');

  /* 3. Inicio: dos bloques, la píldora del mes y «Estos días» */
  e = await env({ mesInicio: { modo: 'cobro', dia: 28 } }, [{ id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 50, fecha: hace(1) }]); A = e.w.__APP__;
  ok(!!e.doc.querySelector('.hero2 [data-click="tuMesAbrir"]') && /desde el /.test(e.doc.querySelector('.mes-pill').textContent), 'la tarjeta enseña el mes y desde cuándo cuenta');
  ok(!e.doc.querySelector('.hero-tile') && !!e.doc.querySelector('.hero-bar') && !e.doc.querySelector('.inicio-seg') && !e.doc.querySelector('.prox-scroll'), 'Inicio: sin las tres cifras ni el selector de arriba; la barra vuelve (lo pidió Paloma, 17/10)');
  ok(/Estos días/.test(txt(e)) && !!e.doc.querySelector('.dias-tit [data-click="setInicioVista|tareas"]'), '«Estos días» con «Agenda ›»');
  click(e, 'setInicioVista', 'tareas'); await sleep(10);
  ok(!!e.doc.querySelector('[data-click="setInicioVista|hoy"]') && /Semana y tareas/.test(txt(e)), 'la Agenda se abre y tiene «‹ Inicio» para volver');
  click(e, 'setInicioVista', 'hoy'); await sleep(10);

  /* 4. La hoja «Tu mes» */
  click(e, 'tuMesAbrir'); await sleep(10);
  ok(/Tu mes/.test(sh(e)) && /Del 1 al 31/.test(sh(e)) && /Desde el día que cobro/.test(sh(e)) && !!e.doc.querySelector('#fTuMesDia'), 'la hoja ofrece las dos opciones y el día de cobro');
  click(e, 'tuMesModo', 'natural'); await sleep(10); click(e, 'tuMesGuardar'); await sleep(30);
  ok(e.store.cfg.app.mesInicio.modo === 'natural' && /del 1 al/.test(e.doc.querySelector('.mes-pill').textContent), 'cambiar a «del 1 al 31» se guarda y se ve al momento');
  click(e, 'tuMesAbrir'); await sleep(10); click(e, 'tuMesModo', 'cobro'); await sleep(10);
  const sel = e.doc.querySelector('#fTuMesDia'); sel.value = '25'; sel.dispatchEvent(new e.w.Event('change', { bubbles: true })); await sleep(10);
  click(e, 'tuMesGuardar'); await sleep(30);
  ok(e.store.cfg.app.mesInicio.modo === 'cobro' && e.store.cfg.app.mesInicio.dia === 25, 'y volver a «desde que cobro» con otro día');
  A.H.goTab(['tu']); await sleep(10);
  ok(/Tu mes/.test(txt(e)) && /desde el día 25/.test(txt(e)), 'en Tú también está «Tu mes»');

  /* 5. Lo previsto: solo si falta un cobro, y se explica de dónde sale */
  const manana = Number(hace(-1).slice(8, 10)), ayer = Number(hace(1).slice(8, 10));
  const fijos = { cobros: [{ nombre: 'Nómina', importe: 1800, regla: { t: 'dia', dia: manana, ajuste: '' }, desde: hace(40) }], facturas: [{ nombre: 'Luz', importe: 55, regla: { t: 'dia', dia: manana, ajuste: '' }, desde: hace(40) }] };
  e = await env(fijos, [{ id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 100, fecha: hace(0) }]); A = e.w.__APP__;
  const ma = A.mesActual(), pv = A.previstoMes(ma.y, ma.m), mismoMes = hace(-1).slice(0, 7) === hace(0).slice(0, 7);
  if (mismoMes) {
    ok(pv && pv.total === -100 + 1800 - 55, 'previsto = te queda hoy + nómina − luz (' + (pv && pv.total) + ')');
    ok(!!e.doc.querySelector('.hero-prev, .h2-dato.prev') && /Previsto/.test(e.doc.querySelector('.hero-prev, .h2-dato.prev').textContent), 'la línea «Previsto» sale aparte, no en la cifra grande');
    ok(/-100,00|−100,00/.test(e.doc.querySelector('.hero2 .hero-v').textContent), 'la cifra grande es la real (lo apuntado)');
    click(e, 'previstoAbrir'); await sleep(10);
    ok(/Te queda hoy/.test(sh(e)) && /\+ Nómina/.test(sh(e)) && /− Luz/.test(sh(e)) && /no un dato real/.test(sh(e)) && /puede variar/.test(sh(e)), 'al tocarla se ve el desglose y que es una previsión');
    A.H.closeSheet([]); await sleep(260);
  } else console.log('INFO mañana es otro mes: se salta la parte de lo previsto');
  e = await env({ facturas: fijos.facturas }, [{ id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 100, fecha: hace(0) }]); A = e.w.__APP__;
  ok(!e.doc.querySelector('.hero-prev'), 'sin cobros pendientes no sale «Previsto» (solo pagos no cuenta)');

  /* 6. De la cifra grande al Resumen, con la explicación */
  click(e, 'heroResumen'); await sleep(20);
  ok(A.S.tab === 'movimientos' && A.S.movVista === 'resumen' && /Así sale «Te queda este mes»/.test(txt(e)), 'tocar la cifra lleva al Resumen con la tarjeta que explica de dónde sale');
  ok(/Apartado e invertido/.test(txt(e)) && /Te queda/.test(txt(e)), 'el Resumen enseña ingresos, gastos, apartado e invertido y lo que queda');
  click(e, 'infoTeQuedaCerrar'); await sleep(10);
  ok(!/Así sale/.test(txt(e)), '«Entendido» la quita');

  /* 6b. Arreglos de la revisión de Calidad */
  e = await env({ mesInicio: { modo: 'cobro', dia: 5 } }); A = e.w.__APP__;
  ok(A.mesDe('2026-10-05') === '2026-10' && A.mesDe('2026-11-04') === '2026-10' && A.rangoMes(2026, 10).desde === '2026-10-05' && A.rangoMes(2026, 10).hasta === '2026-11-04', 'cobro a principio de mes (día 5): «octubre» va del 5 oct al 4 nov, no se llama «noviembre»');
  ok(A.mesDe('2026-12-31') === '2026-12' && A.mesDe('2027-01-04') === '2026-12' && A.rangoMes(2026, 12).hasta === '2027-01-04', 'y cruza bien el año');
  const hoyD = Number(hace(0).slice(8, 10));
  if (hoyD >= 3) {
    const viejo = { cobros: [{ nombre: 'Nómina', importe: 1800, regla: { t: 'dia', dia: hoyD - 2, ajuste: '' }, desde: hace(0) }, { nombre: 'Extra', importe: 100, regla: { t: 'dia', dia: Math.min(28, hoyD + 1), ajuste: '' }, desde: hace(40) }],
      facturas: [{ nombre: 'Agua', regla: { t: 'dia', dia: Math.min(28, hoyD + 1), ajuste: '' }, desde: hace(40) }] };
    e = await env(viejo, []); A = e.w.__APP__;
    const ma2 = A.mesActual(), pv2 = A.previstoMes(ma2.y, ma2.m);
    ok(!pv2 || !pv2.items.some((x) => x.nombre === 'Nómina'), 'un cobro fijo recién creado no cuenta su fecha de este mes que ya pasó');
    if (pv2) { A.H.previstoAbrir([]); await sleep(10); ok(/Agua: sin importe guardado, no se cuenta/.test(sh(e)), 'los pagos fijos sin importe se avisan en el desglose'); A.H.closeSheet([]); await sleep(260); }
  }

  /* 7. Usuario nuevo y bienvenida */
  e = await env({}, []); A = e.w.__APP__;
  ok(/Apunta lo que cobras y lo que gastas/.test(txt(e)) && e.doc.querySelectorAll('.empieza-paso').length === 2, 'usuario nuevo: una frase y dos pasos');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

// A5 (23/10/2026, docs/14): «Tu mes» desde que llega la nómina de verdad. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), hoy = iso(d);
const RealDate = Date, fijar = (h) => (w) => { const D = w.Date, f = new RealDate(h + 'T10:00:00').getTime(); class F extends D { constructor(...a) { if (a.length) super(...a); else super(f); } static now() { return f; } } w.Date = F; };
const mas = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return iso(x); };
(async () => {
  // 1. regla fija: último día hábil; agosto llegó antes (28), septiembre el día (30)
  const movs = [{ id: 'n1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1850, fecha: '2026-08-28' }, { id: 'n2', tipo: 'Ingreso', categoria: 'Nómina', importe: 1850, fecha: '2026-09-30' },
    { id: 'g1', tipo: 'Gasto', categoria: 'Otros', importe: 10, fecha: '2026-08-29' }];
  const e = makeEnv({ movs, pre: fijar('2026-10-23'), cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], ingresos: ['Nómina'], cobros: [{ nombre: 'Nómina', importe: 1850, regla: { t: 'ultHabil' }, desde: '2026-06-01' }], mesInicio: { modo: 'cobro', dia: 28, nomina: 'Nómina' } }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost');
  {
    ok(A.mesDe('2026-08-28') === '2026-09' && A.mesDe('2026-08-29') === '2026-09', 'la nómina llegó el 28 de agosto: desde ese día ya es «septiembre»');
    ok(A.mesDe('2026-08-27') === '2026-08', 'el 27 todavía era agosto');
    const r9 = A.rangoMes(2026, 9);
    ok(r9.desde === '2026-08-28' && r9.hasta === '2026-09-29', 'septiembre va del 28 ago al 29 sep (' + r9.desde + ' – ' + r9.hasta + ')');
    const r10 = A.rangoMes(2026, 10);
    ok(r10.desde === '2026-09-30' && r10.hasta === '2026-10-29' && r10.previsto, 'octubre empezó el 30 sep y su final (29 oct) es una previsión');
  }
  H.tuMesAbrir([]); await sleep(10);
  ok(/Desde que llega mi nómina/.test(sh().textContent) && /Desde un día fijo/.test(sh().textContent) && sh().querySelector('.tumes-op.on') && /nómina/.test(sh().querySelector('.tumes-op.on').textContent), 'Tu mes: la opción nueva, elegida, y «Desde un día fijo»');
  ok(/Previsto/.test(sh().textContent) && /es una previsión/.test(sh().textContent), 'enseña cuándo empezó y la siguiente como «Previsto»');
  ok(/desde el 30 sep/.test(A.rangoTxt(2026, 10)), 'el mes en curso, con final previsto, se escribe «desde el 30 sep»');
  H.closeSheet([]); await sleep(300);
  // renombrar el cobro fijo: «Tu mes» lo sigue
  H.recEditar(['cobro', 0]); await sleep(20); const rn = doc.querySelector('#recNombre'); if (rn) { rn.value = 'Sueldo'; H.recGuardar([]); await sleep(50); }
  ok(rn && A.cfg().mesInicio.nomina === 'Sueldo', 'renombrar el cobro «Nómina» a «Sueldo» también lo cambia en «Tu mes» (' + (A.cfg().mesInicio || {}).nomina + ')');
  H.closeSheet([]); await sleep(300);
  // 2. cobro que no es mensual (cada 30 días): el retraso ya lo prueba test92
  const movs2 = [{ id: 'a', tipo: 'Ingreso', categoria: 'Sueldo', importe: 1000, fecha: mas(-63) }, { id: 'b', tipo: 'Ingreso', categoria: 'Sueldo', importe: 1000, fecha: mas(-33) }];
  const e2 = makeEnv({ movs: movs2, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], ingresos: ['Sueldo'], cobros: [{ nombre: 'Sueldo', importe: 1000, regla: { t: 'dias', cada: 30, ancla: mas(-3) }, desde: mas(-100) }], mesInicio: { modo: 'cobro', dia: 20, nomina: 'Sueldo' } }, meta: { onboarded: true } } });
  await sleep(200);
  const B = e2.w.__APP__;
  // un cobro «cada 30 días» no es de una vez al mes: «Tu mes» sigue con el día fijo guardado (20) y la hoja lo explica
  const k20 = B.mesDe(hoy), r20 = B.rangoMes(+k20.slice(0, 4), +k20.slice(5, 7));
  ok(Number(r20.desde.slice(8, 10)) >= 18 && Number(r20.desde.slice(8, 10)) <= 20 && !r20.previsto, 'cobro «cada 30 días»: no sirve como nómina, sigue el día fijo 20 (' + r20.desde + ')');
  B.H.tuMesAbrir([]); await sleep(5);
  ok(/una vez al mes/.test(e2.doc.querySelector('#sheetHost').textContent), 'la hoja explica que la nómina tiene que llegar una vez al mes');
  // 3. sin cobro fijo: aviso para añadirlo
  const e3 = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(200);
  e3.w.__APP__.H.tuMesAbrir([]); await sleep(5); e3.w.__APP__.H.tuMesModo(['nomina']); await sleep(5);
  ok(/Primero añade tu nómina/.test(e3.doc.querySelector('#sheetHost').textContent), 'sin cobro fijo: «Primero añade tu nómina como cobro fijo»');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

// Calidad · A5 «Tu mes» desde que llega la nómina, segundo repaso (23/10/2026), tras los arreglos de 5819437.
// Fecha de hoy fijada en cada caso. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const RealDate = Date;
const fijar = (hoy) => (w) => { const D = w.Date, f = new RealDate(hoy + 'T10:00:00').getTime();
  class F extends D { constructor(...a) { if (a.length) super(...a); else super(f); } static now() { return f; } } w.Date = F; };
const dias = (a, b) => { const out = []; for (let t = new RealDate(a + 'T12:00:00Z').getTime(), e = new RealDate(b + 'T12:00:00Z').getTime(); t <= e; t += 864e5) out.push(new RealDate(t).toISOString().slice(0, 10)); return out; };
const BASE = { categoriasGasto: [{ nombre: 'Otros' }], ingresos: ['Nómina'] };
const nom = (id, fecha, importe) => ({ id, tipo: 'Ingreso', categoria: 'Nómina', importe: importe || 1000, fecha });
const gasto = (id, fecha) => ({ id, tipo: 'Gasto', categoria: 'Otros', importe: 5, fecha });
async function env(hoy, app, movs, extra) {
  const e = makeEnv(Object.assign({ movs: movs || [], pre: fijar(hoy), cfg: { app: Object.assign({}, BASE, app), meta: { onboarded: true } } }, extra || {}));
  await sleep(150); return e;
}
const clave = (A) => { const a = A.mesActual(); return a.y + '-' + String(a.m).padStart(2, '0'); };
const enRango = (A, f) => { const k = A.mesDe(f), r = A.rangoMes(+k.slice(0, 4), +k.slice(5, 7)); return r.desde <= f && f <= r.hasta; };
(async () => {
  /* 1. Cobro quincenal elegido como nómina: el 23 de octubre no puede ser «julio de 2027» */
  {
    const movs = [gasto('q0', '2026-03-01')];
    dias('2026-03-01', '2026-10-22').forEach((f, i) => { const sig = new RealDate(f + 'T12:00:00Z'); sig.setUTCDate(sig.getUTCDate() + 1); if (f.slice(8) === '15' || sig.getUTCDate() === 1) movs.push(nom('q' + i, f, 600)); });
    const e = await env('2026-10-23', { cobros: [{ nombre: 'Nómina', importe: 600, regla: { t: 'quincenal' }, desde: '2026-01-01' }], mesInicio: { modo: 'cobro', dia: 15, nomina: 'Nómina' } }, movs);
    const k = clave(e.w.__APP__);
    ok(k === '2026-10' || k === '2026-11', 'nómina quincenal: hoy (23 oct 2026) se llama octubre o noviembre de 2026 (sale ' + k + ', píldora «' + e.doc.querySelector('.mes-pill').textContent.trim() + '»)');
  }
  /* 2. «Cada 28 días» (el ejemplo que da la app) con dos años de historia: los nombres no se adelantan */
  {
    const movs = [gasto('d0', '2024-10-01')]; let t = new RealDate('2024-10-03T12:00:00Z').getTime(), i = 0;
    while (t < new RealDate('2026-10-23T12:00:00Z').getTime()) { movs.push(nom('d' + i++, new RealDate(t).toISOString().slice(0, 10))); t += 28 * 864e5; }
    const app = { cobros: [{ nombre: 'Nómina', importe: 1000, regla: { t: 'dias', cada: 28, ancla: '2024-10-03' }, desde: '2024-10-03' }], mesInicio: { modo: 'cobro', dia: 28, nomina: 'Nómina' } };
    const A = (await env('2026-10-23', app, movs)).w.__APP__, k = clave(A);
    ok(k === '2026-10' || k === '2026-11', 'cada 28 días durante 2 años: hoy se llama octubre o noviembre de 2026 (sale ' + k + ')');
    const B = (await env('2026-10-23', app, movs.filter((m) => m.fecha >= '2026-01-01'))).w.__APP__;
    ok(clave(B) === k, 'cada 28 días: el nombre de hoy no depende de desde cuándo hay movimientos (con todo: ' + k + ', solo 2026: ' + clave(B) + ')');
  }
  /* 3. Día 15 «si cae en finde, después» y usuario que empieza a apuntar a final de septiembre (15 ago 2026 es sábado) */
  {
    const app = { cobros: [{ nombre: 'Nómina', importe: 1000, regla: { t: 'dia', dia: 15, ajuste: 'despues' }, desde: '2026-01-01' }], mesInicio: { modo: 'cobro', dia: 15, nomina: 'Nómina' } };
    const movs = [nom('s1', '2026-09-15'), nom('s2', '2026-10-15')];
    const A = (await env('2026-10-23', app, movs.concat([gasto('s0', '2026-09-25')]))).w.__APP__;
    const B = (await env('2026-10-23', app, movs.concat([gasto('s0', '2026-01-10')]))).w.__APP__;
    ok(clave(A) === '2026-10', 'día 15 + finde, historia desde el 25 sep: el mes que empezó el 15 oct se llama octubre, como en «Desde un día fijo» (sale ' + clave(A) + ')');
    ok(clave(A) === clave(B), 'día 15 + finde: importar movimientos antiguos no cambia el nombre de los meses (' + clave(A) + ' / ' + clave(B) + ')');
  }
  /* 4. Mientras se espera la nómina, la hoja no dice «empezará» con una fecha que ya pasó */
  {
    const e = await env('2026-10-28', { cobros: [{ nombre: 'Nómina', importe: 1000, regla: { t: 'dia', dia: 25 }, desde: '2026-01-01' }], mesInicio: { modo: 'cobro', dia: 25, nomina: 'Nómina' } },
      [nom('w1', '2026-08-25'), nom('w2', '2026-09-25')]);
    e.w.__APP__.H.tuMesAbrir([]); await sleep(10);
    const t = [...e.doc.querySelectorAll('.tumes-nom-f')].map((x) => x.textContent).join(' || ');
    ok(!/empezará el dom 25 oct/.test(t), 'esperando la nómina (tocaba el 25 oct, hoy 28): la hoja no dice «Noviembre empezará el dom 25 oct» como si fuera futuro (dice: ' + t + ')');
  }
  /* 5. Dos nóminas el mismo mes (atrasos): no abren un mes de más y los meses siguen seguidos */
  {
    const A = (await env('2026-10-23', { cobros: [{ nombre: 'Nómina', importe: 1000, regla: { t: 'dia', dia: 25 }, desde: '2026-01-01' }], mesInicio: { modo: 'cobro', dia: 25, nomina: 'Nómina' } },
      [gasto('x0', '2026-05-01'), nom('x1', '2026-06-25'), nom('x2', '2026-07-24'), nom('x3', '2026-08-25'), nom('x3b', '2026-08-29', 300), nom('x4', '2026-09-25'), nom('x4b', '2026-10-02', 200)])).w.__APP__;
    const meses = [...new Set(dias('2026-06-25', '2026-10-23').map((f) => A.mesDe(f)))];
    ok(meses.join(',') === '2026-07,2026-08,2026-09,2026-10', 'dos nóminas en un mes: julio, agosto, septiembre y octubre seguidos (' + meses.join(',') + ')');
    ok(dias('2026-06-01', '2026-10-23').every((f) => enRango(A, f)), 'dos nóminas en un mes: cada día cae en el tramo de su mes');
    ok(A.kpisMes(2026, 10).ingresos === 1200, 'dos nóminas en un mes: octubre suma las dos (' + A.kpisMes(2026, 10).ingresos + ')');
  }
  /* 6. Marcar «No ha llegado» (cambia la configuración) mueve el corte al momento */
  {
    const e = await env('2026-10-27', { cobros: [{ nombre: 'Nómina', importe: 1000, regla: { t: 'dia', dia: 25 }, desde: '2026-01-01' }], mesInicio: { modo: 'cobro', dia: 25, nomina: 'Nómina' } },
      [nom('r1', '2026-08-25'), nom('r2', '2026-09-25')]);
    const A = e.w.__APP__, antes = A.mesDe('2026-10-26');
    A.S.config = Object.assign({}, A.S.config, { recEstado: { 'c:nómina@2026-10-25': 'no' } }); // lo mismo que deja saveConfig
    ok(antes === '2026-10' && A.mesDe('2026-10-26') === '2026-11', 'decir «No» a la nómina del 25 oct: el 26 pasa al mes siguiente sin esperar (antes ' + antes + ', ahora ' + A.mesDe('2026-10-26') + ')');
  }
  /* 7. Hoja «Tu mes» si la nómina guardada ya no existe: avisa y no se rompe */
  {
    const e = await env('2026-10-23', { cobros: [{ nombre: 'Sueldo', importe: 1000, regla: { t: 'dia', dia: 25 } }], mesInicio: { modo: 'cobro', dia: 25, nomina: 'Nómina' } }, [nom('p1', '2026-09-25')]);
    e.w.__APP__.H.tuMesAbrir([]); await sleep(10);
    ok(/Ya no encuentro «Nómina»/.test(e.doc.querySelector('#sheetHost').textContent), 'nómina perdida: la hoja lo avisa');
  }
  /* 8. Repetir la bienvenida con «Tu mes» desde la nómina: no se pierde la nómina elegida */
  {
    const app = { ingresos: ['Nómina'], mesInicio: { modo: 'cobro', dia: 28, nomina: 'Nómina' }, cuentas: [{ id: 'c1', nombre: 'Mi banco', tipo: 'corriente', saldo: 900, fecha: '2026-10-01', principal: true }],
      cobros: [{ nombre: 'Nómina', importe: 1800, diaDelMes: 28, regla: { t: 'dia', dia: 28 } }], nombre: 'Ana' };
    const e = await env('2026-10-23', app, [nom('o1', '2026-09-28')], { uid: 'u93' });
    const A = e.w.__APP__, ob = () => A.S.onboarding;
    A.H.startOnboardingManually([]); await sleep(10); A.H.obNext([]); await sleep(10);
    if (ob()) { ob().saldo = '5'; ob().cuentaNombre = 'Mi banco'; } A.H.obNext([]); await sleep(10);
    A.H.obNomina([]); if (ob()) ob().nomina.importe = '1800'; A.H.obNomDia([], { value: '28' });
    A.H.obNext([]); A.H.obFinish(['']); await sleep(150);
    const mi = (e.store.cfg.app || {}).mesInicio || {};
    ok(mi.modo === 'cobro' && mi.nomina === 'Nómina', 'repetir la bienvenida: «Tu mes» sigue desde la nómina (' + JSON.stringify(mi) + ')');
  }
  /* 9. Un pago pequeño apuntado como «Nómina» (atrasos de 150 €) 9 días antes del día de cobro no adelanta el mes */
  {
    const A = (await env('2026-10-20', { cobros: [{ nombre: 'Nómina', importe: 1000, regla: { t: 'dia', dia: 25 }, desde: '2026-01-01' }], mesInicio: { modo: 'cobro', dia: 25, nomina: 'Nómina' } },
      [nom('t1', '2026-07-24'), nom('t2', '2026-08-25'), nom('t3', '2026-09-25'), nom('t4', '2026-10-16', 150)])).w.__APP__;
    ok(clave(A) === '2026-10' && A.mesDe('2026-10-16') === '2026-10', 'atrasos de 150 € el 16 oct (la nómina de 1.000 € llega el 25): hoy, 20 oct, sigue siendo octubre (sale ' + clave(A) + ')');
  }
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

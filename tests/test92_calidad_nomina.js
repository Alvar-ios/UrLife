// Calidad · A5 «Tu mes» desde que llega la nómina (23/10/2026). Fecha de hoy fijada en cada caso. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const RealDate = Date;
const fijar = (hoy) => (w) => { const D = w.Date, f = new RealDate(hoy + 'T10:00:00').getTime();
  class F extends D { constructor(...a) { if (a.length) super(...a); else super(f); } static now() { return f; } } w.Date = F; };
const dias = (a, b) => { const out = []; for (let t = new RealDate(a + 'T12:00:00Z').getTime(), e = new RealDate(b + 'T12:00:00Z').getTime(); t <= e; t += 864e5) out.push(new RealDate(t).toISOString().slice(0, 10)); return out; };
const BASE = { categoriasGasto: [{ nombre: 'Otros' }], ingresos: ['Nómina'] };
const nom = (id, fecha, importe) => ({ id, tipo: 'Ingreso', categoria: 'Nómina', importe: importe || 1000, fecha });
const gasto = (id, fecha, importe) => ({ id, tipo: 'Gasto', categoria: 'Otros', importe: importe || 5, fecha });
async function env(hoy, app, movs) {
  const e = makeEnv({ movs: movs || [], pre: fijar(hoy), cfg: { app: Object.assign({}, BASE, app), meta: { onboarded: true } } });
  await sleep(150); return e;
}
const enRango = (A, f) => { const k = A.mesDe(f), r = A.rangoMes(+k.slice(0, 4), +k.slice(5, 7)); return r.desde <= f && f <= r.hasta; };
(async () => {
  /* 1. Nómina con retraso (≤ 7 días): el mes en curso sigue abierto e incluye hoy */
  const eA = await env('2026-10-28', { cobros: [{ nombre: 'Nómina', importe: 1000, regla: { t: 'dia', dia: 25 }, desde: '2026-06-01' }], mesInicio: { modo: 'cobro', dia: 25, nomina: 'Nómina' } },
    [nom('a1', '2026-08-25'), nom('a2', '2026-09-25'), gasto('g1', '2026-10-26', 7), gasto('g2', '2026-10-28', 5)]);
  const A = eA.w.__APP__, kA = A.mesDe('2026-10-28'), rA = A.rangoMes(+kA.slice(0, 4), +kA.slice(5, 7));
  ok(kA === '2026-10', 'retraso de 3 días: hoy sigue siendo «octubre»');
  ok(rA.desde <= '2026-10-28' && '2026-10-28' <= rA.hasta, 'retraso: el tramo de octubre incluye hoy (' + rA.desde + ' – ' + rA.hasta + ')');
  ok(dias('2026-10-25', '2026-10-28').every((f) => enRango(A, f)), 'retraso: los días de espera están en el mismo mes que dice mesDe (calendario, «días sin gastos», comparaciones)');
  const pill = eA.doc.querySelector('.mes-pill');
  ok(pill && /esperando tu nómina/.test(pill.textContent), 'retraso: la píldora de Inicio dice «esperando tu nómina» (' + (pill && pill.textContent.trim()) + ')');

  /* 2. Día 15 con ajuste «después» (15 de agosto de 2026 es sábado → 17): no desaparece ningún mes ni hay tramos de dos meses */
  const fC = ['2026-04-15', '2026-05-15', '2026-06-15', '2026-07-15', '2026-08-17', '2026-09-15', '2026-10-15'];
  const C = (await env('2026-10-23', { cobros: [{ nombre: 'Nómina', importe: 900, regla: { t: 'dia', dia: 15, ajuste: 'despues' }, desde: '2026-01-01' }], mesInicio: { modo: 'cobro', dia: 15, nomina: 'Nómina' } },
    [gasto('z0', '2026-03-01', 1)].concat(fC.map((f, i) => nom('c' + i, f, 900))))).w.__APP__;
  const mesesC = new Set(dias('2026-04-15', '2026-10-23').map((f) => C.mesDe(f)));
  ok(mesesC.size === 7, 'día 15 + finde: 7 nóminas = 7 meses distintos (salen ' + mesesC.size + ': ' + [...mesesC].join(', ') + ')');
  const largos = [...mesesC].filter((k) => { const r = C.rangoMes(+k.slice(0, 4), +k.slice(5, 7)); return (new RealDate(r.hasta) - new RealDate(r.desde)) / 864e5 > 40; });
  ok(!largos.length, 'día 15 + finde: ningún mes dura más de 40 días (' + largos.join(', ') + ')');
  ok(C.mesDe('2026-08-17') !== C.mesDe('2026-09-15'), 'día 15 + finde: la nómina del 17 ago y la del 15 sep abren meses distintos');

  /* 3. Corregir la fecha de la nómina (mismo número de movimientos) cambia el mes al momento */
  const eE = await env('2026-10-27', { cobros: [{ nombre: 'Nómina', importe: 1000, regla: { t: 'dia', dia: 25 }, desde: '2026-06-01' }], mesInicio: { modo: 'cobro', dia: 25, nomina: 'Nómina' } },
    [nom('e1', '2026-09-25'), nom('e2', '2026-10-23'), gasto('e3', '2026-10-01', 3)]);
  const E = eE.w.__APP__, antes = E.mesDe('2026-10-24');
  E.S.movimientos = E.S.movimientos.map((m) => (m.id === 'e2' ? Object.assign({}, m, { fecha: '2026-10-26' }) : m)); // lo mismo que hace la app al recibir el cambio
  ok(antes === '2026-11' && E.mesDe('2026-10-24') === '2026-10', 'editar la fecha de la nómina (del 23 al 26 oct) mueve el 24 de vuelta a octubre (antes ' + antes + ', ahora ' + E.mesDe('2026-10-24') + ')');

  /* 4. Paga extra aparte el mismo mes: no abre un mes nuevo */
  const B = (await env('2026-10-23', { cobros: [{ nombre: 'Nómina', importe: 1500, regla: { t: 'ultHabil' }, extras: [6, 12], desde: '2026-01-01' }], mesInicio: { modo: 'cobro', dia: 30, nomina: 'Nómina' } },
    [nom('b0', '2026-05-29'), nom('b1', '2026-06-20'), nom('b2', '2026-06-30'), nom('b3', '2026-07-31'), nom('b4', '2026-08-31'), nom('b5', '2026-09-30')])).w.__APP__;
  const r6 = B.rangoMes(2026, 6), r7 = B.rangoMes(2026, 7);
  ok(r6.desde === '2026-05-29' && r6.hasta === '2026-06-29' && r7.desde === '2026-06-30', 'paga extra el 20 jun: junio va del 29 may al 29 jun y julio empieza el 30 jun');
  ok(dias('2026-05-01', '2026-10-23').every((f) => enRango(B, f)), 'paga extra: cada día cae en el tramo de su mes');

  /* 5. Cobro fijo renombrado o borrado: vuelve al día fijo sin romperse */
  const eF = await env('2026-10-27', { cobros: [{ nombre: 'Sueldo', importe: 1000, regla: { t: 'dia', dia: 25 } }], mesInicio: { modo: 'cobro', dia: 25, nomina: 'Nómina' } }, [nom('f1', '2026-09-25')]);
  const F = eF.w.__APP__, mF = F.mesActual(), rF = F.rangoMes(mF.y, mF.m);
  ok(mF.y === 2026 && mF.m === 11 && rF.desde === '2026-10-23', 'nómina renombrada: usa el día fijo guardado (25 → vie 23 oct)');
  let roto = false; try { F.H.tuMesAbrir([]); await sleep(10); } catch (err) { roto = true; }
  ok(!roto && /Desde que llega mi nómina/.test(eF.doc.querySelector('#sheetHost').textContent), 'nómina renombrada: la hoja «Tu mes» se abre sin errores');
  const eF2 = await env('2026-10-27', { mesInicio: { modo: 'cobro', dia: 25, nomina: 'Nómina' } }, [gasto('f2', '2026-10-24')]);
  ok(eF2.w.__APP__.mesDe('2026-10-24') === '2026-11' && /desde el/.test(eF2.doc.querySelector('.mes-pill').textContent), 'sin ningún cobro fijo: día fijo y la píldora normal');

  /* 6. Con varios cobros fijos, se propone la nómina aunque lleve tilde */
  const eN = await env('2026-10-23', { cobros: [{ nombre: 'Alquiler piso', importe: 300, regla: { t: 'dia', dia: 5 } }, { nombre: 'Nómina', importe: 1000, regla: { t: 'ultHabil' } }] });
  eN.w.__APP__.H.tuMesAbrir([]); await sleep(5);
  ok(eN.w.__APP__.form().nomina === 'Nómina', 'varios cobros: se propone «Nómina» y no el primero de la lista (propone «' + eN.w.__APP__.form().nomina + '»)');

  /* 7. Cambio de año y febrero con último día hábil: sin huecos ni solapes */
  const fechasU = ['2026-11-30', '2026-12-31', '2027-01-29', '2027-02-26'];
  const U = (await env('2027-03-10', { cobros: [{ nombre: 'Nómina', importe: 1000, regla: { t: 'ultHabil' }, desde: '2026-10-01' }], mesInicio: { modo: 'cobro', dia: 30, nomina: 'Nómina' } },
    [gasto('u0', '2026-10-01')].concat(fechasU.map((f, i) => nom('u' + i, f))))).w.__APP__;
  ok(U.mesDe('2026-12-31') === '2027-01' && U.mesDe('2026-12-30') === '2026-12', 'cambio de año: desde la nómina del 31 dic ya es enero de 2027');
  ok(dias('2026-11-01', '2027-03-10').every((f) => enRango(U, f)), 'cambio de año: cada día cae en el tramo de su mes');

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

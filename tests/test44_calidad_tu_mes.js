// Calidad · «Tu mes» (fase 4): bordes del cálculo del mes. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
async function env(app, movs) {
  const e = makeEnv({ cfg: { app: Object.assign({ categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'] }, app || {}), meta: { onboarded: true } },
    movs: movs || [], url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } } });
  await sleep(120); return e;
}
(async () => {
  /* 1. Para cualquier día de cobro, cada fecha cae en un solo mes y los meses van seguidos, sin huecos */
  let malos = 0, huecos = 0;
  for (const dia of [2, 3, 15, 25, 28, 29, 30, 31]) {
    const A = (await env({ mesInicio: { modo: 'cobro', dia } })).w.__APP__;
    for (let d = new Date(2026, 0, 1); d < new Date(2028, 1, 1); d.setDate(d.getDate() + 1)) {
      const s = iso(d), k = A.mesDe(s), r = A.rangoMes(+k.slice(0, 4), +k.slice(5, 7));
      if (!(r.desde <= s && s <= r.hasta)) malos++;
    }
    for (let y = 2026; y <= 2027; y++) for (let m = 1; m <= 12; m++) {
      const r = A.rangoMes(y, m), n = A.rangoMes(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1), sig = new Date(r.hasta + 'T12:00'); sig.setDate(sig.getDate() + 1);
      if (iso(sig) !== n.desde || r.desde > r.hasta) huecos++;
    }
  }
  ok(malos === 0, 'cada fecha pertenece al mes cuyo tramo la contiene (' + malos + ' fallos)');
  ok(huecos === 0, 'los meses van seguidos, sin huecos ni solapes, también en diciembre → enero y febrero (' + huecos + ' fallos)');

  /* 2. El año con «desde que cobro» suma sus 12 meses sin perder ni repetir nada */
  const movs = [];
  for (let d = new Date(2025, 11, 1), i = 0; d < new Date(2027, 1, 1); d.setDate(d.getDate() + 3), i++) movs.push({ id: 'g' + i, tipo: 'Gasto', categoria: 'Supermercado', importe: 1, fecha: iso(d) });
  let e = await env({ mesInicio: { modo: 'cobro', dia: 28 } }, movs), A = e.w.__APP__;
  let tot = 0; for (let m = 1; m <= 12; m++) tot += A.kpisMes(2026, m).gastos;
  const desde = A.rangoMes(2026, 1).desde, hasta = A.rangoMes(2026, 12).hasta, esperado = movs.filter((x) => x.fecha >= desde && x.fecha <= hasta).length;
  ok(tot === esperado && desde < '2026-01-01' && hasta < '2026-12-31', 'el año 2026 suma justo lo que hay entre ' + desde + ' y ' + hasta + ' (' + tot + ' de ' + esperado + ')');
  A.S.tab = 'movimientos'; A.S.movVista = 'lista'; A.S.movPeriodo = 'y:2026'; A.render(); await sleep(5);
  ok(A.S.movPeriodo === 'y:2026' && movs.filter((x) => A.mesDe(x.fecha).slice(0, 4) === '2026').length === esperado, 'la lista del año usa el mismo reparto que el Resumen');

  /* 3. Del 1 al 31: los números son los del calendario de siempre */
  e = await env({}, movs); A = e.w.__APP__;
  let iguales = true;
  for (let m = 1; m <= 12; m++) { const k = A.kpisMes(2026, m), cal = movs.filter((x) => x.fecha.slice(0, 7) === '2026-' + String(m).padStart(2, '0')).length; if (k.gastos !== cal) iguales = false; }
  ok(iguales, 'del 1 al 31: cada mes suma exactamente lo del calendario');

  /* 4. Cambiar de modo con un mes antiguo elegido en Movimientos vuelve al mes actual (y no se queda en un mes que ya no existe) */
  A.S.tab = 'movimientos'; A.S.movPeriodo = 'm:2026-03'; A.render();
  A.H.tuMesAbrir([]); await sleep(5); A.H.tuMesModo(['cobro']); A.H.tuMesGuardar([]); await sleep(40);
  ok(A.S.movPeriodo === 'm:' + A.mesDe(iso(new Date())) && Object.keys(e.store.movimientos).length === movs.length, 'al cambiar de modo, Movimientos vuelve a tu mes actual y no se toca ningún movimiento');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH ' + (x && x.stack)); process.exit(1); });

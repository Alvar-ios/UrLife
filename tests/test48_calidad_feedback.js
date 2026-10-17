// Calidad (17/10/2026): revisión de la rama fase4/feedback-paloma.
// Parte 1: casos raros que ya funcionan (saldo real y virtual, Inicio con cambio de mes, «Así vas», anillo).
// Parte 2 («FALLO CONOCIDO»): fallos encontrados en la revisión. Fallan a propósito hasta que Desarrollo los arregle.
// Sin datos reales: importes, nombres e ids inventados.
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
// fija «hoy» dentro de la app (para no depender del día real)
const fijaFecha = (iso) => (w) => {
  const D = w.Date, t = new D(iso + 'T12:00:00').getTime();
  class FD extends D { constructor(...a) { if (!a.length) super(t); else super(...a); } static now() { return t; } }
  w.Date = FD;
};
const txt = (e) => e.doc.querySelector('#content').textContent.replace(/\s+/g, ' ');
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const cards = (e) => [...e.doc.querySelectorAll('.ins-card')].map((x) => x.textContent.replace(/\s+/g, ' '));
const pill = (e) => e.doc.querySelector('.mes-pill').textContent.replace(/\s+/g, ' ');
const T0 = Date.parse('2026-10-10T09:00:00Z'); // hora a la que se puso el saldo
const DOS = [{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: '2026-10-10', ts: T0, principal: true }, { id: 'c2', nombre: 'Efectivo', tipo: 'efectivo', saldo: 100, fecha: '2026-10-10', ts: T0 }];
async function env(o) {
  const e = makeEnv({ pre: fijaFecha(o.hoy || '2026-10-17'),
    cfg: { app: Object.assign({ categoriasGasto: [{ nombre: 'Super', presupuesto: 100 }, { nombre: 'Ocio' }], ingresos: ['Nómina'], cuentas: JSON.parse(JSON.stringify(o.cuentas || DOS)) }, o.app || {}), meta: { onboarded: true } },
    movs: JSON.parse(JSON.stringify(o.movs || [])), url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } } });
  await sleep(120);
  const A = e.w.__APP__;
  if (o.comps) { A.S.grupos = [{ id: 'g', nombre: 'Casa', alias: {}, miembros: [{ user_id: 'yo', nombre: 'Yo', rol: 'admin' }, { user_id: 'ot', nombre: 'Otra', rol: 'miembro' }] }]; A.S.compartidos = o.comps; }
  A.render(); await sleep(10);
  return e;
}
const C = (id, fecha, pag, imp, rep, tipo, created) => ({ id, grupoId: 'g', tipo: tipo || 'Gasto', categoria: 'Super', importe: imp, fecha, pagadoPor: pag, reparto: rep, createdAt: created || '2026-10-12T10:00:00Z' });
const saldos = (e) => { const A = e.w.__APP__; return A.cfg().cuentas.map((c) => { const r = A.saldoCuenta(c); return [r, r == null ? null : Math.round((r + A.compartidosCuenta(c).neto) * 100) / 100]; }); };
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  /* ===== 1. Saldo real (lo que dice el banco) y saldo virtual (contando Juntos) ===== */
  let e = await env({ comps: [C('k', '2026-10-12', 'yo', 60, { yo: 30, ot: 30 })],
    movs: [{ id: 'm', tipo: 'Gasto', categoria: 'Super', importe: 60, fecha: '2026-10-12', cuentaId: 'c1', compartidoId: 'k', creadoEn: T0 + 1e6 }] });
  ok(igual(saldos(e), [[940, 970], [100, 100]]), 'pago yo 60 (mi parte 30) y tengo mi copia enlazada: el banco baja 60 una sola vez; virtual 970');
  e = await env({ comps: [C('k', '2026-10-12', 'ot', 60, { yo: 30, ot: 30 })],
    movs: [{ id: 'm', tipo: 'Gasto', categoria: 'Super', importe: 30, fecha: '2026-10-12', cuentaId: 'c1', compartidoId: 'k', creadoEn: T0 + 1e6 }] });
  ok(igual(saldos(e), [[1000, 970], [100, 100]]), 'paga la otra persona (mi parte también apuntada y enlazada): el banco no cambia; virtual 970 (debo 30)');
  e = await env({ comps: [C('k', '2026-10-12', 'yo', 60, { yo: 30, ot: 30 }), C('l', '2026-10-13', 'ot', 30, { yo: 30 }, 'Liquidación')] });
  ok(igual(saldos(e), [[970, 970], [100, 100]]), 'pago yo y me devuelven 30 por Bizum: el real sube a 970 y el virtual no cambia');
  e = await env({ comps: [C('k', '2026-10-12', 'ot', 60, { yo: 30, ot: 30 }), C('l', '2026-10-13', 'yo', 30, { ot: 30 }, 'Liquidación')] });
  ok(igual(saldos(e), [[970, 970], [100, 100]]), 'paga la otra persona y yo le devuelvo 30: el real baja a 970 y el virtual no cambia');
  e = await env({ movs: [{ id: 'm', tipo: 'Gasto', categoria: 'Super', importe: 60, fecha: '2026-10-12', cuentaId: 'c1', compartidoId: 'k', creadoEn: T0 + 1e6 }], comps: [] });
  ok(igual(saldos(e), [[940, 940], [100, 100]]), 'si el compartido se borra y queda mi copia, el cargo del banco sigue contando entero (sin contarse dos veces)');
  e = await env({ comps: [C('k', '2026-10-01', 'yo', 60, { yo: 30, ot: 30 })] });
  ok(igual(saldos(e), [[1000, 1030], [100, 100]]), 'compartido anterior al saldo puesto: no toca el real (ya estaba en el banco) pero la deuda sí cuenta en el virtual');
  e = await env({ comps: [C('k', '2026-10-10', 'yo', 60, { yo: 30, ot: 30 }, null, '2026-10-10T08:00:00Z')] });
  ok(saldos(e)[0][0] === 1000, 'mismo día del saldo, apuntado antes de ponerlo: no cuenta');
  e = await env({ comps: [C('k', '2026-10-10', 'yo', 60, { yo: 30, ot: 30 }, null, '2026-10-10T10:00:00Z')] });
  ok(saldos(e)[0][0] === 940, 'mismo día del saldo, apuntado después de ponerlo: cuenta');
  e = await env({ cuentas: [{ id: 'c2', nombre: 'Efectivo', tipo: 'efectivo', saldo: 100, fecha: '2026-10-10', ts: T0 }], comps: [C('k', '2026-10-12', 'yo', 60, { yo: 30, ot: 30 })] });
  ok(igual(saldos(e), [[40, 70]]), 'con una sola cuenta (sin marcar principal) el compartido cuenta en ella');
  e.w.__APP__.H.cuentaVer(['c2']); await sleep(15);
  ok(/Saldo real · lo que dice tu banco/.test(sh(e)) && /Saldo virtual/.test(sh(e)) && /te deben 30,00 €/.test(sh(e)) && /70,00/.test(sh(e)), 'la ficha con una sola cuenta: real 40, virtual 70 y «te deben 30»');
  e = await env({ comps: [C('k', '2026-10-12', 'ot', 60, { yo: 30, ot: 30 })] });
  e.w.__APP__.H.cuentaVer(['c1']); await sleep(15);
  ok(/debes 30,00 €/.test(sh(e)) && /970,00/.test(sh(e)), 'la ficha cuando debes: «debes 30» y virtual 970');
  e.w.__APP__.H.cuentaVer(['c2']); await sleep(15);
  ok(!/Saldo virtual/.test(sh(e)), 'la cuenta que no es la principal no enseña saldo virtual (los compartidos van a la principal)');
  e = await env({ cuentas: [{ id: 'c1', nombre: 'Banco', principal: true }], comps: [C('k', '2026-10-12', 'yo', 60, { yo: 30, ot: 30 })] });
  e.w.__APP__.H.cuentaVer(['c1']); await sleep(15);
  ok(!/Saldo real/.test(sh(e)) && !/Saldo virtual/.test(sh(e)) && /Poner el saldo/.test(sh(e)), 'sin saldo puesto: ni «Saldo real» ni virtual, solo «Poner el saldo»');
  e = await env({ cuentas: [], comps: [C('k', '2026-10-12', 'yo', 60, { yo: 30, ot: 30 })] });
  ok(!!e.doc.querySelector('.hero2'), 'sin ninguna cuenta y con compartidos, Inicio se pinta sin errores');

  /* ===== 2. Inicio: cambiar de mes ===== */
  e = await env({ movs: [], cuentas: [] });
  ok(e.doc.querySelector('.hero2 [aria-label="Mes anterior"]').disabled && e.doc.querySelector('.hero2 [aria-label="Mes siguiente"]').disabled && !e.doc.querySelector('.hero-bar') && !/Así vas/.test(txt(e)), 'usuario nuevo: flechas apagadas, sin barra y sin «Así vas»');
  e = await env({ hoy: '2027-01-10', movs: [{ id: 'a', tipo: 'Gasto', categoria: 'Super', importe: 50, fecha: '2026-12-05' }, { id: 'b', tipo: 'Gasto', categoria: 'Super', importe: 20, fecha: '2027-01-03' }] });
  let A = e.w.__APP__;
  ok(/^Enero·/.test(pill(e)), 'en enero la píldora dice «Enero» (sin año, es el actual)');
  ok(cards(e).some((c) => /−60 % de gasto/.test(c) && /30,00 € menos que en diciembre a estas alturas/.test(c)), 'cambio de año: compara enero con diciembre del año anterior a estas alturas (20 € frente a 50 €)');
  A.H.inicioMes(['1']); await sleep(5);
  ok(/^Enero·/.test(pill(e)), 'no se puede ir al futuro (ni llamando a la acción a mano: sigue en enero)');
  click(e, 'inicioMes', '-1'); await sleep(5);
  ok(/^Diciembre 2026/.test(pill(e)) && /Te quedó en diciembre|En diciembre gastaste más/.test(txt(e)), 'mes anterior de otro año: «Diciembre 2026» y «Te quedó / gastaste» en pasado');
  ok(e.doc.querySelector('.hero2 [aria-label="Mes anterior"]').disabled, 'no deja ir antes del primer mes con datos');
  ok(!e.doc.querySelector('.hero-prev'), 'en un mes pasado no sale ninguna previsión');
  click(e, 'inicioMes', '1'); await sleep(5);
  ok(/^Enero·/.test(pill(e)) && !A.S.inicioMes, 'volver con la flecha al mes actual deja el estado limpio');
  click(e, 'inicioMes', '-1'); await sleep(5); A.H.goTab(['tareas']); await sleep(5); A.H.goTab(['inicio']); await sleep(5);
  ok(/^Enero·/.test(pill(e)), 'al salir y volver a Inicio, otra vez el mes actual');

  /* «Tu mes» desde el cobro (día 28): octubre va del 28 sep al 27 oct */
  e = await env({ app: { mesInicio: { modo: 'cobro', dia: 28 } }, cuentas: [],
    movs: [{ id: 'a', tipo: 'Gasto', categoria: 'Super', importe: 50, fecha: '2026-09-29' }, { id: 'b', tipo: 'Gasto', categoria: 'Super', importe: 40, fecha: '2026-08-30' },
      { id: 'c', tipo: 'Gasto', categoria: 'Ocio', importe: 10, fecha: '2026-10-30' }] });
  A = e.w.__APP__;
  ok(/^Octubre· desde el 28 sep/.test(pill(e)), 'tu mes desde el cobro: «Octubre · desde el 28 sep»');
  ok(cards(e).some((c) => /\+25 % de gasto/.test(c) && /10,00 € más que en septiembre a estas alturas/.test(c)), 'el ritmo usa tu mes: 50 € (29 sep) frente a 40 € (30 ago, ya del septiembre «de cobro»); lo del 30 oct es del mes siguiente');
  A.H.inicioMes(['-1']); await sleep(5);
  ok(/^Septiembre· desde el 28 ago/.test(pill(e)) && /40,00/.test(e.doc.querySelector('.hero-main').textContent), 'mes anterior desde el cobro: septiembre desde el 28 ago con sus 40 €');

  /* ===== 3. «Así vas»: cifras que cuadran con el resto de la app ===== */
  e = await env({ cuentas: DOS,
    movs: [{ id: 'n', tipo: 'Ingreso', categoria: 'Nómina', importe: 1000, fecha: '2026-10-01', cuentaId: 'c1' },
      { id: 's1', tipo: 'Gasto', categoria: 'Super', importe: 130, fecha: '2026-10-05', cuentaId: 'c1' },
      { id: 'f1', tipo: 'Factura', categoria: 'Luz', importe: 500, fecha: '2026-10-25', cuentaId: 'c1' }, // futura: aún no ha pasado
      { id: 's0', tipo: 'Gasto', categoria: 'Super', importe: 100, fecha: '2026-09-05', cuentaId: 'c1' }],
    comps: [C('k', '2026-10-12', 'ot', 60, { yo: 30, ot: 30 }), C('l', '2026-10-13', 'yo', 10, { ot: 10 }, 'Liquidación')] });
  A = e.w.__APP__;
  const cs = cards(e);
  // a 17/10 llevas 130 + 30 (tu parte) = 160; el 17/09 llevabas 100 → +60 %. La factura del 25 no cuenta todavía y la liquidación no es gasto.
  ok(cs.some((c) => /\+60 % de gasto/.test(c) && /60,00 € más que en septiembre a estas alturas/.test(c)), 'el ritmo no cuenta lo que aún no ha pasado ni los pagos para saldar (' + cs.join(' | ') + ')');
  ok(cs.some((c) => /Te has pasado en Super/.test(c) && /60,00 € por encima/.test(c)), 'presupuesto pasado: Super 160 € de 100 €');
  ok(cs.some((c) => /Debes 20,00 €/.test(c)) && A.compartidosCuenta(A.cfg().cuentas[0]).neto === -20, '«Así vas» dice lo mismo que la cuenta: debes 20 € en Juntos');
  A.H.goTab(['movimientos']); await sleep(10);
  ok(/te has pasado 60,00 €/i.test(txt(e)), 'el Resumen de Movimientos dice lo mismo: te has pasado 60 €');
  A.H.goTab(['inicio']); await sleep(5); click(e, 'inicioMes', '-1'); await sleep(5);
  ok(!cards(e).some((c) => /Debes|Te deben/.test(c)), 'en un mes pasado no sale lo de Juntos (es de hoy, no de ese mes)');
  ok(!e.doc.querySelector('.hero-cuentas'), 'en un mes pasado no sale «En tus cuentas» (es el saldo de hoy)');
  click(e, 'heroResumen'); await sleep(10);
  ok(A.S.tab === 'movimientos' && A.S.movPeriodo === 'm:2026-09', 'tocar la cifra de septiembre abre el Resumen de septiembre');

  /* ===== 4. El anillo ===== */
  e = await env({ cuentas: [], movs: [{ id: 'a', tipo: 'Gasto', categoria: 'Super', importe: 50, fecha: '2026-10-05' }, { id: 'b', tipo: 'Gasto', categoria: 'Ocio', importe: 20, fecha: '2026-10-06' }] });
  A = e.w.__APP__; A.H.goTab(['movimientos']); await sleep(10);
  const selN = () => [...e.doc.querySelectorAll('#donutWrap .dn-s.sel')].map((x) => x.getAttribute('data-n'));
  A.H.donutSel(['Super']); await sleep(5);
  ok(igual(selN(), ['Super']) && e.doc.querySelectorAll('#donutWrap .dn-s.off').length === 1, 'elegir Super: sale hacia fuera y la otra se apaga');
  A.H.donutSel(['Ocio']); await sleep(5);
  const ocio = e.doc.querySelector('#donutWrap .dn-s[data-n="Ocio"]'), sup = e.doc.querySelector('#donutWrap .dn-s[data-n="Super"]');
  ok(igual(selN(), ['Ocio']) && /translate/.test(ocio.style.transform) && !sup.style.transform, 'cambiar a Ocio: Ocio sale y Super vuelve a su sitio');
  ok(/Ocio/.test(e.doc.querySelector('#donutWrap .dn-c1').textContent) && /29 % del gasto/.test(e.doc.querySelector('#donutWrap').textContent), 'el centro dice Ocio y su 29 %');
  A.H.donutSel(['']); await sleep(5);
  ok(!selN().length && !e.doc.querySelector('#donutWrap .dn-s.off') && /gastado/.test(e.doc.querySelector('#donutWrap').textContent), 'tocar el centro quita la selección y vuelve al total');
  A.H.donutSel(['Ocio']); await sleep(5); A.H.donutSel(['Ocio']); await sleep(10);
  ok(A.S.tab === 'movimientos' && A.S.movVista === 'lista' && A.S.movCat === 'Ocio', 'tocar dos veces una categoría sin subcategorías lleva a sus movimientos');

  /* ===== 5. FALLO CONOCIDO ===== */
  // 5a. A primeros de mes, si el mes anterior «a estas alturas» casi no tenía gasto, sale un porcentaje absurdo (+29900 %)
  e = await env({ hoy: '2026-10-02', cuentas: [], movs: [{ id: 'a', tipo: 'Gasto', categoria: 'Super', importe: 1, fecha: '2026-09-01' }, { id: 'b', tipo: 'Gasto', categoria: 'Ocio', importe: 300, fecha: '2026-10-01' }] });
  const pcts = cards(e).map((c) => (c.match(/[+−](\d+) % de gasto/) || [])[1]).filter(Boolean).map(Number);
  ok(!pcts.some((p) => p > 999), 'FALLO CONOCIDO: «Así vas» no debe enseñar porcentajes de 4-5 cifras cuando el mes anterior casi no tenía gasto (sale: ' + cards(e).join(' | ') + ')');
  // 5b. Un mes pasado sin ningún gasto apuntado (la persona no usó la app) presume de «30 días sin gastos» y «Dentro de tus presupuestos»
  e = await env({ cuentas: [], movs: [{ id: 'a', tipo: 'Gasto', categoria: 'Super', importe: 20, fecha: '2026-08-10' }, { id: 'b', tipo: 'Gasto', categoria: 'Super', importe: 30, fecha: '2026-10-02' }] });
  e.w.__APP__.H.inicioMes(['-1']); await sleep(5);
  ok(/^Septiembre/.test(pill(e)) && !cards(e).some((c) => /días sin gastos|Dentro de tus presupuestos/.test(c)), 'FALLO CONOCIDO: en un mes sin ningún gasto apuntado no debe decir «días sin gastos» ni «Dentro de tus presupuestos» (sale: ' + cards(e).join(' | ') + ')');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH', x && x.stack); process.exit(1); });

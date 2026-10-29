// 29/10 (docs/23 §4): un mes o un año cerrados se ven como balance («Balance de septiembre»). Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const fijaFecha = (iso) => (w) => { const D = w.Date, t = new D(iso + 'T12:00:00').getTime(); class FD extends D { constructor(...a) { if (!a.length) super(t); else super(...a); } static now() { return t; } } w.Date = FD; };
const mv = (id, tipo, cat, imp, fecha) => ({ id, tipo, categoria: cat, importe: imp, fecha });
const movs = [mv('a1', 'Ingreso', 'Nómina', 1000, '2026-08-01'), mv('a2', 'Gasto', 'Comida', 400, '2026-08-10'), mv('a3', 'Gasto', 'Casa', 300, '2026-08-12'),
  mv('s1', 'Ingreso', 'Nómina', 1000, '2026-09-01'), mv('s2', 'Gasto', 'Comida', 600, '2026-09-10'), mv('s3', 'Gasto', 'Casa', 100, '2026-09-12'),
  mv('j1', 'Ingreso', 'Nómina', 500, '2026-07-01'), mv('j2', 'Gasto', 'Ocio', 800, '2026-07-05'),
  mv('o1', 'Ingreso', 'Nómina', 1000, '2026-10-01'), mv('o2', 'Gasto', 'Comida', 50, '2026-10-02'), mv('d1', 'Ingreso', 'Nómina', 900, '2025-12-01'), mv('d2', 'Gasto', 'Casa', 1000, '2025-12-03')];
(async () => {
  const e = makeEnv({ movs, version: { balance: 0, inicio: 0 }, pre: fijaFecha('2026-10-15'), cfg: { app: { categoriasGasto: [{ nombre: 'Comida', presupuesto: 500 }, { nombre: 'Casa' }, { nombre: 'Ocio' }] }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, S = A.S, H = A.H, doc = e.doc, ver = async (p) => { S.tab = 'movimientos'; S.movVista = 'resumen'; S.movPeriodo = p; A.render(); await sleep(20); return doc.getElementById('content').textContent; };
  let t = await ver('m:2026-09');
  ok(/Balance de septiembre/.test(t) && /Mes cerrado/i.test(t) && !/Te queda/.test(t) && !/Previsto/.test(t), 'septiembre cerrado: «Balance de septiembre», sin «Te queda» ni «Previsto»');
  ok(/\+300/.test(doc.querySelector('.bal-v').textContent) && doc.querySelector('.bal-v.pos') && /Te sobraron después de gastar/.test(t), 'balance positivo con su frase');
  ok(/Frente a agosto/.test(t) && /Lo que más bajó: Casa/.test(t) && /Lo que más subió: Comida/.test(t), '«Frente a agosto» con lo que más bajó y subió');
  ok(/En qué gastaste/.test(t) && /Gastaste .* presupuestados · te pasaste/.test(t), '«En qué gastaste» y presupuestos en pasado');
  ok(doc.querySelectorAll('.bal-cel').length === 3 && /Sobró/.test(t), '3 cifras (sin deudas) y «Sobró» en la barra');
  t = await ver('m:2026-07');
  ok(/Gastaste más de lo que entró: 300,00 € salieron de lo que ya tenías/.test(t) && doc.querySelector('.bal-v.neg'), 'julio negativo: «Gastaste más de lo que entró»');
  ok(!/Frente a junio/.test(t), 'si el mes anterior no tiene apuntes, no hay «Frente a»');
  t = await ver('m:2026-06');
  ok(/En junio no apuntaste nada/.test(t) && !doc.querySelector('.bal-cels'), 'mes sin apuntes');
  t = await ver('m:2026-10');
  ok(/Te queda/.test(t) && !/Balance de octubre/.test(t), 'el mes en curso, igual que siempre');
  t = await ver('y:2025');
  ok(/Balance de 2025/.test(t) && /Año cerrado/i.test(t) && /Lo destacado de 2025/.test(t) && /−100|-100/.test(doc.querySelector('.bal-v').textContent), 'año pasado: balance y lo destacado');
  ok(/Cerraste a tu favor 0 de 1 mes con apuntes/.test(t), 'lo destacado cuenta solo meses con apuntes');
  t = await ver('y:2026');
  ok(!/Balance de 2026/.test(t), 'el año en curso, sin balance');
  // umbral 10 € y 10 %
  const e2 = makeEnv({ movs: [mv('a', 'Ingreso', 'N', 1000, '2026-08-01'), mv('b', 'Gasto', 'Comida', 400, '2026-08-02'), mv('c', 'Ingreso', 'N', 1000, '2026-09-01'), mv('d', 'Gasto', 'Comida', 405, '2026-09-02')], version: { balance: 0 }, pre: fijaFecha('2026-10-15'), cfg: { app: {}, meta: { onboarded: true } } });
  await sleep(200); const A2 = e2.w.__APP__; A2.S.tab = 'movimientos'; A2.S.movVista = 'resumen'; A2.S.movPeriodo = 'm:2026-09'; A2.render(); await sleep(20);
  ok(e2.doc.querySelectorAll('.bal-frente .bal-lin').length === 1, 'cambios pequeños (menos de 10 € y 10 %): solo la línea del balance');
  // mes desde el día que cobras: un mes que cruza dos meses del calendario
  const e3 = makeEnv({ movs: [mv('a', 'Ingreso', 'N', 1000, '2026-08-25'), mv('b', 'Gasto', 'Comida', 100, '2026-09-10'), mv('c', 'Gasto', 'Comida', 50, '2026-09-26')], version: { balance: 0 }, pre: fijaFecha('2026-10-15'), cfg: { app: { mesInicio: { modo: 'cobro', dia: 25 } }, meta: { onboarded: true } } });
  await sleep(200); const A3 = e3.w.__APP__; const r = A3.rangoMes(2026, 9); A3.S.tab = 'movimientos'; A3.S.movVista = 'resumen'; A3.S.movPeriodo = 'm:2026-09'; A3.render(); await sleep(20);
  ok(/Balance de septiembre/.test(e3.doc.getElementById('content').textContent) && /\+900/.test((e3.doc.querySelector('.bal-v') || {}).textContent || ''), 'tu mes desde el día 25 (' + r.desde + ' a ' + r.hasta + '): cuenta lo de ese tramo');
  // versión anterior
  S.verAnterior = Object.assign({}, S.verAnterior, { balance: 1 }); t = await ver('m:2026-09');
  ok(/Te queda/.test(t) && !/Balance de septiembre/.test(t), '«Antes» deja el resumen como estaba');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

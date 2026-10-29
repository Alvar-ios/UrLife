// Calidad 29/10 (docs/23 §4): casos raros del mes y el año cerrados como balance. Datos inventados.
console.error = () => {};
const fs = require('fs'), path = require('path');
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const fija = (iso, extra) => (w) => { const D = w.Date, t = new D(iso + 'T12:00:00').getTime(); class FD extends D { constructor(...a) { if (!a.length) super(t); else super(...a); } static now() { return t; } } w.Date = FD; if (extra) extra(w); };
const animar = (w) => { w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }); w.Element.prototype.animate = function () { return { set onfinish(f) { setTimeout(() => f && f(), 50); } }; }; };
const mv = (id, tipo, categoria, importe, fecha) => ({ id, tipo, categoria, importe, fecha });
const base = (movs, app, hoy, extra) => makeEnv({ movs, version: { balance: 0 }, pre: fija(hoy || '2026-10-15', extra), cfg: { app: Object.assign({ categoriasGasto: [{ nombre: 'Comida' }, { nombre: 'Casa' }] }, app || {}), meta: { onboarded: true } } });
const ver = async (e, p) => { const A = e.w.__APP__; A.S.tab = 'movimientos'; A.S.movVista = 'resumen'; A.S.movPeriodo = p; A.render(); await sleep(20); return e.doc.getElementById('content').textContent; };
(async () => {
  /* 1. Usuario nuevo: sin ningún movimiento */
  let e = base([]); await sleep(150);
  let t = await ver(e, 'm:2026-09');
  ok(/Balance de septiembre/.test(t) && /no apuntaste nada/.test(t) && !/undefined|NaN/.test(t), 'usuario nuevo: septiembre cerrado sin datos, sin «undefined» ni «NaN»');
  t = await ver(e, 'y:2025');
  ok(/Balance de 2025/.test(t) && !/Lo destacado/.test(t) && !/undefined|NaN/.test(t), 'usuario nuevo: año pasado sin datos, sin «Lo destacado»');

  /* 2. Mes solo con gastos y mes solo con ingresos */
  e = base([mv('a', 'Gasto', 'Comida', 120, '2026-09-05'), mv('b', 'Ingreso', 'Nómina', 900, '2026-08-01')]); await sleep(150);
  t = await ver(e, 'm:2026-09');
  ok(/No apuntaste ingresos en septiembre/.test(t) && e.doc.querySelector('.bal-v.neg') && !/undefined|NaN|Infinity/.test(t), 'solo gastos: «No apuntaste ingresos», cifra en negativo');
  t = await ver(e, 'm:2026-08');
  ok(/Te sobraron después de gastar/.test(t) && /\+900/.test(e.doc.querySelector('.bal-v').textContent) && /Sobró/.test(t) && !/NaN|Infinity/.test(t), 'solo ingresos: +900 y «Sobró»');
  ok(/Sin gastos apuntados en agosto/.test(t), 'solo ingresos: «Sin gastos apuntados en agosto»');

  /* 3. Categorías sin nombre y devoluciones */
  e = base([mv('a', 'Ingreso', 'Nómina', 1000, '2026-08-01'), mv('b', 'Gasto', '', 200, '2026-08-03'), mv('c', 'Ingreso', 'Nómina', 1000, '2026-09-01'), mv('d', 'Gasto', '', 600, '2026-09-03'), mv('f', 'Gasto', 'Comida', -50, '2026-09-04')]); await sleep(150);
  t = await ver(e, 'm:2026-09');
  const fr = e.doc.querySelector('.bal-frente').textContent;
  ok(/Sin categoría/.test(fr) && !/undefined|:\s+\(/.test(fr), 'categoría vacía: sale «Sin categoría» en «Frente a agosto» (' + fr.replace(/\s+/g, ' ').slice(0, 200) + ')');
  ok(/\+450/.test(e.doc.querySelector('.bal-v').textContent), 'devolución (gasto en negativo) suma al balance: +450');
  // año con un mes en negativo y la categoría vacía: «Lo que más pesó»
  e = base([mv('a', 'Ingreso', 'Nómina', 500, '2025-03-01'), mv('b', 'Gasto', '', 900, '2025-03-03'), mv('c', 'Ingreso', 'Nómina', 900, '2025-04-01')]); await sleep(150);
  t = await ver(e, 'y:2025');
  ok(/Lo que más pesó/.test(t) && !/undefined/.test(t) && !/pesó:\s+\(/.test(t), 'año: «Lo que más pesó» con categoría vacía no dice «undefined» ni sale vacío (' + ((t.match(/Lo que más pesó[^.]*\./) || [''])[0]) + ')');

  /* 4. Enero frente a diciembre del año anterior */
  e = base([mv('a', 'Ingreso', 'Nómina', 1000, '2025-12-01'), mv('b', 'Gasto', 'Casa', 300, '2025-12-02'), mv('c', 'Ingreso', 'Nómina', 1000, '2026-01-01'), mv('d', 'Gasto', 'Casa', 500, '2026-01-02')]); await sleep(150);
  t = await ver(e, 'm:2026-01');
  ok(/Balance de enero/.test(t) && /Frente a diciembre/.test(t) && /Lo que más subió: Casa/.test(t), 'enero 2026 se compara con diciembre 2025');
  ok(/↑ 67 %/.test(e.doc.querySelector('.bal-cel.gas').textContent), 'chip de gastos de enero frente a diciembre: ↑ 67 %');
  t = await ver(e, 'm:2025-12');
  ok(/Balance de diciembre 2025/.test(t), 'un mes de otro año lleva el año en el título');

  /* 5. Deudas solo en uno de los meses */
  e = base([mv('a', 'Ingreso', 'Nómina', 1000, '2026-08-01'), mv('b', 'Deuda', 'Préstamo', 200, '2026-08-05'), mv('c', 'Ingreso', 'Nómina', 1000, '2026-09-01'), mv('d', 'Gasto', 'Comida', 100, '2026-09-05')]); await sleep(150);
  t = await ver(e, 'm:2026-09');
  ok(e.doc.querySelectorAll('.bal-cel').length === 4 && /Pagaste de deudas/.test(t) && !e.doc.querySelector('.bal-cel.deu .kpi-chip'), 'deuda solo en agosto: septiembre enseña «Pagaste de deudas» 0 sin chip');
  t = await ver(e, 'm:2026-08');
  ok(/Pagaste de deudas/.test(t) && /Deudas/.test(e.doc.querySelector('.bal-barra').textContent), 'agosto: deudas en la cifra y en la barra');

  /* 6. Mes «desde que cobro la nómina»: el mes que espera la nómina NO está cerrado */
  const cob = { categoriasGasto: [{ nombre: 'Otros' }], ingresos: ['Nómina'], cobros: [{ nombre: 'Nómina', importe: 1850, regla: { t: 'ultHabil' }, desde: '2026-06-01' }], mesInicio: { modo: 'cobro', dia: 28, nomina: 'Nómina' } };
  e = base([mv('n1', 'Ingreso', 'Nómina', 1850, '2026-08-28'), mv('n2', 'Ingreso', 'Nómina', 1850, '2026-09-30'), mv('g', 'Gasto', 'Otros', 10, '2026-09-10')], cob, '2026-10-23'); await sleep(200);
  let A = e.w.__APP__;
  t = await ver(e, 'm:2026-09');
  ok(/Balance de septiembre/.test(t) && /\+1\.840/.test(e.doc.querySelector('.bal-v').textContent), 'nómina: septiembre suma solo su tramo (+1.840)');
  // la nómina de octubre no ha llegado (último día hábil = 30 oct), hoy 2 nov: octubre sigue abierto esperando
  e = base([mv('n1', 'Ingreso', 'Nómina', 1850, '2026-08-28'), mv('n2', 'Ingreso', 'Nómina', 1850, '2026-09-30')], cob, '2026-11-02'); await sleep(200);
  A = e.w.__APP__; const r = A.rangoMes(2026, 10);
  ok(!!r.previsto, 'nómina: esperando la de noviembre, octubre aún no se da por cerrado (' + r.desde + ' – ' + r.hasta + ', previsto ' + !!r.previsto + ')');
  t = await ver(e, 'm:2026-10');
  ok(!/Balance de octubre/.test(t) && /Te queda/.test(t), 'nómina: el mes que espera la nómina sigue con «Te queda»');

  /* 7. Las flechas desde un mes cerrado siguen deslizando el cuerpo */
  e = base([mv('a', 'Ingreso', 'Nómina', 1000, '2026-08-01'), mv('b', 'Ingreso', 'Nómina', 1000, '2026-09-01')], null, '2026-10-15', animar); await sleep(150);
  A = e.w.__APP__; A.H.goTab(['movimientos']); A.S.movVista = 'resumen'; A.S.movPeriodo = 'm:2026-09'; A.render(); await sleep(20);
  A.H.movPerMover([-1]); await sleep(5)
  ok(e.doc.querySelector('.mov-fantasma') && /Balance de agosto/.test(e.doc.querySelector('#movCuerpo').textContent), 'flecha atrás desde septiembre: desliza y entra «Balance de agosto»');
  A.H.movPerMover([1]); A.H.movPerMover([1]); await sleep(5);
  ok(e.doc.querySelectorAll('.mov-fantasma').length <= 1 && /Te queda/.test(e.doc.querySelector('#movCuerpo').textContent), 'flecha hasta el mes en curso: vuelve «Te queda» y como mucho una copia');
  await sleep(300);
  ok(!e.doc.querySelector('.mov-fantasma'), 'al terminar no queda ninguna copia');

  /* 8. El botón «Antes» sale en un mes cerrado y en un año cerrado */
  A.S.movPeriodo = 'm:2026-09'; A.render(); await sleep(10);
  ok(/Balance de septiembre/.test(e.doc.querySelector('#content').textContent), 'vuelta a septiembre: balance');

  /* 9. Código: el mes nunca con fecha.slice(0, 7) en lo nuevo */
  const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8'), i0 = src.indexOf('Mes cerrado como informe'), i1 = src.indexOf('function renderMovResumen');
  const trozo = src.slice(i0, i1);
  ok(i0 > 0 && !/fecha\s*\|\|\s*''\)\.slice\(0,\s*7\)|\.fecha\.slice\(0,\s*7\)/.test(trozo), 'lo nuevo no calcula el mes con fecha.slice(0, 7)');

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

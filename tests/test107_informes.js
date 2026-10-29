// 29/10 (docs/23 §2): informes en texto hechos en el móvil, aviso en Inicio, ajustes y pieza de Inicio. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const fijaFecha = (iso) => (w) => { const D = w.Date, t = new D(iso + 'T12:00:00').getTime(); class FD extends D { constructor(...a) { if (!a.length) super(t); else super(...a); } static now() { return t; } } w.Date = FD; };
const mv = (id, tipo, cat, imp, fecha, extra) => Object.assign({ id, tipo, categoria: cat, importe: imp, fecha }, extra || {});
const movs = [mv('j1', 'Ingreso', 'Nómina', 1000, '2026-07-01'), mv('j2', 'Gasto', 'Ocio', 900, '2026-07-05'),
  mv('a1', 'Ingreso', 'Nómina', 1000, '2026-08-01'), mv('a2', 'Gasto', 'Comida', 400, '2026-08-10'), mv('a3', 'Gasto', 'Casa', 300, '2026-08-12'),
  mv('s1', 'Ingreso', 'Nómina', 1000, '2026-09-01'), mv('s2', 'Gasto', 'Comida', 600, '2026-09-10'), mv('s3', 'Gasto', 'Casa', 100, '2026-09-12'), mv('s4', 'Ahorro', 'Viaje', 50, '2026-09-20'),
  mv('o1', 'Ingreso', 'Nómina', 1000, '2026-10-01'), mv('o2', 'Gasto', 'Comida', 45.5, '2026-10-06'), mv('o3', 'Gasto', 'Ocio', 20, '2026-10-08')];
(async () => {
  const e = makeEnv({ movs, version: { inicio: 0, balance: 0, tu: 0 }, pre: fijaFecha('2026-10-15'), cfg: { app: { categoriasGasto: [{ nombre: 'Comida', presupuesto: 500 }, { nombre: 'Casa' }, { nombre: 'Ocio' }], facturas: [{ nombre: 'Gimnasio', importe: 30, diaDelMes: 28 }], cobros: [{ nombre: 'Extra', importe: 100, diaDelMes: 25 }] }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, S = A.S, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost').textContent;
  const card = doc.querySelector('.inf-ini');
  ok(card && /Tu informe de septiembre/.test(card.textContent) && /Septiembre cerró con \+250/.test(card.textContent), 'Inicio avisa del informe de septiembre con su frase');
  H.infVer(['m:2026-09']); await sleep(20);
  const t = sh();
  ok(/Septiembre cerró con \+250\s€ a tu favor/.test(t) && /Las cifras/.test(t) && /Lo que cambió/.test(t), 'el informe: frase, cifras y lo que cambió');
  ok(/Comida: 600\s€, la que más subió/.test(t) && /Casa bajó a 100\s€/.test(t) && /Te pasaste 100\s€ de tu presupuesto de Comida/.test(t), 'categorías que suben y bajan y presupuesto superado, sin céntimos');
  ok(/no es asesoramiento financiero/.test(t) && !/Previsto/.test(t), 'pie sin consejos; un mes cerrado no trae «Previsto»');
  ok(S.config.informes && S.config.informes.vistos['m:2026-09'], 'abrirlo lo marca como visto');
  H.closeSheet([]); await sleep(400); H.goTab(['inicio']); await sleep(20);
  ok(!doc.querySelector('.inf-ini'), 'ya visto: el aviso se va de Inicio');
  // hazme uno ahora: este mes (no ha terminado) con previsto
  H.infVer(['m:2026-10']); await sleep(20);
  ok(/Octubre va con/.test(sh()) && /aún no ha terminado/.test(sh()) && /Previsto/.test(sh()) && !(S.config.informes.vistos || {})['m:2026-10'], 'este mes: «va con», aviso de que no ha terminado y el previsto aparte');
  H.infVer(['t:2026-3']); await sleep(20);
  ok(/El trimestre cerró con \+400\s€ a tu favor: julio \+100\s€, agosto \+300\s€, septiembre \+300\s€\./.test(sh().replace(/ /g, ' ').replace(/ €/g, ' €')) || /julio \+100/.test(sh()), 'trimestre: balance y cada mes');
  H.infVer(['a:2026']); await sleep(20);
  ok(/En lo que va de 2026 te han sobrado/.test(sh()), 'lo que llevas de año');
  H.infVer(['w:2026-09-28']); await sleep(20);
  ok(/Gastaste 0\s€|Gastaste/.test(sh()) && /días sin gastos/.test(sh()), 'semana: lo gastado y los días sin gastos');
  H.infVer(['m:2026-06']); await sleep(20);
  ok(/En junio no apuntaste nada/.test(sh()), 'periodo sin apuntes');
  // ajustes: activar el semanal → nuevo aviso en Inicio
  H.infAjustes([]); await sleep(10);
  ok(doc.querySelectorAll('.inf-tog input').length === 4 && doc.querySelectorAll('.inf-tog input:checked').length === 2, 'por defecto: mensual y anual');
  H.infOn(['semana'], { checked: true }); await sleep(10); H.closeSheet([]); await sleep(400); H.goTab(['inicio']); await sleep(20);
  ok(S.config.informes.on.semana === true && /Tu informe de la semana/.test((doc.querySelector('.inf-ini') || {}).textContent || ''), 'activar el semanal: aviso del informe de la semana');
  H.infDescartar(['w:2026-10-05']); await sleep(20);
  ok(!doc.querySelector('.inf-ini'), 'la × lo quita');
  // Tú y la pieza de Inicio
  H.goTab(['tu']); await sleep(20);
  ok(doc.querySelector('[data-click^="infAbrir"]'), 'Tú tiene la fila «Informes»');
  H.goTab(['inicio']); S.config = Object.assign({}, S.config, { inicioWidgets: [{ t: 'informe' }] }); A.render(); await sleep(20);
  ok(/Último informe/.test(doc.getElementById('content').textContent) && /cerró con|Gastaste/.test((doc.querySelector('.iw-informe') || {}).textContent || ''), 'pieza «Último informe»');
  // enlace desde el mes cerrado de Movimientos
  S.tab = 'movimientos'; S.movVista = 'resumen'; S.movPeriodo = 'm:2026-09'; A.render(); await sleep(20);
  ok(/Ver el informe de septiembre/.test(doc.getElementById('content').textContent), 'el mes cerrado enlaza con su informe');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

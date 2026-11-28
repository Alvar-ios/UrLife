// 28/11 (docs/53 D): informe nuevo: carita (solo aquí), frase de asesor, 4 tarjetas con hoja visual y comparación con presupuesto o media. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const fijaFecha = (iso) => (w) => { const D = w.Date, t = new D(iso + 'T12:00:00').getTime(); class FD extends D { constructor(...a) { if (!a.length) super(t); else super(...a); } static now() { return t; } } w.Date = FD; };
const mv = (id, tipo, cat, imp, fecha, extra) => Object.assign({ id, tipo, categoria: cat, importe: imp, fecha }, extra || {});
// un mes con 11 apuntes: ingreso, 6 gastos (los tres primeros suman «g» en tres categorías) y 4 de relleno pequeños
function mes(p, mm, ing, comida, ocio, casa, extra) {
  const f = (d) => '2026-' + mm + '-' + d, l = [mv(p + 'i', 'Ingreso', 'Nómina', ing, f('01')), mv(p + 'c', 'Gasto', 'Comida', comida, f('10')), mv(p + 'o', 'Gasto', 'Ocio', ocio, f('12')), mv(p + 'h', 'Gasto', 'Casa', casa, f('14'))];
  for (let i = 0; i < 7; i++) l.push(mv(p + 'r' + i, 'Gasto', 'Comida', 1, f('2' + i)));
  return l.concat(extra || []);
}
const movs = [].concat(mes('jn', '06', 1000, 250, 100, 140), mes('jl', '07', 1000, 260, 120, 130), mes('ag', '08', 1000, 700, 300, 300), // agosto en rojo: 1.307 de gasto
  mes('se', '09', 1000, 300, 150, 150, [mv('sa', 'Ahorro', 'Viaje', 50, '2026-09-20')]), mes('oc', '10', 1000, 100, 50, 50).slice(0, 7));
(async () => {
  const e = makeEnv({ movs, version: { inicio: 0, balance: 0, tu: 1, informe: 0 }, pre: fijaFecha('2026-10-15'), cfg: { app: { categoriasGasto: [{ nombre: 'Comida' }, { nombre: 'Casa' }, { nombre: 'Ocio' }] } } });
  await sleep(200);
  const A = e.w.__APP__, S = A.S, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost').textContent, shh = () => doc.querySelector('#sheetHost');
  H.infVer(['m:2026-09']); await sleep(30);
  const t = sh();
  ok(doc.querySelector('.inf-cara.n5') && /Muy bueno/.test(t), 'septiembre (te queda el 39 %): carita muy contenta con su etiqueta');
  ok(/Te quedó el 3\d % de lo que entró/.test(t), 'dice cuánto te quedó');
  ok(!/En una frase|Las cifras|Lo que cambió/.test(t), 'ya no está la lista de texto de antes');
  ok(shh().querySelectorAll('.inf-card').length === 4 && /Entró/.test(t) && /Gastaste/.test(t) && /Apartaste e invertiste/.test(t) && /Balance/.test(t), 'cuatro tarjetas tocables');
  ok(/Frente a tu media de los 3 últimos meses/.test(t) && shh().querySelectorAll('.inf-cmp-b em').length === 3, 'sin presupuesto, se compara con la media de los 3 últimos meses (3 filas con su marca)');
  ok(doc.querySelector('.inf-asesor') && doc.querySelector('.inf-asesor').textContent.length > 20, 'frase de asesor');
  ok(!doc.querySelector('#content .inf-cara'), 'la carita solo sale dentro del informe');
  const k = A.kpisMes ? A.kpisMes(2026, 9) : null;
  // hojas
  H.infHoja(['m:2026-09', 'gas']); await sleep(30);
  ok(shh().querySelector('svg.inf-anillo') && shh().querySelectorAll('.inf-ley-f').length >= 3 && /Lo que gastaste/.test(sh()) && /Comida/.test(sh()), 'Gastaste: anillo y leyenda por categoría');
  ok(shh().querySelector('.av-volver') && /Informe/.test(shh().querySelector('.av-volver').textContent), 'la hoja trae su «‹ Informe»');
  shh().querySelector('.av-volver').click(); await sleep(30);
  ok(shh().querySelectorAll('.inf-card').length === 4, 'volver deja el informe');
  H.infHoja(['m:2026-09', 'ing']); await sleep(30);
  ok(shh().querySelector('.inf-apil') && /Nómina/.test(sh()) && /Lo que entró/.test(sh()), 'Entró: barra apilada por fuente');
  H.infHoja(['m:2026-09', 'aho']); await sleep(30);
  ok(/Viaje/.test(sh()) && shh().querySelector('.inf-cmp-b i.aho') && /5 % de lo que entró/.test(sh()), 'Apartaste: una barra por meta con su % de lo que entró');
  H.infHoja(['m:2026-09', 'bal']); await sleep(30);
  const cas = [...shh().querySelectorAll('.inf-cas b')].map((x) => x.textContent.replace(/\s/g, ' '));
  ok(cas.length === 4 && /^\+?3\d\d/.test(cas[3].replace(/^[+−]/, '')) , 'Balance: cascada Entró − Gastaste − Apartaste = Balance (' + cas.join(' | ') + ')');
  ok(shh().querySelectorAll('.inf-hist-c').length === 6 && shh().querySelectorAll('.inf-hist-c.act').length === 1, 'Balance: seis periodos en barritas con el actual resaltado');
  // las cifras cuadran con kpisMes
  const kp = A.kpisMes(2026, 9), bal = kp.ingresos - kp.facturas - kp.gastos - kp.ahorro - kp.inversion - kp.deuda;
  ok(Math.abs(bal - kp.disponible) < 0.005, 'el balance de la hoja es el de kpisMes');
  // agosto en rojo
  H.infVer(['m:2026-08']); await sleep(30);
  ok(doc.querySelector('.inf-cara.n1') && /Muy apretado/.test(sh()) && /Gastaste 3\d\d\s€ más de lo que entró/.test(sh()), 'agosto en rojo: carita muy triste y «Gastaste X más de lo que entró»');
  ok(/Lo que más pesó fue Comida/.test(sh()), 'y qué hacer: por la categoría que más pesó');
  // mes en curso: sin carita
  H.infVer(['m:2026-10']); await sleep(30);
  ok(!doc.querySelector('.inf-cara') && /Va (bien|justo|apretado)|aún no ha terminado/.test(sh()), 'este mes (con pocos apuntes y sin cerrar): sin carita');
  // sin meses para comparar
  H.infVer(['m:2026-06']); await sleep(30);
  ok(/Aún no tengo meses anteriores para comparar/.test(sh()), 'sin meses anteriores: lo dice');
  // presupuesto: se compara con él y la carita no pasa de «Bueno» si te pasas
  S.config = Object.assign({}, S.config, { categoriasGasto: [{ nombre: 'Comida', presupuesto: 200 }, { nombre: 'Casa' }, { nombre: 'Ocio' }] }); A.render();
  H.infVer(['m:2026-09']); await sleep(30);
  ok(/Frente a tu presupuesto/.test(sh()) && /previstos/.test(sh()) && !/Frente a tu media/.test(sh()), 'con presupuesto se compara con él, no con la media');
  ok(doc.querySelector('.inf-cara.n4') && /Te pasaste \d+\s€ en Comida/.test(sh()), 'pasarte de presupuesto frena la carita en «Bueno» y lo dice');
  // el anterior sigue en «Antes»
  S.verAnterior = Object.assign({}, S.verAnterior, { informe: 1 }); H.infVer(['m:2026-09']); await sleep(30);
  ok(/En una frase/.test(sh()) && /Ver la versión nueva/.test(sh()), '«Antes»: el informe de texto, con su enlace a la versión nueva');
  H.infVersion([0]); await sleep(30);
  ok(shh().querySelectorAll('.inf-card').length === 4 && /Ver la versión anterior/.test(sh()), 'el enlace vuelve al nuevo');
  // «Ver los movimientos» desde una hoja
  H.infHoja(['m:2026-09', 'gas']); await sleep(30);
  shh().querySelector('[data-click^="infIr"]').click(); await sleep(420);
  ok(S.tab === 'movimientos' && S.movFiltroTipo === '_gastos' && S.movPeriodo === 'm:2026-09', 'la hoja lleva a los movimientos filtrados');
  console.log(fails ? '\n' + fails + ' FALLOS' : '\nTODO BIEN'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log('ERROR', err); process.exit(1); });

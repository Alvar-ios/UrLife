// 18/10: botón para comparar con la versión anterior (pruebas) e Inicio v2 (compacto, «Así vas» en círculos).
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pad = (n) => String(n).padStart(2, '0');
const d = new Date(), Y = d.getFullYear(), M = d.getMonth() + 1, ym = Y + '-' + pad(M);
const pm = M === 1 ? 12 : M - 1, py = M === 1 ? Y - 1 : Y, ymPrev = py + '-' + pad(pm);
(async () => {
  const e = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 100 }], ingresos: ['Nómina'] }, meta: { onboarded: true } },
    movs: [{ id: 'n1', tipo: 'Ingreso', categoria: 'Nómina', importe: 2000, fecha: ym + '-01' }, { id: 's1', tipo: 'Gasto', categoria: 'Supermercado', importe: 95, fecha: ym + '-01' },
      { id: 'p1', tipo: 'Gasto', categoria: 'Supermercado', importe: 40, fecha: ymPrev + '-01' }] });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc;
  H.goTab(['inicio']); await sleep(10);
  ok(!!doc.querySelector('#compararHost .comparar-fab') && /Antes/.test(doc.querySelector('#compararHost').textContent), 'en Inicio sale el botón «Antes» arriba');
  ok(!!doc.querySelector('.hero2v2') && doc.querySelectorAll('.ins-c').length >= 2 && !doc.querySelector('.ins-card'), 'Inicio nuevo: «Así vas» en círculos');
  click(e, 'insVer', '0'); await sleep(10);
  ok(!!doc.querySelector('#popupBackdrop .ins-pop') && /Llevas .* gastados/.test(doc.querySelector('#popupBackdrop').textContent), 'al tocar un círculo, la frase entera y «Ver»');
  click(e, 'insVerIr', 'heroResumen'); await sleep(10);
  ok(S.tab === 'movimientos' && !doc.querySelector('#popupBackdrop'), '«Ver» lleva a su sitio y cierra');
  ok(/Barras 1\/3/.test(doc.querySelector('#compararHost').textContent), 'en el Resumen de Movimientos, el botón pasa por 3 versiones');
  H.setMovVista(['lista']); await sleep(10);
  ok(!doc.querySelector('#compararHost .comparar-fab'), 'en la Lista (sin versiones) no hay botón');
  H.goTab(['inicio']); await sleep(10);
  click(e, 'compararCambiar', 'inicio'); await sleep(10);
  ok(!!doc.querySelector('.ins-card') && !doc.querySelector('.hero2v2') && /Ver nueva/.test(doc.querySelector('#compararHost').textContent), '«Antes» enseña la versión anterior (tarjetas) y el botón dice «Ver nueva»');
  click(e, 'compararCambiar', 'inicio'); await sleep(10);
  ok(!!doc.querySelector('.hero2v2'), 'y vuelve a la nueva');
  H.compararToggle([]); await sleep(10);
  ok(!doc.querySelector('#compararHost .comparar-fab') && A.cfg().compararVersiones === false, 'en Tú se puede ocultar el botón');
  H.compararToggle([]); await sleep(10);
  ok(!!doc.querySelector('#compararHost .comparar-fab'), 'y volver a enseñarlo');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH', x); process.exit(1); });

// Fase 4 · Movimientos (17/10/2026): Resumen | Lista | Calendario, anillo con subcategorías, filtros en una hoja y calendario del mes.
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pad = (n) => String(n).padStart(2, '0');
const d = new Date(), Y = d.getFullYear(), M = d.getMonth() + 1, ym = Y + '-' + pad(M), hoy = ym + '-' + pad(d.getDate());
const pm = M === 1 ? 12 : M - 1, py = M === 1 ? Y - 1 : Y, ymPrev = py + '-' + pad(pm);
const txt = (e) => e.doc.querySelector('#content').textContent.replace(/\s+/g, ' ');
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const MOVS = [
  { id: 'n1', tipo: 'Ingreso', categoria: 'Nómina', importe: 2000, fecha: ym + '-01' },
  { id: 'v1', tipo: 'Factura', categoria: 'Vivienda', subcategoria: 'Alquiler', importe: 700, fecha: ym + '-01' },
  { id: 's1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Mercadona', importe: 39.6, fecha: hoy, articulos: [{ nombre: 'Pan', importe: 1.2 }] },
  { id: 's2', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Mercadona', importe: 60.4, fecha: ym + '-01' },
  { id: 'r1', tipo: 'Gasto', categoria: 'Restaurantes y bares', descripcion: 'Bar Pepe', importe: 30, fecha: ym + '-01' },
  { id: 'h1', tipo: 'Gasto', categoria: 'Salud y cuidado personal', subcategoria: 'Uñas', importe: 25, fecha: ym + '-01' },
  { id: 'h2', tipo: 'Gasto', categoria: 'Salud y cuidado personal', subcategoria: 'Pelo', importe: 15, fecha: ym + '-01' },
  { id: 'h3', tipo: 'Gasto', categoria: 'Salud y cuidado personal', importe: 10, fecha: ym + '-01' },
  { id: 't1', tipo: 'Gasto', categoria: 'Transporte', importe: 20, fecha: ym + '-01' },
  { id: 'o1', tipo: 'Gasto', categoria: 'Ocio', importe: 12, fecha: ym + '-01' },
  { id: 'c1', tipo: 'Gasto', categoria: 'Compras', importe: 8, fecha: ym + '-01' },
  { id: 'm1', tipo: 'Gasto', categoria: 'Mascotas', importe: 5, fecha: ym + '-01' },
  { id: 'p1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Mercadona', importe: 50, fecha: ymPrev + '-01' },
];
(async () => {
  const e = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 300 }], ingresos: ['Nómina'] }, meta: { onboarded: true } }, movs: MOVS });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc;

  /* 1. Se entra siempre en el Resumen, con tres vistas y la cabecera nueva */
  H.goTab(['movimientos']); await sleep(10);
  ok(S.movVista === 'resumen' && /En qué gastas/.test(txt(e)), 'al entrar en Movimientos se abre el Resumen');
  ok([...doc.querySelectorAll('.mov-vista button')].map((b) => b.textContent).join('|') === 'Resumen|Lista|Calendario', 'tres vistas: Resumen | Lista | Calendario');
  ok(!!doc.querySelector('.mov-cab .mov-per-lbl') && !doc.querySelector('.mov-modo') && !doc.querySelector('.mov-nav'), 'cabecera limpia: el nombre del mes (sin tarjeta ni «Mes / Año»)');
  ok(doc.querySelectorAll('.kpi-mes .kpi').length === 4, 'las 4 cifras siguen');

  /* 2. El anillo: como mucho 6 colores, «Otras» agrupa lo pequeño, colores fijos */
  const ley = () => [...doc.querySelectorAll('#donutLegend .dn-f .dn-n')].map((x) => x.textContent);
  ok(ley().length === 6 && ley()[5] === 'Otras' && ley()[0] === 'Vivienda', 'leyenda: las 5 mayores y «Otras» (' + ley().join(', ') + ')');
  ok(doc.querySelectorAll('#donutWrap circle.dn-s').length === 6, 'el anillo tiene 6 trozos');
  ok(/1\.\d{3},\d{2} €|9\d\d,\d{2} €|\d+ €/.test(doc.querySelector('#donutWrap .dn-c2').textContent) && /gastado/.test(doc.querySelector('#donutWrap').textContent), 'en el centro, lo gastado');
  const colSuper = A.colorCat('Supermercado');
  ok(colSuper === A.colorCat('supermercado') && doc.querySelector('#donutWrap circle[stroke="' + colSuper + '"]') && /--cc:\s*#1FA67A/i.test([...doc.querySelectorAll('.budget-row')].find((r) => /Supermercado/.test(r.textContent)).getAttribute('style')), 'cada categoría tiene siempre su color (anillo y presupuestos)');

  /* 3. Tocar una categoría con subcategorías la divide; tocar una subcategoría abre sus movimientos */
  H.donutSel(['Salud y cuidado personal']); await sleep(5);
  ok(/Uñas/.test(doc.querySelector('#donutLegend').textContent) && /Pelo/.test(doc.querySelector('#donutLegend').textContent) && /Sin detalle/.test(doc.querySelector('#donutLegend').textContent) && /Todas/.test(doc.querySelector('#donutLegend').textContent), 'Salud se divide en sus subcategorías (Uñas, Pelo, Sin detalle)');
  ok(doc.querySelectorAll('#donutWrap circle.dn-s').length === 3 && /Salud y cuidad/.test(doc.querySelector('#donutWrap').textContent), 'el anillo pasa a ser el de Salud y el centro lo dice');
  H.donutIr(['Salud y cuidado personal', 'Uñas']); await sleep(10);
  ok(S.movVista === 'lista' && S.movCat === 'Salud y cuidado personal' && S.movSub === 'Uñas' && /1 movimiento\b/.test(txt(e)), 'tocar «Uñas» abre la lista de esa subcategoría');
  click(e, 'volver'); await sleep(10);
  ok(S.movVista === 'resumen', '«Volver» deja otra vez en el Resumen');
  H.donutSel(['Otras']); await sleep(5);
  ok(/Ocio/.test(doc.querySelector('#donutLegend').textContent) && /Mascotas/.test(doc.querySelector('#donutLegend').textContent), '«Otras» enseña las categorías que agrupa');
  H.donutSel(['']); await sleep(5);
  H.donutSel(['Transporte']); await sleep(5);
  ok(doc.querySelectorAll('#donutWrap circle.dn-s.off').length === 5 && !!doc.querySelector('#donutWrap circle.dn-s.sel') && /Ver sus movimientos/.test(doc.querySelector('#donutLegend').textContent), 'sin subcategorías: se resalta y los demás se apagan');
  H.donutSel(['Transporte']); await sleep(10);
  ok(S.movVista === 'lista' && S.movCat === 'Transporte', 'segundo toque: abre sus movimientos');
  click(e, 'volver'); await sleep(10);

  /* 4. Frente al mes anterior y «Dónde más gastas» */
  const chip = doc.querySelector('.kpi.expense .kpi-chip');
  ok(!!chip && /[↑↓=]/.test(chip.textContent), 'Gastos lleva un chip frente al mes anterior (' + (chip ? chip.textContent : '—') + ')');
  ok(/Dónde más gastas/.test(txt(e)) && /Mercadona.*2 veces/.test(doc.querySelector('.donde').textContent), '«Dónde más gastas»: Mercadona, 2 veces');
  ok(/Llevas .* presupuestados/.test(doc.querySelector('.pres-card').textContent) && !doc.querySelector('.pres-card .pb-edit'), 'presupuestos en filas finas, sin «Cambiar» en cada una');

  /* 5. Lista: filas, lupa (también por importe) y hoja «Filtros» */
  H.setMovVista(['lista']); await sleep(10);
  ok(!doc.querySelector('#content .entra') && !doc.querySelector('#content.entra'), 'cambiar de vista no hace el fundido a negro (sin «entra»)');
  ok(doc.querySelectorAll('.mov-tipos .pill').length === 3 && !!doc.querySelector('[data-click="movBuscarAbrir"]') && !!doc.querySelector('[data-click="movFiltrosAbrir"]'), 'tres filtros a la vista, la lupa y «Filtros»');
  const fila = (id) => { const r = [...doc.querySelectorAll('#movList .row')].find((x) => (x.getAttribute('data-click') || '').endsWith('|' + id)); return r ? r.querySelector('.ttl').textContent + ' / ' + (r.querySelector('.meta') ? r.querySelector('.meta').textContent : '—') : ''; };
  ok(fila('s1') === 'Mercadona / Supermercado', 'arriba lo que distingue, debajo la categoría (' + fila('s1') + ')');
  ok(fila('t1') === 'Transporte / —', 'sin texto: solo la categoría (' + fila('t1') + ')');
  ok(fila('h1') === 'Uñas / Salud y cuidado personal', 'con subcategoría: la subcategoría arriba (' + fila('h1') + ')');
  ok(/--cc:/.test(doc.querySelector('#movList .mov-ic.t-cat').getAttribute('style')), 'el icono lleva el color de su categoría');
  click(e, 'movBuscarAbrir'); await sleep(40);
  ok(!!doc.querySelector('#movSearch') && /Cancelar/.test(txt(e)), 'la lupa abre el buscador');
  doc.querySelector('#movSearch').value = '39,60'; doc.querySelector('#movSearch').dispatchEvent(new e.w.Event('input', { bubbles: true })); await sleep(220);
  ok(/1 movimiento\b/.test(doc.querySelector('#movList').textContent) && /Mercadona/.test(doc.querySelector('#movList').textContent), 'busca por importe: «39,60» encuentra el de Mercadona');
  click(e, 'movBuscarCerrar'); await sleep(10);
  ok(!doc.querySelector('#movSearch') && S.movQuery === '', '«Cancelar» cierra y limpia la búsqueda');
  click(e, 'setMovFiltro', '_gastos'); await sleep(5);
  click(e, 'movFiltrosAbrir'); await sleep(5);
  ok(/Qué movimientos/.test(sh(e)) && /Tienen ticket/.test(sh(e)) && /Categoría/.test(sh(e)), 'hoja «Filtros»: tipos, «Tienen ticket» y categorías');
  click(e, 'movSoloTicket'); await sleep(5);
  ok(/1 movimiento\b/.test(doc.querySelector('#movList').textContent) && /Ver 1 movimiento\b/.test(sh(e)), '«Gastos» + «Tienen ticket» se suman y el botón cuenta en vivo');
  ok(doc.querySelector('.mov-ib.on .mov-ib-n') && doc.querySelector('.mov-ib.on .mov-ib-n').textContent === '1', 'el botón «Filtros» se ilumina con el número');
  click(e, 'movFiltrosQuitar'); await sleep(5); H.closeSheet([]); await sleep(250);
  ok(S.movFiltroTipo === 'Todos' && !S.movSoloTicket, '«Quitar todos»');

  /* 6. Elegir mes: «Todo» solo en la Lista */
  click(e, 'movMesAbrir'); await sleep(5);
  ok(/Elegir mes/.test(sh(e)) && !!doc.querySelector('#sheetHost [data-click="movMesModo|todo"]'), 'en la Lista, «Elegir mes» tiene Mes, Año entero y Todo');
  H.closeSheet([]); await sleep(250);
  H.setMovVista(['resumen']); await sleep(5); click(e, 'movMesAbrir'); await sleep(5);
  ok(!doc.querySelector('#sheetHost [data-click="movMesModo|todo"]') && !!doc.querySelector('#sheetHost [data-click="movMesModo|anio"]'), 'en el Resumen, sin «Todo»');
  H.closeSheet([]); await sleep(250);

  /* 7. Calendario */
  H.setMovVista(['calendario']); await sleep(10);
  ok(S.movVista === 'calendario' && !!doc.querySelector('.cal-grid'), 'Calendario del mes');
  const dia1 = doc.querySelector('.cal-d[data-click="movCalDia|' + ym + '-01"]');
  ok(!!dia1 && /lv[1-4]/.test(dia1.className) && !!dia1.querySelector('.pt-fijo') && !!dia1.querySelector('.pt-ing'), 'el día 1 tiene color de gasto, punto de fijo (alquiler) y de cobro');
  ok(!!doc.querySelector('.cal-d.hoy'), 'hoy va marcado');
  click(e, 'movCalDia', ym + '-01'); await sleep(5);
  ok(/Bar Pepe/.test(txt(e)) && /movimientos/.test(doc.querySelector('.cal-sep').textContent), 'al tocar un día salen sus movimientos');
  ok(/Día a día este mes/.test(txt(e)), 'resumen del gasto del día a día');
  H.setMovModo(['todo']); await sleep(5);
  ok(S.movVista === 'lista', '«Todo» lleva a la Lista (el calendario es de un mes)');

  /* 8. Cambiar de mes desde el Resumen mantiene la vista y no rompe */
  H.setMovVista(['resumen']); await sleep(5); H.movPerMover([-1]); await sleep(10);
  ok(S.movPeriodo === 'm:' + ymPrev && /En qué gastas/.test(txt(e)) && !!doc.querySelector('#movCuerpo'), 'flecha ← cambia al mes anterior en el Resumen');

  /* 9. Con «reducir movimiento» la app no anima, y sin animate() tampoco falla */
  ok(!doc.querySelector('.mov-fantasma'), 'no queda ninguna copia del cuerpo viejo');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH', x); process.exit(1); });

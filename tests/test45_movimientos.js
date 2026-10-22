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
  const e = makeEnv({ abrirVersiones: true, cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 300 }], ingresos: ['Nómina'] }, meta: { onboarded: true } }, movs: MOVS });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc;

  /* 1. Se entra siempre en el Resumen, con tres vistas y la cabecera nueva */
  H.goTab(['movimientos']); await sleep(10);
  ok(S.movVista === 'resumen' && /En qué gastas/.test(txt(e)), 'al entrar en Movimientos se abre el Resumen');
  ok([...doc.querySelectorAll('.mov-vista button')].map((b) => b.textContent).join('|') === 'Resumen|Lista|Calendario', 'tres vistas: Resumen | Lista | Calendario');
  ok(!!doc.querySelector('.mov-cab .mov-per-lbl') && !doc.querySelector('.mov-modo') && !doc.querySelector('.mov-nav'), 'cabecera limpia: el nombre del mes (sin tarjeta ni «Mes / Año»)');
  ok(doc.querySelectorAll('.kpi-mes .kpi').length === 4, 'las 4 cifras siguen');

  /* 2. «En qué gastas» (18/10): una lista con gasto, % y presupuesto; arriba la tira de colores (versión Barras) */
  const filasGc = () => [...doc.querySelectorAll('.gc-fila')].map((x) => x.getAttribute('data-gc'));
  ok(filasGc().slice(0, 6).join('|') === 'Vivienda|Supermercado|Salud y cuidado personal|Restaurantes y bares|Transporte|__otras', 'las 5 mayores y «Otras» (' + filasGc().join(', ') + ')');
  ok(doc.querySelectorAll('.gc-tira i').length === 6 && /925,00 €/.test(doc.querySelector('.gc-total').textContent), 'arriba la tira de 6 colores y lo gastado');
  const colSuper = A.colorCat('Supermercado');
  ok(colSuper === A.colorCat('supermercado') && /--cc:\s*#1FA67A/i.test(doc.querySelector('.gc-fila[data-gc="Supermercado"]').getAttribute('style')), 'cada categoría tiene siempre su color');
  /* 3. Abrir una categoría: se abre en su fila y el resto sigue a la vista */
  H.gcAbrir(['Salud y cuidado personal']); await sleep(5);
  let ab = doc.querySelector('.gc-fila.abierta');
  ok(ab && ab.getAttribute('data-gc') === 'Salud y cuidado personal' && /Uñas/.test(ab.textContent) && /Pelo/.test(ab.textContent) && /Sin detalle/.test(ab.textContent) && filasGc().length >= 6, 'Salud se abre en su fila con Uñas, Pelo y Sin detalle; las demás siguen');
  H.donutIr(['Salud y cuidado personal', 'Uñas']); await sleep(10);
  ok(S.movVista === 'lista' && S.movCat === 'Salud y cuidado personal' && S.movSub === 'Uñas' && /1 movimiento\b/.test(txt(e)), 'tocar «Uñas» abre la lista de esa subcategoría');
  click(e, 'volver'); await sleep(10);
  ok(S.movVista === 'resumen', '«Volver» deja otra vez en el Resumen');
  H.donutIr(['Salud y cuidado personal', '-']); await sleep(10);
  ok(/1 movimiento\b/.test(txt(e)) && /Sin detalle/.test(doc.querySelector('.sub-row .pill.active').textContent), '«Sin detalle» abre solo los gastos sin subcategoría');
  click(e, 'volver'); await sleep(10);
  H.gcAbrir(['__otras']); await sleep(5);
  ab = doc.querySelector('.gc-fila.abierta');
  ok(ab && /Ocio/.test(ab.textContent) && /Mascotas/.test(ab.textContent), '«Otras» enseña las categorías que agrupa');
  H.gcAbrir(['Supermercado']); await sleep(5);
  ab = doc.querySelector('.gc-fila.abierta');
  ok(doc.querySelectorAll('.gc-fila.abierta').length === 1 && /Mercadona · 2 veces/.test(ab.textContent) && /Ver los 2 movimientos/.test(ab.textContent), 'sin subcategorías: los sitios donde más gastas (Mercadona, 2 veces); solo una abierta a la vez');
  click(e, 'irMovs', '_gastos', S.movPeriodo, 'Supermercado'); await sleep(10);
  ok(S.movVista === 'lista' && S.movCat === 'Supermercado', '«Ver los movimientos» lleva a la lista');
  click(e, 'volver'); await sleep(10);
  H.gcAbrir(['Transporte']); await sleep(5); H.gcAbrir(['Transporte']); await sleep(5);
  ok(!doc.querySelector('.gc-fila.abierta'), 'tocar otra vez la cierra');
  /* 4. Frente al mes anterior; presupuesto en la misma lista */
  const chip = doc.querySelector('.kpi.expense .kpi-chip');
  ok(!!chip && /[↑↓=]/.test(chip.textContent) && !!doc.querySelector('.gc-total .gc-chip'), 'Gastos lleva un chip frente al mes anterior (' + (chip ? chip.textContent : '—') + ')');
  ok(/Llevas .* presupuestados/.test(doc.querySelector('.gc-card').textContent) && /de 300,00 €/.test(doc.querySelector('.gc-fila[data-gc="Supermercado"]').textContent) && !doc.querySelector('.donde'), 'el presupuesto va en la fila; «Dónde más gastas» va dentro de cada categoría');
  /* 4b. Las tres versiones para probar (botón de arriba) */
  ok(/Barras 1\/3/.test(doc.querySelector('#compararHost').textContent), 'arriba, el botón de versiones: «Barras 1/3»');
  click(e, 'compararCambiar', 'movResumen'); await sleep(10);
  ok(doc.querySelectorAll('.gc-mosaico .gc-ficha').length === 6 && !!doc.querySelector('.pres-card .budget-row'), 'Mosaico: 6 fichas y los presupuestos debajo');
  H.gcAbrir(['Supermercado']); await sleep(5);
  ok(/Mercadona/.test(doc.querySelector('#gcDet').textContent) && !!doc.querySelector('.gc-ficha.sel'), 'Mosaico: al tocar una ficha, su detalle debajo');
  click(e, 'compararCambiar', 'movResumen'); await sleep(10);
  ok(doc.querySelectorAll('#gcAnillo .dn-s').length === 6 && !!doc.querySelector('.gc-lista'), 'Anillo: el anillo y la lista debajo');
  H.gcAbrir(['Salud y cuidado personal']); await sleep(5);
  ok(doc.querySelectorAll('#gcAnillo .dn-s.sel').length === 1 && doc.querySelectorAll('#gcAnillo .gc-sub-arco').length === 3 && doc.querySelector('.gc-fila.abierta'), 'Anillo: el trozo elegido sale, alrededor sus subcategorías y la fila se abre (el anillo no se cierra)');
  click(e, 'compararCambiar', 'movResumen'); await sleep(10);
  ok(!!doc.querySelector('.gc-tira'), 'y vuelve a Barras');
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

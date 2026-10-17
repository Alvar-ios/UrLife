// Calidad (17/10/2026): revisión del rediseño de Movimientos (rama fase4/movimientos).
// Parte 1: casos raros que ya funcionan (tu mes desde el cobro, cambio de año, usuario nuevo, deslizar rápido, búsqueda por importe…).
// Parte 2 («FALLO CONOCIDO»): fallos encontrados en la revisión. Fallan a propósito hasta que Desarrollo los arregle.
// Sin datos reales: importes y nombres inventados.
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pad = (n) => String(n).padStart(2, '0');
const d = new Date(), Y = d.getFullYear(), M = d.getMonth() + 1, ym = Y + '-' + pad(M), hoy = ym + '-' + pad(d.getDate());
const txt = (e) => e.doc.querySelector('#content').textContent.replace(/\s+/g, ' ');
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
// fija «hoy» dentro de la app (para probar tu mes desde el cobro y el cambio de año sin depender del día real)
const fijaFecha = (iso, extra) => (w) => {
  const D = w.Date, t = new D(iso + 'T12:00:00').getTime();
  class FD extends D { constructor(...a) { if (!a.length) super(t); else super(...a); } static now() { return t; } }
  w.Date = FD; if (extra) extra(w);
};
// jsdom no anima: imitamos animate() para probar el deslizamiento (la copia del cuerpo viejo debe borrarse)
const animar = (w) => { w.Element.prototype.animate = function () { return { set onfinish(f) { setTimeout(() => f && f(), 320); } }; }; };
const cobro28 = { mesInicio: { modo: 'cobro', dia: 28 } };
const dias = (e) => [...e.doc.querySelectorAll('.cal-d:not(.fuera)')].map((x) => x.getAttribute('data-click').split('|')[1]);
const filas = (e) => [...e.doc.querySelectorAll('#movList .row .ttl')].map((x) => x.textContent);
async function buscar(e, q) {
  e.w.__APP__.H.movBuscarAbrir([]); await sleep(40);
  const i = e.doc.querySelector('#movSearch'); i.value = q; i.dispatchEvent(new e.w.Event('input', { bubbles: true })); await sleep(220);
  return filas(e);
}

(async () => {
  /* 1. «Tu mes» desde el cobro (día 28), hoy 17/10/2026 */
  let e = makeEnv({ pre: fijaFecha('2026-10-17'), cfg: { app: Object.assign({ categoriasGasto: [{ nombre: 'Supermercado' }] }, cobro28), meta: { onboarded: true } },
    movs: [
      { id: 'a', tipo: 'Gasto', categoria: 'Supermercado', importe: 10, fecha: '2026-09-29' },
      { id: 'b', tipo: 'Gasto', categoria: 'Supermercado', importe: 20, fecha: '2026-10-05' },
      { id: 'c', tipo: 'Gasto', categoria: 'Supermercado', importe: 99, fecha: '2026-10-28' },
      { id: 'p1', tipo: 'Gasto', categoria: 'Supermercado', importe: 15, fecha: '2026-08-30' },
      { id: 'p2', tipo: 'Gasto', categoria: 'Supermercado', importe: 50, fecha: '2026-09-20' },
      { id: 'dv', tipo: 'Gasto', categoria: 'Supermercado', importe: -5, fecha: '2026-10-06' },
    ] });
  await sleep(150);
  let A = e.w.__APP__, H = A.H, S = A.S;
  H.goTab(['movimientos']); await sleep(10);
  ok(/Octubre\s*28 sep – 27 oct · 2026/.test(e.doc.querySelector('.mov-cab').textContent), 'cobro día 28: la cabecera dice «Octubre · 28 sep – 27 oct»');
  const chip = e.doc.querySelector('.kpi.expense .kpi-chip');
  ok(!!chip && /a estas alturas: 15,00 €/.test(chip.getAttribute('title')) && /↑ 67 %/.test(chip.textContent), 'chip de Gastos: compara con septiembre de tu mes a estas mismas alturas (25 € frente a 15 €)');
  H.setMovVista(['calendario']); await sleep(10);
  const ds = dias(e);
  ok(ds[0] === '2026-09-28' && ds[ds.length - 1] === '2026-10-27', 'el calendario va del 28 sep al 27 oct (' + ds[0] + ' – ' + ds[ds.length - 1] + ')');
  ok(/lv[1-4]/.test(e.doc.querySelector('[data-click="movCalDia|2026-09-29"]').className) && !e.doc.querySelector('[data-click="movCalDia|2026-10-28"]'), 'lo del 29 sep cuenta en octubre; lo del 28 oct ya no');
  ok(/\blv0\b/.test(e.doc.querySelector('[data-click="movCalDia|2026-10-06"]').className), 'un día con solo una devolución no se pinta como gasto');
  click(e, 'movMesAbrir'); await sleep(5);
  ok(/Tu mes va del día 28 al 27/.test(sh(e)) && [...e.doc.querySelectorAll('#sheetHost .mm-mes.active')].map((x) => x.textContent).join() === 'Oct' && !e.doc.querySelector('#sheetHost [data-click="movMesModo|anio"]'), '«Elegir mes» en el Calendario: solo meses, octubre marcado y explica tu mes');
  H.closeSheet([]); await sleep(250);
  H.setMovVista(['lista']); await sleep(10);
  ok(/3 movimientos/.test(txt(e)) && /29 sep/.test(txt(e)), 'la Lista de octubre incluye lo del 29 de septiembre');

  /* 2. Cambio de año con cobro el 28: hoy 3/1/2027 ya es enero */
  e = makeEnv({ pre: fijaFecha('2027-01-03'), cfg: { app: Object.assign({ categoriasGasto: [{ nombre: 'Supermercado' }] }, cobro28), meta: { onboarded: true } },
    movs: [{ id: 'a', tipo: 'Gasto', categoria: 'Supermercado', importe: 10, fecha: '2026-12-29' }, { id: 'b', tipo: 'Gasto', categoria: 'Supermercado', importe: 30, fecha: '2026-12-20' }] });
  await sleep(150); A = e.w.__APP__; H = A.H; S = A.S;
  H.goTab(['movimientos']); await sleep(10);
  ok(/Enero\s*28 dic – 27 ene · 2027/.test(e.doc.querySelector('.mov-cab').textContent), 'cambio de año: el 3 de enero, tu mes es «Enero · 28 dic – 27 ene · 2027»');
  click(e, 'movMesAbrir'); await sleep(5);
  ok(/2027/.test(e.doc.querySelector('#sheetHost .mm-anio').textContent) && e.doc.querySelector('#sheetHost .mm-mes.active').textContent === 'Ene', '«Elegir mes» se abre en 2027 con enero marcado');
  H.closeSheet([]); await sleep(250);
  H.movPerMover([-1]); await sleep(10);
  ok(S.movPeriodo === 'm:2026-12' && /Diciembre/.test(e.doc.querySelector('.mov-cab').textContent), '‹ desde enero pasa a diciembre del año anterior');
  H.setMovVista(['calendario']); await sleep(10);
  const dd = dias(e);
  ok(dd[0] === '2026-11-27' && dd[dd.length - 1] === '2026-12-27', 'calendario de diciembre: del 27 nov (el 28 es sábado → viernes) al 27 dic');

  /* 3. Usuario nuevo, sin movimientos: nada se rompe */
  e = makeEnv({ cfg: { app: {}, meta: { onboarded: true } }, movs: [] });
  await sleep(150); A = e.w.__APP__; H = A.H; S = A.S;
  let err = '';
  try {
    H.goTab(['movimientos']); await sleep(10);
    ok(/Sin gastos registrados/.test(txt(e)) && !e.doc.querySelector('.kpi-chip') && e.doc.querySelectorAll('.mov-flechas .mov-flecha[disabled]').length === 2, 'usuario nuevo: Resumen vacío, sin chip y con las dos flechas apagadas');
    H.setMovVista(['lista']); await sleep(5);
    ok(/Apunta el primero/.test(txt(e)), 'usuario nuevo: la Lista invita a apuntar el primero');
    H.setMovVista(['calendario']); await sleep(5); click(e, 'movMesAbrir'); await sleep(5); H.closeSheet([]); await sleep(250);
    H.setMovVista(['lista']); await sleep(5); H.movFiltrosAbrir([]); await sleep(5); H.closeSheet([]); await sleep(250);
  } catch (x) { err = x.message; }
  ok(!err, 'usuario nuevo: las tres vistas y las hojas se abren sin errores' + (err ? ' (' + err + ')' : ''));

  /* 4. Deslizar: tocar rápido varias veces no deja nada a medias */
  e = makeEnv({ pre: animar, cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }] }, meta: { onboarded: true } },
    movs: [{ id: 'a', tipo: 'Gasto', categoria: 'Supermercado', importe: 10, fecha: (M > 3 ? Y : Y - 1) + '-' + pad(M > 3 ? M - 3 : M + 9) + '-01' }, { id: 'b', tipo: 'Gasto', categoria: 'Supermercado', importe: 10, fecha: ym + '-01' }] });
  await sleep(150); A = e.w.__APP__; H = A.H; S = A.S;
  H.goTab(['movimientos']); await sleep(10);
  for (let i = 0; i < 3; i++) H.movPerMover([-1]);
  H.setMovVista(['lista']); H.setMovVista(['calendario']); H.setMovVista(['resumen']);
  ok(e.doc.querySelectorAll('.mov-fantasma').length <= 1 && e.doc.querySelectorAll('#movCuerpo').length === 1, 'seis toques seguidos: como mucho una copia del cuerpo viejo y un solo cuerpo');
  ok(!e.doc.querySelector('.mov-fantasma [id], .mov-fantasma [data-click], .mov-fantasma [data-input]'), 'la copia que se desliza no tiene botones ni ids (no se puede tocar ni confunde a la app)');
  await sleep(700);
  ok(!e.doc.querySelector('.mov-fantasma') && !e.doc.querySelector('.deslizando'), 'al terminar no queda ninguna copia ni el marco «deslizando»');

  /* 5. Búsqueda por importe, nombres largos, devoluciones y filtros */
  const LARGA = 'Clases de cerámica y manualidades de los martes';
  e = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: LARGA }], cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 100 }, { id: 'c2', nombre: 'Efectivo', saldo: 50 }] }, meta: { onboarded: true } },
    movs: [
      { id: 's1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Mercadona', importe: 39.6, fecha: hoy, articulos: [{ nombre: 'Pan', importe: 1 }] },
      { id: 's2', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Lidl', importe: 139.6, fecha: hoy },
      { id: 's3', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Dia', importe: 3.96, fecha: hoy },
      { id: 's4', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Compra grande', importe: 1200, fecha: hoy },
      { id: 'f1', tipo: 'Factura', categoria: 'Suministros', descripcion: 'Luz', importe: 45, fecha: ym + '-01' },
      { id: 'l1', tipo: 'Gasto', categoria: LARGA, importe: 80, fecha: ym + '-01' },
      { id: 'dv', tipo: 'Gasto', categoria: 'Compras', descripcion: 'Devolución tienda', importe: -30, fecha: ym + '-01' },
      ...['Ocio', 'Mascotas', 'Viajes', 'Regalos', 'Deporte', 'Seguros'].map((c, i) => ({ id: 'k' + i, tipo: 'Gasto', categoria: c, importe: 20 - i, fecha: ym + '-01' })),
    ] });
  await sleep(150); A = e.w.__APP__; H = A.H; S = A.S;
  S.traspasos = [{ id: 't1', fecha: hoy, importe: 25, cuentaId: 'c1', cuentaDestinoId: 'c2' }];
  H.goTab(['movimientos']); await sleep(10);
  H.donutSel([LARGA]); await sleep(5);
  ok(/Clases de cerám…/.test(e.doc.querySelector('#donutWrap .dn-c1').textContent) && e.doc.querySelector('#donutLegend').textContent.indexOf(LARGA) >= 0, 'nombre largo: el centro del anillo lo corta con «…» y la leyenda lo tiene entero');
  H.donutSel(['']); await sleep(5);
  ok(!/Compras/.test(e.doc.querySelector('#donutLegend').textContent) && e.doc.querySelectorAll('#donutWrap circle.dn-s').length === 6, 'una categoría con solo devoluciones no sale en el anillo y el resto sigue (6 trozos)');
  H.setMovVista(['lista']); await sleep(10);
  for (const q of ['39', '39,6', '39.60', '39,60 €']) { const r = await buscar(e, q); ok(r.join() === 'Mercadona', 'buscar «' + q + '» encuentra solo el de 39,60 € (' + r.join() + ')'); }
  H.movBuscarCerrar([]); await sleep(5);
  ok(filas(e).indexOf('Devolución tienda') >= 0 && /\+30,00/.test([...e.doc.querySelectorAll('#movList .row')].find((r) => /Devolución tienda/.test(r.textContent)).textContent), 'la devolución sale en la Lista sumando (+30,00 €)');
  H.movFiltrosAbrir([]); await sleep(5);
  H.setMovFiltro(['Factura']); await sleep(5);
  ok(e.doc.querySelector('.mov-ib-n') && e.doc.querySelector('.mov-ib-n').textContent === '1' && /Ver 1 movimiento\b/.test(sh(e)) && filas(e).join() === 'Luz', 'hoja «Filtros»: «Fijos» se aplica al momento, el botón cuenta 1 y «Filtros» lleva el 1');
  H.setMovFiltro(['_gastos']); H.movSoloTicket([]); await sleep(5);
  ok(e.doc.querySelector('.mov-ib-n').textContent === '1' && /Ver 1 movimiento\b/.test(sh(e)), '«Gastos» (a la vista) no cuenta como filtro; «Tienen ticket» sí: 1');
  H.setMovCatFiltro(['Supermercado']); await sleep(5);
  ok(e.doc.querySelector('.mov-ib-n').textContent === '2' && /Ver 1 movimiento\b/.test(sh(e)), 'ticket + categoría: el número sube a 2');
  H.movFiltrosQuitar([]); await sleep(5);
  ok(!e.doc.querySelector('.mov-ib-n') && /Ver \d+ movimientos/.test(sh(e)), '«Quitar todos» quita el número');
  H.setMovFiltro(['_tras']); await sleep(5);
  ok(/Ver 1 movimiento\b/.test(sh(e)) && /1 traspaso/.test(txt(e)), 'filtro «Traspasos»: solo el traspaso');
  H.closeSheet([]); await sleep(250);

  /* 6. Periodos y atajos */
  H.goTab(['movimientos']); await sleep(5);
  ok(S.movVista === 'resumen' && S.movFiltroTipo === 'Todos' && !S.movCat, 'volver a entrar en Movimientos: Resumen y sin filtros');
  click(e, 'movMesAbrir'); await sleep(5); H.movMesModo(['anio']); await sleep(5); click(e, 'movMesElegir', 'y:' + Y); await sleep(250);
  ok(S.movPeriodo === 'y:' + Y && /el año entero/.test(e.doc.querySelector('.mov-cab').textContent), 'Resumen del año entero');
  H.setMovVista(['calendario']); await sleep(10);
  ok(/^m:/.test(S.movPeriodo) && !!e.doc.querySelector('.cal-grid'), 'del año al Calendario: pasa a un mes');
  H.setMovVista(['lista']); await sleep(5); H.setMovModo(['todo']); await sleep(5); H.setMovVista(['resumen']); await sleep(5);
  ok(S.movPeriodo === 'm:' + ym, 'de «Todo» al Resumen: vuelve al mes actual');
  H.goTab(['inicio']); await sleep(5); H.heroResumen([]); await sleep(5);
  ok(S.movVista === 'resumen' && S.movPeriodo === 'm:' + ym && /Así sale «Te queda este mes»/.test(txt(e)), 'desde la tarjeta de Inicio: Resumen del mes con la explicación');
  H.goTab(['inicio']); await sleep(5); H.irMovs(['_gastos', 'm:' + ym]); await sleep(5);
  ok(S.movVista === 'lista' && /Volver a Inicio/.test(txt(e)), 'atajo desde Inicio: abre la Lista con «Volver a Inicio»');
  click(e, 'volver'); await sleep(5);
  ok(S.tab === 'inicio', '«Volver» regresa a Inicio');

  /* ========== Parte 2: FALLOS CONOCIDOS (fallan hasta que se arreglen) ========== */
  H.goTab(['movimientos']); await sleep(5); H.setMovVista(['lista']); await sleep(5);
  // B1. «Tienen ticket» / «Son compartidos» enseñan también los traspasos (traspasosFiltrados no mira esos dos filtros)
  H.movSoloTicket([]); await sleep(5);
  ok(!/traspaso/.test(e.doc.querySelector('#movList .summary-line').textContent), 'Arreglado B1: con «Tienen ticket» no deben salir traspasos (' + e.doc.querySelector('#movList .summary-line').textContent + ')');
  H.movSoloTicket([]); await sleep(5);
  // B2. «Cambiar» presupuesto en la Lista de otro mes enseña lo gastado del mes que se vio en el Resumen
  H.irMovs(['_gastos', 'm:' + ym, 'Supermercado']); await sleep(5);
  H.movPerMover([-1]); await sleep(5);
  click(e, 'presEditar'); await sleep(5);
  ok(/llevas 0,00 €/.test(sh(e)), 'Arreglado B2: el presupuesto abierto desde la Lista del mes anterior debe decir lo de ese mes (0 €), no lo de este (' + (sh(e).match(/llevas [\d.,]+ €/) || [''])[0] + ')');
  H.closeSheet([]); await sleep(250);
  // B3. Dentro de «Otras», tocar una categoría no hace nada: el anillo vuelve al general sin elegirla
  H.goTab(['movimientos']); await sleep(5);
  H.donutSel(['Otras']); await sleep(5);
  const dentro = [...e.doc.querySelectorAll('#donutLegend .dn-f')].find((x) => /Seguros/.test(x.textContent));
  if (dentro) dentro.click(); await sleep(10);
  ok(S._donutSel === 'Seguros' || (S.movVista === 'lista' && S.movCat === 'Seguros'), 'Arreglado B3: tocar «Seguros» dentro de «Otras» debe elegirla o abrir su lista (ahora no hace nada)');
  // B4. Buscar con el punto de los miles («1.200») no encuentra el gasto de 1.200 €
  H.goTab(['movimientos']); await sleep(5); H.setMovVista(['lista']); await sleep(5);
  const r12 = await buscar(e, '1.200');
  ok(r12.join() === 'Compra grande', 'Arreglado B4: buscar «1.200» debe encontrar el gasto de 1.200 € (' + (r12.join() || 'nada') + ')');
  H.movBuscarCerrar([]); await sleep(5);
  // B5. Llegar con un filtro que no está en la hoja (Compartidos desde Juntos, Apartado desde Inicio): la hoja no enseña nada marcado
  H.irMovs(['_ahorro', 'm:' + ym]); await sleep(5); H.movFiltrosAbrir([]); await sleep(5);
  const marcado = [...e.doc.querySelectorAll('#sheetHost .chips')][0].querySelector('.chip.active');
  ok(!!marcado, 'Arreglado B5: viniendo de «Apartado e invertido», la hoja «Filtros» debe marcar qué movimientos estás viendo');
  H.closeSheet([]); await sleep(250);

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH', x); process.exit(1); });

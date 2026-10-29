// 29/10 (docs/21): Calidad de «Inicio a tu gusto». Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoy = new Date(), iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const mesAtras = (n, dia) => iso(new Date(hoy.getFullYear(), hoy.getMonth() - n, dia || 10));
const TODAS = ['asivas', 'dias', 'gastos', 'meses', 'presu', 'calgastos', 'ultimos', 'semana', 'fijos', 'juntos', 'meta', 'tienes', 'cuentas', 'inv', 'deuda'];
const ev = (e, el, tipo, x, y) => { const v = new e.w.MouseEvent(tipo, { bubbles: true, cancelable: true, clientX: x || 0, clientY: y || 0 }); el.dispatchEvent(v); return v; };
(async () => {
  // 1) usuario nuevo, sin nada: cada pieza se pinta (ninguna desaparece por un error escondido) y no escribe movimientos
  for (const tanda of [TODAS.slice(0, 8), TODAS.slice(8)]) {
    const e = makeEnv({ movs: [], version: { inicio: 0 }, cfg: { app: { inicioWidgets: tanda.map((t) => ({ t })) }, meta: { onboarded: true } } }); await sleep(250);
    const faltan = tanda.filter((t) => t !== 'asivas' && t !== 'dias' && !e.doc.querySelector('#content .iw-' + t));
    ok(!faltan.length, 'sin datos: se ven todas las piezas (' + tanda.join(', ') + ')' + (faltan.length ? ' · faltan: ' + faltan.join(', ') : ''));
    ok(!Object.keys(e.store.movimientos).length, 'sin datos: no se crea ningún movimiento');
  }

  // 2) cambiar Inicio solo toca la configuración (ni movimientos ni tareas), y nada más que «inicioWidgets»
  const movs = [{ id: 'g1', tipo: 'Gasto', categoria: 'Comida', importe: 30, fecha: mesAtras(0, 1) }, { id: 'g2', tipo: 'Gasto', categoria: 'Ocio', importe: 80, fecha: mesAtras(1, 15) },
    { id: 'i1', tipo: 'Ingreso', categoria: 'Nómina', importe: 900, fecha: mesAtras(1, 26) }];
  let e = makeEnv({ movs, version: { inicio: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Comida' }, { nombre: 'Ocio' }], cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 100, ts: 1 }] }, meta: { onboarded: true } } }); await sleep(250);
  let A = e.w.__APP__, H = A.H, doc = e.doc;
  const movsAntes = JSON.stringify(e.store.movimientos), cfgAntes = JSON.parse(JSON.stringify(e.store.cfg.app));
  H.iwEditar([]); H.iwCat([]); H.iwAnadir(['gastos']); H.iwMover([2, -1]); H.iwQuitar([0]); H.iwCat([]); H.iwAnadir(['cuentas']); H.iwOpcElegir(['c1']); await sleep(30);
  const cfgDesp = Object.assign({}, e.store.cfg.app); delete cfgDesp.inicioWidgets; delete cfgDesp.badgesVistos; const cA = Object.assign({}, cfgAntes); delete cA.badgesVistos;
  ok(JSON.stringify(e.store.movimientos) === movsAntes && JSON.stringify(cfgDesp) === JSON.stringify(cA), 'editar Inicio no toca movimientos ni otros ajustes');
  ok(JSON.stringify(e.store.cfg.app.inicioWidgets) === JSON.stringify([{ t: 'gastos' }, { t: 'dias' }, { t: 'cuentas', o: { id: 'c1' } }]), 'se guarda la lista en orden');
  H.closeSheet([]); await sleep(300);

  // 3) mes pasado con las flechas de la tarjeta: «En qué gastas» y «Calendario de gastos» siguen al mes elegido
  H.iwEditar([]); H.iwCat([]); H.iwAnadir(['calgastos']); H.closeSheet([]); await sleep(300);
  A.S.inicioMes = 'm:' + mesAtras(1).slice(0, 7); A.render(); await sleep(20);
  const g = doc.querySelector('.iw-gastos');
  ok(g && /80/.test(g.textContent) && !/30,00|\b30 €/.test(g.querySelector('.iw-anillo').textContent), 'mes pasado: En qué gastas enseña ese mes (80 €)');
  ok(doc.querySelector('.iw-calgastos .iw-cg-d.n4') && !doc.querySelector('.iw-calgastos .iw-cg-d.hoy'), 'mes pasado: el calendario pinta ese mes, sin «hoy»');
  A.S.inicioMes = null; A.render(); await sleep(20);

  // 4) «Tu mes» desde el día que cobras (25): un gasto del día 26 del mes pasado cuenta en el mes actual
  // (si hoy es 26 o más, el mes ya empezó el 25 de este mes: un gasto del 24 de este mes es del mes anterior)
  const tarde = hoy.getDate() >= 26, dentro = tarde ? mesAtras(0, 26) : mesAtras(1, 26), fuera = tarde ? mesAtras(0, 20) : mesAtras(1, 20); // el corte puede adelantarse al viernes si el 25 cae en fin de semana
  e = makeEnv({ movs: [{ id: 'x1', tipo: 'Gasto', categoria: 'Ocio', importe: 77, fecha: dentro }, { id: 'x2', tipo: 'Gasto', categoria: 'Ocio', importe: 500, fecha: fuera }], version: { inicio: 0 },
    cfg: { app: { mesInicio: { modo: 'cobro', dia: 25 }, categoriasGasto: [{ nombre: 'Ocio' }], inicioWidgets: [{ t: 'gastos' }, { t: 'calgastos' }] }, meta: { onboarded: true } } }); await sleep(250);
  const an = (e.doc.querySelector('.iw-gastos .iw-anillo') || {}).textContent || '';
  ok(/77/.test(an) && !/577|500/.test(an), 'mes desde el 25: En qué gastas cuenta solo lo de tu mes (77, no 500)');
  ok(e.doc.querySelectorAll('.iw-calgastos .iw-cg-d.n4').length === 1, 'mes desde el 25: el calendario pinta solo el día de tu mes');

  // 5) grupo o cuenta que ya no existen: aviso, sin romper Inicio
  e = makeEnv({ movs: [], version: { inicio: 0 }, cfg: { app: { cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 5, ts: 1 }], inicioWidgets: [{ t: 'cuentas', o: { id: 'borrada' } }, { t: 'juntos', o: { gid: 'gx' } }, { t: 'deuda', o: { nombre: 'Vieja' } }] }, meta: { onboarded: true } } }); await sleep(250);
  doc = e.doc;
  ok(/Esta cuenta ya no existe/.test(doc.body.textContent) && /Esta deuda ya no existe/.test(doc.body.textContent), 'cuenta y deuda borradas: aviso');
  ok(/Este grupo ya no existe|Aún no compartes/.test((doc.querySelector('.iw-juntos') || {}).textContent || ''), 'grupo borrado: aviso');

  // 6) sin grupos: el filtro «Juntos» del catálogo no se queda en blanco
  A = e.w.__APP__; H = A.H;
  H.iwEditar([]); H.iwCat([]); H.iwFiltro(['juntos']); await sleep(10);
  ok(doc.querySelectorAll('.iw-cat-t').length > 0 || /Aún no|todavía/i.test((doc.querySelector('.iw-cat') || {}).textContent || ''), 'catálogo, filtro Juntos sin grupos: sale algo (pieza o aviso), no un hueco vacío');
  H.closeSheet([]); await sleep(300);

  // 7) tras «Editar Inicio», Inicio se repinta con lo nuevo aunque el servidor no avise del cambio
  e = makeEnv({ movs, version: { inicio: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Comida' }] }, meta: { onboarded: true } } }); await sleep(250);
  A = e.w.__APP__; H = A.H; doc = e.doc;
  A.S.db = Object.assign({}, A.S.db, { doc: (p) => ({ update: async (part) => { const k = p.split('/')[1]; e.store.cfg[k] = Object.assign({}, e.store.cfg[k] || {}, part); } }) });
  H.iwEditar([]); H.iwCat([]); H.iwAnadir(['gastos']); await sleep(30); H.closeSheet([]); await sleep(300);
  ok(doc.querySelector('#content .iw-gastos'), 'tras añadir una pieza y pulsar Listo, se ve en Inicio sin esperar al servidor');
  H.iwEditar([]); H.iwReset([]); await sleep(30); H.closeSheet([]); await sleep(300);
  ok(!doc.querySelector('#content .iw-gastos'), 'tras «Como al principio», Inicio la quita sin esperar al servidor');

  // 8) mantener pulsado: abre la hoja; moverse (scroll) o soltar antes no la abre; un toque normal sigue funcionando
  e = makeEnv({ movs, version: { inicio: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Comida' }], inicioWidgets: [{ t: 'gastos' }, { t: 'ultimos' }] }, meta: { onboarded: true } } }); await sleep(250);
  A = e.w.__APP__; H = A.H; doc = e.doc;
  let pz = doc.querySelector('#content .iw-ultimos .iw-uf');
  ev(e, pz, 'pointerdown', 10, 10); await sleep(200); ev(e, pz, 'pointerup', 10, 10); await sleep(600);
  ok(!doc.querySelector('#sheetBackdrop'), 'toque corto: no abre Editar Inicio');
  ev(e, pz, 'pointerdown', 10, 10); await sleep(100); ev(e, pz, 'pointermove', 10, 60); await sleep(700);
  ok(!doc.querySelector('#sheetBackdrop'), 'al moverse (scroll) no abre Editar Inicio');
  ev(e, doc, 'pointerup', 10, 60);
  pz = doc.querySelector('#content .iw-ultimos .iw-uf');
  ev(e, pz, 'pointerdown', 10, 10); await sleep(700);
  ok(doc.querySelector('#sheetBackdrop') && /Editar Inicio/.test(doc.querySelector('#sheetHost').textContent), 'mantener pulsado 0,6 s abre Editar Inicio');
  ev(e, pz, 'pointerup', 10, 10); pz.click(); await sleep(50);
  ok(/Editar Inicio/.test(doc.querySelector('#sheetHost').textContent), 'el toque que acaba el «mantener» no abre el movimiento');
  H.closeSheet([]); await sleep(1000);
  pz = doc.querySelector('#content .iw-ultimos .iw-uf'); pz.click(); await sleep(50);
  ok(doc.querySelector('#sheetBackdrop') && !/Editar Inicio/.test(doc.querySelector('#sheetHost').textContent), 'después, un toque normal abre el movimiento');
  H.closeSheet([]); await sleep(300);

  // 9) arrastrar desde los puntos: cambia el orden y lo guarda
  H.iwEditar([]); H.iwCat([]); H.iwAnadir(['presu']); H.iwVista(['lista']); await sleep(20);
  const grip = doc.querySelectorAll('.iw-ed-f[data-i] .iw-grip')[0];
  ev(e, grip, 'pointerdown', 0, 100); ev(e, doc, 'pointermove', 0, 160); ev(e, doc, 'pointermove', 0, 215); ev(e, doc, 'pointerup', 0, 215); await sleep(30);
  ok(JSON.stringify(A.S.config.inicioWidgets.map((x) => x.t)) === JSON.stringify(['ultimos', 'presu', 'gastos']), 'arrastrar la primera dos filas abajo la pone la última');
  H.closeSheet([]); await sleep(300);

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

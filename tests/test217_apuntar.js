// 28/11/2026 · docs/53 tandas 1-3 (rama fase25/apuntar): el + con cuatro grandes y «Apuntes rápidos», «¿De qué?» único,
// categorías con iconos y «Ver todas», «Compartir este gasto» arriba. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoy = new Date().toISOString().slice(0, 10);
const dia = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
let n = 0;
const mov = (x) => Object.assign({ id: 'm' + (++n), fecha: dia(3), tipo: 'Gasto', categoria: 'Ocio', importe: 10, descripcion: '', subcategoria: '' }, x);
const MOVS = [mov({ subcategoria: 'Golf', descripcion: 'Golf', categoria: 'Ocio' }), mov({ subcategoria: 'Golf', descripcion: 'Golf', categoria: 'Ocio', fecha: dia(5) }),
  mov({ descripcion: 'Cine', categoria: 'Ocio', fecha: dia(6) }), mov({ descripcion: 'Café', categoria: 'Restaurantes', importe: 2, fecha: dia(2) }), mov({ descripcion: 'Café', categoria: 'Restaurantes', importe: 2, fecha: dia(4) }),
  mov({ id: 'vieja', subcategoria: 'Uñas', descripcion: '', categoria: 'Belleza', fecha: dia(9) })];
const cfgApp = { nombre: 'Prueba', compararVersiones: false };
const nuevo = (version) => makeEnv({ version: Object.assign({ tu: 0, agenda: 0, crear: 0, apuntar: 0, importe: 0 }, version || {}), cfg: { app: cfgApp, meta: { onboarded: true } }, movs: MOVS });
(async () => {
  let e = nuevo(); await sleep(250);
  let { w, doc } = e, A = w.__APP__, H = A.H, $ = (s) => doc.querySelector(s), $$ = (s) => Array.from(doc.querySelectorAll(s));
  const hoja = () => $('#sheetHost') ? $('#sheetHost').textContent.replace(/\s+/g, ' ') : '';

  // --- Tanda 1: el +
  A.openCrear(); await sleep(30);
  const grandes = $$('#sheetHost .crear-4 .crear-op').map((b) => b.textContent.trim());
  ok(grandes.join(',') === 'Gasto,Ingreso,Tarea,Importar', 'T1 · el +: 4 grandes (Gasto, Ingreso, Tarea, Importar) · ' + grandes.join(','));
  ok(/Apuntes rápidos/.test(hoja()) && $('.crear-apuntes').getAttribute('aria-expanded') === 'false', 'T1 · «Apuntes rápidos» sale cerrado');
  ok(!$('#sheetHost .crear-peq') && !/Lo de siempre|Repetir/.test(hoja()) && !$('#sheetHost [data-click^="crearIr|ahorro"]'), 'T1 · cerrado no enseña nada más');
  H.crearApuntesToggle([]); await sleep(20);
  ok($('.crear-apuntes').getAttribute('aria-expanded') === 'true' && /Lo de siempre/.test(hoja()), 'T1 · al abrirlo sale «Lo de siempre»');
  ok(!!$('#sheetHost [data-click^="crearRepetir|"]') && !!$('#sheetHost [data-click="crearIr|factura"]') && !!$('#sheetHost [data-click="crearIr|ahorro"]') && !!$('#sheetHost [data-click="crearIr|inversion"]'), 'T1 · dentro: repetir, Pago fijo, Apartar e Invertir');
  ok(!/Repetir/.test(hoja()), 'T1 · ya no hay barra «Repetir»');
  H.crearApuntesToggle([]); await sleep(20);
  ok(!$('#sheetHost .crear-peq'), 'T1 · se vuelve a plegar');
  H.crearVersion([1]); await sleep(20);
  ok(!!$('#sheetHost .crear-peq') && /Repetir/.test(hoja()), 'T1 · «Antes» (v2) sigue disponible');
  H.crearVersion([0]); await sleep(20); A.closeSheet && A.closeSheet(); await sleep(50);

  // --- Tanda 3: categorías con iconos
  H.crearIr(['gasto']); await sleep(450);
  ok($('#tecCats.solo') && $$('#tecCats .tec-cat').length === 6, 'T3 · 5 categorías + «Ver todas» en una fila · ' + $$('#tecCats .tec-cat').length);
  const bs = $$('#tecCats .tec-cat:not(.mas)');
  ok(bs.every((b) => b.getAttribute('aria-label') && !b.querySelector('.tec-cat-n')), 'T3 · solo icono, el nombre va en aria-label');
  ok($('#tecCatSel').textContent === 'Elige una categoría', 'T3 · debajo dice «Elige una categoría» mientras no hay');
  H.tecCat(['Ocio']); await sleep(20);
  ok($('#tecCatSel').textContent === 'Ocio' && $('#fCategoria').value === 'Ocio', 'T3 · elegir pone el nombre debajo');
  H.tecCatTodas([]); await sleep(20);
  const todas = $$('#tecCatTodas .tec-cat');
  ok(!$('#tecCatTodas').hidden && todas.length >= 6 && todas.every((b) => b.querySelector('.tec-cat-n')), 'T3 · «Ver todas» abre la lista con nombres · ' + todas.length);
  const otra = todas.map((b) => b.querySelector('.tec-cat-n').textContent).find((c) => c !== 'Ocio' && !$$('#tecCats .tec-cat').some((b) => b.getAttribute('aria-label') === c));
  H.tecCat([otra || 'Ocio']); await sleep(20);
  ok($('#tecCatTodas').hidden && $('#tecCatSel').textContent === (otra || 'Ocio') && $$('#tecCats .tec-cat.on').length === 1, 'T3 · elegir de la lista la deja a la vista y cierra la lista · ' + otra);

  // --- Tanda 2: «¿De qué?»
  ok($$('#fDesc').length === 1 && $('#deQueField label').textContent === '¿De qué?' && !/Detalle|Descripción/.test($('#sheetHost').textContent), 'T2 · un solo campo «¿De qué?», sin «Detalle» ni «Descripción»');
  ok($('#fSub') && $('#fSub').type === 'hidden', 'T2 · el detalle se conserva en un campo oculto');
  ok($('#deQueField').closest('#tecRapido') && !$('#deQueField').closest('#mfMas'), 'T2 · en el apunte corto está a la vista');
  H.tecCat(['Ocio']); await sleep(20);
  const sug = () => $$('#deQueSug .chip').map((b) => b.textContent);
  ok(sug().indexOf('Golf') >= 0 && sug().indexOf('Cine') >= 0, 'T2 · sugiere lo que ya usaste en la categoría · ' + sug().join(','));
  const d = $('#fDesc'); d.value = 'gol'; d.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(20);
  ok(sug().join(',') === 'Golf', 'T2 · filtra al escribir · ' + sug().join(','));
  H.deQuePick(['Golf']); await sleep(20);
  ok($('#fDesc').value === 'Golf' && $('#fSub').value === 'Golf', 'T2 · elegir una sugerencia guarda detalle y descripción');
  // guardar
  ['1', '2', ',', '5'].forEach((k) => H.tecK([k])); H.tecK(['ok']); await sleep(120);
  let g = Object.values(e.store.movimientos).filter((m) => m.importe === 12.5);
  ok(g.length === 1 && g[0].subcategoria === 'Golf' && g[0].descripcion === 'Golf' && g[0].categoria === 'Ocio', 'T2 · se guardó con subcategoría y descripción · ' + JSON.stringify(g[0] && [g[0].subcategoria, g[0].descripcion]));

  // texto nuevo: solo descripción
  await sleep(450); H.crearIr(['gasto']); await sleep(450); H.tecCat(['Ocio']);
  const d2 = $('#fDesc'); d2.value = 'Bolera'; d2.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(20);
  ok($('#fSub').value === '', 'T2 · algo nuevo no inventa detalle');
  ['7'].forEach((k) => H.tecK([k])); H.tecK(['ok']); await sleep(120);
  g = Object.values(e.store.movimientos).filter((m) => m.importe === 7 && m.descripcion === 'Bolera');
  ok(g.length === 1 && !g[0].subcategoria, 'T2 · guardado solo con descripción');

  // «Más detalles» conserva lo escrito y lo lleva al formulario largo
  await sleep(450); H.crearIr(['gasto']); await sleep(450);
  const d3 = $('#fDesc'); d3.value = 'Algo'; H.tecMas([]); await sleep(20);
  ok($('#deQueSlot #fDesc') && $('#fDesc').value === 'Algo' && !$('#tecRapido') && !!$('#fMetodo'), 'T2 · «Más detalles»: el campo pasa al formulario con el método de pago · sin perder lo escrito');
  H.closeSheet([]); await sleep(450);

  // editar uno antiguo con detalle y sin descripción: se ve el detalle y no se pierde
  H.openMovForm(['vieja']); await sleep(450);
  ok($('#fDesc').value === 'Uñas' && $('#fSub').value === 'Uñas', 'T2 · un movimiento antiguo enseña su detalle en «¿De qué?»');
  H.saveMov([]); await sleep(120);
  ok(e.store.movimientos.vieja.subcategoria === 'Uñas', 'T2 · al guardarlo no se pierde la subcategoría');
  await sleep(450);

  // las pruebas antiguas siguen viendo la versión de antes
  const e2 = nuevo({ apuntar: 1, importe: 0 }); await sleep(250);
  e2.w.__APP__.H.crearIr(['gasto']); await sleep(450);
  const d4 = e2.doc;
  ok(!!d4.querySelector('#fSub') && d4.querySelector('#fSub').type === 'text' && /Descripción/.test(d4.querySelector('#sheetHost').textContent) && !d4.querySelector('#tecCats.solo'), 'Antes · con apuntar:1 el formulario es el de siempre');

  // «Compartir este gasto» arriba (con Juntos disponible)
  const e3 = nuevo(); await sleep(250);
  Object.assign(e3.w.Data, { uid: () => 'uY', grupos: { listar: async () => ({ grupos: [], miembros: [], sinCuenta: [] }), invitaciones: async () => [] }, compartidos: { suscribir: (nx) => { setTimeout(() => nx([]), 0); return () => {}; }, crear: async () => ({}), editar: async () => ({}), borrar: async () => ({}) }, objetivos: { suscribir: (nx) => { setTimeout(() => nx([]), 0); return () => {}; } }, aportes: { suscribir: (nx) => { setTimeout(() => nx([]), 0); return () => {}; } }, rpc: async () => null });
  e3.w.__APP__.S.db = e3.w.Data; await sleep(50);
  e3.w.__APP__.H.crearIr(['gasto']); await sleep(450);
  const ca = e3.doc.querySelector('#compArriba');
  ok(!!ca && !ca.hidden && /Compartir este gasto/.test(ca.textContent) && !e3.doc.querySelector('.tec-comp'), 'T2 · «Compartir este gasto» arriba también en un gasto nuevo (y ya no está el chip de abajo)');
  e3.w.__APP__.H.compOnTop([]); await sleep(80);
  ok(!e3.doc.querySelector('#tecRapido') && !e3.doc.querySelector('#mfMas').hidden && ca.hidden, 'T2 · al tocarlo se abre la parte compartida en el sitio');

  // ---- Tanda 10 (docs/53): lo compartido con caras, «Más detalles» y los demás apuntes con lo justo ----
  const PIX = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
  const creados = [];
  const e4 = makeEnv({ version: { tu: 0, agenda: 0, crear: 0, apuntar: 0, importe: 0 }, cfg: { app: Object.assign({}, cfgApp, { cuentas: [{ id: 'c1', nombre: 'Nómina', saldo: 100 }, { id: 'c2', nombre: 'Ahorro', saldo: 50 }] }), meta: { onboarded: true } }, movs: MOVS, session: { user: { email: 'a@a.com', id: 'uYo' } } });
  await sleep(250);
  const A4 = e4.w.__APP__, H4 = A4.H, S4 = A4.S, d4b = e4.doc, q4 = (x) => d4b.querySelector(x), qq4 = (x) => Array.from(d4b.querySelectorAll(x));
  S4.user = Object.assign({}, S4.user, { id: 'uYo' });
  const mb = (u, nm, x) => Object.assign({ user_id: u, nombre: nm, rol: 'miembro' }, x || {});
  S4.grupos = [{ id: 'g1', nombre: 'Piso de la calle Mayor', tipo: 'grupo', alias: {}, soyAdmin: true, foto: PIX, miembros: [mb('uYo', 'Lucía', { rol: 'admin' }), mb('uA', 'Ana'), mb('uB', 'Bea')] },
    { id: 'g2', nombre: 'Pádel', tipo: 'grupo', alias: {}, soyAdmin: false, foto: null, miembros: [mb('uYo', 'Lucía'), mb('uC', 'Carlos')] }].map((g) => Object.assign(g, { todos: g.miembros }));
  S4.compartidos = []; S4.objetivos = []; S4.aportes = []; S4.carpetas = [];
  S4.db = Object.assign(S4.db || {}, { compartidos: { suscribir: (nx) => { setTimeout(() => nx([]), 0); return () => {}; }, crear: async (d) => { creados.push(d); return Object.assign({ id: 'cc' + creados.length, createdAt: new Date().toISOString() }, d); }, editar: async () => ({}), borrar: async () => ({}) }, rpc: async () => null,
    grupos: { listar: async () => { throw new Error('sin red'); }, invitaciones: async () => [] } });
  const hoja4 = () => (q4('#sheetHost') ? q4('#sheetHost').textContent.replace(/\s+/g, ' ') : '');

  // «Con», «Pagó» y el reparto con caras
  H4.crearIr(['gasto']); await sleep(450);
  ok(!q4('#sheetHost .comp-toggle'), 'T10 · en un gasto nuevo el botón «Compartir» sale una sola vez (arriba)');
  H4.compOnTop([]); await sleep(100);
  const con = qq4('#compField .cv-con .cr-cara');
  ok(con.length === 6 && !q4('#compField .chips'), 'T10 · «Con»: una cara por grupo y persona y «Otra persona» (sin chips de texto) · ' + con.length);
  ok(!!q4('#compField .cv-con img.jv-g-foto') && !!q4('#compField .cv-con .jv-g-ic'), 'T10 · el grupo con foto la enseña y el que no, sus iniciales');
  ok(!!q4('#compField .cv-con [data-click="invAbrir|f"]'), 'T10 · «+ Otra persona» sigue ahí');
  H4.compDest(['g:g2']); await sleep(30);
  ok(qq4('#compField .cv-con .cr-cara.on').length === 1 && q4('#compField .cv-con .cr-cara.on').getAttribute('aria-pressed') === 'true', 'T10 · el elegido va marcado');
  ok(q4('#compField .cv-con .cr-cara.on').getAttribute('data-click') === 'compDest|g%3Ag2' && qq4('#compField .cv-pago .cr-cara').length === 2, 'T10 · cambiar de grupo cambia quién puede pagar · ' + qq4('#compField .cv-pago .cr-cara').length);
  ok(qq4('#compField .cv-fila .cv-mini').length === 2 && /Yo/.test(q4('#compField .cv-fila').textContent), 'T10 · el reparto tiene una cara por persona');
  H4.compPagador(['uC']); await sleep(30);
  ok(/Carlos/.test(q4('#compField .cv-pago .cr-cara.on').textContent), 'T10 · «Pagó» cambia de cara');
  // todavía se puede guardar: Carlos pagó, a partes iguales
  ['4', '0'].forEach((k) => H4.tecK([k])); H4.tecCat(['Ocio']); await sleep(20); H4.saveMov([]); await sleep(150);
  ok(creados.length === 1 && creados[0].grupoId === 'g2' && creados[0].pagadoPor === 'uC' && creados[0].importe === 40 && creados[0].reparto && creados[0].reparto.uYo === 20, 'T10 · guarda igual que antes · ' + JSON.stringify(creados[0] && [creados[0].grupoId, creados[0].pagadoPor, creados[0].reparto]));
  await sleep(450);
  // «Antes»: con apuntar:1 siguen los chips
  const e5 = makeEnv({ version: { tu: 0, agenda: 0, crear: 0, apuntar: 1, importe: 0 }, cfg: { app: cfgApp, meta: { onboarded: true } }, movs: MOVS, session: { user: { email: 'a@a.com', id: 'uYo' } } }); await sleep(250);
  const A5 = e5.w.__APP__; A5.S.user = Object.assign({}, A5.S.user, { id: 'uYo' });
  A5.S.grupos = S4.grupos.slice(); A5.S.compartidos = []; A5.S.objetivos = []; A5.S.aportes = []; A5.S.carpetas = [];
  A5.S.db = Object.assign(A5.S.db || {}, { compartidos: { suscribir: () => () => {} }, rpc: async () => null, grupos: { listar: async () => { throw new Error('x'); }, invitaciones: async () => [] } });
  A5.H.crearIr(['compartido']); await sleep(450);
  ok(!e5.doc.querySelector('#compField .cv-con') && !!e5.doc.querySelector('#compField .chips .chip'), 'T10 · «Antes»: «Con» sigue con chips de texto');
  A5.closeSheet && A5.closeSheet();

  // el + «Compartir» rápido: «Con» también con caras
  H4.closeSheet([]); await sleep(450); H4.compRapido(['g:g1']); await sleep(60);
  ok(qq4('#sheetHost .cv-con .cr-cara').length === 6 && !q4('#sheetHost .cr-con'), 'T10 · compartir rápido: «Con» con caras');
  H4.closeSheet([]); await sleep(450);

  // «Más detalles» en los apuntes de ahorro, inversión, deuda y pago fijo
  for (const [k, tipo] of [['ahorro', 'Ahorro'], ['inversion', 'Inversión'], ['deuda', 'Deuda'], ['factura', 'Factura']]) {
    H4.crearIr([k]); await sleep(450);
    const det = q4('#mfDet');
    ok(det && det.hidden && det.contains(q4('#fMetodo')) && det.contains(q4('#tipoToggle')) && det.contains(q4('#deQueField')), 'T10 · ' + tipo + ': método de pago, tipo y «¿De qué?» van plegados en «Más detalles»');
    ok(!!q4('#mfDetBtn') && q4('#mfDetBtn').getAttribute('aria-expanded') === 'false', 'T10 · ' + tipo + ': «Más detalles» sale cerrado');
    if (k === 'ahorro') { H4.mfDetToggle([]); await sleep(20); ok(!det.hidden && q4('#mfDetBtn').getAttribute('aria-expanded') === 'true' && /Menos detalles/.test(q4('#mfDetBtn').textContent), 'T10 · tocarlo los abre y cambia a «Menos detalles»'); H4.mfDetToggle([]); await sleep(20); ok(det.hidden, 'T10 · y otra vez los cierra'); }
    H4.closeSheet([]); await sleep(450);
  }
  // cambiar de tipo desde «Más detalles»: la nota vuelve a su sitio en Gasto
  H4.crearIr(['ahorro']); await sleep(450); H4.mfDetToggle([]); H4.pickTipo(['Gasto']); await sleep(30);
  ok(q4('#deQueSlot #deQueField') && !q4('#mfDet #deQueField'), 'T10 · al pasar a Gasto, «¿De qué?» vuelve a la vista');
  H4.pickTipo(['Deuda']); await sleep(30);
  ok(q4('#mfDet #deQueField'), 'T10 · y al pasar a Deuda se vuelve a plegar');
  ok(q4('#compArribaTxt') && /deuda compartida/.test(q4('#compArribaTxt').textContent), 'T10 · el botón de compartir de arriba cambia con el tipo («Pagar una deuda compartida»)');
  H4.closeSheet([]); await sleep(450);
  // «Más detalles» de verdad (apunte corto) enseña todo
  H4.crearIr(['gasto']); await sleep(450); H4.tecMas([]); await sleep(30);
  ok(q4('#mfDet') && !q4('#mfDet').hidden && !!q4('#mfDet #tipoToggle'), 'T10 · en el gasto corto, «Más detalles» lo abre todo');
  H4.closeSheet([]); await sleep(450);
  // compartir desde el apunte corto no abre «Más detalles»
  H4.crearIr(['gasto']); await sleep(450); H4.compOnTop([]); await sleep(60);
  ok(q4('#mfDet') && q4('#mfDet').hidden, 'T10 · compartir un gasto no abre «Más detalles»');
  H4.closeSheet([]); await sleep(450);
  // editar un gasto: tipo a la vista, método de pago plegado (abierto si ya tiene uno)
  H4.openMovForm(['m1']); await sleep(450);
  ok(q4('#mfDet') && q4('#mfDet').hidden && q4('#mfDet').contains(q4('#fMetodo')) && !q4('#mfDet').contains(q4('#tipoToggle')) && !!q4('#tipoToggle'), 'T10 · al editar: el tipo sigue a la vista y el método de pago va en «Más detalles»');
  H4.closeSheet([]); await sleep(450);
  e4.store.movimientos.m2 && (e4.store.movimientos.m2.metodoPago = 'Tarjeta');
  S4.movimientos.find((m) => m.id === 'm2').metodoPago = 'Tarjeta';
  H4.openMovForm(['m2']); await sleep(450);
  ok(q4('#mfDet') && !q4('#mfDet').hidden, 'T10 · si ya tiene método de pago, «Más detalles» sale abierto');
  H4.closeSheet([]); await sleep(450);

  // ingreso: categorías con icono y «Ver todas»
  H4.crearIr(['ingreso']); await sleep(450);
  const ci = qq4('#tecCats .tec-cat:not(.mas)');
  ok(q4('#tecCats.solo') && ci.length === 5 && ci.every((b) => b.getAttribute('aria-label') && !b.querySelector('.tec-cat-n') && b.querySelector('.chip-cat-ic svg')), 'T10 · ingreso: 5 categorías con icono (el nombre va en aria-label) · ' + ci.length);
  ok(q4('#tecCatSel') && q4('#tecCatSel').textContent === 'Elige una categoría', 'T10 · ingreso: debajo dice «Elige una categoría»');
  H4.tecCat(['Nómina']); await sleep(20);
  ok(q4('#tecCatSel').textContent === 'Nómina' && q4('#fCategoria').value === 'Nómina', 'T10 · ingreso: elegir pone el nombre debajo');
  H4.tecCatTodas([]); await sleep(20);
  const ti = qq4('#tecCatTodas .tec-cat');
  ok(ti.length >= 6 && ti.every((b) => b.querySelector('.tec-cat-n')) && !ti.some((b) => /Mercadona|Supermercado/.test(b.textContent)), 'T10 · ingreso: «Ver todas» lista los ingresos con nombre (no los gastos) · ' + ti.length);
  H4.closeSheet([]); await sleep(450);

  // traspaso: lo justo y la nota en «Más detalles»
  H4.crearIr(['traspaso']); await sleep(450);
  ok(q4('#mfDet') && q4('#mfDet').hidden && q4('#mfDet').contains(q4('#fDesc')) && /¿De qué\?/.test(q4('#mfDet').textContent), 'T10 · traspaso: la nota va plegada en «Más detalles»');
  ok(!!q4('#sheetHost .info-i') && /cajero/.test(q4('#sheetHost .info-txt').textContent) && !q4('#sheetHost .rec-hint'), 'T10 · traspaso: «Qué es un traspaso» está en la «i»');
  H4.mfDetToggle([]); await sleep(20); q4('#fDesc').value = 'Alquiler';
  ['9', '5'].forEach((k) => H4.tecK([k])); H4.saveTraspaso([]); await sleep(150);
  const tr = Object.values(e4.store.movimientos).filter((m) => m.tipo === 'Traspaso' && m.descripcion === 'Alquiler');
  ok(tr.length === 1 && tr[0].importe === 95, 'T10 · traspaso: se guarda con su nota · ' + tr.length);
  await sleep(450);
  // traspaso con la versión anterior: nada plegado
  const e6 = nuevo({ apuntar: 1 }); await sleep(250); e6.w.__APP__.H.crearIr(['traspaso']); await sleep(450);
  ok(!e6.doc.querySelector('#mfDet') && /Descripción/.test(e6.doc.querySelector('#sheetHost').textContent), 'T10 · «Antes»: el traspaso es el de siempre');
  console.log(fails ? 'FALLOS: ' + fails : 'TODO BIEN'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH', x && x.stack || x); process.exit(1); });

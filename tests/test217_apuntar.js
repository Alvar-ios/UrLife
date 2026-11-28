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
  console.log(fails ? 'FALLOS: ' + fails : 'TODO BIEN'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH', x && x.stack || x); process.exit(1); });

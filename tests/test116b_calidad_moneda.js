// Calidad (31/10/2026): revisión de «¿Pagaste en otra moneda?» y del viaje (docs/29 tanda 0). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
const mas = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return iso(x); };
(async () => {
  const e = makeEnv({ cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Restaurantes' }, { nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S, sh = () => doc.querySelector('#sheetHost');
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm) => ({ user_id: u, nombre: nm, rol: 'miembro' });
  S.grupos = [{ id: 'g1', nombre: 'Viaje', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana')] }];
  S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.db = Object.assign(S.db || {}, {
    grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] },
    carpetas: { suscribir: () => () => {}, crear: async (o) => o, editar: async (id, o) => Object.assign({}, S.carpetas.find((t) => t.id === id), o), borrar: async () => [], restaurar: async () => null },
  });
  { const ls = {}; Object.defineProperty(e.w, 'localStorage', { value: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, configurable: true }); }
  let pedidos = [], hayRed = true;
  const CAMBIOS = { USD: 1.08, JPY: 161.5 };
  S.db.divisas = { cambio: async (mo, f) => { pedidos.push([mo, f]); if (!hayRed) throw new Error('sin red'); return CAMBIOS[mo] ? { fecha: f, porEur: CAMBIOS[mo] } : null; } };
  const box = () => sh().querySelector('#monBox');
  const escribe = (sel, v, accion) => { const el = sh().querySelector(sel); el.value = v; H[accion]([], el); };
  const elegir = async (k) => { const s = sh().querySelector('#monMoneda'); s.value = k; H.monMoneda([], s); await sleep(20); };

  // 1. La fecha del cambio es la del gasto (fecha puesta antes de abrir la caja)
  H.compRapido(['g:g1']); await sleep(30);
  escribe('#crFecha', mas(-5), 'crFecha');
  pedidos = []; H.monAbrir([]); await sleep(20);
  ok(pedidos.length && pedidos[pedidos.length - 1][1] === mas(-5), 'compartir: pide el cambio del día del gasto, no el de hoy');
  // 1b. Fecha cambiada DESPUÉS de abrir la caja: debería volver a pedirlo
  pedidos = []; escribe('#crFecha', mas(-9), 'crFecha'); await sleep(20);
  ok(pedidos.length && pedidos[pedidos.length - 1][1] === mas(-9), 'compartir: si cambias la fecha con la caja abierta, se pide el cambio de la nueva fecha');
  // 1c. fecha futura → se usa hoy
  pedidos = []; H.monCerrar([]); escribe('#crFecha', mas(4), 'crFecha'); H.monAbrir([]); await sleep(20);
  ok(pedidos.length && pedidos[pedidos.length - 1][1] === mas(0), 'fecha futura: se usa el cambio de hoy');
  H.closeSheet([]); await sleep(260);

  // 2. Yen sin decimales e importes con puntos de miles
  H.compRapido(['g:g1']); await sleep(30); H.monAbrir([]); await sleep(20); await elegir('JPY');
  escribe('#monImporte', '15.000', 'monImporte'); await sleep(5);
  ok(/Usar 92,88 €/.test(box().textContent), 'yen: «15.000» = 15 000 ¥ → 92,88 €');
  sh().querySelector('#crDesc').value = 'Sushi'; H.crDesc([], sh().querySelector('#crDesc'));
  H.monUsar([]); await sleep(10);
  ok(sh().querySelector('#crDesc').value === 'Sushi · 15.000 ¥', 'yen: la nota va sin decimales («15.000 ¥»)');
  ok(sh().querySelector('#crImporte').value === '92,88', 'yen: el importe queda con coma (92,88)');
  // usar otra vez lo mismo no duplica la nota
  H.monAbrir([]); await sleep(20); await elegir('JPY'); escribe('#monImporte', '15000', 'monImporte'); H.monUsar([]); await sleep(10);
  ok(sh().querySelector('#crDesc').value === 'Sushi · 15.000 ¥', 'usar dos veces lo mismo no repite la nota');
  H.closeSheet([]); await sleep(260);

  H.compRapido(['g:g1']); await sleep(30); H.monAbrir([]); await sleep(20); await elegir('USD');
  escribe('#monImporte', '1.234,56', 'monImporte'); await sleep(5);
  ok(/Usar 1143,11 €|Usar 1\.143,11 €/.test(box().textContent), '«1.234,56 $» → 1.143,11 €');
  escribe('#monImporte', '12.50', 'monImporte'); await sleep(5);
  ok(/Usar 11,57 €/.test(box().textContent), '«12.50» con punto se entiende como 12,50 $');
  escribe('#monImporte', '0', 'monImporte'); await sleep(5);
  ok(sh().querySelector('#monUsar').disabled, 'importe 0: el botón «Usar» queda desactivado');
  H.closeSheet([]); await sleep(260);

  // 3. Sin conexión y sin cambio guardado: lo explica
  hayRed = false;
  const lsr = e.w.localStorage; lsr.removeItem('monCambios'); lsr.setItem('monUlt', 'CHF');
  H.compRapido(['g:g1']); await sleep(30); H.monAbrir([]); await sleep(20);
  ok(sh().querySelector('#monMano'), 'sin conexión y sin cambio guardado: pide el cambio a mano');
  ok(/conexión|no hemos podido|no se ha podido/i.test(box().textContent), 'sin conexión y sin cambio guardado: explica por qué lo pide a mano');
  H.closeSheet([]); await sleep(260); hayRed = true;

  // 4. No sale al editar ni en lo que no es un gasto
  S.movimientos = [{ id: 'mv1', tipo: 'Gasto', categoria: 'Otros', importe: 10, fecha: mas(-1), descripcion: 'X' }];
  H.openMovForm(['mv1']); await sleep(40);
  ok(!box(), 'al editar un gasto no sale');
  H.closeSheet([]); await sleep(260);
  S.tab = 'movimientos'; S.movFiltroTipo = 'Ingreso'; H.openMovForm([]); await sleep(40);
  ok(!box(), 'en un ingreso nuevo no sale');
  H.closeSheet([]); await sleep(260); S.movFiltroTipo = 'Todos'; S.tab = 'inicio';
  H.openMovForm([]); await sleep(40);
  ok(box(), 'en un gasto nuevo sí sale');
  H.pickTipo(['Ingreso']); await sleep(20);
  ok(!box() || box().hidden || !box().textContent.trim(), 'si cambias el tipo a Ingreso, desaparece');
  H.closeSheet([]); await sleep(260);

  // 5. No se pierde lo ya escrito en el formulario normal
  H.openMovForm([]); await sleep(40);
  sh().querySelector('#fDesc').value = 'Museo';
  H.monAbrir([]); await sleep(20); await elegir('USD'); escribe('#monImporte', '27', 'monImporte'); H.monUsar([]); await sleep(10);
  ok(sh().querySelector('#fDesc').value === 'Museo · 27,00 $' && sh().querySelector('#fImporte').value === '25', 'gasto normal: conserva la descripción y añade «27,00 $»; importe 25');
  H.closeSheet([]); await sleep(260);

  // 6. Teclado propio, versión corta: ¿se ve la nota?
  A.S.verAnterior.importe = 0;
  H.openMovForm([]); await sleep(40);
  H.monAbrir([]); await sleep(20); await elegir('USD'); escribe('#monImporte', '54', 'monImporte'); H.monUsar([]); await sleep(10);
  const fd = sh().querySelector('#fDesc'), oculto = fd && fd.closest('[hidden]'); console.log('  (teclado corto: descripción=' + JSON.stringify(fd && fd.value) + ', escondida=' + !!oculto + ', corta=' + !!(A.form().tec && A.form().tec.corta) + ')');
  ok(fd && fd.value === '27,00 $'.replace('27', '54') && !oculto, 'teclado corto: la nota «54,00 $» se ve (no queda en un campo escondido)');
  H.closeSheet([]); await sleep(260);

  // 7. Viaje sin fecha de fin: también «al día» contando hasta hoy
  S.carpetas = [{ id: 'tv', grupoId: 'g1', nombre: 'Lisboa', icono: 'plane', desde: mas(-3), hasta: null, cerrada: null, createdAt: '2026-10-01T09:00:00Z' }];
  S.compartidos = [{ id: 'c1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Otros', descripcion: 'Tren', importe: 80, pagadoPor: 'uYo', reparto: { uYo: 40, uA: 40 }, modo: 'igual', creadoPor: 'uYo', createdAt: '2026-10-01T10:00:00Z', fecha: mas(-2), carpetaId: 'tv' }];
  H.grupoVer(['g1']); await sleep(40); H.temaVer(['tv']); await sleep(20);
  // No es un fallo de la tanda (temaDias pide las dos fechas); se deja como nota informativa
  console.log((/al día · 4 días/.test(sh().textContent) ? 'INFO sí' : 'INFO no') + ' sale «al día» en un viaje sin fecha de fin');
  H.temaMenu(['tv']); await sleep(10); H.temaCerrarPre(['tv']); await sleep(10);
  const caja = sh().querySelector('.tema-cierre');
  ok(caja && caja.querySelector('[data-click^="temaCerrar|"]') && caja.querySelector('[data-click^="temaCerrarNo"]'), '«Cómo quedó el viaje» trae «Ahora no» y «Cerrar el viaje»');

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

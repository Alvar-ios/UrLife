// Calidad · barrido 08/11/2026: apuntar, editar, borrar, «Deshacer» y Papelera de movimientos, sin perder ni duplicar nada.
// Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
// Fallos de la app ya apuntados en docs/salud/2026-11-08-barrido.md: se avisan pero no paran las pruebas. Cuando se arreglen, pásalos a ok().
const conocido = (c, m) => console.log((c ? 'PASS ' : 'FALLO CONOCIDO ') + m);
// La app solo se entera de lo guardado por el «tiempo real» de Supabase; la capa falsa no lo tiene, así que lo imitamos a mano.
const conTiempoReal = (w) => { const orig = w.Data.collection; w.Data.collection = (n) => { const c = orig(n), os = c.onSnapshot; c.onSnapshot = (cb, er) => { (w.__subs = w.__subs || {})[n] = cb; return os(cb, er); }; return c; }; };
console.error = () => {};
const NUEVAS = { tu: 1, agenda: 0, crear: 0, importe: 0 };
const hoyD = new Date(), d = (n) => { const x = new Date(hoyD); x.setDate(x.getDate() - n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
(async () => {
  const e = makeEnv({ version: NUEVAS, movs: [
    { id: 'm1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Compra', importe: 42.5, fecha: d(1), metodoPago: 'Tarjeta' },
    { id: 'm2', tipo: 'Ingreso', categoria: 'Nómina', descripcion: '', importe: 1500, fecha: d(3), metodoPago: 'Transferencia' },
    { id: 't1', tipo: 'Traspaso', categoria: 'Traspaso', importe: 200, fecha: d(2), cuentaId: 'c1', cuentaDestinoId: 'c2' },
  ], pre: conTiempoReal, cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Ocio' }], cuentas: [{ id: 'c1', nombre: 'Nómina', saldo: 1000, principal: true }, { id: 'c2', nombre: 'Ahorro', saldo: 500 }] }, meta: { onboarded: true } } });
  await sleep(100);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, q = (s) => doc.querySelector('#sheetHost ' + s);
  const n = () => Object.keys(e.store.movimientos).length, P = (...ks) => ks.forEach((k) => A.tecPulsar(k));
  const deshacer = () => { const b = doc.querySelector('#toast .toast-btn'); if (!b) return false; b.click(); return true; };
  const tr = async () => { const cb = e.w.__subs && e.w.__subs.movimientos; if (cb) cb({ docs: Object.entries(e.store.movimientos).map(([id, v]) => ({ id, data: () => v })) }); await sleep(10); };
  const toastTxt = () => (doc.querySelector('#toast .toast-txt') || {}).textContent || '';

  // 1) Gasto nuevo con el teclado de la app; tocar «Guardar» dos veces seguidas no lo duplica
  H.crearIr(['gasto']); await sleep(20);
  P('1', '5', ',', '2'); H.tecCat(['Ocio']);
  P('ok'); P('ok'); await sleep(60); await tr();
  const nuevos = Object.values(e.store.movimientos).filter((m) => m.importe === 15.2);
  ok(nuevos.length === 1 && nuevos[0].categoria === 'Ocio' && nuevos[0].tipo === 'Gasto', 'gasto nuevo con el teclado: 15,20 en Ocio, una sola vez aunque toques Guardar dos veces');
  ok(n() === 4, 'hay 4 movimientos (3 + el nuevo)');
  await sleep(300);

  // 2) Editar: cambia el importe del mismo movimiento (mismo id), no crea otro
  A.H.openMovForm(['m1']); await sleep(30);
  ok(q('#fImporte'), 'editar: se abre la hoja del movimiento');
  q('#fImporte').value = '50,75'; q('#fDesc').value = 'Compra grande';
  await A.H.saveMov(); await sleep(60);
  ok(e.store.movimientos.m1 && e.store.movimientos.m1.importe === 50.75 && e.store.movimientos.m1.descripcion === 'Compra grande', 'editar: m1 pasa a 50,75 con su nueva nota');
  ok(n() === 4, 'editar: no se crea ningún movimiento nuevo');
  ok(e.store.movimientos.m1.fecha === d(1), 'editar: la fecha se conserva');
  conocido(e.store.movimientos.m1.metodoPago === 'Tarjeta', 'editar: un método de pago que ya no está en tu lista («Tarjeta») se conserva (hoy se borra al guardar)');
  await tr();
  await sleep(300);

  // 3) Borrar con doble toque, «Deshacer» lo devuelve igual (mismo id) y la Papelera lo suelta
  A.H.openMovForm(['m1']); await sleep(30);
  const btn = [...doc.querySelectorAll('#sheetHost [data-click^="deleteMov"]')][0];
  ok(!!btn, 'editar: hay botón para borrar');
  btn.click(); await sleep(10);
  ok(e.store.movimientos.m1, 'borrar: el primer toque solo pide confirmar');
  btn.click(); await sleep(60);
  ok(!e.store.movimientos.m1, 'borrar: el segundo toque lo borra'); await tr();
  ok((A.cfg().papelera || []).some((x) => x.k === 'mov' && x.id === 'm1'), 'borrar: va a la Papelera');
  ok(/eliminado/i.test(toastTxt()) && deshacer(), 'borrar: el aviso trae «Deshacer»');
  await sleep(60); await tr();
  ok(e.store.movimientos.m1 && e.store.movimientos.m1.importe === 50.75 && e.store.movimientos.m1.descripcion === 'Compra grande', 'Deshacer: vuelve el mismo movimiento (mismo id e importe)');
  ok(!(A.cfg().papelera || []).some((x) => x.id === 'm1'), 'Deshacer: sale de la Papelera');
  ok(n() === 4, 'Deshacer: no se duplica');
  await sleep(300);

  // 4) Borrar y recuperar desde la Papelera
  A.H.openMovForm(['m2']); await sleep(30);
  const b2 = doc.querySelector('#sheetHost [data-click^="deleteMov"]'); b2.click(); b2.click(); await sleep(60);
  ok(!e.store.movimientos.m2, 'borrar m2'); await tr();
  await sleep(5200); // el aviso con «Deshacer» ya se ha ido
  H.openPapelera ? H.openPapelera([]) : null; await sleep(20);
  if (H.papeleraRecuperar) { await H.papeleraRecuperar(['mov', 'm2']); await sleep(60); }
  ok(e.store.movimientos.m2 && e.store.movimientos.m2.importe === 1500 && e.store.movimientos.m2.tipo === 'Ingreso', 'Papelera: «Recuperar» devuelve la nómina tal cual');
  ok(!(A.cfg().papelera || []).some((x) => x.id === 'm2'), 'Papelera: ya no está en la Papelera');
  if (H.papeleraRecuperar) { await H.papeleraRecuperar(['mov', 'm2']); await sleep(40); }
  ok(n() === 4, 'Papelera: recuperar dos veces no lo duplica');

  // 5) Borrar un traspaso (su hoja propia) y deshacer
  const nTras = () => Object.values(e.store.movimientos).filter((m) => m.tipo === 'Traspaso').length;
  ok(nTras() === 1, 'hay un traspaso');
  if (H.openTraspaso) H.openTraspaso(['t1']); else if (H.traspasoVer) H.traspasoVer(['t1']); else A.H.openMovForm(['t1']);
  await sleep(30);
  const bt = doc.querySelector('#sheetHost [data-click^="deleteTraspaso"]');
  ok(!!bt, 'traspaso: su hoja tiene «Eliminar»');
  if (bt) { bt.click(); bt.click(); await sleep(60); }
  ok(nTras() === 0 && /Traspaso eliminado/.test(toastTxt()), 'traspaso: se borra con «Traspaso eliminado»'); await tr();
  deshacer(); await sleep(60);
  ok(nTras() === 1 && e.store.movimientos.t1 && e.store.movimientos.t1.importe === 200 && e.store.movimientos.t1.cuentaDestinoId === 'c2', 'traspaso: «Deshacer» lo devuelve con sus dos cuentas');

  // 6) Sin «tiempo real» (p. ej. el móvil volvió de segundo plano y se perdió la conexión): editar y borrar enseguida
  await sleep(300);
  A.H.openMovForm(['m2']); await sleep(30); q('#fImporte').value = '1600'; await A.H.saveMov(); await sleep(60); // sin tr()
  ok(e.store.movimientos.m2.importe === 1600, 'sin tiempo real: la edición se guarda (1.600)');
  conocido(A.S.movimientos.find((m) => m.id === 'm2').importe === 1600, 'sin tiempo real: la pantalla enseña lo guardado (hoy sigue enseñando 1.500 hasta recargar)');
  await sleep(300); await tr();
  // 7) Importe no válido o sin categoría: no guarda nada
  await sleep(300);
  H.crearIr(['gasto']); await sleep(20); P('ok'); await sleep(40);
  ok(n() === 4, 'gasto sin importe: no se guarda');
  H.closeSheet([]); await sleep(300);
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

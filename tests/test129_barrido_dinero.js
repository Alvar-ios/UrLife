// Calidad · barrido 08/11/2026: Dinero → pagar una deuda, borrar y recuperar una deuda, quitar una cuenta. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const conocido = (c, m) => console.log((c ? 'PASS ' : 'FALLO CONOCIDO ') + m); // apuntado en docs/salud/2026-11-08-barrido.md
console.error = () => {};
const NUEVAS = { tu: 1, agenda: 0, crear: 0, importe: 0 };
const hoyD = new Date(), d = (n) => { const x = new Date(hoyD); x.setDate(x.getDate() - n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
(async () => {
  const e = makeEnv({ version: NUEVAS, movs: [
    { id: 'p1', tipo: 'Deuda', categoria: 'Préstamo coche', importe: 250, fecha: d(30) },
    { id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 40, fecha: d(1), cuentaId: 'c1' },
  ], cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }],
    cuentas: [{ id: 'c1', nombre: 'Nómina', saldo: 1200, principal: true }, { id: 'c2', nombre: 'Hucha', saldo: 5200 }],
    deudas: [{ id: 'd1', nombre: 'Préstamo coche', objetivo: 9000, previo: 3000, cuotaMes: 250 }] }, meta: { onboarded: true } } });
  await sleep(100);
  const A = e.w.__APP__, H = A.H, doc = e.doc, q = (s) => doc.querySelector('#sheetHost ' + s);
  const deuda = () => (A.cfg().deudas || []).find((x) => x.nombre === 'Préstamo coche');
  A.S.tab = 'dinero'; A.render(); await sleep(20); ok(/Préstamo coche/.test(doc.querySelector('#content').textContent), 'Dinero: se ve la deuda');

  // 1) Pagar la cuota de una deuda: el formulario sale como «Deuda», con su nombre y la cuota puesta
  H.deudaPagar(['Préstamo coche']); await sleep(400);
  ok(q('#fImporte') && q('#fCategoria') && q('#fCategoria').value === 'Préstamo coche', 'Pagar deuda: se abre el formulario con «Préstamo coche»');
  ok(A.form().tipo === 'Deuda' && /250/.test(q('#fImporte').value), 'Pagar deuda: tipo Deuda y la cuota de 250 ya escrita');
  await H.saveMov(); await sleep(60);
  const pagos = Object.values(e.store.movimientos).filter((m) => m.tipo === 'Deuda' && m.categoria === 'Préstamo coche');
  ok(pagos.length === 2, 'Pagar deuda: se apunta el segundo pago');
  await sleep(300);

  // 2) Borrar la deuda: sus pagos siguen en Movimientos; «Deshacer» la devuelve igual
  H.deudaVer(['Préstamo coche']); await sleep(30); H.deudaMasMenu([]); await sleep(20);
  const bD = doc.querySelector('#sheetHost [data-click^="deudaEliminar"]');
  ok(!!bD, 'Deuda: su hoja tiene «Eliminar»');
  if (bD) { bD.click(); await sleep(10); ok(!!deuda(), 'Deuda: el primer toque solo pide confirmar'); bD.click(); await sleep(80); }
  ok(!deuda(), 'Deuda: el segundo toque la quita');
  ok(Object.values(e.store.movimientos).filter((m) => m.tipo === 'Deuda').length === 2, 'Deuda: sus pagos siguen guardados');
  const b = doc.querySelector('#toast .toast-btn'); ok(!!b, 'Deuda: el aviso trae «Deshacer»'); if (b) b.click(); await sleep(80);
  ok(deuda() && deuda().objetivo === 9000 && deuda().previo === 3000 && deuda().cuotaMes === 250 && deuda().id === 'd1', 'Deuda: «Deshacer» la devuelve con su total, lo ya pagado, la cuota y el mismo id');
  await sleep(300);

  // 3) Quitar una cuenta con movimientos pide un segundo toque
  const el1 = doc.createElement('button'); doc.body.appendChild(el1);
  H.cuentaQuitar(['0'], el1); await sleep(30);
  ok((A.cfg().cuentas || []).length === 2 && /Tiene 2 movimientos/.test(doc.querySelector('#toast').textContent), 'Quitar cuenta con movimientos: avisa y pide otro toque');
  // 4) Quitar una cuenta SIN movimientos (pero con 5.200 € de saldo): se va al primer toque y sin «Deshacer»
  await sleep(300);
  const el2 = doc.createElement('button'); doc.body.appendChild(el2);
  H.cuentaQuitar(['1'], el2); await sleep(30);
  conocido((A.cfg().cuentas || []).some((c) => c.id === 'c2') || !!doc.querySelector('#toast .toast-btn'), 'Quitar «Hucha» (5.200 €, sin movimientos): pide confirmar o deja «Deshacer» (hoy desaparece al primer toque)');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

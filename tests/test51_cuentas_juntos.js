// Cuentas, fase 2 (18/10): elegir de qué cuenta sale un gasto compartido o un pago al saldar, y la cuenta de los fijos.
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pad = (n) => String(n).padStart(2, '0');
const d = new Date(), ym = d.getFullYear() + '-' + pad(d.getMonth() + 1), hoy = ym + '-' + pad(d.getDate());
const ayer = (() => { const x = new Date(Date.now() - 864e5 * 40); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); })();
(async () => {
  const yo = 'yo', ella = 'pa';
  const e = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'],
      cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: ayer, principal: true }, { id: 'c2', nombre: 'Efectivo', tipo: 'efectivo', saldo: 100, fecha: ayer }],
      cobros: [{ nombre: 'Nómina', importe: 1500, diaDelMes: 1, regla: { t: 'dia', dia: 1, ajuste: '' }, desde: ayer, cuentaId: 'c2' }] }, meta: { onboarded: true } },
    movs: [], url: 'https://x.test/', session: { user: { email: 't@t.com', id: yo } } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost').textContent;
  S.grupos = [{ id: 'g1', nombre: 'Casa', miembros: [{ user_id: yo, nombre: 'Yo', rol: 'admin' }, { user_id: ella, nombre: 'Pa', rol: 'miembro' }] }];
  S.compartidos = [{ id: 'k1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 22.5, fecha: hoy, pagadoPor: yo, reparto: { [yo]: 11.25, [ella]: 11.25 }, modo: 'igual', createdAt: new Date().toISOString() }];
  A.render(); await sleep(10);
  const saldo = (id) => A.saldoCuenta(A.cfg().cuentas.find((c) => c.id === id));
  ok(saldo('c1') === 977.5 && saldo('c2') === 100, 'sin elegir, el compartido que pagas sale de la principal');
  S.config.cuentaJuntos = { k1: 'c2' }; A.render(); await sleep(5);
  ok(saldo('c1') === 1000 && saldo('c2') === 77.5, 'si dices que lo pagaste en efectivo, baja el efectivo y no el banco');
  // al editarlo, «Lo pagaste desde» con Efectivo marcado
  H.openMovForm(['c:k1']); await sleep(20);
  ok(/Lo pagaste desde/.test(sh()) && /Efectivo/.test(doc.querySelector('#cuentaChips .chip.active').textContent), 'el formulario del compartido enseña de qué cuenta salió');
  H.closeSheet([]); await sleep(260);
  // saldar: te pagan a una cuenta
  S.compartidos.push({ id: 'k2', grupoId: 'g1', tipo: 'Liquidación', importe: 11.25, fecha: hoy, pagadoPor: ella, reparto: { [yo]: 11.25 }, createdAt: new Date().toISOString() });
  S.config.cuentaJuntos = { k1: 'c2', k2: 'c2' };
  ok(saldo('c2') === 88.75 && saldo('c1') === 1000, 'lo que te devuelven al saldar entra en la cuenta que elegiste');
  S.compartidos.pop(); S.config.cuentaJuntos = { k1: 'c2' };
  // hoja de saldar: elegir la cuenta
  A.H.saldarAbrir(['g1', ella, yo, '11.25']); await sleep(10);
  ok(/A la cuenta/.test(sh()) && doc.querySelectorAll('#saldarCuentas .chip').length === 2, 'al saldar, eliges a qué cuenta te llega');
  click(e, 'saldarCuenta', 'c2'); await sleep(5);
  ok(/Efectivo/.test(doc.querySelector('#saldarCuentas .chip.active').textContent), 'y se marca la elegida');
  H.closeSheet([]); await sleep(260);
  // fijos con cuenta
  H.recEditar(['cobro', '0']); await sleep(10);
  ok(/Llega a la cuenta/.test(sh()) && /Efectivo/.test(doc.querySelector('#recCuentas .chip.active').textContent), 'el cobro fijo dice a qué cuenta llega');
  click(e, 'recCuenta', 'c1'); await sleep(5); H.recGuardar([]); await sleep(30);
  ok(e.store.cfg.app.cobros[0].cuentaId === 'c1', 'y se guarda al cambiarla');
  H.recEditar(['cobro', '0']); await sleep(10); click(e, 'recCuenta', 'c2'); await sleep(5); H.recGuardar([]); await sleep(30);
  H.closeSheet([]); await sleep(260);
  await H.recSi(['cobro', '0', ym + '-01']); await sleep(40);
  const nuevo = Object.values(e.store.movimientos).find((m) => m.tipo === 'Ingreso');
  ok(!!nuevo && nuevo.cuentaId === 'c2', 'al confirmar el cobro, el movimiento va a su cuenta (' + (nuevo && nuevo.cuentaId) + ')');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH', x); process.exit(1); });

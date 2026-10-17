// Varias cuentas: «Tu saldo» incluye lo que te deben y lo que debes en gastos compartidos.
// «Lo que sale del banco» solo cambia con el dinero real (pagos que salen de la cuenta principal).
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hace = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const d2 = hace(2);
const CUENTAS = [{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: hace(20) }];
async function env(compartidos) {
  const e = makeEnv({
    cfg: { app: { categoriasGasto: [], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(CUENTAS)) }, meta: { onboarded: true } },
    movs: [], url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } },
  });
  await sleep(100); e.w.__APP__.S.compartidos = compartidos; e.w.__APP__.render(); await sleep(10); return e;
}
const G = (id, pagadoPor, importe, reparto) => ({ id, grupoId: 'gr', fecha: d2, tipo: 'Gasto', categoria: 'Restaurantes y bares', importe, pagadoPor, reparto, createdAt: new Date().toISOString() });
(async () => {
  // 1. Pago yo 100 (mi parte 50): banco 900, tu saldo 950
  let e = await env([G('s1', 'yo', 100, { yo: 50, otro: 50 })]); let A = e.w.__APP__;
  let c = A.cfg().cuentas[0];
  ok(A.saldoCuenta(c) === 900 && A.compartidosCuenta(c).neto === 50, 'pago yo 100 (mi parte 50): el banco baja 100 y te deben 50');
  // 2. Paga otro 100 (mi parte 50): banco 1000, tu saldo 950
  e = await env([G('s2', 'otro', 100, { yo: 50, otro: 50 })]); A = e.w.__APP__; c = A.cfg().cuentas[0];
  ok(A.saldoCuenta(c) === 1000 && A.compartidosCuenta(c).neto === -50, 'paga otro 100 (mi parte 50): el banco no cambia y debes 50');
  // 3. Pago yo 100 y el otro me devuelve 50 por Bizum (liquidación): banco 950, tu saldo 950 (no se cuenta dos veces)
  const liq = { id: 'l1', grupoId: 'gr', fecha: d2, tipo: 'Liquidación', importe: 50, pagadoPor: 'otro', reparto: { yo: 50 }, createdAt: new Date().toISOString() };
  e = await env([G('s3', 'yo', 100, { yo: 50, otro: 50 }), liq]); A = e.w.__APP__; c = A.cfg().cuentas[0];
  ok(A.saldoCuenta(c) === 950 && A.compartidosCuenta(c).neto === 0, 'tras la devolución: banco 950, ya no te deben nada, tu saldo también 950');
  // 4. Yo pago la deuda a otro (liquidación de mi parte): el banco baja 50 y tu saldo no cambia
  const pago = { id: 'l2', grupoId: 'gr', fecha: d2, tipo: 'Liquidación', importe: 50, pagadoPor: 'yo', reparto: { otro: 50 }, createdAt: new Date().toISOString() };
  e = await env([G('s4', 'otro', 100, { yo: 50, otro: 50 }), pago]); A = e.w.__APP__; c = A.cfg().cuentas[0];
  ok(A.saldoCuenta(c) === 950 && A.compartidosCuenta(c).neto === 0, 'pagar lo que debías: banco 950 y tu saldo 950 (no cambia)');
  // 5. Con la ficha abierta se ven las dos cifras
  e = await env([G('s5', 'yo', 100, { yo: 50, otro: 50 })]); A = e.w.__APP__;
  A.H.cuentaVer(['c1']); await sleep(15);
  const txt = e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
  ok(/Saldo real · lo que dice tu banco/.test(txt) && /Saldo virtual/.test(txt) && /900,00/.test(txt) && /950,00/.test(txt), 'la ficha enseña el saldo real (banco) 900 € y el virtual (contando Juntos) 950 €');
  // 6. Sin compartidos no aparece nada extra
  e = await env([]); A = e.w.__APP__; A.H.cuentaVer(['c1']); await sleep(15);
  ok(!/Saldo virtual/.test(e.doc.querySelector('#sheetHost').textContent), 'sin gastos compartidos la ficha no cambia');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

// 08/11/2026 · docs/30 tanda 6: meta ligada a una cuenta. Aportar mueve el dinero entre cuentas; el mes cuenta igual. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoy = new Date(), iso = hoy.toISOString().slice(0, 10);
const CUENTAS = [{ id: 'cs', nombre: 'Santander', principal: true, saldo: 1000, fecha: '2026-01-01' }, { id: 'ci', nombre: 'ING Ahorro', tipo: 'ahorro', saldo: 0, fecha: '2026-01-01' }];
(async () => {
  const e = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], ingresos: ['Nómina'], cuentas: CUENTAS, ahorro: [{ id: 'mj', nombre: 'Viaje a Japón', objetivo: 3000 }, { id: 'mc', nombre: 'Coche', objetivo: 2000 }] }, meta: { onboarded: true } }, movs: [], version: { dinero: 0 } });
  await sleep(120);
  const A = e.w.__APP__, H = A.H, sh = () => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
  const guardados = () => Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v));
  const refrescar = () => { A.S.movimientos = guardados().filter((m) => m.tipo !== 'Traspaso'); A.S._movsRaw = guardados(); };
  // ligar la meta
  H.metaEditar(['mj']); await sleep(10);
  ok(/¿Dónde guardas este dinero\?/.test(sh()) && /En ninguna cuenta concreta/.test(sh()), 'el editor de la meta pregunta «¿Dónde guardas este dinero?»');
  H.metaCuentaElegir(['ci']); await sleep(5);
  ok(/A partir de ahora, al aportar, el dinero pasará de tu cuenta a ING Ahorro. Lo que ya llevabas no cambia./.test(sh()), 'al ligarla avisa de que lo de antes no cambia');
  await H.metaGuardar([]); await sleep(20);
  ok(A.cfg().ahorro.find((m) => m.id === 'mj').cuentaId === 'ci' && A.cuentaDeMeta('mj') === 'ci', 'la meta queda ligada a ING Ahorro');
  H.closeSheet([]); await sleep(260);
  // aportar
  const k0 = A.kpisMes(hoy.getFullYear(), hoy.getMonth() + 1);
  H.metaAportarR(['mj']); await sleep(10);
  ok(/Desde/.test(sh()) && /pasará de Santander a ING Ahorro/.test(sh()), 'Aportar enseña «Desde» y que el dinero pasará de Santander a ING Ahorro');
  A.form().importe = '100'; await H.aportarRGuardar([]); await sleep(40); refrescar();
  const ap = guardados().find((m) => m.tipo === 'Ahorro');
  ok(ap && ap.cuentaId === 'cs' && ap.cuentaDestinoId === 'ci' && ap.metaId === 'mj' && ap.importe === 100, 'se guarda un apartado de 100 € de Santander a ING Ahorro, para la meta');
  ok(A.saldoCuenta(A.cfg().cuentas[0]) === 900 && A.saldoCuenta(A.cfg().cuentas[1]) === 100, 'Santander baja a 900 € e ING Ahorro sube a 100 €');
  const k1 = A.kpisMes(hoy.getFullYear(), hoy.getMonth() + 1);
  ok(Math.round((k1.ahorro - k0.ahorro) * 100) / 100 === 100 && k1.gastos === k0.gastos, 'en tu mes cuenta como apartado (100 €), igual que siempre; no es un gasto');
  // una meta sin ligar no mueve nada
  H.closeSheet([]); await sleep(260);
  H.metaAportarR(['mc']); await sleep(10);
  ok(!/Desde/.test(sh()) && /Apartar no saca dinero del banco/.test(sh()), 'una meta sin cuenta sigue como antes');
  A.form().importe = '50'; await H.aportarRGuardar([]); await sleep(40); refrescar();
  ok(A.saldoCuenta(A.cfg().cuentas[0]) === 900, 'y no mueve dinero entre cuentas');
  // aviso si las metas ligadas superan el saldo
  const ah = A.cfg().ahorro.map((m) => m.id === 'mj' ? Object.assign({}, m, { yaAhorrado: 500 }) : m); e.w.__APP__.S.cfg && 0;
  H.metaEditar(['mj']); await sleep(10); e.doc.querySelector('#mFuera').value = '500'; await H.metaGuardar([]); await sleep(20);
  ok(/pero la cuenta tiene/.test(A.metaCuentaAviso('ci')), 'si la meta lleva más de lo que hay en la cuenta, sale un aviso suave');
  // varias metas en la misma cuenta
  H.metaEditar(['mc']); await sleep(10); H.metaCuentaElegir(['ci']); await H.metaGuardar([]); await sleep(20);
  ok(A.cuentaDeMeta('mc') === 'ci' && /Tus metas en ING Ahorro suman/.test(A.metaCuentaAviso('ci')), 'una cuenta puede guardar varias metas, y el aviso habla de todas');
  // desligar: lo aportado antes se queda como estaba
  H.metaEditar(['mj']); await sleep(10); H.metaCuentaElegir(['']); await H.metaGuardar([]); await sleep(20);
  ok(!A.cuentaDeMeta('mj') && A.saldoCuenta(A.cfg().cuentas[1]) === 100, 'al desligarla, lo que ya se movió sigue en ING Ahorro');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})();

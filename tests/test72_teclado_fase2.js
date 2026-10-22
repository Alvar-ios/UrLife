// Teclado propio, fase 2: aportar a una meta y traspasos (22/10/2026). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ version: { importe: 0 }, movs: [], cfg: { app: { cuentas: [{ id: 'c1', nombre: 'Banco A', saldo: 1000, ts: 1 }, { id: 'c2', nombre: 'Banco B', saldo: 50, ts: 1 }], ahorro: [{ id: 'h1', nombre: 'Viaje', objetivo: 1000 }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, q = (s) => doc.querySelector('#sheetHost ' + s), P = (...k) => k.forEach((x) => A.tecPulsar(x));
  // Aportar
  H.metaAportarR(['h1']); await sleep(20);
  ok(q('#tec') && !q('#tec').hidden && q('#apImporte').type === 'hidden' && !q('#tec .tec-neg'), 'aportar: teclado de la app, sin tecla de negativo');
  P('1', '5', '0');
  ok(/1[\s.]?50|150/.test(q('#tecCifra').textContent) && /Aportar/.test(q('.tec-ok').textContent) && /Aportar 150,00/.test(q('#apGuardar').textContent), 'aportar: la cifra, la tecla «Aportar» y la previsión al momento');
  H.aportarRImp([200]); await sleep(5);
  ok(A.form().importe === '200' && q('#apImporte').value === '200', 'aportar: la ficha de 200 € escribe en la cifra');
  P('ok'); await sleep(40);
  const ap = Object.values(e.store.movimientos).find((m) => m.tipo === 'Ahorro');
  ok(ap && ap.importe === 200 && ap.categoria === 'Viaje', 'aportar: se guardan 200 € en la meta');
  await sleep(300);
  // Traspaso
  H.crearIr(['traspaso']); await sleep(20);
  ok(q('#tec') && !q('#tec .tec-neg') && /Guardar/.test(q('.tec-ok').textContent), 'traspaso: teclado de la app con «Guardar» y sin negativo');
  P('2', '5', ',', '5');
  P('ok'); await sleep(40);
  const tr = Object.values(e.store.movimientos).find((m) => m.tipo === 'Traspaso');
  ok(tr && tr.importe === 25.5 && tr.cuentaId === 'c1' && tr.cuentaDestinoId === 'c2', 'traspaso: se guardan 25,50 de Banco A a Banco B');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

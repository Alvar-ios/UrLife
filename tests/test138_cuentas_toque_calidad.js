// 10/11/2026 · Calidad: tras el arreglo de bancoElegir/bancoSugerir (el evento del toque llegaba como número de cuenta),
// comprobamos tocando de verdad «Otro, o sin banco» y «Ponle su logo». Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  // 1) Usuario nuevo, sin cuentas: «Otro, o sin banco» crea una cuenta sin banco y deja escribir el nombre
  const e = makeEnv({ cfg: { app: { compararVersiones: false, cuentas: [] }, meta: { onboarded: true } }, movs: [], version: { tu: 1, agenda: 0, crear: 0 } });
  const A = e.w.__APP__; await A.main(); await sleep(150);
  A.H.goTab(['dinero']); await sleep(30);
  click(e, 'openCuentas'); await sleep(20); click(e, 'cuentaAnadir'); await sleep(20);
  const otro = [...e.doc.querySelectorAll('#sheetHost [data-click]')].find((x) => /Otro, o sin banco/.test(x.textContent));
  ok(!!otro, 'sale el botón «Otro, o sin banco»'); otro.click(); await sleep(100);
  let cs = e.store.cfg.app.cuentas || [];
  ok(cs.length === 1 && !cs[0].banco, 'se crea una cuenta sin banco (' + JSON.stringify(cs) + ')');
  const nom = e.doc.querySelector('#fCuentaNombre');
  ok(!!nom, 'se abre su ficha con el campo Nombre');
  nom.value = 'Caja del Barrio'; nom.dispatchEvent(new e.w.Event('change', { bubbles: true })); await sleep(30);
  ok(e.store.cfg.app.cuentas.length === 1 && e.store.cfg.app.cuentas[0].nombre === 'Caja del Barrio', 'el nombre se guarda en la misma cuenta');

  // 2) Una cuenta con nombre que parece de un banco: «Ponle su logo» pone el banco a ESA cuenta, sin crear otra
  const e2 = makeEnv({ cfg: { app: { compararVersiones: false, cuentas: [{ id: 'c1', nombre: 'Mi cuenta', saldo: 100, fecha: '2026-11-01' }, { id: 'c2', nombre: 'Santander nómina', saldo: 500, fecha: '2026-11-01' }] }, meta: { onboarded: true } }, movs: [], version: { tu: 1, agenda: 0, crear: 0 } });
  const B = e2.w.__APP__; await B.main(); await sleep(150);
  B.H.goTab(['dinero']); await sleep(30);
  click(e2, 'openCuentas'); await sleep(20);
  const fila = [...e2.doc.querySelectorAll('#sheetHost [data-click]')].find((x) => /Santander nómina/.test(x.textContent));
  ok(!!fila, 'sale la fila de la segunda cuenta'); fila.click(); await sleep(30);
  const sug = e2.doc.querySelector('#sheetHost [data-click^="bancoSugerir"]');
  ok(!!sug, 'sale «Ponle su logo»');
  if (sug) { sug.click(); await sleep(60); }
  cs = e2.store.cfg.app.cuentas || [];
  ok(cs.length === 2, 'no se crea ninguna cuenta nueva (' + cs.length + ')');
  ok(cs[1] && cs[1].banco === 'santander' && cs[1].saldo === 500 && cs[1].nombre === 'Santander nómina', 'la segunda cuenta queda con el logo de Santander y conserva nombre y saldo');
  ok(cs[0] && !cs[0].banco && cs[0].saldo === 100, 'la primera cuenta no cambia');
  console.log(fails ? 'FALLOS: ' + fails : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

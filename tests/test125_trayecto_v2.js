// 07/11/2026 · Calidad: Trayecto en 3 pasos (coche recogido, foco, precios del día). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
(async () => {
  const e = makeEnv({ cfg: { app: { nombre: 'Prueba', mesInicio: 1, trayecto: { prod: 'goA', consumo: 6, provincia: '28', guardados: [] } }, meta: { onboarded: true } }, version: { crear: 0 } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S, sh = () => doc.querySelector('#sheetHost');
  S.preciosCarb = { prov: '28', cuando: Date.now(), datos: {} };
  H.trAbrir([]); await sleep(20);
  ok(!!doc.querySelector('#trCocheTxt') && !doc.querySelector('.tr-grupos'), 'con coche guardado: sale recogido');
  ok(/orientativo/.test(doc.querySelector('#trCocheTxt').textContent), 'sin precios del día: dice «precio orientativo»');
  // llegan los precios del día: el resumen se actualiza sin repintar
  S.preciosCarb = { prov: '28', cuando: Date.now(), datos: { goA: { precio: 1.459, provincia: '28', fecha: '2026-11-07' } } };
  A.trRefrescar ? A.trRefrescar() : H.trPers([0]);
  const txt = doc.querySelector('#trCocheTxt').textContent;
  ok(/1,459/.test(txt) && /hoy en Madrid/.test(txt), 'al llegar los precios el resumen dice «hoy en Madrid» y el precio');
  // foco: escribir km no repinta la hoja
  const km = doc.querySelector('#trKm'); km.focus(); km.value = '12'; H.trKm([], km); await sleep(5);
  ok(doc.activeElement === km && doc.querySelector('#trKm') === km, 'escribir los km no quita el foco');
  H.trCoche([1]); await sleep(5);
  const pr = doc.querySelector('#trPrecio'); pr.focus(); pr.value = '1,5'; H.trPrecioIn([], pr); await sleep(5);
  ok(doc.activeElement === pr, 'escribir el precio no quita el foco');
  const co = doc.querySelector('#trCons'); co.focus(); co.value = '7'; H.trCons([], co); await sleep(5);
  ok(doc.activeElement === co, 'escribir el consumo no quita el foco');
  H.trCoche([0]); await sleep(5);
  ok(/tu precio/.test(doc.querySelector('#trCocheTxt').textContent) && /7 l\/100/.test(doc.querySelector('#trCocheTxt').textContent), 'al cerrar, el resumen muestra tu precio y tu consumo');
  // accesibilidad básica
  ok(doc.querySelector('.tr-vuelta').getAttribute('aria-pressed') !== null, '«Ida y vuelta» dice si está pulsado');
  const kmIn = doc.querySelector('#trKm');
  ok(!!(kmIn.getAttribute('aria-label') || doc.querySelector('label[for="trKm"]')), 'la casilla de km tiene nombre para lectores de pantalla');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

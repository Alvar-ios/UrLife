// 07/11/2026 (petición del dueño, docs/31): calculadora de trayecto en el botón +. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
(async () => {
  const e = makeEnv({ cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Transporte' }, { nombre: 'Otros' }] }, meta: { onboarded: true } }, version: { crear: 0 } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S, sh = () => doc.querySelector('#sheetHost');
  const set = (id, v, h) => { const el = doc.querySelector(id); el.value = v; H[h]([], el); };
  A.openCrear(); await sleep(20);
  ok(/Trayecto/.test(sh().textContent), 'el + tiene «Trayecto»');
  H.trAbrir([]); await sleep(20);
  ok(/Trayecto en coche/.test(sh().textContent) && /Pon la distancia/.test(sh().textContent), 'se abre la hoja, sin resultado todavía');
  H.trModo(['km']); await sleep(5);
  set('#trKm', '100', 'trKm');
  let r = A.trCalc();
  ok(r && r.km === 100 && Math.abs(r.cant - 6.5) < 1e-9 && r.coste === 11.05, '100 km en gasolina 95 a 6,5 l y 1,70 €/l = 11,05 € (precio orientativo)');
  ok(/unos 11,05/.test(sh().textContent) && /6,5 litros/.test(sh().textContent) && /Precio orientativo/.test(sh().textContent), 'el resultado sale abajo y dice que el precio es orientativo');
  H.trVuelta([1]); await sleep(5);
  ok(A.trCalc().km === 200 && A.trCalc().coste === 22.1, 'ida y vuelta duplica los km');
  H.trGrupo(['diesel']); await sleep(5);
  ok(A.form().prod === 'goA' && /Gasóleo premium/.test(sh().textContent), 'Diésel enseña sus tipos y elige Gasóleo A');
  H.trGrupo(['electrico']); await sleep(5);
  ok(/kWh/.test(sh().textContent) && /Ultrarrápida/.test(sh().textContent), 'eléctrico en kWh con tipos de carga');
  H.trProd(['eUltra']); await sleep(5);
  ok(/media de los cargadores/.test(sh().textContent) && !doc.querySelector('#trProv'), 'ultrarrápida: precio medio orientativo, sin provincia');
  H.trGrupo(['gasolina']); await sleep(5);
  set('#trPrecio', '1,5', 'trPrecioIn');
  ok(A.trPrecio().fuente === 'tuyo' && A.trCalc().coste === 19.5, 'tu propio precio manda (1,5 €/l)');
  H.trNivel(['mucho']); await sleep(5);
  ok(Math.abs(A.trCalc().cant - 200 * 8.125 / 100) < 0.02, '«Mucho» sube el consumo un 25 %');
  H.trPers([1]); H.trPers([1]); await sleep(5);
  ok(A.trCalc().n === 3 && /cada uno/.test(sh().textContent), '¿Cuántos vais? reparte entre 3');
  // precios del día de la tabla pública
  e.w.Data = Object.assign(e.w.Data || {}, { carburantes: { ultimos: async (p) => [{ fecha: '2026-11-06', provincia: 'ES', producto: 'g95', precio: 1.6 }, { fecha: '2026-11-06', provincia: '28', producto: 'g95', precio: 1.62 }] } });
  set('#trPrecio', '', 'trPrecioIn');
  const sel = doc.querySelector('#trProv'); sel.value = '28'; H.trProv([], sel); await sleep(30);
  ok(A.trPrecio().fuente === 'provincia' && A.trPrecio().v === 1.62 && /Precio medio en Madrid/.test(sh().textContent), 'con la provincia usa su precio del día');
  // guardar y repetir
  H.trGuardar([]); await sleep(5);
  set('#trNombre', 'Casa – pueblo', 'trNombre'); H.trGuardarOk([]); await sleep(20);
  const g = (A.cfg().trayecto || {}).guardados || [];
  ok(g.length === 1 && g[0].km === 100 && g[0].vuelta === true && !('de' in g[0]) && A.cfg().trayecto.provincia === '28', 'guarda nombre, km y coche (sin direcciones) y recuerda la provincia');
  H.closeSheet([]); await sleep(260);
  H.trAbrir([]); await sleep(20);
  ok(/Repetir trayecto/.test(sh().textContent) && /Casa – pueblo/.test(sh().textContent), 'al volver sale «Repetir trayecto»');
  H.trUsar([g[0].id]); await sleep(10);
  ok(A.trCalc().km === 200, 'repetir rellena los km');
  // apuntar
  H.trApuntar([]); await sleep(20);
  const imp = doc.querySelector('#fImporte'), desc = doc.querySelector('#fDesc') || doc.querySelector('[id^="fDesc"]');
  ok(A.form().kind === 'mov' && imp && Number(String(imp.value).replace(',', '.')) > 0, '«Apuntar gasto» abre el gasto con el importe');
  // sitios sin servidor: mensaje claro
  H.closeSheet([]); await sleep(260); H.trAbrir([]); await sleep(10);
  H.trDist([]); await sleep(10);
  ok(/Escribe de dónde sales/.test(sh().textContent), 'calcular sin sitios pide escribirlos');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

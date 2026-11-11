// 11/11/2026 · Auditoría A4: quien cobra a final de mes ve una tarjeta para que «Tu mes» empiece el día que cobra.
// Tocando de verdad. Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const fechaDia = (mesesAtras, dia) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - mesesAtras); const ult = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(dia, ult)); return d.toISOString().slice(0, 10); };
(async () => {
  const nominas = [{ id: 'n1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1800, fecha: fechaDia(1, 27) }, { id: 'n2', tipo: 'Ingreso', categoria: 'Nómina', importe: 1800, fecha: fechaDia(2, 28) }];
  let e = makeEnv({ cfg: { app: { compararVersiones: false }, meta: { onboarded: true } }, movs: nominas, version: { tu: 0, agenda: 0, crear: 0 } });
  await e.w.__APP__.main(); await sleep(150);
  const card = () => e.doc.querySelector('.tumes-sug');
  ok(!!card() && /Cobras hacia el día 2[78]/.test(card().textContent), 'sale la tarjeta «Cobras hacia el día…» (' + (card() ? card().textContent.slice(0, 40) : '-') + ')');
  click(e, 'tuMesSugSi'); await sleep(60);
  const mi = e.store.cfg.app.mesInicio || {};
  ok(mi.modo === 'cobro' && (mi.dia === 27 || mi.dia === 28) && !card(), '«Sí» guarda «Tu mes» desde ese día y la tarjeta se va');
  // «No»: no vuelve a salir
  e = makeEnv({ cfg: { app: { compararVersiones: false }, meta: { onboarded: true } }, movs: nominas, version: { tu: 0, agenda: 0, crear: 0 } });
  await e.w.__APP__.main(); await sleep(150);
  click(e, 'tuMesSugNo'); await sleep(60);
  ok(!e.doc.querySelector('.tumes-sug') && e.store.cfg.app.tuMesSug === 'no' && !e.store.cfg.app.mesInicio, '«No» la quita para siempre y no cambia «Tu mes»');
  // quien cobra a principios de mes, o ya eligió, no la ve
  e = makeEnv({ cfg: { app: { compararVersiones: false }, meta: { onboarded: true } }, movs: [{ id: 'n3', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: fechaDia(1, 3) }], version: { tu: 0, agenda: 0, crear: 0 } });
  await e.w.__APP__.main(); await sleep(150);
  ok(!e.doc.querySelector('.tumes-sug'), 'quien cobra el día 3 no la ve');
  e = makeEnv({ cfg: { app: { compararVersiones: false, mesInicio: { modo: 'natural', dia: 1 } }, meta: { onboarded: true } }, movs: nominas, version: { tu: 0, agenda: 0, crear: 0 } });
  await e.w.__APP__.main(); await sleep(150);
  ok(!e.doc.querySelector('.tumes-sug'), 'quien ya eligió «Tu mes» no la ve');
  // B2: la tecla de guardar dice qué falta
  e = makeEnv({ cfg: { app: { compararVersiones: false, categoriasGasto: [{ nombre: 'Supermercado' }] }, meta: { onboarded: true } }, movs: [], version: { tu: 0, agenda: 0, crear: 0, importe: 0 } });
  await e.w.__APP__.main(); await sleep(150);
  click(e, 'onFab'); await sleep(30); click(e, 'crearIr', 'gasto'); await sleep(40);
  e.doc.querySelector('#sheetHost [data-click="tecK|5"]').click(); await sleep(10);
  const okTxt = () => (e.doc.querySelector('#tecOkTxt') || {}).textContent;
  ok(okTxt() === 'Elige categoría', 'con importe y sin categoría, la tecla dice «Elige categoría» (' + okTxt() + ')');
  const cat = e.doc.querySelector('#sheetHost [data-click^="tecCat|"]'); if (cat) cat.click(); await sleep(10);
  ok(okTxt() !== 'Elige categoría', 'al elegirla, vuelve a «' + okTxt() + '»');
  // B8: en Tú, la novedad no va junto al nombre
  e.w.__APP__.H.closeSheet([]); await sleep(300); e.w.__APP__.H.goTab(['tu']); await sleep(30);
  ok(!e.doc.querySelector('.tu2-quien .badge-new'), 'Tú: ninguna etiqueta pegada al nombre de la persona');
  // Android: Excel, copia y .ics pasan por el menú de compartir (puente nativo) en vez de un enlace de descarga
  const llamadas = [];
  e = makeEnv({ cfg: { app: { compararVersiones: false }, meta: { onboarded: true } }, movs: [{ id: 'x1', tipo: 'Gasto', categoria: 'Otros', importe: 3, fecha: fechaDia(0, 1) }], version: { tu: 0, agenda: 0, crear: 0 },
    pre: (w) => { w.__nativo = { android: true, guardarArchivo: async (n, t, m) => { llamadas.push([n, t, m]); return true; } }; } });
  await e.w.__APP__.main(); await sleep(150);
  e.w.__APP__.H.exportCsv && e.w.__APP__.H.exportCsv([]); await sleep(20);
  e.w.__APP__.H.exportBackup && e.w.__APP__.H.exportBackup([]); await sleep(20);
  ok(llamadas.some((x) => /^palomapp-movimientos-.*\.csv$/.test(x[0]) && /Otros/.test(x[1])) && llamadas.some((x) => /^palomapp-copia-.*\.json$/.test(x[0])), 'en la app de Android, Excel y copia van al menú de compartir (' + llamadas.map((x) => x[0]).join(', ') + ')');
  console.log(fails ? 'FALLOS: ' + fails : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

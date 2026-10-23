// Formas de las metas (23/10/2026, docs/15 2.3 v2): forma por el nombre, elegir a mano, el nombre dentro y la hoja con el %. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
let S_;
(async () => {
  const e = makeEnv({ version: { dinero: 0 }, cfg: { app: { cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 1500, ts: 1 }, { id: 'c2', nombre: 'Otro banco', saldo: 500, ts: 1 }], categoriasGasto: [{ nombre: 'Casa' }], ahorro: [{ id: 'h1', nombre: 'Viaje a Japón', objetivo: 1000, yaAhorrado: 400 }, { id: 'h2', nombre: 'Colchón', objetivo: 2000, yaAhorrado: 2000 }, { id: 'h3', nombre: 'Cosas', objetivo: 500, yaAhorrado: 100, forma: 'regalo', emoji: '🎁' }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, cfg = () => e.store.cfg.app, sh = () => doc.querySelector('#sheetHost');
  H.goTab(['dinero']); await sleep(30); H.dm3Tab(['metas']); await sleep(20);
  const cards = [...doc.querySelectorAll('.dm-formas .dm-fm')];
  ok(cards.length === 2, 'dos metas activas en el mosaico (la conseguida va plegada)');
  ok(cards[0] && /Viaje a Japón/.test(cards[0].querySelector('.fm-t').textContent) && /40 %/.test(cards[0].textContent), 'el nombre va escrito dentro de la forma y debajo el %');
  ok(cards.every((c) => c.querySelector('.dm-fm-mas[aria-label^="Aportar"]')), 'cada meta lleva su «+» para aportar');
  ok(/Conseguidas \(1\)/.test(doc.querySelector('#content').textContent), 'la conseguida, plegada en «Conseguidas (1)»');
  H.dmHechas([]); await sleep(20);
  ok(doc.querySelector('.dm-fm .fm-ok') && doc.querySelector('.fm-con.hecha'), 'la conseguida: llena, contorno del color de la app y el ✓');
  // hoja
  H.metaVer(['h1']); await sleep(20);
  ok(sh().querySelector('.dm-hring .fm .fm-t.g') && /40 %/.test(sh().querySelector('.dm-hring .fm').textContent), 'la hoja de la meta: la forma grande con el % dentro');
  H.closeSheet([]); await sleep(300);
  // editor: sugerida por el nombre, elegir a mano y volver a «la del nombre»
  H.metaEditar(['h1']); await sleep(20);
  const on = () => (sh().querySelector('.fm-op.on') || {}).dataset || {};
  ok(on().k === 'maleta' && sh().querySelector('.fm-op.sug[data-k="maleta"]') && /Elegida por el nombre: Maleta/.test(sh().textContent), 'editor: «Viaje…» sugiere la maleta');
  H.metaFormaElegir(['casa']); await sleep(10);
  ok(on().k === 'casa' && /Elegida a mano/.test(sh().textContent), 'se puede elegir otra');
  await H.metaGuardar([]); await sleep(30);
  ok((cfg().ahorro.find((m) => m.id === 'h1') || {}).forma === 'casa', 'se guarda en la configuración (forma: casa)');
  H.metaEditar(['h1']); await sleep(20); H.metaFormaElegir(['']); await sleep(10); await H.metaGuardar([]); await sleep(30);
  ok(!('forma' in (cfg().ahorro.find((m) => m.id === 'h1') || {})), '«Que la elija el nombre» quita la forma guardada');
  ok((cfg().ahorro.find((m) => m.id === 'h3') || {}).emoji === '🎁', 'el emoji antiguo se queda guardado');
  // nueva: el nombre cambia la sugerida al escribir
  H.metaNueva([]); await sleep(20);
  const inp = sh().querySelector('#mNombre'); inp.value = 'Perro'; inp.dispatchEvent(new e.w.Event('input', { bubbles: true })); await sleep(20);
  ok(on().k === 'mascota', 'al escribir «Perro», la sugerida pasa a ser la huella');
  // Dinero con pestañas (docs/15 2.1 y 2.2)
  H.closeSheet([]); await sleep(300);
  H.dm3Tab(['cuentas']); await sleep(20);
  const tabs = [...doc.querySelectorAll('.dm3-tab')];
  ok(tabs.length === 4 && tabs[0].classList.contains('on') && tabs[0].getAttribute('aria-selected') === 'true', '4 fichas que hacen de pestañas; Cuentas elegida');
  ok(/Lo que tienes/.test(doc.querySelector('.dm3-lqt').textContent) && doc.querySelector('.dm3-info[aria-label]'), '«Lo que tienes» en una fila, con «¿Cómo se calcula?»');
  ok(doc.querySelectorAll('.dm3-cta:not(.nueva)').length === 2 && doc.querySelector('.dm3-cta.nueva') && doc.querySelector('.dm3-reparto'), 'cuentas en mosaico, «Añadir cuenta» y la barra de reparto');
  ok(!doc.querySelector('.dm-formas'), 'en Cuentas no salen las metas');
  H.dmIr(['deudas']); await sleep(20);
  ok(doc.querySelectorAll('.dm3-tab')[3].classList.contains('on'), 'los atajos (dmIr) cambian de pestaña');
  S_ = A.S; S_.verAnterior = Object.assign(S_.verAnterior || {}, { dinero: 4 }); A.render(); await sleep(20);
  ok(!doc.querySelector('.dm3-tabs') && doc.querySelector('.dm-cam'), '«22 oct»: Dinero en una pantalla y metas en Camino, como estaba');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

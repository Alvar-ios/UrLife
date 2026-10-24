// 24/10 (docs/19 3.3): metas con su color y forma «de cristal», % dentro y nombre debajo. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ version: { dinero: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], ahorro: [{ id: 'h1', nombre: 'Viaje a Japón', objetivo: 3000, yaAhorrado: 900 }, { id: 'h2', nombre: 'Colchón', objetivo: 6000, yaAhorrado: 3000, color: 'ambar' }] }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, doc = e.doc;
  H.goTab(['dinero']); H.irDinero(['metas']); await sleep(20);
  const fms = [...doc.querySelectorAll('.dm-fm .fm.cristal')];
  ok(fms.length === 2, 'cada meta, su forma «de cristal»');
  ok(/--fcd:#9B7BFF/i.test(fms[0].getAttribute('style')) && /--fcd:#F5BE45/i.test(fms[1].getAttribute('style')), 'color por orden (violeta) o el elegido (ámbar)');
  ok(/30 %/.test(fms[0].querySelector('.fm-t').textContent) && /Viaje a Japón/.test(doc.querySelector('.dm-fm-n').textContent), 'dentro solo el %; el nombre debajo');
  H.metaEditar ? H.metaEditar(['h1']) : null; await sleep(10);
  const abrir = H.metaEditar || H.metaEdit; if (!doc.querySelector('.fm-colores')) { const k = Object.keys(H).find((x) => /^metaEd/.test(x)); if (k) H[k](['h1']); await sleep(10); }
  ok(doc.querySelectorAll('.fm-colores .fm-col').length === 5, 'al editar: «Su color» con 5 colores');
  H.metaColorElegir(['cielo']); await sleep(5);
  ok(doc.querySelector('.fm-col.on').getAttribute('aria-label') === 'Cielo', 'elegir otro color lo marca');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

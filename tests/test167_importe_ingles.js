// 12/11/2026 · Calidad (revisión 1.1.0): el importe escrito a mano con la app en inglés («1,500.50») y en español («1.500,50»).
// Lo que llega a la base tiene que ser la misma cantidad que la persona quería decir en su idioma. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
async function probar(idioma, casos) {
  const e = makeEnv({ idioma, cfg: { app: { categoriasGasto: [{ nombre: 'Ocio' }] }, meta: { onboarded: true } }, session: { user: { email: 'prueba@example.invalid', id: 'yo' } } });
  await sleep(250);
  const A = e.w.__APP__, H = A.H, doc = e.doc;
  const setv = (sel, v) => { const el = doc.querySelector(sel); el.value = v; el.dispatchEvent(new e.w.Event('input', { bubbles: true })); };
  let n = 0;
  for (const [txt, quiero] of casos) {
    const desc = 'd' + idioma + (++n);
    H.goTab(['movimientos']); await sleep(5); H.onFabAntiguo([]); await sleep(20);
    setv('#fImporte', txt); setv('#fDesc', desc); const c = doc.querySelector('#fCategoria'); if (c) c.value = 'Ocio';
    H.saveMov([]); await sleep(50);
    const m = Object.values(e.store.movimientos).find((x) => x.descripcion === desc);
    H.closeSheet([]); await sleep(260);
    const v = m ? m.importe : null;
    ok(v === quiero, '[' + idioma + '] «' + txt + '» → ' + (quiero === null ? 'no guarda' : quiero) + ' (guarda ' + v + ')');
  }
}
(async () => {
  await probar('en', [['1,500', 1500], ['1,500.50', 1500.5], ['12.50', 12.5], ['0.5', 0.5], ['1,234,567.89', 1234567.89], ['-3', -3], ['12,5', 12.5], ['1,2,3', null], ['€9.99', 9.99]]);
  await probar('es', [['1.500', 1500], ['1.500,50', 1500.5], ['12,50', 12.5], ['1,500', 1.5], ['0,5', 0.5], ['1.234.567,89', 1234567.89], ['9,99 €', 9.99]]);
  console.log(fails ? 'FAILED ' + fails : 'ALL OK');
  process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

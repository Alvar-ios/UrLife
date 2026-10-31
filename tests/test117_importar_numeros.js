// 31/10/2026 · Datos y Seguridad, riesgos 1 y 2 de docs/30: importes con miles («2.500» no es 2,50 €) y «Marcar todas» sin lo dudoso. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ cfg: { app: {}, meta: { onboarded: true } } }); await sleep(150);
  const A = e.w.__APP__, P = A.parseNum;
  const casos = [['2.500', 2500], ['-2.500', -2500], ['1.000.000', 1000000], ['1,234', 1234], ['-1.234,56', -1234.56], ['1,234.56', 1234.56], ['(45,00)', -45], ['0.123', 0.123], ['12,5', 12.5], ['12.50', 12.5], ['87,35', 87.35], ['1.5', 1.5], ['2500', 2500], ['1.234,5', 1234.5], ['−7,20 €', null]];
  casos.forEach(([t, v]) => { const r = P(t); if (v !== null) ok(r === v, '«' + t + '» → ' + v + ' (sale ' + r + ')'); });
  // el Excel propio de ejemplo: columna Importe
  const csv = fs.readFileSync(path.join(__dirname, 'fixtures', 'extractos', 'excel_propio_ejemplo.csv'), 'utf8');
  const filas = A.parseCSV(csv), cab = filas[0], i = cab.indexOf('Importe');
  const imps = filas.slice(1).filter((f) => f.length > i && f[i]).map((f) => P(f[i]));
  ok(imps.join('|') === '2500|1200|87.35|9|150', 'excel de ejemplo: 2.500 / 1.200 / 87,35 / 9 / 150 (sale ' + imps.join(' / ') + ')');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

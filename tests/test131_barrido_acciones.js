// Calidad · barrido 08/11/2026: cada botón de la app apunta a una acción que existe (si no, el botón no hace nada y no avisa).
// Revisa el código de app.js e index.html, sin datos.
const { makeEnv, sleep } = require('./harness.js');
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ cfg: { app: {}, meta: { onboarded: true } } });
  await sleep(60);
  const H = e.w.__APP__.H, src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8'), html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const usadas = new Set();
  for (const r of src.matchAll(/\b(?:act|onChange|onInput)\('([A-Za-z0-9_]+)'/g)) usadas.add(r[1]);
  for (const r of src.matchAll(/attr\('(?:click|change|input)', '([A-Za-z0-9_]+)'/g)) usadas.add(r[1]);
  for (const r of (src + html).matchAll(/data-(?:click|change|input)="([A-Za-z0-9_]+)/g)) usadas.add(r[1]);
  usadas.delete('nombre'); // sale en un comentario de ejemplo
  const faltan = [...usadas].filter((n) => typeof H[n] !== 'function');
  ok(usadas.size > 400, 'se han encontrado ' + usadas.size + ' acciones distintas en los botones');
  ok(!faltan.length, 'todas las acciones de los botones existen' + (faltan.length ? ' (faltan: ' + faltan.join(', ') + ')' : ''));
  // y lo mismo para las que se eligen con «cond ? 'a' : 'b'»
  const tern = new Set(); for (const r of src.matchAll(/\bact\(([^,'()]+(?:\([^()]*\))?[^,'()]*) \? '([A-Za-z0-9_]+)' : '([A-Za-z0-9_]+)'/g)) { tern.add(r[2]); tern.add(r[3]); }
  const faltanT = [...tern].filter((n) => typeof H[n] !== 'function');
  ok(tern.size >= 2 && !faltanT.length, '(' + tern.size + ') también las que dependen de una condición' + (faltanT.length ? ' (faltan: ' + faltanT.join(', ') + ')' : ''));
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

// Calidad (29/10): todos los logos del catálogo BANCOS existen, pesan poco y los SVG no llevan código ni enlaces de fuera.
require('./harness.js');
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const src = fs.readFileSync(path.join(raiz, 'app.js'), 'utf8');
const bloque = (src.match(/const BANCOS = \[([\s\S]*?)\]\.map/) || [])[1] || '';
const logos = [...bloque.matchAll(/'([\w.-]+\.(?:png|svg))'/g)].map((x) => x[1]);
ok(logos.length >= 25, 'el catálogo tiene al menos 25 logos (' + logos.length + ')');
let total = 0;
for (const l of logos) {
  const f = path.join(raiz, 'logos', l), hay = fs.existsSync(f);
  ok(hay, 'existe logos/' + l);
  if (!hay) continue;
  const peso = fs.statSync(f).size; total += peso;
  ok(peso < 30000, l + ' pesa menos de 30 KB (' + peso + ' bytes)');
  if (l.endsWith('.svg')) {
    const t = fs.readFileSync(f, 'utf8');
    ok(!/<script|\son\w+\s*=|href\s*=|<foreignObject|url\(\s*['"]?http/i.test(t), l + ': sin código ni enlaces de fuera');
  }
}
ok(total < 250000, 'todos los logos juntos pesan menos de 250 KB (' + total + ' bytes)');
process.exit(fails ? 1 : 0);

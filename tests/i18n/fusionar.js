// Junta fuente.txt (textos en español, uno por línea) con tr/*.txt («número de línea<TAB>inglés») → en.tsv
const fs = require('fs'), path = require('path');
const fuente = fs.readFileSync(path.join(__dirname, 'fuente.txt'), 'utf8').split('\n');
const out = [];
fs.readdirSync(path.join(__dirname, 'tr')).sort().forEach((f) => fs.readFileSync(path.join(__dirname, 'tr', f), 'utf8').split('\n').forEach((l) => {
  const m = /^(\d+)\t(.+)$/.exec(l); if (!m) return; const es = fuente[Number(m[1]) - 1]; if (es == null) return; out.push(es + '\t' + m[2]);
}));
fs.writeFileSync(path.join(__dirname, 'en.tsv'), '// Generado por fusionar.js desde fuente.txt y tr/*.txt (lo que se añade a mano va en en-extra.tsv)\n' + out.join('\n') + '\n');
console.log(out.length + ' frases');

// Ejecuta todas las pruebas (test*.js) una a una y resume. Uso: node run.js [filtro]
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const filtro = process.argv[2] || '';
const files = fs.readdirSync(__dirname).filter((f) => /^test.*\.js$/.test(f) && f.includes(filtro)).sort();
let malas = [];
for (const f of files) {
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { cwd: __dirname, encoding: 'utf8', timeout: 180000 });
  const out = (r.stdout || '') + (r.stderr || ''), ultima = out.trim().split('\n').pop();
  const bien = r.status === 0 && !/^FAIL /m.test(out); // 24/10: una comprobación que falla cuenta aunque la prueba termine «bien»
  console.log((bien ? 'OK   ' : 'FALLA') + ' ' + f + (bien ? '' : '\n' + out.split('\n').filter((l) => /^FAIL|Error/.test(l)).slice(0, 8).join('\n')));
  if (!bien) malas.push(f);
  void ultima;
}
console.log('\n' + (files.length - malas.length) + '/' + files.length + ' pruebas bien' + (malas.length ? ' · fallan: ' + malas.join(', ') : ''));
process.exit(malas.length ? 1 : 0);

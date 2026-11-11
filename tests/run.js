// Ejecuta todas las pruebas (test*.js) y resume. Uso: node run.js [filtro] [--j=N]
// --j=N las pasa de N en N (más rápido en máquinas con varios núcleos). Las que fallen en paralelo se repiten solas,
// de una en una, antes de darlas por malas (algunas dependen del reloj). Sin --j, una a una como siempre.
const { spawn } = require('child_process'), fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const jArg = args.find((a) => /^--j=\d+$/.test(a)), J = jArg ? Math.max(1, Number(jArg.slice(4))) : 1;
const filtro = args.find((a) => !a.startsWith('--')) || '';
const files = fs.readdirSync(__dirname).filter((f) => /^test.*\.js$/.test(f) && f.includes(filtro)).sort();
function una(f) {
  return new Promise((res) => {
    const p = spawn(process.execPath, [path.join(__dirname, f)], { cwd: __dirname });
    let out = ''; p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { out += d; });
    const t = setTimeout(() => { try { p.kill('SIGKILL'); } catch (e) { /* */ } }, 180000);
    p.on('close', (code) => { clearTimeout(t); res({ f, out, bien: code === 0 && !/^FAIL /m.test(out) }); }); // 24/10: una comprobación que falla cuenta aunque la prueba termine «bien»
  });
}
const resumen = (r) => (r.bien ? 'OK   ' : 'FALLA') + ' ' + r.f + (r.bien ? '' : '\n' + r.out.split('\n').filter((l) => /^FAIL|Error/.test(l)).slice(0, 8).join('\n'));
(async () => {
  const t0 = Date.now(); let malas = [];
  if (J === 1) { for (const f of files) { const r = await una(f); console.log(resumen(r)); if (!r.bien) malas.push(f); } }
  else {
    const cola = files.slice(), dudosas = [];
    await Promise.all(Array.from({ length: J }, async () => { while (cola.length) { const r = await una(cola.shift()); if (r.bien) console.log(resumen(r)); else dudosas.push(r.f); } }));
    for (const f of dudosas.sort()) { const r = await una(f); console.log(resumen(r) + (r.bien ? '   (bien al repetirla sola)' : '')); if (!r.bien) malas.push(f); }
  }
  console.log('\n' + (files.length - malas.length) + '/' + files.length + ' pruebas bien' + (malas.length ? ' · fallan: ' + malas.join(', ') : '') + ' · ' + Math.round((Date.now() - t0) / 1000) + ' s');
  process.exit(malas.length ? 1 : 0);
})();

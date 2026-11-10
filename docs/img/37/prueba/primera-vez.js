// PRUEBA de Producto (docs/37), NO es parte de la app ni de npm test. Para usarlo, copia los dos archivos a tests/capturas/ y ejecuta: node tests/capturas/primera-vez.js
// PRUEBA DE PRODUCTO (docs/37), no forma parte de npm test: capturas de la PRIMERA VEZ a 375 × 667 y 390 × 844, claro y oscuro.
// Uso: node tests/capturas/primera-vez.js [carpeta]. Datos inventados (datos-primera-vez.js).
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const RAIZ = path.join(__dirname, '..', '..'), SALIDA = path.resolve(process.argv[2] || path.join(__dirname, 'salida-primera-vez'));
const PASOS = {
  nuevo: [
    ['1-hola', ''], ['2-banco', 'A.H.obNext([])'], ['3-mes', 'A.H.obNext(["no"])'], ['4-listo', 'A.H.obNext(["no"])'],
    ['5-inicio', 'A.H.obFinish([""])'], ['5b-inicio-abajo', 'window.scrollTo(0, 2000)'],
    ['6-mas', 'window.scrollTo(0,0);A.openCrear()'], ['7-gasto', 'A.H.closeSheet([]);A.H.crearIr(["gasto"])'],
    ['8-movimientos', 'A.H.closeSheet([]);A.S.tab="movimientos";A.render()'], ['9-juntos', 'A.S.tab="juntos";A.render()'],
    ['10-dinero', 'A.S.tab="dinero";A.render()'], ['10b-dinero-abajo', 'window.scrollTo(0, 2000)'], ['11-agenda', 'window.scrollTo(0,0);A.S.tab="agenda";A.render()'], ['12-tu', 'A.S.tab="tu";A.render()'],
  ],
  invitado: [
    ['1-invitacion', ''], ['2-unido-banco', 'A.H.obUnirse([])'], ['3-listo', 'A.H.obNext(["no"])'],
    ['4-grupo', 'A.H.obFinish(["grupo"])'], ['5-inicio', 'A.H.closeSheet([]);A.S.tab="inicio";A.render()'], ['6-juntos', 'A.S.tab="juntos";A.render()'],
  ],
};
(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const b = await chromium.launch(); const errores = [];
  for (const [w, h] of [[375, 667], [390, 844]]) for (const tema of ['light', 'dark']) for (const esc of Object.keys(PASOS)) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: tema, deviceScaleFactor: 2 });
    await ctx.addInitScript((e) => { try { if (!sessionStorage.getItem('x')) { localStorage.clear(); localStorage.setItem('capEscenario', e); if (e === 'invitado') localStorage.setItem('unirse', 'TOKENDEPRUEBA1234567890'); sessionStorage.setItem('x', '1'); } } catch (_) {} }, esc);
    const p = await ctx.newPage(); p.on('pageerror', (e) => errores.push(esc + ': ' + e.message));
    await p.route('**/*', (r) => { const u = r.request().url();
      if (/data-layer\.js$/.test(u)) return r.fulfill({ path: path.join(__dirname, 'datos-primera-vez.js'), contentType: 'text/javascript' });
      if (/supabase|config\.js$|auth-signup\.js$|fonts\.g/.test(u)) return r.fulfill({ body: '', contentType: /css|fonts/.test(u) ? 'text/css' : 'text/javascript' });
      return r.continue(); });
    await p.goto('file://' + path.join(RAIZ, 'index.html'));
    await p.waitForFunction(() => window.__APP__ && document.querySelector('#app').textContent.length > 30, null, { timeout: 15000 });
    await p.waitForTimeout(900);
    for (const [id, js] of PASOS[esc]) {
      if (js) { try { await p.evaluate((code) => { const A = window.__APP__, C = window.__CAPTURAS__; eval(code); }, js); } catch (e) { errores.push(esc + ' ' + id + ': ' + e.message); } }
      await p.waitForTimeout(900);
      const alto = await p.evaluate(() => document.documentElement.scrollHeight);
      const f = esc + '-' + id + '-' + w + 'x' + h + '-' + (tema === 'dark' ? 'oscuro' : 'claro') + '.png';
      await p.screenshot({ path: path.join(SALIDA, f) });
      console.log(f, 'alto de página', alto);
    }
    await ctx.close();
  }
  await b.close();
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
})().catch((e) => { console.error(e); process.exit(1); });

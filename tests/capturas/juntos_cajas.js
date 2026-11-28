// 28/11/2026 · fase30/juntos-cajas. Capturas de la primera pantalla de Juntos (datos inventados, no va en `npm test`).
//  - ninguna fila de la Lista (con o sin deslizar, compartida o no) tiene esquinas redondeadas propias ni otro fondo que sus vecinas
//  - todas las filas de un día miden lo mismo de ancho y quedan pegadas con la línea fina
// Uso: node tests/capturas/tarjetas_mov.js [--oscuro] [--capturas=/tmp/carpeta] [--vp=390x844,360x740]
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const ARG = {}; process.argv.slice(2).forEach((a) => { const m = /^--([a-z0-9-]+)(?:=(.*))?$/.exec(a); if (m) ARG[m[1]] = m[2] === undefined ? true : m[2]; });
const RAIZ = path.join(__dirname, '..', '..'), URL_APP = 'file://' + path.join(RAIZ, 'index.html');
const DATOS = fs.readFileSync(path.join(__dirname, 'datos-falsos.js'), 'utf8') + `;(function(){var D=window.Data;D.recargar=D.recargar||function(){};D.carburantes=D.carburantes||{ultimos:async function(){return null}};})();`;
const VPS = String(ARG.vp || '390x844,360x740').split(',').map((s) => s.split('x').map(Number));
let malos = 0; const mal = (m) => { malos++; console.log('  MAL ' + m); };
(async () => {
  const browser = await chromium.launch();
  for (const vp of VPS) {
    const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, colorScheme: ARG.oscuro ? 'dark' : 'light', locale: 'es-ES' });
    await ctx.addInitScript('try{localStorage.clear()}catch(e){}');
    const p = await ctx.newPage();
    await p.route('**/*', (r) => { const u = r.request().url();
      if (/data-layer\.js$/.test(u)) return r.fulfill({ body: DATOS, contentType: 'text/javascript' });
      if (/supabase|config\.js$|auth-signup\.js$|captcha\.js$|fonts\.g/.test(u)) return r.fulfill({ body: '', contentType: /css|fonts/.test(u) ? 'text/css' : 'text/javascript' });
      if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue(); return r.abort(); });
    await p.goto(URL_APP);
    await p.waitForFunction(() => window.__APP__ && window.__APP__.S && window.__APP__.S.config && document.querySelector('#app').textContent.length > 50, null, { timeout: 15000 });
    await p.waitForTimeout(500);
    await p.evaluate(() => { const A = window.__APP__; A.S.tab = "juntos"; A.S.juntosVer = ""; A.render(); });
    await p.waitForTimeout(900);
    const V = vp.join('x');
    if (ARG.capturas) { fs.mkdirSync(ARG.capturas, { recursive: true }); await p.screenshot({ path: path.join(ARG.capturas, 'juntos-' + V + (ARG.oscuro ? '-oscuro' : '-claro') + '.png') }); }
  }
  await browser.close();
  console.log(malos ? malos + ' avisos' : 'Todo bien');
  process.exit(malos ? 1 : 0);
})();

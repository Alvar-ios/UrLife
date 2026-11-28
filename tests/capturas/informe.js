// 28/11/2026 · informe nuevo (docs/53 D) en Chromium: capturas a 390 y 360 px, claro y oscuro, y avisa de cosas que se salen de la pantalla o se cortan.
// Uso: node tests/capturas/informe.js [--capturas=/tmp/carpeta]. Datos inventados (datos-falsos.js); no toca Supabase. No va en `npm test`.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const ARG = {}; process.argv.slice(2).forEach((a) => { const m = /^--([a-z0-9-]+)(?:=(.*))?$/.exec(a); if (m) ARG[m[1]] = m[2] === undefined ? true : m[2]; });
const RAIZ = path.join(__dirname, '..', '..'), URL_APP = 'file://' + path.join(RAIZ, 'index.html');
const DATOS = fs.readFileSync(path.join(__dirname, 'datos-falsos.js'), 'utf8') + `;(function(){var D=window.Data;D.recargar=D.recargar||function(){};D.carburantes=D.carburantes||{ultimos:async function(){return[];}};})();`;
const OUT = ARG.capturas || '/tmp/informe-caps';
(async () => {
  const browser = await chromium.launch(); let malos = 0; fs.mkdirSync(OUT, { recursive: true });
  for (const oscuro of [false, true]) for (const vp of [[390, 844], [360, 740]]) {
    const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, colorScheme: oscuro ? 'dark' : 'light', locale: 'es-ES' });
    await ctx.addInitScript('try{localStorage.clear()}catch(e){}');
    const p = await ctx.newPage(); const err = []; p.on('pageerror', (e) => err.push(e.message));
    await p.route('**/*', (r) => { const u = r.request().url();
      if (/data-layer\.js$/.test(u)) return r.fulfill({ body: DATOS, contentType: 'text/javascript' });
      if (/supabase|config\.js$|auth-signup\.js$|captcha\.js$|fonts\.g/.test(u)) return r.fulfill({ body: '', contentType: /css|fonts/.test(u) ? 'text/css' : 'text/javascript' });
      if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue(); return r.abort(); });
    await p.goto(URL_APP);
    await p.waitForFunction(() => window.__APP__ && window.__APP__.S && window.__APP__.S.config && document.querySelector('#app').textContent.length > 50, null, { timeout: 15000 });
    await p.waitForTimeout(500);
    await p.evaluate(() => { const A = window.__APP__, S = A.S, mk = (p, mm, ing, g) => { const l = [{ id: p + 'i', tipo: 'Ingreso', categoria: 'Nómina', importe: ing, fecha: '2026-' + mm + '-01' }]; for (let i = 0; i < 12; i++) l.push({ id: p + i, tipo: 'Gasto', categoria: ['Supermercado', 'Ocio', 'Restaurantes'][i % 3], importe: g / 12, fecha: '2026-' + mm + '-' + String(5 + i).padStart(2, '0') }); return l; };
      S.movimientos = S.movimientos.concat(mk('zf', '09', 2000, 900), mk('zt', '08', 1000, 1400)); A.render(); });
    let clave = '';
    const pasos = [['cara-feliz', 'A.H.infVer(["m:2026-09"])'], ['cara-triste', 'A.H.infVer(["m:2026-08"])'], ['informe', 'A.H.infAbrir([])'], ['hoja-gastaste', 'A.H.infHoja(["@","gas"])'], ['hoja-entro', 'A.H.infHoja(["@","ing"])'], ['hoja-apartaste', 'A.H.infHoja(["@","aho"])'], ['hoja-balance', 'A.H.infHoja(["@","bal"])']];
    for (const [id, js] of pasos) {
      const tag = id + '-' + vp[0] + (oscuro ? '-oscuro' : '-claro');
      await p.evaluate((code) => { const A = window.__APP__; eval(code); }, js.replace('@', clave));
      if (id === 'informe') { await p.waitForTimeout(500); clave = await p.evaluate(() => { const m = document.querySelector('#sheetHost [data-click^="infHoja"]'); return m ? decodeURIComponent(m.getAttribute('data-click').split('|')[1]) : ''; }); }
      await p.waitForTimeout(600);
      const info = await p.evaluate(() => { const sh = document.querySelector('#sheetHost .sheet') || document.querySelector('#sheetHost'); const W = document.documentElement.clientWidth, malos = [];
        sh.querySelectorAll('*').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width && (r.right > W + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed') malos.push((e.className && e.className.baseVal === undefined ? e.className : e.tagName) + ' ' + Math.round(r.left) + '-' + Math.round(r.right)); });
        const cortes = [...sh.querySelectorAll('button,b,span,p,small')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible' && getComputedStyle(e).textOverflow !== 'ellipsis').map((e) => e.className + ':' + e.textContent.slice(0, 30));
        return { malos: malos.slice(0, 5), cortes: cortes.slice(0, 5), sh: sh.scrollWidth > sh.clientWidth + 1 }; });
      if (info.malos.length || info.cortes.length || info.sh) { malos++; console.log('  MAL ' + tag + ' ' + JSON.stringify(info)); }
      await p.screenshot({ path: path.join(OUT, tag + '.png') });
      if (id === 'informe') { await p.evaluate(() => { const s = document.querySelector('#sheetHost .sheet'); if (s) s.scrollTop = 9999; }); await p.waitForTimeout(200); await p.screenshot({ path: path.join(OUT, tag + '-abajo.png') }); await p.evaluate(() => { const s = document.querySelector('#sheetHost .sheet'); if (s) s.scrollTop = 0; }); }
    }
    if (err.length) { malos++; console.log('  ERRORES JS', err.slice(0, 3)); }
    await ctx.close();
  }
  await browser.close(); console.log(malos ? malos + ' avisos' : 'Sin avisos'); process.exit(malos ? 1 : 0);
})();

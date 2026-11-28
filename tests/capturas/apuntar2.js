// 28/11/2026 · tanda 10 de docs/53 (fase25/apuntar): capturas del + (con «Apuntes rápidos»), gasto compartido, traspaso, ingreso y demás apuntes.
// Uso: node tests/capturas/apuntar2.js [--vp=390x844] [--oscuro] [--capturas=/tmp/carpeta] [--solo=id1,id2]. Datos inventados; no toca Supabase. No va en `npm test`.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const ARG = {}; process.argv.slice(2).forEach((a) => { const m = /^--([a-z0-9-]+)(?:=(.*))?$/.exec(a); if (m) ARG[m[1]] = m[2] === undefined ? true : m[2]; });
const RAIZ = path.join(__dirname, '..', '..'), URL_APP = 'file://' + path.join(RAIZ, 'index.html');
const DATOS = fs.readFileSync(path.join(__dirname, 'datos-falsos.js'), 'utf8') + `;(function(){var D=window.Data;D.recargar=D.recargar||function(){};D.carburantes=D.carburantes||{ultimos:async function(){return[];}};})()`;
const VPS = String(ARG.vp || '390x844,360x740').split(',').map((s) => s.split('x').map(Number));
const PANT = [
  ['mas-cerrado', 'A.openCrear()'],
  ['mas-abierto', 'A.openCrear();setTimeout(()=>A.H.crearApuntesToggle([]),100)'],
  ['gasto', 'A.H.crearIr(["gasto"])'],
  ['gasto-comp', 'A.H.crearIr(["gasto"]);setTimeout(()=>A.H.compOn([]),500)'],
  ['compartido', 'A.H.crearIr(["compartido"])'],
  ['ingreso', 'A.H.crearIr(["ingreso"])'],
  ['traspaso', 'A.H.crearIr(["traspaso"])'],
  ['apartar', 'A.H.crearIr(["ahorro"])'],
  ['invertir', 'A.H.crearIr(["inversion"])'],
  ['pago-fijo', 'A.H.crearIr(["factura"])'],
  ['pago-deuda', 'A.H.crearIr(["deuda"])'],
  ['fijo-nuevo', 'A.H.goTab(["tu"]);A.H.recNuevo([])'],
];
(async () => {
  const browser = await chromium.launch();
  for (const vp of VPS) {
    const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, colorScheme: ARG.oscuro ? 'dark' : 'light', locale: 'es-ES' });
    await ctx.addInitScript('try{localStorage.clear()}catch(e){}');
    const p = await ctx.newPage(); const err = [];
    p.on('pageerror', (e) => err.push(e.message));
    await p.route('**/*', (r) => { const u = r.request().url();
      if (/data-layer\.js$/.test(u)) return r.fulfill({ body: DATOS, contentType: 'text/javascript' });
      if (/supabase|config\.js$|auth-signup\.js$|captcha\.js$|fonts\.g/.test(u)) return r.fulfill({ body: '', contentType: /css|fonts/.test(u) ? 'text/css' : 'text/javascript' });
      if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue(); return r.abort(); });
    await p.goto(URL_APP);
    await p.waitForFunction(() => window.__APP__ && window.__APP__.S && window.__APP__.S.config && document.querySelector('#app').textContent.length > 50, null, { timeout: 15000 });
    await p.waitForTimeout(500);
    for (const [id, js] of PANT) {
      if (ARG.solo && String(ARG.solo).split(',').indexOf(id) < 0) continue;
      await p.evaluate(() => { try { window.__APP__.H.closeSheet([]); } catch (e) {} }); await p.waitForTimeout(300);
      await p.evaluate((code) => { const A = window.__APP__, C = window.__CAPTURAS__; window.scrollTo(0, 0); eval(code); }, js); await p.waitForTimeout(900);
      const info = await p.evaluate(() => { const s = document.querySelector('#sheetHost .sheet'); const m = document.querySelector('#sheetHost'); return { h: s ? s.scrollHeight : 0, ch: s ? s.clientHeight : 0, ancho: s ? s.scrollWidth - s.clientWidth : 0, tit: ((s || m || {}).textContent || '').slice(0, 60) }; });
      console.log(vp.join('x') + ' ' + id + ': alto ' + info.h + '/' + info.ch + (info.ancho > 0 ? ' · SE SALE A LO ANCHO ' + info.ancho : ''));
      if (ARG.capturas) { fs.mkdirSync(ARG.capturas, { recursive: true }); await p.screenshot({ path: path.join(ARG.capturas, id + '-' + vp[0] + (ARG.oscuro ? '-oscuro' : '-claro') + '.png') }); }
    }
    if (err.length) console.log('ERRORES: ' + err.join(' | '));
    await ctx.close();
  }
  await browser.close();
})();

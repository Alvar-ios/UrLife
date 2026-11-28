// 28/11/2026 · Editar Inicio en la propia pantalla (fase25/editar-inicio): toques de verdad en Chromium (CDP), no va en npm test.
// Uso: node tests/capturas/editar_inicio.js [--vp=390x844,360x740] [--oscuro] [--capturas=/tmp/carpeta]
// Comprueba: pulsación larga entra; arrastrar desde el asa y desde el cuerpo (tras mantener) cambia el orden sin mover la pantalla;
// un gesto de desplazar NO reordena; arrastrar cerca del borde desplaza la pantalla; nada se sale a los lados.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const ARG = {}; process.argv.slice(2).forEach((a) => { const m = /^--([a-z0-9-]+)(?:=(.*))?$/.exec(a); if (m) ARG[m[1]] = m[2] === undefined ? true : m[2]; });
const RAIZ = path.join(__dirname, '..', '..'), URL_APP = 'file://' + path.join(RAIZ, 'index.html');
const DATOS = fs.readFileSync(path.join(__dirname, 'datos-falsos.js'), 'utf8') + `;(function(){var D=window.Data;D.recargar=D.recargar||function(){};D.carburantes=D.carburantes||{ultimos:async function(){return[];}};})();`;
const VPS = String(ARG.vp || '390x844,360x740').split(',').map((s) => s.split('x').map(Number));
const ORD = ['asivas', 'gastos', 'ultimos', 'meses', 'calgastos'];
(async () => {
  const browser = await chromium.launch(); let malos = 0;
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
    const mal = (m) => { malos++; console.log('  MAL ' + vp.join('x') + ': ' + m); };
    const bien = (m) => console.log('  ok  ' + vp.join('x') + ': ' + m);
    const cdp = await ctx.newCDPSession(p);
    const toque = async (tipo, x, y) => cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: tipo === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    const orden = () => p.evaluate(() => (window.__APP__.S.config.inicioWidgets || []).map((x) => x.t).join(','));
    const centro = (sel, k, dx) => p.evaluate(([sel, k, dx]) => { const e = document.querySelectorAll(sel)[k]; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.left + (dx != null ? dx : r.width / 2), r.top + r.height / 2]; }, [sel, k, dx]);
    const arrastrar = async (x, y, x2, y2, espera) => { await toque('touchStart', x, y); await p.waitForTimeout(espera || 60); const n = 14; for (let s = 1; s <= n; s++) { await toque('touchMove', x + (x2 - x) * s / n, y + (y2 - y) * s / n); await p.waitForTimeout(25); } await p.waitForTimeout(80); await toque('touchEnd'); await p.waitForTimeout(250); };
    // piezas de prueba (datos inventados) y «Editar Inicio» como se entra de verdad
    await p.evaluate((o) => { const A = window.__APP__; A.S.config = Object.assign({}, A.S.config, { inicioWidgets: o.map((t) => ({ t })) }); A.S.tab = 'inicio'; A.render(); }, ORD);
    await p.waitForTimeout(500);
    const pz = await p.evaluate(() => { const e = document.querySelector('#content .iw'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + 24]; });
    if (!pz) { mal('no hay ninguna pieza en Inicio'); continue; }
    await toque('touchStart', pz[0], pz[1]); await p.waitForTimeout(800); await toque('touchEnd'); await p.waitForTimeout(400);
    (await p.evaluate(() => window.__APP__.S.inicioEd)) ? bien('mantener pulsada una pieza entra en el modo editar') : mal('mantener pulsada no entra en el modo editar');
    const n = await p.evaluate(() => document.querySelectorAll('#content .iw-e').length); n >= 3 ? bien(n + ' cajas') : mal('faltan cajas (' + n + ')');
    const ancho = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); ancho <= 1 ? bien('nada se sale a los lados') : mal('se sale ' + ancho + ' px');
    if (ARG.capturas) { fs.mkdirSync(ARG.capturas, { recursive: true }); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200); await p.screenshot({ path: path.join(ARG.capturas, 'editar-' + vp[0] + (ARG.oscuro ? '-oscuro' : '') + '.png') }); }
    // 1) desde el asa, de la primera hacia abajo (hasta cerca del borde)
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200);
    let a0 = await orden(); let g = await p.evaluate(() => { const r = document.querySelector('#content .iw-e .iw-e-grip').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await arrastrar(g[0], g[1], g[0], vp[1] - 50, 60);
    let a1 = await orden(); a1.split(',')[0] !== a0.split(',')[0] ? bien('desde el asa: ' + a0 + ' → ' + a1) : mal('desde el asa no cambió el orden (' + a1 + ')');
    // 2) desde el cuerpo de la caja, manteniendo, hacia arriba (hasta cerca del borde)
    await p.evaluate(() => { const e = document.querySelectorAll('#content .iw-e')[2]; window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 160); }); await p.waitForTimeout(250);
    const c = await p.evaluate(() => { const r = document.querySelectorAll('#content .iw-e')[2].getBoundingClientRect(); return [r.left + 120, r.top + 70]; }); a0 = await orden();
    await toque('touchStart', c[0], c[1]); await p.waitForTimeout(520); for (let s = 1; s <= 8; s++) { await toque('touchMove', c[0], c[1] + (30 - c[1]) * s / 8); await p.waitForTimeout(25); } await p.waitForTimeout(700); await toque('touchEnd'); await p.waitForTimeout(300);
    a1 = await orden(); a1 !== a0 ? bien('desde el cuerpo, tras mantener: ' + a0 + ' → ' + a1) : mal('desde el cuerpo no cambió el orden');
    // 3) desplazar la pantalla (sin mantener) no reordena
    a0 = await orden(); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150);
    await arrastrar(vp[0] / 2, vp[1] - 160, vp[0] / 2, 200, 10); a1 = await orden(); const sy = await p.evaluate(() => window.scrollY);
    a1 === a0 && sy > 20 ? bien('un gesto de desplazar mueve la pantalla (' + Math.round(sy) + ' px) y no reordena') : mal('desplazar: orden ' + a1 + ', scroll ' + sy);
    // 4) arrastrar cerca del borde de abajo desplaza la pantalla
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150); g = await centro('#content .iw-e .iw-e-grip', 0); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(100); g = await p.evaluate(() => { const r = document.querySelector('#content .iw-e .iw-e-grip').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    if (g[1] > 0 && g[1] < vp[1]) { await toque('touchStart', g[0], g[1]); await p.waitForTimeout(60); for (let s = 1; s <= 8; s++) { await toque('touchMove', g[0], g[1] + (vp[1] - 40 - g[1]) * s / 8); await p.waitForTimeout(25); } await p.waitForTimeout(900); const sa = await p.evaluate(() => window.scrollY); await toque('touchEnd'); await p.waitForTimeout(300); sa > 40 ? bien('al arrastrar cerca del borde la pantalla se desplaza (' + Math.round(sa) + ' px)') : mal('no hay autodesplazamiento (' + sa + ')'); }
    // 5) «Listo» y catálogo
    await p.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); }); await p.waitForTimeout(250);
    if (ARG.capturas) await p.screenshot({ path: path.join(ARG.capturas, 'editar-final-' + vp[0] + (ARG.oscuro ? '-oscuro' : '') + '.png') });
    await p.evaluate(() => window.__APP__.H.iwAnadirIn([])); await p.waitForTimeout(900);
    if (ARG.capturas) await p.screenshot({ path: path.join(ARG.capturas, 'catalogo-' + vp[0] + (ARG.oscuro ? '-oscuro' : '') + '.png') });
    const cats = await p.evaluate(() => document.querySelectorAll('#sheetHost .iw-cat-t').length); cats > 3 ? bien('el catálogo enseña ' + cats + ' piezas') : mal('catálogo vacío');
    if (err.length) mal('errores de página: ' + err.slice(0, 2).join(' | '));
    await ctx.close();
  }
  await browser.close(); console.log(malos ? 'FALLOS ' + malos : 'TODO OK'); process.exit(malos ? 1 : 0);
})();

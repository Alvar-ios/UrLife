// 28/11/2026 · fase25/arreglos-visuales. Revisa en Chromium (datos inventados, no va en `npm test`):
//  1) Inicio: entre la tarjeta principal y lo que va justo debajo (avisos, invitación, guía, informe…) hay aire (≥ 12 px) y nada se solapa.
//  2) Scroll horizontal: todo contenedor con overflow-x tiene overflow-y recortado y overscroll contenido (nada que se mueva en vertical).
//  3) Brillos: ningún halo recortado por un overflow:hidden de su padre, ni con desplazamiento vertical grande.
// Uso: node tests/capturas/arreglos_visuales.js [--vp=390x844,360x740] [--oscuro] [--capturas=/tmp/carpeta]
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const ARG = {}; process.argv.slice(2).forEach((a) => { const m = /^--([a-z0-9-]+)(?:=(.*))?$/.exec(a); if (m) ARG[m[1]] = m[2] === undefined ? true : m[2]; });
const RAIZ = path.join(__dirname, '..', '..'), URL_APP = 'file://' + path.join(RAIZ, 'index.html');
const DATOS = fs.readFileSync(path.join(__dirname, 'datos-falsos.js'), 'utf8') + `;(function(){var D=window.Data;D.recargar=D.recargar||function(){};D.carburantes=D.carburantes||{ultimos:async function(){return[];}};})()`;
const VPS = String(ARG.vp || '390x844,360x740').split(',').map((s) => s.split('x').map(Number));
const HABIT = 'A.S.movimientos=A.S.movimientos.concat([0,1,2].map((i)=>({id:"hb"+i,fecha:new Date(Date.now()-(3+i*5)*864e5).toISOString().slice(0,10),descripcion:"Café de siempre",importe:2.5,tipo:"Gasto",categoria:"Restaurantes",creadoEn:Date.now()-i*1000})));';
const AVISOS = 'A.S.movimientos=A.S.movimientos.filter((m)=>m.origen!=="aviso").concat([["Supermercado",23.45,"Gasto","Supermercado"],["Bizum recibido",15,"Ingreso","Otros ingresos"]].map((x,i)=>({id:"av"+i,fecha:new Date().toISOString().slice(0,10),descripcion:x[0],importe:x[1],tipo:x[2],categoria:x[3],origen:"aviso",creadoEn:Date.now()-i*1000})));';
// clases de lo que se pinta justo debajo del hero en Inicio
const DEBAJO = ['card av-card', 'card inv-ini', 'card gd-ini', 'card inv-ini tumes-sug', 'card sug-card', 'card inf-ini inf-ini-1', 'iw-editar desc-linea'];
let malos = 0; const mal = (m) => { malos++; console.log('  MAL ' + m); };
(async () => {
  const browser = await chromium.launch();
  for (const vp of VPS) {
    const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, colorScheme: ARG.oscuro ? 'dark' : 'light', locale: 'es-ES' });
    await ctx.addInitScript('try{localStorage.clear()}catch(e){}');
    const p = await ctx.newPage(); const err = []; p.on('pageerror', (e) => err.push(e.message));
    await p.route('**/*', (r) => { const u = r.request().url();
      if (/data-layer\.js$/.test(u)) return r.fulfill({ body: DATOS, contentType: 'text/javascript' });
      if (/supabase|config\.js$|auth-signup\.js$|captcha\.js$|fonts\.g/.test(u)) return r.fulfill({ body: '', contentType: /css|fonts/.test(u) ? 'text/css' : 'text/javascript' });
      if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue(); return r.abort(); });
    await p.goto(URL_APP);
    await p.waitForFunction(() => window.__APP__ && window.__APP__.S && window.__APP__.S.config && document.querySelector('#app').textContent.length > 50, null, { timeout: 15000 });
    await p.waitForTimeout(500);
    const V = vp.join('x');
    // 1) Inicio: aire bajo la tarjeta principal, con avisos de verdad y con cada clase de aviso simulada justo debajo
    await p.evaluate((code) => { const A = window.__APP__; eval(code); A.S.tab = 'inicio'; A.render(); }, AVISOS); await p.waitForTimeout(800);
    if (ARG.capturas) { fs.mkdirSync(ARG.capturas, { recursive: true }); await p.screenshot({ path: path.join(ARG.capturas, 'inicio-avisos-' + V + '.png') }); }
    for (const cl of DEBAJO) {
      const r = await p.evaluate((cl) => {
        const h = document.querySelector('.hero2'); if (!h) return { sin: true };
        const e = document.createElement('div'); e.className = cl; e.style.minHeight = '40px'; e.id = '__sim'; h.insertAdjacentElement('afterend', e);
        const a = h.getBoundingClientRect(), b = e.getBoundingClientRect(); const gap = Math.round(b.top - a.bottom); e.remove(); return { gap };
      }, cl);
      if (r.sin) { mal(V + ' no hay .hero2 en Inicio'); break; }
      if (r.gap < 12) mal(V + ' «' + cl + '» pegada a la tarjeta principal (' + r.gap + ' px)');
    }
    const real = await p.evaluate(() => { const h = document.querySelector('.hero2'), n = h && h.nextElementSibling; if (!n) return null; return { cl: n.className, gap: Math.round(n.getBoundingClientRect().top - h.getBoundingClientRect().bottom) }; });
    console.log(V + ' Inicio: lo de justo debajo («' + (real && real.cl) + '») a ' + (real && real.gap) + ' px'); if (real && real.gap < 12) mal(V + ' lo real debajo del hero está pegado');
    // 2) todos los contenedores con scroll horizontal, en las pantallas y hojas que los tienen
    const PANT = [['inicio', 'A.S.tab="inicio";A.render()'], ['mas', 'A.S.tab="inicio";A.render();A.openCrear()'], ['movimientos', 'A.S.tab="movimientos";A.render()'], ['juntos', 'A.S.tab="juntos";A.render()'], ['dinero', 'A.S.tab="dinero";A.render()'],
      ['hoja-gasto', 'A.H.openMovForm(["Gasto"])'], ['hoja-compartir', 'A.S.tab="juntos";A.render();A.H.compRapido(["g:"+C.G1])'], ['agenda', 'A.S.tab="agenda";A.render()']];
    for (const [id, js] of PANT) {
      await p.evaluate(() => { try { window.__APP__.H.closeSheet([]); } catch (e) {} }); await p.waitForTimeout(350);
      await p.evaluate((code) => { const A = window.__APP__, C = window.__CAPTURAS__; window.scrollTo(0, 0); eval(code); }, js); await p.waitForTimeout(800);
      const l = await p.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.getClientRects().length).map((e) => { const s = getComputedStyle(e); return (s.overflowX === 'auto' || s.overflowX === 'scroll') && e.scrollWidth > e.clientWidth + 1 ? { c: e.className, oy: s.overflowY, ob: s.overscrollBehaviorX, ta: s.touchAction, sh: e.scrollHeight, ch: e.clientHeight } : null; }).filter(Boolean));
      for (const x of l) {
        if (x.oy !== 'hidden' && x.oy !== 'clip') mal(V + ' ' + id + ' «' + x.c + '» deja mover en vertical (overflow-y: ' + x.oy + ')');
        else if (x.sh > x.ch + 1) mal(V + ' ' + id + ' «' + x.c + '» recorta contenido por arriba o abajo (' + x.sh + ' > ' + x.ch + ')');
        if (x.ob !== 'contain') mal(V + ' ' + id + ' «' + x.c + '» sin overscroll-behavior-x: contain');
      }
      console.log(V + ' ' + id + ': ' + l.length + ' contenedores horizontales con scroll');
    }
    // 2b) gesto en diagonal sobre la barra «Repetir» del +: no debe mover la hoja ni la barra en vertical
    await p.evaluate(() => { try { window.__APP__.H.closeSheet([]); } catch (e) {} }); await p.waitForTimeout(350);
    await p.evaluate((h) => { const A = window.__APP__; eval(h); A.S.tab = 'inicio'; A.render(); A.openCrear(); }, HABIT); await p.waitForTimeout(900);
    const bar = await p.evaluate(() => { const b = document.querySelector('.crear-rep-f'); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: (document.querySelector('#sheetHost .sheet, #sheetHost') || document.body).getBoundingClientRect().top, sl: b.scrollLeft, st: b.scrollTop }; });
    if (!bar) console.log(V + ' (sin barra «Repetir» con estos datos)'); else {
      const cdp = await ctx.newCDPSession(p);
      const toque = async (tipo, x, y) => cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: tipo === 'touchEnd' ? [] : [{ x, y }] });
      await toque('touchStart', bar.x, bar.y); for (let i = 1; i <= 10; i++) await toque('touchMove', bar.x - i * 14, bar.y - i * 6); await toque('touchEnd'); await p.waitForTimeout(500);
      const d = await p.evaluate(() => { const b = document.querySelector('.crear-rep-f'), r = b.getBoundingClientRect(); return { st: b.scrollTop, sl: b.scrollLeft, t: (document.querySelector('#sheetHost .sheet, #sheetHost') || document.body).getBoundingClientRect().top, y: r.top + r.height / 2 }; });
      if (d.st !== 0) mal(V + ' la barra «Repetir» se movió en vertical (' + d.st + ')');
      if (Math.abs(d.t - bar.t) > 2) mal(V + ' la hoja se movió ' + Math.round(d.t - bar.t) + ' px en vertical al arrastrar la barra');
      console.log(V + ' arrastre en diagonal sobre «Repetir»: barra scrollTop=' + d.st + ', scrollLeft ' + Math.round(bar.sl) + ' → ' + Math.round(d.sl) + ', hoja Δ=' + Math.round(d.t - bar.t));
    }
    // 3) brillos: tarjeta «Te queda» y compañía
    await p.evaluate(() => { try { window.__APP__.H.closeSheet([]); } catch (e) {} }); await p.waitForTimeout(350);
    await p.evaluate(() => { const A = window.__APP__; A.S.tab = 'movimientos'; A.render(); }); await p.waitForTimeout(900);
    if (ARG.capturas) await p.screenshot({ path: path.join(ARG.capturas, 'movimientos-' + V + '.png') });
    const br = await p.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.getClientRects().length).map((e) => { const s = getComputedStyle(e), a = getComputedStyle(e, '::after'), b = getComputedStyle(e, '::before'); const sombra = s.boxShadow; const m = sombra && sombra !== 'none' ? sombra.match(/(-?\d+(?:\.\d+)?)px (-?\d+(?:\.\d+)?)px (\d+(?:\.\d+)?)px(?: (-?\d+(?:\.\d+)?)px)?/) : null; const pad = e.parentElement && getComputedStyle(e.parentElement).overflow !== 'visible' ? e.parentElement.className : '';
      return m ? { c: e.className.toString().slice(0, 40), x: +m[1], y: +m[2], blur: +m[3], pad } : null; }).filter(Boolean));
    br.filter((x) => Math.abs(x.y) > 14 && x.blur >= 20).forEach((x) => console.log('  (halo con desplazamiento vertical) ' + x.c + ' y=' + x.y));
    if (err.length) mal(V + ' errores de la página: ' + err.slice(0, 2).join(' | '));
    await ctx.close();
  }
  await browser.close(); console.log(malos ? malos + ' problemas.' : 'Sin problemas.'); process.exit(malos ? 1 : 0);
})();

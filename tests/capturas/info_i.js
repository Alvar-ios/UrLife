// 26/11/2026 · Calidad: revisa en Chromium, con toques de verdad, las «i» de más información (fase24/info-icono).
// Uso: node tests/capturas/info_i.js [--vp=390x844,360x740] [--oscuro] [--capturas=/tmp/carpeta] (guarda una captura por pantalla con las «i» cerradas). Datos inventados; no toca Supabase. No va en `npm test`.
// Por cada pantalla con «i»: zona táctil >= 44 px, nada encima que robe el toque, tocarla no abre hojas ni cambia el foco,
// el texto cabe en pantalla, la barra de botones fija sigue a la vista y se cierra con otro toque. Y: repintar con la «i» abierta no duplica ids.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const ARG = {}; process.argv.slice(2).forEach((a) => { const m = /^--([a-z0-9-]+)(?:=(.*))?$/.exec(a); if (m) ARG[m[1]] = m[2] === undefined ? true : m[2]; });
const RAIZ = path.join(__dirname, '..', '..'), URL_APP = 'file://' + path.join(RAIZ, 'index.html');
const DATOS = fs.readFileSync(path.join(__dirname, 'datos-falsos.js'), 'utf8') + `;(function(){var D=window.Data;D.recargar=D.recargar||function(){};D.carburantes=D.carburantes||{ultimos:async function(){return[];}};})();`;
const VPS = String(ARG.vp || '390x844,360x740').split(',').map((s) => s.split('x').map(Number));
const PANT = [
  ['tu-herramientas', 'A.H.goTab(["tu"]);A.H.tuIr(["herramientas"])'],
  ['tu-perfil', 'A.H.goTab(["tu"]);A.H.tuIr(["perfil"])'],
  ['hoja-asi-vas', 'A.H.goTab(["inicio"]);A.H.asiVasAbrir(["0"])'],
  ['hoja-cuenta-editar', 'A.H.goTab(["dinero"]);A.H.cuentaEditar(["0"])'],
  ['hoja-cuentas', 'A.H.goTab(["dinero"]);A.H.openCuentas([])'],
  ['hoja-cuadrar', 'A.H.goTab(["dinero"]);A.H.cuadrarAbrir(["0"])'],
  ['tu-mes', 'A.H.goTab(["tu"]);A.H.tuMesAbrir([])'],
  ['hoja-meta-nueva', 'A.H.goTab(["dinero"]);A.H.metaNueva([])'],
  ['hoja-deuda-nueva', 'A.H.goTab(["dinero"]);A.H.deudaNueva([])'],
  ['hoja-fijos', 'A.H.goTab(["tu"]);A.H.openRecurrentes([])'],
  ['hoja-fijo-nuevo', 'A.H.goTab(["tu"]);A.H.recNuevo([])'],
  ['hoja-tarea', 'A.H.goTab(["agenda"]);A.H.openTareaForm([])'],
  ['juntos', 'A.H.goTab(["juntos"])'],
  ['grupo', 'A.H.goTab(["juntos"]);A.H.grupoVer([C.G1])'],
  ['grupo-ajustes', 'A.H.goTab(["juntos"]);A.H.grupoVer([C.G1]);setTimeout(()=>A.H.grupoAjustes([C.G1]),150)'],
  ['hoja-origen', 'A.H.goTab(["juntos"]);A.H.origenVer([C.G1])'],
  ['hoja-historial', 'A.H.goTab(["juntos"]);A.H.histVer([C.G1])'],
  ['hoja-compartir', 'A.H.goTab(["juntos"]);A.H.compRapido(["g:"+C.G1])'],
  ['hoja-saldar', 'A.H.goTab(["juntos"]);A.H.grupoVer([C.G1]);setTimeout(()=>A.H.saldarAbrir([C.G1]),150)'],
  ['hoja-mov-ahorro', 'A.H.openMovForm(["Ahorro"])'],
  ['hoja-mov-gasto', 'A.H.openMovForm(["Gasto"])'],
  ['hoja-buscar', 'A.H.openBuscar([])'],
  ['hoja-categorias', 'A.H.goTab(["tu"]);A.H.tuIr(["datos"])'],
  ['hoja-moneda', 'A.H.goTab(["juntos"]);A.H.compRapido(["g:"+C.G1]);setTimeout(()=>A.H.monAbrir([]),200)'],
];
(async () => {
  const browser = await chromium.launch(); let malos = 0, total = 0;
  for (const vp of VPS) {
    const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, colorScheme: ARG.oscuro ? 'dark' : 'light', locale: 'es-ES' });
    await ctx.addInitScript('try{localStorage.clear()' + (ARG.idioma ? ';localStorage.setItem("idioma","' + ARG.idioma + '")' : '') + '}catch(e){}');
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
      const mal = (m) => { malos++; console.log('  MAL ' + vp.join('x') + ' ' + id + ': ' + m); };
      try {
        await p.evaluate(() => { const A = window.__APP__; try { A.H.closeSheet([]); } catch (e) {} }); await p.waitForTimeout(300);
        await p.evaluate((code) => { const A = window.__APP__, C = window.__CAPTURAS__; window.scrollTo(0, 0); eval(code); }, js); await p.waitForTimeout(700);
        const n = await p.evaluate(() => [...document.querySelectorAll('.info-i')].filter((e) => e.getClientRects().length && !(e.closest('details') && !e.closest('details').open)).length);
        console.log(vp.join('x') + ' ' + id + ': ' + n + ' «i»');
        if (ARG.capturas) { fs.mkdirSync(ARG.capturas, { recursive: true }); await p.screenshot({ path: path.join(ARG.capturas, id + '-' + vp[0] + '.png') }); }
        if (ARG.idioma) { const es = await p.evaluate(() => [...document.querySelectorAll('.info-txt, .info-i')].map((e) => e.classList.contains('info-i') ? e.getAttribute('aria-label') : e.textContent).filter((t) => /[áéíóúñ¿¡]|\b(el|la|los|las|de|que|para|con|tu|tus|se|una|un|y)\b/i.test(t))); if (process.env.VER) console.log('   ' + (await p.evaluate(() => [...document.querySelectorAll('.info-txt')].map((e) => e.textContent.slice(0, 60)).join(' || ')))); es.forEach((t) => mal('sin traducir: «' + t.slice(0, 70) + '»')); continue; }
        for (let k = 0; k < n; k++) {
          total++;
          const info = await p.evaluate((k) => {
            const b = [...document.querySelectorAll('.info-i')].filter((e) => e.getClientRects().length && !(e.closest('details') && !e.closest('details').open))[k];
            b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect();
            const pts = [[.5, .5], [.1, .1], [.9, .1], [.1, .9], [.9, .9], [.5, .1], [.5, .9], [.1, .5], [.9, .5]].map(([a, c]) => { const e = document.elementFromPoint(r.left + r.width * a, r.top + r.height * c); return e ? (b.contains(e) ? 'yo' : (e.closest('button,a,label,input,select,textarea,[data-click],[data-change],[data-input]') ? e.closest('button,a,label,input,select,textarea,[data-click],[data-change],[data-input]').outerHTML.slice(0, 70) : 'nada')) : 'fuera'; });
            // al revés: controles vecinos cuya zona la «i» les quita (la «i» está encima en el punto donde se cruzan)
            const roba = [...(b.closest('#sheetHost') || document.querySelector('#content') || document).querySelectorAll('button:not(.info-i),a,label,input:not([type=hidden]),select,textarea,[data-click]:not(.info-i)')].filter((e) => e.getClientRects().length && !b.contains(e) && !e.contains(b)).map((e) => { const q = e.getBoundingClientRect(), x0 = Math.max(q.left, r.left), x1 = Math.min(q.right, r.right), y0 = Math.max(q.top, r.top), y1 = Math.min(q.bottom, r.bottom); if (x1 - x0 < 2 || y1 - y0 < 2) return null; const t = document.elementFromPoint((x0 + x1) / 2, (y0 + y1) / 2); return t && b.contains(t) ? { el: e.outerHTML.slice(0, 60), px: Math.round(y1 - y0) } : null; }).filter(Boolean);
            const fila = b.closest('.tappable,[data-click]:not(.info-i)'); // ¿dentro de otro tocable? (un botón dentro de un <label> no activa su campo: lo dice el HTML)
            // ¿la «i» sabe de qué es? O lleva etiqueta propia, o está dentro de un título/etiqueta con texto visible al lado
            const dueno = b.closest('label,h2,b'); let sola = false;
            if (!b.classList.contains('con-etiq')) { const t = dueno ? [...dueno.childNodes].filter((n) => n !== b && !(n.nodeType === 1 && n.classList.contains('info-txt'))).map((n) => n.textContent).join('').trim() : ''; sola = !t; }
            return { sola, roba, w: r.width, h: r.height, x: r.left + r.width / 2, y: r.top + r.height / 2, pts, dentro: fila ? fila.outerHTML.slice(0, 70) : '', col: b.closest('#sheetHost') ? 'hoja' : 'pag' };
          }, k);
          if (info.w < 43.5 || info.h < 43.5) mal('zona táctil ' + Math.round(info.w) + '×' + Math.round(info.h) + ' (i ' + k + ')');
          const ajenos = info.pts.filter((q) => q !== 'yo' && q !== 'nada'); if (ajenos.length) mal('«i» ' + k + ': en su zona táctil hay otro control: ' + ajenos[0]);
          if (info.roba.length && info.roba[0].px > 8) mal('«i» ' + k + ' tapa ' + info.roba[0].px + ' px de otro control: ' + info.roba[0].el);
          if (info.sola) mal('«i» ' + k + ' suelta: sin título ni etiqueta al lado');
          if (info.dentro) mal('«i» ' + k + ' dentro de otro tocable: ' + info.dentro);
          await p.waitForTimeout(450); // el freno al doble toque
          const antes = await p.evaluate(() => ({ foco: document.activeElement && (document.activeElement.id || document.activeElement.tagName), hojas: document.querySelectorAll('#sheetBackdrop').length, sy: window.scrollY, esc: [...document.querySelectorAll('input,textarea')].map((i) => i.value).join('|'), tit: document.querySelector('#pageTitle') && document.querySelector('#pageTitle').textContent }));
          await p.touchscreen.tap(info.x, info.y); await p.waitForTimeout(250);
          const d = await p.evaluate((k) => {
            const b = [...document.querySelectorAll('.info-i')].filter((e) => e.getClientRects().length && !(e.closest('details') && !e.closest('details').open))[k]; if (!b) return { sinBoton: true };
            const t = document.getElementById(b.getAttribute('aria-controls')), r = t.getBoundingClientRect(), W = window.innerWidth;
            const sh = b.closest('.sheet'), fija = document.querySelector('#sheetHost .actions.fija'), fr = fija && fija.getBoundingClientRect();
            const sr = sh && sh.getBoundingClientRect();
            return { abierto: !t.hasAttribute('hidden'), exp: b.getAttribute('aria-expanded'), l: r.left, rg: r.right, W, h: r.height, texto: t.textContent.slice(0, 40), cortado: t.scrollWidth > t.clientWidth + 1,
              foco: document.activeElement && (document.activeElement.id || document.activeElement.tagName), hojas: document.querySelectorAll('#sheetBackdrop').length, sy: window.scrollY, esc: [...document.querySelectorAll('input,textarea')].map((i) => i.value).join('|'),
              fijaVista: fr ? (fr.bottom <= window.innerHeight + 1 && fr.top >= 0) : null, tit: document.querySelector('#pageTitle') && document.querySelector('#pageTitle').textContent, tecl: !!document.querySelector('.tec.on, #tec.on'), cuerpoCorta: sr ? sr.bottom > window.innerHeight + 1 : false };
          }, k);
          if (d.sinBoton) { mal('«i» ' + k + ': la pantalla se repintó al tocarla'); continue; }
          if (!d.abierto || d.exp !== 'true') mal('«i» ' + k + ' no se abre con un toque de verdad');
          if (d.l < -0.5 || d.rg > d.W + 0.5) mal('«i» ' + k + ': texto fuera de pantalla ' + Math.round(d.l) + '–' + Math.round(d.rg) + ' «' + d.texto + '»');
          if (d.cortado) mal('«i» ' + k + ': texto cortado');
          if (d.fijaVista === false) mal('«i» ' + k + ': la barra de botones fija queda fuera de vista');
          if (d.hojas !== antes.hojas) mal('«i» ' + k + ': cambia el número de hojas ' + antes.hojas + '→' + d.hojas);
          if (d.foco !== antes.foco && !/^(BUTTON|BODY)$/.test(d.foco)) mal('«i» ' + k + ': cambia el foco ' + antes.foco + '→' + d.foco);
          if (d.esc !== antes.esc) mal('«i» ' + k + ': cambia lo escrito');
          await p.waitForTimeout(450);
          const pos = () => p.evaluate((k) => { const b = [...document.querySelectorAll('.info-i')].filter((e) => e.getClientRects().length && !(e.closest('details') && !e.closest('details').open))[k]; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, dy: 0 }; }, k);
          let q = await pos(); if (Math.abs(q.y - info.y) > 3) console.log('  nota ' + vp.join('x') + ' ' + id + ' «i» ' + k + ': al abrirla se mueve ' + Math.round(q.y - info.y) + ' px (la hoja crece hacia arriba)');
          await p.touchscreen.tap(q.x, q.y); await p.waitForTimeout(200);
          const c = await p.evaluate((k) => { const b = [...document.querySelectorAll('.info-i')].filter((e) => e.getClientRects().length && !(e.closest('details') && !e.closest('details').open))[k]; return b && document.getElementById(b.getAttribute('aria-controls')).hasAttribute('hidden'); }, k);
          if (!c) mal('«i» ' + k + ' no se cierra con otro toque');
          q = await pos(); await p.touchscreen.tap(q.x, q.y); await p.waitForTimeout(200); // la dejo abierta para el repintado
        }
        // ids duplicados con las «i» abiertas
        const dup = await p.evaluate(() => { const ids = [...document.querySelectorAll('[id^=info]')].map((e) => e.id), s = new Set(ids); return { n: ids.length, dup: ids.length - s.size }; });
        if (dup.dup) mal('ids repetidos: ' + dup.dup);
      } catch (e) { mal('error del script: ' + e.message.slice(0, 120)); }
    }
    if (err.length) { malos++; console.log('  ERRORES de la página (' + vp.join('x') + '): ' + err.slice(0, 3).join(' / ')); }
    await ctx.close();
  }
  await browser.close(); console.log('\n' + (total - 0) + ' «i» tocadas · avisos: ' + malos); process.exit(malos ? 1 : 0);
})();

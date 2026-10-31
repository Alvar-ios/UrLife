// C4 de docs/11: capturas de las pantallas principales (390 y 375 px, claro y oscuro) y aviso de textos cortados
// o que se salen de la pantalla. Uso: node tests/capturas/revisar.js [carpeta-de-salida]
// Datos inventados (datos-falsos.js). No toca Supabase ni nada real. No forma parte de `npm test` (necesita Chromium).
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const RAIZ = path.join(__dirname, '..', '..'), SALIDA = path.resolve(process.argv[2] || path.join(__dirname, 'salida'));
const PANTALLAS = [
  ['inicio', 'A.S.tab="inicio";A.render()'],
  ['movimientos', 'A.S.tab="movimientos";A.render()'],
  ['mov-lista', 'A.S.tab="movimientos";A.render();A.H.setMovVista(["lista"])'],
  ['juntos', 'A.S.tab="juntos";A.render()'],
  ['grupo', 'A.S.tab="juntos";A.render();A.H.grupoVer([C.G1])'],
  ['historial', 'A.S.tab="juntos";A.render();A.H.histVer([C.G1])'],
  ['dinero', 'A.S.tab="dinero";A.render()'],
  ['agenda', 'A.S.tab="agenda";A.render()'],
  ['tu', 'A.S.tab="tu";A.render()'],
  ['moneda', 'A.S.tab="juntos";A.render();A.H.compRapido(["g:"+C.G1]);setTimeout(()=>{A.H.monAbrir([]);setTimeout(()=>{const el=document.querySelector("#monImporte");el.value="120";A.H.monImporte([],el);},150);},150)'],
  ['viaje', 'A.S.tab="juntos";A.render();A.H.grupoVer([C.G1]);setTimeout(()=>{A.H.temaVer(["tv1"]);A.H.temaCerrarPre(["tv1"]);},150)'],
  ['mas', 'A.S.tab="inicio";A.S.inicioSub="";A.S.inicioVista="";A.render();A.openCrear()'],
];
// en la página: busca textos cortados (sin «…» a propósito) y cosas que se salen por la derecha
function revisarPagina() {
  const out = [], W = window.innerWidth, vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const enScroll = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 1) return true; } return false; };
  const nombre = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  if (document.documentElement.scrollWidth > W + 1) out.push({ tipo: 'scroll lateral', donde: 'página', txt: 'la página se puede mover a los lados (' + document.documentElement.scrollWidth + ' px)' });
  const SEL = document.querySelector('#sheetBackdrop') ? '#sheetHost *' : '#app *';
  document.querySelectorAll(SEL).forEach((el) => {
    if (!vis(el) || enScroll(el)) return;
    const s = getComputedStyle(el), txt = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (!txt) return;
    const propio = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
    const puntos = s.textOverflow === 'ellipsis' && !/flex|grid/.test(s.display); // con flex o grid los «…» no salen
    if (propio && el.scrollWidth > el.clientWidth + 1 && s.overflow !== 'visible' && !puntos && el.clientWidth > 0)
      out.push({ tipo: 'texto cortado', donde: nombre(el), txt: txt.slice(0, 60) });
    else if (propio && puntos && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && el.clientWidth < 0.5 * el.scrollWidth && txt.length <= 24)
      out.push({ tipo: 'texto muy recortado (sale menos de la mitad)', donde: nombre(el), txt: txt.slice(0, 60) });
    const r = el.getBoundingClientRect();
    const recorta = () => { for (let q = el.parentElement; q && q !== document.body; q = q.parentElement) if (getComputedStyle(q).overflowX !== 'visible' && q.getBoundingClientRect().right <= W + 1) return true; return false; };
    if (propio && r.right > W + 1 && s.position !== 'fixed' && !recorta()) out.push({ tipo: 'se sale por la derecha', donde: nombre(el), txt: txt.slice(0, 60) });
  });
  // textos que se pisan entre sí (dos textos distintos, ninguno dentro del otro)
  const arriba = (el, r) => { const x = r.left + r.width / 2, y = r.top + r.height / 2; if (x < 0 || y < 0 || x > W || y > window.innerHeight) return false; const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  const T = [];
  document.querySelectorAll(SEL).forEach((el) => { if (!vis(el) || enScroll(el)) return; el.childNodes.forEach((n) => { if (n.nodeType !== 3 || !n.textContent.trim()) return;
    const rg = document.createRange(); rg.selectNodeContents(n); let r = rg.getBoundingClientRect();
    for (let q = el; q && q !== document.body; q = q.parentElement) { if (getComputedStyle(q).overflowX !== 'visible') { const c = q.getBoundingClientRect(), l = Math.max(r.left, c.left), rt = Math.min(r.right, c.right); r = { left: l, right: rt, top: r.top, bottom: r.bottom, width: rt - l, height: r.height }; } } if (r.width > 2 && r.height > 2 && arriba(el, r)) T.push({ el, r }); }); });
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
    const a = T[i], b = T[j]; if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (w > 3 && h > 3 && w * h > 0.15 * Math.min(a.r.width * a.r.height, b.r.width * b.r.height)) out.push({ tipo: 'textos que se pisan', donde: nombre(a.el) + ' / ' + nombre(b.el), txt: (a.el.textContent.trim().slice(0, 25) + ' | ' + b.el.textContent.trim().slice(0, 25)).replace(/\s+/g, ' ') });
  }
  const vistos = new Set(); return out.filter((x) => { const k = x.tipo + x.donde + x.txt; if (vistos.has(k)) return false; vistos.add(k); return true; });
}
(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const b = await chromium.launch(), informe = [];
  for (const ancho of [390, 375]) for (const tema of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: ancho, height: 844 }, colorScheme: tema, deviceScaleFactor: 2 });
    const p = await ctx.newPage(); const errores = [];
    p.on('pageerror', (e) => errores.push(e.message));
    await p.route('**/*', (r) => {
      const u = r.request().url();
      if (/data-layer\.js$/.test(u)) return r.fulfill({ path: path.join(__dirname, 'datos-falsos.js'), contentType: 'text/javascript' });
      if (/supabase|config\.js$|auth-signup\.js$|fonts\.g/.test(u)) return r.fulfill({ body: '', contentType: /css|fonts/.test(u) ? 'text/css' : 'text/javascript' });
      return r.continue();
    });
    await p.goto('file://' + path.join(RAIZ, 'index.html'));
    await p.waitForFunction(() => window.__APP__ && document.querySelector('#app').textContent.length > 50, null, { timeout: 15000 });
    await p.waitForTimeout(600);
    for (const [id, js] of PANTALLAS) {
      await p.evaluate(() => { const A = window.__APP__; try { A.H.closeSheet([]); } catch (e) { /* */ } });
      await p.waitForTimeout(350);
      try { await p.evaluate((code) => { const A = window.__APP__, C = window.__CAPTURAS__; eval(code); }, js); } catch (e) { errores.push(id + ': ' + e.message); }
      await p.waitForTimeout(700);
      const fallos = await p.evaluate(revisarPagina);
      const f = id + '-' + ancho + '-' + (tema === 'dark' ? 'oscuro' : 'claro') + '.png';
      await p.screenshot({ path: path.join(SALIDA, f) });
      informe.push({ pantalla: id, ancho, tema, captura: f, fallos });
    }
    if (errores.length) informe.push({ pantalla: '(errores de la app)', ancho, tema, fallos: errores.map((m) => ({ tipo: 'error', donde: '', txt: m })) });
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(path.join(SALIDA, 'informe.json'), JSON.stringify(informe, null, 1));
  let total = 0;
  informe.forEach((x) => { if (!x.fallos.length) return; total += x.fallos.length; console.log('· ' + x.pantalla + ' ' + (x.ancho || '') + ' ' + (x.tema || '')); x.fallos.forEach((f) => console.log('    ' + f.tipo + ' — ' + f.donde + ' — «' + f.txt + '»')); });
  console.log(total ? total + ' avisos. Capturas en ' + SALIDA : 'Sin avisos. Capturas en ' + SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });

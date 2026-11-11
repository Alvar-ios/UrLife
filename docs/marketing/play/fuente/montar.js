// Uso: node montar.js <carpeta-del-repo> <carpeta-crudas> <carpeta-salida>. Después: pasar capturas y gráfico a RGB (24 bits) y el icono a RGBA (32 bits).
// Monta icono, gráfico destacado y capturas con titular para la ficha de Google Play (datos inventados).
const path = require('path'), fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const RAIZ = process.argv[2], CRUDAS = process.argv[3], SALIDA = process.argv[4];
const F = 'file://' + path.join(RAIZ, 'fonts') + '/';
const FUENTES = `@font-face{font-family:'Bricolage Grotesque';font-weight:200 800;src:url(${F}bricolage-grotesque.woff2) format('woff2')}
@font-face{font-family:'Work Sans';font-weight:500;src:url(${F}work-sans-latin-500-normal.woff2) format('woff2')}
@font-face{font-family:'Work Sans';font-weight:600;src:url(${F}work-sans-latin-600-normal.woff2) format('woff2')}
*{margin:0;padding:0;box-sizing:border-box}body{background:#0B0816}`;
const VIO = '#6D3FE0', LILA = '#A98BFF', AMA = '#FFD166';
// Dos círculos que se cruzan; la zona común en amarillo
// En diagonal (arriba a la izquierda y abajo a la derecha), para no recordar al logo de una tarjeta de pago
function circulos(cx, cy, r, d, c1, c2, comun, extra) {
  const id = 'k' + Math.random().toString(36).slice(2, 7), k = d * 0.7071;
  const a = [cx - k, cy - k], b = [cx + k, cy + k];
  return `<defs><clipPath id="${id}"><circle cx="${a[0]}" cy="${a[1]}" r="${r}"/></clipPath></defs>
  <circle cx="${a[0]}" cy="${a[1]}" r="${r}" fill="${c1}" ${extra || ''}/><circle cx="${b[0]}" cy="${b[1]}" r="${r}" fill="${c2}" ${extra || ''}/>
  <circle cx="${b[0]}" cy="${b[1]}" r="${r}" fill="${comun}" clip-path="url(#${id})"/>`;
}
function aros(cx, cy, r, d, w, c, comun) {
  const id = 'a' + Math.random().toString(36).slice(2, 7), k = d * 0.7071;
  const a = [cx - k, cy - k], b = [cx + k, cy + k];
  return `<defs><clipPath id="${id}"><circle cx="${a[0]}" cy="${a[1]}" r="${r}"/></clipPath></defs>
  <circle cx="${b[0]}" cy="${b[1]}" r="${r}" fill="${comun}" clip-path="url(#${id})"/>
  <circle cx="${a[0]}" cy="${a[1]}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"/><circle cx="${b[0]}" cy="${b[1]}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
}
const ICONOS = {
  // B1: el violeta de siempre de fondo (continuidad con la P), círculos blanco y lila, zona común amarilla
  'icono-b1-violeta': `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7E55F2"/><stop offset="1" stop-color="#5326C9"/></linearGradient></defs>
    <rect width="512" height="512" fill="url(#g)"/>${circulos(256, 256, 104, 70, '#FFFFFF', '#C9B8FF', AMA)}</svg>`,
  // B2: fondo casi negro (como la app en oscuro), círculos violeta y lila
  'icono-b2-noche': `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs><radialGradient id="g" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#2A1D5C"/><stop offset="1" stop-color="#0F0B1F"/></radialGradient></defs>
    <rect width="512" height="512" fill="url(#g)"/>${circulos(256, 256, 104, 70, '#7B4FF0', LILA, AMA)}</svg>`,
  // B3: aros blancos sobre violeta, solo la zona común rellena
  'icono-b3-aros': `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7E55F2"/><stop offset="1" stop-color="#5326C9"/></linearGradient></defs>
    <rect width="512" height="512" fill="url(#g)"/>${aros(256, 256, 96, 66, 26, '#FFFFFF', AMA)}</svg>`,
};
const DESTACADO = `<html><head><style>${FUENTES}
.f{width:1024px;height:500px;position:relative;overflow:hidden;background:radial-gradient(120% 140% at 85% 30%,#3B2194 0%,#1A1140 45%,#0B0816 100%)}
.t{position:absolute;left:72px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;width:600px}
.marca{display:flex;align-items:center;gap:12px;font:600 26px 'Work Sans';color:#E9E3FF;letter-spacing:.2px;margin-bottom:22px}
.marca svg{width:40px;height:40px}
h1{font:800 58px/1.04 'Bricolage Grotesque';color:#fff;letter-spacing:-1.5px}
h1 em{font-style:normal;color:${AMA}}
p{font:500 22px/1.4 'Work Sans';color:#C9C0EE;margin-top:22px;max-width:600px}
.d{position:absolute;right:-70px;top:50%;transform:translateY(-50%)}
</style></head><body><div class="f">
<svg class="d" width="520" height="520" viewBox="0 0 520 520">${circulos(260, 260, 150, 100, '#A98BFF', '#6D3FE0', AMA)}</svg>
<div class="t"><div class="marca">PalomApp</div>
<h1>Lo tuyo, lo nuestro,<br><em>todo claro</em></h1>
<p>Tus gastos y los que compartes, en una sola app.</p></div></div></body></html>`;
// Capturas: [archivo cruda, titular (con <em> para el color), subtítulo]
const CAPTURAS = [
  ['inicio', 'Tu dinero y el que compartes, <em>en una sola app</em>'],
  ['ticket', 'Foto al ticket. <em>Cada uno paga lo suyo</em>'],
  ['juntos', 'Quién debe a quién, <em>sin discutir</em>'],
  ['origen', 'Cada cifra, <em>explicada</em>'],
  ['mov-gastas', 'Mira en qué <em>se va tu dinero</em>'],
  ['metas', 'Metas de ahorro <em>que se ven</em>'],
  ['agenda', 'Y también <em>quién hace qué</em>'],
  ['historial', 'Nada se pierde: <em>historial y deshacer</em>'],
];
function captura(img, titular, n) {
  const ang = [-1, 1][n % 2];
  return `<html><head><style>${FUENTES}
.c{width:1080px;height:1920px;position:relative;overflow:hidden;background:linear-gradient(180deg,#1A1140 0%,#0E0A1F 38%,#0B0816 100%)}
.o1,.o2{position:absolute;border-radius:50%;filter:blur(2px)}
.o1{width:760px;height:760px;left:${ang < 0 ? -260 : 580}px;top:420px;background:radial-gradient(circle,rgba(109,63,224,.55),rgba(109,63,224,0) 70%)}
.o2{width:620px;height:620px;left:${ang < 0 ? 640 : -200}px;top:1180px;background:radial-gradient(circle,rgba(169,139,255,.30),rgba(169,139,255,0) 70%)}
h1{position:absolute;left:80px;right:80px;top:78px;font:800 84px/1.04 'Bricolage Grotesque';color:#fff;letter-spacing:-2px;text-wrap:balance}
h1 em{font-style:normal;color:#C4B1FF}
.k{position:absolute;left:80px;top:60px;width:30px;height:30px}
.s{position:absolute;left:80px;top:400px;width:920px;height:1510px;border-radius:52px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 0 2px rgba(169,139,255,.28)}
.s img{width:920px;display:block}
</style></head><body><div class="c"><div class="o1"></div><div class="o2"></div>
<h1>${titular}</h1>
<div class="s"><img src="file://${img}"></div></div></body></html>`;
}
(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const b = await chromium.launch();
  const TMP = path.join(SALIDA, '..', 'tmp-html'); fs.mkdirSync(TMP, { recursive: true });
  const abrir = async (p, html, n) => { const f = path.join(TMP, n + '.html'); fs.writeFileSync(f, html); await p.goto('file://' + f); await p.evaluate(() => document.fonts.ready); };
  const pg = async (w, h) => { const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); return c.newPage(); };
  for (const [n, svg] of Object.entries(ICONOS)) {
    const p = await pg(512, 512); await abrir(p, `<html><body style="margin:0">${svg}</body></html>`, n);
    await p.screenshot({ path: path.join(SALIDA, n + '.png'), omitBackground: false }); await p.context().close();
  }
  { const p = await pg(1024, 500); await abrir(p, DESTACADO, 'destacado'); await p.waitForTimeout(300); await p.screenshot({ path: path.join(SALIDA, 'grafico-destacado-1024x500.png') }); await p.context().close(); }
  let i = 0;
  for (const [id, t] of CAPTURAS) {
    i++; const p = await pg(1080, 1920); await abrir(p, captura(path.join(CRUDAS, id + '.png'), t, i), 'c' + i);
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(SALIDA, 'captura-' + String(i).padStart(2, '0') + '-' + id + '.png') }); await p.context().close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });

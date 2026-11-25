// 25/11 · Monta las imágenes de la App Store a partir de las capturas en bruto de tienda.js:
// capturas con titular (iPhone 6,3", iPhone Duo, iPad 13"), encabezado y resultados de búsqueda.
// Uso: node tests/capturas/tienda-arte.js <carpeta-bruto> <carpeta-salida>
//   <carpeta-bruto>/{fon,duo,ipad}/<pantalla>.png  (tienda.js a 402x874@3, 669x951@3 y 768x1024@2.6875)
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const RAIZ = path.join(__dirname, '..', '..');
const [BRUTO, SALIDA] = process.argv.slice(2);
const url = (f) => 'file://' + path.resolve(f);

// las 10 capturas, en el orden en que salen en la tienda. *palabra* = en amarillo
const LISTA = [
  ['inicio', 'Lo que te queda este mes, *de un vistazo*'],
  ['gasto', 'Apunta un gasto *en segundos*'],
  ['juntos', 'Comparte gastos, *aunque no tengan app*'],
  ['saldos', 'Cuentas claras: *quién debe a quién*'],
  ['movimientos', 'Mira *en qué se te va* el dinero'],
  ['dinero', 'Todo tu dinero, *en un solo sitio*'],
  ['meta', 'Ahorra para *lo que te ilusiona*'],
  ['agenda', 'Tus tareas y planes, *junto a tus pagos*'],
  ['trayecto', '¿Cuánto cuesta el viaje? *Te lo dice*'],
  ['historial', 'Todo queda guardado, *y se puede deshacer*'],
];
// [carpeta, ancho y alto final, escala, ancho y alto de la captura en bruto (css), barra de estado (css), isla]
const EQUIPOS = {
  'iphone-6.3': { bruto: 'fon', W: 1206, H: 2622, dpr: 3, sw: 402, sh: 874, barra: 30, isla: true, radio: 46, bisel: 10 },
  'iphone-duo': { bruto: 'duo', W: 2007, H: 2853, dpr: 3, sw: 669, sh: 951, barra: 28, isla: false, radio: 34, bisel: 11 },
  'ipad-13': { bruto: 'ipad', W: 2064, H: 2752, dpr: 2.6875, sw: 768, sh: 1024, barra: 22, isla: false, radio: 30, bisel: 14 },
};

const FUENTES = `
@font-face { font-family: 'Bricolage Grotesque'; src: url('${url(path.join(RAIZ, 'fonts/bricolage-grotesque.woff2'))}') format('woff2'); font-weight: 200 800; }
@font-face { font-family: 'Work Sans'; src: url('${url(path.join(RAIZ, 'fonts/work-sans-latin-600-normal.woff2'))}') format('woff2'); font-weight: 600; }
@font-face { font-family: 'Work Sans'; src: url('${url(path.join(RAIZ, 'fonts/work-sans-latin-500-normal.woff2'))}') format('woff2'); font-weight: 500; }`;
const FONDO = `background: radial-gradient(ellipse 70% 45% at 50% 72%, rgba(108,76,230,.55), rgba(108,76,230,0) 70%),
  radial-gradient(circle at 88% 6%, rgba(255,201,60,.22), rgba(255,201,60,0) 32%), linear-gradient(165deg, #2E2E3A 0%, #121218 55%, #08080C 100%);`;
// color de la primera fila de la captura (para que la barra de estado siga a la hoja oscurecida) y su tinta
const colorArriba = (img) => JSON.parse(require('child_process').execFileSync('python3', ['-c', `from PIL import Image; import json; im = Image.open(${JSON.stringify(img)}).convert('RGB'); c = im.getpixel((im.size[0] // 2, 2)); l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; print(json.dumps(['#%02x%02x%02x' % c, '#14162B' if l > 140 else '#FFFFFF']))`]).toString());
const titular = (t) => t.replace(/\*([^*]+)\*/g, '<span class="am">$1</span>');

// un aparato con su barra de estado (9:41, cobertura, wifi y batería) y la captura dentro. alto en px css
function aparato(img, e, alto, fondo, tinta) {
  const pantallaAlto = alto - 2 * e.bisel, escala = pantallaAlto / (e.sh + e.barra), ancho = e.sw * escala + 2 * e.bisel;
  const b = e.barra * escala, r = e.radio * escala;
  return `<div class="aparato" style="width:${ancho}px;height:${alto}px;padding:${e.bisel}px;border-radius:${r + e.bisel}px">
    <div class="pantalla" style="border-radius:${r}px;background:${fondo || '#F5F5F2'}">
      <div class="barra" style="background:${fondo || '#F5F5F2'};color:${tinta || '#14162B'};height:${b}px;font-size:${b * .5}px;padding:0 ${b * 1.05}px">
        <span>9:41</span>${e.isla ? `<i class="isla" style="width:${b * 3.6}px;height:${b * .95}px"></i>` : ''}
        <span class="ico"><svg viewBox="0 0 18 12" height="${b * .38}"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
        <svg viewBox="0 0 16 12" height="${b * .38}"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0zM3.4 6.8a6.6 6.6 0 0 1 9.2 0L11.2 8.2a4.6 4.6 0 0 0-6.4 0zM1.1 4.5a9.8 9.8 0 0 1 13.8 0l-1.4 1.4a7.8 7.8 0 0 0-11 0z"/></svg>
        <svg viewBox="0 0 27 12" height="${b * .38}"><rect x=".5" y=".5" width="23" height="11" rx="3" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="17" height="8" rx="2"/><rect x="24.5" y="4" width="2" height="4" rx="1" opacity=".45"/></svg></span>
      </div>
      <img src="${img}" style="width:100%;display:block">
    </div></div>`;
}
const CSS_APARATO = `
.aparato { background: linear-gradient(145deg, #3a3a46, #0d0d12 40%, #1c1c24); box-sizing: border-box; flex: none;
  box-shadow: 0 0 0 1.5px rgba(255,255,255,.14) inset, 0 40px 90px -30px rgba(0,0,0,.85), 0 0 120px -30px rgba(120,90,255,.45); }
.pantalla { overflow: hidden; background: #F5F5F2; height: 100%; }
.barra { display: flex; align-items: center; justify-content: space-between; background: #F5F5F2; color: #14162B; font: 600 1px 'Work Sans', sans-serif; position: relative; box-sizing: border-box; }
.barra .ico { display: flex; gap: .35em; align-items: center; } .barra svg { fill: currentColor; }
.isla { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -42%); background: #000; border-radius: 99px; }`;

async function captura(b, html, W, H, dpr, f) {
  const p = await b.newPage({ viewport: { width: Math.round(W / dpr * 1000) / 1000, height: Math.round(H / dpr * 1000) / 1000 }, deviceScaleFactor: dpr });
  const tmp = path.join(SALIDA, '_tmp.html'); fs.writeFileSync(tmp, html);
  await p.goto(url(tmp)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
  if (await p.evaluate(() => typeof window.encajar === 'function')) { await p.evaluate(() => window.encajar()); await p.waitForTimeout(150); }
  const png = path.join(SALIDA, '_tmp.png');
  await p.screenshot({ path: png, clip: { x: 0, y: 0, width: W / dpr, height: H / dpr } });
  await p.close();
  // sin canal alfa y con el tamaño exacto que pide Apple
  require('child_process').execFileSync('python3', ['-c', `from PIL import Image; im = Image.open(${JSON.stringify(png)}).convert('RGB'); im = im if im.size == (${W}, ${H}) else im.resize((${W}, ${H}), Image.LANCZOS); im.save(${JSON.stringify(f)}, optimize=True)`]);
}

function pantallaHtml(e, img, texto) {
  const W = e.W / e.dpr, H = e.H / e.dpr, ancho = W > H * 0.6;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}${CSS_APARATO}
  html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; } body { ${FONDO} display: flex; flex-direction: column; align-items: center; }
  h1 { font: 700 ${ancho ? 40 : 31}px/1.06 'Bricolage Grotesque', sans-serif; letter-spacing: -.02em; color: #fff; text-align: center; margin: ${H * .055}px ${W * .06}px 0; text-wrap: balance; }
  .am { color: #FFC93C; } #sitio { flex: 1; width: 100%; display: flex; justify-content: center; align-items: flex-start; margin-top: ${H * .035}px; }
  </style></head><body><h1>${titular(texto)}</h1><div id="sitio"></div>
  <script>window.encajar = () => { const s = document.getElementById('sitio'), alto = Math.floor(s.getBoundingClientRect().height - ${H * .04});
    s.innerHTML = ${JSON.stringify('@@')}.replace('@@', window.APARATO(alto)); };
  window.APARATO = (alto) => (${aparato.toString()})(${JSON.stringify(url(img))}, ${JSON.stringify(e)}, alto, ${JSON.stringify(colorArriba(img)[0])}, ${JSON.stringify(colorArriba(img)[1])});</script></body></html>`;
}

// encabezado y resultados de búsqueda: la marca a la izquierda y tres móviles a la derecha
function cartelHtml(W, H, dpr, imgs) {
  const w = W / dpr, h = H / dpr, e = EQUIPOS['iphone-6.3'], u = Math.min(w / 1920, h / 900);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}${CSS_APARATO}
  html, body { margin: 0; width: ${w}px; height: ${h}px; overflow: hidden; }
  body { background: radial-gradient(ellipse 55% 75% at 72% 55%, rgba(108,76,230,.6), rgba(108,76,230,0) 70%), radial-gradient(circle at 6% 8%, rgba(255,201,60,.18), rgba(255,201,60,0) 30%), linear-gradient(160deg, #2E2E3A, #121218 55%, #08080C);
    display: flex; align-items: center; justify-content: center; gap: ${90 * u}px; padding: 0 ${w * .06}px; box-sizing: border-box; }
  .marca { flex: 0 1 auto; max-width: ${w * .36}px; color: #fff; }
  .marca img { width: ${150 * u}px; border-radius: ${34 * u}px; box-shadow: 0 20px 50px -20px #000; display: block; }
  .marca h1 { font: 700 ${118 * u}px/1 'Bricolage Grotesque', sans-serif; letter-spacing: -.03em; margin: ${36 * u}px 0 ${18 * u}px; }
  .marca p { font: 600 ${46 * u}px/1.15 'Bricolage Grotesque', sans-serif; margin: 0; color: rgba(255,255,255,.92); letter-spacing: -.01em; }
  .marca p .am { color: #FFC93C; }
  .moviles { display: flex; align-items: center; flex: none; }
  .moviles > div:nth-child(1) { transform: translateX(${60 * u}px) scale(.88) rotate(-4deg); z-index: 1; opacity: .96; }
  .moviles > div:nth-child(2) { z-index: 2; }
  .moviles > div:nth-child(3) { transform: translateX(${-60 * u}px) scale(.88) rotate(4deg); z-index: 1; opacity: .96; }
  </style></head><body>
  <div class="marca"><img src="${url(path.join(RAIZ, 'marca/icono-512.png'))}"><h1>PalomApp</h1><p>Tu dinero<br><span class="am">y el que compartes</span></p></div>
  <div class="moviles">${imgs.map((i) => '<div>' + aparato(url(i), e, Math.round(Math.min(h * .86, w * .54 / 1.23)), colorArriba(i)[0], colorArriba(i)[1]) + '</div>').join('')}</div>
  </body></html>`;
}

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const b = await chromium.launch();
  for (const [nombre, e] of Object.entries(EQUIPOS)) {
    const dir = path.join(SALIDA, 'capturas-' + nombre); fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < LISTA.length; i++) {
      const [id, texto] = LISTA[i], img = path.join(BRUTO, e.bruto, id + '.png');
      await captura(b, pantallaHtml(e, img, texto), e.W, e.H, e.dpr, path.join(dir, String(i + 1).padStart(2, '0') + '-' + id + '.png'));
    }
    console.log('Hecho ' + nombre);
  }
  const tres = ['juntos', 'inicio', 'dinero'].map((id) => path.join(BRUTO, 'fon', id + '.png'));
  const dirE = path.join(SALIDA, 'encabezado'), dirB = path.join(SALIDA, 'resultados-busqueda');
  fs.mkdirSync(dirE, { recursive: true }); fs.mkdirSync(dirB, { recursive: true });
  for (const [W, H] of [[3840, 1646], [5244, 2950]]) await captura(b, cartelHtml(W, H, 2, tres), W, H, 2, path.join(dirE, 'encabezado-' + W + 'x' + H + '.png'));
  for (const [W, H] of [[1920, 1280], [3840, 2560], [5244, 2950]]) await captura(b, cartelHtml(W, H, 2, tres), W, H, 2, path.join(dirB, 'busqueda-' + W + 'x' + H + '.png'));
  fs.rmSync(path.join(SALIDA, '_tmp.html')); fs.rmSync(path.join(SALIDA, '_tmp.png'));
  await b.close();
  console.log('Listo en ' + SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });

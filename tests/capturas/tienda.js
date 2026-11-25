// 25/11 · Capturas en bruto para la App Store (datos inventados de datos-falsos.js + los de --tienda de revisar.js).
// Uso: node tests/capturas/tienda.js <carpeta> <ancho>x<alto>@<escala> [tema] [pantallas,separadas,por,comas]
// No toca Supabase ni nada real. Necesita Chromium (playwright).
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const RAIZ = path.join(__dirname, '..', '..');
const [SALIDA, TAM = '402x874@3', TEMA = 'light', SOLO] = process.argv.slice(2);
const [, W, H, E] = /^(\d+)x(\d+)@([\d.]+)$/.exec(TAM).map(Number);

// cada pantalla: código que se ejecuta con A = window.__APP__ y C = window.__CAPTURAS__
const PANTALLAS = {
  inicio: 'A.S.tab="inicio";A.render()',
  gasto: 'A.S.tab="inicio";A.render()|||A.openCrear();setTimeout(()=>{A.H.crearIr(["gasto"]);setTimeout(()=>{["2","4","5","0"].forEach((k,i)=>{const b=document.querySelector("#sheetHost [data-click=\\"tecK|"+k+"\\"]");if(b)b.click();if(i===1){const c=document.querySelector("#sheetHost [data-click=\\"tecK|%2C\\"]");if(c)c.click();}});},250)},200)',
  movimientos: 'A.S.tab="movimientos";A.render()',
  juntos: 'A.S.tab="juntos";A.render()',
  grupo: 'A.S.tab="juntos";A.render()|||A.H.grupoVer([C.G1])',
  saldos: 'A.S.tab="juntos";A.render()|||A.H.grupoVer([C.G1]);setTimeout(()=>{const b=document.querySelector("[data-click^=\\"grupoTab|saldos\\"]");if(b)b.click();},200)',
  dinero: 'A.S.tab="dinero";A.render()',
  agenda: 'A.S.tab="agenda";A.render()',
  trayecto: 'A.S.tab="inicio";A.render()|||A.H.trAbrir([]);setTimeout(()=>{A.H.trModo(["km"]);setTimeout(()=>{const el=document.querySelector("#trKm");el.value="580";A.H.trKm([],el);A.H.trPers([1]);A.H.trPers([1]);},150)},150)',
  historial: 'A.S.tab="juntos";A.render()|||A.H.histVer([C.G1])',
  meta: 'A.S.tab="dinero";A.render()|||A.H.metaVer(["mt1"])',
  informe: 'A.S.tab="inicio";A.render()|||A.H.infAbrir([])',
  herramientas: 'A.S.tab="tu";A.S.tuSub="herramientas";A.render()',
  tu: 'A.S.tab="tu";A.S.tuSub="";A.render()',
  calendario: 'A.H.irAgenda(["calendario"])',
  compartir: 'A.S.tab="juntos";A.render()|||A.H.compRapido(["g:"+C.G1])',
};
const LISTA = SOLO ? SOLO.split(',') : Object.keys(PANTALLAS);

async function abrirApp(b, opts) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: W, height: H }, colorScheme: TEMA, deviceScaleFactor: E }, opts || {}));
  await ctx.addInitScript(() => { window.__TIENDA__ = true; });
  const p = await ctx.newPage(), errores = [];
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
  return { ctx, p, errores };
}
// los datos de la tienda los pone datos-falsos.js al ver window.__TIENDA__ (así no se pierden cuando la app vuelve a leer)
module.exports = { abrirApp, PANTALLAS, W, H, E };

if (require.main === module) (async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const b = await chromium.launch(), { p, errores } = await abrirApp(b);
  for (const id of LISTA) {
    await p.evaluate(() => { const A = window.__APP__; try { A.H.closeSheet([]); } catch (e) { /* */ } A.S.tuMas = false; A.S.tuSub = ''; window.scrollTo(0, 0); });
    await p.waitForTimeout(450);
    for (const parte of PANTALLAS[id].split('|||')) {
      try { await p.evaluate((code) => { const A = window.__APP__, C = window.__CAPTURAS__; eval(code); }, parte); } catch (e) { errores.push(id + ': ' + e.message); }
      await p.waitForTimeout(700);
    }
    await p.waitForTimeout(1100);
    await p.screenshot({ path: path.join(SALIDA, id + '.png') });
  }
  if (errores.length) console.log('Errores de la app:\n  ' + errores.join('\n  '));
  await b.close();
  console.log('Hecho: ' + LISTA.length + ' capturas en ' + SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });

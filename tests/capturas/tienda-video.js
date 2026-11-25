// 25/11 · Vídeos de vista previa para la App Store: se graba la app de verdad (con datos inventados) tocando sus botones.
// Uso: node tests/capturas/tienda-video.js <carpeta-salida> <ancho>x<alto>@<escala> <ancho-final>x<alto-final> [videos]
//   iPhone (y Duo): 443x960@2 886x1920 · iPad: 900x1200@1.3333333 1200x1600
// Salen MP4 H.264 a 30 fps con pista de audio en silencio (AAC estéreo), de 15 a 30 s, como pide Apple.
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const [SALIDA, TAM, FINAL, SOLO] = process.argv.slice(2);
process.argv = process.argv.slice(0, 2).concat([SALIDA, TAM, 'light']); // tienda.js lee el tamaño y el tema de aquí
const { chromium } = require('playwright');
const { abrirApp } = require('./tienda.js');
const [, VW, VH] = /^(\d+)x(\d+)/.exec(TAM).map(Number), [FW, FH] = FINAL.split('x').map(Number);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// el dedo: un círculo que aparece donde se toca
const DEDO = `(() => { const d = document.createElement('div'); d.id = '__dedo';
  d.style.cssText = 'position:fixed;left:0;top:0;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(20,22,43,.22);border:2.5px solid rgba(255,255,255,.95);box-shadow:0 4px 14px rgba(0,0,0,.25);pointer-events:none;z-index:99999;opacity:0;transform:scale(.6);transition:opacity .18s,transform .18s;';
  document.body.appendChild(d); })()`;

function guion(p) {
  const caja = async (sel) => {
    const loc = p.locator(sel).filter({ visible: true }).last();
    await loc.waitFor({ state: 'visible', timeout: 5000 });
    await loc.scrollIntoViewIfNeeded(); return loc.boundingBox();
  };
  const toca = async (sel, pausa = 750) => {
    const b = await caja(sel), x = b.x + b.width / 2, y = b.y + b.height / 2;
    await p.evaluate(([x, y]) => { const d = document.getElementById('__dedo'); d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.opacity = '1'; d.style.transform = 'scale(1)'; }, [x, y]);
    await espera(230); await p.mouse.click(x, y);
    await p.evaluate(() => { const d = document.getElementById('__dedo'); d.style.opacity = '0'; d.style.transform = 'scale(1.35)'; });
    await espera(pausa);
  };
  const dc = (v) => '[data-click="' + v + '"]', dcEmp = (v) => '[data-click^="' + v + '"]';
  const desliza = async (px, ms = 1600) => { // desplaza poco a poco, como con el dedo
    const pasos = Math.round(ms / 33), raiz = await p.evaluate(() => { const s = document.querySelector('#sheetBackdrop .sheet'); return s ? 'sheet' : 'doc'; });
    for (let i = 1; i <= pasos; i++) {
      const t = i / pasos, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, prev = (i - 1) / pasos, ep = prev < .5 ? 2 * prev * prev : 1 - Math.pow(-2 * prev + 2, 2) / 2;
      await p.evaluate(([d, r]) => { const el = r === 'sheet' ? document.querySelector('#sheetBackdrop .sheet') : document.scrollingElement; el.scrollTop += d; }, [px * (e - ep), raiz]);
      await espera(33);
    }
  };
  const escribe = async (sel, txt) => { await toca(sel, 300); await p.keyboard.type(txt, { delay: 85 }); await espera(500); };
  const nav = async (tab) => toca(dc('goTab|' + tab), 1400);
  return { toca, dc, dcEmp, desliza, escribe, nav };
}

const VIDEOS = {
  // 1 · apuntar un gasto con el teclado propio, y verlo en Inicio y en Movimientos
  '1-apunta-un-gasto': async (p, g) => {
    await espera(1500);
    await g.toca(g.dc('onFab') + ', .rail-fab', 950);
    await g.toca(g.dc('crearIr|gasto'), 1100);
    for (const k of ['1', '2', '%2C', '5', '0']) await g.toca(g.dc('tecK|' + k), 330);
    await espera(400);
    await g.toca(g.dc('tecCat|Restaurantes'), 800);
    await g.toca(g.dc('tecK|ok'), 2200);
    await g.desliza(420, 1700); await espera(900); await g.desliza(-420, 1300); await espera(500);
    await g.nav('movimientos'); await espera(900);
    await g.toca(g.dc('setMovVista|lista'), 1600);
    await g.desliza(300, 1400); await espera(1300);
  },
  // 2 · Juntos: el grupo, los saldos y compartir un gasto
  '2-juntos': async (p, g) => {
    await espera(1000);
    await g.nav('juntos'); await espera(700);
    await g.toca(g.dc('grupoVer|g-piso'), 1700);
    await g.toca('#sheetHost button:text-is("Saldos"), #sheetHost [role=tab]:text-is("Saldos")', 2300);
    await g.toca('#sheetHost button:text-is("Gastos"), #sheetHost [role=tab]:text-is("Gastos")', 1500);
    await g.toca('#sheetHost button:text-is("Cerrar")', 900);
    await g.toca(g.dc('compRapido|'), 1100);
    const imp = p.locator('#sheetHost ' + g.dcEmp('tecAbrir')).filter({ visible: true });
    if (await imp.count()) { await g.toca('#sheetHost ' + g.dcEmp('tecAbrir'), 600); for (const k of ['4', '5']) await g.toca(g.dc('tecK|' + k), 330); await espera(500); }
    else { await g.escribe('#sheetHost input[inputmode=decimal]', '45'); }
    const desc = p.locator('#sheetHost input[type=text]').filter({ visible: true });
    if (await desc.count()) await g.escribe('#sheetHost input[type=text] >> visible=true', 'Cena del viernes');
    await espera(1500);
    await g.toca('#sheetHost button:text-is("Guardar")', 2500);
  },
  // 3 · tu dinero: en qué gastas, cuentas, una meta y la agenda
  '3-tu-dinero': async (p, g) => {
    await espera(800);
    await g.nav('movimientos'); await espera(800);
    await g.desliza(520, 2000); await espera(1400); await g.desliza(-520, 1400);
    await g.nav('dinero'); await espera(900);
    await g.toca(g.dc('dm3Tab|metas'), 1500);
    await g.toca(g.dcEmp('metaVer|'), 2600);
    await g.toca('#sheetHost ' + g.dc('closeSheet'), 900);
    await g.toca(g.dc('dm3Tab|deudas'), 2000);
    await g.toca(g.dc('irAgenda|tareas'), 2200);
    await g.toca(g.dc('setInicioVista|calendario'), 2600);
  },
};

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const b = await chromium.launch();
  for (const [nombre, fn] of Object.entries(VIDEOS)) {
    if (SOLO && SOLO.split(',').indexOf(nombre) < 0) continue;
    const { ctx, p, errores } = await abrirApp(b);
    await p.evaluate(DEDO);
    await p.evaluate(() => { const A = window.__APP__; A.S.tab = 'inicio'; A.render(); window.scrollTo(0, 0); });
    await espera(800);
    const cdp = await ctx.newCDPSession(p), frames = [];
    cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => { frames.push({ data, t: metadata.timestamp }); cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); });
    await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: FW * 2, maxHeight: FH * 2 });
    const t0 = Date.now() / 1000;
    try { await fn(p, guion(p)); } catch (e) { errores.push('guion: ' + e.message.split('\n')[0]); }
    await espera(600);
    await cdp.send('Page.stopScreencast');
    const t1 = Date.now() / 1000;
    await ctx.close();
    // fotogramas → lista con su duración → MP4 a 30 fps constantes
    const dir = path.join(SALIDA, '_f-' + nombre); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
    let lista = '', dur = 0;
    const inicio = frames.length ? frames[0].t : t0;
    frames.forEach((f, i) => {
      const fn2 = 'f' + String(i).padStart(5, '0') + '.png'; fs.writeFileSync(path.join(dir, fn2), Buffer.from(f.data, 'base64'));
      let d = (i + 1 < frames.length ? frames[i + 1].t : inicio + (t1 - t0)) - f.t; if (i + 1 === frames.length) d = Math.max(d, 1);
      d = Math.max(d, 1 / 60); dur += d;
      if (dur < 16 && i + 1 === frames.length) { d += 16 - dur; dur = 16; } // Apple: 15 s como mínimo
      lista += "file '" + fn2 + "'\nduration " + d.toFixed(4) + '\n';
    });
    lista += "file 'f" + String(frames.length - 1).padStart(5, '0') + ".png'\n";
    fs.writeFileSync(path.join(dir, 'lista.txt'), lista);
    const out = path.join(SALIDA, nombre + '-' + FW + 'x' + FH + '.mp4');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'lista.txt'),
      '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
      '-vf', `scale=${FW}:${FH}:flags=lanczos:force_original_aspect_ratio=decrease,pad=${FW}:${FH}:(ow-iw)/2:(oh-ih)/2:color=0xF5F5F2,fps=30,format=yuv420p`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-profile:v', 'high', '-level', '4.1', '-r', '30', '-g', '30',
      '-c:a', 'aac', '-b:a', '256k', '-ac', '2', '-t', String(Math.min(29.5, dur)), '-shortest', '-movflags', '+faststart', out]);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(nombre + ': ' + frames.length + ' fotogramas, ' + dur.toFixed(1) + ' s' + (errores.length ? ' · avisos: ' + errores.join(' | ') : ''));
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });

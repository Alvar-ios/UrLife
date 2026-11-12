// Diagnóstico de rendimiento (docs/40, A1). NO entra en `npm test` (usa Chromium y tarda unos minutos).
// Uso:  NODE_PATH=/opt/node-tools/node_modules node tests/rendimiento/medir.js [ligero,normal,pesado] [carpeta-de-salida]
// Arranca la app real (index.html + app.js sin tocar) en Chromium con móvil 390×844 y la CPU frenada 4×,
// con los datos inventados de tests/datos/generar.js. No toca Supabase ni nada real.
// Deja resultados.json y resultados.md en la carpeta de salida (por defecto tests/rendimiento/salida).
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const { capaDatos, JUEGOS } = require('../datos/generar.js');
const RAIZ = path.join(__dirname, '..', '..');
const CUALES = (process.argv[2] || 'ligero,normal,pesado').split(',').filter((k) => JUEGOS[k]);
const SALIDA = path.resolve(process.argv[3] || path.join(__dirname, 'salida'));
const FRENO = Number(process.env.FRENO || 4);
// funciones de cálculo que se cuentan por pintado (se envuelven en una copia de app.js que solo vive en esta medición)
const CONTAR = ['render', 'cfg', 'cuentasCfg', 'kpisMes', 'movsDelMes', 'sumTipo', 'saldoCuenta', 'patrimonio', 'mesDe', 'rangoMes', 'mesCfg', 'movsEfectivos', 'movsPersonales', 'flujosCompartidos',
  'saldosDe', 'miSaldo', 'metasCfg', 'metasStats', 'deudaStats', 'movsDeuda', 'catsGasto', 'movsFiltrados', 'cuentaPrincipal', 'todayISO', 'previstoMes', 'ocurrencias', 'gastosHabituales', 'versionIdx', 'perfilCfg', 'donutDatos'];
const med = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; };
const r1 = (x) => Math.round(x * 10) / 10;

function appInstrumentada() {
  let src = fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8'); const hechas = [];
  CONTAR.forEach((n) => {
    const re = new RegExp('^function ' + n + '\\(', 'm'); if (!re.test(src)) return; hechas.push(n);
    src = src.replace(re, 'function ' + n + '(){const __t=performance.now();try{return ' + n + '__o.apply(this,arguments);}finally{const c=window.__CNT__.' + n + '||(window.__CNT__.' + n + '={n:0,ms:0});c.n++;c.ms+=performance.now()-__t;}}\nfunction ' + n + '__o(');
  });
  return { src: 'window.__CNT__={};' + src, hechas };
}
function htmlMarcado() {
  return fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')
    .replace('<script src="app.js"></script>', '<script>performance.mark("appjs-antes")</script><script src="app.js"></script><script>performance.mark("appjs-despues")</script>');
}
// en la página, antes de nada: apunta las tareas largas y el momento en que Inicio se ve con datos
function sonda() {
  window.__LT__ = [];
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__LT__.push(Math.round(e.duration)))).observe({ entryTypes: ['longtask'] }); } catch (e) { /* */ }
  const mira = () => {
    const A = window.__APP__, c = document.querySelector('#content');
    if (!window.__T_CASCARON__ && c) window.__T_CASCARON__ = performance.now();
    if (A && A.S.loaded.mov && A.S.loaded.tar && A.S.loaded.cfg && c && c.textContent.length > 50) { window.__T_INICIO__ = performance.now(); return; }
    requestAnimationFrame(mira);
  };
  requestAnimationFrame(mira);
}
async function abrir(b, juego, opciones) {
  const o = opciones || {};
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(), errores = []; p.on('pageerror', (e) => errores.push(e.message));
  const datos = capaDatos(juego), html = htmlMarcado();
  await p.route('**/*', (r) => {
    const u = r.request().url();
    if (/index\.html$/.test(u)) return r.fulfill({ body: html, contentType: 'text/html' });
    if (/data-layer\.js$/.test(u)) return r.fulfill({ body: datos, contentType: 'text/javascript' });
    if (/\/app\.js$/.test(u)) return r.fulfill({ body: o.app || ('performance.mark("appjs-primera-linea");' + fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8')), contentType: 'text/javascript' });
    if (/supabase|config\.js$|auth-signup\.js$|fonts\.g/.test(u)) return r.fulfill({ body: '', contentType: /css|fonts\.g/.test(u) ? 'text/css' : 'text/javascript' });
    return r.continue();
  });
  await p.addInitScript(sonda);
  const cdp = await ctx.newCDPSession(p);
  if (o.freno > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: o.freno });
  await p.goto('file://' + path.join(RAIZ, 'index.html'));
  await p.waitForFunction(() => window.__T_INICIO__, null, { timeout: 120000 });
  return { ctx, p, cdp, errores };
}
const espera = (p, ms) => p.waitForTimeout(ms);
const cerrarHoja = async (p) => { await p.evaluate(() => { try { window.__APP__.H.closeSheet([]); } catch (e) { /* */ } }); await espera(p, 450); };
// pone una pantalla (código que cambia S) y mide render() varias veces: solo JS, y JS + colocar la página
async function medirPantalla(p, prep, veces) {
  return p.evaluate(([code, n]) => {
    const A = window.__APP__; eval(code); A.render(); void document.body.offsetHeight;
    const js = [], todo = [];
    for (let i = 0; i < n; i++) { const t0 = performance.now(); A.render(); const t1 = performance.now(); void document.body.offsetHeight; const t2 = performance.now(); js.push(t1 - t0); todo.push(t2 - t0); }
    const m = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    return { jsMs: m(js), totalMs: m(todo), nodos: document.querySelectorAll('#app *').length, htmlKb: Math.round(document.querySelector('#content').innerHTML.length / 1024) };
  }, [prep, veces]);
}
const PANTALLAS = [
  ['Inicio', 'A.S.tab="inicio";A.S.inicioVista="";'],
  ['Movimientos · Resumen', 'A.S.tab="movimientos";A.S.movVista="resumen";'],
  ['Movimientos · Lista', 'A.S.tab="movimientos";A.S.movVista="lista";'],
  ['Movimientos · Lista (todo el tiempo)', 'A.S.tab="movimientos";A.S.movVista="lista";A.S.movPeriodo="todo";', 'A.S.movPeriodo=window.__PER0__;'],
  ['Movimientos · Calendario', 'A.S.tab="movimientos";A.S.movVista="calendario";'],
  ['Juntos', 'A.S.tab="juntos";'],
  ['Dinero', 'A.S.tab="dinero";'],
  ['Agenda', 'A.S.tab="agenda";'],
  ['Tú', 'A.S.tab="tu";'],
];
const HOJAS = [
  ['Botón +', 'A.S.tab="inicio";A.render();', 'A.openCrear()'],
  ['Gasto con teclado', 'A.S.tab="inicio";A.render();', 'A.H.crearIr(["gasto"])'],
  ['Filtros', 'A.S.tab="movimientos";A.S.movVista="lista";A.render();', 'A.H.movFiltrosAbrir([])'],
  ['Importar', 'A.S.tab="tu";A.render();', 'A.H.impAbrir([])'],
  ['Una cuenta', 'A.S.tab="dinero";A.render();', 'A.H.cuentaVer(["c1"])'],
  ['Un grupo', 'A.S.tab="juntos";A.render();', 'A.H.grupoVer(["g1"])', true],
];
async function largas(p, hacer, reposo) {
  await espera(p, 300); await p.evaluate(() => { window.__LT__.length = 0; });
  const t0 = Date.now(); await hacer(); await espera(p, reposo || 700);
  const lt = await p.evaluate(() => window.__LT__.slice());
  return { n: lt.length, maxMs: lt.length ? Math.max.apply(null, lt) : 0, sumaMs: lt.reduce((a, x) => a + x, 0), duroMs: Date.now() - t0 - (reposo || 700) };
}
async function memoria(cdp) {
  await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage');
  const h = await cdp.send('Runtime.getHeapUsage'), d = await cdp.send('Memory.getDOMCounters');
  return { heapMb: Math.round(h.usedSize / 1048576 * 10) / 10, nodos: d.nodes, oyentes: d.jsEventListeners };
}

async function medirJuego(b, juego) {
  const R = { juego, datos: JUEGOS[juego], freno: FRENO, arranque: {}, pantallas: [], hojas: [], largas: {}, memoria: {}, llamadas: {}, errores: [] };
  const log = (t) => console.error('[' + juego + '] ' + t);
  // 1) arranque (3 veces, página nueva cada vez = en frío)
  const arr = []; let s;
  for (let i = 0; i < 3; i++) {
    if (s) await s.ctx.close();
    s = await abrir(b, juego, { freno: FRENO });
    arr.push(await s.p.evaluate(() => { const mk = (n) => (performance.getEntriesByName(n)[0] || {}).startTime || 0;
      const fp = (performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint') || {}).startTime || 0;
      return { antes: mk('appjs-antes'), linea1: mk('appjs-primera-linea'), despues: mk('appjs-despues'), cascaron: window.__T_CASCARON__ || 0, inicio: window.__T_INICIO__, primeraPintura: fp, consultas: (window.__RED__ || {}).consultas }; }));
  }
  const k = (f) => r1(med(arr.map(f)));
  R.arranque = { hastaInicioMs: k((a) => a.inicio), primeraPinturaMs: k((a) => a.primeraPintura), antesDeAppJsMs: k((a) => a.antes), leerAppJsMs: k((a) => a.linea1 - a.antes), ejecutarAppJsMs: k((a) => a.despues - a.linea1),
    datosYPintarMs: k((a) => a.inicio - a.despues), consultasAlEntrar: arr[0].consultas, pasadas: arr.map((a) => Math.round(a.inicio)) };
  log('arranque ' + JSON.stringify(R.arranque));
  const { p, cdp } = s; await espera(p, 1500);
  await p.evaluate(() => { window.__PER0__ = window.__APP__.S.movPeriodo; });
  // 2) render() por pestaña
  for (const [nombre, prep, despues] of PANTALLAS) {
    const m = await medirPantalla(p, prep, juego === 'pesado' ? 3 : 5); if (despues) await p.evaluate((c) => { const A = window.__APP__; eval(c); }, despues);
    R.pantallas.push({ pantalla: nombre, jsMs: r1(m.jsMs), totalMs: r1(m.totalMs), nodos: m.nodos, htmlKb: m.htmlKb }); log(nombre + ' ' + r1(m.jsMs) + ' / ' + r1(m.totalMs) + ' ms, ' + m.nodos + ' nodos');
  }
  // 3) abrir hojas
  for (const [nombre, prep, abre, soloConGrupos] of HOJAS) {
    if (soloConGrupos && !JUEGOS[juego].grupos) { R.hojas.push({ hoja: nombre, nota: 'no hay grupos en este juego' }); continue; }
    await cerrarHoja(p);
    const m = await p.evaluate(([a, c]) => { const A = window.__APP__; eval(a); void document.body.offsetHeight; const t0 = performance.now(); eval(c); const t1 = performance.now(); void document.body.offsetHeight; const t2 = performance.now();
      const h = document.querySelector('#sheetHost') || document.body; return { js: t1 - t0, todo: t2 - t0, nodos: h.querySelectorAll('*').length, abierta: !!document.querySelector('#sheetBackdrop') || /grupo/.test(c) }; }, [prep, abre]);
    R.hojas.push({ hoja: nombre, jsMs: r1(m.js), totalMs: r1(m.todo), nodos: m.nodos, abierta: m.abierta }); log('hoja ' + nombre + ' ' + r1(m.todo) + ' ms');
    await espera(p, 500);
  }
  await cerrarHoja(p); await p.evaluate(() => { const A = window.__APP__; A.S.grupoVer = null; A.S.tab = 'inicio'; A.render(); });
  // 4) tareas largas (>50 ms) tocando de verdad
  const tabs = ['movimientos', 'juntos', 'dinero', 'tu', 'inicio'], porTab = [];
  for (const t of tabs) { const sel = '.tabbar [data-tab="' + t + '"]'; if (!(await p.$(sel))) continue; const x = await largas(p, () => p.click(sel)); porTab.push(Object.assign({ a: t }, x)); }
  R.largas.cambiarPestana = { toques: porTab.length, conTareaLarga: porTab.filter((x) => x.n).length, maxMs: Math.max(0, ...porTab.map((x) => x.maxMs)), detalle: porTab };
  await p.evaluate(() => { const A = window.__APP__; A.S.tab = 'movimientos'; A.S.movVista = 'resumen'; A.render(); });
  const meses = [];
  for (let i = 0; i < 4; i++) meses.push(await largas(p, () => p.evaluate(() => { const A = window.__APP__, per = String(A.S.movPeriodo || ''), m = /^m:(\d{4})-(\d{2})/.exec(per), d = m ? new Date(Number(m[1]), Number(m[2]) - 2, 1) : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    A.H.movMesElegir(['m:' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')]); }), 900));
  R.largas.cambiarMes = { toques: meses.length, conTareaLarga: meses.filter((x) => x.n).length, maxMs: Math.max(0, ...meses.map((x) => x.maxMs)), periodoFinal: await p.evaluate(() => window.__APP__.S.movPeriodo) };
  await p.evaluate(() => { const A = window.__APP__; A.S.movPeriodo = window.__PER0__; A.S.tab = 'inicio'; A.render(); A.openCrear(); }); await espera(p, 400);
  await p.evaluate(() => window.__APP__.H.crearIr(['gasto'])); await espera(p, 600);
  const teclas = [];
  for (const t of ['1', '2', '3', '4', '5']) { const sel = '#sheetHost [data-click="tecK|' + t + '"]'; if (!(await p.$(sel))) break; teclas.push(await largas(p, () => p.click(sel), 250)); }
  R.largas.teclearImporte = { toques: teclas.length, conTareaLarga: teclas.filter((x) => x.n).length, maxMs: Math.max(0, ...teclas.map((x) => x.maxMs)), msPorTecla: r1(med(teclas.map((x) => x.duroMs))) };
  await cerrarHoja(p);
  await p.evaluate(() => { const A = window.__APP__; A.S.tab = 'movimientos'; A.S.movVista = 'lista'; A.S.movPeriodo = 'todo'; A.render(); A.H.movBuscarAbrir([]); }); await espera(p, 500);
  const letras = [];
  if (await p.$('#movSearch')) for (const l of 'cena 12') letras.push(await largas(p, () => p.type('#movSearch', l), 300));
  R.largas.teclearBuscador = { toques: letras.length, conTareaLarga: letras.filter((x) => x.n).length, maxMs: Math.max(0, ...letras.map((x) => x.maxMs)), msPorLetra: r1(med(letras.map((x) => x.duroMs))), nota: 'buscando en todo el tiempo' };
  await p.evaluate(() => { const A = window.__APP__; A.H.movBuscarCerrar([]); });
  // fotogramas al bajar por la Lista (todo el tiempo) durante 2 s
  R.scrollLista = await p.evaluate(() => new Promise((ok) => { const A = window.__APP__; A.S.tab = 'movimientos'; A.S.movVista = 'lista'; A.S.movPeriodo = 'todo'; A.render(); window.scrollTo(0, 0);
    const d = []; let ult = performance.now(); const t0 = ult; const paso = () => { const t = performance.now(); d.push(t - ult); ult = t; window.scrollBy(0, 40); if (t - t0 < 2000) requestAnimationFrame(paso); else ok({ fotogramas: d.length, lentos33: d.filter((x) => x > 34).length, peorMs: Math.round(Math.max.apply(null, d)), filas: document.querySelectorAll('#content .row').length, altoPx: document.documentElement.scrollHeight }); };
    requestAnimationFrame(paso); }));
  await p.evaluate(() => { const A = window.__APP__; A.S.movPeriodo = window.__PER0__; A.S.tab = 'inicio'; A.render(); window.scrollTo(0, 0); });
  // 5) memoria: 50 cambios de pestaña y 30 hojas
  await espera(p, 800); const m0 = await memoria(cdp);
  for (let i = 0; i < 50; i++) { await p.evaluate((t) => { const A = window.__APP__; A.S.tab = t; A.S._entrando = true; A.render(); }, ['movimientos', 'juntos', 'dinero', 'agenda', 'tu', 'inicio'][i % 6]); await espera(p, 60); }
  await espera(p, 1200); const m1 = await memoria(cdp);
  for (let i = 0; i < 30; i++) { await p.evaluate((n) => { const A = window.__APP__; if (n % 3 === 0) A.openCrear(); else if (n % 3 === 1) A.H.crearIr(['gasto']); else A.H.cuentaVer(['c1']); }, i); await espera(p, 200); await cerrarHoja(p); }
  await espera(p, 1200); const m2 = await memoria(cdp);
  R.memoria = { alEmpezar: m0, tras50Pestanas: m1, tras30Hojas: m2 };
  log('memoria ' + JSON.stringify(R.memoria));
  R.errores = s.errores.slice(); await s.ctx.close();
  // 6) llamadas por pintado (otra página, con app.js envuelta, sin freno: aquí solo se cuenta)
  const ins = appInstrumentada(), s2 = await abrir(b, juego, { app: ins.src, freno: 1 }); await espera(s2.p, 1200);
  R.llamadas.alArrancar = await s2.p.evaluate(() => { const o = {}; Object.keys(window.__CNT__).forEach((k2) => { o[k2] = window.__CNT__[k2].n; }); return o; });
  for (const [nombre, prep, despues] of PANTALLAS) {
    R.llamadas[nombre] = await s2.p.evaluate((code) => { const A = window.__APP__; eval(code); A.render(); window.__CNT__ = {}; const t0 = performance.now(); A.render(); const total = performance.now() - t0;
      const o = { _renderMs: Math.round(total * 10) / 10 }; Object.keys(window.__CNT__).forEach((k2) => { const c = window.__CNT__[k2]; if (k2 !== 'render') o[k2] = { n: c.n, ms: Math.round(c.ms * 10) / 10 }; }); return o; }, prep);
    if (despues) await s2.p.evaluate((c) => { const A = window.__APP__; eval(c); }, despues);
  }
  R.errores = R.errores.concat(s2.errores); await s2.ctx.close();
  return R;
}
function pesos() {
  const zlib = require('zlib'), out = [];
  const uno = (f) => { const b = fs.readFileSync(path.join(RAIZ, f)); return { archivo: f, kb: r1(b.length / 1024), gzipKb: r1(zlib.gzipSync(b).length / 1024) }; };
  ['index.html', 'app.js', 'data-layer.js', 'auth-signup.js', 'app.css', 'look.css', 'fonts/fonts.css'].forEach((f) => { if (fs.existsSync(path.join(RAIZ, f))) out.push(uno(f)); });
  const carpeta = (d, re) => fs.readdirSync(path.join(RAIZ, d)).filter((f) => re.test(f)).map((f) => ({ f, kb: fs.statSync(path.join(RAIZ, d, f)).size / 1024 }));
  const fu = carpeta('fonts', /\.woff2$/), lo = carpeta('logos', /\.(png|svg|webp|jpg)$/);
  out.push({ archivo: 'fonts/*.woff2 (' + fu.length + ')', kb: r1(fu.reduce((a, x) => a + x.kb, 0)), gzipKb: null, detalle: fu.map((x) => x.f + ' ' + r1(x.kb)) });
  out.push({ archivo: 'logos/* (' + lo.length + ')', kb: r1(lo.reduce((a, x) => a + x.kb, 0)), gzipKb: null });
  return out;
}
function aMarkdown(T) {
  const L = [], f = (c) => '| ' + c.join(' | ') + ' |', J = T.juegos, col = J.map((j) => j.juego);
  L.push('# Medidas de rendimiento (' + T.fecha + ')', '', 'Chromium sin ventana, móvil 390×844, CPU frenada ' + T.freno + '×. Datos inventados. Tiempos en milisegundos (mediana).', '');
  L.push('## Arranque (hasta ver Inicio con datos)', '', f(['Tramo'].concat(col)), f(['---'].concat(col.map(() => '---:'))));
  [['Hasta ver Inicio', 'hastaInicioMs'], ['Primera pintura', 'primeraPinturaMs'], ['Antes de app.js (HTML y CSS)', 'antesDeAppJsMs'], ['Leer app.js', 'leerAppJsMs'], ['Ejecutar app.js', 'ejecutarAppJsMs'], ['Llegan datos y se pinta', 'datosYPintarMs'], ['Consultas al entrar (simuladas)', 'consultasAlEntrar']].forEach(([t, k]) => L.push(f([t].concat(J.map((j) => j.arranque[k])))));
  L.push('', '## render() por pantalla: JS + colocar (solo JS) · nodos', '', f(['Pantalla'].concat(col)), f(['---'].concat(col.map(() => '---:'))));
  J[0].pantallas.forEach((x, i) => L.push(f([x.pantalla].concat(J.map((j) => { const y = j.pantallas[i]; return y.totalMs + ' (' + y.jsMs + ') · ' + y.nodos; })))));
  L.push('', '## Abrir hojas: JS + colocar · nodos de la hoja', '', f(['Hoja'].concat(col)), f(['---'].concat(col.map(() => '---:'))));
  J[0].hojas.forEach((x, i) => L.push(f([x.hoja].concat(J.map((j) => { const y = j.hojas[i]; return y.nota ? '—' : y.totalMs + ' · ' + y.nodos + (y.abierta ? '' : ' (no se abrió)'); })))));
  L.push('', '## Tareas largas (> 50 ms): toques con tarea larga / toques · la peor', '', f(['Gesto'].concat(col)), f(['---'].concat(col.map(() => '---:'))));
  [['Cambiar de pestaña', 'cambiarPestana'], ['Cambiar de mes', 'cambiarMes'], ['Teclear el importe', 'teclearImporte'], ['Teclear en el buscador', 'teclearBuscador']].forEach(([t, k]) => L.push(f([t].concat(J.map((j) => { const y = j.largas[k]; return y.conTareaLarga + '/' + y.toques + ' · ' + y.maxMs + ' ms'; })))));
  L.push(f(['Bajar por la Lista 2 s: fotogramas lentos / total · peor'].concat(J.map((j) => j.scrollLista.lentos33 + '/' + j.scrollLista.fotogramas + ' · ' + j.scrollLista.peorMs + ' ms (' + j.scrollLista.filas + ' filas)'))));
  L.push('', '## Memoria: MB de JS · nodos · oyentes', '', f(['Momento'].concat(col)), f(['---'].concat(col.map(() => '---:'))));
  [['Al empezar', 'alEmpezar'], ['Tras 50 cambios de pestaña', 'tras50Pestanas'], ['Tras 30 hojas', 'tras30Hojas']].forEach(([t, k]) => L.push(f([t].concat(J.map((j) => { const y = j.memoria[k]; return y.heapMb + ' · ' + y.nodos + ' · ' + y.oyentes; })))));
  L.push('', '## Llamadas por pintado (veces · ms dentro, sin freno)', '');
  J.forEach((j) => { L.push('### ' + j.juego, '', f(['Pantalla', 'Las 6 que más tiempo se llevan']), f(['---', '---']));
    Object.keys(j.llamadas).filter((k) => k !== 'alArrancar').forEach((k) => { const o = j.llamadas[k]; const top = Object.keys(o).filter((n) => n[0] !== '_').sort((a, b2) => o[b2].ms - o[a].ms || o[b2].n - o[a].n).slice(0, 6).map((n) => n + ' ×' + o[n].n + ' (' + o[n].ms + ')'); L.push(f([k + ' (' + o._renderMs + ' ms)', top.join(', ')])); }); L.push(''); });
  L.push('## Peso de los archivos', '', f(['Archivo', 'KB', 'KB comprimido (gzip)']), f(['---', '---:', '---:']));
  T.pesos.forEach((x) => L.push(f([x.archivo, x.kb, x.gzipKb == null ? '(ya comprimido)' : x.gzipKb])));
  const err = J.reduce((a, j) => a.concat(j.errores.map((e) => j.juego + ': ' + e)), []); L.push('', '## Errores de la app durante la medición', '', err.length ? err.map((e) => '- ' + e).join('\n') : 'Ninguno.', '');
  return L.join('\n');
}
(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const b = await chromium.launch(), T = { fecha: new Date().toISOString().slice(0, 10), freno: FRENO, juegos: [], pesos: pesos() };
  for (const j of CUALES) { T.juegos.push(await medirJuego(b, j)); fs.writeFileSync(path.join(SALIDA, 'resultados.json'), JSON.stringify(T, null, 1)); }
  await b.close();
  fs.writeFileSync(path.join(SALIDA, 'resultados.md'), aMarkdown(T));
  console.log(aMarkdown(T));
})().catch((e) => { console.error(e); process.exit(1); });

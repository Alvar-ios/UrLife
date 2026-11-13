// C4 de docs/11: capturas de las pantallas principales (390 y 375 px, claro y oscuro) y aviso de textos cortados
// o que se salen de la pantalla. Uso: node tests/capturas/revisar.js [carpeta-de-salida]
// Datos inventados (datos-falsos.js). No toca Supabase ni nada real. No forma parte de `npm test` (necesita Chromium).
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
// 12/11 (A4 de docs/40) · opciones (todas opcionales; sin ninguna hace lo de siempre):
//   --anchos=320,360,390,412   anchos de móvil (alto 844; con --alto=667 otro alto)
//   --temas=claro,oscuro       temas
//   --letra=130                letra del sistema al 130 % (imita el «textZoom» del WebView de Android: agranda TODA la letra, también la puesta en px)
//   --tableta                  añade tableta en horizontal (1024 × 768)
//   --teclado                  solo las hojas, con 500 px de alto (como con el teclado del móvil abierto): avisa de campos tapados
//   --medir                    mide zonas de toque < 44 px, contraste por debajo de AA y botones sin nombre → medidas.json
//   --mas                      añade las pantallas y hojas extra (Avisos, cuenta, persona, meta, filtros, importar…)
//   --idioma=en                la app en inglés (C1 de docs/40); las capturas acaban en «-en»
//   --solo=inicio,tu           solo esas pantallas · --sin-basico  no hace las de «Lo básico» · --entera  captura la página entera · --x1  capturas a escala 1
const ARG = {}; const LIBRES = [];
process.argv.slice(2).forEach((a) => { const m = /^--([a-z0-9-]+)(?:=(.*))?$/.exec(a); if (m) ARG[m[1]] = m[2] === undefined ? true : m[2]; else LIBRES.push(a); });
const RAIZ = path.join(__dirname, '..', '..'), SALIDA = path.resolve(LIBRES[0] || path.join(__dirname, 'salida'));
const ANCHOS = ARG.anchos ? String(ARG.anchos).split(',').map(Number) : [390, 375];
const TEMAS = (ARG.temas ? String(ARG.temas).split(',') : ['claro', 'oscuro']).map((t) => (/osc|dark/.test(t) ? 'dark' : 'light'));
const LETRA = ARG.letra ? Number(ARG.letra) / 100 : 1, ALTO = ARG.teclado ? 500 : Number(ARG.alto) || 844, ESCALA = ARG.x1 ? 1 : 2;
// puente falso de la app de Android (para ver Tú → Avisos): no lee ni manda nada
const NATIVO = (activo) => 'window.__nativo={notif:{permiso:async()=>"granted",pedir:async()=>"granted",programar:async()=>{}},avisosBanco:{estado:async()=>(' + JSON.stringify(activo ? { activo: true, permiso: true, avisarme: true, pendientes: 2, bancos: ['es.bancosantander.apps', 'com.myinvestor.app', 'com.ejemplo.banco'], candidatos: [{ pkg: 'com.ejemplo.pagosdeprueba', nombre: 'Banco de Prueba con Nombre Largo' }] } : { activo: false, permiso: false }) + '),configurar:async()=>{},pendientes:async()=>[],quitar:async()=>{},vaciar:async()=>{},abiertoDesdeAviso:async()=>false,alAbrirDesdeAviso:()=>{}}};';
const AVISOS_MOVS = 'A.S.movimientos=A.S.movimientos.filter((m)=>m.origen!=="aviso").concat([["Supermercado de la esquina con nombre largo",23.45,"Gasto","Supermercado"],["Bizum recibido",15,"Ingreso","Otros ingresos"],["Gasolinera",52.1,"Gasto","Transporte"]].map((x,i)=>({id:"av"+i,tipo:x[2],categoria:x[3],importe:x[1],fecha:new Date().toISOString().slice(0,10),descripcion:x[0],origen:"aviso",creadoEn:Date.now()-i*1000})));';
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
  ['tu-dinero', 'A.S.tab="tu";A.S.tuSub="dinero";A.render()'], // 13/11: Tú por temas
  ['tu-herramientas', 'A.S.tab="tu";A.S.tuSub="herramientas";A.render()'],
  ['moneda', 'A.S.tab="juntos";A.render();A.H.compRapido(["g:"+C.G1]);setTimeout(()=>{A.H.monAbrir([]);setTimeout(()=>{const el=document.querySelector("#monImporte");el.value="120";A.H.monImporte([],el);},150);},150)'],
  ['viaje', 'A.S.tab="juntos";A.render();A.H.grupoVer([C.G1]);setTimeout(()=>{A.H.temaVer(["tv1"]);A.H.temaCerrarPre(["tv1"]);},150)'],
  ['trayecto', 'A.S.tab="inicio";A.render();A.H.trAbrir([]);setTimeout(()=>{A.H.trModo(["km"]);setTimeout(()=>{const el=document.querySelector("#trKm");el.value="1.234";A.H.trKm([],el);A.H.trPers([1]);A.H.trPers([1]);},100);},150)'],
  ['trayecto-sitios', 'A.S.tab="inicio";A.render();A.H.trAbrir([]);setTimeout(()=>{A.H.trModo(["sitios"]);A.H.trGrupo(["electrico"]);},150)'],
  ['trayecto-recogido', 'A.S.config=Object.assign({},A.S.config,{trayecto:{prod:"goA",consumo:5.8,provincia:"28",guardados:[{id:"tg1",nombre:"Casa – trabajo",km:23,vuelta:true}]}});A.S.preciosCarb={prov:"28",cuando:Date.now(),datos:{goA:{precio:1.459,provincia:"28",fecha:"2026-11-07"}}};A.S.tab="inicio";A.render();A.H.trAbrir([])'],
  ['mas', 'A.S.tab="inicio";A.S.inicioSub="";A.S.inicioVista="";A.render();A.openCrear()'],
  // 11/11 (Calidad, tandas 1-3): gasto con el teclado propio, tarjeta «Tu mes» en Inicio y hojas largas con la barra fija
  ['gasto-teclado', 'A.S.tab="inicio";A.render();A.openCrear();setTimeout(()=>{A.H.crearIr(["gasto"]);setTimeout(()=>{["1","2","3"].forEach((k)=>{const b=document.querySelector("#sheetHost [data-click=\\"tecK|"+k+"\\"]");if(b)b.click();});},150);},150)'],
  ['inicio-tumes', 'const c=Object.assign({},A.S.config);delete c.mesInicio;delete c.tuMesSug;A.S.config=c;const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-1);const f=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-27";A.S.movimientos=A.S.movimientos.filter((m)=>m.categoria!=="Nómina").concat([{id:"cap-nom",tipo:"Ingreso",categoria:"Nómina",importe:1850,fecha:f}]);A.S.tab="inicio";A.render()'],
  ['hoja-meta-nueva', 'A.S.tab="dinero";A.render();A.H.metaNueva([])'],
  ['hoja-editar-mov', 'A.S.tab="movimientos";A.render();A.H.openMovForm([A.S.movimientos[0].id])'],
];
// 12/11 (A4 de docs/40): más pantallas y hojas, con --mas. Las que acaban en «hoja-» o abren hoja sirven también para --teclado
const PANTALLAS_MAS = [
  ['inicio-avisos', AVISOS_MOVS + 'A.S.tab="inicio";A.render()'],
  ['tu-android', NATIVO(true) + 'A.S.tab="tu";A.render()'],
  ['tu-seguridad-android', NATIVO(true) + 'A.S.tab="tu";A.S.tuSub="seguridad";A.render()'],
  ['tu-herr-apagadas', 'A.S.config=Object.assign({},A.S.config,{herramientas:{agenda:false,juntos:false,deudas:false,inversiones:false}});A.S.tab="tu";A.S.tuSub="herramientas";A.render()'],
  ['mas-herr-apagadas', 'A.S.config=Object.assign({},A.S.config,{herramientas:{agenda:false,juntos:false,deudas:false,inversiones:false,trayecto:false}});A.S.tab="inicio";A.render();A.openCrear()'],
  ['tu-mas', 'A.S.tab="tu";A.S.tuMas=true;A.render();setTimeout(()=>{const e=document.querySelector(".tu-mas, [data-click^=tuMasToggle]");if(e)e.scrollIntoView();},100)'],
  ['hoja-avisos', NATIVO(true) + 'A.S.tab="tu";A.render();A.H.avAbrir([])'],
  ['hoja-avisos-explica', NATIVO(false) + 'A.S.tab="tu";A.render();A.H.avAbrir([])'],
  ['mov-calendario', 'A.S.tab="movimientos";A.render();A.H.setMovVista(["calendario"])'],
  ['agenda-calendario', 'A.H.irAgenda(["calendario"])'],
  ['hoja-cuenta', 'A.S.tab="dinero";A.render();A.H.cuentaVer(["c1"])'],
  ['hoja-cuentas', 'A.S.tab="dinero";A.render();A.H.openCuentas([])'],
  ['hoja-persona', 'A.S.tab="juntos";A.render();A.H.personaVer(["u-ana"])'],
  ['hoja-compartir', 'A.S.tab="juntos";A.render();A.H.compRapido(["g:"+C.G1])'],
  ['hoja-origen', 'A.S.tab="juntos";A.render();A.H.origenVer([C.G1])'],
  ['hoja-meta', 'A.S.tab="dinero";A.render();A.H.metaVer(["mt1"])'],
  ['hoja-aportar', 'A.S.tab="dinero";A.render();A.H.metaAportarR(["mt1"])'],
  ['hoja-deuda', 'A.S.tab="dinero";A.render();A.H.deudaVer(["Préstamo del coche"])'],
  ['hoja-deuda-nueva', 'A.S.tab="dinero";A.render();A.H.deudaNueva([])'],
  ['hoja-tarea', 'A.S.tab="agenda";A.render();A.H.openTareaForm([])'],
  ['hoja-filtros', 'A.S.tab="movimientos";A.render();A.H.movFiltrosAbrir([])'],
  ['hoja-mes', 'A.S.tab="movimientos";A.render();A.H.movMesAbrir([])'],
  ['hoja-traspaso', 'A.S.tab="dinero";A.render();A.H.openTraspaso([])'],
  ['hoja-fijos', 'A.S.tab="tu";A.render();A.H.openRecurrentes([])'],
  ['hoja-fijo-nuevo', 'A.S.tab="tu";A.render();A.H.recNuevo(["pago"])'],
  ['hoja-importar', 'A.S.tab="tu";A.render();A.H.impAbrir([])'],
  ['hoja-aspecto', 'A.S.tab="tu";A.render();A.H.openAspecto([])'],
  ['hoja-tu-mes', 'A.S.tab="tu";A.render();A.H.tuMesAbrir([])'],
  ['hoja-perfil', 'A.S.tab="tu";A.render();A.H.tuNombreAbrir([])'],
  ['hoja-buscar', 'A.S.tab="inicio";A.render();A.H.openBuscar([])'],
  ['hoja-informe', 'A.S.tab="inicio";A.render();A.H.infAbrir([])'],
  ['hoja-borrar-cuenta', 'A.S.tab="tu";A.render();A.H.borrarCuentaAbrir([])'],
  ['hoja-salir', 'A.S.tab="tu";A.render();A.H.logoutPreguntar([])'],
  ['hoja-novedades', 'A.S.tab="tu";A.render();A.H.verNovedades(["1"])'],
  ['hoja-ingreso', 'A.S.tab="inicio";A.render();A.openCrear();setTimeout(()=>{A.H.crearIr(["ingreso"]);},150)'],
];
// letra del sistema más grande: se agranda la letra de cada elemento, también la que está en px (lo que hace el WebView de Android)
function agrandarLetra(f) {
  const els = Array.from(document.querySelectorAll('body, body *')).filter((e) => !(e instanceof SVGElement));
  const t = els.map((e) => (e.dataset.lz ? null : parseFloat(getComputedStyle(e).fontSize)));
  els.forEach((e, i) => { if (t[i]) { e.style.fontSize = (t[i] * f).toFixed(2) + 'px'; e.dataset.lz = '1'; } });
}
// con el teclado abierto (500 px de alto): ¿se ve cada campo de la hoja al enfocarlo? ¿y el botón principal?
async function revisarTeclado() {
  const out = [], sh = document.querySelector('#sheetBackdrop .sheet'); if (!sh) return out;
  const campos = Array.from(sh.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select')).filter((e) => e.getBoundingClientRect().width > 0);
  for (const c of campos) {
    c.focus(); await new Promise((r) => setTimeout(r, 350)); // 12/11: la app pone el campo a la vista 250 ms después de enfocarlo (verCampoEnHoja)
    const r = c.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, t = y >= 0 && y <= window.innerHeight ? document.elementFromPoint(x, y) : null;
    const quien = c.id || c.name || c.placeholder || c.tagName;
    if (r.bottom > window.innerHeight + 1 || r.top < 0) out.push({ tipo: 'campo fuera de la vista con el teclado', donde: quien, txt: 'de ' + Math.round(r.top) + ' a ' + Math.round(r.bottom) + ' px (se ven ' + window.innerHeight + ')' });
    else if (t && t !== c && !c.contains(t) && !t.contains(c) && !(t.closest('label') && t.closest('label').contains(c))) out.push({ tipo: 'campo tapado con el teclado', donde: quien, txt: 'lo tapa ' + t.tagName.toLowerCase() + '.' + String(t.className).split(' ')[0] });
  }
  const sr = sh.getBoundingClientRect(); if (sr.top < 0) out.push({ tipo: 'la hoja se sale por arriba', donde: 'sheet', txt: Math.round(sr.top) + ' px' });
  const libre = (() => { const a = sh.querySelector('.actions.fija'); return a ? a.getBoundingClientRect().top - Math.max(0, sr.top) : null; })();
  if (libre != null && libre < 160) out.push({ tipo: 'poco sitio sobre los botones', donde: 'sheet', txt: Math.round(libre) + ' px para el contenido' });
  return out;
}
// medidas: zonas de toque, nombres para lectores de pantalla y contraste
function medirPagina() {
  const W = window.innerWidth, raiz = document.querySelector('#sheetBackdrop') ? '#sheetHost' : 'body', out = { toque: [], nombre: [], contraste: [] };
  const vis = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0'; };
  const nom = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const extra = (el, ps) => { const s = getComputedStyle(el, ps); if (s.content === 'none' || s.position !== 'absolute') return [0, 0]; const n = (v) => (parseFloat(v) < 0 ? -parseFloat(v) : 0); return [n(s.left) + n(s.right), n(s.top) + n(s.bottom)]; };
  document.querySelectorAll(raiz + ' [data-click], ' + raiz + ' button, ' + raiz + ' a[href], ' + raiz + ' select, ' + raiz + ' input:not([type=hidden])').forEach((el) => {
    if (!vis(el) || el.disabled) return;
    const r = el.getBoundingClientRect(); if (r.right < 0 || r.left > W) return;
    const a = extra(el, '::after'), b = extra(el, '::before'), w = r.width + Math.max(a[0], b[0]), h = r.height + Math.max(a[1], b[1]);
    const txt = (el.getAttribute('aria-label') || el.textContent || el.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    if (el.tagName !== 'INPUT' && (w < 43.5 || h < 43.5)) out.toque.push({ donde: nom(el), txt, w: Math.round(w), h: Math.round(h), accion: (el.getAttribute('data-click') || '').split('|')[0] });
    const tieneNombre = (el.textContent || '').trim() || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.title || (el.querySelector && el.querySelector('img[alt]:not([alt=""])'));
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT') { const lab = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.id && document.querySelector('label[for="' + el.id + '"]')) || el.closest('label') || el.title; if (!lab) out.nombre.push({ donde: nom(el) + (el.id ? '#' + el.id : ''), txt: 'campo sin etiqueta' + (el.placeholder ? ' (solo el texto de ejemplo «' + el.placeholder.slice(0, 25) + '»)' : ''), accion: '' }); }
    else if (!tieneNombre) out.nombre.push({ donde: nom(el), txt: 'botón sin nombre', accion: (el.getAttribute('data-click') || '').split('|')[0] });
  });
  const rgba = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const p = m[1].split(/[, /]+/).map(Number); return [p[0], p[1], p[2], p.length > 3 && !isNaN(p[3]) ? p[3] : 1]; };
  const sobre = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat([1]);
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const hex = (c) => '#' + [0, 1, 2].map((i) => Math.round(c[i]).toString(16).padStart(2, '0')).join('');
  const fondo = (el) => { const capas = []; for (let p = el; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.backgroundImage && s.backgroundImage !== 'none') return null; const c = rgba(s.backgroundColor); if (c && c[3] > 0) { capas.push(c); if (c[3] >= 0.999) break; } }
    let base = [255, 255, 255, 1]; const cb = rgba(getComputedStyle(document.body).backgroundColor); if (cb && cb[3] > 0) base = cb; for (let i = capas.length - 1; i >= 0; i--) base = sobre(capas[i], base); return base; };
  document.querySelectorAll(raiz + ' *').forEach((el) => {
    if (el instanceof SVGElement || !vis(el)) return;
    if (!Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) return;
    const s = getComputedStyle(el); let op = 1; for (let p = el; p; p = p.parentElement) op *= parseFloat(getComputedStyle(p).opacity);
    const fg0 = rgba(s.color), bg = fondo(el); if (!fg0 || !bg || op < 0.05) return;
    fg0[3] *= op; const fg = sobre(fg0, bg), l1 = lum(fg), l2 = lum(bg), ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(s.fontSize), grande = px >= 24 || (px >= 18.66 && parseInt(s.fontWeight, 10) >= 700), min = grande ? 3 : 4.5;
    if (ratio < min - 0.05) out.contraste.push({ donde: nom(el), txt: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), letra: hex(fg), fondo: hex(bg), ratio: Math.round(ratio * 100) / 100, min, px: Math.round(px), apagado: !!(el.closest('[disabled], .disabled, .off') ) });
  });
  return out;
}
// 10/11 (docs/38, C1): «Lo básico» a 375 × 667 y 390 × 844. [id, variante de datos-falsos.js, código]
const PANTALLAS_BASICO = [
  ['b-inicio', 'basico', 'A.S.tab="inicio";A.render()'],
  ['b-mas', 'basico', 'A.S.tab="inicio";A.render();A.openCrear()'],
  ['b-mas-abierto', 'basico', 'A.S.tab="inicio";A.render();A.openCrear();A.H.crearMasToggle([])'],
  ['b-tu', 'basico', 'A.S.tab="tu";A.render()'],
  ['b-catalogo', 'basico', 'A.S.tab="inicio";A.render();A.H.descAbrir([])'],
  ['b-que-ves', 'basico', 'A.S.tab="tu";A.render();A.H.nivelAbrir([])'],
  ['b-invitado', 'invitado', 'A.S.tab="inicio";A.render()'],
  ['b-bienvenida-1', 'bienvenida', ''],
  ['b-bienvenida-2', 'bienvenida', 'A.H.obNext([])'],
  ['b-bienvenida-avisos', 'bienvenida', NATIVO(false) + 'A.H.obNext([]);A.H.obNext([])'], // 13/11: bienvenida por pasos (Android)
  ['b-bienvenida-banco-avisos', 'bienvenida', NATIVO(false) + 'A.H.obNext([]);A.H.obNext([]);A.H.obNext(["no"])'],
];
// en la página: busca textos cortados (sin «…» a propósito) y cosas que se salen por la derecha
function revisarPagina() {
  const out = [], W = window.innerWidth, vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const enScroll = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 1) return true; } return false; };
  const nombre = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  if (document.documentElement.scrollWidth > W + 1) out.push({ tipo: 'scroll lateral', donde: 'página', txt: 'la página se puede mover a los lados (' + document.documentElement.scrollWidth + ' px)' });
  const SEL = document.querySelector('#sheetBackdrop') ? '#sheetHost *' : '#app *';
  document.querySelectorAll(SEL).forEach((el) => {
    if (!vis(el) || enScroll(el) || (el.classList && el.classList.contains('sr-only'))) return; // 13/11: lo que solo lee el lector de pantalla está recortado a propósito
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
  // 12/11: importes partidos en dos líneas («381,09 / €»)
  document.querySelectorAll(SEL).forEach((el) => { if (!vis(el)) return; el.childNodes.forEach((n) => { if (n.nodeType !== 3) return;
    const re = /[−+-]?\d[\d.,]*\s(€|\$|£)/g; let m; while ((m = re.exec(n.textContent))) {
      const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
      const rs = Array.from(rg.getClientRects()).filter((r) => r.width > 0); if (rs.length > 1 && Math.abs(rs[rs.length - 1].top - rs[0].top) > 4) out.push({ tipo: 'importe partido en dos líneas', donde: nombre(el), txt: m[0] });
    } }); });
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
  const b = await chromium.launch(), informe = [], medidas = [];
  let LISTA = PANTALLAS.concat(ARG.mas ? PANTALLAS_MAS : []);
  if (ARG.solo) { const q = String(ARG.solo).split(','); LISTA = LISTA.filter((x) => q.indexOf(x[0]) >= 0); }
  if (ARG.teclado) LISTA = LISTA.filter((x) => /^hoja-|^gasto-teclado|^moneda|^trayecto$|^mas$/.test(x[0]));
  const TAM = ANCHOS.map((a) => [a, ALTO]).concat(ARG.tableta ? [[1024, 768]] : []);
  for (const [ancho, alto] of TAM) for (const tema of TEMAS) {
    const ctx = await b.newContext({ viewport: { width: ancho, height: alto }, colorScheme: tema, deviceScaleFactor: ESCALA });
    if (ARG.idioma) await ctx.addInitScript((l) => { try { localStorage.setItem('idioma', l); } catch (e) { /* */ } }, String(ARG.idioma));
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
    for (const [id, js] of LISTA) {
      await p.evaluate(() => { const A = window.__APP__; try { A.H.closeSheet([]); } catch (e) { /* */ } delete window.__nativo; A.S.tuMas = false; window.scrollTo(0, 0); });
      await p.waitForTimeout(350);
      try { await p.evaluate((code) => { const A = window.__APP__, C = window.__CAPTURAS__; eval(code); }, js); } catch (e) { errores.push(id + ': ' + e.message); }
      await p.waitForTimeout(700);
      if (LETRA !== 1) { await p.evaluate(agrandarLetra, LETRA); await p.waitForTimeout(150); }
      const fallos = await p.evaluate(revisarPagina);
      if (ARG.teclado) (await p.evaluate(revisarTeclado)).forEach((x) => fallos.push(x));
      if (ARG.medir) medidas.push({ pantalla: id, ancho, tema, m: await p.evaluate(medirPagina) });
      const f = id + '-' + ancho + (alto !== 844 ? 'x' + alto : '') + (LETRA !== 1 ? '-letra' + Math.round(LETRA * 100) : '') + '-' + (tema === 'dark' ? 'oscuro' : 'claro') + (ARG.idioma ? '-' + ARG.idioma : '') + '.png';
      const hayHoja = await p.evaluate(() => !!document.querySelector('#sheetBackdrop'));
      await p.screenshot({ path: path.join(SALIDA, f), fullPage: !!ARG.entera && !hayHoja });
      informe.push({ pantalla: id, ancho, tema, captura: f, fallos });
      if (LETRA !== 1) await p.evaluate(() => document.querySelectorAll('[data-lz]').forEach((e) => { e.style.fontSize = ''; delete e.dataset.lz; }));
    }
    if (errores.length) informe.push({ pantalla: '(errores de la app)', ancho, tema, fallos: errores.map((m) => ({ tipo: 'error', donde: '', txt: m })) });
    await ctx.close();
  }
  for (const [ancho, alto] of (ARG['sin-basico'] || ARG.solo || ARG.teclado ? [] : [[375, 667], [390, 844]])) for (const tema of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: ancho, height: alto }, colorScheme: tema, deviceScaleFactor: 2 });
    if (ARG.idioma) await ctx.addInitScript((l) => { try { localStorage.setItem('idioma', l); } catch (e) { /* */ } }, String(ARG.idioma));
    const errores = [];
    for (const [id, variante, js] of PANTALLAS_BASICO) {
      const p = await ctx.newPage(); p.on('pageerror', (e) => errores.push(id + ': ' + e.message));
      await p.route('**/*', (r) => {
        const u = r.request().url();
        if (/data-layer\.js$/.test(u)) return r.fulfill({ path: path.join(__dirname, 'datos-falsos.js'), contentType: 'text/javascript' });
        if (/supabase|config\.js$|auth-signup\.js$|fonts\.g/.test(u)) return r.fulfill({ body: '', contentType: /css|fonts/.test(u) ? 'text/css' : 'text/javascript' });
        return r.continue();
      });
      await p.goto('file://' + path.join(RAIZ, 'index.html') + '#' + variante);
      await p.waitForFunction(() => window.__APP__ && document.querySelector('#app').textContent.length > 50, null, { timeout: 15000 });
      await p.waitForTimeout(700);
      try { await p.evaluate((code) => { const A = window.__APP__; eval(code); }, js); } catch (e) { errores.push(id + ': ' + e.message); }
      await p.waitForTimeout(700);
      const fallos = await p.evaluate(revisarPagina);
      if (id === 'b-inicio' || id === 'b-invitado') { const alto2 = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, v: window.innerHeight })); if (alto2.h > alto2.v + 1) fallos.push({ tipo: 'Inicio con scroll', donde: 'página', txt: alto2.h + ' px de ' + alto2.v }); }
      const f = id + '-' + ancho + 'x' + alto + '-' + (tema === 'dark' ? 'oscuro' : 'claro') + '.png';
      await p.screenshot({ path: path.join(SALIDA, f) });
      informe.push({ pantalla: id, ancho, tema, captura: f, fallos });
      await p.close();
    }
    if (errores.length) informe.push({ pantalla: '(errores de la app, Lo básico)', ancho, tema, fallos: errores.map((m) => ({ tipo: 'error', donde: '', txt: m })) });
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(path.join(SALIDA, 'informe.json'), JSON.stringify(informe, null, 1));
  if (ARG.medir) {
    fs.writeFileSync(path.join(SALIDA, 'medidas.json'), JSON.stringify(medidas, null, 1));
    const junta = (clave, firma) => { const m = new Map(); medidas.forEach((x) => x.m[clave].forEach((y) => { const k = firma(y, x); const o = m.get(k) || Object.assign({ veces: 0, pantallas: new Set() }, y); o.veces++; o.pantallas.add(x.pantalla); m.set(k, o); })); return Array.from(m.values()); };
    const tq = junta('toque', (y) => y.donde + '|' + y.accion + '|' + y.txt).sort((a, c) => Math.min(a.w, a.h) - Math.min(c.w, c.h));
    console.log('\nZONAS DE TOQUE < 44 px: ' + tq.length); tq.forEach((y) => console.log('    ' + y.w + '×' + y.h + ' — ' + y.donde + ' — «' + y.txt + '» [' + y.accion + '] — ' + Array.from(y.pantallas).slice(0, 3).join(', ')));
    const nb = junta('nombre', (y) => y.donde + '|' + y.accion + '|' + y.txt);
    console.log('\nSIN NOMBRE ACCESIBLE: ' + nb.length); nb.forEach((y) => console.log('    ' + y.donde + ' — ' + y.txt + ' [' + y.accion + '] — ' + Array.from(y.pantallas).slice(0, 3).join(', ')));
    const ct = junta('contraste', (y, x) => x.tema + '|' + y.letra + '|' + y.fondo + '|' + y.donde).sort((a, c) => a.ratio - c.ratio);
    console.log('\nCONTRASTE POR DEBAJO DE AA: ' + ct.length); ct.forEach((y) => console.log('    ' + y.ratio + ' (mín. ' + y.min + ') ' + y.letra + ' sobre ' + y.fondo + ' — ' + y.px + ' px — ' + y.donde + (y.apagado ? ' (apagado)' : '') + ' — «' + y.txt + '» — ' + Array.from(y.pantallas).slice(0, 3).join(', ')));
  }
  let total = 0;
  informe.forEach((x) => { if (!x.fallos.length) return; total += x.fallos.length; console.log('· ' + x.pantalla + ' ' + (x.ancho || '') + ' ' + (x.tema || '')); x.fallos.forEach((f) => console.log('    ' + f.tipo + ' — ' + f.donde + ' — «' + f.txt + '»')); });
  console.log(total ? total + ' avisos. Capturas en ' + SALIDA : 'Sin avisos. Capturas en ' + SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });

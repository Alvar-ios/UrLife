// 26/11/2026 · Calidad (docs/51, sesión 1): auditoría de INTERACCIÓN en un navegador de verdad (Chromium), tocando como un dedo.
// Uso:  node tests/capturas/interaccion.js [carpeta-de-salida] [opciones]
//   --vp=390x844,360x740     tamaños de móvil (por defecto esos dos; tema claro)
//   --partes=pantallas,botones,hojas,doble,anim,atras,guardar,recorridos   qué se revisa (por defecto, todo)
//   --solo=inicio,dinero     solo esas pantallas (ids de PANTALLAS)
//   --nivel2=40              cuántas hojas distintas se abren para tocar también sus botones (0 = ninguna). Solo en el primer tamaño
//   --tienda                 datos más «normales» (nómina este mes y el anterior), como revisar.js --tienda
//   --oscuro                 tema oscuro en vez de claro
//   --hojas-de=informe.json  (más rápido) solo toca los botones que en ese informe anterior abrían una hoja: sirve para mirar las hojas en otro tamaño
// Datos inventados (datos-falsos.js + lo que añade EXTRA_DATOS). No toca Supabase ni nada real. No va en `npm test` (necesita Chromium).
// Todo lo que se prueba se toca con page.touchscreen.tap en el centro del botón (si otra cosa lo tapa, el toque va a esa otra cosa, como en el móvil).
// Para preparar una pantalla sí se cambia el estado (S.tab, S.tuSub…), pero el paso que se prueba siempre es un toque.
// Salida: informe-interaccion.json en la carpeta (por defecto tests/capturas/salida/interaccion, que no se sube) y un resumen por consola.
// Revisa a mano lo marcado «dudoso». Hallazgos del 26/11 y arreglos propuestos: docs/salud/2026-11-26-interaccion.md.
// Tarda: unos 35 min a 390 px con todo; con --hojas-de y --nivel2=0, unos 10 min por tamaño. Con --solo y --partes, menos.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const ARG = {}; const LIBRES = [];
process.argv.slice(2).forEach((a) => { const m = /^--([a-z0-9-]+)(?:=(.*))?$/.exec(a); if (m) ARG[m[1]] = m[2] === undefined ? true : m[2]; else LIBRES.push(a); });
const RAIZ = path.join(__dirname, '..', '..'), SALIDA = path.resolve(LIBRES[0] || path.join(__dirname, 'salida', 'interaccion')); // dentro de salida/ (no se sube: .gitignore)
const VPS = String(ARG.vp || '390x844,360x740').split(',').map((s) => s.split('x').map(Number));
const PARTES = new Set(String(ARG.partes || 'pantallas,botones,hojas,doble,anim,atras,guardar,recorridos').split(','));
const NIVEL2 = ARG.nivel2 == null ? 40 : Number(ARG.nivel2);
const TEMA = ARG.oscuro ? 'dark' : 'light';
const URL_APP = 'file://' + path.join(RAIZ, 'index.html');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- datos: los de datos-falsos.js + funciones que allí faltan y contadores de escrituras ----------
const EXTRA_DATOS = `
;(function () {
  var D = window.Data, W = window.__ESCR__ = [];
  var nada = async function () { return {}; };
  D.recargar = D.recargar || function () {};
  D.carburantes = D.carburantes || { ultimos: async function () { return []; } };
  D.moviles = D.moviles || { registrar: nada, token: nada, listar: async function () { return []; }, quitar: nada, quitarTodos: nada };
  ['renombrar', 'foto', 'miNombre', 'edicion', 'reparto'].forEach(function (k) { if (!D.grupos[k]) D.grupos[k] = async function () { W.push(['grupos', k]); return [{ id: 'x' }]; }; });
  var tabla = function (nombre, base) { base = base || {}; var arr = [];
    return { suscribir: base.suscribir || function (next) { setTimeout(function () { next([]); }, 0); return function () {}; },
      crear: async function (o) { W.push([nombre, 'crear']); if (base.crear) return base.crear(o); var r = Object.assign({ id: nombre[0] + 'n' + Date.now() + Math.random().toString(36).slice(2, 5), creadoPor: 'u-yo', createdAt: new Date().toISOString() }, o); arr.push(r); return r; },
      editar: async function (id, o) { W.push([nombre, 'editar']); return Object.assign({ id: id }, o); },
      borrar: async function (id) { W.push([nombre, 'borrar']); return [{ id: id }]; },
      restaurar: async function (id) { W.push([nombre, 'restaurar']); return { id: id }; },
      guardar: async function (o) { W.push([nombre, 'guardar']); return o; }, quitar: async function () { W.push([nombre, 'quitar']); return []; } }; };
  ['compartidos', 'objetivos', 'carpetas', 'agenda', 'aportes'].forEach(function (k) { D[k] = tabla(k, D[k]); });
  var ap = D.agendaPermisos; ['crear', 'editar', 'borrar', 'ocultar', 'mostrar'].forEach(function (k) { if (!ap[k]) ap[k] = async function (o) { W.push(['agendaPermisos', k]); return Object.assign({ id: 'p1' }, o || {}); }; });
  var col = D.collection; D.collection = function (n) { var c = col(n), add = c.add, doc = c.doc;
    return { onSnapshot: c.onSnapshot, add: function (d) { W.push([n, 'add']); return add(d); },
      doc: function (id) { var dd = doc(id || ('n' + Math.random().toString(36).slice(2, 9))); return { id: dd.id, set: function (d) { W.push([n, 'set', dd.id]); return dd.set(d); }, update: function (d) { W.push([n, 'update', dd.id]); return dd.update(d); }, delete: function () { W.push([n, 'delete', dd.id]); return dd.delete(); } }; } }; };
  var docf = D.doc; D.doc = function (p) { var d = docf(p); return { get: d.get, onSnapshot: d.onSnapshot, set: function (v) { W.push([p, 'set']); return d.set(v); }, update: function (v) { W.push([p, 'update']); return d.update(v); } }; };
  var rpc = D.rpc; D.rpc = function (fn) { W.push(['rpc', fn]); return rpc.apply(this, arguments); };
})();`;
const DATOS = fs.readFileSync(path.join(__dirname, 'datos-falsos.js'), 'utf8') + EXTRA_DATOS;

// ---------- lo que se carga en la página antes que la app: efectos (abrir enlaces, compartir…) sin salir de la página, y medidores ----------
const INIT = String.raw`(function () {
  try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* */ } // cada carga, de cero (un toque puede cambiar el idioma o el tema y se guardaría)
  var ef = [];
  window.open = function (u) { ef.push('abre ' + String(u).slice(0, 70)); return { closed: false, close: function () {}, focus: function () {}, document: { write: function () {}, close: function () {} }, location: {} }; };
  try { navigator.share = async function (d) { ef.push('compartir ' + JSON.stringify(d || {}).slice(0, 60)); }; navigator.canShare = function () { return true; }; } catch (e) { /* */ }
  try { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async function (t) { ef.push('copia ' + String(t).slice(0, 40)); }, readText: async function () { return ''; }, write: async function () { ef.push('copia'); } } }); } catch (e) { /* */ }
  window.print = function () { ef.push('imprimir'); };
  try { navigator.vibrate = function () { return true; }; } catch (e) { /* */ }
  var ic = HTMLInputElement.prototype.click; HTMLInputElement.prototype.click = function () { if (this.type === 'file') { ef.push('elegir archivo'); return; } return ic.call(this); };
  HTMLAnchorElement.prototype.click = function () { ef.push('enlace ' + (this.download ? 'descarga ' + this.download : String(this.href).slice(0, 70))); };
  window.addEventListener('click', function (e) { var a = e.target && e.target.closest && e.target.closest('a[href]'); if (a && !/^#|^javascript:/.test(a.getAttribute('href') || '')) { ef.push('enlace ' + String(a.href).slice(0, 70)); e.preventDefault(); } });
  var vis = function (el) { if (!el || !el.getBoundingClientRect) return false; var r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (var p = el; p && p.nodeType === 1; p = p.parentElement) { var s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false; } return true; };
  // dentro de algo recortado (un desplegable cerrado, una fila que se desliza a los lados): no se ve, no se mira
  var recortado = function (el) { var dt = el.closest && el.closest('details'); if (dt && !dt.open && !el.closest('summary')) return true; /* <details> cerrado: tiene caja pero no se pinta */ var b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2; for (var p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) { if (p.classList.contains('sheet')) break; var s = getComputedStyle(p); if (s.overflowX !== 'visible' || s.overflowY !== 'visible') { var r = p.getBoundingClientRect(); if (r.height < 2 || cx < r.left - 1 || cx > r.right + 1 || cy < r.top - 1 || cy > r.bottom + 1) return true; } } return false; };
  var txt = function (el) { return String(el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || el.value || '').trim().replace(/\s+/g, ' '); };
  var nom = function (el) { if (el && el.nodeType !== 1) el = el.parentElement; if (!el || !el.tagName) return '(nada)'; var c = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''; return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c : '') + (txt(el) ? ' «' + txt(el).slice(0, 30) + '»' : ''); };
  var SEL = '[data-click], button, a[href], select, input[type=checkbox], input[type=radio], input[type=range], [role=button], [role=switch], [role=tab]';
  var raizDe = function (r) { return r === 'hoja' ? document.querySelector('#sheetBackdrop .sheet') : r === 'popup' ? document.querySelector('#popupBackdrop .popup') : r === 'barras' ? document.body : document.querySelector('#content'); };
  var claveBase = function (el) { return (el.getAttribute('data-click') || (el.tagName.toLowerCase() + (el.type ? '[' + el.type + ']' : '') + (el.id ? '#' + el.id : ''))) + '§' + txt(el).slice(0, 28); };
  var fijo = function (el) { for (var p = el; p && p.nodeType === 1; p = p.parentElement) { var s = getComputedStyle(p).position; if (s === 'fixed' || s === 'sticky') return p; } return null; };
  function lista(r) {
    var raiz = raizDe(r); if (!raiz) return [];
    var els = Array.prototype.slice.call(raiz.querySelectorAll(SEL)).filter(function (el) {
      if (r === 'barras' && !el.closest('.tabbar, .topbar')) return false;
      if (r !== 'barras' && el.closest('#sheetHost') && r !== 'hoja' && r !== 'popup') return false;
      if (r === 'hoja' && el.closest('#popupBackdrop')) return false;
      var dc = el.getAttribute('data-click'); if (dc === 'popupNada' || dc === 'popupCerrar' && el.id === 'popupBackdrop') return false;
      if (el.closest('.mov-fantasma, [aria-hidden="true"], [inert]')) return false;
      if (el.matches('.sw-dup, .sw-del, .sw-act, [class^="sw-"]')) return false; // botones de deslizar: están detrás de la fila a propósito
      return vis(el) && !el.disabled && !(el instanceof SVGElement) && !recortado(el); }); // los trozos del anillo (SVG) no se tocan en su centro: se prueban en las pruebas de jsdom
    var n = {}; return els.map(function (el) { var k = claveBase(el); n[k] = (n[k] || 0) + 1; return { el: el, k: k + '#' + n[k] }; });
  }
  function buscar(r, k) { var l = lista(r); for (var i = 0; i < l.length; i++) if (l[i].k === k) return l[i].el; return null; }
  // ¿qué hay de verdad en el centro del botón? (lo que recibiría el dedo)
  function quienRecibe(el) {
    var b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return { fuera: true, x: x, y: y };
    var t = document.elementFromPoint(x, y);
    var bien = !!t && (t === el || el.contains(t) || (t.tagName === 'LABEL' && t.contains(el)) || (t.closest('[data-click]') && t.closest('[data-click]') === el.closest('[data-click]') && !el.matches('[data-click]')));
    if (!bien && t && t.contains(el) && el.matches('input')) bien = true;
    if (!bien && t && t.contains(el) && getComputedStyle(t).contentVisibility === 'auto') bien = true; // content-visibility: auto (lista de Movimientos): se pinta en el fotograma siguiente; con el dedo no pasa
    return { bien: bien, x: x, y: y, quien: t ? nom(t) : '(nada)', capa: t ? (function () { var f = t.closest('.tabbar, .tab-crear, .topbar, .actions.fija, #toast, #pistaHost, .popup-backdrop, .sheet-backdrop, .descartar, .tec, .sheet-x'); return f ? nom(f).split(' «')[0] : ''; })() : '' };
  }
  // zona libre para tocar: entre la cabecera fija y la barra de abajo (pantalla) o entre lo pegado arriba y la barra de botones (hoja)
  function zonaLibre(r, el) {
    if (r === 'hoja') { var sh = raizDe('hoja'); if (!sh) return [0, innerHeight]; var sr = sh.getBoundingClientRect(), af = sh.querySelector('.actions.fija'); var abajo = Math.min(innerHeight, sr.bottom); if (af && getComputedStyle(af).position === 'sticky' && vis(af) && !(el && (af.compareDocumentPosition(el) & 4) && !af.contains(el))) abajo = Math.min(abajo, af.getBoundingClientRect().top); /* lo que va DESPUÉS de la barra se ve debajo de ella al final */ var tec = sh.querySelector('.tec:not([hidden])'); if (tec && vis(tec) && getComputedStyle(tec).position === 'sticky') abajo = Math.min(abajo, tec.getBoundingClientRect().top); return [Math.max(0, sr.top), abajo]; }
    var tb = document.querySelector('.topbar'), bar = document.querySelector('.tabbar');
    var arriba = tb && vis(tb) && /fixed|sticky/.test(getComputedStyle(tb).position) ? tb.getBoundingClientRect().bottom : 0;
    var ab = bar && vis(bar) ? bar.getBoundingClientRect().top : innerHeight; var cr = document.querySelector('.tab-crear'); if (cr && vis(cr)) ab = Math.min(ab, cr.getBoundingClientRect().top + 6);
    return [Math.max(0, arriba), ab];
  }
  function scroller(r) { return r === 'hoja' ? raizDe('hoja') : document.scrollingElement; }
  // Para cada botón: ¿se puede poner en la zona libre desplazando? ¿y entonces lo tapa algo?
  function revisarAlcance(r) {
    var out = [], sc = scroller(r); if (!sc) return out; var y0 = sc.scrollTop, max = sc.scrollHeight - sc.clientHeight;
    lista(r).forEach(function (it) {
      var el = it.el, fx = fijo(el); if (fx && (r !== 'hoja' || fx !== el.closest('.sheet-backdrop'))) return; // lo que va pegado (cabeceras, barra de botones) se mira aparte
      var z = zonaLibre(r, el), b = el.getBoundingClientRect(), c = b.top + b.height / 2, objetivo = (z[0] + z[1]) / 2;
      var nuevo = Math.max(0, Math.min(max, sc.scrollTop + (c - objetivo))); sc.scrollTop = nuevo;
      z = zonaLibre(r, el); b = el.getBoundingClientRect(); c = b.top + b.height / 2;
      var af = r === 'hoja' && raizDe('hoja').querySelector('.actions.fija'); if (af && (af.compareDocumentPosition(el) & 4) && !af.contains(el)) { var ab = af.getBoundingClientRect(); if (ab.bottom - b.top > 4 && b.bottom > ab.top) out.push({ tipo: 'medio tapado', donde: nom(el), k: it.k, txt: 'va después de la barra de botones y esta le tapa ' + Math.round(Math.min(b.height, ab.bottom - b.top)) + ' de ' + Math.round(b.height) + ' px' }); }
      if (c > z[1] - 2 || c < z[0] + 2) out.push({ tipo: 'no se llega', donde: nom(el), k: it.k, txt: 'centro a ' + Math.round(c) + ' px; zona libre ' + Math.round(z[0]) + '–' + Math.round(z[1]) + ' px con todo desplazado' });
      else { var q = quienRecibe(el); if (!q.bien && !q.fuera) out.push({ tipo: 'tapado', donde: nom(el), k: it.k, txt: 'lo tapa ' + q.quien + (q.capa ? ' (' + q.capa + ')' : '') }); }
    });
    sc.scrollTop = y0; return out;
  }
  // lo pegado arriba / abajo (cabecera, barra de pestañas, barra de botones de la hoja): ¿lo tapa algo?
  function revisarFijos(r) { var out = []; lista(r).forEach(function (it) { if (r !== 'barras' && !(r === 'hoja' && fijo(it.el) && fijo(it.el) !== it.el.closest('.sheet-backdrop'))) return; var q = quienRecibe(it.el); if (!q.bien && !q.fuera) out.push({ tipo: 'tapado', donde: nom(it.el), k: it.k, txt: 'lo tapa ' + q.quien + (q.capa ? ' (' + q.capa + ')' : '') }); }); return out; }
  function lateral() { var out = [], d = document.documentElement; if (d.scrollWidth > d.clientWidth + 1) out.push({ tipo: 'scroll lateral', donde: 'página', txt: d.scrollWidth + ' px de ' + d.clientWidth });
    var sh = raizDe('hoja'); if (sh && sh.scrollWidth > sh.clientWidth + 1) { var culpa = Array.prototype.slice.call(sh.querySelectorAll('*')).filter(function (e) { var b = e.getBoundingClientRect(); return b.width > 0 && b.right > sh.getBoundingClientRect().right + 1; }).slice(0, 2).map(nom).join(', '); out.push({ tipo: 'scroll lateral en la hoja', donde: 'hoja', txt: sh.scrollWidth + ' px de ' + sh.clientWidth + (culpa ? ' · se sale: ' + culpa : '') }); }
    return out; }
  // el último botón, con todo desplazado al final: ¿se ve y se puede tocar?
  function final(r) {
    var sc = scroller(r); if (!sc) return null; var y0 = sc.scrollTop; sc.scrollTop = sc.scrollHeight;
    var pegado = function (e) { var f = fijo(e); return r === 'hoja' ? !!f && f !== e.closest('.sheet-backdrop') : !!f; };
    var l = lista(r).filter(function (it) { return !pegado(it.el); });
    var u = l.sort(function (a, b) { return b.el.getBoundingClientRect().bottom - a.el.getBoundingClientRect().bottom; })[0];
    var res = null; if (u) { var z = zonaLibre(r, u.el), b = u.el.getBoundingClientRect(), q = quienRecibe(u.el); res = { ultimo: nom(u.el), abajo: Math.round(b.bottom), zona: Math.round(z[1]), bien: b.bottom <= z[1] + 1 && q.bien, quien: q.quien }; }
    var ultimoTexto = null; var tx = Array.prototype.slice.call((r === 'hoja' ? raizDe('hoja') : document.querySelector('#content')).querySelectorAll('*')).filter(function (e) { return vis(e) && Array.prototype.some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); }) && !pegado(e) && !recortado(e); });
    if (tx.length) { var t = tx.sort(function (a, b) { return b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom; })[0], z2 = zonaLibre(r, t); ultimoTexto = { txt: txt(t).slice(0, 40), abajo: Math.round(t.getBoundingClientRect().bottom), zona: Math.round(z2[1]) }; }
    sc.scrollTop = y0; return { boton: res, texto: ultimoTexto };
  }
  // medidores de cambios: cuántas veces se cambia algo, y cuántas se repinta entero #content
  var M = { mut: 0, repl: 0, obs: null, attrs: [] };
  function medir() { M.mut = 0; M.repl = 0; M.attrs = []; ef.length = 0; if (M.obs) M.obs.disconnect();
    M.obs = new MutationObserver(function (rs) { rs.forEach(function (r) { var tg = r.target && r.target.nodeType === 1 ? r.target : r.target && r.target.parentElement; if (tg && tg.closest('.confeti')) return; if (r.type === 'attributes' && r.attributeName === 'style' && tg && tg.classList.contains('seg-ind')) return; M.mut++; if (r.type === 'childList' && r.target.id === 'content' && r.removedNodes.length) M.repl++; if (M.attrs.length < 6) M.attrs.push(r.type + ':' + nom(r.target).slice(0, 40) + (r.attributeName ? '@' + r.attributeName : '')); }); });
    M.obs.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true }); }
  function leer() { var A = window.__APP__ || {}, S = A.S || {}, bd = document.querySelector('#sheetBackdrop'), sh = bd && bd.querySelector('.sheet'), pp = document.querySelector('#popupBackdrop');
    var h2 = sh && (sh.querySelector('h2, h3, .jv5-tit, .tit') || {}).textContent;
    return { mut: M.mut, repl: M.repl, attrs: M.attrs.slice(), ef: ef.slice(), escr: (window.__ESCR__ || []).filter(function (x) { return x[0] !== 'rpc' && !/^config\//.test(x[0]); }).length, escrCfg: (window.__ESCR__ || []).filter(function (x) { return /^config\//.test(x[0]); }).length, tab: S.tab, sub: [S.tuSub || '', S.dineroVer || '', S.juntosVer || '', S.inicioVista || '', S.movVista || '', S.agendaSub || ''].join('|'),
      hoja: bd ? { abierta: bd.classList.contains('open'), cerrando: !!bd.dataset.cerrando, titulo: String(h2 || (sh ? sh.textContent : '')).trim().replace(/\s+/g, ' ').slice(0, 50), kind: (A.form && A.form() || {}).kind || '' } : null,
      popup: pp ? String(pp.textContent).trim().replace(/\s+/g, ' ').slice(0, 50) : null, descartar: !!document.querySelector('#descartarHoja'),
      toast: (function () { var t = document.querySelector('#toast'); return t && t.classList.contains('show') ? String(t.textContent).trim().slice(0, 50) : ''; })(),
      y: Math.round(scrollY), hy: sh ? Math.round(sh.scrollTop) : null, titulo: (document.querySelector('#pageTitle') || {}).textContent || '', nHojas: document.querySelectorAll('#sheetBackdrop').length }; }
  // al final de una tanda de toques rápidos: ¿se ha quedado algo a medias?
  function restos() { var out = [], bd = document.querySelector('#sheetBackdrop');
    if (document.querySelectorAll('#sheetBackdrop').length > 1) out.push('hay ' + document.querySelectorAll('#sheetBackdrop').length + ' hojas a la vez');
    if (bd && (!bd.classList.contains('open') || bd.dataset.cerrando)) out.push('hoja fantasma (' + (bd.dataset.cerrando ? 'cerrándose' : 'sin abrir') + ')');
    if (bd && bd.classList.contains('open') && Number(getComputedStyle(bd).opacity) < 0.98) out.push('hoja con opacidad ' + getComputedStyle(bd).opacity);
    var sh = bd && bd.querySelector('.sheet'); if (sh && bd.classList.contains('open')) { var tr = getComputedStyle(sh).transform; if (tr && tr !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(tr)) out.push('hoja movida: transform ' + tr); }
    var A = window.__APP__ || {}, F = A.form && A.form(); var crear = document.body.classList.contains('crear-abierto'); if (crear && !(bd && !bd.dataset.cerrando && F && F.kind === 'crear')) out.push('el + se queda girado (body.crear-abierto) sin la hoja del +');
    var c = document.querySelector('#content'); if (c && c.classList.contains('entra')) out.push('#content con la clase «entra» pegada');
    if (document.querySelector('.mov-fantasma')) out.push('queda una copia del mes anterior (.mov-fantasma)');
    if (document.querySelector('.deslizando')) out.push('queda la clase «deslizando»');
    var parados = Array.prototype.slice.call(document.querySelectorAll('#content [class*="va-"]')).filter(function (e) { var b = e.getBoundingClientRect(); return b.height > 0 && b.top >= 0 && b.bottom <= innerHeight - 100 && !e.classList.contains('visto') && !e.classList.contains('ya'); });
    if (parados.length) out.push(parados.length + ' animaciones «al verse» sin arrancar en la vista (' + nom(parados[0]) + ')');
    var med = []; try { document.getAnimations().forEach(function (a) { var t = a.effect && a.effect.getComputedTiming && a.effect.getComputedTiming(); if (a.playState === 'running' && t && isFinite(t.endTime) && t.endTime > 0 && (a.currentTime || 0) > t.endTime + 50) med.push(nom(a.effect.target)); if (a.playState === 'paused') med.push('pausada ' + nom(a.effect && a.effect.target)); }); } catch (e) { /* */ }
    if (med.length) out.push('animaciones sin acabar: ' + med.slice(0, 2).join(', '));
    var ti = document.querySelector('.tabbar .tab.active'), S = A.S || {}; if (ti && S.tab && ti.getAttribute('data-tab') !== S.tab && !document.body.classList.contains('en-agenda')) out.push('pestaña marcada «' + ti.getAttribute('data-tab') + '» pero se ve «' + S.tab + '»');
    if (document.querySelector('#popupBackdrop') && !bd && false) out.push('ventanita');
    return out; }
  function cerrarTodo() { var A = window.__APP__; var pp = document.querySelector('#popupBackdrop'); if (pp) pp.remove(); var d = document.querySelector('#descartarHoja'); if (d) d.remove(); try { A.H.closeSheet([]); } catch (e) { /* */ } var h = document.querySelector('#sheetHost'); if (h) h.innerHTML = ''; document.body.classList.remove('crear-abierto'); var t = document.querySelector('#toast'); if (t) t.classList.remove('show'); var ph = document.querySelector('#pistaHost'); if (ph) ph.innerHTML = ''; }
  window.__AUD__ = { lista: function (r) { return lista(r).map(function (x) { return { k: x.k, nom: nom(x.el), dc: x.el.getAttribute('data-click') || '', sel: x.el.matches('.on, .active, .activo, .sel, [aria-selected="true"], [aria-pressed="true"], [aria-current="page"], [role=radio][aria-checked="true"], [role=tab][aria-selected="true"]') }; }); }, buscar: buscar, quienRecibe: quienRecibe, zonaLibre: zonaLibre, revisarAlcance: revisarAlcance, revisarFijos: revisarFijos, lateral: lateral, final: final, medir: medir, leer: leer, restos: restos, cerrarTodo: cerrarTodo, nom: nom, vis: vis, ef: ef,
    // centro del botón, poniéndolo antes en la zona libre si hace falta (como haría el dedo desplazando la pantalla)
    centro: function (r, k) { var el = buscar(r, k); if (!el) return null; var z = zonaLibre(r), b = el.getBoundingClientRect(); if (b.top < z[0] || b.bottom > z[1]) { var sc = r === 'hoja' || r === 'popup' ? (el.closest('.sheet') || document.scrollingElement) : document.scrollingElement; var fx = fijo(el); if (!fx || r === 'hoja') { sc.scrollTop += (b.top + b.height / 2) - (z[0] + z[1]) / 2; } z = zonaLibre(r); b = el.getBoundingClientRect(); } var q = quienRecibe(el); return { x: b.left + b.width / 2, y: b.top + b.height / 2, q: q }; } };
})();`;

// ---------- pantallas (cómo se preparan) ----------
const PANTALLAS = [
  ['inicio', 'A.S.tab="inicio";A.S.inicioVista="hoy";A.render()'],
  ['movimientos', 'A.H.goTab(["movimientos"])'],
  ['mov-lista', 'A.H.goTab(["movimientos"]);A.H.setMovVista(["lista"])'],
  ['mov-calendario', 'A.H.goTab(["movimientos"]);A.H.setMovVista(["calendario"])'],
  ['dinero', 'A.H.goTab(["dinero"])'],
  ['dinero-inversiones', 'A.H.goTab(["dinero"]);A.H.dmVer(["inversiones"])'],
  ['juntos', 'A.H.goTab(["juntos"])'],
  ['juntos-personas', 'A.H.goTab(["juntos"]);A.S.juntosVer="personas";A.render()'],
  ['agenda', 'A.H.irAgenda(["tareas"])'],
  ['agenda-calendario', 'A.H.irAgenda(["calendario"])'],
  ['tu', 'A.H.goTab(["tu"])'],
  ['tu-herramientas', 'A.H.goTab(["tu"]);A.H.tuIr(["herramientas"])'],
  ['tu-dinero', 'A.H.goTab(["tu"]);A.H.tuIr(["dinero"])'],
  ['tu-agenda', 'A.H.goTab(["tu"]);A.H.tuIr(["agenda"])'],
  ['tu-seguridad', 'A.H.goTab(["tu"]);A.H.tuIr(["seguridad"])'],
  ['tu-apariencia', 'A.H.goTab(["tu"]);A.H.tuIr(["apariencia"])'],
  ['tu-datos', 'A.H.goTab(["tu"]);A.H.tuIr(["datos"])'],
  ['tu-ayuda', 'A.H.goTab(["tu"]);A.H.tuIr(["ayuda"])'],
];
// variantes de datos (usuario nuevo / «Lo básico»): solo se miran desplazamiento y botones tapados
const VARIANTES = [['basico', 'nuevo con «Lo básico»'], ['invitado', 'recién unido a un grupo']];
// acciones que se saltan al tocar todo (sacan de la app, borran la cuenta o la sesión, o piden permisos del sistema)
const NO_TOCAR = /^(logout|logoutSi|borrarCuentaSi|borrarCuentaConfirmar|salirCuenta|reintentarCarga|desbloquear|cerrarSesion\w*)$/;

const HOJAS_DE = ARG['hojas-de'] ? new Set(JSON.parse(fs.readFileSync(String(ARG['hojas-de']), 'utf8')).toques.filter((t) => /abre hoja|hoja →/.test(t.resultado)).map((t) => t.pantalla + '|' + (t.accion || t.k))) : null;
const informe = { fecha: new Date().toISOString(), vps: VPS, hallazgos: [], hojas: {}, toques: [], errores: [] };
const hallazgo = (parte, gravedad, pantalla, vp, tipo, donde, txt, extra) => { const h = Object.assign({ parte, gravedad, pantalla, vp: vp.join('x'), tipo, donde, txt }, extra || {}); informe.hallazgos.push(h); console.log('  [' + gravedad + '] ' + pantalla + ' · ' + tipo + ' · ' + donde + ' · ' + txt); };

// ---------- abrir la app con datos inventados ----------
async function nuevaPagina(browser, vp, opts) {
  opts = opts || {};
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, colorScheme: TEMA, locale: 'es-ES' });
  await ctx.addInitScript(INIT);
  if (opts.init) await ctx.addInitScript(opts.init);
  const p = await ctx.newPage();
  p._err = []; p._nav = [];
  p.on('pageerror', (e) => p._err.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) p._err.push('console: ' + m.text().slice(0, 160)); });
  p.on('dialog', (d) => { p._err.push('ventana del navegador: ' + d.type() + ' «' + d.message().slice(0, 60) + '»'); d.dismiss().catch(() => {}); });
  p.on('filechooser', () => { /* se apunta con el efecto «elegir archivo» */ });
  ctx.on('page', (np) => { p._nav.push('nueva pestaña'); np.close().catch(() => {}); });
  await p.route('**/*', (r) => {
    const u = r.request().url();
    if (/data-layer\.js$/.test(u)) return r.fulfill({ body: DATOS, contentType: 'text/javascript' });
    if (/supabase|config\.js$|auth-signup\.js$|captcha\.js$|fonts\.g/.test(u)) return r.fulfill({ body: '', contentType: /css|fonts/.test(u) ? 'text/css' : 'text/javascript' });
    if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    return r.abort();
  });
  p.on('framenavigated', (f) => { if (f === p.mainFrame() && !f.url().startsWith(URL_APP)) p._nav.push(f.url().slice(0, 70)); });
  p._hash = opts.hash || '';
  p._cdp = await ctx.newCDPSession(p);
  await cargar(p);
  return p;
}
async function cargar(p) {
  await p.goto(URL_APP + (p._hash ? '#' + p._hash : ''));
  await p.waitForFunction(() => window.__APP__ && document.querySelector('#app') && document.querySelector('#app').textContent.length > 50 && window.__APP__.S && window.__APP__.S.config, null, { timeout: 15000 });
  if (ARG.tienda) await p.evaluate(() => { const A = window.__APP__, d = new Date(), iso = (x) => x.toISOString().slice(0, 10), a = new Date(d.getFullYear(), d.getMonth(), 1, 12), b = new Date(d.getFullYear(), d.getMonth() - 1, 1, 12), ant = (n) => iso(new Date(b.getFullYear(), b.getMonth(), n, 12));
    A.S.movimientos = A.S.movimientos.concat([{ id: 't-n1', tipo: 'Ingreso', categoria: 'Nómina', importe: 2350, fecha: iso(a), descripcion: 'Nómina' }, { id: 't-n0', tipo: 'Ingreso', categoria: 'Nómina', importe: 2350, fecha: ant(1), descripcion: 'Nómina' }, { id: 't-g1', tipo: 'Gasto', categoria: 'Hogar', importe: 620, fecha: ant(2), descripcion: 'Alquiler' }]); A.render(); });
  await p.waitForTimeout(450);
  p._err.length = 0;
}
async function prep(p, js) {
  await p.evaluate(() => window.__AUD__.cerrarTodo());
  await p.waitForTimeout(30);
  await p.evaluate((code) => { const A = window.__APP__; window.scrollTo({ top: 0, behavior: 'instant' }); eval(code); window.scrollTo({ top: 0, behavior: 'instant' }); }, js);
  await p.waitForTimeout(420);
}
// toca un botón por su clave (como un dedo, en su centro). Devuelve el centro y quién recibe el toque
async function tocar(p, raiz, k, ms) {
  const c = await p.evaluate(([r, kk]) => window.__AUD__.centro(r, kk), [raiz, k]);
  if (!c) return null;
  await p.touchscreen.tap(c.x, c.y);
  if (ms) await p.waitForTimeout(ms);
  return c;
}
async function tocarSel(p, sel, ms) { // por selector CSS (para los recorridos fijos)
  const c = await p.evaluate((s) => { const el = [...document.querySelectorAll(s)].find((e) => window.__AUD__.vis(e)); if (!el) return null; const r = el.closest('#popupBackdrop') ? 'popup' : el.closest('#sheetHost') ? 'hoja' : 'content';
    const z = window.__AUD__.zonaLibre(r), b = el.getBoundingClientRect(); if (!/fixed|sticky/.test(getComputedStyle(el).position) && !el.closest('.tabbar, .topbar, .actions.fija') && (b.top < z[0] || b.bottom > z[1])) { const sc = r === 'hoja' ? el.closest('.sheet') : document.scrollingElement; sc.scrollTop += b.top + b.height / 2 - (z[0] + z[1]) / 2; }
    const b2 = el.getBoundingClientRect(); return { x: b2.left + b2.width / 2, y: b2.top + b2.height / 2, q: window.__AUD__.quienRecibe(el) }; }, sel);
  if (!c) return null; await p.touchscreen.tap(c.x, c.y); if (ms) await p.waitForTimeout(ms); return c;
}
const leer = (p) => p.evaluate(() => window.__AUD__.leer());
const restos = (p) => p.evaluate(() => window.__AUD__.restos());
// arrastra el dedo de verdad (eventos táctiles de Chromium; Input.synthesizeScrollGesture no desplaza las hojas). dy < 0 = el dedo sube (el contenido baja)
async function deslizar(p, x, y, dy) {
  const n = 20; await p._cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(x), y: Math.round(y) }] });
  for (let i = 1; i <= n; i++) { await p._cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(x), y: Math.round(y + dy * i / n) }] }); await p.waitForTimeout(8); }
  await p._cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(380);
}

// ---------- 1 · pantallas: desplazamiento, scroll lateral, botones tapados y repintados sin tocar nada ----------
async function revisarPantalla(p, id, vp, etiqueta) {
  const nombre = etiqueta || id;
  const lat = await p.evaluate(() => window.__AUD__.lateral()); lat.forEach((x) => hallazgo('pantallas', 'fallo', nombre, vp, x.tipo, x.donde, x.txt));
  const alc = await p.evaluate(() => window.__AUD__.revisarAlcance('content')); alc.forEach((x) => hallazgo('pantallas', 'fallo', nombre, vp, 'botón ' + x.tipo, x.donde, x.txt));
  const fij = await p.evaluate(() => window.__AUD__.revisarFijos('barras')); fij.forEach((x) => hallazgo('pantallas', 'fallo', nombre, vp, 'botón de barra ' + x.tipo, x.donde, x.txt));
  const fin = await p.evaluate(() => window.__AUD__.final('content'));
  if (fin && fin.boton && !fin.boton.bien) hallazgo('pantallas', 'fallo', nombre, vp, 'el último botón no se puede tocar', fin.boton.ultimo, 'acaba en ' + fin.boton.abajo + ' px; la barra empieza en ' + fin.boton.zona + ' px; recibe el toque ' + fin.boton.quien);
  if (fin && fin.texto && fin.texto.abajo > fin.texto.zona + 1) hallazgo('pantallas', 'fallo', nombre, vp, 'el final queda debajo de la barra', '«' + fin.texto.txt + '»', 'acaba en ' + fin.texto.abajo + ' px; la barra empieza en ' + fin.texto.zona + ' px');
  // repintados sin tocar nada (3 s quieto)
  await p.evaluate(() => window.__AUD__.medir()); await p.waitForTimeout(3000);
  const q = await leer(p); if (q.repl) hallazgo('anim', 'fallo', nombre, vp, 'se repinta sola', '#content', q.repl + ' veces en 3 s sin tocar nada');
  else if (q.mut > 40) hallazgo('anim', 'dudoso', nombre, vp, 'cambia sola', 'página', q.mut + ' cambios en 3 s sin tocar nada (' + q.attrs.slice(0, 3).join(' · ') + ')');
}

// ---------- 2 · botones: cada uno hace algo, no lo tapa nada, y la hoja que abre se puede usar ----------
const HOJAS_VISTAS = new Map(); // título → {pantalla, k, raiz}
function descr(a, d) { // qué ha pasado al tocar
  const o = [];
  if (d.tab !== a.tab) o.push('pestaña ' + a.tab + '→' + d.tab);
  else if (d.sub !== a.sub) o.push('subpantalla ' + a.sub + '→' + d.sub);
  if (!a.hoja && d.hoja) o.push('abre hoja «' + d.hoja.titulo + '»'); else if (a.hoja && !d.hoja) o.push('cierra la hoja'); else if (a.hoja && d.hoja && a.hoja.titulo !== d.hoja.titulo) o.push('hoja → «' + d.hoja.titulo + '»');
  if (!a.popup && d.popup) o.push('ventanita «' + d.popup + '»');
  if (d.descartar && !a.descartar) o.push('pregunta descartar');
  if (d.toast && d.toast !== a.toast) o.push('aviso «' + d.toast + '»');
  if (d.ef.length) o.push(d.ef.join(' / '));
  if (d.escr > a.escr) o.push((d.escr - a.escr) + ' escrituras'); else if (d.escrCfg > a.escrCfg) o.push('guarda ajustes');
  return o.join(', ');
}
async function tocarTodo(p, id, js, vp, raiz, abrirHoja, nivel) {
  // raiz: 'content' | 'barras' | 'hoja'. abrirHoja: clave del botón que abre la hoja (nivel 2)
  const firmaDe = () => p.evaluate((r) => window.__AUD__.lista(r).map((x) => x.k).join(';'), raiz);
  let firma0 = '';
  const reponer = async (primera) => { await prep(p, js); if (abrirHoja) { await tocar(p, abrirHoja.raiz, abrirHoja.k, 420); }
    if (primera) { firma0 = await firmaDe(); return; }
    if ((await firmaDe()) !== firma0) { await cargar(p); await prep(p, js); if (abrirHoja) await tocar(p, abrirHoja.raiz, abrirHoja.k, 420); } }; // algo se quedó cambiado (otra pestaña de Dinero, un aviso oculto…): se empieza de cero
  await cargar(p); await reponer(true);
  const els = await p.evaluate((r) => window.__AUD__.lista(r), raiz);
  const vistos = new Set();
  for (const it of els) {
    const accion = it.dc.split('|')[0];
    if (NO_TOCAR.test(accion)) continue;
    const firma = it.dc ? it.dc : it.k; if (vistos.has(firma)) continue; vistos.add(firma);
    if (raiz === 'barras' && /goTab|onFab|irAgenda/.test(accion)) continue; // las pestañas y el + se prueban en «anim» y «atras»
    if (HOJAS_DE && !HOJAS_DE.has(id + '|' + (it.dc || it.k))) continue;
    let a, c, d;
    try {
      await reponer();
      if (!(await p.evaluate(([r, k]) => !!window.__AUD__.buscar(r, k), [raiz, it.k]))) continue; // ya no está (lo quitó un toque anterior)
      const existe = !it.dc || (await p.evaluate((ac) => typeof window.__APP__.H[ac] === 'function' || ['sheetBackdrop'].indexOf(ac) >= 0, accion));
      if (!existe) hallazgo('botones', 'fallo', id, vp, 'botón muerto (la acción no existe)', it.nom, 'data-click="' + it.dc + '"');
      c = await p.evaluate(([r, kk]) => window.__AUD__.centro(r, kk), [raiz, it.k]); if (!c) continue; // primero se desplaza hasta el botón (si hace falta)…
      await p.waitForTimeout(80);
      await p.evaluate(() => window.__AUD__.medir()); a = await leer(p); const nav0 = p._nav.length, err0 = p._err.length;
      await p.touchscreen.tap(c.x, c.y); // …y luego se toca
      await p.waitForTimeout(420);
      d = await leer(p);
      const errs = p._err.slice(err0), navs = p._nav.slice(nav0);
      const res = descr(a, d) + (navs.length ? ' · navega: ' + navs.join(', ') : '');
      const reg = { pantalla: id, vp: vp.join('x'), raiz, k: it.k, boton: it.nom, accion: it.dc, recibe: c && c.q && !c.q.bien ? c.q.quien : '', resultado: res, mut: d.mut, repl: d.repl, salto: d.tab === a.tab && !d.hoja && !a.hoja ? d.y - a.y : 0, errores: errs };
      informe.toques.push(reg);
      if (c && c.q && !c.q.bien && !c.q.fuera) hallazgo('botones', res ? 'dudoso' : 'fallo', id, vp, 'el toque va a otra cosa', it.nom, 'en su centro está ' + c.q.quien + (c.q.capa ? ' (' + c.q.capa + ')' : '') + (res ? ' (pero el toque ha hecho: ' + res + ')' : ''));
      if (errs.length) hallazgo('botones', 'fallo', id, vp, 'error al tocar', it.nom, errs.join(' | ').slice(0, 200));
      const elegido = it.sel; // tocar lo que ya está elegido no tiene por qué hacer nada
      if (!res && d.mut === 0 && d.y === a.y && d.hy === a.hy && existe && !elegido) hallazgo('botones', 'dudoso', id, vp, 'no hace nada visible', it.nom, 'data-click="' + it.dc + '"');
      else if (!res && d.mut > 0 && d.mut <= 2 && existe && !d.repl) hallazgo('botones', 'dudoso', id, vp, 'casi no cambia nada', it.nom, d.mut + ' cambio(s): ' + d.attrs.join(' · '));
      // repintado entero por algo pequeño, y saltos de posición
      if (raiz === 'content' && d.repl && d.tab === a.tab && d.sub === a.sub && !d.hoja && !a.hoja) {
        if (Math.abs(d.y - a.y) > 30) hallazgo('anim', 'fallo', id, vp, 'repinta y salta de posición', it.nom, 'de ' + a.y + ' a ' + d.y + ' px');
        if (d.repl > 1) hallazgo('anim', 'dudoso', id, vp, 'repinta la pantalla entera varias veces', it.nom, d.repl + ' veces por un toque');
      }
      if (raiz === 'hoja' && d.hoja && a.hoja && d.hoja.titulo === a.hoja.titulo && a.hy > 40 && d.hy != null && Math.abs(d.hy - a.hy) > 60) hallazgo('anim', 'fallo', id, vp, 'la hoja vuelve arriba al tocar', it.nom, 'de ' + a.hy + ' a ' + d.hy + ' px');
      if (navs.length) { hallazgo('botones', 'fallo', id, vp, 'sale de la app', it.nom, navs.join(', ')); await cargar(p); p._nav.length = 0; }
      // la hoja que abre: se revisa una vez por título
      if (d.hoja && d.hoja.abierta && (!a.hoja || a.hoja.titulo !== d.hoja.titulo) && !HOJAS_VISTAS.has(d.hoja.titulo)) {
        HOJAS_VISTAS.set(d.hoja.titulo, { pantalla: id, js, k: it.k, raiz, padre: abrirHoja, nivel: nivel || 1 });
        await revisarHoja(p, id + ' → «' + d.hoja.titulo + '»', vp, a, it);
      }
      if (d.escr > a.escr || d.escrCfg > a.escrCfg || errs.length) await cargar(p); // los datos han cambiado: se empieza de cero
    } catch (e) { informe.errores.push(id + ' · ' + it.nom + ': ' + e.message.split('\n')[0]); try { await cargar(p); } catch (e2) { /* */ } }
  }
}

// ---------- 3 · una hoja abierta: scroll lateral, se llega al final, barra de botones, fondo quieto, atrás ----------
async function revisarHoja(p, nombre, vp, antes) {
  const r = await p.evaluate(() => { const A = window.__AUD__; const sh = document.querySelector('#sheetBackdrop .sheet'); const b = sh.getBoundingClientRect();
    return { lat: A.lateral(), alc: A.revisarAlcance('hoja'), fij: A.revisarFijos('hoja'), fin: A.final('hoja'), top: Math.round(b.top), alto: Math.round(b.height), sc: sh.scrollHeight > sh.clientHeight + 2 }; });
  informe.hojas[nombre] = { vp: vp.join('x'), top: r.top, alto: r.alto, desplaza: r.sc };
  r.lat.forEach((x) => hallazgo('hojas', 'fallo', nombre, vp, x.tipo, x.donde, x.txt));
  r.alc.forEach((x) => hallazgo('hojas', 'fallo', nombre, vp, 'botón ' + x.tipo, x.donde, x.txt));
  r.fij.forEach((x) => hallazgo('hojas', 'fallo', nombre, vp, 'botón de abajo ' + x.tipo, x.donde, x.txt));
  if (r.top < 0) hallazgo('hojas', 'fallo', nombre, vp, 'la hoja se sale por arriba', 'sheet', r.top + ' px');
  if (r.fin && r.fin.boton && !r.fin.boton.bien) hallazgo('hojas', 'fallo', nombre, vp, 'el último botón no se puede tocar', r.fin.boton.ultimo, 'acaba en ' + r.fin.boton.abajo + ' px, zona libre hasta ' + r.fin.boton.zona + ' px; recibe ' + r.fin.boton.quien);
  if (r.fin && r.fin.texto && r.fin.texto.abajo > r.fin.texto.zona + 1) hallazgo('hojas', 'dudoso', nombre, vp, 'el final queda debajo de la barra de botones', '«' + r.fin.texto.txt + '»', 'acaba en ' + r.fin.texto.abajo + ' px; la barra empieza en ' + r.fin.texto.zona + ' px');
  // fondo quieto: se desliza dentro de la hoja (hasta el final y más) y en lo oscuro de arriba
  const g = await p.evaluate(() => { const sh = document.querySelector('#sheetBackdrop .sheet'), b = sh.getBoundingClientRect(); return { x: b.left + b.width / 2, y: Math.min(innerHeight - 160, b.top + Math.max(80, b.height * 0.45)), top: b.top, y0: Math.round(scrollY), max: document.scrollingElement.scrollHeight - innerHeight }; });
  if (g.max > 100) {
    if (g.top > 90) { const y2a = await p.evaluate(() => Math.round(scrollY)); await deslizar(p, g.x, g.top / 2, -300); const y2 = await p.evaluate(() => Math.round(scrollY)); if (Math.abs(y2 - y2a) > 2) hallazgo('hojas', 'fallo', nombre, vp, 'el fondo se mueve con la hoja abierta', 'deslizar en lo oscuro de arriba', 'la pantalla de detrás pasa de ' + y2a + ' a ' + y2 + ' px'); }
    const y1a = await p.evaluate(() => Math.round(scrollY));
    await deslizar(p, g.x, g.y, -400); await deslizar(p, g.x, g.y, -400); await deslizar(p, g.x, g.y, -400);
    let y1 = await p.evaluate(() => Math.round(scrollY)); g.y0 = y1a;
    if (Math.abs(y1 - g.y0) > 2) hallazgo('hojas', 'fallo', nombre, vp, 'el fondo se mueve con la hoja abierta', 'deslizar dentro de la hoja', 'la pantalla de detrás pasa de ' + g.y0 + ' a ' + y1 + ' px');
    await p.evaluate((y) => { const sh = document.querySelector('#sheetBackdrop .sheet'); if (sh) sh.scrollTop = 0; window.scrollTo({ top: y, behavior: 'instant' }); }, antes ? antes.y : g.y0);
  }
  // atrás de Android: cierra lo de arriba
  const st = await leer(p);
  const ret = await p.evaluate(() => { try { return window.__atras(); } catch (e) { return 'error: ' + e.message; } });
  await p.waitForTimeout(330);
  const d = await leer(p);
  const fuera = !d.hoja || d.hoja.cerrando;
  let que = fuera ? 'cierra la hoja' : d.descartar ? 'pregunta descartar' : d.hoja.titulo !== st.hoja.titulo ? 'vuelve a «' + d.hoja.titulo + '»' : d.popup ? 'abre ventanita' : 'no cambia nada';
  informe.hojas[nombre].atras = que + (ret !== true ? ' (devuelve ' + ret + ')' : '');
  if (ret !== true) hallazgo('atras', 'fallo', nombre, vp, 'atrás no lo resuelve la app', '__atras()', 'devuelve ' + ret + ' con una hoja abierta (saldría de la app)');
  else if (que === 'no cambia nada') hallazgo('atras', 'fallo', nombre, vp, 'atrás no hace nada', '__atras()', 'la hoja sigue igual');
  if (fuera) { await p.waitForTimeout(150); const y3 = await p.evaluate(() => Math.round(scrollY)); if (antes && Math.abs(y3 - antes.y) > 30) hallazgo('hojas', 'fallo', nombre, vp, 'al cerrar la hoja la pantalla salta', 'posición', 'antes ' + antes.y + ' px, después ' + y3 + ' px');
    const rr = await restos(p); rr.forEach((x) => hallazgo('anim', 'fallo', nombre, vp, 'queda algo a medias al cerrar con atrás', '', x)); }
}

// ---------- 4 · doble toque rápido en lo que abre hojas ----------
async function dobleToque(p, vp) {
  // se usan los toques del nivel 1 que abrieron una hoja
  const hechos = new Set();
  for (const t of informe.toques.filter((x) => x.vp === vp.join('x') && /abre hoja/.test(x.resultado) && x.raiz !== 'hoja')) {
    const firma = t.pantalla + '|' + t.accion; if (hechos.has(firma)) continue; hechos.add(firma);
    const js = (PANTALLAS.find((x) => x[0] === t.pantalla) || [])[1]; if (!js) continue;
    try {
      await prep(p, js);
      const c = await p.evaluate(([r, k]) => window.__AUD__.centro(r, k), [t.raiz, t.k]); if (!c) continue;
      const e0 = await leer(p);
      await p.touchscreen.tap(c.x, c.y); await p.waitForTimeout(70); await p.touchscreen.tap(c.x, c.y);
      await p.waitForTimeout(600);
      const d = await leer(p), rr = await restos(p);
      const uno = (/abre hoja «(.*?)»(?=, |$| ·)/.exec(t.resultado) || [])[1]; // 26/11 (Calidad): títulos con «» dentro («Tu «Así vas»») se cortaban y salía un falso «acaba en otra hoja»
      if (!d.hoja) hallazgo('doble', 'dudoso', t.pantalla, vp, 'doble toque: abre y cierra', t.boton, 'el segundo toque (70 ms después) cae en el fondo de la hoja y la cierra');
      else if (d.hoja.titulo !== uno) hallazgo('doble', 'dudoso', t.pantalla, vp, 'doble toque: acaba en otra hoja', t.boton, '«' + uno + '» → «' + d.hoja.titulo + '» (el segundo toque pulsa lo que hay debajo del dedo en la hoja)');
      if (d.escr > e0.escr) hallazgo('doble', 'fallo', t.pantalla, vp, 'doble toque guarda algo', t.boton, (d.escr - e0.escr) + ' escrituras');
      rr.forEach((x) => hallazgo('doble', 'fallo', t.pantalla, vp, 'doble toque deja algo a medias', t.boton, x));
      if (d.escr > e0.escr || p._err.length) await cargar(p);
    } catch (e) { informe.errores.push('doble ' + t.pantalla + ' · ' + t.boton + ': ' + e.message.split('\n')[0]); await cargar(p); }
  }
}

// ---------- 5 · animaciones: tocar rápido y comprobar que nada se queda a medias ----------
async function animaciones(p, vp) {
  const W = vp[0], Hh = vp[1];
  const tab = (t) => '.tabbar [data-tab="' + t + '"]';
  const caso = async (nombre, fn, espera) => {
    try { await cargar(p); await prep(p, 'A.S.tab="inicio";A.render()'); const e0 = await leer(p); await fn(); await p.waitForTimeout(espera || 1300); const rr = await restos(p), d = await leer(p);
      rr.forEach((x) => hallazgo('anim', 'fallo', 'rápido: ' + nombre, vp, 'se queda a medias', '', x));
      if (p._err.length) hallazgo('anim', 'fallo', 'rápido: ' + nombre, vp, 'error', '', p._err.join(' | ').slice(0, 200));
      return { e0, d };
    } catch (e) { informe.errores.push('anim ' + nombre + ': ' + e.message.split('\n')[0]); return null; }
  };
  // + abre y se cierra tocando fuera enseguida (varias veces)
  await caso('+ y fuera, 4 veces', async () => { for (let i = 0; i < 4; i++) { await tocarSel(p, '.tab-crear'); await p.waitForTimeout(60); await p.touchscreen.tap(W / 2, 40); await p.waitForTimeout(60); } });
  let r = await caso('+ dos veces muy seguido', async () => { await tocarSel(p, '.tab-crear'); await p.waitForTimeout(50); await tocarSel(p, '.tab-crear'); });
  if (r && r.d.hoja) hallazgo('anim', 'dudoso', 'rápido: + dos veces', vp, 'doble toque en + deja la hoja abierta', '.tab-crear', 'el segundo toque no la cierra (lo esperado si el + gira a ×)');
  // abrir, cerrar con la X y abrir otra antes de que acabe de cerrarse
  r = await caso('cerrar con X y abrir Buscar enseguida', async () => { await tocarSel(p, '.tab-crear', 320); await tocarSel(p, '#sheetBackdrop .sheet-x'); await p.waitForTimeout(40); await tocarSel(p, '.topbar [data-click="openBuscar"]'); }, 900);
  if (r && !(r.d.hoja && /busca/i.test(r.d.hoja.titulo + r.d.hoja.kind))) hallazgo('anim', 'fallo', 'rápido: cerrar y abrir otra', vp, 'la hoja nueva no se queda', 'Buscar', 'tras cerrar el + y tocar Buscar a los 40 ms queda: ' + JSON.stringify(r.d.hoja));
  // + → Gasto → X → + en menos de medio segundo
  await caso('+ → Gasto → X → +', async () => { await tocarSel(p, '.tab-crear', 150); await tocarSel(p, '#sheetHost [data-click="crearIr|gasto"]', 120); await tocarSel(p, '#sheetBackdrop .sheet-x', 60); await tocarSel(p, '.tab-crear'); });
  // arrastrar la hoja hacia abajo un poco (sin llegar a cerrar) y soltar
  r = await caso('arrastrar la hoja un poco y soltar', async () => { await tocarSel(p, '.tab-crear', 400); const b = await p.evaluate(() => { const s = document.querySelector('#sheetBackdrop .sheet').getBoundingClientRect(); return { x: s.left + s.width / 2, y: s.top + 20 }; }); await p._cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x, y: b.y }] }); for (let i = 1; i <= 5; i++) { await p._cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: b.x, y: b.y + i * 12 }] }); await p.waitForTimeout(16); } await p._cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }, 700);
  // pestañas dos veces seguidas
  await caso('Movimientos y Dinero muy seguido', async () => { await tocarSel(p, tab('movimientos')); await p.waitForTimeout(30); await tocarSel(p, tab('dinero')); });
  r = await caso('Juntos, Tú e Inicio muy seguido', async () => { await tocarSel(p, tab('juntos')); await p.waitForTimeout(30); await tocarSel(p, '#tbAvatar'); await p.waitForTimeout(30); await tocarSel(p, tab('inicio')); });
  if (r && r.d.tab !== 'inicio') hallazgo('anim', 'fallo', 'rápido: pestañas', vp, 'no acaba en la última pestaña tocada', '', 'se ve ' + r.d.tab);
  // meses muy rápido en Movimientos (cabecera) y en Inicio (tarjeta)
  r = await caso('Movimientos: 3 meses atrás y 3 adelante, rápido', async () => { await tocarSel(p, tab('movimientos'), 300); for (let i = 0; i < 3; i++) { await tocarSel(p, '.mov-flechas .mov-flecha:first-child'); await p.waitForTimeout(45); } for (let i = 0; i < 3; i++) { await tocarSel(p, '.mov-flechas .mov-flecha:last-child'); await p.waitForTimeout(45); } });
  if (r) { const per = await p.evaluate(() => window.__APP__.S.movPeriodo); const hoy = await p.evaluate(() => { const A = window.__APP__, m = A.mesActual(); return 'm:' + m.y + '-' + String(m.m).padStart(2, '0'); }); if (per !== hoy) hallazgo('anim', 'fallo', 'rápido: meses en Movimientos', vp, 'no vuelve al mes de partida', '.mov-flecha', 'acaba en ' + per + ' (esperado ' + hoy + ')'); }
  await caso('Inicio: 4 meses atrás rápido', async () => { let n = 0; for (let i = 0; i < 4; i++) { if (await tocarSel(p, '#content .hero-arrow[aria-label="Mes anterior"]')) n++; await p.waitForTimeout(40); } if (!n) informe.errores.push('anim: no encuentro la flecha del mes en Inicio'); });
  // Movimientos: Resumen → Lista → Calendario muy seguido
  await caso('Movimientos: cambiar de vista muy seguido', async () => { await tocarSel(p, tab('movimientos'), 300); await tocarSel(p, '[data-click="setMovVista|lista"]'); await p.waitForTimeout(40); await tocarSel(p, '[data-click="setMovVista|calendario"]'); await p.waitForTimeout(40); await tocarSel(p, '[data-click="setMovVista|resumen"]'); });
  // Juntos: grupo → pestañas Gastos/Saldos/Más muy seguido
  await caso('Grupo: Gastos/Saldos/Más muy seguido', async () => { await tocarSel(p, tab('juntos'), 300); await tocarSel(p, '#content [data-click^="grupoVer|"]', 400); for (const k of ['saldos', 'mas', 'gastos', 'saldos']) { await tocarSel(p, '#sheetHost [data-click="grupoTab|' + k + '"]'); await p.waitForTimeout(40); } });
  // posición al volver: Inicio abajo → Movimientos → Inicio (y si salta después)
  try { await cargar(p); await prep(p, 'A.S.tab="inicio";A.render()'); await p.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' })); await tocarSel(p, tab('movimientos'), 400); await p.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
    await tocarSel(p, tab('inicio')); const ys = []; for (const ms of [30, 150, 400, 900]) { await p.waitForTimeout(ms - (ys.length ? [30, 150, 400, 900][ys.length - 1] : 0)); ys.push(await p.evaluate(() => Math.round(scrollY))); }
    if (ys.some((y) => y !== ys[0])) hallazgo('scroll', 'fallo', 'volver a Inicio', vp, 'la posición se mueve después de cambiar de pestaña', '', 'scrollY a los 30/150/400/900 ms: ' + ys.join(' / '));
    informe.volverInicio = ys;
  } catch (e) { informe.errores.push('volver: ' + e.message); }
}

// ---------- 6 · atrás de Android en la raíz, en cada pestaña y en las subpantallas ----------
async function atras(p, vp) {
  const caso = async (nombre, prepJs, pasos, esperado) => {
    try { await cargar(p); await prep(p, prepJs || 'A.S.tab="inicio";A.render()'); for (const s of pasos || []) { if (!(await tocarSel(p, s, 380))) { informe.errores.push('atrás ' + nombre + ': no encuentro ' + s); return; } }
      const a = await leer(p); await p.evaluate(() => window.__AUD__.medir());
      const ret = await p.evaluate(() => { try { return window.__atras(); } catch (e) { return 'error: ' + e.message; } }); await p.waitForTimeout(380); const d = await leer(p); await p.waitForTimeout(700); const rr = await restos(p);
      const res = 'devuelve ' + ret + '; ' + (descr(a, d) || 'nada cambia') + (d.repl ? ' (repinta ' + d.repl + ')' : '');
      informe.atras = informe.atras || []; informe.atras.push({ vp: vp.join('x'), caso: nombre, antes: a.tab + '|' + a.sub + (a.hoja ? ' hoja «' + a.hoja.titulo + '»' : ''), res });
      const okE = esperado(ret, a, d); if (okE !== true) hallazgo('atras', /^dudoso/.test(okE) ? 'dudoso' : 'fallo', 'atrás: ' + nombre, vp, String(okE).replace(/^dudoso: /, ''), '', res);
      rr.forEach((x) => hallazgo('atras', 'fallo', 'atrás: ' + nombre, vp, 'queda algo a medias', '', x));
      if (p._err.length) hallazgo('atras', 'fallo', 'atrás: ' + nombre, vp, 'error', '', p._err.join(' | ').slice(0, 200));
    } catch (e) { informe.errores.push('atrás ' + nombre + ': ' + e.message.split('\n')[0]); }
  };
  const tab = (t) => '.tabbar [data-tab="' + t + '"]';
  await caso('Inicio sin nada abierto', null, [], (ret, a, d) => ret === false && d.repl === 0 && d.tab === 'inicio' ? true : 'en la raíz debe devolver false sin tocar nada');
  for (const t of ['movimientos', 'juntos', 'dinero']) await caso('pestaña ' + t, null, [tab(t)], (ret, a, d) => ret === true && d.tab === 'inicio' ? true : 'debe volver a Inicio');
  await caso('Tú (avatar)', null, ['#tbAvatar'], (ret, a, d) => ret === true && d.tab === 'inicio' ? true : 'debe volver a Inicio');
  await caso('Tú → una rama', null, ['#tbAvatar', '#content [data-click^="tuIr|"]'], (ret, a, d) => ret === true && d.tab === 'tu' && !d.sub.split('|')[0] ? true : 'debe volver a Tú');
  await caso('Dinero → Inversiones → un activo', null, [tab('dinero'), '#content [data-click="dm3Tab|inversiones"]', '#content [data-click^="verActivo|"]'], (ret, a, d) => (!a.hoja ? 'dudoso: no se ha abierto' : ret === true && !d.hoja && d.tab === 'dinero' ? true : 'debe cerrar la hoja y quedarse en Dinero'));
  await caso('Juntos → Por persona', null, [tab('juntos'), '#content [data-click^="juntosVer"], #content [data-click*="personas"]'], (ret, a, d) => (!a.sub.split('|')[2] ? 'dudoso: no se ha llegado a «Por persona»' : ret === true && d.tab === 'juntos' && !d.sub.split('|')[2] ? true : 'debe volver a Juntos'));
  await caso('Agenda (botón de arriba)', null, ['#tbAgenda, .tabbar [data-tab="agenda"]'], (ret, a, d) => ret === true && d.tab === 'inicio' ? true : 'debe volver a Inicio');
  await caso('Agenda → Calendario', 'A.H.irAgenda(["tareas"])', ['#content [data-click*="calendario"]'], (ret, a, d) => (a.sub.split('|')[5] !== 'calendario' ? 'dudoso: no se ha llegado al calendario' : ret === true && d.tab === 'inicio' && d.sub.split('|')[3] === 'tareas' ? true : ret === true && d.tab === 'inicio' ? 'desde el calendario de la Agenda, atrás debe ir a la semana (decisión del dueño, 26/11), no a Inicio' : 'debe salir del calendario')); // 26/11 (Calidad): la Agenda vive en Inicio (d.tab siempre es «inicio»): se mira S.inicioVista (campo 3)
  await caso('Movimientos → Lista', null, [tab('movimientos'), '#content [data-click="setMovVista|lista"]'], (ret, a, d) => ret === true && d.tab === 'inicio' ? 'dudoso: desde Lista, atrás va a Inicio (no a Resumen)' : ret === true ? true : 'no lo resuelve');
  await caso('Inicio → «Gastos» de la tarjeta (Movimientos con filtro)', null, ['#content [data-click^="irMovs|_gastos"]'], (ret, a, d) => (a.tab !== 'movimientos' ? 'dudoso: no se ha llegado' : ret === true && d.tab === 'inicio' ? true : 'debe volver a Inicio, de donde venías (como el enlace «‹ Volver a Inicio»); ahora va al Resumen y quita el filtro'));
  await caso('Movimientos → buscar', null, [tab('movimientos'), '#content [data-click="setMovVista|lista"]', '#content [data-click="movBuscarAbrir"]'], (ret, a, d) => ret === true && d.tab === 'inicio' ? 'dudoso: con la búsqueda abierta, atrás va a Inicio (no cierra la búsqueda)' : ret === true ? true : 'no lo resuelve');
  // hojas dentro de hojas
  await caso('Grupo → Ajustes', null, [tab('juntos'), '#content [data-click^="grupoVer|"]', '#sheetHost [data-click^="grupoAjustes|"]'], (ret, a, d) => (!a.hoja ? 'dudoso: no se ha abierto' : ret === true && d.hoja && d.hoja.titulo !== a.hoja.titulo ? true : 'debe volver al grupo (no cerrar todo)'));
  await caso('Grupo → Historial', null, [tab('juntos'), '#content [data-click^="grupoVer|"]', '#sheetHost [data-click="grupoTab|mas"]', '#sheetHost [data-click^="histVer|"]'], (ret, a, d) => (!a.hoja || a.hoja.kind !== 'hist' ? 'dudoso: no se ha abierto el historial' : ret === true && d.hoja && d.hoja.kind === 'grupo' ? true : 'debe volver al grupo'));
  await caso('Grupo → ¿De dónde sale?', null, [tab('juntos'), '#content [data-click^="grupoVer|"]', '#sheetHost [data-click^="origenVer|"]'], (ret, a, d) => (!a.hoja || !/sale|origen/i.test(a.hoja.titulo + a.hoja.kind) ? 'dudoso: no se ha abierto' : ret === true && d.hoja && d.hoja.kind === 'grupo' ? true : 'debe volver al grupo'));
  await caso('Grupo → un gasto', null, [tab('juntos'), '#content [data-click^="grupoVer|"]', '#sheetHost [data-click^="compAbrir|"]'], (ret, a, d) => (!a.hoja ? 'dudoso: no se ha abierto' : d.descartar ? 'sin cambiar nada, atrás pregunta «¿Descartar este gasto?» en un gasto que ya existe' : ret === true && d.hoja && d.hoja.kind === 'grupo' ? true : 'dudoso: desde un gasto del grupo, atrás ' + (d.hoja ? 'va a «' + d.hoja.titulo + '»' : 'cierra todo') + ' (no vuelve al grupo)'));
  await caso('Juntos → un gasto de «Lo último»', 'A.H.goTab(["juntos"])', ['#content [data-click^="openMovForm|c"]'], (ret, a, d) => (!a.hoja ? 'dudoso: no se ha abierto' : d.descartar ? 'sin cambiar nada, atrás pregunta «¿Descartar este gasto?» en un gasto que ya existe' : ret === true && !d.hoja ? true : 'debe cerrar'));
  await caso('Movimientos → un gasto ya apuntado', 'A.H.goTab(["movimientos"]);A.H.setMovVista(["lista"])', ['#content [data-click^="openMovForm|m"]'], (ret, a, d) => (!a.hoja ? 'dudoso: no se ha abierto' : d.descartar ? 'sin cambiar nada, atrás pregunta «¿Descartar…?»' : ret === true && !d.hoja ? true : 'debe cerrar'));
  await caso('Persona → ¿De dónde sale?', 'A.H.goTab(["juntos"]);A.S.juntosVer="personas";A.render()', ['#content [data-click^="personaVer|"]', '#sheetHost [data-click^="origenVer|"], #sheetHost [data-click^="origenPersona"]'], (ret, a, d) => (!a.hoja || a.hoja.kind === 'persona' ? 'dudoso: no se ha abierto' : ret === true && d.hoja && d.hoja.kind === 'persona' ? true : 'debe volver a la persona'));
  await caso('Dinero → Cuentas → una cuenta', null, [tab('dinero'), '#content [data-click="openCuentas"]', '#sheetHost [data-click^="cuentaEditar|"]'], (ret, a, d) => (!a.hoja ? 'dudoso: no se ha abierto' : ret === true && d.hoja && d.hoja.titulo !== a.hoja.titulo ? true : 'dudoso: desde una cuenta, atrás ' + (d.hoja ? 'se queda en «' + d.hoja.titulo + '»' : 'cierra todo') + ' (esperado: volver a «Cuentas y saldos»)'));
  await caso('Dinero → una meta → Aportar', null, [tab('dinero'), '#content [data-click="dm3Tab|metas"]', '#content [data-click^="metaVer|"]', '#sheetHost [data-click^="metaAportar"]'], (ret, a, d) => (!a.hoja ? 'dudoso: no se ha abierto' : ret === true && d.hoja ? true : 'dudoso: desde Aportar (abierto desde la meta), atrás cierra todo'));
  await caso('+ → Gasto (sin escribir)', null, ['.tab-crear', '#sheetHost [data-click="crearIr|gasto"]'], (ret, a, d) => ret === true && !d.hoja ? true : ret === true && d.hoja && d.hoja.kind === 'crear' ? 'dudoso: vuelve al + (no cierra)' : 'debe cerrar');
  await caso('+ → Gasto con 12 tecleado', null, ['.tab-crear', '#sheetHost [data-click="crearIr|gasto"]', '#sheetHost [data-click="tecK|1"]', '#sheetHost [data-click="tecK|2"]'], (ret, a, d) => ret === true && d.descartar ? true : 'debe preguntar «¿Descartar…?»');
  await caso('Ventanita sobre una hoja', null, ['.tab-crear', '#sheetHost [data-click="crearIr|gasto"]', '#sheetHost [data-click="tecK|1"]'], () => true); // solo para dejar el estado en el informe
  await caso('Tú → Importar → atrás', null, ['#tbAvatar', '#content [data-click="tuIr|datos"]', '#content [data-click="impAbrir"]'], (ret, a, d) => (!a.hoja ? 'dudoso: no se ha abierto' : ret === true && !d.hoja ? true : 'debe cerrar'));
  await caso('Inicio → Informes', null, ['#content [data-click^="infVer|"]'], (ret, a, d) => (!a.hoja ? 'dudoso: no hay botón de Informes en Inicio con estos datos' : ret === true && !d.hoja ? true : 'debe cerrar'));
}

// ---------- 7 · guardar con doble toque: cuántas veces se escribe ----------
async function guardarDoble(p, vp) {
  const caso = async (nombre, prepJs, pasos, guardarSel, contar, hojaTras) => { // hojaTras: título de la hoja que la app abre a propósito al guardar (p. ej. «Metas»)
    try { await cargar(p); await prep(p, prepJs);
      for (const s of pasos) { if (typeof s === 'function') await s(); else if (!(await tocarSel(p, s, 420))) throw new Error('no encuentro ' + s); } // 26/11: 420 ms, como una persona (tras abrir o cerrar una hoja, la app no atiende toques durante 350 ms: frenarToques)
      await p.waitForTimeout(400);
      const a = await p.evaluate(contar), e0 = await leer(p);
      const c = await p.evaluate((s) => { const el = [...document.querySelectorAll(s)].find((e) => window.__AUD__.vis(e)); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, q: window.__AUD__.quienRecibe(el) }; }, guardarSel);
      if (!c) throw new Error('no encuentro el botón de guardar ' + guardarSel);
      if (!c.q.bien) hallazgo('guardar', 'fallo', 'guardar: ' + nombre, vp, 'el botón de guardar está tapado', guardarSel, c.q.quien);
      await p.touchscreen.tap(c.x, c.y); await p.waitForTimeout(60); await p.touchscreen.tap(c.x, c.y); await p.waitForTimeout(900);
      const d = await p.evaluate(contar), rr = await restos(p), e1 = await leer(p);
      if (e1.tab !== e0.tab || e1.sub !== e0.sub || (e1.hoja && !e1.hoja.cerrando && e1.hoja.titulo !== hojaTras)) hallazgo('guardar', 'fallo', 'guardar: ' + nombre, vp, 'el segundo toque cae en lo de detrás', guardarSel, 'tras guardar, el segundo toque ' + (e1.tab !== e0.tab ? 'cambia a la pestaña «' + e1.tab + '»' : e1.sub !== e0.sub ? 'cambia de vista (' + e1.sub + ')' : 'abre «' + e1.hoja.titulo + '»'));
      informe.guardar = informe.guardar || []; informe.guardar.push({ vp: vp.join('x'), caso: nombre, antes: a, despues: d });
      if (d - a > 1) hallazgo('guardar', 'fallo', 'guardar: ' + nombre, vp, 'doble toque guarda dos veces', guardarSel, 'de ' + a + ' a ' + d);
      else if (d - a < 1) hallazgo('guardar', 'dudoso', 'guardar: ' + nombre, vp, 'no se ha guardado', guardarSel, 'de ' + a + ' a ' + d + (p._err.length ? ' · ' + p._err.join(' | ').slice(0, 120) : ''));
      rr.forEach((x) => hallazgo('guardar', 'fallo', 'guardar: ' + nombre, vp, 'queda algo a medias', '', x));
    } catch (e) { informe.errores.push('guardar ' + nombre + ': ' + e.message.split('\n')[0]); }
  };
  const nMovs = () => window.__APP__.S.movimientos.length;
  const nEscr = (t) => new Function('return (window.__ESCR__||[]).filter(function(x){return x[0]==="' + t + '"&&/crear|add|set/.test(x[1]);}).length');
  await caso('gasto con el teclado', 'A.S.tab="inicio";A.render()', ['.tab-crear', '#sheetHost [data-click="crearIr|gasto"]', '#sheetHost [data-click="tecK|7"]', '#sheetHost [data-click^="tecCat|"]'], '#sheetHost [data-click="tecK|ok"]', nMovs);
  await caso('ingreso con el teclado', 'A.S.tab="inicio";A.render()', ['.tab-crear', '#sheetHost [data-click="crearIr|ingreso"]', '#sheetHost [data-click="tecK|9"]', '#sheetHost [data-click^="tecCat|"]'], '#sheetHost [data-click="tecK|ok"]', nMovs);
  await caso('compartir un gasto', 'A.H.goTab(["juntos"])', ['#content [data-click^="compRapido"]', async () => { const s = await p.$('#sheetHost [data-click="tecK|5"]'); if (s) { await tocarSel(p, '#sheetHost [data-click="tecK|5"]', 80); } else { await p.fill('#sheetHost #crImporte', '5'); } const d = await p.$('#sheetHost #crDesc'); if (d) await p.fill('#sheetHost #crDesc', 'Prueba'); }],
    '#sheetHost .actions.fija .btn.accent, #sheetHost [data-click^="compRapidoGuardar"], #sheetHost [data-click="tecK|ok"]', nEscr('compartidos'));
  await caso('tarea rápida en la Agenda', 'A.H.irAgenda(["tareas"])', [async () => { await p.fill('#agRapida', 'Tarea de prueba'); }], '#content [data-click="agRapida"]', nEscr('tareas'));
  await caso('meta nueva', 'A.H.goTab(["dinero"])', ['#content [data-click="dm3Tab|metas"]', '#content [data-click="metaNueva"]', async () => { await p.fill('#sheetHost #mNombre', 'Meta de prueba'); const o = await p.$('#sheetHost #mObjetivo'); if (o) await p.fill('#sheetHost #mObjetivo', '500'); }], '#sheetHost .actions.fija .btn.accent', () => (window.__APP__.cfg().ahorro || []).length, 'Metas'); // 26/11 (Calidad): al guardar una meta nueva la app enseña la lista «Metas» (metaGuardar → metasListaHtml); no es el segundo toque
  await caso('aportar a una meta', 'A.H.goTab(["dinero"])', ['#content [data-click="dm3Tab|metas"]', '#content [data-click^="metaAportarR|"]', '#sheetHost [data-click="tecK|4"]'], '#sheetHost [data-click="tecK|ok"], #sheetHost .actions.fija .btn.accent', nEscr('movimientos'));
  await caso('traspaso', 'A.H.goTab(["dinero"])', ['#content [data-click="crearIr|traspaso"]', '#sheetHost [data-click="tecK|3"]'], '#sheetHost [data-click="tecK|ok"], #sheetHost .actions.fija .btn.accent', nEscr('movimientos'));
  await caso('editar un movimiento', 'A.H.goTab(["movimientos"]);A.H.setMovVista(["lista"])', ['#content [data-click="openMovForm|m2"]'], '#sheetHost .actions.fija .btn.accent', nEscr('movimientos'));
  await caso('editar una tarea', 'A.S.tab="inicio";A.render()', ['#content [data-click^="openTareaForm|"]'], '#sheetHost .actions.fija .btn.accent', nEscr('tareas'));
  // doble toque que abre una hoja: el segundo toque no debe cambiar nada dentro de ella (26/11: cambiaba la categoría sin querer)
  const sinCambios = async (nombre, prepJs, pasos, sel, leerCat) => {
    try { await cargar(p); await prep(p, prepJs); for (const s of pasos) { if (!(await tocarSel(p, s, 350))) throw new Error('no encuentro ' + s); }
      let peor = null;
      for (const y of [0.35, 0.5, 0.62, 0.7]) { // a varias alturas: depende de qué quede debajo del dedo en la hoja nueva
        await cargar(p); await prep(p, prepJs); for (const s of pasos) await tocarSel(p, s, 350);
        const c = await p.evaluate(([s2, f]) => { const el = [...document.querySelectorAll(s2)].find((e) => window.__AUD__.vis(e)); if (!el) return null; if (!el.closest('#sheetHost')) { const b0 = el.getBoundingClientRect(); window.scrollBy({ top: (b0.top + b0.height / 2) - innerHeight * f, behavior: 'instant' }); } const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, [sel, y]);
        if (!c) throw new Error('no encuentro ' + sel); await p.waitForTimeout(120);
        await p.touchscreen.tap(c.x, c.y); await p.waitForTimeout(500); const uno = await p.evaluate(leerCat);
        await cargar(p); await prep(p, prepJs); for (const s of pasos) await tocarSel(p, s, 350);
        await p.evaluate(([s2, f]) => { const el = [...document.querySelectorAll(s2)].find((e) => window.__AUD__.vis(e)); if (!el.closest('#sheetHost')) { const b0 = el.getBoundingClientRect(); window.scrollBy({ top: (b0.top + b0.height / 2) - innerHeight * f, behavior: 'instant' }); } }, [sel, y]); await p.waitForTimeout(120);
        await p.touchscreen.tap(c.x, c.y); await p.waitForTimeout(150); await p.touchscreen.tap(c.x, c.y); await p.waitForTimeout(500); const dos = await p.evaluate(leerCat);
        if (uno !== dos) { peor = 'con un toque queda «' + uno + '»; con doble toque, «' + dos + '» (toque a ' + Math.round(c.y) + ' px)'; break; }
      }
      informe.guardar = informe.guardar || []; informe.guardar.push({ vp: vp.join('x'), caso: nombre, res: peor || 'igual' });
      if (peor) hallazgo('guardar', 'fallo', 'doble toque: ' + nombre, vp, 'el segundo toque cambia lo que hay en la hoja nueva', sel, peor);
    } catch (e) { informe.errores.push('doble ' + nombre + ': ' + e.message.split('\n')[0]); }
  };
  const catHoja = () => [...document.querySelectorAll('#sheetHost .chip.active, #sheetHost .tec-cat.on')].map((e) => e.textContent.trim()).join(',') || '(nada elegido)';
  await sinCambios('una fila de Movimientos', 'A.H.goTab(["movimientos"]);A.H.setMovVista(["lista"])', [], '#content [data-click="openMovForm|m2"]', catHoja);
  await sinCambios('+ → Gasto', 'A.S.tab="inicio";A.render()', ['.tab-crear'], '#sheetHost [data-click="crearIr|gasto"]', catHoja);
  await caso('saldar con una persona', 'A.H.goTab(["juntos"]);A.S.juntosVer="personas";A.render()', ['#content [data-click^="personaVer|"]', '#sheetHost [data-click^="saldarTodo|"]'], '#sheetHost [data-click="saldarTodoGuardar"]', nEscr('compartidos'));
}

// ---------- 8 · recorridos: guía de avisos (puente falso de Android), Importar con un CSV inventado, Trayecto y calendarios ----------
const NATIVO = 'window.__nativo={notif:{permiso:async()=>"default",pedir:async()=>"granted",programar:async()=>{}},avisosBanco:{estado:async()=>({activo:false,permiso:false}),configurar:async()=>{},pendientes:async()=>[],quitar:async()=>{},vaciar:async()=>{},abiertoDesdeAviso:async()=>false,alAbrirDesdeAviso:()=>{},abrirApp:async()=>{}}};';
const CSV = 'Fecha;Concepto;Importe\n' + [1, 2, 3, 4, 5].map((i) => '0' + i + '/11/2026;Compra de prueba ' + i + ';-' + (10 + i) + ',50').join('\n') + '\n';
async function recorridos(browser, vp) {
  const paso = async (p, nombre, fn) => { try { await fn(); } catch (e) { informe.errores.push('recorrido ' + nombre + ': ' + e.message.split('\n')[0]); } };
  const atrasYmirar = async (p) => { const a = await leer(p); const ret = await p.evaluate(() => { try { return window.__atras(); } catch (e) { return 'error: ' + e.message; } }); await p.waitForTimeout(400); const d = await leer(p); return { ret, a, d, txt: 'devuelve ' + ret + '; ' + (descr(a, d) || 'nada cambia') }; };
  informe.recorridos = informe.recorridos || [];
  // guía «Que se apunten solos» (Android): portada → pasos → atrás en un paso intermedio
  const g = await nuevaPagina(browser, vp, { init: NATIVO });
  await paso(g, 'guía', async () => {
    await prep(g, 'A.H.goTab(["tu"])');
    await tocarSel(g, '#content [data-click="avAbrir"]', 500);
    if (!(await tocarSel(g, '#sheetHost [data-click^="guiaAbrirDesde"]', 700))) throw new Error('no encuentro la guía en Avisos');
    const pasos = [];
    for (let i = 0; i < 4; i++) { const t = await leer(g); pasos.push(t.hoja && t.hoja.titulo); const sig = await g.evaluate(() => { const b = [...document.querySelectorAll('#sheetHost [data-click^="guiaIr|"]')].filter((e) => window.__AUD__.vis(e)).pop(); return b ? b.getAttribute('data-click') : null; }); if (!sig) break; await tocarSel(g, '#sheetHost [data-click="' + sig + '"]', 400); }
    const r = await atrasYmirar(g); informe.recorridos.push({ vp: vp.join('x'), que: 'guía: atrás en un paso intermedio', pasos, res: r.txt });
    if (r.ret === true && !r.d.hoja) hallazgo('atras', 'dudoso', 'guía de avisos', vp, 'atrás en un paso de la guía cierra la guía entera', '__atras()', 'pasos vistos: ' + pasos.filter(Boolean).join(' → ') + '; no vuelve al paso anterior');
    const lat = await g.evaluate(() => window.__AUD__.lateral()); lat.forEach((x) => hallazgo('hojas', 'fallo', 'guía de avisos', vp, x.tipo, x.donde, x.txt));
  });
  await g.context().close();
  const p = await nuevaPagina(browser, vp);
  // Importar: elegir un CSV inventado, ir al paso siguiente y probar atrás
  await paso(p, 'importar', async () => {
    await prep(p, 'A.H.goTab(["tu"]);A.H.tuIr(["datos"])');
    if (!(await tocarSel(p, '#content [data-click="impAbrir"]', 500))) throw new Error('no encuentro Importar');
    const f = path.join(SALIDA, 'extracto-inventado.csv'); fs.writeFileSync(f, CSV);
    await p.setInputFiles('#impFile', f); await p.waitForTimeout(900);
    const t1 = await leer(p), paso1 = await p.evaluate(() => (window.__APP__.imp() || {}).paso);
    const r1 = await p.evaluate(() => window.__AUD__.revisarAlcance('hoja').concat(window.__AUD__.lateral())); r1.forEach((x) => hallazgo('hojas', 'fallo', 'Importar (' + paso1 + ')', vp, x.tipo, x.donde, x.txt));
    const sig = await p.evaluate(() => { const b = [...document.querySelectorAll('#sheetHost .actions.fija .btn.accent')].find((e) => window.__AUD__.vis(e) && !e.disabled); return b ? b.getAttribute('data-click') : null; });
    if (sig) { await tocarSel(p, '#sheetHost [data-click="' + sig + '"]', 900); }
    const paso2 = await p.evaluate(() => (window.__APP__.imp() || {}).paso);
    const r = await atrasYmirar(p); const paso3 = await p.evaluate(() => (window.__APP__.imp() || {}).paso);
    informe.recorridos.push({ vp: vp.join('x'), que: 'importar', pasos: [paso1, paso2, 'atrás → ' + paso3], hoja: t1.hoja && t1.hoja.titulo, res: r.txt + (r.d.popup ? ' · ventanita: ' + r.d.popup : '') });
    if (r.ret === true && !r.d.hoja && paso2 && paso2 !== paso1) hallazgo('atras', 'fallo', 'Importar', vp, 'atrás en el paso «' + paso2 + '» cierra Importar entero', '__atras()', 'se pierde lo preparado (esperado: volver al paso anterior)');
  });
  // Trayecto: + → Trayecto → km → atrás
  await paso(p, 'trayecto', async () => {
    await cargar(p); await prep(p, 'A.S.tab="inicio";A.render()');
    await tocarSel(p, '.tab-crear', 400);
    if (!(await tocarSel(p, '#sheetHost [data-click="trAbrir"], #sheetHost [data-click^="crearIr|trayecto"]', 600))) throw new Error('no encuentro Trayecto en el +');
    const t = await leer(p); const r0 = await p.evaluate(() => window.__AUD__.revisarAlcance('hoja').concat(window.__AUD__.lateral(), window.__AUD__.revisarFijos('hoja'))); r0.forEach((x) => hallazgo('hojas', 'fallo', 'Trayecto', vp, x.tipo, x.donde, x.txt));
    await tocarSel(p, '#sheetHost [data-click="trModo|km"]', 300);
    const km = await p.$('#sheetHost #trKm'); if (km) { await km.fill('35'); await p.waitForTimeout(200); }
    const r = await atrasYmirar(p); informe.recorridos.push({ vp: vp.join('x'), que: 'trayecto con 35 km escritos', hoja: t.hoja && t.hoja.titulo, res: r.txt });
    if (r.ret === true && !r.d.hoja && !r.d.descartar && km) hallazgo('atras', 'dudoso', 'Trayecto', vp, 'atrás con km escritos cierra sin preguntar', '__atras()', 'lo escrito se pierde');
  });
  // Calendarios: cambiar de mes muy rápido (Agenda y Movimientos)
  for (const [nombre, js, sel] of [['Agenda → Calendario', 'A.H.irAgenda(["calendario"])', '#content [aria-label="Mes siguiente"], #content [data-click^="calMes|1"], #content [data-click^="agCalMes|1"]'], ['Movimientos → Calendario', 'A.H.goTab(["movimientos"]);A.H.setMovVista(["calendario"])', '#content .mov-flechas .mov-flecha:first-child']]) {
    await paso(p, nombre, async () => {
      await cargar(p); await prep(p, js);
      const t0 = await p.evaluate(() => (document.querySelector('#content h2, #content .mov-per-lbl, #content .cal-tit, #content .ag-mes') || {}).textContent || '');
      let n = 0; for (let i = 0; i < 3; i++) { if (await tocarSel(p, sel)) n++; await p.waitForTimeout(40); }
      await p.waitForTimeout(1300); const rr = await restos(p); rr.forEach((x) => hallazgo('anim', 'fallo', 'rápido: ' + nombre, vp, 'se queda a medias', '', x));
      const t1 = await p.evaluate(() => (document.querySelector('#content h2, #content .mov-per-lbl, #content .cal-tit, #content .ag-mes') || {}).textContent || '');
      informe.recorridos.push({ vp: vp.join('x'), que: nombre + ': 3 meses adelante rápido', toques: n, antes: t0.trim().slice(0, 30), despues: t1.trim().slice(0, 30) });
      if (!n) informe.errores.push('recorrido ' + nombre + ': no encuentro la flecha del mes');
    });
  }
  await p.context().close();
}

module.exports = { nuevaPagina, cargar, prep, tocar, tocarSel, leer, restos, deslizar, revisarPantalla, revisarHoja, informe, PANTALLAS };
if (require.main === module) (async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const browser = await chromium.launch();
  const LISTA = ARG.solo ? PANTALLAS.filter((x) => String(ARG.solo).split(',').indexOf(x[0]) >= 0) : PANTALLAS;
  for (let iv = 0; iv < VPS.length; iv++) {
    const vp = VPS[iv]; console.log('\n=== ' + vp.join('×') + ' ' + (TEMA === 'dark' ? 'oscuro' : 'claro') + ' ===');
    const p = await nuevaPagina(browser, vp);
    if (PARTES.has('pantallas')) for (const [id, js] of LISTA) { console.log('· pantalla ' + id); await prep(p, js); await revisarPantalla(p, id, vp); }
    if (PARTES.has('pantallas') && !ARG.solo) for (const [hash, txt] of VARIANTES) {
      const q = await nuevaPagina(browser, vp, { hash });
      for (const [id, js] of [['inicio', 'A.S.tab="inicio";A.render()'], ['tu', 'A.H.goTab(["tu"])'], ['juntos', 'A.H.goTab(["juntos"])'], ['dinero', 'A.H.goTab(["dinero"])'], ['movimientos', 'A.H.goTab(["movimientos"])']]) { console.log('· ' + txt + ': ' + id); await prep(q, js); await revisarPantalla(q, id + ' (' + txt + ')', vp); }
      await q.context().close();
    }
    if (PARTES.has('botones') || PARTES.has('hojas')) {
      HOJAS_VISTAS.clear();
      await prep(p, PANTALLAS[0][1]); console.log('· botones de las barras'); await tocarTodo(p, 'barras', PANTALLAS[0][1], vp, 'barras');
      for (const [id, js] of LISTA) { console.log('· botones de ' + id); await tocarTodo(p, id, js, vp, 'content'); }
      if (iv === 0 && NIVEL2 > 0) { // nivel 2: los botones de dentro de cada hoja (solo en el primer tamaño)
        const hs = [...HOJAS_VISTAS.entries()].filter(([, v]) => v.nivel === 1).slice(0, NIVEL2);
        for (const [tit, v] of hs) { console.log('· botones de la hoja «' + tit + '» (' + v.pantalla + ')'); await tocarTodo(p, v.pantalla + ' → «' + tit + '»', v.js, vp, 'hoja', { raiz: v.raiz, k: v.k }, 2); }
      }
    }
    if (PARTES.has('doble')) { console.log('· doble toque'); await dobleToque(p, vp); }
    if (PARTES.has('anim')) { console.log('· toques rápidos'); await animaciones(p, vp); }
    if (PARTES.has('atras')) { console.log('· atrás de Android'); await atras(p, vp); }
    if (PARTES.has('guardar')) { console.log('· guardar con doble toque'); await guardarDoble(p, vp); }
    if (PARTES.has('recorridos')) { console.log('· recorridos (guía, importar, trayecto, calendarios)'); await recorridos(browser, vp); }
    await p.context().close();
    fs.writeFileSync(path.join(SALIDA, 'informe-interaccion.json'), JSON.stringify(informe, null, 1));
  }
  await browser.close();
  fs.writeFileSync(path.join(SALIDA, 'informe-interaccion.json'), JSON.stringify(informe, null, 1));
  // resumen: los hallazgos iguales se juntan (misma parte, tipo y botón en varias pantallas o tamaños)
  const m = new Map(); informe.hallazgos.forEach((h) => { const k = h.gravedad + '|' + h.parte + '|' + h.tipo + '|' + h.donde + '|' + h.txt.replace(/\d+ px/g, 'N px'); const o = m.get(k) || Object.assign({ n: 0, pantallas: new Set(), vps: new Set() }, h); o.n++; o.pantallas.add(h.pantalla); o.vps.add(h.vp); m.set(k, o); });
  const ord = [...m.values()].sort((a, b) => (a.gravedad === b.gravedad ? b.n - a.n : a.gravedad === 'fallo' ? -1 : 1));
  console.log('\n==== RESUMEN: ' + ord.filter((x) => x.gravedad === 'fallo').length + ' fallos y ' + ord.filter((x) => x.gravedad !== 'fallo').length + ' dudosos (distintos) ====');
  ord.forEach((h) => console.log('[' + h.gravedad + '] ' + h.parte + ' · ' + h.tipo + ' · ' + h.donde + ' · ' + h.txt + ' — ' + [...h.pantallas].slice(0, 4).join(', ') + ([...h.pantallas].length > 4 ? '…' : '') + ' (' + [...h.vps].join(', ') + ')'));
  if (informe.errores.length) { console.log('\nErrores del propio script (' + informe.errores.length + '):'); informe.errores.slice(0, 30).forEach((e) => console.log('  ' + e)); }
  console.log('\nInforme completo en ' + path.join(SALIDA, 'informe-interaccion.json'));
})().catch((e) => { console.error(e); process.exit(1); });

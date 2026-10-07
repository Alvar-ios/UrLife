/* ============================================================
   MIS FINANZAS Y TAREAS — lógica de la aplicación (v2)
   ============================================================ */
(function () {
'use strict';

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- Iconos (SVG inline, trazo simple) ---------------- */
const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V9M11 19V4M18 19v-6"/><path d="M3 19h18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.3 2.3 4.7-5"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12.5 2H21v8.5L11.5 21 3 11.5Z"/><circle cx="15.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v2"/><path d="M3 7.5v10A2.5 2.5 0 0 0 5.5 20H19a1 1 0 0 0 1-1v-3"/><rect x="14" y="11" width="8" height="6" rx="1.4"/><circle cx="17" cy="14" r=".9" fill="currentColor" stroke="none"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v18"/><path d="M6 4h12l-3 4 3 4H6"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4.5"/><path d="M10.4 3.9 2.7 17.5a1.6 1.6 0 0 0 1.4 2.4h15.8a1.6 1.6 0 0 0 1.4-2.4L13.6 3.9a1.6 1.6 0 0 0-2.8 0Z"/><circle cx="12" cy="16.6" r=".9" fill="currentColor" stroke="none"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 4.5h6L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"/><circle cx="12" cy="13" r="3.4"/></svg>',
  bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10 12 4l8 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3.5 21h17"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7h15"/><path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7"/><path d="M6.5 7 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/></svg>',
};
function ic(name) {
  const s = ICONS[name];
  return s ? s.replace('<svg ', '<svg class="i" aria-hidden="true" ') : '';
}

/* ---------------- Utilidades ---------------- */
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_ABR = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const TIPOS = ['Ingreso', 'Factura', 'Gasto', 'Ahorro', 'Deuda'];
const TIPO_COLOR = { Ingreso: 'income', Factura: 'bill', Gasto: 'expense', Ahorro: 'savings', Deuda: 'debt' };
const TIPO_SIGNO = { Ingreso: 1, Factura: -1, Gasto: -1, Ahorro: -1, Deuda: -1 };

function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function fmt2(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function money(n) { return fmt2(num(n)) + ' €'; }
function moneyShort(n) {
  n = num(n);
  return Math.abs(n) >= 100 ? n.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €' : money(n);
}
// Importe con signo según el efecto real sobre tu dinero (una devolución = gasto negativo = suma)
function moneySigned(importe, tipo) {
  const eff = (TIPO_SIGNO[tipo] || 1) * num(importe);
  return (eff >= 0 ? '+' : '−') + fmt2(Math.abs(eff)) + ' €';
}
function effect(importe, tipo) { return (TIPO_SIGNO[tipo] || 1) * num(importe); }

function pad2(n) { return String(n).padStart(2, '0'); }
function todayISO() { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function parseISO(iso) { const d = new Date(iso + 'T00:00:00'); return isNaN(d) ? null : d; }
function fmtDateLong(iso) {
  const d = parseISO(iso); if (!d) return '';
  return d.getDate() + ' de ' + MESES[d.getMonth()].toLowerCase() + ' de ' + d.getFullYear();
}
function fmtDateShort(iso) {
  const d = parseISO(iso); if (!d) return '';
  return d.getDate() + ' ' + MESES_ABR[d.getMonth()];
}
function fmtDateGroup(iso) {
  const d = iso ? parseISO(iso) : null; if (!d) return 'Sin fecha';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return d.getDate() + ' de ' + MESES[d.getMonth()].toLowerCase() + (d.getFullYear() !== today.getFullYear() ? ' de ' + d.getFullYear() : '');
}
function daysUntil(iso) {
  const d = iso ? parseISO(iso) : null; if (!d) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((d - t) / 86400000);
}
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function stripId(o) { const c = { ...o }; delete c.id; return c; }

function toast(msg) {
  const el = $('#toast'); if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2400);
}
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento local */ } }

/* Atributos de eventos delegados: data-click="nombre|arg1|arg2" (args codificados) */
function attr(kind, name, ...args) {
  return 'data-' + kind + '="' + escapeHtml([name].concat(args.map((a) => encodeURIComponent(a == null ? '' : a))).join('|')) + '"';
}
const act = (n, ...a) => attr('click', n, ...a);
const onInput = (n, ...a) => attr('input', n, ...a);
const onChange = (n, ...a) => attr('change', n, ...a);

/* ---------------- Estado ---------------- */
const now0 = new Date();
const S = {
  appStarted: false, db: null, user: null,
  movimientos: [], tareas: [], golf: [], config: null,
  loaded: { mov: false, tar: false, golf: false, cfg: false },
  tab: 'inicio',
  analisisSub: 'mensual',
  mesSel: now0.getMonth() + 1, anioSel: now0.getFullYear(),
  tareasSub: 'activas',
  movFiltroTipo: 'Todos', movPeriodo: 'todo', movQuery: '', movLimit: 120,
  theme: lsGet('theme') || 'auto',
  loadingMsg: 'Cargando tus datos…',
  onboarding: null, _onboardPending: false,
};
let FORM = {};
let _themeSetByApp = false;

function applyTheme() {
  const root = document.documentElement;
  if (S.theme === 'light' || S.theme === 'dark') { root.setAttribute('data-theme', S.theme); _themeSetByApp = true; }
  else if (_themeSetByApp) { root.removeAttribute('data-theme'); _themeSetByApp = false; }
}

const DEFAULT_CONFIG = {
  categoriasGasto: [], facturas: [], ahorro: [], deudas: [], ingresos: [],
  metodosPago: ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Transferencia', 'Bizum', 'Otro'],
  categoriasTareas: [],
};
function cfg() { return Object.assign({}, DEFAULT_CONFIG, S.config || {}); }

/* ============================================================
   CAPA DE DATOS (capacidad db de la plataforma)
   ============================================================ */
let _unsubs = [];

function errMsg(e) {
  const code = e && e.code;
  if (code === '23505') return 'Ya existe un registro con ese identificador.';
  if (code === '42501' || code === 'PGRST301' || code === 401 || code === 403) return 'No tienes permiso para guardar este cambio (revisa tu sesión).';
  if (code === 'network' || code === 'TypeError') return 'No se pudo conectar. Revisa tu conexión a internet.';
  return 'No se pudo guardar. Revisa tu conexión.';
}
async function withRetry(fn, tries) {
  tries = tries || 4;
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      const retryable = !e || !e.code || e.code === 'network' || (typeof e.code === 'number' && e.code >= 500);
      if (retryable && i < tries - 1) { await sleep(300 * (i + 1) + Math.random() * 200); continue; }
      throw e;
    }
  }
  throw last;
}
// Ejecuta una escritura con reintentos y avisa si falla. Devuelve true/false.
async function write(fn) {
  try { await withRetry(fn); return true; }
  catch (e) { console.error(e); toast(errMsg(e)); return false; }
}

// La sesión (login) determina si hay datos que cargar. Ver data-layer.js (window.Auth / window.Data).
function allLoaded() { const l = S.loaded; return l.mov && l.tar && l.golf && l.cfg; }

function subscribeAll() {
  _unsubs.forEach((u) => { try { u(); } catch (e) { /* noop */ } });
  _unsubs = [];
  const fail = (key, msg) => () => { S.loaded[key] = true; toast(msg); render(); };
  _unsubs.push(S.db.collection('movimientos').onSnapshot((snap) => {
    S.movimientos = snap.docs.map((d) => Object.assign({ id: d.id }, d.data())); S.loaded.mov = true; render();
  }, fail('mov', 'No se pudieron cargar los movimientos')));
  _unsubs.push(S.db.collection('tareas').onSnapshot((snap) => {
    S.tareas = snap.docs.map((d) => Object.assign({ id: d.id }, d.data())); S.loaded.tar = true; render();
  }, fail('tar', 'No se pudieron cargar las tareas')));
  _unsubs.push(S.db.collection('golf').onSnapshot((snap) => {
    S.golf = snap.docs.map((d) => Object.assign({ id: d.id }, d.data())); S.loaded.golf = true; render();
  }, fail('golf', 'No se pudo cargar Golf Reventa')));
  _unsubs.push(S.db.doc('config/app').onSnapshot((snap) => {
    S.config = snap.exists ? snap.data() : null; S.loaded.cfg = true; maybeStartOnboarding(); render();
  }, fail('cfg', 'No se pudo cargar la configuración')));
}

/* -------- Config: escrituras en serie (una a la vez sobre el mismo documento) -------- */
let _cfgChain = Promise.resolve();
function saveConfig(partial) {
  S.config = Object.assign({}, cfg(), partial);
  const job = _cfgChain.then(async () => {
    await write(() => S.db.doc('config/app').update(partial));
  });
  _cfgChain = job;
  return job;
}

/* ============================================================
   CÁLCULOS
   ============================================================ */
function movsDelMes(anio, mes) {
  return S.movimientos.filter((m) => { const d = m.fecha || ''; return d.slice(0, 4) === String(anio) && Number(d.slice(5, 7)) === mes; });
}
function sumTipo(movs, tipo) { return movs.filter((m) => m.tipo === tipo).reduce((a, m) => a + num(m.importe), 0); }
function kpisMes(anio, mes) {
  const movs = movsDelMes(anio, mes);
  const ingresos = sumTipo(movs, 'Ingreso'), facturas = sumTipo(movs, 'Factura'), gastos = sumTipo(movs, 'Gasto');
  const ahorro = sumTipo(movs, 'Ahorro'), deuda = sumTipo(movs, 'Deuda');
  return { ingresos, facturas, gastos, ahorro, deuda, disponible: ingresos - facturas - gastos - ahorro - deuda, movs };
}
function gastoPorCategoria(movs) {
  const map = {};
  movs.filter((m) => m.tipo === 'Gasto').forEach((m) => { map[m.categoria] = (map[m.categoria] || 0) + num(m.importe); });
  return map;
}
function tareasVencidas() { return S.tareas.filter((t) => t.estado !== 'Completado' && t.fechaLimite && daysUntil(t.fechaLimite) < 0); }
function golfTotales() {
  let inv = 0, ben = 0, enCartera = 0;
  S.golf.forEach((g) => {
    inv += num(g.invertido);
    if (g.venta != null && g.venta !== '') ben += num(g.venta) - num(g.invertido); else enCartera++;
  });
  return { inv, ben, enCartera };
}
function prioridadPeso(p) { return { Alta: 3, Media: 2, Baja: 1 }[p] || 0; }
function cmpTarea(a, b) {
  const va = a.fechaLimite && daysUntil(a.fechaLimite) < 0 ? 1 : 0, vb = b.fechaLimite && daysUntil(b.fechaLimite) < 0 ? 1 : 0;
  return (vb - va) || (prioridadPeso(b.prioridad) - prioridadPeso(a.prioridad)) ||
    (a.fechaLimite || '9999').localeCompare(b.fechaLimite || '9999') || (a.nombre || '').localeCompare(b.nombre || '');
}
function cmpMov(a, b) { return (b.fecha || '').localeCompare(a.fecha || '') || (num(b.creadoEn || b.orden) - num(a.creadoEn || a.orden)); }
function presupuestoExcedido(anio, mes) {
  const map = gastoPorCategoria(movsDelMes(anio, mes));
  return (cfg().categoriasGasto || []).filter((c) => c.nombre && c.presupuesto && (map[c.nombre] || 0) > c.presupuesto)
    .map((c) => ({ categoria: c.nombre, real: map[c.nombre], presupuesto: c.presupuesto }));
}
function categoriasPorTipo(tipo) {
  const c = cfg();
  let arr = [];
  if (tipo === 'Gasto') arr = (c.categoriasGasto || []).map((x) => x.nombre);
  else if (tipo === 'Factura') arr = (c.facturas || []).map((x) => x.nombre);
  else if (tipo === 'Ahorro') arr = (c.ahorro || []).map((x) => x.nombre);
  else if (tipo === 'Deuda') arr = (c.deudas || []).map((x) => x.nombre);
  else if (tipo === 'Ingreso') arr = (c.ingresos || []).slice();
  return arr.filter(Boolean);
}

/* ============================================================
   SHELL + RENDER
   ============================================================ */
const TABS = [
  { id: 'inicio', label: 'Inicio', icon: 'home' },
  { id: 'movimientos', label: 'Movimientos', icon: 'list' },
  { id: 'analisis', label: 'Análisis', icon: 'chart' },
  { id: 'tareas', label: 'Tareas', icon: 'checkCircle' },
  { id: 'mas', label: 'Más', icon: 'more' },
];
function tabBtn(t) {
  return '<button class="tab" data-tab="' + t.id + '" ' + act('goTab', t.id) + '><span class="ic">' + ic(t.icon) + '</span><span>' + t.label + '</span></button>';
}
function renderShell() {
  $('#app').innerHTML =
    '<nav class="rail" aria-label="Secciones"><div class="brand">Mis Finanzas<span class="sub">y Tareas</span></div>' +
    TABS.map(tabBtn).join('') +
    '<button class="rail-fab" ' + act('onFab') + '>' + ic('plus') + ' Añadir</button></nav>' +
    '<div class="page"><header class="topbar"><h1 id="pageTitle"></h1><div class="sub">' + fmtDateLong(todayISO()) + '</div></header><main id="content"></main></div>' +
    '<nav class="tabbar" aria-label="Secciones">' + TABS.map(tabBtn).join('') + '</nav>' +
    '<button class="fab" ' + act('onFab') + ' aria-label="Añadir">' + ic('plus') + '</button>' +
    '<div id="sheetHost"></div><div class="toast" id="toast" role="status"></div>';
}

function loadingHtml() { return '<div class="loading"><div class="spinner"></div><div id="loadingMsg">' + escapeHtml(S.loadingMsg) + '</div></div>'; }

/* ============================================================
   LOGIN (pantalla completa, sin navegación)
   ============================================================ */
function renderLoginScreen(msg) {
  $('#app').innerHTML =
    '<div style="min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;">' +
    '<div class="card" style="width:100%;max-width:360px;">' +
    '<div style="text-align:center;margin-bottom:22px;">' +
    '<div class="num" style="font-size:26px;font-weight:600;color:var(--ink);">Mis Finanzas<span style="display:block;font-family:var(--font-ui);font-size:13px;font-weight:400;color:var(--text-faint);margin-top:2px;">y Tareas</span></div></div>' +
    '<div class="field"><label>Correo</label><input id="loginEmail" type="email" autocomplete="username" placeholder="tu@correo.com"></div>' +
    '<div class="field"><label>Contraseña</label><input id="loginPassword" type="password" autocomplete="current-password"></div>' +
    (msg ? '<div class="alert" style="margin-top:2px;">' + ic('alert') + '<div>' + escapeHtml(msg) + '</div></div>' : '') +
    '<button class="btn accent block" style="margin-top:6px;" ' + act('doLogin') + '>Iniciar sesión</button>' +
    '<button class="section-title link" style="width:100%;text-align:center;margin-top:16px;justify-content:center;" ' + act('doForgotPassword') + '>¿Olvidaste tu contraseña?</button>' +
    '</div></div>';
  setTimeout(() => { const el = $('#loginEmail'); if (el) el.focus(); }, 60);
}
function loginBusy(isBusy) {
  const b = $('[data-click="doLogin"]');
  if (b) { b.disabled = isBusy; b.textContent = isBusy ? 'Entrando…' : 'Iniciar sesión'; }
}

function render() {
  if (S.onboarding) { renderOnboarding(); return; }
  const c = $('#content');
  if (!c) return;
  $$('[data-tab]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === S.tab));
  const title = $('#pageTitle'); if (title) title.textContent = TABS.find((t) => t.id === S.tab).label;
  if (!allLoaded()) { c.innerHTML = loadingHtml(); return; }
  if (S.tab === 'inicio') c.innerHTML = renderInicio();
  else if (S.tab === 'movimientos') c.innerHTML = renderMovimientos();
  else if (S.tab === 'analisis') c.innerHTML = renderAnalisis();
  else if (S.tab === 'tareas') c.innerHTML = renderTareas();
  else if (S.tab === 'mas') c.innerHTML = renderMas();
  if (S.tab === 'analisis' && S.analisisSub === 'mensual') drawDonut();
  if (S.tab === 'analisis' && S.analisisSub === 'anual') drawTrend();
}



/* ============================================================
   INICIO
   ============================================================ */
function renderInicio() {
  const d = new Date(), y = d.getFullYear(), m = d.getMonth() + 1;
  const k = kpisMes(y, m);
  const vencidas = tareasVencidas();
  const excedidas = presupuestoExcedido(y, m);
  const proximas = S.tareas.filter((t) => t.estado !== 'Completado').sort(cmpTarea).slice(0, 3);
  const cat = gastoPorCategoria(k.movs);
  const top = Object.entries(cat).filter((e) => e[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxV = top.length ? top[0][1] : 1;

  return '<div class="kpi-row">' +
    '<div class="kpi income"><div class="v tnum">' + moneyShort(k.ingresos) + '</div><div class="l">Ingresos</div></div>' +
    '<div class="kpi expense"><div class="v tnum">' + moneyShort(k.facturas + k.gastos) + '</div><div class="l">Gastos</div></div>' +
    '<div class="kpi avail"><div class="v tnum">' + moneyShort(k.disponible) + '</div><div class="l">Disponible</div></div></div>' +
    '<div class="summary-line" style="margin-bottom:0;">' + MESES[m - 1] + ' ' + y + '</div>' +

    ((vencidas.length || excedidas.length) ? '<div class="section-title">Avisos</div>' +
      (vencidas.length ? '<div class="alert">' + ic('alert') + '<div><b>' + vencidas.length + (vencidas.length > 1 ? ' tareas vencidas' : ' tarea vencida') + '</b>Míralas en la pestaña Tareas.</div></div>' : '') +
      excedidas.map((c) => '<div class="alert warn">' + ic('alert') + '<div><b>' + escapeHtml(c.categoria) + ' por encima del presupuesto</b>' + money(c.real) + ' de ' + money(c.presupuesto) + ' este mes.</div></div>').join('') : '') +

    '<div class="section-title">Próximas tareas <button class="link" ' + act('goTab', 'tareas') + '>Ver todas</button></div>' +
    (proximas.length ? '<div class="list">' + proximas.map(renderTareaRow).join('') + '</div>'
      : '<div class="card" style="text-align:center;color:var(--text-faint);font-size:13.5px;">No tienes tareas pendientes.</div>') +

    renderMetasInicio() +

    '<div class="section-title">Donde más gastas este mes <button class="link" ' + act('goTab', 'analisis') + '>Ver análisis</button></div>' +
    '<div class="card">' + (top.length ? top.map(([n, v]) =>
      '<div class="budget-row"><div class="top"><span class="cat">' + escapeHtml(n) + '</span><span class="nums"><b class="tnum">' + money(v) + '</b></span></div>' +
      '<div class="progress"><div style="width:' + Math.max(0, Math.min(100, v / maxV * 100)) + '%"></div></div></div>').join('')
      : '<div style="color:var(--text-faint);font-size:13.5px;">Todavía no hay gastos este mes.</div>') + '</div>';
}

/* ============================================================
   MOVIMIENTOS
   ============================================================ */
function inPeriodo(m) {
  const p = S.movPeriodo;
  if (p === 'todo') return true;
  const d = new Date(), y = d.getFullYear(), mo = d.getMonth() + 1;
  const fy = Number((m.fecha || '').slice(0, 4)), fm = Number((m.fecha || '').slice(5, 7));
  if (p === 'mes') return fy === y && fm === mo;
  if (p === 'anterior') { const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y; return fy === py && fm === pm; }
  if (p === 'anio') return fy === y;
  return true;
}
function movsFiltrados() {
  let movs = S.movimientos.filter(inPeriodo);
  if (S.movFiltroTipo !== 'Todos') movs = movs.filter((m) => m.tipo === S.movFiltroTipo);
  const q = S.movQuery.trim().toLowerCase();
  if (q) movs = movs.filter((m) => [m.categoria, m.descripcion, m.metodoPago].some((x) => (x || '').toLowerCase().includes(q)));
  return movs.sort(cmpMov);
}
function renderMovimientos() {
  const periodos = [['todo', 'Todo'], ['mes', 'Este mes'], ['anterior', 'Mes anterior'], ['anio', 'Este año']];
  return '<div class="field" style="margin-bottom:10px;"><input type="search" id="movSearch" placeholder="Buscar categoría, nota o método de pago" value="' + escapeHtml(S.movQuery) + '" ' + onInput('onMovSearch') + '></div>' +
    '<div class="pill-row">' + ['Todos'].concat(TIPOS).map((t) => '<button class="pill ' + (S.movFiltroTipo === t ? 'active' : '') + '" ' + act('setMovFiltro', t) + '>' + t + '</button>').join('') + '</div>' +
    '<div class="pill-row" style="padding-top:0;">' + periodos.map(([id, l]) => '<button class="pill sm ' + (S.movPeriodo === id ? 'active' : '') + '" ' + act('setMovPeriodo', id) + '>' + l + '</button>').join('') + '</div>' +
    '<div id="movList">' + renderMovList() + '</div>';
}
function renderMovList() {
  const movs = movsFiltrados();
  if (!movs.length) {
    return '<div class="empty"><div class="big">' + ic('wallet') + '</div><b>Sin movimientos aquí</b><div style="margin-top:4px;">Cambia el filtro o añade uno nuevo.</div>' +
      '<div class="cta"><button class="btn accent" ' + act('openMovForm') + '>' + ic('plus') + ' Añadir movimiento</button></div></div>';
  }
  const net = movs.reduce((a, m) => a + effect(m.importe, m.tipo), 0);
  const shown = movs.slice(0, S.movLimit);
  let html = '<div class="summary-line">' + movs.length + (movs.length === 1 ? ' movimiento' : ' movimientos') + ' · balance ' + (net >= 0 ? '+' : '−') + fmt2(Math.abs(net)) + ' €</div>';
  let last = null;
  shown.forEach((m) => {
    if (m.fecha !== last) { if (last !== null) html += '</div>'; html += '<div class="date-sep">' + fmtDateGroup(m.fecha) + '</div><div class="list">'; last = m.fecha; }
    html += renderMovRow(m);
  });
  if (last !== null) html += '</div>';
  if (movs.length > shown.length) html += '<div style="margin-top:14px;"><button class="btn ghost block" ' + act('movMore') + '>Mostrar más (' + (movs.length - shown.length) + ')</button></div>';
  return html;
}
function renderMovRow(m) {
  const eff = effect(m.importe, m.tipo);
  return '<div class="row" ' + act('openMovForm', m.id) + '>' +
    '<span class="dot" style="background:var(--' + (TIPO_COLOR[m.tipo] || 'debt') + ')"></span>' +
    '<div class="main"><div class="ttl">' + escapeHtml(m.categoria || 'Sin categoría') + '</div>' +
    '<div class="meta">' + (m.descripcion ? escapeHtml(m.descripcion) + ' · ' : '') + escapeHtml(m.tipo) + (m.metodoPago ? ' · ' + escapeHtml(m.metodoPago) : '') + '</div></div>' +
    '<div class="amt tnum ' + (eff >= 0 ? 'pos' : 'neg') + '">' + moneySigned(m.importe, m.tipo) + '</div></div>';
}

function chipsHtml(tipo, current) {
  const cats = categoriasPorTipo(tipo);
  if (!cats.length) return '';
  return '<div class="chips">' + cats.map((c) => '<button type="button" class="chip ' + (c === current ? 'active' : '') + '" ' + act('pickCat', c) + '>' + escapeHtml(c) + '</button>').join('') + '</div>';
}
function openMovForm(id) {
  const ex = id ? S.movimientos.find((m) => m.id === id) : null;
  const tipoIni = ex ? ex.tipo : (S.tab === 'movimientos' && S.movFiltroTipo !== 'Todos' ? S.movFiltroTipo : 'Gasto');
  FORM = { kind: 'mov', id: ex ? ex.id : null, tipo: tipoIni };
  const metodos = cfg().metodosPago || [];
  openSheet(
    '<div class="handle"></div><h2>' + (ex ? 'Editar movimiento' : 'Nuevo movimiento') + '</h2>' +
    '<div class="field"><label>Tipo</label><div class="type-toggle" id="tipoToggle">' +
    TIPOS.map((t) => '<button type="button" data-t="' + t + '" class="' + (t === tipoIni ? 'active' : '') + '" ' + act('pickTipo', t) + '>' + t + '</button>').join('') + '</div></div>' +
    '<div class="field"><label>Importe (€) <span class="hint">· en negativo si es una devolución</span></label><input id="fImporte" type="number" step="0.01" inputmode="decimal" placeholder="0,00" value="' + (ex ? ex.importe : '') + '"></div>' +
    '<div class="field"><label>Categoría</label><div id="catChips">' + chipsHtml(tipoIni, ex ? ex.categoria : '') + '</div>' +
    '<input id="fCategoria" type="text" placeholder="…o escribe otra" value="' + escapeHtml(ex ? ex.categoria : '') + '" ' + onInput('onCatInput') + '></div>' +
    '<div class="field"><label>Fecha</label><input id="fFecha" type="date" value="' + (ex ? ex.fecha : todayISO()) + '"></div>' +
    '<div class="field"><label>Descripción <span class="hint">· opcional</span></label><input id="fDesc" type="text" placeholder="Nota rápida" value="' + escapeHtml(ex ? ex.descripcion : '') + '"></div>' +
    '<div class="field"><label>Método de pago <span class="hint">· opcional</span></label><select id="fMetodo"><option value="">—</option>' +
    metodos.map((mm) => '<option ' + (ex && ex.metodoPago === mm ? 'selected' : '') + '>' + escapeHtml(mm) + '</option>').join('') + '</select></div>' +
    '<div class="actions"><button class="btn ghost block" ' + act('closeSheet') + '>Cancelar</button><button class="btn accent block" ' + act('saveMov') + '>Guardar</button></div>' +
    (ex ? '<button class="btn danger block" style="margin-top:10px;" ' + act('deleteMov') + '>' + ic('trash') + ' Eliminar movimiento</button>' : '')
  );
  if (!ex) setTimeout(() => { const el = $('#fImporte'); if (el) el.focus(); }, 80);
}
async function saveMov() {
  const importe = parseFloat($('#fImporte').value);
  const categoria = $('#fCategoria').value.trim();
  const fecha = $('#fFecha').value;
  if (!isFinite(importe) || importe === 0) return toast('Pon un importe válido');
  if (!categoria) return toast('Elige o escribe una categoría');
  if (!fecha) return toast('Elige una fecha');
  const ex = FORM.id ? S.movimientos.find((m) => m.id === FORM.id) : null;
  const data = Object.assign(ex ? stripId(ex) : { creadoEn: Date.now() }, {
    tipo: FORM.tipo, importe, categoria, fecha,
    descripcion: $('#fDesc').value.trim(), metodoPago: $('#fMetodo').value,
  });
  const ok = await write(() => FORM.id ? S.db.collection('movimientos').doc(FORM.id).set(data) : S.db.collection('movimientos').add(data));
  if (ok) { closeSheet(); toast(FORM.id ? 'Movimiento actualizado' : 'Movimiento añadido'); }
}
async function doDeleteMov() {
  const ok = await write(() => S.db.collection('movimientos').doc(FORM.id).delete());
  if (ok) { closeSheet(); toast('Movimiento eliminado'); }
}

/* ============================================================
   ANÁLISIS
   ============================================================ */
function renderAnalisis() {
  const subs = [['mensual', 'Mensual'], ['anual', 'Anual'], ['metas', 'Metas'], ['proyectos', 'Proyectos']];
  return '<div class="segmented">' + subs.map(([id, l]) => '<button class="' + (S.analisisSub === id ? 'active' : '') + '" ' + act('setAnalisisSub', id) + '>' + l + '</button>').join('') + '</div>' +
    '<div style="margin-top:16px;">' + (S.analisisSub === 'mensual' ? renderAnalisisMensual() : S.analisisSub === 'anual' ? renderAnalisisAnual() : S.analisisSub === 'metas' ? renderMetas() : renderProyectos()) + '</div>';
}
function renderAnalisisMensual() {
  const k = kpisMes(S.anioSel, S.mesSel);
  const catMap = gastoPorCategoria(k.movs);
  const cats = (cfg().categoriasGasto || []).filter((c) => c.nombre);
  const conocidas = new Set(cats.map((c) => c.nombre));
  const extra = Object.keys(catMap).filter((n) => !conocidas.has(n) && catMap[n] !== 0).map((n) => ({ nombre: n, presupuesto: null }));
  const filas = cats.concat(extra);
  const totPres = cats.reduce((a, c) => a + num(c.presupuesto), 0);
  const totReal = Object.values(catMap).reduce((a, v) => a + v, 0);
  const hayGasto = Object.values(catMap).some((v) => v > 0);

  return '<div class="month-nav"><button class="icon-btn" aria-label="Mes anterior" ' + act('moveMes', -1) + '>' + ic('chevL') + '</button>' +
    '<div class="lbl">' + MESES[S.mesSel - 1] + ' ' + S.anioSel + '</div>' +
    '<button class="icon-btn" aria-label="Mes siguiente" ' + act('moveMes', 1) + '>' + ic('chevR') + '</button></div>' +
    '<div class="kpi-row">' +
    '<div class="kpi income"><div class="v tnum">' + moneyShort(k.ingresos) + '</div><div class="l">Ingresos</div></div>' +
    '<div class="kpi expense"><div class="v tnum">' + moneyShort(k.facturas + k.gastos) + '</div><div class="l">Gastos</div></div>' +
    '<div class="kpi avail"><div class="v tnum">' + moneyShort(k.disponible) + '</div><div class="l">Disponible</div></div></div>' +

    '<div class="section-title">Reparto del gasto</div><div class="card">' +
    (hayGasto ? '<div class="chart-wrap" id="donutWrap"></div><div class="legend" id="donutLegend"></div>'
      : '<div style="text-align:center;color:var(--text-faint);font-size:13.5px;">Sin gastos registrados en ' + MESES[S.mesSel - 1].toLowerCase() + '.</div>') + '</div>' +

    '<div class="section-title">Presupuesto por categoría</div><div class="card">' +
    (filas.length ? '<div class="summary-line" style="margin-top:0;">Gastado ' + money(totReal) + (totPres ? ' de ' + money(totPres) + ' presupuestados' : '') + '</div>' +
      filas.map((c) => {
        const real = catMap[c.nombre] || 0, pres = num(c.presupuesto);
        const over = pres > 0 && real > pres;
        const pct = pres > 0 ? real / pres * 100 : (real > 0 ? 100 : 0);
        return '<div class="budget-row ' + (over ? 'over' : '') + '"><div class="top"><span class="cat">' + escapeHtml(c.nombre) + '</span>' +
          '<span class="nums"><b class="tnum">' + money(real) + '</b>' + (pres > 0 ? ' / ' + money(pres) : '') + '</span></div>' +
          '<div class="progress ' + (over ? 'over' : '') + '"><div style="width:' + Math.max(0, Math.min(100, pct)) + '%"></div></div></div>';
      }).join('')
      : '<div style="color:var(--text-faint);font-size:13.5px;">Añade categorías en Más → Categorías de gasto.</div>') + '</div>';
}
function renderAnalisisAnual() {
  const rows = [];
  for (let m = 1; m <= 12; m++) rows.push(Object.assign({ m }, kpisMes(S.anioSel, m)));
  const totIng = rows.reduce((a, r) => a + r.ingresos, 0);
  const totGas = rows.reduce((a, r) => a + r.facturas + r.gastos, 0);
  const totAho = rows.reduce((a, r) => a + r.ahorro, 0);
  const tasa = totIng > 0 ? totAho / totIng * 100 : 0;
  return '<div class="month-nav"><button class="icon-btn" aria-label="Año anterior" ' + act('moveAnio', -1) + '>' + ic('chevL') + '</button>' +
    '<div class="lbl" style="min-width:90px;">' + S.anioSel + '</div>' +
    '<button class="icon-btn" aria-label="Año siguiente" ' + act('moveAnio', 1) + '>' + ic('chevR') + '</button></div>' +
    '<div class="kpi-row">' +
    '<div class="kpi income"><div class="v tnum">' + moneyShort(totIng) + '</div><div class="l">Ingresos</div></div>' +
    '<div class="kpi expense"><div class="v tnum">' + moneyShort(totGas) + '</div><div class="l">Gastos</div></div>' +
    '<div class="kpi avail"><div class="v tnum">' + tasa.toFixed(0) + '%</div><div class="l">Tasa de ahorro</div></div></div>' +
    '<div class="section-title">Ingresos y gastos por mes</div><div class="card"><div class="chart-wrap" id="trendWrap"></div>' +
    '<div class="legend"><span><i style="background:var(--income)"></i>Ingresos</span><span><i style="background:var(--expense)"></i>Gastos</span></div></div>' +
    '<div class="section-title">Detalle</div><div class="list">' +
    rows.map((r) => '<div class="row static"><div class="main"><div class="ttl">' + MESES[r.m - 1] + '</div></div>' +
      '<div class="amt pos tnum" style="min-width:88px;text-align:right;">' + moneyShort(r.ingresos) + '</div>' +
      '<div class="amt neg tnum" style="min-width:88px;text-align:right;">' + moneyShort(r.facturas + r.gastos) + '</div></div>').join('') + '</div>';
}
/* ============================================================
   METAS DE AHORRO (Fase 2): cálculos + vista
   ============================================================ */
const META_UMBRAL_AMARILLO = 0.7; // ritmo real / ritmo necesario
function isoDaysAgo(n) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function fmtMesAnio(d) { return MESES_ABR[d.getMonth()].toLowerCase() + ' ' + d.getFullYear(); }
function metaStats(m) {
  const key = (m.nombre || '').trim().toLowerCase();
  const movs = S.movimientos.filter((x) => x.tipo === 'Ahorro' && (x.categoria || '').trim().toLowerCase() === key);
  const acum = num(m.yaAhorrado) + movs.reduce((a, x) => a + num(x.importe), 0);
  const obj = num(m.objetivo);
  const falta = Math.max(0, obj - acum);
  const pct = obj > 0 ? acum / obj * 100 : null;
  const hoyISO = todayISO(), desde = isoDaysAgo(90);
  const ritmo = movs.filter((x) => (x.fecha || '') > desde && (x.fecha || '') <= hoyISO).reduce((a, x) => a + num(x.importe), 0) / 3;
  const dias = m.fechaObjetivo ? daysUntil(m.fechaObjetivo) : null;
  const r = { nombre: m.nombre, acum, obj, falta, pct, ritmo, dias, fecha: m.fechaObjetivo || null, mes: null, tri: null, anio: null, llegada: null, estado: 'gris', texto: '' };
  if (obj <= 0) { r.texto = 'Sin objetivo definido'; return r; }
  if (falta <= 0) { r.estado = 'verde'; r.texto = 'Meta lograda'; return r; }
  if (ritmo > 0) { const d = new Date(); d.setDate(d.getDate() + Math.round(falta / ritmo * 30.4375)); r.llegada = d; }
  if (dias == null) { r.texto = 'Sin fecha objetivo'; return r; }
  if (dias < 0) { r.estado = 'rojo'; r.texto = 'La fecha ya pasó y falta ' + money(falta); return r; }
  r.mes = falta / Math.max(dias / 30.4375, 1); r.tri = r.mes * 3; r.anio = r.mes * 12;
  const ratio = ritmo / r.mes;
  if (ratio >= 1) { r.estado = 'verde'; r.texto = 'Vas bien: ritmo suficiente'; }
  else if (ratio >= META_UMBRAL_AMARILLO) { r.estado = 'amarillo'; r.texto = 'Ritmo justo: conviene mejorar'; }
  else { r.estado = 'rojo'; r.texto = 'Al ritmo actual no llegarías'; }
  return r;
}
function metasStats() { return (cfg().ahorro || []).filter((m) => m && m.nombre).map(metaStats); }
const SEMAFORO_COLOR = { verde: 'var(--income)', amarillo: 'var(--accent)', rojo: 'var(--expense)', gris: 'var(--text-faint)' };
function semaforoDot(estado) { return '<span class="dot" style="background:' + SEMAFORO_COLOR[estado] + ';flex:none;"></span>'; }
function renderMetas() {
  const ms = metasStats();
  if (!ms.length) return '<div class="card" style="text-align:center;color:var(--text-faint);font-size:13.5px;">Todavía no tienes metas de ahorro. Créalas en Más → Metas de ahorro (con objetivo y fecha).</div>';
  return ms.map((r) => {
    const pctC = r.pct == null ? 0 : Math.max(0, Math.min(100, r.pct));
    let h = '<div class="card" style="margin-bottom:12px;">' +
      '<div class="budget-row" style="margin:0;"><div class="top"><span class="cat" style="display:flex;align-items:center;gap:8px;">' + semaforoDot(r.estado) + escapeHtml(r.nombre) + '</span>' +
      '<span class="nums"><b class="tnum">' + (r.pct == null ? '—' : r.pct.toFixed(0) + '%') + '</b></span></div>' +
      '<div class="progress"><div style="width:' + pctC + '%;background:' + SEMAFORO_COLOR[r.estado] + ';"></div></div></div>' +
      '<div class="summary-line">' + money(r.acum) + (r.obj > 0 ? ' de ' + money(r.obj) : '') + (r.fecha ? ' · hasta ' + fmtDateLong(r.fecha) : '') + '</div>' +
      '<div style="font-size:13.5px;font-weight:600;color:' + SEMAFORO_COLOR[r.estado] + ';margin:2px 0 6px;">' + escapeHtml(r.texto) + '</div>';
    if (r.mes != null) {
      h += '<div style="font-size:13px;color:var(--text-faint);line-height:1.6;">Necesitas ahorrar aprox. <b class="tnum" style="color:var(--text);">' + money(r.mes) + '/mes</b> · ' + money(r.tri) + '/trimestre · ' + money(r.anio) + '/año.</div>';
    }
    if (r.obj > 0 && r.falta > 0) {
      h += '<div style="font-size:13px;color:var(--text-faint);line-height:1.6;">Tu ritmo (últimos 3 meses): <b class="tnum" style="color:var(--text);">' + money(r.ritmo) + '/mes</b>' +
        (r.llegada ? ' · al ritmo actual llegarías en ' + fmtMesAnio(r.llegada) : ' · sin ahorro reciente para estimar') + '.</div>';
    }
    return h + '</div>';
  }).join('') + '<div class="summary-line">El ahorro de cada meta sale de tus movimientos de tipo Ahorro con ese nombre, más lo que indiques en «Ya ahorrado antes».</div>';
}
function renderMetasInicio() {
  const ms = metasStats().filter((r) => r.obj > 0);
  if (!ms.length) return '';
  const cnt = { verde: 0, amarillo: 0, rojo: 0, gris: 0 }; ms.forEach((r) => { cnt[r.estado]++; });
  const sum = ['verde', 'amarillo', 'rojo'].filter((e) => cnt[e]).map((e) => '<span style="display:inline-flex;align-items:center;gap:5px;margin-right:12px;">' + semaforoDot(e) + cnt[e] + '</span>').join('');
  return '<div class="section-title">Metas de ahorro <button class="link" ' + act('goMetas') + '>Ver metas</button></div><div class="card">' +
    ms.slice(0, 3).map((r) => '<div class="budget-row"><div class="top"><span class="cat" style="display:flex;align-items:center;gap:8px;">' + semaforoDot(r.estado) + escapeHtml(r.nombre) + '</span>' +
      '<span class="nums"><b class="tnum">' + (r.pct == null ? '—' : r.pct.toFixed(0) + '%') + '</b></span></div>' +
      '<div class="progress"><div style="width:' + Math.max(0, Math.min(100, r.pct || 0)) + '%;background:' + SEMAFORO_COLOR[r.estado] + ';"></div></div></div>').join('') +
    (ms.length > 1 ? '<div class="summary-line">' + sum + '</div>' : '') + '</div>';
}
function renderProyectos() {
  const t = golfTotales();
  const items = S.golf.slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  return '<div class="section-title" style="margin-top:2px;"><span>' + ic('flag') + ' Golf Reventa</span></div>' +
    '<div class="kpi-row"><div class="kpi"><div class="v tnum">' + moneyShort(t.inv) + '</div><div class="l">Invertido</div></div>' +
    '<div class="kpi ' + (t.ben >= 0 ? 'income' : 'expense') + '"><div class="v tnum">' + moneyShort(t.ben) + '</div><div class="l">Beneficio</div></div>' +
    '<div class="kpi"><div class="v tnum">' + t.enCartera + '</div><div class="l">En cartera</div></div></div>' +
    '<div class="section-title">Artículos</div>' +
    (items.length ? '<div class="list">' + items.map((g) => {
      const vendido = g.venta != null && g.venta !== '';
      const ben = vendido ? num(g.venta) - num(g.invertido) : null;
      const roi = vendido && num(g.invertido) > 0 ? Math.round(ben / num(g.invertido) * 100) : null;
      return '<div class="row" ' + act('openGolfForm', g.id) + '><span class="dot" style="background:' + (vendido ? 'var(--income)' : 'var(--accent)') + '"></span>' +
        '<div class="main"><div class="ttl">' + escapeHtml(g.articulo) + '</div><div class="meta">' + fmtDateShort(g.fecha) + ' ' + (g.fecha || '').slice(0, 4) + ' · ' + (vendido ? 'Vendido · ' + (roi >= 0 ? '+' : '') + roi + '%' : 'En cartera') + '</div></div>' +
        '<div class="amt tnum ' + (vendido ? (ben >= 0 ? 'pos' : 'neg') : '') + '">' + (vendido ? (ben >= 0 ? '+' : '−') + fmt2(Math.abs(ben)) + ' €' : money(g.invertido)) + '</div></div>';
    }).join('') + '</div>' : '<div class="empty"><b>Sin artículos todavía</b></div>') +
    '<div style="margin-top:16px;"><button class="btn ghost block" ' + act('openGolfForm') + '>' + ic('plus') + ' Añadir artículo</button></div>';
}
function openGolfForm(id) {
  const ex = id ? S.golf.find((g) => g.id === id) : null;
  FORM = { kind: 'golf', id: ex ? ex.id : null };
  openSheet(
    '<div class="handle"></div><h2>' + (ex ? 'Editar artículo' : 'Nuevo artículo de golf') + '</h2>' +
    '<div class="field"><label>Artículo</label><input id="gArt" type="text" placeholder="Ej. Driver Titleist" value="' + escapeHtml(ex ? ex.articulo : '') + '"></div>' +
    '<div class="field"><label>Fecha</label><input id="gFecha" type="date" value="' + (ex ? ex.fecha : todayISO()) + '"></div>' +
    '<div class="field"><label>Invertido (€)</label><input id="gInv" type="number" step="0.01" inputmode="decimal" value="' + (ex ? ex.invertido : '') + '"></div>' +
    '<div class="field"><label>Venta (€) <span class="hint">· vacío si aún no lo has vendido</span></label><input id="gVenta" type="number" step="0.01" inputmode="decimal" value="' + (ex && ex.venta != null ? ex.venta : '') + '"></div>' +
    '<div class="actions"><button class="btn ghost block" ' + act('closeSheet') + '>Cancelar</button><button class="btn accent block" ' + act('saveGolf') + '>Guardar</button></div>' +
    (ex ? '<button class="btn danger block" style="margin-top:10px;" ' + act('deleteGolf') + '>' + ic('trash') + ' Eliminar artículo</button>' : '')
  );
}
async function saveGolf() {
  const articulo = $('#gArt').value.trim();
  const invertido = parseFloat($('#gInv').value);
  const ventaRaw = $('#gVenta').value;
  if (!articulo) return toast('Ponle un nombre al artículo');
  if (!isFinite(invertido) || invertido < 0) return toast('Indica cuánto invertiste');
  const ex = FORM.id ? S.golf.find((g) => g.id === FORM.id) : null;
  const data = Object.assign(ex ? stripId(ex) : {}, {
    articulo, fecha: $('#gFecha').value || todayISO(), invertido, venta: ventaRaw === '' ? null : parseFloat(ventaRaw),
  });
  const ok = await write(() => FORM.id ? S.db.collection('golf').doc(FORM.id).set(data) : S.db.collection('golf').add(data));
  if (ok) { closeSheet(); toast(FORM.id ? 'Artículo actualizado' : 'Artículo añadido'); }
}
async function doDeleteGolf() {
  const ok = await write(() => S.db.collection('golf').doc(FORM.id).delete());
  if (ok) { closeSheet(); toast('Artículo eliminado'); }
}

/* ---- gráficos SVG propios ---- */
const PALETTE = ['#B8752A', '#A8452F', '#2F6F52', '#7A5AA8', '#3D6BA5', '#C7823C', '#8C5A3C', '#5A8C6B', '#B0568C', '#5A7A8C', '#9C8C3C', '#7A3C5A'];
function drawDonut() {
  const wrap = $('#donutWrap'); if (!wrap) return;
  const k = kpisMes(S.anioSel, S.mesSel);
  const entries = Object.entries(gastoPorCategoria(k.movs)).filter((e) => e[1] > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((a, e) => a + e[1], 0);
  if (!total) return;
  const cx = 100, cy = 95, r = 76;
  let angle = -90, paths = '';
  entries.forEach(([name, val], i) => {
    const sweep = Math.min(359.99, val / total * 360);
    const a1 = angle * Math.PI / 180, a2 = (angle + sweep) * Math.PI / 180;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1), x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    paths += '<path d="M' + cx + ',' + cy + ' L' + x1.toFixed(2) + ',' + y1.toFixed(2) + ' A' + r + ',' + r + ' 0 ' + (sweep > 180 ? 1 : 0) + ' 1 ' + x2.toFixed(2) + ',' + y2.toFixed(2) + ' Z" fill="' + PALETTE[i % PALETTE.length] + '"><title>' + escapeHtml(name) + '</title></path>';
    angle += sweep;
  });
  wrap.innerHTML = '<svg viewBox="0 0 200 190" width="100%" height="100%" role="img" aria-label="Reparto del gasto por categoría">' + paths +
    '<circle cx="' + cx + '" cy="' + cy + '" r="44" style="fill:var(--paper-raised)"/>' +
    '<text x="' + cx + '" y="' + (cy - 3) + '" text-anchor="middle" font-size="14" font-weight="700" style="fill:var(--text)" font-family="Work Sans, sans-serif">' + moneyShort(total) + '</text>' +
    '<text x="' + cx + '" y="' + (cy + 13) + '" text-anchor="middle" font-size="9.5" style="fill:var(--text-faint)" font-family="Work Sans, sans-serif">gastado</text></svg>';
  const leg = $('#donutLegend');
  if (leg) leg.innerHTML = entries.slice(0, 9).map(([name, val], i) => '<span><i style="background:' + PALETTE[i % PALETTE.length] + '"></i>' + escapeHtml(name) + ' · ' + Math.round(val / total * 100) + '%</span>').join('');
}
function drawTrend() {
  const wrap = $('#trendWrap'); if (!wrap) return;
  const rows = []; for (let m = 1; m <= 12; m++) rows.push(kpisMes(S.anioSel, m));
  const ing = rows.map((r) => r.ingresos), gas = rows.map((r) => r.facturas + r.gastos);
  const maxV = Math.max(1, ...ing, ...gas);
  const W = 320, H = 190, padL = 10, padR = 10, padT = 14, padB = 22;
  const stepX = (W - padL - padR) / 11;
  const pt = (arr, i) => [padL + stepX * i, padT + (H - padT - padB) * (1 - Math.max(0, arr[i]) / maxV)];
  const poly = (arr) => arr.map((_, i) => pt(arr, i).map((v) => v.toFixed(1)).join(',')).join(' ');
  const dots = (arr, cv) => arr.map((_, i) => { const p = pt(arr, i); return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.6" style="fill:var(' + cv + ')"/>'; }).join('');
  const grid = [0, 0.5, 1].map((f) => { const y = padT + (H - padT - padB) * f; return '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y + '" y2="' + y + '" style="stroke:var(--line)" stroke-width="1"/>'; }).join('');
  wrap.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%" role="img" aria-label="Ingresos y gastos por mes">' + grid +
    '<text x="' + padL + '" y="9" font-size="8.5" style="fill:var(--text-faint)" font-family="Work Sans, sans-serif">' + moneyShort(maxV) + '</text>' +
    '<polyline points="' + poly(ing) + '" fill="none" style="stroke:var(--income)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<polyline points="' + poly(gas) + '" fill="none" style="stroke:var(--expense)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>' +
    dots(ing, '--income') + dots(gas, '--expense') +
    MESES_ABR.map((mm, i) => '<text x="' + (padL + stepX * i).toFixed(1) + '" y="' + (H - 6) + '" font-size="8.5" text-anchor="middle" style="fill:var(--text-faint)" font-family="Work Sans, sans-serif">' + mm.charAt(0) + '</text>').join('') + '</svg>';
}

/* ============================================================
   TAREAS
   ============================================================ */
function renderTareas() {
  const activas = S.tareas.filter((t) => t.estado !== 'Completado').sort(cmpTarea);
  const completadas = S.tareas.filter((t) => t.estado === 'Completado').sort((a, b) => (b.fechaFin || '').localeCompare(a.fechaFin || ''));
  const lista = S.tareasSub === 'activas' ? activas : completadas;
  return '<div class="segmented"><button class="' + (S.tareasSub === 'activas' ? 'active' : '') + '" ' + act('setTareasSub', 'activas') + '>Activas (' + activas.length + ')</button>' +
    '<button class="' + (S.tareasSub === 'completadas' ? 'active' : '') + '" ' + act('setTareasSub', 'completadas') + '>Completadas (' + completadas.length + ')</button></div>' +
    '<div style="height:14px;"></div>' +
    (lista.length ? '<div class="list">' + lista.map(renderTareaRow).join('') + '</div>'
      : '<div class="empty"><div class="big">' + ic('checkCircle') + '</div><b>' + (S.tareasSub === 'activas' ? 'Nada pendiente' : 'Aún no has completado ninguna') + '</b></div>');
}
function renderTareaRow(t) {
  const done = t.estado === 'Completado';
  const vencida = !done && t.fechaLimite && daysUntil(t.fechaLimite) < 0;
  const partes = [];
  if (!done && t.estado === 'Iniciado') partes.push('En curso');
  if (t.categoria) partes.push(t.categoria);
  if (done && t.fechaFin) partes.push('Hecha el ' + fmtDateShort(t.fechaFin));
  else if (t.fechaLimite) partes.push(vencida ? 'Vencida el ' + fmtDateShort(t.fechaLimite) : 'Para el ' + fmtDateShort(t.fechaLimite));
  const dotColor = t.prioridad === 'Alta' ? 'var(--expense)' : t.prioridad === 'Media' ? 'var(--accent)' : 'var(--text-faint)';
  return '<div class="row" ' + act('openTareaForm', t.id) + '>' +
    '<button class="check-btn ' + (done ? 'done' : '') + '" aria-label="' + (done ? 'Reabrir tarea' : 'Completar tarea') + '" ' + act('toggleTarea', t.id) + '>' + (done ? ic('check') : '') + '</button>' +
    '<div class="main"><div class="ttl" style="' + (done ? 'text-decoration:line-through;color:var(--text-faint);' : '') + '">' + escapeHtml(t.nombre) + '</div>' +
    '<div class="meta" style="' + (vencida ? 'color:var(--expense);font-weight:600;' : '') + '">' + escapeHtml(partes.join(' · ') || t.prioridad || '') + '</div></div>' +
    (!done ? '<span class="dot" title="Prioridad ' + escapeHtml(t.prioridad || '') + '" style="background:' + dotColor + '"></span>' : '') + '</div>';
}
// Misma lógica que la macro de Excel, pero ahora en la propia app (funciona también en el móvil)
function aplicaEstado(t, estado) {
  const data = Object.assign(stripId(t), { estado });
  if (estado === 'Iniciado' && !data.fechaInicio) data.fechaInicio = todayISO();
  if (estado === 'Completado') { if (!data.fechaFin) data.fechaFin = todayISO(); }
  else data.fechaFin = null;
  return data;
}
const _busy = new Set();
async function toggleTarea(id) {
  const t = S.tareas.find((x) => x.id === id);
  if (!t || _busy.has(id)) return;
  _busy.add(id);
  const reabrir = t.estado === 'Completado';
  const ok = await write(() => S.db.collection('tareas').doc(id).set(aplicaEstado(t, reabrir ? 'Pendiente' : 'Completado')));
  _busy.delete(id);
  if (ok) toast(reabrir ? 'Tarea reabierta' : '¡Tarea completada!');
}
function openTareaForm(id) {
  const ex = id ? S.tareas.find((t) => t.id === id) : null;
  FORM = { kind: 'tarea', id: ex ? ex.id : null, prioridad: ex ? (ex.prioridad || 'Media') : 'Media', estado: ex ? (ex.estado || 'Pendiente') : 'Pendiente' };
  const cats = cfg().categoriasTareas || [];
  const tg = (attrName, valores, sel, action) => '<div class="type-toggle" id="' + attrName + 'Toggle">' + valores.map((v) => '<button type="button" ' + (attrName === 'prio' ? 'data-p' : 'data-e') + '="' + v + '" class="' + (v === sel ? 'active' : '') + '" ' + act(action, v) + '>' + v + '</button>').join('') + '</div>';
  openSheet(
    '<div class="handle"></div><h2>' + (ex ? 'Editar tarea' : 'Nueva tarea') + '</h2>' +
    '<div class="field"><label>Tarea</label><input id="tNombre" type="text" placeholder="¿Qué hay que hacer?" value="' + escapeHtml(ex ? ex.nombre : '') + '"></div>' +
    '<div class="field"><label>Categoría</label><select id="tCategoria"><option value="">—</option>' + cats.filter(Boolean).map((c) => '<option ' + (ex && ex.categoria === c ? 'selected' : '') + '>' + escapeHtml(c) + '</option>').join('') + '</select></div>' +
    '<div class="field"><label>Prioridad</label>' + tg('prio', ['Baja', 'Media', 'Alta'], FORM.prioridad, 'pickPrio') + '</div>' +
    (ex ? '<div class="field"><label>Estado</label>' + tg('est', ['Pendiente', 'Iniciado', 'Completado'], FORM.estado, 'pickEstado') + '</div>' : '') +
    '<div class="field"><label>Fecha límite <span class="hint">· opcional</span></label><input id="tFecha" type="date" value="' + (ex && ex.fechaLimite ? ex.fechaLimite : '') + '"></div>' +
    '<div class="field"><label>Comentario <span class="hint">· opcional</span></label><input id="tComentario" type="text" value="' + escapeHtml(ex ? ex.comentario : '') + '"></div>' +
    '<div class="actions"><button class="btn ghost block" ' + act('closeSheet') + '>Cancelar</button><button class="btn accent block" ' + act('saveTarea') + '>Guardar</button></div>' +
    (ex ? '<button class="btn danger block" style="margin-top:10px;" ' + act('deleteTarea') + '>' + ic('trash') + ' Eliminar tarea</button>' : '')
  );
  if (!ex) setTimeout(() => { const el = $('#tNombre'); if (el) el.focus(); }, 80);
}
async function saveTarea() {
  const nombre = $('#tNombre').value.trim();
  if (!nombre) return toast('Ponle un nombre a la tarea');
  const ex = FORM.id ? S.tareas.find((t) => t.id === FORM.id) : null;
  const base = ex ? stripId(ex) : { fechaCreacion: todayISO(), fechaInicio: null, fechaFin: null };
  const data = aplicaEstado(Object.assign(base, {
    nombre, categoria: $('#tCategoria').value, prioridad: FORM.prioridad,
    fechaLimite: $('#tFecha').value || null, comentario: $('#tComentario').value.trim(),
  }), FORM.estado);
  const ok = await write(() => FORM.id ? S.db.collection('tareas').doc(FORM.id).set(data) : S.db.collection('tareas').add(data));
  if (ok) { closeSheet(); toast(FORM.id ? 'Tarea actualizada' : 'Tarea añadida'); }
}
async function doDeleteTarea() {
  const ok = await write(() => S.db.collection('tareas').doc(FORM.id).delete());
  if (ok) { closeSheet(); toast('Tarea eliminada'); }
}

/* ============================================================
   MÁS / CONFIGURACIÓN
   ============================================================ */
const LIST_META = {
  categoriasGasto: { title: 'Categorías de gasto', amtField: 'presupuesto', amtLabel: 'Presup./mes', icon: 'tag' },
  facturas: { title: 'Facturas recurrentes', amtField: 'importe', amtLabel: 'Importe', icon: 'wallet',
    extra: [{ field: 'diaDelMes', label: 'Día del mes', type: 'day' }] },
  ahorro: { title: 'Metas de ahorro', amtField: 'objetivo', amtLabel: 'Objetivo', icon: 'flag',
    extra: [{ field: 'fechaObjetivo', label: 'Fecha objetivo', type: 'date' }, { field: 'yaAhorrado', label: 'Ya ahorrado antes (€)', type: 'money' }] },
  deudas: { title: 'Deudas', amtField: 'objetivo', amtLabel: 'Objetivo', icon: 'bank',
    extra: [{ field: 'fechaObjetivo', label: 'Fecha objetivo', type: 'date' }, { field: 'recurrencia', label: 'Recurrencia (ej. mensual)', type: 'text' }] },
  ingresos: { title: 'Fuentes de ingreso', simple: true, icon: 'wallet' },
  metodosPago: { title: 'Métodos de pago', simple: true, icon: 'list' },
  categoriasTareas: { title: 'Categorías de tareas', simple: true, icon: 'checkCircle' },
};
/* ============================================================
   ASISTENTE DE CONFIGURACIÓN (onboarding)
   ============================================================ */
const ONB_CATS = ['Alimentación', 'Vivienda', 'Transporte', 'Ocio', 'Compras', 'Salud', 'Viajes', 'Suscripciones', 'Restaurantes', 'Educación', 'Mascotas', 'Otros'];
const ONB_INGRESOS = ['Nómina', 'Autónomo', 'Transferencias', 'Inversiones', 'Wallapop/Vinted', 'Otros'];
const ONB_PROYECTOS = ['Wallapop', 'Vinted', 'Milanuncios', 'Otro'];
const ONB_STEPS = 5;

function freshOnboardingState(manual) {
  const c = cfg();
  const names = (c.categoriasGasto || []).map((x) => x.nombre).filter(Boolean);
  const clone = (arr) => (arr || []).map((x) => Object.assign({}, x));
  const proy = (c.proyectosInteres || []).slice();
  const otro = proy.find((x) => ONB_PROYECTOS.indexOf(x) < 0 && x !== 'Otro') || '';
  return {
    manual: !!manual, step: 0,
    cats: manual ? names.filter((n) => ONB_CATS.indexOf(n) >= 0) : ONB_CATS.slice(),
    catsCustom: manual ? names.filter((n) => ONB_CATS.indexOf(n) < 0) : [],
    ingresos: (c.ingresos || []).slice(),
    facturas: clone(c.facturas), ahorro: clone(c.ahorro), deudas: clone(c.deudas),
    proyectos: proy.filter((x) => ONB_PROYECTOS.indexOf(x) >= 0).concat(otro ? ['Otro'] : []),
    proyectoOtro: otro,
    saving: false,
  };
}

async function checkOnboarding() {
  S._onboardPending = false;
  try {
    const meta = await S.db.doc('config/meta').get();
    if (meta.exists && meta.data() && meta.data().onboarded) return;
  } catch (e) { return; }
  S._onboardPending = true;
  maybeStartOnboarding();
}
function maybeStartOnboarding() {
  if (!S._onboardPending || !S.loaded.cfg || S.onboarding || !S.db) return;
  S._onboardPending = false;
  const hasCats = cfg().categoriasGasto && cfg().categoriasGasto.length > 0;
  if (hasCats) {
    // Usuario que ya tenía su configuración: no se le muestra el asistente.
    write(() => S.db.doc('config/meta').update({ onboarded: true, onboardedAt: new Date().toISOString(), auto: true }));
    return;
  }
  S.onboarding = freshOnboardingState(false);
  render();
}

function obDots(step) {
  let h = '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:18px;">';
  for (let i = 0; i < ONB_STEPS; i++) h += '<span style="width:' + (i === step ? 22 : 8) + 'px;height:8px;border-radius:4px;background:' + (i <= step ? 'var(--accent)' : 'var(--border)') + ';"></span>';
  return h + '</div>';
}
function obNav(step, last) {
  return '<div class="actions" style="display:flex;gap:10px;margin-top:20px;">' +
    (step > 0 ? '<button class="btn ghost" ' + act('obBack') + '>' + ic('chevL') + ' Atrás</button>' : '') +
    (last ? '<button class="btn accent block" ' + act('obFinish', 'save') + '>Terminar</button>'
      : '<button class="btn accent block" ' + act('obNext') + '>' + (step === 0 ? 'Empezar' : 'Siguiente') + '</button>') +
    '</div>' +
    '<button class="section-title link" style="width:100%;text-align:center;margin-top:12px;justify-content:center;" ' + act('obFinish', step === 0 ? 'none' : 'save') + '>' +
    (step === 0 ? 'Saltar, lo haré más tarde' : 'Guardar y salir') + '</button>';
}
function obChips(all, selected, kind) {
  return '<div class="chips">' + all.map((n) => '<button type="button" class="chip ' + (selected.indexOf(n) >= 0 ? 'active' : '') + '" ' + act(kind, n) + '>' + escapeHtml(n) + '</button>').join('') + '</div>';
}

function obWelcome() {
  return '<div style="text-align:center;margin:10px 0 6px;"><div class="num" style="font-size:24px;font-weight:600;color:var(--ink);">Vamos a dejar tu app lista</div>' +
    '<p style="color:var(--text-faint);font-size:14px;line-height:1.5;margin-top:10px;">En unos minutos configuramos tus categorías, facturas, metas de ahorro y deudas. Todo se puede cambiar después desde <b>Más</b>.</p></div>';
}
function obCats() {
  const ob = S.onboarding;
  const all = ONB_CATS.concat(ob.catsCustom);
  return '<h2 class="num" style="margin:0 0 6px;">Categorías de gasto</h2>' +
    '<p style="color:var(--text-faint);font-size:13.5px;margin:0 0 14px;">Marcadas las más habituales. Quita las que no uses o añade las tuyas.</p>' +
    obChips(all, ob.cats.concat(ob.catsCustom), 'obToggleCat') +
    '<div class="row2" style="margin-top:14px;"><input id="obCustomCat" placeholder="Otra categoría…"><button class="btn ghost" ' + act('obAddCustomCat') + '>' + ic('plus') + '</button></div>';
}
function obRowsEditor(kind, rows, defs, amtLabel, addLabel) {
  const body = rows.map((r, i) => {
    let h = '<div class="row2" style="flex-wrap:wrap;"><input value="' + escapeHtml(r.nombre || '') + '" placeholder="Nombre" ' + onChange('obRowChange', kind, i, 'nombre') + '>' +
      '<input class="amt" type="number" step="0.01" inputmode="decimal" value="' + (r[defs.amt] == null ? '' : escapeHtml(r[defs.amt])) + '" placeholder="' + amtLabel + '" ' + onChange('obRowChange', kind, i, defs.amt) + '>';
    defs.extra.forEach((d) => {
      const common = onChange('obRowChange', kind, i, d.field);
      if (d.type === 'date') h += '<input type="date" style="max-width:150px;" value="' + escapeHtml(r[d.field] || '') + '" ' + common + '>';
      else if (d.type === 'day') h += '<input type="number" min="1" max="31" inputmode="numeric" placeholder="' + d.label + '" style="max-width:96px;" value="' + (r[d.field] == null ? '' : escapeHtml(r[d.field])) + '" ' + common + '>';
      else h += '<input type="text" placeholder="' + d.label + '" value="' + escapeHtml(r[d.field] || '') + '" ' + common + '>';
    });
    return h + '<button class="rm" aria-label="Quitar" ' + act('obRowRemove', kind, i) + '>' + ic('close') + '</button></div>';
  }).join('');
  return '<div class="card config-list">' + (body || '<div style="padding:14px;color:var(--text-faint);font-size:13.5px;">Nada todavía. Puedes saltarte esto.</div>') + '</div>' +
    '<div style="margin-top:10px;"><button class="btn ghost block" ' + act('obRowAdd', kind) + '>' + ic('plus') + ' ' + addLabel + '</button></div>';
}
const OB_DEFS = {
  facturas: { amt: 'importe', extra: [{ field: 'diaDelMes', label: 'Día de cobro', type: 'day' }] },
  ahorro: { amt: 'objetivo', extra: [{ field: 'fechaObjetivo', label: 'Fecha objetivo', type: 'date' }] },
  deudas: { amt: 'objetivo', extra: [{ field: 'fechaObjetivo', label: 'Fecha objetivo', type: 'date' }, { field: 'recurrencia', label: 'Recurrencia (ej. mensual)', type: 'text' }] },
};
function obIncome() {
  const ob = S.onboarding;
  const all = ONB_INGRESOS.concat(ob.ingresos.filter((x) => ONB_INGRESOS.indexOf(x) < 0));
  return '<h2 class="num" style="margin:0 0 6px;">Ingresos y facturas</h2>' +
    '<p style="color:var(--text-faint);font-size:13.5px;margin:0 0 12px;">¿De dónde entra tu dinero?</p>' + obChips(all, ob.ingresos, 'obToggleIngreso') +
    '<div class="section-title" style="margin-top:18px;">Facturas recurrentes</div>' +
    '<p style="color:var(--text-faint);font-size:13px;margin:0 0 8px;">Alquiler, luz, móvil… con el día del mes en que se cobran.</p>' +
    obRowsEditor('facturas', ob.facturas, OB_DEFS.facturas, 'Importe', 'Añadir factura');
}
function obSavingsDebt() {
  const ob = S.onboarding;
  return '<h2 class="num" style="margin:0 0 6px;">Ahorro y deudas</h2>' +
    '<div class="section-title">Metas de ahorro</div>' + obRowsEditor('ahorro', ob.ahorro, OB_DEFS.ahorro, 'Objetivo', 'Añadir meta') +
    '<div class="section-title" style="margin-top:18px;">Deudas</div>' + obRowsEditor('deudas', ob.deudas, OB_DEFS.deudas, 'Total', 'Añadir deuda');
}
function obClose() {
  const ob = S.onboarding;
  return '<h2 class="num" style="margin:0 0 6px;">Casi listo</h2>' +
    '<div class="card" style="padding:14px;margin-bottom:16px;"><div style="display:flex;gap:10px;align-items:flex-start;"><span class="ic">' + ic('checkCircle') + '</span><div style="font-size:13.5px;line-height:1.5;">Además de tus finanzas, esta app gestiona <b>tareas</b>: pendientes con prioridad y fecha límite, en la pestaña Tareas.</div></div></div>' +
    '<div class="section-title">¿Compras y vendes cosas de segunda mano?</div>' +
    '<p style="color:var(--text-faint);font-size:13px;margin:0 0 8px;">Opcional. Nos ayuda a preparar el módulo de proyectos de compra-venta.</p>' +
    obChips(ONB_PROYECTOS, ob.proyectos, 'obToggleProyecto') +
    (ob.proyectos.indexOf('Otro') >= 0 ? '<div class="field" style="margin-top:12px;"><input placeholder="¿Qué plataforma?" value="' + escapeHtml(ob.proyectoOtro) + '" ' + onChange('obProyectoOtroInput') + '></div>' : '');
}
function renderOnboarding() {
  const ob = S.onboarding;
  const body = [obWelcome, obCats, obIncome, obSavingsDebt, obClose][ob.step]();
  $('#app').innerHTML =
    '<div style="min-height:100vh;min-height:100dvh;display:flex;justify-content:center;padding:24px 16px;"><div style="width:100%;max-width:520px;">' +
    obDots(ob.step) + '<div class="card" style="padding:18px;">' + body + '</div>' + obNav(ob.step, ob.step === ONB_STEPS - 1) +
    '</div></div>';
  window.scrollTo(0, 0);
}
async function doObFinish(saveData) {
  const ob = S.onboarding; if (!ob || ob.saving) return;
  ob.saving = true;
  let ok = true;
  if (saveData) {
    const old = cfg();
    const oldBy = {}; (old.categoriasGasto || []).forEach((c) => { oldBy[c.nombre] = c; });
    const names = ONB_CATS.filter((n) => ob.cats.indexOf(n) >= 0).concat(ob.catsCustom);
    const cats = (old.categoriasGasto || []).filter((c) => names.indexOf(c.nombre) >= 0)
      .concat(names.filter((n) => !oldBy[n]).map((n) => ({ nombre: n, presupuesto: null })));
    const clean = (arr) => arr.filter((r) => r.nombre && String(r.nombre).trim());
    const proy = ob.proyectos.filter((x) => x !== 'Otro').concat(ob.proyectos.indexOf('Otro') >= 0 ? [ob.proyectoOtro.trim() || 'Otro'] : []);
    ok = await write(() => S.db.doc('config/app').update({
      categoriasGasto: cats, ingresos: ob.ingresos.slice(),
      facturas: clean(ob.facturas), ahorro: clean(ob.ahorro), deudas: clean(ob.deudas),
      proyectosInteres: proy,
    }));
  }
  if (ok) ok = await write(() => S.db.doc('config/meta').update({ onboarded: true, onboardedAt: new Date().toISOString() }));
  if (!ok) { ob.saving = false; return; }
  S.onboarding = null;
  renderShell(); render();
}
function obToggle(arr, v) { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }

function renderMas() {
  const item = (key) => '<button class="menu-item" ' + act('openListEditor', key) + '><span class="ic">' + ic(LIST_META[key].icon) + '</span>' + LIST_META[key].title + '<span class="chev">' + ic('chevR') + '</span></button>';
  return '<button class="btn accent block" style="margin-bottom:18px;" ' + act('startOnboardingManually') + '>' + ic('flag') + ' Repetir asistente de configuración</button>' +
    '<div class="profile-tile"><div class="av">€</div><div><div class="t">Mis Finanzas y Tareas</div>' +
    '<div class="d">' + escapeHtml((S.user && S.user.email) || '') + ' · datos privados, sincronizados entre tus dispositivos.</div></div></div>' +
    '<div class="section-title">Categorías y presupuestos</div><div class="card menu">' +
    ['categoriasGasto', 'facturas', 'ahorro', 'deudas', 'ingresos', 'metodosPago', 'categoriasTareas'].map(item).join('') + '</div>' +
    '<div class="section-title">Tus datos</div><div class="card menu"><button class="menu-item" ' + act('exportBackup') + '><span class="ic">' + ic('download') + '</span>Copia de seguridad (.json)<span class="chev">' + ic('chevR') + '</span></button></div>' +
    '<div class="section-title">Apariencia</div><div class="card menu"><div class="menu-item static"><span class="ic">' + ic('moon') + '</span>Tema' +
    '<div class="segmented" style="margin-left:auto;">' + [['auto', 'Auto'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([id, l]) => '<button style="padding:6px 12px;" class="' + (S.theme === id ? 'active' : '') + '" ' + act('setTheme', id) + '>' + l + '</button>').join('') + '</div></div></div>' +
    '<div class="section-title">Próximamente</div><div class="card menu">' +
    '<div class="menu-item static"><span class="ic">' + ic('camera') + '</span>Foto de ticket → gasto automático<span class="future-badge">Pronto</span></div>' +
    '<div class="menu-item static"><span class="ic">' + ic('bank') + '</span>Conexión con tu banco<span class="future-badge">Pronto</span></div></div>' +
    '<div class="section-title">Cuenta</div><div class="card menu"><button class="menu-item" ' + act('doLogout') + '><span class="ic">' + ic('close') + '</span>Cerrar sesión</button></div>';
}
function exportBackup() {
  const payload = { exportadoEl: new Date().toISOString(), movimientos: S.movimientos, tareas: S.tareas, golf: S.golf, config: S.config };
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mis-finanzas-backup-' + todayISO() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Copia de seguridad descargada');
  } catch (e) { console.error(e); toast('No se pudo generar la copia'); }
}

function extraFieldHtml(key, i, def, value) {
  const common = onChange('listChange', key, i, def.field);
  if (def.type === 'date') return '<input type="date" style="max-width:150px;" value="' + escapeHtml(value || '') + '" ' + common + '>';
  if (def.type === 'money') return '<input type="number" step="0.01" inputmode="decimal" placeholder="' + def.label + '" style="max-width:130px;" value="' + (value == null ? '' : escapeHtml(value)) + '" ' + common + '>';
  if (def.type === 'day') return '<input type="number" min="1" max="31" inputmode="numeric" placeholder="' + def.label + '" style="max-width:84px;" value="' + (value == null ? '' : escapeHtml(value)) + '" ' + common + '>';
  return '<input type="text" placeholder="' + def.label + '" value="' + escapeHtml(value || '') + '" ' + common + '>';
}
function listEditorHtml(key) {
  const meta = LIST_META[key];
  const items = (cfg()[key] || []);
  const rows = items.map((it, i) => meta.simple
    ? '<div class="row2"><input value="' + escapeHtml(it) + '" placeholder="Nombre" ' + onChange('listChange', key, i, '') + '><button class="rm" aria-label="Quitar" ' + act('listRemove', key, i) + '>' + ic('close') + '</button></div>'
    : '<div class="row2"><input value="' + escapeHtml(it.nombre) + '" placeholder="Nombre" ' + onChange('listChange', key, i, 'nombre') + '>' +
      '<input class="amt" type="number" step="0.01" inputmode="decimal" value="' + (it[meta.amtField] == null ? '' : it[meta.amtField]) + '" placeholder="' + meta.amtLabel + '" ' + onChange('listChange', key, i, meta.amtField) + '>' +
      (meta.extra || []).map((def) => extraFieldHtml(key, i, def, it[def.field])).join('') +
      '<button class="rm" aria-label="Quitar" ' + act('listRemove', key, i) + '>' + ic('close') + '</button></div>').join('');
  return '<div class="handle"></div><h2>' + meta.title + '</h2>' +
    '<div class="card config-list">' + (rows || '<div style="padding:16px;color:var(--text-faint);font-size:13.5px;">Vacío. Añade el primero abajo.</div>') + '</div>' +
    '<div style="margin-top:12px;"><button class="btn ghost block" ' + act('listAdd', key) + '>' + ic('plus') + ' Añadir</button></div>' +
    '<div class="actions"><button class="btn accent block" ' + act('listDone', key) + '>Listo</button></div>';
}

/* ============================================================
   HOJA (modal)
   ============================================================ */
function openSheet(html) {
  const host = $('#sheetHost'); if (!host) return;
  host.innerHTML = '<div class="sheet-backdrop" id="sheetBackdrop" role="dialog" aria-modal="true"><div class="sheet">' + html + '</div></div>';
  requestAnimationFrame(() => { const b = $('#sheetBackdrop'); if (b) b.classList.add('open'); });
}
function updateSheet(html) { const s = $('#sheetBackdrop .sheet'); if (s) s.innerHTML = html; else openSheet(html); }
function closeSheet() {
  const b = $('#sheetBackdrop'); if (!b) return;
  b.classList.remove('open');
  setTimeout(() => { const h = $('#sheetHost'); if (h && !h.querySelector('.sheet-backdrop.open')) h.innerHTML = ''; }, 220);
}
function confirmDelete(el, fn) {
  if (el.getAttribute('data-armed') === '1') { fn(); return; }
  const old = el.innerHTML;
  el.setAttribute('data-armed', '1');
  el.innerHTML = 'Toca otra vez para confirmar';
  setTimeout(() => { if (el.isConnected) { el.setAttribute('data-armed', '0'); el.innerHTML = old; } }, 3500);
}

/* ============================================================
   MANEJADORES (eventos delegados)
   ============================================================ */
const H = {
  goTab: ([id]) => { S.tab = id; render(); window.scrollTo(0, 0); },
  onFab: () => {
    if (S.tab === 'tareas') return openTareaForm();
    if (S.tab === 'analisis' && S.analisisSub === 'proyectos') return openGolfForm();
    return openMovForm();
  },
  closeSheet: () => closeSheet(),
  // movimientos
  setMovFiltro: ([t]) => { S.movFiltroTipo = t; S.movLimit = 120; render(); },
  setMovPeriodo: ([p]) => { S.movPeriodo = p; S.movLimit = 120; render(); },
  onMovSearch: (_a, el) => debouncedSearch(el.value),
  movMore: () => { S.movLimit += 150; const l = $('#movList'); if (l) l.innerHTML = renderMovList(); },
  openMovForm: ([id]) => openMovForm(id || null),
  pickTipo: ([t], el) => {
    FORM.tipo = t;
    $$('#tipoToggle button').forEach((b) => b.classList.toggle('active', b.getAttribute('data-t') === t));
    const chips = $('#catChips'); if (chips) chips.innerHTML = chipsHtml(t, ($('#fCategoria') || {}).value || '');
  },
  pickCat: ([c]) => {
    const inp = $('#fCategoria'); if (inp) inp.value = c;
    $$('#catChips .chip').forEach((b) => b.classList.toggle('active', decodeURIComponent((b.getAttribute('data-click') || '').split('|')[1] || '') === c));
  },
  onCatInput: (_a, el) => { $$('#catChips .chip').forEach((b) => b.classList.toggle('active', decodeURIComponent((b.getAttribute('data-click') || '').split('|')[1] || '') === el.value.trim())); },
  saveMov: () => saveMov(),
  deleteMov: (_a, el) => confirmDelete(el, doDeleteMov),
  // análisis
  setAnalisisSub: ([s]) => { S.analisisSub = s; render(); },
  goMetas: () => { S.tab = 'analisis'; S.analisisSub = 'metas'; render(); window.scrollTo(0, 0); },
  moveMes: ([d]) => { let m = S.mesSel + Number(d), a = S.anioSel; if (m < 1) { m = 12; a--; } if (m > 12) { m = 1; a++; } S.mesSel = m; S.anioSel = a; render(); },
  moveAnio: ([d]) => { S.anioSel += Number(d); render(); },
  openGolfForm: ([id]) => openGolfForm(id || null),
  saveGolf: () => saveGolf(),
  deleteGolf: (_a, el) => confirmDelete(el, doDeleteGolf),
  // tareas
  setTareasSub: ([s]) => { S.tareasSub = s; render(); },
  toggleTarea: ([id]) => toggleTarea(id),
  openTareaForm: ([id]) => openTareaForm(id || null),
  pickPrio: ([p]) => { FORM.prioridad = p; $$('#prioToggle button').forEach((b) => b.classList.toggle('active', b.getAttribute('data-p') === p)); },
  pickEstado: ([e]) => { FORM.estado = e; $$('#estToggle button').forEach((b) => b.classList.toggle('active', b.getAttribute('data-e') === e)); },
  saveTarea: () => saveTarea(),
  deleteTarea: (_a, el) => confirmDelete(el, doDeleteTarea),
  // más
  openListEditor: ([key]) => { FORM = { kind: 'list', key }; openSheet(listEditorHtml(key)); },
  listAdd: ([key]) => {
    const meta = LIST_META[key];
    const items = (cfg()[key] || []).slice();
    if (meta.simple) items.push('');
    else {
      const blank = { nombre: '', [meta.amtField]: null };
      (meta.extra || []).forEach((d) => { blank[d.field] = null; });
      items.push(blank);
    }
    saveConfig({ [key]: items });
    updateSheet(listEditorHtml(key));
    const inputs = $$('.config-list .row2 input:first-child'); if (inputs.length) inputs[inputs.length - 1].focus();
  },
  listRemove: ([key, i]) => {
    const items = (cfg()[key] || []).slice(); items.splice(Number(i), 1);
    saveConfig({ [key]: items });
    updateSheet(listEditorHtml(key));
  },
  listChange: ([key, i, field], el) => {
    const meta = LIST_META[key], idx = Number(i);
    const items = (cfg()[key] || []).slice();
    if (meta.simple) items[idx] = el.value.trim();
    else {
      const cur = Object.assign({}, items[idx]);
      const extraDef = (meta.extra || []).find((d) => d.field === field);
      if (field === meta.amtField) cur[field] = el.value === '' ? null : parseFloat(el.value);
      else if (extraDef && extraDef.type === 'day') { const n = parseInt(el.value, 10); cur[field] = n >= 1 && n <= 31 ? n : null; }
      else if (extraDef && extraDef.type === 'date') cur[field] = el.value || null;
      else if (extraDef && extraDef.type === 'money') { const n = parseFloat(el.value); cur[field] = isFinite(n) ? n : null; }
      else cur[field] = el.value.trim();
      items[idx] = cur;
    }
    saveConfig({ [key]: items });
  },
  listDone: ([key]) => {
    const meta = LIST_META[key];
    const items = (cfg()[key] || []).filter((it) => (meta.simple ? it : it.nombre));
    if (items.length !== (cfg()[key] || []).length) saveConfig({ [key]: items });
    closeSheet();
  },
  setTheme: ([t]) => { S.theme = t; lsSet('theme', t); applyTheme(); render(); },
  exportBackup: () => exportBackup(),
  // onboarding
  startOnboardingManually: () => { S.onboarding = freshOnboardingState(true); render(); },
  obNext: () => { const ob = S.onboarding; if (ob && ob.step < ONB_STEPS - 1) { ob.step++; render(); } },
  obBack: () => { const ob = S.onboarding; if (ob && ob.step > 0) { ob.step--; render(); } },
  obToggleCat: ([n]) => {
    const ob = S.onboarding;
    if (ob.catsCustom.indexOf(n) >= 0) ob.catsCustom.splice(ob.catsCustom.indexOf(n), 1); else obToggle(ob.cats, n);
    render();
  },
  obAddCustomCat: () => {
    const ob = S.onboarding, el = $('#obCustomCat'); const v = ((el && el.value) || '').trim();
    if (!v) return;
    if (ONB_CATS.indexOf(v) >= 0) { if (ob.cats.indexOf(v) < 0) ob.cats.push(v); }
    else if (ob.catsCustom.indexOf(v) < 0) ob.catsCustom.push(v);
    render();
  },
  obToggleIngreso: ([n]) => { obToggle(S.onboarding.ingresos, n); render(); },
  obToggleProyecto: ([n]) => { obToggle(S.onboarding.proyectos, n); render(); },
  obProyectoOtroInput: (_a, el) => { S.onboarding.proyectoOtro = el.value; },
  obRowAdd: ([kind]) => {
    const row = { nombre: '', [OB_DEFS[kind].amt]: null };
    OB_DEFS[kind].extra.forEach((d) => { row[d.field] = null; });
    S.onboarding[kind].push(row); render();
  },
  obRowRemove: ([kind, i]) => { S.onboarding[kind].splice(Number(i), 1); render(); },
  obRowChange: ([kind, i, field], el) => {
    const def = OB_DEFS[kind], row = S.onboarding[kind][Number(i)]; if (!row) return;
    const ed = def.extra.find((d) => d.field === field);
    if (field === 'nombre') row.nombre = el.value.trim();
    else if (field === def.amt) row[field] = el.value === '' ? null : parseFloat(el.value);
    else if (ed && ed.type === 'day') { const n = parseInt(el.value, 10); row[field] = n >= 1 && n <= 31 ? n : null; }
    else if (ed && ed.type === 'date') row[field] = el.value || null;
    else row[field] = el.value.trim();
  },
  obFinish: ([mode]) => doObFinish(mode === 'save'),
  // auth
  doLogin: async () => {
    const email = ($('#loginEmail').value || '').trim();
    const password = $('#loginPassword').value || '';
    if (!email || !password) return renderLoginScreen('Escribe tu correo y tu contraseña.');
    loginBusy(true);
    try { await window.Auth.signIn(email, password); }
    catch (e) {
      loginBusy(false);
      const msg = e && /invalid/i.test(e.message || '') ? 'Correo o contraseña incorrectos.' : 'No se pudo iniciar sesión. Revisa tu conexión.';
      renderLoginScreen(msg);
    }
  },
  doForgotPassword: async () => {
    const email = ($('#loginEmail').value || '').trim();
    if (!email) return renderLoginScreen('Escribe tu correo arriba y vuelve a tocar el enlace.');
    try { await window.Auth.resetPassword(email); renderLoginScreen('Te hemos enviado un correo con instrucciones para cambiar tu contraseña.'); }
    catch (e) { renderLoginScreen('No se pudo enviar el correo. Inténtalo de nuevo en unos minutos.'); }
  },
  doLogout: async () => { closeSheet(); await window.Auth.signOut(); },
};
const debouncedSearch = debounce((v) => { S.movQuery = v; S.movLimit = 120; const l = $('#movList'); if (l) l.innerHTML = renderMovList(); }, 160);

function dispatch(kind, e) {
  const t = e.target;
  const el = t && t.closest ? t.closest('[data-' + kind + ']') : null;
  if (!el) return;
  const parts = el.getAttribute('data-' + kind).split('|');
  const fn = H[parts[0]];
  if (fn) fn(parts.slice(1).map(decodeURIComponent), el, e);
}
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('sheet-backdrop')) { closeSheet(); return; }
  dispatch('click', e);
});
document.addEventListener('input', (e) => dispatch('input', e));
document.addEventListener('change', (e) => dispatch('change', e));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

/* ============================================================
   ARRANQUE
   ============================================================ */
async function enterApp(session) {
  S.user = session.user;
  S.db = window.Data;
  S.appStarted = true;
  S.movimientos = []; S.tareas = []; S.golf = []; S.config = null;
  S.loaded = { mov: false, tar: false, golf: false, cfg: false };
  renderShell();
  $('#content').innerHTML = loadingHtml();
  subscribeAll();
  render();
  checkOnboarding();
}
function leaveApp() {
  S.appStarted = false;
  S.user = null; S.db = null;
  S.onboarding = null; S._onboardPending = false;
  _unsubs.forEach((u) => { try { u(); } catch (e) { /* noop */ } });
  _unsubs = [];
  renderLoginScreen();
}
async function main() {
  applyTheme();
  if (!window.Auth || !window.Data) {
    $('#app').innerHTML = '<div class="loading"><div class="big" style="font-size:28px;">' + ic('alert') + '</div><b style="color:var(--expense);">Falta configurar la app</b>' +
      '<div style="margin-top:8px;max-width:320px;">No se encontró la conexión con Supabase. Copia <code>config.example.js</code> a <code>config.js</code>, rellena tu URL y tu clave pública, y recarga la página.</div></div>';
    return;
  }
  window.Auth.onChange((session) => {
    if (session) { if (!S.appStarted) enterApp(session); }
    else { leaveApp(); }
  });
}

window.__APP__ = { S, main, render, kpisMes, H, cfg, aplicaEstado };
if (!window.__NO_AUTOSTART__) main();
})();

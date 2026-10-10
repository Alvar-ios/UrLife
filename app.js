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
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
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
const TIPOS = ['Ingreso', 'Factura', 'Gasto', 'Ahorro', 'Inversión', 'Deuda'];
const TIPOS_ACTIVO = ['Acción', 'ETF', 'Bono', 'Criptomoneda', 'Otro'];
const TIPO_COLOR = { Ingreso: 'income', Factura: 'bill', Gasto: 'expense', Ahorro: 'savings', 'Inversión': 'savings', Deuda: 'debt' };
const TIPO_SIGNO = { Ingreso: 1, Factura: -1, Gasto: -1, Ahorro: -1, 'Inversión': -1, Deuda: -1 };

function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function fmt2(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
/* Moneda de la cuenta (solo símbolo y formato: NO convierte importes). Se guarda en config.moneda. */
const MONEDAS = {
  EUR: { s: '€', dec: 2, n: 'Euro' }, USD: { s: '$', dec: 2, n: 'Dólar estadounidense' }, GBP: { s: '£', dec: 2, n: 'Libra esterlina' },
  JPY: { s: '¥', dec: 0, n: 'Yen japonés' }, CHF: { s: 'CHF', dec: 2, n: 'Franco suizo' }, CAD: { s: 'C$', dec: 2, n: 'Dólar canadiense' },
  AUD: { s: 'A$', dec: 2, n: 'Dólar australiano' }, MXN: { s: 'MX$', dec: 2, n: 'Peso mexicano' }
};
function monedaCod() { const c = S && S.config && S.config.moneda; return MONEDAS[c] ? c : 'EUR'; }
function sym() { return MONEDAS[monedaCod()].s; }
function fmtM(n) { const d = MONEDAS[monedaCod()].dec; return n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function money(n) { return fmtM(num(n)) + ' ' + sym(); }
function moneyShort(n) {
  n = num(n);
  return Math.abs(n) >= 100 ? n.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' ' + sym() : money(n);
}
// Importe con signo según el efecto real sobre tu dinero (una devolución = gasto negativo = suma)
function moneySigned(importe, tipo) {
  const eff = (TIPO_SIGNO[tipo] || 1) * num(importe);
  return (eff >= 0 ? '+' : '−') + fmtM(Math.abs(eff)) + ' ' + sym();
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
  analisisSub: 'general', generalSub: 'mensual', inicioSub: 'dashboard',
  calVista: 'mes', calFecha: null, calFiltros: { tareas: true, facturas: true, hitos: true, movs: false },
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
    S.config = snap.exists ? snap.data() : null; S.loaded.cfg = true; maybeStartOnboarding(); render(); maybeNovedades();
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
  const ahorro = sumTipo(movs, 'Ahorro'), deuda = sumTipo(movs, 'Deuda'), inversion = sumTipo(movs, 'Inversión');
  return { ingresos, facturas, gastos, ahorro, inversion, deuda, disponible: ingresos - facturas - gastos - ahorro - inversion - deuda, movs };
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
  else if (tipo === 'Inversión') { const seen = {}; S.movimientos.forEach((m) => { if (m.tipo === 'Inversión' && m.categoria) seen[m.categoria] = (seen[m.categoria] || 0) + 1; }); arr = Object.keys(seen).sort((a, b) => seen[b] - seen[a]); }
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
  { id: 'calendario', label: 'Calendario', icon: 'calendar' },
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
/* ============================================================
   VERIFICACIÓN EN DOS PASOS (TOTP, Bloque 2)
   Cliente auxiliar solo para las llamadas MFA; comparte la sesión guardada del navegador.
   Tras activar/desactivar/verificar se recarga la página para que ambos clientes vuelvan a estar sincronizados.
   ============================================================ */
let _mfaClient = null;
function mfaDisponible() { const c = window.SUPABASE_CONFIG || {}; return !!(window.supabase && typeof window.supabase.createClient === 'function' && c.url && c.anonKey); }
function mfaApi() {
  if (!_mfaClient) {
    const c = window.SUPABASE_CONFIG;
    _mfaClient = window.supabase.createClient(c.url, c.anonKey, { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
  }
  return _mfaClient.auth.mfa;
}
function jwtAal(session) {
  try {
    const part = String(session && session.access_token || '').split('.')[1];
    const json = decodeURIComponent(atob(part.replace(/-/g, '+').replace(/_/g, '/')).split('').map((ch) => '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json).aal || null;
  } catch (e) { return null; }
}
function needsMfa(session) {
  const f = (session && session.user && session.user.factors) || [];
  const verificado = f.some((x) => x && x.status === 'verified' && (!x.factor_type || x.factor_type === 'totp'));
  return verificado && jwtAal(session) !== 'aal2';
}
function mfaErrMsg(e) {
  const m = String((e && e.message) || '');
  if (/invalid|expired|incorrect/i.test(m)) return 'Código incorrecto o caducado. Prueba con el siguiente código de tu app.';
  return 'No se pudo completar. Revisa tu conexión e inténtalo de nuevo.';
}
function renderMfaScreen(msg) {
  $('#app').innerHTML =
    '<div style="min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;">' +
    '<div class="card" style="width:100%;max-width:360px;">' +
    '<h2 class="num" style="margin:0 0 6px;text-align:center;">Verificación en dos pasos</h2>' +
    '<p style="color:var(--text-faint);font-size:13.5px;line-height:1.5;margin:0 0 14px;text-align:center;">Escribe el código de 6 cifras de tu app autenticadora.</p>' +
    '<div class="field"><input id="mfaCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" style="text-align:center;letter-spacing:6px;font-size:20px;"></div>' +
    (msg ? '<div class="alert" style="margin-top:2px;">' + ic('alert') + '<div>' + escapeHtml(msg) + '</div></div>' : '') +
    '<button class="btn accent block" style="margin-top:6px;" ' + act('doMfaVerify') + '>Verificar</button>' +
    '<button class="section-title link" style="width:100%;text-align:center;margin-top:16px;justify-content:center;" ' + act('doMfaCancel') + '>Cerrar sesión</button>' +
    '</div></div>';
  setTimeout(() => { const el = $('#mfaCode'); if (el) el.focus(); }, 60);
}
async function mfaSheetHtml() {
  let verified = null;
  try {
    const r = await mfaApi().listFactors();
    verified = ((r.data && r.data.totp) || [])[0] || null; // listFactors.totp solo contiene los verificados
  } catch (e) { return '<div class="handle"></div><h2>Verificación en dos pasos</h2><p>No se pudo consultar. Revisa tu conexión.</p><div class="actions"><button class="btn ghost block" ' + act('closeSheet') + '>Cerrar</button></div>'; }
  if (verified) {
    return '<div class="handle"></div><h2>Verificación en dos pasos</h2>' +
      '<p style="line-height:1.5;"><b style="color:var(--income);">Activada.</b> Al iniciar sesión te pediremos el código de tu app autenticadora.</p>' +
      '<div class="actions"><button class="btn ghost block" ' + act('closeSheet') + '>Cerrar</button><button class="btn danger block" ' + act('mfaDisable', verified.id) + '>Desactivar</button></div>';
  }
  return '<div class="handle"></div><h2>Verificación en dos pasos</h2>' +
    '<p style="color:var(--text-faint);font-size:13.5px;line-height:1.5;">Añade una capa extra de seguridad: además de la contraseña, se pedirá un código de 6 cifras de una app como Google Authenticator, Microsoft Authenticator o Authy. Es opcional.</p>' +
    '<div class="actions"><button class="btn ghost block" ' + act('closeSheet') + '>Ahora no</button><button class="btn accent block" ' + act('mfaStart') + '>Activar</button></div>';
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
  if (S.tab === 'inicio') c.innerHTML = renderInicioPage();
  else if (S.tab === 'movimientos') c.innerHTML = renderMovimientos();
  else if (S.tab === 'calendario') c.innerHTML = renderCalendario();
  else if (S.tab === 'tareas') c.innerHTML = renderTareas();
  else if (S.tab === 'mas') c.innerHTML = renderMas();
  if (enAnalisis() && subAnalisis() === 'general' && S.generalSub === 'mensual') drawDonut();
  if (enAnalisis() && subAnalisis() === 'general' && S.generalSub === 'anual') drawTrend();
  if (enAnalisis() && subAnalisis() === 'inversiones') bindInvChart();
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

    avisosRecHtml() +

    ((vencidas.length || excedidas.length) ? '<div class="section-title">Avisos</div>' +
      (vencidas.length ? '<div class="alert">' + ic('alert') + '<div><b>' + vencidas.length + (vencidas.length > 1 ? ' tareas vencidas' : ' tarea vencida') + '</b>Míralas en la pestaña Tareas.</div></div>' : '') +
      excedidas.map((c) => '<div class="alert warn">' + ic('alert') + '<div><b>' + escapeHtml(c.categoria) + ' por encima del presupuesto</b>' + money(c.real) + ' de ' + money(c.presupuesto) + ' este mes.</div></div>').join('') : '') +

    '<div class="section-title">Próximas tareas <button class="link" ' + act('goTab', 'tareas') + '>Ver todas</button></div>' +
    (proximas.length ? '<div class="list">' + proximas.map(renderTareaRow).join('') + '</div>'
      : '<div class="card" style="text-align:center;color:var(--text-faint);font-size:13.5px;">No tienes tareas pendientes.</div>') +

    (tabAnVisible('metas') ? renderMetasInicio() : '') +

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
  return '<div style="display:flex;justify-content:flex-end;margin:-4px 0 6px;"><button class="link" ' + act('impAbrir') + '>' + ic('download') + ' Importar extracto o Excel' + badge('importar') + '</button></div>' +
    '<div class="field" style="margin-bottom:10px;"><input type="search" id="movSearch" placeholder="Buscar categoría, nota o método de pago" value="' + escapeHtml(S.movQuery) + '" ' + onInput('onMovSearch') + '></div>' +
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
  let html = '<div class="summary-line">' + movs.length + (movs.length === 1 ? ' movimiento' : ' movimientos') + ' · balance ' + (net >= 0 ? '+' : '−') + fmtM(Math.abs(net)) + ' ' + sym() + '</div>';
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
/* ============================================================
   ACTIVOS AUTOMÁTICOS (Bloque 3): búsqueda, participaciones y valoración
   ============================================================ */
function activosDisponible() { const c = window.SUPABASE_CONFIG || {}; return !!(c.url && c.anonKey && window.Auth && typeof window.Auth.getSession === 'function'); }
async function activosApi(accion, extra) {
  const c = window.SUPABASE_CONFIG;
  const ses = await window.Auth.getSession();
  if (!ses || !ses.access_token) throw new Error('sin_sesion');
  const r = await fetch(c.url + '/functions/v1/activos-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ses.access_token, apikey: c.anonKey },
    body: JSON.stringify(Object.assign({ accion }, extra || {}))
  });
  let j; try { j = await r.json(); } catch (e) { j = { error: 'respuesta_invalida' }; }
  if (!r.ok && !j.error) j.error = 'http_' + r.status;
  return j;
}
const TIPO_ACTIVO_MAP = { ETF: 'ETF', 'Acción': 'Acción', Criptomoneda: 'Criptomoneda', Fondo: 'Otro' };
function tipoActivoDe(a) { return TIPOS_ACTIVO.indexOf(a && a.tipo) >= 0 ? a.tipo : (TIPO_ACTIVO_MAP[a && a.tipo] || 'Otro'); }
function errPrecioMsg(e) {
  if (e === 'limite') return 'Hoy se han agotado las consultas gratuitas de precios. Escribe tú las participaciones o inténtalo mañana.';
  if (e === 'sin_precio') return 'No hay precio de ese activo para esa fecha. Escribe tú las participaciones.';
  if (e === 'sin_divisa') return 'No hay tipo de cambio para esa fecha. Escribe tú las participaciones.';
  return 'No se pudo consultar el precio. Revisa tu conexión o escribe tú las participaciones.';
}
function invAuto() { return FORM.tipo === 'Inversión' && FORM.invModo === 'auto' && activosDisponible(); }
function syncCatField() { const f = $('#catField'); if (f) f.style.display = invAuto() ? 'none' : ''; }
function refreshInvFields() { const el = $('#invFields'); if (el) el.innerHTML = invFieldsHtml(FORM.tipo, FORM.tipoActivoIni || ''); syncCatField(); }
function activosPropios() {
  const m = {};
  S.movimientos.forEach((x) => { if (x.tipo === 'Inversión' && x.activoId && !m[x.activoId]) m[x.activoId] = (x.categoria || '').trim() || 'Activo'; });
  return Object.entries(m);
}
function invFieldsHtml(tipo, actual) {
  if (tipo !== 'Inversión') return '';
  if (!(FORM.invModo === 'auto' && activosDisponible())) {
    return '<div class="field"><label>Tipo de activo</label><select id="fTipoActivo"><option value="">—</option>' +
      TIPOS_ACTIVO.map((t) => '<option ' + (actual === t ? 'selected' : '') + '>' + t + '</option>').join('') + '</select></div>' +
      (activosDisponible() ? '<button type="button" class="link" style="margin:-4px 0 12px;" ' + act('invAuto') + '>Vincular a un activo con valoración automática</button>' : '');
  }
  const a = FORM.activo;
  let h = '<div class="field"><label>Activo</label>';
  if (a) {
    h += '<div class="card" style="padding:12px;display:flex;align-items:center;gap:10px;"><div style="flex:1;"><b>' + escapeHtml(a.nombre) + '</b>' +
      '<div style="font-size:12.5px;color:var(--text-faint);">' + escapeHtml([a.simbolo, a.tipo, a.moneda].filter(Boolean).join(' · ')) + '</div></div>' +
      '<button type="button" class="link" ' + act('cambiarActivo') + '>Cambiar</button></div>';
  } else {
    h += '<div style="display:flex;gap:8px;"><input id="fBuscar" type="text" placeholder="Nombre, ticker o ISIN" style="flex:1;" ' + onChange('buscarActivo') + '>' +
      '<button type="button" class="btn accent" style="flex:none;" ' + act('buscarActivo') + '>Buscar</button></div><div id="resBusca" style="margin-top:8px;"></div>';
    const prop = activosPropios();
    if (prop.length) h += '<div style="font-size:12.5px;color:var(--text-faint);margin:10px 0 6px;">O elige uno que ya tienes:</div><div class="chips">' +
      prop.map(([id, n]) => '<button type="button" class="chip" ' + act('pickActivoPropio', id) + '>' + escapeHtml(n) + '</button>').join('') + '</div>';
  }
  h += '</div>';
  if (a) {
    h += '<div id="previewPart" style="font-size:13px;color:var(--text-faint);margin:-4px 0 12px;line-height:1.5;"></div>' +
      '<div class="field"><label>Participaciones <span class="hint">· opcional; vacío = se calculan solas</span></label><input id="fPart" type="number" step="any" inputmode="decimal" placeholder="Automático" value="' + (FORM.partOrig != null ? Math.abs(FORM.partOrig) : '') + '"></div>';
  }
  h += '<button type="button" class="link" style="margin:-4px 0 12px;" ' + act('invManual') + '>Escribirlo a mano (sin valoración automática)</button>';
  return h;
}
function updatePreview() {
  const el = $('#previewPart'); if (!el) return;
  const pr = FORM.precio, imp = parseFloat(($('#fImporte') || {}).value);
  if (FORM.precioCargando) { el.textContent = 'Consultando el precio de ese día…'; return; }
  if (!pr) { el.textContent = ''; return; }
  if (pr.error) { el.textContent = errPrecioMsg(pr.error); return; }
  const precioTxt = fmt2(pr.cierre) + ' ' + (pr.moneda === 'GBX' ? 'GBX' : pr.moneda) + (pr.moneda !== 'EUR' ? ' (≈ ' + fmt2(pr.cierre_eur) + ' €)' : '');
  el.innerHTML = (isFinite(imp) && imp !== 0 ? '≈ <b>' + (imp / pr.cierre_eur).toLocaleString('es-ES', { maximumFractionDigits: 6 }) + '</b> participaciones · ' : '') +
    'precio ' + precioTxt + ' · cierre del ' + fmtDateShort(pr.fecha_precio);
}
async function cargarPreview() {
  const a = FORM.activo, f = ($('#fFecha') || {}).value;
  if (!a || !a.activo_id || !f) { FORM.precio = null; updatePreview(); return; }
  const key = a.activo_id + '|' + f; FORM.precioKey = key; FORM.precioCargando = true; updatePreview();
  let r; try { r = await activosApi('precio_en', { activo_id: a.activo_id, fecha: f }); } catch (e) { r = { error: 'red' }; }
  if (FORM.precioKey !== key) return;
  FORM.precioCargando = false;
  FORM.precio = r.error ? { error: r.error } : Object.assign(r, { activo_id: a.activo_id, fecha_solicitada: f });
  updatePreview();
}
async function elegirActivo(a) {
  FORM.activo = a; FORM.precio = null; refreshInvFields();
  if (!a.activo_id) {
    const el = $('#previewPart'); if (el) el.textContent = 'Preparando el activo…';
    let r; try { r = await activosApi('registrar', { proveedor: a.proveedor, ref: a.ref, simbolo: a.simbolo, nombre: a.nombre, tipo: a.tipo, moneda: a.moneda, isin: a.isin }); } catch (e) { r = { error: 'red' }; }
    if (r.error || !r.activo) { FORM.activo = null; refreshInvFields(); return toast(r.error === 'moneda_no_soportada' ? 'Esa moneda (' + r.moneda + ') aún no está soportada' : 'No se pudo preparar el activo. Inténtalo de nuevo.'); }
    FORM.activo.activo_id = r.activo.id;
  }
  cargarPreview();
}
function catLabel(tipo) { return tipo === 'Inversión' ? 'Activo <span class="hint">· ej. VWCE, S&amp;P 500 ETF</span>' : 'Categoría'; }
function openMovForm(id, pre) {
  const ex = id ? S.movimientos.find((m) => m.id === id) : null;
  pre = (!ex && pre) || {};
  const tipoIni = ex ? ex.tipo : pre.tipo ? pre.tipo : (S.tab === 'movimientos' && S.movFiltroTipo !== 'Todos' ? S.movFiltroTipo : 'Gasto');
  FORM = { kind: 'mov', id: ex ? ex.id : null, tipo: tipoIni, tipoActivoIni: ex ? ex.tipoActivo : '' };
  FORM.invModo = (ex && ex.tipo === 'Inversión' && !ex.activoId) ? 'manual' : 'auto';
  if (ex && ex.activoId) { FORM.activo = { activo_id: ex.activoId, nombre: ex.categoria, tipo: ex.tipoActivo || '', simbolo: '', moneda: '' }; FORM.partOrig = ex.participaciones == null ? null : Number(ex.participaciones); }
  const metodos = cfg().metodosPago || [];
  openSheet(
    '<div class="handle"></div><h2>' + (ex ? 'Editar movimiento' : 'Nuevo movimiento') + '</h2>' +
    '<div class="field"><label>Tipo</label><div class="type-toggle" id="tipoToggle">' +
    TIPOS.map((t) => '<button type="button" data-t="' + t + '" class="' + (t === tipoIni ? 'active' : '') + '" ' + act('pickTipo', t) + '>' + t + '</button>').join('') + '</div></div>' +
    '<div class="field"><label>Importe (' + sym() + ') <span class="hint">· en negativo si es una devolución</span></label><input id="fImporte" type="number" step="0.01" inputmode="decimal" placeholder="0,00" value="' + (ex ? ex.importe : (pre.importe != null ? pre.importe : '')) + '" ' + onInput('onImporteInput') + '></div>' +
    '<div id="invFields">' + invFieldsHtml(tipoIni, ex ? ex.tipoActivo : '') + '</div>' +
    '<div class="field" id="catField"><label id="catLabel">' + catLabel(tipoIni) + '</label><div id="catChips">' + chipsHtml(tipoIni, ex ? ex.categoria : (pre.categoria || '')) + '</div>' +
    '<input id="fCategoria" type="text" placeholder="…o escribe otra" value="' + escapeHtml(ex ? ex.categoria : (pre.categoria || '')) + '" ' + onInput('onCatInput') + '></div>' +
    '<div class="field"><label>Fecha</label><input id="fFecha" type="date" value="' + (ex ? ex.fecha : (pre.fecha || todayISO())) + '" ' + onChange('onFechaChange') + '></div>' +
    '<div class="field"><label>Descripción <span class="hint">· opcional</span></label><input id="fDesc" type="text" placeholder="Nota rápida (p. ej. Mercadona)" value="' + escapeHtml(ex ? ex.descripcion : '') + '" ' + onInput('onDescInput') + '><div id="reglaBox"></div></div>' +
    '<div class="field"><label>Método de pago <span class="hint">· opcional</span></label><select id="fMetodo"><option value="">—</option>' +
    metodos.map((mm) => '<option ' + (ex && ex.metodoPago === mm ? 'selected' : '') + '>' + escapeHtml(mm) + '</option>').join('') + '</select></div>' +
    '<div class="actions"><button class="btn ghost block" ' + act('closeSheet') + '>Cancelar</button><button class="btn accent block" ' + act('saveMov') + '>Guardar</button></div>' +
    (ex ? '<button class="btn danger block" style="margin-top:10px;" ' + act('deleteMov') + '>' + ic('trash') + ' Eliminar movimiento</button>' : '')
  );
  syncCatField();
  if (FORM.activo && FORM.activo.activo_id) cargarPreview();
  if (!ex) setTimeout(() => { const el = $('#fImporte'); if (el) el.focus(); }, 80);
}
async function saveMov() {
  if (FORM.guardando) return;
  const importe = parseFloat($('#fImporte').value);
  const fecha = $('#fFecha').value;
  const auto = invAuto();
  if (auto) { if (!FORM.activo) return toast('Busca y elige el activo'); const c = $('#fCategoria'); if (c) c.value = FORM.activo.nombre; }
  const categoria = $('#fCategoria').value.trim();
  if (!isFinite(importe) || importe === 0) return toast('Pon un importe válido');
  if (!categoria) return toast(FORM.tipo === 'Inversión' ? 'Escribe o elige el activo' : 'Elige o escribe una categoría');
  const tipoActivo = FORM.tipo === 'Inversión' ? (auto ? tipoActivoDe(FORM.activo) : (($('#fTipoActivo') || {}).value || '')) : '';
  if (FORM.tipo === 'Inversión' && !tipoActivo) return toast('Elige el tipo de activo');
  if (!fecha) return toast('Elige una fecha');
  const ex = FORM.id ? S.movimientos.find((m) => m.id === FORM.id) : null;
  let participaciones = null, activoId = null;
  FORM.guardando = true;
  try {
    if (auto) {
      const a = FORM.activo;
      if (!a.activo_id) {
        const r = await activosApi('registrar', { proveedor: a.proveedor, ref: a.ref, simbolo: a.simbolo, nombre: a.nombre, tipo: a.tipo, moneda: a.moneda, isin: a.isin }).catch(() => ({ error: 'red' }));
        if (r.error || !r.activo) return toast('No se pudo preparar el activo. Inténtalo de nuevo.');
        a.activo_id = r.activo.id;
      }
      activoId = a.activo_id;
      const sign = importe < 0 ? -1 : 1;
      const manual = parseFloat((($('#fPart') || {}).value) || '');
      const orig = FORM.partOrig == null ? null : Math.abs(FORM.partOrig);
      const manualCambiada = isFinite(manual) && manual > 0 && (orig == null || Math.abs(manual - orig) > 1e-9);
      if (manualCambiada) participaciones = sign * manual;
      else if (ex && ex.participaciones != null && ex.activoId === activoId && Number(ex.importe) === importe && ex.fecha === fecha) participaciones = Number(ex.participaciones);
      else {
        let pr = FORM.precio && !FORM.precio.error && FORM.precio.activo_id === activoId && FORM.precio.fecha_solicitada === fecha ? FORM.precio : null;
        if (!pr) { try { pr = await activosApi('precio_en', { activo_id: activoId, fecha }); } catch (e) { pr = { error: 'red' }; } }
        if (pr.error) return toast(errPrecioMsg(pr.error));
        participaciones = importe / pr.cierre_eur;
      }
      participaciones = Math.round(participaciones * 1e8) / 1e8;
    }
    const data = Object.assign(ex ? stripId(ex) : { creadoEn: Date.now() }, {
      tipo: FORM.tipo, importe, categoria, fecha,
      descripcion: $('#fDesc').value.trim(), metodoPago: $('#fMetodo').value,
    });
    if (FORM.tipo === 'Inversión') data.tipoActivo = tipoActivo; else if ('tipoActivo' in data) data.tipoActivo = null;
    if (auto) { data.activoId = activoId; data.participaciones = participaciones; }
    else {
      if ('activoId' in data && FORM.tipo !== 'Inversión') data.activoId = null;
      if ('participaciones' in data && FORM.tipo !== 'Inversión') data.participaciones = null;
    }
    const reglaNueva = FORM.recordar && FORM.tipo !== 'Inversión' ? ((($('#fReglaTexto') || {}).value || '').trim()) : '';
    const ok = await write(() => FORM.id ? S.db.collection('movimientos').doc(FORM.id).set(data) : S.db.collection('movimientos').add(data));
    if (ok) {
      if (reglaNueva && guardarRegla(reglaNueva, categoria, FORM.tipo)) toast('Guardado. Regla creada: «' + normDesc(reglaNueva) + '» → ' + categoria);
      else toast(FORM.id ? 'Movimiento actualizado' : 'Movimiento añadido');
      closeSheet();
    }
  } finally { FORM.guardando = false; }
}
async function doDeleteMov() {
  const ok = await write(() => S.db.collection('movimientos').doc(FORM.id).delete());
  if (ok) { closeSheet(); toast('Movimiento eliminado'); }
}

/* ============================================================
   ANÁLISIS
   ============================================================ */
/* Pestañas de Análisis (Bloque 1). 'general' siempre visible; las demás son elegibles y se guardan en la cuenta.
   Proyectos queda oculto (no borrado): ponlo a true para reactivarlo. */
const PROYECTOS_VISIBLE = false;
const TABS_AN_OPC = [['metas', 'Metas de ahorro'], ['inversiones', 'Inversiones'], ['deudas', 'Deudas']].concat(PROYECTOS_VISIBLE ? [['proyectos', 'Proyectos']] : []);
function tabsAnElegidas() {
  const g = cfg().tabsAnalisis;
  const ids = TABS_AN_OPC.map((t) => t[0]);
  return Array.isArray(g) ? g.filter((x) => ids.indexOf(x) >= 0) : ids.slice(0, 3); // por defecto: todas las visibles
}
function tabAnVisible(id) { return id === 'general' || tabsAnElegidas().indexOf(id) >= 0; }
function subAnalisis() {
  let sub = S.analisisSub;
  if (sub === 'mensual' || sub === 'anual') { S.generalSub = sub; sub = 'general'; S.analisisSub = 'general'; }
  return tabAnVisible(sub) ? sub : 'general';
}
function renderAnalisis() {
  const sub = subAnalisis();
  const labels = { metas: 'Metas', inversiones: 'Inversiones', deudas: 'Deudas', proyectos: 'Proyectos' };
  const tabs = [['general', 'General']].concat(TABS_AN_OPC.filter((t) => tabAnVisible(t[0])).map((t) => [t[0], labels[t[0]]]));
  let body;
  if (sub === 'general') {
    const g = S.generalSub === 'anual' ? 'anual' : 'mensual';
    body = '<div class="segmented" style="margin-bottom:16px;">' + [['mensual', 'Mensual'], ['anual', 'Anual']].map(([id, l]) => '<button class="' + (g === id ? 'active' : '') + '" ' + act('setGeneralSub', id) + '>' + l + '</button>').join('') + '</div>' +
      (g === 'mensual' ? renderAnalisisMensual() : renderAnalisisAnual());
  } else body = sub === 'metas' ? renderMetas() : sub === 'inversiones' ? renderInversiones() : sub === 'deudas' ? renderDeudas() : renderProyectos();
  return (tabs.length > 1 ? '<div class="segmented">' + tabs.map(([id, l]) => '<button class="' + (sub === id ? 'active' : '') + '" ' + act('setAnalisisSub', id) + '>' + l + (id === 'inversiones' ? badgeDot('inversiones') : '') + '</button>').join('') + '</div>' : '') +
    '<div style="text-align:right;margin:8px 0 0;"><button class="link" ' + act('openTabsAn') + '>Elegir pestañas</button></div>' +
    '<div style="margin-top:10px;">' + body + '</div>';
}
function tabsAnSheetHtml() {
  const sel = tabsAnElegidas();
  return '<div class="handle"></div><h2>Pestañas de Análisis</h2>' +
    '<p style="color:var(--text-faint);font-size:13.5px;line-height:1.5;margin:0 0 12px;">Elige qué pestañas quieres ver. General (con las vistas Mensual y Anual) siempre está visible. Tus datos no se tocan: solo cambia lo que se muestra.</p>' +
    '<div class="chips"><button type="button" class="chip active" disabled style="opacity:.7;">General</button>' +
    TABS_AN_OPC.map(([id, l]) => '<button type="button" class="chip ' + (sel.indexOf(id) >= 0 ? 'active' : '') + '" ' + act('toggleTabAn', id) + '>' + l + '</button>').join('') + '</div>' +
    '<div class="actions"><button class="btn accent block" ' + act('closeSheet') + '>Hecho</button></div>';
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
  const totAho = rows.reduce((a, r) => a + r.ahorro + r.inversion, 0);
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
function deudaStats(d) {
  const key = (d.nombre || '').trim().toLowerCase();
  const movs = S.movimientos.filter((x) => x.tipo === 'Deuda' && (x.categoria || '').trim().toLowerCase() === key);
  const total = num(d.objetivo);
  const pagado = movs.reduce((a, x) => a + num(x.importe), 0);
  const pend = Math.max(0, total - pagado);
  const pct = total > 0 ? pagado / total * 100 : null;
  const hoyISO = todayISO(), desde = isoDaysAgo(90);
  const ritmo = movs.filter((x) => (x.fecha || '') > desde && (x.fecha || '') <= hoyISO).reduce((a, x) => a + num(x.importe), 0) / 3;
  const dias = d.fechaObjetivo ? daysUntil(d.fechaObjetivo) : null;
  const r = { nombre: d.nombre, total, pagado, pend, pct, ritmo, dias, fecha: d.fechaObjetivo || null, mes: null, estado: 'gris', texto: '' };
  if (total <= 0) { r.texto = 'Sin total definido'; return r; }
  if (pend <= 0) { r.estado = 'verde'; r.texto = 'Deuda saldada'; return r; }
  if (dias == null) { r.texto = 'Sin fecha objetivo'; return r; }
  if (dias < 0) { r.estado = 'rojo'; r.texto = 'La fecha ya pasó y quedan ' + money(pend); return r; }
  r.mes = pend / Math.max(dias / 30.4375, 1);
  const ratio = ritmo / r.mes;
  if (ratio >= 1) { r.estado = 'verde'; r.texto = 'Vas bien: ritmo suficiente'; }
  else if (ratio >= META_UMBRAL_AMARILLO) { r.estado = 'amarillo'; r.texto = 'Ritmo justo: conviene pagar algo más'; }
  else { r.estado = 'rojo'; r.texto = 'Al ritmo actual no llegarías a tiempo'; }
  return r;
}
function renderDeudas() {
  const ds = (cfg().deudas || []).filter((d) => d && d.nombre).map(deudaStats);
  if (!ds.length) return '<div class="card" style="text-align:center;color:var(--text-faint);font-size:13.5px;">Todavía no tienes deudas. Créalas en Más → Deudas (con el total y, si quieres, una fecha objetivo).</div>';
  const tot = ds.reduce((a, r) => a + r.total, 0), pag = ds.reduce((a, r) => a + Math.min(r.pagado, r.total), 0), pen = ds.reduce((a, r) => a + r.pend, 0);
  return '<div class="kpi-row"><div class="kpi expense"><div class="v tnum">' + moneyShort(pen) + '</div><div class="l">Pendiente</div></div>' +
    '<div class="kpi income"><div class="v tnum">' + moneyShort(pag) + '</div><div class="l">Pagado</div></div>' +
    '<div class="kpi"><div class="v tnum">' + moneyShort(tot) + '</div><div class="l">Total</div></div></div>' +
    ds.map((r) => {
      const pctC = r.pct == null ? 0 : Math.max(0, Math.min(100, r.pct));
      let h = '<div class="card" style="margin-bottom:12px;">' +
        '<div class="budget-row" style="margin:0;"><div class="top"><span class="cat" style="display:flex;align-items:center;gap:8px;">' + semaforoDot(r.estado) + escapeHtml(r.nombre) + '</span>' +
        '<span class="nums"><b class="tnum">' + (r.pct == null ? '—' : r.pct.toFixed(0) + '%') + '</b></span></div>' +
        '<div class="progress"><div style="width:' + pctC + '%;background:' + SEMAFORO_COLOR[r.estado] + ';"></div></div></div>' +
        '<div class="summary-line">Pagado ' + money(r.pagado) + (r.total > 0 ? ' de ' + money(r.total) + ' · pendiente ' + money(r.pend) : '') + (r.fecha ? ' · hasta ' + fmtDateLong(r.fecha) : '') + '</div>' +
        '<div style="font-size:13.5px;font-weight:600;color:' + SEMAFORO_COLOR[r.estado] + ';margin:2px 0 6px;">' + escapeHtml(r.texto) + '</div>';
      if (r.mes != null) h += '<div style="font-size:13px;color:var(--text-faint);line-height:1.6;">Cuota necesaria: <b class="tnum" style="color:var(--text);">' + money(r.mes) + '/mes</b> · tu ritmo (últimos 3 meses): <b class="tnum" style="color:var(--text);">' + money(r.ritmo) + '/mes</b>.</div>';
      return h + '</div>';
    }).join('') + '<div class="summary-line">Lo pagado sale de tus movimientos de tipo Deuda con el nombre de cada deuda. Esta versión no calcula intereses.</div>';
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
/* ============================================================
   INICIO (Dashboard | Análisis) + CALENDARIO (Fase 3)
   ============================================================ */
function enAnalisis() { return S.tab === 'inicio' && S.inicioSub === 'analisis'; }
function renderInicioPage() {
  const subs = [['dashboard', 'Dashboard'], ['analisis', 'Análisis']];
  return '<div class="segmented" style="margin-bottom:16px;">' + subs.map(([id, l]) => '<button class="' + (S.inicioSub === id ? 'active' : '') + '" ' + act('setInicioSub', id) + '>' + l + '</button>').join('') + '</div>' +
    (S.inicioSub === 'analisis' ? renderAnalisis() : renderInicio());
}

const DIAS_ABR = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const DIAS_LARGO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
function dateISO(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function addDaysISO(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return dateISO(d); }
function dowMon(d) { return (d.getDay() + 6) % 7; }
function calAnchor() { if (!S.calFecha) S.calFecha = todayISO(); return S.calFecha; }
function normName(x) { return (x || '').trim().toLowerCase(); }

const CAL_ORDEN = { tarea: 0, cobro: 1, factura: 1, hito: 2, mov: 3 };
function evColor(ev) {
  if (ev.k === 'tarea') return ev.venc ? 'var(--expense)' : 'var(--accent)';
  if (ev.k === 'factura') return 'var(--bill, var(--accent))';
  if (ev.k === 'cobro') return 'var(--income)';
  if (ev.k === 'hito') return 'var(--savings, var(--income))';
  return 'var(--' + (TIPO_COLOR[ev.tipo] || 'text-faint') + ', var(--text-faint))';
}
// Devuelve { 'YYYY-MM-DD': [eventos] } entre dos fechas ISO (inclusive).
function calEventos(desde, hasta) {
  const f = S.calFiltros, map = {};
  const add = (iso, ev) => { if (!iso || iso < desde || iso > hasta) return; (map[iso] = map[iso] || []).push(ev); };
  const hoy = todayISO();
  if (f.tareas) S.tareas.forEach((t) => {
    if (t.estado === 'Completado' || !t.fechaLimite) return;
    add(t.fechaLimite, { k: 'tarea', titulo: t.nombre || 'Tarea', detalle: ['Tarea', t.prioridad, t.categoria].filter(Boolean).join(' · '), venc: t.fechaLimite < hoy, click: act('openTareaForm', t.id) });
  });
  if (f.facturas) {
    recurrentes().forEach((rc) => {
      if (!rc.regla) return;
      const occs = ocurrencias(rc.regla, uAdd(desde, -20), uAdd(hasta, 20));
      estadoOcurrencias(rc, occs).forEach((o) => {
        const imp = importePrevisto(rc, o.iso);
        const est = o.estado === 'ok' ? (rc.kind === 'cobro' ? 'Cobrado' : 'Pagada') : o.estado === 'no' ? 'No ocurrió' : (o.iso < hoy ? 'Sin registrar' : 'Pendiente');
        const click = o.mov ? act('openMovForm', o.mov.id) : (o.estado === 'pend' ? act('recNuevoMov', rc.kind, rc.idx, o.iso) : '');
        add(o.iso, { k: rc.kind === 'cobro' ? 'cobro' : 'factura', titulo: rc.nombre, detalle: (rc.kind === 'cobro' ? 'Cobro' : 'Factura') + (imp != null ? ' · ' + money(imp) : '') + ' · ' + est, pagada: o.estado === 'ok', click });
      });
    });
  }
  if (f.hitos) {
    (cfg().ahorro || []).forEach((x) => { if (x && x.nombre && x.fechaObjetivo) add(x.fechaObjetivo, { k: 'hito', titulo: 'Meta: ' + x.nombre, detalle: 'Fecha objetivo' + (x.objetivo ? ' · ' + money(x.objetivo) : '') }); });
    (cfg().deudas || []).forEach((x) => { if (x && x.nombre && x.fechaObjetivo) add(x.fechaObjetivo, { k: 'hito', titulo: 'Deuda: ' + x.nombre, detalle: 'Fecha objetivo' + (x.objetivo ? ' · ' + money(x.objetivo) : '') }); });
  }
  if (f.movs) S.movimientos.forEach((m) => {
    add(m.fecha, { k: 'mov', tipo: m.tipo, titulo: m.categoria || m.tipo, detalle: m.tipo + ' · ' + moneySigned(m.importe, m.tipo) + (m.descripcion ? ' · ' + m.descripcion : ''), click: act('openMovForm', m.id) });
  });
  Object.keys(map).forEach((k) => map[k].sort((x, y) => CAL_ORDEN[x.k] - CAL_ORDEN[y.k]));
  return map;
}
function calEventRow(ev) {
  return '<div class="row ' + (ev.click ? '' : 'static') + '" ' + (ev.click || '') + '><span class="dot" style="background:' + evColor(ev) + '"></span>' +
    '<div class="main"><div class="ttl">' + escapeHtml(ev.titulo) + '</div><div class="meta">' + escapeHtml(ev.detalle) + '</div></div></div>';
}
function calFiltrosHtml() {
  const f = S.calFiltros;
  const items = [['tareas', 'Tareas'], ['facturas', 'Cobros y facturas'], ['hitos', 'Metas y deudas'], ['movs', 'Movimientos']];
  return '<div class="chips" style="margin:12px 0;">' + items.map(([k, l]) => '<button type="button" class="chip ' + (f[k] ? 'active' : '') + '" ' + act('calToggle', k) + '>' + l + '</button>').join('') + '</div>';
}
function calNavHtml(label) {
  return '<div class="month-nav"><button class="icon-btn" aria-label="Anterior" ' + act('calMove', -1) + '>' + ic('chevL') + '</button>' +
    '<div class="lbl">' + label + '</div><button class="icon-btn" aria-label="Siguiente" ' + act('calMove', 1) + '>' + ic('chevR') + '</button></div>';
}
function renderCalendario() {
  const anchor = calAnchor(), d = parseISO(anchor), hoy = todayISO();
  const seg = '<div class="segmented"><button class="' + (S.calVista === 'mes' ? 'active' : '') + '" ' + act('setCalVista', 'mes') + '>Mensual</button>' +
    '<button class="' + (S.calVista === 'semana' ? 'active' : '') + '" ' + act('setCalVista', 'semana') + '>Semanal</button>' +
    '<button ' + act('calHoy') + '>Hoy</button></div>';
  if (S.calVista === 'semana') {
    const lunes = addDaysISO(anchor, -dowMon(d)), domingo = addDaysISO(lunes, 6);
    const map = calEventos(lunes, domingo);
    const a = parseISO(lunes), b = parseISO(domingo);
    const label = a.getDate() + (a.getMonth() !== b.getMonth() ? ' ' + MESES_ABR[a.getMonth()].toLowerCase() : '') + ' – ' + b.getDate() + ' ' + MESES_ABR[b.getMonth()].toLowerCase() + ' ' + b.getFullYear();
    let rows = '';
    for (let i = 0; i < 7; i++) {
      const iso = addDaysISO(lunes, i), dd = parseISO(iso), evs = map[iso] || [];
      rows += '<div class="section-title" style="' + (iso === hoy ? 'color:var(--accent);' : '') + '">' + DIAS_LARGO[i] + ' ' + dd.getDate() + ' ' + MESES_ABR[dd.getMonth()].toLowerCase() + (iso === hoy ? ' · hoy' : '') + '</div>' +
        (evs.length ? '<div class="list">' + evs.map(calEventRow).join('') + '</div>' : '<div style="color:var(--text-faint);font-size:13px;padding:0 4px 4px;">Sin eventos</div>');
    }
    return seg + calNavHtml(label) + calFiltrosHtml() + rows;
  }
  // mensual
  const y = d.getFullYear(), m = d.getMonth(), dim = new Date(y, m + 1, 0).getDate();
  const primero = y + '-' + pad2(m + 1) + '-01', ultimo = y + '-' + pad2(m + 1) + '-' + pad2(dim);
  const map = calEventos(primero, ultimo);
  const offset = dowMon(parseISO(primero));
  let cells = DIAS_ABR.map((x) => '<div style="text-align:center;font-size:11.5px;color:var(--text-faint);padding:4px 0;">' + x + '</div>').join('');
  for (let i = 0; i < offset; i++) cells += '<div></div>';
  for (let n = 1; n <= dim; n++) {
    const iso = y + '-' + pad2(m + 1) + '-' + pad2(n), evs = map[iso] || [], sel = iso === anchor, esHoy = iso === hoy;
    const colores = []; evs.forEach((ev) => { const c = evColor(ev); if (colores.indexOf(c) < 0) colores.push(c); });
    cells += '<button type="button" ' + act('calSelDia', iso) + ' aria-label="' + n + ' ' + MESES[m] + (evs.length ? ', ' + evs.length + ' eventos' : '') + '" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;min-height:48px;padding:6px 0 4px;border-radius:10px;font:inherit;color:var(--text);cursor:pointer;background:' + (sel ? 'var(--surface-2, rgba(128,128,128,.14))' : 'transparent') + ';border:1.5px solid ' + (sel ? 'var(--accent)' : 'transparent') + ';">' +
      '<span class="tnum" style="font-size:14px;font-weight:' + (esHoy ? 700 : 500) + ';' + (esHoy ? 'color:var(--accent);' : '') + '">' + n + '</span>' +
      '<span style="display:flex;gap:3px;min-height:6px;">' + colores.slice(0, 4).map((c) => '<i style="width:6px;height:6px;border-radius:50%;background:' + c + ';display:block;"></i>').join('') + '</span></button>';
  }
  const dsel = parseISO(anchor), evsSel = map[anchor] || [];
  return seg + calNavHtml(MESES[m] + ' ' + y) + calFiltrosHtml() +
    '<div class="card" style="padding:10px 8px;"><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">' + cells + '</div></div>' +
    '<div class="section-title">' + DIAS_LARGO[dowMon(dsel)] + ' ' + dsel.getDate() + ' de ' + MESES[dsel.getMonth()].toLowerCase() + '</div>' +
    (evsSel.length ? '<div class="list">' + evsSel.map(calEventRow).join('') + '</div>' : '<div class="card" style="text-align:center;color:var(--text-faint);font-size:13.5px;">Sin eventos este día.</div>');
}
/* ============================================================
   INVERSIONES: acumulado por activo, valoración, evolución y rentabilidad anual
   ============================================================ */
function inversionesPorActivo() {
  const map = {};
  S.movimientos.filter((m) => m.tipo === 'Inversión').forEach((m) => {
    const key = m.activoId ? 'id:' + m.activoId : (normName(m.categoria) || '(sin activo)');
    const g = map[key] || (map[key] = { nombre: (m.categoria || '').trim() || 'Sin activo', total: 0, n: 0, tipoActivo: '', ultima: '', activoId: m.activoId || null, part: 0, conPart: 0 });
    g.total += num(m.importe); g.n++;
    if (m.activoId && m.participaciones != null && m.participaciones !== '') { g.part += Number(m.participaciones); g.conPart++; }
    if (m.tipoActivo && (m.fecha || '') >= g.ultima) g.tipoActivo = m.tipoActivo;
    if ((m.fecha || '') > g.ultima) g.ultima = m.fecha || '';
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
}
/* Inflación: datos fechados, consultados por mí en fuentes oficiales (no se teclean). */
const INFLACION_DATOS = {
  es: { label: 'España', tasa: 4.9, que: 'IPC, variación anual (indicador adelantado)', periodo: 'septiembre de 2026', fuente: 'INE, publicado el 29/09/2026', obtenido: '2026-10-08' },
  ue: { label: 'Zona euro', tasa: 3.8, que: 'IPCA, variación anual (estimación preliminar)', periodo: 'septiembre de 2026', fuente: 'Eurostat, publicado el 02/10/2026', obtenido: '2026-10-08' },
  mundo: { label: 'Mundo', tasa: 4.7, que: 'Inflación general media anual, previsión', periodo: 'año 2026', fuente: 'FMI, World Economic Outlook Update de julio de 2026', obtenido: '2026-10-08' }
};
function inflacionRegion() { const r = cfg().inflacionRegion; return INFLACION_DATOS[r] ? r : 'es'; }
function inflacionHtml() {
  const reg = inflacionRegion(), d = INFLACION_DATOS[reg];
  return '<div class="section-title">Inflación anual</div><div class="card">' +
    '<div class="segmented" style="margin-bottom:12px;">' + Object.keys(INFLACION_DATOS).map((k) => '<button class="' + (reg === k ? 'active' : '') + '" ' + act('setInflacion', k) + '>' + INFLACION_DATOS[k].label + '</button>').join('') + '</div>' +
    '<div style="font-size:26px;font-weight:700;" class="tnum">' + fmt2(d.tasa) + ' %</div>' +
    '<div style="font-size:11.5px;color:var(--text-faint);line-height:1.5;margin-top:6px;">' + escapeHtml(d.que) + ' · ' + escapeHtml(d.periodo) + ' · Fuente: ' + escapeHtml(d.fuente) + ' · Dato obtenido el ' + fmtDateLong(d.obtenido) + '.</div></div>';
}
const eur0 = (n) => n.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €';
const eur2 = (n) => fmt2(n) + ' €';
function valorDeGrupo(g) {
  if (!g.activoId || g.conPart !== g.n || !S.valoracion) return null;
  const v = S.valoracion.valores && S.valoracion.valores[g.activoId];
  if (!v || v.cierre_eur == null) return null;
  const valor = g.part * v.cierre_eur;
  return { valor, gan: valor - g.total, pct: g.total > 0 ? (valor - g.total) / g.total * 100 : null, v };
}
async function cargarValoracion(ids) {
  if (S._valCarga) return; S._valCarga = true;
  try {
    const r = await activosApi('valorar', { ids });
    S.valoracion = r && r.valores ? { ts: Date.now(), valores: r.valores } : { ts: Date.now(), valores: {}, error: true };
  } catch (e) { S.valoracion = { ts: Date.now(), valores: {}, error: true }; }
  S._valCarga = false;
  if (enAnalisis() && subAnalisis() === 'inversiones') render();
}
/* ---------- Evolución de la cartera y rentabilidad anual (Fase 3D) ---------- */
const PERIODOS_INV = [['1m', '1M', 30], ['3m', '3M', 91], ['6m', '6M', 182], ['1a', '1A', 365], ['max', 'Máx', 0]];
function addDiasISO(iso, n) { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function movsValorables(grupos) {
  const ok = new Set(grupos.filter((g) => g.activoId && g.conPart === g.n).map((g) => g.activoId));
  return S.movimientos.filter((m) => m.tipo === 'Inversión' && m.activoId && ok.has(m.activoId) && m.fecha && m.participaciones != null && m.participaciones !== '')
    .map((m) => ({ fecha: m.fecha, id: m.activoId, imp: num(m.importe), part: Number(m.participaciones), ajuste: /^ajuste/i.test(m.descripcion || '') }))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
}
async function cargarHistorico(ids, desde, clave) {
  if (S._histCarga) return; S._histCarga = true;
  try {
    const r = await activosApi('historico', { ids, desde });
    S.historico = r && r.series ? { ts: Date.now(), clave, series: r.series, limite: !!r.limite } : { ts: Date.now(), clave, series: {}, error: true };
  } catch (e) { S.historico = { ts: Date.now(), clave, series: {}, error: true }; }
  S._histCarga = false;
  if (enAnalisis() && subAnalisis() === 'inversiones') render();
}
// Un punto por día desde la primera aportación: participaciones acumuladas × último cierre conocido (en €).
function serieCartera(movs, series) {
  const hoy = todayISO(), ids = [...new Set(movs.map((m) => m.id))];
  const idx = {}, ult = {}, unid = {};
  ids.forEach((id) => { idx[id] = 0; const s = series[id] || []; ult[id] = s.length ? s[0][1] : null; });
  let k = 0, inv = 0; const out = [];
  for (let d = movs[0].fecha, guard = 0; d <= hoy && guard < 4000; d = addDiasISO(d, 1), guard++) {
    while (k < movs.length && movs[k].fecha <= d) { const m = movs[k++]; unid[m.id] = (unid[m.id] || 0) + m.part; inv += m.imp; }
    let v = 0;
    ids.forEach((id) => {
      const s = series[id] || [];
      while (idx[id] < s.length && s[idx[id]][0] <= d) { ult[id] = s[idx[id]][1]; idx[id]++; }
      if (unid[id] && ult[id] != null) v += unid[id] * ult[id];
    });
    out.push({ d, v, inv });
  }
  return out;
}
function cambioPeriodo(prev, fin) {
  const delta = (fin.v - fin.inv) - (prev.v - prev.inv);
  const base = prev.v + (fin.inv - prev.inv);
  return { delta, pct: base > 0 ? delta / base * 100 : null };
}
// Rentabilidad anual ponderada por dinero (TIR): tiene en cuenta cuándo entró cada euro.
function xirr(flujos) {
  if (flujos.length < 2) return null;
  const t0 = parseISO(flujos[0].d).getTime();
  const anios = flujos.map((x) => (parseISO(x.d).getTime() - t0) / 864e5 / 365);
  const f = (r) => flujos.reduce((a, x, i) => a + x.c / Math.pow(1 + r, anios[i]), 0);
  let lo = -0.99, hi = 10, flo = f(lo);
  if (!isFinite(flo) || flo * f(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2, fm = f(mid);
    if (Math.abs(fm) < 1e-9) return mid;
    if (flo * fm < 0) hi = mid; else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}
const pct1 = (n) => (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(1).replace('.', ',') + ' %';
const eurS = (n) => (n >= 0 ? '+' : '−') + fmt2(Math.abs(n)) + ' €';
function fechaCorta(iso) { const d = parseISO(iso); return d ? d.getDate() + ' ' + MESES_ABR[d.getMonth()] + ' ' + d.getFullYear() : ''; }
function evolucionHtml(grupos, valorActual) {
  const movs = movsValorables(grupos);
  if (!movs.length) return '';
  const ids = [...new Set(movs.map((m) => m.id))].sort();
  const desde = movs[0].fecha, clave = ids.join(',') + '|' + desde;
  const H = S.historico;
  const vigente = H && H.clave === clave && Date.now() - H.ts < (H.error ? 60000 : 600000);
  if (!vigente && !S._histCarga && !S._histProg && activosDisponible()) S._histProg = setTimeout(() => { S._histProg = null; cargarHistorico(ids, desde, clave); }, 0);
  const per = PERIODOS_INV.find((x) => x[0] === S.invPeriodo) || PERIODOS_INV[4];
  const chips = '<div class="segmented tr-chips">' + PERIODOS_INV.map((x) => '<button class="' + (x[0] === per[0] ? 'active' : '') + '" ' + act('setInvPeriodo', x[0]) + '>' + x[1] + '</button>').join('') + '</div>';
  let cuerpo, cabecera;
  if (H && H.clave === clave && !H.error && Object.keys(H.series).length) {
    const serie = serieCartera(movs, H.series);
    // el último punto usa la valoración actual para que cuadre con la lista de activos
    if (serie.length && valorActual != null) serie[serie.length - 1].v = valorActual;
    const ini = per[2] ? addDiasISO(todayISO(), -per[2]) : desde;
    let i0 = serie.findIndex((p) => p.d >= ini); if (i0 < 0) i0 = 0;
    const pts = serie.slice(i0);
    const prev = i0 > 0 ? serie[i0 - 1] : { d: desde, v: 0, inv: 0 };
    const fin = pts[pts.length - 1];
    const ch = cambioPeriodo(prev, fin);
    S._invChart = { pts, prev, sube: ch.delta >= 0, label: per[0] === 'max' ? 'desde el inicio' : 'en ' + per[1].replace('M', ' mes' + (per[2] > 31 ? 'es' : '')).replace('1A', '1 año') };
    const W = 320, Hh = 150;
    const vals = pts.map((p) => p.v).concat(pts.map((p) => p.inv));
    let mn = Math.min(...vals), mx = Math.max(...vals); const pad = (mx - mn) * 0.08 || 1; mn -= pad; mx += pad;
    S._invChart.mn = mn; S._invChart.mx = mx;
    const X = (i) => (pts.length > 1 ? i / (pts.length - 1) * W : W / 2), Y = (v) => Hh - (v - mn) / (mx - mn) * Hh;
    const linea = (key) => pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p[key]).toFixed(1)).join(' ');
    const color = ch.delta >= 0 ? 'var(--income)' : 'var(--expense)';
    cabecera = '<div class="tr-big tnum" id="invBig">' + eur2(fin.v) + '</div>' +
      '<div class="tr-chg tnum" id="invChg" style="color:' + color + '">' + (ch.delta >= 0 ? '▲ ' : '▼ ') + eurS(ch.delta) + (ch.pct == null ? '' : ' (' + pct1(ch.pct) + ')') + ' <span class="tr-when">' + S._invChart.label + '</span></div>';
    cuerpo = '<div class="tr-chart" id="invChart"><svg viewBox="0 0 ' + W + ' ' + Hh + '" preserveAspectRatio="none">' +
      '<path d="' + linea('inv') + '" fill="none" stroke="var(--text-faint)" stroke-width="1.2" stroke-dasharray="2 4" vector-effect="non-scaling-stroke" opacity=".7"/>' +
      '<path d="' + linea('v') + '" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>' +
      '<div class="tr-cursor" id="invLine"></div><div class="tr-dot" id="invDot" style="background:' + color + '"></div></div>' +
      '<div class="tr-legend"><span><i style="background:' + color + '"></i>Valor de tu cartera</span><span><i class="dash"></i>Lo que has metido</span></div>';
    const notas = [];
    if (movs.some((m) => m.ajuste)) notas.push('Los tramos que vienen de movimientos de «Ajuste» son aproximados: se cuentan desde la fecha del ajuste.');
    if (ids.some((id) => !(H.series[id] || []).length)) notas.push('Algún activo aún no tiene histórico de precios; se completará en la próxima actualización.');
    if (H.limite) notas.push('Hoy se ha llegado al límite diario de consultas del proveedor de precios; el histórico se completará mañana.');
    if (notas.length) cuerpo += '<div class="tr-note">' + notas.join(' ') + '</div>';
  } else {
    cabecera = valorActual != null ? '<div class="tr-big tnum">' + eur2(valorActual) + '</div>' : '';
    S._invChart = null;
    cuerpo = '<div class="tr-chart tr-empty">' + (H && H.clave === clave && H.error ? 'No se ha podido cargar la evolución. Se volverá a intentar en un momento.' : 'Cargando evolución…') + '</div>';
  }
  return '<div class="card tr-card"><div class="tr-head">' + cabecera + '<div class="tr-fecha" id="invFecha"></div></div>' + cuerpo + chips + '</div>';
}
function bindInvChart() {
  const el = document.getElementById('invChart'), C = S._invChart;
  if (!el || !C || !C.pts.length) return;
  const big = document.getElementById('invBig'), chg = document.getElementById('invChg'), fecha = document.getElementById('invFecha');
  const line = document.getElementById('invLine'), dot = document.getElementById('invDot');
  const pintar = (i) => {
    const p = C.pts[i], ch = cambioPeriodo(C.prev, p);
    const x = C.pts.length > 1 ? i / (C.pts.length - 1) * 100 : 50, y = (1 - (p.v - C.mn) / (C.mx - C.mn)) * 100;
    if (big) big.textContent = eur2(p.v);
    if (chg) { chg.style.color = ch.delta >= 0 ? 'var(--income)' : 'var(--expense)'; chg.innerHTML = (ch.delta >= 0 ? '▲ ' : '▼ ') + eurS(ch.delta) + (ch.pct == null ? '' : ' (' + pct1(ch.pct) + ')') + ' <span class="tr-when">metido: ' + eur0(p.inv) + '</span>'; }
    if (fecha) fecha.textContent = fechaCorta(p.d);
    line.style.left = x + '%'; line.style.display = 'block';
    dot.style.left = x + '%'; dot.style.top = y + '%'; dot.style.display = 'block';
  };
  const reset = () => {
    const fin = C.pts[C.pts.length - 1], ch = cambioPeriodo(C.prev, fin);
    if (big) big.textContent = eur2(fin.v);
    if (chg) { chg.style.color = ch.delta >= 0 ? 'var(--income)' : 'var(--expense)'; chg.innerHTML = (ch.delta >= 0 ? '▲ ' : '▼ ') + eurS(ch.delta) + (ch.pct == null ? '' : ' (' + pct1(ch.pct) + ')') + ' <span class="tr-when">' + C.label + '</span>'; }
    if (fecha) fecha.textContent = '';
    line.style.display = 'none'; dot.style.display = 'none';
  };
  const mover = (ev) => {
    const r = el.getBoundingClientRect(); if (!r.width) return;
    const t = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
    pintar(Math.round(t * (C.pts.length - 1)));
  };
  el.addEventListener('pointerdown', (ev) => { try { el.setPointerCapture(ev.pointerId); } catch (e) { /* */ } mover(ev); });
  el.addEventListener('pointermove', (ev) => { if (ev.pointerType === 'mouse' || ev.buttons || ev.pressure > 0) mover(ev); });
  el.addEventListener('pointerup', reset);
  el.addEventListener('pointercancel', reset);
  el.addEventListener('pointerleave', reset);
}
function rentabilidadHtml(grupos, valorActual) {
  const movs = movsValorables(grupos);
  if (!movs.length || valorActual == null) return '';
  const hoy = todayISO();
  const flujos = movs.map((m) => ({ d: m.fecha, c: -m.imp })).concat([{ d: hoy, c: valorActual }]);
  const r = xirr(flujos);
  const dias = (parseISO(hoy).getTime() - parseISO(movs[0].fecha).getTime()) / 864e5;
  if (r == null || dias < 30) return '<div class="section-title">Rentabilidad anual</div><div class="card" style="font-size:13.5px;color:var(--text-faint);">Necesitas al menos un mes de historia para calcular la rentabilidad anual.</div>';
  const reg = inflacionRegion(), inf = INFLACION_DATOS[reg];
  const rp = r * 100, ip = inf.tasa, real = ((1 + r) / (1 + ip / 100) - 1) * 100, dif = rp - ip;
  const gana = dif >= 0;
  const veredicto = gana
    ? 'Le ganas a la inflación por <b>' + Math.abs(dif).toFixed(1).replace('.', ',') + ' puntos</b>: tu poder de compra crece un ' + pct1(real).replace('+', '') + ' al año.'
    : 'La inflación te gana por <b>' + Math.abs(dif).toFixed(1).replace('.', ',') + ' puntos</b>: tu poder de compra baja un ' + pct1(real).replace('−', '') + ' al año.';
  return '<div class="section-title">Rentabilidad anual</div><div class="card">' +
    '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;"><div class="tr-big tnum" style="color:' + (rp >= 0 ? 'var(--income)' : 'var(--expense)') + '">' + pct1(rp) + '</div><div style="font-size:13px;color:var(--text-muted);">al año</div></div>' +
    '<div style="display:flex;gap:10px;margin:10px 0 8px;">' +
    '<div class="tr-mini"><div class="l">Tu cartera</div><div class="v tnum">' + pct1(rp) + '</div></div>' +
    '<div class="tr-mini" title="Inflación ' + escapeHtml(inf.label) + '"><div class="l">Inflación</div><div class="v tnum">' + fmt2(ip).replace(/,?0+$/, '').replace(/,$/, '') + ' %</div></div>' +
    '<div class="tr-mini"><div class="l">Real</div><div class="v tnum" style="color:' + (gana ? 'var(--income)' : 'var(--expense)') + '">' + pct1(real) + '</div></div></div>' +
    '<div style="font-size:13.5px;line-height:1.45;">' + (gana ? '✅ ' : '⚠️ ') + veredicto + '</div>' +
    '<div style="font-size:11.5px;color:var(--text-faint);line-height:1.5;margin-top:8px;">Calculada según cuándo metiste cada euro (rentabilidad ponderada por dinero), desde el ' + fechaCorta(movs[0].fecha) + '.' +
    (dias < 365 ? ' Con menos de un año de datos la cifra anual es orientativa: extrapola lo ocurrido hasta ahora.' : '') + ' Inflación de ' + escapeHtml(inf.label) + '; cámbiala justo debajo.</div></div>';
}
function renderInversiones() {
  const grupos = inversionesPorActivo();
  const total = grupos.reduce((a, g) => a + g.total, 0);
  const porTipo = {};
  grupos.forEach((g) => { const k = g.tipoActivo || 'Sin clasificar'; porTipo[k] = (porTipo[k] || 0) + g.total; });
  // valoración automática
  const ids = grupos.filter((g) => g.activoId && g.conPart === g.n).map((g) => g.activoId);
  if (activosDisponible() && ids.length && !S._valCarga) {
    const v = S.valoracion, edad = v ? Date.now() - v.ts : Infinity;
    const faltan = v && ids.some((id) => !(v.valores && v.valores[id]));
    if ((!v || edad > 600000 || (faltan && edad > 60000)) && !S._valProg) S._valProg = setTimeout(() => { S._valProg = null; cargarValoracion(ids); }, 0);
  }
  const vals = grupos.map(valorDeGrupo);
  const valoradas = grupos.map((g, i) => vals[i] ? g : null).filter(Boolean);
  const sumValor = vals.reduce((a, v) => a + (v ? v.valor : 0), 0);
  const sumInvValoradas = valoradas.reduce((a, g) => a + g.total, 0);
  const sumGan = sumValor - sumInvValoradas;
  const pctGan = sumInvValoradas > 0 ? sumGan / sumInvValoradas * 100 : null;
  const signo = (n) => (n >= 0 ? '+' : '−');
  let h;
  if (valoradas.length) {
    h = evolucionHtml(grupos, valoradas.length === grupos.length ? sumValor : null) +
      '<div class="kpi-row"><div class="kpi savings"><div class="v tnum">' + moneyShort(total) + '</div><div class="l">Invertido</div></div>' +
      '<div class="kpi"><div class="v tnum">' + eur0(sumValor) + '</div><div class="l">Valor actual</div></div>' +
      '<div class="kpi ' + (sumGan >= 0 ? 'income' : 'expense') + '"><div class="v tnum">' + signo(sumGan) + eur0(Math.abs(sumGan)) + '</div><div class="l">' + (pctGan == null ? 'Resultado' : signo(sumGan) + Math.abs(pctGan).toFixed(1).replace('.', ',') + ' %') + '</div></div></div>';
  } else {
    h = '<div class="kpi-row"><div class="kpi savings"><div class="v tnum">' + moneyShort(total) + '</div><div class="l">Total invertido</div></div>' +
      '<div class="kpi"><div class="v tnum">' + grupos.length + '</div><div class="l">Activos</div></div>' +
      '<div class="kpi"><div class="v tnum">' + grupos.reduce((a, g) => a + g.n, 0) + '</div><div class="l">Aportaciones</div></div></div>';
  }
  if (!grupos.length) {
    h += '<div class="card" style="text-align:center;color:var(--text-faint);font-size:13.5px;">Aún no hay inversiones. Añade un movimiento de tipo <b>Inversión</b> y busca el activo (por nombre, ticker o ISIN).</div>';
  } else {
    h += '<div class="section-title">Tus activos</div><div class="list">' + grupos.map((g, i) => {
      const vv = vals[i];
      const base = g.n + (g.n === 1 ? ' aportación' : ' aportaciones');
      if (vv) {
        const pr = vv.v;
        return '<div class="row" ' + act('verActivo', g.nombre) + '><span class="dot" style="background:var(--savings)"></span>' +
          '<div class="main"><div class="ttl">' + escapeHtml(g.nombre) + '</div><div class="meta">' + g.part.toLocaleString('es-ES', { maximumFractionDigits: 4 }) + ' part. · invertido ' + eur2(g.total) +
          ' · ' + fmt2(pr.cierre) + ' ' + escapeHtml(pr.moneda || '') + ' (cierre ' + fmtDateShort(pr.fecha_precio) + ')</div></div>' +
          '<div class="amt tnum">' + eur2(vv.valor) + '<div style="font-size:12.5px;font-weight:600;color:' + (vv.gan >= 0 ? 'var(--income)' : 'var(--expense)') + ';">' + signo(vv.gan) + eur2(Math.abs(vv.gan)) + (vv.pct == null ? '' : ' (' + signo(vv.gan) + Math.abs(vv.pct).toFixed(1).replace('.', ',') + ' %)') + '</div></div></div>';
      }
      const pendiente = g.activoId && g.conPart === g.n && activosDisponible() && !(S.valoracion && !S._valCarga);
      const sinVal = g.activoId && g.conPart === g.n && S.valoracion && !S._valCarga ? ' · sin precio disponible todavía' : (pendiente ? ' · valorando…' : '');
      return '<div class="row" ' + act('verActivo', g.nombre) + '><span class="dot" style="background:var(--savings)"></span>' +
        '<div class="main"><div class="ttl">' + escapeHtml(g.nombre) + '</div><div class="meta">' + escapeHtml(g.tipoActivo || 'Sin clasificar') + ' · ' + base + (total > 0 ? ' · ' + (g.total / total * 100).toFixed(0) + '%' : '') + (g.ultima ? ' · última ' + fmtDateShort(g.ultima) : '') + sinVal + '</div></div>' +
        '<div class="amt tnum">' + money(g.total) + '</div></div>';
    }).join('') + '</div>';
    h += '<div class="section-title">Por tipo de activo</div><div class="card">' + Object.entries(porTipo).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
      '<div class="budget-row"><div class="top"><span class="cat">' + escapeHtml(k) + '</span><span class="nums"><b class="tnum">' + money(v) + '</b></span></div>' +
      '<div class="progress"><div style="width:' + Math.max(0, Math.min(100, total > 0 ? v / total * 100 : 0)) + '%"></div></div></div>').join('') + '</div>';
  }
  const sinVincular = grupos.filter((g) => !(g.activoId && g.conPart === g.n)).length;
  h += (valoradas.length && valoradas.length === grupos.length ? rentabilidadHtml(grupos, sumValor) : '') + inflacionHtml() +
    '<div class="summary-line">Valores de cierre del último día de mercado, en euros (los activos en otras monedas se convierten al cambio del Banco Central Europeo). «Invertido» es lo que aportaste.' +
    (sinVincular && valoradas.length ? ' ' + sinVincular + (sinVincular === 1 ? ' activo no se valora' : ' activos no se valoran') + ' porque no está vinculado: edita sus movimientos y elige el activo en el buscador.' : '') + '</div>';
  return h;
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
        '<div class="amt tnum ' + (vendido ? (ben >= 0 ? 'pos' : 'neg') : '') + '">' + (vendido ? (ben >= 0 ? '+' : '−') + fmtM(Math.abs(ben)) + ' ' + sym() : money(g.invertido)) + '</div></div>';
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
    '<div class="field"><label>Invertido (' + sym() + ')</label><input id="gInv" type="number" step="0.01" inputmode="decimal" value="' + (ex ? ex.invertido : '') + '"></div>' +
    '<div class="field"><label>Venta (' + sym() + ') <span class="hint">· vacío si aún no lo has vendido</span></label><input id="gVenta" type="number" step="0.01" inputmode="decimal" value="' + (ex && ex.venta != null ? ex.venta : '') + '"></div>' +
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
  if (!done && t.repetir) partes.push('↻ ' + repTexto(t.repetir).toLowerCase());
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
  const data = aplicaEstado(t, reabrir ? 'Pendiente' : 'Completado');
  let sig = null;
  if (!reabrir && t.repetir) {
    sig = await crearSiguienteTarea(t);
    if (!sig) { _busy.delete(id); return; }
    data.repetir = null; // la repetición pasa a la tarea nueva
  }
  const ok = await write(() => S.db.collection('tareas').doc(id).set(data));
  _busy.delete(id);
  if (ok) toast(reabrir ? 'Tarea reabierta' : (sig ? '¡Hecha! La siguiente: ' + fechaCortaU(sig) : '¡Tarea completada!'));
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
    repetirFieldHtml(ex ? ex.repetir : null) +
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
  const repetir = leerRepetir();
  if (repetir === undefined) return toast('Pon cada cuánto se repite (1 a 365)');
  const data = aplicaEstado(Object.assign(base, {
    nombre, categoria: $('#tCategoria').value, prioridad: FORM.prioridad,
    fechaLimite: $('#tFecha').value || null, comentario: $('#tComentario').value.trim(), repetir,
  }), FORM.estado);
  let sig = null;
  if (repetir && FORM.estado === 'Completado' && (!ex || ex.estado !== 'Completado')) {
    sig = await crearSiguienteTarea(data);
    if (!sig) return;
    data.repetir = null; // la repetición pasa a la tarea nueva
  }
  const ok = await write(() => FORM.id ? S.db.collection('tareas').doc(FORM.id).set(data) : S.db.collection('tareas').add(data));
  if (ok) { closeSheet(); toast(sig ? 'Hecha. La siguiente: ' + fechaCortaU(sig) : (FORM.id ? 'Tarea actualizada' : 'Tarea añadida')); }
}
async function doDeleteTarea() {
  const ok = await write(() => S.db.collection('tareas').doc(FORM.id).delete());
  if (ok) { closeSheet(); toast('Tarea eliminada'); }
}

/* ============================================================
   NOVEDADES: ventana al abrir la app y etiquetas NUEVO / MEJORADO
   Para cada sesión de cambios: añadir una entrada al principio de NOVEDADES
   (con su fecha) y, si hace falta, nuevas claves en BADGES.
   ============================================================ */
const NOVEDADES = [
  { id: '2026-10-09', titulo: 'Parche 2', items: [
    ['📈', 'Gráfico de tu cartera', 'Estilo bróker: elige periodo y desliza el dedo para ver cada día.', 'inversiones'],
    ['🔥', '¿Le ganas a la inflación?', 'Tu rentabilidad anual comparada con la inflación.', 'inversiones'],
    ['📅', 'Cobros y pagos recurrentes', 'Nómina, alquiler… con su fecha real (último día hábil, primer lunes…).', 'cobros'],
    ['🔔', 'Avisos en Inicio', 'Mañana, hoy (botón Confirmar) y «¿Se ha producido?».', ''],
    ['🔁', 'Tareas que se repiten', 'Al completarla se crea sola la siguiente.', 'tareas'],
    ['📥', 'Importar del banco o Excel', 'Vista previa, sin duplicados y se puede deshacer.', 'importar'],
    ['🏷️', 'Categorías automáticas', 'Escribe «Mercadona», marca Recordar y la próxima vez se pone sola.', 'reglas'],
  ] },
];
// clave → [texto de la etiqueta, fecha de la versión]. Se ven 21 días o hasta que entras en ese apartado.
const BADGES = {
  cobros: ['NUEVO', '2026-10-09'], importar: ['NUEVO', '2026-10-09'], reglas: ['NUEVO', '2026-10-09'],
  repetir: ['NUEVO', '2026-10-09'], inversiones: ['MEJORADO', '2026-10-09'],
};
function badgeActivo(k) {
  const b = BADGES[k]; if (!b) return false;
  if (uAdd(b[1], 21) < todayISO()) return false;
  return !((cfg().badgesVistos || {})[k]);
}
function badge(k) { return badgeActivo(k) ? ' <span class="badge-new ' + (BADGES[k][0] === 'NUEVO' ? '' : 'mejor') + '">' + BADGES[k][0] + '</span>' : ''; }
function badgeDot(k) { return badgeActivo(k) ? '<span class="badge-dot"></span>' : ''; }
function verBadge(k) {
  if (!badgeActivo(k)) return;
  saveConfig({ badgesVistos: Object.assign({}, cfg().badgesVistos || {}, { [k]: todayISO() }) });
}
function novedadesHtml(todas) {
  const lista = todas ? NOVEDADES : NOVEDADES.slice(0, 1);
  return '<div class="handle"></div>' + lista.map((n, i) =>
    (i === 0 ? '<div class="nov-hero"><div class="nov-k">Novedades · ' + escapeHtml(n.titulo) + '</div><h2>🚀 ¡PalomApp se ha actualizado!</h2></div>' : '<div class="section-title">' + escapeHtml(n.titulo) + ' · ' + fechaCortaU(n.id) + '</div>') +
    '<div class="nov-list">' + n.items.map(([em, t, d, ir]) => '<div class="nov-it"' + (ir && i === 0 ? ' ' + act('novIr', ir) : '') + '><div class="nov-em">' + em + '</div><div class="nov-tx"><b>' + escapeHtml(t) + '</b><div>' + escapeHtml(d) + '</div></div>' + (ir && i === 0 ? '<span class="nov-go">' + ic('chevR') + '</span>' : '') + '</div>').join('') + '</div>'
  ).join('') +
    (!todas && NOVEDADES.length > 1 ? '<button type="button" class="link" style="margin-top:10px;" ' + act('verNovedades', '1') + '>Ver novedades anteriores</button>' : '') +
    '<div style="font-size:12.5px;color:var(--text-faint);margin-top:10px;">Lo nuevo lleva la etiqueta <span class="badge-new">NUEVO</span> o <span class="badge-new mejor">MEJORADO</span> dentro de la app. Puedes volver a ver esto en Más → Novedades.</div>' +
    '<div class="actions"><button class="btn accent block" ' + act('closeSheet') + '>¡Entendido!</button></div>';
}
function maybeNovedades() {
  if (S._novRevisado || S.onboarding || !allLoaded() || !S.db || !NOVEDADES.length) return;
  S._novRevisado = true;
  const ult = NOVEDADES[0].id;
  if ((cfg().novedadesVistas || '') >= ult) return;
  saveConfig({ novedadesVistas: ult });
  if ($('#sheetBackdrop')) return;
  setTimeout(() => { if (!$('#sheetBackdrop')) openSheet(novedadesHtml(false)); }, 400);
}

/* ============================================================
   IMPORTAR EXTRACTOS Y EXCEL (Bloque 5) + REGLAS DE CATEGORÍAS
   ============================================================ */
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
function cargarXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (cargarXLSX._p) return cargarXLSX._p;
  cargarXLSX._p = new Promise((res, rej) => {
    const sc = document.createElement('script'); sc.src = XLSX_URL; sc.async = true;
    sc.onload = () => (window.XLSX ? res(window.XLSX) : rej(new Error('xlsx')));
    sc.onerror = () => { cargarXLSX._p = null; rej(new Error('xlsx')); };
    document.head.appendChild(sc);
  });
  return cargarXLSX._p;
}
function sinAcentos(x) { return String(x == null ? '' : x).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function normDesc(x) { return sinAcentos(x).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function hash53(str) { // cyrb53: huella corta y estable para identificar filas importadas
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
function decodificarTexto(buf) {
  let t = new TextDecoder('utf-8').decode(buf);
  if (t.indexOf('�') >= 0) { try { t = new TextDecoder('windows-1252').decode(buf); } catch (e) { /* se queda en UTF-8 */ } }
  return t.replace(/^﻿/, '');
}
function parseCSV(text) {
  const lineas = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 30);
  let sep = ';', mejor = -1;
  [';', ',', '\t', '|'].forEach((c) => {
    const cuentas = lineas.map((l) => l.split(c).length - 1).filter((n) => n > 0);
    if (!cuentas.length) return;
    const freq = {}; cuentas.forEach((n) => { freq[n] = (freq[n] || 0) + 1; });
    const moda = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
    const sc = freq[moda] * Math.min(Number(moda), 12);
    if (sc > mejor) { mejor = sc; sep = c; }
  });
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.map((r) => r.map((c) => c.trim()));
}
async function leerArchivoImport(file) {
  const buf = await file.arrayBuffer();
  if (/\.(csv|txt)$/i.test(file.name || '')) return [{ nombre: 'CSV', filas: parseCSV(decodificarTexto(buf)) }];
  const X = await cargarXLSX();
  const wb = X.read(new Uint8Array(buf), { type: 'array', cellDates: false });
  return wb.SheetNames.map((n) => ({ nombre: n, filas: X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }) }));
}
function parseNum(v) {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  let t = String(v == null ? '' : v).trim().replace(/eur|€|\$|£|\s| /gi, '');
  if (!t) return null;
  let neg = false;
  if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); }
  if (/-$/.test(t)) { neg = true; t = t.slice(0, -1); }
  if (/^\+/.test(t)) t = t.slice(1);
  const lc = t.lastIndexOf(','), ld = t.lastIndexOf('.');
  if (lc > ld) t = t.replace(/\./g, '').replace(',', '.');
  else if (lc >= 0 && ld > lc) t = t.replace(/,/g, '');
  else if (lc < 0 && (t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return isFinite(n) ? (neg ? -n : n) : null;
}
function parseFechaImp(v, fmt) {
  const mk = (y, m, d) => {
    y = Number(y); m = Number(m); d = Number(d);
    if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1990 && y <= 2100)) return null;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCMonth() === m - 1 ? uISO(dt) : null;
  };
  if (typeof v === 'number') return v > 30000 && v < 80000 ? uISO(new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5)) : null;
  const t = String(v == null ? '' : v).trim();
  let m = t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (m) return mk(m[1], m[2], m[3]);
  m = t.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})\b/);
  if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return fmt === 'mdy' ? mk(y, m[1], m[2]) : mk(y, m[2], m[1]); }
  return null;
}
function tipoDesdeTexto(v) {
  const t = normDesc(v);
  if (!t) return null;
  if (/^(ingres|income|entrada)/.test(t)) return 'Ingreso';
  if (/^(factur|bill|recibo)/.test(t)) return 'Factura';
  if (/^(ahorr|saving)/.test(t)) return 'Ahorro';
  if (/^(inver|invest)/.test(t)) return 'Inversión';
  if (/^(deud|debt|prestamo)/.test(t)) return 'Deuda';
  if (/^(gast|expense|salida|pago)/.test(t)) return 'Gasto';
  return null;
}
const IMP_ROLES = [
  ['fecha', 'Fecha', ['fecha', 'date', 'f valor', 'f operacion', 'dia']],
  ['importe', 'Importe', ['importe', 'amount', 'cantidad', 'monto', 'euros']],
  ['cargo', 'Cargos (gastos)', ['cargo', 'debe', 'debit', 'salida']],
  ['abono', 'Abonos (ingresos)', ['abono', 'haber', 'credit', 'entrada']],
  ['desc', 'Descripción', ['concepto', 'descripcion', 'description', 'detalle', 'movimiento', 'operacion', 'referencia', 'nota', 'comercio', 'beneficiario', 'establecimiento']],
  ['desc2', 'Más detalle (opcional)', []],
  ['cat', 'Categoría', ['categoria', 'category', 'subcategoria']],
  ['tipo', 'Tipo', ['tipo', 'type', 'clase']],
];
function puntuarCabecera(fila) {
  let n = 0;
  (fila || []).forEach((c) => { const t = normDesc(c); if (t && IMP_ROLES.some((r) => r[2].some((k) => t.indexOf(k) >= 0)) || /saldo|balance/.test(t)) n++; });
  return n;
}
function detectarCabecera(filas) {
  let best = -1, bi = 0;
  filas.slice(0, 25).forEach((f, i) => { const sc = puntuarCabecera(f); if (sc > best) { best = sc; bi = i; } });
  return best >= 2 ? bi : 0;
}
function cabecerasDe(I) {
  const f = I.hoja.filas[I.cab] || [];
  const ancho = Math.max(f.length, ...I.hoja.filas.slice(I.cab + 1, I.cab + 30).map((x) => (x || []).length), 0);
  const letra = (i) => String.fromCharCode(65 + (i % 26));
  return Array.from({ length: ancho }, (_, i) => (String(f[i] == null ? '' : f[i]).trim() || 'Columna ' + letra(i)));
}
function adivinarColumnas(I) {
  const cab = cabecerasDe(I).map(normDesc), map = {}, usadas = new Set();
  IMP_ROLES.forEach(([rol, , claves]) => {
    if (!claves.length) return;
    const i = cab.findIndex((c, k) => !usadas.has(k) && !/saldo|balance/.test(c) && claves.some((cl) => c.indexOf(cl) >= 0));
    if (i >= 0) { map[rol] = i; usadas.add(i); }
  });
  const datos = I.hoja.filas.slice(I.cab + 1, I.cab + 40);
  const cuenta = (k, fn) => datos.filter((f) => f && fn(f[k])).length;
  if (map.fecha == null) { let b = -1; cab.forEach((_, k) => { if (usadas.has(k)) return; const n = cuenta(k, (v) => parseFechaImp(v, 'dmy')); if (n > b && n >= 2) { b = n; map.fecha = k; } }); if (map.fecha != null) usadas.add(map.fecha); }
  if (map.importe == null && map.cargo == null) { let b = -1; cab.forEach((c, k) => { if (usadas.has(k) || /saldo|balance/.test(c)) return; const n = cuenta(k, (v) => parseNum(v) != null && parseFechaImp(v, 'dmy') == null); if (n > b && n >= 2) { b = n; map.importe = k; } }); if (map.importe != null) usadas.add(map.importe); }
  if (map.desc == null) { let b = -1; cab.forEach((_, k) => { if (usadas.has(k)) return; const n = cuenta(k, (v) => typeof v === 'string' && /[a-z]{3}/i.test(v) && parseNum(v) == null); if (n > b && n >= 2) { b = n; map.desc = k; } }); }
  I.map = map;
  I.modoImporte = map.importe == null && (map.cargo != null || map.abono != null) ? 'dos' : 'uno';
  // formato de fecha: si algún primer número pasa de 12, es día/mes
  let fmt = 'dmy';
  if (map.fecha != null) { const ds = datos.map((f) => String(f[map.fecha] || '')).filter((v) => /^\d{1,2}[-\/.]\d{1,2}[-\/.]/.test(v)); if (!ds.some((v) => Number(v.split(/[-\/.]/)[0]) > 12) && ds.some((v) => Number(v.split(/[-\/.]/)[1]) > 12)) fmt = 'mdy'; }
  I.fmtFecha = fmt;
  // signo: si hay negativos, el signo manda; si no, todo son gastos (salvo que haya columna Tipo)
  const hayNeg = map.importe != null && datos.some((f) => (parseNum(f[map.importe]) || 0) < 0);
  I.signo = hayNeg || map.tipo != null ? 'signo' : 'gastos';
}
function firmaArchivo(I) { return normDesc(cabecerasDe(I).join('|')); }
/* ---- reglas y sugerencias de categoría ---- */
function reglaPara(desc, tipo) {
  const d = normDesc(desc); if (!d) return null;
  let best = null;
  (cfg().reglasCat || []).forEach((r) => {
    const t = normDesc(r && r.texto); if (!t || !r.categoria) return;
    if (r.tipo && r.tipo !== tipo) return;
    if (d.indexOf(t) >= 0 && (!best || t.length > normDesc(best.texto).length)) best = r;
  });
  return best;
}
const PALABRAS_VACIAS = new Set(['compra', 'compras', 'tarjeta', 'tarj', 'pago', 'pagos', 'recibo', 'transferencia', 'transf', 'bizum', 'adeudo', 'cargo', 'abono', 'sepa', 'con', 'del', 'las', 'los', 'para', 'por', 'una', 'favor', 'operacion', 'movil', 'contactless', 'internet', 'www', 'com', 'cuenta', 'concepto', 'devolucion', 'ref', 'num']);
function tokensDesc(desc) { return normDesc(desc).split(' ').filter((w) => w.length >= 4 && !/^\d+$/.test(w) && !PALABRAS_VACIAS.has(w)); }
function indiceCategorias() {
  const k = S.movimientos.length + '|' + (S.movimientos[0] && S.movimientos[0].id);
  if (S._idxCat && S._idxCat.k === k) return S._idxCat;
  const exacto = {}, tok = {};
  S.movimientos.forEach((m) => {
    if (!m.categoria || !m.descripcion) return;
    const nd = normDesc(m.descripcion).replace(/\d+/g, '').trim();
    const ke = m.tipo + '|' + nd;
    (exacto[ke] = exacto[ke] || {})[m.categoria] = ((exacto[ke] || {})[m.categoria] || 0) + 1;
    new Set(tokensDesc(m.descripcion)).forEach((w) => { const kt = m.tipo + '|' + w; (tok[kt] = tok[kt] || {})[m.categoria] = ((tok[kt] || {})[m.categoria] || 0) + 1; });
  });
  S._idxCat = { k, exacto, tok };
  return S._idxCat;
}
function sugerirCategoria(desc, tipo) {
  if (!desc) return '';
  const idx = indiceCategorias(), top = (o) => { const e = Object.entries(o || {}).sort((a, b) => b[1] - a[1]); const tot = e.reduce((a, x) => a + x[1], 0); return e.length && e[0][1] / tot >= 0.6 ? e[0][0] : ''; };
  const nd = normDesc(desc).replace(/\d+/g, '').trim();
  const ex = top(idx.exacto[tipo + '|' + nd]); if (ex) return ex;
  const d = normDesc(desc);
  const cat = categoriasPorTipo(tipo).find((c) => normDesc(c).length >= 4 && d.indexOf(normDesc(c)) >= 0); if (cat) return cat;
  let mejor = '', n = 0;
  tokensDesc(desc).forEach((w) => { const o = idx.tok[tipo + '|' + w]; if (!o) return; const c = top(o), tot = Object.values(o).reduce((a, x) => a + x, 0); if (c && tot > n) { n = tot; mejor = c; } });
  return mejor;
}
function palabraClave(desc) { const t = tokensDesc(desc); return t.length ? t[0] : normDesc(desc).split(' ')[0] || ''; }
/* ---- asistente ---- */
let IMP = null;
function impAbrir() { IMP = { paso: 'archivo' }; openSheet(impHtml()); }
function impHtml() {
  const I = IMP;
  const h2 = (t) => '<div class="handle"></div><h2>' + t + '</h2>';
  if (I.paso === 'archivo') {
    return h2('Importar movimientos') +
      '<div style="font-size:13.5px;color:var(--text-muted);line-height:1.5;margin:-6px 0 12px;">Sirve para el extracto de tu banco y para tu Excel de gastos: <b>.xlsx, .xls o .csv</b>. Antes de guardar verás una vista previa, y si importas dos veces el mismo archivo no se duplica nada.</div>' +
      '<label class="imp-drop"><input type="file" id="impFile" accept=".xlsx,.xls,.csv,.txt" ' + onChange('impArchivo') + '><span>' + ic('download') + ' Elegir archivo</span></label>' +
      (I.error ? '<div class="alert" style="margin-top:12px;">' + ic('alert') + '<div>' + escapeHtml(I.error) + '</div></div>' : '') +
      (I.cargando ? '<div style="margin-top:12px;color:var(--text-faint);font-size:13.5px;">Leyendo el archivo…</div>' : '') +
      '<div class="actions"><button class="btn ghost block" ' + act('closeSheet') + '>Cancelar</button></div>';
  }
  if (I.paso === 'columnas') {
    const cabs = cabecerasDe(I);
    const opt = (rol, opcional) => '<select ' + onChange('impMap', rol) + '><option value="">' + (opcional ? '— Ninguna —' : 'Elige columna…') + '</option>' + cabs.map((c, i) => '<option value="' + i + '"' + (I.map[rol] === i ? ' selected' : '') + '>' + escapeHtml(c) + '</option>').join('') + '</select>';
    const fila = (rol, lab, opcional) => '<div class="imp-map"><label>' + lab + '</label>' + opt(rol, opcional) + '</div>';
    const ejemplo = I.hoja.filas.slice(I.cab + 1).find((f) => f && f.some((c) => String(c).trim())) || [];
    const muestra = (rol) => I.map[rol] != null ? escapeHtml(String(ejemplo[I.map[rol]] == null ? '' : ejemplo[I.map[rol]]).slice(0, 40)) : '';
    return h2('¿Qué es cada columna?') +
      '<div class="imp-file">' + escapeHtml(I.archivo) + (I.hojas.length > 1 ? ' · hoja <select ' + onChange('impHoja') + '>' + I.hojas.map((hj, i) => '<option value="' + i + '"' + (I.hojaIdx === i ? ' selected' : '') + '>' + escapeHtml(hj.nombre) + '</option>').join('') + '</select>' : '') + '</div>' +
      (I.perfil ? '<div class="rec-learn">✅ Formato reconocido: ya importaste un archivo así. He puesto las mismas columnas.</div>' : '') +
      '<div class="imp-map"><label>Fila de títulos</label><select ' + onChange('impCab') + '>' + I.hoja.filas.slice(0, 25).map((f, i) => '<option value="' + i + '"' + (I.cab === i ? ' selected' : '') + '>Fila ' + (i + 1) + ': ' + escapeHtml((f || []).filter((c) => String(c).trim()).slice(0, 3).join(' · ').slice(0, 40)) + '</option>').join('') + '</select></div>' +
      fila('fecha', 'Fecha') +
      '<div class="segmented" style="margin:6px 0 10px;"><button class="' + (I.modoImporte === 'uno' ? 'active' : '') + '" ' + act('impModo', 'uno') + '>Una columna de importe</button><button class="' + (I.modoImporte === 'dos' ? 'active' : '') + '" ' + act('impModo', 'dos') + '>Cargos y abonos separados</button></div>' +
      (I.modoImporte === 'uno' ? fila('importe', 'Importe') +
        '<div class="imp-map"><label>Los importes…</label><select ' + onChange('impSigno') + '>' + [['signo', 'Llevan signo: − gasto, + ingreso'], ['gastos', 'Son todos gastos'], ['ingresos', 'Son todos ingresos']].map(([v, l]) => '<option value="' + v + '"' + (I.signo === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div>'
        : fila('cargo', 'Cargos (gastos)', true) + fila('abono', 'Abonos (ingresos)', true)) +
      fila('desc', 'Descripción', true) + fila('desc2', 'Más detalle', true) + fila('cat', 'Categoría', true) + fila('tipo', 'Tipo (gasto, ingreso…)', true) +
      '<div class="imp-map"><label>Formato de fecha</label><select ' + onChange('impFmt') + '><option value="dmy"' + (I.fmtFecha === 'dmy' ? ' selected' : '') + '>día/mes/año</option><option value="mdy"' + (I.fmtFecha === 'mdy' ? ' selected' : '') + '>mes/día/año</option></select></div>' +
      '<div class="rec-prev">Primera fila: <b>' + [muestra('fecha'), I.modoImporte === 'uno' ? muestra('importe') : (muestra('cargo') || muestra('abono')), muestra('desc')].filter(Boolean).join(' · ') + '</b></div>' +
      '<div class="actions"><button class="btn ghost block" ' + act('impVolver', 'archivo') + '>Atrás</button><button class="btn accent block" ' + act('impRevisar') + '>Ver vista previa</button></div>';
  }
  if (I.paso === 'revisar') {
    const F = I.filas, ok = F.filter((r) => r.id), err = F.filter((r) => !r.id);
    const nImp = ok.filter((r) => r.estado === 'importado').length, nDup = ok.filter((r) => r.estado === 'dup').length;
    const sel = ok.filter((r) => r.incluir && r.estado !== 'importado');
    const tot = (t) => sel.filter((r) => (t === 'in' ? r.tipo === 'Ingreso' : r.tipo !== 'Ingreso')).reduce((a, r) => a + r.importe, 0);
    const sinCat = sel.filter((r) => !r.categoria).length;
    const LIM = I.verTodo ? 2000 : 150;
    const tipos = TIPOS.filter((t) => t !== 'Inversión');
    const filaHtml = (r) => {
      const k = F.indexOf(r);
      if (r.estado === 'importado') return '';
      const cats = categoriasPorTipo(r.tipo);
      const opts = '<option value="">Sin categoría</option>' + [...new Set(cats.concat(r.categoria ? [r.categoria] : []))].map((c) => '<option' + (c === r.categoria ? ' selected' : '') + '>' + escapeHtml(c) + '</option>').join('');
      return '<div class="imp-row' + (r.incluir ? '' : ' off') + '">' +
        '<input type="checkbox" ' + (r.incluir ? 'checked' : '') + ' ' + onChange('impIncluir', k) + '>' +
        '<div class="imp-main"><div class="imp-top"><span class="imp-desc">' + escapeHtml(r.desc || '(sin descripción)') + '</span><span class="imp-amt tnum" style="color:' + ((r.tipo === 'Ingreso') === (r.importe >= 0) ? (r.tipo === 'Ingreso' ? 'var(--income)' : 'var(--expense)') : 'var(--text-muted)') + '">' + ((r.tipo === 'Ingreso') === (r.importe >= 0) ? (r.tipo === 'Ingreso' ? '+' : '−') : (r.tipo === 'Ingreso' ? '−' : '+')) + fmt2(Math.abs(r.importe)) + (r.tipo !== 'Ingreso' && r.importe < 0 ? ' <small>devolución</small>' : '') + '</span></div>' +
        '<div class="imp-sub">' + fechaCortaU(r.fecha) + ' ' + r.fecha.slice(0, 4) +
        (r.estado === 'dup' ? ' · <b style="color:var(--accent)">¿duplicado?</b>' : '') +
        (r.origenCat === 'regla' ? ' · por tu regla' : r.origenCat === 'historial' ? ' · sugerida' : r.origenCat === 'factura' ? ' · factura recurrente' : '') + '</div>' +
        '<div class="imp-sels"><select ' + onChange('impTipo', k) + '>' + tipos.map((t) => '<option' + (t === r.tipo ? ' selected' : '') + '>' + t + '</option>').join('') + '</select>' +
        '<select ' + onChange('impCat', k) + '>' + opts + '</select></div>' +
        (r.ofrecerRegla ? '<button type="button" class="link" style="font-size:12px;" ' + act('impRegla', k) + '>Recordar: «' + escapeHtml(r.ofrecerRegla) + '» → ' + escapeHtml(r.categoria) + '</button>' : '') +
        '</div></div>';
    };
    const visibles = ok.filter((r) => r.estado !== 'importado');
    return h2('Vista previa') +
      '<div class="imp-file">' + escapeHtml(I.archivo) + '</div>' +
      '<div class="kpi-row" style="margin-bottom:10px;"><div class="kpi"><div class="v tnum">' + sel.length + '</div><div class="l">A importar</div></div>' +
      '<div class="kpi income"><div class="v tnum">' + moneyShort(tot('in')) + '</div><div class="l">Ingresos</div></div>' +
      '<div class="kpi expense"><div class="v tnum">' + moneyShort(tot('out')) + '</div><div class="l">Gastos</div></div></div>' +
      (nImp ? '<div class="imp-note">✓ ' + nImp + (nImp === 1 ? ' fila ya estaba importada' : ' filas ya estaban importadas') + ': se omiten.</div>' : '') +
      (nDup ? '<div class="imp-note warn">⚠️ ' + nDup + (nDup === 1 ? ' fila se parece' : ' filas se parecen') + ' a movimientos que ya tienes (misma fecha e importe). Van desmarcadas; márcalas si son distintas.</div>' : '') +
      (err.length ? '<div class="imp-note">' + err.length + (err.length === 1 ? ' fila no se ha podido leer' : ' filas no se han podido leer') + ' (sin fecha o importe válidos) y se omiten.</div>' : '') +
      (sinCat ? '<div class="imp-note">' + sinCat + ' sin categoría: se guardarán como «Sin categoría» y podrás cambiarlas luego.</div>' : '') +
      (() => {
        const nv = impNuevosConfig(sel), partes = Object.keys(nv).filter((k) => nv[k].length).map((k) => '<b>' + IMP_NUEVOS_TXT[k] + ':</b> ' + nv[k].map(escapeHtml).join(', '));
        return partes.length ? '<label class="imp-note imp-cfg"><input type="checkbox" ' + (I.anadirConfig !== false ? 'checked' : '') + ' ' + onChange('impAnadirCfg') + '> <span>Añadir a tu configuración lo nuevo del archivo:<br>' + partes.join('<br>') + '</span></label>' : '';
      })() +
      '<div class="imp-bulk"><button type="button" class="link" ' + act('impTodas', '1') + '>Marcar todas</button> · <button type="button" class="link" ' + act('impTodas', '0') + '>Desmarcar todas</button></div>' +
      '<div class="imp-list">' + visibles.slice(0, LIM).map(filaHtml).join('') + '</div>' +
      (visibles.length > LIM ? '<button class="btn ghost block" style="margin-top:8px;" ' + act('impVerTodo') + '>Ver las ' + visibles.length + ' filas</button>' : '') +
      '<div class="actions"><button class="btn ghost block" ' + act('impVolver', 'columnas') + '>Atrás</button>' + (sel.length ? '<button class="btn accent block" ' + act('impEjecutar') + '>Importar ' + sel.length + '</button>' : '<button class="btn accent block" ' + act('closeSheet') + '>Cerrar: no hay nada nuevo</button>') + '</div>';
  }
  if (I.paso === 'importando') return h2('Importando…') + '<div style="color:var(--text-muted);font-size:14px;">Guardando ' + I.total + ' movimientos. No cierres la app.</div>';
  if (I.paso === 'hecho') {
    return h2(I.fallo ? 'Importación incompleta' : '¡Importado!') +
      '<div style="font-size:14px;line-height:1.5;">' + (I.fallo ? '⚠️ No se ha podido guardar todo (' + escapeHtml(I.fallo) + '). Lo que sí se guardó está en el lote y puedes deshacerlo.' : '✅ Se han guardado <b>' + I.hechos + '</b> movimientos.' + (I.configNuevos ? ' También se ha añadido a tu configuración lo nuevo (categorías, facturas, metas…): revísalo en Más.' : '')) + '</div>' +
      '<div style="font-size:12.5px;color:var(--text-faint);margin-top:8px;">Si algo no te cuadra, puedes deshacer esta importación entera desde Más → Importaciones.</div>' +
      '<div class="actions"><button class="btn ghost block" ' + act('impDeshacer', I.lote) + '>Deshacer</button><button class="btn accent block" ' + act('closeSheet') + '>Listo</button></div>';
  }
  return '';
}
function impPrepararHoja(i) {
  const I = IMP;
  I.hojaIdx = i; I.hoja = I.hojas[i];
  I.hoja.filas = (I.hoja.filas || []).filter((f) => Array.isArray(f) && f.some((c) => String(c == null ? '' : c).trim() !== ''));
  I.cab = detectarCabecera(I.hoja.filas);
  const perfil = (cfg().importPerfiles || {})[firmaArchivo(I)];
  if (perfil) { Object.assign(I, { map: Object.assign({}, perfil.map), modoImporte: perfil.modoImporte, signo: perfil.signo, fmtFecha: perfil.fmtFecha }); I.perfil = true; }
  else { adivinarColumnas(I); I.perfil = false; }
}
function impProcesar() {
  const I = IMP, m = I.map, filas = I.hoja.filas.slice(I.cab + 1);
  const uid = (S.user && S.user.id) || '';
  const existentes = new Set(S.movimientos.map((x) => x.id));
  const porFechaImp = {}; S.movimientos.forEach((x) => { const k = x.fecha + '|' + Math.abs(num(x.importe)).toFixed(2); porFechaImp[k] = (porFechaImp[k] || 0) + 1; });
  const usados = {}, ocurr = {}, out = [];
  const col = (f, k) => (k == null || k === '' ? '' : f[k]);
  // Con columna Tipo: ¿los gastos vienen en negativo (extracto) o en positivo (tu Excel)? Lo contrario es una devolución.
  let gastosNeg = false;
  if (m.tipo != null && m.tipo !== '' && I.modoImporte !== 'dos') {
    let neg = 0, pos = 0;
    filas.forEach((f) => { const t = tipoDesdeTexto(f[m.tipo]), v = parseNum(col(f, m.importe)); if (t && t !== 'Ingreso' && v) { if (v < 0) neg++; else pos++; } });
    gastosNeg = neg > pos;
  }
  filas.forEach((f, i) => {
    const fecha = parseFechaImp(col(f, m.fecha), I.fmtFecha);
    let imp = null;
    if (I.modoImporte === 'dos') { const c = parseNum(col(f, m.cargo)), a = parseNum(col(f, m.abono)); if (c) imp = -Math.abs(c); else if (a) imp = Math.abs(a); }
    else { imp = parseNum(col(f, m.importe)); if (imp != null && I.signo === 'gastos') imp = -Math.abs(imp); else if (imp != null && I.signo === 'ingresos') imp = Math.abs(imp); }
    const desc = [m.desc, m.desc2].filter((k) => k != null && k !== '').map((k) => String(f[k] == null ? '' : f[k]).trim()).filter(Boolean).join(' · ').slice(0, 300);
    if (!fecha || imp == null || imp === 0) { out.push({ n: i }); return; }
    let tipo = m.tipo != null && m.tipo !== '' ? tipoDesdeTexto(f[m.tipo]) : null;
    // importe que se guarda: positivo normalmente; negativo si es una devolución (solo cuando el archivo trae el tipo)
    let valor = Math.abs(imp);
    if (tipo) valor = tipo === 'Ingreso' ? imp : (gastosNeg ? -imp : imp);
    if (!tipo) tipo = imp < 0 ? 'Gasto' : 'Ingreso';
    let categoria = m.cat != null && m.cat !== '' ? String(f[m.cat] == null ? '' : f[m.cat]).trim() : '', origenCat = categoria ? 'archivo' : '';
    if (!categoria && tipo === 'Gasto') { const fa = (cfg().facturas || []).find((x) => x && x.nombre && normDesc(x.nombre).length >= 3 && normDesc(desc).indexOf(normDesc(x.nombre)) >= 0); if (fa) { tipo = 'Factura'; categoria = fa.nombre; origenCat = 'factura'; } }
    if (!categoria) { const r = reglaPara(desc, tipo); if (r) { categoria = r.categoria; origenCat = 'regla'; } }
    if (!categoria) { const sg = sugerirCategoria(desc, tipo); if (sg) { categoria = sg; origenCat = 'historial'; } }
    const base = uid + '|' + fecha + '|' + imp.toFixed(2) + '|' + normDesc(desc);
    ocurr[base] = (ocurr[base] || 0) + 1;
    const id = 'imp-' + hash53(base + '|' + ocurr[base]);
    const kd = fecha + '|' + Math.abs(imp).toFixed(2);
    let estado = 'nuevo';
    if (existentes.has(id)) { estado = 'importado'; usados[kd] = (usados[kd] || 0) + 1; }
    else if ((porFechaImp[kd] || 0) > (usados[kd] || 0)) { estado = 'dup'; usados[kd] = (usados[kd] || 0) + 1; }
    out.push({ n: i, id, fecha, importe: valor, tipo, categoria, origenCat, desc, estado, incluir: estado === 'nuevo' });
  });
  I.filas = out;
}
// Lo que trae el archivo y aún no existe en tu configuración (categorías, fuentes de ingreso, facturas, metas, deudas)
function impNuevosConfig(filas) {
  const c = cfg(), out = { categoriasGasto: [], ingresos: [], facturas: [], ahorro: [], deudas: [] };
  const existe = { categoriasGasto: (c.categoriasGasto || []).map((x) => normName(x && x.nombre)), ingresos: (c.ingresos || []).map(normName),
    facturas: (c.facturas || []).map((x) => normName(x && x.nombre)), ahorro: (c.ahorro || []).map((x) => normName(x && x.nombre)), deudas: (c.deudas || []).map((x) => normName(x && x.nombre)) };
  const clave = { Gasto: 'categoriasGasto', Ingreso: 'ingresos', Factura: 'facturas', Ahorro: 'ahorro', Deuda: 'deudas' };
  filas.forEach((r) => {
    const k = clave[r.tipo], n = (r.categoria || '').trim();
    if (!k || !n || normName(n) === 'sin categoria' || normName(n) === 'sin categoría') return;
    if (existe[k].includes(normName(n)) || out[k].some((x) => normName(x) === normName(n))) return;
    out[k].push(n);
  });
  return out;
}
const IMP_NUEVOS_TXT = { categoriasGasto: 'Categorías de gasto', ingresos: 'Fuentes de ingreso', facturas: 'Facturas recurrentes', ahorro: 'Metas de ahorro', deudas: 'Deudas' };
function impPatchConfig(filas) {
  const nuevos = impNuevosConfig(filas), c = cfg(), patch = {};
  if (nuevos.categoriasGasto.length) patch.categoriasGasto = (c.categoriasGasto || []).concat(nuevos.categoriasGasto.map((n) => ({ nombre: n, presupuesto: null })));
  if (nuevos.ingresos.length) patch.ingresos = (c.ingresos || []).concat(nuevos.ingresos);
  if (nuevos.ahorro.length) patch.ahorro = (c.ahorro || []).concat(nuevos.ahorro.map((n) => ({ nombre: n, objetivo: null, fechaObjetivo: null })));
  if (nuevos.deudas.length) patch.deudas = (c.deudas || []).concat(nuevos.deudas.map((n) => ({ nombre: n, objetivo: null, fechaObjetivo: null, recurrencia: '' })));
  if (nuevos.facturas.length) {
    patch.facturas = (c.facturas || []).concat(nuevos.facturas.map((n) => {
      const mias = filas.filter((r) => r.tipo === 'Factura' && normName(r.categoria) === normName(n)).sort((a, b) => a.fecha.localeCompare(b.fecha));
      const fechas = [...new Set(mias.map((r) => r.fecha))];
      const it = { nombre: n, importe: mias.length ? Math.abs(mias[mias.length - 1].importe) : null, diaDelMes: null, desde: todayISO() };
      // regla de fecha: aprendida con 3 o más pagos, o día fijo si al menos 2 coinciden en el mismo día del mes
      const ap = aprenderRegla(fechas);
      if (ap && ap.hits / ap.total >= 0.6) it.regla = Object.assign({}, ap.r, { aprendida: { hits: ap.hits, total: ap.total, fecha: todayISO() } });
      else {
        // mismo día y mismo hueco entre pagos: mensual (día fijo) o cada N meses; si es suelto, se deja sin fecha
        const mesN = (f) => Number(f.slice(0, 4)) * 12 + Number(f.slice(5, 7));
        const huecos = fechas.slice(1).map((f, i) => mesN(f) - mesN(fechas[i]));
        const mismoDia = fechas.every((f) => f.slice(8) === fechas[0].slice(8));
        if (fechas.length >= 2 && mismoDia && huecos.every((g) => g === huecos[0]) && huecos[0] >= 1 && huecos[0] <= 12) {
          it.regla = huecos[0] === 1 ? { t: 'dia', dia: Number(fechas[0].slice(8)), ajuste: '' } : { t: 'meses', cada: huecos[0], ancla: fechas[fechas.length - 1], ajuste: '' };
        }
      }
      if (it.regla && it.regla.t === 'dia') it.diaDelMes = it.regla.dia;
      return it;
    }));
  }
  return { nuevos, patch };
}
async function impEjecutar() {
  const I = IMP;
  const sel = I.filas.filter((r) => r.id && r.incluir && r.estado !== 'importado');
  if (!sel.length) return toast('No hay filas marcadas');
  const lote = 'L' + Date.now().toString(36);
  Object.assign(I, { paso: 'importando', total: sel.length, lote });
  updateSheet(impHtml());
  const ahora = Date.now();
  const items = sel.map((r, i) => ({ id: r.id, data: { creadoEn: ahora + i, tipo: r.tipo, importe: Math.round(r.importe * 100) / 100, categoria: r.categoria || 'Sin categoría', fecha: r.fecha, descripcion: r.desc, metodoPago: '', lote } }));
  let hechos = 0, fallo = '';
  try {
    const col = S.db.collection('movimientos');
    if (typeof col.bulkInsert === 'function') hechos = await withRetry(() => col.bulkInsert(items));
    else { for (const it of items) { await withRetry(() => col.doc(it.id).set(it.data)); hechos++; } }
  } catch (e) { console.error(e); fallo = errMsg(e); }
  const c = cfg();
  const lotes = (c.importLotes || []).concat([{ id: lote, fecha: new Date().toISOString(), archivo: I.archivo, n: hechos || 0 }]).slice(-50);
  const perfiles = Object.assign({}, c.importPerfiles || {}, { [firmaArchivo(I)]: { map: I.map, modoImporte: I.modoImporte, signo: I.signo, fmtFecha: I.fmtFecha, usado: todayISO() } });
  const extra = hechos && I.anadirConfig !== false ? impPatchConfig(sel).patch : {};
  saveConfig(Object.assign({ importLotes: lotes, importPerfiles: perfiles }, extra));
  Object.assign(I, { paso: 'hecho', hechos, fallo, configNuevos: Object.keys(extra).length });
  updateSheet(impHtml());
  if (!fallo) toast(hechos + ' movimientos importados');
}
async function deshacerLote(lote) {
  const col = S.db.collection('movimientos');
  let ok;
  if (typeof col.deleteWhere === 'function') ok = await write(() => col.deleteWhere('lote', lote));
  else { ok = true; for (const m of S.movimientos.filter((x) => x.lote === lote)) { if (!(await write(() => col.doc(m.id).delete()))) { ok = false; break; } } }
  if (!ok) return false;
  saveConfig({ importLotes: (cfg().importLotes || []).filter((l) => l.id !== lote) });
  toast('Importación deshecha');
  return true;
}
function lotesHtml() {
  const lotes = (cfg().importLotes || []).slice().reverse();
  const cuenta = (id) => S.movimientos.filter((m) => m.lote === id).length;
  return '<div class="handle"></div><h2>Importaciones</h2>' +
    (lotes.length ? '<div class="list">' + lotes.map((l) => {
      const n = cuenta(l.id), f = new Date(l.fecha);
      return '<div class="row static"><div class="main"><div class="ttl">' + escapeHtml(l.archivo || 'Archivo') + '</div><div class="meta">' + f.getDate() + ' ' + MESES_CORTO[f.getMonth()] + ' ' + f.getFullYear() + ' · ' + n + ' movimientos</div></div>' +
        '<button class="btn sm danger" ' + act('loteDeshacer', l.id) + '>Deshacer</button></div>';
    }).join('') + '</div>' : '<div class="card" style="color:var(--text-faint);font-size:13.5px;">Aún no has importado nada.</div>') +
    '<div style="font-size:12.5px;color:var(--text-faint);margin-top:10px;line-height:1.45;">Deshacer borra todos los movimientos de esa importación (también los que hayas editado después).</div>' +
    '<div class="actions"><button class="btn accent block" ' + act('closeSheet') + '>Listo</button></div>';
}
function reglasHtml() {
  const rs = cfg().reglasCat || [];
  return '<div class="handle"></div><h2>Reglas de categorías</h2>' +
    '<div style="font-size:13px;color:var(--text-muted);line-height:1.45;margin:-6px 0 10px;">Si la descripción de un movimiento contiene el texto, se le pone la categoría sola (al apuntarlo y al importar).</div>' +
    (rs.length ? '<div class="list">' + rs.map((r, i) => '<div class="row static"><div class="main"><div class="ttl">«' + escapeHtml(r.texto) + '» → ' + escapeHtml(r.categoria) + '</div><div class="meta">' + escapeHtml(r.tipo || 'Cualquier tipo') + '</div></div><button class="rm" aria-label="Quitar" ' + act('reglaQuitar', i) + '>' + ic('close') + '</button></div>').join('') + '</div>'
      : '<div class="card" style="color:var(--text-faint);font-size:13.5px;">Aún no tienes reglas. Se crean al apuntar un movimiento con descripción («Recordar…») o al importar.</div>') +
    '<div class="section-title">Añadir regla</div><div class="card">' +
    '<div class="field"><label>Si la descripción contiene</label><input id="rgTexto" type="text" placeholder="mercadona"></div>' +
    '<div class="field"><label>Tipo</label><select id="rgTipo"><option value="">Cualquiera</option>' + TIPOS.filter((t) => t !== 'Inversión').map((t) => '<option>' + t + '</option>').join('') + '</select></div>' +
    '<div class="field" style="margin-bottom:0;"><label>Categoría</label><input id="rgCat" type="text" placeholder="Alimentación"></div></div>' +
    '<div class="actions"><button class="btn ghost block" ' + act('reglaAnadir') + '>' + ic('plus') + ' Añadir</button><button class="btn accent block" ' + act('closeSheet') + '>Listo</button></div>';
}
function guardarRegla(texto, categoria, tipo) {
  const t = normDesc(texto); if (!t || !categoria) return false;
  const rs = (cfg().reglasCat || []).filter((r) => !(normDesc(r.texto) === t && (r.tipo || '') === (tipo || '')));
  rs.push({ texto: t, categoria, tipo: tipo || '' });
  saveConfig({ reglasCat: rs });
  return true;
}
/* ---- en el formulario de movimiento ---- */
function reglaBoxHtml() {
  if (!FORM || FORM.kind !== 'mov' || FORM.tipo === 'Inversión') return '';
  const desc = (($('#fDesc') || {}).value || '').trim(), cat = (($('#fCategoria') || {}).value || '').trim();
  if (!desc || !cat) return '';
  const r = reglaPara(desc, FORM.tipo);
  if (r && r.categoria === cat) return '<div class="rec-hint">Categoría puesta por tu regla «' + escapeHtml(r.texto) + '».</div>';
  const kw = FORM.reglaTexto != null ? FORM.reglaTexto : palabraClave(desc);
  if (!kw) return '';
  return '<label class="regla-box"><input type="checkbox" id="fRegla" ' + (FORM.recordar ? 'checked' : '') + ' ' + onChange('reglaCheck') + '> <span>Recordar: lo que contenga <input id="fReglaTexto" type="text" value="' + escapeHtml(kw) + '" ' + onInput('reglaTexto') + '> → <b>' + escapeHtml(cat) + '</b></span></label>';
}
function refrescarReglaBox() { const b = $('#reglaBox'); if (b) b.innerHTML = reglaBoxHtml(); }
function autoCategoriaDesc() {
  if (!FORM || FORM.kind !== 'mov' || FORM.id || FORM.tipo === 'Inversión') return;
  const desc = (($('#fDesc') || {}).value || '').trim(), inp = $('#fCategoria');
  if (!inp || !desc) return;
  if (inp.value.trim() && !FORM.catAuto) return; // ya la eligió el usuario
  const r = reglaPara(desc, FORM.tipo), sg = r ? r.categoria : sugerirCategoria(desc, FORM.tipo);
  if (sg && sg !== inp.value) { inp.value = sg; FORM.catAuto = true; $$('#catChips .chip').forEach((b) => b.classList.toggle('active', decodeURIComponent((b.getAttribute('data-click') || '').split('|')[1] || '') === sg)); }
}

/* ============================================================
   COBROS Y PAGOS RECURRENTES (Bloque 4): reglas de fechas, avisos y aprendizaje
   ============================================================ */
const DOW_LARGO = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']; // 0 = lunes
const ORDINAL = { '1': 'primer', '2': 'segundo', '3': 'tercer', '4': 'cuarto', '-1': 'último' };
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function uD(iso) { const p = String(iso).split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); }
function uISO(d) { return d.toISOString().slice(0, 10); }
function uAdd(iso, n) { const d = uD(iso); d.setUTCDate(d.getUTCDate() + n); return uISO(d); }
function dowL(d) { return (d.getUTCDay() + 6) % 7; } // 0 lunes … 6 domingo
function esFinde(d) { return dowL(d) >= 5; }
function ymdU(y, m, d) { return new Date(Date.UTC(y, m, d)); } // m empieza en 0
function diasMesU(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }
function ajustarFinde(d, modo) {
  if (!modo || !esFinde(d)) return d;
  const r = new Date(d.getTime());
  while (esFinde(r)) r.setUTCDate(r.getUTCDate() + (modo === 'antes' ? -1 : 1));
  return r;
}
// Fechas de una regla mensual dentro de un mes (y, m con enero = 0)
function fechasMesRegla(r, y, m) {
  const dim = diasMesU(y, m);
  if (r.t === 'dia') return [ajustarFinde(ymdU(y, m, Math.min(Math.max(1, Number(r.dia) || 1), dim)), r.ajuste)];
  if (r.t === 'ultHabil') { const d = ymdU(y, m, dim); while (esFinde(d)) d.setUTCDate(d.getUTCDate() - 1); return [d]; }
  if (r.t === 'priHabil') { const d = ymdU(y, m, 1); while (esFinde(d)) d.setUTCDate(d.getUTCDate() + 1); return [d]; }
  if (r.t === 'nesimo') {
    const dow = Number(r.dow) || 0, n = Number(r.n) || 1;
    if (n > 0) {
      const d = ymdU(y, m, 1); while (dowL(d) !== dow) d.setUTCDate(d.getUTCDate() + 1);
      d.setUTCDate(d.getUTCDate() + 7 * (n - 1)); return d.getUTCMonth() === m ? [d] : [];
    }
    const d = ymdU(y, m, dim); while (dowL(d) !== dow) d.setUTCDate(d.getUTCDate() - 1); return [d];
  }
  if (r.t === 'quincenal') return [ajustarFinde(ymdU(y, m, 15), r.ajuste), ajustarFinde(ymdU(y, m, dim), r.ajuste)];
  return [];
}
// Todas las fechas de una regla entre dos fechas ISO (inclusive), ordenadas.
function ocurrencias(r, desde, hasta) {
  if (!r || !r.t || !desde || !hasta || desde > hasta) return [];
  const out = [];
  if (r.t === 'meses') { // cada N meses (trimestral, semestral, anual…) el mismo día que la fecha de referencia
    if (!r.ancla) return [];
    const cada = Math.max(1, Math.min(24, Number(r.cada) || 1)), a = uD(r.ancla), dia = a.getUTCDate();
    const y0 = a.getUTCFullYear(), m0 = a.getUTCMonth(), d0 = uD(desde);
    let k = Math.floor(((d0.getUTCFullYear() - y0) * 12 + (d0.getUTCMonth() - m0)) / cada) - 1;
    for (let i = 0; i < 1000; i++, k++) {
      const mm = m0 + k * cada, yy = y0 + Math.floor(mm / 12), mo = ((mm % 12) + 12) % 12;
      const iso = uISO(ajustarFinde(ymdU(yy, mo, Math.min(dia, diasMesU(yy, mo))), r.ajuste));
      if (iso > hasta) break; if (iso >= desde) out.push(iso);
    }
    return out;
  }
  if (r.t === 'semanas') {
    if (!r.ancla) return [];
    const paso = Math.max(1, Math.min(52, Number(r.cada) || 1)) * 7 * 864e5;
    const a = uD(r.ancla).getTime();
    let k = Math.ceil((uD(desde).getTime() - a) / paso);
    for (let i = 0; i < 1000; i++, k++) { const iso = uISO(new Date(a + k * paso)); if (iso > hasta) break; if (iso >= desde) out.push(iso); }
    return out;
  }
  const a = uD(desde), b = uD(hasta), by = b.getUTCFullYear(), bm = b.getUTCMonth();
  let y = a.getUTCFullYear(), m = a.getUTCMonth() - 1; if (m < 0) { m = 11; y--; } // un mes antes: el ajuste de fin de semana puede cruzar de mes
  for (let i = 0; i < 1200; i++) {
    if (y > by || (y === by && m > bm)) break;
    fechasMesRegla(r, y, m).forEach((d) => { const iso = uISO(d); if (iso >= desde && iso <= hasta) out.push(iso); });
    m++; if (m > 11) { m = 0; y++; }
  }
  return [...new Set(out)].sort();
}
function reglaTexto(r) {
  if (!r || !r.t) return 'Sin fecha';
  const aj = r.ajuste === 'antes' ? ' (si cae en finde, el viernes antes)' : r.ajuste === 'despues' ? ' (si cae en finde, el lunes después)' : '';
  if (r.t === 'dia') return 'El día ' + r.dia + ' de cada mes' + aj;
  if (r.t === 'ultHabil') return 'Último día hábil del mes';
  if (r.t === 'priHabil') return 'Primer día hábil del mes';
  if (r.t === 'nesimo') return 'El ' + ORDINAL[String(r.n)] + ' ' + DOW_LARGO[Number(r.dow) || 0] + ' de cada mes';
  if (r.t === 'quincenal') return 'Los días 15 y último de cada mes' + aj;
  if (r.t === 'meses') { const c = Number(r.cada) || 1, d = r.ancla ? uD(r.ancla) : null; const dd = d ? d.getUTCDate() : ''; return (c === 1 ? 'Cada mes' : c === 12 ? 'Cada año' : c === 3 ? 'Cada 3 meses (trimestral)' : c === 6 ? 'Cada 6 meses (semestral)' : 'Cada ' + c + ' meses') + (d ? (c === 12 ? ', el ' + dd + ' de ' + MESES_CORTO[d.getUTCMonth()] : ', el día ' + dd) : '') + aj; }
  if (r.t === 'semanas') return (Number(r.cada) === 1 ? 'Cada semana' : 'Cada ' + r.cada + ' semanas') + (r.ancla ? ', los ' + DOW_LARGO[dowL(uD(r.ancla))] : '');
  return 'Sin fecha';
}
const fechaCortaU = (iso) => { const d = uD(iso); return d.getUTCDate() + ' ' + MESES_CORTO[d.getUTCMonth()]; };
function reglaDe(it) {
  if (it && it.regla && it.regla.t) return it.regla;
  return it && Number(it.diaDelMes) ? { t: 'dia', dia: Number(it.diaDelMes), ajuste: '' } : null;
}
// Lista unificada: ingresos fijos (config.cobros) y facturas (config.facturas)
function recurrentes() {
  const c = cfg(), out = [];
  (c.cobros || []).forEach((it, i) => { if (it && it.nombre) out.push({ kind: 'cobro', idx: i, tipo: 'Ingreso', nombre: it.nombre, importe: it.importe, regla: reglaDe(it), extras: it.extras || [], desde: it.desde || null, key: 'c:' + normName(it.nombre) }); });
  (c.facturas || []).forEach((it, i) => { if (it && it.nombre) out.push({ kind: 'factura', idx: i, tipo: 'Factura', nombre: it.nombre, importe: it.importe, regla: reglaDe(it), extras: [], desde: it.desde || null, key: 'f:' + normName(it.nombre) }); });
  return out;
}
function recBuscar(kind, idx) { return recurrentes().find((r) => r.kind === kind && r.idx === Number(idx)) || null; }
function importePrevisto(rc, iso) {
  if (rc.importe == null || rc.importe === '' || !isFinite(Number(rc.importe))) return null;
  const base = Number(rc.importe), mes = Number(iso.slice(5, 7));
  return (rc.extras || []).map(Number).includes(mes) ? base * 2 : base;
}
function toleranciaRegla(r) {
  if (r && r.t === 'semanas') return Math.max(2, Math.min(10, (Number(r.cada) || 1) * 3 - 1));
  if (r && r.t === 'quincenal') return 5;
  return 12;
}
// Para cada fecha prevista: ¿hay un movimiento que la cubra?, ¿se marcó como «no ha ocurrido»?
function estadoOcurrencias(rc, occs) {
  const tol = toleranciaRegla(rc.regla), n = normName(rc.nombre), est = cfg().recEstado || {};
  const movs = S.movimientos.filter((m) => m.tipo === rc.tipo && m.fecha && normName(m.categoria) === n).map((m) => ({ m, t: uD(m.fecha).getTime() }));
  const usados = new Set();
  return occs.map((iso) => {
    const t = uD(iso).getTime(); let best = null, bd = Infinity;
    movs.forEach((x) => { if (usados.has(x.m.id)) return; const d = Math.abs(x.t - t) / 864e5; if (d <= tol && d < bd) { bd = d; best = x.m; } });
    if (best) { usados.add(best.id); return { iso, estado: 'ok', mov: best }; }
    const e = est[rc.key + '@' + iso];
    return { iso, estado: e === 'no' ? 'no' : e === 'ok' ? 'ok' : 'pend' };
  });
}
function avisosRecurrentes() {
  const hoy = todayISO(), man = uAdd(hoy, 1), ini = uAdd(hoy, -31);
  const out = { pasados: [], hoy: [], manana: [], revisar: [] };
  recurrentes().forEach((rc) => {
    if (!rc.regla) return;
    // los que ya existían antes de esta versión solo preguntan desde el 1/10/2026, para no llenar Inicio de preguntas antiguas
    const base = rc.desde || '2026-10-01', desde = base > ini ? base : ini;
    const occs = ocurrencias(rc.regla, uAdd(desde, -40), man);
    estadoOcurrencias(rc, occs).forEach((o) => {
      if (o.iso < desde) return;
      const item = Object.assign({ rc, importe: importePrevisto(rc, o.iso) }, o);
      if (o.iso === hoy) { if (o.estado !== 'no') out.hoy.push(item); }
      else if (o.iso === man) { if (o.estado === 'pend') out.manana.push(item); }
      else if (o.iso < hoy && o.estado === 'pend') out.pasados.push(item);
    });
    if (rc.regla.aprendida) { const sug = sugerenciaMejor(rc); if (sug) out.revisar.push({ rc, sug }); }
  });
  out.pasados.sort((a, b) => a.iso.localeCompare(b.iso));
  return out;
}
function avisosRecHtml() {
  const a = avisosRecurrentes();
  if (!a.pasados.length && !a.hoy.length && !a.manana.length && !a.revisar.length) return '';
  const imp = (x) => (x.importe == null ? '' : ' · ' + money(x.importe));
  const que = (rc) => (rc.kind === 'cobro' ? 'Cobro' : 'Pago');
  const fila = (cuerpo, botones, cls) => '<div class="rec-aviso ' + (cls || '') + '"><div class="rec-txt">' + cuerpo + '</div>' + (botones ? '<div class="rec-btns">' + botones + '</div>' : '') + '</div>';
  let h = '';
  a.pasados.forEach((x) => {
    h += fila('<b>' + escapeHtml(x.rc.nombre) + '</b>' + imp(x) + '<div class="rec-sub">' + que(x.rc) + ' previsto el ' + fechaCortaU(x.iso) + ' · ¿Se ha producido?</div>',
      '<button class="btn sm accent" ' + act('recSi', x.rc.kind, x.rc.idx, x.iso) + '>Sí</button><button class="btn sm ghost" ' + act('recNo', x.rc.kind, x.rc.idx, x.iso) + '>No ha ocurrido</button>', 'pasado');
  });
  a.hoy.forEach((x) => {
    if (x.estado === 'ok') h += fila('✓ <b>Hoy: ' + escapeHtml(x.rc.nombre) + '</b>' + (x.mov ? ' · ' + money(x.mov.importe) : imp(x)) + '<div class="rec-sub">Registrado</div>',
      x.mov ? '<button class="btn sm ghost" ' + act('openMovForm', x.mov.id) + '>Editar</button>' : '', 'hecho');
    else h += fila('<b>Hoy: ' + escapeHtml(x.rc.nombre) + '</b>' + imp(x) + '<div class="rec-sub">' + que(x.rc) + ' previsto para hoy</div>',
      '<button class="btn sm accent" ' + act('recSi', x.rc.kind, x.rc.idx, x.iso) + '>Confirmar</button>', 'hoy');
  });
  a.manana.forEach((x) => { h += fila('<b>Mañana: ' + escapeHtml(x.rc.nombre) + '</b>' + imp(x) + '<div class="rec-sub">' + que(x.rc) + ' previsto</div>', '', 'manana'); });
  a.revisar.forEach((x) => {
    h += fila('<b>' + escapeHtml(x.rc.nombre) + '</b><div class="rec-sub">Tus últimos movimientos encajan mejor con «' + escapeHtml(reglaTexto(x.sug.r)) + '» (' + x.sug.hits + ' de ' + x.sug.total + ').</div>',
      '<button class="btn sm ghost" ' + act('recEditar', x.rc.kind, x.rc.idx) + '>Revisar</button>', 'revisar');
  });
  return '<div class="section-title">Cobros y pagos' + badge('cobros') + ' <button class="link" ' + act('openRecurrentes') + '>Gestionar</button></div><div class="card rec-card">' + h + '</div>';
}
function marcarRec(key, iso, v) {
  const est = Object.assign({}, cfg().recEstado || {}), lim = uAdd(todayISO(), -150);
  Object.keys(est).forEach((k) => { if ((k.split('@')[1] || '') < lim) delete est[k]; });
  if (v) est[key + '@' + iso] = v; else delete est[key + '@' + iso];
  saveConfig({ recEstado: est });
}
async function recConfirmar(kind, idx, iso) {
  const rc = recBuscar(kind, idx); if (!rc) return;
  const importe = importePrevisto(rc, iso);
  if (importe == null) { openMovForm(null, { tipo: rc.tipo, categoria: rc.nombre, fecha: iso }); return; }
  const lock = 'rec|' + rc.key + '|' + iso;
  if (_busy.has(lock)) return; _busy.add(lock);
  const data = { creadoEn: Date.now(), tipo: rc.tipo, importe, categoria: rc.nombre, fecha: iso, descripcion: '', metodoPago: '' };
  const ok = await write(() => S.db.collection('movimientos').add(data));
  _busy.delete(lock);
  if (ok) { marcarRec(rc.key, iso, 'ok'); render(); toast((rc.kind === 'cobro' ? 'Cobro' : 'Pago') + ' registrado: ' + money(importe) + '. Puedes editarlo en Movimientos.'); }
}
// Aprender la regla a partir de las fechas reales (sin servidor): prueba todo el catálogo y se queda con la que mejor explica tus fechas.
function fechasHistorial(tipo, nombre) {
  const n = normName(nombre), lim = uAdd(todayISO(), -400);
  return [...new Set(S.movimientos.filter((m) => m.tipo === tipo && m.fecha && m.fecha >= lim && normName(m.categoria) === n).map((m) => m.fecha))].sort();
}
function puntuarRegla(r, fechas) {
  const set = new Set(fechas), occ = ocurrencias(r, fechas[0], fechas[fechas.length - 1]);
  const hits = occ.filter((x) => set.has(x)).length;
  return { hits, extra: occ.length - hits, score: hits - 0.6 * (occ.length - hits) };
}
function aprenderRegla(fechas) {
  if (!fechas || fechas.length < 3) return null;
  const cands = [];
  // orden = preferencia a igualdad de aciertos: día fijo, hábiles, día con ajuste, quincenal, día de la semana, semanas
  for (let d = 1; d <= 31; d++) cands.push({ t: 'dia', dia: d, ajuste: '' });
  cands.push({ t: 'ultHabil' }, { t: 'priHabil' });
  for (let d = 1; d <= 31; d++) ['antes', 'despues'].forEach((aj) => cands.push({ t: 'dia', dia: d, ajuste: aj }));
  cands.push({ t: 'quincenal', ajuste: '' }, { t: 'quincenal', ajuste: 'antes' });
  [1, 2, 3, 4, -1].forEach((n) => { for (let w = 0; w < 7; w++) cands.push({ t: 'nesimo', n, dow: w }); });
  [1, 2, 4].forEach((c) => cands.push({ t: 'semanas', cada: c, ancla: fechas[fechas.length - 1] }));
  [2, 3, 6, 12].forEach((c) => cands.push({ t: 'meses', cada: c, ancla: fechas[fechas.length - 1], ajuste: '' }));
  let best = null;
  cands.forEach((r, i) => {
    const p = puntuarRegla(r, fechas), sc = p.score - i * 1e-6; // a igualdad, la regla más sencilla
    if (!best || sc > best.sc) best = { r, hits: p.hits, total: fechas.length, sc };
  });
  return best && best.hits >= 2 ? best : null;
}
const mismaRegla = (a, b) => ['t', 'dia', 'ajuste', 'n', 'dow', 'cada'].every((k) => String((a || {})[k] == null ? '' : a[k]) === String((b || {})[k] == null ? '' : b[k]));
function sugerenciaMejor(rc) {
  const fechas = fechasHistorial(rc.tipo, rc.nombre);
  const best = aprenderRegla(fechas);
  if (!best || mismaRegla(best.r, rc.regla)) return null;
  const actual = puntuarRegla(rc.regla, fechas);
  return best.hits > actual.hits ? best : null;
}
/* ---- Pantalla «Cobros y pagos recurrentes» ---- */
function recListaHtml() {
  const rs = recurrentes(), hoy = todayISO();
  const prox = (rc) => { const o = rc.regla ? ocurrencias(rc.regla, hoy, uAdd(hoy, 400))[0] : null; return o ? 'próximo ' + fechaCortaU(o) : ''; };
  const fila = (rc) => '<div class="row" ' + act('recEditar', rc.kind, rc.idx) + '><span class="dot" style="background:' + (rc.kind === 'cobro' ? 'var(--income)' : 'var(--bill, var(--accent))') + '"></span>' +
    '<div class="main"><div class="ttl">' + escapeHtml(rc.nombre) + '</div><div class="meta">' + escapeHtml(rc.regla ? reglaTexto(rc.regla) + ' · ' + prox(rc) : 'Sin fecha: tócalo para elegir cuándo') + '</div></div>' +
    '<div class="amt tnum">' + (rc.importe == null || rc.importe === '' ? '—' : money(rc.importe)) + '</div></div>';
  const cob = rs.filter((r) => r.kind === 'cobro'), fac = rs.filter((r) => r.kind === 'factura');
  const vacio = (t) => '<div class="card" style="color:var(--text-faint);font-size:13.5px;">' + t + '</div>';
  return '<div class="handle"></div><h2>Cobros y pagos recurrentes</h2>' +
    '<div style="font-size:13px;color:var(--text-muted);line-height:1.45;margin:-6px 0 6px;">Con cada uno te avisamos en Inicio el día anterior y el mismo día, y lo verás en el calendario.</div>' +
    '<div class="section-title">Ingresos fijos</div>' + (cob.length ? '<div class="list">' + cob.map(fila).join('') + '</div>' : vacio('Aún no tienes ninguno. Añade tu nómina u otro cobro fijo.')) +
    '<div class="section-title">Facturas y pagos</div>' + (fac.length ? '<div class="list">' + fac.map(fila).join('') + '</div>' : vacio('Aún no tienes ninguna.')) +
    '<div class="actions"><button class="btn ghost block" ' + act('recNuevo', 'cobro') + '>' + ic('plus') + ' Ingreso fijo</button><button class="btn ghost block" ' + act('recNuevo', 'factura') + '>' + ic('plus') + ' Factura o pago</button></div>' +
    '<div class="actions"><button class="btn accent block" ' + act('closeSheet') + '>Listo</button></div>';
}
const REGLA_OPC = [['dia', 'Un día fijo del mes'], ['ultHabil', 'El último día hábil del mes'], ['priHabil', 'El primer día hábil del mes'], ['nesimo', 'Un día de la semana concreto (p. ej. el primer lunes)'], ['quincenal', 'Dos veces al mes (el 15 y el último)'], ['semanas', 'Cada cierto número de semanas'], ['meses', 'Cada cierto número de meses (trimestral, anual…)']];
function reglaPorDefecto(t) {
  if (t === 'dia') return { t, dia: 1, ajuste: '' };
  if (t === 'nesimo') return { t, n: 1, dow: 0 };
  if (t === 'quincenal') return { t, ajuste: '' };
  if (t === 'semanas') return { t, cada: 2, ancla: todayISO() };
  if (t === 'meses') return { t, cada: 3, ancla: todayISO(), ajuste: '' };
  return t ? { t } : null;
}
function recParamsHtml(r) {
  const sel = (id, opts, val, field) => '<select id="' + id + '" ' + onChange('recParam', field) + '>' + opts.map(([v, l]) => '<option value="' + v + '"' + (String(val == null ? '' : val) === String(v) ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>';
  const ajuste = (val) => '<div class="field"><label>Si cae en fin de semana</label>' + sel('recAjuste', [['', 'Se queda ese día'], ['antes', 'Se adelanta al viernes'], ['despues', 'Se pasa al lunes']], val, 'ajuste') + '</div>';
  if (!r) return '';
  if (r.t === 'dia') return '<div class="field"><label>Día del mes</label><input id="recDia" type="number" min="1" max="31" inputmode="numeric" value="' + escapeHtml(r.dia) + '" ' + onInput('recParam', 'dia') + '><div class="rec-hint">Si el mes tiene menos días, se usa el último.</div></div>' + ajuste(r.ajuste);
  if (r.t === 'quincenal') return ajuste(r.ajuste);
  if (r.t === 'nesimo') return '<div class="field"><label>Cuál</label><div style="display:flex;gap:8px;">' + sel('recN', [['1', 'Primer'], ['2', 'Segundo'], ['3', 'Tercer'], ['4', 'Cuarto'], ['-1', 'Último']], r.n, 'n') + sel('recDow', DOW_LARGO.map((d, i) => [String(i), d]), r.dow, 'dow') + '</div></div>';
  if (r.t === 'meses') return '<div class="field"><label>Cada cuántos meses</label><input id="recCadaM" type="number" min="1" max="24" inputmode="numeric" value="' + escapeHtml(r.cada) + '" ' + onInput('recParam', 'cada') + '><div class="rec-hint">3 = trimestral, 6 = semestral, 12 = anual.</div></div>' +
    '<div class="field"><label>Una fecha en la que ocurrió u ocurrirá</label><input id="recAnclaM" type="date" value="' + escapeHtml(r.ancla || '') + '" ' + onChange('recParam', 'ancla') + '></div>' + ajuste(r.ajuste);
  if (r.t === 'semanas') return '<div class="field"><label>Cada cuántas semanas</label><input id="recCada" type="number" min="1" max="52" inputmode="numeric" value="' + escapeHtml(r.cada) + '" ' + onInput('recParam', 'cada') + '></div>' +
    '<div class="field"><label>Una fecha en la que ocurrió u ocurrirá</label><input id="recAncla" type="date" value="' + escapeHtml(r.ancla || '') + '" ' + onChange('recParam', 'ancla') + '></div>';
  return '';
}
function recPreviewHtml() {
  const r = FORM.regla, hoy = todayISO();
  if (!r || !r.t) return '';
  const occ = ocurrencias(r, hoy, uAdd(hoy, 400)).slice(0, 3);
  const ex = (FORM.extras || []).map(Number);
  return occ.length ? 'Próximas fechas: <b>' + occ.map((o) => fechaCortaU(o) + (ex.includes(Number(o.slice(5, 7))) ? ' (con paga extra)' : '')).join(' · ') + '</b>' : 'Revisa la regla: no sale ninguna fecha.';
}
function recEditorHtml() {
  const F = FORM, r = F.regla, esCobro = F.recKind === 'cobro';
  const nombres = esCobro ? (cfg().ingresos || []).filter(Boolean) : [];
  const meses = MESES_CORTO.map((mm, i) => '<button type="button" class="chip ' + ((F.extras || []).map(Number).includes(i + 1) ? 'active' : '') + '" ' + act('recExtra', i + 1) + '>' + mm + '</button>').join('');
  let aprendido = '';
  if (F.aprendido) aprendido = '<div class="rec-learn ' + (F.aprendido.ok ? '' : 'warn') + '">' + F.aprendido.txt + '</div>';
  let sugerencia = '';
  if (F.idx != null && r && r.aprendida && F.origKind === F.recKind) {
    const rc = { tipo: esCobro ? 'Ingreso' : 'Factura', nombre: F.nombre, regla: r };
    const sug = sugerenciaMejor(rc);
    if (sug) sugerencia = '<div class="rec-learn">Tus últimos movimientos encajan mejor con <b>' + escapeHtml(reglaTexto(sug.r)) + '</b> (coincide en ' + sug.hits + ' de ' + sug.total + '). <button type="button" class="link" ' + act('recUsarSugerencia') + '>Usar esta</button></div>';
  }
  return '<div class="handle"></div><h2>' + (F.idx != null ? 'Editar' : (esCobro ? 'Nuevo ingreso fijo' : 'Nueva factura o pago')) + '</h2>' +
    '<div class="field"><label>Tipo</label><div class="type-toggle"><button type="button" data-t="Ingreso" class="' + (esCobro ? 'active' : '') + '" ' + act('recSetKind', 'cobro') + '>Ingreso</button><button type="button" data-t="Factura" class="' + (!esCobro ? 'active' : '') + '" ' + act('recSetKind', 'factura') + '>Factura o pago</button></div></div>' +
    '<div class="field"><label>Nombre</label>' + (nombres.length ? '<div class="chips">' + nombres.map((nm) => '<button type="button" class="chip ' + (normName(nm) === normName(F.nombre) ? 'active' : '') + '" ' + act('recPickNombre', nm) + '>' + escapeHtml(nm) + '</button>').join('') + '</div>' : '') +
    '<input id="recNombre" type="text" placeholder="' + (esCobro ? 'Nómina' : 'Alquiler') + '" value="' + escapeHtml(F.nombre || '') + '" ' + onInput('recCampo', 'nombre') + '></div>' +
    '<div class="field"><label>Importe previsto (' + sym() + ') <span class="hint">· opcional</span></label><input id="recImporte" type="number" step="0.01" inputmode="decimal" value="' + (F.importe == null ? '' : escapeHtml(F.importe)) + '" ' + onInput('recCampo', 'importe') + '></div>' +
    '<div class="field"><label>¿Cuándo ' + (esCobro ? 'te suele llegar' : 'se paga') + '?</label><select id="recTipo" ' + onChange('recTipo') + '><option value="">Elige una opción…</option>' +
    REGLA_OPC.map(([v, l]) => '<option value="' + v + '"' + (r && r.t === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>' +
    (esCobro ? '<div class="rec-hint">Lo más habitual: entre el 1 y el 5, entre el 28 y el 30, o el último día hábil. Si dudas, usa «Aprender de mi historial».</div>' : '') + '</div>' +
    '<div id="recParams">' + recParamsHtml(r) + '</div>' +
    '<button type="button" class="link" style="margin:0 0 6px;" ' + act('recAprender') + '>✨ Aprender de mi historial</button>' + aprendido + sugerencia +
    (esCobro ? '<div class="field" style="margin-top:10px;"><label>Pagas extra <span class="hint">· meses en que cobras el doble</span></label><div class="chips">' + meses + '</div></div>' : '') +
    '<div class="rec-prev" id="recPrev">' + recPreviewHtml() + '</div>' +
    '<div class="rec-hint">«Día hábil» cuenta los fines de semana, todavía no los festivos.</div>' +
    '<div class="actions"><button class="btn ghost block" ' + act('openRecurrentes') + '>Cancelar</button><button class="btn accent block" ' + act('recGuardar') + '>Guardar</button></div>' +
    (F.idx != null ? '<button class="btn danger block" style="margin-top:10px;" ' + act('recEliminar') + '>' + ic('trash') + ' Eliminar</button>' : '');
}
function recRefrescarPrev() { const el = $('#recPrev'); if (el) el.innerHTML = recPreviewHtml(); }
function recAbrirEditor(kind, idx) {
  const it = idx != null ? ((cfg()[kind === 'cobro' ? 'cobros' : 'facturas'] || [])[Number(idx)] || null) : null;
  FORM = { kind: 'rec', recKind: kind, origKind: kind, idx: it ? Number(idx) : null, nombre: it ? it.nombre : '', importe: it && it.importe != null ? it.importe : null,
    regla: it ? (reglaDe(it) ? Object.assign({}, reglaDe(it)) : null) : null, extras: it && it.extras ? it.extras.slice() : [], aprendido: null };
  openSheet(recEditorHtml());
}
function recGuardar() {
  const F = FORM;
  const nombre = ($('#recNombre').value || '').trim();
  if (!nombre) return toast('Ponle un nombre');
  const impTxt = $('#recImporte').value;
  const importe = impTxt === '' ? null : parseFloat(impTxt);
  if (impTxt !== '' && !isFinite(importe)) return toast('Revisa el importe');
  let regla = F.regla && F.regla.t ? Object.assign({}, F.regla) : null;
  if (regla && regla.t === 'dia') { const d = parseInt(regla.dia, 10); if (!(d >= 1 && d <= 31)) return toast('El día tiene que estar entre 1 y 31'); regla.dia = d; }
  if (regla && regla.t === 'meses') { const c = parseInt(regla.cada, 10); if (!(c >= 1 && c <= 24)) return toast('Pon cada cuántos meses (1 a 24)'); if (!regla.ancla) return toast('Pon una fecha de referencia'); regla.cada = c; }
  if (regla && regla.t === 'semanas') { const c = parseInt(regla.cada, 10); if (!(c >= 1 && c <= 52)) return toast('Pon cada cuántas semanas (1 a 52)'); if (!regla.ancla) return toast('Pon una fecha de referencia'); regla.cada = c; }
  const c = cfg(), cobros = (c.cobros || []).slice(), facturas = (c.facturas || []).slice();
  const arrDe = (k) => (k === 'cobro' ? cobros : facturas);
  let prev = null;
  if (F.idx != null) prev = arrDe(F.origKind)[F.idx] || null;
  const item = Object.assign({}, prev || {}, { nombre, importe, regla, desde: (prev && prev.desde) || (prev ? null : todayISO()) });
  item.diaDelMes = regla && regla.t === 'dia' ? regla.dia : null;
  if (F.recKind === 'cobro') item.extras = (F.extras || []).map(Number).sort((a, b) => a - b); else delete item.extras;
  if (F.idx != null && F.origKind === F.recKind) arrDe(F.recKind)[F.idx] = item;
  else { if (F.idx != null) arrDe(F.origKind).splice(F.idx, 1); arrDe(F.recKind).push(item); }
  const patch = { cobros, facturas };
  if (F.recKind === 'cobro' && !(c.ingresos || []).some((x) => normName(x) === normName(nombre))) patch.ingresos = (c.ingresos || []).concat([nombre]);
  saveConfig(patch);
  FORM = { kind: 'recLista' };
  updateSheet(recListaHtml());
  render();
  toast('Guardado');
}
function recEliminar() {
  const F = FORM, key = F.origKind === 'cobro' ? 'cobros' : 'facturas';
  const arr = (cfg()[key] || []).slice(); arr.splice(F.idx, 1);
  saveConfig({ [key]: arr });
  FORM = { kind: 'recLista' };
  updateSheet(recListaHtml());
  render();
  toast('Eliminado');
}
/* ---- Tareas recurrentes ---- */
const REP_UNIDADES = { dia: ['día', 'días'], semana: ['semana', 'semanas'], mes: ['mes', 'meses'], anio: ['año', 'años'] };
function repTexto(rep) {
  if (!rep || !REP_UNIDADES[rep.unidad]) return '';
  const n = Number(rep.cada) || 1, u = REP_UNIDADES[rep.unidad];
  if (n === 1) return { dia: 'Cada día', semana: 'Cada semana', mes: 'Cada mes', anio: 'Cada año' }[rep.unidad];
  return 'Cada ' + n + ' ' + u[1];
}
function sumarPeriodo(iso, rep, veces) {
  const d = uD(iso), n = (Number(rep.cada) || 1) * veces;
  if (rep.unidad === 'dia') d.setUTCDate(d.getUTCDate() + n);
  else if (rep.unidad === 'semana') d.setUTCDate(d.getUTCDate() + 7 * n);
  else {
    const meses = rep.unidad === 'anio' ? 12 * n : n, dia = d.getUTCDate();
    d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + meses);
    d.setUTCDate(Math.min(dia, diasMesU(d.getUTCFullYear(), d.getUTCMonth())));
  }
  return uISO(d);
}
function siguienteFechaTarea(t) {
  const hoy = todayISO(), base = t.fechaLimite || hoy;
  let k = 1, sig = sumarPeriodo(base, t.repetir, 1);
  while (sig <= hoy && k < 2000) { k++; sig = sumarPeriodo(base, t.repetir, k); }
  return sig;
}
async function crearSiguienteTarea(t) {
  const sig = siguienteFechaTarea(t);
  const nueva = { nombre: t.nombre, categoria: t.categoria || '', prioridad: t.prioridad || 'Media', estado: 'Pendiente', fechaLimite: sig, comentario: t.comentario || '',
    fechaCreacion: todayISO(), fechaInicio: null, fechaFin: null, repetir: t.repetir };
  const ok = await write(() => S.db.collection('tareas').add(nueva));
  return ok ? sig : null;
}
function leerRepetir() {
  const el = $('#tRepetir'); const v = el ? el.value : '';
  if (!v) return null;
  if (v !== 'custom') return { cada: 1, unidad: v };
  const n = parseInt(($('#tRepN') || {}).value, 10), u = ($('#tRepU') || {}).value;
  return n >= 1 && n <= 365 && REP_UNIDADES[u] ? { cada: n, unidad: u } : undefined;
}
function repCustomHtml(rep) {
  return '<div style="display:flex;gap:8px;align-items:center;margin-top:8px;"><span style="font-size:14px;">Cada</span><input id="tRepN" type="number" min="1" max="365" inputmode="numeric" style="max-width:80px;" value="' + escapeHtml(rep && rep.cada ? rep.cada : 2) + '">' +
    '<select id="tRepU">' + Object.keys(REP_UNIDADES).map((k) => '<option value="' + k + '"' + (rep && rep.unidad === k ? ' selected' : '') + '>' + REP_UNIDADES[k][1] + '</option>').join('') + '</select></div>';
}
function repetirFieldHtml(rep) {
  const sel = !rep ? '' : (Number(rep.cada) === 1 ? rep.unidad : 'custom');
  const opts = [['', 'No se repite'], ['dia', 'Cada día'], ['semana', 'Cada semana'], ['mes', 'Cada mes'], ['anio', 'Cada año'], ['custom', 'Personalizado…']];
  return '<div class="field"><label>Repetir' + badge('repetir') + '</label><select id="tRepetir" ' + onChange('tRepetirCambio') + '>' + opts.map(([v, l]) => '<option value="' + v + '"' + (sel === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>' +
    '<div id="tRepCustom">' + (sel === 'custom' ? repCustomHtml(rep) : '') + '</div>' +
    '<div class="rec-hint">Al completarla se crea sola la siguiente.</div></div>';
}

/* ============================================================
   MÁS / CONFIGURACIÓN
   ============================================================ */
const LIST_META = {
  categoriasGasto: { title: 'Categorías de gasto', amtField: 'presupuesto', amtLabel: 'Presup./mes', icon: 'tag' },
  facturas: { title: 'Facturas recurrentes', amtField: 'importe', amtLabel: 'Importe', icon: 'wallet',
    extra: [{ field: 'diaDelMes', label: 'Día del mes', type: 'day' }] },
  ahorro: { title: 'Metas de ahorro', amtField: 'objetivo', amtLabel: 'Objetivo', icon: 'flag',
    extra: [{ field: 'fechaObjetivo', label: 'Fecha objetivo', type: 'date' }, { field: 'yaAhorrado', label: 'Ya ahorrado antes', type: 'money' }] },
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
      novedadesVistas: NOVEDADES.length ? NOVEDADES[0].id : '',
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
    '<div class="profile-tile"><div class="av">' + sym() + '</div><div><div class="t">Mis Finanzas y Tareas</div>' +
    '<div class="d">' + escapeHtml((S.user && S.user.email) || '') + ' · datos privados, sincronizados entre tus dispositivos.</div></div></div>' +
    '<div class="section-title">Categorías y presupuestos</div><div class="card menu">' +
    item('categoriasGasto') +
    '<button class="menu-item" ' + act('openRecurrentes') + '><span class="ic">' + ic('calendar') + '</span>Cobros y pagos recurrentes' + badge('cobros') + '<span class="chev">' + ic('chevR') + '</span></button>' +
    ['ahorro', 'deudas', 'ingresos', 'metodosPago', 'categoriasTareas'].map(item).join('') +
    '<button class="menu-item" ' + act('openReglas') + '><span class="ic">' + ic('tag') + '</span>Reglas de categorías' + badge('reglas') + '<span class="chev">' + ic('chevR') + '</span></button>' +
    '<button class="menu-item" ' + act('openTabsAn') + '><span class="ic">' + ic('chart') + '</span>Pestañas de Análisis<span class="chev">' + ic('chevR') + '</span></button></div>' +
    '<div class="section-title">Cuenta y seguridad</div><div class="card menu">' +
    '<button class="menu-item" ' + act('openMoneda') + '><span class="ic">' + ic('chart') + '</span>Moneda<span style="margin-left:auto;color:var(--text-faint);font-size:13px;">' + monedaCod() + ' ' + sym() + '</span><span class="chev">' + ic('chevR') + '</span></button>' +
    (mfaDisponible() ? '<button class="menu-item" ' + act('openSeguridad') + '><span class="ic">' + ic('alert') + '</span>Verificación en dos pasos<span class="chev">' + ic('chevR') + '</span></button>' : '') + '</div>' +
    '<div class="section-title">Novedades</div><div class="card menu"><button class="menu-item" ' + act('verNovedades', '1') + '><span class="ic">' + ic('flag') + '</span>Qué hay de nuevo<span style="margin-left:auto;color:var(--text-faint);font-size:13px;">' + (NOVEDADES[0] ? escapeHtml(NOVEDADES[0].titulo) : '') + '</span><span class="chev">' + ic('chevR') + '</span></button></div>' +
    '<div class="section-title">Tus datos</div><div class="card menu">' +
    '<button class="menu-item" ' + act('impAbrir') + '><span class="ic">' + ic('download') + '</span>Importar extracto o Excel' + badge('importar') + '<span class="chev">' + ic('chevR') + '</span></button>' +
    '<button class="menu-item" ' + act('openLotes') + '><span class="ic">' + ic('list') + '</span>Importaciones<span class="chev">' + ic('chevR') + '</span></button>' +
    '<button class="menu-item" ' + act('exportBackup') + '><span class="ic">' + ic('download') + '</span>Copia de seguridad (.json)<span class="chev">' + ic('chevR') + '</span></button></div>' +
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
let _sheetGen = 0; // evita que el cierre retardado de una hoja borre otra que se acaba de abrir
function openSheet(html) {
  const host = $('#sheetHost'); if (!host) return;
  _sheetGen++;
  host.innerHTML = '<div class="sheet-backdrop" id="sheetBackdrop" role="dialog" aria-modal="true"><div class="sheet">' + html + '</div></div>';
  requestAnimationFrame(() => { const b = $('#sheetBackdrop'); if (b) b.classList.add('open'); });
}
function updateSheet(html) { const s = $('#sheetBackdrop .sheet'); if (s) s.innerHTML = html; else openSheet(html); }
function closeSheet() {
  const b = $('#sheetBackdrop'); if (!b) return;
  b.classList.remove('open');
  const gen = _sheetGen;
  setTimeout(() => { if (gen !== _sheetGen) return; const h = $('#sheetHost'); if (h && !h.querySelector('.sheet-backdrop.open')) h.innerHTML = ''; }, 220);
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
  goTab: ([id]) => { if (id === 'analisis') { S.tab = 'inicio'; S.inicioSub = 'analisis'; } else { S.tab = id; if (id === 'inicio') S.inicioSub = 'dashboard'; } render(); window.scrollTo(0, 0); },
  setInicioSub: ([sub]) => { S.inicioSub = sub; render(); },
  onFab: () => {
    if (S.tab === 'tareas') return openTareaForm();
    if (enAnalisis() && PROYECTOS_VISIBLE && subAnalisis() === 'proyectos') return openGolfForm();
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
    const inv = $('#invFields'); if (inv) inv.innerHTML = invFieldsHtml(t, '');
    const cl = $('#catLabel'); if (cl) cl.innerHTML = catLabel(t);
    syncCatField();
  },
  // activos automáticos
  invAuto: () => { FORM.invModo = 'auto'; refreshInvFields(); },
  invManual: () => { FORM.invModo = 'manual'; FORM.activo = null; FORM.precio = null; refreshInvFields(); },
  cambiarActivo: () => { FORM.activo = null; FORM.precio = null; FORM.partOrig = null; refreshInvFields(); },
  pickActivoPropio: ([id]) => { const n = (activosPropios().find((x) => x[0] === id) || [])[1] || 'Activo'; const ex = S.movimientos.find((m) => m.activoId === id); elegirActivo({ activo_id: id, nombre: n, tipo: ex ? ex.tipoActivo : '', simbolo: '', moneda: '' }); },
  buscarActivo: async ([modo]) => {
    const q = (($('#fBuscar') || {}).value || '').trim(); const box = $('#resBusca'); if (!box) return;
    if (q.length < 2) { box.innerHTML = '<span style="font-size:13px;color:var(--text-faint);">Escribe al menos 2 letras.</span>'; return; }
    box.innerHTML = '<span style="font-size:13px;color:var(--text-faint);">Buscando…</span>';
    let r; try { r = await activosApi('buscar', { q, externo: modo === 'ext' }); } catch (e) { r = { error: 'red' }; }
    if (!$('#resBusca')) return;
    if (r.error) { box.innerHTML = '<span style="font-size:13px;color:var(--expense);">No se pudo buscar. Revisa tu conexión.</span>'; return; }
    FORM.resultados = r.resultados || [];
    let h = FORM.resultados.map((x, i) => '<button type="button" class="menu-item" style="width:100%;text-align:left;" ' + act('pickResultado', i) + '><span style="flex:1;"><b>' + escapeHtml(x.nombre) + '</b><br><span style="font-size:12.5px;color:var(--text-faint);">' + escapeHtml([x.simbolo, x.tipo, x.moneda, x.bolsa, x.isin].filter(Boolean).join(' · ')) + '</span></span></button>').join('');
    if (!FORM.resultados.length) h = '<span style="font-size:13px;color:var(--text-faint);">Sin resultados.' + (r.limite ? ' Hoy se han agotado las consultas gratuitas al mercado; inténtalo mañana.' : '') + '</span>';
    if (r.hayMas) h += '<button type="button" class="link" style="margin-top:6px;" ' + act('buscarActivo', 'ext') + '>No es este: buscar en el mercado</button>';
    box.innerHTML = h;
  },
  pickResultado: ([i]) => { const a = (FORM.resultados || [])[Number(i)]; if (a) elegirActivo(Object.assign({}, a)); },
  onFechaChange: () => { if (FORM.activo) cargarPreview(); },
  onImporteInput: () => updatePreview(),
  pickCat: ([c]) => {
    const inp = $('#fCategoria'); if (inp) inp.value = c; if (FORM) FORM.catAuto = false; setTimeout(refrescarReglaBox, 0);
    $$('#catChips .chip').forEach((b) => b.classList.toggle('active', decodeURIComponent((b.getAttribute('data-click') || '').split('|')[1] || '') === c));
  },
  onCatInput: (_a, el) => { if (FORM) FORM.catAuto = false; refrescarReglaBox(); $$('#catChips .chip').forEach((b) => b.classList.toggle('active', decodeURIComponent((b.getAttribute('data-click') || '').split('|')[1] || '') === el.value.trim())); },
  saveMov: () => saveMov(),
  deleteMov: (_a, el) => confirmDelete(el, doDeleteMov),
  // análisis
  setAnalisisSub: ([s]) => { if (s === 'inversiones') verBadge('inversiones'); S.analisisSub = s; render(); },
  goMetas: () => { S.tab = 'inicio'; S.inicioSub = 'analisis'; S.analisisSub = 'metas'; render(); window.scrollTo(0, 0); },
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
  impAbrir: () => { verBadge('importar'); impAbrir(); },
  impArchivo: async (_, el) => {
    const f = el.files && el.files[0]; if (!f) return;
    if (f.size > 15 * 1024 * 1024) { IMP.error = 'El archivo es demasiado grande (máx. 15 MB).'; updateSheet(impHtml()); return; }
    IMP.error = ''; IMP.cargando = true; updateSheet(impHtml());
    try {
      const hojas = await leerArchivoImport(f);
      const buenas = hojas.filter((h) => (h.filas || []).some((r) => Array.isArray(r) && r.some((c) => String(c).trim())));
      if (!buenas.length) throw new Error('vacío');
      Object.assign(IMP, { archivo: f.name, hojas: buenas, cargando: false, paso: 'columnas' });
      impPrepararHoja(0);
    } catch (e) {
      console.error(e);
      Object.assign(IMP, { cargando: false, error: e && e.message === 'xlsx' ? 'No se pudo cargar el lector de Excel. Revisa tu conexión e inténtalo de nuevo.' : 'No he podido leer ese archivo. Prueba a exportarlo de nuevo como .xlsx o .csv.' });
    }
    updateSheet(impHtml());
  },
  impHoja: (_, el) => { impPrepararHoja(Number(el.value)); updateSheet(impHtml()); },
  impCab: (_, el) => { IMP.cab = Number(el.value); IMP.perfil = false; adivinarColumnas(IMP); updateSheet(impHtml()); },
  impMap: ([rol], el) => { if (el.value === '') delete IMP.map[rol]; else IMP.map[rol] = Number(el.value); updateSheet(impHtml()); },
  impModo: ([m]) => { IMP.modoImporte = m; updateSheet(impHtml()); },
  impSigno: (_, el) => { IMP.signo = el.value; },
  impFmt: (_, el) => { IMP.fmtFecha = el.value; updateSheet(impHtml()); },
  impVolver: ([p]) => { IMP.paso = p; updateSheet(impHtml()); },
  impRevisar: () => {
    const m = IMP.map;
    if (m.fecha == null) return toast('Elige la columna de la fecha');
    if (IMP.modoImporte === 'uno' && m.importe == null) return toast('Elige la columna del importe');
    if (IMP.modoImporte === 'dos' && m.cargo == null && m.abono == null) return toast('Elige la columna de cargos o de abonos');
    impProcesar();
    if (!IMP.filas.some((r) => r.id)) return toast('No he podido leer ninguna fila: revisa las columnas y el formato de fecha');
    IMP.paso = 'revisar'; IMP.verTodo = false; updateSheet(impHtml());
  },
  impIncluir: ([k], el) => { const r = IMP.filas[Number(k)]; if (r) { r.incluir = el.checked; updateSheet(impHtml()); } },
  impTodas: ([v]) => { IMP.filas.forEach((r) => { if (r.id && r.estado !== 'importado') r.incluir = v === '1'; }); updateSheet(impHtml()); },
  impVerTodo: () => { IMP.verTodo = true; updateSheet(impHtml()); },
  impTipo: ([k], el) => { const r = IMP.filas[Number(k)]; if (!r) return; r.tipo = el.value; if (r.origenCat !== 'archivo') { const rg = reglaPara(r.desc, r.tipo); r.categoria = rg ? rg.categoria : sugerirCategoria(r.desc, r.tipo); r.origenCat = rg ? 'regla' : r.categoria ? 'historial' : ''; } updateSheet(impHtml()); },
  impCat: ([k], el) => {
    const r = IMP.filas[Number(k)]; if (!r) return;
    r.categoria = el.value; r.origenCat = 'manual';
    // misma descripción → misma categoría (si no la habías tocado)
    const nd = normDesc(r.desc);
    if (nd) IMP.filas.forEach((x) => { if (x !== r && x.id && x.tipo === r.tipo && x.origenCat !== 'manual' && normDesc(x.desc) === nd) { x.categoria = r.categoria; x.origenCat = 'manual'; } });
    r.ofrecerRegla = r.categoria && r.desc ? palabraClave(r.desc) : '';
    updateSheet(impHtml());
  },
  impRegla: ([k]) => {
    const r = IMP.filas[Number(k)]; if (!r || !r.ofrecerRegla) return;
    if (guardarRegla(r.ofrecerRegla, r.categoria, r.tipo)) {
      IMP.filas.forEach((x) => { if (x.id && x.origenCat !== 'manual' && x.tipo === r.tipo && normDesc(x.desc).indexOf(normDesc(r.ofrecerRegla)) >= 0) { x.categoria = r.categoria; x.origenCat = 'regla'; } });
      toast('Regla creada: «' + normDesc(r.ofrecerRegla) + '» → ' + r.categoria);
    }
    r.ofrecerRegla = ''; updateSheet(impHtml());
  },
  impEjecutar: () => impEjecutar(),
  impAnadirCfg: (_, el) => { IMP.anadirConfig = el.checked; },
  impDeshacer: async ([lote]) => { if (await deshacerLote(lote)) closeSheet(); },
  openLotes: () => { FORM = { kind: 'lotes' }; openSheet(lotesHtml()); },
  loteDeshacer: ([id], el) => confirmDelete(el, async () => { if (await deshacerLote(id)) setTimeout(() => updateSheet(lotesHtml()), 400); }),
  openReglas: () => { verBadge('reglas'); FORM = { kind: 'reglas' }; openSheet(reglasHtml()); },
  reglaQuitar: ([i]) => { const rs = (cfg().reglasCat || []).slice(); rs.splice(Number(i), 1); saveConfig({ reglasCat: rs }); updateSheet(reglasHtml()); },
  reglaAnadir: () => { const t = $('#rgTexto').value, c = $('#rgCat').value.trim(); if (!normDesc(t) || !c) return toast('Pon el texto y la categoría'); guardarRegla(t, c, $('#rgTipo').value); updateSheet(reglasHtml()); toast('Regla añadida'); },
  onDescInput: () => { autoCategoriaDesc(); refrescarReglaBox(); },
  reglaCheck: (_, el) => { FORM.recordar = el.checked; },
  reglaTexto: (_, el) => { FORM.reglaTexto = el.value; },
  openRecurrentes: () => { verBadge('cobros'); FORM = { kind: 'recLista' }; if ($('#sheetBackdrop')) updateSheet(recListaHtml()); else openSheet(recListaHtml()); },
  recNuevo: ([k]) => recAbrirEditor(k, null),
  recEditar: ([k, i]) => recAbrirEditor(k, i),
  recSetKind: ([k]) => { if (FORM.kind !== 'rec') return; FORM.nombre = ($('#recNombre') || {}).value || FORM.nombre; FORM.recKind = k; FORM.aprendido = null; updateSheet(recEditorHtml()); },
  recPickNombre: ([n]) => { FORM.nombre = n; const el = $('#recNombre'); if (el) el.value = n; $$('#sheetBackdrop .chips .chip').forEach((c) => { if (c.textContent && !/^[a-z]{3}$/.test(c.textContent)) c.classList.toggle('active', normName(c.textContent) === normName(n)); }); },
  recCampo: ([f], el) => { if (f === 'importe') FORM.importe = el.value === '' ? null : el.value; else FORM[f] = el.value; },
  recTipo: (_, el) => { FORM.regla = reglaPorDefecto(el.value); FORM.aprendido = null; const p = $('#recParams'); if (p) p.innerHTML = recParamsHtml(FORM.regla); recRefrescarPrev(); },
  recParam: ([f], el) => { if (!FORM.regla) return; const v = el.value; FORM.regla = Object.assign({}, FORM.regla, { [f]: (f === 'dia' || f === 'cada' || f === 'n' || f === 'dow') ? (v === '' ? '' : Number(v)) : v }); delete FORM.regla.aprendida; recRefrescarPrev(); },
  recExtra: ([m]) => { const n = Number(m), ex = (FORM.extras || []).map(Number); FORM.extras = ex.includes(n) ? ex.filter((x) => x !== n) : ex.concat([n]); FORM.nombre = ($('#recNombre') || {}).value || FORM.nombre; updateSheet(recEditorHtml()); },
  recAprender: () => {
    FORM.nombre = (($('#recNombre') || {}).value || '').trim();
    if (!FORM.nombre) { toast('Escribe primero el nombre'); return; }
    const tipo = FORM.recKind === 'cobro' ? 'Ingreso' : 'Factura';
    const fechas = fechasHistorial(tipo, FORM.nombre);
    const best = aprenderRegla(fechas);
    if (!best) FORM.aprendido = { ok: false, txt: 'Necesito al menos 3 movimientos de «' + escapeHtml(FORM.nombre) + '» (tipo ' + tipo + ') para aprender la regla. Ahora hay ' + fechas.length + '.' };
    else {
      FORM.regla = Object.assign({}, best.r, { aprendida: { hits: best.hits, total: best.total, fecha: todayISO() } });
      const claro = best.hits / best.total >= 0.6;
      FORM.aprendido = { ok: claro, txt: (claro ? '✅ ' : '⚠️ ') + 'Regla aprendida: <b>' + escapeHtml(reglaTexto(best.r)) + '</b>. Coincide en ' + best.hits + ' de ' + best.total + ' movimientos.' + (claro ? '' : ' No hay un patrón claro: revísala.') };
    }
    updateSheet(recEditorHtml());
  },
  recUsarSugerencia: () => { const sug = sugerenciaMejor({ tipo: FORM.recKind === 'cobro' ? 'Ingreso' : 'Factura', nombre: FORM.nombre, regla: FORM.regla }); if (sug) { FORM.regla = Object.assign({}, sug.r, { aprendida: { hits: sug.hits, total: sug.total, fecha: todayISO() } }); FORM.aprendido = { ok: true, txt: '✅ Regla actualizada: <b>' + escapeHtml(reglaTexto(sug.r)) + '</b>. Pulsa Guardar.' }; updateSheet(recEditorHtml()); } },
  recGuardar: () => recGuardar(),
  recEliminar: (_, el) => confirmDelete(el, recEliminar),
  recSi: ([k, i, iso]) => recConfirmar(k, i, iso),
  recNo: ([k, i, iso]) => { const rc = recBuscar(k, i); if (!rc) return; marcarRec(rc.key, iso, 'no'); render(); toast('Anotado: no ha ocurrido'); },
  recNuevoMov: ([k, i, iso]) => { const rc = recBuscar(k, i); if (!rc) return; openMovForm(null, { tipo: rc.tipo, categoria: rc.nombre, fecha: iso, importe: importePrevisto(rc, iso) }); },
  tRepetirCambio: (_, el) => { verBadge('repetir'); const c = $('#tRepCustom'); if (c) c.innerHTML = el.value === 'custom' ? repCustomHtml(null) : ''; },
  verNovedades: ([t]) => openSheet(novedadesHtml(t === '1')),
  novIr: ([k]) => {
    closeSheet();
    setTimeout(() => {
      if (k === 'inversiones') { S.tab = 'inicio'; S.inicioSub = 'analisis'; S.analisisSub = 'inversiones'; verBadge('inversiones'); render(); window.scrollTo(0, 0); }
      else if (k === 'cobros') H.openRecurrentes([]);
      else if (k === 'importar') H.impAbrir([]);
      else if (k === 'reglas') H.openReglas([]);
      else if (k === 'tareas') { S.tab = 'tareas'; render(); window.scrollTo(0, 0); }
    }, 260);
  },
  setInvPeriodo: ([k]) => { if (PERIODOS_INV.some((x) => x[0] === k)) { S.invPeriodo = k; render(); } },
  setInflacion: ([k]) => { if (INFLACION_DATOS[k]) { saveConfig({ inflacionRegion: k }); render(); } },
  openTabsAn: () => openSheet(tabsAnSheetHtml()),
  toggleTabAn: ([id]) => {
    const sel = tabsAnElegidas(), i = sel.indexOf(id);
    if (i >= 0) sel.splice(i, 1); else sel.push(id);
    saveConfig({ tabsAnalisis: TABS_AN_OPC.map((t) => t[0]).filter((x) => sel.indexOf(x) >= 0) });
    updateSheet(tabsAnSheetHtml()); render();
  },
  setGeneralSub: ([g]) => { S.generalSub = g === 'anual' ? 'anual' : 'mensual'; render(); },
  verActivo: ([nombre]) => { S.movQuery = nombre; S.movFiltroTipo = 'Inversión'; S.movPeriodo = 'todo'; S.movLimit = 120; S.tab = 'movimientos'; render(); window.scrollTo(0, 0); },
  // calendario
  setCalVista: ([v]) => { S.calVista = v; render(); },
  calHoy: () => { S.calFecha = todayISO(); render(); },
  calSelDia: ([iso]) => { S.calFecha = iso; render(); },
  calToggle: ([k]) => { S.calFiltros[k] = !S.calFiltros[k]; render(); },
  calMove: ([dir]) => {
    const n = Number(dir), cur = calAnchor();
    if (S.calVista === 'semana') { S.calFecha = addDaysISO(cur, 7 * n); }
    else {
      const d = parseISO(cur), t = new Date(d.getFullYear(), d.getMonth() + n, 1), hoy = new Date();
      S.calFecha = (t.getFullYear() === hoy.getFullYear() && t.getMonth() === hoy.getMonth()) ? todayISO() : dateISO(t);
    }
    render();
  },
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
  // moneda
  openMoneda: () => openSheet('<div class="handle"></div><h2>Moneda</h2>' +
    '<p style="color:var(--text-faint);font-size:13.5px;line-height:1.5;margin:0 0 12px;">Cambia el símbolo y el formato de todos los importes. <b>No convierte</b> tus datos: un importe de 100 pasará de «100 €» a «100 $». Úsalo si llevas tus cuentas en esa moneda.</p>' +
    '<div class="chips">' + Object.keys(MONEDAS).map((k) => '<button type="button" class="chip ' + (monedaCod() === k ? 'active' : '') + '" ' + act('setMoneda', k) + '>' + k + ' ' + MONEDAS[k].s + '</button>').join('') + '</div>' +
    '<div class="actions"><button class="btn accent block" ' + act('closeSheet') + '>Hecho</button></div>'),
  setMoneda: ([k]) => { if (!MONEDAS[k]) return; saveConfig({ moneda: k }); H.openMoneda(); render(); },
  // 2FA
  openSeguridad: async () => { openSheet('<div class="handle"></div><h2>Verificación en dos pasos</h2><p>Cargando…</p>'); updateSheet(await mfaSheetHtml()); },
  mfaStart: async () => {
    try {
      const api = mfaApi();
      const l = await api.listFactors();
      for (const f of (l.data && l.data.all) || []) { if (f.status !== 'verified') await api.unenroll({ factorId: f.id }); } // limpia intentos abandonados
      const r = await api.enroll({ factorType: 'totp', friendlyName: 'Mis Finanzas ' + Date.now() });
      if (r.error) throw r.error;
      const t = r.data.totp;
      updateSheet('<div class="handle"></div><h2>Escanea el código QR</h2>' +
        '<p style="color:var(--text-faint);font-size:13.5px;line-height:1.5;margin:0 0 10px;">1. Abre tu app autenticadora y añade una cuenta escaneando este QR.<br>2. Escribe aquí el código de 6 cifras que te muestre.</p>' +
        '<div style="text-align:center;margin:8px 0;"><img alt="Código QR" src="' + escapeHtml(t.qr_code) + '" style="width:200px;height:200px;background:#fff;padding:8px;border-radius:8px;"></div>' +
        '<p style="font-size:12px;color:var(--text-faint);text-align:center;word-break:break-all;">¿No puedes escanear? Clave manual: <b>' + escapeHtml(t.secret) + '</b></p>' +
        '<div class="field"><input id="mfaCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" style="text-align:center;letter-spacing:6px;font-size:20px;"></div>' +
        '<div id="mfaMsg" style="color:var(--expense);font-size:13px;min-height:18px;"></div>' +
        '<div class="actions"><button class="btn ghost block" ' + act('closeSheet') + '>Cancelar</button><button class="btn accent block" ' + act('mfaConfirm', r.data.id) + '>Activar</button></div>');
    } catch (e) { toast('No se pudo iniciar. Inténtalo de nuevo.'); }
  },
  mfaConfirm: async ([factorId]) => {
    const code = (($('#mfaCode') || {}).value || '').replace(/\s/g, '');
    const msg = $('#mfaMsg');
    if (!/^\d{6}$/.test(code)) { if (msg) msg.textContent = 'Escribe los 6 dígitos.'; return; }
    try {
      const r = await mfaApi().challengeAndVerify({ factorId, code });
      if (r.error) throw r.error;
      toast('Verificación en dos pasos activada');
      setTimeout(() => window.location.reload(), 900);
    } catch (e) { if (msg) msg.textContent = mfaErrMsg(e); }
  },
  mfaDisable: async ([factorId]) => {
    if (!window.confirm('¿Desactivar la verificación en dos pasos? Tu cuenta quedará protegida solo por la contraseña.')) return;
    try {
      const r = await mfaApi().unenroll({ factorId });
      if (r.error) throw r.error;
      toast('Verificación en dos pasos desactivada');
      setTimeout(() => window.location.reload(), 900);
    } catch (e) { toast('No se pudo desactivar. Cierra sesión, vuelve a entrar con tu código e inténtalo otra vez.'); }
  },
  doMfaVerify: async () => {
    const code = (($('#mfaCode') || {}).value || '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) return renderMfaScreen('Escribe los 6 dígitos.');
    try {
      const api = mfaApi();
      const l = await api.listFactors();
      const f = ((l.data && l.data.totp) || [])[0];
      if (!f) throw new Error('invalid');
      const r = await api.challengeAndVerify({ factorId: f.id, code });
      if (r.error) throw r.error;
      window.location.reload();
    } catch (e) { renderMfaScreen(mfaErrMsg(e)); }
  },
  doMfaCancel: async () => { try { await window.Auth.signOut(); } catch (e) { /* noop */ } renderLoginScreen(); },
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
    if (session && needsMfa(session)) { if (!S.appStarted) renderMfaScreen(); return; }
    if (session) { if (!S.appStarted) enterApp(session); }
    else { leaveApp(); }
  });
}

window.__APP__ = { imp: () => IMP, S, main, render, kpisMes, H, cfg, aplicaEstado, parseNum, parseFechaImp, parseCSV, sugerirCategoria, reglaPara, ocurrencias, aprenderRegla, reglaTexto, siguienteFechaTarea, avisosRecurrentes };
if (!window.__NO_AUTOSTART__) main();
})();

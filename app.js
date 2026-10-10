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
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M15.8 14.2c2.4-.3 4.3 1.2 4.9 4.3"/></svg>',
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
  if (S.db.compartidos) _unsubs.push(S.db.compartidos.suscribir((rows) => {
    S.compartidos = rows;
    // si aparece algo de un grupo o persona que aún no conocemos, se recargan los grupos (una vez por grupo)
    const vistos = S._gruposVistos || (S._gruposVistos = {});
    const nuevos = rows.filter((c) => !grupoDe(c.grupoId) && !vistos[c.grupoId]);
    if (nuevos.length && !S._gruposCargando) {
      nuevos.forEach((c) => { vistos[c.grupoId] = 1; });
      S._gruposCargando = true;
      cargarGrupos().then(() => { S._gruposCargando = false; render(); refrescarSheetCompartido(); });
    }
    render(); refrescarSheetCompartido();
  }, (e) => { console.error(e); S.compartidos = S.compartidos || []; }));
  if (S.db.objetivos) _unsubs.push(S.db.objetivos.suscribir((rows) => { S.objetivos = rows; render(); refrescarSheetCompartido(); }, (e) => { console.error(e); S.objetivos = S.objetivos || []; }));
  _unsubs.push(S.db.doc('config/app').onSnapshot((snap) => {
    S.config = snap.exists ? snap.data() : null; S.loaded.cfg = true; maybeStartOnboarding(); render(); maybeUnirse(); maybeNovedades(); asegurarIdsMetas(); if (S.grupos == null && !S._gruposCargando) { S._gruposCargando = true; cargarGrupos().then(() => { S._gruposCargando = false; }); }
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
  return movsEfectivos().filter((m) => { const d = m.fecha || ''; return d.slice(0, 4) === String(anio) && Number(d.slice(5, 7)) === mes; });
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
  else if (tipo === 'Ahorro') arr = (c.ahorro || []).filter((x) => x && x.nombre && x.tipo !== 'inversion').map((x) => x.nombre);
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

  return kpiMesHtml(k, y, m) +
    '<div class="summary-line" style="margin-bottom:0;">' + MESES[m - 1] + ' ' + y + ' · toca una cifra para ver sus movimientos</div>' +

    avisosRecHtml() +

    ((vencidas.length || excedidas.length) ? '<div class="section-title">Avisos</div>' +
      (vencidas.length ? '<div class="alert tappable" ' + act('goTab', 'tareas') + '>' + ic('alert') + '<div><b>' + vencidas.length + (vencidas.length > 1 ? ' tareas vencidas' : ' tarea vencida') + '</b>Míralas en la pestaña Tareas.</div></div>' : '') +
      excedidas.map((c) => '<div class="alert warn tappable" ' + act('irMovs', '_gastos', mesClave(y, m), c.categoria) + '>' + ic('alert') + '<div><b>' + escapeHtml(c.categoria) + ' por encima del presupuesto</b>' + money(c.real) + ' de ' + money(c.presupuesto) + ' este mes.</div></div>').join('') : '') +

    '<div class="section-title">Próximas tareas <button class="link" ' + act('goTab', 'tareas') + '>Ver todas</button></div>' +
    (proximas.length ? '<div class="list">' + proximas.map(renderTareaRow).join('') + '</div>'
      : '<div class="card" style="text-align:center;color:var(--text-faint);font-size:13.5px;">No tienes tareas pendientes.</div>') +

    (tabAnVisible('metas') ? renderMetasInicio() : '') +
    patrimonioHtml() +
    compartidoInicioHtml() +

    '<div class="section-title">Donde más gastas este mes <button class="link" ' + act('goTab', 'analisis') + '>Ver análisis</button></div>' +
    '<div class="card">' + (top.length ? top.map(([n, v]) =>
      '<div class="budget-row tappable" ' + act('irMovs', '_gastos', mesClave(y, m), n) + '><div class="top"><span class="cat">' + escapeHtml(n) + '</span><span class="nums"><b class="tnum">' + money(v) + '</b></span></div>' +
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
  if (/^m:\d{4}-\d{2}$/.test(p)) return (m.fecha || '').slice(0, 7) === p.slice(2);
  if (/^y:\d{4}$/.test(p)) return (m.fecha || '').slice(0, 4) === p.slice(2);
  return true;
}
const GRUPOS_TIPO = { _gastos: ['Gasto', 'Factura'], _ahorro: ['Ahorro', 'Inversión'] };
const GRUPOS_TXT = { _gastos: 'Gastos y facturas', _ahorro: 'Ahorro e inversión' };
function periodoTxt(p) {
  if (/^m:/.test(p)) { const [y, m] = p.slice(2).split('-').map(Number); return MESES[m - 1] + ' ' + y; }
  if (/^y:/.test(p)) return 'Año ' + p.slice(2);
  return '';
}
// Atajo: abre Movimientos con un filtro (tipo o grupo, periodo y categoría) y recuerda de dónde vienes para poder volver
function irMovs(o) {
  S.volverA = { tab: S.tab, inicioSub: S.inicioSub, analisisSub: S.analisisSub, generalSub: S.generalSub, label: S.tab === 'inicio' ? (S.inicioSub === 'analisis' ? 'Análisis' : 'Inicio') : 'atrás' };
  S.tab = 'movimientos';
  S.movFiltroTipo = o.tipo || 'Todos';
  S.movPeriodo = o.periodo || 'todo';
  S.movCat = o.cat || '';
  S.movQuery = '';
  S.movLimit = 120;
  render(); window.scrollTo(0, 0);
}
const mesClave = (y, m) => 'm:' + y + '-' + pad2(m);
function movsFiltrados() {
  let movs = movsEfectivos().filter(inPeriodo);
  if (GRUPOS_TIPO[S.movFiltroTipo]) movs = movs.filter((m) => GRUPOS_TIPO[S.movFiltroTipo].includes(m.tipo));
  else if (S.movFiltroTipo !== 'Todos') movs = movs.filter((m) => m.tipo === S.movFiltroTipo);
  if (S.movCat) movs = movs.filter((m) => normName(m.categoria) === normName(S.movCat));
  const q = S.movQuery.trim().toLowerCase();
  if (q) movs = movs.filter((m) => [m.categoria, m.descripcion, m.metodoPago].some((x) => (x || '').toLowerCase().includes(q)));
  return movs.sort(cmpMov);
}
function renderMovimientos() {
  const periodos = [['todo', 'Todo'], ['mes', 'Este mes'], ['anterior', 'Mes anterior'], ['anio', 'Este año']];
  return '<div style="display:flex;justify-content:flex-end;flex-wrap:wrap;gap:6px 16px;margin:-4px 0 6px;">' + (ticketsDisponible() ? '<button class="link" ' + act('ticketFoto') + '>' + ic('camera') + ' Foto de ticket' + badge('ticket') + '</button>' : '') + '<button class="link" ' + act('impAbrir') + '>' + ic('download') + ' Importar extracto o Excel' + badge('importar') + '</button></div>' +
    (S.volverA ? '<button class="link volver" ' + act('volver') + '>' + ic('chevL') + ' Volver a ' + escapeHtml(S.volverA.label) + '</button>' : '') +
    ((S.movCat || GRUPOS_TIPO[S.movFiltroTipo] || periodoTxt(S.movPeriodo)) ? '<div class="filtros-activos">' +
      (GRUPOS_TIPO[S.movFiltroTipo] ? '<button class="chip active" ' + act('setMovFiltro', 'Todos') + '>' + GRUPOS_TXT[S.movFiltroTipo] + ' ✕</button>' : '') +
      (periodoTxt(S.movPeriodo) ? '<button class="chip active" ' + act('setMovPeriodo', 'todo') + '>' + periodoTxt(S.movPeriodo) + ' ✕</button>' : '') +
      (S.movCat ? '<button class="chip active" ' + act('quitarMovCat') + '>' + escapeHtml(S.movCat) + ' ✕</button>' : '') + '</div>' : '') +
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
  const eff = effect(m.importe, m.tipo), c = m.comp;
  return '<div class="row" ' + act('openMovForm', m.id) + '>' +
    '<span class="dot" style="background:var(--' + (TIPO_COLOR[m.tipo] || 'debt') + ')"></span>' +
    '<div class="main"><div class="ttl">' + escapeHtml(m.categoria || 'Sin categoría') + (c ? '<span class="comp-tag" title="Compartido">' + ic('users') + '</span>' : '') + '</div>' +
    '<div class="meta">' + (m.descripcion ? escapeHtml(m.descripcion) + ' · ' : '') + (c ? escapeHtml(compQuienTxt(c)) : escapeHtml(m.tipo) + (m.metodoPago ? ' · ' + escapeHtml(m.metodoPago) : '')) + '</div></div>' +
    '<div class="amt tnum ' + (eff >= 0 ? 'pos' : 'neg') + '">' + moneySigned(m.importe, m.tipo) + (c ? '<div class="amt-sub">tu parte de ' + money(c.importe) + '</div>' : '') + '</div></div>';
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
  return invFieldsBaseHtml(tipo, actual) + metaInvSelectorHtml();
}
function invFieldsBaseHtml(tipo, actual) {
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
  if (id && String(id).indexOf('c:') === 0) return openCompForm(String(id).slice(2));
  const mio = id ? S.movimientos.find((m) => m.id === id) : null;
  const comp = pre && pre.compId ? compPorId(pre.compId) : null;
  if (mio && mio.compartidoId && !comp && compPorId(mio.compartidoId)) return openCompForm(mio.compartidoId);
  // En un gasto compartido se ve el compartido (el total); tu movimiento enlazado se actualiza al guardar.
  const ex = comp ? Object.assign({}, mio || {}, { id: mio ? mio.id : null, tipo: comp.tipo, importe: comp.importe, categoria: comp.categoria, fecha: comp.fecha, descripcion: comp.descripcion }) : mio;
  const compDest = pre && pre.comp, objPre = pre && pre.objetivo;
  pre = (!ex && pre) || {};
  const tipoIni = ex ? ex.tipo : pre.tipo ? pre.tipo : (S.tab === 'movimientos' && S.movFiltroTipo !== 'Todos' ? S.movFiltroTipo : 'Gasto');
  FORM = { kind: 'mov', id: mio ? mio.id : null, tipo: tipoIni, tipoActivoIni: ex ? ex.tipoActivo : '', compId: comp ? comp.id : null, comp: comp ? compFormDesde(comp) : { on: false } };
  if (compDest) { FORM.comp = { on: true, objetivo: objPre || null }; compPrepararDestino(compDest); }
  FORM.invModo = (ex && ex.tipo === 'Inversión' && !ex.activoId) ? 'manual' : 'auto';
  FORM.metaId = ex && ex.metaId ? ex.metaId : null;
  if (ex && ex.activoId) { FORM.activo = { activo_id: ex.activoId, nombre: ex.categoria, tipo: ex.tipoActivo || '', simbolo: '', moneda: '' }; FORM.partOrig = ex.participaciones == null ? null : Number(ex.participaciones); }
  const metodos = cfg().metodosPago || [];
  openSheet(
    '<div class="handle"></div><h2>' + (comp ? 'Gasto compartido' : ex ? 'Editar movimiento' : 'Nuevo movimiento') + '</h2>' +
    (!ex && !compDest && ticketsDisponible() ? '<button type="button" class="comp-toggle tk-btn" ' + act('ticketFoto') + '>' + ic('camera') + '<span>Leer un ticket con una foto</span>' + badge('ticket') + '</button>' : '') +
    '<div class="field"><label>Tipo</label><div class="type-toggle" id="tipoToggle">' +
    TIPOS.map((t) => '<button type="button" data-t="' + t + '" class="' + (t === tipoIni ? 'active' : '') + '" ' + act('pickTipo', t) + '>' + t + '</button>').join('') + '</div></div>' +
    '<div class="field"><label>Importe (' + sym() + ') <span class="hint">· en negativo si es una devolución</span></label><input id="fImporte" type="number" step="0.01" inputmode="decimal" placeholder="0,00" value="' + (ex ? ex.importe : (pre.importe != null ? pre.importe : '')) + '" ' + onInput('onImporteInput') + '></div>' +
    '<div id="invFields">' + invFieldsHtml(tipoIni, ex ? ex.tipoActivo : '') + '</div>' +
    '<div class="field" id="catField"><label id="catLabel">' + catLabel(tipoIni) + '</label><div id="catChips">' + chipsHtml(tipoIni, ex ? ex.categoria : (pre.categoria || '')) + '</div>' +
    '<input id="fCategoria" type="text" placeholder="…o escribe otra" value="' + escapeHtml(ex ? ex.categoria : (pre.categoria || '')) + '" ' + onInput('onCatInput') + '></div>' +
    '<div class="field"><label>Fecha</label><input id="fFecha" type="date" value="' + (ex ? ex.fecha : (pre.fecha || todayISO())) + '" ' + onChange('onFechaChange') + '></div>' +
    '<div class="field"><label>Descripción <span class="hint">· opcional</span></label><input id="fDesc" type="text" placeholder="Nota rápida (p. ej. Mercadona)" value="' + escapeHtml(ex ? ex.descripcion : (pre.descripcion || '')) + '" ' + onInput('onDescInput') + '><div id="reglaBox"></div></div>' +
    '<div class="field"><label>Método de pago <span class="hint">· opcional</span></label><select id="fMetodo"><option value="">—</option>' +
    metodos.map((mm) => '<option ' + (ex && ex.metodoPago === mm ? 'selected' : '') + '>' + escapeHtml(mm) + '</option>').join('') + '</select></div>' +
    '<div id="artField">' + artFieldHtml(comp || ex) + '</div>' +
    '<div class="field" id="compField">' + compFieldHtml() + '</div>' +
    '<div class="actions"><button class="btn ghost block" ' + (S._volverGrupo ? act('grupoVer', S._volverGrupo) : act('closeSheet')) + '>Cancelar</button><button class="btn accent block" ' + act('saveMov') + '>Guardar</button></div>' +
    (comp ? '<button class="btn danger block" style="margin-top:10px;" ' + act('deleteComp') + '>' + ic('trash') + ' Eliminar gasto compartido</button>'
      : ex ? '<button class="btn danger block" style="margin-top:10px;" ' + act('deleteMov') + '>' + ic('trash') + ' Eliminar movimiento</button>' : '')
  );
  syncCatField();
  if (FORM.activo && FORM.activo.activo_id) cargarPreview();
  if (!ex) setTimeout(() => { const el = $('#fImporte'); if (el) el.focus(); }, 80);
}
async function saveMov() {
  if (FORM.guardando) return;
  const obSel = FORM.comp && FORM.comp.on && TIPO_OBJ[FORM.tipo] && FORM.comp.objetivo ? objPorId(FORM.comp.objetivo) : null;
  if (obSel && obSel.tipo === TIPO_OBJ[FORM.tipo] && FORM.comp.dest === 'g:' + obSel.grupoId) { const c = $('#fCategoria'); if (c) c.value = obSel.nombre; }
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
  if (FORM.comp && FORM.comp.on && TIPOS_COMPARTIBLES.indexOf(FORM.tipo) >= 0 && compartidosDisponible()) return saveCompartido({ importe, fecha, categoria, descripcion: $('#fDesc').value.trim(), metodoPago: $('#fMetodo').value });
  if (FORM.compId && !(await quitarCompartido())) return;
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
    if (FORM.articulos) data.articulos = FORM.articulos;
    if (FORM.compQuitado && 'compartidoId' in data) data.compartidoId = null; // ya no está compartido: cuenta entero como tuyo
    if (FORM.tipo === 'Inversión') data.tipoActivo = tipoActivo; else if ('tipoActivo' in data) data.tipoActivo = null;
    if (auto) { data.activoId = activoId; data.participaciones = participaciones; }
    else {
      if ('activoId' in data && FORM.tipo !== 'Inversión') data.activoId = null;
      if ('participaciones' in data && FORM.tipo !== 'Inversión') data.participaciones = null;
    }
    // meta: inversión → la elegida (o General); ahorro → la meta de ahorro con ese nombre
    if (FORM.tipo === 'Inversión') data.metaId = FORM.metaId && metasCfg().some((m) => m.id === FORM.metaId) ? FORM.metaId : null;
    else if (FORM.tipo === 'Ahorro') { const mt = metasCfg().find((m) => tipoMeta(m) === 'ahorro' && m.id && normName(m.nombre) === normName(categoria)); data.metaId = mt ? mt.id : null; }
    else if ('metaId' in data) data.metaId = null;
    const reglaNueva = FORM.recordar && FORM.tipo !== 'Inversión' ? ((($('#fReglaTexto') || {}).value || '').trim()) : '';
    const ok = await write(() => FORM.id ? S.db.collection('movimientos').doc(FORM.id).set(data) : S.db.collection('movimientos').add(data));
    if (ok) {
      if (reglaNueva && guardarRegla(reglaNueva, categoria, FORM.tipo)) toast('Guardado. Regla creada: «' + normDesc(reglaNueva) + '» → ' + categoria);
      else toast(FORM.compQuitado ? 'Ya no está compartido: cuenta entero como tuyo' : FORM.id ? 'Movimiento actualizado' : 'Movimiento añadido');
      terminarForm();
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
    kpiMesHtml(k, S.anioSel, S.mesSel) +

    '<div class="section-title">Reparto del gasto</div><div class="card">' +
    (hayGasto ? '<div class="chart-wrap" id="donutWrap"></div><div class="legend" id="donutLegend"></div>'
      : '<div style="text-align:center;color:var(--text-faint);font-size:13.5px;">Sin gastos registrados en ' + MESES[S.mesSel - 1].toLowerCase() + '.</div>') + '</div>' +

    '<div class="section-title">Presupuesto por categoría</div><div class="card">' +
    (filas.length ? '<div class="summary-line" style="margin-top:0;">Gastado ' + money(totReal) + (totPres ? ' de ' + money(totPres) + ' presupuestados' : '') + '</div>' +
      filas.map((c) => {
        const real = catMap[c.nombre] || 0, pres = num(c.presupuesto);
        const over = pres > 0 && real > pres;
        const pct = pres > 0 ? real / pres * 100 : (real > 0 ? 100 : 0);
        return '<div class="budget-row tappable ' + (over ? 'over' : '') + '" ' + act('irMovs', '_gastos', mesClave(S.anioSel, S.mesSel), c.nombre) + '><div class="top"><span class="cat">' + escapeHtml(c.nombre) + '</span>' +
          '<span class="nums"><b class="tnum">' + money(real) + '</b>' + (pres > 0 ? ' / ' + money(pres) : '') + '</span></div>' +
          '<div class="progress ' + (over ? 'over' : '') + '"><div style="width:' + Math.max(0, Math.min(100, pct)) + '%"></div></div></div>';
      }).join('')
      : '<div style="color:var(--text-faint);font-size:13.5px;">Añade categorías en Más → Categorías de gasto.</div>') + '</div>' +
    articulosTopHtml(k.movs);
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
    '<div class="kpi income tappable" ' + act('irMovs', 'Ingreso', 'y:' + S.anioSel) + '><div class="v tnum">' + moneyShort(totIng) + '</div><div class="l">Ingresos</div></div>' +
    '<div class="kpi expense tappable" ' + act('irMovs', '_gastos', 'y:' + S.anioSel) + '><div class="v tnum">' + moneyShort(totGas) + '</div><div class="l">Gastos</div></div>' +
    '<div class="kpi avail tappable" ' + act('irMovs', '_ahorro', 'y:' + S.anioSel) + '><div class="v tnum">' + tasa.toFixed(0) + '%</div><div class="l">Tasa de ahorro</div></div></div>' +
    '<div class="section-title">Ingresos y gastos por mes</div><div class="card"><div class="chart-wrap" id="trendWrap"></div>' +
    '<div class="legend"><span><i style="background:var(--income)"></i>Ingresos</span><span><i style="background:var(--expense)"></i>Gastos</span></div></div>' +
    '<div class="section-title">Detalle</div><div class="list">' +
    rows.map((r) => '<div class="row" ' + act('verMes', S.anioSel, r.m) + '><div class="main"><div class="ttl">' + MESES[r.m - 1] + '</div></div>' +
      '<div class="amt pos tnum" style="min-width:88px;text-align:right;">' + moneyShort(r.ingresos) + '</div>' +
      '<div class="amt neg tnum" style="min-width:88px;text-align:right;">' + moneyShort(r.facturas + r.gastos) + '</div><span class="chev-s">' + ic('chevR') + '</span></div>').join('') + '</div>' +
    '<div class="summary-line">Toca un mes para ver su detalle.</div>';
}
/* ============================================================
   METAS DE AHORRO (Fase 2): cálculos + vista
   ============================================================ */
const META_UMBRAL_AMARILLO = 0.7; // ritmo real / ritmo necesario
function isoDaysAgo(n) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function fmtMesAnio(d) { return MESES_ABR[d.getMonth()].toLowerCase() + ' ' + d.getFullYear(); }
function metaStats(m) {
  const movs = movsDeMeta(m);
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
function metasStats() { return metasCfg().map((m) => (tipoMeta(m) === 'inversion' ? metaInvStats(m) : Object.assign(metaStats(m), { id: m.id }))); }
const SEMAFORO_COLOR = { verde: 'var(--income)', amarillo: 'var(--accent)', rojo: 'var(--expense)', gris: 'var(--text-faint)' };
function semaforoDot(estado) { return '<span class="dot" style="background:' + SEMAFORO_COLOR[estado] + ';flex:none;"></span>'; }
function renderMetas() {
  const ms = metasStats();
  if (ms.some((r) => r.inv)) asegurarValoracion();
  const cab = '<div style="display:flex;justify-content:flex-end;gap:16px;margin:-4px 0 8px;">' + (compartidosDisponible() ? '<button class="link" ' + act('objNueva', 'ahorro') + '>' + ic('plus') + ' Meta compartida' + badge('compartir') + '</button>' : '') + '<button class="link" ' + act('openMetas') + '>Gestionar metas</button></div>';
  if (!ms.length) return cab + (objCompartidos('ahorro').length ? objCardsHtml('ahorro') : '<div class="card" style="text-align:center;color:var(--text-faint);font-size:13.5px;">Todavía no tienes metas. Créalas en Más → Metas: de ahorro o de inversión (por ejemplo, la entrada de una casa).</div>');
  const generalInv = S.movimientos.filter((x) => x.tipo === 'Inversión' && !(x.metaId && ms.some((r) => r.inv && r.id === x.metaId)));
  const valGeneral = generalInv.reduce((a, x) => { const v = valorMovInv(x); return a + (v == null ? num(x.importe) : v); }, 0);
  return cab + ms.map((r) => {
    if (r.inv) return metaInvCardHtml(r);
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
    return h + '<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn sm ghost" ' + act('irMovs', 'Ahorro', 'todo', r.nombre) + '>Ver movimientos</button><button class="btn sm ghost" ' + act('metaEditar', r.id || '') + '>Editar meta</button></div></div>';
  }).join('') + objCardsHtml('ahorro') + (ms.some((r) => r.inv) && generalInv.length ? '<div class="summary-line">Inversiones sin meta («General»): ' + money(valGeneral) + ' de valor actual.</div>' : '') +
    '<div class="summary-line">Metas de ahorro: suman tus movimientos de tipo Ahorro de esa meta, más lo que indiques en «Ya ahorrado antes». Metas de inversión: valor actual de las aportaciones que les asignes.</div>';
}
function deudaStats(d) {
  const key = (d.nombre || '').trim().toLowerCase();
  const movs = movsPersonales().filter((x) => x.tipo === 'Deuda' && (x.categoria || '').trim().toLowerCase() === key);
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
function renderDeudasPersonales() {
  const ds = (cfg().deudas || []).filter((d) => d && d.nombre).map(deudaStats);
  if (!ds.length) return '<div class="card" style="text-align:center;color:var(--text-faint);font-size:13.5px;">Todavía no tienes deudas. Créalas en Más → Deudas (con el total y, si quieres, una fecha objetivo).</div>';
  const tot = ds.reduce((a, r) => a + r.total, 0), pag = ds.reduce((a, r) => a + Math.min(r.pagado, r.total), 0), pen = ds.reduce((a, r) => a + r.pend, 0);
  return '<div class="kpi-row"><div class="kpi expense"><div class="v tnum">' + moneyShort(pen) + '</div><div class="l">Pendiente</div></div>' +
    '<div class="kpi income tappable" ' + act('irMovs', 'Deuda', 'todo') + '><div class="v tnum">' + moneyShort(pag) + '</div><div class="l">Pagado</div></div>' +
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
      return h + '<div style="margin-top:8px;"><button class="btn sm ghost" ' + act('irMovs', 'Deuda', 'todo', r.nombre) + '>Ver pagos</button></div></div>';
    }).join('') + '<div class="summary-line">Lo pagado sale de tus movimientos de tipo Deuda con el nombre de cada deuda. Esta versión no calcula intereses.</div>';
}
function renderMetasInicio() {
  const ms = metasStats().concat(objCompartidos('ahorro')).filter((r) => r.obj > 0);
  if (!ms.length) return '';
  const cnt = { verde: 0, amarillo: 0, rojo: 0, gris: 0 }; ms.forEach((r) => { cnt[r.estado]++; });
  const sum = ['verde', 'amarillo', 'rojo'].filter((e) => cnt[e]).map((e) => '<span style="display:inline-flex;align-items:center;gap:5px;margin-right:12px;">' + semaforoDot(e) + cnt[e] + '</span>').join('');
  return '<div class="section-title">Metas <button class="link" ' + act('goMetas') + '>Ver metas</button></div><div class="card">' +
    ms.slice(0, 3).map((r) => '<div class="budget-row tappable" ' + act('goMetas') + '><div class="top"><span class="cat" style="display:flex;align-items:center;gap:8px;">' + semaforoDot(r.estado) + escapeHtml(r.nombre) + '</span>' +
      '<span class="nums"><b class="tnum">' + (r.pct == null ? '—' : r.pct.toFixed(0) + '%') + '</b></span></div>' +
      '<div class="progress"><div style="width:' + Math.max(0, Math.min(100, r.pct || 0)) + '%;background:' + SEMAFORO_COLOR[r.estado] + ';"></div></div></div>').join('') +
    (ms.length > 1 ? '<div class="summary-line">' + sum + '</div>' : '') + '</div>';
}
/* ============================================================
   GRUPOS PARA COMPARTIR (Bloque 8.1): crear, invitar por WhatsApp, unirse, salir
   Las reglas de la base de datos deciden qué ve cada uno; aquí solo se muestra.
   ============================================================ */
const APP_URL = 'https://urlife-zeta.vercel.app/';
function gruposDisponible() { return !!(S.db && S.db.grupos && S.db.rpc); }
function miUid() { return (S.user && S.user.id) || (S.db && S.db.uid && S.db.uid()) || null; }
function nombreSugerido() {
  const e = ((S.user && S.user.email) || '').split('@')[0].replace(/[._\-]+/g, ' ').replace(/\d+/g, '').trim().split(' ')[0] || 'Yo';
  return e.charAt(0).toUpperCase() + e.slice(1);
}
const ERR_GRUPO = { no_autorizado: 'No tienes permiso para esto.', invitacion_no_valida: 'Ese enlace ya no es válido (caducado o ya usado). Pide uno nuevo.', grupo_completo: 'Este grupo ya está completo.',
  demasiadas_invitaciones: 'Hay demasiados enlaces pendientes. Anula alguno.', demasiados_grupos: 'Has creado muchos grupos hoy. Prueba mañana.', usa_salir: 'Para irte tú, usa «Salir del grupo».', sin_sesion: 'Tienes que iniciar sesión.',
  saldo_pendiente: 'Hay cuentas pendientes. Saldadlas antes (botón «Saldar»).', reparto_no_cuadra: 'El reparto no suma el total.', reparto_no_valido: 'Revisa el reparto: solo puede incluir a miembros.', pagador_no_valido: 'Quien pagó tiene que ser del grupo.', compartido_borrado: 'Ese gasto ya se había eliminado.', objetivo_no_valido: 'Elige una meta o deuda de ese grupo.', objetivo_borrado: 'Esa meta o deuda ya se había eliminado.' };
function errGrupo(e) { const m = String((e && (e.message || (e.original && e.original.message))) || ''); const k = Object.keys(ERR_GRUPO).find((x) => m.indexOf(x) >= 0); return k ? ERR_GRUPO[k] : 'No se pudo completar. Revisa tu conexión.'; }
async function cargarGrupos() {
  if (!gruposDisponible()) return;
  try {
    const r = await S.db.grupos.listar(), yo = miUid();
    S.grupos = r.grupos.filter((g) => !g.cerrado).map((g) => {
      const ms = r.miembros.filter((m) => m.grupo_id === g.id);
      const activos = ms.filter((m) => !m.baja);
      const mio = activos.find((m) => m.user_id === yo);
      return { id: g.id, nombre: g.nombre, tipo: g.tipo, reparto: g.reparto, miembros: activos.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')), todos: ms, soyAdmin: !!(mio && mio.rol === 'admin'), miNombre: mio ? mio.nombre : '' };
    }).sort((a, b) => a.nombre.localeCompare(b.nombre));
  } catch (e) { console.error(e); S.grupos = S.grupos || []; }
}
function iniciales(n) { return String(n || '?').trim().split(/\s+/).map((x) => x.charAt(0)).join('').slice(0, 2).toUpperCase(); }
const COLORES_PERSONA = ['#B8752A', '#2F6F52', '#7A5AA8', '#A8452F', '#3B6EA8', '#8A6D1F'];
function avatarHtml(m, i) { return '<span class="avatar" style="background:' + COLORES_PERSONA[i % COLORES_PERSONA.length] + '" title="' + escapeHtml(m.nombre) + '">' + escapeHtml(iniciales(m.nombre)) + '</span>'; }
function gruposListaHtml() {
  const gs = (S.grupos || []).filter((g) => g.tipo === 'grupo');
  const ps = (S.grupos || []).filter((g) => g.tipo === 'directo');
  const saldoMeta = (g) => ((S.compartidos || []).some((c) => c.grupoId === g.id) ? ' · <span style="color:' + saldoColor(miSaldo(g.id)) + '">' + saldoTxt(miSaldo(g.id)) + '</span>' : '');
  return '<div class="handle"></div><h2>Grupos y personas</h2>' +
    '<div style="font-size:13px;color:var(--text-muted);line-height:1.45;margin:-6px 0 10px;">Para compartir gastos, metas y deudas con otras personas (por ejemplo, «Casa» o «Viaje»). Lo tuyo sigue siendo privado: solo se ve lo que compartas en cada grupo.</div>' +
    (S.grupos == null ? '<div class="card" style="color:var(--text-faint);font-size:13.5px;">Cargando…</div>'
      : '<div class="section-title">Grupos</div>' + (gs.length ? '<div class="list">' + gs.map((g) => '<div class="row" ' + act('grupoVer', g.id) + '><div class="avatars">' + g.miembros.slice(0, 4).map(avatarHtml).join('') + '</div>' +
        '<div class="main"><div class="ttl">' + escapeHtml(g.nombre) + '</div><div class="meta">' + g.miembros.map((m) => escapeHtml(m.nombre)).join(', ') + saldoMeta(g) + '</div></div><span class="chev-s">' + ic('chevR') + '</span></div>').join('') + '</div>'
        : '<div class="card" style="color:var(--text-faint);font-size:13.5px;">Aún no estás en ningún grupo. Crea uno e invita por WhatsApp.</div>') +
      '<div class="section-title">Personas</div>' + (ps.length ? '<div class="list">' + ps.map((g) => { const o = otroDe(g); return '<div class="row" ' + act('grupoVer', g.id) + '>' + (o ? avatarHtml(o, 2) : '<span class="avatar" style="background:var(--text-faint)">…</span>') +
        '<div class="main"><div class="ttl">' + escapeHtml(o ? o.nombre : 'Invitación pendiente') + '</div><div class="meta">' + (o ? 'Sin grupo' + saldoMeta(g) : 'Esperando a que la acepte') + '</div></div><span class="chev-s">' + ic('chevR') + '</span></div>'; }).join('') + '</div>'
        : '<div class="card" style="color:var(--text-faint);font-size:13.5px;">Para compartir gastos con alguien sin crear un grupo. Con quien ya esté en tus grupos puedes compartir directamente al apuntar un gasto.</div>')) +
    '<div class="actions"><button class="btn ghost block" ' + act('grupoNuevo') + '>' + ic('plus') + ' Crear grupo</button><button class="btn ghost block" ' + act('personaNueva') + '>' + ic('plus') + ' Invitar a una persona</button></div>' +
    '<div class="actions" style="margin-top:8px;"><button class="btn accent block" ' + act('closeSheet') + '>Listo</button></div>';
}
function grupoNuevoHtml() {
  return '<div class="handle"></div><h2>Nuevo grupo</h2>' +
    '<div class="field"><label>Nombre del grupo</label><input id="gNombre" type="text" maxlength="60" placeholder="Casa"></div>' +
    '<div class="field"><label>Tu nombre en el grupo</label><input id="gMiNombre" type="text" maxlength="40" value="' + escapeHtml(nombreSugerido()) + '"><div class="rec-hint">Es como te verán los demás.</div></div>' +
    '<div class="actions"><button class="btn ghost block" ' + act('openGrupos') + '>Cancelar</button><button class="btn accent block" ' + act('grupoCrear') + '>Crear</button></div>';
}
function grupoHtml(id) {
  const g = (S.grupos || []).find((x) => x.id === id);
  if (!g) return '<div class="handle"></div><h2>Grupo</h2><div class="card" style="color:var(--text-faint);">Este grupo ya no está disponible.</div><div class="actions"><button class="btn accent block" ' + act('openGrupos') + '>Volver</button></div>';
  const yo = miUid(), inv = (FORM && FORM.invitaciones) || [];
  const pendientes = inv.filter((x) => !x.usada_en && new Date(x.expira) > new Date());
  if (g.tipo === 'directo') return personaHtml(g);
  return '<div class="handle"></div><h2>' + escapeHtml(g.nombre) + '</h2>' +
    (g.miembros.length >= 2 ? cuentasGrupoHtml(g) + objetivosGrupoHtml(g) : '') +
    (g.soyAdmin ? '<div class="field" style="margin-top:14px;"><label>Nombre del grupo</label><div style="display:flex;gap:8px;"><input id="gRenombrar" type="text" maxlength="60" value="' + escapeHtml(g.nombre) + '"><button class="btn sm ghost" ' + act('grupoRenombrar', g.id) + '>Guardar</button></div></div>' : '') +
    '<div class="section-title">Miembros (' + g.miembros.length + ')</div><div class="list">' +
    g.miembros.map((m, i) => '<div class="row static">' + avatarHtml(m, i) + '<div class="main"><div class="ttl">' + escapeHtml(m.nombre) + (m.user_id === yo ? ' <span class="hint">(tú)</span>' : '') + '</div><div class="meta">' + (m.rol === 'admin' ? 'Administrador' : 'Miembro') + '</div></div>' +
      (g.soyAdmin && m.user_id !== yo ? '<button class="btn sm ghost" ' + act('grupoQuitar', g.id, m.user_id) + '>Quitar</button>' : '') + '</div>').join('') + '</div>' +
    (g.miembros.length >= 2 ? repartoHabitualHtml(g) : '') +
    '<div class="field" style="margin-top:12px;"><label>Tu nombre en este grupo</label><div style="display:flex;gap:8px;"><input id="gMiNombreEd" type="text" maxlength="40" value="' + escapeHtml(g.miNombre) + '"><button class="btn sm ghost" ' + act('grupoMiNombre', g.id) + '>Guardar</button></div></div>' +
    '<div class="section-title">Invitar</div><div class="card">' +
    '<div style="font-size:13px;color:var(--text-muted);line-height:1.45;margin-bottom:10px;">Se crea un enlace que vale para <b>una persona</b> y caduca en <b>7 días</b>. Al abrirlo, se une con la cuenta con la que esté (o con la que inicie sesión).</div>' +
    (FORM && FORM.ultimoEnlace
      ? '<a class="btn accent block wa-btn" href="https://wa.me/?text=' + encodeURIComponent(FORM.ultimoMsg || FORM.ultimoEnlace) + '" target="_blank" rel="noopener">Enviar por WhatsApp</a>' +
        '<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn ghost block" ' + act('grupoCopiar') + '>Copiar enlace</button>' + (navigator.share ? '<button class="btn ghost block" ' + act('grupoCompartir') + '>Compartir…</button>' : '') + '</div>' +
        '<div class="enlace-box">' + escapeHtml(FORM.ultimoEnlace) + '</div>' +
        '<button type="button" class="link" style="margin-top:8px;" ' + act('grupoInvitar', g.id) + '>Crear otro enlace (para otra persona)</button>'
      : '<button class="btn accent block" ' + act('grupoInvitar', g.id) + '>Crear enlace de invitación</button>') +
    (pendientes.length ? '<div class="rec-hint" style="margin-top:10px;">' + pendientes.length + (pendientes.length === 1 ? ' enlace pendiente' : ' enlaces pendientes') + ' · <button type="button" class="link" ' + act('grupoAnularTodos', g.id) + '>Anularlos</button></div>' : '') + '</div>' +
    '<div class="actions"><button class="btn ghost block" ' + act('openGrupos') + '>Volver</button></div>' +
    '<button class="btn danger block" style="margin-top:10px;" ' + act('grupoSalir', g.id) + '>Salir del grupo</button>' +
    (g.soyAdmin && g.miembros.length > 1 ? '<button class="btn danger block" style="margin-top:8px;" ' + act('grupoCerrar', g.id) + '>Cerrar el grupo para todos</button>' : '');
}
async function abrirGrupo(id) {
  FORM = { kind: 'grupo', id, invitaciones: [] };
  if ($('#sheetBackdrop')) updateSheet(grupoHtml(id)); else openSheet(grupoHtml(id));
  try { FORM.invitaciones = await S.db.grupos.invitaciones(id); if (FORM.kind === 'grupo' && FORM.id === id) updateSheet(grupoHtml(id)); } catch (e) { /* sin lista de enlaces */ }
}
async function accionGrupo(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); await cargarGrupos(); return r == null || r === '' ? true : r; }
  catch (e) { console.error(e); toast(errGrupo(e)); return null; }
}
/* ---- unirse con un enlace ?unirse=TOKEN (con la sesión abierta o con la que se inicie) ---- */
function capturarEnlaceUnirse() {
  try {
    const u = new URL(window.location.href), t = u.searchParams.get('unirse');
    if (t && /^[A-Za-z0-9_-]{16,64}$/.test(t)) { lsSet('unirse', t); u.searchParams.delete('unirse'); window.history.replaceState(null, '', u.pathname + (u.search || '') + u.hash); }
  } catch (e) { /* sin URL */ }
}
async function maybeUnirse() {
  const t = lsGet('unirse');
  if (!t || S._uniendo || S.onboarding || !allLoaded() || !gruposDisponible()) return;
  S._uniendo = true;
  let info = null;
  try { info = await S.db.rpc('ver_invitacion', { p_token: t }); } catch (e) { console.error(e); S._uniendo = false; return; }
  FORM = { kind: 'unirse', token: t, info };
  openSheet(unirseHtml());
}
function unirseHtml() {
  const i = FORM.info || {};
  const email = (S.user && S.user.email) || '';
  if (!i.valida) {
    const txt = i.motivo === 'ya_miembro' ? 'Ya eres miembro de «' + escapeHtml(i.nombre || '') + '».' : i.motivo === 'caducada' ? 'Este enlace ha caducado. Pide uno nuevo a quien te invitó.' : i.motivo === 'usada' ? 'Este enlace ya se ha usado. Cada enlace vale para una persona: pide uno nuevo.' : 'Este enlace no es válido.';
    return '<div class="handle"></div><h2>Invitación</h2><div class="card" style="font-size:14px;line-height:1.5;">' + txt + '</div>' +
      '<div class="actions"><button class="btn accent block" ' + act('unirseCerrar', i.motivo === 'ya_miembro' ? i.grupo || '' : '') + '>Entendido</button></div>';
  }
  const dir = i.tipo === 'directo';
  return '<div class="handle"></div><h2>' + (dir ? 'Te invitan a compartir gastos' : 'Te han invitado a un grupo') + '</h2>' +
    (dir ? '<div class="unirse-card"><div class="unirse-nombre">' + escapeHtml(i.invita || i.nombre || 'Alguien') + '</div><div class="unirse-meta">quiere compartir gastos contigo (sin grupo)</div></div>'
      : '<div class="unirse-card"><div class="unirse-nombre">' + escapeHtml(i.nombre) + '</div><div class="unirse-meta">Te invita ' + escapeHtml(i.invita || 'un miembro') + ' · ' + i.miembros + (Number(i.miembros) === 1 ? ' miembro' : ' miembros') + '</div></div>') +
    '<div class="field"><label>' + (dir ? 'Tu nombre' : 'Tu nombre en el grupo') + '</label><input id="uNombre" type="text" maxlength="40" value="' + escapeHtml(nombreSugerido()) + '"></div>' +
    '<div class="rec-hint" style="margin-bottom:6px;">Entrarás con la cuenta <b>' + escapeHtml(email) + '</b>. Tus movimientos siguen siendo privados: ' + (dir ? 'solo se verá lo que compartas con esta persona.' : 'el grupo solo verá lo que compartas en él.') + ' <button type="button" class="link" ' + act('unirseOtraCuenta') + '>¿No es tu cuenta?</button></div>' +
    '<div class="actions"><button class="btn ghost block" ' + act('unirseCerrar', '') + '>Ahora no</button><button class="btn accent block" ' + act('unirseConfirmar') + '>' + (dir ? 'Aceptar' : 'Unirme') + '</button></div>';
}


/* ============================================================
   GASTOS COMPARTIDOS (Bloque 8.2)
   - Cada gasto compartido vive en la tabla `compartidos` y lo ve todo el grupo.
   - En tus números cuenta solo TU PARTE (fila virtual 'c:<id>').
   - Si pagaste tú, tu movimiento personal (el cargo del banco) queda enlazado con
     compartidoId y deja de contarse, para no sumar dos veces.
   - Las «Liquidaciones» (Saldar) no son gasto: solo ajustan quién debe a quién.
   ============================================================ */
const TIPOS_COMPARTIBLES = ['Gasto', 'Factura', 'Ahorro', 'Deuda'];
const TIPO_OBJ = { Ahorro: 'ahorro', Deuda: 'deuda' }; // tipo de movimiento → tipo de meta/deuda compartida
function compartidosDisponible() { return !!(S.db && S.db.compartidos && gruposDisponible()); }
function cents(x) { return Math.round(num(x) * 100); }
function r2(x) { return Math.round(num(x) * 100) / 100; }
function numCampo(v) { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; }
function fmtPct(x) { return num(x).toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' %'; }
function compPorId(id) { return (S.compartidos || []).find((c) => c.id === id) || null; }
function miParte(c) { const v = c && c.reparto ? c.reparto[miUid()] : null; return v == null ? 0 : num(v); }
function grupoDe(id) { return (S.grupos || []).find((g) => g.id === id) || null; }
function otroDe(g) { const yo = miUid(); return ((g && g.miembros) || []).find((m) => m.user_id !== yo) || null; }
function nombreDestino(g) {
  if (!g) return 'Grupo anterior';
  if (g.tipo !== 'directo') return g.nombre;
  const o = otroDe(g); return o ? o.nombre : 'Invitación pendiente';
}
function nombreDe(grupoId, uid) {
  if (uid === miUid()) return 'Tú';
  const busca = (x) => ((x && (x.todos || x.miembros)) || []).find((m) => m.user_id === uid);
  const m = busca(grupoDe(grupoId)) || (S.grupos || []).map(busca).find(Boolean);
  return m ? m.nombre : 'Alguien';
}
function miNombreAlguno() { const g = (S.grupos || []).find((x) => x.miNombre); return g ? g.miNombre : nombreSugerido(); }
// Tus movimientos + tu parte de lo compartido (sin contar dos veces lo que pagaste tú).
function movsEfectivos() {
  const cs = S.compartidos || [], yo = miUid();
  if (S._ef && S._ef.m === S.movimientos && S._ef.c === cs && S._ef.o === S.objetivos && S._ef.u === yo) return S._ef.v;
  let v = S.movimientos;
  if (cs.length) {
    const vivos = new Set(cs.map((c) => c.id));
    v = S.movimientos.filter((m) => !(m.compartidoId && vivos.has(m.compartidoId)));
    cs.forEach((c) => {
      if (c.tipo === 'Liquidación') return;
      const p = miParte(c); if (!(p > 0)) return;
      const ob = c.objetivoId ? objPorId(c.objetivoId) : null;
      v.push({ id: 'c:' + c.id, fecha: c.fecha, tipo: c.tipo, categoria: (ob && ob.nombre) || c.categoria || 'Compartido', descripcion: c.descripcion || '', importe: p, metodoPago: '', comp: c });
    });
  }
  S._ef = { m: S.movimientos, c: cs, o: S.objetivos, u: yo, v };
  return v;
}
// Solo tus movimientos personales que cuentan (sin los cargos enlazados a algo compartido)
function movsPersonales() {
  const cs = S.compartidos || [];
  if (!cs.length) return S.movimientos;
  const vivos = new Set(cs.map((c) => c.id));
  return S.movimientos.filter((m) => !(m.compartidoId && vivos.has(m.compartidoId)));
}
function compAplicarLocal(c, quitarId) { S.compartidos = (S.compartidos || []).filter((x) => x.id !== c.id && x.id !== quitarId).concat([c]); }
function compQuitarLocal(id) { S.compartidos = (S.compartidos || []).filter((x) => x.id !== id); }
/* ---- quién debe a quién (en céntimos, para que cuadre exacto) ---- */
function saldosDe(grupoId) {
  const s = {};
  (S.compartidos || []).forEach((c) => {
    if (c.grupoId !== grupoId) return;
    s[c.pagadoPor] = (s[c.pagadoPor] || 0) + cents(c.importe);
    Object.keys(c.reparto || {}).forEach((u) => { s[u] = (s[u] || 0) - cents(c.reparto[u]); });
  });
  return s;
}
function miSaldo(grupoId) { return (saldosDe(grupoId)[miUid()] || 0) / 100; }
// Simplifica: el que más debe paga al que más le deben, y así hasta cuadrar (pocos pagos).
function deudasDe(grupoId) {
  const s = saldosDe(grupoId);
  const deu = Object.keys(s).filter((u) => s[u] < 0).map((u) => ({ u, v: -s[u] })).sort((a, b) => b.v - a.v);
  const acr = Object.keys(s).filter((u) => s[u] > 0).map((u) => ({ u, v: s[u] })).sort((a, b) => b.v - a.v);
  const out = []; let i = 0, j = 0;
  while (i < deu.length && j < acr.length) {
    const x = Math.min(deu[i].v, acr[j].v);
    if (x > 0) out.push({ de: deu[i].u, a: acr[j].u, importe: x / 100 });
    deu[i].v -= x; acr[j].v -= x;
    if (deu[i].v === 0) i++;
    if (acr[j].v === 0) j++;
  }
  return out;
}
function saldoTxt(v) { return v > 0.004 ? 'te deben ' + money(v) : v < -0.004 ? 'debes ' + money(-v) : 'en paz'; }
function saldoColor(v) { return v > 0.004 ? 'var(--income)' : v < -0.004 ? 'var(--expense)' : 'var(--text-faint)'; }
function compQuienTxt(c) { const ap = c.tipo === 'Ahorro'; return nombreDestino(grupoDe(c.grupoId)) + ' · ' + (c.pagadoPor === miUid() ? (ap ? 'aportaste tú' : 'pagaste tú') : (ap ? 'aportó ' : 'pagó ') + nombreDe(c.grupoId, c.pagadoPor)); }
// Porcentajes con 2 decimales que suman exactamente 100 (el ajuste va al mayor)
function pctsCuadrados(vals) {
  const tot = vals.reduce((a, v) => a + v.x, 0) || 1, out = {};
  let s = 0, imax = null, xmax = -1;
  vals.forEach((v) => { out[v.u] = Math.round(v.x / tot * 10000) / 100; s += out[v.u]; if (v.x > xmax) { xmax = v.x; imax = v.u; } });
  if (imax != null) out[imax] = Math.round((out[imax] + 100 - s) * 100) / 100;
  return out;
}

/* ---- con quién se puede compartir: grupos, personas con las que ya compartes y quien está en tus grupos ---- */
function destinosCompartir() {
  const yo = miUid(), gs = S.grupos || [], out = [], vistos = new Set();
  gs.filter((g) => g.tipo === 'grupo' && g.miembros.length >= 2).forEach((g) => out.push({ k: 'g:' + g.id, label: g.nombre, grupo: true }));
  gs.filter((g) => g.tipo === 'directo' && g.miembros.length === 2).forEach((g) => { const o = otroDe(g); if (o && !vistos.has(o.user_id)) { vistos.add(o.user_id); out.push({ k: 'g:' + g.id, label: o.nombre }); } });
  gs.filter((g) => g.tipo === 'grupo').forEach((g) => g.miembros.forEach((m) => { if (m.user_id !== yo && !vistos.has(m.user_id)) { vistos.add(m.user_id); out.push({ k: 'u:' + m.user_id, label: m.nombre }); } }));
  return out;
}
// Por defecto: con quien compartiste la última vez; si no, tu único grupo.
function destinosPara(tipo) {
  const ds = destinosCompartir(), t = TIPO_OBJ[tipo];
  return t ? ds.filter((d) => d.k.indexOf('g:') === 0 && objetivosDe(d.k.slice(2), t).length) : ds;
}
function destinoPorDefecto() {
  const ds = destinosPara(FORM.tipo), ult = cfg().ultimoCompartir;
  if (ult && ds.some((d) => d.k === ult)) return ult;
  const gs = ds.filter((d) => d.grupo);
  return gs.length === 1 ? gs[0].k : ds.length === 1 ? ds[0].k : '';
}
function miembrosComp() {
  const cp = FORM.comp || {}, k = cp.dest || '', yo = miUid();
  let ms = [];
  if (k.indexOf('g:') === 0) {
    const gid = k.slice(2), g = grupoDe(gid), c = FORM.compId ? compPorId(FORM.compId) : null;
    ms = g ? g.miembros.map((m) => ({ uid: m.user_id, nombre: m.nombre })) : [];
    if (c && c.grupoId === gid) [c.pagadoPor].concat(Object.keys(c.reparto || {})).forEach((u) => { if (!ms.some((m) => m.uid === u)) ms.push({ uid: u, nombre: nombreDe(gid, u) }); });
  } else if (k.indexOf('u:') === 0) ms = [{ uid: yo, nombre: miNombreAlguno() }, { uid: k.slice(2), nombre: nombreDe(null, k.slice(2)) }];
  return ms.sort((a, b) => (b.uid === yo) - (a.uid === yo)); // tú primero
}
function importeForm() { const el = $('#fImporte'); return el ? numCampo(el.value) : 0; }
// Devuelve { reparto: { user_id: importe } } o { error }
function calcReparto(cp, imp, ms) {
  const tot = cents(imp);
  if (!(tot > 0)) return { error: 'Pon el importe total' };
  const ids = ms.map((m) => m.uid), rep = {};
  if (cp.modo === 'porcentaje') {
    const p = {}; let sp = 0;
    ids.forEach((u) => { p[u] = Math.max(0, numCampo((cp.vals || {})[u])); sp += p[u]; });
    if (Math.abs(sp - 100) > 0.011) return { error: 'Los porcentajes suman ' + fmtPct(sp) + ' y tienen que sumar 100 %' };
    const con = ids.filter((u) => p[u] > 0); let acum = 0;
    con.forEach((u, i) => { rep[u] = i === con.length - 1 ? tot - acum : Math.round(tot * p[u] / 100); acum += rep[u]; });
  } else if (cp.modo === 'importe') {
    let sum = 0;
    ids.forEach((u) => { const v = cents(Math.max(0, numCampo((cp.vals || {})[u]))); if (v > 0) { rep[u] = v; sum += v; } });
    if (sum !== tot) return { error: 'Los importes suman ' + money(sum / 100) + ' y el total es ' + money(tot / 100) };
  } else {
    const inc = ids.filter((u) => cp.incl && cp.incl[u]);
    if (!inc.length) return { error: 'Marca al menos a una persona' };
    const base = Math.floor(tot / inc.length); let resto = tot - base * inc.length;
    inc.forEach((u) => { rep[u] = base + (resto > 0 ? 1 : 0); if (resto > 0) resto--; });
  }
  const out = {}; Object.keys(rep).forEach((u) => { if (rep[u] > 0) out[u] = rep[u] / 100; });
  if (!Object.keys(out).length) return { error: 'El reparto está vacío' };
  return { reparto: out };
}
function compFormDesde(c) {
  const cp = { on: true, dest: 'g:' + c.grupoId, pagador: c.pagadoPor, modo: c.modo || 'igual', incl: {}, vals: {}, objetivo: c.objetivoId || null, clase: claseComp(c.tipo) };
  const ks = Object.keys(c.reparto || {});
  ks.forEach((u) => { cp.incl[u] = num(c.reparto[u]) > 0; });
  if (cp.modo === 'porcentaje') { const p = pctsCuadrados(ks.map((u) => ({ u, x: num(c.reparto[u]) }))); ks.forEach((u) => { cp.vals[u] = String(p[u]); }); }
  else ks.forEach((u) => { cp.vals[u] = String(num(c.reparto[u])); });
  return cp;
}
function claseComp(tipo) { return TIPO_OBJ[tipo] || 'gasto'; }
// Prepara el destino solo si hace falta (destino no válido para el tipo o cambia de clase), sin pisar un reparto hecho a mano.
function compAsegurarDestino() {
  const cp = FORM.comp, ds = destinosPara(FORM.tipo), c = FORM.compId ? compPorId(FORM.compId) : null;
  const valido = cp.dest && (ds.some((d) => d.k === cp.dest) || (c && cp.dest === 'g:' + c.grupoId));
  if (valido && cp.clase === claseComp(FORM.tipo)) return;
  const k = valido ? cp.dest : destinoPorDefecto();
  if (k) compPrepararDestino(k); else { cp.dest = ''; cp.objetivo = null; cp.clase = claseComp(FORM.tipo); }
}
function compPrepararDestino(k) {
  const cp = FORM.comp, yo = miUid();
  cp.dest = k; cp.clase = claseComp(FORM.tipo);
  const ms = miembrosComp();
  if (!ms.some((m) => m.uid === cp.pagador)) cp.pagador = yo;
  cp.incl = {}; ms.forEach((m) => { cp.incl[m.uid] = true; });
  cp.vals = {};
  const g = k.indexOf('g:') === 0 ? grupoDe(k.slice(2)) : null, def = g && g.reparto && typeof g.reparto === 'object' ? g.reparto : null;
  if (def && ms.every((m) => def[m.uid] != null)) { cp.modo = 'porcentaje'; ms.forEach((m) => { cp.vals[m.uid] = String(def[m.uid]); }); }
  else cp.modo = 'igual';
  const t = TIPO_OBJ[FORM.tipo];
  if (t) {
    const os = objetivosDe(k.slice(2), t);
    const c0 = FORM.compId ? compPorId(FORM.compId) : null, huerfana = c0 && c0.objetivoId === cp.objetivo && !objPorId(cp.objetivo);
    if (!huerfana && !os.some((o) => o.id === cp.objetivo)) cp.objetivo = os.length ? os[0].id : null;
    const ob = objPorId(cp.objetivo), cat = $('#fCategoria'); if (ob && cat) cat.value = ob.nombre;
    // en una hucha cada uno aporta lo suyo: por defecto solo cuenta para quien aporta
    if (FORM.tipo === 'Ahorro') { cp.modo = 'igual'; cp.incl = {}; cp.incl[cp.pagador] = true; cp.vals = {}; }
  } else cp.objetivo = null;
}
// Al cambiar de modo se parte del reparto que ya había, para no empezar de cero.
function compCambiarModo(modo) {
  const cp = FORM.comp, ms = miembrosComp(), imp = importeForm();
  const r = calcReparto(cp, imp, ms);
  cp.modo = modo;
  if (modo === 'porcentaje') {
    const p = pctsCuadrados(ms.map((m) => ({ u: m.uid, x: r.reparto ? (r.reparto[m.uid] || 0) : 1 })));
    cp.vals = {}; ms.forEach((m) => { cp.vals[m.uid] = p[m.uid] ? String(p[m.uid]) : ''; });
  } else if (modo === 'importe') {
    cp.vals = {}; if (r.reparto) ms.forEach((m) => { cp.vals[m.uid] = r.reparto[m.uid] ? String(r.reparto[m.uid]) : ''; });
  } else if (r.reparto) { cp.incl = {}; ms.forEach((m) => { cp.incl[m.uid] = !!r.reparto[m.uid]; }); }
}
function compFieldHtml() {
  if (!FORM || FORM.kind !== 'mov' || !compartidosDisponible()) return '';
  const cp = FORM.comp || (FORM.comp = { on: false }), t = TIPO_OBJ[FORM.tipo];
  if (TIPOS_COMPARTIBLES.indexOf(FORM.tipo) < 0) return FORM.compId ? '<div class="rec-hint">Solo se comparten gastos, facturas, ahorro y deudas: si lo guardas así, dejará de estar compartido.</div>' : '';
  if (!cp.on) return '<button type="button" class="comp-toggle" ' + act('compOn') + '>' + ic('users') + '<span>' + (t === 'ahorro' ? 'Aportar a una meta compartida' : t === 'deuda' ? 'Pagar una deuda compartida' : 'Compartir este gasto') + '</span>' + badge('compartir') + '</button>';
  const yo = miUid(), ds = destinosPara(FORM.tipo), c = FORM.compId ? compPorId(FORM.compId) : null;
  if (c && !ds.some((d) => d.k === 'g:' + c.grupoId)) ds.unshift({ k: 'g:' + c.grupoId, label: nombreDestino(grupoDe(c.grupoId)) });
  let h = '<div class="comp-box"><div class="comp-head"><b>' + ic('users') + ' Compartido</b><button type="button" class="link" ' + act('compOff') + '>No compartir</button></div>';
  if (!ds.length && t) {
    return h + '<div class="rec-hint">Aún no tienes ' + (t === 'deuda' ? 'deudas compartidas (como una hipoteca)' : 'metas compartidas (una hucha para un viaje…)') + '. Créala y luego apunta aquí lo que ' + (t === 'deuda' ? 'pagáis' : 'aporta cada uno') + '.</div>' +
      '<button type="button" class="btn sm ghost" style="margin-top:10px;" ' + act('objNueva', t) + '>' + ic('plus') + (t === 'deuda' ? ' Crear deuda compartida' : ' Crear meta compartida') + '</button></div>';
  }
  if (!ds.length) {
    return h + '<div class="rec-hint">Aún no compartes con nadie. Crea un grupo o invita a una persona y, cuando acepte, podrás compartir con ella.</div>' +
      '<button type="button" class="btn sm ghost" style="margin-top:10px;" ' + act('compIrGrupos') + '>Ir a Grupos y personas</button></div>';
  }
  h += '<div class="comp-lbl">Con</div><div class="chips">' + ds.map((d) => '<button type="button" class="chip ' + (cp.dest === d.k ? 'active' : '') + '" ' + act('compDest', d.k) + '>' + (d.grupo ? '👥 ' : '') + escapeHtml(d.label) + '</button>').join('') + '</div>';
  if (!cp.dest) return h + '<div class="rec-hint">Elige con quién lo compartes.</div></div>';
  const ms = miembrosComp();
  if (t) {
    const os = objetivosDe(cp.dest.slice(2), t);
    const huerf = c && c.objetivoId && c.objetivoId === cp.objetivo && !objPorId(c.objetivoId) ? '<button type="button" class="chip active">' + escapeHtml(c.categoria || '—') + ' (eliminada)</button>' : '';
    h += '<div class="comp-lbl">' + (t === 'deuda' ? 'Deuda' : 'Meta') + '</div><div class="chips">' + huerf + os.map((o) => '<button type="button" class="chip ' + (cp.objetivo === o.id ? 'active' : '') + '" ' + act('compObjetivo', o.id) + '>' + escapeHtml(o.nombre) + '</button>').join('') + '</div>';
  }
  return h + '<div class="comp-lbl">' + (FORM.tipo === 'Ahorro' ? 'Aporta' : 'Pagó') + '</div><div class="chips">' + ms.map((m) => '<button type="button" class="chip ' + (cp.pagador === m.uid ? 'active' : '') + '" ' + act('compPagador', m.uid) + '>' + (m.uid === yo ? 'Yo' : escapeHtml(m.nombre)) + '</button>').join('') + '</div>' +
    '<div class="comp-lbl">Cómo se reparte</div><div class="segmented sm">' + [['igual', 'Iguales'], ['porcentaje', 'Por %'], ['importe', 'Por importe']].map(([id, l]) => '<button type="button" class="' + (cp.modo === id ? 'active' : '') + '" ' + act('compModo', id) + '>' + l + '</button>').join('') + '</div>' +
    '<div id="compReparto">' + compRepartoHtml() + '</div></div>';
}
function compRepartoHtml() {
  const cp = FORM.comp, ms = miembrosComp(), yo = miUid(), nom = (m) => (m.uid === yo ? 'Yo' : escapeHtml(m.nombre));
  let h;
  if (cp.modo === 'igual') {
    const r = calcReparto(cp, importeForm(), ms);
    h = ms.map((m) => '<label class="comp-row"><input type="checkbox" ' + (cp.incl[m.uid] ? 'checked' : '') + ' ' + onChange('compIncl', m.uid) + '><span class="n">' + nom(m) + '</span><b class="tnum">' + (cp.incl[m.uid] && r.reparto ? money(r.reparto[m.uid] || 0) : '—') + '</b></label>').join('');
  } else {
    h = ms.map((m) => '<div class="comp-row"><span class="n">' + nom(m) + '</span><input type="number" step="0.01" min="0" inputmode="decimal" class="comp-val" placeholder="0" value="' + escapeHtml((cp.vals || {})[m.uid] || '') + '" ' + onInput('compVal', m.uid) + '><span class="u">' + (cp.modo === 'porcentaje' ? '%' : sym()) + '</span></div>').join('');
  }
  return '<div class="comp-rows">' + h + '</div>' + (FORM.tipo === 'Ahorro' ? '<div class="rec-hint" style="margin-top:4px;">En una hucha, normalmente cada uno aporta lo suyo: marca solo a quien aporta.</div>' : '') +
    '<div id="compResumen" class="comp-resumen">' + compResumenHtml() + '</div>';
}
function compResumenHtml() {
  const cp = FORM.comp, ms = miembrosComp(), yo = miUid(), imp = importeForm();
  if (!(imp > 0)) return 'Pon arriba el importe total del gasto.';
  const r = calcReparto(cp, imp, ms);
  if (r.error) return '<span style="color:var(--expense);">' + escapeHtml(r.error) + '</span>';
  const mia = r.reparto[yo] || 0, pag = ms.find((m) => m.uid === cp.pagador);
  let t = 'Tu parte: <b class="tnum">' + money(mia) + '</b>';
  if (cp.pagador === yo) { const d = r2(imp - mia); if (d > 0) t += ' · te deben <b class="tnum">' + money(d) + '</b>'; }
  else if (mia > 0) t += ' · debes <b class="tnum">' + money(mia) + '</b> a ' + escapeHtml(pag ? pag.nombre : 'quien pagó');
  return t + '<div class="rec-hint" style="margin-top:4px;">En tus números cuenta solo tu parte.</div>';
}
function refrescarComp(soloResumen) {
  if (soloResumen) { const r = $('#compResumen'); if (r) { r.innerHTML = compResumenHtml(); return; } }
  const f = $('#compField'); if (f) f.innerHTML = compFieldHtml();
}
function openCompForm(cid) {
  const c = compPorId(cid);
  if (!c) return toast('Ese gasto compartido ya no existe');
  if (c.tipo === 'Liquidación' || !grupoDe(c.grupoId)) {
    FORM = { kind: 'compInfo', id: cid };
    if ($('#sheetBackdrop')) updateSheet(compInfoHtml(c)); else openSheet(compInfoHtml(c));
    return;
  }
  const mio = S.movimientos.find((m) => m.compartidoId === cid);
  openMovForm(mio ? mio.id : null, { compId: cid });
}
function compInfoHtml(c) {
  const g = grupoDe(c.grupoId), liq = c.tipo === 'Liquidación', a = Object.keys(c.reparto || {})[0];
  const n = (u) => escapeHtml(nombreDe(c.grupoId, u));
  return '<div class="handle"></div><h2>' + (liq ? 'Pago para saldar cuentas' : escapeHtml(c.categoria || c.tipo)) + '</h2>' +
    '<div class="card" style="font-size:14px;line-height:1.6;">' +
    (liq ? '<b>' + n(c.pagadoPor) + '</b> pagó <b class="tnum">' + money(c.importe) + '</b> a <b>' + n(a) + '</b>'
      : 'Total <b class="tnum">' + money(c.importe) + '</b> · ' + escapeHtml(compQuienTxt(c)) + '<br>Tu parte: <b class="tnum">' + money(miParte(c)) + '</b>' + (c.descripcion ? '<br>' + escapeHtml(c.descripcion) : '')) +
    '<br><span style="color:var(--text-faint);">' + fmtDateLong(c.fecha) + ' · ' + escapeHtml(nombreDestino(g)) + '</span></div>' +
    (liq ? '<div class="rec-hint" style="margin-top:8px;">No cuenta como gasto ni como ingreso: solo deja las cuentas a cero.</div>' : '') +
    (!g ? '<div class="rec-hint" style="margin-top:8px;">Ya no estás en este grupo, así que no puedes cambiarlo.</div>' : '') +
    '<div class="actions">' + (g ? '<button class="btn ghost block" ' + act('grupoVer', g.id) + '>Ver cuentas</button>' : '') + '<button class="btn accent block" ' + act('closeSheet') + '>Cerrar</button></div>' +
    (g && liq ? '<button class="btn danger block" style="margin-top:10px;" ' + act('liqEliminar', c.id) + '>' + ic('trash') + ' Eliminar este pago</button>' : '');
}
// Tras guardar: si venías de las cuentas de un grupo, vuelves a ellas.
function terminarForm() {
  const g = S._volverGrupo; S._volverGrupo = null;
  if (g && grupoDe(g)) abrirGrupo(g); else closeSheet();
}
async function saveCompartido(d) {
  const cp = FORM.comp, yo = miUid();
  if (!(d.importe > 0)) return toast('Un gasto compartido no puede ser negativo');
  if (!cp.dest) return toast('Elige con quién lo compartes');
  const r = calcReparto(cp, d.importe, miembrosComp());
  if (r.error) return toast(r.error);
  const t = TIPO_OBJ[FORM.tipo], previo = FORM.compId ? compPorId(FORM.compId) : null;
  const ob = t ? objPorId(cp.objetivo) : null;
  const huerfana = t && previo && previo.objetivoId && cp.objetivo === previo.objetivoId && !ob && cp.dest === 'g:' + previo.grupoId;
  if (t && !huerfana && (!ob || ob.tipo !== t || cp.dest !== 'g:' + ob.grupoId)) return toast(t === 'deuda' ? 'Elige la deuda compartida' : 'Elige la meta compartida');
  if (FORM.guardando) return;
  FORM.guardando = true;
  try {
    let grupoId = cp.dest.slice(2);
    if (cp.dest.indexOf('u:') === 0) {
      const g = await accionGrupo(() => S.db.rpc('crear_directo', { p_user: grupoId }));
      if (!g || g === true) return;
      grupoId = g;
    }
    const datos = { fecha: d.fecha, tipo: FORM.tipo, categoria: ob ? ob.nombre : huerfana ? (previo.categoria || d.categoria) : d.categoria, descripcion: d.descripcion, importe: r2(d.importe), pagadoPor: cp.pagador, reparto: r.reparto, modo: cp.modo, objetivoId: ob ? ob.id : huerfana ? previo.objetivoId : null };
    if (FORM.articulos) datos.articulos = FORM.articulos;
    let c;
    try {
      if (previo && previo.grupoId === grupoId) c = await S.db.compartidos.editar(previo.id, datos);
      else {
        c = await S.db.compartidos.crear(Object.assign({ grupoId }, datos));
        // se mueve a otro grupo: si no se puede retirar el anterior, se deshace el nuevo para no contar dos veces
        if (previo) { try { await S.db.compartidos.borrar(previo.id); } catch (e) { try { await S.db.compartidos.borrar(c.id); } catch (e2) { console.error(e2); } throw e; } }
      }
    } catch (e) { console.error(e); return toast(errGrupo(e)); }
    compAplicarLocal(c, previo && previo.id !== c.id ? previo.id : null);
    if (cfg().ultimoCompartir !== 'g:' + grupoId) saveConfig({ ultimoCompartir: 'g:' + grupoId });
    // Tu copia personal: si pagaste tú es el cargo de tu banco. Queda enlazada y no cuenta dos veces.
    const mio = FORM.id ? S.movimientos.find((m) => m.id === FORM.id) : null;
    let ok = true;
    if (mio || cp.pagador === yo) {
      const data = Object.assign(mio ? stripId(mio) : { creadoEn: Date.now() }, { compartidoId: c.id });
      if (cp.pagador === yo || !mio) Object.assign(data, { tipo: FORM.tipo, importe: datos.importe, categoria: datos.categoria, fecha: d.fecha, descripcion: d.descripcion, metodoPago: d.metodoPago }, FORM.articulos ? { articulos: FORM.articulos } : {});
      ['tipoActivo', 'activoId', 'participaciones', 'metaId'].forEach((k) => { if (k in data) data[k] = null; });
      ok = await write(() => S.db.collection('movimientos').doc(mio ? mio.id : undefined).set(data));
    }
    const reglaNueva = FORM.recordar ? ((($('#fReglaTexto') || {}).value || '').trim()) : '';
    if (reglaNueva) guardarRegla(reglaNueva, d.categoria, FORM.tipo);
    toast(!ok ? 'Compartido guardado, pero no se pudo guardar tu copia' : previo ? 'Actualizado' : t === 'ahorro' ? 'Aportación añadida a «' + datos.categoria + '»' : t === 'deuda' ? 'Pago añadido a «' + datos.categoria + '»' : 'Gasto compartido añadido');
    render(); terminarForm();
  } finally { FORM.guardando = false; }
}
async function quitarCompartido() {
  const c = compPorId(FORM.compId);
  if (!c) { FORM.compId = null; return true; }
  if (c.pagadoPor !== miUid()) { toast('Solo quien lo pagó puede dejar de compartirlo. Si no se hizo, elimínalo.'); return false; }
  try { await S.db.compartidos.borrar(c.id); } catch (e) { console.error(e); toast(errGrupo(e)); return false; }
  compQuitarLocal(c.id); FORM.compId = null; FORM.compQuitado = true;
  return true;
}
async function doDeleteComp() {
  const id = FORM.compId, mio = FORM.id;
  try { await S.db.compartidos.borrar(id); } catch (e) { console.error(e); return toast(errGrupo(e)); }
  compQuitarLocal(id);
  if (mio) await write(() => S.db.collection('movimientos').doc(mio).delete());
  toast('Gasto compartido eliminado'); render(); terminarForm();
}
/* ---- cuentas de un grupo o persona ---- */
function deudaTxt(d, gid) {
  const yo = miUid(), n = (u) => escapeHtml(nombreDe(gid, u));
  if (d.de === yo) return 'Debes <b class="tnum">' + money(d.importe) + '</b> a ' + n(d.a);
  if (d.a === yo) return n(d.de) + ' te debe <b class="tnum">' + money(d.importe) + '</b>';
  return n(d.de) + ' debe <b class="tnum">' + money(d.importe) + '</b> a ' + n(d.a);
}
function compRowGrupo(c) {
  const yo = miUid(), n = (u) => escapeHtml(nombreDe(c.grupoId, u));
  if (c.tipo === 'Liquidación') {
    const a = Object.keys(c.reparto || {})[0];
    const t = c.pagadoPor === yo ? 'Pagaste a ' + n(a) : a === yo ? n(c.pagadoPor) + ' te pagó' : n(c.pagadoPor) + ' pagó a ' + n(a);
    return '<div class="row" ' + act('compAbrir', c.id, c.grupoId) + '><span class="dot" style="background:var(--text-faint)"></span><div class="main"><div class="ttl">' + t + '</div><div class="meta">' + fmtDateShort(c.fecha) + ' · para saldar cuentas</div></div><div class="amt tnum">' + money(c.importe) + '</div></div>';
  }
  return '<div class="row" ' + act('compAbrir', c.id, c.grupoId) + '><span class="dot" style="background:var(--' + (TIPO_COLOR[c.tipo] || 'debt') + ')"></span><div class="main"><div class="ttl">' + escapeHtml(c.categoria || c.tipo) + '</div>' +
    '<div class="meta">' + fmtDateShort(c.fecha) + (c.descripcion ? ' · ' + escapeHtml(c.descripcion) : '') + ' · ' + (c.tipo === 'Ahorro' ? (c.pagadoPor === yo ? 'aportaste tú' : 'aportó ' + n(c.pagadoPor)) : (c.pagadoPor === yo ? 'pagaste tú' : 'pagó ' + n(c.pagadoPor))) + '</div></div>' +
    '<div class="amt tnum">' + money(c.importe) + '<div class="amt-sub">tu parte ' + money(miParte(c)) + '</div></div></div>';
}
function cuentasGrupoHtml(g) {
  const yo = miUid(), cs = (S.compartidos || []).filter((c) => c.grupoId === g.id), ds = deudasDe(g.id);
  let h = '<div class="section-title">Cuentas</div><div class="card">';
  if (!cs.length) h += '<div style="color:var(--text-faint);font-size:13.5px;">Aún no hay gastos compartidos aquí.</div>';
  else if (!ds.length) h += '<div class="comp-ok">' + ic('checkCircle') + ' Estáis en paz: nadie debe nada.</div>';
  else h += ds.map((d) => '<div class="deuda-row"><div class="t">' + deudaTxt(d, g.id) + '</div>' + (d.de === yo || d.a === yo ? '<button class="btn sm ' + (d.de === yo ? 'accent' : 'ghost') + '" ' + act('saldarAbrir', g.id, d.de, d.a, d.importe) + '>Saldar</button>' : '') + '</div>').join('');
  h += '<button class="btn ghost block" style="margin-top:12px;" ' + act('compNuevoEn', g.id) + '>' + ic('plus') + ' Añadir gasto compartido</button></div>';
  if (cs.length) {
    const lista = cs.slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
    const n = FORM && FORM.verTodos ? lista.length : 6;
    h += '<div class="section-title">Últimos gastos y pagos</div><div class="list">' + lista.slice(0, n).map(compRowGrupo).join('') + '</div>' +
      (lista.length > n ? '<button type="button" class="link" style="margin-top:8px;" ' + act('compVerTodos', g.id) + '>Ver todos (' + lista.length + ')</button>' : '');
  }
  return h;
}
function saldarHtml(f) {
  const yo = miUid(), n = (u) => escapeHtml(nombreDe(f.gid, u));
  return '<div class="handle"></div><h2>Saldar cuentas</h2>' +
    '<div class="unirse-card"><div class="unirse-nombre">' + (f.de === yo ? 'Tú pagas a ' + n(f.a) : f.a === yo ? n(f.de) + ' te paga' : n(f.de) + ' paga a ' + n(f.a)) + '</div><div class="unirse-meta">Se debe ' + money(f.max) + '</div></div>' +
    '<div class="field"><label>Importe (' + sym() + ')</label><input id="sImporte" type="number" step="0.01" min="0" inputmode="decimal" value="' + f.max + '"><div class="rec-hint">Puedes poner menos si es un pago parcial.</div></div>' +
    '<div class="field"><label>Fecha</label><input id="sFecha" type="date" value="' + todayISO() + '"></div>' +
    '<div class="rec-hint" style="margin-bottom:6px;">Apúntalo cuando el dinero ya se haya enviado (Bizum, transferencia o en mano). No cuenta como gasto ni como ingreso: solo deja las cuentas a cero.</div>' +
    '<div class="actions"><button class="btn ghost block" ' + act('grupoVer', f.gid) + '>Volver</button><button class="btn accent block" ' + act('saldarGuardar') + '>Registrar pago</button></div>';
}
function personaHtml(g) {
  const o = otroDe(g), inv = (FORM && FORM.invitaciones) || [];
  if (!o) {
    const p = inv.find((x) => !x.usada_en && new Date(x.expira) > new Date());
    const url = p ? APP_URL + '?unirse=' + encodeURIComponent(p.token) : '';
    return '<div class="handle"></div><h2>Invitación pendiente</h2>' +
      '<div class="card" style="font-size:13.5px;line-height:1.5;">' + (p ? 'Aún no la ha aceptado. El enlace caduca el ' + fmtDateShort(String(p.expira).slice(0, 10)) + '.' : 'El enlace ha caducado o ya no es válido. Anula esta invitación y crea otra.') + '</div>' +
      (p ? '<a class="btn accent block wa-btn" style="margin-top:12px;" href="https://wa.me/?text=' + encodeURIComponent(mensajePersona(url)) + '" target="_blank" rel="noopener">Reenviar por WhatsApp</a><div class="enlace-box">' + escapeHtml(url) + '</div>' : '') +
      '<div class="actions"><button class="btn ghost block" ' + act('openGrupos') + '>Volver</button></div>' +
      '<button class="btn danger block" style="margin-top:10px;" ' + act('grupoSalir', g.id) + '>Anular la invitación</button>';
  }
  return '<div class="handle"></div><h2>' + escapeHtml(o.nombre) + '</h2><div style="font-size:13px;color:var(--text-muted);margin:-6px 0 4px;">Gastos que compartes solo con ' + escapeHtml(o.nombre) + ', sin grupo.</div>' +
    cuentasGrupoHtml(g) + objetivosGrupoHtml(g) +
    '<div class="actions"><button class="btn ghost block" ' + act('openGrupos') + '>Volver</button></div>' +
    '<button class="btn danger block" style="margin-top:10px;" ' + act('grupoSalir', g.id) + '>Dejar de compartir con ' + escapeHtml(o.nombre) + '</button>';
}
function mensajePersona(url) { return 'Hola, te invito a compartir gastos conmigo en PalomApp. Ábrelo aquí (vale 7 días y para una sola persona): ' + url; }
function personaNuevaHtml() {
  const f = FORM;
  return '<div class="handle"></div><h2>Invitar a una persona</h2>' +
    '<div style="font-size:13px;color:var(--text-muted);line-height:1.45;margin:-6px 0 10px;">Para compartir gastos con alguien sin crear un grupo (una cena, un regalo…). Le llega un enlace por WhatsApp y, cuando lo acepte, podréis compartir gastos.</div>' +
    (f.url
      ? '<a class="btn accent block wa-btn" href="https://wa.me/?text=' + encodeURIComponent(f.msg) + '" target="_blank" rel="noopener">Enviar por WhatsApp</a>' +
        '<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn ghost block" ' + act('grupoCopiar') + '>Copiar enlace</button>' + (navigator.share ? '<button class="btn ghost block" ' + act('grupoCompartir') + '>Compartir…</button>' : '') + '</div>' +
        '<div class="enlace-box">' + escapeHtml(f.url) + '</div><div class="rec-hint" style="margin-top:8px;">Vale para una persona y caduca en 7 días.</div>' +
        '<div class="actions"><button class="btn accent block" ' + act('openGrupos') + '>Listo</button></div>'
      : '<div class="field"><label>Tu nombre</label><input id="pMiNombre" type="text" maxlength="40" value="' + escapeHtml(miNombreAlguno()) + '"><div class="rec-hint">Es como te verá la otra persona.</div></div>' +
        '<div class="actions"><button class="btn ghost block" ' + act('openGrupos') + '>Cancelar</button><button class="btn accent block" ' + act('personaCrear') + '>Crear enlace</button></div>');
}
function repartoTxt(g) {
  const r = g.reparto && typeof g.reparto === 'object' ? g.reparto : null;
  if (!r || !g.miembros.every((m) => r[m.user_id] != null)) return 'A partes iguales';
  return g.miembros.map((m) => m.nombre + ' ' + fmtPct(r[m.user_id])).join(' · ');
}
function repartoHabitualHtml(g) {
  return '<div class="section-title">Reparto habitual</div><div class="card"><div style="display:flex;align-items:center;gap:10px;"><div style="flex:1;font-size:14px;">' + escapeHtml(repartoTxt(g)) + '</div>' +
    (g.soyAdmin ? '<button class="btn sm ghost" ' + act('grupoRepartoAbrir', g.id) + '>Cambiar</button>' : '') + '</div>' +
    '<div class="rec-hint" style="margin-top:6px;">Es lo que sale por defecto al compartir un gasto en este grupo; en cada gasto se puede cambiar.</div></div>';
}
function grupoRepartoHtml(g) {
  const r = g.reparto && typeof g.reparto === 'object' ? g.reparto : {}, iguales = pctsCuadrados(g.miembros.map((m) => ({ u: m.user_id, x: 1 })));
  return '<div class="handle"></div><h2>Reparto habitual</h2><div class="rec-hint" style="margin:-6px 0 10px;">Porcentaje de cada uno en los gastos de «' + escapeHtml(g.nombre) + '». Tienen que sumar 100 %.</div>' +
    '<div class="field comp-rows">' + g.miembros.map((m, i) => '<div class="comp-row">' + avatarHtml(m, i) + '<span class="n">' + escapeHtml(m.nombre) + '</span><input type="number" step="0.01" min="0" inputmode="decimal" class="comp-val" id="rep_' + m.user_id + '" value="' + (r[m.user_id] != null ? r[m.user_id] : iguales[m.user_id]) + '"><span class="u">%</span></div>').join('') + '</div>' +
    '<div class="actions"><button class="btn ghost block" ' + act('grupoRepartoIgual', g.id) + '>A partes iguales</button><button class="btn accent block" ' + act('grupoRepartoGuardar', g.id) + '>Guardar</button></div>' +
    '<button type="button" class="link" style="margin-top:12px;" ' + act('grupoVer', g.id) + '>' + ic('chevL') + ' Volver</button>';
}

/* ============================================================
   METAS Y DEUDAS COMPARTIDAS (Bloque 8.3)
   - Una meta (hucha) o deuda (hipoteca…) vive en `objetivos_compartidos` y la ve todo el grupo.
   - Cada aportación o pago es un movimiento compartido de tipo Ahorro o Deuda enlazado a ella
     (así cuenta tu parte en tus números y, si se reparte, entra en el quién debe a quién).
   ============================================================ */
function objPorId(id) { return (S.objetivos || []).find((o) => o.id === id) || null; }
function objetivosDe(grupoId, tipo) { return (S.objetivos || []).filter((o) => o.grupoId === grupoId && (!tipo || o.tipo === tipo)).sort((a, b) => a.nombre.localeCompare(b.nombre)); }
function aportesDe(o) { return (S.compartidos || []).filter((c) => c.objetivoId === o.id); }
function objAplicarLocal(o) { S.objetivos = (S.objetivos || []).filter((x) => x.id !== o.id).concat([o]); }
function objQuitarLocal(id) { S.objetivos = (S.objetivos || []).filter((x) => x.id !== id); }
function objStats(o) {
  const cs = aportesDe(o), deuda = o.tipo === 'deuda', porPersona = {};
  cs.forEach((c) => Object.keys(c.reparto || {}).forEach((u) => { porPersona[u] = (porPersona[u] || 0) + num(c.reparto[u]); }));
  const acum = num(o.previo) + cs.reduce((a, c) => a + num(c.importe), 0);
  const obj = num(o.objetivo), falta = Math.max(0, obj - acum), pct = obj > 0 ? acum / obj * 100 : null;
  const hoy = todayISO(), desde = isoDaysAgo(90);
  const ritmo = cs.filter((c) => (c.fecha || '') > desde && (c.fecha || '') <= hoy).reduce((a, c) => a + num(c.importe), 0) / 3;
  const dias = o.fechaObjetivo ? daysUntil(o.fechaObjetivo) : null;
  const r = { o, id: o.id, nombre: o.nombre, deuda, acum, obj, falta, pct, ritmo, dias, fecha: o.fechaObjetivo || null, porPersona, mio: porPersona[miUid()] || 0, mes: null, llegada: null, estado: 'gris', texto: '' };
  if (obj <= 0) { r.texto = deuda ? 'Sin total definido' : 'Sin objetivo definido'; return r; }
  if (falta <= 0) { r.estado = 'verde'; r.texto = deuda ? 'Deuda saldada' : 'Meta lograda'; return r; }
  if (ritmo > 0) { const d = new Date(); d.setDate(d.getDate() + Math.round(falta / ritmo * 30.4375)); r.llegada = d; }
  if (dias == null) { r.texto = 'Sin fecha objetivo'; return r; }
  if (dias < 0) { r.estado = 'rojo'; r.texto = 'La fecha ya pasó y ' + (deuda ? 'quedan ' : 'faltan ') + money(falta); return r; }
  r.mes = falta / Math.max(dias / 30.4375, 1);
  const ratio = ritmo / r.mes;
  if (ratio >= 1) { r.estado = 'verde'; r.texto = 'Vais bien: ritmo suficiente'; }
  else if (ratio >= META_UMBRAL_AMARILLO) { r.estado = 'amarillo'; r.texto = deuda ? 'Ritmo justo: conviene pagar algo más' : 'Ritmo justo: conviene aportar algo más'; }
  else { r.estado = 'rojo'; r.texto = deuda ? 'Al ritmo actual no llegaríais a tiempo' : 'Al ritmo actual no llegaríais'; }
  return r;
}
function objCompartidos(tipo) { return (S.objetivos || []).filter((o) => o.tipo === tipo && grupoDe(o.grupoId)).map(objStats); }
// Tu parte de una deuda compartida: según el reparto habitual del grupo (o a partes iguales)
function miProporcion(o) {
  const g = grupoDe(o.grupoId), yo = miUid(); if (!g || !g.miembros.length) return 0;
  const r = g.reparto && typeof g.reparto === 'object' && g.reparto[yo] != null ? num(g.reparto[yo]) / 100 : null;
  return r != null ? r : 1 / g.miembros.length;
}
function objCardHtml(r) {
  const g = grupoDe(r.o.grupoId), yo = miUid(), pctC = r.pct == null ? 0 : Math.max(0, Math.min(100, r.pct));
  const personas = Object.keys(r.porPersona).sort((a, b) => (b === yo) - (a === yo)).map((u) => escapeHtml(nombreDe(r.o.grupoId, u)) + ' <b class="tnum">' + money(r.porPersona[u]) + '</b>').join(' · ');
  return '<div class="card" style="margin-bottom:12px;">' +
    '<div class="budget-row" style="margin:0;"><div class="top"><span class="cat" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' + semaforoDot(r.estado) + escapeHtml(r.nombre) + '<span class="obj-grupo">' + ic('users') + escapeHtml(nombreDestino(g)) + '</span></span>' +
    '<span class="nums"><b class="tnum">' + (r.pct == null ? '—' : r.pct.toFixed(0) + '%') + '</b></span></div>' +
    '<div class="progress"><div style="width:' + pctC + '%;background:' + SEMAFORO_COLOR[r.estado] + ';"></div></div></div>' +
    '<div class="summary-line">' + (r.deuda ? 'Pagado ' + money(r.acum) + (r.obj > 0 ? ' de ' + money(r.obj) + ' · pendiente ' + money(r.falta) : '') : money(r.acum) + (r.obj > 0 ? ' de ' + money(r.obj) : '')) + (r.fecha ? ' · hasta ' + fmtDateLong(r.fecha) : '') + '</div>' +
    '<div style="font-size:13.5px;font-weight:600;color:' + SEMAFORO_COLOR[r.estado] + ';margin:2px 0 6px;">' + escapeHtml(r.texto) + '</div>' +
    (r.mes != null ? '<div style="font-size:13px;color:var(--text-faint);line-height:1.6;">' + (r.deuda ? 'Cuota necesaria entre todos: ' : 'Necesitáis ahorrar entre todos aprox. ') + '<b class="tnum" style="color:var(--text);">' + money(r.mes) + '/mes</b> · ritmo (últimos 3 meses): <b class="tnum" style="color:var(--text);">' + money(r.ritmo) + '/mes</b>.</div>'
      : r.obj > 0 && r.falta > 0 ? '<div style="font-size:13px;color:var(--text-faint);line-height:1.6;">Ritmo (últimos 3 meses): <b class="tnum" style="color:var(--text);">' + money(r.ritmo) + '/mes</b>' + (r.llegada ? ' · a este ritmo llegaríais en ' + fmtMesAnio(r.llegada) : '') + '.</div>' : '') +
    (personas || num(r.o.previo) ? '<div class="obj-personas">' + (r.deuda ? 'Parte de cada uno: ' : 'Aportado: ') + (personas || '—') + (num(r.o.previo) ? ' · antes de la app ' + money(r.o.previo) : '') + '</div>' : '') +
    '<div style="display:flex;gap:8px;margin-top:10px;"><button class="btn sm accent" ' + act('objAportar', r.id) + '>' + (r.deuda ? 'Apuntar un pago' : 'Aportar') + '</button><button class="btn sm ghost" ' + act('objEditar', r.id) + '>Editar</button></div></div>';
}
function objCardsHtml(tipo) {
  const rs = objCompartidos(tipo);
  return rs.length ? '<div class="section-title">Compartidas</div>' + rs.map(objCardHtml).join('') : '';
}
function objetivosGrupoHtml(g) {
  const os = objetivosDe(g.id);
  let h = '<div class="section-title">Metas y deudas compartidas</div><div class="card">';
  h += os.length ? os.map((o) => {
    const r = objStats(o);
    return '<div class="budget-row tappable" ' + act('objEditar', o.id, g.id) + '><div class="top"><span class="cat" style="display:flex;align-items:center;gap:8px;">' + semaforoDot(r.estado) + escapeHtml(o.nombre) + ' <span class="hint">· ' + (r.deuda ? 'deuda' : 'meta') + '</span></span>' +
      '<span class="nums"><b class="tnum">' + (r.pct == null ? money(r.acum) : r.pct.toFixed(0) + '%') + '</b></span></div>' +
      '<div class="progress"><div style="width:' + Math.max(0, Math.min(100, r.pct || 0)) + '%;background:' + SEMAFORO_COLOR[r.estado] + ';"></div></div></div>';
  }).join('') : '<div style="color:var(--text-faint);font-size:13.5px;line-height:1.45;">Una hucha para un viaje, la hipoteca… Cada uno apunta lo que aporta o paga y veis el progreso juntos.</div>';
  return h + '<div style="display:flex;gap:8px;margin-top:12px;"><button class="btn sm ghost block" ' + act('objNueva', 'ahorro', g.id) + '>' + ic('plus') + ' Meta</button><button class="btn sm ghost block" ' + act('objNueva', 'deuda', g.id) + '>' + ic('plus') + ' Deuda</button></div></div>';
}
function objEditorHtml() {
  const F = FORM, deuda = F.tipo === 'deuda', o = F.id ? objPorId(F.id) : null, r = o ? objStats(o) : null;
  const v = (x) => (x == null ? '' : escapeHtml(x)), ds = F.id ? [] : destinosCompartir();
  const cancelar = act('objCancelar');
  return '<div class="handle"></div><h2>' + (o ? escapeHtml(o.nombre) : deuda ? 'Nueva deuda compartida' : 'Nueva meta compartida') + '</h2>' +
    (r ? '<div class="card" style="margin-bottom:12px;"><div class="progress" style="margin:0 0 8px;"><div style="width:' + Math.max(0, Math.min(100, r.pct || 0)) + '%;background:' + SEMAFORO_COLOR[r.estado] + ';"></div></div>' +
        '<div style="font-size:14px;">' + (deuda ? 'Pagado ' : '') + '<b class="tnum">' + money(r.acum) + '</b>' + (r.obj > 0 ? ' de ' + money(r.obj) + (deuda ? ' · pendiente ' + money(r.falta) : '') : '') + ' · <span style="color:' + SEMAFORO_COLOR[r.estado] + '">' + escapeHtml(r.texto) + '</span></div>' +
        '<div class="rec-hint" style="margin-top:4px;">Compartida con ' + escapeHtml(nombreDestino(grupoDe(o.grupoId))) + '</div>' +
        '<button class="btn accent block" style="margin-top:10px;" ' + act('objAportar', o.id) + '>' + (deuda ? 'Apuntar un pago' : 'Aportar') + '</button></div>' : '') +
    (!F.id ? '<div class="field"><label>Con</label>' + (ds.length ? '<div class="chips">' + ds.map((d) => '<button type="button" class="chip ' + (F.dest === d.k ? 'active' : '') + '" ' + act('objDest', d.k) + '>' + (d.grupo ? '👥 ' : '') + escapeHtml(d.label) + '</button>').join('') + '</div>'
        : '<div class="rec-hint">Primero crea un grupo o invita a una persona (Más → Compartir).</div>') + '</div>' : '') +
    '<div class="field"><label>Nombre</label><input id="oNombre" type="text" maxlength="60" placeholder="' + (deuda ? 'Hipoteca' : 'Viaje a Japón') + '" value="' + v(F.nombre) + '"></div>' +
    '<div class="field"><label>' + (deuda ? 'Total de la deuda' : 'Objetivo') + ' (' + sym() + ')</label><input id="oObjetivo" type="number" step="0.01" min="0" inputmode="decimal" value="' + v(F.objetivo) + '"></div>' +
    '<div class="field"><label>Fecha objetivo <span class="hint">· opcional</span></label><input id="oFecha" type="date" value="' + v(F.fechaObjetivo) + '"></div>' +
    '<div class="field"><label>' + (deuda ? 'Ya pagado antes' : 'Ya ahorrado antes') + ' (' + sym() + ') <span class="hint">· opcional</span></label><input id="oPrevio" type="number" step="0.01" min="0" inputmode="decimal" value="' + v(F.previo) + '"><div class="rec-hint">Lo que ya ' + (deuda ? 'habíais pagado' : 'teníais ahorrado') + ' entre todos antes de apuntarlo aquí.</div></div>' +
    '<div class="actions"><button class="btn ghost block" ' + cancelar + '>Cancelar</button><button class="btn accent block" ' + act('objGuardar') + '>Guardar</button></div>' +
    (o ? '<button class="btn danger block" style="margin-top:10px;" ' + act('objEliminar') + '>' + ic('trash') + ' Eliminar ' + (deuda ? 'deuda' : 'meta') + ' compartida</button><div class="rec-hint" style="text-align:center;">Se quita para todos. Lo ya aportado o pagado no se borra.</div>' : '');
}
function objLeerForm() {
  const F = FORM, val = (sel) => { const el = $(sel); return el ? el.value : undefined; };
  ['nombre', 'objetivo', 'fechaObjetivo', 'previo'].forEach((k, i) => { const x = val(['#oNombre', '#oObjetivo', '#oFecha', '#oPrevio'][i]); if (x !== undefined) F[k] = x; });
}
function objAbrir(html) { if ($('#sheetBackdrop')) updateSheet(html); else openSheet(html); }
async function objGuardar() {
  objLeerForm();
  const F = FORM, nombre = String(F.nombre || '').trim();
  if (!nombre) return toast('Ponle un nombre');
  const n = (x) => { const y = parseFloat(x); return x === '' || x == null || !isFinite(y) ? null : y; };
  const datos = { nombre, objetivo: n(F.objetivo), fechaObjetivo: F.fechaObjetivo || null, previo: Math.max(0, n(F.previo) || 0) };
  if (datos.objetivo != null && datos.objetivo < 0) return toast('El objetivo no puede ser negativo');
  if (F.id && !objPorId(F.id)) { closeSheet(); return toast('Esa meta o deuda ya no existe: la ha eliminado alguien del grupo'); }
  if (F.guardando) return; F.guardando = true;
  try {
    let gid = F.id ? objPorId(F.id).grupoId : null;
    if (!F.id) {
      if (!F.dest) return toast('Elige con quién la compartes');
      gid = F.dest.slice(2);
      if (F.dest.indexOf('u:') === 0) { const g = await accionGrupo(() => S.db.rpc('crear_directo', { p_user: gid })); if (!g || g === true) return; gid = g; }
    }
    if (objetivosDe(gid, F.tipo).some((x) => x.id !== F.id && normName(x.nombre) === normName(nombre))) return toast('Ya hay una con ese nombre ahí');
    let o;
    try { o = F.id ? await S.db.objetivos.editar(F.id, datos) : await S.db.objetivos.crear(Object.assign({ grupoId: gid, tipo: F.tipo }, datos)); }
    catch (e) { console.error(e); return toast(errGrupo(e)); }
    objAplicarLocal(o); toast(F.id ? 'Guardado' : (F.tipo === 'deuda' ? 'Deuda compartida creada' : 'Meta compartida creada'));
    render();
    const b = !F.id && S._borradorMov; S._borradorMov = null;
    if (b) return openMovForm(null, { tipo: b.tipo, importe: b.importe, fecha: b.fecha, descripcion: b.descripcion, categoria: o.nombre, comp: 'g:' + o.grupoId, objetivo: o.id });
    if (F.volverGrupo && grupoDe(F.volverGrupo)) abrirGrupo(F.volverGrupo); else closeSheet();
  } finally { F.guardando = false; }
}
// Análisis → Deudas: tus deudas y debajo las compartidas
function renderDeudas() {
  const comp = objCompartidos('deuda'), personales = (cfg().deudas || []).some((d) => d && d.nombre);
  const cab = compartidosDisponible() ? '<div style="display:flex;justify-content:flex-end;margin:-4px 0 8px;"><button class="link" ' + act('objNueva', 'deuda') + '>' + ic('plus') + ' Deuda compartida' + badge('compartir') + '</button></div>' : '';
  return cab + (personales || !comp.length ? renderDeudasPersonales() : '') + (comp.length ? '<div class="section-title">Compartidas</div>' + comp.map(objCardHtml).join('') : '');
}
// Tarjeta del Dashboard
function compartidoInicioHtml() {
  if (!compartidosDisponible() || !(S.compartidos || []).length) return '';
  const ids = [...new Set(S.compartidos.map((c) => c.grupoId))].filter((id) => grupoDe(id));
  if (!ids.length) return '';
  const filas = ids.map((id) => ({ g: grupoDe(id), v: miSaldo(id) })).sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const tot = r2(filas.reduce((a, f) => a + f.v, 0));
  return '<div class="section-title">Compartido <button class="link" ' + act('openGrupos') + '>Ver todo</button></div><div class="card pat-card">' +
    '<div class="comp-total tnum" style="color:' + saldoColor(tot) + '">' + (Math.abs(tot) < 0.005 ? 'Estás en paz con todos' : tot > 0 ? 'Te deben ' + money(tot) : 'Debes ' + money(-tot)) + '</div>' +
    filas.slice(0, 4).map((f) => '<div class="pat-row tappable" ' + act('grupoVer', f.g.id) + '><span>' + escapeHtml(nombreDestino(f.g)) + '</span><b class="tnum" style="color:' + saldoColor(f.v) + '">' + saldoTxt(f.v) + '</b><span class="chev-s">' + ic('chevR') + '</span></div>').join('') + '</div>';
}
// Si cambia algo compartido mientras miras un grupo, se actualiza (sin pisar lo que estés escribiendo)
function refrescarSheetCompartido() {
  const b = $('#sheetBackdrop'); if (!b || b.dataset.cerrando || !FORM) return;
  if (FORM.kind === 'obj' && FORM.id && !objPorId(FORM.id)) { closeSheet(); return toast('Esa meta o deuda la ha eliminado alguien del grupo'); }
  const ae = document.activeElement; if (ae && b.contains(ae) && /INPUT|SELECT|TEXTAREA/.test(ae.tagName)) return;
  if (FORM.kind === 'grupo' && FORM.id) updateSheet(grupoHtml(FORM.id));
  else if (FORM.kind === 'grupos') updateSheet(gruposListaHtml());
}


/* ============================================================
   TICKETS (Bloque 8B): foto → artículos → gasto, y reparto por artículo
   La foto no se guarda: se reduce en el móvil, la lee la IA en el servidor
   (función tickets-ia) y se descarta. Límite de lecturas al mes por persona.
   ============================================================ */
const TICKET_LADO = 1568, TICKET_CALIDAD = 0.85;
function ticketsDisponible() { return activosDisponible(); }
const ERR_TICKET = {
  sin_clave: 'La lectura de tickets aún no está activada. Mientras tanto puedes apuntar el gasto a mano.',
  limite: 'Has usado todas las lecturas de tickets de este mes. Se renuevan el día 1.',
  clave_mala: 'La lectura de tickets no está disponible ahora mismo. Apunta el gasto a mano.',
  sin_saldo: 'La lectura de tickets no está disponible ahora mismo. Apunta el gasto a mano.',
  imagen_grande: 'La foto es demasiado grande. Prueba con otra.',
  imagen: 'No se pudo usar esa imagen. Prueba con otra foto.',
  no_ticket: 'No parece un ticket o no se lee bien. Prueba con otra foto: con buena luz, el ticket entero y sin arrugas.',
  sin_sesion: 'Tienes que iniciar sesión.',
};
function errTicket(k) { return ERR_TICKET[k] || 'No se pudo leer el ticket. Revisa tu conexión e inténtalo de nuevo.'; }
async function ticketsApi(body) {
  const c = window.SUPABASE_CONFIG, ses = await window.Auth.getSession();
  if (!ses || !ses.access_token) return { error: 'sin_sesion' };
  const r = await fetch(c.url + '/functions/v1/tickets-ia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ses.access_token, apikey: c.anonKey },
    body: JSON.stringify(body),
  });
  let j; try { j = await r.json(); } catch (e) { j = { error: 'respuesta_invalida' }; }
  if (!r.ok && !j.error) j.error = 'http_' + r.status;
  return j;
}
// Reduce la foto en el propio móvil (lado mayor 1568 px, JPEG): sube menos y la IA no necesita más.
function reducirFoto(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      try {
        const k = Math.min(1, TICKET_LADO / Math.max(img.naturalWidth, img.naturalHeight));
        const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        res({ b64: cv.toDataURL('image/jpeg', TICKET_CALIDAD).split(',')[1], tipo: 'image/jpeg' });
      } catch (e) { URL.revokeObjectURL(url); rej(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('imagen')); };
    img.src = url;
  });
}
function elegirFotoTicket() {
  if (!ticketsDisponible()) return toast('La lectura de tickets no está disponible aquí');
  verBadge('ticket');
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
  inp.onchange = () => { const f = inp.files && inp.files[0]; inp.remove(); if (f) leerTicket(f); };
  document.body.appendChild(inp); inp.click();
}
async function leerTicket(file) {
  S._volverGrupo = null;
  FORM = { kind: 'ticket', cargando: true };
  const F = FORM;
  if ($('#sheetBackdrop')) updateSheet(ticketHtml()); else openSheet(ticketHtml());
  try { F.foto = await (window.__reducirFoto || reducirFoto)(file); }
  catch (e) { F.cargando = false; F.error = 'imagen'; if (FORM === F) updateSheet(ticketHtml()); return; }
  await ticketPedir(F, false);
}
async function ticketPedir(F, preciso) {
  const previo = F.t || null;
  F.cargando = true; F.preciso = preciso; F.error = null; F.t = null;
  if (FORM === F) updateSheet(ticketHtml());
  let r;
  try { r = await (window.__ticketsApi || ticketsApi)({ imagen: F.foto.b64, tipo: F.foto.tipo, preciso, categorias: categoriasPorTipo('Gasto') }); }
  catch (e) { r = { error: 'red' }; }
  F.cargando = false;
  if (r.usados != null) { F.usados = r.usados; F.limite = r.limite; }
  if (!r.error && (!r.ticket || !r.ticket.es_ticket)) r.error = 'no_ticket';
  if (r.error) { F.error = r.error; F.t = previo; if (FORM === F) updateSheet(ticketHtml()); return; }
  const t = r.ticket;
  F.modelo = r.modelo || (preciso ? 'preciso' : 'rapido');
  if (F.modelo === 'preciso') F.foto = null; // ya no hace falta: se descarta
  F.t = {
    comercio: t.comercio || '', fecha: t.fecha && t.fecha <= todayISO() ? t.fecha : todayISO(), total: r2(t.total),
    categoria: t.categoria || sugerirCategoria(t.comercio || '', 'Gasto') || '', notas: t.notas || '',
    articulos: (t.articulos || []).map((a) => ({ nombre: a.nombre, cantidad: num(a.cantidad) || 1, importe: r2(a.importe), quien: null })),
  };
  if (!F.t.total) F.t.total = tkSuma(F);
  F.rep = F.rep || { on: false, dest: '', pagador: miUid() };
  if (FORM === F) updateSheet(ticketHtml());
}
function tkSuma(F) { return r2(F.t.articulos.reduce((a, x) => a + num(x.importe), 0)); }
function miembrosDeDestino(k) {
  const yo = miUid();
  if (!k) return [];
  if (k.indexOf('g:') === 0) { const g = grupoDe(k.slice(2)); return g ? g.miembros.map((m) => ({ uid: m.user_id, nombre: m.nombre })).sort((a, b) => (b.uid === yo) - (a.uid === yo)) : []; }
  return [{ uid: yo, nombre: miNombreAlguno() }, { uid: k.slice(2), nombre: nombreDe(null, k.slice(2)) }];
}
// Reparto por artículo: cada artículo se divide a partes iguales entre quienes lo marcan (al céntimo).
function tkReparto(F) {
  const ms = miembrosDeDestino(F.rep.dest).map((m) => m.uid), tot = {};
  ms.forEach((u) => { tot[u] = 0; });
  F.t.articulos.forEach((a) => {
    let qs = (a.quien || ms).filter((u) => ms.indexOf(u) >= 0); if (!qs.length) qs = ms;
    const c = cents(a.importe), base = Math.trunc(c / qs.length); let resto = c - base * qs.length;
    qs.forEach((u) => { let v = base; if (resto > 0) { v++; resto--; } else if (resto < 0) { v--; resto++; } tot[u] += v; });
  });
  return tot; // céntimos
}
function tkCuadreHtml(F) {
  const sum = tkSuma(F), tot = r2(F.t.total), dif = r2(tot - sum);
  if (Math.abs(dif) < 0.01) return '<div class="tk-ok">' + ic('checkCircle') + ' La suma de los artículos cuadra con el total.</div>';
  return '<div class="tk-warn">Los artículos suman <b class="tnum">' + money(sum) + '</b> y el total del ticket es <b class="tnum">' + money(tot) + '</b> (diferencia ' + money(Math.abs(dif)) + '). Revisa los importes.</div>' +
    '<div class="tk-acciones">' + (F.foto && F.modelo === 'rapido' ? '<button type="button" class="btn sm accent" ' + act('tkPreciso') + '>Leer con más precisión</button>' : '') +
    '<button type="button" class="btn sm ghost" ' + act('tkTotalSuma') + '>Usar la suma como total</button></div>';
}
function tkResumenHtml(F) {
  if (!F.rep || !F.rep.on || !F.rep.dest) return '';
  const tot = tkReparto(F), ms = miembrosDeDestino(F.rep.dest), yo = miUid();
  return '<div class="comp-lbl">A cada uno le toca</div>' + ms.map((m) => '<div class="comp-row"><span class="n">' + (m.uid === yo ? 'Yo' : escapeHtml(m.nombre)) + '</span><b class="tnum">' + money((tot[m.uid] || 0) / 100) + '</b></div>').join('');
}
function ticketHtml() {
  const F = FORM, yo = miUid();
  if (F.cargando) return '<div class="handle"></div><h2>Leyendo el ticket…</h2><div class="card tk-cargando"><div class="spinner"></div><div>' + (F.preciso ? 'Lectura precisa: tarda un poco más.' : 'Tarda unos segundos.') + '</div><div class="rec-hint">La foto no se guarda: se lee y se descarta.</div></div>';
  if (F.error && !F.t) {
    return '<div class="handle"></div><h2>Foto de ticket</h2><div class="card" style="font-size:14px;line-height:1.5;">' + escapeHtml(errTicket(F.error)) + '</div>' +
      '<div class="actions"><button class="btn ghost block" ' + act('closeSheet') + '>Cerrar</button>' +
      (F.error === 'sin_clave' || F.error === 'limite' || F.error === 'clave_mala' || F.error === 'sin_saldo' ? '<button class="btn accent block" ' + act('tkAMano') + '>Apuntar a mano</button>'
        : F.foto && F.error !== 'no_ticket' ? '<button class="btn accent block" ' + act('tkReintentar') + '>Reintentar</button>' : '<button class="btn accent block" ' + act('ticketFoto') + '>Otra foto</button>') + '</div>';
  }
  const t = F.t, rep = F.rep, ds = compartidosDisponible() ? destinosCompartir() : [], ms = rep.on ? miembrosDeDestino(rep.dest) : [];
  const chipsQuien = (a, i) => '<div class="tk-quien">' + ms.map((m) => '<button type="button" class="chip ' + (!a.quien || a.quien.indexOf(m.uid) >= 0 ? 'active' : '') + '" ' + act('tkQuien', i, m.uid) + '>' + (m.uid === yo ? 'Yo' : escapeHtml(m.nombre)) + '</button>').join('') + '</div>';
  return '<div class="handle"></div><h2>Revisa el ticket</h2>' +
    (F.error ? '<div class="tk-warn" style="margin-bottom:10px;">' + escapeHtml(errTicket(F.error)) + '</div>' : '') +
    '<div class="field"><label>Comercio</label><input id="tkComercio" type="text" maxlength="60" value="' + escapeHtml(t.comercio) + '" ' + onInput('tkCampo', 'comercio') + '></div>' +
    '<div class="tk-2"><div class="field"><label>Fecha</label><input id="tkFecha" type="date" value="' + t.fecha + '" ' + onChange('tkCampo', 'fecha') + '></div>' +
    '<div class="field"><label>Total (' + sym() + ')</label><input id="tkTotal" type="number" step="0.01" inputmode="decimal" value="' + t.total + '" ' + onInput('tkCampo', 'total') + '></div></div>' +
    '<div class="section-title">Artículos (' + t.articulos.length + ')</div>' +
    '<div class="tk-cab"><span>Artículo</span><span>Uds.</span><span>Importe</span><span></span></div>' +
    '<div class="tk-list">' + t.articulos.map((a, i) => '<div class="tk-item"><div class="tk-row">' +
      '<input class="tk-n" type="text" maxlength="80" value="' + escapeHtml(a.nombre) + '" ' + onInput('tkArt', i, 'nombre') + '>' +
      '<input class="tk-c" type="number" step="any" min="0" inputmode="decimal" value="' + a.cantidad + '" ' + onInput('tkArt', i, 'cantidad') + '>' +
      '<input class="tk-i" type="number" step="0.01" inputmode="decimal" value="' + a.importe + '" ' + onInput('tkArt', i, 'importe') + '>' +
      '<button type="button" class="tk-x" aria-label="Quitar" ' + act('tkQuitar', i) + '>' + ic('close') + '</button></div>' +
      (rep.on && rep.dest ? chipsQuien(a, i) : '') + '</div>').join('') + '</div>' +
    '<button type="button" class="link" style="margin-top:8px;" ' + act('tkAnadir') + '>' + ic('plus') + ' Añadir artículo</button>' +
    '<div id="tkCuadre" style="margin-top:12px;">' + tkCuadreHtml(F) + '</div>' +
    (t.notas ? '<div class="rec-hint" style="margin-top:8px;">Nota de la lectura: ' + escapeHtml(t.notas) + '</div>' : '') +
    (ds.length ? '<div class="field" style="margin-top:14px;">' + (!rep.on
      ? '<button type="button" class="comp-toggle" ' + act('tkRep', '1') + '>' + ic('users') + '<span>Repartir la cuenta por artículos</span></button>'
      : '<div class="comp-box"><div class="comp-head"><b>' + ic('users') + ' Repartir por artículos</b><button type="button" class="link" ' + act('tkRep', '0') + '>No repartir</button></div>' +
        '<div class="comp-lbl">Con</div><div class="chips">' + ds.map((d) => '<button type="button" class="chip ' + (rep.dest === d.k ? 'active' : '') + '" ' + act('tkDest', d.k) + '>' + (d.grupo ? '👥 ' : '') + escapeHtml(d.label) + '</button>').join('') + '</div>' +
        (rep.dest ? '<div class="comp-lbl">Pagó</div><div class="chips">' + ms.map((m) => '<button type="button" class="chip ' + (rep.pagador === m.uid ? 'active' : '') + '" ' + act('tkPagador', m.uid) + '>' + (m.uid === yo ? 'Yo' : escapeHtml(m.nombre)) + '</button>').join('') + '</div>' +
          '<div class="rec-hint" style="margin-top:8px;">En cada artículo, marca quién lo toma. Lo que marquéis varios se divide a partes iguales.</div>' +
          '<div id="tkResumen">' + tkResumenHtml(F) + '</div>' : '<div class="rec-hint" style="margin-top:6px;">Elige con quién compartes la cuenta.</div>') + '</div>') + '</div>' : '') +
    (F.limite ? '<div class="rec-hint" style="margin-top:10px;">Lecturas este mes: ' + F.usados + ' de ' + F.limite + '. La foto no se ha guardado.</div>' : '') +
    '<div class="actions"><button class="btn ghost block" ' + act('closeSheet') + '>Cancelar</button><button class="btn accent block" ' + act('tkContinuar') + '>Continuar</button></div>';
}
function tkRefrescarParcial() {
  const F = FORM; if (!F || F.kind !== 'ticket' || !F.t) return;
  const c = $('#tkCuadre'); if (c) c.innerHTML = tkCuadreHtml(F);
  const r = $('#tkResumen'); if (r) r.innerHTML = tkResumenHtml(F);
}
// Pasa lo revisado al formulario de siempre (ahí se elige categoría y se guarda, compartido o no).
function tkContinuar() {
  const F = FORM, t = F.t;
  const total = r2(t.total);
  if (!(total > 0)) return toast('Pon el total del ticket');
  const vivos = t.articulos.filter((a) => (a.nombre || '').trim() || num(a.importe));
  const arts = vivos.map((a) => ({ nombre: (a.nombre || '').trim() || 'Artículo', cantidad: num(a.cantidad) || 1, importe: r2(a.importe) }));
  let comp = null;
  if (F.rep.on) {
    if (!F.rep.dest) return toast('Elige con quién repartes la cuenta');
    if (Math.abs(r2(total - tkSuma(F))) >= 0.01) return toast('Para repartir por artículos, la suma tiene que cuadrar con el total');
    const uids = miembrosDeDestino(F.rep.dest).map((m) => m.uid), tot = tkReparto(F);
    if (Object.values(tot).some((v) => v < 0)) return toast('A alguien le sale un importe negativo: revisa los descuentos');
    arts.forEach((a, i) => { a.quien = (vivos[i].quien || uids).filter((u) => uids.indexOf(u) >= 0); });
    comp = { on: true, dest: F.rep.dest, pagador: F.rep.pagador || miUid(), modo: 'importe', incl: {}, vals: {} };
    uids.forEach((u) => { comp.incl[u] = tot[u] > 0; comp.vals[u] = tot[u] > 0 ? String(tot[u] / 100) : ''; });
  }
  F.foto = null;
  openMovForm(null, { tipo: 'Gasto', importe: total, categoria: t.categoria, fecha: t.fecha, descripcion: t.comercio });
  FORM.articulos = arts;
  if (comp) FORM.comp = comp;
  const af = $('#artField'); if (af) af.innerHTML = artFieldHtml();
  refrescarComp();
}
// En el formulario: los artículos del ticket (solo lectura)
function artFieldHtml(ex) {
  const arts = (FORM && FORM.articulos) || (ex && ex.articulos) || null;
  if (!arts || !arts.length) return '';
  return '<details class="tk-det"><summary>🧾 ' + arts.length + (arts.length === 1 ? ' artículo' : ' artículos') + ' del ticket</summary><div class="tk-det-l">' +
    arts.map((a) => '<div class="tk-det-r"><span>' + (num(a.cantidad) && num(a.cantidad) !== 1 ? num(a.cantidad).toLocaleString('es-ES') + ' × ' : '') + escapeHtml(a.nombre) + '</span><b class="tnum">' + money(a.importe) + '</b></div>').join('') + '</div></details>';
}
// Análisis mensual: en qué artículos se va el dinero (solo de gastos con ticket; con lo compartido, tu parte)
function articulosTopHtml(movs) {
  const yo = miUid(), mapa = {};
  movs.forEach((m) => {
    if (m.tipo !== 'Gasto' && m.tipo !== 'Factura') return;
    const c = m.comp, arts = (c ? c.articulos : m.articulos) || [];
    arts.forEach((a) => {
      let v = num(a.importe);
      if (c) { if (Array.isArray(a.quien) && a.quien.length) v = a.quien.indexOf(yo) >= 0 ? v / a.quien.length : 0; else v = num(c.importe) ? v * miParte(c) / num(c.importe) : 0; }
      if (!v) return;
      const k = normName(a.nombre); (mapa[k] = mapa[k] || { nombre: a.nombre, v: 0, n: 0 }); mapa[k].v += v; mapa[k].n += num(a.cantidad) || 1;
    });
  });
  const top = Object.values(mapa).filter((x) => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 8);
  if (!top.length) return '';
  const max = top[0].v;
  return '<div class="section-title">Lo que más compras · según tus tickets</div><div class="card">' + top.map((x) =>
    '<div class="budget-row"><div class="top"><span class="cat">' + escapeHtml(x.nombre) + (x.n > 1 ? ' <span class="hint">×' + x.n.toLocaleString('es-ES', { maximumFractionDigits: 2 }) + '</span>' : '') + '</span><span class="nums"><b class="tnum">' + money(x.v) + '</b></span></div>' +
    '<div class="progress"><div style="width:' + Math.max(2, x.v / max * 100) + '%"></div></div></div>').join('') + '</div>';
}

/* ============================================================
   METAS (Bloque 6): identificador estable, metas de inversión y patrimonio
   ============================================================ */
const RENT_DEFECTO = 4; // % anual: estimación prudente cuando no hay histórico suficiente
function nuevoIdMeta() { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function metasCfg() { return (cfg().ahorro || []).filter((m) => m && m.nombre); }
function tipoMeta(m) { return m && m.tipo === 'inversion' ? 'inversion' : 'ahorro'; }
// Da un identificador a las metas que aún no lo tienen (una vez por sesión). Los movimientos antiguos siguen contando por nombre.
function asegurarIdsMetas() {
  if (S._metaIds || !S.loaded.cfg || !S.db || S.onboarding) return;
  S._metaIds = true;
  const arr = cfg().ahorro || [];
  if (!arr.some((m) => m && m.nombre && !m.id)) return;
  saveConfig({ ahorro: arr.map((m) => (m && m.nombre && !m.id ? Object.assign({}, m, { id: nuevoIdMeta() }) : m)) });
}
function movsDeMeta(m) {
  const n = normName(m.nombre);
  if (tipoMeta(m) === 'inversion') return S.movimientos.filter((x) => x.tipo === 'Inversión' && m.id && x.metaId === m.id);
  return movsPersonales().filter((x) => x.tipo === 'Ahorro' && ((m.id && x.metaId === m.id) || (!x.metaId && normName(x.categoria) === n)));
}
function valorMovInv(x) {
  const v = S.valoracion && S.valoracion.valores && x.activoId ? S.valoracion.valores[x.activoId] : null;
  if (!v || v.cierre_eur == null || x.participaciones == null || x.participaciones === '') return null;
  return Number(x.participaciones) * v.cierre_eur;
}
function asegurarValoracion() {
  const ids = [...new Set(S.movimientos.filter((x) => x.tipo === 'Inversión' && x.activoId).map((x) => x.activoId))];
  if (!activosDisponible() || !ids.length || S._valCarga || S._valProg) return;
  const v = S.valoracion, edad = v ? Date.now() - v.ts : Infinity, faltan = v && ids.some((id) => !(v.valores && v.valores[id]));
  if (!v || edad > 600000 || (faltan && edad > 60000)) S._valProg = setTimeout(() => { S._valProg = null; cargarValoracion(ids); }, 0);
}
function metaInvStats(m) {
  const movs = movsDeMeta(m).filter((x) => x.fecha).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const fuera = num(m.yaAhorrado);
  let aportado = fuera, valor = fuera, sinValorar = 0;
  movs.forEach((x) => { const imp = num(x.importe), v = valorMovInv(x); aportado += imp; if (v == null) { valor += imp; sinValorar++; } else valor += v; });
  const obj = num(m.objetivo), hoy = todayISO();
  // rentabilidad: la que pongas > tu histórico (6 meses o más) > 4 % prudente
  let rent, fuente;
  const manual = m.rentabilidad != null && m.rentabilidad !== '' && isFinite(Number(m.rentabilidad));
  const meses = movs.length ? (uD(hoy) - uD(movs[0].fecha)) / 864e5 / 30.4375 : 0;
  if (manual) { rent = Number(m.rentabilidad); fuente = 'la que has indicado'; }
  else {
    const r = movs.length && meses >= 6 && !sinValorar ? xirr(movs.map((x) => ({ d: x.fecha, c: -num(x.importe) })).concat([{ d: hoy, c: valor - fuera }])) : null;
    if (r != null && isFinite(r)) {
      rent = Math.max(0, Math.min(10, r * 100));
      fuente = 'según tu histórico (' + Math.round(meses) + ' meses)' + (r * 100 > 10 || r < 0 ? ', acotada entre 0 % y 10 %' : '');
    } else { rent = RENT_DEFECTO; fuente = 'estimación prudente: aún no hay 6 meses de histórico'; }
  }
  const i = Math.pow(1 + rent / 100, 1 / 12) - 1;
  const desde = isoDaysAgo(90);
  const ritmo = Math.max(0, movs.filter((x) => x.fecha > desde && x.fecha <= hoy).reduce((a, x) => a + num(x.importe), 0) / 3);
  const dias = m.fechaObjetivo ? daysUntil(m.fechaObjetivo) : null;
  const r = { inv: true, id: m.id, nombre: m.nombre, aportado, valor, gan: valor - aportado, obj, pct: obj > 0 ? valor / obj * 100 : null, falta: Math.max(0, obj - valor),
    n: movs.length, sinValorar, rent, fuente, ritmo, dias, fecha: m.fechaObjetivo || null, necesario: null, llegada: null, estado: 'gris', texto: '' };
  if (obj > 0 && valor < obj) {
    let v = valor;
    for (let k = 1; k <= 600; k++) { v = v * (1 + i) + ritmo; if (v >= obj) { const d = new Date(); d.setMonth(d.getMonth() + k); r.llegada = d; break; } }
  }
  if (obj <= 0) { r.texto = 'Sin objetivo definido'; return r; }
  if (valor >= obj) { r.estado = 'verde'; r.texto = 'Meta lograda'; return r; }
  if (dias == null) { r.texto = 'Sin fecha objetivo'; return r; }
  if (dias < 0) { r.estado = 'rojo'; r.texto = 'La fecha ya pasó y faltan ' + money(r.falta); return r; }
  const nM = Math.max(1, dias / 30.4375), f = Math.pow(1 + i, nM);
  r.necesario = i > 0 ? Math.max(0, (obj - valor * f) * i / (f - 1)) : Math.max(0, (obj - valor) / nM);
  if (r.necesario <= 0.005) { r.estado = 'verde'; r.texto = 'Con lo que vale hoy llegarías sin aportar más'; return r; }
  const ratio = ritmo / r.necesario;
  if (ratio >= 1) { r.estado = 'verde'; r.texto = 'Vas bien: tu ritmo es suficiente'; }
  else if (ratio >= META_UMBRAL_AMARILLO) { r.estado = 'amarillo'; r.texto = 'Ritmo justo: conviene aportar algo más'; }
  else { r.estado = 'rojo'; r.texto = 'Al ritmo actual no llegarías a tiempo'; }
  return r;
}
function metaInvCardHtml(r) {
  const pctC = r.pct == null ? 0 : Math.max(0, Math.min(100, r.pct));
  const pctGan = r.aportado > 0 ? r.gan / r.aportado * 100 : null;
  let h = '<div class="card" style="margin-bottom:12px;">' +
    '<div class="budget-row" style="margin:0;"><div class="top"><span class="cat" style="display:flex;align-items:center;gap:8px;">' + semaforoDot(r.estado) + escapeHtml(r.nombre) + ' <span class="meta-tipo">Inversión</span></span>' +
    '<span class="nums"><b class="tnum">' + (r.pct == null ? '—' : r.pct.toFixed(0) + '%') + '</b></span></div>' +
    '<div class="progress"><div style="width:' + pctC + '%;background:' + SEMAFORO_COLOR[r.estado] + ';"></div></div></div>' +
    '<div class="meta-inv-nums"><div><div class="l">Vale hoy</div><div class="v tnum">' + money(r.valor) + '</div></div>' +
    '<div><div class="l">Aportado</div><div class="v tnum">' + money(r.aportado) + '</div></div>' +
    '<div><div class="l">Resultado</div><div class="v tnum" style="color:' + (r.gan >= 0 ? 'var(--income)' : 'var(--expense)') + '">' + (r.gan >= 0 ? '+' : '−') + money(Math.abs(r.gan)) + (pctGan == null ? '' : ' <small>(' + pct1(pctGan) + ')</small>') + '</div></div></div>' +
    '<div class="summary-line">' + (r.obj > 0 ? 'Objetivo ' + money(r.obj) : 'Sin objetivo') + (r.fecha ? ' · hasta ' + fmtDateLong(r.fecha) : '') + ' · ' + r.n + (r.n === 1 ? ' aportación' : ' aportaciones') + '</div>' +
    '<div style="font-size:13.5px;font-weight:600;color:' + SEMAFORO_COLOR[r.estado] + ';margin:2px 0 6px;">' + escapeHtml(r.texto) + '</div>';
  if (r.necesario != null && r.necesario > 0.005) h += '<div style="font-size:13px;color:var(--text-faint);line-height:1.6;">Para llegar a tiempo necesitas aportar aprox. <b class="tnum" style="color:var(--text);">' + money(r.necesario) + '/mes</b>.</div>';
  if (r.obj > 0 && r.falta > 0) h += '<div style="font-size:13px;color:var(--text-faint);line-height:1.6;">Tu ritmo (últimos 3 meses): <b class="tnum" style="color:var(--text);">' + money(r.ritmo) + '/mes</b>' +
    (r.llegada ? ' · a este ritmo llegarías hacia ' + fmtMesAnio(r.llegada) : ' · sin aportaciones recientes para estimar') + '.</div>';
  h += '<div class="meta-est">📈 Proyección con una rentabilidad del <b>' + fmt2(r.rent).replace(/,00$/, '') + ' % anual</b> (' + escapeHtml(r.fuente) + '). Es una <b>estimación</b>: las inversiones suben y bajan y no hay ninguna garantía.' +
    (r.sinValorar ? ' ' + r.sinValorar + (r.sinValorar === 1 ? ' aportación sin precio automático cuenta' : ' aportaciones sin precio automático cuentan') + ' por lo aportado.' : '') + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:10px;"><button class="btn sm ghost" ' + act('metaAsignar', r.id) + '>Asignar aportaciones</button><button class="btn sm ghost" ' + act('metaEditar', r.id) + '>Editar meta</button></div>';
  return h + '</div>';
}
/* ---- editor de metas ---- */
function metasListaHtml() {
  const ms = metasCfg();
  return '<div class="handle"></div><h2>Metas</h2>' +
    '<div style="font-size:13px;color:var(--text-muted);line-height:1.45;margin:-6px 0 10px;"><b>Ahorro:</b> dinero que apartas (movimientos de tipo Ahorro). <b>Inversión:</b> lo que vas invirtiendo para algo (por ejemplo, la entrada de una casa); su progreso es lo que valen hoy esas inversiones.</div>' +
    (ms.length ? '<div class="list">' + ms.map((m) => '<div class="row" ' + act('metaEditar', m.id || '') + '><span class="dot" style="background:var(--savings)"></span><div class="main"><div class="ttl">' + escapeHtml(m.nombre) + '</div><div class="meta">' + (tipoMeta(m) === 'inversion' ? 'Inversión' : 'Ahorro') + (m.fechaObjetivo ? ' · hasta ' + fmtDateShort(m.fechaObjetivo) : '') + '</div></div><div class="amt tnum">' + (num(m.objetivo) > 0 ? money(m.objetivo) : '—') + '</div></div>').join('') + '</div>'
      : '<div class="card" style="color:var(--text-faint);font-size:13.5px;">Aún no tienes metas.</div>') +
    '<div class="actions"><button class="btn ghost block" ' + act('metaNueva') + '>' + ic('plus') + ' Nueva meta</button>' + (compartidosDisponible() ? '<button class="btn ghost block" ' + act('objNueva', 'ahorro') + '>' + ic('users') + ' Meta compartida</button>' : '') + '</div>' +
    '<div class="actions" style="margin-top:8px;"><button class="btn accent block" ' + act('closeSheet') + '>Listo</button></div>';
}
function metaEditorHtml() {
  const F = FORM, inv = F.tipoMeta === 'inversion';
  const v = (x) => (x == null ? '' : escapeHtml(x));
  return '<div class="handle"></div><h2>' + (F.id ? 'Editar meta' : 'Nueva meta') + '</h2>' +
    '<div class="field"><label>Tipo</label><div class="type-toggle"><button type="button" data-t="Ahorro" class="' + (!inv ? 'active' : '') + '" ' + act('metaTipo', 'ahorro') + '>Ahorro</button><button type="button" data-t="Inversión" class="' + (inv ? 'active' : '') + '" ' + act('metaTipo', 'inversion') + '>Inversión</button></div></div>' +
    '<div class="field"><label>Nombre</label><input id="mNombre" type="text" placeholder="' + (inv ? 'Entrada de la casa' : 'Fondo de emergencia') + '" value="' + v(F.nombre) + '"></div>' +
    '<div class="field"><label>Objetivo (' + sym() + ')</label><input id="mObjetivo" type="number" step="0.01" inputmode="decimal" value="' + v(F.objetivo) + '"></div>' +
    '<div class="field"><label>Fecha objetivo <span class="hint">· opcional</span></label><input id="mFecha" type="date" value="' + v(F.fechaObjetivo) + '"></div>' +
    (inv
      ? '<div class="field"><label>Rentabilidad anual esperada (%) <span class="hint">· opcional</span></label><input id="mRent" type="number" step="0.1" inputmode="decimal" placeholder="Automática" value="' + v(F.rentabilidad) + '"><div class="rec-hint">Si lo dejas vacío se usa la rentabilidad real de las aportaciones de esta meta cuando haya 6 meses de histórico, y si no, un ' + RENT_DEFECTO + ' % prudente. Siempre es una estimación.</div></div>' +
        '<div class="field"><label>Valor de lo invertido fuera de la app (' + sym() + ') <span class="hint">· opcional</span></label><input id="mFuera" type="number" step="0.01" inputmode="decimal" value="' + v(F.yaAhorrado) + '"><div class="rec-hint">Solo si tienes inversiones para esta meta que no apuntas en la app. Lo apuntado se asigna con «Asignar aportaciones».</div></div>'
      : '<div class="field"><label>Ya ahorrado antes (' + sym() + ') <span class="hint">· opcional</span></label><input id="mFuera" type="number" step="0.01" inputmode="decimal" value="' + v(F.yaAhorrado) + '"></div>') +
    '<div class="actions"><button class="btn ghost block" ' + act('openMetas') + '>Cancelar</button><button class="btn accent block" ' + act('metaGuardar') + '>Guardar</button></div>' +
    (F.id ? '<button class="btn danger block" style="margin-top:10px;" ' + act('metaEliminar') + '>' + ic('trash') + ' Eliminar meta</button><div class="rec-hint" style="text-align:center;">Eliminar la meta no borra ningún movimiento.</div>' : '');
}
function metaAbrirEditor(id) {
  const m = id ? metasCfg().find((x) => x.id === id) : null;
  FORM = { kind: 'meta', id: m ? m.id : null, nombreOrig: m ? m.nombre : '', tipoMeta: m ? tipoMeta(m) : 'ahorro', nombre: m ? m.nombre : '', objetivo: m ? m.objetivo : null, fechaObjetivo: m ? m.fechaObjetivo : '', yaAhorrado: m ? m.yaAhorrado : null, rentabilidad: m ? m.rentabilidad : null };
  if ($('#sheetBackdrop')) updateSheet(metaEditorHtml()); else openSheet(metaEditorHtml());
}
function metaLeerForm() {
  const F = FORM, val = (sel) => { const el = $(sel); return el ? el.value : ''; };
  F.nombre = val('#mNombre').trim(); F.objetivo = val('#mObjetivo'); F.fechaObjetivo = val('#mFecha'); F.yaAhorrado = val('#mFuera'); F.rentabilidad = val('#mRent');
}
async function metaGuardar() {
  metaLeerForm();
  const F = FORM;
  if (!F.nombre) return toast('Ponle un nombre a la meta');
  const arr = (cfg().ahorro || []).slice();
  if (arr.some((m) => m && m.nombre && m.id !== F.id && normName(m.nombre) === normName(F.nombre))) return toast('Ya tienes una meta con ese nombre');
  const numOrNull = (x) => { const n = parseFloat(x); return x === '' || x == null || !isFinite(n) ? null : n; };
  const idx = F.id ? arr.findIndex((m) => m && m.id === F.id) : -1;
  const prev = idx >= 0 ? arr[idx] : {};
  const item = Object.assign({}, prev, { id: F.id || nuevoIdMeta(), nombre: F.nombre, tipo: F.tipoMeta, objetivo: numOrNull(F.objetivo), fechaObjetivo: F.fechaObjetivo || null, yaAhorrado: numOrNull(F.yaAhorrado) });
  if (F.tipoMeta === 'inversion') item.rentabilidad = numOrNull(F.rentabilidad); else delete item.rentabilidad;
  // renombrar: los movimientos de Ahorro que se enlazaban por el nombre antiguo pasan a enlazarse por el identificador
  if (F.id && F.nombreOrig && normName(F.nombreOrig) !== normName(F.nombre)) {
    const ligados = S.movimientos.filter((x) => x.tipo === 'Ahorro' && !x.metaId && normName(x.categoria) === normName(F.nombreOrig));
    for (const x of ligados) { if (!(await write(() => S.db.collection('movimientos').doc(x.id).set(Object.assign(stripId(x), { metaId: item.id, categoria: F.nombre }))))) return; }
  }
  if (idx >= 0) arr[idx] = item; else arr.push(item);
  saveConfig({ ahorro: arr });
  FORM = { kind: 'metas' };
  updateSheet(metasListaHtml());
  render();
  toast('Meta guardada');
}
function metaEliminar() {
  const arr = (cfg().ahorro || []).filter((m) => !(m && m.id === FORM.id));
  saveConfig({ ahorro: arr });
  FORM = { kind: 'metas' };
  updateSheet(metasListaHtml());
  render();
  toast('Meta eliminada');
}
/* ---- asignar aportaciones a una meta de inversión ---- */
function asignarHtml() {
  const F = FORM, meta = metasCfg().find((m) => m.id === F.metaId);
  if (!meta) return '';
  const nombresMeta = {}; metasCfg().forEach((m) => { if (m.id) nombresMeta[m.id] = m.nombre; });
  const movs = S.movimientos.filter((x) => x.tipo === 'Inversión').sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const grupos = {};
  movs.forEach((x) => { const k = x.activoId || 'n:' + normName(x.categoria); (grupos[k] = grupos[k] || { nombre: (x.categoria || 'Sin activo').trim(), movs: [] }).movs.push(x); });
  const html = Object.entries(grupos).sort((a, b) => b[1].movs.length - a[1].movs.length).map(([k, g]) => {
    const todas = g.movs.every((x) => F.sel.has(x.id));
    return '<div class="asig-grupo"><div class="asig-head"><b>' + escapeHtml(g.nombre) + '</b><span>' + g.movs.length + ' · ' + money(g.movs.reduce((a, x) => a + num(x.importe), 0)) + '</span>' +
      '<button type="button" class="btn sm ' + (todas ? 'accent' : 'ghost') + '" ' + act('asigGrupo', k) + '>' + (todas ? '✓ Todas' : 'Todas') + '</button></div>' +
      g.movs.map((x) => {
        const otra = x.metaId && x.metaId !== F.metaId && nombresMeta[x.metaId] ? nombresMeta[x.metaId] : '';
        return '<label class="asig-row"><input type="checkbox" ' + (F.sel.has(x.id) ? 'checked' : '') + ' ' + onChange('asigMov', x.id) + '><span>' + fmtDateShort(x.fecha) + ' ' + (x.fecha || '').slice(0, 4) + (x.descripcion ? ' · ' + escapeHtml(x.descripcion) : '') + (otra ? ' · <i>ahora en «' + escapeHtml(otra) + '»</i>' : '') + '</span><b class="tnum">' + money(x.importe) + '</b></label>';
      }).join('') + '</div>';
  }).join('');
  const n = F.sel.size, tot = movs.filter((x) => F.sel.has(x.id)).reduce((a, x) => a + num(x.importe), 0);
  return '<div class="handle"></div><h2>Asignar a «' + escapeHtml(meta.nombre) + '»</h2>' +
    '<div style="font-size:13px;color:var(--text-muted);margin:-6px 0 10px;line-height:1.45;">Marca las aportaciones de inversión que son para esta meta. Lo que no asignes a ninguna meta queda en «General».</div>' +
    (html || '<div class="card" style="color:var(--text-faint);font-size:13.5px;">No tienes movimientos de inversión.</div>') +
    '<div class="rec-prev">Seleccionadas: <b>' + n + '</b> · ' + money(tot) + ' aportados</div>' +
    '<div class="actions"><button class="btn ghost block" ' + act('closeSheet') + '>Cancelar</button><button class="btn accent block" ' + act('asigGuardar') + '>Guardar</button></div>';
}
async function asigGuardar() {
  const F = FORM, cambios = [];
  S.movimientos.filter((x) => x.tipo === 'Inversión').forEach((x) => {
    const quiere = F.sel.has(x.id), tiene = x.metaId === F.metaId;
    if (quiere && !tiene) cambios.push([x, F.metaId]);
    else if (!quiere && tiene) cambios.push([x, null]);
  });
  if (!cambios.length) { closeSheet(); return; }
  F.guardando = true;
  let ok = 0;
  for (const [x, metaId] of cambios) { if (await write(() => S.db.collection('movimientos').doc(x.id).set(Object.assign(stripId(x), { metaId })))) ok++; else break; }
  closeSheet();
  toast(ok === cambios.length ? 'Aportaciones asignadas' : 'Solo se guardaron ' + ok + ' de ' + cambios.length + ' cambios');
}
/* ---- selector de meta en el formulario de inversión ---- */
function metaInvSelectorHtml() {
  const ms = metasCfg().filter((m) => tipoMeta(m) === 'inversion' && m.id);
  if (!ms.length) return '';
  const sel = FORM.metaId && ms.some((m) => m.id === FORM.metaId) ? FORM.metaId : '';
  return '<div class="field"><label>Meta <span class="hint">· para qué es esta inversión</span></label><div class="chips">' +
    [['', 'General']].concat(ms.map((m) => [m.id, m.nombre])).map(([id, n]) => '<button type="button" class="chip ' + (sel === id ? 'active' : '') + '" ' + act('pickMetaInv', id) + '>' + escapeHtml(n) + '</button>').join('') + '</div></div>';
}
/* ---- tarjetas de ingresos / gastos / disponible de un mes (pinchables) ---- */
function kpiMesHtml(k, y, m) {
  const mk = mesClave(y, m);
  return '<div class="kpi-row">' +
    '<div class="kpi income tappable" ' + act('irMovs', 'Ingreso', mk) + '><div class="v tnum">' + moneyShort(k.ingresos) + '</div><div class="l">Ingresos</div></div>' +
    '<div class="kpi expense tappable" ' + act('irMovs', '_gastos', mk) + '><div class="v tnum">' + moneyShort(k.facturas + k.gastos) + '</div><div class="l">Gastos</div></div>' +
    '<div class="kpi avail tappable" ' + act('irMovs', 'Todos', mk) + '><div class="v tnum">' + moneyShort(k.disponible) + '</div><div class="l">Disponible</div></div></div>';
}
/* ---- cuentas y saldos (dinero en el banco, a mano hasta conectar el banco) ---- */
function cuentasHtml() {
  const cs = cfg().cuentas || [];
  return '<div class="handle"></div><h2>Cuentas y saldos</h2>' +
    '<div style="font-size:13px;color:var(--text-muted);line-height:1.45;margin:-6px 0 10px;">Pon cuánto tienes ahora en cada cuenta del banco. Se suma a tu patrimonio. Actualízalo de vez en cuando (más adelante podrá venir solo del banco).</div>' +
    '<div class="card config-list">' + (cs.length ? cs.map((c, i) => '<div class="row2"><input value="' + escapeHtml(c.nombre || '') + '" placeholder="Cuenta (p. ej. Santander)" ' + onChange('cuentaCampo', i, 'nombre') + '>' +
      '<input class="amt" type="number" step="0.01" inputmode="decimal" placeholder="Saldo" value="' + (c.saldo == null ? '' : escapeHtml(c.saldo)) + '" ' + onChange('cuentaCampo', i, 'saldo') + '>' +
      '<button class="rm" aria-label="Quitar" ' + act('cuentaQuitar', i) + '>' + ic('close') + '</button></div>' +
      (c.fecha ? '<div class="cuenta-fecha">Actualizado el ' + fmtDateShort(c.fecha) + ' ' + c.fecha.slice(0, 4) + '</div>' : '')).join('')
      : '<div style="padding:16px;color:var(--text-faint);font-size:13.5px;">Aún no has añadido ninguna cuenta.</div>') + '</div>' +
    '<div style="margin-top:12px;"><button class="btn ghost block" ' + act('cuentaAnadir') + '>' + ic('plus') + ' Añadir cuenta</button></div>' +
    '<div class="actions"><button class="btn accent block" ' + act('cuentasListo') + '>Listo</button></div>';
}
/* ---- patrimonio (solo informativo) ---- */
function cuentasCfg() { return (cfg().cuentas || []).filter((c) => c && c.nombre); }
function patrimonio() {
  let inv = 0, sinValor = 0;
  const banco = cuentasCfg().reduce((a, c) => a + num(c.saldo), 0);
  S.movimientos.forEach((x) => { if (x.tipo !== 'Inversión') return; const v = valorMovInv(x); if (v == null) { inv += num(x.importe); sinValor++; } else inv += v; });
  metasCfg().filter((m) => tipoMeta(m) === 'inversion').forEach((m) => { inv += num(m.yaAhorrado); });
  let ahorro = metasCfg().filter((m) => tipoMeta(m) === 'ahorro').reduce((a, m) => a + metaStats(m).acum, 0);
  let deudas = (cfg().deudas || []).filter((d) => d && d.nombre).map(deudaStats).filter((r) => r.total > 0).reduce((a, r) => a + r.pend, 0);
  // compartido: lo que has aportado a huchas compartidas y tu parte de lo pendiente de deudas compartidas
  const ahorroComp = objCompartidos('ahorro').reduce((a, r) => a + r.mio, 0);
  const deudaComp = objCompartidos('deuda').filter((r) => r.obj > 0).reduce((a, r) => a + r.falta * miProporcion(r.o), 0);
  ahorro += ahorroComp; deudas += deudaComp;
  const fechas = cuentasCfg().map((c) => c.fecha).filter(Boolean).sort();
  return { banco, bancoFecha: fechas.length ? fechas[0] : null, nCuentas: cuentasCfg().length, inv, sinValor, ahorro, deudas, comp: !!(S.objetivos || []).length, total: banco + inv + ahorro - deudas };
}
function patrimonioHtml() {
  if (S.movimientos.some((x) => x.tipo === 'Inversión')) asegurarValoracion();
  const p = patrimonio();
  if (!p.inv && !p.ahorro && !p.deudas && !p.nCuentas) return '';
  const fila = (l, v, signo, color, accion) => '<div class="pat-row tappable" ' + accion + '><span>' + l + '</span><b class="tnum" style="color:' + color + '">' + signo + money(Math.abs(v)) + '</b><span class="chev-s">' + ic('chevR') + '</span></div>';
  const diasBanco = p.bancoFecha ? Math.round((uD(todayISO()) - uD(p.bancoFecha)) / 864e5) : null;
  const cargando = S._valCarga || S._valProg;
  return '<div class="section-title">Patrimonio</div><div class="card pat-card">' +
    '<div class="pat-total tnum">' + money(p.total) + '</div>' +
    (p.nCuentas ? fila('Dinero en el banco' + (diasBanco != null && diasBanco > 30 ? ' · <span style="color:var(--accent)">actualízalo</span>' : ''), p.banco, p.banco >= 0 ? '+' : '−', 'var(--income)', act('openCuentas'))
      : '<div class="pat-row tappable" ' + act('openCuentas') + '><span>Dinero en el banco</span><b style="color:var(--accent)">Añadir saldo</b><span class="chev-s">' + ic('chevR') + '</span></div>') +
    (p.inv || S.movimientos.some((x) => x.tipo === 'Inversión') ? fila('Inversiones (valor de mercado)' + (cargando ? ' · actualizando…' : ''), p.inv, '+', 'var(--income)', act('irAnalisis', 'inversiones')) : '') +
    (p.ahorro || metasCfg().some((m) => tipoMeta(m) === 'ahorro') ? fila('Ahorro en metas', p.ahorro, '+', 'var(--income)', act('goMetas')) : '') +
    (p.deudas ? fila('Deudas pendientes', p.deudas, '−', 'var(--expense)', act('irAnalisis', 'deudas')) : '') +
    '<div class="pat-note">Solo informativo. El saldo del banco lo pones tú en Más → Cuentas y saldos' + (p.bancoFecha ? ' (actualizado el ' + fmtDateShort(p.bancoFecha) + ')' : '') + '.' + (p.sinValor ? ' Las inversiones sin precio automático cuentan por lo aportado.' : '') + (p.comp ? ' De lo compartido cuenta tu parte: lo que has aportado y, en las deudas, tu parte de lo pendiente según el reparto habitual.' : '') + '</div></div>';
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
    (S.objetivos || []).forEach((x) => { if (x.fechaObjetivo) add(x.fechaObjetivo, { k: 'hito', titulo: (x.tipo === 'deuda' ? 'Deuda' : 'Meta') + ' compartida: ' + x.nombre, detalle: 'Fecha objetivo' + (x.objetivo ? ' · ' + money(x.objetivo) : '') }); });
  }
  if (f.movs) movsEfectivos().forEach((m) => {
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
  render();
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
      '<div class="kpi-row"><div class="kpi savings tappable" ' + act('irMovs', 'Inversión', 'todo') + '><div class="v tnum">' + moneyShort(total) + '</div><div class="l">Invertido</div></div>' +
      '<div class="kpi"><div class="v tnum">' + eur0(sumValor) + '</div><div class="l">Valor actual</div></div>' +
      '<div class="kpi ' + (sumGan >= 0 ? 'income' : 'expense') + '"><div class="v tnum">' + signo(sumGan) + eur0(Math.abs(sumGan)) + '</div><div class="l">' + (pctGan == null ? 'Resultado' : signo(sumGan) + Math.abs(pctGan).toFixed(1).replace('.', ',') + ' %') + '</div></div></div>';
  } else {
    h = '<div class="kpi-row"><div class="kpi savings tappable" ' + act('irMovs', 'Inversión', 'todo') + '><div class="v tnum">' + moneyShort(total) + '</div><div class="l">Total invertido</div></div>' +
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
  if (leg) leg.innerHTML = entries.slice(0, 9).map(([name, val], i) => '<span class="tappable" ' + act('irMovs', '_gastos', mesClave(S.anioSel, S.mesSel), name) + '><i style="background:' + PALETTE[i % PALETTE.length] + '"></i>' + escapeHtml(name) + ' · ' + Math.round(val / total * 100) + '%</span>').join('');
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
  repetir: ['NUEVO', '2026-10-09'], inversiones: ['MEJORADO', '2026-10-09'], grupos: ['NUEVO', '2026-10-10'], compartir: ['NUEVO', '2026-10-10'], ticket: ['NUEVO', '2026-10-10'],
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
  if (lsGet('unirse')) return; // primero la invitación
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
  if (nuevos.ahorro.length) patch.ahorro = (c.ahorro || []).concat(nuevos.ahorro.map((n) => ({ id: nuevoIdMeta(), nombre: n, tipo: 'ahorro', objetivo: null, fechaObjetivo: null })));
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
  const movs = movsEfectivos().filter((m) => m.tipo === rc.tipo && m.fecha && normName(m.categoria) === n).map((m) => ({ m, t: uD(m.fecha).getTime() }));
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
  return [...new Set(movsEfectivos().filter((m) => m.tipo === tipo && m.fecha && m.fecha >= lim && normName(m.categoria) === n).map((m) => m.fecha))].sort();
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
    '<button class="menu-item" ' + act('openMetas') + '><span class="ic">' + ic('flag') + '</span>Metas<span style="margin-left:auto;color:var(--text-faint);font-size:13px;">ahorro e inversión</span><span class="chev">' + ic('chevR') + '</span></button>' +
    ['deudas', 'ingresos', 'metodosPago', 'categoriasTareas'].map(item).join('') +
    '<button class="menu-item" ' + act('openReglas') + '><span class="ic">' + ic('tag') + '</span>Reglas de categorías' + badge('reglas') + '<span class="chev">' + ic('chevR') + '</span></button>' +
    '<button class="menu-item" ' + act('openTabsAn') + '><span class="ic">' + ic('chart') + '</span>Pestañas de Análisis<span class="chev">' + ic('chevR') + '</span></button></div>' +
    '<div class="section-title">Cuenta y seguridad</div><div class="card menu">' +
    '<button class="menu-item" ' + act('openMoneda') + '><span class="ic">' + ic('chart') + '</span>Moneda<span style="margin-left:auto;color:var(--text-faint);font-size:13px;">' + monedaCod() + ' ' + sym() + '</span><span class="chev">' + ic('chevR') + '</span></button>' +
    (mfaDisponible() ? '<button class="menu-item" ' + act('openSeguridad') + '><span class="ic">' + ic('alert') + '</span>Verificación en dos pasos<span class="chev">' + ic('chevR') + '</span></button>' : '') + '</div>' +
    '<div class="section-title">Compartir</div><div class="card menu"><button class="menu-item" ' + act('openGrupos') + '><span class="ic">' + ic('users') + '</span>Grupos y personas' + badge('grupos') + '<span style="margin-left:auto;color:var(--text-faint);font-size:13px;">' + (S.grupos ? S.grupos.filter((g) => g.tipo === 'grupo').length || '' : '') + '</span><span class="chev">' + ic('chevR') + '</span></button></div>' +
    '<div class="section-title">Novedades</div><div class="card menu"><button class="menu-item" ' + act('verNovedades', '1') + '><span class="ic">' + ic('flag') + '</span>Qué hay de nuevo<span style="margin-left:auto;color:var(--text-faint);font-size:13px;">' + (NOVEDADES[0] ? escapeHtml(NOVEDADES[0].titulo) : '') + '</span><span class="chev">' + ic('chevR') + '</span></button></div>' +
    '<div class="section-title">Tus datos</div><div class="card menu">' +
    '<button class="menu-item" ' + act('openCuentas') + '><span class="ic">' + ic('bank') + '</span>Cuentas y saldos<span class="chev">' + ic('chevR') + '</span></button>' +
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
  const payload = { exportadoEl: new Date().toISOString(), movimientos: S.movimientos, tareas: S.tareas, golf: S.golf, config: S.config, compartidos: S.compartidos || [], objetivosCompartidos: S.objetivos || [] };
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
const SHEET_X = () => '<button class="sheet-x" aria-label="Cerrar" ' + act('closeSheet') + '>' + ic('close') + '</button>';
// Arrastrar la hoja hacia abajo (desde arriba del todo) para cerrarla
function activarArrastreSheet(sheet) {
  if (!sheet || sheet._arrastre) return; sheet._arrastre = true;
  let y0 = null, dy = 0, activo = false;
  sheet.addEventListener('touchstart', (e) => {
    if (sheet.scrollTop > 0 || e.touches.length !== 1 || (e.target.closest && e.target.closest('input,select,textarea,.tr-chart'))) { y0 = null; return; }
    y0 = e.touches[0].clientY; dy = 0; activo = false;
  }, { passive: true });
  sheet.addEventListener('touchmove', (e) => {
    if (y0 == null) return;
    dy = e.touches[0].clientY - y0;
    if (!activo && dy < 6) { if (dy < -6) y0 = null; return; }
    activo = true;
    sheet.style.transition = 'none';
    sheet.style.transform = 'translateY(' + Math.max(0, dy) + 'px)';
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  const fin = () => {
    if (y0 == null) return; y0 = null;
    if (!activo) return; activo = false;
    sheet.style.transition = '';
    if (dy > 100) { sheet.style.transform = 'translateY(110%)'; closeSheet(); }
    else sheet.style.transform = '';
  };
  sheet.addEventListener('touchend', fin); sheet.addEventListener('touchcancel', fin);
}
function openSheet(html) {
  const host = $('#sheetHost'); if (!host) return;
  _sheetGen++;
  host.innerHTML = '<div class="sheet-backdrop" id="sheetBackdrop" role="dialog" aria-modal="true"><div class="sheet">' + SHEET_X() + html + '</div></div>';
  activarArrastreSheet(host.querySelector('.sheet'));
  requestAnimationFrame(() => { const b = $('#sheetBackdrop'); if (b && !b.dataset.cerrando) b.classList.add('open'); });
}
function updateSheet(html) { const b = $('#sheetBackdrop'), s = b && !b.dataset.cerrando ? b.querySelector('.sheet') : null; if (s) s.innerHTML = SHEET_X() + html; else openSheet(html); } // si se estaba cerrando, se abre de nuevo
function closeSheet() {
  const b = $('#sheetBackdrop'); if (!b) return;
  b.dataset.cerrando = '1';
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
  goTab: ([id]) => { S.volverA = null; if (id === 'movimientos') S.movCat = ''; if (id === 'analisis') { S.tab = 'inicio'; S.inicioSub = 'analisis'; } else { S.tab = id; if (id === 'inicio') S.inicioSub = 'dashboard'; } render(); window.scrollTo(0, 0); },
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
  openMovForm: ([id]) => { S._volverGrupo = null; openMovForm(id || null); },
  pickTipo: ([t], el) => {
    FORM.tipo = t;
    $$('#tipoToggle button').forEach((b) => b.classList.toggle('active', b.getAttribute('data-t') === t));
    const chips = $('#catChips'); if (chips) chips.innerHTML = chipsHtml(t, ($('#fCategoria') || {}).value || '');
    const inv = $('#invFields'); if (inv) inv.innerHTML = invFieldsHtml(t, '');
    const cl = $('#catLabel'); if (cl) cl.innerHTML = catLabel(t);
    syncCatField();
    if (FORM.comp && FORM.comp.on) compAsegurarDestino();
    refrescarComp();
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
  onImporteInput: () => { updatePreview(); if (FORM.comp && FORM.comp.on) { if (FORM.comp.modo === 'igual') { const r = $('#compReparto'); if (r) r.innerHTML = compRepartoHtml(); } else refrescarComp(true); } },
  pickCat: ([c]) => {
    const inp = $('#fCategoria'); if (inp) inp.value = c; if (FORM) FORM.catAuto = false; setTimeout(refrescarReglaBox, 0);
    $$('#catChips .chip').forEach((b) => b.classList.toggle('active', decodeURIComponent((b.getAttribute('data-click') || '').split('|')[1] || '') === c));
  },
  onCatInput: (_a, el) => { if (FORM) FORM.catAuto = false; refrescarReglaBox(); $$('#catChips .chip').forEach((b) => b.classList.toggle('active', decodeURIComponent((b.getAttribute('data-click') || '').split('|')[1] || '') === el.value.trim())); },
  saveMov: () => saveMov(),
  deleteMov: (_a, el) => confirmDelete(el, doDeleteMov),
  // tickets
  ticketFoto: () => elegirFotoTicket(),
  tkReintentar: () => { if (FORM.kind === 'ticket' && FORM.foto) ticketPedir(FORM, !!FORM.preciso); },
  tkPreciso: () => { if (FORM.kind === 'ticket' && FORM.foto) ticketPedir(FORM, true); },
  tkAMano: () => { S._volverGrupo = null; openMovForm(null, { tipo: 'Gasto' }); },
  tkCampo: ([k], el) => { const t = FORM.t; if (!t) return; if (k === 'total') { t.total = numCampo(el.value); tkRefrescarParcial(); } else t[k] = el.value; },
  tkArt: ([i, k], el) => { const a = FORM.t && FORM.t.articulos[Number(i)]; if (!a) return; a[k] = k === 'nombre' ? el.value : numCampo(el.value); if (k === 'importe') tkRefrescarParcial(); },
  tkQuitar: ([i]) => { FORM.t.articulos.splice(Number(i), 1); updateSheet(ticketHtml()); },
  tkAnadir: () => { FORM.t.articulos.push({ nombre: '', cantidad: 1, importe: 0, quien: null }); updateSheet(ticketHtml()); const ns = $$('#sheetBackdrop .tk-n'); if (ns.length) ns[ns.length - 1].focus(); },
  tkTotalSuma: () => { FORM.t.total = tkSuma(FORM); const el = $('#tkTotal'); if (el) el.value = FORM.t.total; tkRefrescarParcial(); },
  tkRep: ([on]) => { const R = FORM.rep; R.on = on === '1'; if (R.on && !R.dest) { const k = destinoPorDefecto(); if (k) R.dest = k; } updateSheet(ticketHtml()); },
  tkDest: ([k]) => { const R = FORM.rep; R.dest = k; if (!miembrosDeDestino(k).some((m) => m.uid === R.pagador)) R.pagador = miUid(); FORM.t.articulos.forEach((a) => { a.quien = null; }); updateSheet(ticketHtml()); },
  tkPagador: ([u]) => { FORM.rep.pagador = u; updateSheet(ticketHtml()); },
  tkQuien: ([i, u], el) => {
    const a = FORM.t.articulos[Number(i)], todos = miembrosDeDestino(FORM.rep.dest).map((m) => m.uid);
    const q = (a.quien || todos).slice(), j = q.indexOf(u);
    if (j >= 0) { if (q.length === 1) return toast('Al menos una persona tiene que tomarlo'); q.splice(j, 1); } else q.push(u);
    a.quien = q.length === todos.length ? null : q;
    el.classList.toggle('active', j < 0);
    tkRefrescarParcial();
  },
  tkContinuar: () => tkContinuar(),
  // gastos compartidos
  compOn: () => { verBadge('compartir'); FORM.comp = FORM.comp || {}; FORM.comp.on = true; if (S.grupos == null) cargarGrupos().then(() => refrescarComp()); compAsegurarDestino(); refrescarComp(); },
  compOff: () => {
    const c = FORM.compId ? compPorId(FORM.compId) : null;
    if (c && c.pagadoPor !== miUid()) return toast('Solo quien lo pagó puede dejar de compartirlo. Si no se hizo, elimínalo.');
    FORM.comp.on = false; refrescarComp();
    if (c) toast('Al guardar dejará de estar compartido y contará entero como tuyo');
  },
  compDest: ([k]) => { compPrepararDestino(k); refrescarComp(); },
  compPagador: ([u]) => {
    const cp = FORM.comp, solo = cp.modo === 'igual' && Object.keys(cp.incl || {}).filter((k) => cp.incl[k]).join() === cp.pagador;
    cp.pagador = u;
    if (FORM.tipo === 'Ahorro' && solo) { cp.incl = {}; cp.incl[u] = true; } // la aportación sigue siendo de quien aporta
    refrescarComp();
  },
  compObjetivo: ([id]) => { FORM.comp.objetivo = id; const o = objPorId(id), c = $('#fCategoria'); if (o && c) c.value = o.nombre; refrescarComp(); },
  objNueva: ([tipo, gid]) => {
    const enForm = FORM && FORM.kind === 'mov' && !FORM.id && !FORM.compId && $('#fImporte');
    S._borradorMov = enForm ? { tipo: FORM.tipo, importe: $('#fImporte').value, fecha: ($('#fFecha') || {}).value, descripcion: ($('#fDesc') || {}).value } : null;
    const ds = destinosCompartir(), gs = ds.filter((d) => d.grupo);
    FORM = { kind: 'obj', tipo: tipo === 'deuda' ? 'deuda' : 'ahorro', id: null, volverGrupo: gid || null, dest: gid ? 'g:' + gid : gs.length === 1 ? gs[0].k : ds.length === 1 ? ds[0].k : '' };
    objAbrir(objEditorHtml());
  },
  objEditar: ([id, gid]) => {
    const o = objPorId(id); if (!o) return toast('Ya no existe');
    FORM = { kind: 'obj', tipo: o.tipo, id, volverGrupo: gid || null, dest: 'g:' + o.grupoId, nombre: o.nombre, objetivo: o.objetivo, fechaObjetivo: o.fechaObjetivo, previo: o.previo || '' };
    objAbrir(objEditorHtml());
  },
  objDest: ([k]) => { objLeerForm(); FORM.dest = k; updateSheet(objEditorHtml()); },
  objCancelar: () => {
    const F = FORM, b = S._borradorMov; S._borradorMov = null;
    if (b && !F.id) return openMovForm(null, { tipo: b.tipo, importe: b.importe, fecha: b.fecha, descripcion: b.descripcion });
    if (F.volverGrupo && grupoDe(F.volverGrupo)) abrirGrupo(F.volverGrupo); else closeSheet();
  },
  objGuardar: () => objGuardar(),
  objEliminar: (_a, el) => confirmDelete(el, async () => {
    const F = FORM;
    try { await S.db.objetivos.borrar(F.id); } catch (e) { console.error(e); return toast(errGrupo(e)); }
    objQuitarLocal(F.id); toast('Eliminada'); render();
    if (F.volverGrupo && grupoDe(F.volverGrupo)) abrirGrupo(F.volverGrupo); else closeSheet();
  }),
  objAportar: ([id]) => {
    const o = objPorId(id); if (!o) return;
    const abierta = $('#sheetBackdrop') && !$('#sheetBackdrop').dataset.cerrando;
    S._volverGrupo = (abierta && FORM && FORM.kind === 'obj' && FORM.volverGrupo) || null;
    openMovForm(null, { tipo: o.tipo === 'deuda' ? 'Deuda' : 'Ahorro', categoria: o.nombre, comp: 'g:' + o.grupoId, objetivo: o.id });
  },
  compModo: ([m]) => { compCambiarModo(m); refrescarComp(); },
  compIncl: ([u], el) => { FORM.comp.incl[u] = !!el.checked; const r = $('#compReparto'); if (r) r.innerHTML = compRepartoHtml(); },
  compVal: ([u], el) => { FORM.comp.vals = FORM.comp.vals || {}; FORM.comp.vals[u] = el.value; refrescarComp(true); },
  compIrGrupos: () => H.openGrupos([]),
  deleteComp: (_a, el) => confirmDelete(el, doDeleteComp),
  compAbrir: ([id, gid]) => { S._volverGrupo = gid || null; openCompForm(id); },
  compNuevoEn: ([gid]) => { S._volverGrupo = gid; openMovForm(null, { tipo: 'Gasto', comp: 'g:' + gid }); },
  compVerTodos: ([gid]) => { FORM.verTodos = true; updateSheet(grupoHtml(gid)); },
  saldarAbrir: ([gid, de, a, imp]) => { FORM = { kind: 'saldar', gid, de, a, max: r2(Number(imp)) }; updateSheet(saldarHtml(FORM)); },
  saldarGuardar: async () => {
    const f = FORM, imp = r2(numCampo(($('#sImporte') || {}).value)), fecha = ($('#sFecha') || {}).value || todayISO();
    if (!(imp > 0)) return toast('Pon un importe');
    if (imp > f.max + 0.004) return toast('Es más de lo que se debe (' + money(f.max) + ')');
    if (f.guardando) return; f.guardando = true;
    try {
      const c = await S.db.compartidos.crear({ grupoId: f.gid, fecha, tipo: 'Liquidación', categoria: 'Liquidación', descripcion: '', importe: imp, pagadoPor: f.de, reparto: { [f.a]: imp }, modo: 'importe' });
      compAplicarLocal(c); toast('Pago registrado'); render(); abrirGrupo(f.gid);
    } catch (e) { console.error(e); toast(errGrupo(e)); } finally { f.guardando = false; }
  },
  liqEliminar: ([id], el) => confirmDelete(el, async () => {
    const c = compPorId(id);
    try { await S.db.compartidos.borrar(id); } catch (e) { console.error(e); return toast(errGrupo(e)); }
    compQuitarLocal(id); toast('Pago eliminado'); render();
    if (c && grupoDe(c.grupoId)) abrirGrupo(c.grupoId); else closeSheet();
  }),
  personaNueva: () => { FORM = { kind: 'personaNueva' }; updateSheet(personaNuevaHtml()); },
  personaCrear: async () => {
    if (FORM.creando) return; FORM.creando = true;
    const nom = (($('#pMiNombre') || {}).value || '').trim() || nombreSugerido();
    const t = await accionGrupo(() => S.db.rpc('invitar_persona', { p_mi_nombre: nom }));
    FORM.creando = false;
    if (!t || t === true) return;
    const url = APP_URL + '?unirse=' + encodeURIComponent(t);
    FORM.url = FORM.ultimoEnlace = url; FORM.msg = FORM.ultimoMsg = mensajePersona(url);
    if (FORM.kind === 'personaNueva') updateSheet(personaNuevaHtml());
    render();
  },
  grupoRepartoAbrir: ([id]) => { const g = grupoDe(id); if (g) { FORM = { kind: 'grupoReparto', id }; updateSheet(grupoRepartoHtml(g)); } },
  grupoRepartoIgual: async ([id]) => { if (await accionGrupo(() => S.db.grupos.reparto(id, null), 'Reparto: a partes iguales')) abrirGrupo(id); },
  grupoRepartoGuardar: async ([id]) => {
    const g = grupoDe(id); if (!g) return;
    const r = {}; let sum = 0;
    for (const m of g.miembros) { const el = document.getElementById('rep_' + m.user_id); const v = r2(Math.max(0, numCampo(el && el.value))); r[m.user_id] = v; sum += v; }
    if (Math.abs(sum - 100) > 0.011) return toast('Suman ' + fmtPct(sum) + ' y tienen que sumar 100 %');
    if (await accionGrupo(() => S.db.grupos.reparto(id, r), 'Reparto guardado')) abrirGrupo(id);
  },
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
  openMetas: () => { FORM = { kind: 'metas' }; if ($('#sheetBackdrop')) updateSheet(metasListaHtml()); else openSheet(metasListaHtml()); },
  metaNueva: () => metaAbrirEditor(null),
  metaEditar: ([id]) => metaAbrirEditor(id || null),
  metaTipo: ([t]) => { if (FORM.kind !== 'meta') return; metaLeerForm(); FORM.tipoMeta = t; updateSheet(metaEditorHtml()); },
  metaGuardar: () => metaGuardar(),
  metaEliminar: (_, el) => confirmDelete(el, metaEliminar),
  metaAsignar: ([id]) => { FORM = { kind: 'asignar', metaId: id, sel: new Set(S.movimientos.filter((x) => x.tipo === 'Inversión' && x.metaId === id).map((x) => x.id)) }; openSheet(asignarHtml()); },
  asigMov: ([id], el) => { if (el.checked) FORM.sel.add(id); else FORM.sel.delete(id); updateSheet(asignarHtml()); },
  asigGrupo: ([k]) => {
    const ids = S.movimientos.filter((x) => x.tipo === 'Inversión' && (x.activoId || 'n:' + normName(x.categoria)) === k).map((x) => x.id);
    const todas = ids.every((id) => FORM.sel.has(id));
    ids.forEach((id) => { if (todas) FORM.sel.delete(id); else FORM.sel.add(id); });
    updateSheet(asignarHtml());
  },
  asigGuardar: () => { if (!FORM.guardando) asigGuardar(); },
  pickMetaInv: ([id]) => { FORM.metaId = id || null; $$('#invFields .chips .chip').forEach((b) => { const a = decodeURIComponent((b.getAttribute('data-click') || '').split('|')[1] || ''); if ((b.getAttribute('data-click') || '').indexOf('pickMetaInv') === 0) b.classList.toggle('active', a === (id || '')); }); },
  irMovs: ([tipo, periodo, cat]) => irMovs({ tipo, periodo, cat }),
  irAnalisis: ([sub]) => { S.tab = 'inicio'; S.inicioSub = 'analisis'; S.analisisSub = sub; if (sub === 'inversiones') verBadge('inversiones'); render(); window.scrollTo(0, 0); },
  verMes: ([y, m]) => { S.anioSel = Number(y); S.mesSel = Number(m); S.generalSub = 'mensual'; render(); window.scrollTo(0, 0); },
  volver: () => { const v = S.volverA; S.volverA = null; if (!v) return; S.tab = v.tab; S.inicioSub = v.inicioSub; S.analisisSub = v.analisisSub; S.generalSub = v.generalSub; S.movCat = ''; S.movPeriodo = 'todo'; S.movFiltroTipo = 'Todos'; render(); window.scrollTo(0, 0); },
  quitarMovCat: () => { S.movCat = ''; render(); },
  openCuentas: () => { FORM = { kind: 'cuentas' }; if ($('#sheetBackdrop')) updateSheet(cuentasHtml()); else openSheet(cuentasHtml()); },
  cuentaAnadir: () => { saveConfig({ cuentas: (cfg().cuentas || []).concat([{ id: nuevoIdMeta(), nombre: '', saldo: null, fecha: null }]) }); updateSheet(cuentasHtml()); const ins = $$('#sheetBackdrop .config-list .row2 input:first-child'); if (ins.length) ins[ins.length - 1].focus(); },
  cuentaQuitar: ([i]) => { const cs = (cfg().cuentas || []).slice(); cs.splice(Number(i), 1); saveConfig({ cuentas: cs }); updateSheet(cuentasHtml()); render(); },
  cuentaCampo: ([i, f], el) => {
    const cs = (cfg().cuentas || []).slice(), c = Object.assign({}, cs[Number(i)] || {});
    if (f === 'saldo') { const n = parseFloat(el.value); c.saldo = el.value === '' || !isFinite(n) ? null : n; c.fecha = todayISO(); }
    else c.nombre = el.value.trim();
    cs[Number(i)] = c; saveConfig({ cuentas: cs }); render();
  },
  cuentasListo: () => { const cs = (cfg().cuentas || []).filter((c) => c && (c.nombre || c.saldo != null)).map((c) => (c.nombre ? c : Object.assign({}, c, { nombre: 'Cuenta' }))); saveConfig({ cuentas: cs }); closeSheet(); render(); },
  openGrupos: () => { verBadge('grupos'); FORM = { kind: 'grupos' }; if ($('#sheetBackdrop')) updateSheet(gruposListaHtml()); else openSheet(gruposListaHtml()); cargarGrupos().then(() => { if (FORM && FORM.kind === 'grupos') updateSheet(gruposListaHtml()); render(); }); },
  grupoNuevo: () => { FORM = { kind: 'grupoNuevo' }; updateSheet(grupoNuevoHtml()); setTimeout(() => { const el = $('#gNombre'); if (el) el.focus(); }, 60); },
  grupoCrear: async () => {
    const n = ($('#gNombre').value || '').trim(), yo = ($('#gMiNombre').value || '').trim();
    if (!n) return toast('Ponle un nombre al grupo');
    if (FORM.creando) return; FORM.creando = true;
    const id = await accionGrupo(() => S.db.rpc('crear_grupo', { p_nombre: n, p_mi_nombre: yo || nombreSugerido() }), 'Grupo creado');
    FORM.creando = false;
    if (id) abrirGrupo(id); render();
  },
  grupoVer: ([id]) => abrirGrupo(id),
  grupoRenombrar: async ([id]) => { const n = ($('#gRenombrar').value || '').trim(); if (!n) return toast('Pon un nombre'); if (await accionGrupo(() => S.db.grupos.renombrar(id, n), 'Nombre cambiado')) abrirGrupo(id); },
  grupoMiNombre: async ([id]) => { const n = ($('#gMiNombreEd').value || '').trim(); if (!n) return toast('Pon un nombre'); if (await accionGrupo(() => S.db.grupos.miNombre(id, n), 'Guardado')) abrirGrupo(id); },
  grupoInvitar: async ([id]) => {
    if (FORM.creandoEnlace) return; FORM.creandoEnlace = true;
    const t = await accionGrupo(() => S.db.rpc('crear_invitacion', { p_grupo: id }));
    FORM.creandoEnlace = false;
    if (!t || t === true) return;
    const g = (S.grupos || []).find((x) => x.id === id), url = APP_URL + '?unirse=' + encodeURIComponent(t);
    FORM.ultimoEnlace = url;
    FORM.ultimoMsg = 'Te invito a mi grupo «' + (g ? g.nombre : '') + '» en PalomApp para compartir gastos. Ábrelo aquí (vale 7 días y para una sola persona): ' + url;
    try { FORM.invitaciones = await S.db.grupos.invitaciones(id); } catch (e) { /* */ }
    if (FORM.kind === 'grupo') updateSheet(grupoHtml(id));
  },
  grupoCopiar: async () => { try { await navigator.clipboard.writeText(FORM.ultimoEnlace); toast('Enlace copiado'); } catch (e) { toast('Mantén pulsado el enlace de abajo para copiarlo'); } },
  grupoCompartir: async () => { try { await navigator.share({ text: FORM.ultimoMsg }); } catch (e) { /* cancelado */ } },
  grupoAnularTodos: async ([id]) => {
    const ps = (FORM.invitaciones || []).filter((x) => !x.usada_en && new Date(x.expira) > new Date());
    for (const x of ps) { if (!(await accionGrupo(() => S.db.rpc('anular_invitacion', { p_token: x.token })))) break; }
    FORM.ultimoEnlace = ''; toast('Enlaces anulados'); abrirGrupo(id);
  },
  grupoQuitar: ([id, uid], el) => confirmDelete(el, async () => { if (await accionGrupo(() => S.db.rpc('quitar_miembro', { p_grupo: id, p_user: uid }), 'Miembro quitado')) abrirGrupo(id); }),
  grupoSalir: ([id], el) => confirmDelete(el, async () => { if (await accionGrupo(() => S.db.rpc('salir_grupo', { p_grupo: id }), 'Has salido del grupo')) { FORM = { kind: 'grupos' }; updateSheet(gruposListaHtml()); render(); } }),
  grupoCerrar: ([id], el) => confirmDelete(el, async () => { if (await accionGrupo(() => S.db.rpc('cerrar_grupo', { p_grupo: id }), 'Grupo cerrado')) { FORM = { kind: 'grupos' }; updateSheet(gruposListaHtml()); render(); } }),
  unirseConfirmar: async () => {
    if (FORM.uniendo) return; FORM.uniendo = true;
    const nombre = ($('#uNombre').value || '').trim() || nombreSugerido();
    const id = await accionGrupo(() => S.db.rpc('unirse', { p_token: FORM.token, p_nombre: nombre }), '¡Te has unido al grupo!');
    FORM.uniendo = false;
    if (!id) return;
    lsSet('unirse', ''); S._uniendo = false;
    render(); abrirGrupo(id);
  },
  unirseCerrar: ([grupoId]) => { lsSet('unirse', ''); S._uniendo = false; if (grupoId) { cargarGrupos().then(() => abrirGrupo(grupoId)); } else closeSheet(); },
  unirseOtraCuenta: async () => { closeSheet(); S._uniendo = false; await window.Auth.signOut(); toast('Inicia sesión con la otra cuenta y se completará la invitación'); },
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
  S.movimientos = []; S.tareas = []; S.golf = []; S.config = null; S.compartidos = null; S.objetivos = null; S._gruposVistos = {};
  S.loaded = { mov: false, tar: false, golf: false, cfg: false };
  renderShell();
  $('#content').innerHTML = loadingHtml();
  subscribeAll();
  render();
  checkOnboarding();
}
function leaveApp() {
  S.appStarted = false;
  S.grupos = null; S._uniendo = false; S._gruposCargando = false; S.compartidos = null; S.objetivos = null; S._volverGrupo = null;
  S.user = null; S.db = null;
  S.onboarding = null; S._onboardPending = false;
  _unsubs.forEach((u) => { try { u(); } catch (e) { /* noop */ } });
  _unsubs = [];
  renderLoginScreen();
}
async function main() {
  applyTheme();
  capturarEnlaceUnirse();
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

window.__APP__ = { imp: () => IMP, metasStats, patrimonio, metaInvStats, S, main, render, kpisMes, H, cfg, aplicaEstado, parseNum, parseFechaImp, parseCSV, sugerirCategoria, reglaPara, ocurrencias, aprenderRegla, reglaTexto, siguienteFechaTarea, avisosRecurrentes, leerTicket, tkReparto, articulosTopHtml, movsEfectivos, deudasDe, calcReparto, saldosDe, objStats, patrimonio };
if (!window.__NO_AUTOSTART__) main();
})();

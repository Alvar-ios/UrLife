// 11/11/2026 · Calidad: utilidades para las pruebas «tocando de verdad» (test14x_toques_*.js).
// Todo pasa por el despachador real de la app: el.click() y eventos input/change que suben por el documento,
// igual que en el móvil. Nunca se llama a H.accion([...]) para el paso que se está probando.
// Solo datos inventados. No es una prueba (no empieza por «test»): lo usan las pruebas.
const { makeEnv, sleep } = require('./harness.js');

let fails = 0, conocidos = 0, arreglados = [];
const errores = [];
let CONOCIDOS = new Set();
// Fallos de la app ya descritos en docs/salud/2026-11-11-auditoria-toques.md: imprimen «FALLO CONOCIDO» (no rompen npm test)
function fallosConocidos(lista) { CONOCIDOS = new Set(lista); }
function ok(c, m, clave) {
  if (clave && CONOCIDOS.has(clave)) {
    if (c) { console.log('PASS ' + m + '  (el fallo conocido ' + clave + ' parece arreglado: quítalo de la lista)'); arreglados.push(clave); }
    else { console.log('FALLO CONOCIDO [' + clave + '] ' + m); conocidos++; }
    return c;
  }
  console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; return c;
}

let ctx = '';
function paso(t) { ctx = t; console.log('-- ' + t); }
process.on('unhandledRejection', (e) => errores.push([ctx, 'promesa: ' + String((e && e.stack) || e).split('\n').slice(0, 2).join(' · ')]));

// Capa de datos falsa de Juntos y funciones de Supabase. Guarda cada llamada en `srv` para comprobarla.
function capaJuntos(w, srv, yo) {
  const lista = (next, arr) => { setTimeout(() => next(arr.filter((x) => !x.borrado).map((x) => Object.assign({}, x))), 0); return () => {}; };
  const subs = { comp: [], agenda: [] }, arrs = { comp: srv.comp, agenda: srv.agenda };
  srv.avisar = (clave) => (subs[clave] || []).forEach((f) => lista(f, arrs[clave])); // el aviso «en vivo» de Supabase
  let n = 0;
  const tabla = (nombre, arr, clave) => ({
    suscribir: (next) => { subs[clave] = subs[clave] || []; subs[clave].push(next); return lista(next, arr); },
    crear: async (o) => { srv.llamadas.push([nombre + '.crear', o]); const r = Object.assign({}, o, { id: nombre[0] + 'x' + (++n), creadoPor: yo, createdAt: new Date().toISOString() }); arr.push(r); (subs[clave] || []).forEach((f) => lista(f, arr)); return Object.assign({}, r); },
    editar: async (id, o) => { srv.llamadas.push([nombre + '.editar', id, o]); const x = arr.find((y) => y.id === id); if (!x) throw new Error('no_autorizado'); Object.assign(x, o, { updatedAt: new Date().toISOString(), editadoPor: yo }); (subs[clave] || []).forEach((f) => lista(f, arr)); return Object.assign({}, x); },
    borrar: async (id) => { srv.llamadas.push([nombre + '.borrar', id]); const x = arr.find((y) => y.id === id); if (!x) throw new Error('no_autorizado'); x.borrado = new Date().toISOString(); (subs[clave] || []).forEach((f) => lista(f, arr)); return [{ id }]; },
    restaurar: async (id) => { srv.llamadas.push([nombre + '.restaurar', id]); const x = arr.find((y) => y.id === id); if (x) delete x.borrado; (subs[clave] || []).forEach((f) => lista(f, arr)); return x ? Object.assign({}, x) : null; },
  });
  Object.assign(w.Data, {
    uid: () => yo,
    grupos: {
      listar: async () => ({ grupos: srv.grupos.map((g) => Object.assign({}, g)), miembros: srv.miembros.map((m) => Object.assign({}, m)), sinCuenta: srv.sinCuenta.map((m) => Object.assign({}, m)) }),
      invitaciones: async () => [], renombrar: async (id, nm) => { srv.llamadas.push(['grupos.renombrar', id, nm]); const g = srv.grupos.find((x) => x.id === id); if (g) g.nombre = nm; },
      miNombre: async () => {}, edicion: async () => [{}], reparto: async () => [{}],
    },
    compartidos: tabla('compartidos', srv.comp, 'comp'),
    objetivos: tabla('objetivos', srv.objetivos, 'obj'),
    carpetas: tabla('carpetas', srv.carpetas, 'carp'),
    agenda: tabla('agenda', srv.agenda, 'agenda'),
    aportes: Object.assign(tabla('aportes', srv.aportes, 'ap'), { guardar: async (o) => { srv.llamadas.push(['aportes.guardar', o]); return o; }, quitar: async (id) => { srv.llamadas.push(['aportes.quitar', id]); return []; } }),
    agendaPermisos: { listar: async () => [], ocultas: async () => [], conmigo: async () => [], deOtro: async () => [], crear: async (o) => { srv.llamadas.push(['agendaPermisos.crear', o]); return Object.assign({ id: 'p1' }, o); }, editar: async (id, o) => o, borrar: async () => null, ocultar: async () => null, mostrar: async () => null },
    divisas: { cambio: async () => null },
    carburantes: { ultimos: async () => srv.carburantes || [] },
    rpc: async (fn, p) => { srv.llamadas.push(['rpc.' + fn, p]); if (srv.rpc[fn]) return srv.rpc[fn](p); return null; },
  });
}

function preparar(w, opts, srv) {
  w.confirm = () => true; w.alert = () => {}; w.print = () => {};
  w.open = (u) => { srv.abiertos.push(String(u)); return null; };
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.URL.createObjectURL = () => 'blob:prueba'; w.URL.revokeObjectURL = () => {};
  w.addEventListener('error', (ev) => errores.push([ctx, 'error: ' + (ev.message || (ev.error && ev.error.message) || ev)]));
  w.console.error = (...a) => { const t = String((a[0] && a[0].stack) || a[0]); if (/TypeError|ReferenceError|RangeError|is not a function|Cannot read|is not defined/.test(t) && !/Failed to fetch/.test(t)) errores.push([ctx, 'console.error: ' + t.split('\n')[0]]); };
  w.SUPABASE_CONFIG = { url: 'https://prueba.invalid', anonKey: 'clave-publica-de-prueba' };
  w.Auth.getSession = async () => ({ access_token: 'token-de-prueba', user: { id: opts.yo, email: 'prueba@example.invalid' } });
  w.Auth.signIn = async (email, pass) => { srv.llamadas.push(['auth.signIn', email]); if (pass !== 'contraseña-buena') throw new Error('Invalid login'); return {}; };
  w.Auth.signOut = async () => { srv.llamadas.push(['auth.signOut']); };
  // funciones de Supabase (tickets, trayecto, borrar cuenta, activos): respuestas simuladas
  w.fetch = async (url, o) => {
    const body = o && o.body ? JSON.parse(o.body) : null; srv.fetch.push([String(url), body]);
    const fn = (String(url).match(/functions\/v1\/([\w-]+)/) || [])[1];
    const r = srv.funciones[fn] ? await srv.funciones[fn](body) : { error: 'sin_simular' };
    return { ok: !r.error, status: r.error ? 400 : 200, json: async () => r, headers: { get: () => null } };
  };
  // como data-layer.js: tras guardar o borrar se vuelve a leer la tabla (el aviso «en vivo» de Supabase)
  const orig = w.Data.collection, subsCol = {};
  w.Data.collection = (n) => {
    const c = orig(n), avisar = () => (subsCol[n] || []).forEach((cb) => c.onSnapshot(cb));
    return { onSnapshot: (cb, err) => { (subsCol[n] = subsCol[n] || []).push(cb); return c.onSnapshot(cb, err); },
      // srv.perderRespuestas = N: el servidor guarda, pero la respuesta se pierde por el camino (red del móvil) N veces
      add: async (d) => { srv.escrituras.push([n, 'add']); const r = await c.add(d); avisar(); if (srv.perderRespuestas > 0) { srv.perderRespuestas--; const er = new Error('TypeError: Failed to fetch'); er.code = 'unknown'; throw er; /* así lo entrega data-layer.js (pgError) cuando falla la red */ } return r; },
      doc: (id) => { const dd = c.doc(id || ('n' + Math.random().toString(36).slice(2, 9))); return { id: dd.id, set: async (d) => { srv.escrituras.push([n, 'set', dd.id]); if (srv.lento) await sleep(srv.lento); if (srv.fallarEscritura) { const er = new Error('TypeError: Failed to fetch'); er.code = 'unknown'; throw er; } await dd.set(d); avisar(); if (srv.perderRespuestas > 0) { srv.perderRespuestas--; const er = new Error('TypeError: Failed to fetch'); er.code = 'unknown'; throw er; } }, delete: async () => { srv.escrituras.push([n, 'delete', dd.id]); await dd.delete(); avisar(); } }; } };
  };
  if (opts.pre) opts.pre(w);
}

// Crea la app con datos inventados. opts: {cfg, movs, version, juntos:true, yo, grupos, miembros, sinCuenta, comp}
async function abrir(opts) {
  opts = Object.assign({ yo: 'u-yo' }, opts || {});
  const srv = { llamadas: [], escrituras: [], fetch: [], abiertos: [], funciones: Object.assign({}, opts.funciones || {}), rpc: Object.assign({}, opts.rpc || {}), grupos: opts.grupos || [], miembros: opts.miembros || [], sinCuenta: opts.sinCuenta || [], comp: opts.comp || [], objetivos: [], carpetas: [], agenda: opts.agenda || [], aportes: [], carburantes: opts.carburantes || [] };
  const e = makeEnv({ cfg: opts.cfg || {}, movs: opts.movs || [], session: { user: { id: opts.yo, email: 'prueba@example.invalid' } }, version: Object.assign({ tu: 0, agenda: 0, crear: 0, importe: 0, bienvenida: 0 }, opts.version || {}), url: opts.url,
    pre: (w) => { preparar(w, opts, srv); if (opts.juntos !== false) capaJuntos(w, srv, opts.yo); } });
  e.srv = srv; e.A = e.w.__APP__; e.S = e.A.S;
  await sleep(opts.espera || 200);
  return e;
}

// Busca el botón con data-click que empieza por `accion` (y, si se da, cuyo texto encaje con `texto`) y lo toca de verdad.
function buscar(e, accion, texto, donde) {
  const raiz = donde === 'hoja' ? e.doc.querySelector('#sheetHost') : donde === 'app' ? e.doc.querySelector('#content') || e.doc : e.doc;
  if (!raiz) return null;
  const re = texto instanceof RegExp ? texto : texto ? new RegExp(texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  return [...raiz.querySelectorAll('[data-click]')].find((x) => {
    const p = x.getAttribute('data-click').split('|');
    if (p[0] !== accion) return false;
    if (re && !re.test((x.textContent || '') + ' ' + (x.getAttribute('aria-label') || '') + ' ' + p.slice(1).map(decodeURIComponent).join(' '))) return false;
    return !x.disabled;
  }) || null;
}
async function tocar(e, accion, texto, donde, ms) {
  const el = buscar(e, accion, texto, donde);
  if (!el) throw new Error('No encuentro el botón «' + accion + (texto ? ' · ' + texto : '') + '» (' + ctx + ')');
  el.click(); await sleep(ms == null ? 40 : ms); return el;
}
async function tocarSiHay(e, accion, texto, donde, ms) { const el = buscar(e, accion, texto, donde); if (!el) return null; el.click(); await sleep(ms == null ? 40 : ms); return el; }
// Escribe en un campo como el móvil: valor + evento input + evento change
async function escribir(e, sel, v, ms) {
  const el = typeof sel === 'string' ? e.doc.querySelector(sel) : sel;
  if (!el) throw new Error('No encuentro el campo ' + sel + ' (' + ctx + ')');
  if (el.focus) el.focus();
  el.value = v; el.dispatchEvent(new e.w.Event('input', { bubbles: true })); el.dispatchEvent(new e.w.Event('change', { bubbles: true }));
  await sleep(ms == null ? 30 : ms); return el;
}
// Teclea un importe con el teclado propio de la app (botones tecK)
async function teclearImporte(e, txt) {
  for (const c of String(txt)) {
    const el = [...e.doc.querySelectorAll('#sheetHost [data-click]')].find((x) => x.getAttribute('data-click') === 'tecK|' + encodeURIComponent(c));
    if (!el) throw new Error('No encuentro la tecla ' + c);
    el.click(); await sleep(5);
  }
}
const hoja = (e) => { const b = e.doc.querySelector('#sheetBackdrop'); return b && !b.dataset.cerrando ? (b.textContent || '') : ''; };
const hojaAbierta = (e) => !!hoja(e);
const pantalla = (e) => (e.doc.querySelector('#content') || e.doc.body).textContent || '';
const aviso = (e) => (e.doc.querySelector('#toast .toast-txt') || {}).textContent || '';
async function deshacerToast(e) { const b = e.doc.querySelector('#toast .toast-btn'); if (!b) return false; b.click(); await sleep(120); return true; }
const atras = (e) => e.w.__atras();
const movs = (e) => Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v));
const app = (e) => (e.store.cfg.app || {});
async function cerrarHoja(e) { const b = e.doc.querySelector('#sheetBackdrop'); if (b) { b.click(); } await sleep(260); }
async function ir(e, tab) { const b = e.doc.querySelector('[data-click="goTab|' + tab + '"]'); if (b) b.click(); else e.A.H.goTab([tab]); await sleep(60); }

function fin(nombre) {
  const err = errores.splice(0);
  err.forEach((x) => console.log('   · ' + x[0] + '  →  ' + x[1]));
  ok(!err.length, nombre + ': ningún toque lanza un error sin controlar (' + err.length + ')', 'ERRORES_' + nombre);
  console.log((fails ? fails + ' FALLOS' : 'TODO OK') + (conocidos ? ' · ' + conocidos + ' fallos conocidos de la app (ver docs/salud/2026-11-11-auditoria-toques.md)' : '') + (arreglados.length ? ' · arreglados: ' + arreglados.join(', ') : ''));
  process.exit(fails ? 1 : 0);
}
// fechas como las ve la app (respeta FECHA_MAS, ver harness.js)
const ahoraApp = () => new Date(Date.now() + Number(process.env.FECHA_MAS || 0) * 864e5);
const isoDe = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const diasAtras = (n) => { const d = ahoraApp(); d.setDate(d.getDate() - n); return isoDe(d); };
const hoy = () => diasAtras(0);
module.exports = { ahoraApp, isoDe, diasAtras, hoy, abrir, tocar, tocarSiHay, buscar, escribir, teclearImporte, hoja, hojaAbierta, pantalla, aviso, deshacerToast, atras, movs, app, cerrarHoja, ir, ok, paso, fin, fallosConocidos, sleep, errores };

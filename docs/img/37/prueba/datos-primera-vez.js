// PRUEBA de Producto (docs/37), NO es parte de la app ni de npm test. Para usarlo, copia los dos archivos a tests/capturas/ y ejecuta: node tests/capturas/primera-vez.js
// PRUEBA DE PRODUCTO (docs/37): capa de datos inventada para ver la app como persona NUEVA. Nada real.
// Escenario en localStorage 'capEscenario': 'nuevo' (viene de Google Play sin invitación) o 'invitado' (llega con enlace de Juntos).
(function () {
  var hoy = new Date(), iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  var dia = function (n) { var d = new Date(hoy); d.setDate(d.getDate() + n); return iso(d); };
  var esc = (function () { try { return localStorage.getItem('capEscenario') || 'nuevo'; } catch (e) { return 'nuevo'; } })();
  var YO = 'u-yo', ANA = 'u-ana', BEA = 'u-bea', G1 = 'g-viaje';
  var cfg = { app: null, meta: { onboarded: false } };
  var unido = false;
  var grupos = function () { return unido ? [{ id: G1, nombre: 'Escapada a Asturias', tipo: 'grupo', edicion: 'todos', created_at: dia(-3) }] : []; };
  var miembros = function () { return unido ? [{ grupo_id: G1, user_id: ANA, nombre: 'Ana', rol: 'admin' }, { grupo_id: G1, user_id: BEA, nombre: 'Bea', rol: 'miembro' }, { grupo_id: G1, user_id: YO, nombre: 'Álex', rol: 'miembro' }] : []; };
  var ts = function (n) { return new Date(Date.now() - n * 864e5).toISOString(); };
  var comp = function () { return unido ? [
    { id: 'k1', grupoId: G1, fecha: dia(-1), tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Cena en Cudillero', importe: 87, pagadoPor: ANA, reparto: { [YO]: 29, [ANA]: 29, [BEA]: 29 }, modo: 'igual', creadoPor: ANA, createdAt: ts(1) },
    { id: 'k2', grupoId: G1, fecha: dia(-2), tipo: 'Gasto', categoria: 'Transporte', descripcion: 'Gasolina', importe: 60, pagadoPor: BEA, reparto: { [YO]: 20, [ANA]: 20, [BEA]: 20 }, modo: 'igual', creadoPor: BEA, createdAt: ts(2) }] : []; };
  var compCb = [];
  var store = { movimientos: {}, tareas: {}, golf: {} }, cbs = {};
  var vacio = function (next) { setTimeout(function () { next([]); }, 0); return function () {}; };
  var lista = function (o) { return Object.keys(o).map(function (id) { return { id: id, data: function () { return o[id]; } }; }); };
  var aviso = function (nm) { (cbs[nm] || []).forEach(function (cb) { cb({ docs: lista(store[nm]) }); }); };
  window.Data = {
    uid: function () { return YO; },
    doc: function (p) { var k = p.split('/')[1]; return { get: async function () { return { exists: !!cfg[k], data: function () { return cfg[k]; } }; }, set: async function (v) { cfg[k] = v; }, update: async function (v) { cfg[k] = Object.assign({}, cfg[k], v); },
      onSnapshot: function (cb) { setTimeout(function () { cb({ exists: !!cfg[k], data: function () { return cfg[k]; } }); }, 0); return function () {}; } }; },
    collection: function (nm) { var o = store[nm] || (store[nm] = {}); return { onSnapshot: function (cb) { (cbs[nm] = cbs[nm] || []).push(cb); setTimeout(function () { cb({ docs: lista(o) }); }, 0); return function () {}; },
      add: async function (d) { var id = 'n' + Date.now(); o[id] = d; setTimeout(function () { aviso(nm); }, 0); return { id: id }; }, doc: function (id) { return { id: id, set: async function (d) { o[id] = d; aviso(nm); }, update: async function (d) { o[id] = Object.assign({}, o[id], d); aviso(nm); }, delete: async function () { delete o[id]; aviso(nm); } }; } }; },
    grupos: { listar: async function () { return { grupos: grupos(), miembros: miembros(), sinCuenta: [] }; }, invitaciones: async function () { return []; } },
    compartidos: { suscribir: function (next) { compCb.push(next); setTimeout(function () { next(comp()); }, 0); return function () {}; }, crear: async function (o) { return o; }, editar: async function (id, o) { return o; }, borrar: async function () { return true; } },
    objetivos: { suscribir: vacio }, aportes: { suscribir: vacio }, carpetas: { suscribir: vacio },
    agenda: { suscribir: vacio }, agendaPermisos: { listar: async function () { return []; }, ocultas: async function () { return []; }, conmigo: async function () { return []; }, deOtro: async function () { return []; } },
    divisas: { cambio: async function () { return null; } },
    rpc: async function (fn) {
      if (fn === 'ver_invitacion') return { valida: true, nombre: 'Escapada a Asturias', invita: 'Ana', miembros: 2, tipo: 'grupo' };
      if (fn === 'unirse') { unido = true; setTimeout(function () { compCb.forEach(function (f) { f(comp()); }); }, 0); return G1; }
      return [];
    },
  };
  window.Auth = { onChange: function (f) { setTimeout(function () { f({ user: { email: 'nuevo@example.invalid', id: YO } }); }, 0); }, getSession: async function () { return { user: { id: YO } }; }, signIn: function () {}, signOut: function () {}, resetPassword: function () {} };
  window.__CAPTURAS__ = { G1: G1, esc: esc };
})();

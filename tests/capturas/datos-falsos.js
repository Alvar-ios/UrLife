// Capa de datos inventada para las capturas (tests/capturas). Nada de datos reales. Sustituye a data-layer.js.
(function () {
  var hoy = new Date(), iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  var dia = function (n) { var d = new Date(hoy); d.setDate(d.getDate() + n); return iso(d); };
  var YO = 'u-yo', ANA = 'u-ana', BEA = 'u-bea', G1 = 'g-piso', G2 = 'g-viaje';
  var movs = {}, n = 0, add = function (o) { movs['m' + (++n)] = Object.assign({ metodoPago: 'Tarjeta' }, o); };
  add({ tipo: 'Ingreso', categoria: 'Nómina', importe: 1850, fecha: dia(-25), descripcion: 'Nómina de la empresa con un nombre bastante largo' });
  [['Supermercado', 84.35, -2, 'Compra semanal en el súper del barrio'], ['Restaurantes', 36, -3, 'Cena'], ['Transporte', 42.5, -5, 'Gasolina'], ['Ocio', 18.9, -6, 'Cine y palomitas'],
   ['Hogar', 620, -20, 'Alquiler'], ['Suscripciones', 12.99, -8, 'Música'], ['Salud', 23.4, -9, 'Farmacia'], ['Ropa', 59.95, -11, 'Zapatillas de correr muy cómodas'], ['Supermercado', 47.1, -12, 'Mercado'], ['Restaurantes', 22, -1, 'Desayuno']]
    .forEach(function (x) { add({ tipo: 'Gasto', categoria: x[0], importe: x[1], fecha: dia(x[2]), descripcion: x[3], articulos: x[2] === -2 ? [{ n: 'Pan', i: 1.2 }] : undefined }); });
  add({ tipo: 'Factura', categoria: 'Luz', importe: 61.2, fecha: dia(-14), descripcion: 'Luz' });
  add({ tipo: 'Ahorro', categoria: 'Viaje a Japón', importe: 150, fecha: dia(-15), descripcion: '' });
  add({ tipo: 'Inversión', categoria: 'Fondo indexado', importe: 200, fecha: dia(-16), descripcion: '' });
  for (var k = 1; k <= 2; k++) add({ tipo: 'Gasto', categoria: 'Supermercado', importe: 70 + k, fecha: dia(-30 * k - 3), descripcion: 'Súper' }), add({ tipo: 'Ingreso', categoria: 'Nómina', importe: 1850, fecha: dia(-30 * k - 25), descripcion: 'Nómina' });
  var tareas = {
    t1: { nombre: 'Llamar al seguro del coche para revisar la póliza', estado: 'Pendiente', prioridad: 'Alta', fechaLimite: dia(0), categoria: 'Casa' },
    t2: { nombre: 'Comprar regalo', estado: 'Pendiente', prioridad: 'Media', fechaLimite: dia(2) },
    t3: { nombre: 'Pagar comunidad', estado: 'Completado', prioridad: 'Media', fechaLimite: dia(-1) },
  };
  var cfg = { app: { nombre: 'Álex Prueba', onboarded: true, novedadesVistas: '9999-12-31', compararVersiones: false,
    cuentas: [{ id: 'c1', nombre: 'Cuenta nómina', banco: 'santander', saldo: 2430.55, saldoFecha: dia(-30), principal: true }, { id: 'c2', nombre: 'Ahorro', banco: 'myinvestor', saldo: 5200, saldoFecha: dia(-30) }],
    metas: [{ id: 'mt1', nombre: 'Viaje a Japón', objetivo: 3000, fecha: dia(200) }],
    deudas: [{ nombre: 'Préstamo del coche', total: 9000, previo: 3000, cuotaMes: 250 }],
    categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 300 }, { nombre: 'Restaurantes', presupuesto: 120 }, { nombre: 'Transporte' }, { nombre: 'Ocio', presupuesto: 60 }, { nombre: 'Hogar' }, { nombre: 'Suscripciones' }, { nombre: 'Salud' }, { nombre: 'Ropa' }] },
    meta: { onboarded: true } };
  var grupos = [{ id: G1, nombre: 'Piso compartido de la calle Mayor', tipo: 'grupo', edicion: 'todos', created_at: dia(-60) }, { id: G2, nombre: '', tipo: 'directo', edicion: 'todos', created_at: dia(-60) }];
  var miembros = [{ grupo_id: G1, user_id: YO, nombre: 'Álex', rol: 'admin' }, { grupo_id: G1, user_id: ANA, nombre: 'Ana', rol: 'miembro' }, { grupo_id: G1, user_id: BEA, nombre: 'Beatriz', rol: 'miembro' },
    { grupo_id: G2, user_id: YO, nombre: 'Álex', rol: 'admin' }, { grupo_id: G2, user_id: ANA, nombre: 'Ana', rol: 'miembro' }];
  var ts = function (n) { return new Date(Date.now() - n * 864e5).toISOString(); };
  var comp = [
    { id: 'k1', grupoId: G1, fecha: dia(-2), tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Compra grande del mes para la casa', importe: 96, pagadoPor: ANA, reparto: { [YO]: 32, [ANA]: 32, [BEA]: 32 }, modo: 'igual', creadoPor: ANA, createdAt: ts(2), updatedAt: ts(1), editadoPor: BEA },
    { id: 'k2', grupoId: G1, fecha: dia(-6), tipo: 'Factura', categoria: 'Luz', descripcion: 'Luz', importe: 75, pagadoPor: YO, reparto: { [YO]: 25, [ANA]: 25, [BEA]: 25 }, modo: 'igual', creadoPor: YO, createdAt: ts(6) },
    { id: 'k3', grupoId: G2, fecha: dia(-4), tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Cena', importe: 48, pagadoPor: YO, reparto: { [YO]: 24, [ANA]: 24 }, modo: 'igual', creadoPor: YO, createdAt: ts(4) },
  ];
  var hist = [
    { id: 3, grupo_id: G1, compartido_id: 'k1', accion: 'editado', hecho_por: BEA, hecho_por_nombre: 'Beatriz', hecho_en: ts(1), antes: { importe: 90, reparto: { [YO]: 30, [ANA]: 30, [BEA]: 30 } }, despues: { importe: 96, reparto: { [YO]: 32, [ANA]: 32, [BEA]: 32 } }, descripcion: comp[0].descripcion, tipo: 'Gasto', importe: 96, pagado_por: ANA, reparto: comp[0].reparto, borrado: null, puede_recuperar: false, nombres: {} },
    { id: 2, grupo_id: G1, compartido_id: 'k9', accion: 'borrado', hecho_por: ANA, hecho_por_nombre: 'Ana', hecho_en: ts(1.5), antes: null, despues: null, descripcion: 'Taxi al aeropuerto de madrugada', tipo: 'Gasto', importe: 48, pagado_por: YO, reparto: { [YO]: 16, [ANA]: 16, [BEA]: 16 }, borrado: ts(1.5), puede_recuperar: true, nombres: {} },
    { id: 1, grupo_id: G1, compartido_id: 'k1', accion: 'creado', hecho_por: ANA, hecho_por_nombre: 'Ana', hecho_en: ts(2), antes: null, despues: { importe: 90, pagado_por: ANA, reparto: { [YO]: 30, [ANA]: 30, [BEA]: 30 } }, descripcion: comp[0].descripcion, tipo: 'Gasto', importe: 96, pagado_por: ANA, reparto: comp[0].reparto, borrado: null, puede_recuperar: false, nombres: {} },
  ];
  var store = { movimientos: movs, tareas: tareas, golf: {} };
  var vacio = function (next) { setTimeout(function () { next([]); }, 0); return function () {}; };
  var lista = function (o) { return Object.keys(o).map(function (id) { return { id: id, data: function () { return o[id]; } }; }); };
  window.Data = {
    uid: function () { return YO; },
    doc: function (p) { var k = p.split('/')[1]; return { get: async function () { return { exists: !!cfg[k], data: function () { return cfg[k]; } }; }, set: async function (v) { cfg[k] = v; }, update: async function (v) { cfg[k] = Object.assign({}, cfg[k], v); },
      onSnapshot: function (cb) { setTimeout(function () { cb({ exists: !!cfg[k], data: function () { return cfg[k]; } }); }, 0); return function () {}; } }; },
    collection: function (nm) { var o = store[nm] || (store[nm] = {}); return { onSnapshot: function (cb) { setTimeout(function () { cb({ docs: lista(o) }); }, 0); return function () {}; },
      add: async function (d) { var id = 'n' + Date.now(); o[id] = d; return { id: id }; }, doc: function (id) { return { id: id, set: async function (d) { o[id] = d; }, update: async function (d) { o[id] = Object.assign({}, o[id], d); }, delete: async function () { delete o[id]; } }; } }; },
    grupos: { listar: async function () { return { grupos: grupos, miembros: miembros, sinCuenta: [] }; }, invitaciones: async function () { return []; } },
    compartidos: { suscribir: function (next) { setTimeout(function () { next(comp); }, 0); return function () {}; }, crear: async function (o) { return o; }, editar: async function (id, o) { return o; }, borrar: async function () { return true; } },
    objetivos: { suscribir: vacio }, aportes: { suscribir: vacio }, carpetas: { suscribir: vacio },
    agenda: { suscribir: vacio }, agendaPermisos: { listar: async function () { return []; }, ocultas: async function () { return []; }, conmigo: async function () { return []; }, deOtro: async function () { return []; } },
    rpc: async function (fn) { if (fn === 'historial_grupo') return hist; return []; },
  };
  window.Auth = { onChange: function (f) { setTimeout(function () { f({ user: { email: 'prueba@example.invalid', id: YO } }); }, 0); }, getSession: async function () { return { user: { id: YO } }; }, signIn: function () {}, signOut: function () {}, resetPassword: function () {} };
  window.__CAPTURAS__ = { G1: G1 };
})();

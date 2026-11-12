// Juegos de datos INVENTADOS y deterministas para medir el rendimiento (docs/40, A1). Nada de datos reales.
// Uso: const { generar, capaDatos } = require('./generar.js');  generar('ligero' | 'normal' | 'pesado')
//      node tests/datos/generar.js            → enseña cuántas cosas trae cada juego
//      node tests/datos/generar.js pesado     → escribe el juego en JSON por la salida
// Las fechas cuelgan de «hoy» (como tests/capturas/datos-falsos.js) para que el mes actual siempre tenga datos;
// todo lo demás (importes, categorías, orden) sale de un generador con semilla fija: dos pasadas el mismo día dan lo mismo.
const JUEGOS = {
  ligero: { movs: 50, dias: 60, cuentas: 1, grupos: 0, comp: 0, tareas: 5, metas: 1, deudas: 0, fijos: 2 },
  normal: { movs: 2000, dias: 365, cuentas: 3, grupos: 2, comp: 80, tareas: 40, metas: 2, deudas: 1, fijos: 5 },
  pesado: { movs: 10000, dias: 730, cuentas: 8, grupos: 6, comp: 900, tareas: 300, metas: 6, deudas: 3, fijos: 12 },
};
const CATS = [['Supermercado', 300, ['Fruta', 'Carne', 'Limpieza']], ['Restaurantes', 120, ['Cenas', 'Cafés']], ['Transporte', 0, ['Gasolina', 'Metro']], ['Ocio', 60, []], ['Hogar', 0, ['Muebles']],
  ['Suscripciones', 0, []], ['Salud', 0, ['Farmacia']], ['Ropa', 80, []], ['Regalos', 0, []], ['Mascotas', 0, []], ['Deporte', 40, []], ['Viajes', 0, ['Hotel', 'Vuelos']]];
const DESCS = ['Compra semanal', 'Cena', 'Gasolina', 'Cine', 'Farmacia', 'Zapatillas', 'Mercado', 'Desayuno', 'Regalo de cumpleaños', 'Pienso', 'Gimnasio', 'Hotel', 'Taxi', 'Libros', 'Ferretería', 'Peluquería', 'Bar de abajo', 'Pedido a domicilio', 'Parking', 'Peaje'];
const BANCOS = ['santander', 'bbva', 'caixabank', 'myinvestor', 'revolut', 'ing', 'openbank', 'sabadell'];
const PERSONAS = ['Ana', 'Beatriz', 'Carlos', 'Dani', 'Elena', 'Fran', 'Gema', 'Hugo'];
function azar(semilla) { let a = semilla >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function generar(nombre, hoy0) {
  const J = JUEGOS[nombre]; if (!J) throw new Error('Juego desconocido: ' + nombre);
  const r = azar(20261112 + J.movs), ent = (n) => Math.floor(r() * n), de = (l) => l[ent(l.length)], eur = (min, max) => Math.round((min + r() * (max - min)) * 100) / 100;
  const hoy = hoy0 ? new Date(hoy0) : new Date(); hoy.setHours(12, 0, 0, 0);
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const dia = (n) => { const d = new Date(hoy); d.setDate(d.getDate() + n); return iso(d); };
  const ts = (n) => new Date(hoy.getTime() - n * 864e5).toISOString();
  const YO = 'u-yo', cuentas = [], movs = {}, tareas = {};
  for (let i = 0; i < J.cuentas; i++) cuentas.push({ id: 'c' + (i + 1), nombre: i ? 'Cuenta ' + (i + 1) : 'Cuenta nómina', banco: BANCOS[i % BANCOS.length], saldo: eur(500, 9000), fecha: dia(-J.dias), saldoFecha: dia(-J.dias), principal: i === 0 });
  const cta = () => (J.cuentas > 1 ? cuentas[ent(J.cuentas)].id : cuentas[0].id);
  const metas = []; for (let i = 0; i < J.metas; i++) metas.push({ id: 'mt' + (i + 1), nombre: 'Meta ' + (i + 1), objetivo: 1000 * (i + 2), fechaObjetivo: dia(120 + 60 * i) });
  const deudas = []; for (let i = 0; i < J.deudas; i++) deudas.push({ nombre: 'Préstamo ' + (i + 1), objetivo: 6000 * (i + 1), previo: 1000, cuotaMes: 150 + 50 * i });
  const facturas = []; for (let i = 0; i < J.fijos; i++) facturas.push({ nombre: 'Fijo ' + (i + 1), importe: eur(8, 90), dia: 1 + ((i * 5) % 27), cuentaId: cta() });
  let n = 0; const add = (o) => { n++; movs['m' + n] = Object.assign({ metodoPago: 'Tarjeta', cuentaId: cta(), creadoEn: hoy.getTime() - n * 1000 }, o); };
  // lo de cada mes: nómina, alquiler, luz, un aporte a meta, una inversión y un pago de deuda
  const meses = Math.ceil(J.dias / 30);
  for (let k = 0; k < meses; k++) {
    add({ tipo: 'Ingreso', categoria: 'Nómina', importe: 1850, fecha: dia(-30 * k - 3), descripcion: 'Nómina', cuentaId: 'c1' });
    add({ tipo: 'Gasto', categoria: 'Hogar', importe: 620, fecha: dia(-30 * k - 2), descripcion: 'Alquiler', cuentaId: 'c1' });
    if (J.fijos) add({ tipo: 'Factura', categoria: facturas[k % J.fijos].nombre, importe: facturas[k % J.fijos].importe, fecha: dia(-30 * k - 5), descripcion: '' });
    if (J.metas) add({ tipo: 'Ahorro', categoria: metas[k % J.metas].nombre, importe: 100, fecha: dia(-30 * k - 6), descripcion: '' });
    if (nombre !== 'ligero') add({ tipo: 'Inversión', categoria: 'Fondo indexado', importe: 150, fecha: dia(-30 * k - 7), descripcion: '' });
    if (J.deudas) add({ tipo: 'Deuda', categoria: deudas[k % J.deudas].nombre, importe: deudas[k % J.deudas].cuotaMes, fecha: dia(-30 * k - 8), descripcion: '' });
  }
  while (n < J.movs) { const c = de(CATS); add({ tipo: 'Gasto', categoria: c[0], subcategoria: c[2].length && r() < 0.4 ? de(c[2]) : undefined, importe: eur(1.5, 95), fecha: dia(-ent(J.dias)), descripcion: de(DESCS) + (r() < 0.2 ? ' ' + (1 + ent(40)) : '') }); }
  for (let i = 0; i < J.tareas; i++) tareas['t' + (i + 1)] = { nombre: 'Tarea inventada ' + (i + 1), estado: r() < 0.5 ? 'Completado' : 'Pendiente', prioridad: de(['Alta', 'Media', 'Baja']), fechaLimite: dia(ent(120) - 60), categoria: de(['Casa', 'Trabajo', 'Papeles']) };
  const grupos = [], miembros = [], comp = [], carpetas = [];
  for (let g = 0; g < J.grupos; g++) {
    const gid = 'g' + (g + 1), directo = g % 3 === 1, gente = directo ? 1 : 2 + (g % 4), us = [YO];
    grupos.push({ id: gid, nombre: directo ? '' : 'Grupo inventado ' + (g + 1), tipo: directo ? 'directo' : 'grupo', edicion: 'todos', created_at: ts(J.dias) });
    miembros.push({ grupo_id: gid, user_id: YO, nombre: 'Álex', rol: 'admin' });
    for (let p = 0; p < gente; p++) { const u = 'u-p' + ((g + p) % PERSONAS.length); us.push(u); miembros.push({ grupo_id: gid, user_id: u, nombre: PERSONAS[(g + p) % PERSONAS.length], rol: 'miembro' }); }
    const cuantos = Math.round(J.comp / J.grupos);
    for (let k = 0; k < cuantos; k++) { const imp = eur(6, 140), parte = Math.round((imp / us.length) * 100) / 100, rep = {}; us.forEach((u) => { rep[u] = parte; }); const d = ent(J.dias), c = de(CATS);
      comp.push({ id: gid + 'k' + k, grupoId: gid, fecha: dia(-d), tipo: 'Gasto', categoria: c[0], descripcion: de(DESCS), importe: Math.round(parte * us.length * 100) / 100, pagadoPor: de(us), reparto: rep, modo: 'igual', creadoPor: de(us), createdAt: ts(d) }); }
  }
  const cfg = { app: { nombre: 'Álex Prueba', onboarded: true, novedadesVistas: '9999-12-31', compararVersiones: false, cuentas, ahorro: metas, deudas, facturas,
    categoriasGasto: CATS.map((c) => ({ nombre: c[0], presupuesto: c[1] || undefined, subcategorias: c[2] })) }, meta: { onboarded: true } };
  return { nombre, YO, movs, tareas, cfg, grupos, miembros, comp, carpetas };
}
// El archivo que sustituye a data-layer.js en el navegador (misma forma que tests/capturas/datos-falsos.js).
function capaDatos(nombre) {
  return 'window.__DATOS__=' + JSON.stringify(generar(nombre)) + ';(' + function () {
    var D = window.__DATOS__, YO = D.YO, cfg = D.cfg, store = { movimientos: D.movs, tareas: D.tareas, golf: {} }, nuevo = 0;
    var vacio = function (next) { setTimeout(function () { next([]); }, 0); return function () {}; };
    var lista = function (o) { return Object.keys(o).map(function (id) { return { id: id, data: function () { return o[id]; } }; }); };
    window.__RED__ = { consultas: 0 }; var red = function () { window.__RED__.consultas++; };
    window.Data = {
      uid: function () { return YO; },
      doc: function (p) { var k = p.split('/')[1]; return { get: async function () { red(); return { exists: !!cfg[k], data: function () { return cfg[k]; } }; }, set: async function (v) { cfg[k] = v; }, update: async function (v) { cfg[k] = Object.assign({}, cfg[k], v); },
        onSnapshot: function (cb) { red(); setTimeout(function () { cb({ exists: !!cfg[k], data: function () { return cfg[k]; } }); }, 0); return function () {}; } }; },
      collection: function (nm) { var o = store[nm] || (store[nm] = {}); return { onSnapshot: function (cb) { red(); setTimeout(function () { cb({ docs: lista(o) }); }, 0); return function () {}; },
        add: async function (d) { var id = 'n' + (++nuevo); o[id] = d; return { id: id }; }, doc: function (id) { return { id: id, set: async function (d) { o[id] = d; }, update: async function (d) { o[id] = Object.assign({}, o[id], d); }, delete: async function () { delete o[id]; } }; } }; },
      grupos: { listar: async function () { red(); return { grupos: D.grupos, miembros: D.miembros, sinCuenta: [] }; }, invitaciones: async function () { red(); return []; } },
      compartidos: { suscribir: function (next) { red(); setTimeout(function () { next(D.comp); }, 0); return function () {}; }, crear: async function (o) { return o; }, editar: async function (id, o) { return o; }, borrar: async function () { return true; } },
      objetivos: { suscribir: vacio }, aportes: { suscribir: vacio }, carpetas: { suscribir: function (next) { setTimeout(function () { next(D.carpetas); }, 0); return function () {}; } },
      agenda: { suscribir: vacio }, agendaPermisos: { listar: async function () { return []; }, ocultas: async function () { return []; }, conmigo: async function () { return []; }, deOtro: async function () { return []; } },
      divisas: { cambio: async function () { return null; } }, recargar: function () {},
      rpc: async function () { red(); return []; },
    };
    window.Auth = { onChange: function (f) { setTimeout(function () { f({ user: { email: 'prueba@example.invalid', id: YO } }); }, 0); }, getSession: async function () { return { user: { id: YO } }; }, signIn: function () {}, signOut: function () {}, resetPassword: function () {} };
  }.toString() + ')();';
}
module.exports = { generar, capaDatos, JUEGOS };
if (require.main === module) {
  const cual = process.argv[2];
  if (cual) process.stdout.write(JSON.stringify(generar(cual)));
  else Object.keys(JUEGOS).forEach((k) => { const d = generar(k); console.log(k + ': ' + Object.keys(d.movs).length + ' movimientos, ' + d.cfg.app.cuentas.length + ' cuentas, ' + d.grupos.length + ' grupos, ' + d.comp.length + ' compartidos, ' + Object.keys(d.tareas).length + ' tareas'); });
}

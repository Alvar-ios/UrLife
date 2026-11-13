// 12/11/2026 · Avisos del banco fase 2 (docs/40 C3): con los avisos activados, el móvil se apunta con la huella de su
// clave (nunca la clave), recibe el mapa comercio → categoría y la cuenta de cada banco; lo que Android ya guardó con la
// app cerrada no se vuelve a duplicar; al cerrar sesión se quita el móvil. Android y Supabase se simulan. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const hoy = new Date().toISOString().slice(0, 10), reg = { registrar: [], configurar: [], quitar: [], borrados: [] };
  let cola = [{ id: 'av-9', pkg: 'es.bancosantander.apps', app: 'Santander', importe: 7.3, entra: false, comercio: 'Panadería', tipo: 'tarjeta', ts: Date.now(), uid: 'u-1', guardado: true }];
  const est = { permiso: true, activo: true, avisarme: true, bancos: ['es.bancosantander.apps'], candidatos: [], pendientes: 1 };
  const pre = (w) => {
    w.SUPABASE_CONFIG = { url: 'https://x.supabase.co', anonKey: 'publica' };
    w.__nativo = { android: true, avisosBanco: { estado: async () => est, abrirAjustes: async () => {}, configurar: async (o) => { reg.configurar.push(o); },
      pendientes: async () => cola.slice(), quitar: async (ids) => { cola = cola.filter((x) => ids.indexOf(x.id) < 0); }, vaciar: async () => {},
      abiertoDesdeAviso: async () => false, alAbrirDesdeAviso: () => {}, huella: async (uid) => 'f'.repeat(64), deshechos: async () => [] },
      notif: { permiso: async () => 'denied', pedir: async () => 'denied', programar: async () => 0 } };
  };
  const e = makeEnv({ version: { tu: 1, agenda: 0, crear: 0 }, pre, session: { user: { id: 'u-1', email: 't@t.com' } },
    cfg: { app: { compararVersiones: false, categoriasGasto: [{ nombre: 'Panadería y café' }, { nombre: 'Otros' }], cuentas: [{ id: 'c1', nombre: 'Santander', banco: 'santander' }] }, meta: { onboarded: true } },
    movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Panadería y café', importe: 2, fecha: hoy, descripcion: 'Panadería' },
           { id: 'm2', tipo: 'Gasto', categoria: 'Otros', importe: 7.3, fecha: hoy, descripcion: 'Panadería centro' }] });
  e.w.Data.moviles = { registrar: async (p) => { reg.registrar.push(p); return p.id; }, quitar: async (id) => { reg.quitar.push(id); }, quitarTodos: async () => {} };
  const del0 = e.w.Data.collection; e.w.Data.collection = (n) => { const c = del0(n); const d0 = c.doc; c.doc = (id) => Object.assign({}, d0 ? d0(id) : {}, { delete: async () => { reg.borrados.push(id); } }); return c; };
  await e.w.__APP__.main(); await sleep(2300);
  const r = reg.registrar[0] || {};
  ok(r.claveHash === 'f'.repeat(64) && r.id && r.plataforma === 'android', 'el móvil se apunta con la huella de su clave (nunca la clave)');
  const c = reg.configurar.find((o) => o.servidor) || {};
  ok(c.url === 'https://x.supabase.co' && c.mapa && c.mapa.comercios['panadería'] === 'Panadería y café' && c.mapa.cuentas['es.bancosantander.apps'] === 'c1', 'Android recibe dónde guardar y el mapa (Panadería → «Panadería y café», Santander → su cuenta)');
  ok(reg.borrados.includes('av-9'), 'lo que Android guardó con la app cerrada y ya tenías apuntado a mano se quita (no se duplica)');
  reg.quitar.length = 0; await e.w.__APP__.H.avApagar([]); await sleep(60);
  ok(reg.quitar.includes(r.id), 'al apagar los avisos del banco se quita este móvil de Supabase');
  reg.quitar.length = 0; await e.w.__APP__.H.doLogout([]); await sleep(100);
  ok(reg.quitar.includes(r.id), 'al cerrar sesión se quita este móvil de Supabase');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

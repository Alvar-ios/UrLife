// 10/11/2026 · Calidad, revisión final: data-layer.js vuelve a leer lo guardado (avisarCambio) y al volver a la app (recargarTodo)
// sin recargas de más ni bucles; y avisa de la vuelta del correo de «¿Olvidaste tu contraseña?». Cliente de Supabase simulado, datos inventados.
const { JSDOM } = require('jsdom'), fs = require('fs');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lecturas = { movimientos: 0, tareas: 0 }; let authCb = null, reset = null, nuevaPass = null;
function builder(table) {
  const st = { del: false };
  const b = { select() { return b; }, eq() { return b; }, order() { return b; }, range() { return b; }, maybeSingle() { return Promise.resolve({ data: null, error: null }); },
    upsert() { const p = Promise.resolve({ error: null }); p.select = () => Promise.resolve({ error: null, data: [{ id: 'i1' }] }); return p; }, insert() { return Promise.resolve({ error: null }); }, delete() { st.del = true; return b; },
    then(res, rej) { if (st.del) return Promise.resolve({ error: null }).then(res, rej); lecturas[table] = (lecturas[table] || 0) + 1; return Promise.resolve({ data: [{ id: 'a1', user_id: 'u1', tipo: 'Gasto', importe: 1 }], error: null }).then(res, rej); } };
  return b;
}
const fakeSb = { from: builder, channel() { const c = { on() { return c; }, subscribe() { return c; } }; return c; }, removeChannel() {},
  auth: { onAuthStateChange(cb) { authCb = cb; setTimeout(() => cb('SIGNED_IN', { user: { id: 'u1' } }), 0); }, getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }),
    resetPasswordForEmail: async (email, o) => { reset = o; return { error: null }; }, updateUser: async (o) => { nuevaPass = o.password; return { error: null }; } } };
const dom = new JSDOM('', { runScripts: 'outside-only', url: 'https://localhost/', pretendToBeVisual: true }); const w = dom.window;
w.supabase = { createClient: () => fakeSb }; w.SUPABASE_CONFIG = { url: 'x', anonKey: 'y' };
w.eval(fs.readFileSync(require('path').join(__dirname, '..', 'data-layer.js'), 'utf8'));
(async () => {
  await sleep(10);
  let pintados = 0;
  const col = w.Data.collection('movimientos');
  const baja = col.onSnapshot(() => { pintados++; });
  w.Data.collection('tareas').onSnapshot(() => {});
  await sleep(30);
  ok(lecturas.movimientos === 1 && pintados === 1, 'al suscribirse lee una vez');
  await col.doc('a1').set({ tipo: 'Gasto', importe: 2 });
  await sleep(450);
  ok(lecturas.movimientos === 2 && pintados === 2, 'guardar un movimiento → se vuelve a leer una sola vez');
  await sleep(700);
  ok(lecturas.movimientos === 2, 'y ahí se queda: releer no provoca más lecturas (sin bucle)');
  ok(lecturas.tareas === 1, 'guardar un movimiento no relee las tareas');
  for (let i = 0; i < 25; i++) await col.doc('b' + i).set({ tipo: 'Gasto', importe: i });
  await col.add({ tipo: 'Gasto', importe: 3 }); await col.doc('b1').delete();
  await sleep(450);
  ok(lecturas.movimientos === 3, '27 guardados seguidos → una sola lectura (' + (lecturas.movimientos - 2) + ')');
  await col.bulkInsert([{ id: 'i1', data: { tipo: 'Gasto', importe: 1, lote: 'L1' } }]); await col.deleteWhere('lote', 'L1');
  await sleep(450);
  ok(lecturas.movimientos === 4, 'importar y deshacer el lote también releen (una vez)');
  // volver a la app o recuperar la conexión: se relee todo, una vez por tabla
  w.document.dispatchEvent(new w.Event('visibilitychange')); w.dispatchEvent(new w.Event('online'));
  await sleep(450);
  ok(lecturas.movimientos === 5 && lecturas.tareas === 2, 'al volver a la app y recuperar la conexión a la vez: una lectura por tabla');
  baja();
  await col.doc('a1').set({ tipo: 'Gasto', importe: 5 }); w.document.dispatchEvent(new w.Event('visibilitychange'));
  await sleep(450);
  ok(lecturas.movimientos === 5 && lecturas.tareas === 3, 'tras darse de baja (cerrar sesión) ya no se relee esa tabla');
  // contraseña olvidada
  ok(w.Auth.recuperando() === false, 'en un arranque normal no se pide contraseña nueva');
  await w.Auth.resetPassword('prueba@example.invalid');
  ok(reset && reset.redirectTo === 'https://urlife-zeta.vercel.app/', 'dentro de la app de Android (https://localhost) el correo lleva a la web pública');
  authCb('PASSWORD_RECOVERY', { user: { id: 'u1' } });
  ok(w.Auth.recuperando() === true, 'al volver del correo, la app sabe que toca poner contraseña nueva');
  await w.Auth.cambiarContrasena('clave-inventada-1');
  ok(nuevaPass === 'clave-inventada-1' && w.Auth.recuperando() === false, 'tras cambiarla deja de pedirla');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();

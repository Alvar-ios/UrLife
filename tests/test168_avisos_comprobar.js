// 13/11/2026 · Tú → Avisos → «Comprobar»: dice qué paso falla (permiso de avisos, acceso a notificaciones, apps marcadas, últimos
// avisos de bancos), avisa de los «ajustes restringidos» de Android, manda un aviso de prueba y pide el permiso de avisos una vez
// al entrar. Android se simula. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const reg = { pedir: 0, ahora: [], abrirApp: [] };
  let perm = 'prompt';
  const est = { permiso: false, activo: true, avisarme: true, bancos: ['es.bancosantander.apps'], candidatos: [], pendientes: 0, prueba: true,
    vistos: [{ pkg: 'es.bancosantander.apps', app: 'Santander', ts: Date.now() - 5 * 60000, leido: false, marcado: true }],
    muestras: [{ app: 'Santander', ts: Date.now(), texto: 'Compra · Has pagado 4,20 EUR en CAFETERIA' }] };
  const pre = (w) => {
    w.__nativo = { android: true, avisosBanco: { estado: async () => est, abrirAjustes: async () => { reg.abrirApp.push('acceso'); }, abrirApp: async (q) => { reg.abrirApp.push(q); },
      configurar: async () => {}, pendientes: async () => [], quitar: async () => {}, vaciar: async () => {}, abiertoDesdeAviso: async () => false, alAbrirDesdeAviso: () => {},
      huella: async () => 'f'.repeat(64), deshechos: async () => [] },
      notif: { permiso: async () => perm, pedir: async () => { reg.pedir++; perm = 'granted'; return perm; }, programar: async () => 0, ahora: async (l) => { reg.ahora.push(...l); return l.length; } } };
  };
  const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 }, pre, session: { user: { id: 'u-1', email: 't@t.com' } }, cfg: { app: { compararVersiones: false }, meta: { onboarded: true } } });
  e.w.Data.moviles = { registrar: async (p) => p.id, quitar: async () => {}, quitarTodos: async () => {} };
  await e.w.__APP__.main(); await sleep(2300);
  ok(reg.pedir === 1, 'al entrar se pide UNA vez el permiso para mandar avisos (Android 13+)');
  const A = e.w.__APP__; await A.H.avAbrir([]); await sleep(150);
  const txt = (e.w.document.querySelector('.sheet') || e.w.document.body).textContent;
  ok(/Ajuste restringido/.test(txt) && /Permitir ajustes restringidos/.test(txt), 'sin acceso a notificaciones explica los «ajustes restringidos» de Android');
  ok(/Comprobar/.test(txt) && /Acceso a notificaciones/.test(txt) && /PalomApp puede mandarte avisos/.test(txt), 'sale la lista «Comprobar»');
  ok(/Llegó, pero no se entendió el texto/.test(txt), 'dice que llegó un aviso del Santander que no se entendió');
  ok(/CAFETERIA/.test(txt) && /solo versión de prueba/.test(txt), 'en la versión de prueba enseña el texto no entendido para poder mandarlo');
  await A.H.avProbar([]); await sleep(50);
  ok(reg.ahora.some((x) => x.id === 3999), '«Mandarme un aviso de prueba» manda un aviso al momento');
  await A.H.avAbrirApp(['app']); await A.H.avAbrirApp(['acceso']);
  ok(reg.abrirApp.includes('app') && reg.abrirApp.includes('acceso'), 'los botones abren los ajustes de PalomApp y el acceso a notificaciones');
  perm = 'denied'; reg.abrirApp.length = 0; e.w.__nativo.notif.pedir = async () => 'denied';
  await A.H.avPermisoNotif([]); await sleep(50);
  ok(reg.abrirApp.includes('notif'), 'si los avisos están bloqueados y Android ya no pregunta, se abren los ajustes de notificaciones de PalomApp');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

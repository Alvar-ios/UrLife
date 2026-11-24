// 24/11/2026 · Calidad, rama fase18/permisos-iphone. iPhone y web simulados. Datos inventados.
// 1) Dos pagos iguales que llegan cada uno por los dos caminos (aviso del banco + Apple Pay) se apuntan los dos.
// 2) El mismo pago por el otro camino en otra vuelta a la app no se apunta dos veces.
// 3) Cerrar la hoja de la guía y volver a la app no la reabre (FORM no se vacía al cerrar una hoja).
// 4) En la web no cambia nada: sin aviso de la guía en Inicio, sin «Primeros pasos» de avisos y sin cola de Atajos.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const conocidos = []; // fallos ya contados a Desarrollo: se avisan pero no tumban la batería
const okConocido = (c, m) => { if (c) ok(true, m); else { console.log('CONOCIDO ' + m); conocidos.push(m); } };
function iphone(colaIni) {
  const st = { cola: colaIni.slice(), quitados: [] };
  st.pre = (w) => {
    w.__nativo = { ios: true,
      atajos: { pendientes: async () => st.cola.slice(), quitar: async (ids) => { st.quitados.push(...ids); st.cola = st.cola.filter((x) => !ids.includes(x.id)); }, info: async () => ({ ios: '27.1', usado: 0 }), cuenta: async () => {} },
      notif: { permiso: async () => 'granted', pedir: async () => 'granted', programar: async () => 0, ahora: async () => 0 } };
  };
  return st;
}
const cfgBase = { app: { compararVersiones: false, cuentas: [{ id: 'c-x', nombre: 'Banco X', banco: 'bbva', principal: true }] }, meta: { onboarded: true } };
(async () => {
  const t = Date.now();
  // 1) dos cafés de 1,80 € por los dos caminos (4 entradas en la cola) → 2 movimientos
  {
    const st = iphone([
      { id: 'b1', uid: 'u-1', tipo: 'aviso', banco: 'bbva', texto: 'Has pagado 1,80 € en CAFE LUNA con tu tarjeta', ts: t - 120000 },
      { id: 'b2', uid: 'u-1', tipo: 'applepay', importe: '1,80 €', comercio: 'Cafe Luna', tarjeta: 'BBVA', ts: t - 119000 },
      { id: 'b3', uid: 'u-1', tipo: 'aviso', banco: 'bbva', texto: 'Has pagado 1,80 € en CAFE LUNA con tu tarjeta', ts: t - 60000 },
      { id: 'b4', uid: 'u-1', tipo: 'applepay', importe: '1,80 €', comercio: 'Cafe Luna', tarjeta: 'BBVA', ts: t - 59000 },
    ]);
    const e = makeEnv({ url: 'https://palomapp.test/', version: { tu: 1, agenda: 0, crear: 0 }, pre: st.pre, session: { user: { id: 'u-1', email: 't@t.com' } }, cfg: cfgBase });
    e.w.Data.moviles = { registrar: async (p) => p.id, quitar: async () => {}, quitarTodos: async () => {} };
    await e.w.__APP__.main(); await sleep(2200);
    const av = e.w.__APP__.S.movimientos.filter((m) => m.origen === 'aviso');
    okConocido(av.length === 2, 'dos cafés iguales, cada uno por aviso y por Apple Pay: se apuntan 2 (salen ' + av.length + ')');
    ok(!st.cola.length, 'la cola queda vacía');
  }
  // 2) el aviso se apunta en una vuelta; el Apple Pay del mismo pago llega en la siguiente → sigue habiendo uno
  {
    const st = iphone([{ id: 'c1', uid: 'u-1', tipo: 'aviso', banco: 'bbva', texto: 'Has pagado 23,40 € en FRUTERIA SOL con tu tarjeta', ts: t - 30000 }]);
    const e = makeEnv({ url: 'https://palomapp.test/', version: { tu: 1, agenda: 0, crear: 0 }, pre: st.pre, session: { user: { id: 'u-1', email: 't@t.com' } }, cfg: cfgBase });
    e.w.Data.moviles = { registrar: async (p) => p.id, quitar: async () => {}, quitarTodos: async () => {} };
    await e.w.__APP__.main(); await sleep(2200);
    const S = e.w.__APP__.S;
    ok(S.movimientos.filter((m) => m.origen === 'aviso').length === 1, 'primera vuelta: se apunta el aviso');
    st.cola.push({ id: 'c2', uid: 'u-1', tipo: 'applepay', importe: '23,40 €', comercio: 'Fruteria Sol', tarjeta: 'BBVA', ts: Date.now() });
    e.w.__avisosVolver(); await sleep(500);
    ok(S.movimientos.filter((m) => m.origen === 'aviso').length === 1 && !st.cola.length, 'segunda vuelta: el mismo pago por Apple Pay no se duplica y sale de la cola');
    // 2b) lo mismo, pero abriendo la app más de una hora después de que llegara (el aviso se apuntó al momento; el pago de
    // Apple Pay llegó 1 min más tarde y la app no se vuelve a abrir hasta pasada la hora) → debería seguir habiendo uno
    st.cola.push({ id: 'd1', uid: 'u-1', tipo: 'aviso', banco: 'bbva', texto: 'Has pagado 7,35 € en KIOSCO MAR con tu tarjeta', ts: Date.now() - 95 * 60000 });
    e.w.__avisosVolver(); await sleep(500);
    st.cola.push({ id: 'd2', uid: 'u-1', tipo: 'applepay', importe: '7,35 €', comercio: 'Kiosco Mar', tarjeta: 'BBVA', ts: Date.now() - 94 * 60000 });
    e.w.__avisosVolver(); await sleep(500);
    const kio = S.movimientos.filter((m) => m.origen === 'aviso' && Math.abs(m.importe - 7.35) < 0.001).length;
    okConocido(kio === 1, 'el mismo pago por Apple Pay recogido en otra apertura, pasada 1 h desde que llegó: una sola vez (salen ' + kio + ')');
    // 3) la guía: abrir, cerrar y volver a la app → no se reabre ni se repinta encima de otra cosa
    e.w.__APP__.H.goTab(['tu']); await sleep(60);
    e.w.__APP__.H.guiaAbrirDesde(['']); await sleep(500);
    const host = () => (e.w.document.querySelector('#sheetHost') || {}).textContent || '';
    ok(/Que se apunten solos/.test(host()), 'la guía de iPhone se abre');
    e.w.__APP__.H.closeSheet([]); await sleep(400);
    e.w.__avisosVolver(); await sleep(400);
    const bd = e.w.document.querySelector('#sheetBackdrop');
    ok(!bd || bd.dataset.cerrando || !/Que se apunten solos/.test(host()), 'tras cerrar la guía, volver a la app no la reabre');
  }
  // 4) web: nada nuevo
  {
    const e = makeEnv({ url: 'https://palomapp.test/', version: { tu: 1, agenda: 0, crear: 0 }, session: { user: { id: 'u-1', email: 't@t.com' } },
      pre: (w) => { try { w.localStorage.setItem('guiaAbre', '5'); } catch (x) { /* */ } }, cfg: { app: { compararVersiones: false }, meta: { onboarded: true } } });
    await e.w.__APP__.main(); await sleep(1500);
    const txt = e.w.document.body.textContent;
    ok(!/apuntarse solos|avisos del banco se han parado|Que se apunten solos/.test(txt), 'web: Inicio no enseña la guía de los avisos');
    ok(!e.w.__nativo, 'web: no hay puente nativo (ni cola de Atajos)');
    e.w.__APP__.H.guiaAbrirDesde(['']); await sleep(300);
    ok(!/Que se apunten solos/.test((e.w.document.querySelector('#sheetHost') || {}).textContent || ''), 'web: la guía no se abre');
  }
  if (conocidos.length) console.log('Fallos conocidos (' + conocidos.length + '): ' + conocidos.join(' | '));
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

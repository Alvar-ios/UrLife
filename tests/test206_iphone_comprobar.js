// 25/11/2026 · iPhone: comprobar que los Atajos funcionan. «Comprobar ahora» espera a que llegue algo y lo confirma (sin contar lo
// anterior), el atajo «Probar PalomApp» no apunta ningún gasto, y Tú → Avisos dice cuándo llegó el último aviso. iPhone simulado. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  let cola = [], usado = 0, prueba = 0; const quitados = [];
  const pre = (w) => {
    try { w.localStorage.setItem('guiaAbre', '1'); } catch (x) { /* */ }
    w.__nativo = { ios: true,
      atajos: { pendientes: async () => cola.slice(), quitar: async (ids) => { quitados.push(...ids); cola = cola.filter((x) => !ids.includes(x.id)); }, info: async () => ({ ios: '27.1', usado, prueba }), cuenta: async () => {} },
      notif: { permiso: async () => 'granted', pedir: async () => 'granted', programar: async () => 0, ahora: async () => 0 } };
  };
  const e = makeEnv({ url: 'https://palomapp.test/', version: { tu: 1, agenda: 0, crear: 1 }, pre, session: { user: { id: 'u-1', email: 't@t.com' } },
    cfg: { app: { compararVersiones: false, cuentas: [{ id: 'c-bbva', nombre: 'BBVA', banco: 'bbva', principal: true }] }, meta: { onboarded: true } } });
  e.w.Data.moviles = { registrar: async (p) => p.id, quitar: async () => {}, quitarTodos: async () => {} };
  await e.w.__APP__.main(); await sleep(2200);
  const A = e.w.__APP__, H = A.H, S = A.S, hoja = () => (e.w.document.querySelector('#sheetHost') || {}).textContent || '';
  const movs = () => S.movimientos.filter((m) => m.origen === 'aviso').length;

  // 1 · Tú → Avisos: «último aviso recibido»
  H.goTab(['tu']); await sleep(60); await H.avAbrir([]); await sleep(300);
  ok(/Todavía no ha llegado ningún aviso/.test(hoja()), 'sin nada recibido, Tú → Avisos lo dice');
  ok(/Comprobar ahora/.test(hoja()), 'hay un botón «Comprobar ahora» en Tú → Avisos');
  usado = Date.now() - 3 * 3600000; await H.avAbrir([]); await sleep(300);
  ok(/Último aviso recibido: hace 3 h/.test(hoja()) && !/más de dos semanas/.test(hoja()), 'con uno reciente: «Último aviso recibido: hace 3 h», sin alarma');
  usado = Date.now() - 20 * 86400000; await H.avAbrir([]); await sleep(300);
  ok(/Último aviso recibido: hace 20 días/.test(hoja()) && /más de dos semanas/.test(hoja()), 'con uno de hace 20 días: avisa de que lleva mucho sin llegar nada');

  // 2 · «Probar PalomApp» no es un gasto: se quita de la cola y no apunta nada
  const antes = movs();
  cola.push({ id: 'p1', uid: 'u-1', tipo: 'prueba', ts: Date.now() }); H.avisosRecoger ? 0 : 0; e.w.__avisosVolver(); await sleep(500);
  ok(quitados.includes('p1') && movs() === antes, 'la prueba se quita de la cola y no apunta ningún movimiento');

  // 3 · «Comprobar ahora» abre en el último paso y espera
  usado = 0; prueba = Date.now() - 60000; // una prueba de hace un minuto: NO cuenta para la nueva espera
  H.guiaAbrirDesde(['prueba']); await sleep(700);
  ok(/Comprobar ahora/.test(hoja()) && /Probar PalomApp/.test(hoja()), 'la guía se abre en «Comprobar ahora» y habla del atajo «Probar PalomApp»');
  H.guiaIosEsperar(['si']); await sleep(150);
  ok(/Esperando tu prueba/.test(hoja()) && /Ejecutar inmediatamente/.test(hoja()), 'al pulsar, se queda esperando y da pistas por si tarda');
  await sleep(2400);
  ok(/Esperando tu prueba/.test(hoja()), 'lo que llegó ANTES de pulsar no cuenta');
  prueba = Date.now() + 500; await sleep(2400);
  ok(/¡Funciona!/.test(hoja()) && /Atajos y PalomApp se hablan bien/.test(hoja()), 'llega la prueba de «Probar PalomApp»: «¡Funciona!» y dice que falta probar un pago de verdad');
  H.guiaCerrar([]); await sleep(400);

  // 4 · un aviso de verdad, al volver a la app desde otra (sin estar la app mirando)
  H.guiaAbrirDesde(['prueba']); await sleep(700); H.guiaIosEsperar(['si']); await sleep(150);
  usado = Date.now() + 500; e.w.__avisosVolver(); await sleep(400);
  ok(/Ha llegado tu aviso y PalomApp lo ha leído/.test(hoja()), 'al volver a la app tras un pago de verdad: «Ha llegado tu aviso»');
  H.guiaCerrar([]); await sleep(400);

  // 5 · cancelar
  H.guiaAbrirDesde(['prueba']); await sleep(700); H.guiaIosEsperar(['si']); await sleep(100); H.guiaIosEsperar(['no']); await sleep(100);
  ok(!/Esperando tu prueba/.test(hoja()) && /Comprobar ahora/.test(hoja()), '«Cancelar» deja de esperar y vuelve al botón');
  H.guiaCerrar([]); await sleep(300);
  e.w.close();
  console.log(fails ? '\n' + fails + ' FALLOS' : '\nTODO BIEN'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

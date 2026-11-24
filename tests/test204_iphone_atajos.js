// 24/11/2026 · iPhone: lo que llega por Atajos (avisos del banco en iOS 27 y pagos con Apple Pay) se apunta solo, una vez,
// con el mismo lector que Android; lo que no es un movimiento se tira; la guía de Atajos en Tú → Avisos e Inicio. iPhone simulado. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const ahora = Date.now();
  let cola = [
    { id: 'a1', tipo: 'aviso', app: 'BBVA', titulo: 'Pago con tarjeta', texto: 'Has pagado 12,50 € en MERCADONA con tu tarjeta', ts: ahora - 60000 },
    { id: 'a2', tipo: 'applepay', importe: '12,50 €', comercio: 'Mercadona', tarjeta: 'BBVA Visa', ts: ahora - 30000 }, // el mismo pago por Apple Pay: una vez
    { id: 'a3', tipo: 'applepay', importe: '€4.20', comercio: 'Cafetería Sol', tarjeta: 'Otra', ts: ahora - 20000 },
    { id: 'a4', tipo: 'aviso', app: 'BBVA', titulo: 'Código', texto: 'Tu código de verificación es 123456', ts: ahora - 10000 },
    { id: 'a5', tipo: 'aviso', app: 'Banco', titulo: 'Bizum', texto: 'Ana te ha enviado 15 € por Bizum', ts: ahora - 5000 },
  ];
  const reg = { quitados: [] }; let usado = 0;
  const pre = (w) => {
    try { w.localStorage.setItem('guiaAbre', '1'); } catch (x) { /* */ }
    w.__nativo = { ios: true,
      atajos: { pendientes: async () => cola.slice(), quitar: async (ids) => { reg.quitados.push(...ids); cola = cola.filter((x) => !ids.includes(x.id)); }, info: async () => ({ ios: '27.1', usado }) },
      notif: { permiso: async () => 'granted', pedir: async () => 'granted', programar: async () => 0, ahora: async () => 0 } };
  };
  const e = makeEnv({ url: 'https://palomapp.test/', version: { tu: 1, agenda: 0, crear: 0 }, pre, session: { user: { id: 'u-1', email: 't@t.com' } },
    cfg: { app: { compararVersiones: false, cuentas: [{ id: 'c-bbva', nombre: 'BBVA', banco: 'bbva', principal: true }] }, meta: { onboarded: true } } });
  e.w.Data.moviles = { registrar: async (p) => p.id, quitar: async () => {}, quitarTodos: async () => {} };
  await e.w.__APP__.main(); await sleep(2600);
  const S = e.w.__APP__.S, av = S.movimientos.filter((m) => m.origen === 'aviso');
  ok(av.length === 3, 'se apuntan 3 movimientos (Mercadona una sola vez, la cafetería y el Bizum): ' + av.map((m) => m.descripcion + ' ' + m.importe).join(' · '));
  const merc = av.find((m) => /Mercadona/.test(m.descripcion));
  ok(merc && merc.tipo === 'Gasto' && Math.abs(merc.importe - 12.5) < 0.001 && merc.cuentaId === 'c-bbva', 'el aviso del BBVA: gasto de 12,50 en Mercadona, en la cuenta del BBVA');
  const caf = av.find((m) => /Cafetería Sol/.test(m.descripcion));
  ok(caf && caf.tipo === 'Gasto' && Math.abs(caf.importe - 4.2) < 0.001, 'el pago con Apple Pay: 4,20 en Cafetería Sol');
  const biz = av.find((m) => m.tipo === 'Ingreso');
  ok(biz && /Bizum recibido/.test(biz.descripcion) && !/Ana/.test(biz.descripcion), 'el Bizum entra como ingreso, sin el nombre de la persona');
  ok(!cola.length && ['a1', 'a2', 'a3', 'a4', 'a5'].every((id) => reg.quitados.includes(id)), 'la cola del iPhone queda vacía (también el código, que no se apunta)');
  ok(!S.movimientos.some((m) => /123456/.test(JSON.stringify(m))), 'nada del código de verificación se guarda');
  // al volver a la app con algo nuevo
  cola.push({ id: 'a6', tipo: 'aviso', app: 'BBVA', titulo: 'Compra', texto: 'Compra de 30,00 EUR en LIDL', ts: Date.now() });
  e.w.__avisosVolver(); await sleep(400);
  ok(S.movimientos.some((m) => m.origen === 'aviso' && /Lidl/.test(m.descripcion)), 'al volver a la app se recoge lo nuevo');
  // Inicio: una vez, si nunca ha llegado nada (aquí sí ha llegado: no sale)
  ok(!/Tus pagos pueden apuntarse solos/.test(e.w.document.body.textContent), 'si ya llegan avisos por Atajos, Inicio no enseña la guía');
  // Tú → Avisos: la tarjeta de Atajos
  e.w.__APP__.H.goTab(['tu']); await sleep(60); await e.w.__APP__.H.avAbrir([]); await sleep(200);
  const hoja = () => (e.w.document.querySelector('#sheetHost') || {}).textContent || '';
  ok(/Con la app Atajos de tu iPhone/.test(hoja()) && !/solo están en la app de Android/.test(hoja()), 'Tú → Avisos explica Atajos en iPhone');
  e.w.__APP__.H.guiaAbrirDesde(['']); await sleep(600);
  ok(/Que se apunten solos/.test(hoja()) && /Atajos/.test(hoja()), 'la guía de iPhone se abre por su portada');
  e.w.__APP__.H.guiaIr(['abrir']); await sleep(60);
  ok(/Abre Atajos/.test(hoja()) && !!e.w.document.querySelector('#sheetHost a[href="shortcuts://"]'), 'paso 1: «Abrir Atajos» abre la app Atajos');
  e.w.__APP__.H.guiaIr(['disparador']); await sleep(60);
  ok(/Notificación/.test(hoja()) && /Ejecutar inmediatamente/.test(hoja()), 'paso 2: Notificación, tu banco y «Ejecutar inmediatamente»');
  e.w.__APP__.H.guiaIr(['accion']); await sleep(60);
  ok(/Apuntar aviso en PalomApp/.test(hoja()) && /Entrada del atajo/.test(hoja()), 'paso 3: la acción de PalomApp con la entrada del atajo');
  e.w.__APP__.H.guiaIr(['applepay']); await sleep(60);
  ok(/Apuntar pago de Apple Pay/.test(hoja()) && /una sola vez/.test(hoja()), 'Apple Pay: su acción, y el mismo pago no se apunta dos veces');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

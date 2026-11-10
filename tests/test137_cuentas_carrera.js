// 10/11/2026 · Fallo de Alfredo: al añadir una cuenta, una lectura de la configuración que salió ANTES de guardar
// llegaba DESPUÉS y la borraba; el siguiente guardado (saldo, «Listo») la pisaba también en el servidor.
// Y Trading 212 en la lista de brókers. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ cfg: { app: { compararVersiones: false, cuentas: [] }, meta: { onboarded: true } }, movs: [], version: { tu: 0, agenda: 0, crear: 0 } });
  // nos quedamos con la función que recibe lo que llega del servidor
  const orig = e.w.Data; let snap = null;
  e.w.Data = Object.assign({}, orig, { doc: (p) => { const d = orig.doc(p); if (p !== 'config/app') return d; return Object.assign({}, d, { onSnapshot: (cb, err) => { snap = cb; return d.onSnapshot(cb, err); } }); } });
  const A = e.w.__APP__; await A.main(); await sleep(150);
  const viejo = JSON.parse(JSON.stringify(e.store.cfg.app)); // lo que había antes de añadir la cuenta
  A.H.openCuentas([]); A.H.cuentaAnadir([]); A.H.bancoElegir(['myinvestor']); await sleep(10);
  // llega tarde una lectura antigua, sin la cuenta
  snap({ exists: true, data: () => JSON.parse(JSON.stringify(viejo)) }); await sleep(10);
  ok((A.cfg().cuentas || []).length === 1, 'la cuenta nueva no desaparece al llegar una lectura antigua');
  const inp = e.doc.querySelector('#sheetHost input[data-input*="saldo"], #sheetHost input[data-change*="saldo"]') || { value: '1350' };
  inp.value = '1350'; A.H.cuentaCampo([0, 'saldo'], inp); await sleep(10);
  snap({ exists: true, data: () => JSON.parse(JSON.stringify(viejo)) }); await sleep(10);
  A.H.cuentasVolver([]); A.H.cuentasListo([]); await sleep(80);
  const cs = e.store.cfg.app.cuentas || [];
  ok(cs.length === 1 && cs[0].banco === 'myinvestor' && cs[0].saldo === 1350, 'en el servidor queda MyInvestor con 1350 (' + JSON.stringify(cs.map((c) => [c.banco, c.saldo])) + ')');
  ok(A.cfg().cuentas.length === 1, 'y en pantalla también');
  // pasados los 5 s, lo que llegue del servidor manda (no se queda nada pegado para siempre)
  const real = Date.now; e.w.Date.now = () => real() + 6000; Date.now = e.w.Date.now;
  snap({ exists: true, data: () => Object.assign({}, e.store.cfg.app, { nombre: 'Otro móvil' }) }); await sleep(10);
  ok(A.cfg().nombre === 'Otro móvil' && A.cfg().cuentas.length === 1, 'después, los cambios de otro dispositivo sí entran');
  Date.now = real; e.w.Date.now = real;
  // Trading 212
  A.H.cuentaAnadir([]); A.H.bancoBuscar([], { value: 'trading' }); await sleep(10);
  ok(/Trading 212/.test(e.doc.querySelector('#sheetHost').textContent), 'buscar «trading» encuentra Trading 212');
  console.log(fails ? 'FALLOS: ' + fails : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

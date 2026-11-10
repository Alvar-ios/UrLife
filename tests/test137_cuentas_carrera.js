// 10/11/2026 · Fallo de Alfredo: al añadir una cuenta, una lectura de la configuración que salió ANTES de guardar
// llegaba DESPUÉS y la borraba; el siguiente guardado (saldo, «Listo») la pisaba también en el servidor.
// Y Trading 212 en la lista de brókers. Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ cfg: { app: { compararVersiones: false, cuentas: [] }, meta: { onboarded: true } }, movs: [], version: { tu: 0, agenda: 0, crear: 0 } });
  // nos quedamos con la función que recibe lo que llega del servidor
  const orig = e.w.Data; let snap = null;
  // guardar tarda (como en un móvil con poca cobertura): la lectura antigua llega mientras se guarda
  e.w.Data = Object.assign({}, orig, { doc: (p) => { const d = orig.doc(p); if (p !== 'config/app') return d; return Object.assign({}, d, { onSnapshot: (cb, err) => { snap = cb; return d.onSnapshot(cb, err); }, update: async (x) => { await sleep(60); return d.update(x); } }); } });
  const A = e.w.__APP__; await A.main(); await sleep(150);
  const viejo = JSON.parse(JSON.stringify(e.store.cfg.app)); // lo que había antes de añadir la cuenta
  A.H.openCuentas([]); A.H.cuentaAnadir([]); A.H.bancoElegir(['myinvestor']); await sleep(10); // el guardado sigue en curso
  // llega tarde una lectura antigua, sin la cuenta
  snap({ exists: true, data: () => JSON.parse(JSON.stringify(viejo)) }); await sleep(10);
  ok((A.cfg().cuentas || []).length === 1, 'la cuenta nueva no desaparece al llegar una lectura antigua');
  const inp = e.doc.querySelector('#sheetHost input[data-input*="saldo"], #sheetHost input[data-change*="saldo"]') || { value: '1350' };
  inp.value = '1350'; A.H.cuentaCampo([0, 'saldo'], inp); await sleep(10);
  snap({ exists: true, data: () => JSON.parse(JSON.stringify(viejo)) }); await sleep(10);
  A.H.cuentasVolver([]); A.H.cuentasListo([]); await sleep(400);
  const cs = e.store.cfg.app.cuentas || [];
  ok(cs.length === 1 && cs[0].banco === 'myinvestor' && cs[0].saldo === 1350, 'en el servidor queda MyInvestor con 1350 (' + JSON.stringify(cs.map((c) => [c.banco, c.saldo])) + ')');
  ok(A.cfg().cuentas.length === 1, 'y en pantalla también');
  // ya guardado, lo que llegue del servidor manda (no se queda nada pegado)
  await sleep(300);
  snap({ exists: true, data: () => Object.assign({}, e.store.cfg.app, { nombre: 'Otro móvil', cuentas: [] }) }); await sleep(10);
  ok(A.cfg().nombre === 'Otro móvil' && A.cfg().cuentas.length === 0, 'después, los cambios de otro dispositivo sí entran');
  // Trading 212
  A.H.cuentaAnadir([]); A.H.bancoBuscar([], { value: 'trading' }); await sleep(10);
  ok(/Trading 212/.test(e.doc.querySelector('#sheetHost').textContent), 'buscar «trading» encuentra Trading 212');
  // 10/11 (2.ª vez): tocando de verdad (con el evento del toque), como en el móvil: elegir banco, saldo, color, cambiar de banco y «Listo»
  const e2 = makeEnv({ cfg: { app: { compararVersiones: false, cuentas: [] }, meta: { onboarded: true } }, movs: [], version: { tu: 0, agenda: 0, crear: 0 } });
  const B = e2.w.__APP__; await B.main(); await sleep(150);
  B.H.goTab(['dinero']); await sleep(30);
  click(e2, 'openCuentas'); await sleep(20); click(e2, 'cuentaAnadir'); await sleep(20); click(e2, 'bancoElegir', 'myinvestor'); await sleep(30);
  ok((e2.store.cfg.app.cuentas || []).length === 1, 'al tocar un banco se crea la cuenta (' + (e2.store.cfg.app.cuentas || []).length + ')');
  const s2 = e2.doc.querySelector('#sheetHost input[aria-label="Saldo de hoy"]'); s2.value = '1350'; s2.dispatchEvent(new e2.w.Event('change', { bubbles: true })); await sleep(30);
  click(e2, 'cuentaColor'); await sleep(30);
  ok((e2.doc.querySelector('#sheetHost input[aria-label="Saldo de hoy"]') || {}).value === '1350' && /MyInvestor/.test(e2.doc.querySelector('#sheetHost h2').textContent), 'cambiar el color no reinicia la tarjeta');
  click(e2, 'bancoAbrir'); await sleep(20); click(e2, 'bancoElegir', 'trading212'); await sleep(30);
  ok((e2.doc.querySelector('#sheetHost input[aria-label="Saldo de hoy"]') || {}).value === '1350' && e2.store.cfg.app.cuentas.length === 1 && e2.store.cfg.app.cuentas[0].banco === 'trading212', 'cambiar el banco tampoco: sigue la misma cuenta con su saldo');
  [...e2.doc.querySelectorAll('#sheetHost [data-click^="cuentasVolver"]')].pop().click(); await sleep(30);
  ok(e2.doc.querySelectorAll('#sheetHost .cuenta-fila').length === 1 && e2.store.cfg.app.cuentas[0].saldo === 1350, '«Listo»: la cuenta sale en la lista y está guardada');
  console.log(fails ? 'FALLOS: ' + fails : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

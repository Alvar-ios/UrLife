// 24/11/2026 · El lector de avisos en JS (para el iPhone: el texto llega por Atajos) tiene que leer IGUAL que el de Android.
// Esta prueba coge los casos de las pruebas de Java (LectorAvisos*Test.java) y los pasa por la copia en JS. Textos inventados.
const fs = require('fs'), path = require('path');
const { makeEnv, sleep } = require('./harness.js');
const DIR = path.join(__dirname, '..', 'movil', 'android', 'app', 'src', 'test', 'java', 'com', 'palomapp', 'app');
let fails = 0, n = 0; const mal = (m) => { fails++; console.log('FAIL ' + m); };
(async () => {
  const e = makeEnv({ cfg: { app: { compararVersiones: false }, meta: { onboarded: true } } });
  await e.w.__APP__.main(); await sleep(300);
  const LA = e.w.__APP__.LA;
  for (const f of ['LectorAvisosTest.java', 'LectorAvisosCalidadTest.java', 'LectorAvisosCalidad2Test.java']) {
    const src = fs.readFileSync(path.join(DIR, f), 'utf8');
    const re = /^\s*(es|nada|sinPersona)\((.*)\);\s*(\/\/.*)?$/gm; let m;
    while ((m = re.exec(src))) {
      let args; try { args = eval('[' + m[2] + ']'); } catch (x) { continue; }
      n++;
      if (m[1] === 'es') {
        const [pkg, t, x, imp, entra, com] = args, r = LA.leer(pkg, t, x), caso = '[' + t + ' | ' + x + ']';
        if (!r) { mal('NO LEE ' + caso); continue; }
        if (Math.abs(r.importe - imp) > 0.001) mal('IMPORTE ' + r.importe + ' (esperado ' + imp + ') ' + caso);
        if (r.entra !== entra) mal('SIGNO ' + caso);
        if (com != null && com !== r.comercio) mal('COMERCIO «' + r.comercio + '» (esperado «' + com + '») ' + caso);
      } else if (m[1] === 'nada') {
        const [pkg, t, x] = args.length === 2 ? ['x', ...args] : args, r = LA.leer(pkg, t, x);
        if (r) mal('APUNTA LO QUE NO ES ' + JSON.stringify(r) + ' [' + t + ' | ' + x + ']');
      } else {
        const [pkg, t, x, nombre] = args, r = LA.leer(pkg, t, x);
        if (r && r.comercio.toLowerCase().includes(String(nombre).toLowerCase()) && r.tipo !== 'bizum' && r.tipo !== 'transferencia') mal('PERSONA EN COMERCIO «' + r.comercio + '» [' + x + ']');
      }
    }
  }
  if (n < 60) mal('solo se han encontrado ' + n + ' casos de Java');
  console.log('PASS ' + (n - fails) + ' de ' + n + ' casos de Java leen igual en JS');
  // números como en Java
  [['1.234,56', 1234.56], ['12,5', 12.5], ['12.50', 12.5], ['1,234.56', 1234.56], ['1 234,56', 1234.56], ['1.234', 1234]].forEach(([s, v]) => { if (LA.numero(s) !== v) mal('numero(' + s + ') = ' + LA.numero(s)); });
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

// 10/11/2026 · data-layer.js: una lectura de la configuración que salió antes de terminar un guardado no se entrega
// (traería lo de antes); se vuelve a leer. Cliente de Supabase simulado, datos inventados.
const { JSDOM } = require('jsdom'), fs = require('fs');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let servidor = { cuentas: [] }, retrasoLectura = 0, retrasoEscritura = 0, lecturas = 0;
function builder() {
  const b = { select() { return b; }, eq() { return b; },
    maybeSingle() { lecturas++; const foto = JSON.parse(JSON.stringify(servidor)); return sleep(retrasoLectura).then(() => ({ data: { value: foto }, error: null })); },
    upsert(row) { return sleep(retrasoEscritura).then(() => { servidor = row.value; return { error: null }; }); } };
  return b;
}
const avisos = [];
const fakeSb = { from: builder, channel() { const c = { on(_e, _f, cb) { avisos.push(cb); return c; }, subscribe() { return c; } }; return c; }, removeChannel() {},
  auth: { onAuthStateChange(cb) { setTimeout(() => cb('SIGNED_IN', { user: { id: 'u1' } }), 0); }, getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) } };
const dom = new JSDOM('', { runScripts: 'outside-only', url: 'https://localhost/', pretendToBeVisual: true }); const w = dom.window;
w.supabase = { createClient: () => fakeSb }; w.SUPABASE_CONFIG = { url: 'x', anonKey: 'y' };
w.eval(fs.readFileSync(require('path').join(__dirname, '..', 'data-layer.js'), 'utf8'));
(async () => {
  await sleep(10);
  const fotos = []; const d = w.Data.doc('config/app');
  d.onSnapshot((s) => fotos.push(s.data()));
  await sleep(30);
  ok(fotos.length === 1 && fotos[0].cuentas.length === 0, 'primera lectura normal');
  // la lectura empieza (lenta) y mientras tanto se guarda una cuenta
  retrasoLectura = 120; retrasoEscritura = 20;
  const n0 = fotos.length;
  // llega un aviso del servidor (otro cambio) y sale una lectura justo antes de guardar
  avisos.forEach((f) => f());
  await sleep(5);
  await d.update({ cuentas: [{ id: 'c1', nombre: 'Banco' }] });
  retrasoLectura = 0;
  await sleep(700);
  const nuevas = fotos.slice(n0);
  ok(nuevas.length >= 1 && nuevas.every((f) => f.cuentas.length === 1), 'no se entrega ninguna lectura sin la cuenta recién guardada (' + nuevas.map((f) => f.cuentas.length).join(',') + ')');
  ok(servidor.cuentas.length === 1, 'en el servidor está la cuenta');
  // sin guardados de por medio, la lectura se entrega a la primera
  const l0 = lecturas, n1 = fotos.length; avisos.forEach((f) => f()); await sleep(50);
  ok(lecturas - l0 === 1 && fotos.length === n1 + 1, 'sin guardados de por medio, una sola lectura (sin bucles)');
  console.log(fails ? 'FALLOS: ' + fails : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

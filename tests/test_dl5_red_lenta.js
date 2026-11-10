// 10/11/2026 · Calidad: con red muy lenta (lectura 600 ms, guardado 4 s) tampoco se entrega una lectura sin lo recién guardado. Datos inventados.
// 10/11/2026 · data-layer.js: una lectura de la configuración que salió antes de terminar un guardado no se entrega
// (traería lo de antes); se vuelve a leer. Cliente de Supabase simulado, datos inventados.
const { JSDOM } = require('/home/claude/urlife/tests/node_modules/jsdom'), fs = require('fs');
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
w.eval(fs.readFileSync('/home/claude/urlife/data-layer.js', 'utf8'));
(async () => {
  await sleep(10);
  const fotos = []; const d = w.Data.doc('config/app');
  d.onSnapshot((s) => { fotos.push(s.data()); console.log('snap', s.data().cuentas.length, 'guardado terminado:', !!global.fin); });
  await sleep(30);
  ok(fotos.length === 1 && fotos[0].cuentas.length === 0, 'primera lectura normal');
  // red lenta: guardar tarda 2 s; la lectura 100 ms
  retrasoLectura = 600; retrasoEscritura = 4000;
  const n0 = fotos.length;
  avisos.forEach((f) => f());
  await sleep(5);
  await d.update({ cuentas: [{ id: 'c1', nombre: 'Banco' }] }); global.fin = true; console.log('update fin');
  await sleep(6000); const t=0;
  const nuevas = fotos.slice(n0);
  console.log('entregadas', JSON.stringify(nuevas.map((f) => f.cuentas.length)), 'lecturas', lecturas);
  ok(nuevas.every((f) => f.cuentas.length === 1), 'con red lenta tampoco llega una lectura sin la cuenta');
  console.log(fails ? 'FALLOS: ' + fails : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

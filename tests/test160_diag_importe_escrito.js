// 12/11/2026 · Calidad (diagnóstico de lógica, docs/salud/2026-11-12-diag-logica.md): lo que se guarda al escribir el importe a mano.
// Datos inventados. Los fallos ya descritos salen como «FALLO CONOCIDO» y no rompen npm test.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0, conocidos = 0;
const CONOCIDOS = new Set(['IMP-3DEC', 'IMP-123', 'IMP-0500', 'IMP-MENOS']);
const ok = (c, m, clave) => {
  if (clave && CONOCIDOS.has(clave)) { console.log(c ? 'PASS ' + m + '  (el fallo conocido ' + clave + ' parece arreglado: quítalo de la lista)' : 'FALLO CONOCIDO [' + clave + '] ' + m); if (!c) conocidos++; return; }
  console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++;
};
(async () => {
  const e = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Ocio' }] }, meta: { onboarded: true } }, session: { user: { email: 't@t.com', id: 'yo' } } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, doc = e.doc;
  const setv = (sel, v) => { const el = doc.querySelector(sel); el.value = v; el.dispatchEvent(new e.w.Event('input', { bubbles: true })); };
  // escribe el importe en el formulario clásico (sin el teclado propio), guarda y devuelve lo que llegó a la base (o null si no guardó)
  async function guarda(txt, desc) {
    H.goTab(['movimientos']); await sleep(5); H.onFabAntiguo([]); await sleep(10);
    setv('#fImporte', txt); setv('#fDesc', desc); const c = doc.querySelector('#fCategoria'); if (c) c.value = 'Ocio';
    H.saveMov([]); await sleep(40);
    const m = Object.values(e.store.movimientos).find((x) => x.descripcion === desc);
    H.closeSheet([]); await sleep(260);
    return m ? m.importe : null;
  }
  // lo que SÍ funciona
  ok(await guarda('1.234,56', 'd1') === 1234.56, '«1.234,56» se guarda como 1234,56');
  ok(await guarda('12,5', 'd2') === 12.5, '«12,5» se guarda como 12,50');
  ok(await guarda('8.000', 'd3') === 8000, '«8.000» se guarda como 8000');
  ok(await guarda('', 'd4') === null, 'vacío: no guarda');
  ok(await guarda('abc', 'd5') === null, '«abc»: no guarda');
  ok(await guarda('-3', 'd6') === -3, '«-3» se guarda como devolución (lo dice la etiqueta del campo)');
  // fallos encontrados
  const v1 = await guarda('12,345', 'd7');
  ok(v1 === null || Math.round(v1 * 100) === v1 * 100, '«12,345» no debe guardarse con 3 decimales (hoy guarda ' + v1 + ')', 'IMP-3DEC');
  const v2 = await guarda('1,2,3', 'd8');
  ok(v2 === null, '«1,2,3» no es un importe: debe pedir uno válido (hoy guarda ' + v2 + ')', 'IMP-123');
  const v3 = await guarda('0.500', 'd9');
  ok(v3 === 0.5 || v3 === null, '«0.500» no son 500 € (hoy guarda ' + v3 + ')', 'IMP-0500');
  const v4 = await guarda('−3', 'd10'); // signo menos tipográfico (el que pinta la propia app, p. ej. al copiar «−3,00 €»)
  ok(v4 === -3, '«−3» (menos de la app) debe entenderse como -3 (hoy: ' + (v4 === null ? 'no guarda' : v4) + ')', 'IMP-MENOS');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK' + (conocidos ? ' (' + conocidos + ' fallos conocidos)' : ''));
  process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

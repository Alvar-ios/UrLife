// «Pago fijo» (23/10/2026, docs/15 3.4): el nombre nuevo de «Gasto fijo» / «Factura o pago». El dato sigue siendo tipo 'Factura'. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ version: { crear: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Vivienda' }], ingresos: ['Nómina'] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost').textContent;
  A.openCrear(); await sleep(10);
  ok(/Pago fijo/.test(sh()) && /recibos, facturas y suscripciones/.test(sh()) && !/Gasto fijo/.test(sh()), 'botón +: «Pago fijo» con «recibos, facturas y suscripciones»');
  H.crearIr(['factura']); await sleep(20);
  ok(/Nuevo pago fijo/.test(sh()), 'el formulario se llama «Nuevo pago fijo»');
  H.closeSheet([]); await sleep(300);
  if (H.openRecurrentes) { H.openRecurrentes([]); await sleep(20);
    ok(/Pagos fijos/.test(sh()) && /Pago fijo/.test(sh()) && !/Factura o pago|Facturas y pagos/.test(sh()), 'recurrentes: «Pagos fijos» y botón «Pago fijo»');
    H.recNuevo(['factura']); await sleep(20);
    ok(/Nuevo pago fijo/.test(sh()) && /Ingreso fijo/.test(sh()) && !/Factura o pago/.test(sh()), 'editor de recurrentes: «Ingreso fijo | Pago fijo»');
  } else ok(false, 'no encuentro la acción para abrir los recurrentes');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

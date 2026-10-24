// 24/10: categoría con chips en los pagos fijos y «Mes | Año» en Movimientos. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ movs: [{ id: 'g1', tipo: 'Gasto', categoria: 'Ocio', importe: 10, fecha: new Date().toISOString().slice(0, 10) }],
    cfg: { app: { categoriasGasto: [{ nombre: 'Ocio' }], facturas: [{ nombre: 'Netflix', importe: 13, regla: { t: 'dia', dia: 5 }, categoria: 'Ocio' }] }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, sh = () => e.doc.querySelector('#sheetHost');
  H.recEditar(['factura', 0]); await sleep(5);
  ok(!sh().querySelector('select#recCat') && sh().querySelector('#recCat').value === 'Ocio' && sh().querySelector('#recCatCampo .chip.active').textContent.trim() === 'Ocio', 'pago fijo: categoría con chips y la guardada marcada');
  ok(sh().querySelector('#recCatCampo .chip-cat-ic'), 'cada chip lleva su icono');
  H.recCatElegir(['Suministros']); await sleep(5);
  ok(sh().querySelector('#recCat').value === 'Suministros', 'tocar otra la cambia');
  H.recGuardar([]); await sleep(50);
  ok(A.cfg().facturas[0].categoria === 'Suministros', 'se guarda la categoría elegida');
  H.recNuevo(['factura']); await sleep(5); const nm = sh().querySelector('#recNombre'); nm.value = 'Netflix'; H.recCampo(['nombre'], nm); sh().querySelector('#recImporte').value = '13'; H.recGuardar([]); await sleep(50);
  const nf = A.cfg().facturas.filter((f) => f.nombre === 'Netflix').pop();
  ok(nf && nf.categoria && nf.categoria !== 'Otros', 'un pago fijo nuevo sin tocar la categoría coge la del nombre (' + (nf && nf.categoria) + ')');
  H.closeSheet([]); await sleep(300);
  H.goTab(['movimientos']); await sleep(20);
  ok(e.doc.querySelector('.mov-modo'), 'Movimientos: «Mes | Año» en la cabecera');
  H.movModoCab(['anio']); await sleep(20);
  ok(/^y:/.test(A.S.movPeriodo) && /el año entero/.test(e.doc.querySelector('.mov-cab').textContent), 'un toque en «Año» enseña el año entero');
  H.movModoCab(['mes']); await sleep(20);
  ok(/^m:/.test(A.S.movPeriodo), 'y «Mes» vuelve al mes');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

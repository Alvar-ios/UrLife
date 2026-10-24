// Calidad 24/10: pagos fijos con chips de categoría y «Mes | Año». Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const cats = ['Comida', 'Ocio', 'Transporte', 'Casa', 'Salud', 'Ropa', 'Suministros', 'Regalos', 'Mascota'].map((n) => ({ nombre: n }));
  const e = makeEnv({ movs: [{ id: 'g1', tipo: 'Gasto', categoria: 'Ocio', importe: 10, fecha: hoy }],
    cfg: { app: { categoriasGasto: cats, facturas: [{ nombre: 'Veterinario', importe: 20, regla: { t: 'dia', dia: 5 }, categoria: 'Mascota' }, { nombre: 'Gimnasio', importe: 30, regla: { t: 'dia', dia: 3 }, categoria: 'Salud' }, { nombre: 'Cine', importe: 8, regla: { t: 'dia', dia: 9 }, categoria: 'Ocio' }],
      cobros: [{ nombre: 'Nómina', importe: 1000, regla: { t: 'dia', dia: 28 } }] }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, sh = () => e.doc.querySelector('#sheetHost');
  // categoría personalizada fuera de las primeras: se abre con todas a la vista y marcada
  H.recEditar(['factura', 0]); await sleep(5);
  const act = sh().querySelector('#recCatCampo .chip.active');
  ok(act && act.textContent.trim() === 'Mascota' && sh().querySelector('#recCat').value === 'Mascota', 'categoría fuera de las 8 primeras: visible y marcada');
  ok(/Menos/.test(sh().querySelector('#recCatCampo .chip-mas').textContent), 'con la guardada escondida, se abre la lista completa');
  // guardar sin tocar conserva
  H.recGuardar([]); await sleep(50);
  ok(A.cfg().facturas[0].categoria === 'Mascota', 'guardar sin tocar conserva la categoría');
  H.recEditar(['factura', 1]); await sleep(5);
  H.recGuardar([]); await sleep(50);
  ok(A.cfg().facturas[1].categoria === 'Salud', 'guardar sin tocar conserva (Gimnasio = Salud, no la deducida)');
  // Más (N)
  H.closeSheet([]); await sleep(300);
  H.recEditar(['factura', 2]); await sleep(5);
  const mas = sh().querySelector('#recCatCampo .chip-mas');
  ok(mas && /Más \(\d+\)/.test(mas.textContent), '«Más (N)» sale con más de 8 categorías');
  H.recCatMas([]); await sleep(5);
  ok(sh().querySelectorAll('#recCatCampo .chip:not(.chip-mas)').length > 8 && /Menos/.test(sh().querySelector('#recCatCampo .chip-mas').textContent), '«Más» enseña todas');
  // cambiar de tipo ida y vuelta
  H.recCatElegir(['Ropa']); await sleep(5);
  H.recSetKind(['cobro']); await sleep(5);
  ok(!sh().querySelector('#recCatCampo'), 'Ingreso fijo: sin categoría');
  H.recSetKind(['factura']); await sleep(5);
  ok(sh().querySelector('#recCat') && sh().querySelector('#recCat').value === 'Ropa', 'vuelta a Pago fijo: se mantiene la elegida');
  // elegir un nombre de la lista no debe desmarcar la categoría
  H.closeSheet([]); await sleep(300);
  H.recEditar(['factura', 1]); await sleep(5);
  H.recPickNombre(['Veterinario']); await sleep(5);
  ok(sh().querySelector('#recCatCampo .chip.active[aria-checked="true"]') && sh().querySelector('#recCat').value === 'Salud', 'tras tocar un nombre sugerido sigue marcada una categoría');
  H.closeSheet([]); await sleep(300);
  // pago fijo nuevo: escribir el nombre y guardar sin tocar la categoría
  H.recNuevo ? H.recNuevo(['factura']) : A.recAbrirEditor && A.recAbrirEditor('factura'); await sleep(5);
  const inp = sh().querySelector('#recNombre');
  if (inp) { inp.value = 'Netflix'; H.recCampo(['nombre'], inp); H.recGuardar([]); await sleep(50); }
  const nf = (A.cfg().facturas || []).find((f) => f.nombre === 'Netflix');
  console.log('INFO pago fijo nuevo «Netflix» guardado con categoría:', nf && nf.categoria);
  H.closeSheet([]); await sleep(300);
  // Mes | Año con «Tu mes» desde la nómina
  H.goTab(['movimientos']); await sleep(20);
  const m0 = A.S.movPeriodo;
  H.movModoCab(['anio']); await sleep(20);
  ok(/^y:/.test(A.S.movPeriodo), 'Año desde la cabecera');
  const r = e.doc.querySelector('.mov-modo [aria-checked="true"]');
  ok(r && r.textContent === 'Año', 'aria-checked en «Año»');
  H.movModoCab(['mes']); await sleep(20);
  ok(/^m:/.test(A.S.movPeriodo), 'vuelve a un mes');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

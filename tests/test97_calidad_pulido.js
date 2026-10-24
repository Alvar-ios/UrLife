// Calidad 24/10 (docs/15 2.4, 2.5 y 3.4): casos límite de la hoja del activo, deudas antiguas y hojas de ajustes. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  /* 1. Hoja del activo sin datos de precios, sin participaciones o sin movimientos */
  const movs = [
    { id: 'i1', tipo: 'Inversión', categoria: 'Bitcoin', importe: 500, fecha: '2026-03-10', activoId: 'a1', participaciones: 0.01, tipoActivo: 'Cripto' },
    { id: 'i2', tipo: 'Inversión', categoria: 'Fondo X', importe: 50, fecha: '2026-03-10', activoId: 'a3', tipoActivo: 'ETF' },
    { id: 'i3', tipo: 'Inversión', categoria: 'Manual', importe: 80, fecha: '2026-04-01', tipoActivo: 'Otro' }];
  const e = makeEnv({ movs, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } }, version: { dinero: 0 } });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, sh = () => e.doc.querySelector('#sheetHost');
  A.S.historico = undefined; A.S.valoracion = undefined;
  let err = '';
  try { H.verActivo(['Bitcoin']); await sleep(10); } catch (x) { err = x.message; }
  ok(!err && /Has metido/.test(sh().textContent) && /Último precio—/.test(sh().textContent) && !sh().querySelector('.act-svg'), 'activo sin historial ni valoración: se abre, sin gráfica y con «—» en el precio');
  H.closeSheet([]); await sleep(300);
  try { H.verActivo(['Fondo X']); await sleep(10); } catch (x) { err = x.message; }
  ok(!err && /le faltan las participaciones/.test(sh().textContent) && /Tienes—/.test(sh().textContent), 'activo sin participaciones: avisa y no inventa cifras');
  H.closeSheet([]); await sleep(300);
  H.verActivo(['No existe']); await sleep(10);
  ok(/Ya no hay movimientos de este activo/.test(sh().textContent), 'activo sin movimientos: mensaje y «Cerrar»');
  H.closeSheet([]); await sleep(300);
  A.S.historico = { error: true, series: {} }; H.verActivo(['Bitcoin']); await sleep(10);
  ok(!sh().querySelector('.act-svg'), 'historial con error: sin gráfica y sin fallo');
  H.closeSheet([]); await sleep(300);
  /* 2. Gráfica: lo que metes en el periodo no cuenta como ganancia */
  const hoy = A.todayISO(), ser = []; for (let i = 300; i >= 0; i--) ser.push([A.uAdd(hoy, -i), 50000]);
  const e2 = makeEnv({ movs: [{ id: 'b1', tipo: 'Inversión', categoria: 'Bitcoin', importe: 500, fecha: A.uAdd(hoy, -200), activoId: 'a1', participaciones: 0.01, tipoActivo: 'Cripto' },
    { id: 'b2', tipo: 'Inversión', categoria: 'Bitcoin', importe: 100, fecha: A.uAdd(hoy, -3), activoId: 'a1', participaciones: 0.002, tipoActivo: 'Cripto' }],
    cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } }, version: { dinero: 0 } });
  await sleep(200);
  const B = e2.w.__APP__, sh2 = () => e2.doc.querySelector('#sheetHost');
  B.S.historico = { series: { a1: ser } }; B.S.valoracion = { ts: Date.now(), valores: { a1: { activo: { simbolo: 'BTC', tipo: 'crypto' }, cierre_eur: 50000, fecha_precio: hoy } } };
  B.H.verActivo(['Bitcoin']); await sleep(10); B.H.activoPer(['1s']); await sleep(5);
  ok(/en 7 días/.test(sh2().textContent) && /0,00/.test(sh2().querySelector('.act-graf-c').textContent) && sh2().querySelector('.act-svg'), 'precio plano y 100 € metidos esta semana: «Ganas 0,00 €», no 100 €');
  B.H.closeSheet([]); await sleep(300);
  /* 3. Deudas y ajustes guardados de antes */
  const e3 = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 150.5 }], deudas: [{ id: 'd1', nombre: 'Coche', objetivo: 900, fechaObjetivo: '2027-05-31' }],
    cobros: [{ nombre: 'Nómina', importe: 1500.5, regla: { t: 'dia', dia: 28 } }] }, meta: { onboarded: true } }, version: { tu: 0 } });
  await sleep(200);
  const C = e3.w.__APP__, sh3 = () => e3.doc.querySelector('#sheetHost');
  C.H.deudaEditar(['Coche']); await sleep(10);
  ok(sh3().querySelector('#dFecha').value === '2027-05' && sh3().querySelector('.ma-mes.on').textContent === 'may' && /2027/.test(sh3().querySelector('.ma-anio').textContent), 'deuda guardada: «Acabar en» enseña mayo de 2027');
  C.H.deudaGuardar([]); await sleep(80);
  const d = C.cfg().deudas[0];
  ok(d.fechaObjetivo === '2027-05-31' && d.objetivo === 900 && d.emoji === '🚗' && d.id === 'd1', 'guardar sin tocar nada no cambia fecha, total ni id (y le pone su icono)');
  C.H.openListEditor(['categoriasGasto']); await sleep(5);
  ok(sh3().querySelector('input.amt').value === '150,5', 'presupuesto guardado (150.5) se enseña con coma');
  C.H.recEditar(['cobro', 0]); await sleep(5);
  ok(sh3().querySelector('#recImporte').value === '1500,5', 'cobro con importe: se enseña con coma');
  C.H.recGuardar([]); await sleep(60);
  ok(C.cfg().cobros[0].importe === 1500.5, 'guardar el cobro sin tocar nada mantiene el importe');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

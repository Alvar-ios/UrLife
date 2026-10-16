// Calidad · varias cuentas fase 1, segunda revisión: que tener cuentas no cambie ninguna suma,
// que el traspaso no se cuele en ningún informe y casos raros (principal, compartidos, importar).
// Los «INFO» son huecos conocidos descritos en el informe de Calidad: no fallan, solo dejan constancia.
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
const { TextDecoder } = require('util');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const iso = (d) => d.toISOString().slice(0, 10), hace = (n) => iso(new Date(Date.now() - n * 864e5)), dentro = (n) => iso(new Date(Date.now() + n * 864e5));
const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const file = (name, buf) => ({ name, size: buf.byteLength, arrayBuffer: async () => buf });
const HOY = new Date(), Y = HOY.getFullYear(), M = HOY.getMonth() + 1;
const d2 = hace(2), d4 = hace(4);

// movimientos «antiguos» (sin cuenta, como los que ya tienen los usuarios de verdad)
const ANTIGUOS = [
  { id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 40, fecha: d4, descripcion: 'compra' },
  { id: 'f1', tipo: 'Factura', categoria: 'Luz', importe: 55, fecha: d4 },
  { id: 'i1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1200, fecha: d4 },
  { id: 'a1', tipo: 'Ahorro', categoria: 'Apartado', importe: 100, fecha: d2 },
  { id: 'v1', tipo: 'Inversión', categoria: 'VWCE', tipoActivo: 'ETF', importe: 60, fecha: d2 },
  { id: 'd1', tipo: 'Deuda', categoria: 'Préstamo coche', importe: 30, fecha: d2 },
];
const CUENTAS3 = [
  { id: 'c1', nombre: 'Banco A', saldo: 1000, fecha: hace(20) },
  { id: 'c2', nombre: 'Banco B', saldo: 300, fecha: hace(20) },
  { id: 'c3', nombre: 'Hucha', tipo: 'ahorro', saldo: 2000, fecha: hace(20) },
];
async function env(cuentas, movs, extra, pre) {
  const e = makeEnv({
    cfg: { app: Object.assign({ categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 30 }, { nombre: 'Ocio', presupuesto: 10 }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas || [])) }, extra || {}), meta: { onboarded: true } },
    movs: JSON.parse(JSON.stringify(movs || [])), url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } },
    pre: pre,
  });
  await sleep(150); return e;
}
const txt = (e) => e.doc.querySelector('#content').textContent.replace(/\s+/g, ' ');
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const sinBanco = (p) => JSON.stringify({ inv: p.inv, ahorro: p.ahorro, deudas: p.deudas, comp: p.comp });

(async () => {
  /* 1. Tener cuentas (o no tenerlas) no cambia ninguna suma de los movimientos antiguos */
  const sinC = await env([], ANTIGUOS), unaC = await env([CUENTAS3[0]], ANTIGUOS), tresC = await env(CUENTAS3, ANTIGUOS);
  const k0 = JSON.stringify(sinC.w.__APP__.kpisMes(Y, M));
  ok(k0 === JSON.stringify(unaC.w.__APP__.kpisMes(Y, M)) && k0 === JSON.stringify(tresC.w.__APP__.kpisMes(Y, M)),
    'el mes (ingresos, gastos, apartado, deuda, «te queda») sale igual con 0, 1 o 3 cuentas');
  const kAnio = (e) => JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => e.w.__APP__.kpisMes(Y, m)));
  ok(kAnio(sinC) === kAnio(tresC), 'y los doce meses del año también');
  ok(sinBanco(sinC.w.__APP__.patrimonio()) === sinBanco(tresC.w.__APP__.patrimonio()), 'el patrimonio (sin la parte del banco) sale igual');
  const resumen = async (e) => { e.w.__APP__.H.goTab(['movimientos']); await sleep(10); e.w.__APP__.H.setMovVista(['resumen']); await sleep(10); return txt(e); };
  const r0 = await resumen(sinC), r3 = await resumen(tresC);
  ok(r0 === r3, 'el Resumen de Movimientos (categorías y presupuestos) es idéntico');
  tresC.w.__APP__.H.setMovVista(['lista']); await sleep(10);
  const listaTres = tresC.doc.querySelectorAll('#movList .row').length;
  sinC.w.__APP__.H.setMovVista(['lista']); await sleep(10);
  ok(listaTres === sinC.doc.querySelectorAll('#movList .row').length, 'la lista de Movimientos enseña los mismos movimientos');

  /* 2. Un traspaso no se cuela en ningún informe */
  const T = { id: 't1', tipo: 'Traspaso', categoria: 'Traspaso', importe: 500, fecha: d2, cuentaId: 'c1', cuentaDestinoId: 'c2', descripcion: 'Cajero' };
  let e = await env(CUENTAS3, ANTIGUOS.concat([T])), A = e.w.__APP__, H = A.H;
  ok(JSON.stringify(A.kpisMes(Y, M)) === JSON.stringify(tresC.w.__APP__.kpisMes(Y, M)), 'con el traspaso, el mes no cambia');
  ok(A.patrimonio().total === tresC.w.__APP__.patrimonio().total, 'ni el patrimonio total');
  H.goTab(['movimientos']); await sleep(10); H.setMovVista(['resumen']); await sleep(10);
  ok(!/Traspaso/.test(txt(e)) && !/500/.test(txt(e)), 'no aparece en el Resumen por categorías');
  H.setMovVista(['lista']); await sleep(10);
  H.setMovFiltro(['_gastos']); await sleep(10);
  ok(!/Traspaso/.test(txt(e)) && !e.doc.querySelector('.row.traspaso'), 'no aparece con el filtro «Gastos»');
  H.setMovFiltro(['Ingreso']); await sleep(10);
  ok(!e.doc.querySelector('.row.traspaso'), 'ni con el filtro «Ingresos»');
  H.setMovFiltro(['Todos']); await sleep(10);
  ok(!!e.doc.querySelector('.row.traspaso'), 'sí se ve en «Todos»');
  // calendario con los movimientos activados
  H.goTab(['calendario']); await sleep(10);
  A.S.calFiltros.movs = true; A.render(); await sleep(10);
  ok(!/Cajero/.test(txt(e)) && !/Traspaso/.test(txt(e)), 'el calendario con movimientos no enseña el traspaso');
  A.S.calFiltros.movs = false;
  // avisos de recurrentes (agenda) y buscador
  ok(JSON.stringify(A.avisosRecurrentes()) === JSON.stringify(tresC.w.__APP__.avisosRecurrentes()), 'los avisos de pagos recurrentes no lo tienen en cuenta');
  console.log('INFO buscador general con «Cajero»: ' + (/Nada con/.test(A.buscarResHtml('Cajero')) ? 'no lo encuentra (hueco conocido)' : 'lo encuentra'));
  // copia de seguridad
  let cap = null;
  e.w.URL.createObjectURL = (b) => { cap = b; return 'blob:x'; }; e.w.URL.revokeObjectURL = () => {};
  H.exportBackup([]); await sleep(30);
  const json = cap ? JSON.parse(await cap.text()) : null;
  ok(json && json.movimientos.length === 7 && json.movimientos.some((m) => m.tipo === 'Traspaso' && m.cuentaDestinoId === 'c2'), 'la copia de seguridad (.json) sí se lleva el traspaso con sus dos cuentas');

  /* 3. Traspaso con fecha futura: no mueve el saldo hasta que llegue el día */
  e = await env(CUENTAS3.slice(0, 2), [Object.assign({}, T, { fecha: dentro(5) })]); A = e.w.__APP__;
  ok(A.saldoCuenta(A.cfg().cuentas[0]) === 1000 && A.saldoCuenta(A.cfg().cuentas[1]) === 300, 'un traspaso con fecha futura todavía no cambia ningún saldo');
  ok(A.enTusCuentas() === 1300, '«En tus cuentas» tampoco');

  /* 4. Gasto compartido: el mes cuenta tu parte y la cuenta lo que pagaste de verdad */
  e = await env(CUENTAS3.slice(0, 2), [{ id: 'p1', tipo: 'Gasto', categoria: 'Restaurantes y bares', importe: 50, fecha: d2, compartidoId: 's1' }]); A = e.w.__APP__; H = A.H;
  A.S.compartidos = [{ id: 's1', grupoId: 'gr', fecha: d2, tipo: 'Gasto', categoria: 'Restaurantes y bares', importe: 100, pagadoPor: 'yo', reparto: { yo: 50, otro: 50 } }];
  A.render(); await sleep(10);
  ok(A.kpisMes(Y, M).gastos === 50, 'el mes cuenta tu parte (50)');
  ok(A.saldoCuenta(A.cfg().cuentas[0]) === 900, 'la cuenta principal baja lo que pagaste de verdad (100)');
  H.cuentaVer(['c1']); await sleep(15);
  const compEnFicha = /900,00/.test(sh(e)) && /950,00/.test(sh(e));
  ok(compEnFicha, 'la ficha enseña las dos cifras: lo que sale del banco (900 €) y tu saldo solo con tu parte (950 €)');
  H.closeSheet([]); await sleep(260);
  H.irMovsCuenta(['c1']); await sleep(260); H.setMovModo(['todo']); await sleep(15);
  const filasCuenta = e.doc.querySelectorAll('#movList .row').length;
  console.log('INFO «Ver movimientos» de la cuenta enseña ' + filasCuenta + ' filas con el compartido (hueco 4 de la revisión, pendiente)');
  ok(A.saldoCuenta(A.cfg().cuentas[0]) === 900, 'el saldo no cambia por mirar la lista');

  /* 5. Cambiar la cuenta principal mueve de golpe todos los movimientos sin cuenta */
  e = await env([{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: hace(20) }, { id: 'c2', nombre: 'Hucha', tipo: 'ahorro', saldo: 500, fecha: hace(20) }],
    [{ id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 100, fecha: d2 }]); A = e.w.__APP__;
  const antes = [A.saldoCuenta(A.cfg().cuentas[0]), A.saldoCuenta(A.cfg().cuentas[1]), A.enTusCuentas()];
  A.H.openCuentas([]); await sleep(10);
  click(e, 'cuentaPrincipal', '1'); await sleep(20);
  ok(!A.cfg().cuentas[1].principal, 'al pulsar «Hacer principal» todavía no cambia nada');
  ok(/Sí, cambiar/.test(sh(e)) && /movimiento sin cuenta/.test(sh(e)), 'pide confirmación y dice cuántos movimientos se mueven');
  click(e, 'cuentaPrincipalNo'); await sleep(20);
  ok(!A.cfg().cuentas[1].principal, 'cancelar lo deja como estaba');
  click(e, 'cuentaPrincipal', '1'); await sleep(20);
  click(e, 'cuentaPrincipalSi', '1'); await sleep(20);
  const despues = [A.saldoCuenta(A.cfg().cuentas[0]), A.saldoCuenta(A.cfg().cuentas[1]), A.enTusCuentas()];
  console.log('INFO tras confirmar: [Banco, Hucha, En tus cuentas] = ' + despues.join(', '));
  ok(JSON.stringify(e.store.movimientos.g1) === JSON.stringify({ id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 100, fecha: d2 }), 'cambiar la principal no toca ningún movimiento guardado');
  click(e, 'cuentaPrincipal', '0'); await sleep(20); click(e, 'cuentaPrincipalSi', '0'); await sleep(20);
  ok(JSON.stringify([A.saldoCuenta(A.cfg().cuentas[0]), A.saldoCuenta(A.cfg().cuentas[1]), A.enTusCuentas()]) === JSON.stringify(antes), 'y se deshace volviendo a marcar la de antes');

  /* 6. Cuenta con saldo pero sin fecha (una configuración rara o restaurada) */
  e = await env([{ id: 'c1', nombre: 'Banco', saldo: 1000 }, { id: 'c2', nombre: 'Otra', saldo: 20 }], [{ id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 10, fecha: d2 }]); A = e.w.__APP__;
  ok(A.saldoCuenta(A.cfg().cuentas[0]) === 1000, 'sin fecha de partida, el saldo se queda tal cual (no se descuadra)');
  let crash = '';
  try { A.H.openCuentas([]); await sleep(20); } catch (x) { crash = x.message; }
  console.log('INFO cuenta con saldo y sin fecha: abrir «Cuentas y saldos» ' + (sh(e) ? 'se pinta' : 'NO se pinta (queda en blanco)') + (crash ? ' · error: ' + crash : ''));

  /* 7. Importar un extracto donde viene un reintegro ya apuntado como traspaso */
  e = await env([{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: hace(20) }, { id: 'c2', nombre: 'Efectivo', tipo: 'efectivo', saldo: 0, fecha: hace(20) }],
    [{ id: 't1', tipo: 'Traspaso', categoria: 'Traspaso', importe: 100, fecha: d2, cuentaId: 'c1', cuentaDestinoId: 'c2', descripcion: 'Cajero' },
      { id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 32.4, fecha: d2, descripcion: 'MERCADONA' }],
    null, (w) => { w.TextDecoder = TextDecoder; });
  A = e.w.__APP__; H = A.H;
  const [dd, mm] = [d2.slice(8, 10), d2.slice(5, 7)];
  const csv = ['Fecha;Concepto;Importe', dd + '/' + mm + '/' + d2.slice(0, 4) + ';COMPRA MERCADONA;-32,40', dd + '/' + mm + '/' + d2.slice(0, 4) + ';REINTEGRO CAJERO;-100,00'].join('\r\n');
  H.goTab(['movimientos']); await sleep(10); click(e, 'impAbrir'); await sleep(10);
  await H.impArchivo([], { files: [file('extracto.csv', ab(Buffer.from(csv, 'latin1')))] }); await sleep(40);
  H.impRevisar(); await sleep(20);
  const filas = A.imp().filas;
  const fGasto = filas.find((r) => /MERCADONA/.test(r.desc || '')), fCajero = filas.find((r) => /CAJERO/.test(r.desc || ''));
  ok(fGasto && fGasto.estado === 'dup' && !fGasto.incluir, 'al importar, un gasto que ya tienes sale marcado como posible duplicado');
  ok(fCajero && fCajero.estado === 'dup' && !fCajero.incluir, 'un reintegro de cajero ya apuntado como traspaso sale como repetido y no se importa');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

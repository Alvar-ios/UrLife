// Calidad (17-10-2026): revisión de «Cuentas, bloque 1» y de la ficha con dos cifras («Lo que sale del banco» / «Tu saldo»).
// Las líneas «INFO» no fallan: dejan constancia de comportamientos que hay que decidir.
console.error = () => {};
const fs = require('fs'), path = require('path');
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const info = (m) => console.log('INFO ' + m);
const hace = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const HOY = new Date(), Y = HOY.getFullYear(), M = HOY.getMonth() + 1;
const DOS = [{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: hace(10) }, { id: 'c2', nombre: 'Efectivo', tipo: 'efectivo', saldo: 50, fecha: hace(10) }];
// guarda lo que se envía a la base de datos, para imitar la de verdad (que solo cambia las columnas enviadas)
const espia = (w) => { w.__enviado = {}; const col = w.Data.collection; w.Data.collection = (n) => { const c = col(n), doc = c.doc; c.doc = (id) => { const d = doc(id), set = d.set; d.set = async (x) => { w.__enviado[id] = JSON.parse(JSON.stringify(x)); return set(x); }; return d; }; return c; }; };
async function env(cuentas, movs, app) {
  const e = makeEnv({
    cfg: { app: Object.assign({ categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas)) }, app || {}), meta: { onboarded: true } },
    movs: JSON.parse(JSON.stringify(movs || [])), url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre: espia,
  });
  await sleep(120); return e;
}
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const juntos = (A) => { const g = {}; (A.S.compartidos || []).forEach((c) => { g[c.grupoId] = 1; }); return Math.round(Object.keys(g).reduce((s, id) => s + (A.saldosDe(id).yo || 0), 0)) / 100; };
const ts = (n) => new Date(Date.now() - n * 864e5).toISOString();
(async () => {
  /* 1. Ficha con dos cifras: cuadra con Juntos cuando la cuenta empezó antes de todos los compartidos */
  let e = await env(DOS, []), A = e.w.__APP__;
  A.S.compartidos = [
    { id: 's1', grupoId: 'gA', fecha: hace(5), createdAt: ts(5), tipo: 'Gasto', categoria: 'Cena', importe: 100, pagadoPor: 'yo', reparto: { yo: 50, ana: 50 } },
    { id: 's2', grupoId: 'gA', fecha: hace(4), createdAt: ts(4), tipo: 'Gasto', categoria: 'Ocio', importe: 30, pagadoPor: 'ana', reparto: { yo: 15, ana: 15 } },
    { id: 's3', grupoId: 'gB', fecha: hace(3), createdAt: ts(3), tipo: 'Gasto', categoria: 'Taxi', importe: 40, pagadoPor: 'yo', reparto: { yo: 0, luis: 40 } },
    { id: 's4', grupoId: 'gA', fecha: hace(2), createdAt: ts(2), tipo: 'Liquidación', categoria: 'Liquidación', importe: 20, pagadoPor: 'ana', reparto: { yo: 20 } }];
  let k = A.compartidosCuenta(A.cfg().cuentas[0]);
  ok(k.neto === juntos(A), '«Tu saldo» cuadra con Juntos si la cuenta empezó antes de todos los compartidos (' + k.neto + ' = ' + juntos(A) + ')');
  ok(A.compartidosCuenta(A.cfg().cuentas[1]).neto === 0, 'una cuenta que no es la principal no suma compartidos');

  /* 2. Compartido ANTERIOR a la fecha de partida y la otra persona te paga DESPUÉS */
  e = await env(DOS, []); A = e.w.__APP__;
  A.S.compartidos = [
    { id: 'v1', grupoId: 'gA', fecha: hace(20), createdAt: ts(20), tipo: 'Gasto', categoria: 'Cena', importe: 100, pagadoPor: 'yo', reparto: { yo: 50, ana: 50 } },
    { id: 'v2', grupoId: 'gA', fecha: hace(2), createdAt: ts(2), tipo: 'Liquidación', categoria: 'Liquidación', importe: 50, pagadoPor: 'ana', reparto: { yo: 50 } }];
  A.render(); await sleep(10);
  k = A.compartidosCuenta(A.cfg().cuentas[0]);
  info('cena de antes de la fecha de partida + pago de Ana después: Juntos dice ' + juntos(A) + ' (en paz); la ficha dice neto ' + k.neto);
  A.H.cuentaVer(['c1']); await sleep(15);
  ok(!/Ahora debes/.test(sh(e)), 'si ya estáis en paz en Juntos, la ficha no debe decir «Ahora debes…» (hoy dice: ' + ((sh(e).match(/Ahora[^.]*\./) || [''])[0]) + ')');
  A.H.closeSheet([]); await sleep(260);

  /* 3. Compartido anterior a la fecha de partida y aún sin pagar */
  e = await env(DOS, []); A = e.w.__APP__;
  A.S.compartidos = [{ id: 'w1', grupoId: 'gA', fecha: hace(20), createdAt: ts(20), tipo: 'Gasto', categoria: 'Cena', importe: 100, pagadoPor: 'yo', reparto: { yo: 50, ana: 50 } }];
  k = A.compartidosCuenta(A.cfg().cuentas[0]);
  ok(k.neto === 50 && k.neto === juntos(A) && k.n > 0, 'una cena anterior a la fecha de partida y sin pagar: la ficha dice que te deben 50, como Juntos');

  /* 4. Convertir en traspaso, imitando la base de datos de verdad (solo cambia lo que se envía) */
  const orig = { id: 'imp-1', tipo: 'Gasto', categoria: 'Otros', subcategoria: 'Varios', importe: 60, fecha: hace(2), descripcion: 'CAJERO', metodoPago: 'Tarjeta', cuentaId: 'c1', lote: 'L1', orden: 3, articulos: [{ n: 'x', p: 1 }], creadoEn: 1 };
  e = await env(DOS, [orig]); A = e.w.__APP__;
  const gAntes = A.kpisMes(Y, M).gastos;
  A.H.openMovForm(['imp-1']); await sleep(15); click(e, 'movAtraspaso', 'imp-1'); await sleep(15);
  await A.H.saveTraspaso([]); await sleep(40);
  const env1 = e.w.__enviado['imp-1'] || {};
  const fila = Object.assign({}, orig, env1); // lo que quedaría en la fila real
  ok(fila.tipo === 'Traspaso' && fila.subcategoria == null && fila.metodoPago == null && fila.articulos == null && fila.cuentaDestinoId === 'c2', 'en la fila real se borran subcategoría, forma de pago y ticket, y queda como traspaso');
  ok(!('compartidoId' in env1) && !('metaId' in env1), 'no envía columnas de compartir ni de metas (no hacen falta: esos movimientos no se pueden convertir)');
  ok(env1.lote === null, 'al convertir se quita el lote de importación («Deshacer importación» ya no borra el traspaso)');
  info('columnas que siguen en la fila real tras convertir: ' + Object.keys(orig).filter((x) => !(x in env1) && x !== 'id').join(', '));
  e = await env(DOS, [fila]); A = e.w.__APP__;
  ok(Math.round((gAntes - A.kpisMes(Y, M).gastos) * 100) / 100 === 60 && A.S.traspasos.length === 1 && !A.S.movimientos.some((m) => m.id === 'imp-1'), 'con la fila real, deja de contar como gasto y solo está en traspasos');
  ok(A.saldoCuenta(A.cfg().cuentas[0]) === 940 && A.saldoCuenta(A.cfg().cuentas[1]) === 110, 'el banco baja 60 y el efectivo sube 60 (no se cuenta dos veces)');

  /* 5. Convertir un ingreso fijo (nómina) en traspaso: ¿vuelve a preguntar «¿Se ha producido?»? */
  const dN = hace(3), dia = Number(dN.slice(8, 10));
  const cob = { cobros: [{ nombre: 'Nómina', importe: 1200, regla: { t: 'dia', dia, ajuste: '' }, desde: hace(15) }] };
  e = await env(DOS, [{ id: 'n1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1200, fecha: dN, cuentaId: 'c1', creadoEn: 1 }], cob); A = e.w.__APP__;
  const pendAntes = A.avisosRecurrentes().pasados.length;
  A.H.openMovForm(['n1']); await sleep(15);
  ok(pendAntes === 0 && !/Convertir en traspaso/.test(sh(e)), 'la nómina (un cobro fijo) no se puede convertir: si no, Inicio volvería a preguntar «¿Se ha producido?»');
  A.H.closeSheet([]); await sleep(260);
  e = await env(DOS, [{ id: 'n2', tipo: 'Ingreso', categoria: 'Bizum', importe: 30, fecha: dN, cuentaId: 'c1', creadoEn: 1 }], cob); A = e.w.__APP__;
  A.H.openMovForm(['n2']); await sleep(15);
  ok(/Convertir en traspaso/.test(sh(e)), 'un ingreso que no es fijo sí tiene «Convertir en traspaso»');
  click(e, 'movAtraspaso', 'n2'); await sleep(15);
  ok(A.form().desde === 'c2' && A.form().a === 'c1', 'en un ingreso propone de la otra cuenta a la suya');

  /* 6. Una devolución (gasto en negativo): ¿hacia dónde propone el traspaso? */
  e = await env(DOS, [{ id: 'd1', tipo: 'Gasto', categoria: 'Supermercado', importe: -15, fecha: hace(2), cuentaId: 'c1' }]); A = e.w.__APP__;
  A.H.openMovForm(['d1']); await sleep(15);
  click(e, 'movAtraspaso', 'd1'); await sleep(15);
  ok(A.form().desde === 'c2' && A.form().a === 'c1', 'una devolución (dinero que entró en Banco) propone el traspaso hacia Banco');
  A.H.closeSheet([]); await sleep(260);

  /* 7. Borrar la casilla del saldo */
  e = await env(DOS, []); A = e.w.__APP__;
  A.H.openCuentas([]); await sleep(10); click(e, 'cuentaEditar', '0'); await sleep(10);
  const inp = e.doc.querySelector('#sheetHost .cuenta-ed input.amt');
  inp.value = ''; inp.dispatchEvent(new e.w.Event('change', { bubbles: true })); await sleep(20);
  ok(A.cfg().cuentas[0].saldo === 1000 && Number(inp.value) === 1000, 'vaciar la casilla del saldo no lo borra (vuelve a enseñar el que había)');
  A.H.closeSheet([]); await sleep(260);

  /* 8. Mirando la cuenta principal: compartidos que pagaste por otros y pagos de deudas */
  e = await env(DOS, []); A = e.w.__APP__;
  A.S.compartidos = [{ id: 'x1', grupoId: 'gB', fecha: hace(2), createdAt: ts(2), tipo: 'Gasto', categoria: 'Regalo', importe: 40, pagadoPor: 'yo', reparto: { luis: 40 } },
    { id: 'x2', grupoId: 'gA', fecha: hace(1), createdAt: ts(1), tipo: 'Liquidación', categoria: 'Liquidación', importe: 25, pagadoPor: 'yo', reparto: { ana: 25 } }];
  A.render(); await sleep(10);
  A.H.irMovsCuenta(['c1']); await sleep(260); A.H.setMovModo(['todo']); await sleep(15);
  const lista = (e.doc.querySelector('#movList') || { textContent: '' }).textContent;
  ok(A.saldoCuenta(A.cfg().cuentas[0]) === 935 && /Regalo/.test(lista) && /40,00/.test(lista), 'mirando la principal sale el regalo que pagaste entero por otro (40 €)');
  ok(/Saldar deudas/.test(lista) && /25,00/.test(lista) && /pagaste al saldar/.test(lista), 'y el pago de 25 € al saldar en Juntos');
  ok(Math.round(A.kpisMes(Y, M).gastos * 100) === 0, 'esas filas no cambian tus gastos del mes');

  /* 9. Sin datos o con una sola cuenta */
  e = await env([], []); A = e.w.__APP__;
  let crash = ''; try { A.H.openCuentas([]); await sleep(10); A.H.closeSheet([]); await sleep(260); A.H.cuentasHoja([]); await sleep(10); A.H.closeSheet([]); await sleep(260); A.H.goTab(['movimientos']); await sleep(15); } catch (x) { crash = x.message; }
  ok(!crash, 'usuario nuevo sin cuentas: Cuentas, «En tus cuentas» y Movimientos se abren sin errores');
  ok(!/Convertir/.test(A.buscarResHtml('a')) && A.buscarResHtml('traspaso').indexOf('Traspasos') < 0, 'sin traspasos, el buscador no enseña la sección Traspasos');
  e = await env([DOS[0]], [{ id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 10, fecha: hace(1) }]); A = e.w.__APP__;
  A.H.openMovForm(['g1']); await sleep(15);
  ok(!/Convertir en traspaso/.test(sh(e)), 'con una sola cuenta no sale «Convertir en traspaso»');

  /* 10. Aspecto «Nuevo»: ¿tienen estilo propio las piezas de cuentas? (solo lectura del CSS) */
  const look = fs.readFileSync(path.join(__dirname, '..', 'look.css'), 'utf8');
  const piezas = ['hero-cuentas', 'cuenta-fila', 'cuentas-total', 'cuentas-card', 'cuenta-ed', 'asignar-aviso', 't-tras', 'amt-sub'];
  info('piezas de cuentas sin regla propia en look.css: ' + piezas.filter((p) => look.indexOf(p) < 0).join(', '));

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

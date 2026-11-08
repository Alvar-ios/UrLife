// 08/11/2026 · Calidad: fallos encontrados en la rama fase9/tanda5 (tandas 5 y 6). Datos inventados.
// NO va en `npm test` (run.js solo coge test*.js): hoy FALLA a propósito. Cuando Desarrollo arregle cada punto,
// que lo compruebe con `node tests/pendiente_t56.js` y pase la comprobación a un testN.js.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
const { TextDecoder } = require('util');
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const file = (name, buf) => ({ name, size: buf.byteLength, arrayBuffer: async () => buf });
const ING = fs.readFileSync(path.join(__dirname, 'fixtures', 'extractos', 'ing_ejemplo.csv'), 'utf8');
const TRES = [{ id: 'cs', nombre: 'Santander', banco: 'santander', principal: true, saldo: 1000, fecha: '2026-09-01' }, { id: 'ci', nombre: 'Cuenta naranja', banco: 'ing', tipo: 'ahorro', saldo: 2000, fecha: '2026-09-01' }, { id: 'ce', nombre: 'Efectivo', tipo: 'efectivo', saldo: 50, fecha: '2026-09-01' }];
const guardados = (e) => Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v));
const refrescar = (e) => { const A = e.w.__APP__, g = guardados(e); A.S._movsRaw = g; A.S.traspasos = g.filter((m) => m.tipo === 'Traspaso'); A.S.movimientos = g.filter((m) => m.tipo !== 'Traspaso'); };
async function env(movs, cuentas, extra) {
  const e = makeEnv({ cfg: { app: Object.assign({ categoriasGasto: [{ nombre: 'Otros' }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas)) }, extra || {}), meta: { onboarded: true } },
    movs: JSON.parse(JSON.stringify(movs)), url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre: (w) => { w.TextDecoder = TextDecoder; }, version: { dinero: 0 } });
  await sleep(120); refrescar(e); return e;
}
async function importar(e, cuenta, txt) { const A = e.w.__APP__; A.H.impEnCuenta([cuenta]); await sleep(10); await A.H.impArchivo([], { files: [file('ing.csv', ab(Buffer.from(txt)))] }); await sleep(40); A.H.impRevisar([]); await sleep(20); return A.imp(); }
const cerrar = async (e) => { e.w.__APP__.H.closeSheet([]); await sleep(260); };
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const meta = { ahorro: [{ id: 'mj', nombre: 'Viaje', objetivo: 3000, cuentaId: 'ci' }] };
const aporte = { id: 'ap', tipo: 'Ahorro', importe: 500, categoria: 'Viaje', fecha: '2026-10-04', metaId: 'mj', cuentaId: 'cs', cuentaDestinoId: 'ci', creadoEn: 1, descripcion: '', metodoPago: '' };

(async () => {
  /* 1 (grave · duplica) Aporte ligado de 500 € Santander → ING y luego importar el extracto de ING:
     la entrada «TRANSFERENCIA DESDE SANTANDER» sale como traspaso NUEVO y MARCADO → ING suma 500 € dos veces. app.js impProcesar (búsqueda de «otraMitad» solo mira S.traspasos) */
  let e = await env([aporte], TRES, meta), A = e.w.__APP__;
  let I = await importar(e, 'ci', ING), r = I.filas.find((x) => /DESDE SANTANDER/.test(x.desc));
  ok(!(r.incluir && r.comoTras), '1 · la entrada en ING de un aporte ligado no se importa otra vez como traspaso (debe ser «la otra mitad» o al menos ir desmarcada)');
  await cerrar(e);

  /* 2 (medio · descuadra) Desligar la meta y luego editar SOLO la nota de un aporte antiguo: saveMov pone cuentaDestinoId = null
     y los 500 € «vuelven» de ING a Santander. app.js saveMov: `else if (!dest && 'cuentaDestinoId' in data) data.cuentaDestinoId = null` */
  e = await env([aporte], TRES, { ahorro: [{ id: 'mj', nombre: 'Viaje', objetivo: 3000 }] }); A = e.w.__APP__;
  const antes = A.cfg().cuentas.map((c) => A.saldoCuenta(c)).join();
  A.H.openMovForm(['ap']); await sleep(20); e.doc.querySelector('#fDesc').value = 'solo cambio la nota'; await A.H.saveMov([]); await sleep(40); refrescar(e);
  ok(A.cfg().cuentas.map((c) => A.saldoCuenta(c)).join() === antes, '2 · cambiar la nota de un aporte (meta ya desligada) no mueve dinero entre cuentas');
  await cerrar(e);

  /* 3 (medio · descuadra) Meta ligada a una cuenta SIN saldo puesto: aportar resta de Santander y no suma en ninguna → «Lo que tienes» baja.
     app.js patrimonio()/saldoCuenta: la cuenta sin saldo vale num(c.saldo) = 0 */
  e = await env([], [{ id: 'cs', nombre: 'Santander', principal: true, saldo: 1000, fecha: '2026-01-01' }, { id: 'ci', nombre: 'ING Ahorro', tipo: 'ahorro' }], meta); A = e.w.__APP__;
  const p0 = A.patrimonio().total;
  A.H.metaAportarR(['mj']); await sleep(10); A.form().importe = '100'; await A.H.aportarRGuardar([]); await sleep(40); refrescar(e); await cerrar(e);
  ok(A.patrimonio().total === p0, '3 · «Lo que tienes» no baja al aportar a una meta cuya cuenta no tiene saldo puesto (hoy baja 100 €)');

  /* 4 (medio · confunde) Tras «Sí, convertir», la tarjeta del saldo dice «Diferencia +500 €» y ofrece «Cuadrar con el banco»:
     el traspaso convertido aún no está en S.traspasos ni en I.recien. app.js impEjecutar (I.recien) / impSaldoTarjetaHtml */
  const C4 = JSON.parse(JSON.stringify(TRES)); C4[1].saldo = 3000; C4[1].fecha = '2026-10-01';
  e = await env([{ id: 'm_viejo', tipo: 'Gasto', importe: 500, categoria: 'Otros', fecha: '2026-10-04', descripcion: 'Transferencia a ING', cuentaId: 'cs', creadoEn: 1 }], C4); A = e.w.__APP__;
  I = await importar(e, 'ci', ING); r = I.filas.find((x) => /DESDE SANTANDER/.test(x.desc));
  A.H.impConvertir([String(I.filas.indexOf(r)), '1']); await A.H.impEjecutar([]); await sleep(80);
  ok(!/Diferencia/.test(sh(e)), '4 · tras convertir, el resumen no enseña una diferencia falsa con el banco (hoy: +500 €)');
  await cerrar(e);

  /* 5 (medio · deshacer no deshace) Una inversión antigua sin cuenta (con activoId) coincide con una fila; «Ponerle la cuenta» y luego Deshacer:
     impDeshacerPlan la salta por «enlazada» aunque ya lo estaba antes, el lote se borra y la cuenta se queda. docs/30b §4 paso 4 dice «y antes no» */
  e = await env([{ id: 'm_inv', tipo: 'Inversión', importe: 15, categoria: 'Fondo', fecha: '2026-10-18', activoId: 'a1', tipoActivo: 'Fondo', creadoEn: 1 }], TRES); A = e.w.__APP__;
  I = await importar(e, 'ci', ING); r = I.filas.find((x) => /LIBRERIA/.test(x.desc));
  A.H.impAsignar([String(I.filas.indexOf(r))], { checked: true }); await A.H.impEjecutar([]); await sleep(80); await cerrar(e); refrescar(e);
  await A.H.impDeshacer([A.cfg().importLotes.slice(-1)[0].id]); await sleep(80);
  ok(!e.store.movimientos.m_inv.cuentaId, '5 · deshacer devuelve la cuenta de un movimiento que YA estaba enlazado antes de importar');

  /* 6 (leve) «Desmarcar todas» no quita un «Sí, convertir» ni un «Ponerle la cuenta»: el botón pasa a «Arreglar 1». app.js H.impTodas */
  e = await env([{ id: 'm_viejo', tipo: 'Gasto', importe: 500, categoria: 'Otros', fecha: '2026-10-04', descripcion: 'x', cuentaId: 'cs', creadoEn: 1 }], TRES); A = e.w.__APP__;
  I = await importar(e, 'ci', ING); r = I.filas.find((x) => /DESDE SANTANDER/.test(x.desc));
  A.H.impConvertir([String(I.filas.indexOf(r)), '1']); A.H.impTodas(['0']); await sleep(5);
  ok(!/Arreglar 1/.test(sh(e)), '6 · «Desmarcar todas» también deja sin hacer los arreglos');
  await cerrar(e);

  /* 7 (leve) Cambiar un aporte ligado a OTRA meta ligada a otra cuenta: cuentaDestinoId se queda en la cuenta vieja. app.js saveMov (solo mira `!FORM.id`) */
  const C7 = TRES.concat([{ id: 'cx', nombre: 'Otra ahorro', tipo: 'ahorro', saldo: 0, fecha: '2026-09-01' }]);
  e = await env([aporte], C7, { ahorro: [{ id: 'mj', nombre: 'Viaje', cuentaId: 'ci' }, { id: 'mk', nombre: 'Coche', cuentaId: 'cx' }] }); A = e.w.__APP__;
  A.H.openMovForm(['ap']); await sleep(20); A.form().metaSel = 'mk'; await A.H.saveMov([]); await sleep(40);
  ok(e.store.movimientos.ap.cuentaDestinoId !== 'ci', '7 · al pasar el aporte a la meta «Coche» (en otra cuenta), el dinero no se queda en la cuenta de «Viaje»');
  await cerrar(e);

  /* 8 (leve) «Ver movimientos» de una cuenta no enseña los aportes ligados, aunque cambian su saldo (la ficha sí). app.js renderMovimientos: filtro `tocaCuenta(m)` */
  e = await env([aporte], TRES, meta); A = e.w.__APP__;
  A.H.irMovsCuenta(['ci']); await sleep(30); A.H.setMovVista && A.H.setMovVista(['lista']); await sleep(30);
  ok(/Viaje/.test(e.doc.querySelector('#content').textContent), '8 · en «Ver movimientos» de ING sale el aporte que la subió');

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})();

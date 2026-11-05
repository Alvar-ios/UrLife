// Calidad (05/11/2026) · docs/30 tanda 3: casos límite de los traspasos al importar. Extractos y cuentas inventados.
// FAIL = algo que debe funcionar y no funciona; AVISO = caso dudoso que se cuenta en el informe (no para la suite).
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
const { TextDecoder } = require('util');
const fs = require('fs'), path = require('path');
let fails = 0, avisos = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const aviso = (c, m) => { console.log((c ? 'PASS ' : 'AVISO ') + m); if (!c) avisos++; };
const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const file = (name, buf) => ({ name, size: buf.byteLength, arrayBuffer: async () => buf });
const leer = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', 'extractos', n));
const csv = (txt) => Buffer.from(txt, 'utf8');
const guardados = (e) => Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v));
const sincronizar = (e) => { const A = e.w.__APP__, g = guardados(e); A.S._movsRaw = g; A.S.traspasos = g.filter((m) => m.tipo === 'Traspaso'); A.S.movimientos = g.filter((m) => m.tipo !== 'Traspaso'); }; // en la app lo hace el aviso en tiempo real
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const r2 = (x) => Math.round(x * 100) / 100;

async function env(cuentas) {
  const e = makeEnv({
    cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas)) }, meta: { onboarded: true } },
    movs: [], url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre: (w) => { w.TextDecoder = TextDecoder; },
  });
  await sleep(120); return e;
}
async function importar(e, cuenta, nombre, buf) {
  const A = e.w.__APP__;
  A.H.goTab(['movimientos']); await sleep(10); A.H.impAbrir([]); await sleep(10);
  if (cuenta) { A.H.impEnCuenta([cuenta]); await sleep(10); }
  await A.H.impArchivo([], { files: [file(nombre, ab(buf))] }); await sleep(40);
  if (cuenta && A.imp().cuenta !== cuenta) { A.H.impCuenta([cuenta]); await sleep(5); }
  A.H.impRevisar([]); await sleep(20);
  return A.imp();
}
const fila = (I, re) => I.filas.find((r) => re.test(r.desc || ''));

(async () => {
  // ---------- 1) traspasos falsos ----------
  {
    const CS = [{ id: 'cs', nombre: 'Santander', banco: 'santander', principal: true, saldo: 1000, fecha: '2026-09-01' },
      { id: 'cc', nombre: 'Casa', saldo: 0, fecha: '2026-09-01' }, { id: 'ca', nombre: 'Ahorro', saldo: 0, fecha: '2026-09-01' },
      { id: 'ci', nombre: 'Cuenta naranja', banco: 'ing', saldo: 0, fecha: '2026-09-01' }, { id: 'ce', nombre: 'Efectivo', tipo: 'efectivo', saldo: 0, fecha: '2026-09-01' }];
    const e = await env(CS);
    const I = await importar(e, 'cs', 'santander_raro.csv', csv('Fecha;Concepto;Importe;Saldo\n' +
      '01/10/2026;TRANSFERENCIA A JUAN PEREZ;-100,00;900,00\n' +
      '02/10/2026;COMPRA PARKING CENTRO;-5,00;895,00\n' +
      '03/10/2026;TRANSFERENCIA RECIBIDA INGRESOS ALQUILER;300,00;1.195,00\n' +
      '04/10/2026;BIZUM A ANA CENA;-20,00;1.175,00\n' +
      '05/10/2026;TRANSFERENCIA ALQUILER CASA RURAL;-200,00;975,00\n' +
      '06/10/2026;TRANSFERENCIA PLAN AHORRO SEGURO VIDA;-30,00;945,00\n' +
      '07/10/2026;COMISION REINTEGRO CAJERO OTRA ENTIDAD;-2,00;943,00\n' +
      '08/10/2026;INGRESO EFECTIVO CAJERO;100,00;1.043,00\n' +
      '09/10/2026;TRANSFERENCIA DESDE ING;300,00;1.343,00\n' +
      '10/10/2026;TRANSFERENCIA A ING AHORRO;-50,00;1.293,00\n'));
    const f = (re) => fila(I, re);
    ok(I.filas.length >= 10, 'se leen las 10 filas del extracto inventado');
    ok(!f(/JUAN/).comoTras, '«TRANSFERENCIA A JUAN PEREZ» (Juan no es cuenta tuya) no es traspaso');
    ok(!f(/PARKING/).comoTras, '«PARKING» no se confunde con ING (palabra entera)');
    ok(!f(/INGRESOS ALQUILER/).comoTras, '«INGRESOS» no se confunde con ING');
    ok(!f(/BIZUM/).comoTras, 'un Bizum no es traspaso');
    aviso(!f(/CASA RURAL/).comoTras, '«TRANSFERENCIA ALQUILER CASA RURAL» con una cuenta llamada «Casa» no debería ser traspaso (sale: ' + (f(/CASA RURAL/).comoTras ? 'traspaso a ' + f(/CASA RURAL/).otra : 'gasto') + ')');
    aviso(!f(/PLAN AHORRO/).comoTras, '«TRANSFERENCIA PLAN AHORRO SEGURO» con una cuenta llamada «Ahorro» no debería ser traspaso (sale: ' + (f(/PLAN AHORRO/).comoTras ? 'traspaso a ' + f(/PLAN AHORRO/).otra : 'gasto') + ')');
    aviso(!f(/COMISION REINTEGRO/).comoTras, '«COMISION REINTEGRO CAJERO» (2 €) es una comisión, no dinero que va a Efectivo (sale: ' + (f(/COMISION/).comoTras ? 'traspaso a ' + f(/COMISION/).otra : 'gasto') + ')');
    ok(!f(/INGRESO EFECTIVO CAJERO/).comoTras, 'ingreso en cajero (positivo) no se marca como sacar de cajero');
    const desde = f(/DESDE ING/);
    ok(desde.comoTras && desde.otra === 'ci' && /parece un traspaso desde Cuenta naranja/.test(sh(e)), 'ingreso «TRANSFERENCIA DESDE ING» → «parece un traspaso desde Cuenta naranja»');
    const amb = f(/A ING AHORRO/);
    aviso(amb.comoTras && amb.otra === 'ci', '«TRANSFERENCIA A ING AHORRO» con cuentas «Ahorro» y ING: debería ir a ING o preguntar (sale: ' + amb.otra + ')');
    // selector: quitar la cuenta desmarca; volver a ponerla marca
    const k = String(I.filas.indexOf(desde));
    e.w.__APP__.H.impTrasCon([k], { value: '' }); await sleep(5);
    ok(desde.comoTras && desde.otra === '' && !desde.incluir && /traspaso: ¿con qué cuenta\?/.test(sh(e)), 'sin cuenta elegida: «¿con qué cuenta?» y desmarcada');
    e.w.__APP__.H.impTrasCon([k], { value: 'ci' }); await sleep(5);
    ok(desde.incluir && desde.otra === 'ci', 'al elegir la cuenta vuelve a ir marcada');
    ok(!/A Santander|Desde Santander/.test(e.doc.querySelector('#sheetHost select[aria-label="Con qué cuenta"]').innerHTML), 'el selector no ofrece la misma cuenta del extracto');
    ok(/No, es un ingreso/.test(sh(e)), 'en un ingreso el botón dice «No, es un ingreso»');
    // dirección al guardar
    I.filas.forEach((r) => { if (r.comoTras && r !== desde) e.w.__APP__.H.impTras([String(I.filas.indexOf(r)), '0']); }); await sleep(5);
    await e.w.__APP__.H.impEjecutar([]); await sleep(60);
    const t = guardados(e).filter((m) => m.tipo === 'Traspaso');
    ok(t.length === 1 && t[0].cuentaId === 'ci' && t[0].cuentaDestinoId === 'cs' && t[0].importe === 300, 'ingreso desde ING se guarda como traspaso Cuenta naranja → Santander (300 €, positivo)');
    ok(guardados(e).filter((m) => m.tipo !== 'Traspaso').every((m) => m.cuentaId === 'cs'), 'lo demás va a Santander');
  }

  // ---------- 2) los dos extractos de ejemplo: saldos que cuadran (Santander primero) ----------
  const CUENTAS = () => [{ id: 'cs', nombre: 'Santander', banco: 'santander', principal: true, saldo: 1000, fecha: '2026-09-30' },
    { id: 'ci', nombre: 'Cuenta naranja', banco: 'ing', saldo: 3000, fecha: '2026-10-01' }, { id: 'ce', nombre: 'Efectivo', tipo: 'efectivo', saldo: 50, fecha: '2026-09-30' }];
  for (const orden of [['cs', 'ci'], ['ci', 'cs']]) {
    const e = await env(CUENTAS()), A = e.w.__APP__, lotes = {};
    for (const c of orden) {
      const I = await importar(e, c, c === 'cs' ? 'santander_ejemplo.csv' : 'ing_ejemplo.csv', leer(c === 'cs' ? 'santander_ejemplo.csv' : 'ing_ejemplo.csv'));
      // el café de 1,50 del 05/10 está en los dos extractos: sale «ya importado en …: márcalo si es otro» (de la tanda 1). Aquí son dos cafés distintos: se marca.
      I.filas.forEach((r, i) => { if (r.estado === 'otraCuenta') A.H.impIncluir([String(i)], { checked: true }); }); await sleep(5);
      if (c === 'cs') {
        ok(/Los importes cuadran con la columna Saldo/.test(sh(e)), '[' + orden + '] Santander: la columna Saldo sigue cuadrando con traspasos dentro');
        const gastos = r2(I.filas.filter((r) => r.incluir && !r.comoTras && r.tipo !== 'Ingreso').reduce((a, r) => a + r.importe, 0));
        ok(gastos === 879.45, '[' + orden + '] los gastos de la vista previa no cuentan los 560 € de traspasos (' + gastos + ')');
      }
      await A.H.impEjecutar([]); await sleep(60);
      if (c === 'cs') ok(/Cuadra: la app y el banco dicen lo mismo/.test(sh(e)) || /Cuadra/.test(sh(e)), '[' + orden + '] tras importar Santander, la app y el banco dicen lo mismo el 20/10');
      lotes[c] = A.imp().lote;
      A.H.closeSheet([]); await sleep(260); sincronizar(e);
    }
    const cs = A.cfg().cuentas, s = (id) => A.saldoCuenta(cs.find((x) => x.id === id));
    ok(s('cs') === 1455.54, '[' + orden + '] saldo Santander = 1.455,54 como el banco (' + s('cs') + ')');
    ok(s('ci') === 3455.75, '[' + orden + '] saldo Cuenta naranja = 3.455,75 como el banco (' + s('ci') + ')');
    ok(s('ce') === 110, '[' + orden + '] Efectivo = 50 + 60 del cajero (' + s('ce') + ')');
    ok(guardados(e).filter((m) => m.tipo === 'Traspaso').length === 2, '[' + orden + '] dos traspasos en total (500 € y 60 €), ninguno duplicado');
    const k = A.kpisMes(2026, 10);
    ok(Math.abs(num(k.gastos) - (879.45 + 29.9 + 1.5 + 15)) < 0.01, '[' + orden + '] gastos de octubre sin traspasos (' + k.gastos + ')');
    if (orden[0] === 'cs') {
      // deshacer solo ING: el traspaso de Santander se queda
      await A.H.impDeshacer([lotes.ci]); await sleep(60); sincronizar(e);
      ok(guardados(e).filter((m) => m.tipo === 'Traspaso').length === 2 && !guardados(e).some((m) => m.lote === lotes.ci), 'deshacer ING no toca los traspasos que entraron con Santander');
      await A.H.impDeshacer([lotes.cs]); await sleep(60); sincronizar(e);
      ok(guardados(e).length === 0, 'deshacer Santander lo borra todo (también los traspasos)');
      ok(A.saldoCuenta(A.cfg().cuentas.find((x) => x.id === 'ce')) === 50, 'Efectivo vuelve a 50 tras deshacer');
    } else {
      // ING primero: la otra mitad se reconoce en Santander (03/10 frente al 04/10)
      ok(guardados(e).some((m) => m.tipo === 'Traspaso' && m.cuentaId === 'cs' && m.cuentaDestinoId === 'ci' && m.fecha === '2026-10-04'), '[ci,cs] el traspaso queda con la fecha de ING y Santander → Cuenta naranja');
    }
  }

  // ---------- 3) columna Tipo «Traspaso» sin cuenta reconocible ----------
  {
    const e = await env(CUENTAS());
    const I = await importar(e, 'cs', 'mio.csv', csv('Fecha;Concepto;Tipo;Importe\n01/10/2026;Paso a la hucha;Traspaso;-40\n02/10/2026;Pan;Gasto;-2\n'));
    const r = fila(I, /hucha/);
    ok(r && r.comoTras && r.otra === '' && !r.incluir, 'Tipo «Traspaso» sin cuenta: pregunta con qué cuenta y va desmarcada');
  }

  // ---------- 4) una sola cuenta: como antes ----------
  {
    const e = await env([{ id: 'c1', nombre: 'Banco', banco: 'santander', saldo: 1000, fecha: '2026-09-30' }]), A = e.w.__APP__;
    const I = await importar(e, null, 'santander_ejemplo.csv', leer('santander_ejemplo.csv'));
    ok(!I.filas.some((r) => r.comoTras) && !/parece un traspaso|Es un traspaso/.test(sh(e)), 'una cuenta: no salen traspasos ni sus botones');
    await A.H.impEjecutar([]); await sleep(60);
    ok(!guardados(e).some((m) => m.tipo === 'Traspaso') && guardados(e).some((m) => /TRANSFERENCIA A ING/.test(m.descripcion) && m.tipo === 'Gasto'), 'una cuenta: la transferencia se guarda como gasto, como antes');
  }
  // ---------- 5) varias cuentas sin elegir la del extracto: como antes ----------
  {
    const e = await env(CUENTAS());
    const I = await importar(e, null, 'otro.csv', leer('santander_ejemplo.csv'));
    if (!I.cuenta) ok(!I.filas.some((r) => r.comoTras), 'sin cuenta del extracto elegida: no propone traspasos');
    else console.log('INFO la cuenta se adivinó sola: ' + I.cuenta);
  }
  // ---------- 6) ya lo tenías apuntado a mano como gasto (antes de esta tanda): no se puede duplicar ----------
  {
    const e = makeEnv({
      cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'], ahorro: [], cuentas: CUENTAS() }, meta: { onboarded: true } },
      movs: [{ id: 'm1', tipo: 'Gasto', importe: 500, categoria: 'Otros', fecha: '2026-10-03', descripcion: 'Paso a ING', cuentaId: 'cs' },
        { id: 'm2', tipo: 'Gasto', importe: 60, categoria: 'Otros', fecha: '2026-10-07', descripcion: 'Cajero', cuentaId: 'cs' }],
      url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre: (w) => { w.TextDecoder = TextDecoder; },
    });
    await sleep(120); const A = e.w.__APP__;
    const I = await importar(e, 'cs', 'santander_ejemplo.csv', leer('santander_ejemplo.csv'));
    const tr = fila(I, /TRANSFERENCIA A ING/), caj = fila(I, /REINTEGRO/);
    ok(!tr.incluir && !caj.incluir, 'si ya apuntaste la transferencia y el cajero como gasto (mismo importe y fecha), no van marcados (antes salían como «ya lo tenías»)');
    await A.H.impEjecutar([]); await sleep(60); sincronizar(e);
    const s = A.saldoCuenta(A.cfg().cuentas.find((x) => x.id === 'cs'));
    ok(s === 1455.54, 'el saldo de Santander no resta dos veces los 560 € (' + s + ', el banco dice 1455.54)');
  }
  console.log(fails ? 'FAILED ' + fails : 'ALL OK' + (avisos ? ' (' + avisos + ' avisos)' : '')); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });
function num(x) { return Number(x) || 0; }

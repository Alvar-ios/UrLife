// Cuentas, bloque 1 (17-10-2026): saldo editable, compartidos al mirar una cuenta, convertir un gasto en traspaso,
// buscador con traspasos, cuenta sin fecha, aviso de cuentas sin saldo y Excel con tipo «Traspaso».
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
const { TextDecoder } = require('util');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hace = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10), hoy = hace(0), d2 = hace(2);
const HOY = new Date(), Y = HOY.getFullYear(), M = HOY.getMonth() + 1;
const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const file = (name, buf) => ({ name, size: buf.byteLength, arrayBuffer: async () => buf });
const DOS = [{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: hace(20) }, { id: 'c2', nombre: 'Efectivo', tipo: 'efectivo', saldo: 50, fecha: hace(20) }];
async function env(cuentas, movs, pre) {
  const e = makeEnv({
    cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas)) }, meta: { onboarded: true } },
    movs: JSON.parse(JSON.stringify(movs || [])), url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre,
  });
  await sleep(120); return e;
}
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const txt = (e) => e.doc.querySelector('#content').textContent.replace(/\s+/g, ' ');
(async () => {
  /* 1. El saldo se puede escribir a mano, también con una sola cuenta */
  let e = await env([DOS[0]], [{ id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 100, fecha: d2 }]), A = e.w.__APP__;
  A.H.openCuentas([]); await sleep(10);
  let inp = e.doc.querySelector('#sheetHost .cuenta-ed input.amt');
  ok(!!inp && Number(inp.value) === 900, 'con una sola cuenta hay casilla de saldo y enseña el calculado (900 €)');
  inp.value = '875.5'; inp.dispatchEvent(new e.w.Event('change', { bubbles: true })); await sleep(20);
  let c = A.cfg().cuentas[0];
  ok(c.saldo === 875.5 && c.fecha === hoy && A.saldoCuenta(c) === 875.5, 'escribir el saldo lo deja como el de hoy y desde ahí calcula');

  /* 2. Mirando una cuenta, los compartidos que pagaste salen con lo que salió del banco */
  e = await env(DOS, [{ id: 'p1', tipo: 'Gasto', categoria: 'Restaurantes y bares', importe: 50, fecha: d2, compartidoId: 's1' }]); A = e.w.__APP__;
  A.S.compartidos = [{ id: 's1', grupoId: 'gr', fecha: d2, tipo: 'Gasto', categoria: 'Restaurantes y bares', importe: 100, pagadoPor: 'yo', reparto: { yo: 50, otro: 50 } },
    { id: 's2', grupoId: 'gr', fecha: d2, tipo: 'Gasto', categoria: 'Ocio', importe: 30, pagadoPor: 'otro', reparto: { yo: 15, otro: 15 } }];
  A.render(); await sleep(10);
  A.H.irMovsCuenta(['c1']); await sleep(260); A.H.setMovModo(['todo']); await sleep(15);
  let lista = e.doc.querySelector('#movList').textContent.replace(/\s+/g, ' ');
  ok(/100,00/.test(lista) && /pagaste tú/.test(lista), '«Ver movimientos» de la principal enseña la cena de 100 € que pagaste tú');
  ok(!/Ocio/.test(lista), 'lo que pagó otra persona no sale en la cuenta (no salió de tu banco)');
  A.H.irMovsCuenta(['c2']); await sleep(260);
  ok(!/pagaste tú/.test(e.doc.querySelector('#movList').textContent), 'en otra cuenta que no es la principal no aparece');

  /* 3. Convertir un gasto en traspaso: el mismo movimiento, sin duplicar */
  e = await env(DOS, [{ id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 100, fecha: d2, descripcion: 'CAJERO', cuentaId: 'c1' },
    { id: 'g2', tipo: 'Gasto', categoria: 'Restaurantes y bares', importe: 20, fecha: d2, compartidoId: 'zz' }]); A = e.w.__APP__;
  const gastosAntes = A.kpisMes(Y, M).gastos, nAntes = Object.keys(e.store.movimientos).length;
  A.H.openMovForm(['g1']); await sleep(15);
  ok(/Convertir en traspaso/.test(sh(e)), 'un gasto normal tiene el botón «Convertir en traspaso»');
  click(e, 'movAtraspaso', 'g1'); await sleep(15);
  ok(/Convertir en traspaso/.test(sh(e)) && Number(e.doc.querySelector('#fImporte').value) === 100 && e.doc.querySelector('#fFecha').value === d2, 'el traspaso sale relleno con el importe y la fecha del gasto');
  ok(A.form().desde === 'c1' && A.form().a === 'c2', 'propone de la cuenta del gasto a la otra');
  await A.H.saveTraspaso([]); await sleep(40);
  const g1 = e.store.movimientos.g1;
  ok(g1 && g1.tipo === 'Traspaso' && g1.cuentaId === 'c1' && g1.cuentaDestinoId === 'c2', 'se guarda como traspaso con sus dos cuentas');
  ok(Object.keys(e.store.movimientos).length === nAntes, 'no se duplica: sigue habiendo los mismos movimientos');
  // la base de datos de mentira no avisa de los cambios: se vuelve a abrir la app con lo guardado
  const guardados = Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v));
  e = await env(DOS, guardados); A = e.w.__APP__;
  ok(Math.round((gastosAntes - A.kpisMes(Y, M).gastos) * 100) / 100 === 100, 'deja de contar como gasto del mes');
  ok(A.saldoCuenta(A.cfg().cuentas[0]) === 880 && A.saldoCuenta(A.cfg().cuentas[1]) === 150, 'el banco baja 100 (más el otro gasto de 20) y el efectivo sube 100');
  A.H.closeSheet([]); await sleep(260);
  A.H.openMovForm(['g2']); await sleep(15);
  ok(!/Convertir en traspaso/.test(sh(e)), 'un gasto enlazado a algo compartido no se puede convertir');

  /* 4. El buscador encuentra los traspasos */
  ok(/Traspasos/.test(A.buscarResHtml('cajero')) && /Banco → Efectivo/.test(A.buscarResHtml('cajero')), 'el buscador general encuentra el traspaso');

  /* 5. Cuenta con saldo y sin fecha: la pantalla se pinta */
  e = await env([{ id: 'c1', nombre: 'Banco', saldo: 1000 }, { id: 'c2', nombre: 'Otra', saldo: 20 }], []); A = e.w.__APP__;
  let crash = ''; try { A.H.openCuentas([]); await sleep(15); A.H.closeSheet([]); await sleep(260); A.H.cuentaVer(['c1']); await sleep(15); } catch (x) { crash = x.message; }
  ok(!crash && /Sin fecha de partida/.test(sh(e)), 'una cuenta sin fecha no deja la pantalla en blanco y dice qué hacer');

  /* 6. «En tus cuentas» avisa de las cuentas sin saldo */
  e = await env([DOS[0], { id: 'c3', nombre: 'Revolut' }], []); A = e.w.__APP__;
  A.H.cuentasHoja([]); await sleep(15);
  ok(/Revolut no tiene saldo puesto/.test(sh(e)), '«En tus cuentas» avisa de que una cuenta no tiene saldo y no suma');

  /* 7. Un Excel con tipo «Traspaso» no entra como gasto */
  e = await env(DOS, [], (w) => { w.TextDecoder = TextDecoder; }); A = e.w.__APP__;
  const f = d2.slice(8, 10) + '/' + d2.slice(5, 7) + '/' + d2.slice(0, 4);
  const csv = ['Fecha;Concepto;Importe;Tipo', f + ';MERCADONA;-32,40;Gasto', f + ';A LA HUCHA;-200,00;Traspaso'].join('\r\n');
  A.H.goTab(['movimientos']); await sleep(10); click(e, 'impAbrir'); await sleep(10);
  await A.H.impArchivo([], { files: [file('mio.csv', ab(Buffer.from(csv, 'latin1')))] }); await sleep(40);
  const I = A.imp();
  console.log('INFO columna tipo detectada: ' + (I.map && I.map.tipo != null && I.map.tipo !== ''));
  if (I.map && (I.map.tipo == null || I.map.tipo === '')) I.map.tipo = 3;
  A.H.impRevisar(); await sleep(20);
  const fT = A.imp().filas.find((r) => /HUCHA/.test(r.desc || '')), fG = A.imp().filas.find((r) => /MERCADONA/.test(r.desc || ''));
  ok(fT && fT.estado === 'traspaso' && !fT.incluir, 'la fila «Traspaso» sale desmarcada y avisada, no como gasto');
  ok(fG && fG.estado === 'nuevo' && fG.incluir, 'las demás filas se importan como siempre');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

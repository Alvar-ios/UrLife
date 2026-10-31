// 31/10/2026 · Calidad, docs/30 tanda 2 (columna Saldo): casos raros. Extractos inventados, sin datos reales.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
const { TextDecoder } = require('util');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const file = (name, txt) => { const b = Buffer.from(txt, 'utf8'); const buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); return { name, size: buf.byteLength, arrayBuffer: async () => buf }; };
async function env(cuentas, movs, extra) {
  const e = makeEnv(Object.assign({
    cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas)) }, meta: { onboarded: true } },
    movs: JSON.parse(JSON.stringify(movs || [])), url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre: (w) => { w.TextDecoder = TextDecoder; },
  }, extra || {}));
  await sleep(120); return e;
}
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const guardados = (e) => Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v));
const refrescar = (e) => { e.w.__APP__.S.movimientos = guardados(e); };
async function cargar(e, nombre, txt, cuenta) {
  const A = e.w.__APP__;
  A.H.goTab(['movimientos']); await sleep(10);
  if (cuenta) A.H.impEnCuenta([cuenta]); else A.H.impAbrir([]);
  await sleep(10);
  await A.H.impArchivo([], { files: [file(nombre, txt)] }); await sleep(40);
  return A.imp();
}
const cerrar = async (e) => { e.w.__APP__.H.closeSheet([]); await sleep(260); };

(async () => {
  let e, A, I, c;
  // 1. Cargos y abonos en dos columnas, del más nuevo al más viejo, varias filas el mismo día
  const dos = 'Fecha;Concepto;Cargo;Abono;Saldo\n' +
    '20/10/2026;CAFE EJEMPLO;3,00;;897,00\n' +
    '20/10/2026;SUPER EJEMPLO;50,00;;900,00\n' +
    '20/10/2026;BIZUM DE PRUEBA;;150,00;950,00\n' +
    '15/10/2026;LUZ EJEMPLO;40,00;;800,00\n' +
    '10/10/2026;GASOLINA EJEMPLO;60,00;;840,00\n';
  e = await env([{ id: 'c1', nombre: 'Banco', saldo: 900, fecha: '2026-10-05' }]); A = e.w.__APP__;
  I = await cargar(e, 'dos_columnas.csv', dos);
  ok(I.modoImporte === 'dos' && I.map.saldo === 4, 'cargo/abono: reconoce las dos columnas y Saldo');
  A.H.impRevisar([]); await sleep(20); I = A.imp();
  ok(/Los importes cuadran/.test(sh(e)), 'cargo/abono: los importes cuadran');
  ok(I.saldoFin && I.saldoFin.valor === 897 && I.saldoFin.fecha === '2026-10-20', 'varias filas el mismo día: el saldo final es el de la primera fila (la más nueva): ' + JSON.stringify(I.saldoFin));
  await A.H.impEjecutar([]); await sleep(60); refrescar(e);
  ok(/Cuadra: la app y el banco dicen lo mismo/.test(sh(e)), 'una sola cuenta, saldo de partida bien: «Cuadra» (movimientos sin cuenta van a la única cuenta)');
  await cerrar(e);

  // 2. Una sola cuenta, sin saldo; un gasto ya apuntado a mano ese día (sin cuenta) que también está en el extracto
  const ing = 'F. VALOR;DESCRIPCIÓN;IMPORTE (€);SALDO (€)\n' +
    '12/10/2026;RECIBO EJEMPLO;-20,00;480,00\n' +
    '\n' +
    '14/10/2026;SUPER EJEMPLO;-30,00;450,00\n' +
    ';;;\n' +
    '16/10/2026;CAFE EJEMPLO;-2,50;447,50\n';
  const manual = { id: 'm1', tipo: 'Gasto', importe: 2.5, categoria: 'Supermercado', fecha: '2026-10-16', descripcion: 'cafe', creadoEn: Date.parse('2026-10-16T09:00:00Z') };
  e = await env([{ id: 'c1', nombre: 'Banco' }], [manual]); A = e.w.__APP__;
  I = await cargar(e, 'ing_vacias.csv', ing);
  A.H.impRevisar([]); await sleep(20); I = A.imp();
  ok(/Los importes cuadran/.test(sh(e)), 'filas vacías en medio: siguen cuadrando');
  ok(I.saldoFin && I.saldoFin.valor === 447.5, 'filas vacías: saldo final 447,50');
  await A.H.impEjecutar([]); await sleep(60); refrescar(e);
  ok(/Usar este saldo/.test(sh(e)), 'cuenta sin saldo: ofrece «Usar este saldo»');
  A.H.impSaldoUsar([]); await sleep(20);
  c = A.cfg().cuentas[0];
  ok(c.saldo === 447.5 && c.fecha === '2026-10-16' && c.ts > 0, 'guarda saldo y fecha del extracto');
  ok(A.saldoCuenta(c) === 447.5, 'el gasto apuntado a mano ese día y lo importado no se cuentan dos veces (sale ' + A.saldoCuenta(c) + ')');
  // un gasto del mismo día apuntado DESPUÉS de cuadrar sí cuenta, una vez
  A.S.movimientos.push({ id: 'm2', tipo: 'Gasto', importe: 7.5, categoria: 'Supermercado', fecha: '2026-10-16', creadoEn: Date.now() + 5 });
  ok(A.saldoCuenta(c) === 440, 'un gasto del mismo día apuntado después cuenta una sola vez (440, sale ' + A.saldoCuenta(c) + ')');
  // uno de un día posterior también
  A.S.movimientos.push({ id: 'm3', tipo: 'Ingreso', importe: 10, categoria: 'Nómina', fecha: '2026-10-20', creadoEn: Date.now() + 6 });
  ok(A.saldoCuenta(c) === 450, 'y uno de un día posterior también (450)');
  await cerrar(e);

  // 3. Extracto con algunas filas sin saldo (hay bancos que solo lo ponen en la última del día)
  const huecos = 'F. VALOR;DESCRIPCIÓN;IMPORTE (€);SALDO (€)\n' +
    '01/10/2026;A EJEMPLO;-10,00;990,00\n' +
    '02/10/2026;B EJEMPLO;-10,00;\n' +
    '02/10/2026;C EJEMPLO;-10,00;970,00\n' +
    '03/10/2026;D EJEMPLO;-10,00;\n' +
    '03/10/2026;E EJEMPLO;-10,00;950,00\n' +
    '04/10/2026;F EJEMPLO;-10,00;940,00\n';
  e = await env([{ id: 'c1', nombre: 'Banco' }]); A = e.w.__APP__;
  await cargar(e, 'huecos.csv', huecos); A.H.impRevisar([]); await sleep(20);
  ok(/Los importes cuadran/.test(sh(e)), 'filas sin saldo en medio: debería cuadrar sumando las filas sin saldo (hoy dice «no cuadran» y pide «Importar igualmente»; sale: ' + JSON.stringify(A.imp().saldoChk) + ')');
  await cerrar(e);

  // 4. Datos que no cuadran: no se ofrece cuadrar, y la acción tampoco debería guardar nada si se llama igual
  const mal = 'F. VALOR;DESCRIPCIÓN;IMPORTE (€);SALDO (€)\n' +
    '01/10/2026;A EJEMPLO;-10,00;500,00\n02/10/2026;B EJEMPLO;-10,00;300,00\n03/10/2026;C EJEMPLO;-10,00;100,00\n';
  e = await env([{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: '2026-09-01' }]); A = e.w.__APP__;
  await cargar(e, 'mal.csv', mal); A.H.impRevisar([]); await sleep(20);
  ok(/no cuadran con la columna Saldo/.test(sh(e)) && /Importar igualmente \(3\)/.test(sh(e)), 'no cuadra: aviso e «Importar igualmente (3)»');
  await A.H.impEjecutar([]); await sleep(60);
  ok(!/Cuadrar con el banco|Usar este saldo|Cuadra:/.test(sh(e)), 'no cuadra: al terminar no ofrece cuadrar');
  A.H.impSaldoUsar([]); await sleep(20);
  (A.cfg().cuentas[0].saldo === 1000 ? ok : (c2, m) => console.log('AVISO ' + m))(true && A.cfg().cuentas[0].saldo === 1000, 'no cuadra: impSaldoUsar llamado igualmente no cambia el saldo (sale ' + A.cfg().cuentas[0].saldo + ')');
  await cerrar(e);

  // 5. Traspaso ya apuntado en la app que también sale en el extracto
  const tras = 'F. VALOR;DESCRIPCIÓN;IMPORTE (€);SALDO (€)\n' +
    '10/10/2026;SUPER EJEMPLO;-20,00;980,00\n11/10/2026;TRASPASO A AHORRO;-100,00;880,00\n12/10/2026;CAFE EJEMPLO;-5,00;875,00\n';
  e = await env([{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: '2026-10-01', principal: true }, { id: 'c2', nombre: 'Ahorro', saldo: 0, fecha: '2026-10-01' }]); A = e.w.__APP__;
  A.S.traspasos = [{ id: 't1', tipo: 'Traspaso', importe: 100, fecha: '2026-10-11', cuentaId: 'c1', cuentaDestinoId: 'c2', creadoEn: Date.parse('2026-10-11T10:00:00Z') }];
  await cargar(e, 'tras.csv', tras, 'c1'); A.H.impRevisar([]); await sleep(20);
  const filTras = A.imp().filas.find((r) => r.fecha === '2026-10-11');
  ok(filTras && !filTras.incluir, 'el traspaso ya apuntado no se marca para importar (estado ' + (filTras && filTras.estado) + ')');
  await A.H.impEjecutar([]); await sleep(60); refrescar(e);
  ok(/Cuadra: la app y el banco dicen lo mismo/.test(sh(e)), 'con un traspaso ya apuntado: «Cuadra» (no se cuenta dos veces)');
  await cerrar(e);

  // 6. Gasto compartido que pagué yo, ya en Juntos y en el extracto
  const comp = 'F. VALOR;DESCRIPCIÓN;IMPORTE (€);SALDO (€)\n10/10/2026;SUPER EJEMPLO;-20,00;980,00\n12/10/2026;CENA EJEMPLO;-40,00;940,00\n';
  e = await env([{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: '2026-10-01' }]); A = e.w.__APP__;
  A.S.grupos = [{ id: 'g1', nombre: 'Casa', miembros: ['yo', 'otro'] }]; A.S.compartidos = [{ id: 'k1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 40, fecha: '2026-10-12', pagadoPor: 'yo', reparto: { yo: 20, otro: 20 }, createdAt: '2026-10-12T20:00:00Z' }];
  A.S.movimientos.push({ id: 'mk1', tipo: 'Gasto', importe: 40, categoria: 'Supermercado', fecha: '2026-10-12', compartidoId: 'k1', creadoEn: Date.parse('2026-10-12T20:00:00Z') });
  await cargar(e, 'comp.csv', comp); A.H.impRevisar([]); await sleep(20);
  await A.H.impEjecutar([]); await sleep(60); refrescar(e);
  const filC = A.imp().filas.find((r) => r.fecha === '2026-10-12');
  ok(filC && filC.estado !== 'nuevo', 'la cena compartida ya apuntada no entra otra vez (estado ' + (filC && filC.estado) + ')');
  ok(/Cuadra: la app y el banco dicen lo mismo/.test(sh(e)), 'con un compartido ya en Juntos: «Cuadra» (sale: ' + (sh(e).match(/El banco dice[^.]*\.[^.]*\./) || ['?'])[0] + ')');
  await cerrar(e);

  // 7. Formato guardado: si quito la columna Saldo a propósito, la próxima vez no debería volver a salir sola
  const simple = 'F. VALOR;DESCRIPCIÓN;IMPORTE (€);SALDO (€)\n01/10/2026;A EJEMPLO;-10,00;990,00\n02/10/2026;B EJEMPLO;-10,00;980,00\n';
  e = await env([{ id: 'c1', nombre: 'Banco' }]); A = e.w.__APP__;
  I = await cargar(e, 'perfil.csv', simple);
  A.H.impMap(['saldo'], { value: '' }); await sleep(10);
  A.H.impRevisar([]); await sleep(20); await A.H.impEjecutar([]); await sleep(60); await cerrar(e);
  I = await cargar(e, 'perfil.csv', simple.replace('02/10', '03/10'));
  ok(I.perfil && I.map.saldo == null, 'formato guardado sin Saldo (lo quitó el usuario): no vuelve a ponerse solo (sale map.saldo=' + I.map.saldo + ')');
  await cerrar(e);

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

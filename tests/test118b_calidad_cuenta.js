// 31/10/2026 · Calidad, docs/30 tanda 1 (importar en una cuenta). Extractos y datos inventados.
// Las comprobaciones marcadas «FALLO CONOCIDO» describen un fallo de la app: se dejan como AVISO para no bloquear la suite
// hasta que Desarrollo lo arregle; cuando se arregle, cambiar `conocido` por `ok`.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
const { TextDecoder } = require('util');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const conocido = (c, m) => console.log((c ? 'PASS ' : 'AVISO (FALLO CONOCIDO) ') + m);
const enc = (s) => { const b = Buffer.from(s, 'utf8'); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
const file = (name, txt) => { const buf = enc(txt); return { name, size: buf.byteLength, arrayBuffer: async () => buf }; };
const csv = (filas) => 'Fecha;Concepto;Importe\n' + filas.map((f) => f.join(';')).join('\n') + '\n';
const DOS = [{ id: 'cs', nombre: 'Santander', banco: 'santander', saldo: 1000, fecha: '2026-09-01', principal: true }, { id: 'ci', nombre: 'ING', banco: 'ing', saldo: 2000, fecha: '2026-09-01' }];
const UNA = [{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: '2026-09-01' }];
async function env(movs, cuentas) {
  const e = makeEnv({
    cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas)) }, meta: { onboarded: true } },
    movs: JSON.parse(JSON.stringify(movs || [])), url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre: (w) => { w.TextDecoder = TextDecoder; },
  });
  await sleep(120); return e;
}
const guardados = (e) => Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v));
const refrescar = (e) => { const A = e.w.__APP__; A.S._movsRaw = guardados(e); const raw = A.S._movsRaw; A.S.traspasos = raw.filter((m) => m.tipo === 'Traspaso'); A.S.movimientos = raw.filter((m) => m.tipo !== 'Traspaso'); };
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
async function abrir(e, nombre, txt, cuenta, desdeFicha) {
  const A = e.w.__APP__;
  if (desdeFicha) A.H.impEnCuenta([desdeFicha]); else { A.H.goTab(['movimientos']); await sleep(10); A.H.impAbrir([]); }
  await sleep(10);
  await A.H.impArchivo([], { files: [file(nombre, txt)] }); await sleep(40);
  if (cuenta) A.H.impCuenta([cuenta]);
  return A.imp();
}
async function revisar(e) { e.w.__APP__.H.impRevisar([]); await sleep(20); return e.w.__APP__.imp(); }
async function guardar(e) { const A = e.w.__APP__; await A.H.impEjecutar([]); await sleep(60); refrescar(e); A.H.closeSheet([]); await sleep(260); }
const fila = (I, re) => I.filas.find((r) => re.test(r.desc || ''));

(async () => {
  /* 1. Una sola cuenta: igual que antes (sin cuentaId, sin pregunta) y reimportar = 0 nuevas */
  let e = await env([], UNA), A = e.w.__APP__;
  const F1 = csv([['05/10/2026', 'MERCADO EJEMPLO', '-23,40'], ['04/10/2026', 'NOMINA EJEMPLO', '1500,00'], ['03/10/2026', 'CAFE EJEMPLO', '-1,50']]);
  await abrir(e, 'extracto.csv', F1);
  ok(!/¿De qué cuenta/.test(sh(e)), '1 cuenta: no pregunta la cuenta');
  await revisar(e); await guardar(e);
  let g = guardados(e);
  ok(g.length === 3 && g.every((m) => !('cuentaId' in m)), '1 cuenta: se guardan 3 y ninguno lleva cuentaId (como antes)');
  const lote1 = (A.cfg().importLotes || []).slice(-1)[0], perf1 = Object.values(A.cfg().importPerfiles || {})[0];
  ok(lote1 && !('cuenta' in lote1) && perf1 && !('cuenta' in perf1), '1 cuenta: ni el lote ni el formato guardan cuenta');
  await abrir(e, 'extracto.csv', F1); let I = await revisar(e);
  ok(I.filas.filter((r) => r.id).every((r) => r.estado === 'importado'), '1 cuenta: reimportar el mismo archivo = todo ya importado');

  /* 2. Sin cuentas (usuario nuevo): importa igual */
  e = await env([], []); A = e.w.__APP__;
  await abrir(e, 'extracto.csv', F1); I = await revisar(e);
  ok(I.filas.filter((r) => r.estado === 'nuevo').length === 3, 'sin cuentas: las 3 filas entran como nuevas');
  await guardar(e); ok(guardados(e).length === 3, 'sin cuentas: se guardan las 3');

  /* 3. Reimportar un extracto ampliado (el del mes siguiente se solapa) con gastos repetidos del mismo importe.
     El extracto va del más nuevo al más viejo, como los de los bancos. */
  e = await env([], UNA); A = e.w.__APP__;
  await abrir(e, 'metro.csv', csv([['04/10/2026', 'METRO EJEMPLO', '-1,50']])); await revisar(e); await guardar(e);
  ok(guardados(e).length === 1, 'primer extracto: 1 metro el día 4');
  await abrir(e, 'metro.csv', csv([['06/10/2026', 'METRO EJEMPLO', '-1,50'], ['04/10/2026', 'METRO EJEMPLO', '-1,50']])); I = await revisar(e);
  const m6 = I.filas.find((r) => r.fecha === '2026-10-06'), m4 = I.filas.find((r) => r.fecha === '2026-10-04');
  ok(m4 && m4.estado === 'importado', 'el metro del día 4 sale como ya importado');
  ok(m6 && m6.estado === 'nuevo' && m6.incluir, 'el metro NUEVO del día 6 debería entrar marcado (sale «' + (m6 && m6.estado) + '»: se empareja con el del día 4, que ya es de otra fila del archivo)');

  /* 4. Dos cuentas: «Marcar las nuevas» no marca dudosas; «Desmarcar» sí las quita todas */
  e = await env([{ id: 'a1', tipo: 'Gasto', categoria: 'Otros', importe: 40, fecha: '2026-10-08', descripcion: 'cena', cuentaId: 'cs' },
    { id: 'a2', tipo: 'Gasto', categoria: 'Otros', importe: 12, fecha: '2026-10-10', descripcion: 'libro' }], DOS); A = e.w.__APP__;
  A.S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [{ user_id: 'yo' }, { user_id: 'ana' }], todos: [{ user_id: 'yo' }, { user_id: 'ana' }] }];
  A.S.compartidos = [{ id: 'j1', grupoId: 'g1', fecha: '2026-10-09', createdAt: '2026-10-09T10:00:00Z', tipo: 'Gasto', categoria: 'Super', descripcion: 'compra piso', importe: 66, pagadoPor: 'yo', reparto: { yo: 33, ana: 33 } }];
  const F4 = csv([['12/10/2026', 'LIBRERIA EJEMPLO', '-12,00'], ['09/10/2026', 'SUPER PISO', '-66,00'], ['08/10/2026', 'CENA EJEMPLO', '-40,00'], ['07/10/2026', 'TRANSFERENCIA A ING', '-100,00'], ['06/10/2026', 'FARMACIA EJEMPLO', '-8,20']]);
  await abrir(e, 'mi_extracto.csv', F4, 'cs'); I = await revisar(e);
  const est = (re) => (fila(I, re) || {}).estado;
  ok(est(/LIBRERIA/) === 'quizas' && est(/SUPER PISO/) === 'juntos' && est(/CENA/) === 'dup' && est(/FARMACIA/) === 'nuevo', 'estados: libro sin cuenta a 2 días = quizás, Juntos = juntos, cena en Santander = ya lo tenías, farmacia = nueva (' + I.filas.map((r) => r.estado).join(',') + ')');
  ok(/ya está en Juntos: compra piso/.test(sh(e)), 'dice «ya está en Juntos: compra piso»');
  A.H.impTodas(['0']); await sleep(5); A.H.impTodas(['1']); await sleep(5);
  ok(I.filas.filter((r) => r.incluir).every((r) => r.estado === 'nuevo'), '«Marcar las nuevas» solo marca las nuevas (no quizás, Juntos, ya lo tenías ni traspaso)');
  A.H.impTodas(['0']); await sleep(5);
  ok(!I.filas.some((r) => r.incluir), '«Desmarcar» deja todo desmarcado');
  A.H.closeSheet([]); await sleep(260);

  /* 5. Importar el mismo archivo en otra cuenta: «otraCuenta» desmarcada; si se marca, entra con id distinto; reimportar en las dos = 0 nuevas */
  e = await env([], DOS); A = e.w.__APP__;
  const F5 = csv([['05/10/2026', 'PAGO TIENDA', '-9,99'], ['04/10/2026', 'BIZUM EJEMPLO', '-5,00']]);
  await abrir(e, 'f5.csv', F5, 'cs'); await revisar(e); await guardar(e);
  await abrir(e, 'f5.csv', F5, 'ci'); I = await revisar(e);
  ok(I.filas.every((r) => r.estado === 'otraCuenta' && !r.incluir), 'mismo archivo en ING: «ya importado en Santander», desmarcadas');
  A.H.impTodas(['1']); await sleep(5);
  ok(!I.filas.some((r) => r.incluir), '«Marcar las nuevas» no marca las de otra cuenta');
  A.H.impIncluir(['0'], { checked: true }); await sleep(5); await guardar(e);
  g = guardados(e);
  ok(g.length === 3 && g.filter((m) => m.cuentaId === 'ci').length === 1 && new Set(g.map((m) => m.id)).size === 3, 'marcar una: entra en ING con id propio (3 en total, sin pisar la de Santander)');
  await abrir(e, 'f5.csv', F5, 'ci'); I = await revisar(e);
  const r0 = I.filas.find((r) => /TIENDA/.test(r.desc));
  ok(r0 && r0.estado === 'importado', 'reimportar en ING: la que ya entró en ING sale como ya importada');
  A.H.closeSheet([]); await sleep(260);
  await abrir(e, 'f5.csv', F5, 'cs'); I = await revisar(e);
  ok(I.filas.every((r) => r.estado === 'importado'), 'reimportar en Santander: todo ya importado');
  A.H.closeSheet([]); await sleep(260);

  /* 6. Movimientos importados ANTES de esta mejora (sin cuenta), ahora con 2 cuentas: no se duplican */
  e = await env([], UNA); A = e.w.__APP__;
  await abrir(e, 'viejo.csv', F5); await revisar(e); await guardar(e);
  const viejos = guardados(e);
  e = await env(viejos, DOS); A = e.w.__APP__;
  await abrir(e, 'viejo.csv', F5, 'ci'); I = await revisar(e);
  ok(I.filas.every((r) => r.estado === 'importado'), 'importado antes sin cuenta: con 2 cuentas, en cualquier cuenta sale como ya importado (no duplica)');
  A.H.closeSheet([]); await sleep(260);

  /* 7. Emparejar uno a uno: 2 filas iguales y 1 apuntada a mano = 1 «ya lo tenías» + 1 nueva */
  e = await env([{ id: 'b1', tipo: 'Gasto', categoria: 'Otros', importe: 1.5, fecha: '2026-10-05', descripcion: 'cafe', cuentaId: 'cs' }], DOS); A = e.w.__APP__;
  await abrir(e, 'f7.csv', csv([['05/10/2026', 'CAFE EJEMPLO', '-1,50'], ['05/10/2026', 'CAFE EJEMPLO', '-1,50']]), 'cs'); I = await revisar(e);
  ok(I.filas.filter((r) => r.estado === 'dup').length === 1 && I.filas.filter((r) => r.estado === 'nuevo').length === 1, 'dos cafés iguales y uno apuntado: uno «ya lo tenías» y otro nuevo');
  A.H.closeSheet([]); await sleep(260);

  /* 8. Cuenta recordada que ya no existe */
  e = await env([], DOS); A = e.w.__APP__;
  await abrir(e, 'f8.csv', F5, 'ci'); await revisar(e); await guardar(e);
  A.H.cuentaQuitar(['1'], null); await sleep(20);
  // con una sola cuenta ya no hay pregunta: lo que se importa va sin cuenta (la principal)
  await abrir(e, 'f8.csv', csv([['09/10/2026', 'OTRA COSA', '-3,00']]));
  ok(!/¿De qué cuenta/.test(sh(e)), 'quitada la cuenta recordada (queda 1): no pregunta');
  A.H.closeSheet([]); await sleep(260);
  e = await env([], DOS.concat([{ id: 'cb', nombre: 'BBVA', banco: 'bbva', saldo: 0, fecha: '2026-09-01' }])); A = e.w.__APP__;
  await abrir(e, 'f8.csv', F5, 'cb'); await revisar(e); await guardar(e);
  A.H.cuentaQuitar(['2'], null); await sleep(20);
  I = await abrir(e, 'f8.csv', csv([['09/10/2026', 'OTRA COSA', '-3,00']]));
  ok(!I.cuenta && /Elige la cuenta/.test(sh(e)), 'quitada la cuenta recordada (quedan 2): no elige ninguna y pide elegir');
  A.H.closeSheet([]); await sleep(260);

  /* 9. La cuenta elegida desaparece entre la vista previa y «Importar» */
  e = await env([], DOS.concat([{ id: 'cb', nombre: 'BBVA', saldo: 0, fecha: '2026-09-01' }])); A = e.w.__APP__;
  await abrir(e, 'f9.csv', F5, 'cb'); await revisar(e);
  const cs3 = A.cfg().cuentas.filter((c) => c.id !== 'cb'); A.S.config = Object.assign({}, A.S.config, { cuentas: cs3 });
  e.store.cfg.app = Object.assign({}, e.store.cfg.app, { cuentas: cs3 }); await sleep(20);
  await A.H.impEjecutar([]); await sleep(60);
  g = guardados(e);
  ok(g.length === 0, 'si la cuenta elegida ya no existe al guardar, debería avisar y no guardar (ha guardado ' + g.length + ' sin cuenta, que cuentan como de la principal, comparados solo con BBVA)');
  A.H.closeSheet([]); await sleep(260);

  /* 10. Pista por el nombre del archivo: «ing» dentro de otra palabra */
  e = await env([], DOS); A = e.w.__APP__;
  I = await abrir(e, 'movimientos_ingresos_octubre.csv', F5);
  ok(!I.cuenta, 'un archivo «movimientos_ingresos…» no debería elegir ING solo (ha elegido: ' + I.cuenta + ')');
  A.H.closeSheet([]); await sleep(260);
  I = await abrir(e, 'santander_octubre.csv', F5);
  ok(I.cuenta === 'cs', 'un archivo «santander_…» elige Santander');
  A.H.closeSheet([]); await sleep(260);

  /* 11. Deshacer la importación también borra lo convertido en traspaso */
  e = await env([], DOS); A = e.w.__APP__;
  await abrir(e, 'f11.csv', F5, 'cs'); await revisar(e); await guardar(e);
  const loteId = (A.cfg().importLotes || []).slice(-1)[0].id;
  const uno = guardados(e)[0];
  e.store.movimientos[uno.id] = Object.assign({}, uno, { tipo: 'Traspaso', categoria: 'Traspaso', cuentaId: 'cs', cuentaDestinoId: 'ci' }); refrescar(e);
  ok(A.S.traspasos.length === 1 && A.S.traspasos[0].lote === loteId, 'preparado: un traspaso con el lote');
  A.H.goTab(['tu']); await sleep(10);
  await A.H.impDeshacer([loteId]); await sleep(60);
  ok(Object.keys(e.store.movimientos).length === 0, 'deshacer la importación borra los movimientos y el traspaso');

  /* 12. Textos */
  e = await env([{ id: 'a2', tipo: 'Gasto', categoria: 'Otros', importe: 12, fecha: '2026-10-10', descripcion: 'libro' }], DOS); A = e.w.__APP__;
  await abrir(e, 'x.csv', csv([['12/10/2026', 'LIBRERIA EJEMPLO', '-12,00']]), 'cs'); await revisar(e);
  ok(/Es el mismo/.test(sh(e)) && /Son distintos/.test(sh(e)) && /Dinos si es lo mismo/.test(sh(e)), 'quizás: botones «Es el mismo» / «Son distintos» y aviso');

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

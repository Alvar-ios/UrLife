// 28/11 · fase28/movimientos: la Lista de Movimientos no hereda esquinas en cada fila deslizable, y Juntos arriba: dos cajas Debes / Te deben sin frase.
const fs = require('fs'), path = require('path');
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
(async () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'look.css'), 'utf8');
  ok(/\.list > \.swipe[^{]*\{\s*border-radius:\s*0/.test(css), 'look.css: las filas deslizables dentro de una lista no tienen esquinas propias');
  const hoy = new Date().toISOString().slice(0, 10);
  const e = makeEnv({ version: { juntos: 0 }, movs: [{ id: 'a', tipo: 'Gasto', categoria: 'Comida', importe: 5, fecha: hoy, descripcion: 'Café' }, { id: 'b', tipo: 'Gasto', categoria: 'Comida', importe: 7, fecha: hoy, descripcion: 'Cena' }], cfg: { app: { categoriasGasto: [{ nombre: 'Comida' }] }, meta: { onboarded: true } } });
  await sleep(150);
  const A = e.w.__APP__, doc = e.doc;
  A.S.tab = 'movimientos'; A.S.movVista = 'lista'; A.S.movPeriodo = 'todo'; A.render(); await sleep(80);
  const dia = doc.querySelector('#movList .list.mov-dia');
  ok(!!dia && dia.children.length === 2 && [...dia.children].every((x) => x.classList.contains('swipe')), 'cada día es una sola tarjeta con sus filas dentro');
  ok(doc.querySelectorAll('#movList .list.mov-dia').length === 1, 'dos gastos del mismo día: una sola tarjeta');
  // Juntos
  const S = A.S, yo = { user_id: 'uYo', nombre: 'Lucía', rol: 'admin' }, an = { user_id: 'uA', nombre: 'Ana', rol: 'miembro' };
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, an], todos: [yo, an] }];
  S.compartidos = [{ id: 'k1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Otros', descripcion: 'Compra', importe: 40, pagadoPor: 'uYo', creadoPor: 'uYo', reparto: { uYo: 20, uA: 20 }, modo: 'igual', fecha: hoy }];
  S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.db = Object.assign(S.db || {}, { grupos: (S.db && S.db.grupos) || { listar: async () => ({ grupos: [], miembros: [] }) }, compartidos: (S.db && S.db.compartidos) || { suscribir: () => () => {} }, rpc: async () => null });
  S.db.grupos.listar = async () => { throw new Error('sin red'); }; S.db.grupos.invitaciones = async () => [];
  A.H.goTab(['juntos']); await sleep(80);
  const cab = doc.querySelector('#content .jv5-cab');
  const cajas = cab ? [...cab.querySelectorAll('.jv-fichas > .jv-ficha')] : [];
  ok(cajas.length === 2 && /Debes/.test(cajas[0].textContent) && /Te deben/.test(cajas[1].textContent), 'Juntos arriba: dos cajas «Debes» y «Te deben»');
  ok(/1 persona/.test(cajas[1] ? cajas[1].textContent : '') && /nadie/.test(cajas[0] ? cajas[0].textContent : ''), 'cada caja dice cuántas personas (o «nadie»)');
  ok(cab && !/todo sumado|con cada persona/.test(cab.textContent) && !!cab.querySelector('.jv-compartir'), 'sin la frase «todo sumado» y con «Compartir un gasto»');
  console.log(fails ? fails + ' FALLOS' : 'todo bien'); process.exit(fails ? 1 : 0);
})();

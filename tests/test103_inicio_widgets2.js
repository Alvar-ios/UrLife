// 29/10 (docs/21): Inicio a tu gusto, tanda 2 (Juntos, Cuentas, Una deuda, Últimos movimientos, Calendario de gastos, Tu semana). Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoy = new Date(), iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const hace = (n) => { const d = new Date(hoy); d.setDate(d.getDate() - n); return iso(d); }, en = (n) => hace(-n);
const yo = 'uYo', mi = (u, n) => ({ user_id: u, nombre: n, rol: 'miembro' });
const grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [mi(yo, 'Yo'), mi('uA', 'Ana'), mi('uB', 'Bea')], todos: [mi(yo, 'Yo'), mi('uA', 'Ana'), mi('uB', 'Bea')] },
  { id: 'g2', nombre: 'Viaje', tipo: 'grupo', alias: {}, miembros: [mi(yo, 'Yo'), mi('uC', 'Carlos')], todos: [mi(yo, 'Yo'), mi('uC', 'Carlos')] }];
const comps = [{ id: 'k1', grupoId: 'g1', fecha: hace(3), tipo: 'Gasto', categoria: 'Casa', importe: 90, pagadoPor: yo, reparto: { [yo]: 30, uA: 30, uB: 30 }, modo: 'igual' },
  { id: 'k2', grupoId: 'g2', fecha: hace(2), tipo: 'Gasto', categoria: 'Viajes', importe: 100, pagadoPor: 'uC', reparto: { [yo]: 50, uC: 50 }, modo: 'igual' }];
(async () => {
  const e = makeEnv({ version: { inicio: 0, agenda: 0, tu: 0, crear: 0 },
    movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Comida', descripcion: 'Súper', importe: 40, fecha: hace(1) }, { id: 'm2', tipo: 'Gasto', categoria: 'Ocio', descripcion: 'Cine', importe: 12, fecha: hace(0) },
      { id: 'm3', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: hace(0) }, { id: 'm4', tipo: 'Gasto', categoria: 'Ropa', descripcion: 'Futuro', importe: 9, fecha: en(3) }],
    cfg: { app: { categoriasGasto: [{ nombre: 'Comida' }, { nombre: 'Ocio' }], cuentas: [{ id: 'c1', nombre: 'Banco Uno', saldo: 1200, ts: 1, banco: 'bbva' }, { id: 'c2', nombre: 'Ahorro Dos', saldo: 3000, ts: 1 }],
      deudas: [{ nombre: 'Préstamo', objetivo: 1000, previo: 400 }], facturas: [{ nombre: 'Gimnasio', importe: 30, diaDelMes: Number(en(1).slice(8)) }],
      inicioWidgets: [{ t: 'juntos' }, { t: 'cuentas', o: { id: '*' } }, { t: 'deuda', o: { nombre: 'Préstamo' } }, { t: 'cuentas', o: { id: 'c2' } }, { t: 'ultimos' }, { t: 'calgastos' }, { t: 'semana' }, { t: 'dias' }] }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, S = A.S, H = A.H, doc = e.doc;
  S.user = { id: yo }; S.db.grupos = { listar: async () => ({ grupos: [], miembros: [] }) }; S.db.rpc = () => {}; S.db.compartidos = S.db.compartidos || {}; S.grupos = grupos; S.compartidos = comps; S._ef = null;
  A.render(); await sleep(30);
  const j = doc.querySelector('.iw-juntos');
  ok(j && /Debes/.test(j.textContent) && /50/.test(j.textContent) && /Te deben/.test(j.textContent) && /60/.test(j.textContent), 'Juntos: debes 50 y te deben 60');
  ok(j && j.querySelectorAll('.jv-c').length === 3, 'Juntos: un círculo por persona con saldo');
  ok(!/Te deben 10|Debes 10/.test(doc.querySelector('.dias-lista') ? doc.querySelector('.dias-lista').textContent : ''), 'Estos días no repite lo de Juntos');
  const cs = doc.querySelectorAll('.iw-cuentas');
  ok(cs.length === 2 && cs[0].querySelectorAll('.iw-cf').length === 2 && /Ahorro Dos/.test(cs[0].querySelector('.iw-cf').textContent), 'Cuentas: todas, la de más saldo primero');
  ok(cs[0].querySelector('.bco-ficha') && /3000|3\.000/.test(cs[1].textContent) && cs[1].classList.contains('medio'), 'logo del banco; una cuenta a medio ancho');
  const d = doc.querySelector('.iw-deuda');
  ok(d && /Quedan/.test(d.textContent) && /600/.test(d.textContent) && /40 % pagado/.test(d.textContent), 'Una deuda: lo que queda y lo pagado');
  ok(doc.querySelector('.iw-par .iw-deuda') && doc.querySelector('.iw-par .iw-cuentas'), 'deuda y cuenta comparten fila');
  const u = [...doc.querySelectorAll('.iw-uf')];
  ok(u.length === 3 && !/Futuro/.test(doc.querySelector('.iw-ultimos').textContent), 'Últimos movimientos: los 3 últimos, sin los del futuro');
  const cg = doc.querySelector('.iw-calgastos');
  ok(cg && cg.querySelector('.iw-cg-d.hoy') && cg.querySelectorAll('.iw-cg-d.n4').length >= 1 && /sin gastos/.test(cg.textContent), 'Calendario de gastos: cuadritos y días sin gastos');
  const se = doc.querySelectorAll('.iw-sd');
  ok(se.length === 7 && doc.querySelector('.iw-sd.hoy'), 'Tu semana: 7 días con hoy marcado');
  ok(/Gimnasio/.test(doc.querySelector('.iw-semana').textContent) || hoy.getDate() >= 28, 'Tu semana: la próxima cosa (el pago de mañana)');
  // ir a sus pantallas
  H.iwIrMovCal([hace(0)]); await sleep(20);
  ok(S.tab === 'movimientos' && S.movVista === 'calendario' && S.movCalDia === hace(0), 'un cuadrito abre el calendario de Movimientos en ese día');
  H.goTab(['inicio']); await sleep(10); H.iwIrAgendaDia([en(1)]); await sleep(20);
  ok((S.tab === 'agenda' || S.inicioVista === 'calendario') && S.calFecha === en(1) && /cal2-grid/.test(doc.getElementById('content').innerHTML), 'un día de la semana abre la Agenda en ese día');
  H.goTab(['inicio']); await sleep(10);
  // opciones: Juntos de un grupo
  H.iwOpcAbrir([0]); await sleep(5);
  ok(/¿Qué quieres ver\?/.test(doc.body.textContent) && doc.querySelectorAll('.av-op').length === 3, 'Juntos: todos o un grupo');
  H.iwOpcElegir(['g2']); await sleep(10);
  ok(S.config.inicioWidgets[0].o.gid === 'g2' && /Viaje/.test(doc.querySelector('.iw-juntos').textContent) && doc.querySelectorAll('.iw-juntos .jv-c').length === 1, 'Juntos de un grupo: su nombre y sus personas');
  H.closeSheet([]); await sleep(400); S.pendTodos = true; A.render(); await sleep(20);
  ok(/Te deben 10/.test((doc.querySelector('.dias-lista') || {}).textContent || ''), 'con Juntos de un solo grupo, «Estos días» sigue diciendo lo de todos');
  S.pendTodos = false;
  // grupo, cuenta o deuda borrados: aviso y elegir otro
  S.config = Object.assign({}, S.config, { inicioWidgets: [{ t: 'juntos', o: { gid: 'nada' } }, { t: 'cuentas', o: { id: 'nada' } }, { t: 'deuda', o: { nombre: 'Nada' } }] }); A.render(); await sleep(20);
  ok(/Este grupo ya no existe/.test(doc.body.textContent) && /Esta cuenta ya no existe/.test(doc.body.textContent) && /Esta deuda ya no existe/.test(doc.body.textContent), 'piezas de cosas borradas: avisan y no se quitan solas');
  // catálogo: Juntos y Dinero se ofrecen porque hay grupos, cuentas y deudas
  H.iwEditar([]); H.iwCat([]); H.iwFiltro(['juntos']); await sleep(5);
  ok(doc.querySelectorAll('.iw-cat-t').length === 1, 'filtro Juntos');
  S.grupos = []; H.iwFiltro(['todo']); await sleep(5);
  ok(![...doc.querySelectorAll('.iw-cat-n b')].some((b) => b.textContent === 'Juntos'), 'sin grupos no se ofrece Juntos');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

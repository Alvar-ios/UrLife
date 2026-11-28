// Calidad · tanda 3 de Juntos (docs/46): casos raros de la primera pantalla nueva. Datos inventados.
// Vacío, solo «directo», yo como persona sin app ya reclamada (alias), metas compartidas (enlace y pantalla),
// botón «Antes» (no sale en las subpantallas, recorre las 4 versiones) y usuarios con compararVersiones:false.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const pad = (n) => String(n).padStart(2, '0'), d = new Date(), hoy = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const m = (u, nm, x) => Object.assign({ user_id: u, nombre: nm, rol: 'miembro' }, x || {});
const gasto = (id, gid, imp, pag, rep, desc) => ({ id, grupoId: gid, tipo: 'Gasto', categoria: 'Otros', descripcion: desc, importe: imp, pagadoPor: pag, reparto: rep, modo: 'igual', fecha: hoy, createdAt: new Date().toISOString() });
async function entorno(extra) {
  const e = makeEnv(Object.assign({ version: { juntos: 1 }, cfg: { app: { nombre: 'Lucía' }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uYo' } } }, extra || {}));
  await sleep(150);
  const A = e.w.__APP__, S = A.S;
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.db = Object.assign(S.db || {}, { grupos: (S.db && S.db.grupos) || { listar: async () => ({ grupos: [], miembros: [] }) }, compartidos: (S.db && S.db.compartidos) || { suscribir: () => () => {} }, rpc: async () => null });
  return { e, A, S, H: A.H, doc: e.doc, txt: () => e.doc.querySelector('#content').textContent, fab: () => e.doc.querySelector('#compararHost .comparar-fab') };
}
(async () => {
  const yo = m('uYo', 'Lucía', { rol: 'admin' });
  // 1) sin grupos ni gastos: el estado vacío de siempre
  {
    const { S, H, doc, txt } = await entorno();
    S.grupos = []; S.compartidos = [];
    H.goTab(['juntos']); await sleep(30);
    ok(!!doc.querySelector('#content .jv-vacio') && /Compartir un gasto/.test(txt()) && /Crear un grupo/.test(txt()), 'sin grupos: la tarjeta vacía con «Compartir un gasto» y «Crear un grupo»');
    ok(!doc.querySelector('#content .jv5-g'), 'sin grupos: no hay filas vacías');
  }
  // 2) solo una cuenta «directo», sin gastos, y metas compartidas
  {
    const { S, H, A, doc, txt, fab } = await entorno();
    S.grupos = [{ id: 'd1', nombre: '', tipo: 'directo', alias: {}, soyAdmin: true, miembros: [yo, m('uP', 'Pablo')] }];
    S.grupos.forEach((g) => { g.todos = g.miembros; });
    S.compartidos = [];
    H.goTab(['juntos']); await sleep(30);
    const f = [...doc.querySelectorAll('#content .jv5-g')];
    ok(f.length === 1 && /Pablo/.test(f[0].textContent) && /solo vosotros dos/.test(f[0].textContent) && /sin gastos/.test(f[0].textContent), 'solo «directo»: una fila «Pablo · solo vosotros dos · sin gastos»');
    ok(/Aún no habéis compartido gastos/.test(txt()), 'sin gastos: «Aún no habéis compartido gastos»');
    ok(!/Lo último/.test(txt()), 'sin gastos no sale «Lo último»');
    // metas compartidas
    S.objetivos = [{ id: 'o1', grupoId: 'd1', tipo: 'ahorro', nombre: 'Lisboa', objetivo: 1000, previo: 200, hitos: [], usos: [] }];
    A.render(); await sleep(20);
    ok(!!doc.querySelector('#content [data-click="juntosVer|metas"]'), 'con una meta compartida sale «Metas y deudas juntos»');
    H.juntosVer(['metas']); await sleep(20);
    ok(/Lisboa/.test(txt()) && !!doc.querySelector('#content [data-click="juntosVer|"]') && !doc.querySelector('#content .jv5-g'), 'la pantalla de metas enseña la meta y el enlace para volver');
    ok(!fab(), 'en «Metas» no sale el botón «Antes»');
    H.juntosVer(['']); await sleep(20);
    ok(!!doc.querySelector('#content .jv5-g'), 'volver deja otra vez la pantalla principal');
  }
  // 3) yo entré como persona sin app y reclamé mi sitio: el grupo de dos sigue siendo «de dos»
  {
    const { S, H, doc } = await entorno();
    S.grupos = [{ id: 'g2', nombre: 'Casa', tipo: 'grupo', alias: { sYo: 'uYo' }, soyAdmin: false, miembros: [m('uO', 'Olga', { rol: 'admin' }), m('sYo', 'Lu', { sinCuenta: true }), yo] }];
    S.grupos.forEach((g) => { g.todos = g.miembros; });
    S.compartidos = [gasto('k1', 'g2', 50, 'uO', { uO: 25, uYo: 25 }, 'Luz')];
    H.goTab(['juntos']); await sleep(30);
    const f = doc.querySelector('#content .jv5-g');
    ok(!!f && /Olga/.test(f.textContent) && /Casa/.test(f.textContent) && /le debes/.test(f.textContent) && /25/.test(f.textContent), 'con mi alias: la fila es de Olga, «Casa», «le debes 25»');
    ok(!!f && !/personas/.test(f.textContent), 'y no cuenta mi alias como una persona más');
  }
  // 4) «Antes» y el botón de comparar
  {
    const { S, H, A, doc, fab } = await entorno({ version: {} });
    S.verAnterior = Object.assign({}, S.verAnterior); delete S.verAnterior.juntos;
    S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, m('uA', 'Ana'), m('uB', 'Bea')] }];
    S.grupos.forEach((g) => { g.todos = g.miembros; });
    S.compartidos = [gasto('k1', 'g1', 30, 'uYo', { uYo: 10, uA: 10, uB: 10 }, 'Compra')];
    H.goTab(['juntos']); await sleep(40);
    ok(!!doc.querySelector('#content .jv6-grupos'), 'sin elegir versión se ve la nueva (Amigos y Grupos)');
    ok(!!fab(), 'en la principal sale el botón de comparar');
    H.juntosVer(['personas']); await sleep(20); A.render(); await sleep(20);
    ok(!fab(), 'en «Por persona» no sale el botón de comparar');
    H.juntosVer(['']); await sleep(20); A.render(); await sleep(20);
    const vistos = [];
    for (let i = 0; i < 5; i++) { H.compararCambiar(['juntos']); await sleep(20); vistos.push(A.versionDe ? A.versionDe('juntos') : ''); }
    H.goTab(['juntos']); await sleep(20);
    ok(!!doc.querySelector('#content .jv6-grupos'), 'tras dar la vuelta a las 5 versiones vuelve la nueva');
    H.compararCambiar(['juntos']); await sleep(20);
    ok(!!doc.querySelector('#content .jv5-g') && !doc.querySelector('#content .jv6-grupos'), '«Antes» enseña la pantalla de grupos en filas');
  }
  // 5) usuario nuevo con compararVersiones:false: la nueva y sin botón, aunque tuviera otra elegida
  {
    const { S, H, A, doc, fab } = await entorno({ version: {}, cfg: { app: { nombre: 'Lucía', compararVersiones: false }, meta: { onboarded: true } } });
    S.verAnterior = Object.assign({}, S.verAnterior, { juntos: 2 });
    S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, m('uA', 'Ana'), m('uB', 'Bea')] }];
    S.grupos.forEach((g) => { g.todos = g.miembros; });
    S.compartidos = [gasto('k1', 'g1', 30, 'uYo', { uYo: 10, uA: 10, uB: 10 }, 'Compra')];
    H.goTab(['juntos']); await sleep(30); A.render(); await sleep(20);
    ok(!!doc.querySelector('#content .jv6-grupos') && !fab(), 'compararVersiones:false: la nueva y sin botón «Antes»');
  }
  // 6) un grupo recién creado en el que aún estoy yo solo
  {
    const { S, H, doc } = await entorno();
    S.grupos = [{ id: 'g9', nombre: 'Viaje', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo] }];
    S.grupos.forEach((g) => { g.todos = g.miembros; });
    S.compartidos = [];
    H.goTab(['juntos']); await sleep(30);
    const f = doc.querySelector('#content .jv5-g');
    ok(!!f && /Viaje/.test(f.textContent), 'un grupo en el que estoy solo sale con su nombre');
    ok(!!f && !/(^|\D)1 personas/.test(f.textContent), 'y no dice «1 personas»');
  }
  process.exit(fails ? 1 : 0);
})();

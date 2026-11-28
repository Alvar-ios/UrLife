// Calidad de la tanda 2b de Juntos: botón de arriba al cambiar de tipo y mensaje de «Pedir» con 0, 1, 3 y 5 gastos. Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
(async () => {
  const pad = (n) => String(n).padStart(2, '0'), d = new Date(), hoy = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const e = makeEnv({ version: { juntos: 4, importe: 1, crear: 1, tu: 1, agenda: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Restaurantes' }], nombre: 'Álvaro' }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uA' } },
    movs: [{ id: 'm1', tipo: 'Ingreso', categoria: 'Nómina', descripcion: 'Paga', importe: 40, fecha: hoy }, { id: 'm2', tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Cena', importe: 40, fecha: hoy }] });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc;
  S.user = Object.assign({}, S.user, { id: 'uA' });
  const ms = [{ user_id: 'uA', nombre: 'Álvaro', rol: 'admin' }, { user_id: 'uB', nombre: 'Ana', rol: 'miembro' }];
  S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: ms, todos: ms }];
  S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.db = Object.assign(S.db || {}, { grupos: (S.db && S.db.grupos) || { listar: async () => ({ grupos: [], miembros: [] }) }, compartidos: (S.db && S.db.compartidos) || { suscribir: () => () => {}, crear: async (o) => o, editar: async (i, o) => o, borrar: async () => [] }, rpc: async () => null });
  const cierra = async () => { H.closeSheet && H.closeSheet([]); await sleep(300); };

  // botón de arriba: un ingreso no lo muestra; si lo pasas a gasto, sí; al compartir se esconde (también con CSS)
  H.openMovForm(['m1']); await sleep(80);
  const b = () => doc.querySelector('#compArriba');
  ok(!b() || b().hidden, 'ingreso ya apuntado: no se ve «Compartir este gasto»');
  H.pickTipo(['Gasto']); await sleep(40);
  ok(b() && !b().hidden, 'si lo cambias a gasto, aparece');
  H.pickTipo(['Ingreso']); await sleep(40);
  ok(!b() || b().hidden, 'y si vuelves a ingreso, se esconde');
  await cierra();
  H.openMovForm(['m2']); await sleep(80);
  click(e, 'compOnTop'); await sleep(60);
  ok(b().hidden && !!doc.querySelector('#compField .comp-box'), 'gasto: al tocarlo se esconde y se abre compartir');
  H.compOff([]); await sleep(40);
  ok(!b().hidden, 'al quitar compartir vuelve el botón');
  const css = require('fs').readFileSync(__dirname + '/../look.css', 'utf8');
  ok(/\.comp-arriba\[hidden\]\s*\{\s*display:\s*none/.test(css), 'CSS: el botón escondido de verdad se esconde');
  await cierra();

  // «Pedir»: 0, 1, 3 y 5 gastos y céntimos
  const mk = (n, imp) => Array.from({ length: n }, (_, i) => ({ id: 'k' + i, grupoId: 'g1', tipo: 'Gasto', categoria: 'Ocio', descripcion: 'G' + (i + 1), importe: imp * 2, pagadoPor: 'uA', reparto: { uA: imp, uB: imp }, modo: 'igual', fecha: '2026-01-' + pad(i + 10) }));
  const msg = async (cs) => { S.compartidos = cs; H.personaVer(['uB']); await sleep(100); const a = doc.querySelector('#sheetHost a.wa-btn'); const t = a ? decodeURIComponent(a.getAttribute('href')) : ''; await cierra(); return t; };
  let t = await msg(mk(0, 10)); ok(t === '' || !/\(«/.test(t), '0 gastos: sin paréntesis de detalle');
  t = await msg(mk(1, 12.34)); ok(/«G1»/.test(t) && /12,34/.test(t), '1 gasto con céntimos: sale con coma');
  t = await msg(mk(3, 5)); ok(/G3/.test(t) && /G2/.test(t) && /G1/.test(t) && !/…/.test(t), '3 gastos: salen los 3 sin puntos suspensivos');
  t = await msg(mk(5, 5)); ok((t.match(/«G/g) || []).length === 3 && /…/.test(t), '5 gastos: salen 3 y «…»');
  // ya saldado en parte: solo los más nuevos que explican lo que debe
  const cs = mk(5, 10); cs.push({ id: 'p1', grupoId: 'g1', tipo: 'Liquidación', importe: 40, pagadoPor: 'uB', reparto: { uA: 40 }, fecha: hoy, categoria: 'Liquidación' });
  t = await msg(cs); ok(/G5/.test(t) && !/G1/.test(t) && !/G2/.test(t) && !/G3/.test(t), 'si ya pagó una parte, no lista los gastos viejos');
  process.exit(fails ? 1 : 0);
})();

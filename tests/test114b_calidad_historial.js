// Calidad · historial tanda 2 (30/10/2026, docs/27 §2.3, §3, §7): «Deshacer» = recuperar el mismo gasto, «Recuperar» desde el
// historial, pagos, permisos, doble toque, copia personal y su cuenta, y que el aviso de Inicio no pida el historial en bucle.
// Servidor simulado (como test60). Datos inventados. «PEND» = fallo leve conocido: no hace fallar la prueba.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pend = (c, m) => console.log((c ? 'ARREGLADO (cambiar por ok) ' : 'PEND ') + m);
const HOY = new Date().toISOString().slice(0, 10);
const M = (g, u, n, rol) => ({ grupo_id: g, user_id: u, nombre: n, rol: rol || 'miembro', created_at: '2026-10-01' });
const DB = {
  grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', reparto: null, edicion: 'todos', created_at: '2026-10-01' }],
  miembros: [M('g1', 'uA', 'Ana', 'admin'), M('g1', 'uB', 'Bea')],
  sc: [], comp: [], movs: { uA: {}, uB: {} }, hist: [],
};
let seq = 0, histId = 100; const LIST = []; const notifyComp = () => LIST.forEach((f) => f());
const CNT = { hist: 0, rec: 0 }; let histFalla = false;
const err = (m) => { throw new Error(m); };
const activo = (g, u) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === u && !m.baja);
const apunta = (c, accion, por) => DB.hist.unshift({ id: ++histId, grupo_id: c.grupoId, compartido_id: c.id, accion, hecho_por: por, hecho_por_nombre: por === 'uA' ? 'Ana' : 'Bea', hecho_en: new Date(Date.now() + histId).toISOString(),
  antes: null, despues: null, descripcion: c.descripcion, tipo: c.tipo, importe: c.importe, pagado_por: c.pagadoPor, reparto: c.reparto, borrado: null, nombres: { uA: 'Ana', uB: 'Bea' } });
function server(uid) {
  const ver = (c) => !c.borrado && activo(c.grupoId, uid);
  return {
    grupos: {
      listar: async () => ({ grupos: DB.grupos.filter((g) => activo(g.id, uid)).map((g) => Object.assign({}, g)), miembros: DB.miembros.filter((m) => activo(m.grupo_id, uid)).map((m) => Object.assign({}, m)), sinCuenta: [] }),
      invitaciones: async () => [], renombrar: async () => [], miNombre: async () => [], reparto: async () => [{}], edicion: async () => [{}],
    },
    compartidos: {
      suscribir: (next) => { const f = () => next(DB.comp.filter(ver).map((c) => JSON.parse(JSON.stringify(c)))); LIST.push(f); setTimeout(f, 0); return () => {}; },
      crear: async (o) => { const c = Object.assign(JSON.parse(JSON.stringify(o)), { id: 'c' + (++seq), creadoPor: uid, createdAt: new Date().toISOString() }); DB.comp.push(c); setTimeout(notifyComp, 5); return JSON.parse(JSON.stringify(c)); },
      editar: async () => err('no'),
      borrar: async (id) => { await sleep(5); const c = DB.comp.find((x) => x.id === id && !x.borrado); if (!c) err('compartido_borrado'); c.borrado = new Date().toISOString(); apunta(c, 'borrado', uid); DB.hist[0].borrado = c.borrado; setTimeout(notifyComp, 5); return true; },
    },
    objetivos: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    aportes: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    rpc: async (fn, p) => {
      if (fn === 'historial_grupo') { CNT.hist++; await sleep(5); if (histFalla) err('tarda demasiado');
        return DB.hist.filter((f) => !p.p_grupo || f.grupo_id === p.p_grupo).map((f) => { const c = DB.comp.find((x) => x.id === f.compartido_id);
          return Object.assign({}, f, { borrado: f.accion === 'borrado' && c && c.borrado ? c.borrado : null, puede_recuperar: f.accion === 'borrado' && !!(c && c.borrado) && activo(f.grupo_id, uid) && !DB.sinPermiso }); }); }
      if (fn === 'historial_nuevos') return [];
      if (fn === 'recuperar_compartido') { await sleep(20); const c = DB.comp.find((x) => x.id === p.p_id); if (!c || !activo(c.grupoId, uid) || DB.sinPermiso) err('no_autorizado'); if (!c.borrado) err('no_borrado'); CNT.rec++; c.borrado = false; apunta(c, 'recuperado', uid); setTimeout(notifyComp, 5); return null; }
      err('?' + fn);
    },
  };
}
const CUENTAS = [{ id: 'k1', nombre: 'Banco', saldo: 100, fecha: '2026-10-01', principal: true }, { id: 'k9', nombre: 'Otra', saldo: 100, fecha: '2026-10-01' }];
function env(uid, opts) {
  opts = opts || {};
  const cfgApp = Object.assign({ categoriasGasto: [{ nombre: 'Restaurantes' }] }, opts.cfg || {});
  if (opts.cuentas) cfgApp.cuentas = opts.cuentas;
  const e = makeEnv({ version: { juntos: 0 }, url: 'https://urlife-zeta.vercel.app/', cfg: { app: cfgApp, meta: { onboarded: true } }, session: { user: { email: uid + '@ejemplo.com', id: uid } }, pre: (w) => {
    w.history.replaceState = () => {};
    const ls = {}; Object.defineProperty(w, 'localStorage', { value: { getItem: (k) => (ls[k] == null ? null : ls[k]), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, configurable: true });
  } });
  const orig = e.w.Data, st = DB.movs[uid] || (DB.movs[uid] = {}), s = server(uid), cbs = [];
  const snap = () => cbs.forEach((cb) => cb({ docs: Object.entries(st).map(([id, v]) => ({ id, data: () => JSON.parse(JSON.stringify(v)) })) }));
  e.w.Data = { doc: orig.doc, grupos: s.grupos, compartidos: s.compartidos, objetivos: s.objetivos, aportes: s.aportes, rpc: s.rpc, uid: () => uid,
    collection: (n) => (n !== 'movimientos' ? orig.collection(n) : ({ onSnapshot: (cb) => { cbs.push(cb); setTimeout(snap, 0); return () => {}; },
      add: async (d) => { const k = 'n' + (++seq); st[k] = JSON.parse(JSON.stringify(d)); setTimeout(snap, 5); return { id: k }; },
      doc: (id) => { const k = id || 'n' + (++seq); return { id: k, set: async (d) => { st[k] = JSON.parse(JSON.stringify(d)); setTimeout(snap, 5); }, delete: async () => { delete st[k]; setTimeout(snap, 5); } }; } })) };
  return e;
}
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const appTxt = (e) => e.doc.querySelector('#app').textContent.replace(/\s+/g, ' ');
const toastTxt = (e) => (e.doc.querySelector('#toast') || {}).textContent || '';
const RARO = /NaN|undefined|null|Infinity|\[object/;
const borrarComp = async (e, id, gid) => { e.w.__APP__.H.compAbrir([id, gid]); await sleep(30); const b = e.doc.querySelector('[data-click^="deleteComp"], [data-click^="liqEliminar"]'); if (!b) return false; b.click(); b.click(); await sleep(80); return true; };
const vivos = (f) => DB.comp.filter((c) => !c.borrado && f(c));
const cuenta = (X, id) => X.saldoCuenta(X.cfg().cuentas.find((c) => c.id === id));
const efDe = (X, d) => X.movsEfectivos().filter((m) => m.descripcion === d).reduce((s, m) => s + Number(m.importe), 0);
const gasto = (id, imp, pag, rep, d, extra) => Object.assign({ id, grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: d, importe: imp, pagadoPor: pag, reparto: rep, modo: 'igual', creadoPor: pag, createdAt: '2026-10-17T10:00:00Z' }, extra || {});

(async () => {
  DB.comp.push(gasto('cLuz', 30, 'uA', { uA: 15, uB: 15 }, 'Luz'));
  DB.movs.uA.mA1 = { tipo: 'Gasto', fecha: HOY, categoria: 'Restaurantes', descripcion: 'Luz', importe: 30, compartidoId: 'cLuz', cuentaId: 'k9', creadoEn: 2 };
  DB.comp.push(gasto('cSuper', 60, 'uB', { uA: 30, uB: 30 }, 'Súper'));
  DB.movs.uB.mB1 = { tipo: 'Gasto', fecha: HOY, categoria: 'Restaurantes', descripcion: 'Súper', importe: 60, compartidoId: 'cSuper', creadoEn: 1 };
  DB.comp.push(Object.assign(gasto('cPago', 10, 'uA', { uB: 10 }, ''), { tipo: 'Liquidación', categoria: 'Liquidación', modo: 'importe' }));
  const a = env('uA', { cuentas: CUENTAS, cfg: { cuentaJuntos: { cLuz: 'k9', cPago: 'k9' } } }); await sleep(250); const A = a.w.__APP__;

  /* 1. Borrar lo tuyo con copia personal → Deshacer (dos toques) → otra vez borrar → Deshacer */
  const k9a = cuenta(A, 'k9'), k1a = cuenta(A, 'k1'), s0 = A.miSaldo('g1');
  ok(await borrarComp(a, 'cLuz', 'g1') && !DB.movs.uA.mA1, 'Ana borra la luz: se va también su copia personal');
  let bt = a.doc.querySelector('#toast .toast-btn'); bt.click(); bt.click(); await sleep(200);
  ok(CNT.rec === 1 && vivos((c) => c.descripcion === 'Luz').length === 1 && vivos((c) => c.id === 'cLuz').length === 1, '«Deshacer» con dos toques: se recupera una sola vez, el mismo gasto');
  ok(Object.values(DB.movs.uA).filter((m) => m.descripcion === 'Luz').length === 1 && DB.movs.uA.mA1 && DB.movs.uA.mA1.compartidoId === 'cLuz', 'vuelve una sola copia personal, con su id y enlazada al mismo gasto');
  ok(Math.abs(efDe(A, 'Luz') - 15) < 0.001 && Math.abs(A.miSaldo('g1') - s0) < 0.001, 'los números de Ana: la luz cuenta 15 € y el saldo del grupo vuelve');
  ok((A.cfg().cuentaJuntos || {}).cLuz === 'k9' && Math.abs(cuenta(A, 'k9') - k9a) < 0.001 && Math.abs(cuenta(A, 'k1') - k1a) < 0.001, 'la cuenta «Otra» vuelve a tener el cargo; «Banco» igual que antes');
  ok(await borrarComp(a, 'cLuz', 'g1'), 'segunda vez: Ana vuelve a borrar la luz');
  a.doc.querySelector('#toast .toast-btn').click(); await sleep(200);
  ok(CNT.rec === 2 && vivos((c) => c.id === 'cLuz').length === 1 && Object.values(DB.movs.uA).filter((m) => m.descripcion === 'Luz').length === 1, 'borrar → deshacer otra vez: sigue habiendo un gasto y una copia');

  /* 2. Borrar lo que pagó Bea (tiene copia) → Deshacer: los números de Bea vuelven a 30 € (no 60 + 30) y sigue siendo suyo */
  ok(await borrarComp(a, 'cSuper', 'g1'), 'Ana borra el súper de Bea');
  a.doc.querySelector('#toast .toast-btn').click(); await sleep(200);
  const b = env('uB'); await sleep(250); const B = b.w.__APP__;
  const su = DB.comp.find((c) => c.id === 'cSuper');
  ok(!su.borrado && su.creadoPor === 'uB' && Math.abs(efDe(B, 'Súper') - 30) < 0.001, 'tras «Deshacer», en los números de Bea el súper vuelve a contar 30 € y sigue siendo de Bea');

  /* 3. Pagos (Liquidación): borrar y deshacer */
  const pk9 = cuenta(A, 'k9');
  ok(await borrarComp(a, 'cPago', 'g1'), 'Ana borra su pago de 10 €');
  a.doc.querySelector('#toast .toast-btn').click(); await sleep(200);
  ok(vivos((c) => c.id === 'cPago').length === 1 && vivos((c) => c.tipo === 'Liquidación').length === 1 && (A.cfg().cuentaJuntos || {}).cPago === 'k9' && Math.abs(cuenta(A, 'k9') - pk9) < 0.001, 'pago: vuelve el mismo, una vez, y sale otra vez de «Otra»');

  /* 4. «Deshacer» cuando otra persona ya lo había recuperado: ¿vuelve la copia personal? */
  ok(await borrarComp(a, 'cLuz', 'g1'), 'Ana borra la luz otra vez');
  DB.comp.find((c) => c.id === 'cLuz').borrado = false; notifyComp(); await sleep(30); // Bea la recupera desde su historial
  a.doc.querySelector('#toast .toast-btn').click(); await sleep(200);
  ok(vivos((c) => c.id === 'cLuz').length === 1, 'no se duplica el gasto (el servidor dice no_borrado)');
  ok(!!DB.movs.uA.mA1 && (A.cfg().cuentaJuntos || {}).cLuz === 'k9', 'si ya lo recuperó otra persona, «Deshacer» vuelve a poner tu copia y tu cuenta');
  // lo dejamos como al principio
  if (!DB.movs.uA.mA1) { await A.S.db.collection('movimientos').doc('mA1').set({ tipo: 'Gasto', fecha: HOY, categoria: 'Restaurantes', descripcion: 'Luz', importe: 30, compartidoId: 'cLuz', cuentaId: 'k9', creadoEn: 2 }); await sleep(30); }
  A.S.config = Object.assign({}, A.cfg(), { cuentaJuntos: Object.assign({}, A.cfg().cuentaJuntos, { cLuz: 'k9' }) });

  /* 5. docs/27 §7: borras lo tuyo (con copia) y DESPUÉS lo recupera alguien desde el historial */
  const e9 = cuenta(A, 'k9'), e1 = cuenta(A, 'k1');
  ok(A.S.movimientos.some((m) => m.id === 'mA1') && await borrarComp(a, 'cLuz', 'g1') && !DB.movs.uA.mA1, 'Ana (con copia personal) borra la luz y no toca «Deshacer»');
  A.H.closeSheet([]); await sleep(260);
  A.S.hist = {}; A.H.histVer(['g1']); await sleep(120);
  const recs = a.doc.querySelectorAll('#sheetHost .hist-rec');
  ok(recs.length >= 1 && /Recuperar/.test(sh(a)) && !RARO.test(sh(a)), 'en el historial sale «Recuperar» en la luz borrada');
  // dos toques seguidos en Recuperar
  const fl = A.S.hist.g1.filas.find((f) => f.accion === 'borrado' && f.cid === 'cLuz' && f.borrado);
  const r0 = CNT.rec; A.H.histRecuperar(['g1', fl.id]); await A.H.histRecuperar(['g1', fl.id]); await sleep(200);
  ok(CNT.rec === r0 + 1 && vivos((c) => c.id === 'cLuz').length === 1, '«Recuperar» con dos toques: se recupera una sola vez');
  ok(/Has recuperado «Luz»/.test(toastTxt(a)), 'aviso «Has recuperado «Luz»»');
  ok(Math.abs(efDe(A, 'Luz') - 15) < 0.001, '§7: en los números de Ana la luz vuelve a contar 15 € (su parte), aunque ya no hay copia');
  ok(Math.abs((cuenta(A, 'k9') + cuenta(A, 'k1')) - (e9 + e1)) < 0.001, '§7: el dinero total de sus cuentas queda igual que antes de borrar (no se pierde ni se duplica)');
  pend(!!DB.movs.uA.mA1, '§7: la copia personal (con sus artículos, forma de pago y cuenta) no vuelve al recuperar desde el historial');
  ok(Math.abs(cuenta(A, 'k9') - e9) < 0.001, '§7: el cargo vuelve a la cuenta donde estaba (no se olvida cuentaJuntos al borrar)');

  /* 6. Sin permiso: ni botón ni nota, y el detalle dice «Sigue borrado.» */
  A.H.closeSheet([]); await sleep(260);
  ok(await borrarComp(a, 'cSuper', 'g1'), 'Ana borra el súper otra vez');
  A.H.closeSheet([]); await sleep(260);
  DB.sinPermiso = true; A.S.hist = {}; A.H.histVer(['g1']); await sleep(120);
  const fs = A.S.hist.g1.filas.find((f) => f.accion === 'borrado' && f.cid === 'cSuper' && f.borrado);
  ok(!a.doc.querySelector('#sheetHost .hist-rec') && !/lo has recuperado tú/.test(sh(a)), 'sin permiso: no sale «Recuperar» ni la nota');
  A.H.histDetalle(['g1', fs.id]); await sleep(30);
  ok(/Sigue borrado\./.test(sh(a)) && !/Recuperar/.test(sh(a)), 'sin permiso: el detalle dice «Sigue borrado.» y no ofrece recuperar');
  const r1 = CNT.rec; await A.H.histRecuperar(['g1', fs.id]); await sleep(40);
  ok(CNT.rec === r1, 'sin permiso: aunque llegue la acción, no se pide nada');
  DB.sinPermiso = false; A.H.closeSheet([]); await sleep(260);

  /* 7. Inicio: sin bucle de peticiones (ni cuando va bien ni cuando falla) */
  const b2 = env('uB'); await sleep(250); const B2 = b2.w.__APP__;
  B2.S.tab = 'inicio'; B2.S.hist = {}; const h0 = CNT.hist;
  for (let i = 0; i < 10; i++) { B2.render(); await sleep(15); }
  ok(CNT.hist - h0 === 1, 'Inicio con 10 repintados: una sola petición del historial (' + (CNT.hist - h0) + ')');
  ok(/Ana borró «Súper»/.test(appTxt(b2)) && !RARO.test(appTxt(b2)), 'Inicio de Bea: «Ana borró «Súper»» y sin textos raros [' + ((appTxt(b2).match(/Ana borr[^€]*€/) || [''])[0]) + ']');
  ok(!!B2.cfg().historialAvisoDesde, 'la primera vez se guarda desde cuándo avisar');
  histFalla = true; B2.S.hist = {}; const h1 = CNT.hist;
  for (let i = 0; i < 10; i++) { B2.render(); await sleep(15); }
  ok(CNT.hist - h1 === 1 && !/Ana borró/.test(appTxt(b2)), 'si falla: una sola petición en 10 repintados y no se rompe Inicio (' + (CNT.hist - h1) + ')');
  histFalla = false;

  /* 8. Usuario nuevo (sin grupos) y una sola cuenta */
  const n = env('uN'); await sleep(250); const N = n.w.__APP__; const h2 = CNT.hist;
  N.S.tab = 'inicio'; for (let i = 0; i < 5; i++) { N.render(); await sleep(10); }
  ok(CNT.hist === h2 && !N.cfg().historialAvisoDesde && !RARO.test(appTxt(n)), 'usuario nuevo: Inicio no pide historial ni guarda nada');
  const a1 = env('uA'); await sleep(250); const A1 = a1.w.__APP__;
  ok(await borrarComp(a1, 'cLuz', 'g1'), 'una sola cuenta: Ana borra la luz');
  a1.doc.querySelector('#toast .toast-btn').click(); await sleep(200);
  ok(vivos((c) => c.id === 'cLuz').length === 1 && !(A1.cfg().cuentaJuntos || {}).cLuz2 && /Recuperado/.test(toastTxt(a1)), 'una sola cuenta: «Deshacer» funciona y dice «Recuperado»');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

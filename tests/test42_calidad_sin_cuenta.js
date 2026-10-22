// Calidad (17/10/2026): revisión de «personas sin cuenta» en Juntos.
// Comprueba los sitios que enseñan o suman gastos compartidos con alias (quien ocupó el sitio de alguien),
// que una persona sin cuenta no sea «amiga» ni destino directo, y que sin la migración la app siga igual.
// Servidor simulado (mismas reglas que test41). Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
const { JSDOM } = require('jsdom'), fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const HOY = new Date().toISOString().slice(0, 10);
const DB = {
  grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', reparto: null, edicion: 'todos', created_at: '2026-10-01' },
    { id: 'g2', nombre: '', tipo: 'directo', reparto: null, edicion: 'todos', created_at: '2026-10-01' }],
  miembros: [{ grupo_id: 'g1', user_id: 'uA', nombre: 'Ana', rol: 'admin', created_at: '2026-10-01' }, { grupo_id: 'g1', user_id: 'uB', nombre: 'Bea', rol: 'miembro', created_at: '2026-10-02' },
    { grupo_id: 'g2', user_id: 'uA', nombre: 'Ana', rol: 'admin', created_at: '2026-10-01' }, { grupo_id: 'g2', user_id: 'uB', nombre: 'Bea', rol: 'miembro', created_at: '2026-10-01' }],
  sc: [{ id: 'sMarta', grupo_id: 'g1', nombre: 'Marta', creado_por: 'uA', created_at: '2026-10-03', historial: true },
    { id: 'sLuis', grupo_id: 'g1', nombre: 'Luis', creado_por: 'uA', created_at: '2026-10-04', historial: true }],
  enl: [], comp: [], movs: { uA: {}, uB: {}, uC: {} },
};
let seq = 0; const LIST = []; const notifyComp = () => LIST.forEach((f) => f());
const err = (m) => { throw new Error(m); };
const activo = (g, u) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === u && !m.baja);
const esPart = (g, id, ins) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === id && (!m.baja || !ins)) ||
  DB.sc.some((i) => i.grupo_id === g && i.id === id && (!ins || (!i.baja && !i.reclamado_por)));
function validar(c, ins) {
  if (!esPart(c.grupoId, c.pagadoPor, ins)) err('pagador_no_valido');
  const ks = Object.keys(c.reparto || {}); let t = 0;
  ks.forEach((k) => { if (!esPart(c.grupoId, k, ins)) err('reparto_no_valido'); t += c.reparto[k]; });
  if (!ks.length || Math.abs(t - c.importe) > 0.01) err('reparto_no_cuadra');
}
function server(uid, sinMigracion) {
  const ver = (c) => !c.borrado && activo(c.grupoId, uid);
  return {
    grupos: {
      listar: async () => {
        const r = { grupos: DB.grupos.filter((g) => activo(g.id, uid)).map((g) => { const x = Object.assign({}, g); if (sinMigracion) delete x.edicion; return x; }), miembros: DB.miembros.filter((m) => activo(m.grupo_id, uid)).map((m) => Object.assign({}, m)) };
        if (!sinMigracion) r.sinCuenta = DB.sc.filter((i) => activo(i.grupo_id, uid) || i.reclamado_por === uid).map((i) => Object.assign({}, i));
        return r;
      },
      invitaciones: async () => [], renombrar: async () => [], miNombre: async () => [], reparto: async () => [{}], edicion: async () => [{}],
    },
    compartidos: {
      suscribir: (next) => { const f = () => next(DB.comp.filter(ver).map((c) => JSON.parse(JSON.stringify(c)))); LIST.push(f); setTimeout(f, 0); return () => {}; },
      crear: async (o) => { if (!activo(o.grupoId, uid)) err('row-level security'); const c = Object.assign({ id: 'c' + (++seq), creadoPor: uid, createdAt: new Date(Date.now() + seq).toISOString() }, JSON.parse(JSON.stringify(o))); validar(c, true); DB.comp.push(c); setTimeout(notifyComp, 5); return JSON.parse(JSON.stringify(c)); },
      editar: async () => err('no'), borrar: async () => err('no'),
    },
    objetivos: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    aportes: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    rpc: async (fn, p) => {
      if (sinMigracion) err('Could not find the function public.' + fn + ' in the schema cache');
      if (fn === 'crear_directo') { const g = DB.grupos.find((x) => x.tipo === 'directo' && activo(x.id, uid) && activo(x.id, p.p_user)); if (!g) err('no_es_amigo'); return g.id; }
      if (fn === 'enlace_sin_cuenta') { const t = 'SOY' + (++seq) + 'abcdefghijklmnopq'; DB.enl.push({ token: t, invitado_id: p.p_id }); return t; }
      if (fn === 'ver_enlace_sin_cuenta') { const e = DB.enl.find((x) => x.token === p.p_token), i = DB.sc.find((x) => x.id === e.invitado_id); return { valida: true, grupo: i.grupo_id, nombre_grupo: 'Piso', nombre: i.nombre, gastos: 1 }; }
      if (fn === 'reclamar_sin_cuenta') { const e = DB.enl.find((x) => x.token === p.p_token), i = DB.sc.find((x) => x.id === e.invitado_id);
        DB.miembros.push({ grupo_id: i.grupo_id, user_id: uid, nombre: i.nombre, rol: 'miembro', created_at: '2026-10-17' }); i.reclamado_por = uid; i.historial = p.p_historial; e.usado = true; setTimeout(notifyComp, 5); return i.grupo_id; }
      err('?' + fn);
    },
  };
}
function env(uid, opts) {
  opts = opts || {};
  const cfgApp = { categoriasGasto: [{ nombre: 'Restaurantes' }] };
  if (opts.cuentas) cfgApp.cuentas = opts.cuentas;
  const e = makeEnv({version:{juntos:2}, url: opts.url || 'https://urlife-zeta.vercel.app/', cfg: { app: cfgApp, meta: { onboarded: true } }, session: { user: { email: uid + '@ejemplo.com', id: uid } }, pre: (w) => {
    w.history.replaceState = () => {};
    const ls = {}; Object.defineProperty(w, 'localStorage', { value: { getItem: (k) => (ls[k] == null ? null : ls[k]), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, configurable: true });
  } });
  const orig = e.w.Data, st = DB.movs[uid] || {}, s = server(uid, opts.sinMigracion);
  e.w.Data = { doc: orig.doc, grupos: s.grupos, compartidos: s.compartidos, objetivos: s.objetivos, aportes: s.aportes, rpc: s.rpc, uid: () => uid,
    collection: (n) => (n !== 'movimientos' ? orig.collection(n) : ({ onSnapshot: (cb) => { setTimeout(() => cb({ docs: Object.entries(st).map(([id, v]) => ({ id, data: () => v })) }), 0); return () => {}; },
      add: async (d) => { const k = 'n' + (++seq); st[k] = d; return { id: k }; }, doc: (id) => ({ id: id || 'n' + (++seq), set: async () => {}, delete: async () => {} }) })) };
  return e;
}
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const toastTxt = (e) => (e.doc.querySelector('#toast') || {}).textContent || '';
const clicks = (e, pre) => [...e.doc.querySelectorAll('[data-click^="' + pre + '"]')].map((x) => decodeURIComponent(x.getAttribute('data-click')));

(async () => {
  DB.grupos[0].reparto = { uA: 50, uB: 25, sMarta: 25, sLuis: 0 };
  // Marta (sin cuenta) pagó un taxi de 20 a medias con Ana; Ana pagó una cena de 40 entre los tres (Ana, Bea, Marta) + Luis 0
  DB.comp.push({ id: 'cTaxi', grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Taxi', descripcion: '', importe: 20, pagadoPor: 'sMarta', reparto: { uA: 10, sMarta: 10 }, modo: 'igual', creadoPor: 'uA', createdAt: '2026-10-17T10:00:00Z' });
  DB.comp.push({ id: 'cCena', grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: '', importe: 40, pagadoPor: 'uA', reparto: { uA: 10, uB: 10, sMarta: 10, sLuis: 10 }, modo: 'igual', creadoPor: 'uA', createdAt: '2026-10-17T11:00:00Z' });
  const a = env('uA'); await sleep(250); const A = a.w.__APP__;

  /* 1. Una persona sin cuenta no es «amiga» ni destino directo */
  A.H.compNuevoEn(['g1']); await sleep(40);
  const dests = clicks(a, 'compDest');
  ok(dests.length > 0 && !dests.some((k) => /sMarta|sLuis/.test(k)), 'al compartir, «Con» no ofrece a Marta o Luis como persona suelta (sin grupo) [' + dests.join(', ') + ']');
  ok(/Por %/.test(sh(a)) && A.form().comp.modo === 'porcentaje' && A.form().comp.vals.sMarta === '25', 'antes de ocupar su sitio, el reparto habitual (50/25/25) se aplica con Marta');
  A.H.closeSheet([]); await sleep(260);
  A.H.grupoVer(['g2']); await sleep(60);
  ok(!/¿Alguien no tiene la app\?/.test(sh(a)), 'en una persona sin grupo (directo) no se ofrece añadir a alguien sin cuenta');
  A.H.closeSheet([]); await sleep(260);

  /* 2. Saldar con una persona sin cuenta desde el balance de Juntos */
  A.H.juntosPersona(['sLuis']); await sleep(30);
  ok(/Luis te paga/.test(sh(a)), 'tocar a Luis en «Balance con tus personas» abre «Saldar»: «Luis te paga»');
  click(a, 'saldarGuardar'); await sleep(60);
  const liq = DB.comp.find((c) => c.tipo === 'Liquidación');
  ok(liq && liq.pagadoPor === 'sLuis' && liq.reparto.uA === 10 && !A.deudasDe('g1').some((d) => d.de === 'sLuis'), 'el pago de Luis se apunta y Luis queda en paz');

  /* 3. Carla ocupa el sitio de Marta, y ya usaba la app con una cuenta principal */
  const t = await A.S.db.rpc('enlace_sin_cuenta', { p_id: 'sMarta' });
  const c = env('uC', { url: 'https://urlife-zeta.vercel.app/?soy=' + t, cuentas: [{ id: 'k1', nombre: 'Banco', saldo: 500, fecha: '2026-10-01', principal: true }] }); await sleep(300);
  const C = c.w.__APP__;
  click(c, 'reclamarConfirmar'); await sleep(150);
  ok(DB.sc[0].reclamado_por === 'uC', 'Carla ocupa el sitio de Marta');
  // Marta: pagó 20, su parte 10 + 10 → saldo 0
  ok(Math.abs(C.miSaldo('g1')) < 0.001, 'Juntos: Carla (antes Marta) está en paz (pagó 20, su parte 20)');
  const k1 = C.cfg().cuentas[0];
  ok(Math.abs(C.compartidosCuenta(k1).neto - C.miSaldo('g1')) < 0.001, '«Tu saldo» usa lo mismo que Juntos');
  ok(Math.abs(C.kpisMes(new Date().getFullYear(), new Date().getMonth() + 1).gastos - 20) < 0.001, 'Inicio: su parte de antes (10 + 10) cuenta en sus gastos');

  // lista de gastos del grupo, vista por Carla
  await C.H.grupoVer(['g1']); await sleep(80);
  const txtC = sh(c);
  ok(!/pagó Tú/.test(txtC), 'en «Últimos gastos y pagos» del grupo no pone «pagó Tú» (debería decir «pagaste tú»)');
  ok(/Marta 25 %/.test(txtC) && !/A partes iguales/.test(txtC), 'el reparto habitual sigue mostrando la parte de Marta (25 %) y no vuelve a «A partes iguales»');
  C.H.closeSheet([]); await sleep(260);

  // Movimientos de Carla: el taxi que pagó Marta dice «pagaste tú»
  ok(/pagaste tú/.test(c.w.__APP__.S.compartidos.length ? (() => { C.S.tab = 'movimientos'; C.S.movVista = 'lista'; C.render(); return c.doc.querySelector('#app').textContent; })() : ''), 'Movimientos: el taxi que pagó Marta sale como «pagaste tú»');

  // Carla abre el taxi para cambiarlo: no debe salir dos veces ella misma («Yo» y «Tú»)
  C.H.openMovForm(['c:cTaxi']); await sleep(40);
  const pag = clicks(c, 'compPagador');
  const nombresPag = [...c.doc.querySelectorAll('[data-click^="compPagador"]')].map((x) => x.textContent.trim());
  ok(!(nombresPag.includes('Yo') && nombresPag.includes('Tú')), 'al editar el taxi, «Pagó» no enseña a Carla dos veces («Yo» y «Tú») [' + nombresPag.join(', ') + ']');
  void pag;
  C.H.closeSheet([]); await sleep(260);

  // Ana, tras recargar: el reparto habitual del grupo debería seguir valiendo con Carla en lugar de Marta
  await A.H.grupoVer(['g1']); await sleep(80);
  A.H.closeSheet([]); await sleep(260);
  A.H.compNuevoEn(['g1']); await sleep(40);
  ok(A.form().comp.modo === 'porcentaje' && A.form().comp.vals.uC === '25', 'tras ocupar el sitio, un gasto nuevo sigue usando el reparto habitual 50/25/25 (Carla 25 %)');
  A.H.closeSheet([]); await sleep(260);

  /* 4. Sin la migración (no hay tabla grupo_invitados ni columna edicion): todo como antes */
  const b = env('uB', { sinMigracion: true }); await sleep(250); const B = b.w.__APP__;
  B.H.grupoVer(['g1']); await sleep(60);
  ok(/Ana/.test(sh(b)) && /Miembros \(3\)/.test(sh(b)) && !/sin cuenta/.test(sh(b).replace(/no tiene la app/, '')), 'sin la migración, el grupo se abre con sus 3 miembros con cuenta y ninguno «sin cuenta»');
  const ofreceSC = /¿Alguien no tiene la app\?/.test(sh(b));
  console.log('INFO sin la migración se ofrece «Añadir» persona sin cuenta: ' + (ofreceSC ? 'sí' : 'no'));
  if (ofreceSC) {
    b.doc.querySelector('#gSinCuenta').value = 'Prueba';
    click(b, 'sinCuentaAnadir', 'g1'); await sleep(60);
    console.log('INFO y al tocarlo dice: «' + toastTxt(b).trim() + '»');
  }

  /* 5. data-layer: si la tabla grupo_invitados no existe, grupos.listar sigue funcionando */
  const dom = new JSDOM('', { runScripts: 'outside-only' }), w = dom.window;
  const res = { grupos: { data: [{ id: 'g1' }], error: null }, grupo_miembros: { data: [{ grupo_id: 'g1', user_id: 'u1' }], error: null }, grupo_invitados: { data: null, error: { message: 'relation "public.grupo_invitados" does not exist', code: '42P01' } } };
  const qb = (tab) => { const bb = { select() { return bb; }, eq() { return bb; }, is() { return bb; }, order() { return bb; }, then(r, j) { return Promise.resolve(res[tab] || { data: [], error: null }).then(r, j); } }; return bb; };
  w.supabase = { createClient: () => ({ from: qb, rpc: () => Promise.resolve({ data: null, error: null }), channel() { const ch = { on() { return ch; }, subscribe() { return ch; } }; return ch; }, removeChannel() {},
    auth: { onAuthStateChange(cb) { setTimeout(() => cb('SIGNED_IN', { user: { id: 'u1' } }), 0); }, getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) } }) };
  w.SUPABASE_CONFIG = { url: 'x', anonKey: 'y' };
  w.eval(fs.readFileSync(path.join(__dirname, '..', 'data-layer.js'), 'utf8'));
  await sleep(10);
  let r = null; try { r = await w.Data.grupos.listar(); } catch (e) { r = null; }
  ok(r && r.grupos.length === 1 && r.miembros.length === 1 && Array.isArray(r.sinCuenta) && r.sinCuenta.length === 0, 'data-layer: sin la tabla nueva, listar devuelve grupos y miembros (y ninguna persona sin cuenta)');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

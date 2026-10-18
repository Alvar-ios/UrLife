// Confianza en Juntos (18/10/2026): «¿De dónde sale?» línea a línea y «Deshacer» al borrar un gasto o un pago compartido.
// Servidor simulado (como test55). Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
const { JSDOM } = require('jsdom'), fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const HOY = new Date().toISOString().slice(0, 10);
const DB = {
  grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', reparto: null, edicion: 'todos', created_at: '2026-10-01' },
    { id: 'g2', nombre: '', tipo: 'directo', reparto: null, edicion: 'todos', created_at: '2026-10-01' }],
  miembros: [{ grupo_id: 'g1', user_id: 'uA', nombre: 'Ana', rol: 'admin', created_at: '2026-10-01' }, { grupo_id: 'g1', user_id: 'uB', nombre: 'Bea', rol: 'miembro', created_at: '2026-10-02' },
    { grupo_id: 'g2', user_id: 'uA', nombre: 'Ana', rol: 'admin', created_at: '2026-10-01' }, { grupo_id: 'g2', user_id: 'uB', nombre: 'Bea', rol: 'miembro', created_at: '2026-10-01' }],
  sc: [],
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
      editar: async () => err('no'), borrar: async (id) => { const c = DB.comp.find((x) => x.id === id); if (!c) err('no'); c.borrado = true; setTimeout(notifyComp, 5); return true; },
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
  const e = makeEnv({ url: opts.url || 'https://urlife-zeta.vercel.app/', cfg: { app: cfgApp, meta: { onboarded: true } }, session: { user: { email: uid + '@ejemplo.com', id: uid } }, pre: (w) => {
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
  // piso: Bea pagó el súper (60, a medias); Ana pagó la luz (30, a medias); Ana le pagó 5 a Bea
  DB.comp.push({ id: 'cSuper', grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Súper', importe: 60, pagadoPor: 'uB', reparto: { uA: 30, uB: 30 }, modo: 'igual', creadoPor: 'uB', createdAt: '2026-10-17T10:00:00Z' });
  DB.comp.push({ id: 'cLuz', grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Luz', importe: 30, pagadoPor: 'uA', reparto: { uA: 15, uB: 15 }, modo: 'igual', creadoPor: 'uA', createdAt: '2026-10-17T11:00:00Z' });
  DB.comp.push({ id: 'cPago', grupoId: 'g1', fecha: HOY, tipo: 'Liquidación', categoria: 'Liquidación', descripcion: '', importe: 5, pagadoPor: 'uA', reparto: { uB: 5 }, modo: 'importe', creadoPor: 'uA', createdAt: '2026-10-17T12:00:00Z' });
  const a = env('uA', { cuentas: [{ id: 'k1', nombre: 'Banco', saldo: 100, fecha: '2026-10-01', principal: true }, { id: 'k9', nombre: 'Otra', saldo: 0, fecha: '2026-10-01' }] }); await sleep(250); const A = a.w.__APP__;
  const efs = A.S.compartidos.filter((c) => c.grupoId === 'g1').map(A.efectoMio);
  ok(Math.abs(efs.reduce((x, y) => x + y, 0) - A.miSaldo('g1')) < 0.001 && Math.abs(A.miSaldo('g1') + 10) < 0.001, 'la suma línea a línea da tu saldo (−30 + 15 + 5 = −10)');
  await A.H.grupoVer(['g1']); await sleep(60);
  ok(/¿De dónde sale\?/.test(sh(a)), 'en el grupo hay «¿De dónde sale?»');
  A.H.origenVer(['g1']); await sleep(20);
  ok(/Debes\s*10,00/.test(sh(a)) && /Súper/.test(sh(a)) && /Bea pagó 60,00 € · tu parte 30,00 €/.test(sh(a)) && /−30,00/.test(sh(a)), 'línea del súper: «Bea pagó 60 € · tu parte 30 €» → −30');
  ok(/pagaste 30,00 € · tu parte 15,00 €/.test(sh(a)) && /\+15,00/.test(sh(a)) && /Pagaste a Bea/.test(sh(a)) && /\+5,00/.test(sh(a)), 'luz +15 y el pago a Bea +5');
  ok(/Tu saldo\s*−10,00/.test(sh(a)), 'total: «Tu saldo −10 €»');
  A.H.closeSheet([]); await sleep(260);
  A.H.personaVer(['uB']); await sleep(20);
  ok(/¿De dónde sale\?/.test(sh(a)), 'en la hoja de Bea también');
  A.H.closeSheet([]); await sleep(260);
  // borrar algo que pagó otra persona: sin «Deshacer» (romperia su copia y su permiso)
  A.H.compAbrir(['cSuper', 'g1']); await sleep(30);
  let bt = a.doc.querySelector('[data-click^="deleteComp"]'); bt.click(); bt.click(); await sleep(80);
  ok(DB.comp.find((c) => c.id === 'cSuper').borrado && !a.doc.querySelector('#toast .toast-btn') && /no se puede deshacer/.test(toastTxt(a)), 'borrar el súper (lo pagó Bea): se borra, sin «Deshacer» y con aviso');
  // borrar la luz (la pagaste y apuntaste tú) y deshacer
  A.S.config = Object.assign({}, A.cfg(), { cuentaJuntos: { cLuz: 'k9' } });
  const s0 = A.miSaldo('g1');
  A.H.compAbrir(['cLuz', 'g1']); await sleep(30);
  bt = a.doc.querySelector('[data-click^="deleteComp"]'); bt.click(); bt.click(); await sleep(80);
  ok(DB.comp.find((c) => c.id === 'cLuz').borrado && Math.abs(A.miSaldo('g1') - (s0 - 15)) < 0.001, 'borrar la luz: deja de contar');
  ok(/eliminado/.test(toastTxt(a)) && /Deshacer/.test(toastTxt(a)), 'aviso con «Deshacer»');
  a.doc.querySelector('#toast .toast-btn').click(); await sleep(120);
  const re = DB.comp.find((c) => !c.borrado && c.descripcion === 'Luz');
  ok(re && re.importe === 30 && re.pagadoPor === 'uA' && re.reparto.uB === 15 && Math.abs(A.miSaldo('g1') - s0) < 0.001, '«Deshacer» la vuelve a crear igual y el saldo vuelve');
  ok(DB.comp.filter((c) => !c.borrado && c.descripcion === 'Luz').length === 1, 'sin duplicados');
  ok((A.cfg().cuentaJuntos || {})[re.id] === 'k9' && !(A.cfg().cuentaJuntos || {}).cLuz, 'y recupera la cuenta desde la que se pagó');
  // borrar un pago y deshacer
  A.H.compAbrir(['cPago', 'g1']); await sleep(30);
  const bl = a.doc.querySelector('[data-click^="liqEliminar"]');
  if (bl) { bl.click(); bl.click(); await sleep(80); a.doc.querySelector('#toast .toast-btn').click(); await sleep(120); }
  ok(bl && DB.comp.filter((c) => !c.borrado && c.tipo === 'Liquidación' && c.importe === 5).length === 1, 'borrar un pago (lo hiciste tú) y «Deshacer»: vuelve el pago de 5 €');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

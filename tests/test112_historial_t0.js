// docs/27 tanda 0: «Apuntado por… · cambiado por…» al pie del gasto compartido y «X cambió» en Actividad. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const HOY = new Date().toISOString().slice(0, 10);
let DB;
function nuevoDB() {
  return {
    grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', reparto: null, edicion: 'todos', created_at: '2026-10-01' },
      { id: 'g2', nombre: '', tipo: 'directo', reparto: null, edicion: 'todos', created_at: '2026-10-01' }],
    miembros: [{ grupo_id: 'g1', user_id: 'uA', nombre: 'Ana', rol: 'admin', created_at: '2026-10-01' }, { grupo_id: 'g1', user_id: 'uB', nombre: 'Bea', rol: 'miembro', created_at: '2026-10-02' },
      { grupo_id: 'g2', user_id: 'uA', nombre: 'Ana', rol: 'admin', created_at: '2026-10-01' }, { grupo_id: 'g2', user_id: 'uB', nombre: 'Bea', rol: 'miembro', created_at: '2026-10-01' }],
    sc: [], comp: [],
  };
}
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
function server(uid) {
  const ver = (c) => !c.borrado && activo(c.grupoId, uid);
  return {
    grupos: {
      listar: async () => ({ grupos: DB.grupos.filter((g) => activo(g.id, uid)).map((g) => Object.assign({}, g)), miembros: DB.miembros.filter((m) => activo(m.grupo_id, uid)).map((m) => Object.assign({}, m)),
        sinCuenta: DB.sc.filter((i) => activo(i.grupo_id, uid) || i.reclamado_por === uid).map((i) => Object.assign({}, i)) }),
      invitaciones: async () => [], renombrar: async (id, n) => { DB.grupos.find((g) => g.id === id).nombre = n; return [{}]; }, miNombre: async () => [], reparto: async () => [{}], edicion: async () => [{}],
    },
    compartidos: {
      suscribir: (next) => { const f = () => next(DB.comp.filter(ver).map((c) => JSON.parse(JSON.stringify(c)))); LIST.push(f); setTimeout(f, 0); return () => {}; },
      crear: async (o) => { await sleep(15); if (!activo(o.grupoId, uid)) err('row-level security'); const c = Object.assign({ id: 'c' + (++seq), creadoPor: uid, createdAt: new Date(Date.now() + seq).toISOString() }, JSON.parse(JSON.stringify(o))); validar(c, true); DB.comp.push(c); setTimeout(notifyComp, 5); return JSON.parse(JSON.stringify(c)); },
      editar: async () => err('no'), borrar: async (id) => { const c = DB.comp.find((x) => x.id === id); if (!c) err('no'); c.borrado = true; setTimeout(notifyComp, 5); return true; },
    },
    objetivos: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    aportes: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    rpc: async (fn, p) => {
      if (fn === 'crear_directo') { const g = DB.grupos.find((x) => x.tipo === 'directo' && activo(x.id, uid) && activo(x.id, p.p_user)); if (!g) err('no_es_amigo'); return g.id; }
      err('?' + fn);
    },
  };
}
function env(uid, opts) {
  opts = opts || {};
  const cfgApp = { categoriasGasto: [{ nombre: 'Restaurantes' }] };
  if (opts.cuentas) cfgApp.cuentas = opts.cuentas;
  const e = makeEnv({ version: { juntos: 0 }, cfg: { app: cfgApp, meta: { onboarded: true } }, session: { user: { email: uid + '@ejemplo.com', id: uid } }, pre: (w) => {
    w.history.replaceState = () => {};
    const ls = {}; Object.defineProperty(w, 'localStorage', { value: { getItem: (k) => (ls[k] == null ? null : ls[k]), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, configurable: true });
  } });
  const orig = e.w.Data, st = {}, s = server(uid);
  e.w.Data = { doc: orig.doc, grupos: s.grupos, compartidos: s.compartidos, objetivos: s.objetivos, aportes: s.aportes, rpc: s.rpc, uid: () => uid,
    collection: (n) => (n !== 'movimientos' ? orig.collection(n) : ({ onSnapshot: (cb) => { setTimeout(() => cb({ docs: Object.entries(st).map(([id, v]) => ({ id, data: () => v })) }), 0); return () => {}; },
      add: async (d) => { const k = 'n' + (++seq); st[k] = d; return { id: k }; }, doc: (id) => ({ id: id || 'n' + (++seq), set: async (d) => { st[id || 'n' + seq] = d; }, delete: async () => {} }) })) };
  return e;
}
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const appTxt = (e) => e.doc.querySelector('#app').textContent.replace(/\s+/g, ' ');
const gasto = (id, gid, imp, pag, rep, desc, por) => ({ id, grupoId: gid, fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: desc || '', importe: imp, pagadoPor: pag, reparto: rep, modo: 'importe', creadoPor: por || pag, createdAt: '2026-10-17T10:00:00Z' });
const hace = (min) => new Date(Date.now() - min * 60000).toISOString();
(async () => {
  DB = nuevoDB();
  // k1: lo apuntó Bea hace 2 días y lo cambió Ana hace 3 h; k2: lo apuntó Ana y nadie lo cambió (updatedAt casi igual)
  const k1 = gasto('k1', 'g1', 36, 'uB', { uA: 18, uB: 18 }, 'Cena', 'uB'); k1.createdAt = hace(2 * 1440); k1.updatedAt = hace(180); k1.editadoPor = 'uA';
  const k2 = gasto('k2', 'g1', 20, 'uA', { uA: 10, uB: 10 }, 'Taxi', 'uA'); k2.createdAt = hace(4 * 1440); k2.updatedAt = hace(4 * 1440 - 0.2); k2.editadoPor = 'uA'; k2.categoria = 'Restaurantes y bares';
  const k3 = gasto('k3', 'g1', 12, 'uA', { uA: 6, uB: 6 }, 'Pan', 'uA'); k3.createdAt = hace(5 * 1440); k3.updatedAt = hace(60); k3.editadoPor = 'uB';
  DB.comp.push(k1, k2, k3);
  const a = env('uA'); await sleep(250); const A = a.w.__APP__;
  A.S.tab = 'juntos'; A.render(); await sleep(30);
  const act = Array.from(a.doc.querySelectorAll('.jv-act .jv-a')).map((b) => b.textContent.replace(/\s+/g, ' '));
  ok(act.some((t) => /Cambiaste «Cena»/.test(t) && /hace 3 h/.test(t)), 'Actividad: «Cambiaste «Cena»» con la hora del cambio [' + act.join(' | ') + ']');
  ok(act.some((t) => /Apuntaste «Taxi»/.test(t)), 'Actividad: lo no cambiado sigue diciendo «Apuntaste»');
  ok(act.some((t) => /Bea cambió «Pan»/.test(t)), 'Actividad: «Bea cambió «Pan»»');
  A.H.openMovForm(['c:k1']); await sleep(40);
  const au1 = (a.doc.querySelector('#sheetHost .comp-autor') || {}).textContent || '';
  ok(/^Apuntado por Bea hace 2 días · cambiado por ti hace 3 h$/.test(au1.trim()), 'pie del gasto: «Apuntado por Bea hace 2 días · cambiado por ti hace 3 h» [' + au1 + ']');
  A.H.closeSheet([]); await sleep(260);
  A.H.openMovForm(['c:k2']); await sleep(40);
  const au2 = (a.doc.querySelector('#sheetHost .comp-autor') || {}).textContent || '';
  ok(/^Lo apuntaste tú hace 4 días$/.test(au2.trim()), 'sin cambios: solo «Lo apuntaste tú hace 4 días» [' + au2 + ']');
  A.H.closeSheet([]); await sleep(260);
  A.H.openMovForm(['c:k3']); await sleep(40);
  const au3 = (a.doc.querySelector('#sheetHost .comp-autor') || {}).textContent || '';
  ok(/cambiado por Bea hace 1 h/.test(au3), 'cambiado por otra persona: «cambiado por Bea hace 1 h» [' + au3 + ']');
  A.H.closeSheet([]); await sleep(260);
  // Guardar sin tocar nada no debe llamar a «editar» (si no, todo el grupo vería «cambió»)
  let ed = 0; const edOrig = A.S.db.compartidos.editar; A.S.db.compartidos.editar = async (id, d) => { ed++; const pv = DB.comp.find((x) => x.id === id); return Object.assign({}, DB.comp.find((x) => x.id === id), d); };
  A.H.openMovForm(['c:k2']); await sleep(40); await A.H.saveMov([]); await sleep(60);
  ok(ed === 0, 'guardar sin cambios no toca la base de datos (editar llamado ' + ed + ' veces)');
  A.H.openMovForm(['c:k2']); await sleep(40); a.doc.querySelector('#fDesc').value = 'Taxi aeropuerto'; await A.H.saveMov([]); await sleep(60);
  ok(ed === 1, 'con un cambio de verdad sí se guarda (editar llamado ' + ed + ' veces)');
  A.S.db.compartidos.editar = edOrig;
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

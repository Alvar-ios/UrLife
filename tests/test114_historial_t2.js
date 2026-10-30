// docs/27 tanda 2: Recuperar y aviso en Inicio: «Apuntado por… · cambiado por…» al pie del gasto compartido y «X cambió» en Actividad. Datos inventados.
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
const toastTxt = (e) => (e.doc.querySelector('#toast') || {}).textContent || '';
const hace = (min) => new Date(Date.now() - min * 60000).toISOString();
(async () => {
  DB = nuevoDB();
  const k1 = gasto('k1', 'g1', 36, 'uB', { uA: 18, uB: 18 }, 'Cena', 'uB'); k1.createdAt = hace(2 * 1440);
  const k9 = gasto('k9', 'g1', 48, 'uA', { uA: 24, uB: 24 }, 'Taxi', 'uA'); k9.createdAt = hace(3 * 1440); k9.borrado = true;
  DB.comp.push(k1, k9);
  const fila = (o) => Object.assign({ grupo_id: 'g1', hecho_por_nombre: 'Bea', antes: null, despues: null, tipo: 'Gasto', borrado: null, puede_recuperar: false, nombres: { uA: 'Ana', uB: 'Bea' } }, o);
  let H0 = [
    fila({ id: 9, compartido_id: 'k1', accion: 'editado', hecho_por: 'uB', hecho_en: hace(30), antes: { importe: 30, reparto: { uA: 15, uB: 15 } }, despues: { importe: 36, reparto: { uA: 18, uB: 18 } }, descripcion: 'Cena', importe: 36, pagado_por: 'uB', reparto: { uA: 18, uB: 18 } }),
    fila({ id: 8, compartido_id: 'k9', accion: 'borrado', hecho_por: 'uB', hecho_en: hace(40), descripcion: 'Taxi', importe: 48, pagado_por: 'uA', reparto: { uA: 24, uB: 24 }, borrado: hace(40), puede_recuperar: true }),
    fila({ id: 7, compartido_id: 'k1', accion: 'editado', hecho_por: 'uA', hecho_por_nombre: 'Ana', hecho_en: hace(50), antes: { descripcion: 'Cen' }, despues: { descripcion: 'Cena' }, descripcion: 'Cena', importe: 36, pagado_por: 'uB', reparto: { uA: 18, uB: 18 } }),
  ];
  const a = env('uA'); await sleep(250); const A = a.w.__APP__;
  let rec = 0, fallo = '';
  A.S.db.rpc = async (fn, p) => {
    if (fn === 'historial_grupo') return JSON.parse(JSON.stringify(H0.filter((f) => !p.p_grupo || f.grupo_id === p.p_grupo)));
    if (fn === 'recuperar_compartido') { if (fallo) throw new Error(fallo); rec++; const c = DB.comp.find((x) => x.id === p.p_id); c.borrado = false; H0 = H0.map((f) => (f.compartido_id === p.p_id ? Object.assign({}, f, { borrado: null }) : f)); H0.unshift(fila({ id: 10, compartido_id: p.p_id, accion: 'recuperado', hecho_por: 'uA', hecho_por_nombre: 'Ana', hecho_en: new Date().toISOString(), descripcion: 'Taxi', importe: 48, pagado_por: 'uA', reparto: { uA: 24, uB: 24 } })); setTimeout(notifyComp, 5); return null; }
    throw new Error('?' + fn);
  };
  A.S.hist = {};
  // Inicio: avisa del borrado y del cambio de Bea que te tocan (no del tuyo, ni de lo que no mueve tu saldo)
  A.S.tab = 'inicio'; A.render(); await sleep(120);
  const ini = appTxt(a);
  ok(/Bea cambió «Cena»/.test(ini) && /a tu saldo −3,00 €/.test(ini) && /Y 1 cambio más/.test(ini), 'Inicio: «Bea cambió «Cena»» · Y 1 cambio más [' + (ini.match(/Bea[^€]*€[^·]*·?[^·]*/) || [''])[0] + ']');
  ok(!/Cambiaste/.test(ini), 'Inicio no avisa de lo que cambiaste tú');
  // abrir el historial desde Inicio marca lo visto y el aviso desaparece
  A.H.histVer(['g1']); await sleep(80);
  const t = sh(a);
  ok(/Recuperar/.test(t) && /Todo el grupo verá que lo has recuperado tú/.test(t), 'en el historial: «Recuperar» en lo borrado y la nota de que todo el grupo lo verá');
  ok(a.doc.querySelectorAll('.hist-rec').length === 1, 'un solo botón «Recuperar» (solo en lo borrado que puedes recuperar)');
  fallo = 'plazo_pasado'; await A.H.histRecuperar(['g1', 8]); await sleep(40);
  ok(rec === 0 && /más de 6 meses/.test(toastTxt(a)), 'si ha pasado el plazo: aviso claro');
  fallo = ''; await A.H.histRecuperar(['g1', 8]); await sleep(80);
  ok(rec === 1 && !DB.comp.find((c) => c.id === 'k9').borrado, 'Recuperar llama a recuperar_compartido y el gasto vuelve');
  ok(/Has recuperado «Taxi»/.test(toastTxt(a)) && !!a.doc.querySelector('#toast .toast-btn'), 'aviso «Has recuperado «Taxi»» con «Deshacer»');
  ok(/Recuperaste «Taxi»/.test(sh(a)) && !a.doc.querySelector('.hist-rec'), 'la lista se recarga: «Recuperaste «Taxi»» y ya no hay botón');
  a.doc.querySelector('#toast .toast-btn').click(); await sleep(80);
  ok(!!DB.comp.find((c) => c.id === 'k9').borrado, '«Deshacer» lo vuelve a borrar');
  A.H.closeSheet([]); await sleep(260);
  A.S.hist = {}; A.S.tab = 'inicio'; A.render(); await sleep(120);
  ok(!/Bea cambió «Cena»/.test(appTxt(a)), 'tras ver el historial del grupo, el aviso de Inicio desaparece');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

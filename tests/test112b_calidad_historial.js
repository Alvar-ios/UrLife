// Calidad docs/27 tanda 0: casos límite del historial (editadoPor vacío, liquidaciones, sin cuenta, alias, quien se fue, Juntos antes). Datos inventados.
// «Apuntado por… · cambiado por…» al pie del gasto compartido y «X cambió» en Actividad. Datos inventados.
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
  const ver = (c) => !c.borrado && (activo(c.grupoId, uid) || Object.keys(c.reparto || {}).concat([c.pagadoPor]).indexOf(uid) >= 0);
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
  const e = makeEnv({ version: { juntos: opts.juntos || 0 }, cfg: { app: cfgApp, meta: { onboarded: true } }, session: { user: { email: uid + '@ejemplo.com', id: uid } }, pre: (w) => {
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

const actTxt = (e) => Array.from(e.doc.querySelectorAll('.jv-act .jv-a')).map((b) => b.textContent.replace(/\s+/g, ' '));
async function pie(e, id) { const A = e.w.__APP__; A.H.openMovForm(['c:' + id]); await sleep(40); const t = ((e.doc.querySelector('#sheetHost .comp-autor') || {}).textContent || '').trim(); const todo = sh(e); A.H.closeSheet([]); await sleep(260); return { t, todo }; }
async function juntos(e) { const A = e.w.__APP__; A.S.tab = 'juntos'; A.render(); await sleep(30); return actTxt(e); }
(async () => {
  // 1) editadoPor vacío (23 de 33 en la base real) aunque updatedAt sea posterior: NO debe decir «cambió»
  DB = nuevoDB();
  const v1 = gasto('v1', 'g1', 30, 'uB', { uA: 15, uB: 15 }, 'Súper', 'uB'); v1.createdAt = hace(3 * 1440); v1.updatedAt = hace(10); v1.editadoPor = null;
  const v2 = gasto('v2', 'g1', 8, 'uA', { uA: 4, uB: 4 }, 'Café', 'uA'); v2.createdAt = hace(2 * 1440); v2.updatedAt = 'basura'; v2.editadoPor = 'uB';
  DB.comp.push(v1, v2);
  let a = env('uA'); await sleep(250);
  let act = await juntos(a);
  ok(act.some((t) => /Bea apuntó «Súper»/.test(t)) && !act.some((t) => /cambi/i.test(t)), 'editadoPor vacío o fecha rara: sigue «apuntó», sin «cambió» [' + act.join(' | ') + ']');
  let p = await pie(a, 'v1');
  ok(/^Apuntado por Bea hace 3 días$/.test(p.t), 'pie con editadoPor vacío: solo «Apuntado por Bea hace 3 días» [' + p.t + ']');
  p = await pie(a, 'v2');
  ok(/^Lo apuntaste tú hace 2 días$/.test(p.t), 'pie con updatedAt no válido: no dice «cambiado» [' + p.t + ']');

  // 2) Liquidación con editadoPor: ni en Actividad ni en su hoja debe decir «cambió»
  DB = nuevoDB();
  const l1 = { id: 'l1', grupoId: 'g1', fecha: HOY, tipo: 'Liquidación', categoria: 'Liquidación', descripcion: '', importe: 10, pagadoPor: 'uB', reparto: { uA: 10 }, modo: 'importe', creadoPor: 'uB', createdAt: hace(1440 * 2), updatedAt: hace(30), editadoPor: 'uB' };
  DB.comp.push(l1);
  a = env('uA'); await sleep(250);
  act = await juntos(a);
  ok(act.some((t) => /Bea te pagó/.test(t)) && !act.some((t) => /cambi/i.test(t)), 'Actividad: la liquidación dice «Bea te pagó», sin «cambió» [' + act.join(' | ') + ']');
  p = await pie(a, 'l1');
  ok(/Pago para saldar cuentas/.test(p.todo) && !/cambiado/i.test(p.t), 'hoja de la liquidación: sin «cambiado por» [' + p.t + ']');

  // 3) persona sin cuenta (pagó Carla, sin cuenta) y alias (Ana ocupó el sitio de «Ana vieja»)
  DB = nuevoDB();
  DB.sc.push({ grupo_id: 'g1', id: '00000000-0000-4000-8000-0000000000c1', nombre: 'Carla', creado_por: 'uB', created_at: '2026-10-03' },
    { grupo_id: 'g1', id: '00000000-0000-4000-8000-0000000000a9', nombre: 'Anita', creado_por: 'uB', created_at: '2026-10-03', reclamado_por: 'uA' });
  const SC = '00000000-0000-4000-8000-0000000000c1', AL = '00000000-0000-4000-8000-0000000000a9';
  const s1 = gasto('s1', 'g1', 30, SC, { uA: 10, uB: 10, [SC]: 10 }, 'Bolos', 'uB'); s1.createdAt = hace(3 * 1440); s1.updatedAt = hace(120); s1.editadoPor = 'uB';
  const s2 = gasto('s2', 'g1', 20, AL, { [AL]: 10, uB: 10 }, 'Pizza', 'uB'); s2.createdAt = hace(2 * 1440); s2.updatedAt = hace(90); s2.editadoPor = 'uA';
  DB.comp.push(s1, s2);
  a = env('uA'); await sleep(250);
  act = await juntos(a);
  ok(act.some((t) => /Bea cambió «Bolos»/.test(t)), 'sin cuenta: lo cambió Bea → «Bea cambió «Bolos»» [' + act.join(' | ') + ']');
  ok(act.some((t) => /Cambiaste «Pizza»/.test(t)), 'alias: lo cambió Ana → «Cambiaste «Pizza»»');
  ok(!act.some((t) => /Alguien/.test(t)), 'nadie sale como «Alguien»');
  p = await pie(a, 's1');
  ok(/^Apuntado por Bea hace 3 días · cambiado por Bea hace 2 h$/.test(p.t), 'pie sin cuenta [' + p.t + ']');

  // 4) quien cambió ya no está en el grupo (baja) y gasto de un grupo del que salí
  DB = nuevoDB();
  DB.miembros.push({ grupo_id: 'g1', user_id: 'uC', nombre: 'Cris', rol: 'miembro', created_at: '2026-10-02', baja: '2026-10-20' });
  DB.grupos.push({ id: 'g3', nombre: 'Viaje', tipo: 'grupo', reparto: null, edicion: 'todos', created_at: '2026-10-01' });
  DB.miembros.push({ grupo_id: 'g3', user_id: 'uA', nombre: 'Ana', rol: 'miembro', created_at: '2026-10-01', baja: '2026-10-25' }, { grupo_id: 'g3', user_id: 'uB', nombre: 'Bea', rol: 'admin', created_at: '2026-10-01' });
  const b1 = gasto('b1', 'g1', 9, 'uA', { uA: 3, uB: 3, uC: 3 }, 'Vino', 'uA'); b1.createdAt = hace(4 * 1440); b1.updatedAt = hace(3 * 1440); b1.editadoPor = 'uC';
  const b2 = gasto('b2', 'g3', 40, 'uB', { uA: 20, uB: 20 }, 'Gasolina', 'uB'); b2.createdAt = hace(6 * 1440); b2.updatedAt = hace(5 * 1440); b2.editadoPor = 'uB';
  DB.comp.push(b1, b2);
  a = env('uA'); await sleep(250);
  act = await juntos(a);
  ok(act.some((t) => /Cris cambió «Vino»/.test(t)), 'quien se fue del grupo sigue con su nombre: «Cris cambió «Vino»» [' + act.join(' | ') + ']');
  p = await pie(a, 'b2');
  ok(/Ya no estás en este grupo/.test(p.todo) && /^Apuntado por Bea hace 6 días · cambiado por Bea hace 5 días$/.test(p.t), 'grupo del que saliste: pie en la hoja de información [' + p.t + ']');

  // 5) nombres con caracteres raros: se escapan
  DB = nuevoDB(); DB.miembros[1].nombre = '<b>Bea</b>'; DB.miembros[3].nombre = '<b>Bea</b>';
  const x1 = gasto('x1', 'g1', 6, 'uB', { uA: 3, uB: 3 }, 'Pan', 'uB'); x1.createdAt = hace(2 * 1440); x1.updatedAt = hace(60); x1.editadoPor = 'uB';
  DB.comp.push(x1);
  a = env('uA'); await sleep(250); await juntos(a);
  ok(!a.doc.querySelector('.jv-act b b') && /&lt;b&gt;Bea/.test(a.doc.querySelector('.jv-act').innerHTML), 'Actividad: el nombre se escapa');
  a.w.__APP__.H.openMovForm(['c:x1']); await sleep(40);
  ok(!a.doc.querySelector('#sheetHost .comp-autor b'), 'pie: el nombre se escapa');

  // 6) versión anterior de Juntos (juntos:1): no cambia nada
  DB = nuevoDB();
  const o1 = gasto('o1', 'g1', 36, 'uB', { uA: 18, uB: 18 }, 'Cena', 'uB'); o1.createdAt = hace(2 * 1440); o1.updatedAt = hace(180); o1.editadoPor = 'uA';
  DB.comp.push(o1);
  a = env('uA', { juntos: 1 }); await sleep(250);
  const A = a.w.__APP__; A.S.tab = 'juntos'; A.render(); await sleep(30);
  ok(!/cambi(aste|ó)/i.test(appTxt(a)) && !a.doc.querySelector('#app .comp-autor'), 'Juntos «Antes»: sin «cambió» ni pie en la pestaña');

  // 7) usuario sin grupos ni gastos: Juntos y + no fallan
  DB = nuevoDB(); DB.miembros = []; DB.grupos = [];
  a = env('uA'); await sleep(250); await juntos(a);
  ok(!a.doc.querySelector('.comp-autor') && !a.doc.querySelector('.jv-act'), 'sin datos: no sale ni Actividad ni pie');
  a.w.__APP__.H.openMovForm([null]); await sleep(40);
  ok(!a.doc.querySelector('#sheetHost .comp-autor'), 'gasto nuevo: sin pie de autor');

  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

// docs/27 tanda 1: pantalla Historial (solo ver): «Apuntado por… · cambiado por…» al pie del gasto compartido y «X cambió» en Actividad. Datos inventados.
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
  const k1 = gasto('k1', 'g1', 36, 'uB', { uA: 18, uB: 18 }, 'Cena', 'uB'); k1.createdAt = hace(2 * 1440);
  DB.comp.push(k1);
  const H0 = [
    { id: 9, grupo_id: 'g1', compartido_id: 'k1', accion: 'editado', hecho_por: 'uB', hecho_por_nombre: 'Bea', hecho_en: hace(30), antes: { importe: 30, reparto: { uA: 15, uB: 15 } }, despues: { importe: 36, reparto: { uA: 18, uB: 18 } }, descripcion: 'Cena', tipo: 'Gasto', importe: 36, pagado_por: 'uB', reparto: { uA: 18, uB: 18 }, borrado: null, nombres: { uA: 'Ana', uB: 'Bea' } },
    { id: 8, grupo_id: 'g1', compartido_id: 'k9', accion: 'borrado', hecho_por: 'uB', hecho_por_nombre: 'Bea', hecho_en: hace(40), antes: null, despues: null, descripcion: 'Taxi', tipo: 'Gasto', importe: 48, pagado_por: 'uA', reparto: { uA: 24, uB: 24 }, borrado: hace(40), nombres: { uA: 'Ana', uB: 'Bea' } },
    { id: 7, grupo_id: 'g1', compartido_id: 'k8', accion: 'editado', hecho_por: 'uA', hecho_por_nombre: 'Ana', hecho_en: hace(1500), antes: { descripcion: 'Hotel' }, despues: { descripcion: 'Hotel Lisboa' }, descripcion: 'Hotel Lisboa', tipo: 'Gasto', importe: 100, pagado_por: 'uA', reparto: { uA: 50, uB: 50 }, borrado: null, nombres: { uA: 'Ana', uB: 'Bea' } },
    { id: 6, grupo_id: 'g1', compartido_id: 'k1', accion: 'creado', hecho_por: 'uB', hecho_por_nombre: 'Bea', hecho_en: hace(2 * 1440), antes: null, despues: { importe: 30, pagado_por: 'uB', reparto: { uA: 15, uB: 15 }, descripcion: 'Cena' }, descripcion: 'Cena', tipo: 'Gasto', importe: 36, pagado_por: 'uB', reparto: { uA: 18, uB: 18 }, borrado: null, nombres: { uA: 'Ana', uB: 'Bea' } },
  ];
  const a = env('uA'); await sleep(250); const A = a.w.__APP__;
  let llamadas = []; let falla = false;
  A.S.db.rpc = async (fn, p) => { llamadas.push([fn, p]); if (falla) throw new Error('sin red'); if (fn === 'historial_grupo') return JSON.parse(JSON.stringify(H0)); throw new Error('?' + fn); };
  A.S.tab = 'juntos'; A.render(); await sleep(20);
  A.H.grupoVer(['g1']); await sleep(60);
  ok(!!a.doc.querySelector('#histEnlace') && /Historial/.test(sh(a)), 'en el grupo sale «Historial» junto a «¿De dónde sale?»');
  ok(llamadas.some((l) => l[0] === 'historial_grupo' && l[1].p_grupo === 'g1'), 'al abrir el grupo se pide el historial de ese grupo');
  ok(!/nuevo/.test(a.doc.querySelector('#histEnlace').textContent), 'la primera vez no dice «N nuevos»');
  A.H.histVer(['g1']); await sleep(60);
  const t = sh(a);
  ok(/Bea cambió «Cena»/.test(t) && /30,00 €\s*→\s*36,00 €/.test(t), 'fila de cambio: «Bea cambió «Cena»» con 30,00 € → 36,00 € [' + t.slice(0, 400) + ']');
  ok(/\+1 cosa más/.test(t), 'dice que cambió una cosa más (el reparto)');
  ok(/Bea borró «Taxi»/.test(t) && /pagaste tú/.test(t), 'fila de borrado: «Bea borró «Taxi»» · pagaste tú');
  ok(/Cambiaste «Hotel Lisboa»/.test(t) && /Nombre:\s*Hotel\s*→\s*Hotel Lisboa/.test(t) && /sin cambio/.test(t), 'cambio de nombre tuyo: «Cambiaste…», «Nombre: Hotel → Hotel Lisboa» y «sin cambio» en tu saldo');
  ok(/Bea apuntó «Cena»/.test(t), 'fila «Bea apuntó «Cena»»');
  ok(/Hoy/.test(t) && /Ayer/.test(t), 'agrupado por días (Hoy, Ayer…)');
  ok(/Se guarda 6 meses/.test(t), 'pie «Se guarda 6 meses»');
  // efecto en tu saldo: Bea subió la cena de 30 a 36 y tu parte de 15 a 18 → −3,00 €; borrar el taxi que pagaste tú → −24,00 €
  const vals = Array.from(a.doc.querySelectorAll('.hist-f .hist-v b')).map((b) => b.textContent);
  ok(vals[0] === '−3,00 €' && vals[1] === '−24,00 €', 'efecto en tu saldo: −3,00 € y −24,00 € [' + vals.join(', ') + ']');
  const visto = (A.cfg().historialVisto || {}).g1;
  ok(visto === H0[0].hecho_en, 'al abrirlo se guarda hasta dónde lo has visto (hora del servidor)');
  A.H.histTipo(['borrados']); await sleep(20);
  ok(/borró «Taxi»/.test(sh(a)) && !/cambió «Cena»/.test(sh(a)), 'filtro «Borrados»');
  A.H.histTipo(['todo']); A.H.histPersona(['uA']); await sleep(20);
  ok(/Cambiaste «Hotel Lisboa»/.test(sh(a)) && !/Bea cambió/.test(sh(a)), 'filtro por persona (Tú)');
  A.H.histPersona(['']); await sleep(20);
  A.H.histDetalle(['g1', 9]); await sleep(20);
  const d = sh(a);
  ok(/Importe\s*30,00 €\s*36,00 €/.test(d) && /Tu parte\s*15,00 €\s*18,00 €/.test(d) && /A tu saldo en el grupo\s*−3,00 €/.test(d), 'detalle: antes → ahora y «A tu saldo en el grupo −3,00 €» [' + d.slice(0, 300) + ']');
  ok(/Ver el gasto/.test(d), 'detalle con «Ver el gasto»');
  A.H.histVer(['g1']); await sleep(20);
  A.H.histDetalle(['g1', 8]); await sleep(20);
  ok(!/Ver el gasto/.test(sh(a)) && /Sigue borrado/.test(sh(a)), 'detalle de un borrado: sin «Ver el gasto» y «Sigue borrado»');
  // nuevos: llega un cambio de Bea después de lo visto
  H0.unshift(Object.assign({}, H0[0], { id: 10, hecho_en: new Date(Date.now() + 1000).toISOString() }));
  A.H.closeSheet([]); await sleep(260);
  A.S.hist = {}; A.H.grupoVer(['g1']); await sleep(80);
  ok(/1 nuevo/.test((a.doc.querySelector('#histEnlace') || {}).textContent || ''), '«Historial · 1 nuevo» cuando otra persona cambia algo después');
  // fallo de red
  A.H.closeSheet([]); await sleep(260); A.S.hist = {}; falla = true;
  A.H.histVer(['g1']); await sleep(60);
  ok(/No se ha podido cargar el historial/.test(sh(a)) && /Reintentar/.test(sh(a)), 'sin conexión: aviso y «Reintentar»');
  falla = false; A.H.histReintentar(['g1']); await sleep(60);
  ok(/Bea cambió «Cena»/.test(sh(a)), 'al reintentar carga');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

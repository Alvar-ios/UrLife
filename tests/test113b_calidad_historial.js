// Calidad (30/10/2026): historial del grupo, tanda 1 — casos límite del efecto en tu saldo, fallos de red y escapado. Datos inventados.
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
const NOM = { uA: 'Ana', uB: 'Bea', i1: 'Carlos' };
const fila = (o) => Object.assign({ grupo_id: 'g1', hecho_por_nombre: null, antes: null, despues: null, tipo: 'Gasto', borrado: null, puede_recuperar: false, nombres: NOM }, o);
const efectos = (e) => Array.from(e.doc.querySelectorAll('.hist-f')).map((b) => [b.querySelector('.hist-x b').textContent, (b.querySelector('.hist-v b') || b.querySelector('.hist-v span') || {}).textContent || '']);
(async () => {
  DB = nuevoDB();
  DB.sc.push({ id: 'i1', grupo_id: 'g1', nombre: 'Carlos', creado_por: 'uA', created_at: '2026-10-01' });
  const a = env('uA'); await sleep(250); const A = a.w.__APP__;
  let H = []; let modo = 'ok';
  A.S.db.rpc = async (fn) => { if (modo === 'error') throw new Error('no_autorizado'); if (modo === 'cuelga') return new Promise(() => {}); if (fn === 'historial_grupo') return JSON.parse(JSON.stringify(H)); throw new Error('?' + fn); };
  A.S.tab = 'juntos'; A.render(); await sleep(20);
  const abrirHist = async () => { A.S.hist = {}; A.H.histVer(['g1']); await sleep(60); };

  // 0) sin gastos compartidos: ni enlace ni llamada
  let llamadas = 0; const rpc0 = A.S.db.rpc; A.S.db.rpc = async (...x) => { llamadas++; return rpc0(...x); };
  A.H.grupoVer(['g1']); await sleep(60);
  ok(!a.doc.querySelector('#histEnlace') && llamadas === 0, 'grupo sin gastos: no sale «Historial» ni se pide nada');
  A.S.db.rpc = rpc0; A.H.closeSheet([]); await sleep(260);

  // 1) un cambio de quién pagó DESPUÉS de un cambio de importe: el efecto de cada fila debe sumar tu saldo de hoy
  DB.comp.push(gasto('k1', 'g1', 36, 'uA', { uA: 18, uB: 18 }, 'Cena', 'uB'));
  notifyComp(); await sleep(60);
  H = [
    fila({ id: 3, compartido_id: 'k1', accion: 'editado', hecho_por: 'uB', hecho_en: hace(10), antes: { pagado_por: 'uB' }, despues: { pagado_por: 'uA' }, descripcion: 'Cena', importe: 36, pagado_por: 'uA', reparto: { uA: 18, uB: 18 } }),
    fila({ id: 2, compartido_id: 'k1', accion: 'editado', hecho_por: 'uB', hecho_en: hace(20), antes: { importe: 30, reparto: { uA: 15, uB: 15 } }, despues: { importe: 36, reparto: { uA: 18, uB: 18 } }, descripcion: 'Cena', importe: 36, pagado_por: 'uA', reparto: { uA: 18, uB: 18 } }),
    fila({ id: 1, compartido_id: 'k1', accion: 'creado', hecho_por: 'uB', hecho_en: hace(30), despues: { importe: 30, pagado_por: 'uB', reparto: { uA: 15, uB: 15 }, descripcion: 'Cena' }, descripcion: 'Cena', importe: 36, pagado_por: 'uA', reparto: { uA: 18, uB: 18 } }),
  ];
  await abrirHist();
  let ef = efectos(a);
  ok(ef.length === 3, 'salen las 3 filas [' + JSON.stringify(ef) + ']');
  // real: apuntó −15 (pagó Bea), subió a 36 −3 (seguía pagando Bea), pasó a pagar Ana +36 → total +18 = saldo de hoy
  ok(ef[1] && ef[1][1] === '−3,00 €', 'subir de 30 a 36 cuando pagaba Bea te cuesta −3,00 € (no se usa quien paga HOY) [' + (ef[1] || [])[1] + ']');
  ok(Math.abs(A.miSaldo('g1') - 18) < 0.01, 'tu saldo hoy en el grupo es +18,00 €');

  // 2) un pago (liquidación) al que se cambia el importe sí mueve tu saldo
  H = [fila({ id: 5, compartido_id: 'k5', accion: 'editado', hecho_por: 'uA', hecho_en: hace(5), tipo: 'Liquidación', antes: { importe: 20, reparto: { uB: 20 } }, despues: { importe: 25, reparto: { uB: 25 } }, descripcion: '', importe: 25, pagado_por: 'uA', reparto: { uB: 25 } })];
  await abrirHist(); ef = efectos(a);
  ok(ef[0] && ef[0][1] === '+5,00 €', 'cambiar un pago tuyo de 20 a 25 € mueve tu saldo +5,00 € [' + JSON.stringify(ef) + ']');

  // 3) persona sin cuenta y fila sin autor (parte C: hecho_por vacío, antes/después vacíos)
  H = [
    fila({ id: 7, compartido_id: 'k7', accion: 'borrado', hecho_por: null, hecho_en: hace(3000), descripcion: 'Entradas', importe: 60, pagado_por: 'i1', reparto: { uA: 30, i1: 30 }, borrado: hace(3000) }),
    fila({ id: 6, compartido_id: 'k6', accion: 'creado', hecho_por: 'uB', hecho_en: hace(2900), despues: { importe: 40, pagado_por: 'i1', reparto: { uA: 20, i1: 20 }, descripcion: 'Museo' }, descripcion: 'Museo', importe: 40, pagado_por: 'i1', reparto: { uA: 20, i1: 20 } }),
  ];
  await abrirHist(); ef = efectos(a); const t3 = sh(a);
  ok(/Alguien borró «Entradas»/.test(t3) && /pagó Carlos/.test(t3), 'fila sin autor: «Alguien borró…» y «pagó Carlos» (persona sin cuenta)');
  ok(ef.some((x) => /Alguien borró/.test(x[0]) && x[1] === '+30,00 €'), 'borrar un gasto que pagó Carlos con tu parte de 30 € te suma +30,00 €');
  ok(ef.some((x) => /apuntó «Museo»/.test(x[0]) && x[1] === '−20,00 €'), 'Bea apunta un gasto que pagó Carlos: −20,00 €');
  ok(!Array.from(a.doc.querySelectorAll('.hist-chips .chip')).some((c) => /Alguien/.test(c.textContent)), 'sin chip «Alguien» en el filtro de personas');

  // 4) alias: ocupaste el sitio de Carlos → lo de Carlos es tuyo
  DB.sc[0].reclamado_por = 'uA'; DB.sc[0].baja = null;
  A.H.closeSheet([]); await sleep(260); A.H.grupoVer(['g1']); await sleep(120); A.H.closeSheet([]); await sleep(260);
  H = [fila({ id: 8, compartido_id: 'k8', accion: 'creado', hecho_por: 'uB', hecho_en: hace(5), despues: { importe: 40, pagado_por: 'uB', reparto: { i1: 20, uB: 20 }, descripcion: 'Bus' }, descripcion: 'Bus', importe: 40, pagado_por: 'uB', reparto: { i1: 20, uB: 20 } })];
  await abrirHist(); ef = efectos(a);
  ok(ef[0] && ef[0][1] === '−20,00 €', 'con el sitio de Carlos ocupado por ti, su parte cuenta como tuya: −20,00 € [' + JSON.stringify(ef) + ']');

  // 5) escapado de nombres y descripciones
  H = [fila({ id: 9, compartido_id: 'k9', accion: 'creado', hecho_por: 'uX', hecho_por_nombre: '<img src=x onerror=alert(1)>', hecho_en: hace(5), nombres: { uX: '<img src=x onerror=alert(1)>' }, despues: { importe: 10, pagado_por: 'uX', reparto: { uX: 10 }, descripcion: '<b>hola</b>' }, descripcion: '<b>hola</b>', importe: 10, pagado_por: 'uX', reparto: { uX: 10 } })];
  await abrirHist();
  ok(!a.doc.querySelector('#sheetHost img') && /<b>hola<\/b>/.test(sh(a)), 'nombres y descripciones raros se enseñan como texto');
  A.H.histDetalle(['g1', 9]); await sleep(20);
  ok(!a.doc.querySelector('#sheetHost img') && !a.doc.querySelector('#sheetHost h2 b'), 'detalle también escapado');

  // 6) si la función falla, el grupo sigue funcionando
  A.H.closeSheet([]); await sleep(260); A.S.hist = {}; modo = 'error';
  A.H.grupoVer(['g1']); await sleep(80);
  ok(/Añadir gasto/.test(sh(a)) && !!a.doc.querySelector('#histEnlace'), 'si el historial falla, el grupo se abre igual');
  A.H.closeSheet([]); await sleep(260);

  // 7) si la función se queda colgada: el usuario puede salir y, más tarde, se vuelve a intentar
  A.S.hist = {}; modo = 'cuelga';
  A.H.histVer(['g1']); await sleep(60);
  ok(!/Aún no hay cambios/.test(sh(a)), 'mientras carga no dice «Aún no hay cambios guardados» [' + sh(a).slice(0, 160) + ']');
  ok(/Volver/.test(sh(a)), 'mientras carga hay «Volver»');
  modo = 'ok'; A.H.closeSheet([]); await sleep(260);
  A.S.hist.g1.t = 0; A.H.histVer(['g1']); await sleep(60);
  ok(a.doc.querySelectorAll('.hist-f').length > 0, 'tras colgarse una vez, al volver a abrir lo intenta otra vez');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

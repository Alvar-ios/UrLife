// Calidad · Juntos v2 (18/10/2026): casos raros de «Saldar todo», deshacer, doble toque, personas sin cuenta,
// alias (quien ocupó el sitio de una persona sin cuenta), grupo de una sola persona, compartir rápido y usuario nuevo.
// Servidor simulado como test55. Datos inventados.
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
  const e = makeEnv({ cfg: { app: cfgApp, meta: { onboarded: true } }, session: { user: { email: uid + '@ejemplo.com', id: uid } }, pre: (w) => {
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
const toastTxt = (e) => (e.doc.querySelector('#toast') || {}).textContent || '';
const liqs = () => DB.comp.filter((c) => c.tipo === 'Liquidación' && !c.borrado);
const gasto = (id, gid, imp, pag, rep, desc, por) => ({ id, grupoId: gid, fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: desc || '', importe: imp, pagadoPor: pag, reparto: rep, modo: 'importe', creadoPor: por || pag, createdAt: '2026-10-17T10:00:00Z' });

(async () => {
  /* 1. Deudas en los dos sentidos: Ana debe 5 a Bea a solas, Bea debe 40 a Ana en el piso → Bea le debe 35 a Ana */
  DB = nuevoDB();
  DB.comp.push(gasto('k1', 'g2', 10, 'uB', { uA: 5, uB: 5 }, 'Café'));
  DB.comp.push(gasto('k2', 'g1', 80, 'uA', { uA: 40, uB: 40 }, 'Súper'));
  const CU = [{ id: 'cu1', nombre: 'Banco 1', principal: true }, { id: 'cu2', nombre: 'Banco 2' }];
  let a = env('uA', { cuentas: CU }); await sleep(250); let A = a.w.__APP__;
  A.S.tab = 'juntos'; A.render(); await sleep(20);
  ok(/Te deben\s*35,00/.test(appTxt(a)) && /Debes\s*0,00/.test(appTxt(a)), 'dos sentidos: arriba «Te deben 35 €» y «Debes 0 €»');
  A.H.personaVer(['uB']); await sleep(20);
  ok(/Te debe\s*35,00/.test(sh(a)) && /A solas\s*−5,00/.test(sh(a)) && /Piso\s*\+40,00/.test(sh(a)), 'hoja de Bea: «Te debe 35» con −5 a solas y +40 en el piso');
  A.H.saldarTodo(['uB']); await sleep(20);
  A.H.saldarCuenta(['cu2']);
  // doble toque en «Ya me ha pagado»
  const p1 = A.H.saldarTodoGuardar([]), p2 = A.H.saldarTodoGuardar([]); await Promise.all([p1, p2]); await sleep(80);
  ok(liqs().length === 2, 'doble toque en «Ya me ha pagado»: solo 2 pagos, no 4 (hay ' + liqs().length + ')');
  ok(liqs().some((c) => c.grupoId === 'g2' && c.pagadoPor === 'uA' && c.reparto.uB === 5) && liqs().some((c) => c.grupoId === 'g1' && c.pagadoPor === 'uB' && c.reparto.uA === 40), 'pagos correctos: Ana paga 5 a solas y Bea paga 40 en el piso');
  ok(Math.abs(A.miSaldo('g1')) < 0.001 && Math.abs(A.miSaldo('g2')) < 0.001, 'Ana queda en paz en los dos');
  const cj = A.cfg().cuentaJuntos || {};
  ok(liqs().every((c) => cj[c.id] === 'cu2'), 'los dos pagos quedan apuntados a la cuenta elegida (Banco 2)');
  // «Deshacer» con un fallo a mitad: no debe decir «Pago deshecho» si uno no se pudo quitar
  const borrarOrig = A.S.db.compartidos.borrar; let n = 0;
  A.S.db.compartidos.borrar = async (id) => { if (++n === 2) throw new Error('sin conexión'); return borrarOrig(id); };
  a.doc.querySelector('#toast .toast-btn').click(); await sleep(150);
  A.S.db.compartidos.borrar = borrarOrig;
  ok(liqs().length === 1, 'deshacer con fallo a mitad: queda 1 pago (deshecho a medias)');
  ok(!/^.*Pago deshecho/.test(toastTxt(a)), 'deshacer a medias NO dice «Pago deshecho» [aviso: ' + toastTxt(a) + ']');
  // limpia el pago que quedó
  liqs().forEach((c) => { c.borrado = true; }); notifyComp(); await sleep(40);

  /* 2. Fallo al guardar a mitad: se apunta una parte, y al reintentar no se duplica */
  A.H.saldarTodo(['uB']); await sleep(20);
  const crearOrig = A.S.db.compartidos.crear; n = 0;
  A.S.db.compartidos.crear = async (o) => { if (++n === 2) throw new Error('sin conexión'); return crearOrig(o); };
  await A.H.saldarTodoGuardar([]); await sleep(60);
  A.S.db.compartidos.crear = crearOrig;
  ok(liqs().length === 1 && /Solo se ha apuntado una parte/.test(toastTxt(a)), 'fallo a mitad: 1 pago apuntado y aviso «Solo se ha apuntado una parte»');
  await A.H.saldarTodoGuardar([]); await sleep(80);
  ok(liqs().length === 2 && Math.abs(A.miSaldo('g1')) < 0.001 && Math.abs(A.miSaldo('g2')) < 0.001, 'al reintentar se apunta solo lo que faltaba (2 pagos en total, en paz)');
  A.H.closeSheet([]); await sleep(260);

  /* 3. Actividad: lo que apuntaste tú no dice «Tú apuntó» */
  A.render(); await sleep(20);
  const act = (a.doc.querySelector('.jv-act') || {}).textContent || '';
  ok(act.length > 0, 'hay sección de Actividad');
  ok(!/Tú apuntó/.test(act), 'Actividad sin «Tú apuntó …» (debería ser «Apuntaste …») [' + act.replace(/\s+/g, ' ').slice(0, 140) + ']');
  ok(!/pago de Tú/.test(act), 'Actividad sin «un pago de Tú»');

  /* 4. Persona sin cuenta: Carlos pagó una cena en el piso; Ana le debe y lo salda */
  DB = nuevoDB();
  DB.sc.push({ id: 'sCarlos', grupo_id: 'g1', nombre: 'Carlos', creado_por: 'uA', created_at: '2026-10-03', historial: true });
  DB.comp.push(gasto('k3', 'g1', 30, 'sCarlos', { uA: 10, uB: 10, sCarlos: 10 }, 'Cena', 'uA'));
  a = env('uA'); await sleep(250); A = a.w.__APP__;
  A.S.tab = 'juntos'; A.render(); await sleep(20);
  ok(/Carlos/.test(appTxt(a)) && /Debes\s*10,00/.test(appTxt(a)), 'sin cuenta: Ana ve que debe 10 € a Carlos');
  ok(/1 sin app/.test(appTxt(a)), 'el grupo indica «1 sin app»');
  A.H.saldarTodo(['sCarlos']); await sleep(20);
  await A.H.saldarTodoGuardar([]); await sleep(80);
  ok(liqs().length === 1 && liqs()[0].reparto.sCarlos === 10 && liqs()[0].pagadoPor === 'uA', 'saldar con una persona sin cuenta: pago de 10 € a Carlos aceptado por el servidor');
  ok(Math.abs(A.miSaldo('g1')) < 0.001, 'Ana queda en paz');
  // ahora Carlos (sin app) debe a Ana: Pedir por WhatsApp
  liqs().forEach((c) => { c.borrado = true; });
  DB.comp.push(gasto('k4', 'g1', 60, 'uA', { uA: 10, uB: 10, sCarlos: 40 }, 'Gasolina'));
  notifyComp(); await sleep(40); A.render(); await sleep(20);
  A.H.personaVer(['sCarlos']); await sleep(20);
  const wa = a.doc.querySelector('#sheetHost a.wa-btn');
  ok(/Te debe\s*20,00/.test(sh(a)) && wa && /wa\.me/.test(wa.href) && /Ya me ha pagado/.test(sh(a)), 'Carlos (sin app) le debe 20 a Ana: hoja con «Pedir por WhatsApp» y «Ya me ha pagado»');
  A.H.saldarTodo(['sCarlos']); await sleep(20); await A.H.saldarTodoGuardar([]); await sleep(80);
  ok(liqs().some((x) => x.pagadoPor === 'sCarlos' && x.reparto.uA === 20), '«Ya me ha pagado» de una persona sin cuenta: pago de Carlos a Ana (20 €)');
  liqs().forEach((x) => { x.borrado = true; }); notifyComp(); await sleep(40);
  A.H.closeSheet([]); await sleep(260);

  /* 5. Alias: Cora ocupó el sitio de Carlos. Lo antiguo de Carlos cuenta como de Cora, en una sola fila */
  DB.sc[0].reclamado_por = 'uC';
  DB.miembros.push({ grupo_id: 'g1', user_id: 'uC', nombre: 'Cora', rol: 'miembro', created_at: '2026-10-05' });
  DB.comp.push(gasto('k5', 'g1', 9, 'uC', { uA: 3, uB: 3, uC: 3 }, 'Pan'));
  const c = env('uC'); await sleep(250); const C = c.w.__APP__;
  C.S.tab = 'juntos'; C.render(); await sleep(20);
  // Cora (antes Carlos): pagó 30 y 9, le tocan 10+40+3 = 53 → −14
  ok(Math.abs(C.miSaldo('g1') + 14) < 0.001, 'alias: el saldo de Cora en el piso suma lo de Carlos (−14 €) [' + C.miSaldo('g1') + ']');
  ok(!/Carlos/.test(appTxt(c)), 'alias: Cora no se ve a sí misma como «Carlos» en la lista');
  a = env('uA'); await sleep(250); A = a.w.__APP__;
  A.S.tab = 'juntos'; A.render(); await sleep(20);
  const filasA = [...a.doc.querySelectorAll('.jv-p b')].map((x) => x.textContent);
  ok(!filasA.includes('Carlos'), 'alias: Ana no ve una fila aparte para «Carlos» [' + filasA.join(', ') + ']');
  ok(filasA.includes('Cora') && filasA.includes('Bea'), 'alias: Ana ve a Cora y a Bea');
  A.H.saldarTodo(['uC']); await sleep(20); await A.H.saldarTodoGuardar([]); await sleep(80);
  ok(liqs().some((x) => x.pagadoPor === 'uC' && x.reparto.uA > 0), 'alias: «Ya me ha pagado» con Cora apunta el pago a su nombre de ahora (no al de Carlos)');
  liqs().forEach((x) => { x.borrado = true; }); notifyComp(); await sleep(40);

  /* 6. Grupo con una sola persona (tú): texto y qué se ofrece */
  DB = nuevoDB();
  DB.grupos.push({ id: 'g3', nombre: 'Viaje', tipo: 'grupo', reparto: null, edicion: 'todos', created_at: '2026-10-10' });
  DB.miembros.push({ grupo_id: 'g3', user_id: 'uA', nombre: 'Ana', rol: 'admin', created_at: '2026-10-10' });
  a = env('uA'); await sleep(250); A = a.w.__APP__;
  A.S.tab = 'juntos'; A.render(); await sleep(20);
  await A.H.grupoVer(['g3']); await sleep(60);
  ok(!/1 personas/.test(sh(a)), 'grupo de una persona: no dice «1 personas» [' + sh(a).slice(0, 90) + ']');
  ok(/Invitar|invita/i.test(sh(a)), 'grupo de una persona: se ofrece invitar a alguien (sin ir a Ajustes)');
  // «Ajustes» y renombrar: se queda en Ajustes
  A.H.grupoAjustes(['g3']); await sleep(20);
  a.doc.querySelector('#gRenombrar').value = 'Viaje a la playa';
  await A.H.grupoRenombrar(['g3']); await sleep(80);
  ok(/Ajustes · Viaje a la playa/.test(sh(a)), 'tras renombrar sigue en «Ajustes» con el nombre nuevo');
  A.H.closeSheet([]); await sleep(260);

  /* 7. Compartir rápido sin elegir con quién (dos grupos, ninguno por defecto) */
  DB.miembros.push({ grupo_id: 'g3', user_id: 'uB', nombre: 'Bea', rol: 'miembro', created_at: '2026-10-11' });
  a = env('uA'); await sleep(250); A = a.w.__APP__;
  A.S.tab = 'juntos'; A.render(); await sleep(20);
  A.H.compRapido(['']); await sleep(30);
  const imp = a.doc.querySelector('#crImporte'); imp.value = '30'; imp.dispatchEvent(new a.w.Event('input', { bubbles: true })); await sleep(10);
  ok(A.form() && !A.form().comp.dest, 'sin destino por defecto cuando hay dos grupos');
  ok(!/te deben 30,00/.test(sh(a)), 'sin elegir con quién no dice «te deben 30 €» [' + ((a.doc.querySelector('#crRes') || {}).textContent || '') + ']');
  await A.H.crGuardar([]); await sleep(20);
  ok(/Elige con quién/.test(toastTxt(a)) && !DB.comp.length, 'al guardar sin destino avisa «Elige con quién…» y no guarda');
  // doble toque en Guardar
  A.H.crDest(['g:g1']); await sleep(10);
  const g1 = A.H.crGuardar([]), g2 = A.H.crGuardar([]); await Promise.all([g1, g2]); await sleep(80);
  ok(DB.comp.filter((x) => !x.borrado).length === 1, 'doble toque en Guardar: un solo gasto compartido (hay ' + DB.comp.length + ')');
  A.H.closeSheet([]); await sleep(260);

  /* 8. Usuario nuevo, sin grupos ni gastos */
  DB = nuevoDB();
  const z = env('uZ'); await sleep(250); const Z = z.w.__APP__;
  Z.S.tab = 'juntos'; Z.render(); await sleep(20);
  ok(/Comparte gastos con quien quieras/.test(appTxt(z)) && /Compartir un gasto/.test(appTxt(z)) && /Crear un grupo/.test(appTxt(z)), 'usuario nuevo: una tarjeta «Comparte gastos con quien quieras» con «Compartir un gasto» y «Crear un grupo»');
  ok(!/NaN|undefined/.test(appTxt(z)), 'usuario nuevo: sin «NaN» ni «undefined»');
  Z.H.compRapido(['']); await sleep(20);
  ok(/Invita/.test(sh(z)) && !/undefined/.test(sh(z)), 'usuario nuevo: «Compartir un gasto» le invita a invitar');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

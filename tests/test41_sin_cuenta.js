// Juntos (17/10/2026): personas sin cuenta en un grupo, ocupar su sitio con un enlace personal,
// administradores y «quién puede cambiar los gastos». Servidor simulado con las mismas reglas que la base de datos.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const HOY = new Date().toISOString().slice(0, 10);
const DB = {
  grupos: [{ id: 'g1', nombre: 'Viaje', tipo: 'grupo', reparto: null, edicion: 'todos', creado_por: 'uA', created_at: '2026-10-01' }],
  miembros: [{ grupo_id: 'g1', user_id: 'uA', nombre: 'Ana', rol: 'admin', created_at: '2026-10-01' }, { grupo_id: 'g1', user_id: 'uB', nombre: 'Bea', rol: 'miembro', created_at: '2026-10-02' }],
  sc: [], enl: [], comp: [], movs: { uA: {}, uB: {}, uC: {}, uD: {} },
};
let seq = 0; const LIST = []; const notifyComp = () => LIST.forEach((f) => f());
const err = (m) => { throw new Error(m); };
const activo = (g, u) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === u && !m.baja);
const esAdmin = (g, u) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === u && m.rol === 'admin' && !m.baja);
const esPart = (g, id, ins) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === id && (!m.baja || !ins)) ||
  DB.sc.some((i) => i.grupo_id === g && i.id === id && (!ins || (!i.baja && !i.reclamado_por)));
const ids = (g, u) => [u].concat(DB.sc.filter((i) => i.grupo_id === g && i.reclamado_por === u).map((i) => i.id));
const saldo = (g, u) => DB.comp.filter((c) => c.grupoId === g && !c.borrado).reduce((a, c) => a + (ids(g, u).includes(c.pagadoPor) ? c.importe : 0) - ids(g, u).reduce((s, k) => s + (c.reparto[k] || 0), 0), 0);
function validar(c, ins) {
  if (!esPart(c.grupoId, c.pagadoPor, ins)) err('pagador_no_valido');
  const ks = Object.keys(c.reparto || {}); let t = 0;
  ks.forEach((k) => { if (!esPart(c.grupoId, k, ins)) err('reparto_no_valido'); t += c.reparto[k]; });
  if (!ks.length || Math.abs(t - c.importe) > 0.01) err('reparto_no_cuadra');
}
const puedeEditar = (c, uid) => activo(c.grupoId, uid) && (DB.grupos.find((g) => g.id === c.grupoId).edicion !== 'autor' || c.creadoPor === uid || esAdmin(c.grupoId, uid));
function server(uid) {
  const ver = (c) => !c.borrado && activo(c.grupoId, uid);
  return {
    grupos: {
      listar: async () => ({ grupos: DB.grupos.filter((g) => activo(g.id, uid)).map((g) => Object.assign({}, g)), miembros: DB.miembros.filter((m) => activo(m.grupo_id, uid)).map((m) => Object.assign({}, m)),
        sinCuenta: DB.sc.filter((i) => activo(i.grupo_id, uid) || i.reclamado_por === uid).map((i) => Object.assign({}, i)) }),
      invitaciones: async () => [], renombrar: async () => [], miNombre: async () => [], reparto: async () => [{}],
      edicion: async (g, v) => { if (!esAdmin(g, uid)) err('no_autorizado'); DB.grupos.find((x) => x.id === g).edicion = v; return [{ id: g }]; },
    },
    compartidos: {
      suscribir: (next) => { const f = () => next(DB.comp.filter(ver).map((c) => JSON.parse(JSON.stringify(c)))); LIST.push(f); setTimeout(f, 0); return () => {}; },
      crear: async (o) => { if (!activo(o.grupoId, uid)) err('row-level security'); const c = Object.assign({ id: 'c' + (++seq), creadoPor: uid, createdAt: new Date(Date.now() + seq).toISOString() }, JSON.parse(JSON.stringify(o))); validar(c, true); DB.comp.push(c); setTimeout(notifyComp, 5); return JSON.parse(JSON.stringify(c)); },
      editar: async (id, o) => { const c = DB.comp.find((x) => x.id === id); if (!c || !puedeEditar(c, uid)) err('JSON object requested, multiple (or no) rows returned'); const n = Object.assign({}, c, JSON.parse(JSON.stringify(o)), { grupoId: c.grupoId }); validar(n, false); Object.assign(c, n); setTimeout(notifyComp, 5); return JSON.parse(JSON.stringify(c)); },
      borrar: async (id) => { const c = DB.comp.find((x) => x.id === id); if (!c || !puedeEditar(c, uid)) err('no_autorizado'); c.borrado = 'x'; setTimeout(notifyComp, 5); return [{ id }]; },
    },
    objetivos: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    aportes: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    rpc: async (fn, p) => {
      if (fn === 'crear_sin_cuenta') { if (!activo(p.p_grupo, uid)) err('no_autorizado'); const id = 's' + (++seq); DB.sc.push({ id, grupo_id: p.p_grupo, nombre: p.p_nombre.trim(), creado_por: uid, created_at: new Date().toISOString(), historial: true }); return id; }
      if (fn === 'enlace_sin_cuenta') { const i = DB.sc.find((x) => x.id === p.p_id); if (!i || !activo(i.grupo_id, uid)) err('no_autorizado'); const t = 'SOY' + (++seq) + 'abcdefghijklmnopq'; DB.enl.push({ token: t, invitado_id: i.id }); return t; }
      if (fn === 'ver_enlace_sin_cuenta') { const e = DB.enl.find((x) => x.token === p.p_token); if (!e) return { valida: false, motivo: 'no_valida' }; const i = DB.sc.find((x) => x.id === e.invitado_id), g = DB.grupos.find((x) => x.id === i.grupo_id);
        if (e.usado || i.reclamado_por) return { valida: false, motivo: 'usada' }; return { valida: true, grupo: g.id, nombre_grupo: g.nombre, nombre: i.nombre, gastos: DB.comp.filter((c) => c.grupoId === g.id && (c.pagadoPor === i.id || c.reparto[i.id] != null)).length }; }
      if (fn === 'reclamar_sin_cuenta') { const e = DB.enl.find((x) => x.token === p.p_token); if (!e || e.usado) err('invitacion_no_valida'); const i = DB.sc.find((x) => x.id === e.invitado_id);
        if (activo(i.grupo_id, uid)) err('ya_es_miembro'); DB.miembros.push({ grupo_id: i.grupo_id, user_id: uid, nombre: i.nombre, rol: 'miembro', created_at: '2026-10-17' }); i.reclamado_por = uid; i.historial = p.p_historial; e.usado = true; setTimeout(notifyComp, 5); return i.grupo_id; }
      if (fn === 'quitar_sin_cuenta') { const i = DB.sc.find((x) => x.id === p.p_id); if (!(esAdmin(i.grupo_id, uid) || i.creado_por === uid)) err('no_autorizado'); if (Math.abs(saldo(i.grupo_id, i.id)) > 0.01) err('saldo_pendiente'); i.baja = 'x'; return null; }
      if (fn === 'cambiar_rol') { if (!esAdmin(p.p_grupo, uid)) err('no_autorizado'); if (!p.p_admin && !DB.miembros.some((m) => m.grupo_id === p.p_grupo && m.rol === 'admin' && !m.baja && m.user_id !== p.p_user)) err('ultimo_admin'); DB.miembros.find((m) => m.grupo_id === p.p_grupo && m.user_id === p.p_user).rol = p.p_admin ? 'admin' : 'miembro'; return null; }
      err('?' + fn);
    },
  };
}
function env(uid, url) {
  const e = makeEnv({version:{juntos:1}, url: url || 'https://urlife-zeta.vercel.app/', cfg: { app: { categoriasGasto: [{ nombre: 'Restaurantes' }] }, meta: { onboarded: true } }, session: { user: { email: uid + '@ejemplo.com', id: uid } }, pre: (w) => {
    w.history.replaceState = () => {};
    const ls = {}; Object.defineProperty(w, 'localStorage', { value: { getItem: (k) => (ls[k] == null ? null : ls[k]), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, configurable: true });
    Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: async (t) => { w.__copiado = t; } }, configurable: true });
  } });
  const orig = e.w.Data, L = [], st = DB.movs[uid], notify = () => L.forEach((f) => f());
  const s = server(uid);
  e.w.Data = { doc: orig.doc, grupos: s.grupos, compartidos: s.compartidos, objetivos: s.objetivos, aportes: s.aportes, rpc: s.rpc, uid: () => uid,
    collection: (n) => (n !== 'movimientos' ? orig.collection(n) : ({ onSnapshot: (cb) => { const f = () => cb({ docs: Object.entries(st).map(([id, v]) => ({ id, data: () => JSON.parse(JSON.stringify(v)) })) }); L.push(f); setTimeout(f, 0); return () => {}; },
      add: async (d) => { const k = 'n' + (++seq); st[k] = d; notify(); return { id: k }; }, doc: (id) => { const k = id || 'n' + (++seq); return { id: k, set: async (d) => { st[k] = JSON.parse(JSON.stringify(d)); notify(); }, delete: async () => { delete st[k]; notify(); } }; } })) };
  return e;
}
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const toastTxt = (e) => (e.doc.querySelector('#toast') || {}).textContent || '';
const gastosMes = (X) => { const d = new Date(); return X.kpisMes(d.getFullYear(), d.getMonth() + 1).gastos; };
(async () => {
  const a = env('uA'), b = env('uB'); await sleep(200);
  const A = a.w.__APP__, B = b.w.__APP__;

  /* 1. Añadir a alguien sin la app */
  A.H.grupoVer(['g1']); await sleep(30);
  ok(/¿Alguien no tiene la app\?/.test(sh(a)), 'en el grupo se ofrece añadir a alguien sin la app');
  ok(/Miembros \(2\) <span class="badge-new ">NUEVO/.test(a.doc.querySelector('#sheetHost').innerHTML), 'Parche 7: «Miembros» lleva la etiqueta NUEVO');
  a.doc.querySelector('#gSinCuenta').value = 'Marta';
  click(a, 'sinCuentaAnadir', 'g1'); await sleep(40);
  const m = DB.sc[0];
  ok(m && m.nombre === 'Marta' && m.creado_por === 'uA', 'se guarda solo con su nombre');
  ok(A.cfg().badgesVistos && A.cfg().badgesVistos.sincuenta && !/Miembros \(\d\) <span class="badge-new/.test(a.doc.querySelector('#sheetHost').innerHTML), 'al añadir a alguien sin la app, la etiqueta desaparece');
  ok(/Marta/.test(sh(a)) && /sin cuenta/.test(sh(a)) && /Invitarle a la app/.test(sh(a)), 'sale en Miembros con la etiqueta «sin cuenta» y el botón para invitarle');
  const opciones = A.S.grupos.find((g) => g.id === 'g1').miembros.map((x) => x.nombre);
  ok(opciones.includes('Marta'), 'se puede elegir en los repartos como un miembro más');

  /* 2. Gastos con ella: pagó Ana una cena a medias y Marta un taxi */
  await A.S.db.compartidos.crear({ grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: '', importe: 100, pagadoPor: 'uA', reparto: { uA: 50, [m.id]: 50 }, modo: 'igual' });
  await A.S.db.compartidos.crear({ grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Taxi', descripcion: '', importe: 30, pagadoPor: m.id, reparto: { uA: 15, [m.id]: 15 }, modo: 'igual' });
  await sleep(60);
  ok(Math.abs(A.miSaldo('g1') - 35) < 0.001, 'Ana: le deben 35 €');
  const ds = A.deudasDe('g1');
  ok(ds.length === 1 && ds[0].de === m.id && ds[0].a === 'uA' && Math.abs(ds[0].importe - 35) < 0.001, 'Marta debe 35 € a Ana');
  ok(Math.abs(gastosMes(A) - 65) < 0.001, 'en los números de Ana cuenta su parte (50 + 15)');
  A.H.grupoVer(['g1']); await sleep(30);
  ok(/Marta te debe/.test(sh(a)), 'en las cuentas del grupo: «Marta te debe…»');

  /* 3. No se puede quitar con cuentas pendientes */
  const btnQ = a.doc.querySelector('[data-click^="sinCuentaQuitar"]'); btnQ.click(); await sleep(5); btnQ.click(); await sleep(40);
  ok(!DB.sc[0].baja && /cuentas pendientes/i.test(toastTxt(a)), 'quitarla con cuentas pendientes no se deja y lo explica');

  /* 4. Enlace personal y ocupar su sitio (eligiendo que sus gastos cuenten) */
  A.H.grupoVer(['g1']); await sleep(30);
  click(a, 'sinCuentaEnlace', 'g1', m.id); await sleep(40);
  const url = A.form().enlaceSC && A.form().enlaceSC.url;
  ok(/\?soy=/.test(url || '') && /Enviar por WhatsApp/.test(sh(a)), 'crea un enlace personal y lo ofrece por WhatsApp');
  const c = env('uC', url); await sleep(300);
  const C = c.w.__APP__;
  ok(/Te han guardado un sitio/.test(sh(c)) && /Entrarás como Marta/.test(sh(c)) && /2 gastos/.test(sh(c)), 'al abrir el enlace: «Entrarás como Marta», con sus 2 gastos');
  ok(/¿Esos gastos cuentan también en tus números\?/.test(sh(c)), 'pregunta si sus gastos de antes cuentan en sus números personales');
  click(c, 'reclamarConfirmar'); await sleep(120);
  ok(DB.sc[0].reclamado_por === 'uC' && DB.sc[0].historial === true && DB.miembros.some((x) => x.user_id === 'uC' && x.nombre === 'Marta'), 'ocupa el sitio: entra como Marta');
  ok(Math.abs(C.miSaldo('g1') + 35) < 0.001, 'en Juntos, la deuda de antes es suya (debe 35 €)');
  ok(Math.abs(gastosMes(C) - 65) < 0.001, 'y como dijo que sí, su parte (50 + 15) cuenta en sus números');
  await A.H.grupoVer(['g1']); await sleep(80);
  ok(A.deudasDe('g1').some((d) => d.de === 'uC' && Math.abs(d.importe - 35) < 0.001) && /Marta te debe/.test(sh(a)), 'Ana ve ahora que Marta (ya con cuenta) le debe 35 €');

  /* 5. Otra persona sin cuenta que, al registrarse, prefiere que no cuente en sus números */
  await A.S.db.rpc('crear_sin_cuenta', { p_grupo: 'g1', p_nombre: 'Luis' }); const l = DB.sc[1];
  await A.S.db.compartidos.crear({ grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: '', importe: 20, pagadoPor: 'uA', reparto: { uA: 10, [l.id]: 10 }, modo: 'igual' });
  const t2 = await A.S.db.rpc('enlace_sin_cuenta', { p_id: l.id });
  const d = env('uD', 'https://urlife-zeta.vercel.app/?soy=' + t2); await sleep(300);
  const D = d.w.__APP__;
  click(d, 'reclamarHistorial', '0'); await sleep(10);
  click(d, 'reclamarConfirmar'); await sleep(120);
  ok(DB.sc[1].historial === false && Math.abs(gastosMes(D)) < 0.001 && Math.abs(D.miSaldo('g1') + 10) < 0.001, 'si dice que no: en Juntos debe sus 10 €, pero no salen en sus números');

  /* 6. Quién puede cambiar los gastos */
  await A.H.grupoVer(['g1']); await sleep(40);
  ok(/Quién puede cambiar los gastos/.test(sh(a)) && !!a.doc.querySelector('[data-click="grupoEdicion|g1|autor"]'), 'el administrador ve el ajuste «Quién puede cambiar los gastos»');
  click(a, 'grupoEdicion', 'g1', 'autor'); await sleep(60);
  ok(DB.grupos[0].edicion === 'autor', 'lo cambia a «Quien lo apuntó»');
  await B.H.grupoVer(['g1']); await sleep(60);
  ok(!B.form().soyAdmin && /Lo deciden los administradores/.test(sh(b)) && !b.doc.querySelector('[data-click^="grupoEdicion"]'), 'un miembro normal lo ve, pero no lo puede cambiar');
  const cena = B.S.compartidos.find((x) => x.importe === 100);
  B.H.closeSheet([]); await sleep(260);
  B.H.openMovForm(['c:' + cena.id]); await sleep(30);
  ok(/solo quien lo apuntó o un administrador/.test(sh(b)) && !b.doc.querySelector('[data-click^="deleteComp"]'), 'Bea abre la cena de Ana: no puede borrarla y se le explica por qué');
  B.H.closeSheet([]); await sleep(260);

  /* 7. Administradores */
  await A.H.grupoVer(['g1']); await sleep(40);
  click(a, 'rolCambiar', 'g1', 'uB', '1'); await sleep(80);
  ok(DB.miembros.find((x) => x.user_id === 'uB').rol === 'admin', 'Ana hace administradora a Bea');
  await B.H.grupoVer(['g1']); await sleep(60);
  B.H.closeSheet([]); await sleep(260);
  B.H.openMovForm(['c:' + cena.id]); await sleep(30);
  ok(!!b.doc.querySelector('[data-click^="deleteComp"]'), 'como administradora, Bea ya puede cambiar o borrar la cena');
  B.H.closeSheet([]); await sleep(260);
  await A.H.grupoVer(['g1']); await sleep(40);
  click(a, 'rolCambiar', 'g1', 'uB', '0'); await sleep(80);
  ok(DB.miembros.find((x) => x.user_id === 'uB').rol === 'miembro', 'y le puede quitar el permiso');

  /* 8. Aspecto: solo el Nuevo */
  A.H.openAspecto([]); await sleep(20);
  ok(!/Clásico/.test(sh(a)) && a.doc.documentElement.getAttribute('data-look') === 'nuevo', 'el aspecto Clásico ya no se ofrece');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

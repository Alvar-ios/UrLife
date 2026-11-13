// 13/11/2026 · Avisos de Juntos con la app cerrada (Firebase, docs/41). Dos partes:
// 1. La lógica de la función «avisar» (supabase/functions/avisar/logica.js): quién recibe, textos es/en, silencio, freno…
// 2. La app: guarda el token de Firebase de este móvil, la opción «Juntos» en Tú → Avisos, tocar el aviso abre la persona
//    o el grupo, y al cerrar sesión el token se olvida. Android, Firebase y Supabase se simulan. Datos inventados.
const path = require('path');
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

(async () => {
  /* ---------------- 1. Lógica del servidor ---------------- */
  const L = await import(path.join(__dirname, '..', 'supabase', 'functions', 'avisar', 'logica.js'));
  const miembros = [{ user_id: 'uA', nombre: 'Ana' }, { user_id: 'uB', nombre: 'Bea' }, { user_id: 'uC', nombre: 'Carlos' }, { user_id: 'uX', nombre: 'Xavi', baja: '2026-10-01' }];
  const gasto = { id: 'g1', tipo: 'Gasto', descripcion: 'Cena', importe: 37.5, pagado_por: 'uA', creado_por: 'uA', reparto: { uA: 12.5, uB: 12.5, uC: 12.5, uX: 0 } };
  let d = L.destinatariosCompartido(gasto, miembros, []);
  ok(d.length === 2 && !d.some((x) => x.uid === 'uA') && d.every((x) => x.rol === 'parte' && x.importe === 12.5), 'gasto: avisa a los demás con su parte, nunca a quien lo apuntó, ni a quien ya salió');
  const ctx = { grupo: { nombre: 'Piso', tipo: 'grupo' }, nombres: { uA: 'Ana', uB: 'Bea', uC: 'Carlos' }, gasto: { descripcion: 'Cena' } };
  let t = L.textoAviso(d[0], 'es', ctx);
  ok(t.titulo === 'Piso' && t.texto === 'Ana apuntó Cena · te toca 12,50 €', 'texto en español: «Ana apuntó Cena · te toca 12,50 €» (' + t.texto + ')');
  t = L.textoAviso(d[0], 'en', ctx);
  ok(t.texto === 'Ana added Cena · your share €12.50', 'texto en inglés (' + t.texto + ')');
  // lo apunta Bea, pero pagó Ana
  d = L.destinatariosCompartido(Object.assign({}, gasto, { creado_por: 'uB' }), miembros, []);
  const da = d.find((x) => x.uid === 'uA');
  ok(d.length === 2 && da && da.rol === 'pagaste' && /que pagaste tú · 37,50 €/.test(L.textoAviso(da, 'es', ctx).texto), 'si lo apunta otra persona, a quien pagó le dice «que pagaste tú»');
  // persona sin cuenta cuyo sitio ocupó Carlos
  d = L.destinatariosCompartido({ id: 'g2', tipo: 'Gasto', importe: 20, pagado_por: 'uA', creado_por: 'uA', reparto: { uA: 10, inv1: 10 } }, miembros, [{ id: 'inv1', reclamado_por: 'uC' }]);
  ok(d.length === 1 && d[0].uid === 'uC' && d[0].importe === 10, 'la parte de una persona sin cuenta llega a quien ocupó su sitio');
  ok(L.destinatariosCompartido({ id: 'g3', tipo: 'Gasto', importe: 20, pagado_por: 'uA', creado_por: 'uA', reparto: { uA: 10, inv2: 10 } }, miembros, []).length === 0, 'a las personas sin cuenta no se les avisa (no tienen móvil)');
  ok(L.destinatariosCompartido(Object.assign({}, gasto, { borrado: '2026-11-13' }), miembros, []).length === 0 && L.destinatariosCompartido(Object.assign({}, gasto, { tipo: 'Ahorro' }), miembros, []).length === 0, 'nada si está borrado o no es un gasto ni un pago');
  // pagos para saldar
  const liq = { id: 'l1', tipo: 'Liquidación', importe: 20, pagado_por: 'uB', creado_por: 'uB', reparto: { uA: 20 } };
  d = L.destinatariosCompartido(liq, miembros, []);
  ok(d.length === 1 && d[0].uid === 'uA' && L.textoAviso(d[0], 'es', ctx).texto === 'Bea te ha pagado 20,00 €', '«Saldar»: a quien recibe, «Bea te ha pagado 20,00 €»; a quien paga, nada');
  d = L.destinatariosCompartido(Object.assign({}, liq, { creado_por: 'uA' }), miembros, []);
  ok(d.length === 1 && d[0].uid === 'uB' && L.textoAviso(d[0], 'es', ctx).texto === 'Ana apuntó que le pagaste 20,00 €', 'si lo apunta quien cobra, a quien pagó: «Ana apuntó que le pagaste 20,00 €»');
  d = L.destinatariosCompartido(Object.assign({}, liq, { creado_por: 'uC' }), miembros, []);
  ok(d.length === 2 && /pagaste 20,00 € a Ana/.test(L.textoAviso(d.find((x) => x.uid === 'uB'), 'es', ctx).texto), 'si lo apunta un tercero, avisa a los dos');
  // entrar en un grupo
  d = L.destinatariosMiembro({ grupo_id: 'gP', user_id: 'uC', por: 'uC' }, miembros);
  ok(d.length === 2 && d.every((x) => x.rol === 'se_une') && L.textoAviso(d[0], 'es', ctx).texto === 'Carlos se ha unido a Piso', 'alguien entra con un enlace: «Carlos se ha unido a Piso» a los demás, no a él');
  d = L.destinatariosMiembro({ grupo_id: 'gP', user_id: 'uC', por: 'uA' }, miembros);
  const dc = d.find((x) => x.uid === 'uC');
  ok(d.length === 2 && !d.some((x) => x.uid === 'uA') && dc && L.textoAviso(dc, 'es', ctx).texto === 'Ana te ha añadido a Piso', 'si Ana añade a Carlos: a Carlos «Ana te ha añadido a Piso», a Bea que se ha unido, a Ana nada');
  ok(L.textoAviso({ rol: 'se_une', otro: 'uB' }, 'es', { grupo: { nombre: 'Ana y Bea', tipo: 'directo' }, nombres: { uB: 'Bea' } }).texto === 'Bea ya comparte gastos contigo', 'en «solo vosotros dos»: «Bea ya comparte gastos contigo»');
  // silencio, preferencias, freno, FCM
  ok(L.enSilencio('Europe/Madrid', '2026-11-13T22:30:00Z') && L.enSilencio('Europe/Madrid', '2026-11-13T07:30:00Z') && !L.enSilencio('Europe/Madrid', '2026-11-13T08:30:00Z'), 'silencio de 22:00 a 9:00 en la hora de cada persona (23:30 y 8:30 sí; 9:30 no)');
  ok(!L.enSilencio('America/New_York', '2026-11-13T22:30:00Z') && L.enSilencio('zona/mala', '2026-11-13T22:30:00Z'), 'otra zona horaria cuenta la suya; una zona rara, como Madrid');
  ok(L.prefsAvisos(null).juntos && L.prefsAvisos({}).silencio && !L.prefsAvisos({ juntos: false }).juntos && !L.prefsAvisos({}, { juntos: false }).juntos && !L.prefsAvisos({ silencio: false }).silencio, 'Juntos encendido por defecto; se apaga en Avisos o apagando la herramienta Juntos');
  ok(L.MAX_DIA === 20, 'freno: 20 avisos por persona y día');
  const m = L.mensajeFCM('tok', { titulo: 'Piso', texto: 'x' }, L.datosAviso({ evento: 'compartido', id: 'g1', grupo_id: 'gP' }, { rol: 'parte', otro: 'uA' }), false).message;
  const mn = L.mensajeFCM('tok', { titulo: 'Piso', texto: 'x' }, {}, true).message;
  ok(m.android.notification.channel_id === 'juntos' && m.data.grupo === 'gP' && m.data.persona === 'uA' && m.data.tipo === 'juntos' && mn.android.notification.channel_id === 'juntos_noche', 'mensaje: canal «juntos» de día y «juntos_noche» (sin sonido) en el silencio; lleva grupo y persona para abrirlos');
  ok(Object.values(m.data).every((v) => typeof v === 'string'), 'los datos del aviso son todos texto (FCM no admite otra cosa)');
  ok(L.claveAviso({ evento: 'compartido', id: 'g1' }, { rol: 'parte' }, '2026-11-13') === L.claveAviso({ evento: 'compartido', id: 'g1' }, { rol: 'parte' }, '2026-11-14'), 'el mismo gasto no se avisa dos veces');
  ok(L.tokenMalo(404, '') && L.tokenMalo(400, '{"error":{"details":[{"errorCode":"UNREGISTERED"}]}}') && L.tokenMalo(400, 'The registration token is not a valid FCM registration token') && !L.tokenMalo(500, 'x') && !L.tokenMalo(400, 'Invalid JSON payload'), 'token que ya no vale (404 / UNREGISTERED) se borra; otros errores no');
  ok(L.dinero(1234.5, 'es') === '1.234,50 €' && L.dinero(1234.5, 'en') === '€1,234.50', 'importes con el formato de cada idioma');

  /* ---------------- 2. La app ---------------- */
  const reg = { token: [], registrar: [], quitar: [], olvidar: 0, register: 0 };
  let permiso = 'granted', conFirebase = true, pend = null;
  const pre = (w) => {
    w.SUPABASE_CONFIG = { url: 'https://x.supabase.co', anonKey: 'publica' };
    w.__nativo = { android: true,
      notif: { permiso: async () => permiso, pedir: async () => permiso, programar: async () => 0, ahora: async () => 0 },
      push: { disponible: async () => conFirebase, token: async () => { reg.register++; return 'tok-' + 'a'.repeat(30); }, olvidar: async () => { reg.olvidar++; }, pendiente: () => { const d0 = pend; pend = null; return d0; } } };
  };
  pend = { tipo: 'juntos', grupo: 'gPiso', persona: 'uAna', rol: 'parte' }; // aviso tocado con la app cerrada
  const e = makeEnv({ version: { tu: 1, agenda: 0, crear: 0 }, pre, session: { user: { id: 'uYo', email: 't@t.com' } },
    cfg: { app: { compararVersiones: false, nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }] }, meta: { onboarded: true } } });
  e.w.Data.moviles = { registrar: async (p) => { reg.registrar.push(p); return p.id; }, token: async (p) => { reg.token.push(p); return p.id; }, quitar: async (id) => { reg.quitar.push(id); }, quitarTodos: async () => {} };
  const A = e.w.__APP__, S = A.S, H = A.H, doc = e.doc;
  // grupos y gastos inventados antes de arrancar
  const mm = (u, n) => ({ user_id: u, nombre: n, rol: 'miembro' });
  const G = (id, nombre, tipo, ms) => ({ id, nombre, tipo, alias: {}, miembros: ms, todos: ms });
  await A.main(); await sleep(300);
  S.db = Object.assign(S.db || {}, { grupos: Object.assign({}, (S.db && S.db.grupos) || {}, { listar: async () => S.grupos, invitaciones: async () => [] }) });
  S.grupos = [G('gPiso', 'Piso', 'grupo', [mm('uYo', 'Lucía'), mm('uAna', 'Ana'), mm('uBea', 'Bea')])];
  S.compartidos = [{ id: 'c1', grupoId: 'gPiso', fecha: A.todayISO(), tipo: 'Gasto', categoria: 'Casa', descripcion: 'Cena', importe: 30, pagadoPor: 'uAna', reparto: { uYo: 10, uAna: 10, uBea: 10 }, modo: 'igual', creadoPor: 'uAna', createdAt: new Date().toISOString() }];
  await sleep(2600);
  const r = reg.token[0] || {};
  ok(reg.token.length === 1 && /^tok-/.test(r.token) && r.id && r.idioma === 'es' && r.zona, 'con permiso de avisos, el token de Firebase se guarda en el servidor con su idioma y zona');
  ok((S['_avDisp:uYo'] || '') === r.id, 'usa el mismo id de móvil que los avisos del banco');
  // tocar el aviso con la app cerrada: al cargar se abre
  const F0 = A.form();
  ok(S.tab === 'juntos' && F0 && F0.kind === 'persona' && F0.uid === 'uAna', 'el aviso tocado con la app cerrada abre Juntos y la persona al cargar');
  // otra vez: no se vuelve a guardar el mismo token
  e.w.__pushToken('tok-' + 'a'.repeat(30)); await sleep(50);
  ok(reg.token.length === 1, 'el mismo token no se vuelve a mandar (solo cada 7 días)');
  // Firebase cambia el token
  e.w.__pushToken('tok-' + 'b'.repeat(30)); await sleep(80);
  ok(reg.token.length === 2 && reg.token[1].token === 'tok-' + 'b'.repeat(30) && reg.token[1].id === r.id, 'si Firebase cambia el token, se guarda el nuevo en la misma fila');
  // tocar un aviso con la app abierta: «se ha unido» abre el grupo
  try { A.H.closeSheet && A.H.closeSheet([]); } catch (er) { /* */ }
  e.w.__juntosAbrir({ tipo: 'juntos', grupo: 'gPiso', persona: '', rol: 'se_une' }); await sleep(60);
  const F1 = A.form();
  ok(F1 && F1.kind === 'grupo' && F1.id === 'gPiso', 'tocar «X se ha unido a Piso» abre el grupo');
  // con la app abierta llega: aviso pequeño
  let toasts = ''; const t0 = A.toast; e.w.__juntosLlega({ titulo: 'Piso', texto: 'Ana apuntó Cena · te toca 10,00 €', datos: { tipo: 'juntos', rol: 'parte' } }); await sleep(30);
  toasts = (doc.querySelector('#toast') || doc.body).textContent;
  ok(/Ana apuntó Cena/.test(toasts), 'con la app abierta se ve un aviso pequeño');
  // Tú → Avisos: la opción Juntos, encendida
  await H.avAbrir([]); await sleep(60);
  const filaJ = [...doc.querySelectorAll('.av-opt')].find((x) => /^Juntos/.test(x.querySelector('b').textContent));
  ok(filaJ && filaJ.querySelector('.switch.on'), 'Tú → Avisos tiene «Juntos», encendido por defecto');
  filaJ.querySelector('.switch').click(); await sleep(60);
  ok(A.cfg().avisos && A.cfg().avisos.juntos === false, 'apagarlo se guarda en la configuración (el servidor lo mira)');
  const filaJ2 = [...doc.querySelectorAll('.av-opt')].find((x) => /^Juntos/.test(x.querySelector('b').textContent));
  filaJ2.querySelector('.switch').click(); await sleep(200);
  ok(A.cfg().avisos.juntos === true && reg.token.length === 3, 'al volver a encenderlo, se vuelve a mandar el token');
  // cerrar sesión: el token de este móvil se olvida
  await H.doLogout([]); await sleep(150);
  ok(reg.olvidar === 1 && !S['_avTok:uYo'] && reg.quitar.includes(r.id), 'al cerrar sesión se quita el móvil y el token de Firebase deja de valer');

  /* ---------------- 3. Sin Firebase en la compilación o sin permiso ---------------- */
  {
    const reg2 = { token: 0, register: 0 };
    const pre2 = (w) => { w.__nativo = { android: true, notif: { permiso: async () => 'granted', pedir: async () => 'granted', programar: async () => 0 },
      push: { disponible: async () => false, token: async () => { reg2.register++; return 'x'.repeat(30); }, olvidar: async () => {}, pendiente: () => null } }; };
    const e2 = makeEnv({ version: { tu: 1, agenda: 0, crear: 0 }, pre: pre2, session: { user: { id: 'uYo', email: 't@t.com' } }, cfg: { app: { compararVersiones: false }, meta: { onboarded: true } } });
    e2.w.Data.moviles = { registrar: async () => {}, token: async () => { reg2.token++; }, quitar: async () => {}, quitarTodos: async () => {} };
    await e2.w.__APP__.main(); await sleep(2600);
    ok(reg2.register === 0 && reg2.token === 0, 'sin Firebase en la compilación no se pide token (no se cierra la app)');
    await e2.w.__APP__.H.avAbrir([]); await sleep(60);
    ok(/aún no puede recibirlos con la app cerrada/.test(e2.doc.querySelector('#sheetBackdrop').textContent), 'y en Avisos se explica que esta versión aún no los recibe');
  }
  {
    const reg3 = { register: 0 };
    const pre3 = (w) => { w.__nativo = { android: true, notif: { permiso: async () => 'denied', pedir: async () => 'denied', programar: async () => 0 },
      push: { disponible: async () => true, token: async () => { reg3.register++; return 'x'.repeat(30); }, olvidar: async () => {}, pendiente: () => null } }; };
    const e3 = makeEnv({ version: { tu: 1, agenda: 0, crear: 0 }, pre: pre3, session: { user: { id: 'uYo', email: 't@t.com' } }, cfg: { app: { compararVersiones: false }, meta: { onboarded: true } } });
    e3.w.Data.moviles = { registrar: async () => {}, token: async () => {}, quitar: async () => {}, quitarTodos: async () => {} };
    await e3.w.__APP__.main(); await sleep(2600);
    ok(reg3.register === 0, 'sin permiso de avisos no se pide el token');
  }
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

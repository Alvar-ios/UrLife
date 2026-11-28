// Calidad (22/11/2026), tanda 4 de Juntos (docs/46): casos raros de la pantalla de un grupo. Datos inventados.
// «CONOCIDO» = fallo ya avisado a Desarrollo: se imprime pero no hace fallar la batería (cuando se arregle, pasa a PASS).
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const conocido = (c, m) => console.log((c ? 'PASS ' : 'CONOCIDO ') + m);
console.error = () => {};
(async () => {
  const pad = (n) => String(n).padStart(2, '0'), d = new Date(), hoy = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const e = makeEnv({ version: { juntos: 1 }, cfg: { app: { nombre: 'Lucía', historialVisto: { g1: '2000-01-01T00:00:00Z' } }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uYo' } } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost').textContent;
  const hay = (sel) => !!doc.querySelector('#sheetHost ' + sel), abierta = () => { const b = doc.querySelector('#sheetBackdrop'); return !!b && !b.dataset.cerrando; };
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm, x) => Object.assign({ user_id: u, nombre: nm, rol: 'miembro' }, x || {});
  const yo = m('uYo', 'Lucía', { rol: 'admin' });
  S.grupos = [
    { id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, m('uA', 'Ana'), m('uB', 'Bea')] },
    // Marta se añadió sin app y luego se la instaló: sus gastos antiguos siguen con «sM», que ahora es «uM»
    { id: 'g2', nombre: 'Cenas', tipo: 'grupo', alias: { sM: 'uM' }, soyAdmin: true, miembros: [yo, m('uM', 'Marta')] },
    { id: 'g4', nombre: 'Lucía y Teo', tipo: 'directo', alias: {}, soyAdmin: false, miembros: [m('uYo', 'Lucía'), m('uT', 'Teo')] },
    { id: 'g5', nombre: 'Club', tipo: 'grupo', alias: {}, soyAdmin: false, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana', { rol: 'admin' }), m('uB', 'Bea')] }];
  S.grupos.forEach((g) => { g.todos = g.miembros; });
  const c = (id, gid, imp, pag, rep, desc) => ({ id, grupoId: gid, tipo: 'Gasto', categoria: 'Otros', descripcion: desc, importe: imp, pagadoPor: pag, reparto: rep, modo: 'igual', fecha: hoy, createdAt: new Date().toISOString() });
  S.compartidos = [
    c('k1', 'g1', 30, 'uYo', { uYo: 10, uA: 10, uB: 10 }, 'Compra'),
    c('k2', 'g2', 20, 'uYo', { uYo: 10, sM: 10 }, 'Cena'),
    c('k4', 'g4', 16, 'uT', { uYo: 8, uT: 8 }, 'Taxi'),
    c('k5', 'g5', 30, 'uA', { uYo: 10, uA: 10, uB: 10 }, 'Cuota'), c('k6', 'g5', 30, 'uB', { uYo: 10, uA: 10, uB: 10 }, 'Bolas')];
  S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.db = Object.assign(S.db || {}, { grupos: (S.db && S.db.grupos) || {}, compartidos: (S.db && S.db.compartidos) || { suscribir: () => () => {} }, rpc: async () => null, agenda: (S.db && S.db.agenda) || { suscribir: () => () => {} } });
  S.agenda = S.agenda || [];
  S.db.grupos.invitaciones = async () => [];
  S.db.grupos.listar = async () => { throw new Error('sin red'); }; // no se recargan los grupos: se quedan los de arriba
  // historial ya «cargado» (sin red) para que no lo pida
  S.hist = {}; ['g1', 'g2', 'g4', 'g5'].forEach((g) => { S.hist[g] = { filas: [], cargando: false, error: false, mas: false, persona: '', tipo: 'todo', t: Date.now() }; });
  const abrir = async (gid) => { H.grupoVer([gid]); await sleep(60); };
  const cerrar = async () => { H.closeSheet([]); await sleep(300); };

  // 1) Alias: «Pedir» abre a la persona con su número nuevo (uM), no el antiguo (sM)
  await abrir('g2');
  ok(/Marta te debe/.test(sh()), 'alias: «Marta te debe»');
  ok(hay('.jv-sit [data-click="personaVer|uM"]'), 'alias: «Pedir» abre a Marta (uM)');

  // 2) Directo: «solo vosotros dos», debes a Teo, solo «Saldar»
  await cerrar(); await abrir('g4');
  ok(/solo vosotros dos/.test(sh()) && /Debes a Teo/.test(sh()), 'directo: «solo vosotros dos» y «Debes a Teo»');
  ok(hay('.jv-sit.de [data-click^="saldarAbrir"]') && !hay('.jv-sit [data-click^="personaVer"]'), 'directo: «Saldar» y sin «Pedir»');
  // Ajustes de un directo: la de siempre (persona), sin invitar
  H.grupoAjustes(['g4']); await sleep(40);
  ok(!/Invitar a gente nueva/.test(sh()), 'directo: los ajustes no ofrecen invitar');

  // 3) Debo a varios (no admin): resumen en rojo y «Ver quién y saldar»
  await cerrar(); await abrir('g5');
  ok(hay('.jv-sit.de') && /Debes 20,00/.test(sh()) && !/Te deben/.test(sh()), 'debo a varios: «Debes 20,00 €» en una tarjeta');
  H.grupoTab(['saldos']); await sleep(20);
  ok((sh().match(/Saldar/g) || []).length >= 2, 'debo a varios: en Saldos, un «Saldar» por persona');
  // Saldar y volver: sigue en Saldos
  const b = doc.querySelector('#sheetHost .jv-pago.mio [data-click^="saldarAbrir"]'); b.click(); await sleep(30);
  const v = doc.querySelector('#sheetHost .actions [data-click^="grupoVer|"]'); v.click(); await sleep(60);
  ok(/Para quedar en paz/.test(sh()), 'de «Saldar» a «Volver»: sigue en Saldos');
  // no admin en Ajustes: sin renombrar ni cerrar el grupo
  H.grupoAjustes(['g5']); await sleep(40);
  ok(!doc.querySelector('#gRenombrar') && !/Cerrar el grupo para todos/.test(sh()) && /Salir del grupo/.test(sh()), 'no admin: sin renombrar ni cerrar; sí «Salir»');
  H.grupoAjustesSalir(['g5']); await sleep(40);
  ok(hay('.jv-tabs'), 'Ajustes → Volver: vuelve a la pantalla del grupo');

  // 4) Más → Planes → atrás de Android: debería volver a «Más», no cerrar el grupo
  await cerrar(); await abrir('g1');
  H.grupoTab(['mas']); await sleep(20);
  if (hay('[data-click="grupoTab|planes"]')) {
    H.grupoTab(['planes']); await sleep(20);
    e.w.__atras(); await sleep(40);
    ok(abierta() && hay('[data-click="grupoTab|planes"]'), 'Planes → atrás de Android vuelve a «Más» (ahora cierra el grupo)');
  } else console.log('SKIP Planes no disponible en esta prueba');

  // 5) Más → Historial → Volver: debería quedarse en «Más»
  if (!abierta()) await abrir('g1');
  H.grupoTab(['mas']); await sleep(20);
  H.histVer(['g1']); await sleep(40);
  H.histVolver(['g1']); await sleep(60);
  ok(hay('.jv-tabs button.active') && doc.querySelector('#sheetHost .jv-tabs button.active').textContent.trim() === 'Más', 'Historial → Volver: sigue en «Más» (ahora vuelve a Gastos)');
  // Más → ¿De dónde sale? → Volver
  H.grupoTab(['mas']); await sleep(20);
  H.origenVer(['g1']); await sleep(30);
  doc.querySelector('#sheetHost .actions [data-click^="grupoVer|"]').click(); await sleep(60);
  ok(doc.querySelector('#sheetHost .jv-tabs button.active').textContent.trim() === 'Más', '«¿De dónde sale?» → Volver: sigue en «Más» (ahora vuelve a Gastos)');

  // 6) Punto en «Más» con cambios nuevos en el historial
  await cerrar();
  S.hist.g1.filas = [{ en: new Date().toISOString(), por: 'uA', accion: 'editado', cid: 'k1' }];
  await abrir('g1');
  if (true) {
    ok(hay('.jv-tabs .jv-tab-punto'), 'cambios nuevos en el historial: punto en «Más»');
    H.grupoTab(['mas']); await sleep(20);
    ok(/1 nuevo/.test(sh()), '«Más»: «Historial de cambios · 1 nuevo»');
  } else console.log('SKIP no se pudo preparar el historial nuevo desde la prueba');

  // 7) Trayecto desde el grupo: «Compartir» va a ese grupo; desde el + no
  await cerrar();
  H.grupoTray(['g1']); await sleep(40);
  const F = () => A.form();
  if (F() && F().kind === 'trayecto') {
    F().km = '100'; F().consumo = '6';
    H.trCompartir([]); await sleep(40);
    ok(F().kind === 'compRapido' && F().comp && F().comp.dest === 'g:g1', 'trayecto desde el grupo: «Compartir» va a «Piso»');
    ok(S._volverGrupo === 'g1', 'trayecto desde el grupo: al cancelar vuelve al grupo');
    await cerrar();
    H.grupoTray(['g1']); await sleep(30); await cerrar(); // abierto desde el grupo y cerrado sin compartir
    H.trAbrir([]); await sleep(30);
    F().km = '100'; F().consumo = '6';
    H.trCompartir([]); await sleep(40);
    ok(S._volverGrupo !== 'g1' && F().comp.dest !== 'g:g1', 'trayecto desde el +: no va ni vuelve al grupo de antes');
  } else console.log('SKIP FORM no visible desde la prueba');

  // 9) «Antes»: la de siempre, también con un directo
  await cerrar(); S.verAnterior = Object.assign({}, S.verAnterior, { juntos: 2 }); await abrir('g4');
  ok(!hay('.jv-sit') && hay('.jv-tuyo'), '«Antes»: directo con la pantalla anterior');
  process.exit(fails ? 1 : 0);
})();

// Juntos v5 (docs/53 C, tandas 4-6): resumen, «Amigos» como historias, «Grupos» en tarjetas con foto y lo nuevo (aro, borde, «N nuevas», punto en la barra). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
(async () => {
  const pad = (n) => String(n).padStart(2, '0'), d = new Date(), hoy = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const antes = '2026-11-01T10:00:00Z', despues = '2026-11-20T10:00:00Z', FOTO = 'data:image/jpeg;base64,/9j/AAA=';
  const e = makeEnv({ version: { juntos: 0 }, cfg: { app: { nombre: 'Lucía', vistoJuntos: antes }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uYo' } } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, txt = () => doc.querySelector('#content').textContent;
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm, x) => Object.assign({ user_id: u, nombre: nm, rol: 'miembro' }, x || {});
  const yo = m('uYo', 'Lucía', { rol: 'admin' });
  S.grupos = [
    { id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, soyAdmin: true, foto: FOTO, miembros: [yo, m('uA', 'Ana'), m('uB', 'Bea'), m('uC', 'Carla'), m('uD', 'Dani')] },
    { id: 'g2', nombre: 'Pádel', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, m('uP', 'Pablo')] },
    { id: 'g3', nombre: 'Viaje', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, m('uA', 'Ana')] }];
  S.grupos.forEach((g) => { g.todos = g.miembros; });
  const c = (id, gid, imp, pag, rep, desc, cre) => ({ id, grupoId: gid, tipo: 'Gasto', categoria: 'Otros', descripcion: desc, importe: imp, pagadoPor: pag, creadoPor: pag, reparto: rep, modo: 'igual', fecha: hoy, createdAt: cre || antes });
  S.compartidos = [
    c('k1', 'g1', 40, 'uYo', { uYo: 10, uA: 10, uB: 10, uC: 10 }, 'Compra'),
    c('k2', 'g2', 20, 'uP', { uYo: 10, uP: 10 }, 'Pistas'),
    c('k3', 'g3', 30, 'uYo', { uYo: 15, uA: 15 }, 'Tren'),
    c('k4', 'g1', 8, 'uA', { uYo: 4, uA: 4 }, 'Pan', despues),          // nuevo de Ana en el piso
    c('k5', 'g3', 6, 'uA', { uYo: 3, uA: 3 }, 'Café', despues),         // nuevo de Ana en el viaje
    c('k6', 'g2', 9, 'uYo', { uYo: 4.5, uP: 4.5 }, 'Bolas', despues)];   // mío: no cuenta
  S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.db = Object.assign(S.db || {}, { grupos: (S.db && S.db.grupos) || { listar: async () => ({ grupos: [], miembros: [] }) }, compartidos: (S.db && S.db.compartidos) || { suscribir: () => () => {} }, rpc: async () => null });
  S.db.grupos.listar = async () => { throw new Error('sin red'); }; S.db.grupos.invitaciones = async () => []; // la prueba no recarga los grupos
  H.goTab(['juntos']); await sleep(60);
  const V = () => A.S.verAnterior && A.S.verAnterior.juntos;
  ok(!!doc.querySelector('#content .jv6-amigos') && !!doc.querySelector('#content .jv6-grupos'), 'la pantalla nueva es la de serie: Amigos y Grupos');
  ok(/Te deben/.test(txt()) && !!doc.querySelector('#content .jv-compartir'), 'arriba: cifras y «Compartir un gasto»');
  const am = [...doc.querySelectorAll('#content .jv6-am:not(.jv6-inv)')];
  ok(!!doc.querySelector('#content .jv6-inv') && doc.querySelector('#content .jv6-amigos').firstElementChild.classList.contains('jv6-inv'), '«Invitar» es el primero de la fila');
  ok(am.length === 5 && /Ana/.test(am.map((x) => x.textContent).join()) && /Pablo/.test(txt()), 'cinco amigos (Ana una sola vez aunque esté en dos grupos): ' + am.length);
  const gs = [...doc.querySelectorAll('#content .jv6-g')];
  ok(gs.length === 3, 'tres grupos en tarjetas');
  const gPiso = gs.find((x) => /Piso/.test(x.textContent));
  ok(!!gPiso && !!gPiso.querySelector('img.jv6-foto') && gPiso.querySelector('img.jv6-foto').getAttribute('src') === FOTO, 'el grupo con foto la enseña');
  ok(!!gs.find((x) => /Pádel/.test(x.textContent)).querySelector('.jv6-ini'), 'sin foto: la inicial con color');
  ok(gPiso.querySelectorAll('.jv-caras .avatar').length === 3 && /\+1/.test(gPiso.textContent), 'caras de hasta 3 miembros y «+1»');
  ok(/te deben|debes|en paz|sin gastos/.test(gPiso.textContent), 'cada tarjeta dice tu saldo');
  ok(!doc.querySelector('#content [data-click="juntosVer|personas"]') && !/Lo último/.test(txt()), 'ya no están «Por persona» ni «Lo último»');
  // lo nuevo
  const nav = () => doc.querySelector('.tabbar [data-tab="juntos"]');
  const pill = (nombre) => { const g = [...doc.querySelectorAll('#content .jv6-g')].find((x) => x.textContent.indexOf(nombre) >= 0); return g && g.querySelector('.jv6-pill') ? g.querySelector('.jv6-pill').textContent : ''; };
  ok(pill('Piso') === '1 nueva' && pill('Viaje') === '1 nueva' && pill('Pádel') === '', '«1 nueva» en el piso y el viaje; nada en el pádel (lo nuevo era mío)');
  ok(!!doc.querySelector('#content .jv6-g.nuevo') && !doc.querySelectorAll('#content .jv6-g.nuevo')[2], 'borde de «nuevo» en dos tarjetas');
  const ana = [...doc.querySelectorAll('#content .jv6-am')].find((x) => /Ana/.test(x.textContent));
  ok(ana.classList.contains('nuevo') && doc.querySelectorAll('#content .jv6-am.nuevo').length === 1, 'aro solo en Ana');
  ok(!!ana.querySelector('.sr-only') && /Novedades/.test(ana.textContent) && /te debe/.test(ana.textContent), 'accesible: dice «te debe» y «Novedades» solo para lectores');
  ok(nav().classList.contains('con-cuenta'), 'punto en el icono de Juntos de la barra');
  ok(ana.closest('.jv6-amigos') && ana.closest('.jv6-amigos').className.indexOf('jv6') >= 0, 'fila que se desliza');
  // lo nuevo no se enciende por lo de otros cuando nunca habías entrado: la base sale de lo que ya habías visto
  ok(S.config.juntosVisto && S.config.juntosVisto._ === antes, 'la primera vez parte de lo visto («_» = ' + (S.config.juntosVisto || {})._ + ')');
  // abrir el grupo apaga su aviso (y el de la persona se mantiene por su lado)
  await H.grupoVer(['g1']); await sleep(80);
  ok(S.config.juntosVisto.g1 === despues, 'al abrir el piso se guarda hasta dónde viste');
  H.closeSheet([]); await sleep(300);
  ok(pill('Piso') === '' && pill('Viaje') === '1 nueva', 'el piso ya no avisa; el viaje sí');
  ok(nav().classList.contains('con-cuenta'), 'el punto de la barra sigue mientras quede algo');
  // abrir a Ana apaga su aro
  H.personaVer(['uA']); await sleep(60);
  H.closeSheet([]); await sleep(300);
  ok(![...doc.querySelectorAll('#content .jv6-am')].find((x) => /Ana/.test(x.textContent)).classList.contains('nuevo'), 'al abrir a Ana se apaga su aro');
  ok(pill('Viaje') === '1 nueva', 'pero el viaje aún tiene su aviso');
  await H.grupoVer(['g3']); await sleep(80); H.closeSheet([]); await sleep(300);
  ok(!doc.querySelector('#content .jv6-pill') && !nav().classList.contains('con-cuenta'), 'sin nada nuevo: no hay «nuevas» y desaparece el punto');
  // lo mío nunca cuenta: apuntar algo yo no enciende nada
  S.compartidos.push(c('k7', 'g2', 5, 'uYo', { uYo: 2.5, uP: 2.5 }, 'Agua', '2026-11-25T10:00:00Z')); A.render(); await sleep(30);
  ok(!doc.querySelector('#content .jv6-pill') && !nav().classList.contains('con-cuenta'), 'lo que apuntas tú no cuenta como nuevo');
  // lo de otro sí
  S.compartidos.push(c('k8', 'g2', 5, 'uP', { uYo: 2.5, uP: 2.5 }, 'Agua2', '2026-11-26T10:00:00Z')); A.render(); await sleep(30);
  ok(pill('Pádel') === '1 nueva' && [...doc.querySelectorAll('#content .jv6-am')].find((x) => /Pablo/.test(x.textContent)).classList.contains('nuevo'), 'lo que apunta otro enciende su grupo y su cara');
  // versión «Antes» se queda
  S.verAnterior = Object.assign({}, S.verAnterior, { juntos: 1 }); A.render(); await sleep(30);
  ok(!!doc.querySelector('#content .jv5-g') && !doc.querySelector('#content .jv6-amigos') && !nav().classList.contains('con-cuenta'), '«Antes»: la pantalla de filas, sin punto en la barra');
  console.log(fails ? '\nFALLOS: ' + fails : '\nTODO OK'); process.exit(fails ? 1 : 0);
})();

// Tanda 3 de Juntos (docs/46): primera pantalla nueva. Cifra + «Compartir un gasto», grupos en filas, «Lo último» (3), enlaces a «Por persona» y «Metas». Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
(async () => {
  const pad = (n) => String(n).padStart(2, '0'), d = new Date(), hoy = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const e = makeEnv({ version: { juntos: 0 }, cfg: { app: { nombre: 'Lucía' }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uYo' } } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, txt = () => doc.querySelector('#content').textContent;
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm, x) => Object.assign({ user_id: u, nombre: nm, rol: 'miembro' }, x || {});
  const yo = m('uYo', 'Lucía', { rol: 'admin' });
  S.grupos = [
    { id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, m('uA', 'Ana'), m('uB', 'Bea'), m('sC', 'Carlos', { sinCuenta: true })] },
    { id: 'g2', nombre: 'Lucía y Marta', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, m('sM', 'Marta', { sinCuenta: true })] },
    { id: 'd1', nombre: '', tipo: 'directo', alias: {}, soyAdmin: true, miembros: [yo, m('uP', 'Pablo')] }];
  S.grupos.forEach((g) => { g.todos = g.miembros; });
  const c = (id, gid, imp, pag, rep, desc) => ({ id, grupoId: gid, tipo: 'Gasto', categoria: 'Otros', descripcion: desc, importe: imp, pagadoPor: pag, reparto: rep, modo: 'igual', fecha: hoy, createdAt: new Date().toISOString() });
  S.compartidos = [c('k1', 'g1', 40, 'uYo', { uYo: 10, uA: 10, uB: 10, sC: 10 }, 'Compra'), c('k2', 'g2', 20, 'uYo', { uYo: 10, sM: 10 }, 'Cena'), c('k3', 'd1', 30, 'uP', { uYo: 15, uP: 15 }, 'Cine'), c('k4', 'g1', 8, 'uA', { uYo: 4, uA: 4 }, 'Pan')];
  S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.db = Object.assign(S.db || {}, { grupos: (S.db && S.db.grupos) || { listar: async () => ({ grupos: [], miembros: [] }) }, compartidos: (S.db && S.db.compartidos) || { suscribir: () => () => {} }, rpc: async () => null });
  H.goTab(['juntos']); await sleep(40);
  ok(!/todo sumado/.test(txt()), 'ya no sale la frase «En tus grupos…, todo sumado»');
  ok(/Te deben/.test(txt()) && /Debes/.test(txt()) && !!doc.querySelector('#content .jv-compartir'), 'arriba: cifras y «Compartir un gasto»');
  const filas = [...doc.querySelectorAll('#content .jv5-g')];
  ok(filas.length === 3, 'tres grupos en filas (también el de dos y el de «solo vosotros dos»)');
  const fM = filas.find((f) => /Marta/.test(f.textContent)), fP = filas.find((f) => /Pablo/.test(f.textContent)), fG = filas.find((f) => /Piso/.test(f.textContent));
  ok(!!fM && /sin app/.test(fM.textContent) && /te debe/.test(fM.textContent) && !!fM.querySelector('.avatar'), 'grupo de dos con alguien sin app: su nombre, su cara, «sin app» y «te debe»');
  ok(!!fP && /le debes/.test(fP.textContent), '«solo vosotros dos» con Pablo: «le debes»');
  ok(!!fG && /4 personas/.test(fG.textContent) && /1 sin app/.test(fG.textContent), 'grupo grande: «4 personas · 1 sin app»');
  ok(!doc.querySelector('#content .jv4-personas'), 'los círculos de personas ya no están en la pantalla principal');
  ok(/Lo último/.test(txt()) && doc.querySelectorAll('#content .jv-act .jv-a').length <= 3, '«Lo último» con 3 líneas como mucho');
  ok(!!doc.querySelector('#content [data-click="juntosVer|personas"]'), 'enlace «Por persona»');
  ok(!doc.querySelector('#content [data-click="juntosVer|metas"]'), 'sin metas compartidas no sale «Metas y deudas juntos»');
  // Por persona
  H.juntosVer(['personas']); await sleep(30);
  ok(!!doc.querySelector('#content .jv4-personas') && /Ana/.test(txt()) && /Pablo/.test(txt()) && /Sumando todos tus grupos/.test(txt()), '«Por persona»: los círculos, sumando todos los grupos');
  ok(!!doc.querySelector('#content [data-click="juntosVer|"]'), 'y un enlace para volver a Juntos');
  ok(e.w.__atras() === true && !doc.querySelector('#content .jv4-personas') && !!doc.querySelector('#content .jv5-g'), 'el atrás de Android vuelve a la pantalla principal');
  H.juntosVer(['personas']); await sleep(20); H.goTab(['inicio']); await sleep(20); H.goTab(['juntos']); await sleep(20);
  ok(!!doc.querySelector('#content .jv5-g'), 'tocar Juntos otra vez lleva a su pantalla principal');
  // más de 5 grupos: «Ver todos»
  for (let i = 0; i < 4; i++) S.grupos.push({ id: 'gx' + i, nombre: 'Viaje ' + i, tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, m('uA', 'Ana'), m('uB', 'Bea')], todos: [yo, m('uA', 'Ana'), m('uB', 'Bea')] });
  A.render(); await sleep(20);
  ok(doc.querySelectorAll('#content .jv5-g').length === 5 && /Ver todos \(7\)/.test(txt()), 'con 7 grupos salen 5 y «Ver todos (7)»');
  // dos grupos de dos con la misma persona sin app: se distinguen por el nombre del grupo
  S.grupos.push({ id: 'g3', nombre: 'Viaje Roma', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, m('sM2', 'Marta', { sinCuenta: true })], todos: [yo, m('sM2', 'Marta', { sinCuenta: true })] });
  S.juntosTodos = { grupos: true }; A.render(); await sleep(20);
  const fR = [...doc.querySelectorAll('#content .jv5-g')].find((f) => /Viaje Roma/.test(f.textContent));
  const fA = [...doc.querySelectorAll('#content .jv5-g')].find((f) => /Marta/.test(f.textContent) && !/Viaje Roma/.test(f.textContent));
  ok(!!fR && /sin app · Viaje Roma/.test(fR.textContent), 'grupo de dos con nombre propio: «sin app · Viaje Roma»');
  ok(!!fA && !/Lucía y Marta/.test(fA.textContent), 'el que creó la app («Lucía y Marta») no repite el nombre');
  // la de antes sigue en «Antes»
  S.verAnterior = Object.assign({}, S.verAnterior, { juntos: 1 }); A.render(); await sleep(20);
  ok(!!doc.querySelector('#content .jv4-grupos') && !doc.querySelector('#content .jv5-g'), '«Antes»: la pantalla de tarjetas y círculos');
  process.exit(fails ? 1 : 0);
})();

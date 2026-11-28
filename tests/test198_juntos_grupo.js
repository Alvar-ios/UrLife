// Tanda 4 de Juntos (docs/46): pantalla de un grupo (Tu situación, pestañas Gastos | Saldos | Más) y Ajustes reordenados. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
(async () => {
  const pad = (n) => String(n).padStart(2, '0'), d = new Date(), hoy = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const e = makeEnv({ version: { juntos: 1 }, cfg: { app: { nombre: 'Lucía' }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uYo' } } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost').textContent;
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm, x) => Object.assign({ user_id: u, nombre: nm, rol: 'miembro' }, x || {});
  const yo = m('uYo', 'Lucía', { rol: 'admin' });
  S.grupos = [
    { id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, m('uA', 'Ana'), m('uB', 'Bea')] },
    { id: 'g2', nombre: 'Lucía y Marta', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, m('sM', 'Marta', { sinCuenta: true })] },
    { id: 'g3', nombre: 'Viaje', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo] }];
  S.grupos.forEach((g) => { g.todos = g.miembros; });
  const c = (id, gid, imp, pag, rep, desc) => ({ id, grupoId: gid, tipo: 'Gasto', categoria: 'Otros', descripcion: desc, importe: imp, pagadoPor: pag, reparto: rep, modo: 'igual', fecha: hoy, createdAt: new Date().toISOString() });
  S.compartidos = [c('k1', 'g1', 30, 'uYo', { uYo: 10, uA: 10, uB: 10 }, 'Compra'), c('k2', 'g2', 20, 'uYo', { uYo: 10, sM: 10 }, 'Cena')];
  S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.db = Object.assign(S.db || {}, { grupos: (S.db && S.db.grupos) || { listar: async () => ({ grupos: [], miembros: [] }), invitaciones: async () => [] }, compartidos: (S.db && S.db.compartidos) || { suscribir: () => () => {} }, rpc: async () => null });
  S.db.grupos.invitaciones = async () => [];
  S.db.grupos.listar = async () => { throw new Error('sin red'); }; // la prueba no recarga los grupos: se quedan los de arriba
  const abrir = async (gid) => { H.grupoVer([gid]); await sleep(60); };
  // grupo con varias deudas: resumen y botón para ver quién
  await abrir('g1');
  ok(!!doc.querySelector('#sheetHost .jv-sit') && /Te deben 20,00/.test(sh()), 'Tu situación: una sola tarjeta «Te deben 20,00 €»');
  ok(!!doc.querySelector('#sheetHost .jv-sit [data-click="grupoTab|saldos"]'), 'con varias deudas: «Ver quién y saldar» lleva a Saldos');
  const tabs = [...doc.querySelectorAll('#sheetHost .jv-tabs button')].map((b) => b.textContent.trim());
  ok(tabs.join('|') === 'Gastos|Saldos|Más', 'pestañas: Gastos | Saldos | Más');
  ok(!doc.querySelector('#sheetHost .jv-enlaces') && !/Metas y deudas compartidas/.test(sh()), 'en Gastos ya no salen «¿De dónde sale?» suelto ni las metas');
  ok(!!doc.querySelector('#sheetHost .jv-gtot-pie') && /Entre todos/.test(sh()), 'el total va al final de la lista');
  H.grupoTab(['saldos']); await sleep(20);
  ok(!/Cada grupo se cierra por su cuenta/.test(sh()) && /Para quedar en paz/.test(sh()), 'Saldos sin el texto explicativo');
  H.grupoTab(['mas']); await sleep(20);
  ok(/Planes y tareas|Metas y deudas compartidas/.test(sh()) && /¿De dónde sale cada cifra\?/.test(sh()), '«Más»: planes, metas y «¿De dónde sale?»');
  if (doc.querySelector('#sheetHost [data-click="grupoTab|planes"]')) { H.grupoTab(['planes']); await sleep(20); ok(!!doc.querySelector('#sheetHost [data-click="grupoTab|mas"]'), 'Planes tiene «‹ Más» para volver'); }
  // grupo de dos con alguien sin app: una deuda, «Me ha pagado» y «Pedir»
  H.closeSheet([]); await sleep(300); await abrir('g2');
  ok(/Marta te debe/.test(sh()) && /10,00/.test(sh()), 'una deuda: «Marta te debe 10,00 €»');
  ok(!!doc.querySelector('#sheetHost .jv-sit [data-click^="saldarAbrir"]') && !!doc.querySelector('#sheetHost .jv-sit [data-click^="personaVer"]'), 'con sus botones «Me ha pagado» y «Pedir»');
  ok(!!doc.querySelector('#sheetHost .jv-sit [data-click^="origenVer"]'), 'tocar la cifra explica de dónde sale');
  // grupo en el que estás solo
  H.closeSheet([]); await sleep(300); await abrir('g3');
  ok(/Aún estás solo/.test(sh()) && /Añadir gente/.test(sh()), 'solo en el grupo: «Añadir gente»');
  // Ajustes: Miembros con «Añadir» e «Invitar» antes que reparto y permisos
  H.grupoAjustes(['g1']); await sleep(60);
  const t = sh(), iM = t.indexOf('Miembros'), iInv = t.indexOf('Invitar a gente nueva'), iRep = t.indexOf('Reparto habitual'), iPer = t.indexOf('Quién puede cambiar'), iNom = t.indexOf('Tu nombre en este grupo');
  ok(iM >= 0 && iInv > iM && iRep > iInv && iPer > iRep && iNom > iPer, 'Ajustes: Miembros → Invitar → Reparto → Quién puede cambiar → Tu nombre');
  // «Antes»: la pantalla de grupo de antes
  H.closeSheet([]); await sleep(300); S.verAnterior = Object.assign({}, S.verAnterior, { juntos: 2 }); await abrir('g1');
  ok(!doc.querySelector('#sheetHost .jv-sit') && !!doc.querySelector('#sheetHost .jv-tuyo'), '«Antes»: la pantalla de grupo anterior');
  process.exit(fails ? 1 : 0);
})();

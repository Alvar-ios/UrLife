// Juntos v3 (23/10/2026, docs/14 B1 y B3): círculos por persona o por grupo y la actividad arriba con lo nuevo marcado. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }], vistoJuntos: '2026-10-10T00:00:00.000Z' }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S, c = () => doc.querySelector('#content');
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null, compartidos: (S.db && S.db.compartidos) || {} });
  const m = (u, n) => ({ user_id: u, nombre: n, rol: 'miembro' });
  S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana'), m('uB', 'Bea')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana'), m('uB', 'Bea')] },
    { id: 'g2', nombre: 'Viaje Lisboa', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uC', 'Carlos')], todos: [m('uYo', 'Lucía'), m('uC', 'Carlos')] }];
  S.compartidos = [
    { id: 'k1', grupoId: 'g1', tipo: 'Gasto', descripcion: 'Compra', importe: 90, pagadoPor: 'uYo', reparto: { uYo: 30, uA: 30, uB: 30 }, modo: 'igual', creadoPor: 'uYo', createdAt: '2026-10-05T10:00:00.000Z', fecha: '2026-10-05' },
    { id: 'k2', grupoId: 'g1', tipo: 'Gasto', descripcion: 'Luz', importe: 60, pagadoPor: 'uA', reparto: { uYo: 20, uA: 20, uB: 20 }, modo: 'igual', creadoPor: 'uA', createdAt: '2026-10-12T10:00:00.000Z', fecha: '2026-10-12' },
    { id: 'k3', grupoId: 'g2', tipo: 'Gasto', descripcion: 'Hotel', importe: 200, pagadoPor: 'uC', reparto: { uYo: 100, uC: 100 }, modo: 'igual', creadoPor: 'uC', createdAt: '2026-10-15T10:00:00.000Z', fecha: '2026-10-15' }];
  H.goTab(['juntos']); await sleep(40);
  const t = c().textContent;
  ok(/Debes\s*100,00/.test(t) && /Te deben\s*40,00/.test(t), 'arriba: «Debes 100 €» y «Te deben 40 €» (todo sumado)');
  const circ = [...doc.querySelectorAll('.jv3-circ .jv-c')], nom = circ.map((x) => x.querySelector('.ins-l1').textContent);
  ok(nom.join(',') === 'Carlos,Bea,Ana', 'círculos de personas: primero quien más dinero mueve y al final quien está en paz (' + nom.join(',') + ')');
  ok(circ[0].classList.contains('malo') && /le debes/.test(circ[0].textContent) && /100 €/.test(circ[0].textContent), 'Carlos: aro rojo, «100 €» y «le debes»');
  ok(circ[1].classList.contains('bueno') && /te debe/.test(circ[1].textContent), 'Bea: aro verde y «te debe»');
  ok(circ[2].classList.contains('paz') && /en paz/.test(circ[2].textContent) && !circ[2].querySelector('.ins-aro-v'), 'Ana: en paz, en gris y sin aro lleno');
  ok(circ.every((x) => x.querySelector('.jv-c-cara .cara')), 'cada círculo lleva la cara de la persona');
  ok(!doc.querySelector('.jv-ficha') && !doc.querySelector('.jv-personas'), 'ya no salen las fichas «Debes / Te deben» ni la lista de personas');
  circ[0].click(); await sleep(20);
  ok(/Carlos/.test(doc.querySelector('#sheetHost').textContent) && /Saldar/.test(doc.querySelector('#sheetHost').textContent), 'tocar un círculo abre la hoja de la persona con «Saldar»');
  H.closeSheet([]); await sleep(300);
  // actividad arriba, con lo nuevo
  const tit = [...doc.querySelectorAll('.section-title')].map((x) => x.textContent);
  ok(/^Actividad/.test(tit[0] || ''), 'la actividad es el primer bloque después de la cabecera');
  ok(/2 nuevas/.test(tit[0] || '') && doc.querySelectorAll('.jv-a.nueva').length === 2 && doc.querySelectorAll('.jv-a.nueva .jv-punto').length === 2, '«2 nuevas»: lo de Ana y Carlos después de tu última visita, con su punto');
  ok(e.store.cfg.app.vistoJuntos === '2026-10-15T10:00:00.000Z', 'al entrar se marca como visto, pero lo nuevo se sigue marcando durante la visita');
  const miCara = [...doc.querySelectorAll('.jv-a')].find((x) => /Apuntaste/.test(x.textContent));
  ok(miCara && miCara.querySelector('.cara').textContent === 'L', 'tu propia cara lleva tu inicial (L), no una «T»');
  // grupos
  H.juntosVer(['grupos']); await sleep(20);
  const gn = [...doc.querySelectorAll('.jv3-circ .jv-c')].map((x) => x.querySelector('.ins-l1').textContent + ':' + x.querySelector('.ins-l2').textContent);
  ok(gn.join('|') === 'Viaje Lisboa:debes|Piso:te deben', 'Grupos: tu saldo en cada grupo (' + gn.join('|') + ')');
  ok(doc.querySelector('.jv-c-gr') && /VL/.test(doc.querySelector('.jv-c-gr').textContent), 'el grupo lleva sus iniciales');
  doc.querySelector('.jv3-circ .jv-c').click(); await sleep(20);
  ok(/Viaje Lisboa/.test(doc.querySelector('#sheetHost').textContent), 'tocar un grupo lo abre');
  H.closeSheet([]); await sleep(300);
  // versiones: «22 oct» sigue con la lista
  S.verAnterior = Object.assign(S.verAnterior || {}, { juntos: 1 }); A.render(); await sleep(20);
  ok(doc.querySelector('.jv-ficha') && !doc.querySelector('.jv3-circ'), '«22 oct» enseña Juntos con la lista de personas');
  S.verAnterior.juntos = 0; A.render(); await sleep(20);
  ok(doc.querySelector('.jv3-circ'), 'y «Nueva» vuelve a los círculos');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

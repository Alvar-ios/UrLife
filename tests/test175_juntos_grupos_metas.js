// Fase 14 (13/11/2026): Juntos con Grupos y Personas separados y ordenados por uso, y todas las aportaciones de una meta.
// Datos inventados (nombres de pila sueltos, importes de ejemplo). Fechas relativas a hoy para que no caduque.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hace = (n) => { const d = new Date(); d.setUTCHours(12, 0, 0, 0); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const m = (u, n) => ({ user_id: u, nombre: n, rol: 'miembro' });
const G = (id, nombre, tipo, ms) => ({ id, nombre, tipo, alias: {}, miembros: ms, todos: ms });
const C = (id, g, pag, imp, rep, dias, tipo) => ({ id, grupoId: g, fecha: hace(dias), tipo: tipo || 'Gasto', categoria: 'Casa', descripcion: id, importe: imp, pagadoPor: pag, reparto: rep, modo: 'igual', creadoPor: pag, createdAt: hace(dias) + 'T10:00:00.000Z' });
const dinero = (v) => Number(String(v).replace(/[^\d,-]/g, '').replace(',', '.'));

(async () => {
  /* ---------- 1. Juntos: Grupos y Personas a la vez, cada uno con su forma, los más usados primero ---------- */
  {
    const e = makeEnv({ cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }] }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S;
    S.user = Object.assign({}, S.user, { id: 'uYo' });
    S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null, compartidos: (S.db && S.db.compartidos) || {} });
    const yo = m('uYo', 'Lucía');
    S.grupos = [
      G('gViejo', 'Viaje antiguo', 'grupo', [yo, m('uA', 'Ana'), m('uB', 'Bea')]), // mucho uso, pero hace 4 meses
      G('gPiso', 'Piso', 'grupo', [yo, m('uA', 'Ana'), m('uC', 'Carlos')]), // 3 gastos recientes
      G('gPadel', 'Pádel', 'grupo', [yo, m('uD', 'Dani')]), // 1 gasto reciente, el más nuevo
      G('gCena', 'Cenas', 'grupo', [yo, m('uE', 'Eva')]), // 1 gasto reciente, más antiguo que Pádel
      G('gNada', 'Sin estrenar', 'grupo', [yo, m('uF', 'Fran')]),
      G('d1', 'Lucía y Gema', 'directo', [yo, m('uG', 'Gema')])]; // «solo vosotras dos»: es una persona
    S.compartidos = [
      C('v1', 'gViejo', 'uYo', 30, { uYo: 10, uA: 10, uB: 10 }, 120), C('v2', 'gViejo', 'uYo', 30, { uYo: 10, uA: 10, uB: 10 }, 121),
      C('v3', 'gViejo', 'uYo', 30, { uYo: 10, uA: 10, uB: 10 }, 122), C('v4', 'gViejo', 'uYo', 30, { uYo: 10, uA: 10, uB: 10 }, 123),
      C('p1', 'gPiso', 'uC', 30, { uYo: 10, uA: 10, uC: 10 }, 5), C('p2', 'gPiso', 'uC', 30, { uYo: 10, uA: 10, uC: 10 }, 10), C('p3', 'gPiso', 'uYo', 30, { uYo: 10, uA: 10, uC: 10 }, 15),
      C('pa1', 'gPadel', 'uD', 20, { uYo: 10, uD: 10 }, 1),
      C('ce1', 'gCena', 'uYo', 40, { uYo: 20, uE: 20 }, 30),
      C('dg1', 'd1', 'uG', 8, { uYo: 4, uG: 4 }, 2), C('dg2', 'd1', 'uYo', 8, { uYo: 4, uG: 4 }, 3)];
    const saldoAntes = JSON.stringify(['gViejo', 'gPiso', 'gPadel', 'gCena'].map((g) => A.miSaldo(g)));
    H.goTab(['juntos']); await sleep(40);
    const tit = [...doc.querySelectorAll('#content .section-title')].map((x) => x.textContent);
    ok(/^Grupos/.test(tit[0] || '') && /^Personas/.test(tit[1] || ''), 'Juntos: título «Grupos» y debajo «Personas», a la vez (sin selector)');
    ok(!doc.querySelector('.jv3-seg'), 'ya no hay que elegir «Personas | Grupos»');
    const gs = [...doc.querySelectorAll('.jv4-grupos .jv4-g')], gn = gs.map((x) => x.querySelector('.jv4-g-n').textContent.replace('Grupo: ', ''));
    ok(gn.join(',') === 'Piso,Pádel,Cenas,Viaje antiguo', 'grupos por uso de los últimos 90 días; si empatan, el de lo último más reciente; se ven 4 (' + gn.join(',') + ')');
    ok(gs.every((x) => x.querySelector('.jv4-g-ic svg') && !x.querySelector('.ins-aro') && /Grupo/.test(x.querySelector('.sr-only').textContent)) && !gn.includes('Gema'), 'los grupos son tarjetas con icono de grupo (no círculos) y el lector de pantalla dice «Grupo»; la conversación a solas con Gema no es un grupo');
    const piso = gs[0];
    ok(/3 personas/.test(piso.textContent) && /en paz/.test(piso.textContent) && piso.classList.contains('paz'), 'Piso: «3 personas» y «en paz» (pagué 30 y debo 20 a Carlos, me deben 20)');
    const cenas = gs[2];
    ok(/te deben/.test(cenas.textContent) && /20,00/.test(cenas.textContent) && cenas.classList.contains('bueno'), 'Cenas: «20,00 € te deben», en verde');
    const vt = doc.querySelector('.jv4-grupos-sec .jv4-todos');
    ok(vt && /Ver todos \(5\)/.test(vt.textContent), 'con 5 grupos: «Ver todos (5)»');
    vt.click(); await sleep(20);
    const gn2 = [...doc.querySelectorAll('.jv4-grupos .jv4-g')].map((x) => x.querySelector('.jv4-g-n').textContent.replace('Grupo: ', ''));
    ok(gn2.length === 5 && gn2[4] === 'Sin estrenar' && /sin gastos/.test(doc.querySelectorAll('.jv4-grupos .jv4-g')[4].textContent), 'al tocarlo salen los 5; el que no tiene gastos, al final y «sin gastos»');
    ok(/Ver menos/.test(doc.querySelector('.jv4-grupos-sec .jv4-todos').textContent), 'y el botón pasa a «Ver menos»');
    const ps = [...doc.querySelectorAll('.jv4-personas .jv-c')], pn = ps.map((x) => x.querySelector('.ins-l1').textContent);
    // Ana: 3 recientes (Piso) · Carlos: 3 (Piso) · Gema: 2 · Dani: 1 (ayer) · Eva: 1 (hace 30 días) · Bea: 0 (hace 4 meses) · Fran: nada
    ok(pn.join(',') === 'Ana,Carlos,Gema,Dani,Eva,Bea,Fran', 'personas por uso; si empatan, lo último más reciente y luego quien tiene más pendiente (' + pn.join(',') + ')');
    ok(ps.every((x) => x.querySelector('.ins-aro') && x.querySelector('.jv-c-cara .cara')), 'las personas son círculos con su cara (avatar redondo)');
    const gema = ps.find((x) => /Gema/.test(x.textContent));
    const colorG = gema.querySelector('.cara').getAttribute('style') || '';
    ok(/background/.test(colorG), 'cada persona con su color de siempre (colorPersona)');
    ok(saldoAntes === JSON.stringify(['gViejo', 'gPiso', 'gPadel', 'gCena'].map((g) => A.miSaldo(g))), 'las cifras de los grupos no cambian');
    doc.querySelector('.jv4-grupos .jv4-g').click(); await sleep(20);
    ok(/Piso/.test(doc.querySelector('#sheetHost').textContent), 'tocar un grupo lo abre');
    H.closeSheet([]); await sleep(300);
  }

  /* ---------- 2. Muchas personas: las 8 más usadas y «Ver todas» ---------- */
  {
    const e = makeEnv({ cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }] }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S;
    S.user = Object.assign({}, S.user, { id: 'uYo' });
    S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null, compartidos: (S.db && S.db.compartidos) || {} });
    const nombres = ['Ana', 'Bea', 'Carlos', 'Dani', 'Eva', 'Fran', 'Gema', 'Hugo', 'Iris', 'Juan'];
    S.grupos = [G('g1', 'Club', 'grupo', [m('uYo', 'Lucía')].concat(nombres.map((n, i) => m('u' + i, n))))];
    S.compartidos = [];
    nombres.forEach((n, i) => { for (let k = 0; k <= i; k++) S.compartidos.push(C('c' + i + '_' + k, 'g1', 'uYo', 10, { uYo: 5, ['u' + i]: 5 }, 3 + k)); }); // Juan es quien más usas
    H.goTab(['juntos']); await sleep(40);
    let pn = [...doc.querySelectorAll('.jv4-personas .jv-c')].map((x) => x.querySelector('.ins-l1').textContent);
    ok(pn.length === 8 && pn[0] === 'Juan' && pn[7] === 'Carlos' && !pn.includes('Ana'), 'se ven las 8 que más usas, de más a menos (' + pn.join(',') + ')');
    const vt = doc.querySelector('.jv4-personas-sec .jv4-todos');
    ok(vt && /Ver todas \(10\)/.test(vt.textContent), '«Ver todas (10)»');
    vt.click(); await sleep(20);
    pn = [...doc.querySelectorAll('.jv4-personas .jv-c')].map((x) => x.querySelector('.ins-l1').textContent);
    ok(pn.length === 10 && pn[9] === 'Ana' && doc.querySelector('.jv4-personas').classList.contains('todas'), 'al tocarlo salen las 10, en varias filas');
  }

  /* ---------- 3. Meta sencilla: todas las aportaciones, con total ---------- */
  {
    const movs = [];
    for (let i = 0; i < 12; i++) movs.push({ id: 'a' + i, tipo: 'Ahorro', categoria: 'Viaje', importe: 10 + i, fecha: hace(i * 7 + 1), descripcion: i === 0 ? 'Paga extra' : '', metaId: 'm1', cuentaId: i === 0 ? 'c1' : undefined });
    movs.push({ id: 'otro', tipo: 'Ahorro', categoria: 'Coche', importe: 999, fecha: hace(2), metaId: 'm2' }); // de otra meta: no cuenta
    movs.push({ id: 'gasto', tipo: 'Gasto', categoria: 'Casa', importe: 50, fecha: hace(2) });
    const e = makeEnv({ movs, version: { dinero: 0 }, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }], cuentas: [{ id: 'c1', nombre: 'Banco inventado' }],
      ahorro: [{ id: 'm1', nombre: 'Viaje', objetivo: 2000, yaAhorrado: 100 }, { id: 'm2', nombre: 'Coche', objetivo: 5000 }] }, meta: { onboarded: true } } });
    await sleep(150);
    const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost');
    const r = A.metasStats().find((x) => x.id === 'm1');
    H.metaVer(['m1']); await sleep(30);
    let filas = [...sh().querySelectorAll('.dm-aportes .dm-ap-f')];
    ok(/Aportaciones/.test(sh().textContent) && filas.length === 11, 'la hoja de la meta enseña «Aportaciones»: las 10 últimas y «Lo que ya tenías» (' + filas.length + ' filas)');
    ok(/Paga extra/.test(filas[0].textContent) && /Banco inventado/.test(filas[0].textContent) && /10,00/.test(filas[0].textContent), 'la más reciente primero, con su nota y su cuenta');
    const tot = dinero(sh().querySelector('.dm-ap-tot b').textContent);
    ok(Math.abs(tot - r.valor) < 0.005 && Math.abs(tot - (100 + 10 * 12 + 66)) < 0.005, 'el total aportado (' + tot + ') es igual a lo que lleva la meta (' + r.valor + ')');
    ok(!/999/.test(sh().querySelector('.dm-aportes').textContent), 'no se cuela lo de otra meta');
    const vt = sh().querySelector('.dm-ap-todas');
    ok(vt && /Ver todas \(12\)/.test(vt.textContent), '«Ver todas (12)»');
    vt.click(); await sleep(30);
    filas = [...sh().querySelectorAll('.dm-aportes .dm-ap-f')];
    const imps = filas.slice(0, 12).map((x) => dinero(x.querySelector('.dm-ap-v').textContent));
    ok(filas.length === 13 && imps.reduce((a, b) => a + b, 0) + 100 === tot, 'al tocarlo salen las 12 y «Lo que ya tenías»; suman el total');
    ok(imps.every((v, i) => i === 0 || v >= imps[i - 1]), 'de la más reciente a la más antigua');
    ok(!sh().querySelector('.dm-aportes .cara'), 'en una meta sencilla no sale quién (siempre eres tú)');
  }

  /* ---------- 4. Meta compartida: quién aportó, total igual al de la meta, y lo usado ---------- */
  {
    const e = makeEnv({ version: { dinero: 0 }, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }] }, meta: { onboarded: true } } });
    await sleep(120);
    const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S, sh = () => doc.querySelector('#sheetHost');
    S.user = Object.assign({}, S.user, { id: 'uYo' });
    S.grupos = [G('g1', 'Piso', 'grupo', [m('uYo', 'Lucía'), m('uA', 'Ana')])];
    S.objetivos = [{ id: 'o1', grupoId: 'g1', tipo: 'ahorro', nombre: 'Sofá', objetivo: 800, previo: 0, usos: [{ id: 'u1', fecha: hace(1), importe: 30 }] }, { id: 'o2', grupoId: 'g1', tipo: 'ahorro', nombre: 'Otra', objetivo: 100 }];
    S.aportes = [{ id: 'p1', objetivoId: 'o1', userId: 'uYo', tipo: 'Ahorro', importe: 50, fecha: hace(20) }, { id: 'p2', objetivoId: 'o1', userId: 'uA', tipo: 'Ahorro', importe: 120, fecha: hace(5) },
      { id: 'p3', objetivoId: 'o1', userId: 'uA', tipo: 'Ahorro', importe: 25.5, fecha: hace(40) }, { id: 'p4', objetivoId: 'o2', userId: 'uA', tipo: 'Ahorro', importe: 77, fecha: hace(3) }];
    const r = A.objStatsAny(S.objetivos[0]);
    H.metaVer(['g:o1']); await sleep(30);
    const filas = [...sh().querySelectorAll('.dm-aportes .dm-ap-f')];
    ok(filas.length === 3, 'meta compartida: sus 3 aportaciones (ni las de otra meta)');
    ok(/Ana/.test(filas[0].textContent) && /120,00/.test(filas[0].textContent) && filas[0].querySelector('.cara') && /Tú/.test(filas[1].textContent) && /50,00/.test(filas[1].textContent), 'dice quién aportó cada una (con su cara) y de la más reciente a la más antigua');
    const tot = dinero(sh().querySelector('.dm-ap-tot b').textContent), suma = filas.map((x) => dinero(x.querySelector('.dm-ap-v').textContent)).reduce((a, b) => a + b, 0);
    ok(Math.abs(tot - 195.5) < 0.005 && Math.abs(suma - tot) < 0.005 && Math.abs(tot - r.aportado) < 0.005, 'el total aportado (' + tot + ') es lo que suman las filas y lo aportado en la meta');
    const cu = sh().querySelector('.dm-ap-cuadre');
    ok(cu && /menos lo usado \(30,00/.test(cu.textContent) && new RegExp(String(r.valor.toFixed(2)).replace('.', ',')).test(cu.textContent), 'con dinero usado, explica que la meta lleva ' + r.valor + ' (' + (cu ? cu.textContent : '') + ')');
    ok(!/undefined|NaN|null/.test(sh().textContent), 'sin restos raros');
  }
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

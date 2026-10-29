// Calidad 29/10 (docs/23 §2): informes con usuario nuevo, semanas entre años, «tu mes» desde el cobro, metas compartidas, tono y coste. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const fijaFecha = (iso) => (w) => { const D = w.Date, t = new D(iso + 'T12:00:00').getTime(); class FD extends D { constructor(...a) { if (!a.length) super(t); else super(...a); } static now() { return t; } } w.Date = FD; };
const mv = (id, tipo, cat, imp, fecha) => ({ id, tipo, categoria: cat, importe: imp, fecha });
const raro = (t) => /NaN|undefined|null|Infinity|\[object/.test(t);
const V = { inicio: 0, balance: 0, tu: 0 };
(async () => {
  // 1) usuario nuevo sin datos
  { const e = makeEnv({ version: V, pre: fijaFecha('2026-11-02'), cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } }); await sleep(200);
    const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost').textContent;
    ok(!doc.querySelector('.inf-ini') && !raro(doc.getElementById('content').textContent), 'nuevo: sin aviso de informe y sin NaN/undefined en Inicio');
    let malos = []; for (const c of ['w:2026-10-26', 'm:2026-10', 't:2026-3', 'a:2025', 'a:2026']) { H.infVer([c]); await sleep(10); if (raro(sh())) malos.push(c); }
    ok(!malos.length, 'nuevo: ningún informe enseña NaN/undefined (' + malos + ')');
    H.infAjustes([]); await sleep(10); ok(!raro(sh()) && !/Los últimos/.test(sh()), 'nuevo: ajustes limpios, sin «Los últimos»');
    H.closeSheet([]); await sleep(300);
    ok(!e.store.cfg.app || !e.store.cfg.app.informes || !Object.keys(e.store.cfg.app.informes.vistos || {}).some((k) => k !== 'm:2026-10' && k !== 'w:2026-10-26' && k !== 't:2026-3' && k !== 'a:2025'), 'nuevo: solo guarda en config las claves abiertas'); }
  // 2) semana que cruza el año y mes de diciembre visto desde enero
  { const movs = [mv('a', 'Ingreso', 'Nómina', 1000, '2026-11-01'), mv('b', 'Gasto', 'Comida', 300, '2026-11-10'), mv('c', 'Ingreso', 'Nómina', 1000, '2026-12-01'), mv('d', 'Gasto', 'Comida', 80, '2026-12-30'), mv('f', 'Gasto', 'Ocio', 40, '2027-01-02')];
    const e = makeEnv({ movs, version: V, pre: fijaFecha('2027-01-05'), cfg: { app: { categoriasGasto: [{ nombre: 'Comida' }, { nombre: 'Ocio' }] }, meta: { onboarded: true } } }); await sleep(200);
    const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost').textContent;
    const av = (doc.querySelector('.inf-ini') || {}).textContent || '';
    ok(/Tu informe de 2026/.test(av), 'enero: el primer aviso es el del año 2026 (' + av.slice(0, 60) + ')');
    H.infVer(['w:2026-12-28']); await sleep(10);
    ok(/Gastaste 120/.test(sh()) && /28 dic/.test(sh()) && /3 ene/.test(sh()), 'semana 28 dic–3 ene suma los dos años');
    H.infVer(['a:2026']); await sleep(10); H.closeSheet([]); await sleep(300); H.goTab(['inicio']); await sleep(20);
    const av2 = (doc.querySelector('.inf-ini') || {}).textContent || '';
    ok(/de diciembre/.test(av2), 'tras ver el anual, el siguiente aviso es diciembre (' + av2.slice(0, 40) + ')');
    H.infVer(['m:2026-12']); await sleep(10);
    ok(/Diciembre cerró con/.test(sh()) && /noviembre/.test(sh()) && !raro(sh()), 'diciembre visto en enero, comparado con noviembre');
    H.closeSheet([]); await sleep(300); H.goTab(['inicio']); await sleep(20);
    ok(!doc.querySelector('.inf-ini'), 'vistos los dos: no queda aviso'); }
  // 3) «tu mes» desde el día 25: hoy 15 oct → el último cerrado es septiembre (25 ago–24 sep), no octubre
  { const movs = [mv('a', 'Ingreso', 'Nómina', 1000, '2026-08-25'), mv('b', 'Gasto', 'Comida', 100, '2026-09-20'), mv('c', 'Gasto', 'Comida', 999, '2026-09-26'), mv('d', 'Ingreso', 'Nómina', 1000, '2026-09-25')];
    const e = makeEnv({ movs, version: V, pre: fijaFecha('2026-10-15'), cfg: { app: { categoriasGasto: [{ nombre: 'Comida' }], mesInicio: { modo: 'cobro', dia: 25 } }, meta: { onboarded: true } } }); await sleep(200);
    const doc = e.doc, av = (doc.querySelector('.inf-ini') || {}).textContent || '';
    ok(/de septiembre/.test(av) && /\+900/.test(av), 'cobro el 25: aviso de septiembre con +900 (lo del 26 sep ya es octubre) (' + av.slice(0, 70) + ')'); }
  // 4) nómina: octubre aún «previsto» → no sale su mensual
  { const movs = [mv('n1', 'Ingreso', 'Nómina', 1500, '2026-08-28'), mv('n2', 'Ingreso', 'Nómina', 1500, '2026-09-30'), mv('g', 'Gasto', 'Otros', 10, '2026-10-02')];
    const e = makeEnv({ movs, version: V, pre: fijaFecha('2026-10-29'), cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], ingresos: ['Nómina'], cobros: [{ nombre: 'Nómina', importe: 1500, regla: { t: 'ultHabil' }, desde: '2026-06-01' }], mesInicio: { modo: 'cobro', dia: 28, nomina: 'Nómina' } }, meta: { onboarded: true } } }); await sleep(200);
    const av = (e.doc.querySelector('.inf-ini') || {}).textContent || '';
    ok(!/de octubre/.test(av), 'nómina: el mes en curso no se avisa como cerrado (' + av.slice(0, 40) + ')'); }
  // 5) meta compartida: «aportaste» debe ser solo lo mío
  { const movs = [mv('a', 'Ingreso', 'Nómina', 1000, '2026-09-01'), mv('a0', 'Ingreso', 'Nómina', 1000, '2026-08-01')];
    const e = makeEnv({ movs, version: V, pre: fijaFecha('2026-10-15'), cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } }); await sleep(200);
    const A = e.w.__APP__, S = A.S, H = A.H, sh = () => e.doc.querySelector('#sheetHost').textContent;
    S.user = Object.assign({}, S.user, { id: 'uYo' });
    S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [{ user_id: 'uYo' }, { user_id: 'uA' }], todos: [{ user_id: 'uYo' }, { user_id: 'uA' }] }];
    S.objetivos = [{ id: 'o1', grupoId: 'g1', tipo: 'ahorro', nombre: 'Viaje', objetivo: 2000 }];
    S.aportes = [{ id: 'p1', objetivoId: 'o1', userId: 'uYo', tipo: 'Ahorro', importe: 50, fecha: '2026-09-05' }, { id: 'p2', objetivoId: 'o1', userId: 'uA', tipo: 'Ahorro', importe: 400, fecha: '2026-09-06' }];
    H.infVer(['m:2026-09']); await sleep(10);
    ok(/Viaje: aportaste 50\s€/.test(sh()), 'meta compartida: «aportaste» cuenta solo lo tuyo (' + (sh().match(/Viaje:[^.]*/) || [''])[0] + ')'); }
  // 6) tono: una semana antigua no dice «esta semana»; un mes negativo no repite «−… en negativo»
  { const movs = [mv('a', 'Ingreso', 'Nómina', 100, '2026-08-01'), mv('b', 'Gasto', 'Otros', 300, '2026-08-03'), mv('c', 'Ingreso', 'Nómina', 50, '2026-07-01'), mv('e', 'Ingreso', 'Extra', 20, '2026-06-03')];
    const e = makeEnv({ movs, version: V, pre: fijaFecha('2026-10-15'), cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } }); await sleep(200);
    const H = e.w.__APP__.H, sh = () => e.doc.querySelector('#sheetHost').textContent;
    H.infVer(['w:2026-06-01']); await sleep(10); const t1 = (e.doc.querySelector('.inf-tit p') || {}).textContent || '';
    ok(!/esta semana/.test(t1), 'semana de junio sin gastos vista en octubre no dice «esta semana» (' + t1 + ')');
    H.infVer(['m:2026-08']); await sleep(10); const t2 = (e.doc.querySelector('.inf-tit p') || {}).textContent || '';
    ok(!/−[^,.]*en negativo/.test(t2), 'mes negativo sin «−200 € en negativo» (' + t2 + ')'); }
  // 7) coste: Inicio con 6000 movimientos
  { const movs = []; for (let i = 0; i < 6000; i++) { const d = new Date(Date.UTC(2023, 0, 1) + (i % 1400) * 864e5).toISOString().slice(0, 10); movs.push(mv('x' + i, i % 9 ? 'Gasto' : 'Ingreso', i % 9 ? 'Otros' : 'Nómina', 10 + (i % 50), d)); }
    const e = makeEnv({ movs, version: V, pre: fijaFecha('2026-10-15'), cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } }); await sleep(400);
    const A = e.w.__APP__; A.H.goTab(['inicio']); await sleep(20);
    const tm = () => { const t = Date.now(); for (let i = 0; i < 5; i++) A.render(); return (Date.now() - t) / 5; };
    const con = tm(); A.S.config = Object.assign({}, A.S.config, { informes: { on: { mes: false, anio: false } } }); const sin = tm();
    console.log('INFO repintar Inicio con 6000 movs: ' + con.toFixed(0) + ' ms con informes, ' + sin.toFixed(0) + ' ms sin');
    ok(con - sin < 150, 'el aviso de informes no encarece mucho Inicio (+' + (con - sin).toFixed(0) + ' ms)'); }
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

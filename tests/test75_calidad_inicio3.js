// Calidad · Inicio v3 (23/10/2026, docs/14-inicio-juntos.md): cifras de la tarjeta, «Tu Así vas», novedades de Juntos
// y aviso semanal de inversiones. Datos inventados (sin correos, importes ni nombres reales).
const { makeEnv, sleep } = require('./harness.js');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pend = (c, m) => console.log((c ? 'ARREGLADO (cambiar por ok) ' : 'PEND ') + m);
// fechas en hora local (como todayISO de la app): con toISOString fallan entre las 00:00 y las 02:00
const pad = (n) => String(n).padStart(2, '0');
const isoL = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const hace = (n) => { const x = new Date(); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - n); return isoL(x); };
const HOY = hace(0), MM = HOY.slice(0, 7);
const semanaISO = (iso) => { const [y, m, d] = iso.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d)), dia = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dia); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-S' + pad(Math.ceil(((t - y0) / 864e5 + 1) / 7)); };
const V0 = { tu: 0, agenda: 0, crear: 0, importe: 0, inicio: 0 };
const base = (extra) => ({ app: Object.assign({ categoriasGasto: [{ nombre: 'Súper', presupuesto: 300 }, { nombre: 'Ocio' }] }, extra || {}), meta: { onboarded: true } });
// cuenta las escrituras de configuración que llevan una clave concreta
const espiarCfg = (A) => { const log = []; const orig = A.S.db.doc.bind(A.S.db); A.S.db.doc = (p) => { const d = orig(p); return Object.assign({}, d, { update: (x) => { log.push(x); return d.update(x); } }); }; return log; };
const conJuntos = (A, uid) => {
  A.S.user = Object.assign({}, A.S.user, { id: uid || 'uA' });
  A.S.db.grupos = A.S.db.grupos || { listar: async () => ({ grupos: [], miembros: [] }) };
  A.S.db.rpc = A.S.db.rpc || (async () => null);
  A.S.grupos = [{ id: 'g1', nombre: 'Casa', tipo: 'grupo', miembros: [{ user_id: 'uA', nombre: 'Yo', rol: 'admin' }, { user_id: 'uB', nombre: 'Lucía', rol: 'miembro' }, { user_id: 'uC', nombre: 'Leo', rol: 'miembro' }] }];
};
const gastoComp = (id, por, creado, extra) => Object.assign({ id, grupoId: 'g1', tipo: 'Gasto', descripcion: 'Cena', categoria: 'Ocio', importe: 40, pagadoPor: por, reparto: { uA: 20, [por === 'uA' ? 'uB' : por]: 20 }, creadoPor: por, createdAt: creado, fecha: HOY }, extra || {});

(async () => {
  // ---------- 1. Usuario nuevo, sin datos ----------
  {
    const e = makeEnv({ movs: [], cfg: base(), version: V0 }); await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc, errores = []; e.w.console.error = (...a) => errores.push(a.join(' '));
    const log = espiarCfg(A);
    H.goTab(['inicio']); await sleep(30);
    ok(!doc.querySelector('.hk-cels') && !doc.querySelector('.ins-c') && !!doc.querySelector('#content'), 'usuario nuevo: Inicio sin cifras ni círculos y sin romper');
    ok(!log.some((x) => 'vistoJuntos' in x), 'sin Juntos cargado (compartidos aún sin llegar) no se escribe «vistoJuntos»');
    conJuntos(A); A.S.compartidos = [];
    for (let i = 0; i < 6; i++) { A.render(); await sleep(5); }
    H.goTab(['juntos']); await sleep(20); for (let i = 0; i < 6; i++) { A.render(); await sleep(5); }
    ok(log.filter((x) => 'vistoJuntos' in x).length <= 1, 'sin grupos ni gastos compartidos: «vistoJuntos» se guarda como mucho una vez (' + log.filter((x) => 'vistoJuntos' in x).length + ')');
    H.goTab(['inicio']); await sleep(20);
    ok(!doc.querySelector('.juntos-nov') && !errores.length, 'sin compartidos: ni aviso de Juntos ni errores (' + errores.slice(0, 2).join(' | ') + ')');
    H.asiVasAbrir([-1]); await sleep(10); H.asiVasSub(['meta']); await sleep(5);
    ok(/Aún no tienes metas/.test(doc.querySelector('#sheetHost').textContent), 'hoja «Tu Así vas» sin metas: «Aún no tienes metas.»');
    H.asiVasSub(['']); await sleep(5); await H.asiVasGuardar([]); await sleep(20);
    ok(e.store.cfg.app.asiVas == null, 'Listo sin cambiar nada: no se guarda nada raro (null = automático)');
  }

  // ---------- 2. Quien ya usa Juntos y abre la versión nueva por primera vez ----------
  {
    const e = makeEnv({ movs: [{ id: 'g1', tipo: 'Gasto', categoria: 'Súper', importe: 10, fecha: HOY }], cfg: base(), version: V0 }); await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc; conJuntos(A); const log = espiarCfg(A);
    A.S.compartidos = [gastoComp('c1', 'uB', '2026-09-01T10:00:00.000Z'), gastoComp('c2', 'uC', '2026-10-01T10:00:00.000Z'), gastoComp('c3', 'uA', '2026-10-02T10:00:00.000Z')];
    H.goTab(['inicio']); await sleep(30); A.render(); await sleep(20);
    ok(e.store.cfg.app.vistoJuntos === '2026-10-02T10:00:00.000Z', 'primera vez: lo antiguo se da por visto (vistoJuntos = lo último: ' + e.store.cfg.app.vistoJuntos + ')');
    ok(!doc.querySelector('.juntos-nov'), 'primera vez: lo antiguo NO sale como novedad');
    H.goTab(['juntos']); await sleep(10); for (let i = 0; i < 8; i++) { A.render(); await sleep(3); }
    ok(log.filter((x) => 'vistoJuntos' in x).length === 1, 'en Juntos, repintar muchas veces no vuelve a escribir (' + log.filter((x) => 'vistoJuntos' in x).length + ' escritura)');
    // llega algo nuevo de otra persona mientras estás en Inicio
    H.goTab(['inicio']); await sleep(10);
    A.S.compartidos = A.S.compartidos.concat([gastoComp('c4', 'uB', '2026-10-03T09:00:00.000Z', { descripcion: 'Luz' }), gastoComp('c5', 'uC', '2026-10-03T10:00:00.000Z', { descripcion: 'Agua' })]);
    A.render(); await sleep(10);
    const nov = doc.querySelector('.juntos-nov');
    ok(nov && /2 novedades en Juntos/.test(nov.textContent) && /Leo apuntó «Agua» y 1 más/.test(nov.textContent), 'dos novedades: «2 novedades en Juntos · Leo apuntó «Agua» y 1 más»');
    ok(nov && nov.querySelectorAll('.avatar').length === 2, 'con las caras de las dos personas');
    ok(log.filter((x) => 'vistoJuntos' in x).length === 1, 'estar en Inicio no marca lo nuevo como visto');
    // pago entre personas: no debe decir «apuntó «Liquidación»»
    A.S.compartidos = A.S.compartidos.concat([{ id: 'p1', grupoId: 'g1', tipo: 'Liquidación', categoria: 'Liquidación', descripcion: '', importe: 20, pagadoPor: 'uB', reparto: { uA: 20 }, creadoPor: 'uB', createdAt: '2026-10-04T10:00:00.000Z', fecha: HOY }]);
    e.store.cfg.app.vistoJuntos = '2026-10-03T23:00:00.000Z'; A.S.config.vistoJuntos = '2026-10-03T23:00:00.000Z';
    A.render(); await sleep(10);
    const t = (doc.querySelector('.juntos-nov') || {}).textContent || '';
    ok(!/Liquidación/.test(t) && !/tu parte/.test(t), 'un pago de otra persona no sale como «apuntó «Liquidación» · tu parte …» (sale: «' + t.replace(/\s+/g, ' ').trim() + '»)');
  }

  // ---------- 3. «Tu Así vas»: círculos fijos sin datos, cosas borradas, configuración rota ----------
  {
    const movs = [{ id: 'g1', tipo: 'Gasto', categoria: 'Súper', importe: 20, fecha: HOY }];
    const e = makeEnv({ movs, cfg: base({ asiVas: ['sube', 'dia', 'ahorro', 'meta:no-existe', 'cat:Borrada'] }), version: V0 }); await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc, errores = []; e.w.console.error = (...a) => errores.push(a.join(' '));
    H.goTab(['inicio']); await sleep(20);
    const circ = [...doc.querySelectorAll('.ins-c')].map((x) => ({ v: x.querySelector('b').textContent, l1: x.querySelector('.ins-l1').textContent, l2: x.querySelector('.ins-l2').textContent, vacio: x.classList.contains('vacio') }));
    ok(circ.length === 5 && !errores.length, 'cinco círculos fijos aunque no haya datos, sin errores');
    ok(circ.slice(0, 4).every((x) => x.v === '—' && x.vacio && x.l2 === 'sin datos'), 'los que no tienen datos (o la meta borrada) salen con «—» y «sin datos»');
    const malos = circ.filter((x) => /^(Lo|Al|Una|Días)$/.test(x.l1)).map((x) => x.l1);
    ok(!malos.length, 'el nombre de un círculo sin datos se entiende (no «Lo», «Al» o «Una» sueltos): ' + circ.map((x) => x.l1 + ' ' + x.l2).join(' | '));
    pend(circ[4].vacio || circ[4].v === '—', 'leve: una categoría borrada sigue saliendo como «0 € · Borrada» (mejor «—» o automático): ' + circ[4].v + ' ' + circ[4].l1);
    H.insVer([3]); await sleep(10);
    const pop = doc.querySelector('#popupBackdrop'); ok(pop && /Aún no hay datos/.test(pop.textContent) && pop.querySelector('.ins-cambiar'), 'pop-up del círculo vacío: «Aún no hay datos» y «Cambiar este círculo»');
    pop.querySelectorAll('.actions .btn')[1].click(); await sleep(10);
    ok(!doc.querySelector('#popupBackdrop') && A.form() && A.form().kind === 'asiVas' && A.form().sel === 3, '«Ver» en un círculo vacío abre la hoja en ese círculo (el 4)');
    // intercambio, avance y el último círculo
    H.asiVasHueco([4]); await sleep(5); H.asiVasElegir(['sube']); await sleep(5);
    ok(A.form().v[4] === 'sube' && A.form().v[0] === 'cat:Borrada' && A.form().sel === 4, 'elegir en el 5 algo del 1 los intercambia y se queda en el 5');
    const usados = [...doc.querySelectorAll('#sheetHost .av-op.usado')].map((x) => x.textContent);
    ok(usados.some((x) => /Ya está en el círculo 2/.test(x)), 'la lista avisa «Ya está en el círculo N»');
    H.asiVasElegir(['auto']); await sleep(5); H.asiVasHueco([0]); await sleep(5); H.asiVasElegir(['auto']); await sleep(5);
    ok(A.form().v.filter((x) => x === 'auto').length === 2 && A.form().v[1] === 'dia', 'se pueden poner varios «Auto» sin mover los demás');
    await H.asiVasGuardar([]); await sleep(20);
    ok(JSON.stringify(e.store.cfg.app.asiVas) === JSON.stringify(['auto', 'dia', 'ahorro', 'meta:no-existe', 'auto']) && !doc.querySelector('#sheetBackdrop:not([data-cerrando])'), '«Listo» guarda y cierra la hoja');
  }
  {
    // configuración rota o antigua: no rompe y cae en automático
    for (const malo of [['sube'], 'texto', [null, 'xyz', 'auto', 'auto', 'auto'], 5]) {
      const e = makeEnv({ movs: [{ id: 'g1', tipo: 'Gasto', categoria: 'Súper', importe: 20, fecha: HOY }, { id: 'i1', tipo: 'Ingreso', categoria: 'Nómina', importe: 900, fecha: HOY }], cfg: base({ asiVas: malo }), version: V0 }); await sleep(60);
      const A = e.w.__APP__, errores = []; e.w.console.error = (...a) => errores.push(a.join(' '));
      A.H.goTab(['inicio']); await sleep(15); A.H.asiVasAbrir([-1]); await sleep(5);
      ok(!errores.length && e.doc.querySelectorAll('#sheetHost .av-hueco').length === 5 && e.doc.querySelectorAll('.ins-c').length >= 1, 'asiVas = ' + JSON.stringify(malo) + ': Inicio y la hoja funcionan');
    }
  }

  // ---------- 4. Tarjeta del mes: «tu mes» desde el día de cobro, deudas y adónde lleva cada cifra ----------
  {
    const cfgCobro = base({ mesInicio: { modo: 'cobro', dia: 25 } });
    const e0 = makeEnv({ movs: [], cfg: cfgCobro, version: V0 }); await sleep(60);
    const r = e0.w.__APP__.rangoMes(e0.w.__APP__.mesActual().y, e0.w.__APP__.mesActual().m);
    const antes = (() => { const [y, m, d] = r.desde.split('-').map(Number); return isoL(new Date(y, m - 1, d - 1, 12)); })();
    const movs = [{ id: 'g1', tipo: 'Gasto', categoria: 'Súper', importe: 77, fecha: r.desde }, { id: 'g0', tipo: 'Gasto', categoria: 'Súper', importe: 1000, fecha: antes },
      { id: 'i1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: r.desde }, { id: 'd1', tipo: 'Deuda', categoria: 'Coche', importe: 120, fecha: r.desde }];
    const e = makeEnv({ movs, cfg: cfgCobro, version: V0 }); await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc; H.goTab(['inicio']); await sleep(20);
    const cels = [...doc.querySelectorAll('.hk-cel')];
    const txt = cels.map((x) => x.textContent.replace(/\s+/g, ' '));
    ok(cels.length === 5 && doc.querySelector('.hk-cels.cinco') && /Deudas.*120/.test(txt[4]), 'con un pago de deuda este mes salen 5 cifras (Deudas 120 €)');
    ok(/Gastos.*77/.test(txt[1]) && !/1\.077/.test(txt[1]), '«Gastos» cuenta «tu mes» desde el día de cobro (' + r.desde + '), no el mes del calendario: ' + txt[1]);
    ok(cels.every((x) => /: /.test(x.getAttribute('aria-label') || '')), 'cada cifra tiene aria-label («Gastos: 77,00 €»)');
    cels[4].click(); await sleep(10);
    ok(A.S.tab === 'movimientos' && A.S.movFiltroTipo === 'Deuda' && /m:/.test(A.S.movPeriodo || ''), 'tocar «Deudas» abre los pagos de deuda del mes');
    H.goTab(['inicio']); await sleep(10); doc.querySelectorAll('.hk-cel')[0].click(); await sleep(10);
    ok(A.S.movFiltroTipo === 'Ingreso', 'tocar «Ingresos» abre los ingresos');
    // mes sin deudas → 4 cifras
    const e2 = makeEnv({ movs: movs.filter((x) => x.tipo !== 'Deuda'), cfg: cfgCobro, version: V0 }); await sleep(60);
    e2.w.__APP__.H.goTab(['inicio']); await sleep(15);
    ok(e2.doc.querySelectorAll('.hk-cel').length === 4 && !e2.doc.querySelector('.hk-cels.cinco'), 'sin pagos de deuda: 4 cifras');
  }

  // ---------- 5. Aviso semanal de inversiones ----------
  const serie = (dias, precioDe) => { const s = []; for (let i = dias; i >= 0; i--) s.push([hace(i), precioDe(i)]); return s; };
  const conHist = (A, mv, precios) => { const desde = mv.slice().sort((a, b) => (a.fecha < b.fecha ? -1 : 1))[0].fecha; A.S.historico = { ts: Date.now(), clave: 'FND1|' + desde, series: { FND1: precios } }; };
  {
    // a) solo meter dinero (precio quieto): no es una subida
    const mv = [{ id: 'v1', tipo: 'Inversión', categoria: 'Fondo', activoId: 'FND1', participaciones: 10, importe: 1000, fecha: hace(30) },
      { id: 'v2', tipo: 'Inversión', categoria: 'Fondo', activoId: 'FND1', participaciones: 10, importe: 1000, fecha: hace(2) }];
    const e = makeEnv({ movs: mv, cfg: base(), version: V0 }); await sleep(80);
    const A = e.w.__APP__; conHist(A, mv, serie(40, () => 100)); A.H.goTab(['inicio']); await sleep(20);
    const t = e.doc.querySelector('#content').textContent;
    ok(!/Tus inversiones: \+/.test(t), 'meter 1.000 € esta semana (precio igual) NO sale como subida');
    // b) el precio sube un 6 % en la semana con 2.000 € dentro: sí avisa
    conHist(A, mv, serie(40, (i) => (i <= 6 ? 106 : 100))); A.render(); await sleep(15);
    const fila = [...e.doc.querySelectorAll('.dia-fila')].find((x) => /Tus inversiones/.test(x.textContent));
    ok(fila && /\+6 % esta semana/.test(fila.textContent) && /\+120,00/.test(fila.textContent), 'sube un 6 % (120 €): aviso «Tus inversiones: +6 % esta semana · +120,00 €» (' + (fila ? fila.textContent.replace(/\s+/g, ' ') : 'no sale') + ')');
    // c) al tocarlo se da por visto esta semana
    A.H.invAvisoVer([]); await sleep(20);
    ok(e.store.cfg.app.invAvisoVisto === semanaISO(HOY) && A.S.tab === 'dinero', 'al tocarlo lleva a Inversiones y guarda la semana (' + e.store.cfg.app.invAvisoVisto + ')');
    A.H.goTab(['inicio']); await sleep(15);
    ok(![...e.doc.querySelectorAll('.dia-fila')].some((x) => /Tus inversiones/.test(x.textContent)), 'y ya no sale más esa semana');
  }
  {
    // d) +6 % pero solo 6 €: no avisa (hace falta ±3 % y ±50 €)
    const mv = [{ id: 'v1', tipo: 'Inversión', categoria: 'Fondo', activoId: 'FND1', participaciones: 1, importe: 100, fecha: hace(30) }];
    const e = makeEnv({ movs: mv, cfg: base(), version: V0 }); await sleep(80);
    const A = e.w.__APP__; conHist(A, mv, serie(40, (i) => (i <= 6 ? 106 : 100))); A.H.goTab(['inicio']); await sleep(20);
    ok(![...e.doc.querySelectorAll('.dia-fila')].some((x) => /Tus inversiones/.test(x.textContent)), '+6 % pero solo 6 €: sin aviso');
    // e) bajada fuerte
    conHist(A, [{ fecha: hace(30) }], serie(40, (i) => (i <= 6 ? 50 : 100))); A.S.movimientos.find((x) => x.id === 'v1').participaciones = 10; A.render(); await sleep(15);
    const f = [...e.doc.querySelectorAll('.dia-fila')].find((x) => /Tus inversiones/.test(x.textContent));
    ok(f && /−50 %/.test(f.textContent) && f.classList.contains('mal'), 'bajada del 50 %: aviso en rojo con «−50 %»');
  }
  {
    // f) sin precios guardados (historico sin pedir): pide el histórico una sola vez aunque se repinte mucho
    let pedidos = 0;
    const pre = (w) => { w.SUPABASE_CONFIG = { url: 'https://ejemplo.invalid', anonKey: 'prueba' }; w.Auth.getSession = async () => ({ access_token: 't' });
      w.fetch = async (u, o) => { const b = JSON.parse(o.body || '{}'); if (b.accion === 'historico') { pedidos++; await new Promise((r) => setTimeout(r, 30)); return { ok: true, status: 200, json: async () => ({ series: { FND1: serie(40, () => 100) } }) }; } return { ok: true, status: 200, json: async () => ({ valores: {} }) }; }; };
    const mv = [{ id: 'v1', tipo: 'Inversión', categoria: 'Fondo', activoId: 'FND1', participaciones: 10, importe: 1000, fecha: hace(30) }];
    const e = makeEnv({ movs: mv, cfg: base(), version: V0, pre }); await sleep(80);
    const A = e.w.__APP__, errores = []; e.w.console.error = (...a) => errores.push(a.join(' '));
    A.H.goTab(['inicio']); for (let i = 0; i < 10; i++) { A.render(); await sleep(4); } await sleep(120); for (let i = 0; i < 5; i++) { A.render(); await sleep(4); }
    ok(pedidos === 1 && !errores.length, 'Inicio pide el histórico de precios una sola vez (' + pedidos + ' veces)');
    // con error del servidor: como mucho otra vez al minuto, no en bucle
    pedidos = 0; e.w.fetch = async () => { pedidos++; return { ok: false, status: 500, json: async () => ({}) }; }; A.S.historico = null;
    for (let i = 0; i < 10; i++) { A.render(); await sleep(10); } await sleep(80); for (let i = 0; i < 10; i++) { A.render(); await sleep(5); }
    ok(pedidos === 1, 'si el servidor falla, no lo vuelve a pedir en bucle (' + pedidos + ' veces)');
  }
  {
    // g) inversiones sin precio (sin activo vinculado): ni círculo ni aviso, sin errores
    const e = makeEnv({ movs: [{ id: 'v1', tipo: 'Inversión', categoria: 'Fondo', importe: 500, fecha: HOY }, { id: 'i1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1000, fecha: HOY }], cfg: base({ asiVas: ['inv', 'auto', 'auto', 'auto', 'auto'] }), version: V0 }); await sleep(80);
    const A = e.w.__APP__, errores = []; e.w.console.error = (...a) => errores.push(a.join(' ')); A.H.goTab(['inicio']); await sleep(20);
    const c1 = e.doc.querySelector('.ins-c');
    ok(!errores.length && c1 && /—/.test(c1.textContent) && /Inversiones/.test(c1.textContent), 'inversiones sin precio: el círculo «Inversiones» sale con «—», sin errores');
  }

  // ---------- 6. Accesibilidad básica ----------
  {
    const movs = [{ id: 'i1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1800, fecha: HOY }, { id: 'g1', tipo: 'Gasto', categoria: 'Súper', importe: 50, fecha: HOY }];
    const e = makeEnv({ movs, cfg: base(), version: V0 }); await sleep(80);
    const A = e.w.__APP__, doc = e.doc; A.H.goTab(['inicio']); await sleep(20);
    ok([...doc.querySelectorAll('.ins-c')].every((x) => (x.getAttribute('aria-label') || '').length > 10), 'cada círculo de «Así vas» se lee entero con lector de pantalla');
    A.H.asiVasAbrir([-1]); await sleep(10);
    const tabs = [...doc.querySelectorAll('#sheetHost .av-hueco')];
    ok(tabs.filter((x) => x.getAttribute('aria-selected') === 'true').length === 1, 'hoja: un solo círculo marcado como elegido (aria-selected)');
    const opOn = doc.querySelector('#sheetHost .av-op.on');
    pend(opOn && (opOn.getAttribute('aria-pressed') === 'true' || opOn.getAttribute('aria-checked') === 'true'), 'leve: la opción elegida de la lista no lo dice al lector de pantalla (falta aria-pressed o aria-checked)');
  }

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

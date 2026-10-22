// Inicio v3 (22/10/2026, docs/14-inicio-juntos.md): importes del mes, «Así vas» con iconos y a tu gusto, novedades de Juntos. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const hoy = new Date(), d = (n) => { const x = new Date(hoy); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); }, mm = d(0).slice(0, 7);
  const movs = [
    { id: 'i1', tipo: 'Ingreso', categoria: 'Nómina', importe: 2000, fecha: mm + '-01' },
    { id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 120, fecha: d(0) },
    { id: 'g2', tipo: 'Gasto', categoria: 'Ocio', importe: 30, fecha: d(0) },
    { id: 'a1', tipo: 'Ahorro', categoria: 'Viaje', importe: 150, fecha: d(0) },
    { id: 'v1', tipo: 'Inversión', categoria: 'Fondo', importe: 100, fecha: d(0) },
  ];
  const e = makeEnv({ movs, cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 300 }, { nombre: 'Ocio' }], ahorro: [{ id: 'h1', nombre: 'Viaje', objetivo: 1000 }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, c = () => doc.querySelector('#content'), cfg = () => e.store.cfg.app;
  H.goTab(['inicio']); await sleep(20);
  const cels = [...doc.querySelectorAll('.hk-cel')].map((x) => x.textContent.replace(/\s+/g, ' '));
  ok(cels.length === 4 && /Ingresos.*2\.000/.test(cels[0]) && /Gastos.*150/.test(cels[1]) && /Apartado.*150/.test(cels[2]) && /Invertido.*100/.test(cels[3]), 'A1: importes de ingresos, gastos, apartado e invertido (sin deudas si no hay)');
  doc.querySelectorAll('.hk-cel')[1].click(); await sleep(20);
  ok(A.S.tab === 'movimientos' && A.S.movFiltroTipo === '_gastos' && A.S.movVista === 'lista', 'A1: tocar «Gastos» abre la lista de gastos del mes');
  H.goTab(['inicio']); await sleep(20);
  const circ = [...doc.querySelectorAll('.ins-c')];
  ok(circ.length >= 2 && circ.every((x) => x.querySelector('.ins-cic svg.i')), 'A2: cada círculo con su icono');
  ok(/Cambiar/.test(c().textContent), 'A2: enlace «Cambiar» junto a «Así vas»');
  H.insVer([0]); await sleep(10);
  ok(doc.querySelector('#popupBackdrop .ins-cambiar') && doc.querySelector('#popupBackdrop .actions .btn + .btn'), 'pop-up: «Cambiar este círculo» y los dos botones');
  H.asiVasAbrir([0]); await sleep(20);
  ok(!doc.querySelector('#popupBackdrop') && doc.querySelectorAll('#sheetHost .av-hueco').length === 5, 'hoja «Tu Así vas» con 5 huecos (y el pop-up cerrado)');
  H.asiVasElegir(['ahorro']); await sleep(5);
  H.asiVasSub(['cat']); await sleep(5); H.asiVasElegir(['cat:Ocio']); await sleep(5);
  H.asiVasSub(['meta']); await sleep(5); H.asiVasElegir(['meta:h1']); await sleep(5);
  await H.asiVasGuardar([]); await sleep(30);
  ok(JSON.stringify(cfg().asiVas) === JSON.stringify(['ahorro', 'cat:Ocio', 'meta:h1', 'auto', 'auto']), 'se guarda en la configuración: ahorro, una categoría y una meta');
  const l1 = [...doc.querySelectorAll('.ins-c .ins-l1')].map((x) => x.textContent);
  ok(l1[0] === 'Apartas' && l1[1] === 'Ocio' && l1[2] === 'Viaje' && l1.length === 5, 'Inicio enseña primero los elegidos y luego los recomendados (' + l1.join(', ') + ')');
  H.asiVasAbrir([0]); await sleep(10); H.asiVasElegir(['cat:Ocio']); await sleep(5);
  ok(FORM_v(A)[0] === 'cat:Ocio' && FORM_v(A)[1] === 'ahorro', 'elegir uno que ya está en otro círculo los intercambia');
  H.asiVasReset([]); await H.asiVasGuardar([]); await sleep(30);
  ok(cfg().asiVas == null, '«Todo automático» vuelve a lo de siempre');
  // novedades de Juntos: lo que apunta otra persona después de tu última visita sale en «Estos días»
  e.store.cfg.app.vistoJuntos = '2026-01-01T00:00:00.000Z';
  A.S.user = Object.assign({}, A.S.user, { id: 'uA' });
  A.S.db = Object.assign(A.S.db || {}, { grupos: A.S.db && A.S.db.grupos || { listar: async () => ({ grupos: [], miembros: [] }) }, rpc: A.S.db && A.S.db.rpc || (async () => null) });
  A.S.grupos = [{ id: 'g1', nombre: 'Casa', tipo: 'grupo', miembros: [{ user_id: 'uA', nombre: 'Yo', rol: 'admin' }, { user_id: 'uB', nombre: 'Lucía', rol: 'miembro' }] }];
  A.S.compartidos = [{ id: 'c1', grupoId: 'g1', descripcion: 'Cena', importe: 40, pagadoPor: 'uB', reparto: { uA: 20, uB: 20 }, creadoPor: 'uB', createdAt: '2099-01-01T10:00:00.000Z', fecha: d(0) }];
  H.goTab(['inicio']); await sleep(20);
  const nov = doc.querySelector('.juntos-nov');
  ok(nov && /Lucía apuntó «Cena»/.test(nov.textContent) && /20/.test(nov.textContent), 'aviso de Juntos: quién apuntó qué y tu parte');
  H.goTab(['juntos']); await sleep(40);
  ok(cfg().vistoJuntos === '2099-01-01T10:00:00.000Z', 'al entrar en Juntos se marca como visto');
  H.goTab(['inicio']); await sleep(20);
  ok(!doc.querySelector('.juntos-nov'), 'y el aviso desaparece de Inicio');
  A.S.compartidos.push({ id: 'c2', grupoId: 'g1', descripcion: 'Taxi', importe: 10, pagadoPor: 'uA', reparto: { uA: 5, uB: 5 }, creadoPor: 'uA', createdAt: '2099-02-01T10:00:00.000Z', fecha: d(0) });
  H.goTab(['inicio']); await sleep(20);
  ok(!doc.querySelector('.juntos-nov'), 'lo que apuntas tú no sale como novedad');
  // la versión del 22/10 sigue en «Antes» para comparar
  A.S.verAnterior = Object.assign(A.S.verAnterior || {}, { inicio: 1 }); H.goTab(['inicio']); await sleep(20);
  ok(!doc.querySelector('.hk-cels') && !doc.querySelector('.ins-cic') && !doc.querySelector('.juntos-nov'), '«22 oct» enseña Inicio como estaba (sin importes, iconos ni avisos nuevos)');
  A.S.verAnterior.inicio = 0; H.goTab(['inicio']); await sleep(20);
  ok(doc.querySelector('.hk-cels'), 'y «Nueva» vuelve a la v3');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
function FORM_v(A) { return (A.form() || {}).v || []; }

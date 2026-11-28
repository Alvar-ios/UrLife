// 25/11/2026 · Widgets en iPhone (docs/49 B1+B2). La web manda el mismo resumen que en Android al plugin de iPhone (PalomaWidgets),
// «•••» con las cifras ocultas, nada al cerrar sesión, y los enlaces palomapp://gasto y palomapp://inicio abren el gasto nuevo y Inicio.
// El lado iPhone se simula (window.__nativo con el puente real de movil/widgets-ios.js). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
const { crearWidgetsIos, queDeUrl, searchDeEnlace } = require('../movil/widgets-ios.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoyISO = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
const sheetAbierta = (e) => !!e.doc.querySelector('#sheetBackdrop') && !e.doc.querySelector('#sheetBackdrop').dataset.cerrando;

(async () => {
  // 1) El puente: qué enlaces entiende
  ok(queDeUrl('palomapp://gasto') === 'gasto' && queDeUrl('palomapp://inicio') === 'inicio' && queDeUrl('PALOMAPP://Gasto/') === 'gasto', 'los enlaces palomapp://gasto y palomapp://inicio se entienden');
  ok(searchDeEnlace('https://urlife-zeta.vercel.app/?unirse=abc') === '?unirse=abc' && searchDeEnlace('palomapp://x?unirse=abc') === '' && searchDeEnlace('palomapp://x?borrar-cuenta') === '' && searchDeEnlace('https://otra.web/?unirse=abc') === '' && searchDeEnlace('') === '' && searchDeEnlace(null) === '', 'solo los enlaces https de la web de PalomApp pasan sus parámetros; palomapp://x?unirse o ?borrar-cuenta se ignoran');
  ok(queDeUrl('palomapp://otra') === '' && queDeUrl('https://urlife-zeta.vercel.app/?unirse=abc') === '' && queDeUrl('') === '' && queDeUrl(null) === '', 'lo demás (invitaciones, enlaces raros) no es de un widget');
  {
    const g = []; const W = crearWidgetsIos({ guardar: async (o) => { g.push(o); } });
    W.guardar({ sesion: true, queda: '1 €' }); W.guardar();
    ok(g.length === 2 && g[0].queda === '1 €' && g[1].sesion === false && Object.keys(g[1]).length === 1, 'guardar pasa el resumen tal cual y, sin nada, manda {sesion:false}');
    let avisos = 0; W.alAbrir(() => { avisos++; });
    ok(W.alUrl('palomapp://gasto') === true && avisos === 1, 'un enlace de widget avisa a la web');
    ok(await W.abrirCon() === 'gasto' && await W.abrirCon() === '', 'abrirCon da «gasto» una sola vez');
    ok(W.alUrl('https://x.test/?unirse=1') === false && avisos === 1, 'un enlace que no es de widget no avisa');
    // arranque en frío: el enlace llega antes de que la web escuche
    const F = crearWidgetsIos({ guardar: async () => {} }); F.alUrl('palomapp://inicio');
    ok(await F.abrirCon() === 'inicio', 'si el enlace llega antes que la web, queda esperando');
  }

  // 2) La web con el puente de iPhone
  const L = { guardar: [] }; let W;
  const pre = (w) => {
    W = crearWidgetsIos({ guardar: async (x) => { L.guardar.push(JSON.parse(JSON.stringify(x))); } });
    w.__nativo = { ios: true, widgets: W, atajos: { pendientes: async () => [], quitar: async () => {}, info: async () => ({ ios: '27.1', usado: 0 }), cuenta: async () => {} },
      notif: { permiso: async () => 'granted', pedir: async () => 'granted', programar: async () => 0, ahora: async () => 0 } };
    W.alUrl('palomapp://gasto'); // la app arranca desde «Apuntar gasto»
  };
  const hoy = hoyISO();
  const movs = [
    { id: 'i1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: hoy, descripcion: 'Nómina' },
    { id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 123.45, fecha: hoy, descripcion: 'Compra' },
  ];
  const e = makeEnv({ version: { tu: 1, agenda: 0, crear: 1, importe: 0 }, pre, movs,
    cfg: { app: { compararVersiones: false, categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Otros' }], ingresos: ['Nómina'] }, meta: { onboarded: true } } });
  const A = e.w.__APP__, ultimo = () => L.guardar[L.guardar.length - 1] || null;
  await A.main(); await sleep(1600);
  const F = A.form();
  ok(sheetAbierta(e) && F && F.tipo === 'Gasto' && F.tec && F.tec.on === true, 'palomapp://gasto al arrancar: sale el gasto nuevo con el teclado del importe');
  ok(A.S.tab === 'inicio', 'debajo queda Inicio');
  e.w.document.querySelector('#sheetHost').innerHTML = ''; A.render(); await sleep(50);
  const u = ultimo(), hv = ((e.doc.querySelector('.hero-v') || {}).textContent || '').trim();
  ok(!!u && u.sesion === true && u.queda === hv && /1\.376,55/.test(u.queda), 'la web manda al plugin de iPhone la misma cifra que Inicio (' + (u && u.queda) + ')');
  ok(u && u.texto === 'Te queda este mes' && !!u.mes && !!u.desde && !!u.hasta && u.progreso > 0, 'con rótulo, mes, fechas y barra');
  const campos = Object.keys(u).sort().join(',');
  ok(campos === 'desde,hasta,mes,negativo,oculto,progreso,queda,sesion,texto', 'solo lleva lo que se ve en el widget: ' + campos);
  ok(!/@|token|password|clave/i.test(JSON.stringify(u)), 'ni correo ni claves');
  A.H.ocultarCifras([]); await sleep(1300);
  ok(ultimo().queda === '•••' && ultimo().oculto === true, 'con las cifras ocultas, «•••»');
  A.H.ocultarCifras([]); await sleep(1300);
  // los enlaces con la app ya abierta
  A.H.goTab(['dinero']); await sleep(30);
  e.w.__nativo.widgets.alUrl('palomapp://inicio'); await sleep(80);
  ok(A.S.tab === 'inicio' && !sheetAbierta(e), 'palomapp://inicio con la app abierta lleva a Inicio');
  e.w.__nativo.widgets.alUrl('palomapp://gasto'); await sleep(80);
  ok(sheetAbierta(e) && A.form() && A.form().tipo === 'Gasto' && A.form().tec && A.form().tec.on, 'palomapp://gasto con la app abierta abre el gasto nuevo');
  // cerrar sesión
  e.w.Auth._f.forEach((f) => f(null)); await sleep(1300);
  ok(ultimo().sesion === false && Object.keys(ultimo()).length === 1, 'al cerrar sesión se manda {sesion:false}: el plugin borra todo');
  const n = L.guardar.length; await sleep(1200);
  ok(L.guardar.length === n, 'sin sesión no se vuelve a guardar ninguna cifra');
  console.log(fails ? '\n' + fails + ' FALLOS' : '\nTODO BIEN'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('ERROR', x); process.exit(1); });

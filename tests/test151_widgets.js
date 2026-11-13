// 12/11/2026 · Widgets de Android (docs/40 C5): la app deja en el móvil lo mismo que enseña Inicio («Te queda este mes»),
// «•••» con las cifras ocultas, nada al cerrar sesión, y el widget «Apuntar gasto» abre el gasto con el teclado.
// El lado Android se simula (window.__nativo.widgets), como en test149.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoyISO = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function entorno(o) {
  const L = { guardar: [], abrir: o.abrir || '', oyente: null };
  const pre = o.web ? null : (w) => {
    w.__nativo = { android: true, widgets: {
      guardar: async (x) => { L.guardar.push(JSON.parse(JSON.stringify(x))); },
      abrirCon: async () => { const q = L.abrir; L.abrir = ''; return q; },
      alAbrir: (fn) => { L.oyente = fn; },
    } };
  };
  const e = makeEnv({ version: { tu: 1, agenda: 0, crear: 0, importe: 0 }, pre,
    cfg: { app: Object.assign({ compararVersiones: false, categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Otros' }], ingresos: ['Nómina', 'Otros ingresos'] }, o.app || {}), meta: { onboarded: true } },
    movs: o.movs });
  return { e, L, ultimo: () => L.guardar[L.guardar.length - 1] || null };
}
const sheetAbierta = (e) => !!e.doc.querySelector('#sheetBackdrop') && !e.doc.querySelector('#sheetBackdrop').dataset.cerrando;

(async () => {
  const hoy = hoyISO();
  const movs = [
    { id: 'i1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: hoy, descripcion: 'Nómina' },
    { id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 123.45, fecha: hoy, descripcion: 'Compra' },
    { id: 'g2', tipo: 'Gasto', categoria: 'Otros', importe: 20, fecha: hoy, descripcion: 'Café' },
  ];

  // 1) Arranque desde «Apuntar gasto», resumen igual que Inicio, cifras ocultas y cerrar sesión
  {
    const { e, L, ultimo } = entorno({ movs, abrir: 'gasto' });
    const A = e.w.__APP__;
    await A.main(); await sleep(1600);
    const F = A.form();
    ok(sheetAbierta(e) && F && F.tipo === 'Gasto' && F.tec && F.tec.on === true && !!e.doc.querySelector('#fImporte') && !!e.doc.querySelector('.tec-campo'), 'abierta desde «Apuntar gasto»: sale el gasto nuevo con el teclado del importe listo');
    ok(A.S.tab === 'inicio', 'debajo queda Inicio');
    e.w.document.querySelector('#sheetHost').innerHTML = ''; A.render(); await sleep(50);
    const u = ultimo();
    ok(!!u && u.sesion === true, 'tras cargar los datos se guarda el resumen para el widget');
    ok(L.guardar.length <= 2, 'se guarda pocas veces al abrir (no en cada repintado): ' + L.guardar.length);
    const hv = (e.doc.querySelector('.hero-v') || {}).textContent || '', hk = (e.doc.querySelector('.hero-k') || {}).textContent || '';
    ok(u && u.queda === hv.trim() && /1\.356,55/.test(u.queda), 'la cifra del widget es la misma que la de Inicio (' + (u && u.queda) + ' / ' + hv + ')');
    ok(u && u.texto === hk.trim() && u.texto === 'Te queda este mes', 'el rótulo coincide con Inicio: «' + (u && u.texto) + '»');
    const a = A.mesActual(), r = A.rangoMes(a.y, a.m);
    ok(u && u.mes === MESES[a.m - 1] && u.desde === r.desde && u.hasta === r.hasta, 'lleva el nombre del mes y sus fechas (' + (u && u.mes) + ', ' + (u && u.desde) + '–' + (u && u.hasta) + ')');
    ok(u && u.progreso > 0 && u.progreso <= 1 && u.negativo === false && u.oculto === false, 'barra del mes entre 0 y 1 (' + (u && u.progreso) + ')');
    // un gasto nuevo cambia la cifra (con espera de ~1 s)
    e.store.movimientos.g3 = { tipo: 'Gasto', categoria: 'Otros', importe: 6.55, fecha: hoy, descripcion: 'Pan' };
    A.S._movsRaw = A.S._movsRaw.concat([Object.assign({ id: 'g3' }, e.store.movimientos.g3)]);
    await e.w.Data.doc('config/app').update({ widgetPrueba: 1 }); await sleep(1300); // llega la configuración y se vuelven a leer los movimientos
    ok(/^1\.350,00/.test(ultimo().queda) && ((e.doc.querySelector('.hero-v') || {}).textContent || '').trim() === ultimo().queda, 'tras un gasto nuevo, el widget se pone al día (' + ultimo().queda + ')');
    A.H.ocultarCifras([]); await sleep(1300);
    ok(ultimo().queda === '•••' && ultimo().oculto === true && !/\d/.test(JSON.stringify(ultimo().queda)), 'con las cifras ocultas el widget dice «•••»');
    A.H.ocultarCifras([]); await sleep(1300);
    ok(ultimo().queda !== '•••' && ultimo().oculto === false, 'al volver a mostrarlas, vuelve la cifra');
    // «Te queda» del widget cuando la app ya estaba abierta: va a Inicio. «Apuntar gasto» con la app abierta: abre el gasto
    A.H.goTab(['dinero']); await sleep(30);
    L.abrir = 'inicio'; L.oyente && L.oyente(); await sleep(60);
    ok(A.S.tab === 'inicio' && !sheetAbierta(e), 'tocar «Te queda este mes» con la app abierta lleva a Inicio');
    L.abrir = 'gasto'; L.oyente && L.oyente(); await sleep(60);
    ok(sheetAbierta(e) && A.form() && A.form().tipo === 'Gasto' && A.form().tec && A.form().tec.on, 'tocar «Apuntar gasto» con la app abierta también abre el gasto');
    // cerrar sesión
    e.w.Auth._f.forEach((f) => f(null)); await sleep(1300);
    ok(ultimo().sesion === false && !('queda' in ultimo()), 'al cerrar sesión se guarda {sesion:false} y nada más');
    const n = L.guardar.length; await sleep(1200);
    ok(L.guardar.length === n, 'sin sesión no se vuelve a guardar ninguna cifra');
  }

  // 2) «Tu mes» desde el día que cobras: mismas fechas que Inicio y misma cifra
  {
    const { e, ultimo } = entorno({ movs, app: { mesInicio: { modo: 'cobro', dia: 25 } } });
    const A = e.w.__APP__;
    await A.main(); await sleep(1500);
    const u = ultimo(), a = A.mesActual(), r = A.rangoMes(a.y, a.m), hv = ((e.doc.querySelector('.hero-v') || {}).textContent || '').trim();
    ok(u && u.desde === r.desde && u.hasta === r.hasta && u.mes === MESES[a.m - 1], 'con «desde que cobro» usa el mismo tramo que Inicio (' + (u && u.desde) + '–' + (u && u.hasta) + ')');
    ok(u && u.queda === hv, 'y la misma cifra (' + (u && u.queda) + ')');
    ok(!sheetAbierta(e), 'abierta normal (no desde el widget): no se abre ninguna hoja');
  }

  // 3) Quien nunca apuntó un ingreso: «Gastos de este mes», como Inicio
  {
    const { e, ultimo } = entorno({ movs: movs.filter((x) => x.tipo === 'Gasto') });
    const A = e.w.__APP__;
    await A.main(); await sleep(1500);
    const u = ultimo(), hk = ((e.doc.querySelector('.hero-k') || {}).textContent || '').trim(), hv = ((e.doc.querySelector('.hero-v') || {}).textContent || '').trim();
    ok(u && u.texto === 'Gastos de este mes' && u.texto === hk && u.queda === hv && u.negativo === false, 'sin ingresos: «Gastos de este mes» y ' + (u && u.queda) + ', igual que Inicio');
  }

  // 4) En la web (sin la app de Android) no pasa nada
  {
    const { e } = entorno({ movs, web: true });
    let err = null; e.w.addEventListener('error', (x) => { err = x.message; });
    await e.w.__APP__.main(); await sleep(1400);
    ok(!err && !!e.doc.querySelector('.hero-v'), 'en la web no hace nada y no da errores');
  }

  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

// 13/11/2026 · Tú por temas (ajustes en categorías con su pantalla). Datos inventados.
// 1) Inventario: todo lo que se podía tocar en Tú de 22/10 (incluido «Más ajustes») sigue a mano en la nueva.
// 2) Cada pantalla tiene «Volver», y el botón atrás de Android y la flecha de arriba vuelven a Tú.
// 3) «Buscar un ajuste» encuentra filas de dentro de las pantallas.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const nativo = (w) => { w.__nativo = { android: true, huella: { disponible: async () => true },
  notif: { permiso: async () => 'granted', pedir: async () => 'granted', programar: async () => 0, ahora: async () => 0 },
  avisosBanco: { estado: async () => ({ activo: false, permiso: false, bancos: [] }), configurar: async () => {}, abrirAjustes: async () => {}, pendientes: async () => [], quitar: async () => {}, vaciar: async () => {}, abiertoDesdeAviso: async () => false, alAbrirDesdeAviso: () => {}, huella: async () => 'h' } }; };
const base = { app: { nombre: 'Prueba', categoriasGasto: [{ nombre: 'Ocio', presupuesto: 50 }] }, meta: { onboarded: true } };
const clics = (raiz) => [...raiz.querySelectorAll('[data-click]')].map((b) => b.getAttribute('data-click'));
(async () => {
  for (const android of [false, true]) {
    const tag = android ? ' (Android)' : ' (web)';
    // Tú de 22/10: lo que había
    const e1 = makeEnv({ version: { tu: 1 }, cfg: JSON.parse(JSON.stringify(base)), pre: android ? nativo : undefined });
    await sleep(120); const A1 = e1.w.__APP__;
    A1.H.goTab(['tu']); await sleep(30);
    const antes = new Set(clics(e1.doc.querySelector('#content')).filter((c) => !/^(tuMasToggle|tuFiltrar)/.test(c)));
    ok(antes.size >= 25, 'Tú de antes tiene ' + antes.size + ' cosas que tocar' + tag);
    // Tú por temas: la principal y todas sus pantallas
    const e = makeEnv({ version: { tu: 0 }, cfg: JSON.parse(JSON.stringify(base)), pre: android ? nativo : undefined });
    await sleep(120); const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, cont = () => doc.querySelector('#content');
    H.goTab(['tu']); await sleep(30);
    ok(!!cont().querySelector('.tu3-cat'), 'Tú nueva: categorías con icono' + tag);
    const ahora = new Set(clics(cont()));
    const ramas = [...cont().querySelectorAll('.tu3-raiz .tu3-cat[data-click^="tuIr|"]')].map((b) => b.getAttribute('data-click').split('|')[1]);
    ok(ramas.length >= 6, 'abren su pantalla: ' + ramas.join(', ') + tag);
    for (const r of ramas) {
      H.tuIr([r]); await sleep(15);
      ok(!!cont().querySelector('.tu3-volver') && doc.querySelector('#pageTitle').textContent.length > 1, 'pantalla «' + r + '» con «Volver» y su título arriba' + tag);
      clics(cont()).forEach((c) => ahora.add(c));
      H.tuIr(['']); await sleep(10);
    }
    const faltan = [...antes].filter((c) => !ahora.has(c));
    ok(!faltan.length, 'ningún ajuste de antes se ha perdido' + (faltan.length ? ' — faltan: ' + faltan.join(', ') : '') + tag);
    if (android) {
      ok(ahora.has('avAbrir') && ahora.has('huellaCambiar'), 'en Android: Avisos y «Pedir huella al abrir» siguen');
      ok(ahora.has('ocultarCifras'), '«Ocultar cifras» está en Seguridad y privacidad');
    }
    // atrás de Android y flecha de arriba
    H.tuIr(['dinero']); await sleep(10);
    ok(e.w.__atras() === true && S.tab === 'tu' && !S.tuSub, 'atrás de Android: de Dinero a Tú (sin salir de Tú)' + tag);
    H.tuIr(['datos']); await sleep(10); H.tbVolver([]); await sleep(10);
    ok(S.tab === 'tu' && !S.tuSub, 'la flecha de arriba también vuelve a Tú' + tag);
    e.w.__atras(); await sleep(10); ok(S.tab === 'inicio', 'y otra vez atrás: a Inicio, como siempre' + tag);
    // al volver a Tú desde otra pestaña, a la principal
    H.goTab(['tu']); H.tuIr(['seguridad']); await sleep(10); H.goTab(['dinero']); H.goTab(['tu']); await sleep(10);
    ok(!S.tuSub && !!cont().querySelector('.tu3-raiz'), 'al entrar otra vez en Tú se ve la principal' + tag);
    // buscar
    const q = cont().querySelector('#tuBuscar'); q.value = 'papelera'; q.dispatchEvent(new e.w.Event('input', { bubbles: true })); await sleep(10);
    const vis = [...cont().querySelectorAll('.tu3-res [data-k]')].filter((b) => b.style.display !== 'none');
    ok(cont().querySelector('.tu3-raiz').hidden && vis.length === 1 && /Papelera/.test(vis[0].textContent) && /Tus datos/.test(vis[0].textContent), 'buscar «papelera» la encuentra y dice dónde está' + tag);
    q.value = 'zzzz'; q.dispatchEvent(new e.w.Event('input', { bubbles: true })); await sleep(10);
    ok(doc.querySelector('#tuNada').style.display !== 'none', 'sin resultados: «No hay ningún ajuste con ese nombre»' + tag);
    q.value = ''; q.dispatchEvent(new e.w.Event('input', { bubbles: true })); await sleep(10);
    ok(!cont().querySelector('.tu3-raiz').hidden && cont().querySelector('.tu3-res').hidden, 'al borrar la búsqueda vuelven las categorías' + tag);
    // una fila de dentro funciona
    H.tuIr(['datos']); await sleep(10); cont().querySelector('[data-click="openPapelera"]').click(); await sleep(30);
    ok(!!doc.querySelector('#sheetBackdrop'), 'una fila de dentro abre su hoja (Papelera)' + tag);
    ok(e.w.__atras() === true, 'atrás cierra la hoja' + tag);
    await sleep(350); ok(S.tuSub === 'datos', 'al cerrar la hoja se sigue en la pantalla «Tus datos»' + tag);
  }
  // la versión anterior sigue en «Antes»
  const e = makeEnv({ version: { tu: 0 }, cfg: JSON.parse(JSON.stringify(base)) }); await sleep(120); const A = e.w.__APP__;
  ok(A.VERSIONES.tu.variantes.map((v) => v[0]).join() === 'nueva,v2,antes' && !A.VERSIONES.tu.cerrada, 'VERSIONES.tu: nueva, «Antes» (22/10) y la primera; con el botón «Antes» para comparar');
  A.S.verAnterior = { tu: 1 }; A.H.goTab(['tu']); await sleep(20);
  ok(!!e.doc.querySelector('#content .tu-mas-btn') && !e.doc.querySelector('#content .tu3-cat'), 'con «Antes» se ve Tú de 22/10');
  console.log(fails ? fails + ' FALLOS' : 'TODO BIEN'); process.exit(fails ? 1 : 0);
})();

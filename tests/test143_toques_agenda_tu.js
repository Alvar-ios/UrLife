// 11/11/2026 · Calidad (auditoría antes de Google Play): Agenda, Trayecto y Tú tocando de verdad.
// Tarea rápida, tarea completa, tarea compartida, calendario; trayecto con la función simulada;
// Tú: nombre, renombrar categoría, ocultar cifras, Excel, borrar cuenta (hasta confirmar), cerrar sesión. Solo datos inventados.
const T = require('./toques_comun.js');
const { abrir, tocar, tocarSiHay, buscar, escribir, teclearImporte, hoja, hojaAbierta, pantalla, aviso, deshacerToast, atras, movs, app, ir, ok, paso, fin, sleep } = T;
T.fallosConocidos(['BORRAR_PIERDE_CAMPOS']);
const YO = 'u-yo', ANA = 'u-ana';
const hoy = T.hoy;
const tareas = (e) => Object.entries(e.store.tareas).map(([id, v]) => Object.assign({ id }, v));

(async () => {
  // ---------- 1) Agenda ----------
  let e = await abrir({ cfg: { app: { nombre: 'Lucía', compararVersiones: false, categoriasGasto: [{ nombre: 'Transporte' }, { nombre: 'Otros' }] }, meta: { onboarded: true } },
    grupos: [{ id: 'g1', nombre: 'Casa inventada', tipo: 'grupo', edicion: 'todos', created_at: '2026-10-01T10:00:00Z' }],
    miembros: [{ grupo_id: 'g1', user_id: YO, nombre: 'Lucía', rol: 'admin' }, { grupo_id: 'g1', user_id: ANA, nombre: 'Ana', rol: 'miembro' }] });
  paso('Tarea rápida');
  const ag = buscar(e, 'irAgenda', null) || buscar(e, 'setInicioVista', 'tareas');
  ag.click(); await sleep(80);
  ok(!!e.doc.querySelector('#agRapida'), 'en la Agenda está la casilla rápida');
  await escribir(e, '#agRapida', 'Llamar al fontanero inventado');
  await tocar(e, 'agRapida', null, 'app', 120);
  let ts = tareas(e);
  ok(ts.length === 1 && ts[0].nombre === 'Llamar al fontanero inventado' && ts[0].estado === 'Pendiente' && ts[0].fechaLimite === hoy(), 'se guarda la tarea para hoy, pendiente');
  ok(e.doc.querySelector('#agRapida').value === '', 'la casilla se vacía para escribir otra');
  ok(/Llamar al fontanero inventado/.test(pantalla(e)), 'la tarea sale en la Agenda');
  // con Intro, como en el teclado del móvil
  e.doc.querySelector('#agRapida').value = 'Comprar bombillas';
  e.doc.querySelector('#agRapida').dispatchEvent(new e.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await sleep(120);
  ok(tareas(e).length === 2, 'con «Intro» del teclado también se añade');
  paso('Marcar hecha y deshacer');
  const hecha = buscar(e, 'toggleTarea', null, 'app');
  ok(!!hecha, 'cada tarea tiene su casilla para marcarla hecha');
  if (hecha) { hecha.click(); await sleep(120); }
  ok(tareas(e).filter((t) => t.estado === 'Completado').length === 1, 'marcarla la deja como hecha');
  if (await deshacerToast(e)) await sleep(120);
  ok(tareas(e).filter((t) => t.estado === 'Completado').length === 0, '«Deshacer» la vuelve a dejar pendiente');

  paso('Tarea completa');
  await tocar(e, 'onFab'); await tocar(e, 'crearIr', 'tarea', 'hoja');
  ok(/Nueva tarea/.test(hoja(e)), 'el + → Tarea abre «Nueva tarea»');
  await tocar(e, 'saveTarea', null, 'hoja');
  ok(tareas(e).length === 2 && /nombre/i.test(aviso(e)), 'sin nombre no guarda y lo pide');
  await escribir(e, '#tNombre', 'Renovar el DNI inventado');
  const ch = [...e.doc.querySelectorAll('#sheetHost [data-click^="tFechaPick"]')];
  const manana = ch.find((x) => /Mañana/i.test(x.textContent)) || ch[1];
  manana.click(); await sleep(30);
  const fechaElegida = e.doc.querySelector('#tFecha').value;
  atras(e); await sleep(20);
  ok(!!e.doc.querySelector('#descartarHoja'), 'atrás con el nombre escrito pregunta antes de descartar');
  await tocar(e, 'descartarNo', null, null, 20);
  await tocar(e, 'saveTarea', null, 'hoja', 150);
  ts = tareas(e);
  const dni = ts.find((t) => t.nombre === 'Renovar el DNI inventado');
  ok(!!dni && dni.fechaLimite === fechaElegida && !!fechaElegida, 'se guarda con la fecha elegida (' + fechaElegida + ')');

  paso('Tarea compartida');
  await tocar(e, 'onFab'); await tocar(e, 'crearIr', 'tarea', 'hoja');
  await escribir(e, '#tNombre', 'Bajar la basura inventada');
  const con = buscar(e, 'tfCon', /Casa inventada/, 'hoja');
  ok(!!con, 'en «Con» sale el grupo «Casa inventada»');
  con.click(); await sleep(60);
  ok(((e.doc.querySelector('#sheetHost input[type=text]') || {}).value || '') === 'Bajar la basura inventada' || /Bajar la basura inventada/.test([...e.doc.querySelectorAll('#sheetHost input')].map((i) => i.value).join(' ')), 'al elegir el grupo se conserva lo escrito');
  const pg = buscar(e, 'planGuardar', null, 'hoja');
  ok(!!pg, 'sale «Guardar» de la tarea compartida');
  if (pg) { pg.click(); pg.click(); await sleep(200); }
  const ag2 = e.srv.agenda.filter((a) => !a.borrado);
  ok(ag2.length === 1 && ag2[0].tipo === 'tarea' && ag2[0].grupoId === 'g1' && ag2[0].titulo === 'Bajar la basura inventada', 'se guarda UNA tarea compartida en el grupo (' + JSON.stringify(ag2.map((a) => [a.tipo, a.grupoId, a.titulo])) + ')');
  ok(tareas(e).every((t) => t.nombre !== 'Bajar la basura inventada'), 'y no se guarda además como tarea tuya (no sale dos veces)');

  paso('Compartir una tarea que ya tenías');
  const ag3 = buscar(e, 'irAgenda', null) || buscar(e, 'setInicioVista', 'tareas'); if (ag3) { ag3.click(); await sleep(60); }
  const tf = buscar(e, 'openTareaForm', /Llamar al fontanero inventado/, 'app') || [...e.doc.querySelectorAll('#content [data-click]')].find((x) => /Llamar al fontanero inventado/.test(x.textContent) && !/toggleTarea/.test(x.getAttribute('data-click')));
  ok(!!tf, 'la tarea rápida se puede abrir');
  if (tf) { tf.click(); await sleep(60); }
  const con2 = buscar(e, 'tfCon', /Casa inventada/, 'hoja');
  ok(!!con2, 'al editarla se puede compartir con «Casa inventada»');
  const antesT = tareas(e).length;
  if (con2) { con2.click(); await sleep(60); const pg2 = buscar(e, 'planGuardar', null, 'hoja'); if (pg2) { pg2.click(); pg2.click(); await sleep(250); } }
  const comp2 = e.srv.agenda.filter((a) => !a.borrado && a.titulo === 'Llamar al fontanero inventado');
  ok(comp2.length === 1, 'queda UNA tarea compartida con ese nombre (' + comp2.length + ')');
  ok(!tareas(e).some((t) => t.nombre === 'Llamar al fontanero inventado') && tareas(e).length === antesT - 1, 'y la tuya deja de estar (no sale dos veces)');

  paso('Calendario');
  await tocarSiHay(e, 'setInicioVista', 'calendario', null, 80);
  if (!/calendario/i.test(e.S.inicioVista || '')) { e.A.H.setInicioVista(['calendario']); await sleep(60); }
  const dia = buscar(e, 'calSelDia', fechaElegida, 'app') || [...e.doc.querySelectorAll('#content [data-click]')].find((x) => (x.getAttribute('data-click') || '').indexOf(fechaElegida) >= 0);
  ok(!!dia, 'en el calendario se puede tocar el día de la tarea (' + fechaElegida + ')');
  if (dia) { dia.click(); await sleep(60); }
  ok(/Renovar el DNI inventado/.test(pantalla(e) + hoja(e)), 'al tocar el día se ve «Renovar el DNI inventado»');
  ok(atras(e) === true, 'atrás desde el calendario vuelve a Inicio'); await sleep(260);
  if (hojaAbierta(e)) { atras(e); await sleep(260); }

  // ---------- 2) Trayecto con la función simulada ----------
  paso('Trayecto');
  e.srv.funciones.trayecto = async (b) => (b.accion === 'distancia' ? { km: 64.4, desde: 'Pueblo A', hasta: 'Pueblo B' } : { error: 'sin_simular' });
  await tocar(e, 'onFab');
  await tocarSiHay(e, 'crearMasToggle', null, 'hoja');
  await tocar(e, 'trAbrir', null, 'hoja', 80);
  ok(/trayecto|viaje|km/i.test(hoja(e)), 'se abre la calculadora de trayecto');
  const de = e.doc.querySelector('#sheetHost input[data-input^="trDe"], #sheetHost input[data-change^="trDe"]');
  const a = e.doc.querySelector('#sheetHost input[data-input^="trA|"], #sheetHost input[data-input="trA"], #sheetHost input[data-change^="trA"]');
  if (!de) await tocarSiHay(e, 'trModo', 'sitios', 'hoja');
  await escribir(e, e.doc.querySelector('#sheetHost input[data-input^="trDe"], #sheetHost input[data-change^="trDe"]'), 'Calle Falsa 123, Pueblo A');
  await escribir(e, a || e.doc.querySelector('#sheetHost input[data-input="trA"], #sheetHost input[data-change="trA"]'), 'Plaza Inventada, Pueblo B');
  await tocar(e, 'trDist', null, 'hoja', 150);
  const llamada = e.srv.fetch.find((f) => /trayecto/.test(f[0]) && f[1] && f[1].accion === 'distancia'); if (process.env.VER) console.log(JSON.stringify(e.srv.fetch));
  ok(!!llamada && llamada[1].accion === 'distancia' && /Pueblo A/.test(llamada[1].de), 'se llama a la función de trayecto con los dos sitios');
  ok(/64 km/.test(hoja(e)), 'dice «Unos 64 km por carretera»');
  const coste = (hoja(e).match(/(\d+,\d\d)\s*€/) || [])[1];
  ok(!!coste, 'enseña lo que cuesta (' + coste + ' €)');
  await tocar(e, 'trApuntar', null, 'hoja', 80);
  ok(/Nuevo gasto/.test(hoja(e)) && (e.doc.querySelector('#fCategoria') || {}).value === 'Transporte', '«Apuntar gasto» abre un gasto en Transporte con el coste');
  const desc = (e.doc.querySelector('#fDesc') || {}).value || '';
  ok(!/Calle Falsa|123/.test(desc), 'la descripción no guarda la calle escrita (solo los pueblos) («' + desc + '»)');
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(150);
  const tr = movs(e).find((m) => m.categoria === 'Transporte');
  ok(!!tr && tr.importe > 0, 'se guarda el gasto del trayecto');
  ok(!JSON.stringify(app(e).trayecto || {}).includes('Calle Falsa'), 'en tu configuración no se guarda la dirección');

  // ---------- 3) Tú ----------
  paso('Tú: nombre');
  e = await abrir({ cfg: { app: { nombre: 'Lucía', compararVersiones: false, categoriasGasto: [{ nombre: 'Súper' }, { nombre: 'Otros' }] }, meta: { onboarded: true } },
    movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Súper', importe: 12.34, fecha: hoy(), descripcion: 'Compra inventada' }] });
  await ir(e, 'tu');
  ok(/Lucía/.test(pantalla(e)), 'Tú enseña el nombre');
  await tocar(e, 'tuNombreAbrir', null, 'app');
  await escribir(e, '#sheetHost input[data-input^="perfilNombreIn"]', 'Lucía Inventada');
  await tocar(e, 'tuNombreGuardar', null, 'hoja', 120);
  ok(app(e).nombre === 'Lucía Inventada', 'el nombre nuevo se guarda');
  ok(/Lucía Inventada/.test(pantalla(e)), 'y se ve en Tú');

  paso('Tú: renombrar categoría');
  const cats = buscar(e, 'openListEditor', /categor/i, 'app') || buscar(e, 'openListEditor', 'categoriasGasto', 'app');
  if (!cats) await tocarSiHay(e, 'tuMasToggle', null, 'app');
  await tocar(e, 'openListEditor', 'categoriasGasto');
  const inp = [...e.doc.querySelectorAll('#sheetHost input')].find((i) => i.value === 'Súper');
  ok(!!inp, 'en el editor de categorías está «Súper»');
  await escribir(e, inp, 'Comida de casa', 80);
  ok((app(e).categoriasGasto || []).some((c) => c.nombre === 'Comida de casa') && !(app(e).categoriasGasto || []).some((c) => c.nombre === 'Súper'), 'la categoría se renombra en tu lista');
  ok(/Pasarlos/.test(e.doc.querySelector('#toast') ? e.doc.querySelector('#toast').textContent : ''), 'avisa de que 1 gasto sigue como «Súper» y ofrece «Pasarlos»');
  await deshacerToast(e); await sleep(150);
  ok(e.store.movimientos.m1.categoria === 'Comida de casa', '«Pasarlos» cambia el gasto a «Comida de casa»');

  paso('Tú: ocultar cifras');
  await T.cerrarHoja(e); await ir(e, 'inicio');
  await tocar(e, 'ocultarCifras', null, null, 60);
  ok(e.doc.documentElement.classList.contains('cifras-ocultas'), 'el ojo oculta las cifras');
  await tocar(e, 'ocultarCifras', null, null, 60);
  ok(!e.doc.documentElement.classList.contains('cifras-ocultas'), 'y las vuelve a enseñar');

  paso('Tú: Excel');
  await ir(e, 'tu');
  let descargado = null; const ce = e.doc.createElement.bind(e.doc);
  const blobs = []; const B = e.w.Blob; e.w.Blob = function (partes, o) { blobs.push(partes.join('')); return new B(partes, o); };
  e.doc.createElement = (t) => { const x = ce(t); if (String(t).toLowerCase() === 'a') x.click = () => { descargado = x.download; }; return x; };
  if (!buscar(e, 'exportCsv')) await tocarSiHay(e, 'tuMasToggle', null, 'app');
  await tocar(e, 'exportCsv', null, null, 60);
  e.doc.createElement = ce; e.w.Blob = B;
  ok(/^palomapp-movimientos-\d{4}-\d{2}-\d{2}\.csv$/.test(descargado || ''), 'descarga «palomapp-movimientos-FECHA.csv» (' + descargado + ')');
  ok(blobs.length === 1 && /Fecha;Tipo;Concepto/.test(blobs[0]) && /Compra inventada/.test(blobs[0]) && /-12,34/.test(blobs[0]), 'el archivo lleva la cabecera y el gasto con coma (-12,34)');

  paso('Tú: borrar cuenta hasta confirmar');
  await tocar(e, 'borrarCuentaAbrir', null, null, 40);
  ok(/Borrar mi cuenta/.test(hoja(e)) && /No se puede deshacer/.test(hoja(e)), 'la hoja explica que no se puede deshacer');
  await tocar(e, 'borrarCuentaOk', null, 'hoja', 60);
  ok(!e.srv.fetch.some((f) => /borrar-cuenta/.test(f[0])) && /BORRAR/.test(hoja(e)), 'sin escribir BORRAR no llama al servidor');
  await escribir(e, '#bcConf', 'borrar');
  await escribir(e, '#bcPass', 'contraseña-mala');
  await tocar(e, 'borrarCuentaOk', null, 'hoja', 80);
  ok(!e.srv.fetch.some((f) => /borrar-cuenta/.test(f[0])) && /contraseña no es correcta/.test(hoja(e)), 'con la contraseña mala no borra y lo dice');
  ok(e.doc.querySelector('#bcConf') && e.doc.querySelector('#bcConf').value.toUpperCase() === 'BORRAR', 'tras el aviso, lo escrito en «BORRAR» se conserva', 'BORRAR_PIERDE_CAMPOS');
  // con todo bien: la función responde «saldo_pendiente» (no se borra nada)
  e.srv.funciones['borrar-cuenta'] = async () => ({ error: 'saldo_pendiente', grupos: [{ nombre: 'Piso inventado' }] });
  await escribir(e, '#bcConf', 'BORRAR'); await escribir(e, '#bcPass', 'contraseña-buena');
  await tocar(e, 'borrarCuentaOk', null, 'hoja', 150);
  const lb = e.srv.fetch.filter((f) => /borrar-cuenta/.test(f[0]));
  ok(lb.length === 1 && lb[0][1].confirmar === 'BORRAR', 'con BORRAR y la contraseña buena llama una vez a la función de borrar');
  ok(/Piso inventado/.test(hoja(e)) && /Salda/.test(hoja(e)), 'si hay deudas pendientes, explica que antes hay que saldar «Piso inventado»');
  ok(!e.srv.llamadas.some((l) => l[0] === 'auth.signOut'), 'y no cierra la sesión');
  ok(atras(e) === true, 'atrás cierra la hoja de borrar cuenta'); await sleep(260);

  paso('Tú: cerrar sesión');
  await tocar(e, 'logoutPreguntar', null, null, 40);
  ok(/sesión/i.test(hoja(e)) && !e.srv.llamadas.some((l) => l[0] === 'auth.signOut'), 'cerrar sesión pregunta antes');
  await tocar(e, 'doLogout', null, 'hoja', 80);
  ok(e.srv.llamadas.some((l) => l[0] === 'auth.signOut'), 'al confirmar, cierra la sesión');

  fin('agenda_tu');
})().catch((x) => { console.log('FAIL excepción: ' + (x && x.stack || x)); process.exit(1); });

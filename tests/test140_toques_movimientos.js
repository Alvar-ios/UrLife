// 11/11/2026 · Calidad (auditoría antes de Google Play): Movimientos tocando de verdad.
// Gasto e ingreso con el teclado propio, editar, borrar con «Deshacer», Repetir, ticket (hasta la llamada),
// importar un CSV inventado, traspaso, y el atrás de Android. Solo datos inventados.
const T = require('./toques_comun.js');
const { abrir, tocar, tocarSiHay, buscar, escribir, teclearImporte, hoja, hojaAbierta, pantalla, aviso, deshacerToast, atras, movs, app, ir, ok, paso, fin, sleep } = T;
T.fallosConocidos([]); // 11/11: RED_GUARDADO_DUDOSO arreglado (el número del movimiento se pone en el móvil)
const hoy = T.hoy;
const diasAtras = T.diasAtras;
const CATS = [{ nombre: 'Supermercado' }, { nombre: 'Restaurantes' }, { nombre: 'Transporte' }, { nombre: 'Otros' }];

(async () => {
  // ---------- 1) Usuario sin cuentas: gasto con el teclado propio ----------
  let e = await abrir({ cfg: { app: { nombre: 'Prueba', compararVersiones: false, categoriasGasto: CATS, ingresos: ['Nómina'] }, meta: { onboarded: true } } });
  paso('Gasto con el teclado propio');
  await tocar(e, 'onFab');
  ok(/¿Qué quieres apuntar\?/.test(hoja(e)), 'el botón + abre «¿Qué quieres apuntar?»');
  await tocar(e, 'crearIr', 'gasto', 'hoja');
  ok(/Nuevo gasto/.test(hoja(e)) && !!e.doc.querySelector('#tec:not([hidden])'), 'se abre «Nuevo gasto» con el teclado de la app abierto');
  await teclearImporte(e, '12,50');
  ok(e.doc.querySelector('#fImporte').value === '12,50', 'la cifra tecleada llega al campo del importe (12,50)');
  const okBtn = [...e.doc.querySelectorAll('#sheetHost [data-click="tecK|ok"]')][0];
  okBtn.click(); await sleep(60);
  ok(movs(e).length === 0 && /categoría/i.test(aviso(e)), 'sin categoría no guarda y pide «Elige una categoría»');
  await tocar(e, 'tecCat', 'Supermercado', 'hoja');
  okBtn.click(); await sleep(150);
  let ms = movs(e);
  ok(ms.length === 1 && ms[0].tipo === 'Gasto' && ms[0].importe === 12.5 && ms[0].categoria === 'Supermercado' && ms[0].fecha === hoy(), 'se guarda en el servidor un gasto de 12,50 € en Supermercado con fecha de hoy (' + JSON.stringify(ms.map((m) => [m.tipo, m.importe, m.categoria, m.fecha])) + ')');
  ok(!hojaAbierta(e), 'la hoja se cierra al guardar');
  // doble toque rápido en «Guardar» no duplica
  paso('Doble toque en Guardar');
  await tocar(e, 'onFab'); await tocar(e, 'crearIr', 'gasto', 'hoja');
  await teclearImporte(e, '3'); await tocar(e, 'tecCat', 'Restaurantes', 'hoja');
  const ok2 = e.doc.querySelector('#sheetHost [data-click="tecK|ok"]'); ok2.click(); ok2.click(); await sleep(200);
  ok(movs(e).length === 2, 'dos toques seguidos en Guardar apuntan un solo gasto (' + movs(e).length + ')');

  paso('Ingreso');
  await tocar(e, 'onFab'); await tocar(e, 'crearIr', 'ingreso', 'hoja');
  ok(/Nuevo ingreso/.test(hoja(e)), 'se abre «Nuevo ingreso»');
  await teclearImporte(e, '1500');
  await tocar(e, 'tecCat', 'Nómina', 'hoja');
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(150);
  ms = movs(e); const ing = ms.find((m) => m.tipo === 'Ingreso');
  ok(!!ing && ing.importe === 1500 && ing.categoria === 'Nómina', 'se guarda el ingreso de 1.500 € en Nómina');

  paso('La pantalla lo enseña tras repintar');
  await ir(e, 'movimientos');
  await tocar(e, 'setMovVista', 'lista', 'app', 80);
  ok(/Supermercado/.test(pantalla(e)) && /12,50/.test(pantalla(e)) && /1\.500/.test(pantalla(e)), 'la lista de Movimientos enseña el gasto (12,50) y el ingreso (1.500)');

  // ---------- Editar ----------
  paso('Editar un movimiento');
  const g = movs(e).find((m) => m.importe === 12.5);
  await tocar(e, 'openMovForm', g.id, 'app');
  ok(/Editar movimiento/.test(hoja(e)), 'tocar el gasto abre «Editar movimiento»');
  ok(!!e.doc.querySelector('#tec[hidden]'), 'al editar, el teclado de la app empieza cerrado');
  await tocar(e, 'tecAbrir', null, 'hoja');
  await teclearImporte(e, '20');
  ok(e.doc.querySelector('#fImporte').value === '20', 'la primera tecla sustituye la cifra (no la añade): 20');
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(30); // «Hecho» cierra el teclado
  await escribir(e, '#fDesc', 'Compra de prueba');
  await tocar(e, 'saveMov', null, 'hoja', 150);
  const g2 = e.store.movimientos[g.id];
  ok(g2 && g2.importe === 20 && g2.descripcion === 'Compra de prueba' && g2.categoria === 'Supermercado', 'al guardar se cambia el MISMO movimiento: 20 € y la descripción nueva');
  ok(movs(e).length === 3, 'editar no crea uno nuevo (' + movs(e).length + ')');

  // cerrar sin guardar descarta los cambios
  paso('Editar y cerrar sin guardar');
  await tocar(e, 'openMovForm', g.id, 'app');
  await escribir(e, '#fDesc', 'esto no se guarda');
  ok(atras(e) === true, 'el atrás de Android lo resuelve la app');
  await sleep(260);
  ok(!hojaAbierta(e) && e.store.movimientos[g.id].descripcion === 'Compra de prueba', 'al editar, atrás cierra sin guardar y sin preguntar (lo de antes sigue igual)');

  // ---------- Borrar con Deshacer ----------
  paso('Borrar y Deshacer');
  await tocar(e, 'openMovForm', g.id, 'app');
  const del = await tocar(e, 'deleteMov', null, 'hoja', 20);
  ok(!!e.store.movimientos[g.id] && /otra vez/i.test(del.textContent), 'el primer toque en «Eliminar» solo pide confirmar');
  del.click(); await sleep(150);
  ok(!e.store.movimientos[g.id], 'el segundo toque lo borra del servidor');
  ok(/eliminado/i.test(aviso(e)) && !!e.doc.querySelector('#toast .toast-btn'), 'sale «Movimiento eliminado» con «Deshacer»');
  await deshacerToast(e); await sleep(100);
  const rec = e.store.movimientos[g.id];
  ok(rec && rec.importe === 20 && rec.descripcion === 'Compra de prueba', '«Deshacer» lo recupera con el mismo id y los mismos datos');
  ok(movs(e).length === 3, 'tras deshacer siguen 3 movimientos (ni se pierde ni se duplica)');
  await sleep(100);
  ok(/Compra de prueba/.test(pantalla(e)), 'y vuelve a verse en la lista');

  // ---------- Atrás con algo escrito ----------
  paso('Atrás con un gasto a medias');
  await tocar(e, 'onFab'); await tocar(e, 'crearIr', 'gasto', 'hoja');
  await teclearImporte(e, '7');
  atras(e); await sleep(20);
  ok(!!e.doc.querySelector('#descartarHoja'), 'atrás con un importe escrito pregunta «¿Descartar este gasto?»');
  await tocar(e, 'descartarNo', null, null, 20);
  ok(hojaAbierta(e) && e.doc.querySelector('#fImporte').value === '7', '«Seguir editando» conserva el 7');
  atras(e); await sleep(20); await tocar(e, 'descartarSi', null, null, 300);
  ok(!hojaAbierta(e) && movs(e).length === 3, '«Descartar» cierra y no guarda nada');
  await tocar(e, 'onFab'); await tocar(e, 'crearIr', 'gasto', 'hoja');
  ok(e.doc.querySelector('#fImporte').value === '', 'al volver a abrir «Nuevo gasto» empieza vacío');
  atras(e); await sleep(260);
  ok(!hojaAbierta(e) && !e.doc.querySelector('#descartarHoja'), 'vacío, atrás cierra sin preguntar');

  // ---------- 2) Repetir un gasto habitual ----------
  paso('Repetir');
  e = await abrir({ cfg: { app: { nombre: 'Prueba', compararVersiones: false, categoriasGasto: CATS }, meta: { onboarded: true } },
    movs: [{ id: 'r1', tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Café', importe: 1.8, fecha: diasAtras(3) }, { id: 'r2', tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Café', importe: 1.8, fecha: diasAtras(1) }] });
  await tocar(e, 'onFab');
  const rep = buscar(e, 'crearRepetir', null, 'hoja');
  ok(!!rep && /Café/.test(rep.textContent), 'en el + sale «Repetir · Café»');
  rep.click(); await sleep(60);
  ok(e.doc.querySelector('#fImporte').value === '1,8' && (e.doc.querySelector('#fCategoria') || {}).value === 'Restaurantes', 'se abre con 1,8 € y Restaurantes ya puestos');
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(150);
  ms = movs(e).filter((m) => m.descripcion === 'Café');
  ok(ms.length === 3 && ms.some((m) => m.fecha === hoy() && m.importe === 1.8), 'Repetir apunta otro café de 1,8 € con fecha de hoy');

  // ---------- 2b) Red del móvil que pierde la respuesta ----------
  paso('Respuesta perdida al guardar un gasto nuevo');
  e = await abrir({ cfg: { app: { nombre: 'Prueba', compararVersiones: false, categoriasGasto: CATS }, meta: { onboarded: true } } });
  e.srv.perderRespuestas = 1; // el servidor lo guarda, pero al móvil no le llega el «guardado»
  await tocar(e, 'onFab'); await tocar(e, 'crearIr', 'gasto', 'hoja');
  await teclearImporte(e, '9'); await tocar(e, 'tecCat', 'Supermercado', 'hoja');
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(300);
  const avisoRed = aviso(e);
  ok(movs(e).length === 1, 'el servidor tiene el gasto una vez');
  ok(!hojaAbierta(e) || !/No se pudo|conexión|error/i.test(avisoRed), 'si el gasto sí llegó al servidor, la app no dice que no se pudo guardar (dice: «' + avisoRed + '»)', 'RED_GUARDADO_DUDOSO');
  if (hojaAbierta(e)) { e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(300); }
  ok(movs(e).length === 1, 'volver a tocar Guardar tras ese aviso no duplica el gasto (' + movs(e).length + ' guardados)', 'RED_GUARDADO_DUDOSO');

  // ---------- 2c) Guardar al instante (11/11, decisión del dueño) ----------
  paso('Guardar al instante');
  e = await abrir({ cfg: { app: { nombre: 'Prueba', compararVersiones: false, categoriasGasto: CATS }, meta: { onboarded: true } } });
  e.srv.lento = 400; // el servidor tarda
  await tocar(e, 'onFab'); await tocar(e, 'crearIr', 'gasto', 'hoja');
  await teclearImporte(e, '12'); await tocar(e, 'tecCat', 'Supermercado', 'hoja');
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(40);
  ok(!hojaAbierta(e), 'la hoja se cierra al momento, sin esperar al servidor');
  ok(e.S.movimientos.some((m) => m.importe === 12 && m.categoria === 'Supermercado'), 'el gasto ya cuenta en la app mientras se guarda');
  ok(movs(e).length === 0, '(el servidor aún no lo tiene)');
  await sleep(600);
  ok(movs(e).length === 1 && e.S.movimientos.filter((m) => m.importe === 12).length === 1, 'al terminar: guardado una vez y una sola vez en pantalla');
  // y si falla del todo
  e.srv.lento = 0; e.srv.fallarEscritura = true;
  await tocar(e, 'onFab'); await tocar(e, 'crearIr', 'gasto', 'hoja');
  await teclearImporte(e, '7'); await tocar(e, 'tecCat', 'Supermercado', 'hoja');
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(4500); // withRetry reintenta antes de rendirse
  ok(!e.S.movimientos.some((m) => m.importe === 7), 'si no se pudo guardar, desaparece de la pantalla (no queda un gasto que no existe)');
  ok(/No se ha guardado/.test(aviso(e)) && !!e.doc.querySelector('#toast .toast-btn'), 'aviso «No se ha guardado» con botón (' + aviso(e) + ')');
  e.srv.fallarEscritura = false;
  e.doc.querySelector('#toast .toast-btn').click(); await sleep(150);
  ok(movs(e).filter((m) => m.importe === 7).length === 1 && e.S.movimientos.filter((m) => m.importe === 7).length === 1, '«Reintentar» vuelve a guardar el mismo gasto (una vez)');

  // ---------- 3) Ticket (sin IA real) ----------
  paso('Ticket hasta la llamada');
  e = await abrir({ cfg: { app: { nombre: 'Prueba', compararVersiones: false, categoriasGasto: CATS }, meta: { onboarded: true } },
    pre: (w) => { w.__reducirFoto = async () => ({ b64: 'AAAA', tipo: 'image/jpeg' }); } });
  e.srv.funciones['tickets-ia'] = async () => ({ ticket: { es_ticket: true, comercio: 'Súper Inventado', fecha: hoy(), total: 9.3, categoria: 'Supermercado', articulos: [{ nombre: 'Pan', cantidad: 1, importe: 1.3 }, { nombre: 'Fruta', cantidad: 1, importe: 8 }] }, usados: 1, limite: 10 });
  let creado = null; const ce = e.doc.createElement.bind(e.doc);
  e.doc.createElement = (t) => { const x = ce(t); if (String(t).toLowerCase() === 'input') { creado = x; x.click = () => {}; } return x; };
  await tocar(e, 'onFab');
  ok(!!buscar(e, 'crearIr', 'ticket', 'hoja'), 'en el + está «Foto de ticket»');
  await tocar(e, 'crearIr', 'ticket', 'hoja');
  ok(!!creado && creado.type === 'file' && /image/.test(creado.accept), 'tocar «Foto de ticket» pide una foto (selector de imagen)');
  e.doc.createElement = ce;
  if (creado) { Object.defineProperty(creado, 'files', { value: [new e.w.File(['x'], 'ticket.jpg', { type: 'image/jpeg' })] }); creado.onchange(); }
  await sleep(200);
  const ll = e.srv.fetch.filter((f) => /tickets-ia/.test(f[0]));
  ok(ll.length === 1 && ll[0][1] && ll[0][1].imagen === 'AAAA', 'se llama una vez a la función de tickets con la foto');
  ok([...e.doc.querySelectorAll('#sheetHost input')].some((i) => /Súper Inventado/.test(i.value)) && [...e.doc.querySelectorAll('#sheetHost input')].some((i) => /Fruta/.test(i.value)), 'la hoja enseña lo leído (comercio y artículos)');
  ok((app(e).ticketsUso || {}).usados === 1, 'se guarda cuántas lecturas llevas (ticketsUso)');
  const cont = buscar(e, 'tkContinuar', null, 'hoja');
  ok(!!cont, 'sale «Continuar»');
  if (cont) { cont.click(); await sleep(80); }
  const guardarT = buscar(e, 'saveMov', null, 'hoja') || buscar(e, 'tecK', 'Guardar', 'hoja');
  if (guardarT) { guardarT.click(); await sleep(200); }
  ms = movs(e);
  ok(ms.length === 1 && ms[0].importe === 9.3 && (ms[0].articulos || []).length === 2, 'tras «Continuar» y «Guardar» queda un gasto de 9,30 € con sus 2 artículos (' + JSON.stringify(ms.map((m) => [m.importe, m.categoria, (m.articulos || []).length])) + ')');

  // ---------- 4) Importar un CSV inventado ----------
  paso('Importar extracto');
  e = await abrir({ cfg: { app: { nombre: 'Prueba', compararVersiones: false, categoriasGasto: CATS, ingresos: ['Nómina'] }, meta: { onboarded: true } },
    movs: [{ id: 'ya1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'SUPER BARRIO', importe: 25.4, fecha: diasAtras(8) }],
    pre: (w) => { w.TextDecoder = require('util').TextDecoder; } });
  await tocar(e, 'onFab'); await tocar(e, 'crearIr', 'importar', 'hoja');
  ok(!!e.doc.querySelector('#impFile'), 'el + → Importar abre la hoja con «Elegir archivo»');
  const dmy = (iso) => iso.split('-').reverse().join('/');
  const csv = 'Fecha;Concepto;Importe\n' + dmy(diasAtras(8)) + ';SUPER BARRIO;-25,40\n' + dmy(diasAtras(7)) + ';CAFETERIA INVENTADA;-3,20\n' + dmy(diasAtras(6)) + ';NOMINA EMPRESA FICTICIA;1.234,56\n';
  const fi = e.doc.querySelector('#impFile');
  const buf = Buffer.from(csv, 'utf8'); const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  Object.defineProperty(fi, 'files', { value: [{ name: 'extracto_inventado.csv', size: buf.length, arrayBuffer: async () => ab }] });
  fi.dispatchEvent(new e.w.Event('change', { bubbles: true })); await sleep(200);
  ok(/Fecha|Concepto|columna/i.test(hoja(e)), 'tras elegir el CSV se ven las columnas');
  await tocar(e, 'impRevisar', null, 'hoja', 100);
  const t = hoja(e);
  ok(/CAFETERIA INVENTADA/i.test(t) && /NOMINA/i.test(t), 'la vista previa enseña los movimientos del archivo');
  await tocar(e, 'impEjecutar', null, 'hoja', 400);
  ms = movs(e);
  ok(ms.length === 3, 'se importan 2 nuevos y el que ya tenías no se duplica (' + ms.length + ' en total)');
  ok(ms.some((m) => m.tipo === 'Ingreso' && m.importe === 1234.56) && ms.some((m) => m.tipo === 'Gasto' && m.importe === 3.2), 'importes bien leídos: 1.234,56 como ingreso y 3,20 como gasto');
  const lotes = app(e).importLotes || [];
  ok(lotes.length === 1, 'queda un lote para poder deshacer la importación');
  // deshacer desde Tú → Importaciones
  await ir(e, 'tu');
  await tocar(e, 'openLotes', null, 'app');
  const dl = await tocar(e, 'loteDeshacer', null, 'hoja', 30);
  if (movs(e).length === 3) { dl.click(); await sleep(300); }
  ok(movs(e).length === 1 && !!e.store.movimientos.ya1, 'deshacer la importación quita solo lo importado (queda el que ya tenías)');

  // ---------- 5) Traspaso entre dos cuentas ----------
  paso('Traspaso');
  e = await abrir({ cfg: { app: { nombre: 'Prueba', compararVersiones: false, categoriasGasto: CATS, cuentas: [{ id: 'c1', nombre: 'Banco A', saldo: 1000, fecha: diasAtras(20), principal: true }, { id: 'c2', nombre: 'Banco B', saldo: 0, fecha: diasAtras(20) }] }, meta: { onboarded: true } } });
  await tocar(e, 'onFab');
  await tocar(e, 'crearIr', 'traspaso', 'hoja');
  ok(/Traspaso/i.test(hoja(e)), 'se abre la hoja del traspaso');
  const ti = e.doc.querySelector('#fImporte');
  if (e.A.form().tec) await teclearImporte(e, '200'); else await escribir(e, ti, '200');
  ok(e.A.form().desde === 'c1' && e.A.form().a === 'c2', 'por defecto: desde la principal (Banco A) a la otra (Banco B)');
  await tocar(e, 'pickTrasCuenta', /^Banco A a c1$|\ba c1$/ , 'hoja', 20); // elegir la misma en las dos
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(80);
  ok(movs(e).length === 0 && /distintas/i.test(aviso(e)), 'con la misma cuenta en «Desde» y «A» no guarda y lo dice');
  await tocar(e, 'pickTrasCuenta', /\ba c2$/ , 'hoja', 20);
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(200);
  ms = movs(e);
  ok(ms.length === 1 && ms[0].tipo === 'Traspaso' && ms[0].importe === 200 && ms[0].cuentaId === 'c1' && ms[0].cuentaDestinoId === 'c2', 'el traspaso se guarda como UN apunte de 200 € de Banco A a Banco B (' + JSON.stringify(ms.map((m) => [m.tipo, m.importe, m.cuentaId, m.cuentaDestinoId])) + ' · ' + aviso(e) + ')');
  await ir(e, 'dinero'); await sleep(50);
  const pd = pantalla(e);
  ok(/800/.test(pd) && /200/.test(pd), 'Dinero enseña Banco A con 800 € y Banco B con 200 €');
  ok(/1\.000/.test(pd), '«Lo que tienes» sigue en 1.000 € (un traspaso no es gasto)');

  paso('Convertir un gasto en traspaso');
  e = await abrir({ cfg: { app: { nombre: 'Prueba', compararVersiones: false, categoriasGasto: CATS, cuentas: [{ id: 'c1', nombre: 'Banco A', saldo: 1000, fecha: diasAtras(20), principal: true }, { id: 'c2', nombre: 'Banco B', saldo: 0, fecha: diasAtras(20) }] }, meta: { onboarded: true } },
    movs: [{ id: 'cv1', tipo: 'Gasto', categoria: 'Otros', descripcion: 'TRANSFERENCIA A MI OTRA CUENTA', importe: 50, fecha: diasAtras(0), cuentaId: 'c1' }] });
  await ir(e, 'movimientos'); await tocarSiHay(e, 'setMovVista', 'lista', 'app', 60);
  await tocar(e, 'openMovForm', 'cv1', 'app');
  await tocar(e, 'movAtraspaso', null, 'hoja', 60);
  ok(/Convertir en traspaso/.test(hoja(e)) && e.doc.querySelector('#fImporte').value === '50', 'se abre «Convertir en traspaso» con los 50 €');
  await tocar(e, 'saveTraspaso', null, 'hoja', 200);
  ms = movs(e);
  ok(ms.length === 1 && ms[0].id === 'cv1' && ms[0].tipo === 'Traspaso' && ms[0].cuentaId === 'c1' && ms[0].cuentaDestinoId === 'c2', 'el MISMO movimiento pasa a ser un traspaso de Banco A a Banco B (no se duplica) (' + JSON.stringify(ms.map((m) => [m.id, m.tipo, m.cuentaId, m.cuentaDestinoId])) + ')');

  fin('movimientos');
})().catch((x) => { console.log('FAIL excepción: ' + (x && x.stack || x)); process.exit(1); });

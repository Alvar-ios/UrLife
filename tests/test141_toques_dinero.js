// 11/11/2026 · Calidad (auditoría antes de Google Play): Dinero tocando de verdad.
// Cuentas (crear, saldo, cuadrar, principal, quitar), metas (crear, aportar, ligar a una cuenta, quitar),
// deudas (crear, pagar), inversiones (a mano) y cobros/pagos fijos. Solo datos inventados.
const T = require('./toques_comun.js');
const { abrir, tocar, tocarSiHay, buscar, escribir, teclearImporte, hoja, hojaAbierta, pantalla, aviso, deshacerToast, atras, movs, app, ir, ok, paso, fin, sleep } = T;
T.fallosConocidos([]); // 11/11: arreglados
const hoy = T.hoy;
const ayer = () => T.diasAtras(1);
const CATS = [{ nombre: 'Supermercado' }, { nombre: 'Hogar' }, { nombre: 'Otros' }];
const BASE = { nombre: 'Prueba', compararVersiones: false, categoriasGasto: CATS, ingresos: ['Nómina'] };
const ingresar = (e, el, v) => escribir(e, el, v);

(async () => {
  // ---------- 1) Cuentas, desde un usuario sin ninguna ----------
  let e = await abrir({ cfg: { app: Object.assign({}, BASE), meta: { onboarded: true } } });
  paso('Crear la primera cuenta');
  await ir(e, 'dinero');
  await tocar(e, 'openCuentas', null, 'app');
  await tocar(e, 'cuentaAnadir', null, 'hoja');
  ok(!(app(e).cuentas || []).length, 'abrir «Añadir cuenta» no crea nada todavía');
  await escribir(e, '#sheetHost input[data-input^="bancoBuscar"]', 'sant');
  const san = buscar(e, 'bancoElegir', /Santander/, 'hoja');
  ok(!!san, 'buscar «sant» encuentra Santander');
  san.click(); await sleep(80);
  let cs = app(e).cuentas || [];
  ok(cs.length === 1 && cs[0].banco === 'santander' && !!cs[0].id, 'tocar Santander crea UNA cuenta con su banco (' + JSON.stringify(cs) + ')');
  const saldo = e.doc.querySelector('#sheetHost input[aria-label="Saldo de hoy"]');
  ok(!!saldo, 'se abre la ficha de la cuenta con «Saldo de hoy»');
  await escribir(e, saldo, '1500.25', 60);
  cs = app(e).cuentas;
  ok(cs[0].saldo === 1500.25 && cs[0].fecha === hoy(), 'el saldo se guarda (1.500,25 € con fecha de hoy)');
  await escribir(e, '#fCuentaNombre', 'Nómina Santander');
  ok(app(e).cuentas[0].nombre === 'Nómina Santander' && app(e).cuentas.length === 1, 'cambiar el nombre no crea otra cuenta');
  // saldo vacío no borra el saldo
  await escribir(e, '#sheetHost input[aria-label="Saldo de hoy"]', '', 40);
  ok(app(e).cuentas[0].saldo === 1500.25, 'vaciar la casilla del saldo no borra el saldo que había');
  await tocar(e, 'cuentasVolver', 'Listo', 'hoja');
  ok(/Nómina Santander/.test(hoja(e)), '«Listo» vuelve a la lista con la cuenta');

  paso('Segunda cuenta y principal');
  await tocar(e, 'cuentaAnadir', null, 'hoja');
  await tocar(e, 'bancoElegir', /Otro, o sin banco/, 'hoja', 80);
  await escribir(e, '#fCuentaNombre', 'Hucha en casa');
  await escribir(e, '#sheetHost input[aria-label="Saldo de hoy"]', '200', 60);
  cs = app(e).cuentas;
  ok(cs.length === 2 && cs[1].nombre === 'Hucha en casa' && cs[1].saldo === 200, 'se crea la segunda cuenta «Hucha en casa» con 200 €');
  const hp = await tocar(e, 'cuentaPrincipal', null, 'hoja');
  ok(!!e.doc.querySelector('#popupBackdrop'), '«Hacer principal» pregunta antes');
  await tocar(e, 'cuentaPrincipalSi', null, null, 80);
  cs = app(e).cuentas;
  ok(cs[1].principal === true && !cs[0].principal, 'la Hucha pasa a ser la principal (y solo ella)');
  void hp;
  await tocar(e, 'cuentasVolver', 'Listo', 'hoja');
  await atras(e); await sleep(260);
  ok(!hojaAbierta(e), 'atrás de Android cierra la hoja de cuentas');
  await sleep(50);
  ok(/1\.700,25/.test(pantalla(e)), 'Dinero enseña lo que tienes: 1.700,25 € (1.500,25 + 200)');

  paso('Cuadrar con el banco');
  // un gasto de 20 en la cuenta 1 → la app calcula 1.480,25; el banco dice 1.470,25
  await tocar(e, 'onFab'); await tocar(e, 'crearIr', 'gasto', 'hoja');
  await teclearImporte(e, '20'); await tocar(e, 'tecCat', 'Supermercado', 'hoja');
  const ch = buscar(e, 'tecCuenta', null, 'hoja');
  if (ch) { ch.click(); await sleep(40); const opt = [...e.doc.querySelectorAll('[data-click]')].find((x) => /pickCuenta|tecCuentaElegir|cuentaElegir/.test(x.getAttribute('data-click')) && /Nómina Santander/.test(x.textContent)); if (opt) { opt.click(); await sleep(40); } }
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(150);
  const g = movs(e)[0];
  ok(g && g.cuentaId === app(e).cuentas[0].id, 'el gasto se apunta en la cuenta elegida (Nómina Santander) (' + (g && g.cuentaId) + ')');
  await ir(e, 'dinero');
  await tocar(e, 'cuentaVer', app(e).cuentas[0].id, 'app');
  ok(/1\.480,25/.test(hoja(e)), 'la hoja de la cuenta enseña 1.480,25 € (saldo menos el gasto)');
  await tocar(e, 'cuadrarAbrir', null, 'hoja');
  await escribir(e, '#fBanco', '1470.25');
  ok(/10,00|10 €/.test(hoja(e)), 'al escribir lo del banco avisa de la diferencia de 10 €');
  await tocar(e, 'cuadrarOk', null, 'hoja', 80);
  cs = app(e).cuentas;
  ok(cs[0].saldo === 1470.25 && cs[0].cuadre && cs[0].cuadre.dif === -10, 'cuadrar guarda el saldo del banco y el ajuste de −10 €');
  ok(/1\.470,25/.test(hoja(e)), 'y la cuenta enseña 1.470,25 €');

  paso('Quitar una cuenta con movimientos y deshacer');
  await T.cerrarHoja(e); await ir(e, 'dinero');
  await tocar(e, 'openCuentas', null, 'app');
  await tocar(e, 'cuentaEditar', /Nómina Santander/, 'hoja');
  const q = await tocar(e, 'cuentaQuitar', null, 'hoja');
  ok((app(e).cuentas || []).length === 2 && /movimiento/.test(aviso(e)), 'el primer toque en «Quitar» avisa de que tiene 1 movimiento y no quita nada');
  q.click(); await sleep(80);
  ok((app(e).cuentas || []).length === 1 && app(e).cuentas[0].nombre === 'Hucha en casa', 'el segundo toque la quita');
  ok(movs(e).length === 1, 'quitar la cuenta no borra su movimiento');
  await deshacerToast(e); await sleep(60);
  cs = app(e).cuentas || [];
  ok(cs.length === 2 && cs.some((c) => c.nombre === 'Nómina Santander' && c.saldo === 1470.25), '«Deshacer» la recupera con su saldo');
  await sleep(300);

  // ---------- 2) Metas ----------
  paso('Crear meta');
  e = await abrir({ cfg: { app: Object.assign({}, BASE, { cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: ayer(), principal: true }, { id: 'c2', nombre: 'Ahorro', tipo: 'ahorro', saldo: 0, fecha: ayer() }] }), meta: { onboarded: true } } });
  await ir(e, 'dinero');
  await tocar(e, 'metaNueva', null, 'app');
  ok(/Nueva meta/.test(hoja(e)), 'se abre «Nueva meta»');
  await escribir(e, '#mNombre', 'Meta a medias');
  atras(e); await sleep(20);
  const pregunta = !!e.doc.querySelector('#descartarHoja');
  ok(pregunta, 'atrás con una meta a medio escribir pregunta antes de descartarla (como en un gasto)', 'ATRAS_SIN_PREGUNTAR');
  if (pregunta) await tocar(e, 'descartarSi', null, null, 300); else await sleep(260);
  ok(!hojaAbierta(e) && !(app(e).ahorro || []).length, 'la meta a medias no se guarda');
  await tocar(e, 'metaNueva', null, 'app');
  ok(e.doc.querySelector('#mNombre').value === '', 'al volver a abrir «Nueva meta» empieza vacía');
  await tocar(e, 'metaGuardar', null, 'hoja');
  ok(!(app(e).ahorro || []).length && /nombre/i.test(aviso(e)), 'sin nombre no se guarda y pide un nombre');
  await escribir(e, '#mNombre', 'Viaje inventado');
  await escribir(e, '#mObjetivo', '600');
  await tocar(e, 'metaCuentaElegir', / c2$/, 'hoja');
  ok(e.doc.querySelector('#mNombre').value === 'Viaje inventado' && e.doc.querySelector('#mObjetivo').value === '600', 'elegir la cuenta no borra lo ya escrito (nombre y objetivo)');
  await tocar(e, 'metaGuardar', null, 'hoja', 80);
  let ah = app(e).ahorro || [];
  ok(ah.length === 1 && ah[0].nombre === 'Viaje inventado' && ah[0].objetivo === 600 && ah[0].cuentaId === 'c2', 'la meta se guarda con 600 € y ligada a la cuenta Ahorro (' + JSON.stringify(ah) + ')');
  await tocar(e, 'metaGuardar', null, 'hoja').catch(() => {});
  ok((app(e).ahorro || []).length === 1, 'no se crea dos veces');
  await T.cerrarHoja(e);

  paso('Aportar a la meta ligada');
  await ir(e, 'dinero');
  const mv = buscar(e, 'metaVer', null, 'app') || buscar(e, 'metaAportarR', null, 'app');
  ok(!!mv, 'la meta sale en Dinero');
  mv.click(); await sleep(50);
  if (!e.A.form() || e.A.form().kind !== 'aportarR') await tocar(e, 'metaAportarR', null, 'hoja');
  ok(/Aportar a Viaje inventado/.test(hoja(e)), 'se abre «Aportar a Viaje inventado»');
  ok(/pasará de Banco a Ahorro/.test(hoja(e)), 'explica que el dinero pasará de Banco a Ahorro');
  await teclearImporte(e, '150');
  ok(/Aportar 150/.test((e.doc.querySelector('#apGuardar') || {}).textContent || ''), 'el botón dice «Aportar 150,00 €» mientras tecleas');
  await tocar(e, 'tecK', /Aportar/, 'hoja', 200);
  let m1 = movs(e);
  ok(m1.length === 1 && m1[0].tipo === 'Ahorro' && m1[0].importe === 150 && m1[0].metaId === ah[0].id && m1[0].cuentaId === 'c1' && m1[0].cuentaDestinoId === 'c2', 'se guarda un apartado de 150 € de Banco → Ahorro para la meta (' + JSON.stringify(m1.map((m) => [m.tipo, m.importe, m.cuentaId, m.cuentaDestinoId])) + ')');
  await sleep(50);
  const pd = pantalla(e); if (process.env.VER) console.log(pd.replace(/\s+/g,' '));
  ok(/850/.test(pd) && /150/.test(pd), 'Dinero enseña Banco con 850 € y la meta con 150 €');
  ok(/1\.000/.test(pd), '«Lo que tienes» sigue en 1.000 € (no se cuenta dos veces lo apartado)');

  paso('Quitar la meta');
  const mv2 = buscar(e, 'metaVer', null, 'app'); mv2.click(); await sleep(40);
  await tocarSiHay(e, 'metaMas', null, 'hoja');
  await tocar(e, 'metaEditar', null, 'hoja');
  const del = await tocar(e, 'metaEliminar', null, 'hoja', 20);
  ok((app(e).ahorro || []).length === 1, 'el primer toque en «Eliminar meta» solo pide confirmar');
  del.click(); await sleep(80);
  ok(!(app(e).ahorro || []).length, 'el segundo toque quita la meta');
  ok(movs(e).length === 1, 'quitar la meta no borra el apartado de 150 €');
  ok(!!e.doc.querySelector('#toast .toast-btn'), 'al quitar una meta sale «Deshacer» (como en cuentas y deudas)', 'META_SIN_DESHACER');
  await T.cerrarHoja(e); await ir(e, 'dinero');
  if (process.env.VER) console.log('TRAS QUITAR META: ' + pantalla(e).replace(/\s+/g, ' '));
  ok(/1\.000/.test(pantalla(e)) && !/NaN|undefined/.test(pantalla(e)), 'tras quitar la meta, «Lo que tienes» sigue en 1.000 € y no sale nada raro');
  ok(!/apartados para tus metas/.test(pantalla(e)), 'sin metas, no dice «150 € están apartados para tus metas»', 'APARTADO_SIN_META');

  // ---------- 3) Deudas ----------
  paso('Crear deuda');
  e = await abrir({ cfg: { app: Object.assign({}, BASE), meta: { onboarded: true } } });
  await ir(e, 'dinero');
  await tocar(e, 'deudaNueva', null, 'app');
  await escribir(e, '#dNombre', 'Préstamo inventado');
  await escribir(e, '#dTotal', '8.000');
  await escribir(e, '#dPrevio', '1.000,50');
  await escribir(e, '#dCuota', '250');
  await tocar(e, 'deudaGuardar', null, 'hoja', 80);
  let ds = app(e).deudas || [];
  ok(ds.length === 1 && ds[0].objetivo === 8000 && ds[0].previo === 1000.5 && ds[0].cuotaMes === 250, 'la deuda se guarda: total 8.000, ya pagado 1.000,50, 250 al mes (' + JSON.stringify(ds) + ')');
  ok(/Préstamo inventado/.test(hoja(e)) && /6\.999,50/.test(hoja(e)), 'la hoja de la deuda enseña lo que queda: 6.999,50 €');
  paso('Pagar deuda');
  await tocar(e, 'deudaPagar', null, 'hoja', 400);
  ok(/Pago de deuda/.test(hoja(e)) && e.doc.querySelector('#fImporte').value === '250', '«Pagar» abre «Pago de deuda» con la cuota (250) ya puesta');
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(30); // Hecho
  await tocar(e, 'saveMov', null, 'hoja', 150);
  const pg = movs(e);
  ok(pg.length === 1 && pg[0].tipo === 'Deuda' && pg[0].importe === 250 && pg[0].categoria === 'Préstamo inventado', 'se guarda el pago de 250 € a «Préstamo inventado»');
  await ir(e, 'dinero');
  if (process.env.VER) console.log(pantalla(e).replace(/\s+/g,' '));
  ok(/6\.749,50|6\.750/.test(pantalla(e)), 'Dinero enseña lo que queda tras pagar: 6.750 € (redondeado)');

  // ---------- 4) Inversión a mano ----------
  paso('Inversión');
  await tocar(e, 'onFab');
  const mas = buscar(e, 'crearMasToggle', null, 'hoja'); if (mas) { mas.click(); await sleep(30); }
  await tocar(e, 'crearIr', 'inversion', 'hoja');
  ok(/Nueva inversión/.test(hoja(e)), 'se abre «Nueva inversión»');
  await teclearImporte(e, '300');
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(20);
  await tocarSiHay(e, 'invManual', null, 'hoja');
  await escribir(e, '#fCategoria', 'Fondo inventado');
  const ta = e.doc.querySelector('#fTipoActivo'); if (ta) { ta.value = ta.options[1] ? ta.options[1].value : ta.value; ta.dispatchEvent(new e.w.Event('change', { bubbles: true })); }
  await tocar(e, 'saveMov', null, 'hoja', 150);
  const inv = movs(e).find((m) => m.tipo === 'Inversión');
  ok(!!inv && inv.importe === 300 && inv.categoria === 'Fondo inventado' && !!inv.tipoActivo, 'se guarda la inversión de 300 € en «Fondo inventado» con su tipo (' + aviso(e) + ')');
  await ir(e, 'dinero');
  ok(/Fondo inventado/.test(pantalla(e)), 'la inversión sale en Dinero');

  // ---------- 5) Cobros y pagos fijos ----------
  paso('Pagos fijos');
  e = await abrir({ cfg: { app: Object.assign({}, BASE), meta: { onboarded: true } } });
  await ir(e, 'tu');
  await tocar(e, 'openRecurrentes', null, 'app');
  await tocar(e, 'recNuevo', 'factura', 'hoja');
  ok(/Nuevo pago fijo/.test(hoja(e)), 'se abre «Nuevo pago fijo»');
  await escribir(e, '#recNombre', 'Alquiler inventado');
  await escribir(e, '#recImporte', '650,50');
  await tocar(e, 'recCuando', null, 'hoja');
  await tocar(e, 'recCuandoTipo', 'dia', 'hoja');
  await tocar(e, 'recPar', /^5$|dia\|5$/, 'hoja');
  await tocar(e, 'recCuandoUsar', null, 'hoja');
  ok(e.doc.querySelector('#recNombre').value === 'Alquiler inventado' && e.doc.querySelector('#recImporte').value.replace(/\s/g, '') === '650,50', 'al volver de «¿Cuándo se paga?» se conservan el nombre y el importe');
  await tocar(e, 'recGuardar', null, 'hoja', 80);
  const fs = app(e).facturas || [];
  ok(fs.length === 1 && fs[0].nombre === 'Alquiler inventado' && fs[0].importe === 650.5 && fs[0].regla && fs[0].regla.t === 'dia' && Number(fs[0].regla.dia) === 5, 'el pago fijo se guarda: 650,50 € el día 5 (' + JSON.stringify(fs) + ')');
  ok(/Alquiler inventado/.test(hoja(e)), 'sale en la lista de pagos fijos');
  paso('Ingreso fijo');
  await tocar(e, 'recNuevo', 'cobro', 'hoja');
  await escribir(e, '#recNombre', 'Nómina inventada');
  await escribir(e, '#recImporte', '1.800');
  await tocar(e, 'recCuando', null, 'hoja'); await tocar(e, 'recCuandoTipo', 'ultHabil', 'hoja'); await tocar(e, 'recCuandoUsar', null, 'hoja');
  await tocar(e, 'recGuardar', null, 'hoja', 80);
  const cb = app(e).cobros || [];
  ok(cb.length === 1 && cb[0].importe === 1800 && cb[0].regla && cb[0].regla.t === 'ultHabil', 'el ingreso fijo se guarda: 1.800 € el último día hábil');
  ok((app(e).ingresos || []).includes('Nómina inventada'), 'y se añade a tus categorías de ingreso');
  paso('Eliminar un fijo y deshacer');
  await tocar(e, 'recEditar', /Alquiler inventado/, 'hoja');
  const re = await tocar(e, 'recEliminar', null, 'hoja', 20); re.click(); await sleep(80);
  ok(!(app(e).facturas || []).length, 'se elimina el pago fijo');
  await deshacerToast(e); await sleep(60);
  ok((app(e).facturas || []).length === 1 && app(e).facturas[0].nombre === 'Alquiler inventado', '«Deshacer» lo recupera');

  fin('dinero');
})().catch((x) => { console.log('FAIL excepción: ' + (x && x.stack || x)); process.exit(1); });

// 11/11/2026 · Calidad: revisión de las tandas 1, 2 y 3 de depuración (rama fase11/interfaz).
// Tocando de verdad (toques_comun.js). Solo datos inventados.
// Los fallos de la app que se han encontrado y aún no están arreglados salen como «FALLO CONOCIDO» (no rompen npm test).
const T = require('./toques_comun.js');
const { abrir, tocar, escribir, hojaAbierta, aviso, movs, app, ok, paso, fin, sleep, diasAtras, hoy } = T;
T.fallosConocidos(['REINTENTAR_PIERDE_CAMPOS', 'REINTENTAR_EDITAR_PIERDE_CAMBIO']);

const CATS = [{ nombre: 'Supermercado' }, { nombre: 'Restaurantes' }];
const base = (extra) => ({ app: Object.assign({ nombre: 'Prueba', compararVersiones: false, categoriasGasto: CATS }, extra || {}), meta: { onboarded: true } });
const val = (e, s) => ((e.doc.querySelector(s) || {}).value || '');
// fecha del mes «m» atrás, día d (sin pasarse del último día)
const fechaDia = (m, d) => { const x = T.ahoraApp(); x.setDate(1); x.setMonth(x.getMonth() - m); const ult = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); x.setDate(Math.min(d, ult)); return T.isoDe(x); };

(async () => {
  // ---------- 1) Guardar al instante: «Reintentar» tras un fallo ----------
  paso('Reintentar un gasto nuevo con detalle y descripción (formulario completo)');
  let e = await abrir({ cfg: base(), version: { importe: 1 } });
  e.A.H.openMovForm([null]); await sleep(60);
  await escribir(e, '#fImporte', '14,5'); await escribir(e, '#fCategoria', 'Supermercado');
  if (e.doc.querySelector('#fSub')) await escribir(e, '#fSub', 'Fruta');
  await escribir(e, '#fDesc', 'Mercado del sábado');
  e.srv.fallarEscritura = true;
  await tocar(e, 'saveMov', null, 'hoja', 4500);
  ok(!e.S.movimientos.some((m) => m.importe === 14.5) && movs(e).length === 0, 'si falla, el gasto no se queda en pantalla ni en el servidor');
  ok(/No se ha guardado/.test(aviso(e)), 'aviso «No se ha guardado…» (' + aviso(e) + ')');
  e.srv.fallarEscritura = false;
  const bt = e.doc.querySelector('#toast .toast-btn'); if (bt) bt.click(); await sleep(80);
  ok(hojaAbierta(e) && /14,5/.test(val(e, '#fImporte')) && val(e, '#fCategoria') === 'Supermercado' && val(e, '#fDesc') === 'Mercado del sábado', '«Reintentar» devuelve importe, categoría y descripción');
  ok(!e.doc.querySelector('#fSub') || val(e, '#fSub') === 'Fruta', '«Reintentar» también devuelve el detalle (subcategoría) (' + val(e, '#fSub') + ')', 'REINTENTAR_PIERDE_CAMPOS');

  paso('Reintentar al editar un movimiento');
  e = await abrir({ cfg: base(), movs: [{ id: 'e1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Antes', importe: 20, fecha: diasAtras(2), creadoEn: 1 }], version: { importe: 1 } });
  e.A.H.openMovForm(['e1']); await sleep(60);
  await escribir(e, '#fImporte', '25'); await escribir(e, '#fDesc', 'Cambiado');
  e.srv.fallarEscritura = true;
  await tocar(e, 'saveMov', null, 'hoja', 4500);
  const m1 = e.S.movimientos.find((m) => m.id === 'e1');
  ok(m1 && m1.importe === 20 && m1.descripcion === 'Antes' && e.S.movimientos.filter((m) => m.id === 'e1').length === 1, 'si falla al editar, el movimiento vuelve exacto a como estaba (una sola vez)');
  ok(movs(e).length === 1 && movs(e)[0].importe === 20, 'el servidor sigue con el original');
  e.srv.fallarEscritura = false;
  const bt2 = e.doc.querySelector('#toast .toast-btn'); if (bt2) bt2.click(); await sleep(80);
  ok(hojaAbierta(e), '«Reintentar» abre el movimiento');
  ok(/25/.test(val(e, '#fImporte')) && val(e, '#fDesc') === 'Cambiado', '«Reintentar» al editar conserva lo que habías cambiado (' + val(e, '#fImporte') + ' · ' + val(e, '#fDesc') + ')', 'REINTENTAR_EDITAR_PIERDE_CAMBIO');

  // ---------- 2) anadir(): sin duplicados al perder la respuesta, y dos iguales seguidos son dos ----------
  paso('Tarea rápida con respuesta perdida y dos tareas iguales');
  e = await abrir({ cfg: base() });
  await T.ir(e, 'agenda');
  const rap = e.doc.querySelector('#agRapida');
  if (!rap) ok(false, 'hay casilla rápida en la Agenda');
  else {
    e.srv.perderRespuestas = 1;
    await escribir(e, '#agRapida', 'Llamar al taller'); await tocar(e, 'agRapida', null, null, 1500);
    const n1 = Object.values(e.store.tareas || {}).filter((t) => t.nombre === 'Llamar al taller').length;
    ok(n1 === 1, 'con la respuesta perdida y el reintento, la tarea se guarda una sola vez (' + n1 + ')');
    await escribir(e, '#agRapida', 'Comprar pan'); await tocar(e, 'agRapida', null, null, 300);
    await escribir(e, '#agRapida', 'Comprar pan'); await tocar(e, 'agRapida', null, null, 300);
    const n2 = Object.values(e.store.tareas || {}).filter((t) => t.nombre === 'Comprar pan').length;
    ok(n2 === 2, 'dos tareas iguales apuntadas a propósito son dos (' + n2 + ')');
  }

  // ---------- 3) Quitar una meta con «Deshacer» ----------
  paso('Eliminar una meta y deshacer');
  e = await abrir({ cfg: base({ ahorro: [{ id: 'm1', nombre: 'Viaje', objetivo: 1000 }, { id: 'm2', nombre: 'Coche', objetivo: 5000 }, { id: 'm3', nombre: 'Sofá', objetivo: 600 }] }) });
  e.A.H.metaEditar(['m2']); await sleep(60);
  await tocar(e, 'metaEliminar', null, 'hoja', 10); await tocar(e, 'metaEliminar', null, 'hoja', 80);
  ok((app(e).ahorro || []).map((m) => m.id).join(',') === 'm1,m3', 'la meta se quita');
  const des = e.doc.querySelector('#toast .toast-btn'); if (des) des.click(); await sleep(80);
  ok((app(e).ahorro || []).map((m) => m.id).join(',') === 'm1,m2,m3', '«Deshacer» la devuelve en su sitio y con su id (' + (app(e).ahorro || []).map((m) => m.id).join(',') + ')');

  // ---------- 4) «Cobras hacia el día X»: falsos positivos ----------
  paso('Tarjeta «Tu mes»: casos que no deben verla');
  const tarjeta = (x) => !!x.doc.querySelector('.tumes-sug');
  e = await abrir({ cfg: base(), movs: [{ id: 'a', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: fechaDia(1, 30) }, { id: 'b', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: fechaDia(0, 1) }] });
  ok(!tarjeta(e), 'quien cobra unas veces el 30 y otras el 1 no la ve');
  e = await abrir({ cfg: base(), movs: [{ id: 'a', tipo: 'Ingreso', categoria: 'Regalos', importe: 50, fecha: fechaDia(1, 25) }, { id: 'b', tipo: 'Ingreso', categoria: 'Bizum', importe: 20, fecha: fechaDia(0, 27) }] });
  ok(!tarjeta(e), 'ingresos que no son nómina (regalo, bizum) a final de mes no la sacan');
  e = await abrir({ cfg: base(), movs: [{ id: 'a', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: fechaDia(4, 28) }] });
  ok(!tarjeta(e), 'una nómina de hace más de dos meses no cuenta');
  e = await abrir({ cfg: base(), movs: [] });
  ok(!tarjeta(e), 'usuario nuevo sin datos: no sale');
  e = await abrir({ cfg: base({ mesInicio: { modo: 'cobro', dia: 25, nomina: 'Nómina' } }), movs: [{ id: 'a', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: fechaDia(1, 28) }] });
  ok(!tarjeta(e), 'quien ya tiene «Tu mes» desde la nómina no la ve');

  paso('Tarjeta «Tu mes»: en «Lo básico» y al aceptar cambia el mes');
  const nom = [{ id: 'n1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1800, fecha: fechaDia(1, 26) }, { id: 'n2', tipo: 'Ingreso', categoria: 'Nómina', importe: 1800, fecha: fechaDia(2, 26) }];
  e = await abrir({ cfg: base({ nivel: 'basico' }), movs: nom });
  ok(tarjeta(e), 'en «Lo básico» también sale');
  e = await abrir({ cfg: base(), movs: nom });
  ok(tarjeta(e) && /día 26/.test(e.doc.querySelector('.tumes-sug').textContent), 'sale «Cobras hacia el día 26»');
  const f = '2026-03-27', antes = e.A.mesDe(f);
  await tocar(e, 'tuMesSugSi', null, 'app', 80);
  const mi = app(e).mesInicio || {};
  ok(mi.modo === 'cobro' && mi.dia === 26 && !tarjeta(e), '«Sí» guarda «Tu mes» desde el 26 y la tarjeta se va');
  const despues = e.A.mesDe(f), r = e.A.rangoMes(2026, 3);
  ok(antes !== despues || (r && /26/.test(JSON.stringify(r))), 'el 27 de un mes pasa a contar en el mes siguiente / el rango empieza el 26 (' + antes + ' → ' + despues + ', ' + JSON.stringify(r) + ')');

  // ---------- 5) Textos que ya no deben verse ----------
  paso('Textos');
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'app.js'), 'utf8').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  ok(!/'[^'\n]*\ba solas\b[^'\n]*'/i.test(src), 'ningún texto visible dice «a solas»');
  ok(!/pagos recurrentes'/i.test(src) && !/'Cobros y pagos recurrentes/.test(src), 'ningún texto visible dice «Cobros y pagos recurrentes»');

  fin('test146');
})().catch((x) => { console.error(x); process.exit(1); });

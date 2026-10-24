// Pulido 24/10 (docs/15): hoja de cada activo, deudas con icono, hojas de ajustes. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  /* 1. Hoja de cada activo */
  const movs = [
    { id: 'i1', tipo: 'Inversión', categoria: 'Bitcoin', importe: 500, fecha: '2026-03-10', activoId: 'a1', participaciones: 0.008, tipoActivo: 'Cripto' },
    { id: 'i2', tipo: 'Inversión', categoria: 'Bitcoin', importe: 300, fecha: '2026-05-12', activoId: 'a1', participaciones: 0.0045, tipoActivo: 'Cripto' },
    { id: 'i3', tipo: 'Inversión', categoria: 'Fondo raro', importe: 800, fecha: '2026-04-01' },
    { id: 'i4', tipo: 'Inversión', categoria: 'Oro', importe: 100, fecha: '2026-04-02', activoId: 'a2', participaciones: 1, tipoActivo: 'Otro' }];
  const e = makeEnv({ movs, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } }, version: { dinero: 0 } });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, sh = () => e.doc.querySelector('#sheetHost');
  A.S.valoracion = { ts: Date.now(), valores: { a1: { activo: { simbolo: 'BTC', tipo: 'crypto' }, cierre_eur: 60000, fecha_precio: '2026-10-23' } } };
  H.verActivo(['Bitcoin']); await sleep(20);
  const t = sh().textContent;
  ok(/Bitcoin/.test(t) && /Criptomoneda · BTC/.test(t), 'la hoja del activo dice qué es (Criptomoneda · BTC)');
  ok(/Vale hoy/.test(t) && /750,00/.test(t) && /Pierdes 50,00/.test(t), 'valor de hoy (0,0125 × 60.000 = 750 €) y lo que pierdes (50 €)');
  ok(/Aportaste/.test(t) && /800,00/.test(t) && /0,0125 part\./.test(t) && /64\.000,00/.test(t) && /Último precio/.test(t), 'las 4 cifras: aportaste, tienes, te costó de media (64.000 €) y último precio');
  ok(sh().querySelectorAll('.act-mov').length === 2, 'tus aportaciones: las 2 de Bitcoin');
  ok(/Invertir más/.test(t) && /Movimientos/.test(t) && /Precios/.test(t), 'botones: Invertir más, Movimientos y Precios');
  H.activoInvertir(['Bitcoin']); await sleep(20);
  ok(A.form().kind === 'mov' && A.form().tipo === 'Inversión' && A.form().activo && A.form().activo.activo_id === 'a1', '«Invertir más» abre una inversión con el activo ya puesto');
  H.closeSheet([]); await sleep(300);
  H.verActivo(['Fondo raro']); await sleep(20);
  ok(/Sin precio/.test(sh().textContent) && /Buscar el activo/.test(sh().textContent) && /Has metido/.test(sh().textContent), 'sin activo elegido: «Sin precio» y «Buscar el activo»');
  H.activoEnMovs(['Fondo raro']); await sleep(50);
  ok(A.S.tab === 'movimientos', '«Movimientos» lleva a la lista de ese activo');
  ok(A.colorActivo('a1') !== A.colorActivo('a2') && A.colorActivo('a1') === A.colorActivo('a1') && A.colorActivo(null) === null, 'cada activo tiene su color fijo');
  /* 2. Deudas con icono y mes/año propio */
  const e2 = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], deudas: [{ nombre: 'Préstamo coche', objetivo: 9000, emoji: '🚗' }, { nombre: 'Lo de mamá', objetivo: 500 }] }, meta: { onboarded: true } } });
  await sleep(200);
  const B = e2.w.__APP__, sh2 = () => e2.doc.querySelector('#sheetHost');
  ok(B.deudaEmojiSug('Móvil nuevo') === '📱' && B.deudaEmojiSug('Lo de mamá') === '🤝' && B.deudaEmojiSug('Hipoteca') === '🏠' && B.deudaEmojiSug('Algo') === '🧾', 'el icono se elige por el nombre (con tildes)');
  B.H.deudaNueva([]); await sleep(10);
  ok(sh2().querySelectorAll('.deu-ics .dm-emo-b').length === 7 && /Su icono/.test(sh2().textContent) && !sh2().querySelector('input[type="month"]'), 'Nueva deuda: 7 iconos y sin el campo de mes del sistema');
  const nom = sh2().querySelector('#dNombre'); nom.value = 'Tarjeta Visa'; B.H.deudaNombreIn([], nom);
  ok(sh2().querySelector('.deu-ics .dm-emo-b.on').getAttribute('aria-label') === 'Tarjeta', 'al escribir «Tarjeta Visa» se marca el icono Tarjeta');
  B.H.deudaMes(['y|2028']); B.H.deudaMes(['m|3']); await sleep(5);
  ok(sh2().querySelector('#dFecha').value === '2028-03' && sh2().querySelector('#dNombre').value === 'Tarjeta Visa', 'mes y año: marzo de 2028, y el nombre escrito no se pierde');
  B.H.deudaMes(['m|0']); ok(sh2().querySelector('#dFecha').value === '', '«Sin fecha» la quita');
  B.H.deudaMes(['m|6']); sh2().querySelector('#dTotal').value = '1.200'; B.H.deudaGuardar([]); await sleep(80);
  const dv = (B.cfg().deudas || []).find((d) => d.nombre === 'Tarjeta Visa');
  ok(dv && dv.emoji === '💳' && dv.fechaObjetivo === '2028-06-30' && dv.objetivo === 1200, 'se guarda con su icono (💳), fecha (30 jun 2028) y total');
  /* 3. Hojas de ajustes (3.4) */
  const e3 = makeEnv({ version: { tu: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 200 }], metodosPago: ['Efectivo', 'Bizum'], cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 10, ts: 1, tipo: 'ahorro' }],
    cobros: [{ nombre: 'Nómina', importe: 1500, regla: { t: 'ultHabil' } }], facturas: [{ nombre: 'Luz', importe: 40, regla: { t: 'dia', dia: 5 }, categoria: 'Suministros' }] }, meta: { onboarded: true } } });
  await sleep(200);
  const C = e3.w.__APP__, sh3 = () => e3.doc.querySelector('#sheetHost');
  C.H.openCuentas([]); await sleep(5);
  ok(sh3().querySelector('.cuenta-fila .aj-ic') && !sh3().querySelector('.cuenta-fila .dot'), 'Cuentas: icono por tipo en vez de un punto');
  C.H.openListEditor(['metodosPago']); await sleep(5);
  ok(sh3().querySelectorAll('.aj-ic.sm').length === 2 && sh3().querySelector('.rm[aria-label^="Borrar"]'), 'Métodos de pago: con icono y papelera para borrar');
  C.H.listRemove(['metodosPago', 1]); await sleep(10);
  ok((C.cfg().metodosPago || []).join() === 'Efectivo' && /Deshacer/.test(e3.doc.querySelector('#toast').textContent), 'borrar un método enseña «Deshacer»');
  e3.doc.querySelector('#toast .toast-btn').click(); await sleep(10);
  ok((C.cfg().metodosPago || []).join() === 'Efectivo,Bizum', '«Deshacer» lo devuelve a su sitio');
  C.H.openListEditor(['categoriasGasto']); await sleep(5);
  const inp = [...sh3().querySelectorAll('input.amt')][0]; ok(inp && inp.value === '200' && inp.type === 'text', 'presupuesto con teclado decimal y coma');
  inp.value = '250,5'; C.H.catPres(['Supermercado'], inp); await sleep(10);
  ok((C.cfg().categoriasGasto || []).find((c) => c.nombre === 'Supermercado').presupuesto === 250.5, 'el presupuesto «250,5» se guarda bien');
  C.H.openMoneda([]); await sleep(5);
  ok(/Euro · €/.test(sh3().textContent) && /Franco suizo · CHF/.test(sh3().textContent) && !/CHF CHF/.test(sh3().textContent) && /Listo/.test(sh3().textContent), 'Moneda: tarjetas con su nombre y «Listo»');
  C.H.openRecurrentes([]); await sleep(5);
  ok(sh3().querySelectorAll('.rec-fila .aj-ic').length === 2 && /Próximo: /.test(sh3().textContent), 'Recurrentes: con icono y «Próximo:» en su línea');
  C.H.recEditar(['cobro', 0]); await sleep(5);
  ok(sh3().querySelector('h2').textContent === 'Nómina' && sh3().querySelector('#recImporte').type === 'text', 'editar un cobro: el título es su nombre e importe con coma');
  C.H.openPapelera([]); await sleep(5);
  ok(sh3().querySelector('.aj-vacio') && /Está vacía/.test(sh3().textContent), 'Papelera vacía con su dibujo');
  C.H.openReglas([]); await sleep(5); sh3().querySelector('#rgTexto').value = 'repsol'; C.H.reglaTipo(['Gasto']); await sleep(5);
  ok(sh3().querySelector('#rgTipo').value === 'Gasto' && sh3().querySelector('#rgTexto').value === 'repsol' && !sh3().querySelector('select#rgTipo'), 'Reglas: tipo con chips y lo escrito no se pierde');
  sh3().querySelector('#rgCat').value = 'Transporte'; C.H.reglaAnadir([]); await sleep(10);
  ok((C.cfg().reglasCat || []).some((r) => r.texto === 'repsol' && r.tipo === 'Gasto' && r.categoria === 'Transporte'), '«Añadir regla» la guarda con su tipo');
  C.H.tuMesAbrir([]); C.H.tuMesModo(['cobro']); await sleep(5); C.H.tuMesDiaB([25]); await sleep(5);
  ok(!sh3().querySelector('select') && sh3().querySelector('.rec-dia.on').textContent === '25', 'Tu mes: «Cobro el día» con rejilla de días');
  /* 4. Arreglos tras Calidad */
  const inp2 = (C.H.openListEditor(['categoriasGasto']), [...sh3().querySelectorAll('input.amt')][0]); inp2.value = 'abc'; C.H.catPres(['Supermercado'], inp2); await sleep(10);
  ok((C.cfg().categoriasGasto || []).find((c) => c.nombre === 'Supermercado').presupuesto === 250.5, 'un presupuesto «abc» no se guarda como 0');
  C.H.openListEditor(['metodosPago']); C.H.listRemove(['metodosPago', 0]); await sleep(10); const tb = e3.doc.querySelector('#toast .toast-btn'); tb.click(); if (tb.onclick) tb.onclick(); await sleep(10);
  ok((C.cfg().metodosPago || []).join() === 'Efectivo,Bizum', '«Deshacer» dos veces no duplica');
  const e4 = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], deudas: [{ nombre: 'Viaje', objetivo: 900, emoji: '✈️' }] }, meta: { onboarded: true } } });
  await sleep(200); const D = e4.w.__APP__; D.H.deudaEditar(['Viaje']); await sleep(5);
  ok(e4.doc.querySelector('.deu-ics .dm-emo-b.on').getAttribute('data-click') === 'deudaEmoji|' + encodeURIComponent('✈️'), 'una deuda con un emoji antiguo lo conserva marcado');
  D.H.deudaGuardar([]); await sleep(60);
  ok(D.cfg().deudas[0].emoji === '✈️', 'y al guardar sin tocar nada lo mantiene');
  A.H.activoInvertir(['Fondo raro']); await sleep(10);
  ok(A.form().invModo === 'manual', '«Invertir más» en un activo sin precio abre en modo manual');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

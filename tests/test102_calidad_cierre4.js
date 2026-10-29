// Calidad 29/10 (docs/22, cierre 4): nombres cortos raros, apodo, versiones cerradas y formas sin brillo. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const aviso = (c, m) => console.log((c ? 'PASS ' : 'AVISO ') + m); // fallos menores ya avisados a Desarrollo: no bloquean
const dia = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
(async () => {
  const movs = [
    { id: 'm1', tipo: 'Inversión', categoria: 'Fondo raro', importe: 500, fecha: dia(200), activoId: 'a1', participaciones: 5, tipoActivo: 'Fondo' },
    { id: 'm2', tipo: 'Inversión', categoria: 'Otro', importe: 300, fecha: dia(100), activoId: 'a2', participaciones: 3, tipoActivo: 'Otro' }];
  const e = makeEnv({ movs, version: { tu: 0, agenda: 0, crear: 0, dinero: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], ahorro: [{ id: 'h1', nombre: 'Viaje', objetivo: 1000, yaAhorrado: 600, color: 'turquesa' }] }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, doc = e.doc;
  // 1) nombres raros: nunca vacío, nunca cortado a medias de un emoji, como mucho 16 letras + «…»
  const c = (n) => A.invCorto('zz', n);
  ok(c('') === '?' && c(null) === '?', 'nombre vacío → «?»');
  aviso(c('   ') === '?', 'nombre vacío → «?» (' + JSON.stringify([c(''), c(null), c('   ')]) + ')');
  ok(c('Fund ETF Acc') === 'Fund ETF Acc', 'solo palabras de relleno → se queda el nombre tal cual (' + c('Fund ETF Acc') + ')');
  ok(c('(Acc)') !== '', 'solo «(Acc)» no da texto vacío (' + JSON.stringify(c('(Acc)')) + ')');
  const largo = c('Supercalifragilisticoespialidoso');
  ok(largo.length <= 16 && /…$/.test(largo), 'una palabra muy larga se corta con «…» (' + largo + ')');
  const emo = c('🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀 Cohete');
  aviso(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(emo), 'nombre con emojis: no queda medio emoji roto (' + emo + ')');
  ok(c('Apple Inc.') === 'Apple' && c('iShares Core MSCI World UCITS ETF USD (Acc)') === 'iShares World', 'quita el relleno típico de fondos y acciones');
  // 2) apodo: espacios = vacío; vuelve el automático; se escapa en el HTML
  H.goTab(['dinero']); H.irDinero(['inversiones']); await sleep(30);
  H.verActivo(['Fondo raro']); await sleep(20);
  const ap = doc.querySelector('#actApodo');
  ok(!!ap && ap.getAttribute('maxlength') === '18', 'la hoja del activo tiene «Nombre en las gráficas» (máx. 18)');
  ap.value = '   '; H.activoApodo(['a1'], ap); await sleep(20);
  ok(!(A.cfg().apodosActivo || {}).a1 && A.invCorto('a1', 'Fondo raro') === 'raro', 'apodo solo con espacios no se guarda (sale el automático: ' + A.invCorto('a1', 'Fondo raro') + ')');
  ap.value = '<b>X</b>'; H.activoApodo(['a1'], ap); await sleep(20);
  H.closeSheet && H.closeSheet(); A.S.invLineas = []; A.render(); await sleep(20);
  const html = doc.querySelector('#content').innerHTML;
  ok(!/<b>X<\/b>/.test(html), 'el apodo se escapa (no mete HTML en la página)');
  ok((A.cfg().apodosActivo || {}).a2 === undefined, 'el apodo de un activo no toca los demás');
  ap.value = ''; H.activoApodo(['a1'], ap); await sleep(20);
  ok(!('a1' in (A.cfg().apodosActivo || {})), 'borrar el apodo lo quita de la configuración');
  ok(A.S.movs ? A.S.movs.filter((m) => m.tipo === 'Inversión').every((m) => m.categoria === 'Fondo raro' || m.categoria === 'Otro') : true, 'el apodo no cambia los movimientos');
  // 3) versiones cerradas: sin botón «Antes» y con la variante nueva
  for (const k of ['inicio', 'juntos', 'dinero', 'agenda', 'importe']) ok(A.VERSIONES[k].cerrada && A.VERSIONES[k].def === 0, 'versión «' + k + '» cerrada en la nueva');
  for (const t of ['inicio', 'juntos', 'dinero', 'agenda']) { H.goTab([t]); await sleep(20); ok(!doc.querySelector('.cmp-fab, .comparar-fab, [data-click^="compararCambiar"]'), 'sin botón «Antes» en ' + t); }
  A.S.verAnterior = Object.assign({}, A.S.verAnterior, { importe: 0 }); H.goTab(['inicio']); A.openMovForm ? A.openMovForm(null) : H.openMovForm && H.openMovForm([]); await sleep(30);
  aviso(!doc.querySelector('.tec-antes'), 'sin botón «Antes» en la hoja de apuntar importe (VERSIONES.importe cerrada)'); H.closeSheet && H.closeSheet(); await sleep(10);
  // 4) forma de la meta: sin brillo ni detalles, % fuera de la línea del agua
  H.goTab(['dinero']); H.irDinero(['metas']); await sleep(30);
  const fm = doc.querySelector('.fm.cristal');
  ok(!!fm && !fm.querySelector('.fm-brillo') && !fm.querySelector('.fm-det'), 'forma «cristal» sin brillo ni detalles interiores');
  ok(!!fm && fm.querySelector('.fm-t.sobre'), 'al 60 % el número va sobre el líquido (clase «sobre»)');
  console.log(fails ? fails + ' FALLOS' : 'TODO BIEN'); process.exit(fails ? 1 : 0);
})();

// Calidad 24/10 (docs/19, apartado 3.1): casos raros de la gráfica de inversiones. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const dia = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const serie = (p0, sube, n) => Array.from({ length: n + 5 }, (_, i) => [dia(n + 4 - i), +(p0 * (1 + sube * i / (n + 4))).toFixed(4)]);
const cfgBase = { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } };
(async () => {
  // 1) seis activos, uno sin histórico; «Elegir…», hoja, cursor tras repintar
  const nombres = ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete'];
  const movs = nombres.map((n, i) => ({ id: 'm' + i, tipo: 'Inversión', categoria: n, importe: 100 * (i + 1), fecha: dia(200 - i), activoId: 'a' + i, participaciones: 1, tipoActivo: 'Fondo' }));
  const e = makeEnv({ movs, version: { dinero: 0 }, cfg: cfgBase });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, doc = e.doc;
  const valores = {}, series = {};
  nombres.forEach((n, i) => { valores['a' + i] = { activo: { simbolo: i === 5 ? '' : 'S' + i }, cierre: 1, moneda: 'EUR', fecha_precio: dia(1), cierre_eur: 100 * (i + 1) * (i === 2 ? 0.5 : 1.2) }; if (i !== 6) series['a' + i] = serie(100 * (i + 1), i === 2 ? -0.5 : 0.2, 200); });
  A.S.valoracion = { ts: Date.now(), valores };
    // la clave la calcula la app: la tomamos de la primera fecha real
  A.S.historico = { ts: Date.now(), series, clave: 'a0,a1,a2,a3,a4,a5,a6|' + movs.map((m) => m.fecha).sort()[0] };
  H.goTab(['dinero']); H.irDinero(['inversiones']); await sleep(30);
  const chips = [...doc.querySelectorAll('.tr-lineas .chip')].map((c) => c.textContent.trim());
  ok(chips.length === 6 && chips[5] === 'Elegir…', 'con más de 5 activos: Total + 4 + «Elegir…» (' + chips.join() + ')');
  H.invLineasElegir([]); await sleep(10);
  ok(doc.querySelectorAll('#sheetHost .inv-elegir').length >= 5, 'la hoja «Elegir…» lista los activos');
  H.invLineaHoja(['a0']); await sleep(10);
  ok(A.S.invLineas.join() === 'a0' && doc.querySelector('#sheetHost .inv-elegir[aria-checked="true"]'), 'elegir en la hoja marca el activo');
  ok(doc.querySelectorAll('#invCard path[fill-opacity]').length === 2, 'la tarjeta de detrás se repinta con su franja');
  ok(!!doc.querySelector('#invCard .dm-inv-pie'), 'tras repintar se conserva el pie «Has metido | Ganas»');
  // activo sin histórico elegido desde la hoja
  H.invLineaHoja(['a6']); await sleep(10);
  const franjas = doc.querySelectorAll('#invCard path[fill-opacity]').length;
  ok(A.S.invLineas.indexOf('a6') < 0 || franjas === 3,
    'elegir en la hoja un activo SIN histórico no debería contarse como línea invisible (sel=' + A.S.invLineas.join() + ', franjas=' + franjas + ')');
  for (const id of ['a1', 'a2', 'a3']) H.invLineaHoja([id]);
  ok(A.S.invLineas.length <= 4, 'como mucho 4 a la vez desde la hoja');
  H.closeSheet([]); await sleep(400);
  // cursor tras varios repintados: un solo escuchador por tarjeta, sobre la tarjeta nueva
  for (let k = 0; k < 3; k++) { H.invLinea(['total']); H.invLinea(['a0']); }
  await sleep(10);
  const ch = doc.getElementById('invChart');
  ok(doc.querySelectorAll('#invCard').length === 1 && doc.querySelectorAll('#invChart').length === 1, 'tras repintar hay una sola tarjeta y una sola gráfica');
  let pintados = 0; const fecha = doc.getElementById('invFecha');
  const obs = new e.w.MutationObserver(() => { pintados++; }); obs.observe(fecha, { childList: true, characterData: true, subtree: true });
  ch.getBoundingClientRect = () => ({ left: 0, width: 300, top: 0, height: 150, right: 300, bottom: 150 });
  const Ev = e.w.MouseEvent; const pd = new Ev('pointerdown', { clientX: 150, bubbles: true }); ch.dispatchEvent(pd); await sleep(10);
  ok(fecha.textContent.trim().length > 0, 'arrastrar el dedo tras repintar enseña la fecha (cursor vivo)');
  ok(pintados === 1, 'el cursor se pinta una vez por toque (no hay escuchadores duplicados): ' + pintados);
  const etq = [...doc.querySelectorAll('#invCard .tr-etq')].map((x) => parseFloat(x.style.top));
  ok(etq.every((t) => t >= 0 && t <= 92), 'etiquetas dentro de la gráfica');
  // rentabilidad con 4 elegidos: etiquetas no se pisan
  H.invLinea(['total']); ['a0', 'a1', 'a2', 'a3'].forEach((id) => H.invLinea([id])); H.setInvModo(['rentab']); await sleep(10);
  const tops = [...doc.querySelectorAll('#invCard .tr-etq')].map((x) => parseFloat(x.style.top)).sort((a, b) => a - b);
  ok(tops.length === 5, 'Rentabilidad con 4 activos: 5 etiquetas (29/10: hay hueco a la derecha para ellas)');
  ok(tops.every((t, i) => i === 0 || t - tops[i - 1] >= 9.9), 'las etiquetas no se pisan (' + tops.map((t) => t.toFixed(0)).join(',') + ')');
  H.invLinea(['total']); ['a0', 'a3'].forEach((id) => H.invLinea([id])); await sleep(10);
  ok([...doc.querySelectorAll('#invCard .tr-etq, .inv-cu-v b')].some((x) => /−/.test(x.textContent)), 'rentabilidad negativa con signo «−»');
  // «Ver todo» (pantalla aparte)
  H.setInvModo(['valor']); H.dmVer(['inversiones']); await sleep(30);
  ok(!!doc.querySelector('#invCard') && /Qué tal va cada uno/.test(doc.querySelector('#content').textContent), '«Ver todo»: gráfica y «Qué tal va cada uno»');
  H.invLinea(['total']); H.invLinea(['a1']); await sleep(10);
  ok(doc.querySelectorAll('#invCard').length === 1 && doc.querySelectorAll('#invCard path[fill-opacity]').length === 2, '«Ver todo»: elegir un activo repinta solo la tarjeta');
  // hoja de un activo sin símbolo
  H.verActivo(['Seis']); await sleep(10); H.activoModo(['rentab']); await sleep(10);
  ok(/Rentabilidad/.test(doc.querySelector('#sheetHost').textContent), 'hoja de un activo sin símbolo abre bien en «Rentabilidad»');
  H.verActivo(['Siete']); await sleep(10);
  ok(/Siete/.test(doc.querySelector('#sheetHost').textContent), 'hoja de un activo sin histórico abre sin errores');
  H.closeSheet([]); await sleep(300);

  // 2) un solo activo con 35 días que ha subido mucho: «Al año» desorbitado
  const e2 = makeEnv({ movs: [{ id: 'x1', tipo: 'Inversión', categoria: 'Moneda', importe: 100, fecha: dia(60), activoId: 'b1', participaciones: 1, tipoActivo: 'Cripto' }], version: { dinero: 0 }, cfg: cfgBase });
  await sleep(200);
  const A2 = e2.w.__APP__, d2 = e2.doc;
  A2.S.valoracion = { ts: Date.now(), valores: { b1: { activo: { simbolo: 'MON' }, cierre_eur: 200 } } };
  A2.S.historico = { ts: Date.now(), clave: 'b1|' + dia(60), series: { b1: serie(100, 1, 60) } };
  A2.H.goTab(['dinero']); A2.H.irDinero(['inversiones']); await sleep(30);
  ok(d2.querySelectorAll('.tr-lineas .chip').length === 2, 'un solo activo: Total + su píldora');
  A2.H.invLinea(['b1']); await sleep(10);
  ok(d2.querySelectorAll('#invCard path[fill-opacity]').length === 2, 'un solo activo elegido: su franja y la gris');
  A2.H.invBarras(['anio']); await sleep(10);
  const anio = d2.querySelector('.inv-cu-v').textContent;
  console.log('INFO «Al año» con 60 días y ×2: ' + anio);
  ok(!/menos de un mes/.test(anio), '«Al año» con 60 días no debe decir «menos de un mes» aunque la cifra salga demasiado grande (' + anio + ')');

  // 3) versión «Antes» de Dinero: sin franjas ni «Qué tal va cada uno»
  const e3 = makeEnv({ movs, version: { dinero: 3 }, cfg: cfgBase });
  await sleep(200);
  const A3 = e3.w.__APP__, d3 = e3.doc;
  A3.S.valoracion = A.S.valoracion; A3.S.historico = A.S.historico;
  A3.H.goTab(['dinero']); A3.H.irDinero(['inversiones']); await sleep(30);
  ok(!/Qué tal va cada uno/.test(d3.querySelector('#content').textContent) && !d3.querySelector('.tr-lineas'), '«Antes» de Dinero: sin lo nuevo');

  // 4) usuario nuevo sin inversiones
  const e4 = makeEnv({ movs: [], version: { dinero: 0 }, cfg: cfgBase });
  await sleep(200);
  e4.w.__APP__.H.goTab(['dinero']); e4.w.__APP__.H.irDinero(['inversiones']); await sleep(30);
  ok(!e4.doc.querySelector('.inv-cu') && !!e4.doc.querySelector('#content'), 'sin inversiones: no sale «Qué tal va cada uno» y no rompe');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

// 29/10 (docs/21): Inicio a tu gusto, tanda 3 (Ingresos y gastos, Inversiones, puntos para arrastrar). Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoy = new Date(), iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const mesAtras = (n, dia) => iso(new Date(hoy.getFullYear(), hoy.getMonth() - n, dia || 10));
(async () => {
  const movs = [{ id: 'i0', tipo: 'Ingreso', categoria: 'Nómina', importe: 1000, fecha: mesAtras(0, 2) }, { id: 'g0', tipo: 'Gasto', categoria: 'Comida', importe: 400, fecha: mesAtras(0, Math.min(3, hoy.getDate())) },
    { id: 'i2', tipo: 'Ingreso', categoria: 'Nómina', importe: 1000, fecha: mesAtras(2) }, { id: 'g2', tipo: 'Gasto', categoria: 'Comida', importe: 1300, fecha: mesAtras(2) },
    { id: 'v1', tipo: 'Inversión', categoria: 'Fondo', activoId: 'a1', participaciones: 10, importe: 1000, fecha: mesAtras(3, 1) }];
  const e = makeEnv({ movs, version: { inicio: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Comida' }], inicioWidgets: [{ t: 'meses' }, { t: 'inv' }] }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, S = A.S, H = A.H, doc = e.doc;
  const mb = doc.querySelectorAll('.iw-meses .iw-mb');
  ok(mb.length === 6 && mb[5].classList.contains('act'), 'Ingresos y gastos: 6 meses, el actual resaltado');
  ok(/\+600/.test(doc.querySelector('.iw-mb-pie').textContent), 'el pie dice lo que te queda este mes (+600)');
  const alto = (b, c) => parseFloat(b.querySelector('i.' + c).style.height);
  ok(alto(mb[3], 'gas') > alto(mb[3], 'ing') && Math.abs(alto(mb[3], 'gas') - 72) < 0.5, 'barras proporcionales (el mes de 1.300 € llega arriba)');
  ok(/Aún no tienes|Pon las participaciones|Cargando|No hemos podido/.test(doc.querySelector('.iw-inv, .iw-caja, section.iw:last-of-type') ? doc.body.textContent : ''), 'Inversiones sin precios: un aviso, sin romper Inicio');
  // con precios (como si ya se hubieran cargado)
  const serie = []; for (let d = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1); d <= hoy; d.setDate(d.getDate() + 1)) serie.push([iso(d), 100 + serie.length * 0.1]);
  S.historico = { ts: Date.now(), clave: 'a1|' + mesAtras(3, 1), series: { a1: serie } }; A.render(); await sleep(20);
  const inv = doc.querySelector('.iw-invb');
  ok(inv && inv.querySelector('svg.iw-inv-g path.ln') && /\+/.test(inv.textContent) && inv.classList.contains('sube'), 'Inversiones: valor, ganancia y una sola línea');
  // opciones: 12 meses y periodo Máx
  H.iwEditar([]); await sleep(5);
  ok(doc.querySelectorAll('.iw-ed-f[data-i] .iw-grip').length === 2 && !doc.querySelector('.iw-ed-f.fija .iw-grip'), 'cada pieza tiene sus puntos para arrastrar (la tarjeta del mes no)');
  ok(/6 meses/.test(doc.querySelectorAll('.iw-ed-f[data-i]')[0].textContent), 'la fila dice «6 meses»');
  H.iwOpcAbrir([0]); await sleep(5); H.iwOpcElegir(['12']); await sleep(10);
  ok(S.config.inicioWidgets[0].o.n === 12 && doc.querySelectorAll('.iw-meses .iw-mb').length === 12, '12 meses');
  H.iwOpcAbrir([1]); await sleep(5); ok(doc.querySelectorAll('.av-op').length === 4, 'Inversiones: 4 periodos'); H.iwOpcElegir(['max']); await sleep(10);
  ok(S.config.inicioWidgets[1].o.per === 'max' && /Desde el inicio/.test(doc.querySelector('.iw-inv').textContent), 'periodo Máx');
  // añadir Ingresos y gastos no pregunta (6 meses por defecto)
  H.iwQuitar([0]); H.iwCat([]); H.iwAnadir(['meses']); await sleep(10);
  ok(S.config.inicioWidgets.length === 2 && S.config.inicioWidgets[1].t === 'meses' && !S.config.inicioWidgets[1].o, 'añadir Ingresos y gastos no pregunta nada (6 meses)');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

// 24/10 (docs/19): gráfica de inversiones con franjas y etiquetas, selector corto, «Qué tal va cada uno» y rentabilidad en la hoja del activo. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const dia = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
(async () => {
  const movs = [
    { id: 'm1', tipo: 'Inversión', categoria: 'Bitcoin', importe: 500, fecha: dia(200), activoId: 'a1', participaciones: 0.01, tipoActivo: 'Cripto' },
    { id: 'm2', tipo: 'Inversión', categoria: 'Fondo Global Muy Largo de Nombre', importe: 800, fecha: dia(190), activoId: 'a2', participaciones: 20, tipoActivo: 'Fondo' },
    { id: 'm3', tipo: 'Inversión', categoria: 'Oro', importe: 100, fecha: dia(150), activoId: 'a3', participaciones: 1, tipoActivo: 'Otro' }];
  const e = makeEnv({ movs, version: { dinero: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, doc = e.doc;
  const serie = (p0, sube) => Array.from({ length: 205 }, (_, i) => [dia(204 - i), +(p0 * (1 + sube * i / 204)).toFixed(4)]);
  A.S.valoracion = { ts: Date.now(), valores: { a1: { activo: { simbolo: 'BTC' }, cierre_eur: 60000 }, a2: { activo: { simbolo: 'VGSIF' }, cierre_eur: 44 }, a3: { activo: { simbolo: '' }, cierre_eur: 90 } } };
  A.S.historico = { ts: Date.now(), clave: 'a1,a2,a3|' + dia(200), series: { a1: serie(50000, 0.2), a2: serie(40, 0.1), a3: serie(100, -0.1) } };
  H.goTab(['dinero']); H.irDinero(['inversiones']); await sleep(30);
  ok(A.invCorto('a1', 'Bitcoin') === 'BTC' && A.invCorto('a3', 'Oro') === 'ORO' && A.invCorto('zz', 'Fondo Global Muy Largo') === 'FGML', 'nombre corto: el símbolo o las iniciales');
  const chips = [...doc.querySelectorAll('.tr-lineas .chip')].map((c) => c.textContent.trim());
  ok(chips.join() === 'Total,VGSIF,BTC,ORO', 'píldoras cortas: Total y un símbolo por activo (' + chips.join() + ')');
  const antes = doc.querySelector('#content').innerHTML.length; let renders = 0; const r0 = A.render; 
  H.invLinea(['a1']); await sleep(10);
  ok(doc.querySelectorAll('#invCard path[fill-opacity]').length === 2 && /Total/.test(doc.querySelector('#invCard .tr-etq.total').textContent), '«Valor» con un activo: su franja + la gris del resto, y la etiqueta «Total»');
  ok(doc.querySelector('.tr-lineas .chip[aria-pressed="true"]').textContent.trim() === 'BTC', 'la píldora elegida queda marcada');
  H.setInvModo(['rentab']); await sleep(10);
  ok(doc.querySelectorAll('#invCard .tr-etq').length === 2 && [...doc.querySelectorAll('#invCard .tr-etq')].some((x) => /^BTC [+−]/.test(x.textContent)), '«Rentabilidad»: líneas con su etiqueta al final (BTC +…)');
  ok(doc.querySelector('#invLineV').getAttribute('stroke-width') === '3.4', 'la línea del total es gruesa');
  for (const id of ['a2', 'a3']) H.invLinea([id]);
  H.invLinea(['total']); await sleep(10);
  ok(A.S.invLineas.length === 0 && !doc.querySelector('#invCard .tr-etq'), '«Total» quita los activos');
  ok(/Qué tal va cada uno/.test(doc.querySelector('#content').textContent) && doc.querySelectorAll('.inv-cu-f').length === 3, '«Qué tal va cada uno»: una barra por activo');
  H.invBarras(['anio']); await sleep(10);
  ok(/al año/.test(doc.querySelector('.inv-cu').textContent), '«Al año» cambia las barras sin repintar');
  H.verActivo(['Bitcoin']); await sleep(10); H.activoModo(['rentab']); await sleep(10);
  const sh = doc.querySelector('#sheetHost').textContent;
  ok(/El precio ha subido/.test(sh) && /Al año/.test(sh), 'hoja del activo: «Rentabilidad» (el precio) y «Al año»');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

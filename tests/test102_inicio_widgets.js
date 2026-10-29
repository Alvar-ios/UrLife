// 29/10 (docs/21): Inicio a tu gusto, tanda 1. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoy = new Date(), iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const dia = (n) => { const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1); d.setDate(Math.min(n, 28)); return iso(d); };
const base = () => ({ categoriasGasto: [{ nombre: 'Comida', presupuesto: 100 }, { nombre: 'Ocio', presupuesto: 50 }, { nombre: 'Casa', presupuesto: 400 }, { nombre: 'Ropa', presupuesto: 0 }],
  ahorro: [{ id: 'h1', nombre: 'Viaje', objetivo: 1000, yaAhorrado: 250 }, { id: 'h2', nombre: 'Colchón', objetivo: 2000, yaAhorrado: 500 }],
  cuentas: [{ id: 'c1', nombre: 'Banco Uno', saldo: 1500, ts: 1 }] });
const movs = [{ id: 'g1', tipo: 'Gasto', categoria: 'Comida', importe: 90, fecha: dia(2) }, { id: 'g2', tipo: 'Gasto', categoria: 'Ocio', importe: 70, fecha: dia(3) },
  { id: 'g3', tipo: 'Gasto', categoria: 'Casa', importe: 40, fecha: dia(4) }, { id: 'g4', tipo: 'Gasto', categoria: 'Ropa', importe: 20, fecha: dia(5) },
  { id: 'g5', tipo: 'Gasto', categoria: 'Taxi', importe: 5, fecha: dia(5) }, { id: 'g6', tipo: 'Gasto', categoria: 'Libros', importe: 4, fecha: dia(5) }];
(async () => {
  // sin lista: Inicio igual que siempre (Así vas + Estos días) y el botón «Editar Inicio»
  let e = makeEnv({ movs, version: { inicio: 0 }, cfg: { app: base(), meta: { onboarded: true } } }); await sleep(200);
  let H = e.w.__APP__.H, doc = e.doc, S = () => e.w.__APP__.S;
  ok(doc.querySelector('.ins-circ') && doc.querySelector('.dias-tit') && !doc.querySelector('.iw'), 'sin lista: Así vas y Estos días, sin piezas nuevas');
  ok(doc.querySelector('.iw-editar') && /Editar Inicio/.test(doc.querySelector('.iw-editar').textContent) && doc.querySelector('.iw-editar .badge-new'), 'botón «Editar Inicio» con NUEVO');
  H.iwEditar([]); await sleep(10);
  ok(doc.querySelectorAll('.iw-ed-f').length === 3 && /Tarjeta del mes/.test(doc.querySelector('.iw-ed-f.fija').textContent), 'la hoja: tarjeta fija + 2 piezas');
  ok(/Recomendada/.test(doc.querySelectorAll('.iw-ed-f')[1].textContent), 'Así vas sale como recomendada');
  H.iwCat([]); await sleep(10);
  ok(doc.querySelectorAll('.iw-cat-t').length === 13 && doc.querySelectorAll('.iw-cat-t.ya').length === 2, 'catálogo: 13 piezas (sin Juntos, deudas ni inversiones: no hay), 2 ya puestas');
  ok(doc.querySelector('.iw-cat-t .iw-prev-in .iw-anillo') && !doc.querySelector('.iw-prev-in [data-click]'), 'vista previa con tus datos y sin botones vivos');
  H.iwFiltro(['dinero']); await sleep(5);
  ok(doc.querySelectorAll('.iw-cat-t').length === 3, 'filtro Dinero: meta, lo que tienes y cuentas');
  H.iwAnadir(['meta']); await sleep(5);
  ok(/¿Qué meta\?/.test(doc.querySelector('#sheet, .sheet, body').textContent), 'una meta pregunta cuál');
  H.iwOpcElegir(['h2']); await sleep(10);
  ok(JSON.stringify(S().config.inicioWidgets) === JSON.stringify([{ t: 'asivas' }, { t: 'dias' }, { t: 'meta', o: { key: 'h2' } }]), 'se guarda la lista con la meta elegida');
  H.iwCat([]); H.iwAnadir(['gastos']); H.iwCat([]); H.iwAnadir(['presu']); H.iwCat([]); H.iwAnadir(['tienes']); H.iwCat([]); H.iwAnadir(['fijos']); await sleep(10);
  ok(S().config.inicioWidgets.length === 7, '7 piezas');
  H.iwCat([]); H.iwAnadir(['gastos']); await sleep(5);
  ok(S().config.inicioWidgets.length === 7, 'no se repite una pieza que ya tienes');
  H.iwCat([]); H.iwAnadir(['meta']); H.iwOpcElegir(['h1']); await sleep(5);
  ok(S().config.inicioWidgets.length === 8, 'dos metas distintas: 8 piezas');
  H.iwCat([]); H.iwAnadir(['meta']); await sleep(5);
  ok(S().config.inicioWidgets.length === 8 && /quita una/.test(doc.body.textContent), 'máximo 8');
  H.iwVista(['lista']); H.iwMover([0, 1]); await sleep(5);
  ok(S().config.inicioWidgets[0].t === 'dias' && S().config.inicioWidgets[1].t === 'asivas', 'flecha: cambia el orden');
  H.iwQuitar([1]); await sleep(5);
  ok(!S().config.inicioWidgets.some((x) => x.t === 'asivas') && /Te recomendamos tenerla/.test(doc.body.textContent), 'quitar Así vas avisa que se recomienda');
  H.closeSheet([]); await sleep(400);
  ok(!doc.querySelector('.ins-circ'), 'sin Así vas en Inicio');
  // piezas en Inicio
  const ma = doc.querySelector('.iw-meta.medio'), ti = doc.querySelector('.iw-tienes');
  ok(doc.querySelectorAll('.iw-meta').length === 2 && /Colchón/.test(ma.textContent) && /500/.test(ma.textContent) && ma.querySelector('.iw-mt-mas'), 'Una meta: nombre, cantidad y +');
  ok(!doc.querySelector('.iw-par') && doc.querySelector('.iw-meta.medio'), 'una de medio ancho sola se estira (sin pareja)');
  H.iwEditar([]); H.iwMover([5, -1]); H.closeSheet([]); await sleep(400);
  const par = doc.querySelector('.iw-par');
  ok(par && par.querySelector('.iw-tienes') && par.querySelector('.iw-meta') && /1500|1\.500/.test(ti.textContent), 'dos de medio ancho seguidas comparten fila; Lo que tienes con el saldo');
  const g = doc.querySelector('.iw-gastos');
  ok(g && doc.querySelectorAll('.iw-gf').length === 5 && /Otras/.test(g.textContent) && /229/.test(g.querySelector('.iw-anillo').textContent), 'En qué gastas: 4 categorías + Otras y el total');
  const pf = [...doc.querySelectorAll('.iw-pf')];
  ok(pf.length === 3 && /Ocio/.test(pf[0].textContent) && pf[0].classList.contains('mal') && /Comida/.test(pf[1].textContent) && pf[1].classList.contains('justo') && pf[2].classList.contains('bien'), 'Presupuestos: primero los más justos, con su color');
  ok(doc.querySelector('.iw-fijos') && /Aún no tienes cobros ni pagos fijos/.test(doc.querySelector('.iw-fijos').textContent), 'Próximos fijos vacío invita a añadir');
  // al tocar la meta se abre su hoja; el + abre Aportar
  H.metaAportarR(['h2']); await sleep(10);
  ok(/Aportar a Colchón/.test(doc.body.textContent), 'el + abre Aportar');
  H.closeSheet([]); await sleep(400);

  // meta borrada: «Ya no existe · Elegir otra», nunca se quita sola
  e = makeEnv({ movs, version: { inicio: 0 }, cfg: { app: Object.assign(base(), { inicioWidgets: [{ t: 'meta', o: { key: 'borrada' } }, { t: 'fijos' }] }), meta: { onboarded: true } } }); await sleep(200);
  H = e.w.__APP__.H; doc = e.doc; S = () => e.w.__APP__.S;
  ok(/Esta meta ya no existe/.test(doc.querySelector('.iw-meta').textContent) && !doc.querySelector('.ins-circ'), 'meta borrada: aviso y Elegir otra');
  H.iwOpcAbrir([0]); await sleep(5); H.iwOpcElegir(['h1']); await sleep(10);
  ok(S().config.inicioWidgets[0].o.key === 'h1' && /Viaje/.test(doc.querySelector('.iw-meta').textContent), 'Elegir otra cambia la meta');
  H.iwOpcAbrir([0]); await sleep(5); H.iwOpcElegir(['*']); await sleep(10);
  ok(doc.querySelectorAll('.iw-mt').length === 2 && !doc.querySelector('.iw-meta.medio'), '«Tus metas» a lo ancho');
  H.iwReset([]); await sleep(10);
  ok(JSON.stringify(S().config.inicioWidgets) === JSON.stringify([{ t: 'asivas' }, { t: 'dias' }]), '«Como al principio»');

  // próximos fijos con datos (un pago fijo dentro de lo que queda de mes, si queda)
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  if (hoy.getDate() < fin) {
    e = makeEnv({ movs: [], version: { inicio: 0 }, cfg: { app: Object.assign(base(), { facturas: [{ nombre: 'Gimnasio', importe: 35, diaDelMes: fin }], inicioWidgets: [{ t: 'fijos' }] }), meta: { onboarded: true } } }); await sleep(200);
    ok(/Gimnasio/.test(e.doc.querySelector('.iw-fijos').textContent) && /35/.test(e.doc.querySelector('.iw-ff').textContent), 'Próximos fijos: el pago que falta este mes');
  } else ok(true, 'Próximos fijos: hoy es fin de mes (sin comprobar)');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

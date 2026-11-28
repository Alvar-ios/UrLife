// 28/11 (docs/53 E): Editar Inicio en la propia pantalla (mantener, arrastrar, quitar, añadir). Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ movs: [{ id: 'g0', tipo: 'Gasto', categoria: 'Comida', importe: 20, fecha: new Date().toISOString().slice(0, 10) }], version: { inicio: 0, inicioEd: 0 },
    cfg: { app: { categoriasGasto: [{ nombre: 'Comida' }], inicioWidgets: [{ t: 'asivas' }, { t: 'gastos' }, { t: 'ultimos' }, { t: 'meses' }] }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, S = A.S, H = A.H, doc = e.doc, w = e.w;
  const ev = (el, tipo, x, y) => { const v = new w.MouseEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y }); el.dispatchEvent(v); };
  const orden = () => JSON.stringify(A.S.config.inicioWidgets.map((x) => x.t));
  ok(!doc.querySelector('.iw-e') && doc.querySelector('.iw-editar'), 'al principio no hay modo editar y sale el botón «Editar Inicio»');
  H.iwEditar([]); await sleep(20);
  ok(S.inicioEd && !doc.querySelector('#sheetBackdrop'), 'Editar Inicio no abre una hoja: se edita en la propia pantalla');
  const cajas = () => [...doc.querySelectorAll('#content .iw-e[data-i]')];
  ok(cajas().length === 4 && doc.querySelector('.iw-e-bar') && doc.querySelector('.iw-e-pie'), 'cada pieza en su caja, con «Listo» arriba y «Añadir una pieza» abajo');
  ok(cajas().every((c) => c.querySelector('.iw-e-grip') && c.querySelector('.iw-quitar') && c.querySelector('.iw-e-c[inert]')), 'cada caja: asa, quitar, y el contenido no se puede tocar');
  ok(/Subir/.test(cajas()[1].innerHTML) && cajas()[0].querySelector('[aria-label^="Subir"]').disabled && cajas()[3].querySelector('[aria-label^="Bajar"]').disabled, 'respaldo con flechas: la primera no sube y la última no baja');
  // flechas
  H.iwMoverIn([1, 1]); await sleep(30);
  ok(orden() === '["asivas","ultimos","gastos","meses"]', 'bajar con la flecha cambia el orden y lo guarda');
  // destino del arrastre
  const dest = e.w.__APP__.iwDestino; 
  // arrastrar desde el asa, con las cajas colocadas a mano (en jsdom no hay medidas)
  cajas().forEach((c, k) => { c.getBoundingClientRect = () => ({ top: k * 100, bottom: k * 100 + 80, height: 80, left: 0, right: 300, width: 300 }); });
  ev(cajas()[0].querySelector('.iw-e-grip'), 'pointerdown', 10, 40); ev(doc, 'pointermove', 10, 100); ev(doc, 'pointermove', 10, 280); await sleep(5);
  ok(cajas()[0].classList.contains('arrastra') && cajas()[1].style.transform, 'al arrastrar, la caja se levanta y las demás se apartan');
  ev(doc, 'pointerup', 10, 280); await sleep(40);
  ok(orden() === '["ultimos","gastos","asivas","meses"]', 'soltar dos puestos más abajo la deja en tercer lugar');
  ok(!doc.querySelector('.iw-e.arrastra') && S.inicioEd, 'sigue en modo editar tras soltar');
  // un arrastre cortado por el sistema no cambia nada
  cajas().forEach((c, k) => { c.getBoundingClientRect = () => ({ top: k * 100, bottom: k * 100 + 80, height: 80, left: 0, right: 300, width: 300 }); });
  const antes = orden(); ev(cajas()[3].querySelector('.iw-e-grip'), 'pointerdown', 10, 340); ev(doc, 'pointermove', 10, 100); ev(doc, 'pointercancel', 10, 100); await sleep(30);
  ok(orden() === antes, 'si el sistema corta el gesto, el orden se queda como estaba');
  // pulsación larga sobre la caja (sin asa)
  const c1 = cajas()[1]; ev(c1, 'pointerdown', 50, 150); await sleep(420);
  ok(c1.classList.contains('arrastra'), 'mantener pulsada una caja 350 ms prepara el arrastre');
  ev(doc, 'pointerup', 50, 150); await sleep(10);
  // mover antes de tiempo = desplazar la pantalla, no arrastrar
  const c2 = cajas()[2]; ev(c2, 'pointerdown', 50, 250); ev(doc, 'pointermove', 50, 290); await sleep(420);
  ok(!c2.classList.contains('arrastra'), 'si el dedo se mueve antes, es desplazar: no arrastra');
  ev(doc, 'pointerup', 50, 290);
  // destino puro
  ok(dest && dest([40, 140, 240, 340], 0, 250) === 2 && dest([40, 140, 240, 340], 3, 20) === 0, 'iwDestino cuenta las piezas que quedan por encima');
  // quitar
  H.iwQuitarIn([1]); await sleep(30);
  ok(orden() === '["ultimos","asivas","meses"]' && cajas().length === 3, 'quitar con la cruz la saca de la lista y se guarda');
  // añadir: abre el catálogo y al elegir vuelve a la pantalla
  H.iwAnadirIn([]); await sleep(300);
  ok(doc.querySelector('.iw-cat') && S.inicioEd, 'añadir abre el catálogo con vistas previas');
  H.iwAnadir(['presu']); await sleep(400);
  ok(!doc.querySelector('#sheetBackdrop') && orden() === '["ultimos","asivas","meses","presu"]' && cajas().length === 4, 'al elegir una pieza se añade al final y se cierra el catálogo');
  // atrás de Android sale del modo
  ok(e.w.__atras() === true && !S.inicioEd && !doc.querySelector('.iw-e'), 'atrás sale del modo editar');
  // Listo
  H.iwEditar([]); await sleep(10); H.iwListo([]); await sleep(10);
  ok(!S.inicioEd && !doc.querySelector('.iw-e'), '«Listo» sale del modo editar');
  // mantener pulsada una pieza de Inicio entra
  const pz = doc.querySelector('#content .iw'); ev(pz, 'pointerdown', 50, 150); await sleep(560);
  ok(S.inicioEd, 'mantener pulsada una pieza de Inicio entra en el modo editar'); H.iwListo([]);
  // máximo
  H.iwEditar([]); await sleep(5); H.iwResetIn([]); await sleep(30);
  ok(orden() === '["asivas","dias"]', '«Como al principio» deja las dos de siempre');
  // la versión anterior sigue siendo la hoja
  S.verAnterior.inicioEd = 1; H.iwListo([]); H.iwEditar([]); await sleep(20);
  ok(!S.inicioEd && doc.querySelector('#sheetBackdrop .iw-ed-f'), 'la versión «Antes» abre la hoja con lista de siempre');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

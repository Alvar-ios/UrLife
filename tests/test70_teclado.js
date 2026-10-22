// Teclado propio para el importe (22/10/2026, docs/12-teclado-importe.md). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const NUEVAS = { tu: 0, agenda: 0, crear: 0, importe: 0 };
(async () => {
  const hoyD = new Date(), d = (n) => { const x = new Date(hoyD); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
  const e = makeEnv({ version: NUEVAS, movs: [
    { id: 'm1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Mercadona', importe: 42.5, fecha: d(1) },
    { id: 'm2', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Mercadona', importe: 38, fecha: d(5) },
    { id: 'm3', tipo: 'Gasto', categoria: 'Ocio', importe: -19.99, fecha: d(2) },
  ], cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Ocio' }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, q = (s) => doc.querySelector('#sheetHost ' + s);
  const cifra = () => q('#tecCifra .tec-num').textContent, campo = () => q('#fImporte').value, P = (...ks) => ks.forEach((k) => A.tecPulsar(k));
  H.crearIr(['gasto']); await sleep(20);
  ok(q('#tec') && !q('#tec').hidden && q('#fImporte').type === 'hidden', 'nuevo gasto: el teclado de la app abierto y el campo de antes oculto');
  ok(q('#tecCats') && q('#mfMas').hidden && q('.actions').hidden, 'versión corta: cifra, categorías y teclado; lo demás plegado');
  P(','); ok(cifra() === '0,' && campo() === '0,', '«,» sin nada escribe «0,»');
  P('5', '5', '5'); ok(cifra() === '0,55', 'como mucho dos decimales');
  P(','); ok(cifra() === '0,55', 'una segunda coma no se escribe');
  P('clear'); P('0', '5'); ok(cifra() === '5', '«0» y «5» da «5»');
  P('clear'); P('1', '2', '3', '4', '5', '6', '7', '8'); ok(cifra() === '1.234.567', 'como mucho 7 cifras antes de la coma, con puntos de miles');
  ok(campo() === '1234567', 'el campo guarda la cifra sin puntos');
  P('del'); ok(cifra() === '123.456', 'Borrar quita la última');
  P('clear'); P('1', '2', ',', '5');
  P('ok'); await sleep(20);
  ok(Object.keys(e.store.movimientos).length === 3, 'sin categoría no guarda (pide elegirla)');
  H.tecCat(['Ocio']); await sleep(5);
  ok(q('#fCategoria').value === 'Ocio' && q('#tecCats .tec-cat.on'), 'tocar una categoría la elige');
  P('ok'); await sleep(40);
  const nuevo = Object.values(e.store.movimientos).find((m) => m.importe === 12.5);
  ok(nuevo && nuevo.categoria === 'Ocio' && nuevo.tipo === 'Gasto', 'Guardar apunta 12,50 en Ocio');
  await sleep(300);
  // devolución
  H.crearIr(['gasto']); await sleep(20); P('2', '4', ',', '9', '9', 'neg'); H.tecCat(['Supermercado']);
  ok(cifra() === '−24,99' && campo() === '-24,99' && /Devolución/.test(q('#tecPie').textContent), '«− Devolución» la pone en negativo');
  P('ok'); await sleep(40);
  ok(Object.values(e.store.movimientos).some((m) => m.importe === -24.99), 'la devolución se guarda en negativo');
  await sleep(300);
  // Repetir: la cifra sale escrita y la primera tecla la sustituye
  H.crearRepetir(['m1']); await sleep(30);
  ok(cifra() === '42,5' && q('#tecCifra .tec-num.sel'), 'Repetir: el importe ya escrito y resaltado');
  P('9'); ok(cifra() === '9', 'la primera cifra lo sustituye entero');
  H.closeSheet([]); await sleep(300);
  // editar: teclado cerrado, se abre al tocar la cifra, «Hecho»
  H.openMovForm(['m3']); await sleep(20);
  ok(q('#tec').hidden && !q('#mfMas').hidden && cifra() === '−19,99', 'editar: teclado cerrado y la devolución en negativo');
  H.tecAbrir([]); await sleep(5);
  ok(!q('#tec').hidden && /Hecho/.test(q('.tec-ok').textContent), 'al tocar la cifra sale el teclado con «Hecho»');
  P('ok'); ok(q('#tec').hidden, '«Hecho» cierra el teclado');
  H.tecAbrir([]); q('#fDesc').dispatchEvent(new e.w.FocusEvent('focusin', { bubbles: true }));
  ok(q('#tec').hidden, 'al escribir en un campo de texto se cierra el teclado de la app');
  H.closeSheet([]); await sleep(300);
  // teclado físico y pegar
  H.crearIr(['gasto']); await sleep(20);
  const tecla = (key) => doc.body.dispatchEvent(new e.w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  tecla('7'); tecla('.'); tecla('5'); ok(cifra() === '7,5', 'ordenador: cifras y el punto como coma');
  tecla('Backspace'); ok(cifra() === '7,', 'ordenador: Borrar');
  const pegar = (t) => { const ev = new e.w.Event('paste', { bubbles: true, cancelable: true }); ev.clipboardData = { getData: () => t }; doc.body.dispatchEvent(ev); };
  pegar('1.234,56 €'); ok(cifra() === '1.234,56' && campo() === '1234,56', 'pegar «1.234,56 €» da 1.234,56');
  pegar('hola'); ok(cifra() === '1.234,56', 'pegar algo que no es un importe no cambia nada');
  // Más detalles
  H.tecMas([]); await sleep(5);
  ok(!q('#mfMas').hidden && !q('#tecRapido') && !q('.actions').hidden && q('#tec').hidden, '«Más detalles» despliega el formulario completo con Cancelar y Guardar');
  // «Antes»
  H.tecVersion([1]); await sleep(20);
  ok(q('#fImporte').type === 'text' && q('#fImporte').value === '1234,56' && !q('#tec'), '«Antes»: vuelve el campo de siempre con lo escrito');
  H.tecVersion([0]); await sleep(20);
  ok(q('#tec') && cifra() === '1.234,56', 'y vuelta al teclado nuevo');
  H.closeSheet([]); await sleep(300);
  // ingreso: categorías de ingreso
  H.crearIr(['ingreso']); await sleep(20);
  ok(q('#tecCats') && /Nuevo ingreso/.test(q('#movFormTit').textContent) && /En negativo/.test(q('.tec-neg').textContent), 'ingreso: su título y «En negativo»');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

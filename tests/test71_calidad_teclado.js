// Calidad · Teclado propio para el importe (22/10/2026, docs/12-teclado-importe.md): casos raros.
// Que se guarde siempre lo que se ve, que no se guarde dos veces, el teclado del ordenador fuera del formulario,
// «Antes» ↔ teclado, borradores de meta, Inversión, Repetir/Duplicar, editar, usuario nuevo, Escape y la Agenda.
// Datos inventados.
// Las comprobaciones con ok() que fallan son fallos de la app que debe arreglar Desarrollo.
// Las líneas «PEND» son fallos leves conocidos: no hacen fallar la prueba; cuando se arreglen saldrá «ARREGLADO».
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pend = (c, m) => console.log((c ? 'ARREGLADO (cambiar por ok) ' : 'PEND ') + m);
const NUEVAS = { tu: 0, agenda: 0, crear: 0, importe: 0 };
const hoyD = new Date(), d = (n) => { const x = new Date(hoyD); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
const CFG = () => ({ app: { categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Ocio' }], ahorro: [{ id: 'casa', nombre: 'Casa', objetivo: 1000 }],
  cuentas: [{ id: 'c1', nombre: 'Banco A', saldo: 100, principal: true }, { id: 'c2', nombre: 'Banco B', saldo: 50 }] }, meta: { onboarded: true } });

function montar(e) {
  const A = e.w.__APP__, H = A.H, doc = e.doc, q = (s) => doc.querySelector('#sheetHost ' + s);
  const P = (...ks) => ks.forEach((k) => A.tecPulsar(k));
  const tecla = (key, target, extra) => (target || doc.body).dispatchEvent(new e.w.KeyboardEvent('keydown', Object.assign({ key, bubbles: true, cancelable: true }, extra || {})));
  const n = () => Object.keys(e.store.movimientos).length;
  const toastTxt = () => (doc.querySelector('#toast') || {}).textContent || '';
  const cifra = () => (q('#tecCifra .tec-num') || {}).textContent;
  return { A, H, doc, q, P, tecla, n, toastTxt, cifra };
}

(async () => {
  const e = makeEnv({ version: NUEVAS, cfg: CFG(), movs: [
    { id: 'm1', tipo: 'Gasto', categoria: 'Supermercado', subcategoria: 'Fruta', descripcion: 'Frutería', importe: 12, fecha: d(1), cuentaId: 'c2' },
    { id: 'm3', tipo: 'Gasto', categoria: 'Ocio', importe: 10.125, fecha: d(3) }, // importe con 3 decimales (p. ej. de una importación)
    { id: 'm4', tipo: 'Gasto', categoria: 'Ocio', importe: -8, fecha: d(4) },
  ] });
  await sleep(80);
  const { A, H, doc, q, P, tecla, n, toastTxt, cifra } = montar(e);

  // ---------- 1. Lo guardado es lo que se ve ----------
  H.crearIr(['gasto']); await sleep(20);
  P('1', '2', '3', '4', ',', '5', '6'); H.tecCat(['Ocio']);
  ok(cifra() === '1.234,56' && q('#fImporte').value === '1234,56', 'la cifra con miles y el campo oculto sin puntos');
  P('ok'); await sleep(40);
  ok(Object.values(e.store.movimientos).some((m) => m.importe === 1234.56 && m.categoria === 'Ocio'), 'se guarda 1234,56 (lo que se ve)');
  await sleep(300);
  H.crearIr(['gasto']); await sleep(20);
  P('5', ','); H.tecCat(['Ocio']); const antes = n(); P('ok'); await sleep(40);
  ok(n() === antes + 1 && Object.values(e.store.movimientos).some((m) => m.importe === 5), '«5,» se guarda como 5');
  await sleep(300);
  H.crearIr(['gasto']); await sleep(20);
  P('0', ',', 'neg'); H.tecCat(['Ocio']); const a0 = n(); P('ok'); await sleep(40);
  ok(n() === a0 && q('#tec'), '«−0,» no se guarda (pide importe)');
  P('clear'); ok(cifra() === '0' && q('#fImporte').value === '', 'borrar todo deja 0 en gris y el campo vacío');
  H.closeSheet([]); await sleep(300);

  // ---------- 2. Doble guardado con el teclado del ordenador ----------
  H.crearIr(['gasto']); await sleep(20);
  P('7', ',', '7', '7'); H.tecCat(['Supermercado']);
  const b2 = n();
  tecla('Enter'); await sleep(10); // se guarda y la hoja empieza a cerrarse (220 ms)
  tecla('Enter', doc.body, { repeat: true }); await sleep(10); // la tecla sigue pulsada: el navegador repite «Enter»
  const iguales = Object.values(e.store.movimientos).filter((m) => m.importe === 7.77).length;
  ok(n() === b2 + 1 && iguales === 1, 'mantener «Enter» un instante no apunta el gasto dos veces (apuntados: ' + iguales + ')');
  await sleep(300);
  H.crearIr(['gasto']); await sleep(20);
  P('6', ',', '6', '6'); H.tecCat(['Supermercado']);
  tecla('Enter'); await sleep(60); tecla('Enter'); await sleep(10); // dos «Enter» seguidos mientras la hoja se cierra
  const iguales2 = Object.values(e.store.movimientos).filter((m) => m.importe === 6.66).length;
  ok(iguales2 === 1, 'dos «Enter» seguidos no apuntan el gasto dos veces (apuntados: ' + iguales2 + ')');
  await sleep(300);

  // ---------- 3. Teclado del ordenador con la hoja ya cerrada ----------
  H.crearIr(['gasto']); await sleep(20); P('3');
  H.closeSheet([]); await sleep(300); // Cancelar / X / Escape
  const btn = doc.createElement('button'); btn.id = 'botonPagina'; let clics = 0; btn.addEventListener('click', () => clics++); doc.body.appendChild(btn);
  const evEnter = new e.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }); btn.dispatchEvent(evEnter);
  ok(!evEnter.defaultPrevented, 'con la hoja cerrada, «Enter» sobre un botón de la página no lo bloquea el teclado de la app');
  ok(!/Pon un importe|Elige una categoría/.test(toastTxt()), 'con la hoja cerrada, «Enter» no saca avisos del formulario cerrado («' + toastTxt() + '»)');
  const ev5 = new e.w.KeyboardEvent('keydown', { key: '5', bubbles: true, cancelable: true }); doc.body.dispatchEvent(ev5);
  ok(!ev5.defaultPrevented, 'con la hoja cerrada, las cifras del teclado del ordenador no se las queda el formulario cerrado');
  btn.remove();

  // ---------- 4. Escape, y otros formularios ----------
  H.crearIr(['gasto']); await sleep(20);
  tecla('Escape'); await sleep(300);
  ok(!doc.querySelector('#sheetBackdrop'), 'Escape cierra la hoja con el teclado de la app abierto');
  H.openTareaForm ? H.openTareaForm([]) : A.openTareaForm(null); await sleep(30);
  const tin = doc.querySelector('#sheetHost input[type=text]');
  const evT = new e.w.KeyboardEvent('keydown', { key: '4', bubbles: true, cancelable: true }); if (tin) tin.dispatchEvent(evT);
  ok(tin && !evT.defaultPrevented, 'en el formulario de una tarea las cifras se escriben normal');
  H.closeSheet([]); await sleep(300);

  // ---------- 5. Editar: decimales de más no se tocan si no cambias el importe ----------
  H.openMovForm(['m3']); await sleep(20);
  q('#fDesc').value = 'Cine'; H.saveMov([]); await sleep(40);
  ok(e.store.movimientos.m3.importe === 10.125, 'editar solo la descripción no redondea el importe (' + e.store.movimientos.m3.importe + ')');
  await sleep(300);
  // editar una devolución: tocar la cifra y escribir otra conserva el signo (se ve en verde)
  H.openMovForm(['m4']); await sleep(20); H.tecAbrir([]); P('9');
  ok(q('#fImporte').value === '-9' && cifra() === '−9', 'editar una devolución: la cifra nueva sigue en negativo y se ve con «−»');
  H.closeSheet([]); await sleep(300);

  // ---------- 6. Repetir: la subcategoría oculta ----------
  H.crearRepetir(['m1']); await sleep(30);
  ok(q('#fSub') && q('#fSub').value === 'Fruta', 'Repetir trae el detalle «Fruta» (oculto en la versión corta)');
  H.tecCat(['Ocio']); P('4'); P('ok'); await sleep(40);
  const rep = Object.values(e.store.movimientos).find((m) => m.importe === 4 && m.categoria === 'Ocio');
  pend(rep && !rep.subcategoria, 'Repetir y cambiar la categoría en la versión corta no arrastra el detalle oculto «Fruta» (' + (rep && rep.subcategoria) + ')');
  await sleep(300);
  H.crearRepetir(['m1']); await sleep(30); P('3'); P('ok'); await sleep(40);
  const rep2 = Object.values(e.store.movimientos).find((m) => m.importe === 3);
  ok(rep2 && rep2.cuentaId === 'c2' && rep2.categoria === 'Supermercado' && rep2.descripcion === 'Frutería', 'Repetir: cifra nueva y «Guardar» conserva categoría, descripción y cuenta');
  await sleep(300);

  // ---------- 7. «Antes» ↔ teclado ----------
  H.crearRepetir(['m1']); await sleep(30);
  P('6'); H.tecVersion([1]); await sleep(20);
  ok(q('#fImporte').type === 'text' && q('#fImporte').value === '6', '«Antes» conserva la cifra escrita');
  ok(q('#fDesc').value === 'Frutería', '«Antes» conserva la descripción');
  ok(q('#fSub') && q('#fSub').value === 'Fruta', '«Antes» conserva el detalle');
  H.tecVersion([0]); await sleep(20);
  H.closeSheet([]); await sleep(300);
  H.metaAportar(['casa']); await sleep(20);
  P('5', '0'); H.tecVersion([1]); await sleep(20);
  ok(q('[data-click="pickMeta|casa"].active'), '«Antes» en «Aportar» conserva la meta elegida');
  H.tecVersion([0]); await sleep(20);
  H.closeSheet([]); await sleep(300);
  H.openMovForm(['m1']); await sleep(20); H.tecAbrir([]); P('2', '0');
  H.tecVersion([1]); await sleep(20);
  ok(q('#fImporte').value === '20', 'al editar, «Antes» conserva el importe que acabas de escribir (' + q('#fImporte').value + ')');
  H.tecVersion([0]); await sleep(20);
  H.closeSheet([]); await sleep(300);

  // ---------- 8. Borrador de «Nueva meta» y vuelta ----------
  H.crearIr(['ahorro']); await sleep(20);
  ok(q('#tec') && !q('#tec').hidden && /Hecho/.test(q('.tec-ok').textContent) && !q('#tecRapido'), 'Apartar: formulario completo con el teclado abierto y «Hecho»');
  P('7', '5', ',', '5');
  H.metaNuevaForm([]); await sleep(20);
  doc.querySelector('#mNombre').value = 'Viaje'; doc.querySelector('#mObjetivo').value = '900'; H.metaGuardar([]); await sleep(40);
  ok(cifra() === '75,5' && q('#fImporte').value === '75,5', 'tras crear la meta vuelve al formulario con 75,5');
  P('ok'); H.saveMov([]); await sleep(40);
  const vi = (e.store.cfg.app.ahorro || []).find((m) => m.nombre === 'Viaje');
  ok(Object.values(e.store.movimientos).some((m) => m.importe === 75.5 && m.tipo === 'Ahorro' && vi && m.metaId === vi.id), 'y se aparta 75,5 en la meta nueva');
  await sleep(300);

  // ---------- 9. Cambiar de tipo dentro de «Más detalles» ----------
  H.crearIr(['gasto']); await sleep(20);
  P('3', '0', 'neg'); H.tecMas([]); H.pickTipo(['Ingreso']); await sleep(5);
  pend(/En negativo/.test(q('.tec-neg').textContent), 'gasto → ingreso en «Más detalles»: la tecla «−» pasa a decir «En negativo» (sigue: «' + q('.tec-neg').textContent + '»)');
  ok(q('#fImporte').value === '-30' && cifra() === '−30', 'el campo sigue a la cifra (−30)');
  pend(/En negativo/.test(q('#tecPie').textContent), 'el texto de debajo de la cifra se actualiza al cambiar a ingreso («' + q('#tecPie').textContent + '»)');
  H.pickTipo(['Inversión']); await sleep(5);
  pend(!/Devolución/.test(q('#tecPie').textContent), 'una inversión en negativo no se llama «Devolución» (es una venta): «' + q('#tecPie').textContent + '»');
  H.closeSheet([]); await sleep(300);

  // ---------- 10. Mantener «Borrar» y luego escribir ----------
  H.crearIr(['gasto']); await sleep(20);
  P('8', '8');
  const del = q('#tec .tec-del');
  del.dispatchEvent(new e.w.Event('pointerdown', { bubbles: true })); await sleep(560);
  ok(cifra() === '0', 'mantener «Borrar» medio segundo borra todo');
  doc.dispatchEvent(new e.w.Event('pointercancel', { bubbles: true })); // el dedo se va de la tecla: no llega el «click»
  q('[data-click="tecK|5"]').click();
  pend(cifra() === '5', 'tras mantener «Borrar» y soltar fuera de la tecla, la siguiente tecla sí se escribe (sale: ' + cifra() + ')');
  H.closeSheet([]); await sleep(300);

  // ---------- 11. Accesibilidad básica ----------
  H.crearIr(['gasto']); await sleep(20);
  ok(q('#tec[role=group][aria-label]') && q('#tecVoz[aria-live=polite]') && q('#tecCats[role=group]'), 'teclado y categorías con su etiqueta; la cifra se anuncia (aria-live)');
  P('4'); ok(/4 euros/.test(q('#tecVoz').textContent), 'el lector de pantalla oye «4 euros»');
  ok(q('.tec-ok').getAttribute('aria-disabled') === 'true', 'sin categoría, «Guardar» se anuncia como no disponible (pero se puede tocar)');
  ok([...doc.querySelectorAll('#sheetHost #tec button')].every((b) => (b.textContent || '').trim() || b.getAttribute('aria-label')), 'todas las teclas tienen texto o etiqueta');
  H.closeSheet([]); await sleep(300);

  // ---------- 12. Usuario nuevo: sin «Antes» ----------
  const e2 = makeEnv({ version: NUEVAS, cfg: { app: { compararVersiones: false }, meta: { onboarded: true } } });
  await sleep(80);
  const M2 = montar(e2);
  M2.H.crearIr(['gasto']); await sleep(20);
  ok(!M2.q('.tec-antes'), 'usuario nuevo (sin comparar versiones): no sale «Antes»');
  ok(M2.q('#tecCats') && M2.doc.querySelectorAll('#sheetHost .tec-cat:not(.mas)').length === 7 && !M2.q('#tecCuenta'), 'usuario nuevo sin cuentas: 7 categorías de serie y sin ficha de cuenta');
  M2.P('9'); M2.H.tecCat([M2.doc.querySelector('#sheetHost .tec-cat').getAttribute('data-click').split('|')[1] ? decodeURIComponent(M2.doc.querySelector('#sheetHost .tec-cat').getAttribute('data-click').split('|')[1]) : '']); M2.P('ok'); await sleep(40);
  ok(M2.n() === 1 && Object.values(e2.store.movimientos)[0].importe === 9, 'usuario nuevo: apunta su primer gasto de 9 €');
  M2.H.crearIr(['ingreso']); await sleep(20);
  pend(M2.doc.querySelectorAll('#sheetHost .tec-cat:not(.mas)').length > 0, 'sin lista de ingresos (bienvenida saltada o usuario antiguo): el ingreso rápido trae alguna categoría y no solo «Más»');

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log('FAIL excepción: ' + (err && err.stack)); process.exit(1); });

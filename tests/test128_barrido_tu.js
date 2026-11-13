// Calidad · barrido 08/11/2026: Tú → categorías y presupuestos, pagos y cobros fijos, copia de seguridad, aspecto y cerrar sesión.
// Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const conocido = (c, m) => console.log((c ? 'PASS ' : 'FALLO CONOCIDO ') + m); // apuntado en docs/salud/2026-11-08-barrido.md
console.error = () => {};
const NUEVAS = { tu: 1, agenda: 0, crear: 0, importe: 0 };
const hoyD = new Date(), d = (n) => { const x = new Date(hoyD); x.setDate(x.getDate() - n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
(async () => {
  let blobs = [];
  const e = makeEnv({ url: 'https://prueba.example.invalid/', version: NUEVAS, movs: [
    { id: 'm1', tipo: 'Gasto', categoria: 'Bonsáis', importe: 30, fecha: d(0) },
    { id: 'm2', tipo: 'Gasto', categoria: 'Bonsáis', importe: 20, fecha: d(0) },
  ], cfg: { app: { nombre: 'Prueba', categoriasGasto: [{ nombre: 'Bonsáis', presupuesto: 100 }, { nombre: 'Maquetas', presupuesto: null }],
    facturas: [{ nombre: 'Gimnasio', importe: 30, regla: { t: 'dia', dia: 5 }, diaDelMes: 5, categoria: 'Ocio' }, { nombre: 'Móvil', importe: 15, regla: { t: 'dia', dia: 10 }, diaDelMes: 10 }],
    cobros: [{ nombre: 'Nómina', importe: 1500, regla: { t: 'dia', dia: 28 }, diaDelMes: 28 }] }, meta: { onboarded: true } },
  pre: (w) => { const B = w.Blob; w.Blob = function (partes, o) { blobs.push(partes.join('')); return new B(partes, o); }; w.URL.createObjectURL = () => 'blob:prueba'; w.URL.revokeObjectURL = () => {}; w.HTMLAnchorElement.prototype.click = function () {}; } });
  await sleep(100);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost');
  const cats = () => (A.cfg().categoriasGasto || []).filter((c) => !c.std).map((c) => c.nombre);
  const change = (el, v) => { el.value = v; el.dispatchEvent(new e.w.Event('change', { bubbles: true })); };

  // 1) Categorías: crear, presupuesto, renombrar, borrar
  H.openListEditor(['categoriasGasto']); await sleep(20);
  ok(/Categorías y presupuestos/.test(sh().textContent), 'Tú → Categorías: se abre la hoja');
  doc.querySelector('#catNuevaIn').value = 'Huerto'; H.catNueva([]); await sleep(80);
  ok(cats().indexOf('Huerto') >= 0, 'categoría nueva «Huerto» guardada');
  doc.querySelector('#catNuevaIn') && (doc.querySelector('#catNuevaIn').value = 'huerto'); H.catNueva([]); await sleep(80);
  ok(cats().filter((c) => /huerto/i.test(c)).length === 1, 'no deja crear «huerto» otra vez (sin duplicados)');
  const presIn = [...sh().querySelectorAll('input.amt')].find((x) => /Maquetas/.test(x.getAttribute('aria-label') || ''));
  change(presIn, '45,50'); await sleep(30);
  ok((A.cfg().categoriasGasto.find((c) => c.nombre === 'Maquetas') || {}).presupuesto === 45.5, 'presupuesto 45,50 en «Maquetas» (entiende la coma)');
  // renombrar «Bonsáis» a «Bonsáis y plantas»: sus gastos de antes deberían seguir contando para su presupuesto
  let inp = [...sh().querySelectorAll('input.cn-in')].find((x) => x.value === 'Bonsáis');
  change(inp, 'Bonsáis y plantas'); await sleep(80);
  ok(cats().indexOf('Bonsáis y plantas') >= 0 && cats().indexOf('Bonsáis') < 0, 'renombrar: «Bonsáis» pasa a «Bonsáis y plantas» en la lista');
  ok((A.cfg().categoriasGasto.find((c) => c.nombre === 'Bonsáis y plantas') || {}).presupuesto === 100, 'renombrar: conserva su presupuesto (100)');
  conocido(Object.values(e.store.movimientos).every((m) => m.categoria !== 'Bonsáis'), 'renombrar: los 2 gastos de «Bonsáis» pasan a «Bonsáis y plantas» (hoy se quedan con el nombre viejo y dejan de contar en su presupuesto)');
  // renombrar otra vez sin cerrar la hoja: el campo sigue apuntando al nombre viejo
  inp = [...sh().querySelectorAll('input.cn-in')].find((x) => x.value === 'Bonsáis y plantas');
  if (inp) { change(inp, 'Bonsáis grandes'); await sleep(80); }
  conocido(cats().indexOf('Bonsáis grandes') >= 0, 'renombrar dos veces seguidas sin cerrar la hoja (hoy el segundo cambio no se guarda y no avisa)');
  // renombrar a un nombre que ya tienes
  H.closeSheet([]); await sleep(300); H.openListEditor(['categoriasGasto']); await sleep(20);
  inp = [...sh().querySelectorAll('input.cn-in')].find((x) => x.value === 'Maquetas');
  change(inp, 'Huerto'); await sleep(80);
  console.log('   (categorías ahora: ' + cats().join(', ') + ')');
  conocido(cats().filter((c) => c === 'Huerto').length === 1, 'renombrar «Maquetas» a «Huerto», que ya existe (hoy quedan dos «Huerto»)');
  // borrar con doble toque
  H.closeSheet([]); await sleep(300); H.openListEditor(['categoriasGasto']); await sleep(20);
  const antes = cats().length, rm = [...sh().querySelectorAll('[data-click^="catQuitar"]')][0];
  rm.click(); await sleep(10); ok(cats().length === antes, 'borrar categoría: el primer toque solo pide confirmar');
  rm.click(); await sleep(120); ok(cats().length === antes - 1, 'borrar categoría: el segundo toque la quita');
  ok(Object.keys(e.store.movimientos).length === 2, 'borrar una categoría no borra sus gastos');
  H.closeSheet([]); await sleep(300);

  // 2) Pagos y cobros fijos: borrar uno concreto (el segundo) no toca los demás
  H.openRecurrentes([]); await sleep(20);
  ok(/Gimnasio/.test(sh().textContent) && /Móvil/.test(sh().textContent) && /Nómina/.test(sh().textContent), 'Fijos: salen los dos pagos y el cobro');
  H.recEditar(['factura', '1']); await sleep(20);
  ok(doc.querySelector('#recNombre') && doc.querySelector('#recNombre').value === 'Móvil', 'Fijos: se abre «Móvil»');
  const bE = doc.querySelector('#sheetHost [data-click^="recEliminar"]'); bE.click(); await sleep(10);
  ok((A.cfg().facturas || []).length === 2, 'Fijos: el primer toque en Eliminar solo pide confirmar');
  bE.click(); await sleep(60);
  ok((A.cfg().facturas || []).length === 1 && A.cfg().facturas[0].nombre === 'Gimnasio' && (A.cfg().cobros || []).length === 1, 'Fijos: se borra «Móvil» y quedan «Gimnasio» y la nómina');
  conocido(!!doc.querySelector('#toast .toast-btn'), 'Fijos: al eliminar hay «Deshacer», como en las demás listas (hoy no lo hay)');
  // editar un fijo y guardar: mismo número de fijos
  H.recEditar(['factura', '0']); await sleep(20); doc.querySelector('#recImporte').value = '32'; H.recGuardar([]); await sleep(60);
  ok(A.cfg().facturas.length === 1 && A.cfg().facturas[0].importe === 32 && A.cfg().facturas[0].categoria === 'Ocio', 'Fijos: editar «Gimnasio» a 32 € no lo duplica y conserva su categoría');
  H.closeSheet([]); await sleep(300);

  // 3) Copia de seguridad: lleva movimientos, tareas y ajustes
  H.exportBackup([]); await sleep(20);
  let copia = null; try { copia = JSON.parse(blobs[blobs.length - 1]); } catch (x) { /* */ }
  console.log('   (copia: ' + (copia ? Object.keys(copia).join(', ') + ' · config: ' + Object.keys(copia.config || {}).slice(0, 8).join(', ') : 'nada') + ')');
  ok(copia && copia.movimientos.length === 2 && copia.config && Array.isArray(copia.tareas), 'Copia de seguridad: lleva los 2 movimientos, las tareas y los ajustes');
  ok(copia && copia.config.facturas && copia.config.facturas[0].nombre === 'Gimnasio', 'Copia de seguridad: lleva los pagos fijos');
  ok(copia && 'carpetas' in copia && 'aportes' in copia, 'Copia de seguridad: lleva también viajes/temas de los grupos y aportes a metas compartidas (hoy no)');

  // 4) Aspecto: paleta, tema oscuro, tipo de letra y fondo; se quedan en el móvil
  H.openAspecto([]); await sleep(20);
  H.setPaleta(['turquesa']); H.setTheme(['dark']); H.setTipo(['bricolage']); H.setFondo(['puro']); await sleep(20);
  const r = doc.documentElement;
  ok(r.getAttribute('data-look') === 'nuevo' && r.getAttribute('data-paleta') === 'turquesa' && r.getAttribute('data-theme') === 'dark' && r.getAttribute('data-fondo') === 'puro', 'Aspecto: paleta turquesa, oscuro y negro puro aplicados');
  ok(e.w.localStorage.getItem('paleta') === 'turquesa' && e.w.localStorage.getItem('theme') === 'dark', 'Aspecto: se guarda en este dispositivo');
  H.setPaleta(['no-existe']); await sleep(10);
  ok(r.getAttribute('data-paleta') === 'violeta', 'Aspecto: una paleta que no existe vuelve a la de siempre (violeta)');
  H.setTheme(['auto']); await sleep(10);
  ok(!r.getAttribute('data-theme'), 'Aspecto: «Automático» sigue al móvil');
  H.setLook(['clasico']); await sleep(10);
  ok(r.getAttribute('data-look') === 'nuevo', 'Aspecto: el Clásico está retirado; pedirlo deja el Nuevo');
  H.closeSheet([]); await sleep(300);

  // 5) Borrar la cuenta (Google Play lo exige a las apps con registro) y cerrar sesión
  S.tab = 'tu'; S.tuMas = true; A.render(); await sleep(20);
  const tuTxt = doc.querySelector('#content').textContent;
  ok(/Cerrar sesión/.test(tuTxt), 'Tú: está «Cerrar sesión»');
  conocido(/(Borrar|Eliminar) (mi |tu )?cuenta/i.test(tuTxt), 'Tú: hay forma de borrar la cuenta y sus datos (hoy no existe)');
  // pregunta antes
  let salir = 0; e.w.Auth.signOut = async () => { salir++; };
  H.logoutPreguntar([]); await sleep(20);
  ok(salir === 0 && /sesión/i.test(sh().textContent), 'Cerrar sesión: primero pregunta');
  const bS = doc.querySelector('#sheetHost [data-click^="doLogout"]'); if (bS) bS.click(); await sleep(30);
  ok(salir === 1, 'Cerrar sesión: al confirmar, cierra');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

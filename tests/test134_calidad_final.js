// 10/11/2026 · Calidad, revisión final de fase9/pulido: lo que quedaba sin prueba del pulido móvil (docs/32), de los arreglos del barrido
// y de Google Play. Datos inventados. «FALLO CONOCIDO» = fallo de la app apuntado en el informe de Calidad (no rompe la prueba).
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const conocido = (c, m) => console.log((c ? 'PASS ' : 'FALLO CONOCIDO ') + m);
const NUEVAS = { tu: 0, agenda: 0, crear: 0 };
const hoyD = new Date(), d = (n) => { const x = new Date(hoyD); x.setDate(x.getDate() - n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
(async () => {
  /* ---------- 1. Sin conexión: la pantalla de carga avisa a los 8 s (se deja corriendo mientras se prueba lo demás) ---------- */
  const lento = makeEnv({ cfg: { app: {}, meta: { onboarded: true } }, pre: (w) => { w.Data.collection = () => ({ onSnapshot: () => () => {} }); Object.defineProperty(w.navigator, 'onLine', { value: false, configurable: true }); } });
  const tLento = Date.now();

  /* ---------- 2. Contraseña olvidada: al volver del correo se pide la nueva ---------- */
  let rec = true, puesta = null;
  const r = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } },
    pre: (w) => { w.Auth.recuperando = () => rec; w.Auth.cambiarContrasena = async (p) => { puesta = p; rec = false; }; w.Auth.getSession = async () => ({ user: { email: 'prueba@example.invalid' } }); } });
  await sleep(150);
  const rd = r.doc, rH = r.w.__APP__.H;
  ok(/Pon tu contraseña nueva/.test(rd.body.textContent) && !rd.querySelector('#content'), 'vuelta del correo: sale «Pon tu contraseña nueva» en vez de entrar en la app');
  rd.querySelector('#ncPass').value = 'corta'; rd.querySelector('#ncPass2').value = 'corta'; await rH.nuevaContrasenaOk([]);
  ok(/al menos 8 caracteres/.test(rd.body.textContent) && puesta === null, 'contraseña corta: avisa y no cambia nada');
  rd.querySelector('#ncPass').value = 'inventada-123'; rd.querySelector('#ncPass2').value = 'inventada-124'; await rH.nuevaContrasenaOk([]);
  ok(/no coinciden/.test(rd.body.textContent) && puesta === null, 'las dos no coinciden: avisa y no cambia nada');
  rd.querySelector('#ncPass').value = 'inventada-123'; rd.querySelector('#ncPass2').value = 'inventada-123'; await rH.nuevaContrasenaOk([]); await sleep(150);
  ok(puesta === 'inventada-123' && !!rd.querySelector('#content') && !/Pon tu contraseña nueva/.test(rd.body.textContent), 'al guardarla, se cambia y se entra en la app');

  /* ---------- 3. La app normal ---------- */
  let blobs = [], fetchRes = null, fetchN = 0, salio = 0, passOk = true;
  const e = makeEnv({ url: 'https://prueba.example.invalid/', version: NUEVAS, movs: [
    { id: 'm1', tipo: 'Gasto', categoria: 'Bonsáis', importe: 30.5, fecha: d(2), descripcion: 'Tierra; "especial"', metodoPago: 'Cheque regalo', cuentaId: 'c1' },
    { id: 'm2', tipo: 'Gasto', categoria: 'Bonsáis', importe: -12, fecha: d(1), descripcion: 'Devolución maceta', cuentaId: 'c1' },
    { id: 'm3', tipo: 'Ingreso', categoria: 'Nómina', importe: 1000, fecha: d(3), descripcion: 'Nómina', cuentaId: 'c1' },
    { id: 'm4', tipo: 'Traspaso', categoria: 'Traspaso', importe: 200, fecha: d(1), cuentaId: 'c1', cuentaDestinoId: 'c2' },
  ], cfg: { app: { nombre: 'Prueba', categoriasGasto: [{ nombre: 'Bonsáis', presupuesto: 100 }],
    cuentas: [{ id: 'c1', nombre: 'Diario', saldo: 500, saldoFecha: d(40), principal: true }, { id: 'c2', nombre: 'Hucha', saldo: 100, saldoFecha: d(40) }, { id: 'c3', nombre: 'Vacía' }],
    facturas: [{ nombre: 'Gimnasio', importe: 30, regla: { t: 'dia', dia: 5 }, diaDelMes: 5, categoria: 'Ocio' }, { nombre: 'Móvil', importe: 15, regla: { t: 'dia', dia: 10 }, diaDelMes: 10 }] }, meta: { onboarded: true } },
  pre: (w) => { const B = w.Blob; w.Blob = function (partes, o) { blobs.push(partes.join('')); return new B(partes, o); }; w.URL.createObjectURL = () => 'blob:prueba'; w.URL.revokeObjectURL = () => {}; w.HTMLAnchorElement.prototype.click = function () {};
    w.SUPABASE_CONFIG = { url: 'https://falso.example.invalid', anonKey: 'x' }; w.fetch = async (u) => { if (!/\/functions\/v1\/borrar-cuenta$/.test(String(u))) return null; fetchN++; return fetchRes; };
    w.Auth.signIn = async () => { if (!passOk) throw new Error('mal'); return {}; }; w.Auth.signOut = async () => { salio++; }; w.Auth.getSession = async () => ({ access_token: 't' }); w.open = () => ({}); } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' '), toastT = () => doc.querySelector('#toast').textContent;
  const deshacer = async () => { const b = doc.querySelector('#toast .toast-btn'); if (b) b.click(); await sleep(80); return !!b; };

  // Excel
  H.exportCsv([]); await sleep(10);
  const csv = blobs.pop() || '', L = csv.replace(/^﻿/, '').split('\r\n');
  ok(csv.charCodeAt(0) === 0xFEFF && L[0] === 'Fecha;Tipo;Concepto;Categoría;Subcategoría;Cuenta;Importe', 'Excel: cabecera en español y marca para que Excel lea bien las tildes');
  ok(L.length === 5 && /4 movimientos descargados/.test(toastT()), 'Excel: salen los 4 movimientos (también el traspaso) y lo dice');
  ok(L.some((x) => /;"Tierra; ""especial""";Bonsáis;;Diario;-30,50$/.test(x)), 'Excel: el gasto va en negativo, con coma, y el texto con «;» y comillas no rompe las columnas');
  ok(L.some((x) => /;Ingreso;Nómina;Nómina;;Diario;1000,00$/.test(x)) && L.some((x) => /;Traspaso;;;;Diario → Hucha;200,00$/.test(x)), 'Excel: ingreso en positivo y traspaso con «de → a»');
  conocido(L.some((x) => /Devolución maceta;.*;12,00$/.test(x)), 'Excel: una devolución (gasto en negativo) sale como dinero que entra (hoy sale como −12,00, otro gasto: la columna no suma lo mismo que la app)');
  ok(L.slice(1).map((x) => x.slice(0, 10)).join() === L.slice(1).map((x) => x.slice(0, 10)).sort().join(), 'Excel: ordenado por fecha');

  // forma de pago que ya no está en tu lista
  H.openMovForm(['m1']); await sleep(40);
  const fm = doc.querySelector('#fMetodo');
  ok(fm && fm.value === 'Cheque regalo', 'editar un gasto: la forma de pago que ya no está en tu lista sigue elegida');
  H.saveMov([]); await sleep(120);
  ok(e.store.movimientos.m1.metodoPago === 'Cheque regalo' && e.store.movimientos.m1.importe === 30.5, 'y al guardar no se pierde (ni cambia el importe)');
  H.closeSheet([]); await sleep(300);

  // renombrar una categoría: «Pasarlos» y «Deshacer»
  H.openListEditor(['categoriasGasto']); await sleep(30);
  const inp = [...doc.querySelectorAll('#sheetHost input')].find((x) => x.value === 'Bonsáis');
  inp.value = 'Plantas'; inp.dispatchEvent(new e.w.Event('change', { bubbles: true })); await sleep(80);
  ok(/Renombrada\. 2 gastos siguen como «Bonsáis»/.test(toastT()) && doc.querySelector('#toast .toast-btn').textContent === 'Pasarlos', 'renombrar: avisa de los 2 gastos con el nombre viejo y ofrece «Pasarlos»');
  ok(e.store.movimientos.m1.categoria === 'Bonsáis', 'sin pulsar «Pasarlos» no se toca ningún gasto');
  await deshacer(); await sleep(120);
  ok(e.store.movimientos.m1.categoria === 'Plantas' && e.store.movimientos.m2.categoria === 'Plantas' && e.store.movimientos.m3.categoria === 'Nómina' && e.store.movimientos.m1.importe === 30.5 && e.store.movimientos.m2.importe === -12, '«Pasarlos»: los 2 gastos pasan a «Plantas» sin tocar importes ni lo demás');
  A.S._movsRaw = Object.entries(e.store.movimientos).map(([id, v]) => Object.assign({ id }, v)); // en la app real lo trae la relectura
  ok(/2 gastos pasados a «Plantas»/.test(toastT()) && await deshacer(), 'y trae «Deshacer»');
  await sleep(120);
  ok(e.store.movimientos.m1.categoria === 'Bonsáis' && e.store.movimientos.m2.categoria === 'Bonsáis', '«Deshacer» los devuelve a «Bonsáis»');
  H.closeSheet([]); await sleep(300);

  // quitar una cuenta y un pago fijo: «Deshacer»
  H.openCuentas([]); await sleep(30); H.cuentaEditar(['2']); await sleep(30);
  const bq = () => doc.querySelector('#sheetHost [data-click="cuentaQuitar|2"]');
  bq().click(); await sleep(10);
  ok(A.cfg().cuentas.length === 3 && /Toca otra vez para quitar Vacía/.test(toastT()), 'quitar una cuenta sin movimientos: el primer toque solo pregunta');
  if (!bq()) { H.cuentaEditar(['2']); await sleep(30); } bq().click(); await sleep(60);
  ok(A.cfg().cuentas.length === 2 && /Cuenta quitada/.test(toastT()), 'el segundo toque la quita');
  await deshacer();
  ok(A.cfg().cuentas.length === 3 && A.cfg().cuentas[2].nombre === 'Vacía' && A.cfg().cuentas[0].saldo === 500, '«Deshacer» la devuelve a su sitio y no cambia los saldos de las otras');
  H.closeSheet([]); await sleep(300);
  H.openRecurrentes ? H.openRecurrentes([]) : 0; await sleep(20);
  H.recEditar(['factura', '0']); await sleep(30);
  const bE = () => doc.querySelector('#sheetHost [data-click^="recEliminar"]'); bE().click(); await sleep(10); if (bE()) bE().click(); await sleep(60);
  ok(A.cfg().facturas.length === 1 && A.cfg().facturas[0].nombre === 'Móvil', 'eliminar el pago fijo «Gimnasio»');
  await deshacer();
  ok(A.cfg().facturas.length === 2 && A.cfg().facturas[0].nombre === 'Gimnasio' && A.cfg().facturas[0].importe === 30 && A.cfg().facturas[0].categoria === 'Ocio', '«Deshacer» lo recupera entero y en su sitio');
  H.closeSheet([]); await sleep(300);

  // Borrar mi cuenta: nunca cierra la sesión si no se ha borrado
  H.goTab(['tu']); await sleep(20); H.borrarCuentaAbrir([]); await sleep(20);
  const escribe = (p, c) => { doc.querySelector('#bcPass').value = p; doc.querySelector('#bcConf').value = c; };
  passOk = false; escribe('la-que-no-es', 'borrar'); await H.borrarCuentaOk([]); await sleep(20);
  ok(/La contraseña no es correcta/.test(sh()) && fetchN === 0 && salio === 0, 'borrar cuenta con la contraseña mal: avisa y no llama a nada');
  passOk = true; fetchRes = { status: 404, json: async () => ({ code: 'NOT_FOUND', message: 'Requested function was not found' }) };
  escribe('inventada', 'borrar'); await H.borrarCuentaOk([]); await sleep(20);
  ok(fetchN === 1 && /Ahora no se puede borrar desde aquí/.test(sh()) && /menos de 30 días/.test(sh()) && !!doc.querySelector('#sheetHost a[href^="mailto:"]') && salio === 0 && !!doc.querySelector('#content'),
    'con la función sin desplegar (404): mensaje útil con el correo, y la sesión y los datos siguen como estaban');
  ok(!/disabled/.test(doc.querySelector('#sheetHost [data-click^="borrarCuentaOk"]').outerHTML), 'y el botón vuelve a estar disponible');
  fetchRes = { status: 500, json: async () => { throw new Error('no es json'); } };
  escribe('inventada', 'BORRAR'); await H.borrarCuentaOk([]); await sleep(20);
  ok(/Ahora no se puede borrar desde aquí/.test(sh()) && salio === 0, 'si el servidor falla (500): el mismo mensaje, sin cerrar sesión');
  fetchRes = { status: 409, json: async () => ({ error: 'saldo_pendiente', grupos: ['Piso de prueba'] }) };
  escribe('inventada', 'BORRAR'); await H.borrarCuentaOk([]); await sleep(20);
  ok(/Antes tienes que estar en paz en Piso de prueba/.test(sh()) && salio === 0, 'con algo pendiente en un grupo: dice en cuál y no borra');
  fetchRes = { status: 200, json: async () => ({ ok: true }) };
  escribe('inventada', 'BORRAR'); await H.borrarCuentaOk([]); await sleep(40);
  ok(salio === 1, 'solo cuando el servidor dice que se ha borrado, se cierra la sesión');

  // ?borrar-cuenta (enlace de Google Play) abre la hoja al entrar
  const g = makeEnv({ url: 'https://prueba.example.invalid/?borrar-cuenta', version: NUEVAS, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(2100);
  ok(/¿Borrar tu cuenta y tus datos\?/.test(g.doc.querySelector('#sheetHost').textContent), '«?borrar-cuenta» abre la hoja «Borrar mi cuenta» al entrar');

  /* ---------- 4. Agenda: flecha de volver, sin fecha, «Compartir mi agenda» ---------- */
  const a = makeEnv({ version: NUEVAS, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(150);
  const aA = a.w.__APP__, aH = aA.H, ad = a.doc;
  aH.irAgenda(['tareas']); await sleep(30);
  ok(ad.body.classList.contains('en-agenda') && ad.querySelector('#pageTitle').textContent === 'Agenda' && ad.querySelector('#pageSub').hidden, 'Agenda: título «Agenda», sin fecha arriba y con la flecha de volver');
  ok(!ad.querySelector('.tabbar .tab.active'), 'Agenda: ninguna pestaña de abajo marcada');
  ok(!ad.querySelector('#content .link.volver'), 'Agenda: ya no hay un segundo «‹ Inicio» dentro');
  ad.querySelector('#tbVolver').click(); await sleep(30);
  ok(!ad.body.classList.contains('en-agenda') && aA.S.tab === 'inicio' && !ad.querySelector('#pageSub').hidden && !!ad.querySelector('.tabbar .tab.active'), 'la flecha vuelve a Inicio (con su fecha y su pestaña marcada)');
  ok(!ad.querySelector('.agc-fin'), 'sin nadie con quien compartir, no sale «Compartir mi agenda»');
  // atrás de Android con un plan a medio escribir
  aH.irAgenda(['tareas']); await sleep(30); aA.openTareaForm(); await sleep(40);
  const tn = ad.querySelector('#tNombre'); if (tn) tn.value = 'Llamar al fontanero';
  a.w.__atras();
  conocido(!!ad.querySelector('#descartarHoja'), 'Android: «atrás» con un plan nuevo a medio escribir pregunta antes de descartar (hoy lo cierra sin preguntar: la app busca la casilla «tTitulo» y se llama «tNombre»)');

  /* ---------- 5. Usuario nuevo, sin nada ---------- */
  const n = makeEnv({ url: 'https://prueba.example.invalid/', version: NUEVAS, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } },
    pre: (w) => { const B = w.Blob; w.Blob = function (p, o) { blobs.push(p.join('')); return new B(p, o); }; w.URL.createObjectURL = () => 'blob:prueba'; w.URL.revokeObjectURL = () => {}; w.HTMLAnchorElement.prototype.click = function () {}; } });
  await sleep(150);
  const nA = n.w.__APP__, nH = nA.H, nd = n.doc;
  nH.goTab(['movimientos']); await sleep(30);
  ok(nd.querySelectorAll('.mov-vacio').length === 1 && !!nd.querySelector('.mov-vacio [data-click^="crearIr"]') && !!nd.querySelector('.mov-vacio [data-click^="impAbrir"]'), 'usuario nuevo: Movimientos vacío con sus dos botones');
  nH.setMovVista(['lista']); await sleep(30);
  ok(!nd.querySelector('.mov-vacio'), 'el aviso de vacío solo sale en el Resumen');
  blobs = []; nH.exportCsv([]); await sleep(10);
  ok(blobs.length === 1 && blobs[0].replace(/^﻿/, '').split('\r\n').length === 1 && /0 movimientos descargados/.test(nd.querySelector('#toast').textContent), 'usuario nuevo: el Excel sale solo con la cabecera, sin error');
  nH.goTab(['inicio']); await sleep(30); nH.ocultarCifras([]); await sleep(30);
  ok(n.w.localStorage.getItem('cifrasOcultas') === '1' && /Cifras ocultas/.test(nd.querySelector('#toast').textContent), 'ocultar cifras se recuerda en este móvil');
  nH.ocultarCifras([]); await sleep(20);
  ok(n.w.localStorage.getItem('cifrasOcultas') === '0' && !nd.documentElement.classList.contains('cifras-ocultas'), 'y se quita igual');
  ok(typeof n.w.__nativo === 'undefined' && !/Pedir huella/.test((nH.goTab(['tu']), nd.querySelector('#content').textContent)), 'en la web no sale «Pedir huella al abrir»');
  await nH.huellaCambiar([]);
  ok(n.w.localStorage.getItem('huella') == null, 'y en la web la huella no se puede activar por error');

  /* ---------- 6. Huella dentro de la app de Android (puente simulado) ---------- */
  let huellaOk = false;
  const h = makeEnv({ url: 'https://prueba.example.invalid/', version: NUEVAS, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } }, pre: (w) => { w.__nativo = { android: true, huella: true, probarHuella: async () => { if (!huellaOk) throw new Error('cancelado'); }, desbloquear: () => {} }; } });
  await sleep(150);
  const hH = h.w.__APP__.H; hH.goTab(['tu']); await sleep(20);
  ok(/Pedir huella al abrir\s*No/.test(h.doc.querySelector('#content').textContent), 'Android: en Tú sale «Pedir huella al abrir · No»');
  await hH.huellaCambiar([]);
  ok(h.w.localStorage.getItem('huella') !== '1' && /No se ha podido confirmar/.test(h.doc.querySelector('#toast').textContent), 'si cancelas la huella al activarla, no se activa');
  huellaOk = true; await hH.huellaCambiar([]); await sleep(20);
  ok(h.w.localStorage.getItem('huella') === '1' && /Pedir huella al abrir\s*Sí/.test(h.doc.querySelector('#content').textContent), 'con la huella confirmada, queda activada');
  await hH.huellaCambiar([]);
  ok(h.w.localStorage.getItem('huella') === '0', 'y se puede desactivar');
  ok(!!h.doc.querySelector('.bloqueo [data-click^="desbloquear"]'), 'la pantalla de bloqueo tiene su botón «Desbloquear»');

  /* ---------- 1 (fin). Aviso sin conexión ---------- */
  await sleep(Math.max(0, 8400 - (Date.now() - tLento)));
  const lm = lento.doc.querySelector('#loadingMsg');
  ok(lm && /No hay conexión\. En cuanto vuelva, verás tus datos\./.test(lm.textContent) && !!lm.querySelector('[data-click^="reintentarCarga"]'), 'sin conexión: a los 8 s la pantalla de carga lo dice y ofrece «Reintentar»');
  ok(!/No hay conexión|tardando/.test(nd.body.textContent) && !/No hay conexión|tardando/.test(doc.body.textContent), 'con los datos ya cargados, ese aviso no aparece');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})();

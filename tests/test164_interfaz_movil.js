// 12/11/2026 · Desarrollo: arreglos P1 de docs/salud/2026-11-12-diag-interfaz.md.
// Botón atrás de Android (tabla 2.2): cada subpantalla de una hoja vuelve a la anterior y la ventanita se cierra sin salir de la app.
// También: nombre de los interruptores de Tú → Avisos y el texto oscuro de «Pedir por WhatsApp». Solo datos inventados.
const T = require('./toques_comun.js');
const { abrir, tocar, hoja, atras, ok, paso, fin, sleep } = T;
const { makeEnv } = require('./harness.js');
const { TextDecoder } = require('util');
const fs = require('fs'), path = require('path');
T.fallosConocidos([]);
const YO = 'u-yo', ANA = 'u-ana';
const abierta = (e) => { const b = e.doc.querySelector('#sheetBackdrop'); return !!b && !b.dataset.cerrando; };
const kind = (e) => (e.A.form() || {}).kind;

(async () => {
  // ---------- 1) Juntos: grupo con Ana y un gasto pagado por mí (Ana me debe) ----------
  const e = await abrir({
    cfg: { app: { nombre: 'Lucía', compararVersiones: false, categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } },
    grupos: [{ id: 'g1', nombre: 'Viaje inventado', tipo: 'grupo', edicion: 'todos', created_at: '2026-10-01T10:00:00Z' }],
    miembros: [{ grupo_id: 'g1', user_id: YO, nombre: 'Lucía', rol: 'admin', created_at: '2026-10-01T10:00:00Z' }, { grupo_id: 'g1', user_id: ANA, nombre: 'Ana', rol: 'miembro', created_at: '2026-10-01T10:01:00Z' }],
    comp: [{ id: 'k1', grupoId: 'g1', fecha: T.diasAtras(0), tipo: 'Gasto', categoria: 'Otros', descripcion: 'Hotel inventado', importe: 80, pagadoPor: YO, reparto: { [YO]: 40, [ANA]: 40 }, modo: 'igual', creadoPor: YO, createdAt: '2026-11-02T10:00:00Z' }],
    rpc: { historial_grupo: () => [{ id: 1, grupo_id: 'g1', compartido_id: 'k1', accion: 'creado', hecho_por: YO, hecho_por_nombre: 'Lucía', hecho_en: '2026-11-02T10:00:00Z', descripcion: 'Hotel inventado', tipo: 'Gasto', importe: 80, pagado_por: YO, reparto: { [YO]: 40, [ANA]: 40 }, nombres: {}, antes: null, despues: { importe: 80 }, borrado: null, puede_recuperar: false }] },
    espera: 300,
  });
  const H = e.A.H;
  await T.ir(e, 'juntos');

  paso('Grupo → Ajustes');
  H.grupoVer(['g1']); await sleep(80);
  ok(abierta(e) && kind(e) === 'grupo', 'se abre el grupo');
  await tocar(e, 'grupoAjustes', null, 'hoja', 60);
  ok(e.A.form().ajustes === true, 'estamos en los ajustes del grupo');
  ok(atras(e) === true, 'atrás lo resuelve la app'); await sleep(60);
  ok(abierta(e) && kind(e) === 'grupo' && !e.A.form().ajustes, 'desde Ajustes, atrás vuelve al grupo (no cierra la hoja)');

  paso('Grupo → Historial → un cambio');
  H.histVer(['g1']); await sleep(150);
  ok(kind(e) === 'hist', 'se abre el historial del grupo');
  const det = e.doc.querySelector('#sheetHost [data-click^="histDetalle|"]');
  if (det) {
    det.click(); await sleep(60);
    ok(kind(e) === 'histDet', 'se abre un cambio del historial');
    atras(e); await sleep(80);
    ok(abierta(e) && kind(e) === 'hist', 'desde un cambio, atrás vuelve a la lista del historial');
  } else ok(false, 'el historial muestra el cambio inventado');
  atras(e); await sleep(80);
  ok(abierta(e) && kind(e) === 'grupo', 'desde el Historial, atrás vuelve al grupo');

  paso('Grupo → ¿De dónde sale?');
  H.origenVer(['g1']); await sleep(60);
  ok(kind(e) === 'origen' && /¿De dónde sale\?/.test(hoja(e)), 'se abre «¿De dónde sale?» del grupo');
  atras(e); await sleep(80);
  ok(abierta(e) && kind(e) === 'grupo', 'desde «¿De dónde sale?», atrás vuelve al grupo');

  paso('Grupo → Saldar');
  H.saldarAbrir(['g1', ANA, YO, 40]); await sleep(60);
  ok(kind(e) === 'saldar' && /Saldar cuentas/.test(hoja(e)), 'se abre «Saldar cuentas»');
  atras(e); await sleep(80);
  ok(abierta(e) && kind(e) === 'grupo', 'desde Saldar, atrás vuelve al grupo');

  paso('Grupo → un tema');
  e.S.db.carpetas = e.S.db.carpetas || { suscribir: () => () => {} };
  e.S.carpetas = [{ id: 't1', grupoId: 'g1', nombre: 'Cena inventada', icono: 'plane', desde: T.diasAtras(2), hasta: T.diasAtras(-2), cerrada: null, createdAt: '2026-10-01T09:00:00Z' }];
  H.grupoVer(['g1']); await sleep(60);
  H.temaVer(['t1']); await sleep(60);
  ok(kind(e) === 'grupo' && e.A.form().temaVer === 't1' && !!e.doc.querySelector('#sheetHost .tema-cab'), 'se abre el tema dentro del grupo');
  atras(e); await sleep(80);
  ok(abierta(e) && kind(e) === 'grupo' && !e.A.form().temaVer, 'desde un tema, atrás vuelve al grupo');
  atras(e); await sleep(300);
  ok(!abierta(e), 'desde el grupo, atrás cierra la hoja (como antes)');

  paso('Persona → ¿De dónde sale? / Saldar');
  H.personaVer([ANA]); await sleep(60);
  ok(kind(e) === 'persona' && /Ana/.test(hoja(e)), 'se abre la hoja de Ana');
  await tocar(e, 'origenVer', null, 'hoja', 60);
  ok(kind(e) === 'origen', 'desde Ana, «¿De dónde sale?»');
  atras(e); await sleep(80);
  ok(abierta(e) && kind(e) === 'persona', 'desde «¿De dónde sale?», atrás vuelve a Ana');
  await tocar(e, 'saldarTodo', null, 'hoja', 60);
  ok(kind(e) === 'saldarTodo', 'desde Ana, «Ya me ha pagado» (saldar)');
  atras(e); await sleep(80);
  ok(abierta(e) && kind(e) === 'persona', 'desde Saldar, atrás vuelve a Ana');
  atras(e); await sleep(300);
  ok(!abierta(e), 'desde Ana, atrás cierra la hoja');
  H.saldarTodo([ANA]); await sleep(60);
  atras(e); await sleep(300);
  ok(!abierta(e), 'Saldar abierto directamente desde la lista: atrás cierra (no hay pantalla anterior)');

  paso('«Pedir por WhatsApp»: texto oscuro sobre verde');
  H.personaVer([ANA]); await sleep(60);
  const wa = e.doc.querySelector('#sheetHost a.wa-btn');
  ok(!!wa && /Pedir por WhatsApp/.test(wa.textContent), 'el botón «Pedir por WhatsApp» lleva la clase wa-btn');
  const css = fs.readFileSync(path.join(__dirname, '..', 'look.css'), 'utf8');
  const m = /html\[data-look="nuevo"\] \.wa-btn \{[^}]*color:\s*(#[0-9A-Fa-f]{6})/.exec(css);
  const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contraste = m ? (lum('#25D366') + 0.05) / (lum(m[1]) + 0.05) : 0;
  ok(!!m && m[1].toUpperCase() === '#0B2E18', 'look.css pone el texto de WhatsApp en #0B2E18');
  ok(contraste >= 4.5, 'contraste del texto sobre el verde ≥ 4,5 (' + contraste.toFixed(2) + ')');
  atras(e); await sleep(300);

  paso('Atrás de siempre: meta nueva a medio escribir pregunta');
  await T.ir(e, 'dinero');
  H.metaNueva([]); await sleep(60);
  const mn = e.doc.querySelector('#mNombre');
  if (mn) mn.value = 'Bici inventada';
  ok(atras(e) === true && !!e.doc.querySelector('#descartarHoja'), 'una meta nueva con nombre sigue preguntando «¿Descartar…?»');
  atras(e); await sleep(20);
  ok(!e.doc.querySelector('#descartarHoja') && abierta(e), 'atrás otra vez cierra la pregunta y sigues editando');
  H.descartarSi([]); await sleep(300);

  // ---------- 2) Sin Juntos: ventanitas, cuentas, cobro fijo, importar y avisos ----------
  const e2 = makeEnv({
    cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Otros' }], ingresos: ['Nómina'], cuentas: [{ id: 'c1', nombre: 'Banco inventado', saldo: 1000, fecha: '2026-09-01' }, { id: 'c2', nombre: 'Efectivo', tipo: 'efectivo', saldo: 50, fecha: '2026-09-01' }] }, meta: { onboarded: true } },
    url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } }, pre: (w) => { w.TextDecoder = TextDecoder; w.HTMLElement.prototype.scrollIntoView = function () {}; },
    version: { tu: 1, agenda: 0, crear: 0 },
  });
  await sleep(200);
  const A = e2.w.__APP__, H2 = A.H, d2 = e2.doc, atras2 = () => e2.w.__atras(), ab2 = () => { const b = d2.querySelector('#sheetBackdrop'); return !!b && !b.dataset.cerrando; };

  paso('Ventanita sobre Inicio');
  H2.goTab(['inicio']); await sleep(20);
  H2.cuentaPrincipal([1]); await sleep(20);
  ok(!!d2.querySelector('#popupBackdrop') && !ab2(), 'hay una ventanita abierta en Inicio, sin hoja');
  ok(atras2() === true, 'atrás con la ventanita NO sale de la app');
  ok(!d2.querySelector('#popupBackdrop') && A.S.tab === 'inicio', 'la ventanita se cierra y sigues en Inicio');
  ok(atras2() === false, 'en Inicio sin nada abierto, atrás sale de la app (como antes)');

  paso('Cuentas → una cuenta (y ventanita encima)');
  H2.openCuentas([]); await sleep(30);
  H2.cuentaEditar([1]); await sleep(30);
  ok(A.form().kind === 'cuentaEd', 'se abre una cuenta');
  H2.cuentaPrincipal([1]); await sleep(20);
  ok(!!d2.querySelector('#popupBackdrop'), 'ventanita «¿Hacer principal…?» encima de la hoja');
  atras2(); await sleep(20);
  ok(!d2.querySelector('#popupBackdrop') && ab2() && A.form().kind === 'cuentaEd', 'atrás cierra solo la ventanita: la cuenta sigue abierta');
  atras2(); await sleep(40);
  ok(ab2() && A.form().kind === 'cuentas', 'desde una cuenta, atrás vuelve a «Cuentas y saldos»');
  atras2(); await sleep(300);
  ok(!ab2(), 'desde «Cuentas y saldos», atrás cierra la hoja');

  paso('Cobro o pago fijo → «Cuándo»');
  H2.recNuevo(['pago']); await sleep(30);
  const rn = d2.querySelector('#recNombre'); if (rn) rn.value = 'Gimnasio inventado';
  H2.recCuando([]); await sleep(30);
  ok(A.form().kind === 'rec' && A.form().paso === 'cuando', 'se abre «¿Cuándo se paga?»');
  atras2(); await sleep(40);
  ok(ab2() && A.form().kind === 'rec' && !A.form().paso && !d2.querySelector('#descartarHoja'), 'desde «Cuándo», atrás vuelve al pago fijo (sin preguntar ni cerrar)');
  ok(atras2() === true && !!d2.querySelector('#descartarHoja'), 'en el pago fijo nuevo con nombre, atrás pregunta «¿Descartar…?» (como antes)');
  H2.descartarSi([]); await sleep(300);

  paso('Importar → Revisar');
  const leer = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', 'extractos', n));
  const buf = leer('santander_ejemplo.csv'), arr = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  H2.goTab(['movimientos']); await sleep(10); H2.impAbrir([]); await sleep(10);
  await H2.impArchivo([], { files: [{ name: 'santander_ejemplo.csv', size: arr.byteLength, arrayBuffer: async () => arr }] }); await sleep(40);
  ok(A.imp().paso === 'columnas', 'importar: paso de las columnas');
  if (!A.imp().cuenta) A.imp().cuenta = 'c1';
  H2.impRevisar([]); await sleep(30);
  ok(A.imp().paso === 'revisar' && A.imp().filas.some((r) => r.incluir), 'importar: paso «Revisar» con filas marcadas');
  ok(atras2() === true && !!d2.querySelector('#popupBackdrop') && /¿Volver al paso anterior\?/.test(d2.querySelector('#popupBackdrop').textContent), 'atrás en «Revisar» con cosas preparadas pregunta antes de perderlas');
  atras2(); await sleep(20);
  ok(!d2.querySelector('#popupBackdrop') && ab2() && A.imp().paso === 'revisar', 'atrás otra vez cierra la pregunta: sigues revisando');
  atras2(); await sleep(20);
  const si = d2.querySelector('#popupBackdrop [data-click="impVolverSi"]');
  ok(!!si, 'la pregunta tiene «Volver»'); if (si) si.click(); await sleep(30);
  ok(!d2.querySelector('#popupBackdrop') && ab2() && A.imp().paso === 'columnas', '«Volver» lleva al paso de las columnas');
  atras2(); await sleep(30);
  ok(ab2() && A.imp().paso === 'archivo', 'desde las columnas, atrás vuelve a elegir archivo');
  atras2(); await sleep(300);
  ok(!ab2(), 'desde elegir archivo, atrás cierra la hoja');

  paso('Tú → Avisos: cada interruptor con nombre');
  e2.w.__nativo = { notif: { permiso: async () => 'granted', pedir: async () => 'granted', programar: async () => {} }, avisosBanco: { estado: async () => ({ activo: true, permiso: true, avisarme: true, pendientes: 0, bancos: ['es.bancosantander.apps'], candidatos: [{ pkg: 'com.ejemplo.pagos', nombre: 'Banco de <Prueba>' }] }), configurar: async () => {}, pendientes: async () => [], quitar: async () => {}, vaciar: async () => {}, abiertoDesdeAviso: async () => false, alAbrirDesdeAviso: () => {} } };
  H2.goTab(['tu']); await sleep(20);
  await H2.avAbrir([]); await sleep(120);
  const sws = [...d2.querySelectorAll('#sheetHost .switch[role="switch"]')];
  ok(sws.length >= 6, 'la hoja de Avisos tiene interruptores (' + sws.length + ')');
  ok(sws.every((s) => (s.getAttribute('aria-label') || '').trim().length > 2), 'todos los interruptores tienen nombre (aria-label)');
  ok(sws.every((s) => { const b = s.closest('.av-opt') && s.closest('.av-opt').querySelector('b'); return b && b.textContent === s.getAttribute('aria-label'); }), 'cada nombre es el título de su fila');
  ok(sws.some((s) => s.getAttribute('aria-label') === 'Cobros y pagos fijos') && sws.some((s) => s.getAttribute('aria-label') === 'Leer los avisos del banco'), '«Cobros y pagos fijos» y «Leer los avisos del banco» por su nombre');
  ok(!d2.querySelector('#sheetHost prueba') && sws.some((s) => /Banco de <Prueba>/.test(s.getAttribute('aria-label'))), 'el nombre de un banco raro va escapado y se lee bien');

  paso('Teclado del móvil: el campo enfocado se pone a la vista');
  H2.borrarCuentaAbrir([]); await sleep(30);
  const campo = d2.querySelector('#sheetHost input:not([type=hidden])');
  let movido = 0;
  if (campo) {
    campo.scrollIntoView = () => { movido++; };
    campo.getBoundingClientRect = () => ({ top: 600, bottom: 646, height: 46, left: 0, right: 300, width: 300 });
    Object.defineProperty(e2.w, 'innerHeight', { value: 500, configurable: true });
    campo.focus(); await sleep(320);
  }
  ok(!!campo && movido === 1, 'al enfocar un campo tapado por el teclado, se desplaza hasta verlo (tras 250 ms)');
  if (campo) { campo.getBoundingClientRect = () => ({ top: 100, bottom: 146, height: 46, left: 0, right: 300, width: 300 }); campo.blur(); campo.focus(); await sleep(320); }
  ok(movido === 1, 'si el campo ya se ve, no se mueve nada');

  fin('test164');
})();

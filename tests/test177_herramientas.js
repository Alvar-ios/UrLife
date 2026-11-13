// 13/11/2026 · «Mis herramientas»: lo apagado desaparece de pestañas, Inicio, el +, Dinero, ajustes, avisos y Descubre,
// pero NUNCA se borra ningún dato; al encenderlo vuelve todo. Sin la clave, todo encendido como siempre. Tocando de verdad.
// Solo datos inventados.
const T = require('./toques_comun.js');
const { abrir, tocar, buscar, hoja, pantalla, aviso, atras, movs, app, cerrarHoja, ir, ok, paso, fin, sleep, hoy, diasAtras } = T;
T.fallosConocidos([]);
const YO = 'u-yo';
(async () => {
  const cfg0 = { app: { nombre: 'Prueba', compararVersiones: false, categoriasGasto: [{ nombre: 'Ocio', presupuesto: 80 }],
    ahorro: [{ nombre: 'Viaje', objetivo: 900 }], deudas: [{ nombre: 'Coche', objetivo: 3000 }], trayecto: { prod: 'g95' },
    inicioWidgets: [{ t: 'asivas' }, { t: 'presu' }, { t: 'meta', o: { key: '*' } }, { t: 'deuda' }] }, meta: { onboarded: true } };
  const e = await abrir({ version: { tu: 0, crear: 0 }, cfg: JSON.parse(JSON.stringify(cfg0)),
    grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', edicion: 'todos', created_at: '2026-01-01', creado_por: YO }], miembros: [{ grupo_id: 'g1', user_id: YO, nombre: 'Prueba', rol: 'admin' }, { grupo_id: 'g1', user_id: 'u-ana', nombre: 'Ana', rol: 'miembro' }],
    movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Ocio', importe: 30, fecha: hoy() }, { id: 'm2', tipo: 'Inversión', categoria: 'Fondos', importe: 100, fecha: diasAtras(3) }],
    tareas: [{ id: 't1', nombre: 'Llamar al casero', estado: 'Pendiente', fechaLimite: hoy(), prioridad: 'Media' }] });
  const A = e.A, S = e.S, doc = e.doc;
  const tabs = () => [...doc.querySelectorAll('.tabbar [data-tab]')].map((b) => b.getAttribute('data-tab')).join();
  const datos = () => JSON.stringify({ m: movs(e).length, t: Object.keys(e.store.tareas).length, a: app(e).ahorro, d: app(e).deudas, c: app(e).categoriasGasto, w: app(e).inicioWidgets, tr: app(e).trayecto });
  const antes = datos();

  paso('Sin la clave «herramientas»: todo como siempre');
  ok(!('herramientas' in app(e)) && A.HERRAMIENTAS.every((d) => A.herrOn(d.k)), 'sin clave, todas encendidas');
  ok(tabs() === 'inicio,movimientos,juntos,dinero' && !doc.querySelector('#tbAgenda').hidden, 'pestañas de siempre y la Agenda arriba');

  paso('Tú → Mis herramientas: apagar varias');
  await ir(e, 'tu'); await tocar(e, 'tuIr', 'Mis herramientas', 'app');
  ok(/Enciende solo lo que quieras usar/.test(pantalla(e)) && !!doc.querySelector('#content .herr-siempre'), 'la pantalla explica que no se borra nada; «Gastos e ingresos» siempre');
  for (const n of ['Agenda y tareas', 'Juntos', 'Metas de ahorro', 'Deudas', 'Inversiones', 'Presupuestos', 'Calculadora de trayecto', 'Informes', 'Lectura de tickets']) {
    const b = buscar(e, 'herrCambiar', n, 'app'); if (!b) { ok(n === 'Lectura de tickets', 'interruptor de «' + n + '»'); continue; }
    b.click(); await sleep(40);
  }
  ok(/Tus datos se quedan guardados/.test(aviso(e)) || /se quedan guardados/.test(pantalla(e)), 'al apagar algo con datos: «Tus datos se quedan guardados»');
  ok([...doc.querySelectorAll('#content .herr-nota')].length >= 4, 'y la nota se queda junto a cada herramienta apagada con datos');
  ok(app(e).herramientas && app(e).herramientas.agenda === false && app(e).herramientas.juntos === false, 'se guarda en config.herramientas (lo apagado, en false)');
  ok(datos() === antes, 'no se ha borrado ningún dato (movimientos, tareas, metas, deudas, presupuestos, Inicio)');

  paso('Lo apagado desaparece');
  ok(tabs() === 'inicio,movimientos,dinero,tu' && doc.querySelector('#tbAgenda').hidden, 'sin la pestaña Juntos ni el botón de la Agenda; el hueco lo ocupa «Tú» (2 + 2) (' + tabs() + ')');
  ok(!buscar(e, 'tuIr', 'Agenda', 'app') && !buscar(e, 'openGrupos', '', 'app'), 'Tú: sin la categoría Agenda ni Juntos');
  await tocar(e, 'tuIr', '', 'app'); 
  await tocar(e, 'tuIr', 'Dinero', 'app');
  ok(!/Informes|Deudas/.test(pantalla(e)) && /Categorías de gasto/.test(pantalla(e)), 'Tú → Dinero: sin Informes ni Deudas; «Categorías de gasto» (sin presupuestos)');
  e.A.H.onFab([]); await sleep(60);
  ok(!buscar(e, 'crearIr', 'Compartido', 'hoja') && !buscar(e, 'crearIr', 'Tarea', 'hoja') && !buscar(e, 'crearIr', 'Apartar', 'hoja') && !buscar(e, 'crearIr', 'Invertir', 'hoja') && !buscar(e, 'crearIr', 'Pago de deuda', 'hoja') && !buscar(e, 'trAbrir', '', 'hoja'),
    'el +: sin Compartido, Tarea, Apartar, Invertir, Pago de deuda ni Trayecto');
  ok(!!buscar(e, 'crearIr', 'Gasto', 'hoja') && !!buscar(e, 'crearIr', 'Pago fijo', 'hoja'), 'el +: Gasto, Ingreso y Pago fijo siguen');
  await cerrarHoja(e);
  await ir(e, 'inicio');
  ok(!doc.querySelector('#content .iw-presu, #content .iw-meta, #content .iw-deuda') && !/Llamar al casero/.test(pantalla(e)), 'Inicio: sin las piezas de presupuestos, metas y deudas, ni tareas en «Estos días»');
  await ir(e, 'dinero');
  ok(!doc.querySelector('#content .dm3-tabs') || ![...doc.querySelectorAll('#content .dm3-tab')].some((b) => /Metas|Deudas|Inversiones/.test(b.textContent)), 'Dinero: solo Cuentas (sin Metas, Inversiones ni Deudas)');
  S.tab = 'juntos'; A.render(); await sleep(20); ok(S.tab === 'inicio', 'ir a Juntos apagado lleva a Inicio');
  A.H.irAgenda(['tareas']); await sleep(20); ok(S.tab === 'inicio', 'ir a la Agenda apagada lleva a Inicio');
  ok(A.descLista().length === 4 && !doc.querySelector('.crear-ticket'), 'Descubre: solo las 4 herramientas encendidas (' + A.descLista().map((d) => d.k).join(', ') + ')');
  A.H.openBuscar([]); await sleep(30); const q = doc.querySelector('#qBuscar'); q.value = 'metas'; q.dispatchEvent(new e.w.Event('input', { bubbles: true })); await sleep(30);
  ok(!buscar(e, 'buscarIr', 'irDinero', 'hoja'), 'la lupa no ofrece ir a Metas apagadas'); await cerrarHoja(e);

  paso('Encender otra vez: vuelve todo, tal cual');
  await ir(e, 'tu'); await tocar(e, 'tuIr', 'Mis herramientas', 'app');
  for (const n of ['Agenda y tareas', 'Juntos', 'Metas de ahorro', 'Deudas', 'Inversiones', 'Presupuestos', 'Calculadora de trayecto', 'Informes', 'Lectura de tickets']) if (buscar(e, 'herrCambiar', n, 'app')) await tocar(e, 'herrCambiar', n, 'app');
  ok(A.HERRAMIENTAS.every((d) => A.herrOn(d.k)) && Object.keys(app(e).herramientas || {}).length === 0, 'todas encendidas otra vez ' + JSON.stringify(app(e).herramientas));
  ok(tabs() === 'inicio,movimientos,juntos,dinero' && !doc.querySelector('#tbAgenda').hidden, 'vuelven Juntos y la Agenda');
  await ir(e, 'inicio');
  ok(!!doc.querySelector('#content .iw-presu') && !!doc.querySelector('#content .iw-meta'), 'Inicio: vuelven las piezas que tenías puestas');
  ok(datos() === antes, 'los datos, intactos');
  fin('herramientas');
})();

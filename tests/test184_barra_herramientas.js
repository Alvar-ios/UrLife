// fase14 (13/11/2026) · «Si quitas Juntos la barra se buguea y el + no está en el centro»: la barra de abajo siempre 2 + 2 con el + en medio.
// Con Juntos apagado su hueco lo ocupa la Agenda (si está encendida) o «Tú». Y las pantallas que se quedan vacías no enseñan cosas apagadas:
// «Así vas» sin Juntos ni Presupuestos, «Estos días» sin tareas ni avisos de Juntos, Inicio sin «Apartado/Invertido» a cero,
// Dinero con la fórmula de lo que hay, y una línea discreta «Puedes activar más herramientas…» que se cierra para siempre. Tocando de verdad. Datos inventados.
const T = require('./toques_comun.js');
const { abrir, tocar, pantalla, app, ir, ok, paso, fin, sleep, hoy, diasAtras } = T;
T.fallosConocidos([]);
const YO = 'u-yo';
(async () => {
  const C = (id, pag, imp, rep, dias) => ({ id, grupoId: 'g1', fecha: diasAtras(dias), tipo: 'Gasto', categoria: 'Casa', descripcion: 'Compra ' + id, importe: imp, pagadoPor: pag, reparto: rep, modo: 'igual', creadoPor: pag, createdAt: diasAtras(dias) + 'T10:00:00.000Z' });
  const e = await abrir({ version: { tu: 0, crear: 0 },
    cfg: { app: { nombre: 'Prueba', compararVersiones: false, categoriasGasto: [{ nombre: 'Ocio', presupuesto: 500 }, { nombre: 'Casa' }],
      cuentas: [{ id: 'c1', nombre: 'Banco A', saldo: 1000, fecha: diasAtras(40), principal: true }] }, meta: { onboarded: true } },
    grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', edicion: 'todos', created_at: '2026-01-01', creado_por: YO }],
    miembros: [{ grupo_id: 'g1', user_id: YO, nombre: 'Prueba', rol: 'admin' }, { grupo_id: 'g1', user_id: 'u-ana', nombre: 'Ana', rol: 'miembro' }],
    comp: [C('k1', YO, 60, { [YO]: 30, 'u-ana': 30 }, 3)],
    movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Ocio', importe: 70, fecha: hoy(), cuentaId: 'c1' }, { id: 'm0', tipo: 'Gasto', categoria: 'Ocio', importe: 20, fecha: diasAtras(35), cuentaId: 'c1' },
      { id: 'm2', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: diasAtras(1), cuentaId: 'c1' }],
    tareas: [{ id: 't1', nombre: 'Llamar al casero', estado: 'Pendiente', fechaLimite: hoy(), prioridad: 'Media' }] });
  const A = e.A, S = e.S, doc = e.doc, body = doc.body;
  await sleep(150);
  const barra = () => [...doc.querySelectorAll('.tabbar > *')].map((b) => (b.classList.contains('tab-crear') ? '+' : b.getAttribute('data-tab'))).join();
  const centrado = () => { const h = [...doc.querySelectorAll('.tabbar > *')]; const i = h.findIndex((b) => b.classList.contains('tab-crear')); return i === 2 && h.length === 5; };

  paso('Todo encendido: como siempre');
  ok(barra() === 'inicio,movimientos,+,juntos,dinero' && centrado(), 'barra de siempre (' + barra() + ')');

  paso('Juntos apagado (con la Agenda encendida): la Agenda ocupa su sitio');
  await ir(e, 'tu'); await tocar(e, 'tuIr', 'Mis herramientas', 'app'); await tocar(e, 'herrCambiar', 'Juntos', 'app');
  ok(!A.herrOn('juntos'), 'Juntos apagado desde «Mis herramientas»');
  ok(barra() === 'inicio,movimientos,+,agenda,dinero' && centrado(), 'Inicio, Movimientos, +, Agenda, Dinero: el + en el centro (' + barra() + ')');
  ok(doc.querySelector('#tbAgenda').hidden, 'el botón de la Agenda de arriba se esconde (no sale dos veces)');
  await ir(e, 'agenda');
  ok(S.tab === 'inicio' && S.inicioVista === 'tareas' && /Llamar al casero/.test(pantalla(e)), 'la pestaña Agenda abre la Agenda');
  ok(doc.querySelector('.tabbar [data-tab="agenda"]').classList.contains('active') && !doc.querySelector('.tabbar [data-tab="inicio"]').classList.contains('active'), 'y se marca la pestaña Agenda (no Inicio)');
  ok(body.classList.contains('ag-en-barra') && body.classList.contains('en-agenda'), 'sin flecha de volver arriba (clases ag-en-barra + en-agenda)');
  ok(/1 cosa hoy/.test(doc.querySelector('.tabbar [data-tab="agenda"]').getAttribute('aria-label') || ''), 'la pestaña dice cuántas cosas hay hoy: «' + doc.querySelector('.tabbar [data-tab="agenda"]').getAttribute('aria-label') + '»');
  await ir(e, 'inicio');
  ok(!(A.insightsCatalogo(A.mesActual().y, A.mesActual().m, true).juntos), '«Así vas» sin el círculo de Juntos');
  ok(!/Te deben|en Juntos/.test(doc.querySelector('#content').textContent), 'Inicio no habla de Juntos');

  paso('Juntos y Agenda apagados: «Tú» ocupa el hueco, a la derecha');
  await ir(e, 'tu'); await tocar(e, 'tuIr', 'Mis herramientas', 'app'); await tocar(e, 'herrCambiar', 'Agenda y tareas', 'app');
  ok(barra() === 'inicio,movimientos,+,dinero,tu' && centrado(), 'Inicio, Movimientos, +, Dinero, Tú (' + barra() + ')');
  await ir(e, 'inicio'); await ir(e, 'tu');
  ok(S.tab === 'tu' && doc.querySelector('.tabbar [data-tab="tu"]').classList.contains('active'), 'la pestaña Tú lleva a Tú y se marca');
  ok(body.classList.contains('tu-en-barra') && body.classList.contains('tu-raiz'), 'sin flecha de volver en Tú (es una pestaña)');

  paso('Casi todo apagado: Inicio y Dinero sin huecos raros');
  await tocar(e, 'tuIr', 'Mis herramientas', 'app');
  for (const n of ['Metas de ahorro', 'Inversiones', 'Deudas', 'Presupuestos', 'Informes', 'Calculadora de trayecto']) await tocar(e, 'herrCambiar', n, 'app');
  ok(barra() === 'inicio,movimientos,+,dinero,tu' && centrado(), 'la barra sigue 2 + 2 (' + barra() + ')');
  await ir(e, 'inicio');
  const ini = doc.querySelector('#content');
  ok(!A.insightsCatalogo(A.mesActual().y, A.mesActual().m, true).presu, '«Así vas» sin el círculo de Presupuestos');
  ok(![...ini.querySelectorAll('.hk-cel span')].some((s) => /Apartado|Invertido/.test(s.textContent)), 'la tarjeta del mes sin «Apartado» ni «Invertido» a cero');
  ok(!ini.querySelector('.dias-tit .link'), '«Estos días» sin el enlace «Agenda ›»');
  ok(!/Llamar al casero/.test(ini.textContent), 'ni tareas en «Estos días»');
  ok(!!ini.querySelector('.herr-pista') && /Tú → Mis herramientas/.test(ini.querySelector('.herr-pista').textContent), 'Inicio: «Puedes activar más herramientas en Tú → Mis herramientas»');
  await ir(e, 'dinero');
  ok(/lo que hay en tus cuentas/.test(doc.querySelector('#content .dm3-lqt-f').textContent), 'Dinero: «Lo que tienes» = lo que hay en tus cuentas (sin «invertido − lo que debes»)');
  ok(!doc.querySelector('#content .dm3-tabs') && doc.querySelectorAll('#content .herr-pista').length === 1, 'Dinero: sin fichas vacías y con la línea (una sola)');
  await tocar(e, 'herrPistaFuera', '', 'app');
  ok(app(e).herrPista === 'fuera' && !doc.querySelector('.herr-pista'), 'la X la cierra y se guarda');
  await ir(e, 'inicio');
  ok(!doc.querySelector('.herr-pista'), 'y ya no sale en ningún sitio');

  paso('Encender todo otra vez');
  await ir(e, 'tu'); await tocar(e, 'tuIr', 'Mis herramientas', 'app');
  for (const n of ['Juntos', 'Agenda y tareas', 'Metas de ahorro', 'Inversiones', 'Deudas', 'Presupuestos', 'Informes', 'Calculadora de trayecto']) await tocar(e, 'herrCambiar', n, 'app');
  ok(barra() === 'inicio,movimientos,+,juntos,dinero' && !doc.querySelector('#tbAgenda').hidden, 'vuelve la barra de siempre y la Agenda arriba (' + barra() + ')');
  ok(!body.classList.contains('ag-en-barra') && !body.classList.contains('tu-en-barra'), 'sin las clases de la barra cambiada');
  fin('barra_herramientas');
})();

// 11/11/2026 · Avisos (docs/39): lo leído de los avisos del banco se apunta solo al abrir la app, sin duplicar lo que ya tenías,
// sale en Inicio para borrarlo, y se programan recordatorios de la Agenda. El lado Android se simula (window.__nativo).
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoyISO = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
(async () => {
  const ahora = Date.now(), manana = (() => { const d = new Date(); d.setDate(d.getDate() + 1); const p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); })();
  const llamadas = { quitar: [], configurar: [], ajustes: 0, programar: [], vaciar: 0 };
  let cola = [
    { id: 'av-1', pkg: 'es.bancosantander.apps', app: 'Santander', importe: 12.5, entra: false, comercio: 'Mercadona', tipo: 'tarjeta', ts: ahora },
    { id: 'av-2', pkg: 'de.number26.android', app: 'N26', importe: 40, entra: false, comercio: 'Gasolinera', tipo: 'tarjeta', ts: ahora }, // ya lo tenías apuntado
    { id: 'av-3', pkg: 'de.number26.android', app: 'N26', importe: 15, entra: true, comercio: '', tipo: 'bizum', ts: ahora },
  ];
  let est = { permiso: false, activo: false, avisarme: true, bancos: [], candidatos: [], pendientes: 3 };
  const pre = (w) => {
    w.__nativo = { android: true,
      avisosBanco: {
        estado: async () => est, abrirAjustes: async () => { llamadas.ajustes++; },
        configurar: async (o) => { llamadas.configurar.push(o); Object.assign(est, o); },
        pendientes: async () => cola.slice(), quitar: async (ids) => { llamadas.quitar.push(...ids); cola = cola.filter((x) => ids.indexOf(x.id) < 0); },
        vaciar: async () => { llamadas.vaciar++; cola = []; }, abiertoDesdeAviso: async () => false, alAbrirDesdeAviso: () => {},
      },
      notif: { permiso: async () => 'granted', pedir: async () => 'granted', programar: async (l) => { llamadas.programar.push(l); return l.length; } },
    };
  };
  const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 }, pre,
    cfg: { app: { compararVersiones: false, categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Otros' }], ingresos: ['Nómina', 'Otros ingresos'], cuentas: [{ id: 'c1', nombre: 'Cuenta Santander', banco: 'santander' }] }, meta: { onboarded: true } },
    movs: [{ id: 'm0', tipo: 'Gasto', categoria: 'Otros', importe: 40, fecha: hoyISO(), descripcion: 'Gasolinera Repsol' }] });
  e.store.tareas.t1 = { nombre: 'Llamar al seguro', estado: 'Pendiente', fechaLimite: manana, prioridad: 'Media' };
  await e.w.__APP__.main(); await sleep(2200);
  const M = e.store.movimientos;
  ok(!!M['av-1'] && M['av-1'].origen === 'aviso' && M['av-1'].tipo === 'Gasto' && M['av-1'].importe === 12.5 && M['av-1'].descripcion === 'Mercadona' && M['av-1'].cuentaId === 'c1', 'el pago de Santander se apunta solo, con origen «aviso» y en la cuenta de Santander');
  ok(!M['av-2'], 'el de 40 € no se duplica: ya estaba apuntado ese día');
  ok(!!M['av-3'] && M['av-3'].tipo === 'Ingreso' && M['av-3'].importe === 15 && M['av-3'].descripcion === 'Bizum recibido', 'el Bizum recibido entra como ingreso, sin el nombre de la otra persona');
  ok(['av-1', 'av-2', 'av-3'].every((i) => llamadas.quitar.includes(i)), 'la cola del móvil se vacía de lo ya tratado');
  ok(/Apuntados 2 movimientos de tus avisos/.test(e.doc.body.textContent), 'avisa de cuántos ha apuntado');
  const card = () => e.doc.querySelector('.av-card');
  ok(!!card() && /Mercadona/.test(card().textContent) && /Bizum recibido/.test(card().textContent), 'Inicio enseña «Apuntados de tus avisos» con los dos');
  click(e, 'avBorrar', 'av-1'); await sleep(200);
  ok(!M['av-1'], 'se borra con un toque desde Inicio (el simulador no refresca la lista; en la app sí)');
  click(e, 'avVale'); await sleep(120);
  ok(!card() && Number(e.store.cfg.app.avisosVisto) > 0, '«Están bien» quita la tarjeta');
  const prog = llamadas.programar[llamadas.programar.length - 1] || [];
  ok(prog.some((x) => x.titulo === 'Hoy en tu Agenda' && /Llamar al seguro/.test(x.texto)), 'se programa el recordatorio de la tarea de mañana');
  // Tú → Avisos: explicación antes del permiso, y «Aceptar» abre los ajustes de Android
  e.w.__APP__.H.goTab(['tu']); await sleep(60);
  ok(!!e.doc.querySelector('[data-click="avAbrir"]'), 'en Tú está la fila «Avisos»');
  click(e, 'avAbrir'); await sleep(80);
  const sh = () => (e.doc.querySelector('#sheetHost') || {}).textContent || '';
  ok(/no lee mensajes, WhatsApp ni redes sociales/.test(sh()) && /Nunca/.test(sh()), 'antes de pedir el permiso se explica qué hace');
  click(e, 'avActivar'); await sleep(120);
  const c = llamadas.configurar.find((o) => 'activo' in o) || {};
  ok(c.activo === true && (c.bancos || []).includes('es.bancosantander.apps') && (c.bancos || []).includes('de.traderepublic.app') && llamadas.ajustes === 1, '«Aceptar y activar» marca los bancos de serie y abre los ajustes de Android');
  est.permiso = true; e.w.__avisosVolver(); await sleep(120);
  ok(/Qué apps se leen/.test(sh()) && /Trade Republic/.test(sh()), 'con el permiso dado, se ven las apps que se leen');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

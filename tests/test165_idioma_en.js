// 12/11/2026 · C1 (docs/40): la app en inglés. Recorre las pantallas principales con el idioma 'en' y comprueba que no queda
// texto en español a la vista (salvo los datos inventados del usuario) y que el dinero sale «€1,234.56».
// Y que con español no cambia nada. Solo datos inventados. Con VER=1 enseña lo que quedó en español.
const T = require('./toques_comun.js');
const { abrir, tocar, hoja, pantalla, ok, paso, fin, sleep } = T;
const YO = 'u-yo', ANA = 'u-ana';
// Datos del usuario (inventados): no se traducen y el detector no los mira
const DATOS_USUARIO = ['Lucía', 'Ana', 'Piso inventado', 'Hotel inventado', 'Cuenta Corriente Inventada', 'Hucha inventada', 'Comida con Ana', 'Recoger paquete', 'Nómina inventada', 'Préstamo inventado', 'prueba@example.invalid', 'Mercadona'];
const PALABRAS = /(?<![A-Za-zÀ-ÿ])(de|el|la|los|las|tu|tus|que|en|con|para|por|sin|hoy|mes|año|gasto|gastos|cuenta|cuentas|aquí|más|una|un|del|al|se|y|es|lo|ya|te|mi|su|hay|ver|toca|quitar|poner|cambiar|apuntar|guardar|cerrar|elige|grupo|meta|metas|tareas|ingresos|todo|nada|otra|otro|cada|semana|días|día|cobros|pagos|fijos|saldo|dinero|inicio|movimientos|juntos|ajustes|añadir)(?![A-Za-zÀ-ÿ])/i;
const ACENTOS = /[ñáéíóúÁÉÍÓÚÑ¿¡]/;
function textos(e, raiz) {
  const out = [], w = e.doc.createTreeWalker(raiz, 4, null); let n;
  while ((n = w.nextNode())) {
    let p = n.parentNode, oculto = false;
    for (; p && p.nodeType === 1; p = p.parentNode) { if (/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName) || p.hidden || (p.style && p.style.display === 'none') || p.getAttribute('translate') === 'no') { oculto = true; break; } }
    if (oculto) continue;
    const t = n.data.replace(/\s+/g, ' ').trim(); if (t) out.push(t);
  }
  [...raiz.querySelectorAll('[placeholder],[aria-label],[title]')].forEach((el) => ['placeholder', 'aria-label', 'title'].forEach((a) => { const v = el.getAttribute(a); if (v && !el.closest('[translate="no"]')) out.push(v.trim()); }));
  return out;
}
function espanol(e, raiz) {
  return [...new Set(textos(e, raiz || e.doc.body))].filter((t) => {
    let x = t; DATOS_USUARIO.slice().sort((a, b) => b.length - a.length).forEach((d) => { x = x.split(d).join(' '); });
    return ACENTOS.test(x) || PALABRAS.test(x);
  });
}
const quedan = [];
function revisa(e, nombre, raiz) {
  const r = espanol(e, raiz); quedan.push(...r.map((x) => nombre + ': ' + x));
  if (process.env.VER && r.length) console.log('  [' + nombre + '] ' + r.join(' | '));
  ok(r.length <= (revisa.tolera || 0), nombre + ': sin texto en español (' + r.length + (r.length ? ': ' + r.slice(0, 4).join(' | ') : '') + ')');
}
const fixture = (idioma) => ({ idioma,
  cfg: { app: { nombre: 'Lucía', compararVersiones: false, categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 300 }, { nombre: 'Restaurantes y bares' }, { nombre: 'Transporte' }, { nombre: 'Otros' }], ingresos: ['Nómina'],
    cuentas: [{ id: 'c1', nombre: 'Cuenta Corriente Inventada', saldoInicial: 2000, saldoFecha: T.diasAtras(40), principal: true }],
    metas: [{ id: 'mt1', nombre: 'Hucha inventada', objetivo: 3000, fecha: '2027-06-30' }], deudas: [{ nombre: 'Préstamo inventado', total: 5000, previo: 1000, cuotaMes: 200 }] }, meta: { onboarded: true } },
  grupos: [{ id: 'g1', nombre: 'Piso inventado', tipo: 'grupo', edicion: 'todos', created_at: '2026-10-01T10:00:00Z' }],
  miembros: [{ grupo_id: 'g1', user_id: YO, nombre: 'Lucía', rol: 'admin', created_at: '2026-10-01T10:00:00Z' }, { grupo_id: 'g1', user_id: ANA, nombre: 'Ana', rol: 'miembro', created_at: '2026-10-01T10:01:00Z' }],
  comp: [{ id: 'k1', grupoId: 'g1', fecha: T.diasAtras(1), tipo: 'Gasto', categoria: 'Otros', descripcion: 'Hotel inventado', importe: 80, pagadoPor: YO, reparto: { [YO]: 40, [ANA]: 40 }, modo: 'igual', creadoPor: YO, createdAt: '2026-11-02T10:00:00Z' }],
  movs: [{ id: 'm1', tipo: 'Ingreso', categoria: 'Nómina', descripcion: 'Nómina inventada', importe: 1850, fecha: T.diasAtras(3), cuentaId: 'c1' },
    { id: 'm2', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Mercadona', importe: 1234.56, fecha: T.diasAtras(2), cuentaId: 'c1' },
    { id: 'm3', tipo: 'Gasto', categoria: 'Restaurantes y bares', descripcion: 'Comida con Ana', importe: 23.4, fecha: T.diasAtras(1) },
    { id: 'm4', tipo: 'Ahorro', categoria: 'Hucha inventada', descripcion: '', importe: 100, fecha: T.diasAtras(2), meta: 'Hucha inventada' },
    { id: 'mk1', tipo: 'Gasto', categoria: 'Otros', descripcion: 'Hotel inventado', importe: 80, fecha: T.diasAtras(1), compartidoId: 'k1' }],
  agenda: [], });
(async () => {
  const e = await abrir(Object.assign(fixture('en'), { espera: 400 }));
  const A = e.A, S = e.S, H = A.H;
  e.w.__nativo = { notif: { permiso: async () => 'granted', pedir: async () => 'granted', programar: async () => {} }, avisosBanco: { estado: async () => ({ activo: false, permiso: false }), configurar: async () => {}, pendientes: async () => [], quitar: async () => {}, vaciar: async () => {}, abiertoDesdeAviso: async () => false, alAbrirDesdeAviso: () => {} } };
  paso('Idioma y formato');
  ok(e.w.I18N.lang === 'en' && e.doc.documentElement.getAttribute('lang') === 'en', 'la app está en inglés (<html lang="en">)');
  revisa.tolera = 0;
  const content = () => e.doc.querySelector('#content'), sheet = () => e.doc.querySelector('#sheetHost') || e.doc.body;
  const ir = async (tab) => { S.tab = tab; A.render(); await sleep(60); };
  paso('Inicio'); await ir('inicio');
  ok(/€1,234\.56|€1,850\.00|€1,850/.test(pantalla(e) + e.doc.body.textContent), 'el dinero sale en formato inglés («€1,234.56»)');
  ok(!/\d,\d\d €/.test(e.doc.body.textContent), 'no queda ningún importe en formato español («12,00 €»)');
  revisa(e, 'Inicio', e.doc.body);
  paso('Movimientos'); await ir('movimientos'); revisa(e, 'Movimientos · Resumen', content());
  ok(/€1,234\.56/.test(content().textContent), 'Movimientos enseña «€1,234.56»');
  H.setMovVista(['lista']); await sleep(60); revisa(e, 'Movimientos · Lista', content());
  H.setMovVista(['calendario']); await sleep(60); revisa(e, 'Movimientos · Calendario', content());
  H.setMovVista(['resumen']); await sleep(30);
  paso('Juntos'); await ir('juntos'); revisa(e, 'Juntos', content());
  H.personaVer([ANA]); await sleep(80); revisa(e, 'Juntos · hoja de Ana', sheet());
  { const wa = e.doc.querySelector('#sheetHost a.wa-btn'), txt = wa ? decodeURIComponent((wa.getAttribute('href') || '').split('text=')[1] || '') : ''; ok(/^Hi, Ana! PalomApp shows me/.test(txt) && /€40\.00/.test(txt), '«Ask on WhatsApp» prepara el mensaje en inglés (' + txt.slice(0, 60) + ')'); } H.closeSheet(); await sleep(300);
  H.grupoVer(['g1']); await sleep(80); revisa(e, 'Juntos · grupo', content());
  paso('Dinero'); await ir('dinero'); revisa(e, 'Dinero', content());
  paso('Agenda'); await ir('agenda'); revisa(e, 'Agenda', content());
  paso('Tú'); await ir('tu'); revisa(e, 'Tú', content());
  ok(!!e.doc.querySelector('[data-click="setIdioma|en"].active'), 'en Tú está la fila «Idioma / Language» con English marcado');
  paso('Hoja del +'); A.openCrear(); await sleep(80); revisa(e, 'Hoja del +', sheet());
  H.crearIr(['gasto']); await sleep(120); revisa(e, 'Formulario de gasto', sheet()); H.closeSheet(); await sleep(300);
  paso('Avisos'); await ir('tu'); H.avAbrir([]); await sleep(150); revisa(e, 'Avisos', sheet()); H.closeSheet(); await sleep(300);
  paso('Importar'); H.impAbrir([]); await sleep(150); revisa(e, 'Importar', sheet()); H.closeSheet(); await sleep(300);
  paso('Avisos y diálogos');
  A.toast('Movimiento añadido'); await sleep(20);
  ok(/Transaction added/.test(e.doc.querySelector('#toast').textContent), 'los avisos («toast») salen en inglés');
  let visto = ''; e.w.I18N && (e.w.confirm = ((f) => (m) => { visto = m; return false; })(e.w.confirm));
  ok(e.w.I18N.tr('¿Cerrar sesión en este móvil?') === 'Log out on this phone?', 'I18N.tr traduce frases enteras');
  ok(e.w.I18N.tr('Mercadona') === 'Mercadona' && e.w.I18N.tr('Comida con Ana') === 'Comida con Ana', 'lo escrito por el usuario no se toca');
  ok(e.w.I18N.tr('Supermercado') === 'Groceries', 'las categorías de serie sí se traducen');
  ok(e.w.I18N.tr('12 de noviembre de 2026') === '12 November 2026' && e.w.I18N.tr('Te quedó en octubre') === 'You had left in October', 'fechas y meses en inglés');
  paso('Volver al español sin recargar');
  await ir('tu'); H.setIdioma(['es']); await sleep(120);
  ok(e.w.I18N.lang === 'es' && e.doc.documentElement.getAttribute('lang') === 'es', 'al elegir Español, la app vuelve al español');
  ok(e.S.config.idioma === 'es', 'el idioma se guarda en la configuración de la cuenta (cfg().idioma)');
  ok(/Cuentas y saldos/.test(content().textContent) && !/Accounts and balances/.test(e.doc.body.textContent), 'Tú vuelve a estar en español');
  ok(/Inicio/.test(e.doc.body.textContent), 'las pestañas vuelven al español');
  // ---------- Con español (lo de siempre) ----------
  paso('En español no cambia nada');
  const s = await abrir(fixture(undefined));
  s.S.tab = 'movimientos'; s.A.render(); await sleep(60);
  ok(s.w.I18N.lang === 'es' && /1\.234,56 €/.test(s.doc.querySelector('#content').textContent), 'en español el dinero sigue «1.234,56 €»');
  ok(!s.w.I18N.en, 'en español no se carga el diccionario de inglés');
  if (process.env.VER) console.log('\nQUEDAN ' + quedan.length);
  fin();
})();

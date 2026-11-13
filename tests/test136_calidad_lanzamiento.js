// Calidad (10/11/2026), rama fase10/lanzamiento: lo que no cubría test135.
// A. 10 lecturas de tickets para las cuentas nuevas (60 para las de siempre).
// B. Los usuarios de siempre (sin la clave «nivel») no cambian de modo, ni a los 30 días.
// C. Los guardados de «Lo básico» no pisan nada de la configuración.
// D. panel.html: sin claves, escapa el HTML, qué ve quien no es administrador; y no va dentro de la app de Android.
// Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + (n || 0)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const HOY = iso(0), RAIZ = path.join(__dirname, '..');
const V = { tu: 1, agenda: 0, crear: 0, bienvenida: 1 };
const mesUTC = () => new Date().toISOString().slice(0, 7);

function env(app, user, movs) {
  const e = makeEnv({ cfg: { app: Object.assign({ compararVersiones: false }, app || {}), meta: { onboarded: true } }, movs: movs || [], version: V,
    session: { user: Object.assign({ email: 'prueba@ejemplo.com', id: 'uQ' }, user || {}) } });
  const orig = e.w.Data, patches = [];
  e.w.Data = Object.assign({}, orig, { doc: (p) => { const d = orig.doc(p); return Object.assign({}, d, { update: async (x) => { patches.push([p, JSON.parse(JSON.stringify(x))]); return d.update(x); } }); } });
  e.patches = patches; e.A = () => e.w.__APP__;
  return e;
}
async function arranca(e) { await e.A().main(); await sleep(140); }

(async () => {
  /* ---------- A. Lecturas de tickets ---------- */
  let e = env({}, { created_at: '2026-11-12T09:30:00.000Z' }); await arranca(e);
  ok(e.A().ticketsUso().limite === 10, 'A · cuenta creada el 12/11: 10 lecturas al mes (' + e.A().ticketsUso().limite + ')');
  e = env({}, { created_at: '2026-11-11T00:00:00.000Z' }); await arranca(e);
  ok(e.A().ticketsUso().limite === 10, 'A · el mismo día del corte (11/11 00:00 UTC) ya es cuenta nueva, como en el servidor');
  e = env({}, { created_at: '2026-11-10T23:59:59.000Z' }); await arranca(e);
  ok(e.A().ticketsUso().limite === 60, 'A · cuenta creada el 10/11: siguen las 60');
  e = env({}, {}); await arranca(e);
  ok(e.A().ticketsUso().limite === 60, 'A · si la sesión no trae fecha de alta, 60 (como antes)');
  e = env({ ticketsUso: { mes: mesUTC(), usados: 3, limite: 60 } }, { created_at: '2026-11-20T10:00:00Z' }); await arranca(e);
  ok(e.A().ticketsUso().limite === 60 && e.A().ticketsUso().quedan === 57, 'A · manda lo último que dijo el servidor (no se inventa otro límite)');
  e = env({ ticketsUso: { mes: mesUTC(), usados: 5, limite: 10 } }, { created_at: '2026-11-20T10:00:00Z' }); await arranca(e);
  ok(!e.A().ticketsPocos(), 'A · cuenta de 10 con 5 lecturas: sin aviso naranja');
  e = env({ ticketsUso: { mes: mesUTC(), usados: 8, limite: 10 } }, { created_at: '2026-11-20T10:00:00Z' }); await arranca(e);
  ok(e.A().ticketsPocos(), 'A · cuenta de 10 con 2 que quedan: aviso');
  e = env({ ticketsUso: { mes: mesUTC(), usados: 50, limite: 60 } }); await arranca(e);
  ok(e.A().ticketsPocos(), 'A · cuenta de 60 con 10 que quedan: aviso, como antes');
  e = env({ ticketsUso: { mes: mesUTC(), usados: 49, limite: 60 } }); await arranca(e);
  ok(!e.A().ticketsPocos(), 'A · cuenta de 60 con 11 que quedan: sin aviso, como antes');
  e = env({}, { created_at: '2026-11-20T10:00:00Z' }); await arranca(e);
  await e.A().guardarTicketsUso({ usados: 1, limite: 10 }); await sleep(30);
  const tk = e.store.cfg.app.ticketsUso;
  ok(tk && tk.limite === 10 && tk.usados === 1 && tk.mes === mesUTC(), 'A · tras una lectura guarda «1 de 10»');
  ok(e.store.cfg.app.compararVersiones === false, 'A · y no toca el resto de la configuración');

  /* ---------- B. Usuarios de siempre ---------- */
  const deSiempre = { altaApp: iso(-120), cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 1200, fecha: iso(-3) }], metas: [{ id: 'mt1', nombre: 'Viaje', objetivo: 900, actual: 100 }], inicioWidgets: ['metas'] };
  e = env(deSiempre, { created_at: '2026-03-01T10:00:00Z' }, [{ id: 'i1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: HOY }, { id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 40, fecha: HOY }]);
  await arranca(e); e.A().revisarNivel30(); await sleep(60);
  const tocaNivel = e.patches.some(([, x]) => 'nivel' in x || 'nivelCambio' in x || 'aviso30' in x || 'sugHoy' in x || 'primerosPasos' in x || 'descubierto' in x);
  ok(e.A().nivel() === 'todo' && !('nivel' in e.store.cfg.app), 'B · de siempre (120 días, sin «nivel»): sigue en «Todo» y no se le guarda la clave');
  ok(!tocaNivel, 'B · al cargar no se guarda nada de «Lo básico» (nivel, sugerencias, pasos, descubierto)');
  ok(!e.doc.querySelector('#content .pp, #content .sug-card, #content .pp-linea') && !!e.doc.querySelector('#content [data-click^="iwEditar"]'), 'B · Inicio sin «Primeros pasos» ni sugerencias, con «Editar Inicio»');
  ok(!(e.doc.querySelector('#pistaHost') || { innerHTML: '' }).innerHTML, 'B · sin pistas');
  ok(/Te queda este mes|En tu banco hoy/.test(e.doc.querySelector('#content .hero-k').textContent), 'B · la cifra grande de siempre (' + e.doc.querySelector('#content .hero-k').textContent + ')');
  // un usuario de siempre que eligió «Lo básico» a mano: a los 30 días no se le cambia
  e = env(Object.assign({}, deSiempre, { nivel: 'basico', nivelCambio: { d: iso(-45), por: 'tu' } })); await arranca(e); e.A().revisarNivel30(); await sleep(60);
  ok(e.A().nivel() === 'basico' && !e.patches.some(([, x]) => 'nivel' in x), 'B · eligió «Lo básico» a mano hace 45 días: se respeta');

  /* ---------- C. Los guardados no pisan nada ---------- */
  const base = { nivel: 'basico', nivelCambio: { d: iso(-3), por: 'alta' }, altaApp: iso(-3), cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 300, fecha: iso(-2) }],
    descubierto: { metas: iso(-2) }, sugerencias: { fijos: { n: 1, hasta: iso(-1) } }, pistasVistas: { agenda: iso(-2) }, deudas: [{ nombre: 'Coche', previo: 0, cuotaMes: 100 }], categoriasGasto: undefined };
  delete base.categoriasGasto;
  e = env(base, { created_at: '2026-11-12T10:00:00Z' }, [1, 2, 3].map((n) => ({ id: 'g' + n, tipo: 'Gasto', categoria: 'Supermercado', importe: 10 + n, fecha: iso(-n), descripcion: 'Compra', metodoPago: 'Tarjeta débito' })));
  await arranca(e);
  const antes = JSON.parse(JSON.stringify(e.store.cfg.app));
  e.A().H.descProbar(['trayecto']); await sleep(80); e.A().H.closeSheet && e.A().H.closeSheet(); await sleep(30);
  e.A().H.sugNo(['presu']); await sleep(30);
  e.A().H.pistaOk(['tu']); await sleep(30);
  e.A().H.nivelAbrir(); e.A().H.nivelElegir(['basico']); e.A().H.nivelGuardar(); await sleep(60);
  const c = e.store.cfg.app;
  ok(c.descubierto && c.descubierto.metas === antes.descubierto.metas && !!c.descubierto.trayecto, 'C · «Probar» añade trayecto a descubierto sin borrar «metas»');
  ok(c.sugerencias && c.sugerencias.fijos && c.sugerencias.fijos.n === 1 && c.sugerencias.presu && c.sugerencias.presu.n === 1, 'C · «Ahora no» en una sugerencia no borra lo que había de otra');
  ok(c.pistasVistas && c.pistasVistas.agenda === antes.pistasVistas.agenda && !!c.pistasVistas.tu, 'C · «Entendido» en una pista no borra las vistas');
  ok(JSON.stringify(c.cuentas) === JSON.stringify(antes.cuentas) && JSON.stringify(c.deudas) === JSON.stringify(antes.deudas), 'C · cuentas y deudas intactas');
  ok(c.nivel === 'basico' && c.nivelCambio && c.nivelCambio.por === 'alta', 'C · guardar «Lo básico» sin cambiarlo no reescribe nivelCambio (no reinicia los 30 días)');
  ok(Object.keys(e.store.movimientos).length === 3, 'C · ningún movimiento creado ni borrado');

  /* ---------- D. panel.html ---------- */
  const panel = fs.readFileSync(path.join(RAIZ, 'panel.html'), 'utf8');
  ok(!/eyJ[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{10,}|service_role|SERVICE_ROLE/.test(panel), 'D · panel.html sin claves (usa la pública de config.js)');
  ok(/noindex/.test(panel), 'D · panel.html no sale en buscadores');
  const copiar = fs.readFileSync(path.join(RAIZ, 'movil', 'scripts', 'copiar-web.js'), 'utf8');
  ok(!/panel/.test(copiar), 'D · copiar-web.js no mete panel.html en la app de Android');
  const script = panel.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  const XSS = '<img src=x onerror="window.__xss=1">';
  const R = { periodo: { calculado: '2026-11-10T08:00:00Z' },
    producto: { activas: { mes: 12, semana: '<5', ultimo_dia: '<5', dia_entre_mes_pct: 20 }, altas: 6, apuntan_en_24h: { pct: 50, base: 6 }, grupo_en_7_dias: { pct: 33, base: 6 },
      grupos: { creados: 2, abiertos: 3, activos_periodo: 2, activos_7_dias: 2 }, personas_por_grupo: { media: 2.5 }, retencion_por_semana_de_alta: [{ semana: XSS, altas: '<5', ret_7d_pct: 50, ret_30d_pct: null }],
      herramientas_configuradas_hoy: { [XSS]: 7 }, herramientas_usadas_en_periodo: { trayecto: '<5' } },
    marketing: { invitaciones: { creadas: 3, usadas_de_esas: 2, usadas_pct: 66 }, enlaces_sin_cuenta: { creados: 1, usados: 0 }, altas_por_invitacion: 2, altas_directas: 4, invitacion_entre_directa: 0.5, crecimiento_semanal: [{ semana: XSS, altas: 2, cuentas_al_acabar: 10, activas: 8 }] },
    datos_seguridad: { plan_gratis_aviso: XSS, base_de_datos_mb: 40, base_de_datos_pct_de_500mb: 8, usuarios_auth: { cuentas_vivas: 10, entraron_30_dias: 8 }, cuentas_borradas: { en_periodo: 0, total: 0 },
      coste_mes: { total_usd: 1.2, tickets_usd: 1, supabase_usd: 0, apuntado_a_mano_usd: 0.2, por_activa_usd: 0.1 }, tickets_por_modelo: { [XSS]: { lecturas: 9, personas: '<5' } }, filas_por_tabla: { [XSS]: { filas: 10, mb: 1 } } },
    calidad: { tickets_fallidos: 0, tickets_fallidos_pct: 0, tareas_programadas: { [XSS]: { ejecuciones: 4, fallos: 0 } } }, a_mano: { play: { nota: XSS } } };
  const panelEnv = (rpc) => {
    const dom = new JSDOM('<main id="app"></main>', { runScripts: 'outside-only', pretendToBeVisual: true }), w = dom.window;
    w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {} });
    w.SUPABASE_CONFIG = { url: 'https://ejemplo.supabase.co', anonKey: 'publica' };
    w.supabase = { createClient: () => ({ auth: { getSession: async () => ({ data: { session: { user: { id: 'u' } } } }), signInWithPassword: async () => ({}), signOut: async () => ({}) },
      rpc: async () => rpc, from: () => ({ select: () => ({ order: () => ({ limit: async () => ({ data: [] }) }) }), upsert: async () => ({}) }) }) };
    w.eval(script); return w;
  };
  let w = panelEnv({ error: { message: 'no_autorizado' } }); await sleep(40);
  ok(/Esta cuenta no tiene acceso al panel/.test(w.document.body.textContent) && !/Activas al mes/.test(w.document.body.textContent), 'D · quien no es administrador solo ve «Esta cuenta no tiene acceso al panel»');
  w = panelEnv({ error: { message: '<b>roto</b>' } }); await sleep(40);
  ok(!w.document.querySelector('#app b') && /<b>roto<\/b>/.test(w.document.body.textContent), 'D · el mensaje de error se escapa');
  w = panelEnv({ data: R }); await sleep(60);
  ok(/Activas al mes/.test(w.document.body.textContent), 'D · el administrador ve el panel');
  ok(!w.document.querySelector('#app img') && !w.__xss, 'D · nombres de herramientas, semanas, modelos, tablas, tareas y avisos se escapan (ningún <img> pintado)');
  ok(/&lt;5|<5/.test(w.document.body.textContent), 'D · «<5» se ve como texto');

  /* ---------- E. auth-signup.js ---------- */
  const signup = fs.readFileSync(path.join(RAIZ, 'auth-signup.js'), 'utf8');
  ok(/auth-subtitle">PalomApp</.test(signup) && !/Mis Finanzas y Tareas/.test(signup), 'E · crear cuenta dice «PalomApp»');

  console.log(fails ? '\n' + fails + ' FALLOS' : '\nTODO OK');
  process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

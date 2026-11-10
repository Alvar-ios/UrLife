// 10/11/2026 · Calidad: panel.html (rehecho con semáforos) con casi todo «<5», con null y con objetos vacíos.
// No debe romperse, ni pintar «NaN»/«undefined», ni encender semáforos sin datos; y todo lo que llega se escapa.
// Datos inventados.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const { sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const panel = fs.readFileSync(path.join(__dirname, '..', 'panel.html'), 'utf8');
const script = panel.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const XSS = '<img src=x onerror="window.__xss=1">';

function panelEnv(rpc, hist) {
  const dom = new JSDOM('<main id="app"></main>', { runScripts: 'outside-only', pretendToBeVisual: true }), w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {} });
  w.SUPABASE_CONFIG = { url: 'https://ejemplo.supabase.co', anonKey: 'publica' };
  w.supabase = { createClient: () => ({ auth: { getSession: async () => ({ data: { session: { user: { id: 'u' } } } }), signInWithPassword: async () => ({}), signOut: async () => ({}) },
    rpc: async () => rpc, from: () => ({ select: () => ({ order: () => ({ limit: async () => ({ data: hist || [] }) }) }), upsert: async () => ({}) }) }) };
  const errores = []; w.addEventListener('error', (e) => errores.push(e.message));
  w.eval(script); w.__errores = errores; return w;
}
const P5 = '<5';
// Como llegaría con muy poca gente: casi todas las cifras de personas son «<5» y los porcentajes sin base, «<5» o null
const POCOS = { periodo: { calculado: '2026-11-10T08:00:00Z' },
  producto: { altas: P5, activas: { mes: P5, semana: P5, ultimo_dia: P5, dia_entre_mes_pct: P5 }, apuntan_en_24h: { pct: P5, base: P5 }, grupo_en_7_dias: { pct: null, base: P5 },
    grupos: { creados: P5, abiertos: P5, activos_periodo: P5, activos_7_dias: 0 }, personas_por_grupo: { media: null },
    retencion_por_semana_de_alta: [{ semana: '2026-11-02', altas: P5, ret_7d_pct: P5, ret_30d_pct: null }], herramientas_configuradas_hoy: { metas: P5, cuentas_bancarias: P5 }, herramientas_usadas_en_periodo: { tickets: P5 } },
  marketing: { invitaciones: { creadas: P5, usadas_de_esas: P5, usadas_pct: P5 }, enlaces_sin_cuenta: { creados: 0, usados: 0 }, altas_por_invitacion: P5, altas_directas: P5, invitacion_entre_directa: P5,
    crecimiento_semanal: [{ semana: '2026-11-02', altas: P5, cuentas_al_acabar: P5, activas: P5 }] },
  datos_seguridad: { base_de_datos_mb: 31, usuarios_auth: { cuentas_vivas: P5, entraron_30_dias: P5 }, cuentas_borradas: { en_periodo: 0, total: 0 },
    coste_mes: { total_usd: 0.4, tickets_usd: 0.4, supabase_usd: 0, apuntado_a_mano_usd: 0, por_activa_usd: null }, tickets_por_modelo: { 'modelo-a': { lecturas: 12, personas: P5 } },
    filas_por_tabla: { movimientos: { filas: 900, mb: 1 }, tareas: { filas: 40, mb: 0.1 } } },
  calidad: { tickets_fallidos: P5, tickets_fallidos_pct: P5, tareas_programadas: { 'carburantes-pedir': { ejecuciones: 30, fallos: 0 } } } };
// Base de datos recién estrenada: todo vacío o null
const VACIO = { periodo: { calculado: '2026-11-10T08:00:00Z' },
  producto: { altas: 0, activas: { mes: 0, semana: 0, ultimo_dia: 0, dia_entre_mes_pct: null }, apuntan_en_24h: { pct: null, base: 0 }, grupo_en_7_dias: { pct: null, base: 0 },
    grupos: { creados: 0, abiertos: 0, activos_periodo: 0, activos_7_dias: 0 }, personas_por_grupo: { media: null }, retencion_por_semana_de_alta: [], herramientas_configuradas_hoy: {}, herramientas_usadas_en_periodo: {} },
  marketing: { invitaciones: { creadas: 0, usadas_de_esas: 0, usadas_pct: null }, enlaces_sin_cuenta: { creados: 0, usados: 0 }, altas_por_invitacion: 0, altas_directas: 0, invitacion_entre_directa: null, crecimiento_semanal: [] },
  datos_seguridad: { base_de_datos_mb: null, usuarios_auth: { cuentas_vivas: 0, entraron_30_dias: 0 }, cuentas_borradas: { en_periodo: 0, total: 0 },
    coste_mes: { total_usd: null, tickets_usd: null, supabase_usd: null, apuntado_a_mano_usd: null, por_activa_usd: null }, tickets_por_modelo: {}, filas_por_tabla: {} },
  calidad: { tickets_fallidos: 0, tickets_fallidos_pct: null, tareas_programadas: {} }, a_mano: {} };

(async () => {
  let w = panelEnv({ data: POCOS }); await sleep(60);
  let t = w.document.querySelector('#app').textContent;
  ok(/Panel de PalomApp/.test(t) && !w.__errores.length, 'casi todo «<5»: el panel se pinta sin errores (' + w.__errores.join(' | ') + ')');
  ok(!/NaN|undefined|Invalid Date/.test(t), 'casi todo «<5»: no sale «NaN», «undefined» ni «Invalid Date»');
  ok(/<5/.test(t), '«<5» se ve como texto');
  const luces = [...w.document.querySelectorAll('.dep .ind .luz')];
  const indProd = [...w.document.querySelectorAll('.dep')][0];
  ok(indProd && [...indProd.querySelectorAll('.ind .luz')].every((l) => l.classList.contains('gris')), 'Producto con todo «<5»: todos sus semáforos en gris');
  ok(luces.length >= 10, 'hay semáforos en los bloques (' + luces.length + ')');
  ok(![...w.document.querySelectorAll('.barra i')].some((i) => /NaN/.test(i.getAttribute('style') || '')), 'ninguna barra con ancho «NaN»');
  ok(![...w.document.querySelectorAll('.embudo .b')].some((b) => /NaN/.test(b.getAttribute('style') || '')), 'el embudo no pinta «NaN» con altas «<5»');

  w = panelEnv({ data: VACIO }); await sleep(60);
  t = w.document.querySelector('#app').textContent;
  ok(/Panel de PalomApp/.test(t) && !w.__errores.length, 'todo vacío / null: el panel se pinta sin errores (' + w.__errores.join(' | ') + ')');
  ok(!/NaN|undefined/.test(t), 'todo vacío / null: sin «NaN» ni «undefined»');

  // cadenas raras del servidor en sitios nuevos (semana del historial, nombre de tarea con fallos)
  const R2 = JSON.parse(JSON.stringify(POCOS));
  R2.calidad.tareas_programadas = { [XSS]: { ejecuciones: 3, fallos: 2 } };
  R2.producto.retencion_por_semana_de_alta[0].semana = XSS;
  R2.a_mano = { play: { nota: XSS, cierres_pct: XSS } };
  w = panelEnv({ data: R2 }, [{ semana: XSS, datos: { marketing: { crecimiento_semanal: [{ activas: 3 }] } } }, { semana: '2026-11-09', datos: { marketing: { crecimiento_semanal: [{ activas: 4 }] } } }]); await sleep(60);
  ok(!w.document.querySelector('#app img') && !w.__xss, 'semanas, tareas, notas e historial raros se escapan (ningún <img> pintado)');
  ok(/2 fallos/.test(w.document.querySelector('#app').textContent), 'una tarea automática con fallos se avisa');

  console.log(fails ? '\n' + fails + ' FALLOS' : '\nTODO OK');
  process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

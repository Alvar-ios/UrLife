// Calidad · barrido 08/11/2026: toca TODOS los botones de cada pestaña (y un nivel dentro de cada hoja que abren)
// con un usuario nuevo (sin datos) y con un usuario con datos inventados (tests/capturas/datos-falsos.js).
// Falla si algún botón lanza un error sin controlar (la app «se rompe» y el botón no hace nada).
// Solo datos inventados. No toca la red: todo va contra la capa de datos falsa.
const { makeEnv, sleep } = require('./harness.js');
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const FALSOS = fs.readFileSync(path.join(__dirname, 'capturas', 'datos-falsos.js'), 'utf8');
// Acciones que no se pueden probar aquí (salen de la app, recargan la página o cierran la sesión)
const FUERA = new Set(['doLogout', 'logoutSi', 'doLogin', 'doForgotPassword', 'doMfaVerify', 'doMfaCancel', 'mfaStart', 'mfaConfirm', 'mfaDisable', 'escrEnviar', 'planIcs', 'reclamarSi']);
let ctx = '';
const errores = [];
process.on('unhandledRejection', (e) => errores.push([ctx, 'promesa: ' + String((e && e.stack) || e).split('\n').slice(0, 2).join(' · ')]));
process.on('uncaughtException', (e) => errores.push([ctx, 'excepción: ' + String((e && e.stack) || e).split('\n').slice(0, 2).join(' · ')]));

function preparar(w) {
  w.confirm = () => false; w.alert = () => {}; w.open = () => null; w.print = () => {};
  w.HTMLElement.prototype.scrollIntoView = function () {};
  if (!w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:prueba';
  if (!w.URL.revokeObjectURL) w.URL.revokeObjectURL = () => {};
  w.addEventListener('error', (ev) => errores.push([ctx, 'error: ' + (ev.message || (ev.error && ev.error.message) || ev)]));
  const ce = w.console.error; w.console.error = (...a) => { const t = String((a[0] && a[0].stack) || a[0]); if (/TypeError|ReferenceError|RangeError|is not a function|Cannot read|undefined/.test(t)) errores.push([ctx, 'console.error: ' + t.split('\n')[0]]); };
  void ce;
}

// textos que no deberían verse nunca: restos de programación en pantalla
const raros = [];
function mirarTexto(doc) { const t = doc.body.textContent || ''; const r = t.match(/.{0,30}(undefined|NaN|\[object Object\]|Infinity|null ?€).{0,20}/); if (r) raros.push([ctx, r[0]]); }
async function barrer(nombre, e, tabs) {
  const A = e.w.__APP__, S = A.S, H = A.H, doc = e.doc;
  const vistos = new Set(), enHoja = new Set(); let toques = 0;
  const cerrar = async () => { try { H.closeSheet && H.closeSheet(); } catch (x) { /* */ } try { H.popupNada && H.popupNada(); } catch (x) { /* */ } const p = doc.querySelector('#popupHost, .popup-backdrop'); if (p && p.remove && p.classList.contains('popup-backdrop')) p.remove(); await sleep(5); const b = doc.querySelector('#sheetBackdrop'); if (b) b.remove(); };
  const ir = async (t) => { S.onboarding = null; S.tab = t.tab; Object.assign(S, t.extra || {}); A.render(); await sleep(15); };
  for (const t of tabs) {
    const antes = toques;
    await cerrar(); await ir(t);
    const acciones = [...new Set([...doc.querySelectorAll('#app [data-click]')].map((x) => x.getAttribute('data-click')))];
    for (const a of acciones) {
      const n = a.split('|')[0]; if (FUERA.has(n) || vistos.has(a)) continue; vistos.add(a);
      await cerrar(); await ir(t);
      const el = [...doc.querySelectorAll('#app [data-click]')].find((x) => x.getAttribute('data-click') === a); if (!el) continue;
      ctx = nombre + ' · ' + t.nombre + ' · ' + a; toques++;
      try { el.click(); } catch (x) { errores.push([ctx, 'click: ' + x.message]); }
      await sleep(25); mirarTexto(doc);
      // un nivel dentro de la hoja (o ventanita) que se haya abierto: cada acción nueva una vez
      const host = doc.querySelector('#sheetBackdrop') ? doc.querySelector('#sheetHost') || doc.querySelector('#sheetBackdrop') : null;
      if (!host) continue;
      const dentro = [...new Set([...host.querySelectorAll('[data-click]')].map((x) => x.getAttribute('data-click')))].filter((b) => { const m = b.split('|')[0]; return !FUERA.has(m) && m !== 'closeSheet' && !enHoja.has(m); }).slice(0, 25);
      for (const b of dentro) {
        enHoja.add(b.split('|')[0]);
        const el2 = [...doc.querySelectorAll('[data-click]')].find((x) => x.getAttribute('data-click') === b); if (!el2) continue;
        ctx = nombre + ' · ' + t.nombre + ' · ' + a + ' → ' + b; toques++;
        try { el2.click(); } catch (x) { errores.push([ctx, 'click: ' + x.message]); }
        await sleep(15); mirarTexto(doc);
      }
    }
    console.log('   ' + nombre + ' · ' + t.nombre + ': ' + (toques - antes) + ' toques');
  }
  return toques;
}

// Lo mismo que tiene la app de verdad (data-layer.js) pero sin nada dentro: un usuario recién registrado
function juntosVacio(w) {
  const vacio = (next) => { setTimeout(() => next([]), 0); return () => {}; };
  Object.assign(w.Data, { uid: () => 'u-nuevo',
    grupos: { listar: async () => ({ grupos: [], miembros: [], sinCuenta: [] }), invitaciones: async () => [] },
    compartidos: { suscribir: vacio, crear: async (o) => o, editar: async (id, o) => o, borrar: async () => [] },
    objetivos: { suscribir: vacio }, aportes: { suscribir: vacio }, carpetas: { suscribir: vacio }, agenda: { suscribir: vacio },
    agendaPermisos: { listar: async () => [], ocultas: async () => [], conmigo: async () => [], deOtro: async () => [] },
    divisas: { cambio: async () => null }, rpc: async () => [] });
}
const TABS = [
  { nombre: 'Inicio', tab: 'inicio', extra: { inicioVista: 'hoy' } },
  { nombre: 'Movimientos (resumen)', tab: 'movimientos', extra: { movVista: 'resumen' } },
  { nombre: 'Movimientos (lista)', tab: 'movimientos', extra: { movVista: 'lista' } },
  { nombre: 'Movimientos (calendario)', tab: 'movimientos', extra: { movVista: 'calendario' } },
  { nombre: 'Dinero (cuentas)', tab: 'dinero', extra: { dineroVer: null, dm3Tab: 'cuentas' } },
  { nombre: 'Dinero (metas)', tab: 'dinero', extra: { dineroVer: null, dm3Tab: 'metas' } },
  { nombre: 'Dinero (inversiones)', tab: 'dinero', extra: { dineroVer: null, dm3Tab: 'inversiones' } },
  { nombre: 'Dinero (deudas)', tab: 'dinero', extra: { dineroVer: null, dm3Tab: 'deudas' } },
  { nombre: 'Agenda (semana)', tab: 'inicio', extra: { inicioVista: 'tareas' } },
  { nombre: 'Agenda (calendario)', tab: 'inicio', extra: { inicioVista: 'calendario' } },
  { nombre: 'Juntos', tab: 'juntos' },
  { nombre: 'Tú', tab: 'tu', extra: { tuMas: true } },
];

(async () => {
  // 1) Usuario nuevo, sin nada (ni cuentas, ni movimientos, ni grupos)
  const e1 = makeEnv({ cfg: { app: { nombre: 'Prueba' }, meta: { onboarded: true } }, pre: (w) => { preparar(w); juntosVacio(w); } });
  await sleep(120); e1.w.__APP__.S.verAnterior = {};
  const n1 = await barrer('nuevo', e1, TABS);
  const err1 = errores.splice(0);
  ok(n1 > 80, 'usuario nuevo: se han tocado ' + n1 + ' botones');
  err1.forEach((x) => console.log('   · ' + x[0] + '  →  ' + x[1]));
  ok(!err1.length, 'usuario nuevo: ningún botón lanza un error (' + err1.length + ' errores)');

  // 2) Usuario con datos inventados: cuentas, metas, deudas, grupos, viaje, historial, tareas
  const e2 = makeEnv({ cfg: {}, pre: (w) => { preparar(w); w.eval(FALSOS); } });
  await sleep(200); e2.w.__APP__.S.verAnterior = {};
  const n2 = await barrer('con datos', e2, TABS);
  const err2 = errores.splice(0);
  ok(n2 > 150, 'con datos: se han tocado ' + n2 + ' botones');
  err2.forEach((x) => console.log('   · ' + x[0] + '  →  ' + x[1]));
  ok(!err2.length, 'con datos: ningún botón lanza un error (' + err2.length + ' errores)');
  raros.slice(0, 10).forEach((x) => console.log('   · ' + x[0] + '  →  «' + x[1] + '»'));
  ok(!raros.length, 'en ninguna pantalla sale «undefined», «NaN» ni «[object Object]» (' + raros.length + ')');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

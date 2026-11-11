// Calidad 11/11/2026 · Avisos del banco (docs/39): casos límite del lado web. Datos inventados; el lado Android se simula.
// Los cuatro fallos que encontró Calidad ya están arreglados: ahora todo son comprobaciones normales.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const iso = (d) => { const p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
const hoy = iso(new Date()), ayer = iso(new Date(Date.now() - 864e5));
const baseCfg = () => ({ app: { compararVersiones: false, categoriasGasto: [{ nombre: 'Transporte' }, { nombre: 'Otros' }], ingresos: ['Otros ingresos'] }, meta: { onboarded: true } });
function nativo(cola, reg) {
  return (w) => { w.__nativo = { android: true,
    avisosBanco: { estado: async () => ({ permiso: true, activo: true, bancos: [], candidatos: [], pendientes: cola.length }), abrirAjustes: async () => {}, configurar: async (o) => { (reg.configurar = reg.configurar || []).push(o); },
      pendientes: async () => cola.slice(), quitar: async (ids) => { reg.quitar.push(...ids); }, vaciar: async (apagar) => { reg.vaciar.push(!!apagar); },
      abiertoDesdeAviso: async () => false, alAbrirDesdeAviso: () => {} },
    notif: { permiso: async () => 'granted', pedir: async () => 'granted', programar: async (l) => { reg.programar.push(l); return l.length; } } }; };
}
(async () => {
  const ts = Date.now();
  // 1) Dos gastos iguales de verdad (dos cafés de 1,50 € el mismo día) y el metro de 1,50 € de ayer apuntado a mano
  {
    const reg = { quitar: [], vaciar: [], programar: [] };
    const cola = [
      { id: 'q-1', pkg: 'de.number26.android', app: 'N26', importe: 1.5, entra: false, comercio: 'Cafetería Uno', tipo: 'tarjeta', ts },
      { id: 'q-2', pkg: 'de.number26.android', app: 'N26', importe: 1.5, entra: false, comercio: 'Cafetería Dos', tipo: 'tarjeta', ts: ts + 1000 },
    ];
    const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 }, pre: nativo(cola, reg), cfg: baseCfg(), session: { user: { id: 'u-1', email: 't@t.com' } },
      movs: [{ id: 'mx', tipo: 'Gasto', categoria: 'Transporte', importe: 1.5, fecha: ayer, descripcion: 'Metro' }] });
    await e.w.__APP__.main(); await sleep(2200);
    const M = e.store.movimientos;
    ok(!!M['q-1'], 'un café de 1,50 € hoy se apunta aunque ayer apuntaras el metro de 1,50 € (avisoYaEsta mira ±1 día sin comercio)');
    ok(!!M['q-1'] && !!M['q-2'], 'dos cafés de 1,50 € seguidos se apuntan los dos (comprobado también sin el metro: solo entra el primero)');
    ok(reg.quitar.includes('q-1') && reg.quitar.includes('q-2'), 'lo tratado se quita de la cola (también lo descartado como «ya lo tenías»: se pierde sin avisar)');
    // 2) Nada de la cola pasa a la configuración
    const txt = JSON.stringify(e.store.cfg);
    ok(!/Cafeter|de\.number26|"pkg"|"comercio"/.test(txt), 'nada de la cola (comercio, app, paquete) se guarda en la configuración');
    // 3) Cerrar sesión: se vacía la cola, pero el lector sigue encendido para la siguiente cuenta
    e.w.Auth._f.forEach((f) => f(null)); await sleep(100);
    // (arreglado 11/11: cada cosa leída lleva la cuenta; sin sesión Android no lee, y lo de otra cuenta no se pasa)
    ok((reg.configurar || []).some((o) => o && o.uid === '') && (reg.configurar || []).some((o) => o && o.uid && o.uid !== ''), 'al entrar se dice a Android de quién es la sesión, y al cerrar sesión deja de leer (uid vacío)');
    ok(reg.programar.some((l) => Array.isArray(l) && l.length === 0), 'al cerrar sesión se quitan los recordatorios programados');
  }
  // 4) Un ingreso que no es Bizum ni transferencia (p. ej. «Has recibido 50 € de Ana García» → tipo «otro»)
  {
    const reg = { quitar: [], vaciar: [], programar: [] };
    const cola = [{ id: 'q-9', pkg: 'de.number26.android', app: 'N26', importe: 50, entra: true, comercio: 'Ana García', tipo: 'otro', ts }];
    const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 }, pre: nativo(cola, reg), cfg: baseCfg(), movs: [] });
    await e.w.__APP__.main(); await sleep(2200);
    const m = e.store.movimientos['q-9'];
    ok(!!m && m.origen === 'aviso' && m.tipo === 'Ingreso', 'una cuenta sin movimientos recoge el aviso (usuario nuevo)');
    ok(!!m && !/Ana/.test(m.descripcion || ''), 'el nombre de una persona no se guarda aunque el lector no lo marque como Bizum o transferencia (la web no tiene segunda barrera)');
  }
  // 5) En la web (sin window.__nativo) nada cambia ni falla
  {
    const errores = [];
    const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 }, pre: (w) => { w.addEventListener('error', (ev) => errores.push(String(ev.message))); }, cfg: baseCfg(),
      movs: [{ id: 'w1', tipo: 'Gasto', categoria: 'Otros', importe: 3, fecha: hoy, descripcion: 'Pan', creadoEn: Date.now() }] });
    await e.w.__APP__.main(); await sleep(1500);
    ok(!e.doc.querySelector('.av-card'), 'en la web, sin avisos, Inicio no enseña la tarjeta');
    e.w.__APP__.H.goTab(['tu']); await sleep(80);
    ok(!e.doc.querySelector('[data-click="avAbrir"]'), 'en la web no sale la fila «Avisos» en Tú');
    e.w.Auth._f.forEach((f) => f(null)); await sleep(80);
    ok(errores.length === 0, 'en la web no hay errores, tampoco al cerrar sesión' + (errores.length ? ': ' + errores.join(' | ') : ''));
  }
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

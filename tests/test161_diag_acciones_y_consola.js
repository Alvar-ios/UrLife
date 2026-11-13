// 12/11/2026 · Calidad (diagnóstico de lógica): cada botón que se pinta tiene su acción (H.*) y no hay errores en consola
// al recorrer las pestañas y abrir las hojas principales, con 3 juegos de datos inventados (vacío, una cuenta, muchos datos).
const { makeEnv, sleep } = require('./harness.js');
const errs = []; let ctx = '';
console.error = (...a) => errs.push(ctx + ' · ' + a.map((x) => String((x && x.stack) || x)).join(' ').split('\n').slice(0, 2).join(' ').slice(0, 300));
process.on('unhandledRejection', (x) => errs.push(ctx + ' · promesa ' + String((x && x.stack) || x).split('\n')[0]));
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const fijaFecha = (iso) => (w) => { const D = w.Date, t = new D(iso + 'T12:00:00').getTime(); class FD extends D { constructor(...a) { if (!a.length) super(t); else super(...a); } static now() { return t; } } w.Date = FD; };
function muchos() { // pseudoaleatorio fijo: siempre los mismos datos
  let s = 3; const r = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  const out = [], tipos = ['Gasto', 'Gasto', 'Gasto', 'Factura', 'Ingreso', 'Ahorro', 'Inversión', 'Deuda', 'Traspaso'];
  for (let i = 0; i < 250; i++) {
    const d = new Date(2025, 10, 1 + Math.floor(r() * 150)), f = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const t = tipos[Math.floor(r() * tipos.length)], imp = Math.round((r() * 200 + 0.01) * 100) / 100;
    const cat = { Gasto: 'Supermercado', Factura: 'Suministros', Ingreso: 'Nómina', Ahorro: 'Viaje', 'Inversión': 'Fondo Mundo', Deuda: 'Coche' }[t];
    out.push(Object.assign({ id: 'm' + i, fecha: f, tipo: t, importe: imp, creadoEn: 1000 + i }, t === 'Traspaso' ? { cuentaId: 'c1', cuentaDestinoId: 'c2' } : { categoria: cat, cuentaId: ['c1', 'c2', 'c3'][i % 3] }));
  }
  return out;
}
const JUEGOS = [
  ['usuario nuevo, sin datos', { movs: [], app: {} }],
  ['una cuenta y pocos movimientos', { movs: [{ id: 'a', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: '2026-03-01' }, { id: 'b', tipo: 'Gasto', categoria: 'Ocio', importe: 33.33, fecha: '2026-03-02' }], app: { cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 100, fecha: '2026-02-01' }] } }],
  ['muchos datos, 3 cuentas, metas y deudas, mes desde el 25', { movs: muchos(), app: { mesInicio: { modo: 'cobro', dia: 25 }, cuentas: [{ id: 'c1', nombre: 'Banco Uno', principal: true, saldo: 1500, fecha: '2025-10-31' }, { id: 'c2', nombre: 'Banco Dos', saldo: 4000, fecha: '2025-10-31' }, { id: 'c3', nombre: 'Efectivo', tipo: 'efectivo', saldo: 60, fecha: '2025-10-31' }], ahorro: [{ id: 'me1', nombre: 'Viaje', objetivo: 3000, cuentaId: 'c2' }], deudas: [{ nombre: 'Coche', objetivo: 9000, previo: 1000 }] } }],
];
(async () => {
  for (const [nombre, j] of JUEGOS) {
    ctx = nombre; const n0 = errs.length;
    const e = makeEnv({ movs: JSON.parse(JSON.stringify(j.movs)), pre: fijaFecha('2026-03-10'), version: { inicio: 0, dinero: 0, balance: 0, tu: 1, agenda: 0, crear: 0, juntos: 0 }, session: { user: { email: 't@t.com', id: 'yo' } }, cfg: { app: j.app, meta: { onboarded: true } } });
    await sleep(250);
    const A = e.w.__APP__, H = A.H, doc = e.doc, faltan = new Map();
    const mirar = (donde) => doc.querySelectorAll('[data-click],[data-input],[data-change]').forEach((el) => ['click', 'input', 'change'].forEach((k) => {
      const v = el.getAttribute('data-' + k); if (!v) return; const n = v.split('|')[0];
      if (typeof H[n] !== 'function' && !faltan.has(n)) faltan.set(n, donde + ' · «' + el.textContent.trim().slice(0, 30) + '»');
    }));
    const paso = async (donde, f) => { ctx = nombre + ' · ' + donde; try { f(); await sleep(30); mirar(donde); } catch (er) { errs.push(ctx + ' · revienta: ' + String(er && er.message || er)); } };
    for (const t of ['inicio', 'movimientos', 'dinero', 'juntos', 'agenda', 'tu']) await paso('pestaña ' + t, () => H.goTab([t]));
    for (const v of ['resumen', 'lista', 'calendario']) await paso('Movimientos ' + v, () => { H.goTab(['movimientos']); H.setMovVista([v]); });
    const hojas = [['+', () => H.onFab([])], ['Tu mes', () => H.tuMesAbrir([])], ['Editar Inicio', () => H.iwEditar([])], ['informe de febrero', () => H.infVer(['m:2026-02'])],
      ['Cuentas', () => H.openCuentas([])], ['Metas', () => H.openMetas([])], ['Cobros y pagos fijos', () => H.openRecurrentes([])], ['Importar', () => H.impAbrir([])]];
    (j.app.cuentas || []).forEach((c) => hojas.push(['cuenta ' + c.nombre, () => H.cuentaVer([c.id])]));
    for (const [d, f] of hojas) { await paso('hoja ' + d, f); ctx = nombre + ' · cerrar ' + d; H.closeSheet([]); await sleep(260); }
    ok(!faltan.size, nombre + ': todos los botones pintados tienen su acción' + (faltan.size ? ' · faltan: ' + [...faltan].map(([n, d]) => n + ' (' + d + ')').join(', ') : ''));
    const mios = errs.slice(n0);
    ok(!mios.length, nombre + ': sin errores en consola' + (mios.length ? ' · ' + mios.slice(0, 3).join(' || ') : ''));
    e.w.close();
  }
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

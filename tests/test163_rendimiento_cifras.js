// 12/11/2026 · Desarrollo (arreglos P1 de docs/salud/2026-11-12-diag-rendimiento.md): lo que ahora se recuerda
// (saldos de todas las cuentas en una pasada, movimientos agrupados por «tu mes», cifras de cada mes, textos del buscador)
// da EXACTAMENTE lo mismo que el cálculo de siempre, y se olvida cuando hace falta:
//  · al añadir y al borrar un movimiento, al llegar un compartido, al cambiar «tu mes» (en el móvil y desde el servidor) y al cambiar de día;
//  · Inicio, Movimientos (Lista del mes, Lista de todo, Resumen) y Dinero pintan lo mismo que tras obligar a recalcularlo todo.
// Datos inventados de tests/datos/generar.js (juego «normal»). Nada real.
const { sleep } = require('./harness.js');
const T = require('./toques_comun.js');
const { generar } = require('./datos/generar.js');
const { ok } = T;

const G = generar('normal');
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const dia = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const num = (v) => { const n = Number(v); return isFinite(n) ? n : 0; };
const movs = Object.entries(G.movs).map(([id, v]) => Object.assign({ id }, v));
// un traspaso (para que los saldos lo cuenten) y un ingreso de mañana en la cuenta 3 (cuenta cuando llegue el día)
movs.push({ id: 'tr1', tipo: 'Traspaso', importe: 45.5, cuentaId: 'c1', cuentaDestinoId: 'c2', fecha: dia(-3), creadoEn: Date.now() - 5000, descripcion: '' });
movs.push({ id: 'manana', tipo: 'Ingreso', categoria: 'Venta', importe: 77, cuentaId: 'c3', fecha: dia(1), creadoEn: Date.now() - 4000, descripcion: 'Venta inventada' });

// el cálculo de siempre (como era kpisMes antes del 12/11), sobre lo que tiene la app
function kpisRef(A, k) {
  const l = A.movsEfectivos().filter((m) => A.mesDe(m.fecha || '') === k), s = (t) => l.filter((m) => m.tipo === t).reduce((a, m) => a + num(m.importe), 0);
  const r = { ingresos: s('Ingreso'), facturas: s('Factura'), gastos: s('Gasto'), ahorro: s('Ahorro'), inversion: s('Inversión'), deuda: s('Deuda') };
  r.disponible = r.ingresos - r.facturas - r.gastos - r.ahorro - r.inversion - r.deuda; r.ids = l.map((m) => m.id).join(',');
  return r;
}
const CAMPOS = ['ingresos', 'facturas', 'gastos', 'ahorro', 'inversion', 'deuda', 'disponible'];
const mesHoy = (A) => { const a = A.mesActual(); return a.y + '-' + pad(a.m); };
const cuentas = (S) => (S.config.cuentas || []).filter((c) => c && c.nombre);
const saldos = (e) => cuentas(e.S).map((c) => e.A.saldoCuenta(c));
const texto = (e) => (e.doc.getElementById('content').textContent || '').replace(/\s+/g, ' ').trim();

async function pantallas(e) {
  const S = e.S, A = e.A, out = {}, k = mesHoy(A);
  const pon = async (nombre, f) => { f(); A.render(); await sleep(5); out[nombre] = texto(e); };
  await pon('Inicio', () => { S.tab = 'inicio'; S.inicioVista = 'hoy'; S.inicioMes = null; });
  await pon('Lista del mes', () => { S.tab = 'movimientos'; S.movVista = 'lista'; S.movPeriodo = 'm:' + k; S.movQuery = ''; });
  await pon('Lista de todo', () => { S.movPeriodo = 'todo'; });
  await pon('Buscar «cena» en todo', () => { S.movQuery = 'cena'; });
  await pon('Resumen', () => { S.movVista = 'resumen'; S.movPeriodo = 'm:' + k; S.movQuery = ''; });
  await pon('Dinero', () => { S.tab = 'dinero'; S.dineroVer = null; });
  return out;
}
// obliga a recalcularlo todo: mismas cosas, objetos nuevos (así nada recordado vale)
function olvidarTodo(S) {
  S.config = Object.assign({}, S.config); S.movimientos = S.movimientos.slice(); S.traspasos = (S.traspasos || []).slice();
  if (S.compartidos) S.compartidos = S.compartidos.slice();
}
async function comprobar(e, et) {
  const A = e.A, S = e.S;
  // 1. cifras de cada mes = cálculo de siempre (y pedirlas dos veces da lo mismo)
  const meses = [...new Set(A.movsEfectivos().map((m) => A.mesDe(m.fecha || '')).filter(Boolean))];
  let mal = [];
  meses.forEach((k) => {
    const y = +k.slice(0, 4), m = +k.slice(5), r = kpisRef(A, k);
    [A.kpisMes(y, m), A.kpisMes(y, m)].forEach((kp) => { CAMPOS.forEach((c) => { if (kp[c] !== r[c]) mal.push(k + ' ' + c + ' ' + kp[c] + ' ≠ ' + r[c]); }); if (kp.movs.map((x) => x.id).join(',') !== r.ids) mal.push(k + ' lista distinta'); });
  });
  ok(meses.length > 10 && !mal.length, et + ': kpisMes de ' + meses.length + ' meses = cálculo de siempre, al céntimo y en el mismo orden' + (mal.length ? ' · ' + mal.slice(0, 3).join(' | ') : ''));
  // 2. saldo de cada cuenta = el cálculo de una en una (una copia de la cuenta no está en lo recordado: se calcula como siempre)
  const cs = cuentas(S), m2 = cs.filter((c) => A.saldoCuenta(c) !== A.saldoCuenta(Object.assign({}, c)));
  ok(cs.length === 3 && !m2.length, et + ': los saldos de las 3 cuentas = el cálculo de siempre' + (m2.length ? ' · fallan ' + m2.map((c) => c.nombre).join(', ') : ''));
  // 3. pantallas iguales que tras obligar a recalcular
  const a = await pantallas(e), pa = JSON.stringify(A.patrimonio()), sa = saldos(e);
  olvidarTodo(S);
  const b = await pantallas(e), pb = JSON.stringify(A.patrimonio()), sb = saldos(e);
  const distintas = Object.keys(a).filter((x) => a[x] !== b[x]);
  ok(!distintas.length && pa === pb && sa.join() === sb.join(), et + ': Inicio, Lista, Resumen y Dinero pintan lo mismo que recalculando todo' + (distintas.length ? ' · cambian: ' + distintas.join(', ') : ''));
  ok(/Lo que tienes/.test(a.Dinero) && /movimiento/.test(a['Lista de todo']), et + ': las pantallas tienen contenido');
}

(async () => {
  T.paso('abrir con 2.000 movimientos inventados');
  const e = await T.abrir({ cfg: G.cfg, movs, grupos: G.grupos, miembros: G.miembros, comp: G.comp.map((c) => Object.assign({}, c)), yo: G.YO, espera: 600,
    version: { inicio: 0, dinero: 0, balance: 0, importe: 1 },
    pre: (w) => { const D = w.Date; w.__off = 0; class FD extends D { constructor(...a) { if (a.length) super(...a); else super(D.now() + w.__off); } static now() { return D.now() + w.__off; } } w.Date = FD; } });
  const A = e.A, S = e.S, H = A.H;
  ok(S.movimientos.length >= 2000 && (S.compartidos || []).length > 0, 'datos cargados (' + S.movimientos.length + ' movimientos, ' + (S.compartidos || []).length + ' compartidos)');
  await comprobar(e, 'al abrir');

  // lo que se devuelve es una copia: cambiarlo no estropea lo recordado
  { const a = A.mesActual(), k1 = A.kpisMes(a.y, a.m), g = k1.gastos; k1.gastos = -1; k1.movs.reverse(); k1.movs.length = 0;
    const k2 = A.kpisMes(a.y, a.m); ok(k2.gastos === g && k2.movs.length > 0, 'cambiar lo que devuelve kpisMes no cambia la siguiente llamada'); }

  const k0 = () => { const a = A.mesActual(); return A.kpisMes(a.y, a.m); };
  const s0 = saldos(e), g0 = k0().gastos;

  T.paso('añadir un gasto (duplicar uno de la cuenta 2 y guardar)');
  const base = S.movimientos.find((m) => m.tipo === 'Gasto' && m.cuentaId === 'c2' && m.descripcion);
  H.movDuplicar([base.id]); await sleep(40);
  e.doc.querySelector('#fImporte').value = '12,34'; await H.saveMov(); await sleep(150);
  const nuevo = S.movimientos.find((m) => !G.movs[m.id] && m.importe === 12.34);
  ok(!!nuevo && nuevo.fecha === dia(0), 'el gasto nuevo está en la app con fecha de hoy');
  const s1 = saldos(e);
  ok(Math.abs(s1[1] - (s0[1] - 12.34)) < 0.005 && s1[0] === s0[0] && s1[2] === s0[2], 'el saldo de la cuenta 2 baja 12,34 € al momento y las otras no cambian');
  ok(Math.abs(k0().gastos - (g0 + 12.34)) < 0.005, 'los gastos del mes suben 12,34 € al momento');
  await comprobar(e, 'tras añadir');

  T.paso('borrar ese gasto');
  H.movBorrar([nuevo.id]); await sleep(150);
  ok(!S.movimientos.some((m) => m.id === nuevo.id), 'el gasto ya no está');
  ok(saldos(e).join() === s0.join() && k0().gastos === g0, 'saldos y gastos del mes vuelven a lo de antes');
  await comprobar(e, 'tras borrar');

  T.paso('llega un gasto compartido que pagué yo (30 €, mi parte 15 €)');
  const g1 = G.grupos.find((g) => g.tipo !== 'directo'), otro = G.miembros.find((m) => m.grupo_id === g1.id && m.user_id !== G.YO).user_id;
  e.srv.comp.push({ id: 'k-nuevo', grupoId: g1.id, fecha: dia(0), tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Cena inventada', importe: 30, pagadoPor: G.YO, reparto: { [G.YO]: 15, [otro]: 15 }, modo: 'igual', creadoPor: G.YO, createdAt: new Date().toISOString() });
  e.srv.avisar('comp'); await sleep(80);
  ok((S.compartidos || []).some((c) => c.id === 'k-nuevo'), 'el compartido ha llegado');
  const s2 = saldos(e);
  ok(Math.abs(s2[0] - (s0[0] - 30)) < 0.005, 'el saldo de la principal baja los 30 € que pagué');
  ok(Math.abs(k0().gastos - (g0 + 15)) < 0.005, 'los gastos del mes suben mi parte (15 €)');
  await comprobar(e, 'tras el compartido');

  T.paso('cambiar «tu mes» a «desde el día 25» (en el móvil)');
  const antes = A.kpisMes(+mesHoy(A).slice(0, 4), +mesHoy(A).slice(5)).movs.length;
  H.tuMesSugSi([25]); await sleep(60);
  ok(A.mesDe(dia(0)) === mesHoy(A) && JSON.stringify(S.config.mesInicio) === JSON.stringify({ modo: 'cobro', dia: 25 }), '«tu mes» cambiado');
  const r25 = kpisRef(A, mesHoy(A));
  ok(r25.ids !== '' && A.kpisMes(+mesHoy(A).slice(0, 4), +mesHoy(A).slice(5)).movs.map((m) => m.id).join(',') === r25.ids, 'el mes actual se agrupa ya del 25 al 24 (' + antes + ' → ' + r25.ids.split(',').length + ' apuntes)');
  await comprobar(e, 'con tu mes desde el 25');

  T.paso('«tu mes» vuelve a «del 1 al último» desde el servidor (otro móvil)');
  await e.w.Data.doc('config/app').update({ mesInicio: { modo: 'natural', dia: 1 } }); await sleep(80);
  ok(!S.config.mesInicio || S.config.mesInicio.modo === 'natural', 'llega la configuración nueva');
  await comprobar(e, 'con tu mes del 1');

  T.paso('pasa el día: el ingreso de mañana ya cuenta en la cuenta 3');
  const s3 = saldos(e);
  e.w.__off = 864e5; await sleep(5);
  const s4 = saldos(e);
  ok(Math.abs(s4[2] - (s3[2] + 77)) < 0.005, 'al día siguiente el saldo de la cuenta 3 sube 77 € sin recargar nada');
  await comprobar(e, 'al día siguiente');
  e.w.__off = 0;

  T.fin('test163');
})().catch((err) => { console.log('FAIL ' + String((err && err.stack) || err)); process.exit(1); });

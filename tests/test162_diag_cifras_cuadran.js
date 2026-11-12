// 12/11/2026 · Calidad (diagnóstico de lógica, docs/salud/2026-11-12-diag-logica.md): las cifras cuadran en todas partes.
// Para cada juego de datos inventado (muchos y pocos movimientos, 3 cuentas, traspasos, metas ligadas a cuenta, inversiones, deudas,
// compartidos con «tu parte», persona sin cuenta) y cada «Tu mes» (día 1, cobro el 5, 15, 25 y 31), en febrero de 28 y 29 días y en cambio de año:
//  · cada día cae en un solo mes y los tramos no se pisan ni dejan huecos (mesDe / rangoMes);
//  · kpisMes = una cuenta hecha aparte; Inicio (cifra grande, Ingresos, Gastos) = Movimientos (Resumen o balance del mes) = Informe;
//  · saldo de cada cuenta = saldo de partida ± lo de después; Dinero «Lo que tienes» = patrimonio() = Cuentas + Inversiones − Deudas;
//  · Inicio «En tus cuentas» = suma de saldos; y ningún error en consola al recorrer las pestañas.
const { makeEnv, sleep } = require('./harness.js');
const fijaFecha = (iso) => (w) => { const D = w.Date, t = new D(iso + 'T12:00:00').getTime(); class FD extends D { constructor(...a) { if (!a.length) super(t); else super(...a); } static now() { return t; } } w.Date = FD; };
function rnd(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function dias(desde, hasta) { const out = []; const d = new Date(desde + 'T12:00:00'); while (iso(d) <= hasta) { out.push(iso(d)); d.setDate(d.getDate() + 1); } return out; }
const CUENTAS3 = (f) => [{ id: 'c1', nombre: 'Banco Uno', principal: true, saldo: 1500.37, fecha: f }, { id: 'c2', nombre: 'Banco Dos', saldo: 4000, fecha: f }, { id: 'c3', nombre: 'Efectivo', tipo: 'efectivo', saldo: 60.5, fecha: f }];
function muchos(desde, hasta, n, seed) {
  const r = rnd(seed || 7), ds = dias(desde, hasta), movs = [], cats = ['Supermercado', 'Ocio', 'Transporte', 'Restaurantes y bares'];
  const imp = () => Math.round((r() * 200 + 0.01) * 100) / 100;
  for (let i = 0; i < n; i++) {
    const f = ds[Math.floor(r() * ds.length)], x = r(), cu = ['c1', 'c2', 'c3', undefined][Math.floor(r() * 4)];
    let m;
    if (x < 0.6) m = { tipo: 'Gasto', categoria: cats[Math.floor(r() * cats.length)], importe: imp() };
    else if (x < 0.7) m = { tipo: 'Factura', categoria: 'Suministros', importe: imp() };
    else if (x < 0.8) m = { tipo: 'Ingreso', categoria: 'Nómina', importe: Math.round(r() * 200000) / 100 };
    else if (x < 0.85) m = { tipo: 'Ahorro', categoria: 'Viaje', importe: imp() };
    else if (x < 0.9) m = { tipo: 'Inversión', categoria: 'Fondo Mundo', importe: imp() };
    else if (x < 0.95) m = { tipo: 'Deuda', categoria: 'Coche', importe: imp() };
    else m = { tipo: 'Traspaso', importe: imp(), cuentaId: 'c1', cuentaDestinoId: 'c2' };
    if (m.tipo !== 'Traspaso' && cu) m.cuentaId = cu;
    movs.push(Object.assign({ id: 'm' + i, fecha: f, creadoEn: 1000 + i }, m));
  }
  return movs;
}
const D = { fijaFecha, rnd, iso, dias, CUENTAS3, muchos };
const errs = []; console.error = (...a) => errs.push(a.map((x) => String((x && x.stack) || x)).join(' ').slice(0, 400));
process.on('unhandledRejection', (e) => errs.push('promesa ' + String((e && e.stack) || e).slice(0, 300)));
const pn = (t) => { if (t == null) return NaN; const s = String(t).replace(/[^\d,.\-−+]/g, '').replace(/\./g, '').replace(',', '.').replace('−', '-').replace('+', ''); return parseFloat(s); };
const prob = [];
const cerca = (a, b, tol) => Math.abs(a - b) <= (tol == null ? 0.006 : tol);
async function caso(nombre, o) {
  const P = (m) => prob.push('[' + nombre + '] ' + m);
  const e = makeEnv({ movs: o.movs, pre: D.fijaFecha(o.hoy), version: { inicio: 0, dinero: 0, balance: 0, tu: 0, agenda: 0, crear: 0 }, session: { user: { email: 't@t.com', id: 'yo' } }, cfg: { app: o.app, meta: { onboarded: true } } });
  await sleep(250);
  const A = e.w.__APP__, S = A.S, doc = e.doc, n0 = errs.length;
  if (o.comps) { S.grupos = o.grupos; S.compartidos = o.comps; S.objetivos = []; S.aportes = []; }
  // 1. cada día cae en un solo mes y los tramos no se pisan ni dejan huecos
  let prev = null;
  for (const d of D.dias('2023-11-01', '2027-03-31')) {
    const k = A.mesDe(d), y = +k.slice(0, 4), m = +k.slice(5), r = A.rangoMes(y, m);
    if (!(r.desde <= d && d <= r.hasta)) { P('mesDe(' + d + ')=' + k + ' pero rangoMes=' + r.desde + '..' + r.hasta); break; }
    if (prev && prev.k !== k) { const nd = new Date(prev.r.hasta + 'T12:00:00'); nd.setDate(nd.getDate() + 1); if (D.iso(nd) !== r.desde) { P('hueco o solape entre ' + prev.k + ' y ' + k); break; }
      const dif = (y * 12 + m) - (+prev.k.slice(0, 4) * 12 + +prev.k.slice(5)); if (dif !== 1) { P('salto de mes ' + prev.k + ' -> ' + k); break; } }
    const len = (new Date(r.hasta) - new Date(r.desde)) / 864e5 + 1; if (len < 26 || len > 35) { P('tramo ' + k + ' de ' + len + ' días'); break; }
    prev = { k, r };
  }
  // 2. oráculo propio: mis movimientos + mi parte de lo compartido, por mes
  const vivos = new Set((o.comps || []).map((c) => c.id));
  const ef = S.movimientos.filter((m) => !(m.compartidoId && vivos.has(m.compartidoId))).map((m) => ({ f: m.fecha, t: m.tipo, v: Number(m.importe) }))
    .concat((o.comps || []).filter((c) => c.tipo !== 'Liquidación' && c.reparto.yo > 0).map((c) => ({ f: c.fecha, t: c.tipo, v: c.reparto.yo })));
  const meses = [...new Set(ef.map((x) => A.mesDe(x.f)))].sort();
  let tot = 0;
  for (const k of meses) {
    const y = +k.slice(0, 4), m = +k.slice(5), r = A.rangoMes(y, m), mios = ef.filter((x) => x.f >= r.desde && x.f <= r.hasta), s = (t) => mios.filter((x) => x.t === t).reduce((a, x) => a + x.v, 0);
    const exp = { ingresos: s('Ingreso'), gastos: s('Gasto'), facturas: s('Factura'), ahorro: s('Ahorro'), inversion: s('Inversión'), deuda: s('Deuda') }; exp.disponible = exp.ingresos - exp.gastos - exp.facturas - exp.ahorro - exp.inversion - exp.deuda;
    const kp = A.kpisMes(y, m); tot += kp.movs.length;
    Object.keys(exp).forEach((c) => { if (!cerca(exp[c], kp[c])) P('kpisMes ' + k + ' ' + c + ': espera ' + exp[c].toFixed(2) + ', da ' + kp[c].toFixed(2)); });
    // 3. pantallas
    const ma = A.mesActual(), actual = ma.y === y && ma.m === m, futuro = y * 12 + m > ma.y * 12 + ma.m; if (futuro) continue;
    const gas = exp.gastos + exp.facturas;
    S.tab = 'inicio'; S.inicioVista = 'hoy'; S.inicioMes = 'm:' + k; A.render(); await sleep(15);
    let t = doc.getElementById('content').textContent.replace(/\s+/g, ' ');
    const cap = (re, que, v, tol, donde) => { const mm = t.match(re); if (!mm) return P(donde + ' ' + k + ': no encuentro «' + que + '» · ' + t.slice(0, 160)); const x = pn(mm[1]); if (!cerca(Math.abs(x), Math.abs(v), tol)) P(donde + ' ' + k + ' «' + que + '»: pinta ' + mm[1] + ', espera ' + v.toFixed(2)); };
    const sinIng = !ef.some((x) => x.t === 'Ingreso');
    if (!o.vacio) {
      if (!sinIng) { const hv = doc.querySelector('#content .hero-v, #content .hero2-v, #content .hero2 .tnum'); if (!hv) P('Inicio ' + k + ': no hay cifra grande'); else { const x = pn(hv.textContent); if (!cerca(x, exp.disponible)) P('Inicio ' + k + ' cifra grande: pinta ' + hv.textContent + ', espera ' + exp.disponible.toFixed(2)); } }
      if (exp.ingresos > 0) cap(/Ingresos([\d.,]+) €/, 'Ingresos', exp.ingresos, 0.51, 'Inicio');
      if (gas > 0) cap(/Gastos([\d.,]+) €/, 'Gastos', gas, 0.51, 'Inicio');
    }
    S.tab = 'movimientos'; S.movVista = 'resumen'; S.movPeriodo = 'm:' + k; A.render(); await sleep(15);
    t = doc.getElementById('content').textContent.replace(/\s+/g, ' ');
    if (A.kpisMes(y, m).movs.length) {
      const balV = doc.querySelector('#content .bal-v');
      if (balV) { const x = pn(balV.textContent); if (!cerca(x, exp.disponible, 0.51)) P('Balance ' + k + ': pinta ' + balV.textContent + ', espera ' + exp.disponible.toFixed(2)); }
      else { if (exp.ingresos > 0) cap(/([\d.,]+) €Ingresos/, 'Ingresos', exp.ingresos, 0.51, 'Movimientos'); if (gas > 0) cap(/([\d.,]+) €Gastos/, 'Gastos', gas, 0.51, 'Movimientos'); }
      const gd = t.match(/([\d.]+,\d\d) €gastado/); if (gd && !cerca(pn(gd[1]), gas)) P('Anillo/«gastado» ' + k + ': pinta ' + gd[1] + ', espera ' + gas.toFixed(2));
    }
        try { A.H.infVer(['m:' + k]); await sleep(15); const st = doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
      const g2 = st.match(/Gastaste\s*([\d.,]+) €/); if (gas >= 0.5 && g2 && !cerca(pn(g2[1]), gas, 0.51)) P('Informe ' + k + ' «Gastaste»: ' + g2[1] + ' vs ' + gas.toFixed(2));
      const g3 = st.match(/Entró\s*([\d.,]+) €/); if (exp.ingresos >= 0.5 && g3 && !cerca(pn(g3[1]), exp.ingresos, 0.51)) P('Informe ' + k + ' «Entró»: ' + g3[1] + ' vs ' + exp.ingresos.toFixed(2));
      const g4 = st.match(/Balance\s*([+−-]?[\d.,]+) €/); if (g4 && !cerca(pn(g4[1]), exp.disponible, 0.51)) P('Informe ' + k + ' «Balance»: ' + g4[1] + ' vs ' + exp.disponible.toFixed(2));
      if (!g2 && !g3 && !g4 && mios.length) P('Informe ' + k + ': no encuentro cifras · ' + st.slice(0, 200));
      A.H.closeSheet([]); await sleep(5); } catch (er) { P('Informe ' + k + ' revienta: ' + String(er).slice(0, 150)); }
  }
  if (tot !== ef.length) P('la suma de los meses tiene ' + tot + ' apuntes y hay ' + ef.length);
  // 4. cuentas: saldo esperado = saldo de partida + lo que entró − lo que salió (hasta hoy, después de la fecha de partida)
  const cs = (o.app.cuentas || []), pc = cs.find((c) => c.principal) || cs[0], hoy = o.hoy; let sumaC = 0;
  cs.forEach((c) => { if (c.saldo == null) return; let s = c.saldo; const post = (x) => c.fecha && x.fecha <= hoy && x.fecha > c.fecha;
    o.movs.forEach((m) => { if (!post(m)) return; if (m.compartidoId && vivos.has(m.compartidoId)) return; const cu = m.cuentaId && cs.find((z) => z.id === m.cuentaId) ? m.cuentaId : pc.id;
      if (m.tipo === 'Traspaso') { if (m.cuentaId === c.id) s -= m.importe; if (m.cuentaDestinoId === c.id) s += m.importe; return; }
      if (m.tipo === 'Ahorro') { if (m.cuentaDestinoId && cs.find((z) => z.id === m.cuentaDestinoId)) { if (cu === c.id) s -= m.importe; if (m.cuentaDestinoId === c.id) s += m.importe; } return; }
      if (cu === c.id) s += m.tipo === 'Ingreso' ? m.importe : -m.importe; });
    (o.comps || []).forEach((x) => { if (!post(x) || c.id !== pc.id) return; if (x.tipo === 'Liquidación') { if (x.pagadoPor === 'yo') s -= x.importe; else if (x.reparto.yo != null) s += x.reparto.yo; } else if (x.pagadoPor === 'yo' && x.tipo !== 'Ahorro') s += x.tipo === 'Ingreso' ? x.importe : -x.importe; });
    const real = A.saldoCuenta(S.config.cuentas.find((z) => z.id === c.id)); sumaC += real; if (!cerca(real, s)) P('saldo de ' + c.nombre + ': espera ' + s.toFixed(2) + ', da ' + real); });
  // 5. Dinero «Lo que tienes» e Inicio «En tus cuentas»
  const pat = A.patrimonio();
  S.tab = 'dinero'; S.dineroVer = null; A.render(); await sleep(20); let t = doc.getElementById('content').textContent.replace(/\s+/g, ' ');
  const lq = t.match(/Lo que tienes\s*([−-]?[\d.]+,\d\d) €/);
  if (cs.length) { if (!lq) P('Dinero: no encuentro «Lo que tienes» · ' + t.slice(0, 120)); else {
    if (!cerca(pn(lq[1]), pat.total)) P('Dinero «Lo que tienes» pinta ' + lq[1] + ' y patrimonio() da ' + pat.total.toFixed(2));
    const cu = t.match(/Cuentas([−-]?[\d.,]+) €/), iv = t.match(/Inversiones([−-]?[\d.,]+) €/), de = t.match(/Deudas([−-]?[\d.,]+) €/);
    const suma = (cu ? pn(cu[1]) : 0) + (iv ? pn(iv[1]) : 0) + (de ? pn(de[1]) : 0);
    if (cs.some((c) => c.saldo != null) && !cerca(suma, pn(lq[1]), 1.6)) P('Dinero: las 3 cifras suman ' + suma + ' y arriba pone ' + lq[1]);
    if (cu && cs.length && !cerca(pn(cu[1]), sumaC, 0.51)) P('Dinero «Cuentas» ' + cu[1] + ' y la suma de saldos es ' + sumaC.toFixed(2));
  } }
  S.tab = 'inicio'; S.inicioMes = null; A.render(); await sleep(15); t = doc.getElementById('content').textContent.replace(/\s+/g, ' ');
  const etc = t.match(/En tus cuentas\s*([−-]?[\d.,]+) €/); if (etc && !cerca(pn(etc[1]), A.enTusCuentas(), 0.51)) P('Inicio «En tus cuentas» ' + etc[1] + ' vs ' + A.enTusCuentas());
  if (etc && cs.length && !cerca(pn(etc[1]), sumaC, 0.51)) P('Inicio «En tus cuentas» ' + etc[1] + ' y Dinero suma ' + sumaC.toFixed(2) + ' (¿cuentas que no son corriente/efectivo?)');
  // 6. pestañas y hojas: errores
  for (const tab of ['inicio', 'movimientos', 'dinero', 'juntos', 'agenda', 'tu']) { try { A.H.goTab([tab]); await sleep(25); } catch (er) { P('pestaña ' + tab + ' revienta: ' + String(er).slice(0, 200)); } }
  if (errs.length > n0) P('errores en consola: ' + errs.slice(n0, n0 + 3).join(' || '));
  e.w.close();
  console.log((errs.length > n0 ? 'FAIL' : 'PASS') + ' caso', nombre, 'ok · meses', meses.length, '· apuntes', ef.length);
}
(async () => {
  const meta = [{ id: 'me1', nombre: 'Viaje', objetivo: 3000 }], deudas = [{ nombre: 'Coche', objetivo: 9000, previo: 1000 }];
  const M = D.muchos('2025-11-01', '2026-03-31', 300, 3), M24 = D.muchos('2023-12-01', '2024-03-31', 200, 5), MA = D.muchos('2025-12-15', '2026-01-15', 80, 9);
  const pocos = [{ id: 'a', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: '2026-02-27' }, { id: 'b', tipo: 'Gasto', categoria: 'Ocio', importe: 33.33, fecha: '2026-02-28' }, { id: 'c', tipo: 'Gasto', categoria: 'Ocio', importe: 0.1, fecha: '2026-03-01' }, { id: 'd', tipo: 'Gasto', categoria: 'Ocio', importe: 0.2, fecha: '2026-03-01' }];
  const mi = [undefined, { modo: 'cobro', dia: 25 }, { modo: 'cobro', dia: 31 }, { modo: 'cobro', dia: 5 }, { modo: 'cobro', dia: 15 }];
  for (const m of mi) { const et = m ? 'cobro' + m.dia : 'dia1';
    await caso('muchos·' + et + '·hoy 10/03/26', { movs: M, hoy: '2026-03-10', app: { cuentas: D.CUENTAS3('2025-10-31'), ahorro: meta, deudas, mesInicio: m } });
    await caso('pocos·' + et + '·hoy 01/03/26', { movs: pocos, hoy: '2026-03-01', app: { cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 100, fecha: '2026-02-01' }], mesInicio: m } });
  }
  for (const m of [undefined, { modo: 'cobro', dia: 25 }, { modo: 'cobro', dia: 31 }]) { const et = m ? 'cobro' + m.dia : 'dia1';
    await caso('bisiesto·' + et + '·hoy 29/02/24', { movs: M24, hoy: '2024-02-29', app: { cuentas: D.CUENTAS3('2023-11-30'), ahorro: meta, deudas, mesInicio: m } });
    await caso('cambio de año·' + et + '·hoy 01/01/26', { movs: MA, hoy: '2026-01-01', app: { cuentas: D.CUENTAS3('2025-12-01'), ahorro: meta, deudas, mesInicio: m } });
    await caso('cambio de año·' + et + '·hoy 31/12/25', { movs: MA, hoy: '2025-12-31', app: { cuentas: D.CUENTAS3('2025-12-01'), ahorro: meta, deudas, mesInicio: m } });
    await caso('sin cuentas·' + et, { movs: M.map((x) => { const y = Object.assign({}, x); delete y.cuentaId; return y; }).filter((x) => x.tipo !== 'Traspaso'), hoy: '2026-03-31', app: { ahorro: meta, deudas, mesInicio: m } });
    await caso('vacío·' + et, { movs: [], hoy: '2026-03-31', app: { mesInicio: m }, vacio: true });
    // metas ligadas a cuenta + compartidos con «tu parte»
    const ML = M.map((x) => (x.tipo === 'Ahorro' ? Object.assign({}, x, { cuentaId: 'c1', cuentaDestinoId: 'c2', metaId: 'me1' }) : x));
    const g = (u, n, sc) => ({ user_id: u, nombre: n, rol: 'miembro', sinCuenta: !!sc });
    const grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [g('yo', 'Yo'), g('uA', 'Ana'), g('p1', 'Leo', true)], todos: [g('yo', 'Yo'), g('uA', 'Ana'), g('p1', 'Leo', true)] }];
    const comps = [{ id: 'k1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Compra', importe: 100, fecha: '2026-03-02', pagadoPor: 'yo', reparto: { yo: 33.34, uA: 33.33, p1: 33.33 }, createdAt: '2026-03-02T10:00:00Z' },
      { id: 'k2', grupoId: 'g1', tipo: 'Gasto', categoria: 'Ocio', descripcion: 'Cine', importe: 10, fecha: '2026-02-27', pagadoPor: 'uA', reparto: { yo: 3.34, uA: 3.33, p1: 3.33 }, createdAt: '2026-02-27T10:00:00Z' },
      { id: 'k3', grupoId: 'g1', tipo: 'Liquidación', importe: 20, fecha: '2026-03-05', pagadoPor: 'uA', reparto: { yo: 20 }, createdAt: '2026-03-05T10:00:00Z' }];
    await caso('metas ligadas + compartidos·' + et, { movs: ML.concat([{ id: 'pk1', tipo: 'Gasto', categoria: 'Supermercado', importe: 33.34, fecha: '2026-03-02', compartidoId: 'k1' }]), hoy: '2026-03-10', app: { cuentas: D.CUENTAS3('2025-10-31'), ahorro: [{ id: 'me1', nombre: 'Viaje', objetivo: 3000, cuentaId: 'c2' }], deudas, mesInicio: m }, comps, grupos });
  }
  prob.forEach((p) => console.log('FAIL ' + p.slice(0, 400)));
  console.log(prob.length ? 'FAILED ' + prob.length : 'ALL OK');
  process.exit(prob.length ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

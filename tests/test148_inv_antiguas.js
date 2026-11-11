// 11/11/2026 · Alfredo: inversiones de hace más de un año. Los precios automáticos gratuitos solo llegan a un año atrás;
// ya no se bloquea: se puede poner el precio de compra por participación, o se guarda sin participaciones y se completan luego.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const HOY = new Date().toISOString().slice(0, 10);
(async () => {
  const movs = [{ id: 'i1', tipo: 'Inversión', categoria: 'MSCI World', activoId: 'EUNL', participaciones: 10, importe: 1000, fecha: HOY, tipoActivo: 'ETF' }];
  const pre = (w) => { w.SUPABASE_CONFIG = { url: 'https://x.supabase.co', anonKey: 'k' };
    w.fetch = async (u, o) => { const b = JSON.parse(o.body); let j = {};
      if (b.accion === 'valorar') j = { valores: { EUNL: { activo: { id: 'EUNL' }, cierre_eur: 100, cierre: 100, moneda: 'EUR', fecha_precio: HOY } } };
      else if (b.accion === 'precio_en') j = b.fecha < '2025-01-01' ? { error: 'sin_precio' } : { cierre: 100, cierre_eur: 100, moneda: 'EUR', fecha_precio: b.fecha };
      else if (b.accion === 'historico') j = { series: {} };
      return { ok: true, status: 200, json: async () => j }; }; };
  const e = makeEnv({ version: { dinero: 3, importe: 1 }, cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }] }, meta: { onboarded: true } }, movs, pre });
  e.w.Auth.getSession = async () => ({ access_token: 't' });
  await sleep(120);
  const A = e.w.__APP__, H = A.H, doc = e.doc;
  const nueva = async (fecha, imp, precioU) => {
    H.openMovForm([]); await sleep(20); click(e, 'pickTipo', 'Inversión'); await sleep(20);
    click(e, 'pickActivoPropio', 'EUNL'); await sleep(60);
    doc.querySelector('#fFecha').value = fecha; doc.querySelector('#fImporte').value = String(imp);
    if (precioU != null) doc.querySelector('#fPrecioU').value = precioU;
    click(e, 'saveMov'); await sleep(120);
    return Object.values(e.store.movimientos).find((m) => m.importe === imp);
  };
  ok(!!(await (async () => { H.openMovForm([]); await sleep(20); click(e, 'pickTipo', 'Inversión'); await sleep(20); click(e, 'pickActivoPropio', 'EUNL'); await sleep(60); const x = doc.querySelector('#fPrecioU'); H.closeSheet([]); await sleep(250); return x; })()), 'el formulario de inversión tiene «Precio por participación»');
  let m = await nueva('2008-03-14', 2000, null);
  ok(!!m && m.activoId === 'EUNL' && (m.participaciones == null) && m.fecha === '2008-03-14', 'una inversión de 2008 sin precio se guarda igual, sin participaciones (' + JSON.stringify(m && { p: m.participaciones, f: m.fecha }) + ')');
  ok(/Guardado sin participaciones/.test(doc.body.textContent), 'avisa de que se guardó sin participaciones');
  H.closeSheet([]); await sleep(250);
  m = await nueva('2006-01-10', 3000, '25,5');
  ok(!!m && Math.abs(m.participaciones - 3000 / 25.5) < 1e-6, 'con el precio de compra (25,5 €) calcula las participaciones (' + (m && m.participaciones) + ')');
  H.closeSheet([]); await sleep(250);
  m = await nueva(HOY, 500, null);
  ok(!!m && Math.abs(m.participaciones - 5) < 1e-9, 'con fecha reciente sigue usando el precio automático (500 / 100 = 5)');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

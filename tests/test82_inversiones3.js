// Inversiones v3 (23/10/2026, docs/15 2.4): pestaña de Dinero con «1S», líneas por activo y rentabilidad e inflación en su hoja. Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const addD = (iso, n) => { const x = new Date(iso + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const d = new Date(), hoy = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
(async () => {
  const d0 = addD(hoy, -90), s1 = [], s2 = [];
  for (let i = -92; i <= 0; i++) { const dd = addD(hoy, i); s1.push([dd, 100 + (i + 92) * 0.2]); s2.push([dd, 50 - (i + 92) * 0.05]); }
  const movs = [{ id: 'i1', tipo: 'Inversión', fecha: d0, importe: 1000, participaciones: 10, activoId: 'X1', categoria: 'Fondo Uno', tipoActivo: 'Fondo', descripcion: 'Compra' },
    { id: 'i2', tipo: 'Inversión', fecha: d0, importe: 500, participaciones: 10, activoId: 'X2', categoria: 'Acción Dos', tipoActivo: 'Acción', descripcion: 'Compra' }];
  const api = async (b) => {
    if (b.accion === 'valorar') return { valores: { X1: { activo: { id: 'X1' }, fecha_precio: hoy, cierre: s1[s1.length - 1][1], moneda: 'EUR', cierre_eur: s1[s1.length - 1][1] }, X2: { activo: { id: 'X2' }, fecha_precio: hoy, cierre: s2[s2.length - 1][1], moneda: 'EUR', cierre_eur: s2[s2.length - 1][1] } } };
    if (b.accion === 'historico') return { desde: b.desde, series: { X1: s1, X2: s2 }, limite: false, incompletos: [] };
    return { error: 'x' };
  };
  const pre = (w) => { w.SUPABASE_CONFIG = { url: 'https://x.supabase.co', anonKey: 'k' }; w.fetch = async (u, o) => { const j = await api(JSON.parse(o.body)); return { ok: true, status: 200, json: async () => j }; }; };
  const e = makeEnv({ version: { dinero: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'X' }] }, meta: { onboarded: true } }, movs, pre });
  e.w.Auth.getSession = async () => ({ access_token: 't' });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc;
  H.goTab(['dinero']); H.dm3Tab(['inversiones']); await sleep(200);
  ok(doc.querySelector('#invChart') && !doc.querySelector('.dm-volver'), 'la pestaña Inversiones trae la gráfica dentro (sin «Ver todo»)');
  ok(doc.querySelector('[data-click="setInvPeriodo|1s"]') && /1S/.test(doc.querySelector('.tr-chips').textContent), 'periodo «1S» (7 días)');
  click(e, 'setInvPeriodo', '1s'); await sleep(20);
  ok(/en 7 días/.test(doc.querySelector('#invChg').textContent), '«1S» dice «en 7 días»');
  const chips = [...doc.querySelectorAll('.tr-lineas .chip')].map((x) => x.textContent);
  ok(chips.length === 3 && chips[0] === 'Total' && chips.indexOf('FU') > 0 && chips.indexOf('AD') > 0, 'chips de líneas: Total y uno por activo, con nombre corto (24/10: ' + chips.join('|') + ')');
  ok(doc.querySelectorAll('#invChart .tr-linea-a').length === 0, 'por defecto, solo el total');
  H.invLinea(['X1']); await sleep(20); H.invLinea(['X2']); await sleep(20);
  ok(doc.querySelectorAll('#invChart path[fill-opacity]').length === 3 && doc.querySelector('#invVals'), 'con dos activos elegidos salen sus dos franjas y la del resto (24/10: en «Valor» se apilan)');
  ok(['var(--ink)', 'var(--accent)'].indexOf(doc.querySelector('#invLineV').style.stroke) >= 0, 'con varios activos, el total no va ni verde ni rojo');
  const el = doc.querySelector('#invChart'); el.getBoundingClientRect = () => ({ left: 0, width: 100, top: 0, height: 150 });
  const ev = new e.w.Event('pointerdown', { bubbles: true }); ev.clientX = 50; ev.pointerId = 1; ev.pointerType = 'touch'; ev.buttons = 1; el.dispatchEvent(ev);
  ok(/Total/.test(doc.querySelector('#invVals').textContent) && /Fondo Uno/.test(doc.querySelector('#invVals').textContent), 'al arrastrar el dedo, el valor de cada línea debajo');
  H.invLinea(['total']); await sleep(20);
  ok(doc.querySelectorAll('#invChart .tr-linea-a').length === 0, '«Total» vuelve a la línea sola');
  click(e, 'setInvPeriodo', 'max'); await sleep(20);
  const fila = doc.querySelector('.dm3-renta');
  ok(fila && /Rentabilidad al año e inflación/.test(fila.textContent) && /al año/.test(fila.textContent), 'una fila «Rentabilidad al año e inflación» en vez del bloque entero');
  ok(!doc.querySelector('#content .dm-inf'), 'la comparación con la inflación ya no está en la pantalla');
  H.invRentaVer([]); await sleep(20);
  ok(doc.querySelector('#sheetHost .dm-inf'), 'y se abre en su hoja');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

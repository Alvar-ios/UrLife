// Parche 7 (17/10/2026): etiquetas NUEVO de «Así vas», «Tu mes» y las cuentas, y que no salgan en Movimientos.
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pad = (n) => String(n).padStart(2, '0');
const d = new Date(), Y = d.getFullYear(), M = d.getMonth() + 1, ym = Y + '-' + pad(M);
const pm = M === 1 ? 12 : M - 1, py = M === 1 ? Y - 1 : Y, ymPrev = py + '-' + pad(pm);
const html = (e) => e.doc.querySelector('#content').innerHTML;
(async () => {
  const e = makeEnv({ verAnteriorInicio: true,
    cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 100 }, { nombre: 'Ocio' }], ingresos: ['Nómina'],
      // ya vio las etiquetas antiguas de Tú: así se ven las nuevas (como mucho salen 3 a la vez)
      badgesVistos: { grupos: '2026-10-13', categorias: '2026-10-13', cobros: '2026-10-13', metas: '2026-10-13', patrimonio: '2026-10-13' },
      cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: ymPrev + '-01', principal: true }, { id: 'c2', nombre: 'Efectivo', tipo: 'efectivo', saldo: 50, fecha: ymPrev + '-01' }] }, meta: { onboarded: true } },
    movs: [{ id: 'n1', tipo: 'Ingreso', categoria: 'Nómina', importe: 2000, fecha: ym + '-01', cuentaId: 'c1' },
      { id: 's1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Mercadona', importe: 95, fecha: ym + '-01', cuentaId: 'c1' },
      { id: 'p1', tipo: 'Gasto', categoria: 'Supermercado', importe: 40, fecha: ymPrev + '-02', cuentaId: 'c1' }],
    url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } },
  });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S;
  const vistos = () => A.cfg().badgesVistos || {};

  /* 1. Inicio: «Así vas» con su etiqueta; al tocar una tarjeta se quita y hace lo de siempre */
  H.goTab(['inicio']); await sleep(10);
  ok(/Así vas <span class="badge-new mejor">MEJORADO/.test(html(e)), 'Inicio: «Así vas» lleva MEJORADO (Parche 8)');
  const tarjeta = e.doc.querySelector('.ins-card');
  ok(tarjeta && /^insIr\|/.test(tarjeta.getAttribute('data-click')), 'las tarjetas pasan por insIr');
  tarjeta.click(); await sleep(20);
  ok(vistos().asivas, 'al tocar una tarjeta, la etiqueta queda vista');
  ok(S.tab === 'movimientos', 'y la tarjeta sigue llevando a Movimientos como antes');
  /* 2. Movimientos: sin etiquetas, como lo dejó diseño */
  ok(!e.doc.querySelector('#content .badge-new'), 'Movimientos: ninguna etiqueta NUEVO / MEJORADO');
  H.goTab(['inicio']); await sleep(10);
  ok(!/Así vas <span class="badge-new/.test(html(e)), 'Inicio: «Así vas» ya sin etiqueta');
  // las demás tarjetas también funcionan a través de insIr (p. ej. días sin gastos → Calendario)
  const cal = [...e.doc.querySelectorAll('.ins-card')].find((b) => /insIr\|irMovsCal/.test(b.getAttribute('data-click')));
  if (cal) { cal.click(); await sleep(20); ok(S.tab === 'movimientos' && S.movVista === 'calendario', '«días sin gastos» sigue abriendo el Calendario'); H.goTab(['inicio']); await sleep(10); }

  /* 3. Tú: «Tu mes» y «Cuentas y saldos» con NUEVO */
  H.goTab(['tu']); await sleep(10);
  ok(/Tu mes <span class="badge-new mejor">MEJORADO/.test(html(e)) && /Cuentas y saldos <span class="badge-new ">NUEVO/.test(html(e)), 'Tú: MEJORADO en «Tu mes» (Parche 8) y NUEVO en «Cuentas y saldos»');
  ok(e.doc.querySelector('#tbAvatar').classList.contains('con-novedad'), 'punto en tu inicial mientras haya algo nuevo en Tú');
  click(e, 'tuMesAbrir'); await sleep(20);
  ok(vistos().tumes, 'al abrir «Tu mes» se quita su etiqueta');
  H.closeSheet([]); await sleep(300);
  click(e, 'openCuentas'); await sleep(20);
  ok(vistos().cuentas, 'al abrir «Cuentas y saldos» se quita su etiqueta');
  H.closeSheet([]); await sleep(300);
  H.goTab(['tu']); await sleep(10);
  ok(!/Tu mes <span class="badge-new/.test(html(e)) && !/Cuentas y saldos <span class="badge-new/.test(html(e)), 'Tú: ya sin esas etiquetas');

  /* 4. Las novedades: «Tu mes» se abre desde su punto */
  H.novIr(['tumes']); await sleep(320);
  ok(/Tu mes/.test(e.doc.querySelector('#sheetHost').textContent), 'novedades → «Tu mes» abre su hoja');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('FAIL ' + x); process.exit(1); });

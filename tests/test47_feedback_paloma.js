// Feedback del 17/10 (noche): saldo real = lo que dice el banco; Inicio con cambio de mes, barra y «Así vas»; anillo más vivo.
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pad = (n) => String(n).padStart(2, '0');
const d = new Date(), Y = d.getFullYear(), M = d.getMonth() + 1, ym = Y + '-' + pad(M), hoy = ym + '-' + pad(d.getDate());
const pm = M === 1 ? 12 : M - 1, py = M === 1 ? Y - 1 : Y, ymPrev = py + '-' + pad(pm);
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const txt = (e) => e.doc.querySelector('#content').textContent.replace(/\s+/g, ' ');
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
(async () => {
  /* 1. Un gasto compartido que pagas tú: el saldo real baja entero; el virtual, solo tu parte */
  const yo = 'yo', ella = 'pa';
  const e = makeEnv({
    cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 100 }, { nombre: 'Ocio' }], ingresos: ['Nómina'],
      cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: ymPrev + '-01', principal: true }, { id: 'c2', nombre: 'Efectivo', tipo: 'efectivo', saldo: 50, fecha: ymPrev + '-01' }] }, meta: { onboarded: true } },
    movs: [{ id: 'n1', tipo: 'Ingreso', categoria: 'Nómina', importe: 2000, fecha: ym + '-01', cuentaId: 'c1' },
      { id: 's1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Mercadona', importe: 95, fecha: ym + '-01', cuentaId: 'c1' },
      { id: 'o1', tipo: 'Gasto', categoria: 'Ocio', importe: 60, fecha: ym + '-01', cuentaId: 'c1' },
      { id: 'p1', tipo: 'Gasto', categoria: 'Supermercado', importe: 40, fecha: ymPrev + '-02', cuentaId: 'c1' }],
    url: 'https://x.test/', session: { user: { email: 't@t.com', id: yo } },
  });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S;
  S.grupos = [{ id: 'g1', nombre: 'Casa', miembros: [{ user_id: yo, nombre: 'Yo', rol: 'admin' }, { user_id: ella, nombre: 'Pa', rol: 'miembro' }] }];
  S.compartidos = [{ id: 'k1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Restaurantes y bares', importe: 22.5, fecha: ym + '-01', pagadoPor: yo, reparto: { [yo]: 11.25, [ella]: 11.25 }, createdAt: new Date().toISOString() }];
  A.render(); await sleep(10);
  const c1 = A.cfg().cuentas[0], real = A.saldoCuenta(c1), virt = real + A.compartidosCuenta(c1).neto;
  ok(Math.abs(real - (1000 + 2000 - 95 - 60 - 40 - 22.5)) < 0.001, 'saldo real: el compartido que pagaste baja entero (22,50), como en el banco (' + real + ')');
  ok(Math.abs(virt - real - 11.25) < 0.001, 'saldo virtual: suma lo que te debe la otra persona (11,25)');
  H.cuentaVer(['c1']); await sleep(20);
  ok(/Saldo real · lo que dice tu banco/.test(sh(e)) && /Saldo virtual/.test(sh(e)) && /te deben 11,25 €/.test(sh(e)), 'la ficha: saldo real arriba y el virtual aparte, explicado');
  H.closeSheet([]); await sleep(260);
  // al saldar, entra el Bizum: el real sube y el virtual no cambia
  S.compartidos.push({ id: 'k2', grupoId: 'g1', tipo: 'Liquidación', importe: 11.25, fecha: ym + '-01', pagadoPor: ella, reparto: { [yo]: 11.25 }, createdAt: new Date().toISOString() });
  const real2 = A.saldoCuenta(c1);
  ok(Math.abs(real2 - real - 11.25) < 0.001, 'al saldar (Bizum) el saldo real sube lo que te devuelven');
  S.compartidos.pop();

  /* 2. Inicio: cambiar de mes, la barra y «Así vas» */
  H.goTab(['inicio']); await sleep(10);
  ok(!!e.doc.querySelector('.hero-bar') && /Ingresos/.test(e.doc.querySelector('.hk-cels').textContent) && /Gastos/.test(e.doc.querySelector('.hk-cels').textContent) && /Apartado/.test(e.doc.querySelector('.hk-cels').textContent) && /Invertido/.test(e.doc.querySelector('.hk-cels').textContent), 'Inicio: la barra y debajo los importes del mes (ingresos, gastos, apartado, invertido; 22/10)');
  ok(!!e.doc.querySelector('[data-click="inicioMes|-1"]') && e.doc.querySelector('.hero2 [aria-label="Mes siguiente"]').disabled, 'Inicio: flechas para cambiar de mes (no hacia el futuro)');
  ok(/Así vas/.test(txt(e)) && e.doc.querySelectorAll('.ins-c').length >= 2, 'Inicio: «Así vas» con datos del mes (' + [...e.doc.querySelectorAll('.ins-c')].map((x) => x.getAttribute('aria-label')).join(' | ') + ')');
  ok([...e.doc.querySelectorAll('.ins-c')].some((b) => /te deben 11,25 €/.test(b.getAttribute('aria-label'))), '«Así vas» dice lo que te deben en Juntos');
  click(e, 'inicioMes', '-1'); await sleep(10);
  ok(new RegExp(MESES[pm - 1]).test(e.doc.querySelector('.mes-pill').textContent) && /Te quedó en|gastaste más de lo que entró/.test(txt(e)) && !e.doc.querySelector('.hero-prev, .h2-dato.prev'), 'mes anterior: «Te quedó en …» y sin previsión');
  click(e, 'heroResumen'); await sleep(10);
  ok(S.tab === 'movimientos' && S.movPeriodo === 'm:' + ymPrev, 'tocar la cifra abre el Resumen de ese mes');
  H.goTab(['inicio']); await sleep(10);
  ok(new RegExp(MESES[M - 1]).test(e.doc.querySelector('.mes-pill').textContent), 'al volver a Inicio, otra vez el mes actual');

  /* 3. El anillo: fuera de la tarjeta, la leyenda en fichas y el elegido sale hacia fuera */
  H.goTab(['movimientos']); await sleep(10);
  S.verAnterior = { movResumen: 2 }; A.render(); await sleep(10); // versión «Anillo»
  ok(!!e.doc.querySelector('#gcAnillo svg'), 'versión Anillo: el anillo encima de la lista');
  H.gcAbrir(['Supermercado']); await sleep(10);
  const elegido = e.doc.querySelector('#gcAnillo .dn-s.sel');
  ok(!!elegido && /translate\((?!0px,0px)/.test(elegido.getAttribute('style') || ''), 'el trozo elegido sale hacia fuera');
  ok(!!e.doc.querySelector('.gc-fila.abierta[data-gc="Supermercado"]'), 'y su fila de la lista se abre');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH', x); process.exit(1); });

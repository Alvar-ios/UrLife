// Dinero v2 (18/10/2026): pantalla de un vistazo, metas en Camino/Tarros/Anillos, Aportar rápido, inversiones «Ver todo»
// y repaso de deudas («Ya pagado», «Pagas al mes», nombres antiguos, cuadrar, eliminar y deshacer). Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoy = new Date(), ym = hoy.toISOString().slice(0, 7), y1 = hoy.getFullYear() + 1;
const cfgApp = {
  categoriasGasto: [{ nombre: 'X' }],
  cuentas: [{ id: 'k1', nombre: 'Banco', saldo: 3000, fecha: ym + '-01', principal: true }],
  ahorro: [{ id: 'm1', nombre: 'Colchón', objetivo: 3000, yaAhorrado: 600 }, { id: 'm2', nombre: 'Viaje a Japón', objetivo: 2500, fechaObjetivo: y1 + '-04-30', hitos: [{ id: 'h1', nombre: 'Vuelos', importe: 1200 }] }],
  deudas: [{ nombre: 'Coche', objetivo: 8000, previo: 4000, cuotaMes: 200, fechaObjetivo: (y1 + 2) + '-06-30' }, { nombre: 'Tarjeta', objetivo: 400, fechaObjetivo: '2020-01-31' }],
};
const movs = [{ id: 'a1', tipo: 'Ahorro', categoria: 'Viaje a Japón', metaId: 'm2', importe: 300, fecha: ym + '-02' },
  { id: 'd1', tipo: 'Deuda', categoria: 'Coche', importe: 200, fecha: ym + '-01' }, { id: 'd2', tipo: 'Deuda', categoria: 'Coche viejo', importe: 100, fecha: ym + '-01' },
  { id: 'i1', tipo: 'Inversión', categoria: 'Fondo Mundo', tipoActivo: 'Fondo', importe: 1000, fecha: ym + '-01' }];
(async () => {
  const e = makeEnv({ cfg: { app: cfgApp, meta: { onboarded: true } }, movs }); await sleep(80);
  const A = e.w.__APP__, S = A.S, doc = e.doc, txt = () => doc.querySelector('#content').textContent.replace(/\s+/g, ' '), sh = () => doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
  A.H.goTab(['dinero']); await sleep(20);
  ok(/Lo que tienes/.test(txt()) && !doc.querySelector('.chips-nav'), 'Dinero es una sola pantalla: «Lo que tienes» y sin pestañas');
  ok(/En cuentas/.test(txt()) && /Invertido/.test(txt()) && /Por pagar/.test(txt()), 'tres fichas: En cuentas, Invertido, Por pagar');
  const p = A.patrimonio();
  ok(Math.abs(p.total - (p.banco + p.inv - p.deudas)) < 0.01, 'Lo que tienes = cuentas + inversiones − deudas (lo apartado no se suma dos veces)');
  ok(/apartados para tus metas/.test(txt()), 'se dice cuánto de tus cuentas está apartado para metas');
  ok(['Cuentas', 'Metas', 'Inversiones', 'Deudas'].every((t) => !!doc.querySelector('#dm-' + t.toLowerCase())), 'bloques Cuentas, Metas, Inversiones y Deudas');
  // metas: Camino por defecto, con emoji y raya de puntos
  ok(doc.querySelectorAll('.dm-cam').length === 2 && doc.querySelectorAll('.dm-cam-emo svg.i').length === 2 && !/🛟|✈️/.test(txt()), 'metas en Camino («22 oct»), con su dibujo (iconos de la app, no emojis)');
  ok(/Para abril de \d{4}: \d+ €\/mes|Para abril: \d+ €\/mes|Vas bien para abril/.test(txt()), 'Viaje con fecha: «Para abril…: X €/mes» (sin jerga)');
  ok(!/Cuota necesaria|Ritmo \(últimos/.test(txt()), 'fuera «Cuota necesaria» y «Ritmo (últimos 3 meses)»');
  S.verAnterior = { dinero: 1 }; A.render(); await sleep(10); ok(doc.querySelectorAll('.dm-tarro').length === 2, '«Tarros»: un tarro por meta');
  S.verAnterior = { dinero: 2 }; A.render(); await sleep(10); ok(doc.querySelectorAll('.dm-ani').length === 2, '«Anillos»: un anillo por meta');
  S.verAnterior = { dinero: 3 }; A.render(); await sleep(10); ok(!!doc.querySelector('.chips-nav'), '«Antes»: la pantalla anterior con pestañas');
  S.verAnterior = { dinero: 4 }; A.render(); await sleep(10);
  // hoja de la meta y Aportar
  A.H.metaVer(['m2']); await sleep(20);
  ok(/Viaje a Japón/.test(sh()) && /Quedan/.test(sh()) && /Aportar/.test(sh()) && /He usado dinero/.test(sh()), 'hoja de la meta: lo esencial, Aportar y «He usado dinero»');
  A.H.metaMas([]); await sleep(10); ok(/Elegir movimientos/.test(sh()) && !/Vincular/.test(sh()), '«Más»: «Elegir movimientos» (antes «Vincular»)');
  A.H.metaAportarR(['m2']); await sleep(20);
  A.H.aportarRImp(['100']); await sleep(10);
  ok(/12 % → 16 %/.test(sh()) && /Aportar 100,00 €/.test(sh()), 'Aportar: 100 € de un toque y la vista previa «12 % → 16 %»');
  const n0 = Object.keys(e.store.movimientos).length;
  await A.H.aportarRGuardar([]); await sleep(40);
  const nuevo = Object.values(e.store.movimientos).find((m) => m.tipo === 'Ahorro' && m.importe === 100);
  ok(Object.keys(e.store.movimientos).length === n0 + 1 && nuevo && nuevo.metaId === 'm2' && nuevo.categoria === 'Viaje a Japón', 'se guarda un movimiento de Apartar de 100 € en la meta');
  A.H.metaAportarR(['m2']); await sleep(20); await A.H.aportarRGuardar([]); await sleep(20);
  ok(/Pon cuánto apartas/.test((doc.querySelector('#toast') || {}).textContent || ''), 'sin importe no guarda');
  A.H.closeSheet([]); await sleep(260);
  // inversiones: «Ver todo» es una pantalla
  A.H.dmVer(['inversiones']); await sleep(20);
  ok(/‹?\s*Dinero/.test(txt()) && /Inversiones/.test(txt()) && /Has metido/.test(txt()) && /Tus activos/.test(txt()) && !/Por tipo de activo/.test(txt()), '«Ver todo» de inversiones: pantalla con «‹ Dinero», «Has metido» y «Tus activos»');
  ok(/no tiene precio porque falta elegir el activo/.test(txt()), 'aviso del activo sin precio');
  A.H.dmVer(['']); await sleep(20); ok(/Lo que tienes/.test(txt()), '«‹ Dinero» vuelve');
  // deudas: «Ya pagado» y «Pagas al mes»
  const st = A.deudaStats(A.cfg().deudas[0]);
  ok(st.pagado === 4200 && st.pend === 3800 && st.ritmo === 200 && st.acaba, 'Coche: pagado = ya pagado 4.000 + pagos 200; al mes 200 → fecha de fin');
  ok(/Acabas en .* · a tiempo ✓/.test(A.deudaEstado2(st).t), 'Coche: «Acabas en … · a tiempo ✓»');
  ok(A.deudaEstado2(A.deudaStats(A.cfg().deudas[1])).k === 'mal' && /Tenías que acabar en/.test(txt()), 'Tarjeta con la fecha pasada: el único rojo, «Tenías que acabar en…»');
  A.H.deudaVer(['Coche']); await sleep(20);
  ok(/Quedan\s*3\.800,00 €/.test(sh()) && /llevas pagado el 53 %/.test(sh()), 'hoja de la deuda: «Quedan 3.800 €», «llevas pagado el 53 %»');
  A.H.deudaMas(['100']); await sleep(10);
  ok(/Con 300,00 € al mes acabarías/.test(sh()) && /no se guarda nada/.test(sh()), '«¿Y si pagas más?» +100 → «Con 300 € al mes acabarías…»');
  // editar: renombrar conserva los pagos
  A.H.deudaEditar(['Coche']); await sleep(20);
  doc.querySelector('#dNombre').value = 'Coche nuevo'; await A.H.deudaGuardar([]); await sleep(30);
  let d0 = A.cfg().deudas.find((d) => d.nombre === 'Coche nuevo');
  ok(d0 && (d0.nombresAntes || []).includes('Coche') && A.deudaStats(d0).pagado === 4200, 'renombrar «Coche» → «Coche nuevo» guarda el nombre antiguo y no pierde pagos');
  ok(d0 && d0.previo === 4000 && d0.cuotaMes === 200 && A.cfg().deudas.length === 2, 'se conservan «Ya pagado» y «Pagas al mes» y no se duplica');
  // renombrar a un nombre que ya existe (o antiguo de otra) se impide
  A.H.deudaEditar(['Tarjeta']); await sleep(20); doc.querySelector('#dNombre').value = 'coche'; await A.H.deudaGuardar([]); await sleep(20);
  ok(/Ya tienes una deuda con ese nombre/.test((doc.querySelector('#toast') || {}).textContent || '') && A.cfg().deudas.some((d) => d.nombre === 'Tarjeta'), 'no deja renombrar a un nombre (antiguo) de otra deuda');
  // números raros
  doc.querySelector('#dNombre').value = 'Tarjeta'; doc.querySelector('#dPrevio').value = 'abc'; await A.H.deudaGuardar([]); await sleep(20);
  ok(/tienen que ser números/.test((doc.querySelector('#toast') || {}).textContent || '') && A.cfg().deudas.find((d) => d.nombre === 'Tarjeta').previo == null, '«Ya pagado» con texto no se guarda');
  A.H.closeSheet([]); await sleep(260);
  // nueva deuda con un nombre que ya tiene pagos: aviso
  A.H.deudaNueva([]); await sleep(20);
  const inN = doc.querySelector('#dNombre'); inN.value = 'Coche viejo'; inN.dispatchEvent(new e.w.Event('input', { bubbles: true })); await sleep(10);
  ok(/Hay 1 pago con este nombre/.test(sh()), 'nueva deuda con un nombre que ya tiene pagos: lo avisa');
  doc.querySelector('#dTotal').value = '500'; doc.querySelector('#dCuota').value = '50'; await A.H.deudaGuardar([]); await sleep(30);
  const dv = A.cfg().deudas.find((d) => d.nombre === 'Coche viejo');
  ok(dv && dv.objetivo === 500 && dv.cuotaMes === 50 && dv.previo == null && A.deudaStats(dv).pagado === 100, 'nueva deuda guardada con números (y cuenta su pago)');
  // cuadrar con el banco
  A.H.deudaCuadrar(['Coche viejo']); await sleep(10); doc.querySelector('#dqBanco').value = '350'; await A.H.deudaCuadrarOk([]); await sleep(30);
  let dq = A.cfg().deudas.find((d) => d.nombre === 'Coche viejo');
  ok(dq.previo === 50 && A.deudaStats(dq).pend === 350, 'cuadrar: el banco dice 350 → «Ya pagado» 50 y quedan 350');
  A.H.deudaCuadrar(['Coche viejo']); await sleep(10); doc.querySelector('#dqBanco').value = '600'; await A.H.deudaCuadrarOk([]); await sleep(20);
  ok(/subiremos el total/.test(sh()) && A.cfg().deudas.find((d) => d.nombre === 'Coche viejo').previo === 50, 'si el banco dice más de lo que queda: avisa y pide confirmación (no guarda aún)');
  await A.H.deudaCuadrarOk([]); await sleep(30);
  dq = A.cfg().deudas.find((d) => d.nombre === 'Coche viejo');
  ok(dq.objetivo === 700 && dq.previo === 0 && A.deudaStats(dq).pend === 600, 'al confirmar: total 700, «Ya pagado» 0 y quedan 600');
  // importar con un nombre antiguo no crea una deuda repetida
  const nuevos = A.impNuevosConfig([{ tipo: 'Deuda', categoria: 'Coche' }, { tipo: 'Deuda', categoria: 'Moto' }]);
  ok(nuevos.deudas.length === 1 && nuevos.deudas[0] === 'Moto', 'importar pagos de «Coche» (nombre antiguo) no crea otra deuda');
  // eliminar y deshacer (los pagos no se tocan)
  A.H.deudaVer(['Coche viejo']); await sleep(10); A.H.deudaMasMenu([]); await sleep(10);
  const bt = doc.querySelector('[data-click^="deudaEliminar"]'); bt.click(); bt.click(); await sleep(40);
  ok(!A.cfg().deudas.some((d) => d.nombre === 'Coche viejo') && e.store.movimientos.d2, 'eliminar la deuda: sale de la lista y su pago sigue en Movimientos');
  doc.querySelector('#toast .toast-btn').click(); await sleep(40);
  ok(A.cfg().deudas.some((d) => d.nombre === 'Coche viejo'), '«Deshacer» la recupera');
  // Tú → Deudas lleva a Dinero
  A.H.goTab(['tu']); await sleep(10); A.H.openListEditor(['deudas']); await sleep(20);
  ok(S.tab === 'dinero', 'Tú → Deudas lleva a Dinero');
  // usuario nuevo
  const z = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'X' }] }, meta: { onboarded: true } } }); await sleep(80);
  z.w.__APP__.H.goTab(['dinero']); await sleep(10);
  const tz = z.doc.querySelector('#content').textContent;
  ok(/Pon el saldo de tu banco/.test(tz) && /Crea tu primera meta/.test(tz) && /Apunta una deuda/.test(tz) && !/NaN|undefined/.test(tz), 'usuario nuevo: tres filas para empezar, sin cifras raras');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

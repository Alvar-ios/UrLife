// Calidad (18/10/2026): cuentas, fase 2 en Juntos. Revisión con ojos frescos de la rama fase2/cuentas-juntos.
// Datos inventados (sin usuarios reales). Las líneas «PEND» son fallos conocidos que aún no están arreglados:
// no hacen fallar la prueba; cuando se arreglen, saldrá «ARREGLADO» y hay que cambiarlas por ok().
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pend = (c, m) => console.log((c ? 'ARREGLADO (cambiar por ok) ' : 'PEND ') + m);
const pad = (n) => String(n).padStart(2, '0');
const d = new Date(), hoy = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const hace = (n) => { const x = new Date(Date.now() - 864e5 * n); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
const YO = 'uA', ELLA = 'uP', SC = 's1';

// servidor de Juntos simulado: dos grupos y una persona sin cuenta en «Casa»
function conJuntos(w, DB) {
  let seq = 0;
  const L = [], aviso = () => setTimeout(() => L.forEach((f) => f()), 0), copia = (x) => JSON.parse(JSON.stringify(x));
  // movimientos que avisan a la app cada vez que cambian (como Supabase en tiempo real)
  const LM = [], st = DB.movs, avM = () => LM.forEach((f) => f()), base = w.Data;
  const movsCol = { onSnapshot: (cb) => { const f = () => cb({ docs: Object.entries(st).map(([id, v]) => ({ id, data: () => copia(v) })) }); LM.push(f); setTimeout(f, 0); return () => {}; },
    add: async (o) => { const k = 'n' + (++seq); st[k] = copia(o); avM(); return { id: k }; },
    doc: (id) => { const k = id || 'n' + (++seq); return { id: k, set: async (o) => { st[k] = copia(o); avM(); }, delete: async () => { delete st[k]; avM(); } }; } };
  w.Data = Object.assign({}, base, { uid: () => YO, collection: (n) => (n === 'movimientos' ? movsCol : base.collection(n)),
    grupos: { listar: async () => copia(DB.est), invitaciones: async () => [], renombrar: async () => [], miNombre: async () => [], reparto: async () => [] },
    compartidos: {
      suscribir: (n) => { const f = () => n(copia(DB.comp)); L.push(f); setTimeout(f, 0); return () => {}; },
      crear: async (o) => { const c = Object.assign({ id: 'k' + (++seq), creadoPor: YO, createdAt: new Date(Date.now() + seq).toISOString() }, copia(o)); DB.comp.push(c); aviso(); return copia(c); },
      editar: async (id, o) => { const c = DB.comp.find((x) => x.id === id); Object.assign(c, copia(o)); aviso(); return copia(c); },
      borrar: async (id) => { DB.comp = DB.comp.filter((x) => x.id !== id); aviso(); return [{ id }]; },
    },
    objetivos: { suscribir: (n) => { setTimeout(() => n([]), 0); return () => {}; } },
    aportes: { suscribir: (n) => { setTimeout(() => n([]), 0); return () => {}; } },
    rpc: async () => null });
}
function entorno(cuentas, extra) {
  const DB = { comp: [], movs: {}, est: {
    grupos: [{ id: 'g1', nombre: 'Casa', tipo: 'grupo', creado_por: YO, created_at: 'a' }, { id: 'g2', nombre: 'Viaje', tipo: 'grupo', creado_por: YO, created_at: 'b' }],
    miembros: [{ grupo_id: 'g1', user_id: YO, nombre: 'Yo', rol: 'admin', created_at: 'a' }, { grupo_id: 'g1', user_id: ELLA, nombre: 'Pa', rol: 'miembro', created_at: 'b' },
      { grupo_id: 'g2', user_id: YO, nombre: 'Yo', rol: 'admin', created_at: 'a' }, { grupo_id: 'g2', user_id: ELLA, nombre: 'Pa', rol: 'miembro', created_at: 'b' }],
    sinCuenta: [{ id: SC, grupo_id: 'g1', nombre: 'Tía', creado_por: YO, created_at: 'c' }] } };
  const e = makeEnv({ cfg: { app: Object.assign({ categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'], cuentas }, extra || {}), meta: { onboarded: true } },
    movs: [], url: 'https://x.test/', session: { user: { email: 'prueba@ejemplo.com', id: YO } }, pre: (w) => conJuntos(w, DB) });
  return { e, DB };
}
const DOS = () => [{ id: 'c1', nombre: 'Banco', saldo: 1000, fecha: hace(40), principal: true }, { id: 'c2', nombre: 'Efectivo', tipo: 'efectivo', saldo: 100, fecha: hace(40) }];

(async () => {
  const { e, DB } = entorno(DOS());
  await sleep(200);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost').textContent;
  const saldo = (id) => A.saldoCuenta(A.cfg().cuentas.find((c) => c.id === id));
  const mapa = () => e.store.cfg.app.cuentaJuntos || {};
  const cerrar = async () => { H.closeSheet([]); await sleep(260); };
  // abre «Gasto compartido» en un grupo y rellena importe y categoría
  const nuevoComp = async (g, imp) => {
    H.crearIr(['compartido']); await sleep(30); H.compDest(['g:' + g]); await sleep(10);
    doc.querySelector('#fImporte').value = String(imp); doc.querySelector('#fCategoria').value = 'Supermercado';
  };
  ok(Array.isArray(S.grupos) && S.grupos.length === 2, 'arranca con dos grupos de Juntos');

  /* 1. Gasto compartido nuevo que pago yo desde Efectivo */
  await nuevoComp('g1', 30);
  ok(/Lo pagaste desde/.test(sh()) && doc.querySelectorAll('#cuentaChips .chip').length === 2, 'formulario nuevo: «Lo pagaste desde» con las dos cuentas');
  click(e, 'pickCuenta', 'c2'); await sleep(5);
  H.saveMov([]); await sleep(60);
  const k1 = DB.comp[0] && DB.comp[0].id;
  ok(!!k1 && mapa()[k1] === 'c2', 'se guarda en tu configuración que salió de Efectivo');
  ok(saldo('c2') === 70 && saldo('c1') === 1000, 'saldo real: baja Efectivo entero (30) y Banco no se mueve (' + saldo('c1') + ' / ' + saldo('c2') + ')');
  const virt = A.compartidosCuenta(A.cfg().cuentas[0]);
  ok(virt.neto === 20, 'Juntos: te deben 20 (Pa y la Tía, 10 cada una) (' + virt.neto + ')');
  ok(Math.round((A.enTusCuentas() + virt.neto) * 100) / 100 === 1090, 'el total (cuentas + lo que te deben) cuadra: 1.100 − 30 + 20 = 1.090');
  // la copia personal del gasto (tu cargo del banco)
  const copia = Object.values(DB.movs).find((m) => m.compartidoId === k1);
  ok(!!copia, 'se crea tu copia personal enlazada');
  ok(copia && copia.cuentaId === 'c2', 'la copia personal debería llevar cuentaId de Efectivo (lleva ' + (copia && copia.cuentaId) + ')');

  /* 2. Filtro por cuenta en Movimientos y ficha de cada cuenta */
  H.irMovsCuenta(['c2']); await sleep(20);
  const listaTxt = () => doc.querySelector('#content').textContent;
  ok(/pagaste tú/.test(listaTxt()) && /30,00/.test(listaTxt()), 'Movimientos filtrado por Efectivo: sale el compartido con el total pagado');
  H.irMovsCuenta(['c1']); await sleep(20);
  ok(!/pagaste tú/.test(listaTxt()), 'filtrado por Banco: no sale');
  H.cuentaVer(['c2']); await sleep(20);
  ok(/Supermercado/.test(sh()), 'ficha de Efectivo: «Últimos movimientos» debería enseñar el compartido');
  await cerrar(); H.cuentaVer(['c1']); await sleep(20);
  ok(!/Supermercado/.test(sh()), 'ficha de Banco: no debería enseñar el compartido pagado en efectivo');
  ok(!/Ojo: de momento/.test(sh()), 'ya no sale el aviso «Ojo: lo que pagas en Juntos cuenta siempre en tu principal»');
  await cerrar();

  /* 3. Editar: se abre con Efectivo; cambiar a Banco borra la entrada (Banco es la principal) */
  H.openMovForm(['c:' + k1]); await sleep(20);
  ok(/Efectivo/.test((doc.querySelector('#cuentaChips .chip.active') || {}).textContent || ''), 'al editar, sale marcado Efectivo');
  click(e, 'pickCuenta', 'c1'); await sleep(5); H.saveMov([]); await sleep(60);
  ok(mapa()[k1] === 'c1' && saldo('c1') === 970 && saldo('c2') === 100, 'cambiar a la principal: se guarda Banco y baja el Banco (así no se mueve si cambias de principal)');
  H.openMovForm(['c:' + k1]); await sleep(20); click(e, 'pickCuenta', 'c2'); await sleep(5); H.saveMov([]); await sleep(60);
  ok(mapa()[k1] === 'c2', 'y se puede volver a Efectivo');

  /* 4. Cambiar el pagador: de mí a ella y al revés */
  H.openMovForm(['c:' + k1]); await sleep(20);
  H.compPagador([ELLA]); await sleep(5);
  ok(!doc.querySelector('#cuentaChips'), 'si pagó ella, desaparece «Lo pagaste desde»');
  H.saveMov([]); await sleep(60);
  ok(!(k1 in mapa()) && saldo('c2') === 100 && saldo('c1') === 1000, 'pagó ella: se quita la cuenta guardada y ninguna cuenta baja');
  H.openMovForm(['c:' + k1]); await sleep(20);
  H.compPagador([YO]); await sleep(5);
  ok(/Lo pagaste desde/.test(sh()) && /Banco/.test(doc.querySelector('#cuentaChips .chip.active').textContent), 'vuelvo a pagar yo: reaparece, marcada la principal');
  click(e, 'pickCuenta', 'c2'); await sleep(5); H.saveMov([]); await sleep(60);
  ok(mapa()[k1] === 'c2' && saldo('c2') === 70, 'y elijo Efectivo otra vez');

  /* 5. Mover el compartido a otro grupo (cambia su id) */
  H.openMovForm(['c:' + k1]); await sleep(20); H.compDest(['g:g2']); await sleep(10);
  ok(/Lo pagaste desde/.test(sh()) && /Efectivo/.test(doc.querySelector('#cuentaChips .chip.active').textContent), 'al cambiar de grupo se mantiene Efectivo marcado');
  H.saveMov([]); await sleep(60);
  const k1b = (DB.comp.find((c) => c.grupoId === 'g2') || {}).id;
  ok(!!k1b && k1b !== k1 && !(k1 in mapa()) && mapa()[k1b] === 'c2', 'movido a «Viaje»: la cuenta pasa al id nuevo y se borra el viejo');
  ok(saldo('c2') === 70 && saldo('c1') === 1000 && S.compartidos.length === 1, 'sin duplicar: Efectivo sigue en 70');

  /* 6. Personas sin cuenta en el grupo */
  await nuevoComp('g1', 20);
  ok(doc.querySelectorAll('#compField [data-click^="compPagador"]').length >= 3, 'en «Casa» se puede elegir a la persona sin cuenta como pagadora');
  H.compPagador([SC]); await sleep(5);
  ok(!doc.querySelector('#cuentaChips'), 'si pagó la persona sin cuenta, no se pide cuenta');
  H.saveMov([]); await sleep(60);
  const k3 = (DB.comp.find((c) => c.pagadoPor === SC) || {}).id;
  ok(!!k3 && !(k3 in mapa()) && saldo('c1') === 1000 && saldo('c2') === 70, 'y no se guarda nada ni bajan tus cuentas');

  /* 7. Saldar en los dos sentidos */
  S.compartidos = S.compartidos.slice(); // deudas: Pa y la Tía deben; yo debo a la Tía
  H.saldarAbrir(['g1', YO, SC, '10']); await sleep(10);
  ok(/Desde la cuenta/.test(sh()) && doc.querySelectorAll('#saldarCuentas .chip').length === 2, 'pago yo: «Desde la cuenta»');
  click(e, 'saldarCuenta', 'c2'); await sleep(5); await H.saldarGuardar([]); await sleep(60);
  const liq1 = DB.comp.find((c) => c.tipo === 'Liquidación' && c.pagadoPor === YO);
  ok(!!liq1 && mapa()[liq1.id] === 'c2' && saldo('c2') === 60 && saldo('c1') === 1000, 'pagar desde Efectivo: baja Efectivo (60)');
  await cerrar();
  H.saldarAbrir(['g2', ELLA, YO, '15']); await sleep(10);
  ok(/A la cuenta/.test(sh()), 'me pagan: «A la cuenta»');
  await H.saldarGuardar([]); await sleep(60);
  const liq2 = DB.comp.find((c) => c.tipo === 'Liquidación' && c.pagadoPor === ELLA);
  ok(!!liq2 && !(liq2.id in mapa()) && saldo('c1') === 1015, 'sin tocar nada, entra en la principal (1.015)');
  await cerrar();
  H.saldarAbrir(['g1', ELLA, SC, '5']); await sleep(10);
  ok(!/Desde la cuenta|A la cuenta/.test(sh()), 'entre otras dos personas no se pide cuenta');
  await cerrar();
  H.irMovsCuenta(['c2']); await sleep(20);
  ok(/pagaste al saldar/.test(listaTxt()), 'Movimientos de Efectivo: sale el pago al saldar');

  /* 8. Ticket compartido: el pagador se elige en el ticket (tkPagador) y luego se pasa al mismo formulario */
  e.w.__reducirFoto = async () => ({ b64: 'QUJD', tipo: 'image/jpeg' });
  e.w.__ticketsApi = async () => ({ ticket: { es_ticket: true, comercio: 'Tienda de prueba', fecha: hoy, total: 12, moneda: 'EUR', categoria: 'Supermercado', notas: '',
    articulos: [{ nombre: 'Pan', cantidad: 1, importe: 4 }, { nombre: 'Fruta', cantidad: 1, importe: 8 }] }, modelo: 'rapido', usados: 1, limite: 60 });
  e.w.Auth.getSession = async () => ({ access_token: 't' });
  const ticket = async (pagador) => {
    await A.leerTicket({}); await sleep(30); click(e, 'tkRep', '1'); await sleep(10); H.tkDest(['g:g2']); await sleep(10); H.tkPagador([pagador]); await sleep(10);
    click(e, 'tkContinuar'); await sleep(30);
  };
  await ticket(ELLA);
  ok(/Compartido/.test(sh()) && !doc.querySelector('#cuentaChips'), 'ticket pagado por Pa: el formulario no pide «Lo pagaste desde»');
  await cerrar();
  await ticket(YO);
  ok(/Lo pagaste desde/.test(sh()), 'ticket pagado por mí: sí lo pide');
  click(e, 'pickCuenta', 'c2'); await sleep(5); H.saveMov([]); await sleep(60);
  const kt = (DB.comp.find((c) => c.importe === 12) || {}).id;
  ok(!!kt && mapa()[kt] === 'c2' && saldo('c2') === 48, 'y el ticket baja Efectivo entero (60 − 12 = 48)');
  // se borra con «Eliminar» (dos toques) para dejarlo como estaba
  H.openMovForm(['c:' + kt]); await sleep(20);
  H.deleteComp([], { getAttribute: () => '1' }); await sleep(60);
  ok(!DB.comp.some((c) => c.id === kt) && !Object.values(DB.movs).some((m) => m.compartidoId === kt), 'eliminar el ticket compartido borra el compartido y tu copia');
  ok(kt in mapa(), 'al eliminarlo se guarda su cuenta en cuentaJuntos (desde el 30/10, por si alguien lo recupera: vuelve a su cuenta)');
  ok(saldo('c2') === 60, 'quitado el ticket de prueba, Efectivo vuelve a 60');

  /* 9. «No compartir» un gasto que salió de Efectivo */
  const antes = saldo('c2');
  H.openMovForm(['c:' + k1b]); await sleep(20);
  H.compOff([]); await sleep(10);
  const marcada = (doc.querySelector('#cuentaChips .chip.active') || {}).textContent || '';
  ok(/Efectivo/.test(marcada), 'al dejar de compartir, el formulario enseña Efectivo');
  H.saveMov([]); await sleep(80);
  const suelto = Object.values(DB.movs).find((m) => m.compartidoId == null && m.categoria === 'Supermercado' && m.importe === 30);
  ok(!!suelto, 'queda como gasto tuyo de 30');
  ok(suelto && suelto.cuentaId === 'c2' && saldo('c2') === antes, 'y debería seguir en Efectivo (va a ' + (suelto && suelto.cuentaId) + '; Efectivo ' + antes + ' → ' + saldo('c2') + ')');

  /* 10. Borrar una cuenta que estaba elegida */
  H.saldarAbrir(['g1', YO, SC, '1']); await sleep(10); click(e, 'saldarCuenta', 'c2'); await H.saldarGuardar([]); await sleep(60); await cerrar();
  const liq3 = DB.comp.find((c) => c.tipo === 'Liquidación' && c.importe === 1);
  ok(mapa()[liq3.id] === 'c2', 'preparado: un pago al saldar desde Efectivo');
  H.openCuentas([]); await sleep(10);
  const iEf = A.cfg().cuentas.findIndex((c) => c.id === 'c2');
  H.cuentaQuitar([String(iEf)], { getAttribute: () => '0', setAttribute: () => {}, isConnected: true });
  await sleep(20);
  const quitada = !A.cfg().cuentas.some((c) => c.id === 'c2');
  ok(!quitada, 'quitar Efectivo debería avisar antes (tiene pagos de Juntos), pero se quita al primer toque');
  if (!quitada) H.cuentaQuitar([String(iEf)]); await sleep(20);
  ok(!A.cfg().cuentas.some((c) => c.id === 'c2'), 'Efectivo quitada');
  // Banco: 1.000 + 15 que me pagaron − 10 y − 1 pagados al saldar − 30 del gasto que dejé de compartir
  ok(saldo('c1') === 974, 'lo que era de Efectivo pasa a la principal sin romper nada (' + saldo('c1') + ')');
  await cerrar();
  H.openMovForm(['c:' + (DB.comp.find((c) => c.tipo !== 'Liquidación' && c.pagadoPor === YO) || {}).id]); await sleep(20);
  ok(!doc.querySelector('#cuentaChips'), 'con una sola cuenta ya no se pide «Lo pagaste desde»');
  await cerrar();

  /* 11. Cobros fijos con la cuenta borrada */
  S.config.cobros = [{ nombre: 'Nómina', importe: 1200, regla: { t: 'dia', dia: 1, ajuste: '' }, diaDelMes: 1, desde: hace(60), cuentaId: 'c2' }];
  await H.recSi(['cobro', '0', hoy]); await sleep(40);
  const nom = Object.values(DB.movs).find((m) => m.tipo === 'Ingreso');
  ok(!!nom && !nom.cuentaId, 'cobro fijo con la cuenta quitada: el movimiento no lleva una cuenta que ya no existe');

  /* 12. Cambiar la cuenta principal: un compartido que elegiste pagar con Banco */
  {
    const { e: e2, DB: D2 } = entorno(DOS()); await sleep(200);
    const A2 = e2.w.__APP__, sh2 = () => e2.doc.querySelector('#sheetHost').textContent, s2 = (id) => A2.saldoCuenta(A2.cfg().cuentas.find((c) => c.id === id));
    A2.H.crearIr(['compartido']); await sleep(30); A2.H.compDest(['g:g2']); await sleep(10);
    e2.doc.querySelector('#fImporte').value = '40'; e2.doc.querySelector('#fCategoria').value = 'Supermercado';
    click(e2, 'pickCuenta', 'c1'); await sleep(5); A2.H.saveMov([]); await sleep(60);
    ok(s2('c1') === 960 && s2('c2') === 100, 'compartido de 40 pagado con Banco (principal): Banco 960');
    A2.H.cuentaPrincipalSi(['1']); await sleep(30);
    ok(A2.cfg().cuentas[1].principal === true, 'Efectivo pasa a ser la principal');
    ok(s2('c1') === 960 && s2('c2') === 100, 'el compartido que elegiste pagar con Banco debería seguir en Banco (Banco ' + s2('c1') + ', Efectivo ' + s2('c2') + ')');
    A2.H.closeSheet([]); await sleep(260);
    A2.H.cuentaPrincipalSi(['0']); await sleep(30);
    ok(s2('c1') === 960, 'al volver a poner Banco como principal, todo vuelve a cuadrar');
  }

  /* 13. Una sola cuenta: no cambia nada ni se guarda nada */
  {
    const { e: e3, DB: D3 } = entorno([{ id: 'c1', nombre: 'Banco', saldo: 500, fecha: hace(40), principal: true }],
      { cobros: [{ nombre: 'Nómina', importe: 900, regla: { t: 'dia', dia: 1, ajuste: '' }, diaDelMes: 1, desde: hace(60) }] });
    await sleep(200);
    const A3 = e3.w.__APP__, H3 = A3.H, sh3 = () => e3.doc.querySelector('#sheetHost').textContent, s3 = () => A3.saldoCuenta(A3.cfg().cuentas[0]);
    H3.crearIr(['compartido']); await sleep(30); H3.compDest(['g:g2']); await sleep(10);
    ok(!e3.doc.querySelector('#cuentaChips') && !/Lo pagaste desde/.test(sh3()), 'una cuenta: el compartido no pide «Lo pagaste desde»');
    e3.doc.querySelector('#fImporte').value = '50'; e3.doc.querySelector('#fCategoria').value = 'Supermercado';
    H3.saveMov([]); await sleep(60);
    ok(D3.comp.length === 1 && !('cuentaJuntos' in e3.store.cfg.app), 'una cuenta: no se guarda «cuentaJuntos» en la configuración');
    ok(s3() === 450, 'una cuenta: el compartido baja entero de la única cuenta (450)');
    H3.closeSheet([]); await sleep(260);
    H3.saldarAbrir(['g2', ELLA, YO, '25']); await sleep(10);
    ok(!/Desde la cuenta|A la cuenta/.test(sh3()), 'una cuenta: saldar no pide cuenta');
    await H3.saldarGuardar([]); await sleep(60);
    ok(!('cuentaJuntos' in e3.store.cfg.app) && s3() === 475, 'una cuenta: el pago recibido entra (475) sin guardar nada más');
    H3.closeSheet([]); await sleep(260);
    H3.recEditar(['cobro', '0']); await sleep(10);
    ok(!/Llega a la cuenta/.test(sh3()), 'una cuenta: el cobro fijo no pide cuenta');
    H3.recGuardar([]); await sleep(30);
    ok(!('cuentaId' in e3.store.cfg.app.cobros[0]), 'una cuenta: el cobro fijo no guarda cuenta');
  }

  /* 14. Usuario nuevo sin cuentas: nada se rompe */
  {
    const { e: e4, DB: D4 } = entorno(undefined); await sleep(200);
    const A4 = e4.w.__APP__;
    A4.H.crearIr(['compartido']); await sleep(30); A4.H.compDest(['g:g2']); await sleep(10);
    e4.doc.querySelector('#fImporte').value = '10'; e4.doc.querySelector('#fCategoria').value = 'Supermercado';
    A4.H.saveMov([]); await sleep(60);
    ok(D4.comp.length === 1 && !('cuentaJuntos' in e4.store.cfg.app), 'sin cuentas: el compartido se guarda y no se apunta cuenta');
    A4.H.closeSheet([]); await sleep(260);
    A4.H.saldarAbrir(['g2', ELLA, YO, '5']); await sleep(10); await A4.H.saldarGuardar([]); await sleep(60);
    ok(D4.comp.length === 2, 'sin cuentas: saldar funciona');
  }

  /* 15. Pago fijo con cuenta, sin importe: «¿Pagado?» abre el formulario con su cuenta */
  {
    const { e: e5 } = entorno(DOS(), { facturas: [{ nombre: 'Gimnasio', regla: { t: 'dia', dia: 1, ajuste: '' }, diaDelMes: 1, desde: hace(60), cuentaId: 'c2', categoria: 'Supermercado' }] });
    await sleep(200);
    const A5 = e5.w.__APP__;
    A5.H.recEditar(['factura', '0']); await sleep(10);
    ok(/Sale de la cuenta/.test(e5.doc.querySelector('#sheetHost').textContent) && /Efectivo/.test(e5.doc.querySelector('#recCuentas .chip.active').textContent), 'pago fijo: «Sale de la cuenta» con Efectivo');
    A5.H.closeSheet([]); await sleep(260);
    await A5.H.recSi(['factura', '0', hoy]); await sleep(30);
    ok(/Efectivo/.test((e5.doc.querySelector('#cuentaChips .chip.active') || {}).textContent || ''), 'sin importe previsto, el formulario sale con Efectivo marcado');
    A5.H.closeSheet([]); await sleep(260);
    // un gasto tuyo pagado en Efectivo que luego compartes: el compartido sigue en Efectivo
    A5.H.crearIr(['gasto']); await sleep(20);
    e5.doc.querySelector('#fImporte').value = '18'; e5.doc.querySelector('#fCategoria').value = 'Supermercado';
    click(e5, 'pickCuenta', 'c2'); await sleep(5); A5.H.saveMov([]); await sleep(60);
    const mid = A5.S.movimientos.find((m) => m.importe === 18).id;
    A5.H.openMovForm([mid]); await sleep(20); A5.H.compOn([]); await sleep(10); A5.H.compDest(['g:g2']); await sleep(10);
    ok(/Lo pagaste desde/.test(e5.doc.querySelector('#sheetHost').textContent) && /Efectivo/.test(e5.doc.querySelector('#cuentaChips .chip.active').textContent), 'compartir un gasto que era de Efectivo: sale Efectivo marcado');
    A5.H.saveMov([]); await sleep(60);
    const kc = (A5.S.compartidos[0] || {}).id;
    ok(!!kc && (e5.store.cfg.app.cuentaJuntos || {})[kc] === 'c2' && A5.saldoCuenta(A5.cfg().cuentas[1]) === 82, 'y el compartido sigue bajando Efectivo entero (82)');
  }
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH', x); process.exit(1); });

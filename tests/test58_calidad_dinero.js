// Calidad · Dinero v2 (18/10/2026): casos raros de «Lo que tienes», metas (sin objetivo, compartidas, valor negativo por usos),
// Aportar (doble toque, importes con punto de miles), deudas (mismo nombre en mayúsculas, sin nombre, renombrar dos veces,
// «Ya pagado» > total, cuadrar, eliminar y deshacer), inversiones sin precio, asistente, «Antes» y usuario nuevo. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoy = new Date(), ym = hoy.toISOString().slice(0, 7), HOY = hoy.toISOString().slice(0, 10);
const RARO = /NaN|undefined|null|Infinity|1 meses/;
async function abrir(cfgApp, movs, extra) {
  const e = makeEnv(Object.assign({ cfg: { app: Object.assign({ categoriasGasto: [{ nombre: 'X' }] }, cfgApp), meta: { onboarded: true } }, movs: movs || [] }, extra || {})); await sleep(80);
  const A = e.w.__APP__, doc = e.doc;
  e.A = A; e.S = A.S;
  e.txt = () => doc.querySelector('#content').textContent.replace(/\s+/g, ' ');
  e.sh = () => ((doc.querySelector('#sheetHost') || {}).textContent || '').replace(/\s+/g, ' ');
  e.toast = () => (doc.querySelector('#toast') || {}).textContent || '';
  e.editar = async (orig, campos) => { A.H.deudaEditar([orig]); await sleep(10); for (const k in campos) doc.querySelector(k).value = campos[k]; await A.H.deudaGuardar([]); await sleep(20); return e.toast(); };
  e.nueva = async (campos) => { A.H.deudaNueva([]); await sleep(10); for (const k in campos) doc.querySelector(k).value = campos[k]; await A.H.deudaGuardar([]); await sleep(20); return e.toast(); };
  A.H.goTab(['dinero']); await sleep(30);
  return e;
}
(async () => {
  /* ---------- 1. «Lo que tienes» ---------- */
  {
    const e = await abrir({ cuentas: [{ id: 'k1', nombre: 'Banco', saldo: 2000, fecha: ym + '-01', principal: true }], ahorro: [{ id: 'm1', nombre: 'Colchón', objetivo: 3000, yaAhorrado: 500 }], deudas: [{ nombre: 'Coche', objetivo: 1000 }] },
      [{ id: 'a1', tipo: 'Ahorro', categoria: 'Colchón', metaId: 'm1', importe: 300, fecha: HOY, creadoEn: Date.now() }]);
    const p = e.A.patrimonio();
    ok(p.ahorroDentro && Math.abs(p.total - (2000 - 1000)) < 0.01, 'con cuentas: Lo que tienes = cuentas − deudas; lo apartado (800) no se suma otra vez');
    ok(e.S.movimientos.length && e.A.saldoCuenta(e.A.cfg().cuentas[0]) === 2000, 'apartar no cambia el saldo del banco');
    ok(/800 €|800,00 €/.test(e.txt()) && /apartados para tus metas/.test(e.txt()), 'se dice cuánto de tus cuentas está apartado (800 €)');
    const sin = await abrir({ ahorro: [{ id: 'm1', nombre: 'Colchón', objetivo: 3000, yaAhorrado: 500 }] });
    const ps = sin.A.patrimonio();
    ok(!ps.ahorroDentro && Math.abs(ps.total - 500) < 0.01, 'sin cuentas: lo apartado sí se suma (500)');
    // cuenta con nombre pero sin saldo: lo apartado deja de contar y «En cuentas» dice 0
    const ns = await abrir({ cuentas: [{ id: 'k1', nombre: 'Banco' }], ahorro: [{ id: 'm1', nombre: 'Colchón', objetivo: 3000, yaAhorrado: 500 }] });
    ok(Math.abs(ns.A.patrimonio().total - 500) < 0.01, '[leve] cuenta sin saldo puesto: «Lo que tienes» no debería perder los 500 € apartados (da ' + ns.A.patrimonio().total + ')');
  }

  /* ---------- 2. Metas raras ---------- */
  {
    const e = await abrir({ cuentas: [{ id: 'k1', nombre: 'Banco', saldo: 1000, fecha: ym + '-01', principal: true }],
      ahorro: [{ id: 'm1', nombre: 'Moto', objetivo: 100, usos: [{ id: 'u1', importe: 50, fecha: HOY }] }, { id: 'm2', nombre: 'Sin cantidad' }, { id: 'm3', nombre: 'Pasada', objetivo: 500, fechaObjetivo: '2025-01-31' }, { nombre: 'Antigua sin id', objetivo: 200 }] });
    const t = e.txt();
    ok(!RARO.test(t), 'metas sin objetivo, con fecha pasada o sin id: sin NaN/undefined en pantalla');
    ok(/Sin cantidad que juntar/.test(t) && /La fecha pasó · faltan 500 €/.test(t), 'textos: «Sin cantidad que juntar» y «La fecha pasó · faltan 500 €»');
    for (const v of [1, 2]) { e.S.verAnterior = { dinero: v, importe: 1 }; e.A.render(); await sleep(10); ok(!RARO.test(e.txt()), 'variante ' + ['', 'Tarros', 'Anillos'][v] + ' sin cifras raras'); }
    e.S.verAnterior = { importe: 1, dinero: 4 }; e.A.render(); await sleep(10);
    ok(!/-\d+ %/.test(e.txt()), '[leve] meta con más usado que aportado: no debería verse un porcentaje negativo («-50 %»)');
    e.A.H.metaAportarR(['m1']); await sleep(20); e.A.H.aportarRImp(['100']); await sleep(10);
    ok(!/la consigues/.test(e.sh()), '[medio] meta en −50 €: aportar 100 € de 100 € no debería decir «¡la consigues!» (quedaría en 50 €). Dice: ' + (e.sh().match(/[-\d]+ % → [^F]*/) || [''])[0]);
    await e.A.H.aportarRGuardar([]); await sleep(40);
    ok(!/Meta conseguida/.test(e.toast()), '[medio] …ni «¡Meta conseguida! 🎉» con confeti');
    // doble toque
    const n0 = Object.keys(e.store.movimientos).length;
    e.A.H.metaAportarR(['m3']); await sleep(20); e.A.H.aportarRImp(['10']); await sleep(10);
    const p1 = e.A.H.aportarRGuardar([]), p2 = e.A.H.aportarRGuardar([]); await p1; await p2; await sleep(40);
    ok(Object.keys(e.store.movimientos).length === n0 + 1, 'doble toque en «Aportar»: un solo movimiento');
    // importe con punto de miles
    e.A.H.metaAportarR(['m3']); await sleep(20);
    const inp = e.doc.querySelector('#apImporte'); inp.value = '1.000'; inp.dispatchEvent(new e.w.Event('input', { bubbles: true })); await sleep(10);
    ok(/1\.000,00 €/.test(e.sh()), '[grave] Aportar «1.000» se lee como 1,00 €; debería ser 1.000 € (botón: «' + ((e.doc.querySelector('#apGuardar') || {}).textContent || '') + '»)');
    e.A.H.closeSheet([]); await sleep(260);
  }

  /* ---------- 3. Meta compartida ---------- */
  {
    const e = await abrir({}, [], { session: { user: { id: 'u1', email: 't@t.com' } } });
    const llamadas = [];
    e.S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', miembros: [{ userId: 'u1', nombre: 'Yo' }, { userId: 'u2', nombre: 'Otra' }] }];
    e.S.objetivos = [{ id: 'o1', tipo: 'ahorro', grupoId: 'g1', nombre: 'Viaje juntos', objetivo: 1000 }];
    e.S.db.aportes = { guardar: async (x) => { llamadas.push(x); return { id: 'ap1', objetivo_id: x.objetivoId, user_id: 'u1', mov_id: x.movId, fecha: x.fecha, tipo: x.tipo, importe: x.importe }; }, quitar: async () => {} };
    e.A.render(); await sleep(10);
    ok(/Viaje juntos/.test(e.txt()), 'la meta compartida sale en Metas');
    e.A.H.metaAportarR(['g:o1']); await sleep(20); e.A.H.aportarRImp(['100']); await sleep(10);
    ok(/0 % → 10 %/.test(e.sh()), 'Aportar a la compartida: «0 % → 10 %»');
    await e.A.H.aportarRGuardar([]); await sleep(40);
    const mv = Object.values(e.store.movimientos).find((m) => m.tipo === 'Ahorro');
    ok(mv && mv.metaId === 'g:o1' && llamadas.length === 1 && llamadas[0].objetivoId === 'o1' && llamadas[0].importe === 100, 'se crea un Apartar con metaId «g:o1» y su aporte en la meta compartida');
  }

  /* ---------- 4. Deudas ---------- */
  {
    const e = await abrir({ deudas: [{ nombre: 'Tele', objetivo: 600 }, { nombre: 'tele ', objetivo: 300 }, { nombre: '' }, null, { nombre: 'Préstamo', objetivo: 1000, previo: 1200 }, { nombre: 'Moto', objetivo: 1000, cuotaMes: 0, fechaObjetivo: '2020-05-31' }] },
      [{ id: 'p1', tipo: 'Deuda', categoria: 'Moto', importe: 100, fecha: ym + '-01' }]);
    ok(!RARO.test(e.txt()), 'deudas sin nombre, nulas, «Ya pagado» > total o cuota 0: sin cifras raras');
    ok(e.A.deudaEstado2(e.A.deudaStats(e.A.cfg().deudas[4])).t === '¡Saldada!' && e.A.patrimonio().deudas === 600 + 300 + 900, '«Ya pagado» mayor que el total: saldada y no resta de más');
    // dos deudas antiguas con el mismo nombre salvo mayúsculas/espacios (se podían crear antes)
    e.A.H.deudaVer(['tele ']); await sleep(10);
    ok(/300,00 €/.test(e.sh()) && !/600,00 €/.test(e.sh()), '[medio] dos deudas «Tele» y «tele »: tocar la segunda debería abrir la suya (300 €), abre la otra (600 €)');
    e.A.H.deudaMasMenu([]); await sleep(10);
    const bt = e.doc.querySelector('[data-click^="deudaEliminar"]'); bt.click(); bt.click(); await sleep(40);
    ok(e.A.cfg().deudas.some((d) => d && d.nombre === 'Tele'), '[medio] …y «Eliminar» desde la segunda borra la primera («Tele», 600 €)');
  }
  {
    const e = await abrir({ deudas: [{ nombre: 'A', objetivo: 1000 }, { nombre: 'Otra', objetivo: 500 }] },
      [{ id: 'p1', tipo: 'Deuda', categoria: 'A', importe: 100, fecha: ym + '-01' }]);
    // números
    await e.editar('A', { '#dTotal': '8.000' });
    ok(e.A.cfg().deudas[0].objetivo === 8000, '[grave] total «8.000» se guarda como ' + e.A.cfg().deudas[0].objetivo + ' €; debería ser 8.000 €');
    await e.editar('A', { '#dTotal': '1.234,56' });
    ok(e.A.cfg().deudas[0].objetivo === 1234.56, '[grave] total «1.234,56» se guarda como ' + e.A.cfg().deudas[0].objetivo + ' €');
    await e.editar('A', { '#dTotal': '1000', '#dCuota': '-5' });
    ok(e.A.cfg().deudas[0].cuotaMes == null && /tienen que ser números/.test(e.toast()), '«Al mes» negativo no se guarda');
    await e.editar('A', { '#dCuota': '5abc' });
    ok(e.A.cfg().deudas[0].cuotaMes == null, '[leve] «Al mes» = «5abc» se acepta como 5; debería pedir un número');
    await e.editar('A', { '#dCuota': '' });
    await e.editar('A', { '#dPrevio': '1500' });
    ok(/no puede ser más que el total/.test(e.toast()) && e.A.cfg().deudas[0].previo == null, '«Ya pagado» mayor que el total: no se guarda');
    ok(typeof e.A.cfg().deudas[0].objetivo === 'number' && e.A.cfg().deudas[0].cuotaMes === null, 'los números se guardan como número o vacío, nunca como texto');
    // renombrar dos veces y volver
    await e.editar('A', { '#dNombre': 'B' }); await e.editar('B', { '#dNombre': 'C' });
    let d = e.A.cfg().deudas[0];
    ok(d.nombre === 'C' && (d.nombresAntes || []).join() === 'A,B' && e.A.deudaStats(d).pagado === 100 && e.A.cfg().deudas.length === 2, 'renombrar dos veces (A → B → C): guarda A y B y no pierde el pago');
    e.A.H.deudaVer(['C']); await sleep(10);
    ok(/Últimos pagos/.test(e.sh()), 'la hoja enseña el pago hecho con el nombre antiguo');
    e.A.H.irMovsDeuda(['C']); await sleep(30);
    ok(/100,00/.test(e.txt()), '[leve] «Ver todos» los pagos tras renombrar: no salen los apuntados con el nombre antiguo');
    e.A.H.goTab(['dinero']); await sleep(20);
    // mismo nombre con mayúsculas/espacios, o nombre antiguo
    ok(/Ya tienes una deuda/.test(await e.nueva({ '#dNombre': '  OTRA ', '#dTotal': '10' })) && e.A.cfg().deudas.length === 2, 'nueva «  OTRA » choca con «Otra»');
    ok(/Ya tienes una deuda/.test(await e.nueva({ '#dNombre': 'b', '#dTotal': '10' })) && e.A.cfg().deudas.length === 2, 'nueva «b» choca con el nombre antiguo de «C»');
    ok(/Ya tienes una deuda/.test(await e.editar('Otra', { '#dNombre': 'a' })), 'renombrar «Otra» a «a» (nombre antiguo de otra) se impide');
    // doble toque al guardar
    e.A.H.deudaNueva([]); await sleep(10); e.doc.querySelector('#dNombre').value = 'Doble'; e.doc.querySelector('#dTotal').value = '10';
    const g1 = e.A.H.deudaGuardar([]), g2 = e.A.H.deudaGuardar([]); await g1; await g2; await sleep(30);
    ok(e.A.cfg().deudas.filter((x) => x && x.nombre === 'Doble').length === 1, 'doble toque en «Guardar deuda»: una sola');
    // cuadrar
    e.A.H.deudaCuadrar(['Otra']); await sleep(10); e.doc.querySelector('#dqBanco').value = '2.500'; await e.A.H.deudaCuadrarOk([]); await sleep(20);
    const o = e.A.cfg().deudas.find((x) => x && x.nombre === 'Otra');
    ok(/subiremos el total/.test(e.sh()) && !o.previo, '[grave] cuadrar «2.500» (más de lo que queda) debería pedir confirmación; lo lee como 2,50 € y guarda «Ya pagado» ' + o.previo);
    e.A.H.deudaCuadrar(['Doble']); await sleep(10); e.doc.querySelector('#dqBanco').value = '-5'; await e.A.H.deudaCuadrarOk([]); await sleep(20);
    ok(/Pon lo que te queda/.test(e.toast()), 'cuadrar con un número negativo no se acepta');
    // eliminar, editar otra cosa y deshacer
    e.A.H.deudaVer(['Doble']); await sleep(10); e.A.H.deudaMasMenu([]); await sleep(10);
    const bt = e.doc.querySelector('[data-click^="deudaEliminar"]'); bt.click(); bt.click(); await sleep(40);
    const deshacer = e.doc.querySelector('#toast .toast-btn');
    await e.editar('Otra', { '#dTotal': '777' });
    if (deshacer) { deshacer.click(); await sleep(40); }
    ok(e.A.cfg().deudas.some((x) => x && x.nombre === 'Doble') && e.A.cfg().deudas.find((x) => x && x.nombre === 'Otra').objetivo === 777, 'eliminar → editar otra → deshacer: vuelve la borrada y no se pierde la otra edición');
    // eliminar, crear otra con el mismo nombre y deshacer: no se duplica
    e.A.H.deudaVer(['Doble']); await sleep(10); e.A.H.deudaMasMenu([]); await sleep(10);
    const bt2 = e.doc.querySelector('[data-click^="deudaEliminar"]'); bt2.click(); bt2.click(); await sleep(40);
    const deshacer2 = e.doc.querySelector('#toast .toast-btn');
    await e.nueva({ '#dNombre': 'doble', '#dTotal': '20' });
    if (deshacer2) { deshacer2.click(); await sleep(40); }
    ok(e.A.cfg().deudas.filter((x) => x && normN(x.nombre) === 'doble').length === 1, 'deshacer cuando ya hay otra con ese nombre: no se duplica');
    ok(Object.keys(e.store.movimientos).length === 1, 'ninguna acción de deudas crea, cambia ni borra movimientos');
  }

  /* ---------- 5. Bienvenida (desde el 19/10/2026 ya no edita deudas): repetirla no las toca ---------- */
  {
    const e = await abrir({ deudas: [{ id: 'd1', nombre: 'Coche', objetivo: 5000, previo: 1000, cuotaMes: 150 }] }, [{ id: 'p1', tipo: 'Deuda', categoria: 'Coche', importe: 200, fecha: ym + '-01' }]);
    const antes = JSON.stringify(e.store.cfg.app.deudas);
    e.A.H.startOnboardingManually([]); await sleep(10);
    await e.A.H.obFinish(['']); await sleep(40);
    ok(JSON.stringify(e.store.cfg.app.deudas) === antes && e.A.deudaStats(e.store.cfg.app.deudas[0]).pagado === 1200, 'repetir la bienvenida no cambia las deudas ni sus pagos');
  }

  /* ---------- 6. Inversiones sin precio / sin activo ---------- */
  {
    const e = await abrir({}, [{ id: 'i1', tipo: 'Inversión', categoria: 'Fondo A', activoId: 'ac1', participaciones: 10, importe: 1000, fecha: ym + '-01' },
      { id: 'i2', tipo: 'Inversión', categoria: 'Cripto', importe: 200, fecha: ym + '-01' }]);
    e.S.valoracion = { ts: Date.now(), valores: { ac1: { cierre_eur: 110, cierre: 110, moneda: 'EUR', fecha_precio: ym + '-01' } } };
    e.A.render(); await sleep(10);
    ok(!RARO.test(e.txt()) && /sin precio todavía/i.test(e.txt()), 'un activo sin precio: «sin precio todavía», sin cifras raras');
    const inv = e.A.patrimonio().inv, has = (e.txt().match(/Has metido\s*([\d.,]+)/) || [])[1];
    ok(!has || Math.round(inv) === Math.round(parseFloat(has.replace(/\./g, '').replace(',', '.'))), '[leve] la ficha «Invertido» (' + Math.round(inv) + ' €) y el bloque «Has metido» (' + has + ' €) dicen cifras distintas en la misma pantalla');
    e.A.H.dmVer(['inversiones']); await sleep(20);
    ok(!RARO.test(e.txt()) && /falta elegir el activo/.test(e.txt()), '«Ver todo» con un activo sin elegir: aviso y sin cifras raras');
    let crash = null; try { e.A.H.dmPrecios([]); await sleep(10); } catch (x) { crash = x; }
    ok(!crash && /sin precio/.test(e.sh()), '«De dónde salen los precios» con un activo sin precio');
    e.A.H.closeSheet([]); await sleep(260);
    // sin ninguna valoración todavía
    e.S.valoracion = null; e.A.H.dmVer(['inversiones']); await sleep(20);
    ok(!RARO.test(e.txt()), '«Ver todo» antes de tener precios: sin cifras raras');
  }

  /* ---------- 7. «Antes» y usuario nuevo ---------- */
  {
    const e = await abrir({ deudas: [{ nombre: 'Coche', objetivo: 8000 }], ahorro: [{ id: 'm1', nombre: 'Colchón', objetivo: 3000 }] });
    e.S.verAnterior = { dinero: 3, importe: 1 }; e.A.render(); await sleep(10);
    ok(!!e.doc.querySelector('.chips-nav') && /Gestionar metas/.test(e.txt()), '«Antes»: la pantalla de siempre, con pestañas');
    e.A.H.openListEditor(['deudas']); await sleep(20);
    ok(/Deudas/.test(e.sh()) && e.S.tab === 'dinero', '«Antes»: Tú → Deudas sigue abriendo la lista de siempre');
    e.A.H.closeSheet([]); await sleep(260);
    const z = await abrir({});
    ok(/Empieza por aquí/.test(z.txt()) && !RARO.test(z.txt()), 'usuario nuevo: «Empieza por aquí» sin cifras raras');
    z.A.H.dmComo([]); await sleep(10);
    ok(!RARO.test(z.sh()), 'usuario nuevo: «¿Cómo se calcula?» sin cifras raras');
  }
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });
function normN(x) { return String(x || '').trim().toLowerCase(); }

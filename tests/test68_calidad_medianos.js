// Calidad · revisión de los cambios medianos (22/10/2026): importe escrito con coma en todos sus caminos,
// día vacío del calendario y tareas de «Próximos 7 días». Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 },
    movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Supermercado', importe: 7.08, fecha: '2026-10-01' }, { id: 'dv', tipo: 'Gasto', categoria: 'Compras', importe: -19.99, fecha: '2026-10-02' }, { id: 'mg', tipo: 'Gasto', categoria: 'Compras', importe: 1234.5, fecha: '2026-10-03' }],
    cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Compras' }], cuentas: [{ id: 'c1', nombre: 'Banco A', saldo: 100, ts: 1 }, { id: 'c2', nombre: 'Banco B', saldo: 50, ts: 1 }] }, meta: { onboarded: true } } });
  await sleep(120);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, hoy = A.todayISO();
  const sheet = (q) => doc.querySelector('#sheetHost ' + q);
  const movs = () => Object.values(e.store.movimientos);
  const cerrar = async () => { H.closeSheet([]); await sleep(300); };
  // escribir un importe en un gasto nuevo y guardar; devuelve el movimiento creado (o null)
  const nuevo = async (txt, desc) => {
    H.crearIr(['gasto']); await sleep(20);
    sheet('#fImporte').value = txt; H.pickCat(['Supermercado']); sheet('#fDesc').value = desc;
    await H.saveMov([]); await sleep(40);
    const m = movs().find((x) => x.descripcion === desc) || null; await cerrar(); return m;
  };

  /* 1. formas de escribir el importe */
  let m = await nuevo('8.000', 'imp-miles'); ok(m && m.importe === 8000, '«8.000» se guarda como 8000 (punto de miles)');
  m = await nuevo('1.234,56', 'imp-mixto'); ok(m && Math.abs(m.importe - 1234.56) < 1e-9, '«1.234,56» se guarda como 1234,56');
  m = await nuevo('12.5', 'imp-punto'); ok(m && m.importe === 12.5, '«12.5» (punto decimal) se guarda como 12,5');
  m = await nuevo(' 3,40 € ', 'imp-euro'); ok(m && m.importe === 3.4, '« 3,40 € » con espacios y símbolo se guarda como 3,4');
  m = await nuevo('-12,5', 'imp-neg'); ok(m && m.importe === -12.5, 'devolución «-12,5» se guarda en negativo');
  const n0 = movs().length;
  m = await nuevo('abc', 'imp-mal'); ok(!m && movs().length === n0, 'un importe que no es número no se guarda');
  m = await nuevo('0,00', 'imp-cero'); ok(!m && movs().length === n0, 'un importe 0 no se guarda');

  /* 2. editar y duplicar enseñan el importe con coma, también en negativo */
  H.openMovForm(['dv']); await sleep(20);
  ok(sheet('#fImporte').value === '-19,99', 'editar una devolución: sale «-19,99»');
  await H.saveMov([]); await sleep(40);
  ok(e.store.movimientos.dv.importe === -19.99, 'guardar sin tocar no cambia el importe de la devolución');
  await cerrar();
  H.movDuplicar(['m1']); await sleep(20);
  ok(sheet('#fImporte') && sheet('#fImporte').value === '7,08' && /Nuevo gasto/.test(sheet('#movFormTit').textContent), 'duplicar: el nuevo sale con «7,08»');
  await cerrar();
  // número sin decimales y número largo: sin «.» que confunda
  H.openMovForm(['mg']); await sleep(20);
  ok(sheet('#fImporte').value === '1234,5', 'un importe de 1234,5 sale «1234,5»');
  await cerrar();

  /* 3. traspaso entre cuentas con coma */
  H.openTraspaso([]); await sleep(20);
  ok(sheet('#fImporte') && sheet('#fImporte').type === 'text', 'traspaso: el importe es un campo de texto');
  sheet('#fImporte').value = '1.250,75'; H.pickTrasCuenta(['desde', 'c1']); H.pickTrasCuenta(['a', 'c2']); await sleep(5);
  await H.saveTraspaso([]); await sleep(40);
  const tr = movs().find((x) => x.tipo === 'Traspaso') || (S.traspasos || [])[0];
  ok(tr && Math.abs(tr.importe - 1250.75) < 1e-9, 'traspaso «1.250,75» se guarda como 1250,75');
  await cerrar();

  /* 4. borrador: crear una meta a mitad de un apunte y volver no cambia el importe escrito */
  H.crearIr(['ahorro']); await sleep(20);
  if (sheet('#fImporte')) {
    sheet('#fImporte').value = '1.500';
    H.metaNuevaForm([]); await sleep(20);
    H.openMetas([]); await sleep(20);
    const v = sheet('#fImporte') ? sheet('#fImporte').value : null;
    ok(v === '1.500' || v === '1500', 'borrador: escribes «1.500», vas a «Nueva meta» y vuelves: sigue siendo 1500 (sale «' + v + '»)');
  } else ok(false, 'borrador: no se abre el formulario de Apartar');
  await cerrar();

  /* 5. calendario de Movimientos: día pasado vacío con botón; día futuro sin botón */
  H.goTab(['movimientos']); H.setMovVista(['calendario']); await sleep(10);
  const ayer = A.uAdd(hoy, -1), manana = A.uAdd(hoy, 1);
  if (!movs().some((x) => (x.fecha || '').slice(0, 10) === ayer)) {
    H.movCalDia([ayer]); await sleep(10);
    const b = doc.querySelector('[data-click^="gastoEnDia"]'); ok(!!b, 'calendario: un día pasado vacío ofrece «Apuntar un gasto este día»');
    if (b) { b.click(); await sleep(20); ok(sheet('#fFecha') && sheet('#fFecha').value === ayer, '…y el gasto sale con ese día'); await cerrar(); }
  }
  if (A.uAdd(hoy, 1).slice(0, 7) === hoy.slice(0, 7)) {
    H.movCalDia([manana]); await sleep(10);
    ok(!doc.querySelector('[data-click^="gastoEnDia"]') && /aún no ha llegado/.test(doc.querySelector('#content').textContent), 'calendario: un día futuro no ofrece apuntar');
  }

  /* 6. Agenda · «Próximos 7 días»: la casilla completa la tarea (sin abrirla) */
  S.tareas = [{ id: 'tq', nombre: 'Recoger paquete', estado: 'Pendiente', prioridad: 'Media', fechaLimite: A.uAdd(hoy, 3) }];
  e.store.tareas.tq = Object.assign({}, S.tareas[0]);
  H.goTab(['inicio']); H.setInicioVista(['tareas']); H.agendaDia([hoy]); await sleep(10);
  const fila = [...doc.querySelectorAll('#content .row')].filter((r) => /Recoger paquete/.test(r.textContent));
  ok(fila.length === 1, 'Próximos 7 días: la tarea sale una sola vez');
  const chk = fila[0] && fila[0].querySelector('.check-btn');
  if (chk) { chk.click(); await sleep(60); }
  ok(e.store.tareas.tq && e.store.tareas.tq.estado === 'Completado' && !sheet('#tfNombre'), 'Próximos 7 días: tocar la casilla la marca como hecha');

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

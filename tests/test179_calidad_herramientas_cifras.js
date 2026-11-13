// 13/11/2026 · Calidad: apagar herramientas en «Mis herramientas» NO cambia ninguna cifra (solo lo que se ve).
// «Lo que tienes», el saldo de las cuentas (con lo que dice Juntos), las cifras del mes y lo que cuenta Inicio deben
// ser idénticos con todo encendido y con Juntos, Deudas, Metas, Inversiones y Presupuestos apagados.
// Y la barra de abajo con 3 pestañas sigue teniendo el + en medio de la lista. Solo datos inventados.
const T = require('./toques_comun.js');
const { abrir, tocar, buscar, pantalla, app, ir, ok, paso, fin, sleep, hoy, diasAtras } = T;
T.fallosConocidos([]);
const YO = 'u-yo';
(async () => {
  const C = (id, pag, imp, rep, dias) => ({ id, grupoId: 'g1', fecha: diasAtras(dias), tipo: 'Gasto', categoria: 'Casa', descripcion: 'Compra ' + id, importe: imp, pagadoPor: pag, reparto: rep, modo: 'igual', creadoPor: pag, createdAt: diasAtras(dias) + 'T10:00:00.000Z' });
  const e = await abrir({ version: { tu: 0, crear: 0 },
    cfg: { app: { nombre: 'Prueba', compararVersiones: false, categoriasGasto: [{ nombre: 'Ocio', presupuesto: 50 }, { nombre: 'Casa' }],
      cuentas: [{ id: 'c1', nombre: 'Banco A', saldo: 1000, fecha: diasAtras(40), principal: true }, { id: 'c2', nombre: 'Banco B', saldo: 200, fecha: diasAtras(40) }],
      ahorro: [{ nombre: 'Viaje', objetivo: 900, yaAhorrado: 120 }], deudas: [{ nombre: 'Coche', objetivo: 3000, previo: 500 }] }, meta: { onboarded: true } },
    grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', edicion: 'todos', created_at: '2026-01-01', creado_por: YO }],
    miembros: [{ grupo_id: 'g1', user_id: YO, nombre: 'Prueba', rol: 'admin' }, { grupo_id: 'g1', user_id: 'u-ana', nombre: 'Ana', rol: 'miembro' }],
    comp: [C('k1', YO, 60, { [YO]: 30, 'u-ana': 30 }, 3), C('k2', 'u-ana', 20, { [YO]: 10, 'u-ana': 10 }, 2)],
    movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Ocio', importe: 70, fecha: hoy(), cuentaId: 'c1' },
      { id: 'm2', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: diasAtras(1), cuentaId: 'c1' },
      { id: 'm3', tipo: 'Inversión', categoria: 'Fondos', importe: 300, fecha: diasAtras(5), cuentaId: 'c1' },
      { id: 'm4', tipo: 'Deuda', categoria: 'Coche', importe: 150, fecha: diasAtras(6), cuentaId: 'c2' },
      { id: 'm5', tipo: 'Ahorro', categoria: 'Viaje', importe: 80, fecha: diasAtras(4) }] });
  const A = e.A, S = e.S, doc = e.doc;
  await sleep(150);
  const cifras = () => {
    const d = new Date(), p = A.patrimonio();
    const cs = A.cfg().cuentas || [];
    return JSON.stringify({ total: p.total, banco: p.banco, inv: p.inv, deudas: p.deudas, ahorro: p.ahorro,
      kpis: A.kpisMes(A.mesActual ? A.mesActual().y : d.getFullYear(), A.mesActual ? A.mesActual().m : d.getMonth() + 1),
      saldos: cs.map((c) => A.saldoCuenta(c)), juntos: cs.map((c) => A.compartidosCuenta(c)), tengo: A.enTusCuentas(), mio: A.miSaldo('g1') });
  };
  const lqt = async () => { await ir(e, 'dinero'); const b = doc.querySelector('#content .dm3-lqt-v, #content .dm-lqt-v, #content .pat-mini b'); return b ? b.textContent : '(sin cifra)'; };

  paso('Con todo encendido');
  const antes = cifras(), lqtAntes = await lqt();
  ok(A.miSaldo('g1') !== 0, 'hay saldo en Juntos (para que la prueba tenga sentido): ' + A.miSaldo('g1'));
  ok(JSON.parse(antes).deudas > 0 && JSON.parse(antes).inv > 0, 'hay deudas e inversiones que cuentan en «Lo que tienes»');

  paso('Apagar Juntos, Deudas, Metas, Inversiones y Presupuestos');
  await ir(e, 'tu'); await tocar(e, 'tuIr', 'Mis herramientas', 'app');
  for (const n of ['Juntos', 'Deudas', 'Metas de ahorro', 'Inversiones', 'Presupuestos']) await tocar(e, 'herrCambiar', n, 'app');
  ok(['juntos', 'deudas', 'metas', 'inversiones', 'presupuestos'].every((k) => !A.herrOn(k)), 'las cinco, apagadas');
  const despues = cifras(), lqtDespues = await lqt();
  ok(despues === antes, 'las cifras (Lo que tienes, saldos con Juntos, cifras del mes) no cambian al apagar' + (despues === antes ? '' : '\n  antes ' + antes + '\n  después ' + despues));
  ok(lqtDespues === lqtAntes, '«Lo que tienes» en Dinero enseña lo mismo (' + lqtAntes + ' → ' + lqtDespues + ')');

  paso('Barra de abajo con Juntos apagado');
  const hijos = [...doc.querySelectorAll('.tabbar > *')].map((b) => b.classList.contains('tab-crear') ? '+' : b.getAttribute('data-tab'));
  ok(hijos.join() === 'inicio,movimientos,+,agenda,dinero', 'barra: Inicio, Movimientos, +, Agenda, Dinero: el + en medio y la Agenda en el hueco de Juntos (' + hijos.join() + ')');
  ok(doc.querySelector('#tbAgenda').hidden, 'el botón de la Agenda de arriba se esconde (ya está abajo)');
  A.H.onFab([]); await sleep(60);
  ok(!buscar(e, 'crearIr', 'Compartido', 'hoja') && !!buscar(e, 'crearIr', 'Gasto', 'hoja'), 'el + abre sin «Compartido» y con «Gasto»');
  await T.cerrarHoja(e);

  paso('Encender otra vez');
  await ir(e, 'tu'); await tocar(e, 'tuIr', 'Mis herramientas', 'app');
  for (const n of ['Juntos', 'Deudas', 'Metas de ahorro', 'Inversiones', 'Presupuestos']) await tocar(e, 'herrCambiar', n, 'app');
  ok(cifras() === antes, 'las cifras siguen igual al encender');
  ok(Object.keys(app(e).herramientas || {}).length === 0, 'config.herramientas vuelve a quedar vacía');
  fin('herramientas_cifras');
})();

// 12/11/2026 · Avisos de la app por niveles (docs/40 C2): importantes, normales y resumen; silencio, máximo 3 al día,
// agrupar, y avisos al momento (presupuesto, meta) una sola vez. El lado Android se simula. Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const dia = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
(async () => {
  const reg = { programar: [], ahora: [] };
  const pre = (w) => { w.__nativo = { android: true, notif: { permiso: async () => 'granted', pedir: async () => 'granted',
    programar: async (l) => { reg.programar.push(l); return l.length; }, ahora: async (l) => { reg.ahora.push(...l); return l.length; } } }; };
  const manana = dia(1), dm = Number(manana.slice(8, 10));
  const cfg = { app: { compararVersiones: false, cuentas: [{ id: 'c1', nombre: 'Cuenta Uno', banco: 'santander', saldo: 20, saldoFecha: dia(-1) }],
    facturas: [{ nombre: 'Luz', importe: 60, diaDelMes: dm, cuentaId: 'c1' }, { nombre: 'Internet', importe: 30, diaDelMes: dm }, { nombre: 'Gimnasio', importe: 25, diaDelMes: dm }],
    categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 100 }, { nombre: 'Ocio', presupuesto: 50 }] }, meta: { onboarded: true } };
  const hoy = dia(0);
  const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 }, pre, cfg,
    movs: [{ id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 85, fecha: hoy, descripcion: 'Súper' }] });
  ['t1', 't2', 't3', 't4'].forEach((id, i) => { e.store.tareas[id] = { nombre: 'Tarea ' + (i + 1), estado: 'Pendiente', fechaLimite: dia(3), prioridad: 'Media' }; });
  await e.w.__APP__.main(); await sleep(2300);
  const A = e.w.__APP__, lista = reg.programar[reg.programar.length - 1] || [];
  const imp = lista.filter((x) => x.nivel === 'importante');
  ok(imp.length === 1 && /Luz/.test(imp[0].titulo) && /Cuenta Uno/.test(imp[0].texto), 'importante: mañana se paga la Luz y en su cuenta no hay bastante (' + JSON.stringify(imp.map((x) => x.titulo)) + ')');
  const fij = lista.find((x) => x.nivel === 'normal' && /3 pagos fijos/.test(x.titulo));
  ok(!!fij && /Luz/.test(fij.texto), 'los tres pagos de mañana van en un solo aviso');
  const ya9 = new Date().getHours() >= 9; // 12/11: abierta después de las 9:00 del día antes → sale enseguida (2 min) y se marca para no repetir
  ok(ya9 ? (!!imp[0] && imp[0].marca && imp[0].cuando - Date.now() < 3 * 60000) || new Date(Date.now() + 120000).getHours() >= 22 : !imp[0] || !imp[0].marca, 'si ya pasaron las 9:00, el aviso de mañana sale enseguida en vez de perderse');
  const tar = lista.filter((x) => /tareas|Agenda/.test(x.titulo));
  ok(tar.length === 1 && /4 tareas/.test(tar[0].titulo), 'las 4 tareas del mismo día van juntas');
  ok(lista.every((x) => { const h = new Date(x.cuando).getHours(); return h >= 9 && h < 22; }), 'ningún aviso entre las 22:00 y las 9:00');
  ok(lista.every((x) => !/\d+,\d\d|€/.test(x.titulo + x.texto)), 'sin cifras de dinero en los avisos');
  ok(!lista.some((x) => x.nivel === 'resumen'), 'el resumen viene apagado');
  // al momento: la primera vez solo se apunta lo que ya pasaba (súper al 85 %), sin avisar de golpe
  ok(reg.ahora.length === 0, 'la primera vez no avisa de lo que ya pasaba');
  // ahora se pasa del presupuesto: un aviso, y una sola vez
  A.S._movsRaw = (A.S._movsRaw || []).concat([{ id: 'g2', tipo: 'Gasto', categoria: 'Supermercado', importe: 30, fecha: hoy, descripcion: 'Súper 2' }]); A.S.movimientos = A.S.movimientos.concat([{ id: 'g2', tipo: 'Gasto', categoria: 'Supermercado', importe: 30, fecha: hoy, descripcion: 'Súper 2' }]); // como si llegara de Supabase
  A.H.avRec(['presupuestos']); A.H.avRec(['presupuestos']); await sleep(1800);
  A.H.avRec(['presupuestos']); A.H.avRec(['presupuestos']); await sleep(1800);
  const pas = reg.ahora.filter((x) => /Supermercado: presupuesto pasado/.test(x.titulo));
  ok(pas.length === 1 && pas[0].id >= 2000, 'al pasarse del presupuesto avisa una sola vez (' + reg.ahora.map((x) => x.titulo).join(' | ') + ')');
  // máximo 3 normales al día
  const porDia = {}; lista.filter((x) => x.nivel === 'normal').forEach((x) => { const d = new Date(x.cuando).toDateString(); porDia[d] = (porDia[d] || 0) + 1; });
  ok(Object.values(porDia).every((n) => n <= 3), 'como mucho 3 normales al día');
  // ajustes: apagar los fijos los quita, encender el resumen lo añade
  click(e, 'avRec', 'fijos'); await sleep(50); click(e, 'avRec', 'resumen'); await sleep(1900);
  const l2 = reg.programar[reg.programar.length - 1] || [];
  ok(!l2.some((x) => /pagos fijos|pago de/.test(x.titulo)) && l2.some((x) => x.nivel === 'resumen' && /Tu semana/.test(x.titulo)), 'apagar «Cobros y pagos fijos» los quita y encender «Resumen» lo añade');
  ok(l2.some((x) => x.nivel === 'importante'), 'el aviso importante sigue aunque apagues los normales de fijos');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

// Temas en los grupos (23/10/2026, docs/16 apartado 3): elegir o crear el tema al compartir un gasto y verlos dentro del grupo. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), hoy = iso(d);
const mas = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return iso(x); };
(async () => {
  const e = makeEnv({ cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Restaurantes' }, { nombre: 'Supermercado' }, { nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S, sh = () => doc.querySelector('#sheetHost');
  const creados = [], editados = [], rpcs = [], temasCreados = [];
  let n = 0;
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm) => ({ user_id: u, nombre: nm, rol: 'miembro' });
  S.grupos = [{ id: 'g1', nombre: 'Viaje', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana')] },
    { id: 'g2', nombre: 'Casa', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uB', 'Bea')], todos: [m('uYo', 'Lucía'), m('uB', 'Bea')] }];
  S.compartidos = [
    { id: 'k1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Cena', importe: 60, pagadoPor: 'uYo', reparto: { uYo: 30, uA: 30 }, modo: 'igual', creadoPor: 'uYo', createdAt: '2026-10-01T10:00:00Z', fecha: mas(-1), carpetaId: null },
    { id: 'k2', grupoId: 'g1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Agua', importe: 10, pagadoPor: 'uA', reparto: { uYo: 5, uA: 5 }, modo: 'igual', creadoPor: 'uA', createdAt: '2026-10-01T11:00:00Z', fecha: mas(-30), carpetaId: null }];
  S.objetivos = []; S.aportes = [];
  S.carpetas = [{ id: 't1', grupoId: 'g1', nombre: 'Roma', icono: 'plane', desde: mas(-2), hasta: mas(3), cerrada: null, createdAt: '2026-10-01T09:00:00Z' },
    { id: 't2', grupoId: 'g1', nombre: 'Compra', icono: 'cart', desde: null, hasta: null, cerrada: null, createdAt: '2026-10-01T08:00:00Z' },
    { id: 't9', grupoId: 'g2', nombre: 'Luz', icono: 'home', desde: null, hasta: null, cerrada: null, createdAt: '2026-10-01T08:00:00Z' }];
  S.db = Object.assign(S.db || {}, {
    grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] },
    rpc: async (fn, p) => { rpcs.push([fn, p]); return p && p.p_ids ? p.p_ids.length : null; },
    compartidos: Object.assign({}, (S.db && S.db.compartidos) || {}, { crear: async (o) => { creados.push(o); return Object.assign({ id: 'nuevo' + (++n), creadoPor: 'uYo', createdAt: new Date().toISOString() }, o); }, editar: async (id, o) => { editados.push([id, o]); return Object.assign({}, S.compartidos.find((c) => c.id === id), o); } }),
    carpetas: { suscribir: () => () => {}, crear: async (o) => { temasCreados.push(o); return Object.assign({ id: 'tn' + temasCreados.length, cerrada: null, desde: null, hasta: null, createdAt: new Date().toISOString() }, o); },
      editar: async (id, o) => Object.assign({}, S.carpetas.find((t) => t.id === id), o), borrar: async () => [{ id: 'x' }], restaurar: async (id) => null },
  });
  // 1. al compartir: la caja «¿De qué tema?» con el tema que cubre la fecha ya elegido
  H.compRapido(['g:g1']); await sleep(30);
  const caja = () => sh().querySelector('.tema-caja');
  ok(caja() && /¿De qué tema\?/.test(caja().textContent), 'al elegir el grupo sale «¿De qué tema? · opcional»');
  const chips = [...caja().querySelectorAll('.chip')].map((x) => x.textContent.trim());
  ok(chips.join('|') === 'Ninguno|Roma|Compra|Nuevo', 'chips: Ninguno, los temas del grupo y Nuevo (' + chips.join('|') + ')');
  ok(caja().querySelector('.chip.active') && /Roma/.test(caja().querySelector('.chip.active').textContent) && /Elegido por la fecha: Roma/.test(caja().textContent), 'Roma viene elegido por la fecha y dice por qué');
  // cambiar la fecha fuera del viaje → «Ninguno»
  const f = sh().querySelector('#crFecha'); f.value = mas(-20); f.dispatchEvent(new e.w.Event('change', { bubbles: true })); await sleep(10);
  ok(/Ninguno/.test(caja().querySelector('.chip.active').textContent), 'al cambiar la fecha fuera del viaje, vuelve a «Ninguno»');
  // otro grupo: sus temas
  H.crDest(['g:g2']); await sleep(10);
  ok(/Luz/.test(caja().textContent) && !/Roma/.test(caja().textContent), 'al cambiar de grupo salen los temas de ese grupo');
  H.crDest(['g:g1']); await sleep(10);
  // crear uno nuevo sin salir
  const imp = sh().querySelector('#crImporte'); imp.value = '24'; imp.dispatchEvent(new e.w.Event('input', { bubbles: true }));
  H.temaNuevoAbrir([]); await sleep(10);
  ok(sh().querySelector('#temaNom') && sh().querySelectorAll('.tema-ico').length === 6, '«+ Nuevo» abre el nombre y 6 iconos dentro de la misma caja');
  sh().querySelector('#temaNom').value = 'Navidad'; H.temaIco(['gift']); await sleep(5);
  await H.temaCrearRapido([]); await sleep(20);
  ok(temasCreados[0] && temasCreados[0].nombre === 'Navidad' && temasCreados[0].icono === 'gift' && temasCreados[0].grupoId === 'g1', 'crea el tema en el grupo (Navidad, regalo)');
  ok(/Navidad/.test(caja().querySelector('.chip.active').textContent) && sh().querySelector('#crImporte').value === '24', 'queda elegido y lo ya escrito sigue ahí');
  await H.crGuardar([]); await sleep(40);
  ok(creados[0] && creados[0].carpetaId === 'tn1', 'el gasto se guarda con su tema');
  // sin tema: no se manda nada
  H.compRapido(['g:g2']); await sleep(20); H.temaElegir(['']); await sleep(5);
  const imp2 = sh().querySelector('#crImporte'); imp2.value = '5'; imp2.dispatchEvent(new e.w.Event('input', { bubbles: true }));
  await H.crGuardar([]); await sleep(40);
  ok(creados[1] && !('carpetaId' in creados[1]), 'con «Ninguno» no se manda el tema');
  // 2. dentro del grupo
  H.grupoVer(['g1']); await sleep(40);
  ok(sh().querySelector('.tema-grupo') && /Todo/.test(sh().querySelector('.tema-grupo').textContent), 'en el grupo, la fila de temas con «Todo»');
  ok(/Por temas/.test(sh().textContent) && /Sin tema/.test(sh().textContent), 'tarjeta «Por temas» con «Sin tema» al final');
  ok([...sh().querySelectorAll('.row .meta')].some((x) => /Navidad/.test(x.textContent)), 'cada gasto con tema lo dice en su línea');
  H.temaVer(['tn1']); await sleep(20);
  ok(/Gastado entre los dos/.test(sh().textContent) && /Tu parte/.test(sh().textContent) && /Quién pagó qué/.test(sh().textContent) && /Saldos/.test(sh().textContent), 'el resumen de un tema: gastado, tu parte, quién pagó y el enlace a Saldos');
  // nuevo tema con fechas: mete los gastos de esos días
  H.temaFormAbrir(['g1', '']); await sleep(20);
  sh().querySelector('#tfNombre').value = 'Escapada';
  const de = sh().querySelector('#tfDesde'), ha = sh().querySelector('#tfHasta'); de.value = mas(-31); ha.value = mas(-29); H.temaFormFecha([]); await sleep(10);
  ok(/Meter el gasto de esos días/.test(sh().textContent), 'con fechas: «Meter el gasto de esos días» (el agua)');
  await H.temaFormGuardar([]); await sleep(30);
  ok(rpcs.some(([fn, p]) => fn === 'poner_carpeta' && p.p_ids.join() === 'k2'), 'mete ese gasto con poner_carpeta');
  ok(/Escapada/.test(sh().textContent) && sh().querySelector('.tema-cab'), 'y abre el tema nuevo');
  // borrar con «Deshacer»
  H.temaMenu([A.S.carpetas.find((t) => t.nombre === 'Escapada').id]); await sleep(10);
  ok(/Cerrar tema/.test(sh().textContent) && /Borrar tema/.test(sh().textContent), 'menú del tema: cambiar, cerrar y borrar');
  await H.temaBorrar([A.S.carpetas.find((t) => t.nombre === 'Escapada').id]); await sleep(20);
  ok(!A.S.carpetas.some((t) => t.nombre === 'Escapada') && /Deshacer/.test(doc.querySelector('#toast').textContent), 'borrar: desaparece y se puede deshacer');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

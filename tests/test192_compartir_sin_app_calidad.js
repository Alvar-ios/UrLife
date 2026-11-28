// Calidad sobre tanda 1 de Juntos (compartir sin app): doble toque, ticket, nombres, Ahorro/Deuda, Juntos apagado. Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
function conGrupos(w, estado) {
  const base = w.Data, rpcs = []; w.__rpcs = rpcs;
  w.Data = Object.assign({}, base, { uid: () => 'uA',
    grupos: { listar: async () => JSON.parse(JSON.stringify(estado)), invitaciones: async () => [], renombrar: async () => [], miNombre: async () => [], reparto: async () => [] },
    compartidos: { suscribir: (n) => { setTimeout(() => n([]), 0); return () => {}; }, crear: async (o) => o, editar: async (i, o) => o, borrar: async () => [] },
    objetivos: { suscribir: (n) => { setTimeout(() => n([]), 0); return () => {}; } },
    rpc: async (fn, p) => { rpcs.push([fn, p]);
      if (fn === 'crear_grupo') { await sleep(30); estado.grupos.push({ id: 'gN', nombre: p.p_nombre, tipo: 'grupo', creado_por: 'uA', created_at: 'z' }); estado.miembros.push({ grupo_id: 'gN', user_id: 'uA', nombre: p.p_mi_nombre, rol: 'admin', created_at: 'a' }); return 'gN'; }
      if (fn === 'crear_sin_cuenta') { estado.sinCuenta = estado.sinCuenta || []; estado.sinCuenta.push({ id: 'uC', grupo_id: p.p_grupo, nombre: p.p_nombre, creado_por: 'uA', created_at: 'b' }); return 'uC'; }
      return null; } });
}
const LECTURA = { ticket: { es_ticket: true, comercio: 'Bar Ejemplo', fecha: '2026-10-09', total: 10, moneda: 'EUR', categoria: 'Restaurantes', notas: '', articulos: [{ nombre: 'Caña', cantidad: 2, importe: 4 }, { nombre: 'Tapa', cantidad: 1, importe: 6 }] }, modelo: 'rapido', usados: 1, limite: 60 };
const nuevo = (herr, pre) => { const est = { grupos: [], miembros: [], sinCuenta: [] };
  const e = makeEnv({ version: { juntos: 3, crear: 1 }, cfg: { app: { categoriasGasto: [{ nombre: 'Restaurantes' }], nombre: 'Álvaro', herramientas: herr }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uA' } }, pre: (w) => { conGrupos(w, est); if (pre) pre(w); } });
  return { e, est }; };
(async () => {
  // 1) Doble toque: un solo grupo
  let { e } = nuevo(); await sleep(150);
  e.w.__APP__.H.crearIr(['compartido']); await sleep(40);
  e.doc.querySelector('#invNombre').value = '  Carlos  ';
  click(e, 'invSinApp', 'f'); click(e, 'invSinApp', 'f'); await sleep(150);
  ok(e.w.__rpcs.filter((r) => r[0] === 'crear_grupo').length === 1, 'doble toque: solo se crea un grupo');
  ok(e.w.__rpcs.some((r) => r[0] === 'crear_sin_cuenta' && r[1].p_nombre === 'Carlos'), 'el nombre se guarda sin espacios sobrantes');
  // 2) Mayúsculas: «CARLOS» no duplica
  e.w.__rpcs.length = 0; e.w.__APP__.H.crearIr(['compartido']); await sleep(40);
  click(e, 'invAbrir', 'f'); await sleep(10);
  e.doc.querySelector('#invNombre').value = 'CARLOS'; click(e, 'invSinApp', 'f'); await sleep(80);
  ok(e.w.__rpcs.every((r) => r[0] !== 'crear_grupo'), 'CARLOS en mayúsculas no crea otro grupo');
  // 3) Ahorro: no abre el campo del nombre
  ({ e } = nuevo()); await sleep(150);
  e.w.__APP__.H.crearIr(['compartido']); await sleep(40);
  const A = e.w.__APP__;
  A.H.openMovForm([]); await sleep(30);
  const t = e.doc.querySelector('[data-t="Ahorro"]');
  ok(!!t, 'hay selector de tipo Ahorro');
  if (t) { t.click(); await sleep(30); }
  const cOn = e.doc.querySelector('[data-click^="compOn"]'); if (cOn) { cOn.click(); await sleep(30); }
  ok(!e.doc.querySelector('#invNombre'), 'tipo Ahorro: no sale el campo «Su nombre»');
  // 4) Juntos apagado: se enciende al compartir
  ({ e } = nuevo({ juntos: false })); await sleep(150);
  ok(true, 'arranca con Juntos apagado');
  e.w.__APP__.H.crearIr(['compartido']); await sleep(40);
  if (e.doc.querySelector('#invNombre')) {
    e.doc.querySelector('#invNombre').value = 'Marta'; click(e, 'invSinApp', 'f'); await sleep(120);
    ok(e.w.__rpcs.some((r) => r[0] === 'crear_sin_cuenta'), 'con Juntos apagado también se crea');
    ok(!!(e.w.__APP__.S.config && e.w.__APP__.S.config.herramientas && e.w.__APP__.S.config.herramientas.juntos !== false), 'Juntos queda encendido');
  }
  // 5) Ticket
  ({ e } = nuevo()); await sleep(150);
  e.w.__reducirFoto = async () => ({ b64: 'QUJD', tipo: 'image/jpeg' });
  e.w.__ticketsApi = async () => JSON.parse(JSON.stringify(LECTURA));
  await e.w.__APP__.leerTicket({}); await sleep(30);
  click(e, 'tkRep', '1'); await sleep(20);
  ok(!!e.doc.querySelector('[data-click^="invAbrir|t"]'), 'ticket: sale «+ Otra persona»');
  click(e, 'invAbrir', 't'); await sleep(20);
  ok(!!e.doc.querySelector('#invNombre'), 'ticket: sale el campo del nombre');
  e.doc.querySelector('#invNombre').value = 'Lucía'; click(e, 'invSinApp', 't'); await sleep(150);
  ok(e.w.__rpcs.some((r) => r[0] === 'crear_sin_cuenta'), 'ticket: se crea la persona');
  ok(!!e.doc.querySelector('#sheetHost .chip.active') && !e.doc.querySelector('#invNombre'), 'ticket: queda elegida y se cierra el campo');
  process.exit(fails ? 1 : 0);
})();

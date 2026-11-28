// Tanda 1 de Juntos (docs/46): compartir un gasto con una persona nueva (sin app) lo guarda siempre. Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
function conGrupos(w, estado, creados) {
  const base = w.Data, rpcs = []; w.__rpcs = rpcs;
  w.Data = Object.assign({}, base, { uid: () => 'uA',
    grupos: { listar: async () => JSON.parse(JSON.stringify(estado)), invitaciones: async () => [], renombrar: async () => [], miNombre: async () => [], reparto: async () => [] },
    compartidos: { suscribir: (n) => { setTimeout(() => n([]), 0); return () => {}; }, crear: async (o) => { creados.push(o); return Object.assign({ id: 'c' + creados.length, creadoPor: 'uA' }, o); }, editar: async (i, o) => o, borrar: async () => [] },
    objetivos: { suscribir: (n) => { setTimeout(() => n([]), 0); return () => {}; } },
    rpc: async (fn, p) => { rpcs.push([fn, p]);
      if (fn === 'crear_grupo') { estado.grupos.push({ id: 'gN', nombre: p.p_nombre, tipo: 'grupo', creado_por: 'uA', created_at: 'z' }); estado.miembros.push({ grupo_id: 'gN', user_id: 'uA', nombre: p.p_mi_nombre, rol: 'admin', created_at: 'a' }); return 'gN'; }
      if (fn === 'crear_sin_cuenta') { estado.sinCuenta = estado.sinCuenta || []; estado.sinCuenta.push({ id: 'uC', grupo_id: p.p_grupo, nombre: p.p_nombre, creado_por: 'uA', created_at: 'b' }); return 'uC'; }
      if (fn === 'invitar_persona') return 'TOKENxyz';
      return null; } });
}
(async () => {
  // A) Persona nueva: sin nadie con quien compartir todavía
  const est = { grupos: [], miembros: [], sinCuenta: [] }, creados = [];
  const e = makeEnv({ version: { juntos: 4, crear: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Restaurantes' }], nombre: 'Álvaro' }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uA' } }, pre: (w) => conGrupos(w, est, creados) });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, doc = e.doc;
  H.crearIr(['compartido']); await sleep(40);
  ok(!!doc.querySelector('#compField #invNombre'), 'sin nadie: sale directamente el campo «Su nombre»');
  ok(!/Aún no compartes con nadie/.test(doc.querySelector('#compField').textContent), 'ya no sale el texto «Aún no compartes con nadie»');
  // sin escribir nada
  click(e, 'invSinApp', 'f'); await sleep(20);
  ok(e.w.__rpcs.every((r) => r[0] !== 'crear_grupo'), 'sin nombre: no se crea nada');
  // con nombre
  doc.querySelector('#invNombre').value = 'Carlos';
  click(e, 'invSinApp', 'f'); await sleep(80);
  const fn = e.w.__rpcs.map((r) => r[0]);
  ok(fn.indexOf('crear_grupo') >= 0 && fn.indexOf('crear_sin_cuenta') > fn.indexOf('crear_grupo'), 'crea un grupo de dos y a Carlos sin cuenta');
  const g = (A.S.grupos || []).find((x) => x.id === 'gN');
  ok(!!g && g.miembros.length === 2 && g.miembros.some((m) => m.sinCuenta && m.nombre === 'Carlos'), 'el grupo tiene a Carlos sin cuenta');
  ok(!!doc.querySelector('#compField .chip.active') && /Carlos|Álvaro y Carlos/.test(doc.querySelector('#compField .chip.active').textContent), 'queda elegido en «Con»');
  doc.querySelector('#fCategoria').value = 'Restaurantes';
  doc.querySelector('#fImporte').value = '30';
  doc.querySelector('#fImporte').dispatchEvent(new e.w.Event('input', { bubbles: true }));
  const bG = doc.querySelector('[data-click^="saveMov"], #saveMov, [data-click="saveForm"]') || [...doc.querySelectorAll('#sheetHost button')].find((b) => /^Guardar/.test(b.textContent));
  ok(!!bG, 'hay botón Guardar');
  if (bG) { bG.click(); await sleep(150); }
  ok(creados.length === 1 && creados[0].grupoId === 'gN' && Math.abs(creados[0].importe - 30) < 0.01, 'el gasto compartido SE GUARDA (30 € en ese grupo)');
  ok(creados[0] && Math.abs(Object.values(creados[0].reparto).reduce((a, b) => a + b, 0) - 30) < 0.01 && Object.keys(creados[0].reparto).length === 2, 'repartido entre los dos');

  // B) Misma persona otra vez: no se duplica el grupo
  e.w.__rpcs.length = 0;
  H.crearIr(['compartido']); await sleep(40);
  click(e, 'invAbrir', 'f'); await sleep(10);
  doc.querySelector('#invNombre').value = 'carlos';
  click(e, 'invSinApp', 'f'); await sleep(60);
  ok(e.w.__rpcs.every((r) => r[0] !== 'crear_grupo' && r[0] !== 'crear_sin_cuenta'), 'escribir otra vez «carlos» no crea otro grupo');

  // C) Si falla añadir a la persona, el gasto no se pierde y no queda un grupo vacío
  const est2 = { grupos: [], miembros: [], sinCuenta: [] }, c2 = [];
  const e2 = makeEnv({ version: { juntos: 4, crear: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Restaurantes' }] }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uA' } },
    pre: (w) => { conGrupos(w, est2, c2); const r0 = w.Data.rpc; w.Data.rpc = async (fn, p) => { if (fn === 'crear_sin_cuenta') { w.__rpcs.push([fn, p]); throw new Error('grupo_completo'); } return r0(fn, p); }; } });
  await sleep(150);
  e2.w.__APP__.H.crearIr(['compartido']); await sleep(40);
  e2.doc.querySelector('#invNombre').value = 'Marta';
  click(e2, 'invSinApp', 'f'); await sleep(80);
  ok(e2.w.__rpcs.some((r) => r[0] === 'cerrar_grupo'), 'si no se pudo añadir a la persona, el grupo recién creado se cierra');
  ok(!!e2.doc.querySelector('#compField #invNombre'), 'y el campo sigue ahí para reintentar');

  // D) «Ya tiene la app» sigue dando el enlace
  e2.doc.querySelector('[data-click^="invCrear"]') && click(e2, 'invCrear', 'f'); await sleep(60);
  ok(!!e2.doc.querySelector('#compField .wa-btn'), '«Ya tiene la app: enviarle un enlace» da el botón de WhatsApp');
  process.exit(fails ? 1 : 0);
})();

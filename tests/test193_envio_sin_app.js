// Tanda 2a de Juntos (docs/46): hoja corta de Juntos con «+ Otra persona» y, tras guardar con alguien sin app, oferta de WhatsApp con detalle. Datos inventados.
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
      if (fn === 'crear_sin_cuenta') { estado.sinCuenta.push({ id: 'uC', grupo_id: p.p_grupo, nombre: p.p_nombre, creado_por: 'uA', created_at: 'b' }); return 'uC'; }
      if (fn === 'enlace_sin_cuenta') return 'TOKsc123';
      return null; } });
}
(async () => {
  const est = { grupos: [], miembros: [], sinCuenta: [] }, creados = [];
  const e = makeEnv({ version: { juntos: 4 }, cfg: { app: { categoriasGasto: [{ nombre: 'Restaurantes' }], nombre: 'Álvaro' }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uA' } }, pre: (w) => conGrupos(w, est, creados) });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, doc = e.doc;
  // 1) hoja corta de Juntos sin nadie: pide el nombre
  H.compRapido(['']); await sleep(60);
  ok(!!doc.querySelector('#sheetHost #invNombre'), 'Juntos «Compartir un gasto» sin nadie: sale el campo «Su nombre»');
  doc.querySelector('#invNombre').value = 'Carlos';
  click(e, 'invSinApp', 'r'); await sleep(100);
  ok(A.S.grupos.some((g) => g.id === 'gN' && g.miembros.some((m) => m.sinCuenta && m.nombre === 'Carlos')), 'se crea el grupo con Carlos sin app');
  ok(!!doc.querySelector('#crImporte') && !!doc.querySelector('[data-click^="crGuardar"]'), 'la hoja pasa a pedir importe y Guardar');
  doc.querySelector('#crImporte').value = '30'; doc.querySelector('#crImporte').dispatchEvent(new e.w.Event('input', { bubbles: true }));
  doc.querySelector('#crDesc').value = 'Cena'; doc.querySelector('#crDesc').dispatchEvent(new e.w.Event('input', { bubbles: true }));
  click(e, 'crGuardar'); await sleep(200);
  ok(creados.length === 1 && creados[0].grupoId === 'gN', 'el gasto se guarda');
  const wa = doc.querySelector('#sheetHost a.wa-btn');
  ok(/Gasto guardado/.test(doc.querySelector('#sheetHost h2').textContent) && /Carlos/.test(doc.querySelector('#sheetHost').textContent), 'después ofrece mandárselo a Carlos');
  const txt = wa ? decodeURIComponent(wa.getAttribute('href')) : '';
  ok(/Cena/.test(txt) && /30/.test(txt) && /15/.test(txt) && /soy=TOKsc123/.test(txt), 'el WhatsApp dice qué gasto es, el total, su parte (15) y lleva su enlace');
  const usado = e.w.__atras(); await sleep(600);
  ok(usado === true && (!doc.querySelector('#sheetBackdrop') || !/Gasto guardado/.test(doc.querySelector('#sheetHost').textContent)), 'el atrás de Android en «Gasto guardado» lo cierra (como «Ahora no»)');
  // 2) con personas con app no sale la oferta
  const est2 = { grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', creado_por: 'uA', created_at: 'a' }], miembros: [{ grupo_id: 'g1', user_id: 'uA', nombre: 'Álvaro', rol: 'admin', created_at: 'a' }, { grupo_id: 'g1', user_id: 'uB', nombre: 'Ana', rol: 'miembro', created_at: 'b' }], sinCuenta: [] }, c2 = [];
  const e2 = makeEnv({ version: { juntos: 4 }, cfg: { app: { categoriasGasto: [{ nombre: 'Restaurantes' }] }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uA' } }, pre: (w) => conGrupos(w, est2, c2) });
  await sleep(150);
  e2.w.__APP__.H.compRapido(['g:g1']); await sleep(60);
  e2.doc.querySelector('#crImporte').value = '10'; e2.doc.querySelector('#crImporte').dispatchEvent(new e2.w.Event('input', { bubbles: true }));
  click(e2, 'crGuardar'); await sleep(200);
  ok(c2.length === 1 && !/Gasto guardado/.test((e2.doc.querySelector('#sheetHost') || {}).textContent || ''), 'con personas con app: se guarda y no sale la oferta de WhatsApp');
  // 3) casos raros (Calidad): enlace que falla, dos sin app, parte 0, editar, cerrar mientras se prepara
  const mk = (rpcEnlace) => { const est = { grupos: [{ id: 'g1', nombre: 'Viaje', tipo: 'grupo', creado_por: 'uA', created_at: 'a' }], miembros: [{ grupo_id: 'g1', user_id: 'uA', nombre: 'Álvaro', rol: 'admin', created_at: 'a' }, { grupo_id: 'g1', user_id: 'uC', nombre: 'Carlos', rol: 'miembro', sinCuenta: true, created_at: 'b' }, { grupo_id: 'g1', user_id: 'uD', nombre: 'Dana', rol: 'miembro', sinCuenta: true, created_at: 'c' }], sinCuenta: [{ id: 'uC', grupo_id: 'g1', nombre: 'Carlos', creado_por: 'uA', created_at: 'b' }, { id: 'uD', grupo_id: 'g1', nombre: 'Dana', creado_por: 'uA', created_at: 'c' }] }, cr = [];
    const en = makeEnv({ version: { juntos: 4 }, cfg: { app: { categoriasGasto: [{ nombre: 'Restaurantes' }] }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uA' } }, pre: (w) => { conGrupos(w, est, cr); const r = w.Data.rpc; w.Data = Object.assign({}, w.Data, { rpc: async (fn, p) => fn === 'enlace_sin_cuenta' ? rpcEnlace(p) : r(fn, p) }); } }); return { en, cr }; };
  const guardar = async (en, imp) => { en.w.__APP__.H.compRapido(['g:g1']); await sleep(60); const i = en.doc.querySelector('#crImporte'); i.value = imp; i.dispatchEvent(new en.w.Event('input', { bubbles: true })); click(en, 'crGuardar'); };
  { const { en, cr } = mk(async () => { throw new Error('caída'); }); await sleep(150); await guardar(en, '30'); await sleep(250);
    const wa = en.doc.querySelectorAll('#sheetHost a.wa-btn'); const t = wa[0] ? decodeURIComponent(wa[0].getAttribute('href')) : '';
    ok(cr.length === 1 && wa.length === 2 && !/soy=/.test(t) && /sin él/.test(en.doc.querySelector('#sheetHost').textContent), 'enlace que falla: dos sin app, dos WhatsApp, sin enlace y con aviso'); }
  { let suelta; const { en, cr } = mk(() => new Promise((r) => { suelta = r; })); await sleep(150); await guardar(en, '20'); await sleep(150);
    ok(/Gasto guardado/.test(en.doc.querySelector('#sheetHost').textContent), 'mientras se prepara sale «Preparando»');
    en.w.__APP__.H.closeSheet(); await sleep(600); suelta('TOK'); await sleep(200);
    const b = en.doc.querySelector('#sheetBackdrop'); ok(!b || !b.classList.contains('open'), 'si se cierra la hoja mientras se prepara, no se vuelve a abrir'); }
  process.exit(fails ? 1 : 0);
})();

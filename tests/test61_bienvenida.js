// Bienvenida (19/10/2026): usuario nuevo que llega con una invitación de Juntos. La invitación va primero, luego el banco
// y el final; aterriza en el grupo con «Así funciona Juntos» y en Inicio sale el aviso. Servidor simulado. Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const TOKEN = 'INVITA1234567890abcdef';
function env(uid, opts) {
  opts = opts || {};
  const DB = { grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', reparto: null, edicion: 'todos', created_at: '2026-10-01' }], miembros: [{ grupo_id: 'g1', user_id: 'uM', nombre: 'Marta', rol: 'admin', created_at: '2026-10-01' }, { grupo_id: 'g1', user_id: 'uL', nombre: 'Luis', rol: 'miembro', created_at: '2026-10-01' }] };
  const activo = (g) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === uid);
  const e = makeEnv({ url: 'https://urlife-zeta.vercel.app/?unirse=' + (opts.token || TOKEN), cfg: {}, session: { user: { email: 'lucia.prueba@ejemplo.com', id: uid } }, pre: (w) => {
    w.history.replaceState = () => {};
    const ls = {}; Object.defineProperty(w, 'localStorage', { value: { getItem: (k) => (ls[k] == null ? null : ls[k]), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, configurable: true });
  } });
  const orig = e.w.Data;
  e.w.Data = Object.assign({}, orig, {
    uid: () => uid,
    grupos: { listar: async () => ({ grupos: DB.grupos.filter((g) => activo(g.id)), miembros: DB.miembros.filter((m) => activo(m.grupo_id)), sinCuenta: [] }), invitaciones: async () => [] },
    compartidos: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; }, crear: async () => { throw new Error('no'); }, editar: async () => { throw new Error('no'); }, borrar: async () => { throw new Error('no'); } },
    objetivos: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    aportes: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    rpc: async (fn, p) => {
      if (fn === 'ver_invitacion') return p.p_token === TOKEN ? { valida: true, tipo: 'grupo', nombre: 'Piso', invita: 'Marta', miembros: 2, grupo: 'g1' } : { valida: false, motivo: 'caducada' };
      if (fn === 'unirse') { DB.miembros.push({ grupo_id: 'g1', user_id: uid, nombre: p.p_nombre, rol: 'miembro', created_at: '2026-10-19' }); return 'g1'; }
      throw new Error('?' + fn);
    },
  });
  return { e, DB };
}
const txt = (e) => e.doc.querySelector('#app').textContent.replace(/\s+/g, ' ');
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
(async () => {
  /* A. Llega con invitación y se une */
  let { e, DB } = env('uN'); await sleep(120);
  let A = e.w.__APP__, ob = () => A.S.onboarding;
  ok(ob() && ob().invite && /Marta te invita a compartir gastos/.test(txt(e)) && /Paso 1 de 3/.test(txt(e)), 'la bienvenida empieza por la invitación: «Marta te invita a compartir gastos», 3 pasos');
  ok(/Unirme al grupo/.test(txt(e)) && /Piso/.test(txt(e)), 'con el grupo y el botón «Unirme al grupo»');
  ob().nombre = 'Lucía'; await A.H.obUnirse([]); await sleep(60);
  ok(DB.miembros.some((m) => m.user_id === 'uN' && m.nombre === 'Lucía'), 'se une al grupo con su nombre');
  ok(ob().step === 1 && /Ya estás en Piso/.test(txt(e)) && /Paso 2 de 3/.test(txt(e)), 'paso 2: «Ya estás en Piso» y el banco');
  ok(A.cfg().nombre === 'Lucía' && A.cfg().unidoA && A.cfg().unidoA.gid === 'g1', 'guarda su nombre y que se unió a Piso');
  click(e, 'obNext', 'no'); await sleep(10);
  ok(/Todo listo, Lucía/.test(txt(e)) && /Ver Piso/.test(txt(e)), 'paso 3: «¡Todo listo, Lucía!» con «Ver Piso»');
  await A.H.obFinish(['grupo']); await sleep(200);
  ok(!ob() && A.S.tab === 'juntos' && /Así funciona Juntos/.test(sh(e)) && /Piso/.test(sh(e)), 'aterriza en el grupo con «Así funciona Juntos»');
  ok(!/novedades|se ha actualizado/i.test(sh(e)), 'sin ventana de novedades');
  A.H.introJuntosOk([]); await sleep(10);
  ok(!/Así funciona Juntos/.test(sh(e)) && A.cfg().introJuntosVisto, '«Entendido» la quita para siempre');
  A.H.closeSheet([]); await sleep(260); A.H.goTab(['inicio']); await sleep(20);
  ok(/Te has unido a Piso/.test(e.doc.querySelector('#content').textContent) && /Te invitó Marta/.test(e.doc.querySelector('#content').textContent), 'en Inicio: «Te has unido a Piso · Te invitó Marta»');
  A.H.invUnidoVisto([]); await sleep(10);
  ok(!/Te has unido a Piso/.test(e.doc.querySelector('#content').textContent), '«Entendido» quita el aviso');

  /* B. «Ahora no» a la invitación: bienvenida normal y aviso en Inicio */
  ({ e, DB } = env('uP')); await sleep(120); A = e.w.__APP__; ob = () => A.S.onboarding;
  A.H.obInvAplazar([]); await sleep(10);
  ok(/¡Hola!/.test(txt(e)) && /Paso 1 de 4/.test(txt(e)), '«Ahora no»: la bienvenida normal de 4 pasos');
  await A.H.obFinish(['']); await sleep(400);
  const c = e.doc.querySelector('#content').textContent;
  ok(/Marta te ha invitado a Piso/.test(c) && /Ver invitación/.test(c), 'en Inicio: «Marta te ha invitado a Piso» con «Ver invitación»');
  ok(!e.doc.querySelector('#sheetHost .unirse-card'), 'la invitación no salta sola');
  A.H.invVer([]); await sleep(60);
  ok(/Te han invitado a un grupo/.test(sh(e)) && /Piso/.test(sh(e)), '«Ver invitación» abre la invitación');

  /* C. Invitación caducada */
  ({ e, DB } = env('uC', { token: 'CADUCADA1234567890abc' })); await sleep(120); A = e.w.__APP__;
  ok(/ha caducado/.test(txt(e)) && /Seguir sin unirme/.test(txt(e)), 'invitación caducada: lo explica y deja seguir');
  click(e, 'obInvAplazar', 'mal'); await sleep(10);
  ok(/¡Hola!/.test(txt(e)) && !e.w.localStorage.getItem('unirse'), 'sigue con la bienvenida normal y olvida el enlace');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

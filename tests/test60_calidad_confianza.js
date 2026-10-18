// Calidad · Juntos, confianza 1 (18/10/2026): «¿De dónde sale?» y «Deshacer» al borrar un gasto o un pago compartido.
// Casos raros: personas sin cuenta (alias, con y sin historial), gastos donde no participas, apartar para una meta compartida,
// céntimos que no se reparten exactos, textos con símbolos, borrar algo que pagó otra persona y deshacer (su copia personal),
// grupo con «solo quien lo apuntó», deshacer dos veces, deshacer cuando ya no estás en el grupo, artículos de ticket.
// Servidor simulado (como test59). Datos inventados.
// Las comprobaciones con ok() que fallan son fallos de la app que debe arreglar Desarrollo.
// Las líneas «PEND» son fallos leves conocidos: no hacen fallar la prueba; cuando se arreglen saldrá «ARREGLADO».
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pend = (c, m) => console.log((c ? 'ARREGLADO (cambiar por ok) ' : 'PEND ') + m);
const HOY = new Date().toISOString().slice(0, 10);
const M = (g, u, n, rol) => ({ grupo_id: g, user_id: u, nombre: n, rol: rol || 'miembro', created_at: '2026-10-01' });
const DB = {
  grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', reparto: null, edicion: 'todos', created_at: '2026-10-01' },
    { id: 'g3', nombre: 'Casa', tipo: 'grupo', reparto: null, edicion: 'autor', created_at: '2026-10-01' },
    { id: 'g4', nombre: 'Viaje', tipo: 'grupo', reparto: null, edicion: 'todos', created_at: '2026-10-01' }],
  miembros: [M('g1', 'uA', 'Ana', 'admin'), M('g1', 'uB', 'Bea'), M('g3', 'uA', 'Ana', 'admin'), M('g3', 'uB', 'Bea'),
    M('g4', 'uA', 'Ana', 'admin'), M('g4', 'uB', 'Bea'), M('g4', 'uC', 'Ciro')],
  // Ana ocupó en «Viaje» el sitio de una persona sin cuenta («No, solo en el grupo»: su historial no cuenta en sus números)
  sc: [{ id: 's1', grupo_id: 'g4', nombre: 'Nena', creado_por: 'uB', created_at: '2026-10-01', reclamado_por: 'uA', historial: false }],
  comp: [], movs: { uA: {}, uB: {}, uC: {} },
};
let seq = 0; const LIST = []; const notifyComp = () => LIST.forEach((f) => f());
const err = (m) => { throw new Error(m); };
const activo = (g, u) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === u && !m.baja);
const esPart = (g, id) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === id) || DB.sc.some((i) => i.grupo_id === g && i.id === id);
function validar(c) {
  if (!esPart(c.grupoId, c.pagadoPor)) err('pagador_no_valido');
  const ks = Object.keys(c.reparto || {}); let t = 0;
  ks.forEach((k) => { if (!esPart(c.grupoId, k)) err('reparto_no_valido'); t += c.reparto[k]; });
  if (!ks.length || Math.abs(t - c.importe) > 0.01) err('reparto_no_cuadra');
}
function server(uid) {
  const ver = (c) => !c.borrado && activo(c.grupoId, uid);
  return {
    grupos: {
      listar: async () => ({ grupos: DB.grupos.filter((g) => activo(g.id, uid)).map((g) => Object.assign({}, g)), miembros: DB.miembros.filter((m) => activo(m.grupo_id, uid)).map((m) => Object.assign({}, m)),
        sinCuenta: DB.sc.filter((i) => activo(i.grupo_id, uid) || i.reclamado_por === uid).map((i) => Object.assign({}, i)) }),
      invitaciones: async () => [], renombrar: async () => [], miNombre: async () => [], reparto: async () => [{}], edicion: async () => [{}],
    },
    compartidos: {
      suscribir: (next) => { const f = () => next(DB.comp.filter(ver).map((c) => JSON.parse(JSON.stringify(c)))); LIST.push(f); setTimeout(f, 0); return () => {}; },
      // como en Supabase: quien lo crea queda como autor (el disparador pone creado_por = auth.uid())
      crear: async (o) => { if (!activo(o.grupoId, uid)) err('row-level security'); const c = Object.assign(JSON.parse(JSON.stringify(o)), { id: 'c' + (++seq), creadoPor: uid, createdAt: new Date(Date.now() + seq).toISOString() }); validar(c); DB.comp.push(c); setTimeout(notifyComp, 5); return JSON.parse(JSON.stringify(c)); },
      editar: async () => err('no'),
      borrar: async (id) => { const c = DB.comp.find((x) => x.id === id && !x.borrado); if (!c) err('compartido_borrado'); c.borrado = true; setTimeout(notifyComp, 5); return true; },
    },
    objetivos: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    aportes: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    rpc: async (fn) => err('?' + fn),
  };
}
function env(uid, opts) {
  opts = opts || {};
  const cfgApp = { categoriasGasto: [{ nombre: 'Restaurantes' }] };
  if (opts.cuentas) cfgApp.cuentas = opts.cuentas;
  const e = makeEnv({ url: 'https://urlife-zeta.vercel.app/', cfg: { app: cfgApp, meta: { onboarded: true } }, session: { user: { email: uid + '@ejemplo.com', id: uid } }, pre: (w) => {
    w.history.replaceState = () => {};
    const ls = {}; Object.defineProperty(w, 'localStorage', { value: { getItem: (k) => (ls[k] == null ? null : ls[k]), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, configurable: true });
  } });
  const orig = e.w.Data, st = DB.movs[uid] || (DB.movs[uid] = {}), s = server(uid), cbs = [];
  const snap = () => cbs.forEach((cb) => cb({ docs: Object.entries(st).map(([id, v]) => ({ id, data: () => JSON.parse(JSON.stringify(v)) })) }));
  e.w.Data = { doc: orig.doc, grupos: s.grupos, compartidos: s.compartidos, objetivos: s.objetivos, aportes: s.aportes, rpc: s.rpc, uid: () => uid,
    collection: (n) => (n !== 'movimientos' ? orig.collection(n) : ({ onSnapshot: (cb) => { cbs.push(cb); setTimeout(snap, 0); return () => {}; },
      add: async (d) => { const k = 'n' + (++seq); st[k] = JSON.parse(JSON.stringify(d)); setTimeout(snap, 5); return { id: k }; },
      doc: (id) => { const k = id || 'n' + (++seq); return { id: k, set: async (d) => { st[k] = JSON.parse(JSON.stringify(d)); setTimeout(snap, 5); }, delete: async () => { delete st[k]; setTimeout(snap, 5); } }; } })) };
  return e;
}
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const toastTxt = (e) => (e.doc.querySelector('#toast') || {}).textContent || '';
const val = (t) => { const n = parseFloat(String(t).replace(/[^\d,]/g, '').replace(',', '.')) || 0; return /[−-]/.test(t) ? -n : n; };
const RARO = /NaN|undefined|null|Infinity|\[object/;
const borrarComp = async (e, id, gid) => { e.w.__APP__.H.compAbrir([id, gid]); await sleep(30); const b = e.doc.querySelector('[data-click^="deleteComp"]'); if (!b) return false; b.click(); b.click(); await sleep(80); return true; };
const vivos = (f) => DB.comp.filter((c) => !c.borrado && f(c));

(async () => {
  /* ---------- 1. «¿De dónde sale?»: la suma de las líneas da el saldo, también en casos raros ---------- */
  DB.comp.push({ id: 'cV1', grupoId: 'g4', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: '<i>Gasolina</i> & peajes', importe: 40, pagadoPor: 'uB', reparto: { s1: 20, uB: 20 }, modo: 'igual', creadoPor: 'uB', createdAt: '2026-10-17T10:00:00Z' });
  DB.comp.push({ id: 'cV2', grupoId: 'g4', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Museo', importe: 30, pagadoPor: 'uB', reparto: { uB: 15, uC: 15 }, modo: 'igual', creadoPor: 'uB', createdAt: '2026-10-17T10:01:00Z' });
  DB.comp.push({ id: 'cV3', grupoId: 'g4', fecha: HOY, tipo: 'Ahorro', categoria: 'Fondo viaje', descripcion: '', importe: 50, pagadoPor: 'uA', reparto: { uA: 25, uB: 25 }, modo: 'igual', objetivoId: 'o1', creadoPor: 'uA', createdAt: '2026-10-17T10:02:00Z' });
  DB.comp.push({ id: 'cV4', grupoId: 'g4', fecha: HOY, tipo: 'Liquidación', categoria: 'Liquidación', descripcion: '', importe: 10, pagadoPor: 'uC', reparto: { uB: 10 }, modo: 'importe', creadoPor: 'uC', createdAt: '2026-10-17T10:03:00Z' });
  DB.comp.push({ id: 'cV5', grupoId: 'g4', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Helados', importe: 10, pagadoPor: 'uC', reparto: { uA: 3.34, uB: 3.33, uC: 3.33 }, modo: 'igual', creadoPor: 'uC', createdAt: '2026-10-17T10:04:00Z' });
  // Piso: Bea pagó el súper (con ticket) y tiene su copia personal; Ana pagó la luz y tiene la suya
  DB.comp.push({ id: 'cSuper', grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Súper', importe: 60, pagadoPor: 'uB', reparto: { uA: 30, uB: 30 }, modo: 'igual', creadoPor: 'uB', createdAt: '2026-10-17T10:00:00Z',
    articulos: [{ nombre: 'Pan', importe: 20, para: ['uA', 'uB'] }, { nombre: 'Fruta', importe: 40, para: ['uA', 'uB'] }] });
  DB.movs.uB.mB1 = { tipo: 'Gasto', fecha: HOY, categoria: 'Restaurantes', descripcion: 'Súper', importe: 60, compartidoId: 'cSuper', creadoEn: 1 };
  DB.comp.push({ id: 'cLuz', grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Luz', importe: 30, pagadoPor: 'uA', reparto: { uA: 15, uB: 15 }, modo: 'igual', creadoPor: 'uA', createdAt: '2026-10-17T11:00:00Z' });
  DB.movs.uA.mA1 = { tipo: 'Gasto', fecha: HOY, categoria: 'Restaurantes', descripcion: 'Luz', importe: 30, compartidoId: 'cLuz', cuentaId: 'k1', creadoEn: 2 };
  // Casa («solo quien lo apuntó»): Bea apuntó la cena; Ana es administradora
  DB.comp.push({ id: 'cCena', grupoId: 'g3', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Cena', importe: 20, pagadoPor: 'uB', reparto: { uA: 10, uB: 10 }, modo: 'igual', creadoPor: 'uB', createdAt: '2026-10-17T12:00:00Z' });

  const a = env('uA', { cuentas: [{ id: 'k1', nombre: 'Banco', saldo: 100, fecha: '2026-10-01', principal: true }, { id: 'k9', nombre: 'Otra', saldo: 0, fecha: '2026-10-01' }] }); await sleep(250); const A = a.w.__APP__;
  A.H.origenVer(['g4']); await sleep(20);
  const filas = [...a.doc.querySelectorAll('#sheetHost .og-f:not(.tot)')], tot = a.doc.querySelector('#sheetHost .og-f.tot b');
  const suma = Math.round(filas.reduce((s, f) => s + val(f.querySelector('b.tnum').textContent), 0) * 100) / 100;
  ok(Math.abs(A.miSaldo('g4') - 1.66) < 0.001, 'Viaje: tu saldo con alias, meta, céntimos y gastos ajenos = +1,66 € (−20 + 25 − 3,34)');
  ok(filas.length === 3 && tot && Math.abs(suma - val(tot.textContent)) < 0.001 && Math.abs(suma - 1.66) < 0.001, 'las líneas visibles suman lo mismo que «Tu saldo» (3 líneas: +1,66 €)');
  ok(!/Museo/.test(sh(a)) && !/Ciro pagó a Bea/.test(sh(a)), 'no salen los gastos ni pagos donde no participas');
  ok(/&lt;i&gt;Gasolina|<i>Gasolina<\/i> &/.test(a.doc.querySelector('#sheetHost').innerHTML.replace(/&amp;/g, '&')) && !a.doc.querySelector('#sheetHost i:not(.i)'), 'una descripción con símbolos se enseña como texto (sin colarse en la página)');
  ok(!RARO.test(sh(a)), 'sin textos raros (NaN, undefined…)');
  ok(/Te deben\s*1,66/.test(sh(a)) && /Para quedar en paz/.test(sh(a)), 'cabecera «Te deben 1,66 €» y la explicación de los grupos de 3 o más');
  const fGas = filas.find((f) => /Gasolina/.test(f.textContent));
  pend(fGas && /tu parte 20,00/.test(fGas.textContent.replace(/\s+/g, ' ')), 'sitio de persona sin cuenta «solo en el grupo»: la línea dice «tu parte 0,00 €» pero resta 20 € (miParte no ve el alias; efectoMio sí)');
  const fAh = filas.find((f) => /Fondo viaje/.test(f.textContent));
  pend(fAh && /aportaste/.test(fAh.textContent), 'apartar para una meta compartida: la línea dice «pagaste» (en el resto de la app es «aportaste»)');
  A.H.closeSheet([]); await sleep(260);

  // desde la hoja de una persona: «Volver» vuelve a esa persona
  A.H.personaVer(['uB']); await sleep(20);
  const lk = a.doc.querySelector('#sheetHost [data-click^="origenVer"]');
  ok(!!lk, 'en la hoja de Bea hay enlace o filas a «¿De dónde sale?»');
  if (lk) { lk.click(); await sleep(20); }
  ok(/¿De dónde sale\?/.test(sh(a)), 'se abre «¿De dónde sale?» desde la persona');
  const vol = [...a.doc.querySelectorAll('#sheetHost [data-click]')].find((b) => /Volver/.test(b.textContent));
  if (vol) { vol.click(); await sleep(20); }
  ok(vol && /Bea/.test(sh(a)) && /(Le debes|Te debe)/.test(sh(a)), '«Volver» lleva otra vez a la hoja de Bea');
  A.H.closeSheet([]); await sleep(260);
  A.H.origenVer(['gNoExiste']); await sleep(20);
  ok(/ya no está disponible/.test(sh(a)), 'grupo que ya no existe: aviso claro, sin romperse');
  A.H.closeSheet([]); await sleep(260);

  /* ---------- 2. Borrar algo que pagó Bea y «Deshacer»: los números de Bea no deben cambiar ---------- */
  const b0 = env('uB'); await sleep(250); const B0 = b0.w.__APP__;
  const superDeBea = (X) => X.movsEfectivos().filter((m) => m.descripcion === 'Súper').reduce((s, m) => s + Number(m.importe), 0);
  ok(Math.abs(superDeBea(B0) - 30) < 0.001, 'antes: en los números de Bea el súper cuenta 30 € (su parte), no 60');
  ok(await borrarComp(a, 'cSuper', 'g1'), 'Ana puede borrar el súper (grupo «todos»)');
  ok(/Deshacer/.test(toastTxt(a)), 'aviso con «Deshacer»');
  const btn = a.doc.querySelector('#toast .toast-btn');
  btn.click(); await sleep(150);
  const reSuper = vivos((c) => c.descripcion === 'Súper');
  ok(reSuper.length === 1, 'el súper vuelve una sola vez');
  const rs = reSuper[0] || {};
  ok(rs.articulos && rs.articulos.length === 2 && rs.articulos[1].nombre === 'Fruta' && rs.reparto && rs.reparto.uA === 30 && rs.pagadoPor === 'uB', 'vuelve con sus artículos del ticket, su reparto y quién pagó');
  const b1 = env('uB'); await sleep(250); const B1 = b1.w.__APP__;
  ok(Math.abs(superDeBea(B1) - 30) < 0.001, 'tras «Deshacer» de Ana, el súper sigue contando 30 € a Bea (hoy cuenta ' + superDeBea(B1) + ' €: su copia de 60 € se queda suelta y se suma a su parte)');
  ok(DB.movs.uB.mB1 && (vivos((c) => c.id === DB.movs.uB.mB1.compartidoId).length === 1), 'la copia personal de Bea sigue enlazada al gasto recuperado');

  /* ---------- 3. Borrar algo que pagó Ana y «Deshacer»: su copia personal vuelve una vez y enlazada ---------- */
  A.S.config = Object.assign({}, A.cfg(), { cuentaJuntos: { cLuz: 'k9' } });
  await sleep(30);
  ok(await borrarComp(a, 'cLuz', 'g1'), 'Ana borra la luz');
  ok(!DB.movs.uA.mA1, 'al borrar, su copia personal desaparece');
  a.doc.querySelector('#toast .toast-btn').click(); await sleep(200);
  const reLuz = vivos((c) => c.descripcion === 'Luz')[0];
  const copias = Object.values(DB.movs.uA).filter((m) => m.descripcion === 'Luz');
  ok(reLuz && copias.length === 1 && DB.movs.uA.mA1 && DB.movs.uA.mA1.compartidoId === reLuz.id && DB.movs.uA.mA1.cuentaId === 'k1', 'vuelve una sola copia, con el mismo id, su cuenta y enlazada al nuevo gasto');
  const luzEf = A.movsEfectivos().filter((m) => m.descripcion === 'Luz').reduce((s, m) => s + Number(m.importe), 0);
  ok(Math.abs(luzEf - 15) < 0.001, 'en los números de Ana la luz cuenta 15 € (su parte), sin sumar la copia');
  ok(reLuz && (A.cfg().cuentaJuntos || {})[reLuz.id] === 'k9' && !(A.cfg().cuentaJuntos || {}).cLuz, 'y recupera la cuenta desde la que la pagó');

  /* ---------- 4. «Solo quien lo apuntó»: si la administradora borra y deshace, Bea debe poder seguir cambiando su gasto ---------- */
  ok(await borrarComp(a, 'cCena', 'g3'), 'la administradora puede borrar la cena de Bea');
  a.doc.querySelector('#toast .toast-btn').click(); await sleep(150);
  const reCena = vivos((c) => c.descripcion === 'Cena')[0];
  ok(!!reCena, 'la cena vuelve');
  ok(reCena && reCena.creadoPor === 'uB', 'la cena recuperada sigue siendo de Bea (hoy queda como apuntada por Ana: Bea ya no puede cambiarla ni borrarla)');
  const b2 = env('uB'); await sleep(250);
  if (reCena) {
    b2.w.__APP__.H.compAbrir([reCena.id, 'g3']); await sleep(30);
    const bb = b2.doc.querySelector('[data-click^="deleteComp"]');
    if (bb) { bb.click(); bb.click(); await sleep(80); }
    ok(!!bb && !vivos((c) => c.id === reCena.id).length, 'Bea puede borrar su propia cena después del «Deshacer» de Ana');
  }

  /* ---------- 5. «Deshacer» cuando ya no estás en el grupo ---------- */
  DB.comp.push({ id: 'cAgua', grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Agua', importe: 8, pagadoPor: 'uB', reparto: { uA: 4, uB: 4 }, modo: 'igual', creadoPor: 'uB', createdAt: '2026-10-17T13:00:00Z' });
  notifyComp(); await sleep(40);
  ok(await borrarComp(a, 'cAgua', 'g1'), 'Ana borra el agua');
  A.S.grupos = A.S.grupos.filter((g) => g.id !== 'g1'); // mientras, sale del grupo
  a.doc.querySelector('#toast .toast-btn').click(); await sleep(80);
  ok(/Ya no estás en ese grupo/.test(toastTxt(a)) && !vivos((c) => c.descripcion === 'Agua').length, 'si ya no estás en el grupo: aviso claro y no se crea nada');

  /* ---------- 6. Doble toque en «Deshacer» ---------- */
  // En un móvil el botón deja de recibir toques al ocultarse el aviso (CSS), pero el código no se protege: dos llamadas = dos copias.
  DB.comp.push({ id: 'cPan', grupoId: 'g4', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Pan', importe: 6, pagadoPor: 'uB', reparto: { uA: 3, uB: 3 }, modo: 'igual', creadoPor: 'uB', createdAt: '2026-10-17T14:00:00Z' });
  notifyComp(); await sleep(40);
  ok(await borrarComp(a, 'cPan', 'g4'), 'Ana borra el pan');
  const bt2 = a.doc.querySelector('#toast .toast-btn'); bt2.click(); bt2.click(); await sleep(150);
  pend(vivos((c) => c.descripcion === 'Pan').length === 1, 'dos toques seguidos en «Deshacer» (o Intro con el teclado) crean el gasto dos veces: rehacerComp no se protege');

  /* ---------- 7. Usuario nuevo, sin grupos ni datos ---------- */
  const n = env('uN'); await sleep(200); const N = n.w.__APP__;
  N.H.origenVer(['g1']); await sleep(20);
  ok(/ya no está disponible/.test(sh(n)) && !RARO.test(sh(n)), 'usuario nuevo: «¿De dónde sale?» de un grupo que no es suyo no se rompe');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH ' + (x && x.stack)); process.exit(1); });

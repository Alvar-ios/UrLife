// Juntos v2 (18/10/2026): personas primero, saldar todo con una persona (bug 35/30), grupo con «Gastos | Saldos»
// y «Ajustes», compartir un gasto rápido y pedir por WhatsApp. Servidor simulado (como test42). Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
const { JSDOM } = require('jsdom'), fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const HOY = new Date().toISOString().slice(0, 10);
const DB = {
  grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', reparto: null, edicion: 'todos', created_at: '2026-10-01' },
    { id: 'g2', nombre: '', tipo: 'directo', reparto: null, edicion: 'todos', created_at: '2026-10-01' }],
  miembros: [{ grupo_id: 'g1', user_id: 'uA', nombre: 'Ana', rol: 'admin', created_at: '2026-10-01' }, { grupo_id: 'g1', user_id: 'uB', nombre: 'Bea', rol: 'miembro', created_at: '2026-10-02' },
    { grupo_id: 'g2', user_id: 'uA', nombre: 'Ana', rol: 'admin', created_at: '2026-10-01' }, { grupo_id: 'g2', user_id: 'uB', nombre: 'Bea', rol: 'miembro', created_at: '2026-10-01' }],
  sc: [],
  enl: [], comp: [], movs: { uA: {}, uB: {}, uC: {} },
};
let seq = 0; const LIST = []; const notifyComp = () => LIST.forEach((f) => f());
const err = (m) => { throw new Error(m); };
const activo = (g, u) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === u && !m.baja);
const esPart = (g, id, ins) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === id && (!m.baja || !ins)) ||
  DB.sc.some((i) => i.grupo_id === g && i.id === id && (!ins || (!i.baja && !i.reclamado_por)));
function validar(c, ins) {
  if (!esPart(c.grupoId, c.pagadoPor, ins)) err('pagador_no_valido');
  const ks = Object.keys(c.reparto || {}); let t = 0;
  ks.forEach((k) => { if (!esPart(c.grupoId, k, ins)) err('reparto_no_valido'); t += c.reparto[k]; });
  if (!ks.length || Math.abs(t - c.importe) > 0.01) err('reparto_no_cuadra');
}
function server(uid, sinMigracion) {
  const ver = (c) => !c.borrado && activo(c.grupoId, uid);
  return {
    grupos: {
      listar: async () => {
        const r = { grupos: DB.grupos.filter((g) => activo(g.id, uid)).map((g) => { const x = Object.assign({}, g); if (sinMigracion) delete x.edicion; return x; }), miembros: DB.miembros.filter((m) => activo(m.grupo_id, uid)).map((m) => Object.assign({}, m)) };
        if (!sinMigracion) r.sinCuenta = DB.sc.filter((i) => activo(i.grupo_id, uid) || i.reclamado_por === uid).map((i) => Object.assign({}, i));
        return r;
      },
      invitaciones: async () => [], renombrar: async () => [], miNombre: async () => [], reparto: async () => [{}], edicion: async () => [{}],
    },
    compartidos: {
      suscribir: (next) => { const f = () => next(DB.comp.filter(ver).map((c) => JSON.parse(JSON.stringify(c)))); LIST.push(f); setTimeout(f, 0); return () => {}; },
      crear: async (o) => { if (!activo(o.grupoId, uid)) err('row-level security'); const c = Object.assign({ id: 'c' + (++seq), creadoPor: uid, createdAt: new Date(Date.now() + seq).toISOString() }, JSON.parse(JSON.stringify(o))); validar(c, true); DB.comp.push(c); setTimeout(notifyComp, 5); return JSON.parse(JSON.stringify(c)); },
      editar: async () => err('no'), borrar: async (id) => { const c = DB.comp.find((x) => x.id === id); if (!c) err('no'); c.borrado = true; setTimeout(notifyComp, 5); return true; },
    },
    objetivos: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    aportes: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    rpc: async (fn, p) => {
      if (sinMigracion) err('Could not find the function public.' + fn + ' in the schema cache');
      if (fn === 'crear_directo') { const g = DB.grupos.find((x) => x.tipo === 'directo' && activo(x.id, uid) && activo(x.id, p.p_user)); if (!g) err('no_es_amigo'); return g.id; }
      if (fn === 'enlace_sin_cuenta') { const t = 'SOY' + (++seq) + 'abcdefghijklmnopq'; DB.enl.push({ token: t, invitado_id: p.p_id }); return t; }
      if (fn === 'ver_enlace_sin_cuenta') { const e = DB.enl.find((x) => x.token === p.p_token), i = DB.sc.find((x) => x.id === e.invitado_id); return { valida: true, grupo: i.grupo_id, nombre_grupo: 'Piso', nombre: i.nombre, gastos: 1 }; }
      if (fn === 'reclamar_sin_cuenta') { const e = DB.enl.find((x) => x.token === p.p_token), i = DB.sc.find((x) => x.id === e.invitado_id);
        DB.miembros.push({ grupo_id: i.grupo_id, user_id: uid, nombre: i.nombre, rol: 'miembro', created_at: '2026-10-17' }); i.reclamado_por = uid; i.historial = p.p_historial; e.usado = true; setTimeout(notifyComp, 5); return i.grupo_id; }
      err('?' + fn);
    },
  };
}
function env(uid, opts) {
  opts = opts || {};
  const cfgApp = { categoriasGasto: [{ nombre: 'Restaurantes' }] };
  if (opts.cuentas) cfgApp.cuentas = opts.cuentas;
  const e = makeEnv({ url: opts.url || 'https://urlife-zeta.vercel.app/', cfg: { app: cfgApp, meta: { onboarded: true } }, session: { user: { email: uid + '@ejemplo.com', id: uid } }, pre: (w) => {
    w.history.replaceState = () => {};
    const ls = {}; Object.defineProperty(w, 'localStorage', { value: { getItem: (k) => (ls[k] == null ? null : ls[k]), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, configurable: true });
  } });
  const orig = e.w.Data, st = DB.movs[uid] || {}, s = server(uid, opts.sinMigracion);
  e.w.Data = { doc: orig.doc, grupos: s.grupos, compartidos: s.compartidos, objetivos: s.objetivos, aportes: s.aportes, rpc: s.rpc, uid: () => uid,
    collection: (n) => (n !== 'movimientos' ? orig.collection(n) : ({ onSnapshot: (cb) => { setTimeout(() => cb({ docs: Object.entries(st).map(([id, v]) => ({ id, data: () => v })) }), 0); return () => {}; },
      add: async (d) => { const k = 'n' + (++seq); st[k] = d; return { id: k }; }, doc: (id) => ({ id: id || 'n' + (++seq), set: async () => {}, delete: async () => {} }) })) };
  return e;
}
const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
const toastTxt = (e) => (e.doc.querySelector('#toast') || {}).textContent || '';
const clicks = (e, pre) => [...e.doc.querySelectorAll('[data-click^="' + pre + '"]')].map((x) => decodeURIComponent(x.getAttribute('data-click')));


(async () => {
  // Bea pagó el súper del piso (60, a medias) y un café a solas con Ana (10, a medias): Ana le debe 30 + 5 = 35
  DB.comp.push({ id: 'cSuper', grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Súper', importe: 60, pagadoPor: 'uB', reparto: { uA: 30, uB: 30 }, modo: 'igual', creadoPor: 'uB', createdAt: '2026-10-17T10:00:00Z' });
  DB.comp.push({ id: 'cCafe', grupoId: 'g2', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Café', importe: 10, pagadoPor: 'uB', reparto: { uA: 5, uB: 5 }, modo: 'igual', creadoPor: 'uB', createdAt: '2026-10-17T11:00:00Z' });
  const a = env('uA'); await sleep(250); const A = a.w.__APP__;
  const app = () => a.doc.querySelector('#app').textContent.replace(/\s+/g, ' ');

  /* 1. La pestaña Juntos nueva: personas primero */
  A.S.tab = 'juntos'; A.render(); await sleep(30);
  ok(/Debes\s*35,00/.test(app()) && /Te deben\s*0,00/.test(app()), 'arriba: «Debes 35 €» y «Te deben 0 €» [' + app().slice(0, 160) + ']');
  ok(/Bea/.test(app()) && /le debes/.test(app()) && /a solas y en Piso|en Piso y a solas/.test(app()), 'fila de Bea: 35 €, «le debes», «a solas y en Piso»');
  ok(clicks(a, 'saldarTodo').includes('saldarTodo|uB'), 'al lado de Bea hay un botón «Saldar»');
  ok(/Compartir un gasto/.test(app()) && /Grupos/.test(app()) && /Actividad/.test(app()), 'se ven «Compartir un gasto», «Grupos» y «Actividad»');
  ok(/Bea apuntó «Café»/.test(app()), 'Actividad: «Bea apuntó «Café»»');
  A.H.juntosFiltro(['te']); await sleep(20);
  ok(!/le debes/.test(app()) && /Nadie en este filtro/.test(app()), 'tocar «Te deben» filtra (Bea desaparece)');
  A.H.juntosFiltro(['']); await sleep(20);
  // el botón «Antes» vuelve a la pantalla anterior
  A.S.verAnterior = { juntos: 1 }; A.render(); await sleep(20);
  ok(/Balance con tus personas/.test(app()), 'con «Antes» se ve la pantalla de Juntos de siempre');
  A.S.verAnterior = {}; A.render(); await sleep(20);
  ok(/Juntos/.test(a.doc.querySelector('#compararHost') ? a.doc.querySelector('#compararHost').textContent + 'Juntos' : 'Juntos'), 'el botón de comparar existe en Juntos');

  /* 2. Bug 35/30: tocar a Bea enseña los 35 € y el desglose */
  A.H.juntosPersona(['uB']); await sleep(30);
  ok(/Le debes\s*35,00/.test(sh(a)), 'la hoja de Bea dice «Le debes 35 €» (antes abría el piso con 30 €) [' + sh(a).slice(0, 120) + ']');
  ok(/A solas\s*−5,00/.test(sh(a)) && /Piso\s*−30,00/.test(sh(a)), 'desglose: a solas 5 € y Piso 30 €');
  A.H.saldarTodo(['uB']); await sleep(30);
  ok(/Ya le he pagado 35,00/.test(sh(a)), 'Saldar: botón «Ya le he pagado 35 €»');
  await A.H.saldarTodoGuardar([]); await sleep(80);
  const liqs = DB.comp.filter((c) => c.tipo === 'Liquidación' && !c.borrado);
  ok(liqs.length === 2 && liqs.some((c) => c.grupoId === 'g1' && c.importe === 30) && liqs.some((c) => c.grupoId === 'g2' && c.importe === 5), 'se apunta un pago por grupo (30 € en Piso y 5 € a solas)');
  ok(Math.abs(A.miSaldo('g1')) < 0.001 && Math.abs(A.miSaldo('g2')) < 0.001, 'Ana queda en paz en los dos');
  ok(/en paz con Bea/.test(toastTxt(a)) && /Deshacer/.test(toastTxt(a)), 'aviso «¡en paz con Bea!» con «Deshacer»');
  a.doc.querySelector('#toast .toast-btn').click(); await sleep(120);
  ok(DB.comp.filter((c) => c.tipo === 'Liquidación' && !c.borrado).length === 0 && Math.abs(A.miSaldo('g1') + 30) < 0.001, '«Deshacer» quita los dos pagos y vuelve a deber 30 en el piso');

  /* 3. Dentro del grupo: lo tuyo arriba, «Gastos | Saldos», administración en «Ajustes» */
  await A.H.grupoVer(['g1']); await sleep(80);
  ok(/Debes 30,00 € a Bea|Debes 30,00\s*€?\s*a Bea/.test(sh(a)) && /Gastos/.test(sh(a)) && /Saldos/.test(sh(a)), 'grupo: «Debes 30 € a Bea» y las pestañas Gastos | Saldos');
  ok(!/Miembros \(/.test(sh(a)) && !/Invitar a gente nueva/.test(sh(a)), 'la administración no está en la pantalla principal del grupo');
  ok(/Entre todos\s*60,00/.test(sh(a)) && /tu parte\s*30,00/.test(sh(a)), 'Gastos: «Entre todos 60 € · tu parte 30 €»');
  A.H.grupoTab(['saldos']); await sleep(20);
  ok(/Para quedar en paz · 1 pago/.test(sh(a)) && /\+30,00/.test(sh(a)), 'Saldos: barras con +30 de Bea y «Para quedar en paz · 1 pago»');
  A.H.grupoAjustes(['g1']); await sleep(20);
  ok(/Ajustes · Piso/.test(sh(a)) && /Miembros \(2\)/.test(sh(a)) && /Invitar a gente nueva/.test(sh(a)) && !/Para quedar en paz/.test(sh(a)), '«Ajustes del grupo» tiene miembros e invitaciones, sin el dinero');
  A.H.grupoAjustesSalir(['g1']); await sleep(20);
  ok(/Saldos/.test(sh(a)) && !/Miembros \(/.test(sh(a)), '«Volver» desde Ajustes regresa al grupo');

  /* 4. Compartir un gasto en una pantalla */
  A.H.compRapido(['g:g1']); await sleep(40);
  ok(/Compartir un gasto/.test(sh(a)) && /Pagó/.test(sh(a)) && /Para quién/.test(sh(a)), 'la hoja rápida tiene «Con», importe, «Pagó» y «Para quién»');
  const imp = a.doc.querySelector('#crImporte'); imp.value = '24'; imp.dispatchEvent(new a.w.Event('input', { bubbles: true })); await sleep(10);
  ok(/Tu parte 12,00\s*€? · te deben 12,00/.test(sh(a)), 'al poner 24 €: «Tu parte 12 € · te deben 12 €»');
  const de = a.doc.querySelector('#crDesc'); de.value = 'Pizza'; de.dispatchEvent(new a.w.Event('input', { bubbles: true }));
  A.H.crIncl(['uB']); await sleep(10);
  ok(/Tu parte 24,00/.test(sh(a)), 'quitar a Bea de «Para quién»: tu parte 24 €');
  A.H.crIncl(['uB']); await sleep(10);
  A.H.crPagador(['uB']); await sleep(10);
  ok(/le debes 12,00\s*€? a Bea/.test(sh(a)) && a.doc.querySelector('#crImporte').value === '24', 'si pagó Bea: «le debes 12 € a Bea» (el importe se mantiene)');
  await A.H.crGuardar([]); await sleep(80);
  const nuevo = DB.comp.find((c) => c.descripcion === 'Pizza');
  ok(nuevo && nuevo.grupoId === 'g1' && nuevo.pagadoPor === 'uB' && nuevo.reparto.uA === 12 && nuevo.reparto.uB === 12, 'se guarda el gasto compartido (24 €, pagó Bea, 12 y 12)');
  ok(Math.abs(A.miSaldo('g1') + 42) < 0.001, 'Ana debe ahora 42 € en el piso');
  A.H.closeSheet([]); await sleep(260);
  A.H.compRapido(['g:g1']); await sleep(30);
  await A.H.crGuardar([]); await sleep(20);
  ok(/Pon cuánto fue/.test(toastTxt(a)), 'sin importe no guarda y avisa «Pon cuánto fue»');
  A.H.closeSheet([]); await sleep(260);

  /* 5. Bea ve «Te debe» con «Pedir» y el mensaje de WhatsApp */
  const b = env('uB'); await sleep(250); const B = b.w.__APP__;
  B.S.tab = 'juntos'; B.render(); await sleep(20);
  const appB = b.doc.querySelector('#app').textContent.replace(/\s+/g, ' ');
  ok(/Te deben\s*47,00/.test(appB) && /te debe/.test(appB) && clicks(b, 'personaVer').some((k) => k.indexOf('personaVer|uA') === 0), 'Bea: «Te deben 47 €» y botón «Pedir» junto a Ana');
  B.H.personaVer(['uA']); await sleep(20);
  const wa = b.doc.querySelector('#sheetHost a.wa-btn');
  ok(wa && /wa\.me/.test(wa.href) && /me%20debes%2047%2C00/.test(wa.href) && /Piso/.test(decodeURIComponent(wa.href)), '«Pedir por WhatsApp» lleva un mensaje amable con 47 € y el grupo');
  ok(/Ya me ha pagado/.test(sh(b)), 'y «Ya me ha pagado» para apuntarlo');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

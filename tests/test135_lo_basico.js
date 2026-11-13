// «Lo básico», «Descubre PalomApp», bienvenida de 2 pantallas (1 para el invitado), la cifra «Gastos de este mes»,
// sugerencias y pistas (docs/38-lo-basico-diseno.md §7, pruebas T1–T18). Datos inventados; servidor simulado.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + (n || 0)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const HOY = iso(0);
const TOKEN = 'INVITA1234567890abcdef';
const V = { tu: 1, agenda: 0, crear: 0, bienvenida: 1 };
let nMov = 0;
const mov = (tipo, importe, extra) => Object.assign({ id: 'm' + (++nMov), fecha: HOY, tipo, categoria: tipo === 'Ingreso' ? 'Nómina' : 'Supermercado', importe, descripcion: 'Prueba', metodoPago: 'Tarjeta débito' }, extra || {});
// opts: app (config), movs, comps (compartidos), juntos (con grupos y personas), invita (llega con un enlace), nuevo (sin bienvenida hecha), tareas
function env(opts) {
  opts = opts || {};
  const uid = 'uY';
  const DB = { grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', reparto: null, edicion: 'todos', created_at: '2026-10-01' }],
    miembros: [{ grupo_id: 'g1', user_id: 'uM', nombre: 'Marta', rol: 'admin', created_at: '2026-10-01' }].concat(opts.enGrupo ? [{ grupo_id: 'g1', user_id: uid, nombre: 'Ana', rol: opts.admin ? 'admin' : 'miembro', created_at: '2026-10-02' }] : []) };
  const activo = (g) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === uid);
  const cfg = opts.nuevo ? {} : { app: Object.assign({ compararVersiones: false }, opts.app || {}), meta: { onboarded: true } };
  const e = makeEnv({ url: opts.invita ? 'https://urlife-zeta.vercel.app/?unirse=' + TOKEN : undefined, cfg, movs: opts.movs || [], version: Object.assign({}, V, opts.version || {}), session: { user: { email: 'ana.prueba@ejemplo.com', id: uid } }, pre: (w) => {
    w.history.replaceState = () => {};
    const ls = {}; Object.defineProperty(w, 'localStorage', { value: { getItem: (k) => (ls[k] == null ? null : ls[k]), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, configurable: true });
  } });
  (opts.tareas || []).forEach((t) => { e.store.tareas[t.id] = t; });
  const orig = e.w.Data, patches = [];
  const doc = (p) => { const d = orig.doc(p); return Object.assign({}, d, { update: async (x) => { patches.push([p, JSON.parse(JSON.stringify(x))]); return d.update(x); } }); };
  e.w.Data = Object.assign({}, orig, { doc });
  if (opts.juntos !== false && (opts.juntos || opts.comps || opts.invita)) Object.assign(e.w.Data, {
    uid: () => uid,
    grupos: { listar: async () => ({ grupos: DB.grupos.filter((g) => activo(g.id)), miembros: DB.miembros.filter((m) => activo(m.grupo_id)), sinCuenta: [] }), invitaciones: async () => [] },
    compartidos: { suscribir: (next) => { setTimeout(() => next(opts.comps || []), 0); return () => {}; }, crear: async () => { throw new Error('no'); }, editar: async () => { throw new Error('no'); }, borrar: async () => { throw new Error('no'); } },
    objetivos: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    aportes: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    rpc: async (fn, p) => {
      if (fn === 'ver_invitacion') return p.p_token === TOKEN ? { valida: true, tipo: 'grupo', nombre: 'Piso', invita: 'Marta', miembros: 1, grupo: 'g1' } : { valida: false, motivo: 'caducada' };
      if (fn === 'unirse') { DB.miembros.push({ grupo_id: 'g1', user_id: uid, nombre: p.p_nombre, rol: 'miembro', created_at: '2026-10-19' }); return 'g1'; }
      return null;
    },
  });
  e.patches = patches; e.A = () => e.w.__APP__;
  return e;
}
const txt = (e, sel) => { const el = e.doc.querySelector(sel || '#content'); return el ? el.textContent.replace(/\s+/g, ' ') : ''; };
const app = (e) => txt(e, '#app'), hoja = (e) => txt(e, '#sheetHost');
const abierta = (e) => { const b = e.doc.querySelector('#sheetBackdrop'); return !!b && !b.dataset.cerrando; };
const basicoApp = (extra) => Object.assign({ nivel: 'basico', nivelCambio: { d: HOY, por: 'alta' }, altaApp: HOY }, extra || {});
const EMOJI = /\p{Extended_Pictographic}/u;
const sinSvg = (h) => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '');
(async () => {
  let e, A;
  /* T1 · usuario de siempre (sin «nivel»): todo igual que hoy */
  e = env({ app: {}, movs: [mov('Gasto', 20), mov('Ingreso', 1000)], juntos: true }); await sleep(200); A = e.A();
  ok(A.nivel() === 'todo' && !('nivel' in A.cfg()), 'T1 · sin la clave «nivel», la app es «Todo»');
  ok(/Editar Inicio/.test(txt(e)) && !/Primeros pasos/.test(txt(e)) && !e.doc.querySelector('#content .sug-card') && !e.doc.querySelector('#content .desc-linea'), 'T1 · Inicio: «Editar Inicio», sin «Primeros pasos», sin sugerencias ni línea «Descubre»');
  A.openCrear(); await sleep(20);
  ok(e.doc.querySelectorAll('#sheetHost .crear-4 .crear-op').length === 4 && e.doc.querySelector('#sheetHost .crear-peq') && !e.doc.querySelector('#sheetHost .crear-mas'), 'T1 · el +: 4 grandes (con Tarea) y la rejilla pequeña a la vista');
  A.H.closeSheet([]); await sleep(260); A.H.goTab(['tu']); await sleep(20);
  const fueraMas = (e2) => [...e2.doc.querySelectorAll('#content .tu-grupo:not(.tu-mas) [data-click]')].map((b) => b.getAttribute('data-click').split('|')[0]);
  ok(['openReglas', 'infAbrir', 'tuMesAbrir', 'openPapelera', 'exportCsv', 'exportBackup', 'verNovedades'].every((k) => fueraMas(e).indexOf(k) >= 0), 'T1 · Tú: Reglas, Informes, Tu mes, Papelera, Excel, Copia y Novedades siguen fuera de «Más ajustes»');
  ok(/Descubre PalomApp/.test(txt(e)) && /Qué ves en la app/.test(txt(e)) && /Todo/.test(txt(e, '[data-click="nivelAbrir"]')), 'T1 · lo único nuevo en Tú: la tarjeta «Descubre PalomApp» y «Qué ves en la app · Todo»');
  ok(!e.doc.querySelector('#content .tu-mas-t'), 'T1 · la fila «Más ajustes» sigue como hoy');

  /* T2 · bienvenida nueva sin invitación: 2 pantallas y «Lo básico» en el mismo guardado que altaApp */
  e = env({ nuevo: true }); await sleep(150); A = e.A();
  ok(A.S.onboarding && /¡Hola!/.test(app(e)) && /Y mucho más, cuando quieras/.test(app(e)) && /Paso 1 de 2/.test(app(e)), 'T2 · pantalla 1 «¡Hola!» con «Y mucho más, cuando quieras» (paso 1 de 2)');
  A.S.onboarding.nombre = 'Ana'; A.H.obNext([]); await sleep(20);
  ok(/¿Por dónde empiezas\?/.test(app(e)) && /Apuntar un gasto/.test(app(e)) && /Poner mi banco al día/.test(app(e)) && /Descubre PalomApp/.test(app(e)) && /Ir a Inicio/.test(app(e)), 'T2 · pantalla 2 «¿Por dónde empiezas?» con sus botones, la frase de Descubre e «Ir a Inicio»');
  ok(!e.doc.querySelector('#app .ob2-big-ic.ok') && !/Todo listo/.test(app(e)), 'T2 · sin «Todo listo» ni confeti en la bienvenida');
  const htmlOb = e.doc.querySelector('#app').innerHTML;
  await A.H.obFinish(['']); await sleep(200);
  const pAlta = e.patches.find((p) => p[0] === 'config/app' && p[1].altaApp);
  ok(pAlta && pAlta[1].nivel === 'basico' && pAlta[1].nivelCambio && pAlta[1].nivelCambio.por === 'alta' && pAlta[1].nivelCambio.d === HOY, 'T2 · al terminar: nivel «basico», nivelCambio.por «alta» y altaApp en un mismo guardado');
  ok(!A.S.onboarding && A.S.tab === 'inicio' && /Primeros pasos/.test(txt(e)) && A.cfg().nombre === 'Ana', 'T2 · aterriza en Inicio con «Primeros pasos» (y su nombre guardado)');
  const htmlIni = e.doc.querySelector('#content').innerHTML;

  /* T3 · cada botón de «¿Por dónde empiezas?» abre lo suyo; sin Juntos no sale «Compartir» */
  for (const [k, kind, extra] of [['gasto', 'mov', null], ['compartido', 'mov', 'comp'], ['banco', 'banco', null]]) {
    e = env({ nuevo: true, juntos: true }); await sleep(150); A = e.A();
    A.H.obNext([]); await sleep(20);
    ok(/Compartir gastos con alguien/.test(app(e)), 'T3 · con Juntos disponible sale «Compartir gastos con alguien» (' + k + ')');
    await A.H.obFinish([k]); await sleep(450);
    const F = A.form();
    ok(F && F.kind === kind && (extra !== 'comp' || (F.comp && (F.comp.on || F.compArriba || true))) && abierta(e), 'T3 · «' + k + '» termina y abre su hoja (' + kind + ')');
  }
  e = env({ nuevo: true, juntos: false }); await sleep(150); A = e.A(); A.H.obNext([]); await sleep(20);
  ok(!/Compartir gastos con alguien/.test(app(e)) && /Apuntar un gasto/.test(app(e)), 'T3 · sin Juntos disponible no sale «Compartir gastos con alguien»');

  /* T4 · «Volver a ver la bienvenida» desde Tú: los 4 pasos de hoy y no cambia el nivel */
  e = env({ app: {} }); await sleep(150); A = e.A();
  A.H.startOnboardingManually([]); await sleep(20);
  ok(/Paso 1 de 4/.test(app(e)) && /Así es PalomApp/.test(app(e)), 'T4 · repetida desde Tú: 4 pasos, «Así es PalomApp»');
  await A.H.obFinish(['']); await sleep(200);
  ok(!('nivel' in A.cfg()) && !e.patches.some((p) => p[1] && 'nivel' in p[1]), 'T4 · no guarda «nivel»: sigue en «Todo»');
  e = env({ app: basicoApp() }); await sleep(150); A = e.A(); A.H.startOnboardingManually([]); await sleep(20); await A.H.obFinish(['']); await sleep(200);
  ok(A.cfg().nivel === 'basico' && A.cfg().nivelCambio.por === 'alta', 'T4 · y a quien está en «Lo básico» tampoco se lo cambia');

  /* T5 · con invitación: 1 pantalla, sin puntos; «Unirme» lleva al grupo sin pasar por el banco */
  e = env({ nuevo: true, invita: true }); await sleep(200); A = e.A();
  ok(/Marta te invita a compartir gastos/.test(app(e)) && !e.doc.querySelector('#app .ob2-prog i') && !/Paso 1 de/.test(app(e)), 'T5 · invitación: una sola pantalla, sin puntos ni «Paso 1 de 1»');
  A.S.onboarding.nombre = 'Ana'; await A.H.obUnirse([]); await sleep(400);
  ok(!A.S.onboarding && A.S.tab === 'juntos' && /Así funciona Juntos/.test(hoja(e)), 'T5 · «Unirme al grupo» aterriza en el grupo con «Así funciona Juntos», sin banco ni «Todo listo»');
  ok(A.cfg().nivel === 'basico' && A.cfg().nivelCambio.por === 'alta' && A.cfg().unidoA && A.cfg().unidoA.gid === 'g1', 'T5 · queda en «Lo básico»');
  A.H.introJuntosOk([]); A.H.closeSheet([]); await sleep(260); A.H.goTab(['inicio']); await sleep(30);
  ok(/Añade lo que pagues en «Piso»/.test(txt(e)) && /Crea tu propio grupo/.test(txt(e)) || /Te has unido a Piso/.test(txt(e)), 'T5 · en Inicio, el aviso del grupo o los «Primeros pasos» del invitado');
  e = env({ nuevo: true, invita: true }); await sleep(200); A = e.A();
  A.H.obInvAplazar([]); await sleep(20);
  ok(/¡Hola!/.test(app(e)) && /Paso 1 de 2/.test(app(e)), 'T5 · «Ahora no»: sigue con las 2 pantallas');

  /* T6 · la cifra grande sin ingresos ni banco */
  const comp49 = { id: 'c1', grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Restaurantes y bares', descripcion: 'Cena', importe: 98, pagadoPor: 'uM', creadoPor: 'uM', reparto: { uY: 49, uM: 49 } };
  e = env({ app: {}, comps: [comp49], enGrupo: true }); await sleep(250); A = e.A();
  const hk = e.doc.querySelector('#content .hero-k'), hv = e.doc.querySelector('#content .hero-v');
  ok(hk && hk.textContent === 'Gastos de este mes' && hv && /49,00/.test(hv.textContent) && !hv.classList.contains('neg'), 'T6 · «Gastos de este mes» · «49,00 €» sin clase neg');
  ok(/Todo es tu parte en Juntos\./.test(txt(e)) && !/De ellos/.test(txt(e)) && e.doc.querySelector('#content [data-click="crearIr|ingreso"]') && /Apunta lo que cobras y verás cuánto te queda/.test(txt(e)), 'T6 · si todo el gasto es de Juntos, «Todo es tu parte en Juntos» y el enlace «Apunta lo que cobras…»');
  ok(!e.doc.querySelector('#content .hero2v2 .hero-bar'), 'T6 · sin barra');
  e = env({ app: {}, comps: [comp49], enGrupo: true, movs: [mov('Ingreso', 1000)] }); await sleep(250);
  ok(/Te queda este mes/.test(txt(e, '#content .hero-k')), 'T6 · con un ingreso apuntado vuelve «Te queda este mes»');
  e = env({ app: { cuentas: [{ id: 'k1', nombre: 'Banco', tipo: 'corriente', saldo: 800, fecha: HOY }] }, movs: [mov('Gasto', 30)] }); await sleep(200);
  ok(!/Gastos de este mes/.test(txt(e)), 'T6 · con el saldo de un banco puesto, tampoco');
  e = env({ app: {} }); await sleep(150);
  ok(/Te queda este mes/.test(txt(e, '#content .hero-k')) && /Apunta lo que cobras y lo que gastas/.test(txt(e)), 'T6 · con 0 € de gasto se queda como hoy');

  /* T7 · «Lo básico», el +: 3 grandes y «Más opciones» plegado */
  e = env({ app: basicoApp(), juntos: true }); await sleep(200); A = e.A();
  A.openCrear(); await sleep(20);
  const grandes = [...e.doc.querySelectorAll('#sheetHost .crear-4 .crear-op')].map((b) => b.textContent.trim());
  ok(grandes.join(',') === 'Gasto,Ingreso,Compartido' && e.doc.querySelector('#sheetHost .crear-4.tres'), 'T7 · 3 grandes: Gasto, Ingreso y Compartido');
  ok(/Más opciones/.test(hoja(e)) && /Tarea, Apartar, Invertir, Pago fijo, Pago de deuda, Importar, Trayecto…/.test(hoja(e)) && !e.doc.querySelector('#sheetHost .crear-peq'), 'T7 · «Más opciones» plegado, con los nombres de lo que hay');
  click(e, 'crearMasToggle'); await sleep(20);
  const peq = [...e.doc.querySelectorAll('#sheetHost .crear-peq .crear-op')];
  ok(peq.length >= 7 && /^Tarea/.test(peq[0].textContent.trim()), 'T7 · al tocar, la rejilla de hoy con Tarea la primera');
  click(e, 'descAbrir'); await sleep(20);
  ok(/Descubre PalomApp/.test(hoja(e)) && e.doc.querySelectorAll('#sheetHost .desc-fila').length === 12, 'T7 · «Descubre para qué sirve cada una» abre el catálogo');

  /* T8 · «Lo básico», Tú */
  A.H.closeSheet([]); await sleep(260); A.H.goTab(['tu']); await sleep(20);
  const enMas = (k) => !!e.doc.querySelector('#content .tu-mas [data-click^="' + k + '"]');
  ok(['openReglas', 'infAbrir', 'tuMesAbrir', 'openPapelera', 'exportCsv', 'exportBackup', 'verNovedades'].every(enMas), 'T8 · Reglas, Informes, Tu mes, Papelera, Excel, Copia y «Qué hay de nuevo» están en «Más ajustes»');
  ok(['openCuentas', 'openRecurrentes', 'openGrupos', 'impAbrir', 'openAspecto', 'nivelAbrir', 'startOnboardingManually'].every((k) => e.doc.querySelector('#content .tu-grupo:not(.tu-mas) [data-click^="' + k + '"]')), 'T8 · Cuentas, Cobros, Grupos, Importar, Aspecto, «Qué ves en la app» y la bienvenida siguen a la vista');
  ok(/Reglas, Informes, Tu mes, Papelera, Copia…/.test(txt(e, '#content .tu-mas-btn')), 'T8 · la fila «Más ajustes» nombra lo que contiene');
  ok(!/Botón «Antes»/.test(txt(e)), 'T8 · no sale «Botón "Antes"»');
  const bu = e.doc.querySelector('#tuBuscar'); bu.value = 'papelera'; A.H.tuFiltrar([], bu);
  const gm = e.doc.querySelector('#content .tu-mas'), pap = e.doc.querySelector('#content .tu-mas [data-click^="openPapelera"]');
  ok(gm.style.display !== 'none' && pap.style.display !== 'none', 'T8 · «Buscar un ajuste» encuentra «Papelera» y despliega «Más ajustes»');
  bu.value = ''; A.H.tuFiltrar([], bu);
  ok(e.doc.querySelector('#content .tu2-desc').closest('.tu-grupo').style.display !== 'none', 'T8 · al borrar la búsqueda vuelve la tarjeta «Descubre PalomApp»');

  /* T9 · «Primeros pasos» */
  e = env({ app: basicoApp(), juntos: true }); await sleep(200); A = e.A();
  ok(/Primeros pasos/.test(txt(e)) && /0 de 3/.test(txt(e)) && /Apunta tu primer gasto/.test(txt(e)) && /Comparte un gasto con alguien/.test(txt(e)) && /Pon el saldo de tu banco/.test(txt(e)), 'T9 · sin invitación: gasto, compartir y banco (0 de 3)');
  e = env({ app: basicoApp({ unidoA: { gid: 'g1', nombre: 'Piso', invita: 'Marta', fecha: HOY, visto: true } }), enGrupo: true, juntos: true }); await sleep(250);
  ok(/Añade lo que pagues en «Piso»/.test(txt(e)) && /Apunta un gasto tuyo/.test(txt(e)) && /Crea tu propio grupo/.test(txt(e)), 'T9 · con invitación: añadir en «Piso», gasto tuyo y tu propio grupo');
  const compMio = { id: 'c2', grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Compra', importe: 30, pagadoPor: 'uY', creadoPor: 'uY', reparto: { uY: 15, uM: 15 } };
  e = env({ app: basicoApp(), enGrupo: true, comps: [compMio], movs: [mov('Gasto', 12)] }); await sleep(250); A = e.A();
  ok(/2 de 3/.test(txt(e, '#content .pp')) && e.doc.querySelectorAll('#content .pp-fila.hecha').length === 2 && !e.doc.querySelector('#content .pp-fila.hecha[data-click]'), 'T9 · marca y cuenta: «2 de 3»; las filas hechas no llevan a ningún sitio');
  e = env({ app: basicoApp({ cuentas: [{ id: 'k1', nombre: 'Banco', tipo: 'corriente', saldo: 500, fecha: HOY }] }), enGrupo: true, comps: [compMio], movs: [mov('Gasto', 12)] }); await sleep(300); A = e.A();
  ok(/¡Ya lo tienes!/.test(txt(e)) && /Ahora, descubre lo demás/.test(txt(e)), 'T9 · al completar: «¡Ya lo tienes!» y «Ahora, descubre lo demás»');
  ok(A.cfg().primerosPasos && A.cfg().primerosPasos.hecho === HOY, 'T9 · guarda primerosPasos.hecho');
  e = env({ app: basicoApp({ altaApp: iso(-1), primerosPasos: { hecho: iso(-1) } }) }); await sleep(200);
  ok(!/Primeros pasos|Ya lo tienes/.test(txt(e)), 'T9 · al día siguiente desaparece');
  e = env({ app: basicoApp() }); await sleep(200); A = e.A();
  click(e, 'empiezaOcultar'); await sleep(30);
  ok(A.cfg().empiezaOculto && !/Primeros pasos/.test(txt(e)), 'T9 · «Ocultar» guarda empiezaOculto');
  e = env({ app: basicoApp({ altaApp: iso(-7), nivelCambio: { d: iso(-7), por: 'alta' } }) }); await sleep(200); A = e.A();
  ok(e.doc.querySelector('#content .pp-linea') && /Primeros pasos · 0 de 2/.test(txt(e)) && !e.doc.querySelector('#content .empieza.pp'), 'T9 · a los 7 días se pliega a una línea');
  click(e, 'ppAbrir'); await sleep(20);
  ok(/Apunta tu primer gasto/.test(hoja(e)) && e.doc.querySelector('#sheetHost [data-click="ppIr|crearIr|gasto"]'), 'T9 · la línea abre la tarjeta entera en una hoja');

  /* T10 · con «Primeros pasos» a la vista: ni piezas de Inicio ni sugerencias */
  const tresGastos = () => [mov('Gasto', 10, { fecha: iso(-1) }), mov('Gasto', 11, { fecha: iso(-1) }), mov('Gasto', 12, { fecha: iso(-1) })];
  e = env({ app: basicoApp({ altaApp: iso(-2), nivelCambio: { d: iso(-2), por: 'alta' } }), movs: tresGastos() }); await sleep(200); A = e.A();
  ok(e.doc.querySelector('#content .empieza.pp') && !e.doc.querySelector('#content .sug-card') && !e.doc.querySelector('#content [class^="iw-"]:not(.iw-editar), #content .ins-scroll, #content .estos-dias'), 'T10 · con «Primeros pasos»: sin piezas de Inicio ni sugerencias');
  ok(e.doc.querySelector('#content .desc-linea') && !/Editar Inicio/.test(txt(e)), 'T10 · al final, la línea «Descubre PalomApp» en vez de «Editar Inicio»');

  /* T11 · el catálogo */
  e = env({ app: basicoApp({ ahorro: [{ id: 'mt1', nombre: 'Viaje', objetivo: 500 }] }), tareas: [{ nombre: 'Llamar al seguro', estado: 'Pendiente', id: 't1' }] }); await sleep(200); A = e.A();
  click(e, 'descAbrir'); await sleep(20);
  const filas = [...e.doc.querySelectorAll('#sheetHost .desc-fila')];
  ok(filas.length === 12 && /Has descubierto 2 de 12 herramientas/.test(hoja(e)), 'T11 · 12 filas y «Has descubierto 2 de 12» (una meta y una tarea)');
  ok(filas.slice(0, 10).every((f) => !f.classList.contains('hecha')) && filas.slice(10).every((f) => f.classList.contains('hecha')) && /Agenda y tareas/.test(filas[10].textContent + filas[11].textContent) && /Metas de ahorro/.test(filas[10].textContent + filas[11].textContent), 'T11 · primero las no descubiertas; las descubiertas al final, con «Abrir»');
  ok(/^Foto de ticket/.test(filas[0].querySelector('b').textContent) && /Abrir/.test(filas[11].querySelector('.btn').textContent) && e.doc.querySelectorAll('#sheetHost .desc-tramos i.on').length === 2, 'T11 · en el orden del documento y la barra de 12 tramos con 2 llenos');
  ok(/Y en Tú también/.test(hoja(e)) && /Quiero verlo todo ya/.test(hoja(e)), 'T11 · el pie y «Quiero verlo todo ya» (en «Lo básico»)');
  click(e, 'descProbar', 'trayecto'); await sleep(300);
  ok(A.cfg().descubierto && A.cfg().descubierto.trayecto === HOY && A.form().kind === 'trayecto' && abierta(e), 'T11 · «Probar» guarda descubierto y abre la calculadora de trayecto');
  ok(A.descubreN() === 3, 'T11 · el contador sube a 3');
  A.H.closeSheet([]); await sleep(260); click(e, 'descAbrir'); await sleep(20); click(e, 'descTodo'); await sleep(30);
  ok(A.cfg().nivel === 'todo' && A.cfg().nivelCambio.por === 'catalogo', 'T11 · «Quiero verlo todo ya» pasa a «Todo»');
  A.H.descAbrir([]); await sleep(20);
  ok(!/Quiero verlo todo ya/.test(hoja(e)), 'T11 · en «Todo» no sale «Quiero verlo todo ya»');

  /* T12 · la lupa, en los dos niveles */
  for (const ap of [{}, basicoApp()]) {
    e = env({ app: ap }); await sleep(150); A = e.A();
    const r = (q) => A.buscarResHtml(q);
    ok(/Descubre PalomApp/.test(r('descubre')) && /trayecto/i.test(r('trayecto')) && /Informes/.test(r('informes')) && /Inicio a tu gusto/.test(r('inicio a tu gusto')) && /Descubre PalomApp/.test(r('que puedo hacer')), 'T12 · la lupa encuentra Descubre, Trayecto, Informes e Inicio a tu gusto (' + A.nivel() + ')');
  }

  /* T13 · sugerencias */
  const conSug = (extra, movs, o) => env(Object.assign({ app: basicoApp(Object.assign({ empiezaOculto: HOY }, extra)), movs }, o || {}));
  e = conSug({}, tresGastos()); await sleep(200);
  ok(!e.doc.querySelector('#content .sug-card'), 'T13 · nunca el día 1');
  e = conSug({ altaApp: iso(-2) }, tresGastos()); await sleep(250); A = e.A();
  ok(/¿Qué se repite cada mes\?/.test(txt(e)) && e.doc.querySelectorAll('#content .sug-card').length === 1, 'T13 · día 3 con 3 gastos y sin fijos: «¿Qué se repite cada mes?» (una sola)');
  ok(A.cfg().sugHoy && A.cfg().sugHoy.d === HOY && A.cfg().sugHoy.k === 'fijos', 'T13 · se apunta en sugHoy después de pintar');
  click(e, 'sugNo', 'fijos'); await sleep(30);
  ok(A.cfg().sugerencias.fijos.n === 1 && A.cfg().sugerencias.fijos.hasta === iso(7) && !e.doc.querySelector('#content .sug-card'), '«Ahora no» la aplaza 7 días y ese día no sale otra (T13)');
  e = conSug({ altaApp: iso(-20), sugerencias: { fijos: { n: 1, hasta: iso(-1) } } }, tresGastos()); await sleep(250); A = e.A();
  ok(/¿Qué se repite cada mes\?/.test(txt(e)), 'T13 · pasados los 7 días vuelve');
  click(e, 'sugNo', 'fijos'); await sleep(30);
  ok(A.cfg().sugerencias.fijos.hasta === 'nunca', 'T13 · a la segunda «Ahora no», no vuelve nunca');
  e = conSug({ altaApp: iso(-2), sugHoy: { d: HOY, k: 'metas' } }, tresGastos()); await sleep(250);
  ok(!e.doc.querySelector('#content .sug-card'), 'T13 · una al día: si hoy ya salió otra, no sale esta');
  e = conSug({ altaApp: iso(-2), cobros: [{ nombre: 'Nómina', importe: 1200 }] }, tresGastos()); await sleep(250);
  ok(!/¿Qué se repite cada mes\?/.test(txt(e)), 'T13 · no sale si la herramienta ya está descubierta');
  e = env({ app: { altaApp: iso(-5), empiezaOculto: HOY }, movs: tresGastos() }); await sleep(250);
  ok(!e.doc.querySelector('#content .sug-card'), 'T13 · en «Todo» no hay sugerencias');
  const diez = Array.from({ length: 10 }, (_, i) => mov('Gasto', 10 + i, { categoria: i < 7 ? 'Supermercado' : 'Ocio' }));
  e = conSug({ altaApp: iso(-1) }, diez); await sleep(250); A = e.A();
  ok(/¿Ponemos un tope a lo que más gastas\?/.test(txt(e)) && /En Supermercado llevas 91,00 €/.test(txt(e)), 'T13 · 10 gastos en tu mes: «¿Ponemos un tope…?» con la categoría y lo que llevas');
  click(e, 'sugSi', 'presu'); await sleep(40);
  ok(A.cfg().sugerencias.presu.hecha === HOY && A.cfg().descubierto.presu === HOY && abierta(e), 'T13 · el botón principal la da por resuelta, marca la herramienta y abre el tope');
  e = conSug({ altaApp: iso(-1), cuentas: [{ id: 'k1', nombre: 'Banco', tipo: 'corriente', saldo: 900, fecha: iso(-1) }] }, []); await sleep(250); A = e.A();
  ok(/¿Ahorras para algo\?/.test(txt(e)), 'T13 · al día siguiente de poner el banco: «¿Ahorras para algo?»');
  click(e, 'sugSi', 'metas'); await sleep(40);
  ok(A.form().kind === 'meta' && A.cfg().descubierto.metas === HOY, 'T13 · «Crear meta» abre la meta nueva');
  const quince = Array.from({ length: 15 }, (_, i) => mov('Gasto', 5, { fecha: iso(-(i % 10)), categoria: 'Ocio' }));
  e = conSug({ altaApp: iso(-1), categoriasGasto: [{ nombre: 'Ocio', presupuesto: 300 }] }, quince); await sleep(250);
  ok(/¿Te cansas de apuntar\?/.test(txt(e)), 'T13 · 15 gastos a mano en 14 días: «¿Te cansas de apuntar?»');
  e = conSug({ altaApp: iso(-1) }, [mov('Gasto', 180, { descripcion: 'Cuota préstamo coche', fecha: iso(0) }), mov('Gasto', 180, { descripcion: 'Cuota préstamo coche', fecha: iso(-70) })]); await sleep(250); A = e.A();
  ok(/¿Estás pagando algo a plazos\?/.test(txt(e)), 'T13 · cuotas de préstamo en meses distintos: «¿Estás pagando algo a plazos?»');
  click(e, 'sugSi', 'deudas'); await sleep(40);
  ok(A.form().kind === 'deudaForm', 'T13 · «Apuntar deuda» abre la deuda nueva');
  const veinte = Array.from({ length: 20 }, (_, i) => mov('Ingreso', 10, { fecha: iso(-(i % 12)) }));
  e = conSug({ altaApp: iso(-13), informes: { on: { mes: false, anio: false } } }, veinte); await sleep(250); // sin aviso de informe, que comparte el hueco
  ok(/Pon en Inicio lo que más miras/.test(txt(e)), 'T13 · día 14 con 20 movimientos: «Pon en Inicio lo que más miras»');

  // dentro de un grupo con gasolina: la línea de la calculadora (una vez: al tocarla queda descubierta)
  const compGas = { id: 'c3', grupoId: 'g1', fecha: HOY, tipo: 'Gasto', categoria: 'Transporte', descripcion: 'Gasolina viaje', importe: 60, pagadoPor: 'uM', creadoPor: 'uM', reparto: { uY: 30, uM: 30 } };
  e = env({ app: basicoApp(), enGrupo: true, comps: [compGas] }); await sleep(250); A = e.A();
  A.H.histVolver(['g1']); await sleep(80);
  ok(/¿Ibais en coche\? Calcula la gasolina/.test(hoja(e)), 'T13 · en un grupo con gasolina: «¿Ibais en coche? Calcula la gasolina»');
  click(e, 'descProbar', 'trayecto'); await sleep(300);
  ok(A.form().kind === 'trayecto' && A.cfg().descubierto.trayecto === HOY, 'T13 · abre la calculadora y queda descubierta');
  A.H.closeSheet([]); await sleep(260); A.H.histVolver(['g1']); await sleep(80);
  ok(!/¿Ibais en coche/.test(hoja(e)), 'T13 · y ya no vuelve a salir');

  /* T14 · nada se guarda dentro de render() */
  e = conSug({ altaApp: iso(-2) }, tresGastos()); await sleep(5); A = e.A();
  let limpio = true;
  for (const tab of ['inicio', 'tu', 'movimientos', 'juntos', 'dinero']) { A.S.tab = tab; const c0 = A.S.config; A.render(); if (A.S.config !== c0) limpio = false; }
  A.S.tab = 'inicio'; const c1 = A.S.config; A.render(); A.openCrear(); A.H.descAbrir([]);
  ok(limpio && A.S.config === c1, 'T14 · ningún saveConfig durante render() (Inicio, Tú, Movimientos, Juntos, Dinero, + y catálogo)');
  await sleep(60); A.H.closeSheet([]);
  ok(A.cfg().sugHoy && A.cfg().sugHoy.d === HOY, 'T14 · sugHoy se guarda después, fuera de render()');

  /* T15 · a los 30 días */
  e = env({ app: basicoApp({ altaApp: iso(-30), nivelCambio: { d: iso(-30), por: 'alta' } }) }); await sleep(250); A = e.A();
  ok(A.cfg().nivel === 'todo' && A.cfg().nivelCambio.por === '30dias' && A.cfg().aviso30 === HOY, 'T15 · con «alta» y 30 días pasa sola a «Todo» y apunta aviso30');
  ok(/Ya llevas un mes con PalomApp/.test(txt(e)) && /Prefiero lo básico/.test(txt(e)) && /Editar Inicio/.test(txt(e)), 'T15 · la tarjeta en Inicio, con Inicio ya en «Todo»');
  A.revisarNivel30(); await sleep(20);
  ok(e.patches.filter((p) => p[1] && p[1].aviso30).length === 1, 'T15 · se hace una sola vez');
  click(e, 'aviso30Basico'); await sleep(30);
  ok(A.cfg().nivel === 'basico' && A.cfg().nivelCambio.por === 'tu' && !/Ya llevas un mes/.test(txt(e)), 'T15 · «Prefiero lo básico» vuelve con por «tu»');
  e = env({ app: { nivel: 'todo', nivelCambio: { d: iso(-1), por: '30dias' }, aviso30: iso(-1), altaApp: iso(-31) } }); await sleep(200);
  ok(!/Ya llevas un mes/.test(txt(e)), 'T15 · al día siguiente la tarjeta ya no sale');
  e = env({ app: basicoApp({ altaApp: iso(-40), nivelCambio: { d: iso(-40), por: 'tu' } }) }); await sleep(250); A = e.A();
  ok(A.cfg().nivel === 'basico', 'T15 · elegido a mano («tu»), no caduca');

  /* T16 · hoja «Qué ves en la app» */
  const otros = { nombre: 'Ana', categoriasGasto: [{ nombre: 'Ocio', presupuesto: 100 }], cuentas: [{ id: 'k1', nombre: 'Banco', tipo: 'corriente', saldo: 300, fecha: HOY }], empiezaOculto: HOY, asiVas: ['auto', 'auto', 'auto', 'auto', 'auto'] };
  e = env({ app: Object.assign({}, otros) }); await sleep(200); A = e.A();
  const antes = JSON.stringify(Object.assign({}, A.S.config, { nivel: undefined, nivelCambio: undefined }));
  A.H.goTab(['tu']); await sleep(10); click(e, 'nivelAbrir'); await sleep(20);
  ok(/Qué ves en la app/.test(hoja(e)) && /Lo básico/.test(hoja(e)) && /No se borra ni se pierde nada/.test(hoja(e)) && e.doc.querySelector('#sheetHost .av-op.on[data-click="nivelElegir|todo"]'), 'T16 · la hoja con «Lo básico» / «Todo» (marcado «Todo») y la nota');
  click(e, 'nivelElegir', 'basico'); click(e, 'nivelGuardar'); await sleep(40);
  ok(A.cfg().nivel === 'basico' && A.cfg().nivelCambio.por === 'tu' && A.cfg().nivelCambio.d === HOY, 'T16 · pasa a «Lo básico» con por «tu»');
  ok(JSON.stringify(Object.assign({}, A.S.config, { nivel: undefined, nivelCambio: undefined })) === antes && JSON.stringify(Object.assign({}, e.store.cfg.app, { nivel: undefined, nivelCambio: undefined, novedadesVistas: undefined })) === JSON.stringify(Object.assign({}, JSON.parse(antes), { novedadesVistas: undefined })), 'T16 · no cambia ningún otro dato de la configuración');
  click(e, 'nivelAbrir'); await sleep(20); click(e, 'nivelElegir', 'todo'); click(e, 'nivelGuardar'); await sleep(40);
  ok(A.cfg().nivel === 'todo' && A.cfg().nivelCambio.por === 'tu', 'T16 · y vuelve a «Todo»');

  /* T17 · pistas */
  e = env({ app: basicoApp({ altaApp: iso(-1), empiezaOculto: HOY }) }); await sleep(250); A = e.A();
  ok(e.doc.querySelector('#pistaHost .pista[data-pista="agenda"]') && /Tu agenda y tus tareas están aquí/.test(txt(e, '#pistaHost')), 'T17 · día 2: la pista de la agenda');
  A.openCrear(); await sleep(20);
  ok(!e.doc.querySelector('#pistaHost .pista'), 'T17 · nunca con una hoja abierta');
  A.H.closeSheet([]); await sleep(260); A.render(); await sleep(10);
  click(e, 'pistaOk', 'agenda'); await sleep(20);
  ok(A.cfg().pistasVistas.agenda === HOY && !e.doc.querySelector('#pistaHost .pista'), 'T17 · «Entendido» guarda pistasVistas');
  A.H.goTab(['tu']); await sleep(20);
  ok(!e.doc.querySelector('#pistaHost .pista'), 'T17 · una al día: hoy ya no sale la de Tú');
  e = env({ app: basicoApp({ altaApp: iso(-3), pistasVistas: { agenda: iso(-1) } }) }); await sleep(250); A = e.A(); A.H.goTab(['tu']); await sleep(20);
  ok(e.doc.querySelector('#pistaHost .pista[data-pista="tu"]') && /Aquí tienes todas las herramientas/.test(txt(e, '#pistaHost')), 'T17 · otro día, al entrar en Tú: «Aquí tienes todas las herramientas»');
  e = env({ app: { altaApp: iso(-3) } }); await sleep(250);
  ok(!e.doc.querySelector('#pistaHost .pista'), 'T17 · en «Todo» no hay pistas');

  /* T18 · ningún emoji en lo nuevo */
  e = conSug({ altaApp: iso(-2) }, tresGastos()); await sleep(250); A = e.A();
  const trozos = [htmlOb, htmlIni, e.doc.querySelector('#content').innerHTML];
  A.openCrear(); await sleep(10); A.H.crearMasToggle([]); await sleep(10); trozos.push(e.doc.querySelector('#sheetHost').innerHTML);
  A.H.descAbrir([]); await sleep(10); trozos.push(e.doc.querySelector('#sheetHost').innerHTML);
  A.H.nivelAbrir([]); await sleep(10); trozos.push(e.doc.querySelector('#sheetHost').innerHTML);
  A.H.closeSheet([]); await sleep(260); A.H.goTab(['tu']); await sleep(10); trozos.push(e.doc.querySelector('#content').innerHTML, e.doc.querySelector('#pistaHost').innerHTML);
  ok(trozos.every((h) => !EMOJI.test(sinSvg(h))), 'T18 · ningún emoji en Inicio, el +, el catálogo, «Qué ves en la app», Tú, las pistas y la bienvenida');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); console.log('CRASH ' + (x && x.stack)); process.exit(1); });

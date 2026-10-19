// Calidad · Bienvenida (19/10/2026, docs/08-asistente.md): casos raros.
// Guardar con la red de verdad (leer y luego escribir, con espera), saldo del banco y movimientos del mismo día,
// importes y días raros, nombre vacío o larguísimo, doble toque, invitación sin red / caducada / «Atrás» tras unirse,
// repetir la bienvenida con fijos de otro nombre, persona sin cuenta (?soy=), usuarios actuales y novedades.
// Servidor simulado. Datos inventados.
// Las comprobaciones con ok() que fallan son fallos de la app que debe arreglar Desarrollo.
// Las líneas «PEND» son fallos leves conocidos: no hacen fallar la prueba; cuando se arreglen saldrá «ARREGLADO».
console.error = () => {};
const fs = require('fs'), path = require('path');
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pend = (c, m) => console.log((c ? 'ARREGLADO (cambiar por ok) ' : 'PEND ') + m);
const TOKEN = 'INVITA1234567890abcdef', SOY = 'SOYSOY1234567890abcdef';
const HOY = new Date().toISOString().slice(0, 10);

// opts: cfg (config de partida), url, lento (config/app como en data-layer.js: lee, espera, escribe), sinRed (ver_invitacion falla)
function env(uid, opts) {
  opts = opts || {};
  const DB = { grupos: [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', reparto: null, edicion: 'todos', created_at: '2026-10-01' }],
    miembros: [{ grupo_id: 'g1', user_id: 'uM', nombre: 'Marta', rol: 'admin', created_at: '2026-10-01' }], unirse: 0, verInv: 0 };
  const activo = (g) => DB.miembros.some((m) => m.grupo_id === g && m.user_id === uid);
  const e = makeEnv({ url: opts.url || 'https://urlife-zeta.vercel.app/', cfg: opts.cfg || {}, movs: opts.movs, session: { user: { email: 'prueba@ejemplo.com', id: uid } }, pre: (w) => {
    w.history.replaceState = () => {};
    const ls = {}; Object.defineProperty(w, 'localStorage', { value: { getItem: (k) => (ls[k] == null ? null : ls[k]), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, configurable: true });
  } });
  const orig = e.w.Data;
  const doc = (p) => {
    const d = orig.doc(p), k = p.split('/')[1];
    if (!opts.lento || k !== 'app') return d;
    // como data-layer.js: update = leer la fila, mezclar y volver a escribir (dos viajes por la red)
    // opts.lento puede ser una función (partial) => ms de espera antes de escribir, para cambiar el orden de llegada
    return Object.assign({}, d, { update: async (partial) => { const leido = JSON.parse(JSON.stringify(e.store.cfg[k] || {})); await sleep(25); await sleep(typeof opts.lento === 'function' ? opts.lento(partial) : 25); e.store.cfg[k] = Object.assign({}, leido, partial); } });
  };
  e.w.Data = Object.assign({}, orig, {
    doc,
    uid: () => uid,
    grupos: { listar: async () => ({ grupos: DB.grupos.filter((g) => activo(g.id)), miembros: DB.miembros.filter((m) => activo(m.grupo_id)), sinCuenta: [] }), invitaciones: async () => [] },
    compartidos: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; }, crear: async () => { throw new Error('no'); }, editar: async () => { throw new Error('no'); }, borrar: async () => { throw new Error('no'); } },
    objetivos: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    aportes: { suscribir: (next) => { setTimeout(() => next([]), 0); return () => {}; } },
    rpc: async (fn, p) => {
      if (fn === 'ver_invitacion') { DB.verInv++; if (opts.sinRed) throw new Error('Failed to fetch'); return p.p_token === TOKEN ? (activo('g1') ? { valida: false, motivo: 'ya_miembro', nombre: 'Piso', grupo: 'g1' } : { valida: true, tipo: 'grupo', nombre: 'Piso', invita: 'Marta', miembros: 1, grupo: 'g1' }) : { valida: false, motivo: 'caducada' }; }
      if (fn === 'unirse') { DB.unirse++; if (activo('g1')) throw new Error('ya_miembro'); DB.miembros.push({ grupo_id: 'g1', user_id: uid, nombre: p.p_nombre, rol: 'miembro', created_at: HOY }); return 'g1'; }
      if (fn === 'ver_enlace_sin_cuenta') return { valida: true, nombre: 'Lu', nombre_grupo: 'Piso', gastos: 0 };
      throw new Error('?' + fn);
    },
  });
  return { e, DB };
}
const txt = (e) => e.doc.querySelector('#app').textContent.replace(/\s+/g, ' ');
const sh = (e) => (e.doc.querySelector('#sheetHost') || { textContent: '' }).textContent.replace(/\s+/g, ' ');
const pasoDe = (e) => { const b = e.doc.querySelector('.ob2-body'); return b ? (b.className.match(/ob2-p-(\w+)/) || [])[1] : null; };

(async () => {
  /* ---------- 1. «Saltar» guarda lo hecho… también con la red de verdad ---------- */
  {
    const { e } = env('u1', { lento: true }); await sleep(150); const A = e.w.__APP__, ob = () => A.S.onboarding;
    ok(ob() && pasoDe(e) === 'hola', 'usuario nuevo: sale la bienvenida');
    ob().nombre = 'Ana'; A.H.obNext([]); await sleep(150);
    ob().saldo = '1.240,50';
    await A.H.obFinish(['']); await sleep(400);
    const a = e.store.cfg.app || {}, cs = a.cuentas || [];
    ok(cs.length === 1 && cs[0].saldo === 1240.5 && a.compararVersiones === false && a.novedadesVistas, 'GRAVE «Saltar» en el banco con la red real (leer y escribir): se guardan a la vez la cuenta y «sin novedades ni Antes» (en el servidor: ' + cs.length + ' cuentas, «Antes» ' + (a.compararVersiones === false ? 'oculto' : 'visible') + ', novedades ' + (a.novedadesVistas ? 'vistas' : 'sin ver') + ')');
    ok((e.store.cfg.app || {}).nombre === 'Ana', 'el nombre del paso 1 sigue guardado');
  }
  {
    const { e } = env('u2', { lento: true }); await sleep(150); const A = e.w.__APP__, ob = () => A.S.onboarding;
    A.H.obNext([]); await sleep(150); A.H.obNext(['no']); await sleep(150);
    A.H.obNomina([]); ob().nomina.importe = '1.850'; ob().nomina.dia = '5'; A.H.obFijo(['Luz']);
    await A.H.obFinish(['']); await sleep(400);
    const a = e.store.cfg.app || {};
    ok((a.cobros || []).some((x) => x.nombre === 'Nómina' && x.importe === 1850) && (a.facturas || []).some((x) => x.nombre === 'Luz') && a.compararVersiones === false && a.novedadesVistas, 'GRAVE «Saltar» en «Cada mes» con la red real: se guardan la nómina, la luz y «sin novedades ni Antes» (cobros: ' + (a.cobros || []).length + ', facturas: ' + (a.facturas || []).length + ', «Antes» ' + (a.compararVersiones === false ? 'oculto' : 'visible') + ')');
  }
  {
    // la misma carrera, si la respuesta del servidor llega en el otro orden: entonces lo que se pierde es la cuenta
    const { e } = env('u2b', { lento: (p) => ('cuentas' in p ? 10 : 40) }); await sleep(150); const A = e.w.__APP__, ob = () => A.S.onboarding;
    A.H.obNext([]); await sleep(150); ob().saldo = '1.240,50';
    await A.H.obFinish(['']); await sleep(400);
    const cs = (e.store.cfg.app || {}).cuentas || [];
    ok(cs.length === 1, 'GRAVE … y si la red responde en el otro orden, se pierde la cuenta del banco que acaba de poner (en el servidor: ' + cs.length + ' cuentas)');
  }
  {
    // mismo caso sin espera de red (como las pruebas de Desarrollo): aquí sí se guarda
    const { e } = env('u3'); await sleep(150); const A = e.w.__APP__, ob = () => A.S.onboarding;
    A.H.obNext([]); ob().saldo = '300'; await A.H.obFinish(['']); await sleep(100);
    ok(((e.store.cfg.app || {}).cuentas || []).length === 1, 'sin espera de red, «Saltar» en el banco sí guarda (por eso las pruebas de Desarrollo no lo ven)');
  }

  /* ---------- 2. Saldo del banco y lo que se apunta el mismo día ---------- */
  {
    const { e } = env('u4'); await sleep(150); const A = e.w.__APP__, ob = () => A.S.onboarding;
    A.H.obNext([]); ob().saldo = '1000'; A.H.obNext([]); await sleep(30);
    const c = A.cfg().cuentas[0];
    ok(c && c.saldo === 1000 && c.fecha === HOY, 'la cuenta empieza hoy con 1.000 €');
    // «Apuntar mi primer gasto» justo después: un gasto de 20 € con fecha de hoy
    A.S.movimientos = [{ id: 'm1', tipo: 'Gasto', importe: 20, categoria: 'Alimentación', fecha: HOY, creadoEn: Date.now() + 1000 }];
    ok(A.saldoCuenta(c) === 980, 'GRAVE el primer gasto de hoy resta del banco puesto en la bienvenida (sale ' + A.saldoCuenta(c) + ' €: falta la hora del saldo, «ts», como hace la hoja de cuentas)');
    A.S.movimientos = [];
  }

  /* ---------- 3. Importes y días raros ---------- */
  {
    const casos = [['1.240,50', 1240.5], ['1240.5', 1240.5], ['1240,5', 1240.5], ['8.000', 8000], ['-35,20', -35.2], ['0', 0], ['  2 000 € ', 2000]];
    for (const [s, v] of casos) {
      const { e } = env('u5'); await sleep(120); const A = e.w.__APP__, ob = () => A.S.onboarding;
      A.H.obNext([]); ob().saldo = s; A.H.obNext([]); await sleep(20);
      const cs = A.cfg().cuentas || [];
      ok(cs.length === 1 && cs[0].saldo === v, 'saldo «' + s + '» se lee como ' + v + ' (sale ' + (cs[0] ? cs[0].saldo : 'sin cuenta') + ')');
    }
    {
      const { e } = env('u6'); await sleep(120); const A = e.w.__APP__, ob = () => A.S.onboarding;
      A.H.obNext([]); ob().saldo = ''; A.H.obNext([]); await sleep(20);
      ok(!(A.cfg().cuentas || []).length, 'saldo vacío: no se crea ninguna cuenta (ni a 0 €)');
    }
    {
      const { e } = env('u7'); await sleep(120); const A = e.w.__APP__, ob = () => A.S.onboarding;
      A.H.obNext([]); ob().saldo = 'mil euros'; A.H.obNext([]); await sleep(20);
      pend((A.cfg().cuentas || []).length || /revisa|cantidad|número/i.test(txt(e) + sh(e)) || pasoDe(e) === 'banco', 'leve: saldo «mil euros» se ignora en silencio y pasa al paso siguiente sin avisar');
    }
    {
      const { e } = env('u8'); await sleep(120); const A = e.w.__APP__, ob = () => A.S.onboarding;
      A.H.obNext([]); ob().saldo = '1,240.50'; A.H.obNext([]); await sleep(20);
      pend(((A.cfg().cuentas || [])[0] || {}).saldo === 1240.5, 'leve: «1,240.50» (formato inglés, p. ej. copiado de un banco en inglés) se lee como ' + ((A.cfg().cuentas || [])[0] || {}).saldo + ' €');
    }
    for (const [dia, esperado] of [['0', null], ['32', null], ['31', 31], ['28a', null], ['1', 1]]) {
      const { e } = env('u9'); await sleep(120); const A = e.w.__APP__, ob = () => A.S.onboarding;
      A.H.obNext([]); A.H.obNext(['no']); A.H.obNomina([]); ob().nomina.importe = '1500'; A.H.obNomDia([], { value: dia }); A.H.obNext([]); await sleep(20);
      const n = (A.cfg().cobros || []).find((x) => x.nombre === 'Nómina') || {};
      if (esperado == null && dia !== '28a') {
        ok(n.diaDelMes == null && !n.regla, 'día «' + dia + '»: no se inventa un día');
        pend(false, 'leve: día «' + dia + '» se descarta en silencio (la nómina queda «Sin fecha» sin decírselo)');
      } else if (dia === '28a') pend(n.diaDelMes == null, 'leve: día «28a» se acepta como 28 sin avisar');
      else ok(n.diaDelMes === esperado && n.regla && n.regla.dia === esperado, 'día «' + dia + '» se guarda');
    }
  }

  /* ---------- 4. Nombre vacío, de espacios o larguísimo (con símbolos) ---------- */
  {
    const { e } = env('u10'); await sleep(120); const A = e.w.__APP__, ob = () => A.S.onboarding;
    ob().nombre = '   '; A.H.obNext([]); await sleep(20);
    ok(!A.cfg().nombre, 'nombre de solo espacios: no se guarda');
    A.H.obBack([]); ob().nombre = 'A'.repeat(70); A.H.obNext([]); await sleep(20);
    ok(A.cfg().nombre && A.cfg().nombre.length === 40, 'nombre larguísimo: se corta a 40 letras');
    A.H.obBack([]); ob().nombre = '<b>Ana & "Luis"</b>'; A.H.obNext([]); A.H.obNext(['no']); A.H.obNext(['no']); await sleep(20);
    ok(!e.doc.querySelector('.ob2-h b') && /Todo listo, <b>Ana/.test(txt(e)), 'nombre con símbolos: se enseña como texto, sin romper la pantalla');
  }

  /* ---------- 5. Doble toque ---------- */
  {
    const { e } = env('u11'); await sleep(120); const A = e.w.__APP__, ob = () => A.S.onboarding;
    A.H.obNext([]); ob().saldo = '500';
    const sig = () => e.doc.querySelector('.ob2-pie [data-click="obNext"]');
    sig().click(); sig().click(); await sleep(20); // dos toques seguidos en el mismo sitio
    ok((A.cfg().cuentas || []).length === 1, 'doble toque en «Siguiente»: una sola cuenta');
    pend(pasoDe(e) === 'mes', 'leve: doble toque en «Siguiente» se salta «¿Qué se repite cada mes?» (el segundo toque cae en el «Siguiente» del paso nuevo; va a «' + pasoDe(e) + '»)');
  }
  {
    const { e } = env('u12'); await sleep(120); const A = e.w.__APP__;
    A.H.obNext(['no']); A.H.obNext(['no']); A.H.obNext(['no']); await sleep(10);
    const p1 = A.H.obFinish(['']), p2 = A.H.obFinish(['']); await p1; await p2; await sleep(600);
    ok(!A.S.onboarding && e.store.cfg.meta.onboarded, 'doble toque en «Ir a Inicio»: termina una vez');
    ok(!/se ha actualizado/i.test(sh(e)), 'al terminar no sale la ventana de novedades');
    ok(e.store.cfg.app.compararVersiones === false && !/Antes/.test((e.doc.querySelector('.cmp-btn, .comparar') || { textContent: '' }).textContent), 'usuario nuevo: sin botón «Antes»');
  }
  {
    const { e, DB } = env('u13', { url: 'https://urlife-zeta.vercel.app/?unirse=' + TOKEN }); await sleep(150); const A = e.w.__APP__;
    ok(pasoDe(e) === 'invite' && /Unirme al grupo/.test(txt(e)), 'con invitación: empieza por ella');
    const p1 = A.H.obUnirse([]), p2 = A.H.obUnirse([]); await p1; await p2; await sleep(30);
    ok(DB.unirse === 1 && DB.miembros.filter((m) => m.user_id === 'u13').length === 1, 'doble toque en «Unirme al grupo»: se une una sola vez');
    ok(pasoDe(e) === 'banco' && /Ya estás en Piso/.test(txt(e)), 'tras unirse: «Ya estás en Piso» y el banco');
    /* «Atrás» después de unirse */
    A.H.obBack([]); await sleep(10);
    pend(!/Unirme al grupo/.test(txt(e)), 'leve: tras unirse, «Atrás» vuelve a enseñar la invitación con «Unirme al grupo» activo (al tocarlo el servidor da error)');
    if (/Unirme al grupo/.test(txt(e))) { await A.H.obUnirse([]); await sleep(30); pend(DB.unirse === 1, 'leve: … y se vuelve a llamar a «unirse» (llamadas: ' + DB.unirse + ')'); }
  }

  /* ---------- 6. Invitación: sin red, «Ahora no», aviso en Inicio ---------- */
  {
    const { e } = env('u14', { url: 'https://urlife-zeta.vercel.app/?unirse=' + TOKEN, sinRed: true }); await sleep(150); const A = e.w.__APP__;
    ok(pasoDe(e) === 'invite' && /No hemos podido abrir esta invitación/.test(txt(e)), 'sin red: lo dice y deja seguir');
    pend(/conexi|red|internet/i.test(txt(e)), 'leve: sin red el texto no sugiere revisar la conexión (dice lo mismo que un enlace roto)');
    click(e, 'obInvAplazar', 'mal'); await sleep(10);
    pend(!!e.w.localStorage.getItem('unirse'), 'medio: sin red, «Seguir sin unirme» borra el enlace de la invitación: luego no sale el aviso en Inicio y hay que volver a abrir el enlace de WhatsApp');
  }
  {
    const { e, DB } = env('u15', { url: 'https://urlife-zeta.vercel.app/?unirse=' + TOKEN }); await sleep(150); const A = e.w.__APP__;
    A.H.obInvAplazar([]); await sleep(10);
    ok(pasoDe(e) === 'hola', '«Ahora no» a la invitación: bienvenida normal');
    await A.H.obFinish(['']); await sleep(400);
    const c = e.doc.querySelector('#content').textContent;
    ok(/Marta te ha invitado a Piso/.test(c), 'en Inicio: «Marta te ha invitado a Piso»');
    ok(!/se ha actualizado/i.test(sh(e)) && !e.doc.querySelector('#sheetHost .unirse-card'), 'ni novedades ni la invitación saltan solas');
    const antes = DB.verInv; A.H.invVer([]); A.H.invVer([]); await sleep(60);
    pend(DB.verInv - antes === 1, 'leve: doble toque en «Ver invitación» pide la invitación ' + (DB.verInv - antes) + ' veces (invVer pone _uniendo a false)');
    A.H.closeSheet([]); await sleep(260);
    A.H.invDescartar([]); await sleep(10);
    ok(!/te ha invitado/.test(e.doc.querySelector('#content').textContent) && !e.w.localStorage.getItem('unirse'), '«Descartar» quita el aviso y olvida el enlace');
  }

  /* ---------- 7. Persona sin cuenta (?soy=) que entra por primera vez ---------- */
  {
    const { e } = env('u16', { url: 'https://urlife-zeta.vercel.app/?soy=' + SOY }); await sleep(150); const A = e.w.__APP__;
    ok(A.S.onboarding && pasoDe(e) === 'hola' && !e.doc.querySelector('#sheetHost .unirse-card'), '?soy=: primero la bienvenida, sin la hoja encima');
    A.H.obNext(['no']); A.H.obNext(['no']); A.H.obNext(['no']); await sleep(10);
    await A.H.obFinish(['gasto']); await sleep(700);
    const s = sh(e);
    pend(/Te han guardado un sitio/.test(s), 'medio: ?soy= + «Apuntar mi primer gasto»: la hoja «Te han guardado un sitio» queda tapada por la de apuntar (sale: ' + (/Te han guardado un sitio/.test(s) ? 'sitio' : /Gasto|Importe/.test(s) ? 'apuntar' : 'nada') + '); además se queda bloqueada hasta volver a abrir la app');
  }

  /* ---------- 8. Repetir la bienvenida: nada se duplica ni se pierde ---------- */
  {
    const base = { app: { categoriasGasto: [{ nombre: 'Golf', presupuesto: 50 }], ingresos: ['Sueldo'], mesInicio: { modo: 'cobro', dia: 28 },
      cuentas: [{ id: 'c1', nombre: 'Mi banco', tipo: 'corriente', saldo: 900, fecha: '2026-10-01', principal: true }],
      cobros: [{ nombre: 'Sueldo', importe: 1800, diaDelMes: 28, regla: { t: 'dia', dia: 28 } }],
      facturas: [{ nombre: 'Alquiler piso', importe: 700, diaDelMes: 1, regla: { t: 'dia', dia: 1 } }],
      deudas: [{ id: 'd1', nombre: 'Coche', objetivo: 5000 }], nombre: 'Ana', compararVersiones: true }, meta: { onboarded: true } };
    const { e } = env('u17', { cfg: JSON.parse(JSON.stringify(base)) }); await sleep(150); const A = e.w.__APP__, ob = () => A.S.onboarding;
    ok(!A.S.onboarding, 'usuario actual: no ve la bienvenida');
    A.H.startOnboardingManually([]); await sleep(10);
    ok(/Así es PalomApp/.test(txt(e)) && ob().nombre === 'Ana', 'repetir: «Así es PalomApp» con su nombre');
    A.H.obNext([]); await sleep(10);
    ok(/Mi banco/.test(txt(e)) && /Tus cuentas/.test(txt(e)), 'repetir: enseña sus cuentas');
    ob().saldo = '5'; ob().cuentaNombre = 'Mi banco'; A.H.obNext([]); await sleep(10);
    ok(A.cfg().cuentas.length === 1 && A.cfg().cuentas[0].saldo === 900, 'repetir: no cambia el saldo de su banco');
    const vio = /Sueldo/.test(txt(e)) && /Alquiler piso/.test(txt(e));
    A.H.obNomina([]); ob().nomina.importe = '1800'; A.H.obNomDia([], { value: '28' }); A.H.obFijo(['Alquiler']); ob().fijos[0].importe = '700'; ob().fijos[0].dia = '1';
    A.H.obNext([]); A.H.obFinish(['']); await sleep(100);
    const a = e.store.cfg.app, pv = A.previstoMes(A.mesActual().y, A.mesActual().m);
    ok(vio || (a.cobros.length === 1 && a.facturas.length === 1), 'MEDIO repetir con un «Sueldo» y un «Alquiler piso» ya guardados: el paso «Cada mes» no los enseña y deja añadir «Nómina» y «Alquiler» otra vez (cobros: ' + a.cobros.map((x) => x.nombre).join(', ') + ' · pagos: ' + a.facturas.map((x) => x.nombre).join(', ') + '): la previsión cuenta dos sueldos');
    ok(a.mesInicio.modo === 'cobro' && a.mesInicio.dia === 28, 'repetir: «tu mes» (del 28) no cambia');
    ok(JSON.stringify(a.categoriasGasto) === JSON.stringify(base.app.categoriasGasto) && JSON.stringify(a.deudas) === JSON.stringify(base.app.deudas) && a.compararVersiones === true && a.nombre === 'Ana', 'repetir: categorías, deudas, «Antes» y nombre intactos');
    void pv;
  }
  {
    // usuario actual que solo tiene cuentas (sin categorías propias) y sin la marca de «ya visto»
    const { e } = env('u18', { cfg: { app: { cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 10, fecha: '2026-10-01' }] } } }); await sleep(150);
    ok(!e.w.__APP__.S.onboarding && e.store.cfg.meta && e.store.cfg.meta.onboarded, 'usuario con cuentas: no ve la bienvenida y queda marcado');
  }
  {
    // usuario actual con invitación: sigue como antes (la hoja de unirse), sin bienvenida
    const { e } = env('u19', { url: 'https://urlife-zeta.vercel.app/?unirse=' + TOKEN, cfg: { app: { categoriasGasto: [{ nombre: 'Golf' }] }, meta: { onboarded: true } } }); await sleep(250);
    ok(!e.w.__APP__.S.onboarding && /Te han invitado a un grupo/.test(sh(e)), 'usuario actual con invitación: hoja de unirse de siempre, sin bienvenida');
  }

  /* ---------- 9. Inicio de quien empieza ---------- */
  {
    const { e } = env('u20'); await sleep(150); const A = e.w.__APP__, ob = () => A.S.onboarding;
    A.H.obNext([]); ob().saldo = '1.240,50'; A.H.obNext([]); A.H.obNext(['no']); await A.H.obFinish(['']); await sleep(400);
    const c = e.doc.querySelector('#content').textContent;
    ok(/En tu banco hoy/.test(c) && /1240|1\.240/.test(c), 'Inicio: «En tu banco hoy» con 1.240,50 €');
    ok(/Del 1 al 31|Octubre|· /.test(c), 'Inicio: el mes sigue saliendo');
  }

  /* ---------- 10. Accesibilidad básica (tamaños de toque y etiquetas) ---------- */
  {
    const css = fs.readFileSync(path.join(__dirname, '..', 'look.css'), 'utf8');
    const alto = (sel) => { const m = css.split('\n').find((l) => l.includes(sel + ' {') || l.includes(sel + ' .btn {')); const x = m && m.match(/min-height:\s*(\d+)px/); return x ? Number(x[1]) : null; };
    ok(alto('.ob2-saltar') >= 44 && alto('.ob2-ic') == null ? true : alto('.ob2-saltar') >= 44, '«Saltar» / «Ahora no» miden 44 px o más');
    pend(!/\.ob2-body \.chips \.chip \{ min-height: 4[0-3]px/.test(css), 'leve: las fichas (Nómina, Alquiler, Luz…) miden 40 px de alto (mínimo recomendado 44)');
    pend(!/\.inv-ini-b \.btn \{ min-height: 3\dpx/.test(css), 'leve: «Ver invitación» y «Descartar» en Inicio miden 38 px');
    const { e } = env('u21'); await sleep(150); const A = e.w.__APP__;
    A.H.obNext([]); await sleep(10);
    const inputs = [...e.doc.querySelectorAll('.ob2-body input')];
    const conNombre = (i) => i.getAttribute('aria-label') || (i.id && e.doc.querySelector('label[for="' + i.id + '"]')) || i.closest('label');
    pend(inputs.every(conNombre), 'leve: «Nombre de la cuenta» no está unido a su etiqueta (un lector de pantalla no lo lee): ' + inputs.filter((i) => !conNombre(i)).map((i) => i.id).join(', '));
  }

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH ' + (x && x.stack)); process.exit(1); });

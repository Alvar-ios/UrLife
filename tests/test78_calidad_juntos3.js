// Calidad · Juntos v3 y «Pago fijo» (23/10/2026). Datos inventados: nombres de pila sueltos e importes de ejemplo.
// Mira: personas sin cuenta que luego se unen (alias), grupos directos, yo nunca en los círculos, muchas personas,
// nombres largos, importes de menos de 1 €, «N nuevas» (ni lo mío ni lo antiguo, y que no baile), accesibilidad
// y que no queden «Gasto fijo» / «Factura o pago» a la vista.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const m = (u, n, x) => Object.assign({ user_id: u, nombre: n, rol: 'miembro' }, x || {});
const C = (id, g, pag, imp, rep, by, at, desc) => ({ id, grupoId: g, fecha: at.slice(0, 10), tipo: 'Gasto', categoria: 'Casa', descripcion: desc || id, importe: imp, pagadoPor: pag, reparto: rep, modo: 'igual', creadoPor: by || pag, createdAt: at });
const LARGO = 'Maximiliano Fernández de la Vega';

function preparar(e, grupos, comps, misAlias) {
  const A = e.w.__APP__, S = A.S;
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null, compartidos: (S.db && S.db.compartidos) || {} });
  S.grupos = grupos; S.compartidos = comps; S._misAlias = new Set(misAlias || []); S._ef = null;
}
const circulos = (doc) => [...doc.querySelectorAll('.jv3-circ .jv-c')];
const nombreC = (x) => x.querySelector('.ins-l1').textContent;
const uidC = (x) => decodeURIComponent((x.getAttribute('data-click') || '').split('|')[1] || '');

(async () => {
  /* ---------- 1. Alias, grupos directos, yo nunca en los círculos, muchas personas, nombres largos ---------- */
  {
    const e = makeEnv({ cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }], vistoJuntos: '2026-10-10T00:00:00.000Z' }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc;
    const yo = m('uYo', 'Lucía', { rol: 'admin' });
    // Piso: Bea ocupó el sitio de «Bea (sin app)» (sc1) y yo el de «Lucía (sin app)» (sc9); Tía Rosa sigue sin cuenta (sc2)
    const g1 = { id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: { sc1: 'uB', sc9: 'uYo' }, miembros: [yo, m('uA', 'Ana'), m('uB', 'Bea'), m('sc2', 'Tía Rosa', { rol: 'sin_cuenta', sinCuenta: true })] };
    g1.todos = g1.miembros.concat([m('sc1', 'Bea (sin app)', { sinCuenta: true }), m('sc9', 'Lucía (sin app)', { sinCuenta: true })]);
    const d1 = { id: 'd1', nombre: 'Lucía y Ana', tipo: 'directo', alias: {}, miembros: [yo, m('uA', 'Ana')] }; d1.todos = d1.miembros;
    const d2 = { id: 'd2', nombre: 'Invitación', tipo: 'directo', alias: {}, miembros: [yo] }; d2.todos = d2.miembros; // invitación sin aceptar
    const pad = ['Pablo', 'Quique', 'Raúl', LARGO, 'Sara', 'Teo', 'Úrsula', 'Vera', 'Wanda', 'Xavi'];
    const g2 = { id: 'g2', nombre: 'Pádel de los jueves por la tarde', tipo: 'grupo', alias: {}, miembros: [yo].concat(pad.map((n, i) => m('p' + i, n))) }; g2.todos = g2.miembros;
    const rep2 = { uYo: 10 }; for (let i = 0; i < 9; i++) rep2['p' + i] = 10;
    preparar(e, [d1, d2, g2, g1], [
      C('k1', 'g1', 'uYo', 90, { uYo: 30, uA: 30, sc1: 30 }, 'uYo', '2026-10-01T10:00:00.000Z', 'Compra'),
      C('k2', 'g1', 'sc9', 30, { sc9: 10, uB: 10, sc2: 10 }, 'sc9', '2026-10-02T10:00:00.000Z', 'Limpieza'),
      C('k3', 'd1', 'uA', 0.8, { uYo: 0.4, uA: 0.4 }, 'uA', '2026-10-15T10:00:00.000Z', 'Chicle'),
      C('k4', 'g2', 'p3', 100, rep2, 'p3', '2026-10-16T10:00:00.000Z', 'Pistas')], ['sc9']);
    H.goTab(['juntos']); await sleep(40);
    let cs = circulos(doc), ns = cs.map(nombreC), us = cs.map(uidC);
    ok(!us.includes('uYo') && !us.includes('sc9') && !ns.some((n) => /Lucía/.test(n)), 'Personas: yo no salgo en los círculos, ni con mi sitio de «sin app» (' + ns.join(', ') + ')');
    ok(new Set(us).size === us.length && new Set(ns).size === ns.length, 'Personas: nadie sale repetido');
    ok(ns.filter((n) => n === 'Bea').length === 1 && !us.includes('sc1') && !ns.some((n) => /sin app/.test(n)), 'Bea, que ocupó el sitio de «Bea (sin app)», sale una sola vez y con su nombre');
    const bea = cs.find((x) => nombreC(x) === 'Bea');
    ok(bea && bea.classList.contains('bueno') && /40 €/.test(bea.textContent), 'a Bea se le suma lo de antes y lo de después de unirse: te debe 40 €');
    ok(ns.filter((n) => n === 'Ana').length === 1, 'Ana (en el Piso y a solas) sale una sola vez');
    ok(ns.includes('Tía Rosa'), 'la persona sin cuenta que debe también sale');
    ok(cs.length === 13 && doc.querySelector('.jv3-circ').classList.contains('muchos'), 'con 13 personas salen todas y la fila se puede deslizar (clase «muchos»)');
    const pazIdx = cs.findIndex((x) => x.classList.contains('paz'));
    ok(pazIdx > 0 && cs.slice(pazIdx).every((x) => x.classList.contains('paz')), 'quien está en paz va al final, todo seguido');
    ok(cs.slice(pazIdx).every((x) => x.querySelector('.jv-c-ok') && !x.querySelector('.ins-aro-v')), 'en paz: con ✓ y sin aro de color');
    const lg = cs.find((x) => nombreC(x) === LARGO);
    ok(lg && (lg.getAttribute('aria-label') || '').indexOf(LARGO) === 0, 'nombre largo: entero en el texto y en lo que lee el lector de pantalla (el corte lo hace el diseño)');
    ok(cs.every((x) => x.tagName === 'BUTTON' && /: /.test(x.getAttribute('aria-label') || '')), 'cada círculo es un botón con nombre y estado para el lector de pantalla');
    // importe de menos de 1 € (Ana a solas: le debes 0,40 €)
    H.juntosVer(['grupos']); await sleep(20);
    cs = circulos(doc); ns = cs.map(nombreC);
    ok(ns.length === 3 && ns.includes('Pádel de los jueves por la tarde') && ns.includes('Piso') && ns.includes('Ana') && !ns.includes('Invitación pendiente'), 'Grupos: Pádel, Piso y el grupo directo con el nombre de la persona; sin la invitación pendiente (' + ns.join('|') + ')');
    ok(cs.every((x) => /debes|te deben|en paz/.test(x.querySelector('.ins-l2').textContent)), 'Grupos: cada círculo dice «debes», «te deben» o «en paz»');
    const ana = cs.find((x) => nombreC(x) === 'Ana');
    ok(ana && ana.querySelector('.jv-c-cara .cara') && !ana.querySelector('.jv-c-gr'), 'el grupo directo lleva la cara de la persona, no unas iniciales de grupo');
    ok(ana && ana.classList.contains('malo') && /debes/.test(ana.textContent), 'el grupo directo con Ana: «debes», en rojo');
    const cifra = ana && ana.querySelector('.ins-aro b');
    ok(cifra && !/^0 €$/.test(cifra.textContent.trim()), 'una deuda de 0,40 € no se enseña como «0 €» dentro del círculo (sale: «' + (cifra ? cifra.textContent : '') + '»)');
    ok(doc.querySelector('.jv3-seg [role="tab"][aria-selected="true"]').textContent === 'Grupos', 'el selector dice al lector de pantalla cuál está elegido');
    H.juntosVer(['personas']); await sleep(20);
  }

  /* ---------- 2. Usuario nuevo y grupos sin gastos ---------- */
  {
    const e = makeEnv({ cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }] }, meta: { onboarded: true } } });
    await sleep(80);
    const H = e.w.__APP__.H, doc = e.doc;
    preparar(e, [], []);
    H.goTab(['juntos']); await sleep(30);
    ok(doc.querySelector('.jv-vacio') && /Comparte gastos con quien quieras/.test(doc.querySelector('#content').textContent) && !doc.querySelector('.jv3-circ'), 'sin grupos ni gastos: la bienvenida de Juntos, sin círculos vacíos');
    const yo = m('uYo', 'Lucía', { rol: 'admin' });
    const g = { id: 'g1', nombre: 'Casa', tipo: 'grupo', alias: {}, miembros: [yo, m('uA', 'Ana')] }; g.todos = g.miembros;
    const solo = { id: 'g3', nombre: 'Viaje', tipo: 'grupo', alias: {}, miembros: [yo] }; solo.todos = solo.miembros;
    preparar(e, [g, solo], []); e.w.__APP__.render(); await sleep(30);
    const t = doc.querySelector('#content').textContent;
    ok(/Aún no habéis compartido gastos/.test(t) && !/NaN|undefined/.test(t), 'con grupo pero sin gastos: «Aún no habéis compartido gastos»');
    ok(circulos(doc).map(nombreC).join(',') === 'Ana' && !doc.querySelector('.section-title.jv-act, .jv-act'), 'sale Ana en paz y no hay bloque de actividad vacío');
    H.juntosVer(['grupos']); await sleep(20);
    ok(circulos(doc).length === 2, 'Grupos: también el grupo en el que aún estás solo');
    H.juntosVer(['personas']); await sleep(10);
  }

  /* ---------- 3. «N nuevas»: ni lo mío ni lo antiguo, y que no baile ---------- */
  {
    const e = makeEnv({ cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }], vistoJuntos: '2026-10-10T00:00:00.000Z' }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S;
    const yo = m('uYo', 'Lucía', { rol: 'admin' });
    const g = { id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: { sc9: 'uYo' }, miembros: [yo, m('uA', 'Ana'), m('uB', 'Bea')] }; g.todos = g.miembros.concat([m('sc9', 'Lucía (sin app)', { sinCuenta: true })]);
    const r = { uYo: 10, uA: 10, uB: 10 };
    preparar(e, [g], [
      C('viejo', 'g1', 'uA', 30, r, 'uA', '2026-10-05T10:00:00.000Z', 'Viejo de Ana'),
      C('nuevoA', 'g1', 'uA', 30, r, 'uA', '2026-10-12T10:00:00.000Z', 'Luz'),
      C('mio', 'g1', 'uYo', 30, r, 'uYo', '2026-10-13T10:00:00.000Z', 'Mío'),
      C('mioAlias', 'g1', 'sc9', 30, { sc9: 10, uA: 10, uB: 10 }, 'sc9', '2026-10-14T10:00:00.000Z', 'Mío con mi sitio sin app'),
      C('pagoB', 'g1', 'uB', 10, { uYo: 10 }, 'uB', '2026-10-15T10:00:00.000Z', '')]);
    S.compartidos[4].tipo = 'Liquidación';
    H.goTab(['juntos']); await sleep(40);
    const nuevas = () => { const x = doc.querySelector('.jv-nuevas'); return x ? x.textContent : ''; };
    const marcadas = () => [...doc.querySelectorAll('.jv-a.nueva')].map((x) => decodeURIComponent(x.getAttribute('data-click')));
    const foto = () => nuevas() + '|' + marcadas().join(',');
    ok(!marcadas().some((d) => /viejo|:mio$|mioAlias/.test(d)), 'no se marca ni lo mío, ni lo apuntado con mi sitio «sin app», ni lo de antes de mi visita');
    ok(marcadas().length === 2, 'las 2 nuevas se ven marcadas en la lista aunque yo haya apuntado cosas después (se ven: ' + marcadas().join(', ') + ')');
    const f0 = foto();
    // accesibilidad del punto
    const fila = doc.querySelector('.jv-a.nueva');
    const leeNueva = fila && (/nueva/i.test(fila.getAttribute('aria-label') || '') || [...fila.querySelectorAll('.sr-only')].some((x) => /nueva/i.test(x.textContent)));
    ok(!fila || leeNueva, 'el lector de pantalla dice que la fila es nueva (un aria-label en un <i> sin papel no se lee)');
    H.juntosVer(['grupos']); await sleep(20); H.juntosVer(['personas']); await sleep(20);
    ok(foto() === f0, 'al cambiar Personas | Grupos no cambia lo marcado');
    H.goTab(['inicio']); await sleep(30); H.goTab(['juntos']); await sleep(40);
    ok(foto() === f0, 'al salir y volver a entrar sin nada nuevo, sigue igual (no cambia de golpe)');
    ok(e.store.cfg.app.vistoJuntos === '2026-10-15T10:00:00.000Z', 'lo visto se guarda con la fecha del último gasto (no la hora del móvil)');
    // llega algo de Ana mientras sigo en Juntos: lo de antes debe seguir marcado (sigue siendo «después de tu visita anterior»)
    S.compartidos = S.compartidos.concat([C('llega', 'g1', 'uA', 6, { uYo: 2, uA: 2, uB: 2 }, 'uA', '2026-10-17T10:00:00.000Z', 'Pan')]); S._ef = null;
    A.render(); await sleep(40);
    ok(nuevas() === '3 nuevas', 'llega un gasto de Ana mientras miras Juntos: «3 nuevas», no se borran las 2 de antes (sale: «' + nuevas() + '»)');
    // apunto yo algo sin salir de Juntos (p. ej. «Compartir un gasto»): lo de los demás sigue marcado
    S.compartidos = S.compartidos.concat([C('yoAhora', 'g1', 'uYo', 9, r, 'uYo', '2026-10-18T10:00:00.000Z', 'Fruta')]); S._ef = null;
    A.render(); await sleep(40);
    ok(/^[1-9]/.test(nuevas()), 'apunto yo un gasto sin salir de Juntos: lo nuevo de los demás no desaparece de golpe (sale: «' + nuevas() + '»)');
  }

  /* ---------- 4. «Pago fijo»: ni «Gasto fijo» ni «Factura o pago» a la vista ---------- */
  {
    const e = makeEnv({ version: { crear: 0, importe: 0 }, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Vivienda' }], ingresos: ['Nómina'] }, meta: { onboarded: true } },
      movs: [{ id: 'f1', tipo: 'Factura', categoria: 'Vivienda', descripcion: 'Alquiler', importe: 700, fecha: '2026-10-03' }] });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost').textContent;
    const viejo = /Gasto fijo|gasto fijo|Factura o pago|factura o pago|Fijo · recibo|Facturas y pagos|Facturas recurrentes/;
    const vistos = [];
    A.openCrear(); await sleep(10); vistos.push(['botón +', sh()]);
    H.crearIr(['factura']); await sleep(20); vistos.push(['nuevo pago fijo', sh()]);
    H.closeSheet([]); await sleep(300);
    A.S.verAnterior.crear = 1; A.openCrear(); await sleep(10); vistos.push(['botón + de antes', sh()]); H.closeSheet([]); await sleep(300); A.S.verAnterior.crear = 0;
    H.openRecurrentes([]); await sleep(20); vistos.push(['recurrentes', sh()]);
    ok(/Pagos fijos[\s\S]*Aún no tienes ninguno\./.test(sh()), 'recurrentes vacíos: «Pagos fijos · Aún no tienes ninguno.» (pago es masculino; ahora dice «ninguna»)');
    H.recNuevo(['factura']); await sleep(20); vistos.push(['editor de recurrentes', sh()]);
    H.closeSheet([]); await sleep(300);
    H.openListEditor && (H.openListEditor(['facturas']), await sleep(20), vistos.push(['lista de facturas', sh()]), H.closeSheet([]), await sleep(300));
    H.goTab(['movimientos']); await sleep(30); A.S.movVista = 'lista'; A.render(); await sleep(20); vistos.push(['movimientos', doc.querySelector('#content').textContent]);
    H.openMovForm(['f1']); await sleep(20); vistos.push(['editar el alquiler', sh()]);
    ok(/Pago fijo/.test(sh()), 'al editar un recibo, el selector dice «Pago fijo»');
    H.closeSheet([]); await sleep(300);
    const malos = vistos.filter(([, t]) => viejo.test(t)).map(([k, t]) => k + ' («' + t.match(viejo)[0] + '»)');
    ok(!malos.length, 'no queda «Gasto fijo» ni «Factura o pago» en: ' + vistos.map((x) => x[0]).join(', ') + (malos.length ? ' · fallan: ' + malos.join(', ') : ''));
    ok(A.S.movimientos.find((x) => x.id === 'f1').tipo === 'Factura', 'el dato no cambia: sigue siendo tipo «Factura»');
  }

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

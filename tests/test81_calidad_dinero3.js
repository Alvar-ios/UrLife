// Calidad · Dinero v3 (formas de las metas, fichas-pestaña, cuentas en mosaico) y Juntos B2 (23/10/2026). Datos inventados.
// Mira: guardar una meta sin perder nada, «Que la elija el nombre», metas compartidas sin «forma» hacia Supabase,
// ids de recorte únicos (también al deslizar), atajos que llevan a una ficha, usuario nuevo, una sola cuenta,
// cuentas sin saldo o que «no suman», lo apartado mayor que el banco, «Antes» y «22 oct», y accesibilidad básica.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const RARO = /undefined|NaN|null|\[object/;
const V3 = { dinero: 0 };
const fichaOn = (doc) => { const b = doc.querySelector('.dm3-tab.on'); return b ? b.getAttribute('data-click').split('|')[1] : ''; };
// todas las referencias url(#…) de clip-path apuntan a un clipPath que existe
const recortesRotos = (raiz, doc) => [...raiz.querySelectorAll('[clip-path]')].filter((g) => { const id = (g.getAttribute('clip-path').match(/url\(#([^)]+)\)/) || [])[1]; return !id || !doc.getElementById(id); }).length;
const ORDEN = ['tarro', 'maleta', 'avion', 'casa', 'coche', 'anillo', 'regalo', 'estudios', 'mascota', 'colchon', 'tecno', 'hucha'];

function preparar(e) {
  const S = e.w.__APP__.S;
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const enviados = [];
  S.db = Object.assign(S.db || {}, {
    grupos: { listar: async () => { throw new Error('sin conexión (prueba)'); }, invitaciones: async () => [] }, rpc: async () => null,
    objetivos: { editar: async (id, d) => { enviados.push(['editar', d]); return Object.assign({}, (S.objetivos || []).find((o) => o.id === id), d); }, crear: async (d) => { enviados.push(['crear', d]); return Object.assign({ id: 'oN', hitos: [], usos: [] }, d); } },
  });
  const m = (u, n) => ({ user_id: u, nombre: n, rol: 'miembro' });
  S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana')] }];
  S.compartidos = []; S.aportes = [];
  return enviados;
}

(async () => {
  /* ---------- 1. Guardar una meta no pierde nada; «Que la elija el nombre» borra la forma ---------- */
  {
    const metas = [{ id: 'h1', nombre: 'Viaje a Japón', objetivo: 3000, yaAhorrado: 900, fechaObjetivo: '2027-06-01', emoji: '✈️', rentabilidad: 2, hitos: [{ importe: 1500, nombre: 'Mitad' }], usos: [{ fecha: '2026-09-01', importe: 50, para: 'otro' }], campoFuturo: { a: 1 } },
      { id: 'h2', nombre: 'Colchón', objetivo: 2000, yaAhorrado: 2000, forma: 'casa', conseguida: '2026-10-01' }];
    const e = makeEnv({ version: V3, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }], cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 1500, ts: 1 }], deudas: [{ nombre: 'Préstamo', objetivo: 900, previo: 100 }], ahorro: metas }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc, cfg = () => e.store.cfg.app, sh = () => doc.querySelector('#sheetHost');
    const meta = (id) => (cfg().ahorro || []).find((x) => x.id === id) || {};
    H.goTab(['dinero']); await sleep(20); H.dm3Tab(['metas']); await sleep(20);
    H.metaEditar(['h1']); await sleep(20);
    H.metaFormaElegir(['avion']); await sleep(10);
    await H.metaGuardar([]); await sleep(30);
    const g = meta('h1');
    ok(g.forma === 'avion', 'elegir «Avión» y Guardar: se guarda forma: avion');
    ok(g.emoji === '✈️' && g.rentabilidad === 2 && g.fechaObjetivo === '2027-06-01' && g.yaAhorrado === 900 && g.objetivo === 3000, 'guardar no pierde emoji, rentabilidad, fecha, lo que ya tenías ni el objetivo');
    ok(Array.isArray(g.usos) && g.usos.length === 1 && Array.isArray(g.hitos) && g.hitos.length === 1 && g.campoFuturo && g.campoFuturo.a === 1, 'guardar no pierde «He usado dinero», los hitos ni campos que la app aún no conoce');
    ok(meta('h2').forma === 'casa' && meta('h2').conseguida === '2026-10-01', 'las otras metas no cambian');
    ok((cfg().cuentas || []).length === 1 && (cfg().deudas || []).length === 1 && (cfg().ahorro || []).length === 2, 'cuentas, deudas y número de metas intactos (nada duplicado)');
    // renombrar con la forma elegida: se queda la elegida
    H.metaEditar(['h1']); await sleep(20);
    sh().querySelector('#mNombre').value = 'Casa nueva'; await H.metaGuardar([]); await sleep(30);
    ok(meta('h1').forma === 'avion' && meta('h1').nombre === 'Casa nueva', 'renombrar no cambia la forma elegida a mano');
    // «Que la elija el nombre»
    H.metaEditar(['h1']); await sleep(20);
    ok(/Elegida a mano/.test(sh().textContent) && sh().querySelector('[data-click="metaFormaElegir|"]'), 'el editor dice «Elegida a mano» y ofrece «Que la elija el nombre»');
    sh().querySelector('[data-click="metaFormaElegir|"]').click(); await sleep(10);
    ok(/Elegida por el nombre: Casa/.test(sh().textContent), 'tras tocarlo, la sugerida por el nombre (Casa)');
    await H.metaGuardar([]); await sleep(30);
    ok(!('forma' in meta('h1')) && meta('h1').emoji === '✈️' && meta('h1').usos.length === 1, '«Que la elija el nombre» borra forma y nada más');
    // cancelar no guarda
    H.metaEditar(['h2']); await sleep(20); H.metaFormaElegir(['regalo']); await sleep(10); H.closeSheet([]); await sleep(300);
    ok(meta('h2').forma === 'casa', 'elegir otra forma y cerrar sin guardar: no cambia nada');
    // en otra variante (Tarros) no sale «Su forma» y guardar conserva la elegida
    A.S.verAnterior = Object.assign(A.S.verAnterior, { dinero: 1 }); A.render(); await sleep(10);
    H.metaEditar(['h2']); await sleep(20);
    ok(!sh().querySelector('.fm-grid'), 'en «Tarros» el editor no enseña «Su forma»');
    await H.metaGuardar([]); await sleep(30);
    ok(meta('h2').forma === 'casa', 'guardar desde «Tarros» conserva la forma elegida');
    A.S.verAnterior = Object.assign(A.S.verAnterior, { dinero: 0 }); A.render(); await sleep(10);
    // meta nueva sin tocar la forma: no guarda forma
    H.metaNueva([]); await sleep(20);
    const inp = sh().querySelector('#mNombre'); inp.value = 'Perro'; inp.dispatchEvent(new e.w.Event('input', { bubbles: true })); await sleep(20);
    ok(sh().querySelector('#mNombre') === inp, '[medio] escribir el nombre no repinta la hoja entera (en el móvil puede cerrar el teclado o mover el cursor): solo cambia «Su forma»');
    ok((sh().querySelector('.fm-op.on') || { dataset: {} }).dataset.k === 'mascota', 'al escribir «Perro» se marca la huella');
    sh().querySelector('#mNombre').value = 'Perro'; sh().querySelector('#mObjetivo').value = '300';
    await H.metaGuardar([]); await sleep(30);
    const nueva = (cfg().ahorro || []).find((x) => x.nombre === 'Perro');
    ok(nueva && !('forma' in nueva) && (cfg().ahorro || []).length === 3, 'meta nueva sin elegir forma: se guarda una vez y sin «forma» (sale del nombre)');
  }

  /* ---------- 2. Metas compartidas: nada manda «forma» a Supabase ---------- */
  {
    const e = makeEnv({ version: V3, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }] }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S, sh = () => doc.querySelector('#sheetHost');
    const enviados = preparar(e);
    S.objetivos = [{ id: 'o1', grupoId: 'g1', tipo: 'ahorro', nombre: 'Viaje Lisboa', objetivo: 1200, previo: 600, hitos: [], usos: [], creadoPor: 'uA', createdAt: '2026-09-20T10:00:00Z' },
      { id: 'o2', grupoId: 'g1', tipo: 'ahorro', nombre: 'Nevera', objetivo: 600, previo: 600, forma: 'casa', hitos: [], usos: [], creadoPor: 'uA', createdAt: '2026-09-21T10:00:00Z' },
      { id: 'o3', grupoId: 'g1', tipo: 'ahorro', nombre: 'Tele', objetivo: 600, previo: 0, forma: 'nave-espacial', hitos: [], usos: [], creadoPor: 'uA', createdAt: '2026-09-22T10:00:00Z' }];
    H.goTab(['juntos']); await sleep(30);
    const tarj = [...doc.querySelectorAll('.jv-objs .jv-obj')];
    ok(tarj.length === 3, 'Juntos: las 3 metas compartidas en la fila');
    H.objEditar(['o1']); await sleep(20);
    ok(!!sh().querySelector('.fm-grid'), 'el editor de una meta compartida ofrece «Su forma» (columna creada el 23/10)');
    H.metaFormaElegir(['casa']); await sleep(10);
    ok(!('forma' in (e.w.__APP__.S.objetivos[0])), 'metaFormaElegir con una meta compartida abierta no hace nada');
    await H.objGuardar([]); await sleep(30);
    ok(enviados.length === 1 && !('forma' in enviados[0][1]), 'guardar una meta compartida sin tocar la forma no manda «forma» a Supabase');
    H.closeSheet([]); await sleep(300);
    H.objNueva(['ahorro', 'g1']); await sleep(20);
    sh().querySelector('#oNombre').value = 'Viaje a Roma'; sh().querySelector('#oObjetivo').value = '800';
    await H.objGuardar([]); await sleep(30);
    ok(enviados.length === 2 && enviados[1][0] === 'crear' && !('forma' in enviados[1][1]), 'crear una meta compartida tampoco manda «forma»');
    ok(!e.store.cfg.app.ahorro || !(e.store.cfg.app.ahorro || []).length, 'las compartidas no se cuelan en las metas personales de la configuración');
  }

  /* ---------- 3. Ids de recorte únicos, también al deslizar entre fichas ---------- */
  {
    const ahorro = ORDEN.map((k, i) => ({ id: 'f' + i, nombre: 'Meta ' + (i + 1), objetivo: 100, yaAhorrado: i === 11 ? 100 : 10 + i * 7, forma: k }));
    const e = makeEnv({ version: V3, pre: (w) => { w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }); w.Element.prototype.animate = function () { return { onfinish: null, cancel() {} }; }; }, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }], cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 1500, ts: 1 }], ahorro }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc;
    H.goTab(['dinero']); await sleep(20); H.dm3Tab(['metas']); await sleep(20); H.dmMetasTodas([]); await sleep(10); H.dmHechas([]); await sleep(10);
    H.metaVer(['f3']); await sleep(20);
    const ids = [...doc.querySelectorAll('clipPath')].map((c) => c.id);
    ok(ids.length >= 13 && new Set(ids).size === ids.length, '12 metas + la hoja: ' + ids.length + ' recortes con ids distintos');
    ok(recortesRotos(doc, doc) === 0, 'cada forma apunta a un recorte que existe');
    H.closeSheet([]); await sleep(300);
    A.render(); await sleep(10); A.render(); await sleep(10);
    const ids2 = [...doc.querySelectorAll('clipPath')].map((c) => c.id);
    ok(new Set(ids2).size === ids2.length && recortesRotos(doc, doc) === 0, 'tras repintar varias veces, siguen únicos y sin referencias rotas');
    H.dm3Tab(['cuentas']); await sleep(5);
    const f = doc.querySelector('.mov-fantasma');
    ok(!!f, 'al pasar de Metas a Cuentas, la copia de Metas se desliza (fantasma)');
    ok(f && recortesRotos(f, doc) === 0, '[medio] mientras se desliza, las formas de la copia conservan su recorte (si no, la ola se sale de la forma como un rectángulo). Rotas: ' + (f ? recortesRotos(f, doc) : '-'));
    await sleep(600);
  }

  /* ---------- 4. Atajos que llevan a Dinero abren la ficha pedida ---------- */
  {
    const e = makeEnv({ version: V3, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }], cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 1500, ts: 1 }], ahorro: [{ id: 'h1', nombre: 'Viaje', objetivo: 1000, yaAhorrado: 200 }], deudas: [{ nombre: 'Préstamo', objetivo: 900, previo: 100 }] }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S;
    H.goTab(['inicio']); await sleep(10);
    H.dmIr(['metas']); await sleep(20);
    ok(S.tab === 'dinero' && fichaOn(doc) === 'metas', 'dmIr desde fuera de Dinero: entra y abre Metas');
    H.dm3Tab(['cuentas']); await sleep(10); H.goTab(['inicio']); await sleep(10);
    H.goMetas([]); await sleep(20);
    ok(S.tab === 'dinero' && fichaOn(doc) === 'metas', '[medio] «Ver metas» de Inicio (goMetas → irDinero) abre la ficha Metas. Abre: ' + fichaOn(doc));
    H.goTab(['tu']); await sleep(10);
    H.openListEditor(['deudas']); await sleep(20);
    ok(S.tab === 'dinero' && fichaOn(doc) === 'deudas', '[medio] Tú → Deudas abre la ficha Deudas. Abre: ' + fichaOn(doc));
    H.dm3Tab(['cuentas']); await sleep(10); H.irDinero(['inversiones']); await sleep(20);
    ok(fichaOn(doc) === 'inversiones', '[medio] el aviso de inversiones y el buscador (irDinero inversiones) abren Inversiones. Abre: ' + fichaOn(doc));
    H.dm3Tab(['cuentas']); await sleep(10); H.irAnalisis(['deudas']); await sleep(20);
    ok(fichaOn(doc) === 'deudas', '[medio] «Por pagar» del resumen de patrimonio (irAnalisis deudas) abre Deudas. Abre: ' + fichaOn(doc));
    H.dmComo([]); await sleep(20);
    ok(/Entendido/.test(doc.querySelector('#sheetHost').textContent), 'ⓘ abre «¿Cómo se calcula?»');
    H.closeSheet([]); await sleep(300);
    H.dmIr(['nada-raro']); await sleep(10);
    ok(DM3_OK(fichaOn(doc)), 'dmIr con una clave desconocida no rompe nada');
    S.verAnterior = Object.assign(S.verAnterior, { dinero: 4 }); H.irDinero(['metas']); await sleep(20);
    ok(!doc.querySelector('.dm3-tabs') && !!doc.querySelector('#dm-metas'), '«22 oct»: irDinero sigue llevando a la sección Metas de la pantalla de antes');
  }

  /* ---------- 5. Usuario nuevo, sin cuentas, una sola cuenta, cuentas raras, apartado > banco ---------- */
  {
    const e = makeEnv({ version: V3, cfg: { app: { nombre: 'Ana', categoriasGasto: [{ nombre: 'Comida' }] }, meta: { onboarded: true } } });
    await sleep(80);
    const doc = e.doc; e.w.__APP__.H.goTab(['dinero']); await sleep(20);
    const t = doc.querySelector('#content').textContent;
    ok(/Empieza por aquí/.test(t) && !doc.querySelector('.dm3-tabs') && !RARO.test(t), 'usuario nuevo sin nada: «Empieza por aquí», sin fichas y sin cifras raras');
  }
  {
    const e = makeEnv({ version: V3, cfg: { app: { nombre: 'Ana', categoriasGasto: [{ nombre: 'Comida' }], ahorro: [{ id: 'u1', nombre: 'Viaje', objetivo: 500, yaAhorrado: 100 }] }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, doc = e.doc; A.H.goTab(['dinero']); await sleep(20);
    const t = doc.querySelector('#content').textContent;
    ok(doc.querySelectorAll('.dm3-tab').length === 4 && /Pon el saldo de tu banco/.test(t) && !RARO.test(t), 'solo una meta y ninguna cuenta: fichas, «Pon el saldo de tu banco» y sin cifras raras');
    ok(doc.querySelectorAll('.dm3-tab.vacia').length === 3, 'Cuentas, Inversiones y Deudas dicen «Añadir»');
    for (const k of ['metas', 'inversiones', 'deudas']) { A.H.dm3Tab([k]); await sleep(10); ok(!RARO.test(doc.querySelector('#content').textContent), 'ficha ' + k + ' sin cifras raras'); }
  }
  {
    const e = makeEnv({ version: V3, cfg: { app: { nombre: 'Ana', categoriasGasto: [{ nombre: 'Comida' }], cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 300, ts: 1 }], ahorro: [{ id: 'u1', nombre: 'Colchón', objetivo: 5000, yaAhorrado: 900 }] }, meta: { onboarded: true } } });
    await sleep(80);
    const doc = e.doc; e.w.__APP__.H.goTab(['dinero']); await sleep(20);
    const t = doc.querySelector('#content').textContent;
    ok(doc.querySelectorAll('.dm3-cta:not(.nueva)').length === 1 && !doc.querySelector('.dm3-reparto'), 'una sola cuenta: una tarjeta y sin barra de reparto');
    ok(!/Traspaso/.test(t) && /Editar/.test(t) && /Añadir cuenta/.test(t), 'una sola cuenta: sin «Traspaso», con «Editar» y «Añadir cuenta»');
    ok(/Tus metas suman 900\s€, más de lo que hay en tus cuentas/.test(t.replace(/ /g, ' ')) && !/apartados/.test(t), 'lo apartado (900 €) mayor que el banco (300 €): aviso y sin «900 € apartados» en la tarjeta');
    ok(/300,00/.test(doc.querySelector('.dm3-lqt-v').textContent), '«Lo que tienes» = 300 € (lo apartado no se suma dos veces)');
  }
  {
    const e = makeEnv({ version: V3, cfg: { app: { nombre: 'Ana', categoriasGasto: [{ nombre: 'Comida' }], cuentas: [{ id: 'c1', nombre: 'Cuenta nómina con nombre muy largo de verdad', ts: 1 }, { id: 'c2', nombre: 'Hucha casa', tipo: 'ahorro', saldo: 1200, ts: 1 }, { id: 'c3', nombre: 'Efectivo', tipo: 'efectivo', saldo: 0, ts: 1 }, { id: 'c4', nombre: 'Tarjeta', saldo: -80, ts: 1 }] }, meta: { onboarded: true } } });
    await sleep(80);
    const doc = e.doc; e.w.__APP__.H.goTab(['dinero']); await sleep(20);
    const tiles = [...doc.querySelectorAll('.dm3-cta:not(.nueva)')], tx = (i) => tiles[i].textContent;
    ok(tiles.length === 4 && /—/.test(tx(0)) && /Pon el saldo/.test(tx(0)), 'cuenta sin saldo: «—» y «Pon el saldo»');
    ok(/no suma/.test(tx(1)), 'cuenta de ahorro: «no suma»');
    ok(!RARO.test(doc.querySelector('#content').textContent), 'cuentas sin saldo, a 0 y en negativo: sin cifras raras');
    const ley = doc.querySelector('.dm3-rep-ley'); ok(!ley || !/Tarjeta|Efectivo/.test(ley.textContent), 'el reparto no enseña cuentas a 0 o en negativo');
    ok(!!doc.querySelector('[data-click="crearIr|traspaso"]'), 'con varias cuentas sale «Traspaso»');
  }

  /* ---------- 6. «Antes» y «22 oct» enseñan lo de antes ---------- */
  {
    const e = makeEnv({ version: V3, cfg: { app: { nombre: 'Ana', categoriasGasto: [{ nombre: 'Comida' }], cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 300, ts: 1 }], ahorro: [{ id: 'u1', nombre: 'Viaje', objetivo: 500, yaAhorrado: 100, forma: 'casa' }] }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, doc = e.doc, S = A.S; A.H.goTab(['dinero']); await sleep(20);
    ok(A.VERSIONES.dinero.variantes.map((v) => v[1]).join(',') === 'Formas,Tarros,Anillos,Antes,22 oct', 'variantes: Formas, Tarros, Anillos, Antes, 22 oct');
    S.verAnterior.dinero = 3; A.render(); await sleep(10);
    ok(!doc.querySelector('.dm3-tabs') && !!doc.querySelector('.chips-nav') && !doc.querySelector('.fm'), '«Antes»: la pantalla vieja con pestañas, sin formas');
    S.verAnterior.dinero = 4; A.render(); await sleep(10);
    ok(!doc.querySelector('.dm3-tabs') && !!doc.querySelector('.dm-cam') && !doc.querySelector('.fm'), '«22 oct»: Dinero de producción (Camino), sin formas');
    A.H.metaEditar(['u1']); await sleep(20);
    ok(!doc.querySelector('#sheetHost .fm-grid'), '«22 oct»: el editor no enseña «Su forma»');
    A.H.closeSheet([]); await sleep(300);
    A.H.metaVer(['u1']); await sleep(20);
    ok(!doc.querySelector('#sheetHost .fm'), '«22 oct»: la hoja de la meta lleva el anillo de antes');
    A.H.closeSheet([]); await sleep(300);
  }

  /* ---------- 7. Accesibilidad básica y textos ---------- */
  {
    const e = makeEnv({ version: V3, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }], cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 1500, ts: 1 }], ahorro: [{ id: 'h1', nombre: 'Viaje a Japón', objetivo: 1000, yaAhorrado: 400 }, { id: 'h2', nombre: 'Un nombre de meta larguísimo para ver qué pasa con él', objetivo: 1000, yaAhorrado: 450 }] }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost');
    H.goTab(['dinero']); await sleep(20);
    const tl = doc.querySelector('.dm3-tabs');
    ok(tl && tl.getAttribute('role') === 'tablist' && [...tl.querySelectorAll('[role="tab"]')].length === 4 && tl.querySelectorAll('[aria-selected="true"]').length === 1, 'fichas: tablist con 4 pestañas y una elegida');
    const cuerpo = doc.querySelector('#dmCuerpo');
    ok(cuerpo && cuerpo.getAttribute('role') === 'tabpanel' && tl.querySelector('[aria-controls="dmCuerpo"]'), '[leve] el cuerpo es un «tabpanel» unido a sus pestañas (lector de pantalla)');
    ok(doc.querySelector('.dm3-info').getAttribute('aria-label') === '¿Cómo se calcula?', 'ⓘ con nombre para el lector de pantalla');
    H.dm3Tab(['metas']); await sleep(20);
    ok([...doc.querySelectorAll('.fm-svg')].every((s) => s.getAttribute('aria-hidden') === 'true'), 'los dibujos de las formas están ocultos al lector de pantalla');
    const largo = doc.querySelectorAll('.dm-fm')[1];
    ok(largo && /larguísimo para ver qué pasa con él/.test(largo.querySelector('.dm-fm-main').getAttribute('aria-label')), 'nombre largo: entero en la etiqueta del botón');
    ok([...doc.querySelectorAll('.dm-fm-mas')].every((b) => /^Aportar a /.test(b.getAttribute('aria-label'))), 'cada «+» dice «Aportar a …»');
    H.metaEditar(['h1']); await sleep(20);
    const radios = [...sh().querySelectorAll('.fm-grid [role="radio"]')];
    ok(radios.length === 12 && radios.filter((r) => r.getAttribute('aria-checked') === 'true').length === 1 && sh().querySelector('.fm-grid[role="radiogroup"]'), '«Su forma»: 12 opciones como radio, una marcada');
    ok(radios.every((r) => /^[A-ZÁÉÍÓÚ][a-záéíóúñ]+( \(sugerida\))?$/.test(r.getAttribute('aria-label'))), 'nombres de las formas en español, con tildes (Avión, Portátil…)');
    H.closeSheet([]); await sleep(300);
    ok(!RARO.test(doc.querySelector('#content').textContent), 'Metas sin cifras raras');
  }

  /* ---------- 8. Juntos B2: conseguida, deuda saldada y forma de la columna futura ---------- */
  {
    const e = makeEnv({ version: V3, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }] }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S;
    preparar(e);
    S.objetivos = [{ id: 'o1', grupoId: 'g1', tipo: 'ahorro', nombre: 'Nevera', objetivo: 600, previo: 600, hitos: [], usos: [], creadoPor: 'uA', createdAt: '2026-09-20T10:00:00Z' },
      { id: 'o2', grupoId: 'g1', tipo: 'ahorro', nombre: 'Tele', objetivo: 600, previo: 100, forma: 'casa', hitos: [], usos: [], creadoPor: 'uA', createdAt: '2026-09-21T10:00:00Z' },
      { id: 'o3', grupoId: 'g1', tipo: 'deuda', nombre: 'Sofá', objetivo: 900, previo: 900, hitos: [], usos: [], creadoPor: 'uA', createdAt: '2026-09-01T10:00:00Z' }];
    H.goTab(['juntos']); await sleep(30);
    const t = [...doc.querySelectorAll('.jv-objs .jv-obj')];
    ok(t.length === 3, 'dos metas y una deuda en la fila');
    ok(t[0] && (t[0].textContent.match(/¡Conseguida!/g) || []).length === 1, '[leve] meta conseguida: «¡Conseguida!» una sola vez (no repetido debajo)');
    ok(t[0] && t[0].querySelector('.fm-ok') && t[0].querySelector('.fm-con.hecha'), 'meta conseguida: contorno del color de la app y ✓');
    const forma = (el) => { const p = el.querySelector('.fm-con path, .fm-con rect, .fm-con ellipse'); return p ? p.outerHTML : ''; };
    ok(/M50 10L90 44V92H10V44Z/.test(forma(t[1])), 'si un día llega la columna «forma» (aquí «casa»), la tarjeta la usa');
    ok(t[2] && /Saldada/.test(t[2].textContent) && /100 % pagado/.test(t[2].textContent), 'deuda pagada: «Saldada» y «100 % pagado»');
    ok(t.every((x) => x.getAttribute('aria-label') && !RARO.test(x.getAttribute('aria-label'))), 'cada tarjeta tiene una etiqueta clara');
    t[2].click(); await sleep(20);
    ok(/Sofá/.test(doc.querySelector('#sheetHost').textContent), 'tocar la deuda abre su hoja');
  }

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

function DM3_OK(k) { return ['cuentas', 'metas', 'inversiones', 'deudas'].indexOf(k) >= 0; }

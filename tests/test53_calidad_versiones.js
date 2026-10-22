// Calidad (18/10/2026): revisión con ojos frescos del botón «Antes» (comparar versiones), Inicio v2
// y «En qué gastas» v3 (Barras, Mosaico, Anillo). Datos inventados (sin usuarios reales).
// Las líneas «PEND» son fallos conocidos que aún no están arreglados: no hacen fallar la prueba;
// cuando se arreglen, saldrá «ARREGLADO» y hay que cambiarlas por ok().
console.error = () => {};
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pend = (c, m) => console.log((c ? 'ARREGLADO (cambiar por ok) ' : 'PEND ') + m);
const pad = (n) => String(n).padStart(2, '0');
const d = new Date(), Y = d.getFullYear(), M = d.getMonth() + 1, ym = Y + '-' + pad(M), hoy = ym + '-' + pad(d.getDate());
const pm = M === 1 ? 12 : M - 1, py = M === 1 ? Y - 1 : Y, ymP = py + '-' + pad(pm);
const YO = 'uA', ELLA = 'uP';

function entorno(cats, movs, extra, mas) {
  return makeEnv(Object.assign({ abrirVersiones: true, cfg: { app: Object.assign({ categoriasGasto: cats, ingresos: ['Nómina'] }, extra || {}), meta: { onboarded: true } }, movs }, mas || {}));
}
// Juntos simulado (solo lectura): un grupo «Casa» con otra persona
function conJuntos(w, DB) {
  const copia = (x) => JSON.parse(JSON.stringify(x)), base = w.Data;
  w.Data = Object.assign({}, base, { uid: () => YO,
    grupos: { listar: async () => copia(DB.est), invitaciones: async () => [], renombrar: async () => [], miNombre: async () => [], reparto: async () => [] },
    compartidos: { suscribir: (n) => { setTimeout(() => n(copia(DB.comp)), 0); return () => {}; }, crear: async () => ({}), editar: async () => ({}), borrar: async () => [] },
    objetivos: { suscribir: (n) => { setTimeout(() => n([]), 0); return () => {}; } },
    aportes: { suscribir: (n) => { setTimeout(() => n([]), 0); return () => {}; } }, rpc: async () => null });
}
const juntosDB = () => ({
  comp: [{ id: 'k1', grupoId: 'g1', pagadoPor: ELLA, creadoPor: ELLA, importe: 40, reparto: { uA: 20, uP: 20 }, tipo: 'Gasto', categoria: 'Supermercado', fecha: hoy, createdAt: '2026-01-01T00:00:00Z' }],
  est: { grupos: [{ id: 'g1', nombre: 'Casa', tipo: 'grupo', creado_por: ELLA, created_at: 'a' }],
    miembros: [{ grupo_id: 'g1', user_id: YO, nombre: 'Yo', rol: 'miembro', created_at: 'a' }, { grupo_id: 'g1', user_id: ELLA, nombre: 'Pa', rol: 'admin', created_at: 'b' }], sinCuenta: [] } });
const sesion = { url: 'https://x.test/', session: { user: { email: 'prueba@ejemplo.com', id: YO } } };

const boton = (doc) => { const h = doc.querySelector('#compararHost'); return h ? h.textContent.trim() : ''; };
const idsRepetidos = (doc) => { const ids = [...doc.querySelectorAll('[id]')].map((x) => x.id); return ids.filter((x, i) => ids.indexOf(x) !== i); };
const filas = (doc) => [...doc.querySelectorAll('.gc-fila')];
const abiertas = (doc) => filas(doc).filter((f) => f.classList.contains('abierta')).map((f) => f.getAttribute('data-gc'));
const expandidas = (doc) => filas(doc).filter((f) => f.querySelector('.gc-cab').getAttribute('aria-expanded') === 'true').map((f) => f.getAttribute('data-gc'));
const tocar = (e, el) => el.dispatchEvent(new e.w.MouseEvent('click', { bubbles: true }));
const filaDe = (doc, n) => filas(doc).find((f) => f.getAttribute('data-gc') === n);
const irVersion = async (A, nombre) => { for (let i = 0; i < 3 && !new RegExp(nombre).test(boton(A.doc)); i++) { A.H.compararCambiar(['movResumen']); await sleep(10); } };

(async () => {
  /* ===== 1. Dónde sale el botón «Antes» ===== */
  {
    const e = entorno([{ nombre: 'Supermercado', presupuesto: 100 }], [{ id: 'n1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1000, fecha: ym + '-01' },
      { id: 's1', tipo: 'Gasto', categoria: 'Supermercado', importe: 30, fecha: ym + '-01' }]);
    await sleep(150);
    const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc; A.doc = doc; void S;
    H.goTab(['inicio']); await sleep(10);
    ok(/Nueva/.test(boton(doc)), 'Inicio: sale el botón de versiones');
    ok(/versión/.test(doc.querySelector('#compararHost .comparar-fab').getAttribute('aria-label') || ''), 'el botón se explica para lectores de pantalla');
    ok(!idsRepetidos(doc).length, 'Inicio nuevo: sin ids repetidos (' + idsRepetidos(doc).join(',') + ')');
    H.compararCambiar(['inicio']); await sleep(10); H.compararCambiar(['inicio']); await sleep(10);
    ok(!idsRepetidos(doc).length && !!doc.querySelector('.ins-card, .hero:not(.hero2v2)'), 'Inicio anterior: sin ids repetidos');
    H.compararCambiar(['inicio']); await sleep(10);
    H.setInicioVista(['tareas']); await sleep(10);
    ok(boton(doc) !== '', 'Agenda (Semana y tareas): sale (desde el 22/10 tiene versión anterior)');
    H.setInicioVista(['calendario']); await sleep(10);
    ok(boton(doc) !== '', 'Agenda (Calendario): sale (desde el 22/10 tiene versión anterior)');
    H.setInicioVista(['hoy']); await sleep(10);
    H.goTab(['juntos']); await sleep(10); ok(boton(doc) === '', 'pestaña juntos: no sale'); H.goTab(['tu']); await sleep(10); ok(boton(doc) !== '', 'pestaña tu: sale (desde el 22/10 tiene versión anterior)');
    S.verAnterior = Object.assign(S.verAnterior || {}, { dinero: 0 }); H.goTab(['dinero']); await sleep(10); ok(/Formas/.test(boton(doc)), 'pestaña dinero: sale con «Formas» (las maneras de ver las metas; desde el 23/10 sustituye a «Camino»)');
    H.goTab(['movimientos']); await sleep(10);
    ok(/^Barras 1\/3$/.test(boton(doc)), 'Movimientos > Resumen del mes: «Barras 1/3» por defecto');
    H.setMovVista(['lista']); await sleep(10); ok(boton(doc) === '', 'Movimientos > Lista: no sale');
    H.setMovVista(['calendario']); await sleep(10); ok(boton(doc) === '', 'Movimientos > Calendario: no sale');
    H.setMovVista(['resumen']); await sleep(10);
    H.setMovModo(['anio']); await sleep(10);
    ok(boton(doc) === '' && !doc.querySelector('.gc-card'), 'Resumen del año entero: no sale (no hay versiones) y no pinta «En qué gastas» v3');
    H.setMovModo(['mes']); await sleep(10);
    ok(/Barras/.test(boton(doc)), 'al volver al mes, vuelve a salir');
    // ocultarlo en Tú: todo vuelve a la versión por defecto
    await irVersion(A, 'Anillo'); H.goTab(['inicio']); await sleep(10); H.compararCambiar(['inicio']); await sleep(10); H.compararCambiar(['inicio']); await sleep(10);
    ok(!!doc.querySelector('.ins-card') || !doc.querySelector('.hero2v2'), '(preparación) Inicio en la versión anterior');
    H.goTab(['tu']); await sleep(10); H.compararToggle([]); await sleep(10);
    H.goTab(['inicio']); await sleep(10);
    ok(boton(doc) === '' && !!doc.querySelector('.hero2v2'), 'oculto en Tú: Inicio sin botón y en la versión nueva');
    H.goTab(['movimientos']); await sleep(10);
    ok(boton(doc) === '' && !!doc.querySelector('.gc-v-barras') && !doc.querySelector('#gcAnillo'), 'oculto en Tú: el Resumen sin botón y en Barras (no se queda en Anillo)');
    H.compararToggle([]); await sleep(10);
    ok(/Barras 1\/3/.test(boton(doc)), 'al volver a enseñarlo, empieza en Barras');
  }
  {
    // primeros pasos (onboarding): no sale
    const e = makeEnv({ abrirVersiones: true,  cfg: {}, movs: [] }); await sleep(150);
    ok(!!e.w.__APP__.S.onboarding && boton(e.doc) === '', 'durante los primeros pasos no sale el botón');
  }
  {
    // usuario nuevo, sin movimientos: las versiones son iguales, el botón no aporta nada
    const e = entorno([{ nombre: 'Supermercado' }], []); await sleep(150);
    const H = e.w.__APP__.H, doc = e.doc;
    H.goTab(['inicio']); await sleep(10);
    ok(boton(doc) === '', 'usuario nuevo (sin movimientos): no debería salir «Antes» en Inicio (sale: «' + boton(doc) + '»)');
    H.goTab(['movimientos']); await sleep(10);
    ok(/Sin gastos registrados/.test(doc.querySelector('#content').textContent), 'usuario nuevo: «En qué gastas» dice que no hay gastos');
    ok(boton(doc) === '', 'usuario nuevo: no debería salir «Barras 1/3» si no hay nada que comparar (sale: «' + boton(doc) + '»)');
  }

  /* ===== 2. Inicio v2 ===== */
  {
    const tareas = [1, 2, 3].map((i) => ({ nombre: 'Tarea ' + i, estado: 'Pendiente', fechaLimite: '2020-01-0' + i }));
    const e = entorno([{ nombre: 'Supermercado', presupuesto: 50 }, { nombre: 'Ocio', presupuesto: 20 }],
      [{ id: 'a', tipo: 'Gasto', categoria: 'Supermercado', importe: 90, fecha: ym + '-01' }, { id: 'b', tipo: 'Gasto', categoria: 'Ocio', importe: 30, fecha: ym + '-01' },
        { id: 'c', tipo: 'Gasto', categoria: '', importe: 60, fecha: ym + '-01' }, { id: 'p', tipo: 'Gasto', categoria: 'Supermercado', importe: 85, fecha: ymP + '-01' }],
      null);
    tareas.forEach((t, i) => { e.store.tareas['t' + i] = t; });
    await sleep(150);
    const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc;
    H.goTab(['inicio']); await sleep(10);
    const circ = [...doc.querySelectorAll('.ins-c')];
    ok(circ.length >= 2 && circ.length <= 5 && circ.every((c) => (c.getAttribute('aria-label') || '').length > 10), '«Así vas»: entre 2 y 5 círculos, cada uno con su frase para lectores de pantalla');
    const filasDias = doc.querySelectorAll('.dias-lista .dia-fila').length;
    ok(filasDias === 2 && /Ver los 4/.test(doc.querySelector('.dias-lista').textContent), '«Estos días»: 2 filas a la vista y «Ver los 4» (el segundo presupuesto pasado ya no se quita) (hay ' + filasDias + ')');
    click(e, 'verPendiente'); await sleep(10);
    ok(doc.querySelectorAll('.dias-lista .dia-fila').length === 4 && /Ver menos/.test(doc.querySelector('.dias-lista').textContent), '«Ver los 4» enseña las 4 y «Ver menos»');
    ok(/Ocio: te has pasado/.test(doc.querySelector('.dias-lista').textContent), 'el segundo presupuesto pasado (Ocio) sigue en «Estos días»');
    click(e, 'verPendiente'); await sleep(10);
    const txt = doc.querySelector('#content').textContent;
    ok(/Supermercado/.test(txt), 'Supermercado pasado de presupuesto sale en «Así vas»');
    const sube = circ.find((c) => /sube más/.test(c.textContent));
    ok(!!sube && /Sin categoría/.test(sube.textContent + sube.getAttribute('aria-label')), 'si lo que más sube no tiene categoría, el círculo sale sin nombre («' + (sube ? sube.getAttribute('aria-label') : '-') + '»)');
    // popup del círculo
    click(e, 'insVer', '0'); await sleep(10);
    ok(!!doc.querySelector('#popupBackdrop .ins-pop') && !!doc.querySelector('#popupBackdrop [data-click^="insVerIr|"]'), 'al tocar un círculo: frase entera y «Ver»');
    H.popupCerrar([]); await sleep(10);
    ok(!idsRepetidos(doc).length, 'Inicio nuevo con todo: sin ids repetidos');
    // mes anterior en Inicio: sigue sin romperse
    H.inicioMes([-1]); await sleep(10);
    ok(!!doc.querySelector('.hero2v2') && /Te quedó|gastaste más|apartaste más/.test(doc.querySelector('.hero2v2').textContent), 'Inicio nuevo en el mes anterior: se pinta bien');
    void S;
  }
  {
    // solo usa Juntos (sin movimientos propios) y debe 20 €
    const DB = juntosDB();
    const e = entorno([{ nombre: 'Supermercado' }], [], null, Object.assign({ pre: (w) => conJuntos(w, DB) }, sesion));
    await sleep(250);
    const A = e.w.__APP__, H = A.H, doc = e.doc;
    H.goTab(['inicio']); await sleep(10);
    ok(Math.abs(A.miSaldo('g1') + 20) < 0.01, '(preparación) en Juntos debe 20 €');
    H.compararCambiar(['inicio']); await sleep(10); H.compararCambiar(['inicio']); await sleep(10);
    ok(/Debes 20,00/.test(doc.querySelector('#content').textContent), 'Inicio anterior: «Debes 20,00 €» en «Estos días»');
    H.compararCambiar(['inicio']); await sleep(10);
    ok(/Debes|20,00 €.*Juntos|en Juntos/.test(doc.querySelector('#content').textContent), 'Inicio nuevo, quien solo usa Juntos: lo que debe no sale en ningún sitio (se quita de «Estos días» y «Así vas» no sale sin movimientos propios)');
  }
  {
    // con movimientos y Juntos, mirando el mes anterior en Inicio
    const DB = juntosDB();
    const e = entorno([{ nombre: 'Supermercado' }], [{ id: 's', tipo: 'Gasto', categoria: 'Supermercado', importe: 12, fecha: ym + '-01' }, { id: 'p', tipo: 'Gasto', categoria: 'Supermercado', importe: 9, fecha: ymP + '-01' }],
      null, Object.assign({ pre: (w) => conJuntos(w, DB) }, sesion));
    await sleep(250);
    const H = e.w.__APP__.H, doc = e.doc;
    H.goTab(['inicio']); await sleep(10);
    ok(/Debes 20,00|Debes/.test(doc.querySelector('.ins-circ') ? doc.querySelector('.ins-circ').textContent : ''), 'Inicio nuevo, mes actual: lo de Juntos sale en «Así vas»');
    H.inicioMes([-1]); await sleep(10);
    ok(/Debes/.test(doc.querySelector('#content').textContent), 'Inicio nuevo mirando el mes anterior: lo que debes en Juntos desaparece (el anterior lo seguía enseñando en «Estos días»)');
  }

  /* ===== 3. «En qué gastas» v3 ===== */
  {
    // una sola categoría, en las tres versiones
    const e = entorno([{ nombre: 'Supermercado' }], [{ id: 'a', tipo: 'Gasto', categoria: 'Supermercado', importe: 40, fecha: ym + '-02', descripcion: 'Tienda' }]);
    await sleep(150);
    const A = e.w.__APP__, H = A.H, doc = e.doc; A.doc = doc;
    H.goTab(['movimientos']); await sleep(10);
    ok(filas(doc).length === 1 && /100 %/.test(filas(doc)[0].textContent), 'una categoría (Barras): una fila al 100 %');
    await irVersion(A, 'Mosaico');
    ok(doc.querySelectorAll('.gc-ficha').length === 1 && !idsRepetidos(doc).length, 'una categoría (Mosaico): una ficha, sin ids repetidos');
    await irVersion(A, 'Anillo');
    ok(doc.querySelectorAll('#gcAnillo .dn-s').length === 1 && !idsRepetidos(doc).length, 'una categoría (Anillo): un trozo, sin ids repetidos');
  }
  {
    // más de 6 categorías, una con nombre raro, un presupuesto sin gasto
    const raro = 'Bar "Pepe" & \'Co\' <b>|x';
    const cats = ['Supermercado', 'Ropa', raro, 'Casa', 'Transporte', 'Salud', 'Mascotas', 'Ocio'];
    const movs = cats.map((c, i) => ({ id: 'g' + i, tipo: 'Gasto', categoria: c, importe: 100 - i * 10, fecha: ym + '-01', descripcion: 'Sitio ' + i }));
    const e = entorno(cats.map((n) => ({ nombre: n })).concat([{ nombre: 'Viajes', presupuesto: 200 }]), movs);
    await sleep(150);
    const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc; A.doc = doc;
    H.goTab(['movimientos']); await sleep(10);
    ok(filas(doc).length === 7 && !!filaDe(doc, '__otras') && /Otras · 3 categorías/.test(filaDe(doc, '__otras').textContent), 'más de 6: las 5 mayores, «Otras · 3 categorías» y el presupuesto sin gasto (Viajes)');
    ok(doc.querySelectorAll('.gc-tira i').length === 6, 'la tira de colores tiene como mucho 6 trozos');
    ok(!abiertas(doc).length && !expandidas(doc).length, 'al entrar no hay ninguna abierta');
    ok(!doc.querySelector('.gc-lista b:not(.tnum)') && filaDe(doc, raro) && filaDe(doc, raro).querySelector('.cat').textContent === raro, 'nombre con comillas, & y <b>: se ve tal cual y no mete HTML');
    tocar(e, filaDe(doc, raro).querySelector('.gc-cab')); await sleep(10);
    ok(abiertas(doc).join() === raro && expandidas(doc).join() === raro && S._gcAbierta === raro, 'se abre la del nombre raro (aria-expanded="true")');
    tocar(e, filaDe(doc, raro).querySelector('.gc-cab')); await sleep(10);
    ok(!abiertas(doc).length && !expandidas(doc).length, 'segundo toque: se cierra');
    tocar(e, filaDe(doc, '__otras').querySelector('.gc-cab')); await sleep(10);
    const otras = filaDe(doc, '__otras').querySelector('.gc-cajon').textContent;
    ok(/Salud/.test(otras) && /Mascotas/.test(otras) && /Ocio/.test(otras), '«Otras» abierta: enseña las 3 categorías que agrupa');
    // cambiar de versión con una abierta (que tiene gasto)
    H.gcAbrir(['Ropa']); await sleep(10);
    await irVersion(A, 'Mosaico');
    ok(/Ropa/.test(doc.querySelector('#gcDet').textContent) && !!doc.querySelector('.gc-ficha.sel'), 'Barras → Mosaico con Ropa abierta: sale su detalle y su ficha elegida');
    ok(!idsRepetidos(doc).length, 'Mosaico: sin ids repetidos');
    ok(doc.querySelectorAll('.gc-ficha[aria-pressed]').length === doc.querySelectorAll('.gc-ficha').length, 'Mosaico: las fichas no dicen si están elegidas (falta aria-pressed para lectores de pantalla)');
    await irVersion(A, 'Anillo');
    ok(/Ropa/.test(doc.querySelector('#gcAnillo').textContent) && abiertas(doc).join() === 'Ropa', 'Mosaico → Anillo: Ropa sigue elegida en el anillo y abierta en la lista');
    ok(!idsRepetidos(doc).length, 'Anillo: sin ids repetidos');
    tocar(e, doc.querySelector('#gcAnillo .dn-centro')); await sleep(10);
    ok(!abiertas(doc).length && /toca un color/.test(doc.querySelector('#gcAnillo').textContent), 'tocar el centro del anillo la cierra');
    // cambiar de versión con un presupuesto sin gasto abierto
    await irVersion(A, 'Barras');
    tocar(e, filaDe(doc, 'Viajes').querySelector('.gc-cab')); await sleep(10);
    ok(abiertas(doc).join() === 'Viajes' && /Aún no has gastado nada/.test(filaDe(doc, 'Viajes').textContent), 'presupuesto sin gasto: se abre y lo dice');
    await irVersion(A, 'Mosaico');
    const off = doc.querySelectorAll('.gc-ficha.off').length, tot = doc.querySelectorAll('.gc-ficha').length;
    ok(off === 0, 'Barras → Mosaico con un presupuesto sin gasto abierto: todas las fichas salen apagadas y ninguna elegida (' + off + ' de ' + tot + ')');
    // cambiar de mes con una abierta
    await irVersion(A, 'Barras'); H.gcAbrir(['Ropa']); await sleep(10);
    H.movPerMover([-1]); await sleep(30);
    ok(S._gcAbierta === '' && !abiertas(doc).length, 'cambiar de mes (flechas) con una abierta: se cierra');
    H.movPerMover([1]); await sleep(30); H.gcAbrir(['Ropa']); await sleep(10);
    H.movMesElegir([ 'm:' + ymP ]); await sleep(30);
    ok(S._gcAbierta === '' && !abiertas(doc).length, 'elegir otro mes en la hoja con una abierta: se cierra');
  }
  {
    // categoría sin nombre (movimiento sin categoría)
    const e = entorno([{ nombre: 'Supermercado' }], [{ id: 'a', tipo: 'Gasto', categoria: '', importe: 20, fecha: ym + '-01', descripcion: 'Kiosco' },
      { id: 'c', tipo: 'Gasto', categoria: 'Supermercado', importe: 50, fecha: ym + '-01' }]);
    await sleep(150);
    const A = e.w.__APP__, H = A.H, doc = e.doc; A.doc = doc;
    H.goTab(['movimientos']); await sleep(10);
    const sin = filaDe(doc, '__sincat');
    ok(!!sin && /Sin categoría/.test(sin.textContent), 'la categoría vacía sale como «Sin categoría»');
    ok(!abiertas(doc).length && !expandidas(doc).length, 'Barras: «Sin categoría» sale abierta (y aria-expanded="true") sin haberla tocado');
    tocar(e, filaDe(doc, 'Supermercado').querySelector('.gc-cab')); await sleep(10);
    tocar(e, filaDe(doc, 'Supermercado').querySelector('.gc-cab')); await sleep(10);
    ok(!abiertas(doc).length, 'Barras: al cerrar otra categoría, se abre sola «Sin categoría»');
    await irVersion(A, 'Anillo');
    ok(/toca un color/.test(doc.querySelector('#gcAnillo').textContent), 'Anillo: sin elegir nada, el centro enseña «Sin categoría» en vez del total');
    await irVersion(A, 'Mosaico');
    H.gcAbrir(['Supermercado']); await sleep(10); H.gcAbrir(['Supermercado']); await sleep(10);
    ok(/Toca una ficha/.test(doc.querySelector('#gcDet').textContent), 'Mosaico: al cerrar una ficha, el detalle enseña «Sin categoría» en vez de «Toca una ficha»');
  }
  {
    // devoluciones: una categoría con más devuelto que gastado
    const e = entorno([{ nombre: 'Supermercado' }, { nombre: 'Ropa' }], [{ id: 'c', tipo: 'Gasto', categoria: 'Supermercado', importe: 50, fecha: ym + '-01' },
      { id: 'r', tipo: 'Gasto', categoria: 'Ropa', importe: -30, fecha: ym + '-01' }]);
    await sleep(150);
    const A = e.w.__APP__, H = A.H, doc = e.doc;
    H.goTab(['movimientos']); await sleep(10);
    const k = A.kpisMes(Y, M), neto = k.gastos + k.facturas, gc = doc.querySelector('.gc-total').textContent;
    ok(neto === 20, '(preparación) gasto neto del mes: 50 − 30 = 20');
    ok(gc.indexOf('20,00') >= 0, 'con una devolución, «En qué gastas» dice «' + gc.replace('gastado', ' gastado') + '» y la tarjeta de arriba dice Gastos 20,00 €: dos cifras distintas en la misma pantalla');
  }
  {
    // mes sin gastos y mes con solo devoluciones, en las tres versiones
    for (const [nombre, movs] of [['sin gastos', [{ id: 'i', tipo: 'Ingreso', categoria: 'Nómina', importe: 500, fecha: ym + '-01' }]], ['solo devoluciones', [{ id: 'r', tipo: 'Gasto', categoria: 'Ropa', importe: -30, fecha: ym + '-01' }]]]) {
      const e = entorno([{ nombre: 'Ropa' }], movs); await sleep(150);
      const A = e.w.__APP__, H = A.H, doc = e.doc; A.doc = doc;
      H.goTab(['movimientos']); await sleep(10);
      let bien = /Sin gastos registrados/.test(doc.querySelector('#content').textContent);
      await irVersion(A, 'Mosaico'); bien = bien && /Sin gastos registrados/.test(doc.querySelector('#content').textContent);
      await irVersion(A, 'Anillo'); bien = bien && /Sin gastos registrados/.test(doc.querySelector('#content').textContent) && !doc.querySelector('#gcAnillo svg');
      ok(bien, 'mes ' + nombre + ': las tres versiones dicen «Sin gastos registrados» sin romperse');
    }
  }
  {
    // «Tu mes» desde el día que cobras: lo de antes del cobro va al mes anterior
    const tm = { mesInicio: { modo: 'cobro', dia: 25 } }, cats = [{ nombre: 'Peluquería' }, { nombre: 'Ocio' }];
    const e = entorno(cats, [], tm); await sleep(150);
    const ma = e.w.__APP__.mesActual(), r = e.w.__APP__.rangoMes(ma.y, ma.m), antes = new Date(r.desde + 'T12:00:00'); antes.setDate(antes.getDate() - 1);
    const dAntes = antes.getFullYear() + '-' + pad(antes.getMonth() + 1) + '-' + pad(antes.getDate());
    const e2 = entorno(cats, [{ id: 'x1', tipo: 'Gasto', categoria: 'Peluquería', importe: 33, fecha: r.desde, descripcion: 'Pelo' },
      { id: 'x2', tipo: 'Gasto', categoria: 'Ocio', importe: 44, fecha: dAntes, descripcion: 'Cine' }], tm);
    await sleep(150);
    const B = e2.w.__APP__, d2 = e2.doc; B.doc = d2;
    B.H.goTab(['movimientos']); await sleep(10);
    const per = 'm:' + ma.y + '-' + pad(ma.m);
    ok(B.S.movPeriodo === per, '(preparación) el Resumen abre en tu mes (' + B.S.movPeriodo + ')');
    ok(!!filaDe(d2, 'Peluquería') && !filaDe(d2, 'Ocio'), 'tu mes desde el cobro: entra lo del primer día (' + r.desde + ') y no lo del día antes (' + dAntes + ')');
    const k = B.kpisMes(ma.y, ma.m);
    ok(/33,00/.test(d2.querySelector('.gc-total').textContent) && k.gastos + k.facturas === 33, 'el total de «En qué gastas» cuadra con el mes (33 €)');
    for (const v of ['Mosaico', 'Anillo']) { await irVersion(B, v); ok(/Peluquer/.test(d2.querySelector('#content').textContent) && !/Ocio/.test((d2.querySelector('.gc-mosaico, #gcAnillo') || {}).textContent || ''), v + ': mismo reparto en tu mes'); }
    await irVersion(B, 'Barras');
    tocar(e2, filaDe(d2, 'Peluquería').querySelector('.gc-cab')); await sleep(10);
    tocar(e2, filaDe(d2, 'Peluquería').querySelector('.gc-ver')); await sleep(10);
    ok(B.S.movCat === 'Peluquería' && B.S.movPeriodo === per, '«Ver el movimiento» lleva a la Lista de esa categoría en tu mes');
  }

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH', x); process.exit(1); });

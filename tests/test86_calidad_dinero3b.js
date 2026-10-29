// Calidad · Dinero v3, segunda pasada (23/10/2026). Datos inventados.
// Mira: «Su forma» se cambia sin tocar el campo del nombre (sin perder foco ni letras), la elección a mano manda,
// y que el alto de la cabecera (--cab-alto, fichas fijas) se mide con el botón «Antes» ya puesto y sin bucles.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const V3 = { dinero: 0 };
const base = (extra) => ({ version: V3, cfg: { app: Object.assign({ nombre: 'Lucía', categoriasGasto: [{ nombre: 'Casa' }], cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 1500, ts: 1 }], ahorro: [{ id: 'h1', nombre: 'Colchón', objetivo: 2000, yaAhorrado: 500 }] }, extra || {}), meta: { onboarded: true } } });
const escribir = (e, el, v) => { el.value = v; el.dispatchEvent(new e.w.Event('input', { bubbles: true })); };

(async () => {
  /* ---------- 1. Escribir el nombre cambia la forma sugerida sin repintar el campo del nombre ---------- */
  {
    const e = makeEnv(base());
    await sleep(80);
    const H = e.w.__APP__.H, doc = e.doc;
    H.goTab(['dinero']); await sleep(20); H.dm3Tab(['metas']); await sleep(20);
    H.metaNueva([]); await sleep(20);
    const n = doc.getElementById('mNombre');
    ok(!!n && !!doc.querySelector('.fm-grid'), 'meta nueva: hay nombre y «Su forma»');
    n.focus();
    const obj = doc.getElementById('mObjetivo'); obj.value = '1234';
    escribir(e, n, 'Viaje a Japón'); await sleep(10);
    const sug = () => (doc.querySelector('.fm-op.sug') || { dataset: {} }).dataset.k, on = () => (doc.querySelector('.fm-op.on') || { dataset: {} }).dataset.k;
    ok(doc.getElementById('mNombre') === n, 'el campo del nombre es el mismo (no se ha vuelto a crear)');
    ok(doc.activeElement === n, 'el nombre sigue con el cursor dentro');
    ok(sug() === 'maleta' && on() === 'maleta', 'la forma sugerida pasa a la maleta. Sugerida: ' + sug() + ', marcada: ' + on());
    ok(doc.querySelectorAll('.fm-grid').length === 1, 'solo hay una rejilla de formas (no se duplica)');
    ok(doc.getElementById('mObjetivo').value === '1234', 'el objetivo escrito no se pierde');
    ok(doc.querySelector('.fm-op[aria-checked="true"]').dataset.k === 'maleta', 'para el lector de pantalla también está marcada la maleta');
    // los botones nuevos de la rejilla funcionan
    doc.querySelector('.fm-op[data-k="hucha"]').click(); await sleep(10);
    ok(on() === 'hucha' && /Elegida a mano/.test(doc.querySelector('.fm-hint').textContent), 'tocar otra forma tras escribir funciona: hucha, «Elegida a mano»');
    ok(doc.getElementById('mNombre').value === 'Viaje a Japón' && doc.getElementById('mObjetivo').value === '1234', 'al elegir forma no se pierden ni el nombre ni el objetivo');
    const n2 = doc.getElementById('mNombre'); escribir(e, n2, 'Entrada del piso'); await sleep(10);
    ok(on() === 'hucha', 'con la forma elegida a mano, cambiar el nombre no la cambia');
    doc.querySelector('.fm-hint .link').click(); await sleep(10);
    ok(on() === 'casa', '«Que la elija el nombre» vuelve a la del nombre (casa). Marcada: ' + on());
    H.metaGuardar(); await sleep(60);
    const m = (e.store.cfg.app.ahorro || []).find((x) => x.nombre === 'Entrada del piso');
    ok(m && !('forma' in m) && m.objetivo === 1234, 'se guarda sin «forma» (la saca del nombre) y con su objetivo');
  }

  /* ---------- 2. --cab-alto se mide con el botón «Antes» ya en la cabecera, y sin bucles ---------- */
  {
    const e = makeEnv(Object.assign(base({ compararVersiones: true }), { movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Casa', descripcion: 'Bombillas', importe: 12.5, fecha: '2026-10-10', cuentaId: 'c1' }] }));
    await sleep(80);
    const A = e.w.__APP__, H = A.H, doc = e.doc, w = e.w;
    // en jsdom no hay medidas: la cabecera «crece» (fecha en dos líneas) cuando el botón «Antes» está dentro
    const t = doc.querySelector('.topbar');
    ok(!!t, 'hay cabecera');
    if (t) t.getBoundingClientRect = () => { const h = doc.querySelector('.topbar #compararHost'); return { height: h && h.innerHTML.trim() ? 83 : 66, top: 0, bottom: h && h.innerHTML.trim() ? 83 : 66, left: 0, right: 360, width: 360 }; };
    H.goTab(['tu']); await sleep(20); // Tú no tiene botón «Antes»: se llega a Dinero con la cabecera baja
    H.goTab(['dinero']); await sleep(20);
    const conAntes = !!(doc.querySelector('.topbar #compararHost') || { innerHTML: '' }).innerHTML.trim();
    ok(!conAntes, 'en Dinero ya no sale «Antes»: el dueño eligió «Formas» el 29/10');
    const v = doc.documentElement.style.getPropertyValue('--cab-alto');
    ok(v === (conAntes ? '83px' : '66px'), '[medio] las fichas se fijan justo debajo de la cabecera ya completa. --cab-alto=' + v);
    // sin bucles: un «resize» mide una vez y no provoca más
    let medidas = 0; const g = t.getBoundingClientRect; t.getBoundingClientRect = function () { medidas++; return g.call(this); };
    w.dispatchEvent(new w.Event('resize')); await sleep(50);
    ok(medidas <= 2, 'un «resize» no entra en bucle (medidas: ' + medidas + ')');
    H.goTab(['inicio']); await sleep(20); medidas = 0; w.dispatchEvent(new w.Event('resize')); await sleep(20);
    ok(medidas === 0, 'fuera de Dinero, el «resize» no mide nada');
  }

  console.log(fails ? fails + ' fallos' : 'todo bien');
  process.exit(fails ? 1 : 0);
})();

// Calidad · cierre de versiones, teclado en aportar y traspasos, iconos de metas y deudas (22/10/2026). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const pad = (n) => String(n).padStart(2, '0');
const d0 = new Date(), Y = d0.getFullYear(), M = d0.getMonth() + 1, ym = Y + '-' + pad(M);
const CUENTAS = [{ id: 'c1', nombre: 'Banco A', saldo: 1000, ts: 1 }, { id: 'c2', nombre: 'Banco B', saldo: 50, ts: 1 }];
const MOVS = [{ id: 'g1', tipo: 'Gasto', categoria: 'Supermercado', importe: 40, fecha: ym + '-02', cuentaId: 'c1' },
  { id: 'n1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: ym + '-01', cuentaId: 'c1' }];
// como un usuario real: sin ninguna variante fijada por las pruebas
const real = (A) => { A.S.verAnterior = {}; A.render(); };
const tecla = (e, key, extra) => e.doc.body.dispatchEvent(new e.w.KeyboardEvent('keydown', Object.assign({ key, bubbles: true, cancelable: true }, extra || {})));
const pegar = (e, t) => { const ev = new e.w.Event('paste', { bubbles: true, cancelable: true }); ev.clipboardData = { getData: () => t }; e.doc.body.dispatchEvent(ev); };
const movsDe = (e, tipo) => Object.entries(e.store.movimientos).filter(([, m]) => m.tipo === tipo);

(async () => {
  /* ---------- 1. Versiones cerradas: un usuario real nunca ve la vieja ni el botón ---------- */
  for (const comparar of [true, false]) {
    const e = makeEnv({ movs: MOVS, cfg: { app: { cuentas: CUENTAS, categoriasGasto: [{ nombre: 'Supermercado', presupuesto: 100 }], ingresos: ['Nómina'], compararVersiones: comparar }, meta: { onboarded: true } } });
    await sleep(120);
    const A = e.w.__APP__, H = A.H, doc = e.doc, fab = () => doc.querySelector('.comparar-fab'), t = comparar ? ' (con «Comparar» activado)' : ' (con «Comparar» apagado)';
    real(A); await sleep(10);
    ok(!fab(), 'Inicio: sin botón de versiones (el dueño eligió «Nueva» el 29/10)' + t);
    H.goTab(['movimientos']); await sleep(20);
    ok(!fab() && !!doc.querySelector('#gcAnillo'), 'En qué gastas: siempre «Anillo» y sin botón' + t);
    H.goTab(['juntos']); await sleep(20); ok(!fab(), 'Juntos: sin botón «Antes»' + t);
    H.goTab(['tu']); await sleep(20); ok(!fab() && doc.body.classList.contains('en-tu2'), 'Tú: la nueva y sin botón' + t);
    A.openCrear(); await sleep(10);
    const sh = doc.querySelector('#sheetHost').innerHTML;
    ok(!!doc.querySelector('#sheetHost .crear-4') && !/Ver la versión anterior/.test(sh), 'Botón +: la nueva y sin «Ver la versión anterior»' + t);
    H.closeSheet([]); await sleep(300);
    H.goTab(['dinero']); await sleep(20);
    ok(!fab(), 'Dinero: sin botón de versiones (el dueño eligió «Formas» el 29/10)' + t);
    if (comparar) {
      H.goTab(['dinero']); await sleep(10); H.compararCambiar(['dinero']); await sleep(10);
      A.S.verAnterior = {};
      H.goTab(['inicio']); await sleep(10);
      A.S.inicioVista = 'tareas'; A.render(); await sleep(10);
      ok(!fab(), 'Agenda: sin «Antes» (elegida el 29/10)');
      A.S.inicioVista = ''; A.render(); await sleep(10);
      H.crearIr(['gasto']); await sleep(20);
      ok(!doc.querySelector('#sheetHost .tec-antes'), 'Apuntar importe ya elegido (29/10): sin «Antes»');
      H.closeSheet([]); await sleep(300);
    }
  }

  /* ---------- 2. Aportar a una meta con el teclado de la app ---------- */
  {
    const e = makeEnv({ version: { importe: 0 }, movs: [], cfg: { app: { cuentas: CUENTAS, ahorro: [{ id: 'h1', nombre: 'Viaje', objetivo: 1000 }] }, meta: { onboarded: true } } });
    await sleep(80);
    const A = e.w.__APP__, H = A.H, q = (s) => e.doc.querySelector('#sheetHost ' + s), P = (...k) => k.forEach((x) => A.tecPulsar(x));
    H.metaAportarR(['h1']); await sleep(20);
    ok(e.doc.querySelector('#sheetHost .sheet').classList.contains('tec-abierto'), 'aportar: con el teclado abierto, la hoja lleva «tec-abierto» (oculta el botón repetido)');
    // la tecla «Aportar» debe verse activa con cualquier importe (no solo con un número impar de pulsaciones)
    const apagada = [];
    for (const k of ['1', '5']) { A.tecPulsar(k); apagada.push(q('.tec-ok').classList.contains('apagada') || q('.tec-ok').getAttribute('aria-disabled') !== 'false'); }
    ok(apagada.every((x) => !x), '[medio] aportar: tras escribir 1 y 15, la tecla «Aportar» se ve activa (aria-disabled="false"). Apagada: ' + JSON.stringify(apagada));
    // ficha y luego teclear: se reemplaza y lo guardado es lo que se ve
    H.aportarRImp([200]); await sleep(5); P('7');
    ok(A.form().importe === '7' && q('#apImporte').value === '7' && /Aportar 7,00/.test(q('#apGuardar').textContent), 'aportar: tras la ficha de 200 €, teclear 7 deja 7 € (cifra, campo y botón iguales)');
    // pegar con el teclado de la app abierto
    pegar(e, '1.234,56'); await sleep(5);
    ok(A.form().importe === '1234,56', 'aportar: pegar «1.234,56» escribe 1234,56 (' + A.form().importe + ')');
    // fecha elegida
    H.apFechaVer([]); const f = q('#apFecha'); f.value = Y + '-01-15';
    // doble Enter del teclado físico: un solo apunte
    tecla(e, 'Enter'); tecla(e, 'Enter'); await sleep(60); tecla(e, 'Enter'); await sleep(400);
    const aps = movsDe(e, 'Ahorro');
    ok(aps.length === 1, 'aportar: doble (y triple) Enter guarda un solo apunte (' + aps.length + ')');
    ok(aps[0] && aps[0][1].importe === 1234.56 && aps[0][1].fecha === Y + '-01-15' && aps[0][1].metaId === 'h1', 'aportar: se guarda lo que se ve (1.234,56 €), con la fecha elegida y en su meta');
    // «Invertir» desde aportar lleva al formulario de inversión
    H.metaAportarR(['h1']); await sleep(20); H.aportarRInvertir([]); await sleep(400);
    ok(A.form() && A.form().kind === 'mov' && A.form().tipo === 'Inversión', 'aportar → «Invertir»: abre el formulario de inversión');
    H.closeSheet([]); await sleep(300);
    // sin teclado de la app (versión «Antes»): sigue el campo de texto
    A.S.verAnterior = { importe: 1 }; H.metaAportarR(['h1']); await sleep(20);
    ok(q('#apImporte') && q('#apImporte').type === 'text' && !q('#tec'), 'aportar con «Antes» en el importe: el campo de texto de siempre');
    H.closeSheet([]); await sleep(300);
  }

  /* ---------- 3. Traspasos con el teclado de la app ---------- */
  {
    const T1 = { id: 't1', tipo: 'Traspaso', categoria: 'Traspaso', importe: 300, fecha: ym + '-05', cuentaId: 'c1', cuentaDestinoId: 'c2', descripcion: 'Para ahorro' };
    const e = makeEnv({ version: { importe: 0 }, movs: MOVS.concat([T1]), cfg: { app: { cuentas: CUENTAS, categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'] }, meta: { onboarded: true } } });
    await sleep(120);
    const A = e.w.__APP__, H = A.H, q = (s) => e.doc.querySelector('#sheetHost ' + s), P = (...k) => k.forEach((x) => A.tecPulsar(x));
    H.crearIr(['traspaso']); await sleep(20);
    const est = [];
    for (const k of ['2', '5']) { A.tecPulsar(k); est.push(q('.tec-ok').classList.contains('apagada')); }
    ok(est.every((x) => !x), '[medio] traspaso: con 2 y con 25 escritos, la tecla «Guardar» se ve activa. Apagada: ' + JSON.stringify(est));
    tecla(e, 'Enter'); tecla(e, 'Enter'); await sleep(400);
    const nuevos = movsDe(e, 'Traspaso').filter(([id]) => id !== 't1');
    ok(nuevos.length === 1 && nuevos[0][1].importe === 25, 'traspaso: doble Enter guarda uno solo, de 25 € (' + nuevos.length + ')');
    // editar: teclado cerrado, «Hecho», y se guarda lo que se ve sobre el mismo movimiento
    H.openTraspaso(['t1']); await sleep(20);
    ok(A.form().tec && !A.form().tec.on && /Hecho/.test(q('.tec-ok').textContent) && q('#fImporte').value === '300', 'editar traspaso: teclado cerrado, tecla «Hecho» y la cifra de antes');
    H.tecAbrir([]); P('3', '0'); P('ok'); await sleep(5);
    ok(!A.form().tec.on && q('#fImporte').value === '30', 'editar traspaso: al tocar la cifra se reemplaza; «Hecho» cierra el teclado');
    H.saveTraspaso([]); await sleep(400);
    ok(e.store.movimientos.t1.importe === 30 && movsDe(e, 'Traspaso').length === 2, 'editar traspaso: se guarda 30 € en el mismo (sin duplicar)');
    // escribir la descripción cierra el teclado de la app (nunca dos teclados)
    H.crearIr(['traspaso']); await sleep(20); P('9');
    q('#fDesc').dispatchEvent(new e.w.FocusEvent('focusin', { bubbles: true }));
    ok(!A.form().tec.on, 'traspaso: al tocar «Descripción» se cierra el teclado de la app');
    H.closeSheet([]); await sleep(300);
    // convertir en traspaso: sin teclado, el mismo movimiento
    const antes = Object.keys(e.store.movimientos).length;
    H.movAtraspaso(['g1']); await sleep(20);
    if (A.form() && A.form().kind === 'traspaso') {
      ok(!q('#tec') && q('#fImporte') && q('#fImporte').type === 'text' && q('#fImporte').value.replace(',00', '') === '40', 'convertir en traspaso: sin teclado de la app, con su importe');
      H.saveTraspaso([]); await sleep(400);
      ok(Object.keys(e.store.movimientos).length === antes && e.store.movimientos.g1.tipo === 'Traspaso', 'convertir en traspaso: el mismo movimiento, sin duplicar');
    } else ok(false, 'convertir en traspaso: se abre la hoja');
  }

  /* ---------- 4. Una sola cuenta: sin traspaso; usuario nuevo sin datos ---------- */
  {
    const e = makeEnv({ version: { importe: 0 }, movs: [], cfg: { app: { cuentas: [CUENTAS[0]] }, meta: { onboarded: true } } });
    await sleep(80); const A = e.w.__APP__; real(A); A.openCrear(); await sleep(10);
    ok(!/Traspaso/.test(e.doc.querySelector('#sheetHost').textContent), 'una sola cuenta: el + no ofrece «Traspaso»');
    A.H.closeSheet([]); await sleep(300); A.H.goTab(['dinero']); await sleep(20);
    ok(!/undefined|NaN/.test(e.doc.body.textContent), 'usuario sin metas ni deudas: Dinero sin cifras raras');
  }

  /* ---------- 5. Metas y deudas: iconos en pantalla, datos sin tocar ---------- */
  {
    const app = { cuentas: CUENTAS, ahorro: [{ id: 'h1', nombre: 'Playa', objetivo: 500, emoji: '🏖️' }, { id: 'h2', nombre: 'Colchón', objetivo: 900, emoji: '🛟' }],
      deudas: [{ nombre: 'Coche', objetivo: 8000, emoji: '🚗' }, { nombre: 'Tarjeta', objetivo: 900 }] };
    const e = makeEnv({ movs: [], cfg: { app: JSON.parse(JSON.stringify(app)), meta: { onboarded: true } } });
    await sleep(80); const A = e.w.__APP__, H = A.H, doc = e.doc;
    for (const v of [0, 1, 2]) {
      A.S.verAnterior = { dinero: v }; H.goTab(['dinero']); A.render(); await sleep(10);
      const txt = doc.querySelector('#app').textContent;
      ok(!/🏖️|🛟|🚗|💳/.test(txt), 'metas (' + ['Camino', 'Tarros', 'Anillos'][v] + ') y deudas: sin emojis en pantalla');
    }
    ok(doc.querySelectorAll('.dm-deuda .dm-ic svg.i').length === 2, 'deudas: cada una con su icono (también la que no tiene dibujo guardado)');
    H.deudaEditar(['Coche']); await sleep(10);
    const bs = [...doc.querySelectorAll('#sheetHost .dm-emo-b')];
    ok(bs.length >= 6 && bs.every((b) => b.getAttribute('aria-label') && b.querySelector('svg.i')), 'elegir dibujo de deuda: iconos con nombre para el lector de pantalla');
    const casa = bs.find((b) => b.getAttribute('aria-label') === 'Casa'); casa.click(); await sleep(5);
    ok(casa.classList.contains('on') && casa.getAttribute('aria-checked') === 'true' && bs.filter((b) => b.classList.contains('on')).length === 1, 'elegir icono: se marca solo el tocado (24/10: radio con aria-checked)');
    H.closeSheet([]); await sleep(300);
    const guardado = e.store.cfg.app || {};
    // estilos: el icono de la meta no debe heredar las reglas pensadas para el dibujo del tarro o del anillo,
    // y el icono de cabecera de una meta no debe pintarse con el color de las deudas
    const css = require('fs').readFileSync(require('path').join(__dirname, '..', 'look.css'), 'utf8');
    ok(!/\.dm-anillo svg\s*\{/.test(css) || /dm-anillo-e[^{}]*svg[^{}]*\{[^}]*position\s*:\s*static/.test(css), '[medio] Anillos: el icono de la meta sale centrado (la regla «.dm-anillo svg» lo saca de sitio)');
    ok(!/\.dm-tarro-v svg\s*\{/.test(css) || /dm-tarro-e[^{}]*svg[^{}]*\{[^}]*width/.test(css), '[medio] Tarros: el icono cabe en su círculo (la regla «.dm-tarro-v svg» lo pone de 76×92 px)');
    ok(!/\.dm-hemo:has\(\+ \.dm-hcab-t\)/.test(css), '[leve] cabecera de una meta: icono en color de acento, no en el beige de las deudas («.dm-hemo:has(+ .dm-hcab-t)» coge también las metas)');
    ok(JSON.stringify((guardado.ahorro || []).map((m) => m.emoji)) === JSON.stringify(['🏖️', '🛟']) && (guardado.deudas || [])[0].emoji === '🚗', 'los emojis guardados no cambian solo por mirar (datos intactos)');
  }

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

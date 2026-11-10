// 08/11/2026 · docs/32 A1: botón y gesto de atrás de Android (window.__atras). Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, doc = e.doc, atras = () => e.w.__atras();
  ok(typeof e.w.__atras === 'function', 'la app expone el «atrás» para Android');
  ok(atras() === false, 'en Inicio sin nada abierto, atrás sale de la app');
  H.goTab(['movimientos']); await sleep(10);
  ok(atras() === true && A.S.tab === 'inicio', 'desde Movimientos, atrás vuelve a Inicio');
  H.setInicioVista(['tareas']); await sleep(10);
  ok(atras() === true && A.S.inicioVista === 'hoy', 'desde la Agenda, atrás vuelve a Inicio');
  H.crearIr(['gasto']); await sleep(30);
  ok(!!doc.querySelector('#sheetBackdrop'), 'se abre «Nuevo gasto»');
  if (A.form().tec) { A.form().tec.txt = '12,5'; } else doc.querySelector('#fImporte').value = '12,5';
  ok(atras() === true && !!doc.querySelector('#descartarHoja') && /¿Descartar este gasto\?/.test(doc.querySelector('#descartarHoja').textContent), 'con algo escrito pregunta «¿Descartar este gasto?»');
  H.descartarNo([]); await sleep(5);
  ok(!doc.querySelector('#descartarHoja') && !!doc.querySelector('#sheetBackdrop'), '«Seguir editando» deja el gasto como estaba');
  atras(); H.descartarSi([]); await sleep(300);
  ok(!doc.querySelector('#sheetBackdrop'), '«Descartar» cierra la hoja');
  H.goTab(['tu']); await sleep(10); H.borrarCuentaAbrir([]); await sleep(10);
  ok(atras() === true && !doc.querySelector('#descartarHoja'), 'una hoja sin nada escrito se cierra directamente');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})();

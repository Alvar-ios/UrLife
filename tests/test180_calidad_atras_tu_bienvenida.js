// 13/11/2026 · Calidad: botón atrás de Android en las pantallas nuevas de Tú y en la bienvenida por pasos, y que
// quien ya tenía cuenta (sin «herramientas», con o sin «nivel») vea la barra y el + como siempre. Datos inventados.
const T = require('./toques_comun.js');
const { abrir, tocar, buscar, escribir, pantalla, hojaAbierta, atras, app, ir, ok, paso, fin, sleep } = T;
T.fallosConocidos([]); // 13/11: atrás en la bienvenida cerraba la app; arreglado en atrasAndroid
const pasoN = (e) => (pantalla(e).match(/Paso (\d+) de (\d+)/) || []).slice(1).join('/');
(async () => {
  paso('Tú → una pantalla de temas → atrás');
  let e = await abrir({ version: { tu: 0, crear: 0 }, cfg: { app: { nombre: 'Prueba', compararVersiones: false }, meta: { onboarded: true } } });
  await ir(e, 'tu');
  for (const n of ['Mis herramientas', 'Dinero', 'Apariencia', 'Tus datos', 'Ayuda']) {
    const b = buscar(e, 'tuIr', n, 'app'); if (!ok(!!b, 'Tú: está «' + n + '»')) continue;
    b.click(); await sleep(60);
    ok(!!e.S.tuSub, '  entra en «' + n + '»');
    ok(atras(e) === true, '  atrás lo maneja la app (no se cierra)'); await sleep(60);
    ok(e.S.tab === 'tu' && !e.S.tuSub, '  y vuelve a Tú');
  }
  paso('Una hoja abierta dentro de una pantalla de Tú');
  await tocar(e, 'tuIr', 'Mis herramientas', 'app');
  await tocar(e, 'nivelAbrir', '', 'app', 120);
  ok(hojaAbierta(e), 'se abre «Qué ves en la app»');
  ok(atras(e) === true, 'atrás…'); await sleep(260);
  ok(!hojaAbierta(e) && e.S.tab === 'tu' && e.S.tuSub === 'herramientas', '…cierra la hoja y se queda en Mis herramientas');
  atras(e); await sleep(60); atras(e); await sleep(60);
  ok(e.S.tab === 'inicio', 'dos atrás más: a Tú y luego a Inicio');
  ok(atras(e) === false, 'en Inicio, atrás ya deja salir de la app');

  paso('Bienvenida: atrás en el paso 2');
  e = await abrir({ cfg: {}, version: { bienvenida: 0 } });
  await escribir(e, '#obNombre', 'Marta'); await tocar(e, 'obNext', /Siguiente|Empezar/, null, 500);
  ok(pasoN(e) === '2/4', 'en el paso 2 (' + pasoN(e) + ')');
  const r = atras(e); await sleep(80);
  ok(r === true && !!e.S.onboarding && pasoN(e) === '1/4', 'atrás en el paso 2 vuelve al paso 1 sin cerrar la app (' + r + ', ' + pasoN(e) + ')');
  ok(/Marta/.test(e.doc.querySelector('#obNombre') ? e.doc.querySelector('#obNombre').value : '') || app(e).nombre === 'Marta', 'lo escrito en el paso 1 se conserva');
  ok(atras(e) === false && !!e.S.onboarding, 'en el paso 1, atrás deja salir (como antes)');

  paso('Cuenta de antes (sin «herramientas» ni «nivel»): barra y + de siempre');
  e = await abrir({ version: { tu: 0, crear: 0 }, cfg: { app: { nombre: 'Prueba', compararVersiones: false, cuentas: [{ id: 'c1', nombre: 'A', saldo: 10, fecha: '2026-01-01' }, { id: 'c2', nombre: 'B', saldo: 10, fecha: '2026-01-01' }] }, meta: { onboarded: true } } });
  const barra = () => [...e.doc.querySelectorAll('.tabbar > *')].map((b) => b.classList.contains('tab-crear') ? '+' : b.getAttribute('data-tab')).join();
  ok(barra() === 'inicio,movimientos,+,juntos,dinero' && !e.doc.querySelector('.tabbar.tres'), 'barra de 4 con el + en medio (' + barra() + ')');
  ok(!e.doc.querySelector('#tbAgenda').hidden, 'botón de la Agenda arriba');
  e.A.H.onFab([]); await sleep(60);
  for (const n of ['Gasto', 'Ingreso', 'Tarea', 'Apartar', 'Invertir', 'Pago de deuda', 'Traspaso', 'Importar']) ok(!!buscar(e, 'crearIr', n, 'hoja'), '  el + tiene «' + n + '»');
  ok(!('herramientas' in app(e)) && !('nivel' in app(e)), 'y no se guarda nada nuevo en su configuración al abrir');
  fin('atras_tu_bienvenida');
})();

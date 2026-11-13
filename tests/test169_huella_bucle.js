// 13/11 · Bloqueo con huella: sin bucle al volver con la app abierta en segundo plano (movil/bloqueo.js).
// Simula lo que hace Android de verdad: «app activa» llega en cada vuelta (onResume, también al cerrar la ventanita
// transparente de la huella) y «app fuera» solo cuando deja de verse del todo (onStop).
const { crearBloqueo } = require('../movil/bloqueo.js');
let fallos = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fallos++; };
const espera = () => new Promise((r) => setTimeout(r, 0));

function montar(opc) {
  const st = { t: 1e6, bloqueada: false, peticiones: 0, pendientes: [], on: true };
  const B = crearBloqueo(Object.assign({
    ahora: () => st.t,
    activado: () => st.on,
    bloquear: () => { st.bloqueada = true; },
    desbloquear: () => { st.bloqueada = false; },
    autenticar: () => { st.peticiones++; return new Promise((res, rej) => st.pendientes.push({ res, rej })); },
  }, opc || {}));
  return { st, B };
}

(async () => {
  // 1) Abrir en frío: se pide una vez
  {
    const { st, B } = montar();
    B.pedir(); B.pedir(); // dos llamadas seguidas (p. ej. arranque + botón): una sola ventanita
    ok(st.peticiones === 1 && st.bloqueada, 'al abrir: una sola petición aunque se llame dos veces (candado)');
    st.pendientes.shift().res(); await espera();
    ok(!st.bloqueada, 'al abrir: con la huella buena se desbloquea');
  }

  // 2) El fallo del dueño: app abierta → fuera 6 min → vuelve → huella → la ventanita provoca pausa/vuelta → NO se repite
  {
    const { st, B } = montar();
    B.estado(false); st.t += 6 * 60e3; // se va de la app (onStop) y vuelve 6 minutos después
    B.estado(true);
    ok(st.peticiones === 1 && st.bloqueada, 'vuelve tras 6 min: bloquea y pide la huella una vez');
    // la ventanita de la huella (transparente): vuelta mientras se pide, y con PIN (pantalla opaca) también «fuera»
    B.estado(false); st.t += 3000; B.estado(true);
    ok(st.peticiones === 1, 'mientras se pide, la pausa/vuelta de la propia ventanita no pide otra');
    st.pendientes.shift().res(); await espera();
    ok(!st.bloqueada, 'huella buena: desbloqueada');
    // Android avisa «activa» justo después de cerrarse la ventanita (y a veces un poco más tarde)
    st.t += 200; B.estado(true); st.t += 1000; B.estado(true);
    ok(st.peticiones === 1 && !st.bloqueada, 'al cerrarse la ventanita NO se vuelve a bloquear ni a pedir la huella');
    // pasada la gracia, otra vuelta «activa» suelta (sin haber salido) tampoco pide: la hora de salir ya se borró
    st.t += 10 * 60e3; B.estado(true);
    ok(st.peticiones === 1 && !st.bloqueada, 'una vuelta «activa» sin haber salido no pide nada (antes sí: bucle)');
    // salida corta (menos de 5 min): no se pide
    B.estado(false); st.t += 60e3; B.estado(true);
    ok(st.peticiones === 1 && !st.bloqueada, 'fuera 1 minuto: no se pide');
    // salida larga otra vez: se pide una vez
    B.estado(false); st.t += 5 * 60e3 + 1; B.estado(true);
    ok(st.peticiones === 2 && st.bloqueada, 'fuera más de 5 min otra vez: se vuelve a pedir, una vez');
    st.pendientes.shift().res(); await espera(); st.t += 100; B.estado(true);
    ok(st.peticiones === 2 && !st.bloqueada, 'y tras desbloquear tampoco hay bucle');
  }

  // 3) Cancelar: se queda la pantalla de bloqueo, sin volver a pedir sola
  {
    const { st, B } = montar();
    B.estado(false); st.t += 6 * 60e3; B.estado(true);
    st.pendientes.shift().rej(new Error('cancelado')); await espera();
    ok(st.bloqueada && st.peticiones === 1, 'cancelar: sigue bloqueada');
    st.t += 100; B.estado(true); st.t += 5000; B.estado(true); B.estado(false); st.t += 2000; B.estado(true);
    ok(st.peticiones === 1, 'cancelar: no se vuelve a pedir sola (sin bucle)');
    B.pedir(); // botón «Desbloquear»
    ok(st.peticiones === 2 && st.bloqueada, 'el botón «Desbloquear» la pide otra vez');
    B.pedir();
    ok(st.peticiones === 2, 'pulsar «Desbloquear» dos veces no abre dos ventanitas');
    st.pendientes.shift().res(); await espera();
    ok(!st.bloqueada, 'con la huella buena se desbloquea');
  }

  // 4) Sin huella activada: nunca bloquea
  {
    const { st, B } = montar(); st.on = false;
    B.pedir(); B.estado(false); st.t += 10 * 60e3; B.estado(true);
    ok(st.peticiones === 0 && !st.bloqueada, 'sin «Pedir huella al abrir»: ni bloquea ni pide');
  }

  // 5) Si la petición falla al lanzarse (el plugin lanza un error), no se queda el candado puesto para siempre
  {
    let n = 0; const { st, B } = montar({ autenticar: () => { n++; throw new Error('sin biometría'); } });
    await B.pedir(); await B.pedir();
    ok(n === 2 && st.bloqueada, 'si falla al pedirla, el botón puede volver a intentarlo y sigue bloqueada');
  }

  // 6) nativo-src.js usa bloqueo.js y la web no quita el bloqueo antes de confirmar la huella
  {
    const fs = require('fs'), path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'movil', 'nativo-src.js'), 'utf8');
    const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    ok(/crearBloqueo\(/.test(src) && /B\.estado\(isActive\)/.test(src) && !/fuera = Date\.now\(\)/.test(src), 'el puente de Android usa el bloqueo nuevo');
    const d = (app.match(/\n {2}desbloquear: \(\) => [^\n]+/) || [''])[0];
    ok(d && !/classList\.remove/.test(d), 'el botón «Desbloquear» de la web no quita el bloqueo por su cuenta');
  }

  console.log(fallos ? fallos + ' fallos' : 'todo bien');
  process.exit(fallos ? 1 : 0);
})();

// 13/11/2026 · Calidad: bloqueo con huella (movil/bloqueo.js). Huecos que no cubría test169:
// salir de la app justo después de desbloquear (en el segundo y medio de «gracia») y volver mucho después
// debe pedir la huella; y la pausa/vuelta de la propia ventanita sigue sin provocar bucle.
const { crearBloqueo } = require('../movil/bloqueo.js');
let fallos = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fallos++; };
const espera = () => new Promise((r) => setTimeout(r, 0));
function montar() {
  const st = { t: 1e6, bloqueada: false, peticiones: 0, pendientes: [] };
  const B = crearBloqueo({ ahora: () => st.t, activado: () => true, bloquear: () => { st.bloqueada = true; }, desbloquear: () => { st.bloqueada = false; },
    autenticar: () => { st.peticiones++; return new Promise((res, rej) => st.pendientes.push({ res, rej })); } });
  return { st, B };
}
(async () => {
  // 1) Desbloquea al abrir y sale a los 0,5 s (se va a otra app); vuelve 2 horas después
  {
    const { st, B } = montar();
    B.pedir(); st.pendientes.shift().res(); await espera();
    ok(!st.bloqueada, 'al abrir: desbloqueada con la huella');
    st.t += 500; B.estado(false); st.t += 2 * 3600e3; B.estado(true);
    ok(st.bloqueada && st.peticiones === 2, 'salir justo tras desbloquear y volver 2 h después: bloquea y pide la huella');
  }
  // 2) La ventanita provoca «fuera» y «activa» dentro de la gracia: sin bucle
  {
    const { st, B } = montar();
    B.pedir(); st.pendientes.shift().res(); await espera();
    st.t += 100; B.estado(false); st.t += 300; B.estado(true);
    st.t += 10 * 60e3; B.estado(true);
    ok(!st.bloqueada && st.peticiones === 1, 'pausa y vuelta de la ventanita: no se vuelve a pedir (ni ahora ni luego)');
    B.estado(false); st.t += 60e3; B.estado(true);
    ok(!st.bloqueada && st.peticiones === 1, 'después, una salida corta tampoco pide');
  }
  // 3) «Fuera» de la ventanita en la gracia y «activa» un poco después de la gracia: no pide (menos de 5 min)
  {
    const { st, B } = montar();
    B.pedir(); st.pendientes.shift().res(); await espera();
    st.t += 1000; B.estado(false); st.t += 2000; B.estado(true);
    ok(!st.bloqueada && st.peticiones === 1, 'vuelta poco después de la gracia: no pide');
  }
  console.log(fallos ? fallos + ' fallos' : 'todo bien');
  process.exit(fallos ? 1 : 0);
})();

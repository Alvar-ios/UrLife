// 13/11 · Bloqueo con huella o PIN (docs/32 B3), aparte para poder probarlo sin Android (tests/test169_huella_bucle.js).
//
// Por qué existía el bucle: Capacitor avisa «app activa» en CADA vuelta al primer plano (onResume), pero «app fuera» solo
// cuando la pantalla deja de verse del todo (onStop). La ventanita de la huella es una pantalla transparente: al cerrarla,
// Android vuelve a avisar «app activa», y como la hora de «salí» no se borraba nunca, parecía que seguías fuera más de
// 5 minutos → volvía a bloquear y a pedir la huella, una y otra vez.
//
// Ahora: una sola petición a la vez (candado); mientras se pide y 1,5 s después de terminar no se hace caso a los avisos
// de «fuera»/«activa» (los provoca la propia ventanita); la hora de «salí» se borra al volver; y si se cancela, se queda
// la pantalla de bloqueo con «Desbloquear», sin volver a pedirla sola.
function crearBloqueo(o) {
  const ahora = o.ahora || (() => Date.now());
  const limite = o.limite != null ? o.limite : 5 * 60e3; // fuera más de 5 minutos → se pide al volver
  const gracia = o.gracia != null ? o.gracia : 1500; // tras cerrar la ventanita, sus avisos de pausa/vuelta no cuentan
  let pidiendo = false, fin = -Infinity, fuera = 0;
  const enGracia = () => pidiendo || ahora() - fin < gracia;

  // Pide la huella (una sola vez a la vez). Devuelve la promesa en curso o null si no hay que pedir.
  let enCurso = null;
  const pedir = () => {
    if (!o.activado()) { o.desbloquear(); return null; }
    o.bloquear(); // siempre bloqueada mientras no se confirme
    if (pidiendo) return enCurso;
    pidiendo = true;
    let p;
    try { p = Promise.resolve(o.autenticar()); } catch (e) { p = Promise.reject(e); }
    enCurso = p.then(() => { o.desbloquear(); return true; }, () => false /* cancelada o fallida: se queda bloqueada */)
      .then((ok) => { pidiendo = false; fin = ahora(); fuera = 0; enCurso = null; return ok; });
    return enCurso;
  };

  // Avisos de Android: activo = true al volver, false al salir
  const estado = (activo) => {
    if (enGracia()) return null; // lo ha provocado la propia ventanita de la huella
    if (!activo) { if (!fuera) fuera = ahora(); return null; }
    const salio = fuera; fuera = 0;
    if (salio && ahora() - salio > limite && o.activado()) return pedir();
    return null;
  };

  return { pedir, estado, get pidiendo() { return pidiendo; } };
}

module.exports = { crearBloqueo };

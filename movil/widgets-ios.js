// 25/11 · Widgets en iPhone (docs/49 B1+B2). Aparte para poder probarlo sin iPhone (tests/test205_iphone_widgets.js).
// Mismo contrato que en Android (window.__nativo.widgets: guardar, abrirCon, alAbrir), así app.js no cambia.
// La diferencia: en Android el widget abre la app con un «extra»; en iPhone la abre con un enlace: palomapp://gasto (Apuntar gasto)
// o palomapp://inicio (Te queda este mes). El plugin de Swift solo guarda el resumen (PalomaWidgetsPlugin.swift).
function queDeUrl(url) {
  const m = /^palomapp:\/\/\/?([a-z]+)\/?(?:[?#].*)?$/i.exec(String(url || '').trim());
  const q = m ? m[1].toLowerCase() : '';
  return q === 'gasto' || q === 'inicio' ? q : '';
}
function crearWidgetsIos(plugin) {
  let pendiente = '';
  const oyentes = [];
  return {
    guardar: (o) => plugin.guardar(o || { sesion: false }),
    // lo que pidió el widget al abrir la app: 'gasto', 'inicio' o '' (y se olvida, para no repetirlo)
    abrirCon: () => { const q = pendiente; pendiente = ''; return Promise.resolve(q); },
    alAbrir: (fn) => { oyentes.push(fn); },
    // lo llama el aviso de «URL abierta» de Capacitor; devuelve true si el enlace era de un widget
    alUrl: (url) => {
      const q = queDeUrl(url); if (!q) return false;
      pendiente = q;
      oyentes.slice().forEach((f) => { try { f(); } catch (e) { /* */ } });
      return true;
    },
  };
}
module.exports = { crearWidgetsIos, queDeUrl };

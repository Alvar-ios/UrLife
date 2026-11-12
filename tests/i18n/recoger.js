// Herramienta (no es una prueba): con I18N_RECOGER=archivo, el harness llama aquí y se apuntan
// todos los textos que llegan a la pantalla (nodos de texto y atributos que se leen) para sacar el diccionario.
const fs = require('fs');
module.exports = function recoger(w, archivo) {
  const vistos = new Set();
  const ATR = ['placeholder', 'title', 'aria-label', 'alt', 'data-c'];
  const apunta = (t, tipo) => { if (t == null) return; t = String(t).replace(/\s+/g, ' ').trim(); if (!t || !/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(t)) return; vistos.add(tipo + '\t' + t); };
  const recorre = (n) => {
    if (!n) return;
    if (n.nodeType === 3) { const p = n.parentNode; if (p && /^(SCRIPT|STYLE)$/.test(p.nodeName)) return; apunta(n.data, 'T'); return; }
    if (n.nodeType !== 1) return;
    ATR.forEach((a) => { if (n.hasAttribute && n.hasAttribute(a)) apunta(n.getAttribute(a), 'A'); });
    if (n.nodeName === 'INPUT' && /^(button|submit)$/i.test(n.type)) apunta(n.value, 'A');
    for (let c = n.firstChild; c; c = c.nextSibling) recorre(c);
  };
  const mo = new w.MutationObserver((ms) => {
    ms.forEach((m) => {
      if (m.type === 'characterData') apunta(m.target.data, 'T');
      else if (m.type === 'attributes') { if (ATR.indexOf(m.attributeName) >= 0) apunta(m.target.getAttribute(m.attributeName), 'A'); }
      else m.addedNodes.forEach(recorre);
    });
  });
  mo.observe(w.document, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATR });
  const c0 = w.confirm, a0 = w.alert;
  w.confirm = function (m) { apunta(m, 'C'); return c0 ? c0.apply(w, arguments) : true; };
  w.alert = function (m) { apunta(m, 'C'); };
  w.__recogerNotif = (t) => apunta(t, 'N');
  process.on('exit', () => { try { mo.takeRecords().forEach(() => {}); fs.appendFileSync(archivo, [...vistos].join('\n') + '\n'); } catch (e) { /* */ } });
};

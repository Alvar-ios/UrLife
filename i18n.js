/* ============================================================
   PalomApp · Idiomas (C1 de docs/40) — español (el de siempre) e inglés.
   La app se sigue escribiendo en español. Con el inglés puesto, una capa traduce lo que sale en pantalla:
   - Solo cambia un texto si ENTERO está en el diccionario (i18n-en.js) o casa con una de sus reglas.
     Nunca se cambian trozos sueltos dentro de una frase desconocida: lo que escribe el usuario
     (descripciones, nombres de cuentas, personas, categorías propias) se queda tal cual.
   - Números, importes, fechas y meses se cambian por '#' para buscar la frase («Te quedan # este mes»).
   - Mira los cambios de la página (MutationObserver) y traduce en el momento, antes de que se pinte:
     no se ve el español ni un instante. Lo que ya tradujo lo recuerda para no repetir.
   - Con español no hace NADA (ni mira la página): la app queda exactamente como antes.
   Uso desde app.js: I18N.lang, I18N.tr(texto), I18N.locale(), I18N.poner('en'|'es', elegido).
   ============================================================ */
(function () {
  'use strict';
  var I = window.I18N = window.I18N || {};
  var lsGet = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var lsSet = function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } };
  I.IDIOMAS = [['es', 'Español'], ['en', 'English']];
  I.valido = function (l) { return l === 'es' || l === 'en'; };
  /* La primera vez, el idioma del móvil o del navegador (español si empieza por «es»; si no, inglés).
     Si se eligió a mano en este dispositivo (pantalla de entrada o Tú), ese. Las pruebas lo fijan con __I18N_FORZAR. */
  I.delDispositivo = function () {
    var n = (navigator.languages && navigator.languages[0]) || navigator.language || 'es';
    return /^es\b/i.test(String(n)) ? 'es' : 'en';
  };
  I.elegidoAqui = function () { var g = lsGet('idioma'); return I.valido(g) ? g : null; };
  I.lang = I.valido(window.__I18N_FORZAR) ? window.__I18N_FORZAR : (I.elegidoAqui() || I.delDispositivo());
  I.locale = function () { return I.lang === 'en' ? 'en-GB' : 'es-ES'; };
  I.en = I.en || null; // lo rellena i18n-en.js: { exactos: {es: en}, reglas: [[/re/, 'en con $1'], …] }

  /* ---------- Normalización: la misma que tests/i18n/norm.py ---------- */
  var L = 'A-Za-zÀ-ÖØ-öø-ÿ', NO_L = '(?![' + L + '])', ANT = '(?<![' + L + '])';
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var ABR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var ABR_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var mesN = function (s) { return MESES.indexOf(String(s).toLowerCase()); };
  var abrN = function (s) { s = String(s).toLowerCase().replace(/\.$/, ''); if (s === 'sept') s = 'sep'; return ABR.indexOf(s); };
  var M = MESES.join('|'), D = DIAS.join('|'), A = ABR.join('|') + '|sept';
  var NORM = [
    [new RegExp(ANT + '(\\d{1,2}) de (' + M + ')(?: de (\\d{4}))?' + NO_L, 'gi'), function (m, d, me, y) { return d + ' ' + MONTHS[mesN(me)] + (y ? ' ' + y : ''); }],
    [new RegExp(ANT + '(' + M + ') de (\\d{4})' + NO_L, 'gi'), function (m, me, y) { return MONTHS[mesN(me)] + ' ' + y; }],
    [new RegExp(ANT + '(\\d{1,2}) (' + A + ')' + NO_L + '\\.?(?: (\\d{4}))?', 'gi'), function (m, d, me, y) { return d + ' ' + ABR_EN[abrN(me)] + (y ? ' ' + y : ''); }],
    [new RegExp(ANT + '(' + M + '|' + D + ')' + NO_L, 'gi'), function (m, w) { var i = mesN(w); return i >= 0 ? MONTHS[i] : DAYS[DIAS.indexOf(w.toLowerCase())]; }],
    [/[−+\-]?[€$£]?\d(?:[\d.,]*\d)?(?:\s?[€$£%])?/g, function (m) { return m; }],
  ];
  // clave() con los valores en el orden en que salen en el texto
  function claveYValores(s) {
    var out = [], k = String(s);
    var trozos = [{ t: k, hueco: false }];
    NORM.forEach(function (r) {
      var nuevos = [];
      trozos.forEach(function (p) {
        if (p.hueco) { nuevos.push(p); return; }
        var last = 0, t = p.t, m; r[0].lastIndex = 0;
        while ((m = r[0].exec(t))) {
          if (!m[0]) { r[0].lastIndex++; continue; }
          if (m.index > last) nuevos.push({ t: t.slice(last, m.index), hueco: false });
          nuevos.push({ t: m[0], hueco: true, v: r[1].apply(null, m.concat([m.index, t])) });
          last = m.index + m[0].length;
        }
        if (last < t.length) nuevos.push({ t: t.slice(last), hueco: false });
      });
      trozos = nuevos;
    });
    var clave = trozos.map(function (p) { if (p.hueco) { out.push(p.v); return '#'; } return p.t; }).join('');
    return { k: clave, vals: out };
  }
  I.claveDe = function (s) { return claveYValores(String(s).replace(/\s+/g, ' ').trim()).k; };
  function rellenar(t, vals) {
    if (!vals.length) return t;
    if (/#\d/.test(t)) return t.replace(/#(\d)/g, function (m, n) { var v = vals[Number(n) - 1]; return v == null ? '' : v; });
    var i = 0; return t.replace(/#/g, function () { var v = vals[i++]; return v == null ? '' : v; });
  }
  // «1,234.56 €» → «€1,234.56»; «12.5 %» → «12.5%»; «12,5 %» (escrito a mano en español) → «12.5%»
  function formatoIngles(t) {
    if (t.indexOf('€') >= 0) t = t.replace(/([−+\-]?)(\d(?:[\d.,]*\d)?)[\s ]?€/g, '$1€$2');
    if (t.indexOf('%') >= 0) t = t.replace(/(\d),(\d{1,2})[\s ]?%/g, '$1.$2%').replace(/(\d)[\s ]%/g, '$1%');
    return t;
  }
  var LETRA = new RegExp('[' + L + ']');
  var SOLO_HUECOS = new RegExp('^[^' + L + ']*$');
  var BORDE = /^([\s·•:;,()\[\]«»"“”'—–\-+=→←↔✓✔×…*|/]*)([\s\S]*?)([\s·•:;,()\[\]«»"“”'—–\-+=→←↔✓✔×…*|/.!?]*)$/;
  function mayus(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function minus(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function exacto(c) {
    var E = I.en && I.en.exactos; if (!E) return null;
    if (Object.prototype.hasOwnProperty.call(E, c)) return E[c];
    var c1 = c.charAt(0), up = c1.toUpperCase(), lo = c1.toLowerCase();
    if (c1 === lo && c1 !== up && Object.prototype.hasOwnProperty.call(E, up + c.slice(1))) return minus(E[up + c.slice(1)]);
    if (c1 === up && c1 !== lo && Object.prototype.hasOwnProperty.call(E, lo + c.slice(1))) return mayus(E[lo + c.slice(1)]);
    if (c.length > 2 && c === c.toUpperCase() && c !== c.toLowerCase()) { var t = c.toLowerCase(); t = mayus(t); if (Object.prototype.hasOwnProperty.call(E, t)) return E[t].toUpperCase(); }
    return null;
  }
  // Traduce un texto ya recortado. null = no se sabe (se deja como está)
  function nucleo(c, hondo) {
    var e = exacto(c); if (e != null) return e;
    var kv = claveYValores(c);
    if (kv.vals.length) {
      if (SOLO_HUECOS.test(kv.k)) return rellenar(kv.k, kv.vals);
      e = exacto(kv.k); if (e != null) return rellenar(e, kv.vals);
    }
    var h = hondo || 0;
    // «A · B · C»: cada trozo es una cosa (vale que solo se traduzcan algunos)
    if (h < 3 && c.indexOf(' · ') > 0) { var r1 = partes(c, ' · ', h, false); if (r1 != null) return r1; }
    var R = (I.en && I.en.reglas) || [];
    for (var i = 0; i < R.length; i++) {
      var m = R[i][0].exec(c);
      if (m) {
        var g = m.slice(1).map(function (x) { if (x == null) return ''; var t = h > 3 ? null : nucleo(x, h + 1); return t == null ? x : t; });
        return R[i][1].replace(/\$(\d)/g, function (z, n) { return g[Number(n) - 1] || ''; }).replace(/\s+$/, '');
      }
    }
    if (h < 3) {
      var seps = [': ', ' — ', ' – ', ', ', ' / ', ' → '];
      for (var s = 0; s < seps.length; s++) { if (c.indexOf(seps[s]) > 0) { var r2 = partes(c, seps[s], h, seps[s] !== ' → '); if (r2 != null) return r2; } }
      var dp = c.indexOf(': '); // «Título: frase que también lleva dos puntos»
      if (dp > 0 && c.indexOf(': ', dp + 2) > 0) { var a1 = nucleo(c.slice(0, dp), h + 1), a2 = a1 == null ? null : nucleo(c.slice(dp + 2), h + 1); if (a2 != null) return a1 + ': ' + a2; }
      // varias frases seguidas («Hecho. Ya puedes entrar.»): todas o ninguna
      if (/[.!?…] \S/.test(c)) { var fr = c.split(/(?<=[.!?…]) (?=\S)/); if (fr.length > 1) { var ok = true, out = fr.map(function (p) { if (!LETRA.test(p)) return p; var t = nucleo(p, h + 1); if (t == null) ok = false; return t; }); if (ok) return out.join(' '); } }
      var b = BORDE.exec(c);
      if (b && (b[1] || b[3]) && b[2] && LETRA.test(b[2])) { var t2 = nucleo(b[2], h + 1); if (t2 != null) return b[1] + t2 + b[3]; }
    }
    return null;
  }
  // Traduce los trozos de un texto partido por sep. todas = tienen que traducirse todos los trozos con letras
  function partes(c, sep, h, todas) {
    var ps = c.split(sep), alguna = false, sin = false;
    var tr = ps.map(function (p) { if (!LETRA.test(p)) return p; var t = nucleo(p.trim(), h + 1); if (t == null) { sin = true; return p; } alguna = true; return t; });
    return alguna && (!todas || !sin) ? tr.join(sep) : null;
  }
  var CACHE = new Map();
  I.tr = function (s) {
    if (I.lang === 'es' || s == null) return s;
    s = String(s); if (!s) return s;
    var hit = CACHE.get(s); if (hit != null) return hit;
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), c = m[2].replace(/\s+/g, ' '), r = c;
    if (LETRA.test(c)) { var t = nucleo(c, 0); if (t != null) r = t; else { var kv = claveYValores(c); if (kv.vals.length && SOLO_HUECOS.test(kv.k)) r = rellenar(kv.k, kv.vals); } }
    r = formatoIngles(r);
    var out = r === c ? s : m[1] + r + m[3];
    if (CACHE.size > 20000) CACHE.clear();
    CACHE.set(s, out);
    return out;
  };
  // ¿Sabe traducirlo? (para las pruebas y el «idioma falso»)
  I.sabe = function (s) { var c = String(s).replace(/\s+/g, ' ').trim(); return nucleo(c, 0) != null; };

  /* ---------- La capa sobre la página ---------- */
  var ATR = ['placeholder', 'title', 'aria-label', 'alt', 'data-c'];
  var OBS_ATR = ATR.concat(['href']);
  var hecho = new WeakMap();   // nodo de texto → lo que tiene ahora (ya mirado)
  var orig = new WeakMap();    // nodo de texto → el texto en español (para volver al español)
  var origA = new WeakMap();   // elemento → { atributo: [español, inglés] }
  var obs = null;
  function saltar(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      var n = e.nodeName;
      if (n === 'SCRIPT' || n === 'STYLE' || n === 'TEXTAREA' || n === 'CODE') return true;
      if (e.getAttribute('translate') === 'no' || e.isContentEditable) return true;
    }
    return false;
  }
  function trTexto(n) {
    var d = n.data; if (hecho.get(n) === d) return;
    if (!LETRA.test(d) && d.indexOf('€') < 0 && d.indexOf('%') < 0) { hecho.set(n, d); return; }
    if (saltar(n.parentNode)) { hecho.set(n, d); return; }
    var t = I.tr(d);
    if (t !== d) { orig.set(n, d); hecho.set(n, t); n.data = t; } else hecho.set(n, d);
  }
  function trAtr(el, a) {
    var v = el.getAttribute(a); if (v == null || v === '') return;
    var mem = origA.get(el); if (mem && mem[a] && mem[a][1] === v) return;
    if (!LETRA.test(v) || saltar(el)) return;
    var t = I.tr(v);
    if (t !== v) { if (!mem) origA.set(el, mem = {}); mem[a] = [v, t]; el.setAttribute(a, t); }
  }
  function trArbol(raiz) {
    if (!raiz) return;
    if (raiz.nodeType === 3) { trTexto(raiz); return; }
    if (raiz.nodeType !== 1 && raiz.nodeType !== 9 && raiz.nodeType !== 11) return;
    if (raiz.nodeType === 1) { if (saltar(raiz)) return; tratarEl(raiz); }
    var doc = raiz.ownerDocument || raiz;
    var w = doc.createTreeWalker(raiz, 5 /* elementos y textos */, { acceptNode: filtro }), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) trTexto(n); else tratarEl(n); }
  }
  function filtro(n) {
    if (n.nodeType !== 1) return 1;
    var nn = n.nodeName;
    return (nn === 'SCRIPT' || nn === 'STYLE' || nn === 'TEXTAREA' || nn === 'CODE' || n.getAttribute('translate') === 'no') ? 2 /* sin mirar dentro */ : 1;
  }
  function tratarEl(n) {
    if (n.nodeType !== 1) return;
    for (var i = 0; i < ATR.length; i++) if (n.hasAttribute(ATR[i])) trAtr(n, ATR[i]);
    if (n.nodeName === 'INPUT' && /^(button|submit)$/i.test(n.type)) trBoton(n);
    if (n.nodeName === 'A') trWa(n);
  }
  // Mensajes de WhatsApp que prepara la app (enlaces wa.me/?text=…): cada línea, si se sabe traducir; los enlaces, tal cual
  I.trMensaje = function (txt) {
    if (I.lang === 'es' || !txt) return txt;
    return String(txt).split('\n').map(function (l) {
      var m = /^([\s\S]*?)(\s*https?:\/\/\S+\s*)$/.exec(l);
      return m && m[1] ? I.tr(m[1]) + m[2] : I.tr(l);
    }).join('\n');
  };
  function trWa(el) {
    var h = el.getAttribute && el.getAttribute('href'); if (!h || h.indexOf('https://wa.me/') !== 0 || h.indexOf('text=') < 0) return;
    var mem = origA.get(el); if (mem && mem.href && mem.href[1] === h) return;
    var i = h.indexOf('text=') + 5, j = h.indexOf('&', i), txt; if (j < 0) j = h.length;
    try { txt = decodeURIComponent(h.slice(i, j)); } catch (e) { return; }
    var t = I.trMensaje(txt); if (t === txt) return;
    var nh = h.slice(0, i) + encodeURIComponent(t) + h.slice(j);
    if (!mem) origA.set(el, mem = {}); mem.href = [h, nh]; el.setAttribute('href', nh);
  }
  function trBoton(el) { var v = el.value, t = I.tr(v); if (t !== v) { var mem = origA.get(el) || {}; mem.value = [v, t]; origA.set(el, mem); el.value = t; } }
  function alCambiar(ms) {
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (m.type === 'characterData') trTexto(m.target);
      else if (m.type === 'attributes') { if (m.attributeName === 'href') trWa(m.target); else trAtr(m.target, m.attributeName); }
      else for (var j = 0; j < m.addedNodes.length; j++) { var n = m.addedNodes[j]; if (n.isConnected !== false) trArbol(n); }
    }
  }
  I.traducirTodo = function () { if (I.lang !== 'es' && document.documentElement) trArbol(document.documentElement); };
  function vigilar() {
    if (obs || typeof MutationObserver === 'undefined' || !document.documentElement) return;
    obs = new MutationObserver(alCambiar);
    obs.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: OBS_ATR });
  }
  function dejarDeVigilar() { if (obs) { alCambiar(obs.takeRecords()); obs.disconnect(); obs = null; } }
  // vuelve a poner el español en lo que se tradujo (al cambiar a español sin recargar)
  function volverAlEspanol(raiz) {
    var w = document.createTreeWalker(raiz, 5, null), n;
    var una = function (x) {
      if (x.nodeType === 3) { var o = orig.get(x); if (o != null && hecho.get(x) === x.data) x.data = o; orig.delete(x); hecho.delete(x); }
      else { var mem = origA.get(x); if (mem) { Object.keys(mem).forEach(function (a) { if (a === 'value') { if (x.value === mem[a][1]) x.value = mem[a][0]; } else if (x.getAttribute(a) === mem[a][1]) x.setAttribute(a, mem[a][0]); }); origA.delete(x); } }
    };
    una(raiz); while ((n = w.nextNode())) una(n);
  }

  /* ---------- Diccionario (solo se carga con inglés) ---------- */
  var esperando = [];
  I.cargarDic = function (cb) {
    if (I.en) { if (cb) cb(); return; }
    if (cb) esperando.push(cb);
    if (I._cargando) return; I._cargando = true;
    if (document.readyState === 'loading' && !document.body && document.currentScript) { document.write('<script src="i18n-en.js"><\/script>'); return; } // mientras se lee la página: sin destello
    var s = document.createElement('script'); s.src = 'i18n-en.js'; s.async = true;
    s.onload = function () { I._cargando = false; };
    s.onerror = function () { I._cargando = false; };
    (document.head || document.documentElement).appendChild(s);
  };
  // lo llama i18n-en.js al terminar de cargar
  I.dicListo = function () { CACHE.clear(); I._cargando = false; var l = esperando; esperando = []; l.forEach(function (f) { try { f(); } catch (e) { /* */ } }); if (I.lang !== 'es') { vigilar(); I.traducirTodo(); } };

  /* ---------- Poner un idioma ---------- */
  var alCambio = [];
  I.alCambiar = function (f) { alCambio.push(f); };
  I.poner = function (l, elegido) {
    if (!I.valido(l)) return;
    if (elegido) lsSet('idioma', l);
    var antes = I.lang; I.lang = l; CACHE.clear();
    if (document.documentElement) document.documentElement.setAttribute('lang', l);
    if (l === 'es') { dejarDeVigilar(); if (antes !== 'es' && document.documentElement) volverAlEspanol(document.documentElement); }
    else { vigilar(); if (I.en) I.traducirTodo(); else I.cargarDic(); }
    if (antes !== l) alCambio.forEach(function (f) { try { f(l, antes); } catch (e) { /* */ } });
  };
  /* Al llegar la configuración de la cuenta (desde app.js). Devuelve el idioma que hay que guardar en la cuenta, o null.
     - Si la cuenta ya tiene idioma, ese.
     - Si se eligió a mano en este móvil, ese (y se guarda en la cuenta si no es el español).
     - Cuenta nueva (sin configuración todavía): el del móvil (y se guarda si no es el español).
     - Cuenta de antes de que hubiera idiomas: español, como siempre. */
  I.desdeConfig = function (c, existia) {
    if (window.__I18N_FORZAR && !(c && I.valido(c.idioma))) return null;
    var l, guardar = null;
    if (c && I.valido(c.idioma)) l = c.idioma;
    else if (I.elegidoAqui()) { l = I.elegidoAqui(); if (l !== 'es') guardar = l; }
    else if (!existia) { l = I.delDispositivo(); if (l !== 'es') guardar = l; }
    else l = 'es';
    if (l !== I.lang) I.poner(l, false);
    if (c && I.valido(c.idioma)) lsSet('idioma', c.idioma);
    return guardar;
  };

  /* ---------- Diálogos del navegador ---------- */
  ['confirm', 'alert', 'prompt'].forEach(function (k) {
    var f = window[k]; if (typeof f !== 'function') return;
    window[k] = function (m) { var a = Array.prototype.slice.call(arguments); if (I.lang !== 'es') a[0] = I.tr(m); return f.apply(window, a); };
  });

  /* ---------- Arranque ---------- */
  if (document.documentElement) document.documentElement.setAttribute('lang', I.lang);
  if (I.lang !== 'es') { vigilar(); I.cargarDic(); }
})();

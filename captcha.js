/* CAPTCHA de Cloudflare Turnstile (13/11/2026, decisión del dueño; docs/salud/2026-11-12-diag-datos n.º 4).
   Se pone en el alta, la entrada y «¿Olvidaste tu contraseña?». La clave del sitio es PÚBLICA a propósito
   (la secreta está solo en Supabase → Authentication → Attack Protection).
   Mientras Supabase no tenga el CAPTCHA activado, mandar el código no cambia nada. */
(function () {
  'use strict';
  var SITE_KEY = '0x4AAAAAAF_-bIZCso31NHG1';
  var token = null, widget = null, cargando = null;

  function cargar() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (cargando) return cargando;
    cargando = new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = function () { ok(window.turnstile); };
      s.onerror = function () { cargando = null; mal(new Error('captcha')); };
      document.head.appendChild(s);
    });
    return cargando;
  }

  window.Captcha = {
    activo: !!SITE_KEY,
    // Pinta la casilla dentro del elemento (selector o nodo). Cada vez que se pinta, el código anterior deja de valer.
    montar: function (donde) {
      if (!SITE_KEY) return;
      token = null;
      var el = typeof donde === 'string' ? document.querySelector(donde) : donde;
      if (!el) return;
      cargar().then(function (ts) {
        if (!el.isConnected) return;
        try { if (widget != null) ts.remove(widget); } catch (e) { /* ya no estaba */ }
        widget = ts.render(el, {
          sitekey: SITE_KEY,
          language: (document.documentElement.lang || 'es').slice(0, 2),
          theme: document.documentElement.dataset.tema === 'oscuro' ? 'dark' : 'auto',
          callback: function (t) { token = t; },
          'expired-callback': function () { token = null; },
          'error-callback': function () { token = null; },
        });
      }).catch(function () {
        el.innerHTML = '<div class="captcha-nota">No se pudo cargar la comprobación de seguridad. Revisa tu conexión.</div>';
      });
    },
    // Espera al código (la comprobación suele tardar 1-2 s). Devuelve null si no llega a tiempo.
    esperar: function (ms) {
      if (!SITE_KEY) return Promise.resolve(null);
      var hasta = Date.now() + (ms || 8000);
      return new Promise(function (ok) {
        (function mira() { if (token) return ok(token); if (Date.now() > hasta) return ok(null); setTimeout(mira, 150); })();
      });
    },
    // Tras usarlo (vale una sola vez): se pide otro.
    gastado: function () { token = null; try { if (window.turnstile && widget != null) window.turnstile.reset(widget); } catch (e) { /* */ } },
  };
})();

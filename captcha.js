/* CAPTCHA de Cloudflare Turnstile (13/11/2026, decisión del dueño; docs/salud/2026-11-12-diag-datos n.º 4).
   Se pone en el alta, la entrada y «¿Olvidaste tu contraseña?». La clave del sitio es PÚBLICA a propósito
   (la secreta está solo en Supabase → Authentication → Attack Protection).
   Mientras Supabase no tenga el CAPTCHA activado, mandar el código no cambia nada.
   fase14 (13/11): la casilla de Cloudflare va con appearance «interaction-only» (la forma que Cloudflare permite para no
   enseñarla): no se ve salvo que Cloudflare necesite que la persona toque algo. Mientras comprueba, sale NUESTRA animación
   (la paloma con la moneda, sin imágenes de fuera) y «Comprobando que eres tú…»; al llegar el código, «Listo» con un check.
   Si Cloudflare pide tocar, su casilla sale debajo de la animación. El alto de la línea está reservado: no mueve la pantalla. */
(function () {
  'use strict';
  var SITE_KEY = '0x4AAAAAAF_-bIZCso31NHG1';
  var token = null, widget = null, cargando = null, caja = null;

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

  // La marca de PalomApp (la de marcaHtml() en app.js) partida en dos alas que aletean y la moneda que gira
  var LOGO = '<svg class="cap-logo" viewBox="70 160 374 240" aria-hidden="true" focusable="false">' +
    '<g class="cap-alas" fill="none" stroke="currentColor" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">' +
    '<path class="cap-ala i" d="M84 238 Q112 202 172 198 Q224 196 256 246"/><path class="cap-ala d" d="M256 246 Q288 196 340 194 Q402 194 430 214"/></g>' +
    '<circle class="cap-moneda" cx="256" cy="334" r="48" fill="#FFC93C"/></svg>';
  var CHECK = '<svg class="cap-check" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var TEXTOS = {
    comprobando: 'Comprobando que eres tú…',
    listo: 'Listo',
    pide: 'Toca la casilla de abajo para seguir',
    error: 'No se pudo comprobar. Revisa tu conexión.',
  };

  function estilos() {
    if (document.getElementById('captchaEstilos')) return;
    var st = document.createElement('style'); st.id = 'captchaEstilos';
    st.textContent =
      '.captcha.cap{display:block;margin:4px 0 10px;min-height:0}' +
      '.cap-linea{display:flex;align-items:center;justify-content:center;gap:10px;height:40px;font-size:13px;line-height:1.25;text-align:center;color:var(--text-faint,#6b6f80)}' +
      '.cap-logo{width:40px;height:26px;flex:none;color:var(--ink,currentColor);overflow:visible;transition:width .3s ease,height .3s ease}' +
      '.cap-ala{transform-box:view-box;transform-origin:256px 246px}' +
      '.cap-moneda{transform-box:fill-box;transform-origin:center}' +
      '.cap.comprobando .cap-ala.i{animation:cap-ala-i 1.1s ease-in-out infinite}' +
      '.cap.comprobando .cap-ala.d{animation:cap-ala-d 1.1s ease-in-out infinite}' +
      '.cap.comprobando .cap-moneda{animation:cap-moneda 1.6s ease-in-out infinite}' +
      '@keyframes cap-ala-i{0%,100%{transform:rotate(0)}50%{transform:rotate(-14deg)}}' +
      '@keyframes cap-ala-d{0%,100%{transform:rotate(0)}50%{transform:rotate(14deg)}}' +
      '@keyframes cap-moneda{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.12)}}' +
      '.cap-check{width:16px;height:16px;flex:none;display:none;color:var(--income,#1a8a5a)}' +
      '.cap.listo .cap-check{display:block;animation:cap-pop .35s cubic-bezier(.3,1.6,.5,1)}' +
      '.cap.listo .cap-linea{color:var(--income,#1a8a5a);font-weight:600;gap:6px}' +
      '.cap.listo .cap-logo{width:28px;height:18px}' +
      '.cap.error{display:none}' + // 14/11: si Cloudflare falla se puede entrar igual (la app lo intenta sin código); no se asusta a nadie

      '@keyframes cap-pop{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}' +
      '.cap-cf{display:flex;justify-content:center}' +
      '.cap-cf:empty{display:none}' +
      '@media (prefers-reduced-motion: reduce){.cap .cap-ala,.cap .cap-moneda,.cap .cap-check{animation:none!important}.cap-logo{transition:none}}';
    document.head.appendChild(st);
  }
  function tr(t) { try { return window.I18N && window.I18N.lang === 'en' && window.I18N.tr ? window.I18N.tr(t) : t; } catch (e) { return t; } }
  function poner(estado) {
    if (!caja || !caja.isConnected) return;
    caja.classList.remove('comprobando', 'listo', 'pide', 'error');
    caja.classList.add(estado);
    caja.setAttribute('data-estado', estado);
    var t = caja.querySelector('.cap-txt'); if (t) t.textContent = tr(TEXTOS[estado]);
  }

  window.Captcha = {
    activo: !!SITE_KEY,
    TEXTOS: TEXTOS,
    // Pinta nuestra animación y, debajo, la casilla de Cloudflare (que solo se ve si hace falta tocarla).
    // Cada vez que se pinta, el código anterior deja de valer.
    montar: function (donde) {
      if (!SITE_KEY) return;
      token = null;
      var el = typeof donde === 'string' ? document.querySelector(donde) : donde;
      if (!el) return;
      estilos();
      el.classList.add('cap');
      el.innerHTML = '<div class="cap-linea" role="status" aria-live="polite">' + LOGO + CHECK + '<span class="cap-txt"></span></div><div class="cap-cf"></div>';
      caja = el; poner('comprobando');
      var cf = el.querySelector('.cap-cf');
      cargar().then(function (ts) {
        if (!el.isConnected) return;
        try { if (widget != null) ts.remove(widget); } catch (e) { /* ya no estaba */ }
        widget = ts.render(cf, {
          sitekey: SITE_KEY,
          appearance: 'interaction-only', // no se ve salvo que Cloudflare necesite que la persona toque algo
          size: 'flexible',
          language: (document.documentElement.lang || 'es').slice(0, 2),
          theme: document.documentElement.dataset.tema === 'oscuro' ? 'dark' : 'auto',
          callback: function (t) { token = t; poner('listo'); },
          'before-interactive-callback': function () { poner('pide'); },
          'after-interactive-callback': function () { if (!token) poner('comprobando'); },
          'expired-callback': function () { token = null; poner('comprobando'); },
          'timeout-callback': function () { token = null; poner('pide'); },
          'error-callback': function () { token = null; poner('error'); },
          'unsupported-callback': function () { token = null; poner('error'); },
        });
      }).catch(function () { poner('error'); });
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
    gastado: function () { token = null; poner('comprobando'); try { if (window.turnstile && widget != null) window.turnstile.reset(widget); } catch (e) { /* */ } },
  };
  // 14/11: si la pantalla de entrada o de alta ya estaba pintada antes de cargar este archivo, se monta ahora
  ['#loginCaptcha', '#signupCaptcha'].forEach(function (s) { var el = document.querySelector(s); if (el && !el.firstChild) window.Captcha.montar(el); });
})();

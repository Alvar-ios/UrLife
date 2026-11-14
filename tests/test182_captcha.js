// 13/11/2026 · CAPTCHA (Cloudflare Turnstile) en la entrada, «¿Olvidaste tu contraseña?» y el alta (auth-signup.js, con permiso
// del dueño). Turnstile y Supabase se simulan: el código del CAPTCHA tiene que llegar a Supabase, y si Cloudflare no responde se intenta igual (14/11).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  // 1) Entrada y contraseña olvidada (app.js)
  const llamadas = [];
  let codigo = 'tok-1';
  const pre = (w) => { w.Auth.onChange = (f) => setTimeout(() => f(null), 0); w.Captcha = { activo: true, montados: [], montar(d) { this.montados.push(d); }, esperar: async () => codigo, gastado() {} }; };
  const e = makeEnv({ pre, session: null });
  e.w.Auth.signIn = async (em, pw, cc) => { llamadas.push(['in', cc]); throw new Error('Invalid login credentials'); };
  e.w.Auth.resetPassword = async (em, cc) => { llamadas.push(['reset', cc]); };
  await e.w.__APP__.main(); await sleep(400);
  const d = e.w.document;
  if (!d.getElementById('loginEmail')) { const A = e.w.__APP__; if (A.renderLoginScreen) A.renderLoginScreen(); }
  ok(!!d.getElementById('loginCaptcha') && e.w.Captcha.montados.includes('#loginCaptcha'), 'la pantalla de entrada lleva la casilla del CAPTCHA');
  d.getElementById('loginEmail').value = 'prueba@example.invalid'; d.getElementById('loginPassword').value = 'secreta1';
  await e.w.__APP__.H.doLogin([]); await sleep(50);
  ok(llamadas.some((l) => l[0] === 'in' && l[1] === 'tok-1'), 'al entrar, el código del CAPTCHA llega a Supabase');
  d.getElementById('loginEmail').value = 'prueba@example.invalid';
  await e.w.__APP__.H.doForgotPassword([]); await sleep(50);
  ok(llamadas.some((l) => l[0] === 'reset' && l[1] === 'tok-1'), '«¿Olvidaste tu contraseña?» también manda el código');
  codigo = null; llamadas.length = 0;
  d.getElementById('loginEmail').value = 'prueba@example.invalid'; d.getElementById('loginPassword').value = 'secreta1';
  await e.w.__APP__.H.doLogin([]); await sleep(50);
  ok(llamadas.length === 1 && llamadas[0][1] == null, 'si Cloudflare no responde, se intenta entrar igual (sin código): no se bloquea la entrada');

  // 2) Alta (auth-signup.js)
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="app"><div class="card auth-card"><input id="loginEmail"><button data-click="doLogin"></button></div></div></body></html>', { runScripts: 'outside-only' });
  const w = dom.window, altas = [];
  w.SUPABASE_CONFIG = { url: 'https://x.supabase.co', anonKey: 'publica' };
  w.supabase = { createClient: () => ({ auth: { signUp: async (o) => { altas.push(o); return { data: { session: null }, error: null }; } } }) };
  let cod2 = 'tok-alta'; w.Captcha = { activo: true, montados: [], montar(x) { this.montados.push(x); }, esperar: async () => cod2, gastado() { this.g = true; } };
  w.eval(fs.readFileSync(path.join(__dirname, '..', 'auth-signup.js'), 'utf8'));
  await sleep(20);
  w.document.querySelector('[data-auth-signup]').click(); await sleep(20);
  ok(w.Captcha.montados.includes('#signupCaptcha') && !!w.document.getElementById('signupCaptcha'), 'el alta lleva la casilla del CAPTCHA');
  w.document.getElementById('signupEmail').value = 'nueva@example.invalid';
  w.document.getElementById('signupPassword').value = 'secreta1'; w.document.getElementById('signupPassword2').value = 'secreta1';
  w.document.getElementById('signupSubmit').click(); await sleep(50);
  ok(altas[0] && altas[0].options && altas[0].options.captchaToken === 'tok-alta' && w.Captcha.g, 'al crear la cuenta, el código llega a Supabase y se pide otro');
  w.eval("window.__APP__ = { main(){} }");
  w.document.getElementById('backToLogin2') && w.document.getElementById('backToLogin2').click();
  // 3) fase14 · nuestra animación en vez de la de Cloudflare (captcha.js de verdad, con Turnstile simulado)
  const mk = (html) => {
    const dm = new JSDOM('<!doctype html><html lang="es"><head></head><body>' + html + '</body></html>', { runScripts: 'outside-only' });
    const ww = dm.window, opts = [];
    ww.turnstile = { render(el, o) { opts.push({ el, o }); return 'w' + opts.length; }, remove() {}, reset() { this.resets = (this.resets || 0) + 1; } };
    ww.eval(fs.readFileSync(path.join(__dirname, '..', 'captcha.js'), 'utf8'));
    return { ww, opts };
  };
  const c1 = mk('<div class="captcha" id="loginCaptcha"></div><button id="despues">Iniciar sesión</button>');
  const cw = c1.ww, cd = cw.document, caja = cd.getElementById('loginCaptcha');
  cw.Captcha.montar('#loginCaptcha'); await sleep(20);
  const o = (c1.opts[0] || {}).o || {};
  ok(o.appearance === 'interaction-only' && o.size === 'flexible', 'Turnstile con appearance «interaction-only» y size «flexible» (su casilla solo sale si hace falta tocarla)');
  ok(c1.opts[0] && c1.opts[0].el === caja.querySelector('.cap-cf'), 'la casilla de Cloudflare va debajo de nuestra animación (en .cap-cf)');
  ok(caja.dataset.estado === 'comprobando' && !!caja.querySelector('.cap-linea svg.cap-logo .cap-moneda') && caja.querySelectorAll('.cap-ala').length === 2, 'mientras no hay código: la paloma con la moneda (dos alas y la moneda)');
  ok(/Comprobando que eres tú…/.test(caja.querySelector('.cap-txt').textContent) && caja.querySelector('.cap-linea').getAttribute('role') === 'status', '«Comprobando que eres tú…», leído por el lector de pantalla');
  ok(!/<img|https?:\/\//.test(caja.innerHTML), 'sin imágenes ni nada de fuera en la animación');
  const css = (cd.getElementById('captchaEstilos') || {}).textContent || '';
  ok(/prefers-reduced-motion: reduce/.test(css) && /\.cap-linea\{[^}]*height:40px/.test(css), 'respeta «reducir movimiento» y reserva el alto (40 px) para no mover la pantalla');
  ok(/var\(--text-faint/.test(css) && /var\(--ink/.test(css), 'usa los colores de la app (sirve en claro y en oscuro)');
  o['before-interactive-callback'](); ok(caja.dataset.estado === 'pide' && /Toca la casilla/.test(caja.textContent), 'si Cloudflare pide tocar: «Toca la casilla de abajo para seguir»');
  let antes = null; cw.Captcha.esperar(400).then((t) => { antes = t; });
  o.callback('tok-anim'); await sleep(200);
  ok(caja.dataset.estado === 'listo' && caja.querySelector('.cap-txt').textContent === 'Listo' && !!caja.querySelector('.cap-check'), 'al llegar el código: «Listo» con un check');
  ok(antes === 'tok-anim', 'y el código está listo para entrar');
  cw.Captcha.gastado(); ok(caja.dataset.estado === 'comprobando' && cw.turnstile.resets === 1, 'tras usarlo se pide otro y vuelve la animación');
  o['error-callback'](); ok(caja.dataset.estado === 'error' && /Revisa tu conexión/.test(caja.textContent), 'si falla, lo dice');
  // en el alta (auth-signup.js) también
  const dom3 = new JSDOM('<!doctype html><html><head></head><body><div id="app"><div class="card auth-card"><input id="loginEmail"><button data-click="doLogin"></button></div></div></body></html>', { runScripts: 'outside-only' });
  const w3 = dom3.window; w3.SUPABASE_CONFIG = { url: 'https://x.supabase.co', anonKey: 'publica' };
  w3.supabase = { createClient: () => ({ auth: { signUp: async () => ({ data: { session: null }, error: null }) } }) };
  const o3 = []; w3.turnstile = { render(el, op) { o3.push(op); return 'w1'; }, remove() {}, reset() {} };
  w3.eval(fs.readFileSync(path.join(__dirname, '..', 'captcha.js'), 'utf8')); w3.eval(fs.readFileSync(path.join(__dirname, '..', 'auth-signup.js'), 'utf8'));
  await sleep(20); w3.document.querySelector('[data-auth-signup]').click(); await sleep(30);
  const sc = w3.document.getElementById('signupCaptcha');
  ok(sc && sc.dataset.estado === 'comprobando' && !!sc.querySelector('.cap-logo') && o3[0] && o3[0].appearance === 'interaction-only', 'el alta enseña la misma animación y la casilla «interaction-only»');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

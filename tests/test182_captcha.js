// 13/11/2026 · CAPTCHA (Cloudflare Turnstile) en la entrada, «¿Olvidaste tu contraseña?» y el alta (auth-signup.js, con permiso
// del dueño). Turnstile y Supabase se simulan: el código del CAPTCHA tiene que llegar a Supabase, y sin código no se intenta.
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
  ok(!llamadas.length && /robot/.test(d.body.textContent), 'sin código no se intenta entrar y se explica por qué');

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
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

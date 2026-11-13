// 13/11/2026 · El enlace del correo de confirmación del alta vuelve a la web de PalomApp, nunca a «localhost»
// (la madre del dueño vio un error al confirmar). auth-signup.js tocado con permiso del dueño. Supabase se simula.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function alta(url) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="app"><div class="card auth-card"><input id="loginEmail"><button data-click="doLogin"></button></div></div></body></html>', { url, runScripts: 'outside-only' });
  const w = dom.window, altas = [];
  w.SUPABASE_CONFIG = { url: 'https://x.supabase.co', anonKey: 'publica' };
  w.supabase = { createClient: () => ({ auth: { signUp: async (o) => { altas.push(o); return { data: { session: null }, error: null }; } } }) };
  w.eval(fs.readFileSync(path.join(__dirname, '..', 'auth-signup.js'), 'utf8'));
  await espera(20);
  w.document.querySelector('[data-auth-signup]').click(); await espera(20);
  w.document.getElementById('signupEmail').value = 'nueva@example.invalid';
  w.document.getElementById('signupPassword').value = 'secreta1'; w.document.getElementById('signupPassword2').value = 'secreta1';
  w.document.getElementById('signupSubmit').click(); await espera(60);
  return altas[0] && altas[0].options && altas[0].options.emailRedirectTo;
}
(async () => {
  ok(await alta('http://localhost:3000/') === 'https://urlife-zeta.vercel.app/', 'desde un ordenador de pruebas (localhost) el correo devuelve a la web de PalomApp');
  ok(await alta('https://localhost/') === 'https://urlife-zeta.vercel.app/', 'desde la app de Android también');
  ok(await alta('https://urlife-zeta.vercel.app/') === 'https://urlife-zeta.vercel.app/', 'desde la web, a la misma web');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

/* Registro de usuarios desde la pantalla de login. */
(function () {
  'use strict';

  const cfg = window.SUPABASE_CONFIG || {};
  if (!window.supabase || !cfg.url || !cfg.anonKey) return;

  const client = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function addLink() {
    const card = document.querySelector('.auth-card') || document.querySelector('#loginEmail')?.closest('.card');
    if (!card || card.dataset.authMode === 'signup') return;
    if (card.querySelector('[data-auth-signup]')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'auth-link';
    b.dataset.authSignup = '1';
    b.textContent = '¿No tienes cuenta? Crear una';
    const forgot = card.querySelector('[data-click="doForgotPassword"]');
    (forgot || card.querySelector('[data-click="doLogin"]'))?.insertAdjacentElement('afterend', b);
  }

  function showSignup() {
    const card = document.querySelector('.auth-card') || document.querySelector('#loginEmail')?.closest('.card');
    if (!card) return;
    card.dataset.authMode = 'signup';
    card.innerHTML =
      '<div class="auth-head"><div class="auth-title">Crear cuenta</div><div class="auth-subtitle">Mis Finanzas y Tareas</div></div>' +
      '<div class="field"><label>Correo</label><input id="signupEmail" type="email" autocomplete="email" placeholder="tu@correo.com"></div>' +
      '<div class="field"><label>Contraseña</label><input id="signupPassword" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres"></div>' +
      '<div class="field"><label>Repite la contraseña</label><input id="signupPassword2" type="password" autocomplete="new-password" placeholder="Repite tu contraseña"></div>' +
      '<div id="signupMsg"></div>' +
      '<button class="btn accent block" id="signupSubmit" style="margin-top:6px;">Crear cuenta</button>' +
      '<button class="auth-link" id="backToLogin">¿Ya tienes cuenta? Iniciar sesión</button>';
    setTimeout(() => document.getElementById('signupEmail')?.focus(), 60);
  }

  function showMessage(msg) {
    const el = document.getElementById('signupMsg');
    if (el) el.innerHTML = '<div class="alert auth-message" style="margin-top:2px;"><div>' + escapeHtml(msg) + '</div></div>';
  }

  async function signup() {
    const email = (document.getElementById('signupEmail')?.value || '').trim();
    const password = document.getElementById('signupPassword')?.value || '';
    const password2 = document.getElementById('signupPassword2')?.value || '';
    if (!email || !password || !password2) return showMessage('Completa todos los campos.');
    if (password.length < 6) return showMessage('La contraseña debe tener al menos 6 caracteres.');
    if (password !== password2) return showMessage('Las contraseñas no coinciden.');

    const b = document.getElementById('signupSubmit');
    b.disabled = true; b.textContent = 'Creando cuenta…';

    try {
      const res = await client.auth.signUp({ email, password });
      if (res.error) throw res.error;

      if (res.data && res.data.session) {
        await window.Auth.signIn(email, password);
        return;
      }

      const card = document.querySelector('.auth-card');
      if (card) card.dataset.authMode = 'login';
      document.getElementById('app').innerHTML =
        '<div class="auth-screen"><div class="card auth-card">' +
        '<div class="auth-head"><div class="auth-title">Cuenta creada</div><div class="auth-subtitle">Mis Finanzas y Tareas</div></div>' +
        '<div class="alert auth-message"><div>Revisa tu correo para confirmar la cuenta y después inicia sesión.</div></div>' +
        '<button class="btn accent block" id="backToLogin2">Iniciar sesión</button>' +
        '</div></div>';
    } catch (e) {
      const raw = String(e?.message || '').toLowerCase();
      let msg = 'No se pudo crear la cuenta. Inténtalo de nuevo.';
      if (raw.includes('already') || raw.includes('registered') || raw.includes('exists')) msg = 'Ese correo ya tiene una cuenta. Prueba a iniciar sesión.';
      else if (raw.includes('password')) msg = 'La contraseña no cumple los requisitos.';
      else if (raw.includes('email')) msg = 'Introduce un correo electrónico válido.';
      showMessage(msg);
      b.disabled = false; b.textContent = 'Crear cuenta';
    }
  }

  function showLogin() {
    if (window.__APP__?.main) window.__APP__.main();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-auth-signup]')) { e.preventDefault(); showSignup(); return; }
    if (e.target.closest('#backToLogin, #backToLogin2')) { e.preventDefault(); showLogin(); return; }
    if (e.target.closest('#signupSubmit')) { e.preventDefault(); signup(); }
  });

  const style = document.createElement('style');
  style.textContent = '.auth-screen{min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px}.auth-card{width:100%;max-width:360px}.auth-head{text-align:center;margin-bottom:22px}.auth-title{font-family:var(--font-display);font-size:26px;font-weight:600;color:var(--ink)}.auth-subtitle{font-size:13px;color:var(--text-faint);margin-top:2px}.auth-link{display:block;width:100%;margin-top:14px;padding:8px;border:0;background:none;color:var(--accent);font:500 13px var(--font-ui);cursor:pointer}';
  document.head.appendChild(style);

  const observer = new MutationObserver(addLink);
  observer.observe(document.getElementById('app'), { childList: true, subtree: true });
  addLink();
})();
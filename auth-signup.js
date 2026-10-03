/* ============================================================
   AUTENTICACIÓN — alta de nuevos usuarios
   Mantiene la pantalla existente y añade un modo "Crear cuenta".
   ============================================================ */
(function () {
  'use strict';

  const cfg = window.SUPABASE_CONFIG || {};
  if (!window.supabase || !cfg.url || !cfg.anonKey) return;

  const signupClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // Añade signUp sin modificar la capa de datos existente.
  if (window.Auth) {
    window.Auth.signUp = function (email, password) {
      return signupClient.auth.signUp({ email: email, password: password }).then(function (res) {
        if (res.error) {
          const err = new Error(res.error.message || 'No se pudo crear la cuenta.');
          err.code = res.error.code || res.error.status;
          throw err;
        }
        return res.data;
      });
    };
  }

  function injectStyles() {
    if (document.getElementById('signupStyles')) return;
    const style = document.createElement('style');
    style.id = 'signupStyles';
    style.textContent =
      '.auth-switch{display:block;width:100%;margin-top:14px;padding:8px;border:0;background:none;color:var(--accent);font:500 13px var(--font-ui);cursor:pointer}' +
      '.auth-title{font-family:var(--font-display);font-size:25px;font-weight:600;color:var(--ink);margin-bottom:3px}' +
      '.auth-subtitle{font-size:12.5px;color:var(--text-faint)}';
    document.head.appendChild(style);
  }

  function findCard() {
    const email = document.getElementById('loginEmail');
    return email ? email.closest('.card') : null;
  }

  function loginView() {
    const card = findCard();
    if (!card) return;

    const title = card.querySelector('.num');
    if (title) {
      title.className = 'auth-title';
      title.innerHTML = 'Mis Finanzas<span class="auth-subtitle" style="display:block;">y Tareas</span>';
    }

    const confirm = document.getElementById('loginPasswordConfirm');
    if (confirm) confirm.closest('.field').remove();

    const password = document.getElementById('loginPassword');
    if (password) {
      password.autocomplete = 'current-password';
      password.placeholder = '';
    }

    const main = card.querySelector('[data-auth-action="submitSignup"]');
    if (main) {
      main.removeAttribute('data-auth-action');
      main.setAttribute('data-click', 'doLogin');
      main.textContent = 'Iniciar sesión';
    }

    const forgot = card.querySelector('[data-auth-action="forgot"]');
    if (forgot) {
      forgot.setAttribute('data-click', 'doForgotPassword');
      forgot.removeAttribute('data-auth-action');
      forgot.textContent = '¿Olvidaste tu contraseña?';
    }

    const switchBtn = card.querySelector('[data-auth-action="showLogin"]');
    if (switchBtn) switchBtn.remove();

    addSignupSwitch(card);
  }

  function addSignupSwitch(card) {
    if (card.querySelector('[data-auth-action="showSignup"]')) return;
    const button = document.createElement('button');
    button.className = 'auth-switch';
    button.type = 'button';
    button.setAttribute('data-auth-action', 'showSignup');
    button.textContent = '¿No tienes cuenta? Crear una';
    const forgot = card.querySelector('[data-click="doForgotPassword"]');
    (forgot || card.querySelector('[data-click="doLogin"]')).insertAdjacentElement('afterend', button);
  }

  function signupView() {
    const card = findCard();
    if (!card) return;

    const title = card.querySelector('.num, .auth-title');
    if (title) {
      title.className = 'auth-title';
      title.innerHTML = 'Crear cuenta<span class="auth-subtitle" style="display:block;">Mis Finanzas y Tareas</span>';
    }

    const password = document.getElementById('loginPassword');
    if (!password) return;

    password.autocomplete = 'new-password';
    password.placeholder = 'Mínimo 6 caracteres';

    if (!document.getElementById('loginPasswordConfirm')) {
      const field = document.createElement('div');
      field.className = 'field';
      field.innerHTML =
        '<label>Repite la contraseña</label>' +
        '<input id="loginPasswordConfirm" type="password" autocomplete="new-password" placeholder="Repite tu contraseña">';
      password.closest('.field').insertAdjacentElement('afterend', field);
    }

    const main = card.querySelector('[data-click="doLogin"]');
    if (main) {
      main.removeAttribute('data-click');
      main.setAttribute('data-auth-action', 'submitSignup');
      main.textContent = 'Crear cuenta';
    }

    const forgot = card.querySelector('[data-click="doForgotPassword"]');
    if (forgot) {
      forgot.removeAttribute('data-click');
      forgot.setAttribute('data-auth-action', 'forgot');
      forgot.textContent = '¿Ya tienes cuenta? Iniciar sesión';
    }

    const switchBtn = card.querySelector('[data-auth-action="showSignup"]');
    if (switchBtn) switchBtn.remove();
  }

  function showMessage(text) {
    const card = findCard();
    if (!card) return;
    const old = card.querySelector('.auth-message');
    if (old) old.remove();
    const box = document.createElement('div');
    box.className = 'alert auth-message';
    box.style.marginTop = '2px';
    box.innerHTML = '<div>' + text.replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
    }) + '</div>';
    const main = card.querySelector('[data-auth-action="submitSignup"]');
    if (main) main.insertAdjacentElement('beforebegin', box);
  }

  async function submitSignup() {
    const email = (document.getElementById('loginEmail').value || '').trim();
    const password = document.getElementById('loginPassword').value || '';
    const confirm = document.getElementById('loginPasswordConfirm').value || '';

    if (!email || !password || !confirm) return showMessage('Completa todos los campos.');
    if (password.length < 6) return showMessage('La contraseña debe tener al menos 6 caracteres.');
    if (password !== confirm) return showMessage('Las contraseñas no coinciden.');

    const button = document.querySelector('[data-auth-action="submitSignup"]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Creando cuenta…';
    }

    try {
      const result = await window.Auth.signUp(email, password);

      // Si Supabase confirma automáticamente el usuario, iniciamos sesión
      // mediante la capa normal para que la app cargue sus datos.
      if (result && result.session) {
        await window.Auth.signIn(email, password);
        return;
      }

      showMessage('Cuenta creada. Revisa tu correo para confirmar la cuenta y después inicia sesión.');
      if (button) {
        button.disabled = false;
        button.textContent = 'Crear cuenta';
      }
    } catch (e) {
      const raw = String((e && e.message) || '').toLowerCase();
      let msg = 'No se pudo crear la cuenta. Inténtalo de nuevo.';
      if (raw.includes('already') || raw.includes('registered') || raw.includes('exists')) {
        msg = 'Ese correo ya tiene una cuenta. Prueba a iniciar sesión.';
      } else if (raw.includes('password')) {
        msg = 'La contraseña no cumple los requisitos de Supabase.';
      } else if (raw.includes('email')) {
        msg = 'Introduce un correo electrónico válido.';
      }
      showMessage(msg);
      if (button) {
        button.disabled = false;
        button.textContent = 'Crear cuenta';
      }
    }
  }

  document.addEventListener('click', function (event) {
    const el = event.target.closest ? event.target.closest('[data-auth-action]') : null;
    if (!el) return;

    const action = el.getAttribute('data-auth-action');

    if (action === 'showSignup') {
      event.preventDefault();
      event.stopImmediatePropagation();
      signupView();
      return;
    }

    if (action === 'showLogin' || action === 'forgot') {
      event.preventDefault();
      event.stopImmediatePropagation();
      loginView();
      return;
    }

    if (action === 'submitSignup') {
      event.preventDefault();
      event.stopImmediatePropagation();
      submitSignup();
    }
  }, true);

  const observer = new MutationObserver(function () {
    if (document.getElementById('loginEmail')) {
      injectStyles();
      loginView();
    }
  });

  observer.observe(document.getElementById('app'), { childList: true, subtree: true });
})();

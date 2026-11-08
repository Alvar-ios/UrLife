// Puente entre la web de PalomApp y Android (Capacitor). Se empaqueta con esbuild en www/nativo.js.
// Solo actúa dentro de la app; en la web no hace nada.
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('nativo');
  const N = (window.__nativo = { android: Capacitor.getPlatform() === 'android', huella: false });

  // Barra de estado: iconos oscuros en claro y claros en oscuro, también si el usuario fuerza el tema en Tú
  const oscuro = () => { const t = document.documentElement.getAttribute('data-theme'); return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; };
  const pintarBarra = () => { StatusBar.setStyle({ style: oscuro() ? Style.Dark : Style.Light }).catch(() => {}); };
  new MutationObserver(pintarBarra).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', pintarBarra);
  pintarBarra();
  setTimeout(() => SplashScreen.hide().catch(() => {}), 300);

  // Botón y gesto de atrás (docs/32 A1): la app decide; si no queda nada que cerrar, se sale
  App.addListener('backButton', () => {
    let hecho = false;
    try { hecho = !!(window.__atras && window.__atras()); } catch (e) { hecho = false; }
    if (!hecho) App.exitApp();
  });

  // Huella o PIN del móvil al abrir y al volver tras 5 minutos fuera (docs/32 B3)
  BiometricAuth.checkBiometry().then((r) => { N.huella = !!(r && (r.isAvailable || r.deviceIsSecure)); }).catch(() => {});
  let fuera = 0;
  const pedir = () => {
    let on = false; try { on = localStorage.getItem('huella') === '1'; } catch (e) { /* */ }
    if (!on || document.documentElement.classList.contains('bloqueada')) return;
    document.documentElement.classList.add('bloqueada');
    BiometricAuth.authenticate({ reason: 'Desbloquea PalomApp', cancelTitle: 'Cancelar', allowDeviceCredential: true, androidTitle: 'Desbloquea PalomApp', androidSubtitle: 'Con tu huella o el PIN del móvil' })
      .then(() => document.documentElement.classList.remove('bloqueada'))
      .catch(() => { /* sigue bloqueada: el botón «Desbloquear» lo vuelve a pedir */ });
  };
  N.desbloquear = pedir;
  N.probarHuella = () => BiometricAuth.authenticate({ reason: 'Confirma que eres tú', allowDeviceCredential: true, androidTitle: 'Confirma que eres tú' });
  App.addListener('appStateChange', ({ isActive }) => { if (!isActive) fuera = Date.now(); else if (fuera && Date.now() - fuera > 5 * 60e3) pedir(); });
  pedir();

  // Enlaces que salen de la app (WhatsApp, correo, mapas): con el sistema
  document.addEventListener('click', (ev) => {
    const a = ev.target && ev.target.closest && ev.target.closest('a[href]'); if (!a) return;
    const h = a.getAttribute('href') || '';
    if (/^(https?:|mailto:|tel:)/.test(h) && !/^https?:\/\/localhost/.test(h)) { ev.preventDefault(); window.open(h, '_system'); }
  }, true);

  // Invitaciones: https://urlife-zeta.vercel.app/?unirse=… abre la app (App Links) y se pasa a la web de dentro
  App.addListener('appUrlOpen', ({ url }) => {
    try { const u = new URL(url); if (u.search) { location.search = u.search; } } catch (e) { /* */ }
  });
}

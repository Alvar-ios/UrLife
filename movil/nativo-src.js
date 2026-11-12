// Puente entre la web de PalomApp y Android (Capacitor). Se empaqueta con esbuild en www/nativo.js.
// Solo actúa dentro de la app; en la web no hace nada.
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

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

  // 11/11 (auditoría de Calidad): en la app, «descargar» un archivo (Excel, copia, .ics) no hace nada; se guarda en la
  // caché de la app y se abre el menú de compartir de Android (Drive, correo, WhatsApp, Archivos…).
  N.guardarArchivo = async (nombre, texto, mime) => {
    const r = await Filesystem.writeFile({ path: nombre, data: texto, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: nombre, files: [r.uri], dialogTitle: 'Guardar o enviar ' + nombre });
    return true;
  };

  // 11/11 · «Avisos del banco» (docs/39): el lector vive en Android (AvisosBancoService); aquí solo se habla con él.
  if (N.android) {
    const AB = registerPlugin('AvisosBanco');
    N.avisosBanco = {
      estado: () => AB.estado(),
      abrirAjustes: () => AB.abrirAjustes(),
      configurar: (o) => AB.configurar(o),
      pendientes: () => AB.pendientes().then((r) => (r && r.lista) || []),
      huella: (uid) => AB.huella({ uid }).then((r) => r && r.huella),
      deshechos: () => AB.deshechos().then((r) => (r && r.ids) || []).catch(() => []),
      quitar: (ids) => AB.quitar({ ids }),
      vaciar: (apagar) => AB.vaciar({ apagar: !!apagar }),
      abiertoDesdeAviso: () => AB.abiertoDesdeAviso().then((r) => !!(r && r.si)).catch(() => false),
      alAbrirDesdeAviso: (fn) => AB.addListener('abiertoDesdeAviso', fn),
    };
    // al volver a la app, la web recoge lo leído
    App.addListener('appStateChange', ({ isActive }) => { if (isActive && window.__avisosVolver) { try { window.__avisosVolver(); } catch (e) { /* */ } } });

    // 12/11 · Widgets de la pantalla de inicio (docs/40 C5): la web deja un resumen pequeño y el widget lo lee
    const PW = registerPlugin('PalomaWidgets');
    N.widgets = {
      guardar: (o) => PW.guardar(o || { sesion: false }),
      abrirCon: () => PW.abrirCon().then((r) => (r && r.que) || '').catch(() => ''), // 'gasto', 'inicio' o ''
      alAbrir: (fn) => PW.addListener('abiertoDesdeWidget', fn),
    };
  }

  // 12/11 · tres canales: importantes (suenan), normales (sin sonido) y resumen. Android oculta el texto con el móvil bloqueado.
  let _canales = null;
  const canales = () => _canales || (_canales = Promise.all([
    LocalNotifications.createChannel({ id: 'importantes', name: 'Importantes', description: 'Lo que pide hacer algo hoy (p. ej. un pago sin saldo)', importance: 4, visibility: 0 }),
    LocalNotifications.createChannel({ id: 'normales', name: 'Para estar al día', description: 'Cobros y pagos fijos, Agenda, presupuestos y metas', importance: 2, visibility: 0 }),
    LocalNotifications.createChannel({ id: 'resumen', name: 'Resumen', description: 'Tu semana y tu mes', importance: 2, visibility: 0 }),
  ]).catch(() => {}));
  const aviso = (x) => ({ id: x.id, title: x.titulo, body: x.texto, schedule: { at: new Date(x.cuando), allowWhileIdle: true }, channelId: x.nivel === 'importante' ? 'importantes' : x.nivel === 'resumen' ? 'resumen' : 'normales', smallIcon: 'ic_stat_paloma', iconColor: '#FFC93C', extra: { tab: x.tab || '' } });
  LocalNotifications.deleteChannel && LocalNotifications.deleteChannel({ id: 'recordatorios' }).catch(() => {}); // el canal único de la primera versión

  // 11/11 · Avisos de PalomApp que calcula el propio móvil (cobros y pagos fijos, Agenda): se programan en el teléfono
  N.notif = {
    permiso: () => LocalNotifications.checkPermissions().then((r) => r.display),
    pedir: () => LocalNotifications.requestPermissions().then((r) => r.display),
    // lista: [{ id (número), titulo, texto, cuando (ms), tab }]; borra los programados antes y pone estos
    // lista: [{ id, nivel: importante|normal|resumen, titulo, texto, cuando (ms), tab }]. Borra los programados (1000-1999) y pone estos.
    programar: async (lista) => {
      await canales();
      const prev = await LocalNotifications.getPending().catch(() => ({ notifications: [] }));
      const viejos = (prev.notifications || []).filter((x) => x.id >= 1000 && x.id < 2000);
      if (viejos.length) await LocalNotifications.cancel({ notifications: viejos.map((x) => ({ id: x.id })) }).catch(() => {});
      if (!lista || !lista.length) return 0;
      await LocalNotifications.schedule({ notifications: lista.slice(0, 60).map(aviso) });
      return lista.length;
    },
    // al momento (presupuesto, meta…): ids 2000+, no se borran al reprogramar
    ahora: async (lista) => { await canales(); if (lista && lista.length) await LocalNotifications.schedule({ notifications: lista.map(aviso) }); return (lista || []).length; },
  };
  LocalNotifications.addListener('localNotificationActionPerformed', (a) => { const tab = a && a.notification && a.notification.extra && a.notification.extra.tab; if (tab && window.__irA) { try { window.__irA(tab); } catch (e) { /* */ } } });

  // Invitaciones: https://urlife-zeta.vercel.app/?unirse=… abre la app (App Links) y se pasa a la web de dentro
  App.addListener('appUrlOpen', ({ url }) => {
    try { const u = new URL(url); if (u.search) { location.search = u.search; } } catch (e) { /* */ }
  });
}

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
import { PushNotifications } from '@capacitor/push-notifications';
const { crearBloqueo } = require('./bloqueo.js');

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
    // 12/11 (Calidad): si algo falla con una hoja o ventanita abierta, no se cierra la app (se perdería lo escrito)
    try { hecho = !!(window.__atras && window.__atras()); } catch (e) { hecho = !!document.querySelector('#sheetBackdrop, #popupBackdrop'); }
    if (!hecho) App.exitApp();
  });

  // Huella o PIN del móvil al abrir y al volver tras 5 minutos fuera (docs/32 B3)
  BiometricAuth.checkBiometry().then((r) => { N.huella = !!(r && (r.isAvailable || r.deviceIsSecure)); }).catch(() => {});
  // 13/11: la lógica vive en bloqueo.js (candado, sin bucle al cerrar la ventanita de la huella)
  const B = crearBloqueo({
    activado: () => { try { return localStorage.getItem('huella') === '1'; } catch (e) { return false; } },
    bloquear: () => document.documentElement.classList.add('bloqueada'),
    desbloquear: () => document.documentElement.classList.remove('bloqueada'),
    autenticar: () => BiometricAuth.authenticate({ reason: 'Desbloquea PalomApp', cancelTitle: 'Cancelar', allowDeviceCredential: true, androidTitle: 'Desbloquea PalomApp', androidSubtitle: 'Con tu huella o el PIN del móvil' }),
  });
  N.desbloquear = () => B.pedir(); // botón «Desbloquear» de la pantalla de bloqueo
  N.probarHuella = () => BiometricAuth.authenticate({ reason: 'Confirma que eres tú', allowDeviceCredential: true, androidTitle: 'Confirma que eres tú' });
  App.addListener('appStateChange', ({ isActive }) => { B.estado(isActive); });
  B.pedir();

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
      abrirApp: (que) => AB.abrirApp({ que: que || 'app' }), // 13/11: ajustes de PalomApp (restringidos, notificaciones)
      olvidarVistos: () => AB.olvidarVistos(),
      configurar: (o) => AB.configurar(o),
      pendientes: () => AB.pendientes().then((r) => (r && r.lista) || []),
      huella: (uid) => AB.huella({ uid }).then((r) => r && r.huella),
      deshechos: () => AB.deshechos().then((r) => (r && r.ids) || []).catch(() => []),
      quitar: (ids) => AB.quitar({ ids }),
      vaciar: (apagar) => AB.vaciar({ apagar: !!apagar }),
      firebase: () => (AB.firebase ? AB.firebase().then((r) => !!(r && r.si)).catch(() => false) : Promise.resolve(false)),
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
    // 12/11 · «Compartir con PalomApp» (C4 de docs/40): extracto compartido o abierto desde otra app → { nombre, base64, tam } o { error: 'grande'|'leer' }
    const AE = registerPlugin('ArchivoEntrante');
    N.archivoEntrante = {
      pendiente: () => AE.pendiente().then((r) => (r && (r.base64 || r.error) ? r : null)).catch(() => null),
      alLlegar: (fn) => AE.addListener('archivoEntrante', fn),
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

  // 13/11 · Avisos de Juntos con la app cerrada (Firebase Cloud Messaging; servidor en supabase/functions/avisar). Solo si la compilación lleva
  // google-services.json (si no, Firebase no existe y pedir el token cerraría la app): lo dice avisosBanco.firebase().
  // El servidor (función «avisar») manda por el canal «juntos» (suena bajito, el sonido normal del móvil) o, en las
  // horas de silencio, por «juntos_noche» (sin sonido). Al tocar el aviso se abre la persona o el grupo.
  if (N.android) {
    let _pushCanales = null, _token = '', _pend = null, _esperas = [];
    const pushCanales = () => _pushCanales || (_pushCanales = Promise.all([
      LocalNotifications.createChannel({ id: 'juntos', name: 'Juntos', description: 'Gastos compartidos contigo, pagos y quién entra en tus grupos', importance: 3, visibility: 0 }),
      LocalNotifications.createChannel({ id: 'juntos_noche', name: 'Juntos (de noche, sin sonido)', description: 'Lo mismo, en tus horas de silencio', importance: 2, visibility: 0 }),
    ]).catch(() => {}));
    const conFirebase = () => (N.avisosBanco && N.avisosBanco.firebase ? N.avisosBanco.firebase() : Promise.resolve(false));
    let _oyendo = false;
    const oir = () => {
      if (_oyendo) return; _oyendo = true;
      // el token llega aquí al registrarse y cada vez que Firebase lo cambia
      PushNotifications.addListener('registration', (t) => {
        _token = (t && t.value) || ''; const es = _esperas; _esperas = []; es.forEach((f) => f(_token));
        if (_token && window.__pushToken) { try { window.__pushToken(_token); } catch (e) { /* */ } }
      });
      PushNotifications.addListener('registrationError', () => { const es = _esperas; _esperas = []; es.forEach((f) => f('')); });
    };
    N.push = {
      disponible: conFirebase,
      // pide el token (sin pedir permiso: eso lo hace notif.pedir). '' si no se puede.
      token: async () => {
        if (!(await conFirebase())) return '';
        oir(); await pushCanales();
        if (_token) return _token;
        const p = new Promise((res) => { _esperas.push(res); setTimeout(() => res(''), 20000); });
        try { await PushNotifications.register(); } catch (e) { return ''; }
        return p;
      },
      // al cerrar sesión: este móvil deja de tener token (el siguiente será otro)
      olvidar: async () => { _token = ''; if (await conFirebase()) await PushNotifications.unregister().catch(() => {}); },
      // aviso tocado mientras la web aún cargaba: se recoge una vez
      pendiente: () => { const d = _pend; _pend = null; return d; },
    };
    conFirebase().then((si) => {
      if (!si) return;
      PushNotifications.addListener('pushNotificationActionPerformed', (a) => {
        const d = (a && a.notification && a.notification.data) || {};
        if (d.tipo !== 'juntos') return;
        if (window.__juntosAbrir) { try { window.__juntosAbrir(d); return; } catch (e) { /* */ } }
        _pend = d;
      });
      // con la app abierta Android no lo enseña: la web lo cuenta con un aviso pequeño y recarga Juntos
      PushNotifications.addListener('pushNotificationReceived', (n) => {
        const d = (n && n.data) || {};
        if (d.tipo === 'juntos' && window.__juntosLlega) { try { window.__juntosLlega({ titulo: n.title || '', texto: n.body || '', datos: d }); } catch (e) { /* */ } }
      });
    });
  }

  // Invitaciones: https://urlife-zeta.vercel.app/?unirse=… abre la app (App Links) y se pasa a la web de dentro
  App.addListener('appUrlOpen', ({ url }) => {
    try { const u = new URL(url); if (u.search) { location.search = u.search; } } catch (e) { /* */ }
  });
}

// 24/11/2026 · Guía «Que se apunten solos» (docs/47): dibujos paso a paso para los permisos de los avisos del banco,
// el aviso de Inicio (una sola vez, o «se han parado» si Android quita el permiso), «¿Te sale en gris?» solo si la app no viene
// de Google Play, el paso de batería se salta si ya está sin restricciones, y en la web no sale nada. Android simulado. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const arrancar = async (est, opts) => {
  const reg = { abrirApp: [], conf: [], pedir: 0 };
  let perm = (opts && opts.perm) || 'granted';
  const pre = (w) => {
    try { w.localStorage.setItem('guiaAbre', String(opts && opts.abre != null ? opts.abre : 1)); } catch (x) { /* */ }
    if (opts && opts.web) return;
    w.__nativo = { android: true, avisosBanco: { estado: async () => est, abrirAjustes: async () => { reg.abrirApp.push('acceso'); }, abrirApp: async (q) => { reg.abrirApp.push(q); },
      configurar: async (o) => { reg.conf.push(o); if (o.activo) est.activo = true; }, pendientes: async () => [], quitar: async () => {}, vaciar: async () => {}, abiertoDesdeAviso: async () => false, alAbrirDesdeAviso: () => {},
      huella: async () => 'f'.repeat(64), deshechos: async () => [] },
      notif: { permiso: async () => perm, pedir: async () => { reg.pedir++; perm = 'granted'; return perm; }, programar: async () => 0, ahora: async () => 0 } };
  };
  const e = makeEnv({ url: 'https://palomapp.test/', version: { tu: 1, agenda: 0, crear: 1 }, pre, session: { user: { id: 'u-1', email: 't@t.com' } }, cfg: { app: Object.assign({ compararVersiones: false }, (opts && opts.app) || {}), meta: { onboarded: true } } });
  e.w.Data.moviles = { registrar: async (p) => p.id, quitar: async () => {}, quitarTodos: async () => {} };
  await e.w.__APP__.main(); await sleep(2300);
  e.reg = reg; e.A = e.w.__APP__; e.H = e.w.__APP__.H; e.txt = () => e.w.document.body.textContent; e.hoja = () => ((e.w.document.querySelector('#sheetHost') || {}).textContent || '');
  return e;
};
(async () => {
  // 1) Android, sin activar, primera vez que abre la app: aún no sale el aviso de Inicio
  let est = { permiso: false, activo: false, bancos: [], vistos: [], instalador: 'otro', bateriaLibre: false, marca: 'xiaomi' };
  let e = await arrancar(est, { abre: 0 });
  ok(!/Tus pagos pueden apuntarse solos/.test(e.txt()), 'la primera vez que se abre la app, Inicio no enseña el aviso de la guía');
  e.w.close();
  // 2) segunda vez: sale una vez; «Ahora no» lo quita para siempre (en la configuración)
  est = { permiso: false, activo: false, bancos: [], vistos: [], instalador: 'otro', bateriaLibre: false, marca: 'xiaomi' };
  e = await arrancar(est, { abre: 1 });
  ok(/Tus pagos pueden apuntarse solos/.test(e.txt()) && !!e.w.document.querySelector('[data-click="guiaInicio|ver"]'), 'a la segunda, Inicio enseña «Tus pagos pueden apuntarse solos» con «Ver cómo»');
  e.H.guiaInicio(['no']); await sleep(150);
  ok(!/Tus pagos pueden apuntarse solos/.test(e.txt()) && e.store.cfg.app.guiaAvisos && e.store.cfg.app.guiaAvisos.inicioVisto === true, '«Ahora no» lo quita y se guarda en la configuración (no vuelve en otro móvil)');
  // la guía, paso a paso, desde Primeros pasos / Tú
  e.H.guiaAbrirDesde(['']); await sleep(400);
  ok(/Que se apunten solos/.test(e.hoja()) && !!e.w.document.querySelector('#sheetHost .gd-movil') && /Son 3 pasos/.test(e.hoja()), 'la guía abre por su portada, con dibujo');
  e.H.guiaIr(['acceso']); await sleep(60);
  ok(/Deja que lea los avisos/.test(e.hoja()) && e.w.document.querySelectorAll('#sheetHost .gd-movil').length === 2 && !!e.w.document.querySelector('#sheetHost .gd-dedo'), 'paso 2: dos dibujos (lista y diálogo) con el dedo');
  await e.H.guiaAcceso([]); await sleep(100);
  ok(e.reg.conf.some((o) => o.activo === true) && e.reg.abrirApp.includes('acceso'), '«Abrir ajustes» activa la lectura y abre «Acceso a notificaciones»');
  e.w.__avisosVolver(); await sleep(120);
  ok(/¿Te sale en gris\?/.test(e.hoja()) && /Permitir ajustes restringidos/.test(e.hoja()), 'instalada desde un archivo y vuelve sin permiso: «¿Te sale en gris?»');
  e.H.guiaAbrirApp([]); await sleep(40);
  ok(e.reg.abrirApp.includes('app'), '«Abrir ajustes de PalomApp» abre la información de la app');
  est.permiso = true; e.w.__avisosVolver(); await sleep(120);
  ok(/Que no se duerma/.test(e.hoja()) && /Inicio automático/.test(e.hoja()), 'con el permiso, el paso de batería (Xiaomi: también «Inicio automático»)');
  ok(e.store.cfg.app.bienv && e.store.cfg.app.bienv.piloto === true, 'se apunta el sello «Piloto automático»');
  e.H.guiaBatHecho([]); await sleep(60);
  ok(/pruébalo/i.test(e.hoja()) && !!e.w.document.querySelector('[data-click="avProbar"]'), '«Ya lo he hecho» lleva a «Pruébalo» con el aviso de prueba');
  est.vistos = [{ pkg: 'es.bancosantander.apps', app: 'Santander', ts: Date.now(), leido: true, marcado: true }]; e.w.__avisosVolver(); await sleep(120);
  ok(/¡Funciona!/.test(e.hoja()), 'cuando llega el primer aviso bien leído: «¡Funciona!»');
  e.w.close();
  // 3) desde Google Play y batería libre: no sale «¿Te sale en gris?» y se salta la batería
  est = { permiso: false, activo: false, bancos: [], vistos: [], instalador: 'play', bateriaLibre: true, marca: 'samsung' };
  e = await arrancar(est, { abre: 3, app: { guiaAvisos: { inicioVisto: true } } });
  ok(!/Tus pagos pueden apuntarse solos/.test(e.txt()), 'quien ya dijo «Ahora no» no vuelve a ver el aviso');
  e.H.guiaAbrirDesde(['']); await sleep(400); e.H.guiaIr(['acceso']); await sleep(40); await e.H.guiaAcceso([]); await sleep(80);
  e.w.__avisosVolver(); await sleep(120);
  ok(!/¿Te sale en gris\?/.test(e.hoja()) && /Deja que lea los avisos/.test(e.hoja()) && /Aún no está dado/.test(e.hoja()), 'desde Google Play no se habla de «ajustes restringidos»: solo «Aún no está dado»');
  est.permiso = true; e.w.__avisosVolver(); await sleep(120);
  ok(/pruébalo/i.test(e.hoja()) && !/Que no se duerma/.test(e.hoja()), 'con la batería ya sin restricciones, se salta ese paso');
  e.w.close();
  // 4) estaba activado y Android quitó el permiso: «Los avisos del banco se han parado» (aunque dijera «Ahora no»)
  est = { permiso: false, activo: true, bancos: ['es.bancosantander.apps'], vistos: [], instalador: 'play', bateriaLibre: true, marca: 'google' };
  e = await arrancar(est, { abre: 5, app: { guiaAvisos: { inicioVisto: true } } });
  ok(/Los avisos del banco se han parado/.test(e.txt()) && !!e.w.document.querySelector('[data-click="guiaAbrirDesde|acceso"]'), 'si Android quita el permiso, Inicio avisa «se han parado» con «Arreglarlo»');
  e.H.guiaAbrirDesde(['acceso']); await sleep(400);
  ok(/Deja que lea los avisos/.test(e.hoja()), '«Arreglarlo» abre la guía en el paso que falta');
  e.w.close();
  // 5) web: nada
  e = await arrancar({}, { abre: 5, web: true });
  ok(!/apuntarse solos|se han parado/.test(e.txt()), 'en la web no sale nada de la guía');
  await e.H.guiaAbrirDesde(['']); await sleep(300);
  ok(!e.w.document.querySelector('#sheetHost .gd-movil'), 'y la guía no se abre');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

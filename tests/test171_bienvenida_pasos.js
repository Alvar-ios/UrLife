// 13/11/2026 · Bienvenida por pasos: Hola → ¿Qué quieres usar? → (solo Android) avisos de PalomApp y avisos del banco → Tu banco → Listo.
// En la web no salen los pasos de permisos. Con invitación, la invitación primero. Todo saltable. Tocando de verdad. Datos inventados.
const T = require('./toques_comun.js');
const { abrir, tocar, tocarSiHay, buscar, escribir, pantalla, app, ok, paso, fin, sleep } = T;
T.fallosConocidos([]);
const YO = 'u-yo', ANA = 'u-ana';
const nativo = (reg) => (w) => { w.__nativo = { android: true,
  notif: { permiso: async () => reg.notif, pedir: async () => { reg.pedidos++; reg.notif = 'granted'; return 'granted'; }, programar: async () => 0, ahora: async () => 0 },
  avisosBanco: { estado: async () => ({ activo: reg.activo, permiso: reg.permiso, bancos: [] }), configurar: async (o) => { reg.conf.push(o); if (o.activo) reg.activo = true; }, abrirAjustes: async () => { reg.ajustes++; },
    abrirApp: async () => { reg.app++; }, pendientes: async () => [], quitar: async () => {}, vaciar: async () => {}, abiertoDesdeAviso: async () => false, alAbrirDesdeAviso: () => {}, huella: async () => 'h' } }; };
const pasoN = (e) => (pantalla(e).match(/Paso (\d+) de (\d+)/) || []).slice(1).join('/');
(async () => {
  paso('Web: Hola → ¿Qué quieres usar? → Tu banco → Listo');
  let e = await abrir({ cfg: {}, version: { bienvenida: 0 } });
  ok(/¡Hola!/.test(pantalla(e)) && pasoN(e) === '1/4', 'web: 4 pasos, empieza por «¡Hola!» (' + pasoN(e) + ')');
  await escribir(e, '#obNombre', 'Marta'); await tocar(e, 'obNext', /Siguiente|Empezar/, null, 500);
  ok(/¿Qué quieres usar\?/.test(pantalla(e)) && app(e).nombre === 'Marta', 'paso 2: «¿Qué quieres usar?» (y el nombre ya está guardado)');
  ok(e.doc.querySelectorAll('#app .ob2-herr').length >= 9 && e.doc.querySelectorAll('#app .ob2-herr.on').length === e.doc.querySelectorAll('#app .ob2-herr').length, 'tarjetas de herramientas, todas marcadas de salida');
  ok(!/Avisos del banco/.test(pantalla(e)), 'en la web no se ofrece «Avisos del banco»');
  await tocar(e, 'obHerr', 'Deudas'); await tocar(e, 'obHerr', 'Inversiones'); await tocar(e, 'obHerr', 'Agenda');
  ok(e.doc.querySelector('#app .ob2-herr.base[aria-disabled="true"]') && !buscar(e, 'obHerr', 'Gastos e ingresos'), '«Gastos e ingresos» no se puede quitar');
  ok(!('herramientas' in app(e)), 'aún no se guarda nada (se guarda al pasar de paso)');
  await tocar(e, 'obNext', /Siguiente|Empezar/, null, 500);
  ok(app(e).herramientas && Object.keys(app(e).herramientas).sort().join() === 'agenda,deudas,inversiones' && Object.values(app(e).herramientas).every((v) => v === false), 'al pasar se guarda lo quitado: ' + JSON.stringify(app(e).herramientas));
  ok(/banco/.test(pantalla(e)) && pasoN(e) === '3/4' && !/Te avisamos/.test(pantalla(e)), 'paso 3: tu banco (sin pasos de permisos en la web)');
  await escribir(e, '#obSaldo', '1.200'); await tocar(e, 'obNext', /Siguiente|Empezar/, null, 500);
  ok(/¡Todo listo/.test(pantalla(e)) && (app(e).cuentas || []).length === 1, 'paso 4: ¡Todo listo! con la cuenta guardada');
  await tocar(e, 'obFinish', '', null, 500);
  ok(!e.S.onboarding && app(e).nivel === 'basico' && e.store.cfg.meta.onboarded === true, 'al acabar: en «Lo básico» y bienvenida hecha');
  ok(e.doc.querySelector('#tbAgenda').hidden && [...e.doc.querySelectorAll('.tabbar [data-tab]')].length === 4, 'la Agenda (quitada) no sale arriba; Juntos sí');

  paso('Web: se puede saltar todo');
  e = await abrir({ cfg: {}, version: { bienvenida: 0 } });
  await tocar(e, 'obFinish', '', null, 500);
  ok(!e.S.onboarding && !('herramientas' in app(e)) && app(e).nivel === 'basico', '«Saltar» en el paso 1: todo encendido (sin clave) y a Inicio');

  paso('Android: con los pasos de permisos');
  const reg = { notif: 'prompt', pedidos: 0, activo: false, permiso: false, conf: [], ajustes: 0, app: 0 };
  e = await abrir({ cfg: {}, version: { bienvenida: 0 }, pre: nativo(reg), espera: 1900 });
  ok(reg.pedidos === 0, 'en Android no se pide el permiso de avisos de golpe en mitad de la bienvenida');
  ok(pasoN(e) === '1/6', 'Android: 6 pasos (' + pasoN(e) + ')');
  await tocar(e, 'obNext', /Siguiente|Empezar/, null, 500); await tocar(e, 'obNext', /Siguiente|Empezar/, null, 500);
  ok(/Te avisamos de lo importante/.test(pantalla(e)) && /sin saldo/.test(pantalla(e)) && /Como mucho 3 al día/.test(pantalla(e)) && /Sin publicidad/.test(pantalla(e)), 'paso 3: qué te avisamos (pagos sin saldo, fijos, presupuesto, metas, tareas), sin publicidad y máx. 3 al día');
  await tocar(e, 'obNotif', null, null, 100);
  ok(reg.pedidos === 1 && /Avisos permitidos/.test(pantalla(e)), 'el botón pide el permiso de Android y dice «Avisos permitidos»');
  await tocar(e, 'obNext', /Siguiente|Empezar/, null, 500);
  ok(/Que se apunten solos tus pagos/.test(pantalla(e)) && /no sale de tu móvil/.test(pantalla(e)) && /Deshacer/.test(pantalla(e)), 'paso 4: avisos del banco, con lo que ganas y la privacidad');
  await tocar(e, 'obAvBanco', null, null, 100);
  ok(reg.conf.some((o) => o.activo === true && o.bancos.length > 5) && reg.ajustes === 1, '«Activar» enciende la lectura y abre «Acceso a notificaciones» del móvil');
  ok(/Ajuste restringido/.test(pantalla(e)) && !!buscar(e, 'avAbrirApp', 'app'), 'si al volver sigue sin permiso: la nota de «ajustes restringidos» con su botón');
  reg.permiso = true; e.w.__avisosVolver(); await sleep(60);
  ok(/Activado: ya se apuntan solos/.test(pantalla(e)), 'al volver con el permiso dado: «Activado»');
  await tocar(e, 'obNext', /Siguiente|Empezar/, null, 500);
  ok(/banco/.test(pantalla(e)) && pasoN(e) === '5/6', 'paso 5: tu banco');
  await tocar(e, 'obNext', 'no', null, 500); await tocar(e, 'obFinish', '', null, 500);
  reg.notif = 'prompt'; await sleep(2200);
  ok(!e.S.onboarding && reg.pedidos === 1, 'al acabar no se vuelve a pedir el permiso de avisos (ya se explicó en su paso)');

  paso('Android: sin «Avisos del banco» elegido, ese paso no sale');
  const reg2 = { notif: 'prompt', pedidos: 0, activo: false, permiso: false, conf: [], ajustes: 0, app: 0 };
  e = await abrir({ cfg: {}, version: { bienvenida: 0 }, pre: nativo(reg2) });
  await tocar(e, 'obNext', /Siguiente|Empezar/, null, 500); await tocar(e, 'obHerr', 'Avisos del banco');
  await tocar(e, 'obNext', /Siguiente|Empezar/, null, 500);
  ok(pasoN(e) === '3/5' && /Te avisamos/.test(pantalla(e)), 'quedan 5 pasos');
  await tocar(e, 'obNext', 'no', null, 500);
  ok(/banco/.test(pantalla(e)) && !/Que se apunten solos/.test(pantalla(e)) && reg2.pedidos === 0 && !reg2.conf.some((o) => o.activo), '«Ahora no» en los avisos: no se pide nada y se salta el de los avisos del banco');

  paso('Con invitación: la invitación primero, sin el paso del banco');
  const TOKEN = 'invitacionInventada5678';
  e = await abrir({ cfg: {}, version: { bienvenida: 0 }, url: 'https://x.test/?unirse=' + TOKEN,
    rpc: { ver_invitacion: (p) => (p.p_token === TOKEN ? { valida: true, tipo: 'grupo', nombre: 'Piso inventado', invita: 'Ana', miembros: 2 } : { valida: false }) } });
  e.srv.rpc.unirse = () => { e.srv.grupos.push({ id: 'g9', nombre: 'Piso inventado', tipo: 'grupo', edicion: 'todos', created_at: '2026-11-01T10:00:00Z' }); e.srv.miembros.push({ grupo_id: 'g9', user_id: ANA, nombre: 'Ana', rol: 'admin' }, { grupo_id: 'g9', user_id: YO, nombre: 'Marta', rol: 'miembro' }); return 'g9'; };
  await sleep(200);
  ok(/Piso inventado/.test(pantalla(e)) && pasoN(e) === '1/3', 'empieza por la invitación (3 pasos: invitación, qué quieres usar, listo)');
  await tocar(e, 'obUnirse', null, null, 500);
  ok(/¿Qué quieres usar\?/.test(pantalla(e)), 'tras unirse: «¿Qué quieres usar?»');
  await tocar(e, 'obNext', /Siguiente|Empezar/, null, 500);
  ok(/¡Todo listo/.test(pantalla(e)) && !!buscar(e, 'obFinish', 'grupo'), 'y «¡Todo listo!» con «Ver Piso inventado»');
  fin('bienvenida_pasos');
})();

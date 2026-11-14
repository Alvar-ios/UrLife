// 14/11/2026 · Calidad: huecos de la bienvenida por objetivos (docs/45), la barra 2 + 2 y el CAPTCHA.
// Repetirla desde Tú no duplica ni esconde nada, ida y vuelta sin duplicados, mismos campos que desde la app, atrás de Android,
// cerrar a mitad, «Soy yo» tras la bienvenida, Juntos encendido con la Agenda apagada y Turnstile que no carga. Datos inventados.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const T = require('./toques_comun.js');
const { abrir, tocar, buscar, escribir, pantalla, hoja, app, atras, ok, paso, fin, sleep } = T;
// Fallos de la app encontrados por Calidad el 14/11 (ver informe): se quitan de aquí cuando se arreglen
T.fallosConocidos([]); // 14/11: los dos, arreglados
const YO = 'u-yo';
const V = { bienvenida: 3 };
const paso_ = (e) => e.S.onboarding && e.S.onboarding.paso;
const seguir = (e, ms) => tocar(e, 'bvSig', null, null, ms == null ? 500 : ms);
const tecla = async (e, k) => { const b = e.doc.querySelector('[data-click="bvTec|' + encodeURIComponent(k) + '"]'); if (!b) throw new Error('no hay tecla ' + k); b.click(); await sleep(15); };
const teclear = async (e, txt) => { for (const c of String(txt)) await tecla(e, c); };
const grupoRpc = (e) => {
  e.srv.rpc.crear_grupo = async (p) => { await sleep(80); e.srv.grupos.push({ id: 'g1', nombre: p.p_nombre, tipo: 'grupo', edicion: 'todos', created_at: '2026-11-13T10:00:00Z' }); e.srv.miembros.push({ grupo_id: 'g1', user_id: YO, nombre: p.p_mi_nombre, rol: 'admin', created_at: '2026-11-13T10:00:00Z' }); return 'g1'; };
  e.srv.rpc.crear_sin_cuenta = (p) => { e.srv.sinCuenta.push({ id: 'sc' + e.srv.sinCuenta.length, grupo_id: p.p_grupo, nombre: p.p_nombre, created_at: '2026-11-13T10:01:00Z' }); return null; };
};
const cuenta = (e, n) => e.srv.llamadas.filter((x) => x[0] === 'rpc.' + n).length;

(async () => {
  // ---------- 1) Repetirla desde Tú con lo que ya tenía ----------
  paso('Repetir: cuenta de antes sin logo');
  const previo = { nombre: 'Álex', novedadesVistas: '9999-12-31', compararVersiones: false, nivel: 'todo',
    cuentas: [{ id: 'c1', nombre: 'BBVA', tipo: 'corriente', saldo: 1000, fecha: '2026-11-01', principal: true }], // creada antes de los logos: sin campo «banco»
    ahorro: [{ id: 'm1', nombre: 'Viaje', objetivo: 900 }], deudas: [{ id: 'd1', nombre: 'Hipoteca', objetivo: 90000 }], herramientas: { informes: false, trayecto: false } };
  let e = await abrir({ cfg: { app: JSON.parse(JSON.stringify(previo)), meta: { onboarded: true } }, version: V });
  e.A.H.startOnboardingManually([]); await sleep(60);
  await seguir(e); await tocar(e, 'bvObj', 'Controlar mis gastos'); await seguir(e);
  ok(paso_(e) === 'G1', 'G1 al repetirla');
  await tocar(e, 'bvBanco', 'BBVA'); await seguir(e);
  const cs = app(e).cuentas || [];
  ok(cs.length === 1, 'elegir «BBVA» cuando ya tenías la cuenta «BBVA» (sin logo) no crea otra: ' + cs.map((c) => c.nombre + ':' + c.saldo).join(', '), 'BV_BANCO_SIN_LOGO_DUP');
  ok(cs[0] && cs[0].saldo === 1000 && cs[0].principal, 'la cuenta de antes sigue igual (saldo y principal)');

  paso('Repetir: saltar la pantalla 2 y salir');
  e = await abrir({ cfg: { app: JSON.parse(JSON.stringify(previo)), meta: { onboarded: true } }, version: V });
  e.A.H.startOnboardingManually([]); await sleep(60);
  await seguir(e); await tocar(e, 'bvSaltar', null, null, 300);
  ok(paso_(e) === 'F', 'saltar la pantalla 2 lleva al final');
  await tocar(e, 'bvFin', '', null, 600);
  let c = app(e);
  ok(!e.S.onboarding && JSON.stringify(c.herramientas) === JSON.stringify(previo.herramientas), 'herramientas como estaban (' + JSON.stringify(c.herramientas) + ')');
  ok(c.nivel === 'todo' && c.cuentas.length === 1 && c.ahorro.length === 1 && c.deudas.length === 1 && c.nombre === 'Álex', 'nivel, cuentas, metas, deudas y nombre intactos');
  e.A.H.startOnboardingManually([]); await sleep(60);
  await tocar(e, 'bvSaltar', null, null, 300);
  ok(!e.S.onboarding && JSON.stringify(app(e).herramientas) === JSON.stringify(previo.herramientas), '«Saltar» en la primera pantalla de la repetición sale sin tocar nada');

  paso('Repetir: elegir Metas con Metas apagada la enciende; lo demás no se apaga');
  e = await abrir({ cfg: { app: Object.assign(JSON.parse(JSON.stringify(previo)), { herramientas: { metas: false } }), meta: { onboarded: true } }, version: V });
  e.A.H.startOnboardingManually([]); await sleep(60);
  await seguir(e); await tocar(e, 'bvObj', 'Ahorrar para algo'); await seguir(e);
  c = app(e);
  ok(!(c.herramientas || {}).hasOwnProperty('metas') || c.herramientas.metas === true, 'Metas encendida');
  ok(Object.values(c.herramientas || {}).every((v) => v !== false), 'y nada apagado (' + JSON.stringify(c.herramientas) + ')');
  await tocar(e, 'bvMeta', 'Viaje'); await seguir(e); await seguir(e);
  ok(/Ya tienes una meta con ese nombre/.test(T.aviso(e)) && paso_(e) === 'M2', 'meta con el mismo nombre que una de antes: avisa y no la duplica');
  await tocar(e, 'bvSaltar', null, null, 300);
  ok(paso_(e) === 'F' && app(e).ahorro.length === 1, 'se puede saltar (no se queda atascada) y sigue habiendo 1 meta');

  // ---------- 2) Ida y vuelta, doble toque: sin duplicados ----------
  paso('Ida y vuelta sin duplicados');
  e = await abrir({ cfg: {}, version: V }); grupoRpc(e);
  await seguir(e); await tocar(e, 'bvObj', 'Controlar mis gastos');
  for (const t of ['Compartir gastos', 'Ahorrar para algo', 'Pagar una deuda', 'Organizar mi día']) await tocar(e, 'bvObj', t);
  await seguir(e);
  ok(e.A.bvLista(e.S.onboarding).join() === 'hola,obj,J1,J2,M1,M2,D1,T1,F', 'lista: ' + e.A.bvLista(e.S.onboarding).join());
  await tocar(e, 'bvJ1', 'crear', null, 200);
  await tocar(e, 'bvJPlant', 'Pareja'); await escribir(e, '#bvP0', 'Ana');
  const bJ = buscar(e, 'bvJCrear'); bJ.click(); bJ.click(); e.A.H.bvJCrear([]); await sleep(500);
  ok(cuenta(e, 'crear_grupo') === 1 && cuenta(e, 'crear_sin_cuenta') === 1, 'tres toques en «Crear grupo»: un grupo y una persona');
  await seguir(e);
  ok(paso_(e) === 'M1', 'M1');
  atras(e); atras(e); ok(paso_(e) === 'J1', 'atrás dos veces: J1');
  await tocar(e, 'bvJ1', 'crear', null, 200);
  ok(paso_(e) === 'J2' && /Grupo creado/.test(pantalla(e)) && !buscar(e, 'bvJCrear'), 'volver a «Crear uno ahora» enseña el grupo creado (sin botón de crear otro)');
  await seguir(e);
  await tocar(e, 'bvMeta', 'Regalo'); await seguir(e); await seguir(e);
  ok(paso_(e) === 'D1' && (app(e).ahorro || []).length === 1, 'meta creada en M2');
  atras(e); atras(e); ok(paso_(e) === 'M1', 'atrás a M1');
  await seguir(e); await seguir(e);
  ok(paso_(e) === 'D1' && app(e).ahorro.length === 1, 'adelante otra vez: sigue habiendo 1 meta');
  await tocar(e, 'bvDeuda', 'Tarjeta'); await teclear(e, '600');
  e.A.H.bvSig([]); e.A.H.bvSig([]); await sleep(400);
  ok((app(e).deudas || []).length === 1, 'dos «Guardar deuda» seguidos: 1 deuda');
  ok(paso_(e) === 'F' || paso_(e) === 'T1', 'sigue adelante (' + paso_(e) + ')');
  while (paso_(e) !== 'T1' && atras(e)) { /* */ }
  ok(paso_(e) === 'T1' || paso_(e) === 'D1', 'atrás hasta la agenda o la deuda');
  if (paso_(e) === 'D1') { await seguir(e); ok(app(e).deudas.length === 1, 'pasar otra vez por D1: 1 deuda'); }
  await tocar(e, 'bvTareaIdea', 'Pedir cita');
  e.A.H.bvSig([]); e.A.H.bvSig([]); await sleep(500);
  ok(Object.keys(e.store.tareas).length === 1 && paso_(e) === 'F', 'dos «Apuntar» seguidos: 1 tarea');
  atras(e); await seguir(e, 500);
  ok(Object.keys(e.store.tareas).length === 1 && paso_(e) === 'F', 'atrás y «Apuntar» otra vez: sigue 1 tarea');

  // ---------- 3) Mismos campos que lo creado desde la app ----------
  paso('Mismos campos que desde la app');
  const m = app(e).ahorro[0], d = app(e).deudas[0];
  const camposMeta = ['id', 'nombre', 'objetivo', 'fechaObjetivo', 'yaAhorrado', 'rentabilidad', 'hitos', 'color'];
  ok(camposMeta.every((k) => k in m) && Object.keys(m).every((k) => camposMeta.concat(['forma']).includes(k)), 'la meta lleva los campos de metaGuardar (' + Object.keys(m).join(',') + ')');
  ok(typeof m.id === 'string' && m.id.length > 3, 'la meta tiene id (' + m.id + ')');
  const camposDeuda = ['id', 'nombre', 'objetivo', 'previo', 'cuotaMes', 'fechaObjetivo', 'emoji'];
  ok(camposDeuda.every((k) => k in d) && Object.keys(d).every((k) => camposDeuda.includes(k)) && d.emoji === '💳', 'la deuda lleva los campos de deudaGuardar (' + Object.keys(d).join(',') + ')');
  const t = Object.values(e.store.tareas)[0];
  ok(Object.keys(t).sort().join() === ['nombre', 'categoria', 'prioridad', 'estado', 'fechaLimite', 'fechaCreacion', 'fechaInicio', 'fechaFin', 'comentario', 'repetir'].sort().join(), 'la tarea lleva los 10 campos de la tabla');
  const g = e.srv.llamadas.find((x) => x[0] === 'rpc.crear_grupo');
  ok(g && g[1] && 'p_nombre' in g[1] && 'p_mi_nombre' in g[1], 'el grupo se crea con crear_grupo(p_nombre, p_mi_nombre), como desde Juntos');

  // ---------- 4) Atrás de Android ----------
  paso('Atrás de Android');
  e = await abrir({ cfg: {}, version: V });
  ok(atras(e) === false && paso_(e) === 'hola', 'en «Hola», atrás sale de la app (como siempre)');
  await tocar(e, 'bvSaltar', null, null, 100);
  ok(atras(e) === true && !e.S.onboarding.confSaltar && paso_(e) === 'hola', 'con «¿Saltamos la bienvenida?» abierto, atrás lo cancela');
  await seguir(e); await tocar(e, 'bvAfinar', null, null, 150);
  ok(/Herramienta a herramienta/.test(hoja(e)), 'hoja «Afinar» abierta');
  ok(atras(e) === true, 'atrás con la hoja abierta…'); await sleep(300);
  ok(!hoja(e) && paso_(e) === 'obj', '…cierra la hoja y se queda en la pantalla 2');
  ok(atras(e) === true && paso_(e) === 'hola', 'y otra vez atrás: a «Hola»');

  // ---------- 5) Cerrar a mitad y volver ----------
  paso('Cerrar a mitad y volver');
  e = await abrir({ cfg: {}, version: V });
  await seguir(e); await tocar(e, 'bvObj', 'Controlar mis gastos'); await tocar(e, 'bvObj', 'Pagar una deuda'); await seguir(e);
  await tocar(e, 'bvDeuda', 'Préstamo del coche'); await teclear(e, '3000'); await seguir(e);
  ok(paso_(e) === 'F' && app(e).deudas.length === 1, 'deuda creada y al final');
  const guardado = JSON.parse(JSON.stringify(e.store.cfg));
  e = await abrir({ cfg: guardado, version: V }); await sleep(100);
  ok(paso_(e) === 'F' && app(e).deudas.length === 1, 'al volver, sigue en el final sin repetir la deuda (' + paso_(e) + ')');
  await tocar(e, 'bvFin', '', null, 600);
  ok(!e.S.onboarding && e.store.cfg.meta.onboarded, 'y se puede terminar');
  // un paso guardado que ya no toca (p. ej. de otra versión): no se queda atascada
  e = await abrir({ cfg: { app: { bienv: { objetivos: ['metas'], recortadas: [], paso: 'J2' } } }, version: V }); await sleep(100);
  ok(paso_(e) === 'M1' && !!buscar(e, 'bvSig'), 'paso guardado que ya no está en la lista: sigue en la siguiente pantalla (' + paso_(e) + ')');

  // ---------- 6) «Soy yo» después de la bienvenida ----------
  paso('Enlace «Soy yo» y la bienvenida');
  const SOY = 'enlaceSoyYoInventado123';
  e = await abrir({ cfg: {}, version: V, url: 'https://x.test/?soy=' + SOY,
    rpc: { ver_enlace_sin_cuenta: () => ({ valida: true, grupo: 'g5', nombre_grupo: 'Piso inventado', nombre: 'Leo', gastos: 2 }) } });
  e.srv.rpc.reclamar_sin_cuenta = () => { e.srv.grupos.push({ id: 'g5', nombre: 'Piso inventado', tipo: 'grupo', edicion: 'todos', created_at: '2026-11-01T10:00:00Z' }); e.srv.miembros.push({ grupo_id: 'g5', user_id: YO, nombre: 'Leo', rol: 'miembro' }); return 'g5'; };
  await sleep(150);
  ok(paso_(e) === 'hola', 'la bienvenida empieza normal');
  await seguir(e); await seguir(e); // «Controlar mis gastos» (marcado de serie)
  while (e.S.onboarding && paso_(e) !== 'F') await tocar(e, 'bvSaltar', null, null, 250);
  await tocar(e, 'bvFin', '', null, 800);
  ok(!app(e).herramientas || app(e).herramientas.juntos !== false, '(14/11) viniendo con «Soy yo», «Compartir gastos» sale marcado y Juntos no se apaga');
  const bR = buscar(e, 'reclamarConfirmar', null, 'hoja');
  ok(!!bR, 'tras la bienvenida sale la hoja para ocupar su sitio en el grupo');
  if (bR) { bR.click(); await sleep(500); }
  ok((app(e).herramientas || {}).juntos !== false && !!e.doc.querySelector('.tabbar [data-tab="juntos"]'), 'al ocupar su sitio con «Soy yo», Juntos se vuelve a ver (como al unirse con un enlace)', 'SOY_JUNTOS_APAGADO');

  // ---------- 7) Barra: Juntos encendido y Agenda apagada ----------
  paso('Barra con Juntos y sin Agenda');
  e = await abrir({ cfg: { app: { nombre: 'Álex', cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 100, principal: true }], herramientas: { agenda: false } }, meta: { onboarded: true } }, version: { tu: 0, agenda: 0, crear: 0 } });
  await sleep(150);
  const barra = () => [...e.doc.querySelectorAll('.tabbar > *')].map((b) => b.getAttribute('data-tab') || (b.classList.contains('tab-crear') ? '+' : '?')).join();
  ok(barra() === 'inicio,movimientos,+,juntos,dinero', 'la barra de siempre (' + barra() + ')');
  const tbA = e.doc.querySelector('#tbAgenda');
  ok(!tbA || tbA.hidden || tbA.style.display === 'none', 'sin botón de Agenda arriba (está apagada)');
  ok(!e.doc.body.classList.contains('ag-en-barra') && !e.doc.body.classList.contains('tu-en-barra'), 'sin clases de barra cambiada');

  // ---------- 8) CAPTCHA: Turnstile que no carga ----------
  paso('CAPTCHA sin Turnstile');
  const dm = new JSDOM('<!doctype html><html lang="es"><head></head><body><div class="captcha" id="loginCaptcha"></div></body></html>', { runScripts: 'outside-only' });
  const cw = dm.window, scripts = [];
  const orig = cw.document.head.appendChild.bind(cw.document.head);
  cw.document.head.appendChild = (n) => { if (n.tagName === 'SCRIPT') { scripts.push(n); setTimeout(() => n.onerror && n.onerror(new cw.Event('error')), 5); return n; } return orig(n); };
  cw.eval(fs.readFileSync(path.join(__dirname, '..', 'captcha.js'), 'utf8'));
  cw.Captcha.montar('#loginCaptcha'); await sleep(40);
  const caja = cw.document.getElementById('loginCaptcha');
  ok(caja.dataset.estado === 'error' && /Revisa tu conexión/.test(caja.textContent), 'si Turnstile no carga: «No se pudo comprobar. Revisa tu conexión.»');
  let tok = 'x'; await cw.Captcha.esperar(200).then((v) => { tok = v; });
  ok(tok === null, 'esperar() no se cuelga: devuelve null a su tiempo');
  cw.Captcha.montar('#loginCaptcha'); await sleep(40);
  ok(scripts.length === 2, 'al volver a pintar la entrada se intenta cargar otra vez (no se queda bloqueada para siempre)');
  fin('calidad_bienvenida_v2');
})().catch((err) => { console.log('FAIL la prueba se paró: ' + (err && err.stack || err)); process.exit(1); });

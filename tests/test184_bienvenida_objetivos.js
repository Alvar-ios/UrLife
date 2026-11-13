// 13/11/2026 · Bienvenida por objetivos (docs/45): «¿Para qué quieres PalomApp?» y una rama por objetivo, tope de 10 pantallas,
// lo recortado y lo saltado a «Primeros pasos», sellos y «Tu PalomApp al X %», apagar lo no elegido sin borrar nada,
// repetirla desde Tú solo añade, la invitación primero y nada cambia para quien ya usaba la app. Tocando de verdad. Datos inventados.
const T = require('./toques_comun.js');
const { abrir, tocar, tocarSiHay, buscar, escribir, pantalla, hoja, app, atras, ok, paso, fin, sleep } = T;
T.fallosConocidos([]);
const YO = 'u-yo', ANA = 'u-ana';
const V = { bienvenida: 3 };
const nativo = (reg) => (w) => { w.__nativo = { android: true,
  notif: { permiso: async () => reg.notif, pedir: async () => { reg.pedidos++; reg.notif = 'granted'; return 'granted'; }, programar: async () => 0, ahora: async () => 0 },
  avisosBanco: { estado: async () => ({ activo: reg.activo, permiso: reg.permiso, bancos: [] }), configurar: async (o) => { reg.conf.push(o); if (o.activo) reg.activo = true; }, abrirAjustes: async () => { reg.ajustes++; },
    abrirApp: async () => {}, pendientes: async () => [], quitar: async () => {}, vaciar: async () => {}, abiertoDesdeAviso: async () => false, alAbrirDesdeAviso: () => {}, huella: async () => 'h' } }; };
const paso_ = (e) => e.S.onboarding && e.S.onboarding.paso;
const tecla = async (e, k) => { const b = e.doc.querySelector('[data-click="bvTec|' + encodeURIComponent(k) + '"]'); if (!b) throw new Error('no hay tecla ' + k); b.click(); await sleep(15); };
const teclear = async (e, txt) => { for (const c of String(txt)) await tecla(e, c); };
const seguir = (e, ms) => tocar(e, 'bvSig', null, null, ms == null ? 500 : ms);
const pctTxt = (e) => ((pantalla(e).match(/Tu PalomApp al (\d+) %/) || [])[1]);
const grupoRpc = (e) => {
  e.srv.rpc.crear_grupo = (p) => { e.srv.grupos.push({ id: 'g1', nombre: p.p_nombre, tipo: 'grupo', edicion: 'todos', created_at: '2026-11-13T10:00:00Z' }); e.srv.miembros.push({ grupo_id: 'g1', user_id: YO, nombre: p.p_mi_nombre, rol: 'admin', created_at: '2026-11-13T10:00:00Z' }); return 'g1'; };
  e.srv.rpc.crear_sin_cuenta = (p) => { e.srv.sinCuenta.push({ id: 'sc' + e.srv.sinCuenta.length, grupo_id: p.p_grupo, nombre: p.p_nombre, created_at: '2026-11-13T10:01:00Z' }); return null; };
  e.srv.rpc.crear_invitacion_varios = () => 'tokenInventadoDeGrupo123';
};

(async () => {
  // ---------- 1) Web, camino mínimo: 3 pantallas ----------
  paso('Web: Hola → ¿Para qué? (nada) → Final');
  let e = await abrir({ cfg: {}, version: V });
  ok(paso_(e) === 'hola' && /¡Hola! Soy PalomApp/.test(pantalla(e)) && /unos dos minutos/.test(pantalla(e)), 'empieza por «¡Hola! Soy PalomApp»');
  ok(/Tu PalomApp al \d+ %/.test(pantalla(e)) && !/Paso \d de/.test(pantalla(e)), 'arriba, «Tu PalomApp al X %» (no «Paso N de M»)');
  ok(!!e.doc.querySelector('#bvPaloma .marca-ico') && /Tú/.test(e.doc.querySelector('.bv-tramos').textContent) && /Listo/.test(e.doc.querySelector('.bv-tramos').textContent), 'la barra con la paloma y sus tramos (Tú … Listo)');
  await escribir(e, '#obNombre', 'Marta'); await seguir(e);
  ok(paso_(e) === 'obj' && /¿Para qué quieres PalomApp\?/.test(pantalla(e)) && app(e).nombre === 'Marta', 'pantalla 2 y el nombre guardado');
  ok(e.doc.querySelectorAll('#app .bv-card').length === 6, 'las 6 tarjetas de objetivos');
  ok(e.doc.querySelector('#app .bv-card.on') && /Controlar mis gastos/.test(e.doc.querySelector('#app .bv-card.on').textContent), 'sin invitación, «Controlar mis gastos» sale marcado');
  ok(e.doc.querySelectorAll('#app .bv-movil .bv-pz').length === 2, 'vista previa: tarjeta del mes + «Así vas» (cifras inventadas)');
  await tocar(e, 'bvObj', 'Ahorrar para algo');
  ok(e.doc.querySelectorAll('#app .bv-movil .bv-pz').length === 3 && /Viaje a Lisboa/.test(e.doc.querySelector('.bv-movil').textContent) && e.doc.querySelector('.bv-pz.entra'), 'al marcar «Ahorrar» la vista previa encaja su pieza');
  await tocar(e, 'bvObj', 'Ahorrar para algo'); await tocar(e, 'bvObj', 'Controlar mis gastos');
  ok(!e.doc.querySelector('#app .bv-card.on') && e.doc.querySelectorAll('#app .bv-movil .bv-pz').length === 1, 'desmarcadas todas: solo la tarjeta del mes');
  ok(/Seguir \(unas 1 pantallas\)|Seguir \(unas 1 pantalla/.test(pantalla(e)) || /unas 1/.test(e.doc.querySelector('.ob2-pie').textContent), 'el botón dice cuántas pantallas quedan');
  await seguir(e);
  ok(paso_(e) === 'F' && e.A.bvLista(e.S.onboarding).length === 3, 'web sin nada marcado: 3 pantallas (' + e.A.bvLista(e.S.onboarding).join(',') + ')');
  const h = app(e).herramientas || {};
  ok(['presupuestos', 'metas', 'inversiones', 'deudas', 'juntos', 'agenda', 'informes', 'trayecto'].every((k) => h[k] === false), 'lo no elegido se apaga en «Mis herramientas» (' + JSON.stringify(h) + ')');
  ok(/herramientas más esperando/.test(pantalla(e)), 'el final nombra lo apagado: «N herramientas más esperando»');
  await tocar(e, 'bvFin', '', null, 600);
  ok(!e.S.onboarding && app(e).nivel === 'basico' && e.store.cfg.meta.onboarded === true && (app(e).bienv || {}).hecho, 'al acabar: «Lo básico», bienvenida hecha y bienv.hecho');
  ok(JSON.stringify(app(e).bienv.objetivos) === '[]', 'bienv.objetivos guardado (vacío)');
  await tocar(e, 'descAbrir', null, null, 100);
  ok(/herramientas más esperando/.test(hoja(e)) && !!buscar(e, 'bvEncender', 'Metas de ahorro', 'hoja'), 'Descubre nombra lo apagado con «Encender»');
  await tocar(e, 'bvEncender', 'Metas de ahorro', 'hoja', 150);
  ok(!(app(e).herramientas || {}).hasOwnProperty('metas'), '«Encender» vuelve a encender Metas');

  // ---------- 2) Web, camino típico con el teclado de la app ----------
  paso('Web: Gastos → banco con logos, saldo con el teclado, tu mes');
  e = await abrir({ cfg: {}, version: V });
  await seguir(e); // sin nombre
  await seguir(e);
  ok(paso_(e) === 'G1' && /¿Cuál es tu banco\?/.test(pantalla(e)) && e.doc.querySelectorAll('#app .bv-bco').length >= 11 && e.doc.querySelector('#app .bv-bco img[src^="logos/"]'), 'G1: rejilla de logos (más «Otro» y «Efectivo»)');
  ok(!e.A.bvLista(e.S.onboarding).includes('G5') && !e.A.bvLista(e.S.onboarding).includes('N1'), 'en la web no salen los avisos del banco ni los de PalomApp');
  await tocar(e, 'bvBanco', 'BBVA'); await tocar(e, 'bvBanco', 'Efectivo');
  await tocar(e, 'bvBancosMas', null, null, 100);
  await escribir(e, '#bvBcoQ', 'myinv', 60);
  ok(/MyInvestor/.test(e.doc.querySelector('#bvBcoRes').textContent) && !/BBVA/.test(e.doc.querySelector('#bvBcoRes').textContent), '«Ver más» busca entre todos los bancos');
  await tocar(e, 'bvBanco', 'MyInvestor');
  ok(e.doc.querySelectorAll('#app .bv-bco.on').length === 3, 'tres elegidos (BBVA, Efectivo y MyInvestor)');
  await tocar(e, 'bvBanco', 'MyInvestor'); // lo quita
  await seguir(e);
  const cs = app(e).cuentas || [];
  ok(cs.length === 2 && cs.some((c) => c.banco === 'bbva' && c.saldo == null && c.principal) && cs.some((c) => c.tipo === 'efectivo'), 'G1 crea las cuentas (sin saldo aún; BBVA principal)');
  ok(paso_(e) === 'G2' && e.doc.querySelectorAll('#app .bv-campo').length === 2 && e.doc.querySelectorAll('#app .bv-tec .tec-k').length === 12 && /No nos conectamos a tu banco/.test(pantalla(e)), 'G2: una fila por cuenta y el teclado de la app');
  await teclear(e, '1234,5');
  ok(/1\.234,5/.test(e.doc.querySelector('#app .bv-campo.on').textContent), 'el teclado escribe con miles y coma (1.234,5)');
  await teclear(e, '67'); ok(/1\.234,56/.test(e.doc.querySelector('#app .bv-campo.on').textContent), 'máximo dos decimales');
  await tocar(e, 'bvCampo', 'Efectivo'); await teclear(e, '40');
  await seguir(e);
  const cs2 = app(e).cuentas;
  ok(cs2.find((c) => c.banco === 'bbva').saldo === 1234.56 && cs2.find((c) => c.tipo === 'efectivo').saldo === 40, 'G2 guarda los saldos (1.234,56 y 40)');
  ok(paso_(e) === 'G3' && /¿Cuándo empieza tu mes\?/.test(pantalla(e)) && e.doc.querySelector('.bv-cal'), 'G3: tu mes con su mini calendario');
  await tocar(e, 'bvMes', 'cobro'); for (let i = 0; i < 4; i++) await tocar(e, 'bvMesDia', 'después');
  ok(/Día 31/.test(pantalla(e)), 'la rueda de días llega al 31 y no se pasa');
  await tocar(e, 'bvMesDia', 'antes');
  await seguir(e);
  ok(JSON.stringify(app(e).mesInicio) === JSON.stringify({ modo: 'cobro', dia: 30 }), 'G3 guarda «tu mes» desde el día 30');
  ok(paso_(e) === 'F' && /¡Lista!/.test(pantalla(e)), 'y el final («¡Lista!», sin nombre)');
  ok(e.doc.querySelectorAll('.bv-sello').length === 2 && /Banco al día/.test(pantalla(e)) && /Mes a tu medida/.test(pantalla(e)), 'sellos ganados: Banco al día y Mes a tu medida');
  const b2 = app(e).bienv;
  ok(b2.sellos && b2.sellos.banco && b2.sellos.mes && !b2.sellos.nombre, 'bienv.sellos apunta cuándo se enseñó cada uno (no hay nombre)');
  ok(pctTxt(e) === '75', '«Tu PalomApp al 75 %» (nombre no; gusto, banco y mes sí): ' + pctTxt(e));
  ok(/BBVA: 1\.234,56/.test(e.doc.querySelector('.bv-movil.grande').textContent), 'la vista previa del final con sus datos (BBVA y su saldo)');
  await tocar(e, 'bvFin', 'gasto', null, 700);
  ok(!e.S.onboarding && /Nuevo gasto/.test(hoja(e)), '«Apuntar mi primer gasto» abre el gasto');

  // ---------- 3) Android, todas las ramas: tope de 10 y recortes ----------
  paso('Android: todo marcado → 10 pantallas; lo recortado a «Primeros pasos»');
  const reg = { notif: 'prompt', pedidos: 0, activo: false, permiso: false, conf: [], ajustes: 0 };
  e = await abrir({ cfg: {}, version: V, pre: nativo(reg), espera: 400 }); grupoRpc(e);
  await escribir(e, '#obNombre', 'Leo'); await seguir(e);
  for (const t of ['Compartir gastos', 'Ahorrar para algo', 'Pagar una deuda', 'Organizar mi día', 'Ver mis inversiones']) await tocar(e, 'bvObj', t);
  ok(/Lo dejamos listo en unas 10 pantallas/.test(pantalla(e)), 'con todo marcado avisa: «Lo dejamos listo en unas 10 pantallas»');
  await seguir(e);
  const L = e.A.bvLista(e.S.onboarding), rec = e.S.onboarding.recortadas;
  ok(L.length === 10 && L.join() === 'hola,obj,G1,G2,G5,J1,J2,M1,N1,F', 'Android con todo: 10 pantallas (' + L.join(',') + ')');
  ok(rec.join() === 'T1,D1,M2,G3' && app(e).bienv.recortadas.join() === 'T1,D1,M2,G3', 'recortadas desde el final: Agenda, Deudas, M2 y G3 (' + rec.join() + ')');
  ok(!('herramientas' in app(e)) || Object.values(app(e).herramientas).every((v) => v !== false), 'todo marcado: nada apagado');
  await tocar(e, 'bvBanco', 'Santander'); await seguir(e);
  await teclear(e, '900'); await seguir(e);
  ok(paso_(e) === 'G5' && /Funciona con Santander, tu banco/.test(pantalla(e)), 'G5 sale porque Santander es compatible');
  await tocar(e, 'bvAvBanco', null, null, 150);
  ok(reg.conf.some((o) => o.activo) && reg.ajustes === 1 && /Ajuste restringido/.test(pantalla(e)), '«Activar» abre los ajustes; sin permiso, la nota de «ajustes restringidos»');
  reg.permiso = true; e.w.__avisosVolver(); await sleep(80);
  ok(/Activado/.test(pantalla(e)) && app(e).bienv.piloto === true && app(e).bienv.sellos.piloto, 'al volver con permiso: activado y sello «Piloto automático»');
  ok(!!e.doc.querySelector('.bv-sello-cae'), 'el sello cae en la esquina');
  await seguir(e);
  ok(paso_(e) === 'J1' && /¿Ya tienes grupo\?/.test(pantalla(e)), 'J1: ¿ya tienes grupo?');
  await tocar(e, 'bvJ1', 'crear', null, 300);
  ok(paso_(e) === 'J2' && /no hace falta que tengan la app/.test(pantalla(e)), 'J2: con quién compartes');
  await tocar(e, 'bvJPlant', 'Casa');
  ok(e.doc.querySelector('#bvGNombre').value === 'Casa' && e.doc.querySelectorAll('.bv-pers input').length === 3, 'la plantilla «Casa» pone el nombre y 3 campos');
  await escribir(e, '#bvP0', 'Ana'); await escribir(e, '#bvP1', 'Bea');
  await tocar(e, 'bvJCrear', null, null, 500);
  const ll = e.srv.llamadas.map((x) => x[0]);
  ok(ll.filter((x) => x === 'rpc.crear_grupo').length === 1 && ll.filter((x) => x === 'rpc.crear_sin_cuenta').length === 2, 'crea el grupo y las 2 personas sin cuenta (funciones de siempre)');
  ok(/Casa está listo/.test(pantalla(e)) && !!buscar(e, 'bvInvitar') && !!buscar(e, 'bvSig', 'Seguir'), 'el grupo «se monta» y salen «Invitar por WhatsApp» y «Seguir»');
  ok(app(e).bienv.sellos.equipo && app(e).bienv.grupoCreado === 'g1', 'sello «En equipo» y bienv.grupoCreado');
  await seguir(e);
  ok(paso_(e) === 'M1' && /¿Para qué ahorras\?/.test(pantalla(e)) && /Crear mi meta/.test(e.doc.querySelector('.ob2-pie').textContent), 'M1 con M2 recortada: el botón ya crea la meta');
  await tocar(e, 'bvMeta', 'Viaje');
  ok(e.doc.querySelector('#bvMNombre').value === 'Viaje', 'la plantilla pone el nombre (se puede cambiar)');
  await escribir(e, '#bvMNombre', 'Viaje a Roma'); await seguir(e);
  const m = (app(e).ahorro || [])[0];
  ok(m && m.nombre === 'Viaje a Roma' && m.objetivo === 1200 && m.forma === 'maleta', 'meta creada con la cifra del ejemplo (1.200 €) y su dibujo');
  ok(paso_(e) === 'N1' && /Sin publicidad\. Máximo 3 al día/.test(pantalla(e)) && /Cuando consigues una meta/.test(pantalla(e)) && /Lo que te apuntan en Juntos/.test(pantalla(e)), 'N1: avisos según lo elegido');
  await tocar(e, 'bvNotif', null, null, 150);
  ok(reg.pedidos === 1 && app(e).bienv.avisos === true, '«Permitir avisos» pide el permiso y lo apunta');
  await seguir(e);
  ok(paso_(e) === 'F', 'final');
  ok(e.doc.querySelectorAll('.bv-sello').length === 5, '5 sellos (nombre, banco, equipo, meta, piloto; sin «mes»): ' + e.doc.querySelectorAll('.bv-sello').length);
  const pz = e.A.bvPiezas(e.S.onboarding);
  ok(pz.length === 9 && pz.filter((x) => !x[1]).map((x) => x[0]).join() === 'mes,deuda,agenda', 'piezas pendientes: tu mes, tu deuda y tu agenda (' + pz.map((x) => x[0] + ':' + x[1]).join(' ') + ')');
  ok(pctTxt(e) === '67', '«Tu PalomApp al 67 %»: ' + pctTxt(e));
  ok(/Te falta: tu deuda y tu primera tarea|Te falta: tu primera tarea y tu deuda/.test(pantalla(e)), '«Te falta» con lo recortado: ' + ((pantalla(e).match(/Te falta:[^.]*?(?=\d|$)/) || [])[0] || ''));
  await tocar(e, 'bvFin', '', null, 800);
  ok(!e.S.onboarding && app(e).nivel === 'basico', 'a Inicio en «Lo básico»');
  const pp = e.A.bvPpFilas().map((f) => f.t);
  ok(pp.length === 3 && pp[0] === 'Apunta tu primera tarea' && pp[1] === 'Apunta lo que debes' && pp[2] === 'Elige cuándo empieza tu mes', '«Primeros pasos»: primero lo recortado (' + pp.join(' · ') + ')');
  ok(/Primeros pasos/.test(pantalla(e)) && /Al 67 %/.test(pantalla(e)), '«Primeros pasos» en Inicio con el % en la cabecera');
  const iw = app(e).inicioWidgets || [];
  ok(iw.map((x) => x.t).join() === 'asivas,dias,juntos,meta', 'Inicio con las piezas de la vista previa (' + iw.map((x) => x.t).join() + ')');

  // ---------- 4) Saltar pantallas: van a «Primeros pasos»; atrás de Android ----------
  paso('Saltar y volver atrás');
  e = await abrir({ cfg: {}, version: V });
  await seguir(e); await tocar(e, 'bvObj', 'Organizar mi día'); await seguir(e);
  ok(paso_(e) === 'G1', 'G1');
  await tocar(e, 'bvSaltar', null, null, 300); ok(paso_(e) === 'G2' && /Tu banco/.test(pantalla(e)), '«Saltar» G1: G2 con una cuenta nueva sin banco');
  ok(atras(e) === true && paso_(e) === 'G1', 'atrás (Android) vuelve a G1');
  await tocar(e, 'bvSaltar', null, null, 300); await tocar(e, 'bvSaltar', null, null, 300); await tocar(e, 'bvSaltar', null, null, 300);
  ok(paso_(e) === 'T1' && /Tu primera tarea/.test(pantalla(e)), 'G2 y G3 saltadas: T1');
  ok(!(app(e).cuentas || []).length && !app(e).mesInicio, 'lo saltado no guarda nada (ni cuenta ni «tu mes»)');
  await tocar(e, 'bvTareaIdea', 'Pedir cita'); await tocar(e, 'bvTareaDia', 'manana'); await seguir(e, 600);
  const ts = Object.values(e.store.tareas);
  ok(ts.length === 1 && ts[0].nombre === 'Pedir cita' && ts[0].estado === 'Pendiente' && Object.keys(ts[0]).length === 10, 'T1 crea la tarea con sus 10 campos');
  ok(JSON.stringify(app(e).bienv.saltadas) === '["G1","G2","G3"]', 'bienv.saltadas = G1, G2, G3');
  await tocar(e, 'bvFin', '', null, 700);
  const pp2 = e.A.bvPpFilas().map((f) => f.t);
  ok(pp2[0] === 'Pon el saldo de tu banco' && pp2[1] === 'Elige cuándo empieza tu mes', '«Primeros pasos» empieza por lo saltado (' + pp2.join(' · ') + ')');

  paso('Saltar toda la bienvenida desde «Hola»');
  e = await abrir({ cfg: {}, version: V });
  await tocar(e, 'bvSaltar', null, null, 100);
  ok(/¿Saltamos la bienvenida\?/.test(pantalla(e)) && /Primeros pasos/.test(pantalla(e)), 'pide confirmar: «Podrás hacerlo luego desde Primeros pasos»');
  await tocar(e, 'bvSaltarTodo', null, null, 600);
  ok(!e.S.onboarding && !('herramientas' in app(e)) && app(e).bienv.hecho && e.store.cfg.meta.onboarded, 'saltada entera: todo encendido (sin clave) y bienvenida hecha');

  // ---------- 5) Invitación primero ----------
  paso('Con invitación');
  const TOKEN = 'invitacionInventada9876';
  e = await abrir({ cfg: {}, version: V, url: 'https://x.test/?unirse=' + TOKEN,
    rpc: { ver_invitacion: (p) => (p.p_token === TOKEN ? { valida: true, tipo: 'grupo', nombre: 'Piso inventado', invita: 'Ana', miembros: 2 } : { valida: false }) } });
  e.srv.rpc.unirse = (p) => { e.srv.grupos.push({ id: 'g9', nombre: 'Piso inventado', tipo: 'grupo', edicion: 'todos', created_at: '2026-11-01T10:00:00Z' }); e.srv.miembros.push({ grupo_id: 'g9', user_id: ANA, nombre: 'Ana', rol: 'admin' }, { grupo_id: 'g9', user_id: YO, nombre: p.p_nombre, rol: 'miembro' }); return 'g9'; };
  await sleep(200);
  ok(paso_(e) === 'I1' && /Piso inventado/.test(pantalla(e)) && /Ahora no/.test(e.doc.querySelector('.bv-top').textContent), 'empieza por la invitación (con «Ahora no»)');
  await tocar(e, 'bvUnirse', null, null, 500);
  ok(paso_(e) === 'obj' && e.doc.querySelector('.bv-card.bloq.on') && /Ya estás en Piso inventado/.test(pantalla(e)), 'tras unirse: pantalla 2 con «Compartir gastos» marcado y bloqueado');
  ok(!e.doc.querySelector('.bv-card.on:not(.bloq)'), 'al invitado, «Controlar mis gastos» sale sin marcar');
  ok(atras(e) === false && paso_(e) === 'obj', 'atrás no vuelve a la invitación ya aceptada');
  await seguir(e);
  ok(paso_(e) === 'F' && !e.A.bvLista(e.S.onboarding).some((c) => c[0] === 'J'), 'sin rama Juntos: al final (I1 + objetivos + final)');
  ok(bvCuentaTest(e) === 2, 'la invitación no cuenta para el tope');
  ok(!(app(e).herramientas || {}).hasOwnProperty('juntos') && (app(e).herramientas || {}).presupuestos === false, 'Juntos encendido; lo no elegido, apagado');
  ok(!!buscar(e, 'bvFin', 'grupo') && /Ir a Piso inventado/.test(pantalla(e)), 'el final lleva a «Ir a Piso inventado»');
  await tocar(e, 'bvFin', 'grupo', null, 700);
  ok(!e.S.onboarding && e.S.tab === 'juntos', 'aterriza en Juntos');

  paso('Invitación aplazada: Hola y la pantalla 2 de siempre');
  e = await abrir({ cfg: {}, version: V, url: 'https://x.test/?unirse=' + TOKEN, rpc: { ver_invitacion: () => ({ valida: true, tipo: 'grupo', nombre: 'Piso inventado', invita: 'Ana', miembros: 2 }) } });
  await sleep(150); await tocar(e, 'bvSaltar', null, null, 200);
  ok(paso_(e) === 'hola', '«Ahora no» → Hola');
  await seguir(e);
  ok(e.doc.querySelector('.bv-card.on') && /Controlar mis gastos/.test(e.doc.querySelector('.bv-card.on').textContent), 'y «Controlar mis gastos» vuelve a salir marcado');

  // ---------- 6) J3: pegar el enlace ----------
  paso('J3: me han invitado (pegar enlace)');
  e = await abrir({ cfg: {}, version: V, rpc: { ver_invitacion: (p) => (p.p_token === TOKEN ? { valida: true, tipo: 'grupo', nombre: 'Piso inventado', invita: 'Ana', miembros: 2 } : { valida: false }) } });
  e.srv.rpc.unirse = () => { e.srv.grupos.push({ id: 'g9', nombre: 'Piso inventado', tipo: 'grupo', edicion: 'todos' }); e.srv.miembros.push({ grupo_id: 'g9', user_id: YO, nombre: 'Yo', rol: 'miembro' }); return 'g9'; };
  await seguir(e); await tocar(e, 'bvObj', 'Controlar mis gastos'); await tocar(e, 'bvObj', 'Compartir gastos'); await tocar(e, 'bvObj', 'Pagar una deuda'); await seguir(e);
  await tocar(e, 'bvJ1', 'invitado', null, 200);
  ok(paso_(e) === 'J3' && /Pega tu enlace/.test(pantalla(e)), 'J3');
  await escribir(e, '#bvEnlace', 'hola'); await tocar(e, 'bvJ3Abrir', null, null, 100);
  ok(paso_(e) === 'J3' && /no parece una invitación/.test(T.aviso(e)), 'un texto que no es enlace avisa y no sigue');
  await escribir(e, '#bvEnlace', 'Mira: https://urlife-zeta.vercel.app/?unirse=' + TOKEN); await tocar(e, 'bvJ3Abrir', null, null, 300);
  ok(paso_(e) === 'I1' && /Piso inventado/.test(pantalla(e)), 'abre la invitación (I1) dentro de la rama Juntos');
  await tocar(e, 'bvUnirse', null, null, 500);
  ok(paso_(e) === 'D1' && /¿Qué estás pagando\?/.test(pantalla(e)), 'tras unirse sigue con la rama siguiente (Deudas)');
  await tocar(e, 'bvDeuda', 'Préstamo del coche');
  await teclear(e, '4200'); await tocar(e, 'bvCampo', 'Pagas al mes'); await teclear(e, '150');
  const aca = new Date(); aca.setDate(15); aca.setMonth(aca.getMonth() + 28);
  ok(new RegExp('Acabas en [a-z]+ de ' + aca.getFullYear()).test(pantalla(e)), 'en vivo: «Acabas en … de ' + aca.getFullYear() + '» (' + ((pantalla(e).match(/Acabas en [^A-Z]*?\d{4}/) || [])[0]) + ')');
  await seguir(e);
  const d = (app(e).deudas || [])[0];
  ok(d && d.nombre === 'Préstamo del coche' && d.objetivo === 4200 && d.cuotaMes === 150 && d.emoji === '🚗', 'D1 guarda la deuda (te queda 4.200, 150 al mes)');
  ok(paso_(e) === 'F', 'final');

  // ---------- 7) M2: cuánto y cuándo (sin recortar) ----------
  paso('M1 → M2 con «unos X € al mes»');
  e = await abrir({ cfg: {}, version: V });
  await seguir(e); await tocar(e, 'bvObj', 'Controlar mis gastos'); await tocar(e, 'bvObj', 'Ahorrar para algo'); await seguir(e);
  await tocar(e, 'bvMeta', 'Colchón'); await seguir(e);
  ok(paso_(e) === 'M2' && /3\.000/.test(e.doc.querySelector('.bv-campo').textContent), 'M2 con la cifra del ejemplo (colchón: 3.000 € sin datos)');
  ok(/Unos 250 € al mes/.test(pantalla(e)), '12 meses: «Unos 250 € al mes»');
  await tocar(e, 'bvMetaPlazo', '6 meses'); ok(/Unos 500 € al mes/.test(pantalla(e)), '6 meses: «Unos 500 € al mes»');
  await teclear(e, '1800'); ok(/Unos 300 € al mes/.test(pantalla(e)), 'la primera tecla cambia la cifra: 1.800 en 6 meses → «Unos 300 € al mes»');
  await tocar(e, 'bvMetaPlazo', 'Sin fecha'); ok(/Sin prisa/.test(pantalla(e)), 'sin fecha: «Sin prisa»');
  await tocar(e, 'bvMetaPlazo', '3 meses'); await seguir(e);
  const m2 = (app(e).ahorro || [])[0];
  ok(m2 && m2.nombre === 'Colchón' && m2.objetivo === 1800 && m2.fechaObjetivo && m2.forma === 'colchon', 'meta creada: Colchón, 1.800 € en 3 meses');

  // ---------- 8) Lo no elegido se apaga sin borrar datos ----------
  paso('Apagar no borra');
  e = await abrir({ cfg: { app: { deudas: [{ id: 'd1', nombre: 'Préstamo inventado', objetivo: 1000 }] } }, version: V });
  ok(!!e.S.onboarding, 'cuenta nueva con una deuda: ve la bienvenida');
  await seguir(e); await seguir(e); await tocar(e, 'bvSaltar', null, null, 200); await tocar(e, 'bvSaltar', null, null, 200); await tocar(e, 'bvSaltar', null, null, 200);
  await tocar(e, 'bvFin', '', null, 700);
  ok(app(e).herramientas.deudas === false && app(e).deudas.length === 1 && app(e).deudas[0].nombre === 'Préstamo inventado', 'Deudas apagada pero la deuda sigue guardada');

  paso('«Afinar herramienta a herramienta»');
  e = await abrir({ cfg: {}, version: V });
  await seguir(e); await tocar(e, 'bvAfinar', null, null, 100);
  ok(/Herramienta a herramienta/.test(hoja(e)) && /no se borra nada/.test(hoja(e)), 'abre la hoja de interruptores');
  await tocar(e, 'bvAfinarCambiar', 'Presupuestos', 'hoja'); await tocar(e, 'bvAfinarCambiar', 'Agenda', 'hoja');
  T.cerrarHoja && await T.cerrarHoja(e);
  ok(!('herramientas' in app(e)), 'no se guarda hasta seguir');
  await seguir(e);
  ok(app(e).herramientas.presupuestos === false && app(e).herramientas.agenda !== false && app(e).herramientas.tickets !== false, 'afinado: Presupuestos apagado y Agenda encendida aunque no se eligió');

  // ---------- 9) Repetir desde Tú: solo añade ----------
  paso('Repetir desde Tú');
  const previo = { nombre: 'Álex', novedadesVistas: '9999-12-31', compararVersiones: false, cuentas: [{ id: 'c1', nombre: 'Banco inventado', tipo: 'corriente', saldo: 500, fecha: '2026-11-01', principal: true }],
    ahorro: [{ id: 'm1', nombre: 'Meta inventada', objetivo: 300 }], herramientas: { informes: false }, mesInicio: { modo: 'natural', dia: 1 } };
  e = await abrir({ cfg: { app: JSON.parse(JSON.stringify(previo)), meta: { onboarded: true } }, version: V });
  ok(!e.S.onboarding, 'quien ya la hizo no la ve al entrar');
  e.A.H.startOnboardingManually([]); await sleep(60);
  ok(paso_(e) === 'hola' && /Tu PalomApp a tu gusto/.test(pantalla(e)) && /no se borra nada/.test(pantalla(e)), '«Volver a ver la bienvenida» abre la NUEVA («Tu PalomApp a tu gusto»)');
  await seguir(e);
  ok(!e.doc.querySelector('.bv-card.on'), 'al repetirla no sale nada marcado');
  await tocar(e, 'bvObj', 'Ahorrar para algo'); await tocar(e, 'bvObj', 'Controlar mis gastos'); await seguir(e);
  ok(JSON.stringify(app(e).herramientas) === JSON.stringify({}) || JSON.stringify(app(e).herramientas) === '{}', 'no apaga nada; lo elegido (Gastos → Informes) se enciende: ' + JSON.stringify(app(e).herramientas));
  ok(paso_(e) === 'G1', 'G1');
  await seguir(e); // sin banco nuevo
  ok(paso_(e) === 'G2' && /ya tienen saldo/.test(pantalla(e)), 'G2: «Tus cuentas ya tienen saldo» (no se cambia nada)');
  await seguir(e); await seguir(e); // G3 con lo que ya tenía
  await tocar(e, 'bvMeta', 'Regalo'); await seguir(e); await seguir(e);
  const c9 = app(e);
  ok(c9.cuentas.length === 1 && c9.cuentas[0].saldo === 500 && c9.cuentas[0].nombre === 'Banco inventado', 'la cuenta no se toca');
  ok(c9.ahorro.length === 2 && c9.ahorro[0].nombre === 'Meta inventada' && c9.ahorro[1].nombre === 'Regalo', 'la meta de antes sigue y se añade la nueva');
  ok(JSON.stringify(c9.mesInicio) === JSON.stringify({ modo: 'natural', dia: 1 }), '«tu mes» igual');
  ok(paso_(e) === 'F' && /Volver a la app/.test(pantalla(e)) && !e.doc.querySelector('.bv-sello-cae'), 'final de la repetición, sin sellos «nuevos» de lo que ya tenía');
  await tocar(e, 'bvFin', '', null, 600);
  ok(!e.S.onboarding && app(e).nivel == null && !Array.isArray(app(e).inicioWidgets), 'al repetirla no cambia «Lo básico/Todo» ni Inicio');

  // ---------- 10) Quien ya usaba la app y no la repite: nada cambia ----------
  paso('Usuarios de antes');
  e = await abrir({ cfg: { app: JSON.parse(JSON.stringify(previo)), meta: { onboarded: true } }, version: V });
  await sleep(200);
  ok(!e.S.onboarding && !('bienv' in app(e)) && JSON.stringify(app(e).herramientas) === JSON.stringify(previo.herramientas), 'ni bienvenida, ni clave bienv, ni herramientas tocadas');
  ok(!e.A.bienvV2 || e.A.bvPpFilas().length >= 0, '(sin errores)');
  e = await abrir({ cfg: { app: { nombre: 'Álex', cuentas: [{ id: 'c1', nombre: 'Banco', saldo: 100, principal: true }] } }, version: V });
  await sleep(150);
  ok(!e.S.onboarding && !('bienv' in app(e)), 'quien ya tenía cuentas (sin la marca) tampoco la ve');

  // ---------- 11) Retomar donde lo dejó ----------
  paso('Cerrar a mitad y volver');
  e = await abrir({ cfg: { app: { nombre: 'Leo', cuentas: [{ id: 'c1', nombre: 'BBVA', banco: 'bbva', saldo: null, principal: true }], bienv: { objetivos: ['gastos'], recortadas: [], paso: 'G2' } } }, version: V });
  await sleep(100);
  ok(paso_(e) === 'G2' && /BBVA/.test(pantalla(e)), 'sigue en G2 aunque ya tenga una cuenta (' + paso_(e) + ')');
  fin('bienvenida_objetivos');
})();
function bvCuentaTest(e) { return e.A.bvLista(e.S.onboarding).filter((c) => c !== 'I1').length; }

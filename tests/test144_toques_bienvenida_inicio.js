// 11/11/2026 · Calidad (auditoría antes de Google Play): bienvenida nueva («Lo básico»), invitación,
// Inicio a tu gusto, Informes y que «Antes» no salga a los nuevos. Tocando de verdad. Solo datos inventados.
const T = require('./toques_comun.js');
const { abrir, tocar, tocarSiHay, buscar, escribir, teclearImporte, hoja, hojaAbierta, pantalla, aviso, atras, movs, app, ir, ok, paso, fin, sleep } = T;
T.fallosConocidos([]);
const YO = 'u-yo', ANA = 'u-ana';
const ANTES = ['compararCambiar', 'crearVersion', 'tecVersion', 'compararToggle'];
const hayAntes = (e) => [...e.doc.querySelectorAll('[data-click]')].filter((x) => ANTES.indexOf(x.getAttribute('data-click').split('|')[0]) >= 0 || /^\s*Antes\s*$/.test(x.textContent)).map((x) => x.getAttribute('data-click'));

(async () => {
  // ---------- 1) Cuenta nueva sin invitación ----------
  paso('Bienvenida nueva');
  let e = await abrir({ cfg: {}, version: { bienvenida: 1 } });
  ok(/¡Hola!/.test(pantalla(e)) && /Paso 1 de 2/.test(pantalla(e)), 'una cuenta nueva ve «¡Hola!» (paso 1 de 2)');
  await escribir(e, '#obNombre', 'Marta');
  const emp = buscar(e, 'obNext'); emp.click(); emp.click(); await sleep(300);
  ok(/Paso 2 de 2/.test(pantalla(e)) && /¿Por dónde empiezas\?/.test(pantalla(e)), 'dos toques en «Empezar» pasan un solo paso: «¿Por dónde empiezas?»');
  ok(app(e).nombre === 'Marta', 'el nombre se guarda al pasar de paso');
  await sleep(400); await tocar(e, 'obBack', null, null, 300);
  ok(e.doc.querySelector('#obNombre') && e.doc.querySelector('#obNombre').value === 'Marta', 'volver atrás conserva el nombre escrito');
  await tocar(e, 'obNext', null, null, 600);
  await tocar(e, 'obFinish', 'gasto', null, 500);
  const c = app(e);
  ok(c.nivel === 'basico' && c.compararVersiones === false && !!c.novedadesVistas && !!c.altaApp, 'al acabar queda en «Lo básico», sin «Antes» ni novedades antiguas (' + JSON.stringify({ nivel: c.nivel, comparar: c.compararVersiones }) + ')');
  ok(e.store.cfg.meta && e.store.cfg.meta.onboarded === true, 'y se marca la bienvenida como hecha');
  ok(/Nuevo gasto/.test(hoja(e)), '«Apuntar un gasto» abre «Nuevo gasto» nada más entrar');
  await teclearImporte(e, '4,5'); await tocar(e, 'tecCat', null, 'hoja');
  e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(150);
  ok(movs(e).length === 1 && movs(e)[0].importe === 4.5, 'el primer gasto se guarda (4,50 €) aunque no tenga categorías propias');
  await sleep(60);
  ok(/Primeros pasos|Gastos de este mes/.test(pantalla(e)), 'Inicio en «Lo básico» enseña «Primeros pasos» o «Gastos de este mes»');
  ok(/4,50/.test(pantalla(e)), 'Inicio enseña el gasto de 4,50 €');

  paso('«Antes» no sale a los nuevos');
  let vistos = hayAntes(e);
  await tocar(e, 'onFab'); vistos = vistos.concat(hayAntes(e));
  await tocar(e, 'crearIr', 'gasto', 'hoja'); vistos = vistos.concat(hayAntes(e)); atras(e); await sleep(260);
  for (const t of ['movimientos', 'dinero', 'juntos', 'tu']) { await ir(e, t); vistos = vistos.concat(hayAntes(e)); }
  await tocarSiHay(e, 'tuMasToggle', null, 'app'); vistos = vistos.concat(hayAntes(e).filter((x) => x !== 'compararToggle'));
  await ir(e, 'inicio'); const agb = buscar(e, 'irAgenda') || buscar(e, 'setInicioVista', 'tareas'); if (agb) { agb.click(); await sleep(60); vistos = vistos.concat(hayAntes(e)); }
  ok(!vistos.length, 'en ninguna pantalla ni hoja sale el botón «Antes» (' + vistos.join(', ') + ')');

  // ---------- 2) Cuenta nueva que llega con una invitación ----------
  paso('Invitación');
  const TOKEN = 'invitacionInventada1234';
  e = await abrir({ cfg: {}, version: { bienvenida: 1 }, url: 'https://x.test/?unirse=' + TOKEN,
    rpc: { ver_invitacion: (p) => (p.p_token === TOKEN ? { valida: true, tipo: 'grupo', nombre: 'Piso inventado', invita: 'Ana', miembros: 2 } : { valida: false }) } });
  e.srv.rpc.unirse = (p) => { e.srv.grupos.push({ id: 'g9', nombre: 'Piso inventado', tipo: 'grupo', edicion: 'todos', created_at: '2026-11-01T10:00:00Z' }); e.srv.miembros.push({ grupo_id: 'g9', user_id: ANA, nombre: 'Ana', rol: 'admin' }, { grupo_id: 'g9', user_id: YO, nombre: p.p_nombre, rol: 'miembro' }); return 'g9'; };
  await sleep(200);
  ok(/Piso inventado/.test(pantalla(e)) && /Ana/.test(pantalla(e)), 'la bienvenida empieza por la invitación de Ana a «Piso inventado»');
  const nom = e.doc.querySelector('#app input[data-input^="obSet"]');
  if (nom) await escribir(e, nom, 'Marta');
  const un = buscar(e, 'obUnirse'); ok(!!un, 'sale el botón para unirse');
  un.click(); un.click(); await sleep(500);
  ok(e.srv.llamadas.filter((l) => l[0] === 'rpc.unirse').length === 1, 'dos toques en «Unirme» llaman una sola vez al servidor');
  ok(e.srv.miembros.some((m) => m.grupo_id === 'g9' && m.user_id === YO && m.nombre === 'Marta'), 'entras al grupo con tu nombre (Marta)');
  ok(!e.S.onboarding && e.S.tab === 'juntos', 'aterrizas directamente en Juntos');
  ok(/Piso inventado/.test(hoja(e) + pantalla(e)), 'con el grupo «Piso inventado» abierto');
  ok(app(e).nivel === 'basico' && app(e).unidoA && app(e).unidoA.gid === 'g9', 'queda en «Lo básico» y recuerda a qué grupo te uniste');
  ok(!e.w.localStorage.getItem('unirse'), 'la invitación ya usada se olvida (no vuelve a salir)');

  // ---------- 3) Inicio a tu gusto ----------
  paso('Inicio a tu gusto');
  e = await abrir({ cfg: { app: { nombre: 'Marta', compararVersiones: false, categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  const ed = buscar(e, 'iwEditar', null, 'app');
  ok(!!ed, 'en Inicio está «Editar Inicio»');
  ed.click(); await sleep(60);
  const antes = e.A.form().lista.map((x) => x.t);
  ok(antes.length > 1, 'la hoja enseña las piezas de Inicio (' + antes.join(', ') + ')');
  await tocar(e, 'iwQuitar', null, 'hoja', 80);
  let guardado = (app(e).inicioWidgets || []).map((x) => x.t || x);
  if (process.env.VER) console.log('HOJA ' + hoja(e).slice(0, 300) + ' ## ' + [...e.doc.querySelectorAll('#sheetHost [data-click]')].map((x) => x.getAttribute('data-click')).join(' ') + ' ## ' + JSON.stringify(app(e).inicioWidgets));
  ok(guardado.length === antes.length - 1 && guardado[0] === antes[1], 'quitar la primera pieza se guarda en tu configuración (' + guardado.join(', ') + ')');
  await tocar(e, 'iwCat', null, 'hoja', 60);
  const an = buscar(e, 'iwAnadir', antes[0], 'hoja');
  ok(!!an, 'la pieza quitada se puede volver a añadir desde «Añadir»');
  if (an) { an.click(); await sleep(80); }
  guardado = (app(e).inicioWidgets || []).map((x) => x.t || x);
  ok(guardado.indexOf(antes[0]) >= 0 && guardado.length === antes.length, 'vuelve a estar (' + guardado.join(', ') + ')');
  if (e.A.form().vista !== 'cat') await tocar(e, 'iwCat', null, 'hoja', 60);
  const otra = buscar(e, 'iwAnadir', null, 'hoja');
  if (otra) { otra.click(); await sleep(80); }
  if (e.A.form().vista !== 'lista') await tocarSiHay(e, 'iwVista', 'lista', 'hoja', 60);
  guardado = (app(e).inicioWidgets || []).map((x) => x.t || x);
  ok(guardado.length === antes.length + 1, 'se añade otra pieza (' + guardado.join(', ') + ')');
  const g0 = guardado.slice();
  await tocar(e, 'iwMover', /Bajar .* 0 1$/, 'hoja', 80);
  guardado = (app(e).inicioWidgets || []).map((x) => x.t || x);
  ok(guardado[0] === g0[1] && guardado[1] === g0[0], '«Bajar» la primera cambia el orden guardado (' + guardado.join(', ') + ')');
  atras(e); await sleep(260);
  ok(!hojaAbierta(e), 'atrás cierra «Editar Inicio»');
  const orden = [...e.doc.querySelectorAll('#content [data-iw], #content .iw')].map((x) => x.getAttribute('data-iw') || '').filter(Boolean);
  if (orden.length) ok(orden[0] === guardado[0], 'Inicio se pinta en el orden guardado');

  // ---------- 4) Informes ----------
  paso('Informes');
  const mesPasado = (() => { const d = T.ahoraApp(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d; })();
  const f = (d, n) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(n).padStart(2, '0');
  e = await abrir({ cfg: { app: { nombre: 'Marta', compararVersiones: false, categoriasGasto: [{ nombre: 'Otros' }], ingresos: ['Nómina'] }, meta: { onboarded: true } },
    movs: [{ id: 'a1', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: f(mesPasado, 2) }, { id: 'a2', tipo: 'Gasto', categoria: 'Otros', importe: 300, fecha: f(mesPasado, 10) }, { id: 'a3', tipo: 'Gasto', categoria: 'Otros', importe: 200, fecha: f(mesPasado, 20) }] });
  await sleep(80);
  const inf = buscar(e, 'infVer', null, 'app') || buscar(e, 'infAbrir', null, 'app');
  ok(!!inf, 'en Inicio sale el aviso del informe del mes pasado');
  if (inf) { inf.click(); await sleep(80); }
  ok(/500/.test(hoja(e)) && /1\.500/.test(hoja(e)), 'el informe enseña lo gastado (500 €) y lo ingresado (1.500 €)');
  ok(!/NaN|undefined|Infinity/.test(hoja(e)), 'sin cifras raras en el informe');
  await T.cerrarHoja(e); await sleep(50);
  const vis = (app(e).informes || {}).vistos || {};
  ok(Object.keys(vis).length >= 1, 'abrirlo lo marca como visto (' + JSON.stringify(vis) + ')');
  // apagar los informes del mes desde sus ajustes
  await ir(e, 'tu'); if (!buscar(e, 'infAbrir')) await tocarSiHay(e, 'tuMasToggle', null, 'app');
  await tocar(e, 'infAbrir', null, null, 60);
  ok(/Informes/.test(hoja(e)), 'desde Tú → Informes se vuelve a abrir');
  await tocarSiHay(e, 'infAjustes', null, 'hoja', 40); if (process.env.VER) console.log('HOJA ' + hoja(e).slice(0, 300) + ' ## ' + [...e.doc.querySelectorAll('#sheetHost [data-click]')].map((x) => x.getAttribute('data-click')).join(' '));
  const sw = buscar(e, 'infOn', 'mes', 'hoja') || e.doc.querySelector('#sheetHost [data-change^="infOn|mes"]');
  ok(!!sw, 'en los ajustes del informe se puede apagar el del mes');
  if (sw) { if (sw.getAttribute('data-change')) { sw.checked = false; sw.dispatchEvent(new e.w.Event('change', { bubbles: true })); } else sw.click(); await sleep(60); }
  ok(((app(e).informes || {}).on || {}).mes === false, 'apagar el informe del mes se guarda');

  fin('bienvenida_inicio');
})().catch((x) => { console.log('FAIL excepción: ' + (x && x.stack || x)); process.exit(1); });

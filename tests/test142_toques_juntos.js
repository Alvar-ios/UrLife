// 11/11/2026 · Calidad (auditoría antes de Google Play): Juntos tocando de verdad.
// Crear grupo, persona sin cuenta, compartir un gasto, «Saldar todo» y «Deshacer», borrar y «Deshacer»,
// historial del grupo, «Pedir por WhatsApp». El servidor de grupos es falso (toques_comun.js). Solo datos inventados.
const T = require('./toques_comun.js');
const { abrir, tocar, tocarSiHay, buscar, escribir, teclearImporte, hoja, hojaAbierta, pantalla, aviso, deshacerToast, atras, movs, app, ir, ok, paso, fin, sleep } = T;
T.fallosConocidos(['RECUPERAR_ESPERA_AVISO']);
const YO = 'u-yo', ANA = 'u-ana';
const ahora = () => new Date().toISOString();
// rpc del servidor de grupos (lo justo para estos procesos)
function rpcGrupos(e) {
  const s = e.srv; let n = 0;
  s.rpc.crear_grupo = (p) => { const id = 'g-nuevo' + (++n); s.grupos.push({ id, nombre: p.p_nombre, tipo: 'grupo', edicion: 'todos', created_at: ahora(), creado_por: YO }); s.miembros.push({ grupo_id: id, user_id: YO, nombre: p.p_mi_nombre, rol: 'admin', created_at: ahora() }); return id; };
  s.rpc.crear_sin_cuenta = (p) => { const id = 'sc-' + (++n); s.sinCuenta.push({ id, grupo_id: p.p_grupo, nombre: p.p_nombre, creado_por: YO, created_at: ahora() }); return id; };
  s.rpc.recuperar_compartido = (p) => { const c = s.comp.find((x) => x.id === p.p_id); if (!c || !c.borrado) throw new Error('no_borrado'); delete c.borrado; return null; };
  s.rpc.historial_grupo = (p) => {
    const filas = []; let k = 0;
    s.comp.filter((c) => c.grupoId === p.p_grupo).forEach((c) => {
      const base = { grupo_id: c.grupoId, compartido_id: c.id, descripcion: c.descripcion, tipo: c.tipo, importe: c.importe, pagado_por: c.pagadoPor, reparto: c.reparto, nombres: {}, antes: null };
      filas.push(Object.assign({ id: ++k, accion: 'creado', hecho_por: c.creadoPor || YO, hecho_por_nombre: 'Yo', hecho_en: c.createdAt || ahora(), despues: { importe: c.importe }, borrado: c.borrado || null, puede_recuperar: false }, base));
      if (c.borrado) filas.push(Object.assign({ id: ++k, accion: 'borrado', hecho_por: YO, hecho_por_nombre: 'Yo', hecho_en: c.borrado, despues: null, borrado: c.borrado, puede_recuperar: true }, base));
    });
    return filas.sort((a, b) => b.hecho_en.localeCompare(a.hecho_en) || b.id - a.id);
  };
}
const activos = (e) => e.srv.comp.filter((c) => !c.borrado);

(async () => {
  // ---------- 1) Usuario nuevo: crear un grupo y añadir a alguien sin cuenta ----------
  let e = await abrir({ cfg: { app: { nombre: 'Lucía', compararVersiones: false }, meta: { onboarded: true } } });
  rpcGrupos(e);
  paso('Crear un grupo');
  await ir(e, 'juntos');
  await tocar(e, 'openGrupos', null, 'app', 80);
  await tocar(e, 'grupoNuevo', null, 'hoja');
  await tocar(e, 'grupoCrear', null, 'hoja', 80);
  ok(!e.srv.grupos.length && /nombre/i.test(aviso(e)), 'sin nombre no crea el grupo y lo pide');
  await escribir(e, '#gNombre', 'Piso inventado');
  const mi = e.doc.querySelector('#gMiNombre'); if (mi && !mi.value) await escribir(e, mi, 'Lucía');
  const bc = buscar(e, 'grupoCrear', null, 'hoja'); bc.click(); bc.click(); await sleep(150);
  ok(e.srv.llamadas.filter((l) => l[0] === 'rpc.crear_grupo').length === 1, 'dos toques en «Crear» crean un solo grupo');
  ok(e.srv.grupos.length === 1 && e.srv.grupos[0].nombre === 'Piso inventado', 'el servidor recibe el grupo «Piso inventado»');
  ok(/Piso inventado/.test(hoja(e)), 'se abre la hoja del grupo nuevo');

  paso('Persona sin cuenta');
  await tocarSiHay(e, 'grupoAjustes', null, 'hoja');
  let campo = e.doc.querySelector('#gSinCuenta');
  if (!campo) { await tocarSiHay(e, 'grupoAnadir', null, 'hoja'); campo = e.doc.querySelector('#gSinCuenta'); }
  ok(!!campo, 'en el grupo se puede añadir a alguien sin cuenta');
  await escribir(e, campo, 'Leo');
  await tocar(e, 'sinCuentaAnadir', null, 'hoja', 150);
  ok(e.srv.sinCuenta.length === 1 && e.srv.sinCuenta[0].nombre === 'Leo', 'el servidor recibe a Leo (sin cuenta)');
  ok(/Leo/.test(hoja(e)), 'Leo sale en el grupo');
  await T.cerrarHoja(e);

  paso('Compartir un gasto con el grupo nuevo');
  await ir(e, 'juntos');
  await tocar(e, 'compRapido', null, 'app', 150);
  ok(/Compartir un gasto/.test(hoja(e)), 'se abre «Compartir un gasto»');
  const dest = buscar(e, 'crDest', /Piso inventado/, 'hoja'); if (dest && !dest.classList.contains('active')) { dest.click(); await sleep(40); }
  await escribir(e, '#crImporte', '30');
  await escribir(e, '#crDesc', 'Cena inventada');
  ok(/Tu parte 15,00/.test(hoja(e)) && /te deben 15,00/.test(hoja(e)), 'mientras escribes dice «Tu parte 15,00 € · te deben 15,00 €»');
  const gu = buscar(e, 'crGuardar', null, 'hoja'); gu.click(); gu.click(); await sleep(200);
  let cs = activos(e);
  ok(cs.length === 1 && cs[0].importe === 30 && cs[0].pagadoPor === YO && Object.keys(cs[0].reparto).length === 2 && cs[0].reparto[YO] === 15, 'se guarda UN gasto compartido de 30 € (15 y 15) aunque toques dos veces (' + JSON.stringify(cs.map((c) => [c.importe, c.reparto])) + ')');
  const mio = movs(e).filter((m) => m.compartidoId);
  ok(mio.length === 1 && mio[0].importe === 30 && mio[0].compartidoId === (cs[0] || {}).id && mio[0].id !== 'undefined', 'y tu copia personal (30 € enlazada al compartido) con un id propio');
  await sleep(100); await ir(e, 'juntos');
  ok(/Leo/.test(pantalla(e)) && /15/.test(pantalla(e)), 'Juntos enseña que Leo te debe 15 €');

  paso('Pago parcial de Leo desde el grupo');
  await tocar(e, 'juntosVer', 'grupos', 'app', 60);
  await tocar(e, 'grupoVer', null, null, 100);
  await tocar(e, 'saldarAbrir', null, 'hoja', 40);
  ok(/Leo te paga/.test(hoja(e)) && e.doc.querySelector('#sImporte').value === '15', '«Me ha pagado» abre «Leo te paga» con 15 € puestos');
  await escribir(e, '#sImporte', '10');
  const sv = buscar(e, 'saldarGuardar', null, 'hoja'); sv.click(); sv.click(); await sleep(200);
  const lq = activos(e).filter((c) => c.tipo === 'Liquidación');
  ok(lq.length === 1 && lq[0].importe === 10 && lq[0].pagadoPor === e.srv.sinCuenta[0].id, 'se apunta UN pago de 10 € de Leo (' + lq.length + ')');
  await T.cerrarHoja(e); await ir(e, 'juntos');
  ok(/Leo/.test(pantalla(e)) && /5,00|5 €/.test(pantalla(e)), 'Juntos enseña que Leo aún te debe 5 €');

  // ---------- 2) Con Ana (con cuenta), deudas en los dos sentidos ----------
  e = await abrir({ cfg: { app: { nombre: 'Lucía', compararVersiones: false, categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } },
    grupos: [{ id: 'g1', nombre: 'Viaje inventado', tipo: 'grupo', edicion: 'todos', created_at: '2026-10-01T10:00:00Z' }],
    miembros: [{ grupo_id: 'g1', user_id: YO, nombre: 'Lucía', rol: 'admin', created_at: '2026-10-01T10:00:00Z' }, { grupo_id: 'g1', user_id: ANA, nombre: 'Ana', rol: 'miembro', created_at: '2026-10-01T10:01:00Z' }],
    comp: [{ id: 'k1', grupoId: 'g1', fecha: T.diasAtras(0), tipo: 'Gasto', categoria: 'Otros', descripcion: 'Hotel inventado', importe: 80, pagadoPor: YO, reparto: { [YO]: 40, [ANA]: 40 }, modo: 'igual', creadoPor: YO, createdAt: '2026-11-02T10:00:00Z' }],
    movs: [{ id: 'mk1', tipo: 'Gasto', categoria: 'Otros', descripcion: 'Hotel inventado', importe: 80, fecha: T.diasAtras(0), compartidoId: 'k1' }] });
  rpcGrupos(e);
  paso('Persona: Pedir por WhatsApp');
  await ir(e, 'juntos'); await sleep(80);
  ok(/Ana/.test(pantalla(e)) && /40/.test(pantalla(e)), 'Juntos enseña a Ana con 40 €');
  if (process.env.VER) console.log([...e.doc.querySelectorAll('#content [data-click]')].map((x) => x.getAttribute('data-click')).join(' '));
  await tocar(e, 'personaVer', ANA, 'app', 60);
  ok(/Te debe/.test(hoja(e)) && /40,00/.test(hoja(e)), 'la hoja de Ana dice «Te debe 40,00 €»');
  const wa = e.doc.querySelector('#sheetHost a.wa-btn');
  const txt = wa ? decodeURIComponent((wa.getAttribute('href') || '').split('text=')[1] || '') : '';
  ok(!!wa && /^https:\/\/wa\.me\/\?text=/.test(wa.getAttribute('href')) && /40,00/.test(txt), '«Pedir por WhatsApp» abre WhatsApp con el mensaje y los 40,00 € (' + txt.slice(0, 80) + ')');
  ok(!/undefined|NaN|null/.test(txt), 'el mensaje de WhatsApp no lleva restos raros');

  paso('Saldar todo y Deshacer');
  await tocar(e, 'saldarTodo', ANA, 'hoja', 40);
  ok(/40,00/.test(hoja(e)), 'la hoja de «Ya me ha pagado» enseña 40,00 €');
  const sg = buscar(e, 'saldarTodoGuardar', null, 'hoja'); sg.click(); sg.click(); await sleep(200);
  const liq = activos(e).filter((c) => c.tipo === 'Liquidación');
  ok(liq.length === 1 && liq[0].importe === 40 && liq[0].pagadoPor === ANA && liq[0].reparto[YO] === 40, 'se apunta UN pago de Ana a ti de 40 € (aunque toques dos veces) (' + liq.length + ')');
  ok(/en paz con Ana/.test(aviso(e)), 'dice «¡en paz con Ana!»');
  await sleep(50); await ir(e, 'juntos');
  ok(!/Te debe/.test(pantalla(e)) || /en paz|Todo saldado|nada pendiente/i.test(pantalla(e)), 'Juntos ya no enseña deuda con Ana');
  ok(await deshacerToast(e), 'sale «Deshacer» tras saldar');
  await sleep(150);
  ok(activos(e).filter((c) => c.tipo === 'Liquidación').length === 0, '«Deshacer» quita el pago');
  await ir(e, 'juntos');
  ok(/Ana/.test(pantalla(e)) && /40/.test(pantalla(e)), 'y Ana vuelve a deberte 40 €');

  paso('Borrar un gasto compartido y Deshacer');
  await ir(e, 'movimientos'); await tocarSiHay(e, 'setMovVista', 'lista', 'app', 60);
  const fila = buscar(e, 'openMovForm', /Hotel inventado/, 'app');
  ok(!!fila, 'el gasto compartido sale en Movimientos');
  fila.click(); await sleep(60);
  ok(/Gasto compartido/.test(hoja(e)), 'tocarlo abre «Gasto compartido»');
  const dc = await tocar(e, 'deleteComp', null, 'hoja', 20);
  if (!e.srv.comp.find((c) => c.id === 'k1').borrado) { dc.click(); await sleep(150); }
  ok(!!e.srv.comp.find((c) => c.id === 'k1').borrado && !e.store.movimientos.mk1, 'se borra el compartido (para todos) y tu copia personal');
  ok(await deshacerToast(e), 'sale «Deshacer»');
  await sleep(200);
  ok(!e.srv.comp.find((c) => c.id === 'k1').borrado, '«Deshacer» recupera el MISMO gasto (mismo id) en el servidor');
  ok(!!e.store.movimientos.mk1 && e.store.movimientos.mk1.compartidoId === 'k1' && e.store.movimientos.mk1.importe === 80, 'y tu copia personal vuelve, enlazada');
  ok(movs(e).length === 1 && activos(e).length === 1, 'ni se pierde ni se duplica nada');
  await ir(e, 'juntos');
  ok(/Ana/.test(pantalla(e)) && /40/.test(pantalla(e)), 'tras «Deshacer», sin esperar al aviso en vivo del servidor, Ana vuelve a deberte 40 € en pantalla', 'RECUPERAR_ESPERA_AVISO');
  const ef = e.A.movsEfectivos().filter((m) => /Hotel inventado/.test(m.descripcion || ''));
  ok(ef.length === 1 && ef[0].importe === 40, 'mientras tanto, en tus cuentas del mes el hotel cuenta como tu parte (40 €), no como 80 € (' + JSON.stringify(ef.map((m) => m.importe)) + ')', 'RECUPERAR_ESPERA_AVISO');
  e.srv.avisar('comp'); await sleep(80); // llega el aviso en vivo
  await ir(e, 'juntos');
  ok(/Ana/.test(pantalla(e)) && /40/.test(pantalla(e)), 'con el aviso en vivo, Ana vuelve a deberte 40 €');
  const ef2 = e.A.movsEfectivos().filter((m) => /Hotel inventado/.test(m.descripcion || ''));
  ok(ef2.length === 1 && ef2[0].importe === 40, 'y el hotel vuelve a contar 40 € (tu parte)');

  paso('Editar el importe de un gasto compartido');
  await ir(e, 'movimientos'); await tocarSiHay(e, 'setMovVista', 'lista', 'app', 60);
  await tocar(e, 'openMovForm', /Hotel inventado/, 'app', 60);
  if (e.A.form().tec) { await tocar(e, 'tecAbrir', null, 'hoja'); await teclearImporte(e, '100'); e.doc.querySelector('#sheetHost [data-click="tecK|ok"]').click(); await sleep(20); }
  else await escribir(e, '#fImporte', '100');
  await tocar(e, 'saveMov', null, 'hoja', 250);
  const k1 = e.srv.comp.find((c) => c.id === 'k1');
  ok(k1.importe === 100 && k1.reparto[YO] === 50 && k1.reparto[ANA] === 50, 'el compartido pasa a 100 € (50 y 50) en el servidor (' + JSON.stringify([k1.importe, k1.reparto]) + ')');
  ok(e.store.movimientos.mk1 && e.store.movimientos.mk1.importe === 100, 'y tu copia personal también a 100 €');
  ok(activos(e).length === 1 && movs(e).length === 1, 'sin duplicar nada');
  e.srv.avisar('comp'); await sleep(60); await ir(e, 'juntos');
  ok(/50/.test(pantalla(e)), 'Juntos enseña que Ana te debe 50 €');

  paso('Historial del grupo');
  await ir(e, 'juntos');
  await tocar(e, 'juntosVer', 'grupos', 'app', 60);
  await tocar(e, 'grupoVer', 'g1', null, 80);
  if (process.env.VER) console.log('HOJA ' + hoja(e).replace(/\s+/g, ' ').slice(0, 600) + ' ## ' + [...e.doc.querySelectorAll('#sheetHost [data-click]')].map((x) => x.getAttribute('data-click')).join(' '));
  const hv = buscar(e, 'histVer', null, 'hoja');
  ok(!!hv, 'en el grupo está el historial');
  if (hv) { hv.click(); await sleep(200); }
  ok(e.srv.llamadas.some((l) => l[0] === 'rpc.historial_grupo' && l[1].p_grupo === 'g1'), 'se pide el historial del grupo al servidor');
  ok(/Hotel inventado/.test(hoja(e)), 'el historial enseña «Hotel inventado»');
  ok(atras(e) === true, 'atrás de Android sale del historial');
  await sleep(260);

  fin('juntos');
})().catch((x) => { console.log('FAIL excepción: ' + (x && x.stack || x)); process.exit(1); });

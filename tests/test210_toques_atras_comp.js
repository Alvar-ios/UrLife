// 26/11/2026 · Calidad (docs/51, sesión 1, auditoría de interacción): el atrás de Android en un gasto compartido que YA existe.
// En Chromium (tests/capturas/interaccion.js) se vio que abrir un gasto compartido ya guardado y pulsar atrás SIN cambiar nada
// pregunta «¿Descartar este gasto? Lo que has escrito no se guardará.» (no borra nada, pero asusta y sobra un paso).
// Causa: hojaConAlgoEscrito() mira !FORM.id, y los gastos compartidos se editan con FORM.compId (FORM.id = null).
// Aquí se comprueba con toques de verdad (despachador de la app) y datos inventados. Ver docs/salud/2026-11-26-interaccion.md.
const T = require('./toques_comun.js');
const { abrir, tocar, teclearImporte, hojaAbierta, atras, ir, ok, paso, fin, sleep } = T;
T.fallosConocidos([]); // 26/11: ATRAS_COMP_SIN_CAMBIOS arreglado (hojaConAlgoEscrito mira también FORM.compId)
const YO = 'u-yo', ANA = 'u-ana';
const pregunta = (e) => !!e.doc.querySelector('#descartarHoja');

(async () => {
  const e = await abrir({ version: { juntos: 1 }, // 28/11: «Lo último» es de la pantalla anterior (la nueva no lo tiene)
   
    cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Otros' }, { nombre: 'Restaurantes' }] }, meta: { onboarded: true } },
    grupos: [{ id: 'g1', nombre: 'Viaje inventado', tipo: 'grupo', edicion: 'todos', created_at: '2026-10-01T10:00:00Z' }],
    miembros: [{ grupo_id: 'g1', user_id: YO, nombre: 'Lucía', rol: 'admin', created_at: '2026-10-01T10:00:00Z' }, { grupo_id: 'g1', user_id: ANA, nombre: 'Ana', rol: 'miembro', created_at: '2026-10-01T10:01:00Z' }],
    comp: [{ id: 'k1', grupoId: 'g1', fecha: T.diasAtras(1), tipo: 'Gasto', categoria: 'Otros', descripcion: 'Hotel inventado', importe: 80, pagadoPor: ANA, reparto: { [YO]: 40, [ANA]: 40 }, modo: 'igual', creadoPor: ANA, createdAt: '2026-11-02T10:00:00Z' }],
    movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Cena inventada', importe: 25, fecha: T.diasAtras(2) }],
  });
  e.srv.rpc.historial_grupo = () => [];

  paso('Gasto compartido ya guardado, desde la hoja del grupo, sin cambiar nada');
  await ir(e, 'juntos'); await sleep(80);
  await tocar(e, 'grupoVer', 'g1', 'app', 120);
  await tocar(e, 'compAbrir', 'k1', 'hoja', 120);
  ok(hojaAbierta(e) && /Hotel inventado|80/.test(e.doc.querySelector('#sheetHost').textContent), 'se abre el gasto compartido «Hotel inventado»');
  ok(atras(e) === true, 'el atrás de Android lo resuelve la app');
  await sleep(260);
  ok(!pregunta(e), 'sin cambiar nada, atrás NO pregunta «¿Descartar este gasto?»');
  // pase lo que pase, no se borra ni se cambia nada en el servidor
  const d = e.doc.querySelector('#descartarHoja [data-click="descartarSi"]'); if (d) { d.click(); await sleep(260); }
  ok(hojaAbierta(e) && /Viaje inventado/.test(e.doc.querySelector('#sheetHost').textContent) && !/Hotel inventado/.test(e.doc.querySelector('#sheetHost .sheet h2') ? e.doc.querySelector('#sheetHost .sheet h2').textContent : ''), 'atrás vuelve a la hoja del grupo (26/11, decisión del dueño)');
  ok(atras(e) === true, 'otro atrás'); await sleep(260);
  ok(!hojaAbierta(e), 'y cierra el grupo');
  ok(e.srv.comp.length === 1 && !e.srv.comp[0].borrado && e.srv.comp[0].importe === 80, 'el gasto compartido sigue igual en el servidor (80 €, sin borrar)');
  ok(!e.srv.llamadas.some((l) => /compartidos\.(borrar|editar)/.test(l[0])), 'no se llama a borrar ni a editar');

  paso('Gasto compartido ya guardado, desde «Lo último» de Juntos, sin cambiar nada');
  await ir(e, 'inicio'); await ir(e, 'juntos'); await sleep(80);
  const fila = [...e.doc.querySelectorAll('#content [data-click^="openMovForm|c"]')][0];
  if (fila) { fila.click(); await sleep(120); }
  ok(!!fila && hojaAbierta(e), 'se abre el gasto desde «Lo último»');
  ok(atras(e) === true, 'atrás lo resuelve la app'); await sleep(260);
  ok(!pregunta(e), 'sin cambiar nada, atrás NO pregunta «¿Descartar este gasto?» (desde «Lo último»)');
  const d2 = e.doc.querySelector('#descartarHoja [data-click="descartarSi"]'); if (d2) { d2.click(); await sleep(260); }

  paso('Lo que ya funciona bien (para que no se rompa al arreglarlo)');
  await ir(e, 'movimientos'); await tocar(e, 'setMovVista', 'lista', 'app', 80);
  await tocar(e, 'openMovForm', 'm1', 'app', 120);
  ok(atras(e) === true, 'un gasto propio ya guardado: atrás lo resuelve la app'); await sleep(260);
  ok(!pregunta(e) && !hojaAbierta(e), 'un gasto propio sin cambios: atrás cierra sin preguntar');
  await tocar(e, 'onFab'); await tocar(e, 'crearIr', 'gasto', 'hoja');
  await teclearImporte(e, '12');
  ok(atras(e) === true && (await sleep(120), pregunta(e)), 'un gasto NUEVO con 12 € tecleados: atrás pregunta «¿Descartar…?»');
  ok(atras(e) === true && (await sleep(120), !pregunta(e) && hojaAbierta(e)), 'otro atrás cierra la pregunta y sigues editando');
  fin('test210');
})();

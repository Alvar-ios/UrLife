// 26/11/2026 · Calidad (revisión de docs/51, sesión 1): el atrás de Android que vuelve a un grupo (FORM.volverGrupo).
// Decisión del dueño (26/11): un gasto abierto DESDE un grupo vuelve al grupo con atrás. Aquí se mira que no vuelva a un
// grupo que no toca. Toques de verdad por el despachador de la app y datos inventados (nombres e importes de mentira).
// Los fallos que se ven aquí están descritos en el informe de Calidad del 26/11 y se marcan como «fallo conocido»
// (imprimen FALLO CONOCIDO, no rompen npm test). Cuando se arreglen, quita su clave de la lista.
const T = require('./toques_comun.js');
const { abrir, tocar, hojaAbierta, atras, ir, ok, paso, fin, sleep } = T;
T.fallosConocidos([]); // 26/11: los tres arreglados (volverDeHoja, compAbrir solo recuerda la hoja de la que venías, atrás con S.volverA)
const YO = 'u-yo', ANA = 'u-ana';
const tituloHoja = (e) => { const h = e.doc.querySelector('#sheetBackdrop:not([data-cerrando]) .sheet h2'); return h ? h.textContent : ''; };
const enGrupo = (e) => hojaAbierta(e) && !!e.A.form() && e.A.form().kind === 'grupo'; // 26/11: por el tipo de hoja (la hoja de Ana también nombra el grupo)

(async () => {
  const e = await abrir({
    cfg: { app: { nombre: 'Lucía', compararVersiones: false, categoriasGasto: [{ nombre: 'Otros' }, { nombre: 'Restaurantes' }] }, meta: { onboarded: true } },
    grupos: [{ id: 'g1', nombre: 'Piso inventado', tipo: 'grupo', edicion: 'todos', created_at: '2026-10-01T10:00:00Z' }],
    miembros: [{ grupo_id: 'g1', user_id: YO, nombre: 'Lucía', rol: 'admin', created_at: '2026-10-01T10:00:00Z' }, { grupo_id: 'g1', user_id: ANA, nombre: 'Ana', rol: 'miembro', created_at: '2026-10-01T10:01:00Z' }],
    comp: [{ id: 'k1', grupoId: 'g1', fecha: T.diasAtras(1), tipo: 'Gasto', categoria: 'Otros', descripcion: 'Luz inventada', importe: 60, pagadoPor: ANA, reparto: { [YO]: 30, [ANA]: 30 }, modo: 'igual', creadoPor: ANA, createdAt: '2026-11-02T10:00:00Z' }],
    movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Restaurantes', descripcion: 'Cena inventada', importe: 25, fecha: T.diasAtras(3) }],
  });
  e.srv.rpc.historial_grupo = () => [];

  paso('Lo pedido: gasto abierto desde el grupo → atrás vuelve al grupo');
  await ir(e, 'juntos'); await sleep(80);
  await tocar(e, 'grupoVer', 'g1', 'app', 120);
  await tocar(e, 'compAbrir', 'k1', 'hoja', 120);
  ok(hojaAbierta(e) && /Luz inventada|60/.test(e.doc.querySelector('#sheetHost').textContent), 'se abre «Luz inventada» desde el grupo');
  atras(e); await sleep(260);
  ok(enGrupo(e), 'atrás vuelve a la hoja del grupo');

  paso('Gasto abierto desde el grupo y cerrado tocando fuera (sin atrás ni Guardar)');
  await tocar(e, 'compAbrir', 'k1', 'hoja', 120);
  const fondo = e.doc.querySelector('#sheetBackdrop'); if (fondo) fondo.click(); await sleep(260);
  ok(!hojaAbierta(e), 'la hoja se cierra tocando lo oscuro');
  // ahora, en otra pestaña, se apunta un gasto nuevo desde el calendario de Movimientos (nada que ver con el grupo)
  await ir(e, 'movimientos'); await tocar(e, 'setMovVista', 'calendario', 'app', 120);
  await tocar(e, 'gastoEnDia', '', 'app', 160);
  ok(hojaAbierta(e) && e.A.form().kind === 'mov', 'se abre un gasto nuevo desde «Apuntar un gasto este día»');
  ok(!e.A.form().volverGrupo, 'ese gasto nuevo NO recuerda el grupo de antes (FORM.volverGrupo vacío)', 'VOLVER_GRUPO_RANCIO');
  atras(e); await sleep(260);
  ok(!enGrupo(e), 'atrás NO abre el grupo «Piso inventado» (no venías de él)', 'VOLVER_GRUPO_RANCIO');
  if (hojaAbierta(e)) { const b = e.doc.querySelector('#sheetBackdrop'); if (b) b.click(); await sleep(260); }

  paso('Gasto abierto desde la hoja de una persona (Juntos → Por persona → Ana)');
  await ir(e, 'juntos'); await sleep(60);
  await tocar(e, 'juntosVer', 'personas', 'app', 80);
  await tocar(e, 'personaVer', ANA, 'app', 160);
  ok(hojaAbierta(e) && /Ana/.test(tituloHoja(e)), 'se abre la hoja de Ana');
  const fila = [...e.doc.querySelectorAll('#sheetHost [data-click^="compAbrir|k1"]')][0];
  if (fila) { fila.click(); await sleep(160); }
  ok(!!fila && hojaAbierta(e) && /Luz inventada|60/.test(e.doc.querySelector('#sheetHost').textContent), 'desde Ana se abre «Luz inventada»');
  atras(e); await sleep(260);
  ok(hojaAbierta(e) && /Ana/.test(tituloHoja(e)) && !enGrupo(e), 'atrás vuelve a la hoja de Ana (no al grupo «Piso inventado», del que no venías)', 'VOLVER_GRUPO_DESDE_PERSONA');
  if (hojaAbierta(e)) { const b = e.doc.querySelector('#sheetBackdrop'); if (b) b.click(); await sleep(260); }

  paso('Lista de Movimientos abierta desde otra pantalla (con «‹ Volver a …»)');
  await ir(e, 'dinero'); await sleep(40);
  e.A.H.irMovs(['_gastos', 'todo', 'Restaurantes']); await sleep(120); // preparación: lo mismo que hacen los atajos «Ver movimientos» de Dinero, Inicio o Juntos
  if (e.S.volverA) {
    const de = e.S.volverA.tab;
    ok(e.S.tab === 'movimientos' && e.S.movVista === 'lista', 'se abre la Lista con su enlace «Volver a ' + e.S.volverA.label + '»');
    atras(e); await sleep(120);
    ok(e.S.tab === de, 'atrás vuelve a la pantalla de la que venías (como el enlace «‹ Volver a …»), no al Resumen sin filtro', 'ATRAS_LISTA_VOLVER_A');
  } else console.log('   (no hay un atajo «irMovs» a mano en esta pantalla: este paso no se comprueba)');

  ok(e.srv.comp.length === 1 && !e.srv.comp[0].borrado && e.srv.comp[0].importe === 60, 'el gasto compartido sigue igual en el servidor (60 €, sin borrar)');
  ok(!e.srv.llamadas.some((l) => /compartidos\.(borrar|editar)/.test(l[0])), 'no se llama a borrar ni a editar');
  fin('test211');
})();

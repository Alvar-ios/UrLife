// Cambios medianos de interfaz (22/10/2026, auditoría B3–B12). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 }, movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Supermercado', importe: 7.08, fecha: '2026-10-01' }], cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Mi club' }] }, meta: { onboarded: true } } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, hoy = A.todayISO();
  const sheet = (q) => doc.querySelector('#sheetHost ' + q);
  // B6 · importe con coma
  H.openMovForm(['m1']); await sleep(20);
  ok(sheet('#fImporte').value === '7,08' && sheet('#fImporte').type === 'text', 'editar: el importe sale «7,08» (con coma) en un campo de texto');
  sheet('#fImporte').value = '12,5'; await A.H.saveMov([]); await sleep(30);
  ok(Math.abs(e.store.movimientos.m1.importe - 12.5) < 1e-9, 'guardar «12,5» guarda 12,5');
  await sleep(300);
  // B9 · categorías con icono y color
  H.crearIr(['gasto']); await sleep(20);
  const chips = [...doc.querySelectorAll('#sheetHost #catChips .chip:not(.chip-mas)')];
  ok(chips.length >= 2 && chips.some((c) => /Supermercado/.test(c.textContent)) && chips.every((c) => c.querySelector('.chip-cat-ic svg.i')) && !doc.querySelector('#sheetHost .chip-pers'), 'formulario: cada categoría con su icono y color, sin el puntito violeta');
  H.pickCat(['Supermercado']); await sleep(5);
  ok(doc.querySelector('#sheetHost #catChips .chip.active') && /Supermercado/.test(doc.querySelector('#sheetHost #catChips .chip.active').textContent), 'elegir una categoría la marca');
  H.closeSheet([]); await sleep(300);
  // B11 · día vacío en el calendario de Movimientos
  H.goTab(['movimientos']); H.setMovVista(['calendario']); await sleep(10); H.calSelDia([hoy]); await sleep(10);
  const b = doc.querySelector('[data-click^="gastoEnDia"]');
  ok(b && /Apuntar un gasto este día/.test(b.textContent), 'calendario: día sin movimientos con «Apuntar un gasto este día»');
  b.click(); await sleep(20);
  ok(sheet('#fFecha') && sheet('#fFecha').value === hoy && /Nuevo gasto/.test(sheet('#movFormTit').textContent), '…que abre un gasto con ese día puesto');
  H.closeSheet([]); await sleep(300);
  // B7 · una sola lupa en la lista
  H.setMovVista(['lista']); await sleep(10);
  ok(doc.body.classList.contains('en-movlista') && doc.querySelector('[data-click="movBuscarAbrir"]'), 'lista: queda la lupa de la lista (la de arriba se esconde)');
  H.goTab(['inicio']); await sleep(10);
  ok(!doc.body.classList.contains('en-movlista'), 'fuera de la lista vuelve la lupa de arriba');
  // B12 · atajos de Buscar con icono
  H.openBuscar([]); await sleep(10);
  ok([...doc.querySelectorAll('#sheetHost .chip-ic')].length >= 6 && [...doc.querySelectorAll('#sheetHost .chip-ic')].every((c) => c.querySelector('svg.i')), 'buscar: atajos con icono');
  H.closeSheet([]); await sleep(300);
  // B8 · próximos 7 días con casilla
  S.tareas = [{ id: 'tp', nombre: 'Pasar la ITV', estado: 'Pendiente', prioridad: 'Media', fechaLimite: A.uAdd(hoy, 2) }];
  H.setInicioVista(['tareas']); await sleep(10);
  const fila = [...doc.querySelectorAll('#content .row')].find((r) => /Pasar la ITV/.test(r.textContent));
  ok(fila && fila.querySelector('.check-btn'), 'Agenda · próximos 7 días: las tareas se pueden marcar desde ahí');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

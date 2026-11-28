// 26/11/2026 · Sin conexión, parte de la pantalla (docs/52): aviso fino, hoja «Cambios sin subir», cerrar sesión bloqueado. Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ cfg: { app: { compararVersiones: false }, meta: { onboarded: true } }, movs: [], version: { tu: 1, agenda: 0, crear: 0 }, session: { user: { email: 'ana.prueba@example.invalid' } } });
  const w = e.w; await sleep(300);
  let est = { activo: true, sinRed: false, subiendo: false, pendientes: 0, fallos: 0, revisar: 0, total: 0 }; let lista = []; let escucha = null; const llamadas = [];
  w.Data.sinc = { activo: () => true, estado: () => est, lista: () => lista, onChange: (f) => { escucha = f; return () => {}; }, reintentar: async (id) => { llamadas.push(['reintentar', id]); }, forzar: async (id) => { llamadas.push(['forzar', id]); }, descartar: async (id) => { llamadas.push(['descartar', id]); }, olvidar: async () => { llamadas.push(['olvidar']); } };
  // la app engancha el aviso al entrar: se fuerza aquí
  w.document.dispatchEvent(new w.Event('visibilitychange'));
  const pulsa = (a) => { const b = w.document.createElement('button'); b.setAttribute('data-click', a); w.document.body.appendChild(b); b.click(); b.remove(); };
  const bar = () => w.document.querySelector('#sincBar');
  ok(bar() && bar().hidden, 'con conexión y nada pendiente, el aviso no se ve');
  // pintar tras un cambio de estado
  const cambia = (x) => { est = Object.assign({}, est, x); if (escucha) escucha(); else w.dispatchEvent(new w.Event('offline')); };
  cambia({ sinRed: true }); await sleep(30);
  ok(!bar().hidden && /Sin conexión/.test(bar().textContent) && !/por subir/.test(bar().textContent), 'sin red: «Sin conexión»');
  cambia({ pendientes: 3, total: 3 }); await sleep(30); ok(/Sin conexión · 3 cambios por subir/.test(bar().textContent), 'sin red y con 3 cambios: lo dice');
  cambia({ sinRed: false, subiendo: true }); await sleep(30); ok(/Subiendo 3 cambios…/.test(bar().textContent), 'al volver la red: «Subiendo 3 cambios…»');
  cambia({ subiendo: false, pendientes: 0, total: 0 }); await sleep(30); ok(/Todo al día/.test(bar().textContent), 'al terminar: «Todo al día»');
  lista = [{ idOp: 'o1', col: 'movimientos', tipo: 'editar', id: 'm1', data: { descripcion: 'Pan', importe: 7 }, estado: 'revisar', motivo: 'borrado' }, { idOp: 'o2', col: 'tareas', tipo: 'crear', id: 't1', data: { titulo: 'Llamar' }, estado: 'fallo' }];
  cambia({ revisar: 1, fallos: 1, total: 2 }); await sleep(30); ok(/2 cambios no se han subir?do/.test(bar().textContent) || /2 cambios no se han subido/.test(bar().textContent), 'con fallos: «2 cambios no se han subido»');
  (bar().querySelector('button')).click(); await sleep(450);
  const hoja = () => w.document.querySelector('#sheetHost');
  ok(/Cambios sin subir/.test(hoja().textContent) && /Recuperarlo/.test(hoja().textContent) && /Reintentar/.test(hoja().textContent), 'tocar el aviso abre la hoja con «Recuperarlo» y «Reintentar»');
  const botones = () => [...hoja().querySelectorAll('button')];
  (botones().find((b) => b.textContent === 'Recuperarlo')).click(); await sleep(30); ok(llamadas.some((l) => l[0] === 'forzar' && l[1] === 'o1'), '«Recuperarlo» lo recupera');
  (botones().find((b) => b.textContent === 'Reintentar')).click(); await sleep(30); ok(llamadas.some((l) => l[0] === 'reintentar' && l[1] === 'o2'), '«Reintentar» lo reintenta');
  const desc = () => botones().filter((b) => b.textContent === 'Descartar')[1];
  (desc()).click(); await sleep(30); ok(!llamadas.some((l) => l[0] === 'descartar'), 'un toque en «Descartar» solo pide confirmar');
  (botones().find((b) => /Seguro/.test(b.textContent))).click(); await sleep(30); ok(llamadas.some((l) => l[0] === 'descartar'), 'el segundo toque descarta');
  // cerrar sesión con cambios pendientes
  hoja().querySelector('.actions .btn.ghost:last-child').click();
  await sleep(450);
  let salio = false; w.Auth.signOut = async () => { salio = true; };
  est = Object.assign({}, est, { total: 2 });
  w.Auth.signOut = async () => { salio = true; };
  pulsa('doLogout'); await sleep(450);
  ok(!salio && /Cambios sin subir/.test(hoja().textContent), 'con cambios sin subir no se puede cerrar sesión: sale la hoja');
  est = Object.assign({}, est, { total: 0, fallos: 0, revisar: 0 }); lista = [];
  pulsa('closeSheet'); await sleep(450);
  pulsa('doLogout'); await sleep(200);
  ok(salio && llamadas.some((l) => l[0] === 'olvidar'), 'sin nada pendiente cierra sesión y borra la copia del móvil');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

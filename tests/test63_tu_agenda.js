// Tú v2, Agenda v2 y botón + v2 (22/10/2026, docs/09-tu-ajustes.md y docs/10-agenda-mas.md). Datos inventados.
const { makeEnv, sleep, click } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const NUEVAS = { tu: 0, agenda: 0, crear: 0 };
const dago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const txt = (e) => e.doc.querySelector('#content').textContent.replace(/\s+/g, ' ');
const sh = (e) => { const s = e.doc.querySelector('#sheetHost') || e.doc.querySelector('.sheet'); return s ? s.textContent.replace(/\s+/g, ' ') : ''; };
const shDoc = (e, q) => e.doc.querySelector('#sheetHost ' + q) || e.doc.querySelector('.sheet ' + q);
(async () => {
  const movs = [
    { id: 'm1', tipo: 'Gasto', categoria: 'Comida', descripcion: 'Café', importe: 1.8, fecha: dago(1) },
    { id: 'm2', tipo: 'Gasto', categoria: 'Comida', descripcion: 'café', importe: 1.9, fecha: dago(3) },
    { id: 'm3', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Mercadona', importe: 42.5, fecha: dago(2) },
    { id: 'm4', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Mercadona', importe: 38, fecha: dago(9) },
    { id: 'm5', tipo: 'Gasto', categoria: 'Ocio', descripcion: 'Cine', importe: 9, fecha: dago(4) },
    { id: 'm6', tipo: 'Ingreso', categoria: 'Nómina', importe: 1500, fecha: dago(5) },
  ];
  const mesUTC = new Date().toISOString().slice(0, 7);
  let e = makeEnv({ version: NUEVAS, movs, cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Comida' }, { nombre: 'Supermercado' }, { nombre: 'Ocio' }], ticketsUso: { mes: mesUTC, usados: 52, limite: 60 } }, meta: { onboarded: true } }, pre: (w) => { w.SUPABASE_CONFIG = { url: 'https://ejemplo.test', anonKey: 'publica' }; w.Auth.getSession = async () => null; w.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) }); } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, S = A.S;

  /* ---------- Tú v2 ---------- */
  H.goTab(['tu']); await sleep(20);
  let t = txt(e);
  ok(e.doc.querySelector('.tu2-cab') && /Lucía/.test(e.doc.querySelector('.tu2-cab').textContent), 'Tú: cabecera con el nombre de la bienvenida (Lucía)');
  ok(/Tu dinero/.test(t) && /Traer y guardar/.test(t) && /La app/.test(t) && /Tu cuenta/.test(t), 'Tú: los 4 grupos nuevos');
  ok(!/Comparar con la versión anterior/.test(t) && e.doc.querySelector('.tu-mas').style.display === 'none', 'Tú: lo poco usado va plegado en «Más ajustes»');
  ok(!e.doc.querySelector('[data-click^="openMetas"]'), 'Tú: Metas ya no está (vive en Dinero)');
  ok(/Escríbenos/.test(t), 'Tú: «Escríbenos» sale (hay correo de contacto)');
  H.escrAbrir([]); await sleep(10);
  ok(/Enviar por correo/.test(sh(e)) && !/Enviar por WhatsApp/.test(sh(e)), 'Escríbenos: solo correo (sin WhatsApp)');
  let abierto = ''; try { Object.defineProperty(e.w, 'location', { value: { set href(v) { abierto = v; }, get href() { return ''; } }, configurable: true }); } catch (err) { /* jsdom */ }
  shDoc(e, '#escrTxt').value = 'Me encanta'; H.escrTipo(['gusta']); await sleep(5); shDoc(e, '#escrTxt') && (shDoc(e, '#escrTxt').value = 'Me encanta');
  const m = A.escrMensaje('gusta', 'Me encanta');
  ok(m.asunto === 'PalomApp · Me gusta' && /Me encanta/.test(m.cuerpo) && !/@/.test(m.cuerpo), 'Escríbenos: asunto y mensaje sin datos personales');
  H.closeSheet([]); await sleep(300);
  ok(e.doc.querySelector('.comparar-fab'), 'Tú: sale el botón «Antes»');
  // buscador encuentra lo plegado
  const bus = e.doc.querySelector('#tuBuscar'); bus.value = 'moneda'; H.tuFiltrar([], bus);
  ok(e.doc.querySelector('.tu-mas').style.display === '' && [...e.doc.querySelectorAll('.tu-mas .menu-item')].some((b) => b.style.display === '' && /Moneda/.test(b.textContent)), 'buscador: «moneda» encuentra Moneda dentro de «Más ajustes»');
  bus.value = ''; H.tuFiltrar([], bus);
  ok(e.doc.querySelector('.tu-mas').style.display === 'none', 'buscador vacío: «Más ajustes» vuelve a plegarse');
  H.tuMasToggle([]); await sleep(10);
  ok(e.doc.querySelector('.tu-mas').style.display === '' && /Botón «Antes» \(pruebas\)/.test(txt(e)), '«Más ajustes» se despliega con el botón «Antes» (pruebas)');
  // lecturas de tickets
  ok(A.ticketsUso().quedan === 8 && /quedan 8 de 60/.test(txt(e)), 'tickets: «quedan 8 de 60»');
  ok(e.doc.querySelector('.tk-uso.pocos'), 'tickets: con 10 o menos, en color de aviso');
  await A.guardarTicketsUso({ usados: 60, limite: 60 }); H.goTab(['tu']); await sleep(10);
  ok(A.ticketsUso().quedan === 0 && /vuelven el 1 de/.test(txt(e)), 'tickets: con 0, «vuelven el 1 de …»');
  ok(/Has usado las 60 lecturas de este mes\. Vuelven el 1 de/.test(A.errTicket('limite')), 'tickets: mensaje del límite con la fecha de vuelta');
  await A.guardarTicketsUso({ error: 'ia_error' });
  ok(A.cfg().ticketsUso.usados === 61 || A.cfg().ticketsUso.usados === 60, 'tickets: ia_error suma uno en el mismo mes');
  await A.guardarTicketsUso({ usados: 3, limite: 60 });
  // nombre
  H.tuNombreAbrir([]); await sleep(10);
  ok(/¿Cómo te llamas\?/.test(sh(e)), 'Editar: hoja «Tu nombre»');
  shDoc(e, '#tuNombreIn').value = '  Lu  ';
  await H.tuNombreGuardar([]); await sleep(20);
  ok(A.cfg().nombre === 'Lu' && e.store.cfg.app.nombre === 'Lu', 'Editar: guarda el nombre (sin espacios de más)');
  // cerrar sesión pide confirmación
  let salio = false; e.w.Auth.signOut = async () => { salio = true; };
  H.logoutPreguntar([]); await sleep(10);
  ok(/¿Cerrar sesión en este móvil\?/.test(sh(e)) && !salio, 'Cerrar sesión: primero pregunta');
  H.closeSheet([]); await sleep(300);
  // versión anterior
  H.compararCambiar(['tu']); await sleep(10);
  ok(!e.doc.querySelector('.tu2-cab') && e.doc.querySelector('.profile-tile'), '«Antes» en Tú: vuelve la pantalla de antes');
  H.compararCambiar(['tu']); await sleep(10);
  ok(e.doc.querySelector('.tu2-cab'), '«Antes» en Tú: y vuelta a la nueva');

  /* ---------- Agenda v2 ---------- */
  const hoy = A.todayISO(), man = A.uAdd(hoy, 1), ayer = A.uAdd(hoy, -2), lejos = A.uAdd(hoy, 20);
  S.tareas = [
    { id: 't1', nombre: 'Llamar al casero', estado: 'Pendiente', prioridad: 'Media', fechaLimite: hoy },
    { id: 't2', nombre: 'Renovar el DNI', estado: 'Pendiente', prioridad: 'Alta', fechaLimite: ayer },
    { id: 't3', nombre: 'Comprar bombillas', estado: 'Pendiente', prioridad: 'Media', fechaLimite: man },
    { id: 't4', nombre: 'Ordenar fotos', estado: 'Pendiente', prioridad: 'Baja', fechaLimite: null },
    { id: 't5', nombre: 'Revisión del coche', estado: 'Pendiente', prioridad: 'Media', fechaLimite: lejos },
    { id: 't6', nombre: 'Pagar comunidad', estado: 'Completado', prioridad: 'Media', fechaLimite: ayer, fechaFin: ayer },
  ];
  S.tareas.forEach((x) => { e.store.tareas[x.id] = Object.assign({}, x); });
  H.goTab(['inicio']); H.setInicioVista(['tareas']); await sleep(20);
  t = txt(e);
  ok(e.doc.querySelector('#agRapida') && /Apunta una tarea para hoy/.test(e.doc.querySelector('#agRapida').placeholder), 'Agenda: casilla rápida «Apunta una tarea para hoy…»');
  ok(/Tareas/.test(e.doc.querySelector('.inicio-seg').textContent) && !/Semana y tareas/.test(t), 'Agenda: selector «Tareas | Calendario»');
  const veces = (s) => (t.match(new RegExp(s, 'g')) || []).length;
  ok(veces('Llamar al casero') === 1 && veces('Comprar bombillas') === 1 && veces('Renovar el DNI') === 1, 'Agenda: cada tarea sale una sola vez');
  ok(/Vencidas · 1/.test(t) && /Próximos 7 días/.test(t) && /Sin fecha · 1/.test(t), 'Agenda: Vencidas, Próximos 7 días y Sin fecha');
  ok(/Más adelante · 1/.test(t) && /Hechas · 1/.test(t) && !/Revisión del coche/.test(t) && !/Pagar comunidad/.test(t), 'Agenda: «Más adelante» y «Hechas» plegados');
  ok(!/Todas tus tareas/.test(t), 'Agenda: ya no está la lista «Todas tus tareas»');
  H.agendaMas(['adelante']); await sleep(10);
  ok(/Revisión del coche/.test(txt(e)), 'Agenda: «Más adelante» se despliega');
  ok(e.doc.querySelector('.comparar-fab'), 'Agenda: sale el botón «Antes»');
  // casilla rápida en otro día
  H.agendaDia([man]); await sleep(10);
  ok(/Apunta una tarea para mañana/.test(e.doc.querySelector('#agRapida').placeholder), 'casilla rápida: el texto cambia con el día («para mañana»)');
  e.doc.querySelector('#agRapida').value = 'Recoger el paquete';
  await A.agRapidaCrear(); await sleep(20);
  const nueva = Object.values(e.store.tareas).find((x) => x.nombre === 'Recoger el paquete');
  ok(nueva && nueva.fechaLimite === man && nueva.estado === 'Pendiente' && nueva.prioridad === 'Media', 'casilla rápida: crea la tarea para el día elegido');
  ok(nueva && Object.keys(nueva).sort().join(',') === 'categoria,comentario,estado,fechaCreacion,fechaFin,fechaInicio,fechaLimite,nombre,prioridad,repetir', 'casilla rápida: solo los campos que ya tiene la tabla de tareas');
  ok(e.doc.querySelector('#agRapida').value === '', 'casilla rápida: se vacía para apuntar otra');
  e.doc.querySelector('#agRapida').value = '   ';
  const antes = Object.keys(e.store.tareas).length; await A.agRapidaCrear(); await sleep(10);
  ok(Object.keys(e.store.tareas).length === antes, 'casilla rápida: vacía no crea nada');
  // día despejado
  H.agendaDia([hoy]); await sleep(10);
  let ultimoToast = ''; const t0 = e.w.document.body; // el aviso se pinta en el DOM
  await A.toggleTarea('t1'); await sleep(20);
  ultimoToast = [...e.doc.querySelectorAll('.toast, #toast')].map((x) => x.textContent).join(' ');
  ok(/Día despejado/.test(ultimoToast), 'al completar la última tarea del día: «¡Día despejado!»');
  /* Calendario v2 */
  H.setInicioVista(['calendario']); await sleep(10);
  t = txt(e);
  ok(e.doc.querySelector('.cal2-grid') && !/Semanal/.test(t), 'Calendario: solo el mes (sin «Semanal»)');
  ok(e.doc.querySelectorAll('.cal2-ley-i').length === 4 && /Cobros y pagos/.test(t), 'Calendario: leyenda de 4 colores');
  const tareasOn = S.calFiltros.tareas; H.calToggle(['tareas']); await sleep(10);
  ok(S.calFiltros.tareas === !tareasOn && e.doc.querySelector('.cal2-ley-i[aria-pressed="' + !tareasOn + '"]'), 'Calendario: la leyenda filtra');
  H.calToggle(['tareas']); await sleep(10);
  ok(e.doc.querySelector('[data-click^="tareaEnDia"]'), 'Calendario: «+ Tarea» en el día elegido');
  /* Formulario v2 */
  H.tareaEnDia([man]); await sleep(20);
  ok(/¿Para cuándo\?/.test(sh(e)) && /Este finde/.test(sh(e)) && /Más opciones/.test(sh(e)), 'Formulario: «¿Para cuándo?», «Este finde» y «Más opciones»');
  ok(shDoc(e, '#tFecha').value === man, 'Formulario: desde el calendario, la fecha ya puesta');
  H.tFechaPick(['']); await sleep(5);
  ok(shDoc(e, '#tFecha').value === '' && /Sin fecha/.test(shDoc(e, '#tFechaChips .chip.active').textContent), 'Formulario: «Sin fecha» quita la fecha');
  shDoc(e, '#tNombre').value = 'Pedir cita dentista';
  await A.saveTarea(); await sleep(20);
  const ct = Object.values(e.store.tareas).find((x) => x.nombre === 'Pedir cita dentista');
  ok(ct && ct.fechaLimite === null && ct.prioridad === 'Media', 'Formulario: se guarda igual que antes');
  A.openTareaForm('t2'); await sleep(10);
  ok(shDoc(e, '.tf-mas').open && /En curso/.test(sh(e)) && /Hecha/.test(sh(e)), 'Editar: «Más opciones» abierto si la prioridad no es Media; estados «En curso» y «Hecha»');
  H.closeSheet([]); await sleep(300);

  /* ---------- Botón + v2 ---------- */
  A.openCrear(); await sleep(10);
  let s = sh(e);
  ok(e.doc.querySelectorAll('.crear-4 .crear-op').length >= 3 && /Tarea/.test(e.doc.querySelector('.crear-4').textContent), '+: los grandes (Gasto, Ingreso, Tarea…)');
  const reps = [...e.doc.querySelectorAll('[data-click^="crearRepetir"]')].map((b) => b.textContent);
  ok(reps.length === 2 && /Mercadona/.test(reps.join()) && /Café/.test(reps.join()) && !/Cine/.test(reps.join()), '+: «Repetir» con los gastos que se repiten (no el de una vez)');
  ok(/42,50/.test(reps.join()), '+: «Repetir» con el importe del último');
  ok(e.doc.querySelector('.crear-peq') && /Gasto fijo/.test(e.doc.querySelector('.crear-peq').textContent), '+: lo demás en pequeño');
  ok(/Ver la versión anterior/.test(s), '+: enlace «Ver la versión anterior»');
  H.crearVersion([1]); await sleep(10);
  ok(!e.doc.querySelector('.crear-4') && /Ver la versión nueva/.test(sh(e)), '+: la versión de antes, con vuelta a la nueva');
  H.crearVersion([0]); await sleep(10);
  // banda del ticket
  await A.guardarTicketsUso({ usados: 55, limite: 60 }); A.openCrear(); await sleep(10);
  if (A.ticketsDisponible()) ok(/Te quedan 5 lecturas este mes/.test(sh(e)), '+: banda del ticket con «Te quedan 5 lecturas»');
  else ok(A.crearTicketBandaHtml() === '', '+: sin lectura de tickets disponible, no sale la banda');
  H.closeSheet([]); await sleep(300);
  // usuario nuevo: sin botón «Antes»
  let e2 = makeEnv({ version: NUEVAS, cfg: { app: { compararVersiones: false }, meta: { onboarded: true } } }); await sleep(80);
  e2.w.__APP__.openCrear(); await sleep(10);
  ok(!/Ver la versión anterior/.test(sh(e2)) && !e2.doc.querySelector('[data-click^="crearRepetir"]'), 'usuario nuevo: sin «Ver la versión anterior» ni «Repetir» (no hay gastos)');

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

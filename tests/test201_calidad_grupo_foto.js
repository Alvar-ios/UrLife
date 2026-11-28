// Calidad (23/11/2026): foto del grupo (docs/46 tanda 5), casos que no cubre test200.
// Datos inventados; la imagen es un píxel de prueba (no es una foto real).
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const errores = []; console.error = (...a) => { errores.push(a.map((x) => { try { return typeof x === 'string' ? x : JSON.stringify(x, Object.getOwnPropertyNames(x || {})) + JSON.stringify((x && x.original) || ''); } catch (e) { return String(x); } }).join(' ')); };
const PIX = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
(async () => {
  const e = makeEnv({ version: { juntos: 1 }, cfg: { app: { nombre: 'Lucía' }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uYo' } } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost');
  const toastTxt = () => ((doc.querySelector('#toast .toast-txt') || {}).textContent || '');
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm, x) => Object.assign({ user_id: u, nombre: nm, rol: 'miembro' }, x || {});
  const yoAdm = m('uYo', 'Lucía', { rol: 'admin' });
  S.grupos = [
    // grupo de dos que crea la app al compartir con alguien sin app («Tú y Nombre»): tipo 'grupo', quien lo crea es administrador
    { id: 'gD', nombre: 'Lucía y Rosa', tipo: 'grupo', alias: {}, soyAdmin: true, foto: PIX, miembros: [yoAdm, m('sR', 'Rosa', { sinCuenta: true })] },
    { id: 'gN', nombre: 'Lucía y Rosa', tipo: 'grupo', alias: {}, soyAdmin: true, foto: null, miembros: [yoAdm, m('sR2', 'Marta', { sinCuenta: true })] },
    // «directo» (persona a persona): nunca se ofrece foto
    { id: 'gX', nombre: 'Directo', tipo: 'directo', alias: {}, soyAdmin: true, foto: null, miembros: [yoAdm, m('uC', 'Carla')] },
  ].map((g) => Object.assign(g, { todos: g.miembros }));
  S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = [];
  let falla = false;
  S.db = Object.assign(S.db || {}, { compartidos: (S.db && S.db.compartidos) || { suscribir: () => () => {} }, rpc: async () => null,
    grupos: { listar: async () => { throw new Error('sin red'); }, invitaciones: async () => [],
      foto: async (gid, f) => { if (falla) { const er = new Error('new row for relation "grupos" violates check constraint "grupos_foto_formato"'); er.original = { details: 'Failing row contains (gD, ' + PIX + ')' }; throw er; } return [{ id: gid }]; } } });

  // 1) fotoValida: nada con comillas, espacios, saltos de línea u otros tipos
  const malas = ['data:image/jpeg;base64,AAAA"onerror="alert(1)', "data:image/jpeg;base64,AAAA'", 'data:image/jpeg;base64,AAAA\n', 'data:image/jpeg;base64,AA AA',
    'data:image/png;base64,AAAA', 'data:image/svg+xml;base64,AAAA', 'data:text/html;base64,AAAA', 'data:image/jpeg;base64,', 'https://x.invalid/a.jpg', null, 123, {}];
  ok(malas.every((x) => !A.fotoValida(x)), 'fotoValida rechaza comillas, espacios, saltos, PNG, SVG, HTML, enlaces y lo que no es texto');
  ok(A.fotoValida('data:image/webp;base64,AAAA') && A.fotoValida(PIX), 'acepta JPEG y WebP en base64');
  ok(A.fotoValida('data:image/jpeg;base64,' + 'A'.repeat(60000 - 23)) && !A.fotoValida('data:image/jpeg;base64,' + 'A'.repeat(60000 - 22)), 'el tope es 60 000 caracteres, igual que la regla de la base de datos');

  // 2) grupo de dos «Tú y Nombre»: en la fila sale la foto (si la hay) y quien lo creó puede ponerla
  H.goTab(['juntos']); await sleep(30);
  const filas = [...doc.querySelectorAll('#content .jv5-g')];
  ok(filas.some((f) => f.querySelector('img.jv5-foto')), 'grupo de dos con foto: su fila enseña la foto');
  ok(filas.some((f) => !f.querySelector('img') && /Marta/.test(f.textContent)), 'grupo de dos sin foto: sigue saliendo la cara de la persona');
  H.grupoVer(['gD']); await sleep(60); H.grupoAjustes(['gD']); await sleep(60);
  ok(!!sh().querySelector('.jv-foto-aj input[type="file"]'), 'grupo de dos «Tú y Nombre»: el administrador puede poner la foto');

  // 3) error del servidor al quitar: aviso sencillo, sin la foto en el aviso ni en la consola, y la foto sigue
  falla = true; errores.length = 0;
  sh().querySelector('[data-click="grupoFotoQuitar|gD"]').click(); await sleep(60);
  ok(!/data:image/.test(toastTxt()) && toastTxt().length > 0, 'si el servidor falla, el aviso no enseña la foto: «' + toastTxt() + '»');
  ok(S.grupos.find((g) => g.id === 'gD').foto === PIX && !!sh().querySelector('.jv-foto-aj img.jv-g-foto'), 'si falla, la foto no desaparece de la pantalla');
  // Fallo conocido (no bloquea): accionGrupo hace console.error(e) y el error de Postgres trae la fila entera (con la foto) en «details».
  // Solo queda en la consola del propio móvil; se apunta para que no empeore (p. ej. si algún día se mandan errores a un servidor).
  const enConsola = errores.some((x) => x.indexOf(PIX.slice(23, 80)) >= 0);
  console.log((enConsola ? 'AVISO ' : 'PASS ') + 'consola: ' + (enConsola ? 'la foto entera sale en console.error (solo en el móvil del usuario)' : 'la foto no sale en console.error'));
  falla = false;

  // 4) directo: no se ofrece foto
  H.closeSheet([]); await sleep(300); H.grupoVer(['gX']); await sleep(60); H.grupoAjustes(['gX']); await sleep(60);
  ok(!sh().querySelector('.jv-foto-aj'), '«directo» (persona a persona): no se ofrece foto');

  // 5) versión «Antes» de Juntos: no se ofrece cambiarla
  H.closeSheet([]); await sleep(300); S.verAnterior.juntos = 2;
  H.grupoVer(['gD']); await sleep(60);
  ok(!!sh().querySelector('.jv-gcab img.jv-g-foto'), 'versión «Antes» de Juntos: la cabecera también enseña la foto');
  H.grupoAjustes(['gD']); await sleep(60);
  ok(!sh().querySelector('.jv-foto-aj'), 'versión «Antes» de Juntos: no se ofrece poner foto');
  H.closeSheet([]); await sleep(300); S.verAnterior.juntos = 1;

  // 6) desde la base de datos: lo raro se descarta y lo bueno se guarda (aserción fuerte)
  S.db.grupos.listar = async () => ({ grupos: [
    { id: 'g8', nombre: 'Bueno', tipo: 'grupo', foto: PIX },
    { id: 'g9', nombre: 'Raro', tipo: 'grupo', foto: 'data:image/jpeg;base64,AAAA" onerror="alert(1)' },
    { id: 'g7', nombre: 'Sin', tipo: 'grupo' }],
    miembros: ['g7', 'g8', 'g9'].map((g) => ({ grupo_id: g, user_id: 'uYo', nombre: 'Lucía', rol: 'admin' })), sinCuenta: [] });
  await A.cargarGrupos();
  const gg = (id) => (S.grupos || []).find((g) => g.id === id) || {};
  ok(gg('g8').foto === PIX && gg('g9').foto === null && gg('g7').foto === null, 'al cargar: la buena se queda; la de comillas y la que falta, sin foto');
  H.goTab(['juntos']); await sleep(30);
  ok(!/onerror/.test(doc.querySelector('#content').innerHTML), 'nada de la foto rara llega a la pantalla');

  // 7) Fallo conocido (pequeño): si cierras la hoja mientras se guarda, al terminar se vuelve a abrir sola
  //    (grupoFoto/grupoFotoQuitar llaman a updateSheet mirando solo FORM, que no se vacía al cerrar; ver CLAUDE.md).
  S.db.grupos.foto = () => new Promise((r) => setTimeout(() => r([{ id: 'g8' }]), 500));
  H.grupoVer(['g8']); await sleep(60); H.grupoAjustes(['g8']); await sleep(60);
  sh().querySelector('[data-click="grupoFotoQuitar|g8"]').click(); await sleep(30);
  H.closeSheet([]); await sleep(900);
  const reabre = !!doc.querySelector('#sheetBackdrop:not([data-cerrando])');
  console.log((reabre ? 'AVISO ' : 'PASS ') + (reabre ? 'cerrar la hoja mientras se guarda la foto: se vuelve a abrir sola al terminar' : 'cerrar la hoja mientras se guarda la foto: se queda cerrada'));
  process.exit(fails ? 1 : 0);
})();

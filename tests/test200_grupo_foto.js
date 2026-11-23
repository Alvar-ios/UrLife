// Tanda 5 de Juntos (docs/46): foto del grupo. Datos inventados; la imagen es un píxel de prueba.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const PIX = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
(async () => {
  const e = makeEnv({ version: { juntos: 0 }, cfg: { app: { nombre: 'Lucía' }, meta: { onboarded: true } }, session: { user: { email: 'a@a.com', id: 'uYo' } } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, S = A.S, doc = e.doc, sh = () => doc.querySelector('#sheetHost');
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm, x) => Object.assign({ user_id: u, nombre: nm, rol: 'miembro' }, x || {});
  const yo = m('uYo', 'Lucía', { rol: 'admin' }), llamadas = [];
  const grupos = () => [
    { id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, soyAdmin: true, foto: PIX, miembros: [yo, m('uA', 'Ana'), m('uB', 'Bea')] },
    { id: 'g2', nombre: 'Pádel', tipo: 'grupo', alias: {}, soyAdmin: false, foto: null, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana', { rol: 'admin' })] }].map((g) => Object.assign(g, { todos: g.miembros }));
  S.grupos = grupos(); S.compartidos = []; S.objetivos = []; S.aportes = []; S.carpetas = [];
  S.db = Object.assign(S.db || {}, { compartidos: (S.db && S.db.compartidos) || { suscribir: () => () => {} }, rpc: async () => null,
    grupos: { listar: async () => { throw new Error('sin red'); }, invitaciones: async () => [], foto: async (gid, f) => { llamadas.push([gid, f]); return [{ id: gid }]; } } });
  ok(A.fotoValida(PIX) && !A.fotoValida('data:image/svg+xml;base64,AAAA') && !A.fotoValida('x'.repeat(10)), 'solo valen fotos JPEG o WebP pequeñas');
  H.goTab(['juntos']); await sleep(30);
  ok(!!doc.querySelector('#content .jv5-g img.jv5-foto[src^="data:image/jpeg"]'), 'en Juntos, el grupo con foto la enseña en su fila');
  H.grupoVer(['g1']); await sleep(60);
  ok(!!sh().querySelector('.jv-gcab img.jv-g-foto'), 'en la cabecera del grupo sale la foto');
  H.grupoAjustes(['g1']); await sleep(60);
  ok(!!sh().querySelector('.jv-foto-aj input[type="file"][accept="image/*"]'), 'Ajustes (administrador): arriba, tocar la foto para cambiarla');
  ok(!!sh().querySelector('[data-click="grupoFotoQuitar|g1"]'), 'y «Quitar foto»');
  sh().querySelector('[data-click="grupoFotoQuitar|g1"]').click(); await sleep(60);
  ok(llamadas.length === 1 && llamadas[0][0] === 'g1' && llamadas[0][1] === null, '«Quitar foto» guarda la foto vacía');
  // un archivo que no es imagen
  const inp = sh().querySelector('.jv-foto-aj input[type="file"]');
  Object.defineProperty(inp, 'files', { value: [{ type: 'application/pdf', name: 'x.pdf' }], configurable: true });
  inp.dispatchEvent(new e.w.Event('change', { bubbles: true })); await sleep(30);
  ok(llamadas.length === 1 && /Elige una imagen/.test((doc.querySelector('#toast .toast-txt') || {}).textContent || ''), 'un archivo que no es imagen: «Elige una imagen» y no guarda nada');
  // no administrador: sin foto para cambiar
  H.closeSheet([]); await sleep(300); H.grupoVer(['g2']); await sleep(60); H.grupoAjustes(['g2']); await sleep(60);
  ok(!sh().querySelector('.jv-foto-aj'), 'quien no es administrador no puede cambiar la foto');

  // sin la función en el servidor (antes de la migración): no sale
  H.closeSheet([]); await sleep(300); delete S.db.grupos.foto; H.grupoVer(['g1']); await sleep(60); H.grupoAjustes(['g1']); await sleep(60);
  ok(!sh().querySelector('.jv-foto-aj'), 'si el servidor aún no tiene la foto, no se ofrece');
  // una foto rara de la base de datos no se pinta
  const r = await (async () => { S.db.grupos.listar = async () => ({ grupos: [{ id: 'g9', nombre: 'Raro', tipo: 'grupo', foto: 'javascript:alert(1)' }], miembros: [{ grupo_id: 'g9', user_id: 'uYo', nombre: 'Lucía', rol: 'admin' }], sinCuenta: [] }); await A.cargarGrupos(); return S.grupos.find((g) => g.id === 'g9'); })().catch(() => null);
  ok(!r || r.foto === null, 'una «foto» que no es una imagen válida se descarta');
  process.exit(fails ? 1 : 0);
})();

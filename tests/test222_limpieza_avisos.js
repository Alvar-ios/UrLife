// 28/11 · fase29/limpieza-avisos: limpieza de los avisos de revisar.js (títulos de segmentos cortos, importes que no se parten, «i» junto a su texto, script sin falsos positivos).
const fs = require('fs'), path = require('path');
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
(async () => {
  const raiz = path.join(__dirname, '..');
  const app = fs.readFileSync(path.join(raiz, 'app.js'), 'utf8'), css = fs.readFileSync(path.join(raiz, 'look.css'), 'utf8'), rev = fs.readFileSync(path.join(__dirname, 'capturas', 'revisar.js'), 'utf8');
  // otra moneda: tres opciones cortas que caben en una línea a 360 px
  ok(/\['bce', 'Del día'\]/.test(app) && /\['mano', 'Lo pongo yo'\]/.test(app) && /\['cobro', 'Me cobraron'\]/.test(app), 'Otra moneda: «Del día», «Lo pongo yo» y «Me cobraron»');
  ok(!/'Cambio del día'|'Poner el cambio'|'Lo que me cobraron'/.test(app), 'ya no quedan los títulos largos');
  const en = fs.readFileSync(path.join(raiz, 'i18n-en.js'), 'utf8');
  ok(/"Lo pongo yo":"Set by me"/.test(en) && /"Me cobraron":"I was charged"/.test(en) && /"Del día":"Today's"/.test(en), 'traducidos al inglés');
  // «i» junto a su texto en los ajustes de cuenta
  ok(/\.cuenta-ajuste b \{[^}]*display: flex/.test(css), 'Sumar en «En tus cuentas»: el texto y la «i» van en la misma fila');
  // el script ya no da falsos positivos (texto con line-clamp, tarjetas y tecla alta) y mira los botones tapados
  ok(/Math\.min\(r\.bottom, c\.bottom\)/.test(rev), 'revisar.js: recorta también por arriba y por abajo (line-clamp)');
  ok(/matches\('\.bv-card, \.tec-ok'\)/.test(rev) && /botón de la hoja tapado por otra capa/.test(rev), 'revisar.js: tarjetas y tecla alta exentas, y avisa de botones de hoja tapados');
  // «¿De dónde sale?»: el importe no se parte
  const hoy = new Date().toISOString().slice(0, 10);
  const e = makeEnv({ version: { juntos: 0 }, cfg: { app: {}, meta: { onboarded: true } } });
  await sleep(150);
  const A = e.w.__APP__, doc = e.doc, S = A.S;
  const yo = { user_id: 'uYo', nombre: 'Lucía', rol: 'admin' }, an = { user_id: 'uA', nombre: 'Ana', rol: 'miembro' };
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  S.grupos = [{ id: 'g1', nombre: 'Piso', tipo: 'grupo', alias: {}, soyAdmin: true, miembros: [yo, an], todos: [yo, an] }];
  S.compartidos = [{ id: 'k1', grupoId: 'g1', tipo: 'Gasto', categoria: 'Otros', descripcion: 'Compra', importe: 96, pagadoPor: 'uA', creadoPor: 'uA', reparto: { uYo: 32, uA: 64 }, modo: 'importe', fecha: hoy }];
  S.objetivos = []; S.aportes = []; S.carpetas = [];
  A.H.origenVer(['g1']); await sleep(80);
  const sub = [...doc.querySelectorAll('#sheetHost .og-x span')].map((x) => x.textContent).join(' | ');
  ok(/tu parte 32,00 €/.test(sub), '«¿De dónde sale?»: «32,00 €» lleva espacio duro (' + sub.slice(0, 80) + ')');
  console.log(fails ? '\n' + fails + ' FALLOS' : '\nTodo bien'); process.exit(fails ? 1 : 0);
})();

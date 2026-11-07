// 07/11/2026 · Calidad: revisión de la calculadora de trayecto (docs/31). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
const d = new Date(), iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
const mas = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return iso(x); };
(async () => {
  const e = makeEnv({ cfg: { app: { nombre: 'Lucía', categoriasGasto: [{ nombre: 'Transporte' }, { nombre: 'Otros' }], mesInicio: 1, otraCosa: { a: 1 } }, meta: { onboarded: true } }, version: { crear: 0 } });
  await sleep(80);
  const A = e.w.__APP__, H = A.H, doc = e.doc, S = A.S, sh = () => doc.querySelector('#sheetHost');
  const set = (id, v, h) => { const el = doc.querySelector(id); el.value = v; H[h]([], el); };
  // Usuario nuevo, sin grupos
  H.trAbrir([]); await sleep(20);
  ok(!!doc.querySelector('#trDe'), 'usuario nuevo: se abre en «De un sitio a otro»');
  // Miles y comas
  H.trModo(['km']); await sleep(5);
  set('#trKm', '1.234', 'trKm'); ok(A.trCalc().km === 1234, '«1.234» km = 1234');
  set('#trKm', '12,5', 'trKm'); ok(A.trCalc().km === 12.5, '«12,5» km = 12,5');
  set('#trKm', '0', 'trKm'); ok(A.trCalc() === null, '0 km no da resultado');
  set('#trKm', 'abc', 'trKm'); ok(A.trCalc() === null, 'texto raro no da resultado');
  // Foco: escribir no repinta la hoja
  set('#trKm', '100', 'trKm'); const km = doc.querySelector('#trKm'); km.focus();
  set('#trCons', '7', 'trCons'); set('#trPrecio', '1,8', 'trPrecioIn');
  ok(doc.querySelector('#trKm') === km, 'escribir en km, consumo o precio no repinta (no se pierde el foco)');
  ok(A.trCalc().coste === 12.6, '100 km × 7 l × 1,8 = 12,60 €');
  // Cambio de unidades
  H.trGrupo(['gas']); await sleep(5);
  ok(A.form().consumo === '' && A.form().precio === '', 'cambiar de grupo borra consumo y precio');
  H.trProd(['gnc']); await sleep(5);
  ok(/kg\/100 km/.test(sh().textContent) && A.trCalc().unidad === 'kg', 'GLP → GNC pasa a kg');
  H.trNivel(['poco']); await sleep(5);
  ok(A.form().consumo === '3,6' && Math.abs(A.trCalc().cant - 3.6) < 1e-9, '«Poco» en GNC = 3,6 kg (con coma)');
  H.trGrupo(['otros']); await sleep(5);
  ok(A.form().prod === 'h2' && !doc.querySelector('.tr-prods'), 'Otros: solo hidrógeno, sin fila de tipos');
  H.trGrupo(['gasolina']); H.trProd(['g95']); await sleep(5);
  // Recordar en cfg sin pisar
  H.trModo(['km']); await sleep(5); set('#trKm', '100', 'trKm');
  H.trApuntar([]); await sleep(20);
  const c = A.cfg();
  ok(c.trayecto && c.trayecto.prod === 'g95' && c.otraCosa && c.otraCosa.a === 1 && c.nombre === 'Lucía', 'recordar el coche no pisa el resto de la configuración');
  ok(/Gasolina/.test((doc.querySelector('#fDesc') || {}).value || sh().innerHTML), '«Apuntar gasto» lleva la descripción');
  H.closeSheet([]); await sleep(260);
  // Privacidad: la descripción no debe llevar calles
  H.trAbrir([]); await sleep(10);
  set('#trDe', 'Calle Falsa 123, Pueblo', 'trDe'); set('#trA', 'Avenida Inventada 7, Villa', 'trA');
  H.trModo(['km']); await sleep(5); set('#trKm', '30', 'trKm'); H.trModo(['sitios']); await sleep(5);
  H.trApuntar([]); await sleep(20);
  const dsc = A.form().descripcion || ((doc.querySelector('#fDesc') || {}).value) || '';
  ok(!/Falsa|Inventada|123/.test(dsc + sh().innerHTML.match(/value="[^"]*Gasolina[^"]*"/g)), 'la descripción del gasto no lleva la calle escrita');
  H.closeSheet([]); await sleep(260);
  // Compartir dentro de un viaje
  S.user = Object.assign({}, S.user, { id: 'uYo' });
  const m = (u, nm) => ({ user_id: u, nombre: nm, rol: 'miembro' });
  S.grupos = [{ id: 'g1', nombre: 'Viaje', tipo: 'grupo', alias: {}, miembros: [m('uYo', 'Lucía'), m('uA', 'Ana')], todos: [m('uYo', 'Lucía'), m('uA', 'Ana')] }];
  S.compartidos = []; S.objetivos = []; S.aportes = [];
  S.carpetas = [{ id: 't1', grupoId: 'g1', nombre: 'Roma', icono: 'plane', desde: mas(-2), hasta: mas(3), cerrada: null, createdAt: '2026-10-01T09:00:00Z' }];
  S.db = Object.assign(S.db || {}, { grupos: { listar: async () => { throw new Error('x'); }, invitaciones: async () => [] }, rpc: async () => [], compartidos: Object.assign({}, (S.db && S.db.compartidos) || {}, { crear: async (o) => o }), carpetas: { suscribir: () => () => {} } });
  H.trAbrir([]); await sleep(10); H.trModo(['km']); await sleep(5); set('#trKm', '100', 'trKm'); set('#trPrecio', '1,7', 'trPrecioIn');
  ok(/Compartir/.test(sh().textContent), 'con grupo sale «Compartir»');
  H.trCompartir([]); await sleep(30);
  const F = A.form();
  ok(F.kind === 'compRapido' && F.importe === '11,05' && /Gasolina/.test(F.desc) && F.cat === 'Transporte', 'Compartir rellena importe, descripción y categoría');
  ok(/¿Va en el viaje\?/.test(sh().textContent) && F.tema === 't1', 'Compartir pregunta por el viaje si cae en sus fechas');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

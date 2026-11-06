// Calidad 05/11/2026 · docs/30 tanda 4: casos límite de reglas con cuenta. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const DOS = [{ id: 'ca', nombre: 'Banco A', principal: true }, { id: 'cb', nombre: 'Banco B' }];
async function env(cuentas, reglas) {
  const e = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Supermercado' }], ingresos: ['Nómina'], ahorro: [], cuentas: JSON.parse(JSON.stringify(cuentas)), reglasCat: JSON.parse(JSON.stringify(reglas || [])) }, meta: { onboarded: true } },
    movs: [], url: 'https://x.test/', session: { user: { email: 't@t.com', id: 'yo' } } });
  await sleep(120); return e;
}
(async () => {
  const sh = (e) => e.doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
  const R = [{ texto: 'super', categoria: 'Supermercado', tipo: 'Gasto' }, { texto: 'super', categoria: 'Otros', tipo: 'Gasto', cuenta: 'cb' },
    { texto: 'ahorro', categoria: 'Traspaso', tipo: '', cuenta: 'ca', tras: 'cb' }, { texto: 'tienda', categoria: 'Ropa', tipo: '', cuenta: 'cz' }];
  let e = await env(DOS, R), A = e.w.__APP__, W = e.w;
  const rp = W.reglaPara || (A.reglaPara);
  // el formulario normal (sin cuenta) solo usa reglas de «cualquier cuenta»
  A.H.openMovForm && A.H.openMovForm(['Gasto']); await sleep(20);
  const d = e.doc.querySelector('#fDesc'), c = e.doc.querySelector('#fCategoria');
  if (d && c) {
    d.value = 'super ahorro tienda'; A.H.onDescInput([], d); await sleep(5);
    ok(c.value === 'Supermercado', 'formulario: gana la regla de cualquier cuenta, no la de Banco B ni el traspaso (cat=' + c.value + ')');
    c.value = ''; d.value = 'ahorro'; A.H.onDescInput([], d); await sleep(5);
    ok(c.value !== 'Traspaso', 'formulario: una regla de traspaso no pone la categoría «Traspaso» a un gasto');
    c.value = ''; d.value = 'tienda'; A.H.onDescInput([], d); await sleep(5);
    ok(c.value !== 'Ropa', 'formulario: una regla de una cuenta quitada no se aplica');
  } else ok(false, 'no se encontró el formulario de movimiento');
  A.H.closeSheet([]); await sleep(260);
  // hoja de reglas: la cuenta quitada se ve como «Cuenta quitada» y se puede borrar
  A.H.openReglas([]); await sleep(10);
  ok(/solo en Cuenta quitada/.test(sh(e)), 'la regla de una cuenta quitada se ve («solo en Cuenta quitada»)');
  const i = A.cfg().reglasCat.findIndex((r) => r.cuenta === 'cz');
  A.H.reglaQuitar([String(i)]); await sleep(10);
  ok(A.cfg().reglasCat.length === 3 && !A.cfg().reglasCat.some((r) => r.cuenta === 'cz'), 'borrar una regla quita solo esa');
  // guardar otra vez la misma regla de cualquier cuenta: no duplica ni pisa la de Banco B
  A.H.reglaCuenta(['']); A.H.reglaTipo(['Gasto']); await sleep(5); e.doc.querySelector('#rgTexto').value = 'super'; e.doc.querySelector('#rgCat').value = 'Comida'; A.H.reglaAnadir([]); await sleep(10);
  const sup = A.cfg().reglasCat.filter((r) => r.texto === 'super');
  ok(sup.length === 2 && sup.some((r) => r.cuenta === 'cb' && r.categoria === 'Otros') && sup.some((r) => !r.cuenta && r.categoria === 'Comida'), 'guardar «super» otra vez sustituye la de cualquier cuenta y deja la de Banco B');
  // cambiar «Solo en» no debería borrar la categoría ya escrita
  e.doc.querySelector('#rgTexto').value = 'pan'; e.doc.querySelector('#rgCat').value = 'Comida'; A.H.reglaCuenta(['ca']); await sleep(5);
  ok((e.doc.querySelector('#rgCat') || {}).value === 'Comida', 'al tocar «Solo en» se conserva la categoría escrita');
  A.H.closeSheet([]); await sleep(260);
  // la regla propuesta al importar debe coincidir con la propia descripción
  const desc = 'PAGO A CUENTA AHORRO 1234 DE MARIA';
  const norm = (x) => x.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const prop = A.impPropTras({ desc, otra: 'x' }); // la función de verdad de la app
  ok(norm(desc).indexOf(prop) >= 0, 'la regla «Recordar» propuesta («' + prop + '») vuelve a encajar con la misma fila');
  // una sola cuenta: reglas de cuenta ignoradas, hoja como antes
  e = await env([{ id: 'ca', nombre: 'Banco A' }], R); A = e.w.__APP__;
  A.H.openReglas([]); await sleep(10);
  ok(!/Solo en|Entonces es/.test(sh(e)), 'con una sola cuenta la hoja no enseña «Solo en» ni «Entonces es»');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

// Calidad · tarjetas bien dimensionadas (22/10/2026): fichas a 0 € en gris, «quedan …» en Deudas solo con
// más de una deuda, y que las reglas de maquetación nuevas siguen en look.css. Datos inventados.
const fs = require('fs'), path = require('path');
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const cuentas = [{ id: 'c1', nombre: 'Banco A', saldo: 500, ts: 1 }];
const deudaA = { nombre: 'Préstamo A', objetivo: 1000, previo: 200, cuotaMes: 50 };
const deudaB = { nombre: 'Préstamo B', objetivo: 600, previo: 100, cuotaMes: 40 };
async function dinero(app) {
  const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 0 }, movs: [], cfg: { app: Object.assign({ cuentas }, app), meta: { onboarded: true } } });
  await sleep(120); e.w.__APP__.H.goTab(['dinero']); await sleep(40);
  const c = e.doc.querySelector('#content');
  const ficha = (t) => [...c.querySelectorAll('.dm-ficha')].find((f) => f.textContent.indexOf(t) >= 0);
  const tit = c.querySelector('#dm-deudas');
  return { ficha, tit: tit ? tit.textContent : null };
}
(async () => {
  /* 1. sin inversiones ni deudas: las dos fichas a cero, en gris */
  let d = await dinero({});
  ok(d.ficha('Invertido') && d.ficha('Invertido').classList.contains('cero'), 'sin inversiones: «Invertido» lleva la clase «cero» (gris)');
  ok(d.ficha('Por pagar') && d.ficha('Por pagar').classList.contains('cero'), 'sin deudas: «Por pagar» lleva la clase «cero» (gris)');
  ok(d.ficha('En cuentas') && !d.ficha('En cuentas').classList.contains('cero'), '«En cuentas» no se pone en gris');
  ok(d.tit !== null && !/quedan/.test(d.tit), 'sin deudas: el título «Deudas» no dice «quedan»');

  /* 2. una deuda: «Por pagar» en color y sin «quedan» en el título (ya sale en la propia deuda) */
  d = await dinero({ deudas: [deudaA] });
  ok(d.ficha('Por pagar') && !d.ficha('Por pagar').classList.contains('cero') && /−/.test(d.ficha('Por pagar').textContent), 'una deuda: «Por pagar» en negativo y sin gris');
  ok(!/quedan/.test(d.tit), 'una deuda: el título no repite «quedan …»');

  /* 3. dos deudas: el título suma lo que queda de las dos */
  d = await dinero({ deudas: [deudaA, deudaB] });
  ok(/quedan\s*1\.300/.test(d.tit.replace(/ /g, ' ')), 'dos deudas: el título dice «quedan 1.300 €» (800 + 500)');

  /* 4. las reglas de maquetación siguen ahí (si alguien las borra, que se note) */
  const css = fs.readFileSync(path.join(__dirname, '..', 'look.css'), 'utf8');
  ok(/html\[data-look="nuevo"\] \.card\.menu \{ padding: 2px 16px; \}/.test(css), 'look.css: las listas de ajustes sin relleno doble');
  ok(/\.section-title > \.link:first-of-type \{ margin-left: auto; \}/.test(css), 'look.css: el primer enlace del título va a la derecha');
  ok(/\.kpi-mes \.kpi\.avail:nth-child\(odd\):last-child \{ grid-column: 1 \/ -1; \}/.test(css), 'look.css: «Te queda» sola en su fila ocupa todo el ancho');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();

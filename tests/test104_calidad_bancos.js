// Calidad 29/10 (docs/20): la sugerencia de banco no debe saltar con palabras comunes y cerrar a medias no deja cuentas vacías. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ version: { dinero: 0, tu: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], cuentas: [{ id: 'c1', nombre: 'X', saldo: 100, ts: 1, color: '#0F8A87', tipo: 'ahorro', fecha: '2026-10-01' }] }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, sh = () => e.doc.querySelector('#sheetHost');
  H.goTab(['tu']); H.openCuentas([]); await sleep(5);
  const sug = async (n) => { H.cuentaEditar([0]); await sleep(5); const inp = e.doc.querySelector('#fCuentaNombre'); inp.value = n; inp.dispatchEvent(new e.w.Event('change', { bubbles: true })); await sleep(5); return (sh().textContent.match(/¿Es de ([^?]+)\?/) || [])[1] || ''; };
  ok(await sug('Mi cuenta') === '', '«Mi cuenta» no sugiere ING');
  ok(await sug('Cuenta Revolut') === 'Revolut', '«Cuenta Revolut» sugiere Revolut');
  ok(await sug('Banco Sabadell') === 'Banco Sabadell', '«Banco Sabadell» no sugiere Santander');
  ok(await sug('La de la casa') === '', '«La de la casa» no sugiere CaixaBank');
  ok(await sug('Hucha') === '', 'un nombre sin banco no sugiere nada');
  // cambiar el banco no toca saldo, fecha, color ni tipo
  const antes = Object.assign({}, A.cfg().cuentas[0]);
  H.bancoAbrir([0]); await sleep(5); H.bancoElegir(['myinvestor']); await sleep(5);
  const d = A.cfg().cuentas[0];
  ok(d.banco === 'myinvestor' && ['id', 'nombre', 'saldo', 'fecha', 'color', 'tipo', 'ts'].every((k) => d[k] === antes[k]), 'elegir banco conserva saldo, fecha, color y tipo');
  // cerrar la hoja en «¿De qué banco es?» al añadir
  H.cuentasVolver([]); await sleep(5); H.cuentaAnadir([]); await sleep(5); H.closeSheet([]); await sleep(400);
  ok(A.cfg().cuentas.every((c) => c.nombre || c.saldo != null), 'cerrar en «¿De qué banco es?» no deja una cuenta vacía');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

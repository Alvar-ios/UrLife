// 25/10 (docs/20): elegir el banco de una cuenta; ficha con logo guardado en la app o color + letras. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ version: { dinero: 0, tu: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], cuentas: [{ id: 'c1', nombre: 'Nómina', banco: 'bbva', saldo: 100, ts: 1 }, { id: 'c2', nombre: 'Mi Revolut', saldo: 10, ts: 1 }, { id: 'c3', nombre: 'Rara', banco: 'banco-que-no-existe', saldo: 5, ts: 1 }] }, meta: { onboarded: true } } });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost');
  H.goTab(['tu']); H.openCuentas([]); await sleep(10);
  const filas = [...sh().querySelectorAll('.cuenta-fila')];
  ok(filas[0].querySelector('.bco-ficha') && /BBVA/.test(filas[0].querySelector('.bco-ficha').textContent), 'cuenta con banco: ficha con su color y letras');
  ok(!filas[1].querySelector('.bco-ficha') && filas[1].querySelector('.aj-ic'), 'cuenta sin banco: el icono de siempre');
  ok(!filas[2].querySelector('.bco-ficha') && filas[2].querySelector('.aj-ic'), 'una clave de banco desconocida no rompe nada');
  H.cuentaEditar([1]); await sleep(5);
  ok(/¿Es de Revolut\?/.test(sh().textContent), 'sugiere el banco por el nombre («Mi Revolut»)');
  H.bancoSugerir([1, 'revolut']); await sleep(10);
  ok(A.cfg().cuentas[1].banco === 'revolut' && A.cfg().cuentas[1].nombre === 'Mi Revolut' && sh().querySelector('.bco-ficha img[src="logos/revolut.svg"]'), 'aceptar la sugerencia guarda el banco (sin cambiar el nombre) y sale su logo');
  H.cuentasVolver([]); await sleep(5); H.cuentaAnadir([]); await sleep(10);
  ok(/¿De qué banco es\?/.test(sh().textContent) && sh().querySelectorAll('.bco-fila').length > 20, 'añadir cuenta: primero «¿De qué banco es?»');
  const q = sh().querySelector('#bcoQ'); q.value = 'caixa'; H.bancoBuscar([], q); await sleep(5);
  ok([...sh().querySelectorAll('.bco-fila')].map((b) => b.textContent.trim()).join() === 'CaixaBank', 'el buscador entiende «caixa»');
  H.bancoElegir(['traderepublic']); await sleep(10);
  const nueva = A.cfg().cuentas[3];
  ok(nueva && nueva.banco === 'traderepublic' && nueva.nombre === 'Trade Republic' && nueva.tipo === 'broker', 'al elegir un bróker se rellenan el nombre y el tipo');
  H.bancoAbrir([3]); await sleep(5); H.bancoElegir(['']); await sleep(10);
  ok(!A.cfg().cuentas[3].banco && A.cfg().cuentas[3].nombre === 'Trade Republic', '«Otro, o sin banco» quita el banco y deja el nombre');
  ok(A.bancoTinta('#9FE870') === '#14141A' && A.bancoTinta('#00278E') === '#FFFFFF', 'letras blancas o negras según el color');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

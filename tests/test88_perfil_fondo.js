// Tu perfil y Fondo (23/10/2026, docs/15 3.1). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ version: { tu: 0 }, cfg: { app: { nombre: 'Lucía Pérez', categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost'), cfg = () => e.store.cfg.app;
  H.goTab(['tu']); await sleep(20);
  H.tuNombreAbrir([]); await sleep(10);
  ok(/Tu perfil/.test(sh().textContent) && sh().querySelector('#perfilAv').textContent === 'LP', '«Editar» abre «Tu perfil» con las iniciales (LP)');
  ok(sh().querySelectorAll('.perfil-c').length === 6 && /de momento, solo tú/.test(sh().textContent), '6 colores y la nota de privacidad');
  const inp = sh().querySelector('#tuNombreIn'); inp.value = 'Ana'; inp.dispatchEvent(new e.w.Event('input', { bubbles: true })); await sleep(5);
  ok(sh().querySelector('#perfilAv').textContent === 'A', 'al escribir el nombre cambian las iniciales');
  H.perfilModo(['dibujo']); await sleep(5);
  ok(sh().querySelectorAll('.perfil-d').length === 12 && sh().querySelector('#tuNombreIn').value === 'Ana', '«Un dibujo»: 12 dibujos y el nombre escrito se queda');
  H.perfilIcono(['ball']); H.perfilColor(['#13795A']); await sleep(5);
  await H.tuNombreGuardar([]); await sleep(30);
  ok(cfg().nombre === 'Ana' && cfg().perfil && cfg().perfil.avatar === 'dibujo' && cfg().perfil.icono === 'ball' && cfg().perfil.color === '#13795A', 'se guarda nombre, dibujo y color');
  const av = doc.querySelector('#tbAvatar');
  ok(av && av.querySelector('svg.i') && /19, 121, 90|#13795A/i.test(av.style.background), 'la barra de arriba enseña el dibujo con su color');
  ok(doc.querySelector('.tu2-av svg.i'), 'y la cabecera de Tú también');
  // Fondo
  H.openAspecto([]); await sleep(10);
  ok(sh().querySelectorAll('.asp-fondo').length === 3 && sh().querySelector('.asp-tema'), 'Aspecto: Tema y tres fondos');
  H.setFondo(['tinte']); await sleep(10);
  ok(doc.documentElement.getAttribute('data-fondo') === 'tinte' && sh().querySelector('.asp-fondo.f-tinte.on'), '«Con tu color» se aplica al momento');
  H.setFondo(['raro']); await sleep(5);
  ok(doc.documentElement.getAttribute('data-fondo') === 'tinte', 'un fondo que no existe no cambia nada');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

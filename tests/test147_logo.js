// 11/11/2026 · Logo de PalomApp (opción 7DA) dentro de la app: pestaña del navegador, entrada, menú lateral y bienvenida.
const fs = require('fs'), path = require('path');
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const RAIZ = path.join(__dirname, '..');
(async () => {
  ['marca/icono.svg', 'marca/icono-32.png', 'marca/icono-180.png'].forEach((f) => ok(fs.existsSync(path.join(RAIZ, f)), 'existe ' + f));
  ['index.html', 'privacidad.html', 'borrar-cuenta.html'].forEach((f) => { const s = fs.readFileSync(path.join(RAIZ, f), 'utf8');
    ok(s.includes('rel="icon" href="marca/icono.svg"') && s.includes('rel="apple-touch-icon" href="marca/icono-180.png"'), f + ' lleva el icono en la pestaña'); });
  ok(/cpSync\(path\.join\(raiz, 'marca'\)/.test(fs.readFileSync(path.join(RAIZ, 'movil/scripts/copiar-web.js'), 'utf8')), 'la app de Android se lleva la carpeta marca');
  // menú lateral (en pantalla ancha) y bienvenida nueva
  let e = makeEnv({ cfg: { app: { compararVersiones: false }, meta: { onboarded: true } }, movs: [], version: { tu: 1, agenda: 0, crear: 0 } });
  await e.w.__APP__.main(); await sleep(150);
  const rail = e.doc.querySelector('.rail .brand svg.marca-ico');
  ok(!!rail && rail.getAttribute('aria-hidden') === 'true' && /PalomApp/.test(e.doc.querySelector('.rail .brand').textContent), 'el menú lateral lleva el logo (alas y moneda, decorativo; el nombre sigue en texto)');
  e = makeEnv({ cfg: { app: { compararVersiones: false } }, movs: [] });
  await e.w.__APP__.main(); await sleep(150);
  ok(!!e.doc.querySelector('svg.marca-ob'), 'la bienvenida muestra el logo encima de «¡Hola!»');
  // pantalla de entrada
  e.w.__APP__.H.doMfaCancel([]); await sleep(80);
  ok(!!e.doc.querySelector('#loginEmail') && !!e.doc.querySelector('svg.marca-login'), 'la pantalla de entrada muestra el logo');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

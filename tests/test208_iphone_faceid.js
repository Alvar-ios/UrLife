// 25/11/2026 · iPhone: el bloqueo se llama «Face ID» (no «huella»); en Android sigue «huella»; la página de soporte existe y enlaza lo necesario.
console.error = () => {};
const fs = require('fs'), path = require('path');
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  for (const [nombre, nat, esperado, noEsperado, toastOn] of [['iPhone', { ios: true, huella: true, probarHuella: async () => {} }, 'Pedir Face ID al abrir', 'huella', /Se pedirá Face ID al abrir/], ['Android', { android: true, huella: true, probarHuella: async () => {} }, 'Pedir huella al abrir', 'Face ID', /Se pedirá la huella al abrir/]]) {
    const e = makeEnv({ url: 'https://palomapp.test/', version: { tu: 1, agenda: 0, crear: 1 }, pre: (w) => { w.__nativo = Object.assign({ notif: { permiso: async () => 'granted', pedir: async () => 'granted', programar: async () => 0, ahora: async () => 0 } }, nat); },
      cfg: { app: {}, meta: { onboarded: true } } });
    await sleep(200);
    const H = e.w.__APP__.H; H.goTab(['tu']); await sleep(40);
    const t = () => e.doc.querySelector('#content').textContent;
    ok(t().indexOf(esperado) >= 0 && (nombre === 'Android' ? true : !/Pedir huella/.test(t())), nombre + ': en Tú sale «' + esperado + '»');
    await H.huellaCambiar([]); await sleep(30);
    ok(toastOn.test(e.doc.querySelector('#toast').textContent), nombre + ': al activarlo el aviso usa la palabra correcta');
    e.w.close();
  }
  const s = fs.readFileSync(path.join(__dirname, '..', 'soporte.html'), 'utf8');
  ok(/mailto:cortex\.studio\.mkt@gmail\.com/.test(s) && /borrar-cuenta\.html/.test(s) && /privacidad\.html/.test(s) && /data-version="en"/.test(s), 'soporte.html: correo de contacto, enlaces a borrar cuenta y privacidad, y versión en inglés');
  console.log(fails ? '\n' + fails + ' FALLOS' : '\nTODO BIEN'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.error(x); process.exit(1); });

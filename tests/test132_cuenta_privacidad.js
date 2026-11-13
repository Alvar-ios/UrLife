// 08/11/2026 · Google Play: «Privacidad» y «Borrar mi cuenta» en Tú; pulido móvil (docs/32). Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } }, version: { tu: 1 } });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost').textContent.replace(/\s+/g, ' ');
  H.goTab(['tu']); await sleep(20);
  const c = doc.querySelector('#content').textContent;
  ok(/Privacidad/.test(c) && /Borrar mi cuenta/.test(c), 'Tú → Tu cuenta tiene «Privacidad» y «Borrar mi cuenta»');
  H.borrarCuentaAbrir([]); await sleep(10);
  ok(/¿Borrar tu cuenta y tus datos\?/.test(sh()) && /No se puede deshacer/.test(sh()) && /seguirás saliendo como «baja»/.test(sh()), 'la hoja explica qué se borra y que no se puede deshacer');
  doc.querySelector('#bcConf').value = 'borra'; await H.borrarCuentaOk([]); await sleep(10);
  ok(/Escribe BORRAR para confirmar/.test(sh()), 'sin escribir BORRAR no se borra nada');
  // nombre único y pulido
  ok(!/Mis Finanzas/.test(doc.body.innerHTML), 'la app se llama PalomApp en todas partes (salvo el registro, que no se toca)');
  H.goTab(['inicio']); await sleep(20);
  const sub = doc.querySelector('#pageSub');
  ok(sub && !sub.hidden && /^[a-záéíóúñ]+, \d+ [a-z]{3}$/.test(sub.textContent), 'Inicio: fecha corta arriba (' + (sub && sub.textContent) + ')');
  H.goTab(['movimientos']); await sleep(20);
  ok(doc.querySelector('#pageSub').hidden, 'en el resto de pantallas no hay fecha arriba');
  ok(/Aquí verás en qué se va tu dinero/.test(doc.querySelector('#content').textContent), 'Movimientos sin datos: estado vacío con «Apuntar un gasto» e «Importar extracto»');
  H.goTab(['inicio']); await sleep(20);
  H.ocultarCifras([]); await sleep(20);
  ok(doc.documentElement.classList.contains('cifras-ocultas') && doc.querySelector('.ojo-btn[aria-pressed="true"]'), '«Ocultar cifras» tapa las cifras y se puede volver a mostrar');
  H.ocultarCifras([]); await sleep(20);
  ok(!doc.documentElement.classList.contains('cifras-ocultas'), '«Mostrar cifras» las vuelve a enseñar');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})();

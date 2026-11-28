// 26/11/2026 · «i» de más información (rama fase24/info-icono): el texto de ayuda se esconde y se despliega al tocarla.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = makeEnv({ version: { tu: 0, agenda: 0, crear: 1 }, cfg: { app: { nombre: 'Prueba', cuentas: [{ id: 'c1', nombre: 'Principal', tipo: 'corriente', saldo: 100, principal: true }, { id: 'c2', nombre: 'Ahorro', tipo: 'ahorro', saldo: 50 }] }, meta: { onboarded: true } } });
  await sleep(250);
  const { w, doc } = e, A = w.__APP__, H = A.H, $ = (s) => doc.querySelector(s), $$ = (s) => Array.from(doc.querySelectorAll(s));

  // Tú → Mis herramientas: la ayuda sale escondida detrás de una «i»
  H.goTab(['tu']); await sleep(20); H.tuIr(['herramientas']); await sleep(40);
  const bs = $$('.info-i');
  ok(bs.length >= 1, 'Mis herramientas: hay al menos una «i»');
  const b = bs[0], t = doc.getElementById(b.getAttribute('aria-controls'));
  ok(b.tagName === 'BUTTON' && !!b.getAttribute('aria-label') && b.getAttribute('aria-expanded') === 'false', 'la «i» es un botón con nombre y cerrada');
  ok(b.classList.contains('con-etiq') && b.getAttribute('aria-label') === b.textContent.trim(), 'con etiqueta: el nombre accesible es la etiqueta visible');
  ok(t && t.hasAttribute('hidden') && /no se borra nada/.test(t.textContent), 'el texto está en la pantalla pero escondido');
  ok(!$('.rec-hint.herr-intro'), 'ya no hay texto de ayuda suelto arriba');

  // Abrir y cerrar sin repintar ni tocar FORM
  const marca = $('#pageTitle'), formAntes = A.form();
  b.click(); await sleep(20);
  ok(!t.hasAttribute('hidden') && b.getAttribute('aria-expanded') === 'true' && b.classList.contains('abierta'), 'tocar la «i» despliega el texto');
  ok($('#pageTitle') === marca && A.form() === formAntes, 'abrir la «i» no repinta la pantalla ni cambia FORM');
  b.click(); await sleep(20);
  ok(t.hasAttribute('hidden') && b.getAttribute('aria-expanded') === 'false' && !b.classList.contains('abierta'), 'tocarla otra vez lo esconde');

  // Dos «i» de la misma pantalla son independientes
  const abre = (n) => { const bb = $$('.info-i')[n]; bb.click(); return doc.getElementById(bb.getAttribute('aria-controls')); };
  H.tuIr(['']); await sleep(30); H.tuIr(['perfil']); await sleep(40);
  const hay = $$('.info-i').length;
  if (hay >= 2) {
    const t0 = abre(0), t1 = doc.getElementById($$('.info-i')[1].getAttribute('aria-controls'));
    ok(!t0.hasAttribute('hidden') && t1.hasAttribute('hidden'), 'abrir una «i» no abre las otras');
    abre(0);
  } else ok(true, 'Perfil: solo hay una «i» (nada que comparar)');

  // Un campo con algo escrito conserva el texto al abrir la «i»
  const campo = $('#sheetHost input[type=text], .tuv2 input[type=text], main input[type=text]');
  if (campo) { campo.value = 'Escrito a mano'; $$('.info-i')[0].click(); await sleep(20); ok(campo.value === 'Escrito a mano', 'lo escrito en un campo no se pierde al abrir la «i»'); }

  // Dos «i» en la misma hoja (editar cuenta: «Sumar» y «Cuenta principal») son independientes
  H.goTab(['inicio']); await sleep(30); H.cuentaEditar(['1']); await sleep(80);
  const dos = $$('#sheetHost .info-i');
  if (dos.length >= 2) {
    const idT = (x) => doc.getElementById(x.getAttribute('aria-controls'));
    dos[0].click(); await sleep(20);
    ok(!idT(dos[0]).hasAttribute('hidden') && idT(dos[1]).hasAttribute('hidden'), 'dos «i» de la misma hoja: abrir una no abre la otra');
    dos[1].click(); await sleep(20);
    ok(!idT(dos[0]).hasAttribute('hidden') && !idT(dos[1]).hasAttribute('hidden'), 'dos «i» de la misma hoja: pueden estar abiertas a la vez');
    const nom = $('#sheetHost input[type=text]'); if (nom) { nom.value = 'Mi cuenta'; dos[0].click(); await sleep(20); ok($('#sheetHost input[type=text]') === nom && nom.value === 'Mi cuenta', 'lo escrito en el nombre no se pierde al tocar la «i»'); }
  } else ok(false, 'editar cuenta tiene dos «i»: ' + dos.length);
  H.closeSheet([]); await sleep(260);

  // El atrás no la nota: no hay hoja que cerrar por la «i»
  H.tuIr(['herramientas']); await sleep(40); $$('.info-i')[0].click(); await sleep(20);
  ok(!$('#sheetBackdrop'), 'abrir la «i» no abre ninguna hoja');

  // En una hoja: «Reparto» de un movimiento de ahorro compartido es difícil de montar; basta la hoja «Tu Así vas»
  H.goTab(['inicio']); await sleep(30);
  H.asiVasAbrir(['0']); await sleep(60);
  const bi = $('#sheetHost .info-i');
  if (bi) { const tt = doc.getElementById(bi.getAttribute('aria-controls')); const f0 = A.form(); bi.click(); await sleep(20);
    ok(!tt.hasAttribute('hidden') && A.form() === f0 && !!$('#sheetBackdrop'), 'en una hoja, la «i» despliega sin cerrar ni repintar la hoja'); }
  else ok(false, '«Tu Así vas» tiene su «i»');

  // Ninguna «i» queda suelta: o lleva etiqueta propia, o está dentro de un título/etiqueta con texto al lado; y nunca hay dos seguidas
  const suelta = (bb) => { if (bb.classList.contains('con-etiq')) return !bb.textContent.trim(); const d = bb.closest('label,h2,b'); if (!d) return true; return ![...d.childNodes].filter((n) => n !== bb && !(n.nodeType === 1 && n.classList.contains('info-txt'))).map((n) => n.textContent).join('').trim(); };
  const pantallas = [() => { H.goTab(['tu']); H.tuIr(['herramientas']); }, () => { H.tuIr(['']); H.tuIr(['perfil']); }, () => { H.goTab(['inicio']); H.cuentaEditar(['1']); }, () => { H.closeSheet([]); H.goTab(['dinero']); H.metaNueva([]); }, () => { H.closeSheet([]); H.goTab(['inicio']); H.asiVasAbrir(['0']); }];
  let total = 0, sueltas = 0, seguidas = 0;
  for (const ir of pantallas) { try { ir(); } catch (x) {} await sleep(90); const todas = $$('.info-i'); total += todas.length; todas.forEach((bb) => { if (suelta(bb)) sueltas++; const sig = bb.nextElementSibling && bb.nextElementSibling.nextElementSibling; if (sig && sig.classList && sig.classList.contains('info-fila')) seguidas++; }); }
  ok(total >= 4, 'se revisaron «i» de varias pantallas (' + total + ')');
  ok(sueltas === 0, 'ninguna «i» queda suelta, sin título ni etiqueta (' + sueltas + ' sueltas)');
  ok(seguidas === 0, 'no hay dos «i» seguidas');
  H.closeSheet([]); await sleep(260);
  console.log(fails ? 'FALLOS: ' + fails : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

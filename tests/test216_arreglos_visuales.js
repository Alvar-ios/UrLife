// 28/11/2026 · tanda 1 de la revisión de interfaz (rama fase25/arreglos-visuales): aire bajo la tarjeta grande de Inicio,
// scroll horizontal solo horizontal y halo centrado. jsdom no calcula diseño: aquí se comprueban las reglas; las medidas reales
// las hace tests/capturas/arreglos_visuales.js (Chromium).
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const css = fs.readFileSync(path.join(__dirname, '..', 'look.css'), 'utf8');
const bloque = css.slice(css.indexOf('Tanda 1 (28/11)'));
ok(/\.hero2 \+ :is\([^)]*\.av-card[^)]*\)\s*\{\s*margin-top:\s*16px/.test(bloque), 'hay aire de 16 px entre la tarjeta grande y la de avisos');
for (const c of ['.pill-row', '.prox-scroll', '.crear-rep-f', '.amigos-fila', '.cr-con', '.tema-chips', '.hist-chips']) ok(bloque.includes(c), 'scroll horizontal acotado: ' + c);
ok(/overflow-y:\s*hidden;\s*overscroll-behavior-x:\s*contain/.test(bloque), 'sin scroll vertical dentro y sin arrastrar la hoja');
ok(/\.kpi\.avail\s*\{\s*box-shadow:\s*var\(--glow-c\)/.test(bloque) && /--glow-c:\s*0 0 /.test(css), '«Te queda»: halo centrado (sin desplazamiento vertical)');
ok(/--glow-c:[^;]*--pd-glow/.test(css), 'el halo centrado también existe en oscuro');
process.exit(fails ? 1 : 0);

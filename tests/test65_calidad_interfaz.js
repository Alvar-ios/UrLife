// 22/10 · Calidad · auditoría de interfaz (docs/salud/2026-10-22-interfaz.md)
// OJO: esta prueba FALLA A PROPÓSITO hasta que Desarrollo arregle lo que señala el informe.
// Comprueba lo que se puede medir sin navegador real:
//   A) contraste (WCAG AA, 4,5:1) de los colores de look.css en claro y oscuro, en las 5 paletas;
//   B) que la inicial blanca de los avatares se lea sobre los colores de persona;
//   C) que cada campo de los formularios tenga su etiqueta unida (para lectores de pantalla).
console.error = () => {};
const fs = require('fs'), path = require('path');
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

// ---------- utilidades de color ----------
const hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
const rgba = (s) => { const p = s.match(/rgba\(([^)]+)\)/)[1].split(',').map(parseFloat); return { c: p.slice(0, 3), a: p[3] }; };
const sobre = (t, fondo) => t.c.map((v, i) => v * t.a + fondo[i] * (1 - t.a));
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// ---------- lee las variables de look.css ----------
const css = fs.readFileSync(path.join(__dirname, '..', 'look.css'), 'utf8');
function bloque(selector) { const i = css.indexOf(selector + ' {'); if (i < 0) return {}; const t = css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i)); const v = {}; t.replace(/--([\w-]+)\s*:\s*([^;]+);/g, (_, k, val) => { v[k] = val.trim(); }); return v; }
const claro = bloque('html[data-look="nuevo"]');
const oscuro = Object.assign({}, claro, bloque('html[data-look="nuevo"][data-theme="dark"]'));
const paletas = {};
['cobalto', 'turquesa', 'frambuesa', 'esmeralda'].forEach((p) => { paletas[p] = bloque('html[data-look="nuevo"][data-paleta="' + p + '"]'); });
paletas.violeta = bloque('html[data-look="nuevo"], html[data-look="nuevo"][data-paleta="violeta"]');

(async () => {
  // A) contraste de los colores base
  ok(Object.keys(claro).length > 10 && Object.keys(oscuro).length > 10 && paletas.violeta.pl, 'se leen las variables de look.css');
  for (const [tema, V] of [['claro', claro], ['oscuro', oscuro]]) {
    const papel = hex(V.paper), tarjeta = hex(V['paper-raised']), hundido = hex(V['paper-sunken']);
    for (const t of ['text-muted', 'text-faint']) for (const [n, f] of [['papel', papel], ['tarjeta', tarjeta], ['fondo hundido', hundido]]) {
      const r = ratio(hex(V[t]), f); ok(r >= 4.5, tema + ': --' + t + ' sobre ' + n + ' = ' + r.toFixed(2));
    }
    for (const s of ['income', 'expense', 'bill', 'savings', 'debt', 'warn']) {
      const r = ratio(hex(V[s]), hundido); ok(r >= 4.5, tema + ': --' + s + ' sobre fondo hundido (fichas de Dinero) = ' + r.toFixed(2));
      if (V[s + '-soft']) { const f = sobre(rgba(V[s + '-soft']), tarjeta); const r2 = ratio(hex(V[s]), f); ok(r2 >= 4.5, tema + ': --' + s + ' sobre su fondo suave (chips «↑ 10 %») = ' + r2.toFixed(2)); }
    }
    for (const [p, P] of Object.entries(paletas)) {
      const acento = hex(tema === 'claro' ? P.pl : P.pd), suave = rgba(tema === 'claro' ? P['pl-soft'] : P['pd-soft']);
      const tinta = hex(tema === 'claro' ? claro['accent-ink'] : oscuro['accent-ink']);
      const r1 = ratio(acento, papel); ok(r1 >= 4.5, tema + ' · ' + p + ': acento sobre papel = ' + r1.toFixed(2));
      const r2 = ratio(acento, hundido); ok(r2 >= 4.5, tema + ' · ' + p + ': acento sobre fondo hundido = ' + r2.toFixed(2));
      const r3 = ratio(acento, sobre(suave, papel)); ok(r3 >= 4.5, tema + ' · ' + p + ': acento sobre acento suave (chip elegido) = ' + r3.toFixed(2));
      const r4 = ratio(tinta, acento); ok(r4 >= 4.5, tema + ' · ' + p + ': letra de botón sobre acento = ' + r4.toFixed(2));
    }
  }

  // B) avatares: inicial en blanco sobre el color de cada persona (Tú, Juntos, barra de arriba)
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const m = app.match(/COLORES_PERSONA_NUEVO\s*=\s*\[([^\]]+)\]/);
  ok(!!m, 'se encuentran los colores de persona');
  if (m) m[1].match(/#[0-9A-Fa-f]{6}/g).forEach((c) => { const r = ratio([255, 255, 255], hex(c)); ok(r >= 4.5, 'blanco sobre color de persona ' + c + ' = ' + r.toFixed(2)); });

  // C) etiquetas de los campos del formulario de gasto (+ → Gasto)
  const e = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Comida' }], ingresos: ['Nómina'], compararVersiones: false }, meta: { onboarded: true } }, movs: [], version: { crear: 0 } });
  await sleep(150);
  e.w.__APP__.H.crearIr(['gasto']); await sleep(150);
  const hoja = e.doc.querySelector('.sheet');
  ok(!!hoja && !!hoja.querySelector('#fImporte'), 'se abre el formulario de gasto');
  const campos = hoja ? [...hoja.querySelectorAll('input:not([type=hidden]), select, textarea')] : [];
  const sinEtiqueta = campos.filter((c) => !((c.id && hoja.querySelector('label[for="' + c.id + '"]')) || c.closest('label') || c.getAttribute('aria-label') || c.getAttribute('aria-labelledby')));
  ok(sinEtiqueta.length === 0, 'todos los campos del gasto tienen etiqueta unida (faltan: ' + sinEtiqueta.map((c) => '#' + (c.id || c.tagName)).join(', ') + ')');

  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH', x); process.exit(1); });

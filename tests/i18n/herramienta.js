// Herramienta del diccionario de inglés (no es una prueba; no va en npm test).
//   node tests/i18n/herramienta.js candidatos recogido.txt literales.txt   → textos de la app que hay que traducir (con '#')
//   node tests/i18n/herramienta.js construir                            → genera i18n-en.js desde en.tsv y reglas.js
//   node tests/i18n/herramienta.js faltan recogido.txt                  → lo recogido que sigue sin traducción y parece español
// recogido.txt sale de correr las pruebas con I18N_RECOGER=/ruta/recogido.txt; literales.txt de literales.py.
const fs = require('fs'), path = require('path'), { JSDOM } = require('jsdom');
const RAIZ = path.join(__dirname, '..', '..');
function cargar(conDic) {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { runScripts: 'outside-only' });
  const w = dom.window; w.__I18N_FORZAR = 'en';
  w.eval(fs.readFileSync(path.join(RAIZ, 'i18n.js'), 'utf8'));
  if (conDic) w.eval(fs.readFileSync(path.join(RAIZ, 'i18n-en.js'), 'utf8'));
  return w.I18N;
}
const ES = /[áéíóúñ¿¡ÁÉÍÓÚÑ]|\b(de|el|la|los|las|tu|tus|que|en|con|para|por|sin|hoy|mes|año|gasto|gastos|cuenta|aquí|más|una|un|del|al|se|y|o|no|es|lo|ya|te|mi|sus|su|hay|ver|toca|quitar|poner|cambiar|apuntar|guardar|cerrar|elige|cuentas|grupo|meta|metas|tareas|ingresos|todo|nada|otra|otro|cada|semana|días|día)\b/i;
const pareceEspanol = (k) => ES.test(k);
const cmd = process.argv[2];
if (cmd === 'candidatos') {
  const I = cargar(false);
  const rec = fs.readFileSync(process.argv[3], 'utf8').split('\n').filter((l) => l.includes('\t')).map((l) => l.split('\t')[1]);
  const lit = fs.readFileSync(process.argv[4], 'utf8').split('\n');
  const todo = lit.join('\u0001'), out = new Map();
  const esApp = (k) => { const tr = k.split('#').map((t) => t.trim()).filter((t) => /[A-Za-zÁÉÍÓÚáéíóúñÑ]{2}/.test(t)); return tr.length && tr.every((t) => todo.includes(t)); };
  rec.forEach((s) => { const k = I.claveDe(s); if (/[a-záéíóúñ]{2}/i.test(k) && esApp(k)) out.set(k, 1); });
  new Set(lit.map((x) => x.trim())).forEach((p) => {
    if (!/[a-záéíóúñ]/.test(p) || p.length < 2) return;
    if (/^[\w.\-#:/=,()[\]$>+*%!?|&;]*$/.test(p) && !/^[A-ZÁÉÍÓÚ][a-záéíóúñ]+$/.test(p)) return; // identificadores, clases
    if (/[{};=]|=>|\bfunction\b|px\b|var\(|rgba?\(|#[0-9a-f]{3,6}\b|\bclass\b|^\s*\.|data-|aria-|stroke|viewBox/.test(p)) return;
    const k = I.claveDe(p);
    if (!pareceEspanol(k) && !/^[A-ZÁÉÍÓÚ][a-záéíóúñ]+$/.test(k)) return;
    if (!out.has(k)) out.set(k, 2);
  });
  [...out.keys()].sort().forEach((k) => console.log(k));
} else if (cmd === 'construir') {
  const tsv = fs.readdirSync(__dirname).filter((f) => /^en.*\.tsv$/.test(f)).sort();
  const ex = {}; let n = 0, dup = 0;
  tsv.forEach((f) => fs.readFileSync(path.join(__dirname, f), 'utf8').split('\n').forEach((l, i) => {
    if (!l.trim() || l.startsWith('//')) return;
    const p = l.split('\t'); if (p.length < 2) { console.error('sin tabulador: ' + f + ':' + (i + 1) + ' ' + l); return; }
    const es = p[0].replace(/\s+/g, ' ').trim(), en = p.slice(1).join('\t').trim();
    if (!es || !en || es === en) return;
    if (ex[es] && ex[es] !== en) dup++;
    ex[es] = en; n++;
  }));
  const reglas = fs.readFileSync(path.join(__dirname, 'reglas.js'), 'utf8');
  const js = '/* PalomApp · diccionario español → inglés (C1 de docs/40). GENERADO por tests/i18n/herramienta.js construir\n' +
    '   desde tests/i18n/en*.tsv y tests/i18n/reglas.js: no se edita a mano. \'#\' = número, importe, fecha o mes. */\n' +
    '(function () {\nvar I = window.I18N; if (!I) return;\nI.en = { exactos: ' + JSON.stringify(ex) + ',\nreglas: ' + reglas.trim().replace(/;$/, '') + ' };\nI.dicListo();\n})();\n';
  fs.writeFileSync(path.join(RAIZ, 'i18n-en.js'), js);
  console.log('i18n-en.js: ' + Object.keys(ex).length + ' frases' + (dup ? ' (' + dup + ' repetidas con otra traducción: vale la última)' : '') + ', ' + Math.round(js.length / 1024) + ' KB');
} else if (cmd === 'faltan') {
  const I = cargar(true);
  const rec = fs.readFileSync(process.argv[3], 'utf8').split('\n').filter((l) => l.includes('\t')).map((l) => l.split('\t')[1]);
  const vistos = new Set();
  rec.forEach((s) => { const t = I.tr(s); if (pareceEspanol(t)) { const k = I.claveDe(t); if (!vistos.has(k)) { vistos.add(k); console.log(k); } } });
} else console.log('Uso: candidatos | construir | faltan (ver cabecera)');

// 15/11/2026 · Página «bienvenido.html» (enlace del perfil): probadores de Android + entrada a la web para iPhone / quien no quiera ser probador.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const RAIZ = path.join(__dirname, '..'), F = path.join(RAIZ, 'bienvenido.html');
const ENLACES = {
  grupo: 'https://groups.google.com/g/palomapp-testers',
  probador: 'https://play.google.com/apps/testing/es.palomapp.finanzas',
  tienda: 'https://play.google.com/store/apps/details?id=es.palomapp.finanzas',
  web: 'https://www.palomapp.es/',
};
(async () => {
  const src = fs.readFileSync(F, 'utf8');
  const doc0 = () => new JSDOM(src).window.document;
  const abrir = (q) => new JSDOM(src, { url: 'https://www.palomapp.es/bienvenido.html' + (q || ''), runScripts: 'dangerously', pretendToBeVisual: true });
  // sin ?lang el navegador de pruebas (en-US) pide inglés
  let d = abrir('?lang=es'), doc = d.window.document;
  const es = doc.querySelector('[data-version="es"]'), en = doc.querySelector('[data-version="en"]');
  ok(!es.hidden && en.hidden && doc.documentElement.lang === 'es' && doc.title === 'Prueba PalomApp', 'con ?lang=es se ve el español');
  for (const v of [es, en]) {
    const hrefs = [...v.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    ['grupo', 'probador', 'tienda', 'web'].forEach((k) => ok(hrefs.includes(ENLACES[k]), v.dataset.version + ': enlace «' + k + '» exacto'));
    ok(hrefs.includes('mailto:cortex.studio.mkt@gmail.com'), v.dataset.version + ': correo para comentarios');
    const pasos = [...v.querySelectorAll('.pasos a')].map((a) => a.getAttribute('href'));
    ok(pasos[0] === ENLACES.grupo && pasos[1] === ENLACES.probador && pasos[2] === ENLACES.tienda, v.dataset.version + ': los tres pasos van en orden (grupo → probador → tienda)');
    const ext = [...v.querySelectorAll('a[href^="http"]')];
    ok(ext.filter((a) => a.getAttribute('href') !== ENLACES.web).every((a) => a.target === '_blank' && /noopener/.test(a.rel)), v.dataset.version + ': los enlaces a Google abren aparte y con noopener');
  }
  d.window.close();
  d = abrir('?lang=en'); doc = d.window.document;
  ok(doc.querySelector('[data-version="es"]').hidden && !doc.querySelector('[data-version="en"]').hidden && doc.documentElement.lang === 'en' && doc.title === 'Try PalomApp', 'con ?lang=en se ve el inglés');
  doc.querySelector('.idioma button[data-l="es"]').click();
  ok(!doc.querySelector('[data-version="es"]').hidden && doc.querySelector('[data-version="en"]').hidden && doc.querySelector('.idioma button[data-l="es"]').getAttribute('aria-pressed') === 'true', 'el botón «Español» cambia de idioma');
  d.window.close();
  // Sin ?lang manda el idioma del navegador: español para es-*, inglés para el resto
  for (const [lang, esp] of [['es-ES', true], ['es', true], ['en-US', false], ['fr-FR', false]]) {
    const dd = new JSDOM(src, { url: 'https://www.palomapp.es/bienvenido.html', runScripts: 'dangerously', beforeParse: (w) => Object.defineProperty(w.navigator, 'language', { value: lang, configurable: true }) });
    ok(dd.window.document.querySelector('[data-version="es"]').hidden === !esp, 'navegador «' + lang + '» → ' + (esp ? 'español' : 'inglés')); dd.window.close();
  }
  // Frases que dependen del código: no prometer lo que la prueba cerrada de Google no trae todavía
  ok(/avisos del banco/.test(src) && /bank notifications/.test(src), 'dice que los avisos del banco y los widgets son cosa de Android (el dueño confirma que funcionan en la versión pública)');
  ok(doc0().querySelectorAll('.cab .ico svg').length === 4 && doc0().querySelectorAll('svg.ico-p').length === 2, 'lleva los iconos de Android, Apple y Google Play (en los dos idiomas)');
  ok(doc0().querySelectorAll('svg[aria-hidden="true"]').length >= 7 && !/<img[^>]+src="https?:/i.test(src), 'los iconos van dentro de la página, ocultos a lectores de pantalla y sin cargar nada de fuera');
  ok(!/gratis|free|sin l[ií]mites|unlimited/i.test(src), 'no promete «gratis» ni «sin límites»');
  // Privacidad: ni rastreadores ni nada de fuera de la página
  ok(!/<script[^>]+src=/i.test(src), 'no carga ningún script de fuera');
  ok(!/google-analytics|gtag|googletagmanager|fbq\(|pixel|fbclid|utm_/i.test(src), 'sin analítica, píxeles ni parámetros de seguimiento');
  ok(!/<iframe|<form/i.test(src), 'sin iframes ni formularios');
  // Solo es web: no debe viajar dentro de la app de Android
  const copiar = fs.readFileSync(path.join(RAIZ, 'movil/scripts/copiar-web.js'), 'utf8');
  ok(!/bienvenido\.html/.test(copiar), 'bienvenido.html no se copia a la app de Android');
  // Letras y favicon que ya existen en el repositorio
  ['fonts/fonts.css', 'marca/icono.svg', 'marca/icono-32.png', 'marca/icono-180.png', 'marca/icono-512.png', 'privacidad.html'].forEach((f) => ok(fs.existsSync(path.join(RAIZ, f)), 'existe ' + f));
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

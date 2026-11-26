// 26/11/2026 · Calidad (revisión de docs/51, sesión 1): la app habla en «yo» (decisión del dueño del 26/11).
// 1) Busca en los textos de app.js formas en «nosotros» que la app diga de sí misma («te avisamos», «lo convertiremos»…).
//    Excepciones acordadas: «Escríbenos» y «lo hacemos nosotros» (el equipo, borrado de cuenta), los mensajes que el usuario
//    manda por WhatsApp («con todo lo que llevamos»), las preguntas «tú y yo» («¿Empezamos…?», «¿Saltamos…?», «¿Cómo la
//    llamamos?») y NOVEDADES (historia, no se reescribe).
// 2) Recupera la comprobación que test177 dejó de hacer: al apagar una herramienta con datos, el aviso dice que no se borran.
// Datos inventados. Los fallos ya vistos van como «fallo conocido» (no rompen npm test): quítalos de la lista al arreglarlos.
const fs = require('fs'), path = require('path');
const T = require('./toques_comun.js');
const { abrir, tocar, aviso, ir, ok, paso, fin, sleep } = T;
T.fallosConocidos([]); // 26/11: arreglados (te lo recuerdo, lo convertiré)

paso('Textos de app.js en «nosotros»');
const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const sinNovedades = src.replace(/const NOVEDADES = \[[\s\S]*?\n\];/, ''); // la historia de parches no se reescribe
const lits = sinNovedades.match(/'(?:[^'\\\n]|\\.)*'/g) || [];
const MALO = /\b(te avisamos|avisamos|te avisaremos|hemos|tenemos|podemos|guardamos|enviamos|te diremos|diremos|pediremos|te pediremos|nuestr[oa]s?|recordamos|te lo recordamos|convertiremos|lo convertimos|colocamos|ajustamos|sumamos|restamos|contamos|ponemos|pondremos|dejaremos|subiremos|comparamos|recomendamos|conectamos|esperamos|dejamos)\b/i;
const PERMITIDO = /Escríbenos|lo hacemos nosotros|lo que llevamos|los gastos que llevamos|^'¿/;
const malos = [...new Set(lits.filter((l) => MALO.test(l) && !PERMITIDO.test(l) && !/[\\[\]()|]{3,}/.test(l)))]; // fuera expresiones regulares
const tiene = (re) => malos.some((l) => re.test(l));
ok(!tiene(/Te lo recordamos en Inicio/), 'Nuevo plan (Agenda): «Te lo recordamos en Inicio al abrir la app» debería ser «Te lo recuerdo…»', 'VOZ_TE_LO_RECORDAMOS');
ok(!tiene(/Lo convertiremos en un traspaso/), 'Importar, fila «¿es el gasto de…?»: «Lo convertiremos en un traspaso» debería ser «Lo convertiré…»', 'VOZ_LO_CONVERTIREMOS');
const otros = malos.filter((l) => !/Te lo recordamos en Inicio|Lo convertiremos en un traspaso/.test(l));
otros.forEach((l) => console.log('   · ' + l.slice(0, 120)));
ok(!otros.length, 'ningún otro texto de la app en «nosotros» (' + otros.length + ')');

(async () => {
  paso('Mis herramientas: apagar una con datos avisa de que no se borra nada');
  const e = await abrir({
    version: { tu: 0 },
    cfg: { app: { nombre: 'Prueba', compararVersiones: false, ahorro: [{ id: 'h1', nombre: 'Viaje inventado', objetivo: 900, yaAhorrado: 100 }] }, meta: { onboarded: true } },
  });
  await ir(e, 'tu');
  await tocar(e, 'tuIr', 'herramientas', 'app', 80);
  ok(/no se borra nada/.test((e.doc.querySelector('#content') || {}).textContent || ''), 'arriba se explica una vez que no se borra nada');
  await tocar(e, 'herrCambiar', 'metas', 'app', 60);
  ok(/Tus datos se quedan guardados/.test(aviso(e)), 'al apagar «Metas» (con una meta inventada): «Apagada. Tus datos se quedan guardados»');
  ok((e.A.cfg().ahorro || []).some((m) => m.id === 'h1'), 'la meta sigue guardada');
  await tocar(e, 'herrCambiar', 'metas', 'app', 60);
  ok(/encendida/.test(aviso(e)), 'y al encenderla otra vez: «encendida»');
  fin('test212');
})();

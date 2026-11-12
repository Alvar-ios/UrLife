// 12/11/2026 · Calidad (revisión 1.1.0): con la app en inglés, lo que se GUARDA tiene que seguir en español.
// La capa de inglés traduce el texto de las <option>. Si una <option> no lleva value="…", el navegador usa su texto
// como valor: el tipo, la categoría o el método de pago se guardarían en inglés («Expense», «Card»…).
// Y los textos del usuario (descripciones, nombres de cuentas) no se traducen aunque casen con el diccionario.
// Solo datos inventados.
const T = require('./toques_comun.js');
const { abrir, ok, paso, fin, sleep } = T;
// P2 de la revisión del 12/11: un texto del usuario que casa ENTERO con el diccionario se enseña traducido (no se guarda así)
T.fallosConocidos(['I18N_USUARIO']);
const YO = 'u-yo';
const ESP = ['Gasto', 'Ingreso', 'Factura', 'Ahorro', 'Inversión', 'Deuda', 'Supermercado', 'Transporte', 'Otros', 'Nómina',
  'Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Transferencia', 'Bizum', 'Otro', 'Casa', 'Comida', 'Ocio'];
const fixture = () => ({ idioma: 'en', espera: 400,
  cfg: { app: { nombre: 'Prueba', compararVersiones: false, categoriasGasto: [{ nombre: 'Supermercado' }, { nombre: 'Transporte' }, { nombre: 'Comida' }, { nombre: 'Otros' }], ingresos: ['Nómina'],
    cuentas: [{ id: 'c1', nombre: 'Casa', saldo: 1000, fecha: T.diasAtras(30), principal: true }, { id: 'c2', nombre: 'Ocio', saldo: 50, fecha: T.diasAtras(30) }] }, meta: { onboarded: true } },
  movs: [{ id: 'm1', tipo: 'Gasto', categoria: 'Supermercado', descripcion: 'Comida', importe: 12.5, fecha: T.diasAtras(2), cuentaId: 'c1', metodoPago: 'Tarjeta débito' }] });
// valores de las <option> sin value que han dejado de ser el texto en español
function optsMal(e, raiz) {
  return [...(raiz || e.doc).querySelectorAll('select option')].map((o) => o.value).filter((v) => ESP.indexOf(v) < 0 && /^(Expense|Income|Bill|Savings|Investment|Debt|Groceries|Transport|Others?|Salary|Cash|Card|Debit card|Credit card|Transfer|Home|Food|Leisure)\b/i.test(v));
}
(async () => {
  const e = await abrir(fixture());
  const A = e.A, S = e.S, H = A.H;
  ok(e.w.I18N.lang === 'en', 'la app está en inglés');

  paso('Editar un gasto en inglés');
  H.openMovForm(['m1']); await sleep(120);
  const met = e.doc.querySelector('#fMetodo');
  ok(!!met, 'hay selector de método de pago');
  const mal1 = optsMal(e, e.doc.querySelector('#sheetHost'));
  ok(!mal1.length, 'las opciones del formulario valen lo mismo que en español' + (mal1.length ? ' · salen: ' + mal1.join(', ') : ''), 'I18N_OPTION');
  ok(!met || met.value === 'Tarjeta débito', 'el método de pago elegido se lee en español («' + (met && met.value) + '»)', 'I18N_OPTION');

  paso('Importar: el selector de tipo');
  const tiposHtml = ['Gasto', 'Ingreso'].map((t) => '<option>' + t + '</option>').join('');
  const host = e.doc.createElement('div'); host.innerHTML = '<select id="selPrueba">' + tiposHtml + '</select>'; e.doc.body.appendChild(host); await sleep(30);
  ok(e.doc.querySelector('#selPrueba').value === 'Gasto' || e.doc.querySelector('#selPrueba').value === 'Expense', 'control: la capa mira los <select> nuevos');
  const capaTraduceOption = e.doc.querySelector('#selPrueba').value === 'Expense';
  ok(!capaTraduceOption, 'una <option> sin value no cambia de valor al traducirse («' + e.doc.querySelector('#selPrueba').value + '»)', 'I18N_OPTION');

  paso('Lo que escribe el usuario no se traduce');
  S.tab = 'movimientos'; S.movVista = 'lista'; A.render(); await sleep(120);
  const txt = (e.doc.querySelector('#content') || e.doc.body).textContent;
  ok(/Comida/.test(txt), 'la descripción «Comida» del usuario sigue en español en la Lista', 'I18N_USUARIO');
  S.tab = 'dinero'; A.render(); await sleep(120);
  const txt2 = (e.doc.querySelector('#content') || e.doc.body).textContent;
  ok(/Casa/.test(txt2) && /Ocio/.test(txt2), 'los nombres de cuenta «Casa» y «Ocio» siguen tal cual en Dinero', 'I18N_USUARIO');

  paso('Guardar en inglés deja los datos en español');
  H.openMovForm(['m1']); await sleep(120);
  if (H.saveMov) { try { await H.saveMov([]); } catch (x) { /* */ } } else { const b = [...e.doc.querySelectorAll('#sheetHost [data-click]')].find((x) => /^saveMov/.test(x.getAttribute('data-click'))); if (b) b.click(); }
  await sleep(300);
  const m = S.movimientos.find((x) => x.id === 'm1') || {};
  ok(ESP.indexOf(m.tipo) >= 0 && m.categoria === 'Supermercado', 'tipo y categoría se guardan en español (' + m.tipo + ' / ' + m.categoria + ')');
  ok(m.metodoPago === 'Tarjeta débito', 'el método de pago se guarda en español («' + m.metodoPago + '»)', 'I18N_OPTION');
  fin('test166_idioma_datos');
})();

// Calidad (23/10/2026): perfil, fondo, iconos, reglas nuevas de los recurrentes y festivos (docs/15, apartado 3).
// Mira sobre todo que con los festivos apagados las reglas de siempre den las mismas fechas, que la tabla del BOE
// esté bien en unas cuantas fechas, que no se pierda lo escrito al ir a «Festivos» y que cada icono tenga un solo
// significado donde se pidió. Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
console.error = () => {};
// Los dibujos de ICONS, leídos del propio app.js, para comprobar qué icono sale en cada sitio
const SRC = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const ICONOS = {}; SRC.replace(/^ {2}(\w+): '(<svg[^']*)',?$/gm, (_, k, v) => { ICONOS[k] = v; });
ICONOS.trendUp = ICONOS.piggy; // ICONS.trendUp = ICONS.piggy

(async () => {
  // ---------- 1. Reglas de siempre: mismas fechas con los festivos apagados ----------
  const e = makeEnv({ version: { tu: 0, crear: 0, dinero: 0 }, cfg: { app: { nombre: 'Ana Ruiz', categoriasGasto: [{ nombre: 'Otros' }], cuentas: [{ id: 'c1', nombre: 'Banco A', saldo: 100, ts: 1 }, { id: 'c2', nombre: 'Banco B', saldo: 50, ts: 1 }],
    ingresos: ['Nómina'], cobros: [{ nombre: 'Nómina', importe: 1500, regla: { t: 'ultHabil' } }] }, meta: { onboarded: true } }, movs: [] });
  await sleep(150);
  const A = e.w.__APP__, H = A.H, doc = e.doc, sh = () => doc.querySelector('#sheetHost');
  const oc = (r, a, b) => A.ocurrencias(r, a, b).join();
  const fest = (fz) => { A.S.config = Object.assign({}, A.S.config, { festivos: fz }); };
  const viejas = [];
  for (let d = 1; d <= 31; d++) ['', 'antes', 'despues'].forEach((aj) => viejas.push({ t: 'dia', dia: d, ajuste: aj }));
  viejas.push({ t: 'ultHabil' }, { t: 'priHabil' }, { t: 'quincenal', ajuste: '' }, { t: 'quincenal', ajuste: 'antes' });
  [1, 2, 3, 4, -1].forEach((n) => { for (let w = 0; w < 7; w++) viejas.push({ t: 'nesimo', n, dow: w }); });
  [1, 2, 4].forEach((c) => viejas.push({ t: 'semanas', cada: c, ancla: '2026-10-23' }));
  [1, 3, 6, 12].forEach((c) => viejas.push({ t: 'meses', cada: c, ancla: '2026-01-31', ajuste: 'despues' }));
  fest(undefined); const sin = viejas.map((r) => oc(r, '2025-01-01', '2028-12-31'));
  fest({ on: false, zona: 'MD', locales: { 2026: ['2026-10-29'] } }); const apagado = viejas.map((r) => oc(r, '2025-01-01', '2028-12-31'));
  fest({ on: true, zona: 'XX' }); const zonaMala = viejas.map((r) => oc(r, '2025-01-01', '2028-12-31'));
  fest(undefined);
  ok(sin.every((x, i) => x === apagado[i]), 'festivos apagados (aunque haya zona y fiestas locales guardadas): las ' + viejas.length + ' reglas de siempre dan las mismas fechas de 2025 a 2028');
  ok(sin.every((x, i) => x === zonaMala[i]), 'festivos «encendidos» con una zona que no existe: se comportan como apagados');
  // valores sacados de main (antes del cambio) para que no se muevan
  ok(oc({ t: 'ultHabil' }, '2026-02-01', '2026-02-28') === '2026-02-27' && oc({ t: 'priHabil' }, '2026-11-01', '2026-11-30') === '2026-11-02', 'último hábil feb 2026 = 27 y primer hábil nov 2026 = 2 (como en main)');
  ok(oc({ t: 'dia', dia: 31 }, '2027-02-01', '2027-02-28') === '2027-02-28' && oc({ t: 'dia', dia: 15, ajuste: 'antes' }, '2026-11-01', '2026-11-30') === '2026-11-13', 'día 31 en febrero = 28; el 15 de nov 2026 (domingo) «antes» = viernes 13');
  ok(oc({ t: 'quincenal', ajuste: '' }, '2028-02-01', '2028-02-29') === '2028-02-15,2028-02-29' && oc({ t: 'meses', cada: 3, ancla: '2026-01-31', ajuste: '' }, '2026-01-01', '2026-12-31') === '2026-01-31,2026-04-30,2026-07-31,2026-10-31', 'quincenal en febrero bisiesto y trimestral desde un día 31 (como en main)');
  // Tu mes con festivos apagados
  A.S.config = Object.assign({}, A.S.config, { mesInicio: { modo: 'cobro', dia: 28 } });
  const mesSin = []; for (let t = Date.UTC(2026, 0, 1); t <= Date.UTC(2027, 11, 31); t += 864e5) mesSin.push(A.mesDe(new Date(t).toISOString().slice(0, 10)));
  fest({ on: false, zona: 'CT' }); const mesApag = []; for (let t = Date.UTC(2026, 0, 1); t <= Date.UTC(2027, 11, 31); t += 864e5) mesApag.push(A.mesDe(new Date(t).toISOString().slice(0, 10)));
  ok(mesSin.join() === mesApag.join() && JSON.stringify(A.rangoMes(2026, 11)) === JSON.stringify((fest(undefined), A.rangoMes(2026, 11))), '«Tu mes» (desde el día 28) no cambia con los festivos apagados');
  A.S.config = Object.assign({}, A.S.config, { mesInicio: undefined });

  // ---------- 2. Reglas nuevas ----------
  let malN = 0;
  for (let y = 2025; y <= 2028; y++) for (let m = 1; m <= 12; m++) for (let w = 0; w < 7; w++) {
    const ym = y + '-' + String(m).padStart(2, '0'), fin = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    const ult = A.ocurrencias({ t: 'nesimo', n: -1, dow: w }, ym + '-01', fin)[0], pen = A.ocurrencias({ t: 'nesimo', n: -2, dow: w }, ym + '-01', fin);
    const esperado = new Date(Date.parse(ult + 'T00:00:00Z') - 7 * 864e5).toISOString().slice(0, 10);
    if (pen.length !== 1 || pen[0] !== esperado) malN++;
  }
  ok(malN === 0, 'penúltimo día de la semana (n = −2): siempre una semana antes del último, en el mismo mes (2025–2028, los 7 días)');
  ok(oc({ t: 'diasMes', dias: [30, 31], ajuste: '' }, '2027-02-01', '2027-02-28') === '2027-02-28', '«Dos días al mes» con el 30 y el 31 en febrero: una sola fecha (el 28), sin duplicar');
  ok(oc({ t: 'diasMes', dias: [15, 31], ajuste: '' }, '2028-02-01', '2028-02-29') === '2028-02-15,2028-02-29' && oc({ t: 'diasMes', dias: [15, 31], ajuste: 'antes' }, '2027-02-01', '2027-02-28') === '2027-02-15,2027-02-26', '«Dos días al mes» con el último: 29 en bisiesto y viernes 26 si el 28 es domingo');
  ok(oc({ t: 'dias', cada: 28, ancla: '2026-12-01' }, '2026-10-23', '2027-01-31') === '2026-11-03,2026-12-01,2026-12-29,2027-01-26', '«Cada 28 días» con un día de referencia futuro: incluye ese día y sigue el mismo ritmo hacia atrás y hacia delante');
  ok(oc({ t: 'dias' }, '2026-10-01', '2026-10-31') === '' && oc({ t: 'diasMes', dias: [] }, '2026-10-01', '2026-10-31') === '' && oc({ t: 'habil', n: 99 }, '2026-10-01', '2026-10-31') === '2026-10-14', 'reglas a medias no rompen nada (sin día de referencia, sin días, n fuera de rango → 10.º hábil)');
  ok(A.reglaTexto({ t: 'nesimo', n: -2, dow: 0 }) === 'El penúltimo lunes de cada mes' && A.reglaTexto({ t: 'habil', n: 3 }) === 'El tercer día hábil del mes' && A.reglaTexto({ t: 'habilFin', n: 3 }) === 'El antepenúltimo día hábil del mes', 'textos: penúltimo lunes, tercer y antepenúltimo día hábil');

  // ---------- 3. Festivos: la tabla del BOE en unas cuantas fechas ----------
  const conZona = (zona, r, a, b) => { fest({ on: true, zona }); try { return oc(r, a, b); } finally { fest(undefined); } };
  const des = (dia) => ({ t: 'dia', dia, ajuste: 'despues' });
  ok(conZona('CT', des(29), '2027-03-15', '2027-03-31') === '2027-03-30', 'Cataluña 2027: lunes de Pascua 29 mar → el 30 (BOE-A-2026-21254)');
  ok(conZona('PV', des(7), '2027-10-01', '2027-10-31') === '2027-10-08', 'País Vasco 2027: 7 oct festivo → el 8');
  ok(conZona('NC', des(3), '2026-12-01', '2026-12-31') === '2026-12-04', 'Navarra 2026: 3 dic (San Francisco Javier, añadido a mano) → el 4');
  ok(conZona('IB', des(2), '2026-03-01', '2026-03-31') === '2026-03-03', 'Baleares 2026: lunes 2 mar → el 3 (BOE-A-2025-21667)');
  ok(conZona('CE', des(2), '2026-09-01', '2026-09-30') === '2026-09-03' && conZona('ML', des(10), '2027-03-01', '2027-03-31') === '2027-03-11', 'Ceuta 2026 (2 sep) y Melilla 2027 (10 mar)');
  ok(conZona('GA', des(17), '2027-05-01', '2027-05-31') === '2027-05-18' && conZona('AN', des(1), '2027-03-01', '2027-03-31') === '2027-03-02', 'Galicia 2027 (Letras Gallegas, 17 may) y Andalucía 2027 (1 mar)');
  ok(conZona('MD', des(6), '2027-12-01', '2027-12-31') === '2027-12-07' && conZona('AS', des(8), '2026-09-01', '2026-09-30') === '2026-09-09', 'nacional 2027 (6 dic) y Asturias 2026 (8 sep)');
  ok(conZona('MD', des(6), '2028-01-01', '2028-01-31') === '2028-01-06', '2028 aún no está en la tabla: ese año solo se saltan los fines de semana');
  ok(conZona('MD', { t: 'ultHabil' }, '2026-10-01', '2026-10-31') === conZona('CT', { t: 'ultHabil' }, '2026-10-01', '2026-10-31'), 'zonas distintas sin festivo ese mes: misma fecha');
  fest({ on: true, zona: 'MD', locales: { 2026: ['2026-10-30', 'basura', '2026-13-45'] } });
  const conLocal = oc({ t: 'ultHabil' }, '2026-10-01', '2026-10-31'); fest(undefined);
  ok(conLocal === '2026-10-29', 'una fiesta local (30 oct) mueve el último hábil al 29; las fechas mal escritas se ignoran');

  // ---------- 4. Ir a «Festivos» desde el editor no pierde lo escrito ----------
  H.goTab(['tu']); await sleep(10); H.openRecurrentes([]); await sleep(10);
  H.recNuevo(['factura']); await sleep(10);
  const nom = sh().querySelector('#recNombre'); nom.value = 'Gimnasio prueba'; nom.dispatchEvent(new e.w.Event('input', { bubbles: true }));
  const imp = sh().querySelector('#recImporte'); imp.value = '35'; imp.dispatchEvent(new e.w.Event('input', { bubbles: true }));
  H.recCuando([]); await sleep(5); H.recCuandoTipo(['diasMes']); await sleep(5);
  ok(/Elige los dos días|Dos días al mes/.test(sh().textContent), 'el selector abre «Dos días al mes»');
  H.festivosAbrir([]); await sleep(5);
  ok(/Festivos/.test(sh().textContent) && sh().querySelector('.switch[aria-label="Saltar festivos"]'), 'desde el selector se abre «Festivos»');
  H.festivosCerrar([]); await sleep(5);
  ok(A.form().kind === 'rec' && A.form().paso === 'cuando' && A.form().nombre === 'Gimnasio prueba' && String(A.form().importe) === '35', 'al volver de «Festivos» sigues en el selector, con el nombre y el importe escritos');
  H.recPar(['dias|15']); await sleep(5); H.recCuandoUsar([]); await sleep(5);
  ok(A.form().paso === 'cuando' && (A.form().reglaTmp.dias || []).join() === '1', '«Dos días al mes» con un solo día marcado no se acepta (pide los dos)');
  H.recPar(['dias|1']); H.recPar(['dias|5']); H.recPar(['dias|20']); await sleep(5); H.recCuandoUsar([]); await sleep(5);
  ok(!A.form().paso && sh().querySelector('#recNombre').value === 'Gimnasio prueba', 'con los dos días: vuelve al editor y el nombre sigue ahí');
  H.recGuardar([]); await sleep(30);
  const gym = (e.store.cfg.app.facturas || []).find((x) => x.nombre === 'Gimnasio prueba');
  ok(gym && gym.regla.t === 'diasMes' && (gym.regla.dias || []).join() === '5,20' && Number(gym.importe) === 35, 'se guarda el pago fijo con sus dos días y su importe');
  ok(!e.store.cfg.app.festivos, 'abrir y cerrar «Festivos» sin pulsar «Listo» no guarda nada');

  // ---------- 5. Perfil: usuario nuevo y datos raros ----------
  const n = makeEnv({ version: { tu: 0 }, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], perfil: { avatar: 'dibujo', icono: '"><img src=x onerror=alert(1)>', color: 'red;background:url(x)' } }, meta: { onboarded: true } }, movs: [] });
  await sleep(150);
  const av = n.doc.querySelector('#tbAvatar');
  ok(av && !av.querySelector('img') && !/url\(/.test(av.getAttribute('style') || '') && av.textContent.trim().length >= 1, 'perfil con datos raros: la barra de arriba vuelve a las iniciales y al color de siempre, sin colar nada');
  n.w.__APP__.H.goTab(['tu']); await sleep(10); n.w.__APP__.H.tuNombreAbrir([]); await sleep(10);
  const inN = n.doc.querySelector('#sheetHost #tuNombreIn'); inN.value = '   '; inN.dispatchEvent(new n.w.Event('input', { bubbles: true }));
  await n.w.__APP__.H.tuNombreGuardar([]); await sleep(20);
  ok(!n.store.cfg.app.nombre && n.doc.querySelector('#sheetHost #tuNombreIn'), 'sin nombre no se guarda el perfil (pide «Escribe tu nombre») y la hoja sigue abierta');

  // ---------- 6. Fondo guardado en el dispositivo ----------
  const f = makeEnv({ url: 'https://app.test/', version: { tu: 0 }, pre: (w) => { try { w.localStorage.setItem('fondo', 'raro'); } catch (x) { /* */ } }, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } }, movs: [] });
  await sleep(120);
  ok(f.doc.documentElement.getAttribute('data-fondo') === 'neutro', 'un fondo guardado que no existe arranca en «Neutro»');
  f.w.__APP__.H.setFondo(['puro']); await sleep(5);
  ok(f.w.localStorage.getItem('fondo') === 'puro' && f.doc.documentElement.getAttribute('data-fondo') === 'puro' && !f.store.cfg.app.fondo, '«Negro puro / Blanco» se guarda solo en este dispositivo (no en tu cuenta)');
  const css = fs.readFileSync(path.join(__dirname, '..', 'look.css'), 'utf8');
  ok(/data-fondo="puro"\]\[data-theme="dark"\][^{]*\{[^}]*--paper-raised: #141416/.test(css) && /data-fondo="puro"\]:not\(\[data-theme="light"\]\)[^{]*\{[^}]*--paper-raised: #141416/.test(css), 'en oscuro, «Negro puro» deja las tarjetas en gris (#141416) para que se distingan del negro');

  // ---------- 7. Iconos: cada uso, un solo significado (lo pedido en docs/15 3.2) ----------
  const firma = (svg) => { if (!svg) return ''; const d = doc.createElement('div'); d.innerHTML = typeof svg === 'string' ? svg : svg.outerHTML; const s = d.querySelector('svg'); if (!s) return ''; s.removeAttribute('class'); s.removeAttribute('aria-hidden'); return s.outerHTML; };
  const es = (el, nombre) => !!el && firma(el.querySelector('svg')) === firma(ICONOS[nombre]);
  ok(Object.keys(ICONOS).length > 60 && ['deuda', 'target', 'replay', 'megafono', 'estrella', 'autoTag', 'calRango', 'fileIn', 'archive', 'history', 'info', 'moneda', 'velas', 'piggy2', 'pie', 'coin', 'candado', 'comparar', 'play', 'coche2'].every((k) => ICONOS[k]), 'los iconos nuevos están en ICONS');
  ok(firma(ICONOS.piggy2) !== firma(ICONOS.trendUp) && firma(ICONOS.comparar) !== firma(ICONOS.swap) && firma(ICONOS.deuda) !== firma(ICONOS.card), 'hucha ≠ flecha que sube, «Antes» ≠ Traspaso, deuda ≠ tarjeta');
  ok(es(doc.querySelector('.tabbar [data-tab="dinero"], [data-tab="dinero"]'), 'wallet'), 'la pestaña Dinero lleva la cartera');
  H.goTab(['dinero']); await sleep(20);
  ok(es(doc.querySelector('#dm3t-metas'), 'target') && es(doc.querySelector('#dm3t-inversiones'), 'trendUp') && es(doc.querySelector('#dm3t-deudas'), 'deuda'), 'fichas de Dinero: diana, flecha que sube y deuda');
  A.openCrear(); await sleep(20);
  const op = (k) => sh().querySelector('[data-click="crearIr|' + k + '"]');
  ok(es(op('ahorro'), 'piggy2') && es(op('inversion'), 'trendUp') && es(op('factura'), 'repeat') && es(op('deuda'), 'deuda') && es(op('importar'), 'fileIn') && es(op('traspaso'), 'swap'), 'botón +: hucha, flecha que sube, repetir, deuda, archivo que entra y traspaso');
  A.S.tuMas = true; H.goTab(['tu']); await sleep(20);
  const tu = (accion) => doc.querySelector('.menu-item[data-click^="' + accion + '"]');
  ok(es(tu('openMoneda'), 'moneda') && es(tu('openLotes'), 'history') && !!tu('compararToggle') === Object.values(A.VERSIONES).some((v) => !v.cerrada) && es(tu('openReglas'), 'autoTag') && es(tu('tuMesAbrir'), 'calRango'), 'Tú: moneda, historial, etiqueta automática y Tu mes («Antes» solo si queda algo por elegir)');
  ok(es(tu('impAbrir'), 'fileIn') && es(tu('exportBackup'), 'archive') && es(tu('verNovedades'), 'megafono') && es(tu('startOnboardingManually'), 'replay'), 'Tú: importar, copia, novedades y bienvenida');
  ok(/'Transporte', ic: 'coche2'/.test(SRC) && /'Suscripciones', ic: 'play'/.test(SRC), 'Transporte con el coche nuevo y Suscripciones con «play»');
  ok(/cripto\|bitcoin\/\.test\(k\) \? 'coin' : \/accion\/\.test\(k\) \? 'velas' : \/fondo\|etf\|indice\/\.test\(k\) \? 'pie'/.test(SRC), 'activos: cripto con moneda, acciones con velas y fondos con quesito');
  ok((SRC.match(/ic\('comparar'\)/g) || []).length >= 2, 'el botón «Antes» flotante lleva «comparar»');

  // ---------- 8. Arreglos de Calidad (parche del 23/10) ----------
  ok(/const TIPO_ICONO = \{ Ingreso: 'arrowUp', 'Inversión': 'trendUp', Ahorro: 'piggy2', Deuda: 'deuda'/.test(SRC), 'Movimientos: apartar con hucha, invertir con flecha que sube y deuda con su icono (como en el botón +)');
  ok(/out\.ahorro = \{ ic: 'piggy2'/.test(SRC) && /out\.inv = \{ ic: 'trendUp'/.test(SRC) && /out\.sinGastos = \{ ic: 'estrella'/.test(SRC) && /return \{ ic: 'target', tono: pct/.test(SRC), '«Así vas»: los círculos llevan el mismo icono que su opción en «Cambiar»');
  ok(/Metas: 'target', Inversiones: 'trendUp', Deudas: 'deuda'/.test(SRC) && /ahorro: 'piggy2', efectivo: 'wallet', broker: 'trendUp'/.test(SRC), 'atajos de la búsqueda y tipos de cuenta con los iconos nuevos');
  ok(!/'Cada semanas'|'Cada meses o años'/.test(SRC), 'sin «Cada semanas» ni «Cada meses o años»');
  ok(A.reglaTexto({ t: 'diasMes', dias: [31, 15] }) === 'El 15 y el último día de cada mes' && A.reglaTexto({ t: 'diasMes', dias: [1, 15] }) === 'Los días 1 y 15 de cada mes', 'texto de «Dos días al mes» con el último: «El 15 y el último día de cada mes»');
  H.goTab(['tu']); await sleep(10); H.openRecurrentes([]); await sleep(10); H.recNuevo(['cobro']); await sleep(10); H.recCuando([]); await sleep(5); H.recCuandoTipo(['diasMes']); await sleep(5);
  const dias = [...sh().querySelectorAll('.rec-dia')];
  ok(dias.length === 31 && !dias.some((b) => b.textContent === '31') && dias[30].textContent === 'El último' && dias[30].getAttribute('aria-pressed') === 'false', 'rejilla de días: del 1 al 30 y «El último» (el 31 ya no sale dos veces)');
  H.recPar(['dias|31']); await sleep(5);
  ok(sh().querySelector('.rec-dia.ult').getAttribute('aria-pressed') === 'true', '«El último» dice si está marcado');
  H.recCuandoTipo(['habil']); await sleep(5);
  ok(!/Penúltimo/.test(sh().querySelector('.rec-par').textContent), '«Otro día hábil» ya no ofrece «Penúltimo» (tiene su propia tarjeta)');
  H.recCuandoVolver([]); await sleep(5);
  const n2 = makeEnv({ version: { tu: 0 }, cfg: { app: { nombre: 'Ana', categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } }, movs: [] }); await sleep(120);
  n2.w.__APP__.H.goTab(['tu']); await sleep(5); n2.w.__APP__.H.tuNombreAbrir([]); await sleep(5); n2.w.__APP__.H.perfilModo(['dibujo']); await sleep(5);
  const labs = [...n2.doc.querySelectorAll('#sheetHost .perfil-d')].map((b) => b.getAttribute('aria-label'));
  ok(labs.length === 12 && labs.indexOf('Balón') >= 0 && labs.indexOf('Corazón') >= 0 && !labs.some((l) => /^(heart|ball|plane|film|gift|home|bulb|paw|sparkle)$/.test(l)), 'los dibujos del perfil se leen en español («Balón», «Corazón»…)');
  // «Cada 7 días» con un pago que falta: el aviso sale en la fecha que falta, no en la última
  const hoyU = A.todayISO(), menos = (k) => A.uAdd(hoyU, -k);
  const t = makeEnv({ cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }], facturas: [{ nombre: 'Clase semanal', importe: 10, desde: menos(30), regla: { t: 'dias', cada: 7, ancla: menos(28) } }] }, meta: { onboarded: true } },
    movs: [28, 21, 7].map((k) => ({ id: 'cs' + k, tipo: 'Factura', categoria: 'Otros', subcategoria: 'Clase semanal', descripcion: 'Clase semanal', importe: 10, fecha: menos(k) })) });
  await sleep(150);
  const pas = t.w.__APP__.avisosRecurrentes().pasados.map((x) => x.iso);
  ok(pas.join() === menos(14), '«Cada 7 días»: si falta el pago de hace 2 semanas, el aviso es de ese día (antes salía el de la semana pasada)');

  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

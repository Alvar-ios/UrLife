// 13/11 · Categorías de ingreso: un Bizum recibido de 0,50 € se apuntó como «Nómina» (era la primera de la lista).
// Ahora cada tipo de aviso va a su categoría, «Nómina» solo si lo dice o se parece a tu nómina fija, y hay una lista de
// serie más amplia (solo se AÑADE a quien usa la de serie; nunca se borra ni se renombra nada). Datos inventados.
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const hoy = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
const V = { tu: 0, agenda: 0, crear: 0 };
const av = (tipo, importe, extra) => Object.assign({ id: 'x' + Math.random(), pkg: 'de.number26.android', app: 'N26', importe, entra: true, comercio: '', tipo, ts: Date.now() }, extra || {});
(async () => {
  /* A · lista propia con «Nómina» la primera y sin «Otros»; un Bizum anterior mal puesto en Nómina (el fallo) */
  let e = makeEnv({ version: V, cfg: { app: { compararVersiones: false, ingresosSerie: 2, ingresos: ['Nómina', 'Transferencias', 'Wallapop/Vinted'],
    cobros: [{ nombre: 'Nómina', importe: 1800, diaDelMes: 28 }] }, meta: { onboarded: true } },
    movs: [{ id: 'm1', tipo: 'Ingreso', categoria: 'Nómina', importe: 0.5, fecha: hoy(), descripcion: 'Bizum recibido' }, { id: 'm2', tipo: 'Ingreso', categoria: 'Nómina', importe: 3, fecha: hoy(), descripcion: 'Bizum recibido' }] });
  await sleep(300);
  let A = e.w.__APP__;
  const cat = (t, imp) => A.avisoAMov(av(t, imp)).categoria;
  ok(cat('bizum', 0.5) === 'Transferencias', 'Bizum recibido de 0,50 € → «Transferencias», no «Nómina» (aunque antes se apuntaran en Nómina)');
  ok(cat('transferencia', 40) === 'Transferencias', 'transferencia de 40 € → «Transferencias»');
  ok(cat('transferencia', 1790) === 'Nómina', 'transferencia parecida a la nómina fija (1.790 € con 1.800 €) → «Nómina»');
  ok(cat('nomina', 1500) === 'Nómina', 'el aviso dice nómina → «Nómina»');
  ok(cat('devolucion', 15.99) === 'Otros ingresos', 'devolución sin categoría propia → «Otros ingresos» (nunca la primera de la lista)');
  ok(cat('otro', 3) !== 'Nómina' && cat('tarjeta', 2) !== 'Nómina', 'un ingreso pequeño sin más pistas nunca va a «Nómina»');
  const mapa = A.avisosMapa();
  ok(mapa.ingresos && mapa.ingresos.bizum === 'Transferencias' && mapa.ingresos.nomina === 'Nómina' && mapa.ingresos.otro === 'Otros ingresos' && mapa.catIngreso === 'Otros ingresos' && mapa.nominaImporte === 1800,
    'el mapa para Android lleva la categoría de cada tipo y el importe de la nómina fija (catIngreso ya no es «Nómina»)');
  ok(JSON.stringify(A.cfg().ingresos) === JSON.stringify(['Nómina', 'Transferencias', 'Wallapop/Vinted']), 'una lista propia no se toca');
  ok(e.store.movimientos.m1.categoria === 'Nómina', 'los movimientos que ya tenías no se cambian');

  /* B · con la lista de serie nueva */
  e = makeEnv({ version: V, cfg: { app: { compararVersiones: false, ingresos: ['Nómina', 'Extras y bonus', 'Trabajos y freelance', 'Bizum y transferencias', 'Devoluciones y reembolsos', 'Ventas de segunda mano', 'Alquileres cobrados', 'Intereses y dividendos', 'Ayudas y prestaciones', 'Regalos', 'Otros ingresos'] }, meta: { onboarded: true } } });
  await sleep(300); A = e.w.__APP__;
  ok(cat('bizum', 0.5) === 'Bizum y transferencias', 'serie nueva: Bizum → «Bizum y transferencias»');
  ok(cat('devolucion', 9) === 'Devoluciones y reembolsos', 'serie nueva: devolución → «Devoluciones y reembolsos»');
  ok(cat('intereses', 1.2) === 'Intereses y dividendos' && cat('dividendo', 4) === 'Intereses y dividendos', 'serie nueva: intereses y dividendos');
  ok(cat('transferencia', 2000) === 'Bizum y transferencias', 'sin nómina fija, una transferencia grande no se da por nómina');
  ok(A.iconoCat('Ingreso', 'Bizum y transferencias') === 'swap' && A.iconoCat('Ingreso', 'Nómina') === 'cash' && A.iconoCat('Ingreso', 'Mi cosa') === 'arrowUp', 'cada ingreso de serie con su icono (los propios, la flecha de siempre)');
  ok(A.colorCat('Nómina') === '#1FA67A' && A.colorCat('Devoluciones y reembolsos') === '#4FB3A9', 'y su color fijo');
  ok(A.INGRESOS_SERIE.length === 11 && A.INGRESOS_SERIE[0] === 'Nómina' && A.INGRESOS_SERIE[10] === 'Otros ingresos', 'la lista de serie tiene 11');

  /* C · completar la lista a quien usa la de serie: solo añade, una vez */
  e = makeEnv({ version: V, cfg: { app: { compararVersiones: false, ingresos: ['Nómina', 'Transferencias', 'Wallapop/Vinted', 'Otros'] }, meta: { onboarded: true } },
    movs: [{ id: 'w1', tipo: 'Ingreso', categoria: 'Wallapop/Vinted', importe: 20, fecha: hoy(), descripcion: 'Venta' }] });
  await sleep(400); A = e.w.__APP__;
  const ing = e.store.cfg.app.ingresos;
  ok(ing.slice(0, 4).join('|') === 'Nómina|Transferencias|Wallapop/Vinted|Otros', 'la serie de antes: las 4 siguen igual y en su orden');
  ok(ing.length === 11 && ing.includes('Devoluciones y reembolsos') && ing.includes('Ayudas y prestaciones') && !ing.includes('Bizum y transferencias') && !ing.includes('Otros ingresos') && !ing.includes('Ventas de segunda mano'),
    'se añaden las 7 nuevas que no repiten ninguna (Transferencias, Wallapop/Vinted y Otros ya cubren tres)');
  ok(e.store.cfg.app.ingresosSerie === 2 && e.store.movimientos.w1.categoria === 'Wallapop/Vinted', 'se marca como hecho y los movimientos no se tocan');
  // quien borra luego alguna no la vuelve a ver
  e = makeEnv({ version: V, cfg: { app: { compararVersiones: false, ingresosSerie: 2, ingresos: ['Nómina', 'Transferencias', 'Wallapop/Vinted', 'Otros'] }, meta: { onboarded: true } } });
  await sleep(400);
  ok(e.store.cfg.app.ingresos.length === 4, 'una vez hecho, no se vuelve a añadir nada');
  // lista vacía (cuentas creadas con la bienvenida corta) → la de serie
  e = makeEnv({ version: V, cfg: { app: { compararVersiones: false }, meta: { onboarded: true } } });
  await sleep(400);
  ok((e.store.cfg.app.ingresos || []).length === 11, 'lista vacía → se pone la de serie');
  // lista propia → no se toca
  e = makeEnv({ version: V, cfg: { app: { compararVersiones: false, ingresos: ['Sueldo', 'Bizum'] }, meta: { onboarded: true } } });
  await sleep(400);
  ok(JSON.stringify(e.store.cfg.app.ingresos) === '["Sueldo","Bizum"]' && !e.store.cfg.app.ingresosSerie, 'lista propia: ni se toca ni se marca');
  A = e.w.__APP__;
  ok(cat('bizum', 0.5) === 'Bizum', 'con su propia «Bizum», el Bizum va ahí');

  /* D · cuenta nueva con la bienvenida corta: sale con la lista de serie */
  e = makeEnv({ version: Object.assign({ bienvenida: 0 }, V), cfg: {} }); await sleep(200); A = e.w.__APP__;
  await A.H.obFinish(['']); await sleep(400);
  ok((e.store.cfg.app.ingresos || []).join('|') === A.INGRESOS_SERIE.join('|') && e.store.cfg.app.ingresosSerie === 2, 'cuenta nueva: categorías de ingreso de serie');
  console.log(fails ? fails + ' FALLOS' : 'TODO OK'); process.exit(fails ? 1 : 0);
})();

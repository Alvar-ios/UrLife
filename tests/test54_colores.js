// 18/10: las categorías personalizadas no repiten color entre ellas ni con las estándar
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const propias = ['Gimnasio', 'Golf', 'Uñas y pelo', 'Coche', 'Bebé', 'Clases'];
  const e = makeEnv({ cfg: { app: { categoriasGasto: propias.map((n) => ({ nombre: n })), ingresos: ['Nómina'] }, meta: { onboarded: true } }, movs: [] });
  await sleep(120);
  const A = e.w.__APP__, cols = propias.map((n) => A.colorCat(n));
  ok(new Set(cols).size === propias.length, 'seis personalizadas, seis colores distintos (' + cols.join(' ') + ')');
  const std = ['Vivienda', 'Supermercado', 'Restaurantes y bares', 'Suministros', 'Transporte', 'Ocio', 'Deporte', 'Compras', 'Salud y cuidado personal', 'Regalos', 'Viajes', 'Suscripciones', 'Seguros', 'Educación', 'Mascotas', 'Otros'].map((n) => A.colorCat(n));
  ok(!cols.some((c) => std.indexOf(c) >= 0), 'ninguna coincide con el color de una estándar');
  ok(A.colorCat('golf') === A.colorCat('Golf'), 'el color no depende de mayúsculas');
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((x) => { console.log('CRASH', x); process.exit(1); });

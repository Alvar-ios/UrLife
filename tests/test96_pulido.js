// Pulido 24/10 (docs/15): hoja de cada activo, deudas con icono, hojas de ajustes. Datos inventados.
console.error = () => {};
const { makeEnv, sleep } = require('./harness.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  /* 1. Hoja de cada activo */
  const movs = [
    { id: 'i1', tipo: 'Inversión', categoria: 'Bitcoin', importe: 500, fecha: '2026-03-10', activoId: 'a1', participaciones: 0.008, tipoActivo: 'Cripto' },
    { id: 'i2', tipo: 'Inversión', categoria: 'Bitcoin', importe: 300, fecha: '2026-05-12', activoId: 'a1', participaciones: 0.0045, tipoActivo: 'Cripto' },
    { id: 'i3', tipo: 'Inversión', categoria: 'Fondo raro', importe: 800, fecha: '2026-04-01' },
    { id: 'i4', tipo: 'Inversión', categoria: 'Oro', importe: 100, fecha: '2026-04-02', activoId: 'a2', participaciones: 1, tipoActivo: 'Otro' }];
  const e = makeEnv({ movs, cfg: { app: { categoriasGasto: [{ nombre: 'Otros' }] }, meta: { onboarded: true } }, version: { dinero: 0 } });
  await sleep(200);
  const A = e.w.__APP__, H = A.H, sh = () => e.doc.querySelector('#sheetHost');
  A.S.valoracion = { ts: Date.now(), valores: { a1: { activo: { simbolo: 'BTC', tipo: 'crypto' }, cierre_eur: 60000, fecha_precio: '2026-10-23' } } };
  H.verActivo(['Bitcoin']); await sleep(20);
  const t = sh().textContent;
  ok(/Bitcoin/.test(t) && /Criptomoneda · BTC/.test(t), 'la hoja del activo dice qué es (Criptomoneda · BTC)');
  ok(/Vale hoy/.test(t) && /750,00/.test(t) && /Pierdes 50,00/.test(t), 'valor de hoy (0,0125 × 60.000 = 750 €) y lo que pierdes (50 €)');
  ok(/Aportaste/.test(t) && /800,00/.test(t) && /0,0125 part\./.test(t) && /64\.000,00/.test(t) && /Último precio/.test(t), 'las 4 cifras: aportaste, tienes, te costó de media (64.000 €) y último precio');
  ok(sh().querySelectorAll('.act-mov').length === 2, 'tus aportaciones: las 2 de Bitcoin');
  ok(/Invertir más/.test(t) && /Movimientos/.test(t) && /Precios/.test(t), 'botones: Invertir más, Movimientos y Precios');
  H.activoInvertir(['Bitcoin']); await sleep(20);
  ok(A.form().kind === 'mov' && A.form().tipo === 'Inversión' && A.form().activo && A.form().activo.activo_id === 'a1', '«Invertir más» abre una inversión con el activo ya puesto');
  H.closeSheet([]); await sleep(300);
  H.verActivo(['Fondo raro']); await sleep(20);
  ok(/Sin precio/.test(sh().textContent) && /Buscar el activo/.test(sh().textContent) && /Has metido/.test(sh().textContent), 'sin activo elegido: «Sin precio» y «Buscar el activo»');
  H.activoEnMovs(['Fondo raro']); await sleep(50);
  ok(A.S.tab === 'movimientos', '«Movimientos» lleva a la lista de ese activo');
  ok(A.colorActivo('a1') !== A.colorActivo('a2') && A.colorActivo('a1') === A.colorActivo('a1') && A.colorActivo(null) === null, 'cada activo tiene su color fijo');
  console.log(fails ? 'FAILED ' + fails : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch((err) => { console.log(String(err && err.stack || err)); process.exit(1); });

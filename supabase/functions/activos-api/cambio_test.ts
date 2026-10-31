// Prueba de la acción «cambio» (sin red ni base de datos).
// Ejecutar: node supabase/functions/activos-api/cambio_test.ts   (Node 22.18+; o deno run cambio_test.ts)
import assert from 'node:assert/strict';
import { leerPeticionCambio, necesitaBce, respuestaCambio, puedeDescargar, MONEDAS_EXTRA } from './cambio.ts';

const MON = ['USD', 'JPY', 'GBP', ...MONEDAS_EXTRA];
const HOY = '2026-10-31'; // sábado
let n = 0; const ok = (c: boolean, m: string) => { assert.ok(c, m); n++; };

// Lo que manda la app
ok(JSON.stringify(leerPeticionCambio({ moneda: 'usd', fecha: '2026-10-30' }, HOY, MON)) === '{"moneda":"USD","fecha":"2026-10-30"}', 'minúsculas valen');
ok((leerPeticionCambio({ moneda: 'USD' }, HOY, MON) as any).fecha === HOY, 'sin fecha = hoy');
ok((leerPeticionCambio({ moneda: 'USD', fecha: '2026-11-01' }, HOY, MON) as any).fecha === HOY, 'mañana (hora de España) = hoy');
ok((leerPeticionCambio({ moneda: 'USD', fecha: '2026-11-02' }, HOY, MON) as any).error === 'fecha_invalida', 'pasado mañana no');
ok((leerPeticionCambio({ moneda: 'USD', fecha: '2026-02-30' }, HOY, MON) as any).error === 'fecha_invalida', '30 de febrero no');
ok((leerPeticionCambio({ moneda: 'USD', fecha: "2026-10-30' or 1=1" }, HOY, MON) as any).error === 'fecha_invalida', 'texto raro no');
ok((leerPeticionCambio({ moneda: 'USD', fecha: '2020-01-01' }, HOY, MON) as any).error === 'fecha_fuera_de_rango', 'más de 3 años no');
ok((leerPeticionCambio({ moneda: 'MAD' }, HOY, MON) as any).error === 'moneda_no_soportada', 'dírham: a mano');
ok((leerPeticionCambio({ moneda: 'US' }, HOY, MON) as any).error === 'moneda_invalida', '2 letras no');
ok((leerPeticionCambio({ moneda: 'USD,JPY' }, HOY, MON) as any).error === 'moneda_invalida', 'varias no');
ok((leerPeticionCambio(null, HOY, MON) as any).error === 'moneda_invalida', 'sin datos no');
ok((leerPeticionCambio({ moneda: 'EUR' }, HOY, MON) as any).moneda === 'EUR', 'euro vale');
ok((leerPeticionCambio({ moneda: 'THB' }, HOY, MON) as any).moneda === 'THB', 'baht en la lista nueva');

// ¿Pedir al BCE?
ok(necesitaBce(null, '2026-10-30') === true, 'sin nada guardado: sí');
ok(necesitaBce('2026-10-29', '2026-10-30') === false, 'viernes con el del jueves: no');
ok(necesitaBce('2026-10-28', '2026-10-30') === true, 'viernes con el del miércoles: sí');
ok(necesitaBce('2026-10-30', '2026-10-31') === false, 'sábado con el viernes: no');
ok(necesitaBce('2026-10-30', '2026-11-01') === false, 'domingo con el viernes: no');
ok(necesitaBce('2026-10-30', '2026-11-02') === false, 'lunes por la mañana con el viernes: no');
ok(necesitaBce('2026-10-30', '2026-11-04') === true, 'miércoles con el viernes: sí');

// Respuesta
const r = respuestaCambio('USD', '2026-10-31', { fecha: '2026-10-30', por_eur: '1.0811' }) as any;
ok(r.por_eur === 1.0811 && r.fecha_bce === '2026-10-30' && r.origen === 'bce', 'cambio y fecha del BCE');
ok((respuestaCambio('USD', '2026-10-31', null) as any).error === 'sin_cambio', 'sin fila: sin_cambio');
ok((respuestaCambio('USD', '2026-10-31', { fecha: '2026-10-30', por_eur: 0 }) as any).error === 'sin_cambio', 'cambio 0: sin_cambio');
ok((respuestaCambio('EUR', '2026-10-31', null) as any).por_eur === 1, 'euro = 1');

// Freno
ok(puedeDescargar('2026-10-30', 1000) === true, 'primera descarga sí');
ok(puedeDescargar('2026-10-30', 2000) === false, 'otra al momento no');
ok(puedeDescargar('2026-10-30', 1000 + 16 * 60 * 1000) === true, 'pasados 15 min sí');

console.log('cambio: ' + n + ' de ' + n + ' bien');

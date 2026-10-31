// Acción «cambio» de activos-api (viajes con otra moneda, docs/29 §2.3).
// Solo piezas sin red ni base de datos, para poder probarlas aparte (cambio_test.ts).

// Monedas que el BCE publica y que la función de inversiones aún no pedía.
// Confirmadas en la web del BCE el 31/10/2026: RON, ISK, IDR, ILS. Sin confirmar: MYR, PHP, THB
// (si el BCE no las publica, la acción responde «sin_cambio» y la app pide el cambio a mano; no rompe nada).
export const MONEDAS_EXTRA = ['RON', 'ISK', 'IDR', 'ILS', 'MYR', 'PHP', 'THB'];

// Hasta cuántos días atrás se acepta un gasto (como el histórico de inversiones: 3 años).
export const ANIOS_MAX = 3;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const dia = (f: string) => new Date(f + 'T00:00:00Z');
export const diasEntre = (a: string, b: string) => Math.round((dia(b).getTime() - dia(a).getTime()) / 86400000);
const sumaDias = (f: string, n: number) => { const d = dia(f); d.setUTCDate(d.getUTCDate() + n); return iso(d); };

// Lee y comprueba lo que manda la app. Devuelve la moneda (3 letras, de la lista) y la fecha (AAAA-MM-DD).
// Se acepta «mañana» (en España ya puede ser mañana cuando en UTC aún es hoy) y se trata como hoy.
export function leerPeticionCambio(b: any, hoy: string, monedas: string[]): { moneda: string; fecha: string } | { error: string } {
  const moneda = String((b && b.moneda) ?? '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(moneda)) return { error: 'moneda_invalida' };
  if (moneda !== 'EUR' && !monedas.includes(moneda)) return { error: 'moneda_no_soportada' };
  let fecha = String((b && b.fecha) || hoy);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || isNaN(dia(fecha).getTime()) || iso(dia(fecha)) !== fecha) return { error: 'fecha_invalida' };
  if (fecha > sumaDias(hoy, 1)) return { error: 'fecha_invalida' };
  if (fecha > hoy) fecha = hoy;
  if (fecha < sumaDias(hoy, -365 * ANIOS_MAX)) return { error: 'fecha_fuera_de_rango' };
  return { moneda, fecha };
}

// ¿Hace falta pedir al BCE? Sí si no hay cambio guardado o si el último guardado es más viejo de lo normal.
// Lo normal: el del día anterior laborable (lunes → viernes, 3 días; domingo 2; sábado 1; resto 1).
// Así un gasto de hoy por la mañana usa el de ayer sin pedir nada, y los saldos no bailan.
export function necesitaBce(ultima: string | null, fecha: string): boolean {
  if (!ultima) return true;
  const sem = dia(fecha).getUTCDay(); // 0 domingo … 6 sábado
  const normal = sem === 1 ? 3 : sem === 0 ? 2 : 1;
  return diasEntre(ultima, fecha) > normal;
}

// Respuesta para la app a partir de la fila de «divisas» encontrada (o ninguna).
export function respuestaCambio(moneda: string, fecha: string, fila: { fecha: string; por_eur: number | string } | null) {
  if (moneda === 'EUR') return { moneda, fecha_pedida: fecha, fecha_bce: null, por_eur: 1, origen: 'bce' };
  if (!fila) return { error: 'sin_cambio', moneda, fecha_pedida: fecha };
  const por = Number(fila.por_eur);
  if (!(por > 0) || !isFinite(por)) return { error: 'sin_cambio', moneda, fecha_pedida: fecha };
  return { moneda, fecha_pedida: fecha, fecha_bce: fila.fecha, por_eur: por, origen: 'bce' };
}

// Freno: como mucho una descarga al BCE por día pedido (baja todas las monedas a la vez) cada 15 minutos en cada copia de la función.
const ultimasDescargas = new Map<string, number>();
export function puedeDescargar(clave: string, ahora = Date.now(), ms = 15 * 60 * 1000): boolean {
  const t = ultimasDescargas.get(clave);
  if (t != null && ahora - t < ms) return false;
  ultimasDescargas.set(clave, ahora);
  if (ultimasDescargas.size > 500) ultimasDescargas.clear();
  return true;
}

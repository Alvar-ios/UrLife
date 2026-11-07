// Función «trayecto» (docs/31): calculadora de gasolina del botón +.
//  · accion 'refrescar': si hoy aún no hay precios, los baja del Ministerio (Geoportal de carburantes, datos públicos)
//    y guarda la mediana por provincia y la de España en la tabla pública «precios_carburante». Lo dispara la app al
//    abrir la calculadora, así no hace falta ninguna tarea programada ni guardar claves en otro sitio.
//  · accion 'distancia': km por carretera entre dos sitios con OpenRouteService. La clave va SOLO en el secreto
//    ORS_KEY de Supabase. Las direcciones no se guardan en ningún sitio.
// Solo responde a usuarios con sesión iniciada.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json; charset=utf-8' };
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: CORS });
const hoyMadrid = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
const MINISTERIO = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';
// campo del Ministerio (sin «Precio ») → clave de la app
const CAMPOS: Record<string, string> = {
  'Gasoleo A': 'goA', 'Gasoleo Premium': 'goP', 'Diésel Renovable': 'goR', 'Biodiesel': 'bio',
  'Gasolina 95 E5': 'g95', 'Gasolina 95 E10': 'g95e10', 'Gasolina 95 E5 Premium': 'g95p', 'Gasolina 98 E5': 'g98', 'Bioetanol': 'bioet',
  'Gases licuados del petróleo': 'glp', 'Gas Natural Comprimido': 'gnc', 'Gas Natural Licuado': 'gnl', 'Hidrogeno': 'h2',
};
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const CAMPOS_N: Record<string, string> = Object.fromEntries(Object.entries(CAMPOS).map(([k, v]) => [norm(k), v]));

// Comprueba la sesión con Supabase (firma incluida), no solo leyendo el token: así no depende de que la función
// se publique con la verificación de JWT activada.
async function conSesion(req: Request): Promise<boolean> {
  const t = (req.headers.get('Authorization') || '').replace(/^Bearer /i, '');
  if (!t) return false;
  try { const { data, error } = await sb.auth.getUser(t); return !error && !!data?.user; } catch { return false; }
}
async function getJson(url: string, init: RequestInit = {}, ms = 30000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { ...init, signal: ctl.signal }); const text = await r.text(); let data: any = null; try { data = JSON.parse(text); } catch { /* */ } return { ok: r.ok, status: r.status, data }; }
  catch (e) { return { ok: false, status: 0, data: null, err: String((e as Error)?.message || e).slice(0, 200) }; } finally { clearTimeout(t); }
}
const mediana = (xs: number[]) => { const a = xs.slice().sort((x, y) => x - y), m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };

let ultimoIntento = 0; // si el Ministerio falla, no se reintenta en esta instancia hasta pasados 15 minutos
async function refrescar() {
  const fecha = hoyMadrid();
  const { count } = await sb.from('precios_carburante').select('*', { count: 'exact', head: true }).eq('fecha', fecha);
  if (count && count > 0) return { ok: true, fecha, ya: true };
  if (Date.now() - ultimoIntento < 15 * 60e3) return { error: 'reintento_pronto' };
  ultimoIntento = Date.now();
  const r = await getJson(MINISTERIO, { headers: { Accept: 'application/json' } }, 60000);
  const lista: any[] = r.data?.ListaEESSPrecio || [];
  if (!lista.length) return { error: 'sin_datos' };
  const por: Record<string, Record<string, number[]>> = {}; // provincia → producto → precios
  for (const e of lista) {
    if (e['Tipo Venta'] && e['Tipo Venta'] !== 'P') continue; // solo venta al público
    const prov = String(e.IDProvincia || '').padStart(2, '0');
    for (const [k, v] of Object.entries(e)) {
      if (!k.startsWith('Precio ')) continue;
      const prod = CAMPOS_N[norm(k.slice(7))]; const p = Number(String(v || '').replace(',', '.'));
      if (!prod || !(p > 0.2 && p < 40)) continue;
      for (const pv of [prov, 'ES']) ((por[pv] = por[pv] || {})[prod] = por[pv][prod] || []).push(p);
    }
  }
  const filas: any[] = [];
  for (const [provincia, ps] of Object.entries(por)) for (const [producto, xs] of Object.entries(ps)) filas.push({ fecha, provincia, producto, precio: Math.round(mediana(xs) * 1000) / 1000, gasolineras: xs.length });
  // Luz en casa: media del día de la tarifa regulada (PVPC) de Red Eléctrica, en €/kWh. Si falla, la app usa su valor orientativo.
  const luz = await getJson('https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real?start_date=' + fecha + 'T00:00&end_date=' + fecha + 'T23:59&time_trunc=hour');
  const serie = (luz.data?.included || []).find((x: any) => /pvpc/i.test(x?.attributes?.title || '') || /pvpc/i.test(x?.type || ''));
  const vals = (serie?.attributes?.values || []).map((x: any) => Number(x.value)).filter((x: number) => x > 0);
  if (vals.length) filas.push({ fecha, provincia: 'ES', producto: 'eCasa', precio: Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) / 1000, gasolineras: null });
  const { error } = await sb.from('precios_carburante').upsert(filas, { onConflict: 'fecha,provincia,producto' });
  if (error) return { error: 'guardar' };
  // Solo se guardan 60 días
  const d = new Date(fecha + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - 60);
  await sb.from('precios_carburante').delete().lt('fecha', d.toISOString().slice(0, 10));
  return { ok: true, fecha, filas: filas.length };
}

async function distancia(de: string, a: string) {
  const key = Deno.env.get('ORS_KEY') || '';
  if (!key) return { error: 'sin_clave' };
  const geo = async (txt: string) => {
    const r = await getJson('https://api.openrouteservice.org/geocode/search?size=1&text=' + encodeURIComponent(txt), { headers: { Authorization: key } });
    if (r.status === 429) throw new Error('limite');
    const f = r.data?.features?.[0]; return f ? { c: f.geometry.coordinates, label: String(f.properties?.locality || f.properties?.name || '').slice(0, 60) } : null;
  };
  try {
    const p1 = await geo(de); if (!p1) return { error: 'no_encontrado_de' };
    const p2 = await geo(a); if (!p2) return { error: 'no_encontrado_a' };
    const r = await getJson('https://api.openrouteservice.org/v2/directions/driving-car', { method: 'POST', headers: { Authorization: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ coordinates: [p1.c, p2.c] }) });
    if (r.status === 429) return { error: 'limite' };
    const m = r.data?.routes?.[0]?.summary?.distance;
    if (!(m > 0)) return { error: 'sin_ruta' };
    return { km: Math.round(m / 100) / 10, desde: p1.label, hasta: p2.label };
  } catch (e) { return { error: (e as Error).message === 'limite' ? 'limite' : 'red' }; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (!(await conSesion(req))) return json({ error: 'sin_sesion' }, 401);
  let b: any = {}; try { b = await req.json(); } catch { /* */ }
  if (b.accion === 'refrescar') return json(await refrescar());
  if (b.accion === 'distancia') {
    const de = String(b.de || '').trim().slice(0, 120), a = String(b.a || '').trim().slice(0, 120);
    if (!de || !a) return json({ error: 'faltan' }, 400);
    return json(await distancia(de, a));
  }
  return json({ error: 'accion' }, 400);
});

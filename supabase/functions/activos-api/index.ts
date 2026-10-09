// API de activos para la app: buscar, registrar, precio en una fecha, valoración actual e histórico.
// Solo responde a usuarios con sesión iniciada. Protege el límite diario de EODHD.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json; charset=utf-8' };
const MONEDAS = ['USD', 'JPY', 'GBP', 'CHF', 'CAD', 'AUD', 'HKD', 'MXN', 'CNY', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'BRL', 'INR', 'KRW', 'SGD', 'NZD', 'TRY', 'ZAR'];
const LIMITE_DIARIO = 20;
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const eKey = () => Deno.env.get('EODHD_KEY') || '';
const iso = (d: Date) => d.toISOString().slice(0, 10);
const hoy = () => iso(new Date());
const restaDias = (f: string, n: number) => { const d = new Date(f + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return iso(d); };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: CORS });

function rol(req: Request): string | null {
  try { const t = (req.headers.get('Authorization') || '').replace(/^Bearer /i, ''); return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role || null; } catch { return null; }
}
async function getJson(url: string, ms = 25000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'urlife-activos/1.0' } });
    const text = await r.text(); let data: any = null; try { data = JSON.parse(text); } catch { /* */ }
    return { ok: r.ok, status: r.status, data, text };
  } catch (e) { return { ok: false, status: 0, data: null, text: String((e as Error).message || e) }; } finally { clearTimeout(t); }
}

// Contador de consultas a EODHD (plan gratuito: 20 al día). La actualización nocturna tiene prioridad.
async function gastar(n: number): Promise<boolean> {
  const dia = hoy();
  const { data: c } = await sb.from('consumo').select('eodhd').eq('dia', dia).maybeSingle();
  const usadas = c?.eodhd || 0;
  const { data: act } = await sb.from('actualizacion').select('ultima_ejecucion').eq('id', 1).single();
  const yaActualizado = act?.ultima_ejecucion && iso(new Date(act.ultima_ejecucion)) === dia;
  let reserva = 1;
  if (!yaActualizado) { const { count } = await sb.from('activos').select('*', { count: 'exact', head: true }).eq('proveedor', 'eodhd'); reserva += count || 0; }
  if (usadas + n > LIMITE_DIARIO - reserva) return false;
  await sb.from('consumo').upsert({ dia, eodhd: usadas + n });
  return true;
}

async function ecbRango(desde: string): Promise<number> {
  const r = await getJson('https://data-api.ecb.europa.eu/service/data/EXR/D.' + MONEDAS.join('+') + '.EUR.SP00.A?startPeriod=' + desde + '&format=jsondata');
  if (!r.ok || !r.data) return 0;
  const monedas = r.data.structure.dimensions.series[1].values.map((v: any) => v.id);
  const dias = r.data.structure.dimensions.observation[0].values.map((v: any) => v.id);
  const filas: { fecha: string; moneda: string; por_eur: number }[] = [];
  for (const [k, s] of Object.entries<any>(r.data.dataSets[0].series)) {
    const mon = monedas[Number(k.split(':')[1])];
    for (const [i, o] of Object.entries<any>(s.observations)) filas.push({ fecha: dias[Number(i)], moneda: mon, por_eur: Number(o[0]) });
  }
  if (filas.length) await sb.from('divisas').upsert(filas, { onConflict: 'fecha,moneda' });
  return filas.length;
}

// Trae precios del proveedor desde una fecha y los guarda. Devuelve 'ok' | 'limite' | 'error'.
async function traerPrecios(a: any, desde: string): Promise<'ok' | 'limite' | 'error'> {
  if (a.proveedor === 'eodhd') {
    if (!eKey()) return 'error';
    if (!(await gastar(1))) return 'limite';
    const r = await getJson('https://eodhd.com/api/eod/' + encodeURIComponent(a.ref_proveedor) + '?from=' + desde + '&period=d&fmt=json&api_token=' + eKey());
    if (!r.ok || !Array.isArray(r.data)) return 'error';
    const filas = r.data.filter((x: any) => x && x.close != null).map((x: any) => ({ activo_id: a.id, fecha: x.date, cierre: Number(x.close) }));
    if (filas.length) await sb.from('precios').upsert(filas, { onConflict: 'activo_id,fecha' });
    return 'ok';
  }
  if (a.proveedor === 'coingecko') {
    const from = Math.floor(new Date(desde + 'T00:00:00Z').getTime() / 1000), to = Math.floor(Date.now() / 1000);
    const r = await getJson('https://api.coingecko.com/api/v3/coins/' + encodeURIComponent(a.ref_proveedor) + '/market_chart/range?vs_currency=eur&from=' + from + '&to=' + to);
    if (!r.ok || !r.data || !Array.isArray(r.data.prices)) return 'error';
    const porDia: Record<string, number> = {};
    for (const [ts, p] of r.data.prices) porDia[iso(new Date(ts))] = Number(p);
    const filas = Object.entries(porDia).map(([fecha, cierre]) => ({ activo_id: a.id, fecha, cierre }));
    if (filas.length) await sb.from('precios').upsert(filas, { onConflict: 'activo_id,fecha' });
    return 'ok';
  }
  return 'error';
}

// Convierte el precio a euros con el cambio de la fecha del precio. GBX = peniques.
async function aEuros(moneda: string, cierre: number, fecha: string): Promise<{ cierre_eur: number; por_eur: number; fecha_fx: string | null } | null> {
  let m = moneda, c = cierre;
  if (m === 'GBX' || m === 'GBp') { m = 'GBP'; c = c / 100; }
  if (m === 'EUR') return { cierre_eur: c, por_eur: 1, fecha_fx: null };
  const buscar = async () => (await sb.from('divisas').select('fecha,por_eur').eq('moneda', m).lte('fecha', fecha).gte('fecha', restaDias(fecha, 10)).order('fecha', { ascending: false }).limit(1)).data;
  let fx = await buscar();
  if (!fx || !fx.length) { await ecbRango(restaDias(fecha, 10)); fx = await buscar(); }
  if (!fx || !fx.length) return null;
  return { cierre_eur: c / Number(fx[0].por_eur), por_eur: Number(fx[0].por_eur), fecha_fx: fx[0].fecha };
}

async function precioEn(a: any, fecha: string) {
  const consulta = async () => (await sb.from('precios').select('fecha,cierre').eq('activo_id', a.id).lte('fecha', fecha).gte('fecha', restaDias(fecha, 10)).order('fecha', { ascending: false }).limit(1)).data;
  let p = await consulta();
  if (!p || !p.length) {
    const st = await traerPrecios(a, restaDias(fecha, 10));
    if (st === 'limite') return { error: 'limite' };
    p = await consulta();
  }
  if (!p || !p.length) return { error: 'sin_precio' };
  const eur = await aEuros(a.moneda, Number(p[0].cierre), p[0].fecha);
  if (!eur) return { error: 'sin_divisa' };
  return { fecha_precio: p[0].fecha, cierre: Number(p[0].cierre), moneda: a.moneda, ...eur };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (rol(req) !== 'authenticated') return json({ error: 'no_autorizado' }, 401);
  let b: any = {};
  try { b = await req.json(); } catch { /* */ }
  const accion = b.accion;

  if (accion === 'listar') {
    const { data } = await sb.from('activos').select('id,isin,simbolo,nombre,tipo,moneda').order('nombre');
    return json({ activos: data || [] });
  }

  if (accion === 'buscar') {
    const q = String(b.q || '').trim().slice(0, 60);
    if (q.length < 2) return json({ resultados: [] });
    const like = '%' + q.replace(/[%_,()]/g, ' ') + '%';
    const { data: cat } = await sb.from('activos').select('id,isin,simbolo,nombre,tipo,moneda,proveedor,ref_proveedor').or('nombre.ilike.' + like + ',simbolo.ilike.' + like + ',isin.ilike.' + like).limit(8);
    const enCatalogo = (cat || []).map((x: any) => ({ activo_id: x.id, proveedor: x.proveedor, ref: x.ref_proveedor, simbolo: x.simbolo, nombre: x.nombre, tipo: x.tipo, moneda: x.moneda, isin: x.isin, catalogo: true }));
    if (enCatalogo.length && !b.externo) return json({ resultados: enCatalogo, hayMas: true });
    const resultados: any[] = [...enCatalogo];
    let limite = false;
    const [ext, cg] = await Promise.all([
      (async () => {
        if (!eKey()) return [];
        if (!(await gastar(1))) { limite = true; return []; }
        const r = await getJson('https://eodhd.com/api/search/' + encodeURIComponent(q) + '?limit=15&fmt=json&api_token=' + eKey());
        return r.ok && Array.isArray(r.data) ? r.data : [];
      })(),
      (async () => { const r = await getJson('https://api.coingecko.com/api/v3/search?query=' + encodeURIComponent(q)); return r.ok && r.data && Array.isArray(r.data.coins) ? r.data.coins.slice(0, 4) : []; })(),
    ]);
    const tipos: Record<string, string> = { 'ETF': 'ETF', 'Common Stock': 'Acción', 'Preferred Stock': 'Acción', 'FUND': 'Fondo' };
    const pref = ['XETRA', 'US', 'MI', 'PA', 'AS', 'LSE', 'HK', 'F', 'MC', 'SW', 'STU'];
    const vistos = new Set(enCatalogo.map((x: any) => x.ref));
    ext.filter((x: any) => tipos[x.Type]).sort((x: any, y: any) => (pref.indexOf(x.Exchange) + 99) % 100 - (pref.indexOf(y.Exchange) + 99) % 100).forEach((x: any) => {
      const ref = x.Code + '.' + x.Exchange; if (vistos.has(ref)) return; vistos.add(ref);
      resultados.push({ proveedor: 'eodhd', ref, simbolo: x.Code, nombre: x.Name, tipo: tipos[x.Type], moneda: x.Currency, isin: x.ISIN || null, bolsa: x.Exchange });
    });
    cg.forEach((c: any) => { if (!vistos.has(c.id)) resultados.push({ proveedor: 'coingecko', ref: c.id, simbolo: String(c.symbol || '').toUpperCase(), nombre: c.name, tipo: 'Criptomoneda', moneda: 'EUR' }); });
    return json({ resultados, limite });
  }

  if (accion === 'registrar') {
    const proveedor = b.proveedor, ref = String(b.ref || '').slice(0, 60);
    if (!['eodhd', 'coingecko'].includes(proveedor) || !ref) return json({ error: 'datos_invalidos' }, 400);
    const { data: ya } = await sb.from('activos').select('id,simbolo,nombre,tipo,moneda,isin').eq('proveedor', proveedor).eq('ref_proveedor', ref).maybeSingle();
    if (ya) return json({ activo: ya });
    const moneda = proveedor === 'coingecko' ? 'EUR' : String(b.moneda || '').toUpperCase();
    const okMoneda = moneda === 'EUR' || moneda === 'GBX' || MONEDAS.includes(moneda);
    if (!okMoneda) return json({ error: 'moneda_no_soportada', moneda }, 400);
    const fila = { isin: b.isin ? String(b.isin).slice(0, 12) : null, simbolo: String(b.simbolo || ref).slice(0, 20), nombre: String(b.nombre || ref).slice(0, 120), tipo: String(b.tipo || 'Otro').slice(0, 20), moneda, proveedor, ref_proveedor: ref };
    const { data: nuevo, error } = await sb.from('activos').insert(fila).select('id,simbolo,nombre,tipo,moneda,isin').single();
    if (error) return json({ error: 'no_se_pudo_guardar' }, 500);
    return json({ activo: nuevo });
  }

  if (accion === 'precio_en') {
    const fecha = String(b.fecha || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha > hoy()) return json({ error: 'fecha_invalida' }, 400);
    const { data: a } = await sb.from('activos').select('*').eq('id', b.activo_id).maybeSingle();
    if (!a) return json({ error: 'activo_no_existe' }, 404);
    return json(await precioEn(a, fecha));
  }

  if (accion === 'valorar') {
    const ids: string[] = Array.isArray(b.ids) ? b.ids.slice(0, 60) : [];
    const salida: Record<string, unknown> = {};
    for (const id of ids) {
      const { data: a } = await sb.from('activos').select('id,simbolo,nombre,tipo,moneda').eq('id', id).maybeSingle();
      if (!a) continue;
      const { data: p } = await sb.from('precios').select('fecha,cierre').eq('activo_id', id).order('fecha', { ascending: false }).limit(1);
      if (!p || !p.length) { salida[id] = { activo: a, sin_precio: true }; continue; }
      const eur = await aEuros(a.moneda, Number(p[0].cierre), p[0].fecha);
      salida[id] = { activo: a, fecha_precio: p[0].fecha, cierre: Number(p[0].cierre), moneda: a.moneda, ...(eur || {}) };
    }
    return json({ valores: salida });
  }

  // Histórico para el gráfico: completa precios y divisas desde una fecha (solo la primera vez por activo)
  // y devuelve los cierres diarios ya convertidos a euros.
  if (accion === 'historico') {
    const ids: string[] = Array.isArray(b.ids) ? b.ids.slice(0, 60) : [];
    let desde = String(b.desde || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) return json({ error: 'fecha_invalida' }, 400);
    const minimo = restaDias(hoy(), 365 * 3);
    if (desde < minimo) desde = minimo;
    const { data: acts } = await sb.from('activos').select('*').in('id', ids);
    const lista = acts || [];
    let limite = false;
    const incompletos: string[] = [];
    // 1) precios: una sola descarga por activo (queda anotado en historico_desde)
    for (const a of lista) {
      if (a.historico_desde && a.historico_desde <= desde) continue;
      const st = await traerPrecios(a, restaDias(desde, 7));
      if (st === 'ok') { await sb.from('activos').update({ historico_desde: desde }).eq('id', a.id); a.historico_desde = desde; }
      else { if (st === 'limite') limite = true; incompletos.push(a.id); }
    }
    // 2) divisas: si no cubren el periodo, se piden al BCE (gratis, sin límite)
    const monedas = [...new Set(lista.map((a: any) => (a.moneda === 'GBX' || a.moneda === 'GBp') ? 'GBP' : a.moneda).filter((m: string) => m && m !== 'EUR'))];
    const fx: Record<string, { fecha: string; por_eur: number }[]> = {};
    if (monedas.length) {
      const { data: mins } = await sb.from('divisas').select('fecha').in('moneda', monedas).lte('fecha', restaDias(desde, -3)).limit(1);
      if (!mins || !mins.length) await ecbRango(restaDias(desde, 10));
      for (const m of monedas) {
        const { data } = await sb.from('divisas').select('fecha,por_eur').eq('moneda', m).gte('fecha', restaDias(desde, 10)).order('fecha').range(0, 4999);
        fx[m] = (data || []).map((x: any) => ({ fecha: x.fecha, por_eur: Number(x.por_eur) }));
      }
    }
    // 3) series diarias en euros
    const series: Record<string, [string, number][]> = {};
    for (const a of lista) {
      const { data: ps } = await sb.from('precios').select('fecha,cierre').eq('activo_id', a.id).gte('fecha', restaDias(desde, 7)).order('fecha').range(0, 4999);
      let m = a.moneda, div = 1;
      if (m === 'GBX' || m === 'GBp') { m = 'GBP'; div = 100; }
      const tabla = m === 'EUR' ? null : (fx[m] || []);
      let j = 0, ultimo: number | null = null;
      const out: [string, number][] = [];
      for (const p of ps || []) {
        let c = Number(p.cierre) / div;
        if (tabla) {
          while (j < tabla.length && tabla[j].fecha <= p.fecha) { ultimo = tabla[j].por_eur; j++; }
          if (ultimo == null) continue;
          c = c / ultimo;
        }
        out.push([p.fecha, Math.round(c * 1e6) / 1e6]);
      }
      series[a.id] = out;
    }
    return json({ desde, series, limite, incompletos });
  }

  return json({ error: 'accion_desconocida' }, 400);
});

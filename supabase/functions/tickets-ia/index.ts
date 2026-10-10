// Lectura de tickets con IA (bloque 8B): recibe la foto, la manda a Claude y devuelve los artículos.
// La foto NO se guarda en ningún sitio. Límite de lecturas al mes por persona.
// Necesita el secreto ANTHROPIC_API_KEY (se configura en Supabase → Edge Functions → Secrets).
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json; charset=utf-8' };
const LIMITE_MES = 60;
const MODELOS = { rapido: 'claude-haiku-5-5', preciso: 'claude-sonnet-5-5' };
const MAX_B64 = 7_000_000; // ~5 MB de imagen
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: CORS });

const ESQUEMA = {
  type: 'object',
  properties: {
    es_ticket: { type: 'boolean', description: 'true si la imagen es un ticket, recibo o factura de compra legible' },
    comercio: { type: 'string', description: 'Nombre comercial de la tienda o restaurante, corto (p. ej. «Mercadona», «Pizzería Luigi»)' },
    fecha: { type: 'string', description: 'Fecha de la compra en formato AAAA-MM-DD, o cadena vacía si no aparece' },
    total: { type: 'number', description: 'Total pagado (lo que se cobró), en la moneda del ticket' },
    moneda: { type: 'string', description: 'Código ISO de la moneda, normalmente EUR' },
    categoria: { type: 'string', description: 'Una de las categorías de la lista que te doy, la que mejor encaje con la compra, o cadena vacía' },
    articulos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'Nombre claro y corto del artículo, en español, deshaciendo abreviaturas evidentes' },
          cantidad: { type: 'number', description: 'Unidades (o kilos si va al peso)' },
          importe: { type: 'number', description: 'Importe total de la línea (cantidad × precio), ya con su descuento si lo tiene. Negativo si es un descuento' },
        },
        required: ['nombre', 'cantidad', 'importe'],
      },
    },
    notas: { type: 'string', description: 'Algo a tener en cuenta (texto ilegible, partes cortadas…), o cadena vacía' },
  },
  required: ['es_ticket', 'comercio', 'fecha', 'total', 'moneda', 'categoria', 'articulos', 'notas'],
};

function instrucciones(categorias: string[]) {
  return 'Lee este ticket de compra y devuelve sus datos con la herramienta registrar_ticket.\n' +
    'Reglas:\n' +
    '- Un artículo por línea de producto. «importe» es el total de esa línea (si pone 2 x 1,50 → cantidad 2, importe 3,00).\n' +
    '- Descuentos o promociones de una línea: réstalos de esa línea. Descuentos generales del ticket: añádelos como un artículo con importe negativo.\n' +
    '- No incluyas como artículos el desglose de IVA, la base imponible, el total, la forma de pago, el cambio ni las propinas no cobradas.\n' +
    '- «total» es lo que se pagó. La suma de los artículos debería coincidir con el total; si no coincide, no inventes líneas: explícalo en «notas».\n' +
    '- Nombres en español, claros y cortos (p. ej. «COCA COLA ZERO 33CL» → «Coca-Cola Zero 33 cl»).\n' +
    '- «categoria»: elige exactamente una de esta lista o deja cadena vacía: ' + JSON.stringify(categorias.slice(0, 40)) + '.\n' +
    '- Si la imagen no es un ticket o no se puede leer, es_ticket = false y la lista de artículos vacía.';
}

const num = (x: unknown) => { const n = Number(x); return isFinite(n) ? Math.round(n * 100) / 100 : 0; };
const txt = (x: unknown, max: number) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'metodo' }, 405);
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer /i, '');
  const { data: u } = await sb.auth.getUser(token);
  const user = u?.user;
  if (!user) return json({ error: 'sin_sesion' }, 401);

  let p: any; try { p = await req.json(); } catch { return json({ error: 'peticion' }, 400); }
  const imagen = String(p.imagen || ''), tipo = ['image/jpeg', 'image/png', 'image/webp'].includes(p.tipo) ? p.tipo : 'image/jpeg';
  if (!imagen || !/^[A-Za-z0-9+/=]+$/.test(imagen.slice(0, 200))) return json({ error: 'imagen' }, 400);
  if (imagen.length > MAX_B64) return json({ error: 'imagen_grande' }, 413);
  const categorias = Array.isArray(p.categorias) ? p.categorias.map((c: unknown) => txt(c, 40)).filter(Boolean) : [];
  const clave = Deno.env.get('ANTHROPIC_API_KEY') || '';

  // límite del mes
  const ahora = new Date(), inicioMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1)).toISOString();
  const { count } = await sb.from('tickets_uso').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', inicioMes);
  const usados = count || 0;
  if (usados >= LIMITE_MES) return json({ error: 'limite', usados, limite: LIMITE_MES });
  if (!clave) return json({ error: 'sin_clave' });

  const modelo = p.preciso ? MODELOS.preciso : MODELOS.rapido;
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 55000);
  let r: any = null, cuerpo: any = null;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctl.signal,
      headers: { 'x-api-key': clave, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: modelo, max_tokens: 4096,
        tools: [{ name: 'registrar_ticket', description: 'Guarda los datos leídos del ticket', input_schema: ESQUEMA }],
        tool_choice: { type: 'tool', name: 'registrar_ticket' },
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: tipo, data: imagen } },
          { type: 'text', text: instrucciones(categorias) },
        ] }],
      }),
    });
    cuerpo = await r.json().catch(() => null);
  } catch (e) {
    await sb.from('tickets_uso').insert({ user_id: user.id, modelo, ok: false });
    return json({ error: 'ia_error', detalle: String((e as Error).message || e).slice(0, 200) });
  } finally { clearTimeout(t); }

  const usoTok = cuerpo?.usage || {};
  if (!r.ok) {
    await sb.from('tickets_uso').insert({ user_id: user.id, modelo, ok: false });
    const tipoErr = cuerpo?.error?.type || '';
    return json({ error: r.status === 401 || tipoErr === 'authentication_error' ? 'clave_mala' : r.status === 400 && /credit|billing/i.test(JSON.stringify(cuerpo)) ? 'sin_saldo' : 'ia_error', detalle: (cuerpo?.error?.message || '').slice(0, 200) });
  }
  const bloque = (cuerpo?.content || []).find((b: any) => b.type === 'tool_use');
  const d = bloque?.input || {};
  await sb.from('tickets_uso').insert({ user_id: user.id, modelo, ok: !!bloque, tokens_entrada: usoTok.input_tokens || null, tokens_salida: usoTok.output_tokens || null });
  if (!bloque) return json({ error: 'ia_error' });

  const articulos = (Array.isArray(d.articulos) ? d.articulos : []).slice(0, 150)
    .map((a: any) => ({ nombre: txt(a?.nombre, 80) || 'Artículo', cantidad: num(a?.cantidad) || 1, importe: num(a?.importe) }))
    .filter((a: any) => a.importe !== 0);
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(d.fecha || '')) ? d.fecha : '';
  return json({
    ticket: {
      es_ticket: d.es_ticket !== false && articulos.length > 0,
      comercio: txt(d.comercio, 60), fecha, total: num(d.total), moneda: txt(d.moneda, 3).toUpperCase() || 'EUR',
      categoria: categorias.includes(txt(d.categoria, 40)) ? txt(d.categoria, 40) : '', notas: txt(d.notas, 300), articulos,
    },
    modelo: p.preciso ? 'preciso' : 'rapido', usados: usados + 1, limite: LIMITE_MES,
  });
});

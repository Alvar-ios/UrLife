// «Avisos del banco» con la app cerrada (docs/40 C3; diseño de Datos y Seguridad: docs/salud/2026-11-12-avisos-datos.md §3).
// El móvil manda su clave propia (cabecera x-palomapp-clave). Aquí se calcula su SHA-256 y se busca el móvil activo:
// el usuario sale SIEMPRE de esa fila, nunca de la petición. Solo dos acciones:
//   · guardar: un movimiento Gasto/Ingreso con origen 'aviso' (lista cerrada de campos; un reintento con el mismo id no duplica).
//   · deshacer: borra UNA fila de ese usuario con ese id, origen 'aviso' y de los últimos 7 días.
// Freno: 50 al día por móvil. No registra nada salvo códigos de error. Publicada SIN «Verify JWT» (no hay sesión).
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json; charset=utf-8' };
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: CORS });
const MAX_DIA = 50;

async function sha256(t: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
const texto = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const hoyMadrid = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
const dias = (a: string, b: string) => Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / 864e5);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'metodo' }, 405);
  const clave = (req.headers.get('x-palomapp-clave') || '').trim();
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(clave)) return json({ error: 'clave' }, 401);
  const { data: disp, error: e0 } = await sb.from('avisos_dispositivos').select('id,user_id,guardados_dia,guardados_n').eq('clave_hash', await sha256(clave)).eq('activo', true).maybeSingle();
  if (e0) { console.error('buscar', e0.code); return json({ error: 'interno' }, 500); }
  if (!disp) return json({ error: 'clave' }, 401);
  const uid = disp.user_id;

  let p: any; try { p = await req.json(); } catch { return json({ error: 'peticion' }, 400); }
  const id = texto(p?.id, 64);
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return json({ error: 'id' }, 400);

  if (p.accion === 'deshacer') {
    const desde = Date.now() - 7 * 864e5;
    const { data, error } = await sb.from('movimientos').delete().eq('user_id', uid).eq('id', id).eq('origen', 'aviso').gte('creado_en', desde).select('id');
    if (error) { console.error('deshacer', error.code); return json({ error: 'interno' }, 500); }
    return json({ ok: true, borrados: (data || []).length });
  }
  if (p.accion !== 'guardar') return json({ error: 'accion' }, 400);

  const tipo = p.tipo === 'Ingreso' ? 'Ingreso' : p.tipo === 'Gasto' ? 'Gasto' : null;
  const importe = Math.round(Number(p.importe) * 100) / 100;
  const hoy = hoyMadrid(), fecha = texto(p.fecha, 10);
  if (!tipo || !(importe > 0) || importe > 1_000_000) return json({ error: 'importe' }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Math.abs(dias(fecha, hoy)) > 7) return json({ error: 'fecha' }, 400);

  // freno diario por móvil
  const n = disp.guardados_dia === hoy ? disp.guardados_n : 0;
  if (n >= MAX_DIA) return json({ error: 'tope' }, 429);

  const fila: Record<string, unknown> = {
    id, user_id: uid, tipo, importe, fecha,
    categoria: texto(p.categoria, 40) || (tipo === 'Ingreso' ? 'Otros ingresos' : 'Otros'),
    descripcion: texto(p.descripcion, 80), metodo_pago: texto(p.metodo_pago, 30),
    creado_en: Number.isFinite(Number(p.creado_en)) ? Math.round(Number(p.creado_en)) : Date.now(),
    origen: 'aviso',
  };
  const cta = texto(p.cuenta_id, 64); if (/^[A-Za-z0-9_-]{1,64}$/.test(cta)) fila.cuenta_id = cta;
  const { error: e1 } = await sb.from('movimientos').upsert(fila, { onConflict: 'id', ignoreDuplicates: true });
  if (e1) { console.error('guardar', e1.code); return json({ error: 'interno' }, 500); }
  await sb.from('avisos_dispositivos').update({ guardados_dia: hoy, guardados_n: n + 1, visto: new Date().toISOString() }).eq('id', disp.id);
  return json({ ok: true });
});

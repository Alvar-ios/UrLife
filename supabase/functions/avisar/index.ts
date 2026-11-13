// Avisos de Juntos con la app cerrada (Firebase Cloud Messaging). supabase/migrations/2026-11-13_avisos_juntos.sql.
// La llaman SOLO los disparadores de la base de datos (avisar_compartido, avisar_miembro) con pg_net y la cabecera x-avisar,
// que se comprueba contra el secreto «avisar_secreto» de Vault (avisar_secreto_ok). Publicada SIN «Verify JWT».
// Eventos: { evento: 'compartido', id }  ·  { evento: 'miembro', grupo_id, user_id, por }
// Todo se vuelve a leer de la base de datos con service_role: del evento solo se fía el id (y «por» al entrar en un grupo).
// Secreto necesario: FCM_SERVICE_ACCOUNT (JSON de la cuenta de servicio de Firebase). No registra datos personales.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { MAX_DIA, claveAviso, datosAviso, destinatariosCompartido, destinatariosMiembro, enSilencio, mensajeFCM, prefsAvisos, textoAviso, tokenMalo } from './logica.js';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ---- OAuth de Google con la cuenta de servicio (JWT RS256 firmado aquí), cacheado ~50 min ---- */
let cuenta: { client_email: string; private_key: string; project_id: string } | null = null;
let acceso: { token: string; hasta: number } | null = null;
const b64url = (b: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof b === 'string' ? new TextEncoder().encode(b) : new Uint8Array(b as ArrayBuffer);
  let s = ''; bytes.forEach((x) => { s += String.fromCharCode(x); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
function leerCuenta() {
  if (cuenta) return cuenta;
  const raw = Deno.env.get('FCM_SERVICE_ACCOUNT'); if (!raw) throw new Error('sin_cuenta_fcm');
  const c = JSON.parse(raw); if (!c.client_email || !c.private_key || !c.project_id) throw new Error('cuenta_fcm_mal');
  cuenta = c; return c;
}
async function tokenGoogle(): Promise<string> {
  if (acceso && acceso.hasta > Date.now()) return acceso.token;
  const c = leerCuenta(), ahora = Math.floor(Date.now() / 1000);
  const cab = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const cuerpo = b64url(JSON.stringify({ iss: c.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: ahora, exp: ahora + 3600 }));
  const pem = c.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (ch) => ch.charCodeAt(0));
  const clave = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', clave, new TextEncoder().encode(cab + '.' + cuerpo));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: cab + '.' + cuerpo + '.' + b64url(firma) }) });
  if (!r.ok) throw new Error('oauth_' + r.status);
  const j = await r.json();
  acceso = { token: j.access_token, hasta: Date.now() + 50 * 60 * 1000 };
  return acceso.token;
}
async function enviar(msg: unknown): Promise<{ ok: boolean; malo: boolean; status: number }> {
  const c = leerCuenta();
  const r = await fetch(`https://fcm.googleapis.com/v1/projects/${c.project_id}/messages:send`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + await tokenGoogle(), 'Content-Type': 'application/json' }, body: JSON.stringify(msg) });
  if (r.ok) return { ok: true, malo: false, status: r.status };
  const t = await r.text().catch(() => '');
  if (r.status === 401) acceso = null;
  return { ok: false, malo: tokenMalo(r.status, t), status: r.status };
}

/* ---- secreto del disparador (se recuerda el último que valió) ---- */
let secretoBueno = '';
async function secretoOk(v: string) {
  if (!v || v.length < 32) return false;
  if (secretoBueno && v === secretoBueno) return true;
  const { data, error } = await sb.rpc('avisar_secreto_ok', { p_valor: v });
  if (error) { console.error('secreto', error.code); return false; }
  if (data === true) secretoBueno = v;
  return data === true;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'metodo' }, 405);
  if (!(await secretoOk((req.headers.get('x-avisar') || '').trim()))) return json({ error: 'no' }, 401);
  let ev: any; try { ev = await req.json(); } catch { return json({ error: 'peticion' }, 400); }

  // 1. Datos del evento
  let gid = '', dest: any[] = [], gasto: any = null;
  if (ev?.evento === 'compartido' && UUID.test(String(ev.id || ''))) {
    const { data: c, error } = await sb.from('compartidos').select('id,grupo_id,tipo,descripcion,categoria,importe,pagado_por,reparto,creado_por,borrado').eq('id', ev.id).maybeSingle();
    if (error) { console.error('gasto', error.code); return json({ error: 'interno' }, 500); }
    if (!c) return json({ ok: true, enviados: 0 });
    gid = c.grupo_id; gasto = c;
  } else if (ev?.evento === 'miembro' && UUID.test(String(ev.grupo_id || '')) && UUID.test(String(ev.user_id || '')) && UUID.test(String(ev.por || ''))) {
    gid = ev.grupo_id;
  } else return json({ error: 'evento' }, 400);

  const [{ data: g }, { data: miembros }, { data: invitados }] = await Promise.all([
    sb.from('grupos').select('id,nombre,tipo,cerrado').eq('id', gid).maybeSingle(),
    sb.from('grupo_miembros').select('user_id,nombre,baja').eq('grupo_id', gid),
    sb.from('grupo_invitados').select('id,reclamado_por').eq('grupo_id', gid).not('reclamado_por', 'is', null),
  ]);
  if (!g || g.cerrado) return json({ ok: true, enviados: 0 });
  dest = gasto ? destinatariosCompartido(gasto, miembros, invitados) : destinatariosMiembro(ev, miembros);
  if (!dest.length) return json({ ok: true, enviados: 0 });

  // 2. Preferencias (Tú → Avisos → Juntos) y móviles con token
  const uids = [...new Set(dest.map((d) => d.uid))];
  const [{ data: cfgs }, { data: moviles }] = await Promise.all([
    sb.from('config').select('user_id,avisos:value->avisos,herramientas:value->herramientas').eq('key', 'app').in('user_id', uids),
    sb.from('avisos_dispositivos').select('id,user_id,token,idioma,zona').in('user_id', uids).eq('activo', true).not('token', 'is', null),
  ]);
  const prefs: Record<string, { juntos: boolean; silencio: boolean }> = {};
  (cfgs || []).forEach((r: any) => { prefs[r.user_id] = prefsAvisos(r.avisos, r.herramientas); });
  const nombres: Record<string, string> = {}; (miembros || []).forEach((m: any) => { nombres[m.user_id] = m.nombre; });
  const ctx = { grupo: { nombre: g.nombre, tipo: g.tipo }, nombres, gasto: gasto ? { descripcion: gasto.descripcion, categoria: gasto.categoria } : null };
  const dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());

  let enviados = 0, quitados = 0;
  for (const d of dest) {
    const p = prefs[d.uid] || prefsAvisos(null);
    const suyos = (moviles || []).filter((m: any) => m.user_id === d.uid);
    if (!p.juntos || !suyos.length) continue;
    // 3. Freno (20 al día) y no repetir
    const { data: vale, error: e2 } = await sb.rpc('avisar_apuntar', { p_user: d.uid, p_clave: claveAviso(ev, d, dia), p_max: MAX_DIA });
    if (e2) { console.error('apuntar', e2.code); continue; }
    if (vale !== true) continue;
    const datos = datosAviso({ ...ev, grupo_id: gid }, d);
    for (const m of suyos) {
      const txt = textoAviso(d, m.idioma === 'en' ? 'en' : 'es', ctx); if (!txt) continue;
      const noche = p.silencio && enSilencio(m.zona);
      try {
        const r = await enviar(mensajeFCM(m.token, txt, datos, noche));
        if (r.ok) enviados++;
        else if (r.malo) { await sb.from('avisos_dispositivos').update({ token: null }).eq('id', m.id).eq('token', m.token); quitados++; }
        else console.error('fcm', r.status);
      } catch (e) { console.error('fcm', (e as Error).message); }
    }
  }
  return json({ ok: true, enviados, quitados });
});

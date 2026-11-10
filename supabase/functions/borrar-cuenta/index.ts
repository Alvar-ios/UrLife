// «Borrar mi cuenta» (obligatorio en Google Play; docs/33-play-store.md §5). SIN DESPLEGAR.
// 1. Comprueba la sesión y usa SIEMPRE el id de la sesión (nunca uno que llegue en la petición).
// 2. Pide { confirmar: 'BORRAR' }.
// 3. Llama a borrar_cuenta_datos (solo service_role): si debe o le deben dinero en un grupo, no borra nada
//    y devuelve los grupos (409). Si no, borra lo personal y deja a la persona como baja en sus grupos.
// 4. Borrado SUAVE en Auth: deleteUser(id, true). Quita correo (lo cambia por un código), contraseña,
//    sesiones, verificación en dos pasos y datos de perfil, pero deja la fila de auth.users, así que NO
//    se disparan los borrados en cascada (grupos, grupo_miembros…). No se puede deshacer.
// 5. Repite borrar_cuenta_datos por si la app guardó algo entre 3 y 4 (no hace nada si ya está todo borrado).
// Sin claves en el código: solo las variables que Supabase pone a las funciones (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json; charset=utf-8' };
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: CORS });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'metodo' }, 405);

  const token = (req.headers.get('Authorization') || '').replace(/^Bearer /i, '').trim();
  if (!token) return json({ error: 'sin_sesion' }, 401);
  const { data: u, error: eu } = await sb.auth.getUser(token);
  const user = u?.user;
  if (eu || !user?.id) return json({ error: 'sin_sesion' }, 401);
  const id = user.id; // el de la sesión; cualquier id del cuerpo se ignora

  let p: any; try { p = await req.json(); } catch { return json({ error: 'peticion' }, 400); }
  if (!p || p.confirmar !== 'BORRAR') return json({ error: 'confirmar' }, 400);

  // Datos: primero, para que si algo falla la persona aún pueda entrar y volver a intentarlo.
  const { data: r, error: e1 } = await sb.rpc('borrar_cuenta_datos', { p_user: id });
  if (e1) { console.error('borrar_cuenta_datos', e1.message); return json({ error: 'datos' }, 500); }
  if (!r?.ok) return json({ error: r?.motivo || 'no_borrado', grupos: r?.grupos || [] }, 409);

  // Cuenta: borrado suave (true). NUNCA false: borraría la fila y, en cascada, sus filas de los grupos.
  const { error: e2 } = await sb.auth.admin.deleteUser(id, true);
  if (e2) { console.error('deleteUser', e2.message); return json({ error: 'cuenta', datos_borrados: true }, 500); }

  // Barrido final (por si la app guardó algo en estos segundos). Si falla, la cuenta ya está borrada: se avisa en el registro.
  const { error: e3 } = await sb.rpc('borrar_cuenta_datos', { p_user: id });
  if (e3) console.error('barrido final', e3.message);

  return json({ ok: true, borrado: r.borrado, grupos_baja: r.grupos_baja });
});

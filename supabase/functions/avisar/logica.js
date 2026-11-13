// Parte «pura» de la función avisar (sin red ni base de datos), para poder probarla con node (tests/test179_avisos_juntos.js).
// Decide quién recibe un aviso de Juntos y con qué texto (es/en), si es de noche para esa persona y cómo es el mensaje de FCM.
// Reglas: nunca se avisa a quien hizo la acción; solo a miembros activos con cuenta; personas sin cuenta nunca (no tienen móvil).

export const MAX_DIA = 20;

const r2 = (v) => Math.round(Number(v || 0) * 100) / 100;
const corto = (t, n) => { const s = String(t == null ? '' : t).replace(/[\u0000-\u001f]/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

// Personas sin cuenta cuyo sitio ocupó alguien: su id cuenta como el de quien lo ocupó
export function mapaAlias(invitados) {
  const m = {};
  (invitados || []).forEach((i) => { if (i && i.id && i.reclamado_por) m[i.id] = i.reclamado_por; });
  return m;
}
const real = (alias, id) => (id && alias[id]) || id;

// miembros: [{ user_id, nombre, baja }]  → solo los activos
function activos(miembros) {
  const m = {};
  (miembros || []).forEach((x) => { if (x && x.user_id && !x.baja) m[x.user_id] = x.nombre || ''; });
  return m;
}

/* Gasto compartido nuevo o pago para saldar. c = fila de compartidos (snake_case).
   Devuelve [{ uid, rol, importe, otro }]:
   · parte: te toca `importe` de un gasto que apuntó otro
   · pagaste: otro apuntó un gasto que pagaste tú (`importe` = total)
   · te_pagan: `otro` te ha pagado `importe`
   · apunto_pago: otro apuntó que pagaste `importe` (a `otro`) */
export function destinatariosCompartido(c, miembros, invitados) {
  if (!c || c.borrado) return [];
  const act = activos(miembros), alias = mapaAlias(invitados), autor = c.creado_por, out = [];
  const pagador = real(alias, c.pagado_por);
  if (c.tipo === 'Liquidación') {
    const k = Object.keys(c.reparto || {})[0], recibe = real(alias, k), imp = r2(c.reparto && k ? c.reparto[k] : c.importe) || r2(c.importe);
    if (!(imp > 0)) return [];
    if (recibe && recibe !== autor && act[recibe] != null && recibe !== pagador) out.push({ uid: recibe, rol: 'te_pagan', importe: imp, otro: pagador, autor });
    if (pagador && pagador !== autor && act[pagador] != null && pagador !== recibe) out.push({ uid: pagador, rol: 'apunto_pago', importe: imp, otro: recibe, autor });
    return out;
  }
  if (c.tipo !== 'Gasto') return [];
  const partes = {};
  Object.keys(c.reparto || {}).forEach((k) => { const u = real(alias, k); partes[u] = r2((partes[u] || 0) + Number(c.reparto[k] || 0)); });
  Object.keys(act).forEach((u) => {
    if (u === autor) return;
    if (u === pagador) { if (r2(c.importe) > 0) out.push({ uid: u, rol: 'pagaste', importe: r2(c.importe), otro: autor, autor }); return; }
    if (partes[u] > 0) out.push({ uid: u, rol: 'parte', importe: partes[u], otro: autor, autor });
  });
  return out;
}

/* Alguien entra en un grupo. ev = { user_id (quien entra), por (quien lo hizo) } */
export function destinatariosMiembro(ev, miembros) {
  const act = activos(miembros), nuevo = ev && ev.user_id, por = (ev && ev.por) || nuevo, out = [];
  if (!nuevo || act[nuevo] == null) return [];
  Object.keys(act).forEach((u) => { if (u !== nuevo && u !== por) out.push({ uid: u, rol: 'se_une', otro: nuevo }); });
  if (por !== nuevo) out.push({ uid: nuevo, rol: 'te_anaden', otro: por });
  return out;
}

export function dinero(v, idioma) {
  const n = r2(v), en = idioma === 'en';
  const [e, d] = Math.abs(n).toFixed(2).split('.');
  const miles = e.replace(/\B(?=(\d{3})+(?!\d))/g, en ? ',' : '.');
  return (n < 0 ? '-' : '') + (en ? '€' + miles + '.' + d : miles + ',' + d + ' €');
}

/* Texto de un aviso. ctx = { grupo: { nombre, tipo }, nombres: { uid: nombre }, gasto: { descripcion, categoria } }
   Devuelve { titulo, texto }. Con el móvil bloqueado Android oculta el texto (canal privado). */
export function textoAviso(d, idioma, ctx) {
  const en = idioma === 'en', g = (ctx && ctx.grupo) || {}, nom = (ctx && ctx.nombres) || {}, gasto = (ctx && ctx.gasto) || {};
  const quien = (u) => corto(nom[u], 30) || (en ? 'Someone' : 'Alguien');
  const directo = g.tipo === 'directo';
  const grupo = corto(g.nombre, 40);
  const titulo = directo || !grupo ? (en ? 'Shared' : 'Juntos') : grupo;
  const que = corto(gasto.descripcion, 40) || corto(gasto.categoria, 40) || (en ? 'an expense' : 'un gasto');
  const eur = (v) => dinero(v, idioma);
  let t = '';
  switch (d.rol) {
    case 'parte': t = en ? `${quien(d.otro)} added ${que} · your share ${eur(d.importe)}` : `${quien(d.otro)} apuntó ${que} · te toca ${eur(d.importe)}`; break;
    case 'pagaste': t = en ? `${quien(d.otro)} added ${que}, paid by you · ${eur(d.importe)}` : `${quien(d.otro)} apuntó ${que}, que pagaste tú · ${eur(d.importe)}`; break;
    case 'te_pagan': t = en ? `${quien(d.otro)} paid you ${eur(d.importe)}` : `${quien(d.otro)} te ha pagado ${eur(d.importe)}`; break;
    case 'apunto_pago': t = d.otro && d.otro !== d.autor
      ? (en ? `${quien(d.autor)} noted you paid ${eur(d.importe)} to ${quien(d.otro)}` : `${quien(d.autor)} apuntó que pagaste ${eur(d.importe)} a ${quien(d.otro)}`)
      : (en ? `${quien(d.autor)} noted you paid them ${eur(d.importe)}` : `${quien(d.autor)} apuntó que le pagaste ${eur(d.importe)}`); break;
    case 'se_une': t = directo ? (en ? `${quien(d.otro)} now shares expenses with you` : `${quien(d.otro)} ya comparte gastos contigo`)
      : (en ? `${quien(d.otro)} joined ${grupo || 'your group'}` : `${quien(d.otro)} se ha unido a ${grupo || 'tu grupo'}`); break;
    case 'te_anaden': t = en ? `${quien(d.otro)} added you to ${grupo || 'a group'}` : `${quien(d.otro)} te ha añadido a ${grupo || 'un grupo'}`; break;
    default: return null;
  }
  return { titulo, texto: t };
}

// ¿Es de noche (22:00–9:00) para alguien en esa zona horaria? Zona mala → Madrid.
export function enSilencio(zona, cuando) {
  const t = cuando instanceof Date ? cuando : new Date(cuando == null ? Date.now() : cuando);
  let h;
  try { h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: zona || 'Europe/Madrid', hour: '2-digit', hourCycle: 'h23' }).format(t)); }
  catch (e) { h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', hourCycle: 'h23' }).format(t)); }
  return h >= 22 || h < 9;
}

// Preferencias del usuario (config «app» → avisos y herramientas). Juntos y el silencio vienen encendidos;
// si la persona apagó la herramienta Juntos (Tú → Mis herramientas), tampoco hay avisos de Juntos.
export function prefsAvisos(avisos, herramientas) {
  const a = avisos && typeof avisos === 'object' ? avisos : {}, h = herramientas && typeof herramientas === 'object' ? herramientas : {};
  return { juntos: a.juntos !== false && h.juntos !== false, silencio: a.silencio !== false };
}

// Clave para no repetir el mismo aviso a la misma persona
export function claveAviso(ev, d, dia) {
  if (ev.evento === 'compartido') return 'c:' + ev.id + ':' + d.rol;
  return 'm:' + ev.grupo_id + ':' + ev.user_id + ':' + d.rol + ':' + dia;
}

// Qué abre el aviso al tocarlo: la persona (si es un gasto o pago) o el grupo
export function datosAviso(ev, d) {
  const o = { tipo: 'juntos', grupo: String(ev.grupo_id || ''), rol: d.rol };
  if (d.rol !== 'se_une' && d.rol !== 'te_anaden' && d.otro) o.persona = String(d.rol === 'apunto_pago' ? d.autor || d.otro : d.otro);
  return o;
}

// Mensaje de FCM HTTP v1. De noche (si la persona tiene el silencio puesto) va por el canal sin sonido.
export function mensajeFCM(token, txt, datos, noche) {
  return {
    message: {
      token,
      notification: { title: txt.titulo, body: txt.texto },
      data: datos,
      android: {
        priority: noche ? 'normal' : 'high',
        collapse_key: 'juntos',
        notification: { channel_id: noche ? 'juntos_noche' : 'juntos', icon: 'ic_stat_paloma', color: '#FFC93C', visibility: 'private', tag: datos.rol + ':' + (datos.grupo || '') + ':' + Date.now() },
      },
    },
  };
}

// ¿El token ya no vale? (app desinstalada, token caducado) → se borra de la base de datos
export function tokenMalo(status, cuerpo) {
  const s = typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo || {});
  return status === 404 || /UNREGISTERED/.test(s) || (status === 400 && /registration token/i.test(s));
}

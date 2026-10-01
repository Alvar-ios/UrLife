/* ============================================================
   CONFIGURACIÓN — copia este archivo y renómbralo a config.js
   ------------------------------------------------------------
   Los dos valores de aquí abajo NO son secretos: están pensados
   para ir en el navegador de cualquiera que use la app. Lo que
   protege tus datos no es ocultar estos valores, sino las reglas
   de seguridad (RLS) que ejecutamos en Supabase con el SQL.

   Dónde encontrarlos: panel de Supabase → tu proyecto →
   Project Settings (icono de engranaje) → API.
   - "Project URL"        -> SUPABASE_CONFIG.url
   - "anon" "public" key  -> SUPABASE_CONFIG.anonKey

   NUNCA copies aquí la clave "service_role": esa sí es secreta,
   da acceso total saltándose la seguridad, y no se usa en esta
   app para nada.
   ============================================================ */
window.SUPABASE_CONFIG = {
  url: 'https://TU-PROYECTO.supabase.co',
  anonKey: 'TU-CLAVE-ANON-PUBLICA',
};

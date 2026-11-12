package com.palomapp.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Guardar en tu cuenta lo leído de un aviso del banco aunque PalomApp esté cerrada (docs/40 C3;
 * diseño de Datos y Seguridad: docs/salud/2026-11-12-avisos-datos.md §3, opción b).
 * - El móvil tiene una CLAVE PROPIA (32 bytes al azar, solo en este móvil). Al servidor solo va su huella (SHA-256),
 *   apuntada por la web con avisos_registrar. La clave solo sirve para apuntar un movimiento «de aviso» y deshacerlo.
 * - Si no hay red o falla, no pasa nada: el pendiente sigue en la cola y la app lo guarda al abrirse.
 * - La categoría, la cuenta y la forma de pago salen de un «mapa» pequeño que deja la web (comercio → categoría…).
 */
public final class AvisosServidor {
    private AvisosServidor() {}
    private static final ExecutorService HILO = Executors.newSingleThreadExecutor();

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(AvisosBancoService.PREFS, Context.MODE_PRIVATE); }

    /** La clave de este móvil para esta cuenta (se crea la primera vez). Devuelve su huella SHA-256 en hex. */
    static String huella(Context ctx, String uid) throws Exception {
        SharedPreferences p = prefs(ctx);
        String k = "clave:" + uid, clave = p.getString(k, "");
        if (clave.isEmpty()) {
            byte[] b = new byte[32]; new SecureRandom().nextBytes(b);
            clave = Base64.encodeToString(b, Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
            p.edit().putString(k, clave).apply();
        }
        return sha256(clave);
    }

    static String sha256(String t) throws Exception {
        byte[] h = MessageDigest.getInstance("SHA-256").digest(t.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(); for (byte x : h) sb.append(String.format("%02x", x)); return sb.toString();
    }

    static void guardarEnSegundoPlano(Context ctx, String id) {
        final Context app = ctx.getApplicationContext();
        HILO.execute(() -> { try { guardar(app, id); } catch (Throwable t) { /* se guardará al abrir la app */ } });
    }

    static void deshacerEnSegundoPlano(Context ctx, String id, Runnable fin) {
        final Context app = ctx.getApplicationContext();
        HILO.execute(() -> { try { deshacer(app, id); } catch (Throwable t) { /* */ } if (fin != null) fin.run(); });
    }

    private static JSONObject buscar(JSONArray cola, String id) throws Exception {
        for (int i = 0; i < cola.length(); i++) if (id.equals(cola.getJSONObject(i).optString("id"))) return cola.getJSONObject(i);
        return null;
    }

    static void guardar(Context ctx, String id) throws Exception {
        SharedPreferences p = prefs(ctx);
        String uid = p.getString("uid", ""), url = p.getString("url", ""), anon = p.getString("anon", "");
        if (uid.isEmpty() || url.isEmpty() || !p.getBoolean("servidor", false)) return;
        String clave = p.getString("clave:" + uid, ""); if (clave.isEmpty()) return;
        JSONObject it;
        synchronized (AvisosBancoService.CANDADO) { it = buscar(new JSONArray(p.getString("cola", "[]")), id); }
        if (it == null || it.optBoolean("guardado") || !uid.equals(it.optString("uid"))) return;
        JSONObject mapa = new JSONObject(p.getString("mapa", "{}"));
        JSONObject cuerpo = new JSONObject().put("accion", "guardar").put("id", id)
            .put("tipo", it.optBoolean("entra") ? "Ingreso" : "Gasto").put("importe", it.optDouble("importe"))
            .put("fecha", new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date(it.optLong("ts"))))
            .put("descripcion", descripcion(it, mapa)).put("categoria", categoria(it, mapa))
            .put("metodo_pago", mapa.optJSONObject("metodos") != null ? mapa.optJSONObject("metodos").optString(it.optString("tipo"), "") : "")
            .put("creado_en", it.optLong("ts"));
        String cta = mapa.optJSONObject("cuentas") != null ? mapa.optJSONObject("cuentas").optString(it.optString("pkg"), "") : "";
        if (!cta.isEmpty()) cuerpo.put("cuenta_id", cta);
        int code = post(url, anon, clave, cuerpo);
        if (code == 200) marcar(p, id, true);
        else if (code == 401) p.edit().putBoolean("servidor", false).apply(); // clave retirada: deja de intentarlo hasta que la app la vuelva a apuntar
    }

    static void deshacer(Context ctx, String id) throws Exception {
        SharedPreferences p = prefs(ctx);
        boolean guardado;
        synchronized (AvisosBancoService.CANDADO) {
            JSONArray cola = new JSONArray(p.getString("cola", "[]")), queda = new JSONArray();
            JSONObject it = null;
            for (int i = 0; i < cola.length(); i++) { JSONObject o = cola.getJSONObject(i); if (id.equals(o.optString("id"))) it = o; else queda.put(o); }
            guardado = it != null && it.optBoolean("guardado");
            // se apunta como «deshecho» para que la app, si ya lo tenía, también lo quite
            JSONArray desh = new JSONArray(p.getString("deshechos", "[]")); desh.put(id);
            while (desh.length() > 50) desh.remove(0);
            p.edit().putString("cola", queda.toString()).putString("deshechos", desh.toString()).apply();
        }
        String uid = p.getString("uid", ""), url = p.getString("url", ""), anon = p.getString("anon", ""), clave = p.getString("clave:" + uid, "");
        if (!url.isEmpty() && !clave.isEmpty()) post(url, anon, clave, new JSONObject().put("accion", "deshacer").put("id", id));
    }

    private static void marcar(SharedPreferences p, String id, boolean guardado) throws Exception {
        synchronized (AvisosBancoService.CANDADO) {
            JSONArray cola = new JSONArray(p.getString("cola", "[]"));
            JSONObject it = buscar(cola, id); if (it == null) return;
            it.put("guardado", guardado);
            p.edit().putString("cola", cola.toString()).apply();
        }
    }

    // Igual que avisoAMov en app.js: en Bizum y transferencias no se guarda el nombre de nadie; en lo que entra, tampoco.
    static String descripcion(JSONObject it, JSONObject mapa) {
        String tipo = it.optString("tipo"); boolean entra = it.optBoolean("entra");
        if ("bizum".equals(tipo)) return entra ? "Bizum recibido" : "Bizum enviado";
        if ("transferencia".equals(tipo)) return entra ? "Transferencia recibida" : "Transferencia enviada";
        String c = entra ? "" : it.optString("comercio", "").trim();
        if (!c.isEmpty()) return c;
        switch (tipo) {
            case "nomina": return "Nómina"; case "devolucion": return "Devolución"; case "intereses": return "Intereses";
            case "dividendo": return "Dividendo"; case "cajero": return "Cajero"; case "recibo": return "Recibo";
            default: return (entra ? "Ingreso" : "Pago") + " · " + it.optString("app", "");
        }
    }

    static String categoria(JSONObject it, JSONObject mapa) {
        boolean entra = it.optBoolean("entra");
        JSONObject cats = mapa.optJSONObject("comercios");
        String c = it.optString("comercio", "").trim().toLowerCase(new Locale("es", "ES"));
        if (!entra && cats != null && !c.isEmpty()) { String k = cats.optString(c, ""); if (!k.isEmpty()) return k; }
        return mapa.optString(entra ? "catIngreso" : "catGasto", "");
    }

    private static int post(String url, String anon, String clave, JSONObject cuerpo) throws Exception {
        HttpURLConnection h = (HttpURLConnection) new URL(url + "/functions/v1/avisos-guardar").openConnection();
        try {
            h.setConnectTimeout(10000); h.setReadTimeout(15000); h.setRequestMethod("POST"); h.setDoOutput(true);
            h.setRequestProperty("Content-Type", "application/json");
            if (!anon.isEmpty()) { h.setRequestProperty("apikey", anon); h.setRequestProperty("Authorization", "Bearer " + anon); }
            h.setRequestProperty("x-palomapp-clave", clave);
            try (OutputStream o = h.getOutputStream()) { o.write(cuerpo.toString().getBytes(StandardCharsets.UTF_8)); }
            return h.getResponseCode();
        } finally { h.disconnect(); }
    }
}

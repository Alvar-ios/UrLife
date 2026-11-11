package com.palomapp.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.NumberFormat;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * «Avisos del banco» (docs/39 y 39b). Android avisa a este servicio de cada notificación del móvil.
 * - Si está apagado, no hace nada.
 * - Solo LEE las apps que el usuario ha marcado. De las demás, si un aviso parece un pago, solo se anota el NOMBRE de la app
 *   (para proponérsela); nunca el texto.
 * - El texto del aviso se lee aquí y se descarta: a la cola solo pasa importe, comercio, tipo, app y hora.
 * - La cola vive en el móvil (privada de la app), 7 días como mucho. La web la recoge al abrir PalomApp y la guarda en tu cuenta.
 */
public class AvisosBancoService extends NotificationListenerService {
    static final String PREFS = "avisos_banco";
    static final String CANAL = "apuntados";
    static final int ID_AVISO = 4201;
    static final long SIETE_DIAS = 7L * 24 * 3600 * 1000, DIEZ_MIN = 10L * 60 * 1000;

    static final Object CANDADO = new Object(); // el servicio y el plugin tocan la misma cola

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try { synchronized (CANDADO) { procesar(this, sbn); } } catch (Throwable t) { /* nunca romper el servicio por un aviso raro */ }
    }

    // Para proponer apps que faltan solo se miran apps con pinta de banco o de pagos (nunca WhatsApp, SMS, redes…)
    static boolean pareceBanco(String pkg) {
        return pkg.matches("(?i).*(bank|banco|banca|bancaria|caixa|caja|kutxa|rural|ibercaja|unicaja|abanca|bbva|santander|sabadell|bankinter|ingdirect|openbank|evobanco|n26|number26|revolut|bunq|wise|transferwise|paypal|wallet|pay|finanz|finance|money|cartera|trade|broker|invest|card|tarjeta|vivid|myinvestor|selfbank|deutsche|cetelem|cofidis|wizink).*")
            && !pkg.matches("(?i).*(whatsapp|telegram|messag|mms|sms|gmail|mail|facebook|instagram|twitter|tiktok|snapchat|discord|signal|slack|teams|outlook).*");
    }

    static void procesar(Context ctx, StatusBarNotification sbn) throws Exception {
        if (sbn == null || sbn.getNotification() == null) return;
        String pkg = sbn.getPackageName();
        if (pkg == null || pkg.equals(ctx.getPackageName())) return;
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!p.getBoolean("activo", false)) return;
        String uid = p.getString("uid", "");
        if (uid.isEmpty()) return; // sin sesión en PalomApp no se lee nada (así no pasa a la cuenta de otro)
        Notification n = sbn.getNotification();
        if ((n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return; // el resumen de grupo repite los avisos
        Bundle ex = n.extras;
        if (ex == null) return;
        String titulo = txt(ex.getCharSequence(Notification.EXTRA_TITLE));
        CharSequence big = ex.getCharSequence(Notification.EXTRA_BIG_TEXT);
        String texto = txt(big != null ? big : ex.getCharSequence(Notification.EXTRA_TEXT));
        LectorAvisos.Movimiento m = LectorAvisos.leer(pkg, titulo, texto);
        titulo = null; texto = null; // el texto no se guarda en ningún sitio
        if (m == null) return;

        Set<String> bancos = p.getStringSet("bancos", new HashSet<>());
        if (!bancos.contains(pkg)) { // app no marcada: solo se anota su nombre para proponerla (si tiene pinta de banco)
            if (!pareceBanco(pkg)) return;
            Set<String> cand = new HashSet<>(p.getStringSet("candidatos", new HashSet<>()));
            if (cand.add(pkg)) p.edit().putStringSet("candidatos", cand).apply();
            JSONObject nombres = new JSONObject(p.getString("nombres", "{}"));
            if (!nombres.has(pkg)) { nombres.put(pkg, etiqueta(ctx, ex, pkg)); p.edit().putString("nombres", nombres.toString()).apply(); }
            return;
        }

        long ahora = System.currentTimeMillis();
        JSONArray cola = new JSONArray(p.getString("cola", "[]")), viva = new JSONArray();
        for (int i = 0; i < cola.length(); i++) { JSONObject o = cola.getJSONObject(i); if (ahora - o.optLong("ts") < SIETE_DIAS) viva.put(o); }
        // repetidos: el mismo aviso que se actualiza (misma clave), o el mismo pago avisado por dos apps (banco + Google Wallet)
        // en 10 minutos. Dos pagos iguales de la misma app sí cuentan los dos (dos cafés).
        String clave = sbn.getKey() == null ? "" : sbn.getKey();
        JSONArray rec = new JSONArray(p.getString("recientes", "[]")), recViva = new JSONArray();
        boolean repe = false;
        for (int i = 0; i < rec.length(); i++) {
            JSONObject o = rec.getJSONObject(i);
            if (ahora - o.optLong("ts") > DIEZ_MIN) continue;
            recViva.put(o);
            boolean igual = Math.abs(o.optDouble("importe") - m.importe) < 0.005 && o.optBoolean("entra") == m.entra;
            if (igual && (clave.equals(o.optString("clave")) || !pkg.equals(o.optString("pkg")))) repe = true;
        }
        if (repe) { p.edit().putString("recientes", recViva.toString()).apply(); return; }
        recViva.put(new JSONObject().put("importe", m.importe).put("entra", m.entra).put("ts", ahora).put("pkg", pkg).put("clave", clave));

        JSONObject it = new JSONObject()
            .put("id", UUID.randomUUID().toString()).put("pkg", pkg).put("app", etiqueta(ctx, ex, pkg))
            .put("importe", m.importe).put("entra", m.entra).put("comercio", personaNo(m)).put("tipo", m.tipo).put("ts", ahora).put("uid", uid);
        viva.put(it);
        while (viva.length() > 100) viva.remove(0);
        int sinVer = p.getInt("sinVer", 0) + 1;
        p.edit().putString("cola", viva.toString()).putString("recientes", recViva.toString()).putInt("sinVer", sinVer).apply();
        avisar(ctx, it, sinVer);
    }

    /** docs/39b: en un Bizum o una transferencia, el «comercio» es otra persona: su nombre no se guarda. */
    static String personaNo(LectorAvisos.Movimiento m) { return "bizum".equals(m.tipo) || "transferencia".equals(m.tipo) ? "" : m.comercio; }

    static String txt(CharSequence c) { return c == null ? "" : c.toString(); }

    static String etiqueta(Context ctx, Bundle ex, String pkg) {
        try {
            ApplicationInfo ai = Build.VERSION.SDK_INT >= 33 ? ex.getParcelable("android.appInfo", ApplicationInfo.class) : ex.getParcelable("android.appInfo");
            if (ai != null) return String.valueOf(ctx.getPackageManager().getApplicationLabel(ai));
        } catch (Throwable t) { /* */ }
        try { return String.valueOf(ctx.getPackageManager().getApplicationLabel(ctx.getPackageManager().getApplicationInfo(pkg, 0))); } catch (Throwable t) { return pkg; }
    }

    static String euros(double v) { NumberFormat f = NumberFormat.getNumberInstance(new Locale("es", "ES")); f.setMinimumFractionDigits(2); f.setMaximumFractionDigits(2); return f.format(v) + " €"; }

    static String linea(JSONObject it) {
        boolean entra = it.optBoolean("entra");
        String c = it.optString("comercio", ""), imp = (entra ? "+" : "") + euros(it.optDouble("importe"));
        return c.isEmpty() ? imp + " · " + it.optString("app") : imp + (entra ? " de " : " en ") + c;
    }

    /** Un solo aviso de PalomApp, que se va actualizando: «Apuntado: 12,50 € en Mercadona» o «3 movimientos apuntados». */
    static void avisar(Context ctx, JSONObject it, int sinVer) {
        if (!ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean("avisarme", true)) return;
        NotificationManagerCompat nm = NotificationManagerCompat.from(ctx);
        if (!nm.areNotificationsEnabled()) return;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager sys = ctx.getSystemService(NotificationManager.class);
            if (sys != null && sys.getNotificationChannel(CANAL) == null) {
                NotificationChannel ch = new NotificationChannel(CANAL, "Movimientos apuntados de tus avisos", NotificationManager.IMPORTANCE_LOW);
                ch.setDescription("Cuando PalomApp apunta un gasto o un ingreso que ha leído en el aviso de tu banco");
                sys.createNotificationChannel(ch);
            }
        }
        Intent abrir = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("palomapp_abrir", "apuntados");
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, abrir, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String titulo = sinVer <= 1 ? "Apuntado en PalomApp" : sinVer + " movimientos apuntados";
        String cuerpo = sinVer <= 1 ? linea(it) : "El último: " + linea(it) + ". Toca para revisarlos.";
        // con el móvil bloqueado, sin cifras
        Notification publica = new NotificationCompat.Builder(ctx, CANAL).setSmallIcon(R.drawable.ic_stat_paloma)
            .setContentTitle("PalomApp").setContentText("Movimientos nuevos apuntados").build();
        Notification n = new NotificationCompat.Builder(ctx, CANAL)
            .setSmallIcon(R.drawable.ic_stat_paloma).setColor(0xFFFFC93C)
            .setContentTitle(titulo).setContentText(cuerpo).setStyle(new NotificationCompat.BigTextStyle().bigText(cuerpo + (sinVer <= 1 ? "\nSi no es correcto, bórralo desde Inicio." : "")))
            .setContentIntent(pi).setAutoCancel(true).setOnlyAlertOnce(true)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setPublicVersion(publica)
            .setPriority(NotificationCompat.PRIORITY_LOW).build();
        try { nm.notify(ID_AVISO, n); } catch (SecurityException e) { /* sin permiso para avisar */ }
    }
}

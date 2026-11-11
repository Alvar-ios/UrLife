package com.palomapp.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

/** Puente entre la web de PalomApp y el lector de avisos del banco (AvisosBancoService). docs/39. */
@CapacitorPlugin(name = "AvisosBanco")
public class AvisosBancoPlugin extends Plugin {
    private SharedPreferences prefs() { return getContext().getSharedPreferences(AvisosBancoService.PREFS, Context.MODE_PRIVATE); }

    private boolean permiso() { return NotificationManagerCompat.getEnabledListenerPackages(getContext()).contains(getContext().getPackageName()); }

    @PluginMethod
    public void estado(PluginCall call) {
        try {
            SharedPreferences p = prefs();
            JSObject r = new JSObject();
            r.put("permiso", permiso());
            r.put("activo", p.getBoolean("activo", false));
            r.put("avisarme", p.getBoolean("avisarme", true));
            r.put("notificaciones", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
            r.put("bancos", new JSArray(p.getStringSet("bancos", new HashSet<>()).toArray()));
            JSONObject nombres = new JSONObject(p.getString("nombres", "{}"));
            JSArray cand = new JSArray();
            for (String pkg : p.getStringSet("candidatos", new HashSet<>())) cand.put(new JSObject().put("pkg", pkg).put("nombre", nombres.optString(pkg, pkg)));
            r.put("candidatos", cand);
            r.put("pendientes", new JSONArray(p.getString("cola", "[]")).length());
            call.resolve(r);
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    /** Lleva a los ajustes de Android para dar el permiso de «Acceso a notificaciones». */
    @PluginMethod
    public void abrirAjustes(PluginCall call) {
        Intent i;
        if (Build.VERSION.SDK_INT >= 30) {
            i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
                .putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, new ComponentName(getContext(), AvisosBancoService.class).flattenToString());
        } else i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getContext().startActivity(i); } catch (Exception e) { getContext().startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
        call.resolve();
    }

    /** { activo, bancos: [paquetes], avisarme } */
    @PluginMethod
    public void configurar(PluginCall call) {
        SharedPreferences.Editor ed = prefs().edit();
        if (call.hasOption("activo")) ed.putBoolean("activo", Boolean.TRUE.equals(call.getBoolean("activo")));
        if (call.hasOption("avisarme")) ed.putBoolean("avisarme", Boolean.TRUE.equals(call.getBoolean("avisarme")));
        JSArray b = call.getArray("bancos");
        if (b != null) {
            Set<String> s = new HashSet<>();
            try { for (Object o : b.toList()) s.add(String.valueOf(o)); } catch (Exception e) { /* */ }
            ed.putStringSet("bancos", s);
            // las que pasan a estar marcadas dejan de ser «propuestas»
            Set<String> cand = new HashSet<>(prefs().getStringSet("candidatos", new HashSet<>())); cand.removeAll(s); ed.putStringSet("candidatos", cand);
        }
        ed.apply();
        if (Build.VERSION.SDK_INT >= 24 && permiso()) {
            try { NotificationListenerService.requestRebind(new ComponentName(getContext(), AvisosBancoService.class)); } catch (Exception e) { /* */ }
        }
        call.resolve();
    }

    /** Lo leído y aún no guardado en la cuenta. */
    @PluginMethod
    public void pendientes(PluginCall call) {
        try {
            JSArray a = new JSArray();
            JSONArray cola = new JSONArray(prefs().getString("cola", "[]"));
            for (int i = 0; i < cola.length(); i++) a.put(cola.getJSONObject(i));
            JSObject r = new JSObject(); r.put("lista", a); call.resolve(r);
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    /** Quita de la cola los ya guardados (o descartados). { ids: [...] } */
    @PluginMethod
    public void quitar(PluginCall call) {
        try {
            Set<String> ids = new HashSet<>();
            JSArray a = call.getArray("ids"); if (a != null) for (Object o : a.toList()) ids.add(String.valueOf(o));
            JSONArray cola = new JSONArray(prefs().getString("cola", "[]")), queda = new JSONArray();
            for (int i = 0; i < cola.length(); i++) { JSONObject o = cola.getJSONObject(i); if (!ids.contains(o.optString("id"))) queda.put(o); }
            prefs().edit().putString("cola", queda.toString()).putInt("sinVer", 0).apply();
            NotificationManagerCompat.from(getContext()).cancel(AvisosBancoService.ID_AVISO);
            call.resolve();
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    /** Apagar del todo: borra la cola, las propuestas y lo reciente (también al cerrar sesión). */
    @PluginMethod
    public void vaciar(PluginCall call) {
        SharedPreferences.Editor ed = prefs().edit();
        ed.remove("cola").remove("recientes").remove("candidatos").remove("nombres").putInt("sinVer", 0);
        if (Boolean.TRUE.equals(call.getBoolean("apagar", false))) ed.putBoolean("activo", false);
        ed.apply();
        NotificationManagerCompat.from(getContext()).cancel(AvisosBancoService.ID_AVISO);
        call.resolve();
    }

    /** Si la app se abrió tocando nuestro aviso. */
    @PluginMethod
    public void abiertoDesdeAviso(PluginCall call) {
        boolean si = false;
        try { Intent i = getActivity().getIntent(); si = i != null && "apuntados".equals(i.getStringExtra("palomapp_abrir")); if (si) i.removeExtra("palomapp_abrir"); } catch (Exception e) { /* */ }
        JSObject r = new JSObject(); r.put("si", si); call.resolve(r);
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (intent != null && "apuntados".equals(intent.getStringExtra("palomapp_abrir"))) {
            getActivity().setIntent(intent);
            notifyListeners("abiertoDesdeAviso", new JSObject());
        }
    }
}

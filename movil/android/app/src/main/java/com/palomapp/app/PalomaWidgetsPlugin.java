package com.palomapp.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Puente entre la web y los widgets de la pantalla de inicio (docs/40 C5). */
@CapacitorPlugin(name = "PalomaWidgets")
public class PalomaWidgetsPlugin extends Plugin {
    private SharedPreferences prefs() { return getContext().getSharedPreferences(WidgetQueda.PREFS, Context.MODE_PRIVATE); }

    /** { queda, texto, mes, progreso, oculto, negativo, desde, hasta, sesion }. Con sesion:false se borra todo lo guardado. */
    @PluginMethod
    public void guardar(PluginCall call) {
        SharedPreferences.Editor ed = prefs().edit();
        boolean sesion = Boolean.TRUE.equals(call.getBoolean("sesion", false));
        if (!sesion) ed.clear().putBoolean("sesion", false);
        else {
            ed.putBoolean("sesion", true)
              .putString("queda", call.getString("queda", ""))
              .putString("texto", call.getString("texto", ""))
              .putString("mes", call.getString("mes", ""))
              .putString("desde", call.getString("desde", ""))
              .putString("hasta", call.getString("hasta", ""))
              .putBoolean("oculto", Boolean.TRUE.equals(call.getBoolean("oculto", false)))
              .putBoolean("negativo", Boolean.TRUE.equals(call.getBoolean("negativo", false)));
            Double pr = call.getDouble("progreso");
            ed.putFloat("progreso", pr == null ? -1f : pr.floatValue());
        }
        ed.apply();
        try { WidgetQueda.pintarTodos(getContext()); } catch (Exception e) { /* sin widgets puestos */ }
        call.resolve();
    }

    /** Qué pidió el widget al abrir la app: "gasto", "inicio" o "" (y se olvida, para no repetirlo). */
    @PluginMethod
    public void abrirCon(PluginCall call) {
        String que = "";
        try {
            Intent i = getActivity().getIntent();
            if (i != null && i.hasExtra(WidgetQueda.EXTRA)) { que = String.valueOf(i.getStringExtra(WidgetQueda.EXTRA)); i.removeExtra(WidgetQueda.EXTRA); }
        } catch (Exception e) { /* */ }
        JSObject r = new JSObject(); r.put("que", que); call.resolve(r);
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (intent != null && intent.hasExtra(WidgetQueda.EXTRA)) {
            getActivity().setIntent(intent);
            notifyListeners("abiertoDesdeWidget", new JSObject()); // la web llama a abrirCon() para saber qué y consumirlo
        }
    }
}

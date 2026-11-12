package com.palomapp.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Widget «Te queda este mes» (2×1). Solo lee lo que dejó la app (PalomaWidgetsPlugin.guardar). docs/40 C5. */
public class WidgetQueda extends AppWidgetProvider {
    public static final String PREFS = "palomapp_widgets";
    /** Extra del intent que abre la app desde un widget. Distinto del de los avisos («palomapp_abrir»). */
    public static final String EXTRA = "palomapp_widget";

    static PendingIntent abrir(Context ctx, String que, int codigo) {
        Intent i = new Intent(ctx, MainActivity.class)
            .setAction("es.palomapp.finanzas.WIDGET_" + que.toUpperCase(Locale.ROOT))
            .putExtra(EXTRA, que)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(ctx, codigo, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static RemoteViews vista(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String hoy = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date());
        WidgetDatos.Vista v = WidgetDatos.calcular(p.getBoolean("sesion", false), p.getString("texto", ""), p.getString("mes", ""),
            p.getString("queda", ""), p.getBoolean("oculto", false), p.getBoolean("negativo", false),
            p.getString("desde", ""), p.getString("hasta", ""), p.getFloat("progreso", -1f), hoy);
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_queda);
        rv.setTextViewText(R.id.wq_texto, v.texto);
        rv.setTextViewText(R.id.wq_mes, v.mes);
        rv.setViewVisibility(R.id.wq_mes, v.mes.isEmpty() ? View.GONE : View.VISIBLE);
        rv.setTextViewText(R.id.wq_cifra, v.cifra);
        rv.setTextColor(R.id.wq_cifra, v.negativo ? 0xFFFF8A8A : 0xFFFFFFFF);
        if (v.barra >= 0) { rv.setViewVisibility(R.id.wq_barra, View.VISIBLE); rv.setProgressBar(R.id.wq_barra, 1000, v.barra, false); }
        else rv.setViewVisibility(R.id.wq_barra, View.GONE);
        rv.setContentDescription(R.id.wq_raiz, v.descripcion);
        rv.setOnClickPendingIntent(R.id.wq_raiz, abrir(ctx, "inicio", 7301));
        return rv;
    }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager am, int[] ids) {
        for (int id : ids) am.updateAppWidget(id, vista(ctx));
    }

    /** Repinta todos los «Te queda» que haya en la pantalla de inicio. */
    public static void pintarTodos(Context ctx) {
        AppWidgetManager am = AppWidgetManager.getInstance(ctx);
        int[] ids = am.getAppWidgetIds(new ComponentName(ctx, WidgetQueda.class));
        if (ids != null && ids.length > 0) am.updateAppWidget(ids, vista(ctx));
    }
}

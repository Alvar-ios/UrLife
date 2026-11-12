package com.palomapp.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

/** Widget «Apuntar gasto» (1×1): abre PalomApp directamente en un gasto nuevo con el teclado del importe. docs/40 C5. */
public class WidgetGasto extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager am, int[] ids) {
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_gasto);
        rv.setOnClickPendingIntent(R.id.wg_raiz, WidgetQueda.abrir(ctx, "gasto", 7302));
        for (int id : ids) am.updateAppWidget(id, rv);
    }
}

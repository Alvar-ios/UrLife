package com.palomapp.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.app.NotificationManagerCompat;

/** «Deshacer» en el aviso «Apuntado en PalomApp»: lo quita de la cola y, si ya estaba en tu cuenta, lo borra (docs/40 C3). */
public class AvisosDeshacerReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        String id = intent == null ? null : intent.getStringExtra("id");
        NotificationManagerCompat.from(ctx).cancel(AvisosBancoService.ID_AVISO);
        if (id == null || id.isEmpty()) return;
        final PendingResult pr = goAsync();
        AvisosServidor.deshacerEnSegundoPlano(ctx, id, pr::finish);
    }
}

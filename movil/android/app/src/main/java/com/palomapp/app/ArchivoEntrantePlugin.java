package com.palomapp.app;

import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.OpenableColumns;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * «Compartir con PalomApp» (C4 de docs/40): cuando la app del banco o Archivos comparte o abre un extracto
 * (CSV, Excel, Norma 43) con PalomApp, se lee aquí en memoria (máx. 10 MB, nunca se guarda en el móvil)
 * y se pasa a la web como nombre + base64, que lo abre en Importar como si se hubiera elegido.
 * - pendiente(): el archivo con el que se abrió la app (una sola vez).
 * - evento «archivoEntrante»: el que llega con la app ya abierta.
 */
@CapacitorPlugin(name = "ArchivoEntrante")
public class ArchivoEntrantePlugin extends Plugin {
    static final int MAX = 10 * 1024 * 1024;
    private Uri pendiente = null;
    private String pendienteTipo = null;

    @Override
    public void load() {
        Intent i = getActivity() != null ? getActivity().getIntent() : null;
        Uri u = uriDe(i);
        if (u != null) { pendiente = u; pendienteTipo = i.getType(); getActivity().setIntent(new Intent(Intent.ACTION_MAIN)); } // no repetirlo al girar la pantalla
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        final Uri u = uriDe(intent);
        if (u == null) return;
        final String tipo = intent.getType();
        if (!hasListeners("archivoEntrante")) { pendiente = u; pendienteTipo = tipo; return; }
        new Thread(() -> notifyListeners("archivoEntrante", leer(u, tipo), true)).start();
    }

    @PluginMethod
    public void pendiente(PluginCall call) {
        Uri u = pendiente; String tipo = pendienteTipo;
        pendiente = null; pendienteTipo = null;
        if (u == null) { call.resolve(new JSObject()); return; }
        call.resolve(leer(u, tipo));
    }

    /** El archivo que trae un ACTION_VIEW (abrir con) o un ACTION_SEND (compartir). Solo content:// y file:// */
    @SuppressWarnings("deprecation")
    private static Uri uriDe(Intent i) {
        if (i == null || i.getAction() == null) return null;
        Uri u = null;
        if (Intent.ACTION_VIEW.equals(i.getAction())) u = i.getData();
        else if (Intent.ACTION_SEND.equals(i.getAction())) {
            if (Build.VERSION.SDK_INT >= 33) u = i.getParcelableExtra(Intent.EXTRA_STREAM, Uri.class);
            else { Object o = i.getParcelableExtra(Intent.EXTRA_STREAM); if (o instanceof Uri) u = (Uri) o; }
        }
        if (u == null || u.getScheme() == null) return null;
        String s = u.getScheme();
        if (!ContentResolver.SCHEME_CONTENT.equals(s) && !ContentResolver.SCHEME_FILE.equals(s)) return null; // las invitaciones https:// siguen su camino
        return u;
    }

    private JSObject leer(Uri u, String tipo) {
        JSObject r = new JSObject();
        r.put("nombre", nombreDe(u));
        r.put("tipo", tipo == null ? "" : tipo);
        try (InputStream in = getContext().getContentResolver().openInputStream(u)) {
            if (in == null) { r.put("error", "leer"); return r; }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[64 * 1024];
            int n, total = 0;
            while ((n = in.read(buf)) != -1) {
                total += n;
                if (total > MAX) { r.put("error", "grande"); return r; }
                out.write(buf, 0, n);
            }
            r.put("tam", total);
            r.put("base64", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
        } catch (Exception e) {
            r.put("error", "leer");
        }
        return r;
    }

    private String nombreDe(Uri u) {
        String nombre = null;
        if (ContentResolver.SCHEME_CONTENT.equals(u.getScheme())) {
            try (Cursor c = getContext().getContentResolver().query(u, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
                if (c != null && c.moveToFirst()) nombre = c.getString(0);
            } catch (Exception e) { /* sin nombre */ }
        }
        if (nombre == null) nombre = u.getLastPathSegment();
        if (nombre == null || nombre.trim().isEmpty()) nombre = "extracto";
        int barra = nombre.lastIndexOf('/');
        return barra >= 0 ? nombre.substring(barra + 1) : nombre;
    }
}

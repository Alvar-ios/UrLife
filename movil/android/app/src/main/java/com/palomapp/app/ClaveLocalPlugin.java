package com.palomapp.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.security.KeyStore;
import java.security.SecureRandom;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Clave de la copia local sin conexión (docs/52). La web cifra con AES-GCM la copia de tus datos y la cola de
 * cambios pendientes; aquí solo se guarda la clave: una clave aleatoria de 256 bits que se guarda envuelta por una
 * clave del Android Keystore (no sale del chip del móvil). La clave no va en copias de seguridad (allowBackup=false).
 * - obtener(): { clave: base64 }. La primera vez la crea.
 * - olvidar(): borra la clave (al cerrar sesión: sin clave, lo cifrado ya no se puede leer).
 */
@CapacitorPlugin(name = "ClaveLocal")
public class ClaveLocalPlugin extends Plugin {
    private static final String ALIAS = "palomapp_clave_local";
    private static final String PREFS = "palomapp_clave_local";

    private SecretKey claveKeystore() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (ks.containsAlias(ALIAS)) return (SecretKey) ks.getKey(ALIAS, null);
        KeyGenerator g = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        g.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build());
        return g.generateKey();
    }

    @PluginMethod
    public void obtener(PluginCall call) {
        try {
            SharedPreferences sp = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String envuelta = sp.getString("k", null), iv = sp.getString("iv", null);
            if (envuelta != null && iv != null) {
                try {
                    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
                    c.init(Cipher.DECRYPT_MODE, claveKeystore(), new GCMParameterSpec(128, Base64.decode(iv, Base64.NO_WRAP)));
                    byte[] raw = c.doFinal(Base64.decode(envuelta, Base64.NO_WRAP));
                    call.resolve(new JSObject().put("clave", Base64.encodeToString(raw, Base64.NO_WRAP)));
                    return;
                } catch (Exception e) { /* la clave del Keystore ya no sirve: se crea otra (lo cifrado antes no se podrá leer y se vuelve a pedir al servidor) */ }
            }
            byte[] raw = new byte[32];
            new SecureRandom().nextBytes(raw);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, claveKeystore());
            byte[] cif = c.doFinal(raw);
            sp.edit().putString("k", Base64.encodeToString(cif, Base64.NO_WRAP)).putString("iv", Base64.encodeToString(c.getIV(), Base64.NO_WRAP)).apply();
            call.resolve(new JSObject().put("clave", Base64.encodeToString(raw, Base64.NO_WRAP)));
        } catch (Exception e) {
            call.reject("clave_no_disponible");
        }
    }

    @PluginMethod
    public void olvidar(PluginCall call) {
        try { getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply(); } catch (Exception e) { /* */ }
        call.resolve();
    }
}

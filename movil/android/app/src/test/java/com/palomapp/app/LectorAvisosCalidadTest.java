package com.palomapp.app;

import org.junit.Test;
import java.util.ArrayList;
import java.util.List;
import static org.junit.Assert.*;

/** Calidad 11/11: casos extra (textos INVENTADOS al estilo de cada app). Cada caso se apunta; al final falla con la lista. */
public class LectorAvisosCalidadTest {
    private final List<String> fallos = new ArrayList<>();
    private void es(String pkg, String t, String x, double imp, boolean entra, String comercio) {
        LectorAvisos.Movimiento m = LectorAvisos.leer(pkg, t, x);
        String caso = "[" + t + " | " + x + "]";
        if (m == null) { fallos.add("NO LEE " + caso); return; }
        if (Math.abs(m.importe - imp) > 0.001) fallos.add("IMPORTE " + m.importe + " (esperado " + imp + ") " + caso);
        if (m.entra != entra) fallos.add("SIGNO " + (m.entra ? "ingreso" : "gasto") + " " + caso);
        if (comercio != null && !comercio.equals(m.comercio)) fallos.add("COMERCIO «" + m.comercio + "» (esperado «" + comercio + "») " + caso);
    }
    private void nada(String pkg, String t, String x) {
        LectorAvisos.Movimiento m = LectorAvisos.leer(pkg, t, x);
        if (m != null) fallos.add("APUNTA LO QUE NO ES (" + m + ") [" + t + " | " + x + "]");
    }
    /** El nombre de una persona no debe quedar en comercio salvo que el tipo sea bizum/transferencia (que el servicio borra). */
    private void sinPersona(String pkg, String t, String x, String nombre) {
        LectorAvisos.Movimiento m = LectorAvisos.leer(pkg, t, x);
        if (m == null) return;
        String guardado = AvisosBancoService.personaNo(m);
        if (guardado.toLowerCase().contains(nombre.toLowerCase())) fallos.add("GUARDA EL NOMBRE «" + guardado + "» (tipo " + m.tipo + ") [" + t + " | " + x + "]");
    }

    @Test public void casosCalidad() {
        // --- falsos positivos ---
        nada("es.bancosantander.apps", "Santander", "Introduce el código 123456 para confirmar la compra de 25,00 € en Amazon");
        nada("com.bbva.bbvacontigo", "BBVA", "Compra pendiente de confirmar: 25,00 € en Amazon");
        nada("de.number26.android", "Payment declined", "Your payment of €12.50 at Lidl was declined");
        nada("es.lacaixa.mobile.android.newwapicon", "CaixaBank", "Operación denegada: 30,00 EUR en ZARA");
        nada("com.revolut.revolut", "Revolut", "Consigue 20 € por cada amigo que invites");
        nada("es.bancosantander.apps", "Santander", "Tienes un nuevo recibo pendiente de 45,00 € de Endesa que se cargará el día 15");
        nada("x", "Bizum", "Ana te ha solicitado 20,00 € por Bizum");
        nada("x", "Bizum", "Ana te pide 20,00 € por Bizum. Acéptalo en la app");
        nada("de.traderepublic.app", "Trade Republic", "Orden de compra ejecutada: 3 acciones de Apple por 540,00 €");
        nada("de.traderepublic.app", "Trade Republic", "Plan de inversión ejecutado: compra de 50,00 € en MSCI World");
        nada("www.ingdirect.nativeframe", "ING", "Tu nómina de 1.850,00 € llegará mañana");
        nada("com.revolut.revolut", "Revolut", "Has cambiado 100,00 € a USD");
        nada("es.bancosantander.apps", "Santander", "Retención de 100,00 € en HOTEL SOL por preautorización");
        // --- falsos negativos / errores ---
        es("com.bbva.bbvacontigo", "BBVA", "Cargo de 12,50 € en MERCADONA. Saldo disponible: 1.234,56 €", 12.5, false, "Mercadona");
        es("www.ingdirect.nativeframe", "ING", "Pago con tarjeta de 23,45 € en ZARA. Tu saldo es 1.000,00 €", 23.45, false, "Zara");
        es("es.lacaixa.mobile.android.newwapicon", "CaixaBank", "Operación con tarjeta ****1234 por 23,45 EUR en ZARA", 23.45, false, "Zara");
        es("es.lacaixa.mobile.android.newwapicon", "CaixaBank", "Compra autorizada: 23,45 EUR en ZARA", 23.45, false, "Zara");
        es("es.bancosantander.apps", "Santander", "Compra con tarjeta ****1234 125,00 € en Zara", 125, false, "Zara");
        es("es.bancosantander.apps", "Compra 11/11", "Compra de hoy 11/11 150,00 € en Zara", 150, false, "Zara");
        es("x", "Bizum recibido", "Bizum recibido de Ana - 15,00 €", 15, true, null);
        es("x", "Ingreso", "Nómina EMPRESA SL - 1.850,00 €", 1850, true, null);
        es("es.bancosantander.apps", "Santander", "Has recibido un recibo de IBERDROLA por 45,20 €", 45.2, false, null);
        es("es.bancosantander.apps", "Santander", "Movimiento en tu tarjeta: -12,50 € MERCADONA", 12.5, false, "Mercadona");
        es("net.inverline.bancosabadell.officelocator.android", "Sabadell", "Has hecho un pago de 9,99 € en NETFLIX.COM", 9.99, false, null);
        es("com.revolut.revolut", "Revolut", "Pagado 4,50 € en Starbucks", 4.5, false, "Starbucks");
        es("com.revolut.revolut", "Revolut", "Has pagado 4,50 € en Starbucks 🍵", 4.5, false, null);
        es("de.number26.android", "N26", "Has recibido 50,00 € de Ana García", 50, true, null);
        es("de.traderepublic.app", "Trade Republic", "Has recibido 12,34 € de intereses", 12.34, true, null);
        es("de.traderepublic.app", "Trade Republic", "Dividendo de 3,21 € de Apple", 3.21, true, null);
        es("www.ingdirect.nativeframe", "ING", "Cargo de recibo: 45,20 € VODAFONE", 45.2, false, null);
        es("com.google.android.apps.walletnfcrel", "Lidl", "12,50 € con Mastercard ··1234", 12.5, false, "Lidl");
        es("com.google.android.apps.walletnfcrel", "LIDL", "€12.50 with Visa •••• 1234", 12.5, false, "Lidl");
        es("com.bbva.bbvacontigo", "BBVA", "Has retirado 50,00 € en un cajero", 50, false, null);
        es("x", "Bizum", "Has enviado 15 € a Ana por Bizum", 15, false, null);
        es("x", "Compra", "Compra en OFERTAS BAZAR CHINO de 5,00 €", 5, false, null);
        es("x", "Compra", "Compra de 30,00 € en EL LIMITE BAR", 30, false, null);
        // --- privacidad: nombres de personas fuera de Bizum/transferencia ---
        sinPersona("de.number26.android", "N26", "Has recibido 50,00 € de Ana García", "Ana");
        sinPersona("de.number26.android", "N26", "You received €50.00 from Ana Garcia", "Ana");
        sinPersona("com.revolut.revolut", "Revolut", "Ana García te ha enviado 15,00 €", "Ana");
        sinPersona("com.paypal.android.p2pmobile", "PayPal", "Has enviado un pago de 20,00 € a Ana García", "Ana");
        sinPersona("com.paypal.android.p2pmobile", "PayPal", "Ana García te ha pagado 20,00 €", "Ana");
        sinPersona("de.number26.android", "N26", "Ana García te ha devuelto 10,00 €", "Ana");
        if (!fallos.isEmpty()) fail(fallos.size() + " casos fallan:\n  " + String.join("\n  ", fallos));
    }
}

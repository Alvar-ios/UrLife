package com.palomapp.app;

import org.junit.Test;
import java.util.ArrayList;
import java.util.List;
import static org.junit.Assert.*;

/** Calidad 11/11 (2.ª vuelta): textos INVENTADOS distintos de LectorAvisosCalidadTest. */
public class LectorAvisosCalidad2Test {
    private final List<String> fallos = new ArrayList<>();
    private void es(String pkg, String t, String x, double imp, boolean entra) {
        LectorAvisos.Movimiento m = LectorAvisos.leer(pkg, t, x);
        String caso = "[" + t + " | " + x + "]";
        if (m == null) { fallos.add("NO LEE " + caso); return; }
        if (Math.abs(m.importe - imp) > 0.001) fallos.add("IMPORTE " + m.importe + " (esperado " + imp + ") " + caso);
        if (m.entra != entra) fallos.add("SIGNO " + (m.entra ? "ingreso" : "gasto") + " " + caso);
    }
    private void nada(String pkg, String t, String x) {
        LectorAvisos.Movimiento m = LectorAvisos.leer(pkg, t, x);
        if (m != null) fallos.add("APUNTA LO QUE NO ES (" + m + ") [" + t + " | " + x + "]");
    }
    private void sinPersona(String pkg, String t, String x, String nombre) {
        LectorAvisos.Movimiento m = LectorAvisos.leer(pkg, t, x);
        if (m == null) return;
        String g = AvisosBancoService.personaNo(m);
        if (g.toLowerCase().contains(nombre.toLowerCase())) fallos.add("GUARDA EL NOMBRE «" + g + "» (tipo " + m.tipo + ") [" + t + " | " + x + "]");
    }
    @Test public void segundaVuelta() {
        // importes
        es("de.number26.android", "N26", "Compra de 1 234,56 € en MEDIAMARKT", 1234.56, false);
        es("com.revolut.revolut", "Revolut", "Pago de 15,00 USD (13,80 €) en AMAZON", 13.8, false);
        es("com.revolut.revolut", "Revolut", "-€12.50 at Lidl", 12.5, false);
        es("x", "Unicaja", "EUR -12,50 MERCADONA 11.11.2026", 12.5, false);
        es("x", "Abanca", "Compra 14:32 -9,90€ en BURGER KING", 9.9, false);
        // verbos que faltan
        es("com.revolut.revolut", "Revolut", "Pagaste 4,50 € en Starbucks", 4.5, false);
        es("x", "Openbank", "Has gastado 12,50 € en Zara", 12.5, false);
        es("x", "Bankinter", "Te han cobrado 9,99 € en NETFLIX", 9.99, false);
        es("de.number26.android", "N26", "Your card was charged €9.99 by Netflix", 9.99, false);
        es("x", "Unicaja", "Cobro de 9,99 € de Spotify", 9.99, false);
        // signo en inglés y «pago recibido»
        es("com.paypal.android.p2pmobile", "PayPal", "Pago recibido de 50,00 €", 50, true);
        es("com.revolut.revolut", "Revolut", "Payment received €50.00", 50, true);
        es("com.revolut.revolut", "Revolut", "Ana paid you €15.00", 15, true);
        es("de.number26.android", "N26", "You've been paid €1,850.00", 1850, true);
        es("com.revolut.revolut", "Revolut", "Ana sent you €15.00", 15, true);
        // transferencia real que «llegará»
        es("com.bbva.bbvacontigo", "BBVA", "Transferencia enviada: 100,00 € a Ana. Llegará en 1-2 días", 100, false);
        es("x", "Bizum", "Transferencia ejecutada: 100,00 € a ANA GARCIA", 100, false);
        // falsos positivos
        nada("de.number26.android", "N26", "Payment failed: €12.50 at Lidl");
        nada("com.revolut.revolut", "Revolut", "Your payment of €12.50 at Lidl was reversed");
        nada("x", "Unicaja", "Pago de 12,00 € en Zara retrocedido");
        nada("de.number26.android", "N26", "Insufficient funds for your €30.00 payment at Zara");
        nada("x", "BBVA", "Este mes has pagado 450,00 € con tu tarjeta");
        nada("x", "CaixaBank", "Resumen semanal: 12 compras por 320,50 €");
        nada("de.number26.android", "N26", "Has transferido 100,00 € a tu Espacio Ahorro");
        nada("x", "Santander", "Recuerda: el viernes cargaremos tu recibo de 45,00 €");
        nada("x", "ING", "Tu Bizum de 20,00 € a Ana ha caducado");
        // personas
        sinPersona("com.revolut.revolut", "Revolut", "-20,00 € ANA GARCIA LOPEZ", "Ana");
        sinPersona("com.revolut.revolut", "Revolut", "Pago de 20,00 € a ANA GARCIA", "Ana");
        sinPersona("com.paypal.android.p2pmobile", "PayPal", "Pagaste 20,00 € en PayPal a Ana García", "Ana");
        sinPersona("x", "Wallapop", "Has pagado 20,00 € en Wallapop: JUAN PEREZ", "Juan");
        if (!fallos.isEmpty()) fail(fallos.size() + " casos fallan:\n  " + String.join("\n  ", fallos));
    }
}

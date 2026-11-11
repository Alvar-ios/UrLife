package com.palomapp.app;

import static org.junit.Assert.*;

import org.junit.Test;

/** Pruebas del lector de avisos del banco. Textos INVENTADOS imitando el estilo de cada app (no hay ejemplos reales todavía). */
public class LectorAvisosTest {
    private static void es(String pkg, String t, String x, double imp, boolean entra, String comercio) {
        LectorAvisos.Movimiento m = LectorAvisos.leer(pkg, t, x);
        assertNotNull("debería leer: " + t + " | " + x, m);
        assertEquals(t + " | " + x, imp, m.importe, 0.001);
        assertEquals("signo de " + x, entra, m.entra);
        if (comercio != null) assertEquals("comercio de " + x, comercio, m.comercio);
    }
    private static void nada(String t, String x) { assertNull("no debería leer: " + t + " | " + x, LectorAvisos.leer("x", t, x)); }

    @Test public void tarjeta() {
        es("es.bancosantander.apps", "Compra con tarjeta", "Compra de 12,50 EUR en MERCADONA con tu tarjeta terminada en 1234", 12.5, false, "Mercadona");
        es("de.number26.android", "Pago", "Pago de 12,50 € en Mercadona", 12.5, false, "Mercadona");
        es("de.number26.android", "Card payment", "You spent €12.50 at Lidl", 12.5, false, "Lidl");
        es("x", "Banco Sabadell", "Has realizado una compra de 25,30€ en AMAZON EU con tu tarjeta", 25.3, false, "Amazon Eu");
        es("de.traderepublic.app", "Pago con tarjeta", "Has pagado 8,90 € en Starbucks", 8.9, false, "Starbucks");
        es("x", "Trade Republic", "-4,20 € · Panadería La Espiga", 4.2, false, null);
        es("x", "Compra", "1.234,56 € en El Corte Inglés el 11/11", 1234.56, false, "El Corte Inglés");
    }
    @Test public void bizumYTransferencias() {
        es("x", "Bizum enviado", "Has enviado un Bizum de 15,00 € a Ana García", 15, false, "Ana García");
        es("x", "Bizum", "Ana te ha enviado 15 € por Bizum", 15, true, "Ana");
        es("x", "Transferencia recibida", "Has recibido una transferencia de 250,00 € de JUAN PEREZ", 250, true, "Juan Perez");
        es("x", "Nómina", "Te han ingresado la nómina: 1.850,00 €", 1850, true, null);
        es("x", "Devolución", "Devolución de 19,99 € de Zalando", 19.99, true, "Zalando");
        es("x", "Cajero", "Retirada de efectivo de 50 € en cajero", 50, false, null);
    }
    @Test public void walletTituloEsComercio() {
        es("com.google.android.apps.walletnfcrel", "Mercadona", "12,50 € con Visa •••• 1234", 12.5, false, "Mercadona");
    }
    @Test public void ignora() {
        nada("Santander", "Tu código de verificación para la compra de 12,50 € en Amazon es 482913");
        nada("Saldo", "Tu saldo disponible es de 1.234,56 €");
        nada("Compra rechazada", "La compra de 30,00 € en Zara ha sido denegada");
        nada("Promoción", "Gana hasta 50 € invitando a tus amigos");
        nada("N26", "Confirma tu pago de 9,99 € en Netflix en la app");
        nada("Aviso", "Mañana se cargará un recibo de 40,00 €");
        nada("Hola", "Tienes un mensaje nuevo");
        nada("Movimiento", "Movimiento de 20,00 € en tu cuenta"); // ante la duda (sin saber si entra o sale), nada
    }
    @Test public void numeros() {
        assertEquals(1234.56, LectorAvisos.numero("1.234,56"), 0.001);
        assertEquals(1234.56, LectorAvisos.numero("1,234.56"), 0.001);
        assertEquals(12.5, LectorAvisos.numero("12,5"), 0.001);
        assertEquals(12.5, LectorAvisos.numero("12.50"), 0.001);
        assertEquals(1234, LectorAvisos.numero("1.234"), 0.001);
        assertEquals(1234.56, LectorAvisos.numero("1 234,56"), 0.001);
    }
}

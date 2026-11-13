package com.palomapp.app;

import static org.junit.Assert.*;

import java.util.HashMap;
import java.util.Map;
import org.junit.Test;

/** 13/11 · Un Bizum recibido de 0,50 € acabó en «Nómina». Textos INVENTADOS. */
public class AvisosIngresosTest {
    private static Map<String, String> serie() {
        Map<String, String> m = new HashMap<>();
        m.put("nomina", "Nómina"); m.put("bizum", "Bizum y transferencias"); m.put("transferencia", "Bizum y transferencias");
        m.put("devolucion", "Devoluciones y reembolsos"); m.put("intereses", "Intereses y dividendos"); m.put("dividendo", "Intereses y dividendos");
        m.put("otro", "Otros ingresos");
        return m;
    }

    @Test public void bizumRecibidoNoEsNomina() {
        LectorAvisos.Movimiento m = LectorAvisos.leer("es.bancosantander.apps", "Bizum recibido", "Has recibido un Bizum de 0,50 € de LAURA");
        assertNotNull(m);
        assertTrue(m.entra);
        assertEquals("bizum", m.tipo);
        assertEquals(0.5, m.importe, 0.001);
        assertEquals("", m.comercio); // en lo que entra no se guarda quién
        String cat = AvisosServidor.categoriaIngreso(m.tipo, m.importe, 1800, serie(), "Otros ingresos");
        assertEquals("Bizum y transferencias", cat);
    }

    @Test public void recibidoSinDecirBizumEsTransferencia() {
        LectorAvisos.Movimiento m = LectorAvisos.leer("de.number26.android", "Dinero recibido", "Has recibido 20,00 € de Pedro");
        assertNotNull(m);
        assertTrue(m.entra);
        assertEquals("transferencia", m.tipo);
        assertEquals("Bizum y transferencias", AvisosServidor.categoriaIngreso(m.tipo, m.importe, 1800, serie(), ""));
    }

    @Test public void devolucionVaADevoluciones() {
        LectorAvisos.Movimiento m = LectorAvisos.leer("es.bancosantander.apps", "Devolución", "Te han devuelto 15,99 € de una compra");
        assertNotNull(m);
        assertTrue(m.entra);
        assertEquals("devolucion", m.tipo);
        assertEquals("Devoluciones y reembolsos", AvisosServidor.categoriaIngreso(m.tipo, m.importe, 0, serie(), ""));
    }

    @Test public void nominaSoloSiLoDice() {
        LectorAvisos.Movimiento m = LectorAvisos.leer("com.bbva.bbvacontigo", "Ingreso", "Has recibido una transferencia de 1.750,00 € en concepto de NÓMINA");
        assertNotNull(m);
        assertEquals("nomina", m.tipo);
        assertEquals("Nómina", AvisosServidor.categoriaIngreso(m.tipo, m.importe, 0, serie(), ""));
        LectorAvisos.Movimiento h = LectorAvisos.leer("com.bbva.bbvacontigo", "Ingreso", "Abono de haberes 1.600,00 €");
        assertNotNull(h);
        assertEquals("nomina", h.tipo);
    }

    @Test public void transferenciaParecidaALaNominaFija() {
        // transferencia de 1.790 € con una nómina fija de 1.800 € → Nómina; de 40 € → no
        assertEquals("Nómina", AvisosServidor.categoriaIngreso("transferencia", 1790, 1800, serie(), ""));
        assertEquals("Bizum y transferencias", AvisosServidor.categoriaIngreso("transferencia", 40, 1800, serie(), ""));
        // un Bizum nunca, aunque el importe se parezca
        assertEquals("Bizum y transferencias", AvisosServidor.categoriaIngreso("bizum", 1800, 1800, serie(), ""));
        // sin nómina fija (o pequeña) no se adivina
        assertEquals("Bizum y transferencias", AvisosServidor.categoriaIngreso("transferencia", 200, 200, serie(), ""));
    }

    @Test public void mapaAntiguoQueDecíaNomina() {
        // mapa de una versión anterior: sin «ingresos» y con catIngreso = la primera de la lista (Nómina)
        assertEquals("Otros ingresos", AvisosServidor.categoriaIngreso("bizum", 0.5, 0, new HashMap<>(), "Nómina"));
        assertEquals("Otros ingresos", AvisosServidor.categoriaIngreso("otro", 3, 0, null, "Sueldo"));
        assertEquals("Otros", AvisosServidor.categoriaIngreso("bizum", 3, 0, null, "Otros"));
        assertEquals("Nómina", AvisosServidor.categoriaIngreso("nomina", 1500, 0, null, ""));
    }

    @Test public void listaPropiaSinBizum() {
        // la web manda «otro» para lo que no tiene categoría propia
        Map<String, String> m = new HashMap<>();
        m.put("nomina", "Sueldo"); m.put("bizum", "Varios"); m.put("transferencia", "Varios"); m.put("otro", "Varios");
        assertEquals("Varios", AvisosServidor.categoriaIngreso("bizum", 0.5, 0, m, "Varios"));
        assertEquals("Sueldo", AvisosServidor.categoriaIngreso("nomina", 1500, 0, m, "Varios"));
    }

    @Test public void esNomina() {
        assertTrue(AvisosServidor.esNomina("Nómina"));
        assertTrue(AvisosServidor.esNomina("SUELDO"));
        assertFalse(AvisosServidor.esNomina("Bizum y transferencias"));
        assertFalse(AvisosServidor.esNomina(""));
    }
}

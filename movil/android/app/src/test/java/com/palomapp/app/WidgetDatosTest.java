package com.palomapp.app;

import static org.junit.Assert.*;

import org.junit.Test;

/** Qué enseña el widget «Te queda este mes» según lo guardado (docs/40 C5). */
public class WidgetDatosTest {
    @Test public void sinSesion() {
        WidgetDatos.Vista v = WidgetDatos.calcular(false, "Te queda este mes", "Noviembre", "250,00 €", false, false, "2026-11-01", "2026-11-30", 0.4, "2026-11-12");
        assertEquals("Abre PalomApp", v.cifra);
        assertEquals(-1, v.barra);
        assertFalse(v.descripcion.contains("250"));
    }
    @Test public void normal() {
        WidgetDatos.Vista v = WidgetDatos.calcular(true, "Te queda este mes", "Noviembre", "250,00 €", false, false, "2026-11-01", "2026-11-30", 0.4, "2026-11-12");
        assertEquals("250,00 €", v.cifra);
        assertEquals("Noviembre", v.mes);
        assertEquals(400, v.barra); // 12 de 30 días
    }
    @Test public void oculto() {
        WidgetDatos.Vista v = WidgetDatos.calcular(true, "Te queda este mes", "Noviembre", "250,00 €", true, true, "2026-11-01", "2026-11-30", 0.4, "2026-11-12");
        assertEquals("•••", v.cifra);
        assertFalse(v.negativo);
        assertFalse(v.descripcion.contains("250"));
    }
    @Test public void barraAvanzaSinAbrirLaApp() {
        assertEquals(1000, WidgetDatos.progreso("2026-10-28", "2026-11-27", "2026-11-27"));
        assertEquals(32, WidgetDatos.progreso("2026-10-28", "2026-11-27", "2026-10-28"));
        assertEquals(517, WidgetDatos.progreso("2024-02-01", "2024-02-29", "2024-02-15")); // 15 de 29 días (bisiesto)
        assertEquals(WidgetDatos.dia("2024-03-01") - WidgetDatos.dia("2024-02-28"), 2);
        assertEquals(0, WidgetDatos.dia("1970-01-01"));
    }
    @Test public void mesTerminado() {
        WidgetDatos.Vista v = WidgetDatos.calcular(true, "Te queda este mes", "Noviembre", "250,00 €", false, false, "2026-11-01", "2026-11-30", 1, "2026-12-01");
        assertEquals("Abre PalomApp", v.cifra);
        assertEquals("Empieza un mes nuevo", v.texto);
    }
    @Test public void sinFechasUsaLoGuardado() {
        WidgetDatos.Vista v = WidgetDatos.calcular(true, "", "Noviembre", "-12,00 €", false, true, "", "", 0.25, "2026-11-12");
        assertEquals(250, v.barra);
        assertTrue(v.negativo);
        assertEquals("Te queda este mes", v.texto);
    }
}

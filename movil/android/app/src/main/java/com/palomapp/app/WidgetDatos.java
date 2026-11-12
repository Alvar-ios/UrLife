package com.palomapp.app;

/**
 * Qué enseña el widget «Te queda este mes» con lo que dejó guardado la app (docs/40 C5).
 * Sin nada de Android para poder probarlo en el ordenador (WidgetDatosTest).
 */
public final class WidgetDatos {
    private WidgetDatos() {}

    /** Lo que se pinta: etiqueta de arriba, mes, cifra grande, barra (0–1000; -1 = sin barra) y si va en negativo. */
    public static final class Vista {
        public String texto = "", mes = "", cifra = "Abre PalomApp", descripcion = "PalomApp";
        public int barra = -1;
        public boolean negativo = false;
    }

    /** «AAAA-MM-DD» → número de día desde 1970 (sin zonas horarias; -1 si no se entiende). */
    static long dia(String iso) {
        if (iso == null || iso.length() < 10) return -1;
        try {
            int y = Integer.parseInt(iso.substring(0, 4)), m = Integer.parseInt(iso.substring(5, 7)), d = Integer.parseInt(iso.substring(8, 10));
            // algoritmo de días civiles (Howard Hinnant)
            y -= m <= 2 ? 1 : 0;
            long era = (y >= 0 ? y : y - 399) / 400, yoe = y - era * 400;
            long doy = (153L * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1, doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
            return era * 146097 + doe - 719468;
        } catch (Exception e) { return -1; }
    }

    /** Parte del mes que ya ha pasado (hoy cuenta como empezado), de 0 a 1000. -1 si no hay fechas. */
    public static int progreso(String desde, String hasta, String hoy) {
        long a = dia(desde), b = dia(hasta), h = dia(hoy);
        if (a < 0 || b < a || h < 0) return -1;
        double p = (double) (h - a + 1) / (double) (b - a + 1);
        return (int) Math.round(Math.max(0, Math.min(1, p)) * 1000);
    }

    public static Vista calcular(boolean sesion, String texto, String mes, String queda, boolean oculto, boolean negativo,
                                 String desde, String hasta, double progresoGuardado, String hoy) {
        Vista v = new Vista();
        if (!sesion) { v.texto = "PalomApp"; v.cifra = "Abre PalomApp"; v.descripcion = "PalomApp: abre la app para ver cuánto te queda"; return v; }
        v.texto = texto == null || texto.isEmpty() ? "Te queda este mes" : texto;
        v.mes = mes == null ? "" : mes;
        long h = dia(hoy), b = dia(hasta);
        if (h >= 0 && b >= 0 && h > b) { // el mes guardado ya terminó: no se enseñan cifras viejas
            v.texto = "Empieza un mes nuevo"; v.mes = ""; v.cifra = "Abre PalomApp"; v.descripcion = "Empieza un mes nuevo: abre PalomApp";
            return v;
        }
        v.cifra = oculto ? "•••" : (queda == null || queda.isEmpty() ? "Abre PalomApp" : queda);
        v.negativo = !oculto && negativo;
        int p = progreso(desde, hasta, hoy);
        if (p < 0 && progresoGuardado >= 0) p = (int) Math.round(Math.max(0, Math.min(1, progresoGuardado)) * 1000);
        v.barra = p;
        v.descripcion = v.texto + (v.mes.isEmpty() ? "" : ", " + v.mes) + ": " + (oculto ? "cifra oculta" : v.cifra);
        return v;
    }
}

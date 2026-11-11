package com.palomapp.app;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lee el texto de un aviso de una app de banco y saca un movimiento (importe, si entra o sale dinero, comercio y tipo).
 * Es un lector GENERAL (sirve para cualquier banco), con un par de detalles por app. Ante la duda, no devuelve nada:
 * mejor no apuntar que apuntar algo falso. Nunca se usa con códigos de verificación ni avisos de saldo o publicidad.
 * docs/39-avisos-del-banco.md · 11/11/2026
 */
public final class LectorAvisos {
    private LectorAvisos() {}

    public static final class Movimiento {
        public final double importe;   // siempre positivo
        public final boolean entra;    // true = ingreso; false = gasto
        public final String comercio;  // puede ir vacío
        public final String tipo;      // tarjeta | bizum | transferencia | recibo | cajero | nomina | devolucion | otro
        Movimiento(double importe, boolean entra, String comercio, String tipo) { this.importe = importe; this.entra = entra; this.comercio = comercio; this.tipo = tipo; }
        @Override public String toString() { return (entra ? "+" : "-") + importe + " " + tipo + " «" + comercio + "»"; }
    }

    // Lo que nunca se apunta
    private static final Pattern IGNORAR = Pattern.compile(
        "c[oó]digo|\\bclave\\b|\\botp\\b|contrase[nñ]a|verificaci|verification|\\bcode\\b|"
        + "confirma (tu|la|esta)|confirm (your|the)|autoriza (la|esta|tu)|pendiente de (autorizar|confirmar)|approve|"
        + "rechazad|denegad|declined|fallid|no se ha podido|cancelad|anulad|"
        + "saldo (disponible|actual|de tu|en tu)|tu saldo|balance|"
        + "promoci|oferta|sorteo|descuento|cashback de hasta|gana hasta|invita a|"
        + "l[ií]mite|inicio de sesi[oó]n|has iniciado|nuevo dispositivo|"
        + "programad|ma[nñ]ana se (cargar|cobrar)|pr[oó]ximo (recibo|cargo)|vence",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    // Importe con € o EUR al lado (antes o después). Admite «1.234,56», «12,5», «12.50», «1 234,56» y «-12,50».
    private static final String NUM = "(\\d{1,3}(?:[.\\u00a0 ]\\d{3})+(?:,\\d{1,2})?|\\d{1,3}(?:,\\d{3})+(?:\\.\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)";
    private static final Pattern IMP_DESPUES = Pattern.compile("([-−+])?\\s?" + NUM + "\\s?(?:€|eur(?:os?)?\\b)", Pattern.CASE_INSENSITIVE);
    private static final Pattern IMP_ANTES = Pattern.compile("([-−+])?\\s?(?:€|eur)\\s?([-−+])?\\s?" + NUM, Pattern.CASE_INSENSITIVE);

    private static final Pattern ENTRA = Pattern.compile(
        "ingreso|ingresad|has recibido|te han (enviado|transferido|pagado|devuelto|ingresado|hecho)|te ha (enviado|transferido|pagado|devuelto)|"
        + "recibid[oa]s?|abono|abonad|devoluci[oó]n|devuelto|reembolso|n[oó]mina|bizum recibido|transferencia recibida|"
        + "you (have )?received|received|refund|incoming|deposit|interest|intereses|dividendo",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern SALE = Pattern.compile(
        "compra|pago|has pagado|pagado|cargo|cargad|adeudo|recibo|retirada|reintegro|cajero|bizum enviado|has enviado|enviaste|"
        + "transferencia (enviada|realizada|emitida)|has (hecho|realizado|transferido)|you (spent|paid|sent)|spent|payment|paid|withdraw|purchase|card transaction",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    /** Lee un aviso. paquete = la app que lo manda (para los pocos detalles por app). Devuelve null si no es un movimiento claro. */
    public static Movimiento leer(String paquete, String titulo, String texto) {
        String t = limpiar(titulo), x = limpiar(texto);
        String todo = (t.isEmpty() ? "" : t + ". ") + x;
        if (todo.trim().isEmpty()) return null;
        if (IGNORAR.matcher(todo).find()) return null;

        // importe: el primero con € o EUR al lado
        Double imp = null; String signo = null; int finImp = -1, iniImp = -1;
        Matcher m = IMP_DESPUES.matcher(todo);
        Matcher a = IMP_ANTES.matcher(todo);
        boolean hayD = m.find(), hayA = a.find();
        if (hayD && (!hayA || m.start() <= a.start())) { imp = numero(m.group(2)); signo = m.group(1); iniImp = m.start(); finImp = m.end(); }
        else if (hayA) { imp = numero(a.group(3)); signo = a.group(1) != null ? a.group(1) : a.group(2); iniImp = a.start(); finImp = a.end(); }
        if (imp == null || imp <= 0 || imp > 1_000_000) return null;

        // ¿entra o sale? Signo explícito > palabras > detalle de la app
        Boolean entra = null;
        if (signo != null) entra = signo.equals("+");
        else {
            boolean e = ENTRA.matcher(todo).find(), s = SALE.matcher(todo).find();
            if (e && !s) entra = true;
            else if (s && !e) entra = false;
            else if (e && s) entra = ordenEntra(todo); // «Devolución de la compra…», «Has recibido un pago…»
            else if (paquete != null && paquete.startsWith("com.google.android.apps.walletnfcrel")) entra = false; // Google Wallet solo avisa de pagos
        }
        if (entra == null) return null; // ante la duda, no

        String tipo = tipoDe(todo, entra);
        String comercio = comercioDe(todo, t, x, iniImp, finImp, entra);
        return new Movimiento(Math.round(imp * 100.0) / 100.0, entra, comercio, tipo);
    }

    private static boolean ordenEntra(String s) {
        Matcher e = ENTRA.matcher(s), v = SALE.matcher(s);
        int ie = e.find() ? e.start() : Integer.MAX_VALUE, iv = v.find() ? v.start() : Integer.MAX_VALUE;
        // «Devolución de la compra en X» = entra; «Has recibido el recibo de X» → manda la primera palabra
        return ie <= iv;
    }

    static String limpiar(String s) {
        if (s == null) return "";
        return s.replace(' ', ' ').replace(' ', ' ').replaceAll("[\\r\\n\\t]+", " ").replaceAll(" {2,}", " ").trim();
    }

    /** «1.234,56» → 1234.56 · «12,5» → 12.5 · «12.50» → 12.5 · «1,234.56» → 1234.56 · «1 234,56» → 1234.56 */
    static Double numero(String n) {
        if (n == null) return null;
        String s = n.replace(' ', ' ').replace(" ", "");
        int c = s.lastIndexOf(','), p = s.lastIndexOf('.');
        try {
            if (c >= 0 && p >= 0) { // los dos: el último es el decimal
                if (c > p) s = s.replace(".", "").replace(',', '.'); else s = s.replace(",", "");
            } else if (c >= 0) {
                String dec = s.substring(c + 1);
                s = dec.length() == 3 && s.indexOf(',') == c ? s.replace(",", "") : s.replace(',', '.'); // «1,234» = mil
            } else if (p >= 0) {
                String dec = s.substring(p + 1);
                if (dec.length() == 3) s = s.replace(".", ""); // «1.234» = mil
            }
            return Double.parseDouble(s);
        } catch (NumberFormatException e) { return null; }
    }

    private static String tipoDe(String s, boolean entra) {
        String l = s.toLowerCase(Locale.ROOT);
        if (l.contains("bizum")) return "bizum";
        if (l.matches(".*(n[oó]mina|salario|payroll).*")) return "nomina";
        if (l.matches(".*(cajero|retirada|reintegro|withdraw|atm).*")) return "cajero";
        if (l.matches(".*(devoluci|devuelto|reembolso|refund).*")) return "devolucion";
        if (l.matches(".*(recibo|adeudo|domiciliaci|direct debit).*")) return "recibo";
        if (l.matches(".*(transferencia|transfer|traspaso).*")) return "transferencia";
        if (l.matches(".*(tarjeta|card|compra|purchase|spent|pago con|wallet|google pay|apple pay|contactless).*")) return "tarjeta";
        return "otro";
    }

    // Detrás de «en», «at», «a», «de», «from», «to», «por» … hasta un corte (con, el, día, punto, tarjeta…)
    private static final Pattern TRAS_EN = Pattern.compile("(?:\\ben|\\bat|\\bin)\\s+(.+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRAS_A = Pattern.compile("(?:\\ba|\\bpara|\\bto)\\s+(.+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRAS_DE = Pattern.compile("(?:\\bde|\\bdesde|\\bfrom|\\bpor parte de)\\s+(.+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern CORTE = Pattern.compile(
        "\\s+(con|el|la|del|on|with|using|mediante|desde tu|desde la|en tu|en la cuenta|a tu|por|via|vía|hoy|ayer|a las|at \\d|\\d{1,2}[/:]\\d{2}|tarjeta|card|terminada|acabada|\\*{2,}|•{2,}|x{3,}|concepto|ref)\\b.*|[.!·|(\\[,;].*",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern GENERICO = Pattern.compile(
        "^(tu|su|tus|cuenta|tarjeta|card|compra|pago|bizum|transferencia|transfer|recibo|ingreso|nuevo|nueva|movimiento|operaci[oó]n|"
        + "aviso|alerta|notificaci[oó]n|santander|sabadell|n26|trade republic|bbva|caixabank|ing|revolut|openbank|bankinter|imagin|unicaja|abanca|google|wallet|euros?|eur)\\b.*",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static String comercioDe(String todo, String titulo, String texto, int ini, int fin, boolean entra) {
        String tras = fin >= 0 && fin <= todo.length() ? todo.substring(fin) : "";
        String antes = ini > 0 ? todo.substring(0, ini) : "";
        String c = null;
        c = primero(TRAS_EN, tras);
        if (c == null) c = entra ? primero(TRAS_DE, tras) : primero(TRAS_A, tras);
        if (c == null) c = primero(TRAS_EN, antes);
        if (c == null) c = entra ? primero(TRAS_DE, antes) : primero(TRAS_A, antes);
        if (c == null && entra) { // «Ana te ha enviado 15 €»
            Matcher m = Pattern.compile("^([\\p{L}][\\p{L} .'-]{1,30}?)\\s+te ha", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE).matcher(texto);
            if (m.find()) c = m.group(1);
        }
        if (c == null && !titulo.isEmpty() && !GENERICO.matcher(titulo).matches() && !titulo.matches(".*\\d.*")) c = titulo; // Google Wallet: el título es el comercio
        return pulir(c);
    }

    private static String primero(Pattern p, String s) {
        if (s == null || s.isEmpty()) return null;
        Matcher m = p.matcher(s);
        while (m.find()) {
            String c = pulir(CORTE.matcher(m.group(1)).replaceFirst(""));
            if (c != null && !GENERICO.matcher(c).matches() && !c.matches("^[\\d\\s.,€-]+$")) return c;
        }
        return null;
    }

    private static String pulir(String c) {
        if (c == null) return "";
        c = c.replaceAll("[\"«»“”']", "").replaceAll("\\s{2,}", " ").trim();
        c = c.replaceAll("[\\s:.-]+$", "");
        if (c.length() > 40) c = c.substring(0, 40).trim();
        if (c.length() < 2) return "";
        // «MERCADONA S.A.» → «Mercadona S.A.» cuando viene todo en mayúsculas
        if (c.equals(c.toUpperCase(Locale.ROOT)) && c.matches(".*\\p{L}{3,}.*")) {
            StringBuilder b = new StringBuilder(); boolean ini = true;
            for (char ch : c.toLowerCase(new Locale("es", "ES")).toCharArray()) { b.append(ini && Character.isLetter(ch) ? Character.toUpperCase(ch) : ch); ini = !Character.isLetterOrDigit(ch); }
            c = b.toString();
        }
        return Normalizer.normalize(c, Normalizer.Form.NFC);
    }
}

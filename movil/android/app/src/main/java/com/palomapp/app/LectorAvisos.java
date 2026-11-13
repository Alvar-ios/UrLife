package com.palomapp.app;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lee el texto de un aviso de una app de banco y saca un movimiento (importe, si entra o sale dinero, comercio y tipo).
 * Es un lector GENERAL (sirve para cualquier banco). Ante la duda, no devuelve nada: mejor no apuntar que apuntar algo falso.
 * Privacidad (docs/39b): el «comercio» solo se saca de un sitio donde se paga («en X», «at X», el título de Google Wallet o
 * el nombre en mayúsculas tras el importe de un cargo). Nunca de «de X» / «a X» / «X te ha…», que suelen ser personas.
 * docs/39-avisos-del-banco.md · 11/11/2026 (revisado tras Calidad)
 */
public final class LectorAvisos {
    private LectorAvisos() {}

    public static final class Movimiento {
        public final double importe;   // siempre positivo
        public final boolean entra;    // true = ingreso; false = gasto
        public final String comercio;  // puede ir vacío
        public final String tipo;      // tarjeta | bizum | transferencia | recibo | cajero | nomina | devolucion | intereses | dividendo | otro
        Movimiento(double importe, boolean entra, String comercio, String tipo) { this.importe = importe; this.entra = entra; this.comercio = comercio; this.tipo = tipo; }
        @Override public String toString() { return (entra ? "+" : "-") + importe + " " + tipo + " «" + comercio + "»"; }
    }

    private static final int F = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE;

    // Lo que nunca se apunta: códigos, cosas que aún no han pasado o no han salido bien, inversiones y publicidad
    private static final Pattern IGNORAR = Pattern.compile(
        "c[oó]digo|\\bclave\\b|\\botp\\b|contrase[nñ]a|verificaci|verification|\\bcode\\b|"
        + "confirma (tu|la|esta|el)|confirm (your|the)|pendiente|autoriza (la|esta|tu)|approve|preautoriz|retenci[oó]n|"
        + "rechazad|denegad|declined|fallid|failed|no se ha podido|cancelad|anulad|revertid|retrocedid|reversed|insufficient|fondos insuficientes|caducad|expirad|expired|"
        + "llegar[aá] (ma[nñ]ana|pronto|hoy|el d[ií]a)|se (cargar|cobrar|abonar|pagar)[aá]|cargaremos|cobraremos|abonaremos|pr[oó]ximo (recibo|cargo|pago)|vence|ma[nñ]ana se|recuerda|"
        + "resumen|este mes has|esta semana has|en lo que va de|semanal|mensual|"
        + "a tu (espacio|hucha|cuenta|ahorro|bolsillo|pocket|vault|meta)|entre tus cuentas|traspaso|to your (savings|space|pocket|vault)|"
        + "te (ha|han) (solicitado|pedido)|te pide|solicitud de|"
        + "orden de (compra|venta)|plan de inversi|acciones|\\betf\\b|participaciones|has cambiado|cambio de divisa|"
        + "promoci[oó]n|sorteo|gana hasta|consigue|por cada amigo|invita a|cashback de hasta|descuento de|"
        + "l[ií]mite de (gasto|tu tarjeta|cr[eé]dito)|inicio de sesi[oó]n|has iniciado|nuevo dispositivo",
        F);
    // El saldo se quita del texto (un aviso de cargo que añade el saldo sí se lee)
    private static final Pattern SALDO = Pattern.compile("(tu saldo|saldo( disponible| actual)?|balance)\\b[^.!\\n]*", F);

    // Importe con € o EUR al lado. Miles con punto (o espacio duro); nunca pegado a otra cifra, «/» o «*» (tarjeta, fecha).
    private static final String NUM = "(\\d{1,3}(?: \\d{3})+,\\d{2}|\\d{1,3}(?:[.\\u00a0\\u202f]\\d{3})+(?:,\\d{1,2})?|\\d{1,3}(?:,\\d{3})+(?:\\.\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)";
    // signo solo si va pegado a la cifra («-12,50 €»); « - 15 €» es un guion que separa
    private static final String SIG = "(?:(?<![\\p{L}\\d])([-−+])(?=€?\\d))?";
    private static final Pattern IMP_DESPUES = Pattern.compile(SIG + "(?<![\\d/*.,])" + NUM + "\\s?(?:€|eur(?:os?)?\\b)", F);
    private static final Pattern IMP_ANTES = Pattern.compile(SIG + "(?:€|\\beur)\\s?([-−+])?\\s?" + NUM, F);

    private static final Pattern ENTRA = Pattern.compile(
        "ingreso|ingresad|has recibido|te (han|ha) (enviado|transferido|pagado|devuelto|ingresado|hecho)|"
        + "recibid[oa]s?|abono|abonad|devoluci[oó]n|devuelto|reembolso|n[oó]mina|intereses|dividendo|"
        + "you (have )?received|received|refund|incoming|deposit|interest|paid you|been paid|sent you|has cobrado",
        F);
    private static final Pattern SALE = Pattern.compile(
        "compra|pago|has pagado|pagado|pagaste|has gastado|gastaste|te han cobrado|cobro de|charged|cargo|cargad|adeudo|recibo|retirada|has retirado|reintegro|cajero|has enviado|enviaste|"
        + "con tarjeta|operaci[oó]n con|movimiento en tu tarjeta|autorizada|transferencia (enviada|realizada|emitida|ejecutada)|has (hecho|realizado|transferido)|"
        + "you (spent|paid|sent)|spent|payment|paid|withdraw|purchase|card transaction",
        F);
    // si salen las dos cosas, manda lo concreto
    private static final Pattern GANA_ENTRA = Pattern.compile("devoluci|reembolso|refund|devuelto|abono|te (ha|han) (enviado|transferido|pagado|devuelto)|has recibido|recibid[oa]|received|paid you|been paid|sent you|has cobrado", F);
    private static final Pattern RECIBO_RECIBIDO = Pattern.compile("recibid[oa]s? (un|el|tu|nuevo) (nuevo )?recibo", F);
    private static final Pattern GANA_SALE = Pattern.compile("\\brecibo\\b|adeudo|\\bcargo\\b|domiciliaci", F);

    /** Lee un aviso. paquete = la app que lo manda. Devuelve null si no es un movimiento claro. */
    public static Movimiento leer(String paquete, String titulo, String texto) {
        String t = limpiar(titulo), x = limpiar(texto);
        String todo = (t.isEmpty() ? "" : t + ". ") + x;
        if (todo.trim().isEmpty()) return null;
        if (IGNORAR.matcher(todo).find()) return null;
        todo = SALDO.matcher(todo).replaceAll(" ");

        Double imp = null; String signo = null; int finImp = -1, iniImp = -1;
        Matcher m = IMP_DESPUES.matcher(todo), a = IMP_ANTES.matcher(todo);
        boolean hayD = m.find(), hayA = a.find();
        if (hayD && (!hayA || m.start() <= a.start())) { imp = numero(m.group(2)); signo = m.group(1); iniImp = m.start(); finImp = m.end(); }
        else if (hayA) { imp = numero(a.group(3)); signo = a.group(1) != null ? a.group(1) : a.group(2); iniImp = a.start(); finImp = a.end(); }
        if (imp == null || imp <= 0 || imp > 1_000_000) return null;

        Boolean entra = null;
        boolean e = ENTRA.matcher(todo).find(), s = SALE.matcher(todo).find();
        if (signo != null) entra = signo.equals("+");
        else if (e && !s) entra = true;
        else if (s && !e) entra = false;
        else if (e && s) {
            if (RECIBO_RECIBIDO.matcher(todo).find()) entra = false;          // «Has recibido un recibo de Iberdrola»
            else if (GANA_ENTRA.matcher(todo).find()) entra = true;           // «Pago recibido», «Ana paid you», «Devolución de la compra»
            else if (GANA_SALE.matcher(todo).find()) entra = false;
            else entra = ordenEntra(todo);
        } else if (paquete != null && paquete.startsWith("com.google.android.apps.walletnfcrel")) entra = false; // Google Wallet solo avisa de pagos
        if (entra == null) return null; // ante la duda, no

        String tipo = tipoDe(todo, entra);
        String comercio = entra ? "" : comercioDe(paquete, todo, t, iniImp, finImp, tipo); // en lo que entra suele haber una persona: no se guarda
        return new Movimiento(Math.round(imp * 100.0) / 100.0, entra, comercio, tipo);
    }

    private static boolean ordenEntra(String s) {
        Matcher e = ENTRA.matcher(s), v = SALE.matcher(s);
        int ie = e.find() ? e.start() : Integer.MAX_VALUE, iv = v.find() ? v.start() : Integer.MAX_VALUE;
        return ie <= iv;
    }

    static String limpiar(String s) {
        if (s == null) return "";
        return s.replace(' ', ' ').replace(' ', ' ').replaceAll("[\\r\\n\\t]+", " ").replaceAll(" {2,}", " ").trim();
    }

    /** «1.234,56» → 1234.56 · «12,5» → 12.5 · «12.50» → 12.5 · «1,234.56» → 1234.56 · «1 234,56» → 1234.56 */
    static Double numero(String n) {
        if (n == null) return null;
        String s = n.replace(' ', ' ').replace(' ', ' ').replace(" ", "");
        int c = s.lastIndexOf(','), p = s.lastIndexOf('.');
        try {
            if (c >= 0 && p >= 0) { if (c > p) s = s.replace(".", "").replace(',', '.'); else s = s.replace(",", ""); }
            else if (c >= 0) { String dec = s.substring(c + 1); s = dec.length() == 3 && s.indexOf(',') == c ? s.replace(",", "") : s.replace(',', '.'); }
            else if (p >= 0) { String dec = s.substring(p + 1); if (dec.length() == 3) s = s.replace(".", ""); }
            return Double.parseDouble(s);
        } catch (NumberFormatException e) { return null; }
    }

    private static String tipoDe(String s, boolean entra) {
        String l = s.toLowerCase(Locale.ROOT);
        if (l.contains("bizum")) return "bizum";
        if (l.matches(".*(n[oó]mina|salario|sueldo|haberes|payroll).*")) return "nomina";
        if (entra && l.matches(".*(intereses|interest).*")) return "intereses";
        if (entra && l.contains("dividendo")) return "dividendo";
        if (l.matches(".*(cajero|retirada|has retirado|reintegro|withdraw|atm).*")) return "cajero";
        if (l.matches(".*(devoluci|devuelto|reembolso|refund).*")) return "devolucion";
        if (l.matches(".*(recibo|adeudo|domiciliaci|direct debit).*")) return "recibo";
        if (l.matches(".*(transferencia|transfer|traspaso|paypal|has enviado|te ha enviado|te ha pagado).*")) return "transferencia";
        if (entra && l.matches(".*(has recibido|te ha llegado|recibido de|received).*")) return "transferencia"; // 13/11: dinero de otra persona, no nómina
        if (l.matches(".*(tarjeta|card|compra|purchase|spent|pago|pagado|wallet|google pay|apple pay|contactless).*")) return "tarjeta";
        return "otro";
    }

    private static final Pattern TRAS_EN = Pattern.compile("(?:\\ben|\\bat|\\bin)\\s+(.+)", F);
    private static final Pattern MAYUS_TRAS = Pattern.compile("^[\\s:·-]*([A-ZÁÉÍÓÚÑÜ0-9][A-ZÁÉÍÓÚÑÜ0-9 .&'*-]{2,40})");
    private static final Pattern CORTE = Pattern.compile(
        "\\s+(con|el|la|de|del|on|with|using|mediante|desde tu|desde la|en tu|en la cuenta|a tu|por|via|vía|hoy|ayer|a las|at \\d|\\d{1,2}[/:]\\d{2}|tarjeta|card|terminada|acabada|\\*{2,}|•{2,}|x{3,}|concepto|ref|a|to|for|by|was|has been)\\b.*|[.!·|(\\[,;:].*",
        F);
    private static final Pattern GENERICO = Pattern.compile(
        "^(tu|su|tus|cuenta|tarjeta|card|compra|pago|bizum|transferencia|transfer|recibo|ingreso|nuevo|nueva|movimiento|operaci[oó]n|cajero|efectivo|un cajero|"
        + "aviso|alerta|notificaci[oó]n|santander|sabadell|n26|trade republic|bbva|caixabank|ing|revolut|openbank|bankinter|imagin|unicaja|abanca|paypal|google|wallet|euros?|eur)\\b.*",
        F);

    private static String comercioDe(String paquete, String todo, String titulo, int ini, int fin, String tipo) {
        String tras = fin >= 0 && fin <= todo.length() ? todo.substring(fin) : "";
        String antes = ini > 0 ? todo.substring(0, ini) : "";
        String c = primero(TRAS_EN, tras);
        if (c == null && ("tarjeta".equals(tipo) || "recibo".equals(tipo))) { // «-12,50 € MERCADONA», «45,20 € VODAFONE» (solo en compras y recibos: si no, puede ser una persona)
            Matcher m = MAYUS_TRAS.matcher(tras);
            if (m.find()) { String k = pulir(CORTE.matcher(m.group(1)).replaceFirst("")); if (!k.isEmpty() && !GENERICO.matcher(k).matches() && k.matches(".*\\p{L}{2,}.*")) c = k; }
        }
        if (c == null) c = primero(TRAS_EN, antes);
        boolean wallet = paquete != null && paquete.startsWith("com.google.android.apps.walletnfcrel");
        if (c == null && wallet && !titulo.isEmpty() && !GENERICO.matcher(titulo).matches() && !titulo.matches(".*\\d.*")) c = titulo; // Google Wallet: el título es el comercio
        return pulir(c);
    }

    private static String primero(Pattern p, String s) {
        if (s == null || s.isEmpty()) return null;
        Matcher m = p.matcher(s);
        while (m.find()) {
            String c = pulir(CORTE.matcher(m.group(1)).replaceFirst(""));
            if (!c.isEmpty() && !GENERICO.matcher(c).matches() && !c.matches("^[\\d\\s.,€-]+$")) return c;
        }
        return null;
    }

    private static String pulir(String c) {
        if (c == null) return "";
        c = c.replaceAll("[\"«»“”']", "").replaceAll("[^\\p{L}\\p{N}\\s.&*-]", "").replaceAll("\\s{2,}", " ").trim();
        c = c.replaceAll("[\\s:.*-]+$", "");
        if (c.length() > 40) c = c.substring(0, 40).trim();
        if (c.length() < 2) return "";
        if (c.equals(c.toUpperCase(Locale.ROOT)) && c.matches(".*\\p{L}{3,}.*")) {
            StringBuilder b = new StringBuilder(); boolean ini = true;
            for (char ch : c.toLowerCase(new Locale("es", "ES")).toCharArray()) { b.append(ini && Character.isLetter(ch) ? Character.toUpperCase(ch) : ch); ini = !Character.isLetterOrDigit(ch); }
            c = b.toString();
        }
        return Normalizer.normalize(c, Normalizer.Form.NFC);
    }
}

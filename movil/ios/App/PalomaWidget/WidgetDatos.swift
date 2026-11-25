import Foundation

/*
 Lo que comparten la app y el widget de la pantalla de inicio (iPhone, 25/11/2026, docs/49 B1+B2).
 Sin nada de pantalla (solo Foundation) para poder probarlo en el ordenador: movil/ios/PruebasWidget.
 Las reglas son las mismas que en Android (WidgetDatos.java).

 Privacidad: en la «cajita compartida» (App Group) solo se guarda lo que se VE en el widget
 (rótulo, mes, cifra, fechas del mes). Nunca claves, correo ni sesión.
*/

public enum WidgetClaves {
    public static let grupo = "group.es.palomapp.finanzas"
    public static let resumen = "widgetResumen"
    public static let esquema = "palomapp"
}

/// Lo que deja la web en el móvil (misma forma que `widgetResumen()` en app.js)
public struct ResumenGuardado: Codable, Equatable {
    public var sesion: Bool
    public var texto: String
    public var mes: String
    public var queda: String
    public var oculto: Bool
    public var negativo: Bool
    public var progreso: Double // 0 a 1; -1 = sin dato
    public var desde: String
    public var hasta: String

    public init(sesion: Bool = false, texto: String = "", mes: String = "", queda: String = "", oculto: Bool = false,
                negativo: Bool = false, progreso: Double = -1, desde: String = "", hasta: String = "") {
        self.sesion = sesion; self.texto = texto; self.mes = mes; self.queda = queda; self.oculto = oculto
        self.negativo = negativo; self.progreso = progreso; self.desde = desde; self.hasta = hasta
    }

    public static let vacio = ResumenGuardado()
    /// Para la vista previa de la galería de widgets (datos inventados)
    public static let ejemplo = ResumenGuardado(sesion: true, texto: "Te queda este mes", mes: "Noviembre", queda: "1.234,56 €",
                                                oculto: false, negativo: false, progreso: 0.5, desde: "2026-11-01", hasta: "2026-11-30")
}

public enum WidgetAlmacen {
    static func recorta(_ v: Any?, _ max: Int) -> String { String(((v as? String) ?? "").prefix(max)) }

    /// Del diccionario que manda la web al resumen que se guarda: solo los campos que se ven, con límite de largo
    public static func resumen(desde d: [String: Any]) -> ResumenGuardado {
        guard (d["sesion"] as? Bool) == true else { return .vacio }
        let oculto = (d["oculto"] as? Bool) == true
        var p = -1.0
        if let n = d["progreso"] as? NSNumber { p = n.doubleValue }
        return ResumenGuardado(
            sesion: true,
            texto: recorta(d["texto"], 40),
            mes: recorta(d["mes"], 20),
            queda: oculto ? "•••" : recorta(d["queda"], 24), // con las cifras ocultas no sale ni una cifra del móvil
            oculto: oculto,
            negativo: !oculto && (d["negativo"] as? Bool) == true,
            progreso: p.isFinite ? p : -1,
            desde: recorta(d["desde"], 10),
            hasta: recorta(d["hasta"], 10))
    }

    /// Sin sesión se BORRA todo lo guardado
    public static func guardar(_ d: [String: Any], en defaults: UserDefaults) {
        let r = resumen(desde: d)
        if !r.sesion { defaults.removeObject(forKey: WidgetClaves.resumen); return }
        if let data = try? JSONEncoder().encode(r) { defaults.set(data, forKey: WidgetClaves.resumen) }
    }

    public static func leer(de defaults: UserDefaults?) -> ResumenGuardado {
        guard let data = defaults?.data(forKey: WidgetClaves.resumen), let r = try? JSONDecoder().decode(ResumenGuardado.self, from: data) else { return .vacio }
        return r
    }
}

/// Lo que se pinta
public struct VistaWidget: Equatable {
    public var texto = "", mes = "", cifra = "Abre PalomApp", descripcion = "PalomApp"
    public var barra = -1 // 0 a 1000; -1 = sin barra
    public var negativo = false
    public var diasQuedan = -1 // -1 = no se sabe
    public init() {}
}

public enum WidgetDatos {
    /// «AAAA-MM-DD» → número de día desde 1970 (sin zonas horarias; -1 si no se entiende)
    public static func dia(_ iso: String) -> Int {
        let c = Array(iso.utf8)
        guard c.count >= 10, c[4] == 45, c[7] == 45,
              let y0 = Int(String(iso.prefix(4))), let m = Int(String(iso.dropFirst(5).prefix(2))), let d = Int(String(iso.dropFirst(8).prefix(2))),
              (1...12).contains(m), (1...31).contains(d) else { return -1 }
        let y = m <= 2 ? y0 - 1 : y0 // días civiles (Howard Hinnant)
        let era = (y >= 0 ? y : y - 399) / 400, yoe = y - era * 400
        let doy = (153 * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1, doe = yoe * 365 + yoe / 4 - yoe / 100 + doy
        return era * 146097 + doe - 719468
    }

    /// Parte del mes que ya ha pasado (hoy cuenta como empezado), de 0 a 1000. -1 si no hay fechas.
    public static func progreso(desde: String, hasta: String, hoy: String) -> Int {
        let a = dia(desde), b = dia(hasta), h = dia(hoy)
        if a < 0 || b < a || h < 0 { return -1 }
        let p = Double(h - a + 1) / Double(b - a + 1)
        return Int((max(0, min(1, p)) * 1000).rounded())
    }

    public static func calcular(_ r: ResumenGuardado, hoy: String) -> VistaWidget {
        var v = VistaWidget()
        if !r.sesion { v.texto = "PalomApp"; v.cifra = "Abre PalomApp"; v.descripcion = "PalomApp: abre la app para ver cuánto te queda"; return v }
        v.texto = r.texto.isEmpty ? "Te queda este mes" : r.texto
        v.mes = r.mes
        let h = dia(hoy), b = dia(r.hasta)
        if h >= 0 && b >= 0 && h > b { // el mes guardado ya terminó: no se enseñan cifras viejas
            v.texto = "Empieza un mes nuevo"; v.mes = ""; v.cifra = "Abre PalomApp"; v.descripcion = "Empieza un mes nuevo: abre PalomApp"
            return v
        }
        v.cifra = r.oculto ? "•••" : (r.queda.isEmpty ? "Abre PalomApp" : r.queda)
        v.negativo = !r.oculto && r.negativo
        var p = progreso(desde: r.desde, hasta: r.hasta, hoy: hoy)
        if p < 0 && r.progreso >= 0 { p = Int((max(0, min(1, r.progreso)) * 1000).rounded()) }
        v.barra = p
        if h >= 0 && b >= 0 { v.diasQuedan = b - h }
        v.descripcion = v.texto + (v.mes.isEmpty ? "" : ", " + v.mes) + ": " + (r.oculto ? "cifra oculta" : v.cifra)
        return v
    }

    /// «Quedan 5 días», «Queda 1 día», «Último día del mes»; vacío si no se sabe
    public static func diasTexto(_ n: Int) -> String {
        if n < 0 { return "" }
        if n == 0 { return "Último día del mes" }
        return n == 1 ? "Queda 1 día" : "Quedan \(n) días"
    }

    /// El día de hoy como «AAAA-MM-DD» en la zona del móvil
    public static func iso(_ d: Date, calendario: Calendar = .current) -> String {
        let c = calendario.dateComponents([.year, .month, .day], from: d)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }
}

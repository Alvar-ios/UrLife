import WidgetKit
import SwiftUI

/*
 Widgets de PalomApp para la pantalla de inicio del iPhone (25/11/2026, docs/49 B1+B2).
 - «Te queda este mes» (pequeño y mediano): lee el resumen que dejó la app en la cajita compartida (App Group).
 - «Apuntar gasto» (pequeño): abre PalomApp directamente en un gasto nuevo (palomapp://gasto).
 Aspecto: oscuro como el de Android; en claro, papel claro con el violeta de la paleta de la app.
*/

// MARK: - Colores

extension Color {
    init(hex: UInt32) {
        self.init(.sRGB, red: Double((hex >> 16) & 255) / 255, green: Double((hex >> 8) & 255) / 255, blue: Double(hex & 255) / 255, opacity: 1)
    }
    static func dinamico(claro: UInt32, oscuro: UInt32) -> Color {
        Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(Color(hex: oscuro)) : UIColor(Color(hex: claro)) })
    }
}

enum Paleta {
    static let fondo = Color.dinamico(claro: 0xF7F5FB, oscuro: 0x16161E)
    static let texto = Color.dinamico(claro: 0x16161E, oscuro: 0xFFFFFF)
    static let suave = Color.dinamico(claro: 0x5B5B6B, oscuro: 0xB4B4C4)
    static let acento = Color.dinamico(claro: 0x6D3FE0, oscuro: 0xFFC93C)
    static let sobreAcento = Color.dinamico(claro: 0xFFFFFF, oscuro: 0x16161E)
    static let negativo = Color.dinamico(claro: 0xB3261E, oscuro: 0xFF8A8A)
    static let pista = Color.dinamico(claro: 0xE3DEF0, oscuro: 0x2C2C38)
}

extension View {
    /// iOS 17 pide el fondo «del contenedor»; en iOS 16 se pinta a mano
    @ViewBuilder func fondoWidget() -> some View {
        if #available(iOS 17.0, *) { self.containerBackground(Paleta.fondo, for: .widget) }
        else { self.padding(14).background(Paleta.fondo) }
    }
}

// MARK: - Te queda este mes

struct EntradaQueda: TimelineEntry {
    let date: Date
    let resumen: ResumenGuardado
}

struct ProveedorQueda: TimelineProvider {
    func leer() -> ResumenGuardado { WidgetAlmacen.leer(de: UserDefaults(suiteName: WidgetClaves.grupo)) }
    func placeholder(in context: Context) -> EntradaQueda { EntradaQueda(date: Date(), resumen: .ejemplo) }
    func getSnapshot(in context: Context, completion: @escaping (EntradaQueda) -> Void) {
        completion(EntradaQueda(date: Date(), resumen: context.isPreview ? .ejemplo : leer()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<EntradaQueda>) -> Void) {
        let ahora = Date(), r = leer()
        // una entrada para ahora y otra a medianoche (cambia el día: la barra avanza y, si acabó el mes, «Empieza un mes nuevo»)
        let medianoche = Calendar.current.nextDate(after: ahora, matching: DateComponents(hour: 0, minute: 0, second: 5), matchingPolicy: .nextTime) ?? ahora.addingTimeInterval(6 * 3600)
        let entradas = [EntradaQueda(date: ahora, resumen: r), EntradaQueda(date: medianoche, resumen: r)]
        completion(Timeline(entries: entradas, policy: .after(ahora.addingTimeInterval(3 * 3600))))
    }
}

struct VistaQueda: View {
    @Environment(\.widgetFamily) var familia
    let entrada: EntradaQueda

    var body: some View {
        let v = WidgetDatos.calcular(entrada.resumen, hoy: WidgetDatos.iso(entrada.date))
        let grande = familia == .systemMedium
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Text(v.texto).font(.system(size: 12)).foregroundColor(Paleta.suave).lineLimit(1)
                Spacer(minLength: 0)
                if !v.mes.isEmpty { Text(v.mes).font(.system(size: 12, weight: .bold)).foregroundColor(Paleta.acento).lineLimit(1) }
            }
            Spacer(minLength: 0)
            Text(v.cifra)
                .font(.system(size: grande ? 40 : 28, weight: .bold, design: .rounded))
                .minimumScaleFactor(0.4).lineLimit(1)
                .foregroundColor(v.negativo ? Paleta.negativo : Paleta.texto)
                .privacySensitive() // con el móvil bloqueado el sistema tapa la cifra
            if v.barra >= 0 {
                if grande, v.diasQuedan >= 0 {
                    Text(WidgetDatos.diasTexto(v.diasQuedan)).font(.system(size: 12)).foregroundColor(Paleta.suave).lineLimit(1)
                }
                Barra(parte: Double(v.barra) / 1000)
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(v.descripcion)
        .widgetURL(URL(string: "\(WidgetClaves.esquema)://inicio"))
        .fondoWidget()
    }
}

struct Barra: View {
    let parte: Double
    var body: some View {
        GeometryReader { g in
            ZStack(alignment: .leading) {
                Capsule().fill(Paleta.pista)
                Capsule().fill(Paleta.acento).frame(width: max(6, g.size.width * CGFloat(min(1, max(0, parte)))))
            }
        }
        .frame(height: 6)
    }
}

struct QuedaWidget: Widget {
    let kind = "es.palomapp.finanzas.queda"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ProveedorQueda()) { VistaQueda(entrada: $0) }
            .configurationDisplayName("Te queda este mes")
            .description("Lo que te queda este mes y cuánto mes ha pasado.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Apuntar gasto

struct EntradaGasto: TimelineEntry { let date: Date }

struct ProveedorGasto: TimelineProvider {
    func placeholder(in context: Context) -> EntradaGasto { EntradaGasto(date: Date()) }
    func getSnapshot(in context: Context, completion: @escaping (EntradaGasto) -> Void) { completion(EntradaGasto(date: Date())) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<EntradaGasto>) -> Void) {
        completion(Timeline(entries: [EntradaGasto(date: Date())], policy: .never)) // no cambia nunca
    }
}

struct VistaGasto: View {
    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle().fill(Paleta.acento)
                Image(systemName: "plus").font(.system(size: 26, weight: .bold)).foregroundColor(Paleta.sobreAcento)
            }
            .frame(width: 56, height: 56)
            Text("Gasto").font(.system(size: 15, weight: .semibold)).foregroundColor(Paleta.texto)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Apuntar un gasto en PalomApp")
        .widgetURL(URL(string: "\(WidgetClaves.esquema)://gasto"))
        .fondoWidget()
    }
}

struct GastoWidget: Widget {
    let kind = "es.palomapp.finanzas.gasto"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ProveedorGasto()) { _ in VistaGasto() }
            .configurationDisplayName("Apuntar gasto")
            .description("Apunta un gasto en dos toques.")
            .supportedFamilies([.systemSmall])
    }
}

@main
struct PalomaWidgetBundle: WidgetBundle {
    var body: some Widget {
        QuedaWidget()
        GastoWidget()
    }
}

import UIKit
import Capacitor
import Security
import AppIntents

/*
 PalomApp en iPhone (24/11/2026).
 iPhone no deja que una app lea los avisos de otra. Con la app Atajos (iOS 27: automatización «Notificación»; y desde iOS 17,
 «Wallet»/«Transacción» con cada pago de Apple Pay) la persona manda a PalomApp el texto del aviso o el pago.
 Aquí solo se guarda en una cola de ESTE móvil (UserDefaults). La web de dentro lo lee con LA.leer (el mismo lector que Android),
 apunta el movimiento y borra la cola. El texto del aviso nunca sale del móvil.
*/

// La cola de lo que llega por Atajos (24/11, revisión de Datos y Seguridad):
// - un archivo por aviso en Application Support/atajos, FUERA de las copias de iCloud y con protección «completeUnlessOpen»
//   (se puede escribir con el móvil bloqueado, que es cuando llegan los avisos; leerlo pide haberlo desbloqueado);
// - cada aviso lleva la cuenta con sesión (`uid`); sin sesión no se guarda nada; al cerrar sesión se vacía;
// - lo que tiene más de 7 días se tira; como mucho 50 y el texto cortado a 300 caracteres.
enum AtajosCola {
    static let lock = NSLock()
    static let maxDias: Double = 7, maxAvisos = 50
    static var dir: URL? {
        guard let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else { return nil }
        var d = base.appendingPathComponent("atajos", isDirectory: true)
        if !FileManager.default.fileExists(atPath: d.path) {
            try? FileManager.default.createDirectory(at: d, withIntermediateDirectories: true, attributes: [.protectionKey: FileProtectionType.completeUnlessOpen])
        }
        var rv = URLResourceValues(); rv.isExcludedFromBackup = true; try? d.setResourceValues(rv)
        return d
    }
    static var uid: String { UserDefaults.standard.string(forKey: "atajosUid") ?? "" }
    static func ponerCuenta(_ u: String) {
        lock.lock(); defer { lock.unlock() }
        let antes = uid
        UserDefaults.standard.set(u, forKey: "atajosUid")
        if u.isEmpty || (!antes.isEmpty && antes != u) { vaciarSinLock() } // otra cuenta o nadie: lo pendiente no pasa a nadie
    }
    static func anadir(_ x: [String: Any]) {
        lock.lock(); defer { lock.unlock() }
        let u = uid; guard !u.isEmpty, let d = dir else { return }
        var y = x
        let id = UUID().uuidString.lowercased(), ahora = Date().timeIntervalSince1970 * 1000
        y["id"] = id; y["ts"] = ahora; y["uid"] = u
        guard let data = try? JSONSerialization.data(withJSONObject: y) else { return }
        try? data.write(to: d.appendingPathComponent(id + ".json"), options: [.atomic, .completeFileProtectionUnlessOpen])
        // 25/11: «Probar PalomApp» solo comprueba que Atajos y PalomApp se hablan; no cuenta como aviso recibido
        UserDefaults.standard.set(ahora, forKey: (y["tipo"] as? String) == "prueba" ? "atajosPrueba" : "atajosUltimo")
        _ = leerSinLock() // tira lo viejo y lo que sobra
    }
    static func leerSinLock() -> [[String: Any]] {
        guard let d = dir, let fs = try? FileManager.default.contentsOfDirectory(at: d, includingPropertiesForKeys: nil) else { return [] }
        let limite = Date().timeIntervalSince1970 * 1000 - maxDias * 86400000
        var l: [(URL, [String: Any])] = []
        for f in fs where f.pathExtension == "json" {
            guard let data = try? Data(contentsOf: f), let o = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { try? FileManager.default.removeItem(at: f); continue }
            if ((o["ts"] as? Double) ?? 0) < limite { try? FileManager.default.removeItem(at: f); continue }
            l.append((f, o))
        }
        l.sort { (($0.1["ts"] as? Double) ?? 0) < (($1.1["ts"] as? Double) ?? 0) }
        while l.count > maxAvisos { try? FileManager.default.removeItem(at: l.removeFirst().0) }
        return l.map { $0.1 }
    }
    static func leer() -> [[String: Any]] { lock.lock(); defer { lock.unlock() }; return leerSinLock() }
    static func quitar(_ ids: [String]) {
        lock.lock(); defer { lock.unlock() }
        guard let d = dir else { return }
        for id in ids where id.range(of: "^[a-z0-9-]{8,64}$", options: .regularExpression) != nil { try? FileManager.default.removeItem(at: d.appendingPathComponent(id + ".json")) }
    }
    static func vaciarSinLock() {
        if let d = dir { try? FileManager.default.removeItem(at: d) }
        UserDefaults.standard.removeObject(forKey: "atajosUltimo")
        UserDefaults.standard.removeObject(forKey: "atajosPrueba")
    }
}

// El banco del aviso: se elige de una lista en la acción de Atajos (así nunca se lee un WhatsApp u otra app)
@available(iOS 16.0, *)
enum BancoAtajo: String, AppEnum {
    case bbva, santander, caixabank, ing, sabadell, bankinter, unicaja, openbank, imagin, abanca, kutxabank, ibercaja, cajamar, evo, laboral, cajarural, selfbank, deutschebank, revolut, n26, wise, bunq, paypal, myinvestor, traderepublic
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Banco"
    static var caseDisplayRepresentations: [BancoAtajo: DisplayRepresentation] = [
            .bbva: "BBVA",
            .santander: "Santander",
            .caixabank: "CaixaBank",
            .ing: "ING",
            .sabadell: "Banco Sabadell",
            .bankinter: "Bankinter",
            .unicaja: "Unicaja",
            .openbank: "Openbank",
            .imagin: "imagin",
            .abanca: "Abanca",
            .kutxabank: "Kutxabank",
            .ibercaja: "Ibercaja",
            .cajamar: "Cajamar",
            .evo: "EVO Banco",
            .laboral: "Laboral Kutxa",
            .cajarural: "Caja Rural",
            .selfbank: "Self Bank",
            .deutschebank: "Deutsche Bank",
            .revolut: "Revolut",
            .n26: "N26",
            .wise: "Wise",
            .bunq: "bunq",
            .paypal: "PayPal",
            .myinvestor: "MyInvestor",
            .traderepublic: "Trade Republic"
    ]
}

// «Apuntar aviso en PalomApp»: en Atajos, «Banco» = el tuyo y «Texto del aviso» = Entrada del atajo
@available(iOS 16.0, *)
struct ApuntarAvisoIntent: AppIntent {
    static var title: LocalizedStringResource = "Apuntar aviso en PalomApp"
    static var description = IntentDescription("Lee el aviso de tu banco y apunta el gasto o el ingreso en PalomApp. El texto no sale de tu móvil.")
    static var openAppWhenRun: Bool = false
    @Parameter(title: "Banco") var banco: BancoAtajo
    @Parameter(title: "Texto del aviso") var texto: String
    static var parameterSummary: some ParameterSummary { Summary("Apuntar aviso de \(\.$banco): \(\.$texto)") }
    func perform() async throws -> some IntentResult {
        let t = String(texto.prefix(300))
        if !t.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            AtajosCola.anadir(["tipo": "aviso", "texto": t, "banco": banco.rawValue])
        }
        return .result()
    }
}

// «Apuntar pago de Apple Pay»: en Atajos (Wallet/Transacción), Importe y Comercio = los de la entrada del atajo
@available(iOS 16.0, *)
struct ApuntarPagoIntent: AppIntent {
    static var title: LocalizedStringResource = "Apuntar pago de Apple Pay"
    static var description = IntentDescription("Apunta en PalomApp un pago hecho con la cartera del móvil.")
    static var openAppWhenRun: Bool = false
    @Parameter(title: "Importe") var importe: String
    @Parameter(title: "Comercio") var comercio: String?
    @Parameter(title: "Tarjeta") var tarjeta: String?
    func perform() async throws -> some IntentResult {
        AtajosCola.anadir(["tipo": "applepay", "importe": String(importe.prefix(40)), "comercio": String((comercio ?? "").prefix(60)), "tarjeta": String((tarjeta ?? "").prefix(40))])
        return .result()
    }
}

// «Probar PalomApp» (25/11): el usuario la pulsa en Atajos para ver que PalomApp la recibe. No apunta ningún gasto.
@available(iOS 16.0, *)
struct ProbarPalomAppIntent: AppIntent {
    static var title: LocalizedStringResource = "Probar PalomApp"
    static var description = IntentDescription("Comprueba que Atajos y PalomApp se están hablando. No apunta ningún gasto.")
    static var openAppWhenRun: Bool = false
    func perform() async throws -> some IntentResult & ProvidesDialog {
        if AtajosCola.uid.isEmpty { return .result(dialog: "Abre PalomApp, entra con tu cuenta y vuelve a probar.") }
        AtajosCola.anadir(["tipo": "prueba"])
        return .result(dialog: "Listo: PalomApp ha recibido la prueba.")
    }
}

@available(iOS 16.0, *)
struct PalomaAtajos: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: ApuntarAvisoIntent(), phrases: ["Apuntar aviso en \(.applicationName)"], shortTitle: "Apuntar aviso", systemImageName: "bell.badge")
        AppShortcut(intent: ApuntarPagoIntent(), phrases: ["Apuntar pago en \(.applicationName)"], shortTitle: "Apuntar pago", systemImageName: "creditcard")
        AppShortcut(intent: ProbarPalomAppIntent(), phrases: ["Probar \(.applicationName)"], shortTitle: "Probar", systemImageName: "checkmark.seal")
    }
}

// El puente con la web: window.__nativo.atajos (movil/nativo-src.js)
@objc(AtajosPlugin)
public class AtajosPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AtajosPlugin"
    public let jsName = "Atajos"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "pendientes", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "quitar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "info", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cuenta", returnType: CAPPluginReturnPromise)
    ]
    /// La cuenta con sesión ("" al salir: se vacía la cola)
    @objc func cuenta(_ call: CAPPluginCall) { AtajosCola.ponerCuenta(call.getString("uid") ?? ""); call.resolve() }
    @objc func pendientes(_ call: CAPPluginCall) { call.resolve(["lista": AtajosCola.leer()]) }
    @objc func quitar(_ call: CAPPluginCall) {
        let ids = (call.getArray("ids") ?? []).compactMap { $0 as? String }
        AtajosCola.quitar(ids); call.resolve()
    }
    @objc func info(_ call: CAPPluginCall) {
        call.resolve(["ios": UIDevice.current.systemVersion, "usado": UserDefaults.standard.double(forKey: "atajosUltimo"), "prueba": UserDefaults.standard.double(forKey: "atajosPrueba")])
    }
}

// Clave de la copia local sin conexión (docs/52). La web cifra con AES-GCM la copia de tus datos y la cola de cambios
// pendientes; aquí solo se guarda la clave: 32 bytes aleatorios en el Llavero (Keychain) de este iPhone, solo con el móvil
// desbloqueado alguna vez y sin pasar a otros aparatos ni a iCloud. olvidar() la borra al cerrar sesión.
@objc(ClaveLocalPlugin)
public class ClaveLocalPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ClaveLocalPlugin"
    public let jsName = "ClaveLocal"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "obtener", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "olvidar", returnType: CAPPluginReturnPromise)
    ]
    private static let servicio = "es.palomapp.finanzas.clavelocal"
    private static func consulta() -> [String: Any] {
        return [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: servicio, kSecAttrAccount as String: "clave"]
    }
    @objc func obtener(_ call: CAPPluginCall) {
        var q = ClaveLocalPlugin.consulta()
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: AnyObject?
        if SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let d = out as? Data, d.count == 32 {
            call.resolve(["clave": d.base64EncodedString()]); return
        }
        var raw = [UInt8](repeating: 0, count: 32)
        guard SecRandomCopyBytes(kSecRandomDefault, 32, &raw) == errSecSuccess else { call.reject("clave_no_disponible"); return }
        SecItemDelete(ClaveLocalPlugin.consulta() as CFDictionary)
        var nuevo = ClaveLocalPlugin.consulta()
        nuevo[kSecValueData as String] = Data(raw)
        nuevo[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        guard SecItemAdd(nuevo as CFDictionary, nil) == errSecSuccess else { call.reject("clave_no_disponible"); return }
        call.resolve(["clave": Data(raw).base64EncodedString()])
    }
    @objc func olvidar(_ call: CAPPluginCall) {
        SecItemDelete(ClaveLocalPlugin.consulta() as CFDictionary)
        call.resolve()
    }
}

// La pantalla de la app (Main.storyboard la usa) registra los puentes de Atajos y de los widgets
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AtajosPlugin())
        bridge?.registerPluginInstance(PalomaWidgetsPlugin())
        bridge?.registerPluginInstance(ClaveLocalPlugin())
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

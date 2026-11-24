import UIKit
import Capacitor
import AppIntents

/*
 PalomApp en iPhone (24/11/2026).
 iPhone no deja que una app lea los avisos de otra. Con la app Atajos (iOS 27: automatización «Notificación»; y desde iOS 17,
 «Wallet»/«Transacción» con cada pago de Apple Pay) la persona manda a PalomApp el texto del aviso o el pago.
 Aquí solo se guarda en una cola de ESTE móvil (UserDefaults). La web de dentro lo lee con LA.leer (el mismo lector que Android),
 apunta el movimiento y borra la cola. El texto del aviso nunca sale del móvil.
*/

// La cola de lo que llega por Atajos (máximo 200; lo más viejo se cae)
enum AtajosCola {
    static let clave = "atajosCola"
    static let lock = NSLock()
    static func anadir(_ x: [String: Any]) {
        lock.lock(); defer { lock.unlock() }
        var l = (UserDefaults.standard.array(forKey: clave) as? [[String: Any]]) ?? []
        var y = x
        y["id"] = UUID().uuidString.lowercased()
        y["ts"] = Date().timeIntervalSince1970 * 1000
        l.append(y)
        if l.count > 200 { l.removeFirst(l.count - 200) }
        UserDefaults.standard.set(l, forKey: clave)
        UserDefaults.standard.set(Date().timeIntervalSince1970 * 1000, forKey: "atajosUltimo")
    }
    static func leer() -> [[String: Any]] { lock.lock(); defer { lock.unlock() }; return (UserDefaults.standard.array(forKey: clave) as? [[String: Any]]) ?? [] }
    static func quitar(_ ids: [String]) {
        lock.lock(); defer { lock.unlock() }
        let fuera = Set(ids)
        let l = ((UserDefaults.standard.array(forKey: clave) as? [[String: Any]]) ?? []).filter { !fuera.contains(($0["id"] as? String) ?? "") }
        UserDefaults.standard.set(l, forKey: clave)
    }
}

// «Apuntar aviso en PalomApp»: en Atajos, «Texto del aviso» = Entrada del atajo (el aviso del banco)
@available(iOS 16.0, *)
struct ApuntarAvisoIntent: AppIntent {
    static var title: LocalizedStringResource = "Apuntar aviso en PalomApp"
    static var description = IntentDescription("Lee el aviso de tu banco y apunta el gasto o el ingreso en PalomApp. El texto no sale de tu móvil.")
    static var openAppWhenRun: Bool = false
    @Parameter(title: "Texto del aviso") var texto: String
    @Parameter(title: "Título") var titulo: String?
    @Parameter(title: "App") var app: String?
    func perform() async throws -> some IntentResult {
        let t = String(texto.prefix(600))
        if !t.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            AtajosCola.anadir(["tipo": "aviso", "texto": t, "titulo": String((titulo ?? "").prefix(200)), "app": String((app ?? "").prefix(60))])
        }
        return .result()
    }
}

// «Apuntar pago de Apple Pay»: en Atajos (Wallet/Transacción), Importe y Comercio = los de la entrada del atajo
@available(iOS 16.0, *)
struct ApuntarPagoIntent: AppIntent {
    static var title: LocalizedStringResource = "Apuntar pago de Apple Pay"
    static var description = IntentDescription("Apunta en PalomApp un pago hecho con Apple Pay.")
    static var openAppWhenRun: Bool = false
    @Parameter(title: "Importe") var importe: String
    @Parameter(title: "Comercio") var comercio: String?
    @Parameter(title: "Tarjeta") var tarjeta: String?
    func perform() async throws -> some IntentResult {
        AtajosCola.anadir(["tipo": "applepay", "importe": String(importe.prefix(40)), "comercio": String((comercio ?? "").prefix(80)), "tarjeta": String((tarjeta ?? "").prefix(60))])
        return .result()
    }
}

@available(iOS 16.0, *)
struct PalomaAtajos: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: ApuntarAvisoIntent(), phrases: ["Apuntar aviso en \(.applicationName)"], shortTitle: "Apuntar aviso", systemImageName: "bell.badge")
        AppShortcut(intent: ApuntarPagoIntent(), phrases: ["Apuntar pago en \(.applicationName)"], shortTitle: "Apuntar pago", systemImageName: "creditcard")
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
        CAPPluginMethod(name: "info", returnType: CAPPluginReturnPromise)
    ]
    @objc func pendientes(_ call: CAPPluginCall) { call.resolve(["lista": AtajosCola.leer()]) }
    @objc func quitar(_ call: CAPPluginCall) {
        let ids = (call.getArray("ids") ?? []).compactMap { $0 as? String }
        AtajosCola.quitar(ids); call.resolve()
    }
    @objc func info(_ call: CAPPluginCall) {
        call.resolve(["ios": UIDevice.current.systemVersion, "usado": UserDefaults.standard.double(forKey: "atajosUltimo")])
    }
}

// La pantalla de la app (Main.storyboard la usa) registra el puente de Atajos
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AtajosPlugin())
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

import Foundation
import Capacitor
import WidgetKit

/*
 Puente entre la web y los widgets de la pantalla de inicio (iPhone, docs/49 B1+B2).
 Mismo nombre y mismo método que en Android (PalomaWidgets.guardar): la web casi no cambia.
 Guarda en la cajita compartida (App Group) SOLO lo que se ve en el widget (ver WidgetDatos.swift) y avisa a iOS
 de que lo repinte. Con sesion:false (al cerrar sesión) se borra todo. «Qué pidió el widget al abrir la app»
 no pasa por aquí: lo recoge la web con el aviso «palomapp://…» (movil/widgets-ios.js).
*/
@objc(PalomaWidgetsPlugin)
public class PalomaWidgetsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PalomaWidgetsPlugin"
    public let jsName = "PalomaWidgets"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "guardar", returnType: CAPPluginReturnPromise)
    ]

    @objc func guardar(_ call: CAPPluginCall) {
        var datos = [String: Any]()
        for (k, v) in call.options { if let k = k as? String { datos[k] = v } }
        if let defaults = UserDefaults(suiteName: WidgetClaves.grupo) {
            WidgetAlmacen.guardar(datos, en: defaults)
            WidgetCenter.shared.reloadAllTimelines()
        }
        call.resolve()
    }
}

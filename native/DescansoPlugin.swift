// Puente entre la app (JavaScript) y la tarjeta del descanso en la pantalla de bloqueo.
import Foundation
import Capacitor
#if canImport(ActivityKit)
import ActivityKit
#endif

@objc(DescansoPlugin)
public class DescansoPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DescansoPlugin"
    public let jsName = "Descanso"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "iniciar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "parar", returnType: CAPPluginReturnPromise)
    ]

    @objc func iniciar(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            let segundos = call.getDouble("segundos") ?? 0
            let nombre = call.getString("nombre") ?? "Descanso"
            let serie = call.getInt("serie") ?? 0
            let total = call.getInt("total") ?? 0
            Task {
                for vieja in Activity<DescansoAttributes>.activities {
                    await vieja.end(nil, dismissalPolicy: .immediate)
                }
                guard segundos > 0, ActivityAuthorizationInfo().areActivitiesEnabled else {
                    call.resolve(["ok": false])
                    return
                }
                let fin = Date().addingTimeInterval(segundos)
                let estado = DescansoAttributes.ContentState(fin: fin, serie: serie, total: total)
                do {
                    let tarjeta = try Activity.request(
                        attributes: DescansoAttributes(nombre: nombre),
                        content: ActivityContent(state: estado, staleDate: fin),
                        pushType: nil)
                    // Se da por terminada desde ahora, pidiendo que siga a la vista hasta el final del descanso:
                    // así iOS la quita sola a esa hora aunque la app esté dormida.
                    await tarjeta.end(ActivityContent(state: estado, staleDate: fin), dismissalPolicy: .after(fin))
                    call.resolve(["ok": true])
                } catch {
                    call.resolve(["ok": false, "error": error.localizedDescription])
                }
            }
            return
        }
        #endif
        call.resolve(["ok": false])
    }

    @objc func parar(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            Task {
                for vieja in Activity<DescansoAttributes>.activities {
                    await vieja.end(nil, dismissalPolicy: .immediate)
                }
                call.resolve()
            }
            return
        }
        #endif
        call.resolve()
    }
}

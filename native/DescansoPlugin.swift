// Puente entre la app (JavaScript) y el descanso del lado del iPhone.
import Foundation
import Capacitor

@objc(DescansoPlugin)
public class DescansoPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DescansoPlugin"
    public let jsName = "Descanso"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "iniciar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "parar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "estado", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "probar", returnType: CAPPluginReturnPromise)
    ]

    override public func load() {
        // Si quedó una tarjeta de una sesión anterior, se quita al abrir la app.
        DispatchQueue.main.async {
            if DescansoMotor.shared.fin == nil { DescansoMotor.shared.quitarTarjeta() }
        }
    }

    @objc func iniciar(_ call: CAPPluginCall) {
        let segundos = call.getDouble("segundos") ?? 0
        let nombre = call.getString("nombre") ?? "Descanso"
        let imagen = call.getString("imagen") ?? ""
        let serie = call.getInt("serie") ?? 0
        let series = call.getInt("total") ?? 0
        let sonido = call.getBool("sonido") ?? true
        let cuenta = call.getBool("cuenta") ?? true
        let silencio = call.getBool("silencio") ?? true
        let tarjeta = call.getBool("tarjeta") ?? true
        DispatchQueue.main.async {
            DescansoMotor.shared.iniciar(segundos: segundos, nombre: nombre, imagen: imagen, serie: serie, series: series,
                                         sonido: sonido, cuenta: cuenta, silencio: silencio, tarjeta: tarjeta)
            call.resolve(["ok": true])
        }
    }

    @objc func parar(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            DescansoMotor.shared.parar()
            call.resolve()
        }
    }

    @objc func estado(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let m = DescansoMotor.shared
            call.resolve(["fin": (m.fin?.timeIntervalSince1970 ?? 0) * 1000, "total": m.total])
        }
    }

    @objc func probar(_ call: CAPPluginCall) {
        let silencio = call.getBool("silencio") ?? true
        DispatchQueue.main.async {
            DescansoMotor.shared.probar(silencio: silencio)
            call.resolve()
        }
    }
}

// Botones de la tarjeta (quitar y reiniciar). Se compila en la app y en el widget;
// al tocarlos, iOS corre "perform" dentro de la app aunque esté en segundo plano.
import Foundation
#if canImport(AppIntents)
import AppIntents

@available(iOS 17.0, *)
struct PararDescansoIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Quitar el descanso"
    func perform() async throws -> some IntentResult {
        #if !WIDGET
        await MainActor.run { DescansoMotor.shared.parar() }
        #endif
        return .result()
    }
}

@available(iOS 17.0, *)
struct ReiniciarDescansoIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Reiniciar el descanso"
    func perform() async throws -> some IntentResult {
        #if !WIDGET
        await MainActor.run { DescansoMotor.shared.reiniciar() }
        #endif
        return .result()
    }
}
#endif

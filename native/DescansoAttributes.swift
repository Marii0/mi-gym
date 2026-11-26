// Datos de la tarjeta del descanso. Este mismo archivo se compila en la app y en el widget.
import Foundation
#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.1, *)
struct DescansoAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var fin: Date      // cuándo termina el descanso
        var serie: Int     // series ya hechas
        var total: Int     // series del ejercicio
    }
    var nombre: String     // ejercicio
}
#endif

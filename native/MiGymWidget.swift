// Tarjeta del descanso: pantalla de bloqueo e isla dinámica.
import WidgetKit
import SwiftUI
import UIKit
import ActivityKit
import AppIntents

private let lima = Color(red: 0.71, green: 0.95, blue: 0.24)

@main
struct MiGymWidgets: WidgetBundle {
    var body: some Widget {
        DescansoActividad()
    }
}

private func dibujo(_ nombre: String) -> UIImage? {
    guard !nombre.isEmpty, let ruta = Bundle.main.path(forResource: nombre, ofType: "png", inDirectory: "dib") else { return nil }
    return UIImage(contentsOfFile: ruta)
}

private func icono() -> UIImage? {
    guard let ruta = Bundle.main.path(forResource: "icono-isla", ofType: "png") else { return nil }
    return UIImage(contentsOfFile: ruta)
}

struct Reloj: View {
    let fin: Date
    var body: some View {
        // El intervalo nunca puede empezar después de terminar.
        Text(timerInterval: min(Date(), fin)...fin, countsDown: true, showsHours: false)
            .monospacedDigit()
    }
}

struct Series: View {
    let hechas: Int
    let total: Int
    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<min(max(total, 0), 8), id: \.self) { i in
                ZStack {
                    Circle().fill(i < hechas ? lima : Color.clear)
                    Circle().stroke(i < hechas ? lima : Color.white.opacity(0.45), lineWidth: 1.5)
                    Text("\(i + 1)")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(i < hechas ? Color.black : Color.white.opacity(0.6))
                }
                .frame(width: 20, height: 20)
            }
        }
    }
}

struct Icono: View {
    var body: some View {
        if let img = icono() {
            Image(uiImage: img).resizable().scaledToFit().frame(width: 22, height: 22).clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
        } else {
            Image(systemName: "dumbbell.fill").foregroundColor(lima)
        }
    }
}

struct Botones: View {
    var body: some View {
        if #available(iOS 17.0, *) {
            HStack(spacing: 8) {
                Button(intent: PararDescansoIntent()) {
                    Image(systemName: "xmark").font(.system(size: 17, weight: .bold)).foregroundColor(.white)
                        .frame(width: 62, height: 40)
                        .background(Color.white.opacity(0.16), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(.plain)
                Button(intent: ReiniciarDescansoIntent()) {
                    Image(systemName: "arrow.clockwise").font(.system(size: 17, weight: .bold)).foregroundColor(lima)
                        .frame(width: 62, height: 40)
                        .background(lima.opacity(0.28), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
    }
}

struct TarjetaDescanso: View {
    let nombre: String
    let imagen: String
    let fin: Date
    let hechas: Int
    let total: Int
    let listo: Bool
    var body: some View {
        HStack(alignment: .center, spacing: 10) {
            VStack(alignment: .leading, spacing: 6) {
                if let img = dibujo(imagen) {
                    Image(uiImage: img).resizable().scaledToFit().frame(width: 84, height: 60, alignment: .leading)
                }
                Text(nombre).font(.headline).foregroundColor(.white).lineLimit(1)
                if total > 0 { Series(hechas: hechas, total: total) }
            }
            Spacer(minLength: 6)
            VStack(alignment: .trailing, spacing: 4) {
                Text("DESCANSO").font(.caption.weight(.semibold)).foregroundColor(Color.white.opacity(0.6))
                if listo {
                    Text("Listo").font(.system(size: 40, weight: .bold, design: .rounded)).foregroundColor(lima)
                } else {
                    Reloj(fin: fin)
                        .font(.system(size: 46, weight: .bold, design: .rounded))
                        .foregroundColor(lima)
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: 140, alignment: .trailing)
                    Botones()
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }
}

struct DescansoActividad: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DescansoAttributes.self) { ctx in
            TarjetaDescanso(nombre: ctx.attributes.nombre, imagen: ctx.attributes.imagen, fin: ctx.state.fin,
                            hechas: ctx.state.serie, total: ctx.state.total, listo: ctx.isStale)
                .activityBackgroundTint(Color(red: 0.08, green: 0.09, blue: 0.12).opacity(0.88))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        Icono()
                        Text("Descanso").font(.caption).foregroundColor(Color.white.opacity(0.7))
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Reloj(fin: ctx.state.fin)
                        .font(.title2.weight(.bold))
                        .foregroundColor(lima)
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: 90, alignment: .trailing)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text(ctx.attributes.nombre).font(.headline).lineLimit(1)
                        Spacer(minLength: 8)
                        Botones()
                    }
                }
            } compactLeading: {
                Icono()
            } compactTrailing: {
                Reloj(fin: ctx.state.fin)
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundColor(lima)
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: 46, alignment: .trailing)
            } minimal: {
                Icono()
            }
        }
    }
}

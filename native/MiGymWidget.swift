// Tarjeta del descanso: pantalla de bloqueo (y la isla dinámica mientras la actividad esté viva).
import WidgetKit
import SwiftUI
import ActivityKit

private let lima = Color(red: 0.71, green: 0.95, blue: 0.24)

@main
struct MiGymWidgets: WidgetBundle {
    var body: some Widget {
        DescansoActividad()
    }
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
        HStack(spacing: 6) {
            ForEach(0..<min(max(total, 0), 8), id: \.self) { i in
                Circle()
                    .fill(i < hechas ? lima : Color.clear)
                    .overlay(Circle().stroke(i < hechas ? lima : Color.white.opacity(0.45), lineWidth: 1.5))
                    .frame(width: 15, height: 15)
            }
        }
    }
}

struct DescansoActividad: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DescansoAttributes.self) { ctx in
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 7) {
                    Text("DESCANSO")
                        .font(.caption.weight(.semibold))
                        .foregroundColor(Color.white.opacity(0.6))
                    Text(ctx.attributes.nombre)
                        .font(.headline)
                        .foregroundColor(.white)
                        .lineLimit(1)
                    if ctx.state.total > 0 {
                        Series(hechas: ctx.state.serie, total: ctx.state.total)
                    }
                }
                Spacer(minLength: 8)
                Reloj(fin: ctx.state.fin)
                    .font(.system(size: 46, weight: .bold, design: .rounded))
                    .foregroundColor(lima)
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: 150, alignment: .trailing)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 16)
            .activityBackgroundTint(Color(red: 0.08, green: 0.09, blue: 0.12).opacity(0.88))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text("Descanso").font(.caption).foregroundColor(Color.white.opacity(0.7))
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Reloj(fin: ctx.state.fin)
                        .font(.title2.weight(.bold))
                        .foregroundColor(lima)
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: 90, alignment: .trailing)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(ctx.attributes.nombre).font(.headline).lineLimit(1)
                }
            } compactLeading: {
                Image(systemName: "dumbbell.fill").foregroundColor(lima)
            } compactTrailing: {
                Reloj(fin: ctx.state.fin).foregroundColor(lima).frame(maxWidth: 48)
            } minimal: {
                Image(systemName: "timer").foregroundColor(lima)
            }
        }
    }
}

// Lleva el descanso del lado del iPhone: mantiene viva la app con audio en silencio (se mezcla con tu música),
// suena 3, 2, 1 y el final aunque el teléfono esté bloqueado, y pone y quita la tarjeta de la pantalla de bloqueo.
import Foundation
import AVFoundation
import AudioToolbox
#if canImport(ActivityKit)
import ActivityKit
#endif

final class DescansoMotor: NSObject {
    static let shared = DescansoMotor()

    private(set) var fin: Date?
    private(set) var total: Double = 0
    private var nombre = "Descanso"
    private var imagen = ""
    private var serie = 0
    private var series = 0
    private var conSonido = true
    private var conCuenta = true
    private var enSilencio = true
    private var conTarjeta = true

    private var silencio: AVAudioPlayer?
    private var voces: [AVAudioPlayer] = []
    private var pendientes: [DispatchWorkItem] = []
    private var idCuenta: SystemSoundID = 0
    private var idFin: SystemSoundID = 0

    // ---------- Lo que pide la app ----------
    func iniciar(segundos: Double, nombre: String, imagen: String, serie: Int, series: Int,
                 sonido: Bool, cuenta: Bool, silencio: Bool, tarjeta: Bool) {
        cancelarPendientes()
        guard segundos > 0 else { parar(); return }
        total = segundos
        self.nombre = nombre
        self.imagen = imagen
        self.serie = serie
        self.series = series
        conSonido = sonido
        conCuenta = cuenta
        enSilencio = silencio
        conTarjeta = tarjeta
        let hasta = Date().addingTimeInterval(segundos)
        fin = hasta
        mantenerVivo()
        programar(hasta)
        mostrarTarjeta(hasta)
    }

    func reiniciar() {
        guard total > 0 else { return }
        cancelarPendientes()
        let hasta = Date().addingTimeInterval(total)
        fin = hasta
        mantenerVivo()
        programar(hasta)
        actualizarTarjeta(hasta)
    }

    func parar() {
        cancelarPendientes()
        fin = nil
        quitarTarjeta()
        soltarAudio()
    }

    func probar(silencio: Bool) {
        cancelarPendientes()
        enSilencio = silencio
        conSonido = true
        mantenerVivo()
        sonar(ultimo: true)
        if fin == nil { en(3) { [weak self] in self?.soltarAudio() } }
    }

    // ---------- Tiempo ----------
    private func programar(_ hasta: Date) {
        let falta = hasta.timeIntervalSinceNow
        if conCuenta {
            for n in [3.0, 2.0, 1.0] where falta > n + 0.3 {
                en(falta - n) { [weak self] in self?.sonar(ultimo: false) }
            }
        }
        en(max(0, falta)) { [weak self] in self?.terminar() }
    }

    private func terminar() {
        fin = nil
        sonar(ultimo: true)
        quitarTarjeta()
        en(3) { [weak self] in self?.soltarAudio() }
    }

    private func en(_ segundos: Double, _ bloque: @escaping () -> Void) {
        let w = DispatchWorkItem(block: bloque)
        pendientes.append(w)
        DispatchQueue.main.asyncAfter(deadline: .now() + segundos, execute: w)
    }

    private func cancelarPendientes() {
        pendientes.forEach { $0.cancel() }
        pendientes = []
    }

    // ---------- Sonido y vibración ----------
    private func archivo(_ nombre: String) -> URL? {
        return Bundle.main.url(forResource: nombre, withExtension: "wav")
    }

    // El tono "Pulso" del propio iPhone, si iOS deja leerlo; si no, el de la app.
    private lazy var urlFin: URL? = {
        let candidatos = [
            "/System/Library/PrivateFrameworks/ToneLibrary.framework/AlertTones/Modern/Pulse.m4r",
            "/System/Library/PrivateFrameworks/ToneLibrary.framework/AlertTones/Pulse.m4r",
            "/System/Library/Audio/UISounds/Modern/sms_alert_pulse.caf"
        ]
        for c in candidatos where FileManager.default.isReadableFile(atPath: c) {
            return URL(fileURLWithPath: c)
        }
        return self.archivo("fin")
    }()

    private func sonar(ultimo: Bool) {
        if conSonido {
            if enSilencio {
                // Suena aunque el interruptor de silencio esté puesto.
                var p: AVAudioPlayer?
                if let u = ultimo ? urlFin : archivo("cuenta") { p = try? AVAudioPlayer(contentsOf: u) }
                if p == nil, ultimo, let u = archivo("fin") { p = try? AVAudioPlayer(contentsOf: u) }
                if let p = p {
                    p.volume = 1
                    p.prepareToPlay()
                    p.play()
                    voces.append(p)
                    if voces.count > 6 { voces.removeFirst() }
                }
            } else {
                // Respeta el interruptor de silencio.
                if idCuenta == 0, let u = archivo("cuenta") { AudioServicesCreateSystemSoundID(u as CFURL, &idCuenta) }
                if idFin == 0, let u = archivo("fin") { AudioServicesCreateSystemSoundID(u as CFURL, &idFin) }
                let id = ultimo ? idFin : idCuenta
                if id != 0 { AudioServicesPlaySystemSound(id) }
            }
        }
        AudioServicesPlaySystemSound(ultimo ? kSystemSoundID_Vibrate : SystemSoundID(1519))
    }

    private func mantenerVivo() {
        let s = AVAudioSession.sharedInstance()
        try? s.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? s.setActive(true)
        if silencio == nil, let p = try? AVAudioPlayer(data: DescansoMotor.wavSilencio()) {
            p.numberOfLoops = -1
            p.volume = 0.01
            silencio = p
        }
        silencio?.play()
    }

    private func soltarAudio() {
        guard fin == nil else { return }
        silencio?.stop()
        voces = []
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
    }

    // Un segundo de silencio en formato WAV, armado en memoria.
    private static func wavSilencio() -> Data {
        let n = 16000
        var d = Data()
        func u32(_ v: UInt32) { var x = v.littleEndian; d.append(Data(bytes: &x, count: 4)) }
        func u16(_ v: UInt16) { var x = v.littleEndian; d.append(Data(bytes: &x, count: 2)) }
        d.append(Data("RIFF".utf8)); u32(UInt32(36 + n)); d.append(Data("WAVEfmt ".utf8))
        u32(16); u16(1); u16(1); u32(8000); u32(16000); u16(2); u16(16)
        d.append(Data("data".utf8)); u32(UInt32(n)); d.append(Data(count: n))
        return d
    }

    // ---------- Tarjeta de la pantalla de bloqueo e isla dinámica ----------
    private func mostrarTarjeta(_ hasta: Date) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            let estado = DescansoAttributes.ContentState(fin: hasta, serie: serie, total: series)
            let datos = DescansoAttributes(nombre: nombre, imagen: imagen)
            let mostrar = conTarjeta
            Task {
                for vieja in Activity<DescansoAttributes>.activities {
                    await vieja.end(nil, dismissalPolicy: .immediate)
                }
                guard mostrar, ActivityAuthorizationInfo().areActivitiesEnabled else { return }
                _ = try? Activity.request(attributes: datos, content: ActivityContent(state: estado, staleDate: hasta), pushType: nil)
            }
        }
        #endif
    }

    private func actualizarTarjeta(_ hasta: Date) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            let estado = DescansoAttributes.ContentState(fin: hasta, serie: serie, total: series)
            Task {
                for viva in Activity<DescansoAttributes>.activities {
                    await viva.update(ActivityContent(state: estado, staleDate: hasta))
                }
            }
        }
        #endif
    }

    func quitarTarjeta() {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            Task {
                for vieja in Activity<DescansoAttributes>.activities {
                    await vieja.end(nil, dismissalPolicy: .immediate)
                }
            }
        }
        #endif
    }
}

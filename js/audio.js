/* Pitido del descanso y pantalla encendida.
   El pitido se programa en el reloj de audio en cuanto empieza el descanso, así suena puntual
   por la bocina o por los audífonos que estén conectados (el iPhone decide la salida). */
(function () {
  const G = window.GYM, S = G.Store;
  let ctx = null, nodos = [], finAudio = 0, candado = null;
  // En la app nativa, además del pitido se programa una notificación con sonido:
  // suena aunque el iPhone esté bloqueado o la app esté en segundo plano.
  const NATIVO = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const P = NATIVO ? window.Capacitor.Plugins : {};
  function permiso() { if (NATIVO && P.LocalNotifications) P.LocalNotifications.requestPermissions().catch(() => {}); }
  function avisar(segundos, texto) {
    if (!NATIVO || !P.LocalNotifications || !S.state.settings.sonido) return;
    P.LocalNotifications.schedule({ notifications: [{
      id: 1, title: 'Descanso terminado', body: texto || 'Sigue con tu entrenamiento', sound: 'pitido.wav',
      schedule: { at: new Date(Date.now() + segundos * 1000 + 900), allowWhileIdle: true }
    }] }).catch(() => {});
  }
  function quitarAviso() { if (NATIVO && P.LocalNotifications) P.LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {}); }

  function tipoSesion() {
    // "ambient" se mezcla con tu música pero respeta el modo silencio del iPhone.
    // "playback" suena aunque esté en silencio, pero puede pausar la música.
    try { if (navigator.audioSession) navigator.audioSession.type = S.state.settings.enSilencio ? 'playback' : 'ambient'; } catch (e) { /* no disponible */ }
  }

  // Hay que llamarla desde un toque del usuario (iOS no deja sonar nada sin eso).
  function preparar() {
    if (!S.state.settings.sonido) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    tipoSesion();
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  }

  function tono(cuando, frecuencia, duracion, volumen) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = frecuencia;
    g.gain.setValueAtTime(0.0001, cuando);
    g.gain.exponentialRampToValueAtTime(volumen, cuando + 0.02);
    g.gain.setValueAtTime(volumen, cuando + duracion - 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, cuando + duracion);
    o.connect(g); g.connect(ctx.destination);
    o.start(cuando); o.stop(cuando + duracion + 0.02);
    nodos.push(o, g);
  }
  function pitidoFinal(t) { tono(t, 880, 0.18, 0.9); tono(t + 0.25, 880, 0.18, 0.9); tono(t + 0.5, 1175, 0.5, 0.9); }

  function cancelar() {
    nodos.forEach(n => { try { n.disconnect(); } catch (e) { /* ya estaba suelto */ } });
    nodos = []; finAudio = 0;
    quitarAviso();
  }

  // Programa el pitido para dentro de "segundos" (con 3, 2, 1 antes si está activado).
  function programar(segundos, texto) {
    nodos.forEach(n => { try { n.disconnect(); } catch (e) { /* ya estaba suelto */ } });
    nodos = []; finAudio = 0;
    avisar(segundos, texto);
    if (!preparar()) return;
    const t = ctx.currentTime + Math.max(0.05, segundos);
    finAudio = t;
    if (S.state.settings.cuenta) [3, 2, 1].forEach(n => { if (segundos > n + 0.3) tono(t - n, 660, 0.12, 0.5); });
    pitidoFinal(t);
  }

  // ¿El pitido programado sí sonó? (si el teléfono se bloqueó, el audio se pausa y no suena)
  function sonoATiempo() { return !!(ctx && ctx.state === 'running' && finAudio && ctx.currentTime >= finAudio - 0.3); }

  function ahora() {
    cancelar();
    if (!preparar()) return false;
    pitidoFinal(ctx.currentTime + 0.05);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    return true;
  }

  // Mantiene la pantalla encendida durante el entrenamiento para que el pitido no se corte.
  async function pantalla(encender) {
    try {
      if (NATIVO && P.KeepAwake) {
        if (encender && S.state.settings.pantalla) await P.KeepAwake.keepAwake(); else await P.KeepAwake.allowSleep();
        return;
      }
      if (encender && S.state.settings.pantalla && navigator.wakeLock) {
        if (!candado || candado.released) candado = await navigator.wakeLock.request('screen');
      } else if (!encender && candado) { await candado.release(); candado = null; }
    } catch (e) { /* el sistema puede negarlo (batería baja) */ }
  }

  G.Audio = { preparar, programar, cancelar, sonoATiempo, ahora, pantalla, permiso, quitarAviso, nativo: NATIVO };
})();

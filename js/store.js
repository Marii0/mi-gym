/* Datos de la app. Todo vive en el teléfono (localStorage) y funciona sin internet.
   Cada sección lleva "updatedAt" para poder combinarla con la copia de Google Drive. */
(function () {
  const G = window.GYM;
  const KEY = 'gym.datos.v1';

  function vacio() {
    return {
      v: 1,
      profile: null,                                   // { nombre, encuesta, plan, updatedAt }
      routine: null,                                   // { updatedAt, dias: { 1..7: { nombre, items[] } } }  1 = lunes
      custom: { updatedAt: 0, items: [], cambios: {} },// ejercicios propios y cambios a los del catálogo
      logs: {},                                        // 'AAAA-MM-DD': { fecha, nombre, min, items[], updatedAt, borrado? }
      settings: { updatedAt: 0, sonido: true, enSilencio: false, cuenta: true, pantalla: true, unidad: 'lb', autoDescanso: true },
      active: null,                                    // entrenamiento en curso: { fecha, dia, nombre, inicio, hechos: { uid: [true, false...] } }
      timer: { fin: 0, total: 0 },                     // descanso en marcha
      sync: { pendiente: false, ultima: 0, carpeta: null, archivo: null, correo: null, conectado: false }
    };
  }

  let state = vacio();
  const oyentes = [];

  function cargar() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw), base = vacio();
        state = Object.assign(base, d);
        state.settings = Object.assign(vacio().settings, d.settings || {});
        state.custom = Object.assign(vacio().custom, d.custom || {});
        state.sync = Object.assign(vacio().sync, d.sync || {});
        state.timer = Object.assign(vacio().timer, d.timer || {});
        if (state.active && !state.active.hechos) state.active = null;   // formato anterior
        G.Gen.normalizar(state.routine);
      }
    } catch (e) { console.warn('No se pudieron leer los datos guardados', e); }
    return state;
  }

  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('No se pudo guardar', e); }
  }

  // Marca una sección como cambiada: se guarda en el teléfono y queda pendiente de subir a Drive.
  function tocar(seccion) {
    const ahora = Date.now();
    if (seccion === 'profile' && state.profile) state.profile.updatedAt = ahora;
    else if (seccion === 'routine' && state.routine) state.routine.updatedAt = ahora;
    else if (seccion === 'custom') state.custom.updatedAt = ahora;
    else if (seccion === 'settings') state.settings.updatedAt = ahora;
    state.sync.pendiente = true;
    guardar();
    oyentes.forEach(f => f(seccion));
  }

  function alCambiar(f) { oyentes.push(f); }

  // Lo que se sube a Drive (sin el entrenamiento en curso ni datos de conexión).
  function paquete() {
    return { v: 1, guardado: Date.now(), profile: state.profile, routine: state.routine, custom: state.custom, settings: state.settings, logs: state.logs };
  }

  // Combina la copia local con la de Drive: de cada sección gana la más reciente,
  // y los registros del calendario se unen día por día.
  function combinar(remoto) {
    if (!remoto) return false;
    let cambio = false;
    ['profile', 'routine', 'custom', 'settings'].forEach(k => {
      const l = state[k], r = remoto[k];
      if (r && (!l || (r.updatedAt || 0) > (l.updatedAt || 0))) { state[k] = k === 'settings' ? Object.assign(vacio().settings, r) : r; cambio = true; }
    });
    Object.keys(remoto.logs || {}).forEach(f => {
      const l = state.logs[f], r = remoto.logs[f];
      if (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) { state.logs[f] = r; cambio = true; }
    });
    G.Gen.normalizar(state.routine);
    if (cambio) guardar();
    return cambio;
  }

  function borrarTodo() { state = vacio(); guardar(); }

  // ---------- Ayudas de fechas ----------
  function hoy() { return fechaISO(new Date()); }
  function fechaISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function diaSemana(d) { return ((d || new Date()).getDay() + 6) % 7 + 1; } // 1 = lunes ... 7 = domingo

  // ---------- Ejercicios (catálogo + propios + cambios) ----------
  function ejercicio(id) {
    const base = G.EX[id] || state.custom.items.find(x => x.id === id);
    if (!base) return { id, nombre: 'Ejercicio eliminado', grupo: 'otro', tips: [], tipo: 'i', propio: true };
    const c = state.custom.cambios[id];
    return c ? Object.assign({}, base, c) : base;
  }
  function todos() {
    return G.EXERCISES.map(e => ejercicio(e.id)).concat(state.custom.items.map(e => ejercicio(e.id)));
  }
  function fotos(e) {
    if (e.foto) return [e.foto];
    const d = G.DIB[e.id], r = [];
    if (d) for (let i = 0; i < d[1]; i++) r.push('img/dib/' + d[0] + '-' + i + '.png');
    return r;
  }

  // Última vez que se hizo un ejercicio (para sugerir peso y repeticiones).
  function ultimo(exId, antesDe) {
    const fechas = Object.keys(state.logs).filter(f => !state.logs[f].borrado && (!antesDe || f < antesDe)).sort().reverse();
    for (let i = 0; i < fechas.length; i++) {
      const it = (state.logs[fechas[i]].items || []).find(x => x.ex === exId);
      if (it && it.sets && it.sets.length) return { fecha: fechas[i], sets: it.sets, u: it.u || state.logs[fechas[i]].u };
    }
    return null;
  }
  // Todas las veces que se hizo un ejercicio, de la más reciente a la más antigua.
  function historial(exId) {
    return Object.keys(state.logs).filter(f => !state.logs[f].borrado).sort().reverse().map(f => {
      const it = (state.logs[f].items || []).find(x => x.ex === exId);
      return it && it.sets && it.sets.length ? { fecha: f, sets: it.sets, u: it.u || state.logs[f].u } : null;
    }).filter(Boolean);
  }

  G.Store = {
    get state() { return state; },
    cargar, guardar, tocar, alCambiar, paquete, combinar, borrarTodo,
    hoy, fechaISO, diaSemana, ejercicio, todos, fotos, ultimo, historial
  };
})();

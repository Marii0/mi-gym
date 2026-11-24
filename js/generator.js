/* Generador de rutinas: convierte las respuestas de la encuesta en un plan semanal.
   Todo lo que decide está en tablas al inicio para que sea fácil de ajustar. */
(function () {
  const G = window.GYM;
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Días y minutos ideales según objetivo y nivel.
  const IDEAL_DIAS = {
    musculo: { principiante: 3, regreso: 3, intermedio: 4, avanzado: 5 },
    grasa: { principiante: 4, regreso: 4, intermedio: 5, avanzado: 5 },
    fuerza: { principiante: 3, regreso: 3, intermedio: 4, avanzado: 4 },
    salud: { principiante: 3, regreso: 3, intermedio: 4, avanzado: 4 }
  };
  function idealMin(s) {
    if (s.objetivo === 'salud') return 45;
    if (s.nivel === 'avanzado' && s.objetivo !== 'grasa') return 75;
    return 60;
  }
  const TOPE_MIN = { musculo: 90, fuerza: 90, grasa: 60, salud: 50 };
  const OBJ = { musculo: 'ganar músculo', grasa: 'bajar grasa', fuerza: 'ganar fuerza', salud: 'salud y condición' };

  // Equipo permitido según dónde entrena.
  const EQUIPO = {
    completo: ['barra', 'mancuernas', 'maquina', 'maquina2', 'polea', 'cuerpo', 'barra_fija', 'cardio'],
    basico: ['mancuernas', 'maquina', 'polea', 'cuerpo', 'barra_fija', 'cardio'],
    casa: ['mancuernas', 'cuerpo'],
    nada: ['cuerpo']
  };
  const NIVEL_MAX = { principiante: 1, regreso: 2, intermedio: 2, avanzado: 3 };

  // Plantillas de sesión: "base" son los huecos principales; "extra" se agregan si alcanza el tiempo.
  const ALTO = ['hpush', 'incline', 'fly', 'vpush', 'lateral', 'reardelt', 'vpull', 'hpull', 'biceps', 'triceps', 'core'];
  const BAJO = ['squat', 'squat2', 'lunge', 'hinge', 'glute', 'gluteiso', 'quadiso', 'hamcurl', 'calves', 'core'];
  const T = {
    FULL_A: { nombre: 'Cuerpo completo A', base: ['squat', 'hpush', 'hpull', 'hinge', 'vpush', 'core'], extra: ['biceps', 'triceps', 'calves', 'lateral'], ok: ALTO.concat(BAJO) },
    FULL_B: { nombre: 'Cuerpo completo B', base: ['glute', 'vpull', 'incline', 'lunge', 'lateral', 'core'], extra: ['triceps', 'biceps', 'hamcurl', 'reardelt'], ok: ALTO.concat(BAJO) },
    FULL_C: { nombre: 'Cuerpo completo C', base: ['squat2', 'hpull', 'hpush', 'hinge', 'vpull', 'core'], extra: ['reardelt', 'biceps', 'triceps', 'calves'], ok: ALTO.concat(BAJO) },
    UPPER_A: { nombre: 'Torso A', base: ['hpush', 'hpull', 'vpush', 'vpull', 'biceps', 'triceps'], extra: ['lateral', 'reardelt', 'core', 'fly'], ok: ALTO },
    UPPER_B: { nombre: 'Torso B', base: ['incline', 'vpull', 'hpull', 'lateral', 'triceps', 'biceps'], extra: ['fly', 'reardelt', 'core', 'vpush'], ok: ALTO },
    LOWER_A: { nombre: 'Pierna A', base: ['squat', 'hinge', 'lunge', 'hamcurl', 'calves', 'core'], extra: ['quadiso', 'gluteiso', 'glute'], ok: BAJO },
    LOWER_B: { nombre: 'Pierna B', base: ['glute', 'squat2', 'hamcurl', 'quadiso', 'calves', 'core'], extra: ['lunge', 'gluteiso', 'hinge'], ok: BAJO },
    PUSH: { nombre: 'Empuje: pecho, hombro y tríceps', base: ['hpush', 'incline', 'vpush', 'lateral', 'triceps', 'triceps'], extra: ['fly', 'core'], ok: ['hpush', 'incline', 'fly', 'vpush', 'lateral', 'triceps', 'core'] },
    PULL: { nombre: 'Jalón: espalda y bíceps', base: ['vpull', 'hpull', 'hpull', 'reardelt', 'biceps', 'biceps'], extra: ['core', 'vpull'], ok: ['vpull', 'hpull', 'reardelt', 'biceps', 'core'] },
    LEGS: { nombre: 'Pierna', base: ['squat', 'hinge', 'lunge', 'hamcurl', 'quadiso', 'calves'], extra: ['glute', 'core', 'gluteiso'], ok: BAJO },
    CARDIO: { nombre: 'Cardio y abdomen', base: ['core', 'core', 'core'], extra: [], ok: ['core'] },
    CASA: { nombre: 'Sesión corta en casa', base: ['squat', 'hpush', 'glute', 'hpull', 'core'], extra: [], ok: [] }
  };
  const DIVISION = {
    1: ['FULL_A'], 2: ['FULL_A', 'FULL_B'], 3: ['FULL_A', 'FULL_B', 'FULL_C'],
    4: ['UPPER_A', 'LOWER_A', 'UPPER_B', 'LOWER_B'],
    5: ['PUSH', 'PULL', 'LEGS', 'UPPER_B', 'LOWER_B'],
    6: ['PUSH', 'PULL', 'LEGS', 'PUSH', 'PULL', 'LEGS']
  };
  const DIVISION_NOMBRE = {
    1: 'cuerpo completo', 2: 'cuerpo completo', 3: 'cuerpo completo',
    4: 'torso y pierna', 5: 'empuje, jalón, pierna, torso y pierna', 6: 'empuje, jalón y pierna dos veces'
  };
  const ZONAS = {
    pecho: ['fly', 'incline'], espalda: ['hpull', 'vpull'], hombros: ['lateral', 'reardelt'],
    brazos: ['biceps', 'triceps'], piernas: ['quadiso', 'hamcurl'], gluteos: ['glute', 'gluteiso'], abdomen: ['core']
  };

  // Cuántos días de pesas y cuántos de cardio, según el objetivo y lo que la persona pidió de cardio:
  // 'auto' (lo que convenga), 'final' (al final de cada sesión), 'dias' (días aparte) o 'no'.
  function reparto(s, k) {
    const o = s.objetivo, pref = s.cardio || 'auto';
    const tope = o === 'musculo' ? 6 : o === 'fuerza' ? 5 : o === 'grasa' ? 4 : 3;
    let f = Math.min(k, tope), c = 0;
    if (pref === 'dias' && k >= 3) { c = k >= 5 ? 2 : 1; f = Math.min(k - c, tope); }
    else if (pref === 'auto' && (o === 'grasa' || o === 'salud')) c = Math.min(k - f, 2);
    return { fuerza: f, cardio: c };
  }

  function secuencia(s, k) {
    const r = reparto(s, k);
    const seq = DIVISION[r.fuerza].slice();
    const total = r.fuerza + r.cardio;
    for (let j = 1; j <= r.cardio; j++) seq.splice(Math.floor(j * total / (r.cardio + 1)), 0, 'CARDIO');
    return seq;
  }

  // Elige n días de los disponibles dejando el mayor descanso posible entre sesiones.
  function elegirDias(disponibles, n) {
    const d = disponibles.slice().sort((a, b) => a - b);
    if (n >= d.length) return d;
    let mejor = null, mejorP = null;
    (function combina(ini, actual) {
      if (actual.length === n) {
        const huecos = actual.map((x, i) => ((actual[(i + 1) % n] - x + 7) % 7) || 7);
        // racha más larga de días seguidos (mientras más corta, mejor)
        let racha = 1, max = 1;
        for (let i = 0; i < 2 * n; i++) { if (huecos[i % n] === 1) { racha++; max = Math.max(max, racha); } else racha = 1; }
        const p = [Math.min.apply(null, huecos), -Math.max.apply(null, huecos), -max];
        if (!mejor || p[0] > mejorP[0] || (p[0] === mejorP[0] && (p[1] > mejorP[1] || (p[1] === mejorP[1] && p[2] > mejorP[2])))) { mejor = actual.slice(); mejorP = p; }
        return;
      }
      for (let i = ini; i < d.length; i++) { actual.push(d[i]); combina(i + 1, actual); actual.pop(); }
    })(0, []);
    return mejor;
  }

  function imc(s) {
    const p = parseFloat(s.peso), e = parseFloat(s.estatura);
    return p > 0 && e > 0 ? p / Math.pow(e / 100, 2) : null;
  }

  const CARDIO_PREF = { trote: ['trote'], caminata: ['caminadora', 'caminata'], bici: ['bici'], eliptica: ['eliptica'] };
  function elegir(slot, s, usados, equipoForzado) {
    const permitido = EQUIPO[equipoForzado || s.equipo];
    const max = NIVEL_MAX[s.nivel];
    const novato = s.nivel === 'principiante' || s.nivel === 'regreso';
    const suave = slot === 'cardio' && (imc(s) || 0) >= 30;
    let mejor = null, mejorP = 1e9;
    G.SLOTS[slot].forEach((id, i) => {
      const e = G.EX[id];
      if (permitido.indexOf(e.equipo) < 0 || usados.sesion[id]) return;
      if (e.evitar.some(m => (s.molestias || []).indexOf(m) >= 0)) return;
      if (suave && e.evitar.indexOf('rodillas') >= 0) return;
      let p = i;
      if (e.nivel > max) p += 10 * (e.nivel - max);
      p += 8 * (usados.semana[id] || 0);
      if (slot === 'cardio' && (CARDIO_PREF[s.cardioTipo] || []).indexOf(id) >= 0) p -= 20 + 8 * (usados.semana[id] || 0); // el cardio preferido se repite toda la semana
      if (s.objetivo === 'fuerza' && e.equipo === 'barra') p -= 2;
      if (novato && e.equipo === 'maquina') p -= 1.5;
      if (novato && e.equipo === 'barra') p += 1.5;
      if (p < mejorP) { mejor = e; mejorP = p; }
    });
    return mejor;
  }

  // Series, repeticiones y descanso según objetivo, nivel y tipo de ejercicio.
  function dosis(s, e, pos) {
    const o = s.objetivo, novato = s.nivel === 'principiante' || s.nivel === 'regreso';
    let r;
    if (e.id === 'plancha') r = { sets: o === 'salud' ? 2 : 3, reps: novato ? '20-30 s' : '40-60 s', rest: 45 };
    else if (e.id === 'plancha_lateral') r = { sets: 2, reps: novato ? '15-20 s por lado' : '30 s por lado', rest: 30 };
    else if (e.id === 'escaladores') r = { sets: 3, reps: '30 s', rest: 30 };
    else if (e.tipo === 'n') {
      r = { musculo: { sets: 3, reps: '12-15', rest: 45 }, grasa: { sets: 3, reps: '15-20', rest: 30 }, fuerza: { sets: 3, reps: '10-15', rest: 45 }, salud: { sets: 2, reps: '12-15', rest: 45 } }[o];
    } else if (e.tipo === 'c') {
      if (o === 'musculo') r = pos < 2 ? { sets: novato ? 3 : 4, reps: '6-10', rest: 120 } : { sets: 3, reps: '8-12', rest: 90 };
      else if (o === 'grasa') r = { sets: 3, reps: '10-15', rest: 75 };
      else if (o === 'fuerza') r = pos < 2 ? { sets: novato ? 3 : (s.nivel === 'avanzado' ? 5 : 4), reps: novato ? '5-8' : '4-6', rest: novato ? 150 : 180 } : { sets: 3, reps: '6-8', rest: 120 };
      else r = { sets: novato ? 2 : 3, reps: '10-12', rest: 75 };
    } else {
      r = { musculo: { sets: 3, reps: '10-15', rest: 60 }, grasa: { sets: novato ? 2 : 3, reps: '12-15', rest: 45 }, fuerza: { sets: 3, reps: '8-12', rest: 75 }, salud: { sets: 2, reps: '12-15', rest: 60 } }[o];
    }
    r = Object.assign({}, r);
    if (parseInt(s.edad, 10) >= 45 && r.rest) r.rest += 15;
    return r;
  }

  // Minutos aproximados que toma un ejercicio (trabajo + descansos + acomodarse).
  function minutosItem(it) {
    const e = G.EX[it.ex], se = it.series || [];
    const m = /(\d+)\s*min/.exec((se[0] && se[0].reps) || '');
    if (m) return parseInt(m[1], 10) * se.length;
    const trabajo = e && e.tipo === 'c' ? 40 : 35;
    return (se.length * (trabajo + (it.rest || 0)) + 60) / 60;
  }
  function minutosDia(items) {
    if (!items || !items.length) return 0;
    return Math.round(5 + items.reduce((a, it) => a + minutosItem(it), 0));
  }

  let uidN = 0;
  function uid() { return 'i' + Date.now().toString(36) + (uidN++).toString(36); }
  // Cada ejercicio de la rutina guarda sus series una por una: repeticiones, peso y tipo
  // ('n' normal, 'c' calentamiento). Un rango como "8-12" se convierte en el número de en medio
  // y el rango queda anotado en las notas.
  const RANGO = /^(\d+)-(\d+)$/;
  function numReps(r) { const m = RANGO.exec(r); return m ? String(Math.round((+m[1] + +m[2]) / 2)) : String(r); }
  function item(e, d) {
    return { uid: uid(), ex: e.id, rest: d.rest, nota: RANGO.test(d.reps) ? 'Rango: ' + d.reps + ' repeticiones' : '',
      series: Array.from({ length: d.sets }, () => ({ reps: numReps(d.reps), peso: '', tipo: 'n' })) };
  }
  function nuevoItem(e, s, pos) { return item(e, G.EX[e.id] ? dosis(s, e, pos) : { sets: 3, reps: '10', rest: 60 }); }
  // Convierte rutinas guardadas con el formato anterior (sets/reps) al formato por series.
  function normalizar(rutina) {
    if (!rutina || !rutina.dias) return rutina;
    Object.keys(rutina.dias).forEach(d => (rutina.dias[d].items || []).forEach(it => {
      if (it.series) return;
      const r = String(it.reps || '');
      it.series = Array.from({ length: it.sets || 1 }, () => ({ reps: numReps(r), peso: '', tipo: 'n' }));
      if (RANGO.test(r) && !it.nota) it.nota = 'Rango: ' + r + ' repeticiones';
      delete it.sets; delete it.reps;
    }));
    return rutina;
  }

  function armarSesion(clave, s, minutos, semana, hayDiasCardio) {
    const t = T[clave];
    const usados = { semana, sesion: {} };
    const items = [];
    const casa = clave === 'CASA';
    let cardio = null, presupuesto = minutos - 5;

    // Cardio al final (o como bloque principal en el día de cardio).
    let minCardio = 0;
    let pref = s.cardio || 'auto';
    if (pref === 'dias' && !hayDiasCardio) pref = 'final';
    if (clave === 'CARDIO') minCardio = Math.max(15, Math.min(35, minutos - 18));
    else if (casa || pref === 'no' || pref === 'dias') minCardio = 0;
    else if (pref === 'final') minCardio = minutos >= 60 ? 15 : 10;
    else if (s.objetivo === 'grasa') minCardio = minutos >= 60 ? 15 : 10;
    else if (s.objetivo === 'salud' && minutos >= 45) minCardio = 10;
    if (minCardio) {
      const e = elegir('cardio', s, usados);
      if (e) { cardio = { uid: uid(), ex: e.id, rest: 0, nota: '', series: [{ reps: minCardio + ' min', peso: '', tipo: 'n' }] }; usados.sesion[e.id] = 1; presupuesto -= minCardio; }
    }

    const prioridad = [];
    (s.zonas || []).forEach(z => (ZONAS[z] || []).forEach(sl => { if (t.ok.indexOf(sl) >= 0 && prioridad.indexOf(sl) < 0) prioridad.push(sl); }));
    const huecos = t.base.map(sl => ({ sl, base: true })).concat(prioridad.concat(t.extra).map(sl => ({ sl, base: false })));

    let usado = 0;
    for (let i = 0; i < huecos.length; i++) {
      const e = elegir(huecos[i].sl, s, usados, casa ? 'nada' : null);
      if (!e) continue;
      const d = dosis(s, e, items.length);
      if (casa) { d.sets = Math.min(d.sets, 3); d.rest = Math.min(d.rest, 45); }
      const it = item(e, d);
      const m = minutosItem(it);
      if (items.length >= 3 && usado + m > presupuesto) { if (huecos[i].base) continue; else break; }
      items.push(it); usado += m; usados.sesion[e.id] = 1;
    }
    // Si la sesión no cabe en el tiempo disponible, se aprieta: menos descanso, luego menos series, luego menos ejercicios.
    const pasos = [
      () => recorta(items, 'rest', 150), () => recorta(items, 'rest', 120), () => recorta(items, 'sets', 3), () => recorta(items, 'rest', 90),
      () => recorta(items, 'rest', 75), () => recorta(items, 'rest', 60), () => { if (items.length > 3) { items.pop(); return true; } return false; },
      () => recorta(items, 'sets', 2), () => recorta(items, 'rest', 45)
    ];
    const total = () => 5 + minCardio * (cardio ? 1 : 0) + items.reduce((a, it) => a + minutosItem(it), 0);
    for (let i = 0; i < pasos.length && total() > minutos + 1; i++) pasos[i]();
    items.forEach(it => { semana[it.ex] = (semana[it.ex] || 0) + 1; });
    if (cardio) { items.push(cardio); semana[cardio.ex] = (semana[cardio.ex] || 0) + 1; }
    return { nombre: t.nombre, items };
  }

  function recorta(items, campo, tope) {
    let cambio = false;
    items.forEach(it => {
      if (campo === 'sets') { if (it.series.length > tope) { it.series.length = tope; cambio = true; } }
      else if (it[campo] > tope) { it[campo] = tope; cambio = true; }
    });
    return cambio;
  }

  function lista(arr) {
    if (arr.length <= 1) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1];
  }

  // Devuelve hasta 3 opciones de plan. La primera es la recomendada.
  function opciones(s) {
    const disp = s.dias.slice().sort((a, b) => a - b);
    const ideal = IDEAL_DIAS[s.objetivo][s.nivel];
    const iMin = idealMin(s);
    const minutos = Math.min(s.minutos, TOPE_MIN[s.objetivo], s.nivel === 'avanzado' ? 90 : 75);
    const volIdeal = ideal * iMin;
    const out = [];

    function crear(id, k, casa, etiqueta, notas) {
      const seq = secuencia(s, k);
      const dias = elegirDias(disp, seq.length);
      const r = reparto(s, k);
      let diaCasa = null;
      if (casa) {
        const libres = [0, 1, 2, 3, 4, 5, 6].filter(x => dias.indexOf(x) < 0);
        // el día libre más alejado de las sesiones de gym
        let mejor = -1;
        libres.forEach(x => {
          const dist = Math.min.apply(null, dias.map(y => Math.min((x - y + 7) % 7, (y - x + 7) % 7)));
          if (dist > mejor) { mejor = dist; diaCasa = x; }
        });
      }
      const vol = seq.length * Math.min(minutos, iMin) + (diaCasa != null ? 20 : 0);
      // El avance no crece parejo con el tiempo: los primeros días son los que más rinden.
      const razon = Math.min(1, vol / volIdeal);
      const pct = Math.round(100 * Math.sqrt(razon));
      const cerca = razon >= 0.95 ? 'Ideal' : razon >= 0.7 ? 'Muy cerca' : razon >= 0.45 ? 'Buen avance' : 'Lo mínimo útil';
      const detalle = [];
      detalle.push(lista(dias.map(d => DIAS[d])) + (diaCasa != null ? ', más ' + DIAS[diaCasa] + ' en casa' : ''));
      detalle.push('Rutina de ' + DIVISION_NOMBRE[r.fuerza] + (r.cardio ? ' con ' + r.cardio + (r.cardio > 1 ? ' días' : ' día') + ' de cardio' : '') + ', unos ' + minutos + ' min por sesión');
      if (s.cardio === 'final' || (s.cardio === 'dias' && !r.cardio)) detalle.push('Con 10 a 15 min de cardio al final de cada sesión');
      (notas || []).forEach(n => detalle.push(n));
      out.push({ id, etiqueta, pct, cerca, k, seq, dias, diaCasa, minutos, detalle, titulo: seq.length + (seq.length === 1 ? ' día' : ' días') + (diaCasa != null ? ' y una sesión en casa' : '') });
    }

    const notasTiempo = [];
    if (s.minutos < iMin) notasTiempo.push('Lo ideal serían unos ' + iMin + ' min por sesión. Con ' + s.minutos + ' dejo los ejercicios que más rinden.');

    if (disp.length < ideal) {
      crear('max', disp.length, false, 'Lo más cercano con tu horario',
        ['Para ' + OBJ[s.objetivo] + ' en tu nivel lo ideal son ' + ideal + ' días. Con ' + disp.length + ' también avanzas, aunque más lento.'].concat(notasTiempo));
      if (disp.length < 7) crear('casa', disp.length, true, 'Se acerca más al ideal',
        ['Agrega 20 min sin equipo en casa un día que no vas al gym.']);
      if (disp.length >= 3) crear('ligero', disp.length - 1, false, 'Más ligero', ['Un día menos, por si la semana se complica.']);
    } else {
      crear('ideal', ideal, false, 'Recomendado para tu objetivo', notasTiempo);
      const tope = s.objetivo === 'fuerza' ? 5 : 6;
      if (disp.length > ideal && ideal < tope && s.nivel !== 'principiante') crear('mas', ideal + 1, false, 'Un día más',
        ['Más trabajo por semana. Úsalo solo si duermes y comes bien.']);
      if (ideal > 2) crear('ligero', ideal - 1, false, 'Más ligero', ['Un día menos. Sirve para empezar o para semanas pesadas.']);
    }
    return out;
  }

  // Construye la rutina semanal a partir de la opción elegida.
  function construir(s, op) {
    const dias = {};
    const semana = {};
    for (let d = 1; d <= 7; d++) dias[d] = { nombre: 'Descanso', items: [] };
    const hayDiasCardio = op.seq.indexOf('CARDIO') >= 0;
    op.seq.forEach((clave, i) => { dias[op.dias[i] + 1] = armarSesion(clave, s, op.minutos, semana, hayDiasCardio); });
    if (op.diaCasa != null) dias[op.diaCasa + 1] = armarSesion('CASA', s, 25, semana, hayDiasCardio);
    return { updatedAt: Date.now(), dias };
  }

  G.Gen = { DIAS, OBJ, opciones, construir, dosis, minutosDia, minutosItem, uid, imc, elegirDias, IDEAL_DIAS, idealMin, nuevoItem, normalizar };
})();

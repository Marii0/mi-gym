/* Pantallas y acciones de la app. Cada pantalla es una función que devuelve HTML;
   los botones llevan data-a="accion" y se atienden en el objeto "acciones" al final. */
(function () {
  const G = window.GYM, S = G.Store, Gen = G.Gen, D = G.Drive, A = G.Audio;
  const $ = s => document.querySelector(s);
  const vista = $('#vista'), tabs = $('#tabs'), hoja = $('#hoja'), descanso = $('#descanso'), toastEl = $('#toast');
  const DIAS = Gen.DIAS, LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const CACHE_FOTOS = 'gym-img-v1';
  const st = () => S.state;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ui = { tab: 'hoy', dia: null, verDia: null, mes: null, enc: null, plan: null, entrenando: false, item: null, pick: null, alConfirmar: null, grupo: '' };

  // ---------- Utilidades ----------
  function reloj(seg) { seg = Math.max(0, Math.round(seg)); return Math.floor(seg / 60) + ':' + String(seg % 60).padStart(2, '0'); }
  function descansoTxt(seg) { return !seg ? 'sin descanso' : seg < 60 ? seg + ' s' : reloj(seg) + ' min'; }
  function hace(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return 'hace un momento';
    if (m < 60) return 'hace ' + m + ' min';
    if (m < 60 * 24) return 'hace ' + Math.round(m / 60) + ' h';
    return 'el ' + new Date(ts).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
  }
  function registro(f) { const r = st().logs[f]; return r && !r.borrado ? r : null; }
  function porTiempo(reps) { return /\d\s*(s|min)\b/.test(reps || ''); }
  function miniFoto(e) {
    const f = S.fotos(e);
    return f.length ? '<img class="mini-foto" loading="lazy" alt="" src="' + esc(f[0]) + '">' : '<span class="mini-foto">' + esc((e.nombre || '?').charAt(0)) + '</span>';
  }
  function fotoGrande(e) {
    const f = S.fotos(e);
    return '<div class="foto">' + (f.length ? f.map(u => '<img alt="" src="' + esc(u) + '">').join('') : '<span class="sin">Sin foto</span>') + '</div>';
  }
  let toastT = null;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 3200);
  }
  function abrir(html) { hoja.innerHTML = '<div class="hoja" role="dialog" aria-modal="true">' + html + '</div>'; hoja.hidden = false; }
  function cerrar() { hoja.hidden = true; hoja.innerHTML = ''; ui.item = null; ui.pick = null; ui.alConfirmar = null; }
  function cabHoja(titulo, sub) {
    return '<div class="hoja-cab"><div><h2>' + esc(titulo) + '</h2>' + (sub ? '<p class="tenue chico">' + esc(sub) + '</p>' : '') + '</div><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></div>';
  }
  function confirmar(titulo, texto, boton, fn, peligro) {
    abrir(cabHoja(titulo) + '<p class="tenue">' + esc(texto) + '</p><div class="pila" style="margin-top:18px"><button class="btn ' + (peligro ? 'peligro' : 'primario') + '" data-a="confirmar">' + esc(boton) + '</button><button class="btn" data-a="cerrar">Cancelar</button></div>');
    ui.alConfirmar = fn;
  }

  // ---------- Dibujo general ----------
  function render() {
    const s = st();
    let html, conTabs = false;
    if (ui.enc) html = vEncuesta();
    else if (ui.plan) html = vPlan();
    else if (!s.profile || !s.routine) html = vBienvenida();
    else if (s.active && ui.entrenando) html = vEntrenamiento();
    else { conTabs = true; html = ({ hoy: vHoy, rutina: ui.dia ? vDia : vRutina, cal: vCalendario, ajustes: vAjustes })[ui.tab](); }
    vista.innerHTML = html;
    vista.classList.toggle('sin-tabs', !conTabs);
    tabs.hidden = !conTabs;
    if (conTabs) dibujarTabs();
    if (conTabs && ui.tab === 'ajustes') contarFotos();
  }
  const ICONOS = {
    hoy: '<path d="M3 9v6M6.5 6.5v11M17.5 6.5v11M21 9v6M6.5 12h11"/>',
    rutina: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    ajustes: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'
  };
  function dibujarTabs() {
    tabs.innerHTML = [['hoy', 'Hoy'], ['rutina', 'Rutina'], ['cal', 'Calendario'], ['ajustes', 'Ajustes']].map(t =>
      '<button data-a="tab" data-v="' + t[0] + '"' + (ui.tab === t[0] ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONOS[t[0]] + '</svg>' + t[1] + '</button>').join('');
  }

  // ---------- Bienvenida ----------
  function vBienvenida() {
    return '<section class="bienvenida"><div class="disco" aria-hidden="true"></div>' +
      '<h1>Tu rutina, hecha a tu medida</h1>' +
      '<p>Contesta 9 preguntas y armo tu semana de gym: qué días ir, qué ejercicios hacer, cuántas repeticiones y cuánto descansar.</p>' +
      '<button class="btn primario" data-a="encuesta">Empezar la encuesta</button>' +
      '<button class="btn" data-a="recuperar">Ya tengo datos en Google Drive</button></section>';
  }

  // ---------- Encuesta ----------
  const PREG = [
    { k: 'nombre', t: '¿Cómo te llamas?', sub: 'Así se va a llamar tu carpeta en Google Drive.', tipo: 'texto' },
    { k: 'objetivo', t: '¿Qué quieres lograr?', tipo: 'uno', ops: [['musculo', 'Ganar músculo', 'Subir masa muscular'], ['grasa', 'Bajar grasa', 'Perder peso y definir'], ['fuerza', 'Ganar fuerza', 'Levantar más peso'], ['salud', 'Salud y condición', 'Moverte mejor y sentirte bien']] },
    { k: 'nivel', t: '¿Cuánta experiencia tienes con pesas?', tipo: 'uno', ops: [['principiante', 'Voy empezando', 'Menos de 6 meses'], ['intermedio', 'Intermedio', 'De 6 meses a 2 años entrenando seguido'], ['avanzado', 'Avanzado', 'Más de 2 años entrenando seguido'], ['regreso', 'Regreso después de una pausa', 'Ya entrenaba, pero llevo meses sin ir']] },
    { k: 'dias', t: '¿Qué días puedes entrenar?', sub: 'Marca todos los que tengas libres. Yo elijo los mejores para tu objetivo.', tipo: 'dias' },
    { k: 'minutos', t: '¿Cuánto tiempo tienes por sesión?', sub: 'Contando el calentamiento.', tipo: 'uno', ops: [[30, '30 minutos'], [45, '45 minutos'], [60, '1 hora'], [75, '1 hora y cuarto'], [90, 'Hora y media o más']] },
    { k: 'equipo', t: '¿Dónde vas a entrenar?', tipo: 'uno', ops: [['completo', 'Gimnasio completo', 'Barras, mancuernas, máquinas y poleas'], ['basico', 'Gimnasio básico', 'Mancuernas y algunas máquinas'], ['casa', 'En casa con mancuernas', ''], ['nada', 'Sin equipo', 'Solo con el peso del cuerpo']] },
    { k: 'molestias', t: '¿Tienes alguna molestia que deba cuidar?', sub: 'Dejo fuera los ejercicios que más cargan esa zona. Si no tienes ninguna, sigue adelante.', tipo: 'varios', ops: [['rodillas', 'Rodillas'], ['hombros', 'Hombros'], ['espalda', 'Espalda baja']] },
    { k: 'zonas', t: '¿Qué zonas quieres trabajar más?', sub: 'Opcional. Les doy un poco más de trabajo.', tipo: 'varios', ops: [['pecho', 'Pecho'], ['espalda', 'Espalda'], ['hombros', 'Hombros'], ['brazos', 'Brazos'], ['piernas', 'Piernas'], ['gluteos', 'Glúteos'], ['abdomen', 'Abdomen']] },
    { k: 'cuerpo', t: 'Unos datos más', sub: 'Opcionales. Sirven para ajustar el cardio y los descansos.', tipo: 'cuerpo' }
  ];
  function vEncuesta() {
    const i = ui.enc.i, p = PREG[i], r = ui.enc.r;
    let cuerpo = '', siguiente = true;
    if (p.tipo === 'texto') cuerpo = '<label class="campo"><input id="enc-texto" maxlength="30" autocomplete="given-name" placeholder="Tu nombre" value="' + esc(r[p.k] || '') + '"></label>';
    else if (p.tipo === 'uno') {
      siguiente = false;
      cuerpo = p.ops.map(o => '<button class="opcion" data-a="enc-uno" data-v="' + o[0] + '" aria-pressed="' + (String(r[p.k]) === String(o[0])) + '"><b>' + o[1] + '</b>' + (o[2] ? '<span>' + o[2] + '</span>' : '') + '</button>').join('');
    } else if (p.tipo === 'dias') {
      cuerpo = '<div class="dias-sel">' + LETRAS.map((l, d) => '<button data-a="enc-dia" data-v="' + d + '" aria-label="' + DIAS[d] + '" aria-pressed="' + (r.dias.indexOf(d) >= 0) + '">' + l + '</button>').join('') + '</div>' +
        '<p class="tenue chico" style="margin-top:12px">' + (r.dias.length ? r.dias.length + (r.dias.length === 1 ? ' día marcado' : ' días marcados') : 'Marca al menos un día') + '</p>';
    } else if (p.tipo === 'varios') {
      cuerpo = p.ops.map(o => '<button class="opcion" data-a="enc-varios" data-v="' + o[0] + '" aria-pressed="' + (r[p.k].indexOf(o[0]) >= 0) + '"><b>' + o[1] + '</b></button>').join('');
    } else {
      cuerpo = '<div class="tres"><label class="campo"><span>Edad</span><input id="enc-edad" inputmode="numeric" value="' + esc(r.edad || '') + '"></label>' +
        '<label class="campo"><span>Peso (kg)</span><input id="enc-peso" inputmode="decimal" value="' + esc(r.peso || '') + '"></label>' +
        '<label class="campo"><span>Estatura (cm)</span><input id="enc-estatura" inputmode="numeric" value="' + esc(r.estatura || '') + '"></label></div>';
    }
    return '<div class="enc-cab"><button class="liga" data-a="enc-atras">Atrás</button><div class="avance"><i style="width:' + Math.round(100 * (i + 1) / PREG.length) + '%"></i></div><span class="chico tenue">' + (i + 1) + ' de ' + PREG.length + '</span></div>' +
      '<section class="enc"><h1>' + p.t + '</h1>' + (p.sub ? '<p class="sub">' + p.sub + '</p>' : '<div style="height:14px"></div>') + cuerpo +
      (siguiente ? '<div class="enc-pie"><button class="btn primario" data-a="enc-sig">' + (i === PREG.length - 1 ? 'Ver mi plan' : 'Siguiente') + '</button></div>' : '') + '</section>';
  }
  function encAvanza() {
    if (ui.enc.i < PREG.length - 1) { ui.enc.i++; render(); scrollTo(0, 0); return; }
    const r = ui.enc.r;
    ui.plan = { r, ops: Gen.opciones(r), sel: 0 }; ui.enc = null; render(); scrollTo(0, 0);
  }

  // ---------- Opciones de plan ----------
  function vPlan() {
    const p = ui.plan;
    return '<div class="enc-cab"><button class="liga" data-a="plan-atras">Cambiar respuestas</button></div>' +
      '<section class="enc"><h1>Tu plan, ' + esc(p.r.nombre) + '</h1><p class="sub">Para ' + Gen.OBJ[p.r.objetivo] + '. Elige la opción que mejor te acomode; después puedes cambiar lo que quieras.</p>' +
      p.ops.map((o, i) => '<button class="plan" data-a="plan-sel" data-v="' + i + '" aria-pressed="' + (i === p.sel) + '"><span class="etq">' + o.etiqueta + '</span><h2>' + o.titulo + '</h2><ul>' +
        o.detalle.map(d => '<li>' + esc(d) + '</li>').join('') + '</ul><div class="medidor"><span>Frente al plan ideal</span><div class="avance"><i style="width:' + o.pct + '%"></i></div><b>' + o.cerca + '</b></div></button>').join('') +
      '<p class="aviso" style="margin-top:16px">Si tienes una lesión o dolor, consulta a un médico o fisioterapeuta antes de empezar.</p>' +
      '<div class="enc-pie"><button class="btn primario" data-a="plan-crear">Crear mi rutina</button></div></section>';
  }

  // ---------- Hoy ----------
  function fechaDeSemana(d) { const h = new Date(); h.setDate(h.getDate() - (S.diaSemana(h) - 1) + (d - 1)); return S.fechaISO(h); }
  function estadoSync() {
    const m = st().sync;
    if (!D.configurado()) return '<span class="punto"></span>Guardado en este teléfono';
    if (!m.conectado) return '<span class="punto"></span>Guardado en este teléfono. Conecta Google Drive en Ajustes';
    if (m.pendiente) return '<span class="punto pend"></span>Guardado en el teléfono. Se sube a Drive cuando haya internet';
    return '<span class="punto ok"></span>Copia en Drive al día' + (m.ultima ? ', ' + hace(m.ultima) : '');
  }
  function filaItem(it, accion) {
    const e = S.ejercicio(it.ex);
    return '<button class="fila" data-a="' + accion + '" data-id="' + esc(it.ex) + '" data-u="' + esc(it.uid || '') + '">' + miniFoto(e) + '<span class="cuerpo"><b>' + esc(e.nombre) + '</b><span>' + (porTiempo(it.reps) && it.sets === 1 ? esc(it.reps) : it.sets + ' × ' + esc(it.reps)) + (it.rest ? ', descansa ' + descansoTxt(it.rest) : '') + '</span></span></button>';
  }
  function vHoy() {
    const s = st(), hoyN = S.diaSemana(), ver = ui.verDia || hoyN, dia = s.routine.dias[ver];
    const fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    const titulo = dia.items.length ? dia.nombre : 'Descanso';
    let h = '<header class="cab"><p class="fecha">' + (ver === hoyN ? esc(fecha.charAt(0).toUpperCase() + fecha.slice(1)) : DIAS[ver - 1]) + '</p><h1>' + esc(titulo) + '</h1></header>';
    h += '<div class="semana">' + LETRAS.map((l, i) => {
      const d = i + 1, hecho = registro(fechaDeSemana(d)), plan = s.routine.dias[d].items.length > 0;
      return '<button data-a="hoy-dia" data-v="' + d + '" class="' + (d === ver ? 'sel ' : '') + (d === hoyN ? 'hoy' : '') + '" aria-label="' + DIAS[i] + '"><span>' + l + '</span><span class="marca ' + (hecho ? 'hecho' : plan ? 'toca' : '') + '"></span></button>';
    }).join('') + '</div>';
    if (s.active) {
      h += '<div class="pila"><p class="aviso">Tienes un entrenamiento en curso: ' + esc(s.active.nombre) + '.</p><button class="btn primario grande" data-a="ent-continuar">Continuar entrenamiento</button><button class="liga" data-a="ent-descartar">Descartarlo</button></div>';
    } else if (dia.items.length) {
      h += '<p class="tenue" style="margin-bottom:10px">' + dia.items.length + ' ejercicios, unos ' + Gen.minutosDia(dia.items) + ' min' + (ver === hoyN && registro(S.hoy()) ? '. Ya registraste un entrenamiento hoy.' : '') + '</p>';
      h += '<div class="lista">' + dia.items.map(it => filaItem(it, 'ver-ej')).join('') + '</div>';
      h += '<div style="margin-top:20px"><button class="btn primario grande" data-a="ent-empezar" data-v="' + ver + '">Empezar entrenamiento</button></div>';
    } else {
      h += '<p class="vacio">' + (ver === hoyN ? 'Hoy toca descansar. El descanso también es parte del plan.' : 'Día de descanso.') + ' Toca otro día de la semana para verlo o adelantarlo.</p>';
    }
    return h + '<p class="estado-sync">' + estadoSync() + '</p>';
  }

  // ---------- Entrenamiento ----------
  function empezar(d) {
    const dia = st().routine.dias[d];
    A.preparar();
    st().active = {
      fecha: S.hoy(), dia: d, nombre: dia.nombre, inicio: Date.now(), i: 0, finDescanso: 0, totalDescanso: 0,
      items: dia.items.map(it => {
        const prev = S.ultimo(it.ex);
        return { ex: it.ex, nombre: S.ejercicio(it.ex).nombre, reps: it.reps, rest: it.rest, nota: it.nota || '', prev: prev ? prev.sets : null, sets: Array.from({ length: it.sets }, () => ({ kg: '', reps: '', ok: false })) };
      })
    };
    S.guardar(); ui.entrenando = true; toastEl.hidden = true; A.pantalla(true); render(); scrollTo(0, 0);
  }
  function serieTxt(x, it) { return porTiempo(it.reps) ? '✓' : (x.kg ? x.kg + ' kg × ' : '') + (x.reps || '✓'); }
  function vEntrenamiento() {
    const a = st().active, it = a.items[a.i], e = S.ejercicio(it.ex);
    const k = it.sets.findIndex(x => !x.ok), tiempo = porTiempo(it.reps);
    const todo = a.items.every(x => x.sets.every(y => y.ok));
    let h = '<div class="ent-cab"><button class="liga" data-a="ent-salir">Salir</button><span>Ejercicio ' + (a.i + 1) + ' de ' + a.items.length + '</span><button class="liga" data-a="ent-terminar">Terminar</button></div>';
    h += '<section class="ent">' + fotoGrande(e) + '<h1>' + esc(e.nombre) + '</h1>';
    h += '<p class="meta">' + (k >= 0 ? '<b>Serie ' + (k + 1) + ' de ' + it.sets.length + '</b>, ' + esc(it.reps) + (tiempo ? '' : ' repeticiones') : 'Ejercicio completo') + '</p>';
    h += '<div class="series">' + it.sets.map((x, j) => '<span class="serie ' + (x.ok ? 'hecha' : j === k ? 'actual' : '') + '">' + (x.ok ? esc(serieTxt(x, it)) : j + 1) + '</span>').join('') + '</div>';
    if (k >= 0) {
      if (!tiempo) {
        const p = it.prev ? it.prev[Math.min(k, it.prev.length - 1)] : null, ant = k > 0 ? it.sets[k - 1] : null;
        h += '<div class="captura"><label class="campo"><span>Peso (kg)</span><input id="ent-kg" inputmode="decimal" placeholder="0" value="' + esc((ant && ant.kg) || (p && p.kg) || '') + '"></label>' +
          '<label class="campo"><span>Repeticiones</span><input id="ent-reps" inputmode="numeric" placeholder="' + esc(it.reps) + '" value="' + esc(p && /^\d+$/.test(p.reps) ? p.reps : '') + '"></label></div>';
        if (it.prev) h += '<p class="antes">La vez pasada: ' + it.prev.map(x => esc(serieTxt(x, it))).join(', ') + '</p>';
      }
      h += '<button class="btn primario grande" data-a="ent-serie">' + (tiempo ? 'Terminé' : 'Terminé la serie') + '</button>';
    } else if (todo) {
      h += '<button class="btn primario grande" data-a="ent-fin">Guardar entrenamiento</button>';
    } else {
      h += '<button class="btn primario grande" data-a="ent-sig">Siguiente ejercicio</button>';
    }
    if (k < 0) h += '<div style="margin-top:10px"><button class="btn" data-a="ent-otra">Agregar otra serie</button></div>';
    h += '<details class="tips" open><summary>Cómo hacerlo</summary><ul>' + (e.tips || []).map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' + (it.nota ? '<p class="nota">' + esc(it.nota) + '</p>' : '') + '</details>';
    h += '<div class="ent-nav"><button class="btn" data-a="ent-ant"' + (a.i === 0 ? ' disabled' : '') + '>Anterior</button><button class="btn" data-a="ent-sig"' + (a.i === a.items.length - 1 ? ' disabled' : '') + '>' + (k >= 0 ? 'Saltar ejercicio' : 'Siguiente') + '</button></div></section>';
    return h;
  }
  function serieHecha() {
    const a = st().active, it = a.items[a.i], k = it.sets.findIndex(x => !x.ok);
    if (k < 0) return;
    A.preparar();
    const kg = $('#ent-kg') ? $('#ent-kg').value.trim().replace(',', '.') : '', reps = $('#ent-reps') ? $('#ent-reps').value.trim() : '';
    it.sets[k] = { kg, reps, ok: true };
    const rest = it.rest;
    if (!it.sets.some(x => !x.ok)) {
      let j = a.items.findIndex((x, n) => n > a.i && x.sets.some(y => !y.ok));
      if (j < 0) j = a.items.findIndex(x => x.sets.some(y => !y.ok));
      if (j < 0) { S.guardar(); render(); scrollTo(0, 0); return; }
      a.i = j;
    }
    if (rest > 0) iniciarDescanso(rest); else { S.guardar(); render(); scrollTo(0, 0); }
  }
  function terminar() {
    const a = st().active;
    if (!a) return;
    const items = a.items.map(it => ({ ex: it.ex, nombre: it.nombre, sets: it.sets.filter(x => x.ok).map(x => ({ kg: x.kg, reps: x.reps || it.reps })) })).filter(it => it.sets.length);
    pararTick(); A.cancelar(); A.pantalla(false); descanso.hidden = true;
    st().active = null; ui.entrenando = false;
    if (!items.length) { S.guardar(); render(); toast('No registraste ninguna serie'); return; }
    const min = Math.max(1, Math.round((Date.now() - a.inicio) / 60000)), prev = registro(a.fecha);
    st().logs[a.fecha] = { fecha: a.fecha, nombre: a.nombre, min: (prev ? prev.min || 0 : 0) + min, items: (prev ? prev.items || [] : []).concat(items), updatedAt: Date.now() };
    S.tocar('logs'); ui.tab = 'hoy'; ui.verDia = null; render(); scrollTo(0, 0);
    const n = items.reduce((t, it) => t + it.sets.length, 0);
    abrir(cabHoja('Entrenamiento guardado') + '<div class="resumen"><div><b>' + n + '</b><span>series</span></div><div><b>' + min + '</b><span>minutos</span></div><div><b>' + items.length + '</b><span>ejercicios</span></div></div><p class="tenue">Ya quedó marcado en tu calendario.</p><div style="margin-top:18px"><button class="btn primario" data-a="cerrar">Listo</button></div>');
    sincronizar(false);
  }

  // ---------- Descanso ----------
  let tickT = null;
  const CIRC = 2 * Math.PI * 86;
  function iniciarDescanso(seg) {
    const a = st().active;
    a.totalDescanso = seg; a.finDescanso = Date.now() + seg * 1000; S.guardar();
    A.programar(seg);
    toastEl.hidden = true;
    render(); scrollTo(0, 0); mostrarDescanso();
  }
  function mostrarDescanso() {
    const a = st().active, it = a.items[a.i], k = it.sets.findIndex(x => !x.ok);
    descanso.className = ''; descanso.hidden = false;
    descanso.innerHTML = '<p class="rotulo" id="d-rotulo">Descanso</p>' +
      '<div class="plato"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="pista" cx="100" cy="100" r="86"/><circle class="ranura" cx="100" cy="100" r="66"/><circle class="ranura" cx="100" cy="100" r="60"/>' +
      '<circle class="resto" id="d-anillo" cx="100" cy="100" r="86" stroke-dasharray="' + CIRC.toFixed(1) + '" stroke-dashoffset="0"/></svg><span class="reloj" id="d-reloj" role="timer"></span></div>' +
      '<p class="sigue">Sigue<b>' + esc(it.nombre) + (k >= 0 ? ', serie ' + (k + 1) + ' de ' + it.sets.length : '') + '</b></p>' +
      '<div class="fila-btn"><button class="btn" data-a="d-ajuste" data-v="-15">−15 s</button><button class="btn primario" data-a="d-saltar">Saltar</button><button class="btn" data-a="d-ajuste" data-v="15">+15 s</button></div>';
    tick();
    if (!tickT) tickT = setInterval(tick, 200);
  }
  function pararTick() { clearInterval(tickT); tickT = null; }
  function tick() {
    const a = st().active;
    if (!a || !a.finDescanso) { pararTick(); return; }
    const ms = a.finDescanso - Date.now();
    if (ms <= 0) { finDescanso(true); return; }
    const r = $('#d-reloj'), an = $('#d-anillo');
    if (r) r.textContent = reloj(Math.ceil(ms / 1000));
    if (an) an.setAttribute('stroke-dashoffset', (CIRC * (1 - ms / (a.totalDescanso * 1000))).toFixed(1));
  }
  function finDescanso(sonar) {
    const a = st().active;
    pararTick();
    if (a) { a.finDescanso = 0; S.guardar(); }
    if (!sonar) { A.cancelar(); descanso.hidden = true; return; }
    if (!A.sonoATiempo()) A.ahora(); else if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    const r = $('#d-reloj'), ro = $('#d-rotulo'), an = $('#d-anillo');
    if (r) r.textContent = '0:00';
    if (ro) ro.textContent = '¡A darle!';
    if (an) an.setAttribute('stroke-dashoffset', CIRC.toFixed(1));
    descanso.classList.add('listo');
    setTimeout(() => { if (!st().active || !st().active.finDescanso) descanso.hidden = true; }, 1500);
  }

  // ---------- Rutina ----------
  function vRutina() {
    const dias = st().routine.dias;
    return '<header class="cab"><h1>Tu semana</h1><p class="tenue">Toca un día para cambiar ejercicios, series o descansos.</p></header><div class="lista">' +
      DIAS.map((n, i) => { const d = dias[i + 1]; return '<button class="fila" data-a="rut-dia" data-v="' + (i + 1) + '"><span class="cuerpo"><b>' + n + '</b><span>' + esc(d.items.length ? d.nombre : 'Descanso') + '</span></span><span class="der">' + (d.items.length ? d.items.length + ' ejercicios, ' + Gen.minutosDia(d.items) + ' min' : '') + '</span></button>'; }).join('') + '</div>';
  }
  function vDia() {
    const d = st().routine.dias[ui.dia];
    let h = '<button class="liga volver" data-a="rut-volver">‹ Tu semana</button><header class="cab"><p class="fecha">' + DIAS[ui.dia - 1] + '</p>' +
      '<label class="campo" style="margin-top:6px"><span>Nombre de la sesión</span><input data-c="dia-nombre" maxlength="50" value="' + esc(d.items.length ? d.nombre : '') + '" placeholder="Descanso"></label></header>';
    if (d.items.length) {
      h += '<p class="tenue chico" style="margin-bottom:8px">' + d.items.length + ' ejercicios, unos ' + Gen.minutosDia(d.items) + ' min</p><div class="lista">' +
        d.items.map((it, i) => '<div class="fila"><span class="orden"><button data-a="it-mover" data-u="' + it.uid + '" data-v="-1" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>▲</button><button data-a="it-mover" data-u="' + it.uid + '" data-v="1" aria-label="Bajar"' + (i === d.items.length - 1 ? ' disabled' : '') + '>▼</button></span>' + filaItem(it, 'it-editar').replace('class="fila"', 'class="fila-in"') + '</div>').join('') + '</div>';
    } else h += '<p class="vacio">Este día es de descanso. Agrega un ejercicio para convertirlo en día de entrenamiento.</p>';
    h += '<div class="pila" style="margin-top:18px"><button class="btn primario" data-a="it-agregar">Agregar ejercicio</button><button class="btn" data-a="rut-cambiar">Intercambiar con otro día</button>' +
      (d.items.length ? '<button class="btn peligro" data-a="rut-descanso">Dejar como día de descanso</button>' : '') + '</div>';
    return h;
  }
  function itemActual() { return st().routine.dias[ui.dia].items.find(x => x.uid === ui.item.uid); }
  function hojaItem(uid) {
    const it = st().routine.dias[ui.dia].items.find(x => x.uid === uid), e = S.ejercicio(it.ex);
    ui.item = { uid, sets: it.sets, rest: it.rest };
    abrir(cabHoja(e.nombre, G.GRUPOS[e.grupo] || '') +
      '<div class="campo"><span>Series</span><div class="paso"><button data-a="it-paso" data-k="sets" data-v="-1" aria-label="Menos series">−</button><output id="o-sets">' + it.sets + '</output><button data-a="it-paso" data-k="sets" data-v="1" aria-label="Más series">+</button></div></div>' +
      '<label class="campo"><span>Repeticiones o tiempo (por ejemplo 8-12, 30 s o 15 min)</span><input id="it-reps" maxlength="24" value="' + esc(it.reps) + '"></label>' +
      '<div class="campo"><span>Descanso entre series</span><div class="paso"><button data-a="it-paso" data-k="rest" data-v="-15" aria-label="Menos descanso">−</button><output id="o-rest">' + reloj(it.rest) + '</output><button data-a="it-paso" data-k="rest" data-v="15" aria-label="Más descanso">+</button></div></div>' +
      '<label class="campo"><span>Nota para ti</span><input id="it-nota" maxlength="120" placeholder="Por ejemplo: asiento en la posición 4" value="' + esc(it.nota || '') + '"></label>' +
      '<div class="pila" style="margin-top:18px"><button class="btn primario" data-a="it-guardar">Guardar cambios</button><div class="fila-btn"><button class="btn" data-a="ver-ej" data-id="' + esc(it.ex) + '">Cómo se hace</button><button class="btn" data-a="it-cambiar">Cambiar ejercicio</button></div><button class="btn peligro" data-a="it-quitar">Quitar de este día</button></div>');
    ui.item = { uid, sets: it.sets, rest: it.rest };
  }

  // ---------- Elegir, ver y editar ejercicios ----------
  function listaPick() {
    const q = (($('#pick-q') || {}).value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const l = S.todos().filter(e => (!ui.grupo || e.grupo === ui.grupo) && (!q || e.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(q) >= 0));
    return l.length ? l.map(e => '<button class="fila" data-a="pick-ok" data-id="' + esc(e.id) + '">' + miniFoto(e) + '<span class="cuerpo"><b>' + esc(e.nombre) + '</b><span>' + (G.GRUPOS[e.grupo] || '') + '</span></span></button>').join('') : '<p class="vacio">No hay ejercicios con ese nombre. Puedes crear el tuyo.</p>';
  }
  function hojaPick(modo, uid) {
    const pick = { modo, uid };
    abrir(cabHoja(modo === 'cambiar' ? 'Cambiar por otro ejercicio' : 'Agregar ejercicio') +
      '<label class="campo" style="margin-top:0"><input id="pick-q" data-c="pick-q" type="search" placeholder="Buscar ejercicio"></label>' +
      '<div class="chips" style="margin-top:10px"><button class="chip" data-a="pick-g" data-v="" aria-pressed="' + (!ui.grupo) + '">Todos</button>' + Object.keys(G.GRUPOS).filter(g => g !== 'otro').map(g => '<button class="chip" data-a="pick-g" data-v="' + g + '" aria-pressed="' + (ui.grupo === g) + '">' + G.GRUPOS[g] + '</button>').join('') + '</div>' +
      '<div class="lista" id="pick-lista">' + listaPick() + '</div><div style="margin-top:16px"><button class="btn" data-a="ej-nuevo">Crear un ejercicio propio</button></div>');
    ui.pick = pick;
  }
  function ponerEjercicio(id) {
    const d = st().routine.dias[ui.dia], e = S.ejercicio(id), pick = ui.pick || { modo: 'agregar' };
    if (pick.modo === 'cambiar') { const it = d.items.find(x => x.uid === pick.uid); if (it) it.ex = id; }
    else {
      const dosis = G.EX[id] ? Gen.dosis(st().profile.encuesta, G.EX[id], d.items.length) : { sets: 3, reps: '10-12', rest: 60 };
      if (!d.items.length && (!d.nombre || d.nombre === 'Descanso')) d.nombre = 'Entrenamiento';
      d.items.push({ uid: Gen.uid(), ex: id, sets: dosis.sets, reps: e.tipo === 'k' ? '15 min' : dosis.reps, rest: e.tipo === 'k' ? 0 : dosis.rest, nota: '' });
    }
    S.tocar('routine'); cerrar(); render();
  }
  function hojaEjercicio(id) {
    const e = S.ejercicio(id);
    abrir(cabHoja(e.nombre, G.GRUPOS[e.grupo] || '') + fotoGrande(e) +
      ((e.tips || []).length ? '<ul class="tips-l">' + e.tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '<p class="tenue" style="margin-top:12px">Todavía no tiene tips. Agrega los tuyos.</p>') +
      '<div style="margin-top:18px"><button class="btn" data-a="ej-editar" data-id="' + esc(id) + '">Editar nombre, tips o foto</button></div>');
  }
  function hojaEditarEj(id) {
    const e = id ? S.ejercicio(id) : { nombre: '', grupo: ui.grupo || 'pecho', tips: [] };
    const propio = !id || !G.EX[id];
    abrir(cabHoja(id ? 'Editar ejercicio' : 'Ejercicio nuevo') +
      '<label class="campo" style="margin-top:0"><span>Nombre</span><input id="ej-nombre" maxlength="60" value="' + esc(e.nombre) + '"></label>' +
      (propio ? '<label class="campo"><span>Zona</span><select id="ej-grupo">' + Object.keys(G.GRUPOS).map(g => '<option value="' + g + '"' + (e.grupo === g ? ' selected' : '') + '>' + G.GRUPOS[g] + '</option>').join('') + '</select></label>' : '') +
      '<label class="campo"><span>Tips, uno por renglón</span><textarea id="ej-tips">' + esc((e.tips || []).join('\n')) + '</textarea></label>' +
      '<label class="campo"><span>Foto propia (opcional)</span><input id="ej-foto" type="file" accept="image/*"></label>' +
      '<div class="pila" style="margin-top:18px"><button class="btn primario" data-a="ej-guardar" data-id="' + esc(id || '') + '">Guardar ejercicio</button>' +
      (id && propio ? '<button class="btn peligro" data-a="ej-borrar" data-id="' + esc(id) + '">Borrar ejercicio</button>' : '') +
      (id && !propio && st().custom.cambios[id] ? '<button class="btn" data-a="ej-restaurar" data-id="' + esc(id) + '">Volver al original</button>' : '') + '</div>');
    ui.pick = ui.pickPend || null; ui.pickPend = null;
  }
  function reducirFoto(archivo) {
    return new Promise(res => {
      if (!archivo) return res(null);
      const img = new Image(), url = URL.createObjectURL(archivo);
      img.onload = () => {
        const esc2 = Math.min(1, 560 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * esc2); c.height = Math.round(img.height * esc2);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => { URL.revokeObjectURL(url); res(null); };
      img.src = url;
    });
  }

  // ---------- Calendario ----------
  function estadisticas() {
    const fechas = Object.keys(st().logs).filter(f => registro(f)), hoy = new Date();
    const pref = S.fechaISO(hoy).slice(0, 7);
    const lunes = f => { const d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() - (S.diaSemana(d) - 1)); return S.fechaISO(d); };
    const semanas = {}; fechas.forEach(f => { semanas[lunes(f)] = 1; });
    let racha = 0; const c = new Date(lunes(S.fechaISO(hoy)) + 'T12:00:00');
    if (!semanas[S.fechaISO(c)]) c.setDate(c.getDate() - 7);
    while (semanas[S.fechaISO(c)]) { racha++; c.setDate(c.getDate() - 7); }
    return { mes: fechas.filter(f => f.slice(0, 7) === pref).length, racha, total: fechas.length };
  }
  function vCalendario() {
    const hoy = new Date(), m = ui.mes || { y: hoy.getFullYear(), m: hoy.getMonth() }, e = estadisticas(), hoyISO = S.hoy();
    const primero = new Date(m.y, m.m, 1), hueco = S.diaSemana(primero) - 1, total = new Date(m.y, m.m + 1, 0).getDate();
    let celdas = LETRAS.map(l => '<span class="dsem">' + l + '</span>').join('');
    for (let i = 0; i < hueco; i++) celdas += '<span class="dia fuera"></span>';
    for (let d = 1; d <= total; d++) {
      const f = S.fechaISO(new Date(m.y, m.m, d)), plan = f >= hoyISO && st().routine.dias[S.diaSemana(new Date(m.y, m.m, d))].items.length > 0;
      celdas += '<button class="dia ' + (registro(f) ? 'hecho ' : '') + (plan ? 'toca ' : '') + (f === hoyISO ? 'es-hoy ' : '') + (f > hoyISO ? 'futuro' : '') + '" data-a="cal-dia" data-v="' + f + '">' + d + '<i></i></button>';
    }
    return '<header class="cab"><h1>Calendario</h1></header>' +
      '<div class="resumen"><div><b>' + e.mes + '</b><span>este mes</span></div><div><b>' + e.racha + '</b><span>' + (e.racha === 1 ? 'semana seguida' : 'semanas seguidas') + '</span></div><div><b>' + e.total + '</b><span>en total</span></div></div>' +
      '<div class="mes-cab"><button data-a="cal-mes" data-v="-1" aria-label="Mes anterior">‹</button><h2>' + MESES[m.m] + ' ' + m.y + '</h2><button data-a="cal-mes" data-v="1" aria-label="Mes siguiente">›</button></div>' +
      '<div class="mes">' + celdas + '</div><div class="leyenda"><span><i></i>Entrenaste</span><span><i class="p"></i>Toca entrenar</span></div>';
  }
  function hojaFecha(f) {
    const d = new Date(f + 'T12:00:00'), r = registro(f), dia = st().routine.dias[S.diaSemana(d)];
    const titulo = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    let h = cabHoja(titulo.charAt(0).toUpperCase() + titulo.slice(1), r ? r.nombre + (r.min ? ', ' + r.min + ' min' : '') : '');
    if (r) {
      h += '<div class="lista">' + (r.items || []).map(it => '<div class="fila"><span class="cuerpo"><b>' + esc(it.nombre || S.ejercicio(it.ex).nombre) + '</b><span>' + it.sets.map(x => esc((x.kg ? x.kg + ' kg × ' : '') + x.reps)).join(', ') + '</span></span></div>').join('') + '</div>' +
        '<div style="margin-top:18px"><button class="btn peligro" data-a="cal-borrar" data-v="' + f + '">Borrar este registro</button></div>';
    } else if (f > S.hoy()) {
      h += '<p class="tenue">' + (dia.items.length ? 'Ese día toca: ' + esc(dia.nombre) + '.' : 'Ese día toca descanso.') + '</p>';
    } else {
      h += '<p class="tenue">Sin registro este día.' + (dia.items.length ? ' Tocaba: ' + esc(dia.nombre) + '.' : '') + '</p>' +
        (dia.items.length ? '<div style="margin-top:18px"><button class="btn primario" data-a="cal-marcar" data-v="' + f + '">Marcar como entrenado</button></div>' : '');
    }
    abrir(h);
  }

  // ---------- Ajustes ----------
  function interruptor(k, titulo, sub) {
    return '<label class="interruptor"><span>' + titulo + (sub ? '<small>' + sub + '</small>' : '') + '</span><input type="checkbox" data-c="aj-toggle" data-k="' + k + '"' + (st().settings[k] ? ' checked' : '') + '></label>';
  }
  function vAjustes() {
    const s = st(), p = s.profile, m = s.sync;
    let drive;
    if (!D.configurado()) drive = '<p>Falta pegar el ID de cliente de Google en el archivo js/config.js (los pasos están en LEEME.md). Mientras tanto, todo se guarda en este teléfono.</p>';
    else if (!m.conectado) drive = '<p>Conéctate para guardar una copia en tu Drive, dentro de la carpeta ' + esc(G.CONFIG.CARPETA_DRIVE) + ' / ' + esc(p.nombre) + '.</p><div style="margin-top:12px"><button class="btn primario" data-a="dr-conectar">Conectar con Google</button></div>';
    else drive = '<p>' + (m.correo ? 'Conectado como ' + esc(m.correo) + '. ' : 'Conectado. ') + (m.ultima ? 'Última copia ' + hace(m.ultima) + '.' : 'Todavía no se sube ninguna copia.') + (m.pendiente ? ' Hay cambios por subir.' : '') + '</p><div class="pila" style="margin-top:12px"><button class="btn" data-a="dr-sync">Sincronizar ahora</button><button class="liga" data-a="dr-salir">Desconectar</button></div>';
    return '<header class="cab"><h1>Ajustes</h1></header><div class="pila-g">' +
      '<section class="grupo"><h2>' + esc(p.nombre) + '</h2><p>Objetivo: ' + Gen.OBJ[p.encuesta.objetivo] + '. Plan de ' + esc(p.plan.titulo) + ', unos ' + p.plan.minutos + ' min por sesión.</p><div style="margin-top:12px"><button class="btn" data-a="aj-encuesta">Volver a hacer la encuesta</button></div></section>' +
      '<section class="grupo"><h2>Google Drive</h2>' + drive + '</section>' +
      '<section class="grupo"><h2>Pitido del descanso</h2>' + interruptor('sonido', 'Sonar al terminar el descanso') + interruptor('cuenta', 'Avisar 3, 2, 1 antes') + interruptor('enSilencio', 'Sonar aunque el iPhone esté en silencio', 'Puede pausar tu música mientras suena') + '<div style="margin-top:8px"><button class="btn" data-a="aj-probar">Probar el pitido</button></div></section>' +
      '<section class="grupo"><h2>Pantalla</h2>' + interruptor('pantalla', 'Mantener la pantalla encendida al entrenar', 'Con el iPhone bloqueado el pitido no puede sonar') + '</section>' +
      '<section class="grupo"><h2>Uso sin internet</h2><p id="aj-fotos">Revisando fotos guardadas…</p><div style="margin-top:12px"><button class="btn" data-a="aj-fotos">Descargar todas las fotos</button></div></section>' +
      '<section class="grupo"><h2>Tus datos</h2><div class="pila"><button class="btn" data-a="aj-exportar">Descargar una copia</button><button class="btn peligro" data-a="aj-borrar">Borrar todo de este teléfono</button></div></section></div>';
  }
  function urlsFotos() { const u = []; G.EXERCISES.forEach(e => S.fotos(e).forEach(x => u.push(x))); return u; }
  async function contarFotos() {
    const el = $('#aj-fotos'); if (!el) return;
    const total = urlsFotos().length;
    if (!('caches' in window) || !navigator.serviceWorker || !navigator.serviceWorker.controller) { el.textContent = 'El modo sin internet se activa cuando la app está publicada en su dirección https e instalada.'; return; }
    try { const c = await caches.open(CACHE_FOTOS), n = (await c.keys()).length; if ($('#aj-fotos')) $('#aj-fotos').textContent = n >= total ? 'Las ' + total + ' fotos están guardadas. Todo funciona sin internet.' : n + ' de ' + total + ' fotos guardadas. Descárgalas con wifi para no gastar datos.'; } catch (e) { el.textContent = ''; }
  }
  let bajando = false;
  async function bajarFotos(manual) {
    if (bajando || !navigator.serviceWorker || !navigator.serviceWorker.controller) { if (manual) toast('Disponible cuando la app esté publicada e instalada'); return; }
    if (!navigator.onLine) { if (manual) toast('Sin internet'); return; }
    bajando = true;
    const urls = urlsFotos(); let i = 0, ok = 0;
    async function obrero() { while (i < urls.length) { const u = urls[i++]; try { const r = await fetch(u); if (r.ok) ok++; } catch (e) { /* se reintenta después */ } const el = $('#aj-fotos'); if (el) el.textContent = 'Descargando fotos: ' + i + ' de ' + urls.length; } }
    await Promise.all([obrero(), obrero(), obrero(), obrero()]);
    bajando = false;
    if (ok === urls.length) localStorage.setItem('gym.fotos', '1');
    if (manual) toast(ok === urls.length ? 'Fotos guardadas' : 'Faltaron ' + (urls.length - ok) + ' fotos. Intenta de nuevo');
    contarFotos();
  }

  // ---------- Google Drive ----------
  async function sincronizar(manual) {
    const r = await D.sincronizar();
    if (r.ok) {
      const escribiendo = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
      if (hoja.hidden && !ui.entrenando && !ui.enc && !ui.plan && !escribiendo && (r.cambio || ui.tab === 'hoy' || ui.tab === 'ajustes')) render();
      if (manual) toast('Copia en Drive actualizada');
      return;
    }
    if (!manual) return;
    if (r.motivo === 'sin-permiso') { D.entrar(!!st().sync.correo, 'sync'); return; }
    toast(r.motivo === 'sin-internet' ? 'Sin internet. Se sube sola cuando te conectes' : r.motivo === 'sin-configurar' ? 'Falta configurar Google Drive' : 'No se pudo subir a Drive. Intenta más tarde');
  }
  function automatico() {
    const s = st();
    if (!s.profile || !D.configurado() || !navigator.onLine) return;
    if (D.token()) { if (s.sync.pendiente || !s.sync.ultima) sincronizar(false); }
    else if (D.puedeRenovarSolo() && hoja.hidden && !ui.enc && !ui.plan) D.entrar(true, 'sync');
  }
  async function alVolverDeGoogle(v) {
    if (!v.ok) {
      if (/interaction_required|login_required|consent_required|account_selection_required/.test(v.error || '')) { st().sync.conectado = false; S.guardar(); render(); toast('Vuelve a conectar tu cuenta de Google en Ajustes'); }
      else if (v.error === 'access_denied') toast('No se dio permiso para usar Google Drive');
      else toast('No se pudo conectar con Google');
      return;
    }
    if (v.despues === 'recuperar') {
      try {
        const l = await D.perfiles();
        if (!l.length) { toast('No encontré datos de la app en ese Drive'); return; }
        ui.perfiles = l;
        abrir(cabHoja('¿De quién son los datos?', 'Carpetas encontradas en tu Drive') + '<div class="lista">' + l.map((c, i) => '<button class="fila" data-a="rec-ok" data-v="' + i + '"><span class="cuerpo"><b>' + esc(c.name) + '</b></span></button>').join('') + '</div>');
      } catch (e) { toast('No se pudo leer Google Drive'); }
      return;
    }
    render(); sincronizar(true);
  }

  // ---------- Acciones ----------
  const acciones = {
    tab(el) { ui.tab = el.dataset.v; ui.dia = null; ui.verDia = null; render(); scrollTo(0, 0); },
    cerrar() { cerrar(); },
    confirmar() { const f = ui.alConfirmar; cerrar(); if (f) f(); },

    encuesta() {
      const p = st().profile;
      ui.enc = { i: 0, r: p ? JSON.parse(JSON.stringify(p.encuesta)) : { nombre: '', dias: [], molestias: [], zonas: [] } };
      cerrar(); render(); scrollTo(0, 0);
    },
    recuperar() { if (!D.entrar(false, 'recuperar')) toast('Primero hay que configurar Google Drive (ver LEEME.md)'); },
    'rec-ok'(el) {
      const c = ui.perfiles[+el.dataset.v]; cerrar();
      D.recuperar(c).then(ok => { if (ok) { render(); toast('Datos recuperados'); } else toast('Esa carpeta no tiene datos'); }).catch(() => toast('No se pudo leer Google Drive'));
    },
    'enc-atras'() { if (ui.enc.i === 0) { ui.enc = null; } else ui.enc.i--; render(); scrollTo(0, 0); },
    'enc-uno'(el) { const p = PREG[ui.enc.i]; ui.enc.r[p.k] = p.k === 'minutos' ? +el.dataset.v : el.dataset.v; encAvanza(); },
    'enc-dia'(el) { const d = +el.dataset.v, l = ui.enc.r.dias, i = l.indexOf(d); if (i >= 0) l.splice(i, 1); else l.push(d); render(); },
    'enc-varios'(el) { const l = ui.enc.r[PREG[ui.enc.i].k], v = el.dataset.v, i = l.indexOf(v); if (i >= 0) l.splice(i, 1); else l.push(v); render(); },
    'enc-sig'() {
      const p = PREG[ui.enc.i], r = ui.enc.r;
      if (p.tipo === 'texto') { const v = $('#enc-texto').value.trim(); if (!v) { toast('Escribe tu nombre'); return; } r[p.k] = v; }
      if (p.tipo === 'dias' && !r.dias.length) { toast('Marca al menos un día'); return; }
      if (p.tipo === 'cuerpo') { r.edad = $('#enc-edad').value.trim(); r.peso = $('#enc-peso').value.trim().replace(',', '.'); r.estatura = $('#enc-estatura').value.trim(); }
      encAvanza();
    },
    'plan-atras'() { ui.enc = { i: PREG.length - 1, r: ui.plan.r }; ui.plan = null; render(); },
    'plan-sel'(el) { ui.plan.sel = +el.dataset.v; render(); },
    'plan-crear'() {
      const p = ui.plan, op = p.ops[p.sel], s = st();
      const crear = () => {
        if (s.profile && s.profile.nombre !== p.r.nombre) { s.sync.carpeta = null; s.sync.archivo = null; }
        s.profile = { nombre: p.r.nombre, encuesta: p.r, plan: { id: op.id, titulo: op.titulo, minutos: op.minutos, pct: op.pct, dias: op.dias }, updatedAt: Date.now() };
        s.routine = Gen.construir(p.r, op);
        ui.plan = null; ui.tab = 'hoy'; ui.verDia = null;
        S.tocar('profile'); S.tocar('routine'); render(); scrollTo(0, 0); toast('Rutina lista. Puedes cambiarla en la pestaña Rutina');
      };
      if (s.routine) confirmar('¿Reemplazar tu rutina?', 'La rutina nueva sustituye a la actual. Tu calendario no se borra.', 'Reemplazar rutina', crear); else crear();
    },

    'hoy-dia'(el) { ui.verDia = +el.dataset.v; render(); },
    'ver-ej'(el) { hojaEjercicio(el.dataset.id); },
    'ent-empezar'(el) { empezar(+el.dataset.v); },
    'ent-continuar'() { A.preparar(); A.pantalla(true); ui.entrenando = true; render(); scrollTo(0, 0); },
    'ent-descartar'() { confirmar('¿Descartar el entrenamiento?', 'Se pierden las series que llevabas anotadas.', 'Descartar', () => { st().active = null; S.guardar(); render(); }, true); },
    'ent-salir'() { ui.entrenando = false; A.pantalla(false); render(); },
    'ent-serie'() { serieHecha(); },
    'ent-ant'() { const a = st().active; if (a.i > 0) { a.i--; S.guardar(); render(); scrollTo(0, 0); } },
    'ent-sig'() { const a = st().active; if (a.i < a.items.length - 1) { a.i++; S.guardar(); render(); scrollTo(0, 0); } },
    'ent-otra'() { const a = st().active; a.items[a.i].sets.push({ kg: '', reps: '', ok: false }); S.guardar(); render(); },
    'ent-terminar'() { confirmar('¿Terminar el entrenamiento?', 'Se guardan las series que ya hiciste.', 'Guardar y terminar', terminar); },
    'ent-fin'() { terminar(); },
    'd-saltar'() { finDescanso(false); },
    'd-ajuste'(el) {
      const a = st().active; if (!a || !a.finDescanso) return;
      a.finDescanso += (+el.dataset.v) * 1000;
      const queda = (a.finDescanso - Date.now()) / 1000;
      if (queda <= 0) { finDescanso(true); return; }
      a.totalDescanso = Math.max(a.totalDescanso, queda); S.guardar(); A.programar(queda); tick();
    },

    'rut-dia'(el) { ui.dia = +el.dataset.v; render(); scrollTo(0, 0); },
    'rut-volver'() { ui.dia = null; render(); },
    'rut-descanso'() { confirmar('¿Dejar ' + DIAS[ui.dia - 1].toLowerCase() + ' como descanso?', 'Se quitan los ejercicios de este día.', 'Dejar como descanso', () => { st().routine.dias[ui.dia] = { nombre: 'Descanso', items: [] }; S.tocar('routine'); render(); }, true); },
    'rut-cambiar'() {
      abrir(cabHoja('Intercambiar ' + DIAS[ui.dia - 1].toLowerCase() + ' con') + '<div class="lista">' + DIAS.map((n, i) => i + 1 === ui.dia ? '' : '<button class="fila" data-a="rut-cambio" data-v="' + (i + 1) + '"><span class="cuerpo"><b>' + n + '</b><span>' + esc(st().routine.dias[i + 1].items.length ? st().routine.dias[i + 1].nombre : 'Descanso') + '</span></span></button>').join('') + '</div>');
    },
    'rut-cambio'(el) { const d = st().routine.dias, o = +el.dataset.v, t = d[ui.dia]; d[ui.dia] = d[o]; d[o] = t; S.tocar('routine'); ui.dia = o; cerrar(); render(); toast('Días intercambiados'); },
    'it-mover'(el) { const l = st().routine.dias[ui.dia].items, i = l.findIndex(x => x.uid === el.dataset.u), j = i + (+el.dataset.v); if (i < 0 || j < 0 || j >= l.length) return; const t = l[i]; l[i] = l[j]; l[j] = t; S.tocar('routine'); render(); },
    'it-editar'(el) { hojaItem(el.dataset.u); },
    'it-paso'(el) {
      const k = el.dataset.k, v = +el.dataset.v;
      if (k === 'sets') { ui.item.sets = Math.max(1, Math.min(10, ui.item.sets + v)); $('#o-sets').textContent = ui.item.sets; }
      else { ui.item.rest = Math.max(0, Math.min(600, ui.item.rest + v)); $('#o-rest').textContent = reloj(ui.item.rest); }
    },
    'it-guardar'() { const it = itemActual(); it.sets = ui.item.sets; it.rest = ui.item.rest; it.reps = $('#it-reps').value.trim() || it.reps; it.nota = $('#it-nota').value.trim(); S.tocar('routine'); cerrar(); render(); },
    'it-quitar'() { const d = st().routine.dias[ui.dia]; d.items = d.items.filter(x => x.uid !== ui.item.uid); if (!d.items.length) d.nombre = 'Descanso'; S.tocar('routine'); cerrar(); render(); },
    'it-cambiar'() { hojaPick('cambiar', ui.item.uid); },
    'it-agregar'() { hojaPick('agregar'); },
    'pick-g'(el) { ui.grupo = el.dataset.v; hoja.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.v === ui.grupo))); $('#pick-lista').innerHTML = listaPick(); },
    'pick-ok'(el) { ponerEjercicio(el.dataset.id); },
    'ej-nuevo'() { ui.pickPend = ui.pick; hojaEditarEj(null); },
    'ej-editar'(el) { hojaEditarEj(el.dataset.id); },
    async 'ej-guardar'(el) {
      const id = el.dataset.id, nombre = $('#ej-nombre').value.trim(), c = st().custom;
      if (!nombre) { toast('Ponle nombre al ejercicio'); return; }
      const tips = $('#ej-tips').value.split('\n').map(t => t.trim()).filter(Boolean);
      const foto = await reducirFoto($('#ej-foto').files[0]);
      let nuevoId = null;
      if (!id) { nuevoId = 'p' + Date.now().toString(36); c.items.push({ id: nuevoId, nombre, grupo: $('#ej-grupo').value, tips, tipo: 'i', foto: foto || '', propio: true }); }
      else if (!G.EX[id]) { const e = c.items.find(x => x.id === id); Object.assign(e, { nombre, grupo: $('#ej-grupo').value, tips }); if (foto) e.foto = foto; }
      else { c.cambios[id] = Object.assign({}, c.cambios[id] || {}, { nombre, tips }); if (foto) c.cambios[id].foto = foto; }
      S.tocar('custom');
      if (nuevoId && ui.pick && ui.dia) { ponerEjercicio(nuevoId); toast('Ejercicio creado y agregado'); return; }
      cerrar(); render(); toast('Ejercicio guardado');
    },
    'ej-borrar'(el) {
      const id = el.dataset.id;
      confirmar('¿Borrar este ejercicio?', 'También se quita de los días donde lo tengas.', 'Borrar ejercicio', () => {
        const s = st(); s.custom.items = s.custom.items.filter(x => x.id !== id);
        Object.keys(s.routine.dias).forEach(d => { const dia = s.routine.dias[d]; dia.items = dia.items.filter(x => x.ex !== id); if (!dia.items.length) dia.nombre = 'Descanso'; });
        S.tocar('custom'); S.tocar('routine'); render();
      }, true);
    },
    'ej-restaurar'(el) { delete st().custom.cambios[el.dataset.id]; S.tocar('custom'); cerrar(); render(); toast('Ejercicio restaurado'); },

    'cal-mes'(el) { const h = new Date(), m = ui.mes || { y: h.getFullYear(), m: h.getMonth() }, d = new Date(m.y, m.m + (+el.dataset.v), 1); ui.mes = { y: d.getFullYear(), m: d.getMonth() }; render(); },
    'cal-dia'(el) { hojaFecha(el.dataset.v); },
    'cal-borrar'(el) { const f = el.dataset.v; confirmar('¿Borrar este registro?', 'Se quita del calendario.', 'Borrar registro', () => { st().logs[f] = { fecha: f, borrado: true, updatedAt: Date.now() }; S.tocar('logs'); render(); }, true); },
    'cal-marcar'(el) {
      const f = el.dataset.v, dia = st().routine.dias[S.diaSemana(new Date(f + 'T12:00:00'))];
      st().logs[f] = { fecha: f, nombre: dia.nombre, min: 0, updatedAt: Date.now(), items: dia.items.map(it => ({ ex: it.ex, nombre: S.ejercicio(it.ex).nombre, sets: Array.from({ length: it.sets }, () => ({ kg: '', reps: it.reps })) })) };
      S.tocar('logs'); cerrar(); render(); toast('Día marcado');
    },

    'aj-encuesta'() { acciones.encuesta(); },
    'aj-probar'() { const s = st().settings; if (!s.sonido) { toast('Activa primero el pitido'); return; } if (!A.ahora()) toast('Este navegador no puede reproducir el pitido'); },
    'aj-fotos'() { bajarFotos(true); },
    'aj-exportar'() {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S.paquete(), null, 2)], { type: 'application/json' }));
      a.download = 'gym-' + S.hoy() + '.json'; document.body.appendChild(a); a.click(); a.remove();
    },
    'aj-borrar'() { confirmar('¿Borrar todo de este teléfono?', 'Se borran tu rutina y tu calendario de este teléfono. Lo que ya esté en Google Drive se queda ahí.', 'Borrar todo', () => { D.salir(); S.borrarTodo(); ui.tab = 'hoy'; render(); }, true); },
    'dr-conectar'() { D.entrar(false, 'sync'); },
    'dr-sync'() { sincronizar(true); },
    'dr-salir'() { confirmar('¿Desconectar Google Drive?', 'Tus datos siguen en este teléfono y la copia de Drive no se borra.', 'Desconectar', () => { D.salir(); render(); }); }
  };

  document.addEventListener('click', ev => {
    if (ev.target === hoja) { cerrar(); return; }
    const el = ev.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const f = acciones[el.dataset.a];
    if (f) f(el, ev);
  });
  document.addEventListener('input', ev => {
    const c = ev.target.dataset && ev.target.dataset.c;
    if (c === 'pick-q') $('#pick-lista').innerHTML = listaPick();
  });
  document.addEventListener('change', ev => {
    const el = ev.target, c = el.dataset && el.dataset.c;
    if (c === 'aj-toggle') { st().settings[el.dataset.k] = el.checked; S.tocar('settings'); }
    else if (c === 'dia-nombre') { const d = st().routine.dias[ui.dia]; if (d.items.length) { d.nombre = el.value.trim() || 'Entrenamiento'; S.tocar('routine'); } }
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && !hoja.hidden) cerrar();
    if (ev.key === 'Enter' && ev.target.id === 'enc-texto') acciones['enc-sig']();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (st().active && ui.entrenando) { A.pantalla(true); tick(); } else automatico();
  });
  window.addEventListener('online', automatico);

  // Subir a Drive unos segundos después de cada cambio (si hay permiso e internet).
  let syncT = null;
  S.alCambiar(() => { clearTimeout(syncT); syncT = setTimeout(() => { if (D.token() && navigator.onLine && !st().active) sincronizar(false); }, 4000); });

  // ---------- Arranque ----------
  S.cargar();
  const vuelta = D.alVolver();
  // El modo sin internet solo se activa en la dirección publicada (https), no al probar en la computadora,
  // para que al editar archivos en VS Code siempre veas la versión nueva.
  const esLocal = /^(localhost|127\.|\[::1\])/.test(location.hostname) && location.search.indexOf('sw=1') < 0;
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !esLocal) {
    navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).then(() => {
      setTimeout(() => { if (!localStorage.getItem('gym.fotos')) bajarFotos(false); }, 2500);
    }).catch(e => console.warn('Sin modo offline:', e));
  }
  if (st().active) ui.entrenando = true;
  render();
  if (st().active && st().active.finDescanso) { if (st().active.finDescanso > Date.now()) mostrarDescanso(); else { st().active.finDescanso = 0; S.guardar(); } }
  if (vuelta) alVolverDeGoogle(vuelta); else automatico();
})();

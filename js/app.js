/* Pantallas y acciones de la app.
   Cada pantalla es una función que devuelve { cab, html, pie, tabs }: el encabezado y el pie quedan
   fijos y solo el contenido de en medio se desliza. Los botones llevan data-a="accion" y se atienden
   en el objeto "acciones" al final. */
(function () {
  const G = window.GYM, S = G.Store, Gen = G.Gen, D = G.Drive, A = G.Audio, P = G.Prog;
  const $ = s => document.querySelector(s);
  const app = $('#app'), cab = $('#cab'), vista = $('#vista'), pie = $('#pie'), tabs = $('#tabs'), hoja = $('#hoja'), toastEl = $('#toast');
  const DIAS = Gen.DIAS, LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const CACHE_FOTOS = 'gym-img-v1';
  const st = () => S.state;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // ui.ej = { dia, i, editar } cuando se está viendo un ejercicio.
  const ui = { tab: 'hoy', dia: null, verDia: null, mes: null, enc: null, plan: null, ej: null, pick: null, alConfirmar: null, grupo: '', pop: null, pg: { modo: 'sem', met: 'ent' }, pe: null };

  // ---------- Utilidades ----------
  function reloj(seg) { seg = Math.max(0, Math.round(seg)); return String(Math.floor(seg / 60)).padStart(2, '0') + ':' + String(seg % 60).padStart(2, '0'); }
  function unidad() { return st().settings.unidad === 'kg' ? 'kg' : 'lb'; }
  // Cada ejercicio puede ir en libras o kilos; si no se ha elegido, usa la unidad de Ajustes.
  function uni(it) { return it && (it.u === 'kg' || it.u === 'lb') ? it.u : unidad(); }
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
  // "4 series, 10 repeticiones, 50 lb" (como resumen de un ejercicio de la rutina)
  function resumenItem(it) {
    const se = it.series || [], n = se.filter(x => x.tipo !== 'c').length || se.length;
    if (!se.length) return 'Sin series';
    if (porTiempo(se[0].reps)) return (se.length > 1 ? se.length + ' × ' : '') + se[0].reps;
    const reps = se.map(x => x.reps).filter(Boolean), pesos = se.map(x => x.peso).filter(Boolean);
    const igual = a => a.every(x => x === a[0]);
    let t = n + (n === 1 ? ' serie' : ' series');
    if (reps.length) t += ', ' + (igual(reps) ? reps[0] : Math.min.apply(null, reps.map(Number)) + ' a ' + Math.max.apply(null, reps.map(Number))) + ' repeticiones';
    if (pesos.length) t += ', ' + (igual(pesos) ? pesos[0] : 'hasta ' + Math.max.apply(null, pesos.map(Number))) + ' ' + uni(it);
    return t;
  }
  let toastT = null;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 3200);
  }
  function abrir(html) { hoja.innerHTML = '<div class="hoja" role="dialog" aria-modal="true">' + html + '</div>'; hoja.hidden = false; }
  function cerrar() { hoja.hidden = true; hoja.innerHTML = ''; ui.pick = null; ui.alConfirmar = null; if (ui.ia && !ui.ia.cargando) ui.ia = null; }
  function cabHoja(titulo, sub) {
    return '<div class="hoja-cab"><div><h2>' + esc(titulo) + '</h2>' + (sub ? '<p class="tenue chico">' + esc(sub) + '</p>' : '') + '</div><button class="cerrar" data-a="cerrar" aria-label="Cerrar">✕</button></div>';
  }
  function confirmar(titulo, texto, boton, fn, peligro) {
    abrir(cabHoja(titulo) + '<p class="tenue">' + esc(texto) + '</p><div class="pila" style="margin-top:18px"><button class="btn ' + (peligro ? 'peligro' : 'primario') + '" data-a="confirmar">' + esc(boton) + '</button><button class="btn" data-a="cerrar">Cancelar</button></div>');
    ui.alConfirmar = fn;
  }

  // ---------- Dibujo general ----------
  function pantalla() {
    const s = st();
    if (ui.enc) return vEncuesta();
    if (ui.plan) return vPlan();
    if (!s.profile || !s.routine) return vBienvenida();
    if (ui.ej) return vEjercicio();
    return ({ hoy: vHoy, rutina: ui.dia ? vDia : vRutina, cal: vCalendario, prog: vProgreso, ajustes: vAjustes })[ui.tab]();
  }
  // Al cambiar de pantalla, el contenido entra con un movimiento corto: 'der', 'izq', 'arr', 'aba' o 'fade'.
  const ANIMS = ['a-der', 'a-izq', 'a-arr', 'a-aba', 'a-fade', 'a-tder', 'a-tizq', 'a-cab'];
  const quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animar(el, tipo) { ANIMS.forEach(c => el.classList.remove(c)); void el.offsetWidth; el.classList.add('a-' + tipo); }
  // Copia de la pantalla que se va: se queda un instante debajo de la nueva para que el cambio no sea un corte.
  function fantasma(tipo, y) {
    if (quieto) return;
    app.querySelectorAll('.fantasma').forEach(n => n.remove());
    const f = vista.cloneNode(true);
    f.removeAttribute('id'); f.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    f.className = 'fantasma f-' + tipo + (vista.classList.contains('sin-cab') ? ' sin-cab' : ''); f.setAttribute('aria-hidden', 'true');
    f.style.top = vista.offsetTop + 'px'; f.style.height = vista.offsetHeight + 'px';
    vista.after(f); f.scrollTop = y;
    setTimeout(() => f.remove(), 420);
  }
  // Vibración corta del teléfono (solo en la app instalada).
  function toque(tipo) {
    try {
      const H = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics; if (!H) return;
      if (tipo === 'listo') H.notification({ type: 'SUCCESS' }); else if (tipo === 'sel') H.selectionChanged(); else H.impact({ style: tipo === 'fuerte' ? 'MEDIUM' : 'LIGHT' });
    } catch (e) { /* sin vibración */ }
  }
  function render(conservar, anim) {
    const y = vista.scrollTop, p = pantalla();
    if (!conservar && /^(der|izq|arr|aba)$/.test(anim || '')) fantasma(anim, y);
    cab.innerHTML = p.cab || ''; cab.hidden = !p.cab;
    vista.innerHTML = p.html;
    pie.innerHTML = p.pie || ''; pie.hidden = !p.pie;
    tabs.hidden = !p.tabs;
    app.classList.toggle('con-tabs', !!p.tabs); app.classList.toggle('con-pie', !!p.pie);
    vista.classList.toggle('sin-cab', !p.cab);
    if (p.tabs) dibujarTabs();
    vista.scrollTop = conservar ? y : 0;
    if (!conservar) { animar(vista, anim || 'fade'); if (p.cab) animar(cab, 'cab'); if (p.pie) animar(pie, 'fade'); }
    ui.pop = null;
    if (p.tabs && ui.tab === 'ajustes') contarFotos();
    if (ui.ej) { prepararRueda(); pintarTimer(); }
  }
  const ICONOS = {
    hoy: '<path d="M3 9v6M6.5 6.5v11M17.5 6.5v11M21 9v6M6.5 12h11"/>',
    rutina: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    prog: '<path d="M4 19h16M7 15v-4M12 15V6M17 15v-7"/>',
    ajustes: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'
  };
  const TABS = [['hoy', 'Hoy'], ['rutina', 'Rutina'], ['cal', 'Calendario'], ['prog', 'Progreso'], ['ajustes', 'Ajustes']];
  const posTab = v => TABS.findIndex(t => t[0] === v);
  // Las pestañas se dibujan una sola vez; después solo se mueve la pastilla que marca la que está abierta.
  function dibujarTabs() {
    if (!tabs.firstChild) tabs.innerHTML = '<i class="ind"></i>' + TABS.map(t => '<button data-a="tab" data-v="' + t[0] + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONOS[t[0]] + '</svg>' + t[1] + '</button>').join('');
    const i = posTab(ui.tab);
    tabs.querySelectorAll('button').forEach((b, k) => { if (k === i) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    tabs.querySelector('.ind').style.transform = 'translateX(' + (i * 100) + '%)';
  }

  // ---------- Bienvenida ----------
  function vBienvenida() {
    return {
      html: '<section class="bienvenida"><div class="disco" aria-hidden="true"></div><h1>Tu rutina, hecha a tu medida</h1>' +
        '<p>Contesta unas preguntas y armo tu semana de gym, o sáltalas y arma tu rutina a tu gusto. Todo se puede cambiar después.</p></section>',
      pie: '<div class="pila"><button class="btn primario" data-a="encuesta">Empezar la encuesta</button>' +
        '<button class="btn" data-a="manual">Armar mi rutina yo mismo</button>' +
        '<button class="liga centro" data-a="recuperar">Ya tengo datos en Google Drive</button></div>'
    };
  }
  function rutinaVacia() {
    const dias = {};
    for (let d = 1; d <= 7; d++) dias[d] = { nombre: 'Descanso', items: [] };
    return { updatedAt: Date.now(), dias };
  }

  // ---------- Encuesta ----------
  const PREG = [
    { k: 'nombre', t: '¿Cómo te llamas?', sub: 'Así se va a llamar tu carpeta en Google Drive.', tipo: 'texto' },
    { k: 'objetivo', t: '¿Qué quieres lograr?', tipo: 'uno', ops: [['musculo', 'Ganar músculo', 'Subir masa muscular'], ['grasa', 'Bajar grasa', 'Perder peso y definir'], ['fuerza', 'Ganar fuerza', 'Levantar más peso'], ['salud', 'Salud y condición', 'Moverte mejor y sentirte bien']] },
    { k: 'nivel', t: '¿Cuánta experiencia tienes con pesas?', tipo: 'uno', ops: [['principiante', 'Voy empezando', 'Menos de 6 meses'], ['intermedio', 'Intermedio', 'De 6 meses a 2 años entrenando seguido'], ['avanzado', 'Avanzado', 'Más de 2 años entrenando seguido'], ['regreso', 'Regreso después de una pausa', 'Ya entrenaba, pero llevo meses sin ir']] },
    { k: 'dias', t: '¿Qué días puedes entrenar?', sub: 'Marca todos los que tengas libres. Yo elijo los mejores para tu objetivo.', tipo: 'dias' },
    { k: 'minutos', t: '¿Cuánto tiempo tienes por sesión?', sub: 'Contando el calentamiento.', tipo: 'uno', ops: [[30, '30 minutos'], [45, '45 minutos'], [60, '1 hora'], [75, '1 hora y cuarto'], [90, 'Hora y media o más']] },
    { k: 'equipo', t: '¿Dónde vas a entrenar?', tipo: 'uno', ops: [['completo', 'Gimnasio completo', 'Barras, mancuernas, máquinas y poleas'], ['basico', 'Gimnasio básico', 'Mancuernas y algunas máquinas'], ['casa', 'En casa con mancuernas', ''], ['nada', 'Sin equipo', 'Solo con el peso del cuerpo']] },
    { k: 'cardio', t: '¿Quieres incluir cardio?', sub: 'Puedes combinarlo con cualquier objetivo.', tipo: 'uno', ops: [['auto', 'Lo que convenga a mi objetivo', ''], ['final', 'Sí, al final de cada sesión', '10 a 15 minutos después de las pesas'], ['dias', 'Sí, en días aparte', 'Uno o dos días solo de cardio'], ['no', 'No, solo pesas', '']] },
    { k: 'cardioTipo', t: '¿Qué cardio prefieres?', tipo: 'uno', si: r => r.cardio !== 'no', ops: [['cualquiera', 'Me da igual', ''], ['trote', 'Trotar', ''], ['caminata', 'Caminar', ''], ['bici', 'Bicicleta', ''], ['eliptica', 'Elíptica', '']] },
    { k: 'molestias', t: '¿Tienes alguna molestia que deba cuidar?', sub: 'Dejo fuera los ejercicios que más cargan esa zona. Si no tienes ninguna, sigue adelante.', tipo: 'varios', ops: [['rodillas', 'Rodillas'], ['hombros', 'Hombros'], ['espalda', 'Espalda baja']] },
    { k: 'zonas', t: '¿Qué zonas quieres trabajar más?', sub: 'Opcional. Les doy un poco más de trabajo.', tipo: 'varios', ops: [['pecho', 'Pecho'], ['espalda', 'Espalda'], ['hombros', 'Hombros'], ['brazos', 'Brazos'], ['piernas', 'Piernas'], ['gluteos', 'Glúteos'], ['abdomen', 'Abdomen']] },
    { k: 'cuerpo', t: 'Unos datos más', sub: 'Opcionales. Sirven para ajustar el cardio y los descansos.', tipo: 'cuerpo' }
  ];
  function aplica(i) { const p = PREG[i]; return !p.si || p.si(ui.enc.r); }
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
    const visibles = PREG.map((x, n) => n).filter(aplica), pos = visibles.indexOf(i) + 1;
    return {
      cab: '<div class="enc-cab"><button class="liga" data-a="enc-atras">Atrás</button><div class="avance"><i style="width:' + Math.round(100 * pos / visibles.length) + '%"></i></div><span class="chico tenue">' + pos + ' de ' + visibles.length + '</span></div>',
      html: '<section class="enc"><h1>' + p.t + '</h1>' + (p.sub ? '<p class="sub">' + p.sub + '</p>' : '<div style="height:14px"></div>') + cuerpo + '</section>',
      pie: siguiente ? '<button class="btn primario" data-a="enc-sig">' + (i === PREG.length - 1 ? 'Ver mi plan' : 'Siguiente') + '</button>' : ''
    };
  }
  function encAvanza() {
    let i = ui.enc.i + 1;
    while (i < PREG.length && !aplica(i)) i++;
    if (i < PREG.length) { ui.enc.i = i; render(false, 'der'); return; }
    const r = ui.enc.r;
    ui.plan = { r, ops: Gen.opciones(r), sel: 0 }; ui.enc = null; render(false, 'der');
  }

  // ---------- Opciones de plan ----------
  function vPlan() {
    const p = ui.plan;
    return {
      cab: '<div class="enc-cab"><button class="liga" data-a="plan-atras">Cambiar respuestas</button></div>',
      html: '<section class="enc"><h1>Tu plan, ' + esc(p.r.nombre) + '</h1><p class="sub">Para ' + Gen.OBJ[p.r.objetivo] + '. Elige la opción que mejor te acomode; después puedes cambiar lo que quieras.</p>' +
        p.ops.map((o, i) => '<button class="plan" data-a="plan-sel" data-v="' + i + '" aria-pressed="' + (i === p.sel) + '"><span class="etq">' + o.etiqueta + '</span><h2>' + o.titulo + '</h2><ul>' +
          o.detalle.map(d => '<li>' + esc(d) + '</li>').join('') + '</ul><div class="medidor"><span>Frente al plan ideal</span><div class="avance"><i style="width:' + o.pct + '%"></i></div><b>' + o.cerca + '</b></div></button>').join('') +
        '<p class="aviso" style="margin-top:16px">Si tienes una lesión o dolor, consulta a un médico o fisioterapeuta antes de empezar.</p></section>',
      pie: '<button class="btn primario" data-a="plan-crear">Crear mi rutina</button>'
    };
  }

  // ---------- Sesión de entrenamiento ----------
  // No hay un orden obligatorio: cualquier serie de cualquier ejercicio se puede marcar cuando sea.
  function sesion(crear, dia) {
    const s = st();
    if (!s.active && crear) {
      const d = s.routine.dias[dia];
      s.active = { fecha: S.hoy(), dia, nombre: d.items.length ? d.nombre : 'Entrenamiento', inicio: Date.now(), hechos: {} };
      A.preparar(); A.permiso(); A.pantalla(true); S.guardar();
    }
    return s.active;
  }
  function hecho(uid, i) { const a = st().active; return !!(a && a.hechos[uid] && a.hechos[uid][i]); }
  function avance() {
    const a = st().active; let n = 0;
    if (a) Object.keys(a.hechos).forEach(u => a.hechos[u].forEach(x => { if (x) n++; }));
    return n;
  }
  function terminar() {
    const s = st(), a = s.active;
    if (!a) return;
    const items = [];
    Object.keys(s.routine.dias).forEach(d => s.routine.dias[d].items.forEach(it => {
      const h = a.hechos[it.uid] || [], sets = it.series.filter((x, i) => h[i]).map(x => ({ kg: x.peso || '', reps: x.reps || '', tipo: x.tipo }));
      if (sets.length) items.push({ ex: it.ex, nombre: S.ejercicio(it.ex).nombre, u: uni(it), sets });
    }));
    pararTimer(true); A.pantalla(false);
    s.active = null;
    if (!items.length) { S.guardar(); render(); toast('No marcaste ninguna serie'); return; }
    const min = Math.max(1, Math.round((Date.now() - a.inicio) / 60000)), prev = registro(a.fecha);
    s.logs[a.fecha] = { fecha: a.fecha, nombre: a.nombre, u: unidad(), min: (prev ? prev.min || 0 : 0) + min, items: (prev ? prev.items || [] : []).concat(items), updatedAt: Date.now() };
    S.tocar('logs'); ui.ej = null; ui.tab = 'hoy'; ui.verDia = null; render();
    const n = items.reduce((t, it) => t + it.sets.length, 0);
    abrir(cabHoja('Entrenamiento guardado') + '<div class="resumen"><div><b>' + n + '</b><span>series</span></div><div><b>' + min + '</b><span>minutos</span></div><div><b>' + items.length + '</b><span>ejercicios</span></div></div><p class="tenue">Ya quedó marcado en tu calendario.</p><div style="margin-top:18px"><button class="btn primario" data-a="cerrar">Listo</button></div>');
    sincronizar(false);
  }

  // ---------- Descanso (va en la misma pantalla del ejercicio) ----------
  let tickT = null;
  function corriendo() { return st().timer.fin > 0; }
  function iniciarTimer(seg, texto) {
    const t = st().timer;
    t.total = seg; t.fin = Date.now() + seg * 1000; S.guardar();
    A.programar(seg, texto);
    if (!tickT) tickT = setInterval(tick, 200);
    pintarTimer();
  }
  function pararTimer(silencio) {
    const t = st().timer;
    clearInterval(tickT); tickT = null;
    t.fin = 0; S.guardar();
    if (silencio) A.cancelar();
    pintarTimer();
  }
  function tick() {
    const t = st().timer;
    if (!t.fin) { clearInterval(tickT); tickT = null; return; }
    const ms = t.fin - Date.now();
    if (ms > 0) { pintarTimer(); return; }
    // En la app nativa, si acabó hace rato, la notificación ya sonó: no repetir el pitido.
    const yaAviso = A.nativo && -ms > 2500;
    clearInterval(tickT); tickT = null; t.fin = 0; S.guardar();
    if (yaAviso) A.cancelar();
    else if (!A.sonoATiempo()) A.ahora();
    else { A.quitarAviso(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
    pintarTimer();
    const fila = $('#t-fila');
    if (fila) { fila.classList.add('listo'); setTimeout(() => { const f = $('#t-fila'); if (f) f.classList.remove('listo'); }, 1800); }
    else toast('Descanso terminado');
  }
  // Actualiza solo el reloj y su botón, sin redibujar la pantalla (para no cerrar el teclado).
  function pintarTimer() {
    const r = $('#t-reloj'), b = $('#t-btn'), it = itemActual();
    if (!r || !it) return;
    const t = st().timer, on = t.fin > 0;
    r.textContent = reloj(on ? Math.ceil((t.fin - Date.now()) / 1000) : it.rest);
    r.classList.toggle('on', on);
    if (!b) return;
    b.textContent = on ? 'Parar' : 'Iniciar';
    b.classList.toggle('parar', on);
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
  function filaItem(it, accion, i) {
    const e = S.ejercicio(it.ex), h = (st().active && st().active.hechos[it.uid]) || [], n = h.filter(Boolean).length;
    return '<button class="fila-in" data-a="' + accion + '" data-v="' + i + '">' + miniFoto(e) + '<span class="cuerpo"><b>' + esc(e.nombre) + '</b><span>' + esc(resumenItem(it)) + '</span></span>' +
      (n ? '<span class="hechas' + (n >= it.series.length ? ' todas' : '') + '">' + n + '/' + it.series.length + '</span>' : '') + '</button>';
  }
  function vHoy() {
    const s = st(), hoyN = S.diaSemana(), ver = ui.verDia || hoyN, dia = s.routine.dias[ver], a = s.active;
    const fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    let h = '<div class="semana">' + LETRAS.map((l, i) => {
      const d = i + 1, listo = registro(fechaDeSemana(d)), plan = s.routine.dias[d].items.length > 0;
      return '<button data-a="hoy-dia" data-v="' + d + '" class="' + (d === ver ? 'sel ' : '') + (d === hoyN ? 'hoy' : '') + '" aria-label="' + DIAS[i] + '"><span>' + l + '</span><span class="marca ' + (listo ? 'hecho' : plan ? 'toca' : '') + '"></span></button>';
    }).join('') + '</div>';
    if (dia.items.length) {
      h += '<div class="lista-cab"><div><h2>Ejercicios</h2><p class="tenue chico">' + dia.items.length + ' ejercicios, unos ' + Gen.minutosDia(dia.items) + ' min' + (a ? ', ' + avance() + ' series hechas' : '') + '</p></div>' +
        (a ? '<button class="pildora parar" data-a="ent-terminar">Terminar</button>' : '<button class="pildora" data-a="ent-empezar" data-v="' + ver + '">Iniciar</button>') + '</div>';
      h += '<div class="tarjeta lista-ej">' + dia.items.map((it, i) => '<div class="fila">' + filaItem(it, 'ej-abrir', i) + '</div>').join('') + '</div>';
      if (ver === hoyN && registro(S.hoy()) && !a) h += '<p class="tenue chico" style="margin-top:12px">Ya registraste un entrenamiento hoy.</p>';
    } else {
      h += '<p class="vacio">' + (ver === hoyN ? 'Hoy toca descansar. El descanso también es parte del plan.' : 'Día de descanso.') + ' Toca otro día de la semana para verlo o adelantarlo.</p>' +
        (a ? '<button class="btn" data-a="ent-terminar">Terminar el entrenamiento en curso</button>' : '');
    }
    return {
      cab: '<div class="cab-fila"><div><p class="fecha">' + (ver === hoyN ? esc(fecha.charAt(0).toUpperCase() + fecha.slice(1)) : DIAS[ver - 1]) + '</p><h1>' + esc(dia.items.length ? dia.nombre : 'Descanso') + '</h1></div>' +
        '<button class="pildora gris" data-a="hoy-editar" data-v="' + ver + '">Editar</button></div>',
      html: h + '<p class="estado-sync">' + estadoSync() + '</p>', tabs: true
    };
  }

  // ---------- Un ejercicio: series, descanso, notas ----------
  function itemActual() { return ui.ej && st().routine ? st().routine.dias[ui.ej.dia].items[ui.ej.i] : null; }
  function copiaItem() { const it = itemActual(), a = st().active; return JSON.stringify({ it, h: a && a.hechos[it.uid] ? a.hechos[it.uid] : null }); }
  function finEdicion() { const sale = ui.ej.salir; if (sale) ui.ej = null; else { ui.ej.editar = false; ui.ej.rueda = false; ui.ej.copia = null; } render(false, sale ? 'izq' : 'fade'); }
  function numeroSerie(se, i) { let n = 0; for (let k = 0; k <= i; k++) if (se[k].tipo !== 'c') n++; return n; }
  function vEjercicio() {
    const x = ui.ej, dia = st().routine.dias[x.dia], it = dia.items[x.i];
    if (!it) { ui.ej = null; return pantalla(); }
    const e = S.ejercicio(it.ex), ed = x.editar, cardio = e.tipo === 'k', a = st().active;
    let h = '<section class="ej' + (ed ? ' editando' : '') + '"><div class="ej-img">' + fotoGrande(e) + G.Musculos.figura(e) + '</div>' +
      '<div class="ej-titulo"><h1>' + esc(e.nombre) + '</h1><button class="info" data-a="ej-info" aria-label="Cómo se hace">i</button></div>';
    h += '<h2 class="sub-t">Series</h2><div class="tarjeta' + (cardio ? ' sin-peso' : '') + '"><div class="st-cab"><span></span><span>' + (cardio ? 'Tiempo' : 'Repeticiones') + '</span>' + (cardio ? '<span></span>' : '<button class="st-uni" data-a="ej-unidad" aria-label="Cambiar entre libras y kilos">Peso (<b>' + uni(it) + '</b>)</button>') + (ed ? '<span></span>' : '') + '</div>';
    h += it.series.map((se, i) => {
      const ok = hecho(it.uid, i), texto = !/^\d*$/.test(se.reps || '');
      return '<div class="st-fila' + (ok && !ed ? ' hecha' : '') + (se.tipo === 'c' ? ' cal' : '') + '" data-fila="' + i + '"><span class="st-izq">' +
        (ed ? '<button class="menos" data-a="se-quitar" data-v="' + i + '" aria-label="Quitar serie">−</button>' : '') +
        '<button class="circ' + (se.tipo === 'c' ? ' cal' : '') + (ok && !ed ? ' ok' : '') + (ui.pop === i ? ' pop' : '') + '" data-a="se-circ" data-v="' + i + '" aria-label="' + (ed ? 'Cambiar tipo de serie' : 'Marcar serie') + '">' + (se.tipo === 'c' ? 'C' : numeroSerie(it.series, i)) + '</button></span>' +
        '<input class="num' + (texto && String(se.reps).length > 7 ? ' txt' : '') + '" data-c="se-reps" data-v="' + i + '" value="' + esc(se.reps) + '" ' + (texto ? '' : 'inputmode="none" data-tec="1"') + ' aria-label="Repeticiones">' +
        (cardio ? '<span></span>' : '<input class="num" data-c="se-peso" data-v="' + i + '" value="' + esc(se.peso) + '" inputmode="none" data-tec="1" placeholder="–" aria-label="Peso">') +
        (ed ? '<button class="asa" data-arr="serie" aria-label="Mantén y arrastra para cambiar el orden"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14M5 12h14M5 16h14"/></svg></button>' : '') + '</div>';
    }).join('');
    if (ed) h += '<button class="st-agregar" data-a="se-agregar"><span>+</span>Agregar nueva serie</button>' +
      '<p class="tenue chico st-nota">Toca el círculo para marcar una serie como calentamiento (C). Arrastra las rayitas para cambiar el orden.</p>';
    h += '<div class="st-desc" id="t-fila"><span>Descanso</span><button class="t-reloj' + (x.rueda ? ' abierta' : '') + '" id="t-reloj" data-a="t-rueda" aria-label="Cambiar el tiempo de descanso">' + reloj(it.rest) + '</button>' +
      (ed ? '<span class="t-hueco"></span><span></span>' : '<button class="pildora suave" id="t-btn" data-a="t-toggle">Iniciar</button>') + '</div>' + (x.rueda ? rueda(it.rest) : '') + '</div>';
    if (!ed && !cardio) h += filaSugerencia(it, e);
    h += '<h2 class="sub-t">Notas</h2><textarea class="notas" data-c="ej-nota" maxlength="300" placeholder="Por ejemplo: asiento en la posición 4, 2 repeticiones de reserva">' + esc(it.nota || '') + '</textarea>';
    const ico = d => '<span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg></span>';
    if (ed) h += '<button class="fila-liga" data-a="it-cambiar">' + ico('<path d="M7 9h11l-3-3M17 15H6l3 3"/>') + '<span>Reemplazar ejercicio</span></button>' +
      '<button class="fila-liga" data-a="ej-editar" data-id="' + esc(it.ex) + '">' + ico('<path d="M5 19l1-4L16 5l3 3L9 18z"/>') + '<span>Cambiar nombre, tips o imagen</span></button>' +
      '<button class="quitar-ej" data-a="it-quitar">Quitar ejercicio de este día</button>';
    else h += '<button class="fila-liga" data-a="ej-progreso">' + ico('<path d="M5 16l4-4 3 3 6-7M14 8h4v4"/>') + '<span>Progreso del ejercicio</span><span class="chev">›</span></button>' +
      '<button class="fila-liga" data-a="it-cambiar">' + ico('<path d="M7 9h11l-3-3M17 15H6l3 3"/>') + '<span>Reemplazar por otro ejercicio</span><span class="chev">›</span></button>';
    h += '</section>';
    const cuenta = '<span class="cuenta">' + (x.i + 1) + ' de ' + dia.items.length + '</span>';
    return {
      cab: ed ? '<div class="ej-cab ed"><button class="pildora gris" data-a="ej-cancelar">Cancelar</button>' + cuenta + '<button class="pildora" data-a="ej-guardar-ed">Guardar</button></div>'
        : '<div class="ej-cab"><button class="redondo" data-a="ej-volver" aria-label="Volver"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>' + cuenta +
          '<span class="flechas"><button data-a="ej-mover" data-v="-1" aria-label="Ejercicio anterior"' + (x.i === 0 ? ' disabled' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button><button data-a="ej-mover" data-v="1" aria-label="Ejercicio siguiente"' + (x.i === dia.items.length - 1 ? ' disabled' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button></span>' +
          '<button class="redondo" data-a="ej-menu" aria-label="Más opciones"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></button></div>',
      html: h,
      pie: ed ? '' : (a ? '<button class="flota gris" data-a="ent-terminar">Terminar entrenamiento</button>' : '<button class="flota" data-a="ent-empezar" data-v="' + x.dia + '">Comienza a entrenar</button>')
    };
  }

  // Peso sugerido: sale de la última vez que se hizo el ejercicio. Solo aparece si cambia algo.
  function filaSugerencia(it, e) {
    const normales = it.series.filter(x => x.tipo !== 'c'), vacias = normales.some(x => !x.peso), sg = P.sugerir(it, uni(it));
    if (!sg) return vacias && e.equipo !== 'cuerpo' ? '<p class="st-sug solo"><span>Sin historial de este ejercicio. Empieza con un peso que te deje 2 repeticiones de sobra.</span></p>' : '';
    if (!vacias && !normales.some(x => P.num(x.peso) < P.num(sg.peso))) return '';
    const cuando = P.corta(sg.fecha), antes = sg.antes + ' ' + sg.uAntes + ' × ' + sg.reps;
    return '<p class="st-sug"><span><b>Peso sugerido: ' + esc(sg.peso) + ' ' + uni(it) + '</b>' + (sg.subir ? 'Completaste ' + esc(antes) + ' el ' + cuando + '. Toca subir.' : 'El ' + cuando + ' hiciste ' + esc(antes) + '.') + '</span><button class="pildora suave" data-a="sug-usar" data-v="' + esc(sg.peso) + '">Usar</button></p>';
  }

  // ---------- Ruedita para el tiempo de descanso (máximo 5 minutos) ----------
  const PASO_R = 38, MAX_DESC = 300;
  function rueda(seg) {
    const col = (k, vals) => '<div class="rueda-col" data-k="' + k + '"><i></i>' + vals.map(v => '<button data-a="rueda-ir" data-v="' + v + '">' + String(v).padStart(2, '0') + '</button>').join('') + '<i></i></div>';
    const mins = [0, 1, 2, 3, 4, 5], segs = []; for (let i = 0; i < 60; i += 5) segs.push(i);
    return '<div class="rueda" id="rueda" data-m="' + Math.floor(seg / 60) + '" data-s="' + Math.round((seg % 60) / 5) + '"><div class="rueda-banda"></div>' + col('m', mins) + '<span class="rueda-pts">:</span>' + col('s', segs) + '</div>';
  }
  let ruedaT = null;
  function prepararRueda() {
    const r = $('#rueda'); if (!r) return;
    r.querySelectorAll('.rueda-col').forEach(c => {
      c.scrollTop = (+r.dataset[c.dataset.k]) * PASO_R;
      c.addEventListener('scroll', () => { clearTimeout(ruedaT); ruedaT = setTimeout(leerRueda, 90); }, { passive: true });
    });
    marcarRueda();
  }
  function marcarRueda() {
    document.querySelectorAll('#rueda .rueda-col').forEach(c => { const i = Math.round(c.scrollTop / PASO_R); c.querySelectorAll('button').forEach((b, k) => b.classList.toggle('sel', k === i)); });
  }
  function leerRueda() {
    const it = itemActual(), cm = $('#rueda [data-k="m"]'), cs = $('#rueda [data-k="s"]');
    if (!it || !cm || !cs) return;
    const m = Math.max(0, Math.min(5, Math.round(cm.scrollTop / PASO_R)));
    let s = Math.max(0, Math.min(11, Math.round(cs.scrollTop / PASO_R))) * 5;
    if (m === 5 && s > 0) { s = 0; cs.scrollTo({ top: 0, behavior: 'smooth' }); }
    marcarRueda();
    const seg = Math.min(MAX_DESC, m * 60 + s);
    if (seg === it.rest) return;
    it.rest = seg; S.tocar('routine');
    // Si el descanso ya va corriendo, sigue con el tiempo nuevo.
    if (corriendo()) { if (seg > 0) iniciarTimer(seg, 'Sigue: ' + S.ejercicio(it.ex).nombre); else pararTimer(true); }
    pintarTimer();
  }

  // ---------- Rutina ----------
  function vRutina() {
    const dias = st().routine.dias;
    return {
      cab: '<div class="cab-fila"><div><h1>Tu semana</h1><p class="tenue chico">Toca un día para armarlo o cambiarlo.</p></div>' + botonIA('semana') + '</div>',
      html: '<div class="lista">' + DIAS.map((n, i) => { const d = dias[i + 1]; return '<button class="fila" data-a="rut-dia" data-v="' + (i + 1) + '"><span class="cuerpo"><b>' + n + '</b><span>' + esc(d.items.length ? d.nombre : 'Descanso') + '</span></span><span class="der">' + (d.items.length ? d.items.length + (d.items.length === 1 ? ' ejercicio, ' : ' ejercicios, ') + Gen.minutosDia(d.items) + ' min' : '') + '</span></button>'; }).join('') + '</div>',
      tabs: true
    };
  }
  function vDia() {
    const d = st().routine.dias[ui.dia];
    let h = '<label class="campo" style="margin-top:0"><span>Nombre de la sesión</span><input data-c="dia-nombre" maxlength="50" value="' + esc(d.items.length ? d.nombre : '') + '" placeholder="Descanso"></label>';
    if (d.items.length) {
      h += '<p class="tenue chico" style="margin:12px 0 6px">' + d.items.length + ' ejercicios, unos ' + Gen.minutosDia(d.items) + ' min. Toca uno para cambiar sus series; arrastra las rayitas para ordenarlos.</p><div class="tarjeta lista-ej">' +
        d.items.map((it, i) => '<div class="fila" data-fila="' + i + '">' + filaItem(it, 'ej-abrir-ed', i) + '<button class="asa" data-arr="ej" aria-label="Mantén y arrastra para cambiar el orden"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14M5 12h14M5 16h14"/></svg></button>' + '</div>').join('') + '</div>';
    } else h += '<p class="vacio">Este día es de descanso. Agrega un ejercicio para convertirlo en día de entrenamiento.</p>';
    h += '<div class="pila" style="margin-top:16px"><button class="btn" data-a="rut-cambiar">Intercambiar con otro día</button>' + (d.items.length ? '<button class="btn peligro" data-a="rut-descanso">Dejar como día de descanso</button>' : '') + '</div>';
    return {
      cab: '<button class="liga volver" data-a="rut-volver">‹ Tu semana</button><div class="cab-fila"><h1>' + DIAS[ui.dia - 1] + '</h1>' + botonIA('dia') + '</div>',
      html: h, pie: '<button class="btn primario" data-a="it-agregar">Agregar ejercicio</button>', tabs: true
    };
  }

  // ---------- Rutina con IA ----------
  const IA = G.IA;
  const ESTRELLA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.6 4.9 3.1 7.4 8 8-4.9.6-7.4 3.1-8 8-.6-4.9-3.1-7.4-8-8 4.9-.6 7.4-3.1 8-8z"/><path class="chica" d="M19 15.5c.25 2 1.25 3 3.25 3.25-2 .25-3 1.25-3.25 3.25-.25-2-1.25-3-3.25-3.25 2-.25 3-1.25 3.25-3.25z"/></svg>';
  function botonIA(alcance) { return '<button class="ia-btn" data-a="ia-abrir" data-v="' + alcance + '" aria-label="Armar con inteligencia artificial">' + ESTRELLA + '</button>'; }
  function hojaIAConfig() {
    const c = IA.config(), p = c.proveedor;
    abrir(cabHoja('Ajustes de IA', 'La clave se guarda solo en este teléfono') +
      '<div class="seg ancho" role="group">' + Object.keys(IA.PROVEEDORES).map(k => '<button data-a="ia-prov" data-v="' + k + '" aria-pressed="' + (k === p) + '">' + IA.PROVEEDORES[k].nombre.split(' ')[0] + (IA.PROVEEDORES[k].gratis ? ' · gratis' : '') + '</button>').join('') + '</div>' +
      '<p class="tenue chico" style="margin-top:12px">' + (p === 'gemini'
        ? 'Gemini tiene un nivel gratis: entras con tu cuenta de Google a Google AI Studio, creas una clave y la pegas aquí. No pide tarjeta. En el nivel gratis, Google puede usar lo que le mandas para mejorar sus productos.'
        : 'Claude cobra por uso: cada rutina cuesta unos centavos de dólar de saldo que recargas en la consola de Anthropic. Tu suscripción de Claude no sirve aquí; es una cuenta aparte.') + '</p>' +
      '<p style="margin-top:8px"><a class="liga" href="' + IA.PROVEEDORES[p].clave + '" target="_blank" rel="noopener">Conseguir mi clave de ' + IA.PROVEEDORES[p].nombre.split(' ')[0] + '</a></p>' +
      '<label class="campo"><span>Clave</span><input id="ia-clave" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Pega aquí tu clave" value="' + esc(c.claves[p] || '') + '"></label>' +
      '<div class="pila" style="margin-top:18px"><button class="btn primario" data-a="ia-guardar">Guardar y cargar modelos</button>' +
      (c.claves[p] ? '<button class="btn peligro" data-a="ia-borrar-clave">Borrar la clave</button>' : '') + '</div>');
  }
  function hojaIA() {
    const x = ui.ia, c = IA.config(), p = c.proveedor, mods = c.modelos[p] || [], enc = st().profile && st().profile.encuesta;
    if (x.cargando) { abrir('<div class="ia-cargando"><div class="ia-gira">' + ESTRELLA + '</div><h2>Armando tu rutina…</h2><p class="tenue">Puede tardar de 10 segundos a un minuto, según el esfuerzo.</p></div>'); return; }
    if (x.resultado) {
      const r = x.resultado;
      abrir(cabHoja(x.alcance === 'dia' ? 'Propuesta para el ' + DIAS[x.dia - 1].toLowerCase() : 'Propuesta para tu semana', IA.PROVEEDORES[p].nombre.split(' ')[0] + ' · ' + (mods.find(m => m.id === c.modelo[p]) || { nombre: c.modelo[p] }).nombre) +
        (r.explicacion ? '<p class="ia-expl">' + esc(r.explicacion) + '</p>' : '') +
        '<div class="tarjeta lista-ej">' + Object.keys(r.dias).sort().map(d => {
          const y = r.dias[d];
          return '<div class="fila"><span class="cuerpo"><b>' + DIAS[d - 1] + (y.items.length ? ' · ' + esc(y.nombre) : '') + '</b><span>' +
            (y.items.length ? esc(y.items.map(it => S.ejercicio(it.ex).nombre + ' ' + it.series.length + '×' + it.series[it.series.length - 1].reps).join(', ')) : 'Descanso') + '</span></span></div>';
        }).join('') + '</div>' +
        (r.quitados.length ? '<p class="tenue chico" style="margin-top:10px">Quité ' + r.quitados.length + ' ejercicio(s) que la IA propuso y que no están en la app o no van con tus molestias.</p>' : '') +
        '<div class="pila" style="margin-top:18px"><button class="btn primario" data-a="ia-usar">Usar esta rutina</button><button class="btn" data-a="ia-otra">Pedir otra versión</button></div>');
      return;
    }
    abrir(cabHoja(x.alcance === 'dia' ? 'Armar el ' + DIAS[x.dia - 1].toLowerCase() + ' con IA' : 'Armar tu semana con IA', 'La IA elige solo entre los ejercicios de la app') +
      '<label class="campo" style="margin-top:0"><span>¿Qué quieres?</span><textarea id="ia-pedido" maxlength="600" placeholder="Por ejemplo: quiero ganar músculo pero también trotar 2 días; me duele un poco el hombro derecho; tengo 70 minutos.">' + esc(x.pedido || '') + '</textarea></label>' +
      (enc && !enc.manual ? '<label class="interruptor"><span>Usar mis datos de la encuesta<small>Objetivo, nivel, días, tiempo, equipo, molestias, edad y medidas</small></span><input type="checkbox" id="ia-perfil"' + (x.usarPerfil !== false ? ' checked' : '') + '></label>' : '') +
      '<label class="interruptor"><span>Partir de mi rutina actual<small>Para pedir cambios en lugar de una rutina nueva</small></span><input type="checkbox" id="ia-actual"' + (x.actual ? ' checked' : '') + '></label>' +
      '<div class="ia-ajustes"><label class="campo"><span>Modelo</span><select id="ia-modelo">' + (mods.length ? mods.map(m => '<option value="' + esc(m.id) + '"' + (m.id === c.modelo[p] ? ' selected' : '') + '>' + esc(m.nombre) + '</option>').join('') : '<option value="">Cargando modelos…</option>') + '</select></label>' +
      '<div class="campo"><span>Esfuerzo</span><div class="seg ancho">' + Object.keys(IA.ESFUERZO).map(k => '<button data-a="ia-esfuerzo" data-v="' + k + '" aria-pressed="' + (k === c.esfuerzo) + '">' + IA.ESFUERZO[k] + '</button>').join('') + '</div></div></div>' +
      '<p class="tenue chico">Más esfuerzo = piensa más y tarda más' + (p === 'claude' ? ' (y cuesta un poco más)' : '') + '. Usando ' + IA.PROVEEDORES[p].nombre + '. <button class="liga" data-a="ia-config">Cambiar</button></p>' +
      '<div style="margin-top:16px"><button class="btn primario" data-a="ia-generar">' + ESTRELLA.replace('<svg', '<svg class="ico-btn"') + 'Generar rutina</button></div>');
    if (!mods.length) cargarModelos(false);
  }
  async function cargarModelos(avisar) {
    const c = IA.config(), p = c.proveedor;
    try {
      const l = await IA.modelos(p, c.claves[p]);
      const c2 = IA.config(); c2.modelos[p] = l;
      if (!l.some(m => m.id === c2.modelo[p])) c2.modelo[p] = l.length ? l[0].id : '';
      IA.guardar(c2);
      if (ui.ia && !hoja.hidden) hojaIA();
      if (avisar) toast(l.length + ' modelos disponibles');
    } catch (e) {
      toast(e.message === 'sin-internet' ? 'Sin internet' : e.message);
      if (ui.ia && !hoja.hidden && !avisar) hojaIAConfig();
    }
  }
  function leerHojaIA() {
    const x = ui.ia, t = $('#ia-pedido'), pf = $('#ia-perfil'), ac = $('#ia-actual'), m = $('#ia-modelo');
    if (t) x.pedido = t.value.trim();
    if (pf) x.usarPerfil = pf.checked;
    if (ac) x.actual = ac.checked;
    if (m && m.value) { const c = IA.config(); c.modelo[c.proveedor] = m.value; IA.guardar(c); }
  }

  // ---------- Elegir, ver y editar ejercicios ----------
  function listaPick() {
    const q = (($('#pick-q') || {}).value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const l = S.todos().filter(e => (!ui.grupo || e.grupo === ui.grupo) && (!q || e.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(q) >= 0));
    return l.length ? l.map(e => '<button class="fila" data-a="pick-ok" data-id="' + esc(e.id) + '">' + miniFoto(e) + '<span class="cuerpo"><b>' + esc(e.nombre) + '</b><span>' + (G.GRUPOS[e.grupo] || '') + '</span></span></button>').join('') : '<p class="vacio">No hay ejercicios con ese nombre. Puedes crear el tuyo.</p>';
  }
  function recomendados() {
    const it = itemActual(); if (!it) return '';
    const enc = st().profile.encuesta, l = P.alternativas(it, st().routine.dias[ui.ej.dia]);
    if (!l.length) return '';
    return '<h3 class="pick-t">Recomendados</h3><p class="tenue chico">Trabajan lo mismo que ' + esc(S.ejercicio(it.ex).nombre) + '. Las repeticiones se ponen solas según tu objetivo.</p><div class="tarjeta lista-ej recs">' + l.map(x => {
      const e = x.e, m = G.Musculos.texto(e).p.join(', '), n = Gen.nuevoItem(e, enc, ui.ej.i);
      return '<div class="fila"><button class="fila-in" data-a="pick-ok" data-id="' + esc(e.id) + '">' + miniFoto(e) + '<span class="cuerpo"><b>' + esc(e.nombre) + '</b><span>' + esc([m, P.equipo(e)].filter(Boolean).join(' · ')) + (x.conEquipo ? '' : ' · fuera de tu equipo') + '</span></span><span class="hechas">' + n.series.length + ' × ' + esc(n.series[0].reps) + '</span></button></div>';
    }).join('') + '</div><h3 class="pick-t">Todos los ejercicios</h3>';
  }
  function hojaPick(modo) {
    abrir(cabHoja(modo === 'cambiar' ? 'Reemplazar ejercicio' : 'Agregar ejercicio') + (modo === 'cambiar' ? recomendados() : '') +
      '<label class="campo" style="margin-top:0"><input id="pick-q" data-c="pick-q" type="search" placeholder="Buscar ejercicio"></label>' +
      '<div class="chips" style="margin-top:10px"><button class="chip" data-a="pick-g" data-v="" aria-pressed="' + (!ui.grupo) + '">Todos</button>' + Object.keys(G.GRUPOS).filter(g => g !== 'otro').map(g => '<button class="chip" data-a="pick-g" data-v="' + g + '" aria-pressed="' + (ui.grupo === g) + '">' + G.GRUPOS[g] + '</button>').join('') + '</div>' +
      '<div class="lista" id="pick-lista">' + listaPick() + '</div><div style="margin-top:16px"><button class="btn" data-a="ej-nuevo">Crear un ejercicio propio</button></div>');
    ui.pick = { modo };
  }
  function ponerEjercicio(id) {
    const nDia = ui.ej ? ui.ej.dia : ui.dia, d = st().routine.dias[nDia], e = S.ejercicio(id), pick = ui.pick || { modo: 'agregar' };
    if (pick.modo === 'cambiar' && ui.ej) {
      // El ejercicio nuevo llega con sus series y repeticiones según el objetivo; el peso lo pones tú.
      const it = d.items[ui.ej.i], a = st().active;
      if (it && it.ex !== id) {
        const n = Gen.nuevoItem(e, st().profile.encuesta, ui.ej.i);
        if (e.tipo === 'k') { n.series = [{ reps: '15 min', peso: '', tipo: 'n' }]; n.rest = 0; n.nota = ''; }
        it.ex = id; it.series = n.series; it.rest = n.rest; it.nota = n.nota;
        if (a) delete a.hechos[it.uid];
        S.tocar('routine'); cerrar(); render(false, 'fade');
        toast('Listo: ' + e.nombre + ', ' + resumenItem(it));
        return;
      }
    } else {
      if (!d.items.length && (!d.nombre || d.nombre === 'Descanso')) d.nombre = 'Entrenamiento';
      const it = Gen.nuevoItem(e, st().profile.encuesta, d.items.length);
      if (e.tipo === 'k') { it.series = [{ reps: '15 min', peso: '', tipo: 'n' }]; it.rest = 0; it.nota = ''; }
      d.items.push(it);
    }
    S.tocar('routine'); cerrar(); render(true);
  }
  function hojaEjercicio(id) {
    const e = S.ejercicio(id), m = G.Musculos.texto(e);
    abrir(cabHoja(e.nombre, G.GRUPOS[e.grupo] || '') + fotoGrande(e) +
      (m.p.length ? '<div class="musc-info">' + G.Musculos.figura(e) + '<div><p><b>Principales</b>' + esc(m.p.join(', ')) + '</p>' + (m.s.length ? '<p><b>Secundarios</b>' + esc(m.s.join(', ')) + '</p>' : '') + '</div></div>' : '') +
      ((e.tips || []).length ? '<ul class="tips-l">' + e.tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '<p class="tenue" style="margin-top:12px">Todavía no tiene tips. Agrega los tuyos.</p>') +
      '<div style="margin-top:18px"><button class="btn" data-a="ej-editar" data-id="' + esc(id) + '">Cambiar nombre, tips o imagen</button></div>');
  }
  function hojaEditarEj(id) {
    const e = id ? S.ejercicio(id) : { nombre: '', grupo: ui.grupo || 'pecho', tips: [] };
    const propio = !id || !G.EX[id], pick = ui.pick;
    abrir(cabHoja(id ? 'Editar ejercicio' : 'Ejercicio nuevo') +
      '<label class="campo" style="margin-top:0"><span>Nombre</span><input id="ej-nombre" maxlength="60" value="' + esc(e.nombre) + '"></label>' +
      (propio ? '<label class="campo"><span>Zona</span><select id="ej-grupo">' + Object.keys(G.GRUPOS).map(g => '<option value="' + g + '"' + (e.grupo === g ? ' selected' : '') + '>' + G.GRUPOS[g] + '</option>').join('') + '</select></label>' : '') +
      '<label class="campo"><span>Tips, uno por renglón</span><textarea id="ej-tips">' + esc((e.tips || []).join('\n')) + '</textarea></label>' +
      '<label class="campo"><span>Imagen propia (opcional)</span><input id="ej-foto" type="file" accept="image/*"></label>' +
      '<div class="pila" style="margin-top:18px"><button class="btn primario" data-a="ej-guardar" data-id="' + esc(id || '') + '">Guardar ejercicio</button>' +
      (id && propio ? '<button class="btn peligro" data-a="ej-borrar" data-id="' + esc(id) + '">Borrar ejercicio</button>' : '') +
      (id && !propio && st().custom.cambios[id] ? '<button class="btn" data-a="ej-restaurar" data-id="' + esc(id) + '">Volver al original</button>' : '') + '</div>');
    ui.pick = id ? null : pick;
  }
  function reducirFoto(archivo) {
    return new Promise(res => {
      if (!archivo) return res(null);
      const img = new Image(), url = URL.createObjectURL(archivo);
      img.onload = () => {
        const k = Math.min(1, 560 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => { URL.revokeObjectURL(url); res(null); };
      img.src = url;
    });
  }
  // ---------- Progreso de un ejercicio (solo se abre desde el ejercicio) ----------
  const fechaLarga = f => new Date(f + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  function hojaProgreso(id) {
    const e = S.ejercicio(id), it = itemActual(), u = it && it.ex === id ? uni(it) : unidad(), l = P.deEjercicio(id, u), h = S.historial(id);
    if (!l.length) { abrir(cabHoja('Progreso', e.nombre) + '<p class="tenue">Aquí va a aparecer una gráfica con tu avance cada vez que hagas este ejercicio.</p>'); return; }
    const conPeso = l.some(x => x.max > 0), conReps = l.some(x => x.reps > 0);
    const METS = [];
    if (conPeso) METS.push(['max', 'Peso máximo'], ['vol', 'Volumen']);
    if (conReps) METS.push(['reps', 'Repeticiones']);
    if (!conPeso && !conReps) METS.push(['tiempo', 'Tiempo']);
    if (!ui.pe || ui.pe.id !== id || !METS.some(m => m[0] === ui.pe.met)) ui.pe = { id, met: METS[0][0] };
    const met = ui.pe.met, ult = l.slice(-16);
    const uni2 = { max: u, vol: u, reps: 'repeticiones', tiempo: /min/.test((h[0].sets[0] || {}).reps || '') ? 'min' : 's' }[met];
    const datos = ult.map(x => ({ etq: P.corta(x.fecha), v: x[met], n: P.fmt(x[met]), u: uni2, t: fechaLarga(x.fecha) + (met === 'max' && x.repsMax ? ' · ' + x.repsMax + ' repeticiones' : '') }));
    const fin = datos[datos.length - 1], mejor = l.reduce((a, x) => (x.max > a.max ? x : a), l[0]), primero = ult[0][met], cambio = fin.v - primero;
    let tiles = '<div><b>' + l.length + '</b><span>' + (l.length === 1 ? 'vez' : 'veces') + '</span></div>';
    if (conPeso) tiles = '<div><b>' + P.fmt(mejor.max) + '<small> ' + u + '</small></b><span>mejor peso, ' + P.corta(mejor.fecha) + '</span></div>' + tiles;
    if (ult.length > 1 && primero > 0) tiles += '<div><b>' + (cambio > 0 ? '+' : cambio < 0 ? '−' : '') + P.fmt(Math.abs(cambio)) + '</b><span>' + (met === 'max' || met === 'vol' ? u + ' ' : '') + 'desde ' + P.corta(ult[0].fecha) + '</span></div>';
    abrir(cabHoja('Progreso', e.nombre) + '<div class="resumen">' + tiles + '</div>' +
      (METS.length > 1 ? '<div class="seg ancho graf-met">' + METS.map(m => '<button data-a="pe-met" data-v="' + m[0] + '" aria-pressed="' + (m[0] === met) + '">' + m[1] + '</button>').join('') + '</div>' : '') +
      '<div class="tarjeta graf"><p class="g-lect"><b class="g-n">' + fin.n + '</b> <span class="g-u">' + fin.u + '</span><span class="g-t">' + fin.t + '</span></p>' + P.linea(datos, { sel: datos.length - 1, titulo: METS.find(m => m[0] === met)[1] + ' de ' + e.nombre }) + '</div>' +
      (met === 'vol' ? '<p class="tenue chico" style="margin-top:8px">Volumen: peso × repeticiones, sumando todas las series del día.</p>' : '') +
      '<h3 class="pick-t">Historial</h3><div class="lista">' + h.slice(0, 30).map(r => '<div class="fila"><span class="cuerpo"><b>' + fechaLarga(r.fecha) + '</b><span>' + r.sets.map(x => esc((x.kg ? x.kg + ' ' + (r.u || unidad()) + ' × ' : '') + (x.reps || '✓'))).join(', ') + '</span></span></div>').join('') + '</div>');
  }

  // ---------- Progreso general ----------
  const MET = { ent: ['Entrenamientos', 'entrenamientos'], series: ['Series', 'series'], vol: ['Volumen', ''], min: ['Minutos', 'min'] };
  function vProgreso() {
    const s = st(), u = unidad(), pg = ui.pg, e = estadisticas();
    const total = Object.keys(s.logs).filter(f => registro(f)).length;
    if (!total) return { cab: '<h1>Progreso</h1>', html: '<p class="vacio">Todavía no hay entrenamientos guardados. Cuando termines el primero, aquí vas a ver tus gráficas por semana y por mes.</p>', tabs: true };
    const sem = P.general('sem', u), esta = sem[sem.length - 1], plan = Object.keys(s.routine.dias).filter(d => s.routine.dias[d].items.length).length;
    const ult4 = sem.slice(-5, -1), prom = ult4.reduce((a, c) => a + c.ent, 0) / 4;
    const cubos = pg.modo === 'mes' ? P.general('mes', u) : sem, met = pg.met;
    const datos = cubos.map(c => ({ etq: c.etq, v: c[met], n: P.fmt(c[met]), u: met === 'vol' ? u : met === 'ent' && c.ent === 1 ? 'entrenamiento' : MET[met][1], t: c.largo }));
    const fin = datos[datos.length - 1], grupos = P.porGrupo(28), maxG = grupos.length ? grupos[0].n : 1, marcas = P.marcas();
    let h = '<div class="resumen"><div><b>' + esta.ent + (plan ? '<small> de ' + plan + '</small>' : '') + '</b><span>esta semana</span></div><div><b>' + P.fmt(prom) + '</b><span>promedio semanal</span></div><div><b>' + e.racha + '</b><span>' + (e.racha === 1 ? 'semana seguida' : 'semanas seguidas') + '</span></div></div>';
    h += '<div class="seg ancho graf-met">' + Object.keys(MET).map(k => '<button data-a="pg-met" data-v="' + k + '" aria-pressed="' + (k === met) + '">' + MET[k][0] + '</button>').join('') + '</div>';
    h += '<div class="tarjeta graf"><div class="g-arriba"><p class="g-lect"><b class="g-n">' + fin.n + '</b> <span class="g-u">' + fin.u + '</span><span class="g-t">' + fin.t + '</span></p>' +
      '<span class="seg quieto"><button data-a="pg-modo" data-v="sem" aria-pressed="' + (pg.modo !== 'mes') + '">Semanas</button><button data-a="pg-modo" data-v="mes" aria-pressed="' + (pg.modo === 'mes') + '">Meses</button></span></div>' +
      P.barras(datos, { sel: datos.length - 1, entero: met !== 'vol', titulo: MET[met][0] + (pg.modo === 'mes' ? ' por mes' : ' por semana') }) + '</div>';
    if (met === 'vol') h += '<p class="tenue chico" style="margin-top:8px">Volumen: peso × repeticiones de todas tus series, en ' + (u === 'kg' ? 'kilos' : 'libras') + '.</p>';
    if (grupos.length) h += '<h2 class="sub-t">Series por zona</h2><p class="tenue chico" style="margin:-6px 2px 10px">Últimas 4 semanas, sin contar calentamiento.</p><div class="tarjeta zonas">' +
      grupos.map((g, i) => '<div class="zona"><span>' + esc(g.nombre) + '</span><span class="z-pista"><i style="width:' + Math.max(3, Math.round(100 * g.n / maxG)) + '%;animation-delay:' + (i * 40) + 'ms"></i></span><b>' + g.n + '</b></div>').join('') + '</div>';
    if (marcas.length) h += '<h2 class="sub-t">Mejores marcas del mes</h2><div class="tarjeta lista-ej">' + marcas.map(m => '<div class="fila"><span class="cuerpo"><b>' + esc(m.nombre) + '</b><span>' + P.corta(m.fecha) + ' · antes ' + P.fmt(m.antes) + ' ' + m.u + '</span></span><span class="hechas todas">' + P.fmt(m.peso) + ' ' + m.u + '</span></div>').join('') + '</div>';
    h += '<p class="tenue chico" style="margin-top:16px">El avance de cada ejercicio está dentro del ejercicio, en "Progreso del ejercicio".</p>';
    return { cab: '<h1>Progreso</h1>', html: h, tabs: true };
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
    return {
      cab: '<h1>Calendario</h1>',
      html: '<div class="resumen"><div><b>' + e.mes + '</b><span>este mes</span></div><div><b>' + e.racha + '</b><span>' + (e.racha === 1 ? 'semana seguida' : 'semanas seguidas') + '</span></div><div><b>' + e.total + '</b><span>en total</span></div></div>' +
        '<div class="mes-cab"><button data-a="cal-mes" data-v="-1" aria-label="Mes anterior">‹</button><h2>' + MESES[m.m] + ' ' + m.y + '</h2><button data-a="cal-mes" data-v="1" aria-label="Mes siguiente">›</button></div>' +
        '<div class="mes">' + celdas + '</div><div class="leyenda"><span><i></i>Entrenaste</span><span><i class="p"></i>Toca entrenar</span></div>',
      tabs: true
    };
  }
  function hojaFecha(f) {
    const d = new Date(f + 'T12:00:00'), r = registro(f), dia = st().routine.dias[S.diaSemana(d)];
    const titulo = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    let h = cabHoja(titulo.charAt(0).toUpperCase() + titulo.slice(1), r ? r.nombre + (r.min ? ', ' + r.min + ' min' : '') : '');
    if (r) {
      h += '<div class="lista">' + (r.items || []).map(it => '<div class="fila"><span class="cuerpo"><b>' + esc(it.nombre || S.ejercicio(it.ex).nombre) + '</b><span>' + it.sets.map(x => esc((x.kg ? x.kg + ' ' + (it.u || r.u || 'kg') + ' × ' : '') + (x.reps || '✓'))).join(', ') + '</span></span></div>').join('') + '</div>' +
        '<div style="margin-top:18px"><button class="btn peligro" data-a="cal-borrar" data-v="' + f + '">Marcar como no entrenado</button></div>';
    } else if (f > S.hoy()) {
      h += '<p class="tenue">' + (dia.items.length ? 'Ese día toca: ' + esc(dia.nombre) + '.' : 'Ese día toca descanso.') + '</p>';
    } else {
      h += '<p class="tenue">Sin registro este día.' + (dia.items.length ? ' Tocaba: ' + esc(dia.nombre) + '.' : ' Tocaba descanso.') + '</p>' +
        '<div style="margin-top:18px"><button class="btn primario" data-a="cal-marcar" data-v="' + f + '">Marcar como entrenado</button></div>';
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
    if (!D.configurado()) drive = '<p>Falta el ID de cliente de Google en el archivo js/config.js. Mientras tanto, todo se guarda en este teléfono.</p>';
    else if (!m.conectado) drive = '<p>Conéctate para guardar una copia en tu Drive, dentro de la carpeta ' + esc(G.CONFIG.CARPETA_DRIVE) + ' / ' + esc(p.nombre) + '.</p><div style="margin-top:12px"><button class="btn primario" data-a="dr-conectar">Conectar con Google</button></div>';
    else drive = '<p>' + (m.correo ? 'Conectado como ' + esc(m.correo) + '. ' : 'Conectado. ') + (m.ultima ? 'Última copia ' + hace(m.ultima) + '.' : 'Todavía no se sube ninguna copia.') + (m.pendiente ? ' Hay cambios por subir.' : '') + '</p><div class="pila" style="margin-top:12px"><button class="btn" data-a="dr-sync">Sincronizar ahora</button><button class="liga" data-a="dr-salir">Desconectar</button></div>';
    const plan = p.plan && p.plan.manual ? 'Rutina armada por ti.' : 'Objetivo: ' + Gen.OBJ[p.encuesta.objetivo] + '. Plan de ' + esc(p.plan.titulo) + ', unos ' + p.plan.minutos + ' min por sesión.';
    const u = unidad();
    return {
      cab: '<h1>Ajustes</h1>',
      html: '<div class="pila-g">' +
        '<section class="grupo sin-linea"><h2>' + esc(p.nombre) + '</h2><p>' + plan + '</p><div style="margin-top:12px"><button class="btn" data-a="aj-encuesta">' + (p.plan && p.plan.manual ? 'Hacer la encuesta' : 'Volver a hacer la encuesta') + '</button></div></section>' +
        '<section class="grupo"><h2>Entrenamiento</h2><div class="interruptor"><span>Unidad de peso<small>Para ejercicios nuevos. En cada ejercicio la cambias tocando "Peso (lb)"</small></span><span class="seg"><button data-a="aj-unidad" data-v="lb" aria-pressed="' + (u === 'lb') + '">lb</button><button data-a="aj-unidad" data-v="kg" aria-pressed="' + (u === 'kg') + '">kg</button></span></div>' +
        interruptor('autoDescanso', 'Iniciar el descanso al marcar una serie', 'Si lo apagas, el descanso solo empieza cuando tocas Iniciar') + '</section>' +
        '<section class="grupo"><h2>Rutina con IA</h2><p>' + (IA.listo() ? 'Conectada con ' + IA.PROVEEDORES[IA.config().proveedor].nombre + '.' : 'Opcional. Toca la estrellita en la pantalla Rutina para armar o ajustar tu semana con Gemini (gratis) o Claude.') + '</p><div style="margin-top:12px"><button class="btn" data-a="ia-config-aj">' + (IA.listo() ? 'Cambiar clave o servicio' : 'Configurar la IA') + '</button></div></section>' +
        '<section class="grupo"><h2>Google Drive</h2>' + drive + '</section>' +
        '<section class="grupo"><h2>Pitido del descanso</h2>' + interruptor('sonido', 'Sonar al terminar el descanso') + interruptor('cuenta', 'Avisar 3, 2, 1 antes') + interruptor('enSilencio', 'Sonar aunque el iPhone esté en silencio', 'Puede pausar tu música mientras suena') + '<div style="margin-top:8px"><button class="btn" data-a="aj-probar">Probar el pitido</button></div></section>' +
        '<section class="grupo"><h2>Pantalla</h2>' + interruptor('pantalla', 'Mantener la pantalla encendida al entrenar', D.nativo ? 'Si bloqueas el iPhone, el aviso llega como notificación con sonido' : 'Con el iPhone bloqueado el pitido no puede sonar') + '</section>' +
        '<section class="grupo"><h2>Uso sin internet</h2><p id="aj-fotos">Revisando dibujos guardados…</p>' + (D.nativo ? '' : '<div style="margin-top:12px"><button class="btn" data-a="aj-fotos">Descargar todos los dibujos</button></div>') + '</section>' +
        '<section class="grupo"><h2>Créditos</h2><p>Dibujos de los ejercicios: Everkinetic (everkinetic.com), licencia CC BY-SA 4.0, adaptados a fondo oscuro. Los de cardio son propios de esta app.</p></section>' +
        '<section class="grupo"><h2>Tus datos</h2><div class="pila"><button class="btn" data-a="aj-exportar">Descargar una copia</button><button class="btn peligro" data-a="aj-borrar">Borrar todo de este teléfono</button></div></section></div>',
      tabs: true
    };
  }
  function urlsFotos() { const u = {}; G.EXERCISES.forEach(e => S.fotos(e).forEach(x => { u[x] = 1; })); return Object.keys(u); }
  async function contarFotos() {
    const el = $('#aj-fotos'); if (!el) return;
    const total = urlsFotos().length;
    if (D.nativo) { el.textContent = 'Los ' + total + ' dibujos vienen dentro de la app. Todo funciona sin internet.'; return; }
    if (!('caches' in window) || !navigator.serviceWorker || !navigator.serviceWorker.controller) { el.textContent = 'El modo sin internet se activa cuando la app está publicada en su dirección https e instalada.'; return; }
    try { const c = await caches.open(CACHE_FOTOS), n = (await c.keys()).length; if ($('#aj-fotos')) $('#aj-fotos').textContent = n >= total ? 'Los ' + total + ' dibujos están guardados. Todo funciona sin internet.' : n + ' de ' + total + ' dibujos guardados. Descárgalos con wifi para no gastar datos.'; } catch (e) { el.textContent = ''; }
  }
  let bajando = false;
  async function bajarFotos(manual) {
    if (bajando || !navigator.serviceWorker || !navigator.serviceWorker.controller) { if (manual) toast('Disponible cuando la app esté publicada e instalada'); return; }
    if (!navigator.onLine) { if (manual) toast('Sin internet'); return; }
    bajando = true;
    const urls = urlsFotos(); let i = 0, ok = 0;
    async function obrero() { while (i < urls.length) { const u = urls[i++]; try { const r = await fetch(u); if (r.ok) ok++; } catch (e) { /* se reintenta después */ } const el = $('#aj-fotos'); if (el) el.textContent = 'Descargando dibujos: ' + i + ' de ' + urls.length; } }
    await Promise.all([obrero(), obrero(), obrero(), obrero()]);
    bajando = false;
    if (ok === urls.length) localStorage.setItem('gym.fotos', '1');
    if (manual) toast(ok === urls.length ? 'Dibujos guardados' : 'Faltaron ' + (urls.length - ok) + ' dibujos. Intenta de nuevo');
    contarFotos();
  }

  // ---------- Google Drive ----------
  function ocupado() { return !hoja.hidden || ui.enc || ui.plan || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || ''); }
  async function sincronizar(manual) {
    const r = await D.sincronizar();
    if (r.ok) {
      if (!ocupado() && (r.cambio || (!ui.ej && (ui.tab === 'hoy' || ui.tab === 'ajustes')))) render(true);
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
    if (D.listo()) { if (s.sync.pendiente || !s.sync.ultima) sincronizar(false); }
    else if (D.puedeRenovarSolo() && !ocupado() && !ui.ej) D.entrar(true, 'sync');
  }
  async function alVolverDeGoogle(v) {
    if (!v.ok) {
      if (/interaction_required|login_required|consent_required|account_selection_required/.test(v.error || '')) { st().sync.conectado = false; S.guardar(); render(true); toast('Vuelve a conectar tu cuenta de Google en Ajustes'); }
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
    render(true); sincronizar(true);
  }

  // ---------- Acciones ----------
  const acciones = {
    tab(el) {
      const antes = ui.ej ? -1 : posTab(ui.tab), v = el.dataset.v, igual = !ui.ej && !ui.dia && v === ui.tab;
      ui.tab = v; ui.dia = null; ui.verDia = null; ui.ej = null;
      render(false, igual ? 'fade' : posTab(v) >= antes ? 'tder' : 'tizq');
      const ind = tabs.querySelector('.ind');
      if (!igual && ind.animate && !quieto) ind.animate([{ scale: '1 1' }, { scale: '1.22 .86', offset: .45 }, { scale: '1 1' }], { duration: 340, easing: 'ease-out' });
      toque('sel');
    },
    // Al tocar una columna o un punto de una gráfica, arriba se lee su valor (sin redibujar la pantalla).
    graf(el) {
      const g = el.closest('.graf'); if (!g) return;
      g.querySelectorAll('.g-col.sel').forEach(c => c.classList.remove('sel')); el.classList.add('sel');
      g.querySelector('.g-n').textContent = el.dataset.n; g.querySelector('.g-u').textContent = el.dataset.u; g.querySelector('.g-t').textContent = el.dataset.t;
    },
    'pg-met'(el) { ui.pg.met = el.dataset.v; render(true); },
    'pg-modo'(el) { ui.pg.modo = el.dataset.v; render(true); },
    'pe-met'(el) { const y = hoja.firstChild.scrollTop; ui.pe.met = el.dataset.v; hojaProgreso(ui.pe.id); hoja.firstChild.style.animation = 'none'; hoja.firstChild.scrollTop = y; },
    'sug-usar'(el) {
      const it = itemActual(), v = el.dataset.v;
      it.series.forEach(x => { if (x.tipo !== 'c' && (!x.peso || P.num(x.peso) < P.num(v))) x.peso = v; });
      S.tocar('routine'); render(true); toast('Peso puesto en ' + v + ' ' + uni(it));
    },
    cerrar() { cerrar(); },
    confirmar() { const f = ui.alConfirmar; cerrar(); if (f) f(); },

    encuesta() {
      const p = st().profile, base = { nombre: '', dias: [], molestias: [], zonas: [] };
      ui.enc = { i: 0, r: p ? Object.assign(base, JSON.parse(JSON.stringify(p.encuesta))) : base };
      delete ui.enc.r.manual;
      cerrar(); render();
    },
    manual() {
      abrir(cabHoja('Arma tu rutina', 'Empiezas con la semana vacía y agregas lo que quieras') +
        '<label class="campo" style="margin-top:0"><span>¿Cómo te llamas?</span><input id="man-nombre" maxlength="30" autocomplete="given-name" placeholder="Tu nombre"></label>' +
        '<div style="margin-top:18px"><button class="btn primario" data-a="manual-ok">Crear mi semana</button></div>');
    },
    'manual-ok'() {
      const nombre = $('#man-nombre').value.trim();
      if (!nombre) { toast('Escribe tu nombre'); return; }
      const s = st();
      s.profile = { nombre, encuesta: { nombre, objetivo: 'musculo', nivel: 'intermedio', dias: [], minutos: 60, equipo: 'completo', molestias: [], zonas: [], manual: true }, plan: { titulo: 'Rutina propia', minutos: 60, manual: true }, updatedAt: Date.now() };
      s.routine = rutinaVacia();
      cerrar(); ui.tab = 'rutina'; S.tocar('profile'); S.tocar('routine'); render(); toast('Toca un día y agrega tus ejercicios');
    },
    recuperar() { if (!D.entrar(false, 'recuperar')) toast('Google Drive todavía no está configurado'); },
    'rec-ok'(el) {
      const c = ui.perfiles[+el.dataset.v]; cerrar();
      D.recuperar(c).then(ok => { if (ok) { render(); toast('Datos recuperados'); } else toast('Esa carpeta no tiene datos'); }).catch(() => toast('No se pudo leer Google Drive'));
    },
    'enc-atras'() {
      let i = ui.enc.i - 1;
      while (i >= 0 && !aplica(i)) i--;
      if (i < 0) ui.enc = null; else ui.enc.i = i;
      render(false, 'izq');
    },
    'enc-uno'(el) { const p = PREG[ui.enc.i]; ui.enc.r[p.k] = p.k === 'minutos' ? +el.dataset.v : el.dataset.v; encAvanza(); },
    'enc-dia'(el) { const d = +el.dataset.v, l = ui.enc.r.dias, i = l.indexOf(d); if (i >= 0) l.splice(i, 1); else l.push(d); render(true); },
    'enc-varios'(el) { const l = ui.enc.r[PREG[ui.enc.i].k], v = el.dataset.v, i = l.indexOf(v); if (i >= 0) l.splice(i, 1); else l.push(v); render(true); },
    'enc-sig'() {
      const p = PREG[ui.enc.i], r = ui.enc.r;
      if (p.tipo === 'texto') { const v = $('#enc-texto').value.trim(); if (!v) { toast('Escribe tu nombre'); return; } r[p.k] = v; }
      if (p.tipo === 'dias' && !r.dias.length) { toast('Marca al menos un día'); return; }
      if (p.tipo === 'cuerpo') { r.edad = $('#enc-edad').value.trim(); r.peso = $('#enc-peso').value.trim().replace(',', '.'); r.estatura = $('#enc-estatura').value.trim(); }
      encAvanza();
    },
    'plan-atras'() { ui.enc = { i: PREG.length - 1, r: ui.plan.r }; ui.plan = null; render(); },
    'plan-sel'(el) { ui.plan.sel = +el.dataset.v; render(true); },
    'plan-crear'() {
      const p = ui.plan, op = p.ops[p.sel], s = st();
      const crear = () => {
        if (s.profile && s.profile.nombre !== p.r.nombre) { s.sync.carpeta = null; s.sync.archivo = null; }
        s.profile = { nombre: p.r.nombre, encuesta: p.r, plan: { id: op.id, titulo: op.titulo, minutos: op.minutos, pct: op.pct, dias: op.dias }, updatedAt: Date.now() };
        s.routine = Gen.construir(p.r, op); s.active = null;
        ui.plan = null; ui.tab = 'hoy'; ui.verDia = null; ui.ej = null;
        S.tocar('profile'); S.tocar('routine'); render(); toast('Rutina lista. Cámbiala como quieras');
      };
      const tiene = s.routine && Object.keys(s.routine.dias).some(d => s.routine.dias[d].items.length);
      if (tiene) confirmar('¿Reemplazar tu rutina?', 'La rutina nueva sustituye a la actual. Tu calendario no se borra.', 'Reemplazar rutina', crear); else crear();
    },

    // Hoy y entrenamiento
    'hoy-dia'(el) { ui.verDia = +el.dataset.v; render(); },
    'hoy-editar'(el) { ui.tab = 'rutina'; ui.dia = +el.dataset.v; render(false, 'der'); },
    'ent-empezar'(el) {
      const d = +el.dataset.v; sesion(true, d);
      const abre = !ui.ej;
      if (abre) ui.ej = { dia: d, i: 0, editar: false };
      render(!abre, 'der');
    },
    'ent-terminar'() { confirmar('¿Terminar el entrenamiento?', 'Se guardan en el calendario las series que marcaste.', 'Guardar y terminar', terminar); },

    // Pantalla de un ejercicio
    'ej-abrir'(el) { ui.ej = { dia: ui.verDia || S.diaSemana(), i: +el.dataset.v, editar: false }; render(false, 'der'); },
    'ej-abrir-ed'(el) { ui.ej = { dia: ui.dia, i: +el.dataset.v, editar: true, salir: true }; ui.ej.copia = copiaItem(); render(false, 'der'); },
    'ej-volver'() { ui.ej = null; render(false, 'izq'); },
    'ej-mover'(el) { const n = st().routine.dias[ui.ej.dia].items.length, i = ui.ej.i + (+el.dataset.v); if (i >= 0 && i < n) { ui.ej.i = i; ui.ej.rueda = false; render(false, +el.dataset.v > 0 ? 'aba' : 'arr'); } },
    'ej-menu'() {
      const m = document.createElement('div');
      m.id = 'menu'; m.innerHTML = '<div class="menu" role="menu">' +
        '<button role="menuitem" data-a="ej-modo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6"/><path d="M17.5 3.5l3 3L12 15l-4 1 1-4z"/></svg>Editar</button>' +
        '<button role="menuitem" data-a="menu-cambiar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7H4M8 3L4 7l4 4M4 17h16M16 13l4 4-4 4"/></svg>Reemplazar ejercicio</button></div>';
      document.body.appendChild(m);
    },
    'menu-cambiar'() { hojaPick('cambiar'); },
    'ej-modo'() { ui.ej.editar = true; ui.ej.rueda = false; ui.ej.copia = copiaItem(); render(); },
    'ej-guardar-ed'() { S.tocar('routine'); finEdicion(); toast('Cambios guardados'); },
    'ej-cancelar'() {
      // Deja el ejercicio como estaba antes de tocar "Editar".
      const c = JSON.parse(ui.ej.copia), d = st().routine.dias[ui.ej.dia], a = st().active;
      d.items[ui.ej.i] = c.it;
      if (a) { if (c.h) a.hechos[c.it.uid] = c.h; else delete a.hechos[c.it.uid]; }
      S.tocar('routine'); finEdicion();
    },
    'ej-info'() { hojaEjercicio(itemActual().ex); },
    'ej-progreso'() { hojaProgreso(itemActual().ex); },
    'se-circ'(el) {
      const it = itemActual(), i = +el.dataset.v;
      if (ui.ej.editar) { it.series[i].tipo = it.series[i].tipo === 'c' ? 'n' : 'c'; S.tocar('routine'); render(true); return; }
      const a = sesion(true, ui.ej.dia), h = a.hechos[it.uid] || (a.hechos[it.uid] = []);
      h[i] = !h[i]; S.guardar(); ui.pop = h[i] ? i : null; render(true); toque(h[i] ? 'fuerte' : 'suave');
      if (h[i] && st().settings.autoDescanso && it.rest > 0) iniciarTimer(it.rest, 'Sigue: ' + S.ejercicio(it.ex).nombre);
    },
    'se-agregar'() {
      const it = itemActual(), u = it.series[it.series.length - 1];
      it.series.push(u ? { reps: u.reps, peso: u.peso, tipo: 'n' } : { reps: '10', peso: '', tipo: 'n' });
      S.tocar('routine'); render(true);
    },
    'se-quitar'(el) {
      const it = itemActual(), i = +el.dataset.v, a = st().active;
      it.series.splice(i, 1);
      if (a && a.hechos[it.uid]) a.hechos[it.uid].splice(i, 1);
      S.tocar('routine'); render(true);
    },
    't-toggle'() {
      const it = itemActual();
      if (corriendo()) { pararTimer(true); return; }
      if (!it.rest) { toast('Toca el tiempo para ponerle descanso'); return; }
      A.preparar(); A.permiso();
      iniciarTimer(it.rest, 'Sigue: ' + S.ejercicio(it.ex).nombre);
    },
    't-rueda'() { ui.ej.rueda = !ui.ej.rueda; render(true); },
    'rueda-ir'(el) { const c = el.parentNode; c.scrollTo({ top: [].indexOf.call(c.querySelectorAll('button'), el) * PASO_R, behavior: 'smooth' }); },
    'ej-unidad'() { const it = itemActual(); it.u = uni(it) === 'lb' ? 'kg' : 'lb'; S.tocar('routine'); render(true); toast('Este ejercicio ahora va en ' + (it.u === 'kg' ? 'kilos' : 'libras')); },
    'it-cambiar'() { hojaPick('cambiar'); },
    'it-quitar'() {
      const d = st().routine.dias[ui.ej.dia];
      confirmar('¿Quitar este ejercicio?', 'Se quita de ' + DIAS[ui.ej.dia - 1].toLowerCase() + ' con todas sus series.', 'Quitar ejercicio', () => {
        d.items.splice(ui.ej.i, 1); if (!d.items.length) d.nombre = 'Descanso';
        ui.ej = null; S.tocar('routine'); render();
      }, true);
    },

    // IA
    'ia-abrir'(el) {
      ui.ia = { alcance: el.dataset.v, dia: ui.dia, pedido: '', usarPerfil: true, actual: false };
      if (IA.listo()) hojaIA(); else hojaIAConfig();
    },
    'ia-config-aj'() { ui.ia = null; hojaIAConfig(); },
    'ia-config'() { leerHojaIA(); hojaIAConfig(); },
    'ia-prov'(el) { const c = IA.config(); c.proveedor = el.dataset.v; IA.guardar(c); hojaIAConfig(); },
    'ia-guardar'() {
      const c = IA.config(), v = $('#ia-clave').value.trim();
      if (!v) { toast('Pega tu clave'); return; }
      c.claves[c.proveedor] = v; c.modelos[c.proveedor] = []; IA.guardar(c);
      if (ui.ia) { hojaIA(); } else { cerrar(); cargarModelos(true); }
    },
    'ia-borrar-clave'() { const c = IA.config(); delete c.claves[c.proveedor]; c.modelos[c.proveedor] = []; IA.guardar(c); hojaIAConfig(); toast('Clave borrada'); },
    'ia-esfuerzo'(el) { leerHojaIA(); const c = IA.config(); c.esfuerzo = el.dataset.v; IA.guardar(c); hojaIA(); },
    async 'ia-generar'() {
      leerHojaIA();
      const x = ui.ia, s = st(), enc = s.profile && s.profile.encuesta;
      x.cargando = true; hojaIA();
      try {
        x.resultado = await IA.generar({ alcance: x.alcance, dia: x.dia, pedido: x.pedido, usarPerfil: !!(enc && !enc.manual && x.usarPerfil !== false), encuesta: enc,
          actual: x.actual ? IA.rutinaComoTexto(s.routine) : '' });
      } catch (e) { toast(e.message === 'sin-internet' ? 'Necesitas internet para usar la IA' : e.message); }
      x.cargando = false;
      if (ui.ia === x && !hoja.hidden) hojaIA();
    },
    'ia-otra'() { ui.ia.resultado = null; hojaIA(); },
    'ia-usar'() {
      const x = ui.ia, r = x.resultado, s = st();
      if (x.alcance === 'dia') {
        s.routine.dias[x.dia] = r.dias[x.dia] || { nombre: 'Descanso', items: [] };
      } else {
        for (let d = 1; d <= 7; d++) s.routine.dias[d] = r.dias[d] || { nombre: 'Descanso', items: [] };
        s.active = null;
      }
      S.tocar('routine'); ui.ia = null; cerrar(); render(); toast('Rutina actualizada. Puedes cambiar lo que quieras');
    },

    // Rutina
    'rut-dia'(el) { ui.dia = +el.dataset.v; render(false, 'der'); },
    'rut-volver'() { ui.dia = null; render(false, 'izq'); },
    'rut-descanso'() { confirmar('¿Dejar ' + DIAS[ui.dia - 1].toLowerCase() + ' como descanso?', 'Se quitan los ejercicios de este día.', 'Dejar como descanso', () => { st().routine.dias[ui.dia] = { nombre: 'Descanso', items: [] }; S.tocar('routine'); render(); }, true); },
    'rut-cambiar'() {
      abrir(cabHoja('Intercambiar ' + DIAS[ui.dia - 1].toLowerCase() + ' con') + '<div class="lista">' + DIAS.map((n, i) => i + 1 === ui.dia ? '' : '<button class="fila" data-a="rut-cambio" data-v="' + (i + 1) + '"><span class="cuerpo"><b>' + n + '</b><span>' + esc(st().routine.dias[i + 1].items.length ? st().routine.dias[i + 1].nombre : 'Descanso') + '</span></span></button>').join('') + '</div>');
    },
    'rut-cambio'(el) { const d = st().routine.dias, o = +el.dataset.v, t = d[ui.dia]; d[ui.dia] = d[o]; d[o] = t; S.tocar('routine'); ui.dia = o; cerrar(); render(); toast('Días intercambiados'); },
    'it-mover'(el) { const l = st().routine.dias[ui.dia].items, i = +el.dataset.v, j = i + (+el.dataset.d); if (j < 0 || j >= l.length) return; const t = l[i]; l[i] = l[j]; l[j] = t; S.tocar('routine'); render(true); },
    'it-agregar'() { hojaPick('agregar'); },
    'pick-g'(el) { ui.grupo = el.dataset.v; hoja.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.v === ui.grupo))); $('#pick-lista').innerHTML = listaPick(); },
    'pick-ok'(el) { ponerEjercicio(el.dataset.id); },
    'ej-nuevo'() { hojaEditarEj(null); },
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
      if (nuevoId && ui.pick && (ui.dia || ui.ej)) { ponerEjercicio(nuevoId); toast('Ejercicio creado y agregado'); return; }
      cerrar(); render(true); toast('Ejercicio guardado');
    },
    'ej-borrar'(el) {
      const id = el.dataset.id;
      confirmar('¿Borrar este ejercicio?', 'También se quita de los días donde lo tengas.', 'Borrar ejercicio', () => {
        const s = st(); s.custom.items = s.custom.items.filter(x => x.id !== id);
        Object.keys(s.routine.dias).forEach(d => { const dia = s.routine.dias[d]; dia.items = dia.items.filter(x => x.ex !== id); if (!dia.items.length) dia.nombre = 'Descanso'; });
        ui.ej = null; S.tocar('custom'); S.tocar('routine'); render();
      }, true);
    },
    'ej-restaurar'(el) { delete st().custom.cambios[el.dataset.id]; S.tocar('custom'); cerrar(); render(true); toast('Ejercicio restaurado'); },

    // Calendario
    'cal-mes'(el) { const h = new Date(), m = ui.mes || { y: h.getFullYear(), m: h.getMonth() }, d = new Date(m.y, m.m + (+el.dataset.v), 1); ui.mes = { y: d.getFullYear(), m: d.getMonth() }; render(false, +el.dataset.v > 0 ? 'der' : 'izq'); },
    'cal-dia'(el) { hojaFecha(el.dataset.v); },
    'cal-borrar'(el) { const f = el.dataset.v; confirmar('¿Marcar como no entrenado?', 'Se quita la marca de ese día y las series que registraste ahí.', 'Quitar la marca', () => { st().logs[f] = { fecha: f, borrado: true, updatedAt: Date.now() }; S.tocar('logs'); render(true); toast('Día desmarcado'); }, true); },
    'cal-marcar'(el) {
      const f = el.dataset.v, dia = st().routine.dias[S.diaSemana(new Date(f + 'T12:00:00'))];
      st().logs[f] = { fecha: f, nombre: dia.items.length ? dia.nombre : 'Entrenamiento', u: unidad(), min: 0, updatedAt: Date.now(), items: dia.items.map(it => ({ ex: it.ex, nombre: S.ejercicio(it.ex).nombre, u: uni(it), sets: it.series.map(x => ({ kg: x.peso || '', reps: x.reps || '' })) })) };
      S.tocar('logs'); cerrar(); render(true); toast('Día marcado');
    },

    // Ajustes
    'aj-encuesta'() { acciones.encuesta(); },
    'aj-unidad'(el) { st().settings.unidad = el.dataset.v; S.tocar('settings'); render(true); },
    'aj-probar'() { const s = st().settings; if (!s.sonido) { toast('Activa primero el pitido'); return; } if (!A.ahora()) toast('Este navegador no puede reproducir el pitido'); },
    'aj-fotos'() { bajarFotos(true); },
    'aj-exportar'() {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S.paquete(), null, 2)], { type: 'application/json' }));
      a.download = 'gym-' + S.hoy() + '.json'; document.body.appendChild(a); a.click(); a.remove();
    },
    'aj-borrar'() { confirmar('¿Borrar todo de este teléfono?', 'Se borran tu rutina y tu calendario de este teléfono. Lo que ya esté en Google Drive se queda ahí.', 'Borrar todo', () => { pararTimer(true); D.salir(); S.borrarTodo(); ui.tab = 'hoy'; ui.ej = null; render(); }, true); },
    'dr-conectar'() { D.entrar(false, 'sync'); },
    'dr-sync'() { sincronizar(true); },
    'dr-salir'() { confirmar('¿Desconectar Google Drive?', 'Tus datos siguen en este teléfono y la copia de Drive no se borra.', 'Desconectar', () => { D.salir(); render(true); }); }
  };

  document.addEventListener('click', ev => {
    const menu = $('#menu'); if (menu) menu.remove();
    if (ev.target === hoja) { cerrar(); return; }
    const el = ev.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const f = acciones[el.dataset.a];
    if (f) f(el, ev);
  });
  // Lo que se escribe se guarda al momento, sin redibujar (para no cerrar el teclado).
  document.addEventListener('input', ev => {
    const el = ev.target, c = el.dataset && el.dataset.c, it = itemActual();
    if (c === 'pick-q') $('#pick-lista').innerHTML = listaPick();
    else if (c === 'se-reps' && it) { it.series[+el.dataset.v].reps = el.value.trim(); S.guardar(); }
    else if (c === 'se-peso' && it) { it.series[+el.dataset.v].peso = el.value.trim().replace(',', '.'); S.guardar(); }
    else if (c === 'ej-nota' && it) { it.nota = el.value; S.guardar(); }
  });
  document.addEventListener('change', ev => {
    const el = ev.target, c = el.dataset && el.dataset.c;
    if (c === 'aj-toggle') { st().settings[el.dataset.k] = el.checked; S.tocar('settings'); }
    else if (c === 'dia-nombre') { const d = st().routine.dias[ui.dia]; if (d.items.length) { d.nombre = el.value.trim() || 'Entrenamiento'; S.tocar('routine'); } }
    else if (c === 'se-reps' || c === 'se-peso' || c === 'ej-nota') S.tocar('routine');
  });
  // ---------- Teclado propio para repeticiones y peso (como el de la app de referencia) ----------
  const tec = document.createElement('div'); tec.id = 'tec'; tec.hidden = true;
  tec.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => '<button data-k="' + n + '" style="grid-area:k' + n + '">' + n + '</button>').join('') +
    '<button data-k="oc" style="grid-area:oc" aria-label="Cerrar teclado"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>' +
    '<span class="pm" style="grid-area:pm"><button data-k="-" aria-label="Restar">−</button><button data-k="+" aria-label="Sumar">+</button></span>' +
    '<button data-k="." style="grid-area:pt" aria-label="Punto decimal">.</button>' +
    '<button data-k="br" style="grid-area:br" aria-label="Borrar"><svg viewBox="0 0 24 24"><path d="M9 6h10a1 1 0 011 1v10a1 1 0 01-1 1H9l-5-6zM12 10l4 4M16 10l-4 4"/></svg></button>' +
    '<button data-k="sg" class="sig" style="grid-area:sg" aria-label="Siguiente"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>';
  app.appendChild(tec);
  let campo = null, fresco = false, sucio = false;
  function quitarTodas() { vista.querySelectorAll('.st-todas').forEach(n => n.remove()); }
  // Debajo de la serie que se está cambiando: un botón para poner ese mismo número en todas.
  function ponerTodas(el) {
    quitarTodas();
    const it = itemActual(), fila = el.closest('.st-fila');
    if (!it || !fila || it.series.length < 2 || !el.dataset.c) return;
    const d = document.createElement('div'); d.className = 'st-todas';
    d.innerHTML = '<button data-todas="1">Cambiar todas las series</button>';
    fila.after(d);
  }
  function aplicarTodas() {
    const el = campo || document.activeElement, it = itemActual();
    if (!it || !el || !el.dataset || !/^se-(reps|peso)$/.test(el.dataset.c || '')) return;
    const k = el.dataset.c === 'se-peso' ? 'peso' : 'reps', v = el.value.trim().replace(',', '.'), tipo = it.series[+el.dataset.v].tipo === 'c';
    it.series.forEach((se, i) => {
      if ((se.tipo === 'c') !== tipo) return;
      se[k] = v;
      const o = vista.querySelector('input[data-c="' + el.dataset.c + '"][data-v="' + i + '"]');
      if (o && o !== el) { o.value = v; o.classList.remove('cambia'); void o.offsetWidth; o.classList.add('cambia'); }
    });
    S.tocar('routine'); toque('fuerte'); fresco = true;
  }
  function tecAbrir(el) {
    campo = el; fresco = true; tec.hidden = false; app.classList.add('con-tec');
    tec.querySelector('[data-k="."]').disabled = el.dataset.c !== 'se-peso';
    setTimeout(() => { if (campo === el) el.scrollIntoView({ block: 'center', behavior: quieto ? 'auto' : 'smooth' }); }, 80);
  }
  function tecCerrar() { campo = null; tec.hidden = true; app.classList.remove('con-tec'); }
  function tecla(k) {
    const el = campo; if (!el) return;
    let v = el.value;
    if (k === 'oc') { el.blur(); return; }
    if (k === 'sg') { const l = [...vista.querySelectorAll('input.num')], n = l[l.indexOf(el) + 1]; if (n) n.focus(); else el.blur(); toque('sel'); return; }
    if (k === 'br') v = fresco ? '' : v.slice(0, -1);
    else if (k === '+' || k === '-') {
      const paso = el.dataset.c === 'se-peso' ? (uni(itemActual()) === 'kg' ? 2.5 : 5) : 1;
      v = String(Math.round(Math.max(0, (parseFloat(v) || 0) + (k === '+' ? paso : -paso)) * 100) / 100);
    } else if (k === '.') { if (fresco || !v) v = '0.'; else if (v.indexOf('.') < 0) v += '.'; else return; }
    else { v = fresco || v === '0' ? k : v + k; if (v.length > 6) return; }
    fresco = false; sucio = true; el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true })); toque('suave');
  }
  // pointerdown + preventDefault: la tecla responde al instante y el número no pierde el foco.
  tec.addEventListener('pointerdown', ev => { ev.preventDefault(); const b = ev.target.closest('[data-k]'); if (b && !b.disabled) { b.classList.remove('pulso'); void b.offsetWidth; b.classList.add('pulso'); tecla(b.dataset.k); } });
  tec.addEventListener('mousedown', ev => ev.preventDefault());
  document.addEventListener('pointerdown', ev => { const b = ev.target.closest && ev.target.closest('[data-todas]'); if (b) { ev.preventDefault(); aplicarTodas(); } });
  document.addEventListener('mousedown', ev => { if (ev.target.closest && ev.target.closest('[data-todas]')) ev.preventDefault(); });
  document.addEventListener('focusin', ev => {
    const el = ev.target;
    if (!el.classList || !el.classList.contains('num')) return;
    ponerTodas(el);
    if (el.dataset.tec) tecAbrir(el); else if (campo) tecCerrar();
  });
  document.addEventListener('focusout', ev => {
    const el = ev.target;
    if (!el.classList || !el.classList.contains('num')) return;
    if (sucio) { sucio = false; el.dispatchEvent(new Event('change', { bubbles: true })); }
    setTimeout(() => { const a = document.activeElement; if (!a || !a.classList || !a.classList.contains('num')) { quitarTodas(); if (campo) tecCerrar(); } }, 0);
  });

  // ---------- Arrastrar para cambiar el orden (series y ejercicios) ----------
  let arr = null;
  function moverArr(ev) {
    if (!arr) return;
    if (ev) arr.y = ev.clientY;
    const dy = arr.y - arr.y0 + (vista.scrollTop - arr.s0), alto = arr.alto;
    arr.fila.style.transform = 'translateY(' + dy + 'px) scale(1.02)';
    const centro = arr.cy + dy; let a = arr.de;
    arr.centros.forEach((c, i) => { if (i < arr.de && centro < c) a = Math.min(a, i); if (i > arr.de && centro > c) a = Math.max(a, i); });
    if (a !== arr.a) { arr.a = a; toque('sel'); }
    arr.filas.forEach((f, i) => { if (f !== arr.fila) f.style.transform = arr.de < a && i > arr.de && i <= a ? 'translateY(' + (-alto) + 'px)' : arr.de > a && i >= a && i < arr.de ? 'translateY(' + alto + 'px)' : ''; });
  }
  function bordeArr() {
    if (!arr) return;
    const r = vista.getBoundingClientRect(), v = arr.y < r.top + 70 ? -9 : arr.y > r.bottom - 70 ? 9 : 0;
    if (v) { const y = vista.scrollTop; vista.scrollTop = y + v; if (vista.scrollTop !== y) moverArr(); }
    arr.raf = requestAnimationFrame(bordeArr);
  }
  function soltarArr(cancelar) {
    if (!arr) return;
    const o = arr; arr = null; cancelAnimationFrame(o.raf);
    o.cont.classList.remove('ordenando');
    if (!cancelar && o.a !== o.de) {
      const mueve = l => { l.splice(o.a, 0, l.splice(o.de, 1)[0]); };
      if (o.tipo === 'serie') { const it = itemActual(), act = st().active; mueve(it.series); if (act && act.hechos[it.uid]) { const h = act.hechos[it.uid]; while (h.length < it.series.length) h.push(false); mueve(h); } }
      else mueve(st().routine.dias[ui.dia].items);
      S.tocar('routine'); toque('fuerte'); render(true);
    } else { o.filas.forEach(f => { f.style.transform = ''; }); o.fila.classList.remove('arrastra'); }
  }
  document.addEventListener('pointerdown', ev => {
    const asa = ev.target.closest && ev.target.closest('.asa'); if (!asa || arr) return;
    const fila = asa.closest('[data-fila]'), cont = fila.parentNode, filas = [...cont.children].filter(n => n.hasAttribute('data-fila'));
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const rs = filas.map(f => f.getBoundingClientRect()), de = filas.indexOf(fila);
    arr = { tipo: asa.dataset.arr, fila, cont, filas, de, a: de, y0: ev.clientY, y: ev.clientY, s0: vista.scrollTop, alto: rs[de].height, cy: rs[de].top + rs[de].height / 2, centros: rs.map(r => r.top + r.height / 2) };
    cont.classList.add('ordenando'); fila.classList.add('arrastra');
    try { asa.setPointerCapture(ev.pointerId); } catch (e) { /* no importa */ }
    ev.preventDefault(); toque('fuerte'); arr.raf = requestAnimationFrame(bordeArr);
  });
  document.addEventListener('pointermove', ev => { if (arr) { ev.preventDefault(); moverArr(ev); } }, { passive: false });
  document.addEventListener('pointerup', () => soltarArr(false));
  document.addEventListener('pointercancel', () => soltarArr(true));
  // Para que los botones respondan al dedo (estado :active) también en iPhone.
  document.addEventListener('touchstart', () => {}, { passive: true });

  // Al tocar un número se selecciona completo, para escribir encima sin tener que borrar.
  let recien = null;
  document.addEventListener('focusin', ev => {
    const el = ev.target;
    if (!el.classList || !el.classList.contains('num')) return;
    recien = el; setTimeout(() => { try { el.select(); } catch (e) { /* no importa */ } }, 0);
  });
  document.addEventListener('click', ev => { if (ev.target === recien) { recien = null; try { ev.target.select(); } catch (e) { /* no importa */ } } });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && !hoja.hidden) cerrar();
    if (ev.key === 'Enter' && ev.target.id === 'enc-texto') acciones['enc-sig']();
    if (ev.key === 'Enter' && ev.target.id === 'man-nombre') acciones['manual-ok']();
    if (ev.key === 'Enter' && ev.target.classList && ev.target.classList.contains('num')) ev.target.blur();
    // Con teclado físico (computadora) los números se comportan igual que con el teclado propio.
    if (campo && ev.target === campo && !ev.metaKey && !ev.ctrlKey && (/^[0-9.]$/.test(ev.key) || ev.key === 'Backspace')) { ev.preventDefault(); if (ev.key !== '.' || campo.dataset.c === 'se-peso') tecla(ev.key === 'Backspace' ? 'br' : ev.key); }
  });
  // Cuando sale el teclado, la app se encoge a lo que queda visible (en vez de que toda la ventana se mueva)
  // y se esconden el pie y las pestañas para dejar espacio.
  if (window.visualViewport) {
    const vv = window.visualViewport;
    const ajustar = () => {
      const teclado = vv.height < window.innerHeight - 120;
      document.documentElement.style.setProperty('--alto', Math.round(vv.height) + 'px');
      app.classList.toggle('teclado', teclado);
      const el = document.activeElement;
      if (teclado && el && /INPUT|TEXTAREA/.test(el.tagName) && vista.contains(el)) el.scrollIntoView({ block: 'center' });
      window.scrollTo(0, 0);
    };
    vv.addEventListener('resize', ajustar);
    vv.addEventListener('scroll', () => window.scrollTo(0, 0));
  }
  document.addEventListener('focusout', () => setTimeout(() => window.scrollTo(0, 0), 60));
  // Sin zoom: ni con doble toque ni pellizcando (como una app normal).
  document.addEventListener('gesturestart', ev => ev.preventDefault());
  document.addEventListener('dblclick', ev => ev.preventDefault());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (st().active) A.pantalla(true);
    if (corriendo()) tick(); else automatico();
  });
  window.addEventListener('online', automatico);

  // Subir a Drive unos segundos después de cada cambio (si hay permiso e internet).
  let syncT = null;
  S.alCambiar(() => { clearTimeout(syncT); syncT = setTimeout(() => { if (D.listo() && navigator.onLine && !st().active) sincronizar(false); }, 4000); });

  // ---------- Arranque ----------
  S.cargar();
  const vuelta = D.alVolver();
  D.alVolverNativo = alVolverDeGoogle;
  // El modo sin internet solo se activa en la dirección publicada (https), no al probar en la computadora,
  // para que al editar archivos en VS Code siempre veas la versión nueva. La app nativa no lo necesita.
  const esLocal = /^(localhost|127\.|\[::1\])/.test(location.hostname) && location.search.indexOf('sw=1') < 0;
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !esLocal && !D.nativo) {
    navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).then(() => {
      setTimeout(() => { if (!localStorage.getItem('gym.fotos')) bajarFotos(false); }, 2500);
    }).catch(e => console.warn('Sin modo offline:', e));
  }
  render();
  // Pantalla de carga: se queda un momento y se va con una transición.
  const carga = $('#carga');
  if (carga) setTimeout(() => { carga.classList.add('fuera'); animar(vista, 'fade'); setTimeout(() => carga.remove(), 450); }, 1100);
  if (corriendo()) { if (st().timer.fin > Date.now()) tickT = setInterval(tick, 200); else { st().timer.fin = 0; S.guardar(); } }
  if (vuelta) alVolverDeGoogle(vuelta); else automatico();
})();

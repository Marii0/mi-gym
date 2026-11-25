/* Progreso: junta los entrenamientos guardados, dibuja las gráficas (SVG hecho a mano, sin librerías)
   y calcula el peso sugerido y los ejercicios recomendados para reemplazar otro. */
(function () {
  const G = window.GYM, S = G.Store;
  const LB = 2.20462;
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MES_L = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const EQUIPO_N = { barra: 'Barra', mancuernas: 'Mancuernas', maquina: 'Máquina', maquina2: 'Máquina', polea: 'Polea', cuerpo: 'Sin equipo', barra_fija: 'Barra fija', cardio: 'Cardio' };

  const num = x => { const n = parseFloat(String(x == null ? '' : x).replace(',', '.')); return isFinite(n) ? n : 0; };
  const soloNumero = x => /^\d+([.,]\d+)?$/.test(String(x == null ? '' : x).trim());
  function conv(v, de, a) { return !v || de === a ? v : (a === 'kg' ? v / LB : v * LB); }
  function fecha(iso) { return new Date(iso + 'T12:00:00'); }
  function lunes(iso) { const d = fecha(iso); d.setDate(d.getDate() - (S.diaSemana(d) - 1)); return S.fechaISO(d); }
  function corta(iso) { const d = fecha(iso); return d.getDate() + ' ' + MES[d.getMonth()]; }
  function registros() { const l = S.state.logs; return Object.keys(l).filter(f => l[f] && !l[f].borrado).sort().map(f => l[f]); }
  // 1,284 / 12.9K: números cortos para que quepan en la gráfica.
  function fmt(n) {
    if (n >= 10000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return (Math.round(n * 10) / 10).toLocaleString('es-MX', { maximumFractionDigits: 1 });
  }

  // ---------- Datos ----------
  // Entrenamientos, series, volumen (peso × repeticiones) y minutos, por semana o por mes.
  function general(modo, u) {
    const n = modo === 'mes' ? 6 : 10, hoy = new Date(), cubos = [], idx = {};
    for (let i = n - 1; i >= 0; i--) {
      let clave, etq, largo;
      if (modo === 'mes') {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        clave = S.fechaISO(d).slice(0, 7); etq = MES[d.getMonth()]; largo = i === 0 ? 'Este mes' : MES_L[d.getMonth()] + ' ' + d.getFullYear();
      } else {
        const d = fecha(lunes(S.hoy())); d.setDate(d.getDate() - 7 * i);
        clave = S.fechaISO(d); etq = corta(clave); largo = i === 0 ? 'Esta semana' : i === 1 ? 'La semana pasada' : 'Semana del ' + corta(clave);
      }
      idx[clave] = cubos.length; cubos.push({ clave, etq, largo, ent: 0, series: 0, vol: 0, min: 0 });
    }
    registros().forEach(r => {
      const c = cubos[idx[modo === 'mes' ? r.fecha.slice(0, 7) : lunes(r.fecha)]];
      if (!c) return;
      c.ent++; c.min += r.min || 0;
      (r.items || []).forEach(it => (it.sets || []).forEach(x => {
        if (x.tipo === 'c') return;
        c.series++;
        if (soloNumero(x.reps)) c.vol += conv(num(x.kg), it.u || r.u || 'lb', u) * num(x.reps);
      }));
    });
    cubos.forEach(c => { c.vol = Math.round(c.vol); });
    return cubos;
  }
  // Series por zona del cuerpo en los últimos días.
  function porGrupo(dias) {
    const desde = new Date(); desde.setDate(desde.getDate() - dias);
    const lim = S.fechaISO(desde), t = {};
    registros().forEach(r => {
      if (r.fecha < lim) return;
      (r.items || []).forEach(it => { const g = S.ejercicio(it.ex).grupo, k = (it.sets || []).filter(x => x.tipo !== 'c').length; if (k) t[g] = (t[g] || 0) + k; });
    });
    return Object.keys(t).map(g => ({ g, nombre: G.GRUPOS[g] || 'Otro', n: t[g] })).sort((a, b) => b.n - a.n);
  }
  // Cada vez que se hizo un ejercicio, de la más antigua a la más reciente, con sus números ya sumados.
  function deEjercicio(id, u) {
    return S.historial(id).reverse().map(h => {
      const sets = h.sets.filter(x => x.tipo !== 'c'), de = h.u || 'lb';
      let max = 0, repsMax = 0, vol = 0, reps = 0, tiempo = 0;
      sets.forEach(x => {
        const kg = conv(num(x.kg), de, u), r = num(x.reps);
        if (soloNumero(x.reps)) { reps += r; vol += kg * r; if (kg > max || (kg === max && r > repsMax)) { max = kg; repsMax = r; } }
        else tiempo += r;
      });
      return { fecha: h.fecha, max: Math.round(max * 10) / 10, repsMax, vol: Math.round(vol), reps, tiempo, n: sets.length };
    }).filter(x => x.n);
  }
  // Ejercicios cuyo mejor peso se logró en los últimos 30 días.
  function marcas() {
    const desde = new Date(); desde.setDate(desde.getDate() - 30);
    const lim = S.fechaISO(desde), ids = {}, out = [];
    registros().forEach(r => (r.items || []).forEach(it => { ids[it.ex] = 1; }));
    Object.keys(ids).forEach(id => {
      const h = S.historial(id); if (h.length < 2) return;
      const u = h[0].u || 'lb', l = deEjercicio(id, u);
      let mejor = null, antes = 0;
      l.forEach(x => { if (!mejor || x.max > mejor.max) { antes = mejor ? mejor.max : 0; mejor = x; } });
      if (mejor && mejor.max > 0 && antes > 0 && mejor.fecha >= lim) out.push({ id, nombre: S.ejercicio(id).nombre, peso: mejor.max, reps: mejor.repsMax, u, fecha: mejor.fecha, antes });
    });
    return out.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 5);
  }

  // ---------- Peso sugerido ----------
  // Parte de la última vez: si completaste todas las repeticiones con el peso más alto, sube un paso; si no, repite.
  function sugerir(it, u) {
    const e = S.ejercicio(it.ex);
    if (e.tipo === 'k') return null;
    const ult = S.ultimo(it.ex);
    if (!ult) return null;
    const de = ult.u || 'lb', sets = ult.sets.filter(x => x.tipo !== 'c' && num(x.kg) > 0 && soloNumero(x.reps));
    if (!sets.length) return null;
    const max = Math.max.apply(null, sets.map(x => num(x.kg))), enMax = sets.filter(x => num(x.kg) === max);
    const rango = /(\d+)\s*-\s*(\d+)/.exec(it.nota || ''), plan = (it.series || []).filter(x => x.tipo !== 'c' && soloNumero(x.reps)).map(x => num(x.reps));
    const tope = rango ? +rango[2] : (plan.length ? Math.max.apply(null, plan) : 0);
    const subir = tope > 0 && enMax.length >= Math.min(2, sets.length) && enMax.every(x => num(x.reps) >= tope);
    const paso = u === 'kg' ? 2.5 : 5;
    let peso = de === u ? max : Math.round(conv(max, de, u) / paso) * paso;
    if (subir) peso += paso;
    peso = Math.round(peso * 10) / 10;
    return { peso: String(peso), subir, antes: max, uAntes: de, reps: enMax.map(x => x.reps).join(', '), fecha: ult.fecha, tope };
  }

  // ---------- Ejercicios recomendados para reemplazar otro ----------
  function alternativas(it, dia) {
    const actual = S.ejercicio(it.ex), enc = (S.state.profile && S.state.profile.encuesta) || {};
    const permitido = enc.manual ? null : G.Gen.EQUIPO[enc.equipo], maxNivel = G.Gen.NIVEL_MAX[enc.nivel] || 3;
    const enDia = {}; (dia.items || []).forEach(x => { enDia[x.ex] = 1; });
    const mios = G.Musculos.de(actual)[0], cand = {};
    Object.keys(G.SLOTS).forEach(sl => { const l = G.SLOTS[sl], i = l.indexOf(actual.id); if (i >= 0) l.forEach((id, k) => { if (!(id in cand) || k < cand[id]) cand[id] = k; }); });
    // Ejercicio propio o sin hueco: los de su misma zona.
    if (!Object.keys(cand).length) G.EXERCISES.forEach((e, k) => { if (e.grupo === actual.grupo) cand[e.id] = k; });
    const hechos = {}; registros().forEach(r => (r.items || []).forEach(x => { hechos[x.ex] = 1; }));
    const lista = Object.keys(cand).filter(id => id !== actual.id && !enDia[id]).map(id => {
      const e = S.ejercicio(id), m = G.Musculos.de(e)[0], comun = m.filter(x => mios.indexOf(x) >= 0).length;
      const conEquipo = !permitido || permitido.indexOf(e.equipo) >= 0, cuida = (e.evitar || []).some(x => (enc.molestias || []).indexOf(x) >= 0);
      let p = cand[id] - 4 * comun;
      if (!conEquipo) p += 40;
      if (cuida) p += 60;
      if (e.nivel > maxNivel) p += 8 * (e.nivel - maxNivel);
      if (e.tipo !== actual.tipo) p += 5;
      if (e.equipo === actual.equipo) p += 3;       // si no hay ese aparato, primero opciones con otro equipo
      if (hechos[id]) p -= 2;
      return { e, p, conEquipo, cuida };
    }).sort((a, b) => a.p - b.p);
    return lista.filter(x => !x.cuida).slice(0, 5);
  }
  function equipo(e) { return EQUIPO_N[e.equipo] || ''; }

  // ---------- Gráficas ----------
  const AN = 340, AL = 176, IZQ = 34, DER = 8, ARR = 12, ABA = 24;
  function pasos(max, entero) {
    if (max <= 0) return [0, 1];
    const bruto = max / 3, p = Math.pow(10, Math.floor(Math.log10(bruto))), f = bruto / p;
    let paso = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
    if (entero) paso = Math.max(1, Math.round(paso));
    const t = []; for (let v = 0; v < max + paso * 0.999; v += paso) t.push(+v.toFixed(6));
    return t;
  }
  function rejilla(t, y) {
    return t.map(v => '<line class="g-linea" x1="' + IZQ + '" x2="' + (AN - DER) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="g-eje" x="' + (IZQ - 6) + '" y="' + (y(v) + 3.5) + '" text-anchor="end">' + fmt(v) + '</text>').join('');
  }
  const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  // datos: [{ etq, v, n, u, t }]  etq = texto del eje, v = valor, y n/u/t = lo que se lee al tocar la columna.
  function barras(datos, o) {
    o = o || {};
    const n = datos.length, t = pasos(Math.max.apply(null, datos.map(d => d.v)), o.entero), tope = t[t.length - 1];
    const w = AN - IZQ - DER, h = AL - ARR - ABA, banda = w / n, ancho = Math.min(24, banda - 6), y = v => +(ARR + h - (v / tope) * h).toFixed(1);
    let s = '<svg class="graf-svg" viewBox="0 0 ' + AN + ' ' + AL + '" role="img" aria-label="' + attr(o.titulo || 'Gráfica') + '">' + rejilla(t, y);
    datos.forEach((d, i) => {
      const cx = IZQ + banda * (i + 0.5), x = +(cx - ancho / 2).toFixed(1), yv = y(d.v), alto = ARR + h - yv, r = Math.min(4, alto);
      s += '<g class="g-col' + (i === o.sel ? ' sel' : '') + '" data-a="graf" data-n="' + attr(d.n) + '" data-u="' + attr(d.u) + '" data-t="' + attr(d.t) + '">' +
        '<rect class="g-toque" x="' + (cx - banda / 2).toFixed(1) + '" y="0" width="' + banda.toFixed(1) + '" height="' + AL + '"/>' +
        (d.v > 0 ? '<path class="g-barra" style="animation-delay:' + (i * 28) + 'ms" d="M' + x + ' ' + (ARR + h) + 'V' + (yv + r) + 'q0 -' + r + ' ' + r + ' -' + r + 'h' + (ancho - 2 * r).toFixed(1) + 'q' + r + ' 0 ' + r + ' ' + r + 'V' + (ARR + h) + 'z"/>' : '') +
        ((n <= 7 || (n - 1 - i) % 2 === 0) ? '<text class="g-eje" x="' + cx.toFixed(1) + '" y="' + (AL - 7) + '" text-anchor="middle">' + attr(d.etq) + '</text>' : '') + '</g>';
    });
    return s + '</svg>';
  }
  function linea(datos, o) {
    o = o || {};
    const n = datos.length, vals = datos.map(d => d.v), mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    // El eje no empieza en cero: así se nota el cambio de una sesión a otra.
    const margen = mx === mn ? Math.max(1, mx * 0.1) : (mx - mn) * 0.15;
    let lo = Math.max(0, mn - margen), hi = mx + margen;
    const bruto = (hi - lo) / 3, p = Math.pow(10, Math.floor(Math.log10(bruto))), f = bruto / p, paso = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
    lo = Math.floor(lo / paso) * paso; const t = [];
    for (let v = lo; v < hi + paso * 0.999 && t.length < 6; v += paso) t.push(+v.toFixed(6));
    hi = t[t.length - 1];
    const w = AN - IZQ - DER - 12, h = AL - ARR - ABA, x = i => +(IZQ + 6 + (n === 1 ? w / 2 : (w * i) / (n - 1))).toFixed(1), y = v => +(ARR + h - ((v - lo) / (hi - lo)) * h).toFixed(1);
    const pts = datos.map((d, i) => x(i) + ' ' + y(d.v));
    let s = '<svg class="graf-svg" viewBox="0 0 ' + AN + ' ' + AL + '" role="img" aria-label="' + attr(o.titulo || 'Gráfica') + '">' + rejilla(t, y);
    if (n > 1) s += '<path class="g-area" d="M' + pts.join('L') + 'L' + x(n - 1) + ' ' + (ARR + h) + 'L' + x(0) + ' ' + (ARR + h) + 'z"/><path class="g-traza" pathLength="1" d="M' + pts.join('L') + '"/>';
    const banda = n === 1 ? w : w / (n - 1), rotulos = n <= 2 ? datos.map((d, i) => i) : [0, Math.floor((n - 1) / 2), n - 1];
    datos.forEach((d, i) => {
      s += '<g class="g-col' + (i === o.sel ? ' sel' : '') + '" data-a="graf" data-n="' + attr(d.n) + '" data-u="' + attr(d.u) + '" data-t="' + attr(d.t) + '">' +
        '<rect class="g-toque" x="' + (x(i) - banda / 2).toFixed(1) + '" y="0" width="' + banda.toFixed(1) + '" height="' + AL + '"/>' +
        '<line class="g-guia" x1="' + x(i) + '" x2="' + x(i) + '" y1="' + ARR + '" y2="' + (ARR + h) + '"/>' +
        '<circle class="g-punto" cx="' + x(i) + '" cy="' + y(d.v) + '" r="' + (n > 14 ? 3 : 4) + '"/>' +
        (rotulos.indexOf(i) >= 0 && (n < 3 || i === 0 || i === n - 1 || n >= 5) ? '<text class="g-eje" x="' + x(i) + '" y="' + (AL - 7) + '" text-anchor="' + (n === 1 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '">' + attr(d.etq) + '</text>' : '') + '</g>';
    });
    return s + '</svg>';
  }

  G.Prog = { num, conv, fmt, corta, lunes, general, porGrupo, deEjercicio, marcas, sugerir, alternativas, equipo, barras, linea };
})();

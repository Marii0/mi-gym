/* Rutina con inteligencia artificial (opcional).
   La app llama directo a Gemini (Google, tiene nivel gratis) o a Claude (Anthropic, de pago) con la clave
   que la persona pegue en la app. La clave se guarda solo en este teléfono: no se sube a Google Drive.
   La IA solo puede elegir ejercicios del catálogo de la app; todo lo que devuelve se revisa antes de usarlo. */
(function () {
  const G = window.GYM;
  const LLAVE = 'gym.ia';
  const PROVEEDORES = {
    gemini: { nombre: 'Gemini (Google)', gratis: true, clave: 'https://aistudio.google.com/apikey' },
    claude: { nombre: 'Claude (Anthropic)', gratis: false, clave: 'https://console.anthropic.com/settings/keys' }
  };
  const ESFUERZO = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' };

  function config() {
    let c = {};
    try { c = JSON.parse(localStorage.getItem(LLAVE) || '{}'); } catch (e) { c = {}; }
    return Object.assign({ proveedor: 'gemini', claves: {}, modelos: {}, modelo: {}, esfuerzo: 'medio' }, c);
  }
  function guardar(c) { try { localStorage.setItem(LLAVE, JSON.stringify(c)); } catch (e) { /* sin espacio */ } }
  function listo() { const c = config(); return !!(c.claves[c.proveedor] || '').trim(); }

  // Llamada HTTP: fetch normal y, en la app nativa, el HTTP de Capacitor si fetch falla por CORS.
  async function http(url, opciones) {
    try {
      const r = await fetch(url, opciones);
      const txt = await r.text();
      return { status: r.status, txt };
    } catch (e) {
      const P = window.Capacitor && window.Capacitor.Plugins;
      if (!P || !P.CapacitorHttp) throw new Error('sin-internet');
      const r = await P.CapacitorHttp.request({ url, method: opciones.method || 'GET', headers: opciones.headers || {}, data: opciones.body ? JSON.parse(opciones.body) : undefined });
      return { status: r.status, txt: typeof r.data === 'string' ? r.data : JSON.stringify(r.data) };
    }
  }
  function error(status, txt) {
    let m = '';
    try { const j = JSON.parse(txt); m = (j.error && (j.error.message || j.error.type)) || ''; } catch (e) { m = (txt || '').slice(0, 160); }
    if (status === 400 && /api key|API_KEY/i.test(m)) return new Error('La clave no es válida. Revísala en Ajustes de IA.');
    if (status === 401 || status === 403) return new Error('La clave no es válida o no tiene permiso.');
    if (status === 429) return new Error('Llegaste al límite de uso por ahora. Espera un rato o usa un modelo más ligero.');
    if (status === 402 || /credit|billing/i.test(m)) return new Error('Tu cuenta de ' + (/anthropic/i.test(m) ? 'Claude' : 'la IA') + ' no tiene saldo.');
    return new Error('La IA respondió con un error (' + status + '). ' + m);
  }

  // Modelos disponibles para la clave (se piden a cada servicio para no depender de nombres que cambian).
  async function modelos(proveedor, clave) {
    if (proveedor === 'gemini') {
      const r = await http('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': clave } });
      if (r.status !== 200) throw error(r.status, r.txt);
      const l = (JSON.parse(r.txt).models || [])
        .filter(m => (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0 && /^models\/gemini/.test(m.name) && !/image|tts|audio|embed|live|vision|robotics|computer/i.test(m.name))
        .map(m => ({ id: m.name.replace('models/', ''), nombre: m.displayName || m.name.replace('models/', '') }));
      return ordenar(l);
    }
    const r = await http('https://api.anthropic.com/v1/models?limit=100', { headers: cabClaude(clave) });
    if (r.status !== 200) throw error(r.status, r.txt);
    return ordenar((JSON.parse(r.txt).data || []).map(m => ({ id: m.id, nombre: m.display_name || m.id })));
  }
  // Primero los rápidos y baratos ("flash", "haiku"), luego el resto; dentro de cada grupo, los más nuevos.
  function ordenar(l) {
    const ver = id => { const m = /(\d+(?:[.-]\d+)?)/.exec(id); return m ? parseFloat(m[1].replace('-', '.')) : 0; };
    const peso = id => /preview|exp/.test(id) ? 2 : /flash|haiku|sonnet/.test(id) ? 0 : 1;
    return l.sort((a, b) => peso(a.id) - peso(b.id) || ver(b.id) - ver(a.id) || a.id.localeCompare(b.id));
  }
  function cabClaude(clave) {
    return { 'x-api-key': clave, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json' };
  }

  // ---------- Lo que se le pide a la IA ----------
  function catalogo() {
    return G.EXERCISES.map(e => [e.id, e.nombre, e.grupo, e.equipo, e.nivel, e.tipo === 'k' ? 'cardio' : e.tipo === 'c' ? 'compuesto' : e.tipo === 'n' ? 'isometrico/core' : 'aislado', (e.evitar || []).join('/')].join(' | ')).join('\n');
  }
  function perfil(enc) {
    if (!enc) return 'Sin encuesta.';
    const r = [];
    r.push('Objetivo: ' + (G.Gen.OBJ[enc.objetivo] || enc.objetivo));
    r.push('Nivel: ' + enc.nivel);
    if (enc.dias && enc.dias.length) r.push('Días libres: ' + enc.dias.map(d => G.Gen.DIAS[d]).join(', '));
    if (enc.minutos) r.push('Minutos por sesión: ' + enc.minutos);
    r.push('Lugar: ' + ({ completo: 'gimnasio completo', basico: 'gimnasio básico', casa: 'casa con mancuernas', nada: 'sin equipo' }[enc.equipo] || enc.equipo));
    if (enc.cardio) r.push('Cardio: ' + ({ auto: 'lo que convenga', final: 'al final de cada sesión', dias: 'en días aparte', no: 'no quiere cardio' }[enc.cardio]) + (enc.cardioTipo && enc.cardioTipo !== 'cualquiera' ? ' (prefiere ' + enc.cardioTipo + ')' : ''));
    if ((enc.molestias || []).length) r.push('Molestias a cuidar: ' + enc.molestias.join(', '));
    if ((enc.zonas || []).length) r.push('Zonas a enfatizar: ' + enc.zonas.join(', '));
    if (enc.edad) r.push('Edad: ' + enc.edad);
    if (enc.peso) r.push('Peso: ' + enc.peso + ' kg');
    if (enc.estatura) r.push('Estatura: ' + enc.estatura + ' cm');
    return r.join('\n');
  }
  function instrucciones(alcance) {
    return 'Eres un entrenador personal certificado. Diseñas rutinas de gimnasio seguras y basadas en evidencia, en español de México.\n' +
      'Reglas:\n' +
      '- Usa SOLO ejercicios del catálogo, por su id exacto. No inventes ids.\n' +
      '- Respeta el equipo disponible, el nivel y las molestias (no uses ejercicios cuya columna "evitar" incluya una molestia de la persona).\n' +
      '- Ajusta series, repeticiones y descansos al objetivo (fuerza: pocas repeticiones y descansos largos; músculo: 6-12; grasa/salud: más repeticiones y descansos cortos).\n' +
      '- Cada sesión debe caber en los minutos disponibles. Descanso entre series de 0 a 300 segundos.\n' +
      '- Las repeticiones van como texto: un número ("10") o tiempo ("30 s", "15 min" para cardio).\n' +
      '- Marca como "c" (calentamiento) solo las series de aproximación al inicio de un ejercicio compuesto; las demás "n".\n' +
      '- Los días son números: 1=Lunes ... 7=Domingo. ' + (alcance === 'dia' ? 'Devuelve SOLO el día que se pide.' : 'Devuelve los 7 días; los de descanso con lista vacía.') + '\n' +
      'Responde SOLO con JSON válido, sin texto extra, con esta forma:\n' +
      '{"explicacion":"2 a 4 frases de por qué la armaste así","dias":{"1":{"nombre":"Torso A","ejercicios":[{"id":"press_banca","descanso":120,"nota":"","series":[{"reps":"10","tipo":"c"},{"reps":"8","tipo":"n"}]}]}}}';
  }
  function mensaje(o) {
    return 'Catálogo (id | nombre | zona | equipo | nivel 1-3 | tipo | evitar si hay molestia en):\n' + catalogo() +
      '\n\nDatos de la persona:\n' + (o.usarPerfil ? perfil(o.encuesta) : 'No quiso compartir sus datos.') +
      (o.alcance === 'dia' ? '\n\nArma solo el día ' + o.dia + ' (' + G.Gen.DIAS[o.dia - 1] + ').' : '') +
      (o.actual ? '\n\nRutina actual (por si la quiere modificar):\n' + o.actual : '') +
      '\n\nLo que pide: ' + (o.pedido || 'Arma la mejor rutina para mí.');
  }
  function rutinaComoTexto(rutina) {
    if (!rutina) return '';
    return Object.keys(rutina.dias).map(d => {
      const x = rutina.dias[d];
      return d + ' ' + G.Gen.DIAS[d - 1] + ': ' + (x.items.length ? x.nombre + ' — ' + x.items.map(it => it.ex + ' ' + it.series.length + 'x' + (it.series[0] || {}).reps).join(', ') : 'descanso');
    }).join('\n');
  }

  async function llamar(o) {
    const c = config(), clave = (c.claves[c.proveedor] || '').trim(), modelo = c.modelo[c.proveedor];
    if (!clave) throw new Error('Falta la clave de la IA.');
    if (!modelo) throw new Error('Elige un modelo.');
    if (!navigator.onLine) throw new Error('Necesitas internet para usar la IA.');
    const sis = instrucciones(o.alcance), msj = mensaje(o);
    if (c.proveedor === 'gemini') {
      const nivel = { bajo: 'low', medio: 'medium', alto: 'high' }[c.esfuerzo];
      const presupuesto = { bajo: 1024, medio: 4096, alto: 12000 }[c.esfuerzo];
      // Gemini 3 usa "thinkingLevel"; Gemini 2.5 usa "thinkingBudget". Si el modelo no acepta ninguno, se pide sin él.
      const pensar = /gemini-[3-9]/.test(modelo) ? { thinkingLevel: nivel === 'medium' ? 'high' : nivel } : /2\.5/.test(modelo) ? { thinkingBudget: presupuesto } : null;
      const cuerpo = t => JSON.stringify({ systemInstruction: { parts: [{ text: sis }] }, contents: [{ role: 'user', parts: [{ text: msj }] }],
        generationConfig: Object.assign({ responseMimeType: 'application/json', temperature: 0.6 }, t ? { thinkingConfig: t } : {}) });
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelo) + ':generateContent';
      const cab = { 'x-goog-api-key': clave, 'Content-Type': 'application/json' };
      let r = await http(url, { method: 'POST', headers: cab, body: cuerpo(pensar) });
      if (r.status === 400 && pensar) r = await http(url, { method: 'POST', headers: cab, body: cuerpo(null) });
      if (r.status !== 200) throw error(r.status, r.txt);
      const j = JSON.parse(r.txt), partes = ((j.candidates || [])[0] || {}).content;
      const txt = ((partes && partes.parts) || []).filter(p => !p.thought).map(p => p.text || '').join('');
      if (!txt) throw new Error('La IA no respondió. Intenta otra vez.');
      return txt;
    }
    const presupuesto = { bajo: 0, medio: 4000, alto: 12000 }[c.esfuerzo];
    const cuerpo = p => JSON.stringify(Object.assign({ model: modelo, max_tokens: 6000 + p, system: sis, messages: [{ role: 'user', content: msj }] },
      p ? { thinking: { type: 'enabled', budget_tokens: p } } : { temperature: 0.6 }));
    let r = await http('https://api.anthropic.com/v1/messages', { method: 'POST', headers: cabClaude(clave), body: cuerpo(presupuesto) });
    if (r.status === 400 && presupuesto) r = await http('https://api.anthropic.com/v1/messages', { method: 'POST', headers: cabClaude(clave), body: cuerpo(0) });
    if (r.status !== 200) throw error(r.status, r.txt);
    return (JSON.parse(r.txt).content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  }

  // Revisa la respuesta: solo ejercicios que existen, números en rangos sanos y formato de la app.
  function convertir(txt, o) {
    const ini = txt.indexOf('{'), fin = txt.lastIndexOf('}');
    if (ini < 0 || fin < ini) throw new Error('La IA no devolvió una rutina. Intenta otra vez.');
    let j;
    try { j = JSON.parse(txt.slice(ini, fin + 1)); } catch (e) { throw new Error('La respuesta de la IA vino incompleta. Intenta otra vez.'); }
    const molestias = (o.encuesta && o.encuesta.molestias) || [], dias = {}, quitados = [];
    let total = 0;
    Object.keys(j.dias || {}).forEach(k => {
      const n = parseInt(k, 10);
      if (!(n >= 1 && n <= 7)) return;
      if (o.alcance === 'dia' && n !== o.dia) return;
      const x = j.dias[k] || {}, items = [];
      (x.ejercicios || []).forEach(ej => {
        const e = G.EX[ej && ej.id];
        if (!e) { if (ej && ej.id) quitados.push(ej.id); return; }
        if (o.usarPerfil && e.evitar.some(m => molestias.indexOf(m) >= 0)) { quitados.push(e.nombre); return; }
        let series = (Array.isArray(ej.series) ? ej.series : []).slice(0, 8).map(s => ({
          reps: String((s && s.reps) || '10').slice(0, 14), peso: '', tipo: s && s.tipo === 'c' ? 'c' : 'n' }));
        if (!series.length) series = [{ reps: '10', peso: '', tipo: 'n' }, { reps: '10', peso: '', tipo: 'n' }, { reps: '10', peso: '', tipo: 'n' }];
        const rest = Math.max(0, Math.min(300, Math.round((parseInt(ej.descanso, 10) || 0) / 5) * 5));
        items.push({ uid: G.Gen.uid(), ex: e.id, rest: e.tipo === 'k' ? 0 : rest, nota: String(ej.nota || '').slice(0, 200), series });
      });
      total += items.length;
      dias[n] = { nombre: items.length ? String(x.nombre || 'Entrenamiento').slice(0, 50) : 'Descanso', items };
    });
    if (!total) throw new Error('La IA no armó ningún ejercicio válido. Intenta pedirlo de otra forma.');
    return { dias, explicacion: String(j.explicacion || '').slice(0, 600), quitados };
  }

  async function generar(o) { return convertir(await llamar(o), o); }

  G.IA = { PROVEEDORES, ESFUERZO, config, guardar, listo, modelos, generar, rutinaComoTexto, _convertir: convertir, _mensaje: mensaje };
})();

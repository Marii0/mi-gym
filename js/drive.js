/* Google Drive como "servidor".
   - Inicio de sesión con Google por redirección (no necesita librerías ni servidor propio).
   - Permiso "drive.file": la app solo puede ver los archivos que ella misma crea.
   - Estructura en Drive:  GymApp / <nombre de la persona> / datos.json
   La app siempre guarda primero en el teléfono; aquí solo se sube y se combina cuando hay internet. */
(function () {
  const G = window.GYM, S = G.Store;
  const SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const K_TOKEN = 'gym.token', K_ESTADO = 'gym.oauth', K_INTENTO = 'gym.intento', K_DESPUES = 'gym.despues';
  const API = 'https://www.googleapis.com/drive/v3';
  const SUBIDA = 'https://www.googleapis.com/upload/drive/v3';
  const CARPETA = 'application/vnd.google-apps.folder';

  function configurado() { return /\.apps\.googleusercontent\.com$/.test((G.CONFIG.GOOGLE_CLIENT_ID || '').trim()); }
  function urlApp() { return location.origin + location.pathname.replace(/index\.html$/, ''); }

  function token() {
    try {
      const t = JSON.parse(localStorage.getItem(K_TOKEN) || 'null');
      return t && t.vence > Date.now() + 60000 ? t.valor : null;
    } catch (e) { return null; }
  }

  // Manda a la pantalla de Google. silencioso = renueva el permiso sin preguntar nada.
  function entrar(silencioso, despues) {
    if (!configurado()) return false;
    const estado = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(K_ESTADO, estado);
    localStorage.setItem(K_DESPUES, despues || 'sync');
    if (silencioso) localStorage.setItem(K_INTENTO, String(Date.now()));
    const p = new URLSearchParams({
      client_id: G.CONFIG.GOOGLE_CLIENT_ID.trim(), redirect_uri: urlApp(), response_type: 'token',
      scope: SCOPE, include_granted_scopes: 'true', state: estado
    });
    if (silencioso) { p.set('prompt', 'none'); if (S.state.sync.correo) p.set('login_hint', S.state.sync.correo); }
    else p.set('prompt', 'select_account');
    location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + p.toString();
    return true;
  }

  // Al volver de Google, la respuesta viene en la dirección (#access_token=...).
  function alVolver() {
    if (!/access_token=|error=/.test(location.hash)) return null;
    const p = new URLSearchParams(location.hash.slice(1));
    history.replaceState(null, '', location.pathname + location.search);
    const esperado = localStorage.getItem(K_ESTADO);
    localStorage.removeItem(K_ESTADO);
    const despues = localStorage.getItem(K_DESPUES) || 'sync';
    if (!esperado || p.get('state') !== esperado) return { ok: false, error: 'estado' };
    if (p.get('access_token')) {
      localStorage.setItem(K_TOKEN, JSON.stringify({ valor: p.get('access_token'), vence: Date.now() + (parseInt(p.get('expires_in'), 10) || 3600) * 1000 }));
      S.state.sync.conectado = true; S.guardar();
      return { ok: true, despues };
    }
    return { ok: false, error: p.get('error'), despues };
  }

  function salir() {
    localStorage.removeItem(K_TOKEN);
    Object.assign(S.state.sync, { conectado: false, carpeta: null, archivo: null, correo: null });
    S.guardar();
  }

  async function pedir(url, opciones) {
    const t = token();
    if (!t) throw new Error('sin-permiso');
    const o = Object.assign({}, opciones || {});
    o.headers = Object.assign({ Authorization: 'Bearer ' + t }, o.headers || {});
    const r = await fetch(url, o);
    if (r.status === 401) { localStorage.removeItem(K_TOKEN); throw new Error('sin-permiso'); }
    return r;
  }
  async function json(url, opciones) {
    const r = await pedir(url, opciones);
    if (!r.ok) throw new Error('drive-' + r.status);
    return r.json();
  }
  function q(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

  async function buscar(nombre, padre, tipo) {
    let cond = "name='" + q(nombre) + "' and trashed=false";
    if (tipo) cond += " and mimeType='" + tipo + "'";
    if (padre) cond += " and '" + padre + "' in parents";
    const d = await json(API + '/files?fields=files(id,name)&pageSize=10&q=' + encodeURIComponent(cond));
    return d.files && d.files[0] ? d.files[0].id : null;
  }
  async function crearCarpeta(nombre, padre) {
    const cuerpo = { name: nombre, mimeType: CARPETA };
    if (padre) cuerpo.parents = [padre];
    const d = await json(API + '/files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
    return d.id;
  }
  async function carpetaRaiz(crear) {
    const n = G.CONFIG.CARPETA_DRIVE || 'GymApp';
    return (await buscar(n, null, CARPETA)) || (crear ? crearCarpeta(n, null) : null);
  }
  function nombreCarpeta() {
    return ((S.state.profile && S.state.profile.nombre) || 'Sin nombre').replace(/[\\/]/g, ' ').trim().slice(0, 60) || 'Sin nombre';
  }

  // Carpetas de personas que ya existen en este Drive (para recuperar datos en un teléfono nuevo).
  async function perfiles() {
    const raiz = await carpetaRaiz(false);
    if (!raiz) return [];
    const d = await json(API + '/files?fields=files(id,name)&pageSize=50&q=' + encodeURIComponent("'" + raiz + "' in parents and mimeType='" + CARPETA + "' and trashed=false"));
    return d.files || [];
  }

  async function leer(archivo) {
    const r = await pedir(API + '/files/' + archivo + '?alt=media');
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('drive-' + r.status);
    return r.json();
  }

  async function recuperar(carpeta) {
    const archivo = await buscar('datos.json', carpeta.id, null);
    const datos = archivo ? await leer(archivo) : null;
    if (!datos || !datos.profile) return false;
    S.combinar(datos);
    Object.assign(S.state.sync, { carpeta: carpeta.id, archivo, ultima: Date.now(), pendiente: false, conectado: true });
    S.guardar();
    return true;
  }

  let ocupado = false;
  // Baja la copia de Drive, la combina con la del teléfono y sube el resultado.
  async function sincronizar() {
    if (ocupado || !S.state.profile) return { ok: false, motivo: 'ocupado' };
    if (!configurado()) return { ok: false, motivo: 'sin-configurar' };
    if (!navigator.onLine) return { ok: false, motivo: 'sin-internet' };
    if (!token()) return { ok: false, motivo: 'sin-permiso' };
    ocupado = true;
    const m = S.state.sync;
    try {
      if (!m.correo) {
        try { const a = await json(API + '/about?fields=user(emailAddress,displayName)'); m.correo = a.user.emailAddress; } catch (e) { /* no es indispensable */ }
      }
      if (!m.carpeta) {
        const raiz = await carpetaRaiz(true);
        m.carpeta = (await buscar(nombreCarpeta(), raiz, CARPETA)) || (await crearCarpeta(nombreCarpeta(), raiz));
      }
      if (!m.archivo) m.archivo = await buscar('datos.json', m.carpeta, null);
      let cambio = false;
      if (m.archivo) {
        const remoto = await leer(m.archivo);
        if (remoto === null) m.archivo = null; else cambio = S.combinar(remoto);
      }
      const cuerpo = JSON.stringify(S.paquete());
      if (m.archivo) {
        const r = await pedir(SUBIDA + '/files/' + m.archivo + '?uploadType=media', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: cuerpo });
        if (!r.ok) throw new Error('drive-' + r.status);
      } else {
        const sep = 'gym' + Date.now();
        const meta = JSON.stringify({ name: 'datos.json', parents: [m.carpeta], mimeType: 'application/json' });
        const multi = '--' + sep + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n--' + sep + '\r\nContent-Type: application/json\r\n\r\n' + cuerpo + '\r\n--' + sep + '--';
        const d = await json(SUBIDA + '/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + sep }, body: multi });
        m.archivo = d.id;
      }
      m.ultima = Date.now(); m.pendiente = false; m.conectado = true;
      S.guardar();
      return { ok: true, cambio };
    } catch (e) {
      if (/drive-404/.test(e.message)) { m.carpeta = null; m.archivo = null; S.guardar(); }
      return { ok: false, motivo: e.message === 'sin-permiso' ? 'sin-permiso' : 'error', detalle: e.message };
    } finally { ocupado = false; }
  }

  // ¿Conviene renovar el permiso solo? (hay internet, ya estaba conectado, hay cambios y no se intentó hace poco)
  function puedeRenovarSolo() {
    const ult = parseInt(localStorage.getItem(K_INTENTO) || '0', 10);
    return configurado() && navigator.onLine && S.state.sync.conectado && S.state.sync.pendiente && !token() && !S.state.active && Date.now() - ult > 10 * 60000;
  }

  G.Drive = { configurado, urlApp, token, entrar, alVolver, salir, sincronizar, perfiles, recuperar, puedeRenovarSolo };
})();

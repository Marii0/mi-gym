/* Configuración de la app. Es el único archivo que necesitas tocar para conectar Google Drive. */
window.GYM = window.GYM || {};
window.GYM.CONFIG = {
  // Pega aquí el "ID de cliente" de Google Cloud (termina en .apps.googleusercontent.com).
  // Mientras esté vacío, la app funciona igual pero guarda todo solo en el teléfono.
  GOOGLE_CLIENT_ID: '',

  // Carpeta que la app crea en Google Drive. Adentro hace una carpeta por persona.
  CARPETA_DRIVE: 'GymApp'
};

/* Configuración de la app. Es el único archivo que necesitas tocar para conectar Google Drive. */
window.GYM = window.GYM || {};
window.GYM.CONFIG = {
  // Pega aquí el "ID de cliente" de Google Cloud (termina en .apps.googleusercontent.com).
  // Mientras esté vacío, la app funciona igual pero guarda todo solo en el teléfono.
  GOOGLE_CLIENT_ID: '283440133814-lt914c7ukc2qf5aumb3rrklqeeqknbr9.apps.googleusercontent.com',

  // ID de cliente de tipo "iOS" para la app nativa (la que se instala con el archivo .ipa).
  GOOGLE_IOS_CLIENT_ID: '283440133814-2derirs7fgn94jqc0fcuj0j9514n117t.apps.googleusercontent.com',

  // Carpeta que la app crea en Google Drive. Adentro hace una carpeta por persona.
  CARPETA_DRIVE: 'GymApp'
};

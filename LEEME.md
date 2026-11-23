# Mi Gym

App web instalable en iPhone (se agrega a la pantalla de inicio y abre como cualquier app).
Guarda todo en el teléfono, funciona sin internet y, cuando hay conexión, sube una copia a Google Drive.

## Qué hace

- Encuesta de 9 preguntas y rutina semanal armada según objetivo, nivel, días libres, tiempo, equipo y molestias.
- Si el horario no alcanza para el plan ideal, propone opciones que se acercan lo más posible.
- 96 ejercicios con dos fotos cada uno (inicio y final del movimiento) y tips.
- Entrenamiento guiado: anotas peso y repeticiones, tocas "Terminé la serie" y arranca el descanso. Al terminar suena un pitido (bocina o audífonos) y sigue la siguiente serie o ejercicio.
- Calendario con los días entrenados.
- Todo se puede cambiar: ejercicios, series, repeticiones, descansos, nombres, tips, fotos y días.
- Una carpeta por persona en Drive: `GymApp/<nombre>/datos.json`.

## 1. Probarla en la computadora

1. Abre esta carpeta en VS Code.
2. Instala la extensión **Live Server**.
3. Clic derecho en `index.html` y elige **Open with Live Server**.

En la computadora no se activa el modo sin internet, así los cambios que hagas se ven al recargar.

## 2. Publicarla (gratis, con GitHub Pages)

El iPhone necesita una dirección `https` para instalarla.

1. Crea un repositorio público en GitHub, por ejemplo `mi-gym`, y sube todo el contenido de esta carpeta.
2. En el repositorio: **Settings > Pages > Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. La app queda en `https://TU_USUARIO.github.io/mi-gym/`.

El código es público, pero tus datos no: viven en tu teléfono y en tu Drive.

## 3. Conectar Google Drive (una sola vez)

1. Entra a <https://console.cloud.google.com> y elige o crea un proyecto.
2. Activa la **Google Drive API** (APIs y servicios > Biblioteca).
3. Configura la pantalla de consentimiento de OAuth como **Externa** y agrega como usuarios de prueba tu correo y el de tu novia.
4. Crea un **ID de cliente de OAuth** de tipo **Aplicación web**.
   En **URIs de redireccionamiento autorizados** pon la dirección exacta de la app, con la diagonal final:
   `https://TU_USUARIO.github.io/mi-gym/`
   (para probar en la computadora agrega también `http://127.0.0.1:5500/`).
5. Copia el ID de cliente (termina en `.apps.googleusercontent.com`) y pégalo en `js/config.js`.
6. Sube el cambio y aumenta `VERSION` en `sw.js` (ver abajo).

La app pide solo el permiso `drive.file`: únicamente puede ver los archivos que ella misma crea.

Cada quien entra con su propia cuenta de Google y su carpeta queda en su propio Drive.
Si prefieren que las dos carpetas estén en el mismo Drive, entren los dos con la misma cuenta.

## 4. Instalarla en el iPhone

1. Con wifi, abre la dirección de la app en **Safari**.
2. Botón Compartir > **Agregar a inicio**.
3. Ábrela desde el ícono. La primera vez descarga las fotos (unos 4 MB) para que después no gaste datos.
   En Ajustes > Uso sin internet se ve cuántas fotos lleva.

## Cuando cambies algo de la app

Los teléfonos guardan una copia de la app para abrir sin internet. Para que bajen la versión nueva,
cambia `VERSION` en `sw.js` (de `v1` a `v2`, etc.) cada vez que subas cambios.

## Dónde está cada cosa

| Archivo | Para qué |
| --- | --- |
| `js/config.js` | ID de cliente de Google y nombre de la carpeta en Drive |
| `js/exercises.js` | Catálogo de ejercicios, tips y qué ejercicio puede ir en cada parte de la sesión |
| `js/generator.js` | Reglas que arman la rutina: días ideales, series, repeticiones, descansos |
| `js/app.js` | Pantallas y botones |
| `js/store.js` | Cómo se guardan los datos en el teléfono |
| `js/drive.js` | Inicio de sesión con Google y copia en Drive |
| `js/audio.js` | Pitido y pantalla encendida |
| `css/styles.css` | Colores y diseño |
| `img/ex/` | Fotos de los ejercicios |

## Límites que conviene saber

- El pitido suena con la app abierta. Por eso la app mantiene la pantalla encendida durante el entrenamiento.
  Con el iPhone bloqueado, iOS pausa las apps web y el pitido no puede sonar; al volver a la app suena de inmediato si el descanso ya terminó.
- Con el iPhone en modo silencio, el pitido no suena a menos que actives "Sonar aunque el iPhone esté en silencio" en Ajustes (esa opción puede pausar tu música mientras suena).
- La copia a Drive se hace con la app abierta. Si entrenaste sin internet, se sube la siguiente vez que la abras con conexión.

## Créditos

Fotos de los ejercicios: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), dominio público (Unlicense).
Tipografía: Barlow Condensed (SIL Open Font License).

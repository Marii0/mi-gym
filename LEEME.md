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

## Dos formas de usarla

**App nativa de iPhone (archivo .ipa).** Es la principal. Avisa con sonido aunque el iPhone esté bloqueado.
Se compila sola en GitHub cada vez que cambia el código y queda en
<https://github.com/Marii0/mi-gym/releases/download/ios/MiGym.ipa>.

**App web.** La misma app en <https://marii0.github.io/mi-gym/>; sirve como respaldo y para probar cambios rápido.

## Instalar la app nativa desde Windows (gratis)

Se hace una vez por iPhone y se repite cada 7 días, porque con un Apple ID gratuito la firma dura una semana.

1. En la PC instala **iTunes** e **iCloud** desde la página de Apple (no desde Microsoft Store) y **Sideloadly** desde <https://sideloadly.io>.
2. Descarga `MiGym.ipa` del enlace de arriba.
3. Conecta el iPhone con el cable, desbloquéalo y toca **Confiar**.
4. Abre Sideloadly, arrastra `MiGym.ipa`, escribe tu Apple ID y presiona **Start**. Te pide la contraseña de tu Apple ID.
5. En el iPhone: Ajustes > General > VPN y gestión de dispositivos > tu Apple ID > **Confiar**.
6. En iOS 16 o más nuevo activa Ajustes > Privacidad y seguridad > **Modo de desarrollador** y reinicia.
7. Abre Mi Gym.

Para renovarla cada semana repite los pasos 3 y 4 con el mismo Apple ID. No borres la app: así se conservan tus datos.
Aunque caduque, tu rutina y tu calendario siguen en el teléfono y en Google Drive.

## Probar cambios en la computadora

1. Abre esta carpeta en VS Code e instala la extensión **Live Server**.
2. Clic derecho en `index.html` y elige **Open with Live Server**.

Al subir cambios a GitHub:
- La app web se actualiza sola. Cambia `VERSION` en `sw.js` para que los teléfonos bajen la versión nueva.
- La app nativa se vuelve a compilar sola (pestaña Actions) y hay que reinstalar el `.ipa` nuevo con Sideloadly.

## Google Drive

Ya está configurado en el proyecto "Mi Gym" de Google Cloud, con dos ID de cliente en `js/config.js`:
uno para la app web y otro de tipo iOS para la app nativa. Solo pide el permiso `drive.file`:
la app únicamente ve los archivos que ella misma crea.

Mientras el proyecto esté en modo de prueba, solo pueden entrar los correos agregados como usuarios de prueba
(Google Auth Platform > Audience > Test users) y hay que volver a iniciar sesión cada 7 días.

Cada quien entra con su propia cuenta de Google y su carpeta queda en su propio Drive.
Si prefieren que las dos carpetas estén en el mismo Drive, entren los dos con la misma cuenta.

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
| `native/`, `package.json`, `capacitor.config.json` | Lo necesario para armar la app nativa con Capacitor |
| `.github/workflows/ios.yml` | Compilación de la app nativa en la nube |

## Límites que conviene saber

- App nativa: con el iPhone bloqueado el aviso llega como notificación con sonido. Si el iPhone está en silencio, vibra en vez de sonar.
- App web: el pitido solo suena con la app abierta; con el iPhone bloqueado no puede sonar.
- La firma gratuita de la app nativa dura 7 días y permite hasta 3 apps instaladas así por iPhone.
- La copia a Drive se hace con la app abierta. Si entrenaste sin internet, se sube la siguiente vez que la abras con conexión.

## Créditos

Fotos de los ejercicios: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), dominio público (Unlicense).
Tipografía: Barlow Condensed (SIL Open Font License).

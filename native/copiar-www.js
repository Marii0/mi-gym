// Copia la app web a la carpeta "www", que es la que Capacitor mete dentro de la app nativa.
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..'), destino = path.join(raiz, 'www');
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino);
['index.html', 'css', 'js', 'img', 'fonts', 'icons'].forEach(n => fs.cpSync(path.join(raiz, n), path.join(destino, n), { recursive: true }));
console.log('www lista');

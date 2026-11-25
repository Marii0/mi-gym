// Ajusta el proyecto de iOS que genera Capacitor: ícono, pantalla de inicio, sonido del aviso
// y el "esquema" con el que Google regresa a la app después de iniciar sesión.
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..'), app = path.join(raiz, 'ios', 'App', 'App');

// 1. Info.plist
const plist = path.join(app, 'Info.plist');
let x = fs.readFileSync(plist, 'utf8');
const config = fs.readFileSync(path.join(raiz, 'js', 'config.js'), 'utf8');
const m = /GOOGLE_IOS_CLIENT_ID:\s*'([^']*)'/.exec(config);
const idIos = m ? m[1].trim() : '';
let extra = '\t<key>UIUserInterfaceStyle</key>\n\t<string>Dark</string>\n';
if (idIos) {
  const esquema = 'com.googleusercontent.apps.' + idIos.replace(/\.apps\.googleusercontent\.com$/, '');
  extra += '\t<key>CFBundleURLTypes</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>CFBundleURLName</key>\n\t\t\t<string>google</string>\n\t\t\t<key>CFBundleURLSchemes</key>\n\t\t\t<array>\n\t\t\t\t<string>' + esquema + '</string>\n\t\t\t</array>\n\t\t</dict>\n\t</array>\n';
}
if (x.indexOf('UIUserInterfaceStyle') < 0) {
  const fin = x.lastIndexOf('</dict>');
  x = x.slice(0, fin) + extra + x.slice(fin);
}
// Solo vertical en iPhone
x = x.replace(/(<key>UISupportedInterfaceOrientations<\/key>\s*<array>)[\s\S]*?(<\/array>)/, '$1\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t$2');
fs.writeFileSync(plist, x);

// 2. Ícono y pantalla de inicio
const assets = path.join(app, 'Assets.xcassets');
const icono = path.join(assets, 'AppIcon.appiconset');
fs.readdirSync(icono).filter(f => f.endsWith('.png')).forEach(f => fs.copyFileSync(path.join(__dirname, 'icono-1024.png'), path.join(icono, f)));
const splash = path.join(assets, 'Splash.imageset');
if (fs.existsSync(splash)) fs.readdirSync(splash).filter(f => f.endsWith('.png')).forEach(f => fs.copyFileSync(path.join(__dirname, 'splash.png'), path.join(splash, f)));

// 3. Versión: sale de package.json. SideStore compara este número con el de fuente.json para ofrecer la actualización.
const version = require(path.join(raiz, 'package.json')).version, compilacion = process.env.GITHUB_RUN_NUMBER || '1';
let pl = fs.readFileSync(plist, 'utf8');
pl = pl.replace(/(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/, '$1' + version + '$2')
  .replace(/(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/, '$1' + compilacion + '$2');
fs.writeFileSync(plist, pl);
const pbx = path.join(raiz, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
if (fs.existsSync(pbx)) {
  fs.writeFileSync(pbx, fs.readFileSync(pbx, 'utf8').replace(/MARKETING_VERSION = [^;]+;/g, 'MARKETING_VERSION = ' + version + ';')
    .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, 'CURRENT_PROJECT_VERSION = ' + compilacion + ';'));
}

// 4. Sonido del aviso (el flujo de GitHub lo registra después en el proyecto de Xcode)
fs.copyFileSync(path.join(__dirname, 'pitido.wav'), path.join(app, 'pitido.wav'));
console.log('Proyecto de iOS ajustado, versión ' + version + (idIos ? '' : ' (sin ID de Google para iOS)'));

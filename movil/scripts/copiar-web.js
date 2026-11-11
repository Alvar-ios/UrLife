// Copia la web de PalomApp dentro de movil/www para meterla en la app de Android (docs/33 §7.1 y §7.6).
// Supabase.js va dentro de la app (sin cargarlo de internet) y con versión fija.
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..', '..'), www = path.join(__dirname, '..', 'www');
fs.rmSync(www, { recursive: true, force: true }); fs.mkdirSync(path.join(www, 'vendor'), { recursive: true });
const archivos = ['app.js', 'app.css', 'look.css', 'data-layer.js', 'auth-signup.js', 'config.js', 'privacidad.html', 'borrar-cuenta.html'];
archivos.forEach((f) => fs.copyFileSync(path.join(raiz, f), path.join(www, f)));
fs.cpSync(path.join(raiz, 'logos'), path.join(www, 'logos'), { recursive: true });
fs.cpSync(path.join(raiz, 'fonts'), path.join(www, 'fonts'), { recursive: true }); // 11/11: letras dentro de la app
fs.copyFileSync(require.resolve('@supabase/supabase-js/dist/umd/supabase.js'), path.join(www, 'vendor', 'supabase.js'));
let html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
html = html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[^"]+"><\/script>/, '<script src="vendor/supabase.js"></script>');
if (!/vendor\/supabase\.js/.test(html)) throw new Error('No encuentro la línea de Supabase en index.html');
// el puente con Android (atrás, barra de estado, huella) va antes que app.js
html = html.replace('<script src="app.js"></script>', '<script src="nativo.js"></script>\n<script src="app.js"></script>');
fs.writeFileSync(path.join(www, 'index.html'), html);
require('esbuild').buildSync({ entryPoints: [path.join(__dirname, '..', 'nativo-src.js')], bundle: true, format: 'iife', target: 'es2019', minify: true, outfile: path.join(www, 'nativo.js') });
console.log('Web copiada en movil/www (' + fs.readdirSync(www).length + ' archivos)');

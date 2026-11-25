// Copia KaTeX y las fuentes desde node_modules a public/vendor para que la app
// funcione sin internet (necesario para la APK). Se corre con: npm run vendor
// El resultado se sube al repo, así el servidor en producción no necesita las devDependencies.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const nm = path.join(root, 'node_modules');
const out = path.join(root, 'public', 'vendor');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });

// KaTeX: solo el JS. La app pinta en MathML, así que no hacen falta su CSS ni sus fuentes.
fs.copyFileSync(path.join(nm, 'katex', 'dist', 'katex.min.js'), path.join(out, 'katex.min.js'));

// Fuentes de Material Design: Roboto y Roboto Mono. Solo latin y greek (por θ y ω), formato woff2.
const fonts = [
  { pkg: 'roboto', family: 'Roboto', weights: [400, 500, 700], subsets: ['latin', 'greek'] },
  { pkg: 'roboto-mono', family: 'Roboto Mono', weights: [400, 500], subsets: ['latin', 'greek'] }
];
const ranges = {
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  greek: 'U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF'
};
let css = '/* Generado por scripts/copy-vendor.js */\n';
for (const f of fonts) {
  for (const w of f.weights) {
    for (const s of f.subsets) {
      const file = `${f.pkg}-${s}-${w}-normal.woff2`;
      const src = path.join(nm, '@fontsource', f.pkg, 'files', file);
      if (!fs.existsSync(src)) { console.warn('No existe', file); continue; }
      fs.copyFileSync(src, path.join(out, 'fonts', file));
      css += `@font-face{font-family:"${f.family}";font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${file}) format("woff2");unicode-range:${ranges[s]}}\n`;
    }
  }
}
fs.writeFileSync(path.join(out, 'fonts.css'), css);
console.log('Vendor listo en public/vendor');

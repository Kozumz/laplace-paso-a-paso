// Genera public/css/theme.css con los tokens de color de Material 3 a partir de un color semilla.
// Uso: npx esbuild scripts/gen-theme.mjs --bundle --platform=node --format=esm --outfile=/tmp/gt.mjs && node /tmp/gt.mjs
import { argbFromHex, hexFromArgb, SchemeVibrant, Hct, customColor } from '@material/material-color-utilities';
import fs from 'fs';

const SEED = '#3F6AE0';           // azul: el marcador de "armar"
const GREEN = '#2E7D32';          // verde: fracciones y "cuadra" (se armoniza con la semilla)
const roles = ['primary','onPrimary','primaryContainer','onPrimaryContainer','secondary','onSecondary','secondaryContainer','onSecondaryContainer',
  'tertiary','onTertiary','tertiaryContainer','onTertiaryContainer','error','onError','errorContainer','onErrorContainer',
  'surface','onSurface','surfaceVariant','onSurfaceVariant','surfaceContainerLowest','surfaceContainerLow','surfaceContainer','surfaceContainerHigh','surfaceContainerHighest',
  'inverseSurface','inverseOnSurface','inversePrimary','outline','outlineVariant','scrim','shadow'];
const kebab = s => s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
const green = customColor(argbFromHex(SEED), { name: 'success', value: argbFromHex(GREEN), blend: true });
function block(dark) {
  const sc = new SchemeVibrant(Hct.fromInt(argbFromHex(SEED)), dark, 0);
  const g = dark ? green.dark : green.light;
  let css = '';
  for (const r of roles) css += `  --md-sys-color-${kebab(r)}:${hexFromArgb(sc[r])};\n`;
  css += `  --md-sys-color-success:${hexFromArgb(g.color)};\n  --md-sys-color-on-success:${hexFromArgb(g.onColor)};\n`;
  css += `  --md-sys-color-success-container:${hexFromArgb(g.colorContainer)};\n  --md-sys-color-on-success-container:${hexFromArgb(g.onColorContainer)};\n`;
  return css;
}
const light = block(false), dark = block(true);
const out = `/* Generado por scripts/gen-theme.mjs — Material 3, esquema Vibrant, semilla ${SEED} */
:root{
${light}  color-scheme:light;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
${dark.replace(/^/gm,'  ')}    color-scheme:dark;
  }
}
:root[data-theme="dark"]{
${dark}  color-scheme:dark;
}
`;
fs.writeFileSync('public/css/theme.css', out);
const lp = new SchemeVibrant(Hct.fromInt(argbFromHex(SEED)), false, 0), dp = new SchemeVibrant(Hct.fromInt(argbFromHex(SEED)), true, 0);
fs.writeFileSync('resources/colors.json', JSON.stringify({
  light: { primary: hexFromArgb(lp.primary), onPrimary: hexFromArgb(lp.onPrimary), primaryContainer: hexFromArgb(lp.primaryContainer), surface: hexFromArgb(lp.surface), surfaceContainer: hexFromArgb(lp.surfaceContainer), onSurface: hexFromArgb(lp.onSurface) },
  dark: { primary: hexFromArgb(dp.primary), surface: hexFromArgb(dp.surface), surfaceContainer: hexFromArgb(dp.surfaceContainer) }
}, null, 2));
console.log('theme.css y resources/colors.json listos');

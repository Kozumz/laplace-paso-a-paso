// Servidor de Laplace paso a paso.
// Sirve la web app (carpeta public/) y una API REST pequeña que reutiliza el mismo núcleo matemático.
'use strict';
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');

const LP = require('../public/js/lp-core.js');
const EJERCICIOS = require('../public/js/ejercicios.js');
const pkg = require('../package.json');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, '..', 'public');
const started = Date.now();

app.disable('x-powered-by');
app.set('trust proxy', 1); // detrás de Nginx / el proxy del hosting

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"], // los dibujos SVG usan style="..."
      'img-src': ["'self'", 'data:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': null // el HTTPS lo pone el hosting/Nginx; así también funciona en http durante pruebas
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(express.json({ limit: '4kb' }));

// ---------------- API ----------------
const api = express.Router();

// Estado del servidor
api.get('/salud', (req, res) => {
  res.json({ ok: true, app: pkg.name, version: pkg.version, activoDesdeSeg: Math.round((Date.now() - started) / 1000) });
});

// Banco de ejercicios
api.get('/ejercicios', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(EJERCICIOS);
});

// Inversa de Laplace: { "arriba": "3 0", "abajo": "3 2 5 3 2" }  (de la potencia más alta a la más baja)
function parseCoefs(v) {
  const arr = Array.isArray(v) ? v : String(v || '').trim().split(/[\s,;]+/).filter(Boolean);
  if (!arr.length || arr.length > 12) return null;
  const nums = arr.map(Number);
  if (nums.some((x) => !Number.isFinite(x) || Math.abs(x) > 1e6)) return null;
  return nums.reverse(); // el núcleo usa índice = potencia
}
function round(x) { return Math.round(x * 1e6) / 1e6; }
function polo(g) {
  return g.type === 'real'
    ? { tipo: 'real', valor: round(g.p), multiplicidad: g.m }
    : { tipo: 'par complejo', real: round(g.re), imaginaria: round(g.im), multiplicidad: g.m };
}
api.post('/inversa', (req, res) => {
  const N = parseCoefs(req.body && req.body.arriba);
  const D = parseCoefs(req.body && req.body.abajo);
  if (!N || !D) {
    return res.status(400).json({ error: 'Manda "arriba" y "abajo" como números separados por espacios (máximo 12), de la potencia más alta a la más baja. Ej.: {"arriba":"3 0","abajo":"3 2 5 3 2"}' });
  }
  const a = LP.analyze(N, D);
  if (a.error) return res.status(400).json({ error: a.error });
  if (a.zero) return res.json({ resultadoTex: '0', terminos: [] });
  if (a.unsupported) return res.status(422).json({ error: 'Par complejo repetido: caso no soportado.' });
  res.json({
    fraccionTex: `\\frac{${LP.polyTex(N)}}{${LP.polyTex(D)}}`,
    polos: a.polesAll.map(polo),
    tachados: a.cancelled.map(polo),
    factorAfuera: round(a.K),
    terminos: a.terms.map((t) => ({ tipo: t.kind, coeficiente: round(t.coef), polo: t.p !== undefined ? round(t.p) : undefined, a: t.a !== undefined ? round(t.a) : undefined, omega: t.w !== undefined ? round(t.w) : undefined, potenciaT: t.k ? t.k - 1 : undefined })),
    impulso: round(a.impulse),
    resultadoTex: (Math.abs(a.impulse) > 1e-9 ? LP.fmt(a.impulse) + '\\,\\delta(t) + ' : '') + LP.sumTex(a.terms),
    valorEnCero: round(a.t0),
    valorFinal: a.finalValue === null ? null : round(a.finalValue)
  });
});

api.use((req, res) => res.status(404).json({ error: 'Ruta de la API no encontrada' }));
app.use('/api', api);

// ---------------- Web app ----------------
app.use(express.static(PUBLIC, {
  extensions: ['html'],
  setHeaders(res, file) {
    if (file.endsWith('sw.js') || file.endsWith('.html') || file.endsWith('.webmanifest')) res.setHeader('Cache-Control', 'no-cache');
    else if (file.includes(`${path.sep}vendor${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    else res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));
app.use((req, res) => res.status(404).sendFile(path.join(PUBLIC, 'index.html')));

// Errores (por ejemplo, JSON mal formado)
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  res.status(status).json({ error: status === 500 ? 'Error interno' : err.message });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Laplace paso a paso escuchando en http://localhost:${PORT}`));
}
module.exports = app;

# Laplace paso a paso

App interactiva (web y Android) para estudiar transformada de Laplace.
Resuelve paso a paso sistemas mecánicos rotacionales, circuitos de dos mallas, RLC en serie e inversas de Laplace, con explicaciones sin tecnicismos, ejemplos listos para abrir y un modo práctica que oculta los pasos.

- **Web:** servidor Node.js + Express que sirve la app y una API REST.
- **Android:** APK híbrida con Capacitor 8 que usa el mismo código y funciona sin internet.
- **Diseño:** Material Design 3: paleta tonal generada con `material-color-utilities` (semilla `#3F6AE0`, esquema Vibrant), tipografía Roboto, modo claro y oscuro, barra de navegación inferior en el celular.

## Estructura

```
server/server.js         Servidor Express (web + API)
public/                  La app (la misma para web y APK)
  index.html
  css/theme.css          Colores Material 3 (generado)
  css/styles.css         Componentes Material 3
  js/lp-core.js          Núcleo matemático (lo usan el navegador y el servidor)
  js/ejercicios.js       Banco de ejemplos (lo usan la app y la API)
  js/app.js              Interfaz
  vendor/                KaTeX y fuentes locales (para que funcione sin internet)
  manifest.webmanifest, sw.js   PWA: la web también se puede instalar y usar sin conexión
android/                 Proyecto Android generado por Capacitor (colores e íconos de la paleta)
.github/workflows/       Compila la APK en GitHub
tests/                   Pruebas (npm test)
deploy/                  Configuración de Nginx para VPS
scripts/                 Generadores de tema y de archivos vendor
```

## Correrlo en tu compu

Requisitos: Node.js 20 o más nuevo.

```bash
npm install
npm start            # http://localhost:3000
npm run dev          # igual, pero se reinicia solo al guardar
npm test             # pruebas del núcleo y de la API
```

## API

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/salud` | Estado y versión del servidor |
| GET | `/api/ejercicios` | Banco de ejemplos en JSON |
| POST | `/api/inversa` | Inversa de Laplace. Cuerpo: `{"arriba":"2 1","abajo":"1 10 35 50 24"}` (coeficientes de la potencia más alta a la más baja). Responde polos, términos, resultado en TeX, valor en t = 0 y valor final |

```bash
curl -X POST http://localhost:3000/api/inversa -H "content-type: application/json" \
     -d '{"arriba":"2 1","abajo":"1 10 35 50 24"}'
```

## APK de Android

### Opción A: que GitHub la compile (no necesitas instalar nada)

1. Crea un repositorio en GitHub y sube este proyecto:
   ```bash
   git init && git add . && git commit -m "Laplace paso a paso"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/laplace-paso-a-paso.git
   git push -u origin main
   ```
2. Entra a la pestaña **Actions** del repo. El workflow **APK Android** tarda unos 4 minutos.
3. Abre la ejecución terminada y descarga **laplace-apk**. Dentro viene `laplace-paso-a-paso.apk`.
4. Para que quede en **Releases** con link directo: `git tag v1.0.0 && git push --tags`.

### Opción B: Android Studio

```bash
npm install
npx cap sync android
npx cap open android     # Build → Build App Bundle(s) / APK(s) → Build APK(s)
```

Para instalarla en el celular: pásale el `.apk` y permite "instalar apps de origen desconocido".
Es una APK *debug*; para Play Store habría que firmarla con tu propia llave (`./gradlew bundleRelease` + keystore).

Cada vez que cambies algo en `public/`, corre `npx cap sync android` (el workflow lo hace solo).

## Hosting

### Recomendado: Hostinger Business (sin administrar servidor)

El plan Business soporta hasta 5 apps Node.js, despliega desde GitHub y en el mismo plan cabe tu portafolio.

1. Contrata **Business** (el precio bajo es pagando varios años por adelantado; revisa el precio de renovación). Incluye dominio gratis el primer año.
2. Panel → **Websites → Create site → Node.js web app → Import from GitHub** y elige este repo.
3. Configuración: framework **Express**, entrada `server/server.js`, comando de inicio `npm start`, Node 22. No hace falta comando de build.
4. Conecta un subdominio, por ejemplo `laplace.tudominio.com`, y activa el SSL gratis.
5. El portafolio va como otro sitio en el mismo plan, en `tudominio.com`.

Cada `git push` vuelve a desplegar la app.

### Alternativa: VPS (más control y más aprendizaje de Linux/seguridad)

Por ejemplo, un Droplet de DigitalOcean de 1 GB, o un VPS de Hostinger. Ubuntu 24.04:

```bash
# como root la primera vez
adduser carlos && usermod -aG sudo carlos
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
apt update && apt install -y nginx git certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
npm install -g pm2

# como carlos
git clone https://github.com/TU_USUARIO/laplace-paso-a-paso.git && cd laplace-paso-a-paso
npm ci --omit=dev
pm2 start ecosystem.config.cjs && pm2 save && pm2 startup     # corre el comando que te imprime

sudo cp deploy/nginx-laplace.conf /etc/nginx/sites-available/laplace   # edita tu dominio
sudo ln -s /etc/nginx/sites-available/laplace /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d laplace.tudominio.com -d tudominio.com
```

Actualizar: `git pull && npm ci --omit=dev && pm2 restart laplace`.
Buenas prácticas: entrar por llave SSH, desactivar el login de root y con contraseña (`/etc/ssh/sshd_config`) y activar actualizaciones automáticas (`unattended-upgrades`).

### Hosting gratuito

Render (plan Free, "Web Service" desde GitHub, `npm install` / `npm start`) funciona tal cual. Se duerme cuando nadie lo usa y la primera visita tarda en despertar.

## Cambiar la paleta

Edita `SEED` en `scripts/gen-theme.mjs` y corre:

```bash
npx esbuild scripts/gen-theme.mjs --bundle --platform=node --format=esm --outfile=/tmp/gt.mjs && node /tmp/gt.mjs
```

Luego actualiza los colores de `android/app/src/main/res/values*/colors.xml` con los de `resources/colors.json`.

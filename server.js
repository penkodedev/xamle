const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
// Forzamos la ruta absoluta al directorio de la aplicación en el servidor.
// Esto es crucial para que cPanel encuentre la carpeta .next y src,
// ya que el directorio de trabajo desde el que se ejecuta es inconsistente.
const app = next({ dev, dir: '/home/m152719/xamle-app' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    // 1. Parsear la URL para que Next.js entienda las rutas y queries
    const parsedUrl = parse(req.url, true);
    // 2. Pasar la URL parseada al manejador de Next.js
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});

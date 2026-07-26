const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

const root = path.resolve(__dirname, '..');
const port = process.env.PORT || 8000;

const mime = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);
  if (pathname === '/') pathname = '/docs/index.html';
  const filePath = path.join(root, pathname);

  if (!filePath.startsWith(root)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    if (stats.isDirectory()) {
      res.statusCode = 301;
      res.setHeader('Location', pathname.endsWith('/') ? pathname + 'index.html' : pathname + '/');
      res.end();
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}`);
});

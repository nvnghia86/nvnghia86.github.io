const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;

const staticFiles = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/fixes.css': ['fixes.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/data/exercises.json': ['data/exercises.json', 'application/json; charset=utf-8']
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const asset = staticFiles[url.pathname];

  if (req.method !== 'GET' || !asset) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const [file, type] = asset;
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  fs.createReadStream(path.join(ROOT, file)).pipe(res);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Gõ Mười Ngón đang chạy tại http://localhost:${PORT}`);
  });
}

module.exports = { server };

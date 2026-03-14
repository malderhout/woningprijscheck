// Laad .env bestand als het bestaat (geen fout als het er niet is)
try { require('dotenv').config(); } catch {}

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT    = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY || '';

// MIME types voor statische bestanden
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.json': 'application/json',
};

// ── Proxy: stuur request door naar Anthropic API ──────────────────────────────
function proxyToAnthropic(req, res) {
  if (!API_KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'ANTHROPIC_API_KEY is niet ingesteld. Zie .env.example.'
    }));
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try { JSON.parse(body); } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ongeldig JSON in request body' }));
      return;
    }

    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    };

    const proxyReq = https.request(options, proxyRes => {
      res.writeHead(proxyRes.statusCode, {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', err => {
      console.error('Proxy fout:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Kon Anthropic API niet bereiken: ' + err.message }));
    });

    proxyReq.write(body);
    proxyReq.end();
  });
}

// ── Statische bestanden serveren ──────────────────────────────────────────────
function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.normalize(path.join(__dirname, urlPath));
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Verboden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 - Niet gevonden');
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/messages') {
    proxyToAnthropic(req, res);
  } else if (req.method === 'GET') {
    serveStatic(req, res);
  } else {
    res.writeHead(405);
    res.end('Methode niet toegestaan');
  }
});

server.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║       WoningPrijsCheck — Server        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n✅  Draait op  ->  http://localhost:${PORT}`);
  console.log(`📁  Serveert   ->  ${__dirname}\n`);

  if (!API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY niet gevonden!');
    console.warn('    1. Kopieer .env.example naar .env');
    console.warn('    2. Vul je API key in');
    console.warn('    3. Herstart de server\n');
  } else {
    console.log('🔑  API key    ->  geladen\n');
  }
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌  Poort ${PORT} is al in gebruik.`);
    console.error(`    Verander PORT= in .env naar bijv. 3001\n`);
  } else {
    console.error('Server fout:', err);
  }
  process.exit(1);
});

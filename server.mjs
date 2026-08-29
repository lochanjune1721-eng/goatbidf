// server.mjs — High-performance dev server with resilient auto-healing Wikimedia image cache
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;
const CACHE_DIR = path.join(__dirname, '.cache', 'images');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const USER_AGENT = "GOAT-App/1.0 (https://goat.lol; admin@goat.lol)";

// Extract clean file name from Wikimedia URL
function extractFilename(url) {
  if (!url) return '';
  const clean = url.split('?')[0];
  const parts = clean.split('/');
  let filename = parts[parts.length - 1] || '';
  if (/^\d+px-/.test(filename)) {
    filename = filename.replace(/^\d+px-/, '');
  }
  return decodeURIComponent(filename);
}

// Generate fallback SVG avatar
function generateSvgAvatar(name) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="100%" height="100%" fill="#1a1815"/>
    <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="96" fill="#f59e0b" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
}

// On-demand Wikipedia portrait search
async function queryWikiForPortrait(name) {
  if (!name) return null;
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&piprop=thumbnail&pithumbsize=500&redirects=1&titles=${encodeURIComponent(name)}&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const j = await res.json();
    const page = Object.values(j.query?.pages || {})[0];
    const thumb = page?.thumbnail?.source?.split('?')[0];
    if (thumb && !thumb.endsWith('.gif')) return thumb;
  } catch (e) {}
  return null;
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  // 1. Resilient Image Endpoint: /img?name=...&url=...
  if (pathname === '/image-proxy' || pathname === '/img') {
    const targetUrl = reqUrl.searchParams.get('url') || '';
    const personName = reqUrl.searchParams.get('name') || '';

    const cacheKey = (personName || targetUrl).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
    const cachedFilePath = path.join(CACHE_DIR, `${cacheKey}.jpg`);

    // Check disk cache first (0ms delivery)
    if (fs.existsSync(cachedFilePath) && fs.statSync(cachedFilePath).size > 500) {
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      return fs.createReadStream(cachedFilePath).pipe(res);
    }

    // Attempt 1: Fetch target URL directly with authorized UA
    let imageBuffer = null;
    let contentType = 'image/jpeg';

    if (targetUrl.startsWith('http')) {
      try {
        const remoteRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
          }
        });
        if (remoteRes.ok) {
          contentType = remoteRes.headers.get('content-type') || 'image/jpeg';
          imageBuffer = Buffer.from(await remoteRes.arrayBuffer());
        }
      } catch (e) {}
    }

    // Attempt 2: If direct failed, try Wikipedia Special:FilePath
    if (!imageBuffer) {
      const filename = extractFilename(targetUrl) || (personName ? `${personName.replace(/ /g, '_')}.jpg` : '');
      if (filename) {
        for (const base of [
          `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=500`,
          `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=500`
        ]) {
          try {
            const fpRes = await fetch(base, {
              headers: { 'User-Agent': USER_AGENT },
              redirect: 'follow'
            });
            if (fpRes.ok && (fpRes.headers.get('content-type') || '').startsWith('image/')) {
              contentType = fpRes.headers.get('content-type') || 'image/jpeg';
              imageBuffer = Buffer.from(await fpRes.arrayBuffer());
              break;
            }
          } catch (e) {}
        }
      }
    }

    // Attempt 3: On-demand Wikipedia API lookup
    if (!imageBuffer && personName) {
      const wikiThumb = await queryWikiForPortrait(personName);
      if (wikiThumb) {
        try {
          const wRes = await fetch(wikiThumb, {
            headers: { 'User-Agent': USER_AGENT }
          });
          if (wRes.ok) {
            contentType = wRes.headers.get('content-type') || 'image/jpeg';
            imageBuffer = Buffer.from(await wRes.arrayBuffer());
          }
        } catch (e) {}
      }
    }

    // If successfully resolved, cache to disk and return
    if (imageBuffer && imageBuffer.length > 500) {
      fs.writeFile(cachedFilePath, imageBuffer, () => {});
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      return res.end(imageBuffer);
    }

    // Guarantee fallback: Beautiful vector monogram avatar (never broken)
    const svg = generateSvgAvatar(personName);
    res.writeHead(200, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400'
    });
    return res.end(svg);
  }

  // 2. Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 GOAT.lol auto-healing server running at http://localhost:${PORT}`);
});

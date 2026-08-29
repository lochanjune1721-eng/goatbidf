// Production image healer — the same job server.mjs already does on localhost.
//
// Two things break portraits once the site is deployed:
//   1. Wikidata stores image URLs as http://, and a browser silently blocks
//      http:// images on an https:// page (mixed content).
//   2. Most people were seeded with photo_path = null, so there is nothing to
//      load at all.
//
// This endpoint fixes both: it upgrades the protocol, and when there is no
// usable URL it looks the person up on Wikipedia by name. It answers with a
// redirect (not a proxy) so the image still comes straight from Wikimedia's
// CDN, and the answer is cached at the edge so each name is looked up rarely.
//
// If everything fails it returns a monogram SVG, so a portrait slot is never
// empty and never a broken-image icon.

const USER_AGENT = 'GOAT-App/1.0 (https://goat.lol; admin@goat.lol)';
const CACHE = 'public, s-maxage=2592000, stale-while-revalidate=86400';

function httpsify(raw) {
  let url = String(raw || '').trim();
  if (!url) return '';
  if (url.startsWith('//')) url = `https:${url}`;
  if (url.startsWith('http://')) url = `https://${url.slice(7)}`;
  return /^https:\/\//.test(url) ? url : '';
}

function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function monogram(name) {
  const initials = initialsOf(name)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="100%" height="100%" fill="#1A1815"/>
  <text x="50%" y="54%" font-family="system-ui,-apple-system,sans-serif" font-weight="700"
        font-size="150" fill="#D4A24C" text-anchor="middle" dominant-baseline="middle">${initials}</text>
</svg>`;
}

/** Asks Wikipedia for a person's lead photo. */
async function wikiThumb(name) {
  if (!name) return '';
  const api = 'https://en.wikipedia.org/w/api.php'
    + '?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=600&redirects=1&format=json'
    + `&titles=${encodeURIComponent(name)}`;
  try {
    const response = await fetch(api, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) return '';
    const data = await response.json();
    const page = Object.values(data.query?.pages || {})[0];
    const thumb = page?.thumbnail?.source;
    if (!thumb || thumb.endsWith('.gif')) return '';
    return httpsify(thumb.split('?')[0]);
  } catch {
    return '';
  }
}

export default async function handler(req, res) {
  const query = req.query || {};
  const name = String(query.name || '').slice(0, 160);
  const given = httpsify(query.url);

  // 1. A usable https URL — hand it straight back.
  if (given) {
    res.setHeader('Cache-Control', CACHE);
    res.writeHead(302, { Location: given });
    return res.end();
  }

  // 2. Nothing usable stored — resolve the person by name.
  const resolved = await wikiThumb(name);
  if (resolved) {
    res.setHeader('Cache-Control', CACHE);
    res.writeHead(302, { Location: resolved });
    return res.end();
  }

  // 3. Still nothing — a monogram, so the slot is never empty.
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  res.setHeader('Content-Type', 'image/svg+xml');
  return res.end(monogram(name));
}

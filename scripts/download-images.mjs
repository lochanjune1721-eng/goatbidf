#!/usr/bin/env node
/* GOAT.lol — copy resolved images into our own bucket, as WebP.
 *
 *   npm install sharp          # not a deploy dependency; only this script
 *   node scripts/download-images.mjs
 *   node scripts/download-images.mjs --sizes=100,300 --limit=50 --dry-run
 *
 * The site does this by itself — /api/images copies Wikimedia's own thumbnails
 * across with no dependencies and no laptop involved. This script exists for
 * the one thing that needs an image library: re-encoding to WebP (about 30%
 * smaller) and cropping to a true square with `position: 'attention'`, which
 * keeps faces centred instead of trusting object-fit.
 *
 * Both write the same layout, so they are interchangeable per person:
 *
 *   photos/100/lionel-messi.webp
 *   photos/300/lionel-messi.webp
 *   photos/800/lionel-messi.webp
 *   people.photo_path = 'lionel-messi.webp'
 *
 * Zero npm dependencies besides sharp: Supabase is reached over its REST API
 * rather than through the client library.
 */

import { readFileSync, existsSync } from 'node:fs';

const argv = process.argv.slice(2);
const flag = (n, d = null) => {
  const hit = argv.find((a) => a === `--${n}` || a.startsWith(`--${n}=`));
  return hit ? (hit.includes('=') ? hit.split('=').slice(1).join('=') : true) : d;
};
const SIZES = String(flag('sizes', '100,300,800')).split(',').map(Number).filter(Boolean);
const LIMIT = Number(flag('limit', 0)) || 0;
const QUALITY = Number(flag('quality', 82)) || 82;
const DRY = !!flag('dry-run');
const PAUSE = Number(flag('pause', 150)) || 150;

if (existsSync(new URL('../.env.local', import.meta.url))) {
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or put them in .env.local).');
  process.exit(1);
}

/* Wikimedia's User-Agent policy asks for a real site and a way to reach a
   human. Set WIKI_CONTACT; a generic agent gets 403 from their edge. */
const UA = process.env.WIKI_UA ||
  `GOATdotLOL/1.0 (https://${process.env.WIKI_SITE || 'goatbid.lol'}` +
  `${process.env.WIKI_CONTACT ? '; ' + process.env.WIKI_CONTACT : ''})`;

let sharp;
try { ({ default: sharp } = await import('sharp')); }
catch {
  console.error('This script needs sharp:  npm install sharp');
  console.error('Or let the site do it with no dependencies — see README, "It runs itself".');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sb(path, init = {}) {
  const res = await fetch(`${URL_.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`,
               'Content-Type': 'application/json', ...(init.headers || {}) }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function upload(path, bytes) {
  const res = await fetch(`${URL_.replace(/\/$/, '')}/storage/v1/object/photos/${path}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`,
               'Content-Type': 'image/webp', 'x-upsert': 'true' },
    body: bytes
  });
  if (!res.ok) throw new Error(`upload ${path} (${res.status}) ${(await res.text()).slice(0, 160)}`);
}

async function main() {
  /* Identified but not yet copied. NOT image_status='pending' — a pending row
     has not been looked up yet and has no URL to download, so selecting those
     would mark the entire table 'missing' on the first pass. */
  const rows = await sb('/rest/v1/people?' + new URLSearchParams({
    select: 'id,slug,name,wikimedia_thumbnail_url,wikimedia_original_url,wikimedia_width,photo_attempts',
    image_status: 'eq.verified',
    photo_path: 'is.null',
    wikimedia_thumbnail_url: 'not.is.null',
    order: 'slug'
  }) + (LIMIT ? `&limit=${LIMIT}` : '&limit=5000'));

  if (!rows.length) { console.log('Nothing to copy. Every verified person already has a file.'); return; }
  console.log(`${rows.length} to copy, at ${SIZES.join('/')}px WebP q${QUALITY}.`);
  console.log(`User-Agent: ${UA}\n`);

  let ok = 0, bad = 0, bytesOut = 0;
  for (const [i, p] of rows.entries()) {
    const file = `${p.slug}.webp`;
    try {
      /* Pull one source big enough for the largest output and re-encode from
         it, rather than fetching each size separately. Cap at the original's
         own width: Wikimedia answers 400, not 404, above it. */
      const want = Math.max(...SIZES);
      const capped = p.wikimedia_width ? Math.min(want, p.wikimedia_width) : want;
      const src = p.wikimedia_thumbnail_url.replace(/\/(\d+)px-/, `/${capped}px-`);

      const res = await fetch(src, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());

      for (const size of SIZES) {
        const out = await sharp(buf)
          .resize(size, size, { fit: 'cover', position: 'attention' })
          .webp({ quality: QUALITY })
          .toBuffer();
        bytesOut += out.length;
        if (!DRY) await upload(`${size}/${file}`, out);
      }

      /* photo_path is the base name only; the site builds the size folders
         around it. Writing a full path here would point at nothing. */
      if (!DRY) {
        await sb(`/rest/v1/people?id=eq.${p.id}`, {
          method: 'PATCH', headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ photo_path: file, photo_note: null,
                                 photo_attempts: (p.photo_attempts || 0) + 1 })
        });
      }
      ok++;
      console.log(`${i + 1}/${rows.length} ✓ ${p.name}`);
    } catch (e) {
      bad++;
      /* A download failure is not a doubt about who this person is, so
         image_status is left alone — needs_review means "a human should check
         this face", and putting a 404 there would bury the real ones. */
      if (!DRY) {
        await sb(`/rest/v1/people?id=eq.${p.id}`, {
          method: 'PATCH', headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ photo_attempts: (p.photo_attempts || 0) + 1,
                                 photo_note: String(e.message).slice(0, 300) })
        }).catch(() => {});
      }
      console.log(`${i + 1}/${rows.length} ✗ ${p.name} — ${e.message}`);
    }
    await sleep(PAUSE);
  }

  console.log('\n' + '-'.repeat(56));
  console.log(`copied  ${ok}`);
  console.log(`failed  ${bad}   (the Wikimedia URL still works for these)`);
  console.log(`stored  ${(bytesOut / 1024 / 1024).toFixed(1)}MB across ${SIZES.length} sizes`);
  if (DRY) console.log('\n--dry-run: nothing was uploaded or written.');
}

main().catch((e) => { console.error(e); process.exit(1); });

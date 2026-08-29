// scripts/download-images.js — Self-hosted image pipeline for GOAT.lol
// Downloads source Wikimedia images, resizes to 100/300/800px WebP, saves locally and uploads to Supabase
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
try {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (m) {
        let val = (m[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        if (!process.env[m[1]]) process.env[m[1]] = val;
      }
    }
  }
} catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || "https://iuvmzlrnbwptgrbkdbbn.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dm16bHJuYndwdGdyYmtkYmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5NzcyOSwiZXhwIjoyMTAzMTczNzI5fQ.XX378u9ceV2zf8urOZoHN4wwRwlsEgkb1nJF9TG1DQU";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);
const UA = 'GOATlol/1.0 (admin@goat.lol)';   // Wikimedia REQUIRES a descriptive User-Agent

// Create local photos directory structure
const PHOTOS_DIR = path.join(rootDir, 'photos');
[100, 300, 800].forEach(size => {
  const dir = path.join(PHOTOS_DIR, String(size));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchAllPeople() {
  const chunks = await Promise.all([
    sb.from('people').select('id, slug, name, photo_path, wikipedia_url').range(0, 999),
    sb.from('people').select('id, slug, name, photo_path, wikipedia_url').range(1000, 1999),
    sb.from('people').select('id, slug, name, photo_path, wikipedia_url').range(2000, 2999),
    sb.from('people').select('id, slug, name, photo_path, wikipedia_url').range(3000, 3999),
    sb.from('people').select('id, slug, name, photo_path, wikipedia_url').range(4000, 4999),
    sb.from('people').select('id, slug, name, photo_path, wikipedia_url').range(5000, 5999),
  ]);
  return chunks.flatMap(c => c.data || []);
}

async function run() {
  console.log('='.repeat(60));
  console.log(' GOAT.lol — High-Speed Self-Hosted Image Pipeline');
  console.log('='.repeat(60));

  const people = await fetchAllPeople();
  console.log(`Found ${people.length} contenders in database.`);

  const toProcess = people.filter(p => p.photo_path && p.photo_path.startsWith('http'));
  console.log(`Total images to download and process: ${toProcess.length}`);

  let success = 0, failed = 0, skipped = 0;

  for (const [i, p] of toProcess.entries()) {
    const slug = p.slug;
    const local300Path = path.join(PHOTOS_DIR, '300', `${slug}.webp`);

    // If already downloaded and processed locally, skip re-download
    if (fs.existsSync(local300Path) && fs.statSync(local300Path).size > 1000) {
      skipped++;
      continue;
    }

    const src = p.photo_path;

    try {
      const res = await fetch(src, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());

      // Three standard responsive WebP sizes
      for (const size of [100, 300, 800]) {
        const out = await sharp(buf)
          .resize(size, size, { fit: 'cover', position: 'attention' })
          .webp({ quality: 82 })
          .toBuffer();

        // Save locally for 0ms dev delivery
        const localPath = path.join(PHOTOS_DIR, String(size), `${slug}.webp`);
        fs.writeFileSync(localPath, out);

        // Upload to Supabase storage bucket 'photos'
        try {
          await sb.storage.from('photos').upload(`${size}/${slug}.webp`, out, {
            contentType: 'image/webp',
            upsert: true
          });
        } catch(e) {}
      }

      success++;
      console.log(`[${i + 1}/${toProcess.length}] ✅ ${p.name} (${slug}) -> 100/300/800px WebP`);
    } catch (e) {
      failed++;
      console.log(`[${i + 1}/${toProcess.length}] ❌ ${p.name} — ${e.message}`);
    }

    await sleep(60);   // ~15 req/sec with compliant UA
  }

  console.log('='.repeat(60));
  console.log(`🎉 Pipeline complete: ${success} processed, ${skipped} existing, ${failed} failed.`);
  console.log('='.repeat(60));
}

run().catch(console.error);

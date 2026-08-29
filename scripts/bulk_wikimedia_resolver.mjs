#!/usr/bin/env node
// scripts/bulk_wikimedia_resolver.mjs — Bulk Wikimedia Image Resolver for GOAT.lol contenders
// Usage: node scripts/bulk_wikimedia_resolver.mjs [--limit=100] [--category=footballers] [--force] [--dry]

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { resolveWikimediaImage, getWikimediaThumbnailUrl } from './wikimedia_resolver.mjs';

// Read .env without external dependencies
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || "https://iuvmzlrnbwptgrbkdbbn.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dm16bHJuYndwdGdyYmtkYmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5NzcyOSwiZXhwIjoyMTAzMTczNzI5fQ.XX378u9ceV2zf8urOZoHN4wwRwlsEgkb1nJF9TG1DQU";

const supa = createClient(SUPABASE_URL, SERVICE_KEY);

// Parse CLI flags
const args = process.argv.slice(2);
const LIMIT = Number(args.find(a => a.startsWith('--limit='))?.split('=')[1] || 0);
const CAT_FILTER = args.find(a => a.startsWith('--category='))?.split('=')[1] || null;
const FORCE = args.includes('--force');
const DRY = args.includes('--dry');
const CONCURRENCY = Number(args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || 3);
const DELAY_MS = 120; // 120ms between queries to respect MediaWiki API rate limits

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('='.repeat(60));
  console.log(' GOAT.lol — Bulk Wikimedia Commons Image Resolver');
  console.log(` Mode: ${DRY ? 'DRY RUN' : 'LIVE DB UPDATE'} | Force: ${FORCE} | Concurrency: ${CONCURRENCY}`);
  if (CAT_FILTER) console.log(` Category filter: ${CAT_FILTER}`);
  if (LIMIT) console.log(` Limit: ${LIMIT}`);
  console.log('='.repeat(60));

  // 1. Fetch categories
  const { data: categories, error: catErr } = await supa.from('categories').select('*');
  if (catErr || !categories) {
    console.error('Failed to load categories:', catErr?.message);
    process.exit(1);
  }
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  // 2. Fetch people in chunks
  console.log('Loading contenders from Supabase...');
  let query = supa.from('people').select('id,slug,name,blurb,wikipedia_url,photo_path,category_id,total_cents').order('total_cents', { ascending: false });
  
  if (CAT_FILTER) {
    const targetCat = categories.find(c => c.slug === CAT_FILTER);
    if (targetCat) query = query.eq('category_id', targetCat.id);
  }

  // Fetch up to 6000 contenders using chunked pagination
  const chunks = await Promise.all([
    query.range(0, 999),
    query.range(1000, 1999),
    query.range(2000, 2999),
    query.range(3000, 3999),
    query.range(4000, 4999),
    query.range(5000, 5999)
  ]);

  let contenders = chunks.flatMap(c => c.data || []);
  if (LIMIT > 0) contenders = contenders.slice(0, 0 + LIMIT);

  console.log(`Loaded ${contenders.length} contenders across ${categories.length} categories.`);

  // 3. Filter contenders needing resolution
  const toProcess = contenders.filter(p => {
    if (FORCE) return true;
    // If photo_path is already a direct Wikimedia thumbnail, it is already resolved
    if (p.photo_path && p.photo_path.startsWith('https://upload.wikimedia.org')) return false;
    return true;
  });

  console.log(`Found ${toProcess.length} contenders needing Wikimedia image resolution.`);
  console.log(`(${contenders.length - toProcess.length} already resolved and cached).`);
  console.log('-'.repeat(60));

  let verifiedCount = 0;
  let needsReviewCount = 0;
  let missingCount = 0;
  let errorCount = 0;

  // Process in concurrent worker batches with rate-limiting & exponential backoff
  let index = 0;
  async function worker(workerId) {
    while (index < toProcess.length) {
      const currentIndex = index++;
      const person = toProcess[currentIndex];
      const category = catMap[person.category_id]?.name || '';
      
      const prefix = `[${currentIndex + 1}/${toProcess.length}] (Worker ${workerId})`;
      
      let attempts = 0;
      let success = false;
      let result = null;

      while (attempts < 3 && !success) {
        attempts++;
        try {
          result = await resolveWikimediaImage({
            name: person.name,
            category,
            blurb: person.blurb || '',
            wikipediaUrl: person.wikipedia_url || ''
          });
          success = true;
        } catch (err) {
          const waitTime = Math.pow(2, attempts) * 500;
          console.warn(`${prefix} Retry ${attempts}/3 for "${person.name}" after ${waitTime}ms:`, err.message);
          await sleep(waitTime);
        }
      }

      if (!result || !result.data) {
        console.log(`${prefix} ❌ ${person.name} (${category}) -> Error resolving`);
        errorCount++;
        continue;
      }

      const { status, data } = result;

      if (status === 'verified') {
        verifiedCount++;
        console.log(`${prefix} ✅ ${person.name} (${category}) -> ${data.wikimedia_file_title} [${data.image_license}]`);
      } else if (status === 'needs_review') {
        needsReviewCount++;
        console.log(`${prefix} ⚠️  ${person.name} (${category}) -> Needs Review: ${data.wikimedia_file_title}`);
      } else {
        missingCount++;
        console.log(`${prefix} ❓ ${person.name} (${category}) -> No suitable Wikimedia Commons image`);
      }

      // Save to Supabase
      if (!DRY && data.wikimedia_thumbnail_url) {
        const { error: upErr } = await supa.from('people').update({
          photo_path: data.wikimedia_thumbnail_url,
          photo_credit: data.image_author || null,
          photo_license: data.image_license || null
        }).eq('id', person.id);

        if (upErr) {
          console.error(`${prefix} DB update error for ${person.name}:`, upErr.message);
        }
      }

      // Respect MediaWiki API guidelines
      await sleep(DELAY_MS);
    }
  }

  // Launch workers
  const workerPromises = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workerPromises);

  console.log('='.repeat(60));
  console.log(' BULK RESOLUTION COMPLETE');
  console.log(` Total processed: ${toProcess.length}`);
  console.log(` Verified:       ${verifiedCount}`);
  console.log(` Needs Review:   ${needsReviewCount}`);
  console.log(` Missing:        ${missingCount}`);
  console.log(` Errors:         ${errorCount}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error in bulk resolver:', err);
  process.exit(1);
});

#!/usr/bin/env node
// scripts/resolve_all_photos_fast.mjs — High-speed parallel resolver for ALL contenders in Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        if (!process.env[match[1]]) process.env[match[1]] = val;
      }
    }
  }
} catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || "https://iuvmzlrnbwptgrbkdbbn.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dm16bHJuYndwdGdyYmtkYmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5NzcyOSwiZXhwIjoyMTAzMTczNzI5fQ.XX378u9ceV2zf8urOZoHN4wwRwlsEgkb1nJF9TG1DQU";

const supa = createClient(SUPABASE_URL, SERVICE_KEY);

const USER_AGENT = "GOATlolBot/2.0 (https://goat.lol; bot@goat.lol)";
const CONCURRENCY = 12;

async function fetchWikiDirect(name, wikipediaUrl = '') {
  let cleanTitle = wikipediaUrl ? decodeURIComponent(wikipediaUrl.split('/wiki/').pop() || '').replace(/_/g, ' ') : name.trim();
  let api = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|extracts|pageprops&exintro=1&explaintext=1&piprop=original|thumbnail&pithumbsize=400&titles=${encodeURIComponent(cleanTitle)}&format=json&origin=*`;
  
  try {
    let r = await fetch(api, { headers: { 'User-Agent': USER_AGENT } });
    if (!r.ok) return null;
    let j = await r.json();
    let page = j.query?.pages ? Object.values(j.query.pages)[0] : null;
    
    // If not found by direct title, try search API
    if (!page || page.missing || (!page.thumbnail && !page.original)) {
      const searchApi = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(name)}&gsrlimit=3&prop=pageimages&piprop=original|thumbnail&pithumbsize=400&format=json&origin=*`;
      const sr = await fetch(searchApi, { headers: { 'User-Agent': USER_AGENT } });
      if (sr.ok) {
        const sj = await sr.json();
        const spages = sj.query?.pages ? Object.values(sj.query.pages) : [];
        for (const sp of spages) {
          if (sp.thumbnail?.source || sp.original?.source) {
            page = sp;
            break;
          }
        }
      }
    }

    if (!page || page.missing) return null;

    let thumb = page.thumbnail?.source || page.original?.source || null;
    if (!thumb) return null;

    // Clean query params
    thumb = thumb.split('?')[0];

    // Fetch license & author
    let license = 'CC BY-SA 4.0';
    let author = 'Wikimedia Commons';
    
    if (page.pageimage) {
      try {
        const fileApi = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles=File:${encodeURIComponent(page.pageimage)}&format=json&origin=*`;
        const r2 = await fetch(fileApi, { headers: { 'User-Agent': USER_AGENT } });
        if (r2.ok) {
          const j2 = await r2.json();
          const pg2 = j2.query?.pages ? Object.values(j2.query.pages)[0] : null;
          const meta = pg2?.imageinfo?.[0]?.extmetadata;
          if (meta) {
            license = meta.LicenseShortName?.value || meta.License?.value || license;
            const rawArtist = meta.Artist?.value || meta.Credit?.value || '';
            if (rawArtist) author = rawArtist.replace(/<[^>]*>/g, '').trim().slice(0, 150);
          }
        }
      } catch (e) {}
    }

    return {
      thumbnailUrl: thumb,
      license,
      author
    };
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('Loading all contenders from Supabase...');
  const chunks = await Promise.all([
    supa.from('people').select('id,name,photo_path,wikipedia_url').range(0, 999),
    supa.from('people').select('id,name,photo_path,wikipedia_url').range(1000, 1999),
    supa.from('people').select('id,name,photo_path,wikipedia_url').range(2000, 2999),
    supa.from('people').select('id,name,photo_path,wikipedia_url').range(3000, 3999),
    supa.from('people').select('id,name,photo_path,wikipedia_url').range(4000, 4999),
    supa.from('people').select('id,name,photo_path,wikipedia_url').range(5000, 5999)
  ]);

  const allPeople = chunks.flatMap(c => c.data || []);
  console.log(`Total contenders in database: ${allPeople.length}`);

  // Find contenders needing Wikimedia image
  const queue = allPeople.filter(p => !p.photo_path || !p.photo_path.startsWith('https://upload.wikimedia.org'));
  console.log(`Contenders needing resolution: ${queue.length}`);

  let index = 0;
  let resolved = 0;
  let notFound = 0;

  async function worker(workerId) {
    while (index < queue.length) {
      const i = index++;
      const person = queue[i];
      
      const res = await fetchWikiDirect(person.name, person.wikipedia_url);
      if (res && res.thumbnailUrl) {
        await supa.from('people').update({
          photo_path: res.thumbnailUrl,
          photo_credit: res.author,
          photo_license: res.license
        }).eq('id', person.id);
        resolved++;
      } else {
        notFound++;
      }

      if ((resolved + notFound) % 25 === 0 || index >= queue.length) {
        console.log(`Progress: [${resolved + notFound}/${queue.length}] -> ✅ ${resolved} resolved | ❓ ${notFound} not found`);
      }

      await new Promise(r => setTimeout(r, 60));
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log('='.repeat(50));
  console.log(`🎉 COMPLETED: ${resolved} resolved directly, ${notFound} missing.`);
  console.log('='.repeat(50));
}

main().catch(console.error);

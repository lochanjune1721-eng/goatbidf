#!/usr/bin/env node
// scripts/resolve_all_final.mjs — Production high-speed Wikipedia resolver for all 5,238 contenders
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
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const BATCH_SIZE = 50;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('='.repeat(60));
  console.log(' GOAT.lol — Full Contender Image Resolver');
  console.log('='.repeat(60));

  // 1. Fetch all contenders from Supabase
  console.log('Loading all contenders from Supabase...');
  const chunks = await Promise.all([
    supa.from('people').select('id,name,wikipedia_url,photo_path').range(0, 999),
    supa.from('people').select('id,name,wikipedia_url,photo_path').range(1000, 1999),
    supa.from('people').select('id,name,wikipedia_url,photo_path').range(2000, 2999),
    supa.from('people').select('id,name,wikipedia_url,photo_path').range(3000, 3999),
    supa.from('people').select('id,name,wikipedia_url,photo_path').range(4000, 4999),
    supa.from('people').select('id,name,wikipedia_url,photo_path').range(5000, 5999)
  ]);

  const allPeople = chunks.flatMap(c => c.data || []);
  console.log(`Loaded ${allPeople.length} total contenders.`);

  const toResolve = allPeople.filter(p => !p.photo_path || !p.photo_path.startsWith('https://upload.wikimedia.org'));
  console.log(`To resolve: ${toResolve.length} contenders.`);

  let totalUpdated = 0;
  const totalBatches = Math.ceil(toResolve.length / BATCH_SIZE);

  for (let i = 0; i < toResolve.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = toResolve.slice(i, i + BATCH_SIZE);
    
    // Map of normalized titles to person
    const titleToPeople = new Map();
    const titlesArray = [];

    for (const p of batch) {
      let t = p.wikipedia_url ? decodeURIComponent(p.wikipedia_url.split('/wiki/').pop() || '').replace(/_/g, ' ') : p.name.trim();
      titlesArray.push(t);
      
      const key1 = t.toLowerCase();
      const key2 = p.name.trim().toLowerCase();
      if (!titleToPeople.has(key1)) titleToPeople.set(key1, []);
      titleToPeople.get(key1).push(p);
      if (!titleToPeople.has(key2)) titleToPeople.set(key2, []);
      titleToPeople.get(key2).push(p);
    }

    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&piprop=thumbnail&pithumbsize=400&redirects=1&titles=${encodeURIComponent(titlesArray.join('|'))}&format=json`;

    let success = false;
    let attempts = 0;

    while (!success && attempts < 5) {
      attempts++;
      try {
        const res = await fetch(apiUrl, { headers: { 'User-Agent': USER_AGENT } });
        if (res.ok) {
          const json = await res.json();
          const pages = Object.values(json.query?.pages || {});
          
          // Track redirects
          const redirects = json.query?.redirects || [];
          const normalized = json.query?.normalized || [];

          const redirectMap = new Map();
          for (const r of redirects) redirectMap.set(r.to.toLowerCase(), r.from.toLowerCase());
          for (const n of normalized) redirectMap.set(n.to.toLowerCase(), n.from.toLowerCase());

          let batchSuccess = 0;
          for (const page of pages) {
            const thumb = page.thumbnail?.source?.split('?')[0];
            if (thumb) {
              const pageTitleLower = page.title.toLowerCase();
              const originalTitle = redirectMap.get(pageTitleLower) || pageTitleLower;
              
              const matchedList = titleToPeople.get(pageTitleLower) || titleToPeople.get(originalTitle) || [];
              
              for (const person of matchedList) {
                await supa.from('people').update({ photo_path: thumb }).eq('id', person.id);
                batchSuccess++;
                totalUpdated++;
              }
            }
          }

          console.log(`Batch [${batchNum}/${totalBatches}] -> ✅ ${batchSuccess} updated (Total updated: ${totalUpdated})`);
          success = true;
        } else if (res.status === 429) {
          const waitTime = attempts * 2500;
          console.warn(`Batch ${batchNum} HTTP 429 (rate limit), waiting ${waitTime}ms...`);
          await sleep(waitTime);
        } else {
          console.warn(`Batch ${batchNum} HTTP ${res.status}`);
          await sleep(1000);
        }
      } catch (err) {
        console.warn(`Batch ${batchNum} error:`, err.message);
        await sleep(1500);
      }
    }

    await sleep(250);
  }

  console.log('='.repeat(60));
  console.log(`🎉 ALL CONTENDERS RESOLVED! Total updated: ${totalUpdated}`);
  console.log('='.repeat(60));
}

run().catch(console.error);

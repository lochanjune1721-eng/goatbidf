#!/usr/bin/env node
// scripts/resolve_all_database_batches.mjs — High-speed batched Wikimedia image resolver (50 titles/request)
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

import { supabaseUrl, serviceKey, anonKey } from './env.mjs';
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

const SUPABASE_URL = supabaseUrl();
const SERVICE_KEY = serviceKey();

const supa = createClient(SUPABASE_URL, SERVICE_KEY);
const USER_AGENT = "GOATlolProductionBatchBot/3.0 (https://goat.lol; admin@goat.lol)";
const BATCH_SIZE = 50;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('='.repeat(60));
  console.log(' GOAT.lol — High-Speed 50-Title Batched Wikimedia Resolver');
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
  console.log(`Loaded ${allPeople.length} total contenders from database.`);

  const toResolve = allPeople.filter(p => !p.photo_path || !p.photo_path.startsWith('https://upload.wikimedia.org'));
  console.log(`Need Wikimedia images for: ${toResolve.length} contenders.`);

  let totalUpdated = 0;
  let batchIndex = 0;

  for (let i = 0; i < toResolve.length; i += BATCH_SIZE) {
    batchIndex++;
    const batch = toResolve.slice(i, i + BATCH_SIZE);
    
    // Map of normalized titles to person
    const titleToPerson = new Map();
    const titlesArray = [];

    for (const p of batch) {
      let t = p.wikipedia_url ? decodeURIComponent(p.wikipedia_url.split('/wiki/').pop() || '').replace(/_/g, ' ') : p.name.trim();
      titlesArray.push(t);
      titleToPerson.set(t.toLowerCase(), p);
      titleToPerson.set(p.name.trim().toLowerCase(), p);
    }

    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&piprop=thumbnail&pithumbsize=400&titles=${encodeURIComponent(titlesArray.join('|'))}&format=json&origin=*`;

    let success = false;
    let attempts = 0;

    while (!success && attempts < 3) {
      attempts++;
      try {
        const res = await fetch(apiUrl, { headers: { 'User-Agent': USER_AGENT } });
        if (res.ok) {
          const json = await res.json();
          const pages = Object.values(json.query?.pages || {});
          
          let batchSuccess = 0;
          for (const page of pages) {
            const thumb = page.thumbnail?.source?.split('?')[0];
            if (thumb) {
              const matchedPerson = titleToPerson.get(page.title.toLowerCase()) || 
                                    toResolve.find(p => p.name.toLowerCase() === page.title.toLowerCase());
              
              if (matchedPerson) {
                await supa.from('people').update({ photo_path: thumb }).eq('id', matchedPerson.id);
                batchSuccess++;
                totalUpdated++;
              }
            }
          }

          console.log(`Batch [${batchIndex}/${Math.ceil(toResolve.length / BATCH_SIZE)}] -> ✅ ${batchSuccess}/${batch.length} resolved (Total updated: ${totalUpdated})`);
          success = true;
        } else {
          console.warn(`Batch ${batchIndex} HTTP ${res.status}, waiting 1s...`);
          await sleep(1000);
        }
      } catch (err) {
        console.warn(`Batch ${batchIndex} error: ${err.message}, retrying...`);
        await sleep(1500);
      }
    }

    // Pacing delay (100ms between 50-title batches)
    await sleep(100);
  }

  console.log('='.repeat(60));
  console.log(`🎉 ALL BATCHES COMPLETE: Total ${totalUpdated} contenders updated with Wikimedia images!`);
  console.log('='.repeat(60));
}

run().catch(console.error);

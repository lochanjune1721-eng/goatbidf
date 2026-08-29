#!/usr/bin/env node
// scripts/resolve_top_contenders.mjs — Resolve all Category #1 and #2 contenders to Wikimedia Commons
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { resolveWikimediaImage } from './wikimedia_resolver.mjs';

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

async function run() {
  console.log('Fetching all categories and contenders...');
  const { data: cats } = await supa.from('categories').select('*').order('sort_order');
  
  const chunks = await Promise.all([
    supa.from('people').select('id,name,photo_path,category_id,blurb,wikipedia_url,total_cents').range(0, 999),
    supa.from('people').select('id,name,photo_path,category_id,blurb,wikipedia_url,total_cents').range(1000, 1999),
    supa.from('people').select('id,name,photo_path,category_id,blurb,wikipedia_url,total_cents').range(2000, 2999),
    supa.from('people').select('id,name,photo_path,category_id,blurb,wikipedia_url,total_cents').range(3000, 3999),
    supa.from('people').select('id,name,photo_path,category_id,blurb,wikipedia_url,total_cents').range(4000, 4999),
    supa.from('people').select('id,name,photo_path,category_id,blurb,wikipedia_url,total_cents').range(5000, 5999),
  ]);
  const people = chunks.flatMap(c => c.data || []);
  
  const peopleByCat = {};
  for (const p of people) {
    if (!peopleByCat[p.category_id]) peopleByCat[p.category_id] = [];
    peopleByCat[p.category_id].push(p);
  }

  const topContenders = [];
  for (const c of cats) {
    const cPeople = peopleByCat[c.id] || [];
    const p1 = cPeople[0], p2 = cPeople[1];
    if (p1) topContenders.push({ person: p1, catName: c.name });
    if (p2) topContenders.push({ person: p2, catName: c.name });
  }

  console.log(`Found ${topContenders.length} top contenders for homepage boards.`);
  
  let resolved = 0, skipped = 0;
  for (let i = 0; i < topContenders.length; i++) {
    const { person, catName } = topContenders[i];
    if (person.photo_path && person.photo_path.startsWith('https://upload.wikimedia.org')) {
      skipped++;
      continue;
    }

    try {
      const res = await resolveWikimediaImage({
        name: person.name,
        category: catName,
        blurb: person.blurb || '',
        wikipediaUrl: person.wikipedia_url || ''
      });

      if (res.data?.wikimedia_thumbnail_url) {
        await supa.from('people').update({
          photo_path: res.data.wikimedia_thumbnail_url,
          photo_credit: res.data.image_author,
          photo_license: res.data.image_license
        }).eq('id', person.id);
        resolved++;
        console.log(`[${i+1}/${topContenders.length}] ✅ ${person.name} (${catName}) -> ${res.data.wikimedia_file_title}`);
      } else {
        console.log(`[${i+1}/${topContenders.length}] ⚠️  ${person.name} (${catName}) -> No image`);
      }
    } catch(e) {
      console.warn(`[${i+1}/${topContenders.length}] Error:`, person.name, e.message);
    }
  }

  console.log(`Finished: ${resolved} resolved, ${skipped} already cached.`);
}

run().catch(console.error);

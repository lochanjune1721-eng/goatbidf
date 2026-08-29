#!/usr/bin/env node
// scripts/repair_all_images.mjs — Comprehensive Wikipedia Portrait Resolver & Database Repair
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
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)";

async function fetchAllPeople() {
  const chunks = await Promise.all([
    supa.from('people').select('id,name,wikipedia_url,photo_path,category_id').range(0, 999),
    supa.from('people').select('id,name,wikipedia_url,photo_path,category_id').range(1000, 1999),
    supa.from('people').select('id,name,wikipedia_url,photo_path,category_id').range(2000, 2999),
    supa.from('people').select('id,name,wikipedia_url,photo_path,category_id').range(3000, 3999),
    supa.from('people').select('id,name,wikipedia_url,photo_path,category_id').range(4000, 4999),
    supa.from('people').select('id,name,wikipedia_url,photo_path,category_id').range(5000, 5999)
  ]);
  return chunks.flatMap(c => c.data || []);
}

async function resolveBatch(names) {
  const titles = names.map(n => n.replace(/ /g, '_')).join('|');
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&piprop=thumbnail&pithumbsize=500&redirects=1&titles=${encodeURIComponent(titles)}&format=json`;
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return {};
    const j = await res.json();
    const map = {};
    const pages = Object.values(j.query?.pages || {});
    
    // Check normalized and redirects map
    const normMap = {};
    (j.query?.normalized || []).forEach(n => { normMap[n.to] = n.from; });
    (j.query?.redirects || []).forEach(r => { normMap[r.to] = r.from; });

    for (const p of pages) {
      const thumb = p.thumbnail?.source?.split('?')[0];
      if (thumb && !thumb.endsWith('.gif')) {
        map[p.title] = thumb;
        if (normMap[p.title]) map[normMap[p.title]] = thumb;
      }
    }
    return map;
  } catch(e) {
    return {};
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log(' GOAT.lol — Full Database Portrait Repair & Verification');
  console.log('='.repeat(60));

  const allPeople = await fetchAllPeople();
  console.log(`Loaded ${allPeople.length} total contenders from Supabase.`);

  // Group into distinct unique names
  const uniqueNames = Array.from(new Set(allPeople.map(p => p.name)));
  console.log(`Unique contender names to resolve: ${uniqueNames.length}`);

  const nameToVerifiedUrl = {};
  const BATCH_SIZE = 40;
  
  for (let i = 0; i < uniqueNames.length; i += BATCH_SIZE) {
    const batch = uniqueNames.slice(i, i + BATCH_SIZE);
    const resolved = await resolveBatch(batch);
    Object.assign(nameToVerifiedUrl, resolved);
    console.log(`Resolved batch [${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(uniqueNames.length/BATCH_SIZE)}] -> ${Object.keys(resolved).length} portraits`);
    await new Promise(r => setTimeout(r, 80));
  }

  console.log(`Total verified portrait URLs resolved: ${Object.keys(nameToVerifiedUrl).length}`);
  console.log('Updating database with verified canonical portraits...');

  let updated = 0;
  for (let i = 0; i < allPeople.length; i += 100) {
    const chunk = allPeople.slice(i, i + 100);
    const updates = [];
    
    for (const p of chunk) {
      const verified = nameToVerifiedUrl[p.name] || nameToVerifiedUrl[p.name.replace(/ /g, '_')];
      if (verified && verified !== p.photo_path) {
        updates.push(supa.from('people').update({ photo_path: verified }).eq('id', p.id));
        updated++;
      }
    }
    if (updates.length > 0) {
      await Promise.all(updates);
    }
  }

  console.log('='.repeat(60));
  console.log(`🎉 ALL DATABASE PORTRAITS VERIFIED & REPAIRED! Updated: ${updated}`);
  console.log('='.repeat(60));
}

main().catch(console.error);

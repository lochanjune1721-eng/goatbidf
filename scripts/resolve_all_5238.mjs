#!/usr/bin/env node
// scripts/resolve_all_5238.mjs — Comprehensive resolver for ALL contenders in GOAT.lol
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
const USER_AGENT = "GOATlolProductionBot/2.0 (contact@goat.lol)";
const CONCURRENCY = 16;

async function resolveContender(name, wikipediaUrl) {
  const searchName = name.trim();
  const wikiTitle = wikipediaUrl ? decodeURIComponent(wikipediaUrl.split('/wiki/').pop() || '').replace(/_/g, ' ') : searchName;

  // 1. Direct Wikipedia Query
  const q1 = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&piprop=original|thumbnail&pithumbsize=400&titles=${encodeURIComponent(wikiTitle)}&format=json&origin=*`;
  try {
    const r1 = await fetch(q1, { headers: { 'User-Agent': USER_AGENT } });
    if (r1.ok) {
      const j1 = await r1.json();
      const p1 = j1.query?.pages ? Object.values(j1.query.pages)[0] : null;
      if (p1 && !p1.missing) {
        const thumb = p1.thumbnail?.source || p1.original?.source;
        if (thumb) return thumb.split('?')[0];
      }
    }
  } catch (e) {}

  // 2. Search fallback
  const q2 = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchName)}&gsrlimit=3&prop=pageimages&piprop=original|thumbnail&pithumbsize=400&format=json&origin=*`;
  try {
    const r2 = await fetch(q2, { headers: { 'User-Agent': USER_AGENT } });
    if (r2.ok) {
      const j2 = await r2.json();
      const pages = j2.query?.pages ? Object.values(j2.query.pages) : [];
      for (const p of pages) {
        const thumb = p.thumbnail?.source || p.original?.source;
        if (thumb) return thumb.split('?')[0];
      }
    }
  } catch (e) {}

  return null;
}

async function start() {
  console.log('Loading all 5,238 contenders from Supabase...');
  const chunks = await Promise.all([
    supa.from('people').select('id,name,photo_path,wikipedia_url').range(0, 999),
    supa.from('people').select('id,name,photo_path,wikipedia_url').range(1000, 1999),
    supa.from('people').select('id,name,photo_path,wikipedia_url').range(2000, 2999),
    supa.from('people').select('id,name,photo_path,wikipedia_url').range(3000, 3999),
    supa.from('people').select('id,name,photo_path,wikipedia_url').range(4000, 4999),
    supa.from('people').select('id,name,photo_path,wikipedia_url').range(5000, 5999),
  ]);

  const allPeople = chunks.flatMap(c => c.data || []);
  const needsResolution = allPeople.filter(p => !p.photo_path || !p.photo_path.startsWith('https://upload.wikimedia.org'));
  
  console.log(`Total: ${allPeople.length} | Already Resolved: ${allPeople.length - needsResolution.length} | To Resolve: ${needsResolution.length}`);

  let index = 0;
  let resolvedCount = 0;
  let missingCount = 0;

  async function worker(id) {
    while (index < needsResolution.length) {
      const i = index++;
      const person = needsResolution[i];

      const thumb = await resolveContender(person.name, person.wikipedia_url);
      if (thumb) {
        await supa.from('people').update({ photo_path: thumb }).eq('id', person.id);
        resolvedCount++;
      } else {
        missingCount++;
      }

      if ((resolvedCount + missingCount) % 50 === 0 || index >= needsResolution.length) {
        console.log(`[Worker ${id}] Progress: ${resolvedCount + missingCount}/${needsResolution.length} -> ✅ ${resolvedCount} resolved`);
      }

      await new Promise(r => setTimeout(r, 40));
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log('='.repeat(50));
  console.log(`🎉 ALL DONE: ${resolvedCount} newly resolved to Wikimedia Commons.`);
  console.log('='.repeat(50));
}

start().catch(console.error);

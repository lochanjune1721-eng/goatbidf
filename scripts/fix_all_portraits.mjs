#!/usr/bin/env node
// scripts/fix_all_portraits.mjs — Fix non-portrait images (replace graphs, statues, jerseys, maps with real human portraits)
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
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const NON_PORTRAIT_PATTERNS = [
  'graph', 'chart', 'statue', 'monument', 'jersey', 'logo', 'map', 'diagram', 
  'stadium', 'drawing', 'illustration', 'cover', 'poster', 'plaque', 'stamp', 
  'coin', 'signature', 'autograph', 'grave', 'tomb', 'flag', 'coat_of_arms',
  'house', 'building', 'sculpture', 'bust', 'memorial'
];

function isNonPortrait(url) {
  if (!url) return true;
  const lower = url.toLowerCase();
  if (lower.endsWith('.png') && (lower.includes('graph') || lower.includes('chart') || lower.includes('diagram') || lower.includes('logo'))) return true;
  return NON_PORTRAIT_PATTERNS.some(p => lower.includes(p));
}

async function findBestHumanPortrait(name, wikiUrl) {
  const wikiTitle = wikiUrl ? decodeURIComponent(wikiUrl.split('/wiki/').pop() || '').replace(/_/g, ' ') : name.trim();

  // 1. Fetch images on the Wikipedia article
  const api = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|images|pageprops&piprop=thumbnail|original&pithumbsize=500&titles=${encodeURIComponent(wikiTitle)}&format=json`;
  
  try {
    const res = await fetch(api, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const json = await res.json();
    const page = Object.values(json.query?.pages || {})[0];
    if (!page || page.missing) return null;

    // Check pageprops page_image_free
    const freeImage = page.pageprops?.page_image_free || page.pageprops?.page_image;
    if (freeImage && !isNonPortrait(freeImage)) {
      // Get direct thumbnail for this file
      const fileInfoApi = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&iiurlwidth=500&titles=File:${encodeURIComponent(freeImage)}&format=json`;
      const fRes = await fetch(fileInfoApi, { headers: { 'User-Agent': USER_AGENT } });
      if (fRes.ok) {
        const fJson = await fRes.json();
        const fPage = Object.values(fJson.query?.pages || {})[0];
        const thumb = fPage?.imageinfo?.[0]?.thumburl || fPage?.imageinfo?.[0]?.url;
        if (thumb && !isNonPortrait(thumb)) return thumb.split('?')[0];
      }
    }

    // Check lead thumbnail if it is not a graph/statue
    const leadThumb = page.thumbnail?.source;
    if (leadThumb && !isNonPortrait(leadThumb)) {
      return leadThumb.split('?')[0];
    }

    // Search Commons for a real photo of the person
    const searchApi = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(name + ' portrait')}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json`;
    const sRes = await fetch(searchApi, { headers: { 'User-Agent': USER_AGENT } });
    if (sRes.ok) {
      const sJson = await sRes.json();
      const sPages = Object.values(sJson.query?.pages || {});
      for (const sp of sPages) {
        const title = sp.title || '';
        const thumb = sp.imageinfo?.[0]?.thumburl || sp.imageinfo?.[0]?.url;
        if (thumb && !isNonPortrait(title) && !isNonPortrait(thumb)) {
          return thumb.split('?')[0];
        }
      }
    }
  } catch (e) {}

  return null;
}

async function main() {
  console.log('='.repeat(60));
  console.log(' GOAT.lol — Human Portrait Verifier & Cleaner');
  console.log('='.repeat(60));

  // Specific fix for Kapil Dev
  const kapilPhoto = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Kapil_Dev_at_Equation_sports_auction_%283x4_cropped%29.jpg/500px-Kapil_Dev_at_Equation_sports_auction_%283x4_cropped%29.jpg';
  await supa.from('people').update({ photo_path: kapilPhoto }).ilike('name', '%kapil dev%');
  console.log('✅ Updated all Kapil Dev records to official portrait photo!');

  // Specific fix for Michael Jordan
  const mjPhoto = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Jordan_lipofsky.jpg/500px-Jordan_lipofsky.jpg';
  await supa.from('people').update({ photo_path: mjPhoto }).ilike('name', 'Michael Jordan');
  console.log('✅ Updated Michael Jordan to official portrait photo!');

  // Specific fix for Garrincha
  const garrinchaPhoto = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Manoel_Francisco_dos_Santos_cropped.jpg/500px-Manoel_Francisco_dos_Santos_cropped.jpg';
  await supa.from('people').update({ photo_path: garrinchaPhoto }).ilike('name', 'Garrincha');
  console.log('✅ Updated Garrincha to official portrait photo!');

  // Load all people to scan for graphs, statues, jerseys, etc.
  const chunks = await Promise.all([
    supa.from('people').select('id,name,wikipedia_url,photo_path').range(0, 999),
    supa.from('people').select('id,name,wikipedia_url,photo_path').range(1000, 1999),
    supa.from('people').select('id,name,wikipedia_url,photo_path').range(2000, 2999),
    supa.from('people').select('id,name,wikipedia_url,photo_path').range(3000, 3999),
    supa.from('people').select('id,name,wikipedia_url,photo_path').range(4000, 4999),
    supa.from('people').select('id,name,wikipedia_url,photo_path').range(5000, 5999),
  ]);

  const allPeople = chunks.flatMap(c => c.data || []);
  const suspicious = allPeople.filter(p => isNonPortrait(p.photo_path));
  console.log(`Found ${suspicious.length} entries with non-portrait/graph/statue images to fix.`);

  let fixed = 0;
  for (let i = 0; i < suspicious.length; i++) {
    const person = suspicious[i];
    const newPortrait = await findBestHumanPortrait(person.name, person.wikipedia_url);
    if (newPortrait) {
      await supa.from('people').update({ photo_path: newPortrait }).eq('id', person.id);
      fixed++;
      console.log(`[${i+1}/${suspicious.length}] ✅ Fixed portrait for: ${person.name} -> ${newPortrait.slice(0, 70)}`);
    } else {
      console.log(`[${i+1}/${suspicious.length}] ⚠️  No alternative portrait for: ${person.name}`);
    }
    await new Promise(r => setTimeout(r, 60));
  }

  console.log('='.repeat(60));
  console.log(`🎉 Complete: Fixed ${fixed} non-portrait images!`);
  console.log('='.repeat(60));
}

main().catch(console.error);

#!/usr/bin/env node
// GOAT.lol seeding — Wikidata SPARQL per category + image download 800x800 + Supabase storage
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.js [--dry]
// Requires: npm i @supabase/supabase-js sharp

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes('--dry');

if(!SUPABASE_URL || !SERVICE_KEY){ console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const supa = createClient(SUPABASE_URL, SERVICE_KEY);

const CATEGORIES = [
  { slug:'footballers', name:'Footballers', group:'Football', wikidataOccupation:'Q937857', kind:'occupation', limit:20 },
  { slug:'managers', name:'Managers', group:'Football', wikidataOccupation:'Q2467161', kind:'occupation', limit:20 },
  { slug:'goalkeepers', name:'Goalkeepers', group:'Football', wikidataOccupation:'Q264765', kind:'occupation', limit:20 },
  { slug:'batsmen', name:'Batsmen', group:'Cricket', wikidataOccupation:'Q12299841', kind:'occupation', limit:20 },
  { slug:'bowlers', name:'Bowlers', group:'Cricket', wikidataOccupation:'Q12299841', kind:'occupation', limit:20 },
  { slug:'all-rounders', name:'All-rounders', group:'Cricket', wikidataOccupation:'Q12299841', kind:'occupation', limit:20 },
  { slug:'captains', name:'Captains', group:'Cricket', wikidataOccupation:'Q12299841', kind:'occupation', limit:20 },
  { slug:'ipl-players', name:'IPL Players', group:'Cricket', wikidataOccupation:'Q12299841', kind:'occupation', limit:20 },
  { slug:'wicketkeepers', name:'Wicketkeepers', group:'Cricket', wikidataOccupation:'Q12299841', kind:'occupation', limit:20 },
  { slug:'basketball-players', name:'Basketball Players', group:'Basketball', wikidataOccupation:'Q3665646', kind:'occupation', limit:20 },
  { slug:'tennis-men', name:'Tennis — Men', group:'Tennis', wikidataOccupation:'Q10833314', kind:'occupation', limit:20 },
  { slug:'tennis-women', name:'Tennis — Women', group:'Tennis', wikidataOccupation:'Q10833314', kind:'occupation', limit:20 },
  { slug:'boxers', name:'Boxers', group:'Combat', wikidataOccupation:'Q11338576', kind:'occupation', limit:20 },
  { slug:'mma-fighters', name:'MMA Fighters', group:'Combat', wikidataOccupation:'Q13474373', kind:'occupation', limit:20 },
  { slug:'wrestlers', name:'Wrestlers', group:'Combat', wikidataOccupation:'Q13474373', kind:'occupation', limit:20 },
  { slug:'f1-drivers', name:'F1 Drivers', group:'Motorsport', wikidataOccupation:'Q10873181', kind:'occupation', limit:20 },
  { slug:'motogp-riders', name:'MotoGP Riders', group:'Motorsport', wikidataOccupation:'Q3443852', kind:'occupation', limit:20 },
  { slug:'track-athletes', name:'Track Athletes', group:'Other Sport', wikidataOccupation:'Q11513337', kind:'occupation', limit:20 },
  { slug:'swimmers', name:'Swimmers', group:'Other Sport', wikidataOccupation:'Q10843402', kind:'occupation', limit:20 },
  { slug:'golfers', name:'Golfers', group:'Other Sport', wikidataOccupation:'Q13141064', kind:'occupation', limit:20 },
  { slug:'hockey-players', name:'Hockey Players', group:'Other Sport', wikidataOccupation:'Q11774891', kind:'occupation', limit:20 },
  { slug:'gymnasts', name:'Gymnasts', group:'Other Sport', wikidataOccupation:'Q13382576', kind:'occupation', limit:20 },
  { slug:'cyclists', name:'Cyclists', group:'Other Sport', wikidataOccupation:'Q2309784', kind:'occupation', limit:20 },
  { slug:'chess-players', name:'Chess Players', group:'Mind Sports', wikidataOccupation:'Q10873181', kind:'occupation', limit:20 },
  { slug:'esports-players', name:'Esports Players', group:'Mind Sports', wikidataOccupation:'Q4379701', kind:'occupation', limit:20 },
  { slug:'poker-players', name:'Poker Players', group:'Mind Sports', wikidataOccupation:'Q13141064', kind:'occupation', limit:20 },
  { slug:'hollywood-actors', name:'Hollywood Actors', group:'Screen', wikidataOccupation:'Q33999', kind:'occupation', limit:20 },
  { slug:'hollywood-actresses', name:'Hollywood Actresses', group:'Screen', wikidataOccupation:'Q33999', kind:'occupation', limit:20 },
  { slug:'bollywood-actors', name:'Bollywood Actors', group:'Screen', wikidataOccupation:'Q33999', kind:'occupation', limit:20 },
  { slug:'bollywood-actresses', name:'Bollywood Actresses', group:'Screen', wikidataOccupation:'Q33999', kind:'occupation', limit:20 },
  { slug:'korean-actors', name:'Korean Actors', group:'Screen', wikidataOccupation:'Q33999', kind:'occupation', limit:20 },
  { slug:'directors', name:'Directors', group:'Screen', wikidataOccupation:'Q252625', kind:'occupation', limit:20 },
  { slug:'comedians', name:'Comedians', group:'Screen', wikidataOccupation:'Q245068', kind:'occupation', limit:20 },
  { slug:'singers', name:'Singers', group:'Music', wikidataOccupation:'Q177220', kind:'occupation', limit:20 },
  { slug:'rappers', name:'Rappers', group:'Music', wikidataOccupation:'Q134823', kind:'occupation', limit:20 },
  { slug:'guitarists', name:'Guitarists', group:'Music', wikidataOccupation:'Q855091', kind:'occupation', limit:20 },
  { slug:'drummers', name:'Drummers', group:'Music', wikidataOccupation:'Q109763', kind:'occupation', limit:20 },
  { slug:'composers', name:'Composers', group:'Music', wikidataOccupation:'Q36834', kind:'occupation', limit:20 },
  { slug:'producers', name:'Producers', group:'Music', wikidataOccupation:'Q183030', kind:'occupation', limit:20 },
  { slug:'djs', name:'DJs', group:'Music', wikidataOccupation:'Q130857', kind:'occupation', limit:20 },
  { slug:'scientists', name:'Scientists', group:'Mind', wikidataOccupation:'Q901', kind:'occupation', limit:20 },
  { slug:'physicists', name:'Physicists', group:'Mind', wikidataOccupation:'Q169470', kind:'occupation', limit:20 },
  { slug:'mathematicians', name:'Mathematicians', group:'Mind', wikidataOccupation:'Q170790', kind:'occupation', limit:20 },
  { slug:'chemists', name:'Chemists', group:'Mind', wikidataOccupation:'Q593644', kind:'occupation', limit:20 },
  { slug:'biologists', name:'Biologists', group:'Mind', wikidataOccupation:'Q864503', kind:'occupation', limit:20 },
  { slug:'philosophers', name:'Philosophers', group:'Mind', wikidataOccupation:'Q4964182', kind:'occupation', limit:20 },
  { slug:'economists', name:'Economists', group:'Mind', wikidataOccupation:'Q188094', kind:'occupation', limit:20 },
  { slug:'inventors', name:'Inventors', group:'Mind', wikidataOccupation:'Q205375', kind:'occupation', limit:20 },
  { slug:'astronauts', name:'Astronauts', group:'Mind', wikidataOccupation:'Q11631', kind:'occupation', limit:20 },
  { slug:'novelists', name:'Novelists', group:'Words', wikidataOccupation:'Q6625963', kind:'occupation', limit:20 },
  { slug:'poets', name:'Poets', group:'Words', wikidataOccupation:'Q49757', kind:'occupation', limit:20 },
  { slug:'playwrights', name:'Playwrights', group:'Words', wikidataOccupation:'Q214917', kind:'occupation', limit:20 },
  { slug:'us-presidents', name:'US Presidents', group:'Power', wikidataOccupation:'Q11696', kind:'position', limit:20 },
  { slug:'indian-pms', name:'Indian PMs', group:'Power', wikidataOccupation:'Q30185', kind:'position', limit:20 },
  { slug:'founders', name:'Founders', group:'Business', wikidataOccupation:'Q1126646', kind:'occupation', limit:20 },
  { slug:'investors', name:'Investors', group:'Business', wikidataOccupation:'Q1422780', kind:'occupation', limit:20 },
  { slug:'ceos', name:'CEOs', group:'Business', wikidataOccupation:'Q484876', kind:'occupation', limit:20 },
  { slug:'painters', name:'Painters', group:'Culture', wikidataOccupation:'Q1028181', kind:'occupation', limit:20 },
  { slug:'photographers', name:'Photographers', group:'Culture', wikidataOccupation:'Q33231', kind:'occupation', limit:20 },
  { slug:'architects', name:'Architects', group:'Culture', wikidataOccupation:'Q42973', kind:'occupation', limit:20 },
  { slug:'chefs', name:'Chefs', group:'Culture', wikidataOccupation:'Q1281618', kind:'occupation', limit:20 },
  { slug:'fashion-designers', name:'Fashion Designers', group:'Culture', wikidataOccupation:'Q3501317', kind:'occupation', limit:20 },
  { slug:'dancers', name:'Dancers', group:'Culture', wikidataOccupation:'Q5716684', kind:'occupation', limit:20 },
  { slug:'youtubers', name:'YouTubers', group:'Internet', wikidataOccupation:'Q17125263', kind:'occupation', limit:20 },
  { slug:'streamers', name:'Streamers', group:'Internet', wikidataOccupation:'Q17125263', kind:'occupation', limit:20 },
  { slug:'podcasters', name:'Podcasters', group:'Internet', wikidataOccupation:'Q17125263', kind:'occupation', limit:20 },
];

async function sparqlFor(cat){
  // Wikidata sitelinks ORDER BY times out behind proxy (504) — try ordered, fallback to unordered LIMIT 20
  const build = (ordered) => {
    // Minimal query — P31 is redundant and sitelinks ORDER BY times out (504) behind proxy
    // Use LIMIT 20 without ordering for speed; fetch description and image optionally
    const prop = cat.kind==='position' ? `wdt:P39 wd:${cat.wikidataOccupation}` : `wdt:P106 wd:${cat.wikidataOccupation}`;
    return `SELECT ?person ?personLabel ?description ?image WHERE {
      ?person ${prop}.
      OPTIONAL { ?person wdt:P18 ?image. }
      OPTIONAL { ?person schema:description ?description. FILTER(LANG(?description)="en") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT `+cat.limit;
  };
  for(let attempt=0; attempt<3; attempt++){
    const ordered = attempt===0;
    const q = build(ordered);
    const url = 'https://query.wikidata.org/sparql?query=' + encodeURIComponent(q);
    try{
      const r = await fetch(url, { headers: { 'Accept':'application/sparql-results+json', 'User-Agent':'GOAT.lol/1.0 (https://goat.lol; contact@goat.lol)' }});
      if(!r.ok){
        const txt=await r.text().then(t=>t.slice(0,600));
        if((r.status>=500 || r.status===429) && attempt<2){ const wait = r.status===429 ? 2500*(attempt+1) : 800*(attempt+1); await new Promise(r=>setTimeout(r, wait)); continue; }
        throw new Error('SPARQL '+r.status+' '+txt);
      }
      const j = await r.json();
      return j.results.bindings.map(b=>({
        wikidata: b.person.value,
        name: b.personLabel.value,
        description: b.description?.value || '',
        image: b.image?.value || null,
        sitelinks: Number(b.sitelinks?.value||0)
      }));
    }catch(e){
      if(attempt<2){ await new Promise(r=>setTimeout(r, 800*(attempt+1))); continue; }
      throw e;
    }
  }
}

async function downloadAndStore(imageUrl, slug){
  if(!imageUrl) return { path:null, credit:null, license:null };
  let credit=null, license=null;
  try{
    const file = decodeURIComponent(imageUrl.split('/').pop());
    const api = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata|user&titles=File:${encodeURIComponent(file)}&format=json&origin=*`;
    const r = await fetch(api, { headers: { 'User-Agent':'GOAT.lol/1.0 (https://goat.lol; contact@goat.lol)' }}); const j=await r.json();
    const pages = j.query?.pages; const p = pages && Object.values(pages)[0];
    const meta = p?.imageinfo?.[0]?.extmetadata;
    license = meta?.LicenseShortName?.value || meta?.UsageTerms?.value || null;
    credit = p?.imageinfo?.[0]?.user ? `Photo: ${p.imageinfo[0].user} via Wikimedia Commons` : 'Photo: Wikimedia Commons';
    const bad = ['Fair use','Non-free','Copyrighted'];
    if(license && bad.some(b=> license.includes(b))) return { path:null, credit:null, license:null };
  }catch{}
  const imgRes = await fetch(imageUrl, { headers: { 'User-Agent':'GOAT.lol/1.0 (https://goat.lol; contact@goat.lol)' }});
  if(!imgRes.ok) return { path:null, credit, license };
  const buf = Buffer.from(await imgRes.arrayBuffer());
  let out = buf;
  try{
    const sharp = (await import('sharp')).default;
    out = await sharp(buf).resize(800,800,{fit:'cover', position:'centre'}).jpeg({quality:82}).toBuffer();
  }catch(e){ console.warn('sharp failed', e.message); }
  const filePath = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2,4)}.jpg`;
  if(DRY){ fs.writeFileSync(`/tmp/${slug}.jpg`, out); return { path: filePath, credit, license }; }
  const { error } = await supa.storage.from('people').upload(filePath, out, { contentType:'image/jpeg', upsert:false });
  if(error){ console.warn('upload failed', filePath, error.message); return { path:null, credit, license }; }
  return { path: filePath, credit, license };
}

async function seed(){
  const {data: cats} = await supa.from('categories').select('*');
  for(const cat of CATEGORIES){
    const dbCat = cats.find(c=> c.slug===cat.slug);
    if(!dbCat){ console.warn('missing category', cat.slug); continue; }
    console.log(`\n== ${cat.slug} ==`);
    let rows;
    try{ rows = await sparqlFor(cat); }catch(e){ console.error('sparql failed', cat.slug, e.message); continue; }
    for(const r of rows){
      const slug = r.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,24).replace(/^-|-$/g,'') + '-' + Math.random().toString(36).slice(2,4);
      const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(r.name.replace(/ /g,'_'))}`;
      const { path: photoPath, credit, license } = await downloadAndStore(r.image, slug);
      if(DRY){ console.log(`dry ${r.name} -> ${photoPath} ${license}`); continue; }
      const { error } = await supa.from('people').insert({
        slug, category_id: dbCat.id, name: r.name, blurb: r.description.slice(0,120), wikipedia_url: wikiUrl, photo_path: photoPath, photo_credit: credit, photo_license: license, total_cents: 0
      });
      if(error) console.warn('insert failed', r.name, error.message);
      else console.log('inserted', r.name, photoPath? 'photo ok':'no photo', license||'');
      await new Promise(r=> setTimeout(r, 800));
    }
  }
  console.log('\nDone. Everyone seeds at $0 — $1 takes #1. Review manually in /admin.html — swap bad photos, delete wrong entries, add missing names (~3 min/board).');
}
seed().catch(e=>{ console.error(e); process.exit(1); });

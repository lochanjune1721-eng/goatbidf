#!/usr/bin/env node
// Fetch all 83 categories from Wikidata + prepare people inserts (no image download by default)
// Writes data/wikidata-people.json and can optionally seed Supabase when --seed is passed
import fs from 'fs';
import path from 'path';

const CATS = [
  { slug:'footballers', name:'Footballers', group:'Football', q:'Q937857', kind:'occupation' },
  { slug:'managers', name:'Managers', group:'Football', q:'Q2467161', kind:'occupation' },
  { slug:'goalkeepers', name:'Goalkeepers', group:'Football', q:'Q264765', kind:'occupation' },
  { slug:'batsmen', name:'Batsmen', group:'Cricket', q:'Q12299841', kind:'occupation' },
  { slug:'bowlers', name:'Bowlers', group:'Cricket', q:'Q12299841', kind:'occupation' },
  { slug:'all-rounders', name:'All-rounders', group:'Cricket', q:'Q12299841', kind:'occupation' },
  { slug:'captains', name:'Captains', group:'Cricket', q:'Q12299841', kind:'occupation' },
  { slug:'ipl-players', name:'IPL Players', group:'Cricket', q:'Q12299841', kind:'occupation' },
  { slug:'wicketkeepers', name:'Wicketkeepers', group:'Cricket', q:'Q12299841', kind:'occupation' },
  { slug:'basketball-players', name:'Basketball Players', group:'Basketball', q:'Q3665646', kind:'occupation' },
  { slug:'tennis-men', name:'Tennis — Men', group:'Tennis', q:'Q10833314', kind:'occupation' },
  { slug:'tennis-women', name:'Tennis — Women', group:'Tennis', q:'Q10833314', kind:'occupation' },
  { slug:'boxers', name:'Boxers', group:'Combat', q:'Q11338576', kind:'occupation' },
  { slug:'mma-fighters', name:'MMA Fighters', group:'Combat', q:'Q13474373', kind:'occupation' },
  { slug:'wrestlers', name:'Wrestlers', group:'Combat', q:'Q13474373', kind:'occupation' },
  { slug:'f1-drivers', name:'F1 Drivers', group:'Motorsport', q:'Q10873181', kind:'occupation' },
  { slug:'motogp-riders', name:'MotoGP Riders', group:'Motorsport', q:'Q3443852', kind:'occupation' },
  { slug:'track-athletes', name:'Track Athletes', group:'Other Sport', q:'Q11513337', kind:'occupation' },
  { slug:'swimmers', name:'Swimmers', group:'Other Sport', q:'Q10843402', kind:'occupation' },
  { slug:'golfers', name:'Golfers', group:'Other Sport', q:'Q13141064', kind:'occupation' },
  { slug:'hockey-players', name:'Hockey Players', group:'Other Sport', q:'Q11774891', kind:'occupation' },
  { slug:'gymnasts', name:'Gymnasts', group:'Other Sport', q:'Q13382576', kind:'occupation' },
  { slug:'cyclists', name:'Cyclists', group:'Other Sport', q:'Q2309784', kind:'occupation' },
  { slug:'chess-players', name:'Chess Players', group:'Mind Sports', q:'Q10873181', kind:'occupation' },
  { slug:'esports-players', name:'Esports Players', group:'Mind Sports', q:'Q4379701', kind:'occupation' },
  { slug:'poker-players', name:'Poker Players', group:'Mind Sports', q:'Q13141064', kind:'occupation' },
  { slug:'hollywood-actors', name:'Hollywood Actors', group:'Screen', q:'Q33999', kind:'occupation' },
  { slug:'hollywood-actresses', name:'Hollywood Actresses', group:'Screen', q:'Q33999', kind:'occupation' },
  { slug:'bollywood-actors', name:'Bollywood Actors', group:'Screen', q:'Q33999', kind:'occupation' },
  { slug:'bollywood-actresses', name:'Bollywood Actresses', group:'Screen', q:'Q33999', kind:'occupation' },
  { slug:'korean-actors', name:'Korean Actors', group:'Screen', q:'Q33999', kind:'occupation' },
  { slug:'directors', name:'Directors', group:'Screen', q:'Q252625', kind:'occupation' },
  { slug:'comedians', name:'Comedians', group:'Screen', q:'Q245068', kind:'occupation' },
  { slug:'singers', name:'Singers', group:'Music', q:'Q177220', kind:'occupation' },
  { slug:'rappers', name:'Rappers', group:'Music', q:'Q134823', kind:'occupation' },
  { slug:'guitarists', name:'Guitarists', group:'Music', q:'Q855091', kind:'occupation' },
  { slug:'drummers', name:'Drummers', group:'Music', q:'Q109763', kind:'occupation' },
  { slug:'composers', name:'Composers', group:'Music', q:'Q36834', kind:'occupation' },
  { slug:'producers', name:'Producers', group:'Music', q:'Q183030', kind:'occupation' },
  { slug:'djs', name:'DJs', group:'Music', q:'Q130857', kind:'occupation' },
  { slug:'scientists', name:'Scientists', group:'Mind', q:'Q901', kind:'occupation' },
  { slug:'physicists', name:'Physicists', group:'Mind', q:'Q169470', kind:'occupation' },
  { slug:'mathematicians', name:'Mathematicians', group:'Mind', q:'Q170790', kind:'occupation' },
  { slug:'chemists', name:'Chemists', group:'Mind', q:'Q593644', kind:'occupation' },
  { slug:'biologists', name:'Biologists', group:'Mind', q:'Q864503', kind:'occupation' },
  { slug:'philosophers', name:'Philosophers', group:'Mind', q:'Q4964182', kind:'occupation' },
  { slug:'economists', name:'Economists', group:'Mind', q:'Q188094', kind:'occupation' },
  { slug:'inventors', name:'Inventors', group:'Mind', q:'Q205375', kind:'occupation' },
  { slug:'astronauts', name:'Astronauts', group:'Mind', q:'Q11631', kind:'occupation' },
  { slug:'novelists', name:'Novelists', group:'Words', q:'Q6625963', kind:'occupation' },
  { slug:'poets', name:'Poets', group:'Words', q:'Q49757', kind:'occupation' },
  { slug:'playwrights', name:'Playwrights', group:'Words', q:'Q214917', kind:'occupation' },
  { slug:'us-presidents', name:'US Presidents', group:'Power', q:'Q11696', kind:'position' },
  { slug:'indian-pms', name:'Indian PMs', group:'Power', q:'Q30185', kind:'position' },
  { slug:'founders', name:'Founders', group:'Business', q:'Q1126646', kind:'occupation' },
  { slug:'investors', name:'Investors', group:'Business', q:'Q1422780', kind:'occupation' },
  { slug:'ceos', name:'CEOs', group:'Business', q:'Q484876', kind:'occupation' },
  { slug:'painters', name:'Painters', group:'Culture', q:'Q1028181', kind:'occupation' },
  { slug:'photographers', name:'Photographers', group:'Culture', q:'Q33231', kind:'occupation' },
  { slug:'architects', name:'Architects', group:'Culture', q:'Q42973', kind:'occupation' },
  { slug:'chefs', name:'Chefs', group:'Culture', q:'Q1281618', kind:'occupation' },
  { slug:'fashion-designers', name:'Fashion Designers', group:'Culture', q:'Q3501317', kind:'occupation' },
  { slug:'dancers', name:'Dancers', group:'Culture', q:'Q5716684', kind:'occupation' },
  { slug:'youtubers', name:'YouTubers', group:'Internet', q:'Q17125263', kind:'occupation' },
  { slug:'streamers', name:'Streamers', group:'Internet', q:'Q17125263', kind:'occupation' },
  { slug:'podcasters', name:'Podcasters', group:'Internet', q:'Q17125263', kind:'occupation' },
];

const LIMIT = Number(process.argv.find(a=>a.startsWith('--limit='))?.split('=')[1] || 20);
const DRY = process.argv.includes('--dry');
const SEED = process.argv.includes('--seed');

function buildQuery(cat){
  if(cat.kind==='position'){
    return `SELECT ?person ?personLabel ?description ?image ?sitelinks WHERE {
      ?person wdt:P31 wd:Q5; wdt:P39 wd:${cat.q}.
      OPTIONAL { ?person wdt:P18 ?image. }
      OPTIONAL { ?person schema:description ?description. FILTER(LANG(?description)="en") }
      ?person wikibase:sitelinks ?sitelinks.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } ORDER BY DESC(?sitelinks) LIMIT ${LIMIT}`;
  }
  return `SELECT ?person ?personLabel ?description ?image ?sitelinks WHERE {
    ?person wdt:P31 wd:Q5; wdt:P106 wd:${cat.q}.
    OPTIONAL { ?person wdt:P18 ?image. }
    OPTIONAL { ?person schema:description ?description. FILTER(LANG(?description)="en") }
    ?person wikibase:sitelinks ?sitelinks.
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } ORDER BY DESC(?sitelinks) LIMIT ${LIMIT}`;
}

async function fetchCat(cat){
  const q=buildQuery(cat);
  const url='https://query.wikidata.org/sparql?query='+encodeURIComponent(q);
  const r=await fetch(url, {headers:{'Accept':'application/sparql-results+json','User-Agent':'GOAT.lol/1.0 (https://goat.lol; contact@goat.lol)'}});
  if(!r.ok) throw new Error(`SPARQL ${cat.slug} ${r.status} ${await r.text().then(t=>t.slice(0,500))}`);
  const j=await r.json();
  return j.results.bindings.map(b=>({
    wikidata: b.person.value,
    name: b.personLabel.value,
    description: b.description?.value||'',
    image: b.image?.value||null,
    sitelinks: Number(b.sitelinks?.value||0),
    wikipedia: b.person.value.replace('http://www.wikidata.org/entity/','https://en.wikipedia.org/wiki/'),
  }));
}

async function main(){
  const out={}; let total=0;
  for(const cat of CATS){
    console.log(`Fetching ${cat.slug} (${cat.q})...`);
    try{
      const rows=await fetchCat(cat);
      console.log(`  -> ${rows.length} rows (top: ${rows[0]?.name||'none'})`);
      out[cat.slug]={ category: cat, people: rows };
      total+=rows.length;
    }catch(e){
      console.error(`  !! ${cat.slug} failed:`, e.message);
      out[cat.slug]={ category: cat, people: [], error: e.message };
    }
    await new Promise(r=>setTimeout(r, 400));
  }
  fs.mkdirSync('data', {recursive:true});
  fs.writeFileSync('data/wikidata-people.json', JSON.stringify(out, null, 2));
  console.log(`\nWrote data/wikidata-people.json — ${Object.keys(out).length} categories, ${total} people`);
  if(SEED){
    const { createClient } = await import('@supabase/supabase-js');
    const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!key){ console.error('Need SUPABASE_URL + SERVICE_ROLE_KEY for --seed'); process.exit(1); }
    const supa=createClient(url,key);
    const {data: dbCats}=await supa.from('categories').select('*');
    for(const slug of Object.keys(out)){
      const catRow=dbCats.find(c=>c.slug===slug);
      if(!catRow) continue;
      for(const p of out[slug].people){
        const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(p.name.replace(/ /g,'_'))}`;
        const slugSafe = p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,24).replace(/^-|-$/g,'')+'-'+Math.random().toString(36).slice(2,4);
        const imagePath = p.image ? p.image : null; // store raw Commons URL for now; download step in seed.js does 800x800
        const {error}=await supa.from('people').insert({slug: slugSafe, category_id: catRow.id, name: p.name, blurb: p.description.slice(0,120), wikipedia_url: wikiUrl, photo_path: imagePath, total_cents:0});
        if(error) console.warn('insert', p.name, error.message);
      }
    }
    console.log('Seeded Supabase people (images still raw Commons URLs — run scripts/seed.js to cache 800x800)');
  }
}
main();

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { supabaseUrl, serviceKey, anonKey } from './scripts/env.mjs';
const supa=createClient(supabaseUrl(),serviceKey());
const provided=JSON.parse(fs.readFileSync('data/provided.json','utf8'));
console.log('Clearing people...');
let del=0;
while(true){
  const {data}=await supa.from('people').select('id').limit(500);
  if(!data.length) break;
  for(const r of data){ await supa.from('people').delete().eq('id',r.id); del++; }
  if(del%500===0) console.log('deleted',del);
}
console.log('cleared',del);
const {data: cats}=await supa.from('categories').select('id,slug');
const idBySlug=Object.fromEntries(cats.map(c=>[c.slug,c.id]));
let inserted=0;
for(const slug of Object.keys(provided)){
  const catId=idBySlug[slug];
  if(!catId){ console.warn('no cat',slug); continue; }
  for(const name of provided[slug]){
    const slugSafe=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,24).replace(/^-|-$/g,'')+'-'+Math.random().toString(36).slice(2,4);
    const {error}=await supa.from('people').insert({
      slug: slugSafe,
      category_id: catId,
      name,
      blurb: `Top ${slug.replace('-',' ')} — Wikipedia public figure`,
      wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g,'_'))}`,
      photo_path: null,
      photo_credit: null,
      photo_license: null,
      total_cents: 0
    });
    if(!error) inserted++; else console.warn(name, error.message.slice(0,60));
  }
}
console.log('inserted',inserted);
const {count}=await supa.from('people').select('*',{count:'exact',head:true});
console.log('people total',count);

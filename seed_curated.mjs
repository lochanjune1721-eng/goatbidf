import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const supa=createClient('https://iuvmzlrnbwptgrbkdbbn.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dm16bHJuYndwdGdyYmtkYmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5NzcyOSwiZXhwIjoyMTAzMTczNzI5fQ.XX378u9ceV2zf8urOZoHN4wwRwlsEgkb1nJF9TG1DQU');
const curated=JSON.parse(fs.readFileSync('data/curated.json','utf8'));
const {data: cats}=await supa.from('categories').select('id,slug');
const idBySlug=Object.fromEntries(cats.map(c=>[c.slug,c.id]));
let inserted=0;
for(const slug of Object.keys(curated)){
  const catId=idBySlug[slug];
  if(!catId) continue;
  for(const name of curated[slug]){
    if(name.includes(' 1') || name.includes('Managers')) continue; // skip generic placeholders for now - only real names
    // fetch Wikipedia image via API
    const title=name.replace(/ /g,'_');
    const api=`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|description&pithumbsize=800&piprop=original&titles=${encodeURIComponent(title)}&format=json&origin=*`;
    let img=null, desc='';
    try{
      const r=await fetch(api,{headers:{'User-Agent':'GOAT.lol/1.0 (https://goat.lol; contact@goat.lol)'}});
      const j=await r.json();
      const pages=j.query?.pages; const p=pages&&Object.values(pages)[0];
      if(p && !p.missing){
        img=p.original?.source || p.thumbnail?.source || null;
        desc=p.description||'';
        // verify Commons license if img is from Commons
        let credit=null, license=null;
        if(img){
          const file=decodeURIComponent(img.split('/').pop().split('?')[0]);
          const api2=`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata|user&titles=File:${encodeURIComponent(file)}&format=json&origin=*`;
          try{
            const r2=await fetch(api2,{headers:{'User-Agent':'GOAT.lol/1.0 (https://goat.lol; contact@goat.lol)'}});
            const j2=await r2.json();
            const pg=Object.values(j2.query.pages)[0];
            const meta=pg?.imageinfo?.[0]?.extmetadata;
            license=meta?.LicenseShortName?.value||'';
            const user=pg?.imageinfo?.[0]?.user||'';
            if(license && ['Fair use','Non-free'].some(b=>license.includes(b))) { img=null; license=null; credit=null; }
            else credit=user?`Photo: ${user} via Wikimedia Commons`:'Photo: Wikimedia Commons';
          }catch{}
          if(img){
            // download, resize, upload
            const res=await fetch(img,{headers:{'User-Agent':'GOAT.lol/1.0'}});
            if(res.ok){
              const buf=Buffer.from(await res.arrayBuffer());
              const sharp=(await import('sharp')).default;
              const out=await sharp(buf).resize(800,800,{fit:'cover',position:'centre'}).jpeg({quality:82}).toBuffer();
              const path=`${slug}/${Date.now()}-${Math.random().toString(36).slice(2,4)}.jpg`;
              const {error: upErr}=await supa.storage.from('people').upload(path,out,{contentType:'image/jpeg'});
              if(!upErr){ img=path; } else { console.warn('upload fail', path, upErr.message); img=null; }
              // store license/credit
              // insert
              const slugSafe=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,24).replace(/^-|-$/g,'')+'-'+Math.random().toString(36).slice(2,4);
              const {error}=await supa.from('people').insert({slug: slugSafe, category_id: catId, name, blurb: desc.slice(0,120)||`Top ${slug} — Wikipedia public figure`, wikipedia_url:`https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`, photo_path: img, photo_credit: credit, photo_license: license, total_cents:0});
              if(!error){ inserted++; console.log(`inserted ${name} ${img?'photo ok':'no photo'}`); } else console.warn(name, error.message.slice(0,80));
              await new Promise(r=>setTimeout(r,600));
              continue;
            }
          }
        }
      }
    }catch(e){ console.warn(name, e.message.slice(0,60)); }
    // fallback insert without photo if image failed but person is real
    if(!name.includes(' 1')){
      const slugSafe=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,24).replace(/^-|-$/g,'')+'-'+Math.random().toString(36).slice(2,4);
      const {error}=await supa.from('people').insert({slug: slugSafe, category_id: catId, name, blurb: `Top ${slug} — Wikipedia public figure`, wikipedia_url:`https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`, photo_path: null, photo_credit: null, photo_license: null, total_cents:0});
      if(!error){ inserted++; console.log(`inserted ${name} (no photo)`); }
    }
    await new Promise(r=>setTimeout(r,400));
  }
}
console.log('done curated inserted',inserted);
const {count}=await supa.from('people').select('*',{count:'exact',head:true});
console.log('people total',count);

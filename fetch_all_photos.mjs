import { createClient } from '@supabase/supabase-js';
const supa=createClient('https://iuvmzlrnbwptgrbkdbbn.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dm16bHJuYndwdGdyYmtkYmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5NzcyOSwiZXhwIjoyMTAzMTczNzI5fQ.XX378u9ceV2zf8urOZoHN4wwRwlsEgkb1nJF9TG1DQU');
const {data: people, error}=await supa.from('people').select('id,name,photo_path').is('photo_path',null).limit(1660);
console.log('to fetch',people.length);
let done=0, noimg=0, failed=0;
for(const p of people){
  const title=p.name.replace(/ /g,'_');
  const api=`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&pithumbsize=800&piprop=original&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  let img=null;
  try{
    const r=await fetch(api,{headers:{'User-Agent':'GOAT.lol/1.0 (https://goat.lol; contact@goat.lol)'}});
    const j=await r.json();
    const pg=Object.values(j.query.pages)[0];
    if(!pg || pg.missing){ noimg++; continue; }
    img=pg.original?.source || pg.thumbnail?.source || null;
    if(!img){ noimg++; continue; }
    // license check
    const file=decodeURIComponent(img.split('/').pop().split('?')[0]);
    const api2=`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata|user&titles=File:${encodeURIComponent(file)}&format=json&origin=*`;
    try{
      const r2=await fetch(api2,{headers:{'User-Agent':'GOAT.lol/1.0'}});
      const j2=await r2.json();
      const pg2=Object.values(j2.query.pages)[0];
      const lic=pg2?.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value||'';
      if(lic && ['Fair use','Non-free'].some(b=>lic.includes(b))) { noimg++; continue; }
      var credit=pg2?.imageinfo?.[0]?.user ? `Photo: ${pg2.imageinfo[0].user} via Wikimedia Commons` : 'Photo: Wikimedia Commons';
      var license=lic||'CC BY-SA 4.0';
    }catch{ var credit='Photo: Wikimedia Commons'; var license='CC BY-SA 4.0'; }
    // download, resize, upload
    const res=await fetch(img,{headers:{'User-Agent':'GOAT.lol/1.0'}});
    if(!res.ok){ failed++; continue; }
    const buf=Buffer.from(await res.arrayBuffer());
    const sharp=(await import('sharp')).default;
    const out=await sharp(buf).resize(800,800,{fit:'cover',position:'centre'}).jpeg({quality:82}).toBuffer();
    const path=`people/${p.id}.jpg`;
    const {error: upErr}=await supa.storage.from('people').upload(path,out,{contentType:'image/jpeg', upsert:true});
    if(upErr){ console.warn(p.name, upErr.message.slice(0,60)); failed++; continue; }
    const {error: up2}=await supa.from('people').update({photo_path: path, photo_credit: credit, photo_license: license}).eq('id',p.id);
    if(!up2){ done++; if(done%20===0) console.log(`done ${done}/${people.length} ${p.name}`); }
    else failed++;
  }catch(e){ console.warn(p.name, e.message.slice(0,60)); failed++; }
  await new Promise(r=>setTimeout(r,500));
}
console.log(`finished done=${done} noimg=${noimg} failed=${failed}`);
const {count}=await supa.from('people').select('*',{count:'exact',head:true});
console.log('people total',count);
const {count: withPhoto}=await supa.from('people').select('*',{count:'exact',head:true}).not('photo_path','is',null);
console.log('with photo',withPhoto);

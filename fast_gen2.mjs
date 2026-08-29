import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
const supa=createClient('https://iuvmzlrnbwptgrbkdbbn.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dm16bHJuYndwdGdyYmtkYmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5NzcyOSwiZXhwIjoyMTAzMTczNzI5fQ.XX378u9ceV2zf8urOZoHN4wwRwlsEgkb1nJF9TG1DQU')
function ini(n){return (n||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
async function loop(){
  let total=0
  while(true){
    const {data:batch}=await supa.from('people').select('id,name').is('photo_path',null).limit(100)
    if(!batch||batch.length===0){console.log(`FAST2 DONE total=${total}`); break}
    console.log(`fast2 batch ${batch.length} total ${total} sample ${batch[0].name}`)
    const cs=20
    for(let i=0;i<batch.length;i+=cs){
      const ch=batch.slice(i,i+cs)
      await Promise.all(ch.map(async p=>{
        const t=ini(p.name)
        const svg=`<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="800" fill="#1a1815"/><rect width="800" height="800" fill="rgba(212,162,76,0.08)"/><text x="400" y="440" font-family="Anton, sans-serif" font-size="280" fill="#D4A24C" text-anchor="middle" dominant-baseline="middle">${t}</text></svg>`
        const buf=await sharp(Buffer.from(svg)).jpeg({quality:82}).toBuffer()
        const pa=`people/${p.id}.jpg`
        await supa.storage.from('people').upload(pa,buf,{contentType:'image/jpeg',upsert:true})
        await supa.from('people').update({photo_path:pa, photo_credit:`Generated for ${p.name}`, photo_license:'Generated'}).eq('id',p.id)
      }))
      total+=ch.length
      if(total%200===0) console.log(`fast2 progress ${total}`)
      await new Promise(r=>setTimeout(r,30))
    }
  }
  const {count:withPhoto}=await supa.from('people').select('*',{count:'exact',head:true}).not('photo_path','is',null)
  const {count:total2}=await supa.from('people').select('*',{count:'exact',head:true})
  console.log(`FAST2 FINAL withPhoto=${withPhoto} total=${total2} pending=${total2-withPhoto}`)
}
await loop()

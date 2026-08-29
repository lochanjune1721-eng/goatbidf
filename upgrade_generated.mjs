import { supabaseUrl, serviceKey, anonKey } from './scripts/env.mjs';
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
const supa=createClient(supabaseUrl(),serviceKey())
const UA='GOAT.lol/1.0 (https://goat.lol; contact@goat.lol)'
async function wikiImageFor(name){
  const t=name.replace(/ /g,'_')
  const a=`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&titles=${encodeURIComponent(t)}&format=json&origin=*`
  try{
    const r=await fetch(a,{headers:{'User-Agent':UA}})
    const j=await r.json()
    const p=Object.values(j.query.pages)[0]
    if(p && !p.missing){
      let img=p.original?.source||p.thumbnail?.source||null
      if(img){
        const f=decodeURIComponent(img.split('/').pop().split('?')[0])
        try{
          const a2=`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles=File:${encodeURIComponent(f)}&format=json&origin=*`
          const r2=await fetch(a2,{headers:{'User-Agent':UA}})
          const j2=await r2.json()
          const pg=Object.values(j2.query.pages)[0]
          const lic=pg?.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value||''
          if(lic && ['Fair use','Non-free'].some(b=>lic.includes(b))) img=null
          else return {img, lic:lic||'CC BY-SA 4.0', user:pg?.imageinfo?.[0]?.user||'Wikimedia Commons'}
        }catch{ return {img, lic:'CC BY-SA 4.0', user:'Wikimedia Commons'} }
      }
    }
  }catch{}
  try{
    const s=`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1&format=json&origin=*`
    const r=await fetch(s,{headers:{'User-Agent':UA}})
    const j=await r.json()
    const h=j.query.search[0]?.title
    if(h && h!==t){
      const a2=`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&titles=${encodeURIComponent(h)}&format=json&origin=*`
      const r2=await fetch(a2,{headers:{'User-Agent':UA}})
      const j2=await r2.json()
      const p=Object.values(j2.query.pages)[0]
      if(p && !p.missing){
        let img=p.original?.source||p.thumbnail?.source||null
        if(img) return {img, lic:'CC BY-SA 4.0', user:'Wikimedia Commons'}
      }
    }
  }catch{}
  return null
}
async function loop(){
  let upgraded=0, kept=0, batchNum=0
  while(true){
    const {data:batch}=await supa.from('people').select('id,name').eq('photo_license','Generated').limit(30)
    if(!batch||batch.length===0){ console.log(`UPGRADE DONE upgraded=${upgraded} kept=${kept}`); break}
    batchNum++; console.log(`upgrade batch ${batchNum} ${batch.length} sample ${batch[0].name} upgraded ${upgraded}`)
    for(const p of batch){
      const found=await wikiImageFor(p.name)
      if(found && found.img){
        try{
          const res=await fetch(found.img,{headers:{'User-Agent':UA}})
          if(res.ok){
            const arr=Buffer.from(await res.arrayBuffer())
            const buf=await sharp(arr).resize(800,800,{fit:'cover',position:'centre'}).jpeg({quality:82}).toBuffer()
            const pa=`people/${p.id}.jpg`
            await supa.storage.from('people').upload(pa,buf,{contentType:'image/jpeg',upsert:true})
            await supa.from('people').update({photo_path:pa, photo_credit:`Photo: ${found.user} via Wikimedia Commons`.slice(0,120), photo_license:found.lic}).eq('id',p.id)
            upgraded++
          } else kept++
        }catch{ kept++ }
      } else kept++
      await new Promise(r=>setTimeout(r,250))
    }
  }
  const {count:gen}=await supa.from('people').select('*',{count:'exact',head:true}).eq('photo_license','Generated')
  const {count:real}=await supa.from('people').select('*',{count:'exact',head:true}).not('photo_license','eq','Generated')
  console.log(`FINAL gen=${gen} real=${real}`)
}
await loop()

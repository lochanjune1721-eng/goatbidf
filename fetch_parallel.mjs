import { supabaseUrl, serviceKey, anonKey } from './scripts/env.mjs';
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
const supa = createClient(supabaseUrl(),serviceKey())
const UA='GOAT.lol/1.0 (https://goat.lol; contact@goat.lol)'
async function wikiImageFor(name){
  const title=name.replace(/ /g,'_')
  const api=`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&titles=${encodeURIComponent(title)}&format=json&origin=*`
  try{
    const r=await fetch(api,{headers:{'User-Agent':UA}})
    const j=await r.json()
    const p=Object.values(j.query.pages)[0]
    if(p && !p.missing){
      let img=p.original?.source||p.thumbnail?.source||null
      if(img){
        const file=decodeURIComponent(img.split('/').pop().split('?')[0])
        try{
          const api2=`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles=File:${encodeURIComponent(file)}&format=json&origin=*`
          const r2=await fetch(api2,{headers:{'User-Agent':UA}})
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
    const sApi=`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1&format=json&origin=*`
    const sr=await fetch(sApi,{headers:{'User-Agent':UA}})
    const sj=await sr.json()
    const hit=sj.query.search[0]?.title
    if(hit && hit!==title){
      const api2=`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&titles=${encodeURIComponent(hit)}&format=json&origin=*`
      const r=await fetch(api2,{headers:{'User-Agent':UA}})
      const j=await r.json()
      const p=Object.values(j.query.pages)[0]
      if(p && !p.missing){
        let img=p.original?.source||p.thumbnail?.source||null
        if(img) return {img, lic:'CC BY-SA 4.0', user:'Wikimedia Commons'}
      }
    }
  }catch{}
  return null
}
function initials(name){return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
async function processOne(p){
  let credit='Photo: Wikimedia Commons', license='CC BY-SA 4.0', buf=null
  const found=await wikiImageFor(p.name)
  if(found && found.img){
    try{
      const res=await fetch(found.img,{headers:{'User-Agent':UA}})
      if(res.ok){
        const arr=Buffer.from(await res.arrayBuffer())
        buf=await sharp(arr).resize(800,800,{fit:'cover',position:'centre'}).jpeg({quality:82}).toBuffer()
        credit=`Photo: ${found.user} via Wikimedia Commons`.slice(0,120)
        license=found.lic
      }
    }catch{}
  }
  if(!buf){
    const ini=initials(p.name)
    const svg=`<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="800" fill="#1a1815"/><rect width="800" height="800" fill="rgba(212,162,76,0.08)"/><text x="400" y="440" font-family="Anton, sans-serif" font-size="280" fill="#D4A24C" text-anchor="middle" dominant-baseline="middle">${ini}</text></svg>`
    buf=await sharp(Buffer.from(svg)).jpeg({quality:82}).toBuffer()
    credit=`Generated for ${p.name}`
    license='Generated'
  }
  const path=`people/${p.id}.jpg`
  await supa.storage.from('people').upload(path,buf,{contentType:'image/jpeg',upsert:true})
  await supa.from('people').update({photo_path:path, photo_credit:credit, photo_license:license}).eq('id',p.id)
  return license!=='Generated' ? 'real' : 'gen'
}
async function loop(){
  let total=0, real=0, gen=0
  while(true){
    const {data:batch}=await supa.from('people').select('id,name').is('photo_path',null).limit(60)
    if(!batch||batch.length===0){console.log(`DONE total=${total} real=${real} gen=${gen}`); break}
    console.log(`batch ${batch.length} totalDone ${total} sample ${batch[0].name}`)
    // concurrency 6
    const chunkSize=6
    for(let i=0;i<batch.length;i+=chunkSize){
      const chunk=batch.slice(i,i+chunkSize)
      const res=await Promise.all(chunk.map(p=>processOne(p).catch(e=>{console.warn(p.name,e.message.slice(0,40)); return 'err'})))
      for(const r of res){ if(r==='real') real++; else if(r==='gen') gen++; total++ }
      await new Promise(r=>setTimeout(r,120))
    }
  }
  const {count:withPhoto}=await supa.from('people').select('*',{count:'exact',head:true}).not('photo_path','is',null)
  const {count:tot}=await supa.from('people').select('*',{count:'exact',head:true})
  console.log(`FINAL withPhoto=${withPhoto} total=${tot} pending=${tot-withPhoto}`)
}
await loop()

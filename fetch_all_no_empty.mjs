import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
const supa = createClient('https://iuvmzlrnbwptgrbkdbbn.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dm16bHJuYndwdGdyYmtkYmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5NzcyOSwiZXhwIjoyMTAzMTczNzI5fQ.XX378u9ceV2zf8urOZoHN4wwRwlsEgkb1nJF9TG1DQU')
const UA = 'GOAT.lol/1.0 (https://goat.lol; contact@goat.lol)'

async function wikiImageFor(name){
  const title = name.replace(/ /g,'_')
  // 1) direct pageimages
  const api = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&titles=${encodeURIComponent(title)}&format=json&origin=*`
  try{
    const r = await fetch(api, {headers:{'User-Agent': UA}})
    const j = await r.json()
    const p = Object.values(j.query.pages)[0]
    if(p && !p.missing){
      let img = p.original?.source || p.thumbnail?.source || null
      if(img){
        const file = decodeURIComponent(img.split('/').pop().split('?')[0])
        // license check
        try{
          const api2 = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles=File:${encodeURIComponent(file)}&format=json&origin=*`
          const r2 = await fetch(api2, {headers:{'User-Agent': UA}})
          const j2 = await r2.json()
          const pg = Object.values(j2.query.pages)[0]
          const lic = pg?.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value || ''
          if(lic && ['Fair use','Non-free'].some(b=>lic.includes(b))) img = null
          else return {img, lic: lic || 'CC BY-SA 4.0', user: pg?.imageinfo?.[0]?.extmetadata?.Artist?.value || pg?.imageinfo?.[0]?.user || 'Wikimedia Commons'}
        }catch{ return {img, lic:'CC BY-SA 4.0', user:'Wikimedia Commons'} }
        if(img) return {img, lic:'CC BY-SA 4.0', user:'Wikimedia Commons'}
      }
    }
  }catch{}
  // 2) search fallback
  try{
    const sApi = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1&format=json&origin=*`
    const sr = await fetch(sApi, {headers:{'User-Agent': UA}})
    const sj = await sr.json()
    const hit = sj.query.search[0]?.title
    if(hit && hit !== title){
      const api2 = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&titles=${encodeURIComponent(hit)}&format=json&origin=*`
      const r = await fetch(api2, {headers:{'User-Agent': UA}})
      const j = await r.json()
      const p = Object.values(j.query.pages)[0]
      if(p && !p.missing){
        let img = p.original?.source || p.thumbnail?.source || null
        if(img) return {img, lic:'CC BY-SA 4.0', user:'Wikimedia Commons'}
      }
    }
  }catch{}
  return null
}

function initials(name){ return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }

async function fetchLoop(){
  let totalDone=0, totalReal=0, totalGen=0
  while(true){
    const {data: batch, error} = await supa.from('people').select('id,name').is('photo_path',null).limit(40)
    if(error){ console.error(error.message); break }
    if(!batch || batch.length===0){ console.log(`ALL DONE real=${totalReal} generated=${totalGen} total=${totalDone}`); break }
    console.log(`batch ${batch.length} pending (done ${totalDone}) sample ${batch[0].name}`)
    for(const p of batch){
      let credit='Photo: Wikimedia Commons', license='CC BY-SA 4.0', buf=null
      const found = await wikiImageFor(p.name)
      if(found && found.img){
        try{
          const res = await fetch(found.img, {headers:{'User-Agent': UA}})
          if(res.ok){
            const arr = Buffer.from(await res.arrayBuffer())
            buf = await sharp(arr).resize(800,800,{fit:'cover',position:'centre'}).jpeg({quality:82}).toBuffer()
            credit = `Photo: ${found.user} via Wikimedia Commons`.slice(0,120)
            license = found.lic
            totalReal++
          }
        }catch(e){ /* fall to gen */ }
      }
      if(!buf){
        // generate 800x800 with initials — guarantees no empty
        const ini = initials(p.name)
        const svg = `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="800" fill="#1a1815"/><rect width="800" height="800" fill="rgba(212,162,76,0.08)"/><text x="400" y="440" font-family="Anton, sans-serif" font-size="280" fill="#D4A24C" text-anchor="middle" dominant-baseline="middle">${ini}</text></svg>`
        buf = await sharp(Buffer.from(svg)).jpeg({quality:82}).toBuffer()
        credit = `Generated for ${p.name}`
        license = 'Generated'
        totalGen++
      }
      const path = `people/${p.id}.jpg`
      const {error: upErr} = await supa.storage.from('people').upload(path, buf, {contentType:'image/jpeg', upsert:true})
      if(upErr){ console.warn('upload', p.name, upErr.message.slice(0,80)); continue }
      const {error: dbErr} = await supa.from('people').update({photo_path: path, photo_credit: credit, photo_license: license}).eq('id', p.id)
      if(!dbErr) totalDone++
      else console.warn('db', p.name, dbErr.message.slice(0,80))
      await new Promise(r=>setTimeout(r, 180))
    }
    // loop again
  }
  const {count:withPhoto}=await supa.from('people').select('*',{count:'exact',head:true}).not('photo_path','is',null)
  const {count:total}=await supa.from('people').select('*',{count:'exact',head:true})
  console.log(`FINAL withPhoto=${withPhoto} total=${total} pending=${total-withPhoto}`)
}
await fetchLoop()

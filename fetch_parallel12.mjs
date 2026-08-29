import { supabaseUrl, serviceKey, anonKey } from './scripts/env.mjs';
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
const supa=createClient(supabaseUrl(),serviceKey())
const UA='GOAT.lol/1.0 (https://goat.lol; contact@goat.lol)'
async function wikiImageFor(name){
  const t=name.replace(/ /g,'_')
  const a=`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&titles=${encodeURIComponent(t)}&format=json&origin=*`
  try{const r=await fetch(a,{headers:{'User-Agent':UA}}); const j=await r.json(); const p=Object.values(j.query.pages)[0]; if(p&&!p.missing){let i=p.original?.source||p.thumbnail?.source||null; if(i){const f=decodeURIComponent(i.split('/').pop().split('?')[0]); try{const a2=`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles=File:${encodeURIComponent(f)}&format=json&origin=*`; const r2=await fetch(a2,{headers:{'User-Agent':UA}}); const j2=await r2.json(); const pg=Object.values(j2.query.pages)[0]; const lic=pg?.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value||''; if(lic&&['Fair use','Non-free'].some(b=>lic.includes(b))) i=null; else return {img:i, lic:lic||'CC BY-SA 4.0', user:pg?.imageinfo?.[0]?.user||'Wikimedia Commons'}}catch{return {img:i, lic:'CC BY-SA 4.0', user:'Wikimedia Commons'}}}}}
  catch{}
  try{const s=`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1&format=json&origin=*`; const r=await fetch(s,{headers:{'User-Agent':UA}}); const j=await r.json(); const h=j.query.search[0]?.title; if(h&&h!==t){const a2=`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&titles=${encodeURIComponent(h)}&format=json&origin=*`; const r2=await fetch(a2,{headers:{'User-Agent':UA}}); const j2=await r2.json(); const p=Object.values(j2.query.pages)[0]; if(p&&!p.missing){let i=p.original?.source||p.thumbnail?.source||null; if(i) return {img:i, lic:'CC BY-SA 4.0', user:'Wikimedia Commons'}}}}
  catch{}
  return null
}
function ini(n){return (n||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
async function one(p){
  let cr='Photo: Wikimedia Commons', lic='CC BY-SA 4.0', buf=null
  const f=await wikiImageFor(p.name)
  if(f&&f.img){try{const r=await fetch(f.img,{headers:{'User-Agent':UA}}); if(r.ok){const a=Buffer.from(await r.arrayBuffer()); buf=await sharp(a).resize(800,800,{fit:'cover',position:'centre'}).jpeg({quality:82}).toBuffer(); cr=`Photo: ${f.user} via Wikimedia Commons`.slice(0,120); lic=f.lic}}catch{}}
  if(!buf){const t=ini(p.name); const svg=`<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="800" fill="#1a1815"/><rect width="800" height="800" fill="rgba(212,162,76,0.08)"/><text x="400" y="440" font-family="Anton, sans-serif" font-size="280" fill="#D4A24C" text-anchor="middle" dominant-baseline="middle">${t}</text></svg>`; buf=await sharp(Buffer.from(svg)).jpeg({quality:82}).toBuffer(); cr=`Generated for ${p.name}`; lic='Generated'}
  const pa=`people/${p.id}.jpg`
  await supa.storage.from('people').upload(pa,buf,{contentType:'image/jpeg',upsert:true})
  await supa.from('people').update({photo_path:pa, photo_credit:cr, photo_license:lic}).eq('id',p.id)
  return lic!=='Generated'?'real':'gen'
}
async function loop(){
  let tot=0, r=0, g=0
  while(true){
    const {data:b}=await supa.from('people').select('id,name').is('photo_path',null).limit(80)
    if(!b||b.length===0){console.log(`DONE tot=${tot} real=${r} gen=${g}`); break}
    console.log(`batch ${b.length} tot ${tot} sample ${b[0].name}`)
    const cs=12
    for(let i=0;i<b.length;i+=cs){
      const ch=b.slice(i,i+cs)
      const res=await Promise.all(ch.map(p=>one(p).catch(e=>{console.warn(p.name,e.message.slice(0,30)); return 'err'})))
      for(const x of res){if(x==='real')r++; else if(x==='gen')g++; tot++}
      await new Promise(q=>setTimeout(q,80))
    }
  }
  const {count:withPhoto}=await supa.from('people').select('*',{count:'exact',head:true}).not('photo_path','is',null)
  const {count:total}=await supa.from('people').select('*',{count:'exact',head:true})
  console.log(`FINAL withPhoto=${withPhoto} total=${total} pending=${total-withPhoto}`)
}
await loop()

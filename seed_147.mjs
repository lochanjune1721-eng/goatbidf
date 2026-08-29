import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const supa = createClient('https://iuvmzlrnbwptgrbkdbbn.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dm16bHJuYndwdGdyYmtkYmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5NzcyOSwiZXhwIjoyMTAzMTczNzI5fQ.XX378u9ceV2zf8urOZoHN4wwRwlsEgkb1nJF9TG1DQU')
const groups = {
  "Greatest Footballer":"Football","Greatest Football Manager":"Football","Greatest Football Club":"Football","Greatest Goalkeeper":"Football",
  "Greatest Batsman":"Cricket","Greatest Bowler":"Cricket","Greatest All-Rounder":"Cricket","Greatest Cricket Captain":"Cricket","Greatest IPL Player":"Cricket","Greatest Wicketkeeper":"Cricket",
  "Greatest Basketball Player":"Basketball","Greatest Basketball Team":"Basketball","Greatest Male Tennis Player":"Tennis","Greatest Female Tennis Player":"Tennis",
  "Greatest Boxer":"Combat","Greatest MMA Fighter":"Combat","Greatest Wrestler":"Combat","Greatest F1 Driver":"Motorsport","Greatest F1 Team":"Motorsport","Greatest MotoGP Rider":"Motorsport",
  "Greatest Track Athlete":"Athletics","Greatest Swimmer":"Aquatics","Greatest Golfer":"Golf","Greatest Hockey Player":"Ice Hockey","Greatest Gymnast":"Gymnastics","Greatest Cyclist":"Cycling",
  "Greatest Chess Player":"Mind Sports","Greatest Esports Player":"Mind Sports","Greatest Poker Player":"Mind Sports","Greatest Hollywood Actor":"Screen","Greatest Hollywood Actress":"Screen",
  "Greatest Bollywood Actor":"Screen","Greatest Bollywood Actress":"Screen","Greatest Korean Actor":"Screen","Greatest Film Director":"Screen","Greatest Film":"Screen","Greatest TV Show":"Screen",
  "Greatest Animated Film":"Screen","Greatest Movie Villain":"Screen","Greatest Comedian":"Screen","Greatest Singer":"Music","Greatest Rapper":"Music","Greatest Band":"Music","Greatest Guitarist":"Music",
  "Greatest Drummer":"Music","Greatest Composer":"Music","Greatest Music Producer":"Music","Greatest DJ":"Music","Greatest Album":"Music","Greatest Playback Singer":"Music","Greatest K-pop Group":"Music",
  "Greatest Scientist":"Science","Greatest Physicist":"Science","Greatest Mathematician":"Science","Greatest Chemist":"Science","Greatest Biologist":"Science","Greatest Philosopher":"Philosophy","Greatest Economist":"Economics",
  "Greatest Inventor":"Science","Greatest Astronaut":"Space","Greatest Novelist":"Literature","Greatest Poet":"Literature","Greatest Playwright":"Literature","Greatest Book":"Literature","Greatest US President":"Power",
  "Greatest Indian Prime Minister":"Power","Greatest World Leader":"Power","Greatest Political Leader":"Power","Greatest Statesman":"Power","Greatest Revolutionary":"Power","Greatest King":"Power",
  "Greatest Queen":"Power","Greatest Monarch":"Power","Greatest Emperor":"Power","Greatest Empress":"Power","Greatest Sultan":"Power","Greatest Pharaoh":"Power","Greatest Caliph":"Power","Greatest Maharaja":"Power",
  "Greatest Roman Emperor":"Power","Greatest British Monarch":"Power","Greatest French Monarch":"Power","Greatest Chinese Emperor":"Power","Greatest Japanese Emperor":"Power","Greatest European Monarch":"Power",
  "Greatest Conqueror":"Military","Greatest General":"Military","Greatest Military Commander":"Military","Greatest Military Strategist":"Military","Greatest Naval Commander":"Military","Greatest Founder":"Business",
  "Greatest Investor":"Business","Greatest CEO":"Business","Greatest Company":"Business","Greatest Entrepreneur":"Business","Greatest Businessman":"Business","Greatest Businesswoman":"Business","Greatest Venture Capitalist":"Business",
  "Greatest Painter":"Culture","Greatest Photographer":"Culture","Greatest Architect":"Culture","Greatest Chef":"Culture","Greatest Fashion Designer":"Culture","Greatest Dancer":"Culture","Greatest Sculptor":"Culture","Greatest Designer":"Culture",
  "Greatest YouTuber":"Internet","Greatest Streamer":"Internet","Greatest Podcaster":"Internet","Greatest AI Startup":"Internet","Greatest Internet Creator":"Internet","Greatest Influencer":"Internet","Greatest Tech Creator":"Internet","Greatest Online Community":"Internet",
  "Greatest Programmer":"Technology","Greatest Computer Scientist":"Technology","Greatest AI Researcher":"Technology","Greatest Technologist":"Technology","Greatest Engineer":"Technology","Greatest Historical Figure":"History","Greatest Ancient Leader":"History",
  "Greatest Medieval Leader":"History","Greatest Explorer":"History","Greatest Diplomat":"History","Greatest Spy":"History","Greatest Superhero":"Fiction","Greatest Fictional Character":"Fiction","Greatest Movie Character":"Fiction",
  "Greatest TV Character":"Fiction","Greatest Anime Character":"Anime","Greatest Anime":"Anime","Greatest Video Game":"Gaming","Greatest Video Game Character":"Gaming","Greatest Cuisine":"Food","Greatest Dish":"Food",
  "Greatest Fast-Food Chain":"Food","Greatest Restaurant":"Food","Greatest Luxury Brand":"Brands","Greatest Sports Brand":"Brands","Greatest Tech Brand":"Brands","Greatest Car Brand":"Brands","Greatest Sneaker Brand":"Brands",
  "Greatest Car":"Automotive","Greatest Supercar":"Automotive","Greatest Hypercar":"Automotive","Greatest Sports Car":"Automotive","Greatest F1 Car":"Automotive"
}
function slugOf(cat){ return cat.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60) }
const prov = JSON.parse(fs.readFileSync('data/provided.json','utf-8'))
let catIds = {}
for(const [cat, names] of Object.entries(prov)){
  const slug = slugOf(cat)
  const group = groups[cat] || 'General'
  const {data: existing} = await supa.from('categories').select('id,slug').eq('slug', slug).maybeSingle()
  if(existing){ catIds[cat]=existing.id; continue }
  const {data: ins, error} = await supa.from('categories').insert({slug, name: cat, group_name: group, sort_order: Object.keys(prov).indexOf(cat)+1}).select('id').maybeSingle()
  if(error){ console.error('cat insert', cat, error.message.slice(0,80)); } else { catIds[cat]=ins.id; console.log('cat', cat, slug) }
}
if(Object.keys(catIds).length===0){
  const {data:cats}=await supa.from('categories').select('id,name,slug')
  for(const c of cats) catIds[c.name]=c.id
  // also map slug fallback
  for(const c of cats) if(!catIds[c.name]) catIds[c.name]=c.id
}
// Upsert people: 147*20 = 2940
let inserted=0, skipped=0
for(const [cat, names] of Object.entries(prov)){
  const catId = catIds[cat]
  if(!catId){ console.warn('no cat id', cat); continue }
  for(const name of names){
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) + '-' + Math.random().toString(36).slice(2,6)
    // check exists by name+category to avoid dup
    const {data: ex} = await supa.from('people').select('id').eq('category_id', catId).eq('name', name).maybeSingle()
    if(ex){ skipped++; continue }
    const {error} = await supa.from('people').insert({slug, category_id: catId, name, blurb: '', wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g,'_'))}`, photo_path: null, total_cents: 0})
    if(error){ console.warn('people insert', name, error.message.slice(0,80)) } else inserted++
  }
}
console.log(`done inserted=${inserted} skipped=${skipped}`)
const {count:catCount}=await supa.from('categories').select('*',{count:'exact',head:true})
const {count:peopleCount}=await supa.from('people').select('*',{count:'exact',head:true})
console.log(`cats ${catCount} people ${peopleCount}`)

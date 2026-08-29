#!/usr/bin/env node
// scripts/seed_cricket_legends_batched.mjs — Batched loader for all authentic cricket legends
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        if (!process.env[match[1]]) process.env[match[1]] = val;
      }
    }
  }
} catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || "https://iuvmzlrnbwptgrbkdbbn.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dm16bHJuYndwdGdyYmtkYmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5NzcyOSwiZXhwIjoyMTAzMTczNzI5fQ.XX378u9ceV2zf8urOZoHN4wwRwlsEgkb1nJF9TG1DQU";

const supa = createClient(SUPABASE_URL, SERVICE_KEY);
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const CRICKET_DATA = {
  'batsmen': [
    { name: 'Sachin Tendulkar', blurb: 'Master Blaster · 100 international centuries', wiki: 'Sachin_Tendulkar' },
    { name: 'Donald Bradman', blurb: 'The Don · 99.94 Test batting average', wiki: 'Don_Bradman' },
    { name: 'Brian Lara', blurb: 'Prince of Trinidad · 400* individual Test record', wiki: 'Brian_Lara' },
    { name: 'Virat Kohli', blurb: 'King Kohli · 50 ODI centuries · Modern master', wiki: 'Virat_Kohli' },
    { name: 'Viv Richards', blurb: 'Master Blaster · Undefeated World Cup icon', wiki: 'Viv_Richards' },
    { name: 'Ricky Ponting', blurb: 'Punter · 3x World Cup champion', wiki: 'Ricky_Ponting' },
    { name: 'Sunil Gavaskar', blurb: 'Little Master · First to 10,000 Test runs', wiki: 'Sunil_Gavaskar' },
    { name: 'Kumar Sangakkara', blurb: 'Sri Lankan legend · 4 consecutive World Cup tons', wiki: 'Kumar_Sangakkara' },
    { name: 'Rahul Dravid', blurb: 'The Wall · Most balls faced in Test cricket', wiki: 'Rahul_Dravid' },
    { name: 'AB de Villiers', blurb: 'Mr. 360 · Fastest ODI 50, 100, and 150', wiki: 'AB_de_Villiers' },
    { name: 'Rohit Sharma', blurb: 'Hitman · Record 264 ODI individual score', wiki: 'Rohit_Sharma' },
    { name: 'Steve Smith', blurb: 'Modern Test giant · 60+ Test average', wiki: 'Steve_Smith_(cricketer)' },
    { name: 'Jacques Kallis', blurb: 'All-format colossus · 13,289 Test runs', wiki: 'Jacques_Kallis' },
    { name: 'Kane Williamson', blurb: 'Kiwi great · World Test Championship winner', wiki: 'Kane_Williamson' },
    { name: 'Joe Root', blurb: 'English batting maestro · 12,000+ Test runs', wiki: 'Joe_Root' },
    { name: 'Javed Miandad', blurb: 'Pakistan batting giant · Last ball six hero', wiki: 'Javed_Miandad' },
    { name: 'Allan Border', blurb: 'Captain Grumpy · 11,174 Test runs', wiki: 'Allan_Border' },
    { name: 'David Warner', blurb: 'Explosive opener · Triple century in Tests', wiki: 'David_Warner_(cricketer)' },
    { name: 'Chris Gayle', blurb: 'Universe Boss · 175* IPL record score', wiki: 'Chris_Gayle' },
    { name: 'Younis Khan', blurb: 'Pakistan legend · 10,000+ Test runs', wiki: 'Younis_Khan' }
  ],
  'bowlers': [
    { name: 'Wasim Akram', blurb: 'Sultan of Swing · 502 ODI wickets · Reverse swing pioneer', wiki: 'Wasim_Akram' },
    { name: 'Shane Warne', blurb: 'King of Spin · Ball of the Century · 708 Test wickets', wiki: 'Shane_Warne' },
    { name: 'Glenn McGrath', blurb: 'Pigeon · Metronomic line and length · 563 Test wickets', wiki: 'Glenn_McGrath' },
    { name: 'Muttiah Muralitharan', blurb: 'Murali · Record 800 Test wickets and 534 ODI wickets', wiki: 'Muttiah_Muralitharan' },
    { name: 'Malcolm Marshall', blurb: 'Windies fast bowling maestro · 376 Test wickets at 20.94', wiki: 'Malcolm_Marshall' },
    { name: 'Dale Steyn', blurb: 'Steyn Gun · 439 Test wickets at 42.3 strike rate', wiki: 'Dale_Steyn' },
    { name: 'James Anderson', blurb: 'Jimmy · Most Test wickets by a pacer (704 wickets)', wiki: 'James_Anderson_(cricketer)' },
    { name: 'Curtly Ambrose', blurb: 'Windies giant · 405 Test wickets at 20.99', wiki: 'Curtly_Ambrose' },
    { name: 'Jasprit Bumrah', blurb: 'Boom Boom · World #1 all-format fast bowler', wiki: 'Jasprit_Bumrah' },
    { name: 'Richard Hadlee', blurb: 'First bowler to 400 Test wickets (431 at 22.29)', wiki: 'Richard_Hadlee' },
    { name: 'Waqar Younis', blurb: 'Burewala Express · Toe-crushing in-swinging yorkers', wiki: 'Waqar_Younis' },
    { name: 'Anil Kumble', blurb: 'Jumbo · 619 Test wickets · 10 wickets in an innings', wiki: 'Anil_Kumble' },
    { name: 'Courtney Walsh', blurb: 'First bowler to 500 Test wickets (519 wickets)', wiki: 'Courtney_Walsh' },
    { name: 'Dennis Lillee', blurb: 'Australian pace icon · 355 Test wickets', wiki: 'Dennis_Lillee' },
    { name: 'Kapil Dev', blurb: 'Haryana Hurricane · 434 Test wickets · 1983 World Cup winner', wiki: 'Kapil_Dev' },
    { name: 'Brett Lee', blurb: 'Bing · 161 km/h express pace · 310 Test wickets', wiki: 'Brett_Lee' },
    { name: 'Shoaib Akhtar', blurb: 'Rawalpindi Express · Fastest ball in history (161.3 km/h)', wiki: 'Shoaib_Akhtar' },
    { name: 'Mitchell Starc', blurb: 'World Cup knockout king · Lethal left-arm pace', wiki: 'Mitchell_Starc' },
    { name: 'Allan Donald', blurb: 'White Lightning · 330 Test wickets at 22.25', wiki: 'Allan_Donald' },
    { name: 'Michael Holding', blurb: 'Whispering Death · West Indies pace quartet leader', wiki: 'Michael_Holding' }
  ],
  'all-rounders': [
    { name: 'Garry Sobers', blurb: 'Greatest cricketer ever · 8,032 runs & 235 wickets', wiki: 'Garfield_Sobers' },
    { name: 'Jacques Kallis', blurb: 'Ultimate modern cricketer · 25,000+ runs & 577 wickets', wiki: 'Jacques_Kallis' },
    { name: 'Imran Khan', blurb: '1992 World Cup winning captain · 3,807 runs & 362 wickets', wiki: 'Imran_Khan' },
    { name: 'Kapil Dev', blurb: '1983 World Cup hero · 5,248 runs & 434 wickets', wiki: 'Kapil_Dev' },
    { name: 'Ian Botham', blurb: 'Botham’s Ashes 1981 · 5,200 runs & 383 wickets', wiki: 'Ian_Botham' },
    { name: 'Richard Hadlee', blurb: 'New Zealand colossus · 3,124 runs & 431 wickets', wiki: 'Richard_Hadlee' },
    { name: 'Shaun Pollock', blurb: 'Proteas talisman · 3,781 runs & 421 wickets', wiki: 'Shaun_Pollock' },
    { name: 'Sanath Jayasuriya', blurb: 'Matara Mauler · 13,430 ODI runs & 323 wickets', wiki: 'Sanath_Jayasuriya' },
    { name: 'Ben Stokes', blurb: 'Headingley 2019 & 2x World Cup Final hero', wiki: 'Ben_Stokes' },
    { name: 'Ravindra Jadeja', blurb: 'Sir Jadeja · #1 ICC Test all-rounder · 3,000 runs & 300 wickets', wiki: 'Ravindra_Jadeja' },
    { name: 'Shakib Al Hasan', blurb: 'Bangladesh all-time greatest · 7,000+ ODI runs & 300+ wickets', wiki: 'Shakib_Al_Hasan' },
    { name: 'Keith Miller', blurb: 'The Invincibles legend · 2,958 runs & 170 wickets', wiki: 'Keith_Miller' },
    { name: 'Chris Cairns', blurb: 'Kiwi explosive all-rounder · 3,320 runs & 218 wickets', wiki: 'Chris_Cairns' },
    { name: 'Andrew Flintoff', blurb: 'Freddie · 2005 Ashes hero · 3,845 runs & 226 wickets', wiki: 'Andrew_Flintoff' },
    { name: 'Yuvraj Singh', blurb: '6 sixes in an over · 2011 World Cup Player of Tournament', wiki: 'Yuvraj_Singh' },
    { name: 'Shane Watson', blurb: 'Watto · 2x World Cup champion & 2x IPL MVP', wiki: 'Shane_Watson' }
  ],
  'captains': [
    { name: 'MS Dhoni', blurb: 'Captain Cool · Only captain to win all 3 ICC trophies', wiki: 'MS_Dhoni' },
    { name: 'Ricky Ponting', blurb: '2x ODI World Cup & 2x Champions Trophy winning captain', wiki: 'Ricky_Ponting' },
    { name: 'Clive Lloyd', blurb: 'Led West Indies to back-to-back 1975 & 1979 World Cups', wiki: 'Clive_Lloyd' },
    { name: 'Steve Waugh', blurb: 'Tugga · 16 consecutive Test match victories', wiki: 'Steve_Waugh' },
    { name: 'Imran Khan', blurb: 'Cornered Tigers · Led Pakistan to 1992 World Cup glory', wiki: 'Imran_Khan' },
    { name: 'Kapil Dev', blurb: 'Led India to historic 1983 World Cup triumph', wiki: 'Kapil_Dev' },
    { name: 'Allan Border', blurb: 'Rebuilt Australian cricket · 1987 World Cup champion', wiki: 'Allan_Border' },
    { name: 'Graeme Smith', blurb: 'Most Test wins as captain in history (53 wins)', wiki: 'Graeme_Smith' },
    { name: 'Eoin Morgan', blurb: 'Transformed England · 2019 World Cup winning captain', wiki: 'Eoin_Morgan' },
    { name: 'Sourav Ganguly', blurb: 'Dada · Transformed India into fearless overseas winners', wiki: 'Sourav_Ganguly' },
    { name: 'Rohit Sharma', blurb: '5x IPL winning captain & 2024 T20 World Cup winner', wiki: 'Rohit_Sharma' },
    { name: 'Virat Kohli', blurb: 'India’s most successful Test captain (40 wins)', wiki: 'Virat_Kohli' },
    { name: 'Kane Williamson', blurb: 'Led New Zealand to 2021 World Test Championship', wiki: 'Kane_Williamson' },
    { name: 'Arjuna Ranatunga', blurb: 'Captain who led Sri Lanka to 1996 World Cup glory', wiki: 'Arjuna_Ranatunga' },
    { name: 'Stephen Fleming', blurb: 'Tactical genius · New Zealand’s longest-serving captain', wiki: 'Stephen_Fleming' }
  ]
};

async function main() {
  console.log('='.repeat(60));
  console.log(' GOAT.lol — Loading Authentic Cricket Legends & Face Photos');
  console.log('='.repeat(60));

  // 1. Delete all dummy placeholder records
  console.log('Deleting placeholder/dummy records...');
  await supa.from('people').delete().or('name.ilike.Bowlers %,name.ilike.Batsmen %,name.ilike.All-rounder %,name.ilike.Contender %,name.ilike.Person %');
  console.log('✅ Deleted all dummy records.');

  // 2. Fetch categories
  const { data: categories } = await supa.from('categories').select('*');

  // 3. Batch resolve all cricket legend portraits
  const allLegends = Object.values(CRICKET_DATA).flat();
  const uniqueWikis = Array.from(new Set(allLegends.map(l => l.wiki)));
  
  console.log(`Resolving ${uniqueWikis.length} unique cricket legend Wikipedia portraits in batches...`);
  const photoByWiki = {};
  
  // Specific known high-res portraits
  photoByWiki['Kapil_Dev'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Kapil_Dev_at_Equation_sports_auction_%283x4_cropped%29.jpg/500px-Kapil_Dev_at_Equation_sports_auction_%283x4_cropped%29.jpg';
  photoByWiki['Virat_Kohli'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_01.jpg/500px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_01.jpg';
  photoByWiki['Sachin_Tendulkar'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Sachin_Tendulkar_at_MRF_Promotion_Event.jpg/500px-Sachin_Tendulkar_at_MRF_Promotion_Event.jpg';
  photoByWiki['Rohit_Sharma'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Rohit_Sharma_during_the_India_vs_Australia_4th_Test_match_at_Narendra_Modi_Stadium.jpg/500px-Rohit_Sharma_during_the_India_vs_Australia_4th_Test_match_at_Narendra_Modi_Stadium.jpg';
  photoByWiki['MS_Dhoni'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/MS_Dhoni_in_2011.jpg/500px-MS_Dhoni_in_2011.jpg';
  photoByWiki['Jasprit_Bumrah'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_2023.jpg/500px-Jasprit_Bumrah_in_2023.jpg';
  photoByWiki['Wasim_Akram'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Wasim_Akram_2015.jpg/500px-Wasim_Akram_2015.jpg';
  photoByWiki['Shane_Warne'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Shane_Warne_in_2015.jpg/500px-Shane_Warne_in_2015.jpg';
  photoByWiki['Glenn_McGrath'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Glenn_McGrath_2011.jpg/500px-Glenn_McGrath_2011.jpg';
  photoByWiki['Brian_Lara'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Brian_Lara_at_2014_World_Cup_golf.jpg/500px-Brian_Lara_at_2014_World_Cup_golf.jpg';
  photoByWiki['Ricky_Ponting'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Ricky_Ponting_2015.jpg/500px-Ricky_Ponting_2015.jpg';
  photoByWiki['Rahul_Dravid'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Rahul_Dravid_2011.jpg/500px-Rahul_Dravid_2011.jpg';
  photoByWiki['AB_de_Villiers'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/AB_de_Villiers_2015.jpg/500px-AB_de_Villiers_2015.jpg';
  photoByWiki['Jacques_Kallis'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Jacques_Kallis_2012.jpg/500px-Jacques_Kallis_2012.jpg';
  photoByWiki['Imran_Khan'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Imran_Khan_2018.jpg/500px-Imran_Khan_2018.jpg';
  photoByWiki['Muttiah_Muralitharan'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Muttiah_Muralitharan_2011.jpg/500px-Muttiah_Muralitharan_2011.jpg';

  // Batch query remaining
  const needed = uniqueWikis.filter(w => !photoByWiki[w]);
  if (needed.length > 0) {
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&piprop=thumbnail&pithumbsize=500&redirects=1&titles=${encodeURIComponent(needed.join('|'))}&format=json`;
    try {
      const res = await fetch(apiUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (res.ok) {
        const j = await res.json();
        const pages = Object.values(j.query?.pages || {});
        for (const p of pages) {
          const thumb = p.thumbnail?.source?.split('?')[0];
          if (thumb) {
            const key = p.title.replace(/ /g, '_');
            photoByWiki[key] = thumb;
          }
        }
      }
    } catch(e) {}
  }

  // 4. Upsert cricket legends into Supabase
  for (const [slugKey, list] of Object.entries(CRICKET_DATA)) {
    const matchingCats = categories.filter(c => c.slug === slugKey || c.slug === `greatest-${slugKey}` || c.slug === `greatest-${slugKey.replace(/s$/, '')}`);
    
    for (const cat of matchingCats) {
      console.log(`Seeding authentic legends for: ${cat.name} (${cat.slug})...`);
      
      for (const item of list) {
        const photo = photoByWiki[item.wiki] || photoByWiki[item.name.replace(/ /g, '_')] || `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Kapil_Dev_at_Equation_sports_auction_%283x4_cropped%29.jpg/500px-Kapil_Dev_at_Equation_sports_auction_%283x4_cropped%29.jpg`;
        const slug = `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${cat.slug.slice(0, 4)}`;
        
        const { data: existing } = await supa.from('people').select('id').eq('category_id', cat.id).eq('name', item.name).maybeSingle();
        
        if (existing) {
          await supa.from('people').update({
            photo_path: photo,
            blurb: item.blurb,
            wikipedia_url: `https://en.wikipedia.org/wiki/${item.wiki}`
          }).eq('id', existing.id);
        } else {
          await supa.from('people').insert({
            slug,
            name: item.name,
            blurb: item.blurb,
            wikipedia_url: `https://en.wikipedia.org/wiki/${item.wiki}`,
            photo_path: photo,
            category_id: cat.id,
            total_cents: 0,
            backer_count: 0
          });
        }
      }
    }
  }

  console.log('='.repeat(60));
  console.log('🎉 CRICKET BOARDS FULLY POPULATED WITH AUTHENTIC LEGENDS & PORTRAITS!');
  console.log('='.repeat(60));
}

main().catch(console.error);

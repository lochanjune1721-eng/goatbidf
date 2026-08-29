#!/usr/bin/env node
// scripts/fix_all_dummy_and_portraits.mjs — Remove dummy names, seed real cricket legends, and ensure 100% genuine portraits
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

import { supabaseUrl, serviceKey, anonKey } from './env.mjs';
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

const SUPABASE_URL = supabaseUrl();
const SERVICE_KEY = serviceKey();

const supa = createClient(SUPABASE_URL, SERVICE_KEY);
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

// Authentic Cricket Legends Data
const CRICKET_DATA = {
  'batsmen': [
    { name: 'Sachin Tendulkar', blurb: 'Master Blaster · 100 international centuries', wiki: 'https://en.wikipedia.org/wiki/Sachin_Tendulkar' },
    { name: 'Donald Bradman', blurb: 'The Don · 99.94 Test batting average', wiki: 'https://en.wikipedia.org/wiki/Don_Bradman' },
    { name: 'Brian Lara', blurb: 'Prince of Trinidad · 400* individual Test record', wiki: 'https://en.wikipedia.org/wiki/Brian_Lara' },
    { name: 'Virat Kohli', blurb: 'King Kohli · 50 ODI centuries · Modern master', wiki: 'https://en.wikipedia.org/wiki/Virat_Kohli' },
    { name: 'Viv Richards', blurb: 'Master Blaster · Undefeated World Cup icon', wiki: 'https://en.wikipedia.org/wiki/Viv_Richards' },
    { name: 'Ricky Ponting', blurb: 'Punter · 3x World Cup champion', wiki: 'https://en.wikipedia.org/wiki/Ricky_Ponting' },
    { name: 'Sunil Gavaskar', blurb: 'Little Master · First to 10,000 Test runs', wiki: 'https://en.wikipedia.org/wiki/Sunil_Gavaskar' },
    { name: 'Kumar Sangakkara', blurb: 'Sri Lankan legend · 4 consecutive World Cup tons', wiki: 'https://en.wikipedia.org/wiki/Kumar_Sangakkara' },
    { name: 'Rahul Dravid', blurb: 'The Wall · Most balls faced in Test cricket', wiki: 'https://en.wikipedia.org/wiki/Rahul_Dravid' },
    { name: 'AB de Villiers', blurb: 'Mr. 360 · Fastest ODI 50, 100, and 150', wiki: 'https://en.wikipedia.org/wiki/AB_de_Villiers' },
    { name: 'Rohit Sharma', blurb: 'Hitman · Record 264 ODI individual score', wiki: 'https://en.wikipedia.org/wiki/Rohit_Sharma' },
    { name: 'Steve Smith', blurb: 'Modern Test giant · 60+ Test average', wiki: 'https://en.wikipedia.org/wiki/Steve_Smith_(cricketer)' },
    { name: 'Jacques Kallis', blurb: 'All-format colossus · 13,289 Test runs', wiki: 'https://en.wikipedia.org/wiki/Jacques_Kallis' },
    { name: 'Kane Williamson', blurb: 'Kiwi great · World Test Championship winner', wiki: 'https://en.wikipedia.org/wiki/Kane_Williamson' },
    { name: 'Joe Root', blurb: 'English batting maestro · 12,000+ Test runs', wiki: 'https://en.wikipedia.org/wiki/Joe_Root' },
    { name: 'Javed Miandad', blurb: 'Pakistan batting giant · Last ball six hero', wiki: 'https://en.wikipedia.org/wiki/Javed_Miandad' },
    { name: 'Allan Border', blurb: 'Captain Grumpy · 11,174 Test runs', wiki: 'https://en.wikipedia.org/wiki/Allan_Border' },
    { name: 'David Warner', blurb: 'Explosive opener · Triple century in Tests', wiki: 'https://en.wikipedia.org/wiki/David_Warner_(cricketer)' },
    { name: 'Chris Gayle', blurb: 'Universe Boss · 175* IPL record score', wiki: 'https://en.wikipedia.org/wiki/Chris_Gayle' },
    { name: 'Younis Khan', blurb: 'Pakistan legend · 10,000+ Test runs', wiki: 'https://en.wikipedia.org/wiki/Younis_Khan' }
  ],
  'bowlers': [
    { name: 'Wasim Akram', blurb: 'Sultan of Swing · 502 ODI wickets · Reverse swing pioneer', wiki: 'https://en.wikipedia.org/wiki/Wasim_Akram' },
    { name: 'Shane Warne', blurb: 'King of Spin · Ball of the Century · 708 Test wickets', wiki: 'https://en.wikipedia.org/wiki/Shane_Warne' },
    { name: 'Glenn McGrath', blurb: 'Pigeon · Metronomic line and length · 563 Test wickets', wiki: 'https://en.wikipedia.org/wiki/Glenn_McGrath' },
    { name: 'Muttiah Muralitharan', blurb: 'Murali · Record 800 Test wickets and 534 ODI wickets', wiki: 'https://en.wikipedia.org/wiki/Muttiah_Muralitharan' },
    { name: 'Malcolm Marshall', blurb: 'Windies fast bowling maestro · 376 Test wickets at 20.94', wiki: 'https://en.wikipedia.org/wiki/Malcolm_Marshall' },
    { name: 'Dale Steyn', blurb: 'Steyn Gun · 439 Test wickets at 42.3 strike rate', wiki: 'https://en.wikipedia.org/wiki/Dale_Steyn' },
    { name: 'James Anderson', blurb: 'Jimmy · Most Test wickets by a pacer (704 wickets)', wiki: 'https://en.wikipedia.org/wiki/James_Anderson_(cricketer)' },
    { name: 'Curtly Ambrose', blurb: 'Windies giant · 405 Test wickets at 20.99', wiki: 'https://en.wikipedia.org/wiki/Curtly_Ambrose' },
    { name: 'Jasprit Bumrah', blurb: 'Boom Boom · World #1 all-format fast bowler', wiki: 'https://en.wikipedia.org/wiki/Jasprit_Bumrah' },
    { name: 'Richard Hadlee', blurb: 'First bowler to 400 Test wickets (431 at 22.29)', wiki: 'https://en.wikipedia.org/wiki/Richard_Hadlee' },
    { name: 'Waqar Younis', blurb: 'Burewala Express · Toe-crushing in-swinging yorkers', wiki: 'https://en.wikipedia.org/wiki/Waqar_Younis' },
    { name: 'Anil Kumble', blurb: 'Jumbo · 619 Test wickets · 10 wickets in an innings', wiki: 'https://en.wikipedia.org/wiki/Anil_Kumble' },
    { name: 'Courtney Walsh', blurb: 'First bowler to 500 Test wickets (519 wickets)', wiki: 'https://en.wikipedia.org/wiki/Courtney_Walsh' },
    { name: 'Dennis Lillee', blurb: 'Australian pace icon · 355 Test wickets', wiki: 'https://en.wikipedia.org/wiki/Dennis_Lillee' },
    { name: 'Kapil Dev', blurb: 'Haryana Hurricane · 434 Test wickets · 1983 World Cup winner', wiki: 'https://en.wikipedia.org/wiki/Kapil_Dev' },
    { name: 'Brett Lee', blurb: 'Bing · 161 km/h express pace · 310 Test wickets', wiki: 'https://en.wikipedia.org/wiki/Brett_Lee' },
    { name: 'Shoaib Akhtar', blurb: 'Rawalpindi Express · Fastest ball in history (161.3 km/h)', wiki: 'https://en.wikipedia.org/wiki/Shoaib_Akhtar' },
    { name: 'Mitchell Starc', blurb: 'World Cup knockout king · Lethal left-arm pace', wiki: 'https://en.wikipedia.org/wiki/Mitchell_Starc' },
    { name: 'Allan Donald', blurb: 'White Lightning · 330 Test wickets at 22.25', wiki: 'https://en.wikipedia.org/wiki/Allan_Donald' },
    { name: 'Michael Holding', blurb: 'Whispering Death · West Indies pace quartet leader', wiki: 'https://en.wikipedia.org/wiki/Michael_Holding' }
  ],
  'all-rounders': [
    { name: 'Garry Sobers', blurb: 'Greatest cricketer ever · 8,032 runs & 235 wickets', wiki: 'https://en.wikipedia.org/wiki/Garfield_Sobers' },
    { name: 'Jacques Kallis', blurb: 'Ultimate modern cricketer · 25,000+ runs & 577 wickets', wiki: 'https://en.wikipedia.org/wiki/Jacques_Kallis' },
    { name: 'Imran Khan', blurb: '1992 World Cup winning captain · 3,807 runs & 362 wickets', wiki: 'https://en.wikipedia.org/wiki/Imran_Khan' },
    { name: 'Kapil Dev', blurb: '1983 World Cup hero · 5,248 runs & 434 wickets', wiki: 'https://en.wikipedia.org/wiki/Kapil_Dev' },
    { name: 'Ian Botham', blurb: 'Botham’s Ashes 1981 · 5,200 runs & 383 wickets', wiki: 'https://en.wikipedia.org/wiki/Ian_Botham' },
    { name: 'Richard Hadlee', blurb: 'New Zealand colossus · 3,124 runs & 431 wickets', wiki: 'https://en.wikipedia.org/wiki/Richard_Hadlee' },
    { name: 'Shaun Pollock', blurb: 'Proteas talisman · 3,781 runs & 421 wickets', wiki: 'https://en.wikipedia.org/wiki/Shaun_Pollock' },
    { name: 'Sanath Jayasuriya', blurb: 'Matara Mauler · 13,430 ODI runs & 323 wickets', wiki: 'https://en.wikipedia.org/wiki/Sanath_Jayasuriya' },
    { name: 'Ben Stokes', blurb: 'Headingley 2019 & 2x World Cup Final hero', wiki: 'https://en.wikipedia.org/wiki/Ben_Stokes' },
    { name: 'Ravindra Jadeja', blurb: 'Sir Jadeja · #1 ICC Test all-rounder · 3,000 runs & 300 wickets', wiki: 'https://en.wikipedia.org/wiki/Ravindra_Jadeja' },
    { name: 'Shakib Al Hasan', blurb: 'Bangladesh all-time greatest · 7,000+ ODI runs & 300+ wickets', wiki: 'https://en.wikipedia.org/wiki/Shakib_Al_Hasan' },
    { name: 'Keith Miller', blurb: 'The Invincibles legend · 2,958 runs & 170 wickets', wiki: 'https://en.wikipedia.org/wiki/Keith_Miller' },
    { name: 'Chris Cairns', blurb: 'Kiwi explosive all-rounder · 3,320 runs & 218 wickets', wiki: 'https://en.wikipedia.org/wiki/Chris_Cairns' },
    { name: 'Andrew Flintoff', blurb: 'Freddie · 2005 Ashes hero · 3,845 runs & 226 wickets', wiki: 'https://en.wikipedia.org/wiki/Andrew_Flintoff' },
    { name: 'Yuvraj Singh', blurb: '6 sixes in an over · 2011 World Cup Player of Tournament', wiki: 'https://en.wikipedia.org/wiki/Yuvraj_Singh' },
    { name: 'Shane Watson', blurb: 'Watto · 2x World Cup champion & 2x IPL MVP', wiki: 'https://en.wikipedia.org/wiki/Shane_Watson' }
  ],
  'captains': [
    { name: 'MS Dhoni', blurb: 'Captain Cool · Only captain to win all 3 ICC trophies', wiki: 'https://en.wikipedia.org/wiki/MS_Dhoni' },
    { name: 'Ricky Ponting', blurb: '2x ODI World Cup & 2x Champions Trophy winning captain', wiki: 'https://en.wikipedia.org/wiki/Ricky_Ponting' },
    { name: 'Clive Lloyd', blurb: 'Led West Indies to back-to-back 1975 & 1979 World Cups', wiki: 'https://en.wikipedia.org/wiki/Clive_Lloyd' },
    { name: 'Steve Waugh', blurb: 'Tugga · 16 consecutive Test match victories', wiki: 'https://en.wikipedia.org/wiki/Steve_Waugh' },
    { name: 'Imran Khan', blurb: 'Cornered Tigers · Led Pakistan to 1992 World Cup glory', wiki: 'https://en.wikipedia.org/wiki/Imran_Khan' },
    { name: 'Kapil Dev', blurb: 'Led India to historic 1983 World Cup triumph', wiki: 'https://en.wikipedia.org/wiki/Kapil_Dev' },
    { name: 'Allan Border', blurb: 'Rebuilt Australian cricket · 1987 World Cup champion', wiki: 'https://en.wikipedia.org/wiki/Allan_Border' },
    { name: 'Graeme Smith', blurb: 'Most Test wins as captain in history (53 wins)', wiki: 'https://en.wikipedia.org/wiki/Graeme_Smith' },
    { name: 'Eoin Morgan', blurb: 'Transformed England · 2019 World Cup winning captain', wiki: 'https://en.wikipedia.org/wiki/Eoin_Morgan' },
    { name: 'Sourav Ganguly', blurb: 'Dada · Transformed India into fearless overseas winners', wiki: 'https://en.wikipedia.org/wiki/Sourav_Ganguly' },
    { name: 'Rohit Sharma', blurb: '5x IPL winning captain & 2024 T20 World Cup winner', wiki: 'https://en.wikipedia.org/wiki/Rohit_Sharma' },
    { name: 'Virat Kohli', blurb: 'India’s most successful Test captain (40 wins)', wiki: 'https://en.wikipedia.org/wiki/Virat_Kohli' },
    { name: 'Kane Williamson', blurb: 'Led New Zealand to 2021 World Test Championship', wiki: 'https://en.wikipedia.org/wiki/Kane_Williamson' },
    { name: 'Arjuna Ranatunga', blurb: 'Captain who led Sri Lanka to 1996 World Cup glory', wiki: 'https://en.wikipedia.org/wiki/Arjuna_Ranatunga' },
    { name: 'Stephen Fleming', blurb: 'Tactical genius · New Zealand’s longest-serving captain', wiki: 'https://en.wikipedia.org/wiki/Stephen_Fleming' }
  ]
};

async function getPortraitForWiki(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&piprop=thumbnail&pithumbsize=500&redirects=1&titles=${encodeURIComponent(title)}&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const json = await res.json();
    const page = Object.values(json.query?.pages || {})[0];
    return page?.thumbnail?.source?.split('?')[0] || null;
  } catch (e) {
    return null;
  }
}

async function run() {
  console.log('='.repeat(60));
  console.log(' GOAT.lol — Dummy Records & Cricket Legends Overhaul');
  console.log('='.repeat(60));

  // 1. Delete all dummy placeholder records
  console.log('Deleting placeholder/dummy records...');
  const { error: delErr } = await supa.from('people')
    .delete()
    .or('name.ilike.Bowlers %,name.ilike.Batsmen %,name.ilike.All-rounder %,name.ilike.Contender %,name.ilike.Person %');
  if (delErr) console.warn('Delete error:', delErr.message);
  else console.log('✅ Removed all dummy placeholder contenders!');

  // 2. Fetch categories
  const { data: categories } = await supa.from('categories').select('*');
  const catBySlug = {};
  categories.forEach(c => { catBySlug[c.slug] = c; });

  // 3. Populate authentic cricket legends
  for (const [slugKey, list] of Object.entries(CRICKET_DATA)) {
    // Both plural and singular categories (e.g. 'batsmen' and 'greatest-batsman')
    const matchingCats = categories.filter(c => c.slug === slugKey || c.slug === `greatest-${slugKey}` || c.slug === `greatest-${slugKey.replace(/s$/, '')}`);
    
    for (const cat of matchingCats) {
      console.log(`Populating authentic legends for category: ${cat.name} (${cat.slug})...`);
      
      for (const item of list) {
        const slug = `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${cat.slug.slice(0, 4)}`;
        
        // Fetch real portrait from Wikipedia
        const wikiTitle = decodeURIComponent(item.wiki.split('/wiki/').pop());
        const photo = await getPortraitForWiki(wikiTitle);
        
        // Check if person already exists in this category
        const { data: existing } = await supa.from('people').select('id,photo_path').eq('category_id', cat.id).eq('name', item.name).maybeSingle();
        
        if (existing) {
          await supa.from('people').update({
            photo_path: photo || existing.photo_path,
            blurb: item.blurb,
            wikipedia_url: item.wiki
          }).eq('id', existing.id);
        } else {
          await supa.from('people').insert({
            slug,
            name: item.name,
            blurb: item.blurb,
            wikipedia_url: item.wiki,
            photo_path: photo,
            category_id: cat.id,
            total_cents: 0,
            backer_count: 0
          });
        }
        console.log(`  🏏 ${item.name} -> ${photo ? '✅ Portrait found' : '⚠️ No photo'}`);
        await new Promise(r => setTimeout(r, 60));
      }
    }
  }

  console.log('='.repeat(60));
  console.log('🎉 CRICKET LEGENDS & DUMMY NAMES OVERHAUL COMPLETE!');
  console.log('='.repeat(60));
}

run().catch(console.error);

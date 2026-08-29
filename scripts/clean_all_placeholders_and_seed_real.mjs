// scripts/clean_all_placeholders_and_seed_real.mjs — Purge all dummy names and populate real legends
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (m) {
        let val = (m[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        if (!process.env[m[1]]) process.env[m[1]] = val;
      }
    }
  }
} catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || "https://iuvmzlrnbwptgrbkdbbn.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dm16bHJuYndwdGdyYmtkYmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5NzcyOSwiZXhwIjoyMTAzMTczNzI5fQ.XX378u9ceV2zf8urOZoHN4wwRwlsEgkb1nJF9TG1DQU";

const supa = createClient(SUPABASE_URL, SERVICE_KEY);
const UA = "GOAT-App/1.0 (https://goat.lol; admin@goat.lol)";

// Authentic Iconic Category Contenders
const AUTHENTIC_ROSTERS = {
  'footballers': [
    { name: 'Lionel Messi', wiki: 'Lionel_Messi', blurb: '8x Ballon d’Or · World Cup Champion' },
    { name: 'Cristiano Ronaldo', wiki: 'Cristiano_Ronaldo', blurb: '5x Ballon d’Or · All-time top international goalscorer' },
    { name: 'Pelé', wiki: 'Pelé', blurb: 'O Rei · 3x World Cup Champion' },
    { name: 'Diego Maradona', wiki: 'Diego_Maradona', blurb: 'El Pibe de Oro · 1986 World Cup legend' },
    { name: 'Zinedine Zidane', wiki: 'Zinedine_Zidane', blurb: 'Zizou · World Cup & Champions League winning maestro' },
    { name: 'Johan Cruyff', wiki: 'Johan_Cruyff', blurb: 'Father of Total Football · 3x Ballon d’Or' },
    { name: 'Ronaldinho', wiki: 'Ronaldinho', blurb: 'The Magician · Ballon d’Or & World Cup winner' },
    { name: 'Ronaldo Nazário', wiki: 'Ronaldo_(Brazilian_footballer)', blurb: 'O Fenômeno · 2x World Cup & 2x Ballon d’Or' },
    { name: 'Thierry Henry', wiki: 'Thierry_Henry', blurb: 'Arsenal Invincible · France all-time great' },
    { name: 'Paolo Maldini', wiki: 'Paolo_Maldini', blurb: 'Il Capitano · 5x European Cup / Champions League winner' }
  ],
  'managers': [
    { name: 'Sir Alex Ferguson', wiki: 'Alex_Ferguson', blurb: '13 Premier League & 2 Champions League titles' },
    { name: 'Pep Guardiola', wiki: 'Pep_Guardiola', blurb: 'Tiki-taka pioneer · 3x Champions League & 12 league titles' },
    { name: 'Carlo Ancelotti', wiki: 'Carlo_Ancelotti', blurb: 'Only manager to win 5 Champions League titles' },
    { name: 'José Mourinho', wiki: 'José_Mourinho', blurb: 'The Special One · Champions League with Porto & Inter' },
    { name: 'Johan Cruyff', wiki: 'Johan_Cruyff', blurb: 'Architect of Barcelona Dream Team' },
    { name: 'Rinus Michels', wiki: 'Rinus_Michels', blurb: 'Father of Total Football · European Champion 1988' },
    { name: 'Jürgen Klopp', wiki: 'Jürgen_Klopp', blurb: 'Heavy Metal football · Champions League & Premier League' },
    { name: 'Arsène Wenger', wiki: 'Arsène_Wenger', blurb: 'The Professor · 49 games unbeaten Invincibles' },
    { name: 'Arrigo Sacchi', wiki: 'Arrigo_Sacchi', blurb: 'Milan revolution · Back-to-back European Cups' },
    { name: 'Bill Shankly', wiki: 'Bill_Shankly', blurb: 'Legendary builder of modern Liverpool' }
  ],
  'goalkeepers': [
    { name: 'Gianluigi Buffon', wiki: 'Gianluigi_Buffon', blurb: 'Gigi · 2006 World Cup champion · Record Serie A appearances' },
    { name: 'Manuel Neuer', wiki: 'Manuel_Neuer', blurb: 'Sweeper-keeper pioneer · 2014 World Cup champion' },
    { name: 'Iker Casillas', wiki: 'Iker_Casillas', blurb: 'San Iker · World Cup & 2x Euro winning captain' },
    { name: 'Lev Yashin', wiki: 'Lev_Yashin', blurb: 'Black Spider · Only goalkeeper to win Ballon d’Or' },
    { name: 'Peter Schmeichel', wiki: 'Peter_Schmeichel', blurb: 'The Great Dane · 1999 Treble winner' },
    { name: 'Dino Zoff', wiki: 'Dino_Zoff', blurb: 'Oldest World Cup winner (age 40 in 1982)' },
    { name: 'Edwin van der Sar', wiki: 'Edwin_van_der_Sar', blurb: 'Champions League winner with Ajax & Man United' },
    { name: 'Oliver Kahn', wiki: 'Oliver_Kahn', blurb: 'Der Titan · 2002 World Cup Golden Ball' },
    { name: 'Petr Čech', wiki: 'Petr_Čech', blurb: 'Premier League clean sheet record holder (202)' },
    { name: 'Gordon Banks', wiki: 'Gordon_Banks', blurb: '1966 World Cup winner · Save of the Century' }
  ],
  'batsmen': [
    { name: 'Sachin Tendulkar', wiki: 'Sachin_Tendulkar', blurb: 'Master Blaster · 100 international centuries' },
    { name: 'Donald Bradman', wiki: 'Don_Bradman', blurb: 'The Don · 99.94 Test batting average' },
    { name: 'Brian Lara', wiki: 'Brian_Lara', blurb: 'Prince of Trinidad · 400* individual Test record' },
    { name: 'Virat Kohli', wiki: 'Virat_Kohli', blurb: 'King Kohli · 50 ODI centuries' },
    { name: 'Viv Richards', wiki: 'Viv_Richards', blurb: 'Master Blaster · Undefeated World Cup icon' },
    { name: 'Ricky Ponting', wiki: 'Ricky_Ponting', blurb: 'Punter · 3x World Cup champion' },
    { name: 'Sunil Gavaskar', wiki: 'Sunil_Gavaskar', blurb: 'Little Master · First to 10,000 Test runs' },
    { name: 'Kumar Sangakkara', wiki: 'Kumar_Sangakkara', blurb: '4 consecutive World Cup hundreds' },
    { name: 'Rahul Dravid', wiki: 'Rahul_Dravid', blurb: 'The Wall · Most balls faced in Test history' },
    { name: 'AB de Villiers', wiki: 'AB_de_Villiers', blurb: 'Mr. 360 · Fastest ODI hundred in history' },
    { name: 'Steve Smith', wiki: 'Steve_Smith_(cricketer)', blurb: 'Modern Test batting giant' },
    { name: 'Rohit Sharma', wiki: 'Rohit_Sharma', blurb: 'Hitman · Record 264 ODI individual score' }
  ],
  'bowlers': [
    { name: 'Wasim Akram', wiki: 'Wasim_Akram', blurb: 'Sultan of Swing · 502 ODI & 414 Test wickets' },
    { name: 'Shane Warne', wiki: 'Shane_Warne', blurb: 'King of Spin · 708 Test wickets' },
    { name: 'Glenn McGrath', wiki: 'Glenn_McGrath', blurb: 'Pigeon · 563 Test wickets at 21.64' },
    { name: 'Muttiah Muralitharan', wiki: 'Muttiah_Muralitharan', blurb: 'Murali · Record 800 Test wickets' },
    { name: 'Malcolm Marshall', wiki: 'Malcolm_Marshall', blurb: 'Windies pace maestro · 376 Test wickets at 20.94' },
    { name: 'Dale Steyn', wiki: 'Dale_Steyn', blurb: 'Steyn Gun · 439 Test wickets at 42.3 strike rate' },
    { name: 'James Anderson', wiki: 'James_Anderson_(cricketer)', blurb: 'Jimmy · 704 Test wickets' },
    { name: 'Jasprit Bumrah', wiki: 'Jasprit_Bumrah', blurb: 'World #1 all-format fast bowling maestro' },
    { name: 'Kapil Dev', wiki: 'Kapil_Dev', blurb: 'Haryana Hurricane · 434 Test wickets' },
    { name: 'Curtly Ambrose', wiki: 'Curtly_Ambrose', blurb: 'Windies giant · 405 Test wickets at 20.99' }
  ],
  'all-rounders': [
    { name: 'Garry Sobers', wiki: 'Garfield_Sobers', blurb: 'Greatest cricketer ever · 8,032 runs & 235 wickets' },
    { name: 'Jacques Kallis', wiki: 'Jacques_Kallis', blurb: 'Ultimate colossus · 25,000+ runs & 577 wickets' },
    { name: 'Imran Khan', wiki: 'Imran_Khan', blurb: '1992 World Cup winning captain & all-rounder' },
    { name: 'Kapil Dev', wiki: 'Kapil_Dev', blurb: '1983 World Cup hero · 5,248 runs & 434 wickets' },
    { name: 'Ian Botham', wiki: 'Ian_Botham', blurb: 'Botham’s Ashes 1981 · 5,200 runs & 383 wickets' },
    { name: 'Richard Hadlee', wiki: 'Richard_Hadlee', blurb: '431 Test wickets & 3,124 Test runs' },
    { name: 'Shaun Pollock', wiki: 'Shaun_Pollock', blurb: '421 Test wickets & 3,781 Test runs' },
    { name: 'Sanath Jayasuriya', wiki: 'Sanath_Jayasuriya', blurb: '13,430 ODI runs & 323 ODI wickets' },
    { name: 'Ben Stokes', wiki: 'Ben_Stokes', blurb: 'Headingley 2019 & 2x World Cup Final hero' },
    { name: 'Ravindra Jadeja', wiki: 'Ravindra_Jadeja', blurb: '#1 ICC Test all-rounder · 3,000 runs & 300 wickets' }
  ],
  'captains': [
    { name: 'MS Dhoni', wiki: 'MS_Dhoni', blurb: 'Captain Cool · Only captain to win all 3 ICC white-ball trophies' },
    { name: 'Ricky Ponting', wiki: 'Ricky_Ponting', blurb: '2x ODI World Cup & 2x Champions Trophy winning captain' },
    { name: 'Clive Lloyd', wiki: 'Clive_Lloyd', blurb: 'Led West Indies to back-to-back 1975 & 1979 World Cups' },
    { name: 'Steve Waugh', wiki: 'Steve_Waugh', blurb: '16 consecutive Test match victories' },
    { name: 'Imran Khan', wiki: 'Imran_Khan', blurb: 'Cornered Tigers · Led Pakistan to 1992 World Cup glory' },
    { name: 'Kapil Dev', wiki: 'Kapil_Dev', blurb: 'Led India to historic 1983 World Cup triumph' },
    { name: 'Allan Border', wiki: 'Allan_Border', blurb: 'Rebuilt Australian cricket · 1987 World Cup champion' },
    { name: 'Sourav Ganguly', wiki: 'Sourav_Ganguly', blurb: 'Dada · Transformed India into fearless overseas winners' },
    { name: 'Rohit Sharma', wiki: 'Rohit_Sharma', blurb: '5x IPL winning captain & 2024 T20 World Cup champion' },
    { name: 'Virat Kohli', wiki: 'Virat_Kohli', blurb: 'India’s most successful Test captain (40 wins)' }
  ],
  'basketball-players': [
    { name: 'Michael Jordan', wiki: 'Michael_Jordan', blurb: 'MJ · 6x NBA Champion · 6x Finals MVP · 5x MVP' },
    { name: 'LeBron James', wiki: 'LeBron_James', blurb: 'King James · NBA all-time leading scorer · 4x Champion' },
    { name: 'Kobe Bryant', wiki: 'Kobe_Bryant', blurb: 'Black Mamba · 5x NBA Champion · 2x Finals MVP' },
    { name: 'Magic Johnson', wiki: 'Magic_Johnson', blurb: 'Showtime Lakers · 5x NBA Champion · 3x MVP' },
    { name: 'Larry Bird', wiki: 'Larry_Bird', blurb: 'Legend · 3x NBA Champion · 3x consecutive MVP' },
    { name: 'Shaquille O\'Neal', wiki: 'Shaquille_O%27Neal', blurb: 'Shaq · Most dominant force in NBA history · 4x Champion' },
    { name: 'Stephen Curry', wiki: 'Stephen_Curry', blurb: 'Chef Curry · Greatest shooter in basketball history · 4x Champion' },
    { name: 'Kareem Abdul-Jabbar', wiki: 'Kareem_Abdul-Jabbar', blurb: 'Cap · 6x NBA Champion · 6x MVP · Skyhook master' },
    { name: 'Bill Russell', wiki: 'Bill_Russell', blurb: 'Ultimate winner · 11x NBA Champion in 13 seasons' },
    { name: 'Wilt Chamberlain', wiki: 'Wilt_Chamberlain', blurb: '100-point game · 50.4 PPG single season record' }
  ]
};

async function getWikiPhoto(wikiTitle) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&piprop=thumbnail&pithumbsize=500&redirects=1&titles=${encodeURIComponent(wikiTitle)}&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const j = await res.json();
    const page = Object.values(j.query?.pages || {})[0];
    return page?.thumbnail?.source?.split('?')[0] || null;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log(' GOAT.lol — Complete Database Purge of Dummy Records');
  console.log('='.repeat(60));

  // 1. Delete all dummy placeholder records
  console.log('Deleting all dummy/placeholder records matching pattern digits...');
  const dummyPatterns = [
    'Bowlers %', 'Batsmen %', 'All Rounders %', 'All-rounder %', 'Captains %',
    'Managers %', 'Goalkeepers %', 'Ipl Players %', 'Wicketkeepers %',
    'Basketball Players %', 'F1 Drivers %', 'Boxers %', 'Golfers %',
    'Contender %', 'Person %'
  ];

  for (const pat of dummyPatterns) {
    await supa.from('people').delete().ilike('name', pat);
  }
  console.log('✅ Purged all dummy placeholder entries.');

  // 2. Fetch categories
  const { data: categories } = await supa.from('categories').select('*');

  // 3. Seed real authentic rosters
  for (const [slugKey, roster] of Object.entries(AUTHENTIC_ROSTERS)) {
    const targetCats = categories.filter(c => c.slug === slugKey || c.slug === `greatest-${slugKey}` || c.slug === `greatest-${slugKey.replace(/s$/, '')}`);
    
    for (const cat of targetCats) {
      console.log(`Seeding authentic roster for ${cat.name} (${cat.slug})...`);
      
      for (const item of roster) {
        const photo = await getWikiPhoto(item.wiki);
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
        console.log(`  ⭐ ${item.name} -> ${photo ? '✅ ' + photo.slice(0, 60) : '⚠️ No photo'}`);
        await new Promise(r => setTimeout(r, 60));
      }
    }
  }

  console.log('='.repeat(60));
  console.log('🎉 COMPLETE PURGE & SEED FINISHED!');
  console.log('='.repeat(60));
}

main().catch(console.error);

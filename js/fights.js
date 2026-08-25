// GOAT.lol — curated marquee fights for the homepage.
// Each entry names a category (by the slug derived from its name) and the two
// headline contenders. These are the *default* pairing shown while a board is
// still at $0. As soon as real money lands, the homepage shows the live top 2
// instead — see resolveFight() in index.html.
//
// Contender names are matched against people.name within the category, because
// person slugs carry a random suffix from the seeder and can't be hardcoded.
//
// `slug` is the 147-board scheme ("greatest-singer"); `alt` is the equivalent
// board in the original 83-category schema ("singers"). Databases exist in both
// states, and a fight whose slug matches neither is dropped from the homepage
// without a word — which is how a whole group ends up looking empty.

window.GOAT_FIGHTS = [
  // Football
  { cat:'Greatest Footballer',            slug:'greatest-footballer', alt:'footballers',            a:'Lionel Messi',        b:'Cristiano Ronaldo',      tag:'The one that never ends' },
  { cat:'Greatest Football Club',         slug:'greatest-football-club', alt:'clubs',         a:'Real Madrid',         b:'FC Barcelona',           tag:'El Clásico' },
  { cat:'Greatest Football Manager',      slug:'greatest-football-manager', alt:'managers',      a:'Sir Alex Ferguson',   b:'Pep Guardiola',          tag:'Hairdryer vs tiki-taka' },
  // Cricket
  { cat:'Greatest Batsman',               slug:'greatest-batsman', alt:'batsmen',               a:'Don Bradman',         b:'Sachin Tendulkar',       tag:'99.94 vs 100 hundreds' },
  { cat:'Greatest Cricket Captain',       slug:'greatest-cricket-captain', alt:'captains',       a:'MS Dhoni',            b:'Ricky Ponting',          tag:'Cool head vs dynasty' },
  // Basketball
  { cat:'Greatest Basketball Player',     slug:'greatest-basketball-player', alt:'basketball-players',     a:'Michael Jordan',      b:'LeBron James',           tag:'Rings vs longevity' },
  // Tennis
  { cat:'Greatest Male Tennis Player',    slug:'greatest-male-tennis-player', alt:'tennis-men',    a:'Roger Federer',       b:'Novak Djokovic',         tag:'Elegance vs the record book' },
  { cat:'Greatest Female Tennis Player',  slug:'greatest-female-tennis-player', alt:'tennis-women',  a:'Serena Williams',     b:'Steffi Graf',            tag:'23 vs the Golden Slam' },
  // Combat
  { cat:'Greatest Boxer',                 slug:'greatest-boxer', alt:'boxers',                 a:'Muhammad Ali',        b:'Mike Tyson',             tag:'The Greatest vs the scariest' },
  { cat:'Greatest MMA Fighter',           slug:'greatest-mma-fighter', alt:'mma-fighters',           a:'Jon Jones',           b:'Khabib Nurmagomedov',    tag:'Never beaten, both ways' },
  // Motorsport & field
  { cat:'Greatest F1 Driver',             slug:'greatest-f1-driver', alt:'f1-drivers',             a:'Michael Schumacher',  b:'Lewis Hamilton',         tag:'Seven each' },
  { cat:'Greatest Golfer',                slug:'greatest-golfer', alt:'golfers',                a:'Tiger Woods',         b:'Jack Nicklaus',          tag:'15 vs 18 majors' },
  // Mind
  { cat:'Greatest Chess Player',          slug:'greatest-chess-player', alt:'chess-players',          a:'Magnus Carlsen',      b:'Garry Kasparov',         tag:'Engine era vs the beast' },
  { cat:'Greatest Philosopher',           slug:'greatest-philosopher', alt:'philosophers',           a:'Plato',               b:'Aristotle',              tag:'Teacher vs student' },
  { cat:'Greatest Scientist',             slug:'greatest-scientist', alt:'scientists',             a:'Albert Einstein',     b:'Isaac Newton',           tag:'Relativity vs gravity' },
  { cat:'Greatest Inventor',              slug:'greatest-inventor', alt:'inventors',              a:'Thomas Edison',       b:'Nikola Tesla',           tag:'The current war' },
  // Screen
  { cat:'Greatest Film Director',         slug:'greatest-film-director', alt:'directors',         a:'Steven Spielberg',    b:'Martin Scorsese',        tag:'Director of all time' },
  { cat:'Greatest Hollywood Actor',       slug:'greatest-hollywood-actor', alt:'hollywood-actors',       a:'Marlon Brando',       b:'Daniel Day-Lewis',       tag:'Actor of all time' },
  { cat:'Greatest Hollywood Actress',     slug:'greatest-hollywood-actress', alt:'hollywood-actresses',     a:'Meryl Streep',        b:'Katharine Hepburn',      tag:'21 nominations vs 4 wins' },
  { cat:'Greatest Bollywood Actor',       slug:'greatest-bollywood-actor', alt:'bollywood-actors',       a:'Shah Rukh Khan',      b:'Amitabh Bachchan',       tag:'King Khan vs Big B' },
  { cat:'Greatest Film',                  slug:'greatest-film', alt:'films',                  a:'The Godfather',       b:'The Shawshank Redemption', tag:'Critics vs the crowd' },
  { cat:'Greatest TV Show',               slug:'greatest-tv-show', alt:'tv-shows',               a:'Breaking Bad',        b:'The Sopranos',           tag:'Heisenberg vs Tony' },
  // Music
  { cat:'Greatest Singer',                slug:'greatest-singer', alt:'singers',                a:'Michael Jackson',     b:'Freddie Mercury',        tag:'King of Pop vs Queen' },
  { cat:'Greatest Rapper',                slug:'greatest-rapper', alt:'rappers',                a:'Tupac Shakur',        b:'The Notorious B.I.G.',   tag:'West vs East' },
  { cat:'Greatest Band',                  slug:'greatest-band', alt:'bands',                  a:'The Beatles',         b:'The Rolling Stones',     tag:'The original feud' },
  { cat:'Greatest K-pop Group',           slug:'greatest-k-pop-group', alt:'kpop-groups',           a:'BTS',                 b:'BLACKPINK',              tag:'ARMY vs BLINKs' },
  // Power & history
  { cat:'Greatest US President',          slug:'greatest-us-president', alt:'us-presidents',          a:'Abraham Lincoln',     b:'George Washington',      tag:'President of all time' },
  { cat:'Greatest Historical Figure',     slug:'greatest-historical-figure',     a:'Alexander the Great', b:'Julius Caesar',          tag:'Historical figure of all time' },
  // Business & fiction
  { cat:'Greatest Founder',               slug:'greatest-founder', alt:'founders',               a:'Steve Jobs',          b:'Elon Musk',              tag:'Taste vs scale' },
  { cat:'Greatest Superhero',             slug:'greatest-superhero',             a:'Batman',              b:'Superman',               tag:'No powers vs all of them' }
];

/* GOAT.lol — every board and its contenders.
 *
 * 147 boards, 2,926 real names. Curated by hand, not scraped: there is no
 * Wikidata query behind this and nothing here is a placeholder.
 *
 * Ten boards hold fewer than 20 because that is how many real entries exist
 * (there have only ever been 15 Indian prime ministers). They are left short
 * on purpose — a board with 15 real names beats one padded to 20 with fakes,
 * and anyone can add a missing name for $1.
 *
 * Everyone seeds at $0. Nobody is pre-ranked.
 *
 * After editing, regenerate the SQL:  node scripts/make-seed-sql.mjs
 */
export const BOARDS = [
  {
    slug: "greatest-footballer", name: "Greatest Footballer", group: "Football",
    people: ["Lionel Messi", "Cristiano Ronaldo", "Pelé", "Diego Maradona", "Johan Cruyff", "Zinedine Zidane", "Ronaldo Nazário", "Franz Beckenbauer", "Ronaldinho", "Alfredo Di Stéfano", "Michel Platini", "George Best", "Garrincha", "Xavi", "Andrés Iniesta", "Paolo Maldini", "Eusébio", "Thierry Henry", "Luka Modrić", "Neymar"],
    slugs: ["lionel-messi", "cristiano-ronaldo", "pele", "diego-maradona", "johan-cruyff", "zinedine-zidane", "ronaldo-nazario", "franz-beckenbauer", "ronaldinho", "alfredo-di-stefano", "michel-platini", "george-best", "garrincha", "xavi", "andres-iniesta", "paolo-maldini", "eusebio", "thierry-henry", "luka-modric", "neymar"]
  },
  {
    slug: "greatest-football-manager", name: "Greatest Football Manager", group: "Football",
    people: ["Sir Alex Ferguson", "Pep Guardiola", "Carlo Ancelotti", "José Mourinho", "Jürgen Klopp", "Arsène Wenger", "Rinus Michels", "Arrigo Sacchi", "Bill Shankly", "Bob Paisley", "Brian Clough", "Johan Cruyff", "Vicente del Bosque", "Ottmar Hitzfeld", "Fabio Capello", "Helenio Herrera", "Diego Simeone", "Louis van Gaal", "José Villalonga", "Valeriy Lobanovskyi"],
    slugs: ["sir-alex-ferguson", "pep-guardiola", "carlo-ancelotti", "jose-mourinho", "jurgen-klopp", "arsene-wenger", "rinus-michels", "arrigo-sacchi", "bill-shankly", "bob-paisley", "brian-clough", "johan-cruyff-2", "vicente-del-bosque", "ottmar-hitzfeld", "fabio-capello", "helenio-herrera", "diego-simeone", "louis-van-gaal", "jose-villalonga", "valeriy-lobanovskyi"]
  },
  {
    slug: "greatest-football-club", name: "Greatest Football Club", group: "Football",
    people: ["Real Madrid", "FC Barcelona", "Manchester United", "Bayern Munich", "Liverpool", "AC Milan", "Manchester City", "Juventus", "Ajax", "Inter Milan", "Arsenal", "Benfica", "Chelsea", "Boca Juniors", "River Plate", "Santos", "Flamengo", "Borussia Dortmund", "Atlético Madrid", "Paris Saint-Germain"],
    slugs: ["real-madrid", "fc-barcelona", "manchester-united", "bayern-munich", "liverpool", "ac-milan", "manchester-city", "juventus", "ajax", "inter-milan", "arsenal", "benfica", "chelsea", "boca-juniors", "river-plate", "santos", "flamengo", "borussia-dortmund", "atletico-madrid", "paris-saint-germain"]
  },
  {
    slug: "greatest-goalkeeper", name: "Greatest Goalkeeper", group: "Football",
    people: ["Lev Yashin", "Gianluigi Buffon", "Manuel Neuer", "Iker Casillas", "Peter Schmeichel", "Dino Zoff", "Gordon Banks", "Oliver Kahn", "Edwin van der Sar", "Petr Čech", "Alisson Becker", "Thibaut Courtois", "Peter Shilton", "José Luis Chilavert", "Sepp Maier", "Walter Zenga", "René Higuita", "Claudio Taffarel", "Dida", "Emiliano Martínez"],
    slugs: ["lev-yashin", "gianluigi-buffon", "manuel-neuer", "iker-casillas", "peter-schmeichel", "dino-zoff", "gordon-banks", "oliver-kahn", "edwin-van-der-sar", "petr-cech", "alisson-becker", "thibaut-courtois", "peter-shilton", "jose-luis-chilavert", "sepp-maier", "walter-zenga", "rene-higuita", "claudio-taffarel", "dida", "emiliano-martinez"]
  },
  {
    slug: "greatest-batsman", name: "Greatest Batsman", group: "Cricket",
    people: ["Don Bradman", "Sachin Tendulkar", "Virat Kohli", "Brian Lara", "Viv Richards", "Ricky Ponting", "Kumar Sangakkara", "Sunil Gavaskar", "Steve Smith", "AB de Villiers", "Jacques Kallis", "Rahul Dravid", "Kane Williamson", "Joe Root", "Mahela Jayawardene", "Inzamam-ul-Haq", "Rohit Sharma", "Matthew Hayden", "Allan Border", "Graham Gooch"],
    slugs: ["don-bradman", "sachin-tendulkar", "virat-kohli", "brian-lara", "viv-richards", "ricky-ponting", "kumar-sangakkara", "sunil-gavaskar", "steve-smith", "ab-de-villiers", "jacques-kallis", "rahul-dravid", "kane-williamson", "joe-root", "mahela-jayawardene", "inzamam-ul-haq", "rohit-sharma", "matthew-hayden", "allan-border", "graham-gooch"]
  },
  {
    slug: "greatest-bowler", name: "Greatest Bowler", group: "Cricket",
    people: ["Muttiah Muralitharan", "Shane Warne", "Wasim Akram", "Glenn McGrath", "Malcolm Marshall", "Dale Steyn", "Richard Hadlee", "Curtly Ambrose", "Waqar Younis", "Anil Kumble", "James Anderson", "Dennis Lillee", "Imran Khan", "Shaun Pollock", "Courtney Walsh", "Brett Lee", "Jasprit Bumrah", "Ravichandran Ashwin", "Allan Donald", "Kapil Dev"],
    slugs: ["muttiah-muralitharan", "shane-warne", "wasim-akram", "glenn-mcgrath", "malcolm-marshall", "dale-steyn", "richard-hadlee", "curtly-ambrose", "waqar-younis", "anil-kumble", "james-anderson", "dennis-lillee", "imran-khan", "shaun-pollock", "courtney-walsh", "brett-lee", "jasprit-bumrah", "ravichandran-ashwin", "allan-donald", "kapil-dev"]
  },
  {
    slug: "greatest-all-rounder", name: "Greatest All-Rounder", group: "Cricket",
    people: ["Jacques Kallis", "Garry Sobers", "Imran Khan", "Kapil Dev", "Ian Botham", "Richard Hadlee", "Ravindra Jadeja", "Shakib Al Hasan", "Ben Stokes", "Keith Miller", "Shane Watson", "Andrew Flintoff", "Sanath Jayasuriya", "Chris Cairns", "Shaun Pollock", "Lance Klusener", "Vinoo Mankad", "Ravichandran Ashwin", "Moeen Ali", "Abdul Razzaq"],
    slugs: ["jacques-kallis-2", "garry-sobers", "imran-khan-2", "kapil-dev-2", "ian-botham", "richard-hadlee-2", "ravindra-jadeja", "shakib-al-hasan", "ben-stokes", "keith-miller", "shane-watson", "andrew-flintoff", "sanath-jayasuriya", "chris-cairns", "shaun-pollock-2", "lance-klusener", "vinoo-mankad", "ravichandran-ashwin-2", "moeen-ali", "abdul-razzaq"]
  },
  {
    slug: "greatest-cricket-captain", name: "Greatest Cricket Captain", group: "Cricket",
    people: ["Ricky Ponting", "MS Dhoni", "Steve Waugh", "Graeme Smith", "Clive Lloyd", "Imran Khan", "Virat Kohli", "Stephen Fleming", "Allan Border", "Kapil Dev", "Eoin Morgan", "Mahela Jayawardene", "Sourav Ganguly", "Hansie Cronje", "Michael Clarke", "Kane Williamson", "Steve Smith", "Pat Cummins", "Arjuna Ranatunga", "Misbah-ul-Haq"],
    slugs: ["ricky-ponting-2", "ms-dhoni", "steve-waugh", "graeme-smith", "clive-lloyd", "imran-khan-3", "virat-kohli-2", "stephen-fleming", "allan-border-2", "kapil-dev-3", "eoin-morgan", "mahela-jayawardene-2", "sourav-ganguly", "hansie-cronje", "michael-clarke", "kane-williamson-2", "steve-smith-2", "pat-cummins", "arjuna-ranatunga", "misbah-ul-haq"]
  },
  {
    slug: "greatest-ipl-player", name: "Greatest IPL Player", group: "Cricket",
    people: ["Virat Kohli", "MS Dhoni", "Rohit Sharma", "AB de Villiers", "Chris Gayle", "Suresh Raina", "Jasprit Bumrah", "Lasith Malinga", "Andre Russell", "Rashid Khan", "Kieron Pollard", "David Warner", "Sunil Narine", "Ravindra Jadeja", "Hardik Pandya", "KL Rahul", "Shubman Gill", "Jos Buttler", "Yuzvendra Chahal", "Dwayne Bravo"],
    slugs: ["virat-kohli-3", "ms-dhoni-2", "rohit-sharma-2", "ab-de-villiers-2", "chris-gayle", "suresh-raina", "jasprit-bumrah-2", "lasith-malinga", "andre-russell", "rashid-khan", "kieron-pollard", "david-warner", "sunil-narine", "ravindra-jadeja-2", "hardik-pandya", "kl-rahul", "shubman-gill", "jos-buttler", "yuzvendra-chahal", "dwayne-bravo"]
  },
  {
    slug: "greatest-wicketkeeper", name: "Greatest Wicketkeeper", group: "Cricket",
    people: ["MS Dhoni", "Adam Gilchrist", "Kumar Sangakkara", "Mark Boucher", "Ian Healy", "Rodney Marsh", "Andy Flower", "Brendon McCullum", "Alec Stewart", "Rishabh Pant", "Quinton de Kock", "Jos Buttler", "Syed Kirmani", "Jeff Dujon", "Dinesh Karthik", "Les Ames", "Jonny Bairstow", "Tim Paine", "Sarah Taylor", "Nayan Mongia"],
    slugs: ["ms-dhoni-3", "adam-gilchrist", "kumar-sangakkara-2", "mark-boucher", "ian-healy", "rodney-marsh", "andy-flower", "brendon-mccullum", "alec-stewart", "rishabh-pant", "quinton-de-kock", "jos-buttler-2", "syed-kirmani", "jeff-dujon", "dinesh-karthik", "les-ames", "jonny-bairstow", "tim-paine", "sarah-taylor", "nayan-mongia"]
  },
  {
    slug: "greatest-basketball-player", name: "Greatest Basketball Player", group: "Basketball",
    people: ["Michael Jordan", "LeBron James", "Kareem Abdul-Jabbar", "Bill Russell", "Magic Johnson", "Larry Bird", "Wilt Chamberlain", "Kobe Bryant", "Shaquille O'Neal", "Tim Duncan", "Stephen Curry", "Hakeem Olajuwon", "Oscar Robertson", "Kevin Durant", "Nikola Jokić", "Giannis Antetokounmpo", "Jerry West", "Moses Malone", "Karl Malone", "Julius Erving"],
    slugs: ["michael-jordan", "lebron-james", "kareem-abdul-jabbar", "bill-russell", "magic-johnson", "larry-bird", "wilt-chamberlain", "kobe-bryant", "shaquille-o-neal", "tim-duncan", "stephen-curry", "hakeem-olajuwon", "oscar-robertson", "kevin-durant", "nikola-jokic", "giannis-antetokounmpo", "jerry-west", "moses-malone", "karl-malone", "julius-erving"]
  },
  {
    slug: "greatest-basketball-team", name: "Greatest Basketball Team", group: "Basketball",
    people: ["1996 Chicago Bulls", "2017 Golden State Warriors", "1986 Boston Celtics", "1987 Los Angeles Lakers", "2001 Los Angeles Lakers", "1991 Chicago Bulls", "2014 San Antonio Spurs", "1983 Philadelphia 76ers", "2004 Detroit Pistons", "2015 Golden State Warriors", "2000 Los Angeles Lakers", "1965 Boston Celtics", "1971 Milwaukee Bucks", "2013 Miami Heat", "2016 Cleveland Cavaliers", "1999 San Antonio Spurs", "1980 Los Angeles Lakers", "1977 Portland Trail Blazers", "2008 Boston Celtics", "2024 Boston Celtics"],
    slugs: ["1996-chicago-bulls", "2017-golden-state-warriors", "1986-boston-celtics", "1987-los-angeles-lakers", "2001-los-angeles-lakers", "1991-chicago-bulls", "2014-san-antonio-spurs", "1983-philadelphia-76ers", "2004-detroit-pistons", "2015-golden-state-warriors", "2000-los-angeles-lakers", "1965-boston-celtics", "1971-milwaukee-bucks", "2013-miami-heat", "2016-cleveland-cavaliers", "1999-san-antonio-spurs", "1980-los-angeles-lakers", "1977-portland-trail-blazers", "2008-boston-celtics", "2024-boston-celtics"]
  },
  {
    slug: "greatest-male-tennis-player", name: "Greatest Male Tennis Player", group: "Tennis",
    people: ["Novak Djokovic", "Roger Federer", "Rafael Nadal", "Rod Laver", "Björn Borg", "Pete Sampras", "Carlos Alcaraz", "Andre Agassi", "John McEnroe", "Ivan Lendl", "Jimmy Connors", "Roy Emerson", "Ken Rosewall", "Boris Becker", "Stefan Edberg", "Mats Wilander", "Guillermo Vilas", "Andy Murray", "John Newcombe", "Arthur Ashe"],
    slugs: ["novak-djokovic", "roger-federer", "rafael-nadal", "rod-laver", "bjorn-borg", "pete-sampras", "carlos-alcaraz", "andre-agassi", "john-mcenroe", "ivan-lendl", "jimmy-connors", "roy-emerson", "ken-rosewall", "boris-becker", "stefan-edberg", "mats-wilander", "guillermo-vilas", "andy-murray", "john-newcombe", "arthur-ashe"]
  },
  {
    slug: "greatest-female-tennis-player", name: "Greatest Female Tennis Player", group: "Tennis",
    people: ["Serena Williams", "Steffi Graf", "Martina Navratilova", "Margaret Court", "Chris Evert", "Billie Jean King", "Monica Seles", "Venus Williams", "Martina Hingis", "Justine Henin", "Evonne Goolagong Cawley", "Maria Sharapova", "Iga Świątek", "Naomi Osaka", "Lindsay Davenport", "Helen Wills Moody", "Suzanne Lenglen", "Ashleigh Barty", "Amélie Mauresmo", "Simona Halep"],
    slugs: ["serena-williams", "steffi-graf", "martina-navratilova", "margaret-court", "chris-evert", "billie-jean-king", "monica-seles", "venus-williams", "martina-hingis", "justine-henin", "evonne-goolagong-cawley", "maria-sharapova", "iga-swiatek", "naomi-osaka", "lindsay-davenport", "helen-wills-moody", "suzanne-lenglen", "ashleigh-barty", "amelie-mauresmo", "simona-halep"]
  },
  {
    slug: "greatest-boxer", name: "Greatest Boxer", group: "Combat",
    people: ["Muhammad Ali", "Sugar Ray Robinson", "Floyd Mayweather Jr.", "Mike Tyson", "Manny Pacquiao", "Joe Louis", "Sugar Ray Leonard", "Roberto Durán", "Henry Armstrong", "Rocky Marciano", "George Foreman", "Jack Dempsey", "Julio César Chávez", "Marvin Hagler", "Joe Frazier", "Lennox Lewis", "Oscar De La Hoya", "Bernard Hopkins", "Roy Jones Jr.", "Evander Holyfield"],
    slugs: ["muhammad-ali", "sugar-ray-robinson", "floyd-mayweather-jr", "mike-tyson", "manny-pacquiao", "joe-louis", "sugar-ray-leonard", "roberto-duran", "henry-armstrong", "rocky-marciano", "george-foreman", "jack-dempsey", "julio-cesar-chavez", "marvin-hagler", "joe-frazier", "lennox-lewis", "oscar-de-la-hoya", "bernard-hopkins", "roy-jones-jr", "evander-holyfield"]
  },
  {
    slug: "greatest-mma-fighter", name: "Greatest MMA Fighter", group: "Combat",
    people: ["Jon Jones", "Georges St-Pierre", "Anderson Silva", "Demetrious Johnson", "Khabib Nurmagomedov", "Amanda Nunes", "Fedor Emelianenko", "José Aldo", "Stipe Miocic", "Daniel Cormier", "Islam Makhachev", "Valentina Shevchenko", "Alexander Volkanovski", "Israel Adesanya", "Kamaru Usman", "Conor McGregor", "Ronda Rousey", "Max Holloway", "Chuck Liddell", "Randy Couture"],
    slugs: ["jon-jones", "georges-st-pierre", "anderson-silva", "demetrious-johnson", "khabib-nurmagomedov", "amanda-nunes", "fedor-emelianenko", "jose-aldo", "stipe-miocic", "daniel-cormier", "islam-makhachev", "valentina-shevchenko", "alexander-volkanovski", "israel-adesanya", "kamaru-usman", "conor-mcgregor", "ronda-rousey", "max-holloway", "chuck-liddell", "randy-couture"]
  },
  {
    slug: "greatest-wrestler", name: "Greatest Wrestler", group: "Combat",
    people: ["Stone Cold Steve Austin", "The Rock", "The Undertaker", "Hulk Hogan", "John Cena", "Shawn Michaels", "Ric Flair", "Bret Hart", "Triple H", "Eddie Guerrero", "Chris Jericho", "Kurt Angle", "Brock Lesnar", "André the Giant", "Randy Savage", "Rey Mysterio", "Roman Reigns", "CM Punk", "Mick Foley", "Bruno Sammartino"],
    slugs: ["stone-cold-steve-austin", "the-rock", "the-undertaker", "hulk-hogan", "john-cena", "shawn-michaels", "ric-flair", "bret-hart", "triple-h", "eddie-guerrero", "chris-jericho", "kurt-angle", "brock-lesnar", "andre-the-giant", "randy-savage", "rey-mysterio", "roman-reigns", "cm-punk", "mick-foley", "bruno-sammartino"]
  },
  {
    slug: "greatest-f1-driver", name: "Greatest F1 Driver", group: "Motorsport",
    people: ["Lewis Hamilton", "Michael Schumacher", "Ayrton Senna", "Juan Manuel Fangio", "Alain Prost", "Max Verstappen", "Sebastian Vettel", "Jackie Stewart", "Niki Lauda", "Jim Clark", "Fernando Alonso", "Nigel Mansell", "Nelson Piquet", "Alberto Ascari", "Stirling Moss", "Mika Häkkinen", "Graham Hill", "Jack Brabham", "Kimi Räikkönen", "Emerson Fittipaldi"],
    slugs: ["lewis-hamilton", "michael-schumacher", "ayrton-senna", "juan-manuel-fangio", "alain-prost", "max-verstappen", "sebastian-vettel", "jackie-stewart", "niki-lauda", "jim-clark", "fernando-alonso", "nigel-mansell", "nelson-piquet", "alberto-ascari", "stirling-moss", "mika-hakkinen", "graham-hill", "jack-brabham", "kimi-raikkonen", "emerson-fittipaldi"]
  },
  {
    slug: "greatest-f1-team", name: "Greatest F1 Team", group: "Motorsport",
    people: ["Ferrari", "McLaren", "Mercedes", "Red Bull Racing", "Williams", "Team Lotus", "Brabham", "Renault", "Tyrrell", "Benetton", "Cooper", "Brawn GP", "Jordan", "Alfa Romeo", "Maserati", "BMW Sauber", "BAR", "Ligier", "Racing Point", "Force India"],
    slugs: ["ferrari", "mclaren", "mercedes", "red-bull-racing", "williams", "team-lotus", "brabham", "renault", "tyrrell", "benetton", "cooper", "brawn-gp", "jordan", "alfa-romeo", "maserati", "bmw-sauber", "bar", "ligier", "racing-point", "force-india"]
  },
  {
    slug: "greatest-motogp-rider", name: "Greatest MotoGP Rider", group: "Motorsport",
    people: ["Valentino Rossi", "Giacomo Agostini", "Marc Márquez", "Casey Stoner", "Mick Doohan", "Jorge Lorenzo", "Dani Pedrosa", "Mike Hailwood", "Wayne Rainey", "Eddie Lawson", "Kevin Schwantz", "Kenny Roberts", "Phil Read", "John Surtees", "Francesco Bagnaia", "Álex Crivillé", "Freddie Spencer", "Max Biaggi", "Ángel Nieto", "Nicky Hayden"],
    slugs: ["valentino-rossi", "giacomo-agostini", "marc-marquez", "casey-stoner", "mick-doohan", "jorge-lorenzo", "dani-pedrosa", "mike-hailwood", "wayne-rainey", "eddie-lawson", "kevin-schwantz", "kenny-roberts", "phil-read", "john-surtees", "francesco-bagnaia", "alex-criville", "freddie-spencer", "max-biaggi", "angel-nieto", "nicky-hayden"]
  },
  {
    slug: "greatest-track-athlete", name: "Greatest Track Athlete", group: "Sport",
    people: ["Usain Bolt", "Carl Lewis", "Jesse Owens", "Michael Johnson", "Florence Griffith-Joyner", "Allyson Felix", "Jackie Joyner-Kersee", "Haile Gebrselassie", "Mo Farah", "Eliud Kipchoge", "Emil Zátopek", "Shelly-Ann Fraser-Pryce", "Yohan Blake", "Wayde van Niekerk", "Cathy Freeman", "Sifan Hassan", "Hicham El Guerrouj", "Wilma Rudolph", "Daley Thompson", "Armand Duplantis"],
    slugs: ["usain-bolt", "carl-lewis", "jesse-owens", "michael-johnson", "florence-griffith-joyner", "allyson-felix", "jackie-joyner-kersee", "haile-gebrselassie", "mo-farah", "eliud-kipchoge", "emil-zatopek", "shelly-ann-fraser-pryce", "yohan-blake", "wayde-van-niekerk", "cathy-freeman", "sifan-hassan", "hicham-el-guerrouj", "wilma-rudolph", "daley-thompson", "armand-duplantis"]
  },
  {
    slug: "greatest-swimmer", name: "Greatest Swimmer", group: "Sport",
    people: ["Michael Phelps", "Mark Spitz", "Katie Ledecky", "Ryan Lochte", "Ian Thorpe", "Kristin Otto", "Matt Biondi", "Dara Torres", "Janet Evans", "Natalie Coughlin", "Johnny Weissmuller", "Dawn Fraser", "Missy Franklin", "Caeleb Dressel", "Simone Manuel", "Inge de Bruijn", "Adam Peaty", "Sarah Sjöström", "Sun Yang", "Federica Pellegrini"],
    slugs: ["michael-phelps", "mark-spitz", "katie-ledecky", "ryan-lochte", "ian-thorpe", "kristin-otto", "matt-biondi", "dara-torres", "janet-evans", "natalie-coughlin", "johnny-weissmuller", "dawn-fraser", "missy-franklin", "caeleb-dressel", "simone-manuel", "inge-de-bruijn", "adam-peaty", "sarah-sjostrom", "sun-yang", "federica-pellegrini"]
  },
  {
    slug: "greatest-golfer", name: "Greatest Golfer", group: "Sport",
    people: ["Jack Nicklaus", "Tiger Woods", "Ben Hogan", "Arnold Palmer", "Gary Player", "Bobby Jones", "Sam Snead", "Walter Hagen", "Byron Nelson", "Tom Watson", "Phil Mickelson", "Seve Ballesteros", "Rory McIlroy", "Greg Norman", "Gene Sarazen", "Lee Trevino", "Nick Faldo", "Bobby Locke", "Annika Sörenstam", "Ben Crenshaw"],
    slugs: ["jack-nicklaus", "tiger-woods", "ben-hogan", "arnold-palmer", "gary-player", "bobby-jones", "sam-snead", "walter-hagen", "byron-nelson", "tom-watson", "phil-mickelson", "seve-ballesteros", "rory-mcilroy", "greg-norman", "gene-sarazen", "lee-trevino", "nick-faldo", "bobby-locke", "annika-sorenstam", "ben-crenshaw"]
  },
  {
    slug: "greatest-hockey-player", name: "Greatest Hockey Player", group: "Sport",
    people: ["Wayne Gretzky", "Mario Lemieux", "Bobby Orr", "Gordie Howe", "Sidney Crosby", "Alexander Ovechkin", "Maurice Richard", "Jean Béliveau", "Patrick Roy", "Nicklas Lidström", "Mark Messier", "Jaromír Jágr", "Steve Yzerman", "Dominik Hašek", "Guy Lafleur", "Bobby Hull", "Phil Esposito", "Ray Bourque", "Martin Brodeur", "Teemu Selänne"],
    slugs: ["wayne-gretzky", "mario-lemieux", "bobby-orr", "gordie-howe", "sidney-crosby", "alexander-ovechkin", "maurice-richard", "jean-beliveau", "patrick-roy", "nicklas-lidstrom", "mark-messier", "jaromir-jagr", "steve-yzerman", "dominik-hasek", "guy-lafleur", "bobby-hull", "phil-esposito", "ray-bourque", "martin-brodeur", "teemu-selanne"]
  },
  {
    slug: "greatest-gymnast", name: "Greatest Gymnast", group: "Sport",
    people: ["Simone Biles", "Nadia Comăneci", "Larisa Latynina", "Kohei Uchimura", "Vitaly Scherbo", "Mary Lou Retton", "Olga Korbut", "Suni Lee", "Shannon Miller", "Max Whitlock", "Gabby Douglas", "Alexei Nemov", "Epke Zonderland", "Svetlana Khorkina", "Ágnes Keleti", "Vera Čáslavská", "Rebeca Andrade", "Nastia Liukin", "Bart Conner", "Aly Raisman"],
    slugs: ["simone-biles", "nadia-comaneci", "larisa-latynina", "kohei-uchimura", "vitaly-scherbo", "mary-lou-retton", "olga-korbut", "suni-lee", "shannon-miller", "max-whitlock", "gabby-douglas", "alexei-nemov", "epke-zonderland", "svetlana-khorkina", "agnes-keleti", "vera-caslavska", "rebeca-andrade", "nastia-liukin", "bart-conner", "aly-raisman"]
  },
  {
    slug: "greatest-cyclist", name: "Greatest Cyclist", group: "Sport",
    people: ["Eddy Merckx", "Tadej Pogačar", "Bernard Hinault", "Jacques Anquetil", "Miguel Induráin", "Chris Froome", "Fausto Coppi", "Gino Bartali", "Greg LeMond", "Peter Sagan", "Sean Kelly", "Alberto Contador", "Tom Boonen", "Fabian Cancellara", "Mark Cavendish", "Marianne Vos", "Jeannie Longo", "Annemiek van Vleuten", "Alejandro Valverde", "Vincenzo Nibali"],
    slugs: ["eddy-merckx", "tadej-pogacar", "bernard-hinault", "jacques-anquetil", "miguel-indurain", "chris-froome", "fausto-coppi", "gino-bartali", "greg-lemond", "peter-sagan", "sean-kelly", "alberto-contador", "tom-boonen", "fabian-cancellara", "mark-cavendish", "marianne-vos", "jeannie-longo", "annemiek-van-vleuten", "alejandro-valverde", "vincenzo-nibali"]
  },
  {
    slug: "greatest-chess-player", name: "Greatest Chess Player", group: "Mind sports",
    people: ["Garry Kasparov", "Magnus Carlsen", "Bobby Fischer", "Anatoly Karpov", "José Raúl Capablanca", "Emanuel Lasker", "Mikhail Tal", "Viswanathan Anand", "Alexander Alekhine", "Vladimir Kramnik", "Paul Morphy", "Hikaru Nakamura", "Fabiano Caruana", "Judit Polgár", "Ding Liren", "Tigran Petrosian", "Mikhail Botvinnik", "Wesley So", "Viktor Korchnoi", "Boris Spassky"],
    slugs: ["garry-kasparov", "magnus-carlsen", "bobby-fischer", "anatoly-karpov", "jose-raul-capablanca", "emanuel-lasker", "mikhail-tal", "viswanathan-anand", "alexander-alekhine", "vladimir-kramnik", "paul-morphy", "hikaru-nakamura", "fabiano-caruana", "judit-polgar", "ding-liren", "tigran-petrosian", "mikhail-botvinnik", "wesley-so", "viktor-korchnoi", "boris-spassky"]
  },
  {
    slug: "greatest-esports-player", name: "Greatest Esports Player", group: "Mind sports",
    people: ["Faker", "s1mple", "N0tail", "Flash", "Daigo Umehara", "ZywOo", "Dendi", "Uzi", "coldzera", "Maru", "Scump", "SonicFox", "Mango", "Jaedong", "Bugha", "Caps", "ShowMaker", "Ninja", "GeT_RiGhT", "KuroKy"],
    slugs: ["faker", "s1mple", "n0tail", "flash", "daigo-umehara", "zywoo", "dendi", "uzi", "coldzera", "maru", "scump", "sonicfox", "mango", "jaedong", "bugha", "caps", "showmaker", "ninja", "get-right", "kuroky"]
  },
  {
    slug: "greatest-poker-player", name: "Greatest Poker Player", group: "Mind sports",
    people: ["Phil Ivey", "Doyle Brunson", "Daniel Negreanu", "Phil Hellmuth", "Stu Ungar", "Johnny Chan", "Erik Seidel", "Fedor Holz", "Tom Dwan", "Justin Bonomo", "Bryn Kenney", "Chip Reese", "Vanessa Selbst", "Chris Moneymaker", "Patrik Antonius", "Barry Greenstein", "Gus Hansen", "Dan Smith", "Stephen Chidwick", "Dan Harrington"],
    slugs: ["phil-ivey", "doyle-brunson", "daniel-negreanu", "phil-hellmuth", "stu-ungar", "johnny-chan", "erik-seidel", "fedor-holz", "tom-dwan", "justin-bonomo", "bryn-kenney", "chip-reese", "vanessa-selbst", "chris-moneymaker", "patrik-antonius", "barry-greenstein", "gus-hansen", "dan-smith", "stephen-chidwick", "dan-harrington"]
  },
  {
    slug: "greatest-hollywood-actor", name: "Greatest Hollywood Actor", group: "Screen",
    people: ["Marlon Brando", "Robert De Niro", "Daniel Day-Lewis", "Jack Nicholson", "Al Pacino", "Leonardo DiCaprio", "Tom Hanks", "Denzel Washington", "Dustin Hoffman", "Anthony Hopkins", "Joaquin Phoenix", "Paul Newman", "Humphrey Bogart", "James Stewart", "Christian Bale", "Gary Oldman", "Philip Seymour Hoffman", "Morgan Freeman", "Sidney Poitier", "Heath Ledger"],
    slugs: ["marlon-brando", "robert-de-niro", "daniel-day-lewis", "jack-nicholson", "al-pacino", "leonardo-dicaprio", "tom-hanks", "denzel-washington", "dustin-hoffman", "anthony-hopkins", "joaquin-phoenix", "paul-newman", "humphrey-bogart", "james-stewart", "christian-bale", "gary-oldman", "philip-seymour-hoffman", "morgan-freeman", "sidney-poitier", "heath-ledger"]
  },
  {
    slug: "greatest-hollywood-actress", name: "Greatest Hollywood Actress", group: "Screen",
    people: ["Meryl Streep", "Katharine Hepburn", "Cate Blanchett", "Elizabeth Taylor", "Audrey Hepburn", "Viola Davis", "Frances McDormand", "Ingrid Bergman", "Bette Davis", "Jodie Foster", "Julianne Moore", "Nicole Kidman", "Natalie Portman", "Charlize Theron", "Michelle Yeoh", "Olivia de Havilland", "Vivien Leigh", "Jessica Chastain", "Saoirse Ronan", "Sigourney Weaver"],
    slugs: ["meryl-streep", "katharine-hepburn", "cate-blanchett", "elizabeth-taylor", "audrey-hepburn", "viola-davis", "frances-mcdormand", "ingrid-bergman", "bette-davis", "jodie-foster", "julianne-moore", "nicole-kidman", "natalie-portman", "charlize-theron", "michelle-yeoh", "olivia-de-havilland", "vivien-leigh", "jessica-chastain", "saoirse-ronan", "sigourney-weaver"]
  },
  {
    slug: "greatest-bollywood-actor", name: "Greatest Bollywood Actor", group: "Screen",
    people: ["Amitabh Bachchan", "Shah Rukh Khan", "Dilip Kumar", "Aamir Khan", "Raj Kapoor", "Naseeruddin Shah", "Irrfan Khan", "Ranbir Kapoor", "Manoj Bajpayee", "Hrithik Roshan", "Akshay Kumar", "Anil Kapoor", "Rajkummar Rao", "Dharmendra", "Dev Anand", "Kamal Haasan", "Nawazuddin Siddiqui", "Sunny Deol", "Pankaj Tripathi", "Ranveer Singh"],
    slugs: ["amitabh-bachchan", "shah-rukh-khan", "dilip-kumar", "aamir-khan", "raj-kapoor", "naseeruddin-shah", "irrfan-khan", "ranbir-kapoor", "manoj-bajpayee", "hrithik-roshan", "akshay-kumar", "anil-kapoor", "rajkummar-rao", "dharmendra", "dev-anand", "kamal-haasan", "nawazuddin-siddiqui", "sunny-deol", "pankaj-tripathi", "ranveer-singh"]
  },
  {
    slug: "greatest-bollywood-actress", name: "Greatest Bollywood Actress", group: "Screen",
    people: ["Madhubala", "Sridevi", "Madhuri Dixit", "Nargis", "Meena Kumari", "Rekha", "Shabana Azmi", "Tabu", "Deepika Padukone", "Priyanka Chopra Jonas", "Kajol", "Waheeda Rehman", "Nutan", "Smita Patil", "Alia Bhatt", "Kareena Kapoor Khan", "Hema Malini", "Vidya Balan", "Rani Mukerji", "Aishwarya Rai Bachchan"],
    slugs: ["madhubala", "sridevi", "madhuri-dixit", "nargis", "meena-kumari", "rekha", "shabana-azmi", "tabu", "deepika-padukone", "priyanka-chopra-jonas", "kajol", "waheeda-rehman", "nutan", "smita-patil", "alia-bhatt", "kareena-kapoor-khan", "hema-malini", "vidya-balan", "rani-mukerji", "aishwarya-rai-bachchan"]
  },
  {
    slug: "greatest-korean-actor", name: "Greatest Korean Actor", group: "Screen",
    people: ["Song Kang-ho", "Choi Min-sik", "Lee Byung-hun", "Ha Jung-woo", "Song Joong-ki", "Gong Yoo", "Lee Jung-jae", "Hwang Jung-min", "Park Hae-il", "Yoo Ah-in", "Ma Dong-seok", "Sol Kyung-gu", "Kim Soo-hyun", "Jung Woo-sung", "Park Seo-joon", "Choi Woo-shik", "Won Bin", "Hyun Bin", "Kim Nam-gil", "Park Bo-gum"],
    slugs: ["song-kang-ho", "choi-min-sik", "lee-byung-hun", "ha-jung-woo", "song-joong-ki", "gong-yoo", "lee-jung-jae", "hwang-jung-min", "park-hae-il", "yoo-ah-in", "ma-dong-seok", "sol-kyung-gu", "kim-soo-hyun", "jung-woo-sung", "park-seo-joon", "choi-woo-shik", "won-bin", "hyun-bin", "kim-nam-gil", "park-bo-gum"]
  },
  {
    slug: "greatest-film-director", name: "Greatest Film Director", group: "Screen",
    people: ["Steven Spielberg", "Martin Scorsese", "Stanley Kubrick", "Alfred Hitchcock", "Akira Kurosawa", "Christopher Nolan", "Francis Ford Coppola", "Quentin Tarantino", "Ingmar Bergman", "Federico Fellini", "Satyajit Ray", "Hayao Miyazaki", "David Fincher", "Bong Joon-ho", "Denis Villeneuve", "Orson Welles", "Ridley Scott", "David Lynch", "Paul Thomas Anderson", "Jean Renoir"],
    slugs: ["steven-spielberg", "martin-scorsese", "stanley-kubrick", "alfred-hitchcock", "akira-kurosawa", "christopher-nolan", "francis-ford-coppola", "quentin-tarantino", "ingmar-bergman", "federico-fellini", "satyajit-ray", "hayao-miyazaki", "david-fincher", "bong-joon-ho", "denis-villeneuve", "orson-welles", "ridley-scott", "david-lynch", "paul-thomas-anderson", "jean-renoir"]
  },
  {
    slug: "greatest-film", name: "Greatest Film", group: "Screen",
    people: ["The Godfather", "The Shawshank Redemption", "The Godfather Part II", "Citizen Kane", "2001: A Space Odyssey", "Pulp Fiction", "Schindler's List", "The Dark Knight", "Seven Samurai", "Parasite", "Goodfellas", "Casablanca", "Apocalypse Now", "Taxi Driver", "Raging Bull", "The Lord of the Rings: The Return of the King", "Forrest Gump", "Inception", "Interstellar", "Fight Club"],
    slugs: ["the-godfather", "the-shawshank-redemption", "the-godfather-part-ii", "citizen-kane", "2001-a-space-odyssey", "pulp-fiction", "schindler-s-list", "the-dark-knight", "seven-samurai", "parasite", "goodfellas", "casablanca", "apocalypse-now", "taxi-driver", "raging-bull", "the-lord-of-the-rings-the-return-of-the-king", "forrest-gump", "inception", "interstellar", "fight-club"]
  },
  {
    slug: "greatest-tv-show", name: "Greatest TV Show", group: "Screen",
    people: ["Breaking Bad", "The Sopranos", "The Wire", "Game of Thrones", "Better Call Saul", "Succession", "Mad Men", "The Simpsons", "Seinfeld", "The Office", "Friends", "Chernobyl", "True Detective", "The Twilight Zone", "Fleabag", "Dark", "Black Mirror", "The Bear", "Stranger Things", "The West Wing"],
    slugs: ["breaking-bad", "the-sopranos", "the-wire", "game-of-thrones", "better-call-saul", "succession", "mad-men", "the-simpsons", "seinfeld", "the-office", "friends", "chernobyl", "true-detective", "the-twilight-zone", "fleabag", "dark", "black-mirror", "the-bear", "stranger-things", "the-west-wing"]
  },
  {
    slug: "greatest-animated-film", name: "Greatest Animated Film", group: "Screen",
    people: ["Spirited Away", "The Lion King", "Toy Story", "WALL-E", "Spider-Man: Into the Spider-Verse", "Princess Mononoke", "Toy Story 3", "Up", "Finding Nemo", "Ratatouille", "The Incredibles", "My Neighbor Totoro", "How to Train Your Dragon", "Shrek", "Coco", "Akira", "Grave of the Fireflies", "Inside Out", "Beauty and the Beast", "The Iron Giant"],
    slugs: ["spirited-away", "the-lion-king", "toy-story", "wall-e", "spider-man-into-the-spider-verse", "princess-mononoke", "toy-story-3", "up", "finding-nemo", "ratatouille", "the-incredibles", "my-neighbor-totoro", "how-to-train-your-dragon", "shrek", "coco", "akira", "grave-of-the-fireflies", "inside-out", "beauty-and-the-beast", "the-iron-giant"]
  },
  {
    slug: "greatest-movie-villain", name: "Greatest Movie Villain", group: "Screen",
    people: ["Darth Vader", "The Joker", "Hannibal Lecter", "Voldemort", "Thanos", "Sauron", "Magneto", "Norman Bates", "Anton Chigurh", "Hans Landa", "Agent Smith", "T-1000", "Emperor Palpatine", "Scar", "Green Goblin", "Killmonger", "Nurse Ratched", "HAL 9000", "Pennywise", "Keyser Söze"],
    slugs: ["darth-vader", "the-joker", "hannibal-lecter", "voldemort", "thanos", "sauron", "magneto", "norman-bates", "anton-chigurh", "hans-landa", "agent-smith", "t-1000", "emperor-palpatine", "scar", "green-goblin", "killmonger", "nurse-ratched", "hal-9000", "pennywise", "keyser-soze"]
  },
  {
    slug: "greatest-comedian", name: "Greatest Comedian", group: "Screen",
    people: ["George Carlin", "Richard Pryor", "Dave Chappelle", "Robin Williams", "Eddie Murphy", "Bill Hicks", "Jerry Seinfeld", "Chris Rock", "Steve Martin", "Norm Macdonald", "Louis C.K.", "Mitch Hedberg", "Joan Rivers", "Don Rickles", "John Mulaney", "Bill Burr", "Ricky Gervais", "Peter Sellers", "Eddie Izzard", "Rodney Dangerfield"],
    slugs: ["george-carlin", "richard-pryor", "dave-chappelle", "robin-williams", "eddie-murphy", "bill-hicks", "jerry-seinfeld", "chris-rock", "steve-martin", "norm-macdonald", "louis-c-k", "mitch-hedberg", "joan-rivers", "don-rickles", "john-mulaney", "bill-burr", "ricky-gervais", "peter-sellers", "eddie-izzard", "rodney-dangerfield"]
  },
  {
    slug: "greatest-singer", name: "Greatest Singer", group: "Music",
    people: ["Michael Jackson", "Freddie Mercury", "Aretha Franklin", "Whitney Houston", "Elvis Presley", "Frank Sinatra", "Stevie Wonder", "Mariah Carey", "Celine Dion", "Beyoncé", "Prince", "Bob Dylan", "Ray Charles", "Marvin Gaye", "Nina Simone", "Adele", "Sam Cooke", "Tina Turner", "David Bowie", "Otis Redding"],
    slugs: ["michael-jackson", "freddie-mercury", "aretha-franklin", "whitney-houston", "elvis-presley", "frank-sinatra", "stevie-wonder", "mariah-carey", "celine-dion", "beyonce", "prince", "bob-dylan", "ray-charles", "marvin-gaye", "nina-simone", "adele", "sam-cooke", "tina-turner", "david-bowie", "otis-redding"]
  },
  {
    slug: "greatest-rapper", name: "Greatest Rapper", group: "Music",
    people: ["Tupac Shakur", "The Notorious B.I.G.", "Jay-Z", "Eminem", "Nas", "Kendrick Lamar", "Kanye West", "Lil Wayne", "Drake", "Rakim", "André 3000", "Ice Cube", "Snoop Dogg", "MF DOOM", "Lauryn Hill", "Nicki Minaj", "J. Cole", "Travis Scott", "Future", "50 Cent"],
    slugs: ["tupac-shakur", "the-notorious-b-i-g", "jay-z", "eminem", "nas", "kendrick-lamar", "kanye-west", "lil-wayne", "drake", "rakim", "andre-3000", "ice-cube", "snoop-dogg", "mf-doom", "lauryn-hill", "nicki-minaj", "j-cole", "travis-scott", "future", "50-cent"]
  },
  {
    slug: "greatest-band", name: "Greatest Band", group: "Music",
    people: ["The Beatles", "Pink Floyd", "Led Zeppelin", "Queen", "The Rolling Stones", "Nirvana", "Radiohead", "Fleetwood Mac", "The Beach Boys", "Black Sabbath", "AC/DC", "Metallica", "U2", "The Who", "Eagles", "The Doors", "The Smiths", "Red Hot Chili Peppers", "Coldplay", "Guns N' Roses"],
    slugs: ["the-beatles", "pink-floyd", "led-zeppelin", "queen", "the-rolling-stones", "nirvana", "radiohead", "fleetwood-mac", "the-beach-boys", "black-sabbath", "ac-dc", "metallica", "u2", "the-who", "eagles", "the-doors", "the-smiths", "red-hot-chili-peppers", "coldplay", "guns-n-roses"]
  },
  {
    slug: "greatest-guitarist", name: "Greatest Guitarist", group: "Music",
    people: ["Jimi Hendrix", "Eric Clapton", "Jimmy Page", "Eddie Van Halen", "Stevie Ray Vaughan", "David Gilmour", "Jeff Beck", "B.B. King", "Carlos Santana", "Slash", "Brian May", "Mark Knopfler", "Keith Richards", "Chuck Berry", "John Frusciante", "Joe Satriani", "Steve Vai", "Ritchie Blackmore", "Tom Morello", "Randy Rhoads"],
    slugs: ["jimi-hendrix", "eric-clapton", "jimmy-page", "eddie-van-halen", "stevie-ray-vaughan", "david-gilmour", "jeff-beck", "b-b-king", "carlos-santana", "slash", "brian-may", "mark-knopfler", "keith-richards", "chuck-berry", "john-frusciante", "joe-satriani", "steve-vai", "ritchie-blackmore", "tom-morello", "randy-rhoads"]
  },
  {
    slug: "greatest-drummer", name: "Greatest Drummer", group: "Music",
    people: ["John Bonham", "Neil Peart", "Buddy Rich", "Keith Moon", "Ginger Baker", "Gene Krupa", "Stewart Copeland", "Dave Grohl", "Mitch Mitchell", "Ringo Starr", "Bill Bruford", "Tony Williams", "Phil Collins", "Elvin Jones", "Lars Ulrich", "Chad Smith", "Questlove", "Terry Bozzio", "Steve Gadd", "Danny Carey"],
    slugs: ["john-bonham", "neil-peart", "buddy-rich", "keith-moon", "ginger-baker", "gene-krupa", "stewart-copeland", "dave-grohl", "mitch-mitchell", "ringo-starr", "bill-bruford", "tony-williams", "phil-collins", "elvin-jones", "lars-ulrich", "chad-smith", "questlove", "terry-bozzio", "steve-gadd", "danny-carey"]
  },
  {
    slug: "greatest-composer", name: "Greatest Composer", group: "Music",
    people: ["Johann Sebastian Bach", "Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Frédéric Chopin", "Richard Wagner", "Pyotr Tchaikovsky", "Antonio Vivaldi", "Claude Debussy", "Igor Stravinsky", "Joseph Haydn", "Franz Schubert", "Johannes Brahms", "George Frideric Handel", "Gustav Mahler", "Sergei Rachmaninoff", "Sergei Prokofiev", "Giuseppe Verdi", "Maurice Ravel", "Richard Strauss", "Gustav Holst"],
    slugs: ["johann-sebastian-bach", "ludwig-van-beethoven", "wolfgang-amadeus-mozart", "frederic-chopin", "richard-wagner", "pyotr-tchaikovsky", "antonio-vivaldi", "claude-debussy", "igor-stravinsky", "joseph-haydn", "franz-schubert", "johannes-brahms", "george-frideric-handel", "gustav-mahler", "sergei-rachmaninoff", "sergei-prokofiev", "giuseppe-verdi", "maurice-ravel", "richard-strauss", "gustav-holst"]
  },
  {
    slug: "greatest-music-producer", name: "Greatest Music Producer", group: "Music",
    people: ["Quincy Jones", "Dr. Dre", "George Martin", "Rick Rubin", "Brian Eno", "Phil Spector", "Max Martin", "Nigel Godrich", "Timbaland", "J Dilla", "Pharrell Williams", "Metro Boomin", "Danger Mouse", "Mark Ronson", "The Neptunes", "Clive Davis", "Butch Vig", "Babyface", "Finneas", "Nile Rodgers"],
    slugs: ["quincy-jones", "dr-dre", "george-martin", "rick-rubin", "brian-eno", "phil-spector", "max-martin", "nigel-godrich", "timbaland", "j-dilla", "pharrell-williams", "metro-boomin", "danger-mouse", "mark-ronson", "the-neptunes", "clive-davis", "butch-vig", "babyface", "finneas", "nile-rodgers"]
  },
  {
    slug: "greatest-dj", name: "Greatest DJ", group: "Music",
    people: ["David Guetta", "Calvin Harris", "Tiësto", "Avicii", "Martin Garrix", "Armin van Buuren", "Carl Cox", "Skrillex", "deadmau5", "Paul Oakenfold", "Fatboy Slim", "Diplo", "Eric Prydz", "Richie Hawtin", "Peggy Gou", "Charlotte de Witte", "DJ Snake", "Marshmello", "Kaskade", "Steve Aoki"],
    slugs: ["david-guetta", "calvin-harris", "tiesto", "avicii", "martin-garrix", "armin-van-buuren", "carl-cox", "skrillex", "deadmau5", "paul-oakenfold", "fatboy-slim", "diplo", "eric-prydz", "richie-hawtin", "peggy-gou", "charlotte-de-witte", "dj-snake", "marshmello", "kaskade", "steve-aoki"]
  },
  {
    slug: "greatest-album", name: "Greatest Album", group: "Music",
    people: ["The Dark Side of the Moon", "Abbey Road", "Thriller", "OK Computer", "Sgt. Pepper's Lonely Hearts Club Band", "Rumours", "To Pimp a Butterfly", "Pet Sounds", "Nevermind", "Purple Rain", "Blonde", "Illmatic", "The Miseducation of Lauryn Hill", "Kind of Blue", "Led Zeppelin IV", "What's Going On", "Back to Black", "My Beautiful Dark Twisted Fantasy", "Born to Run", "Revolver"],
    slugs: ["the-dark-side-of-the-moon", "abbey-road", "thriller", "ok-computer", "sgt-pepper-s-lonely-hearts-club-band", "rumours", "to-pimp-a-butterfly", "pet-sounds", "nevermind", "purple-rain", "blonde", "illmatic", "the-miseducation-of-lauryn-hill", "kind-of-blue", "led-zeppelin-iv", "what-s-going-on", "back-to-black", "my-beautiful-dark-twisted-fantasy", "born-to-run", "revolver"]
  },
  {
    slug: "greatest-playback-singer", name: "Greatest Playback Singer", group: "Music",
    people: ["Lata Mangeshkar", "Asha Bhosle", "Mohammed Rafi", "Kishore Kumar", "K. J. Yesudas", "S. P. Balasubrahmanyam", "Alka Yagnik", "Shreya Ghoshal", "Sonu Nigam", "Udit Narayan", "Kumar Sanu", "Geeta Dutt", "Manna Dey", "Talat Mahmood", "Kavita Krishnamurti", "Hariharan", "Arijit Singh", "Mukesh", "Hemant Kumar", "S. Janaki"],
    slugs: ["lata-mangeshkar", "asha-bhosle", "mohammed-rafi", "kishore-kumar", "k-j-yesudas", "s-p-balasubrahmanyam", "alka-yagnik", "shreya-ghoshal", "sonu-nigam", "udit-narayan", "kumar-sanu", "geeta-dutt", "manna-dey", "talat-mahmood", "kavita-krishnamurti", "hariharan", "arijit-singh", "mukesh", "hemant-kumar", "s-janaki"]
  },
  {
    slug: "greatest-k-pop-group", name: "Greatest K-pop Group", group: "Music",
    people: ["BTS", "BLACKPINK", "EXO", "BIGBANG", "Girls' Generation", "TWICE", "SEVENTEEN", "SHINee", "Red Velvet", "NewJeans", "Stray Kids", "aespa", "TVXQ", "Super Junior", "Wonder Girls", "2NE1", "IVE", "LE SSERAFIM", "NCT", "TXT"],
    slugs: ["bts", "blackpink", "exo", "bigbang", "girls-generation", "twice", "seventeen", "shinee", "red-velvet", "newjeans", "stray-kids", "aespa", "tvxq", "super-junior", "wonder-girls", "2ne1", "ive", "le-sserafim", "nct", "txt"]
  },
  {
    slug: "greatest-scientist", name: "Greatest Scientist", group: "Mind",
    people: ["Albert Einstein", "Isaac Newton", "Charles Darwin", "Marie Curie", "Galileo Galilei", "Nikola Tesla", "Stephen Hawking", "Richard Feynman", "Louis Pasteur", "James Clerk Maxwell", "Michael Faraday", "Alan Turing", "Rosalind Franklin", "Gregor Mendel", "Carl Linnaeus", "Niels Bohr", "Erwin Schrödinger", "Werner Heisenberg", "Alexander Fleming", "Jane Goodall"],
    slugs: ["albert-einstein", "isaac-newton", "charles-darwin", "marie-curie", "galileo-galilei", "nikola-tesla", "stephen-hawking", "richard-feynman", "louis-pasteur", "james-clerk-maxwell", "michael-faraday", "alan-turing", "rosalind-franklin", "gregor-mendel", "carl-linnaeus", "niels-bohr", "erwin-schrodinger", "werner-heisenberg", "alexander-fleming", "jane-goodall"]
  },
  {
    slug: "greatest-physicist", name: "Greatest Physicist", group: "Mind",
    people: ["Isaac Newton", "Albert Einstein", "James Clerk Maxwell", "Galileo Galilei", "Richard Feynman", "Niels Bohr", "Max Planck", "Michael Faraday", "Paul Dirac", "Werner Heisenberg", "Erwin Schrödinger", "Ernest Rutherford", "Enrico Fermi", "Stephen Hawking", "J. Robert Oppenheimer", "Marie Curie", "Wolfgang Pauli", "Satyendra Nath Bose", "C. V. Raman", "Subrahmanyan Chandrasekhar"],
    slugs: ["isaac-newton-2", "albert-einstein-2", "james-clerk-maxwell-2", "galileo-galilei-2", "richard-feynman-2", "niels-bohr-2", "max-planck", "michael-faraday-2", "paul-dirac", "werner-heisenberg-2", "erwin-schrodinger-2", "ernest-rutherford", "enrico-fermi", "stephen-hawking-2", "j-robert-oppenheimer", "marie-curie-2", "wolfgang-pauli", "satyendra-nath-bose", "c-v-raman", "subrahmanyan-chandrasekhar"]
  },
  {
    slug: "greatest-mathematician", name: "Greatest Mathematician", group: "Mind",
    people: ["Carl Friedrich Gauss", "Leonhard Euler", "Isaac Newton", "Euclid", "Archimedes", "Bernhard Riemann", "Srinivasa Ramanujan", "Henri Poincaré", "David Hilbert", "Kurt Gödel", "Alan Turing", "Pierre-Simon Laplace", "Évariste Galois", "Gottfried Wilhelm Leibniz", "Georg Cantor", "Emmy Noether", "John von Neumann", "Fibonacci", "Terence Tao", "Grigori Perelman"],
    slugs: ["carl-friedrich-gauss", "leonhard-euler", "isaac-newton-3", "euclid", "archimedes", "bernhard-riemann", "srinivasa-ramanujan", "henri-poincare", "david-hilbert", "kurt-godel", "alan-turing-2", "pierre-simon-laplace", "evariste-galois", "gottfried-wilhelm-leibniz", "georg-cantor", "emmy-noether", "john-von-neumann", "fibonacci", "terence-tao", "grigori-perelman"]
  },
  {
    slug: "greatest-chemist", name: "Greatest Chemist", group: "Mind",
    people: ["Antoine Lavoisier", "Dmitri Mendeleev", "Marie Curie", "Linus Pauling", "Robert Bunsen", "John Dalton", "Robert Boyle", "Humphry Davy", "Michael Faraday", "Justus von Liebig", "Alfred Nobel", "Svante Arrhenius", "August Kekulé", "Gilbert N. Lewis", "Fritz Haber", "Dorothy Hodgkin", "Glenn T. Seaborg", "Irving Langmuir", "Amedeo Avogadro", "Joseph Priestley"],
    slugs: ["antoine-lavoisier", "dmitri-mendeleev", "marie-curie-3", "linus-pauling", "robert-bunsen", "john-dalton", "robert-boyle", "humphry-davy", "michael-faraday-3", "justus-von-liebig", "alfred-nobel", "svante-arrhenius", "august-kekule", "gilbert-n-lewis", "fritz-haber", "dorothy-hodgkin", "glenn-t-seaborg", "irving-langmuir", "amedeo-avogadro", "joseph-priestley"]
  },
  {
    slug: "greatest-biologist", name: "Greatest Biologist", group: "Mind",
    people: ["Charles Darwin", "Gregor Mendel", "Louis Pasteur", "Carl Linnaeus", "James Watson", "Francis Crick", "Barbara McClintock", "E. O. Wilson", "Rachel Carson", "Jane Goodall", "Rosalind Franklin", "Ernst Mayr", "Alexander Fleming", "Theodosius Dobzhansky", "Lynn Margulis", "Richard Dawkins", "Stephen Jay Gould", "Thomas Hunt Morgan", "Edward Jenner", "Antonie van Leeuwenhoek"],
    slugs: ["charles-darwin-2", "gregor-mendel-2", "louis-pasteur-2", "carl-linnaeus-2", "james-watson", "francis-crick", "barbara-mcclintock", "e-o-wilson", "rachel-carson", "jane-goodall-2", "rosalind-franklin-2", "ernst-mayr", "alexander-fleming-2", "theodosius-dobzhansky", "lynn-margulis", "richard-dawkins", "stephen-jay-gould", "thomas-hunt-morgan", "edward-jenner", "antonie-van-leeuwenhoek"]
  },
  {
    slug: "greatest-philosopher", name: "Greatest Philosopher", group: "Mind",
    people: ["Aristotle", "Plato", "Socrates", "Immanuel Kant", "Friedrich Nietzsche", "René Descartes", "Confucius", "David Hume", "John Locke", "Karl Marx", "Søren Kierkegaard", "Jean-Paul Sartre", "Baruch Spinoza", "Thomas Aquinas", "Laozi", "Epicurus", "Marcus Aurelius", "Simone de Beauvoir", "Michel Foucault", "Ludwig Wittgenstein"],
    slugs: ["aristotle", "plato", "socrates", "immanuel-kant", "friedrich-nietzsche", "rene-descartes", "confucius", "david-hume", "john-locke", "karl-marx", "sren-kierkegaard", "jean-paul-sartre", "baruch-spinoza", "thomas-aquinas", "laozi", "epicurus", "marcus-aurelius", "simone-de-beauvoir", "michel-foucault", "ludwig-wittgenstein"]
  },
  {
    slug: "greatest-economist", name: "Greatest Economist", group: "Mind",
    people: ["Adam Smith", "John Maynard Keynes", "Milton Friedman", "David Ricardo", "Karl Marx", "Friedrich Hayek", "Joseph Schumpeter", "Amartya Sen", "Thomas Malthus", "Alfred Marshall", "Paul Samuelson", "Kenneth Arrow", "Ronald Coase", "Gary Becker", "Joseph Stiglitz", "Robert Solow", "Esther Duflo", "Robert Lucas", "Daron Acemoglu", "Joan Robinson"],
    slugs: ["adam-smith", "john-maynard-keynes", "milton-friedman", "david-ricardo", "karl-marx-2", "friedrich-hayek", "joseph-schumpeter", "amartya-sen", "thomas-malthus", "alfred-marshall", "paul-samuelson", "kenneth-arrow", "ronald-coase", "gary-becker", "joseph-stiglitz", "robert-solow", "esther-duflo", "robert-lucas", "daron-acemoglu", "joan-robinson"]
  },
  {
    slug: "greatest-inventor", name: "Greatest Inventor", group: "Mind",
    people: ["Thomas Edison", "Nikola Tesla", "Leonardo da Vinci", "Alexander Graham Bell", "James Watt", "Johannes Gutenberg", "Benjamin Franklin", "Eli Whitney", "George Stephenson", "Samuel Morse", "Guglielmo Marconi", "Orville Wright", "Wilbur Wright", "Hedy Lamarr", "James Dyson", "Garrett Morgan", "Tim Berners-Lee", "Steve Wozniak", "Charles Babbage", "Archimedes"],
    slugs: ["thomas-edison", "nikola-tesla-2", "leonardo-da-vinci", "alexander-graham-bell", "james-watt", "johannes-gutenberg", "benjamin-franklin", "eli-whitney", "george-stephenson", "samuel-morse", "guglielmo-marconi", "orville-wright", "wilbur-wright", "hedy-lamarr", "james-dyson", "garrett-morgan", "tim-berners-lee", "steve-wozniak", "charles-babbage", "archimedes-2"]
  },
  {
    slug: "greatest-astronaut", name: "Greatest Astronaut", group: "Mind",
    people: ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "Valentina Tereshkova", "John Glenn", "Chris Hadfield", "Sally Ride", "Alan Shepard", "Michael Collins", "Peggy Whitson", "Jim Lovell", "Mae Jemison", "Alexei Leonov", "Scott Kelly", "Eileen Collins", "Kalpana Chawla", "Sunita Williams", "Gene Cernan", "Frank Borman", "Rakesh Sharma"],
    slugs: ["neil-armstrong", "yuri-gagarin", "buzz-aldrin", "valentina-tereshkova", "john-glenn", "chris-hadfield", "sally-ride", "alan-shepard", "michael-collins", "peggy-whitson", "jim-lovell", "mae-jemison", "alexei-leonov", "scott-kelly", "eileen-collins", "kalpana-chawla", "sunita-williams", "gene-cernan", "frank-borman", "rakesh-sharma"]
  },
  {
    slug: "greatest-novelist", name: "Greatest Novelist", group: "Words",
    people: ["Leo Tolstoy", "Fyodor Dostoevsky", "William Shakespeare", "Jane Austen", "Charles Dickens", "George Orwell", "Gabriel García Márquez", "Franz Kafka", "James Joyce", "Virginia Woolf", "Ernest Hemingway", "F. Scott Fitzgerald", "Mark Twain", "Victor Hugo", "J. R. R. Tolkien", "Toni Morrison", "Haruki Murakami", "Salman Rushdie", "Kazuo Ishiguro", "Herman Melville"],
    slugs: ["leo-tolstoy", "fyodor-dostoevsky", "william-shakespeare", "jane-austen", "charles-dickens", "george-orwell", "gabriel-garcia-marquez", "franz-kafka", "james-joyce", "virginia-woolf", "ernest-hemingway", "f-scott-fitzgerald", "mark-twain", "victor-hugo", "j-r-r-tolkien", "toni-morrison", "haruki-murakami", "salman-rushdie", "kazuo-ishiguro", "herman-melville"]
  },
  {
    slug: "greatest-poet", name: "Greatest Poet", group: "Words",
    people: ["William Shakespeare", "Homer", "Dante Alighieri", "Rumi", "William Wordsworth", "John Keats", "T. S. Eliot", "Pablo Neruda", "Emily Dickinson", "Walt Whitman", "Robert Frost", "Rabindranath Tagore", "Sylvia Plath", "W. B. Yeats", "Lord Byron", "Percy Bysshe Shelley", "Mirza Ghalib", "Hafez", "Maya Angelou", "Langston Hughes"],
    slugs: ["william-shakespeare-2", "homer", "dante-alighieri", "rumi", "william-wordsworth", "john-keats", "t-s-eliot", "pablo-neruda", "emily-dickinson", "walt-whitman", "robert-frost", "rabindranath-tagore", "sylvia-plath", "w-b-yeats", "lord-byron", "percy-bysshe-shelley", "mirza-ghalib", "hafez", "maya-angelou", "langston-hughes"]
  },
  {
    slug: "greatest-playwright", name: "Greatest Playwright", group: "Words",
    people: ["William Shakespeare", "Sophocles", "Henrik Ibsen", "Anton Chekhov", "Arthur Miller", "Tennessee Williams", "George Bernard Shaw", "Oscar Wilde", "Samuel Beckett", "Eugene O'Neill", "Molière", "Bertolt Brecht", "Jean Racine", "Christopher Marlowe", "Tom Stoppard", "Harold Pinter", "Lorraine Hansberry", "August Wilson", "Kalidasa", "Euripides"],
    slugs: ["william-shakespeare-3", "sophocles", "henrik-ibsen", "anton-chekhov", "arthur-miller", "tennessee-williams", "george-bernard-shaw", "oscar-wilde", "samuel-beckett", "eugene-o-neill", "moliere", "bertolt-brecht", "jean-racine", "christopher-marlowe", "tom-stoppard", "harold-pinter", "lorraine-hansberry", "august-wilson", "kalidasa", "euripides"]
  },
  {
    slug: "greatest-book", name: "Greatest Book", group: "Words",
    people: ["Don Quixote", "War and Peace", "The Brothers Karamazov", "1984", "To Kill a Mockingbird", "The Great Gatsby", "One Hundred Years of Solitude", "The Odyssey", "The Iliad", "Crime and Punishment", "The Lord of the Rings", "Pride and Prejudice", "The Catcher in the Rye", "Brave New World", "Anna Karenina", "The Alchemist", "Harry Potter and the Philosopher's Stone", "The Little Prince", "Moby-Dick", "The Divine Comedy"],
    slugs: ["don-quixote", "war-and-peace", "the-brothers-karamazov", "1984", "to-kill-a-mockingbird", "the-great-gatsby", "one-hundred-years-of-solitude", "the-odyssey", "the-iliad", "crime-and-punishment", "the-lord-of-the-rings", "pride-and-prejudice", "the-catcher-in-the-rye", "brave-new-world", "anna-karenina", "the-alchemist", "harry-potter-and-the-philosopher-s-stone", "the-little-prince", "moby-dick", "the-divine-comedy"]
  },
  {
    slug: "greatest-us-president", name: "Greatest US President", group: "Power",
    people: ["Abraham Lincoln", "George Washington", "Franklin D. Roosevelt", "Thomas Jefferson", "Theodore Roosevelt", "Harry Truman", "Dwight D. Eisenhower", "John F. Kennedy", "Barack Obama", "Ronald Reagan", "Woodrow Wilson", "James Madison", "James Monroe", "Lyndon B. Johnson", "Bill Clinton", "John Adams", "Andrew Jackson", "Ulysses S. Grant", "Joe Biden", "Donald Trump"],
    slugs: ["abraham-lincoln", "george-washington", "franklin-d-roosevelt", "thomas-jefferson", "theodore-roosevelt", "harry-truman", "dwight-d-eisenhower", "john-f-kennedy", "barack-obama", "ronald-reagan", "woodrow-wilson", "james-madison", "james-monroe", "lyndon-b-johnson", "bill-clinton", "john-adams", "andrew-jackson", "ulysses-s-grant", "joe-biden", "donald-trump"]
  },
  {
    slug: "greatest-indian-prime-minister", name: "Greatest Indian Prime Minister", group: "Power",
    people: ["Jawaharlal Nehru", "Narendra Modi", "Indira Gandhi", "Atal Bihari Vajpayee", "Lal Bahadur Shastri", "Manmohan Singh", "P. V. Narasimha Rao", "Rajiv Gandhi", "Morarji Desai", "V. P. Singh", "Charan Singh", "H. D. Deve Gowda", "I. K. Gujral", "Chandra Shekhar", "Gulzarilal Nanda"],
    slugs: ["jawaharlal-nehru", "narendra-modi", "indira-gandhi", "atal-bihari-vajpayee", "lal-bahadur-shastri", "manmohan-singh", "p-v-narasimha-rao", "rajiv-gandhi", "morarji-desai", "v-p-singh", "charan-singh", "h-d-deve-gowda", "i-k-gujral", "chandra-shekhar", "gulzarilal-nanda"]
  },
  {
    slug: "greatest-world-leader", name: "Greatest World Leader", group: "Power",
    people: ["Abraham Lincoln", "Mahatma Gandhi", "Nelson Mandela", "Winston Churchill", "George Washington", "Franklin D. Roosevelt", "Alexander the Great", "Napoleon Bonaparte", "Genghis Khan", "Mustafa Kemal Atatürk", "Jawaharlal Nehru", "Martin Luther King Jr.", "Theodore Roosevelt", "Charles de Gaulle", "Lee Kuan Yew", "Otto von Bismarck", "Sun Yat-sen", "Deng Xiaoping", "Queen Elizabeth II", "Margaret Thatcher"],
    slugs: ["abraham-lincoln-2", "mahatma-gandhi", "nelson-mandela", "winston-churchill", "george-washington-2", "franklin-d-roosevelt-2", "alexander-the-great", "napoleon-bonaparte", "genghis-khan", "mustafa-kemal-ataturk", "jawaharlal-nehru-2", "martin-luther-king-jr", "theodore-roosevelt-2", "charles-de-gaulle", "lee-kuan-yew", "otto-von-bismarck", "sun-yat-sen", "deng-xiaoping", "queen-elizabeth-ii", "margaret-thatcher"]
  },
  {
    slug: "greatest-political-leader", name: "Greatest Political Leader", group: "Power",
    people: ["Abraham Lincoln", "Mahatma Gandhi", "Nelson Mandela", "Winston Churchill", "George Washington", "Franklin D. Roosevelt", "Jawaharlal Nehru", "Martin Luther King Jr.", "Mustafa Kemal Atatürk", "Napoleon Bonaparte", "Theodore Roosevelt", "Thomas Jefferson", "John F. Kennedy", "Margaret Thatcher", "Ronald Reagan", "Lee Kuan Yew", "Charles de Gaulle", "Indira Gandhi", "Angela Merkel", "Barack Obama"],
    slugs: ["abraham-lincoln-3", "mahatma-gandhi-2", "nelson-mandela-2", "winston-churchill-2", "george-washington-3", "franklin-d-roosevelt-3", "jawaharlal-nehru-3", "martin-luther-king-jr-2", "mustafa-kemal-ataturk-2", "napoleon-bonaparte-2", "theodore-roosevelt-3", "thomas-jefferson-2", "john-f-kennedy-2", "margaret-thatcher-2", "ronald-reagan-2", "lee-kuan-yew-2", "charles-de-gaulle-2", "indira-gandhi-2", "angela-merkel", "barack-obama-2"]
  },
  {
    slug: "greatest-statesman", name: "Greatest Statesman", group: "Power",
    people: ["Winston Churchill", "Abraham Lincoln", "George Washington", "Nelson Mandela", "Mahatma Gandhi", "Charles de Gaulle", "Otto von Bismarck", "Franklin D. Roosevelt", "Theodore Roosevelt", "Jawaharlal Nehru", "Benjamin Disraeli", "Henry Kissinger", "Klemens von Metternich", "Konrad Adenauer", "Lee Kuan Yew", "Mustafa Kemal Atatürk", "Dwight D. Eisenhower", "John F. Kennedy", "Deng Xiaoping", "Margaret Thatcher"],
    slugs: ["winston-churchill-3", "abraham-lincoln-4", "george-washington-4", "nelson-mandela-3", "mahatma-gandhi-3", "charles-de-gaulle-3", "otto-von-bismarck-2", "franklin-d-roosevelt-4", "theodore-roosevelt-4", "jawaharlal-nehru-4", "benjamin-disraeli", "henry-kissinger", "klemens-von-metternich", "konrad-adenauer", "lee-kuan-yew-3", "mustafa-kemal-ataturk-3", "dwight-d-eisenhower-2", "john-f-kennedy-3", "deng-xiaoping-2", "margaret-thatcher-3"]
  },
  {
    slug: "greatest-revolutionary", name: "Greatest Revolutionary", group: "Power",
    people: ["Mahatma Gandhi", "George Washington", "Vladimir Lenin", "Che Guevara", "Nelson Mandela", "Fidel Castro", "Simón Bolívar", "Ho Chi Minh", "Mao Zedong", "Subhas Chandra Bose", "Bhagat Singh", "Toussaint Louverture", "Sun Yat-sen", "Emiliano Zapata", "José Martí", "Maximilien Robespierre", "Thomas Jefferson", "Lech Wałęsa", "Patrick Henry", "Pancho Villa"],
    slugs: ["mahatma-gandhi-4", "george-washington-5", "vladimir-lenin", "che-guevara", "nelson-mandela-4", "fidel-castro", "simon-bolivar", "ho-chi-minh", "mao-zedong", "subhas-chandra-bose", "bhagat-singh", "toussaint-louverture", "sun-yat-sen-2", "emiliano-zapata", "jose-marti", "maximilien-robespierre", "thomas-jefferson-3", "lech-waesa", "patrick-henry", "pancho-villa"]
  },
  {
    slug: "greatest-king", name: "Greatest King", group: "Power",
    people: ["Alexander the Great", "Ashoka", "Cyrus the Great", "Charlemagne", "Akbar", "Richard the Lionheart", "Henry VIII", "Louis XIV", "Alfred the Great", "Chandragupta Maurya", "Hammurabi", "Ramses II", "Leonidas I", "William the Conqueror", "Sejong the Great", "Sargon of Akkad", "Frederick II", "Harald Hardrada", "Edward III", "Alfonso X"],
    slugs: ["alexander-the-great-2", "ashoka", "cyrus-the-great", "charlemagne", "akbar", "richard-the-lionheart", "henry-viii", "louis-xiv", "alfred-the-great", "chandragupta-maurya", "hammurabi", "ramses-ii", "leonidas-i", "william-the-conqueror", "sejong-the-great", "sargon-of-akkad", "frederick-ii", "harald-hardrada", "edward-iii", "alfonso-x"]
  },
  {
    slug: "greatest-queen", name: "Greatest Queen", group: "Power",
    people: ["Cleopatra", "Elizabeth I", "Queen Victoria", "Hatshepsut", "Catherine the Great", "Isabella I of Castile", "Wu Zetian", "Boudica", "Zenobia", "Elizabeth II", "Mary, Queen of Scots", "Nefertiti", "Eleanor of Aquitaine", "Tamar of Georgia", "Rani Lakshmibai", "Razia Sultan", "Ahmose-Nefertari", "Anne of Great Britain", "Mary I of England", "Ranavalona I"],
    slugs: ["cleopatra", "elizabeth-i", "queen-victoria", "hatshepsut", "catherine-the-great", "isabella-i-of-castile", "wu-zetian", "boudica", "zenobia", "elizabeth-ii", "mary-queen-of-scots", "nefertiti", "eleanor-of-aquitaine", "tamar-of-georgia", "rani-lakshmibai", "razia-sultan", "ahmose-nefertari", "anne-of-great-britain", "mary-i-of-england", "ranavalona-i"]
  },
  {
    slug: "greatest-monarch", name: "Greatest Monarch", group: "Power",
    people: ["Alexander the Great", "Augustus", "Ashoka", "Elizabeth I", "Akbar", "Genghis Khan", "Cyrus the Great", "Charlemagne", "Qin Shi Huang", "Louis XIV", "Queen Victoria", "Suleiman the Magnificent", "Constantine the Great", "Trajan", "Napoleon Bonaparte", "Peter the Great", "Chandragupta Maurya", "Justinian I", "Henry VIII", "Marcus Aurelius"],
    slugs: ["alexander-the-great-3", "augustus", "ashoka-2", "elizabeth-i-2", "akbar-2", "genghis-khan-2", "cyrus-the-great-2", "charlemagne-2", "qin-shi-huang", "louis-xiv-2", "queen-victoria-2", "suleiman-the-magnificent", "constantine-the-great", "trajan", "napoleon-bonaparte-3", "peter-the-great", "chandragupta-maurya-2", "justinian-i", "henry-viii-2", "marcus-aurelius-2"]
  },
  {
    slug: "greatest-emperor", name: "Greatest Emperor", group: "Power",
    people: ["Augustus", "Qin Shi Huang", "Ashoka", "Genghis Khan", "Constantine the Great", "Charlemagne", "Akbar", "Trajan", "Justinian I", "Napoleon Bonaparte", "Cyrus the Great", "Marcus Aurelius", "Chandragupta Maurya", "Kublai Khan", "Suleiman the Magnificent", "Hadrian", "Peter the Great", "Meiji", "Shah Jahan", "Hirohito"],
    slugs: ["augustus-2", "qin-shi-huang-2", "ashoka-3", "genghis-khan-3", "constantine-the-great-2", "charlemagne-3", "akbar-3", "trajan-2", "justinian-i-2", "napoleon-bonaparte-4", "cyrus-the-great-3", "marcus-aurelius-3", "chandragupta-maurya-3", "kublai-khan", "suleiman-the-magnificent-2", "hadrian", "peter-the-great-2", "meiji", "shah-jahan", "hirohito"]
  },
  {
    slug: "greatest-empress", name: "Greatest Empress", group: "Power",
    people: ["Wu Zetian", "Theodora", "Catherine the Great", "Empress Suiko", "Empress Jingu", "Maria Theresa", "Empress Dowager Cixi", "Irene of Athens", "Galla Placidia", "Pulcheria", "Zenobia", "Hatshepsut", "Amalasuntha", "Zoë Porphyrogenita", "Theophanu", "Urraca of León", "Matilda of Tuscany", "Agrippina the Younger", "Eudoxia"],
    slugs: ["wu-zetian-2", "theodora", "catherine-the-great-2", "empress-suiko", "empress-jingu", "maria-theresa", "empress-dowager-cixi", "irene-of-athens", "galla-placidia", "pulcheria", "zenobia-2", "hatshepsut-2", "amalasuntha", "zoe-porphyrogenita", "theophanu", "urraca-of-leon", "matilda-of-tuscany", "agrippina-the-younger", "eudoxia"]
  },
  {
    slug: "greatest-sultan", name: "Greatest Sultan", group: "Power",
    people: ["Suleiman the Magnificent", "Mehmed II", "Saladin", "Selim I", "Bayezid I", "Osman I", "Murad II", "Murad I", "Mahmud II", "Abdul Hamid II", "Alauddin Khalji", "Muhammad bin Tughluq", "Iltutmish", "Balban", "Sikandar Lodi", "Shah Jahan", "Aurangzeb", "Tipu Sultan", "Mahmud of Ghazni", "Firuz Shah Tughlaq"],
    slugs: ["suleiman-the-magnificent-3", "mehmed-ii", "saladin", "selim-i", "bayezid-i", "osman-i", "murad-ii", "murad-i", "mahmud-ii", "abdul-hamid-ii", "alauddin-khalji", "muhammad-bin-tughluq", "iltutmish", "balban", "sikandar-lodi", "shah-jahan-2", "aurangzeb", "tipu-sultan", "mahmud-of-ghazni", "firuz-shah-tughlaq"]
  },
  {
    slug: "greatest-pharaoh", name: "Greatest Pharaoh", group: "Power",
    people: ["Ramesses II", "Hatshepsut", "Tutankhamun", "Khufu", "Thutmose III", "Akhenaten", "Cleopatra VII", "Djoser", "Sneferu", "Amenhotep III", "Seti I", "Narmer", "Ramses III", "Pepi II", "Mentuhotep II", "Ahmose I", "Thutmose I", "Khafre", "Unas", "Psamtik I"],
    slugs: ["ramesses-ii", "hatshepsut-3", "tutankhamun", "khufu", "thutmose-iii", "akhenaten", "cleopatra-vii", "djoser", "sneferu", "amenhotep-iii", "seti-i", "narmer", "ramses-iii", "pepi-ii", "mentuhotep-ii", "ahmose-i", "thutmose-i", "khafre", "unas", "psamtik-i"]
  },
  {
    slug: "greatest-caliph", name: "Greatest Caliph", group: "Power",
    people: ["Abu Bakr", "Umar ibn al-Khattab", "Uthman ibn Affan", "Ali ibn Abi Talib", "Abd al-Malik ibn Marwan", "Harun al-Rashid", "Al-Ma'mun", "Umar II", "Mu'awiya I", "Al-Mansur", "Abd al-Rahman III", "Al-Mu'tasim", "Al-Mahdi", "Al-Mutawakkil", "Al-Mu'tamid", "Al-Muqtadir", "Al-Nasir", "Al-Hakim bi-Amr Allah", "Umar ibn Abd al-Aziz", "Al-Mustansir"],
    slugs: ["abu-bakr", "umar-ibn-al-khattab", "uthman-ibn-affan", "ali-ibn-abi-talib", "abd-al-malik-ibn-marwan", "harun-al-rashid", "al-ma-mun", "umar-ii", "mu-awiya-i", "al-mansur", "abd-al-rahman-iii", "al-mu-tasim", "al-mahdi", "al-mutawakkil", "al-mu-tamid", "al-muqtadir", "al-nasir", "al-hakim-bi-amr-allah", "umar-ibn-abd-al-aziz", "al-mustansir"]
  },
  {
    slug: "greatest-maharaja", name: "Greatest Maharaja", group: "Power",
    people: ["Chandragupta Maurya", "Ashoka", "Akbar", "Shivaji Maharaj", "Ranjit Singh", "Krishnadevaraya", "Samudragupta", "Harshavardhana", "Vikramaditya", "Raja Raja Chola I", "Rajendra Chola I", "Prithviraj Chauhan", "Maharana Pratap", "Jai Singh II", "Yashwantrao Holkar", "Sayajirao Gaekwad III", "Bhoja", "Lalitaditya Muktapida", "Baji Rao I", "Pulakeshin II"],
    slugs: ["chandragupta-maurya-4", "ashoka-4", "akbar-4", "shivaji-maharaj", "ranjit-singh", "krishnadevaraya", "samudragupta", "harshavardhana", "vikramaditya", "raja-raja-chola-i", "rajendra-chola-i", "prithviraj-chauhan", "maharana-pratap", "jai-singh-ii", "yashwantrao-holkar", "sayajirao-gaekwad-iii", "bhoja", "lalitaditya-muktapida", "baji-rao-i", "pulakeshin-ii"]
  },
  {
    slug: "greatest-roman-emperor", name: "Greatest Roman Emperor", group: "Power",
    people: ["Augustus", "Trajan", "Marcus Aurelius", "Constantine the Great", "Hadrian", "Diocletian", "Justinian I", "Aurelian", "Vespasian", "Titus", "Antoninus Pius", "Claudius", "Septimius Severus", "Theodosius I", "Nero", "Caligula", "Commodus", "Caracalla", "Julian", "Tiberius"],
    slugs: ["augustus-3", "trajan-3", "marcus-aurelius-4", "constantine-the-great-3", "hadrian-2", "diocletian", "justinian-i-3", "aurelian", "vespasian", "titus", "antoninus-pius", "claudius", "septimius-severus", "theodosius-i", "nero", "caligula", "commodus", "caracalla", "julian", "tiberius"]
  },
  {
    slug: "greatest-british-monarch", name: "Greatest British Monarch", group: "Power",
    people: ["Elizabeth I", "Queen Victoria", "William the Conqueror", "Alfred the Great", "Henry II", "Henry VII", "Elizabeth II", "Richard I", "Edward III", "Henry V", "Edward I", "James I", "George III", "William III", "Charles II", "Henry VIII", "Edward the Confessor", "Richard III", "Mary I", "George VI"],
    slugs: ["elizabeth-i-3", "queen-victoria-3", "william-the-conqueror-2", "alfred-the-great-2", "henry-ii", "henry-vii", "elizabeth-ii-2", "richard-i", "edward-iii-2", "henry-v", "edward-i", "james-i", "george-iii", "william-iii", "charles-ii", "henry-viii-3", "edward-the-confessor", "richard-iii", "mary-i", "george-vi"]
  },
  {
    slug: "greatest-french-monarch", name: "Greatest French Monarch", group: "Power",
    people: ["Charlemagne", "Louis XIV", "Napoleon Bonaparte", "Clovis I", "Philip II Augustus", "Louis IX", "Henry IV", "Francis I", "Louis XI", "Charles V", "Philip IV", "Louis XIII", "Charles VII", "Hugh Capet", "Louis VI", "Louis VII", "Charles VIII", "Francis II", "Louis XVI", "Napoleon III"],
    slugs: ["charlemagne-4", "louis-xiv-3", "napoleon-bonaparte-5", "clovis-i", "philip-ii-augustus", "louis-ix", "henry-iv", "francis-i", "louis-xi", "charles-v", "philip-iv", "louis-xiii", "charles-vii", "hugh-capet", "louis-vi", "louis-vii", "charles-viii", "francis-ii", "louis-xvi", "napoleon-iii"]
  },
  {
    slug: "greatest-chinese-emperor", name: "Greatest Chinese Emperor", group: "Power",
    people: ["Qin Shi Huang", "Han Wudi", "Tang Taizong", "Kangxi Emperor", "Yongle Emperor", "Qianlong Emperor", "Emperor Wen of Sui", "Emperor Gaozu of Tang", "Hongwu Emperor", "Xuanzong of Tang", "Guangwu Emperor", "Wu Zetian", "Taizong of Song", "Emperor Wen of Han", "Chengzu of Ming", "Shenzong of Song", "Zhengde Emperor", "Jiajing Emperor", "Xuantong Emperor"],
    slugs: ["qin-shi-huang-3", "han-wudi", "tang-taizong", "kangxi-emperor", "yongle-emperor", "qianlong-emperor", "emperor-wen-of-sui", "emperor-gaozu-of-tang", "hongwu-emperor", "xuanzong-of-tang", "guangwu-emperor", "wu-zetian-3", "taizong-of-song", "emperor-wen-of-han", "chengzu-of-ming", "shenzong-of-song", "zhengde-emperor", "jiajing-emperor", "xuantong-emperor"]
  },
  {
    slug: "greatest-japanese-emperor", name: "Greatest Japanese Emperor", group: "Power",
    people: ["Emperor Meiji", "Emperor Jimmu", "Emperor Kanmu", "Emperor Tenmu", "Emperor Go-Daigo", "Emperor Hirohito", "Emperor Taishō", "Emperor Akihito", "Emperor Go-Sanjō", "Emperor Shirakawa", "Emperor Saga", "Emperor Kōkaku", "Emperor Go-Toba", "Emperor Shōmu", "Emperor Sujin", "Emperor Uda", "Emperor Murakami", "Emperor Reigen", "Emperor Go-Mizunoo"],
    slugs: ["emperor-meiji", "emperor-jimmu", "emperor-kanmu", "emperor-tenmu", "emperor-go-daigo", "emperor-hirohito", "emperor-taisho", "emperor-akihito", "emperor-go-sanjo", "emperor-shirakawa", "emperor-saga", "emperor-kokaku", "emperor-go-toba", "emperor-shomu", "emperor-sujin", "emperor-uda", "emperor-murakami", "emperor-reigen", "emperor-go-mizunoo"]
  },
  {
    slug: "greatest-european-monarch", name: "Greatest European Monarch", group: "Power",
    people: ["Charlemagne", "Alexander the Great", "Louis XIV", "Elizabeth I", "Queen Victoria", "Napoleon Bonaparte", "Peter the Great", "Catherine the Great", "Frederick the Great", "William the Conqueror", "Henry VIII", "Alfred the Great", "Charles V", "Maria Theresa", "Philip II of Spain", "Ferdinand II", "Suleiman the Magnificent", "Otto the Great", "Richard the Lionheart", "Constantine the Great"],
    slugs: ["charlemagne-5", "alexander-the-great-4", "louis-xiv-4", "elizabeth-i-4", "queen-victoria-4", "napoleon-bonaparte-6", "peter-the-great-3", "catherine-the-great-3", "frederick-the-great", "william-the-conqueror-3", "henry-viii-4", "alfred-the-great-3", "charles-v-2", "maria-theresa-2", "philip-ii-of-spain", "ferdinand-ii", "suleiman-the-magnificent-4", "otto-the-great", "richard-the-lionheart-2", "constantine-the-great-4"]
  },
  {
    slug: "greatest-conqueror", name: "Greatest Conqueror", group: "War",
    people: ["Alexander the Great", "Genghis Khan", "Napoleon Bonaparte", "Cyrus the Great", "Julius Caesar", "Timur", "Attila the Hun", "Charlemagne", "Chandragupta Maurya", "Mehmed II", "Khalid ibn al-Walid", "Subutai", "Hannibal", "Saladin", "Babur", "Sargon of Akkad", "William the Conqueror", "Hernán Cortés", "Francisco Pizarro", "Shivaji Maharaj"],
    slugs: ["alexander-the-great-5", "genghis-khan-4", "napoleon-bonaparte-7", "cyrus-the-great-4", "julius-caesar", "timur", "attila-the-hun", "charlemagne-6", "chandragupta-maurya-5", "mehmed-ii-2", "khalid-ibn-al-walid", "subutai", "hannibal", "saladin-2", "babur", "sargon-of-akkad-2", "william-the-conqueror-4", "hernan-cortes", "francisco-pizarro", "shivaji-maharaj-2"]
  },
  {
    slug: "greatest-general", name: "Greatest General", group: "War",
    people: ["Alexander the Great", "Napoleon Bonaparte", "Julius Caesar", "Genghis Khan", "Sun Tzu", "Hannibal", "Khalid ibn al-Walid", "Georgy Zhukov", "Subutai", "Scipio Africanus", "Saladin", "Erwin Rommel", "Arthur Wellesley", "George S. Patton", "Ulysses S. Grant", "Yi Sun-sin", "Dwight D. Eisenhower", "Douglas MacArthur", "Belisarius", "Horatio Nelson"],
    slugs: ["alexander-the-great-6", "napoleon-bonaparte-8", "julius-caesar-2", "genghis-khan-5", "sun-tzu", "hannibal-2", "khalid-ibn-al-walid-2", "georgy-zhukov", "subutai-2", "scipio-africanus", "saladin-3", "erwin-rommel", "arthur-wellesley", "george-s-patton", "ulysses-s-grant-2", "yi-sun-sin", "dwight-d-eisenhower-3", "douglas-macarthur", "belisarius", "horatio-nelson"]
  },
  {
    slug: "greatest-military-commander", name: "Greatest Military Commander", group: "War",
    people: ["Alexander the Great", "Napoleon Bonaparte", "Genghis Khan", "Julius Caesar", "Hannibal", "Khalid ibn al-Walid", "Sun Tzu", "Georgy Zhukov", "Scipio Africanus", "Subutai", "Saladin", "Arthur Wellesley", "Yi Sun-sin", "Erwin Rommel", "George S. Patton", "Ulysses S. Grant", "Dwight D. Eisenhower", "Douglas MacArthur", "Belisarius", "Frederick the Great"],
    slugs: ["alexander-the-great-7", "napoleon-bonaparte-9", "genghis-khan-6", "julius-caesar-3", "hannibal-3", "khalid-ibn-al-walid-3", "sun-tzu-2", "georgy-zhukov-2", "scipio-africanus-2", "subutai-3", "saladin-4", "arthur-wellesley-2", "yi-sun-sin-2", "erwin-rommel-2", "george-s-patton-2", "ulysses-s-grant-3", "dwight-d-eisenhower-4", "douglas-macarthur-2", "belisarius-2", "frederick-the-great-2"]
  },
  {
    slug: "greatest-military-strategist", name: "Greatest Military Strategist", group: "War",
    people: ["Sun Tzu", "Alexander the Great", "Napoleon Bonaparte", "Genghis Khan", "Hannibal", "Julius Caesar", "Subutai", "Khalid ibn al-Walid", "Scipio Africanus", "Georgy Zhukov", "Miyamoto Musashi", "Carl von Clausewitz", "Erwin Rommel", "Saladin", "Yi Sun-sin", "Arthur Wellesley", "Helmuth von Moltke", "Belisarius", "Gustavus Adolphus", "Frederick the Great"],
    slugs: ["sun-tzu-3", "alexander-the-great-8", "napoleon-bonaparte-10", "genghis-khan-7", "hannibal-4", "julius-caesar-4", "subutai-4", "khalid-ibn-al-walid-4", "scipio-africanus-3", "georgy-zhukov-3", "miyamoto-musashi", "carl-von-clausewitz", "erwin-rommel-3", "saladin-5", "yi-sun-sin-3", "arthur-wellesley-3", "helmuth-von-moltke", "belisarius-3", "gustavus-adolphus", "frederick-the-great-3"]
  },
  {
    slug: "greatest-naval-commander", name: "Greatest Naval Commander", group: "War",
    people: ["Horatio Nelson", "Yi Sun-sin", "Chester W. Nimitz", "John Jervis", "Themistocles", "Michiel de Ruyter", "Tōgō Heihachirō", "Alfred Thayer Mahan", "Francis Drake", "Andrew Cunningham", "Raymond Spruance", "George Dewey", "Isoroku Yamamoto", "John Paul Jones", "Edward Vernon", "Robert Blake", "Andrea Doria", "Bartholomew Roberts", "William Halsey", "Karl Dönitz"],
    slugs: ["horatio-nelson-2", "yi-sun-sin-4", "chester-w-nimitz", "john-jervis", "themistocles", "michiel-de-ruyter", "togo-heihachiro", "alfred-thayer-mahan", "francis-drake", "andrew-cunningham", "raymond-spruance", "george-dewey", "isoroku-yamamoto", "john-paul-jones", "edward-vernon", "robert-blake", "andrea-doria", "bartholomew-roberts", "william-halsey", "karl-donitz"]
  },
  {
    slug: "greatest-founder", name: "Greatest Founder", group: "Business",
    people: ["Steve Jobs", "Bill Gates", "Jeff Bezos", "Elon Musk", "Mark Zuckerberg", "Larry Page", "Sergey Brin", "Walt Disney", "Henry Ford", "Larry Ellison", "Sam Walton", "Reed Hastings", "Brian Chesky", "Jack Ma", "Jensen Huang", "Michael Dell", "Phil Knight", "Richard Branson", "Melanie Perkins", "Evan Spiegel"],
    slugs: ["steve-jobs", "bill-gates", "jeff-bezos", "elon-musk", "mark-zuckerberg", "larry-page", "sergey-brin", "walt-disney", "henry-ford", "larry-ellison", "sam-walton", "reed-hastings", "brian-chesky", "jack-ma", "jensen-huang", "michael-dell", "phil-knight", "richard-branson", "melanie-perkins", "evan-spiegel"]
  },
  {
    slug: "greatest-investor", name: "Greatest Investor", group: "Business",
    people: ["Warren Buffett", "Charlie Munger", "Benjamin Graham", "Peter Lynch", "George Soros", "John Templeton", "Ray Dalio", "Howard Marks", "Carl Icahn", "Bill Ackman", "Peter Thiel", "Michael Burry", "Stanley Druckenmiller", "Seth Klarman", "Joel Greenblatt", "Cathie Wood", "David Tepper", "Jim Simons", "Mohnish Pabrai", "John Paulson"],
    slugs: ["warren-buffett", "charlie-munger", "benjamin-graham", "peter-lynch", "george-soros", "john-templeton", "ray-dalio", "howard-marks", "carl-icahn", "bill-ackman", "peter-thiel", "michael-burry", "stanley-druckenmiller", "seth-klarman", "joel-greenblatt", "cathie-wood", "david-tepper", "jim-simons", "mohnish-pabrai", "john-paulson"]
  },
  {
    slug: "greatest-ceo", name: "Greatest CEO", group: "Business",
    people: ["Steve Jobs", "Satya Nadella", "Jensen Huang", "Tim Cook", "Jeff Bezos", "Elon Musk", "Andy Grove", "Jack Welch", "Indra Nooyi", "Sundar Pichai", "Alan Mulally", "Reed Hastings", "Bob Iger", "Mary Barra", "Sam Walton", "Howard Schultz", "Brian Chesky", "Larry Ellison", "Jamie Dimon", "Bernard Arnault"],
    slugs: ["steve-jobs-2", "satya-nadella", "jensen-huang-2", "tim-cook", "jeff-bezos-2", "elon-musk-2", "andy-grove", "jack-welch", "indra-nooyi", "sundar-pichai", "alan-mulally", "reed-hastings-2", "bob-iger", "mary-barra", "sam-walton-2", "howard-schultz", "brian-chesky-2", "larry-ellison-2", "jamie-dimon", "bernard-arnault"]
  },
  {
    slug: "greatest-company", name: "Greatest Company", group: "Business",
    people: ["Apple", "Microsoft", "Amazon", "Google", "Nvidia", "Berkshire Hathaway", "Tesla", "Meta", "Saudi Aramco", "Walmart", "Coca-Cola", "Disney", "Samsung", "Toyota", "Nike", "McDonald's", "Netflix", "Visa", "JPMorgan Chase", "TSMC"],
    slugs: ["apple", "microsoft", "amazon", "google", "nvidia", "berkshire-hathaway", "tesla", "meta", "saudi-aramco", "walmart", "coca-cola", "disney", "samsung", "toyota", "nike", "mcdonald-s", "netflix", "visa", "jpmorgan-chase", "tsmc"]
  },
  {
    slug: "greatest-entrepreneur", name: "Greatest Entrepreneur", group: "Business",
    people: ["Steve Jobs", "Elon Musk", "Jeff Bezos", "Bill Gates", "Walt Disney", "Henry Ford", "Richard Branson", "Oprah Winfrey", "Mark Zuckerberg", "Coco Chanel", "Sam Walton", "Jack Ma", "Estée Lauder", "Phil Knight", "Madam C. J. Walker", "Larry Ellison", "Arianna Huffington", "Sara Blakely", "Warren Buffett", "Ralph Lauren"],
    slugs: ["steve-jobs-3", "elon-musk-3", "jeff-bezos-3", "bill-gates-2", "walt-disney-2", "henry-ford-2", "richard-branson-2", "oprah-winfrey", "mark-zuckerberg-2", "coco-chanel", "sam-walton-3", "jack-ma-2", "estee-lauder", "phil-knight-2", "madam-c-j-walker", "larry-ellison-3", "arianna-huffington", "sara-blakely", "warren-buffett-2", "ralph-lauren"]
  },
  {
    slug: "greatest-businessman", name: "Greatest Businessman", group: "Business",
    people: ["Henry Ford", "Steve Jobs", "Bill Gates", "Warren Buffett", "Jeff Bezos", "Elon Musk", "Sam Walton", "Andrew Carnegie", "John D. Rockefeller", "J. P. Morgan", "Walt Disney", "Larry Ellison", "Jack Ma", "Ray Kroc", "Cornelius Vanderbilt", "Henry Clay Frick", "George Eastman", "Ingvar Kamprad", "Akio Morita", "Masayoshi Son"],
    slugs: ["henry-ford-3", "steve-jobs-4", "bill-gates-3", "warren-buffett-3", "jeff-bezos-4", "elon-musk-4", "sam-walton-4", "andrew-carnegie", "john-d-rockefeller", "j-p-morgan", "walt-disney-3", "larry-ellison-4", "jack-ma-3", "ray-kroc", "cornelius-vanderbilt", "henry-clay-frick", "george-eastman", "ingvar-kamprad", "akio-morita", "masayoshi-son"]
  },
  {
    slug: "greatest-businesswoman", name: "Greatest Businesswoman", group: "Business",
    people: ["Madam C. J. Walker", "Coco Chanel", "Estée Lauder", "Oprah Winfrey", "Mary Kay Ash", "Ruth Handler", "Arianna Huffington", "Sara Blakely", "Indra Nooyi", "Whitney Wolfe Herd", "Melanie Perkins", "Kiran Mazumdar-Shaw", "Sheryl Sandberg", "Safra Catz", "Ginni Rometty", "Zhang Xin", "Rihanna", "Jessica Alba", "Diane von Furstenberg", "Anita Roddick"],
    slugs: ["madam-c-j-walker-2", "coco-chanel-2", "estee-lauder-2", "oprah-winfrey-2", "mary-kay-ash", "ruth-handler", "arianna-huffington-2", "sara-blakely-2", "indra-nooyi-2", "whitney-wolfe-herd", "melanie-perkins-2", "kiran-mazumdar-shaw", "sheryl-sandberg", "safra-catz", "ginni-rometty", "zhang-xin", "rihanna", "jessica-alba", "diane-von-furstenberg", "anita-roddick"]
  },
  {
    slug: "greatest-venture-capitalist", name: "Greatest Venture Capitalist", group: "Business",
    people: ["John Doerr", "Marc Andreessen", "Ben Horowitz", "Peter Thiel", "Fred Wilson", "Reid Hoffman", "Paul Graham", "Don Valentine", "Bill Gurley", "Vinod Khosla", "Chris Sacca", "Mary Meeker", "Peter Fenton", "Mike Moritz", "Ron Conway", "Aileen Lee", "Josh Kopelman", "Jim Goetz", "Alfred Lin"],
    slugs: ["john-doerr", "marc-andreessen", "ben-horowitz", "peter-thiel-2", "fred-wilson", "reid-hoffman", "paul-graham", "don-valentine", "bill-gurley", "vinod-khosla", "chris-sacca", "mary-meeker", "peter-fenton", "mike-moritz", "ron-conway", "aileen-lee", "josh-kopelman", "jim-goetz", "alfred-lin"]
  },
  {
    slug: "greatest-painter", name: "Greatest Painter", group: "Culture",
    people: ["Leonardo da Vinci", "Vincent van Gogh", "Pablo Picasso", "Michelangelo", "Rembrandt", "Claude Monet", "Caravaggio", "Johannes Vermeer", "Salvador Dalí", "Raphael", "Edvard Munch", "Henri Matisse", "Diego Velázquez", "Francisco Goya", "Andy Warhol", "Gustav Klimt", "Paul Cézanne", "Wassily Kandinsky", "Jackson Pollock", "Frida Kahlo"],
    slugs: ["leonardo-da-vinci-2", "vincent-van-gogh", "pablo-picasso", "michelangelo", "rembrandt", "claude-monet", "caravaggio", "johannes-vermeer", "salvador-dali", "raphael", "edvard-munch", "henri-matisse", "diego-velazquez", "francisco-goya", "andy-warhol", "gustav-klimt", "paul-cezanne", "wassily-kandinsky", "jackson-pollock", "frida-kahlo"]
  },
  {
    slug: "greatest-photographer", name: "Greatest Photographer", group: "Culture",
    people: ["Ansel Adams", "Henri Cartier-Bresson", "Annie Leibovitz", "Dorothea Lange", "Steve McCurry", "Robert Capa", "Sebastião Salgado", "Diane Arbus", "Cindy Sherman", "Richard Avedon", "Vivian Maier", "Man Ray", "Robert Frank", "Irving Penn", "Helmut Newton", "Gordon Parks", "Edward Weston", "Alfred Stieglitz", "Nan Goldin", "David LaChapelle"],
    slugs: ["ansel-adams", "henri-cartier-bresson", "annie-leibovitz", "dorothea-lange", "steve-mccurry", "robert-capa", "sebastiao-salgado", "diane-arbus", "cindy-sherman", "richard-avedon", "vivian-maier", "man-ray", "robert-frank", "irving-penn", "helmut-newton", "gordon-parks", "edward-weston", "alfred-stieglitz", "nan-goldin", "david-lachapelle"]
  },
  {
    slug: "greatest-architect", name: "Greatest Architect", group: "Culture",
    people: ["Frank Lloyd Wright", "Antoni Gaudí", "Le Corbusier", "Zaha Hadid", "Ludwig Mies van der Rohe", "Frank Gehry", "Norman Foster", "Tadao Ando", "Oscar Niemeyer", "Renzo Piano", "I. M. Pei", "Louis Kahn", "Eero Saarinen", "Charles Correa", "Bjarke Ingels", "Philip Johnson", "Alvar Aalto", "Rem Koolhaas", "Santiago Calatrava", "Balkrishna Doshi"],
    slugs: ["frank-lloyd-wright", "antoni-gaudi", "le-corbusier", "zaha-hadid", "ludwig-mies-van-der-rohe", "frank-gehry", "norman-foster", "tadao-ando", "oscar-niemeyer", "renzo-piano", "i-m-pei", "louis-kahn", "eero-saarinen", "charles-correa", "bjarke-ingels", "philip-johnson", "alvar-aalto", "rem-koolhaas", "santiago-calatrava", "balkrishna-doshi"]
  },
  {
    slug: "greatest-chef", name: "Greatest Chef", group: "Culture",
    people: ["Gordon Ramsay", "Ferran Adrià", "Massimo Bottura", "Alain Ducasse", "Joël Robuchon", "Heston Blumenthal", "Thomas Keller", "Wolfgang Puck", "Anthony Bourdain", "Julia Child", "Marco Pierre White", "René Redzepi", "Grant Achatz", "Alice Waters", "Dominique Crenn", "Jamie Oliver", "José Andrés", "Nobu Matsuhisa", "Sanjeev Kapoor", "Vikas Khanna"],
    slugs: ["gordon-ramsay", "ferran-adria", "massimo-bottura", "alain-ducasse", "joel-robuchon", "heston-blumenthal", "thomas-keller", "wolfgang-puck", "anthony-bourdain", "julia-child", "marco-pierre-white", "rene-redzepi", "grant-achatz", "alice-waters", "dominique-crenn", "jamie-oliver", "jose-andres", "nobu-matsuhisa", "sanjeev-kapoor", "vikas-khanna"]
  },
  {
    slug: "greatest-fashion-designer", name: "Greatest Fashion Designer", group: "Culture",
    people: ["Coco Chanel", "Alexander McQueen", "Giorgio Armani", "Christian Dior", "Yves Saint Laurent", "Gianni Versace", "Ralph Lauren", "Vivienne Westwood", "Karl Lagerfeld", "Tom Ford", "Cristóbal Balenciaga", "Hubert de Givenchy", "Rei Kawakubo", "Virgil Abloh", "Donatella Versace", "Miuccia Prada", "Valentino Garavani", "Christian Louboutin", "Issey Miyake", "Manish Malhotra"],
    slugs: ["coco-chanel-3", "alexander-mcqueen", "giorgio-armani", "christian-dior", "yves-saint-laurent", "gianni-versace", "ralph-lauren-2", "vivienne-westwood", "karl-lagerfeld", "tom-ford", "cristobal-balenciaga", "hubert-de-givenchy", "rei-kawakubo", "virgil-abloh", "donatella-versace", "miuccia-prada", "valentino-garavani", "christian-louboutin", "issey-miyake", "manish-malhotra"]
  },
  {
    slug: "greatest-dancer", name: "Greatest Dancer", group: "Culture",
    people: ["Michael Jackson", "Mikhail Baryshnikov", "Fred Astaire", "Gene Kelly", "Rudolf Nureyev", "Martha Graham", "Misty Copeland", "Savion Glover", "Isadora Duncan", "Gregory Hines", "Vaslav Nijinsky", "Ginger Rogers", "Sylvie Guillem", "Alvin Ailey", "Akram Khan", "Pina Bausch", "Prabhu Deva", "Hrithik Roshan", "Madhuri Dixit", "Shakira"],
    slugs: ["michael-jackson-2", "mikhail-baryshnikov", "fred-astaire", "gene-kelly", "rudolf-nureyev", "martha-graham", "misty-copeland", "savion-glover", "isadora-duncan", "gregory-hines", "vaslav-nijinsky", "ginger-rogers", "sylvie-guillem", "alvin-ailey", "akram-khan", "pina-bausch", "prabhu-deva", "hrithik-roshan-2", "madhuri-dixit-2", "shakira"]
  },
  {
    slug: "greatest-sculptor", name: "Greatest Sculptor", group: "Culture",
    people: ["Michelangelo", "Auguste Rodin", "Donatello", "Gian Lorenzo Bernini", "Phidias", "Praxiteles", "Constantin Brâncuși", "Henry Moore", "Alberto Giacometti", "Louise Bourgeois", "Antonio Canova", "Edgar Degas", "Barbara Hepworth", "Jean-Baptiste Carpeaux", "Isamu Noguchi", "Umberto Boccioni", "Camille Claudel", "Richard Serra", "Anish Kapoor", "Jeff Koons"],
    slugs: ["michelangelo-2", "auguste-rodin", "donatello", "gian-lorenzo-bernini", "phidias", "praxiteles", "constantin-brancusi", "henry-moore", "alberto-giacometti", "louise-bourgeois", "antonio-canova", "edgar-degas", "barbara-hepworth", "jean-baptiste-carpeaux", "isamu-noguchi", "umberto-boccioni", "camille-claudel", "richard-serra", "anish-kapoor", "jeff-koons"]
  },
  {
    slug: "greatest-designer", name: "Greatest Designer", group: "Culture",
    people: ["Dieter Rams", "Charles Eames", "Ray Eames", "Jony Ive", "Paul Rand", "Massimo Vignelli", "Saul Bass", "Milton Glaser", "Otl Aicher", "Karim Rashid", "Naoto Fukasawa", "Philippe Starck", "Ettore Sottsass", "Raymond Loewy", "Charles Rennie Mackintosh", "Peter Behrens", "Issey Miyake", "Virgil Abloh", "Kenya Hara", "Hartmut Esslinger"],
    slugs: ["dieter-rams", "charles-eames", "ray-eames", "jony-ive", "paul-rand", "massimo-vignelli", "saul-bass", "milton-glaser", "otl-aicher", "karim-rashid", "naoto-fukasawa", "philippe-starck", "ettore-sottsass", "raymond-loewy", "charles-rennie-mackintosh", "peter-behrens", "issey-miyake-2", "virgil-abloh-2", "kenya-hara", "hartmut-esslinger"]
  },
  {
    slug: "greatest-youtuber", name: "Greatest YouTuber", group: "Internet",
    people: ["MrBeast", "PewDiePie", "Markiplier", "Casey Neistat", "Logan Paul", "KSI", "Ryan Trahan", "Marques Brownlee", "Dude Perfect", "Emma Chamberlain", "iJustine", "Philip DeFranco", "Smosh", "Shane Dawson", "Vsauce", "Veritasium", "Kurzgesagt", "Jacksepticeye", "Dream", "Airrack"],
    slugs: ["mrbeast", "pewdiepie", "markiplier", "casey-neistat", "logan-paul", "ksi", "ryan-trahan", "marques-brownlee", "dude-perfect", "emma-chamberlain", "ijustine", "philip-defranco", "smosh", "shane-dawson", "vsauce", "veritasium", "kurzgesagt", "jacksepticeye", "dream", "airrack"]
  },
  {
    slug: "greatest-streamer", name: "Greatest Streamer", group: "Internet",
    people: ["Ninja", "xQc", "Kai Cenat", "IShowSpeed", "Pokimane", "Ibai Llanos", "Ludwig", "HasanAbi", "Shroud", "Dr DisRespect", "Tfue", "Summit1g", "Valkyrae", "Asmongold", "MoistCr1TiKaL", "Adin Ross", "Amouranth", "Gaules", "Tarik", "Clix"],
    slugs: ["ninja-2", "xqc", "kai-cenat", "ishowspeed", "pokimane", "ibai-llanos", "ludwig", "hasanabi", "shroud", "dr-disrespect", "tfue", "summit1g", "valkyrae", "asmongold", "moistcr1tikal", "adin-ross", "amouranth", "gaules", "tarik", "clix"]
  },
  {
    slug: "greatest-podcaster", name: "Greatest Podcaster", group: "Internet",
    people: ["Joe Rogan", "Lex Fridman", "Andrew Huberman", "Marc Maron", "Conan O'Brien", "Tim Ferriss", "Steven Bartlett", "Theo Von", "Dax Shepard", "Alex Cooper", "Bill Simmons", "Guy Raz", "Trevor Noah", "Cal Newport", "Kara Swisher", "Sam Harris", "Sean Evans", "Ezra Klein", "Jon Stewart", "Terry Gross"],
    slugs: ["joe-rogan", "lex-fridman", "andrew-huberman", "marc-maron", "conan-o-brien", "tim-ferriss", "steven-bartlett", "theo-von", "dax-shepard", "alex-cooper", "bill-simmons", "guy-raz", "trevor-noah", "cal-newport", "kara-swisher", "sam-harris", "sean-evans", "ezra-klein", "jon-stewart", "terry-gross"]
  },
  {
    slug: "greatest-ai-startup", name: "Greatest AI Startup", group: "Internet",
    people: ["OpenAI", "Anthropic", "xAI", "Google DeepMind", "Perplexity", "Scale AI", "Anysphere", "Runway", "Midjourney", "ElevenLabs", "Hugging Face", "Mistral AI", "Cohere", "Character.AI", "Harvey", "Glean", "Sierra", "Replit", "Thinking Machines Lab", "Safe Superintelligence"],
    slugs: ["openai", "anthropic", "xai", "google-deepmind", "perplexity", "scale-ai", "anysphere", "runway", "midjourney", "elevenlabs", "hugging-face", "mistral-ai", "cohere", "character-ai", "harvey", "glean", "sierra", "replit", "thinking-machines-lab", "safe-superintelligence"]
  },
  {
    slug: "greatest-internet-creator", name: "Greatest Internet Creator", group: "Internet",
    people: ["MrBeast", "PewDiePie", "Logan Paul", "KSI", "Casey Neistat", "Marques Brownlee", "Emma Chamberlain", "Lilly Singh", "Ryan Trahan", "Khaby Lame", "Zach King", "David Dobrik", "Liza Koshy", "Joji", "iJustine", "Philip DeFranco", "Mark Rober", "Dude Perfect", "Ludwig", "Jenna Marbles"],
    slugs: ["mrbeast-2", "pewdiepie-2", "logan-paul-2", "ksi-2", "casey-neistat-2", "marques-brownlee-2", "emma-chamberlain-2", "lilly-singh", "ryan-trahan-2", "khaby-lame", "zach-king", "david-dobrik", "liza-koshy", "joji", "ijustine-2", "philip-defranco-2", "mark-rober", "dude-perfect-2", "ludwig-2", "jenna-marbles"]
  },
  {
    slug: "greatest-influencer", name: "Greatest Influencer", group: "Internet",
    people: ["MrBeast", "Kim Kardashian", "Cristiano Ronaldo", "Selena Gomez", "Kylie Jenner", "Dwayne Johnson", "Taylor Swift", "Lionel Messi", "Charli D'Amelio", "Virat Kohli", "Beyoncé", "Justin Bieber", "Ariana Grande", "Kendall Jenner", "LeBron James", "Zendaya", "Neymar", "Shah Rukh Khan", "Rihanna", "Dua Lipa"],
    slugs: ["mrbeast-3", "kim-kardashian", "cristiano-ronaldo-2", "selena-gomez", "kylie-jenner", "dwayne-johnson", "taylor-swift", "lionel-messi-2", "charli-d-amelio", "virat-kohli-4", "beyonce-2", "justin-bieber", "ariana-grande", "kendall-jenner", "lebron-james-2", "zendaya", "neymar-2", "shah-rukh-khan-2", "rihanna-2", "dua-lipa"]
  },
  {
    slug: "greatest-tech-creator", name: "Greatest Tech Creator", group: "Internet",
    people: ["Marques Brownlee", "Linus Sebastian", "Mrwhosetheboss", "iJustine", "Unbox Therapy", "Austin Evans", "Sara Dietschy", "Dave2D", "Jonathan Morrison", "Michael Fisher", "UrAvgConsumer", "Snazzy Labs", "Rene Ritchie", "David Carnoy", "Andru Edwards", "JerryRigEverything", "Nilay Patel", "Judner Aura", "Erica Griffin"],
    slugs: ["marques-brownlee-3", "linus-sebastian", "mrwhosetheboss", "ijustine-3", "unbox-therapy", "austin-evans", "sara-dietschy", "dave2d", "jonathan-morrison", "michael-fisher", "uravgconsumer", "snazzy-labs", "rene-ritchie", "david-carnoy", "andru-edwards", "jerryrigeverything", "nilay-patel", "judner-aura", "erica-griffin"]
  },
  {
    slug: "greatest-online-community", name: "Greatest Online Community", group: "Internet",
    people: ["Reddit", "Wikipedia", "Stack Overflow", "GitHub", "Discord", "Twitch", "YouTube", "4chan", "Hacker News", "Quora", "X", "Facebook Groups", "Steam Community", "Minecraft community", "Roblox community", "Fortnite community", "Fandom", "Product Hunt", "Indie Hackers", "Lemmy"],
    slugs: ["reddit", "wikipedia", "stack-overflow", "github", "discord", "twitch", "youtube", "4chan", "hacker-news", "quora", "x", "facebook-groups", "steam-community", "minecraft-community", "roblox-community", "fortnite-community", "fandom", "product-hunt", "indie-hackers", "lemmy"]
  },
  {
    slug: "greatest-programmer", name: "Greatest Programmer", group: "Tech",
    people: ["Donald Knuth", "Dennis Ritchie", "Ken Thompson", "Bjarne Stroustrup", "James Gosling", "Guido van Rossum", "Linus Torvalds", "Brian Kernighan", "Niklaus Wirth", "Tim Berners-Lee", "Margaret Hamilton", "Grace Hopper", "John Carmack", "Anders Hejlsberg", "Brendan Eich", "Yukihiro Matsumoto", "Rob Pike", "Edsger W. Dijkstra", "Alan Turing", "John Backus"],
    slugs: ["donald-knuth", "dennis-ritchie", "ken-thompson", "bjarne-stroustrup", "james-gosling", "guido-van-rossum", "linus-torvalds", "brian-kernighan", "niklaus-wirth", "tim-berners-lee-2", "margaret-hamilton", "grace-hopper", "john-carmack", "anders-hejlsberg", "brendan-eich", "yukihiro-matsumoto", "rob-pike", "edsger-w-dijkstra", "alan-turing-3", "john-backus"]
  },
  {
    slug: "greatest-computer-scientist", name: "Greatest Computer Scientist", group: "Tech",
    people: ["Alan Turing", "John von Neumann", "Donald Knuth", "Edsger W. Dijkstra", "Claude Shannon", "Grace Hopper", "Dennis Ritchie", "Ken Thompson", "Barbara Liskov", "Leslie Lamport", "E. F. Codd", "Vint Cerf", "Tim Berners-Lee", "John McCarthy", "Marvin Minsky", "Niklaus Wirth", "Bjarne Stroustrup", "Judea Pearl", "Geoffrey Hinton", "Frances Allen"],
    slugs: ["alan-turing-4", "john-von-neumann-2", "donald-knuth-2", "edsger-w-dijkstra-2", "claude-shannon", "grace-hopper-2", "dennis-ritchie-2", "ken-thompson-2", "barbara-liskov", "leslie-lamport", "e-f-codd", "vint-cerf", "tim-berners-lee-3", "john-mccarthy", "marvin-minsky", "niklaus-wirth-2", "bjarne-stroustrup-2", "judea-pearl", "geoffrey-hinton", "frances-allen"]
  },
  {
    slug: "greatest-ai-researcher", name: "Greatest AI Researcher", group: "Tech",
    people: ["Geoffrey Hinton", "Yann LeCun", "Yoshua Bengio", "Demis Hassabis", "Andrew Ng", "Fei-Fei Li", "Ilya Sutskever", "Jürgen Schmidhuber", "Stuart Russell", "Peter Norvig", "Daphne Koller", "Judea Pearl", "Richard Sutton", "David Silver", "Ian Goodfellow", "Dario Amodei", "Oriol Vinyals", "Andrej Karpathy", "Jeff Dean", "Jitendra Malik"],
    slugs: ["geoffrey-hinton-2", "yann-lecun", "yoshua-bengio", "demis-hassabis", "andrew-ng", "fei-fei-li", "ilya-sutskever", "jurgen-schmidhuber", "stuart-russell", "peter-norvig", "daphne-koller", "judea-pearl-2", "richard-sutton", "david-silver", "ian-goodfellow", "dario-amodei", "oriol-vinyals", "andrej-karpathy", "jeff-dean", "jitendra-malik"]
  },
  {
    slug: "greatest-technologist", name: "Greatest Technologist", group: "Tech",
    people: ["Steve Jobs", "Bill Gates", "Elon Musk", "Alan Turing", "Nikola Tesla", "Tim Berners-Lee", "Mark Zuckerberg", "Larry Page", "Sergey Brin", "Jensen Huang", "James Watt", "Thomas Edison", "Grace Hopper", "Steve Wozniak", "Jeff Bezos", "Dennis Ritchie", "Ken Thompson", "Linus Torvalds", "John von Neumann", "Claude Shannon"],
    slugs: ["steve-jobs-5", "bill-gates-4", "elon-musk-5", "alan-turing-5", "nikola-tesla-3", "tim-berners-lee-4", "mark-zuckerberg-3", "larry-page-2", "sergey-brin-2", "jensen-huang-3", "james-watt-2", "thomas-edison-2", "grace-hopper-3", "steve-wozniak-2", "jeff-bezos-5", "dennis-ritchie-3", "ken-thompson-3", "linus-torvalds-2", "john-von-neumann-3", "claude-shannon-2"]
  },
  {
    slug: "greatest-engineer", name: "Greatest Engineer", group: "Tech",
    people: ["Isambard Kingdom Brunel", "Nikola Tesla", "James Watt", "Gustave Eiffel", "George Stephenson", "Thomas Edison", "Leonardo da Vinci", "Emily Roebling", "Guglielmo Marconi", "Henry Ford", "Nikolaus Otto", "Wernher von Braun", "Frank Whittle", "Kelly Johnson", "S. P. Korolev", "George Washington Carver", "Elon Musk", "Steve Wozniak", "Margaret Hamilton", "James Clerk Maxwell"],
    slugs: ["isambard-kingdom-brunel", "nikola-tesla-4", "james-watt-3", "gustave-eiffel", "george-stephenson-2", "thomas-edison-3", "leonardo-da-vinci-3", "emily-roebling", "guglielmo-marconi-2", "henry-ford-4", "nikolaus-otto", "wernher-von-braun", "frank-whittle", "kelly-johnson", "s-p-korolev", "george-washington-carver", "elon-musk-6", "steve-wozniak-3", "margaret-hamilton-2", "james-clerk-maxwell-3"]
  },
  {
    slug: "greatest-historical-figure", name: "Greatest Historical Figure", group: "History",
    people: ["Jesus Christ", "Muhammad", "Buddha", "Alexander the Great", "Julius Caesar", "Genghis Khan", "Napoleon Bonaparte", "Abraham Lincoln", "Mahatma Gandhi", "Confucius", "Leonardo da Vinci", "Isaac Newton", "Albert Einstein", "William Shakespeare", "George Washington", "Nelson Mandela", "Cleopatra", "Charlemagne", "Aristotle", "Socrates"],
    slugs: ["jesus-christ", "muhammad", "buddha", "alexander-the-great-9", "julius-caesar-5", "genghis-khan-8", "napoleon-bonaparte-11", "abraham-lincoln-5", "mahatma-gandhi-5", "confucius-2", "leonardo-da-vinci-4", "isaac-newton-4", "albert-einstein-3", "william-shakespeare-4", "george-washington-6", "nelson-mandela-5", "cleopatra-2", "charlemagne-7", "aristotle-2", "socrates-2"]
  },
  {
    slug: "greatest-ancient-leader", name: "Greatest Ancient Leader", group: "History",
    people: ["Alexander the Great", "Julius Caesar", "Cyrus the Great", "Ashoka", "Augustus", "Hammurabi", "Qin Shi Huang", "Ramesses II", "Hannibal", "Pericles", "Leonidas I", "Darius I", "Sargon of Akkad", "Thutmose III", "Solomon", "Chandragupta Maurya", "Cleopatra", "Trajan", "Constantine the Great", "Cao Cao"],
    slugs: ["alexander-the-great-10", "julius-caesar-6", "cyrus-the-great-5", "ashoka-5", "augustus-4", "hammurabi-2", "qin-shi-huang-4", "ramesses-ii-2", "hannibal-5", "pericles", "leonidas-i-2", "darius-i", "sargon-of-akkad-3", "thutmose-iii-2", "solomon", "chandragupta-maurya-6", "cleopatra-3", "trajan-4", "constantine-the-great-5", "cao-cao"]
  },
  {
    slug: "greatest-medieval-leader", name: "Greatest Medieval Leader", group: "History",
    people: ["Charlemagne", "Genghis Khan", "Saladin", "Richard the Lionheart", "William the Conqueror", "Alfred the Great", "Suleiman the Magnificent", "Mehmed II", "Timur", "Mansa Musa", "Harun al-Rashid", "Alauddin Khalji", "Shivaji Maharaj", "Edward III", "Louis IX", "Frederick II", "Gustavus Adolphus", "El Cid", "Baybars", "Alfonso X"],
    slugs: ["charlemagne-8", "genghis-khan-9", "saladin-6", "richard-the-lionheart-3", "william-the-conqueror-5", "alfred-the-great-4", "suleiman-the-magnificent-5", "mehmed-ii-3", "timur-2", "mansa-musa", "harun-al-rashid-2", "alauddin-khalji-2", "shivaji-maharaj-3", "edward-iii-3", "louis-ix-2", "frederick-ii-2", "gustavus-adolphus-2", "el-cid", "baybars", "alfonso-x-2"]
  },
  {
    slug: "greatest-explorer", name: "Greatest Explorer", group: "History",
    people: ["Christopher Columbus", "Ferdinand Magellan", "Marco Polo", "Ibn Battuta", "James Cook", "Vasco da Gama", "Amerigo Vespucci", "Roald Amundsen", "Ernest Shackleton", "Lewis and Clark", "Zheng He", "Leif Erikson", "David Livingstone", "Francis Drake", "Hernán Cortés", "Jacques Cartier", "John Cabot", "Sacagawea", "Richard Francis Burton", "Fridtjof Nansen"],
    slugs: ["christopher-columbus", "ferdinand-magellan", "marco-polo", "ibn-battuta", "james-cook", "vasco-da-gama", "amerigo-vespucci", "roald-amundsen", "ernest-shackleton", "lewis-and-clark", "zheng-he", "leif-erikson", "david-livingstone", "francis-drake-2", "hernan-cortes-2", "jacques-cartier", "john-cabot", "sacagawea", "richard-francis-burton", "fridtjof-nansen"]
  },
  {
    slug: "greatest-diplomat", name: "Greatest Diplomat", group: "History",
    people: ["Henry Kissinger", "Klemens von Metternich", "George F. Kennan", "Talleyrand", "Benjamin Franklin", "Dag Hammarskjöld", "Madeleine Albright", "George C. Marshall", "Zhou Enlai", "Dean Acheson", "Henry Clay", "Ralph Bunche", "Eleanor Roosevelt", "Kofi Annan", "Ban Ki-moon", "Hans-Dietrich Genscher", "Andrei Gromyko", "Shimon Peres", "Lakhdar Brahimi"],
    slugs: ["henry-kissinger-2", "klemens-von-metternich-2", "george-f-kennan", "talleyrand", "benjamin-franklin-2", "dag-hammarskjold", "madeleine-albright", "george-c-marshall", "zhou-enlai", "dean-acheson", "henry-clay", "ralph-bunche", "eleanor-roosevelt", "kofi-annan", "ban-ki-moon", "hans-dietrich-genscher", "andrei-gromyko", "shimon-peres", "lakhdar-brahimi"]
  },
  {
    slug: "greatest-spy", name: "Greatest Spy", group: "History",
    people: ["Richard Sorge", "Virginia Hall", "Kim Philby", "Eli Cohen", "Mata Hari", "Sidney Reilly", "Juan Pujol García", "Oleg Penkovsky", "Aldrich Ames", "Robert Hanssen", "Noor Inayat Khan", "Belle Boyd", "Nancy Wake", "Dusko Popov", "George Blake", "Klaus Fuchs", "Rudolf Abel", "James Jesus Angleton", "Peter Sichel"],
    slugs: ["richard-sorge", "virginia-hall", "kim-philby", "eli-cohen", "mata-hari", "sidney-reilly", "juan-pujol-garcia", "oleg-penkovsky", "aldrich-ames", "robert-hanssen", "noor-inayat-khan", "belle-boyd", "nancy-wake", "dusko-popov", "george-blake", "klaus-fuchs", "rudolf-abel", "james-jesus-angleton", "peter-sichel"]
  },
  {
    slug: "greatest-superhero", name: "Greatest Superhero", group: "Fiction",
    people: ["Superman", "Batman", "Spider-Man", "Wonder Woman", "Iron Man", "Captain America", "Thor", "Hulk", "Wolverine", "Black Panther", "The Flash", "Green Lantern", "Aquaman", "Doctor Strange", "Deadpool", "Captain Marvel", "Storm", "Jean Grey", "Daredevil", "Hellboy"],
    slugs: ["superman", "batman", "spider-man", "wonder-woman", "iron-man", "captain-america", "thor", "hulk", "wolverine", "black-panther", "the-flash", "green-lantern", "aquaman", "doctor-strange", "deadpool", "captain-marvel", "storm", "jean-grey", "daredevil", "hellboy"]
  },
  {
    slug: "greatest-fictional-character", name: "Greatest Fictional Character", group: "Fiction",
    people: ["Sherlock Holmes", "Harry Potter", "Batman", "James Bond", "Don Quixote", "Superman", "Spider-Man", "Hannibal Lecter", "Gandalf", "Frodo Baggins", "Darth Vader", "Indiana Jones", "Atticus Finch", "Walter White", "Tony Stark", "Jon Snow", "Gollum", "Hercule Poirot", "Holden Caulfield", "Elizabeth Bennet"],
    slugs: ["sherlock-holmes", "harry-potter", "batman-2", "james-bond", "don-quixote-2", "superman-2", "spider-man-2", "hannibal-lecter-2", "gandalf", "frodo-baggins", "darth-vader-2", "indiana-jones", "atticus-finch", "walter-white", "tony-stark", "jon-snow", "gollum", "hercule-poirot", "holden-caulfield", "elizabeth-bennet"]
  },
  {
    slug: "greatest-movie-character", name: "Greatest Movie Character", group: "Fiction",
    people: ["The Joker", "Darth Vader", "Indiana Jones", "Rocky Balboa", "Forrest Gump", "Tony Montana", "Michael Corleone", "Travis Bickle", "Hannibal Lecter", "Tyler Durden", "Jack Sparrow", "Ellen Ripley", "Marty McFly", "Neo", "The Dude", "Andy Dufresne", "Norman Bates", "Amélie Poulain", "John Wick", "Vito Corleone"],
    slugs: ["the-joker-2", "darth-vader-3", "indiana-jones-2", "rocky-balboa", "forrest-gump-2", "tony-montana", "michael-corleone", "travis-bickle", "hannibal-lecter-3", "tyler-durden", "jack-sparrow", "ellen-ripley", "marty-mcfly", "neo", "the-dude", "andy-dufresne", "norman-bates-2", "amelie-poulain", "john-wick", "vito-corleone"]
  },
  {
    slug: "greatest-tv-character", name: "Greatest TV Character", group: "Fiction",
    people: ["Tony Soprano", "Walter White", "Don Draper", "Saul Goodman", "Tyrion Lannister", "Omar Little", "Homer Simpson", "Michael Scott", "Fleabag", "Rust Cohle", "BoJack Horseman", "Dexter Morgan", "Gregory House", "Sherlock Holmes", "Jon Snow", "Daenerys Targaryen", "Logan Roy", "Jimmy McGill", "Buffy Summers", "Kendall Roy"],
    slugs: ["tony-soprano", "walter-white-2", "don-draper", "saul-goodman", "tyrion-lannister", "omar-little", "homer-simpson", "michael-scott", "fleabag-2", "rust-cohle", "bojack-horseman", "dexter-morgan", "gregory-house", "sherlock-holmes-2", "jon-snow-2", "daenerys-targaryen", "logan-roy", "jimmy-mcgill", "buffy-summers", "kendall-roy"]
  },
  {
    slug: "greatest-anime-character", name: "Greatest Anime Character", group: "Fiction",
    people: ["Goku", "Luffy", "Naruto Uzumaki", "Saitama", "Light Yagami", "Eren Yeager", "Levi Ackerman", "Gojo Satoru", "Edward Elric", "Ichigo Kurosaki", "Gon Freecss", "Killua Zoldyck", "Spike Spiegel", "Sailor Moon", "Vegeta", "Kakashi Hatake", "Jotaro Kujo", "Tanjiro Kamado", "L"],
    slugs: ["goku", "luffy", "naruto-uzumaki", "saitama", "light-yagami", "eren-yeager", "levi-ackerman", "gojo-satoru", "edward-elric", "ichigo-kurosaki", "gon-freecss", "killua-zoldyck", "spike-spiegel", "sailor-moon", "vegeta", "kakashi-hatake", "jotaro-kujo", "tanjiro-kamado", "l"]
  },
  {
    slug: "greatest-anime", name: "Greatest Anime", group: "Fiction",
    people: ["One Piece", "Dragon Ball Z", "Naruto", "Attack on Titan", "Death Note", "Fullmetal Alchemist: Brotherhood", "Hunter × Hunter", "Demon Slayer", "My Hero Academia", "Jujutsu Kaisen", "Cowboy Bebop", "Neon Genesis Evangelion", "Sailor Moon", "Bleach", "Code Geass", "Steins;Gate", "One Punch Man", "Vinland Saga", "Monster", "Pokémon"],
    slugs: ["one-piece", "dragon-ball-z", "naruto", "attack-on-titan", "death-note", "fullmetal-alchemist-brotherhood", "hunter-hunter", "demon-slayer", "my-hero-academia", "jujutsu-kaisen", "cowboy-bebop", "neon-genesis-evangelion", "sailor-moon-2", "bleach", "code-geass", "steins-gate", "one-punch-man", "vinland-saga", "monster", "pokemon"]
  },
  {
    slug: "greatest-video-game", name: "Greatest Video Game", group: "Fiction",
    people: ["The Legend of Zelda: Ocarina of Time", "The Last of Us", "Minecraft", "Grand Theft Auto V", "Red Dead Redemption 2", "Super Mario Bros. 3", "The Witcher 3", "Half-Life 2", "Elden Ring", "Dark Souls", "Portal 2", "Tetris", "Super Mario World", "Resident Evil 4", "God of War", "Skyrim", "Mass Effect 2", "Baldur's Gate 3", "Chrono Trigger", "Metal Gear Solid"],
    slugs: ["the-legend-of-zelda-ocarina-of-time", "the-last-of-us", "minecraft", "grand-theft-auto-v", "red-dead-redemption-2", "super-mario-bros-3", "the-witcher-3", "half-life-2", "elden-ring", "dark-souls", "portal-2", "tetris", "super-mario-world", "resident-evil-4", "god-of-war", "skyrim", "mass-effect-2", "baldur-s-gate-3", "chrono-trigger", "metal-gear-solid"]
  },
  {
    slug: "greatest-video-game-character", name: "Greatest Video Game Character", group: "Fiction",
    people: ["Mario", "Link", "Kratos", "Master Chief", "Lara Croft", "Sonic the Hedgehog", "Pikachu", "Geralt of Rivia", "Arthur Morgan", "Solid Snake", "Cloud Strife", "Samus Aran", "Pac-Man", "Donkey Kong", "Kirby", "Steve", "Scorpion", "Sub-Zero", "Doom Slayer", "Trevor Philips"],
    slugs: ["mario", "link", "kratos", "master-chief", "lara-croft", "sonic-the-hedgehog", "pikachu", "geralt-of-rivia", "arthur-morgan", "solid-snake", "cloud-strife", "samus-aran", "pac-man", "donkey-kong", "kirby", "steve", "scorpion", "sub-zero", "doom-slayer", "trevor-philips"]
  },
  {
    slug: "greatest-cuisine", name: "Greatest Cuisine", group: "Food",
    people: ["Italian", "Japanese", "French", "Chinese", "Indian", "Mexican", "Thai", "Spanish", "Greek", "Korean", "Turkish", "Vietnamese", "Lebanese", "Peruvian", "Ethiopian", "Moroccan", "Cantonese", "Persian", "Brazilian", "Portuguese"],
    slugs: ["italian", "japanese", "french", "chinese", "indian", "mexican", "thai", "spanish", "greek", "korean", "turkish", "vietnamese", "lebanese", "peruvian", "ethiopian", "moroccan", "cantonese", "persian", "brazilian", "portuguese"]
  },
  {
    slug: "greatest-dish", name: "Greatest Dish", group: "Food",
    people: ["Pizza", "Sushi", "Biryani", "Tacos", "Pasta", "Ramen", "Hamburger", "Curry", "Dim Sum", "Steak", "Pad Thai", "Paella", "Fried Chicken", "Lasagna", "Pho", "Butter Chicken", "Cheeseburger", "Peking Duck", "Tonkatsu", "Falafel"],
    slugs: ["pizza", "sushi", "biryani", "tacos", "pasta", "ramen", "hamburger", "curry", "dim-sum", "steak", "pad-thai", "paella", "fried-chicken", "lasagna", "pho", "butter-chicken", "cheeseburger", "peking-duck", "tonkatsu", "falafel"]
  },
  {
    slug: "greatest-fast-food-chain", name: "Greatest Fast-Food Chain", group: "Food",
    people: ["McDonald's", "KFC", "Burger King", "Subway", "Wendy's", "Taco Bell", "Chick-fil-A", "Domino's", "Pizza Hut", "Popeyes", "Five Guys", "Chipotle", "In-N-Out Burger", "Shake Shack", "Dunkin'", "Starbucks", "Tim Hortons", "Jollibee", "Whataburger", "Raising Cane's"],
    slugs: ["mcdonald-s-2", "kfc", "burger-king", "subway", "wendy-s", "taco-bell", "chick-fil-a", "domino-s", "pizza-hut", "popeyes", "five-guys", "chipotle", "in-n-out-burger", "shake-shack", "dunkin", "starbucks", "tim-hortons", "jollibee", "whataburger", "raising-cane-s"]
  },
  {
    slug: "greatest-restaurant", name: "Greatest Restaurant", group: "Food",
    people: ["Noma", "El Celler de Can Roca", "Osteria Francescana", "Mirazur", "The French Laundry", "Eleven Madison Park", "Central", "Asador Etxebarri", "Gaggan", "Le Bernardin", "Guy Savoy", "Arpège", "Per Se", "Alinea", "Maido", "Disfrutar", "Mugaritz", "Le Comptoir de la Gastronomie", "L'Arpège", "Geranium"],
    slugs: ["noma", "el-celler-de-can-roca", "osteria-francescana", "mirazur", "the-french-laundry", "eleven-madison-park", "central", "asador-etxebarri", "gaggan", "le-bernardin", "guy-savoy", "arpege", "per-se", "alinea", "maido", "disfrutar", "mugaritz", "le-comptoir-de-la-gastronomie", "l-arpege", "geranium"]
  },
  {
    slug: "greatest-luxury-brand", name: "Greatest Luxury Brand", group: "Brands",
    people: ["Louis Vuitton", "Chanel", "Hermès", "Gucci", "Dior", "Rolex", "Prada", "Cartier", "Burberry", "Bottega Veneta", "Saint Laurent", "Versace", "Balenciaga", "Fendi", "Tiffany & Co.", "Van Cleef & Arpels", "Loro Piana", "Brunello Cucinelli", "Tom Ford", "Armani"],
    slugs: ["louis-vuitton", "chanel", "hermes", "gucci", "dior", "rolex", "prada", "cartier", "burberry", "bottega-veneta", "saint-laurent", "versace", "balenciaga", "fendi", "tiffany-co", "van-cleef-arpels", "loro-piana", "brunello-cucinelli", "tom-ford-2", "armani"]
  },
  {
    slug: "greatest-sports-brand", name: "Greatest Sports Brand", group: "Brands",
    people: ["Nike", "Adidas", "Puma", "Under Armour", "New Balance", "Reebok", "Jordan Brand", "Asics", "Lululemon", "Patagonia", "The North Face", "Wilson", "Yonex", "Fila", "Umbro", "Mizuno", "Oakley", "Converse", "Vans", "Champion"],
    slugs: ["nike-2", "adidas", "puma", "under-armour", "new-balance", "reebok", "jordan-brand", "asics", "lululemon", "patagonia", "the-north-face", "wilson", "yonex", "fila", "umbro", "mizuno", "oakley", "converse", "vans", "champion"]
  },
  {
    slug: "greatest-tech-brand", name: "Greatest Tech Brand", group: "Brands",
    people: ["Apple", "Microsoft", "Google", "Samsung", "Sony", "Nvidia", "Intel", "Amazon", "Dell", "Lenovo", "HP", "IBM", "Meta", "Tesla", "Nintendo", "Adobe", "Oracle", "Qualcomm", "LG", "Xiaomi"],
    slugs: ["apple-2", "microsoft-2", "google-2", "samsung-2", "sony", "nvidia-2", "intel", "amazon-2", "dell", "lenovo", "hp", "ibm", "meta-2", "tesla-2", "nintendo", "adobe", "oracle", "qualcomm", "lg", "xiaomi"]
  },
  {
    slug: "greatest-car-brand", name: "Greatest Car Brand", group: "Brands",
    people: ["Toyota", "Mercedes-Benz", "BMW", "Porsche", "Ferrari", "Lamborghini", "Ford", "Honda", "Volkswagen", "Audi", "Rolls-Royce", "Tesla", "Lexus", "Chevrolet", "Nissan", "Volvo", "McLaren", "Aston Martin", "Bentley", "Bugatti"],
    slugs: ["toyota-2", "mercedes-benz", "bmw", "porsche", "ferrari-2", "lamborghini", "ford", "honda", "volkswagen", "audi", "rolls-royce", "tesla-3", "lexus", "chevrolet", "nissan", "volvo", "mclaren-2", "aston-martin", "bentley", "bugatti"]
  },
  {
    slug: "greatest-sneaker-brand", name: "Greatest Sneaker Brand", group: "Brands",
    people: ["Nike", "Adidas", "Jordan", "New Balance", "Puma", "Converse", "Vans", "Reebok", "ASICS", "Skechers", "Fila", "Under Armour", "On", "Hoka", "Saucony", "Brooks", "Salomon", "Yeezy", "Veja", "Timberland"],
    slugs: ["nike-3", "adidas-2", "jordan-2", "new-balance-2", "puma-2", "converse-2", "vans-2", "reebok-2", "asics-2", "skechers", "fila-2", "under-armour-2", "on", "hoka", "saucony", "brooks", "salomon", "yeezy", "veja", "timberland"]
  },
  {
    slug: "greatest-car", name: "Greatest Car", group: "Cars",
    people: ["Porsche 911", "McLaren F1", "Toyota Land Cruiser", "Mercedes-Benz 300 SL", "Ford Mustang", "Chevrolet Corvette", "Honda Civic", "Volkswagen Beetle", "Toyota Supra", "BMW M3", "Audi Quattro", "Lamborghini Miura", "Ferrari F40", "Mazda MX-5", "Nissan GT-R", "Jaguar E-Type", "Mercedes-Benz S-Class", "Tesla Model S", "Ford GT40", "Porsche 959"],
    slugs: ["porsche-911", "mclaren-f1", "toyota-land-cruiser", "mercedes-benz-300-sl", "ford-mustang", "chevrolet-corvette", "honda-civic", "volkswagen-beetle", "toyota-supra", "bmw-m3", "audi-quattro", "lamborghini-miura", "ferrari-f40", "mazda-mx-5", "nissan-gt-r", "jaguar-e-type", "mercedes-benz-s-class", "tesla-model-s", "ford-gt40", "porsche-959"]
  },
  {
    slug: "greatest-supercar", name: "Greatest Supercar", group: "Cars",
    people: ["McLaren F1", "Ferrari F40", "Lamborghini Miura", "Ferrari Enzo", "Porsche Carrera GT", "Mercedes-Benz SLR McLaren", "Lamborghini Countach", "Ferrari LaFerrari", "McLaren P1", "Porsche 918 Spyder", "Lamborghini Aventador", "Ferrari 288 GTO", "Bugatti Veyron", "Pagani Zonda", "Pagani Huayra", "Ford GT", "Aston Martin One-77", "Lexus LFA", "Ferrari 458 Italia", "Lamborghini Huracán"],
    slugs: ["mclaren-f1-2", "ferrari-f40-2", "lamborghini-miura-2", "ferrari-enzo", "porsche-carrera-gt", "mercedes-benz-slr-mclaren", "lamborghini-countach", "ferrari-laferrari", "mclaren-p1", "porsche-918-spyder", "lamborghini-aventador", "ferrari-288-gto", "bugatti-veyron", "pagani-zonda", "pagani-huayra", "ford-gt", "aston-martin-one-77", "lexus-lfa", "ferrari-458-italia", "lamborghini-huracan"]
  },
  {
    slug: "greatest-hypercar", name: "Greatest Hypercar", group: "Cars",
    people: ["McLaren F1", "Bugatti Veyron", "Bugatti Chiron", "Mercedes-AMG One", "Koenigsegg Jesko", "Pagani Huayra", "McLaren P1", "Porsche 918 Spyder", "Ferrari LaFerrari", "Rimac Nevera", "Koenigsegg Agera RS", "Aston Martin Valkyrie", "Gordon Murray T.50", "Bugatti Bolide", "Pagani Utopia", "SSC Tuatara", "Hennessey Venom F5", "Ferrari F80", "McLaren Speedtail", "Lamborghini Revuelto"],
    slugs: ["mclaren-f1-3", "bugatti-veyron-2", "bugatti-chiron", "mercedes-amg-one", "koenigsegg-jesko", "pagani-huayra-2", "mclaren-p1-2", "porsche-918-spyder-2", "ferrari-laferrari-2", "rimac-nevera", "koenigsegg-agera-rs", "aston-martin-valkyrie", "gordon-murray-t-50", "bugatti-bolide", "pagani-utopia", "ssc-tuatara", "hennessey-venom-f5", "ferrari-f80", "mclaren-speedtail", "lamborghini-revuelto"]
  },
  {
    slug: "greatest-sports-car", name: "Greatest Sports Car", group: "Cars",
    people: ["Porsche 911", "Mazda MX-5", "Chevrolet Corvette", "Toyota Supra", "Nissan GT-R", "Honda NSX", "Jaguar E-Type", "BMW M3", "Ford Mustang", "Chevrolet Camaro", "Audi TT", "Subaru WRX STI", "Mitsubishi Lancer Evolution", "Lotus Elise", "Toyota MR2", "Nissan 240Z", "Alpine A110", "Toyota GR86", "Honda S2000", "Porsche Cayman"],
    slugs: ["porsche-911-2", "mazda-mx-5-2", "chevrolet-corvette-2", "toyota-supra-2", "nissan-gt-r-2", "honda-nsx", "jaguar-e-type-2", "bmw-m3-2", "ford-mustang-2", "chevrolet-camaro", "audi-tt", "subaru-wrx-sti", "mitsubishi-lancer-evolution", "lotus-elise", "toyota-mr2", "nissan-240z", "alpine-a110", "toyota-gr86", "honda-s2000", "porsche-cayman"]
  },
  {
    slug: "greatest-f1-car", name: "Greatest F1 Car", group: "Cars",
    people: ["McLaren MP4/4", "Ferrari F2004", "Red Bull RB19", "Mercedes W11", "Williams FW14B", "Ferrari F2002", "McLaren MP4/13", "Lotus 79", "Ferrari 312T", "Mercedes W07", "Red Bull RB9", "Williams FW15C", "McLaren MP4/2", "Ferrari F310B", "Lotus 49", "Brabham BT52", "Ferrari F1-2000", "Red Bull RB7", "Mercedes W196"],
    slugs: ["mclaren-mp4-4", "ferrari-f2004", "red-bull-rb19", "mercedes-w11", "williams-fw14b", "ferrari-f2002", "mclaren-mp4-13", "lotus-79", "ferrari-312t", "mercedes-w07", "red-bull-rb9", "williams-fw15c", "mclaren-mp4-2", "ferrari-f310b", "lotus-49", "brabham-bt52", "ferrari-f1-2000", "red-bull-rb7", "mercedes-w196"]
  }
];

export const BOARD_COUNT = BOARDS.length;
export const PERSON_COUNT = BOARDS.reduce((n, b) => n + b.people.length, 0);

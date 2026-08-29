/* GOAT.lol — resolving one contender to one Wikimedia Commons file.
 *
 * This is the only code in the project that talks to Wikimedia, and nothing
 * calls it while a page is rendering. It runs from scripts/resolve-images.mjs
 * across everybody, and from api/photo.js for the stragglers and for anyone
 * added through a board for $1.
 *
 * The bar is CORRECT over FAST. There are four Michael Jordans with articles
 * and only one of them played basketball, so a name alone is not a query.
 * Everything below exists to make a wrong face harder to accept than no face.
 */

const ENDPOINTS = {
  commons: process.env.COMMONS_API || 'https://commons.wikimedia.org/w/api.php',
  wiki: process.env.WIKI_API || 'https://en.wikipedia.org/w/api.php'
};

/* Wikimedia's User-Agent policy asks for a real site and a way to reach a
   human, and their edge blocks generic agents from cloud IPs — which is what
   a serverless function is. Vercel supplies the domain itself. */
const SITE = process.env.WIKI_SITE ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '';
const CONTACT = process.env.WIKI_CONTACT || '';
export const UA = process.env.WIKI_UA || ('GOATdotLOL/1.0 (' +
  ([SITE ? 'https://' + SITE.replace(/^https?:\/\//, '') : 'https://github.com/lochanjune1721-eng/outhire',
    CONTACT].filter(Boolean).join('; ')) + ')');

/* The width stored in wikimedia_thumbnail_url. Cards render between 30px and
   280px, so 320 covers every one of them at 1x and most at 2x; the client
   derives the rest from this URL. Deliberately not the original — a 4000px
   press photo behind a 64px avatar is the whole problem. */
export const BASE_THUMB_WIDTH = 320;

/* The sizes we keep in our own bucket. 100 for list rows, 300 for the top of
   a board, 800 for a person page — the three the CSS actually renders.
   Wikimedia's thumbnailer produces them exactly, so nothing here has to
   decode or resize an image and the deploy keeps its zero dependencies. */
export const SELF_SIZES = [100, 300, 800];

/* A Wikimedia thumbnail URL at a different width. The width lives in the file
   name, and asking for more pixels than the source has is answered with a 400
   rather than a 404 — hence the cap. */
export function thumbAt(url, width, originalWidth) {
  if (!url) return null;
  const want = originalWidth ? Math.min(width, originalWidth) : width;
  return url.replace(/\/(\d+)px-/, `/${Math.round(want)}px-`);
}

// Freely reusable with attribution. Everything else is skipped, fair use included.
const OK_LICENCE = [
  /^cc0/i, /^cc[ -]by([ -]sa)?([ -][\d.]+)?/i, /public domain/i, /^pd[- ]/i,
  /^attribution$/i, /free art license/i, /^gfdl/i
];
export const licenceOk = (s) => !!s && OK_LICENCE.some((r) => r.test(String(s).trim()));

const strip = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* Wikipedia's REST summary appends UTM parameters to image URLs, and they
   survive .pop() straight into a Commons title, which then matches nothing. */
const clean = (u) => String(u || '').split('#')[0].split('?')[0];

/* The article title out of a wikipedia_url. decodeURIComponent throws on a
   malformed escape — '%zz' — and one such value on one row of a $1 board add
   would reject the whole batch of a hundred and twenty, every run, forever.
   A title we cannot decode simply misses and falls through to the search. */
function titleFromUrl(url) {
  const raw = String(url || '').split('/wiki/')[1] || '';
  try { return decodeURIComponent(raw).replace(/_/g, ' '); }
  catch { return raw.replace(/_/g, ' '); }
}

// NFD then drop combining marks, so Pelé and Pele are the same name.
const fold = (s) => String(s || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase();
const words = (s) => fold(s).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);

/* ---------------------------------------------------------------------------
   DISAMBIGUATION CONTEXT

   What turns "Michael Jordan" into a query that cannot come back with the
   actuary of the same name. Keyed by the board's group, because that is what
   the data already carries; `q` is appended to the search, and `expect` is
   what the article has to talk about for the match to count as verified.
   --------------------------------------------------------------------------- */
const CONTEXT = {
  Football:      { q: 'footballer', expect: ['football', 'footballer', 'soccer', 'midfielder', 'striker', 'defender', 'goalkeeper', 'manager', 'club', 'league'] },
  Cricket:       { q: 'cricketer', expect: ['cricket', 'cricketer', 'batsman', 'batter', 'bowler', 'wicket', 'test match'] },
  Basketball:    { q: 'basketball', expect: ['basketball', 'nba', 'wnba', 'guard', 'forward', 'center'] },
  Tennis:        { q: 'tennis player', expect: ['tennis', 'grand slam', 'wimbledon', 'atp', 'wta'] },
  Combat:        { q: 'fighter boxer', expect: ['boxer', 'boxing', 'mixed martial', 'mma', 'ufc', 'wrestler', 'wrestling', 'champion'] },
  Motorsport:    { q: 'racing driver', expect: ['racing', 'formula one', 'f1', 'driver', 'motorsport', 'rally', 'motogp'] },
  Sport:         { q: 'athlete', expect: ['athlete', 'olympic', 'sport', 'champion', 'swimmer', 'runner', 'gymnast', 'golfer'] },
  'Mind sports': { q: 'chess player', expect: ['chess', 'grandmaster', 'poker', 'go player', 'world champion'] },
  Screen:        { q: 'actor film', expect: ['actor', 'actress', 'film', 'director', 'movie', 'television', 'series', 'cinema'] },
  Music:         { q: 'musician', expect: ['musician', 'singer', 'band', 'album', 'rapper', 'composer', 'songwriter', 'music'] },
  Mind:          { q: 'scientist', expect: ['scientist', 'physicist', 'mathematician', 'philosopher', 'theory', 'nobel', 'research'] },
  Words:         { q: 'writer', expect: ['writer', 'author', 'novel', 'poet', 'journalist', 'literature', 'book'] },
  Power:         { q: 'politician leader', expect: ['president', 'prime minister', 'politician', 'leader', 'statesman', 'chancellor', 'monarch'] },
  War:           { q: 'military commander', expect: ['general', 'military', 'commander', 'army', 'war', 'admiral', 'battle'] },
  Business:      { q: 'businessperson', expect: ['businessman', 'businesswoman', 'entrepreneur', 'founder', 'ceo', 'investor', 'company'] },
  Culture:       { q: '', expect: [] },
  Internet:      { q: 'internet personality', expect: ['youtuber', 'streamer', 'internet', 'creator', 'podcast', 'influencer'] },
  Tech:          { q: 'technology', expect: ['software', 'computer', 'engineer', 'programmer', 'technology', 'company', 'founder'] },
  History:       { q: '', expect: ['born', 'died', 'century', 'empire', 'ancient', 'historical'] },
  Fiction:       { q: 'fictional character', expect: ['fictional', 'character', 'novel', 'film', 'series', 'franchise'] },
  Food:          { q: '', expect: ['chef', 'restaurant', 'cuisine', 'food', 'dish', 'cooking'] },
  Brands:        { q: 'company brand', expect: ['company', 'brand', 'corporation', 'founded', 'products'] },
  Cars:          { q: 'car', expect: ['car', 'automobile', 'vehicle', 'model', 'manufacturer', 'engine'] }
};

/* Some boards are about a thing, not a person, and the query has to say so or
   "Real Madrid" competes with every player who ever wore the shirt. */
function boardHint(board) {
  const n = fold(board || '');
  if (/\bclub\b|\bteam\b|\bfranchise\b/.test(n)) return 'club team';
  if (/\bfilm\b|\bmovie\b/.test(n)) return 'film';
  if (/\balbum\b/.test(n)) return 'album';
  if (/\bsong\b/.test(n)) return 'song';
  if (/\bcompany\b|\bbrand\b/.test(n)) return 'company';
  if (/\bcar\b/.test(n)) return 'car';
  if (/\bcharacter\b/.test(n)) return 'fictional character';
  if (/\bmanager\b|\bcoach\b/.test(n)) return 'manager coach';
  return '';
}

/* Exported so scripts/resolve-images.mjs can group rows by the context they
   actually resolve under, rather than by name alone. */
export function contextFor(group, board) {
  const c = CONTEXT[group] || { q: '', expect: [] };
  const hint = boardHint(board);
  return { q: [hint, c.q].filter(Boolean).join(' '), expect: c.expect };
}

/* ---------------------------------------------------------------------------
   HTTP — one place, so the retry policy and the User-Agent cannot drift.
   --------------------------------------------------------------------------- */

export class WikiError extends Error {
  constructor(msg, status) { super(msg); this.status = status; }
}

async function api(which, params, { timeout = 8000 } = {}) {
  const url = `${ENDPOINTS[which]}?` + new URLSearchParams({ format: 'json', ...params });
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(timeout)
  });
  /* A refusal is not an answer. Returning null on a 403 or a 429 would turn a
     site-wide block into "this person has no photo", 2,926 times over. */
  if (!res.ok) throw new WikiError(`${which} returned ${res.status}`, res.status);
  return res.json();
}

/* ---------------------------------------------------------------------------
   STEP 1 — find the article, and make sure it is the right one.
   --------------------------------------------------------------------------- */

/** Candidate articles for a name, best first. */
async function searchArticles(name, ctx) {
  const q = [name, ctx.q].filter(Boolean).join(' ');
  const body = await api('wiki', {
    action: 'query', list: 'search', srsearch: q, srlimit: '5', srnamespace: '0'
  });
  return (body?.query?.search || []).map((r) => r.title);
}

/** The lead image and description for one article title. */
async function article(title) {
  const body = await api('wiki', {
    action: 'query', titles: title, redirects: '1',
    prop: 'pageimages|extracts|pageprops',
    piprop: 'original|name', exintro: '1', explaintext: '1', exchars: '600'
  });
  const page = Object.values(body?.query?.pages || {})[0];
  if (!page || page.missing !== undefined) return null;
  // A disambiguation page has no subject and therefore no correct photo.
  if (page.pageprops && 'disambiguation' in page.pageprops) {
    return { title: page.title, disambiguation: true };
  }
  return {
    title: page.title,
    file: page.pageimage ? String(page.pageimage).replace(/_/g, ' ') : null,
    extract: page.extract || ''
  };
}

/* How well an article answers for this contender.

   Two independent questions, because they fail independently: is this the
   right *name*, and is it the right *person with that name*. A title match
   alone is what hands you the wrong Michael Jordan. */
function score(name, art, ctx) {
  const want = words(name);
  const got = words(art.title);
  const surname = want[want.length - 1];

  const nameHit = want.filter((w) => got.includes(w)).length / Math.max(1, want.length);
  const exact = fold(art.title) === fold(name);
  // A parenthetical qualifier is Wikipedia telling us it disambiguated for us:
  // "Michael Jordan (basketball)" is a stronger signal than a bare title.
  const qualifier = (art.title.match(/\(([^)]+)\)/) || [])[1] || '';

  const hay = fold((art.extract || '') + ' ' + (art.description || '') + ' ' + qualifier);
  const ctxHit = ctx.expect.length ? ctx.expect.some((k) => hay.includes(fold(k))) : true;
  // The article should also be about someone with this name, not merely
  // mention them. Lead sentences name their subject.
  const subject = surname
    ? fold((art.extract || '') + ' ' + (art.description || '')).slice(0, 240).includes(surname)
    : false;

  return { nameHit, exact, ctxHit, subject, qualifier,
           surnameInTitle: surname ? got.includes(surname) : false };
}

/* ---------------------------------------------------------------------------
   THE SAME TWO LOOKUPS, IN BULK

   One person at a time costs three or four API calls, so 2,926 people is
   roughly nine thousand requests — hours of wall clock and far more load on
   Wikimedia than this deserves. The API takes up to twenty titles per query
   and fifty for file info, which turns the whole job into a couple of hundred
   requests. Faster for us and politer to them, which is rare.
   --------------------------------------------------------------------------- */

/** MediaWiki rewrites the titles you asked for. Follow the trail back. */
function titleFollower(body) {
  const hop = new Map();
  for (const n of body?.query?.normalized || []) hop.set(n.from, n.to);
  for (const r of body?.query?.redirects || []) hop.set(r.from, r.to);
  return (t) => {
    let cur = t;
    for (let i = 0; i < 5 && hop.has(cur); i++) cur = hop.get(cur);
    return cur;
  };
}

const pagesByTitle = (body) => {
  const m = new Map();
  for (const p of Object.values(body?.query?.pages || {})) m.set(p.title, p);
  return m;
};

/* Twenty, because prop=extracts caps there. prop=description comes from
   Wikidata and would allow fifty, but it is the extract that names the
   subject, and one call for twenty is already thirty times better than
   twenty calls for one. */
const ARTICLE_BATCH = 20;
const FILE_BATCH = 50;

/* Three batches in flight is sixty titles at a time. Wikimedia asks bulk
   clients to be considerate rather than serial, and three connections against
   a couple of hundred total requests is a much lighter footprint than the nine
   thousand single lookups this replaces. */
const BATCH_CONCURRENCY = 3;

async function inChunks(items, size, concurrency, fn) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  const out = [];
  for (let i = 0; i < chunks.length; i += concurrency) {
    out.push(...await Promise.all(chunks.slice(i, i + concurrency).map(fn)));
  }
  return out;
}

async function articleMany(titles) {
  const out = new Map();
  const uniq = [...new Set(titles.filter(Boolean))];
  await inChunks(uniq, ARTICLE_BATCH, BATCH_CONCURRENCY, async (slice) => {
    const body = await api('wiki', {
      action: 'query', titles: slice.join('|'), redirects: '1',
      prop: 'pageimages|pageprops|description|extracts',
      piprop: 'original|name', ppprop: 'disambiguation',
      exintro: '1', explaintext: '1', exchars: '500', exlimit: String(ARTICLE_BATCH)
    });
    const follow = titleFollower(body);
    const byTitle = pagesByTitle(body);
    for (const t of slice) {
      const page = byTitle.get(follow(t));
      if (!page || page.missing !== undefined) { out.set(t, null); continue; }
      if (page.pageprops && 'disambiguation' in page.pageprops) {
        out.set(t, { title: page.title, disambiguation: true });
        continue;
      }
      out.set(t, {
        title: page.title,
        file: page.pageimage ? String(page.pageimage).replace(/_/g, ' ') : null,
        extract: page.extract || '',
        description: page.description || ''
      });
    }
  });
  return out;
}

async function fileInfoMany(fileTitles, width) {
  const out = new Map();
  let want = [...new Set(fileTitles.filter(Boolean))]
    .map((f) => (f.startsWith('File:') ? f : 'File:' + f));

  /* Commons holds most of them; a lead image uploaded straight to en.wikipedia
     is genuinely absent there, and en.wikipedia's api.php answers for local
     and Commons files alike. Ask Commons for everything, then only the
     stragglers of the second. */
  for (const which of ['commons', 'wiki']) {
    if (!want.length) break;
    const missed = [];
    await inChunks(want, FILE_BATCH, BATCH_CONCURRENCY, async (slice) => {
      const body = await api(which, {
        action: 'query', titles: slice.join('|'),
        prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: String(width)
      });
      const follow = titleFollower(body);
      const byTitle = pagesByTitle(body);
      for (const t of slice) {
        const page = byTitle.get(follow(t));
        const info = page?.imageinfo?.[0];
        if (info) out.set(t, { info, page, host: which });
        else missed.push(t);
      }
    });
    want = missed;
  }
  return out;
}

/**
 * Resolve a whole batch of contenders at once.
 *
 * @param {Array<{name, board?, group?, wikipedia_url?}>} people
 * @returns {Promise<Array<object>>} one result per person, in the same order.
 */
export async function resolveMany(people) {
  const ctxs = people.map((p) => contextFor(p.group, p.board));

  /* One title each to start with: whatever the seed data says, or the name.
     A given wikipedia_url is authoritative and skips a guess. */
  const first = people.map((p) => (p.wikipedia_url && titleFromUrl(p.wikipedia_url)) || p.name);

  let arts = await articleMany(first);

  /* Where the seed title missed, the plain name is worth one more batch —
     still one request per twenty people, not one per person. */
  const retry = [];
  people.forEach((p, i) => {
    const a = arts.get(first[i]);
    if ((!a || a.disambiguation || !a.file) && first[i] !== p.name) retry.push(p.name);
  });
  if (retry.length) {
    const more = await articleMany(retry);
    for (const [k, v] of more) arts.set(k, v);
  }

  const chosen = new Array(people.length).fill(null);
  const scores = new Array(people.length).fill(null);
  const needSearch = [];

  people.forEach((p, i) => {
    for (const t of [first[i], p.name]) {
      const a = arts.get(t);
      if (!a || a.disambiguation || !a.file) continue;
      const sc = score(p.name, a, ctxs[i]);
      if (!chosen[i] || sc.exact || sc.nameHit === 1) { chosen[i] = a; scores[i] = sc; }
      if (sc.exact || sc.nameHit === 1) break;
    }
    if (!chosen[i]) needSearch.push(i);
  });

  /* Search is the only step that cannot be batched — list=search takes one
     query. It is also the rare path once the direct titles have run, and the
     concurrency is what keeps a batch of a hundred from serialising on it. */
  for (let i = 0; i < needSearch.length; i += 4) {
    await Promise.all(needSearch.slice(i, i + 4).map(async (idx) => {
      const p = people[idx], ctx = ctxs[idx];
      /* Deliberately not caught. A 429 or a UA block here is Wikimedia
         refusing this deployment, and swallowing it turned a retryable
         failure into a durable "no article with a lead image" written to the
         row — the exact 2,926-way silent wrong answer the rest of this file
         exists to prevent. Let it reach runBatch, which leaves every row in
         the batch untouched. */
      const hits = await searchArticles(p.name, ctx);
      const found = await articleMany(hits.slice(0, 3));
      for (const t of hits.slice(0, 3)) {
        const a = found.get(t);
        if (!a || a.disambiguation || !a.file) continue;
        const sc = score(p.name, a, ctx);
        if (!sc.surnameInTitle) continue;
        if (!chosen[idx] || sc.ctxHit) { chosen[idx] = a; scores[idx] = sc; }
        if (sc.ctxHit) break;
      }
    }));
  }

  const files = await fileInfoMany(chosen.map((a) => a?.file), BASE_THUMB_WIDTH);

  return people.map((p, i) => {
    const art = chosen[i];
    if (!art?.file) {
      return { image_status: 'missing', image_note: 'no article with a lead image' };
    }
    const key = art.file.startsWith('File:') ? art.file : 'File:' + art.file;
    const found = files.get(key);
    if (!found) {
      return { image_status: 'missing',
               image_note: `file not found on Commons or en.wikipedia: ${art.file}` };
    }
    const { info, page } = found;
    const bad = usable(info);
    if (bad) return { image_status: 'missing', image_note: bad };

    const { licence, author } = licenceOf(info);
    if (!licenceOk(licence)) {
      return { image_status: 'missing', image_note: `licence not reusable (${licence || 'unknown'})` };
    }

    /* Confident when the name matched outright and the article talks about the
       right field. Anything less gets an image AND a flag: an uncertain match
       is never attached silently. */
    const sc = scores[i] || {};
    const confident = (sc.exact || sc.nameHit === 1) && sc.ctxHit && (sc.subject || sc.exact);
    return {
      image_status: confident ? 'verified' : 'needs_review',
      image_note: confident ? null
        : `matched "${art.title}" but ` + (!sc.ctxHit
            ? 'the article does not mention ' + (p.group || 'this field')
            : 'the name is not an exact match'),
      wikimedia_file_title: page.title,
      wikimedia_page_url: info.descriptionurl ||
        `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      wikimedia_original_url: clean(info.url),
      wikimedia_thumbnail_url: clean(info.thumburl),
      wikimedia_width: info.width || null,
      wikimedia_height: info.height || null,
      image_license: licence,
      image_author: author,
      article_title: art.title
    };
  });
}

/* ---------------------------------------------------------------------------
   STEP 2 — the file itself: licence, dimensions, and a thumbnail.
   --------------------------------------------------------------------------- */

/** imageinfo for one File: title, asking Wikimedia to size the thumbnail. */
async function fileInfo(fileTitle, width) {
  const title = fileTitle.startsWith('File:') ? fileTitle : 'File:' + fileTitle;
  const params = {
    action: 'query', titles: title, prop: 'imageinfo',
    iiprop: 'url|size|extmetadata|mime', iiurlwidth: String(width)
  };
  /* Commons holds most of them. A lead image uploaded straight to en.wikipedia
     is genuinely absent from Commons, and en.wikipedia's api.php answers for
     local files and Commons files alike — so it is the right second ask. */
  for (const which of ['commons', 'wiki']) {
    const body = await api(which, params);
    const page = Object.values(body?.query?.pages || {})[0];
    const info = page?.imageinfo?.[0];
    if (info) return { info, page, host: which };
  }
  return null;
}

const IMAGE_MIME = /^image\/(jpeg|png|webp|gif)$/;

/* Wikimedia hands back a thumbnail URL only when it can scale the file. Some
   lead images are SVG logos or PDFs; those get a rendered PNG thumb, which is
   fine, but the mime check keeps out anything with no sensible raster form. */
function usable(info) {
  if (!info.thumburl) return 'Wikimedia produced no thumbnail for this file';
  if (!IMAGE_MIME.test(info.mime || '') && !/\.svg$/i.test(info.url || '')) {
    return `unsupported file type (${info.mime || 'unknown'})`;
  }
  return null;
}

function licenceOf(info) {
  const em = info.extmetadata || {};
  return {
    licence: strip(em.LicenseShortName?.value),
    author: strip(em.Artist?.value) || 'Wikimedia Commons'
  };
}

/* ---------------------------------------------------------------------------
   RESOLVE — the whole thing, with an account of what it did.
   --------------------------------------------------------------------------- */

/**
 * @param {{name: string, board?: string, group?: string, wikipedia_url?: string}} person
 * @returns {Promise<object>} a row-shaped result; never throws for "not found",
 *   always throws for "Wikimedia refused us", because those need opposite fixes.
 */
export async function resolveImage(person, steps = []) {
  const ctx = contextFor(person.group, person.board);
  const note = (s) => steps.push(s);

  /* An article title we were given beats one we guessed. The seed data carries
     wikipedia_url for some people and it is authoritative. */
  const titles = [];
  const given = person.wikipedia_url && titleFromUrl(person.wikipedia_url);
  if (given) titles.push(given);
  titles.push(person.name);

  let best = null, bestScore = null;
  for (const t of titles) {
    const art = await article(t);
    if (!art || art.disambiguation) {
      note({ step: 'article', title: t, found: false, disambiguation: !!art?.disambiguation });
      continue;
    }
    const sc = score(person.name, art, ctx);
    note({ step: 'article', title: art.title, file: art.file, ...sc });
    if (art.file && (sc.exact || sc.nameHit === 1)) { best = art; bestScore = sc; break; }
    if (art.file && !best) { best = art; bestScore = sc; }
  }

  // Direct titles missed, or hit a page with no lead image. Search instead.
  if (!best || !best.file) {
    for (const t of await searchArticles(person.name, ctx)) {
      const art = await article(t);
      if (!art || art.disambiguation || !art.file) continue;
      const sc = score(person.name, art, ctx);
      note({ step: 'search', title: art.title, file: art.file, ...sc });
      if (!sc.surnameInTitle) continue;          // not even the right name
      if (sc.ctxHit) { best = art; bestScore = sc; break; }
      if (!best) { best = art; bestScore = sc; }
    }
  }

  if (!best || !best.file) {
    return { image_status: 'missing', image_note: 'no article with a lead image', steps };
  }

  const found = await fileInfo(best.file, BASE_THUMB_WIDTH);
  if (!found) {
    return { image_status: 'missing', image_note: `file not found on Commons or en.wikipedia: ${best.file}`, steps };
  }
  const { info, page, host } = found;
  note({ step: 'file', host, title: page.title, width: info.width, height: info.height, mime: info.mime });

  const bad = usable(info);
  if (bad) return { image_status: 'missing', image_note: bad, steps };

  const { licence, author } = licenceOf(info);
  note({ step: 'licence', licence, acceptable: licenceOk(licence) });
  if (!licenceOk(licence)) {
    /* Not a failure to fix — a file we are not entitled to use. Recording the
       licence means a human can tell "no free photo exists" apart from "the
       lookup broke", which is the difference between waiting and working. */
    return { image_status: 'missing', image_note: `licence not reusable (${licence || 'unknown'})`, steps };
  }

  /* Confident when the name matched outright and the article talks about the
     right field. Anything less gets an image AND a flag: the spec is that an
     uncertain match must never be attached silently, so it is stored where a
     human can see it and the site keeps showing initials until they say yes. */
  const confident = (bestScore.exact || bestScore.nameHit === 1) && bestScore.ctxHit &&
                    (bestScore.subject || bestScore.exact);
  const why = !confident
    ? `matched "${best.title}" but ${!bestScore.ctxHit ? 'the article does not mention ' + (person.group || 'this field')
        : 'the name is not an exact match'}`
    : null;

  return {
    image_status: confident ? 'verified' : 'needs_review',
    image_note: why,
    wikimedia_file_title: page.title,
    wikimedia_page_url: info.descriptionurl ||
      `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
    wikimedia_original_url: clean(info.url),
    wikimedia_thumbnail_url: clean(info.thumburl),
    wikimedia_width: info.width || null,
    wikimedia_height: info.height || null,
    image_license: licence,
    image_author: author,
    article_title: best.title,
    steps
  };
}

/** The columns resolveImage() produces that belong on a people row. */
export function imageRow(r) {
  return {
    wikimedia_file_title: r.wikimedia_file_title ?? null,
    wikimedia_page_url: r.wikimedia_page_url ?? null,
    wikimedia_original_url: r.wikimedia_original_url ?? null,
    wikimedia_thumbnail_url: r.wikimedia_thumbnail_url ?? null,
    wikimedia_width: r.wikimedia_width ?? null,
    wikimedia_height: r.wikimedia_height ?? null,
    image_license: r.image_license ?? null,
    image_author: r.image_author ?? null,
    image_status: r.image_status,
    image_note: r.image_note ?? null,
    image_last_checked: new Date().toISOString()
  };
}

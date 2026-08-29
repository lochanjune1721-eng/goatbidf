#!/usr/bin/env node
/* GOAT.lol — resolve every contender to a Wikimedia Commons image, once.
 *
 *   node scripts/resolve-images.mjs                 # everything outstanding
 *   node scripts/resolve-images.mjs --status=needs_review --recheck
 *   node scripts/resolve-images.mjs --board=greatest-footballer
 *   node scripts/resolve-images.mjs --limit=50 --dry-run
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment or
 * from .env.local. Zero dependencies: fetch and node: builtins only.
 *
 * This is the one-time pass. Afterwards the site reads wikimedia_thumbnail_url
 * straight out of Postgres and never calls Wikimedia while a page renders.
 *
 * It is resumable. Interrupt it, run it again, and it picks up whatever is
 * still outstanding — the work already done is in the database, not in memory.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolveImage, imageRow, WikiError, UA } from '../api/_wikimedia.js';

/* ------------------------------- options -------------------------------- */

const argv = process.argv.slice(2);
const flag = (n, d = null) => {
  const hit = argv.find((a) => a === `--${n}` || a.startsWith(`--${n}=`));
  if (!hit) return d;
  return hit.includes('=') ? hit.split('=').slice(1).join('=') : true;
};

const OPTS = {
  status: String(flag('status', 'pending,needs_review')).split(',').map((s) => s.trim()),
  board: flag('board'),
  limit: Number(flag('limit', 0)) || 0,
  batch: Number(flag('batch', 8)) || 8,        // concurrent resolves
  pause: Number(flag('pause', 1000)) || 1000,  // ms between batches
  recheck: !!flag('recheck'),                  // include rows already checked
  dryRun: !!flag('dry-run'),
  verbose: !!flag('verbose')
};

/* Wikimedia asks for serial, considerate access from bulk clients. Eight at a
   time with a second between batches is roughly 5 requests/second sustained,
   which is well inside what they ask for and finishes 2,926 in about 25
   minutes. --batch and --pause exist so you can go slower, not faster. */
if (OPTS.batch > 16) {
  console.error('Refusing --batch above 16. Wikimedia is a donated resource.');
  process.exit(1);
}

/* ------------------------------ environment ------------------------------ */

if (existsSync(new URL('../.env.local', import.meta.url))) {
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or put them in .env.local).');
  process.exit(1);
}

async function sb(path, init = {}) {
  const res = await fetch(`${URL_.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json', ...(init.headers || {})
    }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------- the work -------------------------------- */

/** Everything outstanding, paged past PostgREST's 1000-row ceiling. */
async function outstanding() {
  const cols = 'id,slug,name,wikipedia_url,photo_path,image_status,image_attempts,' +
               'categories(slug,name,group_name)';
  const status = OPTS.status.map(encodeURIComponent).join(',');
  let all = [], from = 0;
  for (;;) {
    let q = `/rest/v1/people?select=${encodeURIComponent(cols)}&image_status=in.(${status})&order=slug`;
    if (OPTS.board) q += `&categories.slug=eq.${encodeURIComponent(OPTS.board)}`;
    /* A row that has been checked recently is skipped unless asked for, so an
       interrupted run resumes instead of starting over. */
    if (!OPTS.recheck) q += '&image_last_checked=is.null';
    const page = await sb(q, { headers: { Range: `${from}-${from + 999}` } });
    all = all.concat(page);
    if (page.length < 1000) break;
    from += 1000;
    if (all.length > 20000) break;
  }
  if (OPTS.board) all = all.filter((p) => p.categories?.slug === OPTS.board);
  return OPTS.limit ? all.slice(0, OPTS.limit) : all;
}

/* Retry only what retrying can fix. A 429 or a 5xx is Wikimedia asking us to
   slow down; a 404 is an answer. Backoff is 2s, 4s, 8s, and it honours
   Retry-After when they send one. */
async function withRetry(fn, label, tries = 4) {
  for (let i = 0; ; i++) {
    try { return await fn(); }
    catch (e) {
      const transient = e instanceof WikiError
        ? (e.status === 429 || e.status >= 500)
        : /timed out|timeout|fetch failed|ECONNRESET|ENOTFOUND|EAI_AGAIN|aborted/i.test(e.message || '');
      if (!transient || i >= tries - 1) throw e;
      const wait = 2000 * 2 ** i;
      console.warn(`   ↻ ${label}: ${e.message} — retrying in ${wait / 1000}s`);
      await sleep(wait);
    }
  }
}

async function main() {
  console.log(`User-Agent: ${UA}`);
  console.log(`Looking for people with image_status in (${OPTS.status.join(', ')})` +
              (OPTS.recheck ? ', including ones already checked' : ', not yet checked') +
              (OPTS.board ? `, on board ${OPTS.board}` : '') + '.');

  const people = await outstanding();
  if (!people.length) { console.log('Nothing outstanding. Done.'); return; }

  /* Duplicate detection. The same person appears on more than one board —
     Johan Cruyff is a great footballer and a great manager — and each is its
     own row with its own slug. Resolving the name once and copying the result
     saves the second lookup and guarantees the two rows agree. */
  const byName = new Map();
  for (const p of people) {
    const k = p.name.toLowerCase();
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(p);
  }
  const dupes = [...byName.values()].filter((g) => g.length > 1);
  console.log(`${people.length} rows, ${byName.size} distinct names` +
              (dupes.length ? ` (${dupes.length} appear on more than one board)` : '') + '.\n');

  const jobs = [...byName.values()];
  const tally = { verified: 0, needs_review: 0, missing: 0, failed: 0 };
  const review = [];
  let done = 0;
  const started = Date.now();

  for (let i = 0; i < jobs.length; i += OPTS.batch) {
    const slice = jobs.slice(i, i + OPTS.batch);
    await Promise.all(slice.map(async (rows) => {
      const p = rows[0];
      const ctx = { name: p.name, board: p.categories?.name, group: p.categories?.group_name,
                    wikipedia_url: p.wikipedia_url };
      let result;
      try {
        result = await withRetry(() => resolveImage(ctx), p.name);
      } catch (e) {
        /* A refusal from Wikimedia is not a verdict about this person. Leave
           the row as it was so a later run picks it up again. */
        tally.failed++; done += rows.length;
        console.warn(`   ✗ ${p.name}: ${e.message}`);
        return;
      }

      tally[result.image_status] = (tally[result.image_status] || 0) + 1;
      if (result.image_status === 'needs_review') {
        review.push({ name: p.name, board: p.categories?.name, note: result.image_note,
                      file: result.wikimedia_file_title, url: result.wikimedia_thumbnail_url });
      }

      if (!OPTS.dryRun) {
        const row = imageRow(result);
        // Every row sharing this name gets the same answer, in one request each.
        for (const r of rows) {
          await sb(`/rest/v1/people?id=eq.${r.id}`, {
            method: 'PATCH', headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ ...row, image_attempts: (r.image_attempts || 0) + 1 })
          });
        }
      }
      done += rows.length;

      const mark = { verified: '✓', needs_review: '?', missing: '·' }[result.image_status] || '·';
      if (OPTS.verbose || result.image_status !== 'verified') {
        console.log(`   ${mark} ${p.name}${rows.length > 1 ? ` (×${rows.length})` : ''}` +
                    (result.image_note ? ` — ${result.image_note}` : ''));
      }
    }));

    const pct = Math.round((done / people.length) * 100);
    const rate = done / ((Date.now() - started) / 1000);
    const left = rate > 0 ? Math.round((people.length - done) / rate) : 0;
    console.log(`[${String(pct).padStart(3)}%] ${done}/${people.length}  ` +
                `✓${tally.verified} ?${tally.needs_review} ·${tally.missing} ✗${tally.failed}  ` +
                `~${Math.floor(left / 60)}m ${left % 60}s left`);

    if (i + OPTS.batch < jobs.length) await sleep(OPTS.pause);
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`verified      ${tally.verified}`);
  console.log(`needs review  ${tally.needs_review}`);
  console.log(`missing       ${tally.missing}`);
  console.log(`failed        ${tally.failed}   (left untouched; run again to retry)`);
  if (OPTS.dryRun) console.log('\n--dry-run: nothing was written.');

  if (review.length) {
    const out = new URL('../image-review.json', import.meta.url);
    writeFileSync(out, JSON.stringify(review, null, 2));
    console.log(`\n${review.length} uncertain matches written to image-review.json.`);
    console.log('Nothing uncertain is shown on the site. Approve them in /admin.html,');
    console.log('or set image_status to verified in Supabase once you have looked.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

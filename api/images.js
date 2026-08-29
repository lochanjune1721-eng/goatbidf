/* /api/images — the resolver, running itself.
 *
 * Nobody should have to press a button for a site to have pictures on it. This
 * drains the queue of unresolved contenders without anyone watching:
 *
 *   - a Vercel cron ticks it once a day (vercel.json)
 *   - any page that notices unresolved people pokes it once per browser session
 *   - /admin.html can start it by hand
 *
 * Whichever starts it, the work happens here, on the server. A single run
 * resolves what fits inside the function's thirty seconds, then hands off to a
 * fresh invocation of itself and returns. One poke therefore drains all 2,926
 * over about an hour, unattended, and stops on its own when there is nothing
 * left. No page ever waits for any of it.
 *
 * Safe to call from anywhere, as often as you like: a lock row means only one
 * chain runs at a time, and it only ever touches rows that are already in the
 * database.
 *
 *   POST /api/images          start a run if one is not already going
 *   GET  /api/images          where things stand; starts nothing
 */
import { webHandler, json, db, count, sbFetch } from './_lib.js';
import { resolveMany, imageRow, SELF_SIZES, thumbAt, UA } from './_wikimedia.js';

const PER_RUN = 120;       // people per invocation — the API takes 20 titles a call
const CACHE_PER_RUN = 40;  // transfers, not lookups, so a different limit
const CACHE_CONCURRENT = 5;
const MAX_PHOTO_ATTEMPTS = 3;
const MAX_CHAIN = 200;
const STALE_MS = 3 * 60 * 1000;

/* ---------------------------------------------------------------------------
   LANES

   One chain is one invocation at a time, which is thirty seconds of work
   followed by thirty seconds of work. Eight chains over disjoint slices of the
   table is eight times the throughput for the same code.

   The slices are slug ranges, chosen so no two lanes can ever see the same
   row — no claiming, no coordination, nothing to get wrong.

   The boundaries look arbitrary because they are measured, not guessed: they
   are the octile cuts of the 2,926 slugs actually in the table. Splitting on
   whole letters instead put a fifth of everyone in the S lane, and the run is
   only as fast as its slowest lane. These land every lane within 12-13%.
   --------------------------------------------------------------------------- */
const LANES = [
  ['', 'bo'], ['bo', 'el'], ['el', 'ha'], ['ha', 'ka'],
  ['ka', 'mi'], ['mi', 'ra'], ['ra', 'su'], ['su', '']
];

function laneFilter(lane) {
  const range = LANES[lane];
  if (!range) return '';
  const [lo, hi] = range;
  return (lo ? `&slug=gte.${lo}` : '') + (hi ? `&slug=lt.${hi}` : '');
}

/* ------------------------------- the lock -------------------------------- */

/** Claim the job, or return null if somebody else already has it. */
async function takeLock() {
  const stale = new Date(Date.now() - STALE_MS).toISOString();
  /* Free, or held by a run that stopped writing heartbeats — a function that
     is killed mid-flight cannot release anything, so without the staleness
     clause one crash would wedge the queue permanently. */
  const rows = await sbFetch(
    `/rest/v1/image_job?id=eq.1&or=(running.is.false,last_beat.lt.${encodeURIComponent(stale)})`,
    { method: 'PATCH', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ running: true, started_at: new Date().toISOString(),
                             last_beat: new Date().toISOString(), note: null }) });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

const beat = (done) => sbFetch('/rest/v1/image_job?id=eq.1', {
  method: 'PATCH', headers: { Prefer: 'return=minimal' },
  body: JSON.stringify({ last_beat: new Date().toISOString(), done })
}).catch(() => {});

const release = (note) => sbFetch('/rest/v1/image_job?id=eq.1', {
  method: 'PATCH', headers: { Prefer: 'return=minimal' },
  body: JSON.stringify({ running: false, last_beat: new Date().toISOString(), note: note || null })
}).catch(() => {});

/* One lane failing is not the run failing. All eight share this lock row, so
   clearing `running` here turns every sibling's next handoff into a stale
   token and abandons seven eighths of the table thirty seconds later. Record
   why this lane stopped and leave the flag alone; the last lane out releases
   it at the finish, and if every lane dies the stale heartbeat in takeLock()
   frees it within STALE_MS — which is exactly what that clause is for.

   Deliberately does not touch last_beat: the staleness clock has to keep
   running from the last batch that actually did something. */
const stopLane = (note) => sbFetch('/rest/v1/image_job?id=eq.1', {
  method: 'PATCH', headers: { Prefer: 'return=minimal' },
  body: JSON.stringify({ note: note || null })
}).catch(() => {});

/* ------------------------------ the handoff ------------------------------ */

function selfUrl() {
  // IMAGES_SELF_URL exists so this can be pointed somewhere real in a test or
  // a local run; without it there is no way to exercise the handoff at all.
  if (process.env.IMAGES_SELF_URL) return process.env.IMAGES_SELF_URL;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host.replace(/^https?:\/\//, '')}/api/images` : null;
}

/* Start the next invocation and do not wait for it to finish — it will run for
   half a minute and this function is about to end. The short timeout is there
   to guarantee the request was actually dispatched before we return; a
   fire-and-forget with no await at all can be killed before it leaves. */
async function handOff(depth, token, lane) {
  const url = selfUrl();
  if (!url) return { ok: false, why: 'no self URL: VERCEL_URL is not set' };
  try {
    await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chain: depth + 1, token, lane }), signal: AbortSignal.timeout(1200)
    });
    return { ok: true };
  } catch (e) {
    /* A timeout is the expected outcome and means the request went: the child
       is off resolving and will not answer inside a second. Anything else —
       DNS, connection refused, TLS — means nothing was dispatched and the
       queue has just stalled, which has to be recorded rather than swallowed
       or the whole thing silently stops with no explanation anywhere. */
    const timedOut = e && (e.name === 'TimeoutError' || e.name === 'AbortError');
    return timedOut ? { ok: true } : { ok: false, why: (e && e.message) || String(e) };
  }
}

/* -------------------------------- the work ------------------------------- */

async function progress() {
  const p = {
    verified: await count('people', 'image_status=eq.verified'),
    needs_review: await count('people', 'image_status=eq.needs_review'),
    missing: await count('people', 'image_status=eq.missing'),
    pending: await count('people', 'image_status=eq.pending'),
    self_hosted: await count('people', 'photo_path=not.is.null'),
    to_cache: await count('people', CACHE_FILTER)
  };
  // What is left to do, of either kind. The chain runs until this is zero.
  p.outstanding = (p.pending || 0) + (p.to_cache || 0);
  return p;
}

/* Identified, but the bytes are still on somebody else's CDN. */
const CACHE_FILTER =
  'image_status=eq.verified&photo_path=is.null&wikimedia_thumbnail_url=not.is.null' +
  `&photo_attempts=lt.${MAX_PHOTO_ATTEMPTS}`;

/* ------------------------------ self-hosting ----------------------------- */

async function upload(path, bytes, type) {
  const base = process.env.SUPABASE_URL.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${base}/storage/v1/object/photos/${path}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': type, 'x-upsert': 'true' },
    body: bytes
  });
  if (!res.ok) {
    // Supabase says why in the body; a bare status number sends you guessing.
    throw new Error(`upload ${path} failed (${res.status}) ` +
      (await res.text().catch(() => '')).slice(0, 160));
  }
}

/** Copy one person's picture into our bucket at every size the site renders.
    Returns the columns to write; the caller batches them into one request. */
async function cacheOne(p) {
  const src = p.wikimedia_thumbnail_url;
  const ext = /\.png$/i.test(src) ? 'png' : /\.webp$/i.test(src) ? 'webp' : 'jpg';
  const file = `${p.slug}.${ext}`;

  // Three independent transfers; no reason to do them one after another.
  await Promise.all(SELF_SIZES.map(async (size) => {
    const url = thumbAt(src, size, p.wikimedia_width);
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`download ${size}px failed (${res.status})`);
    const type = res.headers.get('content-type') || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 5 * 1024 * 1024) throw new Error(`${size}px is over the 5MB bucket limit`);
    await upload(`${size}/${file}`, bytes, type);
  }));

  /* photo_path is the base name only. The site builds 100/300/800 around it,
     so one column describes three files and there is nothing to keep in sync. */
  return { photo_path: file, photo_note: null, photo_attempts: (p.photo_attempts || 0) + 1 };
}

/* upsertMany is INSERT ... ON CONFLICT, so a person deleted between the SELECT
   and this write is recreated as a slugless ghost — invisible to every lane's
   slug range, yet still counted by `outstanding`, so the run can never report
   finished. Nothing legitimate has a null slug: seed.sql, add_person() and the
   admin all set one. */
async function writeBatch(rows) {
  await db.upsertMany('people', rows);
  await db.del('people', 'slug=is.null').catch(() => {});
}

async function cacheBatch(lane) {
  const rows = await db.select('people',
    `${CACHE_FILTER}${laneFilter(lane)}&select=` +
    encodeURIComponent('id,slug,wikimedia_thumbnail_url,wikimedia_width,photo_attempts') +
    `&order=slug&limit=${CACHE_PER_RUN}`);
  if (!rows.length) return { done: 0, failed: 0, empty: true };

  const ok = [], bad = [];
  let lastError = null;
  for (let i = 0; i < rows.length; i += CACHE_CONCURRENT) {
    await Promise.all(rows.slice(i, i + CACHE_CONCURRENT).map(async (p) => {
      try { ok.push({ id: p.id, ...(await cacheOne(p)) }); }
      catch (e) {
        lastError = e.message;
        /* Count the attempt so a file that will never download stops being
           retried, and keep the reason where the admin page can show it. The
           Wikimedia URL still works, so the site loses nothing meanwhile. */
        /* Only count an attempt against something a retry cannot fix. A CDN
           timeout or a 429 is the network having a bad thirty seconds, and
           spending one of three lives on it retires a person permanently for
           no reason. */
        const transient = /\b(429|5\d\d)\b|timeout|timed out|aborted|fetch failed/i.test(e.message);
        bad.push({ id: p.id,
                   photo_attempts: (p.photo_attempts || 0) + (transient ? 0 : 1),
                   photo_note: String(e.message).slice(0, 300) });
      }
    }));
    await beat(ok.length);
  }
  /* Two requests, not one concatenated array: PostgREST requires every object
     in a bulk payload to carry the same keys, and a mixed batch of successes
     and failures has two different shapes. Concatenating them made the whole
     write 400 — silently, so the same forty people were re-downloaded from
     Wikimedia on every pass and photo_attempts never rose to retire them. */
  if (ok.length) await writeBatch(ok);
  if (bad.length) await writeBatch(bad);
  return { done: ok.length, failed: bad.length, lastError, empty: false };
}

async function runBatch(lane) {
  const rows = await db.select('people',
    'image_status=eq.pending' + laneFilter(lane) + '&select=' +
    encodeURIComponent('id,slug,name,wikipedia_url,image_attempts,categories(name,group_name)') +
    `&order=slug&limit=${PER_RUN}`);
  if (!rows.length) return { done: 0, failed: 0, empty: true };

  let results;
  try {
    results = await resolveMany(rows.map((p) => ({
      name: p.name, board: p.categories?.name,
      group: p.categories?.group_name, wikipedia_url: p.wikipedia_url
    })));
  } catch (e) {
    /* The whole batch shares its lookups, so a refusal from Wikimedia fails
       all of them at once — and none of them individually. Leave every row as
       it was; a later run picks them up untouched. */
    return { done: 0, failed: rows.length, lastError: e.message, empty: false };
  }

  const patch = rows.map((p, i) => ({
    id: p.id, ...imageRow(results[i]), image_attempts: (p.image_attempts || 0) + 1
  }));
  await writeBatch(patch);
  await beat(patch.length);

  return { done: patch.length, failed: 0, empty: false };
}

export default webHandler(async function handler(request) {
  /* Vercel cron jobs arrive as GET and the method is not configurable, so the
     nightly tick was landing in the status branch and starting nothing at all.
     It has to be header-gated rather than "any GET starts a run": the admin
     page polls this endpoint every four seconds. */
  const isCron = request.method === 'GET' && !!request.headers.get('x-vercel-cron');

  if (request.method === 'GET' && !isCron) {
    // Looking, not starting. Safe for anything to poll.
    try {
      const p = await progress();
      const job = await db.one('image_job', 'id=eq.1');
      return json({
        progress: p,
        running: !!job?.running,
        last_beat: job?.last_beat || null,
        note: job?.note || null,
        finished: p.outstanding === 0
      });
    } catch (e) {
      return json({ error: 'The image columns are not in this database yet. Run ' +
                           'sql/image-columns.sql in the Supabase SQL editor. (' + e.message + ')' }, 400);
    }
  }
  if (request.method !== 'POST' && !isCron) return json({ error: 'Use POST.' }, 405);

  let depth = 0, token = null, lane = null, force = false;
  try {
    const body = (await request.json().catch(() => ({}))) || {};
    depth = Number(body.chain) || 0;
    token = typeof body.token === 'string' ? body.token : null;
    lane = Number.isInteger(body.lane) ? body.lane : null;
    force = body.force === true;
  } catch { /* no body is fine */ }

  /* A run hands the lock to its lanes rather than releasing it, so a poke
     arriving mid-run is turned away instead of starting a second set alongside
     the first. The token is the run's started_at, which only something holding
     the lock can have read — the table is service-role only. If a lane never
     arrives, the stale heartbeat frees the whole thing anyway. */
  let lock;
  if (depth > 0 && token) {
    const job = await db.one('image_job', 'id=eq.1');
    lock = job && job.running && job.started_at === token ? job : null;
    if (!lock) return json({ started: false, reason: 'stale chain token' });
    await beat(job.done || 0);
  } else {
    lock = await takeLock();
    if (!lock && force) {
      /* A run started before a deploy keeps its lock for three minutes after
         it stops, and its chain is still the old code. Taking it over is the
         only way to pick up a change without waiting the run out. */
      await release('taken over');
      lock = await takeLock();
    }
    if (!lock) {
      // Somebody is already draining the queue. Nothing to do, and not an error.
      return json({ started: false, reason: 'already running', progress: await progress() });
    }
    /* The opening request starts every lane and returns. It does no resolving
       itself: its job is to fan out, and thirty seconds spent on a batch here
       would be thirty seconds the other seven lanes had not started. */
    const started = await Promise.all(
      LANES.map((_, i) => handOff(0, lock.started_at, i)));
    const live = started.filter((r) => r.ok).length;
    if (!live) {
      await release('could not start any lane: ' + started[0].why);
      return json({ started: false, stopped: started[0].why, progress: await progress() });
    }
    return json({ started: true, lanes: live, progress: await progress() });
  }

  try {
    /* Two phases, in order. Identify everybody first, because a name with no
       Commons file has nothing to download, and only then copy the bytes
       across. Each lane checks its own slice, not the whole table. */
    const minePending = await count('people', 'image_status=eq.pending' + laneFilter(lane));
    const batch = minePending > 0
      ? { phase: 'resolve', ...(await runBatch(lane)) }
      : { phase: 'cache', ...(await cacheBatch(lane)) };
    const p = await progress();

    if (batch.empty) {
      /* This lane is finished. Only the last one out turns off the light —
         the others are still working and must keep the lock alive. */
      if (p.outstanding === 0) {
        await release('finished');
        return json({ started: true, lane, finished: true, progress: p });
      }
      return json({ started: true, lane, finished: true, waiting_on_other_lanes: true, progress: p });
    }

    /* Every lookup failing means Wikimedia is refusing this deployment, not
       that these people are unphotographed. Stop this lane and leave the
       reason where the admin page can show it, rather than grinding through
       2,900 names against a wall. */
    if (batch.done === 0 && batch.failed > 0) {
      await stopLane('lane ' + lane + ' stopped in ' + batch.phase + ': ' + batch.lastError);
      return json({ started: true, lane, phase: batch.phase, stopped: batch.lastError, progress: p });
    }
    if (depth >= MAX_CHAIN) {
      return json({ started: true, lane, stopped: 'chain limit', progress: p });
    }

    const chained = await handOff(depth, lock.started_at, lane);
    if (!chained.ok) {
      await stopLane('lane ' + lane + ' could not hand off: ' + chained.why);
      return json({ started: true, lane, phase: batch.phase, resolved: batch.done,
                    failed: batch.failed, chained: false, stopped: chained.why, progress: p });
    }
    return json({ started: true, lane, phase: batch.phase, resolved: batch.done,
                  failed: batch.failed, chained: true, progress: p });
  } catch (e) {
    await stopLane('lane ' + lane + ' error: ' + (e?.message || String(e)));
    return json({ started: true, lane, error: e?.message || String(e) }, 500);
  }
});

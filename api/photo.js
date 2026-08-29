/* POST /api/photo — resolve one contender's image and remember the answer.
 *
 * This is NOT what the site calls while rendering. Pages read
 * wikimedia_thumbnail_url out of Postgres and hand it to Wikimedia's CDN; no
 * page load reaches this endpoint. It exists for the two cases the bulk pass
 * cannot cover:
 *
 *   - somebody added through a board for $1, who no script has ever seen
 *   - a re-check of one person, on request, from /admin.html
 *
 * The database is consulted first every time. A row that is already verified
 * is returned as-is and Wikimedia is not contacted at all.
 *
 *   GET  /api/photo                      a diagnosis of this deployment
 *   GET  /api/photo?slug=…               run the real resolve and show every stage
 *   POST /api/photo {slug}               resolve, cache, return
 *   POST /api/photo {slug, force:true}   re-check one that already has an answer
 */
import { webHandler, json, bad, readJson, db, sbFetch } from './_lib.js';
import { resolveImage, imageRow, BASE_THUMB_WIDTH, UA } from './_wikimedia.js';

const PICK = 'id,slug,name,wikipedia_url,photo_path,wikimedia_thumbnail_url,' +
             'wikimedia_file_title,wikimedia_page_url,wikimedia_original_url,' +
             'wikimedia_width,wikimedia_height,image_license,image_author,' +
             'image_status,image_note,image_attempts';

/** What a caller gets back for a person, whether cached or just resolved. */
function payload(p, extra = {}) {
  return {
    slug: p.slug,
    image_status: p.image_status,
    image_url: p.wikimedia_thumbnail_url || null,
    width: p.wikimedia_width || null,
    height: p.wikimedia_height || null,
    license: p.image_license || null,
    author: p.image_author || null,
    file_title: p.wikimedia_file_title || null,
    page_url: p.wikimedia_page_url || null,
    why: p.image_note || null,
    ...extra
  };
}

/* Give up on a name after enough tries. Without this, ten thousand page views
   of a person with no free photo means ten thousand searches for one. */
const MAX_ATTEMPTS = 3;

async function resolveAndStore(person, steps) {
  const result = await resolveImage({
    name: person.name,
    board: person.categories?.name,
    group: person.categories?.group_name,
    wikipedia_url: person.wikipedia_url
  }, steps);

  const row = { ...imageRow(result), image_attempts: (person.image_attempts || 0) + 1 };
  try {
    await db.update('people', db.eq('id', person.id), row);
  } catch (e) {
    /* The lookup worked; only the write failed. Return the answer anyway —
       the caller can still show it — but say so, because otherwise every
       later visitor repeats a search that already succeeded. */
    console.error('[photo] resolved %s but could not save:', person.slug, e);
    return payload({ ...person, ...row },
      { why: 'resolved but could not save: ' + (e?.message || String(e)) });
  }
  return payload({ ...person, ...row });
}

/* ---------------------------------------------------------------------------
   DIAGNOSIS — open /api/photo in a browser to find out why images are missing.
   Names, booleans and counts only, never a key value.
   --------------------------------------------------------------------------- */

function deployment() {
  const d = {
    vercel_env: process.env.VERCEL_ENV || '(not on Vercel)',
    git_branch: process.env.VERCEL_GIT_COMMIT_REF || '(unknown)',
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || '(unknown)'
  };
  /* A name saved with no value is in process.env but reads as falsy, so a
     plain name list says "present" about a variable that is doing nothing. */
  d.env_names_seen = Object.keys(process.env)
    .filter((n) => /SUP|BASE|SERVICE_ROLE|ANON/i.test(n)).sort()
    .map((n) => (process.env[n] ? n : n + ' (present but EMPTY)'));
  return d;
}

/* What kind of key this is, without revealing it. A Supabase key carries its
   own role, so "you pasted the anon key" is knowable here rather than guessed
   from a 401 three calls later. */
function keyShape(k) {
  if (typeof k !== 'string' || k === '') return 'EMPTY — the variable exists but has no value';
  if (k.startsWith('sb_secret_')) return 'service_role (new sb_secret_ format)';
  if (k.startsWith('sb_publishable_')) return 'PUBLISHABLE — this is the browser key, not the service role key';
  const parts = k.split('.');
  if (parts.length !== 3) return 'unrecognised — not a JWT and not an sb_ key';
  try {
    const claims = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    const role = claims.role || '(no role claim)';
    return role + (claims.exp && claims.exp * 1000 < Date.now() ? ' — EXPIRED' : '');
  } catch { return 'unrecognised — the JWT payload will not decode'; }
}

async function diagnose() {
  const out = { ok: false, deployment: deployment(), checks: {}, next: null };
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  out.checks.SUPABASE_URL_set = !!url;
  out.checks.SUPABASE_SERVICE_ROLE_KEY_set = !!key;
  if ('SUPABASE_SERVICE_ROLE_KEY' in process.env) out.checks.service_key_looks_like = keyShape(key);

  if (!url || !key) {
    const missing = [!url && 'SUPABASE_URL', !key && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean);
    /* Three different situations used to print the same sentence. A name that
       is present but empty is not a misspelling, and telling someone to check
       their spelling when the spelling is right is worse than saying nothing. */
    const empty = missing.filter((n) => n in process.env);
    const absent = missing.filter((n) => !(n in process.env));
    const preview = out.deployment.vercel_env && out.deployment.vercel_env !== 'production';
    const parts = [];
    if (empty.length) {
      parts.push(empty.join(' and ') + ' ' + (empty.length > 1 ? 'exist' : 'exists') +
        ' on this deployment but ' + (empty.length > 1 ? 'their values are' : 'its value is') +
        ' empty — saved as a name with nothing in it. In Vercel -> Settings -> Environment ' +
        'Variables, delete ' + empty.join(' and ') + ' and add ' + (empty.length > 1 ? 'them' : 'it') +
        ' again, pasting the value this time. A Secret variable cannot be read back after ' +
        'saving, so an empty one looks exactly like a full one in the list. Then redeploy.');
    }
    if (absent.length) {
      parts.push(absent.join(' and ') + ' ' + (absent.length > 1 ? 'are' : 'is') +
        ' not on this deployment at all. ' + (preview
          ? 'This is a ' + out.deployment.vercel_env + ' build, and variables scoped to ' +
            'Production only are never given to it — tick Preview on each, or point Settings ' +
            '-> Git -> Production Branch at ' + out.deployment.git_branch + '.'
          : 'Add ' + (absent.length > 1 ? 'them' : 'it') + ' scoped to Production, then redeploy. ' +
            'Variables are read at build time, so adding without a redeploy changes nothing.'));
    }
    out.next = parts.join(' ');
    return out;
  }

  if (/EXPIRED/.test(out.checks.service_key_looks_like || '')) {
    out.next = 'SUPABASE_SERVICE_ROLE_KEY holds a service_role key that has expired. ' +
      'Issue a new one: Supabase -> Project Settings -> API. Then redeploy.';
    return out;
  }
  if (out.checks.service_key_looks_like && !/^service_role/.test(out.checks.service_key_looks_like)) {
    out.next = 'SUPABASE_SERVICE_ROLE_KEY is set, but the key in it is ' +
      out.checks.service_key_looks_like + '. It must be the service_role key: Supabase -> ' +
      'Project Settings -> API -> service_role. Then redeploy.';
    return out;
  }

  try {
    const rows = await db.select('people', 'select=id&limit=1');
    out.checks.people_table_readable = Array.isArray(rows);
  } catch (e) {
    out.checks.people_table_readable = false;
    out.next = 'Cannot read the people table: ' + e.message +
               '. Run sql/schema.sql and sql/seed.sql in the Supabase SQL editor.';
    return out;
  }

  /* The image columns are the whole architecture. If they are missing, the
     site has nothing to render and the resolver has nowhere to write. */
  try {
    await db.select('people', 'select=image_status,wikimedia_thumbnail_url&limit=1');
    out.checks.image_columns_present = true;
  } catch (e) {
    out.checks.image_columns_present = false;
    out.next = 'The image columns are missing: ' + e.message +
               '. Run sql/image-columns.sql in the Supabase SQL editor.';
    return out;
  }

  // How far the bulk pass has got. This is the number you actually want.
  for (const s of ['verified', 'needs_review', 'missing', 'pending']) {
    try {
      const rows = await db.select('people', `select=id&image_status=eq.${s}&limit=1000`);
      out.checks[`people_${s}`] = Array.isArray(rows) ? rows.length : 'unknown';
    } catch { out.checks[`people_${s}`] = 'unknown'; }
  }

  try {
    const r = await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&meta=siteinfo', {
      headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000)
    });
    out.checks.wikimedia_reachable = r.ok;
    if (!r.ok) out.next = `Wikimedia returned ${r.status} from your deployment.`;
  } catch (e) {
    out.checks.wikimedia_reachable = false;
    out.next = 'Your deployment cannot reach Wikimedia: ' + e.message;
  }

  out.checks.user_agent_sent = UA;
  out.ok = Object.values(out.checks).every((v) => v !== false);
  if (out.ok && !out.next) {
    out.next = out.checks.people_verified === 0
      ? 'Everything works, but nothing has been resolved yet. Run: node scripts/resolve-images.mjs'
      : 'Everything checks out. GET /api/photo?slug=lionel-messi to trace one resolve.';
  }
  return out;
}

/* --------------------------------- routes -------------------------------- */

async function load(slug) {
  const cols = PICK + ',categories(slug,name,group_name)';
  const rows = await db.select('people',
    `slug=eq.${encodeURIComponent(slug)}&select=${encodeURIComponent(cols)}&limit=1`);
  return rows?.[0] || null;
}

export default webHandler(async function handler(request) {
  if (request.method === 'GET') {
    const slug = new URL(request.url).searchParams.get('slug');
    if (!slug) return json(await diagnose());
    /* One URL you can paste into the address bar that runs the real thing.
       A POST-only trace is no use to someone holding a browser. */
    const steps = [];
    try {
      const person = await load(slug);
      if (!person) return json({ trace: true, steps, result: { error: 'No such person.' } }, 404);
      steps.push({ step: 'database', image_status: person.image_status,
                   already_have: !!person.wikimedia_thumbnail_url, attempts: person.image_attempts });
      const result = await resolveAndStore(person, steps);
      return json({ trace: true, user_agent_sent: UA, base_thumb_width: BASE_THUMB_WIDTH, steps, result });
    } catch (e) {
      return json({ trace: true, user_agent_sent: UA, steps,
                    result: { image_url: null, why: 'lookup failed: ' + (e?.message || String(e)) } });
    }
  }
  if (request.method !== 'POST') return bad('Use POST, or GET for a diagnosis.', 405);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({
      image_url: null,
      why: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not visible to this ' +
           (process.env.VERCEL_ENV || 'local') + ' deployment (' +
           (process.env.VERCEL_GIT_COMMIT_REF || 'unknown branch') +
           '). Open /api/photo in a browser for the full diagnosis.'
    }, 500);
  }

  try {
    const { slug, force } = await readJson(request);
    if (!slug || typeof slug !== 'string' || slug.length > 80) return bad('No person named.');

    const person = await load(slug);
    if (!person) return bad('No such person.', 404);

    /* CHECK THE DATABASE FIRST. This is the rule the whole design rests on:
       a contender is looked up on Wikimedia once, ever, and every later
       request is answered out of Postgres. */
    if (!force) {
      if (person.wikimedia_thumbnail_url && person.image_status === 'verified') {
        return json(payload(person, { cached: true }));
      }
      // A settled answer is still an answer — including an uncertain match a
      // human has yet to look at, and a name we have already failed on enough.
      if (person.image_status === 'needs_review') return json(payload(person, { cached: true }));
      if (person.image_status === 'missing' && (person.image_attempts || 0) >= MAX_ATTEMPTS) {
        return json(payload(person, { cached: true }));
      }
    }

    return json(await resolveAndStore(person, []));
  } catch (e) {
    console.error('[photo]', e);
    return json({ image_url: null, why: 'lookup failed: ' + (e?.message || String(e)) });
  }
});

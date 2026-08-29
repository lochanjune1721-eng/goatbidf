/* POST /api/admin — password checked here, never in the browser.
 * Photo swaps, deletes, and adding names during the manual review pass. */
import {
  webHandler, json, bad, readJson, db, env,
  constantTimeEqual, mintAdminToken, checkAdminToken
} from './_lib.js';

export default webHandler(async function handler(request) {
  if (request.method !== 'POST') return bad('Use POST.', 405);
  try {
    const b = await readJson(request);

    if (b.action === 'login') {
      if (!constantTimeEqual(b.password, env('ADMIN_PASSWORD'))) return bad('Not accepted.', 401);
      return json({ token: mintAdminToken() });
    }
    if (!checkAdminToken(b.token)) return bad('Your admin token expired. Sign in again.', 401);

    if (b.action === 'list') {
      const cat = await db.one('categories', db.eq('slug', String(b.slug || '')));
      if (!cat) return bad('No such board.', 404);
      const people = await db.select('people',
        `${db.eq('category_id', cat.id)}&order=total_cents.desc,name.asc&limit=200`);
      return json({ category: cat, people });
    }

    if (b.action === 'update') {
      if (!b.id) return bad('No person named.');
      const patch = {};
      ['name', 'blurb', 'photo_path', 'photo_credit', 'photo_license', 'wikipedia_url'].forEach((k) => {
        if (typeof b[k] === 'string') patch[k] = b[k].trim() || null;
      });
      if (!Object.keys(patch).length) return bad('Nothing to change.');
      await db.update('people', db.eq('id', b.id), patch);
      return json({ ok: true });
    }

    /* An uncertain Wikimedia match is stored but withheld from the site until
       somebody looks at it. This is the looking. Without it, needs_review is a
       pile that only grows and no image ever escapes it. */
    if (b.action === 'image') {
      if (!b.id) return bad('No person named.');
      const verdict = String(b.verdict || '');
      if (!['verified', 'missing', 'pending'].includes(verdict)) {
        return bad('Verdict must be verified, missing, or pending.');
      }
      const patch = { image_status: verdict, image_last_checked: new Date().toISOString() };
      if (verdict === 'verified') patch.image_note = null;
      if (verdict === 'missing') {
        // Rejecting a face means dropping it, not leaving it where a later
        // approval could attach it by accident.
        patch.image_note = 'rejected by hand';
        // The self-hosted copy IS the rejected face. Leaving it behind means
        // the site keeps showing the picture you just said was wrong.
        patch.photo_path = null;
        patch.wikimedia_thumbnail_url = null;
        patch.wikimedia_file_title = null;
        patch.wikimedia_original_url = null;
        patch.wikimedia_page_url = null;
      }
      // 'pending' clears the attempt count so the resolver tries again.
      if (verdict === 'pending') patch.image_attempts = 0;
      await db.update('people', db.eq('id', b.id), patch);
      return json({ ok: true, image_status: verdict });
    }

    if (b.action === 'delete') {
      if (!b.id) return bad('No person named.');
      const person = await db.one('people', db.eq('id', b.id));
      if (!person) return bad('Already gone.', 404);
      // Refuse to delete anyone holding real money — that money is public and
      // permanent, and deleting the row would silently erase it.
      if (person.total_cents > 0) {
        return bad('That entry has money on it. Contributions are permanent, so it cannot be deleted.');
      }
      await db.del('fan_totals', db.eq('person_id', b.id));
      await db.del('people', db.eq('id', b.id));
      return json({ ok: true });
    }

    if (b.action === 'add') {
      const cat = await db.one('categories', db.eq('slug', String(b.slug || '')));
      if (!cat) return bad('No such board.', 404);
      const name = String(b.name || '').trim();
      if (!name) return bad('A name is required.');
      const slug = name.toLowerCase().normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'person';
      const taken = await db.one('people', db.eq('slug', slug));
      await db.insert('people', {
        slug: taken ? `${slug}-${Math.random().toString(36).slice(2, 6)}` : slug,
        category_id: cat.id,
        name,
        blurb: String(b.blurb || '').trim() || null,
        wikipedia_url: String(b.wikipedia_url || '').trim() || null
      });
      return json({ ok: true });
    }

    return bad('Unknown action.');
  } catch (e) {
    console.error('[admin]', e);
    return bad(e.message || 'That did not work.', 500);
  }
});

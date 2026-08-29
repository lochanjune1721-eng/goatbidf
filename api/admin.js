import { createClient } from '@supabase/supabase-js';

// Admin actions. Every write happens here, with the service role key, behind
// the ADMIN_PASSWORD check — the browser never holds a key that can write to
// `people`, so the password is a real gate rather than a UI hint.

function admin() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

/** Constant-time compare so the password cannot be guessed by timing. */
function sameSecret(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ADMIN_PASSWORD } = process.env;
  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD is not set in Vercel.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Could not read that request.' });
  }

  const { password, action, id, photo_path: photoPath, category_id: categoryId } = body;
  if (!sameSecret(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Wrong password.' });
  }

  // A bare check with no action is the unlock handshake.
  if (!action) return res.status(200).json({ ok: true });

  const supa = admin();
  if (!supa) return res.status(500).json({ error: 'Supabase is not configured in Vercel.' });

  if (action === 'list_people') {
    if (!categoryId) return res.status(400).json({ error: 'Missing category_id' });
    const { data, error } = await supa
      .from('people')
      .select('id,slug,name,blurb,photo_path,photo_license,total_cents')
      .eq('category_id', categoryId)
      .order('total_cents', { ascending: false })
      .limit(500);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ people: data || [] });
  }

  if (action === 'delete_person') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const { error } = await supa.from('people').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (action === 'set_photo') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    if (photoPath && !/^https:\/\//.test(photoPath) && photoPath.includes('..')) {
      return res.status(400).json({ error: 'Invalid photo path.' });
    }
    const { error } = await supa.from('people').update({ photo_path: photoPath || null }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (action === 'stats') {
    const [people, categories, missing] = await Promise.all([
      supa.from('people').select('id', { count: 'exact', head: true }),
      supa.from('categories').select('id', { count: 'exact', head: true }),
      supa.from('people').select('id', { count: 'exact', head: true }).is('photo_path', null),
    ]);
    return res.status(200).json({
      people: people.count ?? 0,
      categories: categories.count ?? 0,
      missingPhotos: missing.count ?? 0,
    });
  }

  return res.status(400).json({ error: 'Unknown action' });
}

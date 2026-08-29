import { createClient } from '@supabase/supabase-js';
import { resolveWikimediaImage } from '../scripts/wikimedia_resolver.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  const { name, category, entity_id } = body || {};

  if (!name) return res.status(400).json({ error: 'Missing name parameter' });

  const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const result = await resolveWikimediaImage({ name, category: category || '' });
    const { status, data } = result;

    if (entity_id && data && data.wikimedia_thumbnail_url) {
      await supa.from('people').update({
        photo_path: data.wikimedia_thumbnail_url,
        photo_credit: data.image_author,
        photo_license: data.image_license
      }).eq('id', entity_id);
    }

    return res.status(200).json({ ok: true, status, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

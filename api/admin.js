import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Manual photo moderation. Service-role only: the browser never gets these rights.
export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if(!ADMIN_PASSWORD) return res.status(500).json({ error: 'ADMIN_PASSWORD not configured' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const given = String(body.password || '');

  // constant-time compare so the password can't be recovered by timing
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  if(!crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Wrong password' });

  if(!body.action) return res.status(200).json({ ok: true });
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Supabase not configured' });
  const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if(body.action === 'photos'){
    const status = ['flagged','pending','rejected','approved'].includes(body.status) ? body.status : 'flagged';
    const { data, error } = await supa.from('users')
      .select('id,display_name,social_handle,social_platform,photo_path,photo_status')
      .eq('photo_status', status).not('photo_path','is',null).limit(120);
    if(error) return res.status(500).json({ error: error.message });

    const counts = {};
    for(const s of ['flagged','pending','rejected']){
      const { count } = await supa.from('users').select('id',{count:'exact',head:true})
        .eq('photo_status', s).not('photo_path','is',null);
      counts[s] = count ?? 0;
    }
    return res.status(200).json({ photos: data || [], counts });
  }

  if(body.action === 'set_photo_status'){
    if(!body.id) return res.status(400).json({ error: 'Missing id' });
    if(!['approved','rejected','pending'].includes(body.photo_status)){
      return res.status(400).json({ error: 'Bad status' });
    }
    const patch = { photo_status: body.photo_status };
    if(body.photo_status === 'rejected') patch.photo_path = null;   // stop serving it everywhere
    const { error } = await supa.from('users').update(patch).eq('id', body.id);
    if(error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action' });
}

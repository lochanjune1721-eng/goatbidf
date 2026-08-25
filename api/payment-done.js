import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Dodo webhook. Unused while payments are faked, but it is a live, publicly
// reachable endpoint, so it must refuse anything it cannot verify. Previously it
// read DODO_WEBHOOK_SECRET and never used it, which meant anyone who could POST
// here could confirm a top-up and mint themselves a balance.
export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DODO_WEBHOOK_SECRET } = process.env;
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Supabase not configured' });
  if(!DODO_WEBHOOK_SECRET) return res.status(503).json({ error: 'Webhook secret not configured' });

  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const signature = req.headers['webhook-signature'] || req.headers['dodo-signature'] || '';
  const timestamp = req.headers['webhook-timestamp'] || '';
  if(!signature) return res.status(401).json({ error: 'Missing signature' });

  // reject anything older than five minutes so a captured request can't be replayed
  if(timestamp){
    const age = Math.abs(Date.now()/1000 - Number(timestamp));
    if(!Number.isFinite(age) || age > 300) return res.status(401).json({ error: 'Stale timestamp' });
  }

  const expected = crypto.createHmac('sha256', DODO_WEBHOOK_SECRET)
                         .update(`${timestamp}.${raw}`).digest('base64');
  const given = String(signature).split(',').pop().trim();
  const a = Buffer.from(expected), b = Buffer.from(given);
  if(a.length !== b.length || !crypto.timingSafeEqual(a, b)){
    return res.status(401).json({ error: 'Bad signature' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const paymentId = body.payment_id || body.id || body.data?.payment_id;
  const userId    = body.metadata?.user_id || body.data?.metadata?.user_id;
  const amount    = Math.floor(Number(body.amount_cents ?? body.total_amount ?? body.data?.total_amount));
  if(!paymentId || !userId || !Number.isFinite(amount)){
    return res.status(400).json({ error: 'Incomplete payload' });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  // credit_balance is idempotent on payment id, so a retry cannot double-credit
  const { data, error } = await supabaseAdmin.rpc('credit_balance', {
    p_user_id: userId, p_amount_cents: amount, p_payment_id: paymentId
  });
  if(error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ received: true, balance: data });
}

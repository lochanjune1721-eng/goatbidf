import { createClient } from '@supabase/supabase-js';

// TEMPORARY: fake payment. No card is charged. Swap for Dodo before launch —
// create a real checkout session here and call credit_balance from the webhook
// instead of from this handler. Everything downstream (topups row, balance,
// ranking, fan boards) is already production-shaped, so that is the only change.
const MIN_CENTS = 500;   // $5 = 5 votes

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY){
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const amountCents = Math.floor(Number(body.amountCents));

  if(!Number.isFinite(amountCents) || amountCents < MIN_CENTS){
    return res.status(400).json({ error: 'Minimum is 5 votes' });
  }
  if(amountCents % 100 !== 0){
    return res.status(400).json({ error: 'Whole votes only' });
  }

  // Identify the buyer from their Supabase JWT — never from the request body,
  // or anyone could top up anyone else's balance (or their own, unbounded).
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if(!token) return res.status(401).json({ error: 'Sign in first' });
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if(authErr || !user) return res.status(401).json({ error: 'Sign in first' });

  await new Promise(r => setTimeout(r, 800));   // simulate provider latency

  const { data, error } = await supabaseAdmin.rpc('credit_balance', {
    p_user_id: user.id,
    p_amount_cents: amountCents,
    p_payment_id: `fake_${user.id}_${Date.now()}`
  });
  if(error) return res.status(500).json({ error: error.message });

  return res.json({ ok: true, test_mode: true, newBalance: data });
}

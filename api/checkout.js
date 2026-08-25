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

  // Identify the buyer from their Supabase JWT. The token is only ever read as
  // a credential to verify — the user id comes from Supabase's answer, never
  // from the request — so a forged body cannot top up someone else's balance.
  // Header first; body is a fallback for proxies that strip Authorization.
  const header = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const token = header || String(body.accessToken || '').trim();

  if(!token){
    return res.status(401).json({
      error: 'No session token reached the server. Reload the page and sign in again.',
      code: 'no_token'
    });
  }

  const { data: { user } = {}, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if(authErr || !user){
    // Distinguish an expired user session from a server that cannot verify
    // anything — usually a SUPABASE_SERVICE_ROLE_KEY that no longer matches the
    // project, which looks identical to the user but is not their problem.
    const m = (authErr && authErr.message) || 'unknown';
    const serverSide = /invalid api key|api key|jwt secret|signature/i.test(m);
    return res.status(401).json({
      error: serverSide
        ? 'The server could not verify your session. Its Supabase keys look wrong — check SUPABASE_SERVICE_ROLE_KEY in the deployment.'
        : 'Your session expired. Sign in again and retry.',
      code: serverSide ? 'server_key' : 'expired',
      detail: m.slice(0, 120)
    });
  }

  await new Promise(r => setTimeout(r, 800));   // simulate provider latency

  const { data, error } = await supabaseAdmin.rpc('credit_balance', {
    p_user_id: user.id,
    p_amount_cents: amountCents,
    p_payment_id: `fake_${user.id}_${Date.now()}`
  });
  if(error) return res.status(500).json({ error: error.message });

  return res.json({ ok: true, test_mode: true, newBalance: data });
}

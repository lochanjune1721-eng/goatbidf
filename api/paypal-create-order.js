import { createClient } from '@supabase/supabase-js';
import { ALLOWED_TOPUPS, createOrder, isConfigured } from '../lib/paypal.mjs';

// Step 1 of a top-up: record a pending row, then open a PayPal order against it.
// No balance moves here — that only happens in paypal-capture-order.js, after
// PayPal confirms the money actually arrived.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Server is not configured. Check Vercel env vars.' });
  }
  if (!isConfigured()) {
    return res.status(503).json({
      error: 'Payments are not switched on. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in Vercel.',
    });
  }

  // Identify the buyer from their Supabase session — never from the request body.
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Sign in to top up.' });

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Your session expired. Sign in again.' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Could not read that request.' });
  }

  const cents = Number(body.amount_cents);
  if (!ALLOWED_TOPUPS.includes(cents)) {
    return res.status(400).json({ error: 'Top-ups are $5, $10, $25, $50 or $100.' });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // The user row must exist before topups can reference it.
  await admin.from('users')
    .upsert({ id: user.id, email: user.email }, { onConflict: 'id', ignoreDuplicates: true });

  const { data: topup, error: insertError } = await admin
    .from('topups')
    .insert({ user_id: user.id, amount_cents: cents, status: 'pending', provider: 'paypal' })
    .select('id').maybeSingle();

  if (insertError || !topup) {
    return res.status(500).json({ error: insertError?.message || 'Could not start that top-up.' });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const currency = (process.env.CURRENCY || 'USD').toUpperCase();

  try {
    const order = await createOrder({
      amountCents: cents,
      currency,
      referenceId: topup.id,
      description: `GOAT.lol credit $${(cents / 100).toFixed(0)} — non-refundable`,
      origin,
    });

    await admin.from('topups').update({ paypal_order_id: order.id }).eq('id', topup.id);

    return res.status(200).json({ orderId: order.id, topupId: topup.id });
  } catch (err) {
    await admin.from('topups').update({ status: 'failed' }).eq('id', topup.id);
    console.error('[goat] paypal create-order failed:', err.message);
    return res.status(502).json({ error: 'PayPal could not start that payment. Please try again.' });
  }
}

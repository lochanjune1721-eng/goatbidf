import { createClient } from '@supabase/supabase-js';
import { captureOrder, isConfigured } from '../lib/paypal.mjs';

// Step 2 of a top-up: take the money, then credit the balance.
//
// Balance is added by the confirm_topup RPC, which is atomic and idempotent —
// a retried request, a double-click or a duplicate webhook credits once.
// The captured amount is checked against the amount the order was opened for,
// so a tampered client cannot buy $100 of credit for $5.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Server is not configured. Check Vercel env vars.' });
  }
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Payments are not switched on.' });
  }

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

  const orderId = String(body.orderId || '').trim();
  const topupId = String(body.topupId || '').trim();
  if (!orderId || !topupId) {
    return res.status(400).json({ error: 'That payment could not be matched to a top-up.' });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: topup } = await admin
    .from('topups').select('*').eq('id', topupId).maybeSingle();

  if (!topup) return res.status(404).json({ error: 'That top-up could not be found.' });

  // The top-up must belong to the person asking to complete it.
  if (topup.user_id !== user.id) {
    console.error('[goat] capture user mismatch', topup.user_id, user.id);
    return res.status(403).json({ error: 'That top-up belongs to another account.' });
  }
  if (topup.paypal_order_id && topup.paypal_order_id !== orderId) {
    return res.status(409).json({ error: 'That payment does not match this top-up.' });
  }
  if (topup.status === 'confirmed') {
    const { data: existing } = await admin
      .from('users').select('balance_cents').eq('id', user.id).maybeSingle();
    return res.status(200).json({ ok: true, duplicate: true, balance_cents: existing?.balance_cents ?? 0 });
  }

  let capture;
  try {
    capture = await captureOrder(orderId);
  } catch (err) {
    console.error('[goat] paypal capture failed:', err.message);
    return res.status(502).json({ error: 'PayPal could not complete that payment.' });
  }

  if (capture.status !== 'COMPLETED') {
    await admin.from('topups').update({ status: 'failed' }).eq('id', topupId);
    return res.status(402).json({ error: 'That payment was not completed. Nothing has been charged.' });
  }
  if (capture.referenceId && capture.referenceId !== topupId) {
    console.error('[goat] capture reference mismatch', capture.referenceId, topupId);
    return res.status(409).json({ error: 'That payment did not match this top-up. Please contact us.' });
  }

  // confirm_topup rejects a mismatch itself; check here too so the message is clearer.
  if (capture.amountCents !== null && capture.amountCents !== topup.amount_cents) {
    console.error('[goat] captured amount mismatch', capture.amountCents, topup.amount_cents);
    await admin.from('topups').update({ status: 'failed' }).eq('id', topupId);
    return res.status(409).json({ error: 'The amount paid did not match the top-up. Please contact us.' });
  }

  const { data: result, error: rpcError } = await admin.rpc('confirm_topup', {
    p_topup_id: topupId,
    p_payment_id: capture.captureId,
    p_amount_cents: capture.amountCents,
  });

  if (rpcError) {
    // The money is taken but the credit did not land — never silently swallow this.
    console.error('[goat] confirm_topup failed after capture', capture.captureId, rpcError.message);
    return res.status(500).json({
      error: 'Your payment went through but the credit did not land. Contact us with this reference: '
        + (capture.captureId || orderId),
    });
  }

  return res.status(200).json({
    ok: true,
    duplicate: Boolean(result?.duplicate),
    balance_cents: result?.balance_cents ?? null,
  });
}

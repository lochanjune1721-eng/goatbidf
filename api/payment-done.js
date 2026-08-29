/* POST /api/payment-done — the Dodo webhook. The only place credit is added.
 *
 * Idempotent twice over: dodo_payment_id is unique, and the topup row is only
 * credited when it is still `pending`, so a replayed webhook is a no-op. */
import { webHandler, json, bad, env, db, sbFetch, verifyDodoWebhook } from './_lib.js';

const SUCCESS = new Set(['payment.succeeded', 'payment.completed', 'payment.paid']);

export default webHandler(async function handler(request) {
  if (request.method !== 'POST') return bad('Use POST.', 405);

  // Web-standard handler, so the raw body is available for the HMAC.
  const raw = await request.text();
  if (!verifyDodoWebhook(raw, request.headers, env('DODO_WEBHOOK_SECRET'))) {
    return bad('Invalid signature.', 401);
  }

  let event;
  try { event = JSON.parse(raw); } catch { return bad('Malformed payload.'); }

  const type = event.type || event.event_type;
  if (!SUCCESS.has(type)) return json({ received: true, ignored: type });

  const data = event.data || event;
  const paymentId = data.payment_id || data.id;
  const topupId = data.metadata?.topup_id;
  if (!topupId && !paymentId) return json({ received: true, skipped: 'nothing to match on' });

  try {
    const topup = topupId
      ? await db.one('topups', db.eq('id', topupId))
      : await db.one('topups', db.eq('dodo_payment_id', paymentId));

    if (!topup) return json({ received: true, skipped: 'no matching topup' });
    if (topup.status === 'confirmed') return json({ received: true, duplicate: true });

    /* Flip pending -> confirmed with the status in the filter. If two webhooks
       land at once only one matches, so only one credits the balance. */
    const claimed = await db.update(
      'topups',
      `${db.eq('id', topup.id)}&${db.eq('status', 'pending')}`,
      { status: 'confirmed', dodo_payment_id: paymentId || topup.dodo_payment_id }
    );
    if (!Array.isArray(claimed) || claimed.length === 0) {
      return json({ received: true, duplicate: true });
    }

    await sbFetch('/rest/v1/rpc/credit_balance', {
      method: 'POST',
      body: JSON.stringify({ p_user: topup.user_id, p_amount: topup.amount_cents })
    });

    return json({ received: true, credited: topup.amount_cents });
  } catch (e) {
    console.error('[payment-done]', e);
    // 500 so Dodo retries rather than dropping a paid top-up.
    return bad('Webhook processing failed.', 500);
  }
});

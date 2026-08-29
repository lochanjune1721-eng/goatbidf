/* POST /api/checkout — start a top-up.
 * Creates the topups row as `pending` and returns Dodo's checkout link.
 * No balance moves here; only the webhook credits an account. */
import { webHandler, json, bad, readJson, db, env, userFromToken, siteUrl, createDodoCheckout, TOPUPS } from './_lib.js';

export default webHandler(async function handler(request) {
  if (request.method !== 'POST') return bad('Use POST.', 405);
  try {
    const b = await readJson(request);
    const user = await userFromToken(b.token);
    if (!user) return bad('Sign in first.', 401);

    const amount = Math.round(Number(b.amount_cents) || 0);
    // Fixed amounts only — a client-chosen number is a client-chosen price.
    if (!TOPUPS.includes(amount)) return bad('Pick one of the listed amounts.');

    const rows = await db.insert('topups', {
      user_id: user.id, amount_cents: amount, status: 'pending'
    });
    const topup = Array.isArray(rows) ? rows[0] : rows;

    const { url, paymentId } = await createDodoCheckout({
      amountCents: amount,
      userId: user.id,
      topupId: topup.id,
      returnUrl: `${siteUrl(request)}/wallet.html?topup=${topup.id}`
    });

    if (paymentId) {
      await db.update('topups', db.eq('id', topup.id), { dodo_payment_id: paymentId });
    }
    return json({ url });
  } catch (e) {
    console.error('[checkout]', e);
    return bad(e.message || 'Checkout could not be created.', 500);
  }
});

// PayPal Orders v2 — shared server helper.
//
// Credentials come from Vercel environment variables and are only ever read
// here, on the server. PAYPAL_CLIENT_SECRET must never reach the browser.

const ALLOWED_TOPUPS = [500, 1000, 2500, 5000, 10000];

export { ALLOWED_TOPUPS };

export function paypalEnv() {
  return (process.env.PAYPAL_ENV || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox';
}

export function isConfigured() {
  return Boolean(
    (process.env.PAYPAL_CLIENT_ID || '').trim() &&
    (process.env.PAYPAL_CLIENT_SECRET || '').trim(),
  );
}

function baseUrl() {
  return paypalEnv() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

// Access tokens last ~9 hours; caching on the warm lambda avoids an extra
// round trip on every checkout.
let tokenCache = null;

async function accessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;

  const id = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const secret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
  if (!id || !secret) throw new Error('PayPal is not configured');

  const response = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`PayPal auth failed (${response.status})`);

  const data = JSON.parse(text);
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

async function call(path, { method = 'GET', body, requestId } = {}) {
  const headers = {
    Authorization: `Bearer ${await accessToken()}`,
    'Content-Type': 'application/json',
  };
  if (requestId) headers['PayPal-Request-Id'] = requestId;

  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const detail = parsed?.details?.[0]?.description || parsed?.message || `HTTP ${response.status}`;
    const error = new Error(`PayPal ${path}: ${detail}`);
    error.status = response.status;
    error.paypal = parsed;
    throw error;
  }
  return parsed;
}

export async function createOrder({ amountCents, currency, referenceId, description, origin }) {
  return call('/v2/checkout/orders', {
    method: 'POST',
    requestId: `topup-${referenceId}`,
    body: {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: referenceId,
        custom_id: referenceId,
        description: String(description).slice(0, 127),
        amount: { currency_code: currency, value: (amountCents / 100).toFixed(2) },
      }],
      application_context: {
        brand_name: 'GOAT.lol',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${origin}/wallet.html?topup=success`,
        cancel_url: `${origin}/wallet.html?topup=cancel`,
      },
    },
  });
}

export async function captureOrder(orderId) {
  const data = await call(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    requestId: `capture-${orderId}`,
    body: {},
  });

  const unit = data.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];

  return {
    orderId: data.id,
    status: data.status,
    captureId: capture?.id || null,
    captureStatus: capture?.status || null,
    amountCents: capture?.amount ? Math.round(parseFloat(capture.amount.value) * 100) : null,
    currency: capture?.amount?.currency_code || null,
    referenceId: capture?.custom_id || unit?.custom_id || unit?.reference_id || null,
  };
}

export async function getOrder(orderId) {
  return call(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
}

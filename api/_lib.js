/* GOAT.lol — serverless helpers. No npm dependencies: Supabase over PostgREST,
 * Dodo over its REST API, webhook HMAC via node:crypto. */

import crypto from 'node:crypto';

export const TOPUPS = [500, 1000, 2500, 5000, 10000];

/* Vercel's Node runtime decides how to invoke a function by inspecting the
   module's exports. A bare `export default async (request) => Response` can be
   classified as a legacy (req, res) Node handler — in which case the Response
   we return is discarded, nothing is ever written to res, and the request hangs
   until the invocation times out. That failure is invisible: no log, no error,
   just a call that never resolves.

   Rather than bet on the classification, accept both. If we are handed a Web
   Request, run as-is. If we are handed (req, res), build a Request from it,
   run the same handler, and write the Response back. The raw body is preserved
   as a string, which the Stripe/Dodo signature check depends on. */
export function webHandler(fn) {
  return async function (a, b) {
    const isWeb = a && typeof a.headers?.get === 'function' && typeof a.arrayBuffer === 'function';
    if (isWeb && !b) return fn(a);

    const req = a, res = b;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = `${proto}://${host}${req.url || '/'}`;

    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (typeof req.body === 'string') body = req.body;
      else if (req.body && typeof req.body === 'object') body = JSON.stringify(req.body);
      else body = await new Promise((resolve, reject) => {
        let d = '';
        req.on('data', (c) => { d += c; });
        req.on('end', () => resolve(d));
        req.on('error', reject);
      });
    }

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers || {})) {
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
      else if (v != null) headers.set(k, String(v));
    }

    const out = await fn(new Request(url, { method: req.method, headers, body }));
    res.statusCode = out.status;
    out.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(Buffer.from(await out.arrayBuffer()));
  };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
export const bad = (msg, status = 400) => json({ error: msg }, status);

export async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

export function env(name, required = true) {
  const v = process.env[name];
  if (!v && required) throw new Error(`Missing environment variable ${name}.`);
  return v;
}

export function siteUrl(request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  return `${proto}://${host}`;
}

/* ------------------------------------------------------------- supabase -- */
/* Service role only. This module never reaches the browser. */

function headers(extra = {}) {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...extra };
}

export async function sbFetch(path, init = {}) {
  const base = env('SUPABASE_URL').replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, { ...init, headers: headers(init.headers) });
  const text = await res.text();
  let body = null;
  if (text) { try { body = JSON.parse(text); } catch { body = text; } }
  if (!res.ok) {
    const err = new Error((body && body.message) || 'Database request failed.');
    err.status = res.status;
    throw err;
  }
  return body;
}

/** How many rows match, without fetching them. PostgREST reports it in
    Content-Range, which sbFetch throws away along with the rest of the
    headers — and "how much is left to do" is a number you need often. */
export async function count(table, query = '') {
  const base = env('SUPABASE_URL').replace(/\/$/, '');
  const res = await fetch(`${base}/rest/v1/${table}?${query}&select=id&limit=1`, {
    headers: headers({ Prefer: 'count=exact' })
  });
  if (!res.ok) {
    const err = new Error(`Count failed (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  const total = (res.headers.get('content-range') || '').split('/')[1];
  return total && total !== '*' ? Number(total) : null;
}

const q = encodeURIComponent;

export const db = {
  select: (table, query = '') => sbFetch(`/rest/v1/${table}?${query}`),
  async one(table, query) {
    const rows = await sbFetch(`/rest/v1/${table}?${query}&limit=1`);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  },
  insert: (table, row, prefer = 'return=representation') =>
    sbFetch(`/rest/v1/${table}`, { method: 'POST', headers: { Prefer: prefer }, body: JSON.stringify(row) }),
  update: (table, query, patch) =>
    sbFetch(`/rest/v1/${table}?${query}`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch)
    }),
  /* Write many rows in one request. A batch of a hundred people used to be a
     hundred round trips to Supabase, which cost more wall clock than the
     Wikimedia lookups they came from. Upserts on the primary key, so only the
     columns present are touched. */
  upsertMany: (table, rows) =>
    sbFetch(`/rest/v1/${table}`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows)
    }),
  del: (table, query) => sbFetch(`/rest/v1/${table}?${query}`, { method: 'DELETE' }),
  rpc: (fn, args) => sbFetch(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args || {}) }),
  eq: (col, val) => `${col}=eq.${q(val)}`
};

/** Resolve a Supabase Auth JWT to a user. Asking Supabase honours revocation. */
export async function userFromToken(token) {
  if (!token) return null;
  const base = env('SUPABASE_URL').replace(/\/$/, '');
  const res = await fetch(`${base}/auth/v1/user`, {
    headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const u = await res.json();
  return u && u.id ? u : null;
}

/* ----------------------------------------------------------------- admin -- */

export function constantTimeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function mintAdminToken(ttlSec = 60 * 60 * 8) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const sig = crypto.createHmac('sha256', env('ADMIN_PASSWORD')).update(String(exp)).digest('base64url');
  return `${exp}.${sig}`;
}

export function checkAdminToken(token) {
  if (typeof token !== 'string') return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Math.floor(Date.now() / 1000)) return false;
  const expected = crypto.createHmac('sha256', env('ADMIN_PASSWORD')).update(exp).digest('base64url');
  return constantTimeEqual(expected, sig);
}

/* ------------------------------------------------------------------ dodo -- */
/*
 * Everything Dodo-specific is confined to this block, because it is the one
 * part of the build that could not be checked against live docs from the
 * sandbox this was written in. If Dodo's shapes differ, only these three
 * functions change -- nothing above or below them.
 *
 * Verify before going live:
 *   1. DODO_API_BASE           test vs live host
 *   2. createDodoCheckout()    endpoint path and body field names
 *   3. verifyDodoWebhook()     Dodo follows the Standard Webhooks spec
 *                              (webhook-id / webhook-timestamp / webhook-signature,
 *                              HMAC-SHA256 base64 over "id.timestamp.body",
 *                              secret base64 after a `whsec_` prefix)
 */

export const DODO_API_BASE =
  process.env.DODO_API_BASE ||
  (process.env.DODO_MODE === 'live' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com');

export async function createDodoCheckout({ amountCents, userId, topupId, returnUrl }) {
  const res = await fetch(`${DODO_API_BASE}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('DODO_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      payment_link: true,
      billing_currency: 'USD',
      return_url: returnUrl,
      // The topup row id is the idempotency handle: the webhook looks the
      // payment back up by it, so a replay can never double-credit.
      metadata: { topup_id: topupId, user_id: userId },
      product_cart: [{
        product_id: env('DODO_PRODUCT_ID'),
        quantity: 1,
        amount: amountCents
      }],
      customer: { customer_id: undefined, name: 'GOAT.lol backer', email: undefined }
    })
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((body && (body.message || body.error)) || `Dodo rejected the checkout (${res.status}).`);
  }
  const url = body?.payment_link || body?.checkout_url || body?.url;
  const id = body?.payment_id || body?.id;
  if (!url) throw new Error('Dodo did not return a checkout link.');
  return { url, paymentId: id };
}

/** Standard Webhooks signature check over the raw body. */
export function verifyDodoWebhook(rawBody, reqHeaders, secret) {
  const id = reqHeaders.get('webhook-id');
  const ts = reqHeaders.get('webhook-timestamp');
  const sigHeader = reqHeaders.get('webhook-signature');
  if (!id || !ts || !sigHeader || !secret) return false;

  // Five-minute tolerance, so a captured request cannot be replayed later.
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(ts)) > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = crypto.createHmac('sha256', key)
    .update(`${id}.${ts}.${rawBody}`).digest('base64');

  // The header carries space-separated `v1,<sig>` pairs.
  return sigHeader.split(' ').some((part) => {
    const sig = part.includes(',') ? part.split(',')[1] : part;
    return constantTimeEqual(expected, sig);
  });
}

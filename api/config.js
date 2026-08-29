// Public runtime config, read from Vercel environment variables.
//
// This is how the browser learns the Supabase URL, the Supabase *anon* key and
// the PayPal *client* id without any of them being written into the source.
// Everything returned here is safe to be public — it is what ships in the
// browser of every Supabase or PayPal site. The secrets (service role key,
// PayPal client secret) are never sent here and are only ever read
// server-side, inside the other functions in this folder.

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    PAYPAL_CLIENT_ID,
    PAYPAL_ENV,
    CURRENCY,
  } = process.env;

  const missing = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');

  // Edge-cached so this costs one request per visitor per 5 minutes, not one
  // per page view. Any change to the env vars needs a redeploy anyway.
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  return res.status(200).json({
    supabaseUrl: SUPABASE_URL || null,
    supabaseAnonKey: SUPABASE_ANON_KEY || null,
    paypalClientId: PAYPAL_CLIENT_ID || null,
    paypalEnv: (PAYPAL_ENV || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox',
    currency: (CURRENCY || 'USD').toUpperCase(),
    // Lets the UI say plainly what is switched on instead of failing silently.
    paymentsEnabled: Boolean(PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    configured: missing.length === 0,
    missing,
  });
}

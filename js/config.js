/* GOAT.lol — client configuration.
 *
 * No build step, so Vercel env vars cannot reach static files. These two are
 * the values marked safe in client JS; everything secret (service role key,
 * Dodo keys, admin password) stays in the Vercel dashboard and is read only
 * inside /api.
 *
 * NOTE: rotating the Supabase JWT secret regenerates the anon key as well as
 * the service role key. If you rotate, update the value below at the same time.
 */
window.GOAT_CONFIG = {
  SUPABASE_URL: 'https://lbxpatuwptkgmugpuezs.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxieHBhdHV3cHRrZ211Z3B1ZXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODA4MjgsImV4cCI6MjEwMzE1NjgyOH0.YAcHtxFUd5jmDtLaOCHNcZ3HRn2siwPhrNyDIs5FgVs'
};

# GOAT.lol — Who's the greatest of all time?

Vanilla HTML/CSS/JS. No framework, no build step. Supabase via CDN, Vercel serverless functions,
PayPal for credit top-ups.

## Concept

Pay-to-rank leaderboards for the greatest of all time — sport, screen, music, science, business,
culture. Fans buy credit, then spend it backing whoever they believe in. The money is the ranking.

The **Greatest Fan of All Time** board (`/fans.html`) ranks the backers themselves: put up your
picture, your name and your social handle, back who you believe in, and climb.

---

## ⚠️ If you are setting this up for the first time, do these two things

### 1. Rotate your Supabase service role key

An earlier version of this repo committed a real `SUPABASE_SERVICE_ROLE_KEY` into
`.env.example`, in a public repository. That key bypasses row-level security entirely.

**Supabase dashboard → Project Settings → API → reset the `service_role` key.** Removing it from
the repo is not enough — it is in the git history, and the history is public. Only rotation makes
the old key useless. (The `anon` key is designed to be public; that one is fine.)

### 2. Run the migration

`supabase-migration.sql` fixes three problems in the live database. Run it once in the Supabase
SQL editor (Dashboard → SQL Editor → New query → paste → Run). It is safe to run more than once.

| It fixes | What was happening |
| --- | --- |
| Free credit | `create policy "users self update" on users for update using (auth.uid() = id)` let any signed-in user run `update users set balance_cents = 99999999` from the browser console. Fixed with column-level grants: balance is now writable only by `place_bid` and `confirm_topup`. |
| Empty fan boards | `create policy "users self read" ... using (auth.uid() = id)` meant a visitor could only read their *own* user row, so `/fans.html` was always empty and "Top fans" always read "Unknown". Fixed with a `public_profiles` view that exposes only public columns and blanks out anyone who chose to stay anonymous. |
| Top-up races | Balance was credited with a read-then-write (`balance + amount`), which loses money under concurrency and was not tied to a verified payment. Replaced with `confirm_topup`, a single atomic, idempotent transaction. |

It also adds the profile columns the Greatest Fan board needs (`photo_url`, `social_platform`,
`social_handle`, `tagline`) and an `avatars` storage bucket.

---

## Environment variables

Nothing is hardcoded any more. The browser gets its public config from `/api/config`, which reads
these from the environment — so rotating a key is a dashboard change plus a redeploy, never a code
change.

Set them in **Vercel → Project → Settings → Environment Variables**, then redeploy (variables only
take effect on a new deployment).

| Variable | Needed for | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | Everything | Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Everything | The publishable key. Safe to be public. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS. Never expose to the browser. |
| `PAYPAL_CLIENT_ID` | Taking payments | developer.paypal.com → Apps & Credentials |
| `PAYPAL_CLIENT_SECRET` | Taking payments | Server only. Never put in a `NEXT_PUBLIC_`-style variable. |
| `PAYPAL_ENV` | Taking payments | `sandbox` for testing, `live` for real money. Defaults to `sandbox`. |
| `CURRENCY` | Optional | Defaults to `USD`. Must be one PayPal supports. |
| `ADMIN_PASSWORD` | `/admin.html` | Required for any admin action. |

Check your deployment with **`/api/config`** — it reports exactly what is switched on:

```json
{ "supabaseUrl": "https://….supabase.co", "paypalClientId": "…",
  "paypalEnv": "sandbox", "paymentsEnabled": true, "configured": true, "missing": [] }
```

If something is missing, every page shows a banner naming the variable instead of failing silently.

---

## Payments

PayPal Orders v2, replacing the previous Dodo integration.

1. `POST /api/paypal/create-order` — records a `pending` top-up, opens a PayPal order against it.
   No balance moves.
2. `POST /api/paypal/capture-order` — captures the payment, checks the captured amount against
   what the order was opened for, then calls `confirm_topup`.

Safeguards: the buyer is identified from their Supabase access token, never from the request body;
a top-up can only be completed by the account that started it; the captured amount must match; and
`confirm_topup` is idempotent, so a double-click, a retry or a duplicate webhook credits once.

Going live: test with the **Sandbox** app credentials and `PAYPAL_ENV=sandbox` (PayPal gives you
test buyer accounts), then swap in the **Live** credentials and set `PAYPAL_ENV=live`.

---

## Pictures

Every person and every backer renders a picture, always:

1. the stored photo (Wikimedia URL, or a path in Supabase storage), or
2. a deterministic initials tile — a gradient derived from that person's own name — when the photo
   is missing or fails to load.

A person with no photo now costs zero network requests instead of one guaranteed 404, and no card
is ever blank.

Supporter photos are cropped square and resized to 512px **in the browser** before upload, so a
large phone photo becomes a ~60KB file. They go to the `avatars` bucket, where the storage policy
only allows writing inside a folder named after your own user id.

---

## Pages

```
/index.html       — grouped category grid, 2-face tiles, unclaimed boards, live activity
/category.html    — one board (?slug=footballers), tapering ranks, paginated
/person.html      — portrait + fan leaderboard (?slug=lionel-messi)
/fans.html        — Greatest Fan of All Time: profile (photo/name/social) + bidding + the board
/wallet.html      — magic-link auth, balance, PayPal top-ups, history
/admin.html       — manage people and photos (all writes server-side behind ADMIN_PASSWORD)
/rules.html  /about.html  /terms.html  /privacy.html
```

---

## Local development

```bash
npm install
cp .env.example .env      # then fill in your real values — .env is git-ignored
npm run dev               # http://localhost:3000
```

`server.mjs` serves the static files, runs the same `/api/*` handlers Vercel runs, and proxies and
caches Wikimedia images so portraits resolve offline. `vercel dev` also works.

---

## Seeding

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.js
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.js --dry
```

Every script reads its credentials from the environment via `scripts/env.mjs` and fails loudly if
they are missing — none of them carry a baked-in key any more. A `.env` file in the project root
works too.

---

## Schema

`users(balance_cents, total_spent_cents, photo_url, social_platform, social_handle, tagline)`
`public_profiles` (view) `categories` `people(total_cents, first_backed_at, photo_credit/license)`
`bids` `topups(provider, provider_payment_id, paypal_order_id)` `fan_totals` `site_stats`.

`place_bid(p_person_id, p_amount_cents)` locks the user row, checks balance, enforces +$5 to take
#1, and updates everything in one transaction. Ranking is `total_cents desc, first_backed_at asc`.

`confirm_topup(p_topup_id, p_payment_id, p_amount_cents)` is the only path that adds balance.

`update_my_profile(...)` is how a signed-in person edits their own public profile — it cannot touch
balance.

---

## Design

Hall of fame, dark `--bg #0F0E0C`, gold `--gold #D4A24C`, Anton/Archivo Black + Inter. Square
photos, `cover center 30%`, `saturate(.85) contrast(1.05)` with an 8% warm overlay. Ranks taper
from #1 at 280px down to 64px from #11.

Responsive throughout: verified with no horizontal overflow and no console errors at 390px and
1440px. Inputs are 16px (so iOS Safari does not zoom on focus) and at least 44px tall.

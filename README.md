# GOAT.lol — Who's the greatest of all time?

Vanilla HTML/CSS/JS. No framework, no build step. Supabase via CDN. Vercel serverless (2 functions) + Node seed script.

## Concept
Pay-to-rank leaderboards for the greatest of all time, ~65 boards — sport, screen, music, science, business, culture. Fans buy credit, then spend it backing whoever they believe in. The money is the ranking.

## Credits
Minimum top-up $5 ($5/$10/$25/$50/$100). Credit never expires, non-refundable. $1 minimum per bid after. Adding a person costs $1 from balance. Dodo $0.40 paid once per top-up, not per $1 bid.

## Pages
```
/index.html       — grouped category grid, 2-face tiles, unclaimed, live activity
/category.html    — one board (?slug=footballers) tapering 280px→64px + Back stepper RPC
/person.html      — portrait + fan leaderboard (?slug=lionel-messi)
/fans.html        — global top backers
/wallet.html      — magic-link auth + balance + top-ups + history
/rules.html  /about.html  /terms.html  /privacy.html
/admin.html       — manage categories/people, swap photos
/css/style.css    — dark #0F0E0C + gold #D4A24C, photo normalization
/js/supabase.js   — auth + balance pill
/js/feed.js       — (category board logic in page)
/api/checkout.js  — Dodo top-up $5-100 → pending
/api/payment-done.js — Dodo webhook → add balance (idempotent)
/scripts/seed.js  — Wikidata SPARQL + 800x800 + Supabase storage
supabase.sql      — users/categories/people/bids/topups/fan_totals + place_bid RPC
```

## Schema
`users(balance_cents)` `categories` `people(total_cents,first_backed_at,photo_credit/license)` `bids` `topups` `fan_totals` `site_stats`. `place_bid(p_person_id, p_amount_cents)` locks user row, checks balance, enforces +$5 for #1, updates all in one txn. Ranking `total_cents desc, first_backed_at asc`.

## Design
Hall of fame, dark `--bg #0F0E0C`, gold `--gold #D4A24C`, Anton/Archivo Black + Inter, square `cover center 30%` `saturate(.85) contrast(1.05)` + 8% warm overlay + bottom gradient, initials fallback gold on `--surface`, fixed ratios, tapering #1 280px/48px/42px gold → #11+ 64px/18px/17px.

## Seed
```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.js
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.js --dry
```
Queries Wikidata for humans by occupation, ordered by sitelink count, limit 20, downloads image 800x800, verifies CC-BY-SA, stores licence/author, seeds $0. Manual review ~3min/board.

## Env
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DODO_API_KEY
DODO_WEBHOOK_SECRET
ADMIN_PASSWORD
```

## Local dev
```
npx serve .
# or
python3 -m http.server 8000
```
`vercel dev` for serverless.

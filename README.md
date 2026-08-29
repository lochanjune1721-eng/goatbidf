# GOAT.lol

Pay-to-rank leaderboards for the greatest of all time, across ~83 boards — sport,
screen, music, science, business, culture. Fans buy credit, then spend it backing
whoever they believe in. **The money is the ranking.** No algorithm, no free votes.

Inside each person's page is a second leaderboard: their top fans, by total spent.
The top three are named on the person's card.

Vanilla HTML, CSS and JavaScript. No framework, no bundler, no build step.
Supabase over the CDN tag. Two Vercel functions for Dodo Payments. One Node
script for seeding.

---

## The moment the product turns on

Someone taps `$1` on Messi, the number moves, the board reorders, and their
handle appears on his fan list. No modal, no confirmation, no redirect, no
reload. That is `js/board.js`; everything else is packaging.

That is only possible because of credits. One card transaction of $5+, then
unlimited $1 bids from balance — the processor's fixed fee is paid once instead
of on every dollar.

---

## Credit and the rules

| | |
|---|---|
| Minimum top-up | $5 — fixed amounts of $5, $10, $25, $50, $100 |
| Per bid | $1 minimum, whole dollars only |
| Adding a person | $1 from balance, and that dollar is their first backing |
| Credit | never expires, **non-refundable**, said plainly at checkout |
| Taking #1 | costs at least **$5 more** than the current leader |
| Ties | equal totals stay in the order reached — earlier keeps the higher rank |
| Everything else | cumulative, public, permanent, never refunded or decayed |

**Spending is a Postgres function, never client code.** `place_bid()` locks the
user's row, checks the balance, deducts, inserts the bid, adds to the person's
total, upserts `fan_totals`, and stamps `first_backed_at` — one transaction. The
client cannot write a balance; there is no insert/update/delete policy on any
table.

The `$5 to take #1` rule lives inside that function too, so it cannot be bypassed
by calling the RPC directly. A bid that would land between the leader's total and
that threshold is refused, and the error names the amount that would actually
work.

`credit_balance()` is the other half — the only thing that adds money, called
solely by the webhook with the service role key, and explicitly **not granted**
to `anon` or `authenticated`.

---

## Making mismatched photos look like one set

This decides whether the site looks made or scraped, so the treatment lives in
one place (`.ph` in `css/style.css`) and every photo goes through `G.photo()`.

- Every photo square, `object-fit: cover`, `object-position: center 30%` so faces
  sit where faces actually are in press portraits
- `filter: saturate(.85) contrast(1.05)` plus a warm wash at 8% on all of them —
  the single biggest trick; a 2009 press photo and a 2024 portrait become one set
- Bottom gradient wherever a name sits on the image, so it stays legible against
  any background
- Missing photo → initials in the display face, gold on `--surface`. Deliberate,
  not a hole
- Fixed aspect ratios everywhere; source dimensions never dictate layout

---

## The boards

**147 boards, 2,926 contenders, curated by hand.** There is no Wikidata query
behind this and nothing in it is a placeholder — `scripts/goat-data.js` is the
single source of truth, and `sql/seed.sql` is generated from it.

Ten boards hold fewer than 20 because that is how many real entries exist —
there have only ever been 15 Indian prime ministers. They are left short on
purpose: a board with 15 real names beats one padded to 20 with invented ones,
and anyone can add a missing name for $1.

**Everyone seeds at $0 and nobody is pre-ranked.** The first $1 on a board takes
#1. Since every total starts equal, the ranking rule falls through to
`created_at`, so the seed spaces that by the curated position — the board opens
in the hand-picked order rather than an arbitrary one, without anyone holding a
cent.

Editing the list:

```bash
# edit scripts/goat-data.js, then
node scripts/make-seed-sql.mjs      # regenerates sql/seed.sql
```

`sql/seed.sql` is safe to re-run: existing rows keep their id, their money and
their position, and only names and grouping are refreshed.

## Images — resolved ahead of time, served from Wikimedia's CDN

No page ever searches Wikimedia. A contender is looked up **once, ever**, and
the answer lives in Postgres:

```
contender -> resolver -> Wikimedia Commons -> Supabase row
                                                   |
                              browser <-- thumbnail URL --> Wikimedia CDN
```

The browser receives `wikimedia_thumbnail_url` with the rest of the row and
hands it straight to `upload.wikimedia.org`. There is no image API call during
rendering, and nothing on the critical path waits for a search.

### Where it lives

| Piece | File |
|---|---|
| Resolver — the only code that talks to Wikimedia | `api/_wikimedia.js` |
| Bulk pass over all 2,926 | `scripts/resolve-images.mjs` |
| One person, on demand, cache-first | `api/photo.js` |
| The frontend component every image goes through | `js/img.js` (`window.GImg`) |
| Columns | `sql/image-columns.sql` (existing DB) / `sql/schema.sql` (fresh) |
| Performance test page | `/image-test.html` |

### It runs itself

Nobody presses anything. `/api/images` resolves what fits in one function
invocation, hands off to a fresh invocation of itself, and repeats until the
queue is empty — about an hour for 2,926, unattended. Three things start it:

- a **cron**, nightly (`vercel.json`)
- **any visitor** landing on a site with unresolved people — one call per
  browser session, not awaited, and nothing on the page depends on it
- **`/admin.html`**, which has a Start now button and a progress bar

Only one chain runs at a time: a lock row in `image_job` is handed from each
invocation to its successor, so a cron tick and fifty visitors at once produce
one chain, not fifty-one. A run that dies mid-flight stops writing heartbeats
and the next attempt takes over after three minutes.

If every lookup in a batch fails, the chain stops and records why rather than
grinding through 2,900 names against an endpoint that is refusing us. Rows are
left untouched, so a later run retries them.

**Or from a laptop, if you have one with the service role key on it:**

```bash
node scripts/resolve-images.mjs --dry-run --limit=20 --verbose   # look first
node scripts/resolve-images.mjs                                  # all of them
```

Both call the same resolver and write the same rows; the script is faster
because it is not paying for a round trip per batch.

Eight concurrent lookups with a second between batches — about five requests a
second, which is well inside what Wikimedia asks of bulk clients, and finishes
2,926 in roughly 25 minutes. `--batch` above 16 is refused.

It is resumable: interrupt it, run it again, and it picks up whatever is still
outstanding, because the progress is in the database rather than in memory.
Retries are exponential (2s, 4s, 8s) and only for things retrying can fix — a
429 or a 5xx, never a 404. A name that appears on two boards is resolved once
and written to both rows.

### How a match is verified

The bar is **correct over fast**. A name alone is not a query: there are four
Michael Jordans with articles and one of them played basketball.

1. The board's group supplies context — `Basketball` searches
   "Michael Jordan basketball", `Football` searches "Michael Jordan footballer",
   and boards about clubs, films, cars or characters add their own qualifier.
2. A disambiguation page is rejected outright; it has no subject and therefore
   no correct photo.
3. The article has to be about *this* person: the title must carry the name,
   and the opening paragraph must mention the field the board is about.
4. The licence must be reusable. CC0, CC BY, CC BY-SA, public domain, GFDL.
   Fair use is skipped, and recorded as skipped.

Anything short of that is stored as **`needs_review`** and **not shown**.
Attaching a maybe-wrong face to a real person is worse than showing initials.
Uncertain matches are listed in `image-review.json` and reviewable in
`/admin.html`, where each one shows the candidate at 120px with "Use this",
"Wrong — drop it", and "Look again".

### Thumbnail sizes

`wikimedia_thumbnail_url` is stored at 320px via imageinfo's `iiurlwidth`. The
original is never used and never stored as a display URL — a 4000px press photo
behind a 64px avatar is the problem this exists to avoid.

Wikimedia thumbnail URLs carry their width in the filename
(`.../320px-Name.jpg`), so `js/img.js` derives 160/240/320/480/640 from the one
stored URL for a `srcset`, with no further API call. `wikimedia_width` is the
**original's** width and caps that ladder: Wikimedia's thumbnailer answers 400,
not 404, when asked for more pixels than the source has.

### What loads first

| | |
|---|---|
| Ranks 1-2 | `loading="eager"`, `fetchpriority="high"`, and preloaded |
| Ranks 3-8 | `loading="eager"`, ordinary priority |
| Everything else | no `src` at all until an IntersectionObserver with `rootMargin: 800px` reaches it |

A below-fold image is rendered with `data-src` rather than `src`, so nothing is
fetched regardless of what a browser's own lazy heuristic decides. A fifty-row
board therefore opens by fetching eight images, not fifty.

Every image carries `width`, `height` and `decoding="async"`, and `.ph` has
`aspect-ratio: 1/1` in CSS, so a card never moves when a picture arrives.

Only two preloads, and they carry `imagesrcset`/`imagesizes` matching the
element's — a preload naming a different width than the `srcset` will pick
fetches the image twice. Measured: 8 requests on load, 20 after scrolling, no
duplicates.

> On a client-rendered page the preload is marginal: the `<link>` and the
> `<img>` are discovered in the same tick, so it mostly documents intent. It is
> there because it costs nothing once the candidates match, not because it is
> load-bearing.

### Missing and failed

`missing` renders initials in gold and requests nothing, ever. There is no
retry on page load — a name that has failed three times is settled, and
`/api/photo` returns the stored verdict without contacting Wikimedia. Coverage
of roughly 60-75% is the realistic outcome; the rest genuinely have no freely
licensed photograph.

### Self-hosting

Once a person is identified, the same self-running chain copies their picture
into our own `photos` bucket at the three sizes the CSS renders:

```
photos/100/lionel-messi.jpg     list rows
photos/300/lionel-messi.jpg     the top of a board
photos/800/lionel-messi.jpg     a person page
people.photo_path = 'lionel-messi.jpg'
```

One column, three files. `js/img.js` builds the size folders around the name,
so there is no list to keep in sync, and it falls back to the Wikimedia URL for
anyone not yet copied — a board is never blank while the pass works through
2,926 people.

No resizing happens: Wikimedia's thumbnailer produces those widths exactly, so
the deploy keeps its zero dependencies. A download that fails counts an attempt
and records why, and stops after three; `image_status` is untouched, because
failing to fetch a picture is not a doubt about who someone is.

**Two things worth knowing before you turn this on.**

*Storage.* Three sizes across 2,926 people is roughly **300MB**, not 30MB —
the 800px copies dominate. Supabase's free tier gives 1GB. Dropping to
`100,300` brings it near 60MB if that matters.

*Egress.* Self-hosting moves the bandwidth onto your Supabase quota, and the
free tier is 2GB a month — a few thousand page views. Wikimedia's CDN is free
and has no such ceiling. If the bill matters more than the control, leaving
`photo_path` null and serving the Wikimedia URLs is a supported state, not a
broken one.

#### WebP, if you want it

```bash
npm install sharp                    # not a deploy dependency
node scripts/download-images.mjs     # --sizes=100,300 --limit=50 --dry-run
```

The one thing that needs an image library: re-encoding to WebP, about 30%
smaller, and cropping to a true square with `position: 'attention'` so faces
stay centred rather than trusting `object-fit`. It writes the same layout as
the server does, so the two are interchangeable per person.

## One thing I could not verify

**Dodo's exact API shape.** Everything Dodo-specific is confined to three
functions at the bottom of `api/_lib.js`. Verify before going live:

- `DODO_API_BASE` — test vs live host
- `createDodoCheckout()` — endpoint path and body field names
- `verifyDodoWebhook()` — written to the Standard Webhooks spec
  (`webhook-id` / `webhook-timestamp` / `webhook-signature`, HMAC-SHA256 base64
  over `id.timestamp.body`, secret base64 after the `whsec_` prefix)

If Dodo differs, only those three functions change.

**Before building further: confirm with Dodo that this product is approved.**
A site where people pay to rank public figures *and* hold a stored balance is
unusual on both counts. Their docs say a rejected product gets one appeal and
that decision is final, so this is worth a conversation before more work goes in.

## Setup

1. **Database** — paste `sql/schema.sql` into the Supabase SQL editor and run it.
   Tables, `place_bid`, `credit_balance`, RLS, realtime, and the `photos` bucket.

   The script opens with a **reset block that drops and recreates every table**.
   It is there because this project previously held two other schemas whose
   tables collide with these — the old `bids` keys on `entry_id` where this one
   keys on `person_id`, and `create table if not exists` silently keeps the old
   shape, so the run dies at the first index. The reset makes the script
   re-runnable from any state. **It deletes data** — on a database that has
   taken real money, delete that block and migrate by hand.
2. **Client keys** — put the Supabase URL and anon key into `js/config.js`. No
   build step, so env vars cannot reach static files; the anon key is public by
   design. Nothing secret goes there.
3. **Vercel env** — copy `.env.example` into the project's environment variables.
4. **Seed** — run `sql/seed.sql` in the same SQL editor. 147 boards and 2,926
   people, no network required. The site is fully live at this point.
5. **Photos** (optional) — `npm install sharp && node scripts/fetch-photos.js`.
6. **Review** — open `/admin.html` and go board by board: swap bad photos,
   delete wrong entries, add missing names. Three minutes a board is the
   difference between a site that looks made and one that looks scraped.
7. **Dodo webhook** — point it at `https://yourdomain/api/payment-done`.

## Files

```
index.html      grouped category grid, unclaimed, live feed
category.html   one board (?slug=) — the tapering leaderboard
person.html     portrait, total, rank, full fan leaderboard (?slug=)
fans.html       global top backers
wallet.html     balance, top-ups, profile, full history
rules.html  about.html  terms.html  privacy.html
admin.html      the manual review pass

css/style.css   the whole design system, photo treatment included
js/supabase.js  client, auth, queries, and the header shell (balance on every page)
js/board.js     the tapering board and one-tap backing
js/index.js  js/category.js  js/person.js  js/fans.js  js/wallet.js  js/admin.js

api/_lib.js         shared helpers; the Dodo adapter is the last block
api/checkout.js     create a pending topup, return Dodo's link
api/payment-done.js the webhook — the only place credit is added
api/admin.js        server-side password check, photo swaps, deletes

scripts/goat-data.js       147 boards, 2,926 names — the source of truth
scripts/make-seed-sql.mjs  regenerates sql/seed.sql from it
scripts/fetch-photos.js    optional Commons photo pass, licence-checked
sql/schema.sql             tables, place_bid, RLS, storage
sql/seed.sql               generated: the boards and their contenders
```

---

## Privacy and money safety

- **Emails are unreadable with the anon key.** RLS is row-level and cannot hide a
  column, so `users` rows are public and `SELECT` is revoked, then granted back on
  `id, display_name, is_anonymous, total_spent_cents, created_at` only. Your own
  balance comes back through the security-definer `me()`.
- **Balance never changes on the success page** — only on the webhook.
- Top-ups are idempotent twice over: `dodo_payment_id` is unique, and the
  pending→confirmed flip carries the old status in its filter, so two
  simultaneous webhooks credit exactly once.
- Only the five fixed top-up amounts are accepted; a client-chosen number would
  be a client-chosen price.
- Admin deletes refuse anyone holding money — contributions are permanent, and
  deleting the row would silently erase them.
- `SUPABASE_SERVICE_ROLE_KEY` is read only in `/api` and the seed script, and
  appears in nothing the browser downloads.

`terms.html` and `privacy.html` are honest drafts, not legal advice. Have a
lawyer read them before you take money — stored balances in particular attract
questions.

---

## Verified against real Postgres

The schema and `place_bid()` were exercised on a local Postgres 16 with a
Supabase shim (`auth.users`, `auth.uid()`, `storage.*`, the three roles), not
just read over. What passed:

- the reported `column "person_id" does not exist` reproduced, fixed, and the
  script then re-run three times cleanly on the same dirty database
- `sql/seed.sql` applied on top: 147 boards, 2,926 people, every board covered,
  zero placeholder names, and re-running changed nothing
- with the real seed loaded, $1 on an all-zero board takes #1; a $1 tie does not
  take it (the earlier-backed entry keeps the rank); $6 does
- $1 minimum, whole dollars, and insufficient balance all refused
- the $5 rule: with the leader at $10, a $11 bid is refused with
  *"needs $15 here, not $11"*, $14 is refused, $15 is accepted at rank 1
- a bid that stays below the leader is never blocked, and topping up your own
  leader is unconstrained
- tie ordering: two people at $10 rank by who was backed first
- `add_person` charges $1, seeds the person at $1 with one backer, and refuses
  both a non-Wikipedia link and an unknown board
- balance reconciles exactly across a run of bids, and `balance_never_negative`
  rejects a manual overdraw
- `credit_balance()` is unreachable by `anon` and `authenticated`
- `anon` cannot read `users.email` or `users.balance_cents`, but can read
  `display_name`
- zero INSERT/UPDATE/DELETE policies exist on any table

## Quality floor

Responsive to 360px, verified in headless Chromium at 360 / 768 / 1440 — category
tiles stack #1 above #2 on mobile, and the taper survives. Every photo is
`loading="lazy"`. Keyboard focus is a gold ring. Photo credit and licence on every
person page. Balance in the header on every page, from one shared shell so it
cannot drift.

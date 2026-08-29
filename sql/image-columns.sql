-- ===========================================================================
-- GOAT.lol — resolved Wikimedia image data on people.
--
-- Run this once in the Supabase SQL editor. It is additive and re-runnable:
-- nothing here drops or rewrites a row, so it is safe on a live database.
-- sql/schema.sql carries the same columns for a fresh install.
--
-- The site never searches Wikimedia while a page renders. These columns are
-- the whole point: a resolver fills them in ahead of time, and the browser
-- reads a URL it can hand straight to Wikimedia's CDN.
-- ===========================================================================

alter table people
  -- Identity of the file on Commons, so a human can audit or replace it.
  add column if not exists wikimedia_file_title   text,
  add column if not exists wikimedia_page_url     text,
  add column if not exists wikimedia_original_url text,
  -- What the browser actually loads. Sized for a card, never the original.
  add column if not exists wikimedia_thumbnail_url text,
  -- Dimensions of the ORIGINAL, not of the thumbnail. The client derives
  -- other widths from the thumbnail URL and needs this to know when to stop:
  -- Wikimedia's thumbnailer answers 400, not 404, when asked for more pixels
  -- than the source has.
  add column if not exists wikimedia_width  int,
  add column if not exists wikimedia_height int,
  add column if not exists image_license text,
  add column if not exists image_author  text,
  -- pending | verified | needs_review | missing
  add column if not exists image_status text default 'pending',
  add column if not exists image_last_checked timestamptz,
  -- Why a resolve landed where it did, and how many times we have tried.
  -- Together these stop a failed name being retried forever.
  add column if not exists image_note     text,
  add column if not exists image_attempts int default 0,
  -- Self-hosting: once the bytes are in our own bucket, photo_path holds the
  -- base file name and the site builds 100/300/800 paths around it. Counted
  -- separately from image_attempts, because failing to download a picture we
  -- have already identified is a different problem from failing to find one.
  add column if not exists photo_attempts int default 0,
  add column if not exists photo_note     text;

do $$ begin
  alter table people add constraint people_image_status_ck
    check (image_status in ('pending', 'verified', 'needs_review', 'missing'));
exception when duplicate_object then null; end $$;

-- Rows already carrying a self-hosted photo are done; do not queue them.
update people
   set image_status = 'verified', image_last_checked = coalesce(image_last_checked, now())
 where photo_path is not null and coalesce(image_status, 'pending') = 'pending';

update people set image_status = 'pending' where image_status is null;

-- The bulk resolver's only query is "what is still outstanding", and it runs
-- it once per batch across 2,926 rows.
create index if not exists people_image_status_idx on people (image_status);
-- The caching pass asks for exactly this set, every batch.
create index if not exists people_to_cache_idx
  on people (image_status) where photo_path is null;

-- people is public-read with no column revoke, so these are readable by anon
-- as soon as they exist. Nothing to grant.
--
-- Nothing to revoke either: every column here is already public information —
-- a Commons file title, a CDN URL, a licence and an author credit. The write
-- path is unchanged, which is to say there isn't one: no insert, update or
-- delete policy exists on people, so only the service role can fill these in.

-- ===========================================================================
-- The resolver runs itself, so it needs somewhere to say "I am already
-- running". One row. Without it, a cron tick and three page loads would all
-- start resolving the same people at the same time.
-- ===========================================================================

create table if not exists image_job (
  id         int primary key default 1 check (id = 1),
  running    boolean default false,
  started_at timestamptz,
  -- Touched after every batch. A run that dies mid-flight leaves running=true
  -- forever, so a stale heartbeat is what lets the next tick take over.
  last_beat  timestamptz,
  done       int default 0,
  note       text
);
insert into image_job (id) values (1) on conflict (id) do nothing;

alter table image_job enable row level security;
-- No policy: nobody reaches this except the service role, which bypasses RLS.
-- The progress numbers the admin page shows come from counting people rows.

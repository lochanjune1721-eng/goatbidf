-- GOAT.lol — schema, RLS, and the spending function.
-- Paste into the Supabase SQL editor and run once.
--
-- The rule that matters most: the client never writes a balance. Credit moves
-- in exactly two places -- the Dodo webhook (service role) and place_bid()
-- below, which runs as a single locked transaction.

-- ===========================================================================
-- 0. RESET  --  read this before running
--
-- This database has held two earlier schemas (a hiring board, then a
-- pay-to-rank job board). Their tables collide with these ones: the old `bids`
-- keys on `entry_id` where this one keys on `person_id`, and `create table if
-- not exists` silently keeps the old shape -- so the run dies at the first
-- index with `column "person_id" does not exist`.
--
-- This block drops every table from those builds and from this one, so the
-- script always starts from a known state and can be re-run safely.
--
-- IT DELETES DATA. On a database that has taken real money, delete this block
-- and migrate by hand instead.
-- ===========================================================================

drop trigger if exists on_auth_user_created on auth.users;

drop function if exists handle_new_user()               cascade;
drop function if exists me()                            cascade;
drop function if exists set_profile(text, boolean)      cascade;
drop function if exists place_bid(uuid, int)            cascade;
drop function if exists add_person(text, text, text, text) cascade;
drop function if exists credit_balance(uuid, int)       cascade;
drop function if exists record_visit()                  cascade;
-- left over from the earlier builds
drop function if exists on_bid_inserted()               cascade;
drop function if exists on_click_inserted()             cascade;
drop function if exists record_view(uuid)               cascade;

-- this build
drop table if exists image_job       cascade;
drop table if exists fan_totals      cascade;
drop table if exists topups          cascade;
drop table if exists bids            cascade;
drop table if exists people          cascade;
drop table if exists users           cascade;
-- earlier builds
drop table if exists contact_reveals cascade;
drop table if exists recruiter_notes cascade;
drop table if exists clicks          cascade;
drop table if exists entries         cascade;
drop table if exists boards          cascade;
-- same names, wrong shape
drop table if exists categories      cascade;
drop table if exists site_stats      cascade;

-- ===========================================================================
-- 1. TABLES
-- ===========================================================================

create table if not exists users (
  id uuid primary key,              -- supabase auth id
  email text unique,
  display_name text,
  is_anonymous boolean default false,
  balance_cents int default 0,
  total_spent_cents int default 0,
  created_at timestamptz default now(),
  constraint balance_never_negative check (balance_cents >= 0)
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique, name text, group_name text, sort_order int
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  category_id uuid references categories(id) on delete cascade,
  name text,
  blurb text,
  wikipedia_url text,
  photo_path text,
  photo_credit text,
  photo_license text,
  -- Resolved Wikimedia image. Filled in ahead of time by scripts/resolve-images.mjs
  -- or api/photo.js; never looked up while a page renders. See sql/image-columns.sql,
  -- which adds these to a database that already exists.
  wikimedia_file_title text,
  wikimedia_page_url text,
  wikimedia_original_url text,
  wikimedia_thumbnail_url text,
  wikimedia_width int,
  wikimedia_height int,
  image_license text,
  image_author text,
  image_status text default 'pending'
    check (image_status in ('pending', 'verified', 'needs_review', 'missing')),
  image_last_checked timestamptz,
  image_note text,
  image_attempts int default 0,
  photo_attempts int default 0,
  photo_note text,
  total_cents int default 0,
  backer_count int default 0,
  first_backed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  person_id uuid references people(id) on delete cascade,
  amount_cents int,
  created_at timestamptz default now()
);

create table if not exists topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  amount_cents int,
  dodo_payment_id text unique,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists fan_totals (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  user_id uuid references users(id),
  total_cents int default 0,
  unique (person_id, user_id)
);

create table if not exists site_stats (
  id int primary key default 1,
  visitor_count int default 0,
  launched_at timestamptz default now()
);
insert into site_stats (id) values (1) on conflict (id) do nothing;

-- Ranking is `total_cents desc, first_backed_at asc`, so index it that way.
create index if not exists people_rank_idx
  on people (category_id, total_cents desc, first_backed_at asc nulls last);
create index if not exists people_total_idx on people (total_cents desc);
create index if not exists bids_recent_idx on bids (created_at desc);
create index if not exists bids_person_idx on bids (person_id);
create index if not exists fan_totals_person_idx on fan_totals (person_id, total_cents desc);
create index if not exists users_spent_idx on users (total_spent_cents desc);
create index if not exists topups_user_idx on topups (user_id, created_at desc);

-- ===========================================================================
-- 2. ACCOUNTS — a users row appears the moment someone signs in
-- ===========================================================================

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- The private half of your own row. Balance is never a client-writable column,
-- so it is read through here rather than selected directly.
create or replace function me() returns json
language plpgsql security definer set search_path = public as $$
declare u users%rowtype;
begin
  if auth.uid() is null then return null; end if;
  insert into users (id, email)
    values (auth.uid(), (select email from auth.users where id = auth.uid()))
    on conflict (id) do nothing;
  select * into u from users where id = auth.uid();
  return json_build_object(
    'id', u.id, 'email', u.email, 'display_name', u.display_name,
    'is_anonymous', u.is_anonymous, 'balance_cents', u.balance_cents,
    'total_spent_cents', u.total_spent_cents
  );
end $$;

create or replace function set_profile(p_name text, p_anonymous boolean)
returns json language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  update users
     set display_name = nullif(btrim(coalesce(p_name, '')), ''),
         is_anonymous = coalesce(p_anonymous, false)
   where id = auth.uid();
  return me();
end $$;

-- ===========================================================================
-- 3. place_bid — the only path from a balance to a board
-- ===========================================================================

create or replace function place_bid(p_person uuid, p_amount int)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user         uuid := auth.uid();
  v_bal          int;
  v_person       people%rowtype;
  v_new_total    int;
  v_leader_total int;
  v_leader_id    uuid;
  v_rank         int;
  v_needed       int;
begin
  if v_user is null then raise exception 'Sign in to back someone.'; end if;
  if p_amount is null or p_amount < 100 then raise exception 'Minimum is $1.'; end if;
  if p_amount % 100 <> 0 then raise exception 'Whole dollars only.'; end if;

  -- Lock the spender first, then the person. Same order everywhere, so two
  -- simultaneous bids can never deadlock against each other.
  select balance_cents into v_bal from users where id = v_user for update;
  if v_bal is null then raise exception 'No account found. Sign in again.'; end if;
  if v_bal < p_amount then
    raise exception 'Not enough credit. You have $% and this costs $%.',
      (v_bal / 100), (p_amount / 100);
  end if;

  select * into v_person from people where id = p_person for update;
  if v_person.id is null then raise exception 'That person is not on the board.'; end if;

  v_new_total := coalesce(v_person.total_cents, 0) + p_amount;

  -- Taking #1 costs at least $5 more than the current leader. Landing between
  -- the leader's total and that threshold is refused, with the shortfall named.
  select id, total_cents into v_leader_id, v_leader_total
    from people
   where category_id = v_person.category_id and id <> v_person.id
   order by total_cents desc, first_backed_at asc nulls last, created_at asc
   limit 1;

  if v_leader_id is not null
     and v_leader_total > 0
     and v_new_total > v_leader_total
     and v_new_total < v_leader_total + 500 then
    v_needed := v_leader_total + 500 - coalesce(v_person.total_cents, 0);
    raise exception 'Taking #1 costs at least $5 more than the leader. That needs $% here, not $%.',
      (v_needed / 100), (p_amount / 100);
  end if;

  update users
     set balance_cents = balance_cents - p_amount,
         total_spent_cents = coalesce(total_spent_cents, 0) + p_amount
   where id = v_user;

  insert into bids (user_id, person_id, amount_cents) values (v_user, p_person, p_amount);

  insert into fan_totals (person_id, user_id, total_cents)
  values (p_person, v_user, p_amount)
  on conflict (person_id, user_id)
    do update set total_cents = fan_totals.total_cents + excluded.total_cents;

  update people
     set total_cents     = v_new_total,
         first_backed_at = coalesce(first_backed_at, now()),
         backer_count    = (select count(*) from fan_totals where person_id = p_person)
   where id = p_person;

  select count(*) + 1 into v_rank
    from people
   where category_id = v_person.category_id
     and (total_cents > v_new_total
          or (total_cents = v_new_total and coalesce(first_backed_at, now()) < coalesce(v_person.first_backed_at, now())));

  return json_build_object(
    'total_cents', v_new_total,
    'balance_cents', v_bal - p_amount,
    'rank', v_rank,
    'person_id', p_person
  );
end $$;

-- Adding a name costs $1 from balance, the same as any bid, and that dollar is
-- the person's first backing.
create or replace function add_person(
  p_category text, p_name text, p_wikipedia_url text, p_blurb text
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_cat  categories%rowtype;
  v_slug text;
  v_id   uuid;
  n      int := 1;
begin
  if v_user is null then raise exception 'Sign in first.'; end if;
  if btrim(coalesce(p_name, '')) = '' then raise exception 'A name is required.'; end if;
  if coalesce(p_wikipedia_url, '') !~* '^https://[a-z-]+\.wikipedia\.org/wiki/.+' then
    raise exception 'A Wikipedia link is required. Names must be real public figures.';
  end if;

  select * into v_cat from categories where slug = p_category;
  if v_cat.id is null then raise exception 'No such board.'; end if;

  v_slug := regexp_replace(lower(btrim(p_name)), '[^a-z0-9]+', '-', 'g');
  v_slug := btrim(v_slug, '-');
  if v_slug = '' then v_slug := 'person'; end if;
  while exists (select 1 from people where slug = v_slug) loop
    n := n + 1;
    v_slug := regexp_replace(lower(btrim(p_name)), '[^a-z0-9]+', '-', 'g') || '-' || n;
  end loop;

  insert into people (slug, category_id, name, blurb, wikipedia_url)
  values (v_slug, v_cat.id, btrim(p_name), nullif(btrim(coalesce(p_blurb, '')), ''), p_wikipedia_url)
  returning id into v_id;

  perform place_bid(v_id, 100);
  return json_build_object('slug', v_slug, 'id', v_id);
end $$;

-- The other half of the balance story. Called only by the Dodo webhook with
-- the service role key, and deliberately NOT granted to anon or authenticated,
-- so no signed-in client can reach it.
create or replace function credit_balance(p_user uuid, p_amount int)
returns int language plpgsql security definer set search_path = public as $$
declare v_new int;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be positive.'; end if;
  update users set balance_cents = balance_cents + p_amount
   where id = p_user returning balance_cents into v_new;
  if v_new is null then raise exception 'No such user.'; end if;
  return v_new;
end $$;

revoke execute on function credit_balance(uuid, int) from anon, authenticated, public;

create or replace function record_visit() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update site_stats set visitor_count = coalesce(visitor_count, 0) + 1
   where id = 1 returning visitor_count into n;
  return n;
end $$;

grant execute on function me(), set_profile(text, boolean), place_bid(uuid, int),
                         add_person(text, text, text, text), record_visit()
  to anon, authenticated;

-- ===========================================================================
-- 4. ROW LEVEL SECURITY — no public writes anywhere
-- ===========================================================================

-- The resolver runs itself and needs somewhere to say "I am already running".
-- One row. Without it a cron tick and three page loads all start at once.
create table if not exists image_job (
  id         int primary key default 1 check (id = 1),
  running    boolean default false,
  started_at timestamptz,
  -- Touched after every batch. A run killed mid-flight cannot release
  -- anything, so a stale heartbeat is what lets the next tick take over.
  last_beat  timestamptz,
  done       int default 0,
  note       text
);
insert into image_job (id) values (1) on conflict (id) do nothing;
alter table image_job enable row level security;
-- No policy: only the service role reaches this, and it bypasses RLS.

create index if not exists people_image_status_idx on people (image_status);
create index if not exists people_to_cache_idx
  on people (image_status) where photo_path is null;

alter table categories  enable row level security;
alter table people      enable row level security;
alter table bids        enable row level security;
alter table fan_totals  enable row level security;
alter table site_stats  enable row level security;
alter table users       enable row level security;
alter table topups      enable row level security;

drop policy if exists "public read" on categories;
create policy "public read" on categories for select using (true);
drop policy if exists "public read" on people;
create policy "public read" on people for select using (true);
drop policy if exists "public read" on bids;
create policy "public read" on bids for select using (true);
drop policy if exists "public read" on fan_totals;
create policy "public read" on fan_totals for select using (true);
drop policy if exists "public read" on site_stats;
create policy "public read" on site_stats for select using (true);

-- Fan leaderboards need everyone's handle, but nobody's email or balance.
-- RLS is row-level and cannot hide a column, so the rows are public and the
-- private columns are removed with column privileges instead. Your own
-- balance comes back through me(), which is security definer.
drop policy if exists "public read handles" on users;
create policy "public read handles" on users for select using (true);
revoke select on users from anon, authenticated;
grant select (id, display_name, is_anonymous, total_spent_cents, created_at)
  on users to anon, authenticated;

drop policy if exists "own topups" on topups;
create policy "own topups" on topups for select using (user_id = auth.uid());

-- No insert/update/delete policy exists on any table. Balance moves only
-- through place_bid() and the Dodo webhook's service-role key.

-- ===========================================================================
-- 5. REALTIME — the activity feed subscribes to bids
-- ===========================================================================

do $$ begin
  alter publication supabase_realtime add table bids;
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- 6. STORAGE — bucket `photos`: public read, no public write.
--    The seed script writes with the service role; nobody else writes at all.
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "photos public read" on storage.objects;
create policy "photos public read" on storage.objects
  for select using (bucket_id = 'photos');

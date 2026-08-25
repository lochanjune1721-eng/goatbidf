-- GOAT.lol — schema + place_bid RPC + RLS. Run in Supabase SQL editor.
create extension if not exists "pgcrypto";

-- users (Supabase Auth id)
create table if not exists users (
  id uuid primary key,
  email text unique,
  display_name text,
  is_anonymous boolean default false,
  balance_cents int default 0 check (balance_cents >= 0),
  total_spent_cents int default 0 check (total_spent_cents >= 0),
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name text not null, group_name text not null, sort_order int
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  blurb text,
  wikipedia_url text,
  photo_path text,
  photo_credit text,
  photo_license text,
  total_cents int default 0 check (total_cents >= 0),
  backer_count int default 0,
  first_backed_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists people_category_rank_idx on people (category_id, total_cents desc, first_backed_at asc);
create index if not exists people_slug_idx on people (slug);

create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  amount_cents int not null check (amount_cents >= 100),
  created_at timestamptz default now()
);
create index if not exists bids_person_idx on bids (person_id, created_at desc);
create index if not exists bids_user_idx on bids (user_id, created_at desc);
create index if not exists bids_created_idx on bids (created_at desc);

create table if not exists topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  amount_cents int not null check (amount_cents >= 500),
  dodo_payment_id text unique,
  status text default 'pending' check (status in ('pending','confirmed','failed')),
  created_at timestamptz default now()
);

create table if not exists fan_totals (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  total_cents int default 0 check (total_cents >= 0),
  unique (person_id, user_id)
);
create index if not exists fan_totals_person_idx on fan_totals (person_id, total_cents desc);

create table if not exists site_stats (
  id int primary key default 1,
  visitor_count int default 0,
  launched_at timestamptz default now()
);
insert into site_stats (id) values (1) on conflict (id) do nothing;

-- storage for 800x800 photos
insert into storage.buckets (id, name, public) values ('people','people', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('logos','logos', true) on conflict (id) do nothing;

-- ============================================================
-- VOTES. 1 vote = 100 cents. Everything is stored in cents;
-- the display layer converts, so the two can never drift.
-- ============================================================

-- Old money-era RPC. place_vote replaces it; drop so there is one code path.
drop function if exists place_bid(uuid, int);

-- place_vote — the ONLY way to spend a balance. security definer, one txn,
-- row lock on the voter to prevent double-spend.
create or replace function place_vote(p_person_id uuid, p_votes int)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_cents int;
  v_balance int;
  v_new_total int;
  v_fan_total int;
begin
  if v_user is null then raise exception 'Not signed in'; end if;
  if p_votes is null or p_votes < 1 then raise exception 'Minimum 1 vote'; end if;
  if p_votes <> floor(p_votes) then raise exception 'Whole votes only'; end if;
  v_cents := p_votes * 100;

  if not exists (select 1 from people where id = p_person_id) then
    raise exception 'Person not found';
  end if;

  select balance_cents into v_balance from users where id = v_user for update;
  if v_balance is null then raise exception 'No account'; end if;
  if v_balance < v_cents then raise exception 'Not enough votes'; end if;

  update users
     set balance_cents = balance_cents - v_cents,
         total_spent_cents = total_spent_cents + v_cents
   where id = v_user;

  insert into bids (user_id, person_id, amount_cents)
  values (v_user, p_person_id, v_cents);

  update people
     set total_cents = total_cents + v_cents,
         first_backed_at = coalesce(first_backed_at, now())
   where id = p_person_id
  returning total_cents into v_new_total;

  insert into fan_totals (person_id, user_id, total_cents)
  values (p_person_id, v_user, v_cents)
  on conflict (person_id, user_id)
  do update set total_cents = fan_totals.total_cents + excluded.total_cents
  returning total_cents into v_fan_total;

  update people
     set backer_count = (select count(*) from fan_totals where person_id = p_person_id)
   where id = p_person_id;

  return json_build_object(
    'new_total', v_new_total,
    'balance',   v_balance - v_cents,
    'fan_total', v_fan_total
  );
end $$;

-- credit_balance — called by the payment layer (service role only), never by a
-- client. Idempotent on p_payment_id so a webhook retry cannot double-credit.
create or replace function credit_balance(p_user_id uuid, p_amount_cents int, p_payment_id text)
returns int language plpgsql security definer set search_path = public as $$
declare v_balance int;
begin
  if p_amount_cents is null or p_amount_cents < 500 then
    raise exception 'Minimum is 5 votes';
  end if;

  -- already applied? return the balance unchanged
  if exists (select 1 from topups where dodo_payment_id = p_payment_id and status = 'confirmed') then
    select balance_cents into v_balance from users where id = p_user_id;
    return coalesce(v_balance, 0);
  end if;

  insert into topups (user_id, amount_cents, dodo_payment_id, status)
  values (p_user_id, p_amount_cents, p_payment_id, 'confirmed')
  on conflict (dodo_payment_id) do nothing;

  update users
     set balance_cents = balance_cents + p_amount_cents
   where id = p_user_id
  returning balance_cents into v_balance;

  if v_balance is null then raise exception 'No account'; end if;
  return v_balance;
end $$;

revoke all on function credit_balance(uuid, int, text) from public, anon, authenticated;


-- add person to board (costs $1 from balance) — if not exists create with $0, else just bid
create or replace function add_person(p_category_id uuid, p_name text, p_blurb text, p_wikipedia_url text, p_photo_path text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  -- verify name has wikipedia entry (basic URL check)
  if p_wikipedia_url is null or p_wikipedia_url !~ '^https://' then raise exception 'wikipedia url required'; end if;
  insert into people (slug, category_id, name, blurb, wikipedia_url, photo_path) values (
    lower(regexp_replace(p_name, '[^a-z0-9]+', '-', 'gi')) || '-' || substr(md5(random()::text),1,4),
    p_category_id, p_name, p_blurb, p_wikipedia_url, p_photo_path
  ) returning id into v_id;
  return v_id;
end;
$$;

-- report_photo — a Report link on any fan photo flags it for manual review.
-- security definer because the reporter has no update rights on someone else's row.
create or replace function report_photo(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  update users set photo_status = 'flagged'
   where id = p_user_id and photo_status in ('pending','approved','none');
end $$;

-- visitor counter
create or replace function inc_visitor() returns void as $$ begin update site_stats set visitor_count = visitor_count + 1 where id=1; end; $$ language plpgsql;

-- profile columns for the fan half of every row
alter table users
  add column if not exists photo_path text,
  add column if not exists social_handle text,
  add column if not exists social_platform text,
  add column if not exists photo_status text default 'none',   -- none|pending|approved|flagged|rejected
  add column if not exists anon_session_id text unique;

create index if not exists fan_totals_person_idx on fan_totals (person_id, total_cents desc);
create index if not exists people_category_total_idx on people (category_id, total_cents desc);
create index if not exists users_spent_idx on users (total_spent_cents desc);

-- RLS
alter table users enable row level security;
alter table categories enable row level security;
alter table people enable row level security;
alter table bids enable row level security;
alter table topups enable row level security;
alter table fan_totals enable row level security;
alter table site_stats enable row level security;

drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);
drop policy if exists "public read people" on people;
create policy "public read people" on people for select using (true);
drop policy if exists "public read bids" on bids;
create policy "public read bids" on bids for select using (true);
drop policy if exists "public read fan_totals" on fan_totals;
create policy "public read fan_totals" on fan_totals for select using (true);
drop policy if exists "public read site_stats" on site_stats;
create policy "public read site_stats" on site_stats for select using (true);
drop policy if exists "users self read" on users;
create policy "users self read" on users for select using (auth.uid() = id);
drop policy if exists "users self insert" on users;
create policy "users self insert" on users for insert with check (auth.uid() = id);
drop policy if exists "users self update" on users;
create policy "users self update" on users for update using (auth.uid() = id) with check (auth.uid() = id);

-- RLS scopes rows, not columns. Without the column grants below, "users self
-- update" lets any signed-in user set their own balance_cents to anything they
-- like straight through the anon key. Balance and spend move ONLY through
-- place_vote / credit_balance, which are security definer.
revoke update on users from anon, authenticated;
grant update (display_name, is_anonymous, photo_path, social_handle, social_platform, photo_status)
  on users to authenticated;

-- Same reasoning for INSERT: the self-insert policy would otherwise let someone
-- create their own row with balance_cents already set. Both balance columns are
-- absent here, so they take their DEFAULT 0 and can never be client-supplied.
revoke insert on users from anon, authenticated;
grant insert (id, email, display_name, is_anonymous, photo_path, social_handle, social_platform, anon_session_id)
  on users to authenticated;

-- fan cards are public, so publish exactly the display fields and nothing else.
-- (email, balance_cents and total_spent_cents are deliberately absent.)
drop view if exists public_profiles;
create view public_profiles as
  select id, display_name, is_anonymous, photo_path, social_handle, social_platform, photo_status
  from users;
grant select on public_profiles to anon, authenticated;

-- One query per board instead of N+1: each person with their GOAT fan and the
-- runner-up fan's total, so the card can show "40 votes ahead of the next fan".
drop view if exists people_with_top_fan;
create view people_with_top_fan as
select
  p.id, p.slug, p.category_id, p.name, p.blurb, p.wikipedia_url,
  p.photo_path, p.photo_credit, p.photo_license,
  p.total_cents, p.backer_count, p.first_backed_at,
  f1.user_id            as fan_id,
  f1.total_cents        as fan_cents,
  f2.total_cents        as fan_runner_up_cents,
  u.display_name        as fan_name,
  u.is_anonymous        as fan_anonymous,
  u.photo_path          as fan_photo,
  u.social_handle       as fan_handle,
  u.social_platform     as fan_platform,
  u.photo_status        as fan_photo_status
from people p
left join lateral (
  select user_id, total_cents from fan_totals
  where person_id = p.id order by total_cents desc, user_id asc limit 1
) f1 on true
left join lateral (
  select total_cents from fan_totals
  where person_id = p.id order by total_cents desc, user_id asc offset 1 limit 1
) f2 on true
left join users u on u.id = f1.user_id;
grant select on people_with_top_fan to anon, authenticated;
drop policy if exists "topups self read" on topups;
create policy "topups self read" on topups for select using (auth.uid() = user_id);
-- no public writes on people/bids/fan_totals — only via RPC or service key
-- no public insert on users except self; balance only via RPC/webhook

drop policy if exists "public read people photos" on storage.objects;
create policy "public read people photos" on storage.objects for select using (bucket_id in ('people','logos','fans'));

-- fan photos: anyone signed in may upload, but only inside a folder named after
-- their own uid, so nobody can overwrite someone else's picture.
insert into storage.buckets (id, name, public) values ('fans','fans',true) on conflict (id) do nothing;
drop policy if exists "fans upload own" on storage.objects;
create policy "fans upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'fans' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "fans update own" on storage.objects;
create policy "fans update own" on storage.objects for update to authenticated
  using (bucket_id = 'fans' and (storage.foldername(name))[1] = auth.uid()::text);

-- seed categories (~65) — minimal starter, seed script fills people
insert into categories (slug,name,group_name,sort_order) values
  ('footballers','Footballers','Football',1),('managers','Managers','Football',2),('clubs','Clubs','Football',3),('goalkeepers','Goalkeepers','Football',4),
  ('batsmen','Batsmen','Cricket',5),('bowlers','Bowlers','Cricket',6),('all-rounders','All-rounders','Cricket',7),('captains','Captains','Cricket',8),('ipl-players','IPL Players','Cricket',9),('wicketkeepers','Wicketkeepers','Cricket',10),
  ('basketball-players','Basketball Players','Basketball',11),('basketball-teams','Basketball Teams','Basketball',12),
  ('tennis-men','Tennis — Men','Tennis',13),('tennis-women','Tennis — Women','Tennis',14),
  ('boxers','Boxers','Combat',15),('mma-fighters','MMA Fighters','Combat',16),('wrestlers','Wrestlers','Combat',17),
  ('f1-drivers','F1 Drivers','Motorsport',18),('f1-teams','F1 Teams','Motorsport',19),('motogp-riders','MotoGP Riders','Motorsport',20),
  ('track-athletes','Track Athletes','Other Sport',21),('swimmers','Swimmers','Other Sport',22),('golfers','Golfers','Other Sport',23),('hockey-players','Hockey Players','Other Sport',24),('gymnasts','Gymnasts','Other Sport',25),('cyclists','Cyclists','Other Sport',26),
  ('chess-players','Chess Players','Mind Sports',27),('esports-players','Esports Players','Mind Sports',28),('poker-players','Poker Players','Mind Sports',29),
  ('hollywood-actors','Hollywood Actors','Screen',30),('hollywood-actresses','Hollywood Actresses','Screen',31),('bollywood-actors','Bollywood Actors','Screen',32),('bollywood-actresses','Bollywood Actresses','Screen',33),('korean-actors','Korean Actors','Screen',34),('directors','Directors','Screen',35),('films','Films','Screen',36),('tv-shows','TV Shows','Screen',37),('animated-films','Animated Films','Screen',38),('villains','Villains','Screen',39),('comedians','Comedians','Screen',40),
  ('singers','Singers','Music',41),('rappers','Rappers','Music',42),('bands','Bands','Music',43),('guitarists','Guitarists','Music',44),('drummers','Drummers','Music',45),('composers','Composers','Music',46),('producers','Producers','Music',47),('djs','DJs','Music',48),('albums','Albums','Music',49),('playback-singers','Playback Singers','Music',50),('kpop-groups','K-pop Groups','Music',51),
  ('scientists','Scientists','Mind',52),('physicists','Physicists','Mind',53),('mathematicians','Mathematicians','Mind',54),('chemists','Chemists','Mind',55),('biologists','Biologists','Mind',56),('philosophers','Philosophers','Mind',57),('economists','Economists','Mind',58),('inventors','Inventors','Mind',59),('astronauts','Astronauts','Mind',60),
  ('novelists','Novelists','Words',61),('poets','Poets','Words',62),('playwrights','Playwrights','Words',63),('books','Books','Words',64),
  ('us-presidents','US Presidents','Power',65),('indian-pms','Indian PMs','Power',66),('emperors','Emperors','Power',67),('generals','Generals','Power',68),('revolutionaries','Revolutionaries','Power',69),
  ('founders','Founders','Business',70),('investors','Investors','Business',71),('ceos','CEOs','Business',72),('companies','Companies','Business',73),
  ('painters','Painters','Culture',74),('photographers','Photographers','Culture',75),('architects','Architects','Culture',76),('chefs','Chefs','Culture',77),('fashion-designers','Fashion Designers','Culture',78),('dancers','Dancers','Culture',79),
  ('youtubers','YouTubers','Internet',80),('streamers','Streamers','Internet',81),('podcasters','Podcasters','Internet',82),('ai-startups','AI Startups','Internet',83)
on conflict (slug) do nothing;

-- seed one person per spec note (empty boards where $1 takes #1 is better, but seed one for smoke)
do $$ declare cat uuid; begin
  select id into cat from categories where slug='footballers' limit 1;
  if cat is not null and not exists (select 1 from people where slug='lionel-messi') then
    insert into people (slug, category_id, name, blurb, wikipedia_url, photo_credit, photo_license, total_cents) values
      ('lionel-messi', cat, 'Lionel Messi', 'Eight-time Ballon d''Or winner.', 'https://en.wikipedia.org/wiki/Lionel_Messi', 'Photo: Wikimedia Commons', 'CC BY-SA 4.0', 0);
  end if;
end $$;

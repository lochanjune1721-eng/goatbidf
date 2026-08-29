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
  -- Greatest Fan board profile
  photo_url text,
  social_platform text check (social_platform is null or social_platform in
    ('instagram','x','tiktok','youtube','facebook','snapchat','twitch','other')),
  social_handle text,
  tagline text,
  profile_updated_at timestamptz,
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
  provider text default 'paypal',
  provider_payment_id text unique,
  paypal_order_id text unique,
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

-- place_bid RPC — the only way to spend credit
create or replace function place_bid(p_person_id uuid, p_amount_cents int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance int;
  v_slug text;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if p_amount_cents is null or p_amount_cents < 100 or p_amount_cents % 100 != 0 then
    raise exception 'minimum $1, whole dollars only';
  end if;

  -- lock user row
  select balance_cents into v_balance from users where id = v_user_id for update;
  if not found then
    insert into users (id, balance_cents) values (v_user_id, 0) returning balance_cents into v_balance;
  end if;
  if v_balance < p_amount_cents then
    raise exception 'insufficient balance';
  end if;

  -- check #1 +$5 rule
  select slug into v_slug from people where id = p_person_id;
  if not found then raise exception 'person not found'; end if;

  -- deduct, insert bid, update totals in one txn
  update users set balance_cents = balance_cents - p_amount_cents, total_spent_cents = total_spent_cents + p_amount_cents where id = v_user_id;
  insert into bids (user_id, person_id, amount_cents) values (v_user_id, p_person_id, p_amount_cents);
  update people set total_cents = total_cents + p_amount_cents,
    backer_count = (select count(distinct user_id) from bids where person_id = p_person_id),
    first_backed_at = coalesce(first_backed_at, now())
    where id = p_person_id;

  insert into fan_totals (person_id, user_id, total_cents)
    values (p_person_id, v_user_id, p_amount_cents)
    on conflict (person_id, user_id) do update set total_cents = fan_totals.total_cents + excluded.total_cents;

  -- enforce #1 +$5 at app layer is advisory; DB does not reject lower bids that would still be #2+
  -- but if this bid would make p_person #1 and gap <500, we reject here
  -- compute leader totals
  declare v_new_total int; v_leader_total int;
  begin
    select total_cents into v_new_total from people where id = p_person_id;
    select max(total_cents) into v_leader_total from people where category_id = (select category_id from people where id = p_person_id) and id <> p_person_id;
    if v_leader_total is not null and v_new_total > v_leader_total and v_new_total < v_leader_total + 500 then
      raise exception 'taking #1 costs at least $5 more than the current leader';
    end if;
  end;

  return jsonb_build_object('ok', true, 'new_total', (select total_cents from people where id = p_person_id));
exception when others then
  raise;
end;
$$;

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

-- visitor counter
create or replace function inc_visitor() returns void as $$ begin update site_stats set visitor_count = visitor_count + 1 where id=1; end; $$ language plpgsql;

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
create policy "users self update" on users for update using (auth.uid() = id);
-- RLS grants the whole row, so the policy above alone would let a signed-in
-- user run `update users set balance_cents = 99999999`. Column grants close it:
-- balance and lifetime spend are writable only by place_bid / confirm_topup.
revoke update on users from anon, authenticated;
grant update (display_name, is_anonymous, photo_url, social_platform, social_handle, tagline, profile_updated_at)
  on users to authenticated;
drop policy if exists "topups self read" on topups;
create policy "topups self read" on topups for select using (auth.uid() = user_id);
-- no public writes on people/bids/fan_totals — only via RPC or service key
-- no public insert on users except self; balance only via RPC/webhook

drop policy if exists "public read people photos" on storage.objects;
create policy "public read people photos" on storage.objects for select using (bucket_id in ('people','logos'));

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


-- ===========================================================================
-- Public profiles, atomic top-ups, and supporter photos
-- ===========================================================================
-- ---------------------------------------------------------------------------
-- 3. Make fan leaderboards visible
--
-- `users` stays private (it holds email and balance). This view exposes only
-- the public half, and honours the "stay anonymous" choice at the database
-- level so an anonymous backer's name cannot leak through the API.
-- ---------------------------------------------------------------------------
create or replace view public_profiles
with (security_invoker = false) as
  select
    id,
    case when is_anonymous then 'Anonymous' else coalesce(display_name, 'Someone') end as display_name,
    case when is_anonymous then null else photo_url       end as photo_url,
    case when is_anonymous then null else social_platform end as social_platform,
    case when is_anonymous then null else social_handle   end as social_handle,
    case when is_anonymous then null else tagline         end as tagline,
    is_anonymous,
    total_spent_cents,
    created_at
  from users;

grant select on public_profiles to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 5. confirm_topup — the only path that adds balance
--
-- Atomic (single UPDATE, no read-then-write race) and idempotent (a second
-- call for the same payment returns the same answer and credits nothing).
-- Called with the service role key from api/paypal-capture-order.js, after
-- PayPal has confirmed the money actually moved.
-- ---------------------------------------------------------------------------
create or replace function confirm_topup(
  p_topup_id   uuid,
  p_payment_id text,
  p_amount_cents int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_topup topups%rowtype;
  v_balance int;
begin
  select * into v_topup from topups where id = p_topup_id for update;
  if not found then
    raise exception 'topup not found';
  end if;

  if v_topup.status = 'confirmed' then
    select balance_cents into v_balance from users where id = v_topup.user_id;
    return jsonb_build_object('ok', true, 'duplicate', true, 'balance_cents', v_balance);
  end if;

  -- Trust the amount that was recorded when the order was opened, not anything
  -- the caller passes in; p_amount_cents is only cross-checked.
  if p_amount_cents is not null and p_amount_cents <> v_topup.amount_cents then
    raise exception 'amount mismatch: order was for % cents, payment was % cents',
      v_topup.amount_cents, p_amount_cents;
  end if;

  update topups
     set status = 'confirmed',
         provider_payment_id = coalesce(p_payment_id, provider_payment_id)
   where id = p_topup_id;

  update users
     set balance_cents = balance_cents + v_topup.amount_cents
   where id = v_topup.user_id
   returning balance_cents into v_balance;

  return jsonb_build_object('ok', true, 'duplicate', false, 'balance_cents', v_balance);
end;
$$;

revoke all on function confirm_topup(uuid, text, int) from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- 6. Let a signed-in person keep their own profile up to date
-- ---------------------------------------------------------------------------
create or replace function update_my_profile(
  p_display_name   text,
  p_photo_url      text,
  p_social_platform text,
  p_social_handle  text,
  p_tagline        text,
  p_is_anonymous   boolean
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid := auth.uid();
begin
  if v_id is null then raise exception 'not authenticated'; end if;

  if p_display_name is not null and length(trim(p_display_name)) > 60 then
    raise exception 'name too long';
  end if;
  if p_tagline is not null and length(p_tagline) > 180 then
    raise exception 'tagline too long';
  end if;
  if p_social_handle is not null and p_social_handle !~ '^[A-Za-z0-9._-]{0,60}$' then
    raise exception 'handle can only use letters, numbers, dots, dashes and underscores';
  end if;
  -- Only accept a hosted image URL; data: URIs would bloat every leaderboard row.
  if p_photo_url is not null and p_photo_url <> '' and p_photo_url !~ '^https://' then
    raise exception 'photo must be an https link';
  end if;

  insert into users (id, display_name) values (v_id, nullif(trim(coalesce(p_display_name,'')),''))
    on conflict (id) do nothing;

  update users set
    display_name    = coalesce(nullif(trim(coalesce(p_display_name,'')),''), display_name),
    photo_url       = coalesce(nullif(p_photo_url,''), photo_url),
    social_platform = coalesce(nullif(p_social_platform,''), social_platform),
    social_handle   = coalesce(nullif(trim(coalesce(p_social_handle,'')),''), social_handle),
    tagline         = coalesce(nullif(trim(coalesce(p_tagline,'')),''), tagline),
    is_anonymous    = coalesce(p_is_anonymous, is_anonymous),
    profile_updated_at = now()
  where id = v_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function update_my_profile(text, text, text, text, text, boolean) to authenticated;


-- ---------------------------------------------------------------------------
-- 7. Storage bucket for supporter photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('avatars','avatars', true)
  on conflict (id) do nothing;

drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

-- A signed-in person may only write inside a folder named after their own id.
drop policy if exists "own avatar write" on storage.objects;
create policy "own avatar write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own avatar update" on storage.objects;
create policy "own avatar update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own avatar delete" on storage.objects;
create policy "own avatar delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);


-- ---------------------------------------------------------------------------
-- 8. Index for the global Greatest Fan board
-- ---------------------------------------------------------------------------
create index if not exists users_total_spent_idx
  on users (total_spent_cents desc) where total_spent_cents > 0;

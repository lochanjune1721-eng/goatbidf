-- ============================================================
-- GOAT.lol — run this once in the Supabase SQL editor.
-- Safe to re-run: every statement is idempotent.
--
-- Adds: the vote ledger (place_vote / credit_balance), the fan columns,
-- the two views the boards read, and the RLS fix that stops a signed-in
-- user setting their own balance.
-- ============================================================

-- ---------- 1. profile columns for the fan half of every row ----------
alter table users
  add column if not exists photo_path text,
  add column if not exists social_handle text,
  add column if not exists social_platform text,
  add column if not exists photo_status text default 'none',   -- none|pending|approved|flagged|rejected
  add column if not exists anon_session_id text unique;

create index if not exists fan_totals_person_idx     on fan_totals (person_id, total_cents desc);
create index if not exists people_category_total_idx on people (category_id, total_cents desc);
create index if not exists users_spent_idx           on users (total_spent_cents desc);

-- ---------- 2. the vote ledger ----------
-- 1 vote = 100 cents. Money is stored in cents; only the display layer converts.
drop function if exists place_bid(uuid, int);

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

  insert into bids (user_id, person_id, amount_cents) values (v_user, p_person_id, v_cents);

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

  update people set backer_count = (select count(*) from fan_totals where person_id = p_person_id)
   where id = p_person_id;

  return json_build_object('new_total', v_new_total, 'balance', v_balance - v_cents, 'fan_total', v_fan_total);
end $$;

-- service role only; idempotent on payment id so a retry can't double-credit
create or replace function credit_balance(p_user_id uuid, p_amount_cents int, p_payment_id text)
returns int language plpgsql security definer set search_path = public as $$
declare v_balance int;
begin
  if p_amount_cents is null or p_amount_cents < 500 then raise exception 'Minimum is 5 votes'; end if;

  if exists (select 1 from topups where dodo_payment_id = p_payment_id and status = 'confirmed') then
    select balance_cents into v_balance from users where id = p_user_id;
    return coalesce(v_balance, 0);
  end if;

  insert into topups (user_id, amount_cents, dodo_payment_id, status)
  values (p_user_id, p_amount_cents, p_payment_id, 'confirmed')
  on conflict (dodo_payment_id) do nothing;

  update users set balance_cents = balance_cents + p_amount_cents
   where id = p_user_id returning balance_cents into v_balance;

  if v_balance is null then raise exception 'No account'; end if;
  return v_balance;
end $$;
revoke all on function credit_balance(uuid, int, text) from public, anon, authenticated;

-- Report link on any fan photo flags it for manual review
create or replace function report_photo(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  update users set photo_status = 'flagged'
   where id = p_user_id and photo_status in ('pending','approved','none');
end $$;

-- ---------- 3. the RLS fix ----------
-- RLS scopes rows, not columns. Without the grants below, "users self update"
-- lets any signed-in user set their own balance_cents through the anon key.
drop policy if exists "users self update" on users;
create policy "users self update" on users for update using (auth.uid() = id) with check (auth.uid() = id);

revoke update on users from anon, authenticated;
grant update (display_name, is_anonymous, photo_path, social_handle, social_platform, photo_status)
  on users to authenticated;

revoke insert on users from anon, authenticated;
grant insert (id, email, display_name, is_anonymous, photo_path, social_handle, social_platform, anon_session_id)
  on users to authenticated;

-- ---------- 4. the two views the pages read ----------
-- Public display fields only. email, balance_cents and total_spent_cents absent.
drop view if exists public_profiles;
create view public_profiles as
  select id, display_name, is_anonymous, photo_path, social_handle, social_platform, photo_status
  from users;
grant select on public_profiles to anon, authenticated;

-- One query per board instead of N+1: each contender with their GOAT fan and
-- the runner-up's total, so the card can show "40 votes ahead of the next fan".
drop view if exists people_with_top_fan;
create view people_with_top_fan as
select
  p.id, p.slug, p.category_id, p.name, p.blurb, p.wikipedia_url,
  p.photo_path, p.photo_credit, p.photo_license,
  p.total_cents, p.backer_count, p.first_backed_at,
  f1.user_id as fan_id, f1.total_cents as fan_cents, f2.total_cents as fan_runner_up_cents,
  u.display_name as fan_name, u.is_anonymous as fan_anonymous, u.photo_path as fan_photo,
  u.social_handle as fan_handle, u.social_platform as fan_platform, u.photo_status as fan_photo_status
from people p
left join lateral (select user_id, total_cents from fan_totals
  where person_id = p.id order by total_cents desc, user_id asc limit 1) f1 on true
left join lateral (select total_cents from fan_totals
  where person_id = p.id order by total_cents desc, user_id asc offset 1 limit 1) f2 on true
left join users u on u.id = f1.user_id;
grant select on people_with_top_fan to anon, authenticated;

-- ---------- 5. fan photo storage ----------
insert into storage.buckets (id, name, public) values ('fans','fans',true) on conflict (id) do nothing;
drop policy if exists "public read people photos" on storage.objects;
create policy "public read people photos" on storage.objects for select using (bucket_id in ('people','logos','fans'));
drop policy if exists "fans upload own" on storage.objects;
create policy "fans upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'fans' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "fans update own" on storage.objects;
create policy "fans update own" on storage.objects for update to authenticated
  using (bucket_id = 'fans' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 6. tell PostgREST about the new views ----------
-- Supabase usually reloads on its own, but this removes the guesswork:
-- without it you get "Could not find the table in the schema cache".
notify pgrst, 'reload schema';

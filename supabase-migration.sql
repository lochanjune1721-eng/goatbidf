-- ===========================================================================
-- GOAT.lol — migration for an EXISTING database.
--
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New
-- query -> paste -> Run). It is safe to run more than once.
--
-- Fixes, in order of severity:
--   1. Signed-in users could set their own balance_cents to anything.
--   2. Fan leaderboards were always empty (RLS hid every other user's row).
--   3. Top-ups credited balance with a read-then-write race, and were not
--      tied to a verified payment.
--   4. Adds the profile fields the Greatest Fan board needs (photo, social).
--   5. Moves top-ups from Dodo to PayPal.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Profile fields for the Greatest Fan board
-- ---------------------------------------------------------------------------
alter table users add column if not exists photo_url       text;
alter table users add column if not exists social_platform text;
alter table users add column if not exists social_handle   text;
alter table users add column if not exists tagline         text;
alter table users add column if not exists profile_updated_at timestamptz;

-- Only allow platforms the UI knows how to build a profile link for.
do $$ begin
  alter table users add constraint users_social_platform_chk
    check (social_platform is null or social_platform in
      ('instagram','x','tiktok','youtube','facebook','snapchat','twitch','other'));
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------------
-- 2. STOP users from writing their own balance
--
-- RLS grants access to the whole row, so "users self update" let anyone run
-- `update users set balance_cents = 99999999` from the browser. Postgres
-- column-level grants are the fix: revoke UPDATE on the table, then grant it
-- back only on the columns a person is allowed to change.
-- ---------------------------------------------------------------------------
revoke update on users from anon, authenticated;

grant update (display_name, is_anonymous, photo_url, social_platform, social_handle, tagline, profile_updated_at)
  on users to authenticated;

-- Balance and lifetime spend are writable only by SECURITY DEFINER functions
-- (place_bid, confirm_topup) and by the service role on the server.


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
-- 4. Top-ups: PayPal instead of Dodo, credited atomically
-- ---------------------------------------------------------------------------
alter table topups add column if not exists provider            text default 'paypal';
alter table topups add column if not exists provider_payment_id text;
alter table topups add column if not exists paypal_order_id     text;

-- Carry over any existing Dodo references, then retire the column.
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'topups' and column_name = 'dodo_payment_id') then
    update topups set provider_payment_id = dodo_payment_id,
                      provider = coalesce(provider, 'dodo')
      where provider_payment_id is null and dodo_payment_id is not null;
    alter table topups drop column dodo_payment_id;
  end if;
end $$;

-- One confirmed credit per PayPal payment, however many times a webhook or a
-- retried browser request asks for it.
create unique index if not exists topups_provider_payment_idx
  on topups (provider_payment_id) where provider_payment_id is not null;
create unique index if not exists topups_paypal_order_idx
  on topups (paypal_order_id) where paypal_order_id is not null;


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

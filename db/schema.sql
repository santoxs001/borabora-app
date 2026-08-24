-- ═══════════════════════════════════════════════════════════════════
--  HEY · PostgreSQL schema
--  Target: Postgres 15+ (Supabase-compatible). Run in order:
--     schema.sql → policies.sql → seed.sql
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";    -- fuzzy search on interests/bio
create extension if not exists "citext";     -- case-insensitive email

-- ── Enums ─────────────────────────────────────────────────────────

create type gender_identity as enum (
  'man','trans_man','non_binary','genderqueer','agender','questioning',
  'self_describe','prefer_not_to_say'
);

create type looking_for as enum (
  'dates','friends','chat','something_casual','relationship','see_what_happens'
);

create type vibe_key as enum (
  'date','drinks','chat','friends','now','looking','going_out','staying_in'
);

create type vibe_duration as enum ('1h','3h','today','until_off');

create type distance_precision as enum ('exact','approximate','hidden');

create type interaction_kind as enum ('pass','save','like','say_hey');

create type message_kind as enum ('text','photo','gif','audio','system');

create type moderation_state as enum ('pending','approved','rejected');

create type verification_status as enum ('unverified','pending','verified','failed');

create type report_reason as enum (
  'fake_profile','harassment','underage','nudity','spam','scam',
  'offline_behaviour','other'
);

create type report_state as enum ('open','reviewing','actioned','dismissed');

create type place_kind as enum ('bar','club','cafe','event','party');

create type subscription_plan as enum ('monthly','quarterly','yearly');

-- ── users ─────────────────────────────────────────────────────────
-- Auth identity only. Nothing here is ever returned to another user.

create table users (
  id                uuid primary key default gen_random_uuid(),
  email             citext unique,
  phone             text unique,
  -- Stored to enforce the 18+ gate and to recompute age; never exposed.
  birthdate         date not null,
  age_verified_at   timestamptz,
  verification      verification_status not null default 'unverified',
  created_at        timestamptz not null default now(),
  last_active_at    timestamptz not null default now(),
  deleted_at        timestamptz,
  banned_at         timestamptz,
  ban_reason        text,

  -- The age gate, enforced by the database itself. Application code
  -- cannot bypass it, and neither can a bad migration.
  constraint users_must_be_adult
    check (birthdate <= (current_date - interval '18 years'))
);

create index users_active_idx on users (last_active_at desc)
  where deleted_at is null and banned_at is null;

-- ── profiles ──────────────────────────────────────────────────────
-- The public face of a user. 1:1 with users.

create table profiles (
  user_id           uuid primary key references users(id) on delete cascade,
  display_name      text not null check (char_length(display_name) between 2 and 24),
  bio               text default '' check (char_length(bio) <= 180),
  pronouns          text check (char_length(pronouns) <= 20),
  gender_identity   gender_identity not null default 'man',
  gender_self       text check (char_length(gender_self) <= 40),
  looking_for       looking_for[] not null default '{}',
  city              text not null,
  country           char(2) not null,

  -- Location, coarsened before it ever reaches the database.
  -- Precision 6 ≈ 1.2 km × 0.6 km. There is no lat/lng column, by design:
  -- a column that does not exist cannot leak.
  geohash           char(6),
  geohash_updated_at timestamptz,

  -- Optional, self-declared detail. JSONB because the set evolves and
  -- none of it is ever queried for ranking.
  details           jsonb not null default '{}'::jsonb,

  is_plus           boolean not null default false,
  hidden            boolean not null default false,  -- paused profile
  search_vector     tsvector generated always as (
                      to_tsvector('simple', coalesce(display_name,'') || ' ' || coalesce(bio,''))
                    ) stored,
  updated_at        timestamptz not null default now()
);

create index profiles_geohash_idx  on profiles (geohash) where hidden = false;
-- Prefix search on the geohash is how "nearby" works: neighbouring cells
-- share a prefix, so proximity is an index range scan, not a distance sort.
create index profiles_geohash_prefix_idx on profiles (left(geohash, 4)) where hidden = false;
create index profiles_search_idx   on profiles using gin (search_vector);
create index profiles_city_idx     on profiles (country, city);

-- ── privacy_settings ──────────────────────────────────────────────

create table privacy_settings (
  user_id                uuid primary key references users(id) on delete cascade,
  distance_precision     distance_precision not null default 'exact',
  show_online_status     boolean not null default true,
  browse_privately       boolean not null default false,
  only_liked_can_see_me  boolean not null default false,
  blur_incoming_photos   boolean not null default true,
  messages_from_matches_only boolean not null default false,
  hide_from_contacts     boolean not null default false
);

-- ── photos ────────────────────────────────────────────────────────

create table photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  storage_path  text not null,
  position      smallint not null check (position between 0 and 8),
  moderation    moderation_state not null default 'pending',
  -- Perceptual hash: catches re-uploaded stock photos and known bad images.
  phash         bytea,
  created_at    timestamptz not null default now(),

  unique (user_id, position)
);

create index photos_user_idx on photos (user_id, position);
create index photos_moderation_idx on photos (moderation) where moderation = 'pending';
create index photos_phash_idx on photos (phash) where phash is not null;

-- ── interests ─────────────────────────────────────────────────────

create table interests (
  id        smallserial primary key,
  slug      text unique not null,
  label     text not null,
  category  text not null
);

create table profile_interests (
  user_id     uuid not null references users(id) on delete cascade,
  interest_id smallint not null references interests(id) on delete cascade,
  primary key (user_id, interest_id)
);

create index profile_interests_interest_idx on profile_interests (interest_id);

-- ── icebreakers ───────────────────────────────────────────────────

create table icebreaker_prompts (
  id      text primary key,
  prompt  text not null,
  active  boolean not null default true
);

create table icebreaker_answers (
  user_id   uuid not null references users(id) on delete cascade,
  prompt_id text not null references icebreaker_prompts(id) on delete cascade,
  answer    text not null check (char_length(answer) <= 90),
  primary key (user_id, prompt_id)
);

-- ── vibes ─────────────────────────────────────────────────────────
-- A user has at most one active vibe (two on HEY+, hence the table
-- rather than a column). Expiry is data, not a background job.

create table user_vibes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  vibe        vibe_key not null,
  duration    vibe_duration not null,
  started_at  timestamptz not null default now(),
  expires_at  timestamptz,          -- null = 'until_off'
  cleared_at  timestamptz
);

-- Partial index over *live* vibes only — the hot path for the Vibes screen.
create index user_vibes_live_idx on user_vibes (vibe, expires_at)
  where cleared_at is null;
create index user_vibes_user_idx on user_vibes (user_id) where cleared_at is null;

create view active_vibes as
  select distinct on (user_id) *
  from user_vibes
  where cleared_at is null
    and (expires_at is null or expires_at > now())
  order by user_id, started_at desc;

-- ── interactions ──────────────────────────────────────────────────
-- One row per (actor, target). A later action replaces the earlier one.

create table interactions (
  actor_id    uuid not null references users(id) on delete cascade,
  target_id   uuid not null references users(id) on delete cascade,
  kind        interaction_kind not null,
  message     text check (char_length(message) <= 140), -- say_hey opener
  created_at  timestamptz not null default now(),

  primary key (actor_id, target_id),
  constraint no_self_interaction check (actor_id <> target_id),
  constraint message_only_for_say_hey
    check (message is null or kind = 'say_hey')
);

-- "who liked me" — the HEY+ surface.
create index interactions_target_idx on interactions (target_id, created_at desc)
  where kind in ('like','say_hey');

-- ── matches ───────────────────────────────────────────────────────
-- Canonical ordering (a < b) makes a match unique regardless of who
-- acted first, and lets a single unique index enforce it.

create table matches (
  id            uuid primary key default gen_random_uuid(),
  user_a        uuid not null references users(id) on delete cascade,
  user_b        uuid not null references users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unmatched_at  timestamptz,
  unmatched_by  uuid references users(id),

  constraint match_ordered check (user_a < user_b),
  unique (user_a, user_b)
);

create index matches_user_a_idx on matches (user_a) where unmatched_at is null;
create index matches_user_b_idx on matches (user_b) where unmatched_at is null;

-- Creates the match when the second person reciprocates.
create or replace function fn_check_match() returns trigger
language plpgsql as $$
declare
  a uuid := least(new.actor_id, new.target_id);
  b uuid := greatest(new.actor_id, new.target_id);
begin
  if new.kind not in ('like','say_hey') then
    return new;
  end if;

  if exists (
    select 1 from interactions
    where actor_id = new.target_id
      and target_id = new.actor_id
      and kind in ('like','say_hey')
  ) then
    insert into matches (user_a, user_b)
    values (a, b)
    on conflict (user_a, user_b) do nothing;
  end if;

  return new;
end;
$$;

create trigger trg_check_match
  after insert or update on interactions
  for each row execute function fn_check_match();

-- ── conversations & messages ──────────────────────────────────────

create table conversations (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid unique references matches(id) on delete cascade,
  user_a        uuid not null references users(id) on delete cascade,
  user_b        uuid not null references users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  last_message_at timestamptz,

  constraint conversation_ordered check (user_a < user_b),
  unique (user_a, user_b)
);

create index conversations_a_idx on conversations (user_a, last_message_at desc nulls last);
create index conversations_b_idx on conversations (user_b, last_message_at desc nulls last);

create table messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  sender_id        uuid not null references users(id) on delete cascade,
  kind             message_kind not null default 'text',
  body             text check (char_length(body) <= 2000),
  media_path       text,
  duration_s       smallint,
  reply_to_id      uuid references messages(id) on delete set null,
  moderation       moderation_state not null default 'approved',
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

-- Thread pagination: newest-first within a conversation.
create index messages_conversation_idx
  on messages (conversation_id, created_at desc)
  where deleted_at is null;

create table message_reads (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  read_up_to      timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table message_reactions (
  message_id uuid not null references messages(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  emoji      text not null check (char_length(emoji) <= 8),
  primary key (message_id, user_id)   -- one reaction per person per message
);

-- ── safety ────────────────────────────────────────────────────────

create table blocks (
  blocker_id  uuid not null references users(id) on delete cascade,
  blocked_id  uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

-- Blocking must hide in *both* directions, so the reverse lookup is
-- indexed too.
create index blocks_blocked_idx on blocks (blocked_id);

create table reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users(id) on delete set null,
  target_id   uuid not null references users(id) on delete cascade,
  reason      report_reason not null,
  detail      text check (char_length(detail) <= 500),
  -- Evidence snapshot: message ids, photo ids. Immutable once written.
  evidence    jsonb not null default '{}'::jsonb,
  state       report_state not null default 'open',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- 'underage' reports jump the queue.
create index reports_triage_idx on reports (state, (reason = 'underage') desc, created_at)
  where state in ('open','reviewing');
create index reports_target_idx on reports (target_id, created_at desc);

-- Rate limiting. One row per actor per action per window.
create table rate_limits (
  user_id      uuid not null references users(id) on delete cascade,
  action       text not null,
  window_start timestamptz not null,
  count        integer not null default 1,
  primary key (user_id, action, window_start)
);

create index rate_limits_sweep_idx on rate_limits (window_start);

-- ── monetisation ──────────────────────────────────────────────────

create table subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  plan               subscription_plan not null,
  store              text not null,          -- 'apple' | 'google' | 'stripe'
  store_txn_id       text unique,
  started_at         timestamptz not null default now(),
  current_period_end timestamptz not null,
  cancelled_at       timestamptz
);

create index subscriptions_active_idx on subscriptions (user_id, current_period_end desc)
  where cancelled_at is null;

create table boosts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index boosts_live_idx on boosts (expires_at) where expires_at > now();

-- ── notifications ─────────────────────────────────────────────────

create table notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  kind         text not null,
  title        text not null,
  body         text,
  actor_id     uuid references users(id) on delete cascade,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, created_at desc);
create index notifications_unread_idx on notifications (user_id) where read_at is null;

-- ── places & events ───────────────────────────────────────────────
-- Aggregate only. There is deliberately no check-in table: HEY cannot
-- show who is at a venue because it never records it.

create table places (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  kind           place_kind not null,
  neighbourhood  text,
  city           text not null,
  country        char(2) not null,
  blurb          text,
  -- Venue coordinates are public information and safe to store.
  lat            double precision,
  lng            double precision,
  opening_hours  text,
  active         boolean not null default true
);

create index places_city_idx on places (country, city) where active;

create table place_interest (
  place_id   uuid not null references places(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  for_date   date not null,
  created_at timestamptz not null default now(),
  primary key (place_id, user_id, for_date)
);

-- The only place-attendance read path. The k-anonymity floor means a
-- small crowd can never single anyone out.
create view place_interest_counts as
  select place_id,
         for_date,
         greatest(count(*), 20) as interested_count
  from place_interest
  group by place_id, for_date
  having count(*) >= 5;

-- ── sessions ──────────────────────────────────────────────────────

create table sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  device_label  text,
  -- Hashed: a stolen table gives no usable device fingerprints.
  device_hash   bytea,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  revoked_at    timestamptz
);

create index sessions_user_idx on sessions (user_id) where revoked_at is null;

-- ── helper: distance from geohash, coarsened per privacy setting ───

create or replace function fn_distance_bucket(
  raw_metres double precision,
  precision  distance_precision
) returns integer
language sql immutable as $$
  select case
    when precision = 'hidden' then null
    when precision = 'approximate' then
      case
        when raw_metres <  1000 then 1000
        when raw_metres <  3000 then 3000
        when raw_metres < 10000 then 10000
        when raw_metres < 30000 then 30000
        else 100000
      end
    else
      case
        when raw_metres < 1000 then (round(raw_metres / 50) * 50)::int
        else (round(raw_metres / 100) * 100)::int
      end
  end;
$$;

comment on function fn_distance_bucket is
  'Every distance returned by the API passes through here. No endpoint '
  'may serialise a raw distance, and none may serialise a position.';

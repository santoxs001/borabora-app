-- ═══════════════════════════════════════════════════════════════════
--  HEY · Row Level Security
--
--  The rules the product promises are enforced here, not in the client:
--    · a blocked pair never sees each other, in either direction
--    · you can only read a conversation you are in
--    · nobody can read another user's auth row, reports, or blocks
--    · nothing anywhere returns a coordinate
--
--  Assumes Supabase-style auth.uid(). Substitute your own session
--  function if you are not on Supabase.
-- ═══════════════════════════════════════════════════════════════════

alter table users              enable row level security;
alter table profiles           enable row level security;
alter table privacy_settings   enable row level security;
alter table photos             enable row level security;
alter table profile_interests  enable row level security;
alter table icebreaker_answers enable row level security;
alter table user_vibes         enable row level security;
alter table interactions       enable row level security;
alter table matches            enable row level security;
alter table conversations      enable row level security;
alter table messages           enable row level security;
alter table message_reads      enable row level security;
alter table message_reactions  enable row level security;
alter table blocks             enable row level security;
alter table reports            enable row level security;
alter table subscriptions      enable row level security;
alter table boosts             enable row level security;
alter table notifications      enable row level security;
alter table place_interest     enable row level security;
alter table sessions           enable row level security;

-- ── Blocking is the base predicate for every visibility rule ──────

create or replace function fn_is_blocked(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
    where (blocker_id = auth.uid() and blocked_id = other)
       or (blocker_id = other      and blocked_id = auth.uid())
  );
$$;

comment on function fn_is_blocked is
  'Symmetric on purpose: a block hides both people from each other. '
  'One-way invisibility would be a stalking tool.';

-- Is `other` discoverable by the current user right now?
create or replace function fn_can_see_profile(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select
    other = auth.uid()
    or (
      not fn_is_blocked(other)
      and exists (
        select 1 from users u
        join profiles p on p.user_id = u.id
        left join privacy_settings ps on ps.user_id = u.id
        where u.id = other
          and u.deleted_at is null
          and u.banned_at is null
          and p.hidden = false
          -- "browse privately" hides you from grids…
          and coalesce(ps.browse_privately, false) = false
          -- …and "only people I like can see me" narrows it further.
          and (
            coalesce(ps.only_liked_can_see_me, false) = false
            or exists (
              select 1 from interactions i
              where i.actor_id = other
                and i.target_id = auth.uid()
                and i.kind in ('like','say_hey')
            )
          )
      )
    );
$$;

-- ── users ─────────────────────────────────────────────────────────
-- You can read exactly one row: your own. Birthdates are never public.

create policy users_self_read on users
  for select using (id = auth.uid());

create policy users_self_update on users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── profiles ──────────────────────────────────────────────────────

create policy profiles_read on profiles
  for select using (fn_can_see_profile(user_id));

create policy profiles_self_write on profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── privacy settings: yours alone ─────────────────────────────────

create policy privacy_self on privacy_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── photos ────────────────────────────────────────────────────────
-- Only approved photos are visible to others; you always see your own,
-- including ones still in review.

create policy photos_read on photos
  for select using (
    user_id = auth.uid()
    or (moderation = 'approved' and fn_can_see_profile(user_id))
  );

create policy photos_self_write on photos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── interests & icebreakers ───────────────────────────────────────

create policy profile_interests_read on profile_interests
  for select using (fn_can_see_profile(user_id));

create policy profile_interests_self on profile_interests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy icebreakers_read on icebreaker_answers
  for select using (fn_can_see_profile(user_id));

create policy icebreakers_self on icebreaker_answers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── vibes ─────────────────────────────────────────────────────────

create policy vibes_read on user_vibes
  for select using (fn_can_see_profile(user_id));

create policy vibes_self on user_vibes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── interactions ──────────────────────────────────────────────────
-- You read what you did. You read what was done *to* you only if you
-- pay for it — enforced here, not in the UI, so the free client cannot
-- simply ask the API for the answer.

create policy interactions_own on interactions
  for select using (actor_id = auth.uid());

create policy interactions_received on interactions
  for select using (
    target_id = auth.uid()
    and kind in ('like','say_hey')
    and exists (
      select 1 from subscriptions s
      where s.user_id = auth.uid()
        and s.cancelled_at is null
        and s.current_period_end > now()
    )
  );

create policy interactions_insert on interactions
  for insert with check (
    actor_id = auth.uid()
    and not fn_is_blocked(target_id)
  );

create policy interactions_update on interactions
  for update using (actor_id = auth.uid()) with check (actor_id = auth.uid());

-- ── matches ───────────────────────────────────────────────────────

create policy matches_own on matches
  for select using (user_a = auth.uid() or user_b = auth.uid());

create policy matches_unmatch on matches
  for update using (user_a = auth.uid() or user_b = auth.uid());

-- ── conversations & messages ──────────────────────────────────────

create or replace function fn_in_conversation(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from conversations c
    where c.id = cid and (c.user_a = auth.uid() or c.user_b = auth.uid())
  );
$$;

create policy conversations_own on conversations
  for select using (user_a = auth.uid() or user_b = auth.uid());

create policy messages_read on messages
  for select using (fn_in_conversation(conversation_id) and deleted_at is null);

create policy messages_send on messages
  for insert with check (
    sender_id = auth.uid()
    and fn_in_conversation(conversation_id)
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and not fn_is_blocked(case when c.user_a = auth.uid() then c.user_b else c.user_a end)
    )
  );

-- Editing history is not a feature; deleting your own message is.
create policy messages_delete_own on messages
  for update using (sender_id = auth.uid()) with check (sender_id = auth.uid());

create policy reads_own on message_reads
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reactions_read on message_reactions
  for select using (
    exists (select 1 from messages m
            where m.id = message_id and fn_in_conversation(m.conversation_id))
  );

create policy reactions_write on message_reactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── safety ────────────────────────────────────────────────────────
-- You can see who *you* blocked. You can never see who blocked you —
-- that leak is what makes blocking dangerous.

create policy blocks_own on blocks
  for select using (blocker_id = auth.uid());

create policy blocks_create on blocks
  for insert with check (blocker_id = auth.uid());

create policy blocks_delete on blocks
  for delete using (blocker_id = auth.uid());

-- Reports are write-only from the client. Nobody reads them back,
-- including the reporter — moderation state is communicated out of band.
create policy reports_create on reports
  for insert with check (reporter_id = auth.uid());

-- ── monetisation, notifications, sessions ─────────────────────────

create policy subscriptions_own on subscriptions
  for select using (user_id = auth.uid());

create policy boosts_own on boosts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notifications_own on notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy sessions_own on sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── places ────────────────────────────────────────────────────────
-- You may write your own interest and read nothing but your own row.
-- Everyone else reads the aggregate view, which has its own floor.

create policy place_interest_self on place_interest
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on place_interest from anon, authenticated;
grant insert, delete on place_interest to authenticated;
grant select on place_interest_counts to authenticated;

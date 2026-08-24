# HEY · data model

Files: `db/schema.sql` → `db/policies.sql` → `db/seed.sql`.
Postgres 15+, Supabase-compatible.

## Entity map

```
              users ─1:1─ profiles ─1:1─ privacy_settings
                │             │
                │             ├─1:N─ photos
                │             ├─M:N─ interests  (profile_interests)
                │             └─1:N─ icebreaker_answers
                │
                ├─1:N─ user_vibes ──► view: active_vibes
                ├─1:N─ sessions
                ├─1:N─ notifications
                ├─1:N─ subscriptions, boosts
                │
                ├─N:N─ interactions (actor, target, kind, message)
                │          │ trigger fn_check_match
                │          ▼
                ├─N:N─ matches ─1:1─ conversations ─1:N─ messages
                │                                        ├─ message_reads
                │                                        └─ message_reactions
                │
                ├─N:N─ blocks
                ├─1:N─ reports
                └─N:N─ place_interest ──► view: place_interest_counts
                                                    ▲
                                         places ────┘
```

## The decisions worth defending

### There is no `lat`/`lng` column
`profiles.geohash char(6)` and nothing else. Precision 6 is roughly a
1.2 km × 0.6 km cell. The device coarsens before transmission
(`src/lib/geo.ts:requestCoarseLocation` discards the raw fix in the same
expression that encodes it). A column that does not exist cannot leak, cannot be
joined against, and cannot be exported by a misconfigured admin tool.

Proximity search is a **prefix index scan** on the geohash, not a distance sort:

```sql
create index profiles_geohash_prefix_idx on profiles (left(geohash, 4))
  where hidden = false;
```

Neighbouring cells share a prefix, so "nearby" is an index range — fast, and
never needs a real position.

### Every distance passes through one function
`fn_distance_bucket(raw, precision)` rounds to 50 m below 1 km, 100 m above, and
collapses to wide bands or `NULL` for the `approximate`/`hidden` settings. No
endpoint may serialise a distance that hasn't been through it. The same buckets
are reimplemented client-side (`coarsenDistance`) so the mock adapter behaves
identically to the real one.

### The 18+ gate is a database constraint
```sql
constraint users_must_be_adult
  check (birthdate <= (current_date - interval '18 years'))
```
Application code cannot bypass it. Neither can a careless migration or a direct
`INSERT` from a script.

### Matches are canonically ordered
`check (user_a < user_b)` plus `unique (user_a, user_b)`. One match row exists
regardless of who acted first, enforced by a single index rather than by
application logic that has to remember to sort.

`fn_check_match()` fires on `interactions` and creates the match when the second
person reciprocates — the rule lives next to the data, so an alternative client
cannot forget it.

### Blocking is symmetric, and invisible in one direction
`fn_is_blocked()` checks both directions, so a block hides both people from each
other. But RLS lets you read only `blocks where blocker_id = auth.uid()` — you
can see who *you* blocked and never who blocked you. That asymmetry is the
safety property.

### "Who likes you" is enforced in RLS, not the UI
```sql
create policy interactions_received on interactions
  for select using (
    target_id = auth.uid() and kind in ('like','say_hey')
    and exists (select 1 from subscriptions ...)
  );
```
A free client cannot simply ask the API for the answer and un-blur it locally.

### There is no check-in table
HEY Places cannot show who is at a venue because nothing records it.
`place_interest` stores intent for a date; the only read path is the aggregate
view, which suppresses groups under five and floors the displayed count at
twenty:

```sql
select place_id, for_date, greatest(count(*), 20) as interested_count
from place_interest group by place_id, for_date having count(*) >= 5;
```

### Indexes follow the screens
| Index | Serves |
|---|---|
| `user_vibes_live_idx` (partial, live rows) | Vibes screen counts |
| `interactions_target_idx` (partial, like/say_hey) | Likes You |
| `messages_conversation_idx` (desc, not deleted) | thread pagination |
| `blocks_blocked_idx` | the reverse half of the block predicate |
| `reports_triage_idx` (underage first) | moderation queue |
| `photos_phash_idx` | duplicate / stock-photo detection |
| `profiles_search_idx` (GIN, generated tsvector) | Explore search |

## Retention

| Data | Policy |
|---|---|
| Verification selfies | deleted immediately after the comparison |
| Deleted account | profile, photos, matches, messages purged within 30 days |
| Reports | retained after account deletion, for safety and legal obligation |
| `rate_limits` | swept on `window_start` |
| Raw coordinates | never stored |

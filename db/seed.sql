-- ═══════════════════════════════════════════════════════════════════
--  HEY · reference data
--  Interests and icebreaker prompts. Fixture *people* are not seeded
--  here — they live in src/data/profiles.ts, where the prototype's
--  mock adapter reads them.
-- ═══════════════════════════════════════════════════════════════════

insert into interests (slug, label, category) values
  ('nightlife','nightlife','going out'),
  ('clubbing','clubbing','going out'),
  ('techno','techno','going out'),
  ('drag','drag','going out'),
  ('karaoke','karaoke','going out'),
  ('wine','wine','going out'),
  ('cocktails','cocktails','going out'),
  ('cooking','cooking','staying in'),
  ('series','series','staying in'),
  ('movies','movies','staying in'),
  ('gaming','gaming','staying in'),
  ('reading','reading','staying in'),
  ('plants','plants','staying in'),
  ('baking','baking','staying in'),
  ('gym','gym','moving'),
  ('running','running','moving'),
  ('yoga','yoga','moving'),
  ('climbing','climbing','moving'),
  ('cycling','cycling','moving'),
  ('hiking','hiking','moving'),
  ('swimming','swimming','moving'),
  ('dance','dance','moving'),
  ('design','design','making'),
  ('photography','photography','making'),
  ('art','art','making'),
  ('writing','writing','making'),
  ('film','film','making'),
  ('music','music','making'),
  ('fashion','fashion','making'),
  ('travel','travel','elsewhere'),
  ('languages','languages','elsewhere'),
  ('beach','beach','elsewhere'),
  ('road-trips','road trips','elsewhere'),
  ('festivals','festivals','elsewhere'),
  ('coffee','coffee','everyday'),
  ('brunch','brunch','everyday'),
  ('food','food','everyday'),
  ('thrifting','thrifting','everyday'),
  ('concerts','concerts','everyday'),
  ('vinyl','vinyl','everyday'),
  ('pets','pets','everyday'),
  ('esports','esports','everyday'),
  ('pop','pop','everyday')
on conflict (slug) do nothing;

insert into icebreaker_prompts (id, prompt) values
  ('first-date','ideal first date?'),
  ('club-couch','club or couch?'),
  ('red-flag','red flag you secretly ignore?'),
  ('coffee-cocktails','coffee or cocktails?'),
  ('obsession','your current obsession?'),
  ('sunday','how does your sunday go?'),
  ('overshare','the thing you overshare about?'),
  ('text-back','what gets you to text back?'),
  ('city','best thing about this city?'),
  ('two-am','2am: where are you?')
on conflict (id) do nothing;

insert into places (name, kind, neighbourhood, city, country, blurb, opening_hours) values
  ('Blue Space','club','Brás','São Paulo','BR','the big room. loud, sweaty, historic.','Fri–Sat · 23:00'),
  ('Bar Elêntrica','bar','Consolação','São Paulo','BR','sidewalk drinks, everyone knows everyone.','Daily · 18:00'),
  ('Cafeteria Norte','cafe','Pinheiros','São Paulo','BR','laptops before 3pm, dates after.','Daily · 08:00'),
  ('Mamba Negra','party','Centro','São Paulo','BR','roving warehouse techno. location drops late.','Sat · 23:59'),
  ('Casa Bugre','bar','Vila Madalena','São Paulo','BR','cheap, chaotic, correct.','Wed–Sun · 19:00'),
  ('Drag Night at Cine','event','República','São Paulo','BR','six queens, one very small stage.','Thu · 21:00'),
  ('Sunday Sound','party','Barra Funda','São Paulo','BR','daytime, outdoors, sunscreen mandatory.','Sun · 15:00'),
  ('Tuca Café','cafe','Consolação','São Paulo','BR','the “can we get coffee first” coffee.','Daily · 09:00')
on conflict do nothing;

import type { Place } from '@/types';

/**
 * HEY Places shows the city, never the people in it.
 * Every field here is aggregate by construction — there is no
 * per-user check-in, and the API has no endpoint that could return one.
 */
export const MOCK_PLACES: Place[] = [
  { id: 'pl-1', name: 'Blue Space', kind: 'club', neighbourhood: 'Brás', city: 'São Paulo', blurb: 'the big room. loud, sweaty, historic.', seed: 'place-1', interestedCount: 312, popularTonight: true, when: 'Fri–Sat · 23:00' },
  { id: 'pl-2', name: 'Bar Elêntrica', kind: 'bar', neighbourhood: 'Consolação', city: 'São Paulo', blurb: 'sidewalk drinks, everyone knows everyone.', seed: 'place-2', interestedCount: 128, popularTonight: true, when: 'Daily · 18:00' },
  { id: 'pl-3', name: 'Cafeteria Norte', kind: 'cafe', neighbourhood: 'Pinheiros', city: 'São Paulo', blurb: 'laptops before 3pm, dates after.', seed: 'place-3', interestedCount: 46, popularTonight: false, when: 'Daily · 08:00' },
  { id: 'pl-4', name: 'Mamba Negra', kind: 'party', neighbourhood: 'Centro', city: 'São Paulo', blurb: 'roving warehouse techno. location drops late.', seed: 'place-4', interestedCount: 274, popularTonight: true, when: 'Sat · 23:59' },
  { id: 'pl-5', name: 'Casa Bugre', kind: 'bar', neighbourhood: 'Vila Madalena', city: 'São Paulo', blurb: 'cheap, chaotic, correct.', seed: 'place-5', interestedCount: 89, popularTonight: false, when: 'Wed–Sun · 19:00' },
  { id: 'pl-6', name: 'Drag Night at Cine', kind: 'event', neighbourhood: 'República', city: 'São Paulo', blurb: 'six queens, one very small stage.', seed: 'place-6', interestedCount: 152, popularTonight: true, when: 'Thu · 21:00' },
  { id: 'pl-7', name: 'Sunday Sound', kind: 'party', neighbourhood: 'Barra Funda', city: 'São Paulo', blurb: 'daytime, outdoors, sunscreen mandatory.', seed: 'place-7', interestedCount: 198, popularTonight: false, when: 'Sun · 15:00' },
  { id: 'pl-8', name: 'Tuca Café', kind: 'cafe', neighbourhood: 'Consolação', city: 'São Paulo', blurb: 'the “can we get coffee first” coffee.', seed: 'place-8', interestedCount: 32, popularTonight: false, when: 'Daily · 09:00' },
];

/** Explore categories — the entry points on the Explore screen. */
export interface ExploreCategory {
  key: string;
  label: string;
  emoji: string;
  /** Interests that qualify a profile for this category. */
  match: string[];
  /** 'tonight' and 'new_here' are computed, not interest-based. */
  computed?: 'tonight' | 'new_here';
}

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  { key: 'tonight', label: 'Tonight', emoji: '🌙', match: [], computed: 'tonight' },
  { key: 'new_here', label: 'New here', emoji: '✦', match: [], computed: 'new_here' },
  { key: 'gym', label: 'Gym', emoji: '🏋️', match: ['gym', 'running', 'climbing', 'yoga'] },
  { key: 'music', label: 'Music', emoji: '🎧', match: ['music', 'techno', 'pop', 'vinyl', 'concerts'] },
  { key: 'gaming', label: 'Gaming', emoji: '🎮', match: ['gaming', 'esports'] },
  { key: 'travel', label: 'Travel', emoji: '✈️', match: ['travel', 'beach', 'languages'] },
  { key: 'coffee', label: 'Coffee', emoji: '☕', match: ['coffee', 'brunch'] },
  { key: 'nightlife', label: 'Nightlife', emoji: '🪩', match: ['nightlife', 'clubbing', 'techno', 'drag'] },
  { key: 'movies', label: 'Movies', emoji: '🎬', match: ['movies', 'cinema', 'series'] },
  { key: 'fashion', label: 'Fashion', emoji: '🧥', match: ['fashion', 'thrifting', 'design'] },
  { key: 'food', label: 'Food', emoji: '🍜', match: ['food', 'cooking', 'brunch', 'wine'] },
  { key: 'outdoors', label: 'Outdoors', emoji: '🌿', match: ['hiking', 'beach', 'running', 'cycling'] },
  { key: 'creators', label: 'Creators', emoji: '✧', match: ['design', 'photography', 'art', 'writing', 'film'] },
];

/** The full interest vocabulary offered during onboarding & profile edit. */
export const INTERESTS: { group: string; items: string[] }[] = [
  {
    group: 'going out',
    items: ['nightlife', 'clubbing', 'techno', 'drag', 'karaoke', 'wine', 'cocktails'],
  },
  {
    group: 'staying in',
    items: ['cooking', 'series', 'movies', 'gaming', 'reading', 'plants', 'baking'],
  },
  {
    group: 'moving',
    items: ['gym', 'running', 'yoga', 'climbing', 'cycling', 'hiking', 'swimming', 'dance'],
  },
  {
    group: 'making',
    items: ['design', 'photography', 'art', 'writing', 'film', 'music', 'fashion'],
  },
  {
    group: 'elsewhere',
    items: ['travel', 'languages', 'beach', 'road trips', 'festivals'],
  },
  {
    group: 'everyday',
    items: ['coffee', 'brunch', 'food', 'thrifting', 'concerts', 'vinyl', 'pets', 'esports', 'pop'],
  },
];

export const ALL_INTERESTS = INTERESTS.flatMap((g) => g.items);

export interface IcebreakerPrompt {
  id: string;
  prompt: string;
  placeholder: string;
}

/** Short, answerable, and a little sharp. Nothing that reads like a survey. */
export const ICEBREAKERS: IcebreakerPrompt[] = [
  { id: 'first-date', prompt: 'ideal first date?', placeholder: 'walk, then food, then see.' },
  { id: 'club-couch', prompt: 'club or couch?', placeholder: 'couch until 11. then club.' },
  { id: 'red-flag', prompt: 'red flag you secretly ignore?', placeholder: '' },
  { id: 'coffee-cocktails', prompt: 'coffee or cocktails?', placeholder: '' },
  { id: 'obsession', prompt: 'your current obsession?', placeholder: '' },
  { id: 'sunday', prompt: 'how does your sunday go?', placeholder: '' },
  { id: 'overshare', prompt: 'the thing you overshare about?', placeholder: '' },
  { id: 'text-back', prompt: 'what gets you to text back?', placeholder: '' },
  { id: 'city', prompt: 'best thing about this city?', placeholder: '' },
  { id: 'two-am', prompt: '2am: where are you?', placeholder: '' },
];

/** Prefilled Say Hey openers. The user can always write their own. */
export const SAY_HEY_OPENERS = [
  'hey 👋',
  'cute.',
  'drinks?',
  'you seem fun.',
  'what are you doing tonight?',
  'that bio though.',
];

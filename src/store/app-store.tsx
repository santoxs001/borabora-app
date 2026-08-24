'use client';

import * as React from 'react';
import type {
  ActiveVibe,
  AppNotification,
  Block,
  Conversation,
  Filters,
  ID,
  InteractionKind,
  Match,
  Me,
  Message,
  PrivacySettings,
  Profile,
  Report,
} from '@/types';
import { MOCK_PROFILES } from '@/data/profiles';
import { DEFAULT_FILTERS } from '@/lib/discovery';
import { readStore, writeStore, clearStore } from '@/lib/storage';
import { uid } from '@/lib/id';
import { buildSeedThreads } from './seed-conversations';

/* ────────────────────────────────────────────────────────────────
   Application store.

   One reducer, persisted to localStorage, sitting behind the same
   action surface a server-backed store would expose. Screens never
   touch storage or fixtures directly — they dispatch actions and read
   selectors, so swapping in the Supabase adapter is a change to this
   file alone.
   ──────────────────────────────────────────────────────────────── */

export interface AppState {
  hydrated: boolean;
  me: Me | null;
  /** targetId → most recent interaction. */
  interactions: Record<ID, InteractionKind>;
  /** Profiles who liked me first and are waiting on a decision. */
  likedMe: ID[];
  matches: Match[];
  conversations: Conversation[];
  messages: Record<ID, Message[]>;
  blocks: Block[];
  reports: Report[];
  notifications: AppNotification[];
  filters: Filters;
  /** Set when a match animation should play. */
  pendingMatch: Match | null;
}

const DEFAULT_PRIVACY: PrivacySettings = {
  distancePrecision: 'exact',
  showOnlineStatus: true,
  browsePrivately: false,
  onlyLikedCanSeeMe: false,
  blurIncomingPhotos: true,
  messagesFrom: 'everyone',
  hideFromContacts: false,
};

export const EMPTY_STATE: AppState = {
  hydrated: false,
  me: null,
  interactions: {},
  likedMe: ['rafael', 'gui', 'theo', 'felipe', 'vitor'],
  matches: [],
  conversations: [],
  messages: {},
  blocks: [],
  reports: [],
  notifications: [],
  filters: DEFAULT_FILTERS,
  pendingMatch: null,
};

/** Fixture profiles that reciprocate, so the match flow is reachable. */
const RECIPROCATES = new Set([
  'marco', 'rafael', 'noah', 'kai', 'alex', 'gui', 'enzo', 'jonas', 'nico', 'vitor', 'ivan',
]);

/* ── Actions ───────────────────────────────────────────────────── */

type Action =
  | { type: 'hydrate'; state: Partial<AppState> }
  | { type: 'signIn'; me: Me }
  | { type: 'signOut' }
  | { type: 'updateMe'; patch: Partial<Me> }
  | { type: 'setPrivacy'; patch: Partial<PrivacySettings> }
  | { type: 'setVibe'; vibe: ActiveVibe | null }
  | { type: 'setFilters'; filters: Partial<Filters> }
  | { type: 'interact'; targetId: ID; kind: InteractionKind; message?: string }
  | { type: 'undoInteraction'; targetId: ID }
  | { type: 'dismissMatch' }
  | { type: 'openConversation'; profileId: ID }
  | { type: 'sendMessage'; conversationId: ID; message: Message }
  | { type: 'receiveMessage'; conversationId: ID; message: Message }
  | { type: 'setTyping'; conversationId: ID; typing: boolean }
  | { type: 'markRead'; conversationId: ID }
  | { type: 'react'; conversationId: ID; messageId: ID; emoji: string }
  | { type: 'deleteConversation'; conversationId: ID }
  | { type: 'block'; profileId: ID; name: string }
  | { type: 'unblock'; profileId: ID }
  | { type: 'report'; report: Report }
  | { type: 'notify'; notification: AppNotification }
  | { type: 'readNotifications' }
  | { type: 'startBoost' };

function conversationFor(state: AppState, profileId: ID): Conversation | undefined {
  return state.conversations.find((c) => c.profileId === profileId);
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.state, hydrated: true };

    case 'signIn': {
      const seeded = buildSeedThreads();
      return {
        ...state,
        me: action.me,
        matches: seeded.matches,
        conversations: seeded.conversations,
        messages: seeded.messages,
        notifications: seedNotifications(),
      };
    }

    case 'signOut':
      return { ...EMPTY_STATE, hydrated: true };

    case 'updateMe':
      return state.me ? { ...state, me: { ...state.me, ...action.patch } } : state;

    case 'setPrivacy':
      return state.me
        ? { ...state, me: { ...state.me, privacy: { ...state.me.privacy, ...action.patch } } }
        : state;

    case 'setVibe':
      return state.me ? { ...state, me: { ...state.me, activeVibe: action.vibe } } : state;

    case 'setFilters':
      return { ...state, filters: { ...state.filters, ...action.filters } };

    case 'interact': {
      const { targetId, kind, message } = action;
      const interactions = { ...state.interactions, [targetId]: kind };

      if (kind === 'pass' || kind === 'save') {
        return { ...state, interactions };
      }

      // Reciprocation: they already liked me, or they're a fixture that answers.
      const mutual = state.likedMe.includes(targetId) || RECIPROCATES.has(targetId);
      if (!mutual) {
        return {
          ...state,
          interactions,
          me: state.me ? { ...state.me, likesUsedToday: state.me.likesUsedToday + 1 } : state.me,
        };
      }

      const match: Match = {
        id: uid('match'),
        profileId: targetId,
        createdAt: new Date().toISOString(),
        awaitingFirstMessage: true,
      };
      const conversation: Conversation = {
        id: uid('conv'),
        profileId: targetId,
        matchId: match.id,
        lastMessage: null,
        unreadCount: 0,
        typing: false,
        archived: false,
        createdAt: match.createdAt,
      };

      let messages = state.messages;
      let lastMessage: Message | null = null;
      // A Say Hey carries its opener straight into the new thread.
      if (kind === 'say_hey' && message) {
        lastMessage = {
          id: uid('m'),
          conversationId: conversation.id,
          senderId: 'me',
          kind: 'text',
          body: message,
          reactions: [],
          createdAt: match.createdAt,
          readAt: null,
        };
        messages = { ...messages, [conversation.id]: [lastMessage] };
        conversation.lastMessage = lastMessage;
        match.awaitingFirstMessage = false;
      } else {
        messages = { ...messages, [conversation.id]: [] };
      }

      return {
        ...state,
        interactions,
        likedMe: state.likedMe.filter((id) => id !== targetId),
        matches: [match, ...state.matches],
        conversations: [conversation, ...state.conversations],
        messages,
        pendingMatch: match,
        me: state.me ? { ...state.me, likesUsedToday: state.me.likesUsedToday + 1 } : state.me,
      };
    }

    case 'undoInteraction': {
      const { [action.targetId]: _undone, ...interactions } = state.interactions;
      return { ...state, interactions };
    }

    case 'dismissMatch':
      return { ...state, pendingMatch: null };

    case 'openConversation': {
      if (conversationFor(state, action.profileId)) return state;
      const conversation: Conversation = {
        id: uid('conv'),
        profileId: action.profileId,
        matchId: null,
        lastMessage: null,
        unreadCount: 0,
        typing: false,
        archived: false,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        conversations: [conversation, ...state.conversations],
        messages: { ...state.messages, [conversation.id]: [] },
      };
    }

    case 'sendMessage': {
      const list = state.messages[action.conversationId] ?? [];
      return {
        ...state,
        messages: { ...state.messages, [action.conversationId]: [...list, action.message] },
        matches: state.matches.map((m) =>
          m.id === conversationFor(state, action.message.conversationId)?.matchId
            ? { ...m, awaitingFirstMessage: false }
            : m,
        ),
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId
            ? { ...c, lastMessage: action.message, archived: false }
            : c,
        ),
      };
    }

    case 'receiveMessage': {
      const list = state.messages[action.conversationId] ?? [];
      return {
        ...state,
        messages: { ...state.messages, [action.conversationId]: [...list, action.message] },
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId
            ? {
                ...c,
                lastMessage: action.message,
                typing: false,
                unreadCount: c.unreadCount + 1,
              }
            : c,
        ),
      };
    }

    case 'setTyping':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId ? { ...c, typing: action.typing } : c,
        ),
      };

    case 'markRead': {
      const now = new Date().toISOString();
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId ? { ...c, unreadCount: 0 } : c,
        ),
        messages: {
          ...state.messages,
          [action.conversationId]: (state.messages[action.conversationId] ?? []).map((m) =>
            m.senderId === 'me' || m.readAt ? m : { ...m, readAt: now },
          ),
        },
      };
    }

    case 'react': {
      const list = state.messages[action.conversationId] ?? [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: list.map((m) => {
            if (m.id !== action.messageId) return m;
            const mine = m.reactions.find((r) => r.byMe && r.emoji === action.emoji);
            return {
              ...m,
              reactions: mine
                ? m.reactions.filter((r) => !(r.byMe && r.emoji === action.emoji))
                : [...m.reactions.filter((r) => !r.byMe), { emoji: action.emoji, byMe: true }],
            };
          }),
        },
      };
    }

    case 'deleteConversation': {
      const { [action.conversationId]: _drop, ...rest } = state.messages;
      return {
        ...state,
        conversations: state.conversations.filter((c) => c.id !== action.conversationId),
        messages: rest,
      };
    }

    case 'block': {
      const conv = conversationFor(state, action.profileId);
      const { [conv?.id ?? '']: _drop, ...restMessages } = state.messages;
      return {
        ...state,
        blocks: [
          { profileId: action.profileId, name: action.name, createdAt: new Date().toISOString() },
          ...state.blocks.filter((b) => b.profileId !== action.profileId),
        ],
        conversations: state.conversations.filter((c) => c.profileId !== action.profileId),
        messages: restMessages,
        matches: state.matches.filter((m) => m.profileId !== action.profileId),
        likedMe: state.likedMe.filter((id) => id !== action.profileId),
      };
    }

    case 'unblock':
      return { ...state, blocks: state.blocks.filter((b) => b.profileId !== action.profileId) };

    case 'report':
      return { ...state, reports: [action.report, ...state.reports] };

    case 'notify':
      return { ...state, notifications: [action.notification, ...state.notifications] };

    case 'readNotifications':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };

    case 'startBoost': {
      if (!state.me) return state;
      const startedAt = new Date().toISOString();
      return {
        ...state,
        me: {
          ...state.me,
          boost: {
            startedAt,
            expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
          },
        },
      };
    }

    default:
      return state;
  }
}

function seedNotifications(): AppNotification[] {
  const ago = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
  return [
    { id: uid('n'), kind: 'like', title: 'hey, someone likes you.', createdAt: ago(12), read: false },
    { id: uid('n'), kind: 'message', title: 'Kai replied.', body: 'are you out this weekend?', profileId: 'kai', createdAt: ago(44), read: false },
    { id: uid('n'), kind: 'nearby', title: '3 guys nearby share your vibe.', createdAt: ago(180), read: true },
  ];
}

/* ── Context ───────────────────────────────────────────────────── */

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  /** All profiles the current user is allowed to see. */
  visibleProfiles: Profile[];
  profileById: (id: ID) => Profile | undefined;
}

const AppContext = React.createContext<AppContextValue | null>(null);

const PERSIST_KEYS: (keyof AppState)[] = [
  'me',
  'interactions',
  'likedMe',
  'matches',
  'conversations',
  'messages',
  'blocks',
  'reports',
  'notifications',
  'filters',
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, EMPTY_STATE);

  // Hydrate once on mount — SSR renders the empty state, so markup matches.
  React.useEffect(() => {
    const saved = readStore<Partial<AppState>>('state', {});
    dispatch({ type: 'hydrate', state: saved });
  }, []);

  React.useEffect(() => {
    if (!state.hydrated) return;
    const snapshot: Partial<AppState> = {};
    for (const k of PERSIST_KEYS) (snapshot as Record<string, unknown>)[k] = state[k];
    writeStore('state', snapshot);
  }, [state]);

  const visibleProfiles = React.useMemo(() => {
    const blocked = new Set(state.blocks.map((b) => b.profileId));
    return MOCK_PROFILES.filter((p) => !blocked.has(p.id));
  }, [state.blocks]);

  const profileById = React.useCallback(
    (id: ID) => MOCK_PROFILES.find((p) => p.id === id),
    [],
  );

  const value = React.useMemo(
    () => ({ state, dispatch, visibleProfiles, profileById }),
    [state, visibleProfiles, profileById],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export function useMe(): Me | null {
  return useApp().state.me;
}

export function resetEverything(): void {
  clearStore();
}

export { DEFAULT_PRIVACY };

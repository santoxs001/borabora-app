import type {
  AppNotification,
  Block,
  Conversation,
  Filters,
  ID,
  InteractionKind,
  Match,
  Me,
  Message,
  Place,
  Profile,
  Report,
  ActiveVibe,
} from '@/types';

/**
 * The single seam between the app and its backend.
 *
 * The prototype ships a `MockAdapter`; a `SupabaseAdapter` implementing
 * this same surface can be dropped in without touching a screen. Note
 * what is *absent*: nothing returns coordinates, and nothing returns the
 * list of people at a Place.
 */
export interface DataAdapter {
  /* session */
  getMe(): Promise<Me | null>;
  updateMe(patch: Partial<Me>): Promise<Me>;
  signOut(): Promise<void>;

  /* discovery */
  listDiscover(filters: Filters, cursor?: string): Promise<{ items: Profile[]; cursor: string | null }>;
  listNearby(filters: Filters, cursor?: string): Promise<{ items: Profile[]; cursor: string | null }>;
  listByVibe(filters: Filters): Promise<Profile[]>;
  listByCategory(categoryKey: string): Promise<Profile[]>;
  getProfile(id: ID): Promise<Profile | null>;

  /* interaction */
  interact(targetId: ID, kind: InteractionKind, message?: string): Promise<{ match: Match | null }>;
  listMatches(): Promise<Match[]>;
  listLikedMe(): Promise<Profile[]>;
  listSaved(): Promise<Profile[]>;

  /* messaging */
  listConversations(): Promise<Conversation[]>;
  listMessages(conversationId: ID): Promise<Message[]>;
  sendMessage(conversationId: ID, message: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;
  markRead(conversationId: ID): Promise<void>;
  reactToMessage(messageId: ID, emoji: string): Promise<void>;
  deleteConversation(conversationId: ID): Promise<void>;

  /* vibes */
  setVibe(vibe: ActiveVibe | null): Promise<void>;

  /* safety */
  block(profileId: ID): Promise<void>;
  unblock(profileId: ID): Promise<void>;
  listBlocks(): Promise<Block[]>;
  report(report: Omit<Report, 'id' | 'createdAt'>): Promise<void>;

  /* misc */
  listNotifications(): Promise<AppNotification[]>;
  listPlaces(city: string): Promise<Place[]>;
}

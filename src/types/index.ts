/* ────────────────────────────────────────────────────────────────
   HEY · domain types
   Mirrors db/schema.sql. Anything the client is allowed to see is
   modelled here; anything it is not (raw coordinates, auth rows,
   moderation internals) deliberately has no client type.
   ──────────────────────────────────────────────────────────────── */

export type ID = string;
export type ISODate = string;

/* ── Vibes ─────────────────────────────────────────────────────── */

export type VibeKey =
  | 'date'
  | 'drinks'
  | 'chat'
  | 'friends'
  | 'now'
  | 'looking'
  | 'going_out'
  | 'staying_in';

export interface Vibe {
  key: VibeKey;
  label: string;
  emoji: string;
  /** One-line explanation shown in the vibe picker. */
  hint: string;
  /** Vibes that imply immediacy get treated differently in ranking. */
  urgent?: boolean;
}

export type VibeDuration = '1h' | '3h' | 'today' | 'until_off';

export interface ActiveVibe {
  key: VibeKey;
  duration: VibeDuration;
  startedAt: ISODate;
  /** null when duration is 'until_off'. */
  expiresAt: ISODate | null;
}

/* ── Identity ──────────────────────────────────────────────────── */

export type GenderIdentity =
  | 'man'
  | 'trans_man'
  | 'non_binary'
  | 'genderqueer'
  | 'agender'
  | 'questioning'
  | 'self_describe'
  | 'prefer_not_to_say';

export type Pronouns = 'he/him' | 'they/them' | 'he/they' | 'she/her' | 'custom';

export type LookingFor =
  | 'dates'
  | 'friends'
  | 'chat'
  | 'something_casual'
  | 'relationship'
  | 'see_what_happens';

/* ── Privacy ───────────────────────────────────────────────────── */

export type DistancePrecision = 'exact' | 'approximate' | 'hidden';

export interface PrivacySettings {
  distancePrecision: DistancePrecision;
  showOnlineStatus: boolean;
  /** Invisible mode — browse without appearing in others' grids. */
  browsePrivately: boolean;
  /** Only profiles this user has liked can see them. */
  onlyLikedCanSeeMe: boolean;
  /** Blurs incoming photos until the user taps to reveal. */
  blurIncomingPhotos: boolean;
  /** Restrict who may open a new conversation. */
  messagesFrom: 'everyone' | 'matches_only';
  hideFromContacts: boolean;
}

/* ── Profile ───────────────────────────────────────────────────── */

export interface Photo {
  id: ID;
  /** Remote URL once storage is wired. Null → render the seeded placeholder. */
  url: string | null;
  /** Deterministic seed for the generated gradient placeholder. */
  seed: string;
  position: number;
  isPrimary: boolean;
  moderation: 'pending' | 'approved' | 'rejected';
}

export interface IcebreakerAnswer {
  promptId: ID;
  prompt: string;
  answer: string;
}

/** Optional, self-declared profile facts. Never required. */
export interface ProfileDetails {
  heightCm?: number;
  languages?: string[];
  starSign?: string;
  gym?: 'daily' | 'often' | 'sometimes' | 'never';
  smokes?: 'yes' | 'sometimes' | 'no';
  drinks?: 'yes' | 'sometimes' | 'no';
  relationship?: 'single' | 'partnered' | 'open' | 'complicated' | 'not_saying';
  pets?: string;
  music?: string[];
  work?: string;
  school?: string;
}

export type ProfileState = 'online' | 'recently_active' | 'new_here' | 'away';

export interface Profile {
  id: ID;
  name: string;
  age: number;
  city: string;
  country: string;
  bio: string;
  pronouns: string;
  genderIdentity: GenderIdentity;
  lookingFor: LookingFor[];
  interests: string[];
  photos: Photo[];
  details: ProfileDetails;
  icebreakers: IcebreakerAnswer[];
  verified: boolean;
  isPlus: boolean;
  activeVibe: ActiveVibe | null;
  /**
   * Metres, already coarsened server-side according to the *viewer's* and the
   * *subject's* privacy settings. The client never receives coordinates.
   */
  distanceM: number | null;
  state: ProfileState;
  lastActiveAt: ISODate;
  joinedAt: ISODate;
}

/* ── Interactions ──────────────────────────────────────────────── */

export type InteractionKind = 'pass' | 'save' | 'like' | 'say_hey';

export interface Interaction {
  id: ID;
  targetId: ID;
  kind: InteractionKind;
  /** Present only for say_hey. */
  message?: string;
  createdAt: ISODate;
}

export interface Match {
  id: ID;
  profileId: ID;
  createdAt: ISODate;
  /** True until either side sends the first message. */
  awaitingFirstMessage: boolean;
}

/* ── Messaging ─────────────────────────────────────────────────── */

export type MessageKind = 'text' | 'photo' | 'gif' | 'audio' | 'system';

export interface MessageReaction {
  emoji: string;
  byMe: boolean;
}

export interface Message {
  id: ID;
  conversationId: ID;
  /** 'me' is the local user; anything else is the counterpart's profile id. */
  senderId: ID | 'me';
  kind: MessageKind;
  body: string;
  /** For photo/gif/audio payloads. */
  mediaUrl?: string;
  /** Seconds, for audio. */
  durationS?: number;
  replyToId?: ID;
  reactions: MessageReaction[];
  createdAt: ISODate;
  readAt: ISODate | null;
  pending?: boolean;
  failed?: boolean;
}

export interface Conversation {
  id: ID;
  profileId: ID;
  matchId: ID | null;
  lastMessage: Message | null;
  unreadCount: number;
  /** Counterpart is typing right now. */
  typing: boolean;
  archived: boolean;
  createdAt: ISODate;
}

/* ── Places ────────────────────────────────────────────────────── */

export type PlaceKind = 'bar' | 'club' | 'cafe' | 'event' | 'party';

export interface Place {
  id: ID;
  name: string;
  kind: PlaceKind;
  neighbourhood: string;
  city: string;
  blurb: string;
  seed: string;
  /** Aggregate only — never a list of who is there. */
  interestedCount: number;
  popularTonight: boolean;
  /** e.g. "Fri–Sat · 23:00" */
  when?: string;
}

/* ── Notifications ─────────────────────────────────────────────── */

export type NotificationKind =
  | 'like'
  | 'say_hey'
  | 'match'
  | 'message'
  | 'vibe_expiring'
  | 'nearby'
  | 'system';

export interface AppNotification {
  id: ID;
  kind: NotificationKind;
  title: string;
  body?: string;
  profileId?: ID;
  createdAt: ISODate;
  read: boolean;
}

/* ── Discovery filters ─────────────────────────────────────────── */

export interface Filters {
  ageMin: number;
  ageMax: number;
  /** Kilometres. */
  maxDistanceKm: number;
  vibes: VibeKey[];
  interests: string[];
  onlineOnly: boolean;
  verifiedOnly: boolean;
  newHereOnly: boolean;
  lookingFor: LookingFor[];
}

/* ── Safety ────────────────────────────────────────────────────── */

export type ReportReason =
  | 'fake_profile'
  | 'harassment'
  | 'underage'
  | 'nudity'
  | 'spam'
  | 'scam'
  | 'offline_behaviour'
  | 'other';

export interface Report {
  id: ID;
  targetId: ID;
  reason: ReportReason;
  detail?: string;
  blockToo: boolean;
  createdAt: ISODate;
}

export interface Block {
  profileId: ID;
  name: string;
  createdAt: ISODate;
}

/* ── Session / account ─────────────────────────────────────────── */

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed';

export interface Boost {
  startedAt: ISODate;
  expiresAt: ISODate;
}

export interface Me extends Profile {
  email: string;
  birthdate: string; // YYYY-MM-DD
  verification: VerificationStatus;
  privacy: PrivacySettings;
  plus: {
    active: boolean;
    plan: 'monthly' | 'quarterly' | 'yearly' | null;
    renewsAt: ISODate | null;
  };
  boost: Boost | null;
  /** Consumed by the free-tier like limit. */
  likesUsedToday: number;
}

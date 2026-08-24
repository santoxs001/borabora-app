import type { Conversation, ID, Match, Message } from '@/types';
import { uid } from '@/lib/id';

const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

function msg(
  conversationId: ID,
  senderId: ID | 'me',
  body: string,
  minsAgo: number,
  read = true,
): Message {
  return {
    id: uid('m'),
    conversationId,
    senderId,
    kind: 'text',
    body,
    reactions: [],
    createdAt: ago(minsAgo),
    readAt: read ? ago(minsAgo - 1) : null,
  };
}

/** Three conversations at different stages, so Messages is never a cold start. */
export function buildSeedThreads(): {
  matches: Match[];
  conversations: Conversation[];
  messages: Record<ID, Message[]>;
} {
  const c1 = 'conv_kai';
  const c2 = 'conv_leo';
  const c3 = 'conv_alex';

  const m1 = [
    msg(c1, 'kai', 'hey 👋', 220),
    msg(c1, 'me', 'hey. that playlist on your profile is unhinged', 214),
    msg(c1, 'kai', 'thank you. that is the intended effect', 210),
    msg(c1, 'kai', 'are you out this weekend?', 44, false),
  ];
  const m2 = [
    msg(c2, 'me', 'drinks?', 1500),
    msg(c2, 'leo', 'yes. but somewhere with chairs that work', 1480),
    msg(c2, 'me', 'demanding. I like it', 1460),
    msg(c2, 'leo', 'thursday?', 1450),
  ];
  const m3: Message[] = [];

  const conversations: Conversation[] = [
    {
      id: c1,
      profileId: 'kai',
      matchId: 'match_kai',
      lastMessage: m1[m1.length - 1],
      unreadCount: 1,
      typing: false,
      archived: false,
      createdAt: ago(230),
    },
    {
      id: c2,
      profileId: 'leo',
      matchId: 'match_leo',
      lastMessage: m2[m2.length - 1],
      unreadCount: 0,
      typing: false,
      archived: false,
      createdAt: ago(1510),
    },
    {
      id: c3,
      profileId: 'alex',
      matchId: 'match_alex',
      lastMessage: null,
      unreadCount: 0,
      typing: false,
      archived: false,
      createdAt: ago(30),
    },
  ];

  const matches: Match[] = [
    { id: 'match_alex', profileId: 'alex', createdAt: ago(30), awaitingFirstMessage: true },
    { id: 'match_kai', profileId: 'kai', createdAt: ago(230), awaitingFirstMessage: false },
    { id: 'match_leo', profileId: 'leo', createdAt: ago(1510), awaitingFirstMessage: false },
  ];

  return { matches, conversations, messages: { [c1]: m1, [c2]: m2, [c3]: m3 } };
}

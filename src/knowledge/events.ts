export type EventCategory = 'connection' | 'messaging' | 'groups' | 'contacts' | 'presence' | 'calls' | 'labels' | 'blocklist'

export interface EventInfo {
  name: string
  payloadType: string
  description: string
  category: EventCategory
  notes?: string
}

export const EVENTS: EventInfo[] = [
  {
    name: 'connection.update',
    payloadType: 'Partial<ConnectionState>',
    description: 'Fired when connection state changes: QR code received, connection opened, connection closed, or reconnecting.',
    category: 'connection',
    notes: `ConnectionState fields: { connection: "open" | "connecting" | "close", lastDisconnect?: { error, date }, isNewLogin?, qr?, receivedPendingNotifications?, isOnline? }

PRODUCTION PATTERNS from API_WHAILEYS:
- QR code: check for "qr" field. Max 3 retries, then clearAuthState + disconnect
- Open: extract phone via jidNormalizedUser(socket.user.id), fetch profilePicture
- Close: check DisconnectReason in lastDisconnect.error.output.statusCode
  - Critical codes (don't reconnect): loggedOut(401), badSession(500), forbidden(403), multideviceMismatch(411)
  - Non-critical: exponential backoff delay * 2^retries, max 5 retries
  - restartRequired(515): use extended delay instead of normal backoff`,
  },
  {
    name: 'creds.update',
    payloadType: 'Partial<AuthenticationCreds>',
    description: 'Fired when authentication credentials are updated. Must call saveCreds() to persist.',
    category: 'connection',
    notes: 'ALWAYS bind this event and call your saveCreds function. Failure to save will cause re-authentication on next connection.',
  },

  {
    name: 'messages.upsert',
    payloadType: '{ messages: WAMessage[]; type: MessageUpsertType }',
    description: 'Fired when new messages are received or sent. Primary event for message handling.',
    category: 'messaging',
    notes: `MessageUpsertType: "append" (new real-time message) | "notify" (new message with notification)

PRODUCTION PATTERN: Skip processing for fromMe messages (except specific use cases). Filter by type === "notify" for real incoming messages. Cache messages for retry handling.

Content type detection (13 types):
- conversation || extendedTextMessage → "text"
- imageMessage → "image", videoMessage → "video"
- audioMessage → "audio", documentMessage → "document"
- stickerMessage → "sticker"
- locationMessage || liveLocationMessage → "location"
- contactMessage → "contact", contactsArrayMessage → "contacts"
- buttonsResponseMessage || templateButtonReplyMessage → "buttons"
- listResponseMessage → "list"
- pollCreationMessage || pollUpdateMessage → "poll"
- reactionMessage → "reaction"
- protocolMessage || senderKeyDistributionMessage → "protocol"`,
  },
  {
    name: 'messages.update',
    payloadType: 'WAMessageUpdate[]',
    description: 'Fired when message status changes (delivered, read) or message content is edited.',
    category: 'messaging',
    notes: `WAMessageUpdate: { key: WAMessageKey, update: Partial<WAMessage> }

PRODUCTION PATTERN: Track delivery status via update.status:
- status 2 = delivered (double check/gray)
- status 3+ = read (double check/blue)`,
  },
  {
    name: 'messages.delete',
    payloadType: '{ keys: WAMessageKey[] } | { jid: string; all: true }',
    description: 'Fired when messages are deleted/revoked. Can be individual keys or all messages in a chat.',
    category: 'messaging',
  },
  {
    name: 'messages.reaction',
    payloadType: '{ key: WAMessageKey; reaction: proto.IReaction }[]',
    description: 'Fired when someone reacts to a message with an emoji.',
    category: 'messaging',
    notes: 'PRODUCTION PATTERN: Detect reactor JID via reaction.key — use isLidUser for LID detection in groups.',
  },
  {
    name: 'messages.media-update',
    payloadType: '{ key: WAMessageKey; media?: { ciphertext: Uint8Array; iv: Uint8Array }; error?: Boom }[]',
    description: 'Fired when media message encryption data is updated.',
    category: 'messaging',
  },
  {
    name: 'messages.pdo-response',
    payloadType: '{ messages: WAMessage[] }',
    description: 'Response to peer data operation (PDO) requests.',
    category: 'messaging',
  },
  {
    name: 'message-receipt.update',
    payloadType: 'MessageUserReceiptUpdate[]',
    description: 'Fired when message receipts are updated (read/delivered by specific users).',
    category: 'messaging',
  },
  {
    name: 'messaging-history.set',
    payloadType: '{ chats: Chat[]; contacts: Contact[]; messages: WAMessage[]; isLatest: boolean; progress?: number | null; syncType?: proto.HistorySync.HistorySyncType }',
    description: 'Fired during initial history sync. Contains chats, contacts, and messages from the synced history.',
    category: 'messaging',
    notes: 'progress field indicates sync progress (0-100). isLatest indicates if this is the most recent batch.',
  },

  {
    name: 'groups.upsert',
    payloadType: 'GroupMetadata[]',
    description: 'Fired when new groups are added to the chat list.',
    category: 'groups',
  },
  {
    name: 'groups.update',
    payloadType: 'Partial<GroupMetadata>[]',
    description: 'Fired when group metadata is updated (subject, description, settings, picture).',
    category: 'groups',
  },
  {
    name: 'group-participants.update',
    payloadType: '{ id: string; participants: string[]; action: ParticipantAction }',
    description: 'Fired when group participants are added, removed, promoted, or demoted.',
    category: 'groups',
    notes: 'ParticipantAction: "add" | "remove" | "promote" | "demote". id is the group JID.',
  },

  {
    name: 'contacts.upsert',
    payloadType: 'Contact[]',
    description: 'Fired when new contacts are synced.',
    category: 'contacts',
  },
  {
    name: 'contacts.update',
    payloadType: 'Partial<Contact>[]',
    description: 'Fired when contact information is updated.',
    category: 'contacts',
  },
  {
    name: 'contacts.phone-number-share',
    payloadType: '{ lid: string; jid: string }',
    description: 'Fired when a contact shares their phone number (maps LID to JID).',
    category: 'contacts',
    notes: 'Part of the LID migration — maps a Local ID to a phone-number-based JID.',
  },

  {
    name: 'chats.upsert',
    payloadType: 'Chat[]',
    description: 'Fired when new chats are added.',
    category: 'messaging',
  },
  {
    name: 'chats.update',
    payloadType: 'ChatUpdate[]',
    description: 'Fired when chat metadata is updated (unread count, archive status, pin, mute).',
    category: 'messaging',
  },
  {
    name: 'chats.delete',
    payloadType: 'string[]',
    description: 'Fired when chats are deleted. Contains array of chat JIDs.',
    category: 'messaging',
  },
  {
    name: 'chats.phoneNumberShare',
    payloadType: '{ lid: string; jid: string }',
    description: 'DEPRECATED: Use contacts.phone-number-share instead.',
    category: 'contacts',
    notes: 'Deprecated in favor of contacts.phone-number-share.',
  },

  {
    name: 'presence.update',
    payloadType: '{ id: string; presences: { [participant: string]: PresenceData } }',
    description: 'Fired when user presence changes (typing, online, offline, recording).',
    category: 'presence',
    notes: 'PresenceData includes lastKnownPresence ("available" | "unavailable" | "composing" | "recording" | "paused") and lastSeen timestamp.',
  },

  {
    name: 'call',
    payloadType: 'WACallEvent[]',
    description: 'Fired when incoming/outgoing calls are detected.',
    category: 'calls',
    notes: 'WACallEvent includes: from, id, status (WACallUpdateType), isVideo, isGroup, date, latencyMs, duration.',
  },

  {
    name: 'labels.edit',
    payloadType: 'Label',
    description: 'Fired when a label is created or edited (Business accounts).',
    category: 'labels',
  },
  {
    name: 'labels.association',
    payloadType: '{ association: LabelAssociation; type: "add" | "remove" }',
    description: 'Fired when a label is associated with or removed from a chat/message.',
    category: 'labels',
  },

  {
    name: 'blocklist.set',
    payloadType: '{ blocklist: string[] }',
    description: 'Fired when the full blocklist is received (initial sync).',
    category: 'blocklist',
  },
  {
    name: 'blocklist.update',
    payloadType: '{ blocklist: string[]; type: "add" | "remove" }',
    description: 'Fired when contacts are added to or removed from the blocklist.',
    category: 'blocklist',
  },
]

export const UNBIND_EVENTS = [
  'connection.update', 'creds.update', 'messaging-history.set',
  'chats.upsert', 'chats.update', 'chats.delete',
  'presence.update', 'contacts.upsert', 'contacts.update',
  'messages.upsert', 'messages.update', 'messages.delete',
  'messages.reaction', 'message-receipt.update',
  'groups.upsert', 'groups.update', 'group-participants.update',
  'blocklist.set', 'blocklist.update', 'call',
] as const

export function getEventsByCategory(category: EventCategory): EventInfo[] {
  return EVENTS.filter((e) => e.category === category)
}

export function getEventByName(name: string): EventInfo | undefined {
  return EVENTS.find((e) => e.name.toLowerCase() === name.toLowerCase())
}

export function searchEvents(query: string): EventInfo[] {
  const q = query.toLowerCase()
  return EVENTS.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.payloadType.toLowerCase().includes(q) ||
      e.notes?.toLowerCase().includes(q),
  )
}

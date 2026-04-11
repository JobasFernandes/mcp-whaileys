export type SocketMethodCategory =
  | 'messaging'
  | 'groups'
  | 'media'
  | 'connection'
  | 'presence'
  | 'privacy'
  | 'business'
  | 'calls'
  | 'profile'
  | 'chat'
  | 'history'

export interface SocketMethodInfo {
  name: string
  signature: string
  description: string
  category: SocketMethodCategory
  layer: string
  notes?: string
}

export const SOCKET_METHODS: SocketMethodInfo[] = [
  {
    name: 'sendMessage',
    signature: '(jid: string, content: AnyMessageContent, options?: MiscMessageGenerationOptions) => Promise<WAMessage | undefined>',
    description: 'Send a message to a JID. The primary method for sending all simple and interactive messages.',
    category: 'messaging',
    layer: 'messages-send',
    notes: 'MiscMessageGenerationOptions supports: quoted (reply), messageId, cachedGroupMetadata, statusJidList. For advanced messages (carousel, poll), use relayMessage instead.',
  },
  {
    name: 'relayMessage',
    signature: '(jid: string, message: proto.IMessage, options: MessageRelayOptions) => Promise<string>',
    description: 'Relay a pre-built proto message. Used for advanced message types like carousel, poll, and pix/payment.',
    category: 'messaging',
    layer: 'messages-send',
    notes: 'Use with generateWAMessageFromContent() to build the proto message first. Returns the message ID.',
  },
  {
    name: 'sendReceipt',
    signature: '(jid: string, participant: string | undefined, messageIds: string[], type: MessageReceiptType) => Promise<void>',
    description: 'Send a receipt for messages (read, played, etc).',
    category: 'messaging',
    layer: 'messages-send',
  },
  {
    name: 'sendReceipts',
    signature: '(keys: WAMessageKey[], type: MessageReceiptType) => Promise<void>',
    description: 'Send receipts for multiple messages at once using their keys.',
    category: 'messaging',
    layer: 'messages-send',
  },
  {
    name: 'readMessages',
    signature: '(keys: WAMessageKey[]) => Promise<void>',
    description: 'Mark messages as read. Shortcut for sendReceipts with type "read".',
    category: 'messaging',
    layer: 'messages-send',
    notes: 'Pass an array of WAMessageKey objects. This is NOT sendMessage — it is a direct socket method.',
  },
  {
    name: 'updateMediaMessage',
    signature: '(message: proto.IWebMessageInfo) => Promise<proto.IWebMessageInfo>',
    description: 'Update a media message with refreshed download info (re-upload expired media).',
    category: 'messaging',
    layer: 'messages-send',
  },
  {
    name: 'sendPeerDataOperationMessage',
    signature: '(pdoMessage: proto.Message.IPeerDataOperationRequestMessage) => Promise<string>',
    description: 'Send a peer data operation request message.',
    category: 'messaging',
    layer: 'messages-send',
  },

  {
    name: 'groupMetadata',
    signature: '(jid: string) => Promise<GroupMetadata>',
    description: 'Fetch metadata for a group (subject, participants, settings, etc).',
    category: 'groups',
    layer: 'groups',
  },
  {
    name: 'groupCreate',
    signature: '(subject: string, participants: string[]) => Promise<GroupMetadata>',
    description: 'Create a new group with a subject and initial participants.',
    category: 'groups',
    layer: 'groups',
  },
  {
    name: 'groupLeave',
    signature: '(id: string) => Promise<void>',
    description: 'Leave a group.',
    category: 'groups',
    layer: 'groups',
  },
  {
    name: 'groupUpdateSubject',
    signature: '(jid: string, subject: string) => Promise<void>',
    description: 'Update the group subject/name.',
    category: 'groups',
    layer: 'groups',
  },
  {
    name: 'groupUpdateDescription',
    signature: '(jid: string, description?: string) => Promise<void>',
    description: 'Update the group description. Pass undefined to remove it.',
    category: 'groups',
    layer: 'groups',
  },
  {
    name: 'groupParticipantsUpdate',
    signature: '(jid: string, participants: string[], action: ParticipantAction) => Promise<{ status: string; jid: string }[]>',
    description: 'Add, remove, promote, or demote group participants.',
    category: 'groups',
    layer: 'groups',
    notes: 'ParticipantAction: "add" | "remove" | "promote" | "demote". Returns status per participant.',
  },
  {
    name: 'groupInviteCode',
    signature: '(jid: string) => Promise<string | undefined>',
    description: 'Get the group invite code.',
    category: 'groups',
    layer: 'groups',
  },
  {
    name: 'groupRevokeInvite',
    signature: '(jid: string) => Promise<string | undefined>',
    description: 'Revoke the current group invite code and generate a new one.',
    category: 'groups',
    layer: 'groups',
  },
  {
    name: 'groupAcceptInvite',
    signature: '(code: string) => Promise<string | undefined>',
    description: 'Accept a group invite by code. Returns the group JID.',
    category: 'groups',
    layer: 'groups',
  },
  {
    name: 'groupAcceptInviteV4',
    signature: '(key: string | WAMessageKey, inviteMessage: proto.Message.IGroupInviteMessage) => Promise<string>',
    description: 'Accept a group invite from a v4 invite message.',
    category: 'groups',
    layer: 'groups',
  },
  {
    name: 'groupGetInviteInfo',
    signature: '(code: string) => Promise<GroupMetadata>',
    description: 'Get group metadata from an invite code without joining.',
    category: 'groups',
    layer: 'groups',
  },
  {
    name: 'groupToggleEphemeral',
    signature: '(jid: string, ephemeralExpiration: number) => Promise<void>',
    description: 'Toggle ephemeral/disappearing messages in a group. Set 0 to disable.',
    category: 'groups',
    layer: 'groups',
    notes: 'Common values: 0 (off), 86400 (24h), 604800 (7d), 7776000 (90d).',
  },
  {
    name: 'groupSettingUpdate',
    signature: '(jid: string, setting: "announcement" | "not_announcement" | "locked" | "unlocked") => Promise<void>',
    description: 'Update group settings: announcement (only admins can send) or locked (only admins can change settings).',
    category: 'groups',
    layer: 'groups',
  },
  {
    name: 'groupFetchAllParticipating',
    signature: '() => Promise<{ [_: string]: GroupMetadata }>',
    description: 'Fetch metadata for all groups the user is participating in.',
    category: 'groups',
    layer: 'groups',
  },

  {
    name: 'refreshMediaConn',
    signature: '(forceGet?: boolean) => Promise<MediaConnInfo>',
    description: 'Refresh the media connection info for uploading media.',
    category: 'media',
    layer: 'messages-send',
  },
  {
    name: 'waUploadToServer',
    signature: 'WAMediaUploadFunction',
    description: 'Upload media to WhatsApp servers. Used internally by sendMessage and prepareWAMessageMedia.',
    category: 'media',
    layer: 'messages-send',
  },
  {
    name: 'profilePictureUrl',
    signature: '(jid: string, type?: "preview" | "image", timeoutMs?: number) => Promise<string | undefined>',
    description: 'Get the profile picture URL for a JID. "preview" for thumbnail, "image" for full size.',
    category: 'profile',
    layer: 'chats',
  },
  {
    name: 'updateProfilePicture',
    signature: '(jid: string, content: WAMediaUpload) => Promise<void>',
    description: 'Update the profile picture for a user or group.',
    category: 'profile',
    layer: 'chats',
  },
  {
    name: 'updateProfileStatus',
    signature: '(status: string) => Promise<void>',
    description: 'Update the "About" text status.',
    category: 'profile',
    layer: 'chats',
  },
  {
    name: 'updateProfileName',
    signature: '(name: string) => Promise<void>',
    description: 'Update the display name (push name).',
    category: 'profile',
    layer: 'chats',
  },
  {
    name: 'fetchStatus',
    signature: '(jid: string) => Promise<{ status: string; setAt: Date } | undefined>',
    description: 'Fetch the "About" status of a user.',
    category: 'profile',
    layer: 'chats',
  },
  {
    name: 'onWhatsApp',
    signature: '(...jids: string[]) => Promise<{ exists: boolean; jid: string; lid: string | undefined }[]>',
    description: 'Check if phone numbers are registered on WhatsApp. Returns existence, JID, and LID.',
    category: 'profile',
    layer: 'chats',
  },

  {
    name: 'logout',
    signature: '(msg?: string) => Promise<void>',
    description: 'Logout from WhatsApp, invalidating the session.',
    category: 'connection',
    layer: 'socket',
  },
  {
    name: 'end',
    signature: '(error: Error | undefined) => void',
    description: 'Close the connection. Pass an error to trigger disconnect event with reason.',
    category: 'connection',
    layer: 'socket',
  },
  {
    name: 'waitForConnectionUpdate',
    signature: '(check: (u: Partial<ConnectionState>) => boolean | undefined, timeoutMs?: number) => Promise<void>',
    description: 'Wait until a connection update matches the given check function.',
    category: 'connection',
    layer: 'socket',
  },
  {
    name: 'waitForSocketOpen',
    signature: '() => Promise<void>',
    description: 'Wait until the WebSocket connection is open.',
    category: 'connection',
    layer: 'socket',
  },
  {
    name: 'requestPairingCode',
    signature: '(phoneNumber: string, customPairingCode?: string) => Promise<string>',
    description: 'Request a pairing code for phone-number based pairing (alternative to QR).',
    category: 'connection',
    layer: 'socket',
  },
  {
    name: 'uploadPreKeys',
    signature: '(count?: number) => Promise<void>',
    description: 'Upload pre-keys for Signal Protocol encryption.',
    category: 'connection',
    layer: 'socket',
  },

  {
    name: 'sendPresenceUpdate',
    signature: '(type: WAPresence, toJid?: string) => Promise<void>',
    description: 'Send a presence update (available, unavailable, composing, recording, paused).',
    category: 'presence',
    layer: 'chats',
    notes: 'WAPresence: "available" | "unavailable" | "composing" | "recording" | "paused". If toJid is provided, sends typing indicator to that specific chat.',
  },
  {
    name: 'presenceSubscribe',
    signature: '(toJid: string) => Promise<void>',
    description: 'Subscribe to presence updates from a specific JID.',
    category: 'presence',
    layer: 'chats',
  },

  {
    name: 'fetchPrivacySettings',
    signature: '(force?: boolean) => Promise<{ [_: string]: string }>',
    description: 'Fetch all privacy settings.',
    category: 'privacy',
    layer: 'chats',
  },
  {
    name: 'fetchBlocklist',
    signature: '() => Promise<string[]>',
    description: 'Fetch the list of blocked JIDs.',
    category: 'privacy',
    layer: 'chats',
  },
  {
    name: 'updateBlockStatus',
    signature: '(jid: string, action: "block" | "unblock") => Promise<void>',
    description: 'Block or unblock a contact.',
    category: 'privacy',
    layer: 'chats',
  },
  {
    name: 'updateCallPrivacy',
    signature: '(value: WAPrivacyCallValue) => Promise<void>',
    description: 'Update who can call you.',
    category: 'privacy',
    layer: 'chats',
  },
  {
    name: 'updateMessagesPrivacy',
    signature: '(value: WAPrivacyMessagesValue) => Promise<void>',
    description: 'Update who can message you.',
    category: 'privacy',
    layer: 'chats',
  },
  {
    name: 'updateLastSeenPrivacy',
    signature: '(value: WAPrivacyValue) => Promise<void>',
    description: 'Update who can see your last seen.',
    category: 'privacy',
    layer: 'chats',
  },
  {
    name: 'updateOnlinePrivacy',
    signature: '(value: WAPrivacyOnlineValue) => Promise<void>',
    description: 'Update who can see when you are online.',
    category: 'privacy',
    layer: 'chats',
  },
  {
    name: 'updateProfilePicturePrivacy',
    signature: '(value: WAPrivacyValue) => Promise<void>',
    description: 'Update who can see your profile picture.',
    category: 'privacy',
    layer: 'chats',
  },
  {
    name: 'updateStatusPrivacy',
    signature: '(value: WAPrivacyValue) => Promise<void>',
    description: 'Update who can see your status/about.',
    category: 'privacy',
    layer: 'chats',
  },
  {
    name: 'updateReadReceiptsPrivacy',
    signature: '(value: WAReadReceiptsValue) => Promise<void>',
    description: 'Enable or disable read receipts (blue ticks).',
    category: 'privacy',
    layer: 'chats',
  },
  {
    name: 'updateGroupsAddPrivacy',
    signature: '(value: WAPrivacyGroupAddValue) => Promise<void>',
    description: 'Update who can add you to groups.',
    category: 'privacy',
    layer: 'chats',
  },

  {
    name: 'getBusinessProfile',
    signature: '(jid: string) => Promise<WABusinessProfile | void>',
    description: 'Get the WhatsApp Business profile for a JID.',
    category: 'business',
    layer: 'chats',
  },
  {
    name: 'getCatalog',
    signature: '(jid?: string, limit?: number) => Promise<any>',
    description: 'Get the product catalog for a business account.',
    category: 'business',
    layer: 'business',
  },
  {
    name: 'getCollections',
    signature: '(jid?: string, limit?: number) => Promise<any>',
    description: 'Get product collections for a business account.',
    category: 'business',
    layer: 'business',
  },
  {
    name: 'getOrderDetails',
    signature: '(orderId: string, tokenBase64: string) => Promise<any>',
    description: 'Get details of an order.',
    category: 'business',
    layer: 'business',
  },
  {
    name: 'productCreate',
    signature: '(create: ProductCreate) => Promise<any>',
    description: 'Create a new product in the catalog.',
    category: 'business',
    layer: 'business',
  },
  {
    name: 'productDelete',
    signature: '(productIds: string[]) => Promise<{ deleted: number }>',
    description: 'Delete products from the catalog.',
    category: 'business',
    layer: 'business',
  },
  {
    name: 'productUpdate',
    signature: '(productId: string, update: ProductUpdate) => Promise<any>',
    description: 'Update a product in the catalog.',
    category: 'business',
    layer: 'business',
  },

  {
    name: 'rejectCall',
    signature: '(callId: string, callFrom: string) => Promise<void>',
    description: 'Reject an incoming call.',
    category: 'calls',
    layer: 'messages-recv',
  },

  {
    name: 'chatModify',
    signature: '(mod: ChatModification, jid: string) => Promise<void>',
    description: 'Modify a chat: archive, pin, mute, clear, star, markRead, delete, contact, labels.',
    category: 'chat',
    layer: 'chats',
    notes: 'ChatModification is a union type — see whaileys_chat tool for all variants.',
  },
  {
    name: 'upsertMessage',
    signature: '(msg: WAMessage, type: MessageUpsertType) => Promise<void>',
    description: 'Upsert a message into the internal message store.',
    category: 'chat',
    layer: 'chats',
  },
  {
    name: 'addChatLabel',
    signature: '(jid: string, labelId: string) => Promise<void>',
    description: 'Add a label to a chat.',
    category: 'chat',
    layer: 'chats',
  },
  {
    name: 'removeChatLabel',
    signature: '(jid: string, labelId: string) => Promise<void>',
    description: 'Remove a label from a chat.',
    category: 'chat',
    layer: 'chats',
  },
  {
    name: 'addMessageLabel',
    signature: '(jid: string, messageId: string, labelId: string) => Promise<void>',
    description: 'Add a label to a specific message.',
    category: 'chat',
    layer: 'chats',
  },
  {
    name: 'removeMessageLabel',
    signature: '(jid: string, messageId: string, labelId: string) => Promise<void>',
    description: 'Remove a label from a specific message.',
    category: 'chat',
    layer: 'chats',
  },
  {
    name: 'addLabel',
    signature: '(labelId: string, name: string, color?: number, predefinedId?: number, deleted?: boolean) => Promise<void>',
    description: 'Create or edit a label.',
    category: 'chat',
    layer: 'chats',
  },
  {
    name: 'addOrEditContact',
    signature: '(jid: string, contact: proto.SyncActionValue.IContactAction) => Promise<void>',
    description: 'Add or edit a contact in the app state sync.',
    category: 'chat',
    layer: 'chats',
  },
  {
    name: 'removeContact',
    signature: '(jid: string) => Promise<void>',
    description: 'Remove a contact from the app state sync.',
    category: 'chat',
    layer: 'chats',
  },
  {
    name: 'resyncAppState',
    signature: '(collections: readonly WAPatchName[], isInitialSync: boolean) => Promise<void>',
    description: 'Re-sync app state collections (contacts, mute, pin, etc).',
    category: 'chat',
    layer: 'chats',
  },

  {
    name: 'fetchMessageHistory',
    signature: '(count: number, oldestMsgKey: WAMessageKey, oldestMsgTimestamp: number | Long) => Promise<string>',
    description: 'Fetch message history for a chat (load older messages).',
    category: 'history',
    layer: 'messages-recv',
  },
  {
    name: 'requestPlaceholderResend',
    signature: '(messageKeys: { messageKey: WAMessageKey }[]) => Promise<string>',
    description: 'Request resend of placeholder messages.',
    category: 'history',
    layer: 'messages-recv',
  },
]

export function getMethodsByCategory(category: SocketMethodCategory): SocketMethodInfo[] {
  return SOCKET_METHODS.filter((m) => m.category === category)
}

export function getMethodByName(name: string): SocketMethodInfo | undefined {
  return SOCKET_METHODS.find((m) => m.name.toLowerCase() === name.toLowerCase())
}

export function searchMethods(query: string): SocketMethodInfo[] {
  const q = query.toLowerCase()
  return SOCKET_METHODS.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.signature.toLowerCase().includes(q) ||
      m.notes?.toLowerCase().includes(q),
  )
}

export interface ChatModificationVariant {
  name: string
  type: string
  description: string
  example?: string
}

export const CHAT_MODIFICATIONS: ChatModificationVariant[] = [
  {
    name: 'archive',
    type: '{ archive: boolean; lastMessages: LastMessageList }',
    description: 'Archive or unarchive a chat.',
    example: 'await socket.chatModify({ archive: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, jid)',
  },
  {
    name: 'pin',
    type: '{ pin: boolean }',
    description: 'Pin or unpin a chat.',
    example: 'await socket.chatModify({ pin: true }, jid)',
  },
  {
    name: 'mute',
    type: '{ mute: number | null }',
    description: 'Mute a chat for a duration (Unix timestamp) or unmute (null).',
    example: 'await socket.chatModify({ mute: Date.now() + 8 * 60 * 60 * 1000 }, jid)  // mute for 8 hours',
  },
  {
    name: 'clear',
    type: '{ clear: "all" | { messages: { id: string; fromMe?: boolean; timestamp: number }[] } }',
    description: 'Clear chat messages — all or specific messages.',
    example: 'await socket.chatModify({ clear: "all" }, jid)',
  },
  {
    name: 'star',
    type: '{ star: { messages: { id: string; fromMe?: boolean }[]; star: boolean } }',
    description: 'Star or unstar specific messages.',
    example: 'await socket.chatModify({ star: { messages: [{ id: msg.key.id!, fromMe: true }], star: true } }, jid)',
  },
  {
    name: 'markRead',
    type: '{ markRead: boolean; lastMessages: LastMessageList }',
    description: 'Mark a chat as read or unread.',
    example: 'await socket.chatModify({ markRead: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, jid)',
  },
  {
    name: 'delete',
    type: '{ delete: true; lastMessages: LastMessageList }',
    description: 'Delete a chat.',
    example: 'await socket.chatModify({ delete: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, jid)',
  },
  {
    name: 'pushNameSetting',
    type: '{ pushNameSetting: string }',
    description: 'Set the push name setting for the chat.',
    example: 'await socket.chatModify({ pushNameSetting: "My Name" }, jid)',
  },
  {
    name: 'contact',
    type: '{ contact: proto.SyncActionValue.IContactAction | null }',
    description: 'Create, edit, or remove a contact in app state. Pass null to remove.',
  },
  {
    name: 'addLabel',
    type: '{ addLabel: { name: string; color: number; predefinedId: number; deleted: boolean; id: string } }',
    description: 'Add or edit a label.',
  },
  {
    name: 'addChatLabel',
    type: '{ addChatLabel: { labelId: string } }',
    description: 'Associate a label with a chat.',
  },
  {
    name: 'removeChatLabel',
    type: '{ removeChatLabel: { labelId: string } }',
    description: 'Remove a label from a chat.',
  },
  {
    name: 'addMessageLabel',
    type: '{ addMessageLabel: { labelId: string; messageId: string } }',
    description: 'Associate a label with a specific message.',
  },
  {
    name: 'removeMessageLabel',
    type: '{ removeMessageLabel: { labelId: string; messageId: string } }',
    description: 'Remove a label from a specific message.',
  },
]

export interface PresenceInfo {
  value: string
  description: string
}

export const WA_PRESENCES: PresenceInfo[] = [
  { value: 'available', description: 'User is online/active' },
  { value: 'unavailable', description: 'User is offline' },
  { value: 'composing', description: 'User is typing a message' },
  { value: 'recording', description: 'User is recording audio' },
  { value: 'paused', description: 'User paused typing/recording' },
]

export interface PrivacySettingInfo {
  method: string
  valueType: string
  description: string
}

export const PRIVACY_SETTINGS: PrivacySettingInfo[] = [
  { method: 'updateLastSeenPrivacy', valueType: 'WAPrivacyValue ("all" | "contacts" | "contact_blacklist" | "none")', description: 'Who can see your last seen' },
  { method: 'updateOnlinePrivacy', valueType: 'WAPrivacyOnlineValue ("all" | "match_last_seen")', description: 'Who can see when you are online' },
  { method: 'updateProfilePicturePrivacy', valueType: 'WAPrivacyValue', description: 'Who can see your profile picture' },
  { method: 'updateStatusPrivacy', valueType: 'WAPrivacyValue', description: 'Who can see your status/about' },
  { method: 'updateReadReceiptsPrivacy', valueType: 'WAReadReceiptsValue ("all" | "none")', description: 'Enable or disable read receipts (blue ticks)' },
  { method: 'updateGroupsAddPrivacy', valueType: 'WAPrivacyGroupAddValue ("all" | "contacts" | "contact_blacklist")', description: 'Who can add you to groups' },
  { method: 'updateCallPrivacy', valueType: 'WAPrivacyCallValue ("all" | "known")', description: 'Who can call you' },
  { method: 'updateMessagesPrivacy', valueType: 'WAPrivacyMessagesValue ("all" | "known")', description: 'Who can message you' },
]

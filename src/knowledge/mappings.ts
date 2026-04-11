export interface ContentTypeMapping {
  check: string
  type: string
  description: string
}

export const CONTENT_TYPE_DETECTION: ContentTypeMapping[] = [
  { check: 'conversation || extendedTextMessage', type: 'text', description: 'Plain text or extended text with mentions/links' },
  { check: 'imageMessage', type: 'image', description: 'Image file attachment' },
  { check: 'videoMessage', type: 'video', description: 'Video file attachment' },
  { check: 'audioMessage', type: 'audio', description: 'Audio file or voice note' },
  { check: 'documentMessage', type: 'document', description: 'Document file (PDF, DOCX, etc)' },
  { check: 'stickerMessage', type: 'sticker', description: 'Sticker image (WebP format)' },
  { check: 'contactMessage', type: 'contact', description: 'Single contact vCard' },
  { check: 'contactsArrayMessage', type: 'contacts', description: 'Multiple contacts vCard array' },
  { check: 'locationMessage || liveLocationMessage', type: 'location', description: 'Location or live location share' },
  { check: 'buttonsMessage || templateMessage', type: 'interactive', description: 'Interactive message with buttons/template' },
  { check: 'listMessage', type: 'list', description: 'List message with sections and rows' },
  { check: 'reactionMessage', type: 'reaction', description: 'Emoji reaction to a message' },
  { check: 'pollCreationMessage || pollCreationMessageV3', type: 'poll', description: 'Poll creation message' },
]

export const CONTENT_TYPE_DETECTION_PATTERN = `function getContentType(msg: proto.IMessage): string | undefined {
  if (msg.conversation || msg.extendedTextMessage) return 'text'
  if (msg.imageMessage) return 'image'
  if (msg.videoMessage) return 'video'
  if (msg.audioMessage) return 'audio'
  if (msg.documentMessage) return 'document'
  if (msg.stickerMessage) return 'sticker'
  if (msg.contactMessage) return 'contact'
  if (msg.contactsArrayMessage) return 'contacts'
  if (msg.locationMessage || msg.liveLocationMessage) return 'location'
  if (msg.buttonsMessage || msg.templateMessage) return 'interactive'
  if (msg.listMessage) return 'list'
  if (msg.reactionMessage) return 'reaction'
  if (msg.pollCreationMessage || msg.pollCreationMessageV3) return 'poll'
  return undefined
}`

export interface ReceiptTypeInfo {
  value: string
  description: string
}

export const MESSAGE_RECEIPT_TYPES: ReceiptTypeInfo[] = [
  { value: 'undefined', description: 'Default delivery receipt (message delivered to server)' },
  { value: 'read', description: 'Message has been read by the recipient (blue ticks)' },
  { value: 'read-self', description: 'Message read by self on another device' },
  { value: 'hist_sync', description: 'History sync receipt (used during initial sync)' },
  { value: 'peer_msg', description: 'Peer message receipt (device-to-device sync)' },
  { value: 'sender', description: 'Sender receipt — sent notification' },
  { value: 'inactive', description: 'Receipt for inactive/archived chat' },
  { value: 'played', description: 'Media has been played (voice notes, video)' },
]

export const DELIVERY_STATUS_CODES = {
  description: 'Numeric delivery status codes from message receipt events',
  codes: [
    { code: 2, meaning: 'delivered', description: 'Message delivered to recipient device' },
    { code: 3, meaning: 'read', description: 'Message read by recipient (first read)' },
    { code: 4, meaning: 'read', description: 'Message read by recipient (subsequent)' },
    { code: 5, meaning: 'played', description: 'Media message played by recipient' },
  ],
  notes: 'Status codes >= 3 indicate the message has been read. Code 5 specifically means audio/video was played.',
}

export interface UpsertTypeInfo {
  value: string
  description: string
}

export const MESSAGE_UPSERT_TYPES: UpsertTypeInfo[] = [
  { value: 'append', description: 'Message appended to history (from history sync, not real-time)' },
  { value: 'notify', description: 'New real-time message received (should trigger notifications/processing)' },
]

export const MESSAGE_UPSERT_PATTERN = `socket.ev.on('messages.upsert', ({ messages, type }) => {
  if (type !== 'notify') return
  for (const msg of messages) {
    if (msg.key.fromMe) continue
    // Process incoming message
  }
})`

export interface StubTypeInfo {
  name: string
  value: number
  description: string
}

export const COMMON_STUB_TYPES: StubTypeInfo[] = [
  { name: 'REVOKE', value: 1, description: 'Message was deleted/revoked' },
  { name: 'CIPHERTEXT', value: 2, description: 'Encrypted message placeholder (retry needed)' },
  { name: 'FUTUREPROOF', value: 3, description: 'Future-proof message (unsupported by current version)' },
  { name: 'NON_VERIFIED_TRANSITION', value: 4, description: 'Contact identity changed' },
  { name: 'UNVERIFIED_TRANSITION', value: 5, description: 'Contact identity unverified transition' },
  { name: 'VERIFIED_TRANSITION', value: 6, description: 'Contact identity verified' },
  { name: 'VERIFIED_LOW_UNKNOWN', value: 7, description: 'Unknown low verification state' },
  { name: 'VERIFIED_HIGH', value: 8, description: 'High verification state' },
  { name: 'VERIFIED_INITIAL_UNKNOWN', value: 9, description: 'Initial unknown verification' },
  { name: 'VERIFIED_INITIAL_LOW', value: 10, description: 'Initial low verification' },
  { name: 'VERIFIED_INITIAL_HIGH', value: 11, description: 'Initial high verification' },
  { name: 'GROUP_CREATE', value: 20, description: 'Group was created' },
  { name: 'GROUP_CHANGE_SUBJECT', value: 21, description: 'Group subject/name changed' },
  { name: 'GROUP_CHANGE_ICON', value: 22, description: 'Group icon changed' },
  { name: 'GROUP_CHANGE_INVITE_LINK', value: 23, description: 'Group invite link changed' },
  { name: 'GROUP_CHANGE_DESCRIPTION', value: 24, description: 'Group description changed' },
  { name: 'GROUP_CHANGE_RESTRICT', value: 25, description: 'Group restrict setting changed' },
  { name: 'GROUP_CHANGE_ANNOUNCE', value: 26, description: 'Group announce setting changed' },
  { name: 'GROUP_PARTICIPANT_ADD', value: 27, description: 'Participant added to group' },
  { name: 'GROUP_PARTICIPANT_REMOVE', value: 28, description: 'Participant removed from group' },
  { name: 'GROUP_PARTICIPANT_PROMOTE', value: 29, description: 'Participant promoted to admin' },
  { name: 'GROUP_PARTICIPANT_DEMOTE', value: 30, description: 'Participant demoted from admin' },
  { name: 'GROUP_PARTICIPANT_INVITE', value: 31, description: 'Participant invited to group' },
  { name: 'GROUP_PARTICIPANT_LEAVE', value: 32, description: 'Participant left the group' },
  { name: 'GROUP_PARTICIPANT_CHANGE_NUMBER', value: 33, description: 'Participant changed phone number' },
  { name: 'BROADCAST_CREATE', value: 34, description: 'Broadcast list created' },
  { name: 'BROADCAST_ADD', value: 35, description: 'Contact added to broadcast list' },
  { name: 'BROADCAST_REMOVE', value: 36, description: 'Contact removed from broadcast list' },
  { name: 'E2E_ENCRYPTED', value: 39, description: 'End-to-end encryption notification' },
  { name: 'E2E_IDENTITY_CHANGED', value: 40, description: 'Contact security code changed' },
  { name: 'EPHEMERAL_SETTING', value: 46, description: 'Ephemeral messages setting changed' },
  { name: 'GROUP_CHANGE_EPHEMERAL_SETTING', value: 47, description: 'Group ephemeral setting changed' },
]

export const MEDIA_HKDF_KEY_MAPPING = {
  description: 'Mapping between MediaType and HKDF key info used for encryption/decryption',
  mappings: [
    { mediaType: 'audio', hkdfKey: 'Audio', uploadPath: '/mms/audio' },
    { mediaType: 'document', hkdfKey: 'Document', uploadPath: '/mms/document' },
    { mediaType: 'gif', hkdfKey: 'Video', uploadPath: '' },
    { mediaType: 'image', hkdfKey: 'Image', uploadPath: '/mms/image' },
    { mediaType: 'ppic', hkdfKey: '', uploadPath: '' },
    { mediaType: 'product', hkdfKey: 'Image', uploadPath: '' },
    { mediaType: 'ptt', hkdfKey: 'Audio', uploadPath: '' },
    { mediaType: 'sticker', hkdfKey: 'Image', uploadPath: '/mms/image' },
    { mediaType: 'video', hkdfKey: 'Video', uploadPath: '/mms/video' },
    { mediaType: 'thumbnail-document', hkdfKey: 'Document Thumbnail', uploadPath: '' },
    { mediaType: 'thumbnail-image', hkdfKey: 'Image Thumbnail', uploadPath: '' },
    { mediaType: 'thumbnail-video', hkdfKey: 'Video Thumbnail', uploadPath: '' },
    { mediaType: 'thumbnail-link', hkdfKey: 'Link Thumbnail', uploadPath: '/mms/image' },
    { mediaType: 'md-msg-hist', hkdfKey: 'History', uploadPath: '' },
    { mediaType: 'md-app-state', hkdfKey: 'App State', uploadPath: '' },
  ],
  notes: 'The HKDF key is used to derive encryption keys for media uploads/downloads. Empty hkdfKey means the type uses a different mechanism.',
}

export const MESSAGE_NORMALIZATION_CHAIN = {
  description: 'Standard message normalization chain from raw WAMessage to usable content',
  steps: [
    { step: 1, action: 'Extract message', code: 'const msg = webMsg.message', description: 'Get the raw proto.IMessage from WAWebMessageInfo' },
    { step: 2, action: 'Unwrap viewOnce', code: 'msg.viewOnceMessage?.message || msg.viewOnceMessageV2?.message || msg', description: 'Unwrap view-once wrapper if present' },
    { step: 3, action: 'Unwrap ephemeral', code: 'msg.ephemeralMessage?.message || msg', description: 'Unwrap ephemeral/disappearing message wrapper' },
    { step: 4, action: 'Unwrap documentWithCaption', code: 'msg.documentWithCaptionMessage?.message || msg', description: 'Unwrap document-with-caption wrapper' },
    { step: 5, action: 'Detect content type', code: 'getContentType(normalizedMsg)', description: 'Determine the actual content type from the normalized message' },
    { step: 6, action: 'Extract content', code: 'normalizedMsg[contentType]', description: 'Extract the typed content from the message' },
  ],
  notes: 'Messages can be wrapped in multiple layers. Always normalize before processing. The order matters: viewOnce → ephemeral → documentWithCaption.',
}

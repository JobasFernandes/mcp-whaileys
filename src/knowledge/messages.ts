export type MessageCategory = 'basic' | 'media' | 'interactive' | 'system' | 'advanced'

export interface MessageTypeInfo {
  name: string
  contentType: string
  description: string
  mixins: string[]
  protoField?: string
  supports: string[]
  category: MessageCategory
  notes?: string
}

export const MESSAGE_TYPES: MessageTypeInfo[] = [
  {
    name: 'text',
    contentType: '{ text: string; linkPreview?: WAUrlInfo | null }',
    description: 'Plain text message with optional link preview. The most common message type.',
    mixins: ['Mentionable', 'Contextable', 'Buttonable', 'Templatable', 'Listable', 'Editable', 'ViewOnce'],
    protoField: 'extendedTextMessage',
    supports: ['mentions', 'reply', 'forward', 'buttons', 'templates', 'lists', 'edit', 'link-preview'],
    category: 'basic',
    notes: 'Simple text uses `conversation` proto field; text with any extra features uses `extendedTextMessage`. Use MiscMessageGenerationOptions for quoted/messageId.',
  },
  {
    name: 'contact',
    contentType: '{ contacts: { displayName?: string; contacts: proto.Message.IContactMessage[] } }',
    description: 'Share one or more contacts as vCard format.',
    mixins: ['ViewOnce'],
    protoField: 'contactMessage',
    supports: ['forward'],
    category: 'basic',
    notes: 'For single contact use `contactMessage`, for multiple use `contactsArrayMessage`. VCard format: BEGIN:VCARD\\nVERSION:3.0\\nFN:Name\\nTEL;type=CELL;type=VOICE;waid=NUMBER:+NUMBER\\nEND:VCARD',
  },
  {
    name: 'location',
    contentType: '{ location: WALocationMessage }',
    description: 'Share a geographic location with coordinates, name, and address.',
    mixins: ['ViewOnce'],
    protoField: 'locationMessage',
    supports: ['forward'],
    category: 'basic',
    notes: 'WALocationMessage has: degreesLatitude, degreesLongitude, name?, address?. Also supports liveLocationMessage for real-time tracking.',
  },
  {
    name: 'forward',
    contentType: '{ forward: WAMessage; force?: boolean }',
    description: 'Forward an existing message to another chat.',
    mixins: [],
    supports: [],
    category: 'basic',
    notes: 'Set force: true to forward even if the message is marked as non-forwardable.',
  },
  {
    name: 'delete',
    contentType: '{ delete: WAMessageKey }',
    description: 'Delete/revoke a previously sent message.',
    mixins: [],
    protoField: 'protocolMessage',
    supports: [],
    category: 'basic',
    notes: 'WAMessageKey requires: { remoteJid, id, fromMe: true }. Can only delete own messages (fromMe: true) or admin can delete in groups.',
  },
  {
    name: 'disappearing',
    contentType: '{ disappearingMessagesInChat: boolean | number }',
    description: 'Enable/disable disappearing messages in a chat.',
    mixins: [],
    supports: [],
    category: 'basic',
    notes: 'Set to true for default duration, false to disable, or a number for custom seconds (e.g., 86400 for 24h, 604800 for 7d, 7776000 for 90d).',
  },
  {
    name: 'edit',
    contentType: '{ text: string; edit: WAMessageKey }',
    description: 'Edit a previously sent text message.',
    mixins: ['Editable'],
    protoField: 'protocolMessage',
    supports: [],
    category: 'basic',
    notes: 'WAMessageKey in edit must have fromMe: true. Only text messages can be edited. Changes are visible to all participants.',
  },
  {
    name: 'requestPhoneNumber',
    contentType: '{ requestPhoneNumber: boolean }',
    description: 'Request the phone number from a contact (business accounts).',
    mixins: [],
    supports: [],
    category: 'basic',
  },

  {
    name: 'image',
    contentType: '{ image: WAMediaUpload; caption?: string; jpegThumbnail?: string }',
    description: 'Send an image with optional caption and thumbnail.',
    mixins: ['Mentionable', 'Contextable', 'Buttonable', 'Templatable', 'WithDimensions', 'Editable', 'ViewOnce'],
    protoField: 'imageMessage',
    supports: ['mentions', 'reply', 'forward', 'buttons', 'templates', 'caption', 'view-once', 'edit'],
    category: 'media',
    notes: 'WAMediaUpload accepts: Buffer, { url: string }, or { stream: Readable }. ViewOnce images can only be viewed once by the recipient.',
  },
  {
    name: 'video',
    contentType: '{ video: WAMediaUpload; caption?: string; gifPlayback?: boolean; jpegThumbnail?: string }',
    description: 'Send a video with optional caption. Can be played as GIF.',
    mixins: ['Mentionable', 'Contextable', 'Buttonable', 'Templatable', 'WithDimensions', 'Editable', 'ViewOnce'],
    protoField: 'videoMessage',
    supports: ['mentions', 'reply', 'forward', 'buttons', 'templates', 'caption', 'gif', 'view-once', 'edit'],
    category: 'media',
    notes: 'Set gifPlayback: true to play the video as a GIF (loops, no sound). ViewOnce videos can only be viewed once.',
  },
  {
    name: 'audio',
    contentType: '{ audio: WAMediaUpload; ptt?: boolean; seconds?: number; waveform?: string | Uint8Array | null }',
    description: 'Send an audio file or voice note (PTT). REQUIRES OGG/Opus format for voice notes.',
    mixins: ['Editable', 'ViewOnce'],
    protoField: 'audioMessage',
    supports: ['forward', 'view-once'],
    category: 'media',
    notes: 'CRITICAL: Voice notes (ptt: true) MUST be in OGG/Opus format (mimetype: "audio/ogg; codecs=opus"). Requires ffmpeg conversion from other formats. Set seconds for duration and waveform for the audio waveform visualization.',
  },
  {
    name: 'sticker',
    contentType: '{ sticker: WAMediaUpload; isAnimated?: boolean }',
    description: 'Send a sticker image (WebP format). Can be animated.',
    mixins: ['WithDimensions', 'ViewOnce'],
    protoField: 'stickerMessage',
    supports: ['forward'],
    category: 'media',
    notes: 'Stickers must be WebP format, 512x512 pixels. Animated stickers use isAnimated: true.',
  },
  {
    name: 'document',
    contentType: '{ document: WAMediaUpload; mimetype: string; fileName?: string }',
    description: 'Send a document/file with MIME type.',
    mixins: ['Buttonable', 'Contextable', 'Templatable', 'Editable', 'ViewOnce'],
    protoField: 'documentMessage',
    supports: ['reply', 'forward', 'buttons', 'templates'],
    category: 'media',
    notes: 'mimetype is REQUIRED (e.g., "application/pdf", "text/csv"). fileName is used as the display name in the chat.',
  },

  {
    name: 'buttons',
    contentType: '{ text: string; footer?: string; buttons: proto.Message.ButtonsMessage.IButton[] }',
    description: 'Message with clickable buttons (max 3). Uses Buttonable mixin or direct content.',
    mixins: ['Buttonable', 'ViewOnce'],
    protoField: 'buttonsMessage',
    supports: ['reply', 'header'],
    category: 'interactive',
    notes: 'PRODUCTION PATTERN: Must cast to `as any` due to missing types. Button shape: { buttonId: string, buttonText: { displayText: string }, type: 1 }. Max 3 buttons. Header can be text, image, video, or document.',
  },
  {
    name: 'list',
    contentType: '{ text: string; footer?: string; title?: string; buttonText: string; sections: proto.Message.ListMessage.ISection[] }',
    description: 'Message with a selectable list menu. Sections contain rows with titles and descriptions.',
    mixins: ['Listable', 'ViewOnce'],
    protoField: 'listMessage',
    supports: ['reply', 'sections'],
    category: 'interactive',
    notes: 'Section shape: { title: string, rows: [{ rowId: string, title: string, description?: string }] }. buttonText is the text shown on the "view list" button.',
  },
  {
    name: 'template',
    contentType: '{ templateButtons: proto.IHydratedTemplateButton[]; footer?: string }',
    description: 'Template message with hydrated buttons (call, URL, quick reply).',
    mixins: ['Templatable', 'ViewOnce'],
    protoField: 'templateMessage',
    supports: ['reply', 'call-button', 'url-button', 'quick-reply'],
    category: 'interactive',
    notes: 'HydratedTemplateButton can be: { callButton: { displayText, phoneNumber } }, { urlButton: { displayText, url } }, or { quickReplyButton: { displayText, id } }.',
  },
  {
    name: 'interactiveMessage',
    contentType: '{ interactiveMessage: proto.Message.IInteractiveMessage }',
    description: 'Low-level interactive message for carousel, native flow, shop, and collection.',
    mixins: ['ViewOnce'],
    protoField: 'interactiveMessage',
    supports: ['carousel', 'native-flow', 'shop', 'collection'],
    category: 'interactive',
    notes: 'ADVANCED PATTERN: Uses generateWAMessageFromContent + relayMessage instead of sendMessage. For carousel: viewOnceMessage > interactiveMessage > carouselMessage. For Pix/payment: interactiveMessage > nativeFlowMessage.',
  },
  {
    name: 'product',
    contentType: '{ product: WASendableProduct; businessOwnerJid?: string; body?: string; footer?: string }',
    description: 'Share a product from a WhatsApp Business catalog.',
    mixins: ['ViewOnce'],
    protoField: 'productMessage',
    supports: ['forward'],
    category: 'interactive',
  },

  {
    name: 'reaction',
    contentType: '{ react: proto.Message.IReactionMessage }',
    description: 'React to a message with an emoji.',
    mixins: [],
    protoField: 'reactionMessage',
    supports: [],
    category: 'advanced',
    notes: 'IReactionMessage shape: { text: "emoji", key: { remoteJid, id, fromMe } }. Send empty text ("") to remove reaction.',
  },
  {
    name: 'poll',
    contentType: 'proto.Message.PollCreationMessage (via generateWAMessageFromContent)',
    description: 'Create a poll with 2-12 options. Uses advanced sending pattern.',
    mixins: [],
    protoField: 'pollCreationMessageV3',
    supports: [],
    category: 'advanced',
    notes: 'ADVANCED PATTERN: Uses proto.Message.PollCreationMessage.fromObject() with pollCreationMessageV3 wrapper. Requires randomBytes(32) for encKey and sha256(Buffer.from(optionName)) for option hashes. Supports 2-12 options.',
  },
  {
    name: 'viewOnce',
    contentType: 'Any media message with { viewOnce: true }',
    description: 'Send a view-once media message (image, video, audio, document).',
    mixins: ['ViewOnce'],
    supports: [],
    category: 'advanced',
    notes: 'Not a separate message type — add viewOnce: true to any media message. The recipient can only view the media once.',
  },
  {
    name: 'buttonReply',
    contentType: '{ buttonReply: ButtonReplyInfo; type: "template" | "plain" }',
    description: 'Reply to a button/template message selection.',
    mixins: [],
    protoField: 'buttonsResponseMessage',
    supports: [],
    category: 'advanced',
    notes: 'ButtonReplyInfo contains the selected button ID and display text.',
  },
  {
    name: 'markAsRead',
    contentType: 'socket.readMessages(keys: WAMessageKey[])',
    description: 'Mark messages as read. NOT a sendMessage call — uses socket.readMessages() directly.',
    mixins: [],
    supports: [],
    category: 'advanced',
    notes: 'Uses socket.readMessages(keys) directly, NOT socket.sendMessage(). Pass an array of WAMessageKey objects.',
  },
]

export const MIXIN_TYPES: Record<string, string> = {
  Mentionable: '{ mentions?: string[] }',
  Contextable: '{ contextInfo?: proto.IContextInfo }',
  ViewOnce: '{ viewOnce?: boolean }',
  Buttonable: '{ buttons?: proto.Message.ButtonsMessage.IButton[] }',
  Templatable: '{ templateButtons?: proto.IHydratedTemplateButton[]; footer?: string }',
  Editable: '{ edit?: WAMessageKey }',
  Listable: '{ sections?: proto.Message.ListMessage.ISection[]; title?: string; buttonText?: string }',
  WithDimensions: '{ width?: number; height?: number }',
}

export function getMessagesByCategory(category: MessageCategory): MessageTypeInfo[] {
  return MESSAGE_TYPES.filter((m) => m.category === category)
}

export function getMessageByName(name: string): MessageTypeInfo | undefined {
  return MESSAGE_TYPES.find((m) => m.name.toLowerCase() === name.toLowerCase())
}

export function searchMessages(query: string): MessageTypeInfo[] {
  const q = query.toLowerCase()
  return MESSAGE_TYPES.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.protoField?.toLowerCase().includes(q) ||
      m.supports.some((s) => s.toLowerCase().includes(q)) ||
      m.notes?.toLowerCase().includes(q),
  )
}

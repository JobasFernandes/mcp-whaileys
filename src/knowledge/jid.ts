export interface JidServerInfo {
  suffix: string
  description: string
  example: string
}

export interface SpecialJidInfo {
  name: string
  value: string
  description: string
}

export interface JidUtilityInfo {
  name: string
  signature: string
  description: string
  returnType: string
}

export interface LidMigrationField {
  field: string
  type: string
  description: string
}

export interface JidInfo {
  servers: JidServerInfo[]
  specialJids: SpecialJidInfo[]
  utilities: JidUtilityInfo[]
  lidMigration: LidMigrationField[]
  types: { name: string; definition: string; description: string }[]
  productionPatterns: { pattern: string; description: string }[]
}

export const JID_REFERENCE: JidInfo = {
  servers: [
    { suffix: '@s.whatsapp.net', description: 'Personal/individual user JID (standard format)', example: '5511999999999@s.whatsapp.net' },
    { suffix: '@c.us', description: 'Personal user JID (legacy format, converted to @s.whatsapp.net by jidNormalizedUser)', example: '5511999999999@c.us' },
    { suffix: '@g.us', description: 'Group JID', example: '120363123456789@g.us' },
    { suffix: '@broadcast', description: 'Broadcast/status JID', example: 'status@broadcast' },
    { suffix: '@call', description: 'Call JID', example: '5511999999999@call' },
    { suffix: '@lid', description: 'LID (Local ID) for linked devices migration — replaces phone-based JIDs in some contexts', example: '123456789:0@lid' },
    { suffix: '@newsletter', description: 'WhatsApp Channel/Newsletter JID', example: '120363123456789@newsletter' },
    { suffix: '@bot', description: 'Meta AI bot JID', example: 'bot@bot' },
  ],

  specialJids: [
    { name: 'S_WHATSAPP_NET', value: '@s.whatsapp.net', description: 'Standard user JID suffix constant' },
    { name: 'OFFICIAL_BIZ_JID', value: '16505361212@c.us', description: 'Official WhatsApp Business account JID' },
    { name: 'SERVER_JID', value: 'server@c.us', description: 'Server JID for system messages' },
    { name: 'PSA_WID', value: '0@c.us', description: 'WhatsApp PSA/system announcement JID' },
    { name: 'STORIES_JID', value: 'status@broadcast', description: 'Status/Stories broadcast JID — used for WhatsApp Status updates' },
  ],

  utilities: [
    {
      name: 'jidEncode',
      signature: '(user: string | number | null, server: JidServer, device?: number, agent?: number) => string',
      description: 'Encodes components into a JID string. Used to build JIDs programmatically.',
      returnType: 'string',
    },
    {
      name: 'jidDecode',
      signature: '(jid: string | undefined) => FullJid | undefined',
      description: 'Decodes a JID string into its components (user, server, device). Returns undefined for invalid JIDs.',
      returnType: 'FullJid | undefined',
    },
    {
      name: 'jidNormalizedUser',
      signature: '(jid: string | undefined) => string',
      description: 'Normalizes a JID: converts @c.us to @s.whatsapp.net, strips device info. Used to extract phone number from socket.user.id.',
      returnType: 'string',
    },
    {
      name: 'areJidsSameUser',
      signature: '(jid1: string | undefined, jid2: string | undefined) => boolean',
      description: 'Checks if two JIDs belong to the same user (compares normalized user parts).',
      returnType: 'boolean',
    },
    {
      name: 'isJidUser',
      signature: '(jid: string | undefined) => boolean | undefined',
      description: 'Checks if JID is a personal user (@s.whatsapp.net).',
      returnType: 'boolean | undefined',
    },
    {
      name: 'isJidGroup',
      signature: '(jid: string | undefined) => boolean | undefined',
      description: 'Checks if JID is a group (@g.us).',
      returnType: 'boolean | undefined',
    },
    {
      name: 'isJidBroadcast',
      signature: '(jid: string | undefined) => boolean | undefined',
      description: 'Checks if JID is a broadcast/status (@broadcast).',
      returnType: 'boolean | undefined',
    },
    {
      name: 'isJidStatusBroadcast',
      signature: '(jid: string) => boolean',
      description: 'Checks if JID is exactly "status@broadcast" (WhatsApp Status/Stories).',
      returnType: 'boolean',
    },
    {
      name: 'isJidNewsletter',
      signature: '(jid: string | undefined) => boolean | undefined',
      description: 'Checks if JID is a WhatsApp Channel/Newsletter (@newsletter).',
      returnType: 'boolean | undefined',
    },
    {
      name: 'isJidMetaAI',
      signature: '(jid: string | undefined) => boolean | undefined',
      description: 'Checks if JID is a Meta AI bot (@bot).',
      returnType: 'boolean | undefined',
    },
    {
      name: 'isLidUser',
      signature: '(jid: string | undefined) => boolean | undefined',
      description: 'Checks if JID is a LID (Local ID) user (@lid). Used for linked device detection.',
      returnType: 'boolean | undefined',
    },
  ],

  lidMigration: [
    { field: 'senderLid', type: 'string?', description: 'LID of the message sender (set when sender_pn attribute present in stanza)' },
    { field: 'participantLid', type: 'string?', description: 'LID of the participant in group messages (when participant is a LID user)' },
    { field: 'recipientLid', type: 'string?', description: 'LID of the recipient (when recipient is a LID user)' },
    { field: 'addressingMode', type: 'string?', description: 'Group addressing mode: "pn" (phone-number based) or other. Affects how participants are identified. Set in GroupMetadata.' },
  ],

  types: [
    {
      name: 'JidServer',
      definition: '"c.us" | "g.us" | "broadcast" | "s.whatsapp.net" | "call" | "lid"',
      description: 'Union type representing all possible JID server suffixes.',
    },
    {
      name: 'JidWithDevice',
      definition: '{ user: string; device?: number; isLid?: boolean }',
      description: 'JID components with optional device number and LID flag.',
    },
    {
      name: 'FullJid',
      definition: 'JidWithDevice & { server: JidServer | string; domainType?: number }',
      description: 'Complete decoded JID with all components.',
    },
  ],

  productionPatterns: [
    {
      pattern: 'formatJid(phone): strip non-digit chars + add @s.whatsapp.net if no @',
      description: 'Utility to normalize user input phone numbers into valid JIDs. Strips all non-digit characters and appends @s.whatsapp.net if the string does not contain @.',
    },
    {
      pattern: 'jidNormalizedUser(socket.user.id): extract own phone number',
      description: 'After connection opens, use jidNormalizedUser on socket.user.id to get the connected phone number.',
    },
    {
      pattern: 'msg.key.participant || msg.key.remoteJid: get sender in groups',
      description: 'In group messages, the actual sender is in msg.key.participant. In private chats, use msg.key.remoteJid.',
    },
    {
      pattern: 'chatJid.endsWith("@g.us"): detect group chats',
      description: 'Quick check to determine if a chat is a group.',
    },
    {
      pattern: 'shouldIgnoreJid(jid): filter unwanted JIDs',
      description: 'Configurable JID filter: ignores broadcast JIDs (isJidBroadcast) and newsletter JIDs (isJidNewsletter) based on feature flags.',
    },
    {
      pattern: 'isLidUser(participant): detect LID senders in groups',
      description: 'In groups with LID migration, some participants use LID instead of phone-number JIDs. Check with isLidUser for proper handling.',
    },
  ],
}

export function getJidTopic(topic: string): Partial<JidInfo> {
  switch (topic.toLowerCase()) {
    case 'formats':
      return { servers: JID_REFERENCE.servers, types: JID_REFERENCE.types }
    case 'utilities':
      return { utilities: JID_REFERENCE.utilities }
    case 'special':
      return { specialJids: JID_REFERENCE.specialJids }
    case 'lid':
      return { lidMigration: JID_REFERENCE.lidMigration, productionPatterns: JID_REFERENCE.productionPatterns.filter((p) => p.pattern.toLowerCase().includes('lid')) }
    default:
      return JID_REFERENCE
  }
}

import type { CodeExample } from './index.js'

export const ADVANCED_EXAMPLES: CodeExample[] = [
  {
    id: 'send-reaction',
    title: 'Send Reaction',
    description: 'React to a message with an emoji. Pass empty string to remove reaction.',
    code: `await socket.sendMessage(jid, {
  react: {
    text: '👍',
    key: {
      remoteJid: jid,
      id: messageId,
      fromMe: false
    }
  }
})

await socket.sendMessage(jid, {
  react: {
    text: '',
    key: originalMessage.key
  }
})`,
    tags: ['reaction', 'emoji', 'sendMessage'],
  },
  {
    id: 'send-poll',
    title: 'Send Poll',
    description: 'Create a poll with 2-12 options. Uses proto.Message.PollCreationMessage.fromObject() with randomBytes for encryption key and sha256 for option hashes.',
    code: `import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'
import { randomBytes, createHash } from 'crypto'

const pollOptions = ['Option A', 'Option B', 'Option C']

const msg = generateWAMessageFromContent(jid, proto.Message.fromObject({
  pollCreationMessageV3: proto.Message.PollCreationMessage.fromObject({
    name: 'What do you prefer?',
    options: pollOptions.map((name) => ({
      optionName: name,
    })),
    selectableOptionsCount: 1,
    encKey: randomBytes(32),
    messageSecret: pollOptions.map((name) =>
      createHash('sha256').update(Buffer.from(name)).digest()
    ),
  }),
}), {})

await socket.relayMessage(jid, msg.message!, { messageId: msg.key.id! })`,
    tags: ['poll', 'vote', 'survey', 'relayMessage', 'generateWAMessageFromContent', 'crypto'],
  },
  {
    id: 'send-delete',
    title: 'Delete Message',
    description: 'Delete (revoke) a previously sent message. Can only delete own messages.',
    code: `await socket.sendMessage(jid, {
  delete: {
    remoteJid: jid,
    id: messageId,
    fromMe: true
  }
})`,
    tags: ['delete', 'revoke', 'sendMessage'],
  },
  {
    id: 'send-edit',
    title: 'Edit Message',
    description: 'Edit a previously sent text message with new content.',
    code: `await socket.sendMessage(jid, {
  text: 'Updated message text',
  edit: {
    remoteJid: jid,
    id: messageId,
    fromMe: true
  }
})`,
    tags: ['edit', 'update', 'sendMessage'],
  },
  {
    id: 'send-forward',
    title: 'Forward Message',
    description: 'Forward an existing message to another chat.',
    code: `await socket.sendMessage(targetJid, {
  forward: originalMessage
})`,
    tags: ['forward', 'sendMessage'],
  },
  {
    id: 'send-view-once',
    title: 'Send View Once Message',
    description: 'Send an image or video that can only be viewed once.',
    code: `await socket.sendMessage(jid, {
  image: { url: './secret-photo.jpg' },
  caption: 'View once only!',
  viewOnce: true
})`,
    tags: ['viewOnce', 'disappearing', 'image', 'sendMessage'],
  },
  {
    id: 'mark-read',
    title: 'Mark Messages as Read',
    description: 'Mark specific messages as read using readMessages (NOT sendMessage).',
    code: `await socket.readMessages([
  {
    remoteJid: jid,
    id: messageId,
    fromMe: false
  }
])`,
    tags: ['read', 'receipt', 'readMessages'],
  },
  {
    id: 'send-presence',
    title: 'Send Typing Indicator',
    description: 'Show typing or recording indicator in a chat.',
    code: `await socket.sendPresenceUpdate('composing', jid)

await socket.sendPresenceUpdate('recording', jid)

await socket.sendPresenceUpdate('paused', jid)`,
    tags: ['presence', 'typing', 'composing', 'recording'],
  },
]

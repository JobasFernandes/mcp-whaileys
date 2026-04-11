import type { CodeExample } from './index.js'

export const TEXT_EXAMPLES: CodeExample[] = [
  {
    id: 'send-text',
    title: 'Send Text Message',
    description: 'Send a plain text message to a JID.',
    code: `await socket.sendMessage(jid, {
  text: 'Hello, world!'
})`,
    tags: ['text', 'basic', 'sendMessage'],
  },
  {
    id: 'send-text-mentions',
    title: 'Send Text with Mentions',
    description: 'Send a text message mentioning specific users. Mentioned JIDs must appear in the text as @number.',
    code: `await socket.sendMessage(jid, {
  text: '@5511999999999 check this out!',
  mentions: ['5511999999999@s.whatsapp.net']
})`,
    tags: ['text', 'mentions', 'sendMessage'],
  },
  {
    id: 'send-text-link-preview',
    title: 'Send Text with Link Preview',
    description: 'Send a text with automatic link preview generation. Requires generateHighQualityLinkPreview in socket config.',
    code: `await socket.sendMessage(jid, {
  text: 'Check out https://example.com'
})`,
    tags: ['text', 'link', 'preview', 'sendMessage'],
  },
  {
    id: 'send-text-quoted',
    title: 'Send Reply (Quoted Message)',
    description: 'Send a text message as a reply to another message using MiscMessageGenerationOptions.',
    code: `await socket.sendMessage(jid, {
  text: 'This is a reply!'
}, {
  quoted: originalMessage
})`,
    tags: ['text', 'reply', 'quoted', 'sendMessage'],
  },
]

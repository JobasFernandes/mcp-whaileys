import type { CodeExample } from './index.js'

export const MEDIA_EXAMPLES: CodeExample[] = [
  {
    id: 'send-image',
    title: 'Send Image',
    description: 'Send an image with optional caption. Accepts Buffer or { url: string }.',
    code: `await socket.sendMessage(jid, {
  image: { url: './photo.jpg' },
  caption: 'Check this image!',
  viewOnce: false
})

await socket.sendMessage(jid, {
  image: imageBuffer,
  caption: 'From buffer'
})`,
    tags: ['media', 'image', 'caption', 'sendMessage'],
  },
  {
    id: 'send-video',
    title: 'Send Video',
    description: 'Send a video file with optional caption. Use gifPlayback for GIF-style autoplay.',
    code: `await socket.sendMessage(jid, {
  video: { url: './video.mp4' },
  caption: 'Watch this!',
  gifPlayback: false
})`,
    tags: ['media', 'video', 'caption', 'sendMessage'],
  },
  {
    id: 'send-audio-ptt',
    title: 'Send Voice Note (PTT)',
    description: 'Send a voice note (push-to-talk). MUST be OGG/Opus format. Use ffmpeg to convert: ffmpeg -i input.mp3 -vn -c:a libopus -b:a 128k output.ogg',
    code: `await socket.sendMessage(jid, {
  audio: audioBuffer,
  mimetype: 'audio/ogg; codecs=opus',
  ptt: true,
  seconds: 10,
  waveform: new Uint8Array(64)
})`,
    tags: ['media', 'audio', 'ptt', 'voice', 'opus', 'sendMessage'],
  },
  {
    id: 'send-document',
    title: 'Send Document',
    description: 'Send a document file (PDF, DOCX, etc) with MIME type and filename.',
    code: `await socket.sendMessage(jid, {
  document: { url: './report.pdf' },
  mimetype: 'application/pdf',
  fileName: 'report.pdf'
})`,
    tags: ['media', 'document', 'pdf', 'file', 'sendMessage'],
  },
  {
    id: 'send-sticker',
    title: 'Send Sticker',
    description: 'Send a sticker image. Must be WebP format, 512x512 pixels.',
    code: `await socket.sendMessage(jid, {
  sticker: { url: './sticker.webp' },
  isAnimated: false
})`,
    tags: ['media', 'sticker', 'webp', 'sendMessage'],
  },
  {
    id: 'send-location',
    title: 'Send Location',
    description: 'Send a geographic location with optional name and address.',
    code: `await socket.sendMessage(jid, {
  location: {
    degreesLatitude: -23.5505,
    degreesLongitude: -46.6333,
    name: 'São Paulo',
    address: 'São Paulo, SP, Brazil'
  }
})`,
    tags: ['media', 'location', 'gps', 'sendMessage'],
  },
  {
    id: 'send-vcard',
    title: 'Send Contact (vCard)',
    description: 'Send a contact card. The waid= parameter links to a WhatsApp account.',
    code: `const vcard = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:John Doe',
  'TEL;type=CELL;type=VOICE;waid=5511999999999:+5511999999999',
  'ORG:Company',
  'END:VCARD'
].join('\\n')

await socket.sendMessage(jid, {
  contacts: {
    displayName: 'John Doe',
    contacts: [{ vcard }]
  }
})`,
    tags: ['media', 'contact', 'vcard', 'sendMessage'],
  },
]

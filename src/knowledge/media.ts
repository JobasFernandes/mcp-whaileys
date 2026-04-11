export interface MediaTypeMapping {
  type: string
  hkdfKey: string
  path: string
  description: string
}

export const MEDIA_TYPES: MediaTypeMapping[] = [
  { type: 'audio', hkdfKey: 'Audio', path: '/mms/audio', description: 'Audio files and voice notes' },
  { type: 'document', hkdfKey: 'Document', path: '/mms/document', description: 'Documents (PDF, DOCX, etc)' },
  { type: 'gif', hkdfKey: 'Video', path: '', description: 'GIF animations (sent as video with gifPlayback)' },
  { type: 'image', hkdfKey: 'Image', path: '/mms/image', description: 'Image files' },
  { type: 'ppic', hkdfKey: '', path: '', description: 'Profile picture' },
  { type: 'product', hkdfKey: 'Image', path: '', description: 'Product catalog image' },
  { type: 'ptt', hkdfKey: 'Audio', path: '', description: 'Push-to-talk voice note (OGG/Opus)' },
  { type: 'sticker', hkdfKey: 'Image', path: '/mms/image', description: 'Sticker image (WebP)' },
  { type: 'video', hkdfKey: 'Video', path: '/mms/video', description: 'Video files' },
  { type: 'thumbnail-document', hkdfKey: 'Document Thumbnail', path: '', description: 'Document thumbnail' },
  { type: 'thumbnail-image', hkdfKey: 'Image Thumbnail', path: '', description: 'Image thumbnail' },
  { type: 'thumbnail-video', hkdfKey: 'Video Thumbnail', path: '', description: 'Video thumbnail' },
  { type: 'thumbnail-link', hkdfKey: 'Link Thumbnail', path: '/mms/image', description: 'Link preview thumbnail' },
  { type: 'md-msg-hist', hkdfKey: 'History', path: '', description: 'Multi-device message history' },
  { type: 'md-app-state', hkdfKey: 'App State', path: '', description: 'Multi-device app state sync' },
  { type: 'product-catalog-image', hkdfKey: '', path: '/product/image', description: 'Product catalog image upload' },
  { type: 'payment-bg-image', hkdfKey: 'Payment Background', path: '', description: 'Payment background image' },
]

export const UPLOAD_FLOW = {
  title: 'Media Upload Flow',
  steps: [
    '1. Prepare media: Buffer, { url: string }, or { stream: Readable }',
    '2. Call prepareWAMessageMedia(content, { upload: socket.waUploadToServer }) for advanced messages',
    '3. Or use socket.sendMessage(jid, { image/video/audio/etc: media }) which handles upload internally',
    '4. Internal flow: encryptedStream → upload to /mms/* endpoint → construct proto message with mediaKey + fileEncSha256 + url',
  ],
  notes: `For simple messages, sendMessage handles the entire upload flow.
For advanced messages (carousel, etc), use prepareWAMessageMedia first to get the uploaded media proto.

parseMediaInput utility (from production):
- Buffer → Buffer (passthrough)
- "data:" prefix → base64 decode
- "http://" or "https://" → { url: string }
- else → base64 decode`,
}

export const DOWNLOAD_FLOW = {
  title: 'Media Download Flow',
  steps: [
    '1. Extract media message from WAMessage (msg.message?.imageMessage, etc)',
    '2. Call downloadMediaMessage(msg, "image"|"video"|etc) or downloadContentFromMessage(mediaMsg, type)',
    '3. Internal flow: getMediaKeys from message → downloadEncryptedContent from URL → decrypt with HKDF-derived keys',
    '4. Returns: Buffer or Readable stream with decrypted media',
  ],
  notes: `Media URLs expire after some time. Use socket.updateMediaMessage(msg) to refresh expired media URLs.

Key functions:
- downloadMediaMessage(msg, type) — downloads and returns readable stream
- downloadContentFromMessage(msg, type) — lower level, returns decrypted content
- getAudioDuration(buffer) — get audio duration in seconds
- getAudioWaveform(buffer) — generate waveform Uint8Array for voice notes
- generateThumbnail(path, type) — generate thumbnail for image/video`,
}

export const AUDIO_REQUIREMENTS = {
  format: 'OGG/Opus',
  mimetype: 'audio/ogg; codecs=opus',
  description: 'Voice notes (PTT) MUST be in OGG/Opus format. Other audio formats require ffmpeg conversion.',
  conversionCommand: 'ffmpeg -i input.mp3 -vn -c:a libopus -b:a 128k output.ogg',
}

export const VCARD_FORMAT = {
  template: `BEGIN:VCARD
VERSION:3.0
FN:\${name}
TEL;type=CELL;type=VOICE;waid=\${number}:+\${number}
ORG:\${organization}
END:VCARD`,
  fields: [
    { name: 'FN', description: 'Full name (required)' },
    { name: 'TEL', description: 'Phone number with waid parameter (WhatsApp ID)' },
    { name: 'ORG', description: 'Organization (optional)' },
  ],
  notes: 'The waid= parameter in TEL is the WhatsApp ID (phone number without +). This enables WhatsApp to link the vCard to a WhatsApp account.',
}

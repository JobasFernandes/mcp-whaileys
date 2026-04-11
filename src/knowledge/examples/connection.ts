import type { CodeExample } from './index.js'

export const CONNECTION_EXAMPLES: CodeExample[] = [
  {
    id: 'basic-connection',
    title: 'Basic Connection with QR Code',
    description: 'Minimal setup to connect to WhatsApp with QR code authentication and credential persistence.',
    code: `import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const { version } = await fetchLatestBaileysVersion()

const socket = makeWASocket({
  version,
  auth: state,
  printQRInTerminal: true,
})

socket.ev.on('creds.update', saveCreds)

socket.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect, qr } = update

  if (connection === 'close') {
    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut

    if (shouldReconnect) {
      // reconnect
    }
  }

  if (connection === 'open') {
    console.log('Connected!')
  }
})`,
    tags: ['connection', 'qr', 'auth', 'basic', 'setup', 'multiFileAuth'],
  },
  {
    id: 'socket-factory',
    title: 'Production Socket Factory',
    description: 'Full makeWASocket configuration with all production-recommended settings: LRU caches, log suppression, JID filtering, and optimized timeouts.',
    code: `import makeWASocket, {
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  Browsers,
  isJidBroadcast,
  isJidNewsletter,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import { LRUCache } from 'lru-cache'

const logger = pino({ level: 'warn' }).child({ module: 'baileys' })
logger.level = 'warn'

const msgRetryCounterMap = new LRUCache<string, number>({
  max: 5000,
  ttl: 10 * 60 * 1000,
})

const messageCache = new LRUCache<string, any>({
  max: 10000,
  ttl: 5 * 60 * 1000,
})

const { version } = await fetchLatestBaileysVersion()
  .catch(() => ({ version: [2, 3000, 1015901307] as [number, number, number] }))

const socket = makeWASocket({
  version,
  logger,
  printQRInTerminal: false,
  auth: {
    creds,
    keys: makeCacheableSignalKeyStore(keys, logger),
  },
  generateHighQualityLinkPreview: true,
  linkPreviewImageThumbnailWidth: 192,
  browser: Browsers.ubuntu('Chrome'),
  defaultQueryTimeoutMs: 60000,
  markOnlineOnConnect: false,
  retryRequestDelayMs: 500,
  emitOwnEvents: true,
  fireInitQueries: true,
  connectTimeoutMs: 25000,
  msgRetryCounterMap: msgRetryCounterMap as any,
  shouldIgnoreJid: (jid) => isJidBroadcast(jid) || isJidNewsletter(jid),
  getMessage: async (key) => {
    const cached = messageCache.get(key.id!)
    return cached?.message || undefined
  },
})`,
    tags: ['connection', 'factory', 'production', 'config', 'lru', 'pino', 'shouldIgnoreJid'],
  },
  {
    id: 'reconnect-backoff',
    title: 'Reconnection with Exponential Backoff',
    description: 'Production reconnection strategy with exponential backoff, max retries, critical code detection, and QR retry limits.',
    code: `import { DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

const RECONNECT_DELAY = 3000
const MAX_RETRIES = 5
const MAX_QR_RETRIES = 3
let retries = 0
let qrRetries = 0

function connectToWhatsApp() {
  const socket = makeWASocket({ /* config */ })

  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      qrRetries++
      if (qrRetries >= MAX_QR_RETRIES) {
        console.error('Max QR retries reached, clearing auth state')
        await clearAuthState()
        socket.end(new Error('Max QR retries'))
        return
      }
    }

    if (connection === 'open') {
      retries = 0
      qrRetries = 0
      console.log('Connected successfully')
    }

    if (connection === 'close') {
      const error = lastDisconnect?.error as Boom
      const statusCode = error?.output?.statusCode

      const criticalCodes = [
        DisconnectReason.loggedOut,
        DisconnectReason.badSession,
        DisconnectReason.forbidden,
        DisconnectReason.multideviceMismatch,
      ]

      if (criticalCodes.includes(statusCode)) {
        console.error('Critical disconnect, clearing auth state')
        await clearAuthState()
        return
      }

      if (retries < MAX_RETRIES) {
        const delay = statusCode === DisconnectReason.restartRequired
          ? RECONNECT_DELAY * 5
          : RECONNECT_DELAY * Math.pow(2, retries)

        retries++
        console.log(\`Reconnecting in \${delay}ms (attempt \${retries}/\${MAX_RETRIES})\`)
        setTimeout(connectToWhatsApp, delay)
      }
    }
  })
}`,
    tags: ['connection', 'reconnect', 'backoff', 'retry', 'disconnect', 'critical'],
  },
  {
    id: 'auth-state-redis',
    title: 'Redis Auth State with Encryption',
    description: 'Production auth state pattern using Redis for storage and AES-256-GCM for encryption. Supports multi-tenant sessions.',
    code: `import {
  initAuthCreds,
  makeCacheableSignalKeyStore,
  proto,
  BufferJSON,
} from '@whiskeysockets/baileys'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const KEY_PREFIX = \`sessions:\${tenantId}:\${sessionId}\`

function encrypt(data: string, encKey: Buffer): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', encKey, iv)
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

function decrypt(encoded: string, encKey: Buffer): string {
  const buf = Buffer.from(encoded, 'base64')
  const iv = buf.subarray(0, 16)
  const authTag = buf.subarray(16, 32)
  const encrypted = buf.subarray(32)
  const decipher = createDecipheriv('aes-256-gcm', encKey, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted) + decipher.final('utf8')
}

async function useRedisAuthState(redis: any, encKey?: Buffer) {
  const readData = async (key: string) => {
    const raw = await redis.get(\`\${KEY_PREFIX}:\${key}\`)
    if (!raw) return null
    const decrypted = encKey ? decrypt(raw, encKey) : raw
    return JSON.parse(decrypted, BufferJSON.reviver)
  }

  const writeData = async (key: string, data: any) => {
    const serialized = JSON.stringify(data, BufferJSON.replacer)
    const value = encKey ? encrypt(serialized, encKey) : serialized
    await redis.set(\`\${KEY_PREFIX}:\${key}\`, value)
  }

  const existing = await readData('creds')
  const creds = existing || initAuthCreds()
  if (!existing) await writeData('creds', creds)

  const keys = {
    get: async (type: string, ids: string[]) => {
      const result: Record<string, any> = {}
      for (const id of ids) {
        const data = await readData(\`\${type}-\${id}\`)
        if (data) {
          result[id] = type === 'app-state-sync-key'
            ? proto.Message.AppStateSyncKeyData.fromObject(data)
            : data
        }
      }
      return result
    },
    set: async (data: Record<string, Record<string, any>>) => {
      for (const [category, entries] of Object.entries(data)) {
        for (const [id, value] of Object.entries(entries)) {
          if (value) {
            await writeData(\`\${category}-\${id}\`, value)
          } else {
            await redis.del(\`\${KEY_PREFIX}:\${category}-\${id}\`)
          }
        }
      }
    },
  }

  return {
    state: { creds, keys: makeCacheableSignalKeyStore(keys as any, logger) },
    saveCreds: () => writeData('creds', creds),
  }
}`,
    tags: ['connection', 'auth', 'redis', 'encryption', 'aes', 'multi-tenant', 'BufferJSON'],
  },
  {
    id: 'event-handling',
    title: 'Complete Event Handling Setup',
    description: 'Production event handling with all core events: messages, receipts, reactions, presence, and proper cleanup on disconnect.',
    code: `function bindEvents(socket: ReturnType<typeof makeWASocket>) {
  socket.ev.on('creds.update', saveCreds)

  socket.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (msg.key.fromMe) continue

      const contentType = Object.keys(msg.message || {})[0]
      const sender = msg.key.participant || msg.key.remoteJid
      const isGroup = msg.key.remoteJid?.endsWith('@g.us')

      console.log(\`[\${isGroup ? 'GROUP' : 'DM'}] \${sender}: \${contentType}\`)
    }
  })

  socket.ev.on('messages.update', (updates) => {
    for (const { key, update } of updates) {
      if (update.status) {
        const status = update.status >= 3 ? 'read' : update.status === 2 ? 'delivered' : 'sent'
        console.log(\`Message \${key.id} -> \${status}\`)
      }
    }
  })

  socket.ev.on('messages.reaction', (reactions) => {
    for (const { key, reaction } of reactions) {
      console.log(\`Reaction from \${reaction.key.participant}: \${reaction.text}\`)
    }
  })

  socket.ev.on('presence.update', ({ id, presences }) => {
    for (const [jid, presence] of Object.entries(presences)) {
      console.log(\`\${jid} is \${presence.lastKnownPresence}\`)
    }
  })

  socket.ev.on('call', async (calls) => {
    for (const call of calls) {
      if (call.status === 'offer') {
        await socket.rejectCall(call.id, call.from)
      }
    }
  })
}

const UNBIND_EVENTS = [
  'connection.update', 'creds.update', 'messaging-history.set',
  'chats.upsert', 'chats.update', 'chats.delete',
  'presence.update', 'contacts.upsert', 'contacts.update',
  'messages.upsert', 'messages.update', 'messages.delete',
  'messages.reaction', 'message-receipt.update',
  'groups.upsert', 'groups.update', 'group-participants.update',
  'blocklist.set', 'blocklist.update', 'call'
] as const

function unbindEvents(socket: ReturnType<typeof makeWASocket>) {
  for (const event of UNBIND_EVENTS) {
    socket.ev.removeAllListeners(event)
  }
}`,
    tags: ['connection', 'events', 'messages', 'reactions', 'presence', 'calls', 'unbind', 'cleanup'],
  },
]

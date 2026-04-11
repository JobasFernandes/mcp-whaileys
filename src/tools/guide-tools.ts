import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  SOCKET_METHODS,
  getMethodsByCategory,
  getMethodByName,
  searchMethods,
  type SocketMethodCategory,
} from '../knowledge/socket-methods.js'
import {
  CHAT_MODIFICATIONS,
  WA_PRESENCES,
  PRIVACY_SETTINGS,
} from '../knowledge/chat.js'
import {
  SOCKET_CONFIG_FIELDS,
  DISCONNECT_REASONS,
  CONNECTION_STATES,
  AUTH_STATE_PATTERN,
  RECONNECTION_PATTERN,
  SUPPRESSED_LOG_MESSAGES,
} from '../knowledge/connection.js'
import {
  MEDIA_TYPES,
  UPLOAD_FLOW,
  DOWNLOAD_FLOW,
  AUDIO_REQUIREMENTS,
  VCARD_FORMAT,
} from '../knowledge/media.js'
import {
  GROUP_METHODS,
  GROUP_METADATA_FIELDS,
  PARTICIPANT_ACTIONS,
  GROUP_PARTICIPANT_FIELDS,
} from '../knowledge/groups.js'
import {
  WA_CALL_UPDATE_TYPES,
  WA_CALL_EVENT_FIELDS,
  CALL_HANDLING_PATTERN,
} from '../knowledge/calls.js'
import {
  CONTENT_TYPE_DETECTION,
  CONTENT_TYPE_DETECTION_PATTERN,
  MESSAGE_RECEIPT_TYPES,
  DELIVERY_STATUS_CODES,
  MESSAGE_UPSERT_TYPES,
  MESSAGE_UPSERT_PATTERN,
  COMMON_STUB_TYPES,
  MEDIA_HKDF_KEY_MAPPING,
  MESSAGE_NORMALIZATION_CHAIN,
} from '../knowledge/mappings.js'

export function registerGuideTools(mcpServer: McpServer) {
  mcpServer.registerTool(
    'whaileys_socket_methods',
    {
      description:
        'Complete reference for all WASocket methods (65+ methods across 11 categories: messaging, groups, media, connection, presence, privacy, business, calls, profile, chat, history). Lists methods by category or shows detailed info for a specific method.',
      inputSchema: {
        category: z.enum(['messaging', 'groups', 'media', 'connection', 'presence', 'privacy', 'business', 'calls', 'profile', 'chat', 'history']).optional().describe('Filter by method category'),
        method: z.string().optional().describe('Specific method name (e.g., "sendMessage", "groupCreate", "chatModify")'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ category, method }) => {
      if (method) {
        const m = getMethodByName(method)
        if (!m) {
          const suggestions = searchMethods(method)
          let text = `❌ Method "${method}" not found.`
          if (suggestions.length > 0) {
            text += '\n\n**Did you mean:**\n' + suggestions.slice(0, 5).map((s) => `- \`${s.name}\` (${s.category})`).join('\n')
          }
          return { content: [{ type: 'text' as const, text }], isError: true }
        }

        let result = `# ⚡ Method: \`${m.name}\`\n\n`
        result += `**Category:** ${m.category}\n`
        result += `**Layer:** ${m.layer}\n`
        result += `**Description:** ${m.description}\n\n`
        result += `**Signature:**\n\`\`\`typescript\n${m.name}${m.signature}\n\`\`\`\n\n`

        if (m.notes) {
          result += `**Notes:**\n${m.notes}\n`
        }

        return { content: [{ type: 'text' as const, text: result }] }
      }

      const methods = category ? getMethodsByCategory(category as SocketMethodCategory) : SOCKET_METHODS

      let result = `# ⚡ WASocket Methods${category ? ` (${category})` : ''}\n\n`
      result += `**Total:** ${methods.length} methods\n\n`

      const categories: SocketMethodCategory[] = ['messaging', 'groups', 'media', 'connection', 'presence', 'privacy', 'business', 'calls', 'profile', 'chat', 'history']
      for (const cat of categories) {
        const catMethods = methods.filter((m) => m.category === cat)
        if (catMethods.length === 0) continue

        result += `## ${getCategoryEmoji(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${catMethods.length})\n\n`
        for (const m of catMethods) {
          result += `- **\`${m.name}\`** — ${m.description}\n`
          result += `  \`${m.name}${m.signature}\`\n\n`
        }
      }

      result += '> Use `whaileys_socket_methods({ method: "name" })` for detailed info on a specific method.\n'

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_chat',
    {
      description:
        'Complete reference for chat operations: ChatModification types (archive, pin, mute, clear, star, markRead, delete, labels, contacts), WAPresence values (composing, recording, etc), and privacy settings.',
      inputSchema: {
        topic: z.enum(['modifications', 'presence', 'privacy', 'labels', 'all']).optional().describe('Specific chat topic'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ topic }) => {
      const showAll = !topic || topic === 'all'
      let result = `# 💬 Chat Operations${topic && topic !== 'all' ? ` (${topic})` : ''}\n\n`

      if (showAll || topic === 'modifications') {
        result += '## 📝 ChatModification Types\n\n'
        result += `**Total:** ${CHAT_MODIFICATIONS.length} variants\n\n`
        result += '| Name | Type | Description |\n'
        result += '|------|------|-------------|\n'
        for (const mod of CHAT_MODIFICATIONS) {
          result += `| \`${mod.name}\` | \`${mod.type}\` | ${mod.description} |\n`
        }
        result += '\n'

        const withExamples = CHAT_MODIFICATIONS.filter((m) => m.example)
        if (withExamples.length > 0) {
          result += '### Examples\n\n'
          for (const mod of withExamples) {
            result += `**${mod.name}:**\n\`\`\`typescript\n${mod.example}\n\`\`\`\n\n`
          }
        }
      }

      if (showAll || topic === 'presence') {
        result += '## 👀 WAPresence Values\n\n'
        result += '| Value | Description |\n'
        result += '|-------|-------------|\n'
        for (const p of WA_PRESENCES) {
          result += `| \`${p.value}\` | ${p.description} |\n`
        }
        result += '\n'
        result += '**Usage:** `socket.sendPresenceUpdate(type, toJid?)`\n\n'
      }

      if (showAll || topic === 'privacy') {
        result += '## 🔒 Privacy Settings\n\n'
        result += '| Method | Value Type | Description |\n'
        result += '|--------|-----------|-------------|\n'
        for (const p of PRIVACY_SETTINGS) {
          result += `| \`${p.method}\` | \`${p.valueType}\` | ${p.description} |\n`
        }
        result += '\n'
      }

      if (showAll || topic === 'labels') {
        const labelMods = CHAT_MODIFICATIONS.filter((m) =>
          m.name.includes('Label') || m.name.includes('label'),
        )
        result += '## 🏷️ Label Operations\n\n'
        result += '| Name | Type | Description |\n'
        result += '|------|------|-------------|\n'
        for (const mod of labelMods) {
          result += `| \`${mod.name}\` | \`${mod.type}\` | ${mod.description} |\n`
        }
        result += '\n'
      }

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_connection',
    {
      description:
        'Complete reference for connection management: SocketConfig fields (30+ fields with defaults), ConnectionState, DisconnectReason codes, AuthenticationState pattern (Redis+AES-256-GCM), QR code flow, and reconnection strategy (exponential backoff).',
      inputSchema: {
        topic: z.enum(['config', 'states', 'auth', 'disconnect', 'reconnect', 'all']).optional().describe('Specific connection topic'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ topic }) => {
      const showAll = !topic || topic === 'all'
      let result = `# 🔌 Connection Reference${topic && topic !== 'all' ? ` (${topic})` : ''}\n\n`

      if (showAll || topic === 'config') {
        result += '## ⚙️ SocketConfig Fields\n\n'
        result += `**Total:** ${SOCKET_CONFIG_FIELDS.length} fields\n\n`
        result += '| Field | Type | Default | Description |\n'
        result += '|-------|------|---------|-------------|\n'
        for (const f of SOCKET_CONFIG_FIELDS) {
          result += `| \`${f.name}\` | \`${f.type}\` | \`${f.defaultValue}\` | ${f.description} |\n`
        }
        result += '\n'

        const withNotes = SOCKET_CONFIG_FIELDS.filter((f) => f.notes)
        if (withNotes.length > 0) {
          result += '### Field Notes\n\n'
          for (const f of withNotes) {
            result += `- **\`${f.name}\`**: ${f.notes}\n`
          }
          result += '\n'
        }

        result += '### Suppressed Log Messages\n\n'
        result += 'These log messages are commonly suppressed in production:\n\n'
        for (const msg of SUPPRESSED_LOG_MESSAGES) {
          result += `- \`"${msg}"\`\n`
        }
        result += '\n'
      }

      if (showAll || topic === 'states') {
        result += '## 🔄 Connection States\n\n'
        result += `**Type:** \`${CONNECTION_STATES.type}\` = \`${CONNECTION_STATES.definition}\`\n\n`
        result += '| Field | Type | Description |\n'
        result += '|-------|------|-------------|\n'
        for (const f of CONNECTION_STATES.fields) {
          result += `| \`${f.name}\` | \`${f.type}\` | ${f.description} |\n`
        }
        result += '\n'
      }

      if (showAll || topic === 'auth') {
        result += '## 🔑 Authentication State\n\n'
        result += `**Description:** ${AUTH_STATE_PATTERN.description}\n\n`
        result += `**Structure:**\n\`\`\`typescript\n${AUTH_STATE_PATTERN.definition}\n\`\`\`\n\n`
        result += `**Init Method:** \`${AUTH_STATE_PATTERN.initMethod}\`\n`
        result += `**Cacheable Keys:** \`${AUTH_STATE_PATTERN.cacheableKeys}\`\n\n`
        result += `**Production Pattern:**\n${AUTH_STATE_PATTERN.productionPattern}\n\n`
      }

      if (showAll || topic === 'disconnect') {
        result += '## ❌ Disconnect Reasons\n\n'
        result += `**Total:** ${DISCONNECT_REASONS.length} reasons\n\n`
        result += '| Name | Code | Should Reconnect | Description |\n'
        result += '|------|------|-----------------|-------------|\n'
        for (const r of DISCONNECT_REASONS) {
          result += `| \`${r.name}\` | ${r.code} | ${r.shouldReconnect ? '✅ Yes' : '❌ No'} | ${r.description} |\n`
        }
        result += '\n'

        const withNotes = DISCONNECT_REASONS.filter((r) => r.notes)
        if (withNotes.length > 0) {
          result += '### Critical Disconnect Handling\n\n'
          for (const r of withNotes) {
            result += `- **\`${r.name}\` (${r.code}):** ${r.notes}\n`
          }
          result += '\n'
        }
      }

      if (showAll || topic === 'reconnect') {
        result += '## 🔁 Reconnection Strategy\n\n'
        result += `**Strategy:** ${RECONNECTION_PATTERN.strategy}\n`
        result += `**Formula:** \`${RECONNECTION_PATTERN.formula}\`\n`
        result += `**Max Retries:** ${RECONNECTION_PATTERN.maxRetries}\n\n`
        result += `**Critical Codes (do NOT reconnect):** ${RECONNECTION_PATTERN.criticalCodes.join(', ')}\n`
        result += `**Critical Action:** ${RECONNECTION_PATTERN.criticalAction}\n\n`
        result += `**Non-Critical Action:** ${RECONNECTION_PATTERN.nonCriticalAction}\n`
        result += `**Restart Required (${RECONNECTION_PATTERN.restartRequiredCode}):** ${RECONNECTION_PATTERN.restartRequiredAction}\n\n`
        result += `**QR Retries:** max ${RECONNECTION_PATTERN.qrRetries.max}, on max reached: ${RECONNECTION_PATTERN.qrRetries.onMaxReached}\n`
      }

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_guides',
    {
      description:
        'Comprehensive guides for WhatsApp topics: media (upload/download flows, HKDF, audio requirements, vCard), groups (methods, metadata, participants, settings), calls (event handling, rejection), mappings (content type detection, receipt types, stub types, message normalization).',
      inputSchema: {
        topic: z.enum(['media', 'groups', 'calls', 'mappings']).describe('Guide topic'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ topic }) => {
      switch (topic) {
        case 'media': {
          let result = '# 🖼️ Media Handling Guide\n\n'

          result += '## Media Types\n\n'
          result += '| Type | HKDF Key | Upload Path | Description |\n'
          result += '|------|----------|-------------|-------------|\n'
          for (const m of MEDIA_TYPES) {
            result += `| \`${m.type}\` | \`${m.hkdfKey || '—'}\` | \`${m.path || '—'}\` | ${m.description} |\n`
          }
          result += '\n'

          result += `## ${UPLOAD_FLOW.title}\n\n`
          for (const step of UPLOAD_FLOW.steps) {
            result += `${step}\n`
          }
          result += `\n**Notes:**\n${UPLOAD_FLOW.notes}\n\n`

          result += `## ${DOWNLOAD_FLOW.title}\n\n`
          for (const step of DOWNLOAD_FLOW.steps) {
            result += `${step}\n`
          }
          result += `\n**Notes:**\n${DOWNLOAD_FLOW.notes}\n\n`

          result += '## Audio Requirements\n\n'
          result += `**Format:** ${AUDIO_REQUIREMENTS.format}\n`
          result += `**MIME Type:** \`${AUDIO_REQUIREMENTS.mimetype}\`\n`
          result += `**Description:** ${AUDIO_REQUIREMENTS.description}\n`
          result += `**Conversion:** \`${AUDIO_REQUIREMENTS.conversionCommand}\`\n\n`

          result += '## vCard Format\n\n'
          result += `\`\`\`\n${VCARD_FORMAT.template}\n\`\`\`\n\n`
          result += '**Fields:**\n'
          for (const f of VCARD_FORMAT.fields) {
            result += `- **${f.name}:** ${f.description}\n`
          }
          result += `\n**Notes:** ${VCARD_FORMAT.notes}\n`

          return { content: [{ type: 'text' as const, text: result }] }
        }

        case 'groups': {
          let result = '# 👥 Group Management Guide\n\n'

          result += '## Group Methods\n\n'
          result += `**Total:** ${GROUP_METHODS.length} methods\n\n`
          for (const m of GROUP_METHODS) {
            result += `### \`${m.name}\`\n`
            result += `\`\`\`typescript\n${m.name}${m.signature}\n\`\`\`\n`
            result += `${m.description}\n`
            if (m.notes) result += `\n*${m.notes}*\n`
            result += '\n'
          }

          result += `## ${GROUP_METADATA_FIELDS.interface}\n\n`
          result += '| Field | Type | Description |\n'
          result += '|-------|------|-------------|\n'
          for (const f of GROUP_METADATA_FIELDS.fields) {
            result += `| \`${f.name}\` | \`${f.type}\` | ${f.description} |\n`
          }
          result += '\n'

          result += '## Participant Actions\n\n'
          result += '| Action | Description |\n'
          result += '|--------|-------------|\n'
          for (const a of PARTICIPANT_ACTIONS) {
            result += `| \`${a.action}\` | ${a.description} |\n`
          }
          result += '\n'

          result += `## ${GROUP_PARTICIPANT_FIELDS.interface}\n\n`
          result += '| Field | Type | Description |\n'
          result += '|-------|------|-------------|\n'
          for (const f of GROUP_PARTICIPANT_FIELDS.fields) {
            result += `| \`${f.name}\` | \`${f.type}\` | ${f.description} |\n`
          }
          result += '\n'

          return { content: [{ type: 'text' as const, text: result }] }
        }

        case 'calls': {
          let result = '# 📞 Call Handling Guide\n\n'

          result += '## WACallUpdateType Values\n\n'
          result += '| Value | Description |\n'
          result += '|-------|-------------|\n'
          for (const t of WA_CALL_UPDATE_TYPES) {
            result += `| \`${t.value}\` | ${t.description} |\n`
          }
          result += '\n'

          result += '## WACallEvent Fields\n\n'
          result += '| Field | Type | Optional | Description |\n'
          result += '|-------|------|----------|-------------|\n'
          for (const f of WA_CALL_EVENT_FIELDS) {
            result += `| \`${f.name}\` | \`${f.type}\` | ${f.optional ? 'Yes' : 'No'} | ${f.description} |\n`
          }
          result += '\n'

          result += '## Call Handling Pattern\n\n'
          result += `**Event:** \`${CALL_HANDLING_PATTERN.eventName}\`\n`
          result += `**Payload:** \`${CALL_HANDLING_PATTERN.payloadType}\`\n`
          result += `**Reject Method:** \`${CALL_HANDLING_PATTERN.rejectMethod}\`\n\n`
          result += `**Production Pattern:**\n\`\`\`typescript\n${CALL_HANDLING_PATTERN.productionPattern}\n\`\`\`\n\n`
          result += `**Notes:**\n${CALL_HANDLING_PATTERN.notes}\n`

          return { content: [{ type: 'text' as const, text: result }] }
        }

        case 'mappings': {
          let result = '# 🗺️ Type Mappings Reference\n\n'

          result += '## Content Type Detection\n\n'
          result += `${CONTENT_TYPE_DETECTION.length} content types:\n\n`
          result += '| Check | Type | Description |\n'
          result += '|-------|------|-------------|\n'
          for (const c of CONTENT_TYPE_DETECTION) {
            result += `| \`${c.check}\` | \`${c.type}\` | ${c.description} |\n`
          }
          result += `\n**Detection Pattern:**\n\`\`\`typescript\n${CONTENT_TYPE_DETECTION_PATTERN}\n\`\`\`\n\n`

          result += '## Message Receipt Types\n\n'
          result += '| Value | Description |\n'
          result += '|-------|-------------|\n'
          for (const r of MESSAGE_RECEIPT_TYPES) {
            result += `| \`${r.value}\` | ${r.description} |\n`
          }
          result += '\n'

          result += `## ${DELIVERY_STATUS_CODES.description}\n\n`
          result += '| Code | Meaning | Description |\n'
          result += '|------|---------|-------------|\n'
          for (const c of DELIVERY_STATUS_CODES.codes) {
            result += `| ${c.code} | \`${c.meaning}\` | ${c.description} |\n`
          }
          result += `\n*${DELIVERY_STATUS_CODES.notes}*\n\n`

          result += '## Message Upsert Types\n\n'
          result += '| Value | Description |\n'
          result += '|-------|-------------|\n'
          for (const u of MESSAGE_UPSERT_TYPES) {
            result += `| \`${u.value}\` | ${u.description} |\n`
          }
          result += `\n**Production Pattern:**\n\`\`\`typescript\n${MESSAGE_UPSERT_PATTERN}\n\`\`\`\n\n`

          result += '## Common WAMessageStubType Values\n\n'
          result += `${COMMON_STUB_TYPES.length} common stub types:\n\n`
          result += '| Name | Value | Description |\n'
          result += '|------|-------|-------------|\n'
          for (const s of COMMON_STUB_TYPES) {
            result += `| \`${s.name}\` | ${s.value} | ${s.description} |\n`
          }
          result += '\n'

          result += `## ${MEDIA_HKDF_KEY_MAPPING.description}\n\n`
          result += '| Media Type | HKDF Key | Upload Path |\n'
          result += '|------------|----------|-------------|\n'
          for (const m of MEDIA_HKDF_KEY_MAPPING.mappings) {
            result += `| \`${m.mediaType}\` | \`${m.hkdfKey || '—'}\` | \`${m.uploadPath || '—'}\` |\n`
          }
          result += `\n*${MEDIA_HKDF_KEY_MAPPING.notes}*\n\n`

          result += `## ${MESSAGE_NORMALIZATION_CHAIN.description}\n\n`
          result += '| Step | Action | Code |\n'
          result += '|------|--------|------|\n'
          for (const s of MESSAGE_NORMALIZATION_CHAIN.steps) {
            result += `| ${s.step} | ${s.action} | \`${s.code}\` |\n`
          }
          result += `\n*${MESSAGE_NORMALIZATION_CHAIN.notes}*\n`

          return { content: [{ type: 'text' as const, text: result }] }
        }

        default:
          return {
            content: [{ type: 'text' as const, text: `❌ Unknown topic "${topic}". Available: media, groups, calls, mappings` }],
            isError: true,
          }
      }
    },
  )
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    messaging: '💬',
    groups: '👥',
    media: '🖼️',
    connection: '🔌',
    presence: '👀',
    privacy: '🔒',
    business: '🏢',
    calls: '📞',
    profile: '👤',
    chat: '💬',
    history: '📜',
  }
  return emojis[category] || '📦'
}

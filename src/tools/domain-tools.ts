import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  MESSAGE_TYPES,
  MIXIN_TYPES,
  getMessageByName,
  getMessagesByCategory,
  searchMessages,
  type MessageCategory,
} from '../knowledge/messages.js'
import {
  INTERACTIVE_TYPES,
  getInteractiveByName,
} from '../knowledge/interactive.js'
import {
  JID_REFERENCE,
  getJidTopic,
} from '../knowledge/jid.js'
import {
  EVENTS,
  UNBIND_EVENTS,
  getEventByName,
  getEventsByCategory,
  searchEvents,
  type EventCategory,
} from '../knowledge/events.js'

export function registerDomainTools(mcpServer: McpServer) {
  mcpServer.registerTool(
    'whaileys_messages',
    {
      description:
        'Complete reference for all WhatsApp message content types (text, image, video, audio, buttons, lists, poll, etc). Lists types by category or shows detailed info for a specific type.',
      inputSchema: {
        type: z.string().optional().describe('Specific message type name (e.g., "buttons", "poll", "image", "carousel")'),
        category: z.enum(['basic', 'media', 'interactive', 'system', 'advanced']).optional().describe('Filter by category'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ type, category }) => {
      if (type) {
        const msg = getMessageByName(type)
        if (!msg) {
          const suggestions = searchMessages(type)
          let text = `❌ Message type "${type}" not found.`
          if (suggestions.length > 0) {
            text += '\n\n**Did you mean:**\n' + suggestions.slice(0, 5).map((s) => `- \`${s.name}\` (${s.category})`).join('\n')
          }
          return { content: [{ type: 'text' as const, text }], isError: true }
        }

        let result = `# 📨 Message Type: \`${msg.name}\`\n\n`
        result += `**Category:** ${msg.category}\n`
        result += `**Description:** ${msg.description}\n\n`
        result += `**Content Type:**\n\`\`\`typescript\n${msg.contentType}\n\`\`\`\n\n`

        if (msg.protoField) {
          result += `**Proto Field:** \`proto.Message.${msg.protoField}\`\n\n`
        }

        if (msg.mixins.length > 0) {
          result += '**Mixins:**\n'
          for (const mixin of msg.mixins) {
            const def = MIXIN_TYPES[mixin]
            result += `- \`${mixin}\` → \`${def || 'unknown'}\`\n`
          }
          result += '\n'
        }

        if (msg.supports.length > 0) {
          result += `**Supports:** ${msg.supports.map((s) => `\`${s}\``).join(', ')}\n\n`
        }

        if (msg.notes) {
          result += `**Notes:**\n${msg.notes}\n`
        }

        return { content: [{ type: 'text' as const, text: result }] }
      }

      const messages = category ? getMessagesByCategory(category as MessageCategory) : MESSAGE_TYPES

      let result = `# 📨 WhatsApp Message Types${category ? ` (${category})` : ''}\n\n`
      result += `**Total:** ${messages.length} types\n\n`

      const categories = ['basic', 'media', 'interactive', 'advanced'] as MessageCategory[]
      for (const cat of categories) {
        const catMessages = messages.filter((m) => m.category === cat)
        if (catMessages.length === 0) continue

        result += `## ${getCategoryEmoji(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${catMessages.length})\n\n`
        for (const msg of catMessages) {
          result += `- **\`${msg.name}\`** — ${msg.description}\n`
          if (msg.protoField) result += `  Proto: \`${msg.protoField}\` | `
          if (msg.mixins.length > 0) result += `Mixins: ${msg.mixins.join(', ')}`
          result += '\n'
        }
        result += '\n'
      }

      result += '> Use `whaileys_messages({ type: "name" })` for detailed info on a specific type.\n'

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_interactive',
    {
      description:
        'Detailed reference for WhatsApp interactive message types: buttons, lists, templates, carousel, native flow. Shows proto structures and production-tested sending patterns.',
      inputSchema: {
        type: z.enum(['buttons', 'list', 'template', 'carousel', 'native_flow']).optional().describe('Specific interactive type'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ type }) => {
      if (type) {
        const interactive = getInteractiveByName(type)
        if (!interactive) {
          return {
            content: [{ type: 'text' as const, text: `❌ Interactive type "${type}" not found. Available: ${INTERACTIVE_TYPES.map((t) => t.name).join(', ')}` }],
            isError: true,
          }
        }

        let result = `# 🎛️ Interactive: \`${interactive.name}\`\n\n`
        result += `**Proto:** \`${interactive.protoName}\`\n`
        if (interactive.mixin) result += `**Mixin:** \`${interactive.mixin}\`\n`
        result += `**Sending Pattern:** \`${interactive.sendingPattern}\`\n`
        result += `**Description:** ${interactive.description}\n\n`

        result += `## Structure\n\n\`\`\`typescript\n${interactive.structure}\n\`\`\`\n\n`

        if (interactive.headerTypes) {
          result += `**Header Types:** ${interactive.headerTypes.map((h) => `\`${h}\``).join(', ')}\n\n`
        }

        result += `## Notes\n\n${interactive.notes}\n`

        return { content: [{ type: 'text' as const, text: result }] }
      }

      let result = '# 🎛️ WhatsApp Interactive Message Types\n\n'
      result += `**Total:** ${INTERACTIVE_TYPES.length} types\n\n`

      for (const interactive of INTERACTIVE_TYPES) {
        result += `### \`${interactive.name}\`\n`
        result += `- **Proto:** \`${interactive.protoName}\`\n`
        if (interactive.mixin) result += `- **Mixin:** \`${interactive.mixin}\`\n`
        result += `- **Pattern:** \`${interactive.sendingPattern}\`\n`
        result += `- ${interactive.description}\n\n`
      }

      result += '> Use `whaileys_interactive({ type: "name" })` for full structure and production patterns.\n'

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_jid',
    {
      description:
        'Complete reference for WhatsApp JID/LID formats, utility functions, special JIDs, and LID migration. Covers all identifier types used in WhatsApp.',
      inputSchema: {
        topic: z.enum(['formats', 'utilities', 'special', 'lid', 'all']).optional().describe('Specific JID topic'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ topic }) => {
      const data = topic && topic !== 'all' ? getJidTopic(topic) : JID_REFERENCE

      let result = `# 🆔 WhatsApp JID Reference${topic && topic !== 'all' ? ` (${topic})` : ''}\n\n`

      if (data.servers && data.servers.length > 0) {
        result += '## JID Formats\n\n'
        result += '| Suffix | Description | Example |\n'
        result += '|--------|-------------|--------|\n'
        for (const s of data.servers) {
          result += `| \`${s.suffix}\` | ${s.description} | \`${s.example}\` |\n`
        }
        result += '\n'
      }

      if (data.types && data.types.length > 0) {
        result += '## Types\n\n'
        for (const t of data.types) {
          result += `### \`${t.name}\`\n`
          result += `\`\`\`typescript\ntype ${t.name} = ${t.definition}\n\`\`\`\n`
          result += `${t.description}\n\n`
        }
      }

      if (data.utilities && data.utilities.length > 0) {
        result += '## Utility Functions\n\n'
        for (const u of data.utilities) {
          result += `### \`${u.name}\`\n`
          result += `\`\`\`typescript\n${u.name}${u.signature}\n\`\`\`\n`
          result += `${u.description}\n\n`
        }
      }

      if (data.specialJids && data.specialJids.length > 0) {
        result += '## Special JIDs\n\n'
        result += '| Constant | Value | Description |\n'
        result += '|----------|-------|-------------|\n'
        for (const j of data.specialJids) {
          result += `| \`${j.name}\` | \`${j.value}\` | ${j.description} |\n`
        }
        result += '\n'
      }

      if (data.lidMigration && data.lidMigration.length > 0) {
        result += '## LID Migration\n\n'
        result += 'WAMessageKey extensions for LID (Local ID) support:\n\n'
        result += '| Field | Type | Description |\n'
        result += '|-------|------|-------------|\n'
        for (const l of data.lidMigration) {
          result += `| \`${l.field}\` | \`${l.type}\` | ${l.description} |\n`
        }
        result += '\n'
      }

      if (data.productionPatterns && data.productionPatterns.length > 0) {
        result += '## Production Patterns\n\n'
        for (const p of data.productionPatterns) {
          result += `- **\`${p.pattern}\`**\n  ${p.description}\n\n`
        }
      }

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_events',
    {
      description:
        'Complete reference for all WhatsApp/Baileys events (BaileysEventMap). Lists all 24+ events with payload types, descriptions, and production patterns.',
      inputSchema: {
        event: z.string().optional().describe('Specific event name (e.g., "messages.upsert", "connection.update")'),
        category: z.enum(['connection', 'messaging', 'groups', 'contacts', 'presence', 'calls', 'labels', 'blocklist']).optional().describe('Filter by category'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ event, category }) => {
      if (event) {
        const ev = getEventByName(event)
        if (!ev) {
          const suggestions = searchEvents(event)
          let text = `❌ Event "${event}" not found.`
          if (suggestions.length > 0) {
            text += '\n\n**Did you mean:**\n' + suggestions.slice(0, 5).map((e) => `- \`${e.name}\` (${e.category})`).join('\n')
          }
          return { content: [{ type: 'text' as const, text }], isError: true }
        }

        let result = `# 📡 Event: \`${ev.name}\`\n\n`
        result += `**Category:** ${ev.category}\n`
        result += `**Description:** ${ev.description}\n\n`
        result += `**Payload Type:**\n\`\`\`typescript\n${ev.payloadType}\n\`\`\`\n\n`

        if (ev.notes) {
          result += `**Notes & Production Patterns:**\n${ev.notes}\n`
        }

        return { content: [{ type: 'text' as const, text: result }] }
      }

      const events = category ? getEventsByCategory(category as EventCategory) : EVENTS

      let result = `# 📡 Baileys Events${category ? ` (${category})` : ''}\n\n`
      result += `**Total:** ${events.length} events\n\n`

      const categories: EventCategory[] = ['connection', 'messaging', 'groups', 'contacts', 'presence', 'calls', 'labels', 'blocklist']
      for (const cat of categories) {
        const catEvents = events.filter((e) => e.category === cat)
        if (catEvents.length === 0) continue

        result += `## ${getCategoryEmoji(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${catEvents.length})\n\n`
        for (const ev of catEvents) {
          result += `- **\`${ev.name}\`** → \`${ev.payloadType}\`\n`
          result += `  ${ev.description}\n\n`
        }
      }

      if (!category) {
        result += '## 🔌 Events to Unbind on Disconnect\n\n'
        result += 'These 20 events MUST be unbound when disconnecting to prevent memory leaks:\n\n'
        result += `\`\`\`typescript\n${UNBIND_EVENTS.join(', ')}\n\`\`\`\n\n`
      }

      result += '> Use `whaileys_events({ event: "name" })` for detailed info on a specific event.\n'

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    basic: '📝',
    media: '🖼️',
    interactive: '🎛️',
    system: '⚙️',
    advanced: '🚀',
    connection: '🔌',
    messaging: '💬',
    groups: '👥',
    contacts: '📇',
    presence: '👀',
    calls: '📞',
    labels: '🏷️',
    blocklist: '🚫',
  }
  return emojis[category] || '📦'
}

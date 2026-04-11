import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ProtoParser, type ProtoCategory } from '../proto-parser.js'

export function registerProtoTools(mcpServer: McpServer, srcPath: string) {
  const parser = new ProtoParser(srcPath)

  mcpServer.registerTool(
    'whaileys_proto',
    {
      description:
        'List and search WAProto message fields from proto.Message. Shows all 80+ message type fields categorized by type (text, media, interactive, system, payment, group, poll, contact, location, reaction, call, status, newsletter). Parsed directly from WAProto/index.d.ts.',
      inputSchema: {
        category: z.enum(['text', 'media', 'interactive', 'system', 'payment', 'group', 'poll', 'contact', 'location', 'reaction', 'call', 'status', 'newsletter', 'other']).optional().describe('Filter by message category'),
        search: z.string().optional().describe('Search proto type names (e.g., "poll", "buttons", "interactive")'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ category, search }) => {
      if (!parser.isAvailable()) {
        return {
          content: [{ type: 'text' as const, text: '❌ WAProto/index.d.ts not found. Run `whaileys_update` to ensure the repository is up to date.' }],
          isError: true,
        }
      }

      try {
        if (search) {
          const results = parser.searchMessageTypes(search)
          if (results.length === 0) {
            return {
              content: [{ type: 'text' as const, text: `❌ No proto types found matching "${search}".` }],
              isError: true,
            }
          }

          let result = `# 🔍 Proto Search: "${search}"\n\n`
          result += `**Found:** ${results.length} types\n\n`
          for (const t of results) {
            result += `- **\`${t.name}\`** (${t.category}) — ${t.fields.length} fields`
            if (t.enums.length > 0) result += `, ${t.enums.length} enums`
            if (t.nestedTypes.length > 0) result += `, ${t.nestedTypes.length} nested types`
            result += '\n'
          }
          result += '\n> Use `whaileys_proto_type({ name: "TypeName" })` for full details.\n'

          return { content: [{ type: 'text' as const, text: result }] }
        }

        const fields = category
          ? parser.getMessageTypesByCategory(category as ProtoCategory)
          : parser.getMessageFields()

        let result = `# 📦 WAProto Message Fields${category ? ` (${category})` : ''}\n\n`
        result += `**Total:** ${fields.length} fields\n\n`

        const categories = new Map<string, typeof fields>()
        for (const f of fields) {
          const cat = f.category
          if (!categories.has(cat)) categories.set(cat, [])
          categories.get(cat)!.push(f)
        }

        for (const [cat, catFields] of categories) {
          result += `## ${getCategoryEmoji(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${catFields.length})\n\n`
          result += '| Field | Interface Type |\n'
          result += '|-------|---------------|\n'
          for (const f of catFields) {
            result += `| \`${f.name}\` | \`${f.interfaceType}\` |\n`
          }
          result += '\n'
        }

        result += '> Use `whaileys_proto_type({ name: "ButtonsMessage" })` for full type details.\n'

        return { content: [{ type: 'text' as const, text: result }] }
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `❌ Error parsing WAProto: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        }
      }
    },
  )

  mcpServer.registerTool(
    'whaileys_proto_type',
    {
      description:
        'Get the full definition of a specific WAProto message type. Shows all fields, enums, nested types, and oneof groups. Use for types like ButtonsMessage, ListMessage, InteractiveMessage, ImageMessage, etc.',
      inputSchema: {
        name: z.string().describe('Proto message type name (e.g., "ButtonsMessage", "ListMessage", "InteractiveMessage")'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ name }) => {
      if (!parser.isAvailable()) {
        return {
          content: [{ type: 'text' as const, text: '❌ WAProto/index.d.ts not found. Run `whaileys_update` to ensure the repository is up to date.' }],
          isError: true,
        }
      }

      try {
        const msgType = parser.getMessageType(name)
        if (!msgType) {
          const allTypes = parser.getAllMessageTypes()
          const suggestions = allTypes
            .filter((t) => t.name.toLowerCase().includes(name.toLowerCase()))
            .slice(0, 5)

          let text = `❌ Proto type "${name}" not found in proto.Message namespace.`
          if (suggestions.length > 0) {
            text += '\n\n**Did you mean:**\n' + suggestions.map((s) => `- \`${s.name}\``).join('\n')
          }
          return { content: [{ type: 'text' as const, text }], isError: true }
        }

        let result = `# 📦 Proto: \`${msgType.fullName}\`\n\n`
        result += `**Category:** ${msgType.category}\n\n`

        if (msgType.fields.length > 0) {
          result += `## Fields (${msgType.fields.length})\n\n`
          result += '| Field | Type | Optional | Repeated |\n'
          result += '|-------|------|----------|----------|\n'
          for (const f of msgType.fields) {
            result += `| \`${f.name}\` | \`${f.type}\` | ${f.optional ? 'Yes' : 'No'} | ${f.repeated ? 'Yes' : 'No'} |\n`
          }
          result += '\n'
        }

        if (msgType.oneofGroups.length > 0) {
          result += `## Oneof Groups (${msgType.oneofGroups.length})\n\n`
          for (const g of msgType.oneofGroups) {
            result += `### \`${g.name}\`\n`
            result += `Options: ${g.options.map((o) => `\`${o}\``).join(' | ')}\n\n`
          }
        }

        if (msgType.enums.length > 0) {
          result += `## Enums (${msgType.enums.length})\n\n`
          for (const e of msgType.enums) {
            result += `### \`${e.name}\`\n\n`
            result += '| Name | Value |\n'
            result += '|------|-------|\n'
            for (const v of e.values) {
              result += `| \`${v.name}\` | ${v.value} |\n`
            }
            result += '\n'
          }
        }

        if (msgType.nestedTypes.length > 0) {
          result += `## Nested Types (${msgType.nestedTypes.length})\n\n`
          for (const nt of msgType.nestedTypes) {
            result += `### \`${nt.name}\`\n\n`
            if (nt.fields.length > 0) {
              result += '| Field | Type | Optional | Repeated |\n'
              result += '|-------|------|----------|----------|\n'
              for (const f of nt.fields) {
                result += `| \`${f.name}\` | \`${f.type}\` | ${f.optional ? 'Yes' : 'No'} | ${f.repeated ? 'Yes' : 'No'} |\n`
              }
              result += '\n'
            }
            if (nt.enums.length > 0) {
              for (const e of nt.enums) {
                result += `**Enum \`${e.name}\`:** ${e.values.map((v) => `\`${v.name}=${v.value}\``).join(', ')}\n\n`
              }
            }
          }
        }

        return { content: [{ type: 'text' as const, text: result }] }
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `❌ Error parsing WAProto: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        }
      }
    },
  )
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    text: '📝',
    media: '🖼️',
    interactive: '🎛️',
    system: '⚙️',
    payment: '💰',
    group: '👥',
    poll: '📊',
    contact: '📇',
    location: '📍',
    reaction: '😀',
    call: '📞',
    status: '📱',
    newsletter: '📰',
    other: '📦',
  }
  return emojis[category] || '📦'
}

import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  ALL_EXAMPLES,
  getExampleById,
  getExamplesByTag,
  searchExamples,
} from '../knowledge/examples/index.js'

export function registerExampleTools(mcpServer: McpServer) {
  mcpServer.registerTool(
    'whaileys_examples',
    {
      description:
        'Search and retrieve production-ready code examples for Baileys/Whaileys. 36 examples covering: text, media, interactive (buttons, lists, carousel), advanced (polls, reactions, edit, delete), groups, and connection (auth, reconnect, Redis, events). Use search to find by keyword or id to get a specific example.',
      inputSchema: {
        search: z.string().optional().describe('Search examples by keyword (e.g., "carousel", "poll", "reconnect", "redis", "buttons")'),
        id: z.string().optional().describe('Get specific example by ID (e.g., "send-carousel", "reconnect-backoff", "auth-state-redis")'),
        tag: z.string().optional().describe('Filter by tag (e.g., "interactive", "connection", "group", "media", "sendMessage")'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ search, id, tag }) => {
      if (id) {
        const example = getExampleById(id)
        if (!example) {
          const suggestions = ALL_EXAMPLES
            .filter((e) => e.id.includes(id.toLowerCase()))
            .slice(0, 5)

          let text = `❌ Example "${id}" not found.`
          if (suggestions.length > 0) {
            text += '\n\n**Did you mean:**\n' + suggestions.map((s) => `- \`${s.id}\` — ${s.title}`).join('\n')
          } else {
            text += '\n\n**Available IDs:**\n' + ALL_EXAMPLES.map((e) => `- \`${e.id}\``).join('\n')
          }
          return { content: [{ type: 'text' as const, text }], isError: true }
        }

        return { content: [{ type: 'text' as const, text: formatExample(example) }] }
      }

      if (search) {
        const results = searchExamples(search)
        if (results.length === 0) {
          return {
            content: [{ type: 'text' as const, text: `❌ No examples found matching "${search}".` }],
            isError: true,
          }
        }

        if (results.length === 1) {
          return { content: [{ type: 'text' as const, text: formatExample(results[0]) }] }
        }

        let text = `# 🔍 Examples matching "${search}"\n\n`
        text += `**Found:** ${results.length} examples\n\n`
        for (const ex of results) {
          text += `### \`${ex.id}\` — ${ex.title}\n`
          text += `${ex.description}\n`
          text += `Tags: ${ex.tags.map((t) => `\`${t}\``).join(', ')}\n\n`
        }
        text += '> Use `whaileys_examples({ id: "example-id" })` to get the full code.\n'

        return { content: [{ type: 'text' as const, text }] }
      }

      if (tag) {
        const results = getExamplesByTag(tag)
        if (results.length === 0) {
          const allTags = [...new Set(ALL_EXAMPLES.flatMap((e) => e.tags))].sort()
          return {
            content: [{
              type: 'text' as const,
              text: `❌ No examples found with tag "${tag}".\n\n**Available tags:**\n${allTags.map((t) => `\`${t}\``).join(', ')}`,
            }],
            isError: true,
          }
        }

        let text = `# 🏷️ Examples tagged "${tag}"\n\n`
        text += `**Found:** ${results.length} examples\n\n`
        for (const ex of results) {
          text += `### \`${ex.id}\` — ${ex.title}\n`
          text += `${ex.description}\n\n`
        }
        text += '> Use `whaileys_examples({ id: "example-id" })` to get the full code.\n'

        return { content: [{ type: 'text' as const, text }] }
      }

      const categories = new Map<string, typeof ALL_EXAMPLES>()
      for (const ex of ALL_EXAMPLES) {
        const cat = getCategoryFromTags(ex.tags)
        if (!categories.has(cat)) categories.set(cat, [])
        categories.get(cat)!.push(ex)
      }

      let text = `# 📚 Code Examples (${ALL_EXAMPLES.length} total)\n\n`

      const categoryEmojis: Record<string, string> = {
        text: '📝',
        media: '🖼️',
        interactive: '🎛️',
        advanced: '⚡',
        group: '👥',
        connection: '🔌',
        other: '📦',
      }

      for (const [cat, examples] of categories) {
        text += `## ${categoryEmojis[cat] || '📦'} ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${examples.length})\n\n`
        text += '| ID | Title | Tags |\n'
        text += '|----|-------|------|\n'
        for (const ex of examples) {
          text += `| \`${ex.id}\` | ${ex.title} | ${ex.tags.slice(0, 3).map((t) => `\`${t}\``).join(', ')} |\n`
        }
        text += '\n'
      }

      text += '> Use `whaileys_examples({ id: "example-id" })` for full code.\n'
      text += '> Use `whaileys_examples({ search: "keyword" })` to search.\n'

      return { content: [{ type: 'text' as const, text }] }
    },
  )
}

function formatExample(example: { id: string; title: string; description: string; code: string; tags: string[] }): string {
  let text = `# 📄 ${example.title}\n\n`
  text += `**ID:** \`${example.id}\`\n`
  text += `**Description:** ${example.description}\n`
  text += `**Tags:** ${example.tags.map((t) => `\`${t}\``).join(', ')}\n\n`
  text += '```typescript\n' + example.code + '\n```\n'
  return text
}

function getCategoryFromTags(tags: string[]): string {
  const priority = ['connection', 'group', 'interactive', 'media', 'advanced']
  for (const cat of priority) {
    if (tags.includes(cat)) return cat
  }
  if (tags.some((t) => ['text', 'mentions', 'link', 'quoted'].includes(t))) return 'text'
  return 'other'
}

export interface CodeExample {
  id: string
  title: string
  description: string
  code: string
  tags: string[]
}

import { TEXT_EXAMPLES } from './text.js'
import { MEDIA_EXAMPLES } from './media.js'
import { INTERACTIVE_EXAMPLES } from './interactive.js'
import { ADVANCED_EXAMPLES } from './advanced.js'
import { GROUP_EXAMPLES } from './groups.js'
import { CONNECTION_EXAMPLES } from './connection.js'

export const ALL_EXAMPLES: CodeExample[] = [
  ...TEXT_EXAMPLES,
  ...MEDIA_EXAMPLES,
  ...INTERACTIVE_EXAMPLES,
  ...ADVANCED_EXAMPLES,
  ...GROUP_EXAMPLES,
  ...CONNECTION_EXAMPLES,
]

export function getExampleById(id: string): CodeExample | undefined {
  return ALL_EXAMPLES.find((e) => e.id === id)
}

export function getExamplesByTag(tag: string): CodeExample[] {
  const t = tag.toLowerCase()
  return ALL_EXAMPLES.filter((e) =>
    e.tags.some((et) => et.toLowerCase().includes(t)),
  )
}

export function searchExamples(query: string): CodeExample[] {
  const q = query.toLowerCase()
  return ALL_EXAMPLES.filter((e) =>
    e.id.toLowerCase().includes(q) ||
    e.title.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.tags.some((t) => t.toLowerCase().includes(q)),
  )
}

export { TEXT_EXAMPLES } from './text.js'
export { MEDIA_EXAMPLES } from './media.js'
export { INTERACTIVE_EXAMPLES } from './interactive.js'
export { ADVANCED_EXAMPLES } from './advanced.js'
export { GROUP_EXAMPLES } from './groups.js'
export { CONNECTION_EXAMPLES } from './connection.js'

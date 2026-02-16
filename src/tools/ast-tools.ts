import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { AstParser, ExtractedType, ExtractedKind } from '../ast-parser.js'
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '../constants.js'
import { formatExtractedType, formatStatistics, formatDependencies } from '../formatters.js'

export function registerAstTools(mcpServer: McpServer, srcPath: string) {
  mcpServer.registerTool(
    'whaileys_extrair_tipos',
    {
      description:
        'Extrai interfaces, types, enums, funções, classes, variáveis e namespaces exportados usando análise de AST. Economiza tokens mostrando apenas assinaturas.',
      inputSchema: {
        modulo: z
          .string()
          .optional()
          .describe('Nome do módulo para extrair tipos (ex: Types, Socket, Utils). Deixe vazio para todos.'),
        apenas_kind: z
          .enum(['interface', 'type', 'enum', 'function', 'class', 'variable', 'namespace', 're-export'])
          .optional()
          .describe('Filtrar por tipo específico de declaração.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ modulo, apenas_kind }) => {
      const parser = new AstParser(srcPath)
      let types: ExtractedType[]

      if (modulo) {
        types = parser.getTypesFromModule(modulo)
      } else {
        types = parser.extractAllTypes()
      }

      if (apenas_kind) {
        types = types.filter((t) => t.kind === apenas_kind)
      }

      const grouped: Record<string, ExtractedType[]> = {}
      for (const type of types) {
        if (!grouped[type.module]) grouped[type.module] = []
        grouped[type.module].push(type)
      }

      let result = `# 📚 Tipos Exportados${modulo ? ` (${modulo})` : ''}${apenas_kind ? ` - ${CATEGORY_LABELS[apenas_kind]}` : ''}\n\n`
      result += `**Total:** ${types.length} declarações\n\n`

      for (const [mod, moduleTypes] of Object.entries(grouped)) {
        result += `## 📁 ${mod}\n\n`
        for (const type of moduleTypes) {
          result += formatExtractedType(type, false)
        }
      }

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_buscar_tipo',
    {
      description:
        'Busca a definição de um tipo específico pelo nome. Retorna assinatura completa, propriedades, métodos e documentação.',
      inputSchema: {
        nome: z.string().describe('Nome do tipo a buscar (ex: WAMessage, AuthenticationState, WASocket)'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ nome }) => {
      const parser = new AstParser(srcPath)
      const found = parser.searchType(nome)

      if (!found) {
        const fuzzyResults = parser.fuzzySearch(nome, 5)
        let suggestion = ''
        if (fuzzyResults.length > 0) {
          suggestion = '\n\n**Você quis dizer:**\n' + fuzzyResults.map((t) => `- \`${t.name}\` (${t.kind})`).join('\n')
        }
        return {
          content: [{ type: 'text' as const, text: `❌ Tipo "${nome}" não encontrado.${suggestion}` }],
          isError: true,
        }
      }

      return { content: [{ type: 'text' as const, text: formatExtractedType(found, true) }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_buscar_fuzzy',
    {
      description: 'Busca tipos usando correspondência aproximada. Útil quando não sabe o nome exato.',
      inputSchema: {
        query: z.string().describe('Termo de busca (ex: "message send", "auth state", "socket config")'),
        limite: z.number().optional().describe('Número máximo de resultados (default: 20)'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query, limite }) => {
      const parser = new AstParser(srcPath)
      const rankedResults = parser.searchByContext(query, limite || 20)
      const results = rankedResults.map((entry) => entry.type)

      if (results.length === 0) {
        return {
          content: [{ type: 'text' as const, text: `❌ Nenhum resultado encontrado para "${query}"` }],
          isError: true,
        }
      }

      let result = `# 🔍 Resultados para "${query}"\n\n`
      result += `**Encontrados:** ${results.length} tipos\n\n`

      for (let index = 0; index < results.length; index++) {
        const type = results[index]
        const ranking = rankedResults[index]
        result += `- ${CATEGORY_EMOJI[type.kind]} **\`${type.name}\`** (${type.kind}) - \`${type.file}\`\n`
        result += `  - score: ${ranking.score}`
        if (ranking.matchedIn.length > 0) {
          result += ` | match: ${ranking.matchedIn.join(', ')}`
        }
        result += '\n'
        if (type.docs) result += `  > ${type.docs.substring(0, 100)}...\n`
      }

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_listar_exports',
    {
      description: 'Lista todos os exports públicos da biblioteca, agrupados por módulo e categoria.',
      annotations: { readOnlyHint: true },
    },
    async () => {
      const parser = new AstParser(srcPath)
      const types = parser.extractAllTypes()

      const byModule: Record<string, Record<ExtractedKind, string[]>> = {}

      for (const type of types) {
        if (!byModule[type.module]) {
          byModule[type.module] = {} as Record<ExtractedKind, string[]>
        }
        if (!byModule[type.module][type.kind]) {
          byModule[type.module][type.kind] = []
        }
        byModule[type.module][type.kind].push(type.name)
      }

      let result = '# 📚 Exports da Biblioteca Whaileys\n\n'
      result += `**Total:** ${types.length} declarações exportadas\n\n`

      for (const [module, kinds] of Object.entries(byModule)) {
        const total = Object.values(kinds).flat().length
        result += `## 📁 ${module} (${total})\n\n`

        for (const [kind, names] of Object.entries(kinds)) {
          result += `### ${CATEGORY_EMOJI[kind as ExtractedKind]} ${CATEGORY_LABELS[kind as ExtractedKind]} (${names.length})\n`
          for (const name of names.slice(0, 10)) {
            result += `- \`${name}\`\n`
          }
          if (names.length > 10) {
            result += `- ... e mais ${names.length - 10}\n`
          }
          result += '\n'
        }
      }

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_categorias',
    {
      description:
        'Lista declarações de uma categoria específica (interfaces, types, enums, functions, classes, variables, namespaces).',
      inputSchema: {
        categoria: z
          .enum(['interface', 'type', 'enum', 'function', 'class', 'variable', 'namespace', 're-export'])
          .describe('Categoria de declarações para listar.'),
        modulo: z.string().optional().describe('Filtrar por módulo específico (opcional).'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ categoria, modulo }) => {
      const parser = new AstParser(srcPath)
      let types = parser.getTypesByKind(categoria)

      if (modulo) {
        types = types.filter((t) => t.module.toLowerCase() === modulo.toLowerCase())
      }

      let result = `# ${CATEGORY_EMOJI[categoria]} ${CATEGORY_LABELS[categoria]}\n\n`
      result += `**Total:** ${types.length}\n\n`

      for (const type of types) {
        result += formatExtractedType(type, categoria === 'enum' || categoria === 'interface')
      }

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_constantes',
    {
      description: 'Lista todas as constantes e variáveis exportadas da biblioteca (configurações, defaults, etc).',
      inputSchema: {
        modulo: z.string().optional().describe('Filtrar por módulo específico (ex: Defaults, WABinary).'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ modulo }) => {
      const parser = new AstParser(srcPath)
      let constants = parser.getConstants()

      if (modulo) {
        constants = constants.filter((c) => c.module.toLowerCase() === modulo.toLowerCase())
      }

      let result = '# 📦 Constantes e Variáveis Exportadas\n\n'
      result += `**Total:** ${constants.length}\n\n`

      const byModule: Record<string, ExtractedType[]> = {}
      for (const c of constants) {
        if (!byModule[c.module]) byModule[c.module] = []
        byModule[c.module].push(c)
      }

      for (const [mod, vars] of Object.entries(byModule)) {
        result += `## 📁 ${mod}\n\n`
        for (const v of vars) {
          result += `### \`${v.name}\`\n`
          result += `**Tipo:** \`${v.signature.replace(`const ${v.name}: `, '')}\`\n`
          if (v.value) {
            result += `**Valor:** \`${v.value}\`\n`
          }
          result += '\n'
        }
      }

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_hierarquia',
    {
      description: 'Mostra a hierarquia de herança de um tipo (extends/implements, pais e filhos).',
      inputSchema: {
        nome: z.string().describe('Nome do tipo para analisar hierarquia.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ nome }) => {
      const parser = new AstParser(srcPath)
      const hierarchy = parser.getTypeHierarchy(nome)

      if (!hierarchy) {
        return {
          content: [{ type: 'text' as const, text: `❌ Tipo "${nome}" não encontrado.` }],
          isError: true,
        }
      }

      let result = `# 🌳 Hierarquia de \`${hierarchy.type.name}\`\n\n`
      result += formatExtractedType(hierarchy.type, false)

      if (hierarchy.parents.length > 0) {
        result += '## ⬆️ Herda de (Parents)\n\n'
        for (const parent of hierarchy.parents) {
          result += `- \`${parent}\`\n`
        }
        result += '\n'
      }

      if (hierarchy.children.length > 0) {
        result += '## ⬇️ Herdado por (Children)\n\n'
        for (const child of hierarchy.children) {
          result += `- \`${child}\`\n`
        }
        result += '\n'
      }

      if (hierarchy.parents.length === 0 && hierarchy.children.length === 0) {
        result += '*Este tipo não possui relacionamentos de herança.*\n'
      }

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_estatisticas',
    {
      description: 'Retorna estatísticas detalhadas da biblioteca: contagem por categoria, por módulo, top tipos.',
      annotations: { readOnlyHint: true },
    },
    async () => {
      const parser = new AstParser(srcPath)
      const stats = parser.getStatistics()
      return { content: [{ type: 'text' as const, text: formatStatistics(stats) }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_dependencias',
    {
      description: 'Analisa as dependências entre módulos: o que cada módulo exporta e re-exporta.',
      annotations: { readOnlyHint: true },
    },
    async () => {
      const parser = new AstParser(srcPath)
      const deps = parser.analyzeDependencies()
      return { content: [{ type: 'text' as const, text: formatDependencies(deps) }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_enums',
    {
      description: 'Lista todas as enumerações da biblioteca com seus valores.',
      annotations: { readOnlyHint: true },
    },
    async () => {
      const parser = new AstParser(srcPath)
      const enums = parser.getEnums()

      let result = '# 🔢 Enumerações da Biblioteca\n\n'
      result += `**Total:** ${enums.length}\n\n`

      for (const e of enums) {
        result += `## \`${e.name}\`\n\n`
        result += `**Arquivo:** \`${e.file}\`\n\n`
        if (e.docs) result += `> ${e.docs}\n\n`

        if (e.members && e.members.length > 0) {
          result += '**Valores:**\n'
          for (const member of e.members) {
            result += `- \`${member}\`\n`
          }
        }
        result += '\n'
      }

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_interfaces',
    {
      description: 'Lista todas as interfaces da biblioteca com suas propriedades e métodos.',
      inputSchema: {
        modulo: z.string().optional().describe('Filtrar por módulo específico.'),
        detalhado: z.boolean().optional().describe('Incluir propriedades e métodos (default: false).'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ modulo, detalhado }) => {
      const parser = new AstParser(srcPath)
      let interfaces = parser.getInterfaces()

      if (modulo) {
        interfaces = interfaces.filter((i) => i.module.toLowerCase() === modulo.toLowerCase())
      }

      let result = '# 📋 Interfaces da Biblioteca\n\n'
      result += `**Total:** ${interfaces.length}\n\n`

      for (const iface of interfaces) {
        result += formatExtractedType(iface, detalhado || false)
      }

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )

  mcpServer.registerTool(
    'whaileys_funcoes',
    {
      description: 'Lista todas as funções exportadas da biblioteca com suas assinaturas.',
      inputSchema: {
        modulo: z.string().optional().describe('Filtrar por módulo específico (ex: Utils, Socket).'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ modulo }) => {
      const parser = new AstParser(srcPath)
      let functions = parser.getFunctions()

      if (modulo) {
        functions = functions.filter((f) => f.module.toLowerCase() === modulo.toLowerCase())
      }

      let result = '# ⚡ Funções da Biblioteca\n\n'
      result += `**Total:** ${functions.length}\n\n`

      const byModule: Record<string, ExtractedType[]> = {}
      for (const f of functions) {
        if (!byModule[f.module]) byModule[f.module] = []
        byModule[f.module].push(f)
      }

      for (const [mod, funcs] of Object.entries(byModule)) {
        result += `## 📁 ${mod}\n\n`
        for (const func of funcs) {
          result += formatExtractedType(func, true)
        }
      }

      return { content: [{ type: 'text' as const, text: result }] }
    },
  )
}

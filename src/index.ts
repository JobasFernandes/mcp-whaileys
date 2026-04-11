#!/usr/bin/env node
/*
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
} from '@modelcontextprotocol/sdk/types.js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import {
  AstParser,
  ExtractedType,
  ExtractedKind,
  PropertyInfo,
  LibraryStatistics,
  DependencyInfo,
} from './ast-parser.js'
import {
  checkAndUpdate,
  checkForUpdates,
  getRepositoryStatus,
  scheduleUpdateCheck,
  ensureRepository,
} from './auto-updater.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let WHAILEYS_PATH = process.env.WHAILEYS_PATH || ''

const CATEGORY_EMOJI: Record<ExtractedKind, string> = {
  interface: '📋',
  type: '📝',
  enum: '🔢',
  function: '⚡',
  class: '🏛️',
  variable: '📦',
  namespace: '📁',
  're-export': '🔗',
}

const CATEGORY_LABELS: Record<ExtractedKind, string> = {
  interface: 'Interfaces',
  type: 'Type Aliases',
  enum: 'Enumerations',
  function: 'Functions',
  class: 'Classes',
  variable: 'Variables/Constants',
  namespace: 'Namespaces',
  're-export': 'Re-exports',
}

const mcpServer = new McpServer(
  {
    name: 'mcp-whaileys',
    version: '1.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
)

function getDirectoryTree(dirPath: string, prefix = ''): string {
  let result = ''
  const items = fs.readdirSync(dirPath, { withFileTypes: true })

  const dirs = items.filter((i) => i.isDirectory() && !i.name.startsWith('.'))
  const files = items.filter(
    (i) => i.isFile() && (i.name.endsWith('.ts') || i.name.endsWith('.js')),
  )

  for (const file of files) {
    result += `${prefix}├── ${file.name}\n`
  }

  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i]
    const isLast = i === dirs.length - 1
    result += `${prefix}${isLast ? '└── ' : '├── '}${dir.name}/\n`
    result += getDirectoryTree(path.join(dirPath, dir.name), prefix + (isLast ? '    ' : '│   '))
  }

  return result
}

function formatProperty(prop: PropertyInfo): string {
  if (prop.isMethod || prop.isCallSignature) {
    const params = prop.parameters?.join(', ') || ''
    return `${prop.name}(${params}): ${prop.returnType || prop.type}`
  }
  if (prop.isIndexSignature) {
    return `${prop.name}: ${prop.type}`
  }
  const optional = prop.optional ? '?' : ''
  const readonly = prop.readonly ? 'readonly ' : ''
  return `${readonly}${prop.name}${optional}: ${prop.type}`
}

function formatExtractedType(type: ExtractedType, detailed = false): string {
  let result = `### ${CATEGORY_EMOJI[type.kind]} ${type.kind}: \`${type.name}\`\n\n`

  result += `**Arquivo:** \`${type.file}\`${type.lineNumber ? ` (linha ${type.lineNumber})` : ''}\n`
  result += `**Módulo:** ${type.module}\n\n`

  if (type.docs) {
    result += `> ${type.docs}\n\n`
  }

  result += '```typescript\n' + type.signature + '\n```\n\n'

  if (detailed) {
    if (type.typeParameters && type.typeParameters.length > 0) {
      result += '**Type Parameters:**\n'
      for (const tp of type.typeParameters) {
        result += `- \`${tp.name}\``
        if (tp.constraint) result += ` extends \`${tp.constraint}\``
        if (tp.default) result += ` = \`${tp.default}\``
        result += '\n'
      }
      result += '\n'
    }

    if (type.extends && type.extends.length > 0) {
      result += `**Extends:** ${type.extends.map((e) => `\`${e}\``).join(', ')}\n\n`
    }

    if (type.implements && type.implements.length > 0) {
      result += `**Implements:** ${type.implements.map((i) => `\`${i}\``).join(', ')}\n\n`
    }

    if (type.properties && type.properties.length > 0) {
      result += '**Properties:**\n'
      for (const prop of type.properties.slice(0, 15)) {
        result += `- \`${formatProperty(prop)}\`\n`
        if (prop.docs) result += `  > ${prop.docs}\n`
      }
      if (type.properties.length > 15) {
        result += `- ... e mais ${type.properties.length - 15} propriedades\n`
      }
      result += '\n'
    }

    if (type.methods && type.methods.length > 0) {
      result += '**Methods:**\n'
      for (const method of type.methods.slice(0, 15)) {
        result += `- \`${formatProperty(method)}\`\n`
        if (method.docs) result += `  > ${method.docs}\n`
      }
      if (type.methods.length > 15) {
        result += `- ... e mais ${type.methods.length - 15} métodos\n`
      }
      result += '\n'
    }

    if (type.members && type.members.length > 0) {
      result += '**Members:**\n'
      for (const member of type.members.slice(0, 20)) {
        result += `- \`${member}\`\n`
      }
      if (type.members.length > 20) {
        result += `- ... e mais ${type.members.length - 20} membros\n`
      }
      result += '\n'
    }

    if (type.value) {
      result += `**Value:** \`${type.value}\`\n\n`
    }
  }

  return result
}

function formatStatistics(stats: LibraryStatistics): string {
  let result = '# 📊 Estatísticas da Biblioteca Whaileys\n\n'
  result += `**Total de Declarações:** ${stats.totalDeclarations}\n\n`

  result += '## Por Categoria\n\n'
  result += '| Categoria | Quantidade | % |\n'
  result += '|-----------|------------|---|\n'
  for (const [kind, count] of Object.entries(stats.byKind)) {
    const percentage = ((count / stats.totalDeclarations) * 100).toFixed(1)
    result += `| ${CATEGORY_EMOJI[kind as ExtractedKind]} ${CATEGORY_LABELS[kind as ExtractedKind]} | ${count} | ${percentage}% |\n`
  }

  result += '\n## Por Módulo\n\n'
  result += '| Módulo | Total | Interfaces | Types | Functions | Enums | Variables | Classes |\n'
  result += '|--------|-------|------------|-------|-----------|-------|-----------|----------|\n'
  for (const mod of stats.byModule) {
    result += `| **${mod.module}** | ${mod.total} | ${mod.interfaces} | ${mod.types} | ${mod.functions} | ${mod.enums} | ${mod.variables} | ${mod.classes} |\n`
  }

  result += '\n## Top Interfaces\n'
  for (const name of stats.topInterfaces) {
    result += `- \`${name}\`\n`
  }

  result += '\n## Top Types\n'
  for (const name of stats.topTypes) {
    result += `- \`${name}\`\n`
  }

  result += '\n## Top Functions\n'
  for (const name of stats.topFunctions) {
    result += `- \`${name}\`\n`
  }

  return result
}

function formatDependencies(deps: DependencyInfo[]): string {
  let result = '# 🔗 Análise de Dependências\n\n'

  for (const dep of deps) {
    result += `## 📁 ${dep.module}\n\n`

    if (dep.exports.length > 0) {
      result += `**Exports (${dep.exports.length}):** `
      result += dep.exports.slice(0, 10).map((e) => `\`${e}\``).join(', ')
      if (dep.exports.length > 10) {
        result += `, ... (+${dep.exports.length - 10})`
      }
      result += '\n\n'
    }

    if (dep.reExportsFrom.length > 0) {
      result += `**Re-exports from:** ${dep.reExportsFrom.map((r) => `\`${r}\``).join(', ')}\n\n`
    }
  }

  return result
}

mcpServer.server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'whaileys_estrutura',
        description:
          'Lista a estrutura de arquivos da biblioteca Whaileys (WhatsApp). Útil para entender a organização do código.',
        inputSchema: {
          type: 'object',
          properties: {
            subpasta: {
              type: 'string',
              description:
                'Subpasta específica para listar (ex: Types, Socket, Utils). Deixe vazio para listar tudo.',
            },
          },
          required: [],
        },
      },
      {
        name: 'whaileys_ler_arquivo',
        description: 'Lê o conteúdo de um arquivo específico da biblioteca Whaileys.',
        inputSchema: {
          type: 'object',
          properties: {
            caminho: {
              type: 'string',
              description: 'Caminho relativo do arquivo dentro de src/ (ex: Types/Message.ts)',
            },
          },
          required: ['caminho'],
        },
      },
      {
        name: 'whaileys_extrair_tipos',
        description:
          'Extrai interfaces, types, enums, funções, classes, variáveis e namespaces exportados usando análise de AST. Economiza tokens mostrando apenas assinaturas.',
        inputSchema: {
          type: 'object',
          properties: {
            modulo: {
              type: 'string',
              description:
                'Nome do módulo para extrair tipos (ex: Types, Socket, Utils). Deixe vazio para todos.',
            },
            apenas_kind: {
              type: 'string',
              enum: ['interface', 'type', 'enum', 'function', 'class', 'variable', 'namespace', 're-export'],
              description: 'Filtrar por tipo específico de declaração.',
            },
          },
          required: [],
        },
      },
      {
        name: 'whaileys_buscar_tipo',
        description:
          'Busca a definição de um tipo específico pelo nome. Retorna assinatura completa, propriedades, métodos e documentação.',
        inputSchema: {
          type: 'object',
          properties: {
            nome: {
              type: 'string',
              description:
                'Nome do tipo a buscar (ex: WAMessage, AuthenticationState, SocketConfig)',
            },
          },
          required: ['nome'],
        },
      },
      {
        name: 'whaileys_buscar_fuzzy',
        description:
          'Busca tipos usando correspondência aproximada. Útil quando não sabe o nome exato.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Termo de busca (ex: "message send", "auth state", "socket config")',
            },
            limite: {
              type: 'number',
              description: 'Número máximo de resultados (default: 20)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'whaileys_listar_exports',
        description:
          'Lista todos os exports públicos da biblioteca, agrupados por módulo e categoria.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'whaileys_categorias',
        description:
          'Lista declarações de uma categoria específica (interfaces, types, enums, functions, classes, variables, namespaces).',
        inputSchema: {
          type: 'object',
          properties: {
            categoria: {
              type: 'string',
              enum: ['interface', 'type', 'enum', 'function', 'class', 'variable', 'namespace', 're-export'],
              description: 'Categoria de declarações para listar.',
            },
            modulo: {
              type: 'string',
              description: 'Filtrar por módulo específico (opcional).',
            },
          },
          required: ['categoria'],
        },
      },
      {
        name: 'whaileys_constantes',
        description:
          'Lista todas as constantes e variáveis exportadas da biblioteca (configurações, defaults, etc).',
        inputSchema: {
          type: 'object',
          properties: {
            modulo: {
              type: 'string',
              description: 'Filtrar por módulo específico (ex: Defaults, WABinary).',
            },
          },
          required: [],
        },
      },
      {
        name: 'whaileys_hierarquia',
        description:
          'Mostra a hierarquia de herança de um tipo (extends/implements, pais e filhos).',
        inputSchema: {
          type: 'object',
          properties: {
            nome: {
              type: 'string',
              description: 'Nome do tipo para analisar hierarquia.',
            },
          },
          required: ['nome'],
        },
      },
      {
        name: 'whaileys_estatisticas',
        description:
          'Retorna estatísticas detalhadas da biblioteca: contagem por categoria, por módulo, top tipos.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'whaileys_dependencias',
        description:
          'Analisa as dependências entre módulos: o que cada módulo exporta e re-exporta.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'whaileys_enums',
        description:
          'Lista todas as enumerações da biblioteca com seus valores.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'whaileys_interfaces',
        description:
          'Lista todas as interfaces da biblioteca com suas propriedades e métodos.',
        inputSchema: {
          type: 'object',
          properties: {
            modulo: {
              type: 'string',
              description: 'Filtrar por módulo específico.',
            },
            detalhado: {
              type: 'boolean',
              description: 'Incluir propriedades e métodos (default: false).',
            },
          },
          required: [],
        },
      },
      {
        name: 'whaileys_funcoes',
        description:
          'Lista todas as funções exportadas da biblioteca com suas assinaturas.',
        inputSchema: {
          type: 'object',
          properties: {
            modulo: {
              type: 'string',
              description: 'Filtrar por módulo específico (ex: Utils, Socket).',
            },
          },
          required: [],
        },
      },
      {
        name: 'whaileys_check_updates',
        description:
          'Verifica se há atualizações disponíveis no repositório oficial do Whaileys (GitHub). Não aplica atualizações, apenas verifica.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'whaileys_update',
        description:
          'Atualiza o repositório local do Whaileys para a versão mais recente do GitHub. Executa git pull automaticamente.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'whaileys_status',
        description:
          'Mostra o status atual do repositório local: SHA do commit, se há atualizações pendentes, caminho do repositório.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  }
})

mcpServer.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'whaileys_estrutura': {
        const subpasta = (args as { subpasta?: string })?.subpasta
        const targetPath = subpasta ? path.join(WHAILEYS_PATH, subpasta) : WHAILEYS_PATH

        if (!fs.existsSync(targetPath)) {
          return {
            content: [{ type: 'text', text: `❌ Pasta não encontrada: ${subpasta || 'src'}` }],
            isError: true,
          }
        }

        const tree = getDirectoryTree(targetPath)
        return {
          content: [
            {
              type: 'text',
              text: `# 📁 Estrutura de ${subpasta || 'whaileys/src'}\n\n\`\`\`\n${tree}\`\`\``,
            },
          ],
        }
      }

      case 'whaileys_ler_arquivo': {
        const caminho = (args as { caminho: string }).caminho
        const fullPath = path.join(WHAILEYS_PATH, caminho)

        if (!fs.existsSync(fullPath)) {
          return {
            content: [{ type: 'text', text: `❌ Arquivo não encontrado: ${caminho}` }],
            isError: true,
          }
        }

        const content = fs.readFileSync(fullPath, 'utf-8')
        const ext = path.extname(caminho).slice(1) || 'typescript'

        return {
          content: [
            {
              type: 'text',
              text: `# 📄 ${caminho}\n\n\`\`\`${ext}\n${content}\n\`\`\``,
            },
          ],
        }
      }

      case 'whaileys_extrair_tipos': {
        const { modulo, apenas_kind } = args as { modulo?: string; apenas_kind?: ExtractedKind }

        const parser = new AstParser(WHAILEYS_PATH)
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

        return {
          content: [{ type: 'text', text: result }],
        }
      }

      case 'whaileys_buscar_tipo': {
        const nome = (args as { nome: string }).nome

        const parser = new AstParser(WHAILEYS_PATH)
        const found = parser.searchType(nome)

        if (!found) {
          const fuzzyResults = parser.fuzzySearch(nome, 5)
          let suggestion = ''
          if (fuzzyResults.length > 0) {
            suggestion = '\n\n**Você quis dizer:**\n' + fuzzyResults.map((t) => `- \`${t.name}\` (${t.kind})`).join('\n')
          }
          return {
            content: [
              {
                type: 'text',
                text: `❌ Tipo "${nome}" não encontrado.${suggestion}`,
              },
            ],
            isError: true,
          }
        }

        return {
          content: [{ type: 'text', text: formatExtractedType(found, true) }],
        }
      }

      case 'whaileys_buscar_fuzzy': {
        const { query, limite } = args as { query: string; limite?: number }

        const parser = new AstParser(WHAILEYS_PATH)
        const results = parser.fuzzySearch(query, limite || 20)

        if (results.length === 0) {
          return {
            content: [{ type: 'text', text: `❌ Nenhum resultado encontrado para "${query}"` }],
            isError: true,
          }
        }

        let result = `# 🔍 Resultados para "${query}"\n\n`
        result += `**Encontrados:** ${results.length} tipos\n\n`

        for (const type of results) {
          result += `- ${CATEGORY_EMOJI[type.kind]} **\`${type.name}\`** (${type.kind}) - \`${type.file}\`\n`
          if (type.docs) result += `  > ${type.docs.substring(0, 100)}...\n`
        }

        return {
          content: [{ type: 'text', text: result }],
        }
      }

      case 'whaileys_listar_exports': {
        const parser = new AstParser(WHAILEYS_PATH)
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

        return {
          content: [{ type: 'text', text: result }],
        }
      }

      case 'whaileys_categorias': {
        const { categoria, modulo } = args as { categoria: ExtractedKind; modulo?: string }

        const parser = new AstParser(WHAILEYS_PATH)
        let types = parser.getTypesByKind(categoria)

        if (modulo) {
          types = types.filter((t) => t.module.toLowerCase() === modulo.toLowerCase())
        }

        let result = `# ${CATEGORY_EMOJI[categoria]} ${CATEGORY_LABELS[categoria]}\n\n`
        result += `**Total:** ${types.length}\n\n`

        for (const type of types) {
          result += formatExtractedType(type, categoria === 'enum' || categoria === 'interface')
        }

        return {
          content: [{ type: 'text', text: result }],
        }
      }

      case 'whaileys_constantes': {
        const { modulo } = args as { modulo?: string }

        const parser = new AstParser(WHAILEYS_PATH)
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

        return {
          content: [{ type: 'text', text: result }],
        }
      }

      case 'whaileys_hierarquia': {
        const { nome } = args as { nome: string }

        const parser = new AstParser(WHAILEYS_PATH)
        const hierarchy = parser.getTypeHierarchy(nome)

        if (!hierarchy) {
          return {
            content: [{ type: 'text', text: `❌ Tipo "${nome}" não encontrado.` }],
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

        return {
          content: [{ type: 'text', text: result }],
        }
      }

      case 'whaileys_estatisticas': {
        const parser = new AstParser(WHAILEYS_PATH)
        const stats = parser.getStatistics()

        return {
          content: [{ type: 'text', text: formatStatistics(stats) }],
        }
      }

      case 'whaileys_dependencias': {
        const parser = new AstParser(WHAILEYS_PATH)
        const deps = parser.analyzeDependencies()

        return {
          content: [{ type: 'text', text: formatDependencies(deps) }],
        }
      }

      case 'whaileys_enums': {
        const parser = new AstParser(WHAILEYS_PATH)
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

        return {
          content: [{ type: 'text', text: result }],
        }
      }

      case 'whaileys_interfaces': {
        const { modulo, detalhado } = args as { modulo?: string; detalhado?: boolean }

        const parser = new AstParser(WHAILEYS_PATH)
        let interfaces = parser.getInterfaces()

        if (modulo) {
          interfaces = interfaces.filter((i) => i.module.toLowerCase() === modulo.toLowerCase())
        }

        let result = '# 📋 Interfaces da Biblioteca\n\n'
        result += `**Total:** ${interfaces.length}\n\n`

        for (const iface of interfaces) {
          result += formatExtractedType(iface, detalhado || false)
        }

        return {
          content: [{ type: 'text', text: result }],
        }
      }

      case 'whaileys_funcoes': {
        const { modulo } = args as { modulo?: string }

        const parser = new AstParser(WHAILEYS_PATH)
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

        return {
          content: [{ type: 'text', text: result }],
        }
      }

      case 'whaileys_check_updates': {
        const updateInfo = await checkForUpdates()

        let result = '# 🔍 Verificação de Atualizações\n\n'

        if (updateInfo.hasUpdate) {
          result += '⚠️ **Atualização disponível!**\n\n'
          result += `**Commit local:** \`${updateInfo.currentSha?.substring(0, 7) || 'N/A'}\`\n`
          result += `**Commit remoto:** \`${updateInfo.latestSha?.substring(0, 7) || 'N/A'}\`\n\n`

          if (updateInfo.latestCommit) {
            result += `**Último commit:**\n`
            result += `- Mensagem: ${updateInfo.latestCommit.message}\n`
            result += `- Autor: ${updateInfo.latestCommit.author}\n`
            result += `- Data: ${updateInfo.latestCommit.date}\n\n`
          }

          result += '> Use `whaileys_update` para atualizar o repositório.\n'
        } else {
          result += '✅ **Repositório está atualizado!**\n\n'
          result += `**Commit atual:** \`${updateInfo.currentSha?.substring(0, 7) || 'N/A'}\`\n`
        }

        return {
          content: [{ type: 'text', text: result }],
        }
      }

      case 'whaileys_update': {
        const updateResult = await checkAndUpdate()

        let result = '# 🔄 Atualização do Repositório\n\n'

        if (updateResult.updated) {
          result += '✅ **Repositório atualizado com sucesso!**\n\n'
          if (updateResult.previousSha) {
            result += `**De:** \`${updateResult.previousSha.substring(0, 7)}\`\n`
          }
          result += `**Para:** \`${updateResult.currentSha?.substring(0, 7) || 'N/A'}\`\n\n`

          if (updateResult.commitMessage) {
            result += `**Commit:** ${updateResult.commitMessage}\n`
          }
          if (updateResult.commitDate) {
            result += `**Data:** ${updateResult.commitDate}\n`
          }

          result += '\n> ⚡ O contexto da biblioteca foi atualizado automaticamente.\n'
        } else if (updateResult.error) {
          result += '❌ **Erro ao atualizar:**\n\n'
          result += `\`\`\`\n${updateResult.error}\n\`\`\`\n`
        } else {
          result += '✅ **Já está na versão mais recente!**\n\n'
          result += `**Commit atual:** \`${updateResult.currentSha?.substring(0, 7) || 'N/A'}\`\n`
        }

        return {
          content: [{ type: 'text', text: result }],
        }
      }

      case 'whaileys_status': {
        const status = await getRepositoryStatus()

        let result = '# 📊 Status do Repositório Whaileys\n\n'

        result += `**Repositório válido:** ${status.isValid ? '✅ Sim' : '❌ Não'}\n`
        result += `**Caminho:** \`${status.repoPath}\`\n\n`

        result += `**Commit local:** \`${status.localSha?.substring(0, 7) || 'N/A'}\`\n`
        result += `**Commit remoto:** \`${status.remoteSha?.substring(0, 7) || 'N/A'}\`\n\n`

        if (status.hasUpdates) {
          result += '⚠️ **Há atualizações disponíveis!**\n\n'
          result += '> Use `whaileys_update` para atualizar.\n'
        } else {
          result += '✅ **Repositório está sincronizado com o GitHub.**\n'
        }

        result += `\n**Última verificação:** ${status.lastCheck}\n`

        return {
          content: [{ type: 'text', text: result }],
        }
      }

      default:
        return {
          content: [{ type: 'text', text: `❌ Ferramenta desconhecida: ${name}` }],
          isError: true,
        }
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Erro: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    }
  }
})

mcpServer.server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'whaileys://readme',
        name: 'Whaileys README',
        description: 'Documentação principal da biblioteca Whaileys',
        mimeType: 'text/markdown',
      },
      {
        uri: 'whaileys://types-index',
        name: 'Types Index',
        description: 'Índice de todos os tipos exportados',
        mimeType: 'text/markdown',
      },
      {
        uri: 'whaileys://statistics',
        name: 'Library Statistics',
        description: 'Estatísticas completas da biblioteca',
        mimeType: 'text/markdown',
      },
    ],
  }
})

mcpServer.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri

  if (uri === 'whaileys://readme') {
    const readmePath = path.join(WHAILEYS_PATH, '..', 'README.md')
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf-8')
      return { contents: [{ uri, mimeType: 'text/markdown', text: content }] }
    }
  }

  if (uri === 'whaileys://types-index') {
    const indexPath = path.join(WHAILEYS_PATH, 'Types', 'index.ts')
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf-8')
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: `# Types Index\n\n\`\`\`typescript\n${content}\n\`\`\``,
          },
        ],
      }
    }
  }

  if (uri === 'whaileys://statistics') {
    const parser = new AstParser(WHAILEYS_PATH)
    const stats = parser.getStatistics()
    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: formatStatistics(stats),
        },
      ],
    }
  }

  return { contents: [{ uri, mimeType: 'text/plain', text: 'Resource not found' }] }
})

const AUTO_UPDATE_INTERVAL = parseInt(process.env.AUTO_UPDATE_INTERVAL || '3600000', 10)
const AUTO_UPDATE_ENABLED = process.env.AUTO_UPDATE_ENABLED !== 'false'

async function main() {
  const repoResult = await ensureRepository()
  if (!repoResult.success) {
    console.error(`❌ ${repoResult.error}`)
    process.exit(1)
  }
  
  WHAILEYS_PATH = repoResult.path
  console.error(`📁 Usando whaileys: ${WHAILEYS_PATH}`)
  
  const transport = new StdioServerTransport()
  await mcpServer.connect(transport)
  console.error(`MCP Whaileys server v${APP_VERSION} running on stdio`)

  if (AUTO_UPDATE_ENABLED) {
    const initialCheck = await checkForUpdates()
    if (initialCheck.hasUpdate) {
      console.error(`⚠️ Atualização disponível: ${initialCheck.latestCommit?.message}`)
    }

    scheduleUpdateCheck(AUTO_UPDATE_INTERVAL)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
*/

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createRequire } from 'node:module'
import {
  ensureRepository,
  checkForUpdates,
  scheduleUpdateCheck,
  checkPackageUpdate,
  schedulePackageUpdateCheck,
} from './auto-updater.js'
import { registerAstTools } from './tools/ast-tools.js'
import { registerRepoTools, registerResources } from './tools/repo-tools.js'
import { registerContentTools } from './tools/content-tools.js'
import { registerDomainTools } from './tools/domain-tools.js'
import { registerGuideTools } from './tools/guide-tools.js'
import { registerProtoTools } from './tools/proto-tools.js'
import { registerExampleTools } from './tools/example-tools.js'

const require = createRequire(import.meta.url)
const APP_VERSION = (require('../package.json') as { version?: string }).version ?? '0.0.0'

const AUTO_UPDATE_INTERVAL = parseInt(process.env.AUTO_UPDATE_INTERVAL || '3600000', 10)
const AUTO_UPDATE_ENABLED = process.env.AUTO_UPDATE_ENABLED !== 'false'

const mcpServer = new McpServer(
  {
    name: 'mcp-whaileys',
    version: APP_VERSION,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
)

async function main() {
  const repoResult = await ensureRepository()
  if (!repoResult.success) {
    console.error(`❌ ${repoResult.error}`)
    process.exit(1)
  }

  const srcPath = repoResult.path
  console.error(`📁 Usando Whaileys: ${srcPath}`)

  registerAstTools(mcpServer, srcPath)
  registerRepoTools(mcpServer, srcPath, APP_VERSION)
  registerContentTools(mcpServer, srcPath)
  registerDomainTools(mcpServer)
  registerGuideTools(mcpServer)
  registerProtoTools(mcpServer, srcPath)
  registerExampleTools(mcpServer)
  registerResources(mcpServer, srcPath)

  const transport = new StdioServerTransport()
  await mcpServer.connect(transport)
  console.error(`MCP Whaileys server v${APP_VERSION} running on stdio`)

  if (AUTO_UPDATE_ENABLED) {
    const initialCheck = await checkForUpdates()
    if (initialCheck.hasUpdate) {
      console.error(`⚠️ Atualização do repositório disponível: ${initialCheck.latestCommit?.message}`)
    }
    scheduleUpdateCheck(AUTO_UPDATE_INTERVAL)
  }

  const packageCheck = await checkPackageUpdate(APP_VERSION)
  if (packageCheck.hasUpdate) {
    console.error(`\n⚠️  Nova versão do mcp-whaileys: v${packageCheck.latestVersion} (atual: v${APP_VERSION})`)
    console.error('   Atualize: npm install -g mcp-whaileys@latest\n')
  }
  schedulePackageUpdateCheck(APP_VERSION)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

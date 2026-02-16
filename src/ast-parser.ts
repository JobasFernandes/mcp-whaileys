import {
  Project,
  SourceFile,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  ClassDeclaration,
  VariableDeclaration,
  ModuleDeclaration,
  ExportDeclaration,
  Node,
} from 'ts-morph'
import * as path from 'path'

export type ExtractedKind =
  | 'interface'
  | 'type'
  | 'enum'
  | 'function'
  | 'class'
  | 'variable'
  | 'namespace'
  | 're-export'

export interface PropertyInfo {
  name: string
  type: string
  optional: boolean
  readonly: boolean
  docs?: string
  isMethod: boolean
  isCallSignature: boolean
  isIndexSignature: boolean
  parameters?: string[]
  returnType?: string
}

export interface TypeParameter {
  name: string
  constraint?: string
  default?: string
}

export interface ExtractedType {
  name: string
  kind: ExtractedKind
  exported: boolean
  file: string
  module: string
  signature: string
  fullSignature?: string
  properties?: PropertyInfo[]
  methods?: PropertyInfo[]
  members?: string[]
  typeParameters?: TypeParameter[]
  extends?: string[]
  implements?: string[]
  docs?: string
  value?: string
  reExportSource?: string
  lineNumber?: number
}

export interface ModuleStatistics {
  module: string
  interfaces: number
  types: number
  enums: number
  functions: number
  classes: number
  variables: number
  namespaces: number
  reExports: number
  total: number
}

export interface LibraryStatistics {
  totalDeclarations: number
  byKind: Record<ExtractedKind, number>
  byModule: ModuleStatistics[]
  topInterfaces: string[]
  topTypes: string[]
  topFunctions: string[]
}

export interface DependencyInfo {
  module: string
  imports: string[]
  exports: string[]
  reExportsFrom: string[]
}

export interface RankedTypeResult {
  type: ExtractedType
  score: number
  matchedIn: string[]
}

export interface ModuleSummary {
  module: string
  total: number
  byKind: Record<ExtractedKind, number>
  files: string[]
  highlights: ExtractedType[]
}

export class AstParser {
  private project: Project
  private whaileysSrcPath: string
  private cachedTypes: ExtractedType[] | null = null

  constructor(whaileysSrcPath: string) {
    this.whaileysSrcPath = whaileysSrcPath
    this.project = new Project({
      tsConfigFilePath: path.join(whaileysSrcPath, '..', 'tsconfig.json'),
      skipAddingFilesFromTsConfig: true,
    })
  }

  private getModuleName(filePath: string): string {
    const relativePath = path.relative(this.whaileysSrcPath, filePath)
    const parts = relativePath.split(path.sep)
    if (parts.length > 1) {
      return parts[0]
    }
    return 'root'
  }

  private getRelativePath(filePath: string): string {
    return path.relative(this.whaileysSrcPath, filePath).replace(/\\/g, '/')
  }

  addSourceFiles(patterns: string[]): void {
    for (const pattern of patterns) {
      this.project.addSourceFilesAtPaths(path.join(this.whaileysSrcPath, pattern))
    }
  }

  extractFromFile(filePath: string): ExtractedType[] {
    const fullPath = path.join(this.whaileysSrcPath, filePath)
    const sourceFile = this.project.addSourceFileAtPath(fullPath)
    return this.extractTypes(sourceFile)
  }

  extractAllTypes(): ExtractedType[] {
    if (this.cachedTypes) return this.cachedTypes

    this.addSourceFiles(['**/*.ts'])
    const types: ExtractedType[] = []

    for (const sourceFile of this.project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath()
      if (filePath.includes('Tests') || filePath.includes('.d.ts')) continue
      types.push(...this.extractTypes(sourceFile))
    }

    this.cachedTypes = types
    return types
  }

  private extractTypes(sourceFile: SourceFile): ExtractedType[] {
    const types: ExtractedType[] = []
    const relativePath = this.getRelativePath(sourceFile.getFilePath())
    const moduleName = this.getModuleName(sourceFile.getFilePath())

    for (const iface of sourceFile.getInterfaces()) {
      if (iface.isExported()) {
        types.push(this.extractInterface(iface, relativePath, moduleName))
      }
    }

    for (const typeAlias of sourceFile.getTypeAliases()) {
      if (typeAlias.isExported()) {
        types.push(this.extractTypeAlias(typeAlias, relativePath, moduleName))
      }
    }

    for (const enumDecl of sourceFile.getEnums()) {
      if (enumDecl.isExported()) {
        types.push(this.extractEnum(enumDecl, relativePath, moduleName))
      }
    }

    for (const funcDecl of sourceFile.getFunctions()) {
      if (funcDecl.isExported()) {
        types.push(this.extractFunction(funcDecl, relativePath, moduleName))
      }
    }

    for (const classDecl of sourceFile.getClasses()) {
      if (classDecl.isExported()) {
        types.push(this.extractClass(classDecl, relativePath, moduleName))
      }
    }

    for (const varDecl of sourceFile.getVariableDeclarations()) {
      const varStmt = varDecl.getVariableStatement()
      if (varStmt?.isExported()) {
        types.push(this.extractVariable(varDecl, relativePath, moduleName))
      }
    }

    for (const moduleDecl of sourceFile.getModules()) {
      if (moduleDecl.isExported()) {
        types.push(this.extractNamespace(moduleDecl, relativePath, moduleName))
      }
    }

    for (const exportDecl of sourceFile.getExportDeclarations()) {
      const reExport = this.extractReExport(exportDecl, relativePath, moduleName)
      if (reExport) {
        types.push(reExport)
      }
    }

    return types
  }

  private extractTypeParameters(
    node: InterfaceDeclaration | TypeAliasDeclaration | ClassDeclaration | FunctionDeclaration,
  ): TypeParameter[] {
    return node.getTypeParameters().map((tp) => ({
      name: tp.getName(),
      constraint: tp.getConstraint()?.getText(),
      default: tp.getDefault()?.getText(),
    }))
  }

  private extractInterface(
    iface: InterfaceDeclaration,
    file: string,
    module: string,
  ): ExtractedType {
    const properties: PropertyInfo[] = []
    const methods: PropertyInfo[] = []

    for (const prop of iface.getProperties()) {
      properties.push({
        name: prop.getName(),
        type: this.simplifyType(prop.getType().getText()),
        optional: prop.hasQuestionToken(),
        readonly: prop.isReadonly(),
        docs: this.getJsDocs(prop),
        isMethod: false,
        isCallSignature: false,
        isIndexSignature: false,
      })
    }

    for (const method of iface.getMethods()) {
      const params = method
        .getParameters()
        .map((p) => `${p.getName()}: ${this.simplifyType(p.getType().getText())}`)
      methods.push({
        name: method.getName(),
        type: this.simplifyType(method.getReturnType().getText()),
        optional: method.hasQuestionToken(),
        readonly: false,
        docs: this.getJsDocs(method),
        isMethod: true,
        isCallSignature: false,
        isIndexSignature: false,
        parameters: params,
        returnType: this.simplifyType(method.getReturnType().getText()),
      })
    }

    for (const callSig of iface.getCallSignatures()) {
      const params = callSig
        .getParameters()
        .map((p) => `${p.getName()}: ${this.simplifyType(p.getType().getText())}`)
      methods.push({
        name: '(call)',
        type: this.simplifyType(callSig.getReturnType().getText()),
        optional: false,
        readonly: false,
        docs: this.getJsDocs(callSig),
        isMethod: false,
        isCallSignature: true,
        isIndexSignature: false,
        parameters: params,
        returnType: this.simplifyType(callSig.getReturnType().getText()),
      })
    }

    for (const indexSig of iface.getIndexSignatures()) {
      const keyType = indexSig.getKeyType().getText()
      const keyName = indexSig.getKeyName()
      methods.push({
        name: `[${keyName}: ${keyType}]`,
        type: this.simplifyType(indexSig.getReturnType().getText()),
        optional: false,
        readonly: indexSig.isReadonly(),
        docs: this.getJsDocs(indexSig),
        isMethod: false,
        isCallSignature: false,
        isIndexSignature: true,
      })
    }

    const typeParams = this.extractTypeParameters(iface)
    const typeParamsStr =
      typeParams.length > 0 ? `<${typeParams.map((tp) => tp.name).join(', ')}>` : ''
    const extendsClause = iface.getExtends()
    const extendsStr =
      extendsClause.length > 0
        ? ` extends ${extendsClause.map((e) => e.getText()).join(', ')}`
        : ''

    return {
      name: iface.getName(),
      kind: 'interface',
      exported: true,
      file,
      module,
      signature: `interface ${iface.getName()}${typeParamsStr}${extendsStr}`,
      properties,
      methods,
      typeParameters: typeParams,
      extends: extendsClause.map((e) => e.getText()),
      docs: this.getJsDocs(iface),
      lineNumber: iface.getStartLineNumber(),
    }
  }

  private extractTypeAlias(
    typeAlias: TypeAliasDeclaration,
    file: string,
    module: string,
  ): ExtractedType {
    const typeParams = this.extractTypeParameters(typeAlias)
    const typeParamsStr =
      typeParams.length > 0 ? `<${typeParams.map((tp) => tp.name).join(', ')}>` : ''
    const typeText = this.simplifyType(typeAlias.getType().getText())

    return {
      name: typeAlias.getName(),
      kind: 'type',
      exported: true,
      file,
      module,
      signature: `type ${typeAlias.getName()}${typeParamsStr} = ${typeText}`,
      fullSignature: `type ${typeAlias.getName()}${typeParamsStr} = ${typeAlias.getType().getText()}`,
      typeParameters: typeParams,
      docs: this.getJsDocs(typeAlias),
      lineNumber: typeAlias.getStartLineNumber(),
    }
  }

  private extractEnum(enumDecl: EnumDeclaration, file: string, module: string): ExtractedType {
    const members = enumDecl.getMembers().map((m) => {
      const value = m.getValue()
      const valueStr =
        typeof value === 'string' ? `"${value}"` : (value ?? m.getInitializer()?.getText() ?? 'auto')
      return `${m.getName()} = ${valueStr}`
    })

    return {
      name: enumDecl.getName(),
      kind: 'enum',
      exported: true,
      file,
      module,
      signature: `enum ${enumDecl.getName()} { ${members.slice(0, 5).join(', ')}${members.length > 5 ? `, ... (+${members.length - 5})` : ''} }`,
      members,
      docs: this.getJsDocs(enumDecl),
      lineNumber: enumDecl.getStartLineNumber(),
    }
  }

  private extractFunction(
    funcDecl: FunctionDeclaration,
    file: string,
    module: string,
  ): ExtractedType {
    const typeParams = this.extractTypeParameters(funcDecl)
    const typeParamsStr =
      typeParams.length > 0 ? `<${typeParams.map((tp) => tp.name).join(', ')}>` : ''
    const params = funcDecl.getParameters().map((p) => {
      const optional = p.hasQuestionToken() ? '?' : ''
      return `${p.getName()}${optional}: ${this.simplifyType(p.getType().getText())}`
    })
    const returnType = this.simplifyType(funcDecl.getReturnType().getText())

    return {
      name: funcDecl.getName() || 'anonymous',
      kind: 'function',
      exported: true,
      file,
      module,
      signature: `function ${funcDecl.getName()}${typeParamsStr}(${params.join(', ')}): ${returnType}`,
      typeParameters: typeParams,
      docs: this.getJsDocs(funcDecl),
      lineNumber: funcDecl.getStartLineNumber(),
    }
  }

  private extractClass(
    classDecl: ClassDeclaration,
    file: string,
    module: string,
  ): ExtractedType {
    const methods: PropertyInfo[] = []
    const properties: PropertyInfo[] = []

    for (const method of classDecl.getMethods()) {
      const isPublic = method.getScope() === 'public' || !method.getScope()
      if (!isPublic) continue

      const params = method
        .getParameters()
        .map((p) => `${p.getName()}: ${this.simplifyType(p.getType().getText())}`)
      methods.push({
        name: method.getName(),
        type: this.simplifyType(method.getReturnType().getText()),
        optional: false,
        readonly: false,
        docs: this.getJsDocs(method),
        isMethod: true,
        isCallSignature: false,
        isIndexSignature: false,
        parameters: params,
        returnType: this.simplifyType(method.getReturnType().getText()),
      })
    }

    for (const prop of classDecl.getProperties()) {
      const isPublic = prop.getScope() === 'public' || !prop.getScope()
      if (!isPublic) continue

      properties.push({
        name: prop.getName(),
        type: this.simplifyType(prop.getType().getText()),
        optional: prop.hasQuestionToken(),
        readonly: prop.isReadonly(),
        docs: this.getJsDocs(prop),
        isMethod: false,
        isCallSignature: false,
        isIndexSignature: false,
      })
    }

    const typeParams = this.extractTypeParameters(classDecl)
    const typeParamsStr =
      typeParams.length > 0 ? `<${typeParams.map((tp) => tp.name).join(', ')}>` : ''
    const extendsClause = classDecl.getExtends()
    const implementsClause = classDecl.getImplements()

    let signature = `class ${classDecl.getName()}${typeParamsStr}`
    if (extendsClause) {
      signature += ` extends ${extendsClause.getText()}`
    }
    if (implementsClause.length > 0) {
      signature += ` implements ${implementsClause.map((i) => i.getText()).join(', ')}`
    }

    return {
      name: classDecl.getName() || 'AnonymousClass',
      kind: 'class',
      exported: true,
      file,
      module,
      signature,
      properties,
      methods,
      typeParameters: typeParams,
      extends: extendsClause ? [extendsClause.getText()] : undefined,
      implements: implementsClause.length > 0 ? implementsClause.map((i) => i.getText()) : undefined,
      docs: this.getJsDocs(classDecl),
      lineNumber: classDecl.getStartLineNumber(),
    }
  }

  private extractVariable(
    varDecl: VariableDeclaration,
    file: string,
    module: string,
  ): ExtractedType {
    const name = varDecl.getName()
    const type = this.simplifyType(varDecl.getType().getText())
    const initializer = varDecl.getInitializer()

    let value: string | undefined
    if (initializer) {
      const initText = initializer.getText()
      value = initText.length > 100 ? initText.substring(0, 100) + '...' : initText
    }

    const varStmt = varDecl.getVariableStatement()
    const declarationKind = varStmt?.getDeclarationKind() || 'const'

    return {
      name,
      kind: 'variable',
      exported: true,
      file,
      module,
      signature: `${declarationKind} ${name}: ${type}`,
      value,
      docs: varStmt ? this.getJsDocs(varStmt) : undefined,
      lineNumber: varDecl.getStartLineNumber(),
    }
  }

  private extractNamespace(
    moduleDecl: ModuleDeclaration,
    file: string,
    module: string,
  ): ExtractedType {
    const members: string[] = []

    for (const iface of moduleDecl.getInterfaces()) {
      members.push(`interface ${iface.getName()}`)
    }
    for (const typeAlias of moduleDecl.getTypeAliases()) {
      members.push(`type ${typeAlias.getName()}`)
    }
    for (const enumDecl of moduleDecl.getEnums()) {
      members.push(`enum ${enumDecl.getName()}`)
    }
    for (const func of moduleDecl.getFunctions()) {
      members.push(`function ${func.getName()}`)
    }
    for (const cls of moduleDecl.getClasses()) {
      members.push(`class ${cls.getName()}`)
    }
    for (const nestedNs of moduleDecl.getModules()) {
      members.push(`namespace ${nestedNs.getName()}`)
    }

    return {
      name: moduleDecl.getName(),
      kind: 'namespace',
      exported: true,
      file,
      module,
      signature: `namespace ${moduleDecl.getName()} { /* ${members.length} members */ }`,
      members,
      docs: this.getJsDocs(moduleDecl),
      lineNumber: moduleDecl.getStartLineNumber(),
    }
  }

  private extractReExport(
    exportDecl: ExportDeclaration,
    file: string,
    module: string,
  ): ExtractedType | null {
    const moduleSpecifier = exportDecl.getModuleSpecifierValue()
    if (!moduleSpecifier) return null

    const namedExports = exportDecl.getNamedExports()
    const isNamespaceExport = exportDecl.isNamespaceExport()

    if (isNamespaceExport) {
      return {
        name: `* from "${moduleSpecifier}"`,
        kind: 're-export',
        exported: true,
        file,
        module,
        signature: `export * from "${moduleSpecifier}"`,
        reExportSource: moduleSpecifier,
        lineNumber: exportDecl.getStartLineNumber(),
      }
    }

    if (namedExports.length > 0) {
      const names = namedExports.map((ne) => {
        const alias = ne.getAliasNode()
        return alias ? `${ne.getName()} as ${alias.getText()}` : ne.getName()
      })
      return {
        name: `{ ${names.join(', ')} } from "${moduleSpecifier}"`,
        kind: 're-export',
        exported: true,
        file,
        module,
        signature: `export { ${names.join(', ')} } from "${moduleSpecifier}"`,
        reExportSource: moduleSpecifier,
        members: names,
        lineNumber: exportDecl.getStartLineNumber(),
      }
    }

    return null
  }

  private simplifyType(type: string): string {
    return type
      .replace(/import\([^)]+\)\./g, '')
      .replace(/typeof import\([^)]+\)\./g, '')
      .replace(/d:\/[^"]+\//g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private getJsDocs(node: Node): string | undefined {
    const nodeWithDocs = node as unknown as { getJsDocs?: () => Array<{ getDescription?: () => string; getText?: () => string }> }
    if (typeof nodeWithDocs.getJsDocs === 'function') {
      const jsDocs = nodeWithDocs.getJsDocs()
      if (jsDocs && jsDocs.length > 0) {
        return jsDocs
          .map((d) => d.getDescription?.() || d.getText?.())
          .filter(Boolean)
          .join('\n')
          .trim()
      }
    }
    return undefined
  }

  searchType(typeName: string): ExtractedType | undefined {
    const allTypes = this.extractAllTypes()
    const lowerName = typeName.toLowerCase()
    return (
      allTypes.find((t) => t.name.toLowerCase() === lowerName) ||
      allTypes.find((t) => t.name.toLowerCase().includes(lowerName))
    )
  }

  fuzzySearch(query: string, maxResults = 20): ExtractedType[] {
    return this.searchByContext(query, maxResults).map((result) => result.type)
  }

  searchByContext(
    query: string,
    maxResults = 20,
    filters?: { module?: string; kind?: ExtractedKind },
  ): RankedTypeResult[] {
    const normalizedQuery = query.toLowerCase().trim()
    if (!normalizedQuery) return []

    const words = normalizedQuery.split(/\s+/).filter((word) => word.length > 1)
    const allTypes = this.extractAllTypes()
    const targetModule = filters?.module?.toLowerCase()

    const candidates = allTypes.filter((type) => {
      if (filters?.kind && type.kind !== filters.kind) return false
      if (!targetModule) return true
      return (
        type.module.toLowerCase() === targetModule ||
        type.file.toLowerCase().includes(targetModule)
      )
    })

    const ranked = candidates
      .map((type) => this.rankType(type, normalizedQuery, words))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.type.name.localeCompare(b.type.name))

    return ranked.slice(0, maxResults)
  }

  summarizeModule(moduleName: string, highlightLimit = 12): ModuleSummary {
    const types = this.getTypesFromModule(moduleName)
    const byKind: Record<ExtractedKind, number> = {
      interface: 0,
      type: 0,
      enum: 0,
      function: 0,
      class: 0,
      variable: 0,
      namespace: 0,
      're-export': 0,
    }

    for (const type of types) {
      byKind[type.kind] += 1
    }

    const files = Array.from(new Set(types.map((type) => type.file))).sort((a, b) => a.localeCompare(b))

    const highlightOrder: Record<ExtractedKind, number> = {
      function: 0,
      interface: 1,
      type: 2,
      class: 3,
      enum: 4,
      variable: 5,
      namespace: 6,
      're-export': 7,
    }

    const highlights = [...types]
      .sort((a, b) => {
        const aOrder = highlightOrder[a.kind]
        const bOrder = highlightOrder[b.kind]
        if (aOrder !== bOrder) return aOrder - bOrder

        const aHasDocs = a.docs ? 1 : 0
        const bHasDocs = b.docs ? 1 : 0
        if (aHasDocs !== bHasDocs) return bHasDocs - aHasDocs

        return a.name.localeCompare(b.name)
      })
      .slice(0, Math.max(1, highlightLimit))

    const detectedModule =
      types.length > 0 ? types[0].module : moduleName

    return {
      module: detectedModule,
      total: types.length,
      byKind,
      files,
      highlights,
    }
  }

  private rankType(type: ExtractedType, normalizedQuery: string, words: string[]): RankedTypeResult {
    let score = 0
    const matchedIn = new Set<string>()

    const name = type.name.toLowerCase()
    const docs = (type.docs || '').toLowerCase()
    const signature = type.signature.toLowerCase()
    const file = type.file.toLowerCase()
    const moduleName = type.module.toLowerCase()

    if (name === normalizedQuery) {
      score += 160
      matchedIn.add('name:exact')
    } else if (name.startsWith(normalizedQuery)) {
      score += 90
      matchedIn.add('name:prefix')
    } else if (name.includes(normalizedQuery)) {
      score += 60
      matchedIn.add('name:contains')
    }

    if (signature.includes(normalizedQuery)) {
      score += 45
      matchedIn.add('signature')
    }

    if (docs.includes(normalizedQuery)) {
      score += 30
      matchedIn.add('docs')
    }

    if (file.includes(normalizedQuery)) {
      score += 35
      matchedIn.add('file')
    }

    if (moduleName.includes(normalizedQuery)) {
      score += 40
      matchedIn.add('module')
    }

    for (const word of words) {
      if (word.length < 2) continue
      if (name.includes(word)) {
        score += 20
        matchedIn.add('name:word')
      }
      if (signature.includes(word)) {
        score += 12
        matchedIn.add('signature:word')
      }
      if (docs.includes(word)) {
        score += 8
        matchedIn.add('docs:word')
      }
      if (file.includes(word) || moduleName.includes(word)) {
        score += 10
        matchedIn.add('path:word')
      }
    }

    if (normalizedQuery.includes(type.kind)) {
      score += 15
      matchedIn.add('kind')
    }

    return {
      type,
      score,
      matchedIn: Array.from(matchedIn),
    }
  }

  getTypesFromModule(moduleName: string): ExtractedType[] {
    const allTypes = this.extractAllTypes()
    const lowerModule = moduleName.toLowerCase()
    return allTypes.filter(
      (t) =>
        t.module.toLowerCase() === lowerModule || t.file.toLowerCase().includes(lowerModule),
    )
  }

  getTypesByKind(kind: ExtractedKind): ExtractedType[] {
    const allTypes = this.extractAllTypes()
    return allTypes.filter((t) => t.kind === kind)
  }

  getStatistics(): LibraryStatistics {
    const allTypes = this.extractAllTypes()

    const byKind: Record<ExtractedKind, number> = {
      interface: 0,
      type: 0,
      enum: 0,
      function: 0,
      class: 0,
      variable: 0,
      namespace: 0,
      're-export': 0,
    }

    const moduleMap: Map<string, ModuleStatistics> = new Map()

    for (const type of allTypes) {
      byKind[type.kind]++

      if (!moduleMap.has(type.module)) {
        moduleMap.set(type.module, {
          module: type.module,
          interfaces: 0,
          types: 0,
          enums: 0,
          functions: 0,
          classes: 0,
          variables: 0,
          namespaces: 0,
          reExports: 0,
          total: 0,
        })
      }

      const stats = moduleMap.get(type.module)!
      stats.total++

      switch (type.kind) {
        case 'interface':
          stats.interfaces++
          break
        case 'type':
          stats.types++
          break
        case 'enum':
          stats.enums++
          break
        case 'function':
          stats.functions++
          break
        case 'class':
          stats.classes++
          break
        case 'variable':
          stats.variables++
          break
        case 'namespace':
          stats.namespaces++
          break
        case 're-export':
          stats.reExports++
          break
      }
    }

    return {
      totalDeclarations: allTypes.length,
      byKind,
      byModule: Array.from(moduleMap.values()).sort((a, b) => b.total - a.total),
      topInterfaces: allTypes
        .filter((t) => t.kind === 'interface')
        .slice(0, 10)
        .map((t) => t.name),
      topTypes: allTypes
        .filter((t) => t.kind === 'type')
        .slice(0, 10)
        .map((t) => t.name),
      topFunctions: allTypes
        .filter((t) => t.kind === 'function')
        .slice(0, 10)
        .map((t) => t.name),
    }
  }

  getTypeHierarchy(
    typeName: string,
  ): { type: ExtractedType; parents: string[]; children: string[] } | null {
    const allTypes = this.extractAllTypes()
    const type = allTypes.find((t) => t.name.toLowerCase() === typeName.toLowerCase())

    if (!type) return null

    const parents: string[] = []
    const children: string[] = []

    if (type.extends) {
      parents.push(...type.extends)
    }
    if (type.implements) {
      parents.push(...type.implements)
    }

    for (const t of allTypes) {
      if (t.extends?.some((e) => e.includes(type.name))) {
        children.push(t.name)
      }
      if (t.implements?.some((i) => i.includes(type.name))) {
        children.push(t.name)
      }
    }

    return { type, parents, children }
  }

  analyzeDependencies(): DependencyInfo[] {
    const dependencies: Map<string, DependencyInfo> = new Map()
    const allTypes = this.extractAllTypes()

    for (const type of allTypes) {
      if (!dependencies.has(type.module)) {
        dependencies.set(type.module, {
          module: type.module,
          imports: [],
          exports: [type.name],
          reExportsFrom: [],
        })
      } else {
        dependencies.get(type.module)!.exports.push(type.name)
      }

      if (type.kind === 're-export' && type.reExportSource) {
        dependencies.get(type.module)!.reExportsFrom.push(type.reExportSource)
      }
    }

    return Array.from(dependencies.values())
  }

  getVariables(): ExtractedType[] {
    return this.getTypesByKind('variable')
  }

  getConstants(): ExtractedType[] {
    return this.getVariables().filter((v) => v.signature.startsWith('const'))
  }

  getNamespaces(): ExtractedType[] {
    return this.getTypesByKind('namespace')
  }

  getInterfaces(): ExtractedType[] {
    return this.getTypesByKind('interface')
  }

  getEnums(): ExtractedType[] {
    return this.getTypesByKind('enum')
  }

  getFunctions(): ExtractedType[] {
    return this.getTypesByKind('function')
  }

  getClasses(): ExtractedType[] {
    return this.getTypesByKind('class')
  }

  getTypes(): ExtractedType[] {
    return this.getTypesByKind('type')
  }
}

import { AstParser, ExtractedType } from './ast-parser.js'
import { ProtoParser } from './proto-parser.js'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export class ParserCache {
  private static instances = new Map<string, ParserCache>()

  private parser: AstParser | null = null
  private protoParser: ProtoParser | null = null
  private typesCache: CacheEntry<ExtractedType[]> | null = null
  private ttl: number

  private constructor(
    private readonly srcPath: string,
    ttl?: number,
  ) {
    this.ttl = ttl ?? DEFAULT_TTL
  }

  static getInstance(srcPath: string, ttl?: number): ParserCache {
    const existing = ParserCache.instances.get(srcPath)
    if (existing) return existing

    const instance = new ParserCache(srcPath, ttl)
    ParserCache.instances.set(srcPath, instance)
    return instance
  }

  getParser(): AstParser {
    if (!this.parser) {
      this.parser = new AstParser(this.srcPath)
    }
    return this.parser
  }

  getProtoParser(): ProtoParser {
    if (!this.protoParser) {
      this.protoParser = new ProtoParser(this.srcPath)
    }
    return this.protoParser
  }

  getCachedTypes(): ExtractedType[] {
    if (this.typesCache && Date.now() - this.typesCache.timestamp < this.ttl) {
      return this.typesCache.data
    }

    const parser = this.getParser()
    const types = parser.extractAllTypes()

    this.typesCache = { data: types, timestamp: Date.now() }
    return types
  }

  isCacheValid(): boolean {
    return this.typesCache !== null && Date.now() - this.typesCache.timestamp < this.ttl
  }

  invalidate(): void {
    this.parser = null
    this.protoParser?.invalidate()
    this.protoParser = null
    this.typesCache = null
    console.error('🔄 ParserCache invalidated')
  }

  static invalidateAll(): void {
    for (const instance of ParserCache.instances.values()) {
      instance.invalidate()
    }
  }
}

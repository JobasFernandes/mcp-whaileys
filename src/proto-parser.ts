import { Project, SourceFile, ModuleDeclaration, InterfaceDeclaration, EnumDeclaration, ClassDeclaration } from 'ts-morph'
import * as path from 'path'
import * as fs from 'fs'

export type ProtoCategory =
  | 'text'
  | 'media'
  | 'interactive'
  | 'system'
  | 'payment'
  | 'group'
  | 'poll'
  | 'contact'
  | 'location'
  | 'reaction'
  | 'call'
  | 'status'
  | 'newsletter'
  | 'other'

export interface ProtoField {
  name: string
  type: string
  optional: boolean
  repeated: boolean
}

export interface ProtoEnumValue {
  name: string
  value: number
}

export interface ProtoEnum {
  name: string
  fullName: string
  values: ProtoEnumValue[]
}

export interface ProtoNestedType {
  name: string
  fullName: string
  fields: ProtoField[]
  enums: ProtoEnum[]
}

export interface ProtoMessageType {
  name: string
  fullName: string
  fields: ProtoField[]
  enums: ProtoEnum[]
  nestedTypes: ProtoNestedType[]
  oneofGroups: { name: string; options: string[] }[]
  category: ProtoCategory
}

export interface ProtoMessageField {
  name: string
  type: string
  interfaceType: string
  category: ProtoCategory
}

const CATEGORY_MAP: Record<string, ProtoCategory> = {
  conversation: 'text',
  extendedTextMessage: 'text',
  imageMessage: 'media',
  videoMessage: 'media',
  audioMessage: 'media',
  documentMessage: 'media',
  stickerMessage: 'media',
  ptvMessage: 'media',
  lottieStickerMessage: 'media',
  stickerPackMessage: 'media',
  albumMessage: 'media',
  buttonsMessage: 'interactive',
  buttonsResponseMessage: 'interactive',
  listMessage: 'interactive',
  listResponseMessage: 'interactive',
  interactiveMessage: 'interactive',
  interactiveResponseMessage: 'interactive',
  templateMessage: 'interactive',
  templateButtonReplyMessage: 'interactive',
  highlyStructuredMessage: 'interactive',
  protocolMessage: 'system',
  senderKeyDistributionMessage: 'system',
  fastRatchetKeySenderKeyDistributionMessage: 'system',
  deviceSentMessage: 'system',
  messageContextInfo: 'system',
  keepInChatMessage: 'system',
  pinInChatMessage: 'system',
  editedMessage: 'system',
  placeholderMessage: 'system',
  secretEncryptedMessage: 'system',
  messageHistoryBundle: 'system',
  messageHistoryNotice: 'system',
  sendPaymentMessage: 'payment',
  requestPaymentMessage: 'payment',
  declinePaymentRequestMessage: 'payment',
  cancelPaymentRequestMessage: 'payment',
  paymentInviteMessage: 'payment',
  invoiceMessage: 'payment',
  orderMessage: 'payment',
  groupInviteMessage: 'group',
  groupMentionedMessage: 'group',
  groupStatusMessage: 'group',
  groupStatusMessageV2: 'group',
  groupStatusMentionMessage: 'group',
  pollCreationMessage: 'poll',
  pollCreationMessageV2: 'poll',
  pollCreationMessageV3: 'poll',
  pollCreationMessageV4: 'poll',
  pollCreationMessageV5: 'poll',
  pollUpdateMessage: 'poll',
  pollResultSnapshotMessage: 'poll',
  pollResultSnapshotMessageV3: 'poll',
  pollCreationOptionImageMessage: 'poll',
  contactMessage: 'contact',
  contactsArrayMessage: 'contact',
  locationMessage: 'location',
  liveLocationMessage: 'location',
  reactionMessage: 'reaction',
  encReactionMessage: 'reaction',
  commentMessage: 'reaction',
  encCommentMessage: 'reaction',
  call: 'call',
  chat: 'call',
  scheduledCallCreationMessage: 'call',
  scheduledCallEditMessage: 'call',
  callLogMesssage: 'call',
  bcallMessage: 'call',
  viewOnceMessage: 'status',
  viewOnceMessageV2: 'status',
  viewOnceMessageV2Extension: 'status',
  ephemeralMessage: 'status',
  documentWithCaptionMessage: 'status',
  statusMentionMessage: 'status',
  statusAddYours: 'status',
  statusNotificationMessage: 'status',
  statusQuestionAnswerMessage: 'status',
  statusQuotedMessage: 'status',
  statusStickerInteractionMessage: 'status',
  eventMessage: 'status',
  encEventResponseMessage: 'status',
  eventCoverImage: 'status',
  newsletterAdminInviteMessage: 'newsletter',
  newsletterFollowerInviteMessageV2: 'newsletter',
  productMessage: 'other',
  stickerSyncRmrMessage: 'other',
  requestPhoneNumberMessage: 'other',
  botInvokeMessage: 'other',
  botForwardedMessage: 'other',
  botTaskMessage: 'other',
  questionMessage: 'other',
  questionReplyMessage: 'other',
  questionResponseMessage: 'other',
  richResponseMessage: 'other',
  limitSharingMessage: 'other',
  associatedChildMessage: 'other',
}

function categorizeField(name: string): ProtoCategory {
  return CATEGORY_MAP[name] || 'other'
}

function extractFieldsFromInterface(iface: InterfaceDeclaration): ProtoField[] {
  const fields: ProtoField[] = []
  for (const prop of iface.getProperties()) {
    const name = prop.getName()
    const typeText = prop.getType().getText()
    const isOptional = prop.hasQuestionToken()
    const isRepeated = typeText.includes('[]')
    const cleanType = typeText
      .replace(/\s*\|\s*null/g, '')
      .replace(/\s*\|\s*undefined/g, '')
      .trim()

    fields.push({
      name,
      type: cleanType,
      optional: isOptional,
      repeated: isRepeated,
    })
  }
  return fields
}

function extractEnumsFromNamespace(ns: ModuleDeclaration): ProtoEnum[] {
  const enums: ProtoEnum[] = []
  for (const enumDecl of ns.getEnums()) {
    const values: ProtoEnumValue[] = []
    for (const member of enumDecl.getMembers()) {
      values.push({
        name: member.getName(),
        value: member.getValue() as number,
      })
    }
    enums.push({
      name: enumDecl.getName(),
      fullName: `${ns.getName()}.${enumDecl.getName()}`,
      values,
    })
  }
  return enums
}

function extractNestedTypesFromNamespace(ns: ModuleDeclaration): ProtoNestedType[] {
  const nested: ProtoNestedType[] = []
  for (const childNs of ns.getModules()) {
    const childName = childNs.getName()
    const iface = childNs.getInterface(`I${childName}`)
    const fields = iface ? extractFieldsFromInterface(iface) : []
    const enums = extractEnumsFromNamespace(childNs)

    nested.push({
      name: childName,
      fullName: `${ns.getName()}.${childName}`,
      fields,
      enums,
    })
  }
  return nested
}

function extractOneofFromClass(cls: ClassDeclaration): { name: string; options: string[] }[] {
  const oneofs: { name: string; options: string[] }[] = []
  for (const prop of cls.getProperties()) {
    const typeText = prop.getType().getText()
    if (typeText.startsWith('"') || (typeText.includes('"') && typeText.includes('|'))) {
      const options = typeText
        .split('|')
        .map((o) => o.trim().replace(/"/g, ''))
        .filter((o) => o.length > 0)
      if (options.length > 1) {
        oneofs.push({ name: prop.getName(), options })
      }
    }
  }
  return oneofs
}

export class ProtoParser {
  private project: Project | null = null
  private sourceFile: SourceFile | null = null
  private messageFields: ProtoMessageField[] | null = null
  private messageTypes: Map<string, ProtoMessageType> | null = null

  constructor(private readonly srcPath: string) {}

  private getProtoPath(): string {
    return path.resolve(this.srcPath, '..', 'WAProto', 'index.d.ts')
  }

  isAvailable(): boolean {
    return fs.existsSync(this.getProtoPath())
  }

  private ensureProject(): void {
    if (this.project) return

    const protoPath = this.getProtoPath()
    if (!fs.existsSync(protoPath)) {
      throw new Error(`WAProto/index.d.ts not found at: ${protoPath}`)
    }

    this.project = new Project({
      skipLoadingLibFiles: true,
      skipFileDependencyResolution: true,
      compilerOptions: {
        skipLibCheck: true,
        skipDefaultLibCheck: true,
      },
    })

    this.sourceFile = this.project.addSourceFileAtPath(protoPath)
  }

  private getMessageNamespace(): ModuleDeclaration {
    this.ensureProject()

    const protoNs = this.sourceFile!.getModule('proto')
    if (!protoNs) throw new Error('Namespace "proto" not found in WAProto')

    const messageNs = protoNs.getModule('Message')
    if (!messageNs) throw new Error('Namespace "proto.Message" not found')

    return messageNs
  }

  getMessageFields(): ProtoMessageField[] {
    if (this.messageFields) return this.messageFields

    this.ensureProject()

    const protoNs = this.sourceFile!.getModule('proto')
    if (!protoNs) throw new Error('Namespace "proto" not found')

    const messageNs = protoNs.getModule('Message')
    if (!messageNs) throw new Error('Namespace "proto.Message" not found')

    const iMessage = messageNs.getInterface('IMessage') || protoNs.getInterface('IMessage')

    let fields: ProtoMessageField[] = []

    if (iMessage) {
      for (const prop of iMessage.getProperties()) {
        const name = prop.getName()
        const typeText = prop.getType().getText()
        const cleanType = typeText
          .replace(/\s*\|\s*null/g, '')
          .replace(/\s*\|\s*undefined/g, '')
          .trim()

        fields.push({
          name,
          type: cleanType,
          interfaceType: cleanType.replace(/^proto\.Message\./, '').replace(/^proto\./, ''),
          category: categorizeField(name),
        })
      }
    } else {
      const messageIface = protoNs.getInterfaces().find((i) => i.getName() === 'IMessage')
      if (messageIface) {
        for (const prop of messageIface.getProperties()) {
          const name = prop.getName()
          const rawType = prop.getType().getText()
          const cleanType = rawType.replace(/\s*\|\s*null/g, '').replace(/\s*\|\s*undefined/g, '').trim()
          fields.push({
            name,
            type: cleanType,
            interfaceType: cleanType.replace(/^proto\.Message\./, '').replace(/^proto\./, ''),
            category: categorizeField(name),
          })
        }
      }
    }

    this.messageFields = fields
    return fields
  }

  getMessageType(typeName: string): ProtoMessageType | undefined {
    if (this.messageTypes?.has(typeName)) {
      return this.messageTypes.get(typeName)
    }

    const messageNs = this.getMessageNamespace()
    const targetNs = messageNs.getModule(typeName)

    const iface = messageNs.getInterface(`I${typeName}`)
    const cls = messageNs.getClass(typeName)

    if (!iface && !targetNs && !cls) return undefined

    const fields = iface ? extractFieldsFromInterface(iface) : []
    const enums = targetNs ? extractEnumsFromNamespace(targetNs) : []
    const nestedTypes = targetNs ? extractNestedTypesFromNamespace(targetNs) : []
    const oneofGroups = cls ? extractOneofFromClass(cls) : []

    const msgType: ProtoMessageType = {
      name: typeName,
      fullName: `proto.Message.${typeName}`,
      fields,
      enums,
      nestedTypes,
      oneofGroups,
      category: categorizeField(typeName.replace(/Message$/, '').charAt(0).toLowerCase() + typeName.replace(/Message$/, '').slice(1)),
    }

    if (!this.messageTypes) this.messageTypes = new Map()
    this.messageTypes.set(typeName, msgType)

    return msgType
  }

  getAllMessageTypes(): ProtoMessageType[] {
    const messageNs = this.getMessageNamespace()
    const types: ProtoMessageType[] = []

    for (const childNs of messageNs.getModules()) {
      const name = childNs.getName()
      const existing = this.getMessageType(name)
      if (existing) types.push(existing)
    }

    return types
  }

  searchMessageTypes(query: string): ProtoMessageType[] {
    const q = query.toLowerCase()
    const allTypes = this.getAllMessageTypes()
    return allTypes.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.fullName.toLowerCase().includes(q),
    )
  }

  getMessageTypesByCategory(category: ProtoCategory): ProtoMessageField[] {
    return this.getMessageFields().filter((f) => f.category === category)
  }

  invalidate(): void {
    this.project = null
    this.sourceFile = null
    this.messageFields = null
    this.messageTypes = null
  }
}

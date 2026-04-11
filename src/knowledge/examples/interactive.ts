import type { CodeExample } from './index.js'

export const INTERACTIVE_EXAMPLES: CodeExample[] = [
  {
    id: 'send-buttons',
    title: 'Send Buttons Message',
    description: 'Send a message with interactive buttons. Requires "as any" cast due to missing types in Whaileys.',
    code: `await socket.sendMessage(jid, {
  text: 'Choose an option:',
  footer: 'Powered by Whaileys',
  buttons: [
    { buttonId: 'btn1', buttonText: { displayText: 'Option 1' }, type: 1 },
    { buttonId: 'btn2', buttonText: { displayText: 'Option 2' }, type: 1 },
    { buttonId: 'btn3', buttonText: { displayText: 'Option 3' }, type: 1 },
  ],
} as any)`,
    tags: ['interactive', 'buttons', 'sendMessage'],
  },
  {
    id: 'send-list',
    title: 'Send List Message',
    description: 'Send a message with a selectable list of options organized in sections.',
    code: `await socket.sendMessage(jid, {
  text: 'Select from the menu:',
  footer: 'Tap the button below',
  title: 'Menu',
  buttonText: 'View Options',
  sections: [
    {
      title: 'Category 1',
      rows: [
        { rowId: 'row1', title: 'Option A', description: 'Description for A' },
        { rowId: 'row2', title: 'Option B', description: 'Description for B' },
      ],
    },
    {
      title: 'Category 2',
      rows: [
        { rowId: 'row3', title: 'Option C', description: 'Description for C' },
      ],
    },
  ],
})`,
    tags: ['interactive', 'list', 'sections', 'sendMessage'],
  },
  {
    id: 'send-template',
    title: 'Send Template Buttons',
    description: 'Send a message with template buttons (URL, call, quick reply) using generateWAMessageFromContent.',
    code: `import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

const msg = generateWAMessageFromContent(jid, proto.Message.fromObject({
  templateMessage: {
    hydratedTemplate: {
      hydratedContentText: 'Template content',
      hydratedFooterText: 'Footer text',
      hydratedButtons: [
        { urlButton: { displayText: 'Visit Site', url: 'https://example.com' } },
        { callButton: { displayText: 'Call Us', phoneNumber: '+5511999999999' } },
        { quickReplyButton: { displayText: 'Quick Reply', id: 'qr1' } },
      ],
    },
  },
}), {})

await socket.relayMessage(jid, msg.message!, { messageId: msg.key.id! })`,
    tags: ['interactive', 'template', 'url', 'call', 'quickReply', 'relayMessage', 'generateWAMessageFromContent'],
  },
  {
    id: 'send-carousel',
    title: 'Send Carousel Message',
    description: 'Send a carousel with multiple cards (max 10). Uses viewOnceMessage > interactiveMessage > carouselMessage nesting with prepareWAMessageMedia for images.',
    code: `import {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto
} from '@whiskeysockets/baileys'

const cards = []

for (const item of items.slice(0, 10)) {
  const media = await prepareWAMessageMedia(
    { image: { url: item.imageUrl } },
    { upload: socket.waUploadToServer }
  )

  cards.push({
    header: proto.Message.InteractiveMessage.Header.fromObject({
      title: item.title,
      hasMediaAttachment: true,
      imageMessage: media.imageMessage,
    }),
    body: proto.Message.InteractiveMessage.Body.fromObject({
      text: item.description,
    }),
    footer: proto.Message.InteractiveMessage.Footer.fromObject({
      text: item.footer,
    }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
      buttons: [
        {
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: 'Select',
            id: item.id,
          }),
        },
      ],
    }),
  })
}

const msg = generateWAMessageFromContent(jid, proto.Message.fromObject({
  viewOnceMessage: {
    message: {
      interactiveMessage: proto.Message.InteractiveMessage.fromObject({
        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
          cards,
        }),
        header: proto.Message.InteractiveMessage.Header.fromObject({
          hasMediaAttachment: false,
        }),
        body: proto.Message.InteractiveMessage.Body.fromObject({
          text: 'Browse our catalog:',
        }),
        footer: proto.Message.InteractiveMessage.Footer.fromObject({
          text: 'Swipe to see more',
        }),
      }),
    },
  },
}), {})

await socket.relayMessage(jid, msg.message!, { messageId: msg.key.id! })`,
    tags: ['interactive', 'carousel', 'cards', 'prepareWAMessageMedia', 'relayMessage', 'viewOnceMessage', 'nativeFlowMessage'],
  },
  {
    id: 'send-native-flow',
    title: 'Send Native Flow Message',
    description: 'Send an interactive message with native flow buttons (used for custom flows like payments).',
    code: `import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

const msg = generateWAMessageFromContent(jid, proto.Message.fromObject({
  viewOnceMessage: {
    message: {
      interactiveMessage: proto.Message.InteractiveMessage.fromObject({
        header: proto.Message.InteractiveMessage.Header.fromObject({
          title: 'Payment',
          hasMediaAttachment: false,
        }),
        body: proto.Message.InteractiveMessage.Body.fromObject({
          text: 'Complete your payment:',
        }),
        footer: proto.Message.InteractiveMessage.Footer.fromObject({
          text: 'Secure payment',
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
          buttons: [
            {
              name: 'payment_info',
              buttonParamsJson: JSON.stringify({
                type: 'pix_static_code',
                code: 'PIX_CODE_HERE',
                merchant_name: 'Store Name',
                currency: 'BRL',
                amount: 1990,
              }),
            },
          ],
        }),
      }),
    },
  },
}), {})

await socket.relayMessage(jid, msg.message!, { messageId: msg.key.id! })`,
    tags: ['interactive', 'nativeFlow', 'payment', 'pix', 'relayMessage'],
  },
]

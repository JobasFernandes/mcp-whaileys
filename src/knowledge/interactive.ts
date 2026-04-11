export interface InteractiveTypeInfo {
  name: string
  protoName: string
  mixin?: string
  description: string
  structure: string
  headerTypes?: string[]
  sendingPattern: 'simple' | 'advanced'
  notes: string
}

export const INTERACTIVE_TYPES: InteractiveTypeInfo[] = [
  {
    name: 'buttons',
    protoName: 'ButtonsMessage',
    mixin: 'Buttonable',
    description: 'Message with up to 3 clickable quick-reply buttons. Supports text, image, video, or document as header.',
    structure: `// Content shape (must cast as any)
{
  text: string,            // Body text
  footer?: string,         // Footer text (gray, smaller)
  buttons: [
    {
      buttonId: string,    // Unique ID returned on click
      buttonText: {
        displayText: string  // Button label
      },
      type: 1              // Always 1 for reply buttons
    }
  ]
} as any`,
    headerTypes: ['EMPTY', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'],
    sendingPattern: 'simple',
    notes: `PRODUCTION PATTERN from API_WHAILEYS:
- MUST cast content to \`as any\` due to missing/broken types in Baileys
- Max 3 buttons
- Uses socket.sendMessage(jid, content) directly
- Button type is always 1 (quick reply)
- Header is set via headerType enum and corresponding field (text/image/video/document)`,
  },
  {
    name: 'list',
    protoName: 'ListMessage',
    mixin: 'Listable',
    description: 'Message with a "view menu" button that opens a selectable list organized into sections with rows.',
    structure: `{
  text: string,              // Body text
  footer?: string,           // Footer text
  title?: string,            // Title above the body
  buttonText: string,        // Text on the "view list" button
  sections: [
    {
      title: string,         // Section header
      rows: [
        {
          rowId: string,     // Unique ID returned on selection
          title: string,     // Row title
          description?: string // Row description (smaller text)
        }
      ]
    }
  ]
}`,
    sendingPattern: 'simple',
    notes: `PRODUCTION PATTERN from API_WHAILEYS:
- Uses socket.sendMessage(jid, content) directly
- Multiple sections supported, each with its own title
- buttonText is the call-to-action text that opens the list
- rowId is returned when the user selects an option`,
  },
  {
    name: 'template',
    protoName: 'TemplateMessage',
    mixin: 'Templatable',
    description: 'Template message with hydrated buttons: call, URL, or quick reply.',
    structure: `{
  text: string,                    // Body text
  footer?: string,                 // Footer text
  templateButtons: [
    // Call button
    {
      index: 1,
      callButton: {
        displayText: string,
        phoneNumber: string        // Full phone number with country code
      }
    },
    // URL button
    {
      index: 2,
      urlButton: {
        displayText: string,
        url: string                // Full URL (https://...)
      }
    },
    // Quick reply button
    {
      index: 3,
      quickReplyButton: {
        displayText: string,
        id: string                 // Button ID returned on click
      }
    }
  ]
}`,
    sendingPattern: 'simple',
    notes: `- Mixin Templatable adds templateButtons and footer to text, image, video, document messages
- Max 3 buttons of mixed types
- Index determines button order`,
  },
  {
    name: 'carousel',
    protoName: 'InteractiveMessage (CarouselMessage)',
    description: 'Horizontal scrollable carousel with up to 10 cards, each with image, text, and buttons. Most complex message type.',
    structure: `// Built with generateWAMessageFromContent + relayMessage
{
  viewOnceMessage: {
    message: {
      interactiveMessage: {
        header: { hasMediaAttachment: true },
        body: { text: 'carousel body' },
        carouselMessage: {
          cards: [
            // Each card (max 10):
            {
              header: {
                imageMessage: await prepareWAMessageMedia(
                  { image: { url: 'https://...' } },
                  { upload: socket.waUploadToServer }
                ),
                hasMediaAttachment: true,
              },
              body: { text: 'Card description' },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                      display_text: 'Button Label',
                      id: 'button_id'
                    })
                  }
                ]
              }
            }
          ],
          messageVersion: 1
        }
      }
    }
  }
}`,
    sendingPattern: 'advanced',
    notes: `PRODUCTION PATTERN from API_WHAILEYS (carousel-message.sender.ts):
- MOST COMPLEX sender — uses generateWAMessageFromContent + socket.relayMessage (NOT sendMessage)
- Triple nesting: viewOnceMessage > interactiveMessage > carouselMessage
- Each card uses prepareWAMessageMedia for image upload
- Buttons use nativeFlowMessage with quick_reply name
- buttonParamsJson must be JSON.stringify'd: { display_text, id }
- Max 10 cards per carousel
- messageVersion: 1 is required`,
  },
  {
    name: 'native_flow',
    protoName: 'InteractiveMessage (NativeFlowMessage)',
    description: 'Native flow interactive message for custom actions like Pix payments, surveys, and flows.',
    structure: `// Pix/Payment example (built with generateWAMessageFromContent + relayMessage)
{
  viewOnceMessage: {
    message: {
      interactiveMessage: {
        header: { hasMediaAttachment: false },
        body: { text: 'Payment description' },
        footer: { text: 'Footer text' },
        nativeFlowMessage: {
          buttons: [
            {
              name: 'payment_info',
              buttonParamsJson: JSON.stringify({
                type: 'pix_static_code',
                currency: 'BRL',
                total_amount: {
                  value: 1000,          // Cents (R$ 10.00)
                  offset: 100
                },
                reference_id: 'order_123',
                pix_static_code: {
                  merchant_name: 'Store Name',
                  key: 'pix@email.com',
                  key_type: 'EMAIL',     // EMAIL, CPF, CNPJ, PHONE, EVP
                  merchant_city: 'City'
                }
              })
            }
          ],
          messageParamsJson: ''
        }
      }
    }
  }
}`,
    sendingPattern: 'advanced',
    notes: `PRODUCTION PATTERN from API_WHAILEYS (pix-message.sender.ts):
- Uses generateWAMessageFromContent + socket.relayMessage
- nativeFlowMessage buttons use name: 'payment_info' for Pix
- buttonParamsJson contains the full payment config as JSON string
- pix_static_code key_type can be: EMAIL, CPF, CNPJ, PHONE, EVP
- total_amount.value is in cents, offset is the divisor (100 = divide by 100)
- Can also be used for other native flows (surveys, forms)`,
  },
]

export function getInteractiveByName(name: string): InteractiveTypeInfo | undefined {
  return INTERACTIVE_TYPES.find((t) => t.name.toLowerCase() === name.toLowerCase())
}

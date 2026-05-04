import { PackChatChannel } from '@packchat/codec/pack-chat/pack-chat-channel'
import { PackChatMessageId } from '@packchat/codec/pack-chat/pack-chat-message-id'
import { PackChatMessage, RootMessage } from '@packchat/codec/pack-chat/pack-chat-message'

const CHANNEL_BYTES = new Uint32Array([0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c])
const MESSAGE_ID_BYTES = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34])
const HELLO_TEXT_BYTES = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])

describe('RootMessage', () => {
  const channel = new PackChatChannel('general')
  const messageId = new PackChatMessageId(0x123456789abc, 0x1234)

  describe('constructor', () => {
    let message: RootMessage

    beforeEach(() => {
      message = new RootMessage(channel, messageId, 'Hello world!')
    })

    it('sets channel', () => {
      expect(message.channel).toBe(channel)
    })

    it('sets messageId', () => {
      expect(message.messageId).toBe(messageId)
    })

    it('sets text', () => {
      expect(message.text).toBe('Hello world!')
    })
  })

  describe('#encode()', () => {
    it('encodes to correct bytes', () => {
      const message = new RootMessage(channel, messageId, 'Hello')
      const encoded = message.encode()

      const expected = new Uint8Array([0x00, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...HELLO_TEXT_BYTES])
      expect(encoded).toEqual(expected)
    })
  })

  it('encodes and decodes back to the original values', () => {
    const message = new RootMessage(channel, messageId, 'Hello')
    const encoded = message.encode()
    const decoded = PackChatMessage.decode(encoded) as RootMessage
    expect(decoded).toBeInstanceOf(RootMessage)
    expect(decoded.channel.name).toBe('general')
    expect(decoded.messageId.value).toBe(messageId.value)
    expect(decoded.text).toBe('Hello')
  })
})

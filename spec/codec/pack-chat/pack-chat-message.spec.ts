import { PackChatChannel } from '@lib/codec/pack-chat/pack-chat-channel'
import { PackChatMessageId } from '@lib/codec/pack-chat/pack-chat-message-id'
import { PackChatMessage, RootMessage } from '@lib/codec/pack-chat/pack-chat-message'

const FORMAT_BYTE = 0x00 // version=0, type=0 (ROOT), reserved=0
const CHANNEL_BYTES = new Uint32Array([0x61, 0x62, 0x63, 0x20, 0x20, 0x20, 0x20])
const MESSAGE_ID_BYTES = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34])
const TEXT_BYTES = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21])

const ENCODED_MESSAGE = new Uint8Array([FORMAT_BYTE, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...TEXT_BYTES])

describe('PackChatMessage.decode', () => {
  describe('.decode()', () => {
    let decoded: RootMessage

    beforeEach(() => (decoded = PackChatMessage.decode(ENCODED_MESSAGE) as RootMessage))

    it('decodes a RootMessage', () => expect(decoded).toBeInstanceOf(RootMessage))
    it('decodes the channel name', () => expect(decoded.channel.name).toBe('abc'))
    it('decodes the message ID', () => expect(decoded.messageId.value).toBe(0x123456789abc1234n))
    it('decodes the text', () => expect(decoded.text).toBe('Hello world!'))
  })

  it('encodes and decodes back to the original values', () => {
    const channel = new PackChatChannel('abc')
    const messageId = new PackChatMessageId(0x123456789abc, 0x1234)
    const message = new RootMessage(channel, messageId, 'Hello world!')
    const encoded = message.encode()
    const decoded = PackChatMessage.decode(encoded) as RootMessage
    expect(decoded).toBeInstanceOf(RootMessage)
    expect(decoded.channel.name).toBe('abc')
    expect(decoded.messageId.value).toBe(messageId.value)
    expect(decoded.text).toBe('Hello world!')
  })
})

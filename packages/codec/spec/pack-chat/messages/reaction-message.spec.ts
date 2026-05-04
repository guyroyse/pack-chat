import { PackChatChannel } from '@packchat/codec/pack-chat/pack-chat-channel'
import { PackChatMessageId } from '@packchat/codec/pack-chat/pack-chat-message-id'
import { PackChatMessage, ReactionMessage } from '@packchat/codec/pack-chat/pack-chat-message'

const CHANNEL_BYTES = new Uint32Array([0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c])
const MESSAGE_ID_BYTES = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34])
const REACT_TO_ID_BYTES = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x9a, 0xbc])
const HORNS_EMOJI_BYTES = new Uint8Array([0xf0, 0x9f, 0xa4, 0x98, 0xf0, 0x9f, 0x8f, 0xbb])

describe('ReactionMessage', () => {
  const channel = new PackChatChannel('general')
  const messageId = new PackChatMessageId(0x123456789abc, 0x1234)
  const reactToId = new PackChatMessageId(0x112233445566, 0x9abc)

  describe('constructor', () => {
    let message: ReactionMessage

    beforeEach(() => {
      message = new ReactionMessage(channel, messageId, reactToId, '🤘🏻')
    })

    it('sets channel', () => {
      expect(message.channel).toBe(channel)
    })

    it('sets messageId', () => {
      expect(message.messageId).toBe(messageId)
    })

    it('sets reactToId', () => {
      expect(message.reactToId).toBe(reactToId)
    })

    it('sets emoji', () => {
      expect(message.emoji).toBe('🤘🏻')
    })
  })

  describe('#encode()', () => {
    it('encodes to correct bytes', () => {
      const message = new ReactionMessage(channel, messageId, reactToId, '🤘🏻')
      const encoded = message.encode()

      const expected = new Uint8Array([0x08, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...REACT_TO_ID_BYTES, ...HORNS_EMOJI_BYTES])
      expect(encoded).toEqual(expected)
    })
  })

  it('encodes and decodes back to the original values', () => {
    const message = new ReactionMessage(channel, messageId, reactToId, '🤘🏻')
    const encoded = message.encode()
    const decoded = PackChatMessage.decode(encoded) as ReactionMessage
    expect(decoded).toBeInstanceOf(ReactionMessage)
    expect(decoded.channel.name).toBe('general')
    expect(decoded.messageId.value).toBe(messageId.value)
    expect(decoded.reactToId.value).toBe(reactToId.value)
    expect(decoded.emoji).toBe('🤘🏻')
  })

})

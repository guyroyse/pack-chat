import { PackChatChannel } from '@lib/codec/pack-chat/pack-chat-channel'
import { PackChatMessageId } from '@lib/codec/pack-chat/pack-chat-message-id'
import { PackChatMessage, ReplyMessage } from '@lib/codec/pack-chat/pack-chat-message'

const CHANNEL_BYTES = new Uint32Array([0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c])
const MESSAGE_ID_BYTES = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34])
const REPLY_TO_ID_BYTES = new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x56, 0x78])
const REPLY_TEXT_BYTES = new Uint8Array([0x52, 0x65, 0x70, 0x6c, 0x79])

describe('ReplyMessage', () => {
  const channel = new PackChatChannel('general')
  const messageId = new PackChatMessageId(0x123456789abc, 0x1234)
  const replyToId = new PackChatMessageId(0xaabbccddeeff, 0x5678)

  describe('constructor', () => {
    let message: ReplyMessage

    beforeEach(() => {
      message = new ReplyMessage(channel, messageId, replyToId, 'This is a reply')
    })

    it('sets channel', () => {
      expect(message.channel).toBe(channel)
    })

    it('sets messageId', () => {
      expect(message.messageId).toBe(messageId)
    })

    it('sets replyToId', () => {
      expect(message.replyToId).toBe(replyToId)
    })

    it('sets text', () => {
      expect(message.text).toBe('This is a reply')
    })
  })

  describe('#encode()', () => {
    it('encodes to correct bytes', () => {
      const message = new ReplyMessage(channel, messageId, replyToId, 'Reply')
      const encoded = message.encode()

      const expected = new Uint8Array([0x04, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...REPLY_TO_ID_BYTES, ...REPLY_TEXT_BYTES])
      expect(encoded).toEqual(expected)
    })
  })

  it('encodes and decodes back to the original values', () => {
    const message = new ReplyMessage(channel, messageId, replyToId, 'Reply')
    const encoded = message.encode()
    const decoded = PackChatMessage.decode(encoded) as ReplyMessage
    expect(decoded).toBeInstanceOf(ReplyMessage)
    expect(decoded.channel.name).toBe('general')
    expect(decoded.messageId.value).toBe(messageId.value)
    expect(decoded.replyToId.value).toBe(replyToId.value)
    expect(decoded.text).toBe('Reply')
  })
})

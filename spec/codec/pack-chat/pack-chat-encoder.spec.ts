import { PackChatChannel } from '@lib/codec/pack-chat/pack-chat-channel'
import { encodePackChatMessage } from '@lib/codec/pack-chat/pack-chat-encoder'
import { PackChatMessageId } from '@lib/codec/pack-chat/pack-chat-message-id'
import { MessageType } from '@lib/codec/pack-chat/pack-chat-types'

const CHANNEL_BYTES = new Uint32Array([0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c])
const MESSAGE_ID_BYTES = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34])
const REPLY_TO_ID_BYTES = new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x56, 0x78])
const REACT_TO_ID_BYTES = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x9a, 0xbc])
const EDIT_ID_BYTES = new Uint8Array([0xff, 0xee, 0xdd, 0xcc, 0xbb, 0xaa, 0xde, 0xf0])
const DELETE_ID_BYTES = new Uint8Array([0x99, 0x88, 0x77, 0x66, 0x55, 0x44, 0x32, 0x10])

const HELLO_TEXT_BYTES = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])
const REPLY_TEXT_BYTES = new Uint8Array([0x52, 0x65, 0x70, 0x6c, 0x79, 0x20, 0x74, 0x65, 0x78, 0x74])
const THUMBS_UP_EMOJI_BYTES = new Uint8Array([0xf0, 0x9f, 0x91, 0x8d])
const UPDATED_TEXT_BYTES = new Uint8Array([0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x64, 0x20, 0x74, 0x65, 0x78, 0x74])

describe('encodePackChatMessage', () => {
  const channel = new PackChatChannel('general')
  const messageId = new PackChatMessageId(0x123456789abc, 0x1234)
  const replyToId = new PackChatMessageId(0xaabbccddeeff, 0x5678)
  const reactToId = new PackChatMessageId(0x112233445566, 0x9abc)
  const editId = new PackChatMessageId(0xffeeddccbbaa, 0xdef0)
  const deleteId = new PackChatMessageId(0x998877665544, 0x3210)

  describe('ROOT messages', () => {
    it.each([
      {
        description: 'encodes message with text',
        text: 'Hello',
        expectedBytes: new Uint8Array([0x00, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...HELLO_TEXT_BYTES]),
        expectedLength: 21
      },
      {
        description: 'encodes message with empty text',
        text: '',
        expectedBytes: new Uint8Array([0x00, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES]),
        expectedLength: 16
      }
    ])('$description', ({ text, expectedBytes, expectedLength }) => {
      const encoded = encodePackChatMessage({
        type: MessageType.ROOT,
        channel,
        messageId,
        text
      })

      expect(encoded).toEqual(expectedBytes)
      expect(encoded.length).toBe(expectedLength)
      expect(encoded[0]).toBe(0x00)
    })

    it('encodes message with maximum text length', () => {
      const maxText = 'x'.repeat(224)
      const encoded = encodePackChatMessage({
        type: MessageType.ROOT,
        channel,
        messageId,
        text: maxText
      })

      expect(encoded.length).toBe(8 + 8 + 224)
    })

    it('throws error if text exceeds maximum length', () => {
      const tooLongText = 'x'.repeat(225)

      expect(() =>
        encodePackChatMessage({
          type: MessageType.ROOT,
          channel,
          messageId,
          text: tooLongText
        })
      ).toThrow('Text exceeds maximum length: 225 bytes (max 224).')
    })
  })

  describe('REPLY messages', () => {
    it('encodes message with reply-to ID', () => {
      const encoded = encodePackChatMessage({
        type: MessageType.REPLY,
        channel,
        messageId,
        replyToId,
        text: 'Reply text'
      })

      const expected = new Uint8Array([0x04, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...REPLY_TO_ID_BYTES, ...REPLY_TEXT_BYTES])
      expect(encoded).toEqual(expected)
      expect(encoded.length).toBe(34)
      expect(encoded[0]).toBe(0x04)
    })
  })

  describe('REACTION messages', () => {
    it('encodes message with emoji', () => {
      const encoded = encodePackChatMessage({
        type: MessageType.REACTION,
        channel,
        messageId,
        reactToId,
        emoji: '👍'
      })

      const expected = new Uint8Array([0x08, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...REACT_TO_ID_BYTES, ...THUMBS_UP_EMOJI_BYTES])
      expect(encoded).toEqual(expected)
      expect(encoded.length).toBe(28)
      expect(encoded[0]).toBe(0x08)
    })
  })

  describe('EDIT messages', () => {
    it('encodes message with edit ID', () => {
      const encoded = encodePackChatMessage({
        type: MessageType.EDIT,
        channel,
        messageId,
        editId,
        text: 'Updated text'
      })

      const expected = new Uint8Array([0x0c, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...EDIT_ID_BYTES, ...UPDATED_TEXT_BYTES])
      expect(encoded).toEqual(expected)
      expect(encoded.length).toBe(36)
      expect(encoded[0]).toBe(0x0c)
    })
  })

  describe('DELETE messages', () => {
    it('encodes message with delete ID', () => {
      const encoded = encodePackChatMessage({
        type: MessageType.DELETE,
        channel,
        messageId,
        deleteId
      })

      const expected = new Uint8Array([0x10, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...DELETE_ID_BYTES])
      expect(encoded).toEqual(expected)
      expect(encoded.length).toBe(24)
      expect(encoded[0]).toBe(0x10)
    })
  })

  describe('header encoding', () => {
    it('encodes channel name in bytes 1-7', () => {
      const encoded = encodePackChatMessage({
        type: MessageType.ROOT,
        channel,
        messageId,
        text: 'Hello'
      })

      expect(encoded[1]).toBe(0x67)
      expect(encoded[2]).toBe(0x65)
      expect(encoded[3]).toBe(0x6e)
    })
  })
})

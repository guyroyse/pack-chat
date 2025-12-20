import { PackChatChannel } from '@lib/codec/pack-chat/pack-chat-channel'
import { encodePackChatMessage } from '@lib/codec/pack-chat/pack-chat-encoder'
import { PackChatMessageId } from '@lib/codec/pack-chat/pack-chat-message-id'
import { MessageType } from '@lib/codec/pack-chat/types'

describe('encodePackChatMessage', () => {
  const channel = new PackChatChannel('general')
  const messageId = new PackChatMessageId(0x123456789abc, 0x1234)
  const replyToId = new PackChatMessageId(0xaabbccddeeff, 0x5678)
  const reactToId = new PackChatMessageId(0x112233445566, 0x9abc)
  const editId = new PackChatMessageId(0xffeeddccbbaa, 0xdef0)
  const deleteId = new PackChatMessageId(0x998877665544, 0x3210)

  describe('ROOT messages', () => {
    it('encodes message with text', () => {
      const encoded = encodePackChatMessage({
        type: MessageType.ROOT,
        channel,
        messageId,
        text: 'Hello',
      })

      expect(encoded.length).toBe(8 + 8 + 5) // header + id + text
      expect(encoded[0]).toBe(0x00) // version=0, type=0, reserved=0
    })

    it('encodes message with empty text', () => {
      const encoded = encodePackChatMessage({
        type: MessageType.ROOT,
        channel,
        messageId,
        text: '',
      })

      expect(encoded.length).toBe(8 + 8) // header + id, no text
    })

    it('encodes message with maximum text length', () => {
      const maxText = 'x'.repeat(224)
      const encoded = encodePackChatMessage({
        type: MessageType.ROOT,
        channel,
        messageId,
        text: maxText,
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
          text: tooLongText,
        })
      ).toThrow(/text exceeds maximum length/i)
    })
  })

  describe('REPLY messages', () => {
    it('encodes message with reply-to ID', () => {
      const encoded = encodePackChatMessage({
        type: MessageType.REPLY,
        channel,
        messageId,
        replyToId,
        text: 'Reply text',
      })

      expect(encoded.length).toBe(8 + 8 + 8 + 10) // header + id + reply-to-id + text
      expect(encoded[0]).toBe(0x04) // version=0, type=1, reserved=0
    })
  })

  describe('REACTION messages', () => {
    it('encodes message with emoji', () => {
      const encoded = encodePackChatMessage({
        type: MessageType.REACTION,
        channel,
        reactToId,
        emoji: '👍',
      })

      expect(encoded.length).toBe(8 + 8 + 4) // header + id + emoji (4 bytes UTF-8)
      expect(encoded[0]).toBe(0x08) // version=0, type=2, reserved=0
    })
  })

  describe('EDIT messages', () => {
    it('encodes message with edit ID', () => {
      const encoded = encodePackChatMessage({
        type: MessageType.EDIT,
        channel,
        messageId,
        editId,
        text: 'Updated text',
      })

      expect(encoded.length).toBe(8 + 8 + 8 + 12) // header + id + edit-id + text
      expect(encoded[0]).toBe(0x0c) // version=0, type=3, reserved=0
    })
  })

  describe('DELETE messages', () => {
    it('encodes message with delete ID', () => {
      const encoded = encodePackChatMessage({
        type: MessageType.DELETE,
        channel,
        messageId,
        deleteId,
      })

      expect(encoded.length).toBe(8 + 8 + 8) // header + id + delete-id, no text
      expect(encoded[0]).toBe(0x10) // version=0, type=4, reserved=0
    })
  })

  describe('header encoding', () => {
    it('encodes channel name in bytes 1-7', () => {
      const encoded = encodePackChatMessage({
        type: MessageType.ROOT,
        channel,
        messageId,
        text: 'Hello',
      })

      // 'general' encoded
      expect(encoded[1]).toBe(0x67) // 'g'
      expect(encoded[2]).toBe(0x65) // 'e'
      expect(encoded[3]).toBe(0x6e) // 'n'
    })
  })
})

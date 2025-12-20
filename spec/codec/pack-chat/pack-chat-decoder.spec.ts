import { PackChatChannel } from '@lib/codec/pack-chat/pack-chat-channel'
import { decodePackChatMessage } from '@lib/codec/pack-chat/pack-chat-decoder'
import { PackChatMessageId } from '@lib/codec/pack-chat/pack-chat-message-id'
import { MessageType } from '@lib/codec/pack-chat/types'

describe('decodePackChatMessage', () => {
  const channel = new PackChatChannel('general')
  const messageId = new PackChatMessageId(0x123456789abc, 0x1234)
  const replyToId = new PackChatMessageId(0xaabbccddeeff, 0x5678)
  const reactToId = new PackChatMessageId(0x112233445566, 0x9abc)
  const editId = new PackChatMessageId(0xffeeddccbbaa, 0xdef0)
  const deleteId = new PackChatMessageId(0x998877665544, 0x3210)

  describe('ROOT messages', () => {
    it('decodes message with text', () => {
      // Build buffer: header + message_id + text
      const header = new Uint8Array([0x00, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c]) // version=0, type=0 + 'general'
      const idBytes = messageId.encode()
      const textBytes = new TextEncoder().encode('Hello world!')
      const buffer = new Uint8Array([...header, ...idBytes, ...textBytes])

      const decoded = decodePackChatMessage(buffer)

      expect(decoded.type).toBe(MessageType.ROOT)
      expect(decoded.channel.name).toBe('general')
      expect(decoded.messageId.value).toBe(messageId.value)
      expect(decoded.text).toBe('Hello world!')
    })

    it('decodes message with empty text', () => {
      const header = new Uint8Array([0x00, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c])
      const idBytes = messageId.encode()
      const buffer = new Uint8Array([...header, ...idBytes])

      const decoded = decodePackChatMessage(buffer)

      expect(decoded.type).toBe(MessageType.ROOT)
      expect(decoded.text).toBe('')
    })
  })

  describe('REPLY messages', () => {
    it('decodes message with reply-to ID', () => {
      const header = new Uint8Array([0x04, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c]) // type=1
      const idBytes = messageId.encode()
      const replyToBytes = replyToId.encode()
      const textBytes = new TextEncoder().encode('Reply text')
      const buffer = new Uint8Array([...header, ...idBytes, ...replyToBytes, ...textBytes])

      const decoded = decodePackChatMessage(buffer)

      expect(decoded.type).toBe(MessageType.REPLY)
      expect(decoded.messageId.value).toBe(messageId.value)
      expect(decoded.replyToId.value).toBe(replyToId.value)
      expect(decoded.text).toBe('Reply text')
    })
  })

  describe('REACTION messages', () => {
    it('decodes message with emoji', () => {
      const header = new Uint8Array([0x08, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c]) // type=2
      const idBytes = reactToId.encode()
      const emojiBytes = new TextEncoder().encode('👍')
      const buffer = new Uint8Array([...header, ...idBytes, ...emojiBytes])

      const decoded = decodePackChatMessage(buffer)

      expect(decoded.type).toBe(MessageType.REACTION)
      expect(decoded.reactToId.value).toBe(reactToId.value)
      expect(decoded.emoji).toBe('👍')
    })
  })

  describe('EDIT messages', () => {
    it('decodes message with edit ID', () => {
      const header = new Uint8Array([0x0c, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c]) // type=3
      const idBytes = messageId.encode()
      const editIdBytes = editId.encode()
      const textBytes = new TextEncoder().encode('Updated text')
      const buffer = new Uint8Array([...header, ...idBytes, ...editIdBytes, ...textBytes])

      const decoded = decodePackChatMessage(buffer)

      expect(decoded.type).toBe(MessageType.EDIT)
      expect(decoded.messageId.value).toBe(messageId.value)
      expect(decoded.editId.value).toBe(editId.value)
      expect(decoded.text).toBe('Updated text')
    })
  })

  describe('DELETE messages', () => {
    it('decodes message with delete ID', () => {
      const header = new Uint8Array([0x10, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c]) // type=4
      const idBytes = messageId.encode()
      const deleteIdBytes = deleteId.encode()
      const buffer = new Uint8Array([...header, ...idBytes, ...deleteIdBytes])

      const decoded = decodePackChatMessage(buffer)

      expect(decoded.type).toBe(MessageType.DELETE)
      expect(decoded.messageId.value).toBe(messageId.value)
      expect(decoded.deleteId.value).toBe(deleteId.value)
    })
  })

  describe('error handling', () => {
    it('throws error for buffer too short', () => {
      const buffer = new Uint8Array([0x00, 0x67, 0x65])

      expect(() => decodePackChatMessage(buffer)).toThrow(/buffer too short/i)
    })

    it('throws error for unsupported protocol version', () => {
      const header = new Uint8Array([0x20, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c]) // version=1
      const idBytes = messageId.encode()
      const buffer = new Uint8Array([...header, ...idBytes])

      expect(() => decodePackChatMessage(buffer)).toThrow(/unsupported protocol version/i)
    })

    it('throws error for unsupported message type', () => {
      const header = new Uint8Array([0x14, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c]) // type=5 (reserved)
      const idBytes = messageId.encode()
      const buffer = new Uint8Array([...header, ...idBytes])

      expect(() => decodePackChatMessage(buffer)).toThrow(/unsupported message type/i)
    })

    it('throws error for invalid channel name', () => {
      const header = new Uint8Array([0x00, 0x31, 0x67, 0x65, 0x6e, 0x20, 0x20, 0x20]) // '1gen' - starts with number
      const idBytes = messageId.encode()
      const buffer = new Uint8Array([...header, ...idBytes])

      expect(() => decodePackChatMessage(buffer)).toThrow()
    })
  })

  describe('UTF-8 text handling', () => {
    it('decodes UTF-8 text with emojis', () => {
      const header = new Uint8Array([0x00, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c])
      const idBytes = messageId.encode()
      const textBytes = new TextEncoder().encode('Hello 👋 世界')
      const buffer = new Uint8Array([...header, ...idBytes, ...textBytes])

      const decoded = decodePackChatMessage(buffer)

      expect(decoded.text).toBe('Hello 👋 世界')
    })
  })
})

import { PackChatChannel } from '@lib/codec/pack-chat/pack-chat-channel'
import { PackChatMessage } from '@lib/codec/pack-chat/pack-chat-message'
import { PackChatMessageId } from '@lib/codec/pack-chat/pack-chat-message-id'
import { MessageType, MAX_TEXT_LENGTH } from '@lib/codec/pack-chat/types'

describe('PackChatMessage', () => {
  const channel = new PackChatChannel('general')
  const messageId = new PackChatMessageId(0x123456789abc, 0x1234)
  const replyToId = new PackChatMessageId(0xaabbccddeeff, 0x5678)
  const reactToId = new PackChatMessageId(0x112233445566, 0x9abc)
  const editId = new PackChatMessageId(0xffeeddccbbaa, 0xdef0)
  const deleteId = new PackChatMessageId(0x998877665544, 0x3210)

  describe('.root()', () => {
    let message: PackChatMessage

    beforeEach(() => {
      message = PackChatMessage.root(channel, messageId, 'Hello world!')
    })

    it('sets type to ROOT', () => {
      expect(message.type).toBe(MessageType.ROOT)
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

    it('throws error if text exceeds maximum length', () => {
      const tooLongText = 'x'.repeat(MAX_TEXT_LENGTH + 1)

      expect(() => PackChatMessage.root(channel, messageId, tooLongText)).toThrow(/text exceeds maximum/i)
    })
  })

  describe('.reply()', () => {
    let message: PackChatMessage

    beforeEach(() => {
      message = PackChatMessage.reply(channel, messageId, replyToId, 'This is a reply')
    })

    it('sets type to REPLY', () => {
      expect(message.type).toBe(MessageType.REPLY)
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

  describe('.reaction()', () => {
    let message: PackChatMessage

    beforeEach(() => {
      message = PackChatMessage.reaction(channel, reactToId, '👍')
    })

    it('sets type to REACTION', () => {
      expect(message.type).toBe(MessageType.REACTION)
    })

    it('sets channel', () => {
      expect(message.channel).toBe(channel)
    })

    it('sets reactToId', () => {
      expect(message.reactToId).toBe(reactToId)
    })

    it('sets emoji', () => {
      expect(message.emoji).toBe('👍')
    })
  })

  describe('.edit()', () => {
    let message: PackChatMessage

    beforeEach(() => {
      message = PackChatMessage.edit(channel, messageId, editId, 'Updated text')
    })

    it('sets type to EDIT', () => {
      expect(message.type).toBe(MessageType.EDIT)
    })

    it('sets channel', () => {
      expect(message.channel).toBe(channel)
    })

    it('sets messageId', () => {
      expect(message.messageId).toBe(messageId)
    })

    it('sets editId', () => {
      expect(message.editId).toBe(editId)
    })

    it('sets text', () => {
      expect(message.text).toBe('Updated text')
    })
  })

  describe('.delete()', () => {
    let message: PackChatMessage

    beforeEach(() => {
      message = PackChatMessage.delete(channel, messageId, deleteId)
    })

    it('sets type to DELETE', () => {
      expect(message.type).toBe(MessageType.DELETE)
    })

    it('sets channel', () => {
      expect(message.channel).toBe(channel)
    })

    it('sets messageId', () => {
      expect(message.messageId).toBe(messageId)
    })

    it('sets deleteId', () => {
      expect(message.deleteId).toBe(deleteId)
    })
  })

  describe('#encode()', () => {
    let encoded: Uint8Array

    beforeEach(() => {
      const message = PackChatMessage.root(channel, messageId, 'Hello')
      encoded = message.encode()
    })

    it('returns correct bytes', () => {
      const expected = new Uint8Array([
        0x00, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c, // Header: version=0, type=0, "general"
        0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34, // Message ID (0x123456789abc1234)
        0x48, 0x65, 0x6c, 0x6c, 0x6f // "Hello"
      ])
      expect(encoded).toEqual(expected)
    })
  })

  describe('.decode()', () => {
    describe('ROOT message', () => {
      let decoded: PackChatMessage

      beforeEach(() => {
        const buffer = new Uint8Array([
          0x00, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c, // Header: version=0, type=0, "general"
          0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34, // Message ID
          0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21 // "Hello world!"
        ])
        decoded = PackChatMessage.decode(buffer)
      })

      it('decodes type', () => {
        expect(decoded.type).toBe(MessageType.ROOT)
      })

      it('decodes channel', () => {
        expect(decoded.channel.name).toBe(channel.name)
      })

      it('decodes messageId', () => {
        expect(decoded.messageId!.value).toBe(messageId.value)
      })

      it('decodes text', () => {
        expect(decoded.text).toBe('Hello world!')
      })
    })

    describe('REPLY message', () => {
      let decoded: PackChatMessage

      beforeEach(() => {
        const buffer = new Uint8Array([
          0x04, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c, // Header: version=0, type=1, "general"
          0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34, // Message ID
          0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x56, 0x78, // Reply-to ID
          0x52, 0x65, 0x70, 0x6c, 0x79, 0x20, 0x74, 0x65, 0x78, 0x74 // "Reply text"
        ])
        decoded = PackChatMessage.decode(buffer)
      })

      it('decodes type', () => {
        expect(decoded.type).toBe(MessageType.REPLY)
      })

      it('decodes messageId', () => {
        expect(decoded.messageId!.value).toBe(messageId.value)
      })

      it('decodes replyToId', () => {
        expect(decoded.replyToId!.value).toBe(replyToId.value)
      })

      it('decodes text', () => {
        expect(decoded.text).toBe('Reply text')
      })
    })

    describe('REACTION message', () => {
      let decoded: PackChatMessage

      beforeEach(() => {
        const buffer = new Uint8Array([
          0x08, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c, // Header: version=0, type=2, "general"
          0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x9a, 0xbc, // React-to ID
          0xf0, 0x9f, 0x8e, 0x89 // "🎉" emoji
        ])
        decoded = PackChatMessage.decode(buffer)
      })

      it('decodes type', () => {
        expect(decoded.type).toBe(MessageType.REACTION)
      })

      it('decodes reactToId', () => {
        expect(decoded.reactToId!.value).toBe(reactToId.value)
      })

      it('decodes emoji', () => {
        expect(decoded.emoji).toBe('🎉')
      })
    })

    describe('EDIT message', () => {
      let decoded: PackChatMessage

      beforeEach(() => {
        const buffer = new Uint8Array([
          0x0c, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c, // Header: version=0, type=3, "general"
          0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34, // Message ID
          0xff, 0xee, 0xdd, 0xcc, 0xbb, 0xaa, 0xde, 0xf0, // Edit ID
          0x4e, 0x65, 0x77, 0x20, 0x74, 0x65, 0x78, 0x74 // "New text"
        ])
        decoded = PackChatMessage.decode(buffer)
      })

      it('decodes type', () => {
        expect(decoded.type).toBe(MessageType.EDIT)
      })

      it('decodes messageId', () => {
        expect(decoded.messageId!.value).toBe(messageId.value)
      })

      it('decodes editId', () => {
        expect(decoded.editId!.value).toBe(editId.value)
      })

      it('decodes text', () => {
        expect(decoded.text).toBe('New text')
      })
    })

    describe('DELETE message', () => {
      let decoded: PackChatMessage

      beforeEach(() => {
        const buffer = new Uint8Array([
          0x10, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c, // Header: version=0, type=4, "general"
          0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34, // Message ID
          0x99, 0x88, 0x77, 0x66, 0x55, 0x44, 0x32, 0x10 // Delete ID
        ])
        decoded = PackChatMessage.decode(buffer)
      })

      it('decodes type', () => {
        expect(decoded.type).toBe(MessageType.DELETE)
      })

      it('decodes messageId', () => {
        expect(decoded.messageId!.value).toBe(messageId.value)
      })

      it('decodes deleteId', () => {
        expect(decoded.deleteId!.value).toBe(deleteId.value)
      })
    })

    describe('UTF-8 text', () => {
      let decoded: PackChatMessage

      beforeEach(() => {
        const buffer = new Uint8Array([
          0x00, 0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c, // Header: version=0, type=0, "general"
          0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34, // Message ID
          0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0xf0, 0x9f, 0x91, 0x8b, 0x20, 0xe4, 0xb8, 0x96, 0xe7, 0x95, 0x8c, 0x20,
          0xf0, 0x9f, 0x8c, 0x8d // "Hello 👋 世界 🌍"
        ])
        decoded = PackChatMessage.decode(buffer)
      })

      it('decodes UTF-8 text', () => {
        expect(decoded.text).toBe('Hello 👋 世界 🌍')
      })
    })
  })

  describe('.data getter', () => {
    describe('ROOT message', () => {
      let message: PackChatMessage

      beforeEach(() => {
        message = PackChatMessage.root(channel, messageId, 'Hello')
      })

      it('provides typed access to text', () => {
        const data = message.data

        if (data.type === MessageType.ROOT) {
          expect(data.text).toBe('Hello')
        } else {
          throw new Error('Expected ROOT message')
        }
      })

      it('provides typed access to messageId', () => {
        const data = message.data

        if (data.type === MessageType.ROOT) {
          expect(data.messageId).toBe(messageId)
        } else {
          throw new Error('Expected ROOT message')
        }
      })
    })

    describe('REPLY message', () => {
      let message: PackChatMessage

      beforeEach(() => {
        message = PackChatMessage.reply(channel, messageId, replyToId, 'Reply')
      })

      it('provides typed access to text', () => {
        const data = message.data

        if (data.type === MessageType.REPLY) {
          expect(data.text).toBe('Reply')
        } else {
          throw new Error('Expected REPLY message')
        }
      })

      it('provides typed access to messageId', () => {
        const data = message.data

        if (data.type === MessageType.REPLY) {
          expect(data.messageId).toBe(messageId)
        } else {
          throw new Error('Expected REPLY message')
        }
      })

      it('provides typed access to replyToId', () => {
        const data = message.data

        if (data.type === MessageType.REPLY) {
          expect(data.replyToId).toBe(replyToId)
        } else {
          throw new Error('Expected REPLY message')
        }
      })
    })
  })
})

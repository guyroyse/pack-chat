import { PackChatChannel } from '@lib/codec/pack-chat/pack-chat-channel'
import { PackChatMessageId } from '@lib/codec/pack-chat/pack-chat-message-id'
import { EditMessage } from '@lib/codec/pack-chat/pack-chat-message'

const CHANNEL_BYTES = new Uint32Array([0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c])
const MESSAGE_ID_BYTES = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34])
const EDIT_ID_BYTES = new Uint8Array([0xff, 0xee, 0xdd, 0xcc, 0xbb, 0xaa, 0xde, 0xf0])
const NEW_TEXT_BYTES = new Uint8Array([0x4e, 0x65, 0x77, 0x20, 0x74, 0x65, 0x78, 0x74])

describe('EditMessage', () => {
  const channel = new PackChatChannel('general')
  const messageId = new PackChatMessageId(0x123456789abc, 0x1234)
  const editId = new PackChatMessageId(0xffeeddccbbaa, 0xdef0)

  describe('constructor', () => {
    let message: EditMessage

    beforeEach(() => {
      message = new EditMessage(channel, messageId, editId, 'Updated text')
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

  describe('#encode()', () => {
    it('encodes to correct bytes', () => {
      const message = new EditMessage(channel, messageId, editId, 'New text')
      const encoded = message.encode()

      const expected = new Uint8Array([0x0c, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...EDIT_ID_BYTES, ...NEW_TEXT_BYTES])
      expect(encoded).toEqual(expected)
    })
  })
})

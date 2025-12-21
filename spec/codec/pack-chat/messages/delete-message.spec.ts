import { PackChatChannel } from '@lib/codec/pack-chat/pack-chat-channel'
import { PackChatMessageId } from '@lib/codec/pack-chat/pack-chat-message-id'
import { DeleteMessage } from '@lib/codec/pack-chat/pack-chat-message'

const CHANNEL_BYTES = new Uint32Array([0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c])
const MESSAGE_ID_BYTES = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34])
const DELETE_ID_BYTES = new Uint8Array([0x99, 0x88, 0x77, 0x66, 0x55, 0x44, 0x32, 0x10])

describe('DeleteMessage', () => {
  const channel = new PackChatChannel('general')
  const messageId = new PackChatMessageId(0x123456789abc, 0x1234)
  const deleteId = new PackChatMessageId(0x998877665544, 0x3210)

  describe('constructor', () => {
    let message: DeleteMessage

    beforeEach(() => {
      message = new DeleteMessage(channel, messageId, deleteId)
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
    it('encodes to correct bytes', () => {
      const message = new DeleteMessage(channel, messageId, deleteId)
      const encoded = message.encode()

      const expected = new Uint8Array([0x10, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...DELETE_ID_BYTES])
      expect(encoded).toEqual(expected)
    })
  })
})

import { decodePackChatMessage } from '@lib/codec/pack-chat/pack-chat-decoder'
import {
  MessageType,
  PackChatRootMessage,
  PackChatReplyMessage,
  PackChatReactionMessage,
  PackChatEditMessage,
  PackChatDeleteMessage
} from '@lib/codec/pack-chat/pack-chat-types'

const ROOT_FORMAT_BYTE = 0x00 // version=0, type=0 (ROOT), reserved=0
const REPLY_FORMAT_BYTE = 0x04 // version=0, type=1 (REPLY), reserved=0
const REACTION_FORMAT_BYTE = 0x08 // version=0, type=2 (REACTION), reserved=0
const EDIT_FORMAT_BYTE = 0x0c // version=0, type=3 (EDIT), reserved=0
const DELETE_FORMAT_BYTE = 0x10 // version=0, type=4 (DELETE), reserved=0

const INVALID_VERSION_FORMAT_BYTE = 0x20 // version=1, type=0, reserved=0
const INVALID_TYPE_FORMAT_BYTE = 0x14 // version=0, type=5, reserved=0
const INVALID_RESERVED_FORMAT_BYTE = 0x03 // version=0, type=0, reserved=3

const CHANNEL_BYTES = new Uint32Array([0x61, 0x62, 0x63, 0x20, 0x20, 0x20, 0x20]) // 'abc    '
const INVALID_CHANNEL_BYTES = new Uint32Array([0x31, 0x32, 0x33, 0x20, 0x20, 0x20, 0x20]) // '123    '

const HELLO_WORLD_TEXT_BYTES = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21]) // "Hello world!"
const REPLY_TEXT_BYTES = new Uint8Array([0x52, 0x65, 0x70, 0x6c, 0x79, 0x20, 0x74, 0x65, 0x78, 0x74]) // "Reply text"
const UPDATED_TEXT_BYTES = new Uint8Array([0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x64, 0x20, 0x74, 0x65, 0x78, 0x74]) // "Updated text"
const THUMBS_UP_EMOJI_BYTES = new Uint8Array([0xf0, 0x9f, 0x91, 0x8d]) // "👍"
const HELLO_EMOJI_WORLD_TEXT_BYTES = new Uint8Array([
  0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0xf0, 0x9f, 0x91, 0x8b, 0x20, 0xe4, 0xb8, 0x96, 0xe7, 0x95, 0x8c
]) // "Hello 👋 世界"

const MESSAGE_ID_BYTES = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34])
const REPLY_TO_ID_BYTES = new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x56, 0x78])
const REACT_TO_ID_BYTES = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x9a, 0xbc])
const EDIT_ID_BYTES = new Uint8Array([0xff, 0xee, 0xdd, 0xcc, 0xbb, 0xaa, 0xde, 0xf0])
const DELETE_ID_BYTES = new Uint8Array([0x99, 0x88, 0x77, 0x66, 0x55, 0x44, 0x32, 0x10])

const CHANNEL_NAME = 'abc'
const MESSAGE_ID = 0x123456789abc1234n
const REPLY_TO_ID = 0xaabbccddeeff5678n
const REACT_TO_ID = 0x1122334455669abcn
const EDIT_ID = 0xffeeddccbbaadef0n
const DELETE_ID = 0x9988776655443210n

describe('decodePackChatMessage', () => {
  it.each([
    {
      description: 'throws error when buffer too short',
      buffer: new Uint8Array([ROOT_FORMAT_BYTE, 0x67, 0x65]),
      expectedError: 'Buffer too short for PackChat header: expected at least 8 bytes, got 3.'
    },
    {
      description: 'throws error for unsupported protocol version',
      buffer: new Uint8Array([INVALID_VERSION_FORMAT_BYTE, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES]),
      expectedError: 'Unsupported protocol version: 1 (expected 0).'
    },
    {
      description: 'throws error for unsupported message type',
      buffer: new Uint8Array([INVALID_TYPE_FORMAT_BYTE, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES]),
      expectedError: 'Unsupported message type: 5.'
    },
    {
      description: 'throws error for invalid reserved bits',
      buffer: new Uint8Array([INVALID_RESERVED_FORMAT_BYTE, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES]),
      expectedError: 'Invalid format byte: reserved bits must be 0, got 3.'
    },
    {
      description: 'throws error for invalid channel name',
      buffer: new Uint8Array([ROOT_FORMAT_BYTE, ...INVALID_CHANNEL_BYTES, ...MESSAGE_ID_BYTES]),
      expectedError:
        'Channel name must start with a letter, end with a letter or number, and contain only lowercase letters, numbers, and hyphens.'
    }
  ])('$description', ({ buffer, expectedError }) => expect(() => decodePackChatMessage(buffer)).toThrow(expectedError))

  describe('when decoding a ROOT messages', () => {
    let decoded: PackChatRootMessage

    describe.each([
      {
        description: 'with normal text',
        buffer: new Uint8Array([ROOT_FORMAT_BYTE, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...HELLO_WORLD_TEXT_BYTES]),
        expectedText: 'Hello world!'
      },
      {
        description: 'with empty text',
        buffer: new Uint8Array([ROOT_FORMAT_BYTE, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES]),
        expectedText: ''
      },
      {
        description: 'with UTF-8 emojis and international characters',
        buffer: new Uint8Array([ROOT_FORMAT_BYTE, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...HELLO_EMOJI_WORLD_TEXT_BYTES]),
        expectedText: 'Hello 👋 世界'
      }
    ])('$description', ({ buffer, expectedText }) => {
      beforeEach(() => (decoded = decodePackChatMessage(buffer) as PackChatRootMessage))

      it('decodes the message type', () => expect(decoded.type).toBe(MessageType.ROOT))
      it('decodes the channel name', () => expect(decoded.channel.name).toBe(CHANNEL_NAME))
      it('decodes the message ID', () => expect(decoded.messageId.value).toBe(MESSAGE_ID))
      it('decodes the text', () => expect(decoded.text).toBe(expectedText))
    })

    it('throws error if buffer too short for message ID', () => {
      const buffer = new Uint8Array([ROOT_FORMAT_BYTE, ...CHANNEL_BYTES, 0x12, 0x34, 0x56])

      expect(() => decodePackChatMessage(buffer)).toThrow(
        'Buffer too short for ROOT message: expected at least 8 more bytes.'
      )
    })
  })

  describe('when decoding a REPLY message', () => {
    let decoded: PackChatReplyMessage

    describe.each([
      {
        description: 'with normal text',
        buffer: new Uint8Array([
          REPLY_FORMAT_BYTE,
          ...CHANNEL_BYTES,
          ...MESSAGE_ID_BYTES,
          ...REPLY_TO_ID_BYTES,
          ...REPLY_TEXT_BYTES
        ]),
        expectedText: 'Reply text'
      }
    ])('$description', ({ buffer, expectedText }) => {
      beforeEach(() => (decoded = decodePackChatMessage(buffer) as PackChatReplyMessage))

      it('decodes the message type', () => expect(decoded.type).toBe(MessageType.REPLY))
      it('decodes the channel name', () => expect(decoded.channel.name).toBe(CHANNEL_NAME))
      it('decodes the message ID', () => expect(decoded.messageId.value).toBe(MESSAGE_ID))
      it('decodes the reply-to ID', () => expect(decoded.replyToId.value).toBe(REPLY_TO_ID))
      it('decodes the text', () => expect(decoded.text).toBe(expectedText))
    })

    it('throws error if buffer too short for message IDs', () => {
      const buffer = new Uint8Array([REPLY_FORMAT_BYTE, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, 0xaa, 0xbb, 0xcc])

      expect(() => decodePackChatMessage(buffer)).toThrow(
        'Buffer too short for REPLY message: expected at least 16 more bytes.'
      )
    })
  })

  describe('when decoding a REACTION message', () => {
    let decoded: PackChatReactionMessage

    describe.each([
      {
        description: 'with thumbs up emoji',
        buffer: new Uint8Array([
          REACTION_FORMAT_BYTE,
          ...CHANNEL_BYTES,
          ...MESSAGE_ID_BYTES,
          ...REACT_TO_ID_BYTES,
          ...THUMBS_UP_EMOJI_BYTES
        ]),
        expectedEmoji: '👍'
      }
    ])('$description', ({ buffer, expectedEmoji }) => {
      beforeEach(() => (decoded = decodePackChatMessage(buffer) as PackChatReactionMessage))

      it('decodes the message type', () => expect(decoded.type).toBe(MessageType.REACTION))
      it('decodes the channel name', () => expect(decoded.channel.name).toBe(CHANNEL_NAME))
      it('decodes the message ID', () => expect(decoded.messageId.value).toBe(MESSAGE_ID))
      it('decodes the react-to ID', () => expect(decoded.reactToId.value).toBe(REACT_TO_ID))
      it('decodes the emoji', () => expect(decoded.emoji).toBe(expectedEmoji))
    })

    it('throws error if buffer too short for message IDs', () => {
      const buffer = new Uint8Array([REACTION_FORMAT_BYTE, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, 0x11, 0x22])

      expect(() => decodePackChatMessage(buffer)).toThrow(
        'Buffer too short for REACTION message: expected at least 16 more bytes.'
      )
    })
  })

  describe('when decoding an EDIT message', () => {
    let decoded: PackChatEditMessage

    describe.each([
      {
        description: 'with updated text',
        buffer: new Uint8Array([
          EDIT_FORMAT_BYTE,
          ...CHANNEL_BYTES,
          ...MESSAGE_ID_BYTES,
          ...EDIT_ID_BYTES,
          ...UPDATED_TEXT_BYTES
        ]),
        expectedText: 'Updated text'
      }
    ])('$description', ({ buffer, expectedText }) => {
      beforeEach(() => (decoded = decodePackChatMessage(buffer) as PackChatEditMessage))

      it('decodes the message type', () => expect(decoded.type).toBe(MessageType.EDIT))
      it('decodes the channel name', () => expect(decoded.channel.name).toBe(CHANNEL_NAME))
      it('decodes the message ID', () => expect(decoded.messageId.value).toBe(MESSAGE_ID))
      it('decodes the edit ID', () => expect(decoded.editId.value).toBe(EDIT_ID))
      it('decodes the text', () => expect(decoded.text).toBe(expectedText))
    })

    it('throws error if buffer too short for message IDs', () => {
      const buffer = new Uint8Array([
        EDIT_FORMAT_BYTE,
        ...CHANNEL_BYTES,
        ...MESSAGE_ID_BYTES,
        0xff,
        0xee,
        0xdd,
        0xcc,
        0xbb
      ])

      expect(() => decodePackChatMessage(buffer)).toThrow(
        'Buffer too short for EDIT message: expected at least 16 more bytes.'
      )
    })
  })

  describe('when decoding a DELETE message', () => {
    let decoded: PackChatDeleteMessage

    describe.each([
      {
        description: 'with delete ID',
        buffer: new Uint8Array([DELETE_FORMAT_BYTE, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, ...DELETE_ID_BYTES])
      }
    ])('$description', ({ buffer }) => {
      beforeEach(() => (decoded = decodePackChatMessage(buffer) as PackChatDeleteMessage))

      it('decodes the message type', () => expect(decoded.type).toBe(MessageType.DELETE))
      it('decodes the channel name', () => expect(decoded.channel.name).toBe(CHANNEL_NAME))
      it('decodes the message ID', () => expect(decoded.messageId.value).toBe(MESSAGE_ID))
      it('decodes the delete ID', () => expect(decoded.deleteId.value).toBe(DELETE_ID))
    })

    it('throws error if buffer too short for message IDs', () => {
      const buffer = new Uint8Array([DELETE_FORMAT_BYTE, ...CHANNEL_BYTES, ...MESSAGE_ID_BYTES, 0x99, 0x88, 0x77, 0x66])

      expect(() => decodePackChatMessage(buffer)).toThrow(
        'Invalid length for DELETE message: expected exactly 16 more bytes, got 12.'
      )
    })

    it('throws error if buffer has extra bytes after delete ID', () => {
      const buffer = new Uint8Array([
        DELETE_FORMAT_BYTE,
        ...CHANNEL_BYTES,
        ...MESSAGE_ID_BYTES,
        ...DELETE_ID_BYTES,
        0x00,
        0x01,
        0x02
      ])

      expect(() => decodePackChatMessage(buffer)).toThrow(
        'Invalid length for DELETE message: expected exactly 16 more bytes, got 19.'
      )
    })
  })
})

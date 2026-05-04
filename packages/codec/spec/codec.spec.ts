import { PackChatChannel, PackChatMessageId, RootMessage } from '@packchat/codec/pack-chat'
import { AX25_SSID } from '@packchat/codec/ax25'

import { decodeFromKISS, encodeToKISS, CodecPacket } from '@packchat/codec/codec'

const MESSAGE_ID_TIMESTAMP = 0x123456789abc
const MESSAGE_ID_RANDOM = 0x1234

const EMPTY_BUFFER = new Uint8Array([])
const LEADING_BUFFER = new Uint8Array([0x40, 0x6b, 0x03, 0xf0, 0x00])
const TRAILING_BUFFER = new Uint8Array([0xc0, 0x00, 0x82, 0xa0, 0x86])
const COMPLETE_BUFFER = new Uint8Array([
  0xc0, 0x00, 0x82, 0xa0, 0x86, 0x90, 0x82, 0xa8, 0x60, 0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x6b, 0x03, 0xf0, 0x00,
  0x67, 0x65, 0x6e, 0x65, 0x72, 0x61, 0x6c, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34, 0x48, 0x65, 0x6c, 0x6c,
  0x6f, 0x21, 0xc0
])
const COMPLETE_AND_TRAILING_BUFFER = new Uint8Array([...COMPLETE_BUFFER, ...TRAILING_BUFFER])
const LEADING_AND_COMPLETE_BUFFER = new Uint8Array([...LEADING_BUFFER, ...COMPLETE_BUFFER])
const LEADING_AND_COMPLETE_AND_TRAILING_BUFFER = new Uint8Array([
  ...LEADING_BUFFER,
  ...COMPLETE_BUFFER,
  ...TRAILING_BUFFER
])

describe('decodeFromKISS', () => {
  let packet: CodecPacket | null
  let remainder: Uint8Array
  let message: RootMessage

  describe('when given empty bytes', () => {
    beforeEach(() => ([packet, remainder] = decodeFromKISS(EMPTY_BUFFER)))

    it('returns no packet', () => expect(packet).toBeNull())
    it('returns an empty remainder', () => expect(remainder).toEqual(EMPTY_BUFFER))
  })

  describe('when given an incomplete packet', () => {
    beforeEach(() => ([packet, remainder] = decodeFromKISS(TRAILING_BUFFER)))

    it('returns no packet', () => expect(packet).toBeNull())
    it('returns the bytes as the remainder', () => expect(remainder).toEqual(TRAILING_BUFFER))
  })

  describe('when given only leading bytes', () => {
    beforeEach(() => ([packet, remainder] = decodeFromKISS(LEADING_BUFFER)))

    it('returns no packet', () => expect(packet).toBeNull())
    it('returns an empty remainder', () => expect(remainder).toEqual(EMPTY_BUFFER))
  })

  describe('when given a single complete packet', () => {
    beforeEach(() => ([packet, remainder] = decodeFromKISS(COMPLETE_BUFFER)))

    it('decodes a packet', () => expect(packet).toBeDefined())
    it('returns an empty remainder', () => expect(remainder).toEqual(EMPTY_BUFFER))

    describe('the decoded packet', () => {
      it('has a callsign', () => expect(packet!.callsign).toBe('K6ABC'))
      it('has an SSID', () => expect(packet!.ssid).toBe(5))
      it('has a message', () => expect(packet!.message).toBeInstanceOf(RootMessage))

      describe('the message', () => {
        beforeEach(() => (message = packet!.message as RootMessage))

        it('has a channel', () => expect(message.channel.name).toBe('general'))
        it('has text', () => expect(message.text).toBe('Hello!'))
        it('has an ID', () => expect(message.messageId.value).toBe(0x123456789abc1234n))
      })
    })
  })

  describe('when given a complete packet followed by an incomplete packet', () => {
    beforeEach(() => ([packet, remainder] = decodeFromKISS(COMPLETE_AND_TRAILING_BUFFER)))

    it('decodes a packet', () => expect(packet).toBeDefined())
    it('returns the incomplete bytes as the remainder', () => expect(remainder).toEqual(TRAILING_BUFFER))

    describe('the decoded packet', () => {
      it('has a callsign', () => expect(packet!.callsign).toBe('K6ABC'))
      it('has an SSID', () => expect(packet!.ssid).toBe(5))
    })
  })

  describe('when given leading bytes followed by a complete packet', () => {
    beforeEach(() => ([packet, remainder] = decodeFromKISS(LEADING_AND_COMPLETE_BUFFER)))

    it('decodes a packet', () => expect(packet).toBeDefined())
    it('returns an empty remainder', () => expect(remainder).toEqual(EMPTY_BUFFER))

    describe('the decoded packet', () => {
      it('has a callsign', () => expect(packet!.callsign).toBe('K6ABC'))
      it('has an SSID', () => expect(packet!.ssid).toBe(5))
    })
  })

  describe('when given leading bytes followed by a complete packet followed by incomplete bytes', () => {
    beforeEach(() => ([packet, remainder] = decodeFromKISS(LEADING_AND_COMPLETE_AND_TRAILING_BUFFER)))

    it('decodes a packet', () => expect(packet).toBeDefined())
    it('returns the incomplete bytes as the remainder', () => expect(remainder).toEqual(TRAILING_BUFFER))

    describe('the decoded packet', () => {
      it('has a callsign', () => expect(packet!.callsign).toBe('K6ABC'))
      it('has an SSID', () => expect(packet!.ssid).toBe(5))
    })
  })
})

describe('encodeToKISS', () => {
  let bytes: Uint8Array

  describe('when encoding a packet', () => {
    beforeEach(() => {
      const channel = new PackChatChannel('general')
      const messageId = new PackChatMessageId(MESSAGE_ID_TIMESTAMP, MESSAGE_ID_RANDOM)
      const message = new RootMessage(channel, messageId, 'Hello!')
      bytes = encodeToKISS({ callsign: 'K6ABC', ssid: 5 as AX25_SSID, message })
    })

    it('produces the expected KISS frame', () => expect(bytes).toEqual(COMPLETE_BUFFER))
  })
})

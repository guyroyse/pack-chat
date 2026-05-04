import { PackChatMessageId } from '@packchat/codec/pack-chat/pack-chat-message-id'
import { before } from 'node:test'

describe('PackChatMessageId', () => {
  describe('constructor', () => {
    let id: PackChatMessageId
    describe('when created with explicit parameters', () => {
      beforeEach(() => (id = new PackChatMessageId(0x123456789abc, 0x1234)))

      it('has the expected timestamp', () => expect(id.timestamp).toBe(0x123456789abc))
      it('has the expected random value', () => expect(id.random).toBe(0x1234))
      it('has the expected value', () => expect(id.value).toBe(0x123456789abc1234n))
    })

    describe('when created with explicit timestamp and without random value', () => {
      beforeEach(() => (id = new PackChatMessageId(0x123456789abc)))

      it('has the expected timestamp', () => expect(id.timestamp).toBe(0x123456789abc))

      it('has a random value within range', () => {
        expect(id.random).toBeGreaterThanOrEqual(0x0000)
        expect(id.random).toBeLessThanOrEqual(0xffff)
      })

      it('has the expected value combining timestamp and random', () => {
        const expectedValue = (BigInt(0x123456789abc) << 16n) | BigInt(id.random)
        expect(id.value).toBe(expectedValue)
      })
    })

    describe('when created without parameters', () => {
      let timestampBefore: number
      let timestampAfter: number

      beforeEach(() => {
        timestampBefore = Date.now()
        id = new PackChatMessageId()
        timestampAfter = Date.now()
      })

      it('has a timestamp within range', () => {
        expect(id.timestamp).toBeGreaterThanOrEqual(timestampBefore)
        expect(id.timestamp).toBeLessThanOrEqual(timestampAfter)
      })

      it('has a random value within range', () => {
        expect(id.random).toBeGreaterThanOrEqual(0x0000)
        expect(id.random).toBeLessThanOrEqual(0xffff)
      })

      it('has the expected value combining timestamp and random', () => {
        const expectedValue = (BigInt(id.timestamp) << 16n) | BigInt(id.random)
        expect(id.value).toBe(expectedValue)
      })
    })

    describe('when created with maximum values', () => {
      beforeEach(() => (id = new PackChatMessageId(0xffffffffffff, 0xffff)))

      it('has the expected timestamp', () => expect(id.timestamp).toBe(0xffffffffffff))
      it('has the expected random value', () => expect(id.random).toBe(0xffff))
      it('has the expected value', () => expect(id.value).toBe(0xffffffffffffffffn))
    })

    describe('when created with zero values', () => {
      beforeEach(() => (id = new PackChatMessageId(0x000000000000, 0x0000)))

      it('has the expected timestamp', () => expect(id.timestamp).toBe(0x000000000000))
      it('has the expected random value', () => expect(id.random).toBe(0x0000))
      it('has the expected value', () => expect(id.value).toBe(0x0000000000000000n))
    })

    it('generates unique random values on multiple instances', () => {
      const randomValues = new Set<number>()

      for (let i = 0; i < 2; i++) {
        const id = new PackChatMessageId()
        randomValues.add(id.random)
      }

      expect(randomValues.size).toBe(2)
    })

    it('throws error if timestamp exceeds 48 bits', () => {
      const invalidTimestamp = 0x1000000000000 // 49 bits (exceeds 48-bit limit)
      expect(() => new PackChatMessageId(invalidTimestamp, 0)).toThrow(
        'Timestamp must fit in 48 bits (0 to 0xffffffffffff), got 0x1000000000000.'
      )
    })

    it('throws error if random value exceeds 16 bits', () => {
      const invalidRandom = 0x10000 // 17 bits (exceeds 16-bit limit)
      expect(() => new PackChatMessageId(0, invalidRandom)).toThrow(
        'Random value must fit in 16 bits (0 to 0xffff), got 0x10000.'
      )
    })
  })

  describe('#encode', () => {
    it('encodes to 8 bytes in big-endian format', () => {
      const id = new PackChatMessageId(0x123456789abc, 0x1234)
      const encoded = id.encode()

      expect(encoded.length).toBe(8)
      expect(encoded).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34]))
    })

    it('encodes zero correctly', () => {
      const id = new PackChatMessageId(0, 0)
      const encoded = id.encode()

      expect(encoded).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
    })

    it('encodes maximum value correctly', () => {
      const id = new PackChatMessageId(0xffffffffffff, 0xffff)
      const encoded = id.encode()

      expect(encoded).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]))
    })

    it('encodes with correct byte order (big-endian)', () => {
      const id = new PackChatMessageId(0x0102030405, 0x0607)
      const encoded = id.encode()

      expect(encoded).toEqual(new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]))
    })
  })

  describe('.decode', () => {
    it('decodes 8 bytes in big-endian format', () => {
      const buffer = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34])
      const id = PackChatMessageId.decode(buffer)

      expect(id.timestamp).toBe(0x123456789abc)
      expect(id.random).toBe(0x1234)
    })

    it('decodes zero correctly', () => {
      const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      const id = PackChatMessageId.decode(buffer)

      expect(id.timestamp).toBe(0)
      expect(id.random).toBe(0)
    })

    it('decodes maximum value correctly', () => {
      const buffer = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])
      const id = PackChatMessageId.decode(buffer)

      expect(id.timestamp).toBe(0xffffffffffff)
      expect(id.random).toBe(0xffff)
    })

    it('decodes with correct byte order (big-endian)', () => {
      const buffer = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07])
      const id = PackChatMessageId.decode(buffer)

      expect(id.timestamp).toBe(0x0102030405)
      expect(id.random).toBe(0x0607)
    })

    it('throws error if buffer is too short', () => {
      const buffer = new Uint8Array([0x12, 0x34, 0x56])
      expect(() => PackChatMessageId.decode(buffer)).toThrow(
        'Buffer too small for message ID: expected 8 bytes, got 3.'
      )
    })

    it('decodes from start of buffer when buffer is longer', () => {
      const buffer = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0x12, 0x34, 0xff, 0xff])
      const id = PackChatMessageId.decode(buffer)

      expect(id.timestamp).toBe(0x123456789abc)
      expect(id.random).toBe(0x1234)
    })
  })
})

import { KISS_Command, KISS_Frame } from '@lib/codec/kiss'

const samplePayload = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])

describe('KISS_Frame', () => {
  describe('constructor', () => {
    it('stores the port', () => {
      const frame = new KISS_Frame(3, KISS_Command.DATA_FRAME, samplePayload)
      expect(frame.port).toBe(3)
    })

    it('stores the command', () => {
      const frame = new KISS_Frame(0, KISS_Command.TX_DELAY, samplePayload)
      expect(frame.command).toBe(KISS_Command.TX_DELAY)
    })

    it('stores the payload', () => {
      const frame = new KISS_Frame(0, KISS_Command.DATA_FRAME, samplePayload)
      expect(frame.payload).toEqual(samplePayload)
    })

    it('returns null port for RETURN commands', () => {
      const frame = new KISS_Frame(0, KISS_Command.RETURN, samplePayload)
      expect(frame.port).toBe(null)
    })

    it('throws when port is null for non-RETURN commands', () => {
      expect(() => new KISS_Frame(null, KISS_Command.DATA_FRAME, samplePayload)).toThrow(
        'Port cannot be null for non-RETURN commands'
      )
    })
  })

  describe('#encode', () => {
    it('encodes a frame to bytes', () => {
      const frame = new KISS_Frame(0, KISS_Command.DATA_FRAME, samplePayload)
      const encoded = frame.encode()
      expect(encoded).toEqual(new Uint8Array([0xc0, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0]))
    })
  })

  describe('.decode', () => {
    it('decodes bytes to a frame', () => {
      const raw = new Uint8Array([0xc0, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
      const [frame, remainder] = KISS_Frame.decode(raw)
      expect(frame.port).toBe(0)
      expect(frame.command).toBe(KISS_Command.DATA_FRAME)
      expect(frame.payload).toEqual(samplePayload)
      expect(remainder).toEqual(new Uint8Array([]))
    })
  })
})

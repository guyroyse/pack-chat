import { KISS_Frame } from '@packchat/codec/kiss'

const samplePayload = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])

describe('KISS_Frame', () => {
  describe('constructor', () => {
    it('stores the payload', () => {
      const frame = new KISS_Frame(samplePayload)
      expect(frame.payload).toEqual(samplePayload)
    })
  })

  describe('#encode', () => {
    it('encodes a frame to bytes', () => {
      const frame = new KISS_Frame(samplePayload)
      const encoded = frame.encode()
      expect(encoded).toEqual(new Uint8Array([0xc0, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0]))
    })
  })

  describe('.decode', () => {
    it('decodes bytes to a frame', () => {
      const raw = new Uint8Array([0xc0, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0xc0])
      const [frame, remainder] = KISS_Frame.decode(raw)
      expect(frame.payload).toEqual(samplePayload)
      expect(remainder).toEqual(new Uint8Array([]))
    })

    it('throws error for non-zero port', () => {
      const raw = new Uint8Array([0xc0, 0x10, 0x01, 0x02, 0xc0]) // Port 1, command 0
      expect(() => KISS_Frame.decode(raw)).toThrow('Unsupported KISS port. Only port 0 is supported. Got port 1')
    })

    it('throws error for non-dataframe command', () => {
      const raw = new Uint8Array([0xc0, 0x01, 0x01, 0x02, 0xc0]) // Port 0, TX_DELAY command
      expect(() => KISS_Frame.decode(raw)).toThrow(
        'Unsupported KISS command. Only DATA_FRAME (0x00) is supported. Got command 0x01'
      )
    })
  })

  it('encodes and decodes back to the original payload', () => {
    const frame = new KISS_Frame(samplePayload)
    const encoded = frame.encode()
    const [decoded, remainder] = KISS_Frame.decode(encoded)
    expect(decoded.payload).toEqual(samplePayload)
    expect(remainder).toEqual(new Uint8Array([]))
  })
})

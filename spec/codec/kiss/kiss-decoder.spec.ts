import { decodeKISS_Frame, encodeKISS_Frame, FEND, FESC, TFEND, TFESC } from '@lib/codec/kiss'

describe('decodeKISS_Frame', () => {
  it('decodes a simple frame', () => {
    const bytes = new Uint8Array([FEND, 0x00, 0x01, 0x02, 0x03, FEND])
    const [payload, remainder] = decodeKISS_Frame(bytes)
    expect(payload).toEqual(new Uint8Array([0x01, 0x02, 0x03]))
    expect(remainder).toEqual(new Uint8Array([]))
  })

  it('decodes an empty payload', () => {
    const bytes = new Uint8Array([FEND, 0x00, FEND])
    const [payload, remainder] = decodeKISS_Frame(bytes)
    expect(payload).toEqual(new Uint8Array([]))
    expect(remainder).toEqual(new Uint8Array([]))
  })

  it('unescapes FEND (FESC + TFEND)', () => {
    const bytes = new Uint8Array([FEND, 0x00, 0x01, FESC, TFEND, 0x02, FEND])
    const [payload, remainder] = decodeKISS_Frame(bytes)
    expect(payload).toEqual(new Uint8Array([0x01, FEND, 0x02]))
    expect(remainder).toEqual(new Uint8Array([]))
  })

  it('unescapes FESC (FESC + TFESC)', () => {
    const bytes = new Uint8Array([FEND, 0x00, 0x01, FESC, TFESC, 0x02, FEND])
    const [payload, remainder] = decodeKISS_Frame(bytes)
    expect(payload).toEqual(new Uint8Array([0x01, FESC, 0x02]))
    expect(remainder).toEqual(new Uint8Array([]))
  })

  it('unescapes multiple special characters', () => {
    const bytes = new Uint8Array([FEND, 0x00, FESC, TFEND, FESC, TFESC, FESC, TFEND, FESC, TFESC, FEND])
    const [payload, remainder] = decodeKISS_Frame(bytes)
    expect(payload).toEqual(new Uint8Array([FEND, FESC, FEND, FESC]))
    expect(remainder).toEqual(new Uint8Array([]))
  })

  it('returns remainder bytes after frame', () => {
    const bytes = new Uint8Array([FEND, 0x00, 0x01, 0x02, FEND, 0xaa, 0xbb])
    const [payload, remainder] = decodeKISS_Frame(bytes)
    expect(payload).toEqual(new Uint8Array([0x01, 0x02]))
    expect(remainder).toEqual(new Uint8Array([0xaa, 0xbb]))
  })

  it('handles large payloads', () => {
    const largePayload = new Uint8Array(256).fill(0x42)
    // Encode using the encoder to ensure proper format
    const encoded = encodeKISS_Frame(largePayload)

    const [payload, remainder] = decodeKISS_Frame(encoded)
    expect(payload).toEqual(largePayload)
    expect(remainder).toEqual(new Uint8Array([]))
  })

  it('throws error if frame does not start with FEND', () => {
    const bytes = new Uint8Array([0x01, 0x00, 0x01, 0x02, FEND])
    expect(() => decodeKISS_Frame(bytes)).toThrow('KISS frame does not start with FEND')
  })

  it('throws error for unsupported port (non-zero)', () => {
    const bytes = new Uint8Array([FEND, 0x10, 0x01, 0x02, FEND]) // Port 1, command 0
    expect(() => decodeKISS_Frame(bytes)).toThrow('Unsupported KISS port')
    expect(() => decodeKISS_Frame(bytes)).toThrow('Only port 0 is supported')
  })

  it('throws error for unsupported command (non-DATA_FRAME)', () => {
    const bytes = new Uint8Array([FEND, 0x01, 0x01, 0x02, FEND]) // Port 0, TX_DELAY command
    expect(() => decodeKISS_Frame(bytes)).toThrow('Unsupported KISS command')
    expect(() => decodeKISS_Frame(bytes)).toThrow('Only DATA_FRAME (0x00) is supported')
  })

  it('throws error for incomplete frame (no ending FEND)', () => {
    const bytes = new Uint8Array([FEND, 0x00, 0x01, 0x02])
    expect(() => decodeKISS_Frame(bytes)).toThrow('Incomplete KISS frame')
  })

  it('throws error for invalid escape sequence', () => {
    const bytes = new Uint8Array([FEND, 0x00, 0x01, FESC, 0x99, FEND])
    expect(() => decodeKISS_Frame(bytes)).toThrow('Invalid escape sequence')
  })
})

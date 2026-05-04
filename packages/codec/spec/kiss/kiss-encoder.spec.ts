import { encodeKISS_Frame, FEND, FESC, TFEND, TFESC } from '@packchat/codec/kiss'

describe('encodeKISS_Frame', () => {
  it('encodes a simple payload', () => {
    const payload = new Uint8Array([0x01, 0x02, 0x03])
    const encoded = encodeKISS_Frame(payload)
    expect(encoded).toEqual(new Uint8Array([FEND, 0x00, 0x01, 0x02, 0x03, FEND]))
  })

  it('encodes an empty payload', () => {
    const payload = new Uint8Array([])
    const encoded = encodeKISS_Frame(payload)
    expect(encoded).toEqual(new Uint8Array([FEND, 0x00, FEND]))
  })

  it('escapes FEND (0xC0) in payload', () => {
    const payload = new Uint8Array([0x01, FEND, 0x02])
    const encoded = encodeKISS_Frame(payload)
    expect(encoded).toEqual(new Uint8Array([FEND, 0x00, 0x01, FESC, TFEND, 0x02, FEND]))
  })

  it('escapes FESC (0xDB) in payload', () => {
    const payload = new Uint8Array([0x01, FESC, 0x02])
    const encoded = encodeKISS_Frame(payload)
    expect(encoded).toEqual(new Uint8Array([FEND, 0x00, 0x01, FESC, TFESC, 0x02, FEND]))
  })

  it('escapes multiple special characters', () => {
    const payload = new Uint8Array([FEND, FESC, FEND, FESC])
    const encoded = encodeKISS_Frame(payload)
    expect(encoded).toEqual(
      new Uint8Array([FEND, 0x00, FESC, TFEND, FESC, TFESC, FESC, TFEND, FESC, TFESC, FEND])
    )
  })

  it('does not escape TFEND (0xDC) in payload', () => {
    const payload = new Uint8Array([TFEND])
    const encoded = encodeKISS_Frame(payload)
    expect(encoded).toEqual(new Uint8Array([FEND, 0x00, TFEND, FEND]))
  })

  it('does not escape TFESC (0xDD) in payload', () => {
    const payload = new Uint8Array([TFESC])
    const encoded = encodeKISS_Frame(payload)
    expect(encoded).toEqual(new Uint8Array([FEND, 0x00, TFESC, FEND]))
  })

  it('handles large payloads', () => {
    const payload = new Uint8Array(256).fill(0x42)
    const encoded = encodeKISS_Frame(payload)
    expect(encoded.length).toBe(256 + 3) // payload + FEND + command + FEND
    expect(encoded[0]).toBe(FEND)
    expect(encoded[1]).toBe(0x00)
    expect(encoded[encoded.length - 1]).toBe(FEND)
  })
})

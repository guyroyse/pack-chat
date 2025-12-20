import { AX25_Callsign, AX25_Frame, AX25_SSID } from '@lib/codec/ax25'

const CALLSIGN: AX25_Callsign = 'K6ABC'
const SSID: AX25_SSID = 5
const INFO_BUFFER = new TextEncoder().encode('Hello')

const ENCODED_FRAME_BUFFER = new Uint8Array([
  0x82, 0xa0, 0x86, 0x90, 0x82, 0xa8, 0x60, 0x96, 0x6c, 0x82, 0x84, 0x86, 0x40, 0x6b, 0x03, 0xf0, 0x48, 0x65, 0x6c,
  0x6c, 0x6f
])

describe('AX25_Frame', () => {
  let frame: AX25_Frame

  describe('constructor', () => {
    beforeEach(() => (frame = new AX25_Frame(CALLSIGN, SSID, INFO_BUFFER)))

    it('sets callsign', () => expect(frame.callsign).toBe('K6ABC'))
    it('sets ssid', () => expect(frame.ssid).toBe(5))
    it('sets info', () => expect(frame.info).toEqual(INFO_BUFFER))
  })

  describe('#encode()', () => {
    it('returns correct bytes', () => {
      const frame = new AX25_Frame(CALLSIGN, SSID, INFO_BUFFER)
      const encoded = frame.encode()
      expect(encoded).toEqual(ENCODED_FRAME_BUFFER)
    })
  })

  describe('.decode()', () => {
    beforeEach(() => (frame = AX25_Frame.decode(ENCODED_FRAME_BUFFER)))

    it('decodes callsign', () => expect(frame.callsign).toBe(CALLSIGN))
    it('decodes ssid', () => expect(frame.ssid).toBe(SSID))
    it('decodes info', () => expect(frame.info).toEqual(INFO_BUFFER))
  })
})

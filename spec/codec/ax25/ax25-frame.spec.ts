import { AX25_Callsign, AX25_Frame, AX25_SSID } from '@lib/codec/ax25'

const CALLSIGN: AX25_Callsign = 'K6ABC'
const SSID: AX25_SSID = 5
const INFO_BUFFER = Buffer.from('Hello')

const APCHAT_BUFFER = Buffer.from([0x82, 0xa0, 0x86, 0x90, 0x82, 0xa8])
const K6ABC_BUFFER = Buffer.from([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40])
const N0CALL_BUFFER = Buffer.from([0x9c, 0x60, 0x86, 0x82, 0x98, 0x98])

const SSID_0 = 0x60 // SSID 0, last address bit = 0
const SSID_5 = 0x6a // SSID 5, last address bit = 0
const SSID_0_LAST = 0x61 // SSID 0, last address bit = 1
const SSID_5_LAST = 0x6b // SSID 5, last address bit = 1

const CONTROL_UI = 0x03
const PID_NO_LAYER_3 = 0xf0

const VALID_ADDRESS_BUFFER = Buffer.from([...APCHAT_BUFFER, SSID_0, ...K6ABC_BUFFER, SSID_5_LAST])
const VALID_BODY_BUFFER = Buffer.from([CONTROL_UI, PID_NO_LAYER_3, ...INFO_BUFFER])

// Hard-coded buffer for K6ABC-5 with "Hello" info
// Format: APCHAT-0 (dest) + K6ABC-5 (source) + 0x03 (control) + 0xF0 (PID) + "Hello"
const VALID_FRAME_BUFFER = Buffer.from([...VALID_ADDRESS_BUFFER, ...VALID_BODY_BUFFER])

describe('AX25_Frame', () => {
  describe('constructor', () => {
    it('creates a frame with correct properties', () => {
      const frame = new AX25_Frame(CALLSIGN, SSID, INFO_BUFFER)

      expect(frame.callsign).toBe('K6ABC')
      expect(frame.ssid).toBe(5)
      expect(frame.info).toEqual(Buffer.from('Hello'))
    })
  })

  describe('#encode', () => {
    it('encodes a frame', () => {
      const frame = new AX25_Frame(CALLSIGN, SSID, INFO_BUFFER)
      const buffer = frame.encode()

      expect(buffer).toEqual(VALID_FRAME_BUFFER)
    })
  })

  describe('.decode', () => {
    it('decodes a valid frame', () => {
      const frame = AX25_Frame.decode(VALID_FRAME_BUFFER)

      expect(frame.callsign).toBe(CALLSIGN)
      expect(frame.ssid).toBe(SSID)
      expect(frame.info).toEqual(INFO_BUFFER)
    })

    it('throws error for buffer too short', () => {
      const buffer = Buffer.from([...VALID_ADDRESS_BUFFER, CONTROL_UI])
      expect(() => AX25_Frame.decode(buffer)).toThrow(
        'Invalid AX.25 frame: Too short. Expected at least 16 bytes, got 15.'
      )
    })

    it('throws error for invalid destination callsign', () => {
      const buffer = Buffer.from([...N0CALL_BUFFER, SSID_0, ...K6ABC_BUFFER, SSID_5_LAST, ...VALID_BODY_BUFFER])
      expect(() => AX25_Frame.decode(buffer)).toThrow(
        'Unsupported AX.25 frame: destination address must be APCHAT-0. Got N0CALL-0.'
      )
    })

    it('throws error for invalid SSID', () => {
      const buffer = Buffer.from([...APCHAT_BUFFER, SSID_5, ...K6ABC_BUFFER, SSID_5_LAST, ...VALID_BODY_BUFFER])
      expect(() => AX25_Frame.decode(buffer)).toThrow(
        'Unsupported AX.25 frame: destination address must be APCHAT-0. Got APCHAT-5.'
      )
    })

    it('throws error for destination last address set', () => {
      const buffer = Buffer.from([...APCHAT_BUFFER, SSID_0_LAST, ...K6ABC_BUFFER, SSID_5_LAST, ...VALID_BODY_BUFFER])
      expect(() => AX25_Frame.decode(buffer)).toThrow('Invalid AX.25 frame: destination address cannot be last.')
    })

    it('throws error for source last address not set', () => {
      const buffer = Buffer.from([...APCHAT_BUFFER, SSID_0, ...K6ABC_BUFFER, SSID_5, ...VALID_BODY_BUFFER])
      expect(() => AX25_Frame.decode(buffer)).toThrow('Unsupported AX.25 frame: repeaters detected.')
    })

    it('throws error for invalid control', () => {
      const buffer = Buffer.from([...VALID_ADDRESS_BUFFER, 0x2f, PID_NO_LAYER_3, ...INFO_BUFFER])
      expect(() => AX25_Frame.decode(buffer)).toThrow(
        'Unsupported AX.25 frame: Control field must be 0x03 (UI frame). Got 0x2f.'
      )
    })

    it('throws error for invalid protocol ID', () => {
      const buffer = Buffer.from([...VALID_ADDRESS_BUFFER, CONTROL_UI, 0xcc, ...INFO_BUFFER])
      expect(() => AX25_Frame.decode(buffer)).toThrow(
        'Unsupported AX.25 frame: PID must be 0xf0 (no layer 3). Got 0xcc.'
      )
    })
  })
})

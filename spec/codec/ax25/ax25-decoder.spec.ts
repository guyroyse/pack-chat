import { decodeAX25_Frame } from '@lib/codec/ax25/ax25-decoder'
import { AX25_Callsign, AX25_Frame, AX25_SSID } from '@lib/codec/ax25'

const CALLSIGN: AX25_Callsign = 'K6ABC'
const SSID: AX25_SSID = 5
const INFO_BUFFER = new TextEncoder().encode('Hello')
const EMPTY_INFO_BUFFER = new Uint8Array([])

const APCHAT_BUFFER = new Uint8Array([0x82, 0xa0, 0x86, 0x90, 0x82, 0xa8])
const K6ABC_BUFFER = new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40])
const N0CALL_BUFFER = new Uint8Array([0x9c, 0x60, 0x86, 0x82, 0x98, 0x98])

const SSID_0 = 0x60 // SSID 0, last address bit = 0
const SSID_5 = 0x6a // SSID 5, last address bit = 0
const SSID_0_LAST = 0x61 // SSID 0, last address bit = 1
const SSID_5_LAST = 0x6b // SSID 5, last address bit = 1

const CONTROL_UI = 0x03
const PID_NO_LAYER_3 = 0xf0

const VALID_ADDRESS_BUFFER = new Uint8Array([...APCHAT_BUFFER, SSID_0, ...K6ABC_BUFFER, SSID_5_LAST])
const VALID_BODY_BUFFER = new Uint8Array([CONTROL_UI, PID_NO_LAYER_3, ...INFO_BUFFER])
const EMPTY_BODY_BUFFER = new Uint8Array([CONTROL_UI, PID_NO_LAYER_3, ...EMPTY_INFO_BUFFER])

const VALID_FRAME_BUFFER = new Uint8Array([...VALID_ADDRESS_BUFFER, ...VALID_BODY_BUFFER])
const EMPTY_FRAME_BUFFER = new Uint8Array([...VALID_ADDRESS_BUFFER, ...EMPTY_BODY_BUFFER])

describe('decodeAX25_Frame', () => {
  let frame: AX25_Frame

  describe('when decoding a valid frame', () => {
    beforeEach(() => (frame = decodeAX25_Frame(VALID_FRAME_BUFFER)))

    it('has the expected callsign', () => expect(frame.callsign).toBe(CALLSIGN))
    it('has the expected ssid', () => expect(frame.ssid).toBe(SSID))
    it('has the expected info field', () => expect(frame.info).toEqual(INFO_BUFFER))
  })

  describe('when decoding a frame with empty info', () => {
    beforeEach(() => (frame = decodeAX25_Frame(EMPTY_FRAME_BUFFER)))

    it('has the expected callsign', () => expect(frame.callsign).toBe(CALLSIGN))
    it('has the expected ssid', () => expect(frame.ssid).toBe(SSID))
    it('has an empty info field', () => expect(frame.info.length).toBe(0))
  })

  it('throws error for buffer too short', () => {
    const buffer = new Uint8Array([...VALID_ADDRESS_BUFFER, CONTROL_UI])
    expect(() => decodeAX25_Frame(buffer)).toThrow(
      'Invalid AX.25 frame: Too short. Expected at least 16 bytes, got 15.'
    )
  })

  it('throws error for invalid destination callsign', () => {
    const buffer = new Uint8Array([...N0CALL_BUFFER, SSID_0, ...K6ABC_BUFFER, SSID_5_LAST, ...VALID_BODY_BUFFER])
    expect(() => decodeAX25_Frame(buffer)).toThrow(
      'Unsupported AX.25 frame: destination address must be APCHAT-0. Got N0CALL-0.'
    )
  })

  it('throws error for invalid destination SSID', () => {
    const buffer = new Uint8Array([...APCHAT_BUFFER, SSID_5, ...K6ABC_BUFFER, SSID_5_LAST, ...VALID_BODY_BUFFER])
    expect(() => decodeAX25_Frame(buffer)).toThrow(
      'Unsupported AX.25 frame: destination address must be APCHAT-0. Got APCHAT-5.'
    )
  })

  it('throws error for destination last address bit set', () => {
    const buffer = new Uint8Array([...APCHAT_BUFFER, SSID_0_LAST, ...K6ABC_BUFFER, SSID_5_LAST, ...VALID_BODY_BUFFER])
    expect(() => decodeAX25_Frame(buffer)).toThrow('Invalid AX.25 frame: destination address cannot be last.')
  })

  it('throws error for source last address bit not set', () => {
    const buffer = new Uint8Array([...APCHAT_BUFFER, SSID_0, ...K6ABC_BUFFER, SSID_5, ...VALID_BODY_BUFFER])
    expect(() => decodeAX25_Frame(buffer)).toThrow('Unsupported AX.25 frame: repeaters detected.')
  })

  it('throws error for invalid control field', () => {
    const buffer = new Uint8Array([...VALID_ADDRESS_BUFFER, 0x2f, PID_NO_LAYER_3, ...INFO_BUFFER])
    expect(() => decodeAX25_Frame(buffer)).toThrow(
      'Unsupported AX.25 frame: Control field must be 0x03 (UI frame). Got 0x2f.'
    )
  })

  it('throws error for invalid PID', () => {
    const buffer = new Uint8Array([...VALID_ADDRESS_BUFFER, CONTROL_UI, 0xcc, ...INFO_BUFFER])
    expect(() => decodeAX25_Frame(buffer)).toThrow('Unsupported AX.25 frame: PID must be 0xf0 (no layer 3). Got 0xcc.')
  })
})

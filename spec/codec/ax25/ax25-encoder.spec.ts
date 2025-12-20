import { encodeAX25_Frame } from '@lib/codec/ax25/ax25-encoder'
import { AX25_Callsign, AX25_SSID } from '@lib/codec/ax25'

const CALLSIGN: AX25_Callsign = 'K6ABC'
const SSID: AX25_SSID = 5
const INFO_BUFFER = new TextEncoder().encode('Hello')
const EMPTY_INFO_BUFFER = new Uint8Array([])

const APCHAT_BUFFER = new Uint8Array([0x82, 0xa0, 0x86, 0x90, 0x82, 0xa8])
const K6ABC_BUFFER = new Uint8Array([0x96, 0x6c, 0x82, 0x84, 0x86, 0x40])

const SSID_0 = 0x60 // SSID 0, last address bit = 0
const SSID_5_LAST = 0x6b // SSID 5, last address bit = 1

const CONTROL_UI = 0x03
const PID_NO_LAYER_3 = 0xf0

const ADDRESS_BUFFER = new Uint8Array([...APCHAT_BUFFER, SSID_0, ...K6ABC_BUFFER, SSID_5_LAST])
const BODY_BUFFER = new Uint8Array([CONTROL_UI, PID_NO_LAYER_3, ...INFO_BUFFER])
const EMPTY_BODY_BUFFER = new Uint8Array([CONTROL_UI, PID_NO_LAYER_3, ...EMPTY_INFO_BUFFER])

const FRAME_BUFFER = new Uint8Array([...ADDRESS_BUFFER, ...BODY_BUFFER])
const EMPTY_FRAME_BUFFER = new Uint8Array([...ADDRESS_BUFFER, ...EMPTY_BODY_BUFFER])

describe('encodeAX25_Frame', () => {
  let buffer: Uint8Array

  describe('when encoding a populated frame', () => {
    beforeEach(() => (buffer = encodeAX25_Frame(CALLSIGN, SSID, INFO_BUFFER)))

    it('encodes a frame with correct structure', () => expect(buffer).toEqual(FRAME_BUFFER))

    it('encodes destination as APCHAT-0', () => {
      expect(buffer.slice(0, 6)).toEqual(APCHAT_BUFFER)
      expect(buffer[6]).toBe(SSID_0)
    })

    it('encodes source callsign and SSID', () => {
      expect(buffer.slice(7, 13)).toEqual(K6ABC_BUFFER)
      expect(buffer[13]).toBe(SSID_5_LAST)
    })

    it('encodes control field as UI frame', () => expect(buffer[14]).toBe(CONTROL_UI))
    it('encodes PID as no layer 3', () => expect(buffer[15]).toBe(PID_NO_LAYER_3))
    it('encodes info field', () => expect(buffer.slice(16)).toEqual(INFO_BUFFER))
  })

  describe('when encoding a frame with empty info', () => {
    beforeEach(() => (buffer = encodeAX25_Frame(CALLSIGN, SSID, EMPTY_INFO_BUFFER)))

    it('encodes a frame with correct structure', () => expect(buffer).toEqual(EMPTY_FRAME_BUFFER))

    it('encodes destination as APCHAT-0', () => {
      expect(buffer.slice(0, 6)).toEqual(APCHAT_BUFFER)
      expect(buffer[6]).toBe(SSID_0)
    })

    it('encodes source callsign and SSID', () => {
      expect(buffer.slice(7, 13)).toEqual(K6ABC_BUFFER)
      expect(buffer[13]).toBe(SSID_5_LAST)
    })

    it('encodes control field as UI frame', () => expect(buffer[14]).toBe(CONTROL_UI))
    it('encodes PID as no layer 3', () => expect(buffer[15]).toBe(PID_NO_LAYER_3))
    it('encodes empty info field', () => expect(buffer.slice(16)).toEqual(EMPTY_INFO_BUFFER))
  })

  it('encodes frame with empty info', () => {
    const emptyInfo = new Uint8Array([])
    const buffer = encodeAX25_Frame(CALLSIGN, SSID, emptyInfo)

    expect(buffer.length).toBe(16)
    expect(buffer.slice(16)).toEqual(emptyInfo)
  })
})

import { decodeAX25_Frame } from './ax25-decoder'
import { encodeAX25_Frame } from './ax25-encoder'
import { AX25_Callsign, AX25_SSID } from './ax25-types'

/**
 * AX.25 Frame class (Simplified for PackChat)
 *
 * Represents an AX.25 UI frame for connectionless data transmission.
 *
 * IMPORTANT: This implementation only supports:
 * - UI frames (Control = 0x03)
 * - PID 0xF0 (no layer 3 protocol)
 * - No repeater/digipeater support (local-only communication)
 * - Decoding will throw an error for any other frame types
 *
 * AX.25 UI Frame Format:
 * ╭─────────────┬─────────────┬─────────┬──────┬─────────────╮
 * │ Destination │   Source    │ Control │ PID  │    Info     │
 * ├─────────────┼─────────────┼─────────┼──────┼─────────────┤
 * │   7 bytes   │   7 bytes   │  0x03   │ 0xF0 │ 0-256 bytes │
 * ╰─────────────┴─────────────┴─────────┴──────┴─────────────╯
 *
 * Example usage:
 * const frame = new AX25_Frame('K6ABC', 0 as AX25_SSID, Buffer.from('Hello'))
 * const encoded = frame.encode()
 */
export class AX25_Frame {
  #callsign: AX25_Callsign
  #ssid: AX25_SSID
  #info: Buffer

  constructor(callsign: AX25_Callsign, ssid: AX25_SSID, info: Buffer) {
    this.#callsign = callsign
    this.#ssid = ssid
    this.#info = info
  }

  /** Callsign of the source address */
  get callsign(): AX25_Callsign {
    return this.#callsign
  }

  /** SSID of the source address */
  get ssid(): AX25_SSID {
    return this.#ssid
  }

  /** Information field payload */
  get info(): Buffer {
    return this.#info
  }

  /**
   * Encode this AX.25 UI frame into bytes ready for KISS wrapping
   *
   * @returns Buffer ready to wrap in KISS frame
   */
  encode(): Buffer {
    return encodeAX25_Frame(this.#callsign, this.#ssid, this.#info)
  }

  /**
   * Decode an AX.25 frame from raw bytes
   *
   * Only supports UI frames (0x03) with PID 0xF0.
   * Throws an error for any other frame type.
   *
   * @param buffer Raw AX.25 frame bytes (from KISS)
   * @returns Decoded AX.25 frame
   * @throws Error if not a UI frame with PID 0xF0
   */
  static decode(buffer: Buffer): AX25_Frame {
    return decodeAX25_Frame(buffer)
  }
}

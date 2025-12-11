import { AX25_Callsign, AX25_SSID, AX25_CommandResponse } from './ax25-types'

/**
 * Regex for validating AX.25 callsigns (1-6 alphanumeric characters)
 */
const CALLSIGN_REGEX = /^[A-Z0-9]{1,6}$/

/**
 * AX.25 Address class
 *
 * Represents an AX.25 address (callsign + SSID) with encode/decode capabilities
 *
 * Address Format (7 bytes):
 * ╭─────┬─────┬─────┬─────┬─────┬─────┬─────────────────╮
 * │  0  │  1  │  2  │  3  │  4  │  5  │        6        │
 * ├─────┴─────┴─────┴─────┴─────┴─────┼─────────────────┤
 * │        Callsign (6 bytes)         │   SSID + Flags  │
 * │    (ASCII shifted left 1 bit)     │     (1 byte)    │
 * ╰───────────────────────────────────┴─────────────────╯
 *
 * Byte 6 (SSID byte):
 * ╭───┬───┬───┬───┬───┬───┬───┬───╮
 * │ 7 │ 6 │ 5 │ 4 │ 3 │ 2 │ 1 │ 0 │  Bit position
 * ├───┼───┼───┼───┴───┴───┴───┼───┤
 * │ C │ R │ R │     SSID      │ E │
 * │ / │ e │ e │   (4 bits)    │ x │
 * │ R │ s │ s │               │ t │
 * ╰───┴───┴───┴───────────────┴───╯
 *
 * Example:
 * const addr = new AX25_Address('K6ABC', 5, false CommandResponse.COMMAND)
 * const bytes = addr.encode(true)  // Last address in frame
 */
export class AX25_Address {
  #callsign: AX25_Callsign
  #ssid: AX25_SSID
  #commandResponse: AX25_CommandResponse
  #extensionBit: boolean

  /**
   * Create an AX.25 address
   *
   * @param callsign Callsign (up to 6 characters, e.g., "K6ABC")
   * @param ssid Secondary Station Identifier (0-15)
   * @param commandResponse Command/Response
   */
  constructor(callsign: AX25_Callsign, ssid: AX25_SSID, commandResponse: AX25_CommandResponse, extensionBit: boolean) {
    // Validate callsign
    const valid = CALLSIGN_REGEX.test(callsign)
    if (!valid) throw new Error(`Callsign must be 1-6 alphanumeric and uppercase characters. Got ${callsign}`)

    // Assign properties
    this.#callsign = callsign
    this.#ssid = ssid
    this.#commandResponse = commandResponse
    this.#extensionBit = extensionBit
  }

  /** Callsign (1-6 uppercase alphanumeric characters) */
  get callsign(): AX25_Callsign {
    return this.#callsign
  }

  /** Secondary Station Identifier (0-15) */
  get ssid(): AX25_SSID {
    return this.#ssid
  }

  /** Command/Response */
  get commandResponse(): AX25_CommandResponse {
    return this.#commandResponse
  }

  /** Extension bit (0 = more addresses follow, 1 = last address) */
  get extensionBit(): boolean {
    return this.#extensionBit
  }

  /**
   * Encode this address into 7 bytes
   *
   * @returns 7-byte buffer
   */
  encode(): Buffer {
    // addresses are always 7 bytes
    const buffer = Buffer.alloc(7)

    // left-justified, space-padded callsign
    const paddedCallsign = this.callsign.padEnd(6, ' ')

    // Encode callsign by shifting each byte left 1 bit
    for (let i = 0; i < paddedCallsign.length; i++) {
      buffer[i] = paddedCallsign.charCodeAt(i) << 1
    }

    // Encode SSID byte
    let ssidByte = 0b0000000

    ssidByte |= this.extensionBit ? 0b00000001 : 0b00000000
    ssidByte |= this.ssid << 1
    ssidByte |= 0b01100000
    ssidByte |= this.commandResponse << 7

    buffer[6] = ssidByte

    // Return encoded buffer
    return buffer
  }

  /**
   * Decode an AX.25 address from 7 bytes
   *
   * @param buffer Buffer containing address data
   * @param offset Offset to start reading from (defaults to 0)
   * @returns Decoded AX25_Address instance
   */
  static decode(buffer: Buffer): AX25_Address {
    // Validate buffer size
    if (buffer.length < 7) throw new Error(`Buffer must be at least 7 bytes. Got ${buffer.length}`)

    // Decode callsign (bytes 0-5, shifted right 1 bit, trim spaces)
    let callsign = ''
    for (let i = 0; i < 6; i++) {
      callsign += String.fromCharCode(buffer[i] >> 1)
    }

    // Trim callsign
    const trimmedCallsign = callsign.trim()

    // Decode SSID byte
    const ssidByte = buffer[6]

    const extensionBit = (ssidByte & 0b00000001) !== 0 // Bit 0
    const ssid = ((ssidByte & 0b00011110) >> 1) as AX25_SSID // Bits 1-4
    const commandResponseBit = (ssidByte & 0b10000000) !== 0 // Bit 7
    const commandResponse = commandResponseBit ? AX25_CommandResponse.RESPONSE : AX25_CommandResponse.COMMAND

    // Create instance
    return new AX25_Address(trimmedCallsign, ssid, commandResponse, extensionBit)
  }
}
